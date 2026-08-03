import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hashIngestionToken, normalizeHealthExport } from "@/lib/healthIngestion";

/** Shared authenticated writer for Apple Health and the native iOS Shortcut. */
export async function ingestHealthWebhook(request: Request, provider: "apple_health" | "apple_shortcut" | "manual_upload", authenticatedUserId?: string) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!authenticatedUserId && (!token || token.length < 20)) return NextResponse.json({ error: "Bearer ingestion token required" }, { status: 401 });
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 5_000_000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Malformed JSON" }, { status: 400 }); }
  let normalized;
  try { normalized = normalizeHealthExport(body); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unsupported payload" }, { status: 422 }); }

  const db = createAdminSupabaseClient();
  let userId = authenticatedUserId;
  if (!userId) {
    // Tokens are created for the connection, so the same token can be used by either bridge.
    const { data: connection } = await db.from("health_connections").select("user_id").eq("provider", "apple_health").eq("ingestion_token_hash", hashIngestionToken(token!)).maybeSingle();
    if (!connection) return NextResponse.json({ error: "Invalid ingestion token" }, { status: 401 });
    userId = connection.user_id;
  }
  const { data: existingWorkouts } = await db.from("workouts").select("id,provider,provider_record_id,workout_type,started_at,ended_at,duration_seconds,energy_kcal,distance_km,heart_rate_avg_bpm,heart_rate_min_bpm,heart_rate_max_bpm,source_references,raw_payload").eq("user_id", userId).order("started_at", { ascending: false }).limit(1000);
  const workoutRows = deduplicateWorkouts(normalized.workouts, existingWorkouts ?? [], userId!, provider);
  const sleepRows = normalized.sleep.map((s) => ({ user_id: userId, provider, provider_record_id: s.providerRecordId, sleep_date: s.sleepDate, started_at: s.startedAt, ended_at: s.endedAt, asleep_seconds: s.asleepSeconds, in_bed_seconds: s.inBedSeconds, core_seconds: s.coreSeconds, deep_seconds: s.deepSeconds, rem_seconds: s.remSeconds, efficiency: s.efficiency, raw_payload: s.raw }));
  const metricRows = normalized.metrics.map((m) => ({ user_id: userId, provider, provider_record_id: m.providerRecordId, metric_type: m.metricType, recorded_at: m.recordedAt, value: m.value, unit: m.unit, raw_payload: m.raw }));

  for (const [table, rows] of [["workouts", workoutRows], ["sleep_sessions", sleepRows], ["health_metric_samples", metricRows]] as const) {
    if (!rows.length) continue;
    const { error } = await db.from(table).upsert(rows, { onConflict: "user_id,provider,provider_record_id" });
    if (error) {
      await db.from("health_connections").update({ last_error: error.message, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("provider", "apple_health");
      return NextResponse.json({ error: "Could not store health data" }, { status: 500 });
    }
  }
  await db.from("health_connections").update({ last_successful_sync: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("provider", "apple_health");
  return NextResponse.json({ ok: true, imported: { workouts: workoutRows.length, sleep: sleepRows.length, metrics: metricRows.length }, provider });
}

type ExistingWorkout = {
  id: string; provider: string; provider_record_id: string; workout_type: string;
  started_at: string; ended_at: string; duration_seconds: number | null;
  energy_kcal: number | null; distance_km: number | null; heart_rate_avg_bpm: number | null;
  heart_rate_min_bpm: number | null; heart_rate_max_bpm: number | null;
  source_references: unknown; raw_payload: unknown;
};

const workoutTypeKey = (value: string) => {
  const normalized = value.toLowerCase().replace(/[^a-z]/g, "");
  if (/cycle|bike/.test(normalized)) return "cycling";
  if (/run|jog/.test(normalized)) return "running";
  if (/walk|hike/.test(normalized)) return "walking";
  if (/strength|weight|resistance|traditional/.test(normalized)) return "strength";
  return normalized;
};
const minutesBetween = (a: string, b: string) => Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 60000;

function looksLikeDuplicate(a: { workoutType: string; startedAt: string; endedAt: string; durationSeconds: number | null }, b: ExistingWorkout) {
  if (workoutTypeKey(a.workoutType) !== workoutTypeKey(b.workout_type)) return false;
  const startGap = minutesBetween(a.startedAt, b.started_at);
  const endGap = minutesBetween(a.endedAt, b.ended_at);
  const durationGap = a.durationSeconds == null || b.duration_seconds == null
    ? null
    : Math.abs(a.durationSeconds - b.duration_seconds) / 60;
  // JEFIT and Apple Watch often report the same session with slightly different
  // boundaries. Requiring a close start prevents merging separate workouts.
  return startGap <= 10 && (endGap <= 15 || (durationGap !== null && durationGap <= 15));
}

function sourceReference(workout: { providerRecordId: string; workoutType: string; startedAt: string; endedAt: string; durationSeconds: number | null }, provider: string) {
  return { provider, providerRecordId: workout.providerRecordId, workoutType: workout.workoutType, startedAt: workout.startedAt, endedAt: workout.endedAt, durationSeconds: workout.durationSeconds };
}

function deduplicateWorkouts(workouts: ReturnType<typeof normalizeHealthExport>["workouts"], existing: ExistingWorkout[], userId: string, provider: string) {
  const rows: Array<Record<string, unknown>> = [];
  for (const workout of workouts) {
    const match = [...existing, ...rows.map((row) => row as ExistingWorkout)].find((candidate) => looksLikeDuplicate(workout, candidate));
    const reference = sourceReference(workout, provider);
    if (match) {
      const incomingIsRicher = (workout.energyKcal !== null ? 1 : 0) + (workout.distanceKm !== null ? 1 : 0) + (workout.heartRateAvgBpm !== null ? 1 : 0) >
        (match.energy_kcal !== null ? 1 : 0) + (match.distance_km !== null ? 1 : 0) + (match.heart_rate_avg_bpm !== null ? 1 : 0);
      const references = Array.isArray(match.source_references) ? match.source_references : [];
      const mergedReferences = [...references, reference].filter((item, index, all) => all.findIndex((other) => JSON.stringify(other) === JSON.stringify(item)) === index);
      const row = { user_id: userId, provider: match.provider, provider_record_id: match.provider_record_id, workout_type: match.workout_type, started_at: match.started_at, ended_at: match.ended_at, duration_seconds: Math.max(match.duration_seconds ?? 0, workout.durationSeconds ?? 0) || null, energy_kcal: workout.energyKcal ?? match.energy_kcal, distance_km: workout.distanceKm ?? match.distance_km, heart_rate_avg_bpm: workout.heartRateAvgBpm ?? match.heart_rate_avg_bpm, heart_rate_min_bpm: workout.heartRateMinBpm ?? match.heart_rate_min_bpm, heart_rate_max_bpm: workout.heartRateMaxBpm ?? match.heart_rate_max_bpm, source_references: mergedReferences, raw_payload: incomingIsRicher ? workout.raw : match.raw_payload };
      const existingRowIndex = rows.findIndex((candidate) => candidate.provider === match.provider && candidate.provider_record_id === match.provider_record_id);
      if (existingRowIndex >= 0) rows[existingRowIndex] = row;
      else rows.push(row);
      continue;
    }
    rows.push({ user_id: userId, provider, provider_record_id: workout.providerRecordId, workout_type: workout.workoutType, started_at: workout.startedAt, ended_at: workout.endedAt, duration_seconds: workout.durationSeconds, energy_kcal: workout.energyKcal, distance_km: workout.distanceKm, heart_rate_avg_bpm: workout.heartRateAvgBpm, heart_rate_min_bpm: workout.heartRateMinBpm, heart_rate_max_bpm: workout.heartRateMaxBpm, source_references: [reference], raw_payload: workout.raw });
  }
  return rows;
}

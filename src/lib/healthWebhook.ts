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
  const workoutRows = normalized.workouts.map((w) => ({ user_id: userId, provider, provider_record_id: w.providerRecordId, workout_type: w.workoutType, started_at: w.startedAt, ended_at: w.endedAt, duration_seconds: w.durationSeconds, energy_kcal: w.energyKcal, distance_km: w.distanceKm, heart_rate_avg_bpm: w.heartRateAvgBpm, heart_rate_min_bpm: w.heartRateMinBpm, heart_rate_max_bpm: w.heartRateMaxBpm, raw_payload: w.raw }));
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

import crypto from "node:crypto";

export type NormalizedWorkout = {
  providerRecordId: string; workoutType: string; startedAt: string; endedAt: string;
  durationSeconds: number | null; energyKcal: number | null; distanceKm: number | null;
  heartRateAvgBpm: number | null; heartRateMinBpm: number | null; heartRateMaxBpm: number | null; raw: unknown;
};
export type NormalizedSleep = {
  providerRecordId: string; sleepDate: string; startedAt: string; endedAt: string;
  asleepSeconds: number | null; inBedSeconds: number | null; coreSeconds: number | null; deepSeconds: number | null; remSeconds: number | null; efficiency: number | null; raw: unknown;
};
export type NormalizedMetric = { providerRecordId: string; metricType: string; recordedAt: string; value: number; unit: string; raw: unknown };

const n = (v: unknown): number | null => typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && Number.isFinite(Number(v)) ? Number(v) : null;
const first = (o: Record<string, unknown>, ...keys: string[]) => keys.map((k) => o[k]).find((v) => v !== undefined && v !== null);
const iso = (v: unknown) => { const d = new Date(String(v)); return Number.isNaN(d.getTime()) ? null : d.toISOString(); };
const seconds = (v: unknown) => { const value = n(v); return value === null ? null : value > 10000 ? Math.round(value / 1000) : Math.round(value); };
const array = (payload: unknown, ...keys: string[]): unknown[] => { if (Array.isArray(payload)) return payload as unknown[]; if (!payload || typeof payload !== "object") return []; const o = payload as Record<string, unknown>; for (const k of keys) { if (Array.isArray(o[k])) return o[k] as unknown[]; if (o.data && typeof o.data === "object" && !Array.isArray(o.data) && Array.isArray((o.data as Record<string, unknown>)[k])) return (o.data as Record<string, unknown>)[k] as unknown[]; } return []; };

export function hashIngestionToken(token: string) { return crypto.createHash("sha256").update(token).digest("hex"); }
export function generateIngestionToken() { return `sfo_${crypto.randomBytes(32).toString("base64url")}`; }

export function normalizeHealthExport(payload: unknown) {
  const workouts: NormalizedWorkout[] = [], sleep: NormalizedSleep[] = [], metrics: NormalizedMetric[] = [];
  for (const item of array(payload, "workouts", "Workout", "data")) {
    if (!item || typeof item !== "object") continue; const o = item as Record<string, unknown>;
    const start = iso(first(o, "startDate", "start", "startTime")), end = iso(first(o, "endDate", "end", "endTime"));
    if (!start || !end) continue;
    const id = String(first(o, "id", "uuid", "workoutId") ?? `${start}:${end}:${first(o, "workoutActivityType", "type", "name") ?? "workout"}`);
    const hr = (first(o, "heartRate", "heartRateSummary") as Record<string, unknown> | undefined) ?? {};
    workouts.push({ providerRecordId: id, workoutType: String(first(o, "workoutActivityType", "type", "name") ?? "Other"), startedAt: start, endedAt: end, durationSeconds: seconds(first(o, "duration", "durationSeconds")), energyKcal: n(first(o, "totalEnergyBurned", "energyKcal", "calories")), distanceKm: (n(first(o, "totalDistance", "distanceKm", "distance")) ?? 0) > 100 ? (n(first(o, "totalDistance", "distanceKm", "distance"))! / 1000) : n(first(o, "totalDistance", "distanceKm", "distance")), heartRateAvgBpm: n(first(hr, "average", "avg", "averageBpm")), heartRateMinBpm: n(first(hr, "min", "minimum")), heartRateMaxBpm: n(first(hr, "max", "maximum")), raw: item });
  }
  for (const item of array(payload, "sleep", "sleepAnalysis", "sleepSessions")) {
    if (!item || typeof item !== "object") continue; const o = item as Record<string, unknown>;
    const start = iso(first(o, "startDate", "start", "startTime")), end = iso(first(o, "endDate", "end", "endTime")); if (!start || !end) continue;
    const id = String(first(o, "id", "uuid", "sleepId") ?? `${start}:${end}`); const stages = (first(o, "stages", "sleepStages") as Record<string, unknown> | undefined) ?? {};
    const asleep = seconds(first(o, "asleepDuration", "asleepSeconds", "duration"));
    sleep.push({ providerRecordId: id, sleepDate: start.slice(0, 10), startedAt: start, endedAt: end, asleepSeconds: asleep, inBedSeconds: seconds(first(o, "inBedDuration", "inBedSeconds")) ?? Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000), coreSeconds: seconds(first(stages, "core", "Core")), deepSeconds: seconds(first(stages, "deep", "Deep")), remSeconds: seconds(first(stages, "rem", "REM")), efficiency: n(first(o, "efficiency")), raw: item });
  }
  const metricItems = array(payload, "metrics", "healthMetrics", "samples");
  // HAE may group samples as { name, units, data: [{date,value}] }.
  const metricGroups = metricItems.flatMap((item): unknown[] => { if (!item || typeof item !== "object") return [item]; const record = item as Record<string, unknown>; const samples = record.data; if (!Array.isArray(samples)) return [item]; return samples.map((sample) => ({ ...(sample as Record<string, unknown>), name: record.name, unit: record.unit ?? record.units })); });
  for (const item of metricGroups) {
    if (!item || typeof item !== "object") continue; const o = item as Record<string, unknown>; const at = iso(first(o, "date", "timestamp", "startDate", "recordedAt")); const value = n(first(o, "value", "quantity", "average")); if (!at || value === null) continue;
    const original = String(first(o, "type", "name", "metricType") ?? "").toLowerCase().replace(/[^a-z]/g, "");
    const metricType = original.includes("bodymass") || original.includes("weight") ? "weight" : original.includes("restingheartrate") ? "resting_heart_rate" : original.includes("heartratevariability") || original.includes("hrv") ? "hrv" : original.includes("step") ? "steps" : original.includes("activeenergy") || original.includes("energy") ? "active_energy" : original.includes("respiratory") ? "respiratory_rate" : original.includes("oxygen") || original.includes("spo2") ? "spo2" : original;
    if (!["weight", "resting_heart_rate", "hrv", "steps", "active_energy", "respiratory_rate", "spo2"].includes(metricType)) continue;
    const unit = String(first(o, "unit", "units") ?? (metricType === "weight" ? "kg" : metricType === "hrv" ? "ms" : metricType === "steps" ? "count" : metricType === "active_energy" ? "kcal" : metricType === "spo2" ? "%" : "bpm"));
    let normalized = value; if (metricType === "weight" && /lb/i.test(unit)) normalized = value * 0.45359237; if (metricType === "distance" && /m/i.test(unit)) normalized = value / 1000;
    metrics.push({ providerRecordId: String(first(o, "id", "uuid", "sampleId") ?? `${metricType}:${at}:${value}`), metricType, recordedAt: at, value: normalized, unit: metricType === "weight" ? "kg" : unit, raw: item });
  }
  if (workouts.length + sleep.length + metrics.length === 0) throw new Error("No supported Health Auto Export records found");
  return { workouts, sleep, metrics };
}

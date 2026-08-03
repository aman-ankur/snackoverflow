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
const quantity = (v: unknown): number | null => {
  const direct = n(v);
  if (direct !== null) return direct;
  if (Array.isArray(v)) {
    const values = v.map(quantity).filter((value): value is number => value !== null);
    return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
  }
  if (v && typeof v === "object") {
    const record = v as Record<string, unknown>;
    return n(record.qty) ?? n(record.value) ?? n(record.quantity);
  }
  return null;
};
const quantityUnit = (v: unknown) => v && typeof v === "object" && !Array.isArray(v) ? String((v as Record<string, unknown>).units ?? (v as Record<string, unknown>).unit ?? "") : "";
const iso = (v: unknown) => { const d = new Date(String(v)); return Number.isNaN(d.getTime()) ? null : d.toISOString(); };
const seconds = (v: unknown) => { const value = n(v); return value === null ? null : value > 10000 ? Math.round(value / 1000) : Math.round(value); };
const hoursToSeconds = (v: unknown) => { const value = n(v); return value === null ? null : Math.round(value * 3600); };
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
    const energy = first(o, "activeEnergyBurned", "activeEnergy", "totalEnergyBurned", "totalEnergy", "energyKcal", "calories");
    const distance = (first(o, "distance", "totalDistance", "distanceKm") as Record<string, unknown> | undefined);
    const heartRateData = Array.isArray(o.heartRateData) ? o.heartRateData[0] as Record<string, unknown> : {};
    const rawDistance = n(distance ? first(distance, "qty", "value") : first(o, "totalDistance", "distanceKm"));
    const distanceUnits = String(distance ? first(distance, "units", "unit") ?? "" : "");
    const energyValue = quantity(energy);
    const energyUnits = quantityUnit(energy);
    const energyKcal = energyValue === null ? null : /kj|kilojoule/i.test(energyUnits) ? energyValue / 4.184 : energyValue;
    const heartRateAverage = first(hr, "average", "avg", "averageBpm", "avgHeartRate") ?? first(o, "avgHeartRate", "averageHeartRate");
    const heartRateMin = first(hr, "min", "minimum") ?? first(o, "minHeartRate", "minimumHeartRate");
    const heartRateMax = first(hr, "max", "maximum") ?? first(o, "maxHeartRate", "maximumHeartRate");
    workouts.push({ providerRecordId: id, workoutType: String(first(o, "workoutActivityType", "type", "name") ?? "Other"), startedAt: start, endedAt: end, durationSeconds: seconds(first(o, "duration", "durationSeconds")), energyKcal, distanceKm: rawDistance === null ? null : /mi|mile/i.test(distanceUnits) ? rawDistance * 1.609344 : /^(m|meter|meters)$/i.test(distanceUnits) ? rawDistance / 1000 : rawDistance > 100 ? rawDistance / 1000 : rawDistance, heartRateAvgBpm: quantity(heartRateAverage) ?? n(first(heartRateData, "Avg", "average", "avg")), heartRateMinBpm: quantity(heartRateMin) ?? n(first(heartRateData, "Min", "minimum")), heartRateMaxBpm: quantity(heartRateMax) ?? n(first(heartRateData, "Max", "maximum")), raw: item });
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
    if (!item || typeof item !== "object") continue; const o = item as Record<string, unknown>; const original = String(first(o, "type", "name", "metricType") ?? "").toLowerCase().replace(/[^a-z]/g, "");
    if (original === "sleepanalysis") {
      const sleepDate = String(first(o, "date") ?? "").slice(0, 10); const asleepSeconds = hoursToSeconds(first(o, "asleep", "totalSleep")); const inBedSeconds = hoursToSeconds(first(o, "inBed")) ?? asleepSeconds;
      const sleepStart = iso(first(o, "sleepStart", "inBedStart", "startDate")) ?? (sleepDate ? `${sleepDate}T00:00:00.000Z` : null);
      const sleepEnd = iso(first(o, "sleepEnd", "inBedEnd", "endDate")) ?? (sleepStart && inBedSeconds !== null ? new Date(new Date(sleepStart).getTime() + inBedSeconds * 1000).toISOString() : null);
      if (sleepStart && sleepEnd) sleep.push({ providerRecordId: String(first(o, "id", "sleepId") ?? `sleep:${sleepDate || sleepStart}:${sleepEnd}`), sleepDate: sleepDate || sleepStart.slice(0, 10), startedAt: sleepStart, endedAt: sleepEnd, asleepSeconds, inBedSeconds, coreSeconds: hoursToSeconds(first(o, "core")), deepSeconds: hoursToSeconds(first(o, "deep")), remSeconds: hoursToSeconds(first(o, "rem")), efficiency: null, raw: item });
      continue;
    }
    const at = iso(first(o, "date", "timestamp", "startDate", "recordedAt")); const value = n(first(o, "value", "quantity", "average", "qty", "Avg")); if (!at || value === null) continue;
    const metricType = original.includes("bodymass") || original.includes("weight") ? "weight" : original.includes("restingheartrate") ? "resting_heart_rate" : original.includes("heartratevariability") || original.includes("hrv") ? "hrv" : original.includes("step") ? "steps" : original.includes("activeenergy") || original.includes("energy") ? "active_energy" : original.includes("respiratory") ? "respiratory_rate" : original.includes("oxygen") || original.includes("spo2") ? "spo2" : original;
    if (!["weight", "resting_heart_rate", "hrv", "steps", "active_energy", "respiratory_rate", "spo2"].includes(metricType)) continue;
    const unit = String(first(o, "unit", "units") ?? (metricType === "weight" ? "kg" : metricType === "hrv" ? "ms" : metricType === "steps" ? "count" : metricType === "active_energy" ? "kcal" : metricType === "spo2" ? "%" : "bpm"));
    let normalized = value; if (metricType === "weight" && /lb/i.test(unit)) normalized = value * 0.45359237; if (metricType === "distance" && /m/i.test(unit)) normalized = value / 1000;
    metrics.push({ providerRecordId: String(first(o, "id", "uuid", "sampleId") ?? `${metricType}:${at}:${value}`), metricType, recordedAt: at, value: normalized, unit: metricType === "weight" ? "kg" : unit, raw: item });
  }
  if (workouts.length + sleep.length + metrics.length === 0) throw new Error("No supported Health Auto Export records found");
  return { workouts, sleep, metrics };
}

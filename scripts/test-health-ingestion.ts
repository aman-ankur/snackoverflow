import assert from "node:assert/strict";
import { normalizeHealthExport } from "../src/lib/healthIngestion";

const grouped = normalizeHealthExport({ data: [{ name: "sleep_analysis", units: "hours", data: [{ date: "2026-02-28", asleep: 7.5, core: 4, deep: 1.5, rem: 2 }] }] });
assert.equal(grouped.sleep.length, 1);
assert.equal(grouped.sleep[0].asleepSeconds, 27000);
assert.equal(grouped.sleep[0].deepSeconds, 5400);
assert.equal(grouped.sleep[0].sleepDate, "2026-02-28");

const seconds = normalizeHealthExport({ sleepSessions: [{ id: "session-1", startDate: "2026-02-27T22:00:00Z", endDate: "2026-02-28T06:00:00Z", asleepSeconds: 25200 }] });
assert.equal(seconds.sleep[0].asleepSeconds, 25200);
assert.equal(seconds.sleep[0].sleepDate, "2026-02-27");

const zeroDuration = normalizeHealthExport({ sleepSessions: [{ id: "session-zero", startDate: "2026-08-02T01:02:00Z", endDate: "2026-08-02T08:45:00Z", asleepSeconds: 0 }] });
assert.equal(zeroDuration.sleep[0].asleepSeconds, 27780);

const appleHealth = normalizeHealthExport({ data: [{ name: "sleep_analysis", unit: "hr", data: [{ date: "2026-08-02 00:00:00 +0530", rem: 1.8512116011314923, core: 4.574061412645711, deep: 1.153890116777685, awake: 0.1494282830423779, inBed: 0, asleep: 0, totalSleep: 7.579163130554888, inBedStart: "2026-08-02 01:02:01 +0530", inBedEnd: "2026-08-02 08:45:44 +0530", sleepStart: "2026-08-02 01:02:01 +0530", sleepEnd: "2026-08-02 08:45:44 +0530" }] }] });
assert.equal(appleHealth.sleep[0].asleepSeconds, 27285);
assert.equal(appleHealth.sleep[0].inBedSeconds, 27823);

const stagesOnly = normalizeHealthExport({ data: [{ name: "sleep_analysis", units: "hours", data: [{ date: "2026-02-28", core: 4, deep: 1, rem: 2 }] }] });
assert.equal(stagesOnly.sleep[0].asleepSeconds, 25200);

const incomplete = normalizeHealthExport({ data: [{ name: "sleep_analysis", units: "hours", data: [{ date: "2026-02-28", inBed: 8 }] }] });
assert.equal(incomplete.sleep[0].asleepSeconds, null);
assert.equal(incomplete.sleep[0].inBedSeconds, 28800);

assert.deepEqual(grouped.sleep[0].raw, { asleep: 7.5, core: 4, deep: 1.5, rem: 2, date: "2026-02-28", name: "sleep_analysis", unit: "hours" });
console.log("health ingestion fixtures passed");

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

const stagesOnly = normalizeHealthExport({ data: [{ name: "sleep_analysis", units: "hours", data: [{ date: "2026-02-28", core: 4, deep: 1, rem: 2 }] }] });
assert.equal(stagesOnly.sleep[0].asleepSeconds, 25200);

const incomplete = normalizeHealthExport({ data: [{ name: "sleep_analysis", units: "hours", data: [{ date: "2026-02-28", inBed: 8 }] }] });
assert.equal(incomplete.sleep[0].asleepSeconds, null);
assert.equal(incomplete.sleep[0].inBedSeconds, 28800);

assert.deepEqual(grouped.sleep[0].raw, { asleep: 7.5, core: 4, deep: 1.5, rem: 2, date: "2026-02-28", name: "sleep_analysis", unit: "hours" });
console.log("health ingestion fixtures passed");

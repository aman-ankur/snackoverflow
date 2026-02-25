import type { GardenState, GardenEvent } from "@/lib/useGardenState";

/**
 * Merge two arrays by unique ID. If the same ID exists in both,
 * keep the one with the newer timestamp.
 */
export function mergeArrayById<T>(
  local: T[],
  cloud: T[],
  getId: (item: T) => string,
  getTimestamp: (item: T) => string
): T[] {
  const map = new Map<string, T>();

  for (const item of local) {
    map.set(getId(item), item);
  }

  for (const item of cloud) {
    const id = getId(item);
    const existing = map.get(id);
    if (!existing) {
      map.set(id, item);
    } else {
      // Same ID in both — keep newer
      const existingTs = getTimestamp(existing);
      const incomingTs = getTimestamp(item);
      if (incomingTs > existingTs) {
        map.set(id, item);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Merge two objects by comparing timestamps. The one with the newer
 * timestamp wins. Handles missing timestamps gracefully.
 */
export function mergeObject<T>(
  local: T | null,
  cloud: T | null,
  getUpdatedAt: (obj: T) => string | undefined
): T | null {
  if (!local && !cloud) return null;
  if (!local) return cloud;
  if (!cloud) return local;

  const localTs = getUpdatedAt(local) ?? "";
  const cloudTs = getUpdatedAt(cloud) ?? "";

  // If both have timestamps, newer wins
  if (localTs && cloudTs) {
    return cloudTs > localTs ? cloud : local;
  }
  // If only one has a timestamp, prefer the one that does
  if (cloudTs && !localTs) return cloud;
  if (localTs && !cloudTs) return local;

  // Neither has a timestamp — prefer cloud (existing behavior)
  return cloud;
}

/**
 * Custom merge for GardenState:
 * - Monotonic counters: take max()
 * - Streak-dependent fields: use lastComputedDate to pick newer
 * - Journal: merge by ID
 */
export function mergeGarden(
  local: GardenState,
  cloud: GardenState
): GardenState {
  // Merge journal entries by ID
  const journalMap = new Map<string, GardenEvent>();
  for (const e of local.journal) journalMap.set(e.id, e);
  for (const e of cloud.journal) journalMap.set(e.id, e);
  const mergedJournal = Array.from(journalMap.values())
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, 20);

  // Determine which has the more recent computation for streak-dependent fields
  const localNewer = local.lastComputedDate >= cloud.lastComputedDate;
  const newer = localNewer ? local : cloud;

  return {
    // Monotonic counters — always take max
    flowers: Math.max(local.flowers, cloud.flowers),
    daysGoalHit: Math.max(local.daysGoalHit, cloud.daysGoalHit),
    totalMealsLogged: Math.max(local.totalMealsLogged, cloud.totalMealsLogged),
    babyCapybaras: Math.max(local.babyCapybaras, cloud.babyCapybaras),
    homeLevel: Math.max(local.homeLevel, cloud.homeLevel),
    gardenHealth: Math.max(local.gardenHealth, cloud.gardenHealth),

    // Streak-dependent (disappear when streak resets) — use newer computation
    treeLevel: newer.treeLevel,
    pondLevel: newer.pondLevel,
    butterflies: newer.butterflies,
    hasRainbow: newer.hasRainbow,
    hasCrown: newer.hasCrown,

    lastComputedDate: local.lastComputedDate > cloud.lastComputedDate
      ? local.lastComputedDate
      : cloud.lastComputedDate,

    journal: mergedJournal,
  };
}

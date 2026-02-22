import { createClient } from "./client";

export type SyncDomain =
  | "profile"
  | "goals"
  | "streak"
  | "meals"
  | "garden"
  | "expiry_tracker"
  | "fridge_scans"
  | "meal_planner"
  | "health_profile";

export interface UserDataRow {
  id: string;
  profile: unknown;
  goals: unknown;
  streak: unknown;
  meals: unknown;
  garden: unknown;
  expiry_tracker: unknown;
  fridge_scans: unknown;
  meal_planner: unknown;
  health_profile: unknown;
  updated_at: string;
}

// Debounce timers per domain
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const DEBOUNCE_MS = 800;

/**
 * Pull the entire user_data row for the current user.
 * Returns null if no row exists or user is not logged in.
 */
export async function pullUserData(
  userId: string
): Promise<UserDataRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_data")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as UserDataRow;
}

/**
 * Push a single domain's data to Supabase (debounced).
 */
export function pushUserData(
  userId: string,
  domain: SyncDomain,
  value: unknown
): void {
  const key = `${userId}:${domain}`;

  const existing = timers.get(key);
  if (existing) clearTimeout(existing);

  timers.set(
    key,
    setTimeout(async () => {
      timers.delete(key);
      const supabase = createClient();
      await supabase
        .from("user_data")
        .upsert(
          { id: userId, [domain]: value, updated_at: new Date().toISOString() },
          { onConflict: "id" }
        );
    }, DEBOUNCE_MS)
  );
}

/**
 * Push multiple domains at once (immediate, no debounce).
 * Used for first-login migration.
 */
export async function pushAllUserData(
  userId: string,
  data: Partial<Record<SyncDomain, unknown>>
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("user_data")
    .upsert(
      { id: userId, ...data, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
}

/**
 * Migrate localStorage data to Supabase on first login.
 * Only pushes if the cloud row is empty (all nulls / empty arrays).
 */
export async function migrateLocalStorageToCloud(
  userId: string
): Promise<void> {
  const cloud = await pullUserData(userId);

  // Check if cloud already has meaningful data
  const hasCloudData =
    cloud &&
    (cloud.profile !== null ||
      (Array.isArray(cloud.meals) && (cloud.meals as unknown[]).length > 0));

  if (hasCloudData) return; // Cloud already has data, don't overwrite

  // Gather all localStorage data
  const localData: Partial<Record<SyncDomain, unknown>> = {};

  try {
    const goalsRaw = localStorage.getItem("snackoverflow-user-goals-v1");
    if (goalsRaw) {
      const parsed = JSON.parse(goalsRaw);
      if (parsed.profile) localData.profile = parsed.profile;
      if (parsed.goals) localData.goals = parsed.goals;
      if (parsed.streak) localData.streak = parsed.streak;
    }
  } catch { /* ignore */ }

  try {
    const mealsRaw = localStorage.getItem("snackoverflow-meal-log-v1");
    if (mealsRaw) {
      const parsed = JSON.parse(mealsRaw);
      if (Array.isArray(parsed) && parsed.length > 0) localData.meals = parsed;
    }
  } catch { /* ignore */ }

  try {
    const gardenRaw = localStorage.getItem("snackoverflow-garden-v1");
    if (gardenRaw) localData.garden = JSON.parse(gardenRaw);
  } catch { /* ignore */ }

  try {
    const expiryRaw = localStorage.getItem("snackoverflow-expiry-tracker");
    if (expiryRaw) {
      const parsed = JSON.parse(expiryRaw);
      if (Array.isArray(parsed) && parsed.length > 0)
        localData.expiry_tracker = parsed;
    }
  } catch { /* ignore */ }

  try {
    const fridgeRaw = localStorage.getItem("snackoverflow-fridge-scan-history");
    if (fridgeRaw) {
      const parsed = JSON.parse(fridgeRaw);
      if (Array.isArray(parsed) && parsed.length > 0)
        localData.fridge_scans = parsed;
    }
  } catch { /* ignore */ }

  try {
    const plannerRaw = localStorage.getItem("snackoverflow-meal-planner");
    if (plannerRaw) localData.meal_planner = JSON.parse(plannerRaw);
  } catch { /* ignore */ }

  try {
    const healthRaw = localStorage.getItem("snackoverflow-health-profile-v1");
    if (healthRaw) localData.health_profile = JSON.parse(healthRaw);
  } catch { /* ignore */ }

  if (Object.keys(localData).length > 0) {
    await pushAllUserData(userId, localData);
  }
}

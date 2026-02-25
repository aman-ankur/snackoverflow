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
  | "health_profile"
  | "meal_analyses";

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
  meal_analyses: unknown;
  updated_at: string;
}

// Debounce timers per domain
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingPayloads = new Map<string, { userId: string; domain: SyncDomain; value: unknown }>();
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

  pendingPayloads.set(key, { userId, domain, value });

  timers.set(
    key,
    setTimeout(async () => {
      timers.delete(key);
      pendingPayloads.delete(key);
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
 * Flush all pending debounced pushes immediately.
 * Call on beforeunload / visibilitychange to avoid data loss.
 */
export function flushPendingPushes(): void {
  if (pendingPayloads.size === 0) return;

  for (const [key, { userId, domain, value }] of pendingPayloads) {
    const timer = timers.get(key);
    if (timer) clearTimeout(timer);
    timers.delete(key);

    const supabase = createClient();
    // Use sendBeacon-friendly fetch via keepalive where possible
    supabase
      .from("user_data")
      .upsert(
        { id: userId, [domain]: value, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      )
      .then(() => {});
  }
  pendingPayloads.clear();
}

/**
 * Push multiple domains at once (immediate, no debounce).
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

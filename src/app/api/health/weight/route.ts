import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Sign in to log weight" }, { status: 401 });
  const body = await request.json().catch(() => null) as { weightKg?: number; recordedAt?: string } | null; const weight = body?.weightKg;
  if (typeof weight !== "number" || !Number.isFinite(weight) || weight < 20 || weight > 500) return NextResponse.json({ error: "Enter a weight between 20 and 500 kg" }, { status: 400 });
  const db = createAdminSupabaseClient(); const at = body?.recordedAt && !Number.isNaN(new Date(body.recordedAt).getTime()) ? new Date(body.recordedAt).toISOString() : new Date().toISOString();
  const { error } = await db.from("health_metric_samples").upsert({ user_id: user.id, provider: "manual", provider_record_id: `manual:${user.id}:${at}`, metric_type: "weight", recorded_at: at, value: weight, unit: "kg", raw_payload: { source: "SnackOverflow" } }, { onConflict: "user_id,provider,provider_record_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: row } = await db.from("user_data").select("profile").eq("id", user.id).maybeSingle(); const profile = row?.profile && typeof row.profile === "object" ? { ...(row.profile as Record<string, unknown>), weightKg: weight, updatedAt: at } : null;
  if (profile) await db.from("user_data").update({ profile, updated_at: at }).eq("id", user.id);
  return NextResponse.json({ ok: true, weightKg: weight, recordedAt: at });
}

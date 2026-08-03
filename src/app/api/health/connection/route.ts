import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { generateIngestionToken, hashIngestionToken } from "@/lib/healthIngestion";

async function userId() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET() {
  const id = await userId(); if (!id) return NextResponse.json({ error: "Sign in to use Connected Health" }, { status: 401 });
  const db = createAdminSupabaseClient(); const { data, error } = await db.from("health_connections").select("provider,last_successful_sync,last_error,created_at").eq("user_id", id).eq("provider", "apple_health").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connection: data });
}

export async function POST(request: Request) {
  const id = await userId(); if (!id) return NextResponse.json({ error: "Sign in to use Connected Health" }, { status: 401 });
  const token = generateIngestionToken(); const db = createAdminSupabaseClient();
  const { error } = await db.from("health_connections").upsert({ user_id: id, provider: "apple_health", ingestion_token_hash: hashIngestionToken(token), last_error: null, updated_at: new Date().toISOString() }, { onConflict: "user_id,provider" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token, endpoint: new URL("/api/health/ingest/apple-health", request.url).toString() });
}

export async function DELETE() {
  const id = await userId(); if (!id) return NextResponse.json({ error: "Sign in to use Connected Health" }, { status: 401 });
  const { error } = await createAdminSupabaseClient().from("health_connections").delete().eq("user_id", id).eq("provider", "apple_health");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json({ ok: true });
}

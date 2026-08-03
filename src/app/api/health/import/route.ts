import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ingestHealthWebhook } from "@/lib/healthWebhook";

export const runtime = "nodejs";

/** Authenticated browser upload for Basic/manual JSON exports. */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to import health data" }, { status: 401 });
  return ingestHealthWebhook(request, "manual_upload", user.id);
}

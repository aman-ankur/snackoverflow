import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// This callback is used for password signup email confirmation only.
// Email OTP login verifies codes client-side via supabase.auth.verifyOtp()
// and does not use this redirect flow.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(origin);
    }
    console.error("[Auth Callback] Code exchange failed:", error.message, error.status);
    const errorUrl = new URL(origin);
    errorUrl.searchParams.set("auth_error", error.message || "Failed to verify magic link");
    return NextResponse.redirect(errorUrl.toString());
  }

  // No code present — might be an error from Supabase
  const errorDescription = searchParams.get("error_description") || searchParams.get("error");
  if (errorDescription) {
    console.error("[Auth Callback] Auth error:", errorDescription);
    const errorUrl = new URL(origin);
    errorUrl.searchParams.set("auth_error", errorDescription);
    return NextResponse.redirect(errorUrl.toString());
  }

  return NextResponse.redirect(origin);
}

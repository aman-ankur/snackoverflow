import { ingestHealthWebhook } from "@/lib/healthWebhook";

export const runtime = "nodejs";

/** Native iOS Shortcuts sends a compact custom payload here. */
export async function POST(request: Request) {
  return ingestHealthWebhook(request, "apple_shortcut");
}

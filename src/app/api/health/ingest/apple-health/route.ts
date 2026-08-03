import { ingestHealthWebhook } from "@/lib/healthWebhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return ingestHealthWebhook(request, "apple_health");
}

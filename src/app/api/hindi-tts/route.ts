import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const sarvamKey = process.env.SARVAM_API_KEY;
    if (!sarvamKey) {
      return NextResponse.json(
        { error: "No SARVAM_API_KEY configured. Sign up at dashboard.sarvam.ai and add key to .env.local" },
        { status: 500 }
      );
    }

    // Sarvam AI Bulbul v3 — native Hindi TTS
    const sarvamRes = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": sarvamKey,
      },
      body: JSON.stringify({
        text: text,
        target_language_code: "hi-IN",
        model: "bulbul:v3",
        speaker: "kabir",
        pace: 1.0,
        loudness: 1.2,
        response_format: "mp3",
        sample_rate: 24000,
      }),
    });

    if (!sarvamRes.ok) {
      const errText = await sarvamRes.text();
      console.error("Sarvam TTS error:", sarvamRes.status, errText);
      return NextResponse.json(
        { error: `Sarvam TTS failed: ${sarvamRes.status}` },
        { status: 500 }
      );
    }

    const data = await sarvamRes.json();

    // Sarvam returns base64-encoded audio in data.audios[0]
    const base64Audio = data.audios?.[0];
    if (!base64Audio) {
      return NextResponse.json({ error: "No audio returned from Sarvam" }, { status: 500 });
    }

    const audioBuffer = Buffer.from(base64Audio, "base64");

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("TTS error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

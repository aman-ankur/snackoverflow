import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "No OPENAI_API_KEY configured. Add it to .env.local" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Use tts-1 (cheapest) with 'shimmer' voice — works well with Hindi text
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "shimmer",
      input: text,
      response_format: "mp3",
      speed: 0.95,
    });

    // Return the audio as a binary response
    const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());

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

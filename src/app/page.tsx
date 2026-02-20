"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import GeminiMode from "@/components/GeminiMode";
import ModeSwitcher, { DetectionMode } from "@/components/ModeSwitcher";
import { Scan } from "lucide-react";

// Lazy-load YOLO mode — prevents loading 12MB ONNX model + WASM when in Gemini mode
const YoloMode = dynamic(() => import("@/components/YoloMode"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20 text-sm text-foreground/40">
      Loading YOLO engine...
    </div>
  ),
});

export default function Home() {
  const [mode, setMode] = useState<DetectionMode>("gemini");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
              <Scan className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">
                FridgeVision
              </h1>
              <p className="text-[10px] text-foreground/40 -mt-0.5">
                Smart Kitchen Assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1 text-[10px] font-medium text-accent">
              {mode === "yolo" ? "On-Device" : "Cloud AI"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-lg px-4 py-4 pb-20 space-y-4">
        {/* Mode Switcher */}
        <ModeSwitcher mode={mode} onModeChange={setMode} />

        {/* Render only the active mode */}
        {mode === "gemini" && <GeminiMode />}
        {mode === "yolo" && <YoloMode />}

        {/* Footer */}
        <div className="text-center pt-4 pb-2">
          <p className="text-[10px] text-foreground/20">
            {mode === "yolo"
              ? "YOLOv8n via ONNX Runtime • Runs entirely on your device"
              : "Powered by Gemini / Groq • Your images are not stored"}
          </p>
        </div>
      </main>
    </div>
  );
}

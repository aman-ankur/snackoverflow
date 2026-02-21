"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import GeminiMode from "@/components/GeminiMode";
import ModeSwitcher, { DetectionMode } from "@/components/ModeSwitcher";

const YoloMode = dynamic(() => import("@/components/YoloMode"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20 text-sm text-muted">
      Loading YOLO engine...
    </div>
  ),
});

export default function FridgeTab() {
  const [mode, setMode] = useState<DetectionMode>("gemini");

  return (
    <>
      <ModeSwitcher mode={mode} onModeChange={setMode} />
      {mode === "gemini" && <GeminiMode />}
      {mode === "yolo" && <YoloMode />}

      <div className="text-center pt-2 pb-2">
        <p className="text-[10px] text-muted-light">
          {mode === "yolo"
            ? "YOLOv8n via ONNX Runtime • Runs entirely on your device"
            : "Powered by Fridgenius AI • Your images are not stored"}
        </p>
      </div>
    </>
  );
}

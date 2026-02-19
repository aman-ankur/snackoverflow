"use client";

import { Cpu, Cloud } from "lucide-react";
import { motion } from "framer-motion";

export type DetectionMode = "yolo" | "gemini";

interface ModeSwitcherProps {
  mode: DetectionMode;
  onModeChange: (mode: DetectionMode) => void;
}

export default function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden">
      <div className="flex p-1.5">
        <button
          onClick={() => onModeChange("yolo")}
          className="relative flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-colors"
        >
          {mode === "yolo" && (
            <motion.div
              layoutId="mode-bg"
              className="absolute inset-0 rounded-xl bg-accent/15 border border-accent/25"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className={`relative flex items-center gap-1.5 ${mode === "yolo" ? "text-accent" : "text-foreground/40"}`}>
            <Cpu className="h-3.5 w-3.5" />
            YOLO On-Device
          </span>
        </button>
        <button
          onClick={() => onModeChange("gemini")}
          className="relative flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-colors"
        >
          {mode === "gemini" && (
            <motion.div
              layoutId="mode-bg"
              className="absolute inset-0 rounded-xl bg-accent/15 border border-accent/25"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className={`relative flex items-center gap-1.5 ${mode === "gemini" ? "text-accent" : "text-foreground/40"}`}>
            <Cloud className="h-3.5 w-3.5" />
            Gemini / Groq Cloud
          </span>
        </button>
      </div>
      <div className="px-3 pb-2">
        <p className="text-[10px] text-foreground/25 text-center">
          {mode === "yolo"
            ? "Free • Offline • Real-time (~5-15 FPS) • 80 COCO object classes"
            : "Best accuracy • Identifies Indian groceries • AI recipe suggestions"}
        </p>
      </div>
    </div>
  );
}

"use client";

import type { CapyMood } from "@/lib/dishTypes";

interface CapyMascotProps {
  mood?: CapyMood;
  size?: number;
  className?: string;
  animate?: boolean;
}

const MOOD_IMAGE: Record<string, string> = {
  happy: "/model/capy-happy.png",
  excited: "/model/capy-happy.png",
  sleepy: "/model/capy-happy.png",
  motivated: "/model/capy-motivated.png",
  concerned: "/model/capy-default.png",
  default: "/model/capy-default.png",
};

export default function CapyMascot({ mood = "happy", size = 120, className = "", animate = true }: CapyMascotProps) {
  const src = MOOD_IMAGE[mood] ?? MOOD_IMAGE.default;

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${src}?v=2`}
        alt="Capy mascot"
        width={size}
        height={size}
        className="object-contain"
      />
      {animate && mood === "excited" && (
        <span
          className="absolute -top-1 -right-1 text-xs animate-bounce"
          style={{ fontSize: size * 0.2 }}
        >✨</span>
      )}
      {animate && mood === "sleepy" && (
        <span
          className="absolute -top-1 right-0 text-xs animate-pulse"
          style={{ fontSize: size * 0.18 }}
        >💤</span>
      )}
    </div>
  );
}

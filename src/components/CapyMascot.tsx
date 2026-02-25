"use client";

import { useState, useEffect } from "react";
import type { CapyMood } from "@/lib/dishTypes";

interface CapyMascotProps {
  mood?: CapyMood;
  size?: number;
  className?: string;
  animate?: boolean;
  /** When true, randomly picks from multiple capy avatars. Default: false (uses original mascot). */
  randomize?: boolean;
}

const CAPY_AVATARS = [
  "/model/capy-coconut.jpeg",
  "/model/capy-bird.webp",
  "/model/capy-logo.gif",
];

const MOOD_IMAGE: Record<string, string> = {
  happy: "/model/capy-happy.png",
  excited: "/model/capy-happy.png",
  sleepy: "/model/capy-happy.png",
  motivated: "/model/capy-motivated.png",
  concerned: "/model/capy-default.png",
  default: "/model/capy-default.png",
};

export default function CapyMascot({ mood = "happy", size = 120, className = "", animate = true, randomize = false }: CapyMascotProps) {
  const defaultSrc = MOOD_IMAGE[mood] ?? MOOD_IMAGE.default;

  // Only randomize when explicitly opted in (home header)
  const [src, setSrc] = useState(randomize ? CAPY_AVATARS[0] : defaultSrc);
  useEffect(() => {
    if (randomize) {
      setSrc(CAPY_AVATARS[Math.floor(Math.random() * CAPY_AVATARS.length)]);
    }
  }, [randomize]);

  // Update mood-based src when not randomizing
  const finalSrc = randomize ? src : defaultSrc;

  // Coconut capy works great as circle crop; others need contain to avoid cutting
  const isRandomNonSquare = randomize && finalSrc !== CAPY_AVATARS[0];

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center ${randomize ? `rounded-full overflow-hidden ${isRandomNonSquare ? "bg-accent-light/50" : ""}` : ""} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${finalSrc}?v=2`}
        alt="Capy mascot"
        width={size}
        height={size}
        className={randomize ? (isRandomNonSquare ? "object-contain p-1" : "object-cover rounded-full") : "object-contain"}
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

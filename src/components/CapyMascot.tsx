"use client";

import { useState, useEffect } from "react";
import type { CapyMood } from "@/lib/dishTypes";

interface CapyMascotProps {
  mood?: CapyMood;
  size?: number;
  className?: string;
  animate?: boolean;
}

const CAPY_AVATARS = [
  "/model/capy-coconut.jpeg",
  "/model/capy-orange.jpg",
  "/model/capy-logo.gif",
];

export default function CapyMascot({ mood = "happy", size = 120, className = "", animate = true }: CapyMascotProps) {
  // Pick randomly on mount (client only) to avoid hydration mismatch
  const [src, setSrc] = useState(CAPY_AVATARS[0]);
  useEffect(() => {
    setSrc(CAPY_AVATARS[Math.floor(Math.random() * CAPY_AVATARS.length)]);
  }, []);

  // Coconut capy works great as circle crop; others need contain to avoid cutting
  const isCircleSafe = src === CAPY_AVATARS[0];

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center rounded-full ${isCircleSafe ? "" : "bg-accent-light/50"} overflow-hidden ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Capy mascot"
        width={size}
        height={size}
        className={isCircleSafe ? "object-cover" : "object-contain p-1"}
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

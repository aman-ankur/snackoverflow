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

  // Phase 1: Fix hydration mismatch with mounted guard
  const [mounted, setMounted] = useState(false);
  const [src, setSrc] = useState(defaultSrc); // Always use defaultSrc for SSR

  // Phase 2: Add image loading error handling
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && randomize) {
      const randomSrc = CAPY_AVATARS[Math.floor(Math.random() * CAPY_AVATARS.length)];
      setSrc(randomSrc);
    } else if (!randomize) {
      setSrc(defaultSrc);
    }
  }, [mounted, randomize, defaultSrc]);

  // Phase 4: Reset error state on src change
  useEffect(() => {
    setImageError(false);
  }, [src]);

  const handleImageError = () => {
    console.warn('[CapyMascot] Failed to load:', src, '- falling back to default');
    setImageError(true);
    setSrc('/model/capy-default.png'); // Fallback to default mascot
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  // Update mood-based src when not randomizing
  const finalSrc = src;

  // All avatars are square, so they all use object-cover to fill the circle
  // (coconut, bird, and GIF are all square images)

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center ${randomize ? "rounded-full overflow-hidden" : ""} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${finalSrc}?v=2`}
        alt="Capy mascot"
        width={size}
        height={size}
        className={randomize ? "object-cover rounded-full" : "object-contain"}
        onError={handleImageError}
        onLoad={handleImageLoad}
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

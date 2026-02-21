"use client";

import type { CapyMood } from "@/lib/dishTypes";

interface CapyMascotProps {
  mood?: CapyMood;
  size?: number;
  className?: string;
}

export default function CapyMascot({ mood = "happy", size = 120, className = "" }: CapyMascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Body */}
      <ellipse cx="60" cy="72" rx="38" ry="32" fill="#8B6F47" />

      {/* Belly */}
      <ellipse cx="60" cy="78" rx="26" ry="22" fill="#C4A265" />

      {/* Head */}
      <ellipse cx="60" cy="42" rx="30" ry="26" fill="#8B6F47" />

      {/* Face area */}
      <ellipse cx="60" cy="46" rx="22" ry="18" fill="#A0845C" />

      {/* Ears */}
      <ellipse cx="36" cy="24" rx="8" ry="6" fill="#8B6F47" />
      <ellipse cx="84" cy="24" rx="8" ry="6" fill="#8B6F47" />
      <ellipse cx="36" cy="24" rx="5" ry="3.5" fill="#C4A265" />
      <ellipse cx="84" cy="24" rx="5" ry="3.5" fill="#C4A265" />

      {/* Nose */}
      <ellipse cx="60" cy="48" rx="10" ry="7" fill="#6B5235" />
      <ellipse cx="60" cy="46" rx="4" ry="2.5" fill="#3D2E1A" />

      {/* Nostrils */}
      <circle cx="56" cy="48" r="1.5" fill="#3D2E1A" />
      <circle cx="64" cy="48" r="1.5" fill="#3D2E1A" />

      {/* Eyes — mood-dependent */}
      {mood === "sleepy" ? (
        <>
          {/* Closed eyes (sleepy) */}
          <path d="M44 38 Q48 42 52 38" stroke="#3D2E1A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M68 38 Q72 42 76 38" stroke="#3D2E1A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Zzz */}
          <text x="82" y="22" fill="#22c55e" fontSize="10" fontWeight="bold" opacity="0.7">z</text>
          <text x="90" y="16" fill="#22c55e" fontSize="12" fontWeight="bold" opacity="0.5">z</text>
          <text x="96" y="8" fill="#22c55e" fontSize="14" fontWeight="bold" opacity="0.3">z</text>
        </>
      ) : mood === "excited" ? (
        <>
          {/* Star eyes */}
          <StarEye cx={48} cy={38} />
          <StarEye cx={72} cy={38} />
        </>
      ) : mood === "concerned" ? (
        <>
          {/* Worried eyes */}
          <circle cx="48" cy="38" r="5" fill="white" />
          <circle cx="72" cy="38" r="5" fill="white" />
          <circle cx="49" cy="39" r="3" fill="#3D2E1A" />
          <circle cx="73" cy="39" r="3" fill="#3D2E1A" />
          {/* Sweat drop */}
          <path d="M86 30 Q88 24 90 30 Q88 34 86 30Z" fill="#60a5fa" opacity="0.7" />
          {/* Worried brows */}
          <path d="M42 32 L54 30" stroke="#3D2E1A" strokeWidth="2" strokeLinecap="round" />
          <path d="M78 32 L66 30" stroke="#3D2E1A" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* Normal / happy / motivated eyes */}
          <circle cx="48" cy="38" r="5" fill="white" />
          <circle cx="72" cy="38" r="5" fill="white" />
          <circle cx="49" cy="38" r="3" fill="#3D2E1A" />
          <circle cx="73" cy="38" r="3" fill="#3D2E1A" />
          {/* Eye shine */}
          <circle cx="50.5" cy="36.5" r="1" fill="white" />
          <circle cx="74.5" cy="36.5" r="1" fill="white" />
        </>
      )}

      {/* Blush cheeks */}
      <ellipse cx="38" cy="46" rx="6" ry="3.5" fill="#E8A0A0" opacity="0.4" />
      <ellipse cx="82" cy="46" rx="6" ry="3.5" fill="#E8A0A0" opacity="0.4" />

      {/* Mouth — mood-dependent */}
      {mood === "excited" || mood === "happy" ? (
        <path d="M52 54 Q60 62 68 54" stroke="#3D2E1A" strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : mood === "concerned" ? (
        <path d="M52 58 Q60 52 68 58" stroke="#3D2E1A" strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : mood === "sleepy" ? (
        <ellipse cx="60" cy="56" rx="4" ry="3" fill="#3D2E1A" opacity="0.6" />
      ) : (
        <path d="M54 54 Q60 58 66 54" stroke="#3D2E1A" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}

      {/* Whiskers */}
      <line x1="30" y1="46" x2="18" y2="42" stroke="#6B5235" strokeWidth="1" opacity="0.5" />
      <line x1="30" y1="50" x2="18" y2="50" stroke="#6B5235" strokeWidth="1" opacity="0.5" />
      <line x1="90" y1="46" x2="102" y2="42" stroke="#6B5235" strokeWidth="1" opacity="0.5" />
      <line x1="90" y1="50" x2="102" y2="50" stroke="#6B5235" strokeWidth="1" opacity="0.5" />

      {/* Feet */}
      <ellipse cx="44" cy="100" rx="10" ry="5" fill="#6B5235" />
      <ellipse cx="76" cy="100" rx="10" ry="5" fill="#6B5235" />

      {/* Arms — mood-dependent */}
      {mood === "motivated" ? (
        <>
          {/* Flexing arms */}
          <path d="M26 68 Q16 58 22 48" stroke="#8B6F47" strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d="M94 68 Q104 58 98 48" stroke="#8B6F47" strokeWidth="8" strokeLinecap="round" fill="none" />
          {/* Headband */}
          <rect x="32" y="26" width="56" height="5" rx="2.5" fill="#22c55e" opacity="0.8" />
        </>
      ) : mood === "excited" ? (
        <>
          {/* Arms up celebrating */}
          <path d="M26 68 Q14 52 20 40" stroke="#8B6F47" strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d="M94 68 Q106 52 100 40" stroke="#8B6F47" strokeWidth="8" strokeLinecap="round" fill="none" />
          {/* Sparkles */}
          <text x="10" y="36" fontSize="10" opacity="0.8">✨</text>
          <text x="100" y="36" fontSize="10" opacity="0.8">✨</text>
          <text x="56" y="14" fontSize="8" opacity="0.6">⭐</text>
        </>
      ) : (
        <>
          {/* Resting arms */}
          <path d="M26 70 Q18 80 24 90" stroke="#8B6F47" strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d="M94 70 Q102 80 96 90" stroke="#8B6F47" strokeWidth="8" strokeLinecap="round" fill="none" />
        </>
      )}
    </svg>
  );
}

function StarEye({ cx, cy }: { cx: number; cy: number }) {
  const r = 5;
  const points = Array.from({ length: 5 }, (_, i) => {
    const outerAngle = (Math.PI / 2) + (i * 2 * Math.PI) / 5;
    const innerAngle = outerAngle + Math.PI / 5;
    return [
      `${cx + r * Math.cos(outerAngle)},${cy - r * Math.sin(outerAngle)}`,
      `${cx + r * 0.4 * Math.cos(innerAngle)},${cy - r * 0.4 * Math.sin(innerAngle)}`,
    ];
  }).flat();

  return <polygon points={points.join(" ")} fill="#f59e0b" />;
}

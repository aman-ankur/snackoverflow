"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { CapyMood } from "@/lib/dishTypes";

interface CapyMascotProps {
  mood?: CapyMood;
  size?: number;
  className?: string;
  animate?: boolean;
}

export default function CapyMascot({ mood = "happy", size = 120, className = "", animate = true }: CapyMascotProps) {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    if (!animate || mood === "sleepy") return;
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };
    const interval = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [animate, mood]);

  const showClosedEyes = isBlinking || mood === "sleepy";

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      animate={animate ? {
        scaleY: [1, 1.02, 1],
      } : undefined}
      transition={animate ? {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      } : undefined}
    >
      {/* === BODY === */}
      <ellipse cx="60" cy="75" rx="36" ry="30" fill="#C4956A" />

      {/* Belly */}
      <ellipse cx="60" cy="80" rx="24" ry="20" fill="#E8CBA8" />

      {/* === FEET === */}
      <ellipse cx="42" cy="102" rx="11" ry="5.5" fill="#A07850" />
      <ellipse cx="78" cy="102" rx="11" ry="5.5" fill="#A07850" />
      {/* Toe lines */}
      <line x1="36" y1="102" x2="36" y2="99" stroke="#8B6540" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="42" y1="103" x2="42" y2="100" stroke="#8B6540" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="48" y1="102" x2="48" y2="99" stroke="#8B6540" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="72" y1="102" x2="72" y2="99" stroke="#8B6540" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="78" y1="103" x2="78" y2="100" stroke="#8B6540" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="84" y1="102" x2="84" y2="99" stroke="#8B6540" strokeWidth="1" strokeLinecap="round" opacity="0.4" />

      {/* === ARMS — mood-dependent === */}
      {mood === "motivated" ? (
        <>
          <motion.path
            d="M28 70 Q18 58 24 46"
            stroke="#C4956A" strokeWidth="9" strokeLinecap="round" fill="none"
            animate={animate ? { rotate: [0, -5, 0, 5, 0] } : undefined}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.path
            d="M92 70 Q102 58 96 46"
            stroke="#C4956A" strokeWidth="9" strokeLinecap="round" fill="none"
            animate={animate ? { rotate: [0, 5, 0, -5, 0] } : undefined}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          {/* Headband */}
          <rect x="32" y="26" width="56" height="5" rx="2.5" fill="#7CB67C" opacity="0.85" />
        </>
      ) : mood === "excited" ? (
        <>
          <motion.path
            d="M28 70 Q14 50 22 38"
            stroke="#C4956A" strokeWidth="9" strokeLinecap="round" fill="none"
            animate={animate ? { y: [0, -3, 0] } : undefined}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          <motion.path
            d="M92 70 Q106 50 98 38"
            stroke="#C4956A" strokeWidth="9" strokeLinecap="round" fill="none"
            animate={animate ? { y: [0, -3, 0] } : undefined}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
          />
          {/* Sparkles */}
          <motion.text
            x="8" y="34" fontSize="10"
            animate={animate ? { opacity: [0.4, 1, 0.4], scale: [0.8, 1.1, 0.8] } : undefined}
            transition={{ duration: 1.2, repeat: Infinity }}
          >✨</motion.text>
          <motion.text
            x="100" y="34" fontSize="10"
            animate={animate ? { opacity: [0.4, 1, 0.4], scale: [0.8, 1.1, 0.8] } : undefined}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
          >✨</motion.text>
        </>
      ) : (
        <>
          <path d="M28 72 Q20 82 26 92" stroke="#C4956A" strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M92 72 Q100 82 94 92" stroke="#C4956A" strokeWidth="9" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* === HEAD === */}
      <ellipse cx="60" cy="42" rx="32" ry="28" fill="#C4956A" />

      {/* Face lighter area */}
      <ellipse cx="60" cy="46" rx="24" ry="20" fill="#D4A87A" />

      {/* === SPROUT ON HEAD === */}
      <motion.g
        animate={animate ? { rotate: [-3, 3, -3] } : undefined}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "60px 16px" }}
      >
        <path d="M60 22 Q60 10 52 6" stroke="#7CB67C" strokeWidth="2" strokeLinecap="round" fill="none" />
        <ellipse cx="50" cy="5" rx="5" ry="3.5" fill="#7CB67C" />
        <path d="M60 22 Q60 12 68 8" stroke="#7CB67C" strokeWidth="2" strokeLinecap="round" fill="none" />
        <ellipse cx="70" cy="7" rx="5" ry="3.5" fill="#8FCC8F" />
      </motion.g>

      {/* === EARS === */}
      <motion.ellipse
        cx="34" cy="22" rx="9" ry="7" fill="#C4956A"
        animate={animate ? { rotate: [0, -6, 0] } : undefined}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "34px 22px" }}
      />
      <motion.ellipse
        cx="86" cy="22" rx="9" ry="7" fill="#C4956A"
        animate={animate ? { rotate: [0, 6, 0] } : undefined}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        style={{ transformOrigin: "86px 22px" }}
      />
      <ellipse cx="34" cy="22" rx="5.5" ry="4" fill="#E8CBA8" />
      <ellipse cx="86" cy="22" rx="5.5" ry="4" fill="#E8CBA8" />

      {/* === NOSE === */}
      <ellipse cx="60" cy="49" rx="11" ry="8" fill="#A07850" />
      <ellipse cx="60" cy="47" rx="4.5" ry="3" fill="#5C3D20" />

      {/* Nostrils */}
      <circle cx="56" cy="49" r="1.8" fill="#5C3D20" />
      <circle cx="64" cy="49" r="1.8" fill="#5C3D20" />

      {/* === EYES === */}
      {showClosedEyes ? (
        <>
          <path d="M43 38 Q48 42 53 38" stroke="#5C3D20" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M67 38 Q72 42 77 38" stroke="#5C3D20" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {mood === "sleepy" && (
            <>
              <motion.text
                x="84" y="20" fill="#7CB67C" fontSize="10" fontWeight="bold"
                animate={animate ? { opacity: [0.3, 0.8, 0.3], y: [20, 17, 20] } : undefined}
                transition={{ duration: 2, repeat: Infinity }}
              >z</motion.text>
              <motion.text
                x="92" y="14" fill="#7CB67C" fontSize="12" fontWeight="bold"
                animate={animate ? { opacity: [0.2, 0.6, 0.2], y: [14, 10, 14] } : undefined}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              >z</motion.text>
              <motion.text
                x="98" y="6" fill="#7CB67C" fontSize="14" fontWeight="bold"
                animate={animate ? { opacity: [0.1, 0.4, 0.1], y: [6, 2, 6] } : undefined}
                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
              >z</motion.text>
            </>
          )}
        </>
      ) : mood === "excited" ? (
        <>
          <StarEye cx={48} cy={37} />
          <StarEye cx={72} cy={37} />
        </>
      ) : mood === "concerned" ? (
        <>
          <circle cx="48" cy="37" r="5.5" fill="white" />
          <circle cx="72" cy="37" r="5.5" fill="white" />
          <circle cx="49" cy="38" r="3.2" fill="#5C3D20" />
          <circle cx="73" cy="38" r="3.2" fill="#5C3D20" />
          {/* Sweat drop */}
          <motion.path
            d="M88 28 Q90 22 92 28 Q90 32 88 28Z" fill="#93C5FD" opacity="0.7"
            animate={animate ? { y: [0, 3, 0] } : undefined}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          {/* Worried brows */}
          <path d="M42 31 L54 29" stroke="#5C3D20" strokeWidth="2" strokeLinecap="round" />
          <path d="M78 31 L66 29" stroke="#5C3D20" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* Normal / happy / motivated eyes */}
          <circle cx="48" cy="37" r="5.5" fill="white" />
          <circle cx="72" cy="37" r="5.5" fill="white" />
          <circle cx="49" cy="37" r="3.2" fill="#5C3D20" />
          <circle cx="73" cy="37" r="3.2" fill="#5C3D20" />
          {/* Eye shine */}
          <circle cx="50.5" cy="35.5" r="1.2" fill="white" />
          <circle cx="74.5" cy="35.5" r="1.2" fill="white" />
        </>
      )}

      {/* === BLUSH CHEEKS === */}
      <ellipse cx="36" cy="46" rx="7" ry="4" fill="#F5B0A0" opacity="0.35" />
      <ellipse cx="84" cy="46" rx="7" ry="4" fill="#F5B0A0" opacity="0.35" />

      {/* === MOUTH === */}
      {mood === "excited" || mood === "happy" ? (
        <path d="M52 55 Q60 64 68 55" stroke="#5C3D20" strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : mood === "concerned" ? (
        <path d="M53 59 Q60 53 67 59" stroke="#5C3D20" strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : mood === "sleepy" ? (
        <ellipse cx="60" cy="57" rx="4" ry="3" fill="#5C3D20" opacity="0.5" />
      ) : (
        <path d="M54 55 Q60 59 66 55" stroke="#5C3D20" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}

      {/* === WHISKERS === */}
      <line x1="28" y1="46" x2="16" y2="42" stroke="#A07850" strokeWidth="1" opacity="0.4" />
      <line x1="28" y1="50" x2="16" y2="50" stroke="#A07850" strokeWidth="1" opacity="0.4" />
      <line x1="92" y1="46" x2="104" y2="42" stroke="#A07850" strokeWidth="1" opacity="0.4" />
      <line x1="92" y1="50" x2="104" y2="50" stroke="#A07850" strokeWidth="1" opacity="0.4" />
    </motion.svg>
  );
}

function StarEye({ cx, cy }: { cx: number; cy: number }) {
  const r = 5.5;
  const points = Array.from({ length: 5 }, (_, i) => {
    const outerAngle = (Math.PI / 2) + (i * 2 * Math.PI) / 5;
    const innerAngle = outerAngle + Math.PI / 5;
    return [
      `${cx + r * Math.cos(outerAngle)},${cy - r * Math.sin(outerAngle)}`,
      `${cx + r * 0.4 * Math.cos(innerAngle)},${cy - r * 0.4 * Math.sin(innerAngle)}`,
    ];
  }).flat();

  return <polygon points={points.join(" ")} fill="#E8945A" />;
}

"use client";

import { useEffect, useState, useRef } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";

interface CapyLottieProps {
  src?: string;
  size?: number;
  className?: string;
  speed?: number;
}

export default function CapyLottie({ src = "/model/capy-mascot.json", size = 120, className = "", speed = 1 }: CapyLottieProps) {
  const [animationData, setAnimationData] = useState<unknown>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    fetch(src)
      .then((res) => res.json())
      .then(setAnimationData)
      .catch(() => {});
  }, [src]);

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(speed);
    }
  }, [speed, animationData]);

  if (!animationData) {
    return (
      <div style={{ width: size, height: size }} className={`flex items-center justify-center ${className}`}>
        <span style={{ fontSize: size * 0.5 }}>🐹</span>
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size }} className={className}>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop
        autoplay
        style={{ width: size, height: size }}
      />
    </div>
  );
}

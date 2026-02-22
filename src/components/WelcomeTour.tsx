"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, PenLine, ChevronRight, Flower2, TreePine, Sparkles, Bug } from "lucide-react";
import CapyMascot from "@/components/CapyMascot";

interface WelcomeTourProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    title: "Scan or Describe",
    subtitle: "Point your camera at food, or just type what you ate — AI handles the rest",
  },
  {
    title: "Track Your Nutrition",
    subtitle: "Calories, protein, carbs & fats — all tracked automatically from your scans",
  },
  {
    title: "Grow Capy's Garden",
    subtitle: "Log meals daily to unlock milestones and watch your garden bloom",
  },
];

function Slide1Visual() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white shadow-md">
        <Camera className="h-9 w-9 text-accent" />
      </div>
      <div className="relative flex flex-col items-center">
        <div className="h-10 w-0.5 rounded-full bg-border" />
        <span className="absolute top-1/2 -translate-y-1/2 rounded-md bg-accent px-2 py-0.5 text-[10px] font-extrabold text-white">
          OR
        </span>
      </div>
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white shadow-md">
        <PenLine className="h-9 w-9 text-accent" />
      </div>
    </div>
  );
}

function Slide2Visual() {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * 0.28;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold text-foreground">1,450</span>
          <span className="text-[8px] text-muted">/ 2,000 kcal</span>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
          <div className="h-full w-[65%] rounded-full bg-orange" />
        </div>
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
          <div className="h-full w-[45%] rounded-full bg-accent" />
        </div>
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
          <div className="h-full w-[55%] rounded-full" style={{ background: "#D07A3E" }} />
        </div>
      </div>
      <div className="flex gap-4 text-[9px] font-semibold">
        <span className="text-orange">Carbs</span>
        <span className="text-accent">Protein</span>
        <span style={{ color: "#D07A3E" }}>Fats</span>
      </div>
    </div>
  );
}

function Slide3Visual() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md">
        <CapyMascot mood="happy" size={64} />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
          <Flower2 className="h-[18px] w-[18px] text-accent" />
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
          <TreePine className="h-[18px] w-[18px] text-accent-dim" />
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
          <Sparkles className="h-[18px] w-[18px] text-orange" />
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
          <Bug className="h-[18px] w-[18px]" style={{ color: "#9B59B6" }} />
        </div>
      </div>
    </div>
  );
}

const VISUALS = [Slide1Visual, Slide2Visual, Slide3Visual];

const VISUAL_GRADIENTS = [
  "from-accent-light to-[#E8F5E0]",
  "from-[#E8F5E0] to-orange-light",
  "from-accent-light to-[#FFF8E8]",
];

export default function WelcomeTour({ onComplete }: WelcomeTourProps) {
  const [step, setStep] = useState(0);

  const handleNext = useCallback(() => {
    if (step < SLIDES.length - 1) {
      setStep((s) => s + 1);
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  const Visual = VISUALS[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
    >
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-[320px] rounded-3xl bg-card p-6 pt-8 text-center shadow-2xl"
      >
        {/* Visual */}
        <div className={`mb-6 flex h-[200px] items-center justify-center rounded-2xl bg-gradient-to-br ${VISUAL_GRADIENTS[step]}`}>
          <Visual />
        </div>

        {/* Title */}
        <h2 className="text-[22px] font-extrabold text-foreground mb-2">{SLIDES[step].title}</h2>
        <p className="text-sm text-muted leading-relaxed mb-6">{SLIDES[step].subtitle}</p>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-accent" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        {step < SLIDES.length - 1 ? (
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-7 py-3 text-[15px] font-bold text-white transition-colors hover:bg-accent-dim active:scale-95"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="rounded-xl bg-accent px-9 py-3.5 text-base font-bold text-white transition-colors hover:bg-accent-dim active:scale-95"
          >
            Let&apos;s Go!
          </button>
        )}

        {/* Skip */}
        {step < SLIDES.length - 1 && (
          <button
            onClick={onComplete}
            className="mt-3 block w-full text-[13px] font-semibold text-muted-light transition-colors hover:text-muted"
          >
            Skip tour
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

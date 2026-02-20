"use client";

import { motion } from "framer-motion";
import type { DietaryFilter as DietaryFilterType } from "@/lib/useGeminiVision";

interface DietaryFilterProps {
  value: DietaryFilterType;
  onChange: (value: DietaryFilterType) => void;
}

const FILTERS: { value: DietaryFilterType; label: string; emoji: string }[] = [
  { value: "all", label: "All", emoji: "🍽️" },
  { value: "vegetarian", label: "Veg", emoji: "🥬" },
  { value: "vegan", label: "Vegan", emoji: "🌱" },
  { value: "eggetarian", label: "Egg", emoji: "🥚" },
  { value: "jain", label: "Jain", emoji: "🙏" },
];

export default function DietaryFilter({ value, onChange }: DietaryFilterProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className="relative flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap"
        >
          {value === f.value && (
            <motion.div
              layoutId="diet-pill"
              className="absolute inset-0 rounded-full bg-accent/15 border border-accent/25"
              transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
            />
          )}
          <span className="relative">
            {f.emoji} {f.label}
          </span>
        </button>
      ))}
    </div>
  );
}

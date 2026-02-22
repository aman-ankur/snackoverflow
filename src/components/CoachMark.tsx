"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { CoachMarkId } from "@/lib/useCoachMarks";

interface CoachMarkProps {
  id: CoachMarkId;
  text: string;
  visible: boolean;
  onDismiss: (id: CoachMarkId) => void;
  arrow?: "top" | "bottom" | "left";
  className?: string;
}

export default function CoachMark({ id, text, visible, onDismiss, arrow = "top", className = "" }: CoachMarkProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: arrow === "bottom" ? -4 : 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: arrow === "bottom" ? -4 : 4 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`absolute z-50 pointer-events-none ${className}`}
        >
          <div className="relative inline-block pointer-events-auto">
            {/* Arrow */}
            {arrow === "top" && (
              <div className="absolute -top-[5px] left-6 h-2.5 w-2.5 rotate-45 bg-foreground/90" />
            )}
            {arrow === "bottom" && (
              <div className="absolute -bottom-[5px] left-6 h-2.5 w-2.5 rotate-45 bg-foreground/90" />
            )}
            {arrow === "left" && (
              <div className="absolute -left-[5px] top-3 h-2.5 w-2.5 rotate-45 bg-foreground/90" />
            )}

            {/* Bubble */}
            <div className="rounded-xl bg-foreground/90 backdrop-blur-sm px-3.5 py-2.5 shadow-lg max-w-[260px]">
              <p className="text-xs font-semibold text-background leading-relaxed">{text}</p>
              <button
                onClick={() => onDismiss(id)}
                className="mt-2 rounded-lg bg-accent px-3 py-1 text-[11px] font-bold text-white transition-colors hover:bg-accent-dim active:scale-95"
              >
                Got it
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

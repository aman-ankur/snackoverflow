"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { CoachMarkId } from "@/lib/useCoachMarks";

interface CoachMarkProps {
  id: CoachMarkId;
  text: string;
  visible: boolean;
  onDismiss: (id: CoachMarkId) => void;
  position?: "inline" | "overlay-top" | "overlay-bottom";
  className?: string;
}

export default function CoachMark({
  id,
  text,
  visible,
  onDismiss,
  position = "inline",
  className = "",
}: CoachMarkProps) {
  const isOverlay = position !== "inline";
  const positionClass = isOverlay
    ? position === "overlay-top"
      ? "absolute top-3 left-3 right-3 z-50"
      : "absolute bottom-3 left-3 right-3 z-50"
    : "";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: isOverlay ? (position === "overlay-bottom" ? 6 : -6) : 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: isOverlay ? (position === "overlay-bottom" ? 6 : -6) : 4 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`${positionClass} ${className}`}
        >
          <div
            className="flex items-center gap-2.5 rounded-xl bg-foreground/60 backdrop-blur-lg px-3 py-2 shadow-md"
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            <p className="flex-1 text-[11px] font-medium text-white/90 leading-snug">{text}</p>
            <button
              onClick={() => onDismiss(id)}
              className="shrink-0 rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white/80 transition-colors hover:bg-white/25 active:scale-95"
            >
              OK
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

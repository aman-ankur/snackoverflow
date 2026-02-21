"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import FridgeTab from "@/components/FridgeTab";

interface FridgeOverlayProps {
  onClose: () => void;
}

export default function FridgeOverlay({ onClose }: FridgeOverlayProps) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-[90] bg-background overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <h2 className="text-sm font-bold text-foreground">Fridge Scanner</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-card-hover transition-colors active:scale-95"
          >
            <X className="h-4 w-4 text-muted" />
          </button>
        </div>
      </div>

      {/* Fridge content */}
      <div className="mx-auto max-w-lg px-4 py-4 pb-8 space-y-4">
        <FridgeTab />
      </div>
    </motion.div>
  );
}

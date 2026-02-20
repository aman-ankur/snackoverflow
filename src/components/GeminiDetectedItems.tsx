"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Package, Trash2, Eye, X } from "lucide-react";
import type { DetectedItem } from "@/lib/useGeminiVision";

interface GeminiDetectedItemsProps {
  items: DetectedItem[];
  onClear: () => void;
  onRemoveItem: (name: string) => void;
  frameCount: number;
  lastAnalyzedAt: Date | null;
}

export default function GeminiDetectedItems({
  items,
  onClear,
  onRemoveItem,
  frameCount,
  lastAnalyzedAt,
}: GeminiDetectedItemsProps) {
  const confidenceColor = {
    high: "bg-accent/10 border-accent/20 text-accent",
    medium: "bg-yellow-400/10 border-yellow-400/20 text-yellow-400",
    low: "bg-foreground/5 border-foreground/10 text-foreground/50",
  };

  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold">Detected Items</h2>
          {items.length > 0 && (
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
              {items.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastAnalyzedAt && (
            <div className="flex items-center gap-1 text-[10px] text-foreground/30">
              <Eye className="h-3 w-3" />
              <span>
                {frameCount} scan{frameCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {items.length > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 text-xs text-foreground/40 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="p-3 min-h-[60px]">
        {items.length === 0 ? (
          <p className="text-xs text-foreground/30 text-center py-3">
            Tap &quot;Analyze&quot; to identify items with Gemini AI
          </p>
        ) : (
          <>
            <p className="text-[10px] text-foreground/25 mb-2 px-1">
              Tap X to remove incorrect items. Items accumulate across scans.
            </p>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.name}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`group flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${confidenceColor[item.confidence]}`}
                  >
                    <span className="text-xs font-medium">{item.name}</span>
                    {item.hindi && (
                      <span className="text-[10px] opacity-50">{item.hindi}</span>
                    )}
                    {item.quantity && item.quantity !== "1" && (
                      <span className="text-[10px] font-bold opacity-70">
                        x{item.quantity}
                      </span>
                    )}
                    <button
                      onClick={() => onRemoveItem(item.name)}
                      className="ml-0.5 -mr-1 flex items-center justify-center rounded-full h-4 w-4 opacity-40 hover:opacity-100 hover:bg-red-500/20 transition-all"
                      aria-label={`Remove ${item.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

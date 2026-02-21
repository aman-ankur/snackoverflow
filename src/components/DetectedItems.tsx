"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Package, Trash2 } from "lucide-react";

interface DetectedItemsProps {
  items: Map<string, number>;
  onClear: () => void;
}

export default function DetectedItems({ items, onClear }: DetectedItemsProps) {
  const sortedItems = Array.from(items.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold">Detected Items</h2>
          {sortedItems.length > 0 && (
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
              {sortedItems.length}
            </span>
          )}
        </div>
        {sortedItems.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-muted hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Items */}
      <div className="p-3 min-h-[60px]">
        {sortedItems.length === 0 ? (
          <p className="text-xs text-muted text-center py-3">
            Point camera at items to detect them
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {sortedItems.map(([name, confidence]) => (
                <motion.div
                  key={name}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-1.5"
                >
                  <span className="text-sm">{getEmoji(name)}</span>
                  <span className="text-xs font-medium text-accent">
                    {name}
                  </span>
                  <span className="text-[10px] text-accent/50">
                    {Math.round(confidence * 100)}%
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function getEmoji(item: string): string {
  const map: Record<string, string> = {
    Apple: "\uD83C\uDF4E",
    Orange: "\uD83C\uDF4A",
    Banana: "\uD83C\uDF4C",
    Broccoli: "\uD83E\uDD66",
    Carrot: "\uD83E\uDD55",
    Bread: "\uD83C\uDF5E",
    "Milk/Water": "\uD83E\uDD5B",
    "Chai/Coffee": "\u2615",
    "Dal/Curry": "\uD83C\uDF5B",
    "Mixed Vegetables": "\uD83E\uDD57",
    Potato: "\uD83E\uDD54",
    Tomato: "\uD83C\uDF45",
    Onion: "\uD83E\uDDC5",
    Pepper: "\uD83C\uDF36\uFE0F",
    Lemon: "\uD83C\uDF4B",
    Egg: "\uD83E\uDD5A",
  };
  return map[item] || "\uD83C\uDF7D\uFE0F";
}

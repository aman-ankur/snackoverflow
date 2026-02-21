"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  CalendarClock,
  X,
  Leaf,
} from "lucide-react";
import type { TrackedItem } from "@/lib/useExpiryTracker";

interface ExpiryTrackerProps {
  items: TrackedItem[];
  expiringCount: number;
  onSetExpiry: (name: string, expiresAt: string) => void;
  onRemove: (name: string) => void;
  onClearAll: () => void;
  getDaysLeft: (expiresAt?: string) => number | null;
}

export default function ExpiryTracker({
  items,
  expiringCount,
  onSetExpiry,
  onRemove,
  onClearAll,
  getDaysLeft,
}: ExpiryTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  if (items.length === 0) return null;

  const sorted = [...items].sort((a, b) => {
    const order = { expired: 0, expiring: 1, fresh: 2, unknown: 3 };
    return order[a.category] - order[b.category];
  });

  const categoryStyle = {
    expired: "bg-red-500/10 border-red-500/20 text-red-400",
    expiring: "bg-yellow-400/10 border-yellow-400/20 text-yellow-400",
    fresh: "bg-green-400/10 border-green-400/20 text-green-400",
    unknown: "bg-card-hover border-border text-muted",
  };

  const categoryIcon = {
    expired: <AlertTriangle className="h-3 w-3" />,
    expiring: <Clock className="h-3 w-3" />,
    fresh: <Leaf className="h-3 w-3" />,
    unknown: <CalendarClock className="h-3 w-3" />,
  };

  function handleDateChange(itemName: string, dateStr: string) {
    const date = new Date(dateStr);
    date.setHours(23, 59, 59);
    onSetExpiry(itemName, date.toISOString());
    setEditingItem(null);
  }

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold">Freshness Tracker</h2>
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
            {items.length}
          </span>
          {expiringCount > 0 && (
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400 animate-pulse">
              {expiringCount} ⚠️
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-border pt-3 space-y-1.5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-muted-light px-1">
                  Tap date to edit expiry. Auto-estimated from typical shelf life.
                </p>
                <button
                  onClick={onClearAll}
                  className="flex items-center gap-1 text-[10px] text-muted hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              </div>

              {sorted.map((item) => {
                const daysLeft = getDaysLeft(item.expiresAt);
                const daysLabel =
                  daysLeft === null
                    ? "No expiry set"
                    : daysLeft < 0
                    ? `Expired ${Math.abs(daysLeft)}d ago`
                    : daysLeft === 0
                    ? "Expires today!"
                    : `${daysLeft}d left`;

                return (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 ${categoryStyle[item.category]}`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {categoryIcon[item.category]}
                      <div className="min-w-0">
                        <span className="text-xs font-medium block truncate">
                          {item.name}
                          {item.hindi && (
                            <span className="opacity-50 ml-1">{item.hindi}</span>
                          )}
                        </span>
                        {editingItem === item.name ? (
                          <input
                            type="date"
                            className="mt-1 text-[10px] bg-transparent border border-current/30 rounded px-1 py-0.5 w-full"
                            defaultValue={
                              item.expiresAt
                                ? new Date(item.expiresAt).toISOString().split("T")[0]
                                : ""
                            }
                            onChange={(e) =>
                              handleDateChange(item.name, e.target.value)
                            }
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => setEditingItem(item.name)}
                            className="text-[10px] opacity-60 hover:opacity-100 transition-opacity"
                          >
                            {daysLabel}
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemove(item.name)}
                      className="ml-2 p-1 rounded-full opacity-30 hover:opacity-100 hover:bg-red-500/20 transition-all shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

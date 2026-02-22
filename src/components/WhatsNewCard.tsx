"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";

const CURRENT_VERSION = "v1";
const STORAGE_KEY = "snackoverflow-whats-new-seen";

interface WhatsNewCardProps {
  onTryIt: () => void;
}

export default function WhatsNewCard({ onTryIt }: WhatsNewCardProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      setDismissed(seen === CURRENT_VERSION);
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(STORAGE_KEY, CURRENT_VERSION); } catch { /* ignore */ }
  };

  const handleTryIt = () => {
    handleDismiss();
    onTryIt();
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="relative flex items-center gap-3 rounded-2xl border border-accent bg-gradient-to-r from-[#E8F5E0] to-card p-3.5 pl-4 border-l-4">
            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="absolute right-2 top-2 p-1 text-muted-light transition-colors hover:text-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-light">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="rounded bg-accent px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wide text-white">
                  New
                </span>
                <span className="text-[13px] font-bold text-foreground">Describe Your Meal</span>
              </div>
              <p className="text-[11px] text-muted leading-snug">
                Type what you ate and get instant nutrition
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={handleTryIt}
              className="shrink-0 rounded-lg bg-accent px-3.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-accent-dim active:scale-95"
            >
              Try it
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

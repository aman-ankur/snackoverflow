"use client";

import { motion } from "framer-motion";
import { Refrigerator, Utensils } from "lucide-react";

export type AppTab = "fridge" | "dish";

interface BottomTabBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 px-4 pb-4">
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-surface/90 p-1.5 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onTabChange("fridge")}
            className="relative flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold"
          >
            {activeTab === "fridge" && (
              <motion.div
                layoutId="bottom-tab-bg"
                className="absolute inset-0 rounded-xl border border-accent/25 bg-accent/15"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span
              className={`relative flex items-center gap-1.5 ${
                activeTab === "fridge" ? "text-accent" : "text-foreground/40"
              }`}
            >
              <Refrigerator className="h-3.5 w-3.5" />
              Fridge
            </span>
          </button>

          <button
            onClick={() => onTabChange("dish")}
            className="relative flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold"
          >
            {activeTab === "dish" && (
              <motion.div
                layoutId="bottom-tab-bg"
                className="absolute inset-0 rounded-xl border border-orange/25 bg-orange/15"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span
              className={`relative flex items-center gap-1.5 ${
                activeTab === "dish" ? "text-orange" : "text-foreground/40"
              }`}
            >
              <Utensils className="h-3.5 w-3.5" />
              Dish
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

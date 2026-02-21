"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Scan } from "lucide-react";
import BottomTabBar, { AppTab } from "@/components/BottomTabBar";
import FridgeTab from "@/components/FridgeTab";
import DishMode from "@/components/DishMode";

export default function Home() {
  const [activeTab, setActiveTab] = useState<AppTab>("fridge");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
              <Scan className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">
                Fridgenius
              </h1>
              <p className="text-[10px] text-foreground/40 -mt-0.5">
                Smart Kitchen Assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium border ${
                activeTab === "dish"
                  ? "bg-orange/10 border-orange/20 text-orange"
                  : "bg-accent/10 border-accent/20 text-accent"
              }`}
            >
              {activeTab === "dish" ? "Dish Scanner" : "Fridge Scanner"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-lg px-4 py-4 pb-20 space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === "fridge" ? (
            <motion.div
              key="tab-fridge"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <FridgeTab />
            </motion.div>
          ) : (
            <motion.div
              key="tab-dish"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <DishMode />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

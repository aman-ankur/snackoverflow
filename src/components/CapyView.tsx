"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, TreePine, Flower2, Fish, Sparkles, MessageCircle, Trophy, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import { useGardenState, type GardenEvent, type NextUnlock } from "@/lib/useGardenState";
import { getContextualMotivation } from "@/lib/capyMotivation";
import type { MealTotals, NutritionGoals, StreakData } from "@/lib/dishTypes";

const CapyGarden = dynamic(() => import("@/components/CapyGarden"), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-2xl bg-gradient-to-b from-[#87CEEB] to-[#E8F5E0] flex items-center justify-center" style={{ height: "55vh" }}>
      <div className="text-center">
        <div className="animate-breathe inline-block text-4xl mb-2">🌱</div>
        <p className="text-sm font-semibold text-accent-dim">Loading garden...</p>
      </div>
    </div>
  ),
});

interface CapyViewProps {
  streak: StreakData;
  todayTotals: MealTotals;
  goals: NutritionGoals;
  isActive: boolean;
}

export default function CapyView({ streak, todayTotals, goals, isActive }: CapyViewProps) {
  const { garden, nextUnlock } = useGardenState(streak, todayTotals, goals);
  const [motivation, setMotivation] = useState<{ text: string; mood: string } | null>(null);
  const [showMotivation, setShowMotivation] = useState(false);

  const handleCapyTap = useCallback(() => {
    const line = getContextualMotivation(
      garden,
      streak.currentStreak,
      todayTotals.calories,
      goals.calories,
      todayTotals.protein,
      goals.protein
    );
    setMotivation({ text: line.text, mood: line.mood });
    setShowMotivation(true);
    setTimeout(() => setShowMotivation(false), 4000);
  }, [garden, streak, todayTotals, goals]);

  const handleTalkToCapy = useCallback(() => {
    const line = getContextualMotivation(
      garden,
      streak.currentStreak,
      todayTotals.calories,
      goals.calories,
      todayTotals.protein,
      goals.protein
    );
    setMotivation({ text: line.text, mood: line.mood });
    setShowMotivation(true);
    setTimeout(() => setShowMotivation(false), 5000);
  }, [garden, streak, todayTotals, goals]);

  const achievements = useMemo(() => {
    return [
      { icon: "🌸", label: "First Flower", unlocked: garden.flowers >= 1 },
      { icon: "🌳", label: "Sapling", unlocked: garden.treeLevel >= 1 },
      { icon: "🦋", label: "Butterfly", unlocked: garden.butterflies >= 1 },
      { icon: "🌊", label: "Pond", unlocked: garden.pondLevel >= 1 },
      { icon: "🐟", label: "Fish", unlocked: garden.pondLevel >= 3 },
      { icon: "🌈", label: "Rainbow", unlocked: garden.hasRainbow },
      { icon: "👑", label: "Crown", unlocked: garden.hasCrown },
      { icon: "🏆", label: "Full Garden", unlocked: garden.flowers >= 30 },
    ];
  }, [garden]);

  return (
    <div className="space-y-4">
      {/* Garden Stats Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-foreground">Capy&apos;s Garden</h2>
        <div className="flex items-center gap-3">
          <StatChip icon="🌸" value={garden.flowers} />
          <StatChip icon="🌳" value={`Lv${garden.treeLevel}`} />
          <StatChip icon="🦋" value={garden.butterflies} />
          {streak.currentStreak > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-orange-light border border-orange/20 px-2 py-0.5">
              <Flame className="h-3 w-3 text-orange" />
              <span className="text-[10px] font-bold text-orange">{streak.currentStreak}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3D Garden Canvas */}
      <div className="relative">
        <CapyGarden
          garden={garden}
          isActive={isActive}
          onCapyTap={handleCapyTap}
        />

        {/* Motivation Bubble Overlay */}
        <AnimatePresence>
          {showMotivation && motivation && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-accent/20 p-3 shadow-lg"
            >
              <p className="text-sm font-semibold text-foreground leading-relaxed">{motivation.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap hint */}
        {!showMotivation && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <p className="text-[10px] text-white/70 font-medium bg-black/20 rounded-full px-3 py-1 backdrop-blur-sm">
              Tap Capy for motivation
            </p>
          </div>
        )}
      </div>

      {/* Talk to Capy Button */}
      <button
        onClick={handleTalkToCapy}
        className="w-full rounded-2xl bg-gradient-to-r from-accent-light to-[#E8F5E0] border border-accent/15 p-4 flex items-center gap-3 text-left transition-all active:scale-[0.98] hover:shadow-md"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
          <MessageCircle className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Talk to Capy</p>
          <p className="text-[10px] text-muted">Get a motivational message</p>
        </div>
        <Sparkles className="h-4 w-4 text-accent" />
      </button>

      {/* Next Unlock Card */}
      {nextUnlock && <NextUnlockCard unlock={nextUnlock} />}

      {/* Achievements Grid */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-bold text-foreground">Achievements</h3>
          <span className="text-[10px] text-muted ml-auto">
            {achievements.filter((a) => a.unlocked).length}/{achievements.length}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {achievements.map((a) => (
            <div
              key={a.label}
              className={`flex flex-col items-center gap-1 rounded-xl p-2 ${
                a.unlocked ? "bg-accent-light/50" : "bg-border/30 opacity-40"
              }`}
            >
              <span className="text-lg">{a.icon}</span>
              <span className="text-[9px] font-semibold text-foreground text-center leading-tight">{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Garden Journal */}
      {garden.journal.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Garden Journal</h3>
          <div className="space-y-2">
            {garden.journal.slice(0, 5).map((event) => (
              <JournalEntry key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Garden Health */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-foreground">Garden Health</h3>
          <span className="text-xs font-bold" style={{ color: garden.gardenHealth > 60 ? "#16a34a" : garden.gardenHealth > 30 ? "#ca8a04" : "#ea580c" }}>
            {garden.gardenHealth}%
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${garden.gardenHealth}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              backgroundColor: garden.gardenHealth > 60 ? "#16a34a" : garden.gardenHealth > 30 ? "#ca8a04" : "#ea580c",
            }}
          />
        </div>
        <p className="text-[10px] text-muted mt-1.5">
          {garden.gardenHealth > 80
            ? "Your garden is thriving! Keep it up!"
            : garden.gardenHealth > 50
            ? "Garden is healthy. Log meals to keep it growing!"
            : garden.gardenHealth > 30
            ? "Garden needs attention. Log a meal to help!"
            : "Garden is wilting! Log meals to revive it!"}
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function StatChip({ icon, value }: { icon: string; value: string | number }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-card border border-border px-2 py-0.5">
      <span className="text-xs">{icon}</span>
      <span className="text-[10px] font-bold text-foreground">{value}</span>
    </div>
  );
}

function NextUnlockCard({ unlock }: { unlock: NextUnlock }) {
  const percent = unlock.target > 0 ? Math.min((unlock.current / unlock.target) * 100, 100) : 0;
  const remaining = unlock.target - unlock.current;

  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#FFF3E0] to-[#E8F5E0] border border-orange/10 p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{unlock.icon}</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Next: {unlock.label}</p>
          <p className="text-[10px] text-muted">{remaining} more to unlock</p>
          <div className="mt-1.5 h-2 w-full rounded-full bg-white/60 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-accent"
            />
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-light" />
      </div>
    </div>
  );
}

function JournalEntry({ event }: { event: GardenEvent }) {
  const timeAgo = useMemo(() => {
    const diff = Date.now() - new Date(event.date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, [event.date]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{event.icon}</span>
      <p className="text-xs text-foreground flex-1">{event.text}</p>
      <span className="text-[9px] text-muted-light shrink-0">{timeAgo}</span>
    </div>
  );
}

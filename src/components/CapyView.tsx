"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Sparkles, MessageCircle, Trophy, ChevronRight, ChevronDown, Eye, EyeOff } from "lucide-react";
import dynamic from "next/dynamic";
import { useGardenState, type GardenState, type GardenEvent, type NextUnlock } from "@/lib/useGardenState";
import { getContextualMotivation } from "@/lib/capyMotivation";
import CoachMark from "@/components/CoachMark";
import type { MealTotals, NutritionGoals, StreakData } from "@/lib/dishTypes";
import type { CoachMarkId } from "@/lib/useCoachMarks";

// ── Demo garden presets for each achievement stage ────────────────────
// Order matches the 8-milestone progression exactly
const DEMO_PRESETS: { label: string; icon: string; garden: GardenState }[] = [
  {
    label: "Sapling",
    icon: "🌱",
    garden: { flowers: 0, treeLevel: 1, pondLevel: 0, butterflies: 0, hasRainbow: false, hasCrown: false, gardenHealth: 70, totalMealsLogged: 3, daysGoalHit: 1, lastComputedDate: "", journal: [], babyCapybaras: 0, homeLevel: 0 },
  },
  {
    label: "First Flower",
    icon: "🌸",
    garden: { flowers: 3, treeLevel: 1, pondLevel: 0, butterflies: 0, hasRainbow: false, hasCrown: false, gardenHealth: 75, totalMealsLogged: 4, daysGoalHit: 3, lastComputedDate: "", journal: [], babyCapybaras: 0, homeLevel: 0 },
  },
  {
    label: "Butterfly",
    icon: "🦋",
    garden: { flowers: 4, treeLevel: 1, pondLevel: 0, butterflies: 1, hasRainbow: false, hasCrown: false, gardenHealth: 78, totalMealsLogged: 5, daysGoalHit: 4, lastComputedDate: "", journal: [], babyCapybaras: 0, homeLevel: 0 },
  },
  {
    label: "Baby Capy",
    icon: "🐾",
    garden: { flowers: 7, treeLevel: 1, pondLevel: 0, butterflies: 2, hasRainbow: false, hasCrown: false, gardenHealth: 80, totalMealsLogged: 8, daysGoalHit: 7, lastComputedDate: "", journal: [], babyCapybaras: 1, homeLevel: 0 },
  },
  {
    label: "Forest",
    icon: "🌲",
    garden: { flowers: 12, treeLevel: 2, pondLevel: 0, butterflies: 5, hasRainbow: true, hasCrown: false, gardenHealth: 85, totalMealsLogged: 14, daysGoalHit: 12, lastComputedDate: "", journal: [], babyCapybaras: 2, homeLevel: 0 },
  },
  {
    label: "Cozy Home",
    icon: "\uD83C\uDFE1",
    garden: { flowers: 15, treeLevel: 2, pondLevel: 1, butterflies: 5, hasRainbow: true, hasCrown: false, gardenHealth: 90, totalMealsLogged: 18, daysGoalHit: 15, lastComputedDate: "", journal: [], babyCapybaras: 2, homeLevel: 1 },
  },
  {
    label: "Hot Spring",
    icon: "♨️",
    garden: { flowers: 26, treeLevel: 3, pondLevel: 3, butterflies: 5, hasRainbow: true, hasCrown: true, gardenHealth: 95, totalMealsLogged: 30, daysGoalHit: 26, lastComputedDate: "", journal: [], babyCapybaras: 3, homeLevel: 3 },
  },
  {
    label: "Full Garden",
    icon: "🌻",
    garden: { flowers: 30, treeLevel: 3, pondLevel: 3, butterflies: 5, hasRainbow: true, hasCrown: true, gardenHealth: 100, totalMealsLogged: 35, daysGoalHit: 30, lastComputedDate: "", journal: [], babyCapybaras: 3, homeLevel: 3 },
  },
];

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
  coachMarks?: { shouldShow: (id: CoachMarkId) => boolean; dismiss: (id: CoachMarkId) => void };
}

export default function CapyView({ streak, todayTotals, goals, isActive, coachMarks }: CapyViewProps) {
  const { garden, nextUnlock } = useGardenState(streak, todayTotals, goals);
  const [motivation, setMotivation] = useState<{ text: string; mood: string } | null>(null);
  const [showMotivation, setShowMotivation] = useState(false);
  const [demoGarden, setDemoGarden] = useState<GardenState | null>(null);
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const revertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-revert preview after 10 seconds
  useEffect(() => {
    if (revertTimerRef.current) clearTimeout(revertTimerRef.current);
    if (demoGarden) {
      revertTimerRef.current = setTimeout(() => {
        setDemoGarden(null);
        setActiveDemo(null);
      }, 30000);
    }
    return () => { if (revertTimerRef.current) clearTimeout(revertTimerRef.current); };
  }, [demoGarden]);

  // Revert preview when tab changes (isActive becomes false)
  useEffect(() => {
    if (!isActive && demoGarden) {
      setDemoGarden(null);
      setActiveDemo(null);
    }
  }, [isActive, demoGarden]);

  const activeGarden = demoGarden ?? garden;

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
      { icon: "🌱", label: "Sapling", unlocked: activeGarden.treeLevel >= 1 },
      { icon: "🌸", label: "First Flower", unlocked: activeGarden.flowers >= 3 },
      { icon: "🦋", label: "Butterfly", unlocked: activeGarden.butterflies >= 1 },
      { icon: "🐾", label: "Baby Capy", unlocked: (activeGarden.babyCapybaras ?? 0) >= 1 },
      { icon: "🌲", label: "Forest", unlocked: activeGarden.treeLevel >= 2 },
      { icon: "\uD83C\uDFE1", label: "Cozy Home", unlocked: (activeGarden.homeLevel ?? 0) >= 1 },
      { icon: "♨️", label: "Hot Spring", unlocked: activeGarden.hasCrown },
      { icon: "🌻", label: "Full Garden", unlocked: activeGarden.flowers >= 30 },
    ];
  }, [activeGarden]);

  return (
    <div className="space-y-4">
      {/* Garden Stats Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-foreground">
            Capy&apos;s Garden
            {demoGarden && <span className="text-[10px] font-medium text-orange ml-1.5">(Preview)</span>}
          </h2>
          <p className="text-[10px] text-muted mt-0.5">Log meals &middot; Grow your garden &middot; Unlock rewards</p>
        </div>
        <div className="flex items-center gap-2">
          <StatChip icon="🌸" value={activeGarden.flowers} />
          <StatChip icon="🌳" value={`Lv${activeGarden.treeLevel}`} />
          <StatChip icon="🦋" value={activeGarden.butterflies} />
          {streak.currentStreak > 0 && !demoGarden && (
            <div className="flex items-center gap-1 rounded-full bg-orange-light border border-orange/20 px-2 py-0.5">
              <Flame className="h-3 w-3 text-orange" />
              <span className="text-[10px] font-bold text-orange">{streak.currentStreak}</span>
            </div>
          )}
        </div>
      </div>

      {/* Garden Roadmap — visual milestone journey */}
      <GardenRoadmap garden={activeGarden} streak={streak} />

      {/* 3D Garden Canvas */}
      <div className="relative">
        <CapyGarden
          garden={activeGarden}
          isActive={isActive}
          onCapyTap={handleCapyTap}
        />

        {/* Coach mark for garden — overlays on canvas */}
        {coachMarks?.shouldShow("capy-garden") && (
          <CoachMark
            id="capy-garden"
            text="Log meals daily to grow flowers and unlock milestones"
            visible={true}
            onDismiss={coachMarks.dismiss}
            position="overlay-bottom"
          />
        )}

        {/* Demo mode indicator overlay */}
        {demoGarden && (
          <div className="absolute top-3 left-3">
            <button
              onClick={() => { setDemoGarden(null); setActiveDemo(null); }}
              className="flex items-center gap-1.5 rounded-full bg-orange/90 text-white px-3 py-1 text-[10px] font-bold shadow-lg backdrop-blur-sm transition-all active:scale-95"
            >
              <EyeOff className="h-3 w-3" />
              Exit Preview
            </button>
          </div>
        )}

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

      {/* Garden Health + Talk to Capy — side by side */}
      <div className="grid grid-cols-2 gap-3">
        {/* Garden Health Card */}
        <div className="rounded-2xl bg-card border border-border p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wide">Health</span>
            <span className="text-xs font-extrabold" style={{ color: activeGarden.gardenHealth > 60 ? "#16a34a" : activeGarden.gardenHealth > 30 ? "#ca8a04" : "#ea580c" }}>
              {activeGarden.gardenHealth}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-border overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${activeGarden.gardenHealth}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                backgroundColor: activeGarden.gardenHealth > 60 ? "#16a34a" : activeGarden.gardenHealth > 30 ? "#ca8a04" : "#ea580c",
              }}
            />
          </div>
          <p className="text-[9px] text-muted mt-1.5 leading-snug">
            {activeGarden.gardenHealth > 80
              ? "Thriving! Keep it up!"
              : activeGarden.gardenHealth > 50
              ? "Healthy. Keep logging!"
              : activeGarden.gardenHealth > 30
              ? "Needs attention!"
              : "Wilting! Log a meal!"}
          </p>
        </div>
        {/* Talk to Capy Card */}
        <button
          onClick={handleTalkToCapy}
          className="rounded-2xl bg-gradient-to-br from-accent-light to-[#E8F5E0] border border-accent/15 p-3 flex flex-col items-center justify-center gap-1.5 text-center transition-all active:scale-[0.97] hover:shadow-md"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
            <MessageCircle className="h-4 w-4 text-accent" />
          </div>
          <p className="text-xs font-bold text-foreground">Talk to Capy</p>
          <p className="text-[9px] text-muted leading-tight">Get motivation</p>
        </button>
      </div>

      {/* Preview Garden Button & Panel */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <button
          onClick={() => setShowDemoPanel(!showDemoPanel)}
          className="w-full p-3 flex items-center gap-2 text-left transition-colors hover:bg-border/20"
        >
          <Eye className="h-4 w-4 text-accent" />
          <span className="text-sm font-bold text-foreground flex-1">Preview Garden Stages</span>
          <ChevronRight className={`h-4 w-4 text-muted transition-transform ${showDemoPanel ? "rotate-90" : ""}`} />
        </button>
        <AnimatePresence>
          {showDemoPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-1">
                <p className="text-[10px] text-muted mb-2">Tap to preview how your garden looks at each stage</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {DEMO_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        if (activeDemo === preset.label) {
                          setDemoGarden(null);
                          setActiveDemo(null);
                        } else {
                          setDemoGarden(preset.garden);
                          setActiveDemo(preset.label);
                        }
                      }}
                      className={`flex flex-col items-center gap-0.5 rounded-xl p-1.5 transition-all active:scale-95 ${
                        activeDemo === preset.label
                          ? "bg-accent/20 border border-accent/40 shadow-sm"
                          : "bg-border/20 border border-transparent hover:bg-border/40"
                      }`}
                    >
                      <span className="text-base">{preset.icon}</span>
                      <span className="text-[8px] font-semibold text-foreground text-center leading-tight">{preset.label}</span>
                    </button>
                  ))}
                </div>
                {demoGarden && (
                  <button
                    onClick={() => { setDemoGarden(null); setActiveDemo(null); }}
                    className="mt-2 w-full rounded-lg bg-border/30 py-1.5 text-[10px] font-bold text-muted hover:bg-border/50 transition-colors"
                  >
                    Reset to My Garden
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Next Unlock Card */}
      {nextUnlock && !demoGarden && <NextUnlockCard unlock={nextUnlock} />}

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

  // Determine what unit the milestone tracks
  const isStreak = ["Sapling", "Butterfly", "Forest", "Hot Spring"].includes(unlock.label);
  const isGoal = ["First Flower", "Baby Capy", "Cozy Home", "Full Garden"].includes(unlock.label);

  let hint = "";
  if (isStreak) hint = `Log meals ${remaining} more day${remaining === 1 ? "" : "s"} in a row`;
  else if (isGoal) hint = `Hit your calorie goal ${remaining} more day${remaining === 1 ? "" : "s"}`;
  else hint = `${remaining} more to unlock`;

  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#FFF3E0] to-[#E8F5E0] border border-orange/10 p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{unlock.icon}</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Next: {unlock.label}</p>
          <p className="text-[10px] text-muted">{hint}</p>
          <div className="mt-1.5 h-2 w-full rounded-full bg-white/60 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-accent"
            />
          </div>
          <p className="text-[9px] text-muted mt-1">{unlock.current}/{unlock.target} {isStreak ? "streak days" : isGoal ? "goal days" : ""}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-light" />
      </div>
    </div>
  );
}

const ROADMAP_MILESTONES = [
  { icon: "🌱", label: "Sapling", how: "3-day streak", check: (g: GardenState) => g.treeLevel >= 1 },
  { icon: "🌸", label: "Flower", how: "3 goal days", check: (g: GardenState) => g.flowers >= 3 },
  { icon: "🦋", label: "Butterfly", how: "5-day streak", check: (g: GardenState) => g.butterflies >= 1 },
  { icon: "🐾", label: "Baby Capy", how: "7 goal days", check: (g: GardenState) => (g.babyCapybaras ?? 0) >= 1 },
  { icon: "🌲", label: "Forest", how: "14-day streak", check: (g: GardenState) => g.treeLevel >= 2 },
  { icon: "\uD83C\uDFE1", label: "Home", how: "15 goal days", check: (g: GardenState) => (g.homeLevel ?? 0) >= 1 },
  { icon: "♨️", label: "Hot Spring", how: "30-day streak", check: (g: GardenState) => g.hasCrown },
  { icon: "🌻", label: "Full Garden", how: "30 goal days", check: (g: GardenState) => g.flowers >= 30 },
];

function GardenRoadmap({ garden, streak }: { garden: GardenState; streak: StreakData }) {
  const unlockedCount = ROADMAP_MILESTONES.filter((m) => m.check(garden)).length;
  const totalCount = ROADMAP_MILESTONES.length;

  // Find the index of the next locked milestone (the "active" one)
  const nextIdx = ROADMAP_MILESTONES.findIndex((m) => !m.check(garden));

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <p className="text-[10px] font-bold text-muted uppercase tracking-wide">Your Journey</p>
        <span className="text-[10px] font-bold text-accent">{unlockedCount}/{totalCount}</span>
      </div>
      <div className="px-2 pb-3 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-0 min-w-max px-2 py-2">
          {ROADMAP_MILESTONES.map((m, i) => {
            const unlocked = m.check(garden);
            const isNext = i === nextIdx;
            return (
              <div key={m.label} className="flex items-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex flex-col items-center gap-0.5 w-14 shrink-0 ${
                    isNext ? "" : ""
                  }`}
                >
                  <div
                    className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      unlocked
                        ? "bg-accent-light border-accent/40 shadow-sm"
                        : isNext
                        ? "bg-orange-light/60 border-orange/30 animate-pulse-glow"
                        : "bg-border/30 border-border opacity-40"
                    }`}
                  >
                    <span className={`text-lg ${unlocked ? "" : isNext ? "" : "grayscale"}`}>{m.icon}</span>
                    {unlocked && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center">
                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </div>
                  <span className={`text-[8px] font-bold text-center leading-tight mt-0.5 ${
                    unlocked ? "text-foreground" : isNext ? "text-orange" : "text-muted-light"
                  }`}>
                    {m.label}
                  </span>
                  <span className={`text-[7px] text-center leading-tight ${
                    unlocked ? "text-muted" : isNext ? "text-orange-dim" : "text-muted-light"
                  }`}>
                    {m.how}
                  </span>
                </motion.div>
                {/* Connector line */}
                {i < ROADMAP_MILESTONES.length - 1 && (
                  <div className={`w-3 h-0.5 rounded-full shrink-0 ${
                    unlocked && ROADMAP_MILESTONES[i + 1].check(garden)
                      ? "bg-accent/50"
                      : unlocked
                      ? "bg-accent/30"
                      : "bg-border"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Tip line */}
      {nextIdx >= 0 && (
        <div className="px-4 pb-3">
          <div className="rounded-xl bg-gradient-to-r from-orange-light/50 to-accent-light/30 px-3 py-2">
            <p className="text-[10px] text-foreground">
              <span className="font-bold">Next:</span> {ROADMAP_MILESTONES[nextIdx].icon} {ROADMAP_MILESTONES[nextIdx].label} &mdash; <span className="text-muted">{ROADMAP_MILESTONES[nextIdx].how}</span>
            </p>
          </div>
        </div>
      )}
      {nextIdx === -1 && (
        <div className="px-4 pb-3">
          <div className="rounded-xl bg-accent-light/40 px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-accent">All milestones unlocked! Your garden is complete!</p>
          </div>
        </div>
      )}
      {/* How it works — expandable */}
      <HowItWorksToggle />
    </div>
  );
}

function HowItWorksToggle() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold text-muted hover:text-foreground transition-colors"
      >
        How does this work?
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-3 w-3" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2.5">
              <div className="flex items-start gap-2">
                <span className="text-sm mt-0.5">🔥</span>
                <p className="text-[10px] text-muted leading-relaxed">
                  <strong className="text-foreground">Streaks</strong> Log at least one meal every day to build your streak. Longer streaks unlock 🌱 Sapling, 🦋 Butterfly, 🌲 Forest, and ♨️ Hot Spring. Miss a day? Your streak resets, but you can always start fresh!
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sm mt-0.5">🎯</span>
                <p className="text-[10px] text-muted leading-relaxed">
                  <strong className="text-foreground">Calorie goals</strong> Eat within 80–120% of your daily target. Each day you hit it counts as a &quot;goal day&quot; and grows your garden: 3 goal days = 🌸 Flowers, 7 = 🐾 Baby Capy, 15 = 🏡 Home, 30 = 🌻 Full Garden.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sm mt-0.5">💡</span>
                <p className="text-[10px] text-muted leading-relaxed">
                  <strong className="text-foreground">Good to know:</strong> Streak unlocks disappear if you break your streak, so keep logging! Goal-day unlocks are permanent and yours to keep forever.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

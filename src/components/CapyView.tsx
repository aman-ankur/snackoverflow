"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, TreePine, Flower2, Fish, Sparkles, MessageCircle, Trophy, ChevronRight, Eye, EyeOff, HelpCircle, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import { useGardenState, type GardenState, type GardenEvent, type NextUnlock } from "@/lib/useGardenState";
import { getContextualMotivation } from "@/lib/capyMotivation";
import type { MealTotals, NutritionGoals, StreakData } from "@/lib/dishTypes";

// ── Demo garden presets for each achievement stage ────────────────────
const DEMO_PRESETS: { label: string; icon: string; garden: GardenState }[] = [
  {
    label: "First Flower",
    icon: "🌸",
    garden: { flowers: 3, treeLevel: 0, pondLevel: 0, butterflies: 0, hasRainbow: false, hasCrown: false, gardenHealth: 60, totalMealsLogged: 3, daysGoalHit: 3, lastComputedDate: "", journal: [], babyCapybaras: 0, homeLevel: 0 },
  },
  {
    label: "Sapling",
    icon: "🌳",
    garden: { flowers: 5, treeLevel: 1, pondLevel: 0, butterflies: 2, hasRainbow: false, hasCrown: false, gardenHealth: 68, totalMealsLogged: 8, daysGoalHit: 5, lastComputedDate: "", journal: [], babyCapybaras: 0, homeLevel: 0 },
  },
  {
    label: "Rainbow",
    icon: "🌈",
    garden: { flowers: 10, treeLevel: 2, pondLevel: 0, butterflies: 3, hasRainbow: true, hasCrown: false, gardenHealth: 75, totalMealsLogged: 15, daysGoalHit: 10, lastComputedDate: "", journal: [], babyCapybaras: 0, homeLevel: 0 },
  },
  {
    label: "Forest",
    icon: "🌲",
    garden: { flowers: 15, treeLevel: 3, pondLevel: 0, butterflies: 4, hasRainbow: true, hasCrown: false, gardenHealth: 80, totalMealsLogged: 25, daysGoalHit: 15, lastComputedDate: "", journal: [], babyCapybaras: 0, homeLevel: 1 },
  },
  {
    label: "Baby Capy",
    icon: "🐾",
    garden: { flowers: 18, treeLevel: 3, pondLevel: 1, butterflies: 4, hasRainbow: true, hasCrown: false, gardenHealth: 85, totalMealsLogged: 30, daysGoalHit: 18, lastComputedDate: "", journal: [], babyCapybaras: 2, homeLevel: 1 },
  },
  {
    label: "Cozy Home",
    icon: "\uD83C\uDFE1",
    garden: { flowers: 22, treeLevel: 4, pondLevel: 2, butterflies: 5, hasRainbow: true, hasCrown: false, gardenHealth: 90, totalMealsLogged: 40, daysGoalHit: 22, lastComputedDate: "", journal: [], babyCapybaras: 3, homeLevel: 2 },
  },
  {
    label: "Hot Spring",
    icon: "♨️",
    garden: { flowers: 26, treeLevel: 4, pondLevel: 3, butterflies: 5, hasRainbow: true, hasCrown: true, gardenHealth: 95, totalMealsLogged: 60, daysGoalHit: 26, lastComputedDate: "", journal: [], babyCapybaras: 3, homeLevel: 3 },
  },
  {
    label: "Full Garden",
    icon: "🌻",
    garden: { flowers: 30, treeLevel: 4, pondLevel: 3, butterflies: 5, hasRainbow: true, hasCrown: true, gardenHealth: 100, totalMealsLogged: 100, daysGoalHit: 30, lastComputedDate: "", journal: [], babyCapybaras: 3, homeLevel: 3 },
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
}

export default function CapyView({ streak, todayTotals, goals, isActive }: CapyViewProps) {
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
      { icon: "🌸", label: "First Flower", unlocked: activeGarden.flowers >= 1 },
      { icon: "🌳", label: "Sapling", unlocked: activeGarden.treeLevel >= 1 },
      { icon: "🌈", label: "Rainbow", unlocked: activeGarden.hasRainbow },
      { icon: "🌲", label: "Forest", unlocked: activeGarden.treeLevel >= 3 },
      { icon: "🐾", label: "Baby Capy", unlocked: (activeGarden.babyCapybaras ?? 0) >= 1 },
      { icon: "\uD83C\uDFE1", label: "Cozy Home", unlocked: (activeGarden.homeLevel ?? 0) >= 1 },
      { icon: "♨️", label: "Hot Spring", unlocked: activeGarden.hasCrown },
      { icon: "🌻", label: "Full Garden", unlocked: activeGarden.flowers >= 30 },
    ];
  }, [activeGarden]);

  return (
    <div className="space-y-4">
      {/* Garden Stats Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-foreground">
          Capy&apos;s Garden
          {demoGarden && <span className="text-[10px] font-medium text-orange ml-1.5">(Preview)</span>}
        </h2>
        <div className="flex items-center gap-3">
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

      {/* 3D Garden Canvas */}
      <div className="relative">
        <CapyGarden
          garden={activeGarden}
          isActive={isActive}
          onCapyTap={handleCapyTap}
        />

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
          <span className="text-xs font-bold" style={{ color: activeGarden.gardenHealth > 60 ? "#16a34a" : activeGarden.gardenHealth > 30 ? "#ca8a04" : "#ea580c" }}>
            {activeGarden.gardenHealth}%
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
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
        <p className="text-[10px] text-muted mt-1.5">
          {activeGarden.gardenHealth > 80
            ? "Your garden is thriving! Keep it up!"
            : activeGarden.gardenHealth > 50
            ? "Garden is healthy. Log meals to keep it growing!"
            : activeGarden.gardenHealth > 30
            ? "Garden needs attention. Log a meal to help!"
            : "Garden is wilting! Log meals to revive it!"}
        </p>
      </div>

      {/* How It Works */}
      <HowItWorks />
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
  const isStreak = ["First Butterfly", "Baby Capybara", "Rainbow Arc", "Hot Spring"].includes(unlock.label);
  const isFlower = unlock.label.includes("Garden") || unlock.label.includes("flower");
  const isTree = unlock.label.includes("Tree");

  let hint = "";
  if (isStreak) hint = `Log meals ${remaining} more day${remaining === 1 ? "" : "s"} in a row`;
  else if (isFlower) hint = `Hit your calorie goal ${remaining} more day${remaining === 1 ? "" : "s"}`;
  else if (isTree) hint = `Hit 90%+ protein goal ${remaining} more day${remaining === 1 ? "" : "s"}`;
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
          <p className="text-[9px] text-muted mt-1">{unlock.current}/{unlock.target} {isStreak ? "streak days" : isFlower ? "goal days" : isTree ? "protein days" : ""}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-light" />
      </div>
    </div>
  );
}

function HowItWorks() {
  const [open, setOpen] = useState(false);

  const milestones = [
    { icon: "🦋", name: "First Butterfly", how: "Log meals 3 days in a row (streak)" },
    { icon: "🐾", name: "Baby Capybara", how: "5-day meal logging streak" },
    { icon: "🌈", name: "Rainbow", how: "14-day streak" },
    { icon: "♨️", name: "Hot Spring", how: "30-day streak" },
    { icon: "🌸", name: "Flowers", how: "Hit your daily calorie goal (80–120%). 1 flower per day, up to 30" },
    { icon: "🌳", name: "Tree Growth", how: "Hit 90%+ of your protein goal. Grows through 4 levels" },
    { icon: "🏡", name: "Cozy Home", how: "Log 5 / 15 / 30 total meals (any pace)" },
  ];

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 p-4 text-left"
      >
        <HelpCircle className="h-4 w-4 text-accent shrink-0" />
        <h3 className="text-sm font-bold text-foreground flex-1">How It Works</h3>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-muted" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <p className="text-[11px] text-muted leading-relaxed">
                Your garden grows as you log meals and hit nutrition goals. <strong>Streaks</strong> are consecutive days with at least one meal logged. Missing a day resets your streak but doesn&apos;t remove unlocked items.
              </p>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-foreground uppercase tracking-wide">Milestones</p>
                {milestones.map((m) => (
                  <div key={m.name} className="flex items-start gap-2">
                    <span className="text-sm shrink-0 mt-0.5">{m.icon}</span>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground">{m.name}</p>
                      <p className="text-[10px] text-muted leading-snug">{m.how}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-accent-light/30 p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-foreground">FAQ</p>
                <div>
                  <p className="text-[10px] font-semibold text-foreground">What if I lose my streak?</p>
                  <p className="text-[10px] text-muted leading-snug">Streak-based unlocks (butterflies, baby capybaras, rainbow, hot spring) require an active streak. If your streak resets, they&apos;ll disappear until you rebuild it. But total-based unlocks (flowers, home, tree) are permanent.</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-foreground">What counts as logging a meal?</p>
                  <p className="text-[10px] text-muted leading-snug">Scanning your fridge or manually adding any meal (breakfast, lunch, snack, dinner) counts. One meal per day is enough to keep your streak.</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-foreground">Why is my garden wilting?</p>
                  <p className="text-[10px] text-muted leading-snug">Garden health drops when you miss days. Log a meal to start recovering it!</p>
                </div>
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

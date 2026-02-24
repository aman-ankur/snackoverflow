"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Clock, ChevronDown, ChevronRight, Target, BarChart3 } from "lucide-react";
import CapyLottie from "@/components/CapyLottie";
import CalendarProgressView from "@/components/CalendarProgressView";
import CoachMark from "@/components/CoachMark";
import EatingAnalysisCard from "@/components/EatingAnalysisCard";
import type { LoggedMeal, MealTotals, NutritionGoals, StreakData, HealthProfile, EatingAnalysis } from "@/lib/dishTypes";
import type { CoachMarkId } from "@/lib/useCoachMarks";

interface EatingAnalysisHook {
  analyses: EatingAnalysis[];
  isGenerating: boolean;
  error: string | null;
  generate: (
    windowDays: number,
    meals: LoggedMeal[],
    goals: NutritionGoals,
    healthProfile: HealthProfile | null
  ) => Promise<EatingAnalysis | null>;
  getLatest: (windowDays?: number) => EatingAnalysis | null;
  isCacheFresh: (windowDays: number, meals: LoggedMeal[]) => boolean;
}

interface ProgressViewProps {
  todayTotals: MealTotals;
  goals: NutritionGoals;
  streak: StreakData;
  meals: LoggedMeal[];
  weeklyByDate: { date: string; totals: MealTotals }[];
  repeatedDishes: { dish: string; count: number }[];
  coachMarks?: { shouldShow: (id: CoachMarkId) => boolean; dismiss: (id: CoachMarkId) => void };
  healthProfile: HealthProfile | null;
  hasHealthProfile: boolean;
  eatingAnalysis: EatingAnalysisHook;
  onViewAnalysisReport: (analysis: EatingAnalysis, windowLabel: string) => void;
}

/* ─── helpers ─── */

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function getISOWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string): string {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  if (dateStr === todayKey) return "Today";

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().slice(0, 10)) return "Yesterday";

  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

/* ─── Calorie Trend Card ─── */

interface CalorieTrendProps {
  meals: LoggedMeal[];
  weeklyByDate: { date: string; totals: MealTotals }[];
  goals: NutritionGoals;
}

function CalorieTrendCard({ meals, weeklyByDate, goals }: CalorieTrendProps) {
  const [trendView, setTrendView] = useState<"7d" | "4w">("7d");

  // 7-day data: pad to 7 days (Mon–Sun of current week)
  const dailyData = useMemo(() => {
    const now = new Date();
    const weekStartDate = new Date(now);
    const day = weekStartDate.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStartDate.setDate(weekStartDate.getDate() + diff);
    weekStartDate.setHours(0, 0, 0, 0);

    const todayKey = now.toISOString().slice(0, 10);
    const byDateMap = new Map(weeklyByDate.map((d) => [d.date, d.totals.calories]));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStartDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const isFuture = dateStr > todayKey;
      return {
        label: DAYS_SHORT[i],
        dateStr,
        calories: isFuture ? 0 : (byDateMap.get(dateStr) || 0),
        isToday: dateStr === todayKey,
        isFuture,
      };
    });
  }, [weeklyByDate]);

  // 4-week data: group meals into ISO weeks
  const weeklyData = useMemo(() => {
    const weekMap = new Map<string, { totalCal: number; daysWithData: Set<string> }>();

    meals.forEach((meal) => {
      const mealDate = new Date(meal.loggedAt);
      const weekStart = getISOWeekStart(mealDate);
      const existing = weekMap.get(weekStart) || { totalCal: 0, daysWithData: new Set<string>() };
      existing.totalCal += meal.totals.calories;
      existing.daysWithData.add(getDateKey(meal.loggedAt));
      weekMap.set(weekStart, existing);
    });

    const sorted = Array.from(weekMap.entries())
      .sort((a, b) => (a[0] > b[0] ? -1 : 1))
      .slice(0, 4)
      .reverse();

    return sorted.map(([weekStart, data]) => {
      const startDate = new Date(weekStart + "T00:00:00");
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      const label = `${startDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`;
      const avgPerDay = data.daysWithData.size > 0 ? Math.round(data.totalCal / data.daysWithData.size) : 0;
      return { label, weekStart, avgPerDay, totalCal: data.totalCal, daysCount: data.daysWithData.size };
    });
  }, [meals]);

  const chartData = trendView === "7d" ? dailyData : weeklyData;
  const values = trendView === "7d"
    ? dailyData.map((d) => d.calories)
    : weeklyData.map((d) => d.avgPerDay);

  const maxVal = Math.max(goals.calories, ...values, 1);

  // Trend insight
  const trendInsight = useMemo(() => {
    if (trendView === "7d") {
      // Compare current week avg vs prior 7 days
      const currentDays = dailyData.filter((d) => !d.isFuture && d.calories > 0);
      const currentAvg = currentDays.length > 0
        ? Math.round(currentDays.reduce((s, d) => s + d.calories, 0) / currentDays.length)
        : 0;

      // Prior week: meals older than current week start
      const currentWeekStart = dailyData[0]?.dateStr || "";
      const priorMeals = meals.filter((m) => getDateKey(m.loggedAt) < currentWeekStart);
      const priorDayMap = new Map<string, number>();
      priorMeals.forEach((m) => {
        const key = getDateKey(m.loggedAt);
        priorDayMap.set(key, (priorDayMap.get(key) || 0) + m.totals.calories);
      });
      // Take only last 7 days before current week
      const priorDays = Array.from(priorDayMap.entries())
        .sort((a, b) => (a[0] > b[0] ? -1 : 1))
        .slice(0, 7);
      const priorAvg = priorDays.length > 0
        ? Math.round(priorDays.reduce((s, [, cal]) => s + cal, 0) / priorDays.length)
        : 0;

      if (priorAvg === 0) return { direction: "neutral" as const, percent: 0, currentAvg, priorAvg, label: "No prior data to compare" };
      const change = Math.round(((currentAvg - priorAvg) / priorAvg) * 100);
      return {
        direction: change >= 0 ? "up" as const : "down" as const,
        percent: Math.abs(change),
        currentAvg,
        priorAvg,
        label: change >= 0 ? `Up ${Math.abs(change)}% vs last week` : `Down ${Math.abs(change)}% vs last week`,
      };
    } else {
      if (weeklyData.length < 2) return { direction: "neutral" as const, percent: 0, currentAvg: weeklyData[weeklyData.length - 1]?.avgPerDay || 0, priorAvg: 0, label: "Not enough data" };
      const current = weeklyData[weeklyData.length - 1].avgPerDay;
      const prior = weeklyData[weeklyData.length - 2].avgPerDay;
      if (prior === 0) return { direction: "neutral" as const, percent: 0, currentAvg: current, priorAvg: 0, label: "No prior data" };
      const change = Math.round(((current - prior) / prior) * 100);
      return {
        direction: change >= 0 ? "up" as const : "down" as const,
        percent: Math.abs(change),
        currentAvg: current,
        priorAvg: prior,
        label: change >= 0 ? `Up ${Math.abs(change)}% vs prior week` : `Down ${Math.abs(change)}% vs prior week`,
      };
    }
  }, [trendView, dailyData, weeklyData, meals]);

  const barCount = chartData.length;
  if (barCount === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <span className="text-[13px] font-extrabold text-foreground">Calorie Trend</span>
        </div>
        <p className="text-xs text-muted text-center py-4">No data yet. Start logging meals!</p>
      </div>
    );
  }

  // SVG chart dimensions
  const svgW = 340;
  const svgH = 110;
  const leftPad = 32;
  const rightPad = 10;
  const topPad = 8;
  const bottomPad = 4;
  const chartW = svgW - leftPad - rightPad;
  const chartH = svgH - topPad - bottomPad;
  const barGap = 6;
  const barW = Math.min(28, (chartW - barGap * (barCount - 1)) / barCount);
  const totalBarsWidth = barCount * barW + (barCount - 1) * barGap;
  const startX = leftPad + (chartW - totalBarsWidth) / 2;

  const getY = (val: number) => topPad + chartH - (val / maxVal) * chartH;
  const goalY = getY(goals.calories);

  // Y-axis labels
  const yLabels = [
    { val: Math.round(maxVal), y: topPad + 4 },
    { val: Math.round(maxVal * 0.66), y: topPad + chartH * 0.34 },
    { val: Math.round(maxVal * 0.33), y: topPad + chartH * 0.67 },
  ];

  // Bar + line points
  const points = chartData.map((item, i) => {
    const val = trendView === "7d" ? (item as typeof dailyData[0]).calories : (item as typeof weeklyData[0]).avgPerDay;
    const cx = startX + i * (barW + barGap) + barW / 2;
    const cy = val > 0 ? getY(val) : topPad + chartH;
    const barHeight = val > 0 ? (val / maxVal) * chartH : 0;
    const barY = topPad + chartH - barHeight;
    const isOverGoal = val > goals.calories;
    const isToday = trendView === "7d" && (item as typeof dailyData[0]).isToday;
    const isFuture = trendView === "7d" && (item as typeof dailyData[0]).isFuture;
    return { cx, cy, barY, barHeight, barW, val, isOverGoal, isToday, isFuture, label: item.label };
  });

  const linePoints = points.filter((p) => !p.isFuture && p.val > 0).map((p) => `${p.cx},${p.cy}`).join(" ");

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-accent" />
          <span className="text-[13px] font-extrabold text-foreground">Calorie Trend</span>
        </div>
        <div className="flex gap-0.5 bg-background border border-border rounded-md p-0.5">
          {(["7d", "4w"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setTrendView(v)}
              className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                trendView === v
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-light hover:text-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Trend Insight Badge */}
      {trendInsight.direction !== "neutral" && (
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg mb-3 ${
          trendInsight.direction === "up"
            ? "bg-accent/5 border border-accent/10"
            : "bg-red-50 border border-red-100"
        }`}>
          <div className={`flex h-5 w-5 items-center justify-center rounded-md ${
            trendInsight.direction === "up" ? "bg-accent/10" : "bg-red-100"
          }`}>
            <TrendingUp className={`h-3 w-3 ${
              trendInsight.direction === "up" ? "text-accent-dim" : "text-red-500 rotate-180"
            }`} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-foreground">{trendInsight.label}</p>
            <p className="text-[10px] text-muted">
              Avg {trendInsight.currentAvg} kcal/day vs {trendInsight.priorAvg} prior
            </p>
          </div>
        </div>
      )}
      {trendInsight.direction === "neutral" && (
        <p className="text-[10px] text-muted mb-3">{trendInsight.label}</p>
      )}

      {/* SVG Chart */}
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ height: 120 }} preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yLabels.map((yl) => (
          <line key={yl.val} x1={leftPad} y1={yl.y} x2={svgW - rightPad} y2={yl.y} stroke="#EEE9E1" strokeWidth={0.5} />
        ))}
        {/* Y-axis labels */}
        {yLabels.map((yl) => (
          <text key={`t-${yl.val}`} x={leftPad - 4} y={yl.y + 3} textAnchor="end" fontSize={8} fill="#7A756F" fontWeight={500}>
            {yl.val >= 1000 ? `${(yl.val / 1000).toFixed(1)}k` : yl.val}
          </text>
        ))}
        {/* Goal dashed line */}
        <line x1={leftPad} y1={goalY} x2={svgW - rightPad} y2={goalY} stroke="var(--color-accent)" strokeWidth={1} strokeDasharray="4 3" opacity={0.35} />
        <text x={svgW - rightPad + 2} y={goalY + 3} fontSize={7} fill="var(--color-accent)" fontWeight={600} opacity={0.5}>Goal</text>

        {/* Bars */}
        {points.map((p, i) => (
          <motion.rect
            key={i}
            x={p.cx - p.barW / 2}
            y={p.barY}
            width={p.barW}
            rx={3}
            ry={3}
            initial={{ height: 0, y: topPad + chartH }}
            animate={{ height: Math.max(p.barHeight, 0), y: p.barY }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
            fill={p.isFuture ? "transparent" : p.isOverGoal ? "var(--color-orange)" : "var(--color-accent)"}
            opacity={p.isFuture ? 0 : p.isToday ? 0.5 : 0.2}
          />
        ))}

        {/* Trend line */}
        {linePoints && (
          <motion.polyline
            points={linePoints}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        )}

        {/* Dots */}
        {points.filter((p) => !p.isFuture && p.val > 0).map((p, i) => (
          <circle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r={p.isToday ? 3.5 : 2.5}
            fill={p.isToday ? "var(--color-accent)" : "var(--color-bg, #F5F2EB)"}
            stroke={p.isOverGoal ? "var(--color-orange)" : "var(--color-accent)"}
            strokeWidth={1.5}
          />
        ))}

        {/* Today value label */}
        {trendView === "7d" && (() => {
          const todayPoint = points.find((p) => p.isToday && p.val > 0);
          if (!todayPoint) return null;
          return (
            <text x={todayPoint.cx} y={todayPoint.cy - 8} textAnchor="middle" fontSize={8} fill="var(--color-accent-dim, #489848)" fontWeight={800}>
              {todayPoint.val.toLocaleString()}
            </text>
          );
        })()}
      </svg>

      {/* Day labels */}
      <div className="flex justify-between px-1 mt-1">
        {points.map((p, i) => (
          <span
            key={i}
            className={`text-[9px] font-semibold text-center ${
              p.isToday ? "text-accent-dim" : p.isFuture ? "text-muted-light/40" : "text-muted-light"
            }`}
            style={{ width: barW, flexShrink: 0 }}
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

export default function ProgressView({
  todayTotals,
  goals,
  streak,
  meals,
  weeklyByDate,
  repeatedDishes,
  coachMarks,
  healthProfile,
  hasHealthProfile,
  eatingAnalysis,
  onViewAnalysisReport,
}: ProgressViewProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return todayKey;
  });
  const [showAllHistory, setShowAllHistory] = useState(false);

  const weeklyAvgCalories = useMemo(() => {
    if (weeklyByDate.length === 0) return 0;
    const total = weeklyByDate.reduce((sum, d) => sum + d.totals.calories, 0);
    return Math.round(total / weeklyByDate.length);
  }, [weeklyByDate]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, LoggedMeal[]>();
    meals.forEach((meal) => {
      const date = meal.loggedAt.slice(0, 10);
      const bucket = map.get(date) || [];
      bucket.push(meal);
      map.set(date, bucket);
    });
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [meals]);

  const visibleHistory = showAllHistory ? groupedByDate : groupedByDate.slice(0, 5);
  const kcalToGo = Math.max(0, Math.round(goals.calories - todayTotals.calories));

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-foreground">Progress</h2>
          <p className="text-xs text-muted mt-0.5">Your nutrition insights</p>
        </div>
        <CapyLottie src="/model/cute-cat.json" size={48} />
      </div>

      {/* 1. AI Eating Analysis (hero) */}
      <EatingAnalysisCard
        meals={meals}
        goals={goals}
        healthProfile={healthProfile}
        hasHealthProfile={hasHealthProfile}
        latestAnalysis={eatingAnalysis.getLatest()}
        isGenerating={eatingAnalysis.isGenerating}
        error={eatingAnalysis.error}
        isCacheFresh={eatingAnalysis.isCacheFresh}
        onGenerate={eatingAnalysis.generate}
        onViewReport={onViewAnalysisReport}
      />

      {/* 2. Activity Calendar + Top Dishes */}
      <CalendarProgressView meals={meals} goals={goals} />
      {coachMarks?.shouldShow("progress-rings") && (
        <CoachMark
          id="progress-rings"
          text="Each ring shows your daily calories, protein, and carbs"
          visible={true}
          onDismiss={coachMarks.dismiss}
        />
      )}

      {/* 3. Calorie Trend */}
      <CalorieTrendCard meals={meals} weeklyByDate={weeklyByDate} goals={goals} />

      {/* 4. Stats Row (3 boxes) */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-gradient-to-br from-accent-light/30 to-white border border-accent/10 p-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 mb-1.5">
            <Target className="h-3 w-3 text-accent-dim" />
          </div>
          <p className="text-lg font-extrabold text-foreground leading-tight">{kcalToGo.toLocaleString()}</p>
          <p className="text-[10px] text-muted">kcal to go</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-accent-light/20 to-white border border-accent/10 p-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 mb-1.5">
            <BarChart3 className="h-3 w-3 text-accent" />
          </div>
          <p className="text-[15px] font-extrabold text-foreground leading-tight">{Math.round(todayTotals.calories).toLocaleString()}</p>
          <p className="text-[10px] text-muted">kcal today</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-orange-light/20 to-white border border-orange/10 p-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange/10 mb-1.5">
            <TrendingUp className="h-3 w-3 text-orange" />
          </div>
          <p className="text-[15px] font-extrabold text-foreground leading-tight">{weeklyAvgCalories.toLocaleString()}</p>
          <p className="text-[10px] text-muted">avg/day (7d)</p>
        </div>
      </div>

      {/* 5. Meal History Accordion */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="h-4 w-4 text-accent" />
          <span className="text-[13px] font-extrabold text-foreground">Meal History</span>
        </div>

        {groupedByDate.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-4">
            <p className="text-xs text-muted text-center">No meal history yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleHistory.map(([date, dayMeals]) => {
              const isOpen = expandedDate === date;
              const totalCal = Math.round(dayMeals.reduce((s, m) => s + m.totals.calories, 0));
              return (
                <div key={date} className="rounded-xl bg-card border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedDate(isOpen ? null : date)}
                    className="flex items-center justify-between w-full px-3.5 py-3 text-left"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-foreground">{formatDateLabel(date)}</span>
                      <span className="text-[10px] text-muted ml-1">
                        · {dayMeals.length} meal{dayMeals.length !== 1 ? "s" : ""} · {totalCal.toLocaleString()} kcal
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-light shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-light shrink-0" />
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
                        <div className="px-3.5 pb-3 space-y-0">
                          {dayMeals.map((meal, i) => {
                            const mainDish = meal.dishes.map((d) => d.name).join(", ") || "Meal";
                            return (
                              <div key={meal.id} className={`py-2 ${i > 0 ? "border-t border-border" : ""}`}>
                                <p className="text-[11px] font-semibold text-foreground">{mainDish}</p>
                                <p className="text-[10px] text-muted">
                                  {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)} · {Math.round(meal.totals.calories)} kcal · P {Math.round(meal.totals.protein)}g · C {Math.round(meal.totals.carbs)}g
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {!showAllHistory && groupedByDate.length > 5 && (
              <button
                onClick={() => setShowAllHistory(true)}
                className="flex items-center justify-center gap-1 w-full py-2.5 rounded-xl bg-background border border-border text-[11px] font-semibold text-muted hover:text-foreground transition-colors"
              >
                Show older meals
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

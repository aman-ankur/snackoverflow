"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X, Flame, Dumbbell, Wheat } from "lucide-react";
import type { LoggedMeal, MealTotals, NutritionGoals } from "@/lib/dishTypes";

/* ─── helpers ─── */

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/* ─── Ring SVG ─── */

interface RingProps {
  percent: number;
  radius: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
}

function Ring({ percent, radius, strokeWidth, color, trackColor }: RingProps) {
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  const offset = circumference - (clampedPercent / 100) * circumference;

  return (
    <>
      <circle
        cx="50%"
        cy="50%"
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx="50%"
        cy="50%"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </>
  );
}

/* ─── Activity Rings (3 concentric) ─── */

interface ActivityRingsProps {
  calPercent: number;
  proteinPercent: number;
  carbsPercent: number;
  size: number;
  hasData: boolean;
}

function ActivityRings({ calPercent, proteinPercent, carbsPercent, size, hasData }: ActivityRingsProps) {
  const sw = size >= 40 ? 3.5 : 2.5;
  const gap = sw + 1.5;
  const outerR = (size / 2) - sw;
  const midR = outerR - gap;
  const innerR = midR - gap;

  const trackAlpha = hasData ? "0.15" : "0.08";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <Ring
        percent={hasData ? calPercent : 0}
        radius={outerR}
        strokeWidth={sw}
        color="var(--color-accent)"
        trackColor={`rgba(90,172,90,${trackAlpha})`}
      />
      <Ring
        percent={hasData ? proteinPercent : 0}
        radius={midR}
        strokeWidth={sw}
        color="var(--color-orange)"
        trackColor={`rgba(240,140,66,${trackAlpha})`}
      />
      <Ring
        percent={hasData ? carbsPercent : 0}
        radius={innerR}
        strokeWidth={sw}
        color="#E8B931"
        trackColor={`rgba(232,185,49,${trackAlpha})`}
      />
    </svg>
  );
}

/* ─── Bottom Sheet ─── */

interface DayDetailSheetProps {
  dateStr: string;
  totals: MealTotals;
  goals: NutritionGoals;
  meals: LoggedMeal[];
  onClose: () => void;
}

function MacroRingLarge({ label, value, max, color, trackColor, icon }: {
  label: string;
  value: number;
  max: number;
  color: string;
  trackColor: string;
  icon: React.ReactNode;
}) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const r = 28;
  const sw = 5;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;
  const svgSize = (r + sw) * 2 + 4;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="-rotate-90">
          <circle cx={svgSize / 2} cy={svgSize / 2} r={r} fill="none" stroke={trackColor} strokeWidth={sw} />
          <motion.circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-xs font-bold text-foreground">{Math.round(value)}<span className="text-muted font-normal">/{max}</span></p>
      <p className="text-[10px] text-muted">{label}</p>
      <p className="text-[10px] font-semibold" style={{ color }}>{Math.round(percent)}%</p>
    </div>
  );
}

function DayDetailSheet({ dateStr, totals, goals, meals, onClose }: DayDetailSheetProps) {
  const dayMeals = useMemo(
    () => meals.filter((m) => getDateKey(m.loggedAt) === dateStr),
    [meals, dateStr]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full max-w-lg rounded-t-3xl bg-card border-t border-border p-5 pb-8 max-h-[75vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-foreground">{formatDate(dateStr)}</h3>
            <p className="text-xs text-muted mt-0.5">
              {dayMeals.length} meal{dayMeals.length !== 1 ? "s" : ""} logged
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-border p-2 text-muted hover:text-foreground hover:bg-card-hover transition-all active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Macro Rings Row */}
        <div className="flex items-center justify-around mb-5">
          <MacroRingLarge
            label="Calories"
            value={totals.calories}
            max={goals.calories}
            color="var(--color-accent)"
            trackColor="rgba(90,172,90,0.15)"
            icon={<Flame className="h-4 w-4 text-accent" />}
          />
          <MacroRingLarge
            label="Protein"
            value={totals.protein}
            max={goals.protein}
            color="var(--color-orange)"
            trackColor="rgba(240,140,66,0.15)"
            icon={<Dumbbell className="h-4 w-4 text-orange" />}
          />
          <MacroRingLarge
            label="Carbs"
            value={totals.carbs}
            max={goals.carbs}
            color="#E8B931"
            trackColor="rgba(232,185,49,0.15)"
            icon={<Wheat className="h-4 w-4" style={{ color: "#E8B931" }} />}
          />
        </div>

        {/* Fat + Fiber row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-background border border-border p-3 text-center">
            <p className="text-lg font-bold text-foreground">{Math.round(totals.fat)}g</p>
            <p className="text-[10px] text-muted">Fat / {goals.fat}g</p>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-border overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: "#D07A3E" }}
                initial={{ width: 0 }}
                animate={{ width: `${goals.fat > 0 ? Math.min((totals.fat / goals.fat) * 100, 100) : 0}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
          <div className="rounded-xl bg-background border border-border p-3 text-center">
            <p className="text-lg font-bold text-foreground">{Math.round(totals.fiber)}g</p>
            <p className="text-[10px] text-muted">Fiber</p>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-border overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totals.fiber / 30) * 100, 100)}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
        </div>

        {/* Meal list */}
        {dayMeals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wide">Meals</h4>
            {dayMeals.map((meal) => {
              const time = new Date(meal.loggedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <div key={meal.id} className="rounded-xl bg-background border border-border px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-muted-light mb-1">
                    {meal.mealType} &middot; {time}
                  </p>
                  <p className="text-xs font-semibold text-foreground">
                    {meal.dishes.map((d) => d.name).join(", ")}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">
                    {Math.round(meal.totals.calories)} kcal &middot; P {Math.round(meal.totals.protein)}g &middot; C {Math.round(meal.totals.carbs)}g &middot; F {Math.round(meal.totals.fat)}g
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {dayMeals.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-muted">No meals logged this day</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Component ─── */

interface CalendarProgressViewProps {
  meals: LoggedMeal[];
  goals: NutritionGoals;
}

export default function CalendarProgressView({ meals, goals }: CalendarProgressViewProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(currentYear);
  const [expanded, setExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build daily totals map from all meals
  const dailyTotals = useMemo(() => {
    const map = new Map<string, MealTotals>();
    meals.forEach((meal) => {
      const key = getDateKey(meal.loggedAt);
      const existing = map.get(key) || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      map.set(key, {
        calories: existing.calories + meal.totals.calories,
        protein: existing.protein + meal.totals.protein,
        carbs: existing.carbs + meal.totals.carbs,
        fat: existing.fat + meal.totals.fat,
        fiber: existing.fiber + meal.totals.fiber,
      });
    });
    return map;
  }, [meals]);

  // Current week days (Mon-Sun)
  const weekDays = useMemo(() => {
    const start = startOfWeek(today);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return {
        dateStr: d.toISOString().slice(0, 10),
        day: d.getDate(),
        isToday: d.toISOString().slice(0, 10) === today.toISOString().slice(0, 10),
        isFuture: d > today,
      };
    });
  }, [today]);

  // Month grid
  const monthGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const todayStr = today.toISOString().slice(0, 10);

    const cells: Array<{
      dateStr: string;
      day: number;
      isToday: boolean;
      isFuture: boolean;
      isCurrentMonth: boolean;
    } | null> = [];

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const cellDate = new Date(viewYear, viewMonth, d);
      cells.push({
        dateStr,
        day: d,
        isToday: dateStr === todayStr,
        isFuture: cellDate > today,
        isCurrentMonth: true,
      });
    }

    return cells;
  }, [viewYear, viewMonth, today]);

  const canGoPrev = viewYear > currentYear || (viewYear === currentYear && viewMonth > 0);
  const canGoNext = viewYear < currentYear || (viewYear === currentYear && viewMonth < today.getMonth());

  const goPrev = useCallback(() => {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [canGoPrev, viewMonth]);

  const goNext = useCallback(() => {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [canGoNext, viewMonth]);

  const getRingPercents = useCallback(
    (dateStr: string) => {
      const t = dailyTotals.get(dateStr);
      if (!t) return { cal: 0, protein: 0, carbs: 0, hasData: false };
      return {
        cal: goals.calories > 0 ? (t.calories / goals.calories) * 100 : 0,
        protein: goals.protein > 0 ? (t.protein / goals.protein) * 100 : 0,
        carbs: goals.carbs > 0 ? (t.carbs / goals.carbs) * 100 : 0,
        hasData: true,
      };
    },
    [dailyTotals, goals]
  );

  const selectedTotals = useMemo(() => {
    if (!selectedDate) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    return dailyTotals.get(selectedDate) || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }, [selectedDate, dailyTotals]);

  // Legend component
  const Legend = () => (
    <div className="flex items-center justify-center gap-4 mt-2">
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-accent" />
        <span className="text-[9px] text-muted">Calories</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-orange" />
        <span className="text-[9px] text-muted">Protein</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#E8B931" }} />
        <span className="text-[9px] text-muted">Carbs</span>
      </div>
    </div>
  );

  return (
    <>
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-foreground">Activity Calendar</h3>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 rounded-full bg-accent-light border border-accent/20 px-2.5 py-1 text-[10px] font-semibold text-accent-dim transition-colors hover:bg-accent/15 active:scale-95"
          >
            {expanded ? "Week" : "Month"}
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!expanded ? (
            /* ─── WEEK VIEW (default) ─── */
            <motion.div
              key="week"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="px-4 pb-3"
            >
              <p className="text-[10px] text-muted mb-2">This Week</p>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map(({ dateStr, day, isToday, isFuture }) => {
                  const { cal, protein, carbs, hasData } = getRingPercents(dateStr);
                  const dayLabel = DAYS_SHORT[new Date(dateStr + "T00:00:00").getDay() === 0 ? 6 : new Date(dateStr + "T00:00:00").getDay() - 1];
                  return (
                    <button
                      key={dateStr}
                      onClick={() => !isFuture && setSelectedDate(dateStr)}
                      disabled={isFuture}
                      className={`flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all ${
                        isToday ? "bg-accent-light/60 border border-accent/20" : "hover:bg-card-hover"
                      } ${isFuture ? "opacity-30" : ""}`}
                    >
                      <span className={`text-[9px] font-medium ${isToday ? "text-accent" : "text-muted"}`}>
                        {dayLabel}
                      </span>
                      <ActivityRings
                        calPercent={cal}
                        proteinPercent={protein}
                        carbsPercent={carbs}
                        size={36}
                        hasData={hasData}
                      />
                      <span className={`text-[10px] font-bold ${isToday ? "text-accent" : "text-foreground"}`}>
                        {day}
                      </span>
                    </button>
                  );
                })}
              </div>
              <Legend />
            </motion.div>
          ) : (
            /* ─── MONTH VIEW (expanded) ─── */
            <motion.div
              key="month"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="px-4 pb-3"
            >
              {/* Month nav */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={goPrev}
                  disabled={!canGoPrev}
                  className="rounded-full p-1.5 text-muted hover:text-foreground hover:bg-card-hover transition-all disabled:opacity-20"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold text-foreground">
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <button
                  onClick={goNext}
                  disabled={!canGoNext}
                  className="rounded-full p-1.5 text-muted hover:text-foreground hover:bg-card-hover transition-all disabled:opacity-20"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DAYS_SHORT.map((d) => (
                  <div key={d} className="text-center">
                    <span className="text-[9px] font-medium text-muted">{d}</span>
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {monthGrid.map((cell, idx) => {
                  if (!cell) {
                    return <div key={`empty-${idx}`} className="aspect-square" />;
                  }
                  const { cal, protein, carbs, hasData } = getRingPercents(cell.dateStr);
                  return (
                    <button
                      key={cell.dateStr}
                      onClick={() => !cell.isFuture && setSelectedDate(cell.dateStr)}
                      disabled={cell.isFuture}
                      className={`flex flex-col items-center justify-center aspect-square rounded-lg transition-all ${
                        cell.isToday
                          ? "bg-accent-light/60 border border-accent/20"
                          : "hover:bg-card-hover"
                      } ${cell.isFuture ? "opacity-20" : ""}`}
                    >
                      <ActivityRings
                        calPercent={cal}
                        proteinPercent={protein}
                        carbsPercent={carbs}
                        size={28}
                        hasData={hasData}
                      />
                      <span
                        className={`text-[8px] font-bold mt-0.5 ${
                          cell.isToday ? "text-accent" : hasData ? "text-foreground" : "text-muted-light"
                        }`}
                      >
                        {cell.day}
                      </span>
                    </button>
                  );
                })}
              </div>
              <Legend />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {selectedDate && (
          <DayDetailSheet
            dateStr={selectedDate}
            totals={selectedTotals}
            goals={goals}
            meals={meals}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

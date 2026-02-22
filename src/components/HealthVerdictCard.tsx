"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  AlertTriangle,
  XOctagon,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  Stethoscope,
  Loader2,
} from "lucide-react";
import type { MealHealthAnalysis, DishHealthVerdict, HealthVerdict } from "@/lib/dishTypes";

/* ─── Verdict styling ─── */

const VERDICT_CONFIG: Record<
  HealthVerdict,
  {
    icon: typeof ShieldCheck;
    label: string;
    pillBg: string;
    pillBorder: string;
    pillText: string;
    iconColor: string;
  }
> = {
  good: {
    icon: ShieldCheck,
    label: "Good",
    pillBg: "bg-green-50",
    pillBorder: "border-green-200/60",
    pillText: "text-green-700",
    iconColor: "text-green-500",
  },
  caution: {
    icon: AlertTriangle,
    label: "Caution",
    pillBg: "bg-amber-50",
    pillBorder: "border-amber-200/60",
    pillText: "text-amber-700",
    iconColor: "text-amber-500",
  },
  avoid: {
    icon: XOctagon,
    label: "Avoid",
    pillBg: "bg-red-50",
    pillBorder: "border-red-200/60",
    pillText: "text-red-700",
    iconColor: "text-red-500",
  },
};

/* ─── Meal-level Health Banner ─── */

interface MealHealthBannerProps {
  analysis: MealHealthAnalysis | null;
  isLoading: boolean;
  error: string | null;
  hasHealthProfile: boolean;
}

export function MealHealthBanner({
  analysis,
  isLoading,
  error,
  hasHealthProfile,
}: MealHealthBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!hasHealthProfile) return null;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-accent/20 bg-accent-light/30 px-4 py-3 flex items-center gap-3">
        <Loader2 className="h-4 w-4 text-accent animate-spin shrink-0" />
        <div>
          <p className="text-xs font-semibold text-accent-dim">Dr. Capy is analyzing...</p>
          <p className="text-[10px] text-muted">Checking this meal against your health profile</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-2.5">
        <p className="text-[10px] text-muted-light">
          <Stethoscope className="h-3 w-3 inline mr-1 -mt-0.5" />
          Health analysis unavailable right now
        </p>
      </div>
    );
  }

  if (!analysis) return null;

  const config = VERDICT_CONFIG[analysis.overallVerdict];
  const VerdictIcon = config.icon;

  return (
    <div className={`rounded-xl border ${config.pillBorder} ${config.pillBg} overflow-hidden`}>
      {/* Summary bar */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${config.pillBg} border ${config.pillBorder} shrink-0`}>
          <VerdictIcon className={`h-4 w-4 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${config.pillText}`}>
              Dr. Capy&apos;s Verdict: {config.label}
            </span>
          </div>
          <p className="text-[10px] text-muted truncate mt-0.5">
            {analysis.overallSummary}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted shrink-0" />
        )}
      </button>

      {/* Expanded dish verdicts */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2 border-t border-border/30 pt-2">
              {analysis.dishVerdicts.map((dv, i) => (
                <DishVerdictRow key={i} verdict={dv} />
              ))}
              <p className="text-[9px] text-muted-light text-center pt-1">
                <ShieldCheck className="h-2.5 w-2.5 inline mr-0.5 -mt-0.5" />
                For informational purposes only. Consult your doctor.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Individual Dish Verdict Row ─── */

function DishVerdictRow({ verdict }: { verdict: DishHealthVerdict }) {
  const config = VERDICT_CONFIG[verdict.verdict];
  const VerdictIcon = config.icon;

  return (
    <div className="rounded-lg bg-white/60 border border-border/40 px-3 py-2">
      <div className="flex items-start gap-2">
        <VerdictIcon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">{verdict.dishName}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${config.pillBg} ${config.pillText} border ${config.pillBorder}`}
            >
              {config.label}
            </span>
          </div>
          <p className="text-[10px] text-muted mt-0.5 leading-relaxed">{verdict.note}</p>
          {verdict.swapSuggestion && (
            <div className="flex items-center gap-1.5 mt-1.5 rounded-md bg-accent-light/40 border border-accent/10 px-2 py-1">
              <ArrowRightLeft className="h-3 w-3 text-accent shrink-0" />
              <p className="text-[10px] text-accent-dim font-medium">
                Try: {verdict.swapSuggestion}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Inline Dish Verdict Pill (for dish cards) ─── */

interface DishVerdictPillProps {
  dishName: string;
  analysis: MealHealthAnalysis | null;
  isLoading: boolean;
}

export function DishVerdictPill({ dishName, analysis, isLoading }: DishVerdictPillProps) {
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent-light/50 border border-accent/15 px-2 py-0.5">
        <Loader2 className="h-2.5 w-2.5 text-accent animate-spin" />
        <span className="text-[9px] text-accent font-medium">Checking...</span>
      </span>
    );
  }

  if (!analysis) return null;

  // Find the verdict for this dish (fuzzy match on name)
  const dv = analysis.dishVerdicts.find(
    (v) => v.dishName.toLowerCase() === dishName.toLowerCase()
  ) ?? analysis.dishVerdicts.find(
    (v) =>
      dishName.toLowerCase().includes(v.dishName.toLowerCase()) ||
      v.dishName.toLowerCase().includes(dishName.toLowerCase())
  );

  if (!dv) return null;

  const config = VERDICT_CONFIG[dv.verdict];
  const VerdictIcon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${config.pillBg} ${config.pillBorder}`}
    >
      <VerdictIcon className={`h-2.5 w-2.5 ${config.iconColor}`} />
      <span className={`text-[9px] font-bold ${config.pillText}`}>{config.label}</span>
    </span>
  );
}

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
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { MealHealthAnalysis, DishHealthVerdict, HealthVerdict, HealthCondition } from "@/lib/dishTypes";
import { getConditionById } from "@/lib/healthConditions";

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
    label: "Looks Good",
    pillBg: "bg-green-50",
    pillBorder: "border-green-200/60",
    pillText: "text-green-700",
    iconColor: "text-green-500",
  },
  caution: {
    icon: AlertTriangle,
    label: "Needs Attention",
    pillBg: "bg-amber-50",
    pillBorder: "border-amber-200/60",
    pillText: "text-amber-700",
    iconColor: "text-amber-500",
  },
  avoid: {
    icon: XOctagon,
    label: "Not Recommended",
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
}: MealHealthBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 px-4 py-4 flex items-center gap-3">
        <Loader2 className="h-5 w-5 text-violet-500 animate-spin shrink-0" />
        <div>
          <p className="text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Dr. Capy is analyzing...</p>
          <p className="text-xs text-muted mt-0.5">Checking this meal against your health profile</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card px-4 py-3">
        <p className="text-xs text-muted">
          <Stethoscope className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
          Health analysis unavailable right now
        </p>
      </div>
    );
  }

  if (!analysis) return null;

  const config = VERDICT_CONFIG[analysis.overallVerdict];
  const VerdictIcon = config.icon;

  return (
    <div className={`rounded-2xl border ${config.pillBorder} ${config.pillBg} overflow-hidden`}>
      {/* Dr. Capy label */}
      <div className="px-4 pt-3 pb-0">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-500">
          <Stethoscope className="h-3 w-3" />
          Dr. Capy&apos;s Verdict
        </span>
      </div>
      {/* Summary bar */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.pillBg} border ${config.pillBorder} shrink-0`}>
          <VerdictIcon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-bold ${config.pillText}`}>
            {config.label}
          </span>
          <p className="text-xs text-muted mt-0.5 leading-relaxed">
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
              <p className="text-[10px] text-muted-light text-center pt-1">
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
          <p className="text-xs text-muted mt-0.5 leading-relaxed">{verdict.note}</p>
          {verdict.swapSuggestion && (
            <div className="flex items-center gap-1.5 mt-1.5 rounded-md bg-accent-light/40 border border-accent/10 px-2 py-1">
              <ArrowRightLeft className="h-3 w-3 text-accent shrink-0" />
              <p className="text-xs text-accent-dim font-medium">
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

/* ─── AI Health Check Button (on-demand, prominent card) ─── */

function buildConditionSubtitle(conditions: HealthCondition[]): string {
  if (conditions.length === 0) return "";
  const labels = conditions.map((c) => {
    const def = getConditionById(c.id);
    return def?.shortLabel ?? c.label;
  });
  if (labels.length <= 2) return labels.join(" · ");
  return `${labels.slice(0, 2).join(" · ")} +${labels.length - 2} more`;
}

interface HealthCheckButtonProps {
  conditions: HealthCondition[];
  isLoading: boolean;
  onCheck: () => void;
}

export function HealthCheckButton({ conditions, isLoading, onCheck }: HealthCheckButtonProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 px-4 py-4 flex items-center gap-3">
        <Loader2 className="h-5 w-5 text-violet-500 animate-spin shrink-0" />
        <div>
          <p className="text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Analyzing...</p>
          <p className="text-xs text-muted mt-0.5">Checking against your health profile</p>
        </div>
      </div>
    );
  }

  const subtitle = buildConditionSubtitle(conditions);

  return (
    <button
      onClick={onCheck}
      className="w-full rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 p-4 flex items-center gap-3.5 text-left transition-all hover:border-violet-300 hover:shadow-[0_0_12px_2px_rgba(139,92,246,0.08)] active:scale-[0.99]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 border border-violet-200/60 shrink-0">
        <Sparkles className="h-5 w-5 text-violet-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          AI Health Check
        </p>
        {subtitle && (
          <p className="text-xs text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 border border-violet-200/60 shrink-0">
        <ArrowRight className="h-4 w-4 text-violet-500" />
      </div>
    </button>
  );
}

/* ─── Health Profile Prompt (soft upsell when no profile) ─── */

interface HealthProfilePromptProps {
  onSetup: () => void;
}

export function HealthProfilePrompt({ onSetup }: HealthProfilePromptProps) {
  return (
    <button
      onClick={onSetup}
      className="w-full rounded-2xl border border-dashed border-border bg-card p-4 flex items-center gap-3.5 text-left transition-all hover:border-muted hover:bg-card-hover active:scale-[0.99]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background border border-border shrink-0">
        <Stethoscope className="h-5 w-5 text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">
          How healthy is this meal?
        </p>
        <p className="text-xs text-muted mt-0.5">
          Set up your health profile for a personalized assessment
        </p>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border shrink-0">
        <ArrowRight className="h-4 w-4 text-muted" />
      </div>
    </button>
  );
}

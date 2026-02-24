"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import type {
  EatingAnalysis,
  LoggedMeal,
  NutritionGoals,
  HealthProfile,
  AnalysisScore,
} from "@/lib/dishTypes";

interface EatingAnalysisCardProps {
  meals: LoggedMeal[];
  goals: NutritionGoals;
  healthProfile: HealthProfile | null;
  hasHealthProfile: boolean;
  latestAnalysis: EatingAnalysis | null;
  isGenerating: boolean;
  error: string | null;
  isCacheFresh: (windowDays: number, meals: LoggedMeal[]) => boolean;
  onGenerate: (
    windowDays: number,
    meals: LoggedMeal[],
    goals: NutritionGoals,
    healthProfile: HealthProfile | null
  ) => Promise<EatingAnalysis | null>;
  onViewReport: (analysis: EatingAnalysis, windowLabel: string) => void;
}

const WINDOWS = [
  { days: 0, label: "Today" },
  { days: 7, label: "7 Days" },
  { days: 14, label: "14 Days" },
  { days: 30, label: "30 Days" },
] as const;

const SCORE_DOT: Record<AnalysisScore, string> = {
  great: "bg-accent",
  good: "bg-accent-dim",
  needs_work: "bg-orange",
  concerning: "bg-red-500",
};

export default function EatingAnalysisCard({
  meals,
  goals,
  healthProfile,
  hasHealthProfile,
  latestAnalysis,
  isGenerating,
  error,
  isCacheFresh,
  onGenerate,
  onViewReport,
}: EatingAnalysisCardProps) {
  const [selectedWindow, setSelectedWindow] = useState(7);

  const currentWindowLabel = WINDOWS.find((w) => w.days === selectedWindow)?.label ?? "7 Days";
  const hasCached = latestAnalysis?.windowDays === selectedWindow;
  const isFresh = hasCached && isCacheFresh(selectedWindow, meals);

  const handleAnalyze = async () => {
    const result = await onGenerate(selectedWindow, meals, goals, healthProfile);
    if (result) {
      onViewReport(result, currentWindowLabel);
    }
  };

  const handleViewCached = () => {
    if (latestAnalysis && latestAnalysis.windowDays === selectedWindow) {
      onViewReport(latestAnalysis, currentWindowLabel);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-[#F3E8FF] to-[#EDE9FE] border border-violet-200/50 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-violet-50 to-indigo-50">
          <Sparkles className="h-4 w-4 text-violet-400 animate-[pulse-subtle_3s_ease-in-out_infinite]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-extrabold text-foreground">Eating Analysis</h3>
            {hasCached && latestAnalysis && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/10 text-accent-dim border border-accent/15">
                <span className={`h-1.5 w-1.5 rounded-full ${SCORE_DOT[latestAnalysis.report.score]}`} />
                {latestAnalysis.report.score.replace("_", " ")}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-light">AI-powered insights into your eating habits</p>
        </div>
      </div>

      {/* Window Picker */}
      <div className="flex gap-1.5 mb-3">
        {WINDOWS.map((w) => (
          <button
            key={w.days}
            onClick={() => setSelectedWindow(w.days)}
            className={`flex-1 rounded-lg py-1.5 text-[10px] font-bold transition-all ${
              selectedWindow === w.days
                ? "bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 text-violet-600 border border-violet-200/60"
                : "bg-background border border-border text-muted-light hover:bg-card-hover"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-[10px] text-red-500 mb-2">{error}</p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {hasCached && isFresh ? (
          <>
            <button
              onClick={handleViewCached}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 text-white py-2.5 text-xs font-bold transition-colors hover:bg-purple-700 active:scale-[0.98]"
            >
              View Report
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleAnalyze}
              disabled={isGenerating}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-500 hover:bg-violet-100 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </button>
          </>
        ) : (
          <button
            onClick={hasCached ? handleViewCached : handleAnalyze}
            disabled={isGenerating}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 ${
              hasCached && !isGenerating
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "border border-violet-300 bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] hover:border-violet-400 hover:shadow-[0_0_8px_2px_rgba(139,92,246,0.12)]"
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent font-bold">Analyzing...</span>
              </>
            ) : hasCached ? (
              <>
                View Report
                <span className="text-[9px] font-medium opacity-80 ml-1">(new meals logged)</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent font-bold">Analyze My Eating</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Cache info */}
      {hasCached && latestAnalysis && (
        <p className="text-[9px] text-muted-light text-center mt-2">
          Last analyzed {new Date(latestAnalysis.generatedAt).toLocaleDateString()} ·{" "}
          {latestAnalysis.mealsCount} meals · {latestAnalysis.provider}
        </p>
      )}
    </motion.div>
  );
}

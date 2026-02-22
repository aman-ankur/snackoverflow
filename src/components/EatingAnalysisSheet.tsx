"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Brain,
  Heart,
  ListChecks,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import type {
  EatingReport,
  TrendDirection,
  ReportInsight,
  InsightSeverity,
  AnalysisScore,
} from "@/lib/dishTypes";

interface EatingAnalysisSheetProps {
  report: EatingReport;
  windowLabel: string;
  generatedAt: string;
  provider: string;
  hasHealthProfile: boolean;
  onClose: () => void;
}

type SheetTab = "summary" | "patterns" | "health" | "actions";

const SCORE_CONFIG: Record<AnalysisScore, { label: string; color: string; bg: string }> = {
  great: { label: "Great", color: "text-accent", bg: "bg-accent-light" },
  good: { label: "Good", color: "text-accent-dim", bg: "bg-accent-light/60" },
  needs_work: { label: "Needs Work", color: "text-orange", bg: "bg-orange-light" },
  concerning: { label: "Concerning", color: "text-red-600", bg: "bg-red-50" },
};

const TREND_ICON: Record<TrendDirection, typeof TrendingUp> = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
};

const TREND_COLOR: Record<TrendDirection, string> = {
  improving: "text-accent",
  stable: "text-muted",
  declining: "text-orange",
};

const SEVERITY_CONFIG: Record<InsightSeverity, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  positive: { icon: CheckCircle2, color: "text-accent", bg: "bg-accent-light/50" },
  neutral: { icon: Info, color: "text-muted", bg: "bg-card" },
  warning: { icon: AlertTriangle, color: "text-orange", bg: "bg-orange-light/50" },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function TrendPill({ label, direction }: { label: string; direction: TrendDirection }) {
  const Icon = TREND_ICON[direction];
  const color = TREND_COLOR[direction];
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5">
      <span className="text-[10px] font-semibold text-muted">{label}</span>
      <Icon className={`h-3 w-3 ${color}`} />
    </div>
  );
}

function InsightCard({ insight }: { insight: ReportInsight }) {
  const config = SEVERITY_CONFIG[insight.severity];
  const Icon = config.icon;
  return (
    <div className={`rounded-xl border border-border p-3 ${config.bg}`}>
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0">
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground">{insight.title}</p>
          <p className="text-[11px] text-muted leading-relaxed mt-1">{insight.detail}</p>
        </div>
      </div>
    </div>
  );
}

export default function EatingAnalysisSheet({
  report,
  windowLabel,
  generatedAt,
  provider,
  hasHealthProfile,
  onClose,
}: EatingAnalysisSheetProps) {
  const [activeTab, setActiveTab] = useState<SheetTab>("summary");
  const scoreConfig = SCORE_CONFIG[report.score];

  const tabs: { id: SheetTab; label: string; icon: typeof Sparkles; show: boolean }[] = [
    { id: "summary", label: "Summary", icon: Sparkles, show: true },
    { id: "patterns", label: "Patterns", icon: Brain, show: report.insights.length > 0 },
    { id: "health", label: "Health", icon: Heart, show: hasHealthProfile && report.healthNotes.length > 0 },
    { id: "actions", label: "Actions", icon: ListChecks, show: report.actionItems.length > 0 },
  ];

  const visibleTabs = tabs.filter((t) => t.show);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-black/40"
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-[85] max-h-[90vh] overflow-y-auto rounded-t-[20px] bg-card"
      >
        <div className="mx-auto max-w-lg">
          {/* Handle */}
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="h-1 w-9 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-2">
            <div>
              <h3 className="text-base font-extrabold text-foreground">Eating Analysis</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted">{windowLabel}</span>
                <span className="text-[10px] text-muted-light">·</span>
                <Clock className="h-2.5 w-2.5 text-muted-light" />
                <span className="text-[10px] text-muted-light">{timeAgo(generatedAt)}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border"
            >
              <X className="h-4 w-4 text-muted" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-4 pb-3 overflow-x-auto">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-accent text-white"
                      : "bg-background border border-border text-muted hover:bg-card-hover"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="px-4 pb-8 space-y-3">
            {activeTab === "summary" && (
              <>
                {/* Score Badge */}
                <div className={`rounded-2xl ${scoreConfig.bg} border border-border p-4`}>
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full ${scoreConfig.bg} border border-current/10 px-3 py-1.5`}>
                      <span className={`text-sm font-extrabold ${scoreConfig.color}`}>
                        {scoreConfig.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed mt-3">
                    {report.scoreSummary}
                  </p>
                </div>

                {/* Trend Pills */}
                <div className="rounded-2xl bg-background border border-border p-3">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wide mb-2">Trends</p>
                  <div className="flex flex-wrap gap-2">
                    <TrendPill label="Calories" direction={report.trends.calories} />
                    <TrendPill label="Protein" direction={report.trends.protein} />
                    <TrendPill label="Carbs" direction={report.trends.carbs} />
                    <TrendPill label="Fat" direction={report.trends.fat} />
                  </div>
                </div>

                {/* Comparison */}
                {report.comparison && (
                  <div className="rounded-2xl bg-gradient-to-br from-accent-light/30 to-white border border-accent/10 p-4">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wide mb-2">
                      vs Previous Period
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-1.5">
                        {report.comparison.caloriesDelta <= 0 ? (
                          <ArrowDownRight className="h-3.5 w-3.5 text-accent" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5 text-orange" />
                        )}
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {report.comparison.caloriesDelta > 0 ? "+" : ""}
                            {report.comparison.caloriesDelta}%
                          </p>
                          <p className="text-[9px] text-muted">Calories</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {report.comparison.proteinDelta >= 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-accent" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 text-orange" />
                        )}
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {report.comparison.proteinDelta > 0 ? "+" : ""}
                            {report.comparison.proteinDelta}%
                          </p>
                          <p className="text-[9px] text-muted">Protein</p>
                        </div>
                      </div>
                    </div>
                    {report.comparison.topImprovement && (
                      <p className="text-[11px] text-accent mt-2">
                        {report.comparison.topImprovement}
                      </p>
                    )}
                    {report.comparison.topRegression && (
                      <p className="text-[11px] text-orange mt-1">
                        {report.comparison.topRegression}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === "patterns" && (
              <div className="space-y-2">
                {report.insights.map((insight, i) => (
                  <InsightCard key={i} insight={insight} />
                ))}
              </div>
            )}

            {activeTab === "health" && (
              <div className="space-y-2">
                {report.healthNotes.map((note, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-orange-light/30 p-3 flex items-start gap-2.5"
                  >
                    <Heart className="h-4 w-4 text-orange mt-0.5 shrink-0" />
                    <p className="text-[11px] text-foreground leading-relaxed">{note}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "actions" && (
              <div className="space-y-2">
                {report.actionItems.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-accent-light/30 p-3 flex items-start gap-2.5"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold shrink-0 mt-0.5">
                      {item.priority}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-foreground leading-relaxed">{item.text}</p>
                      {item.relatedInsight && (
                        <p className="text-[9px] text-muted mt-1">
                          Related: {item.relatedInsight}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

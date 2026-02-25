"use client";

import { useState, useEffect } from "react";
import { Lightbulb } from "lucide-react";
import type { QuickInsight as QuickInsightData } from "@/lib/quickInsights";

interface QuickInsightProps {
  insight: QuickInsightData | null;
  whatsNewDismissed: boolean;
}

export default function QuickInsightCard({ insight, whatsNewDismissed }: QuickInsightProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !whatsNewDismissed || !insight) return null;

  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-accent-light/40 border border-accent/10 px-3.5 py-2.5">
      <Lightbulb className="h-4 w-4 text-accent shrink-0" />
      <p className="text-[11px] text-foreground leading-snug">{insight.text}</p>
    </div>
  );
}

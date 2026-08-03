"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Check, ChevronRight, CircleHelp, HeartPulse, LockKeyhole, Sparkles, X } from "lucide-react";
import type { HealthProfile, LoggedMeal } from "@/lib/dishTypes";
import {
  buildHealthPlaybook,
  type HealthPlaybookSnapshot,
  type PlaybookCheckIn,
  type PlaybookStatus,
} from "@/lib/healthPlaybook";

interface SharedProps {
  meals: LoggedMeal[];
  healthProfile: HealthProfile | null;
  hasHealthProfile: boolean;
  onSetupHealthProfile?: () => void;
}

export interface HealthPlaybookEntryProps extends SharedProps {
  variant: "home" | "progress";
  onOpen: () => void;
}

export interface HealthPlaybookSheetProps extends SharedProps {
  open: boolean;
  onClose: () => void;
}

const CHECK_IN_OPTIONS = [
  { value: 1 as const, emoji: "😵", label: "Low" },
  { value: 2 as const, emoji: "😐", label: "Okay" },
  { value: 3 as const, emoji: "🙂", label: "Steady" },
  { value: 4 as const, emoji: "⚡", label: "Great" },
];

const STATUS_COPY: Record<PlaybookStatus, { label: string; tone: string }> = {
  learning: { label: "Learning", tone: "bg-background text-muted" },
  early: { label: "Early preview", tone: "bg-orange-light text-orange" },
  unlocked: { label: "Ready", tone: "bg-accent-light text-accent-dim" },
  sparse: { label: "Limited edition", tone: "bg-orange-light text-orange" },
};

function usePlaybookCheckIns(): [PlaybookCheckIn[], (checkIn: PlaybookCheckIn) => void] {
  const [checkIns, setCheckIns] = useState<PlaybookCheckIn[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("snackoverflow-health-playbook-checkins-v1");
      return stored ? JSON.parse(stored) as PlaybookCheckIn[] : [];
    } catch {
      return [];
    }
  });

  const addCheckIn = (checkIn: PlaybookCheckIn) => {
    setCheckIns((current) => {
      const next = [...current, checkIn].slice(-100);
      try { localStorage.setItem("snackoverflow-health-playbook-checkins-v1", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  return [checkIns, addCheckIn];
}

function createEnergyCheckIn(value: 1 | 2 | 3 | 4): PlaybookCheckIn {
  const now = new Date();
  return { id: `checkin-${now.getTime()}`, kind: "energy", value, createdAt: now.toISOString() };
}

function formatCoverage(snapshot: HealthPlaybookSnapshot): string {
  const covered = Object.entries(snapshot.coverage)
    .filter(([, count]) => count > 0)
    .map(([type]) => type.charAt(0).toUpperCase() + type.slice(1));
  return covered.length ? covered.join(" · ") : "No meals yet";
}

function StatusBadge({ status }: { status: PlaybookStatus }) {
  const copy = STATUS_COPY[status];
  return <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${copy.tone}`}>{copy.label}</span>;
}

export function HealthPlaybookEntry({ variant, meals, healthProfile, hasHealthProfile, onOpen }: HealthPlaybookEntryProps) {
  const snapshot = useMemo(() => buildHealthPlaybook(meals, healthProfile), [meals, healthProfile]);
  const isHome = variant === "home";

  return (
    <section className={`rounded-2xl border p-4 ${isHome ? "border-accent/20 bg-accent-light/40" : "border-orange/20 bg-orange-light/30"}`} data-testid={`health-playbook-${variant}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isHome ? "bg-accent-light" : "bg-orange-light"}`}>
          {isHome ? <HeartPulse className="h-5 w-5 text-accent-dim" /> : <Sparkles className="h-5 w-5 text-orange" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-extrabold text-foreground">Health Playbook</p>
            <StatusBadge status={snapshot.status} />
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            {isHome
              ? snapshot.status === "unlocked" ? "Your week has a few patterns ready to explore." : "A small weekly read on what your meals may be teaching you."
              : snapshot.status === "unlocked" ? "Your weekly edition is ready. Choose one next step." : snapshot.nextStep}
          </p>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-light">
            <span>{snapshot.daysLogged}/7 days</span><span>·</span><span>{snapshot.mealsLogged} meals</span>
          </div>
        </div>
      </div>
      <button onClick={onOpen} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-foreground px-3 py-2.5 text-[11px] font-bold text-white transition-opacity hover:opacity-90" aria-label={isHome ? "Open Health Playbook from Home" : "Open Health Playbook from Progress"}>
        {isHome ? "See what’s taking shape" : snapshot.status === "unlocked" ? "Open your Playbook" : "See what to log next"}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
      {!hasHealthProfile && <p className="mt-2 text-center text-[10px] text-muted">Add a health profile to personalize safety notes.</p>}
    </section>
  );
}

function LearningView({ snapshot, onClose }: { snapshot: HealthPlaybookSnapshot; onClose: () => void }) {
  return (
    <>
      <div className="rounded-2xl border border-border bg-background p-4">
        <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">What’s happening</span><span className="text-[10px] font-bold text-accent-dim">{snapshot.daysLogged}/7 days</span></div>
        <h3 className="mt-2 text-lg font-extrabold text-foreground">Your Playbook is learning.</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">Keep logging meals. We’ll compare your own patterns once there’s enough context.</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min((snapshot.daysLogged / 7) * 100, 100)}%` }} /></div>
      </div>
      <div className="mt-3 rounded-2xl border border-border bg-card p-4"><p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Best next step</p><p className="mt-2 text-sm font-bold text-foreground">{snapshot.nextStep}</p><p className="mt-1 text-[11px] leading-relaxed text-muted">Current coverage: {formatCoverage(snapshot)}.</p></div>
      <button onClick={onClose} className="mt-3 w-full rounded-xl border border-border py-2.5 text-[11px] font-bold text-muted">Back to logging</button>
    </>
  );
}

function EvidenceCard({ evidence }: { evidence: HealthPlaybookSnapshot["evidence"][number] }) {
  return <div className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Pattern · {evidence.confidence} confidence</span><CircleHelp className="h-3.5 w-3.5 text-muted-light" /></div><p className="mt-2 text-sm font-bold leading-snug text-foreground">{evidence.title}</p><p className="mt-1 text-[11px] text-muted">{evidence.detail}</p><p className="mt-2 border-l-2 border-accent pl-2 text-[10px] leading-relaxed text-muted">{evidence.caveat}</p></div>;
}

export function HealthPlaybookSheet({ open, onClose, meals, healthProfile, hasHealthProfile, onSetupHealthProfile }: HealthPlaybookSheetProps) {
  const [checkIns, addCheckIn] = usePlaybookCheckIns();
  const [experimentConfirmed, setExperimentConfirmed] = useState(false);
  const [askQuestion, setAskQuestion] = useState<string | null>(null);
  const snapshot = useMemo(() => buildHealthPlaybook(meals, healthProfile, checkIns), [meals, healthProfile, checkIns]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const addEnergyCheckIn = (value: 1 | 2 | 3 | 4) => addCheckIn(createEnergyCheckIn(value));
  const unlocked = snapshot.status === "unlocked";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="health-playbook-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background px-4 pb-8 pt-4 shadow-2xl sm:rounded-3xl" data-testid="health-playbook-sheet">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border sm:hidden" />
        <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-accent-dim">Progress · Health Playbook</p><h2 id="health-playbook-title" className="mt-1 text-xl font-extrabold text-foreground">A useful weekly read</h2></div><button onClick={onClose} className="rounded-full bg-card p-2 text-muted" aria-label="Close Health Playbook"><X className="h-4 w-4" /></button></div>
        {snapshot.safetyNote && <div className="mt-3 flex gap-2 rounded-xl border border-orange/30 bg-orange-light/50 p-3 text-[11px] leading-relaxed text-orange"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{snapshot.safetyNote}</span></div>}
        {!hasHealthProfile && <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-accent/20 bg-accent-light/40 p-3"><div><p className="text-[11px] font-bold text-foreground">Personalize your safety notes</p><p className="mt-0.5 text-[10px] text-muted">Your profile helps us avoid unsuitable suggestions.</p></div>{onSetupHealthProfile && <button onClick={() => { onClose(); onSetupHealthProfile(); }} className="shrink-0 rounded-lg bg-foreground px-2.5 py-2 text-[10px] font-bold text-white">Set up</button>}</div>}

        <div className="mt-4">
          {snapshot.status === "learning" && <LearningView snapshot={snapshot} onClose={onClose} />}
          {snapshot.status === "early" && <>
            <div className="rounded-2xl border border-orange/20 bg-orange-light/40 p-4"><p className="text-[10px] font-extrabold uppercase tracking-wider text-orange">Day {snapshot.daysLogged} · Early preview</p><h3 className="mt-2 text-lg font-extrabold text-foreground">One thread to follow.</h3><p className="mt-1 text-xs leading-relaxed text-muted">This is a useful clue, not a conclusion. One check-in can help us learn whether it matters to you.</p></div>
            <div className="mt-3 space-y-3">{snapshot.evidence.length ? snapshot.evidence.map((evidence) => <EvidenceCard key={evidence.title} evidence={evidence} />) : <LearningView snapshot={snapshot} onClose={onClose} />}</div>
          </>}
          {snapshot.status === "sparse" && <div className="rounded-2xl border border-border bg-card p-4"><LockKeyhole className="h-5 w-5 text-orange" /><p className="mt-2 text-lg font-extrabold text-foreground">Limited edition, still useful.</p><p className="mt-1 text-xs leading-relaxed text-muted">We found only {snapshot.daysLogged} logged days. We’ll show what the data supports and leave the gaps visible.</p>{snapshot.evidence.map((evidence) => <div key={evidence.title} className="mt-3"><EvidenceCard evidence={evidence} /></div>)}<p className="mt-3 text-[11px] font-bold text-accent-dim">{snapshot.nextStep}</p></div>}
          {unlocked && <>
            <div className="rounded-2xl border border-accent/20 bg-accent-light/40 p-4"><div className="flex items-center justify-between"><span className="text-[10px] font-extrabold uppercase tracking-wider text-accent-dim">Edition 01 · {snapshot.daysLogged} days</span><StatusBadge status="unlocked" /></div><h3 className="mt-2 text-lg font-extrabold text-foreground">Your week, in context.</h3><p className="mt-1 text-xs leading-relaxed text-muted">No health score. Just patterns, evidence, and one choice for next week.</p><div className="mt-3 grid grid-cols-3 gap-2"><div className="rounded-xl bg-card p-2 text-center"><b className="block text-base text-foreground">{snapshot.mealsLogged}</b><span className="text-[9px] text-muted">meals</span></div><div className="rounded-xl bg-card p-2 text-center"><b className="block text-base text-foreground">{snapshot.averageProtein}g</b><span className="text-[9px] text-muted">avg protein</span></div><div className="rounded-xl bg-card p-2 text-center"><b className="block text-base text-foreground">{snapshot.checkInsLogged}</b><span className="text-[9px] text-muted">check-ins</span></div></div></div>
            <div className="mt-3 space-y-3">{snapshot.evidence.map((evidence) => <EvidenceCard key={evidence.title} evidence={evidence} />)}</div>
            {snapshot.repeatMeal && <div className="mt-3 rounded-2xl border border-border bg-card p-4"><p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">What to repeat</p><p className="mt-2 text-sm font-bold text-foreground">{snapshot.repeatMeal.title}</p><p className="mt-1 text-[11px] text-muted">{snapshot.repeatMeal.detail}</p></div>}
          </>}
        </div>

        {(snapshot.status === "early" || unlocked) && <div className="mt-4 rounded-2xl border border-accent/20 bg-card p-4"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent-dim" /><p className="text-[10px] font-extrabold uppercase tracking-wider text-accent-dim">One next step</p></div><p className="mt-2 text-sm font-bold text-foreground">{snapshot.experiment.title}</p><p className="mt-1 text-[11px] leading-relaxed text-muted">{snapshot.experiment.detail}</p><button disabled={experimentConfirmed} onClick={() => setExperimentConfirmed(true)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-foreground px-3 py-2.5 text-[11px] font-bold text-white disabled:bg-accent disabled:text-white">{experimentConfirmed ? <><Check className="h-3.5 w-3.5" /> Experiment confirmed</> : "Choose this experiment"}</button><p className="mt-2 text-[10px] leading-relaxed text-muted">{snapshot.experiment.safetyNote}</p></div>}

        {experimentConfirmed && <div className="mt-3 rounded-2xl border border-border bg-card p-4"><p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Optional check-in</p><p className="mt-2 text-sm font-bold text-foreground">{snapshot.experiment.checkInPrompt}</p><div className="mt-2 grid grid-cols-4 gap-2">{CHECK_IN_OPTIONS.map((option) => <button key={option.value} onClick={() => addEnergyCheckIn(option.value)} className="rounded-xl border border-border bg-background px-2 py-2 text-center hover:border-accent"><span className="block text-lg">{option.emoji}</span><span className="mt-1 block text-[9px] text-muted">{option.label}</span></button>)}</div></div>}

        <div className="mt-4 rounded-2xl border border-border bg-card p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Ask My Meals</p><p className="mt-1 text-xs text-muted">Answers stay grounded in your logged meals.</p></div><CircleHelp className="h-4 w-4 text-muted-light" /></div><div className="mt-3 space-y-2">{["What should I repeat on busy mornings?", "Which meal pattern is worth testing?"].map((question) => <button key={question} onClick={() => setAskQuestion(question)} className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-left text-[11px] font-semibold text-foreground">{question}<ChevronRight className="h-3.5 w-3.5 text-muted-light" /></button>)}</div>{askQuestion && <p className="mt-3 rounded-xl bg-accent-light/50 p-3 text-[11px] leading-relaxed text-muted">Based on your {snapshot.mealsLogged} logged meals: {snapshot.repeatMeal?.detail ?? "we need a few more repeated meals before answering confidently."} This is an observation, not medical advice.</p>}</div>
        <p className="mt-4 text-center text-[10px] leading-relaxed text-muted-light">Patterns are observations, not diagnoses or promises. You choose what to try.</p>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Copy, HeartPulse, KeyRound, Send, Smartphone } from "lucide-react";

export const metadata = {
  title: "Automatic Health Sync · SnackOverflow",
  description: "Set up automatic Apple Health syncing from Health Auto Export Premium to SnackOverflow.",
};

export default function AutomaticHealthSyncPage() {
  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to SnackOverflow
        </Link>
        <div className="mt-8 flex items-start gap-3">
          <div className="rounded-2xl bg-accent-light/60 p-3"><HeartPulse className="h-6 w-6 text-accent-dim" /></div>
          <div><p className="text-[10px] font-extrabold uppercase tracking-widest text-accent-dim">Connected Health</p><h1 className="mt-1 text-2xl font-black tracking-tight">Set up automatic sync</h1><p className="mt-2 text-sm leading-relaxed text-muted">Health Auto Export Premium can send your Apple Health data to SnackOverflow every day.</p></div>
        </div>

        <div className="mt-8 space-y-3">
          <Step number="1" icon={KeyRound} title="Create your SnackOverflow connection" text="Open Connected Health in your Profile, tap Generate connection token, and keep the token ready. It is shown only once." />
          <Step number="2" icon={Smartphone} title="Open Health Auto Export" text="In Health Auto Export Premium on your iPhone, open Automations and add a REST API automation." />
          <Step number="3" icon={Send} title="Add the SnackOverflow destination" text="Use this URL as the destination, then add an Authorization header with your SnackOverflow token." />
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">URL</p>
            <code className="mt-2 block break-all rounded-lg bg-background px-3 py-2 text-[11px] font-bold text-foreground">/api/health/ingest/apple-health</code>
            <p className="mt-3 text-[10px] font-extrabold uppercase tracking-wider text-muted">Header</p>
            <code className="mt-2 block break-all rounded-lg bg-background px-3 py-2 text-[11px] text-foreground">Authorization: Bearer YOUR_TOKEN</code>
            <p className="mt-3 text-[10px] leading-relaxed text-muted">Choose JSON as the request format. Enable the Workouts and Health Metrics automations; include sleep analysis if Health Auto Export offers it as a separate data type.</p>
          </div>
          <Step number="4" icon={CheckCircle2} title="Run a test, then schedule it" text="Send a test export. Return to Connected Health and tap Refresh health data. Once it looks right, schedule the automation daily." />
        </div>

        <div className="mt-6 rounded-2xl border border-accent/20 bg-accent-light/30 p-4">
          <p className="text-xs font-extrabold">What SnackOverflow receives</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">Your dashboard normalizes workouts, sleep, weight, HRV, resting heart rate, steps, and active energy. Premium changes only how the data arrives; Basic upload and Shortcut users see the same dashboard.</p>
        </div>
        <Link href="/" className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-foreground px-4 py-3 text-xs font-bold text-white">Return to Connected Health</Link>
      </div>
    </main>
  );
}

function Step({ number, icon: Icon, title, text }: { number: string; icon: typeof Copy; title: string; text: string }) {
  return <div className="flex gap-3 rounded-2xl border border-border bg-card p-4"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-black text-white">{number}</div><div><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-accent-dim" /><p className="text-xs font-extrabold">{title}</p></div><p className="mt-1 text-[11px] leading-relaxed text-muted">{text}</p></div></div>;
}

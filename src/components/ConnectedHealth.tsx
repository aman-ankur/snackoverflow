"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Check, Copy, FileUp, HeartPulse, Link2, RefreshCw, Scale, ShieldCheck, Trash2, Watch } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Connection = { last_successful_sync?: string | null; last_error?: string | null } | null;
type Metric = { metric_type: string; value: number; unit: string; recorded_at: string };
type Workout = { workout_type: string; started_at: string; ended_at: string; duration_seconds: number | null; energy_kcal: number | null; distance_km: number | null; heart_rate_avg_bpm: number | null };
type Sleep = { sleep_date: string; asleep_seconds: number | null; deep_seconds: number | null; rem_seconds: number | null; core_seconds: number | null };
type SyncMethod = "premium" | "basic";

const fmtDuration = (seconds: number | null | undefined) => seconds == null ? "—" : `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export function ConnectedHealthCard({ isLoggedIn, compact = false }: { isLoggedIn: boolean; compact?: boolean }) {
  const [connection, setConnection] = useState<Connection>(null);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [weight, setWeight] = useState("");
  const [method, setMethod] = useState<SyncMethod>("premium");
  const uploadRef = useRef<HTMLInputElement>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [sleep, setSleep] = useState<Sleep[]>([]);

  const load = async () => {
    if (!isLoggedIn) return;
    const res = await fetch("/api/health/connection");
    if (res.ok) setConnection((await res.json()).connection);
    const db = createClient();
    const [m, w, s] = await Promise.all([
      db.from("health_metric_samples").select("metric_type,value,unit,recorded_at").order("recorded_at", { ascending: false }).limit(180),
      db.from("workouts").select("workout_type,started_at,ended_at,duration_seconds,energy_kcal,distance_km,heart_rate_avg_bpm").order("started_at", { ascending: false }).limit(20),
      db.from("sleep_sessions").select("sleep_date,asleep_seconds,deep_seconds,rem_seconds,core_seconds").order("sleep_date", { ascending: false }).limit(14),
    ]);
    setMetrics((m.data ?? []) as Metric[]); setWorkouts((w.data ?? []) as Workout[]); setSleep((s.data ?? []) as Sleep[]);
  };

  useEffect(() => { void load(); }, [isLoggedIn]);

  const latest = (type: string) => metrics.find((item) => item.metric_type === type);
  const latestWeight = latest("weight"); const latestRhr = latest("resting_heart_rate"); const latestHrv = latest("hrv"); const latestSteps = latest("steps"); const latestEnergy = latest("active_energy"); const lastNight = sleep[0];
  const weeklyWorkouts = workouts.filter((w) => Date.now() - new Date(w.started_at).getTime() < 7 * 86400000);
  const weeklyMinutes = Math.round(weeklyWorkouts.reduce((sum, w) => sum + (w.duration_seconds ?? 0), 0) / 60);
  const weightTrend = useMemo(() => metrics.filter((m) => m.metric_type === "weight").slice(0, 30).reverse(), [metrics]);

  const generate = async () => { setBusy(true); setMessage(""); const res = await fetch("/api/health/connection", { method: "POST" }); const data = await res.json(); setBusy(false); if (!res.ok) { setMessage(data.error ?? "Could not create token"); return; } setToken(data.token); setMessage("Token created. Copy it now; it is shown once."); await load(); };
  const revoke = async () => { setBusy(true); await fetch("/api/health/connection", { method: "DELETE" }); setBusy(false); setToken(""); setConnection(null); setMessage("Connection revoked."); };
  const saveWeight = async () => { const res = await fetch("/api/health/weight", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weightKg: Number(weight) }) }); const data = await res.json(); setMessage(res.ok ? "Weight saved. Nutrition goals were not changed." : data.error); if (res.ok) { setWeight(""); await load(); } };
  const uploadExport = async (file: File) => { setBusy(true); setMessage(""); const body = await file.text(); const res = await fetch("/api/health/import", { method: "POST", headers: { "Content-Type": "application/json" }, body }); const data = await res.json(); setBusy(false); setMessage(res.ok ? `Imported ${data.imported?.workouts ?? 0} workouts and ${data.imported?.metrics ?? 0} metrics.` : data.error ?? "Import failed"); if (res.ok) await load(); };

  if (!isLoggedIn) return <div className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-muted" /><p className="text-xs font-bold text-foreground">Connected Health</p></div><p className="mt-1 text-[11px] text-muted">Sign in to connect Apple Health securely. Guest meal logging stays available.</p></div>;

  return <div className="space-y-3">
    {!compact && <div><h3 className="text-sm font-extrabold text-foreground">Connected Health</h3><p className="text-[11px] text-muted mt-0.5">Apple Health → exporter → SnackOverflow</p></div>}
    {!compact && <SyncMethodChooser method={method} setMethod={setMethod} connected={Boolean(connection)} token={token} generate={generate} busy={busy} uploadRef={uploadRef} uploadExport={uploadExport} />}
    {connection ? <div className="rounded-2xl border border-border bg-card p-4 space-y-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Watch className="h-4 w-4 text-green-600" /><div><p className="text-xs font-bold text-foreground">Apple Health connected</p><p className="text-[10px] text-muted">{connection.last_successful_sync ? `Last sync ${new Date(connection.last_successful_sync).toLocaleString("en-IN")}` : "Waiting for first sync"}</p></div></div><button onClick={revoke} className="text-muted hover:text-red-600" title="Revoke token"><Trash2 className="h-3.5 w-3.5" /></button></div>{token && <div className="rounded-xl bg-background border border-border p-3"><p className="text-[10px] font-bold text-muted mb-1">Bearer token</p><div className="flex gap-2"><code className="min-w-0 flex-1 break-all text-[10px] text-foreground">{token}</code><button onClick={() => navigator.clipboard?.writeText(token)} className="shrink-0 rounded-md border border-border p-1.5" title="Copy token"><Copy className="h-3 w-3" /></button></div></div>}{connection.last_error && <p className="text-[10px] text-red-600">Last import error: {connection.last_error}</p>}</div> : <div className="rounded-2xl border border-accent/20 bg-accent-light/30 p-4"><div className="flex items-start gap-3"><Link2 className="h-4 w-4 text-accent-dim mt-0.5" /><div><p className="text-xs font-bold text-foreground">Connect Apple Health</p><p className="text-[11px] text-muted mt-1">Generate one private token, then choose Automatic or Free sync above.</p><button onClick={generate} disabled={busy} className="mt-3 rounded-lg bg-foreground px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">{busy ? "Creating…" : "Generate connection token"}</button></div></div></div>}
    <div className="grid grid-cols-2 gap-2"><Mini icon={HeartPulse} label="Sleep" value={fmtDuration(lastNight?.asleep_seconds)} /><Mini icon={Activity} label="7-day activity" value={`${weeklyWorkouts.length} · ${weeklyMinutes}m`} /><Mini icon={Scale} label="Latest weight" value={latestWeight ? `${latestWeight.value.toFixed(1)} kg` : "—"} /><Mini icon={HeartPulse} label="RHR / HRV" value={`${latestRhr?.value ?? "—"} / ${latestHrv ? latestHrv.value.toFixed(1) : "—"}`} /><Mini icon={Activity} label="Steps" value={latestSteps ? Math.round(latestSteps.value).toLocaleString("en-IN") : "—"} /><Mini icon={Activity} label="Active energy" value={latestEnergy ? `${Math.round(latestEnergy.value)} kcal` : "—"} /></div>
    {lastNight && <div className="rounded-xl border border-border bg-card p-3"><p className="text-[11px] font-bold text-foreground">Recovery · {lastNight.sleep_date}</p><div className="mt-2 grid grid-cols-3 text-center"><MiniText label="Core" value={fmtDuration(lastNight.core_seconds)} /><MiniText label="Deep" value={fmtDuration(lastNight.deep_seconds)} /><MiniText label="REM" value={fmtDuration(lastNight.rem_seconds)} /></div></div>}
    <WorkoutHistory workouts={workouts} />
    <div className="rounded-xl border border-border bg-card p-3"><div className="flex items-center justify-between"><p className="text-[11px] font-bold text-foreground">Manual weight</p><p className="text-[10px] text-muted">{weightTrend.length ? `${weightTrend.length} measurements` : "No measurements"}</p></div><div className="mt-2 flex gap-2"><input value={weight} onChange={(e) => setWeight(e.target.value)} type="number" min="20" max="500" step="0.1" placeholder="kg" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-2 text-xs" /><button onClick={saveWeight} disabled={!weight} className="rounded-lg bg-foreground px-3 py-2 text-[11px] font-bold text-white disabled:opacity-40">Save</button></div><p className="mt-2 text-[10px] text-muted">Adds a measurement and updates profile weight. It does not recalculate nutrition goals.</p></div>
    {message && <p className="text-[10px] text-accent-dim flex items-center gap-1"><Check className="h-3 w-3" />{message}</p>}<button onClick={() => void load()} className="flex items-center gap-1 text-[10px] font-semibold text-muted hover:text-foreground"><RefreshCw className="h-3 w-3" />Refresh health data</button>
  </div>;
}

function SyncMethodChooser({ method, setMethod, connected, token, generate, busy, uploadRef, uploadExport }: { method: SyncMethod; setMethod: (method: SyncMethod) => void; connected: boolean; token: string; generate: () => Promise<void>; busy: boolean; uploadRef: React.RefObject<HTMLInputElement | null>; uploadExport: (file: File) => Promise<void> }) {
  return <div className="rounded-2xl border border-border bg-card p-4 space-y-3"><p className="text-xs font-extrabold text-foreground">Choose your sync method</p><div className="grid grid-cols-2 gap-2"><button onClick={() => setMethod("premium")} className={`rounded-xl border p-3 text-left ${method === "premium" ? "border-accent bg-accent-light/40" : "border-border"}`}><p className="text-[11px] font-bold text-foreground">Automatic sync</p><p className="mt-1 text-[10px] text-muted">Health Auto Export Premium · daily REST API</p></button><button onClick={() => setMethod("basic")} className={`rounded-xl border p-3 text-left ${method === "basic" ? "border-accent bg-accent-light/40" : "border-border"}`}><p className="text-[11px] font-bold text-foreground">Free sync</p><p className="mt-1 text-[10px] text-muted">Basic · JSON export + upload/Shortcut</p></button></div>{method === "premium" ? <div className="rounded-xl bg-background border border-border p-3 text-[10px] text-muted space-y-1"><p className="font-bold text-foreground">Premium setup</p><p>Use endpoint <code>/api/health/ingest/apple-health</code> with <code>Authorization: Bearer token</code>. Create separate Workouts and Health Metrics automations, then schedule them daily.</p>{!token && <p className="mt-2">Your connection token is already saved. Revoke it above and generate a new one only if you need to replace it.</p>}</div> : <div className="rounded-xl bg-background border border-border p-3 text-[10px] text-muted space-y-2"><p className="font-bold text-foreground">Free setup</p><p>Export JSON from Health Auto Export Basic, then upload it here. Browser uploads use your SnackOverflow login, so no token is needed. The Shortcut remains available for sharing from the iPhone.</p><input ref={uploadRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadExport(file); e.currentTarget.value = ""; }} /><button onClick={() => uploadRef.current?.click()} disabled={busy || !connected} className="inline-flex items-center gap-1 rounded-lg bg-foreground px-3 py-2 text-[10px] font-bold text-white disabled:opacity-40"><FileUp className="h-3 w-3" />{connected ? "Upload JSON export" : "Create connection first"}</button><a href="/shortcuts/snackoverflow-health-sync.shortcut" download className="ml-2 text-[10px] font-bold text-accent-dim">Download Shortcut</a></div>}</div>;
}

function WorkoutHistory({ workouts }: { workouts: Workout[] }) { return <div className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center justify-between mb-2"><p className="text-xs font-extrabold text-foreground">Recent workouts</p><span className="text-[10px] text-muted">{workouts.length} imported</span></div>{workouts.length === 0 ? <p className="py-3 text-center text-[10px] text-muted">No workouts imported yet.</p> : <div className="space-y-2">{workouts.slice(0, 10).map((workout, index) => <div key={`${workout.started_at}-${index}`} className="rounded-xl bg-background border border-border p-3"><div className="flex items-center justify-between gap-2"><p className="text-[11px] font-bold text-foreground">{workout.workout_type}</p><p className="text-[10px] text-muted">{fmtDate(workout.started_at)}</p></div><p className="mt-1 text-[10px] text-muted">{fmtDuration(workout.duration_seconds)}{workout.energy_kcal !== null ? ` · ${Math.round(workout.energy_kcal)} kcal` : ""}{workout.distance_km !== null ? ` · ${workout.distance_km.toFixed(1)} km` : ""}{workout.heart_rate_avg_bpm !== null ? ` · avg HR ${Math.round(workout.heart_rate_avg_bpm)} bpm` : ""}</p></div>)}</div>}</div>; }
function Mini({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) { return <div className="rounded-xl border border-border bg-card p-3"><Icon className="h-3.5 w-3.5 text-accent" /><p className="mt-1 text-[10px] text-muted">{label}</p><p className="text-sm font-extrabold text-foreground">{value}</p></div>; }
function MiniText({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] text-muted">{label}</p><p className="text-[11px] font-bold text-foreground">{value}</p></div>; }

"use client";

import { Settings2, Target, Flame, User, Scale, Ruler, Activity, LogOut, Cloud, CloudOff, Play, Stethoscope, ShieldCheck, ChevronRight, AlertTriangle, Code2 } from "lucide-react";
import CapyMascot from "@/components/CapyMascot";
import AuthScreen from "@/components/AuthScreen";
import { useDevMode } from "@/lib/useDevMode";
import type { UserProfile, NutritionGoals, StreakData, HealthProfile } from "@/lib/dishTypes";
import { getConditionById } from "@/lib/healthConditions";
import { getHealthSummaryDisplay, getStaleLabs } from "@/lib/healthContextBuilder";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface ProfileViewProps {
  profile: UserProfile | null;
  goals: NutritionGoals;
  streak: StreakData;
  healthProfile: HealthProfile | null;
  hasHealthProfile: boolean;
  onEditGoals: () => void;
  onEditHealthProfile: () => void;
  onResetAll: () => void;
  authUser: SupabaseUser | null;
  isLoggedIn: boolean;
  onSendOTP: (email: string) => Promise<{ error: unknown }>;
  onVerifyOTP: (email: string, token: string) => Promise<{ error: unknown }>;
  onSignUp: (email: string, password: string) => Promise<{ error: unknown }>;
  onSignInPassword: (email: string, password: string) => Promise<{ error: unknown }>;
  onSignOut: () => Promise<void>;
  onReplayTour?: () => void;
}

const GOAL_LABELS: Record<string, string> = {
  lose_mild: "Lose 2-3 kg (Gentle)",
  lose_moderate: "Lose 5-7 kg (Steady)",
  lose_aggressive: "Lose 7-10 kg (Aggressive)",
  tone_up: "Tone Up & Recomp",
  maintain: "Maintain Weight",
  build_muscle: "Build Muscle",
  lean_bulk: "Lean Bulk",
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary",
  light: "Lightly Active",
  moderate: "Active",
  very_active: "Very Active",
  athlete: "Athlete",
};

export default function ProfileView({
  profile,
  goals,
  streak,
  healthProfile,
  hasHealthProfile,
  onEditGoals,
  onEditHealthProfile,
  onResetAll,
  authUser,
  isLoggedIn,
  onSendOTP,
  onVerifyOTP,
  onSignUp,
  onSignInPassword,
  onSignOut,
  onReplayTour,
}: ProfileViewProps) {
  const [devMode, setDevMode] = useDevMode();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-extrabold text-foreground">Profile</h2>
        <p className="text-xs text-muted mt-0.5">Your goals and settings</p>
      </div>

      {/* Capy Card */}
      <div className="rounded-2xl bg-gradient-to-br from-accent-light/40 to-card border border-accent/10 p-6 flex flex-col items-center text-center">
        <div className="animate-breathe">
          <CapyMascot mood="concerned" size={100} />
        </div>
        {profile?.name ? (
          <h3 className="text-base font-extrabold text-foreground mt-3">{profile.name}</h3>
        ) : (
          <h3 className="text-base font-extrabold text-foreground mt-3">SnackOverflow</h3>
        )}
        <p className="text-xs text-muted mt-0.5">{profile?.name ? "SnackOverflow Member" : "Your Smart Kitchen Assistant"}</p>
        {streak.currentStreak > 0 && (
          <div className="flex items-center gap-1 mt-3 rounded-full bg-orange-light border border-orange/20 px-3 py-1">
            <Flame className="h-3 w-3 text-orange" />
            <span className="text-xs font-bold text-orange">{streak.currentStreak} Day Streak</span>
          </div>
        )}
        {isLoggedIn && authUser && (
          <div className="flex items-center gap-1.5 mt-3">
            <Cloud className="h-3 w-3 text-green-500" />
            <span className="text-[10px] text-muted">{authUser.email}</span>
          </div>
        )}
      </div>

      {/* Auth Section */}
      {!isLoggedIn ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <CloudOff className="h-3.5 w-3.5 text-muted" />
            <span className="text-[10px] text-muted">Data is stored locally only</span>
          </div>
          <AuthScreen
            onSendOTP={onSendOTP}
            onVerifyOTP={onVerifyOTP}
            onSignUp={onSignUp}
            onSignInPassword={onSignInPassword}
          />
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs font-bold text-foreground">Synced to cloud</p>
                <p className="text-[10px] text-muted">{authUser?.email}</p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 rounded-lg bg-background border border-border px-3 py-1.5 text-[11px] font-semibold text-muted hover:text-foreground transition-colors"
            >
              <LogOut className="h-3 w-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Body Stats */}
      {profile && (
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-extrabold text-foreground">Body Stats</h3>
            </div>
            <button
              onClick={onEditGoals}
              className="text-[10px] text-accent font-semibold hover:text-accent-dim transition-colors"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatItem icon={User} label="Gender" value={profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)} />
            <StatItem icon={User} label="Age" value={`${profile.age} years`} />
            <StatItem icon={Ruler} label="Height" value={`${profile.heightCm} cm`} />
            <StatItem icon={Scale} label="Weight" value={`${profile.weightKg} kg`} />
            <StatItem icon={Activity} label="Activity" value={ACTIVITY_LABELS[profile.activityLevel] || profile.activityLevel} />
            <StatItem icon={Target} label="Goal" value={GOAL_LABELS[profile.goal] || profile.goal} />
          </div>
        </div>
      )}

      {/* Health Profile */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-extrabold text-foreground">Health Profile</h3>
          </div>
          <button
            onClick={onEditHealthProfile}
            className="text-[10px] text-accent font-semibold hover:text-accent-dim transition-colors"
          >
            {hasHealthProfile ? "Edit" : "Set Up"}
          </button>
        </div>
        {hasHealthProfile && healthProfile ? (
          <div className="space-y-2.5">
            {/* Active conditions (includes "both") */}
            {healthProfile.conditions.filter((c) => c.status === "active" || c.status === "both").length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-light font-medium uppercase tracking-wider">Active Conditions</p>
                <div className="flex flex-wrap gap-1.5">
                  {healthProfile.conditions
                    .filter((c) => c.status === "active" || c.status === "both")
                    .map((c) => {
                      const def = getConditionById(c.id);
                      const Icon = def?.icon;
                      return (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200/60 px-2.5 py-1 text-[10px] font-semibold text-red-700"
                        >
                          {Icon && <Icon className="h-3 w-3" />}
                          {def?.shortLabel ?? c.label}
                          {c.status === "both" && (
                            <span className="text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1 ml-0.5">FH</span>
                          )}
                        </span>
                      );
                    })}
                </div>
              </div>
            )}
            {/* Family history (only pure family_history, not "both" which is already shown above) */}
            {healthProfile.conditions.filter((c) => c.status === "family_history").length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-light font-medium uppercase tracking-wider">Family History</p>
                <div className="flex flex-wrap gap-1.5">
                  {healthProfile.conditions
                    .filter((c) => c.status === "family_history")
                    .map((c) => {
                      const def = getConditionById(c.id);
                      const Icon = def?.icon;
                      return (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/60 px-2.5 py-1 text-[10px] font-semibold text-amber-700"
                        >
                          {Icon && <Icon className="h-3 w-3" />}
                          {def?.shortLabel ?? c.label}
                        </span>
                      );
                    })}
                </div>
              </div>
            )}
            {/* Diet preference */}
            {healthProfile.dietPreference && (
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <span className="text-[10px] text-muted-light">Diet:</span>
                <span className="text-[10px] font-bold text-foreground capitalize">{healthProfile.dietPreference}</span>
              </div>
            )}
            {/* Stale labs warning */}
            {healthProfile.labValues.length > 0 && (() => {
              const stale = getStaleLabs(healthProfile.labValues);
              if (stale.length === 0) return null;
              const oldest = Math.max(...stale.map((s) => s.daysOld));
              const months = Math.floor(oldest / 30);
              return (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200/60 px-2.5 py-1.5">
                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 leading-relaxed">
                    {stale.length === 1 ? "1 lab value is" : `${stale.length} lab values are`} over {months} month{months !== 1 ? "s" : ""} old. Consider updating with recent results.
                  </p>
                </div>
              );
            })()}
            {/* Summary */}
            <div className="pt-1 border-t border-border">
              <p className="text-[10px] text-muted-light">
                <ShieldCheck className="h-3 w-3 text-accent inline mr-1 -mt-0.5" />
                {getHealthSummaryDisplay(healthProfile)} &mdash; Dr. Capy personalizes every scan
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={onEditHealthProfile}
            className="w-full flex items-center gap-3 rounded-xl bg-accent-light/50 border border-accent/15 px-4 py-3 text-left transition-all hover:bg-accent-light active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 shrink-0">
              <Stethoscope className="h-4.5 w-4.5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-accent-dim">Set up your health profile</p>
              <p className="text-[10px] text-muted">Get personalized food advice from Dr. Capy</p>
            </div>
            <ChevronRight className="h-4 w-4 text-accent/50 shrink-0" />
          </button>
        )}
      </div>

      {/* Nutrition Targets */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-extrabold text-foreground">Daily Targets</h3>
          </div>
          <button
            onClick={onEditGoals}
            className="text-[10px] text-accent font-semibold hover:text-accent-dim transition-colors"
          >
            Edit
          </button>
        </div>
        <div className="space-y-2.5">
          <TargetRow label="Calories" value={`${goals.calories} kcal`} color="var(--color-accent)" />
          <TargetRow label="Protein" value={`${goals.protein}g`} color="var(--color-accent)" />
          <TargetRow label="Carbs" value={`${goals.carbs}g`} color="var(--color-orange)" />
          <TargetRow label="Fat" value={`${goals.fat}g`} color="#D07A3E" />
          {goals.tdee > 0 && (
            <div className="pt-1 border-t border-border">
              <p className="text-[10px] text-muted-light">TDEE: {goals.tdee} kcal/day{goals.isCustom ? " (custom targets)" : ""}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {/* Dev Mode Toggle */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Code2 className="h-4 w-4 text-violet-500" />
          <div className="flex-1">
            <span className="text-sm font-bold text-foreground">Dev Mode</span>
            <p className="text-[10px] text-muted">Mock all AI calls for demos</p>
          </div>
          <button
            onClick={() => setDevMode(!devMode)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              devMode ? "bg-violet-500" : "bg-border"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                devMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <div className="border-t border-border" />
        <button
          onClick={onEditGoals}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-card-hover transition-colors"
        >
          <Settings2 className="h-4 w-4 text-accent" />
          <span className="text-sm font-bold text-foreground">Re-run Goal Setup</span>
        </button>
        <div className="border-t border-border" />
        {onReplayTour && (
          <>
            <button
              onClick={onReplayTour}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-card-hover transition-colors"
            >
              <Play className="h-4 w-4 text-accent" />
              <span className="text-sm font-bold text-foreground">Replay Welcome Tour</span>
            </button>
            <div className="border-t border-border" />
          </>
        )}
        <button
          onClick={onResetAll}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-card-hover transition-colors"
        >
          <span className="text-sm font-bold text-red-500">Reset All Data</span>
        </button>
      </div>

      {/* App info */}
      <div className="text-center py-4">
        <p className="text-[10px] text-muted-light">SnackOverflow v2.0 • Made with 🐾 by Capy</p>
        {isLoggedIn && (
          <p className="text-[9px] text-muted-light mt-1">Your data syncs across all devices</p>
        )}
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background border border-border px-3 py-2.5">
      <p className="text-[10px] text-muted-light">{label}</p>
      <p className="text-xs font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function TargetRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs text-foreground">{label}</span>
      </div>
      <span className="text-xs font-bold text-foreground">{value}</span>
    </div>
  );
}

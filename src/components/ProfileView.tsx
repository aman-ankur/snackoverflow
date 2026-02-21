"use client";

import { Settings2, Target, Flame, User, Scale, Ruler, Activity, LogOut, Cloud, CloudOff } from "lucide-react";
import CapyMascot from "@/components/CapyMascot";
import AuthScreen from "@/components/AuthScreen";
import type { UserProfile, NutritionGoals, StreakData } from "@/lib/dishTypes";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface ProfileViewProps {
  profile: UserProfile | null;
  goals: NutritionGoals;
  streak: StreakData;
  onEditGoals: () => void;
  onResetAll: () => void;
  authUser: SupabaseUser | null;
  isLoggedIn: boolean;
  onMagicLink: (email: string) => Promise<{ error: unknown }>;
  onSignUp: (email: string, password: string) => Promise<{ error: unknown }>;
  onSignInPassword: (email: string, password: string) => Promise<{ error: unknown }>;
  onSignOut: () => Promise<void>;
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
  onEditGoals,
  onResetAll,
  authUser,
  isLoggedIn,
  onMagicLink,
  onSignUp,
  onSignInPassword,
  onSignOut,
}: ProfileViewProps) {
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
        <h3 className="text-base font-extrabold text-foreground mt-3">SnackOverflow</h3>
        <p className="text-xs text-muted mt-0.5">Your Smart Kitchen Assistant</p>
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
            onMagicLink={onMagicLink}
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
        <button
          onClick={onEditGoals}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-card-hover transition-colors"
        >
          <Settings2 className="h-4 w-4 text-accent" />
          <span className="text-sm font-bold text-foreground">Re-run Goal Setup</span>
        </button>
        <div className="border-t border-border" />
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

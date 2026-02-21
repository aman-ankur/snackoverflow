"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, Sofa, Footprints, Bike, Dumbbell, Flame, Target, TrendingDown, Zap, RotateCcw, Scale, ArrowUpCircle, ArrowDownCircle, Check } from "lucide-react";
import CapyMascot from "@/components/CapyMascot";
import type { UserProfile, Gender, ActivityLevel, FitnessGoal, NutritionGoals } from "@/lib/dishTypes";
import { calculateGoals } from "@/lib/tdeeCalculator";

interface GoalOnboardingProps {
  existingProfile?: UserProfile | null;
  onComplete: (profile: UserProfile, goals: NutritionGoals) => void;
  onSkip: () => void;
}

const TOTAL_STEPS = 5;

const ACTIVITY_ICONS: Record<ActivityLevel, typeof Sofa> = {
  sedentary: Sofa,
  light: Footprints,
  moderate: Bike,
  very_active: Dumbbell,
  athlete: Flame,
};

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: "sedentary", label: "Couch Potato", desc: "Desk job, minimal exercise" },
  { value: "light", label: "Lightly Active", desc: "Walking, light exercise 1-3x/week" },
  { value: "moderate", label: "Active", desc: "Moderate exercise 3-5x/week" },
  { value: "very_active", label: "Very Active", desc: "Hard exercise 6-7x/week" },
  { value: "athlete", label: "Athlete", desc: "Training twice a day" },
];

const GOAL_ICONS: Record<FitnessGoal, typeof Target> = {
  lose_mild: Target,
  lose_moderate: TrendingDown,
  lose_aggressive: Zap,
  tone_up: RotateCcw,
  maintain: Scale,
  build_muscle: Dumbbell,
  lean_bulk: ArrowUpCircle,
};

const GOAL_OPTIONS: { value: FitnessGoal; label: string; desc: string; detail: string }[] = [
  {
    value: "lose_mild",
    label: "Lose 2-3 kg",
    desc: "Gentle cut, no crash dieting",
    detail: "~0.25 kg/week • Keep energy for daily life",
  },
  {
    value: "lose_moderate",
    label: "Lose 5-7 kg",
    desc: "Steady fat loss, preserve muscle",
    detail: "~0.5 kg/week • Most popular in India",
  },
  {
    value: "lose_aggressive",
    label: "Lose 7-10 kg",
    desc: "Aggressive cut in 2-3 months",
    detail: "~0.75 kg/week • High protein to save muscle",
  },
  {
    value: "tone_up",
    label: "Tone Up & Recomp",
    desc: "Lose fat, build muscle simultaneously",
    detail: "Slight deficit + high protein • Great for beginners",
  },
  {
    value: "maintain",
    label: "Maintain Weight",
    desc: "Happy where I am, eat balanced",
    detail: "No deficit or surplus • Focus on nutrition quality",
  },
  {
    value: "build_muscle",
    label: "Build Muscle",
    desc: "Gain strength and size",
    detail: "+300 kcal surplus • High protein for growth",
  },
  {
    value: "lean_bulk",
    label: "Lean Bulk",
    desc: "Slow, clean gains — minimal fat",
    detail: "+200 kcal surplus • Controlled muscle gain",
  },
];

const GOAL_LABEL_MAP: Record<FitnessGoal, string> = {
  lose_mild: "gentle weight loss",
  lose_moderate: "steady weight loss",
  lose_aggressive: "aggressive fat loss",
  tone_up: "body recomposition",
  maintain: "maintenance",
  build_muscle: "muscle building",
  lean_bulk: "lean bulk",
};

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -200 : 200, opacity: 0 }),
};

export default function GoalOnboarding({ existingProfile, onComplete, onSkip }: GoalOnboardingProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [name, setName] = useState(existingProfile?.name ?? "");
  const [gender, setGender] = useState<Gender>(existingProfile?.gender ?? "male");
  const [age, setAge] = useState(existingProfile?.age ?? 25);
  const [heightCm, setHeightCm] = useState(existingProfile?.heightCm ?? 170);
  const [heightInput, setHeightInput] = useState(String(existingProfile?.heightCm ?? 170));
  const [weightKg, setWeightKg] = useState(existingProfile?.weightKg ?? 70);
  const [weightInput, setWeightInput] = useState(String(existingProfile?.weightKg ?? 70));
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(existingProfile?.activityLevel ?? "moderate");
  const [goal, setGoal] = useState<FitnessGoal>(existingProfile?.goal ?? "maintain");
  const [useFeet, setUseFeet] = useState(false);
  const [useLbs, setUseLbs] = useState(false);

  const [editingCalories, setEditingCalories] = useState(false);
  const [editingProtein, setEditingProtein] = useState(false);
  const [editingCarbs, setEditingCarbs] = useState(false);
  const [editingFat, setEditingFat] = useState(false);
  const [customGoals, setCustomGoals] = useState<Partial<NutritionGoals>>({});

  // Lock body scroll when onboarding is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const computedGoals = calculateGoals(gender, weightKg, heightCm, age, activityLevel, goal);
  const displayGoals: NutritionGoals = {
    ...computedGoals,
    ...customGoals,
    isCustom: Object.keys(customGoals).length > 0,
  };

  const next = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [step]);

  const prev = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleComplete = useCallback(() => {
    const profile: UserProfile = {
      name: name.trim() || undefined,
      gender,
      age,
      heightCm,
      weightKg,
      activityLevel,
      goal,
      completedAt: new Date().toISOString(),
    };
    onComplete(profile, displayGoals);
  }, [name, gender, age, heightCm, weightKg, activityLevel, goal, displayGoals, onComplete]);

  // Height/weight blur handlers — validate on blur, not on every keystroke
  const handleHeightBlur = () => {
    const val = Number(heightInput);
    if (!val || val < 100) {
      setHeightCm(100);
      setHeightInput("100");
    } else if (val > 250) {
      setHeightCm(250);
      setHeightInput("250");
    } else {
      setHeightCm(Math.round(val));
      setHeightInput(String(Math.round(val)));
    }
  };

  const handleWeightBlur = () => {
    const raw = Number(weightInput);
    const val = useLbs ? Math.round(raw / 2.205) : raw;
    if (!val || val < 30) {
      setWeightKg(30);
      setWeightInput(useLbs ? String(Math.round(30 * 2.205)) : "30");
    } else if (val > 250) {
      setWeightKg(250);
      setWeightInput(useLbs ? String(Math.round(250 * 2.205)) : "250");
    } else {
      setWeightKg(Math.round(val));
      setWeightInput(useLbs ? String(Math.round(Math.round(val) * 2.205)) : String(Math.round(val)));
    }
  };

  // Sync weight input when unit toggles
  useEffect(() => {
    setWeightInput(useLbs ? String(Math.round(weightKg * 2.205)) : String(weightKg));
  }, [useLbs, weightKg]);

  // Sync height input when unit toggles
  useEffect(() => {
    if (!useFeet) setHeightInput(String(heightCm));
  }, [useFeet, heightCm]);

  const feetFromCm = Math.floor(heightCm / 30.48);
  const inchesFromCm = Math.round((heightCm / 2.54) % 12);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/[0.97] backdrop-blur-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-lg mx-auto px-5 py-6 flex flex-col h-full max-h-[100dvh]">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-4 shrink-0">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-accent" : i < step ? "w-2 bg-accent/50" : "w-2 bg-border/80"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 0 && (
              <StepWrapper key="step-0" direction={direction}>
                <div className="flex flex-col items-center text-center pt-8 gap-5">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.4, delay: 0.1 }}
                  >
                    <CapyMascot mood="motivated" size={140} />
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h2 className="text-xl font-bold">Hi! I&apos;m Capy 👋</h2>
                    <p className="text-sm text-muted mt-2 max-w-xs mx-auto">
                      Your food buddy! Let&apos;s set up your nutrition goals in 60 seconds.
                    </p>
                  </motion.div>
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={next}
                    className="flex items-center gap-2 rounded-full bg-accent px-8 py-3 text-sm font-bold text-white transition-all hover:bg-accent-dim active:scale-95"
                  >
                    <Sparkles className="h-4 w-4" />
                    Get Started
                  </motion.button>
                  <button
                    onClick={onSkip}
                    className="text-xs text-muted-light hover:text-muted transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              </StepWrapper>
            )}

            {step === 1 && (
              <StepWrapper key="step-1" direction={direction}>
                <div className="flex flex-col items-center gap-5 pt-2">
                  <CapyMascot mood="happy" size={64} />
                  <h2 className="text-lg font-extrabold text-foreground">About You</h2>

                  {/* Name */}
                  <div className="w-full">
                    <p className="text-xs text-muted mb-2 px-1">What should Capy call you?</p>
                    <input
                      type="text"
                      placeholder="Your name (optional)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={30}
                      className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground placeholder:text-muted-light outline-none focus:border-accent/40 transition-colors"
                    />
                  </div>

                  {/* Gender */}
                  <div className="w-full">
                    <p className="text-xs text-muted mb-2 px-1">Gender</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["male", "female", "other"] as Gender[]).map((g) => (
                        <button
                          key={g}
                          onClick={() => setGender(g)}
                          className={`rounded-xl border px-3 py-2.5 text-xs font-semibold capitalize transition-all active:scale-95 ${
                            gender === g
                              ? "border-accent/40 bg-accent-light text-accent-dim"
                              : "border-border bg-card text-muted hover:bg-card-hover"
                          }`}
                        >
                          {g === "male" ? "♂️ Male" : g === "female" ? "♀️ Female" : "⚧️ Other"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age — slider + display */}
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1 px-1">
                      <p className="text-xs text-muted">Age</p>
                      <p className="text-sm font-bold text-accent">{age} years</p>
                    </div>
                    <input
                      type="range"
                      min={14}
                      max={80}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none bg-border/80 cursor-pointer accent-accent"
                    />
                    <div className="flex justify-between px-1 mt-1">
                      <span className="text-[9px] text-muted-light">14</span>
                      <span className="text-[9px] text-muted-light">80</span>
                    </div>
                  </div>

                  {/* Height */}
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <p className="text-xs text-muted">Height</p>
                      <button
                        onClick={() => setUseFeet((f) => !f)}
                        className="text-[10px] text-accent hover:text-accent-dim"
                      >
                        {useFeet ? "Switch to cm" : "Switch to ft/in"}
                      </button>
                    </div>
                    {useFeet ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={feetFromCm}
                          onChange={(e) => {
                            const ft = Number(e.target.value) || 0;
                            const newCm = Math.round(ft * 30.48 + inchesFromCm * 2.54);
                            setHeightCm(newCm);
                            setHeightInput(String(newCm));
                          }}
                          className="w-16 rounded-xl border border-border bg-card px-3 py-2.5 text-center text-sm font-semibold text-foreground outline-none focus:border-accent/40"
                        />
                        <span className="text-xs text-muted">ft</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={inchesFromCm}
                          onChange={(e) => {
                            const inches = Number(e.target.value) || 0;
                            const newCm = Math.round(feetFromCm * 30.48 + inches * 2.54);
                            setHeightCm(newCm);
                            setHeightInput(String(newCm));
                          }}
                          className="w-16 rounded-xl border border-border bg-card px-3 py-2.5 text-center text-sm font-semibold text-foreground outline-none focus:border-accent/40"
                        />
                        <span className="text-xs text-muted">in</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={heightInput}
                          onChange={(e) => setHeightInput(e.target.value)}
                          onBlur={handleHeightBlur}
                          className="w-24 rounded-xl border border-border bg-card px-3 py-2.5 text-center text-sm font-semibold text-foreground outline-none focus:border-accent/40"
                        />
                        <span className="text-xs text-muted">cm</span>
                      </div>
                    )}
                  </div>

                  {/* Weight */}
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <p className="text-xs text-muted">Weight</p>
                      <button
                        onClick={() => setUseLbs((l) => !l)}
                        className="text-[10px] text-accent hover:text-accent-dim"
                      >
                        {useLbs ? "Switch to kg" : "Switch to lbs"}
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        onBlur={handleWeightBlur}
                        className="w-24 rounded-xl border border-border bg-card px-3 py-2.5 text-center text-sm font-semibold text-foreground outline-none focus:border-accent/40"
                      />
                      <span className="text-xs text-muted">{useLbs ? "lbs" : "kg"}</span>
                    </div>
                  </div>
                </div>
              </StepWrapper>
            )}

            {step === 2 && (
              <StepWrapper key="step-2" direction={direction}>
                <div className="flex flex-col items-center gap-4 pt-2">
                  <CapyMascot mood="motivated" size={64} />
                  <h2 className="text-lg font-extrabold text-foreground">How Active Are You?</h2>
                  <div className="w-full space-y-2">
                    {ACTIVITY_OPTIONS.map((opt) => {
                      const Icon = ACTIVITY_ICONS[opt.value];
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setActivityLevel(opt.value)}
                          className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all active:scale-[0.98] ${
                            activityLevel === opt.value
                              ? "border-accent/40 bg-accent-light"
                              : "border-border bg-card hover:bg-card-hover"
                          }`}
                        >
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${
                            activityLevel === opt.value ? "bg-accent/15" : "bg-border/30"
                          }`}>
                            <Icon className={`h-4.5 w-4.5 ${activityLevel === opt.value ? "text-accent" : "text-muted"}`} />
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${activityLevel === opt.value ? "text-accent-dim" : "text-foreground"}`}>
                              {opt.label}
                            </p>
                            <p className="text-xs text-muted">{opt.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </StepWrapper>
            )}

            {step === 3 && (
              <StepWrapper key="step-3" direction={direction}>
                <div className="flex flex-col items-center gap-4 pt-2">
                  <CapyMascot mood="happy" size={64} />
                  <div className="text-center">
                    <h2 className="text-lg font-extrabold text-foreground">What&apos;s Your Goal?</h2>
                    <p className="text-xs text-muted mt-1">Pick what feels right — you can always change later</p>
                  </div>
                  <div className="w-full space-y-2">
                    {GOAL_OPTIONS.map((opt) => {
                      const Icon = GOAL_ICONS[opt.value];
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setGoal(opt.value)}
                          className={`w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all active:scale-[0.98] ${
                            goal === opt.value
                              ? "border-accent/40 bg-accent-light"
                              : "border-border bg-card hover:bg-card-hover"
                          }`}
                        >
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 mt-0.5 ${
                            goal === opt.value ? "bg-accent/15" : "bg-border/30"
                          }`}>
                            <Icon className={`h-4.5 w-4.5 ${goal === opt.value ? "text-accent" : "text-muted"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${goal === opt.value ? "text-accent-dim" : "text-foreground"}`}>
                              {opt.label}
                            </p>
                            <p className="text-xs text-muted">{opt.desc}</p>
                            <p className={`text-[10px] mt-0.5 ${goal === opt.value ? "text-accent" : "text-muted-light"}`}>
                              {opt.detail}
                            </p>
                          </div>
                          {goal === opt.value && (
                            <Check className="h-4 w-4 text-accent mt-1 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </StepWrapper>
            )}

            {step === 4 && (
              <StepWrapper key="step-4" direction={direction}>
                <div className="flex flex-col items-center gap-5 pt-4">
                  <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                  >
                    <CapyMascot mood="excited" size={100} />
                  </motion.div>
                  <h2 className="text-lg font-extrabold text-foreground">Your Personalized Plan</h2>
                  <p className="text-xs text-muted -mt-3">Tap the number or drag the ring to adjust</p>

                  {/* Calorie ring — tap to edit or drag to adjust */}
                  <CalorieRingDial
                    value={displayGoals.calories}
                    onChange={(v) => setCustomGoals((p) => ({ ...p, calories: v }))}
                    editing={editingCalories}
                    onToggleEdit={() => setEditingCalories((e) => !e)}
                  />

                  <p className="text-[10px] text-muted-light -mt-2">
                    TDEE: {computedGoals.tdee} kcal
                  </p>

                  {/* Macro pills */}
                  <div className="grid grid-cols-3 gap-2 w-full">
                    <MacroPill
                      label="Protein"
                      value={displayGoals.protein}
                      unit="g"
                      colorClass="text-accent"
                      bgClass="bg-accent/10 border-accent/20"
                      editing={editingProtein}
                      onToggleEdit={() => setEditingProtein((e) => !e)}
                      onChange={(v) => setCustomGoals((p) => ({ ...p, protein: v }))}
                    />
                    <MacroPill
                      label="Carbs"
                      value={displayGoals.carbs}
                      unit="g"
                      colorClass="text-yellow-400"
                      bgClass="bg-yellow-400/10 border-yellow-400/20"
                      editing={editingCarbs}
                      onToggleEdit={() => setEditingCarbs((e) => !e)}
                      onChange={(v) => setCustomGoals((p) => ({ ...p, carbs: v }))}
                    />
                    <MacroPill
                      label="Fat"
                      value={displayGoals.fat}
                      unit="g"
                      colorClass="text-red-400"
                      bgClass="bg-red-400/10 border-red-400/20"
                      editing={editingFat}
                      onToggleEdit={() => setEditingFat((e) => !e)}
                      onChange={(v) => setCustomGoals((p) => ({ ...p, fat: v }))}
                    />
                  </div>

                  <div className="rounded-xl border border-accent/20 bg-accent-light px-4 py-2.5 w-full">
                    <p className="text-xs text-muted text-center">
                      🐾 Capy says: Based on your profile, this plan is perfect for your{" "}
                      <span className="text-accent font-medium">
                        {GOAL_LABEL_MAP[goal]}
                      </span>{" "}
                      goal!
                    </p>
                  </div>
                </div>
              </StepWrapper>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4 shrink-0">
          {step > 0 ? (
            <button
              onClick={prev}
              className="flex items-center gap-1 rounded-full border border-border px-4 py-2.5 text-xs font-medium text-muted hover:bg-card-hover active:scale-95"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step > 0 && step < TOTAL_STEPS - 1 && (
            <button
              onClick={next}
              className="flex items-center gap-1 rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-dim active:scale-95"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}

          {step === TOTAL_STEPS - 1 && (
            <motion.button
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={handleComplete}
              className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-dim active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              Let&apos;s Go!
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StepWrapper({ children, direction }: { children: React.ReactNode; direction: number }) {
  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

function AnimatedNumber({ value, className = "" }: { value: number; className?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={className}
    >
      {value}
    </motion.span>
  );
}

const RING_SIZE = 160;
const RING_CENTER = RING_SIZE / 2;
const RING_RADIUS = 62;
const MIN_CAL = 800;
const MAX_CAL = 5000;
const CAL_STEP = 25;

function CalorieRingDial({
  value,
  onChange,
  editing,
  onToggleEdit,
}: {
  value: number;
  onChange: (v: number) => void;
  editing: boolean;
  onToggleEdit: () => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const lastAngle = useRef(0);

  const getAngle = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (editing) return;
    dragging.current = true;
    lastAngle.current = getAngle(e.clientX, e.clientY);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const angle = getAngle(e.clientX, e.clientY);
    let delta = angle - lastAngle.current;
    // Normalize delta to [-PI, PI]
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    // Map radians to calorie change: full rotation ≈ 2000 kcal
    const calDelta = (delta / (2 * Math.PI)) * 2000;
    const newVal = Math.round((value + calDelta) / CAL_STEP) * CAL_STEP;
    const clamped = Math.max(MIN_CAL, Math.min(MAX_CAL, newVal));
    if (clamped !== value) onChange(clamped);
    lastAngle.current = angle;
  };

  const handlePointerUp = () => {
    dragging.current = false;
  };

  // Normalized progress for the ring arc (0-1 mapped from MIN_CAL to MAX_CAL)
  const progress = (value - MIN_CAL) / (MAX_CAL - MIN_CAL);
  const circumference = 2 * Math.PI * RING_RADIUS;
  const strokeDashoffset = circumference - progress * circumference;

  // Thumb position on the ring
  const thumbAngle = -Math.PI / 2 + progress * 2 * Math.PI;
  const thumbX = RING_CENTER + RING_RADIUS * Math.cos(thumbAngle);
  const thumbY = RING_CENTER + RING_RADIUS * Math.sin(thumbAngle);

  return (
    <div className="relative flex flex-col items-center touch-none select-none">
      <svg
        ref={svgRef}
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* Track */}
        <circle
          cx={RING_CENTER} cy={RING_CENTER} r={RING_RADIUS}
          fill="none" stroke="var(--color-border)" strokeWidth="10"
        />
        {/* Progress arc */}
        <circle
          cx={RING_CENTER} cy={RING_CENTER} r={RING_RADIUS}
          fill="none" stroke="var(--color-accent)" strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
          className="transition-[stroke-dashoffset] duration-100"
        />
        {/* Draggable thumb */}
        <circle
          cx={thumbX} cy={thumbY} r="8"
          fill="var(--color-accent)" stroke="white" strokeWidth="3"
          className="drop-shadow-md"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {editing ? (
          <input
            autoFocus
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(Math.max(MIN_CAL, Math.min(MAX_CAL, Number(e.target.value) || MIN_CAL)))}
            onBlur={onToggleEdit}
            onKeyDown={(e) => e.key === "Enter" && onToggleEdit()}
            className="w-24 bg-transparent text-center text-2xl font-extrabold text-foreground outline-none pointer-events-auto"
          />
        ) : (
          <button onClick={onToggleEdit} className="text-center pointer-events-auto">
            <span className="text-2xl font-extrabold text-foreground">{value}</span>
          </button>
        )}
        <span className="text-xs text-muted font-medium">kcal / day</span>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={() => onChange(Math.max(MIN_CAL, value - CAL_STEP))}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-border/40 hover:bg-border/60 active:scale-90 transition-all"
        >
          <ArrowDownCircle className="h-4 w-4 text-muted" />
        </button>
        <span className="text-[10px] text-muted-light w-16 text-center">±{CAL_STEP} kcal</span>
        <button
          onClick={() => onChange(Math.min(MAX_CAL, value + CAL_STEP))}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-border/40 hover:bg-border/60 active:scale-90 transition-all"
        >
          <ArrowUpCircle className="h-4 w-4 text-muted" />
        </button>
      </div>
    </div>
  );
}

function MacroPill({
  label,
  value,
  unit,
  colorClass,
  bgClass,
  editing,
  onToggleEdit,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  colorClass: string;
  bgClass: string;
  editing: boolean;
  onToggleEdit: () => void;
  onChange: (v: number) => void;
}) {
  return (
    <button
      onClick={onToggleEdit}
      className={`rounded-xl border px-3 py-3 text-center transition-all active:scale-95 ${bgClass}`}
    >
      <p className={`text-[10px] ${colorClass} opacity-70`}>{label}</p>
      {editing ? (
        <input
          autoFocus
          type="number"
          inputMode="numeric"
          value={value}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          onBlur={onToggleEdit}
          onKeyDown={(e) => e.key === "Enter" && onToggleEdit()}
          className={`w-full bg-transparent text-center text-lg font-bold outline-none ${colorClass}`}
        />
      ) : (
        <p className={`text-lg font-bold ${colorClass}`}>
          {value}
          <span className="text-xs font-normal opacity-60 ml-0.5">{unit}</span>
        </p>
      )}
    </button>
  );
}

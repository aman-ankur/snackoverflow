"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Search,
  X,
  Check,
  Users,
  ShieldCheck,
  MessageSquareText,
  Sparkles,
  Calendar,
  ChevronDown,
  ChevronUp,
  Leaf,
  Egg,
  Fish,
  Drumstick,
  Vegan,
} from "lucide-react";
import CapyMascot from "@/components/CapyMascot";
import type {
  HealthCondition,
  LabValue,
  ConditionStatus,
  DietPreference,
  HealthProfile,
} from "@/lib/dishTypes";
import {
  CONDITIONS_REGISTRY,
  ALLERGY_OPTIONS,
  getHighImpactConditions,
  getMediumImpactConditions,
  getConditionById,
} from "@/lib/healthConditions";
import type { ConditionDef } from "@/lib/healthConditions";

/* ─── Props ─── */

interface HealthProfileWizardProps {
  existingProfile?: HealthProfile | null;
  onComplete: (
    conditions: HealthCondition[],
    labValues: LabValue[],
    freeTextNotes: string,
    dietPreference?: DietPreference
  ) => void;
  onSkip: () => void;
  isStandalone?: boolean;
}

/* ─── Constants ─── */

const TOTAL_STEPS = 5;

const DIET_OPTIONS: { value: DietPreference; label: string; icon: typeof Leaf }[] = [
  { value: "veg", label: "Vegetarian", icon: Leaf },
  { value: "nonveg", label: "Non-Veg", icon: Drumstick },
  { value: "eggetarian", label: "Eggetarian", icon: Egg },
  { value: "vegan", label: "Vegan", icon: Vegan },
  { value: "pescatarian", label: "Pescatarian", icon: Fish },
];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -200 : 200, opacity: 0 }),
};

/* ─── Main Component ─── */

export default function HealthProfileWizard({
  existingProfile,
  onComplete,
  onSkip,
  isStandalone = false,
}: HealthProfileWizardProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // State: selected conditions with their status
  const [selectedConditions, setSelectedConditions] = useState<Map<string, ConditionStatus>>(() => {
    const map = new Map<string, ConditionStatus>();
    if (existingProfile?.conditions) {
      existingProfile.conditions.forEach((c) => map.set(c.id, c.status));
    }
    return map;
  });

  // State: selected allergies (sub-options for food_allergies)
  const [selectedAllergies, setSelectedAllergies] = useState<Set<string>>(() => {
    // Extract from existing freeTextNotes or conditions
    return new Set<string>();
  });

  // State: lab values
  const [labValues, setLabValues] = useState<Map<string, { value: string; testedAt: string }>>(() => {
    const map = new Map<string, { value: string; testedAt: string }>();
    if (existingProfile?.labValues) {
      existingProfile.labValues.forEach((l) =>
        map.set(l.key, { value: String(l.value), testedAt: l.testedAt })
      );
    }
    return map;
  });

  // State: expanded condition (for inline lab inputs)
  const [expandedCondition, setExpandedCondition] = useState<string | null>(null);

  // State: free text + diet
  const [freeTextNotes, setFreeTextNotes] = useState(existingProfile?.freeTextNotes ?? "");
  const [dietPreference, setDietPreference] = useState<DietPreference | undefined>(
    existingProfile?.dietPreference
  );

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

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

  // Toggle condition: off → family_history → active → off
  const cycleCondition = useCallback((conditionId: string) => {
    setSelectedConditions((prev) => {
      const next = new Map(prev);
      const current = next.get(conditionId);
      if (!current) {
        next.set(conditionId, "family_history");
      } else if (current === "family_history") {
        next.set(conditionId, "active");
      } else {
        next.delete(conditionId);
        // Collapse if expanded
        setExpandedCondition((e) => (e === conditionId ? null : e));
      }
      return next;
    });
  }, []);

  // Set condition directly
  const setConditionStatus = useCallback((conditionId: string, status: ConditionStatus | null) => {
    setSelectedConditions((prev) => {
      const next = new Map(prev);
      if (status === null) {
        next.delete(conditionId);
      } else {
        next.set(conditionId, status);
      }
      return next;
    });
  }, []);

  // Update a lab value
  const updateLabValue = useCallback((key: string, value: string, testedAt?: string) => {
    setLabValues((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      next.set(key, {
        value,
        testedAt: testedAt ?? existing?.testedAt ?? new Date().toISOString().slice(0, 10),
      });
      return next;
    });
  }, []);

  const updateLabDate = useCallback((key: string, testedAt: string) => {
    setLabValues((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      next.set(key, { value: existing?.value ?? "", testedAt });
      return next;
    });
  }, []);

  // Toggle allergy
  const toggleAllergy = useCallback((allergyId: string) => {
    setSelectedAllergies((prev) => {
      const next = new Set(prev);
      if (next.has(allergyId)) next.delete(allergyId);
      else next.add(allergyId);
      return next;
    });
  }, []);

  // Filtered conditions for search
  const filteredConditions = useMemo(() => {
    if (!searchQuery.trim()) return CONDITIONS_REGISTRY;
    const q = searchQuery.toLowerCase();
    return CONDITIONS_REGISTRY.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.shortLabel.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Conditions that have lab fields and are selected as active
  const conditionsWithLabs = useMemo(() => {
    return CONDITIONS_REGISTRY.filter(
      (c) => c.labFields.length > 0 && selectedConditions.get(c.id) === "active"
    );
  }, [selectedConditions]);

  // Handle complete
  const handleComplete = useCallback(() => {
    const conditions: HealthCondition[] = [];
    selectedConditions.forEach((status, id) => {
      const def = getConditionById(id);
      if (def) {
        conditions.push({ id, label: def.label, status });
      }
    });

    // Add allergies as part of free text if food_allergies is selected
    let notes = freeTextNotes;
    if (selectedAllergies.size > 0) {
      const allergyLabels = Array.from(selectedAllergies)
        .map((id) => ALLERGY_OPTIONS.find((a) => a.id === id)?.label)
        .filter(Boolean);
      if (allergyLabels.length > 0) {
        const allergyNote = `Allergic to: ${allergyLabels.join(", ")}.`;
        if (!notes.includes(allergyNote)) {
          notes = notes ? `${notes}\n${allergyNote}` : allergyNote;
        }
      }
    }

    const labs: LabValue[] = [];
    labValues.forEach((entry, key) => {
      const numVal = parseFloat(entry.value);
      if (!isNaN(numVal) && numVal > 0) {
        // Find the lab field definition to get label + unit
        for (const cond of CONDITIONS_REGISTRY) {
          const field = cond.labFields.find((f) => f.key === key);
          if (field) {
            labs.push({
              key,
              label: field.label,
              value: numVal,
              unit: field.unit,
              testedAt: entry.testedAt,
            });
            break;
          }
        }
      }
    });

    onComplete(conditions, labs, notes, dietPreference);
  }, [selectedConditions, selectedAllergies, labValues, freeTextNotes, dietPreference, onComplete]);

  const selectedCount = selectedConditions.size;

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
            {/* ── Step 0: Dr. Capy Intro ── */}
            {step === 0 && (
              <StepWrapper key="health-0" direction={direction}>
                <div className="flex flex-col items-center text-center pt-6 gap-5">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.4, delay: 0.1 }}
                    className="relative"
                  >
                    <CapyMascot mood="motivated" size={130} />
                    <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-lg">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h2 className="text-xl font-bold text-foreground">Dr. Capy is here!</h2>
                    <p className="text-sm text-muted mt-2 max-w-xs mx-auto">
                      Tell me about your health so I can give you{" "}
                      <span className="text-accent font-semibold">personalized food advice</span>{" "}
                      every time you scan a meal.
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                        <span>Private & secure</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-accent" />
                        <span>Takes 60 seconds</span>
                      </div>
                    </div>
                    <button
                      onClick={next}
                      className="flex items-center gap-2 rounded-full bg-accent px-8 py-3 text-sm font-bold text-white transition-all hover:bg-accent-dim active:scale-95"
                    >
                      <Stethoscope className="h-4 w-4" />
                      Let&apos;s Check Up
                    </button>
                    <button
                      onClick={onSkip}
                      className="text-xs text-muted-light hover:text-muted transition-colors"
                    >
                      Skip for now
                    </button>
                  </motion.div>
                </div>
              </StepWrapper>
            )}

            {/* ── Step 1: Conditions Chip Grid ── */}
            {step === 1 && (
              <StepWrapper key="health-1" direction={direction}>
                <div className="flex flex-col gap-4 pt-1">
                  <div className="flex items-center gap-3">
                    <CapyMascot mood="happy" size={48} />
                    <div>
                      <h2 className="text-lg font-extrabold text-foreground">Any health conditions?</h2>
                      <p className="text-xs text-muted">
                        Tap once for family history, twice for active condition
                      </p>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-light" />
                    <input
                      type="text"
                      placeholder="Search conditions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card pl-9 pr-8 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-light outline-none focus:border-accent/40 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <X className="h-4 w-4 text-muted-light" />
                      </button>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 text-[10px] text-muted px-1">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-border/80" />
                      <span>Not selected</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <span>Family history</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span>I have this</span>
                    </div>
                  </div>

                  {/* High Impact */}
                  {!searchQuery && (
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider px-1">
                      High Dietary Impact
                    </p>
                  )}
                  <ConditionGrid
                    conditions={searchQuery ? filteredConditions : getHighImpactConditions()}
                    selectedConditions={selectedConditions}
                    expandedCondition={expandedCondition}
                    labValues={labValues}
                    onCycle={cycleCondition}
                    onSetStatus={setConditionStatus}
                    onExpand={setExpandedCondition}
                    onUpdateLab={updateLabValue}
                    onUpdateLabDate={updateLabDate}
                  />

                  {/* Medium Impact */}
                  {!searchQuery && (
                    <>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-wider px-1 mt-2">
                        Medium Dietary Impact
                      </p>
                      <ConditionGrid
                        conditions={getMediumImpactConditions()}
                        selectedConditions={selectedConditions}
                        expandedCondition={expandedCondition}
                        labValues={labValues}
                        onCycle={cycleCondition}
                        onSetStatus={setConditionStatus}
                        onExpand={setExpandedCondition}
                        onUpdateLab={updateLabValue}
                        onUpdateLabDate={updateLabDate}
                      />
                    </>
                  )}

                  {selectedCount > 0 && (
                    <div className="rounded-xl border border-accent/20 bg-accent-light px-3 py-2 mt-1">
                      <p className="text-xs text-accent-dim font-medium text-center">
                        {selectedCount} condition{selectedCount > 1 ? "s" : ""} selected
                      </p>
                    </div>
                  )}
                </div>
              </StepWrapper>
            )}

            {/* ── Step 2: Allergies (if food_allergies selected) + Lab Values Summary ── */}
            {step === 2 && (
              <StepWrapper key="health-2" direction={direction}>
                <div className="flex flex-col gap-4 pt-1">
                  <div className="flex items-center gap-3">
                    <CapyMascot mood="motivated" size={48} />
                    <div>
                      <h2 className="text-lg font-extrabold text-foreground">
                        {conditionsWithLabs.length > 0 ? "Your lab values" : "Almost done!"}
                      </h2>
                      <p className="text-xs text-muted">
                        {conditionsWithLabs.length > 0
                          ? "Optional — helps Dr. Capy give more precise advice"
                          : "Any food allergies or dietary preferences?"}
                      </p>
                    </div>
                  </div>

                  {/* Lab values for active conditions */}
                  {conditionsWithLabs.length > 0 && (
                    <div className="space-y-3">
                      {conditionsWithLabs.map((cond) => (
                        <LabInputGroup
                          key={cond.id}
                          condition={cond}
                          labValues={labValues}
                          onUpdateLab={updateLabValue}
                          onUpdateLabDate={updateLabDate}
                        />
                      ))}
                    </div>
                  )}

                  {/* Food allergies sub-options */}
                  {selectedConditions.has("food_allergies") && (
                    <div>
                      <p className="text-xs font-bold text-foreground mb-2 px-1">
                        Which foods are you allergic to?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ALLERGY_OPTIONS.map((allergy) => {
                          const isSelected = selectedAllergies.has(allergy.id);
                          return (
                            <button
                              key={allergy.id}
                              onClick={() => toggleAllergy(allergy.id)}
                              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                                isSelected
                                  ? "border-red-300 bg-red-50 text-red-700"
                                  : "border-border bg-card text-muted hover:bg-card-hover"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                              {allergy.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Diet preference */}
                  <div>
                    <p className="text-xs font-bold text-foreground mb-2 px-1">
                      Dietary preference
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {DIET_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = dietPreference === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() =>
                              setDietPreference(isSelected ? undefined : opt.value)
                            }
                            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all active:scale-95 ${
                              isSelected
                                ? "border-accent/40 bg-accent-light text-accent-dim"
                                : "border-border bg-card text-muted hover:bg-card-hover"
                            }`}
                          >
                            <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-accent" : "text-muted-light"}`} />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </StepWrapper>
            )}

            {/* ── Step 3: Free Text Notes ── */}
            {step === 3 && (
              <StepWrapper key="health-3" direction={direction}>
                <div className="flex flex-col gap-5 pt-2">
                  <div className="flex items-center gap-3">
                    <CapyMascot mood="happy" size={48} />
                    <div>
                      <h2 className="text-lg font-extrabold text-foreground">Anything else?</h2>
                      <p className="text-xs text-muted">
                        Tell Dr. Capy about symptoms, triggers, or preferences
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <MessageSquareText className="absolute left-3 top-3 h-4 w-4 text-muted-light" />
                    <textarea
                      value={freeTextNotes}
                      onChange={(e) => setFreeTextNotes(e.target.value)}
                      placeholder="e.g. I get bloated after eating wheat, I feel acidic after spicy food, doctor told me to avoid sodium..."
                      maxLength={500}
                      rows={5}
                      className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-light outline-none focus:border-accent/40 transition-colors resize-none"
                    />
                    <p className="text-[10px] text-muted-light text-right mt-1 px-1">
                      {freeTextNotes.length}/500
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-xs text-muted leading-relaxed">
                      <span className="font-semibold text-foreground">Examples:</span>
                    </p>
                    <ul className="text-xs text-muted mt-1.5 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-accent mt-0.5 shrink-0">
                          <ChevronRight className="h-3 w-3" />
                        </span>
                        &quot;I get migraines from aged cheese and red wine&quot;
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent mt-0.5 shrink-0">
                          <ChevronRight className="h-3 w-3" />
                        </span>
                        &quot;Bloating after milk but curd is fine&quot;
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent mt-0.5 shrink-0">
                          <ChevronRight className="h-3 w-3" />
                        </span>
                        &quot;Doctor said to keep protein under 60g/day&quot;
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent mt-0.5 shrink-0">
                          <ChevronRight className="h-3 w-3" />
                        </span>
                        &quot;I take metformin before meals&quot;
                      </li>
                    </ul>
                  </div>
                </div>
              </StepWrapper>
            )}

            {/* ── Step 4: Review ── */}
            {step === 4 && (
              <StepWrapper key="health-4" direction={direction}>
                <div className="flex flex-col items-center gap-5 pt-4">
                  <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="relative"
                  >
                    <CapyMascot mood="excited" size={100} />
                    <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white shadow-lg">
                      <ShieldCheck className="h-4.5 w-4.5" />
                    </div>
                  </motion.div>

                  <h2 className="text-lg font-extrabold text-foreground">Your Health Profile</h2>
                  <p className="text-xs text-muted -mt-3">
                    Dr. Capy will use this to personalize every meal scan
                  </p>

                  {/* Summary card */}
                  <div className="w-full space-y-3">
                    {/* Active conditions */}
                    <ReviewSection title="Active Conditions" icon={Stethoscope}>
                      {Array.from(selectedConditions.entries())
                        .filter(([, status]) => status === "active")
                        .map(([id]) => {
                          const def = getConditionById(id);
                          if (!def) return null;
                          const Icon = def.icon;
                          return (
                            <div key={id} className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
                                <Icon className="h-3 w-3 text-red-500" />
                              </div>
                              <span className="text-xs font-medium text-foreground">{def.label}</span>
                            </div>
                          );
                        })}
                      {Array.from(selectedConditions.values()).filter((s) => s === "active").length === 0 && (
                        <p className="text-xs text-muted-light">None</p>
                      )}
                    </ReviewSection>

                    {/* Family history */}
                    <ReviewSection title="Family History" icon={Users}>
                      {Array.from(selectedConditions.entries())
                        .filter(([, status]) => status === "family_history")
                        .map(([id]) => {
                          const def = getConditionById(id);
                          if (!def) return null;
                          const Icon = def.icon;
                          return (
                            <div key={id} className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
                                <Icon className="h-3 w-3 text-amber-600" />
                              </div>
                              <span className="text-xs font-medium text-foreground">{def.label}</span>
                            </div>
                          );
                        })}
                      {Array.from(selectedConditions.values()).filter((s) => s === "family_history").length === 0 && (
                        <p className="text-xs text-muted-light">None</p>
                      )}
                    </ReviewSection>

                    {/* Lab values */}
                    {Array.from(labValues.entries()).filter(([, v]) => v.value && parseFloat(v.value) > 0).length > 0 && (
                      <ReviewSection title="Lab Values" icon={Sparkles}>
                        {Array.from(labValues.entries())
                          .filter(([, v]) => v.value && parseFloat(v.value) > 0)
                          .map(([key, entry]) => {
                            let label = key;
                            let unit = "";
                            for (const cond of CONDITIONS_REGISTRY) {
                              const field = cond.labFields.find((f) => f.key === key);
                              if (field) {
                                label = field.label;
                                unit = field.unit;
                                break;
                              }
                            }
                            return (
                              <div key={key} className="flex items-center justify-between">
                                <span className="text-xs text-muted">{label}</span>
                                <span className="text-xs font-bold text-foreground">
                                  {entry.value} {unit}
                                </span>
                              </div>
                            );
                          })}
                      </ReviewSection>
                    )}

                    {/* Diet + Notes */}
                    {(dietPreference || freeTextNotes.trim()) && (
                      <ReviewSection title="Preferences & Notes" icon={MessageSquareText}>
                        {dietPreference && (
                          <p className="text-xs text-foreground">
                            <span className="text-muted">Diet:</span>{" "}
                            <span className="font-medium">
                              {DIET_OPTIONS.find((d) => d.value === dietPreference)?.label ?? dietPreference}
                            </span>
                          </p>
                        )}
                        {freeTextNotes.trim() && (
                          <p className="text-xs text-muted italic mt-1">
                            &quot;{freeTextNotes.trim().slice(0, 100)}
                            {freeTextNotes.trim().length > 100 ? "..." : ""}&quot;
                          </p>
                        )}
                      </ReviewSection>
                    )}
                  </div>

                  <div className="rounded-xl border border-accent/20 bg-accent-light px-4 py-2.5 w-full">
                    <p className="text-[10px] text-muted text-center leading-relaxed">
                      <ShieldCheck className="h-3 w-3 text-accent inline mr-1 -mt-0.5" />
                      For informational purposes only. Not a substitute for medical advice.
                      Consult your doctor for dietary changes.
                    </p>
                  </div>
                </div>
              </StepWrapper>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
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
              <Stethoscope className="h-4 w-4" />
              Save Profile
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Sub-components ─── */

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

/* ─── Condition Grid ─── */

function ConditionGrid({
  conditions,
  selectedConditions,
  expandedCondition,
  labValues,
  onCycle,
  onSetStatus,
  onExpand,
  onUpdateLab,
  onUpdateLabDate,
}: {
  conditions: ConditionDef[];
  selectedConditions: Map<string, ConditionStatus>;
  expandedCondition: string | null;
  labValues: Map<string, { value: string; testedAt: string }>;
  onCycle: (id: string) => void;
  onSetStatus: (id: string, status: ConditionStatus | null) => void;
  onExpand: (id: string | null) => void;
  onUpdateLab: (key: string, value: string, testedAt?: string) => void;
  onUpdateLabDate: (key: string, testedAt: string) => void;
}) {
  return (
    <div className="space-y-2">
      {conditions.map((cond) => {
        const status = selectedConditions.get(cond.id);
        const isExpanded = expandedCondition === cond.id;
        const hasLabs = cond.labFields.length > 0 && status === "active";
        const Icon = cond.icon;

        return (
          <div key={cond.id}>
            <button
              onClick={() => onCycle(cond.id)}
              className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all active:scale-[0.98] ${
                status === "active"
                  ? "border-red-300/60 bg-red-50/60"
                  : status === "family_history"
                  ? "border-amber-300/60 bg-amber-50/60"
                  : "border-border bg-card hover:bg-card-hover"
              }`}
            >
              {/* Status dot */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                  status === "active"
                    ? "bg-red-100"
                    : status === "family_history"
                    ? "bg-amber-100"
                    : "bg-border/30"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    status === "active"
                      ? "text-red-500"
                      : status === "family_history"
                      ? "text-amber-600"
                      : "text-muted-light"
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    status === "active"
                      ? "text-red-700"
                      : status === "family_history"
                      ? "text-amber-700"
                      : "text-foreground"
                  }`}
                >
                  {cond.label}
                </p>
                <p className="text-[10px] text-muted truncate">{cond.description}</p>
              </div>

              {/* Status badge */}
              {status && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    status === "active"
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-600"
                  }`}
                >
                  {status === "active" ? "Active" : "Family"}
                </span>
              )}

              {/* Expand arrow for lab inputs */}
              {hasLabs && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpand(isExpanded ? null : cond.id);
                  }}
                  className="shrink-0 p-1"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted" />
                  )}
                </button>
              )}
            </button>

            {/* Inline lab inputs */}
            <AnimatePresence>
              {hasLabs && isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="ml-11 mr-2 mt-1 mb-2 space-y-2 rounded-lg border border-border/60 bg-card/80 p-3">
                    <p className="text-[10px] text-muted font-medium uppercase tracking-wider">
                      Lab Values (optional)
                    </p>
                    {cond.labFields.map((field) => {
                      const entry = labValues.get(field.key);
                      return (
                        <div key={field.key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-foreground">
                              {field.label}
                            </label>
                            <span className="text-[10px] text-muted-light">
                              Normal: {field.normalRange}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              inputMode="decimal"
                              step={field.step}
                              min={field.min}
                              max={field.max}
                              placeholder={field.placeholder}
                              value={entry?.value ?? ""}
                              onChange={(e) => onUpdateLab(field.key, e.target.value)}
                              className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-semibold text-foreground placeholder:text-muted-light outline-none focus:border-accent/40"
                            />
                            <span className="text-xs text-muted shrink-0 w-12">
                              {field.unit}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-muted-light" />
                            <input
                              type="date"
                              value={entry?.testedAt ?? ""}
                              onChange={(e) => onUpdateLabDate(field.key, e.target.value)}
                              className="text-[10px] text-muted border-none bg-transparent outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Lab Input Group (for Step 2 dedicated view) ─── */

function LabInputGroup({
  condition,
  labValues,
  onUpdateLab,
  onUpdateLabDate,
}: {
  condition: ConditionDef;
  labValues: Map<string, { value: string; testedAt: string }>;
  onUpdateLab: (key: string, value: string, testedAt?: string) => void;
  onUpdateLabDate: (key: string, testedAt: string) => void;
}) {
  const Icon = condition.icon;

  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100">
          <Icon className="h-3.5 w-3.5 text-red-500" />
        </div>
        <p className="text-xs font-bold text-foreground">{condition.label}</p>
      </div>
      <div className="space-y-3">
        {condition.labFields.map((field) => {
          const entry = labValues.get(field.key);
          return (
            <div key={field.key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">{field.label}</label>
                <span className="text-[10px] text-muted-light">Normal: {field.normalRange}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  step={field.step}
                  min={field.min}
                  max={field.max}
                  placeholder={field.placeholder}
                  value={entry?.value ?? ""}
                  onChange={(e) => onUpdateLab(field.key, e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground placeholder:text-muted-light outline-none focus:border-accent/40"
                />
                <span className="text-xs text-muted shrink-0 w-14">{field.unit}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="h-3 w-3 text-muted-light" />
                <span className="text-[10px] text-muted">Tested:</span>
                <input
                  type="date"
                  value={entry?.testedAt ?? ""}
                  onChange={(e) => onUpdateLabDate(field.key, e.target.value)}
                  className="text-[10px] text-muted border-none bg-transparent outline-none"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Review Section ─── */

function ReviewSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Stethoscope;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-accent" />
        <p className="text-[10px] font-bold text-muted uppercase tracking-wider">{title}</p>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

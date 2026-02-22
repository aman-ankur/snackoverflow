import type {
  HealthCondition,
  HealthProfile,
  LabValue,
  ConditionStatus,
} from "@/lib/dishTypes";

/* ─── Health Context String Builder ───
 *
 * Generates a compact ~50-80 token string from the user's health profile.
 * This string is injected into the AI prompt at verdict time (pass 2).
 * Lab values are interpreted here into severity descriptors — raw numbers
 * are NOT sent to the AI.
 */

interface ConditionContext {
  conditionId: string;
  label: string;
  status: ConditionStatus;
  severity: string;
  dietaryRules: string[];
}

/* ─── Lab Value Interpretation Rules ─── */

function interpretDiabetesLabs(labs: LabValue[]): { severity: string; rules: string[] } {
  const hba1c = labs.find((l) => l.key === "hba1c");
  const fasting = labs.find((l) => l.key === "fasting_glucose");

  const rules: string[] = [];
  let severity = "moderate";

  if (hba1c) {
    if (hba1c.value >= 9) {
      severity = "poorly controlled";
      rules.push("STRICT: avoid all high-GI carbs, no added sugar, limit total carbs to ~130g/day");
    } else if (hba1c.value >= 7) {
      severity = "needs improvement";
      rules.push("Avoid high-GI foods (white rice, maida, sugar), prefer whole grains + fiber");
    } else if (hba1c.value >= 5.7) {
      severity = "borderline";
      rules.push("Prefer low-GI options, flag high-sugar meals, increase fiber");
    } else {
      severity = "well controlled";
      rules.push("Maintain low-GI diet, continue current approach");
    }
  }

  if (fasting && fasting.value > 126) {
    rules.push("Fasting glucose elevated — avoid simple carbs on empty stomach");
  }

  if (rules.length === 0) {
    rules.push("Monitor carb intake, prefer low-GI foods, increase fiber");
  }

  return { severity, rules };
}

function interpretHypertensionLabs(labs: LabValue[]): { severity: string; rules: string[] } {
  const systolic = labs.find((l) => l.key === "systolic_bp");
  const diastolic = labs.find((l) => l.key === "diastolic_bp");

  const rules: string[] = [];
  let severity = "moderate";

  if (systolic) {
    if (systolic.value >= 160) {
      severity = "stage 2";
      rules.push("STRICT: sodium < 1500mg/day, avoid pickles/papad/processed food/canned items");
    } else if (systolic.value >= 140) {
      severity = "stage 1";
      rules.push("Limit sodium < 2000mg/day, avoid excess salt, pickles, processed food");
    } else if (systolic.value >= 130) {
      severity = "elevated";
      rules.push("Watch sodium intake, prefer fresh over processed, increase potassium");
    }
  }

  if (diastolic && diastolic.value >= 90 && severity === "moderate") {
    severity = "elevated";
    rules.push("Diastolic elevated — limit sodium, increase potassium-rich foods");
  }

  if (rules.length === 0) {
    rules.push("Limit sodium < 2300mg/day, prefer DASH-style eating");
  }

  return { severity, rules };
}

function interpretCholesterolLabs(labs: LabValue[]): { severity: string; rules: string[] } {
  const ldl = labs.find((l) => l.key === "ldl");
  const triglycerides = labs.find((l) => l.key === "triglycerides");

  const rules: string[] = [];
  let severity = "moderate";

  if (ldl) {
    if (ldl.value >= 190) {
      severity = "very high";
      rules.push("STRICT: avoid saturated fat, trans fat, fried food, full-fat dairy, red meat");
    } else if (ldl.value >= 160) {
      severity = "high";
      rules.push("Limit saturated fat, avoid fried food, prefer lean protein + omega-3");
    } else if (ldl.value >= 130) {
      severity = "borderline high";
      rules.push("Reduce saturated fat, increase fiber + omega-3 sources");
    }
  }

  if (triglycerides) {
    if (triglycerides.value >= 500) {
      rules.push("Triglycerides very high — avoid sugar, refined carbs, alcohol completely");
    } else if (triglycerides.value >= 200) {
      rules.push("Triglycerides elevated — limit sugar, refined carbs, alcohol");
    }
  }

  if (rules.length === 0) {
    rules.push("Limit saturated fat, prefer healthy fats (nuts, olive oil, fish)");
  }

  return { severity, rules };
}

function interpretKidneyLabs(labs: LabValue[]): { severity: string; rules: string[] } {
  const creatinine = labs.find((l) => l.key === "creatinine");
  const egfr = labs.find((l) => l.key === "egfr");

  const rules: string[] = [];
  let severity = "moderate";

  if (egfr) {
    if (egfr.value < 30) {
      severity = "advanced CKD";
      rules.push("STRICT: low protein (~0.6g/kg), low sodium, low potassium, low phosphorus");
    } else if (egfr.value < 60) {
      severity = "moderate CKD";
      rules.push("Moderate protein restriction, limit sodium + potassium, avoid processed food");
    } else if (egfr.value < 90) {
      severity = "mild CKD";
      rules.push("Watch protein intake, limit sodium, stay hydrated");
    }
  } else if (creatinine && creatinine.value > 1.5) {
    severity = "elevated creatinine";
    rules.push("Limit protein, reduce sodium, avoid NSAIDs with food interactions");
  }

  if (rules.length === 0) {
    rules.push("Monitor protein intake, limit sodium, stay well hydrated");
  }

  return { severity, rules };
}

function interpretThyroidLabs(labs: LabValue[], conditionId: string): { severity: string; rules: string[] } {
  const tsh = labs.find((l) => l.key === "tsh");
  const rules: string[] = [];
  let severity = "moderate";

  if (conditionId === "hypothyroid") {
    if (tsh && tsh.value > 10) {
      severity = "significantly elevated TSH";
      rules.push("Ensure adequate iodine + selenium, limit raw cruciferous vegetables (goitrogens)");
    } else {
      rules.push("Iodine-aware diet, limit excess soy + raw cruciferous, support metabolism");
    }
  } else {
    if (tsh && tsh.value < 0.1) {
      severity = "very low TSH";
      rules.push("Calorie-dense foods to prevent weight loss, calcium + vitamin D, limit caffeine + iodine");
    } else {
      rules.push("Adequate calcium, limit caffeine, avoid excess iodine");
    }
  }

  return { severity, rules };
}

function interpretAnemiaLabs(labs: LabValue[]): { severity: string; rules: string[] } {
  const hb = labs.find((l) => l.key === "hemoglobin");
  const ferritin = labs.find((l) => l.key === "ferritin");

  const rules: string[] = [];
  let severity = "moderate";

  if (hb && hb.value < 8) {
    severity = "severe anemia";
    rules.push("URGENT: iron-rich foods (spinach, jaggery, dates, liver), pair with vitamin C, avoid tea/coffee with meals");
  } else if (hb && hb.value < 11) {
    severity = "moderate anemia";
    rules.push("Increase iron-rich foods, pair with vitamin C, avoid tea/coffee within 1hr of meals");
  } else if (ferritin && ferritin.value < 20) {
    severity = "low iron stores";
    rules.push("Iron stores depleted — eat iron-rich foods daily, pair with vitamin C");
  }

  if (rules.length === 0) {
    rules.push("Include iron-rich foods, pair with vitamin C sources, limit tea with meals");
  }

  return { severity, rules };
}

function interpretGoutLabs(labs: LabValue[]): { severity: string; rules: string[] } {
  const uricAcid = labs.find((l) => l.key === "uric_acid");
  const rules: string[] = [];
  let severity = "moderate";

  if (uricAcid && uricAcid.value > 9) {
    severity = "very high uric acid";
    rules.push("STRICT: avoid red meat, organ meat, shellfish, beer, high-fructose drinks");
  } else if (uricAcid && uricAcid.value > 7) {
    severity = "elevated";
    rules.push("Limit purine-rich foods (red meat, organ meat, some seafood), stay hydrated, limit alcohol");
  }

  if (rules.length === 0) {
    rules.push("Limit high-purine foods, stay well hydrated, limit alcohol");
  }

  return { severity, rules };
}

/* ─── Default rules for conditions without lab interpretation ─── */

const DEFAULT_CONDITION_RULES: Record<string, string[]> = {
  fatty_liver: ["Avoid sugar + refined carbs, no alcohol, limit saturated fat, support weight loss"],
  pcos: ["Low-GI diet, anti-inflammatory foods, manage weight, limit processed food"],
  ibs_digestive: ["Identify trigger foods, consider low-FODMAP, eat small frequent meals, limit spicy/fried"],
  lactose_intolerant: ["Avoid dairy or use lactose-free alternatives, ensure calcium from other sources"],
  gluten_intolerant: ["Strictly avoid wheat/barley/rye, check for hidden gluten in sauces/processed food"],
  food_allergies: ["Strictly avoid allergen foods, check ingredients carefully"],
  migraine: ["Avoid aged cheese, red wine, MSG, tyramine-rich foods, stay hydrated, regular meals"],
  vitamin_d_deficiency: ["Include vitamin D foods (fatty fish, egg yolks, fortified milk), sun exposure"],
  vitamin_b12_deficiency: ["Include B12 sources (dairy, eggs, fortified foods), consider supplementation if vegetarian"],
};

/* ─── Main Builder ─── */

function buildConditionContext(
  condition: HealthCondition,
  labValues: LabValue[]
): ConditionContext {
  const relevantLabs = labValues.filter((l) => {
    // Match lab keys to condition
    const labConditionMap: Record<string, string[]> = {
      diabetes_type1: ["hba1c", "fasting_glucose"],
      diabetes_type2: ["hba1c", "fasting_glucose"],
      prediabetic: ["hba1c", "fasting_glucose"],
      hypertension: ["systolic_bp", "diastolic_bp"],
      high_cholesterol: ["ldl", "hdl", "triglycerides", "total_cholesterol"],
      kidney_disease: ["creatinine", "egfr"],
      gout: ["uric_acid"],
      hypothyroid: ["tsh"],
      hyperthyroid: ["tsh"],
      iron_deficiency: ["hemoglobin", "ferritin"],
      vitamin_d_deficiency: ["vitamin_d"],
      vitamin_b12_deficiency: ["vitamin_b12"],
    };
    const keys = labConditionMap[condition.id] ?? [];
    return keys.includes(l.key);
  });

  let interpreted: { severity: string; rules: string[] };

  switch (condition.id) {
    case "diabetes_type1":
    case "diabetes_type2":
    case "prediabetic":
      interpreted = interpretDiabetesLabs(relevantLabs);
      break;
    case "hypertension":
      interpreted = interpretHypertensionLabs(relevantLabs);
      break;
    case "high_cholesterol":
      interpreted = interpretCholesterolLabs(relevantLabs);
      break;
    case "kidney_disease":
      interpreted = interpretKidneyLabs(relevantLabs);
      break;
    case "hypothyroid":
    case "hyperthyroid":
      interpreted = interpretThyroidLabs(relevantLabs, condition.id);
      break;
    case "iron_deficiency":
      interpreted = interpretAnemiaLabs(relevantLabs);
      break;
    case "gout":
      interpreted = interpretGoutLabs(relevantLabs);
      break;
    default:
      interpreted = {
        severity: condition.severity ?? "moderate",
        rules: DEFAULT_CONDITION_RULES[condition.id] ?? ["Follow condition-specific dietary guidelines"],
      };
  }

  return {
    conditionId: condition.id,
    label: condition.label,
    status: condition.status,
    severity: interpreted.severity,
    dietaryRules: interpreted.rules,
  };
}

/**
 * Build the compact health context string from a HealthProfile.
 * This is stored on the profile and injected into AI prompts.
 */
export function buildHealthContextString(profile: HealthProfile): string {
  if (profile.conditions.length === 0 && !profile.freeTextNotes.trim()) {
    return "";
  }

  const parts: string[] = [];

  // Active conditions
  const activeConditions = profile.conditions.filter((c) => c.status === "active");
  const familyHistory = profile.conditions.filter((c) => c.status === "family_history");

  if (activeConditions.length > 0) {
    const contexts = activeConditions.map((c) =>
      buildConditionContext(c, profile.labValues)
    );

    const conditionSummaries = contexts.map((ctx) => {
      const severityTag = ctx.severity !== "moderate" ? ` (${ctx.severity})` : "";
      return `${ctx.label}${severityTag}`;
    });

    parts.push(`Active conditions: ${conditionSummaries.join(", ")}.`);

    // Collect all dietary rules, deduplicate
    const allRules = new Set<string>();
    contexts.forEach((ctx) => ctx.dietaryRules.forEach((r) => allRules.add(r)));
    if (allRules.size > 0) {
      parts.push(`Dietary rules: ${Array.from(allRules).join(". ")}.`);
    }
  }

  if (familyHistory.length > 0) {
    const labels = familyHistory.map((c) => c.label);
    parts.push(`Family history risk: ${labels.join(", ")}. Give gentle nudges about related foods.`);
  }

  // Diet preference
  if (profile.dietPreference) {
    const prefMap: Record<string, string> = {
      veg: "Vegetarian",
      nonveg: "Non-vegetarian",
      vegan: "Vegan",
      eggetarian: "Eggetarian (veg + eggs)",
      pescatarian: "Pescatarian (veg + fish)",
    };
    parts.push(`Diet: ${prefMap[profile.dietPreference] ?? profile.dietPreference}.`);
  }

  // Free-text notes
  if (profile.freeTextNotes.trim()) {
    parts.push(`User notes: ${profile.freeTextNotes.trim()}`);
  }

  return parts.join(" ");
}

/**
 * Check if any lab values are stale (older than threshold).
 * Returns stale lab keys and how many days old they are.
 */
export function getStaleLabs(
  labValues: LabValue[],
  thresholdDays: number = 180
): { key: string; daysOld: number }[] {
  const now = Date.now();
  const stale: { key: string; daysOld: number }[] = [];

  for (const lab of labValues) {
    if (!lab.testedAt) continue;
    const testedMs = new Date(lab.testedAt).getTime();
    if (!Number.isFinite(testedMs)) continue;
    const daysOld = Math.floor((now - testedMs) / (1000 * 60 * 60 * 24));
    if (daysOld >= thresholdDays) {
      stale.push({ key: lab.key, daysOld });
    }
  }

  return stale;
}

/**
 * Get a short display summary for the UI (not for AI).
 */
export function getHealthSummaryDisplay(profile: HealthProfile): string {
  const count = profile.conditions.length;
  if (count === 0) return "No conditions added";

  const active = profile.conditions.filter((c) => c.status === "active").length;
  const fh = profile.conditions.filter((c) => c.status === "family_history").length;

  const parts: string[] = [];
  if (active > 0) parts.push(`${active} active condition${active > 1 ? "s" : ""}`);
  if (fh > 0) parts.push(`${fh} family history`);

  return parts.join(", ");
}

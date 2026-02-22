import type { LucideIcon } from "lucide-react";
import {
  Droplets,
  HeartPulse,
  Activity,
  Bean,
  Pill,
  Sun,
  Zap,
  Brain,
  Milk,
  Wheat,
  AlertTriangle,
  Stethoscope,
  Flame,
  ShieldAlert,
  Sparkles,
  CircleDot,
} from "lucide-react";

/* ─── Lab Field Definition ─── */

export interface LabFieldDef {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  normalRange: string;
  placeholder: string;
}

/* ─── Condition Definition ─── */

export type ConditionCategory = "high_impact" | "medium_impact";

export interface ConditionDef {
  id: string;
  label: string;
  shortLabel: string;
  category: ConditionCategory;
  icon: LucideIcon;
  description: string;
  dietaryImpact: string[];
  labFields: LabFieldDef[];
}

/* ─── Lab Field Definitions ─── */

const LAB_HBA1C: LabFieldDef = {
  key: "hba1c",
  label: "HbA1c",
  unit: "%",
  min: 3,
  max: 15,
  step: 0.1,
  normalRange: "< 5.7%",
  placeholder: "e.g. 6.5",
};

const LAB_FASTING_GLUCOSE: LabFieldDef = {
  key: "fasting_glucose",
  label: "Fasting Glucose",
  unit: "mg/dL",
  min: 40,
  max: 500,
  step: 1,
  normalRange: "70-100 mg/dL",
  placeholder: "e.g. 110",
};

const LAB_SYSTOLIC_BP: LabFieldDef = {
  key: "systolic_bp",
  label: "Systolic BP",
  unit: "mmHg",
  min: 60,
  max: 250,
  step: 1,
  normalRange: "< 120 mmHg",
  placeholder: "e.g. 130",
};

const LAB_DIASTOLIC_BP: LabFieldDef = {
  key: "diastolic_bp",
  label: "Diastolic BP",
  unit: "mmHg",
  min: 30,
  max: 150,
  step: 1,
  normalRange: "< 80 mmHg",
  placeholder: "e.g. 85",
};

const LAB_LDL: LabFieldDef = {
  key: "ldl",
  label: "LDL Cholesterol",
  unit: "mg/dL",
  min: 20,
  max: 400,
  step: 1,
  normalRange: "< 100 mg/dL",
  placeholder: "e.g. 130",
};

const LAB_HDL: LabFieldDef = {
  key: "hdl",
  label: "HDL Cholesterol",
  unit: "mg/dL",
  min: 10,
  max: 150,
  step: 1,
  normalRange: "> 40 mg/dL (M), > 50 (F)",
  placeholder: "e.g. 55",
};

const LAB_TRIGLYCERIDES: LabFieldDef = {
  key: "triglycerides",
  label: "Triglycerides",
  unit: "mg/dL",
  min: 20,
  max: 1000,
  step: 1,
  normalRange: "< 150 mg/dL",
  placeholder: "e.g. 180",
};

const LAB_TOTAL_CHOLESTEROL: LabFieldDef = {
  key: "total_cholesterol",
  label: "Total Cholesterol",
  unit: "mg/dL",
  min: 50,
  max: 500,
  step: 1,
  normalRange: "< 200 mg/dL",
  placeholder: "e.g. 220",
};

const LAB_CREATININE: LabFieldDef = {
  key: "creatinine",
  label: "Creatinine",
  unit: "mg/dL",
  min: 0.1,
  max: 15,
  step: 0.1,
  normalRange: "0.7-1.3 mg/dL (M), 0.6-1.1 (F)",
  placeholder: "e.g. 1.2",
};

const LAB_EGFR: LabFieldDef = {
  key: "egfr",
  label: "eGFR",
  unit: "mL/min",
  min: 5,
  max: 150,
  step: 1,
  normalRange: "> 90 mL/min",
  placeholder: "e.g. 85",
};

const LAB_URIC_ACID: LabFieldDef = {
  key: "uric_acid",
  label: "Uric Acid",
  unit: "mg/dL",
  min: 1,
  max: 15,
  step: 0.1,
  normalRange: "3.5-7.2 mg/dL (M), 2.6-6.0 (F)",
  placeholder: "e.g. 7.5",
};

const LAB_TSH: LabFieldDef = {
  key: "tsh",
  label: "TSH",
  unit: "mIU/L",
  min: 0.01,
  max: 100,
  step: 0.01,
  normalRange: "0.4-4.0 mIU/L",
  placeholder: "e.g. 5.2",
};

const LAB_HEMOGLOBIN: LabFieldDef = {
  key: "hemoglobin",
  label: "Hemoglobin",
  unit: "g/dL",
  min: 3,
  max: 20,
  step: 0.1,
  normalRange: "13.5-17.5 (M), 12.0-16.0 (F)",
  placeholder: "e.g. 11.5",
};

const LAB_FERRITIN: LabFieldDef = {
  key: "ferritin",
  label: "Ferritin",
  unit: "ng/mL",
  min: 1,
  max: 1000,
  step: 1,
  normalRange: "20-250 ng/mL (M), 10-120 (F)",
  placeholder: "e.g. 15",
};

const LAB_VITAMIN_D: LabFieldDef = {
  key: "vitamin_d",
  label: "Vitamin D",
  unit: "ng/mL",
  min: 1,
  max: 150,
  step: 0.1,
  normalRange: "30-100 ng/mL",
  placeholder: "e.g. 18",
};

const LAB_VITAMIN_B12: LabFieldDef = {
  key: "vitamin_b12",
  label: "Vitamin B12",
  unit: "pg/mL",
  min: 50,
  max: 2000,
  step: 1,
  normalRange: "200-900 pg/mL",
  placeholder: "e.g. 180",
};

/* ─── Conditions Registry ─── */

export const CONDITIONS_REGISTRY: ConditionDef[] = [
  // ── Group A: High dietary impact ──
  {
    id: "diabetes_type1",
    label: "Type 1 Diabetes",
    shortLabel: "T1 Diabetes",
    category: "high_impact",
    icon: Droplets,
    description: "Insulin-dependent diabetes",
    dietaryImpact: ["carb-counting", "glycemic-index", "sugar-control"],
    labFields: [LAB_HBA1C, LAB_FASTING_GLUCOSE],
  },
  {
    id: "diabetes_type2",
    label: "Type 2 Diabetes",
    shortLabel: "T2 Diabetes",
    category: "high_impact",
    icon: Droplets,
    description: "Insulin resistance / high blood sugar",
    dietaryImpact: ["low-GI", "sugar-control", "fiber-boost", "weight-management"],
    labFields: [LAB_HBA1C, LAB_FASTING_GLUCOSE],
  },
  {
    id: "prediabetic",
    label: "Pre-diabetic",
    shortLabel: "Pre-diabetic",
    category: "high_impact",
    icon: Droplets,
    description: "Borderline blood sugar levels",
    dietaryImpact: ["low-GI", "sugar-awareness", "fiber-boost"],
    labFields: [LAB_HBA1C, LAB_FASTING_GLUCOSE],
  },
  {
    id: "hypertension",
    label: "Hypertension",
    shortLabel: "High BP",
    category: "high_impact",
    icon: HeartPulse,
    description: "High blood pressure",
    dietaryImpact: ["low-sodium", "potassium-boost", "DASH-diet"],
    labFields: [LAB_SYSTOLIC_BP, LAB_DIASTOLIC_BP],
  },
  {
    id: "high_cholesterol",
    label: "High Cholesterol / Heart Disease",
    shortLabel: "High Cholesterol",
    category: "high_impact",
    icon: Activity,
    description: "Elevated LDL, triglycerides, or heart condition",
    dietaryImpact: ["low-saturated-fat", "omega-3", "fiber-boost", "limit-trans-fat"],
    labFields: [LAB_LDL, LAB_HDL, LAB_TRIGLYCERIDES, LAB_TOTAL_CHOLESTEROL],
  },
  {
    id: "kidney_disease",
    label: "Kidney Disease",
    shortLabel: "Kidney",
    category: "high_impact",
    icon: ShieldAlert,
    description: "Chronic kidney disease / high creatinine / protein in urine",
    dietaryImpact: ["low-protein", "low-sodium", "low-potassium", "low-phosphorus"],
    labFields: [LAB_CREATININE, LAB_EGFR],
  },
  {
    id: "fatty_liver",
    label: "Fatty Liver",
    shortLabel: "Fatty Liver",
    category: "high_impact",
    icon: Flame,
    description: "Non-alcoholic fatty liver disease (NAFLD)",
    dietaryImpact: ["low-sugar", "low-saturated-fat", "weight-management", "no-alcohol"],
    labFields: [],
  },
  {
    id: "pcos",
    label: "PCOS / Hormonal Imbalance",
    shortLabel: "PCOS",
    category: "high_impact",
    icon: Sparkles,
    description: "Polycystic ovary syndrome or hormonal issues",
    dietaryImpact: ["low-GI", "anti-inflammatory", "weight-management"],
    labFields: [],
  },
  {
    id: "gout",
    label: "Gout / High Uric Acid",
    shortLabel: "Gout",
    category: "high_impact",
    icon: Zap,
    description: "Elevated uric acid causing joint pain",
    dietaryImpact: ["low-purine", "hydration", "limit-alcohol", "limit-red-meat"],
    labFields: [LAB_URIC_ACID],
  },

  // ── Group B: Medium dietary impact ──
  {
    id: "hypothyroid",
    label: "Hypothyroidism",
    shortLabel: "Hypothyroid",
    category: "medium_impact",
    icon: Stethoscope,
    description: "Underactive thyroid",
    dietaryImpact: ["iodine-aware", "selenium", "limit-goitrogens", "weight-management"],
    labFields: [LAB_TSH],
  },
  {
    id: "hyperthyroid",
    label: "Hyperthyroidism",
    shortLabel: "Hyperthyroid",
    category: "medium_impact",
    icon: Stethoscope,
    description: "Overactive thyroid",
    dietaryImpact: ["calorie-dense", "calcium", "limit-caffeine"],
    labFields: [LAB_TSH],
  },
  {
    id: "iron_deficiency",
    label: "Iron Deficiency / Anemia",
    shortLabel: "Anemia",
    category: "medium_impact",
    icon: Pill,
    description: "Low hemoglobin or iron stores",
    dietaryImpact: ["iron-rich-foods", "vitamin-C-pairing", "limit-tea-with-meals"],
    labFields: [LAB_HEMOGLOBIN, LAB_FERRITIN],
  },
  {
    id: "vitamin_d_deficiency",
    label: "Vitamin D Deficiency",
    shortLabel: "Low Vit D",
    category: "medium_impact",
    icon: Sun,
    description: "Low vitamin D levels",
    dietaryImpact: ["vitamin-D-foods", "calcium-pairing", "sun-exposure"],
    labFields: [LAB_VITAMIN_D],
  },
  {
    id: "vitamin_b12_deficiency",
    label: "Vitamin B12 Deficiency",
    shortLabel: "Low B12",
    category: "medium_impact",
    icon: Pill,
    description: "Low B12 — common in vegetarians",
    dietaryImpact: ["B12-foods", "fortified-foods", "supplementation"],
    labFields: [LAB_VITAMIN_B12],
  },
  {
    id: "ibs_digestive",
    label: "IBS / Bloating / Acid Reflux",
    shortLabel: "IBS / GERD",
    category: "medium_impact",
    icon: Bean,
    description: "Irritable bowel, bloating, GERD, or acid reflux",
    dietaryImpact: ["low-FODMAP", "avoid-triggers", "small-meals", "limit-spicy"],
    labFields: [],
  },
  {
    id: "lactose_intolerant",
    label: "Lactose Intolerance",
    shortLabel: "Lactose",
    category: "medium_impact",
    icon: Milk,
    description: "Cannot digest dairy / milk sugar",
    dietaryImpact: ["dairy-free", "calcium-alternatives", "lactose-free-options"],
    labFields: [],
  },
  {
    id: "gluten_intolerant",
    label: "Gluten Intolerance / Celiac",
    shortLabel: "Gluten",
    category: "medium_impact",
    icon: Wheat,
    description: "Cannot tolerate gluten / wheat protein",
    dietaryImpact: ["gluten-free", "wheat-alternatives", "cross-contamination"],
    labFields: [],
  },
  {
    id: "food_allergies",
    label: "Food Allergies",
    shortLabel: "Allergies",
    category: "medium_impact",
    icon: AlertTriangle,
    description: "Allergic to specific foods (nuts, shellfish, soy, eggs, etc.)",
    dietaryImpact: ["allergen-avoidance", "label-reading"],
    labFields: [],
  },
  {
    id: "migraine",
    label: "Migraine",
    shortLabel: "Migraine",
    category: "medium_impact",
    icon: Brain,
    description: "Chronic migraines triggered by food",
    dietaryImpact: ["avoid-tyramine", "limit-aged-cheese", "limit-alcohol", "hydration"],
    labFields: [],
  },
];

/* ─── Allergy Sub-options ─── */

export interface AllergyOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const ALLERGY_OPTIONS: AllergyOption[] = [
  { id: "nuts", label: "Tree Nuts", icon: CircleDot },
  { id: "peanuts", label: "Peanuts", icon: CircleDot },
  { id: "shellfish", label: "Shellfish", icon: CircleDot },
  { id: "soy", label: "Soy", icon: CircleDot },
  { id: "eggs", label: "Eggs", icon: CircleDot },
  { id: "fish", label: "Fish", icon: CircleDot },
  { id: "sesame", label: "Sesame", icon: CircleDot },
  { id: "mustard", label: "Mustard", icon: CircleDot },
];

/* ─── Helpers ─── */

export function getConditionById(id: string): ConditionDef | undefined {
  return CONDITIONS_REGISTRY.find((c) => c.id === id);
}

export function getHighImpactConditions(): ConditionDef[] {
  return CONDITIONS_REGISTRY.filter((c) => c.category === "high_impact");
}

export function getMediumImpactConditions(): ConditionDef[] {
  return CONDITIONS_REGISTRY.filter((c) => c.category === "medium_impact");
}

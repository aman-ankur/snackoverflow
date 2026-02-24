import type {
  DescribeMealResult,
  MealHealthAnalysis,
  EatingAnalysis,
} from "@/lib/dishTypes";

/**
 * Mock data for Dev Mode (all flows except dish scan, which uses mockScanData.ts).
 * Dynamic-imported only when dev mode is active — not bundled in production.
 */

export const DEV_MOCK_DELAY_MS = 400;

export const MOCK_DESCRIBE_RESULT: DescribeMealResult = {
  dishes: [
    {
      name: "Dal Makhani",
      hindi: "दाल मखनी",
      portions: [
        { label: "Small bowl (150g)", weight_g: 150, calories: 180, protein_g: 8, carbs_g: 18, fat_g: 8, fiber_g: 4 },
        { label: "Regular bowl (250g)", weight_g: 250, calories: 300, protein_g: 14, carbs_g: 30, fat_g: 14, fiber_g: 6 },
        { label: "Large bowl (350g)", weight_g: 350, calories: 420, protein_g: 19, carbs_g: 42, fat_g: 19, fiber_g: 9 },
      ],
      defaultIndex: 1,
      ingredients: ["urad dal", "rajma", "butter", "cream", "tomato", "garlic", "ginger"],
      confidence: "high",
      tags: ["high-protein", "rich"],
      healthTip: "Rich in protein but high in fat from butter and cream. Ask for less butter.",
      reasoning: "Classic Punjabi black lentil dish slow-cooked with butter and cream",
    },
    {
      name: "Jeera Rice",
      hindi: "जीरा चावल",
      portions: [
        { label: "Small (100g)", weight_g: 100, calories: 130, protein_g: 3, carbs_g: 26, fat_g: 2, fiber_g: 1 },
        { label: "Regular (180g)", weight_g: 180, calories: 230, protein_g: 5, carbs_g: 46, fat_g: 3, fiber_g: 1 },
        { label: "Large (250g)", weight_g: 250, calories: 320, protein_g: 7, carbs_g: 64, fat_g: 4, fiber_g: 2 },
      ],
      defaultIndex: 1,
      ingredients: ["basmati rice", "cumin seeds", "ghee", "bay leaf"],
      confidence: "high",
      tags: ["high-carb"],
      healthTip: "Swap with brown rice for extra fiber.",
      reasoning: "Cumin-tempered steamed rice, common pairing with dal",
    },
  ],
};

export const MOCK_HEALTH_VERDICT: MealHealthAnalysis = {
  overallVerdict: "caution",
  overallSummary:
    "This meal is moderately healthy but high in refined carbs and saturated fat. The dal provides good protein, but the cream and butter add significant calories.",
  dishVerdicts: [
    {
      dishName: "Dal Makhani",
      verdict: "caution",
      note: "High in saturated fat from butter and cream. Good protein source but calorie-dense.",
      conditionFlags: ["cholesterol", "heart"],
      swapSuggestion: "Try Dal Tadka instead — same protein, much less fat",
    },
    {
      dishName: "Jeera Rice",
      verdict: "good",
      note: "Reasonable carb source. Portion control is key.",
      conditionFlags: [],
    },
  ],
};

export const MOCK_EATING_ANALYSIS: EatingAnalysis = {
  id: "analysis-dev-mock",
  windowDays: 7,
  generatedAt: new Date().toISOString(),
  mealsCount: 14,
  provider: "MOCK",
  report: {
    score: "good",
    scoreSummary:
      "You're doing well overall! Protein intake is consistent and you're hitting your calorie targets most days. Room to improve on fiber and meal timing.",
    trends: {
      calories: "stable",
      protein: "improving",
      carbs: "stable",
      fat: "declining",
    },
    insights: [
      {
        category: "temporal",
        title: "Late dinner pattern",
        detail: "3 out of 7 dinners were logged after 9 PM. Earlier dinners may improve sleep and digestion.",
        severity: "warning",
      },
      {
        category: "macro",
        title: "Strong protein game",
        detail: "You averaged 85g protein/day, hitting your 80g target consistently. Keep it up!",
        severity: "positive",
      },
      {
        category: "variety",
        title: "Good vegetable variety",
        detail: "You had 8 different vegetables this week. Aim for 10+ for optimal micronutrient coverage.",
        severity: "neutral",
      },
      {
        category: "goal",
        title: "Calorie target on track",
        detail: "Average daily intake was 1,850 kcal vs your 1,900 kcal target. Well controlled!",
        severity: "positive",
      },
    ],
    healthNotes: [
      "Consider adding more fiber-rich foods like rajma, chana, or oats",
      "Your omega-3 intake may be low — try adding walnuts or flaxseeds",
    ],
    actionItems: [
      { priority: 1, text: "Try to finish dinner before 8:30 PM on weekdays", relatedInsight: "Late dinner pattern" },
      { priority: 2, text: "Add a handful of nuts as a mid-morning snack for healthy fats" },
      { priority: 2, text: "Include one salad or raita with lunch for extra fiber" },
      { priority: 3, text: "Experiment with millets (ragi, jowar) instead of rice 2x/week" },
    ],
  },
};

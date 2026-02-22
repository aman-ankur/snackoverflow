/**
 * Mock meal seed data for Playwright testing.
 * Injects realistic meals into localStorage without any API/LLM calls.
 * Usage: await page.evaluate(seedMockMeals) in a Playwright test.
 */

export const STORAGE_KEY = "snackoverflow-meal-log-v1";
export const PROFILE_KEY = "snackoverflow-user-goals-v1";

const now = new Date();
const todayISO = now.toISOString();
const todayAt = (h: number, m: number) => {
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const MOCK_MEALS = [
  {
    id: "mock-breakfast-1",
    mealType: "breakfast",
    loggedAt: todayAt(9, 15),
    servingsMultiplier: 1,
    dishes: [
      {
        name: "Avocado Toast",
        hindi: "एवोकाडो टोस्ट",
        portion: "2 slices",
        calories: 280,
        protein_g: 8,
        carbs_g: 28,
        fat_g: 16,
        fiber_g: 6,
        estimated_weight_g: 180,
        ingredients: ["avocado", "sourdough bread", "olive oil", "salt"],
        confidence: "high" as const,
        tags: ["fiber-rich"],
        healthTip: "Great source of healthy fats!",
        reasoning: "Two slices of sourdough with mashed avocado",
      },
      {
        name: "Black Coffee",
        hindi: "ब्लैक कॉफी",
        portion: "1 cup",
        calories: 5,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        estimated_weight_g: 240,
        ingredients: ["coffee beans", "water"],
        confidence: "high" as const,
        tags: ["low-calorie"],
        healthTip: "Good for metabolism",
        reasoning: "Standard black coffee",
      },
    ],
    totals: { calories: 285, protein: 8, carbs: 28, fat: 16, fiber: 6 },
  },
  {
    id: "mock-breakfast-2",
    mealType: "breakfast",
    loggedAt: todayAt(10, 0),
    servingsMultiplier: 1,
    dishes: [
      {
        name: "Scrambled Eggs",
        hindi: "अंडा भुर्जी",
        portion: "3 eggs",
        calories: 210,
        protein_g: 18,
        carbs_g: 2,
        fat_g: 15,
        fiber_g: 0,
        estimated_weight_g: 150,
        ingredients: ["eggs", "butter", "salt", "pepper"],
        confidence: "high" as const,
        tags: ["high-protein"],
        healthTip: "Excellent protein source",
        reasoning: "Three scrambled eggs with butter",
      },
      {
        name: "Whole Wheat Toast",
        hindi: "गेहूं का टोस्ट",
        portion: "1 slice",
        calories: 70,
        protein_g: 3,
        carbs_g: 12,
        fat_g: 1,
        fiber_g: 2,
        estimated_weight_g: 30,
        ingredients: ["whole wheat flour", "yeast", "salt"],
        confidence: "high" as const,
        tags: [],
        healthTip: "Good source of complex carbs",
        reasoning: "One slice of whole wheat bread",
      },
    ],
    totals: { calories: 280, protein: 21, carbs: 14, fat: 16, fiber: 2 },
  },
  {
    id: "mock-breakfast-3",
    mealType: "breakfast",
    loggedAt: todayAt(10, 45),
    servingsMultiplier: 1.5,
    dishes: [
      {
        name: "Smoothie Bowl",
        hindi: "स्मूदी बाउल",
        portion: "1 bowl",
        calories: 220,
        protein_g: 6,
        carbs_g: 38,
        fat_g: 5,
        fiber_g: 4,
        estimated_weight_g: 250,
        ingredients: ["banana", "mixed berries", "granola", "yogurt", "honey"],
        confidence: "medium" as const,
        tags: ["fiber-rich"],
        healthTip: "Great post-workout meal",
        reasoning: "Blended banana and berries with granola topping",
      },
    ],
    totals: { calories: 220, protein: 6, carbs: 38, fat: 5, fiber: 4 },
  },
  {
    id: "mock-lunch-1",
    mealType: "lunch",
    loggedAt: todayAt(13, 0),
    servingsMultiplier: 1,
    dishes: [
      {
        name: "Chicken Biryani",
        hindi: "चिकन बिरयानी",
        portion: "1 plate",
        calories: 650,
        protein_g: 32,
        carbs_g: 68,
        fat_g: 24,
        fiber_g: 3,
        estimated_weight_g: 350,
        ingredients: ["basmati rice", "chicken", "onions", "spices", "yogurt", "ghee"],
        confidence: "high" as const,
        tags: ["high-protein", "high-carb"],
        healthTip: "Balance with a side salad",
        reasoning: "Full plate of chicken biryani with raita",
      },
    ],
    totals: { calories: 650, protein: 32, carbs: 68, fat: 24, fiber: 3 },
  },
];

export const MOCK_PROFILE_DATA = {
  profile: {
    name: "Test User",
    gender: "male",
    age: 28,
    heightCm: 175,
    weightKg: 72,
    activityLevel: "moderate",
    goal: "maintain",
    completedAt: todayISO,
  },
  goals: {
    calories: 2200,
    protein: 120,
    carbs: 275,
    fat: 73,
    tdee: 2200,
    isCustom: false,
  },
  streak: {
    currentStreak: 5,
    lastLogDate: todayISO.slice(0, 10),
    longestStreak: 5,
  },
};

/**
 * Evaluate this function in the browser to seed mock data.
 * Usage: await page.evaluate(seedMockMeals)
 */
export function seedMockMeals() {
  const STORAGE_KEY = "snackoverflow-meal-log-v1";
  const PROFILE_KEY = "snackoverflow-user-goals-v1";

  const now = new Date();
  const todayISO = now.toISOString();
  const todayAt = (h: number, m: number) => {
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const meals = [
    {
      id: "mock-breakfast-1",
      mealType: "breakfast",
      loggedAt: todayAt(9, 15),
      servingsMultiplier: 1,
      dishes: [
        { name: "Avocado Toast", hindi: "", portion: "2 slices", calories: 280, protein_g: 8, carbs_g: 28, fat_g: 16, fiber_g: 6, estimated_weight_g: 180, ingredients: ["avocado", "bread"], confidence: "high", tags: ["fiber-rich"], healthTip: "", reasoning: "" },
        { name: "Black Coffee", hindi: "", portion: "1 cup", calories: 5, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, estimated_weight_g: 240, ingredients: ["coffee"], confidence: "high", tags: ["low-calorie"], healthTip: "", reasoning: "" },
      ],
      totals: { calories: 285, protein: 8, carbs: 28, fat: 16, fiber: 6 },
    },
    {
      id: "mock-breakfast-2",
      mealType: "breakfast",
      loggedAt: todayAt(10, 0),
      servingsMultiplier: 1,
      dishes: [
        { name: "Scrambled Eggs", hindi: "", portion: "3 eggs", calories: 210, protein_g: 18, carbs_g: 2, fat_g: 15, fiber_g: 0, estimated_weight_g: 150, ingredients: ["eggs", "butter"], confidence: "high", tags: ["high-protein"], healthTip: "", reasoning: "" },
        { name: "Whole Wheat Toast", hindi: "", portion: "1 slice", calories: 70, protein_g: 3, carbs_g: 12, fat_g: 1, fiber_g: 2, estimated_weight_g: 30, ingredients: ["wheat flour"], confidence: "high", tags: [], healthTip: "", reasoning: "" },
      ],
      totals: { calories: 280, protein: 21, carbs: 14, fat: 16, fiber: 2 },
    },
    {
      id: "mock-breakfast-3",
      mealType: "breakfast",
      loggedAt: todayAt(10, 45),
      servingsMultiplier: 1.5,
      dishes: [
        { name: "Smoothie Bowl", hindi: "", portion: "1 bowl", calories: 220, protein_g: 6, carbs_g: 38, fat_g: 5, fiber_g: 4, estimated_weight_g: 250, ingredients: ["banana", "berries", "granola"], confidence: "medium", tags: ["fiber-rich"], healthTip: "", reasoning: "" },
      ],
      totals: { calories: 220, protein: 6, carbs: 38, fat: 5, fiber: 4 },
    },
    {
      id: "mock-lunch-1",
      mealType: "lunch",
      loggedAt: todayAt(13, 0),
      servingsMultiplier: 1,
      dishes: [
        { name: "Chicken Biryani", hindi: "", portion: "1 plate", calories: 650, protein_g: 32, carbs_g: 68, fat_g: 24, fiber_g: 3, estimated_weight_g: 350, ingredients: ["rice", "chicken", "spices"], confidence: "high", tags: ["high-protein", "high-carb"], healthTip: "", reasoning: "" },
      ],
      totals: { calories: 650, protein: 32, carbs: 68, fat: 24, fiber: 3 },
    },
  ];

  const profileData = {
    profile: { name: "Test User", gender: "male", age: 28, heightCm: 175, weightKg: 72, activityLevel: "moderate", goal: "maintain", completedAt: todayISO },
    goals: { calories: 2200, protein: 120, carbs: 275, fat: 73, tdee: 2200, isCustom: false },
    streak: { currentStreak: 5, lastLogDate: todayISO.slice(0, 10), longestStreak: 5 },
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
}

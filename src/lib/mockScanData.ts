import type { DishAnalysisResult } from "@/lib/dishTypes";

/**
 * Mock data for dish scan testing.
 * Dynamic-imported in useDishScanner when ?mock=scan is active.
 * Not bundled in production builds.
 *
 * 3 scenarios cycle on each scan tap to exercise the always-on alternatives feature:
 *   Scenario 1 — Cooked dishes: high-confidence primary WITH alternatives (new behavior)
 *   Scenario 2 — Unambiguous items: no alternatives (semantic skip)
 *   Scenario 3 — Edge-case filtering: alternatives exist but get hidden by client rules
 */

/** Small 200x150 orange/brown placeholder JPEG (~600 bytes) representing a food plate */
export const MOCK_FOOD_IMAGE =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsM" +
  "DBYQDRAQFA8LDg4TEhMSFxEREhcYFhkZHBUdHx7/2wBDAQMEBAUEBQkFBQkeEw0THh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4e" +
  "Hh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAWACADASIAAhEBAxEB/8QAGAABAQEBAQAAAAAAAAAAAAAABwYIBQT/xAApEAABAwMDBAEF" +
  "AQAAAAAAAAABAgMEBQYRABIhBxMiMRQjQVFhgZH/xAAXAQADAQAAAAAAAAAAAAAAAAABAgME/8QAHhEAAgICAgMAAAAAAAAAAAAAAQIA" +
  "IRESMUFRof/aAAwDAQACEQMRAD8Aw7SqFU6/UGqbQ4EidPkOBpiLGaK3HVk4CUpHJJPoAa0bY/0k1irUxmr3hcEWgR3kBxqnRAHpbqT" +
  "yC4sBKAfwkn80VdReuFt9JqcxQaZT0VK5FIaXU5i8pjpVwWmh6UrHBUeQDgYzmq640y43VW3p9x1t+fNkOFx6Q+4VuOKPsknk6xZMjM" +
  "xnaiGwJP3nt0Dd9S6fVZFUt+vy6TUJDAiuyYjoQ4plJBKCfeNyQSOcZA01UC8Lhry0C4K/Nq8hGdipb5cCc+9oP4H+DQFxXhV75ub6u" +
  "5ahMqtSlrDbcmW8XHNqdqEjJwMAAAegAPQ0/dFul0e5rlj0ycw5FpLy8PSg4kLcCEFRCM8gHAGfnOj1E3BhRfUm7VH/9k=";

/* ──────────────────────────────────────────────────────────
 * Scenario 1 — Cooked dishes (always-on alternatives)
 * Dal Tadka: HIGH confidence + alternatives  ← new behavior
 * Jeera Rice: MEDIUM confidence + alternatives
 * Aloo Gobi: MEDIUM, no alternatives (distinctive enough)
 * ────────────────────────────────────────────────────────── */
const SCENARIO_COOKED_DISHES: DishAnalysisResult = {
  dishes: [
    {
      name: "Dal Tadka",
      hindi: "दाल तड़का",
      portion: "1 bowl",
      estimated_weight_g: 200,
      calories: 180,
      protein_g: 9,
      carbs_g: 22,
      fat_g: 6,
      fiber_g: 4,
      ingredients: ["toor dal", "onion", "tomato", "ghee", "cumin", "turmeric", "garlic"],
      confidence: "high",
      tags: ["high-protein", "fiber-rich"],
      healthTip: "Great source of plant protein. Pair with rice for complete amino acids.",
      reasoning: "Yellow lentil curry with tempering visible on top",
      alternatives: [
        {
          name: "Dal Fry",
          hindi: "दाल फ्राई",
          portion: "1 bowl",
          estimated_weight_g: 200,
          calories: 195,
          protein_g: 10,
          carbs_g: 20,
          fat_g: 8,
          fiber_g: 4,
          ingredients: ["toor dal", "moong dal", "onion", "tomato", "butter", "cumin", "garlic"],
          confidence: "medium",
          tags: ["high-protein", "fiber-rich"],
          healthTip: "Restaurant-style dal with more butter. Ask for less butter to cut calories.",
          reasoning: "Could be dal fry — similar yellow lentil base but richer with added butter/cream.",
        },
        {
          name: "Sambar",
          hindi: "सांभर",
          portion: "1 bowl",
          estimated_weight_g: 200,
          calories: 140,
          protein_g: 7,
          carbs_g: 18,
          fat_g: 4,
          fiber_g: 5,
          ingredients: ["toor dal", "mixed vegetables", "tamarind", "sambar powder", "mustard seeds", "curry leaves"],
          confidence: "medium",
          tags: ["fiber-rich", "low-calorie"],
          healthTip: "Packed with vegetables and fiber. Lower in fat than most dals.",
          reasoning: "Similar yellow lentil appearance. Could be sambar if vegetables are not clearly visible.",
        },
      ],
    },
    {
      name: "Jeera Rice",
      hindi: "जीरा चावल",
      portion: "1 serving",
      estimated_weight_g: 180,
      calories: 210,
      protein_g: 4,
      carbs_g: 42,
      fat_g: 3,
      fiber_g: 1,
      ingredients: ["basmati rice", "cumin seeds", "ghee", "bay leaf", "salt"],
      confidence: "medium",
      tags: ["high-carb"],
      healthTip: "Consider brown rice for more fiber.",
      reasoning: "White rice with visible cumin seeds. Could be jeera rice or plain steamed rice.",
      alternatives: [
        {
          name: "Steamed Rice",
          hindi: "उबले चावल",
          portion: "1 serving",
          estimated_weight_g: 180,
          calories: 205,
          protein_g: 4,
          carbs_g: 45,
          fat_g: 0,
          fiber_g: 1,
          ingredients: ["basmati rice", "water", "salt"],
          confidence: "medium",
          tags: ["high-carb", "low-calorie"],
          healthTip: "Simple steamed rice with no added fat.",
          reasoning: "Could be plain steamed rice without tempering. Lower fat content.",
        },
        {
          name: "Fried Rice",
          hindi: "फ्राइड राइस",
          portion: "1 serving",
          estimated_weight_g: 180,
          calories: 280,
          protein_g: 5,
          carbs_g: 40,
          fat_g: 10,
          fiber_g: 2,
          ingredients: ["rice", "vegetables", "soy sauce", "oil", "garlic", "ginger"],
          confidence: "low",
          tags: ["high-carb", "high-fat"],
          healthTip: "Higher in calories due to added oil and vegetables.",
          reasoning: "Less likely but could be fried rice with minimal visible vegetables.",
        },
      ],
    },
    {
      name: "Aloo Gobi",
      hindi: "आलू गोभी",
      portion: "1 serving",
      estimated_weight_g: 150,
      calories: 160,
      protein_g: 4,
      carbs_g: 18,
      fat_g: 8,
      fiber_g: 3,
      ingredients: ["potato", "cauliflower", "onion", "tomato", "turmeric", "cumin", "oil"],
      confidence: "medium",
      tags: [],
      healthTip: "Good vegetable dish. Watch the oil quantity for lower calories.",
      reasoning: "Potato and cauliflower dry curry",
    },
  ],
  totalCalories: 550,
  totalProtein: 17,
  totalCarbs: 82,
  totalFat: 17,
  totalFiber: 8,
  provider: "MOCK",
};

/* ──────────────────────────────────────────────────────────
 * Scenario 2 — Unambiguous items (semantic skip → no alternatives)
 * Banana: clearly a fruit, no alternatives
 * Roti: single distinctive item, no alternatives
 * Packaged Parle-G: labeled packaging, no alternatives
 *
 * Expected: ZERO purple pills on any card
 * ────────────────────────────────────────────────────────── */
const SCENARIO_UNAMBIGUOUS: DishAnalysisResult = {
  dishes: [
    {
      name: "Banana",
      hindi: "केला",
      portion: "1 medium (~120g)",
      estimated_weight_g: 120,
      calories: 105,
      protein_g: 1,
      carbs_g: 27,
      fat_g: 0,
      fiber_g: 3,
      ingredients: ["banana"],
      confidence: "high",
      tags: ["low-calorie"],
      healthTip: "Great pre-workout snack. Rich in potassium.",
      reasoning: "Single whole banana, clearly identifiable fruit. No alternatives needed.",
      // No alternatives — semantic skip (unambiguous whole fruit)
    },
    {
      name: "Roti",
      hindi: "रोटी",
      portion: "2 rotis (~80g)",
      estimated_weight_g: 80,
      calories: 160,
      protein_g: 5,
      carbs_g: 32,
      fat_g: 2,
      fiber_g: 3,
      ingredients: ["whole wheat flour", "water", "salt"],
      confidence: "high",
      tags: [],
      healthTip: "Good source of complex carbs. Pair with dal for complete protein.",
      reasoning: "Two whole wheat rotis on plate, distinctive round flat bread shape.",
      // No alternatives — semantic skip (single distinctive item)
    },
    {
      name: "Parle-G Biscuits",
      hindi: "पारले-जी बिस्कुट",
      portion: "4 biscuits (~28g)",
      estimated_weight_g: 28,
      calories: 130,
      protein_g: 2,
      carbs_g: 21,
      fat_g: 4,
      fiber_g: 0,
      ingredients: ["wheat flour", "sugar", "palm oil", "milk solids", "leavening"],
      confidence: "high",
      tags: ["high-carb"],
      healthTip: "High in sugar and refined flour. Limit to occasional snack.",
      reasoning: "Labeled Parle-G packaging clearly visible. 4 biscuits = ~28g.",
      // No alternatives — semantic skip (labeled packaging)
    },
  ],
  totalCalories: 395,
  totalProtein: 8,
  totalCarbs: 80,
  totalFat: 6,
  totalFiber: 6,
  provider: "MOCK",
};

/* ──────────────────────────────────────────────────────────
 * Scenario 3 — Edge-case filtering (alternatives exist but get hidden)
 * Paneer Tikka: alternatives are ALL "low" confidence → hidden by Rule 1
 * Masala Chai: alternatives have identical names → hidden by Rule 4
 * Chole Bhature: alternatives have same calories as primary → hidden by Rule 3
 *
 * Expected: ZERO purple pills (all filtered out by shouldShowAlternatives)
 * ────────────────────────────────────────────────────────── */
const SCENARIO_FILTERED_EDGES: DishAnalysisResult = {
  dishes: [
    {
      name: "Paneer Tikka",
      hindi: "पनीर टिक्का",
      portion: "6 pieces (~150g)",
      estimated_weight_g: 150,
      calories: 320,
      protein_g: 22,
      carbs_g: 8,
      fat_g: 23,
      fiber_g: 1,
      ingredients: ["paneer", "yogurt", "bell pepper", "onion", "tikka masala", "oil"],
      confidence: "high",
      tags: ["high-protein", "high-fat"],
      healthTip: "Great protein source. Bake instead of grill with oil for fewer calories.",
      reasoning: "Charred paneer cubes with bell pepper on skewer, distinctive tikka preparation.",
      // Rule 1 test: ALL alternatives are "low" → should be HIDDEN
      alternatives: [
        {
          name: "Tofu Tikka",
          hindi: "टोफू टिक्का",
          portion: "6 pieces (~150g)",
          estimated_weight_g: 150,
          calories: 210,
          protein_g: 18,
          carbs_g: 6,
          fat_g: 13,
          fiber_g: 2,
          ingredients: ["tofu", "yogurt", "bell pepper", "onion", "tikka masala", "oil"],
          confidence: "low",
          tags: ["high-protein"],
          healthTip: "Lower calorie alternative to paneer.",
          reasoning: "Unlikely — tofu tikka is rare in Indian restaurants.",
        },
        {
          name: "Soya Chaap Tikka",
          hindi: "सोया चाप टिक्का",
          portion: "6 pieces (~150g)",
          estimated_weight_g: 150,
          calories: 280,
          protein_g: 20,
          carbs_g: 12,
          fat_g: 18,
          fiber_g: 2,
          ingredients: ["soya chaap", "yogurt", "bell pepper", "onion", "tikka masala", "oil"],
          confidence: "low",
          tags: ["high-protein"],
          healthTip: "Good plant-based protein alternative.",
          reasoning: "Very unlikely — soya chaap has different texture from paneer.",
        },
      ],
    },
    {
      name: "Masala Chai",
      hindi: "मसाला चाय",
      portion: "1 cup (~150ml)",
      estimated_weight_g: 150,
      calories: 80,
      protein_g: 2,
      carbs_g: 12,
      fat_g: 3,
      fiber_g: 0,
      ingredients: ["tea leaves", "milk", "sugar", "ginger", "cardamom", "cloves"],
      confidence: "high",
      tags: ["low-calorie"],
      healthTip: "Reduce sugar for a healthier option. Try with jaggery instead.",
      reasoning: "Brown milky tea in cup, classic masala chai appearance.",
      // Rule 4 test: alternative names identical to primary → should be HIDDEN
      alternatives: [
        {
          name: "Masala Chai",
          hindi: "मसाला चाय",
          portion: "1 cup (~150ml)",
          estimated_weight_g: 150,
          calories: 60,
          protein_g: 2,
          carbs_g: 8,
          fat_g: 2,
          fiber_g: 0,
          ingredients: ["tea leaves", "milk", "sugar", "ginger", "cardamom"],
          confidence: "medium",
          tags: ["low-calorie"],
          healthTip: "Less sugar version.",
          reasoning: "Same chai but with less sugar — trivial variant.",
        },
        {
          name: "Masala Chai",
          hindi: "मसाला चाय",
          portion: "1 cup (~150ml)",
          estimated_weight_g: 150,
          calories: 100,
          protein_g: 3,
          carbs_g: 14,
          fat_g: 4,
          fiber_g: 0,
          ingredients: ["tea leaves", "full cream milk", "sugar", "ginger", "cardamom", "cloves"],
          confidence: "medium",
          tags: [],
          healthTip: "Full cream version, richer taste but more calories.",
          reasoning: "Same chai but with full cream milk — trivial variant.",
        },
      ],
    },
    {
      name: "Chole Bhature",
      hindi: "छोले भटूरे",
      portion: "1 plate (~300g)",
      estimated_weight_g: 300,
      calories: 550,
      protein_g: 15,
      carbs_g: 65,
      fat_g: 25,
      fiber_g: 8,
      ingredients: ["chickpeas", "onion", "tomato", "spices", "maida", "oil"],
      confidence: "high",
      tags: ["high-carb", "high-fat"],
      healthTip: "High calorie dish. Eat bhature in moderation — try with kulcha instead.",
      reasoning: "Fried bread with chickpea curry, classic north Indian combo.",
      // Rule 3 test: all alternatives have same calories as primary → should be HIDDEN
      alternatives: [
        {
          name: "Chole Kulche",
          hindi: "छोले कुल्चे",
          portion: "1 plate (~300g)",
          estimated_weight_g: 300,
          calories: 550,
          protein_g: 14,
          carbs_g: 68,
          fat_g: 24,
          fiber_g: 7,
          ingredients: ["chickpeas", "onion", "tomato", "spices", "maida", "butter"],
          confidence: "medium",
          tags: ["high-carb", "high-fat"],
          healthTip: "Slightly less fried than bhature but still high calorie.",
          reasoning: "Could be kulche instead of bhature — similar chickpea combo.",
        },
        {
          name: "Chole Puri",
          hindi: "छोले पूरी",
          portion: "1 plate (~300g)",
          estimated_weight_g: 300,
          calories: 550,
          protein_g: 14,
          carbs_g: 64,
          fat_g: 26,
          fiber_g: 7,
          ingredients: ["chickpeas", "onion", "tomato", "spices", "wheat flour", "oil"],
          confidence: "medium",
          tags: ["high-carb", "high-fat"],
          healthTip: "Puri is deep fried — similar calories to bhature.",
          reasoning: "Could be puri instead of bhature — both fried breads.",
        },
      ],
    },
  ],
  totalCalories: 950,
  totalProtein: 39,
  totalCarbs: 85,
  totalFat: 51,
  totalFiber: 9,
  provider: "MOCK",
};

/* ──────────────────────────────────────────────────────────
 * Scenario cycling — rotates through scenarios on each scan
 * ────────────────────────────────────────────────────────── */

const MOCK_SCENARIOS: { label: string; data: DishAnalysisResult }[] = [
  { label: "Cooked dishes (alternatives shown)", data: SCENARIO_COOKED_DISHES },
  { label: "Unambiguous items (no alternatives)", data: SCENARIO_UNAMBIGUOUS },
  { label: "Edge-case filtering (alternatives hidden)", data: SCENARIO_FILTERED_EDGES },
];

let _scenarioIndex = 0;

/** Returns the next mock scenario, cycling through all 3. */
export function getNextMockScenario(): { label: string; data: DishAnalysisResult } {
  const scenario = MOCK_SCENARIOS[_scenarioIndex % MOCK_SCENARIOS.length];
  _scenarioIndex++;
  return scenario;
}

/** Legacy single-result export (Scenario 1). Used by existing tests. */
export const MOCK_SCAN_RESULT: DishAnalysisResult = SCENARIO_COOKED_DISHES;

export const MOCK_ANALYSIS_DELAY_MS = 1500;

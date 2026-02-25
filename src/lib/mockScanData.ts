import type { DishAnalysisResult } from "@/lib/dishTypes";

/**
 * Mock data for dish scan testing.
 * Dynamic-imported in useDishScanner when ?mock=scan is active.
 * Not bundled in production builds.
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

export const MOCK_SCAN_RESULT: DishAnalysisResult = {
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
      // No alternatives - clearly identifiable dal tadka (high confidence)
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
      // No alternatives - typical aloo gobi is fairly distinctive
    },
  ],
  totalCalories: 550,
  totalProtein: 17,
  totalCarbs: 82,
  totalFat: 17,
  totalFiber: 8,
  provider: "MOCK",
};

export const MOCK_ANALYSIS_DELAY_MS = 1500;

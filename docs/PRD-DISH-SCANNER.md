# PRD: Dish Scanner & Calorie Tracker

## Status: IMPLEMENTED

## Problem
People tracking calories/macros struggle with Indian food because:
- Indian dishes are complex (mixed curries, dals, rice preparations)
- Portion sizes vary (1 roti vs 3, 1 katori vs 2)
- No good calorie database for home-cooked Indian food
- Existing apps require manual text search — friction kills habit

## Solution
**Point camera at a dish → Get instant nutrition data.** AI identifies the dish, estimates portion, returns calories + macros. No typing, no searching.

---

## Confirmed Design Decisions

1. **Navigation**: Bottom tab bar — 🧊 **Fridge** | 🍽️ **Dish**. YOLO becomes a sub-option inside Fridge tab.
2. **Multi-dish**: Auto-detect — AI identifies single dish or full thali and breaks them down individually.
3. **Scope**: All phases — scanner + logging + history + cross-tab intelligence + health tags.

---

## Feature Spec

### 1. Bottom Tab Bar (replaces ModeSwitcher)
- Sticky bottom nav: 🧊 Fridge | 🍽️ Dish
- YOLO/Cloud AI toggle moves inside Fridge tab as sub-switcher
- Header stays at top ("Fridgenius — Smart Kitchen Assistant")
- Tab transitions animated with framer-motion

### 2. Dish Scanner Camera
- Reuse `GeminiCameraView` component (same 65vh streaming height)
- New API route: `POST /api/analyze-dish`
- AI auto-detects: single dish vs thali (multiple dishes)

### 3. Nutrition Card (main output)
```
🍛 Paneer Butter Masala (पनीर बटर मसाला)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Estimated for: 1 katori (~200g)

🔥 Calories     380 kcal
🥩 Protein      18g
🍞 Carbs        12g
🧈 Fat          28g
🧂 Fiber         2g

📝 Key Ingredients:
   Paneer, Butter, Cream, Tomato, Cashew, Spices

⚖️ Confidence: Medium
💡 Tip: High in fat due to butter/cream. Pair with roti instead of naan to save ~150 kcal.
```

### 4. Portion Adjuster
- Buttons: ½ serving | 1 serving | 1.5x | 2x
- All nutrition values scale proportionally
- For thali: per-item breakdown + total

### 5. Health Tags (color-coded)
- 🟢 High Protein (>20g/serving)
- 🟡 High Carb (>50g/serving)
- 🔴 High Fat (>30g/serving)
- 🟢 Low Calorie (<300 kcal)
- 🔴 High Calorie (>600 kcal)
- 🟢 Fiber Rich (>5g)

### 6. Meal Logger (localStorage)
- "Log This Meal" button on nutrition card
- Meal type picker: Breakfast / Lunch / Snack / Dinner
- Daily summary: total calories, protein, carbs, fat (progress rings)
- Persistent across sessions

### 7. Meal History & Insights
- "You had this X days ago" badge if dish was scanned before
- Weekly summary: daily calorie totals
- Pattern detection: "3 paneer dishes this week"
- Fridge↔Dish linking: "Cooked from fridge scan on Monday"

---

## API Design

### `POST /api/analyze-dish`

**Input**:
```json
{
  "image": "data:image/jpeg;base64,...",
  "mealType": "lunch"
}
```

**Output**:
```json
{
  "dishes": [
    {
      "name": "Paneer Butter Masala",
      "hindi": "पनीर बटर मसाला",
      "portion": "1 katori (~200g)",
      "calories": 380,
      "protein_g": 18,
      "carbs_g": 12,
      "fat_g": 28,
      "fiber_g": 2,
      "ingredients": ["Paneer", "Butter", "Cream", "Tomato", "Cashew"],
      "confidence": "medium",
      "tags": ["high-fat", "high-protein"],
      "healthTip": "High in fat due to butter/cream. Pair with roti instead of naan."
    }
  ],
  "totalCalories": 380,
  "totalProtein": 18,
  "totalCarbs": 12,
  "totalFat": 28
}
```

**Provider chain**: Same as fridge — Gemini → Groq fallback

---

## New Files to Create

| File | Purpose |
|---|---|
| `src/app/api/analyze-dish/route.ts` | Dish analysis API route |
| `src/lib/useDishScanner.ts` | Camera + dish analysis hook |
| `src/lib/useMealLog.ts` | Meal logging hook (localStorage) |
| `src/components/DishMode.tsx` | Dish scanner mode orchestrator |
| `src/components/NutritionCard.tsx` | Calorie/macro display card |
| `src/components/MealLog.tsx` | Daily meal log UI |
| `src/components/DailySummary.tsx` | Daily calorie/macro summary |
| `src/components/MealHistory.tsx` | Past meals list + insights |
| `src/components/BottomTabBar.tsx` | New bottom navigation |

### 8. Goal Setting & Capy Mascot (NEW — feat/goal-setting-capy)

**Capy** is a mood-reactive capybara mascot that motivates users daily.

#### Onboarding Wizard (5 steps)
1. **Welcome** — Capy introduces itself
2. **About You** — Gender, Age (range slider 14-80), Height (cm/ft), Weight (kg/lbs)
3. **Activity Level** — 5 options (Sedentary → Athlete)
4. **Goal** — 7 India-specific options:
   - 🎯 Lose 2-3 kg (gentle, -250 kcal)
   - 🔥 Lose 5-7 kg (steady, -500 kcal — most popular)
   - ⚡ Lose 7-10 kg (aggressive, -750 kcal)
   - ✨ Tone Up & Recomp (-150 kcal + high protein)
   - ⚖️ Maintain Weight (0 offset)
   - 💪 Build Muscle (+300 kcal)
   - 🏋️ Lean Bulk (+200 kcal)
5. **Your Plan** — Computed calories/macros with editable values

#### TDEE Calculator
- Mifflin-St Jeor formula for BMR
- Activity multiplier (1.2–1.9)
- Goal-specific calorie offset and protein targets (1.6–2.2 g/kg)
- Fat = 25% of target calories; carbs = remainder
- Minimum floor: 1200 kcal

#### GoalDashboard (replaces DailySummary)
- Greeting + Capy with mood-reactive SVG (happy/excited/sleepy/motivated/concerned)
- Speech bubble with context-aware motivational lines
- Calorie progress bar + macro bars (protein/carbs/fat)
- Streak counter (current + longest)
- Edit goals button re-opens onboarding

#### Persistence
- localStorage key: `fridgenius-user-goals-v1`
- Stores: UserProfile, NutritionGoals, StreakData
- Streak refreshes on meal log

## Implementation Order

1. Bottom tab bar (replace ModeSwitcher) ✅
2. Dish scanner core (API route + hook + DishMode) ✅
3. Nutrition card UI (NutritionCard + portion adjuster + health tags) ✅
4. Meal logging (useMealLog + MealLog + DailySummary) ✅
5. History & cross-tab intelligence (MealHistory + badges + linking) ✅
6. Goal setting & Capy mascot (TDEE, onboarding, dashboard) ✅
7. Polish & ship (animations, push, deploy)

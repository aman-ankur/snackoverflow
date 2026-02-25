# Alternative Dish Selection Feature

## Overview

When scanning food items, the AI now returns **up to 3 possible dish identifications** (primary + 2 alternatives) for visually ambiguous foods. Users can instantly switch between options without re-scanning, improving accuracy for dishes that look similar.

---

## Problem Statement

Many Indian dishes look visually similar:
- **Beverages**: Iced tea vs iced coffee vs cold brew (all brown liquid with ice)
- **Pancakes**: Oats chilla vs besan cheela vs uttapam (all savory pancakes)
- **Shakes**: Milkshake vs protein shake vs smoothie (all thick beverages)
- **Rice**: Fried rice vs brown rice vs jeera rice (all cooked rice grains)
- **Nuggets**: Chicken nuggets vs paneer nuggets (both breaded fried pieces)

Previously, if the AI misidentified a dish, users had to:
1. Click "Wrong dish?" button
2. Type the correct name manually (slow, error-prone)
3. Wait for full re-analysis (~3s)

---

## Solution: Full Nutrition Upfront

### How It Works

1. **User scans dish** → POST `/api/analyze-dish`
2. **AI analyzes** and returns:
   - Primary identification (best guess)
   - Up to 2 alternatives with **full nutrition data** for each
3. **UI displays** all 3 options as radio buttons in expanded dish card
4. **User selects** alternative → **instant swap** (0s latency, no API call)
5. **App recalculates** plate totals and updates UI immediately

### Why "Full Nutrition Upfront"?

We compared two approaches:

| Approach | Initial Scan | Alternative Selection | Total (with selection) |
|----------|--------------|----------------------|------------------------|
| **Names-only** | 2-3s | +2-3s (re-analysis) | 4-6s |
| **Full nutrition** | 3-4s | 0s (instant) | **3-4s** ✅ |

**Full nutrition wins** because:
- ✅ Faster UX when alternatives used (instant vs 2-3s wait)
- ✅ Single API call (simpler, fewer failure points)
- ✅ Better offline behavior (all data cached)
- ✅ Smoother animations (no loading spinner interruption)
- ✅ Still FREE (2600 tokens/scan within Gemini limits)

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User scans dish via camera                                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. POST /api/analyze-dish                                       │
│    { image: "base64...", mealType: "lunch" }                    │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. AI Prompt (Step 6B: Alternative Identifications)            │
│    - Identifies primary dish                                    │
│    - Generates 2 alternatives with full nutrition               │
│    - Only for visually ambiguous dishes                         │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. API Response (2600 tokens, ~3-4s)                           │
│    {                                                            │
│      "dishes": [{                                               │
│        "name": "Iced Tea",                                      │
│        "calories": 80, ...                                      │
│        "alternatives": [                                        │
│          { "name": "Iced Coffee", "calories": 5, ... },        │
│          { "name": "Cold Brew", "calories": 5, ... }           │
│        ]                                                        │
│      }]                                                         │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Client-side normalization (useDishScanner.ts)               │
│    - Recursive normalization of alternatives                    │
│    - Type validation, numeric coercion                          │
│    - Limit to 2 alternatives per dish                           │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. UI Render (ScanView.tsx)                                    │
│    - Accordion dish card (collapsed by default)                │
│    - Expand to see DishAlternatives component                  │
│    - Radio buttons with nutrition previews                      │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. User clicks alternative (optionIndex = 1 or 2)              │
│    - handleAlternativeSelect(dishIndex, optionIndex)           │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. INSTANT SWAP (0s latency, no API call)                      │
│    - Array manipulation: swap dish with selected alternative    │
│    - Recalculate plate totals (calories, P/C/F/fiber)          │
│    - Update state via dish.setAnalysis()                        │
│    - Clear weight/calorie overrides for that dish              │
│    - UI re-renders immediately with new nutrition               │
└─────────────────────────────────────────────────────────────────┘
```

---

## UI/UX Behavior

### Collapsed Dish Card
- Shows primary dish name, calories, macros
- "Tap for details" hint
- No indication of alternatives (discovered on expand)

### Expanded Dish Card
- **If alternatives exist**:
  - `DishAlternatives` component at top
  - "Select Dish" label
  - Radio buttons for all 3 options (staggered animation)
  - Each option shows:
    - Radio indicator (green accent when selected)
    - Name + Hindi name
    - Confidence badge (Confident/Likely/Unsure)
    - Nutrition preview (calories + P/C/F)
    - Reasoning (why this is plausible)
  - Bottom border separator
- **Below alternatives**: standard editing controls (macros, weight, ingredients, etc.)

### Selection Interaction
1. User taps alternative option
2. Radio indicator moves to new selection
3. Nutrition values update instantly throughout card
4. Plate total recalculates and updates
5. No loading spinner, no API call
6. Smooth transition via React state update

---

## API Prompt Engineering

### Step 6B — Alternative Identifications

Added new step to `buildDishPrompt()`:

```
Step 6B — ALTERNATIVE IDENTIFICATIONS:
For EACH dish, identify the top 2 most likely alternative names if the visual
appearance could match multiple dishes. For each alternative, provide FULL
NUTRITION DATA just like the primary dish.

Rules for alternatives:
- Only include alternatives if they are genuinely plausible based on VISUAL
  similarity (color, texture, shape, plating)
- If the dish is clearly identifiable (e.g., banana, packaged snack with
  visible label), return empty alternatives array
- Each alternative must have complete nutrition data: calories, macros,
  ingredients, tags, health tip, reasoning
- Alternatives should reflect realistic portion sizes
- Use IFCT 2017 reference data for alternatives just like primary dish

Examples requiring alternatives:
• Iced tea vs iced coffee vs cold brew
• Oats chilla vs besan cheela vs uttapam
• Milkshake vs protein shake vs smoothie
• Fried rice vs brown rice vs jeera rice

Counter-examples (NO alternatives needed):
• Banana (clearly identifiable fruit)
• Packaged biscuits with visible brand
• Whole roti (distinct flat bread)
```

### JSON Output Schema

```json
{
  "dishes": [
    {
      "name": "Iced Tea",
      "hindi": "आइस्ड चाय",
      "calories": 80,
      "protein_g": 0,
      "carbs_g": 20,
      "fat_g": 0,
      "fiber_g": 0,
      "ingredients": ["Tea", "Sugar", "Lemon", "Ice"],
      "confidence": "medium",
      "tags": ["low-calorie"],
      "healthTip": "Watch the sugar content.",
      "reasoning": "Brown liquid with ice. Amber color suggests tea.",
      "alternatives": [
        {
          "name": "Iced Coffee",
          "hindi": "आइस्ड कॉफी",
          "calories": 5,
          "protein_g": 1,
          "carbs_g": 1,
          "fat_g": 0,
          "fiber_g": 0,
          "ingredients": ["Coffee", "Ice"],
          "confidence": "medium",
          "tags": ["low-calorie"],
          "healthTip": "Black coffee is virtually calorie-free.",
          "reasoning": "Darker brown liquid suggests coffee."
        }
      ]
    }
  ]
}
```

---

## Implementation Details

### Type Definitions

```typescript
// src/lib/dishTypes.ts
export interface DishNutrition {
  name: string;
  hindi: string;
  portion: string;
  estimated_weight_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  ingredients: string[];
  confidence: ConfidenceLevel;
  tags: string[];
  healthTip: string;
  reasoning: string;
  alternatives?: DishNutrition[]; // Recursive, up to 2 items
}
```

### Normalization (Recursive)

```typescript
// src/app/api/analyze-dish/route.ts
function normalizeDish(raw: unknown): DishNutrition | null {
  // ... base normalization ...

  // Recursively normalize alternatives (limit to 2)
  if (Array.isArray(input.alternatives) && input.alternatives.length > 0) {
    const normalizedAlternatives = input.alternatives
      .slice(0, 2)
      .map(normalizeDish)
      .filter((d): d is DishNutrition => Boolean(d));

    if (normalizedAlternatives.length > 0) {
      dish.alternatives = normalizedAlternatives;
    }
  }

  return dish;
}
```

### Instant Swap Handler

```typescript
// src/components/ScanView.tsx
const handleAlternativeSelect = useCallback((dishIndex: number, optionIndex: number) => {
  if (!dish.analysis) return;

  // Update selection tracking
  setSelectedAlternatives(prev => new Map(prev).set(dishIndex, optionIndex));

  // If primary selected (index 0), nothing to swap
  if (optionIndex === 0) return;

  // Swap dish with selected alternative (instant)
  const updatedDishes = [...dish.analysis.dishes];
  const currentDish = updatedDishes[dishIndex];
  const selectedAlt = currentDish.alternatives![optionIndex - 1];

  updatedDishes[dishIndex] = {
    ...selectedAlt,
    alternatives: [currentDish, ...currentDish.alternatives!.filter((_, i) => i !== optionIndex - 1)]
  };

  // Recalculate totals
  const totals = updatedDishes.reduce((acc, d) => ({
    calories: acc.calories + d.calories,
    protein: acc.protein + d.protein_g,
    carbs: acc.carbs + d.carbs_g,
    fat: acc.fat + d.fat_g,
    fiber: acc.fiber + d.fiber_g
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  // Update state (triggers re-render)
  dish.setAnalysis({
    ...dish.analysis,
    dishes: updatedDishes,
    totalCalories: totals.calories,
    totalProtein: totals.protein,
    totalCarbs: totals.carbs,
    totalFat: totals.fat,
    totalFiber: totals.fiber
  });

  // Clear overrides
  setWeightOverrides(prev => { const next = new Map(prev); next.delete(dishIndex); return next; });
  setCalorieOverrides(prev => { const next = new Map(prev); next.delete(dishIndex); return next; });
}, [dish]);
```

---

## Performance Metrics

### Token Usage

| Scan Type | Tokens | Cost (Free Tier) |
|-----------|--------|------------------|
| Without alternatives | 1600 | ✅ FREE |
| **With alternatives** | **2600** | **✅ FREE** |

Daily limits:
- Gemini 2.5 Flash: 1500 requests/day, 10M tokens/day
- 100 scans/day with alternatives = 260K tokens = **2.6% of limit**

### Latency

| Operation | Time | API Calls |
|-----------|------|-----------|
| Initial scan | 3-4s | 1 |
| Alternative selection | **0s** | **0** |
| Total (with selection) | 3-4s | 1 |

**vs. previous flow** (correction re-scan): 5-6s total with 2 API calls

---

## Edge Cases

### No Alternatives Returned
- `alternatives` field is `undefined` or empty array
- DishAlternatives component not rendered
- Card behaves exactly as before (no visual changes)

### Single Alternative
- UI renders 2 options (primary + 1 alternative)
- Still shows radio buttons for consistency

### API Error on Initial Scan
- Fallback providers don't support alternatives yet
- Falls back gracefully to standard response without alternatives

### User Edits Then Selects Alternative
- Any weight/calorie overrides for that dish are **cleared** on selection
- Fresh nutrition data from alternative is used
- User must re-edit if needed

---

## Testing

### Mock Mode
```bash
npm run dev
# Visit http://localhost:3000?mock=scan
```

Mock data includes:
- **Jeera Rice** with 2 alternatives (Steamed Rice, Fried Rice)
- Different nutrition profiles for each option
- Confidence levels vary (medium, medium, low)

### Manual Testing Checklist
- [ ] Scan dish with alternatives → verify all 3 options render
- [ ] Select alternative → verify instant swap (no loading)
- [ ] Check plate total updates immediately
- [ ] Verify weight/calorie overrides cleared on swap
- [ ] Scan dish without alternatives → verify no UI change
- [ ] Edit nutrition → select alternative → verify edits cleared

---

## Future Enhancements

### Potential Improvements
1. **Visual diff highlighting** — show what changed when selecting alternative
2. **Confidence sorting** — order alternatives by confidence score
3. **User feedback loop** — track which alternatives users select to improve AI
4. **Custom alternatives** — allow users to add their own dish identification
5. **Alternative history** — remember which alternatives user typically selects

### Not Planned (Out of Scope)
- ❌ More than 2 alternatives (adds visual clutter)
- ❌ Nested alternatives (too complex)
- ❌ Alternative re-analysis (defeats instant swap benefit)
- ❌ Alternatives for describe-meal flow (text input is already precise)

---

## Related Documentation
- [API Routes](./API-ROUTES.md) — `/api/analyze-dish` specification
- [Components](./COMPONENTS.md) — `DishAlternatives` component docs
- [Features](./FEATURES.md) — User-facing feature description
- [Testing](./TESTING.md) — Mock mode and E2E test coverage

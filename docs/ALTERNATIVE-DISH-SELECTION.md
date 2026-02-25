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
- **If alternatives exist**: Shows "Or tap to select:" label followed by purple alternative pills (e.g., "Steamed Rice", "Fried Rice")
  - Pills appear between macros and contextual note
  - **Purple color scheme** (distinct from macro pills: green/orange/red)
  - List icon (≡) + thicker border (2px) + shadow for visual hierarchy
  - Label provides clear context without requiring expansion
  - Makes alternatives immediately discoverable and understandable
- "Tap for details" hint at bottom

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

## Design Evolution: Alternative Pills

### Initial Problem (v1)
Initial implementation had no visual indication of alternatives on collapsed cards. Users had to expand every medium/low confidence dish to discover if alternatives existed, creating unnecessary friction.

### Visual Confusion Problem (v2)
Added green alternative pills with ↔ icon, but they looked identical to macro pills (Protein/Carbs/Fat), causing user confusion. Both used:
- Same green accent color scheme
- Same rounded-full pill shape
- Similar padding and borders
- Horizontal layout in rows

**User feedback:** "this is not very clear that other 2 are alternates, its in same color green pill as other etc very confusing"

### Final Solution: Purple Choice Theme (v3) ⭐

After exploring 4 design alternatives (purple, gray, blue, amber), we chose **Purple Choice Theme** for maximum clarity.

**Why Purple Wins:**
- ✅ **Only color completely distinct from macro pills** (green Protein, orange Carbs, red Fat)
- ✅ **Semantically indicates "choice"** in UI design patterns
- ✅ **Clear label** ("Or tap to select:") provides context without expansion
- ✅ **Visual hierarchy** via list icon (≡), thicker border (2px), and shadow
- ✅ **Professional and accessible** — good contrast, easy to read

**Implementation:**
```tsx
{/* Alternative pills preview (collapsed state only) */}
{!isExpanded && rawDish.alternatives && rawDish.alternatives.length > 0 &&
 shouldShowAlternatives(rawDish, rawDish.alternatives) && (
  <div className="flex flex-col gap-1.5 mt-3">
    <p className="text-[10px] text-muted uppercase tracking-wide font-semibold flex items-center gap-1">
      <svg className="w-3 h-3 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Or tap to select:
    </p>
    <div className="flex flex-wrap gap-1.5">
      {rawDish.alternatives.map((alt, altIndex) => (
        <span
          key={`${dishItem.name}-alt-${altIndex}`}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-purple-300 bg-purple-50 px-3 py-1.5 text-[11px] text-purple-700 font-medium shadow-sm hover:shadow-md hover:border-purple-400 transition-all cursor-pointer"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {alt.name}
        </span>
      ))}
    </div>
  </div>
)}
```

**Other Options Considered:**
- **Gray Dashed Border** — Neutral but less prominent, gray can feel "disabled"
- **Blue Info Container** — Strong separation but adds bulk to card
- **Amber Warning Theme** — Conflicts with orange Carbs pill, feels like warning vs. choice

Interactive comparison mockup: `docs/ui-mockups/alternative-pills-comparison.html`

---

### Previous Selection Interaction
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
For EACH dish, generate top 2 alternatives with FULL nutrition (same format as primary)
ONLY if the primary dish has "medium" or "low" confidence.

Include alternatives ONLY if:
- Primary dish confidence is "medium" or "low" (REQUIRED CONDITION)
- Visually similar (color, texture, shape match)
- Genuinely plausible given the image
- NOT clearly identifiable (banana, labeled packaging, distinctive shape)

If confidence is "high", return empty alternatives array or omit the field entirely.

Examples needing alternatives: Iced tea/coffee, chilla/uttapam, milkshake/smoothie,
fried/brown rice, chicken/paneer nuggets.
Skip alternatives for: High confidence dishes, banana, packaged snacks, whole roti.
```

**Performance optimization:** By conditioning on confidence level, we save 1-1.5s on high-confidence
dishes (60-70% of scans) while maintaining instant swap capability for ambiguous dishes.
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
| High confidence (no alternatives) | 1600 | ✅ FREE |
| Medium/low confidence (with alternatives) | **2600** | **✅ FREE** |

**Optimization:** Alternatives only generated for medium/low confidence dishes (~30-40% of scans).

Daily limits:
- Gemini 2.5 Flash: 1500 requests/day, 10M tokens/day
- 100 scans/day mixed = ~200K tokens = **2% of limit** (down from 2.6%)

### Latency

| Dish Confidence | Time | Alternatives Generated |
|-----------------|------|----------------------|
| High confidence | 2-3s | ❌ No (faster scan) |
| Medium confidence | 3-4s | ✅ Yes |
| Low confidence | 3-4s | ✅ Yes |

**Average scan time:** ~2.5-3s (estimated 60-70% high confidence, 30-40% medium/low)

**Alternative selection:** 0s (instant swap, no API call)

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

### Client-Side Filtering (Smart Hide Logic)

To prevent showing unhelpful or confusing alternatives, we filter them on the client:

```typescript
function shouldShowAlternatives(primary: DishNutrition, alternatives: DishNutrition[]): boolean {
  // Rule 1: If primary is "high" confidence, only show alternatives if at least one is "medium" or "high"
  if (primary.confidence === "high") {
    const hasReasonableAlternative = alternatives.some(alt => alt.confidence !== "low");
    if (!hasReasonableAlternative) return false;
  }

  // Rule 2: If only 1 alternative and it's "low" confidence, hide it
  if (alternatives.length === 1 && alternatives[0].confidence === "low") {
    return false;
  }

  // Rule 3: Hide if all alternatives have exact same calories (likely AI glitch)
  const uniqueCalories = new Set(alternatives.map(alt => alt.calories));
  if (uniqueCalories.size === 1 && alternatives[0].calories === primary.calories) {
    return false;
  }

  return true;
}
```

**When alternatives are hidden:**
- ✅ Primary: "Banana" (high confidence) + Alternatives: "Fried Rice" (low), "Pizza" (low) → **HIDDEN** (no reasonable alternatives)
- ✅ Primary: "Roti" (high confidence) + Alternatives: "Paratha" (medium) → **SHOWN** (at least one medium alternative)
- ✅ Primary: "Iced Tea" (medium) + Alternatives: "Iced Coffee" (low) → **HIDDEN** (single low-confidence alternative)
- ✅ Primary: "Rice" (medium) + Alternatives: "Rice" (210 cal), "Rice" (210 cal) → **HIDDEN** (duplicate calories, AI glitch)

This ensures users only see alternatives when they're genuinely helpful!

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

# Scan Results Redesign — Implementation Plan

**Status:** ✅ IMPLEMENTED
**Branch:** `feat/scan-results-redesign`
**Base:** `main` (commit `a645745`)
**Approved Mockup:** `public/mockups/design-final.html` (v2)

---

## Problem

The current scan results page has:
- Text at 10px everywhere — illegible on mobile
- Scattered layout: meal context and portion adjuster are separate cards above results
- AI Health Check is tiny (a centered pill button) and easily missed
- Individual dishes use `NutritionCard` with a 2-col grid of 5 metric boxes at 10px
- No dish-level contextual notes (just tags at the bottom)
- Expand/collapse toggle hides ALL dishes behind one button
- No confidence badge on collapsed cards
- Health check only works with health profile (returns null without one)

## Design Summary

The approved design (see `public/mockups/design-final.html`) reorganizes the results into:

1. **Controls Strip** — horizontal scrollable row combining meal type + portion selector (Design C style)
2. **Plate Total** — centered, large calorie number with macro breakdown below (Design C style)
3. **AI Health Check** — large, prominent card with two variants: with-profile and without-profile (Design B style)
4. **Verdict Result** — shown after health check completes
5. **Capy Mascot** — compact inline (36px avatar + speech bubble)
6. **Individual Dishes** — separate accordion cards per dish with collapsed/expanded states (Design B cards, Design A expanded)
7. **Sticky Log Bar** — fixed at bottom with total + log button
8. **Clear link** — below sticky bar

---

## Files to Modify

### 1. `src/components/ScanView.tsx` (PRIMARY — major rewrite of the results section)

The file structure stays the same (same props, same hooks, same state). The **render output** changes significantly.

#### Keep as-is:
- All imports, props interface, constants (`SERVING_OPTIONS`, `MEAL_TYPE_OPTIONS`)
- Helper functions: `getHealthTagColor`, `titleCaseTag`, `getDaysAgo`, `scaleDish`, `deriveTags`
- All state variables and hooks: `servingsMultiplier`, `logMealType`, `removedIndices`, `weightOverrides`, `calorieOverrides`, `expandedView`, etc.
- All handler functions: `handleRemoveDish`, `handleWeightChange`, `handleCalorieChange`, `handleLogMeal`
- `WeightEditor`, `CalorieEditor`, `CorrectionChip` sub-components (will be reused in expanded dish view)
- Mode toggle (camera/describe) stays at the top
- `GeminiCameraView` usage stays as-is
- `DescribeMealView` branch stays as-is

#### Remove:
- The separate "Meal context" card (lines 333-354)
- The separate "Portion Adjuster" card (lines 356-377)
- The current plate total section (lines 421-444)
- The expand/collapse toggle button (lines 492-509)
- The current dish rendering loop that uses `NutritionCard` (lines 511-582)
- The current log meal card (lines 584-619)

#### Add (new layout, in order):

**A. Controls Strip (replaces meal context + portion adjuster)**
```
<div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5 mb-3">
  {/* Meal type buttons */}
  {MEAL_TYPE_OPTIONS.map(option => (
    <button className="pill-style" active={logMealType === option}>
      {capitalize(option)} {isAutoSelected && <dot indicator>}
    </button>
  ))}
  {/* Divider */}
  <div className="w-px bg-border shrink-0 my-1 mx-0.5" />
  {/* Portion multiplier buttons */}
  {SERVING_OPTIONS.map(value => (
    <button className="pill-style" active={servingsMultiplier === value}>
      {value === 0.5 ? '½×' : value === 1.5 ? '1.5×' : `${value}×`}
    </button>
  ))}
</div>
```

**Key behavior:** Auto-select meal type based on time of day. Add a new helper:

```typescript
function getAutoMealType(): MealType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 18) return "snack";
  return "dinner";
}
```

Initialize `logMealType` with `getAutoMealType()` instead of hardcoded `"lunch"`. Track whether auto-selected with `const [autoMealType] = useState(getAutoMealType())` and show green dot indicator if `logMealType === autoMealType`.

Also sync `dish.setMealType(logMealType)` when meal type changes.

**B. Plate Total (Design C centered)**
```
<div className="rounded-2xl bg-card border border-border p-5 text-center mb-3">
  <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Plate Total</p>
  <div>
    <span className="text-5xl font-black tracking-tighter leading-none">{scaledTotals.calories}</span>
    <span className="text-base font-medium text-muted ml-1">kcal</span>
  </div>
  <p className="text-xs text-muted-light mt-1">
    {scaledDishes.length} dish{scaledDishes.length !== 1 ? 'es' : ''} · {capitalize(logMealType)}
  </p>
  <div className="flex justify-center gap-5 mt-4">
    <MacroStat label="Protein" value={scaledTotals.protein} color="text-accent-dim" />
    <MacroStat label="Carbs" value={scaledTotals.carbs} color="text-orange" />
    <MacroStat label="Fat" value={scaledTotals.fat} color="text-red-500" />
    <MacroStat label="Fiber" value={scaledTotals.fiber} color="text-emerald-600" />
  </div>
</div>
```

Where `MacroStat` is a tiny inline helper:
```typescript
function MacroStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-lg font-extrabold ${color}`}>{value}g</p>
      <p className="text-[11px] text-muted mt-0.5">{label}</p>
    </div>
  );
}
```

**C. AI Health Check (Design B prominent card)**

Replace the current health verdict section (lines 447-462) with the new design. This uses updated exports from `HealthVerdictCard.tsx` (see below).

Two variants:
1. **With profile:** Gradient background, purple icon, condition names shown, purple arrow button
2. **Without profile:** White card, dashed border, muted styling, "How healthy is this meal?" text

Both are always visible (no more returning null). The "with-profile" variant triggers `triggerHealthCheck`. The "without-profile" variant calls `onSetupHealthProfile`.

**D. Verdict Result**

After health check completes, show the verdict card. Reuse `MealHealthBanner` but restyle it to match the mockup (larger text, icon-based header, no "Caution" label — use "Needs Attention" for caution).

**E. Capy Mascot — Compact Inline**
```
<div className="flex items-start gap-2.5 mb-3.5">
  <CapyMascot mood={capyMood} size={36} animate={false} className="shrink-0 rounded-full bg-accent-light border border-accent/20 p-0.5" />
  <div className="flex-1 bg-card border border-border rounded-xl rounded-bl-sm px-3 py-2">
    <p className="text-[13px] text-muted leading-relaxed">{capyMessage}</p>
  </div>
</div>
```

**F. Individual Dishes — Accordion Cards**

Each dish gets its own card. **No more global expand/collapse toggle.** Each card has independent expanded state.

Add new state:
```typescript
const [expandedDishIndex, setExpandedDishIndex] = useState<number | null>(null);
```

Tapping a collapsed card expands it (and collapses any other). Single-dish results auto-expand.

**Collapsed Card Structure:**
```
┌─────────────────────────────────────────────┐
│ Dal Makhani  [Confident badge]     285 kcal │
│ दाल मखनी · 180g                             │
│                                              │
│ [●Protein 18g] [●Carbs 20g] [●Fat 14g]     │
│                                              │
│ ⚠ High cream & butter — calorie dense       │
│                                              │
│         ˅ Tap for details & editing          │
└─────────────────────────────────────────────┘
```

**Tag-based contextual note generation.** Add a new function:

```typescript
function generateDishNote(dish: DishNutrition): { text: string; type: 'positive' | 'warning' } | null {
  const tags = deriveTags(dish);
  const ingredients = dish.ingredients.map(i => i.toLowerCase());

  // Warning notes
  if (ingredients.includes('maida') || ingredients.includes('refined flour')) {
    return { text: 'Made with refined flour (maida)', type: 'warning' };
  }
  if (tags.includes('high-fat') && (ingredients.includes('butter') || ingredients.includes('cream') || ingredients.includes('ghee'))) {
    return { text: `High cream & butter content — calorie dense`, type: 'warning' };
  }
  if (tags.includes('high-carb') && dish.fiber_g < 3) {
    return { text: 'High in refined carbs, low fiber', type: 'warning' };
  }
  if (tags.includes('high-calorie')) {
    return { text: `Calorie dense at ${dish.calories} kcal`, type: 'warning' };
  }

  // Positive notes
  if (tags.includes('high-protein') && tags.includes('low-calorie')) {
    return { text: 'High protein, low calorie — great choice', type: 'positive' };
  }
  if (tags.includes('fiber-rich')) {
    return { text: 'Good fiber source — aids digestion', type: 'positive' };
  }
  if (tags.includes('high-protein')) {
    return { text: 'Good protein source', type: 'positive' };
  }
  if (ingredients.includes('yogurt') || ingredients.includes('curd') || ingredients.includes('dahi')) {
    return { text: 'Good probiotic source — low calorie, aids digestion', type: 'positive' };
  }
  if (tags.includes('low-calorie')) {
    return { text: 'Light and low calorie', type: 'positive' };
  }

  return null;
}
```

**Confidence badge mapping:**
- `high` → green badge, checkmark icon, "Confident"
- `medium` → amber badge, info icon, "Likely"
- `low` → gray badge, help-circle icon, "Unsure"

**Expanded Card Structure:**
```
┌─────────────────────────────────────────────┐
│ [Collapsed content - background #fdfcfa]    │
├─────────────────────────────────────────────┤
│ ┌─────┬───────┬──────┬──────┬──────┐       │
│ │ Cal │ Prot  │ Carb │ Fat  │Fiber │       │
│ │ 262 │  7g   │ 38g  │  9g  │  2g  │       │
│ └─────┴───────┴──────┴──────┴──────┘       │
│   Tap any value to edit — others adjust     │
│                                              │
│ Portion    2 pieces, medium  ✏              │
│ Weight     120g  ✏                          │
│                                              │
│ KEY INGREDIENTS                              │
│ [Maida] [Butter] [Yeast] [Yogurt]           │
│                                              │
│ ┌─ Health Tip ────────────────────────┐     │
│ │ Naan uses refined flour. Switch to  │     │
│ │ tandoori roti for more fiber...     │     │
│ └─────────────────────────────────────┘     │
│                                              │
│ ℹ Why this estimate?  ˅                     │
│                                              │
│ [↻ Wrong dish?] [✏ Describe] [🗑 Remove]    │
└─────────────────────────────────────────────┘
```

The expanded section reuses existing `WeightEditor` and `CalorieEditor` components but integrates them inline within the detail rows and macro grid.

**Macro grid editing:** Tapping a macro cell opens an inline editor. When calories change, all macros scale proportionally. When weight changes, everything scales proportionally. This is already implemented via `handleCalorieChange` and `handleWeightChange`.

The expanded macro grid cells should be clickable. On click, open a `CalorieEditor`-style inline editor for that specific value.

**G. Sticky Log Bar**
```
<div className="sticky bottom-0 bg-card border-t border-border rounded-t-2xl px-4 py-3 -mx-4 mt-4 flex items-center gap-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
  <div className="flex-1">
    <p className="text-lg font-extrabold">{scaledTotals.calories} kcal</p>
    <p className="text-xs text-muted">{capitalize(logMealType)} · {scaledDishes.length} dishes</p>
  </div>
  <button onClick={handleLogMeal} className="bg-accent text-white rounded-xl px-6 py-3 text-sm font-bold">
    {logSuccess ? 'Logged ✓' : 'Log Meal'}
  </button>
</div>
```

**H. Clear link**
```
<button onClick={dish.clearAnalysis} className="w-full text-center py-2 text-xs text-muted-light hover:text-foreground">
  Clear analysis & re-scan
</button>
```

### 2. `src/components/HealthVerdictCard.tsx` (UPDATE)

Changes needed:
- **`MealHealthBanner`:** Remove `if (!hasHealthProfile) return null;`. Update text sizes from `text-[10px]`/`text-[9px]` to `text-sm`/`text-xs`. Use verdict labels from mockup: "good" → "Looks Good", "caution" → "Needs Attention", "avoid" → "Not Recommended". Add the `vr-label` "Dr. Capy's Verdict" tag.
- **`HealthCheckButton`:** Redesign as a full-width card matching Design B's `.health-banner.with-profile`. Should have: 48px gradient icon, "AI Health Check" title with gradient text, condition subtitle, purple arrow button. Much larger than current centered pill.
- **`HealthProfilePrompt`:** Redesign as a full-width card matching `.health-banner.without-profile`. White bg, dashed border, "How healthy is this meal?" title, "Get a general nutrition assessment" subtitle, muted arrow button. Remove the current `opacity-50` styling.

### 3. `src/components/NutritionCard.tsx` (NO CHANGES — becomes unused by ScanView)

This component is no longer imported in `ScanView.tsx`. It may still be used elsewhere (check `DescribeMealView.tsx`). Do **not** delete it, just remove the import from ScanView.

### 4. `src/components/CapyMascot.tsx` (NO CHANGES)

Used as-is with `size={36}`.

---

## New Helper Functions (add to ScanView.tsx)

### `getAutoMealType(): MealType`
Returns meal type based on current hour. See spec above.

### `generateDishNote(dish: DishNutrition): { text: string; type: 'positive' | 'warning' } | null`
Generates contextual one-liner from dish properties (tags, ingredients, macros). See spec above. No AI call needed.

### `MacroStat` (tiny inline component)
Used in Plate Total. See spec above.

### `ConfidenceBadge` (tiny inline component)
```typescript
function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const config = {
    high: { label: 'Confident', icon: Check, bg: 'bg-green-50', border: 'border-accent/25', text: 'text-accent-dim' },
    medium: { label: 'Likely', icon: Info, bg: 'bg-orange-light', border: 'border-orange/25', text: 'text-orange' },
    low: { label: 'Unsure', icon: HelpCircle, bg: 'bg-background', border: 'border-border', text: 'text-muted' },
  }[level];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${config.bg} ${config.border} ${config.text}`}>
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </span>
  );
}
```

---

## New Lucide Icons to Import

Add to existing imports in ScanView.tsx:
- `Check` (for confidence badge) — already imported
- `Info` (for medium confidence badge)
- `HelpCircle` (for low confidence badge)
- `ChevronDown` — already imported
- `RefreshCw` (for "Wrong dish?" button — replaces emoji)
- `Trash2` — already imported
- `PenLine` — already imported
- `Stethoscope` (for health check icon — or use SVG from mockup)

---

## State Changes

### Remove:
- `expandedView` state — replaced by per-dish expansion

### Add:
- `expandedDishIndex: number | null` — tracks which dish card is expanded (null = all collapsed)
- `autoMealType` — calculated once on mount for the green dot indicator

### Modify:
- `logMealType` initial value: `getAutoMealType()` instead of `"lunch"`

---

## CSS / Tailwind Notes

- The mockup uses CSS variables that match the existing Tailwind theme (--accent, --border, --muted, etc.)
- `scrollbar-hide` utility: may need `className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"` or add a Tailwind plugin
- Sticky log bar: `sticky bottom-0` with negative margins `mx-[-16px]` to span full width
- Gradient text for health check title: `bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent`
- Speech bubble shape: `rounded-xl rounded-bl-sm` for the capy bubble

---

## Animation Notes

- Dish cards: `motion.div` with `initial={{ opacity: 0, y: 8 }}` for staggered entry
- Expanded section: `AnimatePresence` + `motion.div` with `initial={{ height: 0, opacity: 0 }}` / `animate={{ height: "auto", opacity: 1 }}`
- Capy avatar: `initial={{ scale: 0 }} animate={{ scale: 1 }}` with spring
- Capy bubble: `initial={{ x: 8, opacity: 0 }} animate={{ x: 0, opacity: 1 }}`
- Log success: existing behavior (flash green for 1.2s)

---

## Testing Checklist

After implementation:
- [ ] Scan a dish → results show in new layout
- [ ] Plate total updates when dishes are removed
- [ ] Plate total updates when portion multiplier changes
- [ ] Meal type auto-selects based on time of day
- [ ] Green dot shows on auto-selected meal type
- [ ] Tapping a different meal type works and updates log bar
- [ ] Tapping a dish card expands it (collapses others)
- [ ] Expanded card shows editable macro grid
- [ ] Editing calories scales all macros proportionally
- [ ] Editing weight scales everything proportionally
- [ ] "Wrong dish?" correction flow works
- [ ] "Describe instead" switches to describe mode
- [ ] "Remove" removes the dish and updates totals
- [ ] AI Health Check (with profile) shows prominent card and triggers check
- [ ] AI Health Check (without profile) shows "How healthy" variant
- [ ] Verdict result displays after check
- [ ] Capy shows contextual message
- [ ] Sticky log bar shows at bottom with correct totals
- [ ] Log meal works and shows success flash
- [ ] "Clear analysis & re-scan" works
- [ ] Confidence badge shows correctly (high/medium/low)
- [ ] Tag-based contextual notes appear on collapsed cards
- [ ] Health tip shows in expanded view
- [ ] Reasoning toggle works in expanded view
- [ ] `npm run build` passes

---

## Implementation Order

1. Add `getAutoMealType()`, `generateDishNote()`, `MacroStat`, `ConfidenceBadge` helpers
2. Replace `expandedView` state with `expandedDishIndex`
3. Change `logMealType` initialization to `getAutoMealType()`
4. Replace meal context + portion adjuster with Controls Strip
5. Replace plate total with centered Design C layout
6. Update `HealthVerdictCard.tsx` exports (prominent cards, verdict styling)
7. Replace health verdict section with new AI Health Check card
8. Add compact Capy mascot row
9. Replace dish list with accordion cards (collapsed view)
10. Build expanded dish view (macro grid, detail rows, ingredients, health tip, actions)
11. Replace log section with sticky log bar + clear link
12. Remove `NutritionCard` import
13. Test all flows, run `npm run build`

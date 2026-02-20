# React Components

All components are in `src/components/`. All are `"use client"` components.

---

## Core — Cloud AI Mode

### `GeminiMode.tsx`
**The main orchestrator for Cloud AI mode.** Wires together camera, detected items, recipes, filters, expiry tracker, shopping list, and meal planner.
- Uses `useGeminiVision()` hook for camera + analysis state
- Uses `useExpiryTracker()` hook for freshness tracking
- Auto-adds detected items to expiry tracker when new items appear
- Renders all sub-components in order: Camera → Diet Filter → Detected Items → Expiry → Tip → Shopping List → Meal Planner → Recipes

### `GeminiCameraView.tsx`
**Camera feed with controls for Cloud AI mode.**
- Props: `videoRef`, `canvasRef`, `isStreaming`, `isAnalyzing`, `autoScan`, `error`, `onStart`, `onStop`, `onFlip`, `onAnalyze`, `onToggleAutoScan`, `hasApiKey`
- Camera height: `h-[65vh]` when streaming, `aspect-[4/3]` when idle
- Overlay: corner brackets, analyzing pulse animation, status badge (Analyzing/Auto-scanning/Ready)
- Controls: Start Camera, Flip, Analyze, Auto-scan toggle, Stop
- Placeholder: camera icon + "Point your camera at your fridge"

### `GeminiDetectedItems.tsx`
**Displays items detected by AI with Hindi names and confidence badges.**
- Props: `items: DetectedItem[]`, `onClear`, `onRemoveItem`, `frameCount`, `lastAnalyzedAt`
- Shows scan count and time since last scan
- Each item: name, Hindi name, confidence badge (green/yellow/red), X to remove
- Animated with framer-motion popLayout

### `GeminiRecipeCard.tsx`
**Individual recipe card with full details.**
- Props: `recipe: GeminiRecipe`, `index: number`
- Shows: name (EN + Hindi), description, cook time, difficulty, diet badge, tags
- "You have" ingredients (green) and "Also need" ingredients (orange)
- Expandable steps section
- `ShareRecipe` button in top-right corner
- Staggered entrance animation (delay based on index)

### `DietaryFilter.tsx`
**Diet preference pill selector.**
- Props: `value: DietaryFilter`, `onChange`
- Options: All 🍽️, Veg 🥬, Vegan 🌱, Egg 🥚, Jain 🙏
- Active pill: solid green accent background with spring animation (layoutId="diet-pill")
- Inactive: subtle border

### `ShareRecipe.tsx`
**"Send to Cook" dropdown with Hindi audio/text and English sharing options.**
- Props: `recipe: GeminiRecipe`
- State: `isOpen`, `copied`, `isSpeaking`, `hindiLoading`, `audioLoading`, `hindiText`, `servings`
- Serving size picker: 1🧑 2🧑 3🧑 4🧑 (default: 2)
- Hindi section: Audio Message (Sarvam TTS), Text on WhatsApp (Groq)
- English section: WhatsApp, Read Aloud, Share via, Copy
- Backdrop overlay when open
- Animated dropdown with framer-motion

### `ShoppingList.tsx`
**Auto-generated shopping list from recipe ingredients_needed.**
- Props: `recipes: GeminiRecipe[]`, `detectedItemNames: string[]`
- Deduplicates needed items across all recipes
- Excludes items user already has (detected)
- Shows which recipe each item is for
- Copy to clipboard button
- Collapsible (hidden when no items needed)

### `ExpiryTracker.tsx`
**Freshness/expiry tracker for detected items.**
- Props: `items: TrackedItem[]`, `expiringCount`, `onSetExpiry`, `onRemove`, `onClearAll`, `getDaysLeft`
- Color-coded: green (fresh), yellow (expiring ≤2d), red (expired)
- Icons per category: Leaf, Clock, AlertTriangle, CalendarClock
- Tap date label to edit expiry with date picker
- Clear all button
- Collapsible, shows warning badge count

### `MealPlanner.tsx`
**Weekly meal planner with recipe assignment.**
- Props: `availableRecipes: GeminiRecipe[]`, `detectedItemNames: string[]`
- 7-day grid (Mon-Sun)
- Add recipes to days from available suggestions
- Remove individual meals or clear day
- Copy day's plan to clipboard
- Persisted in localStorage (`fridgenius-meal-plan`)
- Collapsible

---

## Core — YOLO Mode

### `YoloMode.tsx`
Orchestrator for on-device YOLO detection mode. Uses `useYoloDetection()` hook.

### `YoloCameraView.tsx`
Camera view for YOLO mode with real-time bounding box overlay on canvas.

### `CameraView.tsx`
Generic camera view component (used by YOLO mode). Similar to GeminiCameraView but simpler.

### `DetectedItems.tsx`
Generic detected items display for YOLO mode. Shows item name + count as a Map.

### `RecipeCard.tsx` / `RecipeSuggestions.tsx`
Legacy recipe display components for YOLO mode. Uses static recipe database.

---

## Utility

### `ModeSwitcher.tsx`
**Toggle between YOLO On-Device and Cloud AI modes.**
- Props: `mode: DetectionMode`, `onModeChange`
- Two buttons with spring-animated background (layoutId="mode-bg")
- Description text below changes per mode
- `DetectionMode = "yolo" | "gemini"`

### `ApiKeyInput.tsx`
Legacy API key input component. Currently not used (API keys are in .env.local server-side).

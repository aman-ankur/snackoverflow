# Animations & Visual Assets Guide

## Table of Contents
1. [Overview](#overview)
2. [Types of Animations in This Project](#types-of-animations)
3. [Static Images (PNG/JPG)](#static-images)
4. [Lottie Animations](#lottie-animations)
5. [Framer Motion](#framer-motion)
6. [CSS Animations](#css-animations)
7. [Three.js 3D Animations](#threejs-3d-animations)
8. [When to Use What](#when-to-use-what)
9. [Best Practices](#best-practices)
10. [Resources & Learning](#resources-and-learning)

---

## Overview

This project (SnackOverflow) uses **4 types of visual assets and animations**:

| Type | Use Case | Examples in Project |
|------|----------|---------------------|
| **Static Images (PNG)** | Simple mascots, icons | Capy mood variants |
| **Lottie (JSON)** | Complex looping animations | Fat capy, cute cat, cute dog |
| **Framer Motion** | UI transitions, layout animations | Tab switching, cards, overlays |
| **CSS Animations** | Simple repetitive effects | Breathing, pulsing, scan lines |
| **Three.js** | 3D interactive scenes | Capybara garden |

---

## Types of Animations

### 1. Static Images (PNG/JPG)
**Location:** `/public/model/capy-*.png`

**What they are:**
- Pre-rendered PNG images
- No animation, just static frames
- Minimal file size (5-50 KB per image)

**Our usage:**
```tsx
// CapyMascot.tsx
const CAPY_IMAGES = {
  happy: "/model/capy-happy.png",
  motivated: "/model/capy-motivated.png",
  default: "/model/capy-default.png",
};

<img src={CAPY_IMAGES[mood]} alt="Capy" />
```

**Pros:**
- ✅ Tiny file size
- ✅ Instant load
- ✅ Simple state switching (mood-based images)

**Cons:**
- ❌ No animation
- ❌ Need separate file for each variant

**When to use:**
- Icons, logos, simple mascots
- When you have 3-5 discrete states (not animated)
- Mobile-first apps (bandwidth matters)

---

### 2. Lottie Animations

**Location:** `/public/model/*.json` (capy-mascot.json, cute-cat.json, cute-dog.json)

**What is Lottie?**
- JSON-based animation format created by Airbnb
- Exported from Adobe After Effects using the Bodymovin plugin
- Renders as vector animation in the browser
- Lightweight (10-100 KB for complex animations)

**Our implementation:**
```tsx
// CapyLottie.tsx
import Lottie from "lottie-react";

<Lottie
  animationData={jsonData}
  loop
  autoplay
  style={{ width: 120, height: 120 }}
/>
```

**Used in:**
- Fat capybara animation on Home greeting cards
- Cute cat animation on Progress page header
- Cute dog animation on fridge scanner card

**Pros:**
- ✅ Smooth vector animations (scales to any resolution)
- ✅ Small file size compared to GIF/video
- ✅ Can control speed, loop, play/pause
- ✅ Looks professional and polished

**Cons:**
- ❌ Requires After Effects skill to create/edit
- ❌ Extra dependency (`lottie-react` — 30 KB gzipped)
- ❌ Initial load time for JSON fetch

**When to use:**
- Onboarding sequences, loading states, success animations
- Mascots with complex movements
- Decorative elements that add "personality"
- When you want designer-quality animation without video weight

**File size comparison:**
- GIF: 200-500 KB (pixelated, low FPS)
- MP4: 100-300 KB (good quality, but video tag overhead)
- **Lottie JSON: 20-80 KB** ✨ (vector, any resolution)

---

### 3. Framer Motion

**What is it?**
- React animation library for UI transitions
- Declarative API (describe what, not how)
- Handles layout animations, gestures, exit animations

**Package:** `framer-motion` (87 KB gzipped)

**Our usage patterns:**

#### A. Tab Transitions (View Switching)
```tsx
// page.tsx
<AnimatePresence mode="wait" initial={false}>
  <motion.div
    key={activeView}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.2 }}
  >
    {activeView === 'home' && <HomeView />}
    {activeView === 'scan' && <ScanView />}
  </motion.div>
</AnimatePresence>
```

**Result:** Smooth fade + slide when switching tabs

#### B. Layout Animations (Pills, Toggles)
```tsx
// Mode switcher with animated background pill
<motion.div layoutId="mode-bg" className="absolute inset-0 bg-accent rounded-full" />
```

**Result:** Background pill smoothly moves between buttons (see Camera/Describe/Upload toggle)

#### C. Staggered List Animations
```tsx
// Recipe cards appearing one by one
{recipes.map((recipe, i) => (
  <motion.div
    key={recipe.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.08 }} // Stagger by 80ms
  >
    <RecipeCard recipe={recipe} />
  </motion.div>
))}
```

**Result:** Cards "cascade in" sequentially (feels polished)

#### D. Conditional Rendering (AnimatePresence)
```tsx
// Overlay that fades in/out when shown
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <MealDetailOverlay />
    </motion.div>
  )}
</AnimatePresence>
```

**Key Feature:** `exit` animations (graceful unmount)

**Pros:**
- ✅ Declarative (easy to read)
- ✅ Layout animations (auto-calculates transforms)
- ✅ Gesture support (drag, swipe)
- ✅ Spring physics (feels natural)

**Cons:**
- ❌ Bundle size (87 KB gzipped)
- ❌ Overkill for simple CSS animations
- ❌ React-only (not framework-agnostic)

**When to use:**
- UI state transitions (tabs, modals, dropdowns)
- Drag-and-drop, swipe gestures
- Layout animations (reordering lists, resizing)
- Complex orchestration (sequencing multiple animations)

**When NOT to use:**
- Simple loops (breathing, pulsing) → Use CSS
- Onboarding character animations → Use Lottie
- 3D scenes → Use Three.js

---

### 4. CSS Animations

**Location:** `src/app/globals.css`

**Our custom animations:**

| Animation | Keyframes | Used For |
|-----------|-----------|----------|
| `fade-in-up` | Opacity 0→1, Y 8px→0 | Card entrances |
| `scan` | Y -100%→100% | YOLO scan line overlay |
| `pulse-glow` | Opacity 0.6→1→0.6 | Glow effects |
| `wiggle` | Rotate -4°→4° | Playful emphasis |
| `breathe` | Scale 1→1.025→1 | Capy body breathing |
| `shimmer` | Gradient position animation | CTA buttons |

**Example:**
```css
@keyframes breathe {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.025); }
}

.animate-breathe {
  animation: breathe 3s ease-in-out infinite;
}
```

**Usage in JSX:**
```tsx
<div className="animate-breathe">
  <CapyMascot mood="happy" />
</div>
```

**Pros:**
- ✅ Zero JavaScript (best performance)
- ✅ Tiny file size (CSS is already loaded)
- ✅ Works without React/JS enabled
- ✅ Hardware-accelerated (GPU)

**Cons:**
- ❌ Limited control (can't easily pause/reverse)
- ❌ Complex keyframes get verbose
- ❌ No layout animations

**When to use:**
- Looping effects (breathing, pulsing, rotating)
- Loading spinners
- Hover effects
- Anything that runs continuously

---

### 5. Three.js 3D Animations

**Location:** `src/components/CapyGarden.tsx`

**What is it?**
- WebGL-based 3D rendering library
- React Three Fiber: React wrapper for Three.js
- Used for the capybara garden (3D scene with trees, flowers, capybaras)

**Package:** `three` + `@react-three/fiber` + `@react-three/drei` (~150 KB gzipped combined)

**Lazy-loaded** to avoid blocking initial page load:
```tsx
const CapyGarden = lazy(() => import("@/components/CapyGarden"));
```

**Pros:**
- ✅ True 3D (camera movement, lighting, shadows)
- ✅ Interactive (click objects, rotate camera)
- ✅ Highly immersive

**Cons:**
- ❌ Large bundle (150+ KB)
- ❌ GPU-intensive (drains battery on mobile)
- ❌ Complex to build/maintain

**When to use:**
- 3D product viewers, games, data visualization
- "Wow factor" features (like our garden)

**When NOT to use:**
- 2D UI animations → Use Framer Motion
- Character animations → Use Lottie

---

## When to Use What

| Scenario | Solution | Why |
|----------|----------|-----|
| **Button hover effect** | CSS animation | Lightweight, always-on |
| **Tab switching** | Framer Motion | Layout transitions, exit animations |
| **Loading mascot** | Lottie | Designer-quality, small file size |
| **Card entrance** | CSS + Framer Motion | CSS for simple fade, FM for stagger |
| **Drag-to-reorder** | Framer Motion | Built-in gesture support |
| **3D character scene** | Three.js | Only option for 3D |
| **Simple mood states** | Static PNG images | 3 states × 10 KB = 30 KB (vs 80 KB Lottie) |
| **Onboarding wizard** | Framer Motion | Multi-step transitions |
| **Continuous breathing effect** | CSS animation | Infinite loop, no JS |

---

## Best Practices

### 1. Lazy-Load Heavy Animations
```tsx
// ❌ Bad: Blocks initial load
import CapyGarden from "@/components/CapyGarden";

// ✅ Good: Loads on demand
const CapyGarden = lazy(() => import("@/components/CapyGarden"));
```

### 2. Optimize Lottie File Size
- Export from After Effects with "Essential Properties Only"
- Remove unused layers
- Target: < 50 KB per animation

### 3. Use `will-change` for CSS Animations
```css
.animate-breathe {
  will-change: transform;
  animation: breathe 3s ease-in-out infinite;
}
```
**Effect:** Tells browser to GPU-accelerate this element

### 4. Prefer CSS for Simple Loops
```tsx
// ❌ Overkill
<motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 3 }} />

// ✅ Better
<div className="animate-breathe" />
```

### 5. Gate Heavy Animations on Mobile
```tsx
const isMobile = window.innerWidth < 768;

{!isMobile && <ThreeJSScene />}
```

### 6. Reduce Motion for Accessibility
```css
@media (prefers-reduced-motion: reduce) {
  .animate-breathe {
    animation: none;
  }
}
```

---

## Resources & Learning

### Official Docs
- **Framer Motion:** https://www.framer.com/motion/
- **Lottie:** https://lottiefiles.com/learn
- **Three.js:** https://threejs.org/manual/
- **React Three Fiber:** https://docs.pmnd.rs/react-three-fiber/

### Free Lottie Animations
- **LottieFiles:** https://lottiefiles.com/ (search "capybara", "food", "success")
- Filter by "free" license

### Framer Motion Tutorials
- **Official Examples:** https://www.framer.com/motion/examples/
- **YouTube:** "Framer Motion for Beginners" by Sam Selikoff
- **Blog:** https://blog.maximeheckel.com/posts/framer-motion-layout-animations/

### CSS Animation Resources
- **Animista:** https://animista.net/ (generate keyframes visually)
- **Easings:** https://easings.net/ (timing functions)
- **CSS Tricks Guide:** https://css-tricks.com/almanac/properties/a/animation/

### Three.js Learning
- **Three.js Journey:** https://threejs-journey.com/ (paid course, best resource)
- **React Three Fiber Docs:** https://docs.pmnd.rs/react-three-fiber/getting-started/introduction
- **Drei Examples:** https://drei.pmnd.rs/ (pre-built 3D components)

### Community Forums
- **Framer Motion Discord:** https://discord.gg/framer
- **Three.js Discourse:** https://discourse.threejs.org/
- **Reddit:** r/reactjs, r/threejs
- **Stack Overflow:** Tag `framer-motion`, `lottie`, `three.js`

### Design Tools
- **Adobe After Effects** (Lottie creation)
  - Free Bodymovin plugin: https://aescripts.com/bodymovin/
- **Figma** (export SVG for CSS animations)
- **Rive** (alternative to Lottie, interactive animations): https://rive.app/
- **Spline** (3D design for web): https://spline.design/

---

## Quick Comparison Chart

| Feature | Static PNG | Lottie | Framer Motion | CSS | Three.js |
|---------|-----------|--------|---------------|-----|----------|
| **File Size** | 5-50 KB | 20-80 KB | 87 KB lib | 0 KB | 150 KB lib |
| **Animation** | ❌ None | ✅ Vector | ✅ Layout | ✅ Keyframes | ✅ 3D |
| **Performance** | ⚡ Instant | ⚡ Fast | ⚡ Fast | ⚡⚡ Fastest | 🐌 GPU-heavy |
| **Learning Curve** | Easy | Medium | Medium | Easy | Hard |
| **Mobile Battery** | ✅ Minimal | ✅ Minimal | ✅ Low | ✅ Low | ❌ High |
| **Interactivity** | ❌ Static | ⚠️ Limited | ✅ Gestures | ❌ None | ✅ Full 3D |
| **Best For** | Icons | Characters | UI transitions | Loops | 3D scenes |

---

## Real-World Decision Tree

```
Do you need animation?
├─ NO → Use static PNG/SVG
└─ YES → What type?
    ├─ 3D scene? → Three.js
    ├─ Character/mascot animation?
    │   ├─ Simple loop → Lottie
    │   └─ Interactive → Framer Motion + Lottie hybrid
    ├─ UI transition (tabs, modals)?
    │   ├─ Simple fade/slide → CSS
    │   └─ Complex layout/gesture → Framer Motion
    └─ Continuous effect (breathing, pulsing)?
        └─ CSS animation
```

---

## Example: Adding a New Animation

### Scenario: "Add a success checkmark animation when meal is logged"

**Option 1: Lottie (Best Choice)**
1. Go to https://lottiefiles.com/
2. Search "success checkmark"
3. Download free JSON
4. Place in `/public/model/success-checkmark.json`
5. Use `CapyLottie` component:

```tsx
<CapyLottie src="/model/success-checkmark.json" size={80} speed={1.5} />
```

**Option 2: Framer Motion**
```tsx
<motion.div
  initial={{ scale: 0, rotate: -180 }}
  animate={{ scale: 1, rotate: 0 }}
  transition={{ type: "spring", stiffness: 200 }}
>
  <Check className="h-16 w-16 text-green-500" />
</motion.div>
```

**Option 3: CSS**
```css
@keyframes check-pop {
  0% { transform: scale(0) rotate(-180deg); }
  50% { transform: scale(1.2) rotate(10deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.check-pop {
  animation: check-pop 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}
```

**Recommendation:** Use **Lottie** — professional quality, small file size, reusable across projects.

---

## Summary for Your Friend

**TL;DR:**
- **Static images (PNG):** Simplest, use for icons/logos (5-50 KB)
- **Lottie (JSON):** Best for character animations, mascots (20-80 KB)
- **Framer Motion:** Best for UI transitions, tab switches, layout animations (87 KB lib)
- **CSS:** Best for simple loops (breathing, pulsing), zero JS cost
- **Three.js:** Only when you need true 3D (150+ KB lib, GPU-heavy)

**Our project uses all 5** because each solves a different problem. Most projects only need **Lottie + Framer Motion + CSS**.

**Getting Started:**
1. Learn **CSS animations** first (easiest, most common)
2. Add **Framer Motion** for UI transitions (99% of React apps need this)
3. Try **Lottie** for onboarding/mascots (professional polish)
4. Skip Three.js unless you're building a game/3D product viewer

**Free Resources:**
- CSS: https://animista.net/
- Lottie: https://lottiefiles.com/
- Framer Motion: https://www.framer.com/motion/examples/
- Three.js: https://threejs.org/manual/ (if you really need it)

---

**Questions? Ask in:**
- r/reactjs (Framer Motion, general React animations)
- r/webdev (CSS animations, Lottie)
- r/threejs (Three.js only)
- Discord communities (linked in Resources section above)

# Visual Assets Inventory

Quick reference for all visual assets used in SnackOverflow.

## Static Images

### Capybara Mascot Variants
Located in `/public/model/`

| File | Mood | Usage | Size |
|------|------|-------|------|
| `capy-default.png` | Neutral | Default state, fallback | ~15 KB |
| `capy-happy.png` | Happy/Excited/Sleepy | Goal hit, positive messages | ~18 KB |
| `capy-motivated.png` | Motivated | Progress encouragement | ~16 KB |

**Component:** `CapyMascot.tsx`
**State-based switching:** Mood prop determines which PNG loads

---

## Lottie Animations (JSON)

### 1. Fat Capybara (`capy-mascot.json`)
- **Usage:** Home greeting card, streak cards
- **Size:** ~53 KB
- **Loop:** Yes
- **FPS:** 30
- **Duration:** ~3 seconds

**Where used:**
- `HomeView.tsx` — Welcome greeting with fat capy
- `StreakCard` component

### 2. Cute Cat (`cute-cat.json`)
- **Usage:** Progress page header decoration
- **Size:** ~28 KB
- **Loop:** Yes

**Where used:**
- `ProgressView.tsx` — Top of page, next to "Progress" title

### 3. Cute Dog (`cute-dog.json`)
- **Usage:** Fridge scanner card decoration
- **Size:** ~31 KB
- **Loop:** Yes

**Where used:**
- `HomeView.tsx` — "Scan Your Fridge" CTA card

---

## Framer Motion Animations

### Layout Animations
| Component | Animation Type | Trigger |
|-----------|----------------|---------|
| `ModeSwitcher` | layoutId pill | Camera/Describe/Upload toggle |
| `DietaryFilter` | layoutId pill | Filter selection (Veg/Vegan/etc) |
| `BottomTabBar` | Active indicator | Tab change |

### Transition Animations
| Component | Effect | Duration |
|-----------|--------|----------|
| Tab views (Home/Scan/Progress/Profile) | Fade + slide X | 200ms |
| Recipe cards | Staggered fade-up | 80ms per card |
| Dish accordion cards | Height + opacity | 300ms |
| Modal overlays | Fade | 150ms |

### Gesture Animations
| Component | Gesture | Animation |
|-----------|---------|-----------|
| `PullToRefresh` | Touch drag | Dampened pull (log curve) |
| `CapyGarden` | 3D orbit controls | Smooth camera rotation |

---

## CSS Animations

Defined in `src/app/globals.css`

### Continuous Loops
| Class | Keyframes | Used For | Duration |
|-------|-----------|----------|----------|
| `.animate-breathe` | Scale Y 1→1.025→1 | Capy breathing | 3s |
| `.animate-pulse-glow` | Opacity 0.6→1→0.6 | Glow effects | 2s |
| `.animate-scan` | Translate Y -100%→100% | YOLO scan line | 2s |

### One-Time Effects
| Class | Keyframes | Used For | Duration |
|-------|-----------|----------|----------|
| `.animate-fade-in-up` | Opacity + Y translate | Card entrances | 0.3s |
| `.animate-wiggle` | Rotate -4°→4° | Playful emphasis | 0.5s |
| `.animate-bounce-in` | Scale + opacity | Success checkmarks | 0.5s |

### Background Effects
| Animation | Used For | Component |
|-----------|----------|-----------|
| `shimmer` | Gradient sweep | CTA buttons (AI Health Check, Eating Analysis) |
| `pulse-subtle` | Breathing opacity | Notification badges |

---

## Three.js 3D Assets

### Capybara Garden Scene
**Component:** `CapyGarden.tsx` (lazy-loaded)

**3D Models:**
- Trees (3 levels: sapling, small tree, large tree)
- Flowers (bloom based on goal days)
- Butterflies (appear at 5-day streak)
- Rainbow (14-day streak)
- Baby capybaras (7 goal days)
- Cozy home (15 goal days)
- Hot spring steam effect (30-day streak)
- Crown (30 goal days)

**Animations:**
- Flower bloom (petal unfold on mount)
- Butterfly flutter (sine wave flight path)
- Capy idle breathing
- Steam particles (ParticleSystem)
- Camera orbit controls (user-controlled)

**Performance:**
- Target: 30-60 FPS on mobile
- Lazy-loaded (not in initial bundle)
- Pauses when tab not visible

---

## Icon Library

**Primary:** Lucide React (~500 icons, tree-shakeable)

**Common icons used:**
| Icon | Usage |
|------|-------|
| `Camera` | Scan buttons, camera mode |
| `ImageIcon` | Upload photo mode |
| `MessageSquare` | Describe meal mode |
| `Home` | Home tab |
| `TrendingUp` | Progress tab |
| `User` | Profile tab |
| `Sparkles` | AI features, health check |
| `ShieldCheck` | Health ratings |
| `Coffee`, `Sun`, `Sunset`, `Moon` | Meal types |
| `Trash2`, `Edit`, `Check`, `X` | Actions |

**No emoji icons in production** — Lucide icons only (except in user content)

---

## Font Assets

Loaded via `next/font/google` in `layout.tsx`

| Font | Weights | Usage |
|------|---------|-------|
| **DM Sans** | 400-900 | Body text, UI |
| **JetBrains Mono** | 400-700 | Code, numbers, monospace data |

**No custom font files** — all loaded from Google Fonts CDN with `swap` display strategy.

---

## Color Palette Reference

**Theme:** Sage & Cream (warm light design)

| Token | Hex | Usage |
|-------|-----|-------|
| Accent (Sage) | `#6b9e78` | Primary actions, CTA |
| Orange (Amber) | `#d4874d` | Recipes, secondary |
| Background | `#faf6f1` | Page base (cream) |
| Card | `#ffffff` | Card backgrounds |
| Border | `#e8e0d8` | Dividers (taupe) |
| Foreground | `#2d2a26` | Text (charcoal) |
| Muted | `#8a8279` | Secondary text |

**Macro colors:**
- Protein: Green-600
- Carbs: Orange-500
- Fat: Violet-500
- Fiber: Cyan-500

---

## Asset Loading Strategy

### Critical Path (Initial Load)
- DM Sans font (inline CSS)
- No images above-the-fold (text-first)
- Lucide icons (tree-shaken, inline SVG)

### Deferred
- Capybara PNG images (on Home tab mount)
- Lottie JSON files (on view mount + fetch)

### Lazy-Loaded
- `CapyGarden` (Three.js) — only on Capy tab
- ONNX Runtime WASM — only on YOLO mode

### On-Demand
- AI-generated images (dish photos, cached)
- User profile photos (future feature)

---

## File Size Budget

| Asset Type | Target | Actual |
|------------|--------|--------|
| Static PNGs | < 20 KB each | ✅ 15-18 KB |
| Lottie JSON | < 50 KB each | ✅ 28-53 KB |
| Framer Motion lib | < 100 KB | ✅ 87 KB |
| Three.js bundle | < 200 KB | ✅ ~150 KB |
| Total initial bundle | < 300 KB | ✅ ~280 KB |

**Measured with:** `next build` → Check `.next/static/chunks/`

---

## Adding New Assets Checklist

### Static Image
1. Export as PNG (optimize with TinyPNG)
2. Place in `/public/model/`
3. Reference via `/model/filename.png`
4. Add to this inventory doc

### Lottie Animation
1. Download from LottieFiles (free license)
2. Place in `/public/model/`
3. Use `<CapyLottie src="/model/filename.json" size={120} />`
4. Add to this inventory doc

### Framer Motion Animation
1. Import `motion` from `framer-motion`
2. Wrap component in `<motion.div>`
3. Define `initial`, `animate`, `exit` props
4. Wrap parent in `<AnimatePresence>` for exit animations

### CSS Animation
1. Add `@keyframes` to `globals.css`
2. Create utility class (`.animate-*`)
3. Apply class in JSX
4. Add to this inventory doc

### Three.js 3D Model
1. Export as GLTF/GLB from Blender
2. Place in `/public/model/`
3. Load with `useGLTF` from Drei
4. Add to `CapyGarden.tsx` (or new component)
5. Update this inventory doc

---

**Last Updated:** 2026-03-10
**Maintainer:** Project documentation

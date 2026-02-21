# Design System

## Theme — Sage & Cream (Warm Light)

Defined in `src/app/globals.css` using Tailwind CSS 4 `@theme inline` syntax.

### Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--color-background` | `#faf6f1` | Page background (warm cream) |
| `--color-foreground` | `#2d2a26` | Primary text (warm charcoal) |
| `--color-card` | `#ffffff` | Card/section backgrounds |
| `--color-card-hover` | `#f5f0ea` | Hover state for cards |
| `--color-border` | `#e8e0d8` | Borders, dividers (warm taupe) |
| `--color-muted` | `#8a8279` | Secondary text |
| `--color-muted-light` | `#b5ada5` | Tertiary/hint text |
| `--color-accent` | `#6b9e78` | Primary accent (sage green) — buttons, badges, active states |
| `--color-accent-dim` | `#5a8a66` | Darker accent for hover |
| `--color-accent-light` | `#eef4ef` | Light accent background |
| `--color-orange` | `#d4874d` | Secondary accent — recipes, tips, shopping (warm amber) |
| `--color-orange-dim` | `#c07840` | Darker orange for hover |
| `--color-orange-light` | `#fdf3eb` | Light orange background |

### Fonts
- `--font-sans`: Geist Sans (via `next/font/google`)
- `--font-mono`: Geist Mono (via `next/font/google`)

### Semantic Color Usage
- **Sage green** (`accent`): Camera controls, detected items, "you have" ingredients, active filters, primary buttons, bottom nav active state
- **Warm amber** (`orange`): Recipes, cooking tips, shopping list, "also need" ingredients, Hindi section labels
- **Red**: Expired items, stop button, error states
- **Yellow**: Expiring items, medium confidence, medium difficulty
- **Purple**: Jain diet badge, read aloud button
- **Green-400**: WhatsApp buttons, fresh items

### Text Color Hierarchy
Text uses semantic tokens (no opacity variants):
- `text-foreground` — primary text (headings, body)
- `text-muted` — secondary text (labels, descriptions)
- `text-muted-light` — tertiary text (hints, placeholders)
- `text-accent` — accent-colored text (active states, links)
- `text-orange` — secondary accent text

## Custom Animations

Defined in `globals.css`:

| Class | Animation | Usage |
|---|---|---|
| `.animate-fade-in-up` | Fade in + translate up 8px, 0.3s | General entrance |
| `.animate-scan` | Translate Y -100% → 100%, 2s infinite | YOLO scan line |
| `.animate-pulse-glow` | Opacity 0.6 → 1 → 0.6, 2s infinite | Glow effects |
| `.animate-capy-blink` | Scale Y 1→0.1→1, 0.2s | Capy eye blink |
| `.animate-capy-breathe` | Scale 1→1.02→1, 3s infinite | Capy body breathing |
| `.animate-capy-tail` | Rotate -5°→5°, 2s infinite | Capy tail wag |
| `.animate-capy-float` | Translate Y 0→-3px→0, 4s infinite | Capy floating |
| `.animate-capy-sleep` | Opacity + translate Y cycle, 2s infinite | Capy sleep z-z-z |

### Framer Motion Patterns
- **layoutId animations**: Used for mode switcher pill (`mode-bg`) and diet filter pill (`diet-pill`) — spring transitions
- **Staggered cards**: Recipe cards use `delay: index * 0.08` for sequential entrance
- **AnimatePresence**: Used for all conditional renders (dropdowns, expandable sections, overlays, tab transitions)
- **popLayout mode**: Used for detected item chips (smooth removal)
- **Tab transitions**: `AnimatePresence` with x-axis slide for view switching

## Component Patterns

### Cards
```
rounded-2xl bg-card border border-border overflow-hidden
```

### Buttons (Primary)
```
rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white
hover:bg-accent-dim active:scale-95
```

### Buttons (Ghost/Secondary)
```
rounded-full bg-card-hover border border-border p-2.5
hover:bg-border active:scale-95
```

### Badges/Pills
```
rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1 text-[10px] font-medium text-accent
```

### Section Headers
```
flex items-center gap-2 px-1
<Icon className="h-4 w-4 text-accent" />
<h2 className="text-sm font-semibold">Title</h2>
```

### Collapsible Sections
Pattern: button header with ChevronDown/Up → AnimatePresence → motion.div with height animation

### Text Sizes
- `text-base` — recipe names
- `text-sm` — section titles, body text
- `text-xs` — descriptions, labels, button text
- `text-[10px]` — micro labels, hints, badges
- `text-[10px]` with `uppercase tracking-wider` — section divider labels

## Global Styles
```css
* { -webkit-tap-highlight-color: transparent; }  /* No tap flash on mobile */
body { overscroll-behavior: none; }               /* No pull-to-refresh */
.scrollbar-hide { scrollbar-width: none; }        /* Hidden scrollbars */
```

## Goal Setting UI Patterns

### Onboarding Overlay
```
fixed inset-0 z-[100] bg-background/98 backdrop-blur-xl
```
- Locks body scroll via `document.body.style.overflow = "hidden"`
- Full-screen overlay with progress dots at top
- Step content scrollable, nav buttons pinned at bottom

### Goal Option Cards
```
w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left
Selected: border-accent/40 bg-accent-light text-accent-dim
Unselected: border-border bg-card hover:bg-card-hover
```
- Each option: emoji + label + description + detail line
- Checkmark on selected option

### Range Slider (Age)
```
w-full h-2 rounded-full appearance-none bg-border cursor-pointer accent-accent
```
- Label + value display on same row above slider
- Min/max labels below

### Input Fields (Height/Weight)
- Free-type with `onBlur` validation (no aggressive onChange clamping)
- `inputMode="numeric"` for mobile keyboard
- Unit toggle buttons (cm/ft, kg/lbs)

### Progress Bars (GoalDashboard)
```
h-2.5 rounded-full bg-border (track)
h-2.5 rounded-full bg-accent (fill, width via style)
```
- Calorie bar: accent color, shows percentage + remaining
- Macro bars: accent (protein), yellow-400 (carbs), red-400 (fat)

### Capy Speech Bubble
```
rounded-xl bg-accent-light border border-accent/15 px-3 py-2
```
- Positioned next to CapyMascot SVG
- Context-aware text from `capyLines.ts`

## Navigation

### Bottom Tab Bar (4 tabs)
```
fixed bottom-0 w-full bg-card/80 backdrop-blur-xl border-t border-border
```
- **Home** — house icon, dashboard view
- **Progress** — bar chart icon, nutrition tracking
- **Scan** — center elevated FAB (camera icon, accent background, -12px offset)
- **Profile** — user icon, settings & goals

### Fridge Overlay
- Triggered from Home "Scan Your Fridge" CTA
- Full-screen overlay with close button
- Contains the full fridge scanner flow (mode switcher, camera, recipes, etc.)

## Layout
- Max width: `max-w-lg` (32rem / 512px) — centered on larger screens
- Padding: `px-4 py-4 pb-24` (extra bottom padding for tab bar)
- No sticky header — clean edge-to-edge content
- All spacing between sections: `space-y-4`
- Tab bar height: ~64px with safe area padding

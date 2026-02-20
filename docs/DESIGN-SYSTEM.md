# Design System

## Theme — Dark Only

Defined in `src/app/globals.css` using Tailwind CSS 4 `@theme inline` syntax.

### Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--color-background` | `#0a0a0a` | Page background |
| `--color-foreground` | `#f5f5f5` | Primary text |
| `--color-surface` | `#141414` | Card/section backgrounds |
| `--color-surface-hover` | `#1e1e1e` | Hover state for surfaces |
| `--color-border` | `#262626` | Borders, dividers |
| `--color-accent` | `#22c55e` | Primary accent (green) — buttons, badges, active states |
| `--color-accent-dim` | `#16a34a` | Darker accent for hover |
| `--color-accent-glow` | `rgba(34, 197, 94, 0.15)` | Glow effect behind accent elements |
| `--color-orange` | `#f97316` | Secondary accent — recipes, tips, shopping |
| `--color-orange-dim` | `#ea580c` | Darker orange for hover |
| `--color-orange-glow` | `rgba(249, 115, 22, 0.15)` | Glow effect behind orange elements |

### Fonts
- `--font-sans`: Geist Sans (via `next/font/google`)
- `--font-mono`: Geist Mono (via `next/font/google`)

### Semantic Color Usage
- **Green accent** (`accent`): Camera controls, detected items, "you have" ingredients, active filters, primary buttons
- **Orange** (`orange`): Recipes, cooking tips, shopping list, "also need" ingredients, Hindi section labels
- **Red**: Expired items, stop button, error states
- **Yellow**: Expiring items, medium confidence, medium difficulty
- **Purple**: Jain diet badge, read aloud button
- **Green-400**: WhatsApp buttons, fresh items

### Opacity Patterns
Text uses opacity variants of foreground:
- `text-foreground` — full brightness (headings)
- `text-foreground/80` — primary body text
- `text-foreground/50` — secondary text
- `text-foreground/40` — tertiary/muted text
- `text-foreground/30` — labels, hints
- `text-foreground/25` — very subtle hints
- `text-foreground/20` — footer text

## Custom Animations

Defined in `globals.css`:

| Class | Animation | Usage |
|---|---|---|
| `.animate-fade-in-up` | Fade in + translate up 8px, 0.3s | General entrance |
| `.animate-scan` | Translate Y -100% → 100%, 2s infinite | YOLO scan line |
| `.animate-pulse-glow` | Opacity 0.6 → 1 → 0.6, 2s infinite | Glow effects |

### Framer Motion Patterns
- **layoutId animations**: Used for mode switcher pill (`mode-bg`) and diet filter pill (`diet-pill`) — spring transitions
- **Staggered cards**: Recipe cards use `delay: index * 0.08` for sequential entrance
- **AnimatePresence**: Used for all conditional renders (dropdowns, expandable sections, overlays)
- **popLayout mode**: Used for detected item chips (smooth removal)

## Component Patterns

### Cards
```
rounded-2xl bg-surface border border-border overflow-hidden
```

### Buttons (Primary)
```
rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-black
hover:bg-accent-dim active:scale-95
```

### Buttons (Ghost/Secondary)
```
rounded-full bg-surface-hover border border-border p-2.5
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

## Layout
- Max width: `max-w-lg` (32rem / 512px) — centered on larger screens
- Padding: `px-4 py-4 pb-20`
- Header: sticky top, backdrop blur, border bottom
- All spacing between sections: `space-y-4`

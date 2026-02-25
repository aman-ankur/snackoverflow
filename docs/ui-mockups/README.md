# Alternative Dish Selection UI Mockups

This directory contains 3 different UI approaches for the alternative dish selection feature. Open these HTML files in your browser to see interactive demos.

---

## Option 1: Card-Based Selection
**File:** `option1-cards.html`

### Design
- Vertical stack of full-width cards
- Each card shows complete nutrition info + reasoning
- Checkmark appears on selected card
- Hover effects with shadow + slight lift
- Selected state: green gradient background + border

### Pros
✅ **Scannable** — All info visible at once, easy to compare
✅ **Familiar** — Standard card selection pattern
✅ **Mobile-friendly** — Large tap targets
✅ **Clear hierarchy** — Visual separation between options
✅ **Accessible** — Works without JS, clear focus states

### Cons
❌ **Vertical space** — Takes ~450px height for 3 options
❌ **Redundancy** — Nutrition labels repeated 3 times
❌ **Less elegant** — More utilitarian than delightful

### Best For
- Users who want to compare all details side-by-side
- Longer dish names (no truncation needed)
- Accessibility-first approach

---

## Option 2: Segmented Control + Expansion
**File:** `option2-segmented.html`

### Design
- iOS-style segmented control at top (compact)
- Single expanded detail panel below
- Smooth content transitions when switching
- Tab names truncate if too long
- Active tab: white background with shadow

### Pros
✅ **Compact** — Only ~200px height total
✅ **Elegant** — Modern iOS-style interaction
✅ **Focus** — Shows one option at a time, reduces cognitive load
✅ **Smooth animations** — Polished tab switching
✅ **Efficient** — Nutrition labels shown once

### Cons
❌ **Sequential comparison** — Can't see all options simultaneously
❌ **Tab truncation** — Long dish names get cut off
❌ **Less discoverable** — Users might not realize it's switchable
❌ **Touch precision** — Small tap targets (especially on 3-way split)

### Best For
- Users comfortable with tabbed interfaces
- When vertical space is limited
- Modern, minimalist aesthetic

---

## Option 3: Swipeable Carousel
**File:** `option3-carousel.html`

### Design
- Horizontal carousel with one card visible
- Swipe gestures + arrow navigation
- Pagination dots at bottom
- Full nutrition grid per slide
- Touch-optimized with momentum scrolling

### Pros
✅ **Delightful** — Swipe interaction feels native on mobile
✅ **Full detail** — Each option gets maximum screen space
✅ **Visual hierarchy** — Clear single-option focus
✅ **Engaging** — Encourages exploration through swiping
✅ **Progressive** — Works with touch or arrows

### Cons
❌ **Hidden options** — Users must swipe to discover alternatives
❌ **Extra interaction** — Requires gesture vs simple tap
❌ **Disorienting** — Can lose context when swiping
❌ **Accessibility** — Swipe gestures not keyboard-friendly without work

### Best For
- Mobile-first users who swipe naturally
- Creating engaging, app-like experience
- When you want interaction to feel playful

---

## Recommendation

### For SnackOverflow: **Option 1 (Card-Based)** ✨

**Why?**

1. **Aligns with existing design** — ScanView already uses accordion cards; this is consistent
2. **Nutrition comparison is key** — Users want to see calorie differences at a glance (80 cal vs 5 cal is a big decision!)
3. **Mobile context** — Users are analyzing food quickly; no time for swipe exploration
4. **Accessibility** — Works perfectly with existing tap-to-expand pattern
5. **Sage & Cream theme** — Green gradient + checkmark fits accent color system

**How to improve Option 1:**
- Add subtle slide-in animation (already implemented in current PR)
- Show calorie delta from primary dish ("75 cal less" badge)
- Highlight changed values when switching (brief yellow flash)
- Add "Tap to select" hint on first use

### When to consider alternatives:

- **Option 2** if you later add more than 3 alternatives (tabs scale better)
- **Option 3** if you build a native app (swipe feels native there)

---

## Try Them Out

```bash
# Open in browser
open docs/ui-mockups/option1-cards.html
open docs/ui-mockups/option2-segmented.html
open docs/ui-mockups/option3-carousel.html
```

All mockups are:
- ✅ Fully interactive (no build step needed)
- ✅ Mobile responsive
- ✅ Use SnackOverflow's Sage & Cream color palette
- ✅ Match existing typography (DM Sans system stack)
- ✅ Include real nutrition data from mock

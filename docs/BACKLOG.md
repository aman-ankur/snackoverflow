# Backlog — Future Features

## Priority: High (Next Up)

### Dish Scanner & Calorie Tracker
See [PRD-DISH-SCANNER.md](./PRD-DISH-SCANNER.md) for full spec.
- Bottom tab bar (Fridge / Dish)
- Point camera at dish → instant calorie/macro breakdown
- Meal logging, daily summary, history
- Cross-tab intelligence (fridge ↔ dish linking)

---

## Priority: Medium

### Low Stock Reminders
- Notify when items are finishing or expired
- In-app alerts (banner or badge)
- Optional push notifications (requires service worker)
- Trigger: expiry tracker detects items in "expiring" or "expired" state

### "What Else Should I Buy" — AI Suggestions
- AI-powered suggestions based on what's in the fridge
- Complementary items (e.g., "you have paneer but no cream")
- Staples running low (e.g., "no onions detected in 3 scans")
- Could use Groq/Gemini with fridge history context

### Health Categorization
- Categorize detected items as healthy/unhealthy
- Show macros per item (protein, carbs, fat, calories)
- Nutrition data per ingredient
- Color-coded health scores
- Partially addressed by upcoming Dish Scanner feature

---

## Priority: Low

### Item Ordering
- Section to order items that are finishing
- Integration with grocery delivery APIs (BigBasket, Blinkit, Zepto)
- Or simple "copy list to clipboard" for manual ordering

### Barcode Scanner
- Scan packaged food barcodes for exact nutrition data
- Use Open Food Facts API or similar
- Complement the AI-based dish scanning

### ~~Goal Setting~~ ✅ SHIPPED (feat/goal-setting-capy)
- ~~Daily calorie/protein targets~~
- ~~Progress tracking against goals~~
- ~~Weekly/monthly trends~~
- See implementation: TDEE calculator, Capy mascot onboarding, GoalDashboard

### Share Daily Log
- Share day's meal log as formatted text/image
- WhatsApp, Instagram Stories format

### Multi-Language Support
- Currently: English UI + Hindi cook messages
- Future: Tamil, Telugu, Bengali, Marathi UI options
- Sarvam AI already supports 11 Indian languages for TTS

### Offline Mode Improvements
- Cache last scan results
- Service worker for offline access
- Sync when back online

### Recipe Favorites
- Save favorite recipes across sessions
- Quick re-access without re-scanning
- "Cook again" button

# Current Features

## 1. Fridge Scanner (Cloud AI Mode)
- Point camera at fridge → AI identifies all food items
- Each item shows: English name, Hindi name, quantity, confidence level (high/medium/low)
- Items accumulate across multiple scans (deduplication by name, keeps highest confidence)
- User can remove incorrect items with X button
- Camera uses 65vh height when streaming (near full-screen on mobile)
- Auto-scan mode: analyzes every 4 seconds automatically
- Flip camera button (front/rear)

## 2. AI Recipe Suggestions
- Exactly **5 Indian lunch/dinner recipes** per scan
- Recipes use detected ingredients, suggest common pantry staples as "also needed"
- Each recipe card shows: name (English + Hindi), cook time, difficulty, diet badge, description
- Expandable steps section
- Tags: vegetarian, north-indian, south-indian, etc.

## 3. Dietary Filters
- Filter pills at top: All, Veg, Vegan, Egg, Jain
- Selected pill has solid green accent background
- Filter is passed to AI prompt — recipes respect the constraint
- Jain = no onion, garlic, root vegetables

## 4. Send to Cook (ShareRecipe)
- "Send to Cook" button on each recipe card
- Dropdown with serving size picker (1-4 people)
- **Hindi section** (top):
  - 🎤 Hindi Audio Message — Groq generates casual Hindi text → Sarvam AI TTS converts to MP3 → share via WhatsApp
  - 💬 Hindi Text on WhatsApp — AI-generated short Hindi message sent as WhatsApp text
- **English section** (bottom):
  - WhatsApp (English recipe details)
  - Read Aloud (browser SpeechSynthesis, en-IN)
  - Share via... (Web Share API)
  - Copy Text (clipboard)
- Hindi messages are casual: "भैया, आज 2 लोगों के लिए पनीर मटर बना दीजिए। सब सामान फ्रिज में है।"
- Serving count changes regenerate the Hindi text (cache invalidated)

## 5. Freshness / Expiry Tracker
- Auto-adds detected items with estimated shelf life (e.g., milk=3d, paneer=5d, onion=14d)
- Color-coded: 🟢 Fresh, 🟡 Expiring (≤2 days), 🔴 Expired
- Tap date to manually edit expiry
- Persisted in localStorage (`fridgenius-expiry-tracker`)
- Collapsible section, shows warning count badge

## 6. Shopping List
- Auto-generated from recipe `ingredients_needed` minus detected items
- Shows which recipe each item is needed for
- Copy to clipboard button
- Collapsible section

## 7. Meal Planner
- Weekly grid (Mon-Sun)
- Add recipes from suggestions to specific days
- Remove meals, clear day
- Copy day's meal plan to clipboard
- Persisted in localStorage (`fridgenius-meal-plan`)
- Collapsible section

## 8. YOLO On-Device Mode
- YOLOv8n running via ONNX Runtime Web (WASM)
- Real-time bounding boxes on camera feed (5-15 FPS)
- 80 COCO object classes (limited for food)
- Matches detected items to static recipe database
- Fully offline — no API calls
- Experimental/demo mode — Cloud AI is the primary mode

## 9. Multi-Provider AI Fallback
- Fridge analysis: Gemini 2.0 Flash → Gemini 2.0 Flash Lite → Groq Llama 4 Scout
- If all rate-limited, shows friendly "wait 30s" message and stops auto-scan
- Hindi text: Groq only (free, fast)
- Hindi TTS: Sarvam AI only (native Hindi voice)

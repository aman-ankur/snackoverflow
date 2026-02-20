# Fridgenius — Smart Kitchen Assistant

**Fridgenius** is a mobile-first PWA that uses AI vision to scan your fridge, identify ingredients, and suggest Indian recipes. It also lets you send cooking instructions to your cook in Hindi (audio or text) via WhatsApp.

**Live**: Deployed on Vercel  
**Repo**: [github.com/aman-ankur/fridgenius](https://github.com/aman-ankur/fridgenius)

---

## Quick Start

```bash
# Install dependencies
npm install

# Add API keys
cp .env.example .env.local
# Edit .env.local with your actual keys

# Run dev server
npm run dev
# → http://localhost:3000

# For mobile testing (HTTPS required for camera):
npx local-ssl-proxy --source 3443 --target 3000 --cert certs/local.pem --key certs/local-key.pem
# → https://<your-ip>:3443
```

## What It Does

1. **Scan your fridge** — Point phone camera at fridge contents
2. **AI identifies items** — Gemini/Groq vision detects ingredients (with Hindi names)
3. **Get 5 recipe suggestions** — Indian lunch/dinner recipes using detected items
4. **Send to cook** — Hindi audio message (Sarvam AI TTS) or Hindi text (Groq) via WhatsApp
5. **Track freshness** — Auto-estimated expiry dates for detected items
6. **Shopping list** — Auto-generated list of missing ingredients
7. **Meal planner** — Weekly meal planning with drag-and-drop recipes
8. **Dietary filters** — Veg, Vegan, Eggetarian, Jain

## Key Design Decisions

- **Mobile-first**: Designed for phone use. Camera view takes 65vh when streaming.
- **Dark theme only**: Dark background (#0a0a0a) with green accent (#22c55e).
- **Indian food focus**: All recipes, names, and voice are Hindi/Indian.
- **Multi-provider AI**: Gemini primary → Groq fallback. Never depends on a single provider.
- **No auth, no database**: All state is localStorage. No user accounts. Privacy-first.
- **Hindi cook communication**: Cooks in Indian households often speak Hindi. Audio messages use natural Hindi voice (Sarvam AI Bulbul v3, "kabir" male speaker).

# Send to Cook — Hindi Audio & Text Flow

## Overview

Indian household cooks typically speak Hindi and may not read English. Fridgenius generates casual Hindi messages (text and audio) that users can send to their cook via WhatsApp.

## Flow Diagram

```
User taps "Send to Cook" on recipe card
  → Dropdown opens with serving picker (1-4 people)
  → User picks option:

Option A: Hindi Audio Message
  1. POST /api/hindi-message { recipeName, recipeHindi, ingredientsUsed, servings }
     → Groq generates casual Hindi text (free)
  2. POST /api/hindi-tts { text }
     → Sarvam AI Bulbul v3 converts to MP3 (₹0.15/msg)
  3. Web Share API → user picks WhatsApp → sends audio file
     Fallback: play audio in browser + download MP3

Option B: Hindi Text on WhatsApp
  1. POST /api/hindi-message (same as above)
  2. window.open(`https://wa.me/?text=${encodedHindiText}`)
     → Opens WhatsApp with pre-filled Hindi message

Option C: English WhatsApp
  → Pre-formatted English recipe text via wa.me link

Option D: Read Aloud
  → Browser SpeechSynthesis API (en-IN voice)

Option E: Share via...
  → Web Share API (any app)

Option F: Copy Text
  → Clipboard API with textarea fallback
```

## Hindi Message Style

The AI generates messages like a family member talking to their cook:
- **Casual, polite Hindi** in Devanagari script
- Uses "bhaiya" (respectful term)
- Mentions dish name + serving count + ingredients in fridge
- NO recipe steps — the cook knows how to cook
- 2-3 sentences max

### Examples
- For 2 people: "भैया, आज लंच में 2 लोगों के लिए पनीर मटर बना दीजिए। पनीर, मटर, टमाटर सब फ्रिज में है।"
- For 1 person: "भैया, आज एक प्लेट दाल तड़का बना दीजिए। दाल और टमाटर फ्रिज में है।"

## Sarvam AI TTS Details

| Parameter | Value |
|---|---|
| Model | `bulbul:v3` |
| Speaker | `kabir` (male, North Indian) |
| Language | `hi-IN` |
| Pace | 1.0 |
| Format | MP3 |
| Sample Rate | 24000 Hz |
| Endpoint | `https://api.sarvam.ai/text-to-speech` |
| Auth | `api-subscription-key` header |

### Available Speakers (30+)
Male: Shubh (default), Aditya, Rahul, Amit, Dev, Kabir, Varun, Rohan, Manan, Sumit, Ashutosh, Advait, Tarun, Sunny, Vijay, Mohit, Rehan, Soham  
Female: Ritu, Priya, Neha, Pooja, Simran, Kavya, Ishita, Shreya, Roopa, Tanya, Amelia, Sophia, Shruti, Suhani, Kavitha, Rupali

### Important Notes
- Bulbul v3 does **NOT** support `pitch` or `loudness` parameters (returns 400)
- Response format: `{ audios: ["<base64-encoded-audio>"] }`
- Cost: ₹15/10K characters. ₹1000 free credits on signup (~600+ messages)

## Serving Size Picker

- Options: 1🧑, 2🧑, 3🧑, 4🧑
- Default: 2
- Changing servings clears cached Hindi text (forces regeneration)
- Stored in component state (not persisted)

## Caching Behavior

- Hindi text is cached per recipe + serving count in component state (`hindiText`)
- If user changes servings, cache is invalidated
- Audio is NOT cached — generated fresh each time (different TTS calls may produce slightly different audio)
- Cache is lost when dropdown closes and reopens (component state)

## Error Handling

- If Groq fails: Hindi text generation silently fails, buttons show loading then stop
- If Sarvam fails: Console error logged, audio loading stops
- If Web Share API not available: Falls back to playing audio in browser + downloading MP3 file
- If clipboard API fails: Falls back to textarea + execCommand("copy")

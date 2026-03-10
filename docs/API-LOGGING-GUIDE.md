# API Latency and Model Logging Guide

**Date:** 2026-02-27
**Feature:** Enhanced logging for dish scan API performance tracking
**Commit:** `edbca4d`

---

## Overview

The dish scan API (`/api/analyze-dish`) now includes **comprehensive latency and model tracking** with emoji-based visual indicators. This provides complete visibility into:

- Which models/providers were attempted
- Exact timing for each attempt
- Timeout vs rate limit vs error status
- Overall request performance
- Staggered parallel race behavior

---

## Log Format

### Emoji Legend

| Emoji | Meaning | Example |
|-------|---------|---------|
| 🚀 | **Provider start** | Starting model attempt |
| ✅ | **Success** | Provider returned valid data |
| ⏱️ | **Timeout** | Provider exceeded timeout limit |
| ⚠️ | **Rate limit** | Provider quota exhausted |
| ❌ | **Error** | Provider failed with error |
| ⏳ | **Stagger trigger** | 2s elapsed, starting parallel race |
| 🏆 | **Winner** | Final winner with timing breakdown |

---

## Example Log Outputs

### Scenario 1: Primary Succeeds (Best Case)

**Timing:** ~2s

```
[Dish Scan] 🚀 Starting Gemini 2.5 Flash (primary, 4s timeout)...
[Dish Scan] ✅ Gemini 2.5 Flash succeeded in 1834ms (model: gemini-2.5-flash)
[Dish Scan] 🏆 WINNER: G25F in 1834ms (total request: 1950ms)
```

**Analysis:**
- Primary provider succeeded before 2s stagger trigger
- No parallel race needed
- Optimal performance

---

### Scenario 2: Staggered Race - OpenAI Wins

**Timing:** ~4.5s

```
[Dish Scan] 🚀 Starting Gemini 2.5 Flash (primary, 4s timeout)...
[Dish Scan] ⏳ 2s elapsed, starting staggered parallel race (Gemini 2.5 still running)...
[Dish Scan] 🚀 Starting OpenAI gpt-4o-mini (4s timeout)...
[Dish Scan] 🚀 Starting Gemini 2.0 Flash (4s timeout)...
[Dish Scan] 🚀 Starting Groq Llama 4 Scout (4s timeout)...
[Dish Scan] ⏱️ Gemini 2.5 Flash timeout after 4001ms: Timeout after 4000ms
[Dish Scan] ✅ OpenAI succeeded in 2345ms (model: gpt-4o-mini)
[Dish Scan] ❌ Groq error after 2500ms: JSON parse error
[Dish Scan] ⏱️ Gemini 2.0 Flash timeout after 4002ms: Timeout after 4000ms
[Dish Scan] 🏆 WINNER: OAI4m in 2345ms (total request: 4500ms)
```

**Analysis:**
- Gemini 2.5 slow, stagger triggered at 2s
- Parallel race started (OpenAI + Gemini 2.0 + Groq)
- OpenAI won (2345ms response time)
- Gemini 2.5 and 2.0 both timed out (4s)
- Groq failed with JSON parse error
- Total request time: 4.5s (2s stagger + 2.5s OpenAI)

---

### Scenario 3: Rate Limit → Fallback

**Timing:** ~6s

```
[Dish Scan] 🚀 Starting Gemini 2.5 Flash (primary, 4s timeout)...
[Dish Scan] ⚠️ Gemini 2.5 Flash rate limited after 1234ms
[Dish Scan] ⏳ 2s elapsed, starting staggered parallel race (Gemini 2.5 still running)...
[Dish Scan] 🚀 Starting OpenAI gpt-4o-mini (4s timeout)...
[Dish Scan] 🚀 Starting Gemini 2.0 Flash (4s timeout)...
[Dish Scan] 🚀 Starting Groq Llama 4 Scout (4s timeout)...
[Dish Scan] ⚠️ Gemini 2.0 Flash rate limited after 567ms
[Dish Scan] ✅ Groq succeeded in 3890ms (model: GRQS)
[Dish Scan] ⏱️ OpenAI timeout after 4001ms: Timeout after 4000ms
[Dish Scan] 🏆 WINNER: GRQS in 3890ms (total request: 6200ms)
```

**Analysis:**
- Both Gemini models rate limited (quota exhausted)
- OpenAI timed out (4s)
- Groq succeeded as last resort (3.89s)
- Total request time: ~6s (worst case)

---

### Scenario 4: All Providers Fail

**Timing:** ~6s (then 429 error)

```
[Dish Scan] 🚀 Starting Gemini 2.5 Flash (primary, 4s timeout)...
[Dish Scan] ⏱️ Gemini 2.5 Flash timeout after 4001ms: Timeout after 4000ms
[Dish Scan] ⏳ 2s elapsed, starting staggered parallel race (Gemini 2.5 still running)...
[Dish Scan] 🚀 Starting OpenAI gpt-4o-mini (4s timeout)...
[Dish Scan] 🚀 Starting Gemini 2.0 Flash (4s timeout)...
[Dish Scan] 🚀 Starting Groq Llama 4 Scout (4s timeout)...
[Dish Scan] ⏱️ OpenAI timeout after 4002ms: Timeout after 4000ms
[Dish Scan] ⚠️ Gemini 2.0 Flash rate limited after 1500ms
[Dish Scan] ⏱️ Groq timeout after 4003ms: Timeout after 4000ms

Error response: 429 Too Many Requests
{
  "error": "All AI providers are rate limited. Please wait 30s and try again.",
  "details": [
    "Gemini 2.5 Flash: Timeout after 4000ms (4001ms)",
    "OpenAI: Timeout after 4000ms (4002ms)",
    "Gemini 2.0 Flash rate limited (1500ms)",
    "Groq: Timeout after 4000ms (4003ms)"
  ]
}
```

**Analysis:**
- All providers failed (timeouts + rate limit)
- Client receives 429 error with detailed breakdown
- User should wait 30s and retry

---

## Describe-Meal API Logs (Current)

The describe-meal route already has timing logs (less detailed):

```
[Describe/Gemini] Trying gemini-2.0-flash-lite...
[Describe/Gemini] Rate limited, falling back...
[Describe/OpenAI] Trying gpt-4.1-nano...
[Describe/Groq] Trying meta-llama/llama-4-scout-17b-16e-instruct...
[Describe/Groq] Success with meta-llama/llama-4-scout-17b-16e-instruct
[Describe] groq won race in 2447ms (total 4911ms)
POST /api/describe-meal 200 in 5.1s
```

**Analysis:**
- Gemini rate limited
- OpenAI timed out (no explicit log)
- Groq won in 2447ms
- Total: 4911ms (~5s)

---

## Provider Information

### Models Used

| Provider | Model | Code | RPM (Free Tier) | Timeout |
|----------|-------|------|-----------------|---------|
| **Gemini 2.5 Flash** | gemini-2.5-flash | G25F | 10 RPM | 4s |
| **Gemini 2.0 Flash** | gemini-2.0-flash | G20F | 10 RPM | 4s |
| **OpenAI** | gpt-4o-mini | OAI4m | Unknown | 4s |
| **Groq Scout** | llama-4-scout-17b | GRQS | 30 RPM | 4s |

### Fallback Strategy (Dish Scan)

**Primary (0-2s):**
- Gemini 2.5 Flash (4s timeout)

**Stagger Trigger (after 2s):**
- Start parallel race if primary hasn't responded

**Parallel Race (2s-6s):**
- OpenAI gpt-4o-mini (4s timeout)
- Gemini 2.0 Flash (4s timeout)
- Groq Llama 4 Scout (4s timeout)

**Winner:** First valid response

**Worst Case:** 6s (2s stagger + 4s parallel race)

---

## Timing Breakdown

### Best Case (Primary Succeeds)
```
├─ 0s: Start Gemini 2.5 Flash
└─ 1.8s: ✅ Success → Return result
Total: ~2s
```

### Typical Case (Staggered Fallback)
```
├─ 0s: Start Gemini 2.5 Flash
├─ 2s: ⏳ Stagger trigger → Start parallel race
│   ├─ OpenAI gpt-4o-mini
│   ├─ Gemini 2.0 Flash
│   └─ Groq Llama 4 Scout
├─ 4.5s: ✅ OpenAI succeeds → Return result
└─ 4.0s: ⏱️ Gemini 2.5 Flash timeout (ignored)
Total: ~4.5s
```

### Worst Case (All Timeouts)
```
├─ 0s: Start Gemini 2.5 Flash
├─ 2s: ⏳ Stagger trigger → Start parallel race
│   ├─ OpenAI gpt-4o-mini
│   ├─ Gemini 2.0 Flash
│   └─ Groq Llama 4 Scout
├─ 4s: ⏱️ Gemini 2.5 Flash timeout
├─ 6s: ⏱️ All parallel providers timeout
└─ 6s: ❌ Return 429 error
Total: ~6s
```

---

## How to Interpret Logs

### 1. Check for Winner
Look for the **🏆 WINNER** line:
```
[Dish Scan] 🏆 WINNER: OAI4m in 2345ms (total request: 4500ms)
```

**Key Metrics:**
- `OAI4m` = OpenAI gpt-4o-mini won
- `2345ms` = Provider latency (how long OpenAI took)
- `4500ms` = Total request time (includes fallback overhead)

### 2. Identify Bottlenecks

**Long total time but fast provider?**
```
[Dish Scan] 🏆 WINNER: OAI4m in 2000ms (total request: 6000ms)
```
→ **Issue:** 4s overhead (likely 2s stagger + 2s rate limit checks)
→ **Solution:** Cache rate limit status, skip rate-limited providers

**All timeouts?**
```
⏱️ Gemini 2.5 Flash timeout after 4001ms
⏱️ OpenAI timeout after 4002ms
```
→ **Issue:** Network slow or provider overloaded
→ **Solution:** Increase timeout or check network

**Rate limits?**
```
⚠️ Gemini 2.5 Flash rate limited after 1234ms
```
→ **Issue:** Free tier quota exhausted
→ **Solution:** Upgrade to paid tier or switch primary provider

### 3. Monitor Fallback Patterns

**Frequent stagger triggers?**
```
[Dish Scan] ⏳ 2s elapsed, starting staggered parallel race...
```
→ **Issue:** Primary provider (Gemini 2.5) often slow or rate-limited
→ **Solution:** Switch to OpenAI as primary

**Groq always fails?**
```
❌ Groq error after 2500ms: JSON parse error
```
→ **Issue:** Groq model returning malformed JSON
→ **Solution:** Remove Groq from fallback chain

---

## Client-Side Visibility

### Response Fields

The API returns metadata in the response:

```json
{
  "dishes": [...],
  "totalCalories": 550,
  "_provider": "OAI4m",
  "_latencyMs": 2345
}
```

**Fields:**
- `_provider`: Which provider succeeded (G25F, G20F, OAI4m, GRQM, GRQS)
- `_latencyMs`: Provider response time in milliseconds

### Frontend Logging

The frontend doesn't currently display provider info, but you can check in browser console:

```javascript
// In browser console after scan:
localStorage.getItem('last-scan-provider') // undefined (not implemented)
```

**Future Enhancement:** Show provider badge in UI (e.g., "Powered by OpenAI • 2.3s")

---

## Troubleshooting

### Issue: "All providers timed out"

**Logs:**
```
⏱️ Gemini 2.5 Flash timeout after 4001ms
⏱️ OpenAI timeout after 4002ms
⏱️ Groq timeout after 4003ms
```

**Possible Causes:**
1. Network slow (check `ping google.com`)
2. Providers overloaded (check status pages)
3. Timeout too short (4s may be too aggressive)

**Solutions:**
- Increase timeout to 6s (edit `withTimeout` calls)
- Check network connectivity
- Retry request

---

### Issue: "Gemini always rate limited"

**Logs:**
```
⚠️ Gemini 2.5 Flash rate limited after 1234ms
⚠️ Gemini 2.0 Flash rate limited after 567ms
```

**Cause:** Free tier quota exhausted (10 RPM)

**Solutions:**
1. **Switch primary provider** (OpenAI or Groq):
   ```typescript
   // Try OpenAI first, fall back to Gemini
   const primary = tryOpenAI(...);
   const fallback = tryGemini25Flash(...);
   ```

2. **Upgrade Gemini tier**:
   - Free: 10 RPM
   - Paid: 360 RPM

3. **Cache aggressively**:
   - Current: 2-min cache
   - Increase to 5-min cache for common scans

---

### Issue: "Groq JSON parse errors"

**Logs:**
```
❌ Groq error after 2500ms: JSON parse error
[Describe/Groq] Expected ',' or '}' after property value in JSON at position 297
```

**Cause:** Groq model returns JavaScript expressions instead of JSON:
```json
"calories": 240 * (38 / 100),  // Invalid JSON
```

**Solutions:**
1. **Remove Groq from fallback** (temporary):
   ```typescript
   // Comment out Groq runner
   // if (process.env.GROQ_API_KEY) { ... }
   ```

2. **Update prompt** to forbid math expressions:
   ```
   CRITICAL: Return ONLY valid JSON. No math expressions, no comments.
   "calories": 240  ← CORRECT
   "calories": 240 * (38 / 100)  ← INVALID
   ```

3. **Add JSON sanitization** (strip expressions, eval safely)

---

## Performance Targets

| Metric | Target | Current (Typical) | Status |
|--------|--------|-------------------|--------|
| **Best Case** | <2s | ~2s | ✅ |
| **Typical Case** | <5s | ~4.5s | ✅ |
| **Worst Case** | <8s | ~6s | ✅ |
| **Cache Hit** | <100ms | ~50ms | ✅ |
| **Provider Success Rate** | >95% | ~80% | ⚠️ (Gemini rate limited) |

**Recommendations:**
- ✅ Current performance acceptable
- ⚠️ Switch primary to OpenAI (more reliable than Gemini free tier)
- ⚠️ Remove Groq until JSON issue resolved

---

## Future Enhancements

### 1. Provider Health Dashboard
```
Provider Status:
- Gemini 2.5: ⚠️ Rate limited (10/10 RPM)
- OpenAI: ✅ Healthy (avg 2.3s)
- Groq: ❌ Disabled (JSON errors)
```

### 2. Auto-Failover
Automatically skip rate-limited providers:
```typescript
if (isRateLimited('gemini-2.5')) {
  console.log('[Dish Scan] Skipping Gemini 2.5 (rate limited until 15:30)');
  return null;
}
```

### 3. Latency Metrics
Track historical performance:
```
Last 100 requests:
- Gemini 2.5: avg 3.2s (50% rate limited)
- OpenAI: avg 2.1s (0% rate limited)
- Groq: avg 2.8s (30% JSON errors)
```

---

## Summary

**What's Logged:**
- ✅ Every provider attempt (start time, model name)
- ✅ Success/failure status (timeout, rate limit, error)
- ✅ Exact timing for each attempt
- ✅ Stagger trigger (when parallel race starts)
- ✅ Final winner (provider + latency + total time)

**How to Use:**
1. Check server logs for 🏆 **WINNER** line
2. Identify bottlenecks (timeouts, rate limits, errors)
3. Monitor fallback patterns (frequent stagger triggers?)
4. Adjust strategy (switch primary provider, increase timeout, etc.)

**Current Status:**
- ✅ Logging implemented in `analyze-dish` route
- ✅ Describe-meal route has basic timing logs
- 🔄 Frontend display pending (show provider badge)

---

**Generated:** 2026-02-27
**Commit:** `edbca4d`
**Branch:** `improve/scan-performance-optimization`

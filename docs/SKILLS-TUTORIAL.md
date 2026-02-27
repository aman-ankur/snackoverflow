# Skills Tutorial: What We Built

## 🎯 Goal
Create reusable automation commands for your SnackOverflow project

## 🛠️ What We Created

### 1. `/health-check` Skill

**Purpose:** Verify all AI providers and Supabase are working before deploying

**Files created:**
- `.claude/skills/health-check.md` — Skill definition (what Claude reads)
- `scripts/health-check.ts` — Implementation (actual code that runs)

**How it works:**
1. You type `/health-check` in Claude Code
2. Claude reads the `.md` file to understand what to do
3. Claude runs `npx tsx scripts/health-check.ts`
4. Script pings all 6 services in parallel (Gemini, OpenAI, Groq, Sarvam, Anthropic, Supabase)
5. Reports which ones work, which fail, and response times

**Key learnings:**
- Skills are just markdown files that tell Claude what script to run
- Implementation scripts do the real work
- Parallel API calls with timeout protection prevent hanging
- ANSI color codes make output readable (green ✅, red ❌, yellow ⚠️)

---

### 2. `/benchmark` Skill

**Purpose:** Run calorie accuracy tests and compare results over time

**Files created:**
- `.claude/skills/benchmark.md` — Skill definition
- `scripts/run-benchmark.ts` — Wrapper script with reporting

**How it works:**
1. You type `/benchmark core` (or `edge` or `all`)
2. Claude runs the appropriate benchmark script
3. Wrapper parses MAPE results
4. Compares to previous runs (if any exist)
5. Generates human-readable report with accuracy rating

**Key learnings:**
- Skills can wrap existing scripts with better UX
- Parsing script output lets you add value (comparisons, ratings, insights)
- Saving results to JSON files creates historical tracking
- Color-coded ratings make results scannable

---

## 📚 Skill Anatomy

Every skill has 2 parts:

### Part 1: `.claude/skills/skill-name.md` (The Definition)

```markdown
# /skill-name

## Description
What it does and when to use it

## Parameters
- `param1` (type, required/optional): Description

## Example Usage
```
/skill-name param1 --flag
```

## Implementation
What steps the skill performs
```

**This is what Claude reads** to understand:
- What the skill does
- What parameters it accepts
- How to execute it

### Part 2: `scripts/skill-name.ts` (The Code)

```typescript
#!/usr/bin/env node
// Your actual implementation
// - Parse command-line args
// - Do the work
// - Format output nicely
```

**This is what actually runs** when you invoke the skill.

---

## 🎓 Key Concepts

### 1. Skills Are Just Automation
- Nothing magical — they call scripts/tools
- You could run the scripts directly: `npx tsx scripts/health-check.ts`
- Skills make it easier: just type `/health-check`

### 2. Parameters & Flags
- Defined in the `.md` file's Parameters section
- Parsed from command-line args in the script
- Example: `/benchmark core --save` → `args[0]='core'`, `args.includes('--save')=true`

### 3. Output Formatting Matters
- Use ANSI colors for readability
- Icons (✅❌⚠️) make status obvious
- Timestamps and comparison help track changes

### 4. Error Handling
- Timeouts prevent hanging on slow APIs
- Continue checking other services even if one fails
- Clear error messages (e.g., "Missing API key: GEMINI_API_KEY")

---

## 🚀 How to Use Your New Skills

### Test health of all services:
```bash
/health-check
```

### Run calorie accuracy tests:
```bash
/benchmark core           # 10 meals
/benchmark edge           # 15 meals
/benchmark all            # Run both
/benchmark core --save    # Save results
```

### Or run directly without Claude:
```bash
npx tsx scripts/health-check.ts
npx tsx scripts/run-benchmark.ts core --save
```

---

## 💡 Ideas for More Skills

Now that you understand the pattern, you can create:

**`/migrate`** — Run Supabase migrations safely
```markdown
1. Check current migration status
2. Show pending migrations
3. Ask for confirmation
4. Run migrations
5. Verify success
```

**`/e2e`** — Run Playwright tests with retries
```markdown
1. Start dev server
2. Run `npx playwright test`
3. If failures, auto-retry once
4. Generate HTML report
5. Open report in browser
```

**`/deploy`** — Deploy to Vercel with pre-checks
```markdown
1. Run `npm run build` (must pass)
2. Run `/health-check` (warn if failures)
3. Run `/benchmark core` (track accuracy)
4. Git status check (no uncommitted changes)
5. Deploy via Vercel CLI or MCP
6. Report deployment URL
```

**`/bundle-size`** — Analyze Next.js bundle
```markdown
1. Run `npm run build`
2. Parse `.next/analyze/` output
3. Find largest chunks
4. Compare to previous build
5. Flag regressions > 10%
```

---

## 🎯 The Power of Skills

Skills let you:
1. **Automate repetitive tasks** — No more copy-pasting commands
2. **Enforce standards** — Everyone runs the same checks
3. **Build institutional knowledge** — Document workflows in code
4. **Chain operations** — One skill calls another
5. **Integrate tools** — Claude orchestrates your entire stack

---

## 📝 Quick Reference

**Create a skill:**
1. Write `.claude/skills/skill-name.md` with description + parameters
2. Write `scripts/skill-name.ts` with implementation
3. Make it executable: `chmod +x scripts/skill-name.ts`
4. Test it: `/skill-name` in Claude Code

**Skill structure:**
```
.claude/skills/
  health-check.md       ← Definition
  benchmark.md          ← Definition
scripts/
  health-check.ts       ← Implementation
  run-benchmark.ts      ← Implementation
docs/
  SKILLS.md             ← Documentation
```

**Invoke skills:**
- In Claude Code chat: `/skill-name params --flags`
- Directly in terminal: `npx tsx scripts/skill-name.ts params --flags`

---

## 🎉 You're Ready!

You now know how to:
- ✅ Create custom Claude Code skills
- ✅ Write skill definitions (`.md` files)
- ✅ Implement skill logic (`.ts` scripts)
- ✅ Handle parameters and flags
- ✅ Format output for readability
- ✅ Build automation into your workflow

Start with these 2 skills, then create more as you find repetitive tasks! 🚀

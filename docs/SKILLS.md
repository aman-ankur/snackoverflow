# Custom Skills Guide

This project has custom Claude Code skills to streamline common workflows.

## Available Skills

### `/health-check` — Verify all services are operational

**What it does:**
- Pings all AI providers (Gemini, OpenAI, Groq, Sarvam, Anthropic)
- Tests Supabase connection
- Reports response times and status
- Identifies missing API keys

**Usage:**
```bash
/health-check              # Quick health check
/health-check --verbose    # Detailed request/response logs
```

**Or run directly:**
```bash
npx tsx scripts/health-check.ts
npx tsx scripts/health-check.ts --verbose
```

**When to use:**
- Before deploying to production
- After updating API keys
- When debugging provider failures
- As part of CI/CD pipeline

**Example output:**
```
✅ Gemini 2.0 Flash: OK (245ms)
✅ OpenAI GPT-4.1-nano: OK (312ms)
⚠️  Groq Llama 4 Scout: TIMEOUT (exceeded 5s)
✅ Sarvam API: OK (156ms)
✅ Anthropic Claude: OK (289ms)
✅ Supabase: OK (78ms)

Summary: 5/6 services operational
```

---

### `/benchmark` — Run calorie accuracy tests

**What it does:**
- Runs calorie accuracy benchmarks against ground truth
- Measures MAPE (Mean Absolute Percentage Error)
- Compares results to previous runs
- Saves results for historical tracking

**Usage:**
```bash
/benchmark core          # 10 common Indian meals
/benchmark edge          # 15 packaged/restaurant foods
/benchmark all           # Run both test suites
/benchmark core --save   # Save results for comparison
```

**Or run directly:**
```bash
npx tsx scripts/run-benchmark.ts core
npx tsx scripts/run-benchmark.ts edge --save
```

**When to use:**
- After modifying AI prompts or providers
- When updating IFCT/USDA reference data
- Before major releases
- To track accuracy improvements over time

**Example output:**
```
📊 Running benchmark: core (10 meals)

Results:
  MAPE: 9.2% (target: <15%)
  Max error: 18% (Masala Dosa)
  Within 10%: 7/10 meals
  Within 20%: 10/10 meals

Accuracy: ✅ EXCELLENT

Comparison to previous run:
  MAPE: 9.2% (was 11.4%) — ↓ 2.2%
```

**Accuracy ratings:**
- ✅ **Excellent**: MAPE < 10%
- ✅ **Good**: MAPE 10-15%
- ⚠️  **Acceptable**: MAPE 15-20%
- ❌ **Needs improvement**: MAPE > 20%

---

## How Skills Work

1. **Definition**: Each skill has a `.md` file in `.claude/skills/` that defines:
   - Description and purpose
   - Parameters and flags
   - Example usage
   - Implementation steps

2. **Implementation**: Skills call TypeScript scripts in `scripts/` that do the actual work

3. **Invocation**: Type `/skill-name` in Claude Code chat, and Claude will:
   - Read the SKILL.md file
   - Understand the parameters
   - Execute the implementation
   - Format and present results

## Adding More Skills

To create a new skill:

1. **Create `.claude/skills/your-skill.md`:**
   ```markdown
   # /your-skill

   ## Description
   What it does and when to use it

   ## Parameters
   - `param1` (type, required/optional): Description

   ## Example Usage
   ```
   /your-skill param1 --flag
   ```

   ## Implementation
   Steps the skill performs
   ```

2. **Create `scripts/your-skill.ts`:**
   - Implement the actual logic
   - Make it executable: `chmod +x scripts/your-skill.ts`
   - Add shebang: `#!/usr/bin/env node`

3. **Test it:**
   ```bash
   npx tsx scripts/your-skill.ts
   /your-skill
   ```

## Ideas for Future Skills

- `/migrate` — Run Supabase migrations with safety checks
- `/e2e` — Run Playwright tests with auto-retry
- `/deploy` — Build + deploy to Vercel with pre-flight checks
- `/docs-update` — Auto-generate API docs from route files
- `/bundle-size` — Analyze Next.js bundle and find bloat
- `/lighthouse` — Run Lighthouse performance audit
- `/db-backup` — Backup Supabase data locally

## Tips

- Skills are just automation — they can call any tool Claude has access to
- Keep SKILL.md documentation clear and detailed
- Use verbose flags for debugging
- Save benchmark results to track changes over time
- Skills can chain together (one skill calls another)

# /benchmark

## Description
Run calorie accuracy benchmarks against ground truth data (IFCT 2017 + USDA). Measures Mean Absolute Percentage Error (MAPE) for nutrition estimation accuracy.

Tests available:
- **core**: 10 common Indian meals (dosas, parathas, biryani)
- **edge**: 15 packaged/restaurant foods (edge cases)
- **all**: Run both test suites

Results can be saved for comparison across AI model changes.

## Parameters
- `type` (string, required): "core", "edge", or "all"
- `save` (flag, optional): Save results to `scripts/benchmark-results-{type}-{timestamp}.json`

## Example Usage
```
/benchmark core
/benchmark edge --save
/benchmark all
```

## Implementation
1. Run appropriate benchmark script(s) via `npx tsx`
2. Parse MAPE results and error distribution
3. Compare against previous saved results (if available)
4. Flag accuracy regressions > 5% MAPE increase
5. Generate human-readable report with insights

## Output Format
```
📊 Running benchmark: core (10 meals)

Results:
  MAPE: 9.2% (target: <15%)
  Max error: 18% (Masala Dosa)
  Within 10%: 7/10 meals
  Within 20%: 10/10 meals

Accuracy: ✅ EXCELLENT

Comparison to previous run:
  MAPE: 9.2% (was 11.4%) — improved by 2.2%
```

## Success Criteria
- **Excellent**: MAPE < 10%
- **Good**: MAPE 10-15%
- **Acceptable**: MAPE 15-20%
- **Needs improvement**: MAPE > 20%

## Notes
- Benchmarks use live AI providers (requires API keys)
- Each run costs ~$0.01-0.05 depending on providers used
- Results vary slightly due to AI non-determinism (~±2% MAPE)
- Use `--save` flag to track accuracy over time

#!/usr/bin/env node
/**
 * Benchmark Wrapper for SnackOverflow
 * Runs calorie accuracy benchmarks with smart reporting
 *
 * Usage:
 *   npx tsx scripts/run-benchmark.ts core
 *   npx tsx scripts/run-benchmark.ts edge --save
 *   npx tsx scripts/run-benchmark.ts all
 */

import { spawn } from 'child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const SCRIPTS_DIR = __dirname;
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

interface BenchmarkResult {
  type: 'core' | 'edge';
  mape: number;
  maxError: number;
  within10: number;
  within20: number;
  total: number;
  timestamp: string;
}

async function runScript(scriptName: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn('npx', ['tsx', join(SCRIPTS_DIR, scriptName)], {
      cwd: join(SCRIPTS_DIR, '..'),
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, code: code || 0 });
    });
  });
}

function parseBenchmarkOutput(output: string, type: 'core' | 'edge'): BenchmarkResult | null {
  // Parse MAPE from output
  const mapeMatch = output.match(/Mean Absolute Percentage Error \(MAPE\): ([\d.]+)%/);
  if (!mapeMatch) return null;

  const mape = parseFloat(mapeMatch[1]);

  // Parse individual errors to find max and distribution
  const errorMatches = [...output.matchAll(/Error: ([\d.]+)%/g)];
  const errors = errorMatches.map(m => parseFloat(m[1]));

  const maxError = errors.length > 0 ? Math.max(...errors) : 0;
  const within10 = errors.filter(e => e <= 10).length;
  const within20 = errors.filter(e => e <= 20).length;
  const total = errors.length;

  return {
    type,
    mape,
    maxError,
    within10,
    within20,
    total,
    timestamp: new Date().toISOString(),
  };
}

function getAccuracyRating(mape: number): { label: string; color: string; icon: string } {
  if (mape < 10) return { label: 'EXCELLENT', color: colors.green, icon: '✅' };
  if (mape < 15) return { label: 'GOOD', color: colors.green, icon: '✅' };
  if (mape < 20) return { label: 'ACCEPTABLE', color: colors.yellow, icon: '⚠️' };
  return { label: 'NEEDS IMPROVEMENT', color: colors.red, icon: '❌' };
}

function getPreviousResults(type: 'core' | 'edge'): BenchmarkResult[] {
  const files = readdirSync(SCRIPTS_DIR)
    .filter(f => f.startsWith(`benchmark-results-${type}-`) && f.endsWith('.json'))
    .sort()
    .reverse();

  return files.slice(0, 3).map(f => {
    const content = readFileSync(join(SCRIPTS_DIR, f), 'utf-8');
    return JSON.parse(content);
  });
}

function saveResults(result: BenchmarkResult, shouldSave: boolean): void {
  if (!shouldSave) return;

  const filename = `benchmark-results-${result.type}-${Date.now()}.json`;
  const filepath = join(SCRIPTS_DIR, filename);
  writeFileSync(filepath, JSON.stringify(result, null, 2));
  console.log(`\n${colors.dim}Saved results to: ${filename}${colors.reset}`);
}

function printSummary(result: BenchmarkResult): void {
  const rating = getAccuracyRating(result.mape);

  console.log(`\n${colors.bold}Results:${colors.reset}`);
  console.log(`  MAPE: ${colors.bold}${result.mape.toFixed(1)}%${colors.reset} (target: <15%)`);
  console.log(`  Max error: ${result.maxError.toFixed(1)}%`);
  console.log(`  Within 10%: ${result.within10}/${result.total} meals`);
  console.log(`  Within 20%: ${result.within20}/${result.total} meals`);
  console.log(`\nAccuracy: ${rating.icon} ${rating.color}${rating.label}${colors.reset}`);

  // Compare to previous runs
  const previous = getPreviousResults(result.type);
  if (previous.length > 0) {
    const prev = previous[0];
    const diff = result.mape - prev.mape;
    const diffColor = diff < 0 ? colors.green : diff > 0 ? colors.red : colors.dim;
    const diffIcon = diff < 0 ? '↓' : diff > 0 ? '↑' : '→';
    const diffText = diff === 0 ? 'unchanged' : `${diffIcon} ${Math.abs(diff).toFixed(1)}%`;

    console.log(`\n${colors.dim}Comparison to previous run:${colors.reset}`);
    console.log(`  MAPE: ${result.mape.toFixed(1)}% (was ${prev.mape.toFixed(1)}%) — ${diffColor}${diffText}${colors.reset}`);

    if (Math.abs(diff) > 5) {
      const warning = diff > 0 ? '⚠️  Significant regression detected!' : '🎉 Major improvement!';
      console.log(`  ${warning}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const type = args[0] as 'core' | 'edge' | 'all';
  const shouldSave = args.includes('--save');

  if (!type || !['core', 'edge', 'all'].includes(type)) {
    console.error(`${colors.red}Usage: npx tsx scripts/run-benchmark.ts <core|edge|all> [--save]${colors.reset}`);
    process.exit(1);
  }

  const tests = type === 'all' ? ['core', 'edge'] : [type];

  for (const testType of tests) {
    const scriptName = testType === 'core' ? 'benchmark-calories.ts' : 'benchmark-edge-cases.ts';
    const scriptPath = join(SCRIPTS_DIR, scriptName);

    if (!existsSync(scriptPath)) {
      console.error(`${colors.red}Script not found: ${scriptName}${colors.reset}`);
      continue;
    }

    const mealCount = testType === 'core' ? 10 : 15;
    console.log(`${colors.blue}📊 Running benchmark: ${testType} (${mealCount} meals)${colors.reset}\n`);

    const { stdout, code } = await runScript(scriptName);

    if (code !== 0) {
      console.error(`${colors.red}Benchmark failed with exit code ${code}${colors.reset}`);
      continue;
    }

    const result = parseBenchmarkOutput(stdout, testType as 'core' | 'edge');
    if (result) {
      printSummary(result);
      saveResults(result, shouldSave);
    }

    if (tests.length > 1) {
      console.log(`\n${colors.dim}${'─'.repeat(50)}${colors.reset}\n`);
    }
  }
}

main();

#!/usr/bin/env node
/**
 * Health Check Script for SnackOverflow
 * Verifies all AI providers and Supabase are operational
 *
 * Usage: npx tsx scripts/health-check.ts [--verbose]
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env.local manually
try {
  const envPath = join(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  });
} catch (err) {
  // .env.local not found or not readable - env vars might be set already
}

interface HealthCheckResult {
  service: string;
  status: 'ok' | 'timeout' | 'error' | 'missing-key';
  responseTime?: number;
  error?: string;
}

const TIMEOUT_MS = 5000;
const verbose = process.argv.includes('--verbose');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  dim: '\x1b[2m',
};

async function checkGemini(): Promise<HealthCheckResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { service: 'Gemini 2.0 Flash', status: 'missing-key' };

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say "ok"' }] }],
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      if (verbose) console.log(`Gemini error: ${error}`);
      return { service: 'Gemini 2.0 Flash', status: 'error', responseTime, error };
    }

    if (verbose) {
      const data = await response.json();
      console.log('Gemini response:', JSON.stringify(data, null, 2));
    }

    return { service: 'Gemini 2.0 Flash', status: 'ok', responseTime };
  } catch (err: any) {
    const responseTime = Date.now() - startTime;
    if (err.name === 'AbortError') {
      return { service: 'Gemini 2.0 Flash', status: 'timeout', responseTime };
    }
    return { service: 'Gemini 2.0 Flash', status: 'error', responseTime, error: err.message };
  }
}

async function checkOpenAI(): Promise<HealthCheckResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { service: 'OpenAI GPT-4.1-nano', status: 'missing-key' };

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-nano',
        messages: [{ role: 'user', content: 'Say "ok"' }],
        max_tokens: 10,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      if (verbose) console.log(`OpenAI error: ${error}`);
      return { service: 'OpenAI GPT-4.1-nano', status: 'error', responseTime, error };
    }

    if (verbose) {
      const data = await response.json();
      console.log('OpenAI response:', JSON.stringify(data, null, 2));
    }

    return { service: 'OpenAI GPT-4.1-nano', status: 'ok', responseTime };
  } catch (err: any) {
    const responseTime = Date.now() - startTime;
    if (err.name === 'AbortError') {
      return { service: 'OpenAI GPT-4.1-nano', status: 'timeout', responseTime };
    }
    return { service: 'OpenAI GPT-4.1-nano', status: 'error', responseTime, error: err.message };
  }
}

async function checkGroq(): Promise<HealthCheckResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { service: 'Groq Llama 4 Scout', status: 'missing-key' };

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{ role: 'user', content: 'Say "ok"' }],
        max_tokens: 10,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      if (verbose) console.log(`Groq error: ${error}`);
      return { service: 'Groq Llama 4 Scout', status: 'error', responseTime, error };
    }

    if (verbose) {
      const data = await response.json();
      console.log('Groq response:', JSON.stringify(data, null, 2));
    }

    return { service: 'Groq Llama 4 Scout', status: 'ok', responseTime };
  } catch (err: any) {
    const responseTime = Date.now() - startTime;
    if (err.name === 'AbortError') {
      return { service: 'Groq Llama 4 Scout', status: 'timeout', responseTime };
    }
    return { service: 'Groq Llama 4 Scout', status: 'error', responseTime, error: err.message };
  }
}

async function checkSarvam(): Promise<HealthCheckResult> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) return { service: 'Sarvam AI', status: 'missing-key' };

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Use a lightweight endpoint - just check if API key is valid
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify({
        inputs: ['test'],
        target_language_code: 'hi-IN',
        speaker: 'meera',
        model: 'bulbul:v3',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // Even if request fails, as long as we get a response, API key is valid
    if (response.status === 401 || response.status === 403) {
      return { service: 'Sarvam AI', status: 'error', responseTime, error: 'Invalid API key' };
    }

    if (verbose) {
      console.log(`Sarvam status: ${response.status}`);
    }

    return { service: 'Sarvam AI', status: 'ok', responseTime };
  } catch (err: any) {
    const responseTime = Date.now() - startTime;
    if (err.name === 'AbortError') {
      return { service: 'Sarvam AI', status: 'timeout', responseTime };
    }
    return { service: 'Sarvam AI', status: 'error', responseTime, error: err.message };
  }
}

async function checkAnthropic(): Promise<HealthCheckResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { service: 'Anthropic Claude', status: 'missing-key' };

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "ok"' }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      if (verbose) console.log(`Anthropic error: ${error}`);
      return { service: 'Anthropic Claude', status: 'error', responseTime, error };
    }

    if (verbose) {
      const data = await response.json();
      console.log('Anthropic response:', JSON.stringify(data, null, 2));
    }

    return { service: 'Anthropic Claude', status: 'ok', responseTime };
  } catch (err: any) {
    const responseTime = Date.now() - startTime;
    if (err.name === 'AbortError') {
      return { service: 'Anthropic Claude', status: 'timeout', responseTime };
    }
    return { service: 'Anthropic Claude', status: 'error', responseTime, error: err.message };
  }
}

async function checkSupabase(): Promise<HealthCheckResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return { service: 'Supabase', status: 'missing-key' };

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Simple health check - ping the REST API
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      if (verbose) console.log(`Supabase error: ${error}`);
      return { service: 'Supabase', status: 'error', responseTime, error };
    }

    if (verbose) {
      console.log(`Supabase status: ${response.status}`);
    }

    return { service: 'Supabase', status: 'ok', responseTime };
  } catch (err: any) {
    const responseTime = Date.now() - startTime;
    if (err.name === 'AbortError') {
      return { service: 'Supabase', status: 'timeout', responseTime };
    }
    return { service: 'Supabase', status: 'error', responseTime, error: err.message };
  }
}

function formatResult(result: HealthCheckResult): string {
  let icon: string;
  let color: string;
  let statusText: string;

  switch (result.status) {
    case 'ok':
      icon = '✅';
      color = colors.green;
      statusText = `OK ${colors.dim}(${result.responseTime}ms)${colors.reset}`;
      break;
    case 'timeout':
      icon = '⏱️';
      color = colors.yellow;
      statusText = `TIMEOUT ${colors.dim}(exceeded ${TIMEOUT_MS}ms)${colors.reset}`;
      break;
    case 'missing-key':
      icon = '🔑';
      color = colors.yellow;
      statusText = 'MISSING API KEY';
      break;
    case 'error':
      icon = '❌';
      color = colors.red;
      statusText = `ERROR ${colors.dim}(${result.responseTime}ms)${colors.reset}`;
      if (result.error) {
        statusText += `\n   ${colors.dim}${result.error.slice(0, 80)}${colors.reset}`;
      }
      break;
  }

  return `${icon} ${color}${result.service}${colors.reset}: ${statusText}`;
}

async function main() {
  console.log('🏥 Running health checks...\n');

  // Run all checks in parallel
  const results = await Promise.all([
    checkGemini(),
    checkOpenAI(),
    checkGroq(),
    checkSarvam(),
    checkAnthropic(),
    checkSupabase(),
  ]);

  // Print results
  results.forEach(result => {
    console.log(formatResult(result));
  });

  // Summary
  const operational = results.filter(r => r.status === 'ok').length;
  const total = results.length;
  const missingKeys = results.filter(r => r.status === 'missing-key');

  console.log(`\n${colors.dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`Summary: ${colors.green}${operational}/${total}${colors.reset} services operational`);

  if (missingKeys.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Missing API keys:${colors.reset}`);
    missingKeys.forEach(r => {
      const envVar = r.service.includes('Gemini') ? 'GEMINI_API_KEY' :
                     r.service.includes('OpenAI') ? 'OPENAI_API_KEY' :
                     r.service.includes('Groq') ? 'GROQ_API_KEY' :
                     r.service.includes('Sarvam') ? 'SARVAM_API_KEY' :
                     r.service.includes('Anthropic') ? 'ANTHROPIC_API_KEY' :
                     r.service.includes('Supabase') ? 'NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY' : '';
      console.log(`   • ${envVar}`);
    });
  }

  // Exit code: 0 if all OK, 1 if any failures
  const hasFailures = results.some(r => r.status === 'error' || r.status === 'timeout');
  process.exit(hasFailures ? 1 : 0);
}

main();

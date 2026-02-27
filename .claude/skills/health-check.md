# /health-check

## Description
Verify that all critical services are operational:
- AI providers (Gemini, OpenAI, Groq, Sarvam, Anthropic)
- Supabase database connection
- Environment variables configuration

Use this before deploying, after updating API keys, or when debugging provider issues.

## Parameters
- `verbose` (flag, optional): Show detailed request/response for each provider

## Example Usage
```
/health-check
/health-check --verbose
```

## Implementation
1. Check all required environment variables are set
2. Make lightweight API calls to each provider:
   - Gemini 2.0 Flash (simple text completion)
   - OpenAI GPT-4.1-nano (simple completion)
   - Groq Llama 4 Scout (simple completion)
   - Sarvam API (list models endpoint)
   - Anthropic Claude (simple completion)
3. Test Supabase connection (if credentials present)
4. Report status for each service with response times
5. Flag any failures with actionable error messages

## Output Format
```
✅ Gemini 2.0 Flash: OK (245ms)
✅ OpenAI GPT-4.1-nano: OK (312ms)
⚠️  Groq Llama 4 Scout: TIMEOUT (exceeded 5s)
✅ Sarvam API: OK (156ms)
✅ Anthropic Claude: OK (289ms)
✅ Supabase: OK (78ms)

Summary: 5/6 services operational
```

## Error Handling
- Network timeouts: 5s per provider
- Invalid API keys: Clear message indicating which key needs updating
- Missing env vars: List all missing variables at once
- Continue checking other providers even if one fails

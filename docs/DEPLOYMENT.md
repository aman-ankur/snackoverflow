# Deployment

## Current Setup

- **Repo**: [github.com/aman-ankur/fridgenius](https://github.com/aman-ankur/fridgenius)
- **Branch**: `main` (all features merged)
- **Platform**: Vercel
- **Framework**: Next.js 16.1.6 (auto-detected by Vercel)

---

## Deploy to Vercel

### First Time
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `aman-ankur/fridgenius` from GitHub
3. Vercel auto-detects Next.js — no build config needed
4. Add environment variables (Settings → Environment Variables):
   - `GEMINI_API_KEY`
   - `GROQ_API_KEY`
   - `SARVAM_API_KEY`
5. Click Deploy

### Subsequent Deploys
- Push to `main` → Vercel auto-deploys
- Or trigger manual deploy from Vercel dashboard

### Build Notes
- `postinstall` script copies ONNX WASM files to `public/` for YOLO mode
- No special build commands needed — `next build` handles everything
- HTTPS is automatic on Vercel (required for camera access)

---

## Local Development

### Standard
```bash
npm install
npm run dev
# → http://localhost:3000
```

### Mobile Testing (HTTPS required for camera)
Camera API requires HTTPS. For local mobile testing:

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: SSL proxy
npx local-ssl-proxy --source 3443 --target 3000 --cert certs/local.pem --key certs/local-key.pem
```

Then access from phone: `https://<your-local-ip>:3443`

To find your local IP:
```bash
ipconfig getifaddr en0  # macOS WiFi
```

### SSL Certificates
Self-signed certs are in `certs/` directory:
- `certs/local.pem` — certificate
- `certs/local-key.pem` — private key
- `public/rootCA.pem` — root CA (install on phone to trust the cert)

To trust on iPhone: Settings → General → VPN & Device Management → Install rootCA.pem

---

## Git Workflow

```bash
# Current branches
main                    # Production — deployed to Vercel
feature/enhancements    # Development branch (merged into main)

# Push changes
git add -A
git commit -m "feat: description"
git push origin main    # Auto-deploys to Vercel
```

---

## Environment Variables on Vercel

| Variable | Required | Where to Get |
|---|---|---|
| `GEMINI_API_KEY` | Yes | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `GROQ_API_KEY` | Yes | [console.groq.com/keys](https://console.groq.com/keys) |
| `SARVAM_API_KEY` | Yes | [dashboard.sarvam.ai](https://dashboard.sarvam.ai) |

Set these in Vercel Dashboard → Project → Settings → Environment Variables.
Do NOT commit `.env.local` to git (it's in `.gitignore`).

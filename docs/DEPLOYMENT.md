# Deployment

## Current Setup

- **Repo**: [github.com/aman-ankur/snackoverflow](https://github.com/aman-ankur/snackoverflow)
- **Branch**: `main` (all features merged)
- **Platform**: Vercel
- **Framework**: Next.js 16.1.6 (auto-detected by Vercel)

---

## Deploy to Vercel

### First Time
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `aman-ankur/snackoverflow` from GitHub
3. Vercel auto-detects Next.js — no build config needed
4. Add environment variables (Settings → Environment Variables):
   - `GEMINI_API_KEY`
   - `GROQ_API_KEY`
   - `SARVAM_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
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
| `NEXT_PUBLIC_SUPABASE_URL` | Optional* | [supabase.com/dashboard](https://supabase.com/dashboard) → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional* | Same dashboard → `anon` `public` key |

\* Without Supabase keys, the app works in guest mode (localStorage only). With them, users can sign in and sync data across devices.

Set these in Vercel Dashboard → Project → Settings → Environment Variables.
Do NOT commit `.env.local` to git (it's in `.gitignore`).

---

## Supabase Setup (One-Time)

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor** → run this to create the table + RLS:

```sql
create table public.user_data (
  id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb default null,
  goals jsonb default null,
  streak jsonb default null,
  meals jsonb default '[]'::jsonb,
  health_profile jsonb default null,
  meal_analyses jsonb default null,
  garden jsonb default null,
  expiry_tracker jsonb default '[]'::jsonb,
  fridge_scans jsonb default '[]'::jsonb,
  meal_planner jsonb default null,
  updated_at timestamptz default now()
);

alter table public.user_data enable row level security;

create policy "Users read own data" on public.user_data
  for select using (auth.uid() = id);
create policy "Users insert own data" on public.user_data
  for insert with check (auth.uid() = id);
create policy "Users update own data" on public.user_data
  for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_data (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

3. Go to **Authentication → Providers** → ensure Email is enabled
4. Go to **Authentication → Email Templates → Magic Link** → replace template to use `{{ .Token }}` (sends 6-digit OTP code instead of clickable link)
5. (Optional) Set up custom SMTP (e.g. Brevo) under **Project Settings → Authentication → SMTP Settings** to avoid built-in rate limits
6. Copy Project URL + anon key → add to `.env.local` and Vercel env vars

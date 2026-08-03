-- Connected Health: Apple Health / Health Auto Export normalized store.
create table if not exists public.health_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'apple_health',
  ingestion_token_hash text not null,
  last_successful_sync timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_record_id text not null,
  workout_type text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer,
  energy_kcal numeric,
  distance_km numeric,
  heart_rate_avg_bpm numeric,
  heart_rate_min_bpm numeric,
  heart_rate_max_bpm numeric,
  source_references jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, provider_record_id)
);

create table if not exists public.sleep_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_record_id text not null,
  sleep_date date not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  asleep_seconds integer,
  in_bed_seconds integer,
  core_seconds integer,
  deep_seconds integer,
  rem_seconds integer,
  efficiency numeric,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, provider_record_id)
);

create table if not exists public.health_metric_samples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_record_id text not null,
  metric_type text not null,
  recorded_at timestamptz not null,
  value numeric not null,
  unit text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, provider_record_id)
);

create index if not exists health_workouts_user_started_idx on public.workouts(user_id, started_at desc);
create index if not exists health_sleep_user_date_idx on public.sleep_sessions(user_id, sleep_date desc);
create index if not exists health_metrics_user_type_time_idx on public.health_metric_samples(user_id, metric_type, recorded_at desc);

alter table public.health_connections enable row level security;
alter table public.workouts enable row level security;
alter table public.sleep_sessions enable row level security;
alter table public.health_metric_samples enable row level security;

create policy "Users manage own health connections" on public.health_connections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own health workouts" on public.workouts for select using (auth.uid() = user_id);
create policy "Users read own health sleep" on public.sleep_sessions for select using (auth.uid() = user_id);
create policy "Users manage own health metrics" on public.health_metric_samples for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

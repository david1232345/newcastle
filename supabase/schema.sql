create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  discord_user_id text not null unique,
  dm_opt_in boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.officials (
  id uuid primary key default gen_random_uuid(),
  opponent text not null,
  competition text not null default 'Liga',
  starts_at timestamptz not null,
  check_opens_at timestamptz not null,
  notes text not null default '',
  status text not null default 'scheduled' check (status in ('scheduled', 'finished', 'cancelled')),
  created_by text not null default 'web',
  reminder_24h_sent boolean not null default false,
  reminder_1h_sent boolean not null default false,
  check_open_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.official_players (
  id uuid primary key default gen_random_uuid(),
  official_id uuid not null references public.officials(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  check_status text not null default 'pending' check (check_status in ('pending', 'confirmed', 'unavailable')),
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (official_id, player_id)
);

create table if not exists public.replay_reports (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  parsed_summary jsonb not null,
  focus_player jsonb,
  ai_provider text,
  ai_model text,
  ai_report text not null,
  created_at timestamptz not null default now()
);

create index if not exists officials_starts_at_idx on public.officials(starts_at);
create index if not exists official_players_official_idx on public.official_players(official_id);
create index if not exists official_players_player_idx on public.official_players(player_id);
create index if not exists replay_reports_created_at_idx on public.replay_reports(created_at desc);

alter table public.players enable row level security;
alter table public.officials enable row level security;
alter table public.official_players enable row level security;
alter table public.replay_reports enable row level security;

-- No se crean políticas públicas. Todas las operaciones pasan por las funciones
-- del servidor usando SUPABASE_SERVICE_ROLE_KEY. Nunca pongas esa clave en app.js.

-- Word Cup database schema.
-- Run this in the Supabase SQL Editor (see README for click-by-click steps).

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  role_label text not null,
  avatar_initial text not null,
  avatar_photo_path text,
  pin_hash text not null,
  failed_pin_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists daily_words (
  game_date date primary key,
  solution text not null,
  days_since_launch integer,
  source text not null check (source in ('nyt', 'fallback')),
  created_at timestamptz not null default now()
);

create table if not exists game_results (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  game_date date not null,
  guesses jsonb not null default '[]'::jsonb,
  num_guesses integer,
  status text not null check (status in ('in_progress', 'won', 'lost')),
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (player_id, game_date)
);

-- Row Level Security: enabled with NO policies on any table.
-- This means the anon/public key can never read or write any row of any
-- table, including daily_words (which holds the day's solution). All access
-- goes through server-side code using the service-role key, which bypasses
-- RLS entirely. Do not add "allow" policies here.
alter table players enable row level security;
alter table daily_words enable row level security;
alter table game_results enable row level security;

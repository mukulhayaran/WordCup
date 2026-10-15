-- Word Cup migration 002: safe concurrent guesses, nudges, reactions,
-- winner's messages, legacy cups and cup celebrations.
-- Run once in the Supabase SQL Editor. Safe to re-run.

-- Guess count the database keeps in sync by itself; used to make guess
-- submission compare-and-swap (a write only lands if the count is unchanged).
alter table game_results
  add column if not exists guess_count integer
  generated always as (jsonb_array_length(guesses)) stored;

create table if not exists nudges (
  id uuid primary key default gen_random_uuid(),
  from_player_id uuid not null references players(id) on delete cascade,
  to_player_id uuid not null references players(id) on delete cascade,
  game_date date not null,
  created_at timestamptz not null default now(),
  unique (from_player_id, game_date) -- one nudge per player per day
);

create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  from_player_id uuid not null references players(id) on delete cascade,
  to_player_id uuid not null references players(id) on delete cascade,
  game_date date not null,
  reaction text not null check (reaction in ('heart', 'laugh', 'fire', 'crown')),
  updated_at timestamptz not null default now(),
  unique (from_player_id, game_date) -- one (changeable) reaction per player per day
);

create table if not exists winner_messages (
  id uuid primary key default gen_random_uuid(),
  from_player_id uuid not null references players(id) on delete cascade,
  to_player_id uuid not null references players(id) on delete cascade,
  game_date date not null,
  body text not null check (char_length(body) between 1 and 80),
  created_at timestamptz not null default now(),
  dismissed_at timestamptz,
  unique (from_player_id, game_date) -- one message per player per day
);

-- Cups won before the site existed. winner is a player's name or 'shared'.
-- Dates are optional; leave them null when unknown.
create table if not exists legacy_cups (
  id uuid primary key default gen_random_uuid(),
  era text not null,
  label text not null,
  winner text not null check (winner in ('Mukul', 'Madhulika', 'shared')),
  start_date date,
  end_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Which players have already seen the "Champion!" screen for which cup.
create table if not exists cup_celebrations_seen (
  player_id uuid not null references players(id) on delete cascade,
  week_start date not null,
  seen_at timestamptz not null default now(),
  primary key (player_id, week_start)
);

-- Row Level Security on, with NO policies: only the server (service-role key) can read or write.
alter table nudges enable row level security;
alter table reactions enable row level security;
alter table winner_messages enable row level security;
alter table legacy_cups enable row level security;
alter table cup_celebrations_seen enable row level security;

-- The two cups Madhulika won in the WhatsApp days (dates unknown).
insert into legacy_cups (era, label, winner, sort_order)
select 'The WhatsApp era', v.label, 'Madhulika', v.sort_order
from (values ('Cup I', 1), ('Cup II', 2)) as v(label, sort_order)
where not exists (select 1 from legacy_cups l where l.era = 'The WhatsApp era' and l.label = v.label);

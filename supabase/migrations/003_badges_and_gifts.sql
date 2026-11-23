-- Word Cup migration 003: badges, the Monday Newspaper and gifts.
-- Run once in the Supabase SQL Editor. Safe to re-run.

-- The day each player first opened the badges feature. Older badges still
-- count on the shelf, but only newer ones get a pop-up.
create table if not exists badge_state (
  player_id uuid primary key references players(id) on delete cascade,
  baseline_date date not null,
  created_at timestamptz not null default now()
);

-- Which badge pop-ups a player has already dealt with.
create table if not exists badge_popups_seen (
  player_id uuid not null references players(id) on delete cascade,
  award_key text not null,
  seen_at timestamptz not null default now(),
  primary key (player_id, award_key)
);

-- Which players have already read which Monday Newspaper.
create table if not exists newspaper_seen (
  player_id uuid not null references players(id) on delete cascade,
  week_start date not null,
  seen_at timestamptz not null default now(),
  primary key (player_id, week_start)
);

create table if not exists gifts (
  id uuid primary key default gen_random_uuid(),
  from_player_id uuid not null references players(id) on delete cascade,
  to_player_id uuid not null references players(id) on delete cascade,
  week_start date not null,
  gift_code text not null,
  speech text check (speech is null or char_length(speech) between 1 and 60),
  sent_at timestamptz not null default now(),
  opened_at timestamptz,
  thanks text,
  unique (from_player_id, week_start) -- one gift per player per cup
);

-- Row Level Security on, with NO policies: only the server (service-role key) can read or write.
alter table badge_state enable row level security;
alter table badge_popups_seen enable row level security;
alter table newspaper_seen enable row level security;
alter table gifts enable row level security;

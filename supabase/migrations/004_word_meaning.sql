-- Word Cup migration 004: the meaning of each day's word, shown after you finish.
-- Run once in the Supabase SQL Editor. Safe to re-run.
alter table daily_words add column if not exists meaning jsonb;

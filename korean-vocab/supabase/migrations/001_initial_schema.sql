-- ============================================================
-- Korean Vocab Trainer — Initial Schema
-- Run this once in your Supabase project's SQL Editor.
-- ============================================================

-- ------------------------------------------------------------
-- 1. cards
--    Stores one SM-2 card per (user, Korean word).
-- ------------------------------------------------------------
create table if not exists cards (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  kr          text        not null,
  rom         text,
  en          text,
  ef          float       not null default 2.5,
  n           int         not null default 0,
  interval    int         not null default 1,
  next_review date        not null default current_date,
  updated_at  timestamptz not null default now(),
  primary key (user_id, kr)
);

alter table cards enable row level security;

create policy "Users can manage their own cards"
  on cards for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2. custom_sets
--    Stores user-imported vocabulary sets as JSONB.
-- ------------------------------------------------------------
create table if not exists custom_sets (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  name       text        not null,
  words      jsonb       not null default '[]',
  updated_at timestamptz not null default now(),
  primary key (user_id, name)
);

alter table custom_sets enable row level security;

create policy "Users can manage their own custom sets"
  on custom_sets for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3. user_preferences
--    One row per user; stores quiz mode preference and streak.
-- ------------------------------------------------------------
create table if not exists user_preferences (
  user_id      uuid        not null references auth.users(id) on delete cascade primary key,
  default_mode text        not null default 'recall'
                           check (default_mode in ('recall', 'mcq', 'reverse')),
  streak       int         not null default 0,
  last_studied date,
  updated_at   timestamptz not null default now()
);

alter table user_preferences enable row level security;

create policy "Users can manage their own preferences"
  on user_preferences for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

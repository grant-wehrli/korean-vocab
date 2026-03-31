-- ============================================================
-- Korean Vocab Trainer — Reports Table
-- Run this in your Supabase project's SQL Editor.
-- ============================================================

-- Stores user-submitted answer reports so the developer can
-- review and fix vocab entries / add missing accepted answers.
create table if not exists reports (
  id            bigint      generated always as identity primary key,
  created_at    timestamptz not null default now(),
  card_kr       text        not null,
  card_rom      text        not null,
  card_en       text        not null,
  user_answer   text,
  quiz_mode     text,
  suggested_fix text,
  notes         text,
  user_id       uuid        references auth.users(id)
);

alter table reports enable row level security;

-- Anyone (authenticated or guest/anon) can submit a report.
create policy "Anyone can submit reports"
  on reports for insert
  to anon, authenticated
  with check (true);

-- Users can read their own reports; developer reads all via the dashboard.
create policy "Users can read own reports"
  on reports for select
  to authenticated
  using (auth.uid() = user_id);

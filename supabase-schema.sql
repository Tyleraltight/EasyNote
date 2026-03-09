-- ============================================================
-- EasyNote Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. flags table
create table if not exists public.flags (
  id         uuid primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  current    integer not null default 0,
  total      integer not null default 10,
  unit       text not null default '次',
  color      text not null default 'blue',
  cycle      text not null default 'none',
  history    text[] not null default '{}',
  reminder   jsonb,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_flags_user_id on public.flags(user_id);

-- 2. memos table (one row per user)
create table if not exists public.memos (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  mode       text not null default 'note',
  text       text not null default '',
  todos      jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

-- 3. Enable Row Level Security
alter table public.flags enable row level security;
alter table public.memos enable row level security;

-- 4. RLS Policies: users can only access their own data
create policy "Users can select own flags"
  on public.flags for select
  using (auth.uid() = user_id);

create policy "Users can insert own flags"
  on public.flags for insert
  with check (auth.uid() = user_id);

create policy "Users can update own flags"
  on public.flags for update
  using (auth.uid() = user_id);

create policy "Users can delete own flags"
  on public.flags for delete
  using (auth.uid() = user_id);

create policy "Users can select own memo"
  on public.memos for select
  using (auth.uid() = user_id);

create policy "Users can insert own memo"
  on public.memos for insert
  with check (auth.uid() = user_id);

create policy "Users can update own memo"
  on public.memos for update
  using (auth.uid() = user_id);

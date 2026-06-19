-- =====================================================================
--  Do-You-Love-Me — Supabase schema
--  Paste this whole file into the Supabase SQL Editor and run it.
--
--  Design goals:
--   • 4 tables: couples, users, calendar_events, gallery_photos
--   • Everything is scoped by couple_id so the app is multi-tenant
--     (commercialization ready).
--   • RLS is ON for every table; a user can only ever touch rows that
--     belong to their own couple.
--   • Deleting a couple cascades to all of its data.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- for gen_random_uuid()

-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

-- couples : the tenant / D-Day anchor
create table if not exists public.couples (
  id          uuid primary key default gen_random_uuid(),
  start_date  date not null,                       -- "처음 사귄 날" (D-Day base)
  main_bg_url text,                                -- full-screen background image
  memo        text,                                -- shared pinned memo
  created_at  timestamptz not null default now()
);

-- users : 1 row per authenticated person, linked to auth.users
create table if not exists public.users (
  id                uuid primary key
                      references auth.users (id) on delete cascade,
  couple_id         uuid
                      references public.couples (id) on delete cascade,
  nickname          text,
  profile_image_url text,
  created_at        timestamptz not null default now()
);

-- calendar_events : schedules / diaries / todos
create table if not exists public.calendar_events (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null
               references public.couples (id) on delete cascade,
  event_date date not null,
  type       text not null default 'schedule'
               check (type in ('schedule', 'diary', 'todo', 'anniversary')),
  title      text,
  content    text,
  sort_index integer not null default 0,            -- manual ordering (drag & drop)
  done       boolean not null default false,        -- completion state for 'todo' items
  created_at timestamptz not null default now()
);

-- push_subscriptions : Web Push endpoints per user (for D-Day reminders)
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  couple_id  uuid references public.couples (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

-- messages : real-time couple chat
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples (id) on delete cascade,
  sender_id  uuid not null references auth.users (id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_couple_idx
  on public.messages (couple_id, created_at);

-- gallery_photos : pointers to heavy media stored in Cloudflare R2
create table if not exists public.gallery_photos (
  id           uuid primary key default gen_random_uuid(),
  couple_id    uuid not null
                 references public.couples (id) on delete cascade,
  r2_image_url text not null,
  taken_at     timestamptz,                          -- EXIF capture time (if any)
  event_date   date,                                 -- the day this photo belongs to (links to the calendar)
  uploaded_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 1b. Idempotent upgrades (safe to re-run on an existing database)
-- ---------------------------------------------------------------------
alter table public.calendar_events
  add column if not exists sort_index integer not null default 0;
alter table public.calendar_events
  add column if not exists done boolean not null default false;
alter table public.gallery_photos
  add column if not exists taken_at timestamptz;
alter table public.gallery_photos
  add column if not exists event_date date;

-- Helpful indexes for the most common lookups (by couple / by date)
create index if not exists calendar_events_couple_date_idx
  on public.calendar_events (couple_id, event_date);
create index if not exists gallery_photos_couple_idx
  on public.gallery_photos (couple_id, uploaded_at desc);
create index if not exists gallery_photos_couple_date_idx
  on public.gallery_photos (couple_id, event_date);
create index if not exists users_couple_idx
  on public.users (couple_id);

-- ---------------------------------------------------------------------
-- 2. Helper: which couple does the current auth user belong to?
--    SECURITY DEFINER so it can read public.users without tripping the
--    users RLS policy (avoids recursive policy evaluation).
-- ---------------------------------------------------------------------
create or replace function public.current_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id from public.users where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- 3. Enable Row Level Security on every table
-- ---------------------------------------------------------------------
alter table public.couples            enable row level security;
alter table public.users              enable row level security;
alter table public.calendar_events    enable row level security;
alter table public.gallery_photos     enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.messages           enable row level security;

-- ---------------------------------------------------------------------
-- 4. Policies
-- ---------------------------------------------------------------------

-- ===== couples =======================================================
-- A user may read/update their own couple. Any authenticated user may
-- create a couple (the row they then attach themselves to).
drop policy if exists "couples_select_own" on public.couples;
create policy "couples_select_own"
  on public.couples for select
  to authenticated
  using (id = public.current_couple_id());

drop policy if exists "couples_insert_authenticated" on public.couples;
create policy "couples_insert_authenticated"
  on public.couples for insert
  to authenticated
  with check (true);

drop policy if exists "couples_update_own" on public.couples;
create policy "couples_update_own"
  on public.couples for update
  to authenticated
  using (id = public.current_couple_id())
  with check (id = public.current_couple_id());

drop policy if exists "couples_delete_own" on public.couples;
create policy "couples_delete_own"
  on public.couples for delete
  to authenticated
  using (id = public.current_couple_id());

-- ===== users =========================================================
-- A user can always see/edit their own row, and can also see their
-- partner (same couple_id) so the app can render both profiles.
drop policy if exists "users_select_self_or_partner" on public.users;
create policy "users_select_self_or_partner"
  on public.users for select
  to authenticated
  using (
    id = auth.uid()
    or (couple_id is not null and couple_id = public.current_couple_id())
  );

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self"
  on public.users for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "users_delete_self" on public.users;
create policy "users_delete_self"
  on public.users for delete
  to authenticated
  using (id = auth.uid());

-- ===== calendar_events ==============================================
-- Full CRUD limited to rows belonging to the caller's couple.
drop policy if exists "calendar_events_all_own" on public.calendar_events;
create policy "calendar_events_all_own"
  on public.calendar_events for all
  to authenticated
  using (couple_id = public.current_couple_id())
  with check (couple_id = public.current_couple_id());

-- ===== gallery_photos ===============================================
drop policy if exists "gallery_photos_all_own" on public.gallery_photos;
create policy "gallery_photos_all_own"
  on public.gallery_photos for all
  to authenticated
  using (couple_id = public.current_couple_id())
  with check (couple_id = public.current_couple_id());

-- ===== messages =====================================================
-- Couple-scoped chat. A user may read all of their couple's messages and may
-- only send messages as themselves into their own couple.
drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own"
  on public.messages for select
  to authenticated
  using (couple_id = public.current_couple_id());

drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own"
  on public.messages for insert
  to authenticated
  with check (
    couple_id = public.current_couple_id() and sender_id = auth.uid()
  );

drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_delete_own"
  on public.messages for delete
  to authenticated
  using (sender_id = auth.uid());

-- ===== push_subscriptions ===========================================
-- A user manages only their own push subscriptions. The cron job that sends
-- notifications uses the service role key, which bypasses RLS.
drop policy if exists "push_subscriptions_all_own" on public.push_subscriptions;
create policy "push_subscriptions_all_own"
  on public.push_subscriptions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 5. Couple connection RPCs
--    Creating a couple has an RLS chicken-and-egg problem: right after the
--    INSERT the caller still has couple_id = null, so the row-level SELECT
--    policy would hide the new row and we couldn't read its id back.
--    These SECURITY DEFINER functions do the insert + self-link atomically.
-- ---------------------------------------------------------------------

-- Create a brand new couple and attach the current user to it.
-- Returns the new couple id. Fails if the user is already in a couple.
create or replace function public.create_couple(
  p_start_date  date,
  p_main_bg_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_couple_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if (select couple_id from public.users where id = v_uid) is not null then
    raise exception 'already in a couple';
  end if;

  insert into public.couples (start_date, main_bg_url)
  values (p_start_date, p_main_bg_url)
  returning id into v_couple_id;

  -- Ensure the user row exists, then link it.
  insert into public.users (id, couple_id)
  values (v_uid, v_couple_id)
  on conflict (id) do update set couple_id = excluded.couple_id;

  return v_couple_id;
end;
$$;

-- Join an existing couple by its id (used as the invite code).
-- Returns the couple id. Fails if the couple does not exist or is full (2).
create or replace function public.join_couple(p_couple_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_members int;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if not exists (select 1 from public.couples where id = p_couple_id) then
    raise exception 'couple not found';
  end if;

  select count(*) into v_members
  from public.users
  where couple_id = p_couple_id and id <> v_uid;

  if v_members >= 2 then
    raise exception 'couple is full';
  end if;

  insert into public.users (id, couple_id)
  values (v_uid, p_couple_id)
  on conflict (id) do update set couple_id = excluded.couple_id;

  return p_couple_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Realtime
--    Add the shared tables to the supabase_realtime publication so both
--    partners' screens update live. RLS still applies to the stream, and the
--    client additionally filters by couple_id.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'calendar_events'
  ) then
    alter publication supabase_realtime add table public.calendar_events;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'gallery_photos'
  ) then
    alter publication supabase_realtime add table public.gallery_photos;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- =====================================================================
--  Done.
-- =====================================================================

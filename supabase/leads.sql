-- Run this once in Supabase → SQL Editor.
--
-- One row per student, ever. The unique constraint on phone is what enforces
-- that: a student verifying again on a new browser hits the conflict and the
-- insert is ignored rather than adding a duplicate.

create table if not exists public.leads (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text        not null,
  phone       text        not null unique,
  class       text        not null
);

-- Only the server writes here, using the service role key, which bypasses RLS.
-- Turning RLS on with no policies means the public anon key can read nothing.
alter table public.leads enable row level security;

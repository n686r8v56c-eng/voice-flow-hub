-- Run this in the EXISTING Voice Flow Supabase project's SQL Editor.
-- This creates a separate Voice Studio sync table; it does not modify voice_flow_data.
create table if not exists public.voice_studio_drills (
  user_id uuid not null references auth.users(id) on delete cascade,
  drill_id integer not null check (drill_id between 1 and 50),
  video_url text,
  timestamps jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, drill_id)
);
alter table public.voice_studio_drills enable row level security;

drop policy if exists voice_studio_select_own on public.voice_studio_drills;
create policy voice_studio_select_own on public.voice_studio_drills
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists voice_studio_insert_own on public.voice_studio_drills;
create policy voice_studio_insert_own on public.voice_studio_drills
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists voice_studio_update_own on public.voice_studio_drills;
create policy voice_studio_update_own on public.voice_studio_drills
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists voice_studio_delete_own on public.voice_studio_drills;
create policy voice_studio_delete_own on public.voice_studio_drills
  for delete to authenticated using (auth.uid() = user_id);

grant select,insert,update,delete on public.voice_studio_drills to authenticated;

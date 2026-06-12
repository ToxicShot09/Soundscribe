-- Soundscribe initial schema.
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh project.

-- ============ Tables ============

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.audio_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  file_path text not null,
  content_type text not null,
  file_size bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists audio_files_user_id_idx on public.audio_files (user_id);

-- ============ Row Level Security ============

alter table public.profiles enable row level security;
alter table public.audio_files enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can view own audio files"
  on public.audio_files for select
  using (auth.uid() = user_id);

create policy "Users can insert own audio files"
  on public.audio_files for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own audio files"
  on public.audio_files for delete
  using (auth.uid() = user_id);

-- ============ Profile auto-creation on signup ============

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ Storage ============

-- Private bucket; files are accessed via signed URLs.
insert into storage.buckets (id, name, public)
values ('audio_files', 'audio_files', false)
on conflict (id) do nothing;

-- Files are stored as <user_id>/<uuid>.<ext>; scope access to the owner's folder.
create policy "Users can upload own audio"
  on storage.objects for insert
  with check (
    bucket_id = 'audio_files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own audio"
  on storage.objects for select
  using (
    bucket_id = 'audio_files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own audio"
  on storage.objects for delete
  using (
    bucket_id = 'audio_files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

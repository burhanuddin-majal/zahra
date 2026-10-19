-- Run this SQL in the Supabase SQL Editor only after a parent/guardian creates the project.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default 'Club member' check (char_length(nickname) between 1 and 24),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_created_at_idx on public.chat_messages(created_at);
alter table public.profiles enable row level security;
alter table public.approval_requests enable row level security;
alter table public.chat_messages enable row level security;
create policy "members can read approved profiles" on public.profiles for select to authenticated using (approved = true or id = auth.uid());
create policy "users can edit own nickname only" on public.profiles for update to authenticated using (id = auth.uid() and approved = false) with check (id = auth.uid() and approved = false);
create policy "approved members read messages" on public.chat_messages for select to authenticated using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.approved = true));
create policy "approved members post messages" on public.chat_messages for insert to authenticated with check (author_id = auth.uid() and exists(select 1 from public.profiles p where p.id = auth.uid() and p.approved = true));
create policy "no public approval request access" on public.approval_requests for all to anon, authenticated using (false) with check (false);
create or replace function public.new_profile_for_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id,nickname,approved)
  values(new.id, coalesce(nullif(left(new.raw_user_meta_data->>'nickname',24),''),'Club member'), false)
  on conflict(id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users for each row execute procedure public.new_profile_for_user();
alter publication supabase_realtime add table public.chat_messages;

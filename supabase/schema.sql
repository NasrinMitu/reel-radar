create table if not exists public.radars (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  format text not null check (format in ('movie', 'tv', 'both')),
  genres integer[] not null default '{}'::integer[],
  excluded_genres integer[] not null default '{}'::integer[],
  tags text[] not null default '{}'::text[],
  alerts text[] not null default '{}'::text[],
  color text not null default '#e11d48',
  min_rating numeric(3, 1) not null default 7 check (min_rating >= 0 and min_rating <= 10),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  radar_id text not null,
  tmdb_id text not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  release_date date,
  rating numeric(3, 1),
  poster_url text,
  overview text not null default '',
  is_read boolean not null default false,
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_radar_owner_fkey
    foreign key (user_id, radar_id)
    references public.radars (user_id, id)
    on delete cascade,
  constraint notifications_unique_match
    unique (user_id, radar_id, media_type, tmdb_id)
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_digest_pending_idx
  on public.notifications (user_id, emailed_at)
  where emailed_at is null;

alter table public.radars enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Users manage their own radars" on public.radars;
create policy "Users manage their own radars"
  on public.radars for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their own notifications" on public.notifications;
create policy "Users manage their own notifications"
  on public.notifications for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.radars, public.notifications to authenticated;

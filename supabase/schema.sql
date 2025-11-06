-- TrailShare cloud schema (v1)
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default auth.uid(),
  username text unique,
  created_at timestamptz default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  trail_name text not null,
  area text,
  difficulty text check (difficulty in ('Easy','Moderate','Hard','Expert')),
  date_hiked date not null,
  miles numeric,
  elevation integer,
  conditions text[] default '{}'::text[],
  trail_types text[] default '{}'::text[],
  rating integer check (rating between 1 and 5),
  hazards text,
  description text,
  lat double precision,
  lng double precision,
  helpful integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.report_images (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade,
  url text not null,
  created_at timestamptz default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  body text not null,
  created_at timestamptz default now()
);

alter table public.users enable row level security;
alter table public.reports enable row level security;
alter table public.report_images enable row level security;
alter table public.comments enable row level security;

create policy "users select" on public.users for select using (true);
create policy "users upsert own" on public.users for insert with check (auth.uid() = id);
create policy "users update own" on public.users for update using (auth.uid() = id);

create policy "reports read" on public.reports for select using (true);
create policy "reports insert own" on public.reports for insert with check (auth.uid() = user_id);
create policy "reports update own" on public.reports for update using (auth.uid() = user_id);

create policy "images read" on public.report_images for select using (true);
create policy "images insert own_report" on public.report_images for insert with check (
  exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid())
);

create policy "comments read" on public.comments for select using (true);
create policy "comments insert authed" on public.comments for insert with check (auth.role() = 'authenticated');

create or replace function public.increment_helpful(rid uuid)
returns void language sql security definer as $$
  update public.reports set helpful = helpful + 1 where id = rid;
$$;

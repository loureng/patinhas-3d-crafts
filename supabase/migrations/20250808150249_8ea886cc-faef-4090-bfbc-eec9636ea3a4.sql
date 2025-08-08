-- Enable required extension for UUID generation
create extension if not exists pgcrypto;

-- Create storage buckets for customizations and STL files
insert into storage.buckets (id, name, public)
values
  ('customizations', 'customizations', false),
  ('stl-files', 'stl-files', false)
on conflict (id) do nothing;

-- Policies for storage.objects on 'customizations' bucket
create policy "Authenticated users can upload their own customization files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'customizations'
    and (auth.uid()::text = (storage.foldername(name))[1])
  );

create policy "Authenticated users can read their own customization files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'customizations'
    and (auth.uid()::text = (storage.foldername(name))[1])
  );

create policy "Authenticated users can update their own customization files"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'customizations'
    and (auth.uid()::text = (storage.foldername(name))[1])
  );

create policy "Authenticated users can delete their own customization files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'customizations'
    and (auth.uid()::text = (storage.foldername(name))[1])
  );

-- Policies for storage.objects on 'stl-files' bucket
create policy "Authenticated users can upload their own STL files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'stl-files'
    and (auth.uid()::text = (storage.foldername(name))[1])
  );

create policy "Authenticated users can read their own STL files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'stl-files'
    and (auth.uid()::text = (storage.foldername(name))[1])
  );

create policy "Authenticated users can update their own STL files"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'stl-files'
    and (auth.uid()::text = (storage.foldername(name))[1])
  );

create policy "Authenticated users can delete their own STL files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'stl-files'
    and (auth.uid()::text = (storage.foldername(name))[1])
  );

-- Create coupons table
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  value numeric(10,2) not null,
  active boolean not null default true,
  expires_at timestamptz,
  usage_limit int,
  used_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.coupons enable row level security;

-- Allow authenticated users to read active, non-expired coupons
create policy "Coupons are readable by authenticated users"
  on public.coupons for select
  to authenticated
  using (active = true and (expires_at is null or expires_at > now()));

-- Index for faster lookups by code
create index if not exists idx_coupons_code on public.coupons (code);

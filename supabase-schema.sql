-- Jalankan seluruh file ini di Supabase Dashboard > SQL Editor.
-- Jangan pernah menaruh service_role key di website atau repository.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null check (
    char_length(customer_name) between 2 and 100
    and customer_name = btrim(customer_name)
  ),
  email text not null check (
    char_length(email) <= 254
    and email = btrim(email)
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  package text not null,
  notes text check (notes is null or char_length(notes) <= 2000),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed'))
);

-- Drop lalu pasang ulang constraint agar aman dijalankan pada tabel lama maupun baru.
alter table public.orders
  drop constraint if exists orders_package_check;
alter table public.orders
  add constraint orders_package_check
  check (package in ('ngopi', 'jalan', 'acara', 'staycation'));

create index if not exists orders_created_at_idx on public.orders (created_at desc);

create table if not exists private.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade
);

revoke all on private.admin_users from public, anon, authenticated;

alter table public.orders enable row level security;
alter table private.admin_users enable row level security;

create or replace function public.is_order_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_order_admin() from public, anon;
grant execute on function public.is_order_admin() to authenticated;

revoke all on public.orders from public, anon, authenticated;
grant insert (customer_name, email, package, notes) on public.orders to anon, authenticated;
grant select on public.orders to authenticated;

drop policy if exists "Visitors can submit orders" on public.orders;
create policy "Visitors can submit orders"
on public.orders
for insert
to anon, authenticated
with check (status = 'new');

drop policy if exists "Only admins can read orders" on public.orders;
create policy "Only admins can read orders"
on public.orders
for select
to authenticated
using ((select public.is_order_admin()));

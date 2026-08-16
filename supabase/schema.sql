-- AI Inventory Management System
-- Requires Supabase Auth (email/password) enabled, with exactly one user
-- account created manually in the Supabase dashboard (Authentication ->
-- Users -> Add user). There is no public sign-up flow in the app.

create extension if not exists "pgcrypto";

-- Superseded by the single `inventory` table below (pre-auth iteration).
drop table if exists inventory_items;
drop table if exists uploads;

create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sku_code text not null,
  product_name text not null,
  quantity_on_hand numeric not null default 0,
  cost_price numeric not null default 0,
  last_sale_date date,
  avg_daily_sales numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, sku_code)
);

create index if not exists inventory_user_id_idx on inventory (user_id);

alter table inventory enable row level security;

create policy "Users manage their own inventory" on inventory
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

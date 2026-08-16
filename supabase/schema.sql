-- AI Inventory Management System
-- MVP schema. No auth/login (per PRD), so RLS policies are intentionally
-- open to the anon key — this is a single-tenant tool with no user accounts.

create extension if not exists "pgcrypto";

create table if not exists uploads (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  row_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references uploads(id) on delete cascade,
  product_name text not null,
  sku text,
  quantity_on_hand numeric not null default 0,
  cost_price numeric not null default 0,
  last_sale_date date,
  avg_daily_sales numeric not null default 0,
  days_in_stock integer,
  days_on_hand numeric,
  value numeric generated always as (quantity_on_hand * cost_price) stored,
  classification text check (classification in ('Sell off', 'Watch', 'Keep & Reorder')),
  created_at timestamptz not null default now()
);

create index if not exists inventory_items_upload_id_idx on inventory_items (upload_id);

alter table uploads enable row level security;
alter table inventory_items enable row level security;

-- No login for MVP: allow the anon key to read/write freely.
create policy "anon full access uploads" on uploads
  for all using (true) with check (true);

create policy "anon full access inventory_items" on inventory_items
  for all using (true) with check (true);

-- AI Inventory Management System — batch/warehouse/ledger data model.
--
-- Replaces the earlier flat `inventory` table (one row per SKU, quantity
-- overwritten on every import) with a proper distributor model: products
-- are SKU master data, batches are the real inventory unit (a product can
-- have many batches across many warehouses, each with its own expiry and
-- quantity), and every quantity change is recorded as a stock_movements
-- row so "why is this 395 right now" is always answerable.
--
-- Requires Supabase Auth (email/password) enabled, with exactly one user
-- account created manually in the Supabase dashboard (Authentication ->
-- Users -> Add user). There is no public sign-up flow in the app.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Reference tables
-- ---------------------------------------------------------------------

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  contact_info text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists warehouses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  location text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ---------------------------------------------------------------------
-- Products — SKU master data, not a quantity. Quantity lives on batches.
-- ---------------------------------------------------------------------

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sku text not null,
  name text not null,
  category text,
  default_supplier_id uuid references suppliers(id) on delete set null,
  reorder_point numeric not null default 0,
  avg_daily_sales numeric not null default 0,
  last_sale_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, sku)
);

create index if not exists products_user_id_idx on products (user_id);

-- ---------------------------------------------------------------------
-- Batches — the real inventory unit. Same product in two warehouses, or
-- two batches of the same product in one warehouse, are separate rows.
-- ---------------------------------------------------------------------

create table if not exists batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  warehouse_id uuid not null references warehouses(id) on delete restrict,
  batch_number text not null,
  manufacturing_date date,
  expiry_date date,
  quantity numeric not null default 0,
  available_qty numeric not null default 0,
  reserved_qty numeric not null default 0,
  damaged_qty numeric not null default 0,
  quarantined_qty numeric not null default 0,
  purchase_price numeric not null default 0,
  supplier_id uuid references suppliers(id) on delete set null,
  purchase_reference text,
  status text not null default 'active' check (status in ('active', 'quarantined', 'damaged', 'expired', 'written_off')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id, warehouse_id, batch_number)
);

create index if not exists batches_user_id_idx on batches (user_id);
create index if not exists batches_product_id_idx on batches (product_id);
create index if not exists batches_expiry_date_idx on batches (expiry_date);

-- ---------------------------------------------------------------------
-- Stock movements — append-only ledger. Every quantity change is a row.
-- ---------------------------------------------------------------------

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null references batches(id) on delete cascade,
  movement_type text not null check (
    movement_type in ('purchase', 'receipt', 'sale', 'return', 'transfer', 'adjustment', 'damage', 'expiry', 'quarantine', 'write_off', 'import')
  ),
  quantity_change numeric not null,
  previous_qty numeric not null,
  new_qty numeric not null,
  reference text,
  warehouse_id uuid references warehouses(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_user_id_idx on stock_movements (user_id);
create index if not exists stock_movements_batch_id_idx on stock_movements (batch_id);

-- ---------------------------------------------------------------------
-- Row-level security — every table scoped to its owning user.
-- ---------------------------------------------------------------------

alter table suppliers enable row level security;
alter table warehouses enable row level security;
alter table products enable row level security;
alter table batches enable row level security;
alter table stock_movements enable row level security;

create policy "Users manage their own suppliers" on suppliers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own warehouses" on warehouses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own products" on products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own batches" on batches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own stock movements" on stock_movements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- One-time migration from the old flat `inventory` table, if present.
-- Safe to re-run: every insert is on conflict do nothing. The old table
-- itself is left in place (not dropped) as an untouched audit fallback.
-- ---------------------------------------------------------------------

do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'inventory') then

    insert into products (user_id, sku, name, avg_daily_sales, last_sale_date, created_at, updated_at)
    select user_id, sku_code, product_name, avg_daily_sales, last_sale_date, created_at, updated_at
    from inventory
    on conflict (user_id, sku) do nothing;

    insert into warehouses (user_id, name)
    select distinct user_id, 'Default Warehouse' from inventory
    on conflict (user_id, name) do nothing;

    insert into batches (
      user_id, product_id, warehouse_id, batch_number, expiry_date,
      quantity, available_qty, purchase_price, status
    )
    select
      inv.user_id,
      p.id,
      w.id,
      'LEGACY-' || inv.sku_code,
      inv.expiry_date,
      inv.quantity_on_hand,
      inv.quantity_on_hand,
      inv.cost_price,
      'active'
    from inventory inv
    join products p on p.user_id = inv.user_id and p.sku = inv.sku_code
    join warehouses w on w.user_id = inv.user_id and w.name = 'Default Warehouse'
    on conflict (user_id, product_id, warehouse_id, batch_number) do nothing;

    insert into stock_movements (user_id, batch_id, movement_type, quantity_change, previous_qty, new_qty, reference, warehouse_id)
    select b.user_id, b.id, 'import', b.quantity, 0, b.quantity, 'Migrated from legacy inventory table', b.warehouse_id
    from batches b
    where b.batch_number like 'LEGACY-%'
      and not exists (
        select 1 from stock_movements m where m.batch_id = b.id and m.reference = 'Migrated from legacy inventory table'
      );

  end if;
end $$;

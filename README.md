# MedStock AI

A batch/warehouse-aware inventory management platform for medical/pharmaceutical
distributors, behind a single-user login. Products, batches (with their own
expiry, quantity, and warehouse), and every stock movement are persisted in
Supabase and reloaded on every sign-in.

## Data model

- **`inv_products`** — SKU master data (name, category, reorder point, sales velocity).
- **`inv_warehouses`**, **`inv_suppliers`** — simple reference tables.
- **`inv_batches`** — the real inventory unit. A product can have many batches, each
  with its own warehouse, expiry date, quantity, and available/reserved/damaged/
  quarantined split. Two batches of the same product are never merged into one number.
- **`inv_stock_movements`** — an append-only ledger. Every quantity change (import,
  manual receipt, status change) writes a row here, so "why is this 395 right
  now" is always answerable from the data.

Tables are prefixed `inv_*` because the Supabase project this was built against
already had unrelated tables named `products`/`suppliers`/etc. from something
else — the prefix avoids colliding with whatever that is, rather than risking
altering tables this app doesn't own. If you're starting from a genuinely empty
project, the prefix is just a naming convention, not a requirement.

On-hand quantity is **never** a field you overwrite directly — it's always the
result of a batch-level change plus a logged movement.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.local.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`
   / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project's Settings → API.
   Required — the app shows a config warning until these are set.
3. Run `supabase/schema.sql` against your project (SQL Editor in the Supabase
   dashboard). It creates `inv_products`/`inv_warehouses`/`inv_suppliers`/
   `inv_batches`/`inv_stock_movements` with RLS scoping every row to its
   owning user. If you're upgrading from the earlier single-table version of
   this app, the old `inventory` table is left in place, untouched — there's
   no automatic migration (dropped after it kept colliding with an unrelated
   table of the same name in one project); bring old rows across by hand if
   you need them.
4. **Create the one user account.** There's no public sign-up form in the
   Supabase dashboard sense, but the app's own login page has a "Create
   account" link that calls Supabase Auth directly — use that, or add a user
   manually via Authentication → Users if you prefer.
5. **Enable OTP-style password reset emails.** Supabase's default recovery
   email includes `{{ .Token }}` in its template — don't remove it. That's
   what the app's "Forgot password?" flow asks the user to type in.
6. `npm run dev` and open http://localhost:3000.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel ([vercel.com/new](https://vercel.com/new)).
3. Add the two Supabase env vars in the Vercel project's Settings → Environment Variables.
4. Deploy.

## Adding inventory

`/inventory/add` has two tabs:

- **Manual Entry** — one batch at a time. If the product/warehouse/batch
  combination already exists, the entered quantity is **added** to what's
  there (a receipt). Otherwise a new batch is created.
- **Import File** — a reconciliation workflow: Upload → Map Columns →
  Validate & Preview → Confirm. Every row is classified as a new product, a
  new batch on an existing product, an update to an existing batch, a
  duplicate within the file, or a validation error, before anything is
  written. Duplicates and errors are always skipped. An update **replaces**
  the batch's quantity with the file's value (the sheet is treated as the
  current truth), unlike manual entry's additive behavior.

The reconciliation engine (`src/lib/reconciliation.ts`) is a pure function —
given parsed rows and a snapshot of existing products/batches, it returns a
diff. It never touches the database itself; `commitReconciliation` in
`src/lib/inventoryData.ts` is what actually writes the reviewed result.

**Tally exports** (`.xlsx` "Stock Summary" reports) work without any manual
setup: `Stock Item` / `Closing Balance` / `Rate` are recognized alongside the
generic aliases. The parser also handles the quirks specific to that export
format (`src/lib/parseFile.ts`):
- the real header row isn't row 1 — Tally leads with a company-name and
  report-title row first, so the parser scans the first 15 rows for one that
  looks like a header instead of assuming row 1;
- quantities/rates come with units glued on (`"300 Nos"`, `"2.50/Nos"`) —
  numbers are extracted with a regex rather than a straight `parseFloat`;
- the trailing `Grand Total` row is dropped automatically rather than being
  imported as a fake product.

Plain CSV files are unaffected — this logic only runs for `.xlsx`/`.xls`.

## Stock status and expiry

Both are computed deterministically (`src/lib/stockStatus.ts`), not
AI-classified — this matters for something correctness-critical like
inventory counts:

- **Stock status**: Out of Stock (0 available) → Low Stock (at/below the
  product's reorder point) → Overstock (>180 days of stock at the current
  sales rate) → Slow Moving (zero recorded sales) → Healthy.
- **Expiry status**: Expired → Expiring within 30/60/90 days → Healthy,
  based on each batch's own expiry date.

## What's built vs. deferred

**Built:** auth, the products/batches/warehouses/suppliers/movements data
model, reconciled Excel/CSV import, manual entry, a batch-level searchable/
filterable/sortable Inventory table with bulk status actions, a Dashboard
that surfaces only actionable "Needs Attention" items (not decorative KPI
cards), and Reports (valuation/stockout/expiry, PDF + CSV).

**Deferred** (the data layer supports these, but there's no dedicated UI yet):
a Product detail page, a Stock Movement ledger page, a Warehouses management
page, Purchase Orders/Returns, and Alerts as a persisted/dismissible entity
rather than a computed dashboard section.

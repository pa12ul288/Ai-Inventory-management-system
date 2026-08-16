# AI Inventory Management System

Single-page dashboard: upload a CSV/Excel inventory file, Gemini classifies every
product as **Sell off**, **Watch**, or **Keep & Reorder**, and the dashboard shows
KPIs, action lists, and the full inventory table. No login.

## Local setup

1. Install dependencies (already done if you're continuing from this repo):
   ```bash
   npm install
   ```
2. Copy `.env.local.example` to `.env.local` and fill in:
   - `GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/apikey)
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your Supabase
     project's Settings → API. Optional for local testing: the app works without
     Supabase configured, it just skips persisting uploads.
3. If using Supabase, run `supabase/schema.sql` against your project (SQL Editor in
   the Supabase dashboard, or `psql`/the Supabase CLI). It creates the `uploads` and
   `inventory_items` tables with RLS policies open to the anon key (no login, so
   there's no per-user auth to scope rows to).
4. `npm run dev` and open http://localhost:3000.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel ([vercel.com/new](https://vercel.com/new)).
3. Add the same three env vars from `.env.local` in the Vercel project's
   Settings → Environment Variables.
4. Deploy. No other config needed — it's a standard Next.js app.

## Expected inventory file columns

The parser recognizes common header variants automatically, but the canonical
columns are:

| Column | Notes |
|---|---|
| Product Name | required (falls back to the first column if no header matches) |
| SKU | optional |
| Quantity On Hand | required |
| Cost Price | required (per unit) |
| Last Sale Date | used for the "no movement 60+ days" rule |
| Avg Daily Sales | used for the "days on hand" / reorder-timing rules |

## Classification rules (Gemini-driven, deterministic fallback)

- **Sell off** — no movement for 60+ days, or days-on-hand > 90
- **Keep & Reorder** — will run out in under 14 days at the current sales rate
- **Watch** — everything else

`src/lib/classify.ts` holds the deterministic rule engine used as the fallback
if the Gemini call fails; `src/app/api/classify/route.ts` sends the same rules
to Gemini (`gemini-flash-latest`) for the live classification.

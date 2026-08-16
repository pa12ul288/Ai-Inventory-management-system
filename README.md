# AI Inventory Management System

Dashboard behind a single-user login: sign in, upload a CSV/Excel inventory file,
Gemini classifies every product as **Sell off**, **Watch**, or **Keep & Reorder**,
and the dashboard shows KPIs, action lists, and the full inventory table.
Inventory is persisted in Supabase and reloaded from there on every sign-in —
uploading a file **adds new SKUs and updates existing ones**, it never deletes.

## Local setup

1. Install dependencies (already done if you're continuing from this repo):
   ```bash
   npm install
   ```
2. Copy `.env.local.example` to `.env.local` and fill in:
   - `GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/apikey)
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your Supabase
     project's Settings → API. **Required now** — login and inventory storage don't
     work without these; the app shows a config warning until they're set.
3. Run `supabase/schema.sql` against your project (SQL Editor in the Supabase
   dashboard, or `psql`/the Supabase CLI). It creates a single `inventory` table
   keyed on `(user_id, sku_code)` with row-level security scoping each user to
   their own rows.
4. **Create the one user account.** There's no public sign-up form by design —
   go to Supabase dashboard → Authentication → Users → Add user, and set an
   email + password. That's the only account the app will ever have.
5. **Enable OTP-style password reset emails.** By default Supabase's recovery
   email contains a magic link, not a typed-in code. To get an actual one-time
   code: Authentication → Email Templates → Reset Password, and make sure the
   template includes `{{ .Token }}` (Supabase's default recovery template
   already does — just don't remove it). That 6-digit token is what the app's
   "Forgot password?" flow asks the user to type in.
6. `npm run dev` and open http://localhost:3000.

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
| SKU | used as the persistence key. If missing, a stable key is generated from the product name so re-uploads still update the same row instead of duplicating it |
| Quantity On Hand | required |
| Cost Price | required (per unit) |
| Last Sale Date | used for the "no movement 60+ days" rule |
| Avg Daily Sales | used for the "days on hand" / reorder-timing rules |

## Classification rules (Gemini-driven, deterministic fallback)

- **Sell off** — no movement for 60+ days, or days-on-hand > 90
- **Keep & Reorder** — will run out in under 14 days at the current sales rate,
  OR was last sold in August 2026 and has under 500 units on hand (a temporary
  rule for testing without a sales-velocity column — see note in `classify.ts`)
- **Watch** — everything else

`src/lib/classify.ts` holds the deterministic rule engine used as the fallback
if the Gemini call fails; `src/app/api/classify/route.ts` sends the same rules
to Gemini (`gemini-flash-latest`) for the live classification.

## Auth

Email/password sign-in via Supabase Auth, single user, no roles, no sign-up UI.
"Forgot password?" sends a one-time code by email, which the user types in
alongside a new password (`src/components/Login.tsx`). Signing out returns to
the login page; signing in reloads inventory straight from Supabase.

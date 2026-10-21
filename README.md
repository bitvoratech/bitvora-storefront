# Bitvora Stores

Online stores for Nigerian small businesses: merchants build a store in the admin, shoppers order on the storefront, and payment is by bank transfer (with proof upload) or pay-on-delivery.

## Layout

| Path | What it is | Dev URL |
| --- | --- | --- |
| `apps/admin` | Merchant dashboard and platform-owner console (Next.js) | http://localhost:3000 |
| `apps/storefront` | Public stores at `/<store-slug>` (Next.js) | http://localhost:3001 |
| `apps/website` | Marketing site, static export deployed to Cloudflare with Wrangler | http://localhost:3002 |
| `packages/ui` | Shared React components | |
| `packages/lib` | Shared helpers: rate limiting, Cloudinary upload/resize | |
| `packages/config` | Shared Tailwind tokens and TypeScript base config | |
| `supabase/migrations` | Database schema, RLS policies and RPCs | |

## Setup

You need Node 22 and **pnpm 11** (the lockfile format doesn't work with pnpm 10):

```bash
npm i -g pnpm@11
pnpm install
```

Each app reads its own `.env.local`. Copy the examples and fill them in:

```bash
cp apps/admin/.env.example apps/admin/.env.local
cp apps/storefront/.env.example apps/storefront/.env.local
cp apps/website/.env.example apps/website/.env.local
```

Services used: Supabase (database and auth), Cloudinary (images), Upstash Redis (rate limiting), and Termii (OTP SMS). Merchants give their NIN and CAC number at signup and a platform owner checks them by hand under **Owner console → Verifications**. Rate limits on sensitive actions like OTPs fail closed, so those features won't work locally without Upstash.

Apply the database migrations with the Supabase CLI:

```bash
pnpm exec supabase link --project-ref <your-project-ref>
pnpm exec supabase db push
```

Then run an app:

```bash
pnpm --filter admin dev
pnpm --filter storefront dev
pnpm --filter website dev
```

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

CI runs all four on every pull request and on pushes to `main`.

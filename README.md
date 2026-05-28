# Nuvora

Multi-model chat with Clerk auth, Convex data, Stripe billing, and OpenRouter streaming.

## Stack

- Next.js 15 App Router
- Clerk
- Convex
- Stripe
- OpenRouter
- Tailwind + Radix UI

## Quick start

```bash
npm install --legacy-peer-deps
cp .env.example .env.local
# fill in the env vars
npx convex dev
npm run dev
```

Open `http://localhost:3000`.

## Required setup

### Clerk

1. Create an app in Clerk.
2. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
3. Create a JWT template named `convex`.
4. Copy your Clerk frontend API domain into Convex:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-clerk-frontend.clerk.accounts.dev
```

### Convex

1. Create or link a Convex project with `npx convex dev`.
2. Set the shared internal webhook secret in both environments:

```bash
npx convex env set WEBHOOK_INTERNAL_SECRET change-me
```

3. Keep `NEXT_PUBLIC_CONVEX_URL` in `.env.local`.

### Stripe

1. Create recurring prices for `basic`, `starter`, and `pro`.
2. Create one-time prices for the four credit add-ons.
3. Set the `STRIPE_PRICE_*` env vars.
4. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
5. Add a webhook endpoint for `/api/stripe/webhook` and subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

For local development:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### OpenRouter

1. Create an API key at `https://openrouter.ai/keys`.
2. Set `OPENROUTER_API_KEY`.
3. Adjust seeded model slugs if your OpenRouter catalog differs.

## Convex flow

- `convex/users.ts` creates and returns the Clerk-backed user profile.
- `convex/messages.ts` owns chat send lifecycle:
  - `prepareToSend`
  - `finalizeSend`
  - `failSend`
- `convex/stripe.ts` owns billing reads plus webhook processing, with internal mutations for:
  - subscription sync
  - addon payments
  - invoice success/failure
- Server pages load data with `fetchQuery`.
- Reactive client UI uses `useQuery` / `useMutation`.

## Seeding

After `npx convex dev` generates the API, seed plans and starter models from the Convex dashboard or a script by calling:

- `seed.run`

In practice this means running the `convex/seed.ts` mutation from the Convex dashboard while signed in as an admin user from `ADMIN_USER_IDS`.

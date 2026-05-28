import type { AuthConfig } from "convex/server";

// Convex reads CLERK_JWT_ISSUER_DOMAIN from `npx convex env`.
// In Clerk: create a JWT template named `convex` with default settings.
// Then run:
//   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://YOUR-CLERK-FRONTEND.clerk.accounts.dev
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;

const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "me7aitdbxq.ufs.sh" },
    ],
  },
  // The www → apex redirect needs to be done at the Vercel domain level
  // (Settings → Domains → ⋯ on www.vercilio.com → Redirect to vercilio.com).
  // Doing it here at the Next layer creates a redirect loop because Vercel
  // can also be configured to route www and apex through the same Next
  // deployment — Next then keeps redirecting back to itself.
};

module.exports = withNextIntl(nextConfig);

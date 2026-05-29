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
  async redirects() {
    return [
      // Force the apex host as the canonical origin. Without this the
      // www. variant and the apex are both indexable, which makes the
      // canonical tag (always pointing at the apex) point at a "different
      // hreflang location" from the visitor's POV — Lighthouse flags it
      // and Google can split rankings between the two hosts.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.vercilio.com" }],
        destination: "https://vercilio.com/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);

// Server-rendered JSON-LD snippet. Using a plain <script> here is safer
// than next/script for structured data — search engines pick it up at
// crawl time without waiting for the afterInteractive loader, and React
// renders it inline into the served HTML.
//
// Pass a plain object; it gets stringified for you. Use the helpers in
// @/lib/seo (organizationJsonLd, websiteJsonLd, faqPageJsonLd, etc.) to
// keep the schemas consistent.
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

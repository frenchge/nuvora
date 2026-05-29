import type { Metadata } from "next";
import { routing, type Locale } from "@/i18n/routing";
import { getAbsoluteUrl, getLocaleAlternates, getSiteUrl } from "@/lib/site";

const DEFAULT_OG_IMAGE = "/verciliologoblack.png";

// One canonical place for per-page metadata. Each marketing page calls
// buildPageMetadata({ locale, path, title, description, [image] }) inside
// its generateMetadata, and gets:
//   - canonical URL pinned to the page's path on the page's locale
//   - hreflang alternates for every locale we ship, plus x-default
//   - OG + Twitter cards filled in with sensible defaults
//   - robots:index, follow with Googlebot-tuned max-image-preview hints
export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  image,
  type = "website",
  noIndex = false,
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
}): Metadata {
  const canonicalUrl = getAbsoluteUrl(locale, path);
  const ogImage = image ?? `${getSiteUrl()}${DEFAULT_OG_IMAGE}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getLocaleAlternates(path),
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type,
      title,
      description,
      url: canonicalUrl,
      siteName: "Vercilio",
      locale,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

// Organization JSON-LD — used once at the locale layout level so every
// page on the marketing surface inherits it. Tells Google our brand,
// canonical URL, logo, and the social handles where we have a presence.
export function organizationJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vercilio",
    url: siteUrl,
    logo: `${siteUrl}/verciliologoblack.png`,
    sameAs: [
      "https://twitter.com/vercilio_ai",
      "https://github.com/vercilio",
      "https://linkedin.com/company/vercilio",
    ],
  };
}

// WebSite JSON-LD with a SearchAction so Google knows the in-site search
// schema (currently routes /faq for product questions).
export function websiteJsonLd(locale: Locale) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Vercilio",
    url: siteUrl,
    inLanguage: locale,
    publisher: {
      "@type": "Organization",
      name: "Vercilio",
    },
  };
}

// FAQPage JSON-LD. Takes the array of {question, answer} pairs the FAQ
// page already loops over so we don't duplicate the content in two places.
export function faqPageJsonLd(
  items: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export { routing };

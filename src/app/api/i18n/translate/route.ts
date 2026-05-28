import { NextResponse } from "next/server";
import { openRouterComplete } from "@/lib/openrouter";
import { normalizeLocale } from "@/lib/i18n";

const STATIC_UI_TRANSLATIONS: Partial<Record<string, Record<string, string>>> = {
  fr: {
    "Settings": "Parametres",
    "Personal info": "Informations personnelles",
    "Billing": "Facturation",
    "Contribution": "Contribution",
    "Security": "Securite",
    "First name": "Prenom",
    "Last name": "Nom",
    "Language": "Langue",
    "Save changes": "Enregistrer",
    "No email on file": "Aucun e-mail enregistre",
    "Member since": "Membre depuis",
    "Your details were updated.": "Vos informations ont ete mises a jour.",
    "Your payment went through. Your plan and credits have been refreshed.": "Votre paiement a bien ete pris en compte. Votre forfait et vos credits ont ete mis a jour.",
    "Checkout was canceled.": "Le paiement a ete annule.",
    "New Chat": "Nouveau chat",
    "Pinned": "Epingles",
    "Recent": "Recents",
    "Community": "Communaute",
    "Sign out": "Se deconnecter",
    "Search your threads...": "Rechercher dans vos discussions...",
    "Open app": "Ouvrir l'app",
    "Home": "Accueil",
    "Models": "Modeles",
    "Credits": "Credits",
    "Impact": "Impact",
    "FAQ": "FAQ",
    "Pricing": "Tarifs",
    "Log in": "Se connecter",
    "Sign up": "S'inscrire",
    "Free": "Gratuit",
    "Basic": "Essentiel",
    "Starter": "Starter",
    "Pro": "Pro",
  },
};

function extractJsonArray(content: string): string[] {
  const start = content.indexOf("[");
  const end = content.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Invalid translation payload");
  }
  const parsed = JSON.parse(content.slice(start, end + 1));
  if (!Array.isArray(parsed)) {
    throw new Error("Invalid translation payload");
  }
  return parsed.map((entry) => (typeof entry === "string" ? entry : String(entry)));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { locale?: string; strings?: string[] }
    | null;

  const locale = normalizeLocale(body?.locale);
  const strings = Array.isArray(body?.strings)
    ? body!.strings.filter((value) => typeof value === "string").slice(0, 120)
    : [];

  if (strings.length === 0) {
    return NextResponse.json({ translations: [] });
  }

  if (locale === "en") {
    return NextResponse.json({ translations: strings });
  }

  try {
    const completion = await openRouterComplete({
      model: "openai/gpt-4.1-mini",
      temperature: 0,
      provider: {
        sort: "price",
        allow_fallbacks: true,
        data_collection: "deny",
      },
      messages: [
        {
          role: "system",
          content:
            "You are a professional software localization engine. Translate UI copy from English into the requested language. Preserve brand names like Vercilio, OpenAI, GPT, Claude, Gemini, DeepSeek, Mistral, Stripe, and Clerk. Preserve emails, URLs, placeholders, punctuation, whitespace intent, and strings that should remain unchanged. Return only a JSON array of translated strings in the same order as the input.",
        },
        {
          role: "user",
          content: JSON.stringify({
            locale,
            strings,
          }),
        },
      ],
    });

    const translations = extractJsonArray(completion.content);
    return NextResponse.json({
      translations: strings.map((source, index) => translations[index] ?? source),
    });
  } catch {
    const staticMap = STATIC_UI_TRANSLATIONS[locale] ?? {};
    return NextResponse.json({
      translations: strings.map((source) => staticMap[source] ?? source),
    });
  }
}

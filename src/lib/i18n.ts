export const LOCALE_COOKIE_NAME = "vercilio-locale";

export const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "fr", label: "Francais" },
  { code: "es", label: "Espanol" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Portugues" },
  { code: "nl", label: "Nederlands" },
  { code: "sv", label: "Svenska" },
  { code: "no", label: "Norsk" },
  { code: "da", label: "Dansk" },
  { code: "fi", label: "Suomi" },
  { code: "pl", label: "Polski" },
  { code: "cs", label: "Cestina" },
  { code: "sk", label: "Slovencina" },
  { code: "hu", label: "Magyar" },
  { code: "ro", label: "Romana" },
  { code: "bg", label: "Bulgarski" },
  { code: "el", label: "Ellinika" },
  { code: "uk", label: "Ukrainska" },
  { code: "ru", label: "Russkiy" },
  { code: "tr", label: "Turkce" },
  { code: "ar", label: "Arabic" },
  { code: "he", label: "Ivrit" },
  { code: "fa", label: "Farsi" },
  { code: "hi", label: "Hindi" },
  { code: "bn", label: "Bangla" },
  { code: "ur", label: "Urdu" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "th", label: "Thai" },
  { code: "vi", label: "Tieng Viet" },
  { code: "zh-CN", label: "Jianti Zhongwen" },
  { code: "zh-TW", label: "Fantizi Zhongwen" },
  { code: "ja", label: "Nihongo" },
  { code: "ko", label: "Hangug-eo" },
  { code: "tl", label: "Filipino" },
  { code: "sw", label: "Kiswahili" },
  { code: "am", label: "Amharic" },
  { code: "sr", label: "Srpski" },
  { code: "hr", label: "Hrvatski" },
  { code: "sl", label: "Slovenscina" },
  { code: "et", label: "Eesti" },
  { code: "lv", label: "Latviesu" },
  { code: "lt", label: "Lietuviu" },
] as const;

export type AppLocale = (typeof LANGUAGE_OPTIONS)[number]["code"];

const SUPPORTED_LOCALES = new Set(LANGUAGE_OPTIONS.map((entry) => entry.code));

export function normalizeLocale(input: string | null | undefined): AppLocale {
  if (!input) return "en";
  const trimmed = input.trim();
  if (SUPPORTED_LOCALES.has(trimmed as AppLocale)) {
    return trimmed as AppLocale;
  }

  const canonical = trimmed.replace("_", "-");
  if (SUPPORTED_LOCALES.has(canonical as AppLocale)) {
    return canonical as AppLocale;
  }

  const lower = canonical.toLowerCase();
  if (lower.startsWith("zh-tw") || lower.startsWith("zh-hk")) return "zh-TW";
  if (lower.startsWith("zh")) return "zh-CN";

  const base =
    canonical.length >= 2 ? canonical.slice(0, 2).toLowerCase() : canonical;
  for (const entry of LANGUAGE_OPTIONS) {
    if (entry.code.toLowerCase() === base) {
      return entry.code;
    }
  }
  return "en";
}

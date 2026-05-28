"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LANGUAGE_OPTIONS, LOCALE_COOKIE_NAME, type AppLocale } from "@/lib/i18n";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  languages: typeof LANGUAGE_OPTIONS;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const textOriginals = new WeakMap<Text, string>();
const attrOriginals = new WeakMap<Element, Map<string, string>>();
const CACHE_KEY = "vercilio.i18n.cache.v2";

function shouldSkipElement(element: Element | null) {
  if (!element) return true;
  if (
    element.closest("[data-no-translate]") ||
    element.closest("script,style,noscript,svg,code,pre")
  ) {
    return true;
  }
  return false;
}

function collectTranslatables(root: HTMLElement) {
  const textEntries: Array<{ node: Text; source: string }> = [];
  const attrEntries: Array<{
    element: HTMLElement;
    attr: "placeholder" | "title" | "aria-label";
    source: string;
  }> = [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!(node instanceof Text)) return NodeFilter.FILTER_REJECT;
      const value = node.nodeValue ?? "";
      if (!value.trim()) return NodeFilter.FILTER_REJECT;
      if (!/[A-Za-z]/.test(value)) return NodeFilter.FILTER_REJECT;
      if (shouldSkipElement(node.parentElement)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let current = walker.nextNode();
  while (current) {
    const node = current as Text;
    const source = textOriginals.get(node) ?? node.nodeValue ?? "";
    if (!textOriginals.has(node)) textOriginals.set(node, source);
    textEntries.push({ node, source });
    current = walker.nextNode();
  }

  root
    .querySelectorAll<HTMLElement>("[placeholder],[title],[aria-label]")
    .forEach((element) => {
      if (shouldSkipElement(element)) return;
      for (const attr of ["placeholder", "title", "aria-label"] as const) {
        const value = element.getAttribute(attr);
        if (!value?.trim()) continue;
        if (!/[A-Za-z]/.test(value)) continue;
        const store = attrOriginals.get(element) ?? new Map<string, string>();
        if (!store.has(attr)) store.set(attr, value);
        attrOriginals.set(element, store);
        attrEntries.push({
          element,
          attr,
          source: store.get(attr) ?? value,
        });
      }
    });

  return { textEntries, attrEntries };
}

function readCache() {
  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? "{}") as Record<
      string,
      Record<string, string>
    >;
  } catch {
    return {};
  }
}

function writeCache(next: Record<string, Record<string, string>>) {
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(next));
}

async function translateBatch(locale: AppLocale, strings: string[]) {
  const response = await fetch("/api/i18n/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale, strings }),
  });
  if (!response.ok) {
    throw new Error("Failed to translate UI");
  }
  const data = (await response.json()) as { translations: string[] };
  return data.translations;
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: AppLocale;
}) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);
  const runIdRef = useRef(0);
  const cacheRef = useRef<Record<string, Record<string, string>> | null>(null);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(LOCALE_COOKIE_NAME, nextLocale);
    document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(nextLocale)}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LOCALE_COOKIE_NAME, locale);
    document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)}; path=/; max-age=31536000; samesite=lax`;
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    const root = document.body;
    if (!root) return;
    let observer: MutationObserver | null = null;
    let frame: number | null = null;
    const runId = ++runIdRef.current;
    if (cacheRef.current === null) {
      cacheRef.current = readCache();
    }

    if (locale === "en") {
      const { textEntries, attrEntries } = collectTranslatables(root);
      textEntries.forEach(({ node, source }) => {
        node.nodeValue = source;
      });
      attrEntries.forEach(({ element, attr, source }) => {
        element.setAttribute(attr, source);
      });
      return;
    }

    const applyTranslations = async () => {
      const { textEntries, attrEntries } = collectTranslatables(root);
      const cache = cacheRef.current ?? readCache();
      const localeCache = cache[locale] ?? {};
      const missing = Array.from(
        new Set(
          [...textEntries.map((entry) => entry.source), ...attrEntries.map((entry) => entry.source)].filter(
            (value) => !localeCache[value],
          ),
        ),
      );

      if (missing.length > 0) {
        const nextLocaleCache = { ...localeCache };
        for (let index = 0; index < missing.length; index += 100) {
          const chunk = missing.slice(index, index + 100);
          const translated = await translateBatch(locale, chunk);
          chunk.forEach((source, offset) => {
            const value = translated[offset] ?? source;
            if (value === source) {
              return;
            }
            nextLocaleCache[source] = value;
          });
          if (runIdRef.current !== runId) return;
        }
        cache[locale] = nextLocaleCache;
        writeCache(cache);
        cacheRef.current = cache;
      }

      const finalCache = (cacheRef.current ?? cache)[locale] ?? {};
      textEntries.forEach(({ node, source }) => {
        node.nodeValue = finalCache[source] ?? source;
      });
      attrEntries.forEach(({ element, attr, source }) => {
        element.setAttribute(attr, finalCache[source] ?? source);
      });
    };

    const schedule = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        void applyTranslations();
      });
    };

    void applyTranslations();
    observer = new MutationObserver(() => schedule());
    observer.observe(root, {
      childList: true,
      subtree: true,
    });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, languages: LANGUAGE_OPTIONS }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}

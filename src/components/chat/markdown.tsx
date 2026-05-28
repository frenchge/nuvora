"use client";

import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

function flattenChildren(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenChildren).join("");
  if (
    node &&
    typeof node === "object" &&
    "props" in node &&
    (node as { props?: { children?: ReactNode } }).props?.children !== undefined
  ) {
    return flattenChildren(
      (node as { props: { children?: ReactNode } }).props.children,
    );
  }
  return "";
}

function CodeBlock({
  language,
  code,
  isDark,
}: {
  language: string;
  code: string;
  isDark: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Some browsers (e.g. older Safari without HTTPS) reject clipboard
      // writes silently — there's nothing useful to do here.
    }
  }

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-border/60 bg-card text-sm shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          padding: "0.9rem 1rem",
          background: "transparent",
          fontSize: "0.8125rem",
          lineHeight: 1.6,
          color: "hsl(var(--foreground))",
        }}
        codeTagProps={{
          style: {
            fontFamily: "var(--font-mono, ui-monospace, monospace)",
            background: "transparent",
          },
        }}
        showLineNumbers={false}
        wrapLongLines={false}
      >
        {code.replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
}

export function Markdown({ content }: { content: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-foreground prose-code:text-foreground prose-code:before:hidden prose-code:after:hidden dark:prose-invert dark:prose-headings:text-white dark:prose-p:text-white dark:prose-strong:text-white dark:prose-li:text-white dark:prose-a:text-white dark:prose-code:text-white">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({
            inline,
            className,
            children,
            ...props
          }: ComponentPropsWithoutRef<"code"> & { inline?: boolean }) {
            const match = /language-(\w+)/.exec(className ?? "");
            const text = flattenChildren(children);

            // Inline code (`like this`) keeps the prose styling.
            if (inline || (!match && !text.includes("\n"))) {
              return (
                <code
                  className={cn(
                    "rounded-md border border-border/50 bg-muted/60 px-1.5 py-0.5 font-mono text-[0.85em]",
                    className,
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock
                language={match?.[1] ?? ""}
                code={text}
                isDark={isDark}
              />
            );
          },
          // Defuse the default <pre> wrap so it doesn't double-frame our
          // CodeBlock. We render the block straight from the `code` slot.
          pre({ children }: ComponentPropsWithoutRef<"pre">) {
            return <>{children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

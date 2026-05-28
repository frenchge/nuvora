import type { ReactNode } from "react";
import Link from "next/link";
import { Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <div className="grid min-h-screen lg:h-screen lg:min-h-0 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <div className="flex min-h-screen flex-col justify-between px-6 py-6 sm:px-10 lg:h-screen lg:min-h-0 lg:overflow-y-auto lg:px-12">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <BrandLogo className="h-10 w-10" priority />
              <span className="text-sm font-medium text-foreground/70">
                Nuvora
              </span>
            </Link>
            <Link
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Back home
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                AI with real impact
              </p>
              <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {subtitle}
              </p>
            </div>

            <div className="auth-shell-clerk">{children}</div>

            <div className="mt-8 space-y-3 text-sm text-foreground/75">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Use the best AI models in one calm workspace.
              </div>
              <div className="flex items-start gap-3">
                <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Paid usage helps fund verified tree planting.
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Your account, conversations, and billing stay in one place.
              </div>
            </div>
          </div>
        </div>

        <div className="relative hidden min-h-screen overflow-hidden lg:block lg:h-screen lg:min-h-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.pexels.com/photos/15286/pexels-photo.jpg)",
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,12,0.16),rgba(17,24,12,0.62))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,249,235,0.16),transparent_38%)]" />

          <div className="relative flex h-full flex-col items-center justify-center p-10 xl:p-14">
            <div className="w-full max-w-xl rounded-[2rem] bg-black/16 p-6 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/72">
                Why people switch
              </p>
              <h2 className="mt-4 max-w-lg text-balance text-4xl font-semibold leading-tight text-white">
                One subscription for great AI, with a little good built in.
              </h2>
              <p className="mt-4 max-w-md text-base leading-7 text-white/78">
                Instead of paying for AI in one place and donating somewhere
                else, Nuvora lets your monthly usage help support real
                environmental work automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

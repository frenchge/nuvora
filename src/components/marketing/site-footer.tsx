import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="container py-12 grid gap-8 md:grid-cols-4 text-sm">
        <div>
          <div className="flex items-center">
            <BrandLogo className="h-10 w-10" />
          </div>
          <p className="mt-3 text-muted-foreground">
            Use the best AI models in one place, with paid usage helping fund
            tree planting through our partners.
          </p>
        </div>
        <div>
          <div className="font-medium mb-3">Product</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
            <li><Link href="/#models" className="hover:text-foreground">Models</Link></li>
            <li><Link href="/#impact" className="hover:text-foreground">Impact</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-3">Company</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link href="/about" className="hover:text-foreground">About</Link></li>
            <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
            <li><Link href="/faq" className="hover:text-foreground">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-3">Legal</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link href="/legal/terms" className="hover:text-foreground">Terms</Link></li>
            <li><Link href="/legal/privacy" className="hover:text-foreground">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="container border-t border-border/60 py-6 text-xs text-muted-foreground flex justify-between">
        <span>&copy; {new Date().getFullYear()} Nuvora</span>
        <span>Supports verified environmental work · not a carbon offset claim</span>
      </div>
    </footer>
  );
}

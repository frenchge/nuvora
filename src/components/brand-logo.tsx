import Image from "next/image";
import logoBlack from "../../public/verciliologoblack.png";
import logoWhite from "../../public/verciliologowhite.png";
import { cn } from "@/lib/utils";

// Source PNGs are 3840 × 3840. Without a `sizes` hint next/image generates
// the full-res variant — Lighthouse measured 108 KiB downloaded for a logo
// rendered at 70 × 70. Cap the served width at 80px (covers Retina 2× for
// our largest 40px display) so the optimizer ships ~3 KiB instead.
const LOGO_SIZES = "80px";

export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex h-10 w-10 shrink-0 items-center",
        className,
      )}
    >
      <Image
        src={logoBlack}
        alt="Vercilio"
        priority={priority}
        sizes={LOGO_SIZES}
        className="h-full w-full object-contain dark:hidden"
      />
      <Image
        src={logoWhite}
        alt="Vercilio"
        priority={priority}
        sizes={LOGO_SIZES}
        className="hidden h-full w-full object-contain dark:block"
      />
    </span>
  );
}

import Image from "next/image";
import logoBlack from "../../public/optimized/verciliologoblack-192.png";
import logoWhite from "../../public/optimized/verciliologowhite-192.png";
import { cn } from "@/lib/utils";

// The original logo sources are 6250 × 6250 PNGs. We ship 192px variants
// instead so the navbar/footer logo stops pulling an oversized source for a
// 28–40px render.
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

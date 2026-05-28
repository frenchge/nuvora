import Image from "next/image";
import logoBlack from "../../public/nuvoralogoblack.png";
import logoWhite from "../../public/nuvoralogowhite.png";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn("relative inline-flex h-10 w-10 shrink-0 items-center", className)}>
      <Image
        src={logoBlack}
        alt="Nuvora"
        priority={priority}
        className="h-full w-full object-contain dark:hidden"
      />
      <Image
        src={logoWhite}
        alt="Nuvora"
        priority={priority}
        className="hidden h-full w-full object-contain dark:block"
      />
    </span>
  );
}

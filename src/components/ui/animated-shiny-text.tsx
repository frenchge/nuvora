"use client";

import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type FC,
} from "react";

import { cn } from "@/lib/utils";

export interface AnimatedShinyTextProps
  extends ComponentPropsWithoutRef<"span"> {
  shimmerWidth?: number;
}

export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 100,
  ...props
}) => {
  return (
    <span
      style={
        {
          "--shiny-width": `${shimmerWidth}px`,
        } as CSSProperties
      }
      className={cn(
        "text-foreground/40",
        // Shine effect — positions a fixed-width gradient and slides it
        // across via background-position; bg-clip-text reveals the text.
        "animate-shiny-text bg-clip-text bg-no-repeat",
        "[background-position:0_0] [background-size:var(--shiny-width)_100%]",
        // Shine gradient
        "bg-gradient-to-r from-transparent via-foreground/90 to-transparent",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};

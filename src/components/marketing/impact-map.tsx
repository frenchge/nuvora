"use client";

import * as React from "react";
import type { TCountryCode } from "countries-list";
import { DottedMap } from "@/components/ui/dotted-map";

type CountryCode = Lowercase<TCountryCode>;

type ImpactMarker = {
  lat: number;
  lng: number;
  size: number;
  pulse?: boolean;
  overlay: {
    countryCode: CountryCode;
  };
};

const MARKERS: ImpactMarker[] = [
  {
    lat: -4.0435,
    lng: 39.6682,
    size: 2.8,
    pulse: true,
    overlay: { countryCode: "ke" },
  },
  {
    lat: -12.9777,
    lng: -38.5016,
    size: 2.8,
    pulse: true,
    overlay: { countryCode: "br" },
  },
  {
    lat: 44.3148,
    lng: -85.6024,
    size: 2.8,
    pulse: true,
    overlay: { countryCode: "us" },
  },
];

export function ImpactMap() {
  const id = React.useId();

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-background via-background to-secondary/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.10),transparent_55%)]" />
      <div className="relative z-10 grid gap-6 p-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <div className="max-w-[18rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Where the work happens
          </p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Tree planting currently spans partner projects in Kenya, Brazil,
            and North America.
          </p>
        </div>

        <div className="relative h-[300px] min-w-0 md:h-[360px]">
          <DottedMap<ImpactMarker>
            className="absolute inset-0 text-foreground/18"
            markers={MARKERS}
            pulse
            dotRadius={0.23}
            markerColor="hsl(var(--primary))"
            renderMarkerOverlay={({ marker, x, y, r, index }) => {
              const { countryCode } = marker.overlay;
              const href = `https://flagcdn.com/w80/${countryCode}.webp`;
              const clipId = `${id}-flag-clip-${index}`.replace(/:/g, "-");
              const imgR = r * 1.05;

              return (
                <g style={{ pointerEvents: "none" }}>
                  <clipPath id={clipId}>
                    <circle cx={x} cy={y} r={imgR} />
                  </clipPath>

                  <image
                    href={href}
                    x={x - imgR}
                    y={y - imgR}
                    width={imgR * 2}
                    height={imgR * 2}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#${clipId})`}
                  />
                </g>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}

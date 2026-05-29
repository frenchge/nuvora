"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import Image from "next/image";

interface ScrollExpandMediaProps {
  mediaType?: "video" | "image";
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  subtitle?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
}

// Hero block on the desktop home page. Renders a small media frame that
// grows into a wide expanded shape as the user scrolls — the parallax
// effect they're used to seeing on the page.
//
// The previous implementation forced this by setting overflow:hidden on
// <html> and hijacking every wheel/touch event until the animation
// finished, which produced the 1-2 second scroll freeze. This version:
//   • Lets the page scroll like normal (no preventDefault, no lock).
//   • Provides ~120vh of scroll room (the outer section is taller than
//     the viewport).
//   • Sticks the visible area to the top while scrolling through that
//     room (`position: sticky`).
//   • Reads window.scrollY on each scroll (passive listener) and maps it
//     to the 0→1 expansion progress.
const ScrollExpandMedia = ({
  mediaType = "video",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  subtitle,
  date,
  scrollToExpand,
  textBlend,
  children,
}: ScrollExpandMediaProps) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isMobileState, setIsMobileState] = useState<boolean>(false);

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileState(window.innerWidth < 768);
    };
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    // The expand effect ignores mobile entirely; the mobile build of the
    // home page renders a static hero instead and never instantiates this
    // component below md anyway.
    if (isMobileState) {
      setProgress(1);
      return;
    }

    let rafId = 0;
    const compute = () => {
      rafId = 0;
      const node = sectionRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      // Section top is at 0 when we first reach it; we want progress to
      // ramp from 0 → 1 as the section's top moves from 0 to -(scrollRoom).
      const scrollRoom = rect.height - window.innerHeight;
      if (scrollRoom <= 0) {
        setProgress(1);
        return;
      }
      const raw = -rect.top / scrollRoom;
      const clamped = Math.min(Math.max(raw, 0), 1);
      setProgress(clamped);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isMobileState]);

  // Title can be split with "|" to control which words land on each row.
  const { firstWord, restOfTitle } = (() => {
    if (!title) return { firstWord: "", restOfTitle: "" };
    if (title.includes("|")) {
      const [top, ...rest] = title.split("|");
      return { firstWord: top.trim(), restOfTitle: rest.join("|").trim() };
    }
    const parts = title.split(" ");
    return {
      firstWord: parts[0] ?? "",
      restOfTitle: parts.slice(1).join(" "),
    };
  })();

  // Width/height eased from the small starting frame to the wide expanded
  // shape. The text shift is the same effect that lived in the old
  // implementation — first word translates left, rest translates right.
  const startW = isMobileState ? 300 : 360;
  const startH = isMobileState ? 380 : 440;
  const endW = isMobileState ? 950 : 1550;
  const endH = isMobileState ? 600 : 800;
  const mediaWidth = startW + progress * (endW - startW);
  const mediaHeight = startH + progress * (endH - startH);
  const textTranslateX = progress * (isMobileState ? 180 : 150);

  return (
    <section
      ref={sectionRef}
      // Outer section is taller than the viewport — this is the scroll
      // room that drives the expansion. The hero is "in motion" for the
      // first 120dvh of scroll, then the rest of the page continues.
      className="relative h-[220dvh] overflow-x-hidden"
    >
      <div className="sticky top-0 h-[100dvh] w-full">
        {/* Background image behind everything. */}
        <div className="absolute inset-0 z-0">
          <Image
            src={bgImageSrc}
            alt="Background"
            width={1920}
            height={1080}
            className="h-full w-full"
            style={{ objectFit: "cover", objectPosition: "center" }}
            priority
            sizes="100vw"
            quality={52}
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>

        <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center">
          {/* Media frame, centered, growing with scroll progress. */}
          <div
            className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl"
            style={{
              width: `${mediaWidth}px`,
              height: `${mediaHeight}px`,
              maxWidth: "95vw",
              maxHeight: "85vh",
              boxShadow: "0px 0px 50px rgba(0, 0, 0, 0.3)",
            }}
          >
            {mediaType === "video" ? (
              mediaSrc.includes("youtube.com") ? (
                <div className="pointer-events-none relative h-full w-full">
                  <iframe
                    width="100%"
                    height="100%"
                    src={
                      mediaSrc.includes("embed")
                        ? mediaSrc +
                          (mediaSrc.includes("?") ? "&" : "?") +
                          "autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1"
                        : mediaSrc.replace("watch?v=", "embed/") +
                          "?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=" +
                          mediaSrc.split("v=")[1]
                    }
                    className="h-full w-full rounded-xl"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <div
                    className="absolute inset-0 z-10"
                    style={{ pointerEvents: "none" }}
                  />
                  <div
                    className="absolute inset-0 rounded-xl bg-black/30"
                    style={{ opacity: 0.5 - progress * 0.3 }}
                  />
                </div>
              ) : (
                <div className="pointer-events-none relative h-full w-full">
                  {/* Mobile renders a static hero in the parent page, so
                      we never reach this branch below md. */}
                  {isMobileState ? (
                    posterSrc ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={posterSrc}
                        alt={title || "Hero background"}
                        fetchPriority="high"
                        loading="eager"
                        decoding="sync"
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : null
                  ) : (
                    <video
                      src={mediaSrc}
                      poster={posterSrc}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      className="h-full w-full rounded-xl object-cover"
                      controls={false}
                      disablePictureInPicture
                      disableRemotePlayback
                    />
                  )}
                  <div
                    className="absolute inset-0 z-10"
                    style={{ pointerEvents: "none" }}
                  />
                  <div
                    className="absolute inset-0 rounded-xl bg-black/30"
                    style={{ opacity: 0.5 - progress * 0.3 }}
                  />
                </div>
              )
            ) : (
              <div className="relative h-full w-full">
                <Image
                  src={mediaSrc}
                  alt={title || "Media content"}
                  width={1280}
                  height={720}
                  className="h-full w-full rounded-xl object-cover"
                />
                <div
                  className="absolute inset-0 rounded-xl bg-black/50"
                  style={{ opacity: 0.7 - progress * 0.3 }}
                />
              </div>
            )}

            <div className="relative z-10 mt-4 flex flex-col items-center text-center">
              {date && (
                <p
                  className="text-2xl text-blue-200"
                  style={{ transform: `translateX(-${textTranslateX}vw)` }}
                >
                  {date}
                </p>
              )}
              {scrollToExpand && (
                <p
                  className="text-center font-medium text-blue-200"
                  style={{ transform: `translateX(${textTranslateX}vw)` }}
                >
                  {scrollToExpand}
                </p>
              )}
            </div>
          </div>

          {/* Title sits over the media at start, slides apart as it expands. */}
          <div
            className={`relative z-10 flex w-full flex-col items-center justify-center gap-4 text-center ${
              textBlend ? "mix-blend-difference" : "mix-blend-normal"
            }`}
          >
            <h2
              className="text-4xl font-bold text-blue-200 md:text-5xl lg:text-6xl"
              style={{ transform: `translateX(-${textTranslateX}vw)` }}
            >
              {firstWord}
            </h2>
            <h2
              className="text-center text-4xl font-bold text-blue-200 md:text-5xl lg:text-6xl"
              style={{ transform: `translateX(${textTranslateX}vw)` }}
            >
              {restOfTitle}
            </h2>
            {subtitle && (
              <p
                className="mt-2 max-w-xl text-balance text-center text-base font-medium text-blue-200/85 md:text-lg lg:text-xl"
                style={{ opacity: 1 - progress }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Children (badge, hero title, CTAs) live in the bottom slice of
          the section, below the sticky 100dvh. They come into view
          naturally once the user has scrolled past the expansion phase. */}
      <div className="relative z-20 flex w-full flex-col px-8 py-10 md:px-16 lg:py-20">
        {children}
      </div>
    </section>
  );
};

export default ScrollExpandMedia;

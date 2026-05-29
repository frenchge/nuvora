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

// Hero block used on the desktop home page. Previously this intercepted
// every wheel / touch event and locked `document.documentElement.overflow`
// until the user scrolled enough to "fully expand" the media — visitors
// experienced this as a frozen page for the first second or two.
//
// We dropped the scroll-lock entirely. The media is now rendered at its
// final expanded size from first paint, the video starts loading
// immediately with autoPlay, and the page scrolls normally. The hero
// still acts as a tall, focused intro because the section is min-h-[100dvh],
// but it never blocks input.
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
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [isMobileState, setIsMobileState] = useState<boolean>(false);

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileState(window.innerWidth < 768);
    };
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Title can be manually split with a "|" — anything before goes on the
  // top line, anything after goes on the bottom line. Without a "|" we fall
  // back to splitting at the first whitespace (legacy behavior).
  const { firstWord, restOfTitle } = (() => {
    if (!title) return { firstWord: "", restOfTitle: "" };
    if (title.includes("|")) {
      const [top, ...rest] = title.split("|");
      return {
        firstWord: top.trim(),
        restOfTitle: rest.join("|").trim(),
      };
    }
    const parts = title.split(" ");
    return {
      firstWord: parts[0] ?? "",
      restOfTitle: parts.slice(1).join(" "),
    };
  })();

  return (
    <div ref={sectionRef} className="overflow-x-hidden">
      <section className="relative flex min-h-[100dvh] flex-col items-center justify-start">
        <div className="relative flex min-h-[100dvh] w-full flex-col items-center">
          {/* Background image, dimmed slightly. No fade-out tied to scroll
              progress — the hero just lives behind the media and content. */}
          <div className="absolute inset-0 z-0 h-full">
            <Image
              src={bgImageSrc}
              alt="Background"
              width={1920}
              height={1080}
              className="h-screen w-screen"
              style={{ objectFit: "cover", objectPosition: "center" }}
              priority
              sizes="100vw"
              quality={52}
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <div className="container relative z-10 mx-auto flex flex-col items-center justify-start">
            <div className="relative flex h-[100dvh] w-full flex-col items-center justify-center">
              {/* Media frame at full expanded size. */}
              <div
                className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl"
                style={{
                  width: isMobileState
                    ? "min(950px, 95vw)"
                    : "min(1550px, 92vw)",
                  height: isMobileState
                    ? "min(600px, 70vh)"
                    : "min(800px, 78vh)",
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
                      <div className="absolute inset-0 rounded-xl bg-black/20" />
                    </div>
                  ) : (
                    <div className="pointer-events-none relative h-full w-full">
                      {/* Mobile: show the poster instead of pulling the
                          1.8 MB clip. Desktop: video mounts immediately and
                          starts loading with preload="auto" so it paints
                          alongside the rest of the page. */}
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
                      <div className="absolute inset-0 rounded-xl bg-black/20" />
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
                    <div className="absolute inset-0 rounded-xl bg-black/30" />
                  </div>
                )}

                <div className="relative z-10 mt-4 flex flex-col items-center text-center">
                  {date && (
                    <p className="text-2xl text-blue-200">{date}</p>
                  )}
                  {scrollToExpand && (
                    <p className="text-center font-medium text-blue-200">
                      {scrollToExpand}
                    </p>
                  )}
                </div>
              </div>

              {/* Title and subtitle overlay the media at expanded size. */}
              <div
                className={`relative z-10 flex w-full flex-col items-center justify-center gap-4 text-center ${
                  textBlend ? "mix-blend-difference" : "mix-blend-normal"
                }`}
              >
                <h2 className="text-4xl font-bold text-blue-200 md:text-5xl lg:text-6xl">
                  {firstWord}
                </h2>
                <h2 className="text-center text-4xl font-bold text-blue-200 md:text-5xl lg:text-6xl">
                  {restOfTitle}
                </h2>
                {subtitle && (
                  <p className="mt-2 max-w-xl text-balance text-center text-base font-medium text-blue-200/85 md:text-lg lg:text-xl">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Children (badge / hero title / CTA buttons) live below the
                full-height media block and are visible immediately. */}
            <section className="flex w-full flex-col px-8 py-10 md:px-16 lg:py-20">
              {children}
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScrollExpandMedia;

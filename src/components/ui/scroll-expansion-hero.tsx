'use client';

import {
  useEffect,
  useRef,
  useState,
  ReactNode,
  TouchEvent,
  WheelEvent,
} from 'react';
import Image from 'next/image';

interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
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

const ScrollExpandMedia = ({
  mediaType = 'video',
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
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showContent, setShowContent] = useState<boolean>(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState<boolean>(false);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [isMobileState, setIsMobileState] = useState<boolean>(false);
  const [showDesktopVideo, setShowDesktopVideo] = useState<boolean>(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setScrollProgress(0);
    setShowContent(false);
    setMediaFullyExpanded(false);
  }, [mediaType]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollDelta = e.deltaY * 0.0009;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1,
        );
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
        const scrollDelta = deltaY * scrollFactor;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1,
        );
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }

        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = (): void => {
      setTouchStartY(0);
    };

    const handleScroll = (): void => {
      if (!mediaFullyExpanded) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('wheel', handleWheel as unknown as EventListener, {
      passive: false,
    });
    window.addEventListener('scroll', handleScroll as EventListener);
    window.addEventListener(
      'touchstart',
      handleTouchStart as unknown as EventListener,
      { passive: false },
    );
    window.addEventListener(
      'touchmove',
      handleTouchMove as unknown as EventListener,
      { passive: false },
    );
    window.addEventListener('touchend', handleTouchEnd as EventListener);

    return () => {
      window.removeEventListener(
        'wheel',
        handleWheel as unknown as EventListener,
      );
      window.removeEventListener('scroll', handleScroll as EventListener);
      window.removeEventListener(
        'touchstart',
        handleTouchStart as unknown as EventListener,
      );
      window.removeEventListener(
        'touchmove',
        handleTouchMove as unknown as EventListener,
      );
      window.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [scrollProgress, mediaFullyExpanded, touchStartY]);

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    if (mediaType !== 'video' || isMobileState) {
      setShowDesktopVideo(false);
      return;
    }

    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean };
      }
    ).connection;
    if (connection?.saveData) {
      return;
    }

    let cancelled = false;
    const schedule = () => {
      if (cancelled) return;
      setShowDesktopVideo(true);
    };

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let timeoutId: number | null = null;
    let idleId: number | null = null;

    if (typeof idleWindow.requestIdleCallback === 'function') {
      idleId = idleWindow.requestIdleCallback(schedule, { timeout: 1800 });
    } else {
      timeoutId = window.setTimeout(schedule, 1200);
    }

    return () => {
      cancelled = true;
      if (idleId !== null && typeof idleWindow.cancelIdleCallback === 'function') {
        idleWindow.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isMobileState, mediaType]);

  const mediaWidth = 300 + scrollProgress * (isMobileState ? 650 : 1250);
  const mediaHeight = 400 + scrollProgress * (isMobileState ? 200 : 400);
  const textTranslateX = scrollProgress * (isMobileState ? 180 : 150);

  // Title can be manually split with a "|" — anything before goes on the
  // top line, anything after goes on the bottom line. Without a "|" we fall
  // back to splitting at the first whitespace (legacy behavior).
  const { firstWord, restOfTitle } = (() => {
    if (!title) return { firstWord: '', restOfTitle: '' };
    if (title.includes('|')) {
      const [top, ...rest] = title.split('|');
      return {
        firstWord: top.trim(),
        restOfTitle: rest.join('|').trim(),
      };
    }
    const parts = title.split(' ');
    return {
      firstWord: parts[0] ?? '',
      restOfTitle: parts.slice(1).join(' '),
    };
  })();

  return (
    <div
      ref={sectionRef}
      className='overflow-x-hidden transition-colors duration-700 ease-in-out'
    >
      <section className='relative flex min-h-[100dvh] flex-col items-center justify-start'>
        <div className='relative flex min-h-[100dvh] w-full flex-col items-center'>
          <div
            className='absolute inset-0 z-0 h-full'
            style={{ opacity: 1 - scrollProgress }}
          >
            <Image
              src={bgImageSrc}
              alt='Background'
              width={1920}
              height={1080}
              className='h-screen w-screen'
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
              }}
              priority
              // Let Next/Image serve a viewport-sized variant from its
              // optimizer instead of a 1280×2560 master at every breakpoint.
              sizes='100vw'
              quality={52}
            />
            <div className='absolute inset-0 bg-black/10' />
          </div>

          <div className='container relative z-10 mx-auto flex flex-col items-center justify-start'>
            <div className='relative flex h-[100dvh] w-full flex-col items-center justify-center'>
              <div
                className='absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rounded-2xl transition-none'
                style={{
                  width: `${mediaWidth}px`,
                  height: `${mediaHeight}px`,
                  maxWidth: '95vw',
                  maxHeight: '85vh',
                  boxShadow: '0px 0px 50px rgba(0, 0, 0, 0.3)',
                }}
              >
                {mediaType === 'video' ? (
                  mediaSrc.includes('youtube.com') ? (
                    <div className='pointer-events-none relative h-full w-full'>
                      <iframe
                        width='100%'
                        height='100%'
                        src={
                          mediaSrc.includes('embed')
                            ? mediaSrc +
                              (mediaSrc.includes('?') ? '&' : '?') +
                              'autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1'
                            : mediaSrc.replace('watch?v=', 'embed/') +
                              '?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=' +
                              mediaSrc.split('v=')[1]
                        }
                        className='h-full w-full rounded-xl'
                        frameBorder='0'
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                        allowFullScreen
                      />
                      <div className='absolute inset-0 z-10' style={{ pointerEvents: 'none' }} />
                      <div
                        className='absolute inset-0 rounded-xl bg-black/30'
                        style={{ opacity: 0.5 - scrollProgress * 0.3 }}
                      />
                    </div>
                  ) : (
                    <div className='pointer-events-none relative h-full w-full'>
                      {/* On mobile we skip the video entirely and show the
                          poster image. The full clip is ~1.8 MB and pushed
                          LCP past 17s on phones; the poster covers the same
                          design surface for ~50 KB. */}
                      {isMobileState || !showDesktopVideo ? (
                        posterSrc ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={posterSrc}
                            alt={title || 'Hero background'}
                            fetchPriority={isMobileState ? 'high' : 'auto'}
                            decoding='async'
                            className='h-full w-full rounded-xl object-cover'
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
                          // The poster handles first paint; we defer loading
                          // the actual desktop video until idle so it doesn't
                          // compete with LCP text + CSS.
                          preload='none'
                          className='h-full w-full rounded-xl object-cover'
                          controls={false}
                          disablePictureInPicture
                          disableRemotePlayback
                        />
                      )}
                      <div className='absolute inset-0 z-10' style={{ pointerEvents: 'none' }} />
                      <div
                        className='absolute inset-0 rounded-xl bg-black/30'
                        style={{ opacity: 0.5 - scrollProgress * 0.3 }}
                      />
                    </div>
                  )
                ) : (
                  <div className='relative h-full w-full'>
                    <Image
                      src={mediaSrc}
                      alt={title || 'Media content'}
                      width={1280}
                      height={720}
                      className='h-full w-full rounded-xl object-cover'
                    />
                    <div
                      className='absolute inset-0 rounded-xl bg-black/50'
                      style={{ opacity: 0.7 - scrollProgress * 0.3 }}
                    />
                  </div>
                )}

                <div className='relative z-10 mt-4 flex flex-col items-center text-center transition-none'>
                  {date && (
                    <p
                      className='text-2xl text-blue-200'
                      style={{ transform: `translateX(-${textTranslateX}vw)` }}
                    >
                      {date}
                    </p>
                  )}
                  {scrollToExpand && (
                    <p
                      className='text-center font-medium text-blue-200'
                      style={{ transform: `translateX(${textTranslateX}vw)` }}
                    >
                      {scrollToExpand}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`relative z-10 flex w-full flex-col items-center justify-center gap-4 text-center transition-none ${
                  textBlend ? 'mix-blend-difference' : 'mix-blend-normal'
                }`}
              >
                <h2
                  className='text-4xl font-bold text-blue-200 transition-none md:text-5xl lg:text-6xl'
                  style={{ transform: `translateX(-${textTranslateX}vw)` }}
                >
                  {firstWord}
                </h2>
                <h2
                  className='text-center text-4xl font-bold text-blue-200 transition-none md:text-5xl lg:text-6xl'
                  style={{ transform: `translateX(${textTranslateX}vw)` }}
                >
                  {restOfTitle}
                </h2>
                {subtitle && (
                  <p
                    className='mt-2 max-w-xl text-balance text-center text-base font-medium text-blue-200/85 md:text-lg lg:text-xl'
                    style={{ opacity: 1 - scrollProgress }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <section
              className='flex w-full flex-col px-8 py-10 transition-opacity duration-700 md:px-16 lg:py-20'
              style={{ opacity: showContent ? 1 : 0 }}
            >
              {children}
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScrollExpandMedia;

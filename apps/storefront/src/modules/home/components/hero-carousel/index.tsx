"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { HeroCarouselSection, HeroSlide, HeroSplitPanel, SectionProps } from "@modules/home/types"

interface Props extends SectionProps {
  variant: "full_width" | "boxed" | "split"
}

// Tailwind aspect-ratio classes for mobile
function mobileAspectClass(aspect: string): string {
  if (aspect === "square") return "aspect-square"
  if (aspect === "wide") return "aspect-video"
  return "aspect-[4/3]" // rectangle (default)
}

function HeroOverlay({ overlay }: { overlay?: { enabled: boolean; opacity: number } }) {
  if (!overlay?.enabled) return null
  const o = Math.max(0, Math.min(100, overlay.opacity ?? 0)) / 100
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ backgroundColor: `rgba(0,0,0,${o})` }}
    />
  )
}

export function HeroCarousel({ section, variant }: Props) {
  const s = section as HeroCarouselSection
  const slides = s.slides ?? []
  const mobileAspect = s.mobile_aspect ?? "rectangle"

  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const advance = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length)
  }, [slides.length])

  useEffect(() => {
    if (slides.length <= 1 || paused) return
    timer.current = setInterval(advance, 5000)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [advance, slides.length, paused])

  if (slides.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-64"
        style={{ backgroundColor: "var(--brand-bg)" }}
      >
        <p className="text-sm" style={{ color: "var(--brand-secondary)" }}>
          No slides configured
        </p>
      </div>
    )
  }

  if (variant === "split") {
    return (
      <HeroCarouselSplit
        slides={slides}
        splitPanel={(s).split_panel ?? null}
        current={current}
        setCurrent={setCurrent}
        advance={advance}
        paused={paused}
        setPaused={setPaused}
        title={s.title}
        mobileAspect={mobileAspect}
        overlay={s.overlay}
      />
    )
  }

  const isBoxed = variant === "boxed"
  const slide = slides[current]
  const mAspect = mobileAspectClass(mobileAspect)

  return (
    <div
      className={[
        "relative overflow-hidden",
        isBoxed ? "content-container rounded-xl my-6" : "w-full",
        // Mobile: aspect ratio; Desktop: fixed vh height
        mAspect,
        isBoxed
          ? "sm:aspect-auto sm:h-[60vh] sm:min-h-[400px]"
          : "sm:aspect-auto sm:h-[75vh] sm:min-h-[400px]",
      ].join(" ")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides — fade in/out */}
      {slides.map((sl, i) => (
        <div
          key={sl.id}
          className={[
            "absolute inset-0 transition-opacity duration-700",
            i === current ? "opacity-100" : "opacity-0 pointer-events-none",
          ].join(" ")}
        >
          <picture className="block w-full h-full">
            {sl.mobile_image_url && (
              <source media="(max-width: 768px)" srcSet={sl.mobile_image_url} />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sl.image_url}
              alt={sl.heading ?? ""}
              className="w-full h-full object-cover"
            />
          </picture>
          <HeroOverlay overlay={s.overlay} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 gap-3">
            {sl.heading && (
              <h2
                className="text-3xl md:text-6xl font-bold text-white drop-shadow-lg max-w-3xl leading-tight"
                style={{ fontFamily: "var(--brand-font-heading)" }}
              >
                {sl.heading}
              </h2>
            )}
            {sl.subheading && (
              <p className="text-base md:text-xl text-white/90 drop-shadow max-w-xl">
                {sl.subheading}
              </p>
            )}
            {sl.cta_label && sl.cta_link && (
              <LocalizedClientLink
                href={sl.cta_link}
                className="mt-1 inline-flex items-center px-6 py-2.5 rounded-md font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--brand-primary)", color: "#fff" }}
              >
                {sl.cta_label}
              </LocalizedClientLink>
            )}
          </div>
        </div>
      ))}

      {/* Arrows — desktop only */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={advance}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Dot navigation */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={[
                "h-2 rounded-full transition-all duration-300",
                i === current ? "w-6 bg-white" : "w-2 bg-white/50",
              ].join(" ")}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      <h2 className="sr-only">{s.title}</h2>
    </div>
  )
}

// ─── Split layout ─────────────────────────────────────────────────────────────

interface SplitProps {
  slides: HeroSlide[]
  splitPanel: HeroSplitPanel | null
  current: number
  setCurrent: (i: number) => void
  advance: () => void
  paused: boolean
  setPaused: (p: boolean) => void
  title: string
  mobileAspect: string
  overlay?: { enabled: boolean; opacity: number }
}

function HeroCarouselSplit({
  slides,
  splitPanel,
  current,
  setCurrent,
  advance,
  paused,
  setPaused,
  title,
  mobileAspect,
  overlay,
}: SplitProps) {
  const mAspect = mobileAspectClass(mobileAspect)

  return (
    <div
      className="content-container my-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ═══ MOBILE: full-width carousel, no arrows, aspect-ratio based ═══ */}
      <div className={`relative block sm:hidden overflow-hidden rounded-xl bg-[var(--brand-bg)] ${mAspect}`}>
        {slides.map((slide, i) => (
          <SplitSlide key={slide.id} slide={slide} i={i} current={current} overlay={overlay} compact />
        ))}
        {slides.length > 1 && <SlideDots slides={slides} current={current} setCurrent={setCurrent} />}
        <h2 className="sr-only">{title}</h2>
      </div>

      {/* ═══ DESKTOP: side-by-side panels ═══ */}
      <div
        className="hidden sm:flex gap-3"
        style={{ height: "clamp(300px, 50vh, 560px)" }}
      >
        {/* Left: carousel */}
        <div className="relative flex-[63] overflow-hidden rounded-xl bg-[var(--brand-bg)]">
          {slides.map((slide, i) => (
            <SplitSlide key={slide.id} slide={slide} i={i} current={current} overlay={overlay} />
          ))}

          {slides.length > 1 && (
            <>
              <button
                onClick={() => setCurrent((current - 1 + slides.length) % slides.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={advance}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight size={18} />
              </button>
              <SlideDots slides={slides} current={current} setCurrent={setCurrent} />
            </>
          )}

          <h2 className="sr-only">{title}</h2>
        </div>

        {/* Right: static promo panel */}
        {splitPanel?.image_url ? (
          <div className="relative flex-[37] overflow-hidden rounded-xl bg-[var(--brand-bg)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={splitPanel.image_url}
              alt={splitPanel.heading ?? ""}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex flex-col items-start justify-end p-5 gap-2">
              {splitPanel.heading && (
                <h3
                  className="text-lg md:text-2xl font-bold text-white drop-shadow-lg leading-tight"
                  style={{ fontFamily: "var(--brand-font-heading)" }}
                >
                  {splitPanel.heading}
                </h3>
              )}
              {splitPanel.subheading && (
                <p className="text-xs md:text-sm text-white/85">{splitPanel.subheading}</p>
              )}
              {splitPanel.cta_label && splitPanel.cta_link && (
                <LocalizedClientLink
                  href={splitPanel.cta_link}
                  className="inline-flex items-center px-4 py-2 rounded-lg font-semibold text-xs transition-opacity hover:opacity-90 mt-1"
                  style={{ backgroundColor: "var(--brand-primary)", color: "#fff" }}
                >
                  {splitPanel.cta_label}
                </LocalizedClientLink>
              )}
            </div>
          </div>
        ) : (
          <div
            className="flex-[37] rounded-xl flex items-center justify-center text-sm"
            style={{
              backgroundColor: "var(--brand-bg)",
              color: "var(--brand-secondary)",
              border: "2px dashed currentColor",
            }}
          >
            Configure right panel &rarr;
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SplitSlide({
  slide,
  i,
  current,
  compact = false,
  overlay,
}: {
  slide: HeroSlide
  i: number
  current: number
  compact?: boolean
  overlay?: { enabled: boolean; opacity: number }
}) {
  return (
    <div
      className={[
        "absolute inset-0 transition-opacity duration-700",
        i === current ? "opacity-100" : "opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <picture className="block w-full h-full">
        {slide.mobile_image_url && (
          <source media="(max-width: 768px)" srcSet={slide.mobile_image_url} />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.image_url}
          alt={slide.heading ?? ""}
          className="w-full h-full object-cover"
        />
      </picture>
      <HeroOverlay overlay={overlay} />
      <div
        className={[
          "absolute inset-0 flex flex-col items-start justify-end gap-2",
          compact ? "p-4" : "p-6 md:p-8 gap-3",
        ].join(" ")}
      >
        {slide.heading && (
          <h2
            className={[
              "font-bold text-white drop-shadow-lg leading-tight",
              compact
                ? "text-xl max-w-[90%]"
                : "text-2xl md:text-4xl max-w-sm",
            ].join(" ")}
            style={{ fontFamily: "var(--brand-font-heading)" }}
          >
            {slide.heading}
          </h2>
        )}
        {slide.subheading && !compact && (
          <p className="text-sm md:text-base text-white/85 drop-shadow max-w-xs">
            {slide.subheading}
          </p>
        )}
        {slide.cta_label && slide.cta_link && (
          <LocalizedClientLink
            href={slide.cta_link}
            className={[
              "inline-flex items-center rounded-lg font-semibold transition-opacity hover:opacity-90",
              compact ? "px-4 py-1.5 text-xs" : "px-5 py-2.5 text-sm",
            ].join(" ")}
            style={{ backgroundColor: "var(--brand-primary)", color: "#fff" }}
          >
            {slide.cta_label}
          </LocalizedClientLink>
        )}
      </div>
    </div>
  )
}

function SlideDots({
  slides,
  current,
  setCurrent,
}: {
  slides: HeroSlide[]
  current: number
  setCurrent: (i: number) => void
}) {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
      {slides.map((_, i) => (
        <button
          key={i}
          onClick={() => setCurrent(i)}
          className={[
            "h-1.5 rounded-full transition-all duration-300",
            i === current ? "w-5 bg-white" : "w-1.5 bg-white/50",
          ].join(" ")}
          aria-label={`Go to slide ${i + 1}`}
        />
      ))}
    </div>
  )
}

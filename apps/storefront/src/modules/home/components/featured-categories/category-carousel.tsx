"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { HomepageCategory } from "@modules/home/types"

interface Props {
  categories: HomepageCategory[]
  countryCode: string
}

export function CategoryCarousel({ categories, countryCode }: Props) {
  const rail = useRef<HTMLDivElement>(null)

  const scroll = (dir: "left" | "right") => {
    rail.current?.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" })
  }

  return (
    <div className="relative">
      {/* Prev arrow — desktop only */}
      <button
        onClick={() => scroll("left")}
        className="hidden sm:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full items-center justify-center shadow-md transition-opacity hover:opacity-80"
        style={{ backgroundColor: "var(--brand-primary)", color: "#fff" }}
        aria-label="Scroll categories left"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Scroll rail — full-bleed on mobile (breaks out of the page's px-6 so items
          scroll all the way to the device edges); restored to normal at sm+ for arrows. */}
      <div
        ref={rail}
        className="flex gap-4 overflow-x-auto pb-2 -mx-6 ps-6 pe-6 sm:mx-0 sm:ps-0 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/${countryCode}/categories/${cat.handle}`}
            className="flex-none w-28 snap-start group flex flex-col items-center gap-2"
          >
            {/* White card */}
            <div className="relative w-24 h-24 rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden group-hover:shadow-md transition-shadow">
              {cat.thumbnail ? (
                <Image
                  src={cat.thumbnail}
                  alt={cat.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span
                  className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
                  style={{ color: "var(--brand-primary)" }}
                >
                  {cat.name[0]}
                </span>
              )}
            </div>
            {/* Label */}
            <span
              className="text-xs font-medium text-center leading-tight line-clamp-2"
              style={{ color: "var(--brand-text)" }}
            >
              {cat.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Next arrow — desktop only */}
      <button
        onClick={() => scroll("right")}
        className="hidden sm:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full items-center justify-center shadow-md transition-opacity hover:opacity-80"
        style={{ backgroundColor: "var(--brand-primary)", color: "#fff" }}
        aria-label="Scroll categories right"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

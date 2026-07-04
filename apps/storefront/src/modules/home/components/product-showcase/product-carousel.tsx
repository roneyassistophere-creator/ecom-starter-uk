"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { HomepageProduct } from "@modules/home/types"

interface Props {
  products: HomepageProduct[]
  countryCode: string
}

export function ProductCarousel({ products, countryCode }: Props) {
  const rail = useRef<HTMLDivElement>(null)

  const scroll = (dir: "left" | "right") => {
    rail.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" })
  }

  return (
    <div className="relative">
      <button
        onClick={() => scroll("left")}
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:shadow-md transition-shadow hidden sm:flex"
        aria-label="Scroll left"
      >
        <ChevronLeft size={18} />
      </button>

      <div
        ref={rail}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <div key={p.id} className="flex-none w-48 snap-start">
            <Link href={`/${countryCode}/products/${p.handle}`} className="group block">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-100 mb-3">
                {p.thumbnail ? (
                  <Image
                    src={p.thumbnail}
                    alt={p.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">
                    No image
                  </div>
                )}
              </div>
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--brand-text)" }}
              >
                {p.title}
              </p>
            </Link>
          </div>
        ))}
      </div>

      <button
        onClick={() => scroll("right")}
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:shadow-md transition-shadow hidden sm:flex"
        aria-label="Scroll right"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

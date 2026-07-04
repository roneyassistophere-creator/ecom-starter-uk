"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!images.length) return null

  const prev = () => setActiveIndex((i) => Math.max(0, i - 1))
  const next = () => setActiveIndex((i) => Math.min(images.length - 1, i + 1))

  return (
    <div className="flex gap-x-3">
      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex flex-col gap-y-2 w-[72px] shrink-0 overflow-y-auto max-h-[560px] pr-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`relative aspect-square w-full overflow-hidden rounded-lg border-2 transition-all duration-200 flex-shrink-0 ${
                i === activeIndex
                  ? "border-orange-400 shadow-sm"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              {img.url && (
                <Image
                  src={img.url}
                  alt={`View ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="72px"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="relative flex-1 aspect-square overflow-hidden rounded-2xl bg-ui-bg-subtle">
        {images[activeIndex]?.url && (
          <Image
            key={activeIndex}
            src={images[activeIndex].url}
            alt={`Product image ${activeIndex + 1}`}
            fill
            priority={activeIndex === 0}
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
        )}

        {/* Prev arrow */}
        {activeIndex > 0 && (
          <button
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-all duration-150 hover:scale-105"
          >
            <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Next arrow */}
        {activeIndex < images.length - 1 && (
          <button
            onClick={next}
            aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-all duration-150 hover:scale-105"
          >
            <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageGallery

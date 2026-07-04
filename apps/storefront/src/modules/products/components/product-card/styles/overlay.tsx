import { HttpTypes } from "@medusajs/types"
import { CardFields } from "@lib/data/store-settings"
import Image from "next/image"
import PlaceholderImage from "@modules/common/icons/placeholder-image"

type OverlayCardProps = {
  product: HttpTypes.StoreProduct
  cheapestPrice: {
    calculated_price: string
    original_price: string
    price_type: string
  } | null
  fields: CardFields
}

const OverlayCard = ({ product, cheapestPrice, fields }: OverlayCardProps) => {
  const src = product.thumbnail ?? product.images?.[0]?.url

  return (
    <div className="relative group aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100">
      {src ? (
        <Image
          src={src}
          alt={product.title ?? "Product"}
          fill
          className="object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          quality={75}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <PlaceholderImage size={24} />
        </div>
      )}

      {/* Gradient overlay — always present but intensifies on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent transition-opacity duration-200 group-hover:from-black/80" />

      {/* Text content pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-y-0.5">
        {fields.name !== false && (
          <p className="text-sm font-semibold text-white line-clamp-1 leading-snug drop-shadow">
            {product.title}
          </p>
        )}
        {fields.price !== false && cheapestPrice && (
          <div className="flex items-center gap-x-1.5">
            {cheapestPrice.price_type === "sale" && (
              <span className="text-xs text-white/70 line-through">
                {cheapestPrice.original_price}
              </span>
            )}
            <span className="text-sm font-bold text-white drop-shadow">
              {cheapestPrice.calculated_price}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default OverlayCard

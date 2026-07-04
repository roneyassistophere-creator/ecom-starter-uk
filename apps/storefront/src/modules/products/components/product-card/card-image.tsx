import Image from "next/image"
import PlaceholderImage from "@modules/common/icons/placeholder-image"

type CardImageProps = {
  thumbnail?: string | null
  images?: { url?: string }[] | null
  alt?: string
  /** Override aspect ratio class — defaults to "aspect-[4/5]" */
  aspectClass?: string
  /** Extra class names on the container */
  className?: string
}

const CardImage = ({
  thumbnail,
  images,
  alt = "Product image",
  aspectClass = "aspect-[4/5]",
  className = "",
}: CardImageProps) => {
  const src = thumbnail ?? images?.[0]?.url

  return (
    <div
      className={[
        "relative overflow-hidden bg-ui-bg-subtle",
        aspectClass,
        className,
      ].join(" ")}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
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
    </div>
  )
}

export default CardImage

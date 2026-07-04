import brand from "brand.config"
import { hasBrandLogo } from "@lib/util/brand-logo"

type Props = {
  /** Tailwind classes for the logo image (e.g. height). */
  imgClassName?: string
  /** Tailwind classes for the fallback store-name text. */
  textClassName?: string
}

/**
 * Renders the brand logo image when a logo file exists at `public/<logoPath>`,
 * and falls back to the store-name text when it doesn't. Server component.
 */
export default function BrandLogo({ imgClassName, textClassName }: Props) {
  if (hasBrandLogo()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={brand.logoPath} alt={brand.storeName} className={imgClassName} />
    )
  }
  return <span className={textClassName}>{brand.storeName}</span>
}

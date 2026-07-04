import { ImageResponse } from "next/og"
import brand from "brand.config"

// Brand-generated favicon (monogram on brand color). Re-skins automatically per store.
export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default function Icon() {
  const initial = brand.storeName.trim().charAt(0).toUpperCase() || "S"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: brand.colors.primary,
          color: "#ffffff",
          fontSize: 42,
          fontWeight: 700,
          borderRadius: 14,
        }}
      >
        {initial}
      </div>
    ),
    { ...size }
  )
}

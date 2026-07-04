import { ImageResponse } from "next/og"
import brand from "brand.config"

// Brand-generated social share image (replaces the default starter image).
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = brand.storeName

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: brand.colors.primary,
          color: "#ffffff",
          padding: 80,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1 }}>
          {brand.storeName}
        </div>
        <div style={{ fontSize: 32, marginTop: 28, opacity: 0.85 }}>
          {brand.tagline}
        </div>
      </div>
    ),
    { ...size }
  )
}

import { Heading, Text } from "@react-email/components"
import * as React from "react"
import brand from "../../../brand.config"
import { EmailLayout } from "./shared/layout"

export type FallbackProps = {
  subject?: string
  message?: string
}

export function FallbackEmail({ subject = "A message from us", message }: FallbackProps) {
  return (
    <EmailLayout preview={`${subject} — ${brand.storeName}`}>
      <Heading style={h1}>{subject}</Heading>
      {message ? (
        <Text style={para}>{message}</Text>
      ) : (
        <Text style={para}>
          You have a notification from {brand.storeName}. Please log in to your account for details.
        </Text>
      )}
    </EmailLayout>
  )
}

export default FallbackEmail

const h1: React.CSSProperties = { color: brand.colors.text, fontSize: "24px", fontWeight: "700", margin: "0 0 16px" }
const para: React.CSSProperties = { color: brand.colors.text, fontSize: "15px", lineHeight: "1.6", margin: "0 0 12px" }

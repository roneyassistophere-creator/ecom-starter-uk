import { Button, Heading, Section, Text, Hr } from "@react-email/components"
import * as React from "react"
import brand from "../../../brand.config"
import { EmailLayout } from "./shared/layout"

export type PasswordResetProps = {
  email: string
  reset_url: string
}

export function PasswordResetEmail({ email, reset_url }: PasswordResetProps) {
  return (
    <EmailLayout preview={`Reset your ${brand.storeName} password`}>
      <Heading style={h1}>Reset your password</Heading>
      <Text style={para}>Hi {email},</Text>
      <Text style={para}>
        We received a request to reset the password for your {brand.storeName} account. Click the button below to choose a new password. This link expires in 1 hour.
      </Text>

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Button href={reset_url} style={{ ...btn, backgroundColor: brand.colors.primary }}>
          Reset password
        </Button>
      </Section>

      <Hr style={divider} />
      <Text style={muted}>
        If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
      </Text>
      <Text style={muted}>
        If the button above doesn't work, copy and paste this URL into your browser:
        <br />
        <a href={reset_url} style={link}>{reset_url}</a>
      </Text>
    </EmailLayout>
  )
}

export default PasswordResetEmail

const h1: React.CSSProperties = { color: brand.colors.text, fontSize: "24px", fontWeight: "700", margin: "0 0 16px" }
const para: React.CSSProperties = { color: brand.colors.text, fontSize: "15px", lineHeight: "1.6", margin: "0 0 12px" }
const divider: React.CSSProperties = { borderColor: "#e5e7eb", margin: "16px 0" }
const muted: React.CSSProperties = { color: "#6b7280", fontSize: "13px", lineHeight: "1.6", margin: "0 0 8px" }
const link: React.CSSProperties = { color: brand.colors.primary, wordBreak: "break-all" }
const btn: React.CSSProperties = { borderRadius: "6px", color: "#ffffff", display: "inline-block", fontSize: "14px", fontWeight: "600", padding: "12px 24px", textDecoration: "none" }

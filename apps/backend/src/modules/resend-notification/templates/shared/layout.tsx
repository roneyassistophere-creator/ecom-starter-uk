import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components"
import * as React from "react"
import brand from "../../../../brand.config"

const storeUrl = process.env.STORE_URL ?? ""
const logoUrl = storeUrl ? `${storeUrl}${brand.logoPath}` : ""

type LayoutProps = {
  preview: string
  children: React.ReactNode
}

export function EmailLayout({ preview, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={{ ...header, backgroundColor: brand.colors.primary }}>
            {logoUrl ? (
              <Img
                src={logoUrl}
                alt={brand.storeName}
                height={40}
                style={logo}
              />
            ) : (
              <Text style={logoText}>{brand.storeName}</Text>
            )}
          </Section>

          {/* Content */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Section style={content}>{children as any}</Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} {brand.storeName}
            </Text>
            {brand.contact.address && (
              <Text style={footerMuted}>{brand.contact.address}</Text>
            )}
            {brand.contact.email && (
              <Text style={footerMuted}>{brand.contact.email}</Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: "#f6f6f6",
  fontFamily: `${brand.fonts.body}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
  margin: 0,
  padding: "32px 0",
}

const container: React.CSSProperties = {
  backgroundColor: brand.colors.background,
  borderRadius: "8px",
  margin: "0 auto",
  maxWidth: "600px",
  overflow: "hidden",
}

const header: React.CSSProperties = {
  padding: "24px 32px",
  textAlign: "center",
}

const logo: React.CSSProperties = {
  display: "block",
  margin: "0 auto",
}

const logoText: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: "700",
  margin: 0,
  textAlign: "center",
}

const content: React.CSSProperties = {
  padding: "32px",
}

const divider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "0 32px",
}

const footer: React.CSSProperties = {
  padding: "20px 32px",
  textAlign: "center",
}

const footerText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "0 0 4px",
}

const footerMuted: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0",
}

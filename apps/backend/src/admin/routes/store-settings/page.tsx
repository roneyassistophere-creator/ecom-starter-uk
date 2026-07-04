import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  AdjustmentsDone,
  CreditCardSolid,
  TruckFast,
  ChartBar,
  Key,
  EnvelopeSolid,
  ChatBubbleLeftRight,
  Photo,
  ExclamationCircle,
  Trash,
  ChevronDownMini,
  ChevronUpMini,
} from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  toast,
} from "@medusajs/ui"
import { useEffect, useState, type ComponentType, type ReactNode } from "react"
import { adminFetch } from "../../lib/api"
import { PaymentsSection } from "./sections/payments-section"
import { CouriersSection } from "./sections/couriers-section"
import { TrackingSection } from "./sections/tracking-section"
import { AuthSection } from "./sections/auth-section"
import { NotificationsSection } from "./sections/notifications-section"
import { StorageSection } from "./sections/storage-section"
import { ErrorLogSection } from "./sections/error-log-section"
import { DangerZoneSection } from "./sections/danger-zone-section"

// ── Collapsible category wrapper ───────────────────────────────────────────────

function CategorySection({
  title,
  description,
  icon: Icon,
  defaultOpen,
  children,
}: {
  title: string
  description: string
  icon: ComponentType<any>
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen))
  return (
    <Container className="p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-ui-bg-base-hover transition-colors"
      >
        <div className="flex items-center gap-x-3">
          <Icon className="text-ui-fg-subtle" />
          <div>
            <Text size="base" weight="plus">{title}</Text>
            <Text size="small" className="text-ui-fg-subtle">{description}</Text>
          </div>
        </div>
        {open ? <ChevronUpMini className="text-ui-fg-muted" /> : <ChevronDownMini className="text-ui-fg-muted" />}
      </button>
      {open && (
        <div className="border-t border-ui-border-base bg-ui-bg-subtle px-4 py-4">
          {children}
        </div>
      )}
    </Container>
  )
}

// ── Contact buttons (storefront) ───────────────────────────────────────────────

function ContactSettings() {
  const [whatsapp, setWhatsapp] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminFetch<{ setting: { whatsapp_number: string | null; order_phone: string | null } }>("/store-settings")
      .then(({ setting }) => {
        setWhatsapp(setting?.whatsapp_number ?? "")
        setPhone(setting?.order_phone ?? "")
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminFetch("/store-settings", {
        method: "POST",
        body: JSON.stringify({
          whatsapp_number: whatsapp.trim() || null,
          order_phone: phone.trim() || null,
        }),
      })
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="px-6 py-6 flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-1">
          <Label>WhatsApp Number</Label>
          <Text size="xsmall" className="text-ui-fg-muted">
            Include country code, e.g. +8801712345678. Leave blank to hide the WhatsApp button.
          </Text>
          <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+8801712345678" disabled={loading} />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label>Order Phone Number</Label>
          <Text size="xsmall" className="text-ui-fg-muted">
            Phone number for the "Call For Order" button. Leave blank to hide.
          </Text>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801712345678" disabled={loading} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={saving} disabled={loading || saving}>
          Save Contact Buttons
        </Button>
      </div>
    </Container>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

const StoreSettingsPage = () => {
  return (
    <div className="flex flex-col gap-y-4 p-4 max-w-3xl">
      <div>
        <Heading level="h1">Store Settings</Heading>
        <Text size="small" className="text-ui-fg-subtle mt-1">
          Integration secrets (API keys, tokens) are set as environment variables on your server.
          Each card shows whether it is configured and lets you turn it on or off.
        </Text>
      </div>

      <CategorySection title="Storefront Contact Buttons" description="WhatsApp & call buttons on product pages" icon={ChatBubbleLeftRight} defaultOpen>
        <ContactSettings />
      </CategorySection>

      <CategorySection title="Payments" description="Stripe, SSLCommerz, bKash" icon={CreditCardSolid}>
        <PaymentsSection />
      </CategorySection>

      <CategorySection title="Couriers" description="Steadfast, RedX, Pathao" icon={TruckFast}>
        <CouriersSection />
      </CategorySection>

      <CategorySection title="Tracking & Analytics" description="Meta Pixel, GA4, Conversions API" icon={ChartBar}>
        <TrackingSection />
      </CategorySection>

      <CategorySection title="Authentication" description="Google Sign-In, Phone OTP" icon={Key}>
        <AuthSection />
      </CategorySection>

      <CategorySection title="Notifications" description="Email (Resend), SMS" icon={EnvelopeSolid}>
        <NotificationsSection />
      </CategorySection>

      <CategorySection title="Storage Cleanup" description="Remove unused files from your storage bucket" icon={Photo}>
        <StorageSection />
      </CategorySection>

      <CategorySection title="Error Log" description="Errors customers hit on the storefront" icon={ExclamationCircle}>
        <ErrorLogSection />
      </CategorySection>

      <CategorySection title="Danger Zone" description="Hard reset inventory, orders, and customer data" icon={Trash}>
        <DangerZoneSection />
      </CategorySection>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Store Settings",
  icon: AdjustmentsDone,
  rank: 99,
})

export default StoreSettingsPage

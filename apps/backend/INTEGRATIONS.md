# Adding an Integration Setup Guide

The admin dashboard has a generic "Integration Setup Guide" system. Adding a new integration takes two steps and zero changes to any shared panel code.

---

## How it works

```
src/integrations/registry.ts
  → declares env vars + optional test handler per integration

src/api/admin/integrations/[id]/status/route.ts
  → GET: returns booleans + masked display values (never raw secrets)

src/api/admin/integrations/[id]/test/route.ts
  → POST: runs the integration's test handler, surfaces real errors

src/admin/components/integration-setup-guide/index.tsx
  → generic React component, zero integration-specific code inside
```

---

## Step 1 — Register the integration in `src/integrations/registry.ts`

Add a new entry to the `REGISTRY` object:

```typescript
sms: {
  id: "sms",
  label: "SMS Notifications (Twilio)",
  env: [
    { key: "TWILIO_ACCOUNT_SID", required: true, secret: true },
    { key: "TWILIO_AUTH_TOKEN",  required: true, secret: true },
    { key: "TWILIO_FROM_NUMBER", required: true, mask: "phone" },
  ],
  test: async (container, input) => {
    if (!process.env.TWILIO_ACCOUNT_SID)
      return { success: false, message: "TWILIO_ACCOUNT_SID not set." }
    // ... call Twilio client here
    return { success: true, message: `Test SMS sent to ${input.to}` }
  },
},
```

### EnvVarDef fields

| Field | Type | Effect |
|-------|------|--------|
| `key` | `string` | The env var name |
| `required` | `boolean` | Included in the `configured` check |
| `secret` | `boolean` | `display` is always `null` — never shown in UI |
| `mask` | `"email"` | Shows first 2 chars of local part, then `***@domain` |
| *(none)* | — | Shows the raw value in the UI (safe for non-sensitive strings like display names) |

The `test` handler receives the Medusa container and the body sent from the UI (`{ to: "..." }`). Return a `{ success, message }` object — the **exact** message is shown to the operator for self-diagnosis.

---

## Step 2 — Mount `<IntegrationSetupGuide>` on any admin page

```tsx
import { IntegrationSetupGuide, type IntegrationGuideConfig } from "../../components/integration-setup-guide"

const SMS_GUIDE: IntegrationGuideConfig = {
  integrationId: "sms",
  title: "SMS Notification Setup",
  intro: "Connect Twilio to send order updates via SMS.",
  steps: [
    {
      title: "Create a Twilio account",
      body: "Sign up at twilio.com and purchase a phone number.",
      link: { label: "Open Twilio", url: "https://twilio.com" },
    },
    {
      title: "Confirm setup",
      body: "After restarting, the status banner above turns green.",
      envCheck: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"],
    },
  ],
  externalEnvStep: {
    varsToSet: [
      { name: "TWILIO_ACCOUNT_SID",  description: "Your Twilio Account SID" },
      { name: "TWILIO_AUTH_TOKEN",   description: "Your Twilio Auth Token" },
      { name: "TWILIO_FROM_NUMBER",  description: "Your Twilio phone number", example: "+18005551234" },
    ],
    note: "Keys are never stored in the admin. Add them to .env and restart the server.",
  },
  test: {
    enabled: true,
    inputLabel: "Send test SMS to",
    inputPlaceholder: "+1...",
    buttonLabel: "Send test SMS",
  },
  troubleshooting: [
    { problem: "Banner stays amber", fix: "Restart the server after editing .env." },
  ],
}

// In your page component:
export default function SmsPage() {
  return <IntegrationSetupGuide config={SMS_GUIDE} />
}
```

That's it. The component handles status fetching, step completion indicators, the external-env callout, test sending, and troubleshooting — all driven by your config object.

---

## What the component does NOT contain

`src/admin/components/integration-setup-guide/index.tsx` has zero integration-specific code. All content (step text, URLs, variable names, error messages, troubleshooting) is supplied by the caller via `config`. The component is purely structural.

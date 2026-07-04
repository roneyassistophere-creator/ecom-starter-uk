import {
  Badge,
  Button,
  Container,
  Drawer,
  Input,
  Label,
  Text,
  toast,
} from "@medusajs/ui"
import {
  ArrowUpRightOnBox,
  BookOpen,
  CheckCircleSolid,
  XCircleSolid,
} from "@medusajs/icons"
import { useEffect, useState, type ReactNode } from "react"
import { adminFetch } from "../../lib/api"

// ── Types exposed for consumers ──────────────────────────────────────────────

export type GuideEnvVar = {
  name: string
  description: string
  example?: string
}

export type GuideStep = {
  title: string
  body: string
  link?: { label: string; url: string }
  envCheck?: string[]
}

export type IntegrationGuideConfig = {
  integrationId: string
  title: string
  intro: string
  steps: GuideStep[]
  externalEnvStep: {
    varsToSet: GuideEnvVar[]
    note: string
  }
  test?: {
    enabled: boolean
    inputLabel: string
    inputPlaceholder?: string
    buttonLabel: string
  }
  troubleshooting: Array<{ problem: string; fix: string }>
}

// ── Status shape from API ─────────────────────────────────────────────────────

type StatusVar = {
  key: string
  present: boolean
  required: boolean
  display: string | null
}

type IntegrationStatus = {
  id: string
  label: string
  configured: boolean
  vars: StatusVar[]
}

// Reusable "not configured" notice — used across all provider cards.
export function NotConfiguredNotice({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={`rounded-lg bg-ui-tag-orange-bg border border-ui-tag-orange-border px-4 py-3 ${className ?? ""}`}>
      <Text size="small" className="text-ui-tag-orange-text">
        {children ?? (
          <>Not configured yet — open the <b>Guide</b> to set it up, or contact your developer. Until then its options stay disabled.</>
        )}
      </Text>
    </div>
  )
}

// ── Guide body sections (rendered inside the Drawer) ──────────────────────────

function GuideSteps({ steps, envPresence }: { steps: GuideStep[]; envPresence: Record<string, boolean> }) {
  return (
    <div className="flex flex-col gap-y-5">
      <Text size="small" leading="compact" weight="plus" className="text-ui-fg-subtle uppercase tracking-wide">
        Guide
      </Text>
      {steps.map((step, i) => {
        const stepDone =
          step.envCheck && step.envCheck.length > 0
            ? step.envCheck.every((key) => envPresence[key])
            : null
        return (
          <div key={i} className="flex gap-x-4">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-ui-bg-component border border-ui-border-base flex items-center justify-center">
              <Text size="xsmall" weight="plus">{i + 1}</Text>
            </div>
            <div className="flex flex-col gap-y-1 flex-1 pb-5 border-b border-ui-border-base last:border-0 last:pb-0">
              <div className="flex items-center gap-x-2">
                <Text size="small" weight="plus">{step.title}</Text>
                {stepDone === true && <CheckCircleSolid className="text-ui-tag-green-icon w-4 h-4" />}
                {stepDone === false && <XCircleSolid className="text-ui-tag-orange-icon w-4 h-4" />}
              </div>
              <Text size="small" className="text-ui-fg-subtle">{step.body}</Text>
              {step.link && (
                <a href={step.link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-x-1 mt-1">
                  <Button variant="secondary" size="small">
                    {step.link.label}
                    <ArrowUpRightOnBox className="ml-1" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function GuideEnvStep({ externalEnvStep }: { externalEnvStep: IntegrationGuideConfig["externalEnvStep"] }) {
  if (externalEnvStep.varsToSet.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-ui-border-base px-6 py-5">
        <Text size="small" className="text-ui-fg-subtle">{externalEnvStep.note}</Text>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-y-4 rounded-lg border-2 border-dashed border-ui-border-base px-6 py-5">
      <Badge color="blue" size="xsmall">Done outside the admin dashboard</Badge>
      <div className="flex flex-col gap-y-1">
        <Text size="small" weight="plus">Add environment variables to your server</Text>
        <Text size="small" className="text-ui-fg-subtle">{externalEnvStep.note}</Text>
      </div>
      <div className="flex flex-col gap-y-3">
        {externalEnvStep.varsToSet.map((v) => (
          <div key={v.name} className="flex flex-col gap-y-0.5">
            <div className="flex items-baseline gap-x-2">
              <Text size="small" weight="plus" className="font-mono">{v.name}</Text>
              <Text size="xsmall" className="text-ui-fg-subtle">{v.description}</Text>
            </div>
            {v.example && (
              <Text size="xsmall" className="text-ui-fg-muted font-mono pl-2">e.g. {v.example}</Text>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function GuideTestSection({
  testConfig, testInput, setTestInput, testing, testResult, onTest,
}: {
  testConfig: NonNullable<IntegrationGuideConfig["test"]>
  testInput: string
  setTestInput: (v: string) => void
  testing: boolean
  testResult: { success: boolean; message: string } | null
  onTest: () => void
}) {
  if (!testConfig.enabled) return null
  return (
    <div className="flex flex-col gap-y-4">
      <Text size="small" weight="plus">Send a test</Text>
      <div className="flex items-end gap-x-3">
        <div className="flex flex-col gap-y-1 flex-1">
          <Label>{testConfig.inputLabel}</Label>
          <Input value={testInput} onChange={(e) => setTestInput(e.target.value)} placeholder={testConfig.inputPlaceholder} disabled={testing} />
        </div>
        <Button onClick={onTest} isLoading={testing} disabled={testing}>
          {testConfig.buttonLabel}
        </Button>
      </div>
      {testResult && (
        <div className={`rounded-lg px-4 py-3 ${testResult.success ? "bg-ui-tag-green-bg border border-ui-tag-green-border" : "bg-ui-tag-red-bg border border-ui-tag-red-border"}`}>
          <Text size="small" className={testResult.success ? "text-ui-tag-green-text" : "text-ui-tag-red-text"}>{testResult.message}</Text>
        </div>
      )}
    </div>
  )
}

function GuideTroubleshooting({ items }: { items: IntegrationGuideConfig["troubleshooting"] }) {
  const [open, setOpen] = useState<number | null>(null)
  if (items.length === 0) return null
  return (
    <div className="flex flex-col gap-y-3">
      <Text size="small" weight="plus" className="text-ui-fg-subtle uppercase tracking-wide">Troubleshooting</Text>
      {items.map((item, i) => (
        <div key={i} className="border-b border-ui-border-base last:border-0 pb-3 last:pb-0">
          <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between py-1 text-left">
            <Text size="small" weight="plus">{item.problem}</Text>
            <Text size="small" className="text-ui-fg-muted ml-2 flex-shrink-0">{open === i ? "−" : "+"}</Text>
          </button>
          {open === i && <Text size="small" className="text-ui-fg-subtle mt-1 pb-1">{item.fix}</Text>}
        </div>
      ))}
    </div>
  )
}

// ── Main component: compact card + Guide drawer ───────────────────────────────

export function IntegrationSetupGuide({
  config,
  rightSlot,
  onStatusChange,
  showNotice = true,
  children,
}: {
  config: IntegrationGuideConfig
  /** Optional control rendered in the card header (e.g. an enable toggle). */
  rightSlot?: ReactNode
  /** Called whenever the configured status is (re)loaded. */
  onStatusChange?: (configured: boolean) => void
  /** Show the amber "not configured" notice in the card when unconfigured. */
  showNotice?: boolean
  /** Extra content rendered below the header inside the same card. */
  children?: ReactNode
}) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [testInput, setTestInput] = useState("")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const fetchStatus = async () => {
    setStatusLoading(true)
    try {
      const result = await adminFetch<IntegrationStatus>(`/integrations/${config.integrationId}/status`)
      setStatus(result)
      onStatusChange?.(result.configured)
    } catch {
      // silently ignore
    } finally {
      setStatusLoading(false)
    }
  }

  useEffect(() => { fetchStatus() }, [config.integrationId])

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await adminFetch<{ success: boolean; message: string }>(
        `/integrations/${config.integrationId}/test`,
        { method: "POST", body: JSON.stringify({ to: testInput }) }
      )
      setTestResult(result)
      if (result.success) toast.success(result.message)
      else toast.error(result.message)
    } catch (err: any) {
      const message = err.message || "Request failed"
      setTestResult({ success: false, message })
      toast.error(message)
    } finally {
      setTesting(false)
    }
  }

  const envPresence: Record<string, boolean> = {}
  status?.vars.forEach((v) => { envPresence[v.key] = v.present })
  const configured = status?.configured ?? false

  return (
    <Container className="overflow-hidden p-0">
      <div className="flex items-center justify-between px-6 py-4 gap-x-4">
        <Text size="base" weight="plus">{config.title}</Text>
        <div className="flex items-center gap-x-2 flex-shrink-0">
          {statusLoading ? (
            <Badge color="grey" size="xsmall">Checking…</Badge>
          ) : configured ? (
            <Badge color="green" size="xsmall">Configured</Badge>
          ) : (
            <Badge color="orange" size="xsmall">Not configured</Badge>
          )}

          {rightSlot}

          <Drawer open={open} onOpenChange={setOpen}>
            <Drawer.Trigger asChild>
              <Button size="small" variant="secondary">
                <BookOpen className="mr-1" />
                Guide
              </Button>
            </Drawer.Trigger>
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>{config.title} — Guide</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body className="overflow-y-auto flex flex-col gap-y-6">
                <div className="flex items-start justify-between gap-x-4">
                  <Text size="small" className="text-ui-fg-subtle">{config.intro}</Text>
                  <Button variant="secondary" size="small" onClick={fetchStatus} isLoading={statusLoading}>Refresh</Button>
                </div>
                {status?.vars.some((v) => v.display) && (
                  <div className="flex flex-col gap-y-1">
                    {status.vars.filter((v) => v.display).map((v) => (
                      <Text key={v.key} size="xsmall" className="text-ui-fg-muted font-mono">{v.key}: {v.display}</Text>
                    ))}
                  </div>
                )}
                <GuideSteps steps={config.steps} envPresence={envPresence} />
                <GuideEnvStep externalEnvStep={config.externalEnvStep} />
                {config.test && (
                  <GuideTestSection
                    testConfig={config.test}
                    testInput={testInput}
                    setTestInput={setTestInput}
                    testing={testing}
                    testResult={testResult}
                    onTest={handleTest}
                  />
                )}
                <GuideTroubleshooting items={config.troubleshooting} />
              </Drawer.Body>
            </Drawer.Content>
          </Drawer>
        </div>
      </div>

      {(children || (showNotice && !statusLoading && !configured)) && (
        <div className="border-t border-ui-border-base px-6 py-4 flex flex-col gap-y-4">
          {showNotice && !statusLoading && !configured && <NotConfiguredNotice />}
          {children}
        </div>
      )}
    </Container>
  )
}

export default IntegrationSetupGuide

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Text, Badge, Button, Prompt, toast } from "@medusajs/ui"
import type { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { useState } from "react"
import { adminFetch } from "../lib/api"

type NormalizedStatus = "pending_booking" | "booked" | "pending" | "in_transit" | "delivered" | "returned" | "cancelled" | "unknown"

const STATUS_LABELS: Record<string, { label: string; color: "grey" | "blue" | "green" | "orange" | "red" }> = {
  pending_booking: { label: "Pending booking", color: "grey" },
  booked:          { label: "Booked",          color: "blue" },
  pending:         { label: "Pending pickup",  color: "grey" },
  in_transit:      { label: "In transit",      color: "blue" },
  delivered:       { label: "Delivered",       color: "green" },
  returned:        { label: "Returned",        color: "orange" },
  cancelled:       { label: "Cancelled",       color: "red" },
  unknown:         { label: "Unknown",         color: "grey" },
}

const COURIER_NAMES: Record<string, string> = {
  steadfast: "Steadfast Courier",
  redx:      "RedX",
  pathao:    "Pathao",
}

function TrackingWidget({ data: order }: DetailWidgetProps<HttpTypes.AdminOrder>) {
  const [busy, setBusy] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)

  const fulfillments: any[] = (order as any).fulfillments ?? []
  const courierFulfillments = fulfillments.filter(
    (f: any) => f.provider_id === "fp_courier_courier" && f.data?.courier_id
  )

  if (courierFulfillments.length === 0) return null

  const alreadyReturned = courierFulfillments.some((f: any) => f.data?.courier_status === "returned")
  const allCancelled = courierFulfillments.every((f: any) => f.data?.courier_status === "cancelled")

  const handleReturn = async () => {
    setBusy(true)
    try {
      const r = await adminFetch<{ success: boolean; created: boolean; items?: number; message?: string }>(
        `/orders/${(order as any).id}/mark-returned`,
        { method: "POST" }
      )
      if (r.created) {
        toast.success(`Return recorded — ${r.items} item type(s) restocked`)
        setTimeout(() => location.reload(), 800)
      } else {
        toast.info(r.message || "Nothing to return")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to record return")
    } finally {
      setBusy(false)
      setPromptOpen(false)
    }
  }

  return (
    <Container className="divide-y divide-ui-border-base p-0">
      <div className="px-6 py-4">
        <Text size="base" weight="plus">
          Courier Tracking
        </Text>
      </div>

      {courierFulfillments.map((f: any) => {
        const d = f.data ?? {}
        const statusInfo = STATUS_LABELS[d.courier_status as NormalizedStatus] ?? STATUS_LABELS.unknown
        const courierName = COURIER_NAMES[d.courier_id] ?? d.courier_id ?? "Courier"

        return (
          <div key={f.id} className="flex flex-col gap-y-2 px-6 py-4">
            <div className="flex items-center justify-between">
              <Text size="small" weight="plus" className="text-ui-fg-base">
                {courierName}
              </Text>
              <Badge color={statusInfo.color} size="2xsmall">
                {statusInfo.label}
              </Badge>
            </div>

            {d.tracking_id && (
              <div className="flex items-center gap-x-2">
                <Text size="small" className="text-ui-fg-subtle">
                  Tracking #:
                </Text>
                <Text size="small" className="text-ui-fg-base font-mono">
                  {d.tracking_id}
                </Text>
              </div>
            )}

            {d.consignment_id && d.consignment_id !== d.tracking_id && (
              <div className="flex items-center gap-x-2">
                <Text size="small" className="text-ui-fg-subtle">
                  Consignment:
                </Text>
                <Text size="small" className="text-ui-fg-base font-mono">
                  {d.consignment_id}
                </Text>
              </div>
            )}
          </div>
        )
      })}

      {!allCancelled && (
        <div className="px-6 py-4 flex items-center justify-between gap-x-3">
          <Text size="small" className="text-ui-fg-subtle">
            {alreadyReturned
              ? "This order was returned — items have been restocked."
              : "If the parcel came back, record the return to restock inventory. No refund is issued."}
          </Text>
          <Button
            size="small"
            variant="secondary"
            disabled={busy || alreadyReturned}
            isLoading={busy}
            onClick={() => setPromptOpen(true)}
          >
            {alreadyReturned ? "Returned" : "Mark returned & restock"}
          </Button>
        </div>
      )}

      <Prompt open={promptOpen} onOpenChange={setPromptOpen} variant="confirmation">
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>Mark this order as returned?</Prompt.Title>
            <Prompt.Description>
              This creates a return for all items on the order and adds their quantities back to
              inventory. No refund is issued — handle any refund manually. This can't be undone here.
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel disabled={busy}>Cancel</Prompt.Cancel>
            <Prompt.Action onClick={handleReturn}>Return & restock</Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default TrackingWidget

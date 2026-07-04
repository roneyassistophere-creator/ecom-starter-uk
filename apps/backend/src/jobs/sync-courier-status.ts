import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { COURIER_CONFIG_MODULE } from "../modules/courierConfig"
import { getCourierCreds } from "../lib/integration-env"
import { returnAndRestockOrder } from "../lib/returns"
import { steadfastAdapter } from "../modules/courierConfig/adapters/steadfast"
import { redxAdapter } from "../modules/courierConfig/adapters/redx"
import { pathaoAdapter } from "../modules/courierConfig/adapters/pathao"
import type { CourierAdapter, NormalizedStatus } from "../modules/courierConfig/adapters/interface"

const ADAPTER_MAP: Record<string, CourierAdapter> = {
  steadfast: steadfastAdapter,
  redx: redxAdapter,
  pathao: pathaoAdapter,
}

// Statuses that are still open and need polling
const OPEN_STATUSES = new Set(["pending_booking", "booked", "pending", "in_transit"])

export default async function syncCourierStatus({ container }: { container: MedusaContainer }) {
  const logger = container.resolve("logger") as {
    info: (m: string) => void
    warn: (m: string) => void
    error: (m: string) => void
  }

  logger.info("[courier:sync] Running courier status sync job")

  // 1. Find active courier + resolve credentials from env once
  const courierConfigService = container.resolve(COURIER_CONFIG_MODULE) as any
  const [configs] = await courierConfigService.listAndCountCourierConfigs({ is_active: true })

  if (!configs || configs.length === 0) {
    logger.info("[courier:sync] No active courier configured — nothing to sync")
    return
  }

  const config = configs[0]
  const adapter = ADAPTER_MAP[config.courier_id]

  if (!adapter) {
    logger.warn(`[courier:sync] No adapter for courier "${config.courier_id}"`)
    return
  }

  const credentials = getCourierCreds(config.courier_id)
  if (!credentials) {
    logger.warn(`[courier:sync] Active courier "${config.courier_id}" credentials not set in environment`)
    return
  }

  // 2. List open fulfillments that belong to this courier
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT) as any
  let fulfillments: any[] = []
  try {
    fulfillments = await fulfillmentModule.listFulfillments({})
  } catch (err: any) {
    logger.error(`[courier:sync] Failed to list fulfillments: ${err.message}`)
    return
  }

  // Filter to ones we should poll
  const toSync = fulfillments.filter((f: any) => {
    const data = f.data ?? {}
    return (
      data.courier_id === config.courier_id &&
      data.consignment_id &&
      OPEN_STATUSES.has(data.courier_status ?? "")
    )
  })

  if (toSync.length === 0) {
    logger.info("[courier:sync] No open fulfillments to sync")
    return
  }

  logger.info(`[courier:sync] Syncing ${toSync.length} fulfillment(s) via ${config.courier_id}`)

  for (const fulfillment of toSync) {
    const { consignment_id } = fulfillment.data
    let status: NormalizedStatus = "unknown"

    try {
      status = await adapter.getStatus(consignment_id, credentials)
    } catch (err: any) {
      logger.warn(`[courier:sync] getStatus failed for ${consignment_id}: ${err.message}`)
      continue
    }

    const prevStatus = fulfillment.data.courier_status
    if (status === prevStatus) continue

    logger.info(`[courier:sync] ${consignment_id}: ${prevStatus} → ${status}`)

    try {
      await fulfillmentModule.updateFulfillment(fulfillment.id, {
        data: { ...fulfillment.data, courier_status: status },
      })
    } catch (err: any) {
      logger.error(`[courier:sync] Failed to update fulfillment ${fulfillment.id}: ${err.message}`)
      continue
    }

    // Mark Medusa fulfillment as delivered when courier confirms delivery
    if (status === "delivered") {
      try {
        await fulfillmentModule.markFulfillmentAsDelivered(fulfillment.id)
        logger.info(`[courier:sync] Fulfillment ${fulfillment.id} marked as delivered`)
      } catch (err: any) {
        // Method may not exist in all Medusa versions — log and skip
        logger.warn(`[courier:sync] Could not mark fulfillment as delivered: ${err.message}`)
      }
    }

    // When the courier returns the parcel, create + receive a native return so
    // inventory is restocked (idempotent via returnAndRestockOrder). No refund.
    if (status === "returned") {
      try {
        const query = container.resolve(ContainerRegistrationKeys.QUERY)
        const { data: rows } = await query.graph({
          entity: "fulfillment",
          fields: ["id", "order.id"],
          filters: { id: fulfillment.id },
        })
        const orderId = rows?.[0]?.order?.id
        if (!orderId) {
          logger.warn(`[courier:sync] No order found for fulfillment ${fulfillment.id} — cannot restock`)
        } else {
          const result = await returnAndRestockOrder(container, orderId)
          logger.info(
            `[courier:sync] Return for order ${orderId}: ${result.created ? `restocked ${result.items} item(s)` : `skipped (${result.reason})`}`
          )
        }
      } catch (err: any) {
        logger.error(`[courier:sync] Failed to restock returned fulfillment ${fulfillment.id}: ${err.message}`)
      }
    }
  }

  logger.info("[courier:sync] Courier status sync complete")
}

export const config = {
  name: "sync-courier-status",
  schedule: "*/10 * * * *", // every 10 minutes
}

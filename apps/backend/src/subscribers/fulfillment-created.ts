import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { COURIER_CONFIG_MODULE } from "../modules/courierConfig"
import { getCourierCreds } from "../lib/integration-env"
import { steadfastAdapter } from "../modules/courierConfig/adapters/steadfast"
import { redxAdapter } from "../modules/courierConfig/adapters/redx"
import { pathaoAdapter } from "../modules/courierConfig/adapters/pathao"
import type { CourierAdapter } from "../modules/courierConfig/adapters/interface"

const ADAPTER_MAP: Record<string, CourierAdapter> = {
  steadfast: steadfastAdapter,
  redx: redxAdapter,
  pathao: pathaoAdapter,
}

export default async function fulfillmentCreatedHandler({
  event,
  container,
}: SubscriberArgs<{ order_id: string; fulfillment_id: string; no_notification?: boolean }>) {
  const logger = container.resolve("logger") as { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void }
  const { fulfillment_id, order_id } = event.data

  logger.info(`[courier:subscriber] Fulfillment ${fulfillment_id} created for order ${order_id}`)

  // 1. Find active courier configuration
  const courierConfigService = container.resolve(COURIER_CONFIG_MODULE) as any
  const [configs] = await courierConfigService.listAndCountCourierConfigs({ is_active: true })

  if (!configs || configs.length === 0) {
    logger.warn("[courier:subscriber] No active courier found — skipping parcel booking")
    return
  }

  const config = configs[0]
  const adapter = ADAPTER_MAP[config.courier_id]

  if (!adapter) {
    logger.warn(`[courier:subscriber] No adapter found for courier "${config.courier_id}" — skipping`)
    return
  }

  // 2. Resolve credentials from environment variables
  const credentials = getCourierCreds(config.courier_id)
  if (!credentials) {
    logger.warn(`[courier:subscriber] Courier "${config.courier_id}" credentials not set in environment — skipping`)
    return
  }

  // 3. Retrieve order details for parcel creation
  let order: Record<string, unknown> = {}
  try {
    const orderModule = container.resolve(Modules.ORDER) as any
    order = await orderModule.retrieveOrder(order_id, {
      relations: ["shipping_address", "items"],
    })
  } catch (err: any) {
    logger.warn(`[courier:subscriber] Could not retrieve order ${order_id}: ${err.message}`)
    // Continue anyway — adapter will use whatever partial data is available
  }

  // 4. Call courier adapter to create parcel
  let parcelResult: { tracking_id: string; consignment_id: string; raw?: Record<string, unknown> }
  try {
    parcelResult = await adapter.createParcel(order as any, credentials)
    logger.info(
      `[courier:subscriber] Parcel created via ${config.courier_id}: consignment=${parcelResult.consignment_id}, tracking=${parcelResult.tracking_id}`
    )
  } catch (err: any) {
    logger.error(`[courier:subscriber] ${config.courier_id} createParcel failed for fulfillment ${fulfillment_id}: ${err.message}`)
    // Don't rethrow — order is still fulfilled; merchant can rebook manually
    return
  }

  // 5. Store tracking data on the fulfillment
  try {
    const fulfillmentModule = container.resolve(Modules.FULFILLMENT) as any
    await fulfillmentModule.updateFulfillment(fulfillment_id, {
      data: {
        courier_status: "booked",
        courier_id: config.courier_id,
        consignment_id: parcelResult.consignment_id,
        tracking_id: parcelResult.tracking_id,
      },
    })
    logger.info(`[courier:subscriber] Fulfillment ${fulfillment_id} updated with tracking data`)
  } catch (err: any) {
    logger.error(`[courier:subscriber] Failed to update fulfillment ${fulfillment_id} with tracking data: ${err.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
}

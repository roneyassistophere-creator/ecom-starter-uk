import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"
import type {
  CalculatedShippingOptionPrice,
  CalculateShippingOptionPriceDTO,
  CreateFulfillmentResult,
  CreateShippingOptionDTO,
  FulfillmentDTO,
  FulfillmentItemDTO,
  FulfillmentOption,
  FulfillmentOrderDTO,
  ValidateFulfillmentDataContext,
} from "@medusajs/types"

type InjectedDependencies = {
  logger?: { info: (...a: any[]) => void; warn: (...a: any[]) => void; error: (...a: any[]) => void }
}

/**
 * CourierFulfillmentProvider is a thin Medusa fulfillment provider that
 * delegates parcel booking to the active courier adapter via the
 * `order.fulfillment_created` subscriber (which has full app container access).
 *
 * `createFulfillment` returns empty data; the subscriber updates the
 * fulfillment with tracking_id / consignment_id after the courier API call.
 */
export class CourierFulfillmentProvider extends AbstractFulfillmentProviderService {
  static identifier = "courier"

  protected logger_: InjectedDependencies["logger"]

  constructor({ logger }: InjectedDependencies, _options: Record<string, unknown>) {
    super()
    this.logger_ = logger
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      { id: "standard", name: "Standard Delivery" },
      { id: "express", name: "Express Delivery" },
    ]
  }

  async validateOption(_data: Record<string, unknown>): Promise<boolean> {
    return true
  }

  async validateFulfillmentData(
    _optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    _context: ValidateFulfillmentDataContext
  ): Promise<Record<string, unknown>> {
    return data
  }

  async canCalculate(_data: CreateShippingOptionDTO): Promise<boolean> {
    // We use flat-rate shipping options set in the admin — no dynamic calculation.
    return false
  }

  async calculatePrice(
    _optionData: CalculateShippingOptionPriceDTO["optionData"],
    _data: CalculateShippingOptionPriceDTO["data"],
    _context: CalculateShippingOptionPriceDTO["context"]
  ): Promise<CalculatedShippingOptionPrice> {
    throw new Error("calculatePrice is not supported — use flat-rate shipping options")
  }

  async createFulfillment(
    _data: Record<string, unknown>,
    _items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    _order: Partial<FulfillmentOrderDTO> | undefined,
    _fulfillment: Partial<Omit<FulfillmentDTO, "provider_id" | "data" | "items">>
  ): Promise<CreateFulfillmentResult> {
    // The actual courier booking happens in the order.fulfillment_created subscriber,
    // which has access to the full application container (including courierConfig module).
    this.logger_?.info("[courier:provider] Fulfillment created — courier booking queued via subscriber")
    return { data: { courier_status: "pending_booking" }, labels: [] }
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<void> {
    this.logger_?.info(`[courier:provider] Cancel requested for consignment ${data.consignment_id ?? "unknown"}`)
    // Cancellation is handled manually or via the subscriber; log only here.
  }

  async createReturnFulfillment(_fulfillment: Record<string, unknown>): Promise<CreateFulfillmentResult> {
    return { data: {}, labels: [] }
  }

  async getFulfillmentDocuments(_data: Record<string, unknown>): Promise<never[]> {
    return []
  }

  async getReturnDocuments(_data: Record<string, unknown>): Promise<never[]> {
    return []
  }

  async getShipmentDocuments(_data: Record<string, unknown>): Promise<never[]> {
    return []
  }

  async retrieveDocuments(_fulfillmentData: Record<string, unknown>, _documentType: string): Promise<void> {
    // No document retrieval supported
  }
}

// Medusa fulfillment module provider export format
export default {
  services: [CourierFulfillmentProvider],
}

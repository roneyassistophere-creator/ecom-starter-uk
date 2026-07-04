import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import BkashPaymentService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [BkashPaymentService],
})

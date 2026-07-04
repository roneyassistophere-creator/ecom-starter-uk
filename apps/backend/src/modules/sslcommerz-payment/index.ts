import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import SslcommerzPaymentService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [SslcommerzPaymentService],
})

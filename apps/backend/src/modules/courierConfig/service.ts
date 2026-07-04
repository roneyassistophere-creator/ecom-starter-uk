import { MedusaService } from "@medusajs/framework/utils"
import CourierConfig from "./models/courier-config"

class CourierConfigModuleService extends MedusaService({
  CourierConfig,
}) {}

export default CourierConfigModuleService

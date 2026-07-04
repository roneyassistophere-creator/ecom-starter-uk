import { MedusaService } from "@medusajs/framework/utils"
import VariantCost from "./models/variant-cost"

class ProductCostModuleService extends MedusaService({
  VariantCost,
}) {}

export default ProductCostModuleService

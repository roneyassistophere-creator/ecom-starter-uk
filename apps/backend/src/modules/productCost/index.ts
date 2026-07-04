import { Module } from "@medusajs/framework/utils"
import ProductCostModuleService from "./service"

export const PRODUCT_COST_MODULE = "productCost"

export default Module(PRODUCT_COST_MODULE, {
  service: ProductCostModuleService,
})

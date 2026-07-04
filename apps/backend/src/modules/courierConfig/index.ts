import { Module } from "@medusajs/framework/utils"
import CourierConfigModuleService from "./service"

export const COURIER_CONFIG_MODULE = "courierConfig"

export default Module(COURIER_CONFIG_MODULE, {
  service: CourierConfigModuleService,
})

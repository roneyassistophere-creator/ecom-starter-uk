import { Module } from "@medusajs/framework/utils"
import TrackingSettingsModuleService from "./service"

export const TRACKING_SETTINGS_MODULE = "trackingSettings"

export default Module(TRACKING_SETTINGS_MODULE, {
  service: TrackingSettingsModuleService,
})

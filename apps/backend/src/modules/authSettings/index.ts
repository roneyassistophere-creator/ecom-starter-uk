import { Module } from "@medusajs/framework/utils"
import AuthSettingsModuleService from "./service"

export const AUTH_SETTINGS_MODULE = "authSettings"

export default Module(AUTH_SETTINGS_MODULE, {
  service: AuthSettingsModuleService,
})

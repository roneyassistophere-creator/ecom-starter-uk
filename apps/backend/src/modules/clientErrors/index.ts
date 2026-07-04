import { Module } from "@medusajs/framework/utils"
import ClientErrorsModuleService from "./service"

export const CLIENT_ERRORS_MODULE = "clientErrors"

export default Module(CLIENT_ERRORS_MODULE, {
  service: ClientErrorsModuleService,
})

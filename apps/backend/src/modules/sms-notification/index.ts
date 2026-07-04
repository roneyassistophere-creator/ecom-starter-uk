import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import SmsNotificationService from "./services/sms"

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [SmsNotificationService],
})

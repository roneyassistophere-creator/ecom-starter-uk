import { MedusaService } from "@medusajs/framework/utils"
import AuthSettings from "./models/auth-settings"
import OtpRecord from "./models/otp-record"

class AuthSettingsModuleService extends MedusaService({
  AuthSettings,
  OtpRecord,
}) {}

export default AuthSettingsModuleService

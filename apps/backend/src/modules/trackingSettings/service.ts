import { MedusaService } from "@medusajs/framework/utils"
import TrackingSettings from "./models/tracking-settings"

class TrackingSettingsModuleService extends MedusaService({
  TrackingSettings,
}) {}

export default TrackingSettingsModuleService

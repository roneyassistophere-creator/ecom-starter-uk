import { model } from "@medusajs/framework/utils"

const CourierConfig = model.define("courier_config", {
  id: model.id().primaryKey(),
  courier_id: model.text(),                      // "steadfast" | "redx" | "pathao"
  enabled: model.boolean().default(false),
  is_active: model.boolean().default(false),
  // Secrets live in environment variables; "configured" is derived at runtime.
  settings: model.json().nullable(),              // non-secret prefs: { pickup_address, ... }
})

export default CourierConfig

import { model } from "@medusajs/framework/utils"

const TrackingSettings = model.define("tracking_settings", {
  id: model.id().primaryKey(),
  meta_pixel_id: model.text().nullable(),
  ga4_measurement_id: model.text().nullable(),
  capi_enabled: model.boolean().default(false),
  // CAPI access token lives in the META_CAPI_ACCESS_TOKEN env var; "configured" is derived.
  capi_test_event_code: model.text().nullable(),
  purchase_event_enabled: model.boolean().default(true),
})

export default TrackingSettings

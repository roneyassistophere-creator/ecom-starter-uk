import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { STORE_SETTINGS_MODULE } from "../../../modules/storeSettings"

const DEFAULT_STYLE = "minimal"
const DEFAULT_FIELDS = { name: true, price: true }
const DEFAULT_BUTTON_LAYOUT = "side_by_side"
const DEFAULT_ACTION_MODE = "navigate"
const DEFAULT_BADGE_SETTINGS = {
  sale: true, sale_format: "label",
  new_arrival: false, new_days: 30,
  custom: true,
}
const DEFAULT_TEXT_ALIGN = "center"
const DEFAULT_GRID_COLUMNS = { mobile: 2, tablet: 3, desktop: 4 }

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(STORE_SETTINGS_MODULE)
  const [setting] = await svc.listStoreSettings({}, { take: 1 })
  res.json({
    product_card_style: setting?.product_card_style ?? DEFAULT_STYLE,
    product_card_fields: setting?.product_card_fields ?? DEFAULT_FIELDS,
    card_button_layout: setting?.card_button_layout ?? DEFAULT_BUTTON_LAYOUT,
    card_action_mode: setting?.card_action_mode ?? DEFAULT_ACTION_MODE,
    card_badge_settings: setting?.card_badge_settings ?? DEFAULT_BADGE_SETTINGS,
    card_text_align: setting?.card_text_align ?? DEFAULT_TEXT_ALIGN,
    card_grid_columns: setting?.card_grid_columns ?? DEFAULT_GRID_COLUMNS,
  })
}

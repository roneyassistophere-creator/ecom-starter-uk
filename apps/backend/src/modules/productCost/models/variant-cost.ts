import { model } from "@medusajs/framework/utils"

// Cost price (COGS) per product variant. Stored in the same as-is scale as prices
// (e.g. 800 = 800 BDT). Drives the Sales Insights profit/loss dashboard.
const VariantCost = model.define("variant_cost", {
  id: model.id().primaryKey(),
  variant_id: model.text().unique(),
  cost: model.number().default(0),
  currency_code: model.text().nullable(),
})

export default VariantCost

import { model } from "@medusajs/framework/utils"

// One row per customer-facing storefront error (captured via Next.js onRequestError).
const ClientError = model.define("client_error", {
  id: model.id().primaryKey(),
  message: model.text(),
  digest: model.text().nullable(),
  path: model.text().nullable(),
  method: model.text().nullable(),
  router_kind: model.text().nullable(),
  render_source: model.text().nullable(),
  stack: model.text().nullable(),
  seen: model.boolean().default(false),
})

export default ClientError

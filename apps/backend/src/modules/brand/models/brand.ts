import { model } from "@medusajs/framework/utils"

const Brand = model.define("brand", {
  id: model.id().primaryKey(),
  name: model.text(),
  handle: model.text(),
  logo_url: model.text().nullable(),
  description: model.text().nullable(),
  website: model.text().nullable(),
  position: model.number().default(0),
})

export default Brand

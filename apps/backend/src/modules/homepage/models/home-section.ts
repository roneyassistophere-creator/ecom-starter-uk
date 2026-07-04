import { model } from "@medusajs/framework/utils"
import { SECTION_TYPES } from "../types"
import HomeSlide from "./home-slide"

const HomeSection = model.define("home_section", {
  id: model.id().primaryKey(),
  /** Admin-facing display name for this section */
  title: model.text(),
  type: model.enum([...SECTION_TYPES]),
  layout: model.text(),
  position: model.number(),
  enabled: model.boolean().default(true),
  settings: model.json().nullable(),
  slides: model.hasMany(() => HomeSlide, { mappedBy: "section" }),
})

export default HomeSection

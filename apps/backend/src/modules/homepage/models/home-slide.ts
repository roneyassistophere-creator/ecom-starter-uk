import { model } from "@medusajs/framework/utils"
import HomeSection from "./home-section"

const HomeSlide = model.define("home_slide", {
  id: model.id().primaryKey(),
  image_url: model.text(),
  mobile_image_url: model.text().nullable(),
  heading: model.text().nullable(),
  subheading: model.text().nullable(),
  cta_label: model.text().nullable(),
  cta_link: model.text().nullable(),
  position: model.number(),
  section: model.belongsTo(() => HomeSection, { mappedBy: "slides" }),
})

export default HomeSlide

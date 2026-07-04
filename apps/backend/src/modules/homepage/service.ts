import { MedusaService } from "@medusajs/framework/utils"
import HomeSection from "./models/home-section"
import HomeSlide from "./models/home-slide"

class HomepageModuleService extends MedusaService({
  HomeSection,
  HomeSlide,
}) {}

export default HomepageModuleService

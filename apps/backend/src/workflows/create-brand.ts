import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BRAND_MODULE } from "../modules/brand"

type CreateBrandInput = {
  name: string
  handle: string
  logo_url?: string | null
  description?: string | null
  website?: string | null
  position?: number
}

const createBrandStep = createStep(
  "create-brand-step",
  async (input: CreateBrandInput, { container }) => {
    const brandService = container.resolve(BRAND_MODULE)
    const brand = await brandService.createBrands([input])
    return new StepResponse(brand[0], brand[0].id)
  },
  async (brandId: string, { container }) => {
    const brandService = container.resolve(BRAND_MODULE)
    await brandService.deleteBrands([brandId])
  }
)

export const createBrandWorkflow = createWorkflow(
  "create-brand",
  function (input: CreateBrandInput) {
    const brand = createBrandStep(input)
    return new WorkflowResponse(brand)
  }
)

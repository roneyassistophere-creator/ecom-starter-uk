import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BRAND_MODULE } from "../modules/brand"

type UpdateBrandInput = {
  id: string
  name?: string
  handle?: string
  logo_url?: string | null
  description?: string | null
  website?: string | null
  position?: number
}

const updateBrandStep = createStep(
  "update-brand-step",
  async (input: UpdateBrandInput, { container }) => {
    const brandService = container.resolve(BRAND_MODULE)
    const prev = await brandService.retrieveBrand(input.id)
    const [brand] = await brandService.updateBrands([input])
    return new StepResponse(brand, { id: input.id, prev })
  },
  async ({ id, prev }: { id: string; prev: any }, { container }) => {
    const brandService = container.resolve(BRAND_MODULE)
    await brandService.updateBrands([{ id, ...prev }])
  }
)

export const updateBrandWorkflow = createWorkflow(
  "update-brand",
  function (input: UpdateBrandInput) {
    const brand = updateBrandStep(input)
    return new WorkflowResponse(brand)
  }
)

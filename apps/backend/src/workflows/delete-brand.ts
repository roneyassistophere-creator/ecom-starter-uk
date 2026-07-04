import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BRAND_MODULE } from "../modules/brand"

const deleteBrandStep = createStep(
  "delete-brand-step",
  async (id: string, { container }) => {
    const brandService = container.resolve(BRAND_MODULE)
    await brandService.deleteBrands([id])
    return new StepResponse(id)
  }
)

export const deleteBrandWorkflow = createWorkflow(
  "delete-brand",
  function (id: string) {
    deleteBrandStep(id)
    return new WorkflowResponse({ deleted: true })
  }
)

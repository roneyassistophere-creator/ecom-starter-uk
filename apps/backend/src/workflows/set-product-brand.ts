import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { BRAND_MODULE } from "../modules/brand"

type SetProductBrandInput = {
  product_id: string
  brand_id: string | null
  old_brand_id?: string | null
}

const setProductBrandStep = createStep(
  "set-product-brand-step",
  async (input: SetProductBrandInput, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    if (input.old_brand_id) {
      await link.dismiss({
        [Modules.PRODUCT]: { product_id: input.product_id },
        [BRAND_MODULE]: { brand_id: input.old_brand_id },
      })
    }

    if (input.brand_id) {
      await link.create({
        [Modules.PRODUCT]: { product_id: input.product_id },
        [BRAND_MODULE]: { brand_id: input.brand_id },
      })
    }

    return new StepResponse({ success: true }, input)
  },
  async (input: SetProductBrandInput, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    if (input.brand_id) {
      await link.dismiss({
        [Modules.PRODUCT]: { product_id: input.product_id },
        [BRAND_MODULE]: { brand_id: input.brand_id },
      })
    }

    if (input.old_brand_id) {
      await link.create({
        [Modules.PRODUCT]: { product_id: input.product_id },
        [BRAND_MODULE]: { brand_id: input.old_brand_id },
      })
    }
  }
)

export const setProductBrandWorkflow = createWorkflow(
  "set-product-brand",
  function (input: SetProductBrandInput) {
    setProductBrandStep(input)
    return new WorkflowResponse({ success: true })
  }
)

import { generateJwtToken } from "@medusajs/utils"

export function generateCustomerToken(customerId: string, authIdentityId: string): string {
  return generateJwtToken(
    {
      actor_id: customerId,
      actor_type: "customer",
      auth_identity_id: authIdentityId,
    },
    {
      secret: process.env.JWT_SECRET || "supersecret",
      expiresIn: "30d",
    }
  )
}

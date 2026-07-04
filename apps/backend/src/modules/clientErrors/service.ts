import { MedusaService } from "@medusajs/framework/utils"
import ClientError from "./models/client-error"

class ClientErrorsModuleService extends MedusaService({
  ClientError,
}) {}

export default ClientErrorsModuleService

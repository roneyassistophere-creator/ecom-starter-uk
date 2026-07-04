import { model } from "@medusajs/framework/utils"

const OtpRecord = model.define("otp_record", {
  id: model.id().primaryKey(),
  phone: model.text(),
  code_hash: model.text(),
  expires_at: model.dateTime(),
  attempts: model.number().default(0),
  last_sent_at: model.dateTime(),
})

export default OtpRecord

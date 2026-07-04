import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { uploadFilesWorkflow } from "@medusajs/core-flows"

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const file = (req as any).file as Express.Multer.File | undefined

  if (!file) {
    return res.status(400).json({
      error: "No file uploaded. Send a multipart/form-data request with field name 'file'.",
    })
  }

  const { result } = await uploadFilesWorkflow(req.scope).run({
    input: {
      files: [
        {
          filename: file.originalname,
          mimeType: file.mimetype,
          content: file.buffer.toString("base64"),
          access: "public",
        },
      ],
    },
  })

  res.json({ url: result[0].url })
}

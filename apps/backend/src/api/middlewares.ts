import { defineMiddlewares } from "@medusajs/framework/http"
import multer from "multer"

const upload = multer({ storage: multer.memoryStorage() })

export default defineMiddlewares([
  // Multer parses multipart/form-data for the image upload endpoint.
  // Admin auth is applied automatically by the framework for all /admin/* routes.
  {
    method: ["POST"],
    matcher: "/admin/homepage/upload",
    middlewares: [upload.single("file")],
  },
  {
    method: ["POST"],
    matcher: "/admin/brands/upload",
    middlewares: [upload.single("file")],
  },
])

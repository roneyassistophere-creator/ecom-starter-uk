import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Stripe is optional. Set both vars in .env to enable card payments.
// Without them, Medusa's built-in manual (cash-on-delivery) provider is used automatically.
const hasStripe =
  Boolean(process.env.STRIPE_API_KEY) &&
  Boolean(process.env.STRIPE_WEBHOOK_SECRET)

// S3 / MinIO file storage — set all four vars to enable in production.
// Without them, Medusa falls back to local disk storage automatically.
const hasS3 =
  Boolean(process.env.S3_BUCKET) &&
  Boolean(process.env.S3_ACCESS_KEY_ID) &&
  Boolean(process.env.S3_SECRET_ACCESS_KEY) &&
  Boolean(process.env.S3_FILE_URL)

// SSLCommerz — BD aggregator (cards, bKash, Nagad, Rocket, EMI)
const hasSslcommerz =
  Boolean(process.env.SSLCOMMERZ_STORE_ID) &&
  Boolean(process.env.SSLCOMMERZ_STORE_PASSWORD)

// bKash — direct tokenized PGW (optional; most merchants use SSLCommerz which already covers bKash)
const hasBkash =
  Boolean(process.env.BKASH_APP_KEY) &&
  Boolean(process.env.BKASH_APP_SECRET) &&
  Boolean(process.env.BKASH_USERNAME) &&
  Boolean(process.env.BKASH_PASSWORD)

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  plugins: [
    // Sales/analytics dashboard in Admin (Orders + Products tabs). No DB tables.
    { resolve: "@agilo/medusa-analytics-plugin", options: {} },
  ],
  modules: [
    {
      resolve: "./src/modules/homepage",
    },
    {
      resolve: "./src/modules/storeSettings",
    },
    {
      resolve: "./src/modules/brand",
    },
    {
      resolve: "./src/modules/courierConfig",
    },
    {
      resolve: "./src/modules/trackingSettings",
    },
    {
      resolve: "./src/modules/authSettings",
    },
    {
      resolve: "./src/modules/clientErrors",
    },
    {
      resolve: "./src/modules/productCost",
    },
    ...(hasS3
      ? [
          {
            resolve: "@medusajs/medusa/file",
            options: {
              providers: [
                {
                  resolve: "@medusajs/file-s3",
                  id: "s3",
                  options: {
                    file_url: process.env.S3_FILE_URL,
                    access_key_id: process.env.S3_ACCESS_KEY_ID,
                    secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
                    region: process.env.S3_REGION || "us-east-1",
                    bucket: process.env.S3_BUCKET,
                    endpoint: process.env.S3_ENDPOINT,
                    additional_client_config: process.env.S3_ENDPOINT
                      ? { forcePathStyle: true }
                      : undefined,
                  },
                },
              ],
            },
          },
        ]
      : []),
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          // Default manual provider — required for simple flat-rate / Cash-on-Delivery
          // shipping options. Without it, no shipping methods can be created.
          {
            resolve: "@medusajs/medusa/fulfillment-manual",
            id: "manual",
          },
          {
            resolve: "./src/modules/courierConfig/provider",
            id: "courier",
            options: {},
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "./src/modules/resend-notification",
            id: "resend",
            options: { channels: ["email"] },
          },
          {
            resolve: "./src/modules/sms-notification",
            id: "sms",
            options: { channels: ["sms"] },
          },
        ],
      },
    },
    ...(hasStripe || hasSslcommerz || hasBkash
      ? [
          {
            resolve: "@medusajs/medusa/payment",
            options: {
              providers: [
                ...(hasStripe
                  ? [
                      {
                        resolve: "@medusajs/payment-stripe",
                        id: "stripe",
                        options: {
                          apiKey: process.env.STRIPE_API_KEY,
                          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
                        },
                      },
                    ]
                  : []),
                ...(hasSslcommerz
                  ? [
                      {
                        resolve: "./src/modules/sslcommerz-payment",
                        id: "sslcommerz",
                        options: {},
                      },
                    ]
                  : []),
                ...(hasBkash
                  ? [
                      {
                        resolve: "./src/modules/bkash-payment",
                        id: "bkash",
                        options: {},
                      },
                    ]
                  : []),
              ],
            },
          },
        ]
      : []),
  ],
})

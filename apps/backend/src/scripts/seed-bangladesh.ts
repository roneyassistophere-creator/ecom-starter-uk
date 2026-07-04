import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
} from "@medusajs/framework/utils"
import {
  createRegionsWorkflow,
  createTaxRegionsWorkflow,
  updateShippingOptionsWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function seedBangladesh({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const storeService = container.resolve(ModuleRegistrationName.STORE) as any
  const fulfillmentService = container.resolve(ModuleRegistrationName.FULFILLMENT) as any

  // ── 1. Add BDT to store supported currencies ──────────────────────────────
  logger.info("Step 1: Adding BDT currency to store...")

  const [store] = await storeService.listStores({})
  const existingCurrencies = await storeService.listStoreCurrencies({
    store_id: store.id,
  })

  const hasBdt = existingCurrencies.some(
    (c: any) => c.currency_code === "bdt"
  )

  if (hasBdt) {
    logger.info("  — BDT already in store, skipping.")
  } else {
    await storeService.createStoreCurrencies([
      { store_id: store.id, currency_code: "bdt", is_default: false },
    ])
    logger.info("  ✓ BDT added to store supported currencies.")
  }

  // ── 2. Guard: skip if BD region already exists ────────────────────────────
  logger.info("Step 2: Checking for existing Bangladesh region...")

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
  })

  const existingBdRegion = regions.find(
    (r: any) => r.name === "Bangladesh" || r.currency_code === "bdt"
  )

  if (existingBdRegion) {
    logger.info(
      `  — Bangladesh region already exists (${existingBdRegion.id}), nothing more to do.`
    )
    logger.info("Done.")
    return
  }

  // ── 3. Create Bangladesh region ───────────────────────────────────────────
  logger.info("Step 3: Creating Bangladesh region...")

  const {
    result: [region],
  } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Bangladesh",
          currency_code: "bdt",
          countries: ["bd"],
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  })

  logger.info(`  ✓ Region created: ${region.id}`)

  // ── 4. Tax region ─────────────────────────────────────────────────────────
  logger.info("Step 4: Creating tax region for Bangladesh...")

  await createTaxRegionsWorkflow(container).run({
    input: [{ country_code: "bd", provider_id: "tp_system" }],
  })

  logger.info("  ✓ Tax region created.")

  // ── 5. Add BD to the existing fulfillment service zone ────────────────────
  logger.info("Step 5: Adding Bangladesh to fulfillment service zone...")

  const { data: serviceZones } = await query.graph({
    entity: "service_zone",
    fields: [
      "id",
      "name",
      "geo_zones.id",
      "geo_zones.type",
      "geo_zones.country_code",
    ],
  })

  if (serviceZones.length === 0) {
    logger.warn(
      "  ⚠ No service zones found. Create a fulfillment set for Bangladesh in Admin → Shipping."
    )
  } else {
    const zone = serviceZones[0]
    const alreadyHasBd = (zone.geo_zones ?? []).some(
      (g: any) => g.country_code === "bd"
    )

    if (alreadyHasBd) {
      logger.info(`  — BD already in zone "${zone.name}", skipping.`)
    } else {
      await fulfillmentService.updateServiceZones(zone.id, {
        geo_zones: [
          ...(zone.geo_zones ?? []).map((g: any) => ({
            id: g.id,
            type: g.type,
            country_code: g.country_code,
          })),
          { type: "country" as const, country_code: "bd" },
        ],
      })
      logger.info(`  ✓ BD added to service zone "${zone.name}".`)
    }
  }

  // ── 6. Add BDT prices to existing shipping options ────────────────────────
  logger.info("Step 6: Adding BDT prices to shipping options...")

  const { data: shippingOptions } = await query.graph({
    entity: "shipping_option",
    fields: [
      "id",
      "name",
      "prices.id",
      "prices.currency_code",
      "prices.amount",
      "prices.region_id",
    ],
  })

  if (shippingOptions.length === 0) {
    logger.warn(
      "  ⚠ No shipping options found. Add them in Admin and set BDT prices manually."
    )
  } else {
    const updates = shippingOptions
      .filter(
        (so: any) =>
          !(so.prices ?? []).some((p: any) => p.currency_code === "bdt")
      )
      .map((so: any) => ({
        id: so.id,
        prices: [
          ...(so.prices ?? []).map((p: any) => ({
            id: p.id,
            currency_code: p.currency_code ?? undefined,
            amount: p.amount,
            ...(p.region_id ? { region_id: p.region_id } : {}),
          })),
          // Flat BDT price for any BDT cart
          { currency_code: "bdt", amount: 150 },
          // Region-specific BDT price for the Bangladesh region
          { region_id: region.id, amount: 150 },
        ],
      }))

    if (updates.length === 0) {
      logger.info("  — All shipping options already have BDT prices.")
    } else {
      await updateShippingOptionsWorkflow(container).run({ input: updates })
      logger.info(
        `  ✓ BDT prices (৳150) added to ${updates.length} shipping option(s).`
      )
    }
  }

  logger.info(
    "🇧🇩  Bangladesh setup complete! Adjust the ৳150 shipping price in Admin → Shipping if needed."
  )
}

import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260615120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "home_section" DROP CONSTRAINT IF EXISTS "home_section_type_check";`)
    this.addSql(`ALTER TABLE "home_section" ADD CONSTRAINT "home_section_type_check" CHECK ("type" IN ('hero_carousel', 'featured_categories', 'product_showcase', 'brand_showcase'));`)
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "home_section" DROP CONSTRAINT IF EXISTS "home_section_type_check";`)
    this.addSql(`ALTER TABLE "home_section" ADD CONSTRAINT "home_section_type_check" CHECK ("type" IN ('hero_carousel', 'featured_categories', 'product_showcase'));`)
  }

}

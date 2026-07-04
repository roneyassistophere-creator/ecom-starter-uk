import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260614132438 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "store_setting" add column if not exists "product_card_style" text null, add column if not exists "product_card_fields" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "store_setting" drop column if exists "product_card_style", drop column if exists "product_card_fields";`);
  }

}

import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260614151118 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "store_setting" add column if not exists "card_text_align" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "store_setting" drop column if exists "card_text_align";`);
  }

}

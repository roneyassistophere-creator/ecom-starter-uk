import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260614141556 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "store_setting" add column if not exists "card_button_layout" text null, add column if not exists "card_action_mode" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "store_setting" drop column if exists "card_button_layout", drop column if exists "card_action_mode";`);
  }

}

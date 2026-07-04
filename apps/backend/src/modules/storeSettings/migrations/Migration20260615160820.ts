import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260615160820 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "store_setting" add column if not exists "sms_order_placed" boolean not null default false, add column if not exists "sms_order_shipped" boolean not null default false, add column if not exists "sms_order_canceled" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "store_setting" drop column if exists "sms_order_placed", drop column if exists "sms_order_shipped", drop column if exists "sms_order_canceled";`);
  }

}

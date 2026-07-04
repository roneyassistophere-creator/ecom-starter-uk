import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260615152550 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "store_setting" add column if not exists "email_enabled" boolean not null default true, add column if not exists "email_order_placed" boolean not null default true, add column if not exists "email_order_shipped" boolean not null default true, add column if not exists "email_order_canceled" boolean not null default true, add column if not exists "email_password_reset" boolean not null default true, add column if not exists "email_sender_name" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "store_setting" drop column if exists "email_enabled", drop column if exists "email_order_placed", drop column if exists "email_order_shipped", drop column if exists "email_order_canceled", drop column if exists "email_password_reset", drop column if exists "email_sender_name";`);
  }

}

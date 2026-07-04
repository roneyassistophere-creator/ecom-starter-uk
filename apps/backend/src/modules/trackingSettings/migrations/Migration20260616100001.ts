import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260616100001 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "tracking_settings" (
        "id"                      varchar(26)               not null,
        "meta_pixel_id"           text                      null,
        "ga4_measurement_id"      text                      null,
        "capi_enabled"            boolean                   not null default false,
        "capi_token_encrypted"    jsonb                     null,
        "capi_configured"         boolean                   not null default false,
        "capi_test_event_code"    text                      null,
        "purchase_event_enabled"  boolean                   not null default true,
        "created_at"              timestamptz               not null default now(),
        "updated_at"              timestamptz               not null default now(),
        "deleted_at"              timestamptz               null,
        constraint "tracking_settings_pkey" primary key ("id")
      );
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "tracking_settings";`)
  }
}

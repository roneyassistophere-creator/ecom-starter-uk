import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260630120002 extends Migration {

  override async up(): Promise<void> {
    // CAPI access token moved to META_CAPI_ACCESS_TOKEN env var; "configured" derived at runtime.
    this.addSql(`
      alter table if exists "tracking_settings"
        drop column if exists "capi_token_encrypted",
        drop column if exists "capi_configured";
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      alter table if exists "tracking_settings"
        add column if not exists "capi_token_encrypted" jsonb null,
        add column if not exists "capi_configured" boolean not null default false;
    `);
  }

}

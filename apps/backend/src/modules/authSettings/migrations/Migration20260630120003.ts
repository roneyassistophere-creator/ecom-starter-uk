import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260630120003 extends Migration {

  override async up(): Promise<void> {
    // Google client secret moved to GOOGLE_CLIENT_SECRET env var; "configured" derived at runtime.
    this.addSql(`
      alter table if exists "auth_settings"
        drop column if exists "google_client_secret_encrypted",
        drop column if exists "google_configured";
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      alter table if exists "auth_settings"
        add column if not exists "google_client_secret_encrypted" jsonb null,
        add column if not exists "google_configured" boolean not null default false;
    `);
  }

}

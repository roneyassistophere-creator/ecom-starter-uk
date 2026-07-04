import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260630120001 extends Migration {

  override async up(): Promise<void> {
    // Resend / SMS / Twilio secrets moved to environment variables;
    // "configured" flags are now derived at runtime.
    this.addSql(`
      alter table if exists "store_setting"
        drop column if exists "resend_api_key_encrypted",
        drop column if exists "email_configured",
        drop column if exists "sms_api_key_encrypted",
        drop column if exists "twilio_auth_token_encrypted",
        drop column if exists "sms_configured";
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      alter table if exists "store_setting"
        add column if not exists "resend_api_key_encrypted" jsonb null,
        add column if not exists "email_configured" boolean not null default false,
        add column if not exists "sms_api_key_encrypted" jsonb null,
        add column if not exists "twilio_auth_token_encrypted" jsonb null,
        add column if not exists "sms_configured" boolean not null default false;
    `);
  }

}

import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260616100002 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "auth_settings" (
        "id"                              varchar(26)   not null,
        "google_enabled"                  boolean       not null default false,
        "google_client_id"                text          null,
        "google_client_secret_encrypted"  jsonb         null,
        "google_redirect_uri"             text          null,
        "google_configured"               boolean       not null default false,
        "phone_otp_enabled"               boolean       not null default false,
        "otp_length"                      integer       not null default 6,
        "otp_expiry_seconds"              integer       not null default 300,
        "otp_max_attempts"                integer       not null default 5,
        "otp_resend_cooldown_seconds"     integer       not null default 60,
        "created_at"                      timestamptz   not null default now(),
        "updated_at"                      timestamptz   not null default now(),
        "deleted_at"                      timestamptz   null,
        constraint "auth_settings_pkey" primary key ("id")
      );
    `)

    this.addSql(`
      create table if not exists "otp_record" (
        "id"            varchar(26)   not null,
        "phone"         text          not null,
        "code_hash"     text          not null,
        "expires_at"    timestamptz   not null,
        "attempts"      integer       not null default 0,
        "last_sent_at"  timestamptz   not null,
        "created_at"    timestamptz   not null default now(),
        "updated_at"    timestamptz   not null default now(),
        "deleted_at"    timestamptz   null,
        constraint "otp_record_pkey" primary key ("id")
      );
    `)

    this.addSql(`create index if not exists "otp_record_phone_idx" on "otp_record" ("phone");`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "otp_record";`)
    this.addSql(`drop table if exists "auth_settings";`)
  }
}

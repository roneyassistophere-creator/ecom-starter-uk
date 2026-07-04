import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260616100000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "courier_config" (
        "id"                      varchar(26)               not null,
        "courier_id"              text                      not null,
        "enabled"                 boolean                   not null default false,
        "is_active"               boolean                   not null default false,
        "configured"              boolean                   not null default false,
        "credentials_encrypted"   jsonb                     null,
        "settings"                jsonb                     null,
        "created_at"              timestamptz               not null default now(),
        "updated_at"              timestamptz               not null default now(),
        "deleted_at"              timestamptz               null,
        constraint "courier_config_pkey" primary key ("id")
      );
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "courier_config";`)
  }
}

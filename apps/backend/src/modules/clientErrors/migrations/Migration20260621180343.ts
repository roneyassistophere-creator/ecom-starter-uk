import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260621180343 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "client_error" ("id" text not null, "message" text not null, "digest" text null, "path" text null, "method" text null, "router_kind" text null, "render_source" text null, "stack" text null, "seen" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "client_error_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_client_error_deleted_at" ON "client_error" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "client_error" cascade;`);
  }

}

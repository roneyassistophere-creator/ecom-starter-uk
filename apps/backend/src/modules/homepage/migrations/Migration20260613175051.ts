import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260613175051 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "home_section" ("id" text not null, "title" text not null, "type" text check ("type" in ('hero_carousel', 'featured_categories', 'product_showcase')) not null, "layout" text not null, "position" integer not null, "enabled" boolean not null default true, "settings" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "home_section_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_home_section_deleted_at" ON "home_section" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "home_slide" ("id" text not null, "image_url" text not null, "mobile_image_url" text null, "heading" text null, "subheading" text null, "cta_label" text null, "cta_link" text null, "position" integer not null, "section_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "home_slide_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_home_slide_section_id" ON "home_slide" ("section_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_home_slide_deleted_at" ON "home_slide" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "home_slide" add constraint "home_slide_section_id_foreign" foreign key ("section_id") references "home_section" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "home_slide" drop constraint if exists "home_slide_section_id_foreign";`);

    this.addSql(`drop table if exists "home_section" cascade;`);

    this.addSql(`drop table if exists "home_slide" cascade;`);
  }

}

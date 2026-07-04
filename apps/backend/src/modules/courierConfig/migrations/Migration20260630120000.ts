import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260630120000 extends Migration {

  override async up(): Promise<void> {
    // Secrets moved to environment variables; "configured" is now derived at runtime.
    this.addSql(`
      alter table if exists "courier_config"
        drop column if exists "configured",
        drop column if exists "credentials_encrypted";
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      alter table if exists "courier_config"
        add column if not exists "configured" boolean not null default false,
        add column if not exists "credentials_encrypted" jsonb null;
    `);
  }

}

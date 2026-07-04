import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  FeatureFlag,
  Modules,
} from "@medusajs/framework/utils";
import { createUsersWorkflow } from "@medusajs/medusa/core-flows";

export default async function create_admin_user({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  // No manual `npx medusa user` step in a container deploy — read credentials from
  // env instead. Without them there's no way to log in to /app after a fresh deploy.
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    logger.info(
      "create-admin-user: ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping. " +
        "Create an admin user manually with `npx medusa user -e <email> -p <password>`."
    );
    return;
  }

  // Idempotency guard — this only runs on a fresh install. Without it, this
  // migration script would error on every subsequent `db:migrate` (duplicate email).
  const userModuleService = container.resolve(Modules.USER);
  const existingUsers = await userModuleService.listUsers({ email });
  if (existingUsers.length > 0) {
    logger.info(`create-admin-user: user ${email} already exists — skipping.`);
    return;
  }

  // Best-effort — this runs during `db:migrate`, which the container executes on
  // startup, so a failure here must not block boot.
  try {
    let roles: string[] = [];
    if (FeatureFlag.isFeatureEnabled("rbac")) {
      const rbacService = container.resolve(Modules.RBAC);
      const superAdminRoles = await rbacService.listRbacRoles({
        id: "role_super_admin",
      });
      if (superAdminRoles.length > 0) {
        roles = [superAdminRoles[0].id];
      }
    }

    const {
      result: [user],
    } = await createUsersWorkflow(container).run({
      input: { users: [{ email, roles }] },
    });

    const authService = container.resolve(Modules.AUTH);
    const { authIdentity, error } = await authService.register("emailpass", {
      body: { email, password },
    });
    if (error || !authIdentity) {
      throw new Error(typeof error === "string" ? error : JSON.stringify(error));
    }

    await authService.updateAuthIdentities({
      id: authIdentity.id,
      app_metadata: { user_id: user.id },
    });

    logger.info(`create-admin-user: created admin user ${email}.`);
  } catch (e: any) {
    logger.error(
      `create-admin-user did not complete (create one manually with \`npx medusa user -e <email> -p <password>\`): ${
        e?.message ?? e
      }`
    );
  }
}

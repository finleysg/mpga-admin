import { createAccessControl } from "better-auth/plugins/access";

/**
 * Access control statements defining all possible permissions in the system.
 * Each resource maps to an array of allowed actions.
 */
const statements = {
  user: ["create", "list", "get", "set-role", "ban", "delete"],
  session: ["list", "revoke"],
  invitation: ["create", "list", "revoke"],
} as const;

/**
 * Access control instance with all permission statements.
 */
export const ac = createAccessControl(statements);

/**
 * Super admin role with full permissions across all resources.
 */
export const superAdminRole = ac.newRole({
  user: ["create", "list", "get", "set-role", "ban", "delete"],
  session: ["list", "revoke"],
  invitation: ["create", "list", "revoke"],
});

/**
 * Admin role with minimal read-only user permissions.
 */
export const adminRole = ac.newRole({
  user: ["get"],
});

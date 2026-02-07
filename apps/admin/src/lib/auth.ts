import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

import { db } from "./db";
import { ac, adminRole, superAdminRole } from "./permissions";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "mysql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [
    admin({
      defaultRole: "admin",
      adminRoles: ["super_admin", "admin"],
      ac,
      roles: {
        super_admin: superAdminRole,
        admin: adminRole,
      },
    }),
  ],
});

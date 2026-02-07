/**
 * Seed script to bootstrap the first super_admin account.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret123 npx tsx scripts/seed-admin.ts
 *
 * Required env vars:
 *   - ADMIN_EMAIL: The email for the super_admin account
 *   - ADMIN_PASSWORD: The password for the super_admin account
 *   - DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME
 */

import { auth } from "../apps/admin/src/lib/auth";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required",
    );
    process.exit(1);
  }

  console.log(`Creating super_admin account for ${email}...`);

  try {
    const result = await auth.api.createUser({
      body: {
        email,
        password,
        name: "Super Admin",
        role: "super_admin",
      },
    });

    if (!result) {
      console.error("Error: Failed to create user - no result returned");
      process.exit(1);
    }

    console.log(`Success! Created super_admin user with ID: ${result.id}`);
    console.log(`Email: ${email}`);
    console.log(`Role: super_admin`);
    console.log("");
    console.log("You can now log in at /login with these credentials.");
    process.exit(0);
  } catch (error) {
    console.error("Error creating super_admin user:", error);
    process.exit(1);
  }
}

main();

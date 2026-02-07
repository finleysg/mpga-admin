# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
pnpm dev              # Start all apps in dev mode (uses Turbo)
pnpm build            # Build all packages and apps
pnpm lint             # Run ESLint across workspace
pnpm typecheck        # TypeScript validation
pnpm format           # Format with Prettier

# Database (Drizzle ORM)
pnpm db:generate      # Generate migrations from schema
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Drizzle Studio UI
```

## Architecture

**Monorepo Structure**: pnpm workspaces + Turborepo

- `apps/public` - Public-facing Next.js site (dev port 4000, Docker maps 4000→3000)
- `apps/admin` - Admin dashboard Next.js app (port 3001, Docker: 4001)
- `packages/database` - Drizzle ORM schema and MySQL client
- `packages/types` - Shared TypeScript type definitions
- `packages/ui` - Shared React components (PostCard, PostList)
- `tooling/` - Shared ESLint, Tailwind, and TypeScript configs

**Dependency Flow**: Apps → `@mpga/ui` → `@mpga/types` → `@mpga/database`

## Key Technologies

- **Next.js 15** with App Router (`output: "standalone"` for Docker)
- **Drizzle ORM** with MySQL 8.4 (connection pool via mysql2)
- **Better Auth** for admin authentication (email/password, 7-day sessions)
- **Tailwind CSS** with shared base config in `tooling/tailwind`

## Database Migrations

- **Development**: Use `pnpm db:push` for fast iteration (applies schema directly, no migration files)
- **Production**: Use `pnpm db:generate` to create migration files, then `drizzle-kit migrate` to apply them in order
- Migration files live in `packages/database/drizzle/`
- The `__drizzle_migrations` table tracks which migrations have been applied
- Schema is the source of truth: `packages/database/src/schema/`
- Before deploying, always run `pnpm db:generate` to capture schema changes as a migration, review the SQL, and commit it

## Database Schema

Located in `packages/database/src/schema/`:

## Authentication (Admin Only)

- Config: `apps/admin/src/lib/auth.ts`
- Client: `apps/admin/src/lib/auth-client.ts`
- Middleware protects all admin routes except `/login` and `/api/auth`
- Session cookie: `better-auth.session_token`

## Styles

- Use shadcn blocks and components
- The public site is based on the primary pallette
- Users of the public site will be on their phone most often (80-90%)
- The admin site is based on the secondary pallette - use secondary-500 for headings
- The admin site should be responsive, but users will primarily be on a laptop
- Always use the font-heading class for h tags

## Docker Development

```bash
docker compose up     # Starts: public, admin, mysql, stripe-cli, mailpit
```

Services: MySQL (26061), Mailpit web UI (8035), Stripe webhook forwarding

## Environment Variables

Copy `.env.example` to `.env`. Required: `DATABASE_*`, `BETTER_AUTH_*`, `STRIPE_*`, `MAIL_*`

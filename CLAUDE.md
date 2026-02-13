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

# Docker (dev runs in docker compose)
docker compose up -d --build admin    # Rebuild & restart admin container
docker compose up -d --build public   # Rebuild & restart public container
docker compose up -d --build          # Rebuild & restart all containers
```

## Debugging

When debugging Docker or Next.js dev server issues, always clear the .next cache directory first before investigating further. Stale caches are a frequent root cause of 404s, rendering bugs, and false alarms in this project.

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

## Database

- **Development**: Use `pnpm db:push` for fast iteration (applies schema directly, no migration files)
- **Production**: Use `pnpm db:generate` to create migration files, then `drizzle-kit migrate` to apply them in order
- Migration files live in `packages/database/drizzle/`
- The `__drizzle_migrations` table tracks which migrations have been applied
- Schema is the source of truth: `packages/database/src/schema/`
- Before deploying, always run `pnpm db:generate` to capture schema changes as a migration, review the SQL, and commit it

For database migrations, always use `drizzle-kit push` for dev and never manually create migration/snapshot files. Be aware that drizzle-kit push may have interactive prompts that need handling.

Database Schema is located in `packages/database/src/schema/`

## Authentication (Admin Only)

- Config: `apps/admin/src/lib/auth.ts`
- Client: `apps/admin/src/lib/auth-client.ts`
- Middleware protects all admin routes except `/login` and `/api/auth`
- Session cookie: `better-auth.session_token`

## UI Development

After making UI/CSS changes, always verify the visual result by checking the actual rendering context (viewport position, dynamic sizing) rather than assuming static values will work.

- Use shadcn blocks and components
- The public site is based on the primary pallette
- Users of the public site will be on their phone most often (80-90%)
- The admin site is based on the secondary pallette - use secondary-500 for headings
- The admin site should be responsive, but users will primarily be on a laptop
- Always use the font-heading class for h tags

## Code Style

NOTE: we have customized Prettier in the following way:

```json
{
	"printWidth": 100,
	"semi": false,
	"singleQuote": false,
	"useTabs": true
}
```

This project uses tab-based indentation. When editing files, preserve tab indentation exactly. If an Edit tool call fails due to whitespace mismatch, use Write or Bash(sed) instead of retrying Edit repeatedly.

This project uses TypeScript with strict mode. Always handle possibly-undefined array accesses with non-null assertions or proper guards. Use the full markdown editor component (ContentEditor) for any rich text fields, not simplified alternatives.

## Feedback

ALWAYS: pnpm format
ALWAYS: pnpm lint (fix warnings and errors, even if pre-existing)
ALWAYS: pnpm test (fix failures, even if pre-existing)
ALWAYS: pnpm build

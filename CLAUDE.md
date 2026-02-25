# CLAUDE.md

## Debugging

When a change is made to a next app, rebuild the container.

When debugging Docker or Next.js dev server issues, always clear the .next cache directory first before investigating further. Stale caches are a frequent root cause of 404s, rendering bugs, and false alarms in this project.

## Architecture

**Monorepo Structure**: pnpm workspaces + Turborepo
**Dependency Flow**: Apps → `@mpga/ui` → `@mpga/types` → `@mpga/database`

## Database

- **Development**: Use `pnpm db:push` for fast iteration (applies schema directly, no migration files)
- **Production**: Use `pnpm db:generate` to create migration files, then `drizzle-kit migrate` to apply them in order

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

This project uses TypeScript with strict mode. Always handle possibly-undefined array accesses with non-null assertions or proper guards. Use the full markdown editor component (ContentEditor) for any rich text fields, not simplified alternatives.

### IMPORTANT: UX Feedback

Use the `playwright cli` skill to validate your work directly:

- Public site: http://localhost:4000
- Admin site: http://localhost:4100

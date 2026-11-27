#!/bin/sh
set -e
# Apply any migrations in the journal that this database hasn't recorded yet. Production records
# every migration it has (0000 onward) in __drizzle_migrations, so only new ones run. migrate.mjs
# serializes concurrent starts with a database lock and refuses to replay the journal over a
# database that has tables but no migration records.
echo "Applying database migrations..."
node packages/database/migrate.mjs
echo "Starting admin app..."
exec node apps/admin/server.js

#!/bin/sh
set -e
echo "Running database migrations..."
node packages/database/migrate.mjs
echo "Starting admin app..."
exec node apps/admin/server.js

#!/bin/sh
set -e
echo "Running database migrations..."
node packages/database/migrate.mjs
echo "Starting public app..."
exec node apps/public/server.js

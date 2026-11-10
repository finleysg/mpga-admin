#!/bin/sh
set -e
# Older schema changes were managed outside startup. Apply only this additive
# migration; do not replay the historical journal against production.
echo "Ensuring contact spam protection schema..."
node packages/database/migrate.mjs --only=0006_wet_microbe
echo "Starting admin app..."
exec node apps/admin/server.js

#!/bin/sh
set -e
# Older schema changes were managed outside startup. Apply only these additive
# migrations; do not replay the historical journal against production.
echo "Ensuring contact spam protection and board library schema..."
node packages/database/migrate.mjs --only=0006_wet_microbe --only=0007_library
echo "Starting admin app..."
exec node apps/admin/server.js

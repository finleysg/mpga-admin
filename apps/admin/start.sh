#!/bin/sh
set -e
echo "Starting admin app..."
exec node apps/admin/server.js

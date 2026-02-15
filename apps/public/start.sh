#!/bin/sh
set -e
echo "Starting public app..."
exec node apps/public/server.js

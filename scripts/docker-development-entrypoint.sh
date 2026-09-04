#!/bin/sh
set -eu

# The source and node_modules are mounted independently in development.
# Regenerate into the per-container .prisma tmpfs so a reused dependency
# volume can never expose a client generated from an older schema.
./node_modules/.bin/prisma generate

exec "$@"

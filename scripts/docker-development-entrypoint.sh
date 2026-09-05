#!/bin/sh
set -eu

# Generate from the schema packaged in the image. The prisma-cli authoring
# service may instead provide the host's Prisma directory through its narrow
# bind mount.
./node_modules/.bin/prisma generate

exec "$@"

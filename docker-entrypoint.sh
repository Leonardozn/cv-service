#!/bin/sh
# Syncs the catalog assets baked into the image (Template preview images) into the upload
# directory on every container start — not just when the volume is created. A named/persistent
# volume mounted at API_UPLOAD_PATH is only auto-seeded by Docker the first time it's empty, so a
# volume that already holds user uploads (or an older template image) would never pick up a new
# or updated template preview without this step.
set -e

upload_path="${API_UPLOAD_PATH:-/app/api-uploads}"
mkdir -p "$upload_path"
cp /app/assets/templates/*.png "$upload_path/"

exec "$@"

#!/bin/sh
set -eu
python3 scripts/sync-release-docs.py
python3 plugin/build.py
node plugin/test_core.js
node plugin/test_fresh_start.js
node plugin/test_interaction.js
node plugin/test_platform.js
node plugin/test_live.js
python3 scripts/package.py
VERSION=$(node -p "require('./version.json').version")
node website/scripts/prepare-release.mjs 'dist/doppelgänger-share.zip' "$VERSION"

#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
node --check game.js
node --check pixel-art.js
node --check environment-art.js
for file in qa*.mjs; do node "$file"; done
node qa-phase25.cjs
node qa-phase26.cjs
node qa-phase27.cjs
node qa-phase29.cjs
node qa-phase30.cjs
node qa-campaign.cjs

#!/usr/bin/env bash
# Doble clic: marcar este archivo como ejecutable. Sin sudo, sin instalación.
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
cd "$SCRIPT_DIR"
printf '\n  INTO THE ABYSS 404 — REBIRTH v0.65 (LINUX)\n  Partidas: http://127.0.0.1:8765/\n\n'
if command -v python3 >/dev/null 2>&1; then
  exec python3 "$SCRIPT_DIR/launch-local.py"
elif command -v node >/dev/null 2>&1; then
  exec node "$SCRIPT_DIR/launch-local.cjs"
else
  printf '%s\n' 'ERROR: se necesita Python 3 o Node.js. En Linux Mint suele venir Python 3 instalado.' >&2
  printf '%s\n' 'Instalación opcional: sudo apt install python3' >&2
  if [[ -t 0 ]]; then read -rp 'Pulsa Intro para salir...' _ || true; fi
  exit 1
fi

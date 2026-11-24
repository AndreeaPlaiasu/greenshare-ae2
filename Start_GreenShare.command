#!/bin/zsh
cd "$(dirname "$0")" || exit 1
if [[ ! -f .env.local ]]; then
  echo 'Configure .env.local as described in README.md first.'
  read -r '?Press Enter to close.'
  exit 1
fi
if command -v node >/dev/null 2>&1; then
  node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1
elif [[ -x /Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node ]]; then
  export NEXT_TEST_WASM=1
  export NEXT_TEST_WASM_DIR="$PWD/node_modules/@next/swc-wasm-nodejs"
  export NEXT_TELEMETRY_DISABLED=1
  /Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1
else
  echo 'Install Node.js 22.18+ and follow README.md.'
  read -r '?Press Enter to close.'
fi

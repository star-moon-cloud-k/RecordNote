#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RES_BIN_DIR="${PROJECT_ROOT}/resources/bin"

mkdir -p "${RES_BIN_DIR}"

if [[ -x "/opt/homebrew/bin/ffmpeg" ]]; then
  FFMPEG_SRC="/opt/homebrew/bin/ffmpeg"
elif command -v ffmpeg >/dev/null 2>&1; then
  FFMPEG_SRC="$(command -v ffmpeg)"
else
  echo "ffmpeg not found. Install it first with: brew install ffmpeg"
  exit 1
fi

cp "${FFMPEG_SRC}" "${RES_BIN_DIR}/ffmpeg"
chmod +x "${RES_BIN_DIR}/ffmpeg"

echo "Installed ffmpeg to ${RES_BIN_DIR}/ffmpeg"
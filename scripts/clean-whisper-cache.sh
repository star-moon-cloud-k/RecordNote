#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

rm -rf "${PROJECT_ROOT}/.cache/whisper.cpp"
find "${PROJECT_ROOT}/resources/bin" -name ".DS_Store" -delete
find "${PROJECT_ROOT}/resources/models" -name ".DS_Store" -delete
find "${PROJECT_ROOT}/resources/licenses" -name ".DS_Store" -delete

echo "whisper temporary cache cleaned."
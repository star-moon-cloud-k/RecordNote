#!/usr/bin/env bash
set -euo pipefail

# ===== configurable =====
WHISPER_REPO_URL="https://github.com/ggml-org/whisper.cpp.git"
WHISPER_REF="${WHISPER_REF:-master}"
# WHISPER_MODEL="${WHISPER_MODEL:-small}"
WHISPER_MODEL=large-v3
# WHISPER_MODEL=large-v3-turbo
# WHISPER_MODEL=medium 


PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="${PROJECT_ROOT}/.cache"
WORK_DIR="${CACHE_DIR}/whisper.cpp"
RES_BIN_DIR="${PROJECT_ROOT}/resources/bin"
RES_MODEL_DIR="${PROJECT_ROOT}/resources/models"
RES_LICENSE_DIR="${PROJECT_ROOT}/resources/licenses"

mkdir -p "${CACHE_DIR}" "${RES_BIN_DIR}" "${RES_MODEL_DIR}" "${RES_LICENSE_DIR}"

echo "[1/7] checking dependencies..."
command -v git >/dev/null 2>&1 || { echo "git not found"; exit 1; }
command -v cmake >/dev/null 2>&1 || { echo "cmake not found"; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg not found"; exit 1; }

echo "[2/7] cleaning previous temporary build dir..."
rm -rf "${WORK_DIR}"

echo "[3/7] cloning whisper.cpp..."
git clone --depth 1 --branch "${WHISPER_REF}" "${WHISPER_REPO_URL}" "${WORK_DIR}"

pushd "${WORK_DIR}" >/dev/null

echo "[4/7] downloading model: ${WHISPER_MODEL}"
sh ./models/download-ggml-model.sh "${WHISPER_MODEL}"

echo "[5/7] building whisper-cli..."
cmake -B build
cmake --build build -j --config Release

WHISPER_BIN_SRC="${WORK_DIR}/build/bin/whisper-cli"
WHISPER_MODEL_SRC="${WORK_DIR}/models/ggml-${WHISPER_MODEL}.bin"
WHISPER_LICENSE_SRC="${WORK_DIR}/LICENSE"

if [[ ! -f "${WHISPER_BIN_SRC}" ]]; then
  echo "whisper-cli not found: ${WHISPER_BIN_SRC}"
  exit 1
fi

if [[ ! -f "${WHISPER_MODEL_SRC}" ]]; then
  echo "model file not found: ${WHISPER_MODEL_SRC}"
  exit 1
fi

echo "[6/7] copying runtime files into project resources..."
cp "${WHISPER_BIN_SRC}" "${RES_BIN_DIR}/whisper-cli"
chmod +x "${RES_BIN_DIR}/whisper-cli"

cp "${WHISPER_MODEL_SRC}" "${RES_MODEL_DIR}/ggml-${WHISPER_MODEL}.bin"
cp "${WHISPER_LICENSE_SRC}" "${RES_LICENSE_DIR}/whisper.cpp.LICENSE"

popd >/dev/null

echo "[7/7] cleaning temporary build dir..."
rm -rf "${WORK_DIR}"

echo
echo "Done."
echo "Installed files:"
echo "  - ${RES_BIN_DIR}/whisper-cli"
echo "  - ${RES_MODEL_DIR}/ggml-${WHISPER_MODEL}.bin"
echo "  - ${RES_LICENSE_DIR}/whisper.cpp.LICENSE"
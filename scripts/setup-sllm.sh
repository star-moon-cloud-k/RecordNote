#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RES_MODEL_DIR="${PROJECT_ROOT}/resources/models"
RES_LICENSE_DIR="${PROJECT_ROOT}/resources/licenses"
TMP_DIR="${PROJECT_ROOT}/.cache/sllm"

# 기본값: Qwen3-4B-GGUF Q4_K_M
MODEL_URL="${MODEL_URL:-https://huggingface.co/Qwen/Qwen3-4B-GGUF/resolve/main/Qwen3-4B-Q4_K_M.gguf?download=true}"
MODEL_FILE_NAME="${MODEL_FILE_NAME:-summary-model.gguf}"
MODEL_LICENSE_URL="${MODEL_LICENSE_URL:-}"
HF_TOKEN="${HF_TOKEN:-}"

mkdir -p "${RES_MODEL_DIR}" "${RES_LICENSE_DIR}" "${TMP_DIR}"

echo "[1/6] checking dependencies..."
command -v curl >/dev/null 2>&1 || { echo "curl not found"; exit 1; }

TARGET_MODEL_PATH="${RES_MODEL_DIR}/${MODEL_FILE_NAME}"
TMP_MODEL_PATH="${TMP_DIR}/${MODEL_FILE_NAME}"

echo "[2/6] target model path:"
echo "  ${TARGET_MODEL_PATH}"

echo "[3/6] cleaning previous temp file..."
rm -f "${TMP_MODEL_PATH}"

echo "[4/6] downloading model..."
if [[ -n "${HF_TOKEN}" ]]; then
  curl -L --fail --progress-bar \
    -H "Authorization: Bearer ${HF_TOKEN}" \
    "${MODEL_URL}" \
    -o "${TMP_MODEL_PATH}"
else
  curl -L --fail --progress-bar \
    "${MODEL_URL}" \
    -o "${TMP_MODEL_PATH}"
fi

if [[ ! -f "${TMP_MODEL_PATH}" ]]; then
  echo "download failed: ${TMP_MODEL_PATH}"
  exit 1
fi

echo "[5/6] moving model into resources..."
mv "${TMP_MODEL_PATH}" "${TARGET_MODEL_PATH}"

if [[ -n "${MODEL_LICENSE_URL}" ]]; then
  LICENSE_FILE_NAME="${MODEL_FILE_NAME}.LICENSE.txt"
  echo "[6/6] downloading license..."
  if [[ -n "${HF_TOKEN}" ]]; then
    curl -L --fail --progress-bar \
      -H "Authorization: Bearer ${HF_TOKEN}" \
      "${MODEL_LICENSE_URL}" \
      -o "${RES_LICENSE_DIR}/${LICENSE_FILE_NAME}"
  else
    curl -L --fail --progress-bar \
      "${MODEL_LICENSE_URL}" \
      -o "${RES_LICENSE_DIR}/${LICENSE_FILE_NAME}"
  fi
else
  echo "[6/6] no MODEL_LICENSE_URL provided, skipping license download..."
fi

echo
echo "Done."
echo "Installed model:"
echo "  - ${TARGET_MODEL_PATH}"
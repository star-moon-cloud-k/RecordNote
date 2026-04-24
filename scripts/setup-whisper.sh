#!/usr/bin/env bash
set -euo pipefail

# ===== configurable =====
WHISPER_REPO_URL="https://github.com/ggml-org/whisper.cpp.git"
WHISPER_REF="${WHISPER_REF:-master}"
WHISPER_MODEL="${WHISPER_MODEL:-large-v3}"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="${PROJECT_ROOT}/.cache"
WORK_DIR="${CACHE_DIR}/whisper.cpp"

RES_BIN_DIR="${PROJECT_ROOT}/resources/bin"
RES_LIB_DIR="${PROJECT_ROOT}/resources/lib"
RES_MODEL_DIR="${PROJECT_ROOT}/resources/models"
RES_LICENSE_DIR="${PROJECT_ROOT}/resources/licenses"

mkdir -p "${CACHE_DIR}" "${RES_BIN_DIR}" "${RES_LIB_DIR}" "${RES_MODEL_DIR}" "${RES_LICENSE_DIR}"

echo "[1/9] checking dependencies..."
command -v git >/dev/null 2>&1 || { echo "git not found"; exit 1; }
command -v cmake >/dev/null 2>&1 || { echo "cmake not found"; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg not found"; exit 1; }
command -v install_name_tool >/dev/null 2>&1 || { echo "install_name_tool not found"; exit 1; }

echo "[2/9] cleaning previous temporary build dir..."
rm -rf "${WORK_DIR}"

echo "[3/9] cleaning previous bundled whisper runtime..."
rm -f "${RES_BIN_DIR}/whisper-cli"
rm -f "${RES_LIB_DIR}"/libwhisper*.dylib
rm -f "${RES_LIB_DIR}"/libggml*.dylib
rm -f "${RES_MODEL_DIR}"/ggml-*.bin
rm -f "${RES_LICENSE_DIR}/whisper.cpp.LICENSE"

echo "[4/9] cloning whisper.cpp..."
git clone --depth 1 --branch "${WHISPER_REF}" "${WHISPER_REPO_URL}" "${WORK_DIR}"

pushd "${WORK_DIR}" >/dev/null

echo "[5/9] downloading model: ${WHISPER_MODEL}"
sh ./models/download-ggml-model.sh "${WHISPER_MODEL}"

echo "[6/9] building whisper-cli..."
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

echo "[7/9] copying runtime files into project resources..."
cp "${WHISPER_BIN_SRC}" "${RES_BIN_DIR}/whisper-cli"
chmod +x "${RES_BIN_DIR}/whisper-cli"

cp "${WHISPER_MODEL_SRC}" "${RES_MODEL_DIR}/ggml-${WHISPER_MODEL}.bin"
cp "${WHISPER_LICENSE_SRC}" "${RES_LICENSE_DIR}/whisper.cpp.LICENSE"

# copy dylibs needed by whisper-cli
find "${WORK_DIR}/build" -name "libwhisper*.dylib" -exec cp {} "${RES_LIB_DIR}/" \;
find "${WORK_DIR}/build" -name "libggml*.dylib" -exec cp {} "${RES_LIB_DIR}/" \;

echo "[8/9] patching rpath for bundled whisper-cli..."
install_name_tool -add_rpath "@executable_path/../lib" "${RES_BIN_DIR}/whisper-cli" 2>/dev/null || true

# normalize any absolute/cached references to @rpath basename
for LIB in "${RES_LIB_DIR}"/*.dylib; do
  [[ -e "${LIB}" ]] || continue
  BASENAME="$(basename "${LIB}")"

  # patch whisper-cli dependency edges
  CURRENT_DEPS="$(otool -L "${RES_BIN_DIR}/whisper-cli" | tail -n +2 | awk '{print $1}')"
  while IFS= read -r DEP; do
    if [[ "$(basename "${DEP}")" == "${BASENAME}" ]]; then
      install_name_tool -change "${DEP}" "@rpath/${BASENAME}" "${RES_BIN_DIR}/whisper-cli" 2>/dev/null || true
    fi
  done <<< "${CURRENT_DEPS}"

  # patch dylib install id
  install_name_tool -id "@rpath/${BASENAME}" "${LIB}" 2>/dev/null || true

  # patch dylib-to-dylib dependency edges
  for OTHER in "${RES_LIB_DIR}"/*.dylib; do
    [[ -e "${OTHER}" ]] || continue
    OTHER_BASENAME="$(basename "${OTHER}")"
    CURRENT_LIB_DEPS="$(otool -L "${LIB}" | tail -n +2 | awk '{print $1}')"
    while IFS= read -r LIB_DEP; do
      if [[ "$(basename "${LIB_DEP}")" == "${OTHER_BASENAME}" ]]; then
        install_name_tool -change "${LIB_DEP}" "@rpath/${OTHER_BASENAME}" "${LIB}" 2>/dev/null || true
      fi
    done <<< "${CURRENT_LIB_DEPS}"
  done
done

echo "[9/9] verifying bundled whisper-cli linkage..."
otool -L "${RES_BIN_DIR}/whisper-cli" || true

popd >/dev/null

echo
echo "Done."
echo "Installed files:"
echo "  - ${RES_BIN_DIR}/whisper-cli"
echo "  - ${RES_LIB_DIR}/*.dylib"
echo "  - ${RES_MODEL_DIR}/ggml-${WHISPER_MODEL}.bin"
echo "  - ${RES_LICENSE_DIR}/whisper.cpp.LICENSE"
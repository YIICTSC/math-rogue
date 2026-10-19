#!/usr/bin/env bash
set -euo pipefail
# Pinned official latest revisions inspected on 2026-10-19; no app dependencies change.
IRODORI_TASK_DIR="${IRODORI_WORK_DIR:-/workspace/tools/irodori-server}"
IRODORI_SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if ! command -v uv >/dev/null; then printf '%s\n' 'Install uv first: https://docs.astral.sh/uv/getting-started/installation/' >&2; exit 1; fi
if [ ! -d "$IRODORI_TASK_DIR/.git" ]; then git clone https://github.com/Aratako/Irodori-TTS-Server.git "$IRODORI_TASK_DIR"; fi
git -C "$IRODORI_TASK_DIR" checkout --detach 61012c760f22f7b4a6c21c5c5f8f9e148120b6f9
cd "$IRODORI_TASK_DIR"
uv sync --frozen --extra cpu
export IRODORI_HF_CHECKPOINT=Aratako/Irodori-TTS-v4.1-Small-MF
IRODORI_SNAPSHOT="$(.venv/bin/python -c 'from huggingface_hub import snapshot_download; print(snapshot_download("Aratako/Irodori-TTS-v4.1-Small-MF", revision="ccc78f5d480b6e51b69b2d5042a14c4da04fea6e", allow_patterns=["model.safetensors", "tokenizer/*"]))')"
export IRODORI_CHECKPOINT="$IRODORI_SNAPSHOT/model.safetensors"
export IRODORI_MODEL_DEVICE=cpu IRODORI_CODEC_DEVICE=cpu
export IRODORI_MODEL_PRECISION=fp32 IRODORI_CODEC_PRECISION=fp32
export IRODORI_MAX_CONCURRENT_SYNTHESIS=1 IRODORI_MODEL_LOAD_TIMEOUT=900
export OMP_NUM_THREADS="${OMP_NUM_THREADS:-2}" MKL_NUM_THREADS="${MKL_NUM_THREADS:-2}"
exec .venv/bin/python "$IRODORI_SCRIPT_DIR/run-cloud.py" --host "${IRODORI_BIND_HOST:-127.0.0.1}" --port "${IRODORI_BIND_PORT:-8088}"

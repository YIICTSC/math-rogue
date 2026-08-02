#!/bin/zsh

set -u

APP_DIR="/Users/admin/Documents/Codex/学習ローグ"
PORT="5174"
URL="http://127.0.0.1:${PORT}"
LOG_DIR="/Users/admin/Library/Logs"
LOG_FILE="${LOG_DIR}/LearningRogue-local.log"
RUNTIME_ROOT="/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies"
FALLBACK_BIN="${RUNTIME_ROOT}/bin/fallback"
NODE_BIN="${RUNTIME_ROOT}/node/bin"

mkdir -p "${LOG_DIR}"

open_game() {
  if [[ "${LEARNING_ROGUE_NO_OPEN:-0}" != "1" ]]; then
    /usr/bin/open "${URL}"
  fi
}

if /usr/bin/curl -fsS --max-time 1 "${URL}" >/dev/null 2>&1; then
  echo "学習ローグのローカル版は起動済みです。"
  open_game
  exit 0
fi

if [[ ! -d "${APP_DIR}" ]]; then
  /usr/bin/osascript -e 'display alert "学習ローグを起動できません" message "アプリのフォルダが見つかりません。" as critical'
  exit 1
fi

export PATH="${NODE_BIN}:${FALLBACK_BIN}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

if ! command -v node >/dev/null 2>&1 || ! command -v pnpm >/dev/null 2>&1; then
  /usr/bin/osascript -e 'display alert "学習ローグを起動できません" message "ローカル実行に必要なNode.jsまたはpnpmが見つかりません。" as critical'
  exit 1
fi

cd "${APP_DIR}" || exit 1

if [[ "${LEARNING_ROGUE_CHECK_ONLY:-0}" == "1" ]]; then
  echo "ショートカットの起動前検査に合格しました。"
  exit 0
fi

echo "学習ローグのローカル版を起動しています…"
echo "このターミナルを閉じるとローカル版も停止します。"
echo "ログ: ${LOG_FILE}"

(
  for attempt in {1..120}; do
    if /usr/bin/curl -fsS --max-time 1 "${URL}" >/dev/null 2>&1; then
      echo "起動しました: ${URL}"
      open_game
      exit 0
    fi
    sleep 0.25
  done

  /usr/bin/osascript -e 'display alert "学習ローグを起動できません" message "起動ログは ~/Library/Logs/LearningRogue-local.log に保存されています。" as critical'
) &

env VITE_ENABLE_DEBUG_FEATURES=true pnpm exec vite \
  --host 127.0.0.1 \
  --port "${PORT}" \
  2>&1 | /usr/bin/tee -a "${LOG_FILE}"

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
IOS_PROJECT="$ROOT_DIR/ios/App/App.xcodeproj"
SCHEME="${IOS_SCHEME:-App}"
SIMULATOR="${IOS_SIMULATOR:-iPhone 17 Pro}"
DERIVED_DATA="${IOS_DERIVED_DATA:-$ROOT_DIR/.codex-ios-derived-data}"
NODE_BIN="${NODE_BIN:-$(command -v node || true)}"

if [[ -z "$NODE_BIN" ]]; then
  CODEX_NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
  if [[ -x "$CODEX_NODE" ]]; then
    NODE_BIN="$CODEX_NODE"
  else
    echo "Node.js 22以上をPATHへ追加してください。" >&2
    exit 1
  fi
fi

if [[ ! -d "$IOS_PROJECT" ]]; then
  echo "iOSプロジェクトがありません。先に npm run ios:add を実行してください。" >&2
  exit 1
fi

cd "$ROOT_DIR"
VITE_APP_PLATFORM=ios VITE_PAID_EDITION=true "$NODE_BIN" node_modules/vite/bin/vite.js build
"$NODE_BIN" node_modules/@capacitor/cli/bin/capacitor sync ios

DEVICE_ID="$(xcrun simctl list devices available | sed -n "s/^[[:space:]]*$SIMULATOR (\([^)]*\)) (.*$/\1/p" | head -n 1)"
if [[ -z "$DEVICE_ID" ]]; then
  echo "利用可能なSimulator '$SIMULATOR' が見つかりません。IOS_SIMULATORで機種名を指定してください。" >&2
  xcrun simctl list devices available >&2
  exit 1
fi

xcrun simctl boot "$DEVICE_ID" 2>/dev/null || true
open -a Simulator
xcrun simctl bootstatus "$DEVICE_ID" -b

xcodebuild \
  -project "$IOS_PROJECT" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -destination "platform=iOS Simulator,id=$DEVICE_ID" \
  -derivedDataPath "$DERIVED_DATA" \
  CODE_SIGNING_ALLOWED=NO \
  build

APP_PATH="$DERIVED_DATA/Build/Products/Debug-iphonesimulator/App.app"
xcrun simctl install "$DEVICE_ID" "$APP_PATH"
xcrun simctl launch "$DEVICE_ID" jp.yusukeishige.learningrogue

echo "学習ローグを $SIMULATOR ($DEVICE_ID) で起動しました。"

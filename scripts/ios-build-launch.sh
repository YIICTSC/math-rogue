#!/usr/bin/env bash
set -euo pipefail

if [[ -n "${IOS_DEVELOPER_DIR:-}" ]]; then
  export DEVELOPER_DIR="$IOS_DEVELOPER_DIR"
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
IOS_PROJECT="$ROOT_DIR/ios/App/App.xcodeproj"
SCHEME="${IOS_SCHEME:-App}"
SIMULATOR="${IOS_SIMULATOR:-iPhone 17 Pro}"
FALLBACK_SIMULATOR="${IOS_SIMULATOR_FALLBACK:-iPhone 16 Pro}"
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

SIMULATOR_RUNTIME="${IOS_SIMULATOR_RUNTIME:-$(xcrun simctl list runtimes available | sed -n 's/^iOS .* - \(com.apple.CoreSimulator.SimRuntime[^ ]*\)$/\1/p' | tail -n 1)}"
if [[ -z "$SIMULATOR_RUNTIME" ]]; then
  echo "利用可能なiOS Simulator Runtimeが見つかりません。XcodeのSettings > ComponentsからiOS Runtimeを追加してください。" >&2
  xcrun simctl list runtimes >&2
  exit 1
fi

SIMULATOR_RUNTIME_VERSION="$(xcrun simctl list runtimes available | awk -v runtime="$SIMULATOR_RUNTIME" '$0 ~ (" - " runtime "$") { print $2; exit }')"
if [[ -z "$SIMULATOR_RUNTIME_VERSION" ]]; then
  echo "指定したSimulator Runtime '$SIMULATOR_RUNTIME' のバージョンを判定できません。" >&2
  xcrun simctl list runtimes >&2
  exit 1
fi

find_device_id() {
  local device_name="$1"
  xcrun simctl list devices available | awk -v target="$device_name" -v runtime="$SIMULATOR_RUNTIME_VERSION" '
    /^-- iOS / {
      current_runtime=$3;
      next;
    }
    {
      line = $0;
      sub(/^[[:space:]]*/, "", line);
      prefix = target " (";
      if (current_runtime == runtime && index(line, prefix) == 1) {
        remainder = substr(line, length(prefix) + 1);
        closing = index(remainder, ")");
        print substr(remainder, 1, closing - 1);
        exit;
      }
    }
  '
}

find_device_type_id() {
  local device_name="$1"
  xcrun simctl list devicetypes | awk -v target="$device_name" '
    {
      line = $0;
      sub(/^[[:space:]]*/, "", line);
      prefix = target " (";
      if (index(line, prefix) == 1) {
        remainder = substr(line, length(prefix) + 1);
        closing = index(remainder, ")");
        print substr(remainder, 1, closing - 1);
        exit;
      }
    }
  '
}

DEVICE_ID="$(find_device_id "$SIMULATOR")"
if [[ -z "$DEVICE_ID" ]]; then
  DEVICE_TYPE_ID="$(find_device_type_id "$SIMULATOR")"
  if [[ -n "$DEVICE_TYPE_ID" ]] && DEVICE_ID="$(xcrun simctl create "$SIMULATOR" "$DEVICE_TYPE_ID" "$SIMULATOR_RUNTIME" 2>/dev/null)"; then
    echo "実機が未接続のため、Simulator '$SIMULATOR' を作成しました。"
  else
    echo "Simulator '$SIMULATOR' はRuntime '$SIMULATOR_RUNTIME'と互換性がありません。'$FALLBACK_SIMULATOR'へ切り替えます。"
    SIMULATOR="$FALLBACK_SIMULATOR"
    DEVICE_ID="$(find_device_id "$SIMULATOR")"
    if [[ -z "$DEVICE_ID" ]]; then
      DEVICE_TYPE_ID="$(find_device_type_id "$SIMULATOR")"
      if [[ -z "$DEVICE_TYPE_ID" ]]; then
        echo "利用可能なSimulatorデバイスタイプ '$SIMULATOR' が見つかりません。IOS_SIMULATORで機種名を指定してください。" >&2
        xcrun simctl list devicetypes >&2
        exit 1
      fi
      DEVICE_ID="$(xcrun simctl create "$SIMULATOR" "$DEVICE_TYPE_ID" "$SIMULATOR_RUNTIME")"
      echo "実機が未接続のため、Simulator '$SIMULATOR' を作成しました。"
    fi
  fi
fi

DESTINATIONS="$(xcodebuild -project "$IOS_PROJECT" -scheme "$SCHEME" -showdestinations 2>&1 || true)"
if ! awk '/platform:iOS Simulator,/ && $0 !~ /error/ { found=1 } END { exit !found }' <<<"$DESTINATIONS"; then
  echo "Xcodeで利用可能なSimulatorのビルド先が見つかりません。実機は必要ありませんが、選択中のXcodeに対応するiOS Simulator Runtimeを追加してください。" >&2
  echo "Xcode: ${DEVELOPER_DIR:-$(xcode-select -p)}" >&2
  echo "Runtime: $SIMULATOR_RUNTIME ($SIMULATOR_RUNTIME_VERSION)" >&2
  printf '%s\n' "$DESTINATIONS" | sed -n '/Ineligible destinations/,$p' >&2
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

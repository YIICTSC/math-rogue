#!/usr/bin/env bash
set -euo pipefail

# Local signing wrapper. The upload key/password never enter the repository.
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
keystore="$repo_root/build/android-upload-key/learning-rogue-upload-key.p12"
keychain_service='LearningRogue Android Play Upload Key 1.0.9 20261031'
account='jp.yusukeishige.learningrogue'
expected_sha256='887003B19C1C4FA02E7D31C5BDE7647242EE72B595FDDFD6E1A95C3E7927325B'

if [[ ! -f "$keystore" ]]; then
  echo "Upload keystore not found: $keystore" >&2
  exit 1
fi
if ! command -v security >/dev/null || ! command -v openssl >/dev/null; then
  echo 'macOS security and openssl are required.' >&2
  exit 1
fi

password="$(security find-generic-password -a "$account" -s "$keychain_service" -w 2>/dev/null)" || {
  echo 'Upload-key password not available in macOS Keychain.' >&2
  exit 1
}
export ANDROID_KEYSTORE_PASSWORD="$password"
export ANDROID_KEY_PASSWORD="$password"
export ANDROID_KEYSTORE_PATH="$keystore"
export ANDROID_KEYSTORE_TYPE='PKCS12'
export ANDROID_KEY_ALIAS='upload'
unset password

actual_sha256="$(openssl pkcs12 -in "$keystore" -clcerts -nokeys -passin env:ANDROID_KEYSTORE_PASSWORD 2>/dev/null | openssl x509 -noout -fingerprint -sha256 | sed 's/.*=//;s/://g')"
if [[ "$actual_sha256" != "$expected_sha256" ]]; then
  echo 'Upload certificate does not match the Play Console certificate. Build stopped.' >&2
  exit 1
fi

if [[ "${1:-}" == '--verify-only' ]]; then
  echo 'Upload certificate matches Play Console.'
  exit 0
fi

echo 'Upload certificate verified; building signed release AAB.'
cd "$repo_root/android"
exec ./gradlew bundleRelease --no-daemon "$@"

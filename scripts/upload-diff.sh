#!/usr/bin/env bash
set -euo pipefail

message="${1:-}"

if [[ -z "$message" ]]; then
  echo "Usage: ./scripts/upload-diff.sh \"commit message\""
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "This script must be run inside the Git repository."
  exit 1
fi

if [[ -z "$(git status --porcelain)" ]]; then
  echo "No changes to upload."
  exit 0
fi

current_branch="$(git branch --show-current)"

echo "Current branch: $current_branch"
git status --short
echo
read -r -p "Stage all shown changes, commit, and push? [y/N] " answer

case "$answer" in
  y|Y|yes|YES)
    ;;
  *)
    echo "Canceled."
    exit 1
    ;;
esac

if [[ "$current_branch" == "main" ]]; then
  branch="codex/update-$(date +%Y%m%d-%H%M%S)"
  git switch -c "$branch"
else
  branch="$current_branch"
fi

echo "Uploading changes on branch: $branch"
git add -A
git commit -m "$message"
git push -u origin "$branch"

echo
echo "Pushed branch: $branch"

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
printf '%s' 'Firebase Console → Authentication → Users에 표시된 본인 UID: '
IFS= read -r RESEARCH_READER_UID
export RESEARCH_READER_UID
for pack in history/*.json; do
  node cloud-import.mjs "$pack" --verify-only
  node cloud-import.mjs "$pack"
done


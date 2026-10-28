#!/usr/bin/env bash
# 🐾 책방 친구 안드로이드 서명 열쇠를 한 번 만들어 GitHub 저장소 비밀로 넣음(gh 로그인 필요) — 열쇠 파일은 저장소에 넣지 않음
# 쓰는 법: bash friend-app/android/make-keystore.sh   (같은 열쇠를 계속 써야 새 판을 덮어 설치할 수 있음 — 다시 만들지 말 것)
set -euo pipefail
REPO="${REPO:-jerrycson/readnow-scripts}"; T="$(mktemp -d)"; PASS="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)"
keytool -genkeypair -v -keystore "$T/friend.jks" -alias friend -keyalg RSA -keysize 2048 -validity 36500 -storepass "$PASS" -keypass "$PASS" -dname "CN=ReadNow Friend, O=ReadNow, C=KR"
base64 -w0 "$T/friend.jks" | gh secret set FRIEND_KS_B64 -R "$REPO"
printf '%s' "$PASS" | gh secret set FRIEND_KS_PASS -R "$REPO"
printf 'friend' | gh secret set FRIEND_KS_ALIAS -R "$REPO"
echo "✓ 비밀 3개를 $REPO 에 넣음. 열쇠 파일 보관본: $T/friend.jks (정범님 PC 보안 폴더에 옮겨 두면 좋음 · GitHub·대화에 올리지 않음)"

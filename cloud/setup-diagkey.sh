#!/usr/bin/env bash
# 🔑 리드나우 진단 열쇠 만들기 (priv1 11/13) — Google Cloud Shell에서 한 번 (정범님 구글 계정)
#  하는 일: 새 열쇠(64글자)를 만들어 그 해시(sha256)만 Firestore app_secrets/diag_key에 넣고, 열쇠 값은 이 화면에 한 번만 보여 줌
#   → 그 값을 Claude 작업 화면의 '네트워크 비밀' 창(호스트 readnow-cloud-63884079760.asia-northeast3.run.app · 머리 X-RN-Diag-Key)에 붙여 넣음
#   → 그때부터 Claude 세션·예약 점검이 GitHub 자동 작업 없이 클라우드 /diag 에 바로 물음(몇 초 · Actions 분 0)
#  다시 실행하면 열쇠가 바뀜(옛 열쇠는 5분 안에 막힘) — 그때는 네트워크 비밀도 새 값으로 바꿈
#  열쇠 값은 GitHub·대화·파일 어디에도 남기지 않음(이 화면에서 복사만)
set -euo pipefail
P=readnow-3a385
K=$(openssl rand -hex 32); H=$(printf %s "$K" | sha256sum | cut -c1-64); A=$(date -u +%Y-%m-%dT%H:%M:%SZ)
T=$(gcloud auth print-access-token)
curl -fsS -X PATCH -H "Authorization: Bearer $T" -H 'content-type: application/json' \
  "https://firestore.googleapis.com/v1/projects/$P/databases/(default)/documents/app_secrets/diag_key?updateMask.fieldPaths=keys" \
  -d "{\"fields\":{\"keys\":{\"arrayValue\":{\"values\":[{\"mapValue\":{\"fields\":{\"h\":{\"stringValue\":\"$H\"},\"by\":{\"stringValue\":\"cloudshell\"},\"at\":{\"stringValue\":\"$A\"}}}}]}}}}" >/dev/null
echo "✓ 해시를 넣었습니다. 아래 열쇠 한 줄을 복사해 Claude '네트워크 비밀' 창에 붙여 넣으세요(이 화면에만 한 번 보입니다):"
echo
echo "$K"
echo
unset K

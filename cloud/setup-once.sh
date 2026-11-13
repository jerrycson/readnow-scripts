#!/usr/bin/env bash
# ☁🔑 리드나우 한 번에 준비 (cbuild 11/13) — Google Cloud Shell에 이 한 줄만:  curl -sL https://readnow.kr/cloud/setup-once.sh | bash
#  먼저(브라우저 2분 · 한 번): Cloud Build › 저장소(2세대) › 호스트 연결 만들기(서울 asia-northeast3 · GitHub) → GitHub 승인·앱 설치(readnow-scripts만) → 저장소 연결
#  하는 일(차례 · 하나가 안 돼도 나머지는 함 · 다시 돌려도 무해 — 단 ①은 다시 돌리면 열쇠가 바뀜):
#   ① 🔑 진단 열쇠 — 새 열쇠를 만들어 해시만 Firestore에 · 열쇠 값은 이 화면에 한 번만(→ Claude '네트워크 비밀' 창에 붙여 넣음) — 이미 했으면 RN_SKIP_KEY=1
#   ② 🛍 우리숍 전용 서버(readnow-shop)를 손님 누구나 열 수 있게(배포 때마다 3분 실패하던 칸)
#   ③ ☁ Cloud Build 트리거 rn-cloud-deploy(cloud/setup-cloudbuild.sh 그대로 · 연결이 없으면 할 일을 보여 줌)
#  끝나면 리드가 저장소 파일(.github/cloud-deploy-via)로 GitHub 쪽 배포를 끄고 첫 빌드를 진단으로 확인 — 정범님이 GitHub 설정을 만질 것 없음
set -uo pipefail
P=readnow-3a385; R=asia-northeast3
gcloud config set project "$P" >/dev/null 2>&1
if [ -z "${RN_SKIP_KEY:-}" ]; then
  echo "── ① 🔑 진단 열쇠"; curl -fsSL https://readnow.kr/cloud/setup-diagkey.sh | bash || echo "   ⚠ 진단 열쇠 만들기 실패(위 줄)"
else echo "── ① 🔑 진단 열쇠 — 건너뜀(RN_SKIP_KEY)"; fi
echo; echo "── ② 🛍 우리숍 전용 서버 공개"
if gcloud run services describe readnow-shop --region "$R" --project "$P" >/dev/null 2>&1; then
  gcloud run services add-iam-policy-binding readnow-shop --region "$R" --project "$P" --member=allUsers --role=roles/run.invoker >/dev/null 2>&1 && echo "   ✓ 공개함" || echo "   ⚠ 공개 실패(조직 정책일 수 있음 — 리드에게 이 줄을 알려 주세요)"
else echo "   (readnow-shop 서비스가 아직 없음 — 건너뜀)"; fi
echo; echo "── ③ ☁ Cloud Build 트리거"
curl -fsSL https://readnow.kr/cloud/setup-cloudbuild.sh | bash || echo "   ⚠ 트리거 준비가 끝나지 않음(위 안내대로 브라우저 연결 뒤 이 한 줄을 다시 — 그때는 맨 앞에 RN_SKIP_KEY=1 을 붙여: curl -sL https://readnow.kr/cloud/setup-once.sh | RN_SKIP_KEY=1 bash)"
echo; echo "✓ 끝 — ①의 64글자 열쇠만 Claude '네트워크 비밀' 창에 붙여 넣으면 됩니다(GitHub 변수는 넣지 않아도 됨 — 리드가 저장소 파일로 끔)"

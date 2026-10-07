#!/usr/bin/env bash
# 리드나우 클라우드 수집 — 처음 설치 · 다시 올리기 (Google Cloud Shell에서 그대로 실행)
#   사용: 이 폴더(index.js · package.json · Dockerfile · deploy.sh)를 Cloud Shell에 올린 뒤
#         bash deploy.sh
#   두 번째부터는 같은 명령으로 새 판만 올림 (비밀번호는 다시 묻지 않음 — 바꿀 때만: bash deploy.sh --reset-secrets)
set -euo pipefail
PROJECT=readnow-3a385
REGION=asia-northeast3          # 서울
SERVICE=readnow-cloud
ALLOW_EMAILS="${ALLOW_EMAILS:-jerrycson@gmail.com}"   # 웹앱에서 클라우드를 부를 수 있는 계정 (쉼표로 여러 개)

gcloud config set project "$PROJECT" >/dev/null
PN=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
SA="${PN}-compute@developer.gserviceaccount.com"   # Cloud Run 기본 실행 계정

echo "① 필요한 기능 켜기 (처음 한 번, 1~2분)"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com cloudscheduler.googleapis.com vision.googleapis.com firestore.googleapis.com >/dev/null

echo "② 비밀 (알라딘 아이디·비밀번호 · 예약 호출 열쇠) — Secret Manager에만 저장"
mk() { # 이름, 물음, 숨김
  if gcloud secrets describe "$1" >/dev/null 2>&1 && [[ "${RESET:-}" != 1 ]]; then echo "   $1: 이미 있음 (그대로)"; return; fi
  local v; if [[ "$3" == 1 ]]; then read -rsp "   $2: " v; echo; else read -rp "   $2: " v; fi
  if gcloud secrets describe "$1" >/dev/null 2>&1; then printf '%s' "$v" | gcloud secrets versions add "$1" --data-file=- >/dev/null
  else printf '%s' "$v" | gcloud secrets create "$1" --replication-policy=automatic --data-file=- >/dev/null; fi
}
[[ "${1:-}" == "--reset-secrets" ]] && RESET=1
mk ALADIN_ID "알라딘 아이디" 0
mk ALADIN_PW "알라딘 비밀번호 (화면에 안 보임)" 1
if ! gcloud secrets describe TICK_KEY >/dev/null 2>&1; then printf '%s' "$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9')" | gcloud secrets create TICK_KEY --replication-policy=automatic --data-file=- >/dev/null; echo "   TICK_KEY: 새로 만듦"; fi
for s in ALADIN_ID ALADIN_PW TICK_KEY; do gcloud secrets add-iam-policy-binding "$s" --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor >/dev/null; done
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$SA" --role=roles/datastore.user --condition=None >/dev/null

echo "③ 올리기 (빌드 3~6분)"
gcloud run deploy "$SERVICE" --source . --region "$REGION" --allow-unauthenticated \
  --memory 2Gi --cpu 1 --timeout 300 --concurrency 4 --min-instances 0 --max-instances 1 \
  --set-secrets "ALADIN_ID=ALADIN_ID:latest,ALADIN_PW=ALADIN_PW:latest,TICK_KEY=TICK_KEY:latest" \
  --set-env-vars "FB_PROJECT=$PROJECT,ALLOW_EMAILS=$ALLOW_EMAILS,ALLOW_ORIGINS=https://jerrycson.github.io"
URL=$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')

echo "④ 예약: 매일 24시간, 1분마다 /tick (주문확인요청은 매번, 발송 요청은 5분마다)"
KEY=$(gcloud secrets versions access latest --secret=TICK_KEY)
if gcloud scheduler jobs describe readnow-tick --location "$REGION" >/dev/null 2>&1; then
  gcloud scheduler jobs update http readnow-tick --location "$REGION" --schedule "* * * * *" --time-zone "Asia/Seoul" --uri "$URL/tick" --http-method POST --update-headers "x-tick-key=$KEY" --attempt-deadline 180s >/dev/null
else
  gcloud scheduler jobs create http readnow-tick --location "$REGION" --schedule "* * * * *" --time-zone "Asia/Seoul" --uri "$URL/tick" --http-method POST --headers "x-tick-key=$KEY" --attempt-deadline 180s >/dev/null
fi

echo "⑤ 예산 알림: 이 프로젝트 비용이 한 달 ${BUDGET:-10000}원의 50%·90%·100%를 넘으면 결제 계정 관리자 메일로 알림 (처음 한 번)"
BA=$(gcloud billing projects describe "$PROJECT" --format='value(billingAccountName)' 2>/dev/null | sed 's#billingAccounts/##')
if [[ -n "$BA" ]]; then
  gcloud services enable billingbudgets.googleapis.com >/dev/null 2>&1 || true
  if ! gcloud billing budgets list --billing-account="$BA" --format='value(displayName)' 2>/dev/null | grep -qx readnow-cloud; then
    gcloud billing budgets create --billing-account="$BA" --display-name=readnow-cloud --budget-amount="${BUDGET:-10000}KRW" --filter-projects="projects/$PROJECT" \
      --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0 >/dev/null 2>&1 \
      && echo "   예산 알림 만듦" || echo "   예산 알림을 만들지 못함 (결제 계정 통화가 원화가 아니거나 권한 없음) — 콘솔 '결제 → 예산 및 알림'에서 직접"
  else echo "   예산 알림: 이미 있음"; fi
fi

echo
echo "끝. 클라우드 주소: $URL"
echo "→ 웹앱 ☁ 클라우드 화면에 이 주소를 붙여 넣고 '로그인 시험'을 누르세요."
echo "→ 지금 한 번 돌려 보기: gcloud scheduler jobs run readnow-tick --location $REGION"

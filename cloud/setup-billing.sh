#!/usr/bin/env bash
# 리드나우 — Google Cloud(Firebase) 실제 비용 자동 기록 켜기 · 처음 한 번만 (Google Cloud Shell에서)
#   curl -sL https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/cloud/setup-billing.sh | bash
# 하는 일: ① 필요한 기능 켜기(예산·Pub/Sub) · 비용 추정에 쓰는 읽기 권한 다시 확인
#          ② 주제 readnow-billing + 밀어 주기 구독 → 클라우드 /billing (주소의 열쇠는 TICK_KEY에서 만든 값 — 비밀번호 아님)
#          ③ 결제 계정에 예산 'readnow 실제 비용' — 이 프로젝트만 · 금액은 지난달 비용(아무 값이어도 됨, 알림만 씀) · 메일은 안 보냄
#   → 구글이 하루에 여러 번 '이 달 지금까지 실제 비용'을 알려 줌 → app_settings/costs_bill_YYYY-MM → 웹앱 매입 탭 '기타 지출'·경영 탭에 실제 값
# 다시 실행해도 괜찮음(이미 있으면 그대로 · 주소만 맞춤). 결제 계정의 '결제 관리자' 권한이 있는 구글 계정으로 실행해야 예산을 만들 수 있음.
set -euo pipefail
PROJECT=readnow-3a385; REGION=asia-northeast3; SERVICE=readnow-cloud; TOPIC=readnow-billing; SUB=readnow-billing-push; BNAME="readnow 실제 비용"
gcloud config set project "$PROJECT" >/dev/null
PN=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)'); RUNSA="${PN}-compute@developer.gserviceaccount.com"
echo "① 필요한 기능 켜기"
gcloud services enable billingbudgets.googleapis.com cloudbilling.googleapis.com pubsub.googleapis.com monitoring.googleapis.com >/dev/null
for R in roles/monitoring.viewer roles/artifactregistry.reader; do gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$RUNSA" --role="$R" --condition=None >/dev/null; echo "   추정용 읽기 권한 $R (그대로 확인)"; done
BA=$(gcloud billing projects describe "$PROJECT" --format='value(billingAccountName)' 2>/dev/null || true)
if [[ -z "$BA" ]]; then echo "이 프로젝트에 결제 계정이 연결돼 있지 않습니다 (Firebase 무료 Spark 요금제) — 청구되는 비용이 없으므로 여기서 끝."; exit 0; fi
BAID=${BA#billingAccounts/}; echo "   결제 계정 $BAID"
URL=$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')
KEY=$(gcloud secrets versions access latest --secret=TICK_KEY); BK=$(printf '%s' "$KEY:billing" | sha256sum | cut -c1-32)
echo "② 주제·밀어 주기 구독"
gcloud pubsub topics describe "$TOPIC" >/dev/null 2>&1 || gcloud pubsub topics create "$TOPIC" >/dev/null
EP="$URL/billing?k=$BK"
if gcloud pubsub subscriptions describe "$SUB" >/dev/null 2>&1; then gcloud pubsub subscriptions update "$SUB" --push-endpoint="$EP" >/dev/null; echo "   구독 주소 맞춤";
else gcloud pubsub subscriptions create "$SUB" --topic="$TOPIC" --push-endpoint="$EP" --ack-deadline=30 --message-retention-duration=1d >/dev/null; echo "   구독 만듦"; fi
echo "③ 예산 (알림만 · 메일 안 보냄)"
EX=$(gcloud billing budgets list --billing-account="$BAID" --format='value(name,displayName)' 2>/dev/null | awk -F'\t' -v n="$BNAME" '$2==n{print $1; exit}')
if [[ -n "$EX" ]]; then gcloud billing budgets update "$EX" --billing-account="$BAID" --notifications-rule-pubsub-topic="projects/$PROJECT/topics/$TOPIC" --disable-default-iam-recipients >/dev/null; echo "   이미 있음 — 알림 주제만 맞춤";
else gcloud billing budgets create --billing-account="$BAID" --display-name="$BNAME" --last-period-amount --calendar-period=month --filter-projects="projects/$PROJECT" --notifications-rule-pubsub-topic="projects/$PROJECT/topics/$TOPIC" --disable-default-iam-recipients >/dev/null; echo "   만듦"; fi
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$URL/billing?k=wrong" -H 'Content-Type: application/json' -d '{}' || true)
if [[ "$CODE" == 403 ]]; then echo "   클라우드 /billing 응답 확인 ✓ (클라우드 0.12.4 이상)"; else echo "   ⚠ 클라우드 /billing 응답 $CODE — 클라우드가 0.12.4 이상인지 확인 (GitHub에 올라가면 저절로 배포됨)"; fi
echo "✓ 끝 — 첫 알림은 보통 몇 시간 안에 옵니다(그 뒤 하루 여러 번). 웹앱 매입 탭 '기타 지출'에 'Google Cloud 실제'로 보입니다."

#!/usr/bin/env bash
# 리드나우 — 클라우드가 알라딘에 나갈 때 쓰는 인터넷 주소를 '우리만 쓰는 고정 주소'로 (Google Cloud Shell에서 · 다시 실행해도 괜찮음)
#   curl -sL https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/cloud/setup-static-ip.sh | bash          ← 처음 한 번(고정 주소 만들고 붙임)
#   curl -sL https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/cloud/setup-static-ip.sh | bash -s new   ← 그 주소도 막히면: 새 주소로 바꿈(옛 주소는 떼고 지움)
#   curl -sL https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/cloud/setup-static-ip.sh | bash -s off   ← 되돌리기(예전처럼 구글 공용 주소)
# 왜: 10/16 16:54부터 알라딘이 클라우드 로그인을 '로그인 과정에 문제가 발생하였습니다(42FB6013)'로 막음 — 10/15 로거 PC 때와 같은 번호(그 인터넷 주소를 막은 것).
#     Cloud Run은 구글 여러 서비스가 함께 쓰는 공용 주소로 나가(지금 34.96.43.177), 남이 쓴 주소까지 막힐 수 있음 → 우리만 쓰는 고정 주소 하나로 나가게 함.
# 하는 일: 네트워크 readnow-net · 서브넷 readnow-sub(10.8.0.0/26) · 고정 주소 readnow-ip(서울) · 라우터/NAT readnow-nat → Cloud Run readnow-cloud의 바깥 요청을 모두 그 주소로(Direct VPC egress)
# 비용(대략): 고정 주소 사용 중 시간당 약 $0.005(월 4천 원 안팎) + NAT 처리 GB당 $0.045 — 클라우드 수집은 하루 수백 MB 수준
set -euo pipefail
PROJECT=readnow-3a385; REGION=asia-northeast3; SERVICE=readnow-cloud; NET=readnow-net; SUB=readnow-sub; IP=readnow-ip; RT=readnow-router; NAT=readnow-nat; MODE="${1:-on}"
gcloud config set project "$PROJECT" >/dev/null
if [ "$MODE" = off ]; then echo "↩ 되돌리기: Cloud Run 바깥 요청을 예전처럼(공용 주소)"; gcloud run services update "$SERVICE" --region "$REGION" --clear-network --quiet >/dev/null; echo "   끝 — 고정 주소(readnow-ip)는 남겨 둠(다시 켤 때 그대로 씀)"; exit 0; fi
echo "① 필요한 기능 켜기(compute)"; gcloud services enable compute.googleapis.com --quiet
echo "② 네트워크·서브넷"; gcloud compute networks describe "$NET" >/dev/null 2>&1 || gcloud compute networks create "$NET" --subnet-mode=custom --quiet
gcloud compute networks subnets describe "$SUB" --region "$REGION" >/dev/null 2>&1 || gcloud compute networks subnets create "$SUB" --network "$NET" --region "$REGION" --range 10.8.0.0/26 --quiet
CUR=$(gcloud compute routers nats describe "$NAT" --router "$RT" --region "$REGION" --format='value(natIps)' 2>/dev/null | tr ';' '\n' | sed 's#.*/##' | head -1 || true)
if [ "$MODE" = new ] && [ -n "$CUR" ]; then IPN="$IP-$(date +%m%d%H%M)"; echo "③ 새 고정 주소 $IPN 만듦 (막힌 옛 주소 $CUR 는 NAT에서 뗀 뒤 지움)"; gcloud compute addresses create "$IPN" --region "$REGION" --quiet
else IPN="${CUR:-$IP}"; echo "③ 고정 주소 $IPN"; gcloud compute addresses describe "$IPN" --region "$REGION" >/dev/null 2>&1 || gcloud compute addresses create "$IPN" --region "$REGION" --quiet; fi
echo "④ 라우터·NAT(이 서브넷만 그 주소로)"; gcloud compute routers describe "$RT" --region "$REGION" >/dev/null 2>&1 || gcloud compute routers create "$RT" --network "$NET" --region "$REGION" --quiet
if gcloud compute routers nats describe "$NAT" --router "$RT" --region "$REGION" >/dev/null 2>&1; then gcloud compute routers nats update "$NAT" --router "$RT" --region "$REGION" --nat-custom-subnet-ip-ranges "$SUB" --nat-external-ip-pool "$IPN" --quiet
else gcloud compute routers nats create "$NAT" --router "$RT" --region "$REGION" --nat-custom-subnet-ip-ranges "$SUB" --nat-external-ip-pool "$IPN" --quiet; fi
if [ "$MODE" = new ] && [ -n "$CUR" ] && [ "$CUR" != "$IPN" ]; then gcloud compute addresses delete "$CUR" --region "$REGION" --quiet || true; fi
echo "⑤ Cloud Run 바깥 요청을 모두 이 네트워크로(Direct VPC egress)"; gcloud run services update "$SERVICE" --region "$REGION" --network "$NET" --subnet "$SUB" --vpc-egress all-traffic --quiet >/dev/null
A=$(gcloud compute addresses describe "$IPN" --region "$REGION" --format='value(address)'); echo ""; echo "✅ 끝 — 이제 클라우드는 $A 로 나갑니다. 웹앱·GitHub 진단에서 이 주소가 보이면 맞음."
echo "   알라딘 로그인은 클라우드가 1시간 쉬는 중이면 그 뒤 저절로 다시 시도합니다(사람이 할 일 없음)."

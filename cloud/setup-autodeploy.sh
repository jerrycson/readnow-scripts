#!/usr/bin/env bash
# 리드나우 클라우드 자동 배포 — 처음 한 번만 (Google Cloud Shell에서)
#   curl -sL https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/cloud/setup-autodeploy.sh | bash
# 하는 일: ① 배포 전용 계정(gh-deployer) — 클라우드 프로그램 올리기에 필요한 권한만
#          ② GitHub 1회용 신분증(OIDC) 확인 통로 — jerrycson/readnow-scripts 저장소의 main 가지에서만 통함 (열쇠·비밀번호를 GitHub에 두지 않음)
#          ③ 지금 GitHub main의 cloud/ 를 한 번 올림(바로 새 판) — 그 뒤로는 cloud/ 가 바뀌어 올라올 때마다 GitHub Actions가 저절로
# 다시 실행해도 괜찮음(이미 있으면 그대로)
set -euo pipefail
PROJECT=readnow-3a385; REGION=asia-northeast3; SERVICE=readnow-cloud; REPO=jerrycson/readnow-scripts
POOL=github; PROV=readnow-scripts; SAN=gh-deployer
gcloud config set project "$PROJECT" >/dev/null
# 방금 만든 계정은 구글 쪽에 퍼지는 데 몇 초~1분 걸려 권한 붙이기가 'PERMISSION_DENIED (or it may not exist)'로 실패할 수 있음 → 5초마다 다시(최대 2분)
retry() { local i; for i in $(seq 1 24); do if "$@" >/dev/null 2>/tmp/rn-retry.err; then return 0; fi; echo "   (아직 준비 중 — 5초 뒤 다시 ${i}/24)"; sleep 5; done; cat /tmp/rn-retry.err; return 1; }
PN=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
SA="$SAN@$PROJECT.iam.gserviceaccount.com"; RUNSA="${PN}-compute@developer.gserviceaccount.com"
echo "① 필요한 기능 켜기"
gcloud services enable iamcredentials.googleapis.com sts.googleapis.com iam.googleapis.com run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com >/dev/null
echo "② 배포 전용 계정 $SA"
gcloud iam service-accounts describe "$SA" >/dev/null 2>&1 || { gcloud iam service-accounts create "$SAN" --display-name="GitHub 자동 배포 (리드나우 클라우드)" >/dev/null; sleep 10; }
retry gcloud iam service-accounts describe "$SA"
for R in roles/run.developer roles/cloudbuild.builds.editor roles/artifactregistry.writer roles/storage.admin roles/serviceusage.serviceUsageConsumer roles/logging.viewer; do
  gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$SA" --role="$R" --condition=None >/dev/null; echo "   권한 $R"; done
gcloud iam service-accounts add-iam-policy-binding "$RUNSA" --member="serviceAccount:$SA" --role=roles/iam.serviceAccountUser >/dev/null; echo "   실행 계정 사용 권한 (빌드·실행 계정 $RUNSA)"
echo "③ GitHub 확인 통로 (OIDC)"
gcloud iam workload-identity-pools describe "$POOL" --location=global >/dev/null 2>&1 || gcloud iam workload-identity-pools create "$POOL" --location=global --display-name="GitHub Actions" >/dev/null
COND="assertion.repository=='$REPO' && assertion.ref=='refs/heads/main'"
if gcloud iam workload-identity-pools providers describe "$PROV" --location=global --workload-identity-pool="$POOL" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers update-oidc "$PROV" --location=global --workload-identity-pool="$POOL" --attribute-condition="$COND" >/dev/null
else
  gcloud iam workload-identity-pools providers create-oidc "$PROV" --location=global --workload-identity-pool="$POOL" --display-name="readnow-scripts main" \
    --issuer-uri="https://token.actions.githubusercontent.com" --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" --attribute-condition="$COND" >/dev/null
fi
retry gcloud iam service-accounts add-iam-policy-binding "$SA" --project="$PROJECT" --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PN/locations/global/workloadIdentityPools/$POOL/attribute.repository/$REPO"
echo "   GitHub(이 저장소 main)만 이 계정을 쓸 수 있게 묶음"
echo "   통로: projects/$PN/locations/global/workloadIdentityPools/$POOL/providers/$PROV"
[ "$PN" = "63884079760" ] || echo "   ⚠ 프로젝트 번호가 $PN — .github/workflows/deploy-cloud.yml의 WIF 줄 번호를 이 값으로 바꿔야 함 (Claude에게 알려 주세요)"
echo "④ 지금 GitHub main의 cloud/ 를 한 번 올림 (빌드 3~6분)"
TMP=$(mktemp -d); git clone -q --depth 1 "https://github.com/$REPO.git" "$TMP/r"
( cd "$TMP/r/cloud" && gcloud run deploy "$SERVICE" --source . --region "$REGION" --quiet )
URL=$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')
echo "   지금 판: $(curl -fsS "$URL/status" | grep -o '"ver":"[0-9.]*"')"
echo "✓ 끝 — 이제 cloud/ 가 바뀌어 GitHub main에 올라오면 저절로 배포됩니다 (GitHub 저장소 → Actions 에서 진행·결과 확인)"

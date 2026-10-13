#!/usr/bin/env bash
# 리드나우 — 안전·비용 다지기 · 한 번만 (Google Cloud Shell에서 · 다시 실행해도 괜찮음)
#   curl -sL https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/cloud/setup-hardening.sh | bash
# 바꾸는 것:
#   ① 저장소(사진 포함) 전체를 다루던 roles/storage.admin(프로젝트 전체) → 배포할 때 소스를 올리는 버킷(gs://readnow-3a385_cloudbuild · gs://run-sources-readnow-3a385-…)에만
#      + 버킷 이름만 볼 수 있는 작은 역할(readnowBucketLister: storage.buckets.get·list — 파일은 못 봄) — 사진·책 표지 버킷은 이 계정이 못 건드림
#   ② GitHub 확인 통로를 '이 저장소의 고유 번호 + main 가지 + deploy-cloud.yml 작업'에서만 통하게 (다른 작업 파일·이름을 바꾼 저장소는 못 씀)
#   ③ Firestore 색인 빼기: 날짜·출처마다 칸이 늘어나는 '목록 칸'(찾기에 쓰지 않음)에 색인을 만들지 않게 — 문서 한 개의 색인 한도(4만)에 닿아 기록이 멈추는 일을 막고 쓰기 비용도 줄임
#      app_settings.cnt·res(외부 정보 날짜별 수·결과) · ext_index.m · ml_days.cols · ml_shadow.keys·pc·ph · sys_health.events
# 되돌리기: 배포가 권한 때문에 실패하면 setup-autodeploy.sh를 다시 실행하면 예전 권한으로 돌아감(다시 실행해도 괜찮음)
set -euo pipefail
PROJECT=readnow-3a385; REPO=jerrycson/readnow-scripts; POOL=github; PROV=readnow-scripts; SA="gh-deployer@$PROJECT.iam.gserviceaccount.com"
gcloud config set project "$PROJECT" >/dev/null
echo "① 배포에 쓰는 버킷(소스 올리는 곳)에만 권한"
BKS=$(gcloud storage buckets list --format='value(name)' 2>/dev/null | grep -E "^(${PROJECT}_cloudbuild|run-sources-${PROJECT}-.*)$" || true)
[ -n "$BKS" ] || { echo "   ⚠ 배포용 버킷(${PROJECT}_cloudbuild · run-sources-${PROJECT}-…)을 못 찾음 — 바꾼 것 없이 끝냄"; exit 1; }
for B in $BKS; do gcloud storage buckets add-iam-policy-binding "gs://$B" --member="serviceAccount:$SA" --role=roles/storage.admin >/dev/null; echo "   gs://$B 권한 붙임"; done
if ! gcloud iam roles describe readnowBucketLister --project "$PROJECT" >/dev/null 2>&1; then
  gcloud iam roles create readnowBucketLister --project "$PROJECT" --title="리드나우 배포: 버킷 이름만 보기" --permissions=storage.buckets.get,storage.buckets.list --stage=GA >/dev/null; echo "   작은 역할 만듦"; fi
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$SA" --role="projects/$PROJECT/roles/readnowBucketLister" --condition=None >/dev/null; echo "   버킷 이름 보기 역할 붙임"
gcloud projects remove-iam-policy-binding "$PROJECT" --member="serviceAccount:$SA" --role=roles/storage.admin --condition=None >/dev/null 2>&1 && echo "   프로젝트 전체 storage.admin 뗌" || echo "   (프로젝트 전체 storage.admin은 이미 없음)"
echo "② GitHub 확인 통로 조이기"
RID=$(curl -fsS "https://api.github.com/repos/$REPO" | grep -m1 -oP '"id":\s*\K[0-9]+')
if [ -n "$RID" ]; then
echo "   저장소 고유 번호 $RID"
COND="assertion.repository_id=='$RID' && assertion.ref=='refs/heads/main' && assertion.workflow_ref.startsWith('$REPO/.github/workflows/deploy-cloud.yml@')"
gcloud iam workload-identity-pools providers update-oidc "$PROV" --location=global --workload-identity-pool="$POOL" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_id=assertion.repository_id,attribute.ref=assertion.ref,attribute.workflow_ref=assertion.workflow_ref" \
  --attribute-condition="$COND" >/dev/null
echo "   통로 조건: $COND"
else echo "   ⚠ 저장소 번호를 못 읽음 — ②는 건너뜀(다시 실행하면 됨)"; fi
echo "③ Firestore 색인 빼기 (몇 분 걸릴 수 있음)"
for pair in app_settings:cnt app_settings:res ext_index:m ml_days:cols ml_shadow:keys ml_shadow:pc ml_shadow:ph sys_health:events; do CG=${pair%%:*}; F=${pair#*:}
  if gcloud firestore indexes fields update "$F" --collection-group="$CG" --disable-indexes --quiet >/dev/null 2>&1; then echo "   $CG.$F 색인 뺌"; else echo "   ($CG.$F 건너뜀 — 이미 빠졌거나 칸이 없음)"; fi; done
echo "✓ 끝 — 다음 클라우드 배포(GitHub에 cloud/ 가 올라올 때 또는 Actions → 클라우드 자동 배포 → Run workflow)가 좁힌 권한으로 돎."
echo "  그 배포가 권한 때문에 실패하면: curl -sL https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/cloud/setup-autodeploy.sh | bash  (예전 권한으로 되돌림)"

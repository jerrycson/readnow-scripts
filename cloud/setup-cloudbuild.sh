#!/usr/bin/env bash
# ☁ 리드나우 클라우드 배포를 Cloud Build 트리거로 (priv2 11/13) — Google Cloud Shell에서 한 번 (정범님 구글 계정)
#   curl -sL https://readnow.kr/cloud/setup-cloudbuild.sh | bash
# 먼저(콘솔 2분): Cloud Build › 저장소(2세대) › 호스트 연결 만들기(서울 asia-northeast3 · GitHub) → GitHub에서 승인 · 앱 설치(readnow-scripts만) → 저장소 연결
# 하는 일: ① 배포 계정 gh-deployer에 빌드 로그 쓰기 권한(roles/logging.logWriter) 하나 더 — 다른 권한은 이미 있음(setup-autodeploy.sh)
#          ② 그 연결의 readnow-scripts로 트리거 rn-cloud-deploy(main push · cloud/**·readnow-*-core.js·readnow-registry.js · cloud/cloudbuild.yaml · 계정 gh-deployer)
#          ③ 지금 main으로 한 번 돌려 봄(새 판이 아니라 같은 커밋을 다시 올림 — 무해) · 결과 주소를 보여 줌
# 다시 실행해도 괜찮음(이미 있으면 그대로 · 트리거는 설정만 맞춤) · 돈 드는 기능을 새로 켜지 않음(Cloud Build는 지금도 배포 때 쓰임)
# 끝나면: GitHub 저장소 변수 RN_CLOUD_DEPLOY = cloudbuild (그때부터 GitHub Actions 배포는 쉼 · 두 번 배포 안 함)
set -euo pipefail
P=readnow-3a385; R=asia-northeast3; T=rn-cloud-deploy; SA=gh-deployer@$P.iam.gserviceaccount.com
gcloud config set project "$P" >/dev/null
echo "① 기능·권한"
gcloud services enable cloudbuild.googleapis.com secretmanager.googleapis.com >/dev/null
gcloud projects add-iam-policy-binding "$P" --member="serviceAccount:$SA" --role=roles/logging.logWriter --condition=None >/dev/null && echo "   gh-deployer: 빌드 로그 쓰기"
echo "② GitHub 연결 찾기(서울)"
REPO=""
for C in $(gcloud builds connections list --region="$R" --format='value(name)' 2>/dev/null); do
  X=$(gcloud builds repositories list --connection="$(basename "$C")" --region="$R" --format='value(name,remoteUri)' 2>/dev/null | grep -i 'jerrycson/readnow-scripts' | head -1 | cut -f1 || true)
  [ -n "$X" ] && { REPO="$X"; break; }
done
if [ -z "$REPO" ]; then
  echo "   ⚠ 서울(asia-northeast3)에 readnow-scripts 연결이 아직 없음 — 아래를 먼저 하고 이 줄을 다시 붙여 넣어 주세요"
  echo "     https://console.cloud.google.com/cloud-build/repositories/2nd-gen?project=$P"
  echo "     → '호스트 연결 만들기'(CREATE HOST CONNECTION) · 지역 asia-northeast3 · 이름 github · GitHub → 연결 → GitHub 승인 → 앱 설치(Only select repositories: readnow-scripts)"
  echo "     → 돌아와서 '저장소 연결'(LINK REPOSITORY) → jerrycson/readnow-scripts → 연결"
  exit 1
fi
case "$REPO" in projects/*) ;; *) REPO="projects/$P/locations/$R/connections/$(basename "$(dirname "$(dirname "$REPO")")")/repositories/$(basename "$REPO")";; esac
echo "   연결: $REPO"
echo "③ 트리거 $T"
A=(--region="$R" --repository="$REPO" --branch-pattern='^main$' --build-config=cloud/cloudbuild.yaml
   --included-files='cloud/**,readnow-*-core.js,readnow-registry.js' --service-account="projects/$P/serviceAccounts/$SA"
   --description='리드나우 클라우드 자동 배포(main push) — GitHub Actions 대신')
if gcloud builds triggers describe "$T" --region="$R" >/dev/null 2>&1; then echo "   이미 있음(그대로 둠)"
else gcloud builds triggers create github --name="$T" "${A[@]}" >/dev/null && echo "   만듦"; fi
echo "④ 한 번 돌려 봄(지금 main · 3~6분)"
B=$(gcloud builds triggers run "$T" --region="$R" --branch=main --format='value(metadata.build.id)' 2>/dev/null || true)
[ -n "$B" ] && echo "   빌드 $B — 진행: https://console.cloud.google.com/cloud-build/builds;region=$R/$B?project=$P"
echo
echo "✓ 끝 — 마지막 한 가지: GitHub 저장소 변수 RN_CLOUD_DEPLOY = cloudbuild"
echo "  https://github.com/jerrycson/readnow-scripts/settings/variables/actions/new  (Name: RN_CLOUD_DEPLOY · Value: cloudbuild · Add variable)"
echo "  그 뒤로는 cloud/ 가 main에 올라오면 Cloud Build가 배포합니다(GitHub Actions 분 0). 되돌리기: 그 변수를 지우면 예전처럼 GitHub Actions가 배포"

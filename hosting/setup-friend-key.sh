#!/usr/bin/env bash
# 🐾🔑 책방 친구 안드로이드 앱 서명 열쇠 만들기 (friendkey1 11/14) — Google Cloud Shell에 이 한 줄만:
#     curl -sL https://readnow.kr/cloud/setup-friend-key.sh | bash
#  (저장소엔 hosting/setup-friend-key.sh로 두고, Hosting 결과물에선 cloud/setup-friend-key.sh로 냄 — 다른 setup-*.sh와 같은 주소)
#  하는 일:
#   ① 영구 서명 열쇠(keystore · RSA 2048 · 100년)를 Cloud Shell 임시 폴더에서 만들고
#   ② Google Secret Manager에 friend-android-keystore(열쇠 파일)·friend-android-keystore-pass(비밀번호)로 넣고
#   ③ 서명 전용 계정(friend-signer · 그 두 비밀 읽기 말고는 아무 권한 없음)과 그 계정 전용 GitHub 통로(readnow-friend)를 만듦
#      — 통로는 이 저장소 main 가지의 .github/workflows/friend-android.yml에서만 통함 → 그 작업이 열쇠 없이(OIDC) 꺼내 서명
#      (클라우드 배포 계정 gh-deployer의 통로는 11/13 안전 다지기로 배포 작업 파일만 통하게 좁혀져 있어 그대로 둠 — 앱 빌드가 배포 권한을 갖지 않게)
#   ④ 임시 폴더를 지움 — 화면에는 지문(SHA-256 · 공개해도 되는 값)만 보이고 열쇠·비밀번호는 어디에도 나오지 않음
#  이미 열쇠가 있으면 덮어쓰지 않고 멈춤(헌장 제7조) — 같은 열쇠를 계속 써야 휴대폰에 덮어 설치가 됨
set -uo pipefail
P="${RN_PROJECT:-readnow-3a385}"
REPO=jerrycson/readnow-scripts; POOL=github; PROV=readnow-friend; SAN=friend-signer
SA="${SAN}@${P}.iam.gserviceaccount.com"
KS=friend-android-keystore; KP=friend-android-keystore-pass; AL=friend
say() { printf '%s\n' "$*"; }
die() { say "   ⚠ $*"; say "   → 이 화면의 ⚠ 줄을 그대로 리드(Claude)에게 알려 주세요."; exit 1; }
has_ver() { [ -n "$(gcloud secrets versions list "$1" --project="$P" --filter='state=ENABLED' --limit=1 --format='value(name)' 2>/dev/null)" ]; }
grant() { gcloud secrets add-iam-policy-binding "$1" --project="$P" --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor >/dev/null 2>&1 || { sleep 10; gcloud secrets add-iam-policy-binding "$1" --project="$P" --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor >/dev/null 2>&1; }; }
# 서명 전용 계정 + 전용 통로 (있으면 그대로 · 다시 돌려도 무해)
signer() {
  local PN RID COND
  PN=$(gcloud projects describe "$P" --format='value(projectNumber)' 2>/dev/null); [ -n "$PN" ] || return 1
  gcloud services enable iamcredentials.googleapis.com sts.googleapis.com iam.googleapis.com --project="$P" >/dev/null 2>&1
  gcloud iam service-accounts describe "$SA" --project="$P" >/dev/null 2>&1 || { gcloud iam service-accounts create "$SAN" --project="$P" --display-name="책방 친구 앱 서명(열쇠 읽기만)" >/dev/null 2>&1 || return 1; sleep 10; }
  RID=$(curl -fsS "https://api.github.com/repos/$REPO" 2>/dev/null | grep -m1 -oE '"id": *[0-9]+' | grep -oE '[0-9]+')
  if [ -n "$RID" ]; then COND="assertion.repository_id=='$RID'"; else COND="assertion.repository=='$REPO'"; fi
  COND="$COND && assertion.ref=='refs/heads/main' && assertion.workflow_ref.startsWith('$REPO/.github/workflows/friend-android.yml@')"
  if ! gcloud iam workload-identity-pools providers describe "$PROV" --project="$P" --location=global --workload-identity-pool="$POOL" >/dev/null 2>&1; then
    gcloud iam workload-identity-pools providers create-oidc "$PROV" --project="$P" --location=global --workload-identity-pool="$POOL" --display-name="책방 친구 앱 서명" \
      --issuer-uri="https://token.actions.githubusercontent.com" --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" --attribute-condition="$COND" >/dev/null 2>&1 || return 1
  fi
  local i; for i in 1 2 3 4 5 6; do
    gcloud iam service-accounts add-iam-policy-binding "$SA" --project="$P" --role=roles/iam.workloadIdentityUser \
      --member="principalSet://iam.googleapis.com/projects/$PN/locations/global/workloadIdentityPools/$POOL/attribute.repository/$REPO" >/dev/null 2>&1 && return 0; sleep 10; done
  return 1
}
W=$(mktemp -d); chmod 700 "$W"; trap 'rm -rf "$W"' EXIT
fp() { keytool -list -v -keystore "$1" -storepass:env RN_KSP 2>/dev/null | grep -m1 -iE '^\s*SHA-?256:' | sed -E 's/^[^:]*:\s*//'; }

# curl … | bash 로 돌 때 중간 명령이 표준 입력(이 글의 나머지)을 먹지 않게 — 끝까지 다 읽은 뒤 시작
main() {
  gcloud config set project "$P" >/dev/null 2>&1
  say "── ① 준비 (프로젝트 $P)"
  gcloud services enable secretmanager.googleapis.com --project="$P" >/dev/null 2>&1 || die "Secret Manager 기능을 켜지 못함"
  say "   ✓ Secret Manager 켜짐"

  if has_ver "$KS"; then
    say "── 이미 열쇠가 있습니다($KS) — 덮어쓰지 않고 멈춥니다."
    { signer && grant "$KS" && grant "$KP"; } && say "   ✓ 서명 전용 계정이 읽을 수 있음(다시 확인)" || say "   ⚠ 서명 전용 계정·읽기 권한 다시 확인 실패(리드에게 알려 주세요)"
    if command -v keytool >/dev/null 2>&1 && gcloud secrets versions access latest --secret="$KS" --project="$P" --out-file="$W/k.jks" >/dev/null 2>&1; then
      RN_KSP=$(gcloud secrets versions access latest --secret="$KP" --project="$P" 2>/dev/null); export RN_KSP
      F=$(fp "$W/k.jks"); unset RN_KSP
      [ -n "$F" ] && say "   지금 열쇠의 지문(SHA-256): $F"
    fi
    exit 0
  fi

  say "── ② 열쇠 만들기"
  if ! command -v keytool >/dev/null 2>&1; then
    say "   (keytool이 없어 Java를 설치합니다 — 1분쯤)"
    sudo apt-get install -y -qq openjdk-17-jre-headless >/dev/null 2>&1 || { sudo apt-get update -qq >/dev/null 2>&1 && sudo apt-get install -y -qq openjdk-17-jre-headless >/dev/null 2>&1; } || true
    command -v keytool >/dev/null 2>&1 || die "keytool(Java)을 설치하지 못함"
  fi
  RN_KSP=$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 32); export RN_KSP
  [ ${#RN_KSP} -ge 24 ] || die "비밀번호를 만들지 못함"
  keytool -genkeypair -keystore "$W/k.jks" -storetype PKCS12 -alias "$AL" -keyalg RSA -keysize 2048 -validity 36500 \
    -storepass:env RN_KSP -keypass:env RN_KSP -dname "CN=ReadNow Friend, O=ReadNow, C=KR" >/dev/null 2>&1 || die "열쇠를 만들지 못함(keytool)"
  F=$(fp "$W/k.jks"); [ -n "$F" ] || die "만든 열쇠의 지문을 읽지 못함"
  say "   ✓ 만듦"

  say "── ③ Secret Manager에 넣기"
  for s in "$KS" "$KP"; do
    gcloud secrets describe "$s" --project="$P" >/dev/null 2>&1 || gcloud secrets create "$s" --project="$P" --replication-policy=automatic --labels=app=friend >/dev/null 2>&1 || die "비밀 칸 $s 를 만들지 못함"
  done
  # 비밀번호 먼저 · 열쇠 나중 — 중간에 끊겨도 '열쇠 없음'으로 남아 다시 돌리면 처음부터 다시 함(옛 판은 지우지 않고 남음)
  printf '%s' "$RN_KSP" | gcloud secrets versions add "$KP" --project="$P" --data-file=- >/dev/null 2>&1 || die "비밀번호를 넣지 못함"
  gcloud secrets versions add "$KS" --project="$P" --data-file="$W/k.jks" >/dev/null 2>&1 || die "열쇠 파일을 넣지 못함"
  unset RN_KSP
  say "   ✓ 넣음 ($KS · $KP)"

  say "── ④ 서명 전용 계정만 읽게 (GitHub friend-android.yml 전용 통로)"
  signer || die "서명 전용 계정·통로를 만들지 못함($SA · $PROV) — 열쇠는 이미 들어갔으니 이 한 줄을 다시 돌리면 이 칸만 다시 함"
  grant "$KS" && grant "$KP" || die "읽기 권한을 붙이지 못함($SA) — 이 한 줄을 다시 돌리면 이 칸만 다시 함"
  say "   ✓ $SA"
  say
  say "✓ 끝 — 열쇠 값·비밀번호는 Secret Manager에만 있고 화면·파일 어디에도 남지 않았습니다(Cloud Shell 임시 폴더도 지움)."
  say "   지문(SHA-256 · 공개해도 되는 값 · 리드에게 이 줄만 알려 주시면 됨):"
  say "   $F"
}
main < /dev/null

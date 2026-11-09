#!/bin/bash
# 🌐 Firebase Hosting 준비 (한 번 · Google Cloud Shell에서 프로젝트 소유자 계정으로) — 11/10
#   붙여 넣기: 이 파일 내용을 Cloud Shell에 그대로 붙여 넣고 Enter
#   하는 일: ① Hosting 기능 켜기 ② 자동 배포 계정(gh-deployer)에 Hosting 올리기 권한 ③ 기본 사이트(readnow-3a385.web.app)가 없으면 만들기
#   비밀번호·열쇠를 만들거나 받지 않음 · 여러 번 실행해도 같음 · 되돌리기: 맨 아래 주석
set -e
PROJECT=readnow-3a385; SA=gh-deployer@$PROJECT.iam.gserviceaccount.com; SITE=$PROJECT
gcloud config set project "$PROJECT" >/dev/null
echo "① Hosting 기능 켜기"; gcloud services enable firebasehosting.googleapis.com firebase.googleapis.com
echo "② 자동 배포 계정에 Hosting 권한"; gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$SA" --role=roles/firebasehosting.admin --condition=None >/dev/null; echo "   roles/firebasehosting.admin"
echo "③ 기본 사이트 확인"
TOK=$(gcloud auth print-access-token)
if curl -fsS -H "Authorization: Bearer $TOK" -H "x-goog-user-project: $PROJECT" "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT/sites/$SITE" >/dev/null 2>&1; then echo "   있음: https://$SITE.web.app"
else curl -fsS -X POST -H "Authorization: Bearer $TOK" -H "x-goog-user-project: $PROJECT" -H 'content-type: application/json' -d '{}' "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT/sites?siteId=$SITE" >/dev/null && echo "   만듦: https://$SITE.web.app" || echo "   ⚠ 사이트를 못 만듦 — Firebase 콘솔 → Hosting → '시작하기'를 한 번 누른 뒤 다시 실행"; fi
echo "✅ 끝 — 이제 GitHub Actions의 '결과물 함께 내기 (Firebase Hosting)'를 Run workflow로 한 번 돌리면 https://$SITE.web.app/app/ 에 같은 웹앱이 올라갑니다"
# 되돌리기(권한만 거둠 · 올라간 사이트는 Firebase 콘솔 → Hosting에서 '사이트 사용 중지'):
#   gcloud projects remove-iam-policy-binding readnow-3a385 --member=serviceAccount:gh-deployer@readnow-3a385.iam.gserviceaccount.com --role=roles/firebasehosting.admin --condition=None

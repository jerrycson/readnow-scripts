#!/usr/bin/env bash
# ☁ Cloud Build 단계 공용 (cbuild 11/13) — cloud/cloudbuild.yaml의 단계마다 `. /workspace/cloud/cb-lib.sh <단계>` 로 부름
#  · 단계마다 로그를 /workspace/.rn/log_<단계>에 같이 적고, 끝날 때 종료 코드·걸린 초를 /workspace/.rn/st_<단계>에 남김
#  · 앞 단계가 실패했거나(failed) 더 새 빌드라 그만둔 때(skip)는 rn_gate가 이 단계를 건너뜀(0으로 끝남 · st에 skip)
#  · 시험: _RN_FAIL_AT=<단계>이면 그 단계가 일부러 실패(해 없음 — check에서 실패시키면 이미지·배포 단계는 건너뜀)
#          _RN_DRY=1이면 이미지·배포·우리숍 단계는 언제나 건너뜀(시험 빌드 — 아무것도 올리지 않음)
#  · 마지막 report 단계(cloud/cb-report.py)가 이것들을 모아 클라우드 /cb-in에 보냄 → 진단 cbuild=1로 읽음
RN=${RN_WS:-/workspace}/.rn; mkdir -p "$RN"
SHA=${COMMIT_SHA:-${_SHA:-}}; export SHA
RN_STEP=${1:-step}
# cloud-sdk:slim 이미지엔 python3가 따로 없음(11/13 첫 시험) — gcloud에 딸린 python을 씀
RN_PY=$(command -v python3 2>/dev/null || ls -1 /usr/lib/google-cloud-sdk/platform/bundledpythonunix/bin/python3 2>/dev/null || echo python3); export RN_PY
: >> "$RN/log_$RN_STEP"
exec > >(tee -a "$RN/log_$RN_STEP") 2>&1
RN_T0=$SECONDS
rn_end() { local rc=$?; sleep 0.5; # 로그 받아 적는 tee가 마지막 줄을 쓸 틈
  local sk=""; [ -f "$RN/skipped_$RN_STEP" ] && sk=" skip"; echo "$rc $((SECONDS-RN_T0))$sk" > "$RN/st_$RN_STEP"; if [ "$rc" != 0 ] && [ -z "${RN_SOFT:-}" ]; then echo "$RN_STEP" >> "$RN/failed"; fi; }
trap rn_end EXIT
# 이 단계를 건너뛸지 — 건너뛰면 0으로 끝냄
rn_gate() {
  local why=""
  [ -s "$RN/failed" ] && why="앞 단계 $(head -1 "$RN/failed") 실패"
  [ -z "$why" ] && [ -f "$RN/skip" ] && why="더 새 빌드가 있음"
  [ -z "$why" ] && [ "${1:-}" = deploy ] && [ -n "${_RN_DRY:-}" ] && why="시험 빌드(_RN_DRY) — 올리지 않음"
  if [ -n "$why" ]; then echo "⏭ 건너뜀 — $why"; touch "$RN/skipped_$RN_STEP"; exit 0; fi
  if [ -n "${_RN_FAIL_AT:-}" ] && [ "$_RN_FAIL_AT" = "$RN_STEP" ]; then echo "🧪 일부러 만든 실패 시험(_RN_FAIL_AT=$RN_STEP) — 이 단계에서 멈춤 · 아무것도 올리지 않음"; exit 3; fi
  return 0
}
# 클라우드 /cb-in에 보낼 1회용 ID 토큰(빌드 계정 · aud readnow-diag)
rn_idt() {
  curl -fsS -m 10 -H 'Metadata-Flavor: Google' "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=readnow-diag&format=full" 2>/dev/null \
    || gcloud auth print-identity-token --audiences=readnow-diag --include-email 2>/dev/null \
    || gcloud auth print-identity-token --audiences=readnow-diag 2>/dev/null
}
RN_CLOUD=${_RN_CLOUD:-https://readnow-cloud-63884079760.asia-northeast3.run.app}

#!/usr/bin/env python3
# ☁ Cloud Build 결과 보내기 (cbuild 11/13) — cloud/cloudbuild.yaml 첫 단계(start)와 마지막 단계(end)에서 부름
#  python3 /workspace/cloud/cb-report.py start|end
#  · 모으는 것: 단계마다 종료 코드·초(/workspace/.rn/st_<단계>) · 처음 실패한 단계 · 그 단계 로그 마지막 40줄(비밀값 꼴 가림)
#  · 보내는 곳: 클라우드 /cb-in(빌드 계정 1회용 ID 토큰) → Firestore cloudbuild_runs/<빌드 번호> → 진단 cbuild=1
#    /cb-in이 안 되면(클라우드가 죽음 등) Firestore에 직접(빌드 계정 접근 토큰 · cloudbuild_runs/<번호>.j 한 칸에 JSON 글)
#  · end: 실패가 있으면 종료 코드 1 → 빌드 전체가 '실패'로 남음(앞 단계들은 allowFailure라 이 단계가 빌드 결과를 정함)
import json, os, re, sys, glob, urllib.request, urllib.error
RN = (os.environ.get('RN_WS') or '/workspace') + '/.rn'
E = os.environ.get
ev = sys.argv[1] if len(sys.argv) > 1 else 'end'
bid = E('BUILD_ID', ''); proj = E('PROJECT_ID', 'readnow-3a385'); reg = E('_REGION', 'asia-northeast3')
sha = E('COMMIT_SHA') or E('_SHA') or ''
cloud = E('_RN_CLOUD') or 'https://readnow-cloud-63884079760.asia-northeast3.run.app'
MASK = [(re.compile(r'ya29\.[\w.-]+'), '‹가림›'), (re.compile(r'eyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]*'), '‹가림›'), (re.compile(r'\bgh[pousr]_[A-Za-z0-9]{20,}'), '‹가림›'),
        (re.compile(r'AIza[0-9A-Za-z_-]{30,}'), '‹가림›'), (re.compile(r'\b[0-9a-fA-F]{56,}\b'), '‹가림›'),
        (re.compile(r'((?:pass(?:word)?|passwd|secret|token|api[_-]?key|x-rn-diag-key|authorization)["\']?\s*[:=]\s*["\']?)(?:bearer\s+)?[^\s"\',;]{6,}', re.I), r'\1‹가림›')]
ANSI = re.compile(r'\x1b\[[0-9;]*[A-Za-z]')
def mask(t):
    t = ANSI.sub('', t)[:400]
    for r, w in MASK: t = r.sub(w, t)
    return t
def ver():
    try:
        m = re.search(r"^const VER = '([0-9.]+)'", open((os.environ.get('RN_WS') or '/workspace') + '/cloud/index.js', encoding='utf-8').read(), re.M); return m.group(1) if m else ''
    except Exception: return ''
def meta(path):
    rq = urllib.request.Request('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/' + path, headers={'Metadata-Flavor': 'Google'})
    return urllib.request.urlopen(rq, timeout=10).read().decode()
def idt():
    try: return meta('identity?audience=readnow-diag&format=full')
    except Exception: pass
    import subprocess
    for a in (['--include-email'], []):
        try:
            t = subprocess.run(['gcloud', 'auth', 'print-identity-token', '--audiences=readnow-diag', *a], capture_output=True, text=True, timeout=30).stdout.strip()
            if t: return t
        except Exception: pass
    return ''
body = {'id': bid, 'ev': ev, 'sha': sha, 'ver': ver(), 'via': E('_VIA') or 'trigger', 'test': E('_RN_TEST') or '', 'dry': bool(E('_RN_DRY')),
        'url': f'https://console.cloud.google.com/cloud-build/builds;region={reg}/{bid}?project={proj}'}
rc = 0
if ev == 'end':
    steps = {}
    for f in sorted(glob.glob(RN + '/st_*')):
        p = open(f).read().split(); k = os.path.basename(f)[3:]
        steps[k] = {'rc': int(p[0]) if p and p[0].lstrip('-').isdigit() else None, 'sec': int(p[1]) if len(p) > 1 and p[1].isdigit() else None, 'skip': 'skip' in p}
    failed = [x.strip() for x in open(RN + '/failed').read().split('\n') if x.strip()] if os.path.exists(RN + '/failed') else []
    for need in ('newer', 'check', 'image', 'deploy'):  # 단계가 아예 안 끝났으면(기록 없음) 실패로 셈
        if need not in steps and need not in failed: failed.append(need); steps[need] = {'rc': None, 'sec': None, 'skip': False}
    warn = [k for k, v in steps.items() if k == 'shop' and v.get('rc') not in (0, None)]
    if failed:
        st = 'FAILURE'; fail = failed[0]
        lf = RN + '/log_' + fail
        tail = [mask(x) for x in (open(lf, errors='replace').read().splitlines()[-40:] if os.path.exists(lf) else ['(이 단계 로그가 없음 — 단계가 시작도 못 함)'])]
    else:
        fail = ''; tail = []
        st = 'SKIPPED' if os.path.exists(RN + '/skip') or (steps.get('deploy') or {}).get('skip') else 'SUCCESS'
        lf = RN + '/log_deploy'
        if os.path.exists(lf): tail = [mask(x) for x in open(lf, errors='replace').read().splitlines()[-6:]]
        if warn and os.path.exists(RN + '/log_shop'): tail += ['— 🛍 우리숍 단계(실패해도 되는 단계) —'] + [mask(x) for x in open(RN + '/log_shop', errors='replace').read().splitlines()[-8:]]
    body.update({'st': st, 'fail': fail, 'warn': warn, 'steps': steps, 'tail': tail})
    # (11/13 shopsrv2) 🛍 우리숍 단계만 실패면 진단(cbuild=1)엔 FAILURE(fail=shop · 빨간불)지만 빌드 종료 코드는 0 —
    #  readnow-cloud는 이미 새 판이고, 빌드가 '실패'로 끝나면 더 늦게 도는 옛 빌드가 이 빌드를 '더 새 빌드'로 안 세어(newer.sh는 SUCCESS만 셈) 옛 판으로 덮을 수 있어서
    rc = 1 if st == 'FAILURE' and failed != ['shop'] else 0
    if failed == ['shop']: print('❌ 🛍 우리숍 전용 서버 단계 실패 — readnow-cloud 새 판은 올라감 · 진단 cbuild=1에 FAILURE(fail=shop)로 남김')
    print(f'☁ 결과 {st}' + (f' · 실패 단계 {fail}' if fail else '') + f' · 단계 {json.dumps(steps, ensure_ascii=False)}')
data = json.dumps(body, ensure_ascii=False).encode()
sent = False
tok = idt()
if tok:
    import time
    for t in range(4):  # 배포 직후엔 새 판으로 넘어가는 몇십 초 동안 못 받을 수 있음(11/13 첫 진짜 빌드) — 15초씩 네 번
        try:
            rq = urllib.request.Request(cloud + '/cb-in', data=data, method='POST', headers={'Authorization': 'Bearer ' + tok, 'content-type': 'application/json'})
            r = json.loads(urllib.request.urlopen(rq, timeout=30).read().decode() or '{}'); sent = bool(r.get('ok')); print('→ /cb-in', r)
        except Exception as e: print('→ /cb-in 실패', t + 1, type(e).__name__, str(e)[:200])
        if sent: break
        time.sleep(15)
else: print('→ ID 토큰을 못 받음')
if not sent and bid:
    try:  # 클라우드가 안 받으면 Firestore에 직접(빌드 계정 권한이 있을 때만 됨)
        at = json.loads(meta('token'))['access_token']
        doc = {'fields': {'j': {'stringValue': data.decode()}, 'direct': {'booleanValue': True}}}
        u = f'https://firestore.googleapis.com/v1/projects/{proj}/databases/(default)/documents/cloudbuild_runs/{bid}?updateMask.fieldPaths=j&updateMask.fieldPaths=direct'
        rq = urllib.request.Request(u, data=json.dumps(doc).encode(), method='PATCH', headers={'Authorization': 'Bearer ' + at, 'content-type': 'application/json'})
        urllib.request.urlopen(rq, timeout=30).read(); print('→ Firestore 직접 넣음')
    except Exception as e: print('→ Firestore 직접도 실패', type(e).__name__, str(e)[:200])
sys.exit(rc)

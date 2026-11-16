#!/usr/bin/env python3
# 🐾 책방 친구 연구 자동 반영 길(friend-autoship) — 지피티(Codex) PR 검사 · 정범님 11/16 22:25 「지피티가 스스로 진행해도 문제 없게」
#  · PR 코드는 실행하지 않고 git에서 글자만 읽음(이 파일은 main에 있는 것만 씀 — PR이 이 검사를 고쳐도 그 PR에는 안 먹힘)
#  · 쓰는 법: python3 -I friend-autoship-check.py <base 커밋> <head 커밋> <결과 폴더>
#  · 결과: <결과 폴더>/gate.json {ok, reasons[], warns[], tests[], files[], live[]} · gate.md(PR 댓글에 들어갈 글)
import json, os, re, subprocess, sys

BASE, HEAD, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
ALLOW = ('friend/research/', 'friend/pixel-lab/')          # 지피티 땅 — 이 밖은 리드 검토
BAD_EXT = re.compile(r'\.(bin|zip|7z|rar|gz|tgz|pem|p12|pfx|key|keystore|jks|env|sqlite|db|rnlock|storage\.json)$', re.I)
BAD_NAME = re.compile(r'(admin|secret|cred|passw|private|service[-_]?account|answer[-_]?key|blind[-_]?(answer|key|truth|map|reveal))|reader[^/]*\.json$', re.I)  # blind32.html 같은 '고르기 화면'은 됨 · 정답표 꼴만 막음
BIN_OK = re.compile(r'\.(png|jpe?g|webp|gif|avif|ico|woff2?)$', re.I)
MAX_FILE, MAX_ALL, MAX_FILES, MAX_DEL = 8 << 20, 40 << 20, 300, 30
PAT = [  # (이름, 꼴) — 더한 줄에서만 찾음
    ('휴대전화 번호', re.compile(r'(?<![0-9A-Za-z])01[016789][-. ]?\d{3,4}[-. ]?\d{4}(?![0-9A-Za-z])')),
    ('전자우편 주소', re.compile(r'[A-Za-z0-9._%+-]+@(?!example\.)[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}')),
    ('주민등록번호 꼴', re.compile(r'(?<!\d)\d{6}-[1-4]\d{6}(?!\d)')),
    ('개인 열쇠', re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----|"private_key"\s*:')),
    ('Google 열쇠', re.compile(r'AIza[0-9A-Za-z_-]{35}')),
    ('GitHub 열쇠', re.compile(r'gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{30,}')),
    ('기타 API 열쇠', re.compile(r'(?<![A-Za-z0-9])(sk-[A-Za-z0-9_-]{24,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16})')),
    ('긴 base64 덩어리(암호 파일을 글로 넣은 꼴)', re.compile(r'(?<!base64,)(?<![A-Za-z0-9+/])[A-Za-z0-9+/]{2000,}={0,2}')),
]
SAFE = re.compile(r'^[A-Za-z0-9._/-]+$')
BUILTIN = {'fs','path','url','os','crypto','zlib','util','assert','child_process','worker_threads','stream','buffer','events','perf_hooks','process','timers','readline','http','https','module'}
MAIL_OK = re.compile(r'^(noreply|no-reply)@|@users\.noreply\.github\.com$', re.I)

def git(*a, text=True):
    return subprocess.run(['git', *a], check=True, capture_output=True, text=text).stdout

def base_has(s):  # 이미 main(지피티 땅)에 있던 같은 글자(예: 웹용 공개 설정)는 새로 새는 것이 아님
    return subprocess.run(['git', 'grep', '-q', '-F', '-e', s, BASE, '--', *ALLOW], capture_output=True).returncode == 0

R, W, tests, files, live = [], [], [], [], []
rows = [l.split('\t') for l in git('diff', '--no-renames', '--name-status', f'{BASE}...{HEAD}').splitlines() if l]
if not rows: R.append('바뀐 파일이 없음')
if len(rows) > MAX_FILES: R.append(f'바뀐 파일 {len(rows)}개 — 한 PR {MAX_FILES}개까지')
dels = [p for st, p in rows if st == 'D']
if len(dels) > MAX_DEL: R.append(f'지운 파일 {len(dels)}개 — 한 PR {MAX_DEL}개까지(더 지울 땐 리드 검토)')
total = 0
for st, p in rows:
    files.append({'st': st, 'path': p})
    if not SAFE.match(p): R.append(f'파일 이름에 쓸 수 없는 글자(영문·숫자·._-/만): `{p!r}`'); continue
    if not p.startswith(ALLOW): R.append(f'허용 밖 경로: `{p}` (자동 반영은 {" · ".join(ALLOW)} 만)'); continue
    if st not in ('A', 'M', 'D'): R.append(f'파일 종류가 바뀜({st}): `{p}`'); continue
    base = p.rsplit('/', 1)[-1]
    if st == 'D': continue
    if BAD_EXT.search(base) or BAD_NAME.search(base): R.append(f'올리면 안 되는 이름(관리자·열쇠·암호·압축 꼴): `{p}` — AI_COLLAB/ADMIN_DROP 길로'); continue
    mode = git('ls-tree', HEAD, '--', p).split(' ', 2)
    if mode and mode[0] == '120000': R.append(f'바로가기(symlink): `{p}`'); continue
    blob = subprocess.run(['git', 'show', f'{HEAD}:{p}'], check=True, capture_output=True).stdout
    total += len(blob)
    if len(blob) > MAX_FILE: R.append(f'파일이 큼({len(blob) >> 20}MB): `{p}` — 한 파일 {MAX_FILE >> 20}MB까지'); continue
    if b'\0' in blob[:8192]:
        if not BIN_OK.search(base): R.append(f'글이 아닌 파일(그림·글꼴만 됨): `{p}`')
        continue
    try: txt = blob.decode('utf-8')
    except UnicodeDecodeError: R.append(f'UTF-8 글이 아님: `{p}`'); continue
    if base.endswith('.json'):
        try: json.loads(txt)
        except Exception as e: R.append(f'JSON이 깨짐: `{p}` ({str(e)[:80]})')
    # 상대 경로로 부르는 파일이 PR 안에 실제로 있는지(빠진 파일 = 화면이 하얗게 뜸)
    if re.search(r'\.(mjs|js|html|css)$', base):
        d = p.rsplit('/', 1)[0]
        refs = re.findall(r'''(?:\bimport\s*(?:[^'"()]*?\bfrom\s*)?|\bimport\s*\(\s*|<script[^>]*\bsrc=|<link[^>]*\bhref=|\burl\(\s*)['"]?(\.{1,2}/[^'"\s)?#]+)''', txt)
        for ref in sorted(set(refs)):
            tgt = os.path.normpath(os.path.join(d, ref))
            if subprocess.run(['git', 'cat-file', '-e', f'{HEAD}:{tgt}'], capture_output=True).returncode != 0:
                R.append(f'`{p}`가 부르는 `{ref}` 파일이 없음')
    if re.search(r'/qa/(test|verify)-[^/]*\.mjs$|\.test\.mjs$', p):
        bare = [m for m in re.findall(r'''(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\(\s*)['"]([^'"./][^'"]*)['"]''', txt)
                if not m.startswith('node:') and m.split('/')[0] not in BUILTIN]
        if 'browser' in base or bare: W.append(f'시험 `{p}`는 바깥 꾸러미({", ".join(sorted(set(bare))) or "브라우저"})가 있어야 해서 자동 반영에선 건너뜀')
        else: tests.append(p)
    if re.search(r'\.(html|mjs|js|css|json)$', base): live.append(p)
if total > MAX_ALL: R.append(f'모두 {total >> 20}MB — 한 PR {MAX_ALL >> 20}MB까지')
# 더한 줄에서 개인 정보·열쇠 찾기(값은 적지 않고 파일·종류만)
cur = None
for line in git('diff', '--no-renames', '-U0', f'{BASE}...{HEAD}', '--', *ALLOW).splitlines():
    if line.startswith('+++ '): cur = line[6:] if line.startswith('+++ b/') else None; continue
    if not cur or not line.startswith('+') or line.startswith('+++'): continue
    if re.search(r'\.(png|jpe?g|webp|gif|avif|ico|woff2?)$', cur, re.I): continue
    for name, rx in PAT:
        for m in rx.finditer(line[1:]):
            s = m.group(0)
            if name == '전자우편 주소' and MAIL_OK.search(s): continue
            if base_has(s): continue
            msg = f'`{cur}`에 {name}이(가) 있음'
            if msg not in R: R.append(msg)
live = sorted(live, key=lambda p: (not p.endswith('.html'), '/qa/' in p, p))[:3]
if not tests: W.append('바뀐 시험 파일(qa/test-*·qa/verify-*·*.test.mjs)이 없음 — 화면 파일만 검사함')
ok = not R
os.makedirs(OUT, exist_ok=True)
json.dump({'ok': ok, 'reasons': R, 'warns': W, 'tests': tests, 'files': files, 'live': live}, open(f'{OUT}/gate.json', 'w'), ensure_ascii=False, indent=1)
md = [f'- 바뀐 파일 {len(rows)}개(더함 {sum(1 for f in files if f["st"]=="A")} · 고침 {sum(1 for f in files if f["st"]=="M")} · 지움 {len(dels)}) · 시험 {len(tests)}개']
md += [f'- ❌ {r}' for r in R] + [f'- ⚠ {w}' for w in W]
open(f'{OUT}/gate.md', 'w').write('\n'.join(md) + '\n')
print('\n'.join(md)); print('검사 결과:', '통과' if ok else '막힘')
sys.exit(0)

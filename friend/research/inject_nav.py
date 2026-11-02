#!/usr/bin/env python3
"""연구 페이지 탐색 틀(nav.html)을 friend/research.html 끝(</body> 앞)에 넣음 — 몇 번 돌려도 같음(예전 틀은 바꿔 끼움).
사용: python3 friend/research/inject_nav.py   (build.py도 끝에 이것을 부름)
· 연구 글·수치·그림(본문)은 건드리지 않음 — 차례·찾기·바로가기 스크립트만 넣음 (정범님 11/03 지시 · 리드나우 방이 만듦)
· 장마다 '바뀐 날' = 그 장 원본 friend/research/NN_*.md 의 마지막 git 커밋 날(없으면 파일 수정 날) → nav.html 의 RNAV_META 자리에 넣음"""
import os, re, json, glob, subprocess, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'research.html')
A, B = '<!--rnav 시작', '<!--rnav 끝-->'

def meta(page):
    ch = {}
    for f in sorted(glob.glob(os.path.join(HERE, '[0-9][0-9]_*.md'))):
        d = ''
        try:
            d = subprocess.run(['git', '-C', HERE, 'log', '-1', '--format=%cs', '--', f], capture_output=True, text=True, timeout=20).stdout.strip()
        except Exception:
            pass
        if not d:
            d = datetime.date.fromtimestamp(os.path.getmtime(f)).isoformat()
        ch[os.path.basename(f)[:-3]] = d
    m = re.search(r'생성 ([0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}) KST', page)
    return {'gen': m.group(1) + ' KST' if m else '', 'ch': ch}

def inject(path=OUT):
    page = open(path, encoding='utf-8').read()
    a = page.find(A)
    if a >= 0:
        b = page.index(B, a) + len(B)
        page = page[:a].rstrip('\n') + page[b:].lstrip('\n')
    snip = open(os.path.join(HERE, 'nav.html'), encoding='utf-8').read().strip()
    snip = re.sub(r'/\*RNAV_META\*/.*?/\*/RNAV_META\*/', lambda m: '/*RNAV_META*/' + json.dumps(meta(page), ensure_ascii=False) + '/*/RNAV_META*/', snip, flags=re.S)
    i = page.rindex('</body>')
    page = page[:i] + '\n' + snip + '\n' + page[i:]
    open(path, 'w', encoding='utf-8').write(page)
    return len(page)

if __name__ == '__main__':
    print('탐색 틀 넣음', OUT, inject())

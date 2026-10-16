#!/usr/bin/env python3
"""📰 요약 재료 만들기 — kpq/r1.json(kpsum-get.sh) → kpq/ex/<문서 번호>.txt (글마다 읽을 부분만) + kpq/index.tsv
 긴 보고서(PDF 수백 쪽)는 앞부분 전부를 읽지 않음: 본문 + 목차 + '요약·결론·시사점' 절(두 번째로 나오는 곳 = 목차 뒤 실제 내용) + '[표 요-' 표 + 숫자가 많은 줄 위주로 약 12,000자
 쓰는 법: python3 src/tools/kpsum-prep.py   (저장소 폴더에서 · kpq/r1.json이 있어야 함)"""
import json, os, re
SRC = {'조사연구보고서': 'g3_1', 'KPIPA 출판 보고서': 'g3_2', '글로벌출판동향': 'g3_5', '출판전산망 알림판': 'bnk', '출판산업 Q&A': 'qa'}
d = json.load(open('kpq/r1.json')).get('kpq', {}); os.makedirs('kpq/ex', exist_ok=True); idx = []
def nth(s, k, n):
    i = -1
    for _ in range(n):
        i = s.find(k, i + 1)
        if i < 0: return -1
    return i
for p in d.get('posts', []):
    doc = p.get('doc') or (SRC.get(p.get('src'), 'x') + '_' + str(p['id'])); t = p.get('attText') or ''; parts = []
    parts.append(f"# {p.get('title')}\n출처 {p.get('src')} · {p.get('date')} · {p.get('cat') or ''}\n주소 {p.get('url')}\n첨부: " + '; '.join(f"{a.get('name')}{' ✓' if a.get('pick') else ''} {a.get('pages') or ''}쪽 글자 {a.get('chars') or 0}{' ISBN ' + str(a.get('isbns')) if a.get('isbns') else ''}{' 오류 ' + a['err'] if a.get('err') else ''}" for a in p.get('atts', [])))
    parts.append('## 본문\n' + (p.get('body') or '')[:4000])
    if t:
        parts.append('## 첨부 맨 앞(표지·목차)\n' + t[:2500])
        got = 0
        for kw in ['요약', '요 약', '결론', '시사점', '제언', '주요 결과', 'Executive Summary', '핵심']:
            for n in (2, 1):
                i = nth(t, kw, n)
                if i > 2500 and got < 3:
                    parts.append(f'## 첨부 "{kw}" 부분\n' + t[i:i + 3500]); got += 1; break
        tb = [m.start() for m in re.finditer(r'\[표 요-', t)][len(re.findall(r'\[표 요-', t[:6000])):][:3]
        for i in tb: parts.append('## 요약 표\n' + t[max(0, i - 1500):i + 300])
        nums = [l for l in t.split('\n') if len(re.findall(r'\d', l)) >= 6 and 15 < len(l) < 220][:60]
        if nums: parts.append('## 숫자가 많은 줄(앞에서부터)\n' + '\n'.join(nums))
    ex = '\n\n'.join(parts)[:14000]; open(f'kpq/ex/{doc}.txt', 'w').write(ex); idx.append((doc, p.get('date') or '', p.get('src'), len(ex), p.get('attChars') or 0, (p.get('title') or '')[:60]))
with open('kpq/index.tsv', 'w') as f:
    for r in idx: f.write('\t'.join(map(str, r)) + '\n')
print(f"재료 {len(idx)}개 → kpq/ex/ · 목록 kpq/index.tsv"); [print(*r, sep='\t') for r in idx]

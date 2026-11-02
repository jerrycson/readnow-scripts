#!/usr/bin/env python3
# 책방 친구 본체(friend/readnow-friend.js)의 v2 블록을 조각(friend/src/msc2/*.js)으로 거꾸로 뽑는다.
# 쓰기: python3 friend/src/extract.py [본체 경로] [조각 폴더]
# 조각은 splice.py의 parts 차례와 같고, 각 조각은 아래 시작 줄(줄 맨 앞 글자)로 나뉜다.
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
F = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'readnow-friend.js')
D = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'msc2')
M0 = '/* ═══════════ 🐾 v2 시작 (15차 · 자동으로 붙임 — 원본은 pw/r15/msc2_*.js가 아님: 이 블록이 원본) ═══════════ */'
M1 = '/* ═══════════ 🐾 v2 끝 ═══════════ */'
# (조각 이름, 그 조각 첫 줄의 앞부분) — splice.py parts 차례
STARTS = [
 ('core', '/* ══════════ 🐾 책방 친구 v2 (15차'),
 ('body', '/* ── v2 몸 그리기: 뼈대(msc2Solve)'),
 ('fig',  '/* ── 팔(위팔 + 아래팔)'),
 ('head', '/* ── v2 머리(바이블 §3.1)'),
 ('hair', '/* ── v2 머리카락(바이블 §4)'),
 ('hand', '/* ── v2 손(바이블 §6)'),
 ('cloth','/* ── v2 옷(바이블 §8)'),
 ('acc',  '/* ── v2 장신구(바이블 §8.5)'),
 ('svg',  '/* ── v2 그림 짜기 ──'),
 ('rig',  '/* ── v2 움직임(계획 §2.9)'),
 ('ui',   '/* ── v2 고르기(이 기기'),
 ('sd',   '/* ══════════ 🐾 v2 꼬마(SD'),
 ('crea', '/* ══════════ 🐾 v2 동물 친구'),
 ('act',  '/* ══════════ 🐾 v2 새 몸짓'),
 ('life', '/* ══════════ 🐾 v2 살아 있는 몸'),
 ('i',    '/* ═══ (15차i)'),
 ('j',    '/* ═══ (15차j)'),
 ('k',    '/* ═══ (15차k)'),
]
s = open(F, encoding='utf-8').read()
a = s.index(M0); b = s.index(M1)
if s.count(M0) != 1 or s.count(M1) != 1: sys.exit('v2 블록 표시가 하나가 아님')
body = s[a + len(M0) + 1:b]            # M0 다음 줄바꿈부터 M1 앞까지
lines = body.split('\n')[:-1]           # 끝 '' 제거(M1 앞 줄바꿈)
if body.split('\n')[-1] != '': sys.exit('블록 끝이 줄바꿈이 아님')
pos = []
for nm, pre in STARTS:
    hits = [i for i, l in enumerate(lines) if l.startswith(pre)]
    if len(hits) != 1: sys.exit('조각 시작을 하나로 못 찾음: %s (%d곳)' % (nm, len(hits)))
    pos.append(hits[0])
if pos != sorted(pos) or pos[0] != 0: sys.exit('조각 시작 차례가 어긋남: %s' % pos)
os.makedirs(D, exist_ok=True)
pos.append(len(lines))
for k, (nm, _) in enumerate(STARTS):
    t = '\n'.join(lines[pos[k]:pos[k + 1]]) + '\n'   # 조각 사이 빈 줄도 그대로 둠(바이트 같음)
    open(os.path.join(D, 'msc2_%s.js' % nm), 'w', encoding='utf-8', newline='').write(t)
print('뽑음: 조각 %d개 · %d줄' % (len(STARTS), len(lines)))

#!/usr/bin/env python3
# v2 조각(friend/src/msc2/*.js)을 본체(friend/readnow-friend.js) 끝의 v2 블록으로 다시 붙인다.
# 몇 번 돌려도 같음(idempotent). 쓰기: python3 friend/src/splice.py [본체 경로] [조각 폴더]
# r18 회차 1: 예전 '걸이 고침(rep)'은 본체에 이미 들어가 있어(r15~r17에 본체를 직접 고침) 없앴고,
#             대신 걸이가 본체에 남아 있는지만 확인한다(없으면 멈춤).
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
F = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'readnow-friend.js')
D = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'msc2')
parts = ['core','body','fig','head','hair','hand','cloth','acc','svg','rig','ui','sd','crea','act','life','i','j','k']
M0 = '/* ═══════════ 🐾 v2 시작 (15차 · 자동으로 붙임 — 원본은 pw/r15/msc2_*.js가 아님: 이 블록이 원본) ═══════════ */'
M1 = '/* ═══════════ 🐾 v2 끝 ═══════════ */'
# 본체(블록 밖)에 있어야 하는 v2 걸이 — 하나라도 없으면 멈춤
HOOKS = [
 "msc2Use(ch, opt)) return msc2Svg(ch, p, opt)",
 "msc2RigInit(R)",
 "if (R.v2) return msc2Frame(R, now, dt || 0)",
 "msc2EngHtml()",
 "msc2DragStart(R, k, s, T)",
 "n_yuna: { v2: 1",
 "n_taeo: { v2: 1",
]
blk = ''
for x in parts:
    p = os.path.join(D, 'msc2_%s.js' % x)
    if not os.path.exists(p): sys.exit('조각이 없음: ' + p)
    t = open(p, encoding='utf-8').read()
    if not t.endswith('\n'): sys.exit('조각이 줄바꿈으로 안 끝남: ' + p)
    blk += t   # 조각은 그대로 이어 붙임(바이트 같음 — 조각 사이 빈 줄도 조각 안에 있음)
s = open(F, encoding='utf-8').read()
if M0 in s: s = s[:s.index(M0)] + s[s.index(M1) + len(M1):].lstrip('\n')
for h in HOOKS:
    if s.count(h) < 1: sys.exit('본체에 v2 걸이가 없음: ' + h)
s = s.rstrip('\n') + '\n' + M0 + '\n' + blk + M1 + '\n'
open(F, 'w', encoding='utf-8', newline='').write(s)
print('붙임: 조각 %d개 · %d자' % (len(parts), len(blk)))

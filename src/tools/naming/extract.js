#!/usr/bin/env node
/* 🏷 이름 목록 뽑기 (정범님 11/03 '쓸데없이 긴 이름 찾기')
   src/app.html에서 '이름 자리'(탭·카드 제목·단추·섹션 제목·고르기 항목·접기 제목)의 글자만 뽑아 길이순으로 보여 줌.
   설명 문장(class="hint" 등)·툴팁(title=)·🐾 책방 친구 부분은 뺌.
   쓰는 법: node src/tools/naming/extract.js [--min 8] [--kind btn,sec,...] [--json] [app.html 경로]
   결과는 names.json을 만들 때 보는 목록일 뿐 — 바꾸기는 apply.js가 names.json으로 함. */
'use strict';
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const MIN = +opt('--min', 8), KINDS = (opt('--kind', '') || '').split(',').filter(Boolean), JSONOUT = argv.includes('--json');
const file = argv.find((a, i) => !a.startsWith('--') && !['--min', '--kind'].includes(argv[i - 1])) || path.join(__dirname, '..', '..', 'app.html');
const src = fs.readFileSync(file, 'utf8'), lines = src.split('\n');
const lineOf = (() => { const st = [0]; for (let i = 0; i < src.length; i++) if (src.charCodeAt(i) === 10) st.push(i + 1); return (p) => { let lo = 0, hi = st.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (st[m] <= p) lo = m; else hi = m - 1; } return lo + 1; }; })();
const isFriend = (ln) => /🐾|friend|frw[A-Z]|msc[A-Z]/.test(lines[ln - 1] || '') && /🐾|frw|msc/.test((lines[ln - 1] || '').slice(0, 400));
const P = [
  ['btn', /<button\b[^>]*>([^<]{2,120}?)<\/button>/g],
  ['card', /<h[1-4]\b[^>]*>([^<]{2,120}?)(?=<|\$\{)/g],
  ['sum', /<summary\b[^>]*>([^<]{2,120}?)(?=<|\$\{)/g],
  ['sec', /\bsec\(\s*['"][\w-]+['"]\s*,\s*'((?:[^'\\]|\\.){2,160})'/g],
  ['sec', /\bsec\(\s*['"][\w-]+['"]\s*,\s*`([^`$]{2,160})`/g],
  ['tab', /\[\s*'([\w-]{1,20})'\s*,\s*'((?:[^'\\]|\\.){2,80})'(?=\s*[,\]])/g],
  ['pick', /<option\b[^>]*>([^<]{2,120}?)<\/option>/g],
  ['tab', /data-tab="[^"]*"[^>]*>([^<]{2,80}?)</g],
];
const out = [], seen = new Set();
for (const [kind, re] of P) { if (KINDS.length && !KINDS.includes(kind)) continue; re.lastIndex = 0; let m; while ((m = re.exec(src))) {
  let t = (kind === 'tab' && m[2] !== undefined ? m[2] : m[1]).trim(); if (!t || t.includes('${')) continue; if (!/[가-힣]/.test(t)) continue;
  const ln = lineOf(m.index); if (isFriend(ln)) continue;
  const bare = t.replace(/[^\p{L}\p{N}]/gu, ''); if (bare.length < MIN) continue;
  const key = kind + '|' + t; if (seen.has(key)) { const o = out.find((x) => x.key === key); o.lines.push(ln); continue; } seen.add(key);
  out.push({ key, kind, t, len: bare.length, words: t.split(/\s+/).length, lines: [ln] }); } }
out.sort((a, b) => b.len - a.len);
if (JSONOUT) { console.log(JSON.stringify(out.map(({ key, ...r }) => r), null, 1)); }
else { for (const o of out) console.log(`${o.kind}\t${o.len}\t${o.lines.slice(0, 4).join(',')}${o.lines.length > 4 ? '…' : ''}\t${o.t}`); console.error(`이름 자리 ${out.length}개 (글자 ${MIN}자 이상)`); }

#!/usr/bin/env node
/* 🏷 이름 바꾸기 적용 (정범님 11/03 '쓸데없이 긴 이름 → 간결하고 명백한 이름 · 번복할 수 있게')
 *
 * names.json의 표대로 src/app.html의 '이름 자리'만 바꿈. 같은 글자가 설명 문장 안에 섞여 있으면 건드리지 않음:
 *   자리마다 맥락 [앞, 뒤]가 정확히 붙어 있을 때만 바꿈 — 기본 맥락은 이름 글자 하나만 통째로 든 자리
 *   (>이름<  '이름'  "이름"  `이름`  \'이름\'  「이름」) + 이름 바로 뒤에 <small·${ 가 붙은 자리.
 *   그 밖의 자리는 names.json 항목의 ctx: [[앞, 뒤], …]로 맥락을 직접 적음(그때는 기본 맥락을 쓰지 않음).
 * 건드리지 않는 곳: 업데이트 기록(CHANGELOG · UPDATE_DATES ~ UPD_STORY) · ❓ 사용 설명서 본문(사람이 고침 · 설명서 판 지문) ·
 *   🐾 책방 친구 둘레(같은 줄 앞뒤 300자 안에 🐾·frw·msc·friend가 있으면) · 바뀐 이름 표 칸(@NAMES 표지 사이 — 이 도구가 다시 씀).
 * 상태: 바뀐 이름 표 칸에 적용한 id가 남음 → '이미 바뀜'/'못 찾음'을 가름(새 이름이 '저장'처럼 흔해도 헷갈리지 않음).
 * 메인 세션이 다른 작업을 합친 뒤 다시 돌리면 새로 들어온 예전 이름만 더 바꿈. '못 찾음'이 있으면 끝 코드 1.
 *
 * 쓰는 법:
 *   node src/tools/naming/apply.js                 모두 적용(이미 바뀐 것은 건너뜀 · 여러 번 돌려도 같음)
 *   node src/tools/naming/apply.js --revert        모두 되돌림(새 이름 → 예전 이름)
 *   node src/tools/naming/apply.js --id a,b        일부만 (--revert와 함께 써도 됨)
 *   node src/tools/naming/apply.js --dry [--show]  파일은 그대로 · 무엇이 바뀔지만 (--show = 자리마다 줄 번호·앞뒤 글)
 *   node src/tools/naming/apply.js --file <경로>   다른 app.html (기본 src/app.html)
 * 결과: 바꾼 수 · 이미 바뀜 · 못 찾음(다른 작업이 그 글을 고쳤을 수 있음 → names.json 손볼 것) · 수가 기대(n)와 다름 */
'use strict';
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const REVERT = argv.includes('--revert'), DRY = argv.includes('--dry'), SHOW = argv.includes('--show');
const IDS = opt('--id') ? new Set(opt('--id').split(',').map((s) => s.trim()).filter(Boolean)) : null;
const FILE = opt('--file') || path.join(__dirname, '..', '..', 'app.html');
const TABLE = opt('--names') || path.join(__dirname, 'names.json');
/* 기본 맥락 — 이름 글자 하나만 통째로 든 자리 + 이름 바로 뒤에 작은 설명(<small)·숫자(${)가 붙은 자리 */
const DEF_CTX = [['>', '<'], ["'", "'"], ['"', '"'], ['`', '`'], ["\\'", "\\'"], ['「', '」'], ["'", ' <small'], ['>', ' <small'], ['>', ' ${']];
const NB = '/*@NAMES*/', NE = '/*@NAMES_END*/';

const names = JSON.parse(fs.readFileSync(TABLE, 'utf8'));
{ const seen = new Set(); for (const e of names) { if (!e.id || e.from == null || e.to == null) throw new Error('names.json: id·from·to 없음 ' + JSON.stringify(e)); if (seen.has(e.id)) throw new Error('names.json: 같은 id ' + e.id); seen.add(e.id); if (e.from === e.to) throw new Error('names.json: from = to ' + e.id); } }
let src = fs.readFileSync(FILE, 'utf8');

/* 건드리지 않는 구간 [시작, 끝) — 글이 바뀔 때마다 다시 셈 */
function zones(t) { const Z = []; const add = (a, bTok, from) => { const i = t.indexOf(a, from || 0); if (i < 0) return; const j = t.indexOf(bTok, i + a.length); Z.push([i, j < 0 ? t.length : j + bTok.length]); };
  add('\nconst CHANGELOG = {', '\n};');
  add('\nconst UPDATE_DATES = ', '\nlet _updIx = null;');
  { const a = t.indexOf("/* ══════════ 사용 설명서 (위 '❓ 설명서' 버튼) ══════════ */"); if (a >= 0) { const f = t.indexOf('\nfunction openManual() {', a); const e = f < 0 ? -1 : t.indexOf('\n}\n', f + 1); Z.push([a, e < 0 ? t.length : e + 3]); } }
  add(NB, NE);
  return Z; }
const FRIEND = /🐾|\bfrw[A-Z_]\w*|\bmsc[A-Z]\w*|friend/;
function guarded(t, Z, p, len) { for (const [a, b] of Z) if (p >= a && p < b) return 'zone'; /* 🐾 둘레 = 같은 줄 안 앞뒤 300자 */ const ls = t.lastIndexOf('\n', p) + 1, le0 = t.indexOf('\n', p + len), le = le0 < 0 ? t.length : le0; const s = t.slice(Math.max(ls, p - 300), Math.min(le, p + len + 300)); return FRIEND.test(s) ? 'friend' : null; }
const lineAt = (t, p) => { let n = 1; for (let i = t.indexOf('\n'); i >= 0 && i < p; i = t.indexOf('\n', i + 1)) n++; return n; };

/* 되돌리기 열쇠 = 바꾼 자리마다 앞뒤 글(applied.json) — '저장'·'닫기'처럼 흔한 새 이름도 바꾼 그 자리만 되돌림
 *  { id: [[맥락 번호, 앞 글, 뒤 글], …] } · 적용할 때 덧붙이고 되돌릴 때 뺌 · 앞뒤 글이 다른 작업으로 바뀌면 반쪽(앞 또는 뒤)으로 하나뿐일 때만 */
const APPLIED_F = opt('--applied') || path.join(__dirname, 'applied.json');
const APPLIED = (() => { try { return JSON.parse(fs.readFileSync(APPLIED_F, 'utf8')); } catch (e) { return {}; } })();
const AW = 24;
const cp = (x) => Buffer.from(x, 'utf8').toString('utf8'); /* 잘라 낸 글이 큰 원문을 붙잡지 않게(메모리) */
const uniq = (t, s) => { const i = t.indexOf(s); return i >= 0 && t.indexOf(s, i + 1) < 0 ? i : -1; };
function run(e) { const ctx = e.ctx || DEF_CTX; let did = 0; const skip = { zone: 0, friend: 0 }, shows = [], lost = [];
  const show = (i, needle) => { if (SHOW) shows.push(`    ${lineAt(src, i)}: …${src.slice(Math.max(0, i - 40), i).replace(/\n/g, ' ')}【${needle}】${src.slice(i + needle.length, i + needle.length + 30).replace(/\n/g, ' ')}…`); };
  if (!REVERT) { const anc = APPLIED[e.id] || [];
    ctx.forEach(([pre, post], ci) => { const needle = pre + e.from + post, done = pre + e.to + post; const Z = zones(src); let out = '', last = 0, i = src.indexOf(needle); const add = [];
      while (i >= 0) { const g = guarded(src, Z, i, needle.length); if (g) skip[g]++; else { show(i, needle); out += src.slice(last, i) + done; add.push([out.length - done.length, ci]); last = i + needle.length; did++; } i = src.indexOf(needle, i + needle.length); }
      if (last) { src = out + src.slice(last); for (const [p] of add) anc.push([ci, cp(src.slice(Math.max(0, p - AW), p)), cp(src.slice(p + done.length, p + done.length + AW))]); } });
    if (anc.length) APPLIED[e.id] = anc; return { did, skip, shows, lost }; }
  const keep = [];
  for (const a of APPLIED[e.id] || []) { const [ci, L, Rt] = a; const c = ctx[ci]; if (!c) { lost.push(a); continue; } const done = c[0] + e.to + c[1], back = c[0] + e.from + c[1];
    let i = uniq(src, L + done + Rt), off = L.length; if (i < 0) { i = uniq(src, L + done); } if (i < 0) { i = uniq(src, done + Rt); off = 0; } if (i < 0 && L.length > 8) { i = uniq(src, L.slice(-8) + done); off = 8; }
    if (i < 0) { lost.push(a); keep.push(a); continue; } const p = i + off; show(p, done); src = src.slice(0, p) + back + src.slice(p + done.length); did++; }
  if (keep.length) APPLIED[e.id] = keep; else delete APPLIED[e.id];
  return { did, skip, shows, lost }; }
/* 한 번 다 바꾼 뒤 열쇠를 지금 글로 다시 잡음(이웃 이름이 같은 회차에 바뀌어 앞뒤 글이 달라졌을 수 있음) */
function refreshAnchors() { for (const e of names) { const L0 = APPLIED[e.id]; if (!L0) continue; const ctx = e.ctx || DEF_CTX; const used = new Set();
  APPLIED[e.id] = L0.map((a) => { const [ci, L, Rt] = a; const c = ctx[ci]; if (!c) return a; const done = c[0] + e.to + c[1]; let p = -1;
    for (let j = src.indexOf(done); j >= 0; j = src.indexOf(done, j + 1)) { if (used.has(j)) continue; const l = src.slice(Math.max(0, j - AW), j), r = src.slice(j + done.length, j + done.length + AW); const sc = (l === L ? 2 : l.endsWith(L.slice(-8)) ? 1 : 0) + (r === Rt ? 2 : r.startsWith(Rt.slice(0, 8)) ? 1 : 0); if (sc >= 2 && (p < 0 || sc > p.sc)) p = { j, sc, l, r }; }
    if (p === -1) return a; used.add(p.j); return [ci, cp(p.l), cp(p.r)]; }); } }

/* 상태 = app.html의 바뀐 이름 표 칸(지난번 적용한 id) */
const PREV = (() => { const a = src.indexOf(NB), b = src.indexOf(NE); if (a < 0 || b < a) return new Set(); try { return new Set(JSON.parse(src.slice(a + NB.length, b) || '[]').map((x) => x[3])); } catch (e) { return new Set(); } })();
const LIVE = new Set(PREV);
const R = { did: [], already: [], miss: [], odd: [] }; let total = 0;
const ORDER = REVERT ? names.slice().reverse() : names;
for (const e of ORDER) { if (IDS && !IDS.has(e.id)) continue; const r = run(e); total += r.did;
  const tag = `${e.id}  「${REVERT ? e.to : e.from}」 → 「${REVERT ? e.from : e.to}」`;
  if (r.did) R.did.push(`${tag}  ${r.did}곳${r.skip.zone || r.skip.friend ? ` (기록·설명서 ${r.skip.zone} · 🐾 ${r.skip.friend} 건너뜀)` : ''}`);
  else if (REVERT ? !PREV.has(e.id) : PREV.has(e.id)) R.already.push(tag); else R.miss.push(tag);
  if (r.lost.length) R.odd.push(`${e.id}: 바꾼 자리 ${r.lost.length}곳의 앞뒤 글이 다른 작업으로 바뀌어 되돌리지 못함 — applied.json에 남김(손으로 확인)`);
  if (REVERT) { if (r.did && !r.lost.length) LIVE.delete(e.id); } else if (r.did) LIVE.add(e.id);
  if (SHOW && r.shows.length) R.did.push(...r.shows); }
if (!REVERT) refreshAnchors();

/* 바뀐 이름 표(화면 ⚙ 설정 › 🏷 이름 바꾼 기록 · 🔍 기능 찾기 동의어) — 지금 새 이름으로 된 것만 */
{ const live = names.filter((e) => LIVE.has(e.id) && e.log !== false).map((e) => [e.from, e.to, e.kind || '', e.id]);
  const a = src.indexOf(NB), b = src.indexOf(NE);
  if (a >= 0 && b > a) src = src.slice(0, a + NB.length) + JSON.stringify(live).replace(/\],\[/g, '],\n  [') + src.slice(b);
  else R.odd.push('바뀐 이름 표 칸(/*@NAMES*/ … /*@NAMES_END*/)을 app.html에서 못 찾음 — 화면 표·기능 찾기 동의어가 비어 있음');
  R.live = live.length; }

if (!DRY) { fs.writeFileSync(FILE, src); fs.writeFileSync(APPLIED_F, '{\n' + Object.entries(APPLIED).map(([k, v]) => JSON.stringify(k) + ': ' + JSON.stringify(v)).join(',\n') + '\n}\n'); }
const P = (h, L) => { if (L.length) { console.log(`${h} ${L.length}`); L.forEach((x) => console.log('  ' + x)); } };
console.log(`🏷 이름 ${REVERT ? '되돌리기' : '바꾸기'}${DRY ? ' (시험 — 파일 그대로)' : ''} · ${path.relative(process.cwd(), FILE)} · 표 ${names.length}개${IDS ? ` 중 ${IDS.size}개` : ''}`);
P('✓ 바꿈', R.did); P(REVERT ? '· 이미 되돌림' : '· 이미 바뀜', R.already); P('⚠ 못 찾음', R.miss); P('⚠ 확인', R.odd);
console.log(`합계: ${total}곳 바꿈 · 이미 ${R.already.length} · 못 찾음 ${R.miss.length} · 화면 표 ${R.live}줄`);
process.exitCode = R.miss.length ? 1 : 0;

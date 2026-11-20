// tPRLOCK_1120 — (11/20 일꾼 pricelock1 · 정범님 I-1120-0948-11 · 헌장 제45조) ⏳ 가격 바꾼 뒤 잠금
//   ① 도우미 글(⏳PXL 묶음) — 웹앱·수집기·클라우드·가격 감시기가 한 글자도 다르지 않음
//   ② 등록 뒤 첫 가격 변경 뒤 48시간 · 그 뒤엔 바꿀 때마다 공개 반영 평균 × 2 · 표본이 모자라면 설정값
//   ③ 관제소 풀기 — 묶음·그룹·상품 따로 · 48시간과 ×2 따로
//   ④ 막힘은 미룸 — 실패로 세지 않음(fail 안 부름) · 200건 몫에 안 셈 · 수동 확정 72시간에서 미룬 시간을 뺌
//   ⑤ 값을 바꾸는 모든 길이 맡기 전에 잠금을 봄(감시기·수집기·클라우드) · 성공하면 기록 · 미룬 명령은 클라우드가 깨움 · 웹앱 알림
// 실행: node src/tests/tPRLOCK_1120.js · Firestore에 닿지 않음(운영 prd_locks·prd_pxlock 안 씀) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..');
const rd = (f) => { for (const p of [path.join(ROOT, f), path.join(ROOT, 'src', f), path.join(__dirname, '..', path.basename(f)), path.join(__dirname, path.basename(f))]) if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8'); return ''; };
const T = fs.readFileSync(process.env.RN_APP || path.resolve(__dirname, '..', 'app.html'), 'utf8');
const COL = rd('src/readnow-collector.src.js') || rd('readnow-collector.user.js'), CL = rd('cloud/index.js'), WT = rd('readnow-price-watch.user.js');
const blk = (S) => { const i = S.indexOf('/* ⏳PXL{ */'), j = S.indexOf('/* }⏳PXL */'); return i < 0 || j < i ? '' : S.slice(i, j).split('\n').map((l) => l.trim()).join('\n'); };
const fnIn = (S, name, pre) => { const i = S.indexOf((pre || 'function ') + name + '('); if (i < 0) return ''; let d = 0; const k = S.indexOf('{', i); for (let j = k; j < S.length; j++) { if (S[j] === '{') d++; else if (S[j] === '}') { d--; if (!d) return S.slice(i, j + 1); } } return S.slice(i); };
const H = 3600e3, T0 = Date.parse('2026-11-20T00:00:00Z'), iso = (t) => new Date(t).toISOString();

console.log('① 같은 글');
const bW = blk(T), bC = blk(COL), bK = blk(CL), bP = blk(WT);
ok(bW && bC && bK && bP, '네 곳 모두 ⏳PXL 묶음이 있음');
ok(bW === bC && bW === bK && bW === bP, '네 곳이 같은 글');
{ const AL = rd('lab/col2/shadow/col2-alw-core.js'); /* (I-1120-1024-13) 번외 그림자 쓰기 코어 — 번외 통합 때 같은 규칙 · 시험 문지기 자리에 lab/가 없으면 알림만 */
  if (!AL) console.log('  · 번외 코어(lab/col2) 없는 자리 — 다섯째 견줌은 저장소에서'); else { ok(blk(AL) === bW, '다섯째 번외 코어(col2-alw-core)도 같은 글');
    const A = {}; vm.runInNewContext(AL.replace(/if \(typeof module[^\n]*\n/, 'OUT.api = api;\n'), { OUT: A, globalThis: {} }); const R = A.api && A.api.pxlRefuse; const rec = { first: '2026-11-19T12:00:00.000Z', last: '2026-11-19T12:00:00.000Z', n: 1 };
    ok(R && R('edit', { ch: { price: 9000 }, cur: { price: 10000 } }, rec, null, null, T0).refuse === true, '번외: 잠금 중 가격 변경은 미룸(셈만)');
    ok(R && R('edit', { ch: { qty: 1 } }, rec, null, null, T0).refuse === false && R('edit', { ch: { price: 10000 }, cur: { price: 10000 } }, rec, null, null, T0).refuse === false, '번외: 가격 안 바뀌면 안 막음'); } }
ok(/근거: 없음, 설정으로 바꿈/.test(bW), '표본 모자랄 때 기본값에 「근거: 없음, 설정으로 바꿈」');
const X = {}; vm.runInNewContext(bW + '\n;Object.assign(OUT, { PXL_DEF, pxlState, pxlFree, pxlFids, pxlHeld, pxlRec, pxlLagAdd, pxlLagH, pxlNote, pxlErr, pxlFromActs, pxlMerge });', { OUT: X });
for (const [n, s] of [['감시기', WT], ['수집기', COL], ['클라우드', CL]]) { try { new vm.Script(s.replace(/^\/\/ ==UserScript==[\s\S]*?==\/UserScript==/m, ''), { filename: n }); ok(true, n + ' 문법'); } catch (e) { ok(/await is only valid|Unexpected reserved|import|export/.test(e.message), n + ' 문법', e.message); } }

console.log('② 48시간 · ×2');
const LAG = { avgSec: 30 * 3600, n: 20 }, LAG0 = { avgSec: 30 * 3600, n: 2 };
ok(!X.pxlState(null, LAG, null, T0).lock, '한 번도 안 바꾼 상품(등록 뒤 첫 변경 전)은 안 잠김');
let r = X.pxlRec(null, iso(T0), 10000, 9000, 'pw:batch', 'g1');
ok(r.first === iso(T0) && r.last === iso(T0) && r.n === 1 && r.gids[0] === 'g1', '첫 변경 기록(first·last·n·그룹)', r);
let s = X.pxlState(r, { avgSec: 3 * 3600, n: 20 }, null, T0 + 47 * H); ok(s.lock && s.rule === 'h48' && s.until === iso(T0 + 48 * H), '첫 변경 뒤 47시간 — 48시간 잠금', s);
ok(!X.pxlState(r, { avgSec: 3 * 3600, n: 20 }, null, T0 + 48 * H + 1).lock, '48시간 지나면 풀림(평균×2가 더 짧을 때)');
s = X.pxlState(r, LAG, null, T0 + 50 * H); ok(s.lock && s.rule === 'x2' && s.until === iso(T0 + 60 * H), '첫 변경에도 ×2가 더 길면 ×2(30시간×2=60시간)', s);
r = X.pxlRec(r, iso(T0 + 61 * H), 9000, 8800, 'cmd:strategy', null);
ok(r.n === 2 && r.first === iso(T0) && r.last === iso(T0 + 61 * H), '두 번째 변경 — first는 그대로 · last 새로', r);
s = X.pxlState(r, LAG, null, T0 + 100 * H); ok(s.lock && s.rule === 'x2' && s.until === iso(T0 + 121 * H), '그 뒤엔 마지막 변경 + 평균×2', s);
s = X.pxlState(r, LAG0, null, T0 + 100 * H); ok(s.lock && s.est && s.until === iso(T0 + 61 * H + 2 * X.PXL_DEF.defLagH * H), '표본 모자라면 설정값(defLagH)으로', s);
ok(X.pxlLagH({ avgSec: 999 * 3600, n: 50 }).h === X.PXL_DEF.maxLagH, '평균 상한(maxLagH)');
ok(X.pxlLagH({ avgSec: 3600, n: 50, def: { minN: 100, defLagH: 5 } }).h === 5, '설정(px_lag.def)으로 바꿀 수 있음');
let L = null; for (let i = 0; i < 205; i++) L = { ...L, ...X.pxlLagAdd(L, 3600) }; ok(L.n === 200 && L.avgSec === 3600 && L.medSec === 3600, '평균 표본은 마지막 200개');
ok(/48시간 · .*까지 · 잠금 끝난 뒤 반영/.test(X.pxlNote(X.pxlState(X.pxlRec(null, iso(T0)), LAG0, null, T0 + H))), '알림 글 「잠금 끝난 뒤 반영」');
ok(X.pxlErr(T0).lock && /실패 아님/.test(X.pxlNote(X.pxlErr(T0))), '못 읽으면 잠긴 것으로(10분 뒤 다시) · 실패 아님');

console.log('③ 풀기 — 묶음·그룹·상품 × 48시간·×2');
const FOLD = { folds: { f1: { name: '묶음A', gids: ['g1', 'g2'] } } };
const one = X.pxlRec(null, iso(T0), 1, 2, null, 'g1');
const at = (fr) => X.pxlState(one, LAG, X.pxlFree(fr, { key: 'aladin_1', gids: ['g1'], fids: X.pxlFids(FOLD, ['g1']) }), T0 + 40 * H);
ok(at(null).lock && at(null).rule === 'x2', '풀기 없으면 잠김(×2 60시간)');
ok(at({ k: { aladin_1: { h48: true } } }).lock, '상품 48시간만 풀어도 ×2는 남음');
ok(!at({ k: { aladin_1: { h48: true, x2: true } } }).lock, '상품 둘 다 풀면 안 잠김');
ok(!at({ g: { g1: { h48: true, x2: true } } }).lock, '그룹으로 풀기');
ok(!at({ f: { f1: { h48: true, x2: true } } }).lock, '묶음으로 풀기');
ok(at({ g: { g9: { h48: true, x2: true } }, f: { f9: { h48: true, x2: true } }, k: { aladin_2: { h48: true, x2: true } } }).lock, '다른 묶음·그룹·상품 풀기는 상관없음');
const sx = X.pxlState(one, { avgSec: 3600, n: 20 }, X.pxlFree({ f: { f1: { x2: true } } }, { key: 'aladin_1', gids: ['g1'], fids: ['f1'] }), T0 + 10 * H); ok(sx.lock && sx.rule === 'h48', '×2만 풀면 48시간은 남음');
ok(!/pxlFree|px_lock_free/.test(fnIn(WT, 'pxlCtxW', 'async function ').replace(/doc\('px_lock_free'\)\.get\(\)/g, '')) && !/px_lock_free'\)\.(set|update)/.test(WT + COL + CL), '감시기·수집기·클라우드는 풀기를 읽기만(쓰지 않음 — 엔진·예약은 못 풂)');
ok(/data-cswpx/.test(T) && fnIn(T, 'ctrlPxOpen', 'async function ') && /ask\(/.test(fnIn(T, 'ctrlPxOpen', 'async function ')) && /by: S\.user\.email/.test(fnIn(T, 'ctrlPxSet', 'async function ')), '관제소 ⏳ 가격 잠금 — ask로 묻고 사람(로그인한 이)만 저장');
ok(!/\b(alert|confirm|prompt)\(/.test(fnIn(T, 'ctrlPxOpen', 'async function ') + fnIn(T, 'ctrlPxSet', 'async function ')), '브라우저 팝업 없음');

console.log('④ 미룸 — 실패 아님 · 72시간');
const ex = fnIn(WT, 'executeApproved', 'async function ');
const pre = ex.slice(ex.indexOf('if (offOf(x))'), ex.indexOf('claim(d.ref, x, kind)'));
ok(/pxlReadW\(x\)/.test(pre) && /nDone--/.test(pre) && !/fail\(/.test(pre), '감시기 — 맡기 전에 잠금 · 200건 몫에서 뺌 · fail(세 번 실패 셈)을 안 부름');
ok(/pxWait: \{ apAt/.test(pre) && /w0\.apAt === apAt && Date\.parse\(w0\.until\) > Date\.now\(\)/.test(pre), '미룬 때를 적고 다음 바퀴엔 읽지 않고 넘김(돌지 않음)');
ok(/Date\.parse\(ap\.at\) - pxlHeld\(x\.pxWait, ap\.at \|\| null\) > 72 \* 3600e3/.test(ex), '수동 확정 72시간에서 미룬 시간을 뺌');
ok(/Date\.parse\(x\.at\) > 48 \* 3600e3/.test(ex), '엔진 승인 48시간은 그대로(잠금 끝난 뒤 오래됐으면 다시 판정)');
const w = { apAt: 'A', since: iso(T0), until: iso(T0 + 10 * H), held: 2 * H };
ok(X.pxlHeld(w, 'A', T0 + 5 * H) === 7 * H && X.pxlHeld(w, 'A', T0 + 20 * H) === 12 * H && X.pxlHeld(w, 'B', T0 + 5 * H) === 0, '미룬 시간 셈(다른 확정이면 0)');
const ap = iso(T0), held = X.pxlHeld({ apAt: ap, since: iso(T0 + H), until: iso(T0 + 61 * H) }, ap, T0 + 70 * H);
ok(T0 + 70 * H - T0 - held <= 72 * H, '확정 뒤 70시간 중 60시간 잠겨 있었으면 72시간에 안 걸림');
for (const [n, f, cl] of [['수집기', COL, 'prdEditPc'], ['클라우드', CL, 'prdEditRun']]) { const b = fnIn(f, cl, 'async function '); const i = b.indexOf('pxlRead'), j = b.indexOf("keys.forEach((k) => mark(k, 'claim'))"); const seg = b.slice(i, j);
  ok(i > 0 && i < j, n + ' — 맡기(claim)·알라딘 고치기 전에 잠금을 봄');
  ok(/status: 'pxwait'/.test(seg) && !/status: 'fail'/.test(seg), n + ' — 잠기면 pxwait(실패 아님)');
  ok(/keys\.filter\(\(k\) => k !== 'price'\)/.test(seg) && /pxSplit/.test(seg), n + ' — 다른 칸은 지금 그대로 · 값만 따로 미룸');
  ok(/done\.includes\('price'\)\) pxlNote(Pc|Cl)\(/.test(b), n + ' — 샵매니저 확인되면 기록'); }

console.log('⑤ 모든 길');
ok(/pxlNoteW\(x\.key, fromP, price/.test(ex) && /pxWait: null/.test(ex), '감시기 — 반영 성공 때 기록 · 미룸 지움');
ok(/async function vSave\(a\) \{ pxlLagW\(a\)/.test(WT), '감시기 — 공개 반영 확인마다 평균에 더함(app_settings/px_lag 한곳)');
ok(/pxlBackfillW\(\)\.catch/.test(WT) && /prd_price_actions/.test(fnIn(WT, 'pxlFill', 'async function ')) && /prd_listing_changes/.test(fnIn(WT, 'pxlFill', 'async function ')) && !/\.delete\(\)/.test(fnIn(WT, 'pxlFill', 'async function ')), '지난 기록 채우기(한 번 · 지우지 않음)');
ok(/async function pxlWakeTick/.test(CL) && /status: 'queued'/.test(fnIn(CL, 'pxlWakeTick', 'async function ')) && /setInterval\(\(\) => \{ pxlWakeTick\(\)/.test(CL), '클라우드 — 미룬 명령을 잠금 끝·풀림 때 다시 차례에');
ok((CL.match(/'queued', 'running', 'verify', 'stuck', 'pxwait'\]/g) || []).length === 3, '클라우드 — 전략·추격자가 미룬 상품에 새 명령을 겹쳐 만들지 않음');
ok(/const peLive = \(c\) => c && \['queued', 'running', 'verify', 'pxwait'\]/.test(T) && /PE_BUSY_ST = \[[^\]]*'pxwait'\]/.test(T), '웹앱 — 미룬 명령도 진행 중으로 봄');
ok(/pxlWebLocked\(\[l\.id\]/.test(fnIn(T, 'peQueue', 'async function ')), '웹앱 직접 가격 — 잠겼으면 끝 시각과 「잠금 끝난 뒤 반영」 알림');
ok(/⏳ 가격 잠금 \$\{PL\.size\}개 — 확정하면 잠금 끝난 뒤 반영/.test(T), '웹앱 수동 일괄 — 확정 창에 잠긴 수·끝 시각');
ok(/id="pm_pxl"/.test(T), '가격 반영 모니터에 평균·잠금 길이');

console.log(bad ? `\n❌ 실패 ${bad}` : '\n✅ 모두 통과'); process.exit(bad ? 1 : 0);

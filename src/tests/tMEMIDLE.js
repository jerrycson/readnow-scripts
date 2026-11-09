// tMEMIDLE — 수집기 '쉬는 때 메모리 정리'(11/08)와 숨은 수정 틀 치우기(11/09) 시험
//  ① 힙 높고 쉬면 정리 ② 일 중이면 안 함 ③ 되풀이 안 함(최소 간격) ④ 숨은 틀을 빈 쪽으로 돌린 뒤 뗌
const fs = require('fs'), path = require('path');
const P1 = path.join(__dirname, '..', 'readnow-collector.src.js'), P2 = path.join(__dirname, '..', 'readnow-collector.user.js');
const s = fs.readFileSync(fs.existsSync(P1) ? P1 : P2, 'utf8');
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
const cut = (a, endMark) => { const i = s.indexOf(a); const j = s.indexOf(endMark, i); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a); return s.slice(i, j); };
const { idleMemBusy, idleMemDecide } = new Function(cut('function idleMemBusy(E)', '/* ⟦idleMemDecide 끝⟧ */') + '; return { idleMemBusy, idleMemDecide };')();

const MIN = 60e3, now = 10 * 60 * MIN; const base = { now, ratio: 0.6, pct: 45, busy: null, since: 0, last: 0, gapMin: 30, waitMs: 60e3 };
// ① 힙 높고 쉬면 정리
ok(idleMemDecide(base).act === 'start', '① 힙 60%·일 없음 → 쉼 시작 시각을 적음');
ok(idleMemDecide({ ...base, since: now - 30e3 }).act === 'wait', '① 쉰 지 30초 → 아직 기다림');
ok(idleMemDecide({ ...base, since: now - 61e3 }).act === 'reload', '① 쉰 지 61초 → 새로고침');
ok(idleMemDecide({ ...base, ratio: 0.3, since: now - 5 * MIN }).act === 'reset', '① 힙 30%면 하지 않음');
ok(idleMemDecide({ ...base, ratio: 0.5, pct: 55, since: now - 5 * MIN }).act === 'reset', '① 기준(설정 idleMemPct 55) 아래면 하지 않음');
// ② 일 중이면 안 함 — 모든 바쁨 칸 하나하나
const E0 = { running: false, memReload: false, verReload: false, reloading: 0, paused: false, schedBusy: false, parBusy: false, restBusy: false, regBusy: false, imgBusy: false, shipPend: 0, cmdCur: null, chainBusy: false, crmBusy: false, loginBusy: false, y24Busy: false, frames: 0 };
ok(idleMemBusy(E0) === null, '② 아무 일도 없으면 바쁨 없음');
const busyCases = { running: true, memReload: true, verReload: true, reloading: Date.now(), paused: true, schedBusy: true, parBusy: true, restBusy: true, regBusy: true, imgBusy: true, shipPend: Date.now(), cmdCur: { type: 'startDelivery' }, chainBusy: true, crmBusy: true, loginBusy: true, y24Busy: true, frames: 1 };
for (const [k, v] of Object.entries(busyCases)) { const why = idleMemBusy({ ...E0, [k]: v }); const d = idleMemDecide({ ...base, busy: why, since: now - 10 * MIN }); ok(!!why && d.act === 'reset', `② ${k} → 안 함 (${why})`); }
const cmdWhy = idleMemBusy({ ...E0, cmdCur: { type: 'shipNo' } }); ok(/출고|송장/.test(cmdWhy), '② 맡긴 일(출고·송장 입력)은 이름에 출고·송장이 보임');
// 실제 정리 고리가 바쁨 칸을 모두 넘기는지(이름이 빠지면 그 일 도중 새로고침될 수 있음)
const loop = cut('let idleMemSince = 0', "safeReload('메모리 정리(쉬는 때)')");
for (const k of ['schedBusy', 'parBusy', 'RESTX.busy', 'REG_BUSY', 'REGPRE.busy', 'imgRunning', 'SHIP_PEND', '__rnCmdCur', '__rnAutoChain', '__rnCrm', "'rnu-login-busy'", "'rn-y24job'", 'rnPrdEdit_', 'rnRegAuto_', '__rnPaused', '__rnReloading']) ok(loop.includes(k), `② 정리 고리가 ${k}를 봄`);
// ③ 되풀이 안 함
ok(idleMemDecide({ ...base, since: now - 5 * MIN, last: now - 2 * MIN }).act === 'gap', '③ 2분 전에 정리했으면 다시 하지 않음(미룸)');
ok(idleMemDecide({ ...base, since: now - 5 * MIN, last: now - 29 * MIN }).act === 'gap', '③ 29분 전 → 아직 미룸');
ok(idleMemDecide({ ...base, since: now - 5 * MIN, last: now - 31 * MIN }).act === 'reload', '③ 31분 지나면 다시 정리');
ok(idleMemDecide({ ...base, since: now - 5 * MIN, last: now - 31 * MIN, gapMin: 60 }).act === 'gap', '③ 간격은 설정(idleMemGapMin)으로 바뀜');
ok(/GM_setValue\('rnu-idlemem-last', Date\.now\(\)\)[^\n]*safeReload\('메모리 정리\(쉬는 때\)'\)/.test(loop + "safeReload('메모리 정리(쉬는 때)')"), '③ 새로고침 직전에 이 PC 공용 저장소에 정리 시각을 적음(새 탭도 봄)');
ok(/memReload = true;/.test(loop), '③ 한 탭에서 두 번 부르지 않음(memReload)');
ok(loop.includes('메모리 정리(쉬는 때) 미룸') && s.includes("log(`메모리 정리(쉬는 때): 메모리"), '③ 기록 줄: 정리·미룸 둘 다 남김');
// 시뮬레이션: 새로고침 직후에도 힙이 높은 PC — 3시간 동안 30초마다 보면 정리는 6번 이하(30분 간격)
{ let t = 0, since = 0, last = 0, n = 0; for (t = 0; t < 180 * MIN; t += 30e3) { const d = idleMemDecide({ ...base, now: t + 1e9, since, last }); if (d.act === 'reset') since = 0; else if (d.act === 'start') since = t + 1e9; else if (d.act === 'reload') { n++; last = t + 1e9; since = 0; } } ok(n >= 5 && n <= 6, `③ 늘 힙 높은 PC 3시간 시뮬레이션: 정리 ${n}번(되풀이 고리 없음)`); }

// ④ 숨은 틀 치우기
const { peFrameDispose, peFrameSweep } = new Function('document', cut('function peFrameDispose(fr)', '/* ⟦peFrameSweep 끝⟧ */') + '; return { peFrameDispose, peFrameSweep };')(globalThis.__fakeDoc = { list: [], querySelectorAll() { return this.list; } });
const mkFrame = (id, loadMs) => { const inner = { src: 'x', removed: false }; const f = { id, src: '/scm/wrecord.aspx', removed: false, removedAt: null, srcAtRemove: null, l: null, inner, contentWindow: { onbeforeunload: () => 'x', onunload: () => 1 }, contentDocument: { querySelectorAll: () => [inner] },
  addEventListener(t, cb) { if (t === 'load') this.l = cb; }, remove() { this.removed = true; this.srcAtRemove = this._s; } }; Object.defineProperty(f, 'src', { get() { return this._s; }, set(v) { this._s = v; if (v === 'about:blank' && loadMs != null) setTimeout(() => f.l && f.l(), loadMs); } }); f._s = '/scm/wrecord.aspx'; return f; };
(async () => {
  const f1 = mkFrame('rnPrdEdit_a', 20); peFrameDispose(f1); ok(!f1.removed, '④ 바로 떼지 않음(빈 쪽이 열릴 때까지)'); await new Promise((r) => setTimeout(r, 200));
  ok(f1.removed && f1.srcAtRemove === 'about:blank', '④ 빈 쪽(about:blank)으로 돌린 뒤 뗌'); ok(f1.inner.src === 'about:blank', '④ 속 틀(사진 창)도 빈 쪽으로'); ok(f1.contentWindow.onbeforeunload === null && f1.contentWindow.onunload === null, '④ 떼기 전에 화면 쪽 처리기를 끊음');
  const f2 = mkFrame('rnPrdEdit_b', null); peFrameDispose(f2); await new Promise((r) => setTimeout(r, 1700)); ok(f2.removed, '④ 빈 쪽 load가 안 와도 1.5초 뒤엔 뗌');
  const f3 = mkFrame('rnPrdEdit_c', 5); let n0 = 0; f3.remove = function () { n0++; this.removed = true; }; peFrameDispose(f3); peFrameDispose(f3); await new Promise((r) => setTimeout(r, 1700)); ok(n0 === 1, '④ 두 번 불러도 한 번만 뗌');
  // 쓸기: 2분 넘고 쓰는 중 아닌 것만
  const T = Date.now(); const old = mkFrame('rnPrdEdit_' + (T - 5 * MIN).toString(36), 5), live = mkFrame('rnPrdEdit_' + (T - 5 * MIN).toString(36), 5), fresh = mkFrame('rnPrdEdit_' + (T - 30e3).toString(36), 5); live.__rnLive = 1;
  globalThis.__fakeDoc.list = [old, live, fresh]; const n = peFrameSweep(T); await new Promise((r) => setTimeout(r, 200));
  ok(n === 1 && old.removed && !live.removed && !fresh.removed, '④ 쓸기: 쓰고 남은 2분 넘은 틀만 뗌(쓰는 중·새 틀은 그대로)');
  // 코드 연결: prdEditPc가 실제로 치우기를 씀
  const pe = cut('async function prdEditPc(ref, v, id)', "window.__rnPrdEdit = (ref, v, id)");
  ok(/finally \{ fr\.__rnLive = 0; setTimeout\(\(\) => peFrameDispose\(fr\), 3000\); \}/.test(pe), '④ prdEditPc 수정 틀: 끝나면 3초 뒤 치우기(빈 쪽 → 뗌)');
  ok(/setTimeout\(\(\) => peFrameDispose\(f2\), 8000\)/.test(pe), '④ prdEditPc 사진 창: 치우기로 뗌');
  ok(/fr\.__rnLive = 1;/.test(pe), '④ 쓰는 동안 표시(__rnLive) — 쓸기가 건드리지 않음');
  ok(!/f2\.remove\(\)|fr\.remove\(\)/.test(pe), '④ prdEditPc에 빈 쪽 없이 바로 떼는 곳이 남지 않음');
  ok(s.includes('const clean = () => setTimeout(() => peFrameDispose(fr), keepMs);'), '④ 자동 등록 틀도 같은 치우기');
  console.log(bad ? `❌ tMEMIDLE 실패 ${bad}개` : '✓ tMEMIDLE 모두 통과'); process.exit(bad ? 1 : 0);
})();

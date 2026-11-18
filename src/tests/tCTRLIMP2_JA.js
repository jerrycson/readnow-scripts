// tCTRLIMP2_JA — (ctrlimp2 · 설계 CTRLDES2 1.4 (가)(나)·1.7·1.8 ①②·3.2 1·8 「자」 · 정범님 11/18 23:44) 🗼 묶음 관제창 판 자 — 값 주인 · 상태 띠 · 켜기 전 「오늘 최대 내림」
//  ① 글: 새 이름 한 번 선언 · 브라우저 창 없음 · 쓰기·새 읽기 없음 · 카드·관제창 머리·누름에 걸림 · 설명서 문단
//  ② vm: 값 주인 차례 표 13줄(설계 1.7) 하나씩 · 겹침·배정 표 모름 · 상태 띠(덜 셈·원장 없음·못 읽음) · 오늘 최대 내림(한도 넘음 → 결정 대기 · 뺄 것 · 바로 반영 그룹 뺌)
// 실행: node tCTRLIMP2_JA.js · 시험 자료에 손님·판매자 실명 없음 · 실제 가격 바꾸기·확정 실행 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const m0 = T.indexOf('/* (판 자 · ctrlimp2'), m1 = T.indexOf('/* (판 아 · ctrlimp2'); const A = m0 > 0 && m1 > m0 ? T.slice(m0, m1) : '';
console.log('① 글');
ok(!!A, '판 자 덩이가 있음(판 아 앞)');
{ const names = ['CTRL_OWNR', 'ctrlStratOwn', 'ctrlNoLoss', 'ctrlOwnerOf', 'ctrlOwnZ', 'ctrlOwnChip', 'ctrlFenceSum', 'ctrlOwnBar', 'ctrlMaxDrop', 'ctrlMaxDropHtml'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup); }
ok(!/\b(alert|confirm|prompt)\s*\(/.test(A), '브라우저 창 없음');
ok(!/db\.collection|\.set\(|\.update\(|batchSave|runTransaction|\.get\(\)/.test(A), '쓰기·새 읽기 없음(원장은 fenceLine이 이미 읽는 것 · ⚡ 배정은 이미 듣는 것)');
ok(/fenceLine\('ctrl', false\)/.test(A) && /stratOwn\(\)/.test(A) && /ML\.fenceLock\(/.test(A) && /ML\.fenceSum\(/.test(A), '있는 함수(fenceLine·stratOwn·fenceLock·fenceSum)를 부름 — 새 계산기 없음');
ok(/ctrlOwnChip\(P, it\)/.test(T) && /\$\{stl\}\$\{\(\(\) => \{ try \{ return typeof ctrlOwnBar === 'function' \? ctrlOwnBar\(P\) : ''; \} catch \(e\) \{ return ''; \} \}\)\(\)\}/.test(T) && /if \(d\.cmaxd\) \{ P\.maxd = d\.cmaxd === '1'; return ctrlPaint\(\); \}/.test(T), '카드·관제창 머리·누름에 걸림');
ok(/값 주인 · 상태 띠 \(판 자\)/.test(T), '설명서 문단');

console.log('② vm');
const G = { g1: { id: 'g1', name: '시험 그룹 1', watch: { on: true, apply: 'approve' } }, g2: { id: 'g2', name: '시험 그룹 2', watch: {} }, g3: { id: 'g3', name: '시험 그룹 3', watch: { on: true, apply: 'auto', guardPct: 10 } } };
const LOCK = new Set(); const FL = new Map(); let MS = null; let OWN = new Map(); let fenceCalls = 0; const NOW = Date.parse('2026-11-19T03:00:00Z');
const ML = { fenceLock: (l) => FL.get(l.id) || null, fenceLimitOf: (nw) => (nw ? { ok: true, limit: +nw.dayLoss } : { ok: false }), fenceSum: (L) => ({ done: +L.done || 0, held: +L.held || 0, ops: +L.ops || 0 }) };
const ctx = { console, Map, Set, Math, JSON, Object, String, Number, Array, Date, isFinite, RegExp, window: { ReadnowML: ML },
  S: { strat: { doc: { as: {} }, items: new Map() }, engF: null, _bkfRun: false },
  num: (n) => String(n), won: (n) => `${n}원`, esc: (s) => String(s), kMs: (v) => Date.parse(v) || 0, kstDay: (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10),
  bkfGl: (id) => G[id] || null, plkOn: (k) => LOCK.has(k), ctrlMemoSt: () => MS, stratOwn: () => OWN, ctrlKids: () => [G.g1, G.g2, G.g3],
  fenceLine: () => { fenceCalls++; return ''; }, ctrlPaint: () => {}, setTimeout: () => 1 };
vm.createContext(ctx);
vm.runInContext(A + '\n;this.__M = { ctrlOwnerOf, ctrlOwnBar, ctrlMaxDrop, ctrlMaxDropHtml, ctrlOwnChip };', ctx);
const M = ctx.__M; const Z = () => ({ now: NOW, own: OWN });
let seq = 0; const it = (o) => { o = o || {}; seq++; const id = 'p' + seq; const l = { id, title: '시험 책 ' + seq, price: 10000, status: '판매중', qty: 1, ...(o.l || {}) }; const k = 'aladin_' + id;
  const C = { g: G[o.gid || 'g2'], st: { picks: {}, decided: {}, ...(o.st ? o.st(k) : {}) }, SRV: new Map(o.srv ? [[k, o.srv]] : []), sold: { set: new Set(o.sold ? [k] : []) } };
  return { id: 'r' + seq, k, gid: o.gid || 'g2', x: { l, target: o.target === undefined ? 9000 : o.target, ...(o.x || {}) }, C }; };
const own = (r) => r && `${r.o}/${r.n}`;
// 1.7 표 13줄
{ const r = M.ctrlOwnerOf(it({ sold: true, gid: 'g1' }), Z()); ok(own(r) === 'none/1', '1 팔림 → ⏸ 아무도(감시 그룹이라도)', r); }
{ const r = M.ctrlOwnerOf(it({ l: { status: '품절' } }), Z()); ok(own(r) === 'none/1', '1 판매 중 아님 → ⏸', r); const r2 = M.ctrlOwnerOf(it({ l: { qty: 0 } }), Z()); ok(own(r2) === 'none/1', '1 수량 0 → ⏸', r2); }
{ const r = M.ctrlOwnerOf(it({ gid: 'g1', srv: { approvalState: 'applying' } }), Z()); ok(own(r) === 'none/2' && /반영 중/.test(r.t), '2 반영 중 → 기다림', r); }
{ const r = M.ctrlOwnerOf(it({ gid: 'g1', st: (k) => ({ picks: { [k]: { price: 9000 } } }) }), Z()); ok(own(r) === 'human/3', '3 결정 대기에 넣음 → 👤(감시보다 먼저)', r);
  const a = it({ gid: 'g1' }); LOCK.add(a.k); ok(own(M.ctrlOwnerOf(a, Z())) === 'human/3', '3 가격 잠금 → 👤');
  const b = it({ gid: 'g1', l: { editAt: new Date(NOW - 5 * 36e5).toISOString(), editBy: '정범' } }); ok(own(M.ctrlOwnerOf(b, Z())) === 'human/3', '3 48시간 안 사람이 고침 → 👤');
  const c = it({ gid: 'g1', l: { editAt: new Date(NOW - 5 * 36e5).toISOString(), editBy: 'strategy' } }); ok(own(M.ctrlOwnerOf(c, Z())) === 'watch/10', '전략이 고친 것은 사람 아님');
  const d = it({ st: (k) => ({ decided: { [k]: { price: 9500, at: new Date(NOW - 2 * 864e5).toISOString() } } }) }); ok(own(M.ctrlOwnerOf(d, Z())) === 'human/3', '3 7일 안 확정 → 👤');
  const e = it({ st: (k) => ({ decided: { [k]: { price: 9500, at: new Date(NOW - 2 * 864e5).toISOString(), reo: { at: 'x' } } } }) }); ok(own(M.ctrlOwnerOf(e, Z())) !== 'human/3', '🔁 선택 대기로 옮긴 확정은 사람 값 아님');
  const f = it(); ctx.S.strat.items.set(f.x.l.id, { hold: { at: '2026-11-18' } }); ok(own(M.ctrlOwnerOf(f, Z())) === 'human/3', '3 ⚡ 값을 ↩ 되돌림 → 👤'); }
{ const a = it({ gid: 'g1' }); FL.set(a.x.l.id, { kind: 'new', why: '등록 30일' }); const r = M.ctrlOwnerOf(a, Z()); ok(own(r) === 'watch/10' && /등록 3개월/.test(r.tip), '4 연구 잠금 — 🛰 감시는 통과(표시만)', r);
  const b = it(); FL.set(b.x.l.id, { kind: 'human' }); OWN = new Map([[b.x.l.id, { k: 'decay', t: 'i' }]]); const r2 = M.ctrlOwnerOf(b, Z()); ok(own(r2) === 'strat/11' && /잠금이라 실행 안 됨/.test(r2.t), '4 연구 잠금 — ⚡은 실행 안 됨으로', r2); OWN = new Map(); }
{ MS = { k: 'hold', t: '📝 메모로 판정 세움(지금 값 그대로)' }; const r = M.ctrlOwnerOf(it({ gid: 'g1' }), Z()); ok(own(r) === 'none/5' && /메모/.test(r.t), '5 메모로 판정 세움 → ⏸', r);
  MS = { k: 'used', t: '📝 메모 규칙 적용: 바닥' }; const r2 = M.ctrlOwnerOf(it({ gid: 'g1' }), Z()); ok(own(r2) === 'watch/10' && /메모 규칙 범위/.test(r2.tip), '5 메모 규칙 적용 — 주인은 그대로 · 범위 표시', r2); MS = null; }
{ const r = M.ctrlOwnerOf(it({ gid: 'g1', x: { perFloor: { from: 8000, to: 8500 } } }), Z()); ok(own(r) === 'watch/10' && /바닥 8500원/.test(r.tip), '6 하한선 — 주인은 그대로 · 바닥 표시', r); }
{ const r = M.ctrlOwnerOf(it({ gid: 'g1' }), Z()); ok(/주인 그룹 시험 그룹 1/.test(r.tip), '7 묶음 경계 — 주인 그룹 표시', r); }
{ const r = M.ctrlOwnerOf(it({ gid: 'g1', x: { per: { watch: 'off' } } }), Z()); ok(own(r) === 'watch/10' && /판 카부터/.test(r.tip), '8 📌 개별 감시 끔 — 실행이 따르기 전이라 표시만', r); }
{ const r = M.ctrlOwnerOf(it({ gid: 'g1', srv: { strat: { active: true, name: 'shadow' } } }), Z()); ok(own(r) === 'chase/9', '9 🎯 추격 중 → 🎯(감시보다 먼저)', r);
  const r2 = M.ctrlOwnerOf(it({ gid: 'g1', srv: { strat: { active: true, nextAt: NOW - 1000 } } }), Z()); ok(own(r2) === 'watch/10', '추격 끝난 때가 지났으면 🎯 아님', r2); }
{ const r = M.ctrlOwnerOf(it({ gid: 'g3' }), Z()); ok(own(r) === 'watch/10' && /바로 반영\(한도 10%\)/.test(r.t), '10 🛰 바로 반영 그룹 → 🛰 · 한도', r); const r2 = M.ctrlOwnerOf(it({ gid: 'g1' }), Z()); ok(/결정 대기/.test(r2.t), '10 🛰 결정 대기 그룹', r2); }
{ const a = it(); OWN = new Map([[a.x.l.id, { k: 'sole', t: 'g' }]]); const r = M.ctrlOwnerOf(a, Z()); ok(own(r) === 'strat/11' && /무손해 모드라 관찰만/.test(r.t) && /그룹 배정/.test(r.t), '11 ⚡ 배정(감시 없음) → ⚡ · 무손해면 관찰만', r);
  const b = it({ gid: 'g1' }); OWN = new Map([[b.x.l.id, { k: 'sole', t: 'i' }]]); const r2 = M.ctrlOwnerOf(b, Z()); ok(own(r2) === 'watch/10' && /⚡ 배정도 걸림/.test(r2.tip), '감시와 ⚡ 겹침 → 🛰 · 겹침 표시', r2); OWN = new Map(); }
{ const r = M.ctrlOwnerOf(it(), Z()); ok(own(r) === 'none/12' && /추천만/.test(r.t), '12 그룹 조건 추천만 → ⏸', r); }
{ const r = M.ctrlOwnerOf(it({ target: null }), Z()); ok(own(r) === 'none/13', '13 추천도 없음 → ⏸', r); }
{ const r = M.ctrlOwnerOf(it(), { now: NOW, own: null }); ok(/배정 표를 아직 못 읽음/.test(r.tip), '⚡ 배정 표를 못 읽었으면 그렇다고 적음', r); }
ok(M.ctrlOwnerOf({ x: null }, Z()) === null && M.ctrlOwnChip({}, { x: { l: {} }, moved: 'sel' }) === '', '불러오지 않은 줄·옮겨진 줄은 주인 칸 없음');

console.log('③ 상태 띠');
const rows = [it({ gid: 'g1' }), it({ gid: 'g1' }), it({ gid: 'g2' }), it({ gid: 'g3' }), it({ gid: 'g2', st: (k) => ({ picks: { [k]: {} } }) })];
const P = { fid: 'f1', rows, keys: rows.map((r) => r.k).concat(['aladin_x1', 'aladin_x2']), pos: 5 };
{ const h = M.ctrlOwnBar(P); ok(/👤 1 · 🛰 3 · 🎯 0 · ⚡ 0 · ⏸ 1/.test(h), '값 주인 수', h); ok(/5\/7 셈/.test(h) && !/<b>3<\/b>/.test(h), '다 세기 전엔 「○/○ 셈」·굵게 안 함', h); ok(/원장 읽는 중/.test(h) && fenceCalls === 1, '원장이 없으면 fenceLine으로 읽기를 맡김(새 읽기 없음)', fenceCalls);
  ok(/감시 켜진 그룹 2\/3 · 바로 반영 1 · 결정 대기 1/.test(h), '🛰 감시 켜진 그룹 수', h); }
ctx.S.engF = { at: NOW, day: ctx.kstDay(Date.now()), L: { done: 1200, held: 300, ops: 4400 }, nw: { dayLoss: 18000 }, cf: {} };
{ const P2 = { ...P, keys: rows.map((r) => r.k) }; const h = M.ctrlOwnBar(P2); ok(/<b>3<\/b>/.test(h) && !/셈\(불러온/.test(h), '다 세면 굵게', h); ok(/감시·추격자가 내린 몫 4400원/.test(h) && /연구 하루 한도 18000원 · 오늘 1200원 · 진행 중 300원 · 남은 16500원 \(무손해 모드/.test(h), '감시·추격자 몫과 연구 한도는 따로', h); }
ctx.S.engF = { at: NOW, day: ctx.kstDay(Date.now()), L: null, nw: null, cf: { noLossMode: false } }; { const h = M.ctrlOwnBar(P); ok(/오늘 원장 없음/.test(h) && /연구 하루 한도를 못 받음/.test(h), '원장 없음·한도 못 받음 표시', h); }
ctx.S.engF = { at: NOW, day: ctx.kstDay(Date.now()), err: 'permission-denied' }; { const h = M.ctrlOwnBar(P); ok(/원장을 못 읽음\(permission-denied\)/.test(h), '원장 못 읽음 표시', h); }
{ const a = it({ gid: 'g1' }); OWN = new Map([[a.x.l.id, { k: 'sole', t: 'i' }]]); ctx.S.strat.doc = { as: {} }; const h = M.ctrlOwnBar({ ...P, rows: [a], keys: [a.k] }); ok(/겹침 — 감시와 ⚡ 배정이 같이 걸린 상품 1/.test(h), '겹침 수', h); OWN = new Map(); }

console.log('④ 켜기 전 「오늘 최대 내림」');
{ const R = [it({ gid: 'g2', target: 9000 }), it({ gid: 'g2', target: 8000 }), it({ gid: 'g1', target: 9800 }), it({ gid: 'g2', target: 11000 }), it({ gid: 'g3', target: 5000 }), it({ gid: 'g2', target: 7000, st: (k) => ({ picks: { [k]: {} } }) }), it({ gid: 'g2', target: 7000, srv: { strat: { active: true } } }), it({ gid: 'g2', target: 7000, sold: true })];
  const Q = { fid: 'f1', rows: R, keys: R.map((r) => r.k).concat(['aladin_more']), pos: R.length };
  const D = M.ctrlMaxDrop(Q); ok(D.sum === 1000 + 200 && D.n === 2, '한도 안 내림만 합(9000·9800) — 오르는 것 뺌', D); ok(D.wait === 1 && D.waitSum === 2000, '한도 15% 넘는 것(−20%)은 결정 대기로 감', D); ok(D.skip === 3, '사람 값·🎯 추격·팔림은 뺌', D);
  ok(!R.slice(4, 5).some((r) => D.top.some((o) => o.it === r)), '이미 바로 반영인 그룹은 셈 밖'); ok(D.top[0].d === 1000 && D.top[1].d === 200, '가장 크게 내리는 차례', D.top.map((o) => o.d)); ok(D.all === false, '덜 셈 표시 자료', D.all);
  const h = M.ctrlMaxDropHtml(Q); ok(/바로 내려갈 몫 합 <b>1200원<\/b>\(2개\)/.test(h) && /덜 셈/.test(h) && /켜지 않음\(읽기만\)/.test(h), '미리 보기 글(켜지 않음)', h);
  const D2 = M.ctrlMaxDrop(Q, ['g3']); ok(D2.n === 0 && D2.wait === 1, '그룹을 골라 셀 수 있음(판 타가 씀) — 한도 10% 넘음', D2); }

console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);

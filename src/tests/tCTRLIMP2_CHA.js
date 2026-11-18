// tCTRLIMP2_CHA — (ctrlimp2 · 설계 CTRLDES2 1.5·4 「차」 · 판 바 합침 · 정범님 11/18 23:44) 🗼 묶음 관제창 판 차 — 🔭 감시·전략 카드 · ctrlPeek 미리 보기 · 전략 성적표 한 줄
//  ① 글: 새 이름 한 번 선언 · 브라우저 창 없음 · 쓰기·새 읽기 없음 · 판정 엔진을 그대로 부름 · stratCtx 감시 채움 · 카드·누름·설명서
//  ② vm(진짜 판정 엔진 readnow-pricing-core.js · readnow-ml-core.js): 미리 보기 값 = 엔진이 같은 입력으로 낸 값(20개) · 🛰 감시가 맡은 상품은 ⚡ 전략이 「막힘」
//     · 감시 판정이 클라우드 규칙과 같음 · 다음 한 수 · 가장 센 하한 · 하루 손해 한도(셈만 — 원장 안 바뀜)
// 실행: node tCTRLIMP2_CHA.js · 시험 자료에 손님·판매자 실명 없음(판매자A) · 실제 가격 바꾸기·확정 실행 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const DIR = path.dirname(APP);
const core = (n) => [path.join(DIR, n), path.resolve(__dirname, '..', n), path.resolve(__dirname, '..', '..', n), path.resolve(__dirname, '..', '..', 'src', n)].find((x) => fs.existsSync(x));
const m0 = T.indexOf('/* (판 차 · ctrlimp2'), m1 = T.indexOf('/* (판 자 · ctrlimp2'), m2 = T.indexOf('/* (판 아 · ctrlimp2');
const A = m0 > 0 && m1 > m0 ? T.slice(m0, m1) : ''; const AJ = m1 > 0 && m2 > m1 ? T.slice(m1, m2) : '';
console.log('① 글');
ok(!!A && !!AJ, '판 차 덩이가 있음(판 자 앞)');
{ const names = ['CTRL_WAP', 'ctrlWatchOf', 'ctrlPeek', 'ctrlPeekPerf', 'ctrlPeekBox'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup); }
ok(!/\b(alert|confirm|prompt)\s*\(/.test(A), '브라우저 창 없음');
ok(!/db\.collection|\.set\(|\.update\(|batchSave|runTransaction|\.get\(\)|fenceSettle|fenceStamp/.test(A), '쓰기·새 읽기 없음(추격 기록은 📊 성적표가 받은 것만)');
ok(/CH\.judge\(In\)/.test(A) && /ML\.stratDecide\(sa\.k, ctx/.test(A) && /ML\.stratGuard\(d, ctx/.test(A) && /ML\.fenceTry\(/.test(A) && /ML\.stratFloor/.test(A) && /PR\.stepDown\(/.test(A) && /CH\.perf\(/.test(A), '판정 엔진(judge·stratDecide·stratGuard·fenceTry·stratFloor·stepDown·perf)을 그대로 부름 — 새 계산기 없음');
ok(/const watch = \(\(\) => \{ try \{ return typeof ctrlWatchOf === 'function' \? !!ctrlWatchOf\(l\)\.on : false; \} catch \(e\) \{ return false; \} \}\)\(\);/.test(T) && /sibSt, st, cost, watch, busy,/.test(T) && !/cost, watch: false, busy/.test(T), 'stratCtx가 감시 여부를 채움(예전 watch: false 고침)');
ok(/data-cpeek="\$\{esc\(it\.id\)\}"/.test(T) && /P\.peek && P\.peek\.has\(it\.id\) \? \(\(\) => \{ try \{ return typeof ctrlPeekBox === 'function'/.test(T) && /if \(d\.cpeek\) \{ P\.peek = P\.peek \|\| new Set\(\);/.test(T), '카드 단추·펼침·누름에 걸림(실패해도 카드는 그대로)');
ok(/🔭 감시·전략 미리 보기 \(판 차\)/.test(T), '설명서 문단');
{ const cl = fs.readFileSync([path.join(DIR, 'cloud', 'index.js'), path.resolve(__dirname, '..', '..', 'cloud', 'index.js')].find((x) => fs.existsSync(x)), 'utf8');
  ok(/\['approved', 'applying', 'manual', 'hold', 'unhold'\]\.includes\(dec\.approvalState\) && Date\.now\(\) - Date\.parse\(\(dec\.approval && dec\.approval\.at\) \|\| dec\.at \|\| 0\) < 72 \* 3600e3/.test(cl) && /dec\.approval\.decision === 'batch' && Date\.now\(\) - Date\.parse\(dec\.approval\.at \|\| 0\) < 7 \* 864e5/.test(cl), '클라우드 ⚡ 실행의 감시 규칙이 옮긴 것과 같은 모양(72시간·7일·비교군)');
  ok(/const CTRL_WAP = \['approved', 'applying', 'manual', 'hold', 'unhold'\];/.test(A), '웹앱 쪽 같은 결정 상태 다섯'); }

console.log('② vm (진짜 판정 엔진)');
const PR = require(core('readnow-pricing-core.js')); const ML = require(core('readnow-ml-core.js')); const CH = PR.Chase;
ok(!!(CH && CH.judge && ML.stratDecide && ML.fenceTry), '판정 엔진을 불러옴');
const NOW = Date.parse('2026-11-19T03:00:00Z'); const ISO = new Date(NOW).toISOString();
const G = { g1: { id: 'g1', name: '시험 그룹 1', watch: { on: true, apply: 'approve' }, lastKeys: ['aladin_p9'] }, g2: { id: 'g2', name: '시험 그룹 2', watch: {} }, g3: { id: 'g3', name: '시험 그룹 3', watch: { on: true, apply: 'auto', guardPct: 10 } } };
let OWN = new Map(); const LED0 = { done: 0, x: {} };
const ctx = { console, Map, Set, Math, JSON, Object, String, Number, Array, Date, isFinite, RegExp, window: { ReadnowML: ML, ReadnowPricing: PR, ReadnowChase: CH },
  S: { strat: { doc: { as: {} }, items: new Map() }, prBatches: Object.values(G), prDec: null, prCfg: { chaseEng: null }, engF: null, pmatch: new Map(), ordersLoaded: false },
  num: (n) => String(n), won: (n) => `${n}원`, esc: (s) => String(s), kMs: (v) => Date.parse(v) || 0, kstDay: (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10),
  bkfGl: (id) => G[id] || null, plkOn: () => false, ctrlMemoSt: () => null, stratOwn: () => OWN, ctrlKids: () => Object.values(G), wgStratOf: () => null, fenceLine: () => '', ctrlPaint: () => {}, setTimeout: () => 1 };
vm.createContext(ctx);
vm.runInContext(A + AJ + '\n;this.__M = { ctrlWatchOf, ctrlPeek, ctrlPeekBox, ctrlPeekPerf, ctrlOwnerOf };', ctx);
const M = ctx.__M; const Z = () => ({ now: NOW, own: OWN });
const sctx = (l) => ({ l, m: null, sig: null, sib: [], sibSt: {}, st: {}, cost: null, watch: false, busy: false, rarity: null, ignore: null, lock: null, now: NOW });
let seq = 0; const it = (o) => { o = o || {}; seq++; const id = o.id || 'p' + seq; const l = { id: 'aladin_' + id, title: '시험 책 ' + seq, price: 10000, status: '판매중', qty: 1, grade: '최상', listingId: 'L' + seq, registeredAt: '2026-01-01T00:00:00Z', ...(o.l || {}) }; const k = l.id;
  const C = { g: G[o.gid || 'g2'], st: { picks: {}, decided: {} }, SRV: new Map(o.dec ? [[k, o.dec]] : []), sold: { set: new Set() } };
  return { id: 'r' + seq, k, gid: o.gid || 'g2', x: { l, target: o.target === undefined ? 9000 : o.target, reasons: ['시험 까닭'], ...(o.x || {}) }, C }; };
const peek = (row, o) => M.ctrlPeek(row, { now: NOW, Z: Z(), ctxOf: sctx, cfg: {}, ...(o || {}) });

// 감시 판정 — 클라우드 규칙 그대로
{ const W = (dec, l) => M.ctrlWatchOf(l || { id: 'aladin_x' }, dec, { now: NOW, groups: Object.values(G) });
  ok(W({ watch: { gid: 'g1' } }).on === true, '켜진 감시 그룹의 결정 → 감시가 맡음');
  ok(W({ watch: { gid: 'g2' } }).on === false, '꺼진 그룹의 결정 → 아님');
  ok(W({ approvalState: 'manual', approval: { at: new Date(NOW - 10 * 3600e3).toISOString() } }).on === true && W({ approvalState: 'manual', approval: { at: new Date(NOW - 80 * 3600e3).toISOString() } }).on === false, '결정·반영 72시간 안만');
  ok(W({ ctrlOf: { gid: 'g2' } }).on === true, '비교군 → 맡음');
  ok(W({ approval: { decision: 'batch', at: new Date(NOW - 6 * 864e5).toISOString() } }).on === true && W({ approval: { decision: 'batch', at: new Date(NOW - 8 * 864e5).toISOString() } }).on === false, '일괄 확정 7일 안만');
  ok(W({ approvalState: 'done' }).on === false && W({}).on === false, '반영 끝·빈 결정 → 아님');
  ok(W(null, { id: 'aladin_p9' }).on === true && W(null, { id: 'aladin_p9' }).guess === true && W(null, { id: 'aladin_zz' }).on === false, '결정 문서 전 → 켜진 그룹 목록으로 봄'); }

// 🛰 감시가 맡은 상품 — ⚡ 전략은 「막힘」 (설계 판 차 시험)
{ const row = it({ id: 'p9', gid: 'g1', l: { price: 800 }, target: 800 }); OWN = new Map([[row.x.l.id, { id: 'a1', k: 'floor', t: 'g', tid: 'sg1' }]]);
  const K = peek(row); ok(K.owner === 'watch', '주인 = 🛰 감시', K.ownerT);
  ok(K.s && K.s.to != null && K.s.blocked === true && K.s.no.some((s) => /가격 감시 묶음·결정이 이 상품을 맡고 있음/.test(s)), '⚡ 전략 값은 있으나 「막힘」 — 감시가 맡음(stratGuard 그대로)', K.s);
  const row2 = it({ gid: 'g2', l: { price: 800 }, target: 800 }); OWN = new Map([[row2.x.l.id, { id: 'a1', k: 'floor', t: 'g', tid: 'sg1' }]]);
  const K2 = peek(row2); ok(K2.owner === 'strat' && K2.s && K2.s.blocked === false && K2.s.to > 800, '감시 없는 같은 상품 → ⚡ 전략이 값을 올림(막힘 아님)', K2.s);
  const html = M.ctrlPeekBox({}, row); ok(/🔭 지금 실행되면/.test(html) && /⚡ 전략은 이 상품을 건드리지 않음/.test(html) && /⛔/.test(html), '카드 글: 감시가 맡아 ⚡ 막힘 표시'); }

// 미리 보기 값 = 엔진이 같은 입력으로 낸 값 (20개)
{ let same = 0, n = 0; const POL = [null, { on: true, anon: { rules: { follow: true } } }];
  for (let i = 0; i < 10; i++) { const cur = 8000 + i * 900, chP = cur - 100 - i * 37; const dec = { chaser: { sellerCode: 'S' + i, name: '판매자A', price: chP, grade: '최상' }, strat: i % 3 ? null : { active: true, name: 'yield', sc: 'S' + i, phase: 'start' }, floor: i % 2 ? 6000 : 0, start: cur + 500 };
    const row = it({ gid: i % 2 ? 'g3' : 'g2', l: { price: cur }, target: cur - 300, dec }); OWN = new Map();
    const K = peek(row, { policy: POL[i % 2], dec }); n++;
    const In = { policy: POL[i % 2], groupStrat: { name: 'yield' }, chaser: dec.chaser, state: dec.strat, now: ISO, cur, base: cur - 300, yieldT: cur - 300, floor: dec.floor, start: dec.start, page1: [], grade: '최상', tier: null };
    const r = CH.judge(In); if (K.c && K.c.to === r.t && JSON.stringify(K.c.r.reasons) === JSON.stringify(r.reasons)) same++; else console.log('    🎯 다름', i, K.c && K.c.to, r.t); }
  for (let i = 0; i < 10; i++) { const cur = 600 + i * 70; const row = it({ gid: 'g2', l: { price: cur, editAt: i === 4 ? new Date(NOW - 3600e3).toISOString() : '' }, target: null }); const a = { id: 'a' + i, k: i % 2 ? 'floor' : 'decay', t: 'i', tid: row.x.l.id }; OWN = new Map([[row.x.l.id, a]]);
    const K = peek(row); n++; const c = { ...sctx(row.x.l), watch: false }; const d = ML.stratDecide(a.k, c, {}, {}); const g = ML.stratGuard(d, c, {});
    const exp = d.act === 'price' ? d.to : null; const expNo = (g.no || []).filter((s) => s !== '할 일 없음');
    if (K.s && K.s.to === exp && JSON.stringify(K.s.no.slice(0, expNo.length)) === JSON.stringify(expNo)) same++; else console.log('    ⚡ 다름', i, K.s, exp, expNo); }
  ok(same === n && n === 20, `미리 보기 값 = 판정 엔진 값 (${same}/${n})`); }

// 🎯 주인 · 다음 한 수 · 가장 센 하한
{ const dec = { chaser: { sellerCode: 'S1', name: '판매자A', price: 9400, grade: '최상' }, strat: { active: true, name: 'match', sc: 'S1', phase: 'match', nextAt: new Date(NOW + 3 * 3600e3).toISOString() }, floor: 9000, start: 10000 };
  const row = it({ gid: 'g2', l: { price: 9400 }, target: 9500, dec, x: { perFloor: { to: 9100 } } }); OWN = new Map();
  const K = peek(row, { dec, policy: null }); ok(K.owner === 'chase', '주인 = 🎯 추격자', K.ownerT);
  const In = { policy: null, groupStrat: { name: 'match' }, chaser: dec.chaser, state: dec.strat, now: ISO, cur: 9400, base: 9500, yieldT: 9500, floor: 9000, start: 10000, page1: [], grade: '최상', tier: null };
  const r = CH.judge(In); ok(K.to === r.t, '맨 윗값 = judge 값', [K.to, r.t]);
  if (r.active) { const p2 = PR.stepDown(r.t); const r2 = CH.judge({ ...In, chaser: { ...dec.chaser, price: p2 }, state: r.state, cur: r.t, now: r.nextAt }); ok(K.next.length === 1 && K.next[0].chP === p2 && K.next[0].to === r2.t, '다음 한 수 = 한 단위 아래로 따라온다고 보고 judge 한 번 더', [K.next, p2, r2.t]); } else ok(false, '추격이 이어지는 경우여야 함', r);
  ok(K.floor && K.floor.v === 9100 && /📌/.test(K.floor.why), '가장 센 하한 = 📌 개별 9,100 (추격자 9,000보다 셈)', K.floor);
  { const h = M.ctrlPeekBox({ peekO: { dec, policy: null } }, row); ok(!/판매자A/.test(h), '카드 글에 판매자 이름을 쓰지 않음'); } }

// 하루 손해 한도 — 셈만(원장 안 바뀜)
{ const row = it({ gid: 'g2', l: { price: 5000 }, target: null }); const a = { id: 'aF', k: 'floor', t: 'i', tid: row.x.l.id }; OWN = new Map([[row.x.l.id, a]]);
  const fake = { stratDecide: () => ({ act: 'price', to: 4500, why: '시험 내림' }), stratGuard: () => ({ ok: true, no: [] }), stratFloor: () => ({ v: 1000 }), fenceTry: ML.fenceTry, fenceLimitOf: () => ({ ok: true, limit: 300 }) };
  const L = JSON.parse(JSON.stringify(LED0)); const snap = JSON.stringify(L);
  const K = peek(row, { ML: fake, F: { L, nw: {} } }); ok(K.fence && K.fence.ok === false && K.s.blocked === true && K.s.no.some((s) => /하루 손해 한도/.test(s)), '500원 내림 > 한도 300원 → ⚡ 막힘(셈만)', K.fence);
  ok(JSON.stringify(L) === snap, '원장 자료는 그대로(적지 않음)');
  const K2 = peek(row, { ML: { ...fake, fenceLimitOf: () => ({ ok: true, limit: 3000 }) }, F: { L, nw: {} } }); ok(K2.fence && K2.fence.ok === true && K2.s.blocked === false, '한도 안 → 막힘 아님', K2.fence); }

// 아무것도 안 걸림 · 성적표 한 줄
{ const row = it({ gid: 'g2' }); OWN = new Map(); const K = peek(row, { dec: null }); ok(!K.w && !K.c && !K.s && K.to === 10000, '감시·추격·전략 없음 → 지금 값 그대로', K);
  ok(/어느 것도 이 상품에 걸려 있지 않음/.test(M.ctrlPeekBox({}, row)), '카드 글: 걸린 것 없음');
  ok(M.ctrlPeekPerf('match') === null, '📊 성적표를 아직 안 열었으면 새로 읽지 않음(null)');
  ctx.S._ctrlEps = { at: 1, eps: [] }; const pf = M.ctrlPeekPerf('match'); ok(pf && pf.n === 0, '받아 둔 기록이 있으면 같은 perf로 한 줄(기록 0)', pf); }

console.log(bad ? `\n❌ ${bad}개 실패` : '\n✅ 모두 통과'); process.exit(bad ? 1 : 0);

// tWATCH1_1118 — (11/18 일꾼 watch1 · reports/DECIDE_SWEEP_1117.md ② 리드 결정 넷) 감시 묶음
//   ① 판본 엔진 하루 상한 — 알라딘 전체 하루 몫 안에서 남는 몫(edCapOf) · 막힘 기록이 나오면 줄임 · 고정 600이 바닥
//   ② 로그인 번갈아 넘어감 — 기준(ppN)을 넘으면 클라우드가 물러남(algPpYield) · JS-MAIN·MJ-MAIN 로그인은 막지 않음(클라우드 쪽만) · 7일 재기(algPpMax)
//   ③ 출고 PC 꺼짐 알림(spwDecide) — 10분 넘게 신호 없음 → 한 번 · 출고 일이 기다리면 1시간마다 3번까지 · 돌아오면 한 번 · 읽기만
//   ④ 판매가 되돌아감 감시(prvDetect) — 기록 없이 바뀜·되돌아감·30분 안 되돌림 · 알림 없음(리드 순찰)
// 실행: node src/tests/tWATCH1_1118.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const pick = (...a) => a.find((x) => x && fs.existsSync(x));
const CLD = pick(path.resolve(__dirname, '..', '..', 'cloud', 'index.js'), path.resolve(__dirname, '..', 'cloud', 'index.js'));
const EDJ = pick(path.resolve(__dirname, '..', '..', 'cloud', 'edition.js'), path.resolve(__dirname, '..', 'cloud', 'edition.js'));
const APP = pick(process.env.RN_APP, path.resolve(__dirname, '..', 'app.html'));
const CL = fs.readFileSync(CLD, 'utf8'); const T = APP ? fs.readFileSync(APP, 'utf8') : '';
const fnIn = (S, name, pre) => { const i = S.indexOf((pre || 'function ') + name + '('); if (i < 0) throw new Error('함수 없음 ' + name); let d = 0; const k = S.indexOf('{', i); for (let j = k; j < S.length; j++) { if (S[j] === '{') d++; else if (S[j] === '}') { d--; if (!d) return S.slice(i, j + 1); } } throw new Error('함수 끝 없음 ' + name); };
const lineOf = (S, re) => (S.split('\n').find((x) => re.test(x)) || '');

console.log('① 판본 엔진 하루 상한(edCapOf)');
const ED = require(EDJ); const edCapOf = ED._t.edCapOf;
ok(ED.ED_DEF.dayCap === 600 && ED.ED_DEF.capMax === 2400, '바닥 600 · 위 2400(되돌릴 수 있는 기준값)', [ED.ED_DEF.dayCap, ED.ED_DEF.capMax]);
const others = [{ k: 'bk', used: 4000, cap: 4000 }, { k: 'met', used: 0, cap: 3000 }];
const a = edCapOf({ base: 600, capMax: 2400, frac: 0.17, others });
ok(a.cap > 600 && a.cap <= 2400, '새벽(하루 17% 지남) 남는 몫이 있으면 600보다 많이', a);
const b = edCapOf({ base: 600, capMax: 2400, frac: 0.99, others: [{ k: 'bk', used: 4000, cap: 4000 }, { k: 'met', used: 3000, cap: 3000 }] });
ok(b.cap === 600, '남는 몫이 없으면 바닥 600', b);
ok(edCapOf({ base: 600, capMax: 2400, frac: 0.5, others, edBlocks: 1 }).cap === 600, '판본 엔진 막힘 1번이면 600으로');
ok(edCapOf({ base: 600, capMax: 2400, frac: 0.5, others, edBlocks: 2 }).cap === 300, '막힘 2번이면 절반');
ok(edCapOf({ base: 600, capMax: 2400, frac: 0.5, others, alBlk: true }).cap === 600, '알라딘 전체 막힘(다른 엔진)이면 600으로');
const c = edCapOf({ base: 600, capMax: 1000, frac: 0.9, others: [{ k: 'met', used: 0, cap: 9000 }] });
ok(c.cap <= 1000, '위 상한(capMax)을 넘지 않음', c);
const d = edCapOf({ base: 600, capMax: 2400, frac: 0.5, alDay: 5000, others: [{ k: 'bk', used: 2000, cap: 4000 }] });
ok(d.total === 5000 && d.cap >= 600, '알라딘 전체 하루 몫(alDay)을 주면 그것을 씀', d);
const ES = fs.readFileSync(EDJ, 'utf8');
ok(/ST\.used >= capNow\(\)\.cap/.test(ES), '회차가 지금 상한(capNow)으로 멈춤');

console.log('② 로그인 번갈아 넘어감 — 클라우드가 물러남');
const ruleSrc = (() => { const i = CL.indexOf('const RN_LOGIN_RULE = (function () {'); const j = CL.indexOf('})();', i); return CL.slice(i, j + 5); })();
const RN_LOGIN_RULE = new Function(ruleSrc + '\nreturn RN_LOGIN_RULE;')();
const algPpYield = new Function('RN_LOGIN_RULE', fnIn(CL, 'algPpYield') + '\nreturn algPpYield;')(RN_LOGIN_RULE);
const algPpMax = new Function('RN_LOGIN_RULE', fnIn(CL, 'algPpMax') + '\nreturn algPpMax;')(RN_LOGIN_RULE);
const now = Date.parse('2026-11-18T03:00:00Z');
const hop = (n) => Array.from({ length: n }, (_, i) => ({ ok: true, at: now - (n - i) * 5 * 60e3, who: i % 2 ? 'CLOUD' : 'JS-MAIN' }));
ok(algPpYield({ tries: hop(3) }, now) === null, '바뀜 2번(기준 3 안)이면 물러나지 않음');
const y = algPpYield({ tries: hop(6) }, now);
ok(y && y.ok === false && y.kind === 'pp' && y.patch.dev.cloud.in === false && y.until > now, '바뀜 5번(기준 3 넘음)이면 클라우드가 물러남(자리 내놓음)', y);
ok(algPpYield({ tries: hop(6), cfg: { ppYield: false } }, now) === null, 'cfg.ppYield:false면 끔(되돌림)');
ok(algPpYield({ tries: hop(6), cfg: { ppN: 9 } }, now) === null, '기준값 ppN은 설정으로 바꿈');
const m = algPpMax({ tries: [...hop(6), { ok: false, at: now - 60e3, who: 'CLOUD' }] }, now, 7);
ok(m.max === 5 && m.ok === 6 && m.tries === 7 && m.ppN === 3, '7일 재기 — 가장 큰 바뀜 수·성공 수·시도 수', m);
const seat = fnIn(CL, 'algSeatOk', 'async function ');
ok(/const pp = algPpYield\(doc, now\); if \(pp\)/.test(seat), '클라우드 자리 받기(algSeatOk) 안에서만 물러남 — PC 로그인 규칙(RN_LOGIN_RULE)은 그대로');
ok(!/ppYield/.test(ruleSrc), '로그인 규칙 글(수집기·클라우드 같은 글)은 바꾸지 않음');

console.log('③ 출고 PC 꺼짐 알림(spwDecide)');
const spw = new Function(lineOf(CL, /^const SPW_DEF = /) + '\n' + fnIn(CL, 'spwDecide') + '\nreturn spwDecide;')();
const t0 = Date.parse('2026-11-14T11:17:00Z'); let st = {};
let r = spw({ now: t0 + 5 * 60e3, name: 'MJ-MAIN', st, beatAt: t0, work: 4 }); ok(!r.push && r.why === '정상', '5분 조용 — 아직 안 알림', r); st = r.st;
r = spw({ now: t0 + 11 * 60e3, name: 'MJ-MAIN', st, beatAt: t0, work: 4 }); ok(r.push && /출고 PC\(MJ-MAIN\) 수집기 꺼짐/.test(r.push.title) && /4건/.test(r.push.body), '10분 넘으면 한 번 알림(기다리는 출고 일 수)', r); st = r.st;
r = spw({ now: t0 + 30 * 60e3, name: 'MJ-MAIN', st, beatAt: t0, work: 4 }); ok(!r.push, '1시간 안엔 다시 안 알림'); st = r.st;
let n = 0; for (let h = 1; h <= 6; h++) { r = spw({ now: t0 + 11 * 60e3 + h * 61 * 60e3, name: 'MJ-MAIN', st, beatAt: t0, work: 4 }); if (r.push) n++; st = r.st; }
ok(n === 3, '출고 일이 기다리면 1시간마다 3번까지만 다시', n);
r = spw({ now: t0 + 7 * 3600e3 + 11 * 60e3, name: 'MJ-MAIN', st, beatAt: t0 + 7 * 3600e3 + 10 * 60e3, work: 4 }); ok(r.push && /다시 켜짐/.test(r.push.title) && r.st.down === false, '돌아오면 「다시 켜짐」 한 번', r); st = r.st;
r = spw({ now: t0 + 7 * 3600e3 + 12 * 60e3, name: 'MJ-MAIN', st, beatAt: t0 + 7 * 3600e3 + 11 * 60e3, work: 0 }); ok(!r.push, '돌아온 뒤 조용');
ok(!spw({ now: t0 + 20 * 60e3, st: {}, beatAt: t0, work: 0 }).push, '기본(onlyWork:true · 리드 결정 F57 (나)) — 출고 일이 없으면 꺼져도 알리지 않음');
let s2 = {}; r = spw({ now: t0 + 20 * 60e3, st: s2, beatAt: t0, work: 0, cfg: { onlyWork: false } }); ok(r.push, 'onlyWork:false면 출고 일이 없어도 첫 알림은 한 번'); s2 = r.st;
r = spw({ now: t0 + 90 * 60e3, st: s2, beatAt: t0, work: 0, cfg: { onlyWork: false } }); ok(!r.push, '출고 일이 없으면 다시 알리지 않음');
ok(!spw({ now: t0 + 20 * 60e3, st: {}, beatAt: t0, work: 3, cfg: { on: false } }).push, 'on:false면 끔');
ok(!spw({ now: t0 + 20 * 60e3, st: {}, beatAt: t0, work: 3, dup: true }).push, '🔕 PC 부재 알림에서 그 PC를 켜 두었으면 겹치지 않음');
const r3 = spw({ now: t0 + 20 * 60e3, st: { down: true, since: t0, sent: null, n: 0 }, beatAt: t0, work: 0, dup: true }); const back = spw({ now: t0 + 30 * 60e3, st: r3.st, beatAt: t0 + 29 * 60e3 });
ok(!back.push, '꺼짐 알림을 안 보냈으면 「다시 켜짐」도 안 보냄');
const tick = fnIn(CL, 'shipPcWatchTick', 'async function ');
ok(/pushSend\(null, \{ \.\.\.r\.push, tag: 'rn-shippc'[^}]*\}, 'shippc'\)/.test(tick), '알림 종류 shippc(기기마다 끌 수 있음)');
ok(!/C\('shp_cmds'\)\.(add|doc\([^)]*\)\.set)|col2_ctl|pc_cmds/.test(tick), '읽기만 — 출고 PC에 명령·맡김을 쓰지 않음');
ok(/async function loggerWatchTick\(\) \{[^\n]*shipPcWatchTick\(\)/.test(CL), '로거 지킴이 회차에서 함께 살핌');
ok(/data-snk="\$\{esc\(d\)\}\|shippc"/.test(T), '웹앱 ⚙ 휴대폰 알림 기기마다 「🚚 출고 PC 꺼짐」 칩');

console.log('④ 판매가 되돌아감 감시(prvDetect)');
const prv = new Function(fnIn(CL, 'prvDetect') + '\nreturn prvDetect;')();
const at = (min) => new Date(now - min * 60e3).toISOString();
ok(prv({ price: 9000, priceLog: [{ at: at(10), from: 8000, to: 9000, how: 'input', by: 'MJ-MAIN' }] }, now).length === 0, '기록대로면 아무것도 없음');
let h = prv({ price: 8000, priceLog: [{ at: at(10), from: 8000, to: 9000, how: 'input', by: 'MJ-MAIN' }] }, now);
ok(h.length === 1 && h[0].kind === 'back', '기록 없이 앞 값으로 돌아가면 back', h);
h = prv({ price: 7000, priceLog: [{ at: at(10), from: 8000, to: 9000, how: 'input' }] }, now);
ok(h.length === 1 && h[0].kind === 'silent', '기록 없이 다른 값이면 silent', h);
h = prv({ price: 8000, priceLog: [{ at: at(20), from: 8000, to: 9000, how: 'input' }, { at: at(10), from: 9000, to: 8000, how: '상태 상급로 바꿈 — 추천가' }] }, now);
ok(h.length === 1 && h[0].kind === 'logback', '30분 안 다른 방법이 앞 값으로 되돌리면 logback', h);
ok(prv({ price: 8000, priceLog: [{ at: at(20), from: 8000, to: 8400, how: '+5%' }, { at: at(19), from: 8400, to: 8000, how: '+5%' }] }, now).length === 0, '같은 방법 되풀이는 뺌');
ok(prv({ price: 8000, priceLog: [{ at: at(200), from: 8000, to: 9000, how: 'input' }, { at: at(10), from: 9000, to: 8000, how: '추천가' }] }, now).length === 0, '30분 넘게 떨어진 되돌림은 뺌');
ok(prv({ price: 5000, priceLog: [{ at: at(60 * 24 * 8), from: 4000, to: 6000, how: 'input' }] }, now).length === 0, '7일 넘은 기록은 안 봄');
const pt = fnIn(CL, 'priceRevertTick', 'async function ');
ok(!/pushSend/.test(pt) && /prd_system'\)\.doc\('price_revert'\)/.test(pt), '알림 없이 기록만(prd_system/price_revert)');
ok(/\{ merge: true \}/.test(pt) && /full = true/.test(pt), '지우지 않음 — 덧붙이고 800개에서 멈춤');

console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);

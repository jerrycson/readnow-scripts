// tY24OPS4 — (11/11 y24ops4 · 정범님 '통합 장부에서 예스24 수량 조절·판매중지를 바로') 🟦 예스24 쓰기를 어느 기기에서든
//   ① 웹앱 길 고르기: 이 기기가 예스24를 맡은 PC(번외를 본 기기)면 이 기기 번외로 · 아니면 col2_y24_cmd에 적어 맡은 PC가 받음
//   ② 원격으로 맡기지 않는 때: 맡은 PC 소식 30분 넘음 · 도우미가 답하지 않음 · 「이미 로그인된」 멈춤 — 로그인 필요는 맡기되 알림
//   ③ 맡김 문서 → 이 기기 표시(받기 기다림·차례·진행 단계·결과 줄마다)
//   ④ 수집기 다리(wRelay): 새 맡김을 트랜잭션으로 한 번만 받아 번외 /y24/w/put → 결과를 문서에 되돌려 적고 ack · 30분 넘게 묵은 맡김은 넘기지 않음 · 맡지 않은 PC·로거는 아무것도 안 함 · 거절 까닭 그대로
//   ⑤ 글 검사: 장부 맡기기 지킴에서 '번외 없는 기기' 막이 빠짐 · 자동 내림은 예전 지킴(ledY24HereWhy) · 결과 확인(ack)은 이 기기가 맡긴 것만 · 수집기 머리 그대로 · 브라우저 창 없음
// 실행: node src/tests/tY24OPS4.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path'); const cp = require('child_process');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const T = fs.readFileSync(path.join(ROOT, 'src', 'app.html'), 'utf8'); const CS = fs.readFileSync(path.join(ROOT, 'src', 'readnow-collector.src.js'), 'utf8');
const cutOf = (S, a, b) => { const i = S.indexOf(a); const j = S.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return S.slice(i, j); };
const cut = (a, b) => cutOf(T, a, b);
const now = Date.now(); const iso = (m) => new Date(now - m * 60e3).toISOString();

/* 웹앱 덩어리 — ◆y24hold + ◆y24wr 를 가짜 S·db·localStorage·y24AutoF 위에서 */
function mkWeb(o) { const calls = []; const wrote = {}; const ctl = o.ctl || {};
  const db = { collection: (c) => ({ doc: (id) => ({ get: async () => { if (c === 'col2_ctl') return { exists: !!ctl[id], data: () => ctl[id] }; return { exists: !!wrote[c + '/' + id], data: () => wrote[c + '/' + id] }; }, set: async (v) => { wrote[c + '/' + id] = v; } }) }) };
  const ls = { getItem: (k) => (k === 'rn-c2seen' && o.seen ? '1' : null) };
  const src = cut('/* ◆y24hold 시작', '/* ◆y24hold 끝 */') + '\n' + cut('/* ◆y24wr 시작', '/* ◆y24wr 끝 */') + '\nreturn { y24WLocalOk, y24WRelayWhy, y24WDocSt, y24WSend, y24WResumeRelay, y24HoldState, c2CtlRow };';
  const F = new Function('S', 'db', 'localStorage', 'deviceName', 'y24AutoF', 'num', src)({ app: { platforms: o.holder ? { y24Holder: o.holder } : {} } }, db, ls, () => o.dev, async (p, b) => { calls.push([p, b]); return o.local === undefined ? { ok: true, took: b && b.id, _st: 200 } : o.local; }, (n) => String(n));
  return { F, calls, wrote }; }

console.log('① 길 고르기');
{ const { F } = mkWeb({ dev: 'HOME' });
  ok(F.y24WLocalOk('HOME', 'HOME', true) === true, '맡은 PC + 번외를 본 기기 = 이 기기 번외로');
  ok(F.y24WLocalOk('home ', null, true) === true, '이름 대소문자·빈칸 무시 · 맡은 PC 없으면 기본 HOME');
  ok(F.y24WLocalOk('JS-MAIN', 'HOME', true) === false, '번외가 있어도 맡지 않은 PC면 원격 길(예전엔 JS-MAIN 번외가 「예스24 꺼짐」으로 거절)');
  ok(F.y24WLocalOk('PHONE-1', 'HOME', false) === false, '번외 없는 기기(휴대폰) = 원격 길'); }

console.log('② 원격으로 맡길 수 있나');
{ const { F } = mkWeb({ dev: 'X' }); const st = (doc) => F.y24HoldState('HOME', doc ? [F.c2CtlRow('HOME', doc)] : [], now);
  ok(/소식이 아직 없음/.test(F.y24WRelayWhy(st(null)).why), '맡은 PC 문서 없음 = 안 맡김');
  ok(/40분째 소식 없음/.test(F.y24WRelayWhy(st({ at: iso(40), st: { running: true, y24: { login: 'ok' } } })).why), '30분 넘게 소식 없음 = 안 맡김(늦게 눌릴 쓰기를 쌓지 않음)');
  ok(/도우미가 답하지 않음/.test(F.y24WRelayWhy(st({ y24hb: { at: iso(2), hlp: false } })).why), '도우미 꺼짐 = 안 맡김');
  ok(/이미 로그인된/.test(F.y24WRelayWhy(st({ at: iso(1), st: { running: true, y24: { login: 'need', already: { n: 2 } } } })).why), '「이미 로그인된 예스24」 멈춤 = 안 맡김');
  const lg = F.y24WRelayWhy(st({ at: iso(1), st: { running: true, y24: { login: 'need' } } })); ok(!lg.why && /로그인이 풀려/.test(lg.note), '로그인 필요 = 맡기되 「로그인 기다림」 알림', lg);
  const g = F.y24WRelayWhy(st({ at: iso(1), st: { running: true, y24: { login: 'ok', active: true } } })); ok(!g.why && !g.note, '살아 있고 로그인 ok = 그냥 맡김'); }

console.log('③ 보내기(y24WSend)');
(async () => {
  { const W = mkWeb({ dev: 'HOME', seen: true }); const r = await W.F.y24WSend('y24w-1', [{ rid: 'a', no: '1', kind: 'qty', to: 2 }]); ok(r.ok && r.via === 'local' && W.calls[0][0] === '/y24/w/put' && !Object.keys(W.wrote).length, 'HOME에서 = 이 기기 번외 /y24/w/put(문서 안 씀)', r); }
  { const W = mkWeb({ dev: 'HOME', seen: true, local: { ok: false, err: '같은 상품(1)이 이미 맡김 줄에 있음', _st: 400 } }); const r = await W.F.y24WSend('y24w-1b', [{ rid: 'a' }]); ok(!r.ok && /이미 맡김 줄/.test(r.err), '이 기기 번외가 거절하면 그 까닭 그대로', r); }
  { const W = mkWeb({ dev: 'PHONE', ctl: { HOME: { at: iso(1), st: { running: true, y24: { login: 'ok', on: true } } } } }); const rows = [{ rid: 'k|1', rk: 'k|1|stop|', no: '1', self: 'S1', kind: 'stop', to: null }];
    const r = await W.F.y24WSend('y24w-2', rows); const d = W.wrote['col2_y24_cmd/y24w-2'];
    ok(r.ok && r.via === 'relay' && r.h === 'HOME' && !W.calls.length, '휴대폰 = 127.0.0.1을 두드리지 않고 원격 길', r);
    ok(d && d.st === 'new' && d.k === 'w' && d.holder === 'HOME' && d.by === 'PHONE' && d.job.id === 'y24w-2' && d.job.rows[0].self === 'S1', 'col2_y24_cmd/<맡김 번호> {st:new · 맡은 PC · 줄}', d); }
  { const W = mkWeb({ dev: 'JS-MAIN', seen: true, holder: 'HOME', ctl: { HOME: { at: iso(50), st: { running: true, y24: { login: 'ok' } } } } }); const r = await W.F.y24WSend('y24w-3', [{ rid: 'a' }]); ok(!r.ok && /50분째/.test(r.err) && !W.wrote['col2_y24_cmd/y24w-3'] && !W.calls.length, '맡은 PC 소식 50분 = 안 적음·까닭', r); }
  { const W = mkWeb({ dev: 'MJ-MAIN', ctl: { HOME: { y24hb: { at: iso(2), hlp: true, login: 'need', on: true } } } }); const r = await W.F.y24WSend('y24w-4', [{ rid: 'a' }]); ok(r.ok && r.via === 'relay' && /로그인이 풀려/.test(r.note), 'MJ-MAIN도 원격 길(그 PC 번외는 건드리지 않음) · 로그인 필요 알림', r); }
  { const W = mkWeb({ dev: 'PHONE' }); ok(await W.F.y24WResumeRelay() && Object.values(W.wrote).some((v) => v.k === 'resume' && v.holder === 'HOME' && v.st === 'new'), '⛔ 멈춤 이어 가기도 원격으로(k:resume)'); }

  console.log('④ 맡김 문서 → 표시');
  { const { F } = mkWeb({ dev: 'X' });
    ok(F.y24WDocSt({ st: 'new', holder: 'HOME', at: iso(1) }, 'a', now).st === 'run', '새 맡김 = 진행 중(받기 기다림)');
    ok(/5분째/.test(F.y24WDocSt({ st: 'new', holder: 'HOME', at: iso(5) }, 'a', now).msg), '3분 넘게 안 받으면 몇 분째인지');
    const p = F.y24WDocSt({ st: 'run', tookBy: 'HOME', prog: { step: '찾기', wait: false } }, 'a', now); ok(p.st === 'run' && p.step === '찾기' && /HOME 번외: 찾기/.test(p.msg), '진행 단계', p);
    const w = F.y24WDocSt({ st: 'run', tookBy: 'HOME', prog: { step: '', wait: true, why: '예스24 로그인 기다림(누르기 전)' } }, 'a', now); ok(w.wait && /로그인 기다림/.test(w.msg) && w.why, '차례·기다림 까닭', w);
    const v = { st: 'done', res: { state: 'part', msg: '1/2줄 끝', stop: false, rows: { a: { state: 'done', msg: '수량 — 확인(3 → 2)' }, b: { state: 'fail', pre: true, msg: '표에서 못 찾음', todo: '손으로' } } } };
    const a = F.y24WDocSt(v, 'a', now), b = F.y24WDocSt(v, 'b', now); ok(a.st === 'done' && /확인/.test(a.msg) && b.st === 'fail' && b.todo === '손으로', '결과는 줄마다', [a, b]);
    const u = F.y24WDocSt({ st: 'done', res: { state: 'unsure', msg: '눌렀지만 그대로', stop: true, rows: {} } }, 'z', now); ok(u.st === 'unsure' && u.stop, '확실하지 않음·멈춤', u);
    const rf = F.y24WDocSt({ st: 'done', res: { state: 'fail', pre: true, msg: '맡긴 지 45분 지나' } }, 'a', now); ok(rf.st === 'fail' && /45분/.test(rf.msg), '거절(늦음 등) 까닭 그대로'); }

  console.log('⑤ 수집기 다리(wRelay)');
  { const blk = cutOf(CS, "    const W_CMD = 'col2_y24_cmd'", '    G.__rnC2yWRelay = wRelay;');
    const mkC = (docs, helper) => { const D = {}; for (const [id, v] of Object.entries(docs)) D[id] = JSON.parse(JSON.stringify(v)); const logs = []; const reqs = [];
      const ref = (id) => ({ id, get: async () => ({ exists: !!D[id], data: () => D[id] }), set: async (v, o2) => { D[id] = o2 && o2.merge ? { ...(D[id] || {}), ...v } : v; } });
      const coll = () => ({ doc: (id) => ref(id), where: (f, op, val) => ({ limit: () => ({ get: async () => ({ docs: Object.keys(D).filter((id) => D[id] && D[id][f] === val).map((id) => ({ id, ref: ref(id), data: () => D[id] })) }) }) }) });
      const firebase = { firestore: () => ({ collection: coll, runTransaction: async (fn) => fn({ get: async (r) => r.get(), set: (r, v, o2) => { D[r.id] = o2 && o2.merge ? { ...(D[r.id] || {}), ...v } : v; } }) }) };
      const GM = (q) => { const p = q.url.replace('http://127.0.0.1:8797', ''); const b = q.data ? JSON.parse(q.data) : null; reqs.push([q.method, p, b]); const r = helper(q.method, p, b); setTimeout(() => (r == null ? q.onerror() : q.onload({ status: r._st || 200, responseText: JSON.stringify(r) })), 0); };
      const f = new Function('firebase', 'GM_xmlhttpRequest', 'window', 'C2Y', blk + '\nreturn { wRelay, wSafe };')(firebase, GM, { __rnLog: (a, b, m) => logs.push(m) }, 'http://127.0.0.1:8797'); return { ...f, D, reqs, logs }; };
    const y = { on: true, mine: true, logger: false };
    const job = { k: 'w', st: 'new', holder: 'HOME', by: 'PHONE', at: iso(1), job: { id: 'y24w-9', rows: [{ rid: 'k|1', rk: 'k|1|stop|', no: '11', self: 'S1', kind: 'stop', to: null, title: '책' }] } };
    let state = { ok: true, res: {}, wait: [{ id: 'y24w-9' }], cur: null, why: null };
    const C = mkC({ c1: job, old: { ...job, at: iso(45), job: { id: 'y24w-old', rows: job.job.rows } }, other: { ...job, holder: 'JS-MAIN', job: { id: 'y24w-x', rows: [] } } }, (m, p, b) => p === '/y24/w/put' ? { ok: true, took: b.id } : p === '/y24/w/state' ? state : p === '/y24/w/ack' ? { ok: true } : null);
    await C.wRelay('HOME', y);
    const puts = C.reqs.filter((r) => r[1] === '/y24/w/put');
    ok(puts.length === 1 && puts[0][2].id === 'y24w-9' && puts[0][2].rows[0].self === 'S1' && /원격/.test(puts[0][2].by), '새 맡김을 이 PC 번외 /y24/w/put으로 한 번(원격 표시)', puts);
    ok(C.D.c1.st === 'run' && C.D.c1.tookBy === 'HOME', '받은 문서 = run · 받은 PC', C.D.c1);
    ok(C.D.old.st === 'done' && C.D.old.res.state === 'fail' && /45분/.test(C.D.old.res.msg), '45분 묵은 맡김은 넘기지 않고 늦음으로 끝', C.D.old);
    ok(C.D.other.st === 'new', '다른 PC 앞 맡김은 손대지 않음');
    await C.wRelay('HOME', y); ok(C.reqs.filter((r) => r[1] === '/y24/w/put').length === 1, '15초 안 다시 부르면 아무것도 안 함(같은 맡김 두 번 0)');
    /* 결과 */ const t0 = Date.now; Date.now = () => t0() + 20e3; state = { ok: true, res: { 'y24w-9': { state: 'done', msg: '판매중지 — 확인', rows: { 'k|1': { state: 'done', msg: '판매중지 — 등록상품 목록에서 확인(판매중 → 판매중지)', before: { st: '02' }, after: { st: '08' } } } } }, wait: [], cur: null };
    await C.wRelay('HOME', y); Date.now = t0;
    ok(C.D.c1.st === 'done' && C.D.c1.res.rows['k|1'].state === 'done' && C.D.c1.res.rows['k|1'].after.st === '08', '결과를 문서에 줄마다 되돌려 적음', C.D.c1);
    ok(C.reqs.some((r) => r[1] === '/y24/w/ack' && r[2].ids[0] === 'y24w-9'), '적은 뒤에만 번외 결과 확인(ack)'); }
  { const blk = cutOf(CS, "    const W_CMD = 'col2_y24_cmd'", '    G.__rnC2yWRelay = wRelay;'); const reqs = [];
    const f = new Function('firebase', 'GM_xmlhttpRequest', 'window', 'C2Y', blk + '\nreturn { wRelay };')({ firestore: () => { throw new Error('부르면 안 됨'); } }, (q) => reqs.push(q), {}, 'x');
    await f.wRelay('JS-MAIN', { on: false, mine: false }); await f.wRelay('LOGGER', { on: true, mine: true, logger: true }); ok(!reqs.length, '맡지 않은 PC·로거는 Firestore도 번외도 안 건드림'); }
  { const blk = cutOf(CS, "    const W_CMD = 'col2_y24_cmd'", '    G.__rnC2yWRelay = wRelay;'); const D = { c: { k: 'w', st: 'new', at: iso(1), job: { id: 'j', rows: [{ rid: 'r', no: '1', kind: 'qty', to: 2 }] } } };
    const ref = (id) => ({ id, get: async () => ({ exists: !!D[id], data: () => D[id] }), set: async (v) => { D[id] = { ...D[id], ...v }; } });
    const fb = { firestore: () => ({ collection: () => ({ doc: ref, where: (k, o2, v) => ({ limit: () => ({ get: async () => ({ docs: Object.keys(D).filter((i) => D[i][k] === v).map((i) => ({ id: i, ref: ref(i), data: () => D[i] })) }) }) }) }), runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v) => { D[r.id] = { ...D[r.id], ...v }; } }) }) };
    const GM = (q) => setTimeout(() => q.onload({ status: 409, responseText: JSON.stringify({ ok: false, stop: true, err: '⛔ 예스24 쓰기 멈춤 — 눌렀지만 그대로' }) }), 0);
    const f = new Function('firebase', 'GM_xmlhttpRequest', 'window', 'C2Y', blk + '\nreturn { wRelay };')(fb, GM, {}, 'x'); await f.wRelay('HOME', { on: true, mine: true });
    ok(D.c.st === 'done' && D.c.res.stop && /멈춤/.test(D.c.res.msg), '번외가 거절(409 멈춤)하면 그 까닭을 그대로 문서에(예전 gx는 200 아니면 까닭을 버림)', D.c); }

  console.log('⑥ 글 검사');
  { const g = cut('function ledY24Guard()', '/* 맡김 — 돌려줌'); ok(!/rn-c2seen/.test(g.split('function ledY24HereWhy')[0]) && !/MJ-MAIN\(등록·출고 PC\) — 예스24 맡기기 안 함/.test(g), '장부 맡기기 지킴에서 「번외 없는 기기」「MJ-MAIN」 막이가 빠짐(원격 길)');
    ok(/const y24ok = !ledY24HereWhy\(\);/.test(T) && /function ledY24HereWhy\(\)[\s\S]{0,600}rn-c2seen/.test(T), '🤖 자동 내림은 예전 지킴(번외 있는 PC만 · 여러 기기가 겹쳐 맡지 않게)');
    ok(/const pr = await y24WSend\(jid, rows\);/.test(T) && /const pr = await y24WSend\(jid, \[P\.row\]\);/.test(T), '장부 맡기기·💲 판매가 모두 y24WSend');
    const poll = cut('async function ledY24WPoll()', 'setTimeout(ledY24WPoll, 25000);'); ok(/if \(!run\.some\(\(\[, w\]\) => w\.job === jid\)\) continue; acks\.push\(jid\);/.test(poll), '장부 결과 받기는 이 기기가 맡긴 것만 ack(💲 판매가·원격 결과를 지우지 않음)');
    ok(/w\.via === 'relay'/.test(poll) && /y24WDocs\(/.test(poll), '원격 맡김은 맡김 문서에서 진행·결과');
    let head0 = ''; try { head0 = cp.execSync('git -C ' + JSON.stringify(ROOT) + ' show origin/main:src/readnow-collector.src.js', { maxBuffer: 64e6 }).toString(); } catch (e) {}
    const hd = (s) => s.split('\n').filter((l) => /^\/\/ @(match|grant|connect|require|include|noframes|run-at)/.test(l)).map((l) => l.replace(/\?v=[\d.]+/, '')).join('\n'); ok(!head0 || hd(head0) === hd(CS), '수집기 머리(@match·@grant·@connect·@require 수 · 판 번호 ?v= 빼고) 그대로');
    ok(/if \(!y\.logger\) wRelay\(pc, y\)/.test(CS), '수집기: 번외와 주고받은 뒤 다리를 부름(로거 크롬 아닐 때)');
    ok(!/\b(alert|confirm|prompt)\(/.test(cut('/* ◆y24wr 시작', '/* ◆y24wr 끝 */') + cutOf(CS, "    const W_CMD = 'col2_y24_cmd'", '    G.__rnC2yWRelay = wRelay;')), '브라우저 창(alert/confirm/prompt) 없음'); }
  console.log(bad ? `✗ tY24OPS4 ${bad}개 실패` : '✓ tY24OPS4 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e); process.exit(1); });

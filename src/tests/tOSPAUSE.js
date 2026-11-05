// tOSPAUSE — 정범님 11/05 "'오늘 출고 끝까지' 진행을 시작하고 끝나는 시점까지는 잠깐 자동주문판정을 멈추고, 끝나는 시점에서 자동으로 다시 판정을 켜고 그 사이 발생한 주문을 검토"
//  ① 시작 → app_settings/ship_auto on:false + osPause(까닭·시각·run id·최대 시각·원래 켜짐) · 같은 실행 다시 osDrive여도 한 번만 · 화면 ⏸ 줄(그 사이 주문 n건)
//  ② 끝 → on:true · 멈춘 사이 들어온(판단 기록 없는) 주문만 '모두 다시 판단' 길로 판단(🔎 검토 주문은 그대로) · 켠 시각(since) 그대로 · 실행 문서 apause 끝 기록
//  ③ 사람이 「멈춤」 / 다른 기기에서 끝난 것을 봄(osApSweep) → 되돌림 ④ 원래 꺼져 있었으면 켜지 않음 ⑤ 「끝나도 다시 켜지 않음」 → 끝나도 꺼짐 ⑥ 멈춤 중 사람이 직접 켬 → since 그대로·멈춤 끝냄
//  ⑦ 클라우드 받침(함수만 떼어): 실행 끝남·기기 소식 끊김·최대 시간 넘김 → 다시 켜고 판단 · 아직 도는 중이면 그대로 · 원래 꺼짐(prevOn false)이면 켜지 않음
// 실행: cd pw && RN_PORT=8785 node tOSPAUSE.js
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path'); const H = require('./harness.js');
const CLOUD = [path.join(__dirname, '../cloud/index.js'), path.join(__dirname, '../../cloud/index.js')].find((p) => fs.existsSync(p));
(async () => {
await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const o = await p.evaluate(async () => { const o = {}; const W = (ms) => new Promise((r) => setTimeout(r, ms)); const FS = window.__FS; window.ask = async () => true; S.user = S.user || { email: 'tester@x' };
    const SA = () => JSON.parse(JSON.stringify((FS.app_settings || {}).ship_auto || {})); const RUN = (id) => (FS.shp_runs || {})[id] || {}; const now = () => new Date().toISOString();
    const it = (t, pr, lid) => ({ listingId: lid, title: t, price: pr, qty: 1, sku: 'PNK_ms', grade: '상' });
    const since = '2026-11-05T00:00:00.000Z';
    const reset = async (on) => { await db.collection('app_settings').doc('ship_auto').set({ on, since }); S.shipAutoCfg = { on, since }; S.shipAuto = new Map(); S._saW = 0; await W(80); };
    S.shipC = { orders: [{ orderNo: 'P-1', buyer: '손님A', orderedAt: '2026-11-05 09:00', items: [it('멈춤 책 하나', 5000, '404936000')] }, { orderNo: 'P-2', buyer: '손님B', orderedAt: '2026-11-05 09:10', items: [it('멈춤 책 둘', 6000, '404936001')] }], at: now(), enrich: {} }; S.shipCFromCache = false; await db.collection('shp_state').doc('confirm').set(JSON.parse(JSON.stringify(S.shipC))); await W(150);
    const mkRun = async (id, st) => { await db.collection('shp_runs').doc(id).set({ id, day: '20261105', n: 1, status: st || 'run', ph: 'P1', createdAt: now(), owner: { tab: 'x', dev: 'TEST', beat: now() }, bt: [], log: [] }); };
    // ① 시작
    await reset(true); await mkRun('20261105_1'); await db.collection('shp_auto').doc('P-2').set({ orderNo: 'P-2', state: 'review', at: now(), reasons: ['시험 검토'] }); await W(150);
    o.tg0 = shipRejAllTargets().map((x) => x.orderNo); o.shipC = (S.shipC.orders || []).map((x) => x.orderNo);
    o.on1 = await osApOn('20261105_1'); const a1 = SA(); o.a1 = { on: a1.on, P: a1.osPause };
    o.on1b = await osApOn('20261105_1'); o.a1b = SA().osPause.runs;
    o.run1 = RUN('20261105_1').apause || null; o.log1 = (RUN('20261105_1').log || []).map((x) => x.m).filter((m) => /자동 주문 판정/.test(m));
    S.os.doc = { ...RUN('20261105_1'), id: '20261105_1' }; S.shipAutoCfg = SA(); o.line1 = (osApLine(S.os.doc, { btn: true }) || '').replace(/<[^>]+>/g, '');
    o.html1 = (shipOneShotHtml() || '').replace(/<[^>]+>/g, ''); o.sau1 = (shipAutoSetHtml() || '').replace(/<[^>]+>/g, '').slice(0, 400); o.shl1 = shlRowOs({ ...RUN('20261105_1'), id: '20261105_1' }).sum;
    // ② 끝
    o.end1 = await osApEnd('20261105_1', '끝까지 끝남'); await W(150); const a2 = SA(); o.a2 = { on: a2.on, since: a2.since, P: a2.osPause, rj: a2.rejudgeOrders };
    o.p1 = ((FS.shp_auto || {})['P-1'] || {}); o.p2 = ((FS.shp_auto || {})['P-2'] || {}); o.run2 = RUN('20261105_1').apause; o.log2 = (RUN('20261105_1').log || []).map((x) => x.m).filter((m) => /^▶ 🤖 자동 주문 판정 다시 켬/.test(m));
    o.end1b = await osApEnd('20261105_1', '끝까지 끝남');
    // ③ 사람이 멈춤 — osAct('stop')
    await reset(true); delete FS.shp_auto['P-1']; await mkRun('20261105_2'); await osApOn('20261105_2'); S.os.doc = { ...RUN('20261105_2'), id: '20261105_2' }; await osAct('stop'); await W(150); o.stop = { on: SA().on, P: SA().osPause, st: RUN('20261105_2').status };
    // ③' 다른 기기에서 끝난 것을 봄
    await reset(true); await mkRun('20261105_3'); await osApOn('20261105_3'); S.shipAutoCfg = SA(); S._osApSw = null; osApSweep({ ...RUN('20261105_3'), id: '20261105_3', status: 'done' }); await W(400); o.sweep = { on: SA().on, why: SA().osPause.endWhy };
    o.sweepRun = (() => { S.shipAutoCfg = SA(); S._osApSw = null; return osApSweep({ id: 'x', status: 'run' }); })();
    // ④ 원래 꺼짐
    await reset(false); await mkRun('20261105_4'); o.off = await osApOn('20261105_4'); o.offA = SA(); await osApEnd('20261105_4', '끝까지 끝남'); o.offB = SA(); o.offRun = RUN('20261105_4').apause;
    // ⑤ 끝나도 다시 켜지 않음
    await reset(true); await mkRun('20261105_5'); await osApOn('20261105_5'); S.shipAutoCfg = SA(); document.body.insertAdjacentHTML('beforeend', '<div id="zz_ap">' + osApLine(null, { btn: true }) + '</div>'); document.querySelector('#zz_ap [data-osap="keep"]').click(); await W(200); await osApEnd('20261105_5', '끝까지 끝남'); o.keep = { on: SA().on, P: SA().osPause }; document.getElementById('zz_ap').remove();
    // ⑥ 멈춤 중 사람이 직접 켬
    await reset(true); await mkRun('20261105_6'); await osApOn('20261105_6'); S.shipAutoCfg = SA(); const box = document.createElement('div'); box.innerHTML = shipAutoSetHtml(); document.body.appendChild(box); shipAutoSetBind(box); const cb = box.querySelector('[data-sau="on"]'); cb.checked = true; await cb.onchange(); await W(200); o.human = { on: SA().on, since: SA().since, P: SA().osPause }; box.remove();
    await osApEnd('20261105_6', '끝까지 끝남'); o.human2 = SA().on;
    // ⑦ 설정 기본값
    o.cfg = (() => { const c = osCfg(); return [c.pauseAuto, c.pauseCapMin, c.pauseStaleMin]; })();
    o.feat = typeof FEATS !== 'undefined' ? 0 : 0; o.src = document.documentElement.innerHTML.length;
    return o; });
  if (process.env.V) console.log(JSON.stringify(o, null, 1).slice(0, 6000));
  ok(o.on1 && o.on1.did && o.a1.on === false && o.a1.P && o.a1.P.on && o.a1.P.run === '20261105_1' && o.a1.P.prevOn === true && o.a1.P.at && o.a1.P.until && !!o.a1.P.by && /끝까지/.test(o.a1.P.why), '① 시작 → on:false + osPause(까닭·시각·run id·최대 시각·원래 켜짐·누가)');
  ok(o.on1b && o.on1b.same && o.a1b.length === 1, '① 같은 실행으로 다시 osDrive → 아무것도 안 바꿈');
  ok(o.run1 && o.run1.at && o.log1.length === 1, '① 실행 문서 apause + 세부 줄 한 줄');
  ok(/끝까지 도는 동안 🤖 자동 판정 잠시 멈춤/.test(o.line1) && /그 사이 주문 1건 판단/.test(o.line1) && /지금 다시 켜기/.test(o.line1), '① ⏸ 줄: 그 사이 주문 1건(판단 기록 없는 P-1만 · 검토 P-2 빼고) · 단추 ' + o.line1.slice(0, 120));
  ok(/잠시 멈춤/.test(o.html1) && /잠시 멈춤/.test(o.sau1) && /자동 판정 잠시 멈춤/.test(o.shl1), '① 끝까지 진행 막대·⚙ 🤖 칸·🛰 진행 카드에 멈춤 표시');
  ok(o.end1 && o.end1.back && o.a2.on === true && o.a2.since === '2026-11-05T00:00:00.000Z' && o.a2.P.on === false && o.a2.P.endWhy === '끝까지 끝남' && o.a2.P.judgedAt, '② 끝 → on:true · 켠 시각 그대로 · 멈춤 끝 기록·판단 기록');
  ok(o.p1.state === 'wait' && o.p1.rejudge && o.p1.rejudge.all && o.p2.state === 'review' && (o.a2.rj || []).join() === 'P-1', '② 멈춘 사이 주문 P-1만 다시 판단(모두 다시 판단 길) · 검토 P-2는 그대로');
  ok(o.run2 && o.run2.back && o.run2.judged === 1 && o.log2.length === 1, '② 실행 문서 끝 요약: 다시 켬 · 1건 판단');
  ok(o.end1b === null, '② 두 번 불러도 한 번만');
  ok(o.stop.on === true && o.stop.P.on === false && /멈춤/.test(o.stop.P.endWhy) && o.stop.st === 'stop', '③ 사람이 「멈춤」 → 다시 켬');
  ok(o.sweep.on === true && o.sweep.why === '끝까지 끝남' && o.sweepRun === undefined, '③ 다른 기기에서 끝난 것을 봄 → 다시 켬 · 도는 중이면 안 함');
  ok(o.off && o.off.off && o.offA.on === false && !o.offA.osPause && o.offB.on === false && o.offRun && o.offRun.off, '④ 원래 꺼짐 → 멈춤 기록 없음 · 끝나도 켜지 않음');
  ok(o.keep.on === false && o.keep.P.on === false && o.keep.P.back === false && o.keep.P.prevOn === false, '⑤ 「끝나도 다시 켜지 않음」 → 끝나도 꺼짐');
  ok(o.human.on === true && o.human.since === '2026-11-05T00:00:00.000Z' && o.human.P.on === false && o.human.P.human && o.human2 === true, '⑥ 멈춤 중 사람이 직접 켬 → 켠 시각 그대로 · 멈춤 끝냄 · 끝에 다시 바꾸지 않음');
  ok(o.cfg.join() === 'true,20,5', '⚙ 기본값: 켬 · 최대 20분 · 소식 5분(정범님 11/05 15시)');
});
// ── ⑦ 클라우드 받침 — osPauseDue·osPauseTick만 떼어
if (CLOUD) { const cs = fs.readFileSync(CLOUD, 'utf8'); const i = cs.indexOf('function osPauseDue('); const j = cs.indexOf('\n', cs.indexOf('out.judged = res.rj || 0; return out; }', i)); const fnSrc = cs.slice(i, j);
  const docs = {}; const ref = (c, id) => ({ get: async () => ({ exists: !!docs[c + '/' + id], data: () => (docs[c + '/' + id] ? JSON.parse(JSON.stringify(docs[c + '/' + id])) : undefined) }), set: async (v) => { const o = docs[c + '/' + id] || {}; for (const k of Object.keys(v)) o[k] = v[k] && typeof v[k] === 'object' && !Array.isArray(v[k]) && o[k] && typeof o[k] === 'object' ? { ...o[k], ...v[k] } : v[k]; docs[c + '/' + id] = o; } });
  const C = (c) => ({ doc: (id) => ref(c, id) }); const db = { runTransaction: async (f) => f({ get: (r) => r.get(), set: (r, v) => r.set(v) }) };
  const rj = []; const autoRejudge = async (J) => { rj.push(J.orderNos.join(',')); return { rj: J.orderNos.length }; };
  const mk = new Function('C', 'db', 'nowIso', 'log', 'amrList', 'autoRejudge', 'let autoCfgC = null, kickFlag = false;\n' + fnSrc + '\nreturn { osPauseDue, osPauseTick, reset: () => { opAt = 0; } };');
  const T = mk(C, db, () => new Date().toISOString(), () => {}, async () => ({ L: [{ orderNo: 'P-1' }, { orderNo: 'P-2' }, { orderNo: 'CASH', platform: 'cash' }], ok: true }), autoRejudge);
  const t = Date.now(), iso = (ms) => new Date(ms).toISOString(); const P0 = { on: true, run: 'R1', at: iso(t - 20 * 60e3), until: iso(t + 160 * 60e3), capMin: 180, staleMin: 10, prevOn: true };
  ok(T.osPauseDue(P0, { status: 'run', owner: { beat: iso(t - 30e3) } }, t) === null, '☁ 아직 도는 중(맥박 30초 전) → 그대로');
  ok(/끝남/.test(T.osPauseDue(P0, { status: 'done' }, t) || '') && /멈춤/.test(T.osPauseDue(P0, { status: 'stop' }, t) || '') && /기록이 없음/.test(T.osPauseDue(P0, null, t) || ''), '☁ 실행 끝남·멈춤·기록 없음 → 되돌림');
  ok(/소식이 1[0-9]분 없음/.test(T.osPauseDue(P0, { status: 'run', owner: { beat: iso(t - 15 * 60e3) }, upd: iso(t - 15 * 60e3) }, t) || ''), '☁ 돌리던 기기 소식 15분 없음(창 닫힘·기기 꺼짐) → 되돌림');
  ok(/최대 시간 180분/.test(T.osPauseDue({ ...P0, until: iso(t - 1000) }, { status: 'wait', owner: { beat: iso(t - 10e3) } }, t) || ''), '☁ 사람 답 기다림이어도 최대 시간 넘김 → 되돌림');
  docs['app_settings/ship_auto'] = { on: false, since: 'S0', osPause: { ...P0 } }; docs['shp_runs/R1'] = { status: 'run', owner: { beat: iso(Date.now() - 20 * 60e3) } }; docs['shp_auto/P-2'] = { state: 'review' };
  const r1 = await T.osPauseTick(); const A = docs['app_settings/ship_auto'];
  ok(r1 && r1.back && A.on === true && A.since === 'S0' && A.osPause.on === false && A.osPause.endBy === 'cloud' && /소식/.test(A.osPause.endWhy) && rj.join('|') === 'P-1' && A.osPause.judged.n === 1 && docs['shp_runs/R1'].apause.back, '☁ 소식 끊김 → 다시 켬(켠 시각 그대로) · 멈춘 사이 주문 P-1만 판단(검토 P-2·현금 빼고) · 실행 문서에 기록');
  T.reset(); const r2 = await T.osPauseTick(); ok(r2 === null && rj.length === 1, '☁ 이미 되돌리고 판단했으면 다시 안 함');
  docs['app_settings/ship_auto'] = { on: false, osPause: { ...P0, prevOn: false } }; docs['shp_runs/R1'] = { status: 'done' }; T.reset(); const r3 = await T.osPauseTick();
  ok(r3 && r3.back === false && docs['app_settings/ship_auto'].on === false && docs['app_settings/ship_auto'].osPause.on === false && rj.length === 1, '☁ 끝나도 켜지 않기로 함(prevOn false) → 꺼진 채 멈춤만 끝냄');
  docs['app_settings/ship_auto'] = { on: true, osPause: { ...P0 } }; docs['shp_runs/R1'] = { status: 'done' }; T.reset(); await T.osPauseTick();
  ok(docs['app_settings/ship_auto'].on === true && docs['app_settings/ship_auto'].osPause.back === false, '☁ 그사이 사람이 직접 켰으면(on true) 손대지 않고 멈춤만 끝냄'); }
else ok(false, 'cloud/index.js를 못 찾음');
console.log(bad ? `❌ tOSPAUSE 실패 ${bad}` : '✓ tOSPAUSE 통과'); process.exit(bad ? 1 : 0); })().catch((e) => { console.log('❌ 오류', e); process.exit(1); });

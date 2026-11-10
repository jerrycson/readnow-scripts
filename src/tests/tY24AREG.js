// tY24AREG — (11/10 y24auto · 정범님 '예스24는 등록하지 않는 것이 전제인 거야? … 알라딘에 등록하고 또 다른 절차를 거쳐서 예스24에 등록하는 품을 또 들이라는 거야?')
//   🟦 등록에서 '예스24도' 기본 켬 + 🤖 자동 올림(이 PC 번외 수집기가 예스24 대량 등록 엑셀 업로드를 사람 손 없이)
//   ① 순수 셈(◆y24reg 덩어리만): 기본 켬(누른 기록 먼저 · 기본 시작일) · 사람 확인(엔진 멈춤·25% 넘게 쌈) · 자동 차례(처음 1건 → 확인 뒤 묶음 · 맡긴 것 남으면 0 · 수량 1) · 실패 줄 상태
//   ② 화면(RN_PORT가 있을 때): 가짜 번외 도우미(127.0.0.1:8797)로 — 1건 장부에 먼저 적고 맡김 → 결과 기다리는 동안 더 안 맡김 → ✅ 결과 → 장부 올라감(예스24 번호) → 다음 묶음 2건
//      → 실패 결과 → 멈춤 + 📤 화면에 까닭·할 일·[▶ 이어 가기](두 번 누르기) · MJ-MAIN 기기는 안 함 · 브라우저 창(alert/confirm) 0
// 실행: node src/tests/tY24AREG.js · 화면까지: RN_PORT=<포트> node tY24AREG.js (pw/ 안 · harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const F = new Function(cut('/* ◆y24reg 시작', '/* ◆y24reg 끝 */') + '\nreturn { Y24R_DEF, y24RegCfg, y24RegState, y24WantOn, y24AutoHuman, y24AutoPlan };')();
console.log('① 순수 셈');
{ const D = F.Y24R_DEF; ok(D.wantDef === 1 && D.auto === 1 && D.chunk === 25 && D.cheapPct === 25 && /^\d{4}-\d{2}-\d{2}$/.test(D.wantFrom), '기본값: 등록에서 예스24도 켬 · 자동 올림 켬 · 25건씩 · 25% 넘게 싸면 사람 확인');
  const c = F.y24RegCfg({ wantDef: 0, auto: false, chunk: 99, wantFrom: '2026-12-01', cheapPct: 1 }); ok(c.wantDef === 0 && c.auto === 0 && c.chunk === 30 && c.wantFrom === '2026-12-01' && c.cheapPct === 5 && F.y24RegCfg({ chunk: 1 }).chunk === 5 && F.y24RegCfg({ wantFrom: 'x' }).wantFrom === D.wantFrom, '설정 울타리(묶음 5~30 · 날짜 꼴 · 끔)');
  const it = (at) => ({ id: 'r1', createdAt: at }); const cfg = F.y24RegCfg({ wantFrom: '2026-11-10' });
  ok(F.y24WantOn(null, it('2026-11-10T01:00:00Z'), cfg) && !F.y24WantOn(null, it('2026-11-09T10:00:00Z'), cfg) && F.y24WantOn(null, it('2026-11-09T16:00:00Z'), cfg), '기본 켬은 기본 시작일(한국 날짜) 뒤 등록 줄만 — 예전 줄이 한꺼번에 따라오지 않음');
  ok(!F.y24WantOn({ on: 0 }, it('2026-11-10T01:00:00Z'), cfg) && F.y24WantOn({ on: 1 }, it('2026-11-01T01:00:00Z'), cfg) && F.y24WantOn({ lid: 'x' }, it('2026-11-10T01:00:00Z'), cfg), '사람이 누른 기록(끔·켬)이 기본보다 먼저 · 상품 번호만 적힌 기록은 기본을 따름');
  ok(!F.y24WantOn(null, it('2026-11-10T01:00:00Z'), F.y24RegCfg({ wantDef: 0 })) && !F.y24WantOn(null, { ...it('2026-11-10T01:00:00Z'), mock: 1 }, cfg) && F.y24WantOn(null, { createdAt: { seconds: Date.parse('2026-11-11T00:00:00Z') / 1000 } }, cfg), '기본 끔 설정이면 꺼짐 · 모의 줄 빠짐 · Firestore 시각 꼴도 읽음');
  const R = (o) => ({ lid: 'aladin_U1', title: '시험 책', isbn: '9788900000001', grade: '상', qty: 2, price: 9000, alPrice: 9000, skus: ['S1', 'S2'], self: 'S1,S2', val: { mode: 'match', t: '유효 동급 최저' }, ...o });
  ok(/멈춤/.test(F.y24AutoHuman(R({ val: { mode: 'stop', stop: true, t: '⛔ 사람 확인' } }))) && /사람 확인/.test(F.y24AutoHuman(R({ val: { mode: 'noData', chk: true, t: '알라딘 값 없음' } }))) && /쌈/.test(F.y24AutoHuman(R({ price: 6000, alPrice: 9000 }))) && F.y24AutoHuman(R({ price: 6800, alPrice: 9000 })) === '' && F.y24AutoHuman(R({ val: null })) === '', '사람 확인: 엔진 멈춤·확인 · 알라딘 값보다 25% 넘게 쌈(24%는 통과)');
  const now = '2026-11-10T05:00:00Z'; const C = { adm: [], pub: [] }; const cand = [R(), R({ lid: 'aladin_U2', skus: ['S3'], self: 'S3' }), R({ lid: 'aladin_U3', skus: ['S4'], self: 'S4', price: 1000 })];
  const P0 = F.y24AutoPlan(cand, {}, C, now, D); ok(P0.mode === 'first' && P0.max === 1 && P0.pick.length === 1 && P0.pick[0].qty === 1 && P0.pick[0].self === 'S1' && P0.pick[0].skus.join() === 'S1' && P0.human.length === 1, '처음엔 1건 · 수량 1 · 자체코드 = 첫 SKU · 25% 넘게 싼 줄은 사람 확인으로 뺌', P0);
  const e1 = { lid: 'aladin_U1', isbn: '9788900000001', grade: '상', skus: ['S1'], at: '2026-11-10T04:00:00Z', auto: 1, job: 'j1' };
  ok(F.y24AutoPlan(cand.slice(1), { a: { ...e1, st: 'auto' } }, C, now, D).max === 0 && F.y24AutoPlan(cand.slice(1), { a: { ...e1, st: 'auto' } }, C, now, D).mode === 'fly', '맡긴 것이 결과를 기다리면 더 안 맡김');
  ok(F.y24AutoPlan(cand.slice(1), { a: { ...e1, st: 'sent', unsure: 1 } }, C, now, D).mode === 'wait', '첫 건이 확인되기 전(결과 흐림)엔 0건 — 목록에서 자체코드가 보일 때까지');
  const Pb = F.y24AutoPlan(cand.slice(1), { a: { ...e1, st: 'sent', ok: 1 } }, C, now, { ...D, chunk: 5 }); ok(Pb.mode === 'bulk' && Pb.max === 5 && Pb.pick.length === 1, '첫 건 ✅ 뒤 묶음(설정 건수)씩');
  ok(F.y24AutoPlan(cand.slice(1), { a: { ...e1, st: 'sent', ok: 1, day: '2026-11-10' } }, C, now, { ...D, day: 1 }, '2026-11-10').mode === 'day', '하루 상한을 정하면 그만큼만');
  ok(F.y24AutoPlan(cand, { m: { ...e1, auto: 0, st: 'sent' } }, C, now, D).mode === 'first', '손(엑셀)으로 올린 장부 줄은 자동 첫 건 문에 안 셈');
  const sF = F.y24RegState({ ...e1, st: 'autofail', why: '미리보기에 안 보임', todo: '손으로 확인' }, C, now, D); ok(sF.k === 'stale' && /멈춤/.test(sF.t) && /할 일/.test(sF.t), '자동 올림 실패 줄 = ⚠ 확인 필요(까닭·할 일 · 「↩ 다시 올릴 수 있게」로 풂)');
  ok(F.y24RegState({ ...e1, st: 'sent', unsure: 1, why: '흐림' }, { adm: [{ no: '55', self: 'S1', at: now }], pub: [] }, now, D).k === 'listed', '결과가 흐려도 등록상품 읽기에 자체코드가 보이면 ✅');
  ok(!/alert\(|confirm\(|prompt\(/.test(cut('/* ══ 🤖 예스24 자동 올림', '/* (11/10 개편) 📤 예스24 이전 화면')) && !/01[016789]-?\d{3,4}-?\d{4}/.test(cut('/* ══ 🤖 예스24 자동 올림', '/* (11/10 개편) 📤 예스24 이전 화면')), '새 코드에 브라우저 창·휴대전화 번호 꼴 없음'); }

(async () => { if (!process.env.RN_PORT) { console.log(bad ? `❌ tY24AREG ${bad}개 실패` : '✓ tY24AREG 순수 셈 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  console.log('② 화면 — 가짜 번외 도우미');
  const H = require(path.join(process.cwd(), 'harness.js')); let reached = false;
  await H(async (p) => { const dialogs = []; p.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss().catch(() => {}); });
    const FK = { st: { ok: true, ver: 1, pc: 'HOME', ban: null, ok1: null, done: 0, wait: [], cur: null, res: {}, why: null, msg: '', login: 'ok', hold: false }, puts: [], acks: [] };
    await p.route(/^http:\/\/127\.0\.0\.1:8797\//, async (r) => { const u = new URL(r.request().url()); const J = (o, c) => r.fulfill({ status: c || 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(o) });
      if (u.pathname === '/y24/reg/state') return J(FK.st); if (u.pathname === '/y24/reg/put') { const b = JSON.parse(r.request().postData() || '{}'); FK.puts.push(b); FK.st.wait = [{ id: b.id, n: b.rows.length }]; return J({ ok: true, took: b.id }); }
      if (u.pathname === '/y24/reg/ack') { const b = JSON.parse(r.request().postData() || '{}'); FK.acks.push(...b.ids); b.ids.forEach((i) => delete FK.st.res[i]); return J({ ok: true }); } return J({ ok: false }, 404); });
    await p.evaluate(require(path.join(process.cwd(), 'seed.js'))); await p.waitForTimeout(400);
    try { await p.addScriptTag({ content: fs.readFileSync(path.join(__dirname, 'xlsx.full.min.js'), 'utf8') }); } catch (e) {}
    const setup = await p.evaluate(async () => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); clearTimeout(S._y24aT); if (!S.prodLoaded) await loadProducts(); await Wt(300); localStorage.setItem('rn-c2seen', '1'); localStorage.setItem('rn-device', 'HOME'); S.devOk = true;
      let i = 0; const L = [...S.plist.values()].filter((l) => aladinLive(l)).slice(0, 4); S.plist.forEach((l) => { l.sku = 'A01'; l.isbn13 = '97889000001' + String(10 + i).padStart(2, '0'); S.sku.map.set(l.id, { c: ['t' + String(2000 + i++)] }); }); S.ver++;
      S.y24.loaded = true; S.y24.adm = { t: Date.now(), m: new Map() }; S.app.platforms = { y24: {} }; y24RegWatch(); await Wt(300);
      S.regItems = S.regItems || new Map(); const mk = async (rid, l) => { const d = { stage: 'done', isbn: l.isbn13, grade: 2, qty: 1, price: +l.price || 9000, createdAt: new Date().toISOString(), info: { title: l.title, isbn13: l.isbn13, categories: [], page1: [] }, final: { price: +l.price || 9000, qty: 1, code: 'A01' }, result: { state: 'live', usedCode: String(l.id).replace(/^aladin_/, '') } }; await db.collection('reg_items').doc(rid).set(d); S.regItems.set(rid, { id: rid, ...d }); };
      await mk('rgA1', L[0]); S._regUn = S._regUn || (() => {}); for (const l of S.plist.values()) { const i = String(y24Isbn(l.isbn13)); S.y24e.tried.set(i, Date.now()); S.y24e.m.set(i, { none: true, page1: [], at: new Date().toISOString() }); } /* 예스24에 그 책 매물 없음(우리뿐) — 엔진 값이 정해짐 */ S._y24R = null;
      window.__L = L.map((l) => l.id); window.__mk = mk; return { n: L.length, want: y24WantLids().size, ok: y24RegRows().filter((r) => r.k === 'ok' && r.want).length }; });
    ok(setup.n >= 3 && setup.want === 1 && setup.ok === 1, '준비: 오늘 등록·알라딘 판매중 1건이 기본 켬으로 「등록에서 고름」', setup);
    const tick = () => p.evaluate(async () => { clearTimeout(S._y24aT); S._y24R = null; await y24AutoTick(); clearTimeout(S._y24aT); await new Promise((r) => setTimeout(r, 400)); return { why: Y24A.why, led: JSON.parse(JSON.stringify(y24RegLed())), auto: JSON.parse(JSON.stringify((S.y24.reg && S.y24.reg.auto) || {})) }; });
    let t = await tick(); const lid0 = (await p.evaluate(() => window.__L[0])); const e0 = t.led[lid0];
    ok(FK.puts.length === 1 && FK.puts[0].rows.length === 1 && FK.puts[0].rows[0].qty === 1 && FK.puts[0].rows[0].lid === lid0 && /^[A-Za-z0-9+/=]{100,}$/.test(FK.puts[0].xlsx) && e0 && e0.st === 'auto' && e0.auto === 1 && e0.job === FK.puts[0].id, '처음 1건: 장부에 먼저 적고(🤖 st auto) → 엑셀(바코드용 양식)과 함께 번외에 맡김 · 수량 1', { puts: FK.puts.map((x) => ({ id: x.id, n: x.rows.length })), e0, why: t.why });
    t = await tick(); ok(FK.puts.length === 1 && /올리는 중/.test(t.why), '결과 기다리는 동안 더 맡기지 않음', t.why);
    const jid = FK.puts[0].id; FK.st.wait = []; FK.st.res = { [jid]: { state: 'done', rows: [lid0], gno: { [lid0]: '300000001' }, msg: '올라감 — 판매중 1', at: Date.now() } }; FK.st.ok1 = Date.now(); FK.st.done = 1;
    t = await tick(); ok(t.led[lid0].ok === 1 && t.led[lid0].gno === '300000001' && t.led[lid0].st === 'sent' && FK.acks.includes(jid) && t.auto.last && t.auto.last.state === 'done', '✅ 결과 → 장부 올라감(예스24 번호 · 번외 자동 확인) · 받은 결과는 ack', { e: t.led[lid0], acks: FK.acks });
    const chip = await p.evaluate(() => y24wChip(S.regItems.get('rgA1'))); ok(/예스24 올라감/.test(chip), '등록 카드 칩: ✅ 예스24 올라감', chip);
    await p.evaluate(async () => { await window.__mk('rgA2', S.plist.get(window.__L[1])); await window.__mk('rgA3', S.plist.get(window.__L[2])); });
    t = await tick(); ok(FK.puts.length === 2 && FK.puts[1].rows.length === 2 && FK.puts[1].rows.every((r) => r.qty === 1), '첫 건 ✅ 뒤 저절로 다음 묶음(2건)', FK.puts.map((x) => x.rows.length));
    const j2 = FK.puts[1].id; const [l1, l2] = FK.puts[1].rows.map((r) => r.lid); FK.st.wait = []; FK.st.res = { [j2]: { state: 'fail', pre: true, rows: [l1, l2], msg: '엑셀을 넣었지만 미리보기 목록에 우리 줄이 안 보임 · [등록]은 누르지 않음', todo: '예스24 대량 등록 화면에서 같은 엑셀을 손으로 올려 보고 오류 글을 확인', at: Date.now() } };
    t = await tick(); ok(t.led[l1].st === 'autofail' && t.led[l2].st === 'autofail' && t.auto.stop && /미리보기/.test(t.auto.stop.why) && /손으로/.test(t.auto.stop.todo || ''), '⛔ 실패 결과 → 그 줄 멈춤(되풀이 막이 그대로) · 자동 올림 전체 멈춤 + 할 일', t.auto);
    await p.evaluate(async () => { await window.__mk('rgA4', S.plist.get(window.__L[3] || window.__L[0])); }); t = await tick(); ok(FK.puts.length === 2 && /멈춤/.test(t.why), '멈춘 동안엔 새로 맡기지 않음', t.why);
    const sc = await p.evaluate(async () => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); S._bt_y24reg = { q: '', lim: 60, sort: 'price', f: { k: 'led' } }; openY24Reg(); await Wt(500); const sh = document.getElementById('sheet'); const b = sh.querySelector('[data-y24arun]'); const o = { stopLine: /자동 올림 멈춤/.test(sh.textContent) && /할 일/.test(sh.textContent), btn: !!b, cfg: !!sh.querySelector('#y24r_auto') && !!sh.querySelector('#y24r_wdef') && !!sh.querySelector('#y24r_chunk') };
      b.click(); await Wt(200); o.arm = !!(S.y24.reg.auto || {}).stop; const b2 = document.querySelector('[data-y24arun]'); b2.click(); await Wt(800); clearTimeout(S._y24aT); o.resumed = !(S.y24.reg.auto || {}).stop; return o; });
    ok(sc.stopLine && sc.btn && sc.cfg, '📤 화면: ⛔ 까닭·할 일 줄 · [▶ 자동 올림 이어 가기] · ⚙ 칸(🤖 자동 올림·등록에서 기본 켬·묶음 건수)', sc);
    ok(sc.arm && sc.resumed, '[▶ 이어 가기]는 두 번 눌러야 풂(한 번은 아무것도 안 함)', sc);
    const sv = await p.evaluate(async () => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const sh = document.getElementById('sheet'); openY24Reg(); await Wt(400); const a = sh.querySelector('#y24r_auto'); a.checked = false; sh.querySelector('#y24r_cfg').click(); await Wt(600); clearTimeout(S._y24aT); const R = ((((window.__FS || {}).app_settings || {}).platforms || {}).y24 || {}).reg || {}; S.app.platforms = { ...(S.app.platforms || {}), y24: { reg: { ...R } } }; return { auto: R.auto, mq: R.maxQty, wd: R.wantDef }; }); /* 저장된 문서 그대로 봄 */
    ok(sv.auto === 0 && sv.wd === 1 && sv.mq === 1, '⚙ 저장: 🤖 자동 올림만 끄면 다른 칸(기본 켬·수량 상한)은 그대로', sv);
    await p.evaluate(() => { S.app.platforms.y24.reg = { ...S.app.platforms.y24.reg, auto: 1 }; localStorage.setItem('rn-device', 'MJ-MAIN'); }); const n0 = FK.puts.length; t = await tick(); ok(FK.puts.length === n0 && /MJ-MAIN/.test(t.why), 'MJ-MAIN 기기에선 자동 올림을 하지 않음(출고 보호)', t.why);
    await p.evaluate(() => localStorage.setItem('rn-device', 'HOME'));
    ok(!dialogs.length, '브라우저 창(alert/confirm/prompt) 0', dialogs); reached = true; }, { vp: { width: 1400, height: 900 } });
  ok(reached, '화면 시험이 끝까지 돎(중간 오류 없음)'); console.log(bad ? `❌ tY24AREG ${bad}개 실패` : '✓ tY24AREG 모두 통과'); process.exit(bad ? 1 : 0); })();

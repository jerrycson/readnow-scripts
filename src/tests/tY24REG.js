// tY24REG — (11/10) 📤 예스24에 새로 올리기(알라딘 → 예스24 바코드용 대량 등록 엑셀) · 🧾 통합 장부(읽기 전용)
//   ① 순수 셈: 웹앱 app.html의 ◆y24reg·◆ledger 덩어리만 떼어 돌림 — 후보 고르기·까닭 · 되풀이 0(장부·SKU) · 처음엔 한 건씩 · 올라감 판정 · 엑셀 칸 · 통합 장부 합계·위험
//   ② 화면(RN_PORT가 있을 때): harness로 웹앱을 열어 📤 화면·1건 미리 보기·두 번 누르기(한 번은 아무것도 안 함)·장부 기록·두 번째 확정 막힘 · 🧾 통합 장부 화면 · 브라우저 창(alert/confirm) 0
// 실행: node src/tests/tY24REG.js  · 화면까지: RN_PORT=<포트> node tY24REG.js (pw/ 안 · harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const F = new Function(cut('/* ◆y24reg 시작', '/* ◆y24reg 끝 */') + cut('/* ◆ledger 시작', '/* ◆ledger 끝 */') + '\nreturn { Y24R_BAN, Y24R_DEF, Y24R_HEAD, y24RegCfg, y24RegPrice, y24RegState, y24RegGate, y24RegJudge, y24RegAoa, y24RegFilter, ledBuild };')();
console.log('① 순수 셈');
{ const c = F.y24RegCfg({ day: '0', pct: 99, staleDays: 'x' }); ok(c.day === 0 && c.pct === 50 && c.staleDays === F.Y24R_DEF.staleDays && F.y24RegCfg({ day: 999 }).day === 300 && F.Y24R_DEF.day === 0, '설정 울타리(하루 상한 0=없음(기본 · 정범님 11/10)~300 · ±50% · 날 수 기본값)'); ok(F.y24RegPrice(12345, 0) === 12350 && F.y24RegPrice(10000, -10) === 9000 && F.y24RegPrice(0, 0) === 0, '판매가 10원 단위 · ±%'); }
const L = (o) => ({ id: 'aladin_U1', title: '시험 책', isbn: '9788900000001', grade: '상', price: 8000, qty: 1, live: true, skus: ['A01BC123PK'], dupes: false, adult: false, ...o });
const X0 = () => ({ onY24: new Map(), selfSet: new Set(), led: {}, ledSku: new Set(), cfg: F.Y24R_DEF });
{ const j = F.y24RegJudge(L(), X0()); ok(j.ok && j.row.isbn === '9788900000001' && j.row.self === 'A01BC123PK' && j.row.price === 8000 && j.row.qty === 1, '판매중·ISBN·등급·SKU 있음 → 올릴 줄(자체코드 = SKU)');
  const why = (o, X) => F.y24RegJudge(L(o), X || X0()).why || '';
  ok(/판매중 아님/.test(why({ live: false })) && /DUPES/.test(why({ dupes: true })) && /ISBN/.test(why({ isbn: null })) && /등급/.test(why({ grade: null })) && /판매가/.test(why({ price: 0 })) && /SKU 없음/.test(why({ skus: [] })) && /19금/.test(why({ adult: true })), '못 올리는 까닭 7가지(판매중 아님·미끼·ISBN·등급·판매가·SKU·19금)');
  ok(/새 책/.test(why({ title: '새책 같은 상태' })) && /새 책/.test(why({ title: '미개봉 박스' })) && F.y24RegJudge(L({ title: '새로운 시작' }), X0()).ok, "'새 책' 뜻 낱말은 막고 '새로운'은 통과");
  const X = X0(); X.led['aladin_U1'] = { st: 'sent', at: '2026-11-10T01:00:00Z' }; ok(/이미 올림/.test(why({}, X)), '되풀이 0 ① 장부에 있는 상품은 빠짐');
  const X2 = X0(); X2.led['aladin_U1'] = { st: 'retry', at: '2026-11-10T01:00:00Z' }; ok(F.y24RegJudge(L(), X2).ok, "사람이 '다시 올릴 수 있게' 푼 줄은 다시 후보");
  const X3 = X0(); X3.ledSku.add('A01BC123PK'); ok(/같은 SKU/.test(why({ id: 'aladin_U2' }, X3)), '되풀이 0 ② 다른 줄이라도 같은 SKU는 빠짐');
  const X4 = X0(); X4.selfSet.add('A01BC123PK'); ok(/자체코드/.test(why({}, X4)), '예스24 자체코드에 이미 있는 SKU는 빠짐');
  const X5 = X0(); X5.onY24.set('9788900000001|상', ['200000001']); ok(/같은 책·등급/.test(why({}, X5)) && F.y24RegJudge(L({ grade: '최상' }), X5).ok, '예스24에 같은 ISBN·등급이 있으면 빠짐(등급이 다르면 후보)');
  ok(F.y24RegJudge(L({ qty: 3, skus: ['S1', 'S2'] }), X0()).row.qty === 2, '재고 = 실물 SKU 수를 넘지 않음'); }
{ const aoa = F.y24RegAoa([{ isbn: '9788900000001', qty: 1, grade: '상', price: 8000, title: '시험 책(새책급)', self: 'A01BC123PK' }]);
  ok(aoa.length === 28 && aoa[26].slice(1).join('|') === F.Y24R_HEAD.join('|') && aoa[27][1] === '9788900000001' && aoa[27][7] === 'A01BC123PK' && aoa[27][4] === 8000 && !/새책/.test(aoa[27][5]) && aoa[27][10] === 1 && aoa[27][11] === 1, '엑셀: 27행 머리 B~L · 28행 바코드·재고·등급·판매가·상품명(금지 낱말 지움)·자체코드·판매상태·판매형태');
  const head = (T.match(/const Y24_XH = (\[[^\]]+\])/) || [])[1]; ok(head && JSON.stringify(eval(head)) === JSON.stringify(F.Y24R_HEAD), '🔗 연결 표 1줄 시험 엑셀과 같은 머리 칸'); }
{ const R = [{ lid: 'a', skus: ['S1'] }, { lid: 'b', skus: ['S2'] }, { lid: 'c', skus: ['S1'] }, { lid: 'd', skus: ['S3'] }]; const f = F.y24RegFilter(R, { b: { st: 'sent', skus: ['S2'] }, x: { st: 'retry', skus: ['S3'] } });
  ok(f.ok.map((r) => r.lid).join() === 'a,d' && f.skip.map((r) => r.lid).join() === 'b,c', '확정 직전 다시 보기: 장부 상품(b)·같은 묶음 안 같은 SKU(c) 뺌 · 풀린 줄의 SKU(d)는 됨'); }
{ const now = '2026-11-12T03:00:00Z'; const e = { lid: 'a', isbn: '9788900000001', grade: '상', skus: ['S1'], at: '2026-11-10T01:00:00Z', st: 'sent', before: ['111'] };
  ok(F.y24RegState(e, { adm: [], pub: [] }, '2026-11-10T05:00:00Z').k === 'wait', '올린 직후: 기다림');
  ok(F.y24RegState(e, { adm: [{ no: '222', ean: 'x', self: 'S9, S1', at: '2026-11-10T00:00:00Z' }], pub: [] }, now).k === 'listed', '자체코드 = 우리 SKU면 올라감(언제 읽었든)');
  ok(F.y24RegState(e, { adm: [], pub: [{ no: '333', isbn: '9788900000001', grade: '상', firstSeenAt: '2026-11-11T00:00:00Z' }] }, now).gno === '333', '같은 ISBN·등급 새 매물(올린 뒤 처음 보임)이면 올라감');
  ok(F.y24RegState(e, { adm: [], pub: [{ no: '111', isbn: '9788900000001', grade: '상', firstSeenAt: '2026-11-11T00:00:00Z' }, { no: '444', isbn: '9788900000001', grade: '상', firstSeenAt: '2026-11-09T00:00:00Z' }] }, '2026-11-10T05:00:00Z').k === 'wait', '올리기 전부터 있던 매물·예전 매물은 판정에 안 씀');
  ok(F.y24RegState(e, { adm: [], pub: [] }, '2026-11-14T03:00:00Z').k === 'stale' && F.y24RegState({ ...e, ok: 1 }, { adm: [], pub: [] }, now).k === 'listed', '3일 지나도 안 보이면 확인 필요 · 사람 확인이면 올라감');
  const G0 = F.y24RegGate({}, { adm: [], pub: [] }, now); const G1 = F.y24RegGate({ a: e }, { adm: [], pub: [] }, '2026-11-10T05:00:00Z'); const G2 = F.y24RegGate({ a: { ...e, ok: 1 }, b: { ...e, lid: 'b', at: '2026-11-12T01:00:00Z', day: '2026-11-12' } }, { adm: [], pub: [] }, now, { ...F.Y24R_DEF, day: 5 });
  ok(G0.mode === 'first' && G0.max === 1 && G1.mode === 'wait' && G1.max === 0 && G2.mode === 'bulk' && G2.max === 4, '처음엔 한 건씩: 비었으면 1건 → 결과 전엔 0건 → 올라간 뒤 하루 상한 − 오늘 올린 수'); }
{ const V = F.ledBuild({ now: '2026-11-10T03:00:00Z', days: 30, fee: { yes24: 0.1 },
    al: [{ id: 'aladin_U1', title: '책1', isbn: '9788900000001', grade: '상', price: 8000, qty: 1, live: true, st: '판매중', skus: ['S1'] }, { id: 'aladin_U2', title: '책2', isbn: '9788900000002', grade: '중', price: 5000, qty: 1, live: true, st: '판매중', skus: ['S2'] }, { id: 'aladin_U3', title: '책3', price: 3000, qty: 1, live: false, st: '판매중지', skus: [] }],
    y24: [{ no: '900', title: '책1', isbn: '9788900000001', grade: '상', price: 8500, stock: 1, live: true, self: 'S1', flags: [] }, { no: '901', title: '책9', isbn: '9788900000009', grade: '최상', price: 9000, stock: 1, live: true, self: '', alIds: [], flags: [] }, { no: '902', title: '책2', isbn: '9788900000002', grade: '중', price: 5000, stock: 2, live: true, self: '', alIds: ['aladin_U2'], flags: ['red', 'orange'] }],
    ord: [{ ch: 'aladin', no: 'o1', at: '2026-11-05T00:00:00Z', amt: 10000, fee: 1080, lines: [{ lid: 'aladin_U1', qty: 1, amt: 10000 }] }, { ch: 'yes24', no: 'y1', at: '2026-11-06T00:00:00Z', amt: 9000, lines: [{ sku: 'S2', qty: 1, amt: 9000 }] }, { ch: 'yes24', no: 'y0', at: '2026-09-01T00:00:00Z', amt: 7000, lines: [] }, { ch: 'cash', no: 'c1', at: '2026-11-07T00:00:00Z', amt: 3000, fee: 0, lines: [] }, { ch: 'yes24', no: 'y2', at: '2026-11-08T00:00:00Z', amt: 5000, cancel: true, lines: [] }],
    reg: [{ lid: 'aladin_U2', st: 'sent', k: 'wait' }, { lid: 'aladin_U3', st: 'retry' }] });
  const r1 = V.rows.find((r) => r.key === 'S1'); const r2 = V.rows.find((r) => r.key === 'S2'); const r9 = V.rows.find((r) => r.key === 'y24:901');
  ok(V.rows.length === 4 && r1.ch.yes24 && r1.ch.yes24.no === '900' && r2.ch.yes24.no === '902' && r9 && !r9.ch.aladin, '예스24 매물을 자체코드 = SKU → 🔗 짝 순서로 붙이고, 짝 없는 것은 따로 한 줄');
  ok(V.n.both === 2 && V.n.onlyY === 1 && V.n.none === 1 && V.n.onlyAl === 0, '어디에 올라 있나 셈(둘 다 2 · 예스24만 1 · 판매 안 함 1)');
  ok(r2.risk.includes('이중 판매 위험') && r2.risk.includes('예스24 재고 많음') && V.n.risk === 1 && V.n.reg === 1, '위험(🔗 연결 표 깃발) · 📤 올림 중(풀린 줄은 셈 안 함)');
  const s = V.sum; ok(s.aladin.ord === 1 && s.aladin.fee === 1080 && s.aladin.net === 8920 && s.yes24.ord === 1 && s.yes24.fee === 900 && s.yes24.net === 8100 && s.yes24.cancel === 1 && s.cash.amt === 3000 && s.cash.fee === 0, '판매처별 30일 주문·수수료(예스24 10%)·정산 어림 · 30일 밖·취소 뺌');
  ok(s.aladin.live === 2 && s.aladin.val === 13000 && s.yes24.live === 3 && s.yes24.qty === 4, '판매처별 판매중 줄·권·금액');
  ok(r1.ord.aladin.n === 1 && r2.ord.yes24.n === 1, '주문 줄을 상품(id)·SKU로 장부 줄에 붙임'); }
{ const blk = cut('/* ══════════ 📤 예스24 새로 올리기', '/* ══════════ 🟦 예스24 주문'); ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(blk) && !/\balert\(|\bconfirm\(|\bprompt\(/.test(blk), '새 코드에 휴대전화 번호 꼴·브라우저 창 없음');
  ok(/PAGE_GUIDES\['y24Reg'\]/.test(blk) && /PAGE_GUIDES\['ledger'\]/.test(blk) && /\['y24Reg', '📤 예스24에 새로 올리기', \(d\) => d\.bigTable === 'y24reg', 'openY24Reg'\]/.test(T) && /\['ledger', '🧾 통합 장부', \(d\) => d\.bigTable === 'ledger', 'openLedger'\]/.test(T), '화면 설명서·화면 목록(PG_SCR) 둘 다');
  ok(!/collection\('(inv_items|ch_links|ord_ch|led_days)'\)/.test(blk), '통합 장부는 새 칸에 쓰지 않음(읽기 전용 · 설계만)'); }
(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tY24REG ${bad}개 실패` : '✓ tY24REG 순수 셈 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  console.log('② 화면');
  await require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type() + ': ' + d.message().slice(0, 80)); d.dismiss().catch(() => {}); }); const dl = []; p.on('download', (d) => dl.push(d.suggestedFilename()));
    await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
    try { await p.addScriptTag({ content: fs.readFileSync(path.join(__dirname, 'xlsx.full.min.js'), 'utf8') }); } catch (e) {} /* 시험 PC는 cdnjs가 막힘 — npm xlsx 0.18.5(웹앱이 부르는 것과 같은 판) */
    const o = await p.evaluate(async () => { try { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {};
      let i = 0; S.plist.forEach((l, k) => { l.sku = 'A01'; l.isbn13 = '97889000000' + String(10 + i).padStart(2, '0'); S.sku.map.set(l.id, { c: ['t' + String(1000 + i++)] }); }); S.ver++;
      window.__xn = []; if (window.XLSX) { const w0 = XLSX.writeFile; XLSX.writeFile = (wb, n, o2) => { window.__xn.push(n); return w0(wb, n, o2); }; } S.y24.loaded = true; S.y24.adm = { t: Date.now(), m: new Map() }; S.app.platforms = { y24: {} };
      openY24Reg(); await Wt(500); const sh = document.getElementById('sheet'); o.open = sh.classList.contains('on') && /예스24에 새로 올리기/.test(sh.textContent);
      o.cand = y24RegRows().filter((r) => r.k === 'ok').length; o.btn = sh.querySelectorAll('[data-y24rone]').length; o.bulkDis = sh.querySelector('#y24r_bulk').disabled;
      const lid = sh.querySelector('[data-y24rone]').dataset.y24rone; sh.querySelector('[data-y24rone]').click(); await Wt(300); const pop = document.getElementById('y24rp'); o.pop = !!pop && /9788900000/.test(pop.textContent) && /자체코드/.test(pop.textContent);
      const go = pop.querySelector('#y24rp_go'); go.click(); await Wt(300); o.arm1 = /한 번 더/.test(go.textContent) && !Object.keys(y24RegLed()).length;
      go.click(); await Wt(1500); o.led = Object.keys(y24RegLed()); o.ent = y24RegLed()[lid] || null; o.popGone = !document.getElementById('y24rp'); o.xn = window.__xn.slice();
      o.again = y24RegRows().some((r) => r.k === 'ok' && r.row.lid === lid); o.ledRow = y24RegRows().some((r) => r.k === 'led' && r.e.lid === lid && r.s.k === 'wait');
      const res = await y24RegCommit(y24RegRows().filter((r) => r.k === 'ok').slice(0, 2).map((r) => r.row)); o.gate2 = res && res.gate.mode; o.n2 = res && res.ok.length;
      S._bt_y24reg.f.k = 'led'; openY24Reg(); await Wt(400); const okb = document.querySelector(`[data-y24rok="${lid}"]`); okb.click(); await Wt(200); okb.click(); await Wt(800); o.okMark = !!(y24RegLed()[lid] || {}).ok;
      const G = y24RegGate(y24RegLed(), y24RegC(), new Date().toISOString(), y24RegCfgNow()); o.gate3 = G.mode;
      openLedger(); await Wt(600); o.led1 = sh.classList.contains('on') && /통합 장부/.test(sh.textContent) && /자사 숍/.test(sh.textContent) && /예스24/.test(sh.textContent); o.ledRows = ledNow().rows.length; o.ledReg = ledNow().n.reg;
      o.go = GO_PAGES.some((g) => g[0] === 'ledger') && GO_PAGES.some((g) => g[0] === 'y24Reg'); o.feat = FEAT.filter((f) => /📤 예스24에 새로 올리기|🧾 통합 장부/.test(f.t)).length;
      return o; } catch (e) { return { err: e.message + ' · ' + JSON.stringify(o).slice(0, 400) }; } });
    if (o && o.err) { ok(false, '화면 시험 오류: ' + o.err); return; }
    if (!o) { ok(false, '화면 시험이 중간에 멈춤(ERRORS 보기)'); return; }
    console.log('   ', JSON.stringify({ ...o, ent: o.ent && { st: o.ent.st, skus: o.ent.skus, isbn: o.ent.isbn } }));
    ok(o.open && o.cand > 0 && o.btn > 0 && o.bulkDis, `📤 화면 열림 · 후보 ${o.cand} · 처음엔 여러 건 단추 꺼짐`);
    ok(o.pop && o.arm1, '1건 미리 보기 판 · 확정 한 번 누름 = 아무것도 안 함(한 번 더)');
    ok(o.led.length === 1 && o.ent && o.ent.st === 'sent' && o.ent.skus.length === 1 && o.popGone && dl.length === 1 && o.xn.length === 1 && /예스24_새로올리기_\d{8}_1줄\.xlsx/.test(o.xn[0]), `두 번째 누름 = 장부에 1줄 · 엑셀 1개 내려받음(${o.xn.join(',')})`);
    ok(!o.again && o.ledRow, '장부에 적은 상품은 후보에서 빠지고 장부 줄(⏳ 기다림)로');
    ok(o.gate2 === 'wait' && o.n2 === 0 && dl.length === 1, '첫 건 결과 전엔 더 못 올림(트랜잭션 안에서도 막힘 · 엑셀 안 생김)');
    ok(o.okMark && o.gate3 === 'bulk', "'올라감 확인'(두 번 누르기) 뒤 여러 건이 열림");
    ok(o.led1 && o.ledRows > 0 && o.ledReg === 1 && o.go && o.feat === 2, '🧾 통합 장부 화면 · 📤 올림 1 · 바로 가기·기능 찾기');
    ok(!dlg.length, '브라우저 창 0: ' + dlg.join(' / ')); });
  console.log(bad ? `❌ tY24REG ${bad}개 실패` : '✓ tY24REG 모두 통과'); process.exit(bad ? 1 : 0); })();

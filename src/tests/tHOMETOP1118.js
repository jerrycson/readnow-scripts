// tHOMETOP1118 — 정범님 11/18 12:08 「"오늘 출고 확실히 끝" 이 창은 닫는 방법이 뭐야? … 임시적 요소라면 없앨 수단도 마련 …
//   웹앱홈에서 오늘확인할것(알림)에 출고/문의 관련만 빨간 블록 … 나머지 시급한 건들은 분야에 따라 블록이되 다른 색」 (약속 A칸 100)
//  A ✅ 오늘 출고 확실히 끝 카드 — 끝(ok)일 때만 ✕ · ✕ = 오늘 하루 닫기(모든 기기 app_settings/main ship.osdayHide · 이 기기 localStorage도)
//  B 닫은 뒤 — 홈은 빈 자리표만 · 오늘 출고 화면은 「✅ 오늘 출고 상태 보기」 한 줄(누르면 다시 펼침 · ✕로 다시 접음)
//  C 진행·주의·문제(run·warn·bad)면 닫음과 상관없이 보임(✕ 없음) · 새 출고 세션이 끝나면(세션 수가 바뀜) 한 번 다시 보임 · 날이 바뀌면 다시 보임
//  D ⚙ 설정 ⑫ 출고 — 보이기 방식(늘·진행·문제일 때만·끔) · 「오늘 닫음 풀기」
//  E 홈 알림 분야 색 — 색표는 AL_CAT 한 곳 · 빨강은 출고·문의만 · 알림 블록마다 data-alc · 분야마다 바탕색이 다름 · 밝은·어두운 모양 둘 다 글자가 읽힘
//  F 끄기 — ⚙ 설정 ① 「홈 알림 분야 색」(이 기기 · 끄면 예전 급 색)
// 시험 자료 손님은 '손님A'… (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tHOMETOP1118.js
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const fs = require('fs'), path = require('path');
const appP = [path.join(__dirname, '..', 'app.html'), path.join(__dirname, 'app.html'), path.join(__dirname, '..', 'src', 'app.html')].find((f) => fs.existsSync(f));
const app = appP ? fs.readFileSync(appP, 'utf8') : '';
ok(!!app, '웹앱 원본을 찾음: ' + (appP || '없음'));
// 정적 — 색표는 한 곳 · 팝업 없음
{ ok((app.match(/^const AL_CAT = \[/gm) || []).length === 1, 'E 알림 분야 색표 AL_CAT은 한 곳에만 있음');
  const tb = (app.match(/^const AL_CAT = \[[\s\S]*?\];\n/m) || [''])[0];
  const reds = (tb.match(/c: '#B0322A'/g) || []).length; ok(reds === 1 && /id: 'ship'[^\n]*c: '#B0322A'/.test(tb), 'E 진한 빨강(#B0322A)은 출고·문의 분야 하나만: ' + reds);
  ok(/data-alc="\$\{alCatOf\(a\.key, \(a\.x \|\| \{\}\)\.k, a\.t\)\}"/.test(app), 'E 알림 블록 HTML에 분야(data-alc)를 붙임');
  const osd = (app.match(/^document\.addEventListener\('click', async \(e\) => \{ const b = e\.target\.closest && e\.target\.closest\('\[data-osdayx\][\s\S]*?\}, true\);\n/m) || [''])[0];
  ok(osd && !/\b(alert|confirm|prompt)\(/.test(osd), 'A ✕·다시 보기 처리에 브라우저 팝업 없음(토스트만)');
  ok(/id="st_osdaymode"/.test(app) && /id="st_alcat"/.test(app), 'D·F 설정 칸 둘(⑫ 출고 보이기 방식 · ① 홈 알림 분야 색)'); }
const H = require('./harness.js');
H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; window.ask = async () => true; S.user = S.user || { email: 'tester@x' }; const clk = (r, q) => { re(); const e = r && r.querySelector(q); if (e) e.click(); return !!e; };
    try { localStorage.removeItem('rn-osday-hide'); localStorage.removeItem('rn-alcat'); } catch (e) {}
    const day = osDay(), now = new Date().toISOString();
    let last = [[], []]; const setDay = (runs, docs) => { last = [runs, docs]; S.os.runsDay = day; S.os.runsUn = () => {}; S.os.runs = runs; S.os.doc = null; S._invL = true; S.invBs = docs; S._rckM = null; };
    const it = (orderNo, invoice, recipient) => ({ orderNo, invoice, recipient, state: 'done' });
    const run = (n, st, bt) => ({ id: `${day}_${n}`, n, day, status: st, createdAt: now, ph: st === 'done' ? 'DONE' : 'INV', bt });
    const r1 = run(1, 'done', [{ alpsId: 'HJ1', al: ['H-1', 'H-2'], n: 1, invDoc: 'alps_HJ1', invAsk: 'made', alps: { printed: 2, boxes: 2 } }]);
    const B1 = { id: 'alps_HJ1', os: r1.id, runId: 'HJ1', createdAt: now, status: 'done', items: [it('H-1', '222200001111', '손님A'), it('H-2', '222200002222', '손님B')], rck: { state: 'done', okN: 2, bad: [] } };
    const r2 = run(2, 'done', [{ alpsId: 'HJ2', al: ['H-3'], n: 1, invDoc: 'alps_HJ2', invAsk: 'made', alps: { printed: 1, boxes: 1 } }]);
    const B2 = { id: 'alps_HJ2', os: r2.id, runId: 'HJ2', createdAt: now, status: 'done', items: [it('H-3', '222200003333', '손님C')], rck: { state: 'done', okN: 1, bad: [] } };
    const B2bad = { ...B2, items: [it('H-3', '222200001111', '손님C')] }; /* 받는 분이 다른 주문에 같은 송장 → 🔴 송장 중복 */
    const re = () => setDay(last[0], last[1]); /* 흉내 Firestore는 쓰기마다 모든 구독을 다시 불러 세션·맡김 목록을 비움 — 볼 때마다 다시 넣음 */ const hidNow = () => { re(); return osdayHidden(osDaySum()); }; const card = (w) => { re(); return osDayCardHtml(w); };
    const B2wait = { ...B2, rck: null };
    S.app = S.app || {}; S.app.ship = { ...(S.app.ship || {}) }; delete S.app.ship.osdayHide; delete S.app.ship.osdayMode; S._osdayPeek = null;
    const box = document.createElement('div'); box.id = 'tz_osd'; document.body.appendChild(box);
    const put = () => { re(); box.innerHTML = osDayCardHtml('home') || '<i id="osday_home" class="osday-off" hidden></i>'; };
    const st = () => { const e = box.querySelector('#osday_home'); return e ? { card: e.classList.contains('card'), k: e.dataset.k || '', x: !!e.querySelector('[data-osdayx]'), hid: e.hasAttribute('hidden') } : null; };
    // A — 끝 카드에 ✕
    setDay([r1], [B1]); put(); o.A = st(); o.A0 = { D: (() => { try { const D = osDaySum(); return D && { ses: D.ses.length, done: D.done, tot: D.tot }; } catch (e) { return 'ERR ' + e.message; } })(), h: box.innerHTML.slice(0, 300) }; o.Atxt = /✅ 오늘 출고 확실히 끝/.test(box.textContent);
    { const e = box.querySelector('#osday_home'); const xb = e && e.querySelector('.osday-x'); const r = xb && xb.getBoundingClientRect(); o.Asz = r ? [Math.round(r.width), Math.round(r.height)] : null; }
    clk(box, '[data-osdayx]'); await W(400);
    o.B = st(); o.Bfs = JSON.parse(JSON.stringify((((window.__FS || {}).app_settings || {}).main || {}).ship || {})).osdayHide || null; o.Bls = (() => { try { return JSON.parse(localStorage.getItem('rn-osday-hide')); } catch (e) { return 'ERR'; } })();
    o.Btoast = [...document.querySelectorAll('.toast, #toast')].map((t) => t.textContent).join(' | ').slice(0, 300);
    // B — 오늘 출고 화면 자리 = 다시 보기 한 줄
    const sh1 = card('ship'); o.Bship = { peek: /data-osdaypeek/.test(sh1), card: /class="card osday"/.test(sh1) };
    const box2 = document.createElement('div'); box2.id = 'tz_osd2'; document.body.appendChild(box2); box2.innerHTML = sh1;
    clk(box2, '[data-osdaypeek]'); await W(150); { const e = box2.querySelector('#osday_ship'); o.Bpeek = { card: !!(e && e.classList.contains('card')), x: !!(e && e.querySelector('[data-osdayx]')), still: hidNow() }; }
    clk(box2, '#osday_ship [data-osdayx]'); await W(300); { const e = box2.querySelector('#osday_ship'); o.Bfold = { peekBtn: !!(e && e.querySelector('[data-osdaypeek]')), still: hidNow() }; }
    // C — 닫았어도 진행·문제면 보임
    setDay([r1, r2], [B1, B2bad]); put(); o.Cbad = st();
    setDay([r1, r2], [B1, B2wait]); put(); o.Cwait = st();
    setDay([r1, run(2, 'run', [{ alpsId: 'HJ2', al: ['H-3'] }])], [B1]); put(); o.Crun = st();
    setDay([r1, r2], [B1, B2]); put(); o.Cnew = st(); /* 새 세션이 끝남(1→2) → 한 번 다시 보임 */
    clk(box, '[data-osdayx]'); await W(300); o.Cnew2 = st();
    S.app.ship.osdayHide = { day: '2000-01-01', sig: '2000-01-01|2' }; try { localStorage.setItem('rn-osday-hide', JSON.stringify(S.app.ship.osdayHide)); } catch (e) {} put(); o.Cday = st(); /* 어제 닫음 → 오늘 보임 */
    // D — 설정 보이기 방식
    S.app.ship.osdayHide = null; try { localStorage.removeItem('rn-osday-hide'); } catch (e) {}
    S.app.ship.osdayMode = 'issue'; put(); o.Diss = st(); o.DissShip = /data-osdaypeek/.test(card('ship'));
    setDay([r1, r2], [B1, B2bad]); put(); o.DissBad = st();
    S.app.ship.osdayMode = 'off'; put(); o.Doff = st(); o.DoffShip = card('ship');
    S.app.ship.osdayMode = 'all'; setDay([r1, r2], [B1, B2]); put(); o.Dall = st();
    re(); const sx = osdaySetHtml(); o.Dset = { sel: /id="st_osdaymode"/.test(sx), opts: (sx.match(/<option value="(\w+)"/g) || []).length, unhide: /data-osdayshow/.test(sx) };
    clk(box, '[data-osdayx]'); await W(300); re(); const sx2 = osdaySetHtml(); o.Dset2 = /data-osdayshow/.test(sx2);
    const box3 = document.createElement('div'); document.body.appendChild(box3); box3.innerHTML = sx2; clk(box3, '[data-osdayshow]'); await W(400);
    o.Dunhide = { hid: hidNow(), fs: ((((window.__FS || {}).app_settings || {}).main || {}).ship || {}).osdayHide || null }; put(); o.Dafter = st();
    re(); box3.innerHTML = osdaySetHtml(); const se = box3.querySelector('#st_osdaymode'); se.value = 'issue'; se.dispatchEvent(new Event('change', { bubbles: true })); await W(400);
    o.Dsave = { mode: osdayMode(), fs: ((((window.__FS || {}).app_settings || {}).main || {}).ship || {}).osdayMode || null };
    S.app.ship.osdayMode = 'all'; box.remove(); box2.remove(); box3.remove();
    // E — 알림 분야 색
    const AL = [{ lv: 'top', t: '주문 확인 기다림 3건', key: 'shipconfirm' }, { lv: 'red', t: '손님 문의 2건', key: 'qna' }, { lv: 'top', t: '판매중 상품이 통합 장부와 어긋남', key: 'omni' },
      { lv: 'red', t: 'PC 수집기 멈춤', key: 'mgr' }, { lv: 'red', t: '최저가 아래 12개', key: 'under' }, { lv: 'amber', t: '백업 오래됨', key: 'backup' }, { lv: 'red', t: '매입 확인 1건', key: 'purissue' },
      { lv: 'amber', t: '7일 평가 나쁨', key: 'bad' }, { lv: 'info', t: '이것저것', key: 'zzz' }, { lv: 'red', t: '알 수 없는 자리', key: 'nope', x: { k: 'y24qa' } }];
    o.Emap = AL.map((a) => alCatOf(a.key, (a.x || {}).k, a.t));
    o.Ere = [alCatOf('', '', '송장 입력 못 한 주문 2건'), alCatOf('', '', '예스24 재고 어긋남'), alCatOf('', '', '아무 말')];
    const hb = document.createElement('div'); hb.id = 'tz_al'; hb.innerHTML = alertsHtml(AL); document.body.appendChild(hb); const c = hb.querySelector('.alerts'); try { alertsEnhance(c); } catch (e) { o.Eerr = e.message; } await W(200);
    const bg = () => [...hb.querySelectorAll('button.al')].map((b) => { const s = getComputedStyle(b); return { alc: b.dataset.alc, lv: b.className.replace(/\bal\b/, '').trim(), bg: s.backgroundColor, fg: s.color, bl: s.borderLeftColor, blw: s.borderLeftWidth }; });
    o.Ecol = bg(); o.Eleg = !!hb.querySelector('.alcatlg'); o.Elegn = hb.querySelectorAll('.alcatlg [data-alc]').length;
    // 미리 지은 알림 글(data-alc 없음)도 채움
    const pre = document.createElement('div'); pre.innerHTML = '<div class="alerts"><button class="al red" data-alert="late" data-aid="z|1">● 늦은 출고 1건</button><button class="al red" data-alert="prq" data-aid="z|2">● 가격 요청 실패</button></div>'; document.body.appendChild(pre);
    try { alertsEnhance(pre.querySelector('.alerts')); } catch (e) {} o.Epre = [...pre.querySelectorAll('button.al')].map((b) => b.dataset.alc); pre.remove();
    // 어두운 모양
    document.documentElement.setAttribute('data-theme', 'dark'); await W(700); o.Edark = bg(); document.documentElement.removeAttribute('data-theme');
    // F — 끄기
    try { localStorage.setItem('rn-alcat', '0'); } catch (e) {} alCatInit(); await W(700); o.Foff = { cls: document.documentElement.classList.contains('alcat-off'), col: bg().map((x) => x.bg) };
    try { localStorage.removeItem('rn-alcat'); } catch (e) {} alCatInit(); o.Fon = !document.documentElement.classList.contains('alcat-off');
    o.cat = AL_CAT.map((x) => ({ id: x.id, c: x.c, t: x.t, bg: x.bg, bg2: x.bg2, dc: x.dc, dt: x.dt, dbg: x.dbg }));
    hb.remove(); return o; });
  // 진짜 홈·오늘 출고 화면(닫은 뒤 자리 · 다시 보기)
  const R3 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const day = osDay(), now = new Date().toISOString();
    const r1 = { id: `${day}_1`, n: 1, day, status: 'done', createdAt: now, ph: 'DONE', bt: [{ alpsId: 'HJ1', al: ['H-1'], n: 1, invDoc: 'alps_HJ1', invAsk: 'made', alps: { printed: 1, boxes: 1 } }] };
    const B1 = { id: 'alps_HJ1', os: r1.id, runId: 'HJ1', createdAt: now, status: 'done', items: [{ orderNo: 'H-1', invoice: '222200001111', recipient: '손님A', state: 'done' }], rck: { state: 'done', okN: 1, bad: [] } };
    const put = async (c, x) => { const { id, ...v } = x; await db.collection(c).doc(id).set(v); }; await put('shp_runs', r1); await put('shp_invoices', B1); await W(300);
    const setDay = () => { S.os.runsDay = day; S.os.runsUn = () => {}; S.os.runs = [r1]; S.os.doc = null; S._invL = true; S.invBs = [B1]; S._rckM = null; };
    S.app.ship = { ...(S.app.ship || {}), osdayHide: null, osdayMode: 'all' }; S._osdayPeek = null; try { localStorage.removeItem('rn-osday-hide'); } catch (e) {}
    setDay(); S.detail = null; S.tab = 'home'; try { renderMainNow(); } catch (e) { o.err = e.message; } await W(500); setDay();
    const hm = () => { const e = document.querySelector('#osday_home'); return e ? (e.classList.contains('card') ? 'card:' + e.dataset.k + (e.querySelector('[data-osdayx]') ? '+x' : '') : 'hidden') : 'none'; };
    o.h0 = hm(); const x = document.querySelector('#osday_home [data-osdayx]'); if (x) { x.click(); await W(400); } o.h1 = hm();
    setDay(); S.shipTab = 'deliv'; S._shipRowsC = null; await openShip(); await W(700); setDay();
    const sh = () => { const e = document.querySelector('#sheet #osday_ship'); return e ? (e.classList.contains('card') ? 'card' : e.querySelector('[data-osdaypeek]') ? 'peek' : 'other') : 'none'; };
    o.s0 = sh(); const pk = document.querySelector('#sheet #osday_ship [data-osdaypeek]'); if (pk) { pk.click(); await W(200); } o.s1 = sh();
    return o; });
  const P = Object.assign({}, R); delete P.Ecol; delete P.Edark; delete P.cat; console.log(JSON.stringify(P).slice(0, 2400)); console.log(JSON.stringify(R3));
  ok(R.A && R.A.card && R.A.k === 'ok' && R.A.x && R.Atxt, 'A 끝(ok) 카드에 ✕ 닫기 단추: ' + JSON.stringify(R.A));
  ok(R.Asz && R.Asz[0] >= 32 && R.Asz[1] >= 32, 'A ✕ 단추 크기가 손가락으로 누를 만함(32px 이상): ' + JSON.stringify(R.Asz));
  ok(R.B && !R.B.card && R.B.hid, 'B ✕ 누르면 홈 자리에 카드가 사라짐(빈 자리표만): ' + JSON.stringify(R.B));
  ok(R.Bfs && R.Bfs.day && /\|1$/.test(R.Bfs.sig || '') && R.Bls && R.Bls.sig === R.Bfs.sig, 'B 닫음은 모든 기기(app_settings/main ship.osdayHide)와 이 기기에 저장 · 오늘 날짜와 세션 수: ' + JSON.stringify(R.Bfs && { day: R.Bfs.day, sig: R.Bfs.sig }));
  ok(/오늘 하루 닫았습니다/.test(R.Btoast) && /다시 보기/.test(R.Btoast), 'B 닫으면 토스트로 다시 보는 길을 알려 줌: ' + R.Btoast.slice(0, 140));
  ok(R.Bship.peek && !R.Bship.card, 'B 오늘 출고 화면엔 「✅ 오늘 출고 상태 보기」 한 줄: ' + JSON.stringify(R.Bship));
  ok(R.Bpeek.card && R.Bpeek.x && R.Bpeek.still, 'B 「상태 보기」 누르면 카드가 다시 펼쳐짐(닫음 기록은 그대로): ' + JSON.stringify(R.Bpeek));
  ok(R.Bfold.peekBtn && R.Bfold.still, 'B 펼친 카드의 ✕ = 다시 접기: ' + JSON.stringify(R.Bfold));
  ok(R.Cbad && R.Cbad.card && R.Cbad.k === 'bad' && !R.Cbad.x, 'C 닫았어도 문제(bad)면 카드가 보임 · ✕ 없음: ' + JSON.stringify(R.Cbad));
  ok(R.Cwait && R.Cwait.card && R.Cwait.k === 'run' && !R.Cwait.x, 'C 재검토 기다림(run)이면 보임: ' + JSON.stringify(R.Cwait));
  ok(R.Crun && R.Crun.card && R.Crun.k !== 'ok' && !R.Crun.x, 'C 세션이 아직 돌면 보임: ' + JSON.stringify(R.Crun));
  ok(R.Cnew && R.Cnew.card && R.Cnew.k === 'ok' && R.Cnew.x, 'C 새 출고 세션이 끝나면(세션 수 1→2) 끝 카드가 한 번 다시 보임: ' + JSON.stringify(R.Cnew));
  ok(R.Cnew2 && !R.Cnew2.card, 'C 다시 ✕ 하면 또 닫힘: ' + JSON.stringify(R.Cnew2));
  ok(R.Cday && R.Cday.card && R.Cday.x, 'C 어제 닫은 것은 오늘 다시 보임: ' + JSON.stringify(R.Cday));
  ok(R.Diss && !R.Diss.card && R.DissShip && R.DissBad && R.DissBad.card && R.DissBad.k === 'bad', 'D 「진행·문제일 때만」 — 끝 카드는 안 띄움(출고 화면엔 상태 보기 한 줄) · 문제면 띄움');
  ok(R.Doff && !R.Doff.card && !/class="card osday"|data-osdaypeek/.test(R.DoffShip), 'D 「끔」 — 문제일 때도 카드 없음(홈 알림은 그대로): ' + JSON.stringify(R.Doff));
  ok(R.Dall && R.Dall.card && R.Dset.sel && R.Dset.opts === 3 && !R.Dset.unhide, 'D 설정 ⑫ 보이기 방식 셋 · 닫지 않았으면 「오늘 닫음 풀기」 없음: ' + JSON.stringify(R.Dset));
  ok(R.Dset2 && !R.Dunhide.hid && R.Dunhide.fs === null && R.Dafter && R.Dafter.card, 'D 닫은 뒤 설정에 「오늘 닫음 풀기」 → 누르면 모든 기기에서 다시 보임: ' + JSON.stringify(R.Dunhide) + ' ' + JSON.stringify(R.Dafter));
  ok(R.Dsave.mode === 'issue' && R.Dsave.fs === 'issue', 'D 보이기 방식을 고르는 순간 저장(app_settings/main ship.osdayMode): ' + JSON.stringify(R.Dsave));
  ok(R.Emap.join() === 'ship,ship,link,pc,price,cloud,money,biz,etc,ship', 'E 알림 자리·종류 → 분야: ' + R.Emap.join());
  ok(R.Ere.join() === 'ship,link,etc', 'E 이름을 모르는 알림은 글로 짐작 · 그래도 모르면 그 밖: ' + R.Ere.join());
  ok(!R.Eerr && R.Ecol.every((x) => x.alc) && R.Ecol.length === 10, 'E 알림 블록마다 data-alc: ' + R.Ecol.map((x) => x.alc).join());
  const red = (s) => /rgb\(176, 50, 42\)/.test(s) || /rgb\(253, 236, 234\)/.test(s);
  const nonShip = R.Ecol.filter((x) => x.alc !== 'ship');
  ok(R.Ecol.filter((x) => x.alc === 'ship').every((x) => red(x.bg)) && nonShip.every((x) => !red(x.bg)), 'E 빨간 바탕은 출고·문의 블록만: ' + R.Ecol.map((x) => x.alc + ':' + x.bg).join(' | '));
  const reds = R.Ecol.filter((x) => /red/.test(x.lv)).map((x) => x.alc + '=' + x.bg); const rc = new Map(); R.Ecol.filter((x) => /red/.test(x.lv)).forEach((x) => rc.set(x.alc, x.bg)); const uniq = new Set(rc.values());
  ok(rc.size >= 4 && uniq.size === rc.size, 'E 같은 급(●)이라도 분야마다 바탕색이 다름: ' + reds.join(' · '));
  ok(R.Ecol.every((x) => x.blw === '5px' || (x.lv === 'info' && x.blw === '3px')), 'E 블록 왼쪽에 분야 띠: ' + R.Ecol.map((x) => x.blw).join());
  ok(R.Eleg && R.Elegn >= 7, 'E 알림 아래 분야 색 풀이(보이는 분야만): ' + R.Elegn);
  ok(R.Epre.join() === 'ship,price', 'E 미리 지은 알림 글(분야 표시 없음)도 다듬을 때 채움: ' + R.Epre.join());
  // 대비 — 밝은·어두운 모양 모두 글자/바탕 4.5:1 이상(큰 ❗ 블록은 흰/검은 글자)
  const rgb = (s) => (String(s).match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number); const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const [r, g, b] = c.map(f); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const cr = (a, b) => { const x = lum(rgb(a)), y = lum(rgb(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const low = []; for (const c of R.cat) { [['#fff', c.c], [c.t, c.bg], [c.t, c.bg2], [c.dt, c.dbg], ['#14110F', c.dc]].forEach(([f, b]) => { const h = (x) => x === '#fff' ? 'rgb(255,255,255)' : `rgb(${parseInt(x.slice(1, 3), 16)},${parseInt(x.slice(3, 5), 16)},${parseInt(x.slice(5, 7), 16)})`; const v = cr(h(f), h(b)); if (v < 4.5) low.push(`${c.id} ${f}/${b} ${v.toFixed(2)}`); }); }
  ok(!low.length, 'E 색표 모든 짝 글자 대비 4.5:1 이상(밝은·어두운): ' + (low.join(' · ') || '모두 통과'));
  ok(R.Edark.every((x, i) => x.bg !== R.Ecol[i].bg || x.lv === 'info'), 'E 어두운 모양에선 어두운 색표로 바뀜');
  ok(R.Foff.cls && R.Foff.col.filter((b, i) => R.Ecol[i].alc !== 'ship' && red(b)).length >= 3 && R.Fon, 'F 설정 ① 「홈 알림 분야 색」 끄면 예전처럼 급 색(빨강 ●·❗): ' + R.Foff.col.join(' | '));
  ok(R3.h0 === 'card:ok+x' && R3.h1 === 'hidden', 'B 진짜 홈 — 끝 카드 ✕ → 사라짐: ' + R3.h0 + ' → ' + R3.h1 + (R3.err ? ' ' + R3.err : ''));
  ok(R3.s0 === 'peek' && R3.s1 === 'card', 'B 진짜 오늘 출고 화면 — 닫은 뒤 「상태 보기」 한 줄 → 누르면 카드: ' + R3.s0 + ' → ' + R3.s1);
  console.log(bad ? `❌ tHOMETOP1118 실패 ${bad}` : '✓ tHOMETOP1118 통과'); process.exitCode = bad ? 1 : 0; }, {});

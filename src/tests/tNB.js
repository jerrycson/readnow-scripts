// tNB — 정범님 11/04 '미등록 상품은 검색으로 같은 책의 새상품을 찾아 판매·품절·절판 · 없으면 절판 가능성 높음(추정)'
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((x) => setTimeout(x, ms)); const o = {};
    localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; S.leader = true;
    const un = (id, uc, t, extra) => S.plist.set(id, { id, usedCode: uc, listingId: '40' + uc.slice(1), title: t, price: 7000, qty: 1, grade: '상', status: '판매중', active: true, registeredAt: '2026-11-01T10:00:00', ids: [{ kind: 'usedCode', v: uc }], ...(extra || {}) });
    un('aladin_U9001', 'U9001', '옛 시집 하나'); un('aladin_U9002', 'U9002', '사라진 책'); un('aladin_U9003', 'U9003', '애매한 책'); un('aladin_U9004', 'U9004', '아직 안 찾은 책');
    un('aladin_U9005', 'U9005', '판매 끝난 미등록', { active: false, status: '판매완료' });
    const F = window.__FS; F.prd_newbook = F.prd_newbook || {}; const now = new Date().toISOString();
    F.prd_newbook.aladin_U9001 = { k: 'aladin_U9001', st: 'found', at: now, q: '옛 시집 하나', nb: { itemId: '111', title: '옛 시집 하나', a: '손님A', pb: '어느출판', d: '1999-01-01', av: '품절', avNote: '품절 — 출판사 사정', how: 'auto', at: now, judge: { v: 'same', why: ['제목 같음', '출판사 같음'] } }, cands: [{ itemId: '111', title: '옛 시집 하나', cov: 1, vol: true, v: 'same' }, { itemId: '222', title: '옛 시집 하나 (개정판)', cov: 1, vol: true, v: 'diff', why: '출간 연도 다름' }], rej: [] };
    F.prd_newbook.aladin_U9002 = { k: 'aladin_U9002', st: 'none', at: now, q: '사라진 책', why: '검색에 같은 제목의 새상품이 없음', cands: [] };
    F.prd_newbook.aladin_U9003 = { k: 'aladin_U9003', st: 'unsure', at: now, q: '애매한 책', why: '제목은 같은데 지은이·출판사·출간 연도를 견줄 수 없음 — 사람이 골라 주세요', cands: [{ itemId: '333', title: '애매한 책', cov: 1, vol: true, v: 'unsure' }] };
    F.app_settings = F.app_settings || {}; F.app_settings.nb_find = { cfg: { dayCap: 3 }, cnt: {}, pend: {} };
    S.ver++; nbWatch(); await W(800);
    o.is = ['aladin_U9001', 'aladin_U215983410'].map((k) => nbIs(S.plist.get(k)));
    const L = (k) => S.plist.get(k);
    o.cardF = nbAvHtml(L('aladin_U9001'), 'card'); o.cardN = nbAvHtml(L('aladin_U9002'), 'card'); o.cardU = nbAvHtml(L('aladin_U9003'), 'card'); o.cardNo = nbAvHtml(L('aladin_U9004'), 'card'); o.normal = nbAvHtml(L('aladin_U215983410'), 'card');
    o.pc2 = prodCard2(L('aladin_U9002')).includes('절판 가능성 높음(추정)');
    // 출고 카드 — 추정은 판매가 평가(evalSale)에 넣지 않음 · 찾은 새책 상태만
    const ML = window.ReadnowML; const avs = []; const ev0 = ML && ML.evalSale; if (ML) ML.evalSale = (x) => { avs.push(x.av == null ? null : x.av); return ev0 ? ev0(x) : null; };
    const sv = (k) => saleEvalBits({ it: { price: 7000, listingId: L(k).listingId, title: L(k).title, grade: '상' }, l: L(k), gr: '상', P1: [], ono: 'O' + k, isC: true, src: 'confirm', at: now, final: false });
    o.shipN = sv('aladin_U9002').sub; o.shipF = sv('aladin_U9001').sub; o.shipU = sv('aladin_U9003').sub; if (ML) ML.evalSale = ev0; o.avs = avs;
    // 맡기기 — 아직 안 찾은 상품 먼저 · 하루 몫(3)까지 · 두 번 눌러도 같은 상품을 두 번 맡기지 않음
    o.due = nbDue().map((x) => x.l.id + ':' + x.r);
    const n1 = await nbTick(); await W(500); const n2 = await nbTick(); await W(300);
    const cmds = Object.values(F.shp_cmds || {}).filter((x) => x.type === 'nbFind'); o.q = { n1, n2, nCmd: cmds.length, items: cmds.length ? cmds[0].items.map((x) => x.k) : [], pend: Object.keys((F.app_settings.nb_find || {}).pend || {}), lab: cmds.length ? cmds[0].label : '' };
    // 상품 상세 — 새책 찾기 칸 · ✕ 이 새책이 아님(번호를 rej에 남기고 다시 찾기 맡김 · 기록 남음)
    openProduct('aladin_U9001'); await W(1500); const card = document.querySelector('.nbcard'); o.detail = card ? card.textContent : null;
    const rb = card && card.querySelector('[data-nbact="rej"]'); if (rb) { rb.click(); await W(800); }
    const D = F.prd_newbook.aladin_U9001; o.rej = { rej: D.rej, st: D.st, nb: D.nb, old: D.nbOld && D.nbOld.itemId, hist: (D.hist || []).map((h) => h.op) };
    const man = Object.values(F.shp_cmds || {}).filter((x) => x.type === 'nbFind' && x.manual); o.man = man.map((x) => x.items.map((y) => y.k + (y.full ? '+full' : '')).join());
    // ↩ 되돌리기 — 후보 줄에서
    await W(600); const ub = document.querySelector('.nbcard [data-nbact="unrej"][data-nbi="111"]'); if (ub) { ub.click(); await W(800); } o.unrej = (F.prd_newbook.aladin_U9001.rej || []).slice();
    // 후보 고르기
    const pk = document.querySelector('.nbcard [data-nbact="pick"][data-nbi="222"]'); if (pk) { pk.click(); await W(800); } o.pick = Object.values(F.shp_cmds || {}).filter((x) => x.type === 'nbFind' && x.items.some((y) => y.pick === '222')).length;
    // 추정 상품 상세 — 툴팁에 검색 시각·검색어·왜 추정
    openProduct('aladin_U9002'); await W(1200); const est = document.querySelector('.nbcard .nbest'); o.tip = est ? est.getAttribute('title') : null;
    // 설정
    S.detail = null; S.tab = 'settings'; S.sec = S.sec || {}; renderTabs(); renderMain(); await W(1200); const st = document.querySelector('.nbset'); o.set = st ? st.textContent.slice(0, 300) : null;
    const inp = st && st.querySelector('[data-nbcfg="dayCap"]'); if (inp) { inp.value = '25'; inp.dispatchEvent(new Event('change', { bubbles: true })); await W(600); } o.cfg = (F.app_settings.nb_find.cfg || {}).dayCap;
    // 설명서·기능 찾기
    const G = pgdDefs(); o.gProd = JSON.stringify(G.product).includes('새책 찾기'); o.gShip = JSON.stringify(G.ship).includes('절판 가능성 높음(추정)'); o.gSet = JSON.stringify(G.settings).includes('미등록 상품 새책 찾기'); o.feat = FEAT.some((f) => /미등록 상품 새책 찾기/.test(f.t));
    return o; });
  console.log(JSON.stringify(r).slice(0, 4000), errs.join('|'));
  let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
  ok(r.is[0] === true && r.is[1] === false, '미등록 상품만 대상(ISBN·도서 정보 있는 보통 상품은 아님)');
  ok(/새책 품절/.test(r.cardF) && /🔗/.test(r.cardF), '찾은 새책 상태를 상품 카드에(🔗) ' + r.cardF.slice(0, 60));
  ok(/nbest/.test(r.cardN) && /절판 가능성 높음\(추정\)/.test(r.cardN), "못 찾으면 '절판 가능성 높음(추정)'(다른 배경)");
  ok(/새책 모름/.test(r.cardU) && r.cardNo === '' && r.normal === '', "애매하면 '새책 모름' · 아직 안 찾은 것·보통 상품은 표시 없음");
  ok(r.pc2, '상품 카드(prodCard2)에 추정 표시');
  ok(/절판 가능성 높음\(추정\)/.test(r.shipN) && /sev-av/.test(r.shipF) && /품절/.test(r.shipF) && /새책 모름/.test(r.shipU), '출고 카드 판매·품절·절판 자리 — 찾은 새책 상태 · 추정 · 모름');
  ok(JSON.stringify(r.avs) === JSON.stringify([null, '품절', null]), "판매가 평가 재료: 추정·모름은 null(확정처럼 안 씀) · 찾은 새책만 '품절' " + JSON.stringify(r.avs));
  ok(r.due[0] === 'aladin_U9004:0' && !r.due.some((x) => /U9005|U9001|U9002|U9003/.test(x)), '맡길 차례 — 아직 안 찾은 것 먼저 · 판매 끝난 것·방금 찾은 것은 뺌 ' + r.due.slice(0, 4).join());
  ok(r.q.n1 >= 1 && r.q.n2 === 0 && r.q.nCmd === 1 && r.q.items.includes('aladin_U9004') && r.q.pend.includes('aladin_U9004') && r.q.items.length <= 3, '하루 몫까지 shp_cmds nbFind 하나 · 두 번 맡기지 않음 ' + JSON.stringify(r.q));
  ok(r.detail && /새책\(새상품\) 찾기/.test(r.detail) && /옛 시집 하나/.test(r.detail) && /이 새책이 아님/.test(r.detail), '상품 상세 🆕 새책 찾기 칸');
  ok(r.rej.rej && r.rej.rej.includes('111') && r.rej.st === 'unsure' && !r.rej.nb && r.rej.old === '111' && r.rej.hist.includes('rej'), '✕ 이 새책이 아님 — 번호를 rej에 · 예전 연결은 nbOld로(지우지 않음) · 기록 ' + JSON.stringify(r.rej));
  ok(r.man.some((x) => /aladin_U9001\+full/.test(x)), '빼고 나서 다시 찾기를 바로 맡김(사람이 누름) ' + r.man.join('|'));
  ok(!r.unrej.includes('111'), '↩ 되돌리기 — rej에서 거둠 ' + JSON.stringify(r.unrej));
  ok(r.pick >= 1, "후보에서 '이 새책으로 정하기' → pick으로 맡김");
  ok(r.tip && /검색 시각/.test(r.tip) && /검색어: '사라진 책'/.test(r.tip) && /왜 추정/.test(r.tip), '추정 툴팁: 검색 시각·검색어·왜 추정');
  ok(r.set && /미등록 상품 새책 찾기/.test(r.set) && r.cfg === 25, '⚙ 설정 칸 · 하루 몫 바꾸면 app_settings/nb_find.cfg ' + r.cfg);
  ok(r.gProd && r.gShip && r.gSet && r.feat, '화면 설명서(상품 상세·출고·설정)·기능 찾기');
  ok(!errs.length, '페이지 오류 없음');
  console.log(bad ? `❌ tNB 실패 ${bad}` : '✓ tNB 통과'); process.exit(bad ? 1 : 0);
});

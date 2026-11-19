// tMKREF1 — 정범님 11/19 19:16 Ⓓ·Ⓔ
//  Ⓓ 오늘 출고 ① 확인 탭 「🔄 전체 시장 지표 갱신」 옆 「📝 유의 사항 전체 갱신」 · 📦 준비 탭에도 두 전체 갱신 · 두 탭 모든 카드 「📊 이 시장 지표 갱신」
//  Ⓔ 웹앱의 모든 시장 지표 블록에 그 블록 다른 판매자 매물 모두의 유의 사항을 다시 읽는 「📝 판매자 유의 사항」
//  확인: 단추가 있음(확인·준비·카드·공용 블록) · 누르면 판매자 목록이 맡김 줄(shp_cmds peerNote)에 들어감 · 1시간 안에 읽은 매물은 건너뜀 · 한 번 최대 개수를 지킴
//  · 클라우드가 peerNote를 받아 공개 화면 길로 읽고, 📦 준비 탭 시장 갱신(deliv)을 목록에서 빠진 것으로 보지 않음(원본 글 확인)
// 시험 자료 손님은 '손님A'… (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tMKREF1.js
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const fs = require('fs'), path = require('path');
require('./harness.js')(async (p) => {
  await p.addInitScript(() => { const now = Date.now(); const iso = (ms) => new Date(ms).toISOString(); const FS = (window.__FS = window.__FS || {});
    const rows = (base, n) => Array.from({ length: n || 6 }, (_, i) => ({ r: i + 1, g: ['상', '중', '최상'][i % 3], p: 3000 + i * 500, lid: String(base + i), sc: String(20 + i), n: '판매자' + i, c: 'green' }));
    const it = (lid, t, pr) => ({ listingId: lid, title: t, price: pr, qty: 1, grade: '상', sku: 'BLKAAA_ms' });
    FS.shp_enrich = { 501: { listingId: '501', at: iso(now), grade: '상', itemId: '91', via: 'ours', mkt: { at: iso(now - 60e3), usedTotal: 12, rows: rows(7000), item: '91', isbnOk: true } },
      601: { listingId: '601', at: iso(now), grade: '상', itemId: '92', via: 'ours', mkt: { at: iso(now - 60e3), usedTotal: 9, rows: rows(8000), item: '92', isbnOk: true } } };
    FS.prd_used_info = { 7000: { __id: '7000', listingId: '7000', checkedAt: iso(now - 10 * 60e3), found: true, note: '' }, /* 10분 전 읽음 → 건너뜀 */ 7001: { __id: '7001', listingId: '7001', checkedAt: iso(now - 3 * 3600e3), found: true, note: '' } /* 3시간 전 → 다시 읽음 */ };
    FS.shp_state = { confirm: { orders: [{ orderNo: 'C-1', buyer: '손님A', orderedAt: '2026-11-19 09:10', items: [it('501', '확인 탭 책', 5000)] }], at: iso(now), sig: 's1' },
      current: { orders: [{ orderNo: 'D-1', buyer: '손님B', orderedAt: '2026-11-19 08:00', items: [it('601', '준비 탭 책', 6000)] }], at: iso(now), tabCounts: {}, sig: 'c1' } };
    try { localStorage.setItem('rn-ship-mkt', '1'); localStorage.setItem('rn-ship-view', 'order'); localStorage.removeItem('rn-ship-mkfold'); localStorage.removeItem('rn-mkpeer-max'); localStorage.removeItem('rn-mkt-all'); } catch (e) {} });
  await p.evaluate(async () => { try { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); } catch (e) {} });
  await p.goto('http://localhost:' + (process.env.RN_PORT || 8765) + '/app/index.html?go=confirm'); await p.waitForTimeout(4500); await p.addStyleTag({ content: '.verbar{display:none!important}' });
  const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const sh = () => document.getElementById('sheet'); const q = (s) => sh().querySelector(s);
    const cmds = () => Object.entries(window.__FS.shp_cmds || {}).map(([id, v]) => ({ id, ...v }));
    const twice = async (sel) => { const a = typeof sel === 'string' ? q(sel) : sel(); if (!a) return false; a.click(); await W(550); const b = typeof sel === 'string' ? q(sel) : sel(); if (!b) return false; b.click(); await W(900); return true; };
    if (S.shipTab !== 'confirm') { S.shipTab = 'confirm'; await openShip(); await W(900); }
    o.tab1 = S.shipTab; o.mkre1 = (q('#shp_mkre') || {}).textContent || ''; o.pnall1 = (q('#shp_pnall') || {}).textContent || ''; o.max1 = !!q('[data-mkpnmax]'); o.card1 = !!q('[data-mkre="501"]') && !(q('[data-mkre="501"]').dataset.mkredl);
    o.blkPn = !!q('.shp-blk2 [data-mkpn]') || !!q('.mktw [data-mkpn]'); o.side = !!(q('#shp_mkre') && q('#shp_pnall') && q('#shp_mkre').parentElement === q('#shp_pnall').parentElement);
    // ① 확인 탭 📝 유의 사항 전체 갱신 — 두 번 눌러 맡김 · 10분 전에 읽은 7000은 건너뜀
    const n0 = cmds().length; o.armed = await twice('#shp_pnall'); const pn = cmds().filter((x) => x.type === 'peerNote'); o.pn1 = pn[0] || null; o.nNew = cmds().length - n0; o.pnst = (document.getElementById('shp_pnst') || {}).innerText || '';
    // 한 번만 누르면 맡기지 않음(두 번 눌러 맡김)
    const c1 = cmds().length; const b1 = q('#shp_pnall'); if (b1) b1.click(); await W(600); o.oneClick = cmds().length === c1; await W(4200);
    // ② 카드 「📊 이 시장 지표 갱신」 — 상품 하나 시장 다시 읽기(type market rerd)
    const cb = q('[data-mkre="501"]'); if (cb) cb.click(); await W(700); o.one1 = cmds().find((x) => x.type === 'market' && x.one && (x.listingIds || []).join() === '501') || null;
    // ③ 공용 시장 블록 📝 판매자 유의 사항 — 그 블록 매물 · 최대 개수 2
    try { localStorage.setItem('rn-mkpeer-max', '2'); } catch (e) {} o.maxV = mkPeerMax(); const nb = cmds().length;
    await twice(() => q('.shp-blk2[data-mklid="501"] [data-mkpn]') || q('[data-mkpn]')); const pb = cmds().filter((x) => x.type === 'peerNote' && /시장 블록/.test(x.label || '')); o.pb = pb[pb.length - 1] || null; o.nb = cmds().length - nb;
    // ④ 고르기 규칙 — 1시간 안 건너뜀 · 우리·검색 줄 뺌 · 같은 매물 한 번 · 최대
    const U = new Map([['11', { checkedAt: new Date(Date.now() - 30 * 60e3).toISOString() }], ['12', { checkedAt: new Date(Date.now() - 2 * 3600e3).toISOString() }], ['13', { checkedAt: new Date().toISOString(), found: false }]]);
    o.pick = mkPeerPick([{ lid: '11' }, { lid: '12' }, { lid: '12' }, { lid: '13' }, { lid: '14', c: 'ours' }, { lid: '15', srch: 1 }, { lid: '16' }, { lid: '17' }, { lid: 'x' }], U, Date.now(), 60, 2);
    try { localStorage.setItem('rn-mkpeer-max', '9999'); } catch (e) {} o.maxHi = mkPeerMax(); try { localStorage.removeItem('rn-mkpeer-max'); } catch (e) {} o.maxDef = mkPeerMax();
    // 「최대」 칸을 바꾸면 이 기기에 기억
    const mi = q('[data-mkpnmax]'); if (mi) { mi.value = '7'; mi.dispatchEvent(new Event('change', { bubbles: true })); } await W(100); o.maxSet = (() => { try { return localStorage.getItem('rn-mkpeer-max'); } catch (e) { return null; } })(); try { localStorage.removeItem('rn-mkpeer-max'); } catch (e) {}
    // ⑤ 📦 준비 탭 — 두 전체 갱신 · 카드 단추(deliv) · 전체 시장 갱신 deliv
    S.shipTab = 'deliv'; S._shipCapN = 0; await openShip(); await W(1200); o.tab2 = S.shipTab;
    o.act2 = !!q('.shp-mkact'); o.mkre2 = (q('#shp_mkre') || {}).textContent || ''; o.pnall2 = (q('#shp_pnall') || {}).textContent || ''; const c2 = q('[data-mkre="601"]'); o.card2 = !!c2 && c2.dataset.mkredl === '1';
    o.peer2 = shipPeerRows().rows.map((r) => r.lid);
    const m0 = cmds().length; const mb = q('#shp_mkre'); if (mb) mb.click(); await W(900); o.mkAll2 = cmds().slice(m0).find((x) => x.type === 'market' && x.rerd && !x.one) || null;
    if (c2) { c2.click(); await W(700); } o.one2 = cmds().find((x) => x.type === 'market' && x.one && (x.listingIds || []).join() === '601') || null;
    o.feat = (typeof FEAT !== 'undefined' ? FEAT : []).map((f) => f.t).filter((t) => /유의 사항 전체 갱신|이 시장 지표 갱신|판매자 유의 사항|전체 시장 지표 갱신/.test(t)).length;
    o.shl = typeof SHL_T !== 'undefined' && !!SHL_T.peerNote; o.cl = typeof CHANGELOG !== 'undefined' && !!CHANGELOG[APP_VER] && APP_VER;
    o.reg = (window.ReadnowRegistry && window.ReadnowRegistry.KINDS && window.ReadnowRegistry.KINDS.peerNote) || null;
    o.overflow = document.documentElement.scrollWidth > window.innerWidth + 1; return o; });
  console.log(JSON.stringify(R).slice(0, 2500));
  ok(R.tab1 === 'confirm' && /전체 시장 지표 갱신/.test(R.mkre1) && /유의 사항 전체 갱신/.test(R.pnall1) && R.side && R.max1, '① 확인 탭: 「🔄 전체 시장 지표 갱신」 옆에 「📝 유의 사항 전체 갱신」 · 「최대」 칸');
  ok(R.card1, '① 확인 탭 카드마다 「📊 이 시장 지표 갱신」');
  ok(R.blkPn, '공용 시장 지표 블록에 「📝 판매자 유의 사항」');
  const L1 = (R.pn1 && R.pn1.listingIds) || [];
  ok(R.armed && R.pn1 && R.pn1.status === 'queued' && L1.length === 5 && !L1.includes('7000') && L1.includes('7001') && R.pn1.skipped === 1 && !L1.includes('501'), '전체 갱신을 두 번 누르면 시장 지표의 다른 판매자 5개를 맡김(10분 전 읽은 1개 건너뜀 · 우리 상품 뺌) ' + L1.join());
  ok(R.pn1 && R.pn1.devName !== undefined && !('dev' in R.pn1) && Array.isArray(R.pn1.rows) && R.pn1.rows.some((r) => r.sc) && R.pn1.max === 100, '맡김 문서: 판매자 코드 함께 · 기본 최대 100 · dev 칸 안 씀(클라우드가 90초 미루지 않게)');
  ok(/📝/.test(R.pnst), '진행 줄을 탭 안에 작게 ' + R.pnst.slice(0, 80));
  ok(R.oneClick, '한 번만 누르면 맡기지 않음(두 번 눌러 맡김)');
  ok(R.one1 && R.one1.rerd && R.one1.rejudge === false && !R.one1.deliv && R.one1.status === 'queued' && (R.one1.orderNos || []).join() === 'C-1', '카드 「📊 이 시장 지표 갱신」 → 그 상품 하나 시장 다시 읽기 맡김(다시 판단 안 함)');
  ok(R.maxV === 2 && R.pb && (R.pb.listingIds || []).length === 2 && R.pb.over >= 1 && R.pb.max === 2, '최대 개수를 지킴(최대 2 → 2개만 · 넘은 것 기록) ' + JSON.stringify(R.pb && R.pb.listingIds));
  ok(R.pick && R.pick.rows.map((r) => r.lid).join() === '12,13' && R.pick.fresh === 1 && R.pick.over === 2 && R.pick.total === 5, '고르기: 1시간 안 건너뜀 · 못 찾은 기록은 다시 · 우리·검색 줄·같은 매물 한 번 · 최대 2 ' + JSON.stringify(R.pick));
  ok(R.maxHi === 300 && R.maxDef === 100 && R.maxSet === '7', '최대 칸: 기본 100 · 300 넘지 않음 · 바꾸면 이 기기에 기억');
  ok(R.tab2 === 'deliv' && R.act2 && /전체 시장 지표 갱신/.test(R.mkre2) && /유의 사항 전체 갱신/.test(R.pnall2), '📦 준비 탭에도 두 전체 갱신');
  ok(R.card2, '📦 준비 탭 카드에도 「📊 이 시장 지표 갱신」(준비 탭 표시)');
  ok(R.peer2.length === 6 && R.peer2.includes('8000'), '📦 준비 탭 유의 사항 전체 갱신 대상 = 그 탭 주문 상품 시장 지표의 다른 판매자 ' + R.peer2.join());
  ok(R.mkAll2 && R.mkAll2.deliv === true && R.mkAll2.rejudge === false && (R.mkAll2.listingIds || []).includes('601'), '📦 준비 탭 「전체 시장 지표 갱신」 → 발송 요청 상품 시장 다시 읽기(deliv · 판단 안 함)');
  ok(R.one2 && R.one2.deliv === true, '📦 준비 탭 카드 갱신은 deliv 표시');
  ok(R.feat >= 4 && R.shl && R.cl, '🔍 찾기 낱말 · 🛰 지금 실행 중 이름 · 업데이트 기록 ' + R.feat + ' ' + R.cl);
  ok(R.reg && (R.reg.by || []).includes('cloud'), '노선표에 peerNote 종류(클라우드)');
  ok(!R.overflow, '가로 넘침 없음');
  // 클라우드 원본 — peerNote 받기 · 공개 화면 길 · 준비 탭 deliv
  const cand = [path.join(__dirname, '..', '..', 'cloud', 'index.js'), path.join(__dirname, '..', '..', '..', 'cloud', 'index.js'), process.env.RN_GIT_REPO ? path.join(process.env.RN_GIT_REPO, 'cloud', 'index.js') : ''].filter(Boolean);
  const cf = cand.find((f) => fs.existsSync(f)); const C = cf ? fs.readFileSync(cf, 'utf8') : '';
  ok(/v\.type === 'peerNote'/.test(C) && /async function peerAskTick/.test(C) && /'peerNote'\]\.includes\(t\)/.test(C), '클라우드: peerNote 맡김을 받고 읽음(peerAskTick)');
  ok(/function peerSave/.test(C) && /peerRead\(/.test(C.slice(C.indexOf('async function peerAskTick'), C.indexOf('async function peerAskTick') + 4000)), '클라우드: 출고 시장 자동과 같은 공개 화면 길(peerRead)·같은 저장(peerSave)');
  ok(/function enrSrc/.test(C) && /J\.deliv && liveD\.has/.test(C) && /deliv: !!v\.deliv/.test(C), '클라우드: 📦 준비 탭 시장 갱신(deliv)도 보강 · 목록에서 빠진 것으로 안 봄');
  console.log(bad ? `❌ tMKREF1 실패 ${bad}` : '✓ tMKREF1 통과'); });

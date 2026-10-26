// (10/26 wN) 📝 출고 시장 블록 — 다른 판매자 유의 사항 '?' (중 전부 · 상 전후) · 툴팁 · 읽는 중/글 없음 · 서버에서 받아 그 칸만 바뀜
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const R = await p.evaluate(async () => { const now = Date.now(); const iso = (ms) => new Date(ms).toISOString(); const RP = window.ReadnowProducts;
    const rows = [{ r: 1, g: '상', p: 3000, lid: 's1', sc: '11', n: '가', c: 'green' }, { r: 2, g: '중', p: 3500, lid: 'm1', sc: '12', n: '나', c: 'green' }, { r: 3, g: '상', p: 4800, lid: 's2', sc: '13', n: '다', c: 'green' },
      { r: 4, g: '중', p: 4900, lid: 'm2', sc: '14', n: '라', c: 'red' }, { r: 5, g: '상', p: 5200, lid: 's3', sc: '15', n: '마', c: 'green' }, { r: 6, g: '중', p: 6000, lid: 'm3', sc: '16', n: '바', c: 'green' },
      { r: 7, g: '중', p: 7000, lid: 'm4', sc: '17', n: '사', c: 'green', so: 1 }, { r: 8, g: '상', p: 9000, lid: 's4', sc: '18', n: '아', c: 'green' }, { r: 9, g: '최상', p: 5100, lid: 'x1', sc: '19', n: '자', c: 'green' }];
    const out = {}; out.tg = RP.peerNoteTargets(rows, { g: '중', p: 5000 }).map((t) => t.lid + ':' + t.why);
    S.uinfo = S.uinfo || new Map(); S.uinfo.set('m1', { note: '모서리 눌림\n밑줄 3쪽', photos: [{ src: 'https://image.aladin.co.kr/x.jpg', where: 'desc' }], checkedAt: iso(now - 3600e3), found: true, hasNote: true, sellerName: '나' });
    S.uinfo.set('m2', { note: '', photos: [], checkedAt: iso(now - 3600e3), found: true, hasNote: false });
    window.__FS.prd_used_info = window.__FS.prd_used_info || {}; window.__FS.prd_used_info.m3 = { __id: 'm3', note: '물 얼룩', photos: [], checkedAt: iso(now), found: true, hasNote: true }; // 클라우드가 방금 읽어 둔 것 — 화면은 서버에서 받아 바꿈
    S.shpEnrich = new Map([['L1', { grade: '중', at: iso(now), uiAt: iso(now), note: '우리 책 상태', itemId: '777', via: 'ours', mkt: { at: iso(now - 60e3), usedTotal: 9, rows, item: '777', isbnOk: true } }]]);
    S._shipLive = 1; S.shipC = { orders: [{ orderNo: '888001', buyer: '김시험', orderedAt: '2026-10-26 10:00', items: [{ listingId: 'L1', title: '시험책', price: 5000, qty: 1, grade: '중' }] }], at: iso(now) }; window.__FS.shp_state = window.__FS.shp_state || {}; window.__FS.shp_state.confirm = { ...S.shipC, sig: 'x' }; window.__FS.shp_enrich = window.__FS.shp_enrich || {}; window.__FS.shp_enrich.L1 = { ...S.shpEnrich.get('L1'), listingId: 'L1' }; S.shipTab = 'confirm';
    await openShip(); await new Promise((r) => setTimeout(r, 900));
    const cell = (id) => document.querySelector(`#sheet .pq-q[data-qlid="${id}"]`); const st = (id) => { const c = cell(id); return c ? { t: c.textContent, nt: c.dataset.nt || null, title: c.title, cls: c.className } : null; };
    out.c = Object.fromEntries(['m1', 'm2', 'm3', 'm4', 's1', 's2', 's3', 's4', 'x1'].map((k) => [k, st(k)]));
    // 누르면 팝업 · 아무 데나 누르면 닫힘
    cell('m1').click(); await new Promise((r) => setTimeout(r, 300)); const pop = document.querySelector('.uipop'); out.pop = pop ? pop.textContent.slice(0, 200) : null;
    await new Promise((r) => setTimeout(r, 400)); document.querySelector('#sheet').dispatchEvent(new MouseEvent('click', { bubbles: true })); document.body.click(); await new Promise((r) => setTimeout(r, 200)); out.popClosed = !document.querySelector('.uipop');
    // 예전 시장 지표(주문 뒤 읽은 것 아님)에는 붙지 않음
    out.noOld = !document.querySelector('#sheet .pq-q[data-nt]') ? 'none' : 'some'; history.back(); await new Promise((r) => setTimeout(r, 200));
    const h = prBlocks({ page1: rows.map((w) => ({ ...w })), noTools: 1, me: { g: '중', p: 5000 } }); out.oldHas = /data-nt=/.test(h);
    return out; });
  console.log(JSON.stringify(R, null, 1), errs.join('|'));
  const c = R.c;
  const ok = JSON.stringify(R.tg) === JSON.stringify(['m2:mid', 'm3:mid', 'm1:mid', 's2:sangLo', 's1:sangLo', 's3:sangHi', 's4:sangHi'])
    && c.m1 && c.m1.t === '?' && c.m1.nt === 'mid' && /모서리 눌림/.test(c.m1.title) && /밑줄 3쪽/.test(c.m1.title) && /사진 1장/.test(c.m1.title) && /읽은 때/.test(c.m1.title)
    && c.m2 && c.m2.t === '–' && /글 없음/.test(c.m2.title)
    && c.m3 && c.m3.t === '?' && /물 얼룩/.test(c.m3.title) // 서버에서 받아 그 칸만 바뀜
    && c.s2 && c.s2.nt === 'sangLo' && c.s2.t === '…' && /아직 못 읽음/.test(c.s2.title) && c.s3 && c.s3.nt === 'sangHi'
    && c.s1 && c.s1.nt === 'sangLo' && c.s4 && c.s4.nt === 'sangHi' && c.x1 && !c.x1.nt && c.m4 && !c.m4.nt // 상 전후 밖·최상·판매 끝은 표시 없음
    && R.pop && /모서리 눌림/.test(R.pop) && R.popClosed && !R.oldHas && !errs.length;
  console.log(ok ? '✓ tN 통과' : '❌ tN 실패');
});

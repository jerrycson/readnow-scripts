// tSKU10 — 정범님 11/04 '[서가 3][고유 5][매입처 2] 10글자 · 일반·기존보유 EX'
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((x) => setTimeout(x, ms));
    S.app = S.app || {}; S.app.reg = { ...(S.app.reg || {}), srcX: [{ id: 'xck', suffix: '_ck', name: '클리어킹', at: '2026-11-03T03:10:00Z' }, { id: 'xbb', suffix: '_bbs', name: '옛 매입처', at: '2026-10-22T00:00:00Z' }], hide: { src: ['xbb'] } }; S._supC = null;
    const mk = (id, sku, c) => { S.plist.set(id, { id, listingId: id.slice(1), title: '책 ' + id, status: '판매중', qty: 1, usedCode: 'U' + id, sku }); S.sku.map.set(id, { c: [c] }); };
    mk('L1', 'BLKCMN_ck', 'd3804'); mk('L2', 'PNKLUX', 'a0001'); mk('L3', 'GRNNEW_ms', 'b0002'); mk('L4', 'BLKCMN_hd_NEW', 'c0003'); mk('L5', 'BLKCMN_bbs', 'e0004'); S.prodLoaded = true; bump('p');
    const o = {}; for (const id of ['L1', 'L2', 'L3', 'L4', 'L5']) o[id] = skuOfL(S.plist.get(id))[0];
    o.y24 = y24SkuSelf(S.plist.get('L1'))[0];
    const RG = window.ReadnowRegistry; o.core = [RG.skuCore('BLKd3804CK'), RG.skuCore('PNKLUXd3804'), RG.skuCore('PNKa0001')];
    const K = prodSearchKeys(); o.findOld = /pnkluxa0001/i.test(K.get('L2')) && /pnka0001ex/i.test(K.get('L2'));
    return o; });
  console.log(JSON.stringify(r), errs.join('|'));
  let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
  ok(r.L1 === 'BLKd3804CK', '클리어킹 _ck → BLK d3804 CK (10글자) ' + r.L1); ok(r.L2 === 'PNKa0001EX', '일반(토막 없음) → EX ' + r.L2);
  ok(r.L3 === 'GRNb0002MS' && r.L4 === 'BLKc0003HD', '김미소 MS · 헌옷도라이 HD(_NEW 붙어도) ' + r.L3 + ' ' + r.L4); ok(r.L5 === 'BLKe0004BB', '지운 매입처도 자기 글자(다시 안 씀) ' + r.L5);
  ok(r.y24 === 'BLKd3804CK', '예스24 자체코드 후보 = 통합 SKU ' + r.y24); ok(r.core.join() === 'd3804,d3804,a0001', '새·옛 모양 모두 고유 5칸으로 읽음'); ok(r.findOld, '옛 모양(PNKLUXa0001)·새 모양으로 찾기'); ok(!errs.length, '페이지 오류 없음');
  console.log(bad ? `❌ tSKU10 실패 ${bad}` : '✓ tSKU10 통과'); process.exit(bad ? 1 : 0);
});

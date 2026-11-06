// tSP — 11/01 정범님: 👁 살핀 상품 패널(seenPanel) — 살핌 수·400ms 규칙·다시 그려도 이어짐·드래그 자리 저장·살핀 열쇠만 넘김·두 번 누르기·끝 요약·화면 붙임(매입·등록)
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const W = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  // ① 시험 화면: 카드 30개(높이 200px)를 스크롤 상자에
  await p.evaluate(() => { const box = document.createElement('div'); box.id = 'tsp'; box.style.cssText = 'position:fixed;inset:0;overflow:auto;z-index:11;background:#fff';
    const draw = () => { box.innerHTML = Array.from({ length: 30 }, (_, i) => `<div class="tcard" data-k="k${i}" style="height:200px;border:1px solid #ccc;margin:0;box-sizing:border-box">카드 ${i}</div>`).join(''); }; draw(); document.body.appendChild(box); window.__tspDraw = draw;
    window.__runs = []; const use = () => seenPanelUse({ key: 'tsp', scope: 'a', title: '시험 화면', alive: () => !!document.getElementById('tsp'), root: () => document.getElementById('tsp'), sel: '.tcard[data-k]', keyOf: (el) => el.dataset.k, nameOf: (el, k) => '책 ' + k,
      actions: [{ label: '살핀 것 보통 처리', run: async (keys, prog) => { window.__runs.push(['n', keys.slice()]); for (let i = 1; i <= keys.length; i++) prog(i, keys.length); await new Promise((r) => setTimeout(r, 50)); return `보통 ${keys.length}개`; } },
        { label: '살핀 것 위험 처리', danger: true, ok: (k) => +k.slice(1) % 2 === 0, run: async (keys) => { window.__runs.push(['d', keys.slice()]); return `위험 ${keys.length}개`; } }] });
    window.__use = use; use(); });
  await W(p, 700);
  const st = () => p.evaluate(() => ({ n: seenKeys().length, keys: seenKeys(), txt: (document.getElementById('seenp') || {}).innerText || '', vis: getComputedStyle(document.getElementById('seenp')).display }));
  let s = await st(); ok(s.vis !== 'none' && /살핀 상품/.test(s.txt), '패널이 떠 있음'); ok(s.n === 4 && s.keys.join() === 'k0,k1,k2,k3', `처음 화면(900px)에 절반 넘게 보인 카드 4개만 살핌: ${s.keys.join()}`); ok(/마지막: 책 k3/.test(s.txt.replace(/\s+/g, ' ')), '마지막 살핀 상품 이름 표시');
  // ② 빨리 지나간 카드(0.4초 안)는 살피지 않음
  for (let y = 300; y <= 3000; y += 300) { await p.evaluate((y) => { document.getElementById('tsp').scrollTop = y; }, y); await W(p, 40); }
  await p.evaluate(() => { document.getElementById('tsp').scrollTop = 1000; }); await W(p, 700); s = await st();
  ok(!s.keys.some((k) => ['k4', 'k9', 'k10', 'k11', 'k12', 'k13', 'k14'].includes(k)) && s.keys.includes('k5') && s.keys.includes('k8'), `빨리 지나간 카드(k10~k14 등)는 빠지고 머문 곳(k5~k8)만: ${s.keys.join()}`);
  // ③ 다시 그려도 이어짐(같은 열쇠 새 DOM)
  const n0 = s.n; await p.evaluate(() => { window.__tspDraw(); document.getElementById('tsp').scrollTop = 2000; }); await W(p, 800); s = await st(); ok(s.n > n0 && s.keys.includes('k10') && s.keys.includes('k0'), `다시 그린 뒤에도 앞의 것은 남고 새 카드도 살핌: ${s.n}개`);
  // ④ 목록 보기·하나 빼기
  await p.click('#seenp .seenp-ls summary'); await W(p, 100); await p.click('#seenp [data-spdel="k0"]'); await W(p, 200); s = await st(); ok(!s.keys.includes('k0') && s.n === n0 - 1 + (s.n - (n0 - 1)), '살핀 목록에서 × 하나 빼기'); const nBefore = s.n;
  // ⑤ 드래그로 자리 바꾸고 저장
  const r0 = await p.evaluate(() => { const r = document.getElementById('seenp').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width }; });
  const hb = await p.$('#seenp .seenp-h b'); const bb = await hb.boundingBox(); await p.mouse.move(bb.x + 10, bb.y + 5); await p.mouse.down(); await p.mouse.move(bb.x - 200, bb.y - 300, { steps: 6 }); await p.mouse.up(); await W(p, 100);
  const r1 = await p.evaluate(() => { const r = document.getElementById('seenp').getBoundingClientRect(); return { x: r.left, y: r.top, ls: localStorage.getItem('rn-seenp-pos:tsp') }; });
  ok(Math.abs(r1.x - (r0.x - 210)) < 4 && Math.abs(r1.y - (r0.y - 305)) < 4 && r1.ls, `드래그로 옮김 (${Math.round(r0.x)},${Math.round(r0.y)}) → (${Math.round(r1.x)},${Math.round(r1.y)}) · 저장 ${r1.ls}`);
  await p.mouse.move(bb.x - 200, bb.y - 300); await p.mouse.down(); await p.mouse.move(-500, -500, { steps: 4 }); await p.mouse.up(); await W(p, 100);
  const r2 = await p.evaluate(() => { const r = document.getElementById('seenp').getBoundingClientRect(); return { x: r.left, y: r.top }; }); ok(r2.x >= 4 && r2.y >= 4, `창 밖으로 안 나감 (${Math.round(r2.x)},${Math.round(r2.y)})`);
  await p.evaluate(() => window.__use()); await W(p, 100); const r3 = await p.evaluate(() => { const r = document.getElementById('seenp').getBoundingClientRect(); return { x: r.left, y: r.top }; }); ok(Math.abs(r3.x - r2.x) < 2 && Math.abs(r3.y - r2.y) < 2, '다시 그려도 저장한 자리 그대로');
  // ⑥ 두 번 누르기 — 한 번은 실행 안 함
  const expD = (await st()).keys.filter((k) => +k.slice(1) % 2 === 0);
  await p.click('#seenp [data-spact="1"]'); await W(p, 150); let rr = await p.evaluate(() => ({ runs: window.__runs.length, t: document.querySelector('#seenp [data-spact="1"]').textContent, armed: document.querySelector('#seenp [data-spact="1"]').classList.contains('armed') }));
  ok(rr.runs === 0 && rr.armed && /한 번 더/.test(rr.t), `위험 동작 한 번 누름 → 실행 안 하고 '한 번 더' (${rr.t.trim()})`);
  await p.click('#seenp [data-spact="1"]'); await W(p, 300); rr = await p.evaluate(() => ({ runs: JSON.stringify(window.__runs), n: seenKeys().length, txt: document.getElementById('seenp').innerText }));
  ok(rr.runs === JSON.stringify([['d', expD]]), `두 번째에 실행 · ok에 맞는 살핀 열쇠만 넘김: ${rr.runs}`); ok(/✓ 끝/.test(rr.txt) && /위험 \d+개/.test(rr.txt), '끝나면 요약 보임'); ok(rr.n === nBefore - expD.length, `처리한 것만 살핀 목록에서 빠짐 (${nBefore} → ${rr.n})`);
  // 4초 지나면 무장 풀림
  await p.evaluate(() => { SEENP.arm = { i: 1, sc: SEENP.scope, until: Date.now() - 1 }; }); await p.click('#seenp [data-sp="done"]'); await W(p, 100);
  // ⑦ 보통 동작 — 살핀 열쇠 그대로 · 진행 · 비움 · 닫으면 처음
  const expN = await p.evaluate(() => seenKeys()); await p.evaluate(() => { window.__runs = []; }); await p.click('#seenp [data-spact="0"]'); await W(p, 300);
  rr = await p.evaluate(() => ({ runs: window.__runs, n: seenKeys().length, txt: document.getElementById('seenp').innerText, k5: document.querySelector('.tcard[data-k="k5"]') && 1 }));
  ok(JSON.stringify(rr.runs) === JSON.stringify([['n', expN]]), `보통 동작은 한 번에 · 살핀 열쇠 ${expN.length}개만 (화면 밖 카드·안 본 카드 없음)`); ok(!expN.includes('k25') && !expN.includes('k29'), '안 본 카드(k25·k29)는 넘기지 않음');
  ok(/✓ 끝/.test(rr.txt) && /보통/.test(rr.txt), '끝 요약'); await p.click('#seenp [data-sp="done"]'); await W(p, 100); ok(!/✓ 끝/.test(await p.evaluate(() => document.getElementById('seenp').innerText)), '닫기 → 처음 상태');
  // ⑧ 비우기·접기·화면 닫으면 숨김
  await W(p, 700); await p.click('#seenp [data-sp="clear"]'); await W(p, 100); ok((await st()).n === 0, '비우기');
  await p.click('#seenp [data-sp="fold"]'); await W(p, 100); ok(await p.evaluate(() => document.getElementById('seenp').classList.contains('fold') && localStorage.getItem('rn-seenp-fold:tsp') === '1'), '접기(이 기기에 기억)'); await p.click('#seenp [data-sp="fold"]'); await W(p, 100);
  await p.evaluate(() => document.getElementById('tsp').remove()); await W(p, 1300); ok(await p.evaluate(() => getComputedStyle(document.getElementById('seenp')).display === 'none'), '화면을 닫으면 패널 숨김');
  // ⑨ 휴대폰 폭에서 패널 폭
  await p.setViewportSize({ width: 380, height: 760 });
  // ⑩ 알라딘 매입 화면에 붙음 — 후보 탭 카드 살핌 → '→ 매입 신청 탭으로' 가 살핀 것만 bbuyMove로
  const bb2 = await p.evaluate(async () => { const L = [...S.plist.values()].filter((l) => l.active).slice(0, 8); S.bbuyRes = { hit: new Map(L.map((l) => [l.usedCode, { buy: 3000, floor: 4000, target: 4000 }])), scanned: L.length, at: Date.now() }; S.bbuySt = { moved: {}, skip: {}, cart: {} }; S._bbuyUn = () => {}; S.bbuyBusy = null; openAladinSell({ t: 'cand' }); await new Promise((r) => setTimeout(r, 300)); const c0 = document.querySelectorAll('#sheet .bbit[data-bbit]'); c0[1].scrollIntoView({ block: 'start' }); await new Promise((r) => setTimeout(r, 900)); const el = document.getElementById('seenp'); const r = el.getBoundingClientRect(); return { cards: document.querySelectorAll('#sheet .bbit[data-bbit]').length, txt: el.innerText, disp: getComputedStyle(el).display, w: r.width, right: r.right, vw: innerWidth, seen: seenKeys() }; });
  ok(bb2.disp !== 'none' && /이관|보낸 상품으로/.test(bb2.txt) /* (11/03) 이름 '→ 이관' */ && /제외/.test(bb2.txt), `알라딘 매입 화면에 패널(카드 ${bb2.cards}개 · 살핌 ${bb2.seen.length}개)`); ok(bb2.w <= bb2.vw - 30 && bb2.right <= bb2.vw, `휴대폰 폭 ${bb2.vw}px에서 패널 폭 ${Math.round(bb2.w)}px · 화면 안`);
  const bb3 = await p.evaluate(async () => { const seen = seenKeys(); const calls = []; const o = window.bbuyMove; window.bbuyMove = async (c, to) => { calls.push([c.slice(), to]); return o(c, to); }; try { bbuyMove = window.bbuyMove; } catch (e) {} document.querySelector('#seenp [data-spact="0"]').click(); await new Promise((r) => setTimeout(r, 600)); return { seen, calls, moved: Object.keys(S.bbuySt.moved) }; });
  ok(bb3.seen.length > 0 && bb3.seen.length < 8 && JSON.stringify(bb3.moved.sort()) === JSON.stringify(bb3.seen.slice().sort()), `매입: 살핀 ${bb3.seen.length}개만 보낸 상품으로(정범님 11/01 — 예전 매입 신청 탭) (전체 8개 중) · ${bb3.moved.join(',')}`);
  await p.evaluate(() => history.back()); await W(p, 1300);
  // ⑪ 📥 등록 화면에 붙음 — 선택 대기 탭 · '살핀 것 결정 대기로'
  await p.setViewportSize({ width: 1400, height: 900 });
  const rg = await p.evaluate(async () => { const now = new Date().toISOString(); window.__FS.reg_items = {}; for (let i = 0; i < 6; i++) window.__FS.reg_items['r' + i] = { stage: 'sel', isbn: '978891000000' + i, q: '978891000000' + i, method: 'bulk', grade: 2, qty: 1, price: 5000 + i * 100, createdAt: now, info: { title: '등록 시험 책 ' + i, isbn13: '978891000000' + i, priceList: 15000, priceSales: 13500, page1: [], categories: ['국내도서'], at: now } };
    S.regT = 'sel'; openRegister(); await new Promise((r) => setTimeout(r, 1500)); const c0 = document.querySelector('#sheet [data-rgcid], #sheet .rgrow[data-rgexp]'); if (c0) c0.scrollIntoView({ block: 'start' }); await new Promise((r) => setTimeout(r, 900)); const el = document.getElementById('seenp'); return { n: S.regItems ? S.regItems.size : -1, cards: document.querySelectorAll('#sheet [data-rgcid], #sheet .rgrow[data-rgexp]').length, txt: el ? el.innerText : '', disp: el ? getComputedStyle(el).display : 'none', seen: seenKeys() }; });
  ok(rg.disp !== 'none' && /결정 대기로/.test(rg.txt) && /등록/.test(rg.txt), `📥 등록 화면에 패널(상품 ${rg.n} · 카드 ${rg.cards} · 살핌 ${rg.seen.length}) — ${rg.txt.replace(/\s+/g, ' ').slice(0, 90)}`);
  if (rg.seen.length) { const rg2 = await p.evaluate(async () => { const seen = seenKeys(); const st0 = Object.fromEntries(Object.entries(window.__FS.reg_items).map(([k, v]) => [k, v.stage])); const L = []; const ob = db.batch; db.batch = () => { const b = ob.call(db); const os = b.set.bind(b); b.set = (ref, d, o) => { L.push(ref.id); return os(ref, d, o); }; return b; }; document.querySelector('#seenp [data-spact="0"]').click(); await new Promise((r) => setTimeout(r, 900)); db.batch = ob; return { seen, L, st0, st: Object.fromEntries(Object.entries(window.__FS.reg_items).map(([k, v]) => [k, v.stage])) }; });
    ok(rg2.seen.every((k) => rg2.st[k] === 'pick') && JSON.stringify(rg2.L.sort()) === JSON.stringify(rg2.seen.slice().sort()), `등록: 살핀 ${rg2.seen.join()}만 결정 대기로 저장(저장한 열쇠 ${rg2.L.join()}) · 앞 ${JSON.stringify(rg2.st0)} → 뒤 ${JSON.stringify(rg2.st)} (나머지는 웹앱 자동 옮김으로 이미 결정 대기)`); }
  // ⑫ 🧮 수동 일괄 — 선택 대기 탭 살핀 것만 결정 대기로 → 결정 대기 탭 살핀 것만 선택 대기로 · 확정은 두 번 누르기
  await p.evaluate(() => history.back()); await W(p, 800);
  const b1 = await p.evaluate(async () => { const sh = document.getElementById('sheet'); sh.classList.add('on'); sh.innerHTML = '<div id="b_res"></div>'; S.detail = { batch: 1 };
    S.batchRes = [...S.plist.values()].filter((l) => l.active).map((l) => ({ l, target: l.price - 500, reasons: ['시험'], page1: [], at: '2026-11-01' })); S.batchSt = { picks: {}, decided: {} }; S.batchMeta = {}; S.batchT = 'sel'; S.batchEdit = {};
    const c = { ...JSON.parse(JSON.stringify(BATCH_DEF)), name: '시험 그룹' }; drawBatchRes(sh, c, 'g1'); await new Promise((r) => setTimeout(r, 300)); const cards = sh.querySelectorAll('.card.pq.bq[data-mk]'); cards[1].scrollIntoView({ block: 'start' }); await new Promise((r) => setTimeout(r, 900));
    const seen = seenKeys(); const txt = document.getElementById('seenp').innerText; document.querySelector('#seenp [data-spact="0"]').click(); await new Promise((r) => setTimeout(r, 500));
    const picks = Object.keys(S.batchSt.picks).sort(); const T1 = S.batchT; const txt2 = document.getElementById('seenp').innerText;
    window.__c = c; return { all: cards.length, seen, txt, picks, T1, txt2 }; });
  ok(/추천가 그대로 결정 대기로/.test(b1.txt) && /이내만/.test(b1.txt) && /삭제 검토/.test(b1.txt), '수동 일괄 선택 대기 탭: 추천가로 결정 대기 · x% 이내만 · 🗑 삭제 검토');
  ok(b1.seen.length > 0 && b1.seen.length < b1.all && JSON.stringify(b1.picks) === JSON.stringify(b1.seen.slice().sort()) && b1.T1 === 'pick', `살핀 ${b1.seen.length}개만 결정 대기로(카드 ${b1.all}개 중) · 결정 대기 탭으로`);
  ok(/✓ 끝/.test(b1.txt2) && /결정 대기 · /.test(b1.txt2.replace(/\s+/g, ' ')) || /✓ 끝/.test(b1.txt2), '처리 뒤 결정 대기 탭에서도 끝 요약이 보임');
  const b2 = await p.evaluate(async () => { document.querySelector('#seenp [data-sp="done"]') && document.querySelector('#seenp [data-sp="done"]').click(); const sh = document.getElementById('sheet'); sh.scrollTop = 0; await new Promise((r) => setTimeout(r, 200)); const cards = sh.querySelectorAll('.card.pq.bq[data-mk]'); if (cards[0]) cards[0].scrollIntoView({ block: 'start' }); await new Promise((r) => setTimeout(r, 900));
    const seen = seenKeys(); const btns = [...document.querySelectorAll('#seenp [data-spact]')].map((b) => b.textContent.trim()); const back = [...document.querySelectorAll('#seenp [data-spact]')].find((b) => /선택 대기로/.test(b.textContent)); back.click(); await new Promise((r) => setTimeout(r, 400));
    return { seen, btns, picks: Object.keys(S.batchSt.picks).sort(), T: S.batchT }; });
  ok(b2.seen.length > 0 && b2.btns.some((t) => /선택 대기로/.test(t)), `결정 대기 탭 동작: ${b2.btns.join(' / ')}`);
  ok(b2.T === 'sel' && b2.seen.every((k) => !b2.picks.includes(k)), `결정 대기 탭에서 살핀 ${b2.seen.length}개만 선택 대기로 (남은 결정 대기 ${b2.picks.length}개)`);
  // ⑬ 🔭 매입 상품 조회 그룹 — 살핀 책만 복사
  const bl = await p.evaluate(async () => { S.detail = { bl: 1 }; S._blW = 1; S._blIW = { gid: 'g', un: () => {} }; S.blG = [{ id: 'g', name: '시험 조회', platforms: ['aladin'], status: 'done' }]; S.blItems = Array.from({ length: 12 }, (_, i) => ({ id: 'g__97889' + i, gid: 'g', title: '조회 책 ' + i, isbn13: '97889' + i, priceSales: 10000, usedMin: 3000 })); S.blView = { v: 'group', id: 'g' }; window.__FS.bench_lookup = { g: { name: '시험 조회', platforms: ['aladin'], status: 'done' } }; window.__FS.bench_lookup_items = Object.fromEntries(S.blItems.map((x) => [x.id, x])); const G0 = S.blG, I0 = S.blItems; await new Promise((r) => setTimeout(r, 300)); S.blG = G0; S.blItems = I0; document.getElementById('sheet').scrollTop = 0; blDraw();
    await new Promise((r) => setTimeout(r, 1000)); const seen = seenKeys(); let clip = null; navigator.clipboard.writeText = async (t) => { clip = t; }; document.querySelector('#seenp [data-spact="0"]').click(); await new Promise((r) => setTimeout(r, 300)); return { rows: document.querySelectorAll("#sheet tr[data-blk]").length, seen, clip, sh: document.getElementById("sheet").innerText.slice(0, 200), det: JSON.stringify(S.detail) }; });
  ok(bl.seen.length > 0 && bl.seen.length < bl.rows && bl.clip && bl.clip.split('\n').length === bl.seen.length, `매입 상품 조회: ${bl.rows}권 중 살핀 ${bl.seen.length}권만 복사`);
  console.log(bad ? `❌ tSP 실패 ${bad}` : '✓ tSP 통과'); });

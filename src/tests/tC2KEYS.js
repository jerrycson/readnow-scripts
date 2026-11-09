/* tC2KEYS — 번외 0.1.10 '남은 9가지도 그림자로' · lab/col2/README '운영 키 받는 길'의 웹앱 쪽(c2RelayTick)
 *  ① 부탁 목록 keys(키 '이름'만)가 오면 로거 PC가 아닐 때만 app_secrets/ext.keys에서 정한 이름만 골라 POST /relay/keys
 *  ② 키 값은 화면·기기 저장·S·콘솔·Firestore 다른 칸·다른 부탁(/relay/answer 등)에 남지 않음 · 10분에 한 번까지만 읽음
 *  ③ lists [{c:'prd_market_nobook', n}]가 오면 로거가 아닐 때만 그 칸 문서 n개를 줄여(견줄 칸만) /relay/answer {lists}
 *  ④ C2R.ok에 mkt_kpipa(이름 8자리 날짜만)·prd_market_nobook(로거엔 안 넘김) 더함
 *  ⑤ 로거 PC: 키를 보내지 않음 · 목록·prd_market_nobook 문서를 넘기지 않음 · 브라우저 팝업 없음
 *  시험 키 값은 가짜(공개 저장소)
 * 실행: cd pw && RN_PORT=<포트> node tC2KEYS.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 700) : ''); } else console.log('  ✓', m); };
const V = ['TTBFAKEVALUE0001', 'KAKAOFAKEVALUE02', 'EVILFAKEVALUE003', 'NLFAKEVALUE00004'];
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const calls = []; const logs = []; p.on('console', (m) => logs.push(m.text()));
  let pcNow = 'HOME'; let pend = null;
  const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
  await p.route(/127\.0\.0\.1:8797/, async (rt) => { const u = new URL(rt.request().url()); const b = rt.request().postData(); if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS }); calls.push({ p: u.pathname, b: b ? JSON.parse(b) : null });
    const J = (x) => rt.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(x) });
    if (u.pathname === '/relay/pending') { const x = pend || {}; pend = null; return J({ ok: true, want: [], sample: 0, pool: 0, fields: [], out: [], hot: false, pc: pcNow, pcSrc: 'web', ver: '0.1.10', ...x }); }
    return J({ ok: true }); });
  await p.evaluate(async (V) => { localStorage.setItem('rn-device', 'HOME'); localStorage.setItem('rn-c2seen', '1'); S.devOk = true;
    await db.collection('app_secrets').doc('ext').set({ keys: { aladinTtb: V[0], kakaoRest: V[1], evilKey: V[2], nlKey: V[3] } });
    for (const [id, t] of [['K1', '시험 책 하나'], ['K2', '시험 책 둘'], ['K3', '시험 책 셋']]) await db.collection('prd_market_nobook').doc(id).set({ usedCode: 'U' + id, listingId: 'L' + id, title: t, query: t, at: '2026-11-09T10:00:00Z', src: 'search', candSig: 'sig' + id, market: { median: 3000, low: 2000, n: 5, cand: [{ price: 1, seller: '판매자 숍' }] }, history: [{ our: 9999, at: 'old' }, { our: 4000, at: '2026-11-09', memo: '옛 기록' }], memo: '내부 메모' });
    await db.collection('mkt_kpipa').doc('20261109').set({ 판매채널별: { series: [1, 2] } }); await db.collection('mkt_kpipa').doc('bad').set({ x: 1 }); }, V);
  const tick = async (pc, x) => { calls.length = 0; pcNow = pc; pend = x; await p.evaluate(async (pc) => { localStorage.setItem('rn-device', pc); S._c2rTried = 0; clearTimeout(S._c2rT); await c2RelayTick(); clearTimeout(S._c2rT); }, pc); return calls.slice(); };
  const ASK = { keys: ['aladinTtb', 'kakaoRest', 'nlKey', 'evilKey'], lists: [{ c: 'prd_market_nobook', n: 2, after: null }], want: [{ c: 'mkt_kpipa', id: '20261109' }, { c: 'mkt_kpipa', id: 'bad' }, { c: 'prd_market_nobook', id: 'K3' }] };
  // ── ① 사무실 PC
  let C = await tick('HOME', ASK); const kp = C.filter((c) => c.p === '/relay/keys'); const an = (C.find((c) => c.p === '/relay/answer') || {}).b || {};
  ok(kp.length === 1 && kp[0].b.keys && kp[0].b.keys.aladinTtb === V[0] && kp[0].b.keys.kakaoRest === V[1] && kp[0].b.keys.nlKey === V[3], '🔑 사무실 PC: 부탁한 이름의 키를 /relay/keys로 넘김', kp.map((c) => Object.keys(c.b.keys || {})));
  ok(kp.length === 1 && !('evilKey' in kp[0].b.keys) && !JSON.stringify(kp[0].b).includes(V[2]), '🔑 정한 이름 밖(evilKey)은 부탁해도 넘기지 않음');
  const others = JSON.stringify(C.filter((c) => c.p !== '/relay/keys').map((c) => c.b)); ok(!V.some((v) => others.includes(v)), '🔑 키 값은 /relay/keys 밖 어떤 부탁(/relay/answer 등)에도 없음');
  const NB = (an.lists || {}).prd_market_nobook || []; ok(NB.length === 2 && NB[0].id === 'K1' && NB[1].id === 'K2', '🔍 목록: prd_market_nobook 문서 n(2)개를 문서 이름 차례로 넘김', NB.map((d) => d.id));
  const v1 = NB[0] && NB[0].v; ok(v1 && v1.usedCode === 'UK1' && v1.candSig === 'sigK1' && v1.market && v1.market.median === 3000 && v1.market.low === 2000 && v1.market.n === 5 && !('cand' in v1.market) && !('memo' in v1) && v1.history.length === 1 && v1.history[0].our === 4000 && !('memo' in v1.history[0]), '🔍 넘기는 문서는 견줄 칸만(시세 가운데·최저·수 · 이력 끝 한 줄 · 메모·후보 목록 뺌)', v1);
  const D = an.docs || []; const by = (c, id) => D.find((d) => d.c === c && d.id === id);
  ok(by('mkt_kpipa', '20261109') && by('mkt_kpipa', '20261109').v['판매채널별'] && !by('mkt_kpipa', 'bad'), '📚 KPIPA 운영 칸(mkt_kpipa)은 8자리 날짜 문서만 대신 읽어 넘김', D.map((d) => d.c + '/' + d.id));
  const k3 = by('prd_market_nobook', 'K3'); ok(k3 && k3.v && k3.v.market.median === 3000 && !('memo' in k3.v) && !('cand' in k3.v.market), '🔍 부탁한 prd_market_nobook 문서 하나도 줄여서 넘김', k3);
  const ck = await p.evaluate(() => ({ ok: C2R.ok.includes('mkt_kpipa') && C2R.ok.includes('prd_market_nobook') }));
  ok(ck.ok, 'C2R.ok에 mkt_kpipa·prd_market_nobook');
  // ── ② 값이 어디에도 남지 않음
  const left = await p.evaluate((V) => { const seen = new WeakSet(); let sJ = ''; try { sJ = JSON.stringify(S, (k, v) => { if (v && typeof v === 'object') { if (seen.has(v) || v instanceof Node || v === window) return undefined; seen.add(v); } return v; }); } catch (e) { sJ = 'ERR ' + e.message; }
    const ls = Object.keys(localStorage).map((k) => k + '=' + localStorage.getItem(k)).join('\n'); let ss = ''; try { ss = Object.keys(sessionStorage).map((k) => sessionStorage.getItem(k)).join('\n'); } catch (e) {}
    const fs = window.__FS || {}; const fsOther = JSON.stringify(Object.entries(fs).filter(([c]) => c !== 'app_secrets'));
    const hay = { S: sJ, ls, ss, html: document.documentElement.outerHTML, fsOther }; const hit = {}; for (const [k, t] of Object.entries(hay)) if (V.some((v) => t.includes(v))) hit[k] = 1; return { hit, sErr: /^ERR/.test(sJ) ? sJ : null }; }, V);
  ok(!Object.keys(left.hit).length && !left.sErr, '🔑 키 값이 화면·기기 저장·S·Firestore 다른 칸에 없음', left);
  ok(!logs.some((t) => V.some((v) => t.includes(v))), '🔑 키 값이 콘솔에 없음');
  // ── 10분에 한 번까지만
  C = await tick('HOME', { keys: ['aladinTtb'] }); ok(!C.some((c) => c.p === '/relay/keys'), '🔑 10분 안에 또 부탁하면 다시 읽지 않음(app_secrets 읽기 줄임)');
  // ── ⑤ 로거 PC
  await p.evaluate(() => { S._c2kAt = 0; }); C = await tick('LOGGER', ASK); const anL = (C.find((c) => c.p === '/relay/answer') || {}).b || {};
  ok(!C.some((c) => c.p === '/relay/keys'), '🔑 로거 PC엔 키를 보내지 않음(약속 0)', C.map((c) => c.p));
  ok(!anL.lists && !(anL.docs || []).some((d) => d.c === 'prd_market_nobook'), '🔍 로거 PC엔 우리 상품 목록(prd_market_nobook)을 넘기지 않음', anL);
  ok((anL.docs || []).some((d) => d.c === 'mkt_kpipa' && d.id === '20261109'), '📚 KPIPA 공개 통계 칸은 로거에도 넘겨도 됨(손님·우리 상품 정보 없음)');
  ok(!V.some((v) => JSON.stringify(C.map((c) => c.b)).includes(v)), '🔑 로거 PC에 간 어떤 것에도 키 값 없음');
  // 웹앱 기기 이름이 LOGGER면 외부 수집기 이름이 달라도 안 보냄
  await p.evaluate(() => { S._c2kAt = 0; }); pcNow = 'HOME'; pend = ASK; calls.length = 0; await p.evaluate(async () => { localStorage.setItem('rn-device', 'LOGGER'); S._c2rTried = 0; clearTimeout(S._c2rT); await c2RelayTick(); clearTimeout(S._c2rT); });
  ok(!calls.some((c) => c.p === '/relay/keys') && !((calls.find((c) => c.p === '/relay/answer') || {}).b || {}).lists, '🔑 웹앱 기기 이름이 LOGGER여도 키·목록을 보내지 않음', calls.map((c) => c.p));
  ok(!/alert\(|confirm\(|prompt\(/.test(await p.evaluate(() => [c2KeysGive, c2ListsGive, c2nbTrim, c2RelayTick].map(String).join('\n'))), '브라우저 팝업 없음');
  console.log(bad ? `❌ tC2KEYS ${bad}개 실패` : '✓ tC2KEYS 모두 통과'); process.exit(bad ? 1 : 0); });

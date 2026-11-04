// tCHASEBL — 11/04 정범님 "무시 판매자 빼는 설정을 가능하게 해주고 빠지지 않는 지금 상태를 기본으로 해줘. 블랙리스트 목록 화면 만들어."
// ① 기본(꺼짐) = 셈 그대로 ② 곳마다(시장 지표·⚡ 희소 전략·판매가 추천) 켜면 그 곳만 빠짐 ③ 🚫 블랙리스트 더하기/해제(기록)/메모/찾기·정렬·겹치는 책 ④ 판매자 상세 빠른 단추 ⑤ 클라우드 chaseIgnoreSet(가짜 db)
// 실행: cd <빌드 사본>/pw && RN_PORT=<포트> node tCHASEBL.js
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const W = (p, ms) => p.waitForTimeout(ms);

/* ⑤ 클라우드 — 원본 cloud/index.js에서 chaseIgnoreSet을 떼어 가짜 db로 */
(async () => { const cands = [path.join(__dirname, '../cloud/index.js'), path.join(__dirname, '../../cloud/index.js')]; const f = cands.find((x) => fs.existsSync(x));
  if (!f) { ok(false, '클라우드 파일을 못 찾음'); return; } const src = fs.readFileSync(f, 'utf8'); const a = src.indexOf('async function chaseIgnoreSet('); const b = src.indexOf('\nasync function badgeNowCalc(');
  if (a < 0 || b < a) { ok(false, '클라우드에서 chaseIgnoreSet을 못 찾음'); return; }
  const mk = (doc) => { const db = { getAll: async () => [{ exists: !!doc, data: () => doc }] }; const C = () => ({ doc: () => ({}) }); return new Function('db', 'C', src.slice(a, b) + '\nreturn chaseIgnoreSet;')(db, C); };
  const pol = (excl) => ({ chaseEng: { sellers: { 222: { stance: 'ignore' }, 111: { stance: 'aggressive' }, 996008: { stance: 'ignore' } }, ...(excl ? { excl } : {}) } });
  ok((await mk(pol(null))('strat')) === null, '클라우드: excl 없음(처음) → 무시 판매자를 빼지 않음(null)');
  ok((await mk(pol({ mkt: true }))('strat')) === null, '클라우드: 시장 지표만 켬 → ⚡ 전략은 그대로');
  const s1 = await mk(pol({ strat: true }))('strat'); ok(s1 && s1.size === 1 && s1.has('222'), '클라우드: ⚡ 켬 → 무시 판매자 222만(우리 가게 996008은 빼지 않음)');
  ok((await mk(null)('mkt')) === null, '클라우드: 정책 문서 없음 → null');
})().then(() => require('./harness.js')(async (p) => { p.on('pageerror', () => { bad++; }); await p.evaluate(require('./seed.js'));
  await p.evaluate(() => { window.confirm = () => true; S.sellers = S.sellers || new Map(); S.sellers.set('sc_111', { id: 'sc_111', sc: '111', name: '추격왕' }); S.sellers.set('sc_222', { id: 'sc_222', sc: '222', name: '조용한책방' }); S.sellers.set('sc_333', { id: 'sc_333', sc: '333', name: '세번째' });
    const row = (sc, name, price, lid, x) => ({ sellerCode: sc, sellerName: name, grade: '최상', price, ship: 2500, listingId: lid, usedCode: null, soldOut: false, ...(x || {}) });
    S.pmetrics = S.pmetrics || new Map(); S.pmetrics.set('bk0', { id: 'bk0', lastCheckedAt: new Date().toISOString(), usedTotal: 3, priceList: 15000, usedFirstPage: [row('222', '조용한책방', 4000, '9001'), row('996008', '북스킹', 5000, '404935000', { usedCode: 'U215983410' }), row('333', '세번째', 6000, '9002')] });
    S.pmetrics.set('bk1', { id: 'bk1', lastCheckedAt: new Date().toISOString(), usedTotal: 2, usedFirstPage: [row('222', '조용한책방', 3000, '9003', { grade: '상' }), row('996008', '북스킹', 5700, '404935001', { usedCode: 'U215983411', grade: '상' })] });
    S.pmLoaded = true; S._bpColors = ['unknown'];
    window.__FS.prd_system = window.__FS.prd_system || {}; window.__FS.prd_system.pricing = { presets: {}, chaseEng: { on: false, sellers: { 222: { name: '조용한책방', stance: 'ignore', strat: '', condSet: '', cond: {}, note: '' } } } };
    S.prCfg = JSON.parse(JSON.stringify(window.__FS.prd_system.pricing)); });

  /* 엔진 순수 함수 */
  const e = await p.evaluate(() => { const CH = window.ReadnowChase; const P = CH.normPolicy({}); const d0 = JSON.stringify(P.excl); const a1 = CH.blAdd(P, '555', { name: '새판매자', by: 'a@x', memo: '까닭', at: '2026-11-04T01:00:00Z' }); const a2 = CH.blAdd(P, '555', {});
    const s1 = CH.exclSet(P, 'mkt'); P.excl.mkt = true; const s2 = CH.exclSet(P, 'mkt'); const dr = CH.dropIgnored([{ sellerCode: '555' }, { sc: '555' }, { sc: '1' }, { sellerCode: null }], s2);
    const m1 = CH.blMemo(P, '555', '바꾼 까닭', { by: 'a@x' }); const off = CH.blOff(P, '555', { by: 'b@x', at: '2026-11-04T02:00:00Z' }); const L = CH.blList(P);
    const Q = CH.normPolicy({ sellers: { 7: { stance: 'aggressive', name: '칠' } } }); CH.blAdd(Q, '7', { by: 'a' }); const q1 = Q.sellers['7'].stance; CH.blOff(Q, '7', {}); const q2 = Q.sellers['7'] && Q.sellers['7'].stance;
    return { d0, a1, a2, s1, s2: s2 && [...s2], dr: dr.length, m1, off, on: L.on.length, offN: L.off.length, offAt: L.off[0] && L.off[0].offAt, log: P.blLog.map((x) => x.act).join(','), left: !!P.sellers['555'], q1, q2, own: CH.blAdd(P, '996008', {}) }; });
  ok(e.d0 === '{"mkt":false,"strat":false,"rec":false}', `엔진: 처음 값 세 곳 모두 꺼짐 ${e.d0}`);
  ok(e.a1 && !e.a2 && e.s1 === null && e.s2.join() === '555' && e.dr === 2, '엔진: 더하기(두 번째는 안 함) · 꺼짐이면 Set 없음 · 켜면 Set · 원본(sellerCode)·블록(sc) 줄 모두 뺌');
  ok(e.m1 && e.off && e.on === 0 && e.offN === 1 && e.offAt === '2026-11-04T02:00:00Z' && e.log === 'on,memo,off' && !e.left, `엔진: 메모·해제 기록(지우지 않음 ${e.log}) · 지정 전에 없던 판매자는 목록에서 빠짐`);
  ok(e.q1 === 'ignore' && e.q2 === 'aggressive' && e.own === false, '엔진: 있던 판매자는 해제하면 원래 태세(공격적)로 · 우리 가게는 지정 안 됨');

  /* ① 기본(꺼짐) = 셈 그대로 */
  const probe = () => p.evaluate(() => { const l0 = S.plist.get('aladin_U215983410'); const l1 = S.plist.get('aladin_U215983411'); const PRC = window.ReadnowPricing; const od = PRC.decide; let rows = null; PRC.decide = (a, b, ...r) => { rows = b.rows.map((x) => String(x.sellerCode)); return od(a, b, ...r); };
    let bc = null, pr = null; try { batchCompute({ ...BATCH_DEF }, [l0]); bc = rows; rows = null; pptRec({ page1: S.pmetrics.get('bk0').usedFirstPage, priceList: 15000, at: new Date().toISOString() }); pr = rows; } finally { PRC.decide = od; }
    const ML = window.ReadnowML; const ctx = stratCtx(l0, { k: 'ladder' }, new Map()); const sm = ML.stratMarket(ctx, stratCfg());
    return { mref: batchMktRef(l0), solo: batchFilter ? null : null, bc: bc && bc.join(), pr: pr && pr.join(), comp: sm.comp, first: sm.first, ig: sm.ignored, noteM: cheExclNote('mkt'), noteS: cheExclNote('strat'), noteR: cheExclNote('rec'), mkt1: cheDrop(S.pmetrics.get('bk1').usedFirstPage, 'mkt').length }; });
  let r = await probe();
  ok(r.mref === 4000 && r.bc && r.bc.includes('222') && r.pr && r.pr.includes('222') && r.comp === 2 && r.first === 4000 && !r.ig && r.mkt1 === 2 && !r.noteM && !r.noteS && !r.noteR, `기본(꺼짐): 무시 판매자도 그대로 셈 — 기준 시장가 ${r.mref} · 추천 줄 ${r.bc} · ⚡ 경쟁 ${r.comp}(맨 앞 ${r.first}) · 표시 없음`);
  /* ② 곳마다 — 시장 지표만 */
  const setX = (x) => p.evaluate((x) => { S.prCfg = { ...S.prCfg, chaseEng: { ...S.prCfg.chaseEng, excl: x } }; }, x);
  await setX({ mkt: true }); r = await probe();
  ok(r.mref === 6000 && r.mkt1 === 1 && r.bc.includes('222') && r.pr.includes('222') && r.comp === 2 && /무시 판매자 1명 빼고 셈/.test(r.noteM) && !r.noteS && !r.noteR, `시장 지표만 켬: 기준 시장가 4,000 → ${r.mref}(222 뺌) · 추천·⚡은 그대로`);
  await setX({ strat: true }); r = await probe();
  ok(r.mref === 4000 && r.comp === 1 && r.first === 6000 && r.ig === 1 && r.bc.includes('222') && /1명 빼고 셈/.test(r.noteS) && !r.noteM, `⚡ 희소 전략만 켬: 경쟁 2 → ${r.comp}(맨 앞 ${r.first}) · 시장 지표·추천은 그대로`);
  await setX({ rec: true }); r = await probe();
  ok(r.mref === 4000 && r.comp === 2 && !r.bc.includes('222') && !r.pr.includes('222') && /1명 빼고 셈/.test(r.noteR), `판매가 추천만 켬: 수동 일괄 추천 줄 ${r.bc} · 사진 가격 줄 ${r.pr}(222 뺌) · 나머지 그대로`);
  // 수동 일괄 시장 조건(경쟁 없음 빼기 exSolo · 최저가 배지)
  const sol = await p.evaluate(() => { const l1 = S.plist.get('aladin_U215983411'); const f = (c) => { const R = batchFilter({ ...BATCH_DEF, ...c }); return R.some((x) => x.id === l1.id); }; return { solo: f({ exSolo: true }), badge: f({ mktOn: true, lowBadge: 'has' }) }; }).catch((e) => ({ err: e.message }));
  await setX({ mkt: true }); const sol2 = await p.evaluate(() => { const l1 = S.plist.get('aladin_U215983411'); const f = (c) => { const R = batchFilter({ ...BATCH_DEF, ...c }); return R.some((x) => x.id === l1.id); }; return { solo: f({ exSolo: true }), badge: f({ mktOn: true, lowBadge: 'has' }) }; }).catch((e) => ({ err: e.message }));
  ok(!sol.err && !sol2.err && sol.solo === true && sol2.solo === false, `수동 일괄 '경쟁 없음 빼기': 꺼짐이면 남음(${sol.solo}) · 시장 지표 켜면 무시 판매자만 남은 책은 경쟁 없음으로 빠짐(${sol2.solo}) ${sol.err || sol2.err || ''}`);
  await setX({});

  /* ③ 🚫 블랙리스트 화면 */
  await p.evaluate(() => openChaseEngine({ tab: 'bl', reload: 1 })); await W(p, 400);
  let t = await p.evaluate(() => document.getElementById('sheet').innerText);
  ok(/판매자 블랙리스트/.test(t) && /지금 무시 중 1명/.test(t) && /조용한책방/.test(t) && /모두 빼지 않음/.test(t), '블랙리스트 탭: 지금 무시 중 1명(조용한책방) · 다른 셈은 모두 빼지 않음 표시');
  const ov = await p.evaluate(() => { const tr = [...document.querySelectorAll('#chbl_tbl tr')].find((x) => /조용한책방/.test(x.innerText)); return tr ? tr.children[5].innerText.trim() : null; });
  ok(ov === '2', `겹치는 책 수(우리 판매 중 책 첫 쪽에 같이 나옴) = ${ov}`);
  ok(await p.evaluate(() => pgdCur() === 'chaseBl'), '📖 설명서: 블랙리스트 탭 = chaseBl 화면');
  await p.fill('#chbl_add', '추격왕'); await p.fill('#chbl_memo', '따라 내리기만 함'); await p.click('#chbl_addb'); await W(p, 250);
  await p.fill('#chbl_add', '333'); await p.click('#chbl_addb'); await W(p, 250);
  t = await p.evaluate(() => document.getElementById('sheet').innerText); ok(/지금 무시 중 3명/.test(t) && /따라 내리기만 함/.test(await p.evaluate(() => [...document.querySelectorAll('[data-chblmemo]')].map((x) => x.value).join('|'))) && /고친 것이 저장 안 됨/.test(t), '더하기: 이름(메모와)·번호 → 3명 · 저장 전 표시');
  await p.fill('#chbl_add', '없는이름'); await p.click('#chbl_addb'); await W(p, 200); ok(/지금 무시 중 3명/.test(await p.evaluate(() => document.getElementById('sheet').innerText)), '못 찾는 이름은 더하지 않음');
  await p.fill('#chbl_q', '세번'); await W(p, 500); t = await p.evaluate(() => document.getElementById('chbl_tbl').innerText); ok(/세번째/.test(t) && !/추격왕/.test(t) && !/조용한책방/.test(t), '찾기: 이름 일부');
  await p.fill('#chbl_q', '따라 내리기'); await W(p, 500); t = await p.evaluate(() => document.getElementById('chbl_tbl').innerText); ok(/추격왕/.test(t) && !/세번째/.test(t), '찾기: 메모');
  await p.fill('#chbl_q', ''); await W(p, 500); await p.selectOption('#chbl_sort', 'ov'); await W(p, 200);
  const first = await p.evaluate(() => { const tr = document.querySelectorAll('#chbl_tbl tr')[1]; return tr && tr.children[0].innerText; }); ok(first === '조용한책방', `정렬: 겹치는 책 많은 순 맨 위 ${first}`);
  await p.selectOption('#chbl_sort', 'name'); await W(p, 200); const nm = await p.evaluate(() => [...document.querySelectorAll('#chbl_tbl tr')].slice(1).map((x) => x.children[0].innerText).join(',')); ok(nm === '세번째,조용한책방,추격왕', `정렬: 이름 순 ${nm}`);
  await p.fill('input[data-chblmemo="222"]', '가격 흔들기'); await p.dispatchEvent('input[data-chblmemo="222"]', 'change'); await W(p, 100);
  await p.click('button[data-chbloff="333"]'); await W(p, 300);
  t = await p.evaluate(() => document.getElementById('sheet').innerText); ok(/지금 무시 중 2명/.test(t) && /해제된 판매자 1명/.test(t), '해제: 목록에서 빠지고 해제된 판매자에 남음');
  await p.click('#chbl_save'); await W(p, 400);
  let sv = await p.evaluate(() => window.__FS.prd_system.pricing); let ce = sv.chaseEng || {};
  ok(ce.sellers['111'].stance === 'ignore' && ce.sellers['111'].note === '따라 내리기만 함' && ce.sellers['111'].blBy && ce.sellers['222'].note === '가격 흔들기' && !ce.sellers['333'], '저장: 추격왕 무시(메모·누가) · 조용한책방 메모 · 해제한 세번째는 지정 목록에서 빠짐');
  ok(Array.isArray(ce.blLog) && ce.blLog.filter((x) => x.sc === '333').map((x) => x.act).join() === 'on,off' && ce.blLog.some((x) => x.sc === '222' && x.act === 'memo') && ce.excl && ce.excl.mkt === false, `저장: 바꾼 기록 ${ce.blLog && ce.blLog.length}줄(세번째 더함·해제 · 메모) · 다른 셈 빼기는 그대로 꺼짐`);
  ok(sv.chaseEngLog && sv.chaseEngLog.slice(-1)[0].ign === 2, '정책 바꾼 기록(chaseEngLog)에 무시 2명');
  await p.evaluate(() => document.querySelector('button[data-chblon="333"]').click()); /* 접힌 '해제된 판매자' 칸 안 */ await W(p, 250); ok(/지금 무시 중 3명/.test(await p.evaluate(() => document.getElementById('sheet').innerText)), '해제된 판매자 다시 무시');
  await p.evaluate(() => openChaseEngine({ tab: 'bl', reload: 1 })); await W(p, 300); /* 저장 안 한 것 버림 */

  /* ⚙ 정책 › 세 칸 */
  await p.click('button[data-chtab="set"]'); await W(p, 300); t = await p.evaluate(() => document.getElementById('che_excl') && document.getElementById('che_excl').innerText);
  ok(t && /무시 판매자를 다른 셈에서도 빼기/.test(t) && /처음 값은 모두 꺼짐/.test(t) && (await p.evaluate(() => document.querySelectorAll('input[data-chex]').length)) === 3 && (await p.evaluate(() => [...document.querySelectorAll('input[data-chex]')].every((x) => !x.checked))), '⚙ 정책: 세 칸(곳마다) · 모두 꺼짐');
  await p.check('input[data-chex="strat"]'); await W(p, 150); await p.click('#che_save'); await W(p, 400); ce = await p.evaluate(() => window.__FS.prd_system.pricing.chaseEng);
  ok(ce.excl.strat === true && ce.excl.mkt === false && ce.excl.rec === false && ce.on === false, '⚡ 칸만 켜고 저장 → strat만 켜짐(정책 켜짐과 따로)');
  t = await p.evaluate(() => document.getElementById('che_excl').innerText); ok(/무시 판매자 2명 빼고 셈/.test(t), `저장 뒤 '무시 판매자 2명 빼고 셈' 표시`);
  // ① 지정 판매자에서 태세를 무시로 바꿔도 기록
  await p.fill('#che_add', '333'); await p.click('#che_addb'); await W(p, 200); await p.selectOption('select[data-chs="333|stance"]', 'ignore'); await W(p, 150);
  ok(await p.evaluate(() => S.chE.draft.blLog.slice(-1)[0].act === 'on' && S.chE.draft.blLog.slice(-1)[0].sc === '333' && !!S.chE.draft.sellers['333'].blAt), '① 지정 판매자 태세를 무시로 → 블랙리스트 더함 기록');
  await p.click('button[data-chdel="333"]'); await W(p, 150); ok(await p.evaluate(() => S.chE.draft.blLog.slice(-1)[0].act === 'off'), '① 무시 판매자를 빼기 → 해제 기록');
  await p.evaluate(() => openChaseEngine({ tab: 'set', reload: 1 })); await W(p, 200);

  /* ④ 판매자 상세 빠른 단추 */
  await p.evaluate(() => { history.back(); }); await W(p, 300); await p.evaluate(() => openSeller('sc_333')); await W(p, 400);
  ok(await p.evaluate(() => !!document.querySelector('button[data-chbl="333"]') && !!document.querySelector('button[data-chgo="333"]')), "판매자 상세: '🎯 추격자 엔진에 지정' 옆 '🚫 블랙리스트(무시)'");
  await p.click('button[data-chbl="333"]'); await W(p, 500); t = await p.evaluate(() => document.getElementById('sheet').innerText);
  ok(/판매자 블랙리스트/.test(t) && /지금 무시 중 3명/.test(t) && /세번째/.test(t), '빠른 단추 → 블랙리스트 탭에 더해 열림');
  await p.click('#chbl_save'); await W(p, 400); ce = await p.evaluate(() => window.__FS.prd_system.pricing.chaseEng); ok(ce.sellers['333'] && ce.sellers['333'].stance === 'ignore' && ce.excl.strat === true, '빠른 단추로 더한 판매자 저장 · 다른 설정 그대로');
  await p.evaluate(() => { history.back(); }); await W(p, 300); await p.evaluate(() => openSeller('sc_222')); await W(p, 300);
  ok(/블랙리스트\(무시\) 중/.test(await p.evaluate(() => document.querySelector('button[data-chbl="222"]').innerText)), '판매자 상세: 이미 무시인 판매자는 "블랙리스트(무시) 중"');
  /* 🔍 기능 찾기 */
  ok(await p.evaluate(() => (typeof FEAT !== 'undefined' ? FEAT : []).some((f) => /판매자 블랙리스트/.test(f.t))), '🔍 기능 찾기에 블랙리스트');
}).then(() => { console.log(bad ? `❌ tCHASEBL 실패 ${bad}` : '✓ tCHASEBL 모두 통과'); }));

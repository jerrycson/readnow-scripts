// tCH1 — 11/02 정범님: 🎯 추격자 엔진 페이지 — 정책(지정 판매자·태세·조건·불특정 규칙·조건 묶음) 편집·저장 · 판매자 상세 단추 · 진행 중 · 관계 기록(판매자별·책별) · 전략별 성과 · 기능 찾기
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const W = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { p.on('pageerror', () => { bad++; }); await p.evaluate(require('./seed.js'));
  await p.evaluate(() => { window.confirm = () => true; S.sellers = S.sellers || new Map(); S.sellers.set('sc_111', { id: 'sc_111', sc: '111', name: '추격왕' }); S.sellers.set('sc_222', { id: 'sc_222', sc: '222', name: '조용한책방' });
    window.__FS.prd_system = window.__FS.prd_system || {}; window.__FS.prd_system.pricing = { presets: {} }; S.prCfg = { presets: {} }; });
  // ① 엔진이 전역에 있음 · 정책 꺼짐 처음
  const e0 = await p.evaluate(() => ({ v: window.ReadnowChase && window.ReadnowChase.VERSION, same: window.ReadnowPricing.Chase === window.ReadnowChase, step: typeof window.ReadnowPricing.chaseStep }));
  ok(e0.v && e0.same && e0.step === 'function', `엔진 ReadnowChase ${e0.v} · 판정 엔진 옛 이름 그대로`);
  await p.evaluate(() => openChaseEngine()); await W(p, 400);
  let t = await p.evaluate(() => document.getElementById('sheet').innerText); ok(/추격자 엔진/.test(t) && /꺼짐 — 예전과 똑같이/.test(t) && /지정 판매자/.test(t) && /불특정 판매자 규칙/.test(t) && /조건 묶음/.test(t), '페이지: 정책 꺼짐(예전 동작) · 지정·불특정·조건 묶음 칸');
  ok(/근거: 없음, 설정으로 바꿈|숫자 근거: 없음, 설정으로 바꿈/.test(t), "숫자 칸에 '근거: 없음, 설정으로 바꿈'");
  // ② 지정 판매자 더하기(번호) · 태세·전략·조건
  await p.fill('#che_add', '111'); await p.click('#che_addb'); await W(p, 200);
  await p.selectOption('select[data-chs="111|stance"]', 'aggressive'); await W(p, 150); await p.selectOption('select[data-chs="111|strat"]', 'match'); await W(p, 150);
  await p.fill('input[data-chc="s:111|maxFollow"]', '3'); await p.dispatchEvent('input[data-chc="s:111|maxFollow"]', 'change'); await p.fill('input[data-chc="s:111|hours"]', '9-22'); await p.dispatchEvent('input[data-chc="s:111|hours"]', 'change');
  // 이름으로 더하기
  await p.fill('#che_add', '조용한'); await p.click('#che_addb'); await W(p, 200); await p.selectOption('select[data-chs="222|stance"]', 'ignore'); await W(p, 150);
  // 불특정 규칙 · 조건 묶음
  await p.check('input[data-chrule="follow"]'); await p.check('input[data-chrule="second"]'); await p.fill('input[data-chc="a|backPct"]', '20'); await p.dispatchEvent('input[data-chc="a|backPct"]', 'change');
  await p.click('#che_csnew'); await W(p, 200); const csk = await p.evaluate(() => Object.keys(S.chE.draft.condSets)[0]); await p.fill(`input[data-chcsn="${csk}"]`, '조심 묶음'); await p.dispatchEvent(`input[data-chcsn="${csk}"]`, 'change'); await p.fill(`input[data-chc="c:${csk}|restH"]`, '12'); await p.dispatchEvent(`input[data-chc="c:${csk}|restH"]`, 'change');
  await p.selectOption('select[data-chs="111|condSet"]', csk); await W(p, 150); await p.check('input[data-chon="on"]'); await W(p, 150);
  t = await p.evaluate(() => document.getElementById('sheet').innerText); ok(/고친 것이 저장 안 됨/.test(t), '고친 뒤 저장 전 표시');
  // 잘못된 값은 저장 막음
  await p.evaluate(() => { S.chE.draft.anon.cond.hours = '아무때나'; }); await p.click('#che_save'); await W(p, 300); ok(!(await p.evaluate(() => !!(window.__FS.prd_system.pricing.chaseEng))), '잘못된 시간대 → 저장 안 함'); await p.evaluate(() => { delete S.chE.draft.anon.cond.hours; });
  await p.click('#che_save'); await W(p, 400);
  const sv = await p.evaluate(() => window.__FS.prd_system.pricing); const ce = sv.chaseEng || {};
  ok(ce.on === true && ce.sellers['111'].stance === 'aggressive' && ce.sellers['111'].strat === 'match' && ce.sellers['111'].cond.maxFollow === 3 && ce.sellers['111'].cond.hours === '9-22' && ce.sellers['111'].condSet === csk, '지정 판매자 1: 공격적·동가·조건(따를 횟수 3·시간대 9-22)·조건 묶음 저장');
  ok(ce.sellers['222'].stance === 'ignore' && ce.sellers['222'].name === '조용한책방', '이름으로 찾은 판매자 2: 무시');
  ok(ce.anon.rules.follow === true && ce.anon.rules.second === true && ce.anon.cond.backPct === 20 && ce.condSets[csk].name === '조심 묶음' && ce.condSets[csk].cond.restH === 12, '불특정 규칙·조건 묶음 저장');
  ok(Array.isArray(sv.chaseEngLog) && sv.chaseEngLog.length === 1 && sv.chaseEngLog[0].on === true, '바꾼 기록 남김(chaseEngLog)');
  // 엔진이 저장한 정책으로 판단 (같은 정책 → 같은 엔진)
  const j = await p.evaluate(() => { const CH = window.ReadnowChase; const P = window.__FS.prd_system.pricing.chaseEng; const ch = CH.find([{ sc: '111', p: 9000, g: '상' }], {}, '상', P);
    const r = CH.judge({ policy: P, groupStrat: { name: 'yield' }, chaser: ch, state: null, now: '2026-11-02T03:00:00Z' /* 12시 */, cur: 10000, base: 9000, yieldT: 9500, floor: 0, start: 10000 }); return { who: ch && ch.who, name: r.state && r.state.name, t: r.t }; });
  ok(j.who === 'specific' && j.name === 'match' && j.t === 9000, `저장한 정책으로 엔진 판단: 지정·동가 9,000 (${JSON.stringify(j)})`);
  // ③ 판매자 빼고 저장 → 통째 바뀜(뺀 판매자 안 남음)
  await p.click('button[data-chdel="222"]'); await W(p, 150); await p.click('#che_save'); await W(p, 400); ok(!(await p.evaluate(() => !!window.__FS.prd_system.pricing.chaseEng.sellers['222'])), '뺀 판매자는 저장 뒤 남지 않음');
  // ④ 진행 중 · 관계 기록 · 성과 (기록 자료를 넣고)
  await p.evaluate(() => { const F = window.__FS; F.prd_price_decisions = F.prd_price_decisions || {}; F.prd_price_decisions.aladin_U215983410 = { title: '테스트 책 0', usedCode: 'U215983410', current: 5000, target: 4950, watchGid: 'g1', chaser: { sellerCode: '111', name: '추격왕', price: 5000 }, strat: { active: true, name: 'lure', phase: 'probe', round: 1, who: 'specific', stance: 'aggressive', nextAt: '2026-11-02T09:00:00Z', lastAt: '2026-11-02T03:00:00Z' } };
    F.chase_rel = { 111: { sc: '111', name: '추격왕', n: 4, moves: 2, books: { bk0: { t: '테스트 책 0', n: 4 } }, lastAt: '2026-11-02T03:00:00Z', lastStrat: 'lure', who: 'specific' }, 555: { sc: '555', name: '모르는이', n: 2, moves: 1, books: { bk1: {} }, lastAt: '2026-11-01T03:00:00Z', lastStrat: 'follow', who: 'anon' } };
    F.chase_log = { a: { at: '2026-11-02T03:00:00Z', day: '2026-11-02', sc: '111', scName: '추격왕', bookId: 'bk0', title: '테스트 책 0', strat: 'lure', phase: 'probe', from: 5000, to: 4950, chP: 5000, chPrev: 5200, why: '끌어내리기 1회' }, b: { at: '2026-11-01T03:00:00Z', day: '2026-11-01', sc: '555', scName: '모르는이', bookId: 'bk0', title: '테스트 책 0', strat: 'follow', phase: 'follow', from: 5200, to: 5100, chP: 5100, why: '따르기 1/2번' } };
    F.chase_eps = { e1: { key: 'aladin_U215983410', strat: 'lure', who: 'specific', stance: 'aggressive', rule: 'aggressive', startedAt: '2026-10-20T00:00:00Z', startP: 5000, lastP: 4800 }, e2: { key: 'aladin_U215983411', strat: 'follow', who: 'anon', rule: 'follow', startedAt: '2026-10-20T00:00:00Z', startP: 6000, lastP: 6000 } };
    F.chase_day = { '2026-11-02': { day: '2026-11-02', lure: { steps: 3, moves: 2, starts: 1, ends: 0 } } };
    F.prd_price_decisions.aladin_U215983412 = { watchGid: 'g1', current: 6400, watch: { gid: 'g1', since: '2026-10-20T00:00:00Z', startPrice: 6400 } }; S.prBatches = [{ id: 'g1', name: '감시1', watch: { on: true } }];
    S.orders = S.orders || new Map(); S.orders.set('o1', { id: 'o1', kind: 'sale', orderedAt: '2026-10-24T00:00:00Z', items: [{ lineStatus: 'normal', aladinUsedCode: 'U215983410', qty: 1, price: 4800 }] }); S.orders.set('o2', { id: 'o2', kind: 'sale', orderedAt: '2026-10-30T00:00:00Z', items: [{ lineStatus: 'normal', aladinUsedCode: 'U215983412', qty: 1, price: 6400 }] }); S.ordersLoaded = true; S._saleIdx = null;
    S.pmatch = S.pmatch || new Map(); S.pmatch.set('aladin_U215983410', { cost: 2000, kind: 'x' }); });
  await p.click('button[data-chtab="live"]'); await W(p, 500); t = await p.evaluate(() => document.getElementById('che_body').innerText);
  ok(/테스트 책 0/.test(t) && /끌어내린 뒤 빠지기/.test(t) && /지정 · 공격적/.test(t), '🟢 지금 진행 중: 책·전략·지정 판매자 태세');
  await p.click('button[data-chtab="rel"]'); await W(p, 500); t = await p.evaluate(() => document.getElementById('che_body').innerText);
  ok(/추격왕/.test(t) && /모르는이/.test(t) && /지정 · 공격적/.test(t) && /불특정/.test(t), '📒 관계 기록: 지정·불특정 판매자 목록');
  await p.click('button[data-chwho="anon"]'); await W(p, 400); t = await p.evaluate(() => document.getElementById('che_body').innerText); ok(/모르는이/.test(t) && !/추격왕/.test(t), '불특정만 거르기');
  await p.click('button[data-chwho="all"]'); await W(p, 400); await p.click('a[data-chsc="111"]'); await W(p, 500); t = await p.evaluate(() => document.getElementById('che_body').innerText);
  ok(/그: 5,200 → 5,000원/.test(t) && /우리: 5,000 → 4,950원/.test(t) && /끌어내리기 1회/.test(t), '판매자별 상세: 그가 한 일 · 우리가 한 일 · 까닭');
  await p.click('a[data-chbook="bk0"]'); await W(p, 500); t = await p.evaluate(() => document.getElementById('che_body').innerText); ok(/추격왕/.test(t) && /모르는이/.test(t), '책별 상세: 그 책에 얽힌 판매자 모두');
  await p.click('button[data-chtab="perf"]'); await W(p, 700); t = await p.evaluate(() => document.getElementById('che_body').innerText);
  ok(/끌어내린 뒤 빠지기/.test(t) && /1 \(100%\)/.test(t) && /4일/.test(t) && /96%/.test(t) && /2,800원/.test(t), `📊 성과: 판매 1(100%) · 4일 · 판매가÷시작 96% · 이익 2,800원`);
  ok(/전략 안 씀/.test(t) && /10일/.test(t), '비교 줄: 전략 안 쓴 같은 감시 그룹 상품(10일)'); ok(/최근 14일/.test(t), '하루 수 표');
  await p.click('button[data-chby="stance"]'); await W(p, 600); t = await p.evaluate(() => document.getElementById('che_body').innerText); ok(/공격적/.test(t) && /불특정/.test(t), '태세별로 묶기');
  await p.click('button[data-chtab="about"]'); await W(p, 300); t = await p.evaluate(() => document.getElementById('che_body').innerText); ok(/24시간/.test(t) && /7일/.test(t) && /3번/.test(t), '📖 지금 구조(엔진 기본값에서 읽음)');
  // ⑤ 판매자 상세 단추 → 페이지에 그 판매자
  await p.evaluate(() => history.back()); await W(p, 600); await p.evaluate(() => openSeller('sc_111')); await W(p, 600); t = await p.evaluate(() => document.getElementById('sheet').innerText); ok(/🎯 추격자 엔진: 공격적/.test(t), '판매자 상세에 🎯 태세 표시');
  await p.evaluate(() => { S.sellers.set('sc_333', { id: 'sc_333', sc: '333', name: '새판매자' }); openSeller('sc_333'); }); await W(p, 600); await p.click('button[data-chgo="333"]'); await W(p, 500);
  const g = await p.evaluate(() => ({ has: !!(S.chE.draft.sellers['333']), t: document.getElementById('sheet').innerText })); ok(g.has && /새판매자/.test(g.t) && /고친 것이 저장 안 됨/.test(g.t), "판매자 상세 '🎯 추격자 엔진에 지정' → 페이지에 더해짐(저장 전)");
  await p.evaluate(() => history.back()); await W(p, 500);
  // ⑥ 기능 찾기 · 휴대폰 폭
  const f = await p.evaluate(() => FEAT.some((x) => /추격자 엔진/.test(x.t) && x.go && x.go.fn)); ok(f, '🔍 기능 찾기에 있음');
  await p.setViewportSize({ width: 380, height: 760 }); await p.evaluate(() => { S.chE.tab = 'set'; openChaseEngine(); }); await W(p, 400); const ov = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2 || document.getElementById('sheet').scrollWidth <= document.getElementById('sheet').clientWidth + 40); ok(ov, '휴대폰 폭에서 크게 넘치지 않음');
}).then(() => { console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0); });

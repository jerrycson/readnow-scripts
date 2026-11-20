// tBKSLR1118 — (정범님 11/18 I-1118-1208-11.4) 🧮 수동 일괄 「특정 판매자와 겹치는 상품」 + 그룹 조건 한눈에(문장·칩·켜고 끄기)
//  ① 순수 셈: 옛 그룹 조건 옮기기(칸 없음 = 그대로) · 겹침 방식 셋(한 명이라도·모두·아무도) · 품절 매물 · 첫 쪽 못 읽은 책은 빠짐 · 우리 가게 안 셈
//        판매자 정렬 13가지 · 이름·번호 찾기 · 저장 묶음 켜고 끄기 · 조건 끄기/켜기/지우기(값 기억) · 한 줄 문장
//  ② 화면: 판매자 칸(치면 찾기 · Enter 넣기 · 목록 고르기·정렬) · 묶음 저장(모든 기기 문서 _bkslr) · 칩 ● 끄기 ○ 켜기 · 옛 그룹 그대로 열림 · 브라우저 창 없음
// 실행: RN_PORT=<포트> node tBKSLR1118.js (test-gate가 시험 틀 옆에서 돌림) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
console.log('① 순수 셈');
{ const blk = cut('/* ◆bslr 시작', '/* ◆bslr 끝 */');
  const STUB = "const PM_T = [null, ['100', '가게가'], ['200', '가게나'], ['996008', '우리']]; const isPmMem = (m) => !!m && !!m.__pm; const p1Has = (m) => !!m && (m.__pm ? !!m._p1 : !!m.usedFirstPage); const OUR_SC = '996008'; const cheSellerName = (x) => ({ '300': '가게다' })[x] || null;\n";
  const F = new Function(STUB + blk + '\nreturn { BSLR_MODE, BSLR_SO, BCOND, batchCondNorm, bslrCodesOf, bslrHit, bslrSort, bslrMatch, bslrSetOn, bslrSetToggle, bcondSet, bcondFix, bcondList, bcondSentence };')();
  /* 옛 그룹 조건 옮기기 */
  const old = { name: '옛 그룹', grades: ['상'], pmin: 3000 }; const o2 = F.batchCondNorm(JSON.parse(JSON.stringify(old)));
  ok(JSON.stringify(o2.slrOv) === '[]' && o2.slrOvMode === 'any' && o2.slrOvSo === false && JSON.stringify(o2.slrOvNm) === '{}' && o2.grades.join() === '상' && o2.pmin === 3000 && !('off' in o2), '옛 그룹(칸 없음) = 빈 판매자 목록(조건 안 씀) · 다른 칸 그대로');
  const o3 = F.batchCondNorm({ slrOv: ' 100, 200,100,,', slrOvMode: 'x', slrOvSo: 1, slrOvNm: [], off: {} });
  ok(o3.slrOv.join() === '100,200' && o3.slrOvMode === 'any' && o3.slrOvSo === true && !Array.isArray(o3.slrOvNm) && !('off' in o3), '글로 저장된 목록 → 배열(겹침·빈칸 뺌) · 모르는 방식 = any · 빈 off 지움');
  ok(F.batchCondNorm({ slrOv: [100, 200], slrOvMode: 'none', off: { kw: { kw: 'a' } } }).slrOv.join() === '100,200' && F.batchCondNorm({ slrOvMode: 'all' }).slrOvMode === 'all' && F.batchCondNorm({ off: { kw: { kw: 'a' } } }).off.kw.kw === 'a' && F.batchCondNorm(null) === null, '숫자 번호 → 글 · 맞는 방식·꺼 둔 조건은 그대로 · 빈 값도 안 깨짐');
  /* 겹침 셈 */
  const mA = { usedFirstPage: [{ sellerCode: 100, sellerName: '가게가' }, { sellerCode: '996008' }, { sellerCode: '200', soldOut: true }] };
  const mB = { __pm: 1, _p1: [0, 1, 0, 16, 2, 0, 0, 3, 0] }; /* 기기 보관 꼴: 100(팜) · 200(품절) · 우리 */
  const mC = { __pm: 1, _p1: [0, 9, 0], _p1o: [0, { sellerCode: '300', sellerName: '가게다' }] }; /* 따로 둔 줄 */
  const cs = (m, so) => { const s = F.bslrCodesOf(m, so); return s ? [...s].sort().join() : null; };
  ok(cs(mA) === '100' && cs(mA, true) === '100,200', '첫 쪽(평범한 꼴): 우리 가게 빼고 · 품절 매물은 「품절도 셈」일 때만');
  ok(cs(mB) === '100' && cs(mB, true) === '100,200' && cs(mC) === '300', '기기 보관 꼴(_p1·_p1o)도 같은 셈');
  ok(cs({}) === null && cs(null) === null && cs({ __pm: 1 }) === null && cs({ usedFirstPage: [] }) === '', '첫 쪽을 못 읽은 책 = 모름(null) · 읽었는데 비었으면 빈 모음');
  const S1 = new Set(['100', '200']), S0 = new Set();
  ok(F.bslrHit(S1, ['100', '900'], 'any') && !F.bslrHit(S1, ['800', '900'], 'any'), '한 명이라도: 고른 판매자 중 하나만 팔아도 들어감');
  ok(F.bslrHit(S1, ['100', '200'], 'all') && !F.bslrHit(S1, ['100', '900'], 'all'), '모두: 고른 판매자가 다 팔아야 들어감');
  ok(F.bslrHit(S0, ['100'], 'none') && !F.bslrHit(S1, ['100', '900'], 'none'), '아무도 안 팖: 하나라도 팔면 빠짐');
  ok(!F.bslrHit(null, ['100'], 'any') && !F.bslrHit(null, ['100'], 'all') && !F.bslrHit(null, ['100'], 'none'), '첫 쪽 못 읽은 책은 어느 방식이든 빠짐(모르는 것을 「안 팖」으로 치지 않음)');
  /* 판매자 정렬 13가지 */
  const R = [{ sc: '1', name: '나', cls: 'green', model: 50, gain: 10, won: null, n: 5, nl: 7, items: 100, rate: 0.9, r6: 30, rev: 300, out: 0.05, age: 3 },
    { sc: '2', name: '가', cls: 'dkgreen', model: 40, gain: 30, won: 9000, n: 2, nl: 2, items: 900, rate: 0.99, r6: 10, rev: 900, out: 0.01, age: 9 },
    { sc: '3', name: '다', cls: 'red', model: 90, gain: -5, won: 2000, n: 9, nl: 12, items: 10, rate: 0.5, r6: 80, rev: 10, out: 0.2, age: 1 },
    { sc: '4', name: '라', cls: null, model: null, gain: null, won: null, n: 0, nl: 0, items: null, rate: null, r6: null, rev: 0, out: null, age: null }];
  const so = (k, rev) => F.bslrSort(R, k, rev).map((r) => r.sc).join('');
  ok(F.BSLR_SO.length === 13 && F.BSLR_SO.every(([k, l]) => typeof l === 'string' && l.length > 2), '정렬 13가지 · 이름표 모두 있음', F.BSLR_SO.map((x) => x[0]));
  const W = { cls: '2134', model: '3124', gain: '2134', won: '2314', n: '3124', nl: '3124', items: '2134', rate: '2134', r6: '3124', rev: '2134', age: '2134', name: '2134' };
  const got = Object.fromEntries(Object.keys(W).map((k) => [k, so(k)])); ok(Object.keys(W).every((k) => got[k] === W[k]), '정렬마다 차례(우리 평가 색 → 모범·이득·매출(아는 것 먼저)·겹침·매물·상품·평점·6개월·평가·연수·이름)', got);
  ok(so('out')[0] === '2' && so('out').indexOf('4') === 3, '품절 취소율 = 낮은 판매자 먼저 · 모름은 맨 뒤', so('out'));
  ok(so('n', true) === '4213' && F.bslrSort(R, 'zz').length === 4 && F.bslrSort(null, 'n').length === 0, '거꾸로 · 모르는 정렬 이름 · 빈 목록도 안 깨짐');
  ok(R.map((r) => r.sc).join('') === '1234', '정렬이 원래 목록을 바꾸지 않음');
  /* 찾기 */
  const RM = [{ sc: '12345', name: '책사랑 서점', n: 3 }, { sc: '12999', name: '사랑방', n: 9 }, { sc: '996008', name: '우리 가게 사랑', n: 99 }, { sc: '777', name: '책', n: 1 }];
  ok(F.bslrMatch(RM, '사랑').map((r) => r.sc).join() === '12999,12345', '이름에 든 글로 찾기 · 겹치는 책 많은 판매자 먼저 · 우리 가게 안 나옴');
  ok(F.bslrMatch(RM, '12').map((r) => r.sc).join() === '12999,12345' && F.bslrMatch(RM, '777')[0].sc === '777' && F.bslrMatch(RM, '책')[0].sc === '777', '번호 앞부분으로 찾기 · 똑같은 이름·번호가 맨 위');
  ok(F.bslrMatch(RM, '  ').length === 0 && F.bslrMatch(RM, '사', 1).length === 1, '빈 글 = 없음 · 개수 한도');
  /* 저장 묶음 켜고 끄기 */
  const set = { id: 's1', name: '경쟁 셋', codes: ['100', 200], names: ['가게가', '가게나'] }; const c1 = { slrOv: ['300'], slrOvNm: { 300: '가게다' } };
  ok(!F.bslrSetOn(set, c1) && F.bslrSetToggle(c1, set) === true && c1.slrOv.join() === '300,100,200' && c1.slrOvNm['200'] === '가게나', '묶음 누름 = 켬(고른 판매자에 더함 · 이름도)');
  ok(F.bslrSetOn(set, c1) && F.bslrSetToggle(c1, set) === false && c1.slrOv.join() === '300' && !c1.slrOvNm['100'] && c1.slrOvNm['300'] === '가게다', '다시 누름 = 끔(묶음 판매자만 뺌 · 따로 고른 판매자는 그대로)');
  ok(!F.bslrSetOn({ codes: [] }, c1) && !F.bslrSetOn(null, c1), '빈 묶음은 켜진 것으로 안 봄');
  /* 그룹 조건 끄기·켜기·지우기 */
  const ids = F.BCOND.map((e) => e.id); ok(new Set(ids).size === ids.length && F.BCOND.every((e) => Array.isArray(e.k) && e.k.length && typeof e.t === 'function' && e.l), '조건 표: id 겹침 없음 · 칸·글·이름표 모두');
  const DEFK = cut('const BATCH_DEF = {', '};'); const miss = F.BCOND.flatMap((e) => e.k).filter((k) => !new RegExp('\\b' + k + ':').test(DEFK) && !['recentDays', 'rest', 'exCtrl', 'exPx'].includes(k)); /* 칸 없음 = 기본(비교군·실험 빼기 켬 · 나머지 그룹 아님) */
  ok(miss.length === 0, '조건 표의 칸이 모두 그룹 기본값(BATCH_DEF)에 있음', miss);
  const cc = { grades: ['상', '최상'], pmin: 3000, pmax: '', kw: '소설', slrOv: ['100'], slrOvMode: 'all', slrOvSo: true, slrOvNm: { 100: '가게가' }, exCtrl: undefined, exHold: true, recentDays: 7 };
  const s0 = F.bcondSentence(cc); ok(/상·최상 등급/.test(s0) && /판매가 3,000원 이상/.test(s0) && /이름에 「소설」/.test(s0) && /가게가/.test(s0) && /빼기: .*판매보류풀/.test(s0) && /다른 그룹 비교군/.test(s0) && /최근 7일/.test(s0), '한 줄 문장 = 켜진 조건 모두(대상 · 빼기)', s0);
  ok(F.bcondSet(cc, 'kw', 'off') && cc.kw === '' && cc.off.kw.kw === '소설' && !/소설/.test(F.bcondSentence(cc)) && F.bcondList(cc).find((x) => x.id === 'kw').off, '● 끄기 = 칸을 비우고 값은 기억(꺼 둔 조건으로 보임)');
  ok(F.bcondSet(cc, 'kw', 'on') && cc.kw === '소설' && !cc.off, '○ 켜기 = 기억한 값 그대로 돌아옴 · 보관 비면 지움');
  ok(F.bcondSet(cc, 'slrOv', 'off') && cc.slrOv.length === 0 && cc.slrOvMode === 'any' && F.bcondSet(cc, 'slrOv', 'on') && cc.slrOv.join() === '100' && cc.slrOvMode === 'all' && cc.slrOvSo === true && cc.slrOvNm['100'] === '가게가', '판매자 조건도 끄고 켜면 판매자·방식·품절 셈·이름 그대로');
  ok(F.bcondSet(cc, 'exCtrl', 'off') && cc.exCtrl === false && F.bcondSet(cc, 'exCtrl', 'on') && !('exCtrl' in cc), '기본으로 켜진 빼기(비교군 · 칸 없음 = 켬)도 끄고 켜면 원래대로(칸 없음)');
  ok(!F.bcondSet(cc, 'exControl', 'off') && F.bcondSet(cc, 'exControl', 'on') && cc.exControl === true && F.bcondSet(cc, 'recent', 'clear') && cc.recentDays === 0 && F.bcondSet(cc, 'recent', 'on') && cc.recentDays === 7, '꺼진 빼기는 ○ 누르면 처음 값으로 켬 · ✕ 지우기');
  ok(!F.bcondSet(cc, 'nope', 'off') && !F.bcondSet(cc, 'sku', 'off'), '없는 조건·빈 조건은 끄지 않음');
  F.bcondSet(cc, 'grades', 'off'); cc.grades = ['중']; F.bcondFix(cc); ok(!cc.off, '꺼 둔 조건 칸을 손으로 다시 채우면 기억한 값은 버림(새 값이 이김)');
  F.bcondSet(cc, 'price', 'off'); F.bcondSet(cc, 'price', 'clear'); ok(!cc.off && cc.pmin === '' && cc.pmax === '', '꺼 둔 조건을 ✕ 지우면 기억도 버림');
  const oc = { only: ['a', 'b'], grades: ['상'], exHold: true, recentDays: 0 };
  ok(F.bcondSentence(oc, true).startsWith('대상 고정 상품') && !F.bcondList(oc, true).some((x) => x.id === 'grades') && F.bcondList(oc, true).some((x) => x.id === 'exControl'), '대상 고정 그룹: 상품 선정 조건은 안 보이고 빼기만');
  const blank = F.batchCondNorm({}); ok(F.bcondSentence(blank) === '판매중 상품 전부 (빼기: 다른 그룹 비교군 · 🔬 조회수 실험 중)', '빈 그룹 문장', F.bcondSentence(blank));
  /* 정적 검사 */
  const mine = cut('/* ◆bslr 시작', 'function batchFilter(c, gid');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(mine) && !/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/.test(mine), '새 코드에 브라우저 창·휴대전화 번호 꼴 없음');
  const bf = cut('function batchFilter(c, gid', '\nfunction ');
  ok(/slrOn/.test(bf) && /bslrCodesOf\(/.test(bf) && /bslrHit\(/.test(bf), '그룹 대상 셈(batchFilter)에 겹치는 판매자 검사');
  ok(/d\.id === '_bkslr'/.test(T) && (T.match(/batchCondNorm\(/g) || []).length >= 5, '그룹 모음에서 _bkslr 문서는 묶음으로 받음 · 그룹 여는 곳마다 조건 옮기기');
  ok(/MEMO_DEPS[^\n]*\['bslr', 'psmb'\]/.test(T) || /\['bslr', 'psmb'\]/.test(T), '판매자 셈 기억은 시장 지표가 바뀌면 다시 셈(MEMO_DEPS)');
  { const bb = cut('function bslrBind(', '/* ── 그룹 조건 한눈에'); ok(/__bslrAc\.abort\(\)/.test(bb) && (bb.match(/\}, LO\)/g) || []).length === 4 && /__bcAc\.abort\(\)/.test(T), '판매자 칸·조건 판을 다시 묶으면 앞 묶음을 풂(두 번 묶여 단추가 두 번 눌리던 것 막음 — 목록 고르기가 열렸다 바로 닫히던 일)'); }
  for (const fn of ['bslrIndex', 'bslrRows', 'bslrBind', 'bcondHtml', 'bcondMark', 'bcondEff', 'bslrSetsSave']) ok((T.match(new RegExp('function ' + fn + '\\(', 'g')) || []).length === 1, `함수 이름 ${fn} 하나뿐(다른 함수와 안 겹침)`);
}
if (!process.env.RN_PORT) { console.log(bad ? `❌ tBKSLR1118 ${bad}개 실패` : '✓ tBKSLR1118 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const setup = async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
  await p.evaluate(async () => { window.__TL = []; const T0 = window.toast; window.toast = (m, e, ms) => { window.__TL.push(String(m)); return T0 && T0(m, e, ms); };
    window.askText = async (q, d) => '시험 묶음';
    /* 판매자 셋 · 책마다 첫 쪽: bk0~bk5 = 가게가(1001) · bk0~bk2 = 가게나(1002) · bk6 = 가게나 품절만 · bk7~ = 첫 쪽 없음 */
    const sl = [['1001', '가게가'], ['1002', '가게나'], ['1003', '먼가게']]; for (const [sc, nm] of sl) S.sellers.set('sc_' + sc, { id: 'sc_' + sc, sc, name: nm, totalReviewCount: +sc - 990 });
    for (let i = 0; i < 12; i++) { const bid = 'bk' + i; if (i > 6) { S.pmetrics.delete(bid); continue; } const pg = [{ sellerCode: '996008', price: 5000 }]; if (i <= 5) pg.push({ sellerCode: '1001', sellerName: '가게가', price: 4000 }); if (i <= 2) pg.push({ sellerCode: '1002', sellerName: '가게나', price: 4500 }); if (i === 6) pg.push({ sellerCode: '1002', sellerName: '가게나', price: 4100, soldOut: true });
      S.pmetrics.set(bid, { id: bid, usedFirstPage: pg, usedTotal: pg.length, lastCheckedAt: new Date().toISOString() }); }
    try { S.ver++; } catch (e) {} if (typeof memoClear === 'function') memoClear(); S.prBatches = []; S.bkslr = undefined; S.batchId = null; S.bslrPk = null; S.bCondMore = null; try { localStorage.removeItem('rn-bslr'); } catch (e) {} }); };
const cnt = (p) => p.evaluate(() => { const t = (document.querySelector('#sheet #bcount') || {}).textContent || ''; const m = t.match(/해당 상품 ([\d,]+)개/); return m ? +m[1].replace(/,/g, '') : null; });
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); }); await setup(p);
  await p.evaluate(async () => { openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: '판매자 시험' }))); await new Promise((r) => setTimeout(r, 500)); });
  const n0 = await cnt(p); ok(n0 === 10, '조건 없이 판매중 10개(시험 자료)', n0);
  { const ff = await p.evaluate(() => ['겹치는 판매자', '판매자 묶음', '잠시 끔', '조건 한눈에'].map((q) => (featFind(q)[0] || {}).t || '')); ok(ff.every((t) => /수동 일괄/.test(t)), '🔍 기능 찾기: 「겹치는 판매자」「판매자 묶음」「잠시 끔」「조건 한눈에」 → 수동 일괄 줄이 맨 위', ff); }
  ok(await p.evaluate(() => !!document.querySelector('#sheet .brow.bslr #bslr_q') && !!document.querySelector('#sheet #bcond')), '판매자 칸(이름 치기)과 「이 그룹의 조건」 판이 보임');
  /* (가) 이름 치기 → 자동 완성 → Enter */
  await p.locator('#sheet #bslr_q').fill('가게'); await p.waitForTimeout(200);
  const ac = await p.evaluate(() => [...document.querySelectorAll('#sheet #bslr_ac [data-bslrac]')].map((b) => b.dataset.bslrac));
  ok(ac[0] === '1001' && ac.includes('1002') && !ac.includes('996008'), '「가게」 치면 바로 찾음 · 겹치는 책 많은 판매자 먼저 · 우리 가게 안 나옴', ac);
  await p.locator('#sheet #bslr_q').press('Enter'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => S.batchC && S.batchC.slrOv.join() === '1001' && /가게가/.test(document.querySelector('#sheet #bslr_ch').textContent)), 'Enter = 맨 위 판매자를 넣음 · 칩으로 보임', await p.evaluate(() => S.batchC && S.batchC.slrOv));
  const n1 = await cnt(p); ok(n1 === 4, '가게가와 겹치는 판매중 책만(bk0~bk5 중 판매완료·판매중지 빼고 4)', n1);
  /* (나) 목록에서 고르기 · 정렬 */
  await p.locator('#sheet #bslr_list').click(); await p.waitForTimeout(250);
  const so = await p.evaluate(() => [...document.querySelectorAll('#sheet #bslr_so option')].map((o) => o.value)); ok(so.length === 13, '📋 목록 = 정렬 13가지', so);
  const rows = await p.evaluate(() => [...document.querySelectorAll('#sheet #bslr_pkr [data-bslrpk]')].map((x) => x.dataset.bslrpk)); ok(rows[0] === '1001' && rows.includes('1002') && !rows.includes('1003'), '기본 = 겹치는 책 많은 순 · 겹치지 않는 판매자는 숨김(끌 수 있음)', rows);
  await p.locator('#sheet #bslr_so').selectOption('rev'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('rn-bslr')).so === 'rev'; } catch (e) { return false; } }), '고른 정렬은 이 기기에 기억');
  await p.locator('#sheet #bslr_pkr [data-bslrpk="1002"]').check(); await p.waitForTimeout(400);
  ok(await p.evaluate(() => S.batchC.slrOv.join() === '1001,1002'), '목록에서 체크 = 판매자 더함');
  ok(await cnt(p) === 4, '한 명이라도(기본): 둘 중 하나라도 파는 책 = 4', await cnt(p));
  await p.locator('#sheet [data-bf="slrOvMode"]').selectOption('all'); await p.waitForTimeout(400);
  const nAll = await cnt(p); ok(nAll === 3, '모두 파는: 가게가·가게나 둘 다 = bk0~bk2 = 3', nAll);
  await p.locator('#sheet [data-bf="slrOvMode"]').selectOption('none'); await p.waitForTimeout(400);
  const nNone = await cnt(p); ok(nNone === 1, '아무도 안 파는: bk6(가게나는 품절만) 하나 · 첫 쪽 없는 책(bk7~)은 빠짐', nNone);
  /* 묶음 저장 · 켜고 끄기 */
  await p.locator('#sheet #bslr_save').click(); await p.waitForTimeout(500);
  const sv = await p.evaluate(() => ((window.__FS.prd_price_batches || {})._bkslr || {}).sets || []); ok(sv.length === 1 && sv[0].name === '시험 묶음' && sv[0].codes.join() === '1001,1002', '⭐ 묶음 저장 = 모든 기기 문서(prd_price_batches/_bkslr)', sv);
  await p.evaluate(async () => { const b = document.querySelector('#sheet [data-bslrx="*"]'); b.click(); await new Promise((r) => setTimeout(r, 300)); });
  ok(await p.evaluate(() => S.batchC.slrOv.length === 0), '모두 빼기');
  await p.evaluate(async () => { document.querySelector('#sheet [data-bslrset]').click(); await new Promise((r) => setTimeout(r, 300)); });
  ok(await p.evaluate(() => S.batchC.slrOv.join() === '1001,1002' && document.querySelector('#sheet .bslr-set.on')), '묶음 한 번 누름 = 두 판매자가 켜짐(켜짐 표시)');
  ok(await p.evaluate(() => !S.prBatches.some((g) => g.id === '_bkslr')), '_bkslr 문서는 그룹 목록에 안 들어감');
  /* 그룹 조건 한눈에 — 칩 ● 끄기 · ○ 켜기 */
  await p.evaluate(async () => { const c = S.batchC; c.slrOvMode = 'any'; c.kw = '테스트 책 1'; openBatch(c); await new Promise((r) => setTimeout(r, 500)); });
  const s1 = await p.evaluate(() => document.querySelector('#sheet #bcond').textContent); ok(/이름에 「테스트 책 1」/.test(s1) && /가게가/.test(s1), '켜진 조건이 문장·칩으로 보임', s1.slice(0, 300));
  const nk = await cnt(p); await p.evaluate(async () => { document.querySelector('#sheet #bcond [data-bccsw="kw"]').click(); await new Promise((r) => setTimeout(r, 500)); });
  const nk2 = await cnt(p); ok(await p.evaluate(() => S.batchC.kw === '' && S.batchC.off && S.batchC.off.kw && document.querySelector('#sheet #bcond .bcc.off')) && nk2 >= nk, '● = 잠시 끔(셈이 바로 바뀜 · ⏸ 꺼 둔 조건에 남음)', [nk, nk2]);
  await p.evaluate(async () => { document.querySelector('#sheet #bcond [data-bccsw="kw"]').click(); await new Promise((r) => setTimeout(r, 500)); });
  ok(await p.evaluate(() => S.batchC.kw === '테스트 책 1' && !S.batchC.off) && await cnt(p) === nk, '○ = 기억한 값 그대로 다시 켬', await cnt(p));
  await p.evaluate(async () => { document.querySelector('#sheet #bcond [data-bccgo="kw"]').click(); await new Promise((r) => setTimeout(r, 400)); });
  ok(await p.evaluate(() => { const r = document.querySelector('#sheet .brow[data-bcid~="kw"]'); return !!r && document.querySelector('#sheet .bformd').open; }), '칩 글 누름 = 그 칸으로(접힌 판이 열림)');
  ok(await p.evaluate(() => [...document.querySelectorAll('#sheet #bcond_add option')].length > 20), '＋ 조건 더하기 = 아직 안 쓴 조건 목록');
  /* 저장한 그룹 = 결과가 바로 보이게 아랫줄(빼는 것·꺼 둔 것·더하기) 접힘 · 한 줄 단추로 펼침 */
  const fo = await p.evaluate(async () => { S.batchId = 'gx'; S.bCondMore = null; S.bFormOpen = false; openBatch(S.batchC); await new Promise((r) => setTimeout(r, 400)); const bp = document.querySelector('#sheet #bcond'); const a = { l: bp.querySelectorAll('.bcond-l').length, add: !!bp.querySelector('#bcond_add'), btn: bp.querySelector('[data-bcmore]').textContent, kw: !!bp.querySelector('[data-bccsw="kw"]'), fdH: document.querySelector('#sheet .bformd').offsetHeight, fb: !!bp.querySelector('[data-bcform]') };
    bp.querySelector('[data-bcmore]').click(); await new Promise((r) => setTimeout(r, 300)); const b = { l: bp.querySelectorAll('.bcond-l').length, add: !!bp.querySelector('#bcond_add'), btn: bp.querySelector('[data-bcmore]').textContent };
    bp.querySelector('[data-bcform]').click(); await new Promise((r) => setTimeout(r, 300)); const fd = document.querySelector('#sheet .bformd'); b.fdOpen = fd.open; b.fdH = fd.offsetHeight; b.fdMem = S.bFormOpen; S.bFormOpen = false;
    S.batchId = null; S.bCondMore = null; return { a, b }; });
  ok(fo.a.l === 0 && !fo.a.add && /▸ 🚫 빼는 것 \d+/.test(fo.a.btn) && fo.a.kw && fo.b.l >= 1 && fo.b.add && /접기/.test(fo.b.btn), '저장한 그룹: 고른 조건 칩은 보이고 빼는 것·더하기 줄은 접힘 → 단추 한 번에 펼침', fo);
  ok(fo.a.fdH === 0 && fo.a.fb && fo.b.fdOpen && fo.b.fdH > 100 && fo.b.fdMem === true, '저장한 그룹: 따로 있던 「⚙ 그룹 조건」 접힌 카드는 🧩 판 한 장에 합쳐 숨김 → ⚙ 모든 칸 단추로 모든 칸 펼침', fo);
  /* 옛 그룹(칸 없음)도 그대로 열림 */
  await p.evaluate(async () => { openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: '옛', grades: ['상'], slrOv: undefined, slrOvMode: undefined }))); await new Promise((r) => setTimeout(r, 400)); });
  ok(await p.evaluate(() => Array.isArray(S.batchC.slrOv) && S.batchC.slrOv.length === 0 && S.batchC.slrOvMode === 'any') && await cnt(p) === 3, '옛 그룹(판매자 칸 없음) = 판매자 조건 없이 같은 대상(상 등급 3)', await cnt(p));
  ok(dlg.length === 0, '브라우저 창(alert·confirm·prompt) 없음', dlg);
  console.log(bad ? `❌ tBKSLR1118 ${bad}개 실패` : '✓ tBKSLR1118 통과'); process.exitCode = bad ? 1 : 0; });

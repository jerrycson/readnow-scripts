// tPXHM_H — (판 H · 정범님 I-1119-2051-30 · 설계 reports/CTRLKPI1_1119.md 7-2·7-3·8장) 조회수 열 지도 — 줄·칸·값 고르기 · 365일
//  ① 글: PXHM 덩어리 표시(PXAVAIL-END 바로 뒤) · 함수 · 브라우저 창 없음 · 전화번호 모양 없음 · Firestore 읽기 없음 · 365일 기간 · 부르는 곳 넷(날마다 둘·방문 구분·기간별)
//  ② 셈(vm · 앱 코드 그대로 떼어 돌림): 시각 자료 없는 날 = 빗금(null) · 「시각 자료 있는 날 n / 전체 n」 · 달력 잔디 첫 주·마지막 주 짧은 칸 = 빗금 · 달×날에서 그 달에 없는 날(31일·2월 29~31일) = 빗금
//     · 하루 평균 · 100개당(셀 수 있던 상품) · 줄 안 몫 합 100 · 오늘 앞으로 올 시각 빗금 · 고른 줄·칸·값 기억(rn-hm) · 맞지 않는 칸은 고쳐 기억 · 방문 구분 값 × 날
//  ③ 화면(RN_PORT): 날마다 방문 창에 열 지도 둘 · 줄 고르기를 누르면 창이 열린 채 바뀌고 기억 · 기간 365일 단추 · 브라우저 창·오류 없음
// 실행: node tPXHM_H.js (② 까지) · pw/ 안 RN_PORT=<포트> node tPXHM_H.js (③ 까지) · 시험 자료는 가짜 상품번호만 · 운영 Firestore에 쓰지 않음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 글');
const a0 = T.indexOf('/* PXHM-START'), b0 = T.indexOf('/* PXHM-END */');
const BLK = a0 > 0 && b0 > a0 ? T.slice(a0, b0 + 14) : '';
ok(BLK.length > 0, 'PXHM 덩어리 표시(PXHM-START·END)');
ok(a0 > 0 && T.slice(T.indexOf('/* PXAVAIL-END */'), a0).split('\n').length === 2, '덩어리는 PXAVAIL-END 바로 다음 줄');
for (const fn of ['pxHmData', 'pxHmOpt', 'pxHmHtml', 'pxGwHm']) ok(new RegExp('function ' + fn + '\\(').test(BLK), `함수 ${fn}`);
ok(!/\b(alert|confirm|prompt)\s*\(/.test(BLK), '새 코드에 브라우저 창 없음'); ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(BLK), '전화번호 모양 없음');
ok(!/\.(get|onSnapshot)\s*\(\s*\)|collection\(|\bdb\./.test(BLK), 'Firestore 읽기 없음(메모리의 날마다 자료만)');
ok(/^const PXDAY_RNG = \[14, 30, 90, 365, 0\];/m.test(T), '날마다 방문 기간에 365일');
const fnBody = (nm) => { const i = T.indexOf('\nfunction ' + nm + '('); if (i < 0) return ''; const j = T.indexOf('\nfunction ', i + 5); return T.slice(i, j); };
const DH = fnBody('pxDayHtml'), GH = fnBody('pxGwHtml'), PH = fnBody('pxPerHtml');
ok(/pxHmHtml\('pxhm_wdhr'/.test(DH) && /pxHmHtml\('pxhm_d'/.test(DH), '날마다 방문 창: 요일×시각 · 묶어 보기 열 지도');
ok(/pxGwHm\(g, R, DL\)/.test(GH) && /\$\{pxHeatSvg\(R\.wd\)\}/.test(GH), '방문 구분 창: 값 × 날 열 지도(모든 구분) · 시간대 칸의 옛 요일×시각 그대로');
ok(/pxHmHtml\('pxhm_per'/.test(PH), '기간별 표: 기간 열 지도');
ok(/rows: \['m', 'w'\]|rowsL: \['m', 'w'\]/.test(PH) && /colsL: \['wd', 'hr'\]/.test(PH), '기간 열 지도 = 달×요일 · 주×시각 · 달×시각');

console.log('② 셈');
const line = (re) => { const m = T.match(re); if (!m) { ok(false, '앱에서 줄을 못 찾음 ' + re); return ''; } return m[0]; };
const ha = T.indexOf('/* HM-START'), hb = T.indexOf('/* HM-END */');
const store = {}; const localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
const FAKE = { D: [], AX: [] };
const ctx = { console, localStorage, innerWidth: 1280, Intl, pxDaySeries: () => ({ D: FAKE.D, lids: null }), pxAvailMap: () => null, pxAvail: (d) => ({ px: FAKE.AXm ? FAKE.AXm[d] : 10 }) }; vm.createContext(ctx);
const pre = `const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); const num = (n, d = 0) => (n == null || !Number.isFinite(n) ? '-' : new Intl.NumberFormat('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d }).format(n));`;
const SRC = [pre, line(/^const _pxDC = new Map\(\); const pxDay = .*$/m), line(/^const pxDayAdd = .*$/m), line(/^const pxMd = .*$/m), line(/^const PXWD = .*$/m), line(/^const pxWdOf = .*$/m),
  line(/^function pxPerKey\(.*$/m), line(/^function pxPerLbl\(.*$/m), ha > 0 && hb > ha ? T.slice(ha, hb) : '', BLK].join('\n');
let F = {}; try { vm.runInContext(SRC + '\n; this.F = { pxHmData, pxHmOpt, pxHmHtml, pxGwHm, pxHmMdN, hmGet, hmSet, hmSvg, pxDayAdd, pxWdOf };', ctx); F = ctx.F; } catch (e) { ok(false, '떼어 낸 코드 돌리기', String(e && e.stack || e)); }
if (F.pxHmData) {
  // 가짜 날마다 자료 — 2026-10-01(목) ~ 2026-11-19(목·오늘) · 10/27부터 시간대 기록 · 사람 조회 h = 날(1~31) · 그 날 hr[9] = h, hr[15] = 1 · 10/10은 30일 전 날짜별 기록 없음(miss)
  const td = '2026-11-19', hk = 10; const D = []; for (let d = '2026-10-01'; d <= td; d = F.pxDayAdd(d, 1)) { const h = +d.slice(8, 10); const hr = d >= '2026-10-27' ? Array.from({ length: 24 }, (_, k) => (k === 9 ? h - 1 : k === 15 ? 1 : 0)) : null; D.push({ d, h, hr, miss: d === '2026-10-10' }); }
  const AX = D.map((x) => (x.d === '2026-11-02' ? 0 : 10)); const O = (val, o) => Object.assign({ D, AX, td, hk, val }, o || {});
  // 1) 날 × 시각 — 시각 자료 없는 날은 빗금 · 「시각 자료 있는 날 n / 전체 n」 · 오늘 앞으로 올 시각 빗금
  const H1 = F.pxHmData('d-hr', 30, O('s')); const ri = (H, k) => H.rows.findIndex((r) => String(r.k) === String(k));
  const r21 = ri(H1, '2026-10-21'), r01 = ri(H1, '2026-11-01'), rT = ri(H1, td);
  ok(H1.rows.length === 30 && H1.cols.length === 24, '최근 30일 × 24시각', [H1.rows.length, H1.cols.length]);
  ok(r21 >= 0 && H1.M[r21].every((v) => v === null), '시각 자료 없는 날(10/21)은 24칸 모두 빗금(null)', H1.M[r21]);
  ok(r01 >= 0 && H1.M[r01][9] === 0 && H1.M[r01][15] === 1 && H1.M[r01][3] === 0, '시각 자료 있는 날(11/01)은 수 · 0도 0으로', H1.M[r01]);
  ok(rT >= 0 && H1.M[rT][hk] === 0 && H1.M[rT][hk + 1] === null && H1.M[rT][9] === 18, '오늘은 지금 시각까지 칸 · 앞으로 올 시각은 빗금', H1.M[rT]);
  ok(H1.hrN === 24 && H1.dN === 30 && /시각 자료 있는 날 24 \/ 전체 30일/.test(H1.note), '「시각 자료 있는 날 24 / 전체 30」(10/21~10/26 여섯 날은 시각 자료 없음)', H1.note);
  ok(H1.cnt === null, '한 칸 = 하루 지도는 「있던 날 3 아래」 세모를 달지 않음(cnt 없음)');
  // 2) 요일 × 시각 하루 평균 — 오늘 뺌 · 시각 자료 있는 날만
  const H2 = F.pxHmData('wd-hr', 0, O('a')); const mon = ri(H2, 1);
  const monDays = D.filter((x) => x.hr && x.d < td && F.pxWdOf(x.d) === 1 && !x.miss); const want = monDays.reduce((s, x) => s + x.hr[9], 0) / monDays.length;
  ok(H2.rows.length === 7 && H2.rows[0].k === 1 && H2.rows[6].k === 0, '줄 = 월~일');
  ok(mon >= 0 && Math.abs(H2.M[mon][9] - Math.round(want * 100) / 100) < 1e-9, '월요일 9시 하루 평균 = 월요일들 9시 합 ÷ 월요일 수', { got: H2.M[mon][9], want });
  ok(H2.hrN === 23 && H2.dN === 48 && /오늘 뺌/.test(H2.note), '묶는 지도는 다 끝난 날만(오늘 뺌 · 빠진 날 뺌): 시각 자료 23 / 전체 48', [H2.hrN, H2.dN]);
  ok(typeof H2.cnt === 'function' && H2.cnt(H2.rows[mon], H2.cols[9], mon, 9) === monDays.length, '여러 날 묶은 칸은 든 날 수(cnt)를 넘김');
  // 3) 줄 안 몫 — 줄마다 합 100
  const H3 = F.pxHmData('wd-hr', 0, O('pct')); const sums = H3.M.map((r) => r.reduce((s, v) => s + (v || 0), 0));
  ok(sums.every((s) => Math.abs(s - 100) < 0.6), '줄 안 몫: 줄마다 합 약 100%', sums);
  // 4) 100개당 — 셀 수 있던 상품이 0인 날은 100개당 셈에서 뺌
  const H4 = F.pxHmData('w-none', 0, O('p')); const wk = F.pxDayAdd('2026-11-02', 0); const j4 = H4.cols.findIndex((c) => c.k === wk);
  const wD = D.filter((x) => x.d >= '2026-11-02' && x.d <= '2026-11-08' && x.d !== '2026-11-02'); const p4 = Math.round((wD.reduce((s, x) => s + x.h, 0) / (wD.length * 10)) * 10000) / 100;
  ok(H4.rows.length === 1 && j4 >= 0 && H4.M[0][j4] === p4, '주 띠(칸 없음) 100개당 = 사람 합 ÷ 상품·날 합 × 100 · 상품 0개인 날(11/02) 뺌', { got: H4.M[0][j4], want: p4 });
  // 5) 달력 잔디(주×요일) — 첫 주 시작 앞 · 오늘 뒤 · 빠진 날 = 빗금
  const H5 = F.pxHmData('wk-wd', 0, O('s')); const c0 = 0, cL = H5.cols.length - 1; const rw = (w) => ri(H5, w);
  ok(H5.cols[c0].k === '2026-09-28' && H5.cols[cL].k === '2026-11-16', '칸 = 주(월요일 9/28 ~ 11/16)', [H5.cols[c0].k, H5.cols[cL].k]);
  ok(H5.M[rw(1)][c0] === null && H5.M[rw(2)][c0] === null && H5.M[rw(3)][c0] === null && H5.M[rw(4)][c0] === 1 && H5.M[rw(0)][c0] === 4, '첫 주: 9/28(월)~9/30(수) 빗금 · 10/01(목)부터 수', [1, 2, 3, 4, 0].map((w) => H5.M[rw(w)][c0]));
  ok(H5.M[rw(4)][cL] === 19 && H5.M[rw(5)][cL] === null && H5.M[rw(6)][cL] === null && H5.M[rw(0)][cL] === null, '마지막 주: 오늘(11/19 목)까지 수 · 금·토·일 빗금', [4, 5, 6, 0].map((w) => H5.M[rw(w)][cL]));
  const c10 = H5.cols.findIndex((c) => c.k === '2026-10-05'); ok(c10 >= 0 && H5.M[rw(6)][c10] === null, '30일 전 날짜별 기록이 없는 날(10/10)도 빗금');
  ok(H5.cols[c0].lb === '10월' && H5.cols.filter((c) => c.lb).length === 2, '달이 바뀌는 주에만 달 이름(10월·11월)', H5.cols.map((c) => c.lb));
  // 6) 달 × 날 — 그 달에 없는 날 빗금 · 2월
  ok(F.pxHmMdN('2026-11') === 30 && F.pxHmMdN('2026-10') === 31 && F.pxHmMdN('2027-02') === 28 && F.pxHmMdN('2028-02') === 29, '달 날 수(30·31·28·윤년 29)');
  const H6 = F.pxHmData('m-md', 0, O('s')); const oc = ri(H6, '2026-10'), nv = ri(H6, '2026-11');
  ok(H6.cols.length === 31 && H6.M[oc][30] === 31 && H6.M[nv][30] === null && H6.M[nv][29] === null && H6.M[nv][18] === 19, '10월 31일은 수 · 11월 31일 빗금 · 오늘 뒤(11/30) 빗금 · 오늘(11/19) 수', [H6.M[oc][30], H6.M[nv][30], H6.M[nv][29], H6.M[nv][18]]);
  ok(H6.M[oc][9] === null, '빠진 날(10/10)은 빗금');
  const D2 = []; for (let d = '2027-01-01'; d <= '2027-03-31'; d = F.pxDayAdd(d, 1)) D2.push({ d, h: 2, hr: null });
  const H7 = F.pxHmData('m-md', 0, { D: D2, AX: D2.map(() => 10), td: '2027-03-31', hk: 23, val: 's' }); const fb = ri(H7, '2027-02');
  ok(fb >= 0 && H7.M[fb][27] === 2 && [28, 29, 30].every((j) => H7.M[fb][j] === null), '2월(28일)의 29·30·31일은 빗금', H7.M[fb].slice(26));
  // 7) 고른 줄·칸·값 기억(rn-hm) — 맞지 않는 칸은 첫 맞는 칸으로 고쳐 기억 · 엉뚱한 값은 지움
  FAKE.D = D; ctx.pxDay = () => td;
  const B = { sc: 'all', rng: 0, r: 'wk', c: 'wd', v: 's' };
  let o = F.pxHmOpt('pxhm_t', B); ok(o.rowSel === 'wk' && o.colSel === 'wd' && o.valSel === 's', '처음엔 정한 줄·칸·값(주×요일 · 요일 · 합)', [o.rowSel, o.colSel, o.valSel]);
  ok(o.rowsOpt.length === 5 && o.colsOpt.length === 1 && o.valOpt.length === 4, '줄 5가지 · 달력은 칸 하나(고르기 숨김) · 값 4가지', [o.rowsOpt.length, o.colsOpt.length, o.valOpt.length]);
  F.hmSet('pxhm_t', { rows: 'm', cols: 'md', val: 'a' }); o = F.pxHmOpt('pxhm_t', B);
  ok(o.rowSel === 'm' && o.colSel === 'md' && o.valSel === 'a' && o.kind === 'm-md', '기억한 고름(달 × 날 · 하루 평균)을 다시 열어도 그대로', [o.rowSel, o.colSel, o.valSel]);
  F.hmSet('pxhm_t', { rows: 'wk' }); o = F.pxHmOpt('pxhm_t', B); const st = JSON.parse(store['rn-hm']).pxhm_t;
  ok(o.colSel === 'wd' && st.cols === 'wd' && st.rows === 'wk', '달력 줄로 바꾸면 맞지 않는 칸(날)은 요일로 고쳐 기억', st);
  F.hmSet('pxhm_t', { val: 'zz', rows: 'qq' }); o = F.pxHmOpt('pxhm_t', B); const st2 = JSON.parse(store['rn-hm']).pxhm_t;
  ok(o.valSel === 's' && o.rowSel === 'wk' && !('val' in st2) && !('rows' in st2), '엉뚱한 값·줄은 지우고 정한 것으로', st2);
  const Bp = { sc: 'all', rng: 0, rowsL: ['m', 'w'], colsL: ['wd', 'hr'], valL: ['a', 'p', 'pct'], r: 'm', c: 'wd', v: 'a' }; o = F.pxHmOpt('pxhm_p', Bp);
  ok(o.rowsOpt.map((x) => x[0]).join() === 'm,w' && o.colsOpt.map((x) => x[0]).join() === 'hr,wd' && o.valOpt.length === 3, '기간 열 지도: 줄 달·주 · 칸 시각·요일 · 값 셋', [o.rowsOpt, o.colsOpt]);
  const re = o.re({ rows: 'w', cols: 'hr', val: 'pct' }); ok(re.kind === 'w-hr' && re.valSel === 'pct' && /주 × 시각/.test(re.label), '고르면 다시 그림(re) — 주 × 시각 · 줄 안 몫', [re.kind, re.label]);
  // 8) 그림 — hmSvg에 그대로 넣어 그려짐 · 빗금 칸 · 고르기 단추
  const html = F.pxHmHtml('pxhm_t', B);
  ok(/class="hm" data-hm="pxhm_t"/.test(html) && /data-hmo="rows"/.test(html) && /data-pxhmn="pxhm_t"/.test(html), '열 지도 그림 + 줄 고르기 단추 + 그림 위 한 줄');
  ok(/<pattern id=/.test(html) && /url\(#/.test(html), '빗금 칸이 그려짐(자료 없음)');
  // 9) 방문 구분 값 × 날 — 많은 값 20가지 · 첫 기록 앞 빗금 · 그날 안 몫
  ctx.pxGLbl = (g, k) => '값' + k; const L = Array.from({ length: 25 }, (_, i) => ({ k: 'k' + i, v: 100 - i })); const DL = []; for (let d = '2026-10-10'; d <= td; d = F.pxDayAdd(d, 1)) DL.push(d);
  const RD = new Map(); DL.filter((d) => d >= '2026-10-25').forEach((d) => RD.set(d, { k0: 3, k1: 1 }));
  const gh = F.pxGwHm('ref', { L, D: RD, days: ['2026-10-25', td] }, DL);
  ok(/값 × 날 열 지도/.test(gh) && (gh.match(/class="hm-lb"[^>]*>값k/g) || []).length === 20, '많은 값 20가지만 줄로', (gh.match(/class="hm-lb"[^>]*>값k/g) || []).length);
  ok(/data-hmo="val"/.test(gh) && /url\(#/.test(gh), '값 고르기(조회 · 그날 안 몫) · 첫 기록 앞 날은 빗금');
  ok(F.pxGwHm('ref', { L: [], D: new Map(), days: [] }, DL) === '', '값이 없으면 그리지 않음');
}
if (!process.env.RN_PORT) { console.log(bad ? `❌ tPXHM_H ${bad}개 실패` : '✓ tPXHM_H 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }

console.log('③ 화면');
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  const A = '530000031';
  await p.evaluate(async ({ A }) => { const base = S.plist.get('aladin_U215983410'); const now = Date.now();
    S.plist.set('aladin_U92001', { ...base, id: 'aladin_U92001', usedCode: 'U92001', listingId: A, title: '열 지도 시험 책', status: '판매중', active: true });
    const dayAgo = (k) => pxDay(now - k * 864e5);
    for (let k = 0; k < 40; k++) await db.collection('px_views').doc(A + '_' + dayAgo(k).replace(/-/g, '')).set({ lid: A, day: dayAgo(k), n: 3, human: 3, bot: 0, uniq: 3, lastKind: 'human', x: k < 20 ? { hr: { 9: 2, 15: 1 } } : {} });
    await db.collection('px_exp').doc(A).set({ lid: A, on: true, state: 'done', addedAt: new Date(now - 45 * 864e5).toISOString(), src: 'manual' });
    try { localStorage.removeItem('rn-pxday'); localStorage.removeItem('rn-hm'); } catch (e) {}
    pxInit(); }, { A });
  await p.waitForTimeout(1000);
  await p.evaluate(() => { S.px.P.f = 'all'; openPxExp(); }); await p.waitForTimeout(1200);
  await p.click('#px_top .pxtile[data-pxday]'); await p.waitForTimeout(400);
  let m = await p.evaluate(() => { const ov = document.querySelector('.pxdwov'); if (!ov) return null; return { hm: [...ov.querySelectorAll('.hm[data-hm]')].map((x) => x.dataset.hm), r365: !!ov.querySelector('[data-pxdr="365"]'), note: (ov.querySelector('[data-pxhmn="pxhm_wdhr"]') || {}).textContent || '' }; });
  ok(m && m.hm.includes('pxhm_wdhr') && m.hm.includes('pxhm_d'), '날마다 방문 창에 요일×시각 · 묶어 보기 열 지도', m);
  ok(m && m.r365, '기간 「최근 365일」 단추', m); ok(m && /시각 자료 있는 날/.test(m.note), '그림 위 한 줄 「시각 자료 있는 날 n / 전체 n」', m && m.note);
  await p.click('.pxdwov .hm[data-hm="pxhm_d"] [data-hmo="rows"][data-hmv="m"]'); await p.waitForTimeout(250);
  m = await p.evaluate(() => { const ov = document.querySelector('.pxdwov'); let st = {}; try { st = JSON.parse(localStorage.getItem('rn-hm') || '{}').pxhm_d || {}; } catch (e) {} const on = ov && ov.querySelector('.hm[data-hm="pxhm_d"] [data-hmo="rows"].on'); return { open: !!ov, st, on: on && on.dataset.hmv, cols: ov ? [...ov.querySelectorAll('.hm[data-hm="pxhm_d"] [data-hmo="cols"]')].map((x) => x.dataset.hmv) : [] }; });
  ok(m.open && m.st.rows === 'm' && m.on === 'm', '줄 「달」을 누르면 창이 열린 채 바뀌고 이 기기에 기억', m);
  ok(m.cols.includes('md') && m.cols.includes('wd') && m.cols.includes('none'), '달 줄의 칸 고르기: 시각·요일·날·없음', m.cols);
  await p.click('.pxdwov [data-pxdr="365"]'); await p.waitForTimeout(300);
  m = await p.evaluate(() => ({ open: !!document.querySelector('.pxdwov'), rows: (JSON.parse(localStorage.getItem('rn-hm') || '{}').pxhm_d || {}).rows, on: (document.querySelector('.pxdwov .hm[data-hm="pxhm_d"] [data-hmo="rows"].on') || {}).dataset }));
  ok(m.open && m.rows === 'm' && m.on && m.on.hmv === 'm', '기간을 365일로 바꿔도 고른 줄(달)이 그대로', m);
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  await p.evaluate(() => { try { localStorage.removeItem('rn-hm'); } catch (e) {} });
  ok(dlg.length === 0, '브라우저 창 없음', dlg); ok(errs.length === 0, '페이지 오류 없음', errs);
  console.log(bad ? `❌ tPXHM_H ${bad}개 실패` : '✓ tPXHM_H 통과'); return { bad };
});

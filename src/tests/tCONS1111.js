/* tCONS1111 — (정범님 11/11 '날씨는 왜 소비심리에 포함되어 있지 않아? … 정보나 그래프 등이 없어? … 기능은 구현한 게 맞아?') 🧠 소비심리 연구 — 우리 판매 × 요일·시간대·휴일·날씨
 *  ① 클라우드 셈(cloud/index.js CONS-START~CONS-END만 떼어 돌림): 지어낸 판매 장부(토요일은 절반 · 비 온 날 +40% · 평일 공휴일 절반 · 10시대에 몰림) + 지어낸 날씨 →
 *     요일 지수 · 비 효과(+ · 믿을 만) · 공휴일 효과(−) · 시간대 몫 · 값대 · 분야 계절 · 앞으로 14일 · 되돌려 보기 채점 · '내일' 예측을 hist에 쌓고 다음 회차에 실제와 채점 · 손님 칸 없음 · 작은 문서
 *  ② 웹앱 📊 경영 › 🚪 상세 페이지 바로 가기 › 🧠 소비심리: 🚦 신호 · 그래프(막대·선) · 날씨 칸(지점·모은 날·평균 기온) · 학술 요약 접힘 · 신호 채점 · [지금 다시 셈] 두 번 눌러야 맡김
 *  ③ 그림자 신호 — 💹 가격 감시 카드 · 📥 상품 등록 화면 맨 위에 '🧠 소비심리 신호' 한 줄(값·등록을 바꾸지 않음) · 📚 공식 자료 › 소비심리 탭에서 이 화면으로
 *  ④ 🗣 구매평·문의 연구 그래프(주제 막대·불만 끌림·달마다 선)
 *  지어낸 값만(실제 손님·판매 없음)
 * 실행: cd pw && RN_PORT=<포트> node tCONS1111.js   (RN_SHOT=<폴더> 이면 화면 사진을 그 폴더에)
 *       서버 없이 ①만: node tCONS1111.js --pure */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 700) : ''); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const findUp = (rel) => { for (const d of [path.join(__dirname, '../..'), path.join(__dirname, '..'), __dirname, process.env.RN_REPO || '']) { const f = path.join(d, rel); if (d && fs.existsSync(f)) return f; } throw new Error(rel + ' 못 찾음 — RN_REPO=<readnow-scripts>'); };
const src = fs.readFileSync(findUp('cloud/index.js'), 'utf8'); const a = src.indexOf('CONS-START'); const b = src.indexOf('/* CONS-END */'); const code = src.slice(src.indexOf('*/', a) + 2, b);
const ctx = { Math, Date, JSON, Object, Array, Number, String, Set, Map, isFinite }; vm.runInNewContext(code + ';this.consBuild = consBuild; this.consRows = consRows; this.consBreaks = consBreaks;', ctx);
global.window = global.window || {}; require(findUp('readnow-shipping-core.js')); const SH = global.window.ReadnowShipping; const hol = (k) => SH.holName(k);
/* 지어낸 판매 장부 — 2026-01-01 ~ 2026-11-10 */
const add = (k, n) => new Date(Date.parse(k + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10); const dowOf = (k) => (new Date(k + 'T12:00:00Z').getUTCDay() + 6) % 7;
const rainy = (k) => +k.slice(8, 10) % 4 === 0; const lines = []; const wx = { 108: { nm: '서울', rows: {} }, 119: { nm: '수원', rows: {} } }; let seq = 0;
for (let k = '2026-01-01'; k <= '2026-11-10'; k = add(k, 1)) { const w = dowOf(k); let n = w === 5 ? 6 : w === 6 ? 9 : 12; if (w < 5 && hol(k)) n = Math.round(n * 0.5); if (rainy(k)) n = Math.round(n * 1.4);
  for (let i = 0; i < n; i++) { const h = i % 3 === 0 ? 10 : [0, 9, 13, 16, 19, 22][i % 6]; const mm = String(i % 60).padStart(2, '0'); const p = [1500, 3000, 5000, 8000, 12000, 25000][(seq++) % 6]; lines.push(['', '97900000' + String(i % 9).padStart(5, '0'), `${k}T${String(h).padStart(2, '0')}:${mm}`, p, 1, 'normal', i % 50 === 0 ? 'cash' : 'aladin'].join('\u0001')); }
  lines.push(['', '9790000000000', `${k}T11:11`, 4000, 1, 'cancel', 'aladin'].join('\u0001')); /* 취소 줄 — 세지 않음 */
  const d8 = k.replace(/-/g, ''); const m = +k.slice(5, 7); const ta = m <= 2 || m === 12 ? -2 : m <= 5 ? 12 : m <= 8 ? 26 : 15; for (const s of Object.keys(wx)) wx[s].rows[d8] = [rainy(k) ? 8 : 0, ta + 5, ta, ta - 5, 60, rainy(k) ? 1 : 9]; }
const cats = {}; for (let i = 0; i < 9; i++) cats['97900000' + String(i).padStart(5, '0')] = i < 5 ? '국내도서 > 소설/시/희곡' : '국내도서 > 어린이';
const run = (o) => ctx.consBuild({ lines, wx, hol, today: '2026-11-11', cats, ...(o || {}) });
console.log('① 클라우드 셈');
const R = run(); const J = JSON.stringify(R);
ok(R.range.from === '2026-01-01' && R.range.to === '2026-11-10' && R.tot.orders > 3000 && !J.includes('cancel'), '기간·주문 수 · 취소 줄은 뺌', R.range);
ok(R.dow[5].idx < 0.75 && R.dow[0].idx > 1.0 && R.dow[5].conf === '믿을 만' && R.dow[5].e < -0.3, '요일 지수 — 토요일 ×0.6 근처 · 믿을 만', R.dow[5]);
const E = (k) => R.eff.find((g) => g.k === k); ok(E('rain').e > 0.25 && E('rain').e < 0.6 && E('rain').conf === '믿을 만' && E('rain').n > 50, '비 온 날 +40% 근처(같은 달·같은 요일끼리) · 믿을 만 · 표본 수', E('rain'));
ok(E('cloudy').e > 0.2 && E('sunny').e < 0, '일조(wx_sum 6번째 칸) — 흐린 날 +(비 온 날과 같음) · 해 많은 날 −', [E('cloudy'), E('sunny')]);
ok(E('hol').e < -0.2 && E('hol').n >= 3, '평일 공휴일 −(절반)', E('hol'));
ok(R.wx.match > 280 && R.wx.st.length === 2 && R.wx.st[0].nm === '서울' && R.wx.st[0].ta != null && R.wx.st[0].rainD > 50, '날씨 — 지점·모은 날·평균 기온·비 온 날', R.wx);
const h10 = R.hours.find((h) => h.t === '09~11'); ok(h10.wk > 0.4 && Math.abs(R.hours.reduce((s, h) => s + h.wk, 0) - 1) < 0.01, '시간대 몫 — 09~11시에 몰림 · 합 100%', R.hours);
ok(R.pb.bands.length === 6 && R.pb.all.n > 0 && R.pb.rain.n > 0 && R.pb.we.n > 0, '값대 몫 — 전체·주말·비 온 날', R.pb.all);
ok(R.cats.length === 2 && R.cats[0].se['여름'] != null && R.catCover > 0.9, '분야 — 계절·주말 몫', R.cats);
ok(R.next.length === 14 && R.next[0].d === '2026-11-11' && R.next.every((x) => x.idx > 0), '앞으로 14일 예상', R.next.slice(0, 3));
ok(R.score.n >= 50 && R.score.rate != null && R.score.mae != null && R.score.mae0 != null && R.score.last.length > 10, '되돌려 보기 채점 — 맞힘률·오차·늘 보통 기준', { ...R.score, last: undefined });
const sk = R.sig.map((s) => s.k); ok(['tmr', 'peak', 'wx'].every((k) => sk.includes(k)) && R.sig.every((s) => s.t && s.act && s.conf && Array.isArray(s.for)), '🚦 신호 — 내일·몰리는 때·날씨(할 일·믿음·쓰는 곳)', R.sig.map((s) => s.t));
ok(R.sig.find((s) => s.k === 'wx').lv === 'up' && /비 온 날 주문 \+/.test(R.sig.find((s) => s.k === 'wx').t), '날씨 신호 — 비 온 날 주문 +…', R.sig.find((s) => s.k === 'wx'));
ok(R.hist.length === 1 && R.hist[0].d === '2026-11-12', "'내일' 예측을 hist에 남김", R.hist);
const R2 = ctx.consBuild({ lines, wx, hol, today: '2026-11-11', cats, hist: [{ d: '2026-11-09', p: 1.2 }, { d: '2026-11-08', p: 0.7 }, { d: '2026-11-12', p: 1.1 }] });
ok(R2.live.n === 2 && R2.live.dir === 2 && R2.live.rate != null && R2.hist.find((h) => h.d === '2026-11-09').a != null && R2.hist.filter((h) => h.d === '2026-11-12').length === 1, '지난 회차 예측 = 실제가 나온 날만 채점(실제 낸 신호 맞힘) · 같은 날 예측은 한 번만', R2.live);
ok(!/buyer|recipient|phone|address|010-|customer|orderNo/i.test(J) && J.length < 40000, '손님 칸 없음 · 작은 문서(40KB 아래)', J.length);
const E0 = ctx.consBuild({ lines: [], wx: {}, hol, today: '2026-11-11' }); ok(E0.empty && E0.why, '판매 장부가 비면 까닭');
const R3 = ctx.consBuild({ lines, wx: {}, hol, today: '2026-11-11' }); ok(R3.eff.filter((g) => g.cat === 'wx').every((g) => g.conf === '자료 부족' && g.e == null) && R3.sig.find((s) => s.k === 'wx').conf === '자료 부족', '날씨가 없으면 날씨 효과는 자료 부족(지어내지 않음)', R3.sig.find((s) => s.k === 'wx'));
const BR = ctx.consBreaks('2026-09-01', '2026-10-15', hol); ok(BR.B.some((x) => x.myeong && x.from <= '2026-09-25' && x.to >= '2026-09-25'), '긴 연휴 찾기 — 2026 추석(명절)', BR.B);
{ const cl = src; ok(/consStudy\(\)/.test(cl.slice(cl.indexOf('async function dailyJobs'), cl.indexOf('async function dailyJobs') + 9000)) && /x\.ss == null \? null : x\.ss/.test(cl) && /\|wx_sum\)\\\//.test(cl), '클라우드 — /daily에서 하루 한 번 · wx_sum에 일조 칸 · 진단으로 wx_sum 읽기', null); }
if (process.argv.includes('--pure')) { console.log(bad ? `❌ tCONS1111 ① ${bad}개 실패` : '✓ tCONS1111 ① 통과'); process.exit(bad ? 1 : 0); }
const SHOT = process.env.RN_SHOT || null;
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); let dlg = 0; p.on('dialog', (d) => { dlg++; d.dismiss().catch(() => {}); });
  await p.evaluate(async (st) => { S.devOk = true; localStorage.setItem('rn-device', 'JS-MAIN'); try { S.app.adminDevices = ['JS-MAIN']; } catch (e) {} st.at = new Date().toISOString(); await db.collection('app_settings').doc('cons_study').set(st); await db.collection('app_settings').doc('wx_run').set({ key: { tail: 'ABCD', apiNm: '지상관측 › 종관기상관측(ASOS) › 일자료 「기간 조회」(kma_sfcdd3)' }, stn: { 108: { lo: '20260101', hi: '20261110', loDone: false, n: 314 } } }); }, R);
  console.log('② 🧠 소비심리 화면');
  const W1 = await p.evaluate(async () => { const g = GO_PAGES.find((x) => x[0] === 'cons'); g[3](); await new Promise((r) => setTimeout(r, 600)); const sh = document.getElementById('sheet'); const t = sh.innerText;
    return { open: !!(S.detail && S.detail.cons), title: /소비심리 — 손님은 언제·왜 사나/.test(t), why: /무엇을 하려고 재나/.test(t) && /값 감시/.test(t) && /재고·매입/.test(t), sig: sh.querySelectorAll('#cs_sig .item').length, sigT: (sh.querySelector('#cs_sig') || {}).innerText || '', svg: sh.querySelectorAll('svg').length, bars: sh.querySelectorAll('#cs_wx i').length, wx: (sh.querySelector('#cs_wx') || {}).innerText || '', score: (sh.querySelector('#cs_score') || {}).innerText || '', lit: !!sh.querySelector('details#cs_lit') && !sh.querySelector('details#cs_lit').open, feat: FEAT.some((f) => /🧠 소비심리 —/.test(f.t)), help: !!(typeof PAGE_HELP !== 'undefined' ? PAGE_HELP.cons : true) }; });
  ok(W1.open && W1.title && W1.why, '바로 가기 › 🧠 소비심리가 열림 · 무엇을 하려고 재나(값 감시·등록·재고·문구)', W1);
  ok(W1.sig >= 3 && /내일\(/.test(W1.sigT) && /→/.test(W1.sigT) && /믿을 만|추정/.test(W1.sigT), '🚦 지금 할 일 신호 — 내일 예상·할 일·믿음', W1.sigT.slice(0, 300));
  ok(W1.svg >= 1 && W1.bars > 12, '그래프 — 달마다 선(svg) · 날씨 막대', { svg: W1.svg, bars: W1.bars });
  ok(/비 온 날/.test(W1.wx) && /서울/.test(W1.wx) && /모은 날/.test(W1.wx) && /평균 기온/.test(W1.wx) && /••••ABCD/.test(W1.wx), '날씨 칸 — 비 효과 · 지점·모은 날·평균 기온 · 인증키 끝 4자리만', W1.wx.slice(0, 400));
  ok(/방향 맞힘/.test(W1.score) && /늘 보통/.test(W1.score), '⑦ 신호 채점 칸', W1.score.slice(0, 200)); ok(W1.lit && W1.feat, '📚 학술 요약은 접혀 아래에 · 찾기(FEAT)에 있음', W1);
  const lit = await p.evaluate(async () => { const d = document.querySelector('#cs_lit'); d.open = true; d.dispatchEvent(new Event('toggle')); await new Promise((r) => setTimeout(r, 800)); return document.querySelector('#cs_litb').innerText; });
  ok(/요일|월급|날씨/.test(lit), '학술 요약을 펼치면 한눈에 표(facts-docs/consumer-psych.txt)', lit.slice(0, 200));
  if (SHOT) { await p.setViewportSize({ width: 1100, height: 900 }); await p.evaluate(() => { document.getElementById('sheet').scrollTop = 0; }); await p.waitForTimeout(200); await p.screenshot({ path: path.join(SHOT, 'cons_top.png') }); await p.evaluate(() => { document.querySelector('#cs_wx').scrollIntoView(); }); await p.waitForTimeout(200); await p.screenshot({ path: path.join(SHOT, 'cons_wx.png') }); await p.evaluate(() => { document.querySelector('#cs_score').scrollIntoView(); }); await p.waitForTimeout(200); await p.screenshot({ path: path.join(SHOT, 'cons_score.png') }); await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => { document.getElementById('sheet').scrollTop = 0; }); await p.waitForTimeout(300); await p.screenshot({ path: path.join(SHOT, 'cons_phone.png') }); await p.evaluate(() => { document.querySelector('#cs_wx').scrollIntoView(); }); await p.waitForTimeout(200); await p.screenshot({ path: path.join(SHOT, 'cons_phone_wx.png') }); const ow = await p.evaluate(() => document.getElementById('sheet').scrollWidth - document.getElementById('sheet').clientWidth); ok(ow <= 2, '휴대폰 폭(390px)에서 옆으로 넘치지 않음', ow); await p.setViewportSize({ width: 1400, height: 900 }); }
  const re = await p.evaluate(async () => { const b = document.getElementById('cs_re'); b.click(); await new Promise((r) => setTimeout(r, 100)); const d0 = (await db.collection('app_settings').doc('cons_cfg').get()).exists; const t1 = b.textContent; b.click(); await new Promise((r) => setTimeout(r, 300)); const d1 = (await db.collection('app_settings').doc('cons_cfg').get()).data() || {}; return { d0, t1, req: !!d1.reqAt }; });
  ok(!re.d0 && /한 번 더/.test(re.t1) && re.req, '[지금 다시 셈] — 한 번은 안 맡김 · 두 번 눌러야 app_settings/cons_cfg.reqAt', re);
  console.log('③ 그림자 신호');
  const G = await p.evaluate(async () => { history.back(); await new Promise((r) => setTimeout(r, 400)); const pr = consSigLine('price'), rg = consSigLine('reg'); return { pr, rg, inPc: String(priceCard).includes("consSigLine('price')"), regSrc: String(openRegister).includes("consSigLine('reg')"), dd: (S.fx = S.fx || { src: {}, at: {} }, fxDdHtml)(FACTS_DOCS.find((d) => d.k === 'psy')) }; });
  ok(/소비심리 신호/.test(G.pr) && /그림자 — 값·등록을 바꾸지 않음/.test(G.pr) && /맞힘률/.test(G.pr) && /data-consopen/.test(G.pr), '💹 가격 감시 쪽 한 줄 — 그림자 · 맞힘률 · 자세히', G.pr.slice(0, 300));
  ok(/소비심리 신호/.test(G.rg) && G.inPc, '📥 상품 등록 화면 맨 위 한 줄(그 화면 차례는 그대로)', G.rg.slice(0, 200));
  ok(/data-consopen/.test(G.dd), '📚 공식 자료 › 소비심리 탭 설명 줄에서 이 화면으로', G.dd);
  const reg = await p.evaluate(async () => { try { openRegister(); await new Promise((r) => setTimeout(r, 900)); const t = document.getElementById('sheet').innerHTML; const okk = /data-conssig="reg"/.test(t) && /상품 등록/.test(t); history.back(); await new Promise((r) => setTimeout(r, 300)); return okk; } catch (e) { return 'ERR ' + e.message; } });
  ok(reg === true, '📥 상품 등록 화면을 실제로 열어도 깨지지 않고 신호 한 줄이 보임', reg);
  console.log('④ 🗣 구매평·문의 연구 그래프');
  const V = await p.evaluate(() => { const lex = voLex(); const c2 = [{ sc: '1', kind: 'r', items: [] }]; for (let i = 0; i < 30; i++) c2[0].items.push({ k: 'x' + i, d: `2026-${String(8 + (i % 3)).padStart(2, '0')}-0${1 + (i % 9)}`, r: i % 3 ? 'good' : 'bad', c: i % 2 ? '배송이 늦어요 포장 허술' : '책 상태 깨끗', a: 'ab***' });
    const rows = voRows(c2, [], lex); const st = voStats(rows, { lex, sizeOf: () => '작음(<300)', ours: [] }); const tp = [...st.tp].sort((a, b) => b.n - a.n); return { c: voCharts(st, tp), m: voMonChart(st), src: String(voDraw).includes('voCharts(st, tpRows)') && String(voDraw).includes('voMonChart(st)') }; });
  ok(/주제마다 언급 수/.test(V.c) && /불만 끌림/.test(V.c) && (V.c.match(/<i style/g) || []).length >= 2, '주제 막대 · 불만 끌림 막대(실제 모은 글로)', V.c.slice(0, 200));
  ok(/<svg/.test(V.m) && /구매평 수/.test(V.m) && /불만족 비율/.test(V.m) && V.src, '달마다 구매평 수·불만족 비율 선 그래프 · 연구 화면에 들어감', V.m.slice(0, 120));
  ok(dlg === 0, '브라우저 팝업 없음');
  console.log(bad ? `❌ tCONS1111 ${bad}개 실패` : '✓ tCONS1111 모두 통과'); if (bad) process.exitCode = 1; });

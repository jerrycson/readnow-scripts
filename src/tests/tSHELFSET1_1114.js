// tSHELFSET1_1114 — (11/14 shelfset1) 📚 세트 상품을 권 수만큼 책등으로 나눠 꽂기 · 누르면 1권부터 한 권씩 기차처럼 빠져 앞에 쌓임 · 닫으면 역순
//   정범님 지시 11/14 00:29(I-1114-0029-04) — 세트 권 나누기 · 기차처럼 연달아 빠짐·앞에서 차곡 쌓임 · 세트는 샘플 페이지 없음 · 역순으로 들어감 · 다른 모양(부채꼴·나란히·기대어·1권만) 설정 · 권별 책등(표본 › 앞뒤 표지 색으로 한 벌 디자인)
//   ① 순수 셈: 실제 우리숍 세트 꼴 제목(상품 이름 — 손님 정보 아님)의 권 수 판정 · 안 나누는 것 · 관리자 바로잡기 · 권 두께·색·권 번호 · 설정 칸 · 판 번호 · 브라우저 창 없음 · 클라우드 설정 글 길이
//   ② 화면(RN_SHELF_UI=1 · playwright · 가짜 클라우드 · 지어낸 상품): PC 1280·휴대폰 390 — 시작·중간·끝 사진 · 쌓임 차례 · 역순 복귀 차례 · 다섯 모양 · 표지 모드 · 움직임 줄이기 · 프레임 간격
// 실행: node src/tests/tSHELFSET1_1114.js · 화면까지: RN_SHELF_UI=1 RN_SHOT=<사진 폴더> node src/tests/tSHELFSET1_1114.js
const fs = require('fs'); const path = require('path'); const http = require('http'); const os = require('os');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const BQS = require(path.join(ROOT, 'shop/shelf-core.js')); const SH = require(path.join(ROOT, 'cloud/shop.js'));
(async () => {
console.log('① 순수 셈 — 세트 권 수 판정(실제 우리숍 판매중 세트 꼴 제목)');
{ const c = BQS.cfgOf({}); const S = (t, o) => BQS.setOf({ id: 'a', t, cp: '국내도서>x', ...(o || {}) }, c); const f = (s) => (s ? `${s.n}:${s.v[0]}-${s.v[s.v.length - 1]}` : '-');
  const K = [['영문법 판타지 소설책 1~4 세트 - 전4권', '4:1-4'], ['[세트] 내일은 실험왕 11~15 세트 (전5권 + 각 권 실험키트)', '5:11-15'], ['[세트] 통째로 한국사1~12+한국사 비밀노트 - 전13권/ 휘슬러', '13:1-13'], ['[세트] 신부이야기 1~14 (상급 소장용 - 사진有)', '14:1-14'],
    ['[세트] 죠죠의 기묘한 모험 1~20 + 스틸 볼 런 1~7 (총 27권 상급)', '27:1-27'], ['오르다 작은 철학자 : 9권 세트', '9:1-9'], ['[세트] 내사랑 엘리스 1~21 (4, 5권 결권. OPP 포장 보관 - 사진有)', '19:1-21'], ['[세트] 어째서 여기에 선생님이?! 2~10 (최상급: 전권 밀봉)', '9:2-10'],
    ['The Decline and Fall of the Roman Empire, Volumes 1 to 3 (of Six)(Box Set)', '3:1-3'], ['Pizza and Taco Lunch Special: 6-Book Boxed Set: Books 1-6', '6:1-6'], ['거미입니다만, 문제라도? 1~8권 (최상급)', '8:1-8'],
    ['Usborne Young Reading Set 1-44 : Stories of Santa', '-', { pg: 64 }], ['백점 초등 국어+수학 세트 1-2 (2025년용)', '-'], ['[세트] 우리말 큰사전 - 어문각', '-'], ['블루 아카이브 코믹 앤솔로지 VOL.1 & VOL.2 합본 세트', '-'], ['귀멸의 칼날 23 (소책자 32p + 스티커 + 박스 포장 한정판)', '-'], ['이보디보, 생명의 블랙박스를 열다', '-'], ['해리포터와 마법사의 돌 1', '-']];
  const got = K.map(([t, , o]) => f(S(t, o))); ok(K.every(([, w], i) => got[i] === w), `권 수: ${K.map(([t], i) => `${t.slice(0, 14)}→${got[i]}`).join(' · ')}`);
  ok(!BQS.setOf({ id: 'm', t: '반지의 제왕 박스세트 (6disc) - 전3권', cp: 'DVD>액션' }, c) && !BQS.setOf({ id: 'a', t: 'x 세트 - 전4권' }, BQS.cfgOf({ setOn: false })) && !S('x 1~89 세트 (총 83권)'), '음반·영상 박스는 그대로 · 설정 끄면 하나로 · 가장 많은 권 수(60)를 넘으면 하나로');
  ok(S('[세트] 신부이야기 1~14 (상급 소장용 - 사진有)').base === '신부이야기' && S('마인크래프트 공식 가이드북 세트 - 전4권').base === '마인크래프트 공식 가이드북' && S('The Decline and Fall of the Roman Empire, Volumes 1 to 3 (of Six)(Box Set)').base === 'The Decline and Fall of the Roman Empire', '권 책등 글 = 세트 이름(「[세트]」·「- 전N권」·권 범위·상태 괄호를 뺌)');
  const cf = BQS.cfgOf({ setFix: 'aladin_U1 12\naladin_U2 0\naladin_U3 5 11\n이상한 줄' }); ok(BQS.setOf({ id: 'aladin_U1', t: '아무 제목' }, cf).n === 12 && !BQS.setOf({ id: 'aladin_U2', t: 'x 세트 - 전4권' }, cf) && BQS.setOf({ id: 'aladin_U3', t: 'y' }, cf).v.join() === '11,12,13,14,15', '관리자 권 수 바로잡기가 제목 판정보다 먼저(권수 0 = 세트 아님 · 첫 권 번호)');
  const sp = BQS.cfgOf({ setSp: 'aladin_U1 2 https://image.aladin.co.kr/product/1/2/spine/x.jpg\naladin_U1 3 https://evil.example/x.jpg' }); ok(BQS.setVolSp({ id: 'aladin_U1' }, 2, sp) && !BQS.setVolSp({ id: 'aladin_U1' }, 3, sp), '권별 책등 그림(관리자): 알라딘·우리 저장소 주소만 · 바깥 주소는 버림');
  const x = { id: 'q1', t: '[세트] 신부이야기 1~14', sz: '128x188x168', pg: 2800 }; const St = BQS.setOf(x, c); const A = BQS.assign(x, c, '#335588'); const V = BQS.setDress(x, A, c, St); const one = BQS.look(x, c, '#335588');
  const pxmm = (c.rowH - 24) / 297; ok(V.length === 14 && V.every((v) => Math.abs(v.w - Math.max(12 * pxmm, c.wMin)) < 0.01) && V.every((v) => v.h === V[0].h && v.d === V[0].d && v.f === V[0].f && v.p === V[0].p && v.body === V[0].body) && V.map((v) => v.vn).join() === Array.from({ length: 14 }, (_, i) => i + 1).join() && Math.abs(V.reduce((a, v) => a + v.w, 0) - 14 * Math.max(12 * pxmm, c.wMin)) < 1 && one.w <= c.wMax,
    `권 14개: 두께 168mm ÷ 14 = 12mm(${V[0].w.toFixed(1)}px · 합 ${V.reduce((a, v) => a + v.w, 0).toFixed(0)}px · 가장 얇은 책 ${c.wMin}px 아래로는 안 줄임(누르기 쉽게) · 예전 통 하나는 가장 두꺼운 책 ${one.w.toFixed(0)}px로 잘렸음) · 키·디자인·글꼴·무늬·모양 모두 같음 · 권 번호 1~14`);
  const cols = new Set(V.map((v) => v.c)); const dist = Math.max(...V.map((v) => BQS.cdist(v.c, V[0].c))); ok(cols.size > 1 && dist < 60 && V.every((v) => BQS.contrast(v.c, v.k) >= 3), `색 「같은 색 안에서 조금씩」: ${cols.size}가지 · 첫 권과 가장 먼 거리 ${dist.toFixed(0)}(작을수록 한 벌) · 글자 대비 지킴`);
  const Vs = BQS.setDress(x, A, BQS.cfgOf({ setColor: 'same' }), St); const Vg = BQS.setDress(x, A, BQS.cfgOf({ setColor: 'grad' }), St); ok(new Set(Vs.map((v) => v.c)).size === 1 && BQS.cdist(Vg[0].c, Vg[13].c) > BQS.cdist(Vg[0].c, Vg[1].c), '색 「모든 권 같은 색」 · 「차례로 물듦」');
  const V2 = BQS.setDress({ id: 'q2', t: 'x 세트 - 전5권', pg: 1500 }, BQS.assign({ id: 'q2' }, c), c, BQS.setOf({ id: 'q2', t: 'x 세트 - 전5권' }, c)); ok(Math.abs(V2[0].dmm - Math.round((300 * 0.06 + 2) * 10) / 10) < 0.11, `두께가 없으면 쪽수 ÷ 권 수(1,500쪽 ÷ 5 = 300쪽 → ${V2[0].dmm}mm)`);
  const Kk = BQS.SCHEMA.map((p) => p.k); const need = ['setOn', 'setMax', 'setMinD', 'setColor', 'setNum', 'setSpImg', 'setAnim', 'setGap', 'setMs', 'setBack', 'setPad', 'setJit', 'setFan', 'setTilt', 'setBig', 'setMob', 'setPv', 'setFix', 'setSp'];
  const an = BQS.SCHEMA.find((p) => p.k === 'setAnim'); ok(need.every((k) => Kk.includes(k)) && BQS.SCHEMA.filter((p) => need.includes(p.k)).every((p) => p.group === '세트') && c.setAnim === 'stack' && c.setBack === 'rev' && c.setPv === false && ['stack', 'fan', 'row', 'lean', 'one', 'off'].every((k) => an.opts[k]),
    `설정 칸 ${need.length}개(묶음 「세트」 — 관리 웹앱 📚 서가 책장 설정이 저절로 그림) · 기본 = 쌓임 · 역순 · 샘플 없음 · 모양 6가지`);
  const pub = SH.pubCfg({ shelf: { setFix: 'a 1\n'.repeat(300), setSp: 'b'.repeat(3000), title: 'x'.repeat(400) } }); ok(pub.shelf.setFix.length > 1000 && pub.shelf.setSp.length === 3000 && pub.shelf.title.length === 200, '클라우드 /shop/cfg: 세트 바로잡기·권별 그림은 여러 줄(8,000자까지) · 다른 글은 200자 그대로');
  const s = fs.readFileSync(path.join(ROOT, 'shop/shop.js'), 'utf8'); ok(/shelf\.js\?v=0\.2\.12/.test(s) && /shelf\.css\?v=0\.2\.12/.test(s) && /shelf-core\.js\?v=0\.2\.12/.test(s) && /shop\.js\?v=0\.2\.4\b/.test(fs.readFileSync(path.join(ROOT, 'shop/index.html'), 'utf8')) && BQS.VER === '0.3.7', '판 번호: 서가 0.2.12 · 손님 화면 shop.js 0.2.4 · 설정 틀 0.3.7');
  for (const f of ['shop/shelf.js', 'shop/shelf-core.js']) { const t = fs.readFileSync(path.join(ROOT, f), 'utf8'); ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(t), f + ': 브라우저 창 없음'); }
  const js = fs.readFileSync(path.join(ROOT, 'shop/shelf.js'), 'utf8'); const blk = js.slice(js.indexOf('function openSet('), js.indexOf('function closeBook('));
  ok(!/\.(left|top|width|height)\s*=\s*[^;]*\+\s*'px'[^;]*;\s*\}\s*\)\s*;?\s*$/m.test('') && !/animate\(\[\{[^\]]*\b(left|top|width|height|margin)\s*:/.test(blk), '움직임은 transform·opacity만(자리 칸 left·top·크기는 움직이지 않음)'); }
if (!process.env.RN_SHELF_UI) { console.log(bad ? `❌ tSHELFSET1_1114 ${bad}개 실패` : '✓ tSHELFSET1_1114 순수 셈 통과 (화면 시험은 RN_SHELF_UI=1)'); process.exit(bad ? 1 : 0); }

console.log('② 화면');
const SHOT = process.env.RN_SHOT || path.join(os.tmpdir(), 'shelfset1'); fs.mkdirSync(SHOT, { recursive: true }); const { chromium } = require('playwright');
const SVG = { cover: (h) => `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="430"><rect width="300" height="430" fill="hsl(${h},55%,40%)"/><rect y="250" width="300" height="70" fill="hsl(${(h + 150) % 360},60%,70%)"/><text x="24" y="90" font-size="34" fill="#fff" font-family="sans-serif">세트 ${h}</text></svg>`,
  spine: (h) => `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="400"><rect width="40" height="400" fill="hsl(${h},50%,30%)"/><rect y="30" width="40" height="14" fill="#e8c66a"/><rect y="340" width="40" height="14" fill="#e8c66a"/><text x="27" y="80" font-size="20" fill="#fff" transform="rotate(90 27 80)">책등 표본</text></svg>` };
const D0 = BQS.demoItems(120, 11).map((x, i) => ({ ...x, id: 'D' + i, im: null, bk: null, at: '2026-09-' + String(1 + (i % 28)).padStart(2, '0') }));
const SPEC = [['S1', '[세트] 시험 만화 1~8 (상급 소장용)', '그린이 가', '국내도서>만화', null, null, 'cover', null], ['S2', '시험 대하소설 세트 - 전5권', '지은이 나', '국내도서>소설/시/희곡>한국소설', '152x225x110', 1800, 'cover', null], ['S3', '시험 고전 세트 - 전3권', '지은이 다', '국내도서>인문학', '148x210x60', 900, 'cover', 'spine'],
  ['S4', '[세트] 시험 학습만화 1~20 완결', '글 라', '국내도서>어린이', '188x257', 3600, 'cover', null], ['B1', '세트 아닌 시험 책', '지은이 마', '국내도서>에세이', '128x188x18', 260, 'cover', null]];
const mk = (base) => [...SPEC.map(([id, t, a, cp, sz, pg, im, sp], i) => ({ id, t, a, cp, c: cp.split('>')[1] || cp, p: 12000 + i * 3000, lp: 40000, at: '2026-11-14', sz, pg, im: base + '/img/' + im + '_' + (50 * i + 20) + '.svg', sp: sp ? base + '/img/spine_' + (40 * i) + '.svg' : null })), ...D0];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
let rows = []; const base0 = { v: '' };
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const Jo = (o, s) => { res.writeHead(s || 200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  const m = /^\/img\/(cover|spine)_(\d+)/.exec(u.pathname); if (m) { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); return res.end(SVG[m[1]](+m[2])); }
  if (u.pathname === '/shop/cfg') return Jo({ ok: true, open: 1, name: '북스퀸', n: rows.length, pay: { how: 'wait' }, biz: {}, kinds: [], cats: [], shelf: { cap: 200, sort0: 'reg', fontsOn: false, coverColor: false, edgeSpine: false } });
  if (u.pathname === '/shop/shelf') return Jo({ ok: true, n: rows.length, k: 0, kn: 1, cols: SH.SHELF_COLS, pre: [], rows });
  if (u.pathname === '/shop/item') { const x = mk(base0.v).find((y) => y.id === u.searchParams.get('id')); return x ? Jo({ ok: true, item: { ...x, st: 's', info: { intro: '지어낸 세트 소개' }, pvs: [base0.v + '/img/cover_1.svg', base0.v + '/img/cover_2.svg'] }, same: [], rel: [] }) : Jo({ ok: false }, 404); }
  if (u.pathname.startsWith('/shop/')) return Jo({ ok: true });
  const f = path.join(ROOT, 'shop', u.pathname.replace(/^\/s\//, '').replace(/\.\./g, '') || 'index.html'); if (!u.pathname.startsWith('/s/') || !fs.existsSync(f)) { res.writeHead(404); return res.end('{}'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port; base0.v = base;
rows = mk(base).map((x) => SH.SHELF_COLS.map((k) => (k === 'st' ? 's' : x[k] == null ? null : x[k])));
const kill = setTimeout(() => { console.log('  ❌ 300초 넘음'); process.exit(1); }, 300000); const br = await chromium.launch({ args: ['--disable-gpu', '--no-sandbox'] });
const open = async (ctxO, hash, o2) => { o2 = o2 || {}; const ctx = await br.newContext({ deviceScaleFactor: 2, ...ctxO, ...(o2.rm ? { reducedMotion: 'reduce' } : {}) }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await p.addInitScript(([u, cov]) => { window.BQ_API = u; try { localStorage.clear(); if (cov) for (const k of ['bq-shelf-cov', 'bqs-cov', 'bq-shelf-v1-cov']) localStorage.setItem(k, 'true'); } catch (e) {} }, [base, !!o2.cov]);
  await p.goto(base + '/s/index.html' + hash); await p.waitForSelector('.bqs-case.cur .sp', { timeout: 20000 }); await p.waitForTimeout(700); return { ctx, p, errs }; };
const cfgQ = (o) => '&cfg=' + BQS.previewArg(BQS.cfgOf(o));
const PC = { viewport: { width: 1280, height: 860 } }; const M = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const shot = (p, n) => p.screenshot({ path: path.join(SHOT, n + '.jpg'), type: 'jpeg', quality: 72 });
/* 사진은 움직임을 그 시각(ms)에 멈춰 찍음 — 시험 브라우저가 사진 찍는 동안 움직임이 끝나 버리지 않게 */
const at = async (p, ms, name) => { await p.evaluate((ms) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms; }), ms); await shot(p, name); };
const play = (p) => p.evaluate(() => document.getAnimations().forEach((a) => a.play()));
const phase = (p) => p.evaluate(() => document.querySelector('.bqs').dataset.obPhase || '');
const waitPh = async (p, ph, n) => { for (let w = 0; w < (n || 60); w++) { if ((await phase(p)) === ph) return true; await p.waitForTimeout(50); } return false; };
/* 쌓인 모습 재기 — 권마다 화면 자리(가운데 y)·기울기 */
const geo = (p) => p.evaluate(() => [...document.querySelectorAll('.ss-stage .ss-v')].map((g) => { const r = g.getBoundingClientRect(); const m = new DOMMatrix(getComputedStyle(g).transform); return { v: +g.dataset.v, cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height, ang: Math.round(Math.atan2(m.b, m.a) * 180 / Math.PI), z: +g.style.zIndex || 0 }; }));
/* 프레임 간격 재기 — 움직이는 동안 requestAnimationFrame 사이 가장 긴 간격 */
const frames = (p, ms) => p.evaluate((ms) => new Promise((ok) => { const T = []; const t0 = performance.now(); const f = (t) => { T.push(t); if (t - t0 < ms) requestAnimationFrame(f); else { const d = T.slice(1).map((v, i) => v - T[i]); d.sort((a, b) => a - b); ok({ n: d.length, max: Math.round(d[d.length - 1] || 0), p95: Math.round(d[Math.floor(d.length * 0.95)] || 0) }); } }; requestAnimationFrame(f); }), ms);
/* 닫을 때 제자리 꽂히는 차례 — 책장의 권(pulled 빠짐)을 지켜봄 */
const watchBack = (p, id) => p.evaluate((id) => { window.__back = []; const L = [...document.querySelectorAll(`.bqs-case.cur .bqs-set[data-set="${id}"] .sp.sv`)]; const mo = new MutationObserver(() => { for (const b of L) if (!b.classList.contains('pulled') && !window.__back.includes(+b.dataset.v)) window.__back.push(+b.dataset.v); }); L.forEach((b) => mo.observe(b, { attributes: true, attributeFilter: ['class'] })); window.__mo = mo; }, id);
try {
  { const { ctx, p, errs } = await open(PC, '#/shelf?s=reg');
    const G = await p.evaluate(() => { const g = (id) => { const s = document.querySelector(`.bqs-case.cur .bqs-set[data-set="${id}"]`); if (!s) return null; const L = [...s.querySelectorAll('.sp.sv')]; return { n: L.length, w: L.map((b) => Math.round(b.querySelector('.sk').getBoundingClientRect().width * 10) / 10), vn: L.map((b) => (b.querySelector('.vn') || {}).textContent || ''), c: L.map((b) => b.style.getPropertyValue('--c')), img: L.map((b) => b.classList.contains('img')), d: L.map((b) => b.dataset.d), y: L.map((b) => Math.round(b.querySelector('.vn') ? b.querySelector('.vn').getBoundingClientRect().bottom - b.querySelector('.sk').getBoundingClientRect().bottom : 0)) }; };
      const one = document.querySelector('.bqs-case.cur .sp[data-id="B1"]'); return { S1: g('S1'), S2: g('S2'), S3: g('S3'), S4: g('S4'), B1: !!one && !one.dataset.v }; });
    ok(G.S1 && G.S1.n === 8 && G.S2 && G.S2.n === 5 && G.S3 && G.S3.n === 3 && G.S4 && G.S4.n === 20 && G.B1, `책장에 권 수만큼: S1 ${G.S1 && G.S1.n}권 · S2 ${G.S2 && G.S2.n}권 · S3 ${G.S3 && G.S3.n}권 · S4 ${G.S4 && G.S4.n}권 · 세트 아닌 책은 하나`);
    ok(G.S2.w.every((w) => Math.abs(w - G.S2.w[0]) < 0.6) && G.S2.vn.join() === '1,2,3,4,5' && new Set(G.S2.d).size === 1 && new Set(G.S2.y).size <= 2, `S2 권 두께 같음(${G.S2.w.join('·')}px = 110mm÷5) · 권 번호 1~5가 같은 자리 · 디자인 하나(${G.S2.d[0]})`);
    ok(G.S3.img.every(Boolean) && G.S3.vn.join() === '1,2,3', 'S3 알라딘 책등 그림 있음 → 모든 권에 그 그림 + 권 번호');
    await p.evaluate(() => document.querySelector('.bqs-case.cur .bqs-set[data-set="S2"]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(250); await shot(p, 'pc1280_shelf_sets');
    /* 기본(쌓임) — 시작·중간·끝 */
    await p.click('.bqs-case.cur .bqs-set[data-set="S2"] .sp.sv[data-v="2"]'); await at(p, 120, 'pc1280_stack_1start'); await at(p, 420, 'pc1280_stack_2mid'); await play(p);
    await waitPh(p, 'open'); await p.waitForTimeout(450); await shot(p, 'pc1280_stack_3end');
    const S = await geo(p); const st1 = await p.evaluate(() => ({ set: document.querySelector('.bqs').dataset.set, book: !!document.querySelector('.bqs-ob .ob-book'), tag: (document.querySelector('.bqs-sset .ob-tag') || { hidden: true }).hidden, pv: !!document.querySelector('[data-a="spv"]'), cart: !!document.querySelector('.bqs-sset [data-a="cart"]'), info: (document.querySelector('.bqs-sset .oc-set') || {}).textContent || '', pulled: document.querySelectorAll('.bqs-case.cur .bqs-set[data-set="S2"] .sp.pulled').length }));
    const ys = S.sort((a, b) => a.v - b.v).map((g) => g.cy); ok(st1.set === 'stack:5' && S.length === 5 && S.every((g) => Math.abs(Math.abs(g.ang) - 90) <= 4) && ys.every((y, i) => !i || y < ys[i - 1]) && st1.pulled === 5, `누르면 다섯 권 모두 빠져 앞에 눕혀 쌓임(기울기 ${S.map((g) => g.ang).join('·')}° · 1권이 맨 아래 → 5권 맨 위) · 책장 자리는 비어 보임`);
    ok(!st1.book && st1.tag && !st1.pv && st1.cart && /전 5권 세트/.test(st1.info), `세트는 샘플 페이지 없음(샘플 자료가 있어도) · 담기 단추 그대로 · 「${st1.info.trim().slice(0, 30)}」`);
    await p.keyboard.press('Escape'); await waitPh(p, 'shelved', 80); await p.waitForTimeout(200); const fr1 = frames(p, 1200); await p.click('.bqs-case.cur .bqs-set[data-set="S2"] .sp.sv[data-v="2"]'); const F1 = await fr1; await waitPh(p, 'open'); await p.waitForTimeout(300);
    ok(F1.n > 10, `프레임 간격(꺼내는 1.3초 · 화면 없는 시험 브라우저): 가장 긴 ${F1.max}ms · 95% ${F1.p95}ms · ${F1.n}프레임`); console.log('    프레임', JSON.stringify(F1));
    /* 역순 복귀 */
    await watchBack(p, 'S2'); await p.keyboard.press('Escape'); await p.waitForTimeout(30); await at(p, 330, 'pc1280_stack_4back_mid'); await play(p); await waitPh(p, 'shelved', 80); await p.waitForTimeout(150);
    const back = await p.evaluate(() => window.__back); await shot(p, 'pc1280_stack_5back_end'); const left = await p.evaluate(() => ({ ob: !!document.querySelector('.bqs-ob'), pulled: document.querySelectorAll('.bqs-case.cur .sp.pulled').length }));
    ok(back.join() === '4,3,2,1,0' && !left.ob && !left.pulled, `닫으면 역순으로 한 권씩 제자리(꽂힌 차례 ${back.map((v) => v + 1).join('→')}권) · 모두 돌아옴`);
    /* 꺼내는 중에 닫아도 */
    await p.click('.bqs-case.cur .bqs-set[data-set="S2"] .sp.sv[data-v="0"]'); await p.waitForTimeout(150); await p.keyboard.press('Escape'); await waitPh(p, 'shelved', 80); await p.waitForTimeout(100);
    ok(!(await p.evaluate(() => !!document.querySelector('.bqs-ob') || document.querySelectorAll('.bqs-case.cur .sp.pulled').length)), '꺼내는 도중 Esc → 그 자리에서 되돌아가 모두 꽂힘');
    /* 세트 아닌 책은 예전처럼 펼침 */ await p.click('.bqs-case.cur .sp[data-id="B1"]'); await waitPh(p, 'open', 60); ok(await p.evaluate(() => !!document.querySelector('.bqs-ob .ob-book') && !document.querySelector('.bqs-sset')), '세트 아닌 책은 예전처럼 뽑혀 펼침'); await p.keyboard.press('Escape'); await waitPh(p, 'shelved', 60);
    ok(!errs.length, 'PC 오류 0 ' + errs.slice(0, 2).join(' | ')); await ctx.close(); }
  /* 다른 모양 넷 — 20권 세트로 */
  for (const [md, chk] of [['fan', (S) => { const a = S.map((g) => g.ang); return a[0] < -20 && a[a.length - 1] > 20 && a.every((v, i) => !i || v >= a[i - 1]); }], ['row', (S) => S.every((g) => Math.abs(g.ang) <= 1) && S.every((g, i) => !i || g.cx > S[i - 1].cx)],
    ['lean', (S) => S.every((g) => g.ang < -5 && g.ang > -30) && S.every((g, i) => !i || g.cx > S[i - 1].cx)], ['one', (S) => Math.abs(S[0].ang) <= 1 && S[0].h > S[1].h * 1.3 && S[0].z > S[1].z]]) {
    const { ctx, p, errs } = await open(PC, '#/shelf?s=reg' + cfgQ({ setAnim: md })); await p.evaluate(() => document.querySelector('.bqs-case.cur .bqs-set[data-set="S4"]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(200);
    await p.click('.bqs-case.cur .bqs-set[data-set="S4"] .sp.sv[data-v="0"]'); await at(p, 700, `pc1280_${md}_mid`); await play(p); await waitPh(p, 'open', 80); await p.waitForTimeout(400); await shot(p, `pc1280_${md}_end`);
    const S = (await geo(p)).sort((a, b) => a.v - b.v); const set = await p.evaluate(() => document.querySelector('.bqs').dataset.set); const vw = await p.evaluate(() => innerWidth); const inside = S.every((g) => g.cx > 0 && g.cx < vw);
    ok(set === md + ':20' && S.length === 20 && chk(S) && inside, `모양 「${md}」: 20권 · 기울기 ${S.slice(0, 4).map((g) => g.ang).join('·')}…${S[19].ang}° · 화면 안`);
    await watchBack(p, 'S4'); await p.keyboard.press('Escape'); await waitPh(p, 'shelved', 120); const back = await p.evaluate(() => window.__back); ok(back.length === 20 && back[0] === 19 && back[19] === 0, `「${md}」 닫기도 역순(${back[0] + 1}권 먼저 … ${back[19] + 1}권 마지막)`); ok(!errs.length, `「${md}」 오류 0 ` + errs.slice(0, 2).join(' | ')); await ctx.close(); }
  /* 설정: 닫는 차례 '나온 차례대로' · 샘플 켜기 · 권 번호 위 */
  { const { ctx, p, errs } = await open(PC, '#/shelf?s=reg' + cfgQ({ setBack: 'same', setPv: true, setNum: 'top', setGap: 30, setMs: 300 })); await p.click('.bqs-case.cur .bqs-set[data-set="S2"] .sp.sv[data-v="0"]'); await waitPh(p, 'open', 80); await p.waitForTimeout(500);
    const R = await p.evaluate(() => ({ pv: !!document.querySelector('[data-a="spv"]'), top: !!document.querySelector('.bqs-case.cur .vn.vn-t') })); await watchBack(p, 'S2'); await p.keyboard.press('Escape'); await waitPh(p, 'shelved', 80); const back = await p.evaluate(() => window.__back);
    ok(R.pv && R.top && back.join() === '0,1,2,3,4', `설정: 「세트도 샘플」 켜면 1권 샘플 단추 · 권 번호 위 · 닫는 차례 「나온 차례대로」(${back.map((v) => v + 1).join('→')})`);
    await p.click('.bqs-case.cur .bqs-set[data-set="S2"] .sp.sv[data-v="0"]'); await waitPh(p, 'open', 80); await p.waitForTimeout(300); await p.click('[data-a="spv"]'); await waitPh(p, 'open', 80); await p.waitForTimeout(400); const pv = await p.evaluate(() => !!document.querySelector('.bqs-ob .ob-book') && !document.querySelector('.bqs-sset'));
    ok(pv, '「1권 샘플 보기」 → 1권이 책처럼 펼쳐짐'); ok(!errs.length, '설정 시험 오류 0 ' + errs.slice(0, 2).join(' | ')); await ctx.close(); }
  /* 움직임 줄이기 · 움직임 없음 */
  { const { ctx, p, errs } = await open(PC, '#/shelf?s=reg', { rm: 1 }); await p.click('.bqs-case.cur .bqs-set[data-set="S2"] .sp.sv[data-v="0"]'); await p.waitForTimeout(80); const ph = await phase(p); const S = await geo(p);
    ok(ph === 'open' && S.length === 5 && S.every((g) => Math.abs(Math.abs(g.ang) - 90) <= 4), `움직임 줄이기 설정: 바로 쌓인 끝 모습(${ph})`); await p.keyboard.press('Escape'); await p.waitForTimeout(80); ok(!(await p.evaluate(() => !!document.querySelector('.bqs-ob'))) && !errs.length, '바로 닫힘 · 오류 0'); await ctx.close(); }
  /* 표지 모드 */
  { const { ctx, p, errs } = await open(PC, '#/shelf?s=reg', { cov: 1 }); let cov = await p.evaluate(() => !!document.querySelector('.bqs-case.cur .cvb')); if (!cov) { await p.click('.bqs-cvt').catch(() => {}); await p.waitForTimeout(700); cov = await p.evaluate(() => !!document.querySelector('.bqs-case.cur .cvb')); }
    const bd = await p.evaluate(() => (document.querySelector('.bqs-case.cur .cvb[data-id="S2"] .setb') || {}).textContent || ''); await p.evaluate(() => document.querySelector('.bqs-case.cur .cvb[data-id="S2"]').scrollIntoView({ block: 'center' }));
    await p.click('.bqs-case.cur .cvb[data-id="S2"]'); await at(p, 380, 'pc1280_cover_set_mid'); await play(p); await waitPh(p, 'open', 80); await p.waitForTimeout(400); await shot(p, 'pc1280_cover_set_end'); const S = await geo(p);
    ok(cov && /5권/.test(bd) && S.length === 5, `표지 모드: 세트 표지에 「${bd}」 · 누르면 표지 자리에서 다섯 권이 나와 쌓임`); await p.keyboard.press('Escape'); await waitPh(p, 'shelved', 80); ok(!(await p.evaluate(() => !!document.querySelector('.bqs-ob'))) && !errs.length, '표지 모드 닫힘 · 오류 0 ' + errs.slice(0, 2).join(' | ')); await ctx.close(); }
  /* 휴대폰 390 */
  { const { ctx, p, errs } = await open(M, '#/shelf?s=reg'); await p.evaluate(() => document.querySelector('.bqs-case.cur .bqs-set[data-set="S2"]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(250); await shot(p, 'm390_shelf_sets');
    await p.tap('.bqs-case.cur .bqs-set[data-set="S2"] .sp.sv[data-v="1"]'); await at(p, 120, 'm390_stack_1start'); await at(p, 420, 'm390_stack_2mid'); await play(p); await waitPh(p, 'open'); await p.waitForTimeout(450); await shot(p, 'm390_stack_3end'); await p.keyboard.press('Escape'); await waitPh(p, 'shelved', 80); await p.waitForTimeout(200); const fr2 = frames(p, 1200); await p.tap('.bqs-case.cur .bqs-set[data-set="S2"] .sp.sv[data-v="1"]'); const F = await fr2; await waitPh(p, 'open'); await p.waitForTimeout(300);
    const S = (await geo(p)).sort((a, b) => a.v - b.v); const sw = await p.evaluate(() => document.documentElement.scrollWidth); ok(S.length === 5 && S.every((g, i) => !i || g.cy < S[i - 1].cy) && S.every((g) => g.cx - g.w / 2 >= 0 && g.cx + g.w / 2 <= 390) && sw <= 390, `휴대폰: 한 권씩 빠져 앞에 쌓임 · 화면 안 · 가로 넘침 없음(${sw}px) · 프레임 가장 긴 ${F.max}ms`);
    await watchBack(p, 'S2'); await p.keyboard.press('Escape'); await p.waitForTimeout(30); await at(p, 330, 'm390_stack_4back_mid'); await play(p); await waitPh(p, 'shelved', 80); const back = await p.evaluate(() => window.__back); await shot(p, 'm390_stack_5back_end');
    ok(back.join() === '4,3,2,1,0', `휴대폰 닫기 역순(${back.map((v) => v + 1).join('→')})`);
    await p.evaluate(() => document.querySelector('.bqs-case.cur .bqs-set[data-set="S4"]').scrollIntoView({ block: 'center' })); await p.tap('.bqs-case.cur .bqs-set[data-set="S4"] .sp.sv[data-v="3"]'); await waitPh(p, 'open', 100); await p.waitForTimeout(400); await shot(p, 'm390_stack20_end'); const S4 = await geo(p);
    ok(S4.length === 20 && S4.every((g) => g.cy > 0 && g.cy < 844), '휴대폰 20권 세트도 화면 안에 쌓임'); await p.keyboard.press('Escape'); await waitPh(p, 'shelved', 120); ok(!errs.length, '휴대폰 오류 0 ' + errs.slice(0, 2).join(' | ')); await ctx.close(); }
  { const { ctx, p, errs } = await open(M, '#/shelf?s=reg' + cfgQ({ setMob: 'sheet' })); await p.tap('.bqs-case.cur .bqs-set[data-set="S2"] .sp.sv[data-v="0"]'); await p.waitForTimeout(900); const R = await p.evaluate(() => ({ sheet: !document.querySelector('.bqs-sheet').hidden, pv: !!document.querySelector('.bqs-sheet .sb-pv'), ob: !!document.querySelector('.bqs-ob') }));
    ok(R.sheet && !R.pv && !R.ob, '휴대폰 설정 「아래 정보 창」: 세트는 샘플 단추 없이 아래 창'); ok(!errs.length, '휴대폰 아래 창 오류 0'); await ctx.close(); }
} catch (e) { bad++; console.log('  ❌ 화면 시험 예외', e && e.stack ? e.stack.slice(0, 900) : e); }
await br.close(); srv.close(); clearTimeout(kill);
console.log(bad ? `❌ tSHELFSET1_1114 ${bad}개 실패 · 사진 ${SHOT}` : `✓ tSHELFSET1_1114 모두 통과 · 사진 ${SHOT}`); process.exit(bad ? 1 : 0);
})();

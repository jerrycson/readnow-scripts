// tSHOPFONT1_1114 — (11/14 shopfont1) 🔤 글꼴 쓰임(역할) 나누기 · 사람 목소리 글 = 고운돋움(Gowun Dodum) 기본 · 역할마다 설정에서 바꿈(정범님 11/14 14:36 · I-1114-1436-12)
//   ① 순수 셈: 우리숍 꾸밈 틀(shop/shop-look.js BQL) 글꼴 칸 기본값(v1 = ①만 고운돋움)·옛 판 v0(규칙 0 = 11/14 전 그대로)·역할별 CSS 변수가 설정을 따름·받을 주소(기기 기본 아닌 것만 · 굵기 몫만 · display=swap)
//      · 클라우드 /shop/cfg가 글꼴 칸을 그대로 넘김 · 웹앱 🔤 글꼴(src/app.html ◆font) 기본·옛 판·되돌리기 · 두 고르기 목록이 같은 글꼴 · 브라우저 창 없음
//   ② 화면(RN_UI=1 · playwright · 가짜 클라우드 · 지어낸 책 · 손님A): 휴대폰 390 · PC 1280 — 첫 화면 큰 띠·책소개·출판사 서평·리뷰·밑줄·가게 답글이 고운돋움 · 목차·값·단추는 그대로 · 손님 입력칸
//      · 글꼴을 못 받을 때(구글 막음) 글자가 기기 글꼴로 바로 보임 · 옛 판 v0이면 글꼴을 받지 않음 · 역할마다 다른 글꼴 · 받은 무게(KB) 잼
//   ③ 웹앱(RN_PORT · pw/ 안 harness.js): ⚙ 설정 › 🔤 글꼴 칸 · 고르면 바로 바뀜(rn-font) · 기본값으로 · 옛 판 v0
// 실행: node src/tests/tSHOPFONT1_1114.js · 화면까지: RN_UI=1 RN_SHOT=<사진 폴더> node src/tests/tSHOPFONT1_1114.js · 웹앱: (cd <pw> && RN_PORT=<포트> node <이 파일>)
const fs = require('fs'); const path = require('path'); const http = require('http'); const os = require('os'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x !== undefined ? JSON.stringify(x).slice(0, 500) : ''); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const BQL = require(path.join(ROOT, 'shop/shop-look.js')); const SH = require(path.join(ROOT, 'cloud/shop.js'));
/* 웹앱 ◆font 덩어리만 떼어 돌림(UX2_SGSEC·sec·esc는 가짜) */
const APP = rd('src/app.html'); const blk = APP.slice(APP.indexOf('/* ◆font 시작'), APP.indexOf('/* ◆font 끝 */'));
const mkW = (store) => { const ls = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } }; const doc = { head: { appendChild: () => {} }, getElementById: () => null, createElement: () => ({ dataset: {} }), querySelector: () => null, addEventListener: () => {}, body: null };
  const ctx = { localStorage: ls, document: doc, UX2_SGSEC: {}, esc: (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]), sec: (id, t, b) => `<details data-sec="${id}"><summary>${t}</summary>${b}</details>`, toast: () => {}, renderMain: () => {}, window: {}, requestAnimationFrame: (f) => f(), console };
  vm.createContext(ctx); vm.runInContext(blk + '\n;globalThis.__W = { RNF_FONTS, RNF_ROLES, RNF_SETS, rnfCfg, rnfOf, rnfCss, rnfUrls, rnfSetHtml, rnfPut };', ctx); return ctx.__W; };
(async () => {
console.log('① 순수 셈');
{ const c = BQL.cfgOf({}); const R = BQL.fontOf(c);
  ok(c.fontSet === 'v1' && R.voice === 'gowun' && ['body', 'head', 'num', 'ui'].every((r) => R[r] === 'sys') && c.fVoiceIn === true, '기본(새 판 v1): ① 사람 목소리 글만 고운돋움 · 본문·제목·숫자·단추는 기기 기본 · 손님 입력칸도 ①', R);
  ok(Object.keys(BQL.cfgDiff({})).length === 0, '기본값만이면 저장할 칸 0(꾸밈 「기본값으로」 = 글꼴도 기본)');
  const css = BQL.cssText({}); ok(/--f-voice:"Gowun Dodum", var\(--font\)/.test(css) && /html \.bqa-rv \.s100/.test(css) && /html \.bkinfo \.bki:not\(\.toc\) \.bkt/.test(css) && /html \.hero h1/.test(css) && /html #bqaBd/.test(css) && !/html body\{/.test(css) && !/html button/.test(css), '손님 화면 CSS: ①(리뷰 한 줄 평·책소개 칸·첫 화면 큰 띠·리뷰 쓰기 칸)만 규칙 · 본문·단추 규칙 0(지금 모양 그대로) · 못 받으면 var(--font)');
  const v0 = BQL.fontCss({ fontSet: 'v0' }); ok(!/font-family/.test(v0) && !BQL.fontUrls({ fontSet: 'v0' }).length, '옛 판 v0: 글꼴 규칙 0 · 받을 글꼴 0 — 11/14 전과 같은 모양(약속 79 옛 판 남김)', v0);
  const U = BQL.fontUrls({}); ok(U.length === 1 && U[0].url === 'https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap' && U[0].roles.join() === 'voice', '받을 주소: 고운돋움 하나 · 굵기 400만(고운돋움엔 400뿐) · display=swap(받는 동안 기기 글꼴로 보임)', U);
  const X = { fBody: 'plex', fHead: 'plex', fNum: 'pretendard', fUi: 'noto', fVoice: 'nanummj' }; const U2 = BQL.fontUrls(X); const m = Object.fromEntries(U2.map((u) => [u.id, u]));
  ok(m.plex && /IBM\+Plex\+Sans\+KR:wght@400;700&display=swap$/.test(m.plex.url) && m.plex.roles.join() === 'body,head' && m.noto && /Noto\+Sans\+KR:wght@400;700&/.test(m.noto.url) && m.nanummj && /Nanum\+Myeongjo:wght@400;700/.test(m.nanummj.url) && m.pretendard && /pretendard-dynamic-subset/.test(m.pretendard.url) && U2.length === 4, '역할마다 다른 글꼴: 같은 글꼴은 한 번만 받음(본문+제목 = IBM Plex 한 번) · 없는 굵기(600)는 가까운 굵기로 · 프리텐다드는 조각 받기 주소', U2);
  const c2 = BQL.fontCss(X); ok(/--f-body:"IBM Plex Sans KR", var\(--font\)/.test(c2) && /html body\{font-family:var\(--f-body\)\}/.test(c2) && /html button,html \.btn/.test(c2) && /html \.price b/.test(c2) && /--f-voice:"Nanum Myeongjo", "Noto Serif KR"/.test(c2) && c2.indexOf('--f-voice)') > c2.indexOf('--f-head)'), 'CSS 변수가 설정값을 따름(--f-body·--f-voice …) · 명조는 명조 갈래로 받침 · ① 규칙이 ③ 제목 규칙보다 뒤(큰 띠 제목은 ①)', c2);
  ok(BQL.fontOf({ fontSet: 'v0', fVoice: 'gaegu' }).voice === 'gaegu' && BQL.fontOf({ fontSet: 'v0' }).voice === 'sys' && BQL.fontOf({ fVoice: 'zzz' }).voice === 'gowun' && BQL.cfgOf({ fVoice: 'zzz' }).fVoice === 'auto', '칸을 고르면 판보다 앞섬 · 「판 기본값」이면 판대로 · 모르는 글꼴은 판 기본값으로');
  ok(!BQL.fontCss({ fVoiceIn: false }).includes('#bqaBd'), '「손님이 쓰는 칸에도」를 끄면 입력칸 규칙 0');
  const P = SH.pubCfg({ open: 1, look: { fontSet: 'v0', fVoice: 'gaegu', fVoiceIn: false } }, null, {}); ok(P.look.fontSet === 'v0' && P.look.fVoice === 'gaegu' && P.look.fVoiceIn === false, '클라우드 /shop/cfg가 글꼴 칸을 모든 손님에게 그대로 넘김(app_settings/shop.look)', P.look);
  ok(BQL.SCHEMA.filter((p) => p.group === '글꼴').length === 7 && BQL.SCHEMA.every((p) => /^[A-Za-z][A-Za-z0-9]{0,23}$/.test(p.k)), '🎨 우리숍 꾸밈 카드 「글꼴」 묶음 7칸(판 · 역할 다섯 · 손님 입력칸) — 칸 이름이 클라우드 공개 거름 안');
  ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(rd('shop/shop-look.js') + rd('shop/shop.js') + blk), '브라우저 창 없음(팝업 금지)');
  ok(/shop-look\.js\?v=0\.1\.([3-9]|\d\d)/.test(rd('shop/index.html')) && /^0\.1\.([3-9]|\d\d)$/.test(BQL.VER), `판 번호: 꾸밈 틀 ${BQL.VER} · 첫 화면이 새 판을 부름`);
  const W = mkW({}); const R1 = W.rnfOf(); ok(R1.voice === 'gowun' && Object.entries(R1).every(([k, v]) => k === 'voice' || v === 'keep'), '웹앱 기본(새 판 v1): ① 사람 목소리 글만 고운돋움 · 나머지 「지금 그대로」(규칙 0)', R1);
  const wc = W.rnfCss(); ok(/^:root\{--jbn-hand:"Gowun Dodum"/.test(wc) && /html \.fvoice/.test(wc) && /html textarea\[data-bqarp\]/.test(wc) && !/html body/.test(wc) && W.rnfUrls().length === 1, '웹앱 CSS: 📓 정범 노트(--jbn-hand)·.fvoice(우리숍 리뷰·문의·가게 답글)만 · 본문 규칙 0', wc);
  const W0 = mkW({ 'rn-font': JSON.stringify({ set: 'v0', r: {} }) }); ok(W0.rnfCss() === '' && !W0.rnfUrls().length, '웹앱 옛 판 v0: 규칙 0 · 받을 글꼴 0(11/14 전 그대로)');
  const W2 = mkW({ 'rn-font': JSON.stringify({ set: 'v1', r: { body: 'plex', mono: 'nanumcode', num: 'sys' } }) }); const wc2 = W2.rnfCss();
  ok(/html body\{font-family:"IBM Plex Sans KR"/.test(wc2) && /html \.tag\.sku[^{]*\{font-family:"Nanum Gothic Coding",ui-monospace/.test(wc2) && /html \.stat b[^{]*\{font-family:-apple-system/.test(wc2) && W2.rnfUrls().map((u) => u.id).sort().join() === 'gowun,nanumcode,plex', '웹앱 역할마다: 본문 IBM Plex · 고정폭 나눔고딕코딩(고정폭으로 받침) · 숫자 기기 기본(받지 않음)', wc2);
  const h = W2.rnfSetHtml(); ok((h.match(/data-rnfr="/g) || []).length === 7 && /data-rnfset/.test(h) && /id="rnf_def"/.test(h) && /data-sec="set_font"/.test(h) && /우리숍 꾸밈 › 「글꼴」/.test(h), '웹앱 ⚙ 설정 › 🔤 글꼴: 글꼴 판 + 역할 일곱 고르기 + 「기본값으로(새 판 v1)」 + 우리숍 쪽 자리 안내');
  const same = ['gowun', 'plex', 'noto', 'pretendard', 'notoserif', 'nanummj', 'gowunbt', 'nanumpen', 'gaegu'].every((k) => BQL.FONTS[k] && W.RNF_FONTS[k] && BQL.FONTS[k][1] === W.RNF_FONTS[k][1]);
  ok(same, '우리숍·웹앱 고르기 목록이 같은 글꼴(고운돋움·IBM Plex Sans KR·Noto Sans KR·Pretendard·Noto Serif KR·나눔명조·고운바탕·나눔손글씨 펜·개구 + 기기 기본)');
  ok(/class="fvoice"/.test(APP) && /class="fvoice"/.test(rd('readnow-shopadm.js')) && /rnfSetHtml\(\)/.test(APP) && /sec: 'set_font'/.test(APP), '웹앱: 우리숍 리뷰 관리·백오피스 문의·가게 답 글에 ① 표 · 설정 칸 · 🔍 기능 찾기 길'); }
if (process.env.RN_PORT && fs.existsSync(path.join(process.cwd(), 'harness.js'))) { console.log('③ 웹앱 ⚙ 설정 › 🔤 글꼴(RN_PORT · pw/ 안 harness.js · 바깥 주소는 막힘 = 글꼴 못 받는 기기)');
  await require(path.join(process.cwd(), 'harness.js'))(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.message()); d.dismiss().catch(() => {}); });
    const r = await p.evaluate(async () => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; localStorage.removeItem('rn-font'); rnfApply();
      document.body.insertAdjacentHTML('beforeend', '<div class="jbn-memo" id="__m"><span class="tx">정범 노트 시험 글</span></div><div class="fvoice" id="__v">손님A 리뷰 시험 글</div>'); await Wt(400);
      const ff = (id) => getComputedStyle(document.getElementById(id)).fontFamily; o.memo = ff('__m'); o.v = ff('__v'); o.body = getComputedStyle(document.body).fontFamily; o.link = [...RNF.got].map((u) => (/Gowun/.test(u) ? 'gowun' : u)); o.vw = document.getElementById('__v').getBoundingClientRect().width;
      S.tab = 'settings'; renderTabs(); renderMainNow(); await Wt(800); const d = document.querySelector('details[data-sec="set_font"]'); o.card = !!d; if (d) d.open = true; o.sel = document.querySelectorAll('[data-rnfr]').length;
      if (!o.sel) return o; const b = document.querySelector('[data-rnfr="body"]'); b.value = 'gaegu'; b.dispatchEvent(new Event('change', { bubbles: true })); await Wt(400); o.body2 = getComputedStyle(document.body).fontFamily; o.ls = localStorage.getItem('rn-font');
      const s = document.querySelector('[data-rnfset]'); s.value = 'v0'; s.dispatchEvent(new Event('change', { bubbles: true })); await Wt(400); o.v0 = getComputedStyle(document.getElementById('__v')).fontFamily; o.v0body = getComputedStyle(document.body).fontFamily;
      document.querySelector('#rnf_def').click(); await Wt(400); o.def = localStorage.getItem('rn-font'); o.body3 = getComputedStyle(document.body).fontFamily; o.v3 = getComputedStyle(document.getElementById('__v')).fontFamily; return o; });
    if (!r.sel) { bad++; console.log('  ❌ 🔤 글꼴 칸이 그려지지 않음', JSON.stringify(r)); return; }
    ok(/^"?Gowun Dodum/.test(r.memo) && /^"?Gowun Dodum/.test(r.v) && /^Pretendard/.test(r.body) && r.link.includes('gowun') && r.vw > 20, '웹앱 기본: 📓 정범 노트·.fvoice 글 = 고운돋움 · 본문은 지금 그대로(Pretendard) · 글꼴을 못 받아도 글자 보임', r);
    ok(r.card && r.sel === 7 && /^"?Gaegu/.test(r.body2) && /"body":"gaegu"/.test(r.ls), '⚙ 설정 › 🔤 글꼴: 역할 일곱 · ② 본문을 개구로 고르면 바로 바뀌고 이 기기에 저장(rn-font)', r);
    ok(!/Gowun/.test(r.v0) && /^"?Gaegu/.test(r.v0body), '글꼴 판 「옛 판 v0」: ① 규칙이 빠져 11/14 전 그대로(고른 칸은 그대로 앞섬)', r);
    ok(JSON.parse(r.def).set === 'v1' && !Object.keys(JSON.parse(r.def).r).length && /^Pretendard/.test(r.body3) && /^"?Gowun Dodum/.test(r.v3) && !dlg.length, '「기본값으로(새 판 v1)」: 되돌림 · 브라우저 창 0', r);
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(1500); await p.evaluate(() => { renderMainNow(); document.querySelectorAll('.dlp, #dlp, .ux2dk-sum, #ux2dock').forEach((e) => e.remove()); const d = document.querySelector('details[data-sec="set_font"]'); if (d) { d.open = true; d.scrollIntoView(); } }); await p.waitForTimeout(400);
    const wide = await p.evaluate(() => [...document.querySelectorAll('details[data-sec="set_font"] *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1).map((e) => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right))); ok(!wide.length, '휴대폰 390: 🔤 글꼴 칸이 화면 밖으로 넘치지 않음', wide);
    await p.waitForTimeout(600); await p.evaluate(() => { const d = document.querySelector('details[data-sec="set_font"]'); d.open = true; }); await p.locator('details[data-sec="set_font"] > summary').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -120)); await p.waitForTimeout(400); await p.screenshot({ path: path.join(process.env.RN_SHOT || os.tmpdir(), 'webapp_m390_settings_font.png') }); }); }
if (!process.env.RN_UI) { console.log(bad ? `❌ tSHOPFONT1_1114 ${bad}개 실패` : '✓ tSHOPFONT1_1114 순수 셈 통과 (화면 시험은 RN_UI=1)'); process.exit(bad ? 1 : 0); }

console.log('② 손님 화면(가짜 클라우드 · 지어낸 책 · 손님A)');
const SHOT = process.env.RN_SHOT || path.join(os.tmpdir(), 'shopfont1'); fs.mkdirSync(SHOT, { recursive: true }); const { chromium } = require('playwright');
const items = Array.from({ length: 40 }, (_, i) => ({ id: 'X' + i, t: ['푸른 바다의 기억', '도시의 새벽', '작은 정원 이야기', '오래된 지도'][i % 4] + (i > 3 ? ' ' + i : ''), a: '지은이A', pb: '출판사가', g: ['최상', '상', '중', '하'][i % 4], p: 3000 + i * 500, lp: 12000, im: null, ph: [], at: new Date(Date.now() - i * 3600e3).toISOString(), c: '소설/시/희곡', cp: '국내도서>소설/시/희곡', isbn: '979110000' + String(i).padStart(4, '0'), bd: [], q: 1 }));
const INFO = { b: { pubDate: '2019-05-01', pages: 320 }, t: { intro: '바다 곁 마을에서 자란 아이가 오래된 등대지기를 만나 들려주는 이야기 — 출판사가 쓴 책소개입니다.', toc: '1장 바다\n2장 등대\n3장 돌아오는 길', inbook: '“파도는 늘 같은 자리로 돌아오지만, 한 번도 같은 모양이었던 적은 없다.”', pubrev: '출판사 서평 — 올해 가장 따뜻한 성장 소설.', pubintro: '출판사가는 작은 마을의 이야기를 펴내는 출판사입니다.', rec: '“읽는 내내 바닷바람이 불었다.” — 추천평' } };
const RV = { ok: true, items: [{ rid: 'r1', uid: 'u2', nick: '손님A', st: 4.5, s100: '사진보다 훨씬 깨끗한 책이 왔어요', body: '포장도 꼼꼼했고 책 상태가 설명 그대로였습니다.\n다음에도 여기서 살게요.', at: new Date(Date.now() - 86400e3).toISOString(), reply: { tx: '고맙습니다 — 다음 책도 정성껏 보내 드릴게요.', at: new Date().toISOString() }, ph: [] }], st: { n: 1, avg: 4.5, d: [0, 0, 0, 1, 0], buy: 0, ph: 0 }, q: [{ qid: 'q1', tx: '파도는 늘 같은 자리로 돌아온다', uid: 'u2', nick: '손님A', pg: 12 }] };
let LOOKCFG = {}; const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' }; const SHOPDIR = process.env.RN_SHOPDIR || path.join(ROOT, 'shop');
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const J = (o, s) => { res.writeHead(s || 200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); }; const q = Object.fromEntries(u.searchParams);
  if (u.pathname === '/shop/cfg') { const T = SH.catTree(items); return J({ ok: true, open: 1, name: '북스퀸', n: items.length, shipFee: 3500, freeOver: 30000, pay: { how: 'wait' }, biz: { name: '북스퀸', ceo: '대표A', no: '000-00-00000' }, kinds: T.kinds, cats: [['소설/시/희곡', 40]], shelf: {}, promo: {}, look: LOOKCFG, brandLogo: '' }); }
  if (u.pathname === '/shop/cats') return J({ ok: true, n: items.length, ...SH.catTree(items) });
  if (u.pathname === '/shop/list') return J({ ok: true, ...SH.listItems(items, q) });
  if (u.pathname === '/shop/rv') return J(RV);
  if (u.pathname === '/shop/item') { const x = items.find((y) => y.id === q.id); return x ? J({ ok: true, item: { ...x, st: 's', cpk: x.cp }, info: INFO, same: [], rel: [] }) : J({ ok: false }, 404); }
  if (u.pathname.startsWith('/shop/')) return J({ ok: true });
  const f = path.join(SHOPDIR, u.pathname.replace(/^\/s\//, '').replace(/\.\./g, '') || 'index.html'); if (!u.pathname.startsWith('/s/') || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('{}'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port;
const kill = setTimeout(() => { console.log('  ❌ 400초 넘음'); process.exit(1); }, 400000);
const PX = process.env.HTTPS_PROXY || process.env.https_proxy; const br = await chromium.launch({ args: ['--disable-gpu', '--no-sandbox', '--proxy-bypass-list=127.0.0.1;localhost'], ...(PX ? { proxy: { server: PX, bypass: '127.0.0.1,localhost' } } : {}) });
const M = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }; const PC = { viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2 };
const newp = async (o, block) => { const ctx = await br.newContext({ ...o, ignoreHTTPSErrors: true }); const p = await ctx.newPage(); const errs = []; const net = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => { errs.push('창 ' + d.message()); d.dismiss().catch(() => {}); });
  await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => { const u = r.request().url(); if (!block && /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net\/gh\/orioncactus/.test(u)) return r.continue(); return r.abort(); });
  p.on('response', async (rs) => { const u = rs.url(); if (!/fonts\.(googleapis|gstatic)\.com|orioncactus/.test(u)) return; try { const b = await rs.body(); net.push([u, b.length]); } catch (e) {} });
  await p.addInitScript((u) => { window.BQ_API = u; try { if (!sessionStorage.getItem('__t')) { localStorage.clear(); sessionStorage.setItem('__t', '1'); } } catch (e) {} }, base); return { ctx, p, errs, net }; };
const go = async (p, h, sel) => { await p.goto(base + '/s/index.html' + h); if (sel) await p.waitForSelector(sel, { timeout: 15000 }); await p.waitForTimeout(500); };
const ffOf = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).fontFamily : null; }, sel);
const kb = (L) => Math.round(L.reduce((a, [, n]) => a + n, 0) / 102.4) / 10;
let netOk = false;
try {
  for (const [nm, O] of [['m390', M], ['pc1280', PC]]) { const { ctx, p, errs, net } = await newp(O, false);
    await go(p, '#/', '.hero h1'); await p.waitForTimeout(1500);
    const H = await p.evaluate(async () => { await document.fonts.ready; return { h1: getComputedStyle(document.querySelector('.hero h1')).fontFamily, sub: getComputedStyle(document.querySelector('.hero > div > p')).fontFamily, body: getComputedStyle(document.body).fontFamily, btn: getComputedStyle(document.querySelector('.hero .btn') || document.body).fontFamily, link: [...document.querySelectorAll('link[data-bqf]')].map((l) => l.dataset.bqf), loaded: document.fonts.check('20px "Gowun Dodum"', '한 권') }; });
    netOk = netOk || H.loaded; const homeKB = kb(net);
    ok(/^"?Gowun Dodum/.test(H.h1) && /^"?Gowun Dodum/.test(H.sub) && !/Gowun/.test(H.body) && !/Gowun/.test(H.btn) && H.link.join() === 'gowun', `${nm} 첫 화면: 큰 띠(우리 소개·홍보 글) = 고운돋움 · 본문·단추는 기기 기본 그대로 · 글꼴 받기 ${H.loaded ? '됨' : '못 함(망 막힘)'} · 받은 양 ${homeKB}KB`, H);
    await p.screenshot({ path: path.join(SHOT, nm + '_home.png') });
    net.length = 0; await go(p, '#/b/X0', '.bkinfo'); await p.waitForSelector('.bqa-rv', { timeout: 15000 }); await p.evaluate(() => document.querySelectorAll('.bkinfo details').forEach((d) => (d.open = true))); await p.waitForTimeout(1200);
    const D = await p.evaluate(async () => { await document.fonts.ready; const f = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).fontFamily : null; }; const sec = {}; document.querySelectorAll('.bkinfo .bki').forEach((d) => { sec[d.querySelector('summary').textContent.trim()] = getComputedStyle(d.querySelector('.bkt')).fontFamily; });
      return { sec, s100: f('.bqa-rv .s100'), tx: f('.bqa-rv .tx'), reply: f('.bqa-reply p'), q: f('.bqa-q > p'), price: f('.price b'), h1: f('.det h1'), buy: f('.det .buy .btn'), nick: f('.bqa-rv header .nk'), wide: document.documentElement.scrollWidth - innerWidth }; });
    const voiceSec = ['책소개', '책 속으로', '출판사 서평', '출판사 소개', '추천평']; const G = (v) => /^"?Gowun Dodum/.test(v || '');
    ok(voiceSec.every((k) => G(D.sec[k])) && !G(D.sec['목차']) && G(D.s100) && G(D.tx) && G(D.reply) && G(D.q) && !G(D.price) && !G(D.h1) && !G(D.buy) && !G(D.nick) && D.wide <= 1, `${nm} 책 한 권: 책소개·책 속으로·출판사 서평·출판사 소개·추천평·리뷰 한 줄 평·리뷰 글·🏪 가게 답글·밑줄 문장 = 고운돋움 · 목차·값·책 제목·단추·별명은 그대로 · 가로 넘침 0 · 받은 양 ${kb(net)}KB(화면에 쓰인 글자 조각만)`, D);
    await p.evaluate(() => document.querySelector('.bkinfo').scrollIntoView()); await p.waitForTimeout(300); await p.screenshot({ path: path.join(SHOT, nm + '_item_info.png') });
    await p.evaluate(() => document.querySelector('#bqa').scrollIntoView()); await p.waitForTimeout(300); await p.screenshot({ path: path.join(SHOT, nm + '_item_reviews.png') });
    const I = await p.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<div class="bqa-form" id="__f"><textarea id="bqaBd">손님A가 쓰는 리뷰</textarea><input id="__o" value="다른 칸"></div>'); const f = (s) => getComputedStyle(document.querySelector(s)).fontFamily; const o = { bd: f('#bqaBd'), other: f('#__o') }; document.getElementById('__f').remove(); return o; });
    ok(G(I.bd) && !G(I.other), `${nm} 손님이 쓰는 칸(리뷰 쓰기 등) = 고운돋움 · 다른 입력칸은 그대로`, I);
    ok(!errs.length, `${nm} 화면 오류 0 · 브라우저 창 0`, errs); await ctx.close(); }

  /* 글꼴을 못 받을 때 — 구글·jsdelivr 막음 → 글자는 기기 글꼴로 바로 보임 */
  { const { ctx, p, errs } = await newp(M, true); const t0 = Date.now(); await go(p, '#/b/X0', '.bkinfo'); await p.waitForSelector('.bqa-rv', { timeout: 15000 }); await p.waitForTimeout(800);
    const F = await p.evaluate(() => { const e = document.querySelector('.bkinfo .bki .bkt'); const r = e.getBoundingClientRect(); const s = document.querySelector('.bqa-rv .s100').getBoundingClientRect(); return { ff: getComputedStyle(e).fontFamily, w: r.width, h: r.height, sw: s.width, check: [...document.fonts].some((f) => /Gowun/.test(f.family) && f.status === 'loaded'), link: document.querySelectorAll('link[data-bqf]').length, vis: getComputedStyle(e).visibility }; });
    ok(F.w > 50 && F.h > 10 && F.sw > 20 && F.vis === 'visible' && !F.check && /var|Pretendard|sans-serif|system-ui/.test(F.ff) && !errs.length, `글꼴을 못 받는 기기(구글 막음): 책소개·리뷰 글이 기기 글꼴로 바로 보임(글자 안 보임 0) · 화면 오류 0 · 걸린 시간 ${Date.now() - t0}ms`, F);
    await p.screenshot({ path: path.join(SHOT, 'm390_item_fontblocked.png') }); await ctx.close(); }

  /* 옛 판 v0 — 글꼴을 받지 않음 · 모양 그대로 */
  LOOKCFG = { fontSet: 'v0' };
  { const { ctx, p, errs, net } = await newp(M, false); await go(p, '#/b/X0', '.bkinfo'); await p.waitForSelector('.bqa-rv', { timeout: 15000 }); await p.waitForTimeout(1200);
    const V = await p.evaluate(() => ({ s100: getComputedStyle(document.querySelector('.bqa-rv .s100')).fontFamily, link: document.querySelectorAll('link[data-bqf]').length })); ok(!/Gowun/.test(V.s100) && !V.link && !net.length && !errs.length, '옛 판 v0: 리뷰도 기기 기본 · 글꼴 받기 0 · 받은 양 0KB(11/14 전 그대로)', V); await ctx.close(); }

  /* 역할마다 다른 글꼴 — 설정값을 따름 */
  LOOKCFG = { fVoice: 'nanumpen', fHead: 'notoserif', fNum: 'plex', fUi: 'noto' };
  { const { ctx, p, errs, net } = await newp(PC, false); await go(p, '#/b/X0', '.bkinfo'); await p.waitForSelector('.bqa-rv', { timeout: 15000 }); await p.waitForTimeout(2000);
    const R = await p.evaluate(async () => { await document.fonts.ready; const f = (s) => getComputedStyle(document.querySelector(s)).fontFamily; return { voice: f('.bqa-rv .s100'), head: f('.det h1'), num: f('.price b'), ui: f('.det .buy .btn'), body: f('.bkinfo .bki.toc .bkt'), links: [...document.querySelectorAll('link[data-bqf]')].map((l) => l.dataset.bqf).sort().join() }; });
    ok(/^"?Nanum Pen Script/.test(R.voice) && /^"?Noto Serif KR/.test(R.head) && /^"?IBM Plex Sans KR/.test(R.num) && /^"?Noto Sans KR/.test(R.ui) && /^"?Pretendard Variable/.test(R.body) && R.links === 'nanumpen,noto,notoserif,plex' && !errs.length, `설정에서 역할마다 고르면 그대로: ① 나눔손글씨 펜 · ③ 본명조 · ④ IBM Plex · ⑤ 본고딕 · ② 기기 기본 · 받은 양 ${kb(net)}KB`, R);
    await p.screenshot({ path: path.join(SHOT, 'pc1280_item_roles_custom.png') }); await ctx.close(); }
  LOOKCFG = {};
} catch (e) { bad++; console.log('  ❌ 화면 시험 멈춤', e.stack); }
clearTimeout(kill); await br.close(); srv.close();
console.log(bad ? `❌ tSHOPFONT1_1114 ${bad}개 실패` : `✓ tSHOPFONT1_1114 통과${netOk ? '' : ' (글꼴 받기 망이 막혀 「받음」은 못 봄)'}`); process.exit(bad ? 1 : 0);
})();

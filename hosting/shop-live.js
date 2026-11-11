#!/usr/bin/env node
/* 🛍 우리숍 실제 배포본 점검 (11/11 shop4) — booksqueen.web.app(또는 LIVE_BASE)을 진짜 브라우저로 처음부터 끝까지 둘러봄
 *  쓰임: LIVE_BASE=https://booksqueen.web.app LIVE_OUT=live node hosting/shop-live.js   (playwright 필요 · GitHub Actions '우리숍 실제 점검'이 돌림)
 *  · 휴대폰(390×844)·PC(1280×900) 둘 다 — 첫 화면 · 목록 · 분야 · 책 상세 · /b/<상품> · sitemap · robots · 장바구니 · 주문서 · 주문 뒤 화면
 *  · 🧪 주문은 시험 모드: 가게 설정(/shop/cfg)을 브라우저 안에서만 '문 엶'으로 바꿔 보이고, 주문 넣기(POST)·주문 조회는 가짜 답 — 클라우드에 주문이 하나도 안 생김
 *    (POST /shop/* 는 모두 브라우저에서 끊음 · 시험 손님 = 손님A · 010-0000-0000)
 *  · 쪽마다: HTTP 상태 · 화면 오류 · 깨진 사진 · 옆 넘침 · 걸린 시간 → LIVE_OUT/report.json · report.md · 사진 *.png
 *  · 끝 코드: 깨진 곳이 있으면 1(작업 요약에 ❌) */
'use strict';
const fs = require('fs'), path = require('path');
const BASE = (process.env.LIVE_BASE || 'https://booksqueen.web.app').replace(/\/+$/, '');
const OUT = path.resolve(process.env.LIVE_OUT || 'live'); fs.mkdirSync(OUT, { recursive: true });
const VPS = { phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, pc: { viewport: { width: 1280, height: 900 } } };
const R = { base: BASE, at: new Date().toISOString(), http: [], pages: [], bad: [] };
const bad = (m) => { R.bad.push(m); console.log('  ❌ ' + m); };

async function httpRows() {
  const one = async (u, want) => { const t0 = Date.now(); try { const r = await fetch(u, { redirect: 'manual' }); const b = await r.text(); const row = { u, st: r.status, ms: Date.now() - t0, len: b.length, ct: r.headers.get('content-type') || '', loc: r.headers.get('location') || '' }; R.http.push(row); if (want && !want(row, b)) bad(`HTTP ${u} → ${r.status}`); return { row, b }; } catch (e) { R.http.push({ u, st: 0, err: e.message }); if (want) bad(`HTTP ${u} 못 엶: ${e.message}`); return { row: null, b: '' }; } };
  await one(BASE + '/', (r, b) => r.st === 200 && /북스퀸/.test(b));
  await one(BASE + '/hosting-stamp.json', (r) => r.st === 200);
  await one(BASE + '/robots.txt', (r, b) => r.st === 200 && /Sitemap:/i.test(b));
  const sm = await one(BASE + '/sitemap.xml', (r, b) => r.st === 200 && /<(urlset|sitemapindex)/.test(b));
  const locs = [...String(sm.b).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]); R.sitemapN = locs.length;
  const bLoc = locs.find((u) => /\/b\//.test(u)); R.sampleB = bLoc || null;
  if (bLoc) await one(BASE + new URL(bLoc).pathname, (r, b) => r.st === 200 && /<h1/.test(b)); else bad('sitemap에 /b/ 주소가 없음');
  await one(BASE + '/b/없는상품번호', (r) => r.st === 404 || r.st === 410);
  /* 사용자 지정 도메인 — DNS가 아직 안 바뀌었으면 실패가 당연(기록만) */
  for (const u of ['https://booksqueen.com/', 'http://booksqueen.com/', 'https://www.booksqueen.com/']) await one(u, null);
}

async function run(kind, browser) {
  const ctx = await browser.newContext({ ...VPS[kind], locale: 'ko-KR' }); const p = await ctx.newPage();
  const errs = [], dlg = [], fails = []; let orderPosts = 0;
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('콘솔 ' + m.text().slice(0, 200)); });
  p.on('dialog', (d) => { dlg.push(d.message()); d.dismiss().catch(() => {}); });
  p.on('requestfailed', (q) => fails.push(q.url().slice(0, 160) + ' ' + ((q.failure() || {}).errorText || '')));
  p.on('response', (r) => { if (r.status() >= 400 && !/\/b\/없는/.test(r.url())) fails.push(r.status() + ' ' + r.url().slice(0, 160)); });
  /* 🧪 시험 모드 — 가게 설정만 브라우저 안에서 '문 엶' · 주문 POST/조회는 가짜 */
  let fakeNo = null;
  await p.route('**/shop/**', async (rt) => { const q = rt.request(); const u = new URL(q.url());
    if (q.method() !== 'GET' && q.method() !== 'OPTIONS') { if (/\/shop\/order$/.test(u.pathname)) { orderPosts++; const b = JSON.parse(q.postData() || '{}'); fakeNo = 'BQTEST-' + kind.toUpperCase(); return rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, no: fakeNo, t: 'test', total: 0, items: (b.items || []).map((id) => ({ id })) }) }); } return rt.fulfill({ status: 403, contentType: 'application/json', body: '{"ok":false,"err":"시험 모드"}' }); }
    if (u.pathname === '/shop/cfg') { const r = await rt.fetch(); let j = {}; try { j = await r.json(); } catch (e) {} R.cfg = R.cfg || { open: j.open, n: j.n, cats: (j.cats || []).length, pay: j.pay && j.pay.how }; j.open = 1; j.pay = j.pay && j.pay.how === 'bank' ? j.pay : { how: 'bank' }; return rt.fulfill({ response: r, json: j }); }
    if (u.pathname === '/shop/order' && fakeNo) return rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, no: fakeNo, at: new Date().toISOString(), st: 'new', stTxt: '입금 기다림(시험)', due: new Date(Date.now() + 2 * 864e5).toISOString(), total: 0, sum: 0, shipFee: 0, pay: { how: 'bank', bank: '시험은행', acct: '000-000', holder: '가게' }, name: '손*A', dep: '손*A', items: [] }) });
    return rt.continue(); });
  const shot = async (name) => { const f = `${kind}_${name}.png`; await p.screenshot({ path: path.join(OUT, f), fullPage: name !== 'order' }); return f; };
  const check = async (name, sel, extra) => { const t0 = Date.now(); let okSel = true; try { await p.waitForSelector(sel, { timeout: 15000 }); } catch (e) { okSel = false; } await p.waitForTimeout(600);
    const info = await p.evaluate(() => ({ title: document.title, over: document.documentElement.scrollWidth - window.innerWidth, broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith('data:')).map((i) => i.src.slice(0, 120)), err: (document.querySelector('.err') || {}).textContent || '' }));
    const row = { kind, name, url: p.url().replace(BASE, ''), ok: okSel, ms: Date.now() - t0, ...info, shot: await shot(name), ...(extra ? await extra() : {}) }; R.pages.push(row);
    if (!okSel) bad(`${kind} ${name}: '${sel}' 안 보임 ${info.err.slice(0, 80)}`); if (info.over > 1) bad(`${kind} ${name}: 옆으로 ${info.over}px 넘침`); if (info.broken.length) bad(`${kind} ${name}: 깨진 사진 ${info.broken.length}장 (${info.broken[0]})`);
    console.log(`  ${okSel ? '✓' : '✗'} ${kind} ${name} ${row.ms}ms`); return row; };
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await check('home', '#hc .grid .card, #hc .empty', async () => ({ cards: await p.locator('#hc .card').count(), chips: await p.locator('#hc .chip').count(), foot: ((await p.textContent('#foot')) || '').slice(0, 200) }));
  await p.evaluate(() => { location.hash = '#/list?s=new'; }); await check('list', '#lg .grid .card, #lg .empty', async () => ({ head: ((await p.textContent('#lh')) || '').trim() }));
  const chip = await p.evaluate(() => { const a = document.querySelector('#hc .chip'); return a ? a.getAttribute('href') : null; });
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('#hc .chip, #hc .empty, #hc .grid', { timeout: 15000 }).catch(() => {});
  const chip2 = chip || (await p.evaluate(() => { const a = document.querySelector('#hc .chip'); return a ? a.getAttribute('href') : null; }));
  if (chip2) { await p.evaluate((h) => { location.hash = h; }, chip2); await check('category', '#lg .grid .card, #lg .empty'); }
  await p.evaluate(() => { location.hash = '#/list?s=new'; }); await p.waitForSelector('#lg .grid .card', { timeout: 15000 }).catch(() => {});
  const first = await p.evaluate(() => { const a = [...document.querySelectorAll('#lg .card')].find((x) => !x.classList.contains('held')); return a ? a.getAttribute('href') : null; });
  if (!first) { bad(`${kind}: 목록에 주문할 수 있는 책이 없음`); } else {
    await p.evaluate((h) => { location.hash = h; }, first); await check('item', '.det .info h1', async () => ({ price: ((await p.textContent('.price').catch(() => '')) || '').trim(), pics: await p.locator('#gal img').count() }));
    const add = p.locator('#add'); if (await add.count()) { await add.click(); await p.waitForTimeout(500); } else bad(`${kind} item: '장바구니' 단추 없음(시험 모드인데도 닫힘)`);
    await p.evaluate(() => { location.hash = '#/cart'; }); await check('cart', '.rows .row, .empty', async () => ({ rows: await p.locator('.rows .row').count(), total: ((await p.textContent('.sum .tot').catch(() => '')) || '').trim() }));
    await p.evaluate(() => { location.hash = '#/order'; }); await check('order_empty', '#of'); await p.click('#go'); await p.waitForTimeout(400);
    const marks = await p.locator('[data-f].bad').count(); if (marks < 4) bad(`${kind} 주문서: 빈 칸 알림 ${marks}개(4개 넘게 기대)`); await shot('order_marks');
    await p.fill('#f_name', '손님A'); await p.fill('#f_phone', '01000000000'); await p.fill('#f_zip', '06000'); await p.fill('#f_addr1', '서울 어딘가 1길 1'); await p.check('#f_agreeP'); await p.check('#f_agreeT'); await shot('order');
    await p.click('#go'); await check('done', '.done .bank, .done', async () => ({ text: ((await p.textContent('#main')) || '').replace(/\s+/g, ' ').slice(0, 160) }));
    if (orderPosts !== 1) bad(`${kind}: 시험 주문 POST ${orderPosts}번(1번 기대)`);
  }
  if (R.sampleB) { await p.goto(BASE + new URL(R.sampleB).pathname, { waitUntil: 'domcontentloaded' }); await check('b_page', 'h1'); }
  await p.goto(BASE + '/#/p/privacy', { waitUntil: 'domcontentloaded' }); await check('privacy', '.doc h1');
  if (errs.length) bad(`${kind}: 화면 오류 ${errs.length}개 — ${errs[0].slice(0, 160)}`); if (dlg.length) bad(`${kind}: 브라우저 창 ${dlg.length}번`);
  R[kind] = { errs: errs.slice(0, 20), fails: [...new Set(fails)].slice(0, 30), orderPosts }; await ctx.close();
}

function md() { const L = [`### 🛍 우리숍 실제 점검 — ${BASE} · ${R.at}`, '', R.bad.length ? `**❌ 깨진 곳 ${R.bad.length}**` : '**✅ 깨진 곳 없음**', ...R.bad.map((x) => '- ' + x), '',
  `가게 설정(진짜): 문 ${R.cfg ? (R.cfg.open ? '열림' : '닫힘') : '?'} · 판매 ${R.cfg && R.cfg.n != null ? R.cfg.n : '?'}권 · 분야 ${R.cfg ? R.cfg.cats : '?'} · 결제 ${R.cfg ? R.cfg.pay || '준비 중' : '?'} · sitemap 주소 ${R.sitemapN != null ? R.sitemapN : '?'}개`, '',
  '| 주소 | HTTP | ms |', '|---|---|---|', ...R.http.map((h) => `| ${h.u} | ${h.st || '✗ ' + (h.err || '').slice(0, 60)}${h.loc ? ' → ' + h.loc : ''} | ${h.ms || ''} |`), '',
  '| 기기 | 화면 | 됨 | ms | 넘침 | 깨진 사진 | 사진 |', '|---|---|---|---|---|---|---|', ...R.pages.map((x) => `| ${x.kind} | ${x.name} | ${x.ok ? '✓' : '✗'} | ${x.ms} | ${x.over > 1 ? x.over + 'px' : '0'} | ${x.broken.length} | ${x.shot} |`)];
  return L.join('\n'); }

(async () => {
  console.log('🌐 HTTP'); await httpRows();
  const { chromium } = require('playwright'); const b = await chromium.launch();
  for (const k of ['phone', 'pc']) { console.log('📱 ' + k); try { await run(k, b); } catch (e) { bad(`${k} 멈춤: ${e.message.slice(0, 200)}`); } }
  await b.close(); fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(R, null, 1)); const text = md(); fs.writeFileSync(path.join(OUT, 'report.md'), text); console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + '\n');
  process.exit(R.bad.length ? 1 : 0);
})().catch((e) => { console.log('❌ 멈춤', e); process.exit(1); });

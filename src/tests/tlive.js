// ⚡ 빠른 업데이트 본체 시험 — Tampermonkey처럼 @require 파일과 본체를 한 함수 안에서 차례로 돌림
// (kfail2 11/17) 옛 작업 자리(/home/claude/…) 대신 pcbuild.js가 저장소 원본을 split.js로 나눈 결과(본체·모듈·pc-live-head.txt)·Firebase compat 파일을 찾아 줌
const PB = require('./pcbuild.js'); const { chromium } = PB.playwright(); const fs = require('fs');
const O = PB.build(), REPO = PB.ROOT, FB = PB.fbDir();
const main = fs.readFileSync(O + 'readnow-collector.user.js', 'utf8'); const hEnd = main.indexOf('// ==/UserScript==');
const reqs = [...main.slice(0, hEnd).matchAll(/\/\/ @require\s+(\S+)/g)].map((m) => m[1]);
// (kfail2 11/17) 11/10 big1-head부터 @require·pc-live.json 주소가 readnow.kr(새 주소 · split.js RAW) — 옛 raw.githubusercontent.com/…/readnow-scripts/refs/heads/main/ 꼴만 찾던 이 시험은 우리 파일을 하나도 못 이어 붙여(모듈 줄 __rnModQ가 비어) 'run is not iterable'로 죽었음 → 두 꼴 다 받음
const OURS = /(?:readnow\.kr|readnow-scripts\/refs\/heads\/main)\/([\w.-]+\.js)/;
const src = (u) => { const m = u.match(OURS); if (m) return fs.readFileSync(fs.existsSync(O + m[1]) ? O + m[1] : REPO + m[1], 'utf8'); const f = u.split('/').pop(); if (/firebase/.test(f)) return fs.readFileSync(FB + f, 'utf8'); return 'window.XLSX = {};'; };
const body = main.slice(hEnd);
const all = reqs.map(src).join('\n;\n') + '\n' + body;
const shim = `const _k=(k)=>'gm:'+k; var GM_info={script:{version:'${(main.match(/@version\s+([\d.]+)/)||[])[1]}'}}; var GM_getValue=(k,d)=>{const v=localStorage.getItem(_k(k));return v==null?d:JSON.parse(v)}; var GM_setValue=(k,v)=>localStorage.setItem(_k(k),JSON.stringify(v)); var GM_deleteValue=(k)=>localStorage.removeItem(_k(k)); var GM_listValues=()=>[]; var GM_addValueChangeListener=()=>{}; var GM_openInTab=()=>({close(){}}); var GM_notification=()=>{}; var GM_xmlhttpRequest=()=>{}; var unsafeWindow=window;`;
const html = `<html><head></head><body><div>알라딘 판매관리 (가짜)</div></body></html>`;
// (kfail2 11/17) 모듈 판 표시(split.js stamp)는 { runtime|crm|products|ship|helper|boot: '판' } 꼴 — 예전엔 runtime만 바꿔 받아 둔 판에서 다른 모듈은 옛 판으로 보였음(빨간 띠 '모듈 판이 맞지 않음'의 거짓 원인)
const bump = (code, v0, v1) => code.split(`'${v0}', function ()`).join(`'${v1}', function ()`).replace(new RegExp(`\\{ (\\w+): '${v0.replace(/\./g, '\\.')}' \\}`, 'g'), (_, k) => `{ ${k}: '${v1}' }`);
(async () => { const br = await chromium.launch(); const V0 = (main.match(/@version\s+([\d.]+)/) || [])[1]; const V1 = V0.replace(/\d+$/, (n) => +n + 5); const R = {};
  const liveFiles = reqs.filter((u) => OURS.test(u)).map((u) => [u.match(OURS)[1], src(u)]) /* pc-live.json의 files와 같은 묶음(src/release.js — 본체 @require의 우리 파일 전부) */;
  const liveCode = liveFiles.map(([f, t]) => '\n;' + bump(t, V0, V1) + '\n').join('');
  const hsig = fs.readFileSync(O + 'pc-live-head.txt', 'utf8').split('\n')[0].trim();
  const run = async (name, prep, arg, route, after) => { const ctx = await br.newContext(); const errs = [];
    await ctx.route('https://www.aladin.co.kr/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: html }));
    for (const h of ['https://readnow.kr/**', 'https://raw.githubusercontent.com/**']) await ctx.route(h, (r) => route ? route(r) : r.fulfill({ status: 404, body: '' })); /* (kfail2) 새 주소 readnow.kr 먼저 · 옛 주소는 거들기 — 진짜 사이트에 닿지 않게 둘 다 가로챔 */
    await ctx.route(/googleapis\.com|gstatic\.com|firebaseio\.com|cloudfunctions|run\.app/, (r) => r.abort('internetdisconnected'));
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && /리드나우/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    await p.goto('https://www.aladin.co.kr/scm/worders.aspx'); if (prep) await p.evaluate(prep, arg);
    await p.evaluate(({ shim, all }) => { try { (new Function(shim + '\n' + all))(); } catch (e) { window.__bootErr = e.message; } }, { shim, all });
    await p.waitForTimeout(3000); if (after) await after(p);
    const out = await p.evaluate(() => ({ used: globalThis.__rnLiveUsed, ver: globalThis.__rnLiveVer, fv: globalThis.__RN_FILE_VER || null, mods: globalThis.ReadnowPcMods, who: (document.querySelector('#rnCtlWho') || {}).textContent || null, bad: localStorage.getItem('gm:rn-live-bad'), boot: window.__bootErr || null, liveErr: globalThis.__rnLiveErr || null, have: (JSON.parse(localStorage.getItem('gm:rn-live') || 'null') || {}).ver || null, info: window.__rnLiveInfo ? window.__rnLiveInfo() : null, outdated: window.__rnOutdated || null, modsOk: window.__rnModsOk, hasCheck: typeof window.__rnLiveCheck === 'function' }));
    out.errs = errs.slice(0, 5); R[name] = out; await ctx.close(); };
  const setLive = ({ code, ver, hsig }) => localStorage.setItem('gm:rn-live', JSON.stringify({ ver, hsig, code, at: Date.now() }));
  await run('classic');
  await run('live', setLive, { code: liveCode, ver: V1, hsig });
  await run('liveBadSyntax', setLive, { code: liveCode + '\n;}}}(', ver: V1, hsig });
  await run('liveWrongHead', setLive, { code: liveCode, ver: V1, hsig: 'xxxx' });
  // GitHub에서 받기: pc-live.json(새 판) + 파일들(지문 맞음)
  const files = liveFiles.map(([f, t]) => { const b = bump(t, V0, V1); return { f, v: '1', sha: require('crypto').createHash('sha256').update(b, 'utf8').digest('hex'), body: b }; });
  const M = { ver: V1, hsig, files: files.map(({ f, v, sha }) => ({ f, v, sha })) };
  const route = (r) => { const u = r.request().url(); if (/pc-live\.json/.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(M), headers: { 'access-control-allow-origin': '*' } }); const f = files.find((x) => u.includes('/' + x.f + '?')); return f ? r.fulfill({ status: 200, contentType: 'text/plain', body: f.body, headers: { 'access-control-allow-origin': '*' } }) : r.fulfill({ status: 404, body: '' }); };
  await run('fetch', null, null, route, async (p) => { await p.evaluate(() => window.__rnLiveCheck()); await p.waitForTimeout(4000); });
  const route2 = (r) => { const u = r.request().url(); if (/pc-live\.json/.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(M), headers: { 'access-control-allow-origin': '*' } }); const f = files.find((x) => u.includes('/' + x.f + '?')); return f ? r.fulfill({ status: 200, contentType: 'text/plain', body: f.body + (f.f === 'readnow-pc-ship.js' ? '//stale' : ''), headers: { 'access-control-allow-origin': '*' } }) : r.fulfill({ status: 404, body: '' }); };
  await run('fetchStale', null, null, route2, async (p) => { await p.evaluate(() => window.__rnLiveCheck()); await p.waitForTimeout(4000); });
  if (process.env.RN_DEBUG) console.log(JSON.stringify(R, null, 1)); await br.close();
  // (kfail2 11/17) 판정 — 예전엔 결과를 찍기만 해 시험 문지기가 통과/실패를 못 가림
  let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
  const MK = ['boot', 'runtime', 'crm', 'products', 'ship', 'helper']; const allV = (o, v) => !!(o && o.mods) && MK.every((k) => o.mods[k] === v);
  const noise = (o, extra) => (o.errs || []).filter((e) => !/client is offline/.test(e) && !(extra && extra.test(e)));
  const c = R.classic, l = R.live, b = R.liveBadSyntax, w = R.liveWrongHead, f = R.fetch, fs2 = R.fetchStale;
  ok(c.used === 'classic' && c.ver === V0 && allV(c, V0) && c.modsOk === true && !c.boot && !c.liveErr && c.hasCheck, `① 받아 둔 판 없음 → 이 판(${V0})으로 · 모듈 6개 같은 판 · 빨간 띠 없음 · 5분 확인 함수 있음`);
  ok(l.used === 'live' && l.ver === V1 && l.fv === V1 && allV(l, V1) && l.modsOk === true && /v/.test(l.who || '') && (l.who || '').includes(V1) && !l.liveErr, `② 받아 둔 새 판(${V1}) → 그 판으로 · 모듈 6개도 ${V1} · 관제판 이름표 ${V1}`);
  ok(b.used === 'classic' && b.ver === V0 && allV(b, V0) && b.modsOk === true && !!b.liveErr && JSON.parse(b.bad || '{}').ver === V1, `③ 받아 둔 판이 깨짐 → 이 판으로 되돌림 · rn-live-bad에 ${V1} 기록 · 모듈 판도 되돌림`);
  ok(w.used === 'classic' && w.ver === V0 && allV(w, V0) && !w.bad && !w.liveErr, '④ 머리 서명이 다른 받아 둔 판 → 쓰지 않음(시작도 안 해 봄)');
  ok(f.have === V1 && f.info && f.info.seen && f.info.seen.ver === V1 && !f.info.err && f.used === 'classic', `⑤ readnow.kr pc-live.json·파일 지문 맞음 → ${V1}을 받아 둠(다음 새로고침에 씀)`);
  ok(!fs2.have && fs2.info && /지문이 다름/.test(fs2.info.err || ''), '⑥ 파일 하나 지문이 다름 → 받아 두지 않음(오류 기록)');
  const nz = [...noise(c), ...noise(l), ...noise(b, /빠른 업데이트 판 시작 실패/), ...noise(w), ...noise(f), ...noise(fs2)];
  ok(nz.length === 0, '⑦ 화면 오류 0(인터넷 없는 자리의 Firestore client is offline만 뺌)' + (nz.length ? ' — ' + nz.slice(0, 3).join(' | ') : ''));
  if (bad) { console.log(`❌ tlive 실패 ${bad}`); process.exit(1); } console.log('✓ tlive 통과'); })().catch((e) => { console.log('❌ tlive 시험 오류: ' + (e && e.message || e)); process.exit(1); });

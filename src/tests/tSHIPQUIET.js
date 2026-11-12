// tSHIPQUIET — 정범님 11/12 오후 '🔕 출고 시간 방해 금지' 토글(기본 꺼짐 · 13:00~15:00 · app_settings/ship_quiet) (shipq1)
//  ① 시간대 판단(sqDecide)이 웹앱·수집기·인쇄 도우미 세 곳에서 글자까지 같고, 꺼짐 → 안 미룸 · 시간대 안/밖 · 끝 시각 · 밤을 넘는 시간대 · 잘못 적은 시각 → 기본
//  ② 가짜 화면(수집기 바탕 모듈 rnShipGuard): 시간대 안 → 새 판·메모리 정리 미룸(기록 한 번) · 메모리 85% 넘으면 안 미룸 · 시간대 끝 → 이어 감 · 실제 출고 중이면 출고 끝까지 기다림 · 웹앱 탭 data-rn-sq로 받음
//  ③ 수집기·도우미 길마다 걸려 있음(원본 글 확인) · 머리(==UserScript==) 그대로 · 도우미 화면에 같은 토글
//  ④ 웹앱(Playwright · RN_PORT 있으면): 출고 화면 토글 → 저장 칸 → ⚙ 설정 칸도 바뀜 · 다른 기기가 바꾸면 이 화면도 · 켜고 시간대 안이면 새 판 미룸 → 끄면 다시 엶
const fs = require('fs'), path = require('path');
const pick = (...L) => L.find((f) => f && fs.existsSync(f));
const s = fs.readFileSync(pick(path.join(__dirname, '..', 'readnow-collector.src.js'), path.join(__dirname, '..', 'readnow-collector.user.js')), 'utf8');
const APPF = pick(path.join(__dirname, '..', 'app.html'), process.env.RN_APP);
const PR = pick(path.join(__dirname, '..', '..', 'local', 'readnow-print.js'), path.join(__dirname, '..', 'local', 'readnow-print.js'));
const AL = pick(path.join(__dirname, '..', '..', 'local', 'readnow-alps.js'), path.join(__dirname, '..', 'local', 'readnow-alps.js'));
const app = APPF ? fs.readFileSync(APPF, 'utf8') : ''; const pr = PR ? fs.readFileSync(PR, 'utf8') : ''; const al = AL ? fs.readFileSync(AL, 'utf8') : '';
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
const cutIn = (t, a, endMark) => { const i = t.indexOf(a); const j = t.indexOf(endMark, i); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a); return t.slice(i, j + endMark.length); };
const KST = (y, mo, d, h, mi) => Date.UTC(y, mo - 1, d, h - 9, mi); const MIN = 60e3;

(async () => {
  // ── ① 판단 ──
  const fSrc = cutIn(s, 'function sqDecide(c, now)', '/* ⟦sqDecide 끝⟧ */').replace(/^\s+/gm, '');
  ok(APPF && fSrc === cutIn(app, 'function sqDecide(c, now)', '/* ⟦sqDecide 끝⟧ */').replace(/^\s+/gm, ''), '① 웹앱 sqDecide = 수집기 sqDecide(글자까지 같음)');
  ok(PR && fSrc === cutIn(pr, 'function sqDecide(c, now)', '/* ⟦sqDecide 끝⟧ */').replace(/^\s+/gm, ''), '① 인쇄 도우미 sqDecide = 수집기 sqDecide');
  const sqDecide = new Function(fSrc + '; return sqDecide;')();
  const T = KST(2026, 11, 12, 13, 30);
  ok(!sqDecide(null, T).on && !sqDecide({ on: false, from: '13:00', to: '15:00' }, T).on, '① 꺼짐(또는 칸 없음) → 시간대 안이어도 미루지 않음(기본 꺼짐)');
  { const d = sqDecide({ on: true }, T); ok(d.on && d.from === '13:00' && d.to === '15:00' && d.until === KST(2026, 11, 12, 15, 0), '① 켬 + 13:30(한국) → 미룸 · 기본 13:00~15:00 · 15:00까지'); }
  ok(sqDecide({ on: true }, KST(2026, 11, 12, 13, 0)).on && !sqDecide({ on: true }, KST(2026, 11, 12, 15, 0)).on && !sqDecide({ on: true }, KST(2026, 11, 12, 12, 59)).on, '① 13:00 정각은 안 · 15:00 정각은 밖 · 12:59는 밖');
  { const d = sqDecide({ on: true, from: '22:00', to: '02:00' }, KST(2026, 11, 12, 23, 10)); const e = sqDecide({ on: true, from: '22:00', to: '02:00' }, KST(2026, 11, 13, 1, 0)); ok(d.on && d.until === KST(2026, 11, 13, 2, 0) && e.on && e.until === KST(2026, 11, 13, 2, 0) && !sqDecide({ on: true, from: '22:00', to: '02:00' }, KST(2026, 11, 13, 3, 0)).on, '① 밤을 넘는 시간대(22:00~02:00)도 맞게 · 끝은 다음 날 02:00'); }
  { const d = sqDecide({ on: true, from: '25:00', to: 'x' }, T); ok(d.from === '13:00' && d.to === '15:00' && d.on, '① 잘못 적은 시각 → 기본 13:00~15:00'); ok(!sqDecide({ on: true, from: '14:00', to: '14:00' }, T).on, '① 시작=끝 → 미루지 않음'); ok(sqDecide({ on: true, from: '9:05', to: '9:30' }, KST(2026, 11, 12, 9, 10)).from === '09:05', '① 9:05 꼴도 읽음'); }

  if (APPF) { const bmChipText = new Function(cutIn(app, 'function bmChipText(d)', '/* ⟦bmChipText 끝⟧ */') + '; return bmChipText;')(); const now = new Date().toISOString();
    ok(bmChipText(null) === '' && bmChipText({ mjOpen: 3, ideaJudge: 2, jsTodo: 0, at: now }) === 'MJ 열림 3 · 건의 판단 2' && bmChipText({ at: now }) === '할 일 없음' && /🔕 \(오래됨\)$/.test(bmChipText({ mjOpen: 1, shipQuiet: true, at: '2026-01-01T00:00:00Z' })), '①-2 📋 작업판 요약 칩 글(0은 뺌 · 🔕 · 30분 넘으면 오래됨)'); }
  // ── ② 가짜 화면: 수집기 rnShipGuard ──
  function mkRt(o) { o = o || {}; const GM = { 'rnu-pcname': o.pc || 'JS-MAIN', ...(o.gm || {}) }; const logs = []; const attrs = {}; const clock = { now: o.now || T };
    const FakeDate = class extends Date { static now() { return clock.now; } };
    const W = { __rnLog: (m, lv, x) => logs.push(lv + ' ' + x) }; W.top = W;
    const doc = { documentElement: { getAttribute: (k) => (k in attrs ? attrs[k] : null), setAttribute: (k, v) => { attrs[k] = String(v); } } };
    const i = s.indexOf('(function rnShipGuard()'), j = s.indexOf('/* (정범님 11/09 oom1) 🩺 죽은 수집기 탭 되살리기', i); const src = s.slice(i, j);
    new Function('window', 'GM_getValue', 'GM_setValue', 'location', 'document', 'setInterval', 'setTimeout', 'Date', src)(W, (k, d) => (k in GM ? GM[k] : d), (k, v) => { GM[k] = v; }, { hostname: o.host || 'www.aladin.co.kr' }, doc, () => 0, (f) => { Promise.resolve().then(f); return 0; }, FakeDate);
    return { W, GM, logs, attrs, clock, tick: () => W.__rnShipTick() }; }
  { const R = mkRt(); const W = R.W;
    ok(W.__rnSqWait('verReload', '⚡ 새 수집기 9로 바꾸기') === false, '② 칸이 없으면(기본 꺼짐) 미루지 않음');
    W.__rnSqFeed({ on: true, from: '13:00', to: '15:00', at: '2026-11-12T04:00:00Z' }, 'fs');
    let ran = 0; ok(W.__rnSqWait('reload', '안전한 새로고침(새 버전으로 바꿈)', () => { ran++; }, { reload: true }) === true && W.__rnSqWait('verReload', '⚡ 새 수집기 9로 바꾸기') === true, '② 켬 + 시간대 안 → 새 판 바꾸기·안전한 새로고침 미룸');
    W.__rnSqWait('verReload', '⚡ 새 수집기 9로 바꾸기'); ok(R.logs.filter((x) => /🔕 출고 시간 방해 금지\(13:00~15:00\) — ⚡ 새 수집기 9로 바꾸기 미룸\(15:00 뒤 이어 감\)/.test(x)).length === 1, '② 미룸 기록은 한 번만');
    ok(W.__rnSqWait('memIdle', '메모리 정리(쉬는 때)', null, { mem: true, ratio: 0.6 }) === true && W.__rnSqWait('memRun', '메모리 정리(수집 중)', null, { mem: true, ratio: 0.9 }) === false && R.logs.some((x) => /메모리 90% — 탭이 죽기 전에/.test(x)), '② 메모리 정리: 60%는 미룸 · 85% 넘으면(탭이 죽기 전) 미루지 않음');
    W.__rnSqFeed({ on: true, from: '13:00', to: '15:00', at: '2026-11-12T04:00:00Z', memPct: 95 }, 'fs'); ok(W.__rnSqWait('memRun2', 'x', null, { mem: true, ratio: 0.9 }) === true, '② 메모리 기준은 칸 memPct로 바뀜');
    await R.tick(); ok(ran === 0, '② 시간대 안에서는 이어 가지 않음');
    R.clock.now = KST(2026, 11, 12, 15, 0); ok(W.__rnSqWait('x2', 'x') === false, '② 15:00 → 시간대 밖'); await R.tick(); ok(ran === 1 && R.logs.some((x) => /🔕 출고 시간 방해 금지 끝 — 미룬 \d+가지 이어 감/.test(x)) && W.__rnSqDefN() === 0, '② 시간대 끝 → 미룬 새로고침을 이어 감(한 번)');
    W.__rnSqFeed({ on: false, from: '13:00', to: '15:00', at: '2026-11-12T03:00:00Z' }, 'web'); R.clock.now = T; ok(W.__rnSqOn().on, '② 더 앞선(at) 값은 덮지 않음');
    W.__rnSqFeed({ on: false, from: '13:00', to: '15:00', at: '2026-11-12T04:20:00Z' }, 'fs'); ok(!W.__rnSqOn().on && W.__rnSqWait('verReload', 'x') === false, '② 다른 화면에서 끔 → 바로 미루지 않음'); }
  { const R = mkRt(); const W = R.W; W.__rnSqFeed({ on: true, at: '2026-11-12T04:00:00Z' }, 'fs'); let ran = 0; W.__rnSqWait('reload', '안전한 새로고침(새 버전으로 바꿈)', () => { ran++; }, { reload: true });
    W.__rnShipLocal('cmd_1', '출고 맡긴 일'); R.clock.now = KST(2026, 11, 12, 15, 5); await R.tick(); ok(ran === 0, '② 시간대가 끝나도 실제 출고 중이면 출고 끝까지 기다림');
    W.__rnShipLocal('cmd_1', null, true); await R.tick(); ok(ran === 1, '② 출고도 끝나면 그때 이어 감'); }
  { const R = mkRt({ host: 'readnow.kr' }); R.attrs['data-rn-sq'] = JSON.stringify({ on: true, from: '13:00', to: '15:00', at: '2026-11-12T04:00:00Z' }); await R.tick(); ok(R.W.__rnSqOn().on && R.GM['rn-sq-cfg'] && R.GM['rn-sq-cfg'].src === 'web', '② 웹앱 탭의 data-rn-sq를 이 PC GM(rn-sq-cfg)으로 옮김(알라딘 탭과 나눔)'); }

  // ── ③ 길마다 걸려 있음 ──
  const has = (re, m, t) => ok(re.test(t || s), m);
  has(/C\('app_settings'\)\.doc\('ship_quiet'\)\.onSnapshot/, '③ 수집기가 app_settings/ship_quiet를 직접 들음');
  has(/window\.__rnShipWait\('verReload'[^\n]*window\.__rnSqWait\('verReload'/, '③ ⚡ 새 판 지킴이(새로고침·하던 일 끊기 둘 다 앞)');
  has(/window\.__rnSqWait\('verStep'/, '③ 단계 사이 새 판 바꾸기');
  has(/async function safeReload\(reason, resumeKey\) \{ if \(!\/원격\|멈춘 작업\/\.test\(reason\) && \/새 \(버전\|판\)\|동기화 확인\|메모리 정리\/\.test\(reason\) && window\.__rnSqWait/, '③ 안전한 새로고침(새 판·메모리 정리만 · 사람이 보낸 원격 업데이트·멈춘 작업 다시 열기는 그대로)');
  for (const k of ['memRun', 'memIdle', 'busyMem', 'busyMemGo']) has(new RegExp(`window\\.__rnSqWait\\('${k}'.{0,60}?\\{ mem: true, ratio`), `③ 메모리 정리 ${k}`);
  ok(!/__rnSq|ship_quiet/.test(s.split('// ==/UserScript==')[0]), '③ 수집기 머리(==UserScript==)는 그대로');
  if (PR) { for (const f of ['function selfUpdate() { if (alpsBusy() || updHold())', 'if (alpsBusy() || updHold()) { if (updHold()) log(`ALPS 모듈 새 판', 'if (updHold()) { log(`작업 창 모듈 새 판', 'if (updHold() || BLKS.busy) { setTimeout(blkUpdate']) ok(pr.includes(f), '③ 도우미 스스로 새 판 받기: ' + f.slice(0, 40));
    ok(/const updHold = \(\) => shipHold\(\) \|\| sqHold\(\);/.test(pr) && /SQ_FORCE = Date\.now\(\) \+ 5 \* 60e3;/.test(pr) && /u\.pathname === '\/alps\/quiet'\) return sqApi/.test(pr), '③ 도우미: 출고 중 또는 시간대 · 사람이 누른 지금 새 판 받기는 5분 막지 않음 · /alps/quiet 길'); }
  if (AL) ok(/id="sqo"/.test(al) && /J\('\/alps\/quiet',\{on:\$\('sqo'\)\.checked/.test(al) && /src:'alps'/.test(al), '③ ALPS 도우미 화면에 같은 토글(바꾸면 /alps/quiet · src alps)');
  if (APPF) { ok(/\$\{shipAltBtn\(fn\)\}\$\{sqCtlHtml\('ship'\)\}/.test(app) && /\$\{sqCtlHtml\('set'\)\}/.test(app), '③ 웹앱: ▶ 오늘 출고 끝까지 옆 · ⚙ 설정 ⑫ 출고에 같은 토글');
    ok(/\|\| sgHere\(\)\.on \|\| sqActive\(\)\); \} catch/.test(app) && /sqDefer\('swver'/.test(app), '③ 웹앱 새 판 받기·기기 저장본 다시 열기에 조건 하나 더'); }

  // ── ④ 웹앱(Playwright) ──
  const HP = pick(path.join(__dirname, 'harness.js'), process.env.RN_HARNESS);
  if (!HP || !process.env.RN_PORT) { console.log('… ④ 웹앱 시험은 RN_PORT(+ harness.js)로(건너뜀)'); }
  else { const harness = require(HP); await harness(async (p) => {
    await p.waitForFunction(() => typeof sqCtlHtml === 'function' && typeof S !== 'undefined' && S.sq && S.sq.un, null, { timeout: 20000 }).catch(() => {});
    const nav = []; p.on('framenavigated', (f) => { if (f === p.mainFrame()) nav.push(Date.now()); });
    { const b0 = await p.evaluate(() => ({ btn: !!document.getElementById('hboard'), chip: (document.getElementById('hbmir') || {}).style ? document.getElementById('hbmir').style.display : 'x' })); ok(b0.btn && b0.chip === 'none', '④ 머리줄 📋 작업판 단추 · 요약 문서가 없으면 칩 숨김');
      await p.evaluate(() => { window.__op = []; window.open = (u, n) => { window.__op.push([u, n]); return { focus() {} }; }; db.collection('app_settings').doc('board_mirror').set({ mjOpen: 2, ideaJudge: 1, at: new Date().toISOString() }); }); await p.waitForTimeout(400);
      await p.click('#hboard'); const b1 = await p.evaluate(() => ({ t: document.getElementById('hbmir').textContent, d: document.getElementById('hbmir').style.display, op: window.__op }));
      ok(b1.d === '' && b1.t === 'MJ 열림 2 · 건의 판단 1' && b1.op.length === 1 && /claude\.ai\/artifact\/QSpoAQ2dd2PpGNtwHV9QfN/.test(b1.op[0][0]) && b1.op[0][1] === 'rnboard', '④ board_mirror를 실시간으로 읽어 칩 · 단추는 같은 창(rnboard)으로 엶: ' + JSON.stringify(b1)); }
    await p.evaluate(() => { openShipHome(); }); await p.waitForTimeout(1500);
    const r0 = await p.evaluate(() => ({ box: !!document.querySelector('[data-sqbox="ship"] input[data-sqtog]'), chk: !!(document.querySelector('[data-sqbox="ship"] input[data-sqtog]') || {}).checked, lbl: (document.querySelector('[data-sqbox="ship"]') || {}).innerText || '' }));
    ok(r0.box && !r0.chk && /🔕 출고 시간 방해 금지 13~15/.test(r0.lbl), '④ 출고 화면 ▶ 옆 토글 · 기본 꺼짐 · 13~15: ' + r0.lbl.slice(0, 60));
    await p.click('[data-sqbox="ship"] input[data-sqtog]'); await p.waitForTimeout(800);
    const r1 = await p.evaluate(() => { const d = ((window.__FS || {}).app_settings || {}).ship_quiet || null; return { d: d && JSON.parse(JSON.stringify(d)), set: sqCtlHtml('set'), attr: document.documentElement.getAttribute('data-rn-sq') }; });
    ok(r1.d && r1.d.on === true && r1.d.from === '13:00' && r1.d.to === '15:00' && r1.d.src === 'ship' && r1.d.at && r1.d.by !== undefined, '④ 누르면 app_settings/ship_quiet = { on, from, to, at, by, src }: ' + JSON.stringify(r1.d));
    ok(/data-sqtog="set" checked/.test(r1.set) && /"on":true/.test(r1.attr || ''), '④ ⚙ 설정 칸도 켜짐 · 이 PC 수집기 다리(data-rn-sq)');
    await p.evaluate(() => db.collection('app_settings').doc('ship_quiet').set({ on: false, at: new Date().toISOString(), by: 'other@x', src: 'board' }, { merge: true })); await p.waitForTimeout(600);
    ok(await p.evaluate(() => !(document.querySelector('[data-sqbox="ship"] input[data-sqtog]') || {}).checked && /작업판/.test((document.querySelector('[data-sqbox="ship"]') || {}).innerText || '')), '④ 다른 곳(작업판)이 끄면 이 화면 토글도 바로 꺼짐');
    await p.click('[data-sqbox="ship"] [data-sqed="ship"]'); await p.waitForTimeout(300);
    await p.evaluate(() => { const k = new Date(Date.now() + 9 * 3600e3); const hh = (m) => { m = (m + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }; const m = k.getUTCHours() * 60 + k.getUTCMinutes(); document.getElementById('sq_ship_f').value = hh(m - 2); document.getElementById('sq_ship_t').value = hh(m + 60); });
    await p.click('[data-sqsave="ship"]'); await p.waitForTimeout(400); await p.click('[data-sqbox="ship"] input[data-sqtog]'); await p.waitForTimeout(600);
    const r2 = await p.evaluate(() => ({ act: sqActive(), d: JSON.parse(JSON.stringify(window.__FS.app_settings.ship_quiet)), txt: (document.querySelector('[data-sqbox="ship"]') || {}).innerText || '' }));
    ok(r2.act && r2.d.on && /지금 미루는 중/.test(r2.txt), '④ 시간 고침 ✎ → 지금이 시간대 안 · 켬 → 지금 미루는 중: ' + r2.d.from + '~' + r2.d.to);
    const navB = nav.length; await p.evaluate(() => { autoUpdate('9.99.999'); }); await p.waitForTimeout(6000);
    const r3 = await p.evaluate(() => ({ def: S.sg.def.map((x) => x.k + (x.sq ? ':sq' : '')), bar: (document.querySelector('.verbar.new') || {}).textContent || '' }));
    ok(nav.length === navB && r3.def.includes('newver:sq') && /출고 시간 방해 금지/.test(r3.bar), '④ 켬 + 시간대 안 → 웹앱 새 판으로 다시 열지 않고 미룸: ' + JSON.stringify({ def: r3.def, navB, nav: nav.length, bar: r3.bar.slice(0, 80) }));
    await p.click('[data-sqbox="ship"] input[data-sqtog]'); const d0 = await p.evaluate(() => S.sg.def.length); for (let i = 0; i < 40 && nav.length <= navB; i++) await p.waitForTimeout(1000); /* 출고 화면은 20초 손을 안 대면 바꿈(0.81.5 그대로) */
    ok(nav.length > navB, `④ 끄면 미룬 새 판으로 다시 엶(${nav.length - navB}번 · 꺼짐이면 미루지 않음 · 미룬 것 ${d0})`);
  }, { noFriend: true }); }

  console.log(bad ? `❌ tSHIPQUIET 실패 ${bad}개` : '✓ tSHIPQUIET 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ tSHIPQUIET 오류: ' + (e && e.stack || e)); process.exit(1); });

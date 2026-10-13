// 나눈 수집기(본체 + 모듈)를 Tampermonkey처럼 이어 붙여 가짜 알라딘 화면에서 띄움: 시작 오류 없음 · 관제판·두 패널·모듈 확인
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const OUT = '/home/claude/w/out/'; const R = __dirname + '/repo/'; const FB = __dirname + '/fb/package/';
const PATCH = (fs.readFileSync(__dirname + '/tone.js', 'utf8').match(/body \+= `([^`]*)`/) || [])[1];
const main = fs.readFileSync(OUT + process.argv[2] || 'readnow-collector.user.js', 'utf8');
const reqs = [...main.matchAll(/\/\/ @require\s+(\S+)/g)].map((m) => m[1]);
const load = (u) => { const f = u.split('?')[0].split('/').pop(); if (/gstatic/.test(u)) { let b = fs.readFileSync(FB + f, 'utf8'); if (/storage-compat/.test(f)) b += PATCH; return b; } if (/xlsx/.test(u)) return 'window.XLSX={};'; if (fs.existsSync(OUT + f)) return fs.readFileSync(OUT + f, 'utf8'); if (fs.existsSync(R + f)) return fs.readFileSync(R + f, 'utf8'); throw new Error('없음 ' + f); };
const shim = `window.GM_info = { script: { version: '${(main.match(/@version\s+(\S+)/) || [])[1]}' } }; const _k = (k) => 'gm:' + k;
window.GM_getValue = (k, d) => { const v = localStorage.getItem(_k(k)); return v == null ? d : JSON.parse(v); }; window.GM_setValue = (k, v) => localStorage.setItem(_k(k), JSON.stringify(v)); window.GM_deleteValue = (k) => localStorage.removeItem(_k(k));
window.GM_listValues = () => Object.keys(localStorage).filter((x) => x.startsWith('gm:')).map((x) => x.slice(3)); window.GM_addValueChangeListener = (key, fn) => addEventListener('storage', (e) => { if (e.key === _k(key)) fn(key, e.oldValue && JSON.parse(e.oldValue), e.newValue && JSON.parse(e.newValue), true); });
window.GM_xmlhttpRequest = () => {}; window.GM_notification = () => {}; window.GM_openInTab = () => ({ close() {} }); localStorage.setItem('gm:rnu-pcname', JSON.stringify('TEST-PC'));`;
const code = reqs.map(load).join('\n;\n') + '\n;\n' + main;
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1300, height: 950 } }); const errs = []; p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + (/JSON/.test(e.message) ? ' @ ' + String(e.stack).slice(0, 600) : ''))); p.on('console', (m) => { if (m.type() === 'error' && !/Firestore|firestore|net::|Failed to load/.test(m.text())) errs.push('CONSOLE ' + m.text().slice(0, 160)); });
  await p.route('**/*', (rt) => { const u = rt.request().url(); if (/aladin\.co\.kr\/scm\/worder_preparatory_complete/.test(u)) return rt.fulfill({ contentType: 'text/html; charset=utf-8', body: '<html><head><title>샵매니저</title></head><body><a href="/wC2Cuser_logout.aspx">로그아웃</a><div style="height:1500px">가짜 판매관리</div></body></html>' }); return rt.fulfill({ status: 404, body: '' }); });
  await p.goto('https://www.aladin.co.kr/scm/worder_preparatory_complete.aspx'); await p.evaluate(shim);
  await p.addScriptTag({ content: '(function(){' + code + '\n})();' }).catch((e) => errs.push('ADD ' + e.message.slice(0, 200)));
  await p.waitForTimeout(6000);
  const st = await p.evaluate(() => ({ mods: window.__rnMods, ok: window.__rnModsOk, ctl: !!document.querySelector('#rn-ctl'), crmIn: !!document.querySelector('#rn-ctl #rn-crm'), prdIn: !!document.querySelector('#rn-ctl #rnp'), badge: (document.querySelector('#rnCtlBadge') || {}).textContent, aladin: !!window.ReadnowAladin, red: [...document.querySelectorAll('div')].some((d) => /모듈 판이 맞지 않음/.test(d.textContent) && d.style.position === 'fixed'), prdApi: Object.keys(window.__rnPrd || {}).join(','), crmApi: Object.keys(window.__rnCrm || {}).length }));
  console.log(JSON.stringify(st, null, 1)); await p.click('#rn-uni [data-t="prd"]'); await p.waitForTimeout(500); await p.screenshot({ path: __dirname + '/split_prd.png', clip: { x: 860, y: 0, width: 440, height: 950 } });

  const R = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {};
    // ① 다른 탭에서 모두 일괄 수집 중 (이 탭은 쉬는 중)
    const now = Date.now(); GM_setValue('rnu-live-zzz111', { tab: 'zzz111', page: 'wrecord_edit.aspx', at: now, busy: true, job: '모두 일괄 수집', jobStart: now - 50 * 60000,
      chain: { order: ['crm', 'listings', 'metrics', 'sellers'], labels: { crm: '고객·주문', listings: '신규 등록', metrics: '도서·시장 지표', sellers: '판매자' }, on: { crm: true, listings: true, metrics: true, sellers: true }, res: { crm: 'done', listings: 'done' }, cur: 'metrics' },
      cur: { state: '도서·시장 지표 갱신', done: 1200, total: 4000, etaMin: 35 },
      ph: { prd: { list: [{ l: '기존 상품 기록 읽는 중', at: now - 9 * 60000, ms: 120000 }, { l: '도서·시장 지표 갱신', at: now - 7 * 60000 }] } } });
    window.__rnJournalToggle(); await wait(1500); out.other = document.querySelector('#rnjO').innerText;
    // ② 이 탭에서 고객 '반품' 하나만
    GM_deleteValue('rnu-live-zzz111'); const S = window.__rnStatus; S.job = null;
    window.__rnPhase('crm', '반품 (상태별)', 'returns'); await wait(50); window.__rnPhase('crm', '자동 로그인 중 (1번째)', 'returns'); window.__rnPhase('crm', '반품 주문 상세', 'returns'); S.crm = { active: true, label: '반품 · 반품 주문 상세', done: 30, total: 120 };
    out.crmPh = JSON.stringify(S.ph.crm.list.map((x) => x.l)); out.crmNote = S.ph.crm.note;
    // ③ 감시기 칸 흉내
    const box = document.createElement('div'); box.id = 'rn-prc'; box.innerHTML = '<div class="hd">가격 감시기 <small>v0.10.0 · 수집기와 따로 돎</small></div><div id="pw_state">감시 중 · 그룹 3개</div><div id="pw_prog">판정 12/40 · 다음 확인 10:31</div><div id="pw_log"></div>'; document.body.appendChild(box);
    const add = (t, bad) => { const d = document.createElement('div'); d.textContent = '20:41:0' + t + ' [가격 감시] ' + (bad ? '⚠ ' : '') + 'line ' + t; if (bad) d.style.color = '#B0322A'; document.getElementById('pw_log').prepend(d); };
    add(1); add(2); await wait(1500); add(3, true); await wait(2600);
    document.querySelector('#rn-jw [data-jt="pw"]').click(); await wait(2500); out.pwTop = document.querySelector('#rnjO').innerText; out.pwBody = document.querySelector('#rnjB').innerText;
    out.pwErr = document.querySelectorAll('#rnjB .err').length;
    return out; });
  console.log(JSON.stringify(R, null, 1)); await p.screenshot({ path: __dirname + '/j143_pw.png', clip: { x: 0, y: 450, width: 800, height: 500 } });
  await p.evaluate(async () => { document.querySelector('#rn-jw [data-jt="today"]').click(); const now = Date.now(); GM_setValue('rnu-live-zzz111', { tab: 'zzz111', page: 'wrecord_edit.aspx', at: now, busy: true, job: '모두 일괄 수집', jobStart: now - 50 * 60000,
      chain: { order: ['crm', 'listings', 'metrics', 'sellers'], labels: { crm: '고객·주문', listings: '신규 등록', metrics: '도서·시장 지표', sellers: '판매자' }, on: { crm: true, listings: true, metrics: true, sellers: true }, res: { crm: 'done', listings: 'done' }, cur: 'metrics' },
      cur: { state: '도서·시장 지표 갱신', done: 1200, total: 4000, etaMin: 35 }, ph: { prd: { list: [{ l: '기존 상품 기록 읽는 중', at: now - 9 * 60000, ms: 120000 }, { l: '도서·시장 지표 갱신', at: now - 7 * 60000 }] } } }); await new Promise((r) => setTimeout(r, 1500)); });
  await p.screenshot({ path: __dirname + '/j143_chain.png', clip: { x: 0, y: 450, width: 800, height: 500 } });
  console.log('ERR', errs.slice(0, 8)); await br.close(); })();

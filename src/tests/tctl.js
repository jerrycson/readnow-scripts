const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const s = fs.readFileSync('/home/claude/w/readnow-collector.user.js', 'utf8');
const code = s.slice(s.indexOf('/* (1.38.0) 일시정지 = 이 PC의'), s.indexOf('\n/* ═════════════ 고객·주문 (예전 고객 수집기)'));
const shim = `
window.GM_info = { script: { version: '1.38.0' } };
const _k = (k) => 'gm:' + k;
window.GM_getValue = (k, d) => { const v = localStorage.getItem(_k(k)); return v == null ? d : JSON.parse(v); };
window.GM_setValue = (k, v) => localStorage.setItem(_k(k), JSON.stringify(v));
window.GM_deleteValue = (k) => localStorage.removeItem(_k(k));
window.GM_listValues = () => Object.keys(localStorage).filter((x) => x.startsWith('gm:')).map((x) => x.slice(3));
window.GM_addValueChangeListener = (key, fn) => addEventListener('storage', (e) => { if (e.key === _k(key)) fn(key, e.oldValue && JSON.parse(e.oldValue), e.newValue && JSON.parse(e.newValue), true); });
window.GM_xmlhttpRequest = () => {};
`;
const html = `<html><head></head><body><div style="height:2000px;background:#eef">알라딘 판매관리 (가짜)</div></body></html>`;
(async () => { const br = await chromium.launch(); const ctx = await br.newContext({ viewport: { width: 1200, height: 900 } });
  await ctx.route('https://www.aladin.co.kr/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: html }));
  const errs = [];
  const mk = async (name, busy) => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('dialog', (d) => d.accept());
    await p.goto('https://www.aladin.co.kr/scm/worder_preparatory_complete.aspx');
    await p.evaluate(({ shim, code, busy }) => { eval(shim);
      window.__rnPrdState = { stopped: false, discarded: [] };
      eval(code);
      window.__rnStatus.job = busy ? '모두 일괄 수집' : null; window.__rnStatus.jobKey = busy ? 'chain' : null; window.__rnStatus.jobStart = Date.now() - 3600e3;
      if (busy) { window.__rnStatus.chain = { order: ['crm', 'market', 'usedInfo'], labels: { crm: '고객·주문', market: '도서·시장 지표', usedInfo: '경쟁 매물' }, on: { crm: true, market: true, usedInfo: true }, res: { crm: 'done' }, cur: 'market' }; window.__rnStatus.cur = { state: '도서·시장 지표', done: 1200, total: 5000, etaMin: 95, sub: '어린왕자' }; }
      let RES = busy ? [] : [{ key: 'chain', name: '모두 일괄 수집', by: 'HOME', savedAt: Date.now() - 600e3, stage: '경쟁 매물 유의사항·사진', prog: '1,234 / 3,000' }, { key: 'market', name: '도서 정보·시장 지표', by: 'JS-MAIN', savedAt: Date.now() - 86400e3, stage: null, prog: '10 / 500' }];
      window.__rnPrd = { busy: () => !!window.__rnStatus.job, pause: () => { window.__rnPrdState.stopped = true; }, resumables: () => RES, refreshResume: async () => RES, runningKeys: () => new Set(window.__rnStatus.jobKey ? [window.__rnStatus.jobKey] : []), discard: async (k) => { window.__rnPrdState.discarded.push(k); RES = RES.filter((x) => x.key !== k); return { ok: true }; }, resume: (k) => { window.__rnPrdState.resumed = k; }, startAll: () => { window.__rnPrdState.all = true; }, pcsHtml: () => '<div class="pc">다른 PC에서 진행 중인 작업 없음</div>', who: () => 'Firebase: x@y 로그인됨', outdated: () => null };
      window.__rnCrm = { busy: () => false, pause: () => {}, label: () => '', resumableInfo: async () => null, resume: async () => {}, discard: async () => ({ ok: true }) };
      window.__rnSchedNext = () => ({ known: true, on: true, next: { t: '13:00', label: '묻고 답하기', tomorrow: false } });
      window.__rnLog('상품', 'info', "[일괄 2/3] ▶ 도서·시장 지표 시작"); window.__rnLog('상품', 'detail', '세부'); window.__rnLog('고객', 'warn', '로그인 풀림 — 다시 로그인');
    }, { shim, code, busy });
    return p; };
  const A = await mk('A', true); await A.waitForTimeout(2500); const B = await mk('B', false); await B.waitForTimeout(3000);
  const txt = async (p, sel) => p.$eval(sel, (e) => e.innerText);
  console.log('B badge (A busy):', await txt(B, '#rnCtlBadge'));
  console.log('B now card:', (await txt(B, '#rn-ov .card.now')).replace(/\n/g, ' | ').slice(0, 300));
  console.log('B acts:', (await txt(B, '#rn-ov .acts')).replace(/\n/g, ' | '));
  console.log('B log:', (await txt(B, '#rn-ov .lg')).replace(/\n/g, ' | ').slice(0, 300));
  await B.screenshot({ path: __dirname + '/ctl_busy.png', clip: { x: 760, y: 0, width: 440, height: 900 } });
  // B에서 일시정지 → A가 멈춰야 함
  await B.click('#rn-ov [data-a="pause"]'); await A.waitForTimeout(800);
  console.log('A paused?', await A.evaluate(() => [window.__rnPaused, window.__rnPrdState.stopped]));
  await B.waitForTimeout(1500); console.log('B badge after pause (A still busy):', await txt(B, '#rnCtlBadge'));
  // A가 멈춤
  await A.evaluate(() => { window.__rnStatus.job = null; window.__rnStatus.jobKey = null; window.__rnStatus.lastEnd = { name: '모두 일괄 수집', at: Date.now(), ms: 3600e3 }; });
  await B.waitForTimeout(3000); console.log('B badge after A stopped:', await txt(B, '#rnCtlBadge'));
  console.log('B acts:', (await txt(B, '#rn-ov .acts')).replace(/\n/g, ' | '));
  await B.screenshot({ path: __dirname + '/ctl_pause.png', clip: { x: 760, y: 0, width: 440, height: 900 } });
  // 버리기
  await B.click('#rn-ov [data-a="dis1"][data-k="market"]'); await B.waitForTimeout(1200);
  console.log('discarded:', await B.evaluate(() => window.__rnPrdState.discarded), '| list:', (await txt(B, '#rn-ov > .card:nth-child(3)')).replace(/\n/g, ' | ').slice(0, 200));
  // 다시 시작 → 가장 최근 멈춘 작업 이어하기
  await B.click('#rn-ov [data-a="resume"]'); await A.waitForTimeout(800);
  console.log('resumed:', await B.evaluate(() => window.__rnPrdState.resumed), '| A paused?', await A.evaluate(() => window.__rnPaused));
  // 접기
  await B.click('#rnCtlMin'); await B.waitForTimeout(300); await B.screenshot({ path: __dirname + '/ctl_min.png', clip: { x: 760, y: 0, width: 440, height: 120 } });
  console.log('ERR', errs); await br.close(); })();

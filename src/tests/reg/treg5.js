// 실제 마우스(누름·뗌 사이 150ms)로: 스크롤 위치 유지 · 코드 고르기 · 설명 직접 입력
const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  const r0 = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {}; window.confirm = () => true; window.alert = (m) => { OUT.alerts = (OUT.alerts || []).concat([m]); };
    ${SETUP}
    S.app.reg = { ...(S.app.reg || {}), focus: true };
    for (let k = 0; k < 6; k++) { const isbn = k % 2 ? '9791167030580' : '9788977396005'; col('reg_items')['it' + k] = { stage: 'sel', isbn, branch: 1, grade: 2, qty: 1, saleState: 1, descMode: 'none', desc: '', info: { ...INFO[isbn], at: new Date().toISOString() }, createdAt: '2026-10-09T00:0' + k + ':00Z' }; }
    openRegister(); await wait(800); S.regT = 'sel'; regRerender(); await wait(800); return document.querySelectorAll('.pq.bq').length; });
  console.log('cards', r0);
  const sh = '#sheet';
  const scrollTo = async (y) => { await p.evaluate((y) => { document.querySelector('#sheet').scrollTop = y; }, y); await p.waitForTimeout(200); };
  const st = () => p.evaluate(() => { const c = document.querySelector('[data-rgg="it3"]'); const sh = document.querySelector('#sheet'); return Math.round(c ? c.getBoundingClientRect().top : -9999) + ' st=' + sh.scrollTop + ' sh=' + sh.scrollHeight + ' win=' + window.scrollY + ' doc=' + document.documentElement.scrollTop; });
  await scrollTo(1400); console.log('scroll before', await st());
  // 4번째 카드 상태 '중' 누르기
  await p.evaluate(() => { window.__log = []; const sh = document.querySelector('#sheet'); let last = sh.scrollTop; sh.addEventListener('scroll', () => { window.__log.push('t=' + Math.round(performance.now()) + ' scroll ' + last + '->' + sh.scrollTop + ' ae=' + (document.activeElement && (document.activeElement.id || document.activeElement.tagName + '.' + document.activeElement.className))); last = sh.scrollTop; });
  const f0 = HTMLElement.prototype.focus; HTMLElement.prototype.focus = function (o) { window.__log.push('focus ' + (this.id || this.tagName) + ' ' + JSON.stringify(o || null) + ' st=' + sh.scrollTop); return f0.call(this, o); };
  const s0 = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function (o) { window.__log.push('sIV ' + (this.id || this.className) + ' ' + new Error().stack.split(String.fromCharCode(10))[2]); return s0.call(this, o); };
  ['pointerdown','mousedown','focusin','focusout','mouseup','click'].forEach((t) => document.addEventListener(t, (e) => window.__log.push(t + ' ' + (e.target.id || e.target.tagName) + ' st=' + sh.scrollTop + ' t=' + Math.round(performance.now())), true)); const o0 = window.openRegister; window.openRegister = function () { const a = sh.scrollTop; const h0 = sh.scrollHeight; o0.apply(this, arguments); window.__log.push('openRegister ' + a + ' -> ' + sh.scrollTop + ' h ' + h0 + '->' + sh.scrollHeight + ' ch=' + sh.clientHeight); }; });
  const g0 = await p.$('[data-rgg="it3"][data-v="3"]'); await g0.scrollIntoViewIfNeeded(); const y0 = await st(); await g0.click({ delay: 150 }); await p.waitForTimeout(1200); console.log((await p.evaluate(() => window.__log.join(String.fromCharCode(10)))).slice(0, 3000)); console.log('grade click: card top', y0, '->', await st(), 'grade', await p.evaluate(() => window.__store.reg_items.it3.grade));
  // 코드 열기 → 고르기
  const codeSel = await p.$('[data-rgcodeopen="it3"]'); if (codeSel) { await codeSel.scrollIntoViewIfNeeded(); const y1 = await st(); await codeSel.click({ delay: 150 }); await p.waitForTimeout(800); console.log('code open', !!(await p.$('[data-rgcode="it3"]')), 'scroll', y1, '->', await st()); }
  const chip = await p.$('[data-rgcode="it3"][data-v="PNKLUX"]'); if (chip) { const y2 = await st(); await chip.click({ delay: 150 }); await p.waitForTimeout(1200); console.log('code after', await p.evaluate(() => JSON.stringify({ c: window.__store.reg_items.it3.code, m: window.__store.reg_items.it3.codeManual })), 'scroll', y2, '->', await st()); }
  const dm = await p.$('[data-rgdm="it3"][data-v="manual"]'); if (dm) { await dm.scrollIntoViewIfNeeded(); const y3 = await st(); await dm.click({ delay: 150 }); await p.waitForTimeout(1200); console.log('desc mode', await p.evaluate(() => window.__store.reg_items.it3.descMode), 'scroll', y3, '->', await st(), 'textarea', !!(await p.$('[data-rgslot="it3"]'))); }
  console.log('direct', await p.evaluate(async () => { const sh = document.querySelector('#sheet'); sh.scrollTop = 2442; const a = sh.scrollTop; openRegister(); const b = sh.scrollTop; await new Promise((r) => setTimeout(r, 30)); const c = sh.scrollTop; await new Promise((r) => setTimeout(r, 600)); return [a, b, c, sh.scrollTop, document.activeElement && (document.activeElement.id || document.activeElement.tagName)].join(' '); }));
  console.log('ERR', JSON.stringify(errs.filter((e) => !/Firestore|firestore/.test(e)).slice(0, 5)));
  await br.close(); })();`);

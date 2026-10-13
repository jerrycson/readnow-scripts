const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); const MOB = process.argv[3] === 'mob';
eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  ${MOB ? "await p.setViewportSize({ width: 390, height: 844 });" : ''}
  await p.goto('http://t.test/app/'); await p.waitForTimeout(5000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {};
    try { ${SETUP}
      const box = document.createElement('div'); box.id = 'altest'; box.style.cssText = 'position:fixed;top:60px;left:20px;width:360px;background:#fff;z-index:9999;padding:8px'; document.body.appendChild(box);
      box.innerHTML = alertsHtml([{ lv: 'top', t: '주문확인요청 3건 — 발송준비시작', key: 'shipconfirm' }, { lv: 'red', t: '출고 기록 없는 주문 2건', key: 'late' }, { lv: 'amber', t: '유효 최저가보다 10% 싸게 3종', key: 'prq' }, { lv: 'info', t: '오늘 출고 5건', key: 'ship' }]); await wait(200);
      const c = box.querySelector('.alerts'); OUT.enh = c.dataset.enh; OUT.rows = c.querySelectorAll('.alrow').length; OUT.fold = c.querySelectorAll('.alfold').length; OUT.firstTop = c.firstElementChild.classList.contains('atop');
      // drag the 'prq' row into the closed folder header
      const row = [...c.querySelectorAll('.alrow')].find((x) => /prq/.test(x.dataset.aid)); const h = row.querySelector('.alh'); const hr = h.getBoundingClientRect(); const fh = c.querySelector('.alfh').getBoundingClientRect();
      return JSON.stringify({ OUT, h: [hr.left + 5, hr.top + 5], f: [fh.left + 60, fh.top + fh.height / 2] });
    } catch (e) { return JSON.stringify({ ERR: e.message + e.stack }); } });
  console.log(r); const RR = JSON.parse(r); if (RR.h) { await p.mouse.move(RR.h[0], RR.h[1]); await p.mouse.down(); await p.mouse.move(RR.h[0], RR.h[1] + 20, { steps: 4 }); await p.mouse.move(RR.f[0], RR.f[1], { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(400); }
  const r2 = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const c = document.querySelector('#altest .alerts'); const O = {}; O.layout = JSON.stringify(window.__store.app_settings && window.__store.app_settings.alert_layout); O.freeRows = c.querySelectorAll(':scope > .alrow').length; O.inFolder = c.querySelectorAll('.alfold .alrow').length;
    c.querySelector('.alft').click(); await wait(400); O.open = c.querySelector('.alfold').classList.contains('open'); O.h = Math.round(c.querySelector('.alfb').getBoundingClientRect().height);
    c.querySelector('.aladd').click(); await wait(300); O.folders = c.querySelectorAll('.alfold').length; return JSON.stringify(O); });
  console.log(r2); await p.screenshot({ path: SP + '/reg/al_${MOB ? 'm' : 'pc'}.png' }); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5))); await br.close(); })();`);

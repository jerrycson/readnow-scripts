const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); const MOB = process.argv[3] === 'mob'; eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  ${MOB ? "await p.setViewportSize({ width: 390, height: 844 });" : ''}
  await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  const P0 = p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {};
    try { ${SETUP}
      window.confirm = () => true;
      S.plist.set('L1', { id: 'L1', title: '[중고] 책1', price: 12000, grade: '상', active: true, isbn13: '9788900000001', bookId: 'b1' }); S.plist.set('L2', { id: 'L2', title: '[중고] 책2', price: 8000, grade: '중', active: true, isbn13: '9788900000002', bookId: 'b2' });
      S.shipC = { at: new Date().toISOString(), orders: [{ orderNo: 'O1', orderedAt: '2026-10-11 10:00', customerId: 'c1', items: [{ listingId: 'L1', title: '책1', price: 12000, qty: 1, sku: 'BLK-1', grade: '상' }] }, { orderNo: 'O2', orderedAt: '2026-10-11 11:00', items: [{ listingId: 'L2', title: '책2', price: 8000, qty: 2, sku: 'YLW-2', grade: '중' }] }] };
      S._shipLive = 1; S.shipTab = 'confirm'; S.shipView = 'order'; await openShip(); await wait(500);
      const sh = document.querySelector('#sheet'); OUT.sums = [...sh.querySelectorAll('.shp-oh')].map((h) => h.innerText.replace(/\s+/g, ' ')).join(' | '); OUT.boxes = sh.querySelectorAll('.phx').length; OUT.minTxt = [...sh.querySelectorAll('.phx')].map((b) => b.innerText.replace(/\\s+/g, ' ')).join(' | ');
      /* 상품 L1: 펼치고 두 개 고르고 직접 적기 */
      const b1 = () => sh.querySelector('.phx[data-tid="L1"]'); b1().querySelector('[data-phtog]').click(); await wait(100); const bl = b1().querySelectorAll('.phx-b'); OUT.blocks = bl.length; bl[0].click(); await wait(50); b1().querySelectorAll('.phx-b')[2].click(); await wait(50);
      const fr = b1().querySelector('[data-phfree]'); fr.value = '단골 김씨'; fr.dispatchEvent(new Event('input', { bubbles: true })); OUT.sel1 = JSON.stringify(phPick('ship', 'L1'));
      /* 일괄: 하나 고름 → L2는 일괄 이유를 따름 */
      const bb = () => sh.querySelector('.phx[data-tid="*"]'); bb().querySelector('[data-phtog]').click(); await wait(80); bb().querySelectorAll('.phx-b')[1].click(); await wait(80); OUT.inh2 = sh.querySelector('.phx[data-tid="L2"]').innerText.replace(/\\s+/g, ' '); OUT.pick2 = JSON.stringify(phPick('ship', 'L2'));
      /* 문구 고치기: 추가·고치기·빼기·끌기·저장 */
      b1().querySelector('[data-phedit]').click(); await wait(80); OUT.editRows = b1().querySelectorAll('.phx-b.e').length; b1().querySelector('[data-phadd]').click(); await wait(80); const ins = b1().querySelectorAll('[data-phin]'); const last = ins[ins.length - 1]; last.value = '새 문구 ABC'; last.dispatchEvent(new Event('input', { bubbles: true }));
      b1().querySelectorAll('[data-phdel]')[1].click(); await wait(80); OUT.afterDel = b1().querySelectorAll('.phx-b.e').length;
      OUT.dragH = (() => { const h = b1().querySelectorAll('.phx-h'); const r0 = h[h.length - 1].getBoundingClientRect(); const r1 = h[0].getBoundingClientRect(); return [r0.left + 4, r0.top + 6, r1.left + 4, r1.top + 2]; })();
      window.__go2 = 1; await new Promise((r) => (window.__resume = r));
      OUT.orderAfterDrag = [...b1().querySelectorAll('[data-phin]')].map((i) => i.value).slice(0, 3).join(' / ');
      b1().querySelector('[data-phsave]').click(); await wait(300); const saved = (window.__store.app_settings || {}).phrases_ship; OUT.saved = saved ? saved.items.map((x) => x.t).join(' / ') : 'none'; OUT.savedFirst = saved && saved.items[0].t; OUT.selAfter = JSON.stringify(phPick('ship', 'L1'));
      /* 발송준비시작 (주문 O1) — 두 번 누르기 */ const go = sh.querySelector('.shp-go[data-sds="O1"]') || sh.querySelector('[data-sds="O1"]'); go.click(); go.click(); await wait(600);
      const ds = window.__store.dec_snapshots || {}; OUT.snapN = Object.keys(ds).length; const s1 = Object.values(ds)[0]; OUT.snap1 = s1 ? JSON.stringify({ ctx: s1.ctx, dec: s1.decision, amt: s1.amount, ref: s1.ref, rs: s1.reasons, mk: s1.market && Object.keys(s1.market), ex: s1.extra }) : null; OUT.cmds = JSON.stringify(Object.values(window.__store.shp_cmds || {}).map((c) => c.type + ':' + (c.orderNos || []).join(',')));
      /* 모두 발송준비시작 → O2 (일괄 이유) */ await openShip(); await wait(300); const all = document.querySelector('#sds_all'); OUT.allBtn = all && all.textContent; if (all) { all.click(); await wait(800); } const ds2 = Object.values(window.__store.dec_snapshots || {}); OUT.snapN2 = ds2.length; const s2 = ds2.find((x) => x.ref.orderNo === 'O2'); OUT.snap2 = s2 ? JSON.stringify({ amt: s2.amount, rs: s2.reasons }) : null; OUT.bulkCleared = JSON.stringify(phPick('ship', '*'));
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  await p.waitForFunction(() => window.__go2 === 1, null, { timeout: 60000 }); await p.evaluate(() => document.querySelectorAll('.verbar').forEach((x) => x.remove())); const D = await p.evaluate(() => { const b = document.querySelector('.phx[data-tid="L1"]'); const h = b.querySelectorAll('.phx-h'); const r0 = h[h.length - 1].getBoundingClientRect(); const r1 = h[0].getBoundingClientRect(); return [r0.left + 4, r0.top + r0.height / 2, r1.left + 4, r1.top + 2]; });
  await p.mouse.move(D[0], D[1]); await p.mouse.down(); await p.mouse.move(D[0], D[1] - 10, { steps: 3 }); await p.mouse.move(D[2], D[3], { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(200);
  await p.screenshot({ path: SP + '/reg/ph_${MOB ? 'm' : 'pc'}.png' }); await p.evaluate(() => window.__resume()); console.log(await P0); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await br.close(); })();`);

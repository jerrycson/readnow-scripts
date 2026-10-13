const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); const VW = +process.env.VW || 1300;
eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.setViewportSize({ width: ${VW}, height: 900 }); await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {}; window.confirm = () => true; let PR = []; window.prompt = (m, d) => { OUT.prompts = (OUT.prompts || []).concat([String(m).slice(0, 80)]); return PR.shift() ?? d; };
    try { ${SETUP}
    { const dc = db.collection; db.collection = (n) => { const c = dc(n); const w = c.where; const Q = () => { const q = w(); q.where = () => Q(); q.orderBy = () => Q(); q.limit = () => Q(); return q; }; c.where = () => Q(); c.orderBy = () => Q(); c.limit = () => Q(); return c; }; }
    const mk = (n, isbn, title) => ({ n, isbn, st: 'done', d: { title, isbn13: isbn, itemId: 'I' + n, author: '지은이' + n, publisher: '출판' + n, buyback: { 최상: 3000, 상: 2500, 중: 1500 }, priceList: 15000, page1: [], at: new Date().toISOString() }, rec: { 최상: { t: 9000, why: [] }, 상: { t: 8000, why: [] }, 중: { t: 6000, why: [] } } });
    S.ppt = { mode: 'bar', items: [mk(1, '9788936434120', '소년이 온다'), mk(2, '9788937460449', '데미안')], spines: [], sid: 'sessAAAA1111', at: new Date().toISOString() }; S.detail = { ppt: 1 };
    const sh = document.querySelector('#sheet'); sh.classList.add('on'); pptDraw(); OUT.btns = [...sh.querySelectorAll('#ppt_grp,#ppt_grps,#ppt_files')].map((x) => x.id).join(',');
    PR = ['당근 홍길동 10/10']; await pptToGroup(); OUT.idx = JSON.stringify(window.__store.ppt_sessions.grp_index.list);
    // 두 번째 조회: 같은 책 하나 + 새 책 → 같은 묶음(1번)
    S.ppt.sid = 'sessBBBB2222'; S.ppt.items = [mk(1, '9788936434120', '소년이 온다'), mk(2, '9788932917245', '코스모스')]; PR = ['1']; await pptToGroup();
    const gid = window.__store.ppt_sessions.grp_index.list[0].id; const g = window.__store.ppt_sessions[gid]; OUT.items = g.items.map((x) => x.title + '×' + x.qty).join(', ') + ' | sessions ' + g.sessions.length;
    // 같은 조회 다시 담기 → 두 번 안 들어감
    PR = ['1']; await pptToGroup(); OUT.again = window.__store.ppt_sessions[gid].items.map((x) => x.title + '×' + x.qty).join(', ');
    await pptGroups(); await wait(300); OUT.list = sh.innerText.replace(/\\s+/g, ' ').slice(0, 300);
    await pptGroupOpen(gid); await wait(300); OUT.det = sh.innerText.replace(/\\s+/g, ' ').slice(0, 420);
    const cb = sh.querySelector('[data-pgk="1"]'); cb.checked = false; cb.onchange(); OUT.afterPick = sh.querySelector('.mgrid').innerText.replace(/\\s+/g, ' ');
    sh.querySelector('#pg_save').click(); await wait(300);
    // 매입 기록 만들기 → 폼에 품목
    S.pur.loaded = true; S.pur.entries = S.pur.entries || []; sh.querySelector('#pg_mk').click(); await wait(500); OUT.form = [...sh.querySelectorAll('input')].map((x) => x.value).filter((v) => /소년|코스모스|데미안/.test(v)).join(' / ') + ' | 묶음 ' + (S.detail && S.detail.pur);
    // 매입 자세히 칸
    window.__store.ppt_sessions[gid].purEntryId = 'E1'; S.pgIdx = null; S.pur.entries.push({ id: 'E1', source: 'app', dateTime: '2026-10-10T10:00', plat: '당근', items: [{ title: '소년이 온다', qty: 2, price: 3000 }], status: 'received' }); bump('u');
    await pgIndexPut({ ...window.__store.ppt_sessions.grp_index.list[0], purEntryId: 'E1' }); openPurRec('E1'); await wait(800); const tb = sh.querySelector('#pr_tabs'); OUT.tabs = tb ? tb.innerText.replace(/\\s+/g, ' ') : '없음';
    if (tb) { tb.querySelector('[data-prt="grp"]').click(); await wait(400); OUT.tab2 = [...sh.querySelectorAll('.card')].filter((c) => c.style.display !== 'none').map((c) => c.innerText.replace(/\\s+/g, ' ').slice(0, 200)).join(' || '); }
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await p.evaluate(async () => { document.querySelectorAll('.verbar').forEach((x) => x.remove()); await pptGroupOpen(window.__store.ppt_sessions.grp_index.list[0].id); }); await p.waitForTimeout(500); await p.screenshot({ path: SP + '/reg/pgrp_${VW}.png' }); await br.close(); })();`);

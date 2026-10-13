const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const core = fs.readFileSync('/home/claude/w/readnow-aladin-core.js', 'utf8');
(async () => { const br = await chromium.launch(); const p = await br.newPage(); await p.goto('about:blank'); await p.addScriptTag({ content: core });
  const out = await p.evaluate(async () => { const A = window.ReadnowAladin; const log = []; const pace = { wait: async () => {}, ok: () => log.push('ok'), fail: (k) => log.push('fail:' + k), kindOf: (s) => (s === 429 ? '429' : 'error'), cooling: () => 0, state: () => ({ gap: 1 }) };
    const seq = []; window.fetch = async (u) => { const x = seq.shift(); if (x.throw) throw Object.assign(new Error('x'), { name: x.throw }); return { ok: x.st === 200, status: x.st, url: x.url || u, headers: { get: () => 'text/html; charset=utf-8' }, arrayBuffer: async () => new TextEncoder().encode(x.html || '').buffer }; };
    const SCM = '<html><head><title>샵매니저</title></head><body><a href="/wC2Cuser_logout.aspx">x</a>주문번호 123</body></html>';
    const MAINT = '<html><body>서비스 점검 안내 — 지금은 점검 중입니다</body></html>';
    let relog = 0; const R = A.makeReader({ pace, sleep: async () => {}, loggedOut: (fu, doc, url) => A.looksLoggedOut(fu, doc, { url, scmNeedsLogout: true }), onLoggedOut: async (fu, n) => { relog++; if (n > 2) throw new Error('로그인이 풀렸습니다'); }, fatal: (e) => /로그인이 풀렸/.test(e.message), on429: () => log.push('on429'), onRetry: (e, w) => log.push('retry:' + e.message + ':' + w) });
    const res = {};
    seq.push({ st: 200, html: MAINT }, { st: 429 }, { throw: 'AbortError' }, { st: 200, html: SCM }); const r1 = await R('https://www.aladin.co.kr/scm/x.aspx'); res.t1 = [/주문번호/.test(r1.doc.body.textContent), log.join(' ')]; log.length = 0;
    seq.push({ st: 200, html: '<html><body>no logout</body></html>' }, { st: 200, html: SCM }); await R('https://www.aladin.co.kr/scm/y.aspx'); res.t2 = ['relog ' + relog, log.join(' ')]; log.length = 0;
    seq.push({ st: 200, url: 'https://www.aladin.co.kr/login/wlogin.aspx', html: '<input type=password>' }, { st: 200, url: 'https://www.aladin.co.kr/login/wlogin.aspx', html: '' }, { st: 200, url: 'https://www.aladin.co.kr/login/wlogin.aspx', html: '' }); relog = 0;
    try { await R('https://www.aladin.co.kr/scm/z.aspx'); res.t3 = 'no throw'; } catch (e) { res.t3 = 'threw: ' + e.message + ' relog ' + relog; }
    seq.push({ st: 200, html: '<html><body>shop page</body></html>' }); res.t4 = /shop/.test((await R('https://www.aladin.co.kr/shop/wproduct.aspx')).doc.body.textContent);
    seq.push({ st: 200, html: MAINT }); try { await A.quick('/x', { pace, sleep: async () => {} }); res.t5 = 'no throw'; } catch (e) { res.t5 = 'quick threw: ' + e.message; }
    res.t6 = [A.looksLoggedOut('https://www.aladin.co.kr/scm/a', new DOMParser().parseFromString('<title>알라딘 로그인</title><input type=password>', 'text/html'), { titleOk: /샵매니저/ }), A.looksLoggedOut('https://www.aladin.co.kr/scm/wpopup_order.aspx', new DOMParser().parseFromString('<title>주문</title>', 'text/html'), { titleOk: /샵매니저/ })];
    return res; });
  console.log(JSON.stringify(out, null, 1)); await br.close(); })();

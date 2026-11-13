/* 📊 북스퀸 손님 화면 — 가벼운 방문 셈 · 📢 배너 · 💬 문의 · 👀 관리자 '손님 화면으로 보기'(읽기만) (11/13 shopadm1 · v0.1.0)
 *  index.html에서 다른 스크립트보다 먼저 실림(미리 보기 때 기기 저장소·창구 부름을 먼저 바꿔 둬야 해서) · 외부 라이브러리 없음 · 실패해도 손님 화면은 그대로
 *  보내는 것: 화면 이름·본 상품 번호·찾은 낱말·분류·담기/찜 바뀜·주문 마침 · 들어온 곳(주소의 도메인만 · utm 칸) · 화면 폭
 *  보내지 않는 것: 이름·전화·주소·메일·IP(클라우드가 저장 안 함) · 이 기기 무작위 번호(bq-vid)는 '오늘 첫 방문' 셈에만 쓰고 클라우드에 남지 않음
 *  로그인한 손님은 활동 시간줄이 손님 번호로 남음(개인정보 처리방침 8번) · 💬 문의 창의 '이 기기 방문 기록 끄기' · 브라우저 추적 안 함(GPC·DNT)이면 시간줄 없음
 *  👀 미리 보기: 주소에 ?bqpv=<표>(관리 웹앱이 30분 표를 받아 붙임) 또는 ?bqpv=out(로그아웃 손님) — 기기 저장소를 이 탭 기억으로 바꾸고 쓰는 창구(주문·글·찜 저장)는 모두 막음 · 셈 0 */
(function () {
  'use strict';
  var W = window, D = document, VER = '0.1.0';
  var API_SHOP = 'https://readnow-shop-63884079760.asia-northeast3.run.app';
  var SAME = !W.BQ_API && /(^|\.)booksqueen\.(com|web\.app|firebaseapp\.com)$/.test(location.hostname || '');
  var API = String(W.BQ_API || API_SHOP).replace(/\/+$/, '');
  var getBase = function () { return SAME ? location.origin : API; };
  var qp = (function () { var o = {}; String(location.search || '').replace(/^\?/, '').split('&').forEach(function (kv) { if (!kv) return; var i = kv.indexOf('='); try { o[decodeURIComponent(i < 0 ? kv : kv.slice(0, i))] = decodeURIComponent(i < 0 ? '' : kv.slice(i + 1).replace(/\+/g, ' ')); } catch (e) {} }); return o; })();
  var PV = qp.bqpv ? (qp.bqpv === 'out' ? { out: 1 } : /^[0-9a-f]{40}$/.test(qp.bqpv) ? { tk: qp.bqpv } : null) : null;
  var BQT = W.BQT = { ver: VER, pv: PV, q: [], cfg: null };

  /* ══ 👀 미리 보기 — 다른 스크립트보다 먼저 */
  if (PV) {
    var mem = {}; var memStore = { getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; }, setItem: function (k, v) { mem[k] = String(v); }, removeItem: function (k) { delete mem[k]; }, clear: function () { mem = {}; }, key: function (i) { return Object.keys(mem)[i] || null; } };
    Object.defineProperty(memStore, 'length', { get: function () { return Object.keys(mem).length; } });
    try { Object.defineProperty(W, 'localStorage', { configurable: true, get: function () { return memStore; } }); } catch (e) {}
    if (PV.tk) mem['bq-tok'] = 'u_0000000000000000.' + '0'.repeat(32); /* 손님 화면이 '로그인됨'으로 그리게 하는 자리 표 — 진짜 열쇠 아님(창구 부름은 아래에서 미리 보기 표로 바꿈) */
    var NO = JSON.stringify({ ok: false, pv: 1, err: '👀 손님 화면 미리 보기 — 읽기만 합니다(저장·주문·글쓰기는 하지 않음)' });
    var of = W.fetch ? W.fetch.bind(W) : null;
    if (of) W.fetch = function (u, o) { try { var url = String(u && u.url ? u.url : u); var m = String((o && o.method) || 'GET').toUpperCase(); var p = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
        if (m !== 'GET' && /^\/shop\//.test(p)) {
          if (p === '/shop/a' && PV.tk) { var b = {}; try { b = JSON.parse((o && o.body) || '{}'); } catch (e) {} return of(API + '/shop/pv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tk: PV.tk, b: b }) }); }
          if (p === '/shop/a' && b0(o) === 'me') return Promise.resolve(new Response(JSON.stringify({ ok: false, login: 1, err: '로그아웃 손님' }), { status: 401, headers: { 'Content-Type': 'application/json' } }));
          if (p === '/shop/quote') return of(u, o); /* 값 셈은 쓰기가 아님 */
          return Promise.resolve(new Response(NO, { status: 403, headers: { 'Content-Type': 'application/json' } })); }
      } catch (e) {} return of(u, o); };
    function b0(o) { try { return JSON.parse((o && o.body) || '{}').op; } catch (e) { return ''; } }
    var bar = function () { if (D.getElementById('bqtPv')) return; var d = D.createElement('div'); d.id = 'bqtPv'; d.setAttribute('role', 'status');
      d.style.cssText = 'position:sticky;top:0;z-index:9999;background:#5b2a86;color:#fff;font:600 13px/1.4 system-ui,sans-serif;padding:6px 12px;text-align:center';
      d.textContent = PV.out ? '👀 로그아웃 손님 화면 미리 보기 — 읽기만(주문·저장 안 됨)' : '👀 손님 화면 미리 보기 — 읽기만(주문·저장·글쓰기 안 됨 · 장바구니는 손님 기기에만 있어 비어 보임)'; D.body.insertBefore(d, D.body.firstChild);
      if (PV.tk && of) of(API + '/shop/pv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tk: PV.tk }) }).then(function (r) { return r.json(); }).then(function (j) { if (j && j.ok) d.textContent = '👀 「' + (j.nick || '손님') + '」 손님 화면 미리 보기 — 읽기만(주문·저장·글쓰기 안 됨 · 장바구니는 손님 기기에만 있어 비어 보임) · 표는 ' + String(j.exp || '').slice(11, 16) + '(UTC)까지'; else d.textContent = '👀 미리 보기 표가 끝났습니다 — 관리 웹앱에서 다시 여세요'; }).catch(function () {}); };
    if (D.body) bar(); else D.addEventListener('DOMContentLoaded', bar);
    try { if (W.parent && W.parent !== W) W.parent.postMessage({ bqpv: 1, ver: VER, out: PV.out ? 1 : 0 }, '*'); } catch (e) {} /* 관리 웹앱 틀이 '읽기 전용 미리 보기가 켜졌다'를 확인 */
  }

  /* ══ 방문 셈 */
  var LSg = function (k) { try { return W.localStorage.getItem(k); } catch (e) { return null; } }, LSs = function (k, v) { try { W.localStorage.setItem(k, v); } catch (e) {} };
  var SSg = function (k) { try { return W.sessionStorage.getItem(k); } catch (e) { return null; } }, SSs = function (k, v) { try { W.sessionStorage.setItem(k, v); } catch (e) {} };
  var hex = function (n) { var a = new Uint8Array(n); try { crypto.getRandomValues(a); } catch (e) { for (var i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256); } return Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); };
  var kday = function () { return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); };
  var off = function () { return !!PV || LSg('bq-notrack') === '1' || /bot|crawl|spider|headless/i.test(navigator.userAgent || '') || (BQT.cfg && BQT.cfg.trk && BQT.cfg.trk.on === 0); };
  var S = { nv: 0, ns: 0, ref: '', utm: null, sent: 0 };
  function sess() { var now = Date.now(); var sid = SSg('bq-sid'), at = +SSg('bq-sat') || 0; if (!sid || now - at > 30 * 60e3) { sid = hex(6); SSs('bq-sid', sid); SSs('bq-sf', ''); S.ns = 1;
      var r = ''; try { r = D.referrer ? new URL(D.referrer).hostname.replace(/^www\./, '') : ''; } catch (e) {} S.ref = r;
      var u = { s: qp.utm_source || '', m: qp.utm_medium || '', c: qp.utm_campaign || '', n: qp.n_media || qp.NaPm ? 1 : 0, g: qp.gclid || qp.fbclid ? 1 : 0 }; S.utm = u.s || u.m || u.c || u.n || u.g ? u : null; }
    SSs('bq-sat', String(now)); var vid = LSg('bq-vid'); if (!/^[0-9a-f]{16}$/.test(vid || '')) { vid = hex(8); LSs('bq-vid', vid); } if (LSg('bq-vday') !== kday()) { LSs('bq-vday', kday()); S.nv = 1; } return { sid: sid, vid: vid }; }
  function ev(k, a, x) { if (off()) return; BQT.q.push([k, a == null ? '' : String(a), x == null ? '' : String(x), Date.now()]); if (BQT.q.length >= 20) send(); }
  function step(k) { var f = SSg('bq-sf') || ''; if (f.indexOf(k) >= 0) return; SSs('bq-sf', f + k); ev('f', k); }
  function send(beacon) { if (off()) { BQT.q = []; return; } var ss = sess(); if (!BQT.q.length && !S.ns) return; var tk = LSg('bq-tok') || '';
    var body = JSON.stringify({ v: 1, vid: ss.vid, sid: ss.sid, nv: S.nv, ns: S.ns, ref: S.ns ? S.ref : '', utm: S.ns ? S.utm : null, sw: W.innerWidth || 0, tk: /^u_[0-9a-f]{16}\.[0-9a-f]{32}$/.test(tk) ? tk : '', no: LSg('bq-notrack') === '1' ? 1 : 0, E: BQT.q.splice(0, 60) });
    S.nv = 0; S.ns = 0; S.sent++; var url = getBase() + '/shop/t';
    try { if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }))) return; } catch (e) {}
    try { fetch(url, { method: 'POST', body: body, headers: { 'Content-Type': 'text/plain' }, keepalive: true, mode: 'cors', credentials: 'omit' }).catch(function () {}); } catch (e) {} }
  BQT.send = send; BQT.ev = ev;
  var NAMES = { home: 1, list: 1, b: 1, cart: 1, order: 1, done: 1, shelf: 1, me: 1, wish: 1, login: 1, p: 1, my: 1, pf: 1, bl: 1, feed: 1, lib: 1, al: 1 };
  function route() { var h = String(location.hash || '').replace(/^#/, '') || '/'; var i = h.indexOf('?'); var p = i < 0 ? h : h.slice(0, i), qs = i < 0 ? '' : h.slice(i + 1); var q = {}; qs.split('&').forEach(function (kv) { if (!kv) return; var j = kv.indexOf('='); try { q[decodeURIComponent(j < 0 ? kv : kv.slice(0, j))] = decodeURIComponent(j < 0 ? '' : kv.slice(j + 1).replace(/\+/g, ' ')); } catch (e) {} });
    var seg = p.split('/').filter(Boolean); var arg = null; try { arg = seg[1] ? decodeURIComponent(seg[1]) : null; } catch (e) {} return { name: seg[0] || 'home', arg: arg, q: q }; }
  BQT.route = route; var last = null;
  function onRoute() { var r = route(); var key = location.hash; if (key === last) return; last = key; var nm = NAMES[r.name] ? r.name : 'etc'; ev('p', nm, nm === 'b' || nm === 'p' ? r.arg : '');
    if (nm === 'b' && r.arg) { ev('v', r.arg); step('v'); } if (nm === 'list') { if (r.q.q) ev('s', r.q.q); if (r.q.cp) ev('c', r.q.cp); else if (r.q.c) ev('c', r.q.c); }
    if (nm === 'order') { ev('o'); step('o'); } if (nm === 'done' && r.q['new'] === '1') { ev('od', r.arg); step('d'); } if (nm === 'p' && r.arg === 'privacy') privSoon(); if (askBtn) askBtn.hidden = !askOn() || nm === 'cart' || nm === 'order'; }
  /* 담기·찜 바뀜 — 손님 화면이 기기 저장소에 쓰는 순간을 봄(손님 화면 코드는 그대로) */
  var ids = function (v) { try { return (JSON.parse(v || '[]') || []).map(function (x) { return x && x.id; }).filter(Boolean); } catch (e) { return []; } };
  try { var SP = W.Storage && W.Storage.prototype; var os = SP && SP.setItem; if (os && !PV) SP.setItem = function (k, v) { var was = null; if (k === 'bq-cart' || k === 'bq-wish') { try { was = this.getItem(k); } catch (e) {} } var r = os.apply(this, arguments);
      if (was !== null || k === 'bq-cart' || k === 'bq-wish') { try { var a = ids(was), b = ids(v); var A0 = {}, B0 = {}; a.forEach(function (x) { A0[x] = 1; }); b.forEach(function (x) { B0[x] = 1; }); var add = k === 'bq-cart' ? 'ca' : 'w', del = k === 'bq-cart' ? 'cr' : 'wr';
          b.forEach(function (x) { if (!A0[x]) { ev(add, x); if (add === 'ca') step('c'); } }); if (route().name !== 'order' && route().name !== 'done') a.forEach(function (x) { if (!B0[x]) ev(del, x); }); } catch (e) {} } return r; }; } catch (e) {}

  /* ══ 📢 배너 · 💬 문의 · 개인정보 처리방침 8번 */
  var css = '.bqt-bn{display:flex;gap:8px;align-items:center;justify-content:center;padding:8px 40px 8px 12px;font:600 14px/1.4 system-ui,sans-serif;position:relative;text-align:center}.bqt-bn a{color:inherit;text-decoration:underline}.bqt-bn button{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:inherit;font-size:18px;min-width:40px;min-height:40px;cursor:pointer}'
    + '.bqt-info{background:#e8eef9;color:#1d2b45}.bqt-sale{background:#fde8e4;color:#8a1f11}.bqt-warn{background:#fff4d6;color:#6b4a00}.bqt-new{background:#e6f4ea;color:#1f5c34}'
    + '#bqtAsk{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:900;border:0;border-radius:22px;background:#1d2b45;color:#f3d58a;font:700 14px system-ui,sans-serif;padding:0 16px;min-height:44px;box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:pointer}'
    + '.bqt-ov{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:1000;display:flex;align-items:flex-end;justify-content:center}.bqt-pn{background:#fff;color:#222;width:min(480px,100%);max-height:88vh;overflow:auto;border-radius:14px 14px 0 0;padding:16px;font:14px/1.5 system-ui,sans-serif;box-sizing:border-box}'
    + '@media(min-width:700px){.bqt-ov{align-items:center}.bqt-pn{border-radius:14px}}.bqt-pn h2{margin:0 0 8px;font-size:18px}.bqt-pn label{display:block;margin:8px 0 2px;font-weight:600}.bqt-pn textarea,.bqt-pn input,.bqt-pn select{width:100%;box-sizing:border-box;font:inherit;padding:8px;border:1px solid #bbb;border-radius:8px;min-height:40px}'
    + '.bqt-pn .bqt-row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.bqt-pn .bqt-row button{flex:1;min-height:44px;border-radius:8px;border:1px solid #1d2b45;background:#1d2b45;color:#fff;font:700 15px system-ui,sans-serif;cursor:pointer}.bqt-pn .bqt-row button.g{background:#fff;color:#1d2b45}.bqt-pn small{color:#666}.bqt-pn .my{border-top:1px solid #eee;margin-top:12px;padding-top:8px}.bqt-pn .a{background:#f3f6fb;border-radius:8px;padding:6px 8px;margin:4px 0}';
  function addCss() { if (D.getElementById('bqtCss')) return; var st = D.createElement('style'); st.id = 'bqtCss'; st.textContent = css; D.head.appendChild(st); }
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function cfgGet() { return fetch(getBase() + '/shop/cfg', { credentials: 'omit' }).then(function (r) { return r.json(); }).catch(function () { return fetch(API + '/shop/cfg').then(function (r) { return r.json(); }); }).then(function (c) { BQT.cfg = c || {}; return BQT.cfg; }).catch(function () { return null; }); }
  function banner(c) { var L = (c && c.bnr) || []; var old = D.getElementById('bqtBn'); if (old) old.remove(); var shut = {}; try { shut = JSON.parse(SSg('bq-bnx') || '{}') || {}; } catch (e) {} L = L.filter(function (b) { return !shut[b.id + b.tx]; }); if (!L.length) return;
    var box = D.createElement('div'); box.id = 'bqtBn'; box.innerHTML = L.map(function (b) { var tx = esc(b.tx); var a = b.url ? '<a href="' + esc(b.url) + '"' + (/^https:/.test(b.url) ? ' target="_blank" rel="noopener"' : '') + '>' + tx + '</a>' : tx; return '<div class="bqt-bn bqt-' + esc(b.tone || 'info') + '" data-k="' + esc(b.id + b.tx) + '">' + a + '<button type="button" aria-label="이 안내 닫기">×</button></div>'; }).join('');
    var top = D.querySelector('header.top'); if (top && top.parentNode) top.parentNode.insertBefore(box, top.nextSibling); else D.body.insertBefore(box, D.body.firstChild);
    box.addEventListener('click', function (e) { var bt = e.target.closest && e.target.closest('button'); if (!bt) { var a = e.target.closest && e.target.closest('a'); if (a) ev('p', 'etc', 'bnr'); return; } var row = bt.parentNode; shut[row.getAttribute('data-k')] = 1; SSs('bq-bnx', JSON.stringify(shut)); row.remove(); }); }
  var askBtn = null; var askOn = function () { return !!(BQT.cfg && BQT.cfg.trk && BQT.cfg.trk.ask); };
  function askUi() { if (!askOn() || askBtn) return; askBtn = D.createElement('button'); askBtn.id = 'bqtAsk'; askBtn.type = 'button'; askBtn.textContent = '💬 문의'; askBtn.setAttribute('aria-label', '가게에 문의하기'); D.body.appendChild(askBtn); askBtn.onclick = askOpen; onRoute(); }
  var myAsks = function () { try { return JSON.parse(LSg('bq-asks') || '[]') || []; } catch (e) { return []; } };
  function askOpen() { var r = route(); var bk = r.name === 'b' && r.arg ? { id: r.arg, t: ((D.querySelector('#main h1') || {}).textContent || '').trim().slice(0, 100) } : null;
    var ov = D.createElement('div'); ov.className = 'bqt-ov'; ov.innerHTML = '<div class="bqt-pn" role="dialog" aria-modal="true" aria-label="문의하기"><h2>💬 가게에 문의</h2>'
      + (bk ? '<div><small>보고 있던 책: ' + esc(bk.t || bk.id) + ' (함께 보냄)</small></div>' : '')
      + '<label for="bqtK">무엇에 대해</label><select id="bqtK"><option value="book">책 상태·내용</option><option value="order">주문·입금</option><option value="ship">배송·교환·환불</option><option value="etc">그 밖</option></select>'
      + '<label for="bqtTx">문의 글</label><textarea id="bqtTx" rows="4" maxlength="1000" placeholder="궁금한 것을 적어 주세요(5자 넘게)"></textarea>'
      + '<label for="bqtNo">주문 번호(있으면)</label><input id="bqtNo" maxlength="30" placeholder="BQ20261113-ABCDE">'
      + '<label for="bqtCt">답 받을 연락처(선택 — 메일 또는 휴대폰)</label><input id="bqtCt" maxlength="80" autocomplete="email">'
      + '<input id="bqtHp" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">'
      + '<small>답은 이 화면 아래 「내 문의」에도 나옵니다 · 적은 연락처는 답을 드리는 데만 쓰고 3년(소비자 분쟁 처리 기록 · 전자상거래법) 보관한 뒤 파기합니다</small>'
      + '<div class="bqt-row"><button type="button" class="g" id="bqtX">닫기</button><button type="button" id="bqtGo">보내기</button></div><div id="bqtMsg" role="status"></div>'
      + '<div class="my" id="bqtMy"></div><div class="my"><label style="font-weight:400"><input type="checkbox" id="bqtOff" style="width:auto;min-height:0"' + (LSg('bq-notrack') === '1' ? ' checked' : '') + '> 이 기기 방문 기록 끄기 <small>(본 화면·찾은 낱말을 셈에 넣지 않음)</small></label></div></div>';
    D.body.appendChild(ov); var close = function () { ov.remove(); D.removeEventListener('keydown', k); }; var k = function (e) { if (e.key === 'Escape') close(); }; D.addEventListener('keydown', k);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); }); ov.querySelector('#bqtX').onclick = close; if (bk) ov.querySelector('#bqtK').value = 'book';
    ov.querySelector('#bqtOff').onchange = function (e) { LSs('bq-notrack', e.target.checked ? '1' : '0'); ov.querySelector('#bqtMsg').textContent = e.target.checked ? '✓ 이 기기 방문 기록을 껐습니다' : '✓ 이 기기 방문 기록을 다시 켰습니다'; };
    var go = ov.querySelector('#bqtGo'); go.onclick = function () { var tx = ov.querySelector('#bqtTx').value.trim(); var msg = ov.querySelector('#bqtMsg'); if (tx.length < 5) { msg.textContent = '⚠ 문의 글을 5자 넘게 적어 주세요'; return; } if (PV) { msg.textContent = '👀 미리 보기라 보내지 않습니다'; return; } go.disabled = true; msg.textContent = '보내는 중…';
      var tk = LSg('bq-tok') || ''; fetch(API + '/shop/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tx: tx, kind: ov.querySelector('#bqtK').value, ct: ov.querySelector('#bqtCt').value.trim(), no: ov.querySelector('#bqtNo').value.trim(), id: bk ? bk.id : '', t: bk ? bk.t : '', hp: ov.querySelector('#bqtHp').value, tk: /^u_[0-9a-f]{16}\.[0-9a-f]{32}$/.test(tk) ? tk : '' }) })
        .then(function (r) { return r.json(); }).then(function (j) { if (!j || !j.ok) throw new Error((j && j.err) || '보내지 못했습니다'); var L = myAsks(); L.unshift({ aid: j.aid, t: j.t, at: new Date().toISOString(), tx: tx.slice(0, 60) }); LSs('bq-asks', JSON.stringify(L.slice(0, 30))); msg.textContent = '✓ 문의를 받았습니다(번호 ' + j.aid + ') — 답이 오면 아래 「내 문의」에 나옵니다'; ov.querySelector('#bqtTx').value = ''; go.disabled = false; mine(); })
        .catch(function (e) { go.disabled = false; msg.textContent = '⚠ ' + (e.message || '보내지 못했습니다 — 잠시 뒤 다시'); }); };
    function mine() { var L = myAsks(); var box = ov.querySelector('#bqtMy'); if (!L.length) { box.innerHTML = ''; return; } box.innerHTML = '<b>내 문의</b> <small>(이 기기에서 남긴 것)</small>' + L.slice(0, 10).map(function (x) { return '<div data-aid="' + esc(x.aid) + '"><small>' + esc(String(x.at).slice(0, 10)) + ' · ' + esc(x.aid) + '</small><div>' + esc(x.tx) + '</div><div class="ans"><small>답 확인 중…</small></div></div>'; }).join('');
      L.slice(0, 10).forEach(function (x) { fetch(getBase() + '/shop/ask?aid=' + encodeURIComponent(x.aid) + '&t=' + encodeURIComponent(x.t)).then(function (r) { return r.json(); }).then(function (j) { var el = box.querySelector('[data-aid="' + x.aid + '"] .ans'); if (!el) return; el.innerHTML = j && j.ok ? (j.ans && j.ans.length ? j.ans.map(function (a) { return '<div class="a">🏪 ' + esc(a.tx) + ' <small>' + esc(String(a.at).slice(0, 10)) + '</small></div>'; }).join('') : '<small>' + (j.st === 'done' ? '끝난 문의' : '아직 답이 없습니다') + '</small>') : '<small>찾을 수 없음</small>'; }).catch(function () {}); }); }
    mine(); setTimeout(function () { var t = ov.querySelector('#bqtTx'); if (t) t.focus(); }, 30); }
  /* 개인정보 처리방침 — 방문·이용 기록 칸을 더함(보존 기간은 설정 그대로) */
  function privSoon() { var n = 0; var t = setInterval(function () { n++; var a = D.querySelector('#main article.doc'); if (a || n > 40) { clearInterval(t); if (a) privAdd(a); } }, 100); }
  function privAdd(a) { if (a.querySelector('#bqtPriv')) return; var c = BQT.cfg || {}; var tr = c.trk || {}; var keep = +tr.keep || 365;
    a.querySelectorAll('h3').forEach(function (h) { if (/^6\./.test(h.textContent) && h.nextElementSibling) h.nextElementSibling.textContent = '이 화면은 장바구니·찜·최근 본 책·「내 주문」·「내 문의」 조회 주소, 로그인 열쇠(로그인했을 때), 그리고 방문 셈에 쓰는 무작위 기기 번호만 손님 기기(브라우저 저장소)에 둡니다. 광고 추적은 쓰지 않습니다.'; });
    var d = D.createElement('div'); d.id = 'bqtPriv'; d.innerHTML = '<h3>8. 방문·이용 기록</h3><p>가게를 더 편하게 고치려고 어떤 화면을 몇 번 보았는지, 어떤 낱말로 찾았는지, 어디에서 들어왔는지(주소의 도메인만), 기기 종류·화면 폭을 셉니다. IP 주소·이름·연락처는 이 셈에 쓰지 않고 저장하지 않으며, 셈은 날짜별 합계로만 남습니다.</p>'
      + '<p>' + (tr.ua === 0 ? '로그인한 회원의 활동 기록은 남기지 않습니다.' : '회원으로 로그인했을 때는 본 상품·찾기·장바구니·주문 활동을 회원 번호와 함께 남겨 주문·문의 응대와 추천·화면 개선에 씁니다. 보관 기간은 <b>' + keep + '일</b>이며 지나면 운영 화면에서 보이지 않게 하고 파기합니다. 브라우저의 「추적 안 함」을 켰거나 💬 문의 창에서 「이 기기 방문 기록 끄기」를 고르시면 남기지 않습니다.') + '</p>'
      + '<p>💬 문의에 적으신 글·연락처는 답을 드리는 데만 쓰고, 소비자 불만·분쟁 처리 기록으로 3년 보관한 뒤 파기합니다.</p>';
    var ref = null; a.querySelectorAll('h3').forEach(function (h) { if (/^7\./.test(h.textContent)) ref = h; }); if (ref) a.insertBefore(d, ref); else a.appendChild(d); }
  BQT.privAdd = privAdd;

  function boot() { try { addCss(); } catch (e) {} W.addEventListener('hashchange', onRoute); onRoute();
    cfgGet().then(function (c) { if (!c) return; try { banner(c); } catch (e) {} try { askUi(); } catch (e) {} if (route().name === 'p' && route().arg === 'privacy') privSoon(); });
    setInterval(function () { if (BQT.q.length) send(); }, 15e3);
    D.addEventListener('visibilitychange', function () { if (D.visibilityState === 'hidden') { if (!off()) BQT.q.push(['x', route().name in NAMES ? route().name : 'etc', '', Date.now()]); send(true); } });
    W.addEventListener('pagehide', function () { send(true); }); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
})();

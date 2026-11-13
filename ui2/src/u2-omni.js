/* 리드나우 2 — 🛒 통합 판매처(0.4.12 · 통합 솔루션 · 약속 50 '모든 화면 2번 누름 안'·53)
 * 알라딘·예스24·네이버·우리숍 네 판매처를 한 화면 흐름으로 — 지금 웹앱 🧾 통합 장부 셈(ledNow · ledTodoNow · ledOrdRows · S.omni.recon)과 🚚 오늘 출고 셈(shipCnt)을 '읽기만'
 *  ① 🛒 판매처 상황판(chboard): 판매처마다 한 줄 = 판매중 · 처리할 주문(오늘 출고 남은) · 진행 주문(30일) · 🔻 재고 어긋남(팔렸는데 다른 판매처에 남은 것 + 🔍 재고 맞추기) · 30일 주문
 *     칸을 누르면 그 일 화면(오늘 출고 그 판매처 · 주문 모음 그 판매처 · 🛠 처리할 일 · 그 판매처 운영 화면)으로 한 번에
 *  ② 🔍 상품 하나 · 모든 판매처(prodch): 제목·ISBN·SKU로 찾거나 어긋난 책을 고르면 네 판매처의 값·재고·판매중/중지를 한 카드에 · 어긋남은 빨강 · 그 판매처 화면·통합 장부로 한 번에
 * 성공 사례 본뜸(readnow-chats research/BENCH/engine adoptions.json U15~U21): eBay Seller Hub·네이버 센터 홈(할 일 숫자 맨 위) · Linnworks Insights(판매처 하나만 떼어 봄) ·
 *   LinnLive 재고 격자(판매처별 칸 · 오류 빨강) · Linnworks 연결(Not Linked) · Shopify 상품 Publishing 카드(상품 하나에 판매처 목록) · 사방넷·고도몰(한 곳 팔리면 다른 곳 내림)
 * 쓰기 없음 — 고치기는 지금 웹앱 🛠 처리할 일 화면에서(쓰기 허락은 그 화면 몫 · 시범 중 기본 막힘) · 기기 저장 rn2-prodch:<페이지>:<위젯>(고른 책 열쇠)만 */
(function () {
  'use strict';
  const U2 = (window.U2 = window.U2 || {});
  const W = window.U2W; if (!W) return;
  const esc = (s) => U2.esc(s);
  const n0 = (v) => (typeof v === 'number' && isFinite(v) ? v.toLocaleString() : '—');
  const won = (v) => (+v ? Math.round(+v).toLocaleString() + '원' : '—');
  const O = (U2.omni = {});
  /* 네 판매처 — 지금 웹앱 열쇠(장부) · 출고 칩 열쇠(shipCnt) · 그 판매처 화면 */
  O.CH = [
    { k: 'aladin', ship: 'al', ic: '🟥', n: '알라딘', scr: 'prodAll', scrT: '📚 상품 전체' },
    { k: 'yes24', ship: 'y24', ic: '🟦', n: '예스24', scr: 'y24Ops', scrT: '🧰 예스24 운영' },
    { k: 'naver', ship: 'nv', ic: '🟩', n: '네이버', scr: '', scrT: '📋 네이버 주문 모음' },
    { k: 'shop', ship: 'shop', ic: '🛍', n: '우리숍', scr: 'shopAdm', scrT: '🛍 우리숍 주문' },
  ];
  const T0 = (f, d) => { try { return f(); } catch (e) { return d; } };
  O.ok = (kind) => !!(U2.legacy && U2.legacy.ready) && !U2.safe && (!U2.adapters || !U2.adapters.kindOk || U2.adapters.kindOk(kind));
  /* 한 번 셈(지금 웹앱 함수 그대로 · 같은 장부 열쇠면 지금 웹앱이 셈을 다시 하지 않음) */
  O.snap = (kind) => {
    const out = { ok: O.ok(kind), V: null, todo: [], ord: [], recon: [], ship: null, loaded: false, err: '' };
    if (!out.ok) return out;
    out.loaded = T0(() => !!S.prodLoaded, false);
    out.V = T0(() => (typeof ledNow === 'function' ? ledNow() : null), null); if (!out.V) out.err = '통합 장부 셈을 읽지 못함';
    out.todo = T0(() => (typeof ledTodoNow === 'function' ? ledTodoNow() : typeof ledTodo === 'function' && out.V ? ledTodo(out.V) : []), []) || [];
    out.ord = T0(() => (typeof ledOrdRows === 'function' ? ledOrdRows() : []), []) || [];
    out.recon = T0(() => (((S.omni || {}).recon || {}).bad || []).filter((b) => b && (b.kind === 'gone' || b.kind === 'alsold')), []);
    out.ship = T0(() => ((S.ship || S.shipC) && typeof shipCnt === 'function' ? shipCnt() : null), null);
    /* (0.4.13 · 지금 웹앱 1.78.512 🔁 사후 확인 · 1.78.504 🔍 실사 목록 따라 들임) 지금 웹앱 셈 그대로 — 없는 판이면 null(줄을 숨김) */
    out.rc = T0(() => (typeof rcBad === 'function' ? rcBad() : null), null);
    out.aud = out.loaded ? T0(() => (typeof ledAuditNow === 'function' ? ledAuditNow() : null), null) : null;
    return out;
  };
  const LEFT = ['confirm', 'deliv', 'printed', 'sending'];
  O.line = (X, c) => {
    const chs = (X.V && X.V.chs) || []; const cf = chs.find((z) => z.k === c.k) || {}; const sm = (X.V && X.V.sum && X.V.sum[c.k]) || null;
    const todo = X.todo.filter((t) => (t.acts || []).some((a) => a.ch === c.k)).length + X.todo.filter((t) => t.over && (t.from || []).includes(c.k)).length;
    const rc = X.recon.filter((b) => (b.ch || (b.kind === 'alsold' ? 'aladin' : 'yes24')) === c.k).length;
    const sc = X.ship && X.ship[c.ship]; const ship = sc ? LEFT.reduce((a, k) => a + (sc[k] || 0), 0) : null;
    const open = X.ord.filter((o) => o.ch === c.k && o.st === 'open').length;
    const has = !!(sm && (sm.live || sm.ord)) || open > 0 || !!ship;
    const after = (X.rc || []).filter((x) => x && x.e && x.e.ch === c.k).length; /* 🔁 사후 확인 어긋남(이 판매처) */
    return { c, name: cf.n || c.n, ic: cf.ic || c.ic, on: cf.on == null ? 1 : cf.on, plan: cf.plan || '', live: sm ? sm.live : null, ord30: sm ? sm.ord : null, amt: sm ? sm.amt : null, open, todo, rc, after, mis: todo + rc, ship, has };
  };
  /* 이동 — 모두 지금 웹앱 화면을 그대로 엶(새로 그리지 않음) */
  const L = () => U2.legacy;
  O.bt = (q, f) => { T0(() => { const cur = S._bt_ledger || {}; S._bt_ledger = Object.assign({}, cur, { q: q || '', f: Object.assign({}, f || {}), lim: 200 }); }); };
  O.ledger = (view, q, f) => { if (!O.ok('chboard')) return U2.toast('지금 웹앱을 아직 불러오지 못함 — 잠시 뒤 다시', 1); T0(() => { S._ledView = view || 'all'; }); O.bt(q, f); return L().screen('ledger'); };
  O.go = (what, ck, q) => {
    const c = O.CH.find((x) => x.k === ck) || null;
    try {
      if (what === 'ship') { if (!O.ok('chboard')) return U2.toast('지금 웹앱을 아직 불러오지 못함', 1); L().userAt = performance.now(); U2.setCtx('screen:ship'); S.shipTab = 'deliv'; if (c) S.shipSrc = c.ship; return openShip(); }
      if (what === 'ord') return O.ledger('ord', '', c ? { och: 'c_' + c.k, ost: 's_open' } : { ost: 's_open' });
      if (what === 'todo') return O.ledger('todo', q || '', {});
      if (what === 'all') return O.ledger('all', q || '', {});
      if (what === 'ch' && c) return c.scr ? L().screen(c.scr) : O.ledger('ord', '', { och: 'c_' + c.k });
      if (what === 'prod' && q) { if (typeof openProduct !== 'function') return O.ledger('all', q, {}); L().userAt = performance.now(); U2.setCtx('screen:prodAll'); return openProduct(q); }
      if (what === 'y24' && q) { T0(() => { const cur = S._bt_y24 || {}; S._bt_y24 = Object.assign({}, cur, { q, lim: 200 }); }); return L().screen('y24All'); }
    } catch (e) { U2.toast('열지 못함: ' + U2.errKo(e), 1); }
  };

  /* ═══ ① 🛒 판매처 상황판 ═══ */
  W.def('chboard', { name: '판매처 상황판', group: '자료 보기', icon: '🛒', w: 24, h: 14, minH: 8, autoH: true /* 판매처 줄 수·휴대폰 칸 높이에 따라 칸이 저절로 맞음 */, props: [{ k: 'cols', label: '보일 칸', type: 'select', opts: { all: '모두(판매중·처리할 주문·진행 주문·어긋남·30일 주문)', todo: '할 일만(처리할 주문·진행 주문·어긋남)' }, def: 'all' }, { k: 'hideOff', label: "자료 없는 '준비 중' 판매처 숨김", type: 'check', def: false }],
    render(b, p, ctx) {
      const X = O.snap('chboard'); const all = p.cols !== 'todo';
      const rows = O.CH.map((c) => O.line(X, c)).filter((r) => !(p.hideOff && !r.on && !r.has));
      const tot = rows.reduce((a, r) => a + (r.ship || 0) + r.mis, 0);
      const SH = { live: '판매중', ship: '처리', ord: '진행', todo: '🔻 어긋남', ord30: '30일' }; /* 좁은 화면(휴대폰)용 짧은 이름 */
      const cell = (k, v, t, hot, ttl) => `<button type="button" class="u2-cbv ${hot && v ? 'u2-hot' : ''}" data-cb="${k}" ${X.ok ? '' : 'disabled'} title="${esc(ttl)}"><small><span class="u2-cbl">${esc(t)}</span><span class="u2-cbs">${esc(SH[k] || t)}</span></small><b>${v == null ? '—' : n0(v)}</b></button>`;
      /* (0.4.13) 아래 한 줄 — 🔁 사후 확인 어긋남(재고 자동 처리 뒤 다시 읽었더니 판매처가 실물과 다름) · 🔍 실사 목록 · 판매처별 숫자 · 누르면 지금 웹앱 🧾 통합 장부 그 보기 */
      const nRc = X.rc ? X.rc.length : null, nAud = X.aud ? X.aud.length : null;
      const byCh = rows.filter((r) => r.after).map((r) => `${esc(r.ic)}${n0(r.after)}`).join(' ');
      const foot = X.ok && (nRc != null || nAud != null) ? `<div class="u2-row u2-cbf">${nRc != null ? `<button type="button" class="u2-chip ${nRc ? 'u2-hot' : ''}" data-cb="rc" title="재고 자동 처리(자동 내림·밀린 일·재고 맞추기·처리할 일 맡기기) 뒤 다음 날·3·7·30일에 판매처를 다시 읽었더니 수량·판매상태가 실물과 다른 것(확인함 전) — 이중 판매·묻힌 책 막기 · 🧾 통합 장부 › 🔁 사후 확인">🔁 사후 확인 어긋남 <b>${n0(nRc)}</b>${byCh ? ` <small>${byCh}</small>` : ''}</button>` : ''}${nAud != null ? `<button type="button" class="u2-chip ${nAud ? 'u2-hot' : ''}" data-cb="aud" title="주문 없이 알라딘 개별 상품 수량이 우리 SKU 수보다 많은 실물 — 실사로만 알 수 있어 엔진이 알라딘을 내리지 않음 · 🧾 통합 장부 › 🔍 실사 목록">🔍 실사 필요 <b>${n0(nAud)}</b></button>` : ''}</div>` : '';
      const note = !X.ok ? '지금 웹앱을 불러오지 못해 숫자를 볼 수 없음 — 판매처 칸은 지금 웹앱이 서면 채워짐' : !X.loaded ? '상품 기록을 받는 중 — 판매중·어긋남 숫자는 받은 뒤 채워짐(칸을 누르면 그 화면이 열리고 받기 시작)' : X.err ? '⚠ ' + X.err : '';
      b.innerHTML = `<div class="u2-cb"><div class="u2-cbh"><b>🛒 판매처 상황판</b> <span class="u2-sub">처리할 것</span> <span class="u2-sbn ${tot ? 'u2-t-red' : 'u2-t-cloth'}">${X.ok ? n0(tot) : '—'}</span><button type="button" class="u2-btn u2-cbled" data-cb="all" ${X.ok ? '' : 'disabled'} title="모든 판매처 실물 한 권 = 한 줄">🧾 통합 장부 ›</button></div>
        <div class="u2-cbt" role="table" aria-label="판매처 상황판">${rows.map((r) => `<div class="u2-cbr ${r.on || r.has ? '' : 'u2-cboff'}" role="row" data-ch="${r.c.k}">
          <button type="button" class="u2-cbn" data-cb="ch" ${X.ok ? '' : 'disabled'} title="${esc(r.c.scrT)} 열기">${esc(r.ic)} <b>${esc(r.name)}</b>${!r.on && !r.has ? `<small>준비 중</small>` : ''}</button>
          ${all ? cell('live', r.live, '판매중', false, r.name + ' 판매중 매물 수(통합 장부 셈)') : ''}
          ${cell('ship', r.ship, '처리할 주문', true, '🚚 오늘 출고 — ' + r.name + '만(확인·준비·인쇄·보내는 중)' + (r.ship == null ? ' · 출고 기록을 아직 받지 않음' : ''))}
          ${cell('ord', r.open, '진행 주문', false, '📋 주문 모음 — ' + r.name + ' 30일 진행 중 주문')}
          ${cell('todo', r.mis, '🔻 재고 어긋남', true, '🛠 처리할 일 — 한 판매처에서 팔렸는데 ' + r.name + '에 수량·판매상태가 아직 남은 것' + (r.rc ? ' · 🔍 재고 맞추기 ' + r.rc : '') + (r.after ? ' · 🔁 사후 확인 어긋남 ' + r.after + '(아래 줄)' : ''))}
          ${all ? cell('ord30', r.ord30, '30일 주문', false, r.name + ' 최근 30일 주문 수' + (r.amt ? ' · ' + won(r.amt) : '')) : ''}</div>`).join('')}</div>
        ${foot}${note ? `<div class="u2-sub u2-cbnote">${esc(note)}</div>` : ''}</div>`;
      b.querySelectorAll('[data-cb]').forEach((x) => (x.onclick = () => { if (ctx.edit) return; const r = x.closest('[data-ch]'); const ck = r ? r.dataset.ch : ''; const k = x.dataset.cb;
        if (k === 'rc' || k === 'aud') return O.ledger(k);
        if (k === 'all') return O.go('all'); if (k === 'ship') return O.go('ship', ck); if (k === 'ord' || k === 'ord30') return O.go('ord', ck); if (k === 'todo') return O.go('todo'); return O.go('ch', ck); }));
      return { dyn: true };
    } });

  /* ═══ ② 🔍 상품 하나 · 모든 판매처 ═══ */
  O.search = (V, q, n) => { const s = String(q || '').trim().toLowerCase(); if (!V || !s) return []; const out = [];
    for (const r of V.rows || []) { const t = [r.title, r.isbn, r.sku, r.key, ...Object.values(r.ch || {}).map((v) => v && v.no)].join(' ').toLowerCase(); if (t.indexOf(s) >= 0) { out.push(r); if (out.length >= (n || 6)) break; } } return out; };
  O.card = (X, r) => {
    const chs = (X.V && X.V.chs) || []; const T = X.todo.find((t) => t.key === r.key) || null; const acts = (r.mc && r.mc.acts) || [];
    const prices = O.CH.map((c) => r.ch && r.ch[c.k] && r.ch[c.k].live ? +r.ch[c.k].price || 0 : 0).filter(Boolean); const pdiff = prices.length > 1 && Math.max(...prices) !== Math.min(...prices);
    const col = (c) => { const cf = chs.find((z) => z.k === c.k) || {}; const v = r.ch ? r.ch[c.k] : null; const a = acts.find((x) => x.ch === c.k) || null; const on = cf.on == null ? 1 : cf.on;
      const st = v ? String(v.st || (v.live ? '판매중' : '판매 안 함')) : on ? '올라 있지 않음' : '준비 중';
      const go = v && c.k === 'aladin' && v.id ? `data-pgo="prod" data-q="${esc(v.id)}"` : v && c.k === 'yes24' && v.no ? `data-pgo="y24" data-q="${esc(v.no)}"` : `data-pgo="all" data-q="${esc(r.sku || r.key)}"`;
      return `<div class="u2-pcc ${v && v.live ? 'u2-pclive' : ''} ${a ? 'u2-pcact' : ''} ${!v ? 'u2-pcnone' : ''}" data-ch="${c.k}"><div class="u2-pch">${esc(cf.ic || c.ic)} <b>${esc(cf.n || c.n)}</b></div>
        <div class="u2-pcs">${v && v.live ? '🟢' : v ? '⏸' : '○'} ${esc(st)}</div><div class="u2-pcn"><span>값 <b>${v ? won(v.price) : '—'}</b></span><span>재고 <b>${v ? n0(+v.qty || 0) : '—'}</b></span></div>
        ${a ? `<div class="u2-pca" title="${esc(a.why || '')}">🔻 ${a.k === 'down' ? '내릴 일(판매중지)' : '수량 ' + esc(a.to) + '권으로'}</div>` : ''}
        <button type="button" class="u2-btn u2-pcgo" ${go}>${v ? '열기 ›' : '장부에서 ›'}</button></div>`; };
    const risk = (r.risk || []).filter((x) => !/^🔻/.test(x));
    return `<div class="u2-pcard"><div class="u2-pct"><b>${esc(r.title || '(제목 없음)')}</b> <small class="u2-sub">${r.sku ? 'SKU ' + esc(r.sku) : ''}${r.isbn ? ' · ISBN ' + esc(r.isbn) : ''}${r.mc ? ` · 실물 ${n0(r.mc.P)}권 · 14일 ${n0(r.mc.sold)}권 팔림 → 남은 ${n0(r.mc.rem)}권` : ''}</small></div>
      ${risk.length || pdiff ? `<div class="u2-pcr">${risk.map((x) => `<span class="u2-pcrb">${esc(x)}</span>`).join('')}${pdiff ? `<span class="u2-pcrb u2-pcrp" title="판매중인 판매처마다 값이 다름(판매처별 판매가 — 일부러 다르게 둔 것일 수 있음)">💱 값 차이 ${won(Math.min(...prices))}~${won(Math.max(...prices))}</span>` : ''}</div>` : ''}
      <div class="u2-pcg">${O.CH.map(col).join('')}</div>
      <div class="u2-row u2-pcf"><button type="button" class="u2-btn" data-pgo="all" data-q="${esc(r.sku || r.key)}">🧾 통합 장부에서 이 책 ›</button>${T || acts.length ? `<button type="button" class="u2-btn u2-pri" data-pgo="todo" data-q="${esc(r.sku || r.key)}" title="고치기는 지금 웹앱 🛠 처리할 일에서(이 카드는 읽기만)">🛠 처리할 일에서 고치기 ›</button>` : '<span class="u2-sub">✓ 판매처끼리 어긋남 없음</span>'}</div></div>`;
  };
  const QS = new Map(); /* 위젯마다 찾는 글(이 화면 동안만) */
  W.def('prodch', { name: '상품 하나 · 모든 판매처', group: '자료 보기', icon: '🔍', w: 24, h: 18, minH: 10, autoH: true /* 고른 책 카드가 생기면 칸이 저절로 늘어남 */, props: [{ k: 'ph', label: '찾기 칸 안내 글', type: 'text', def: '제목·ISBN·SKU·예스24 번호' }, { k: 'pick', label: "빈 칸일 때 '어긋난 책' 고르기 줄 보이기", type: 'check', def: true }],
    render(b, p, ctx) {
      const key = 'prodch:' + (ctx.page || '') + ':' + (ctx.wid || ''); const qk = key; let tm = null;
      b.innerHTML = `<div class="u2-pc"><div class="u2-row u2-pcq"><b>🔍 상품 하나 · 모든 판매처</b><input class="u2-in" type="search" placeholder="${esc(p.ph)}" aria-label="${esc(p.ph)}" value="${esc(QS.get(qk) || '')}" ${ctx.edit ? 'disabled' : ''}></div><div class="u2-pcbody"></div></div>`;
      const inp = b.querySelector('input'); const body = b.querySelector('.u2-pcbody');
      const draw = () => { if (!body.isConnected) return; const X = O.snap('prodch'); const q = String(inp.value || '').trim(); QS.set(qk, q); const sel = U2.ls.get(key, null);
        if (!X.ok) { body.innerHTML = '<div class="u2-empty">지금 웹앱을 불러오지 못해 판매처 상태를 볼 수 없음</div>'; return; }
        const rows = X.V ? X.V.rows || [] : []; const cur = sel ? rows.find((r) => r.key === sel) : null;
        const found = q ? O.search(X.V, q, 6) : []; const picks = !q && p.pick ? X.todo.slice(0, 6).map((t) => rows.find((r) => r.key === t.key)).filter(Boolean) : [];
        const list = (L0, h) => (L0.length ? `<div class="u2-pcl"><small class="u2-sub">${esc(h)}</small>${L0.map((r) => `<button type="button" class="u2-chip ${cur && cur.key === r.key ? 'u2-on' : ''}" data-pk="${esc(r.key)}" title="${esc(r.title)}">${esc(String(r.title || r.key).slice(0, 28))}${(r.on || []).length ? ` <b>${(r.on || []).length}곳</b>` : ''}</button>`).join('')}</div>` : '');
        const hint = !X.loaded ? '상품 기록을 받는 중 — 받은 뒤 찾기가 채워짐' : q && !found.length ? `'${q}' — 통합 장부에 맞는 책이 없음(제목 일부·ISBN·SKU로 다시)` : !cur && !picks.length ? '책을 찾으면 알라딘·예스24·네이버·우리숍의 값·재고·판매 상태가 한 카드에 보임' : '';
        body.innerHTML = (q ? list(found, '찾은 책 — 눌러서 카드로') : list(picks, '🔻 판매처끼리 어긋난 책 — 눌러서 카드로')) + (cur ? O.card(X, cur) : '') + (hint ? `<div class="u2-sub u2-pchint">${esc(hint)}</div>` : '');
        body.querySelectorAll('[data-pk]').forEach((x) => (x.onclick = () => { if (ctx.edit) return; U2.ls.set(key, x.dataset.pk); draw(); }));
        body.querySelectorAll('[data-pgo]').forEach((x) => (x.onclick = () => { if (ctx.edit) return; const r = x.closest('[data-ch]'); O.go(x.dataset.pgo, r ? r.dataset.ch : '', x.dataset.q); })); };
      let t2 = null; inp.addEventListener('input', () => { clearTimeout(t2); t2 = setTimeout(draw, 250); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const f = body.querySelector('[data-pk]'); if (f) f.click(); } });
      draw(); tm = setInterval(() => { if (!document.hidden && document.activeElement !== inp) draw(); }, 20e3); /* 장부가 바뀌면(반영 확인) 카드도 — 찾는 중엔 건드리지 않음 */
      return () => { clearInterval(tm); clearTimeout(t2); };
    } });
})();

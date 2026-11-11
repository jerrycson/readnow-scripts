/* 🛍 북스퀸(booksqueen.com) 손님 화면 — 휴대폰 먼저 · 외부 라이브러리 없음 · 손님 정보는 이 기기에 남기지 않음(장바구니·주문 조회 주소만)
 *  자료는 클라우드 창구(/shop/*)에서만 받음 — Firestore를 직접 읽지 않음(관리 자료가 손님 브라우저로 새는 길 0)
 *  참고한 사례: 자사몰 헌책방(책마다 실물 사진·등급 풀이·'한 권뿐') · AbeBooks(판매자 상태 설명·같은 책 다른 매물) · Shopify 기본 체크아웃(한 화면 주문서·비회원 주문·주문 확인 주소) */
(function () {
  'use strict';
  const B = window.BQ; const { won, esc } = B;
  const API = (window.BQ_API || 'https://readnow-cloud-63884079760.asia-northeast3.run.app').replace(/\/+$/, '');
  const $ = (s, r) => (r || document).querySelector(s); const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const ST = { cfg: null, cfgAt: 0, list: null, busy: false };
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const cart = () => LS.get('bq-cart', []); const setCart = (c) => { LS.set('bq-cart', c); badge(); };
  async function api(path, opt) { const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
    try { const r = await fetch(API + path, { ...(opt || {}), signal: ctl.signal, headers: { 'Content-Type': 'application/json' } }); let j = null; try { j = await r.json(); } catch (e) {} if (!r.ok || !j || j.ok === false) { const e = new Error((j && j.err) || '연결이 잠시 안 됩니다'); e.j = j; e.status = r.status; throw e; } return j; }
    catch (e) { if (e.name === 'AbortError') throw new Error('응답이 늦습니다 — 잠시 뒤 다시 해 주세요'); if (e instanceof TypeError) throw new Error('인터넷 연결을 확인해 주세요'); throw e; } finally { clearTimeout(t); } }
  async function cfg(force) { if (!force && ST.cfg && Date.now() - ST.cfgAt < 60e3) return ST.cfg; ST.cfg = await api('/shop/cfg'); ST.cfgAt = Date.now(); foot(); return ST.cfg; }
  let tT = null; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tT); tT = setTimeout(() => t.classList.remove('on'), 2600); }
  /* 두 번 눌러 확정(브라우저 확인 창 없음) */
  function twice(btn, msg) { if (btn.dataset.arm === '1') { btn.dataset.arm = ''; return true; } btn.dataset.arm = '1'; const o = btn.textContent; btn.textContent = msg; btn.classList.add('arm'); setTimeout(() => { if (btn.dataset.arm === '1') { btn.dataset.arm = ''; btn.textContent = o; btn.classList.remove('arm'); } }, 4000); return false; }
  function badge() { const n = cart().length; const b = $('#cartN'); if (b) { b.textContent = n; b.hidden = !n; } }
  const main = () => $('#main');
  const loading = (n) => `<div class="grid">${Array.from({ length: n || 6 }, () => '<div class="card sk"><div class="im"></div><div class="tx"><i></i><i></i></div></div>').join('')}</div>`;
  const errBox = (e, again) => `<div class="err"><b>⚠ ${esc(e.message || e)}</b><button class="btn ghost" id="again">다시 해 보기</button></div>`;
  const bindAgain = (fn) => { const a = $('#again'); if (a) a.onclick = fn; };
  const gTag = (g) => (g ? `<span class="g g-${esc(g)}" title="${esc(B.gradeOf(g)[1])}">${esc(g)}</span>` : '');
  const cardH = (x) => `<a class="card${x.st === 'o' ? ' held' : ''}" href="#/b/${encodeURIComponent(x.id)}"><div class="im">${x.im ? `<img loading="lazy" src="${esc(x.im)}" alt="">` : '<span class="noim">📕</span>'}${x.st === 'o' ? '<span class="hold">주문 중</span>' : ''}</div>
    <div class="tx"><div class="t">${esc(x.t)}</div>${x.a ? `<div class="a">${esc(x.a)}</div>` : ''}<div class="pr">${gTag(x.g)}<b>${won(x.p)}</b>${B.offPct(x.p, x.lp) ? `<small class="off">${B.offPct(x.p, x.lp)}%</small>` : ''}</div></div></a>`;
  function closedBar(c) { if (c.open) return c.notice ? `<div class="bar info">📢 ${esc(c.notice)}</div>` : ''; return `<div class="bar wait">🛠 <b>곧 문을 엽니다</b> — 지금은 책을 둘러보실 수 있고, 주문은 문을 연 뒤에 받습니다.</div>`; }
  function searchBox(q) { return `<form class="search" id="sf" role="search"><input id="sq" type="search" enterkeyhint="search" placeholder="책 제목 · 지은이 · 출판사 · ISBN" value="${esc(q || '')}" aria-label="책 찾기"><button class="btn" aria-label="찾기">찾기</button></form>`; }
  function bindSearch() { const f = $('#sf'); if (f) f.onsubmit = (e) => { e.preventDefault(); const q = $('#sq').value.trim(); location.hash = '#/list?' + B.qs({ q }); }; }

  async function home() { main().innerHTML = `<section class="hero"><h1>읽은 책, 다음 사람에게</h1><p>한 권 한 권 직접 살펴 등급을 매긴 헌책 — 사진 그대로 보내 드립니다.</p>${searchBox('')}</section><div id="hc">${loading(6)}</div>`; bindSearch();
    try { const [c, L] = await Promise.all([cfg(), api('/shop/list?s=new')]);
      $('#hc').innerHTML = `${closedBar(c)}${(c.cats || []).length ? `<h2>분야</h2><div class="chips">${c.cats.slice(0, 16).map(([k, n]) => `<a class="chip" href="#/list?${B.qs({ c: k })}">${esc(k)} <small>${n}</small></a>`).join('')}</div>` : ''}
        <h2>새로 들어온 책 <a class="more" href="#/list?s=new">전체 ${c.n != null ? c.n.toLocaleString('ko-KR') + '권' : ''} ›</a></h2>${L.items.length ? `<div class="grid">${L.items.slice(0, 12).map(cardH).join('')}</div>` : '<div class="empty">아직 올라온 책이 없습니다</div>'}
        <section class="trust"><div>📷<b>실물 사진</b><small>받으실 그 책을 찍었습니다</small></div><div>🔎<b>등급 풀이</b><small>최상·상·중·하 — 책마다 표시</small></div><div>📦<b>한 권뿐</b><small>주문하면 바로 '주문 중'으로 잡아 둡니다</small></div></section>`; }
    catch (e) { $('#hc').innerHTML = errBox(e); bindAgain(home); } }

  async function list(q) { const p0 = { q: q.q || '', c: q.c || '', g: q.g || '', s: q.s || 'new' };
    main().innerHTML = `${searchBox(p0.q)}<div class="fl"><div class="chips sm">${['', '최상', '상', '중', '하'].map((g) => `<a class="chip${p0.g === g ? ' on' : ''}" href="#/list?${B.qs({ ...p0, g })}">${g || '모든 등급'}</a>`).join('')}</div>
      <select id="srt" aria-label="정렬">${[['new', '새로 들어온 차례'], ['low', '낮은 값 차례'], ['high', '높은 값 차례']].map(([k, n]) => `<option value="${k}"${p0.s === k ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
      <div id="lh" class="lh">${p0.c ? `분야 <b>${esc(p0.c)}</b> <a href="#/list?${B.qs({ ...p0, c: '' })}">✕</a>` : ''}</div><div id="lg">${loading(8)}</div><div id="lm"></div>`; bindSearch();
    $('#srt').onchange = (e) => { location.hash = '#/list?' + B.qs({ ...p0, s: e.target.value }); };
    let page = 0; const grid = $('#lg');
    const load = async () => { try { const r = await api('/shop/list?' + B.qs({ ...p0, p: page })); if (!page) grid.innerHTML = r.items.length ? `<div class="grid">${r.items.map(cardH).join('')}</div>` : `<div class="empty">찾는 책이 없습니다${p0.q ? ` — '${esc(p0.q)}'` : ''}<br><small>낱말을 줄이거나 다른 이름(지은이·출판사)으로 찾아 보세요</small></div>`;
        else $('.grid', grid).insertAdjacentHTML('beforeend', r.items.map(cardH).join(''));
        $('#lh').innerHTML = `${p0.q ? `'${esc(p0.q)}' ` : ''}${p0.c ? `분야 <b>${esc(p0.c)}</b> <a href="#/list?${B.qs({ ...p0, c: '' })}" aria-label="분야 빼기">✕</a> ` : ''}<b>${r.total.toLocaleString('ko-KR')}</b>권`;
        $('#lm').innerHTML = r.more ? '<button class="btn ghost wide" id="more">더 보기</button>' : ''; const m = $('#more'); if (m) m.onclick = () => { page++; m.disabled = true; m.textContent = '불러오는 중…'; load(); }; }
      catch (e) { if (!page) { grid.innerHTML = errBox(e); bindAgain(() => list(q)); } else { toast(e.message); $('#lm').innerHTML = '<button class="btn ghost wide" id="more">더 보기</button>'; $('#more').onclick = () => load(); } } };
    load(); }

  async function item(id) { main().innerHTML = `<div class="det sk"><div class="gal"><div class="ph"></div></div><div class="info"><i></i><i></i><i></i></div></div>`;
    try { const [c, r] = await Promise.all([cfg(), api('/shop/item?' + B.qs({ id }))]); const x = r.item; const pics = [x.im, ...(x.ph || [])].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i); const G = B.gradeOf(x.g); const off = B.offPct(x.p, x.lp); const inCart = cart().some((y) => y.id === x.id);
      document.title = x.t + ' — ' + (c.name || '북스퀸');
      main().innerHTML = `<div class="det"><div class="gal" id="gal">${pics.length ? pics.map((u, i) => `<div class="ph"><img src="${esc(u)}" alt="${i ? '실물 사진 ' + i : '표지'}" ${i ? 'loading="lazy"' : ''}></div>`).join('') : '<div class="ph"><span class="noim">📕</span></div>'}</div>${pics.length > 1 ? `<div class="dots">${pics.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}
        <div class="info"><h1>${esc(x.t)}</h1><div class="meta">${[x.a, x.pb, x.pd ? x.pd.replace('-', '년 ') + '월' : ''].filter(Boolean).map(esc).join(' · ')}</div>
        <div class="price">${x.lp && off ? `<s>${won(x.lp)}</s> <span class="off">${off}%</span><br>` : ''}<b>${won(x.p)}</b></div>
        <div class="gbox">${gTag(x.g)} <b>${esc(G[0])}</b> <span>${esc(G[1])}</span></div>
        <ul class="facts"><li>📦 <b>한 권뿐인 실물</b> — 사진 속 그 책을 보냅니다</li><li>🚚 배송비 ${c.shipFee ? won(c.shipFee) : '없음'}${c.freeOver ? ` · ${won(c.freeOver)} 넘으면 무료` : ''}</li>${x.isbn ? `<li>🔢 ISBN ${esc(x.isbn)}</li>` : ''}${x.c ? `<li>🗂 <a href="#/list?${B.qs({ c: x.c })}">${esc(x.c)}</a></li>` : ''}</ul>
        ${(r.same || []).length ? `<div class="same"><b>같은 책 다른 매물</b>${r.same.map((y) => `<a href="#/b/${encodeURIComponent(y.id)}">${gTag(y.g)} ${won(y.p)}${y.st === 'o' ? ' <small>주문 중</small>' : ''}</a>`).join('')}</div>` : ''}
        <div class="buy">${x.st === 'o' ? '<button class="btn wide" disabled>다른 분이 주문한 책입니다</button>' : !c.open ? '<button class="btn wide" disabled>문을 연 뒤에 주문할 수 있습니다</button>' : inCart ? '<a class="btn wide ghost" href="#/cart">장바구니에 담겨 있음 — 보러 가기</a>' : '<button class="btn ghost" id="add">장바구니</button><button class="btn" id="now">바로 주문</button>'}</div></div></div>`;
      const gal = $('#gal'); if (gal && pics.length > 1) gal.onscroll = () => { const i = Math.round(gal.scrollLeft / gal.clientWidth); $$('.dots i').forEach((d, k) => d.classList.toggle('on', k === i)); };
      const add = (go) => { const r2 = B.cartAdd(cart(), x, c.maxItems); if (r2.why) toast(r2.why); else { setCart(r2.cart); toast('장바구니에 담았습니다'); } if (go) location.hash = '#/order'; else item(id); };
      const a = $('#add'); if (a) a.onclick = () => add(false); const n = $('#now'); if (n) n.onclick = () => add(true); }
    catch (e) { main().innerHTML = errBox(e) + '<p class="center"><a href="#/">첫 화면으로</a></p>'; bindAgain(() => item(id)); } }

  async function cartPage() { let c = null; try { c = await cfg(); } catch (e) { c = { shipFee: 0, open: 0 }; } const L = cart(); const S0 = B.cartSum(L, c);
    main().innerHTML = `<h1 class="pt">장바구니</h1>${L.length ? `<div class="rows">${L.map((x) => `<div class="row"><a href="#/b/${encodeURIComponent(x.id)}" class="ri">${x.im ? `<img src="${esc(x.im)}" alt="">` : '📕'}</a><div class="rt"><a href="#/b/${encodeURIComponent(x.id)}">${esc(x.t)}</a><div>${gTag(x.g)} <b>${won(x.p)}</b></div></div><button class="x" data-del="${esc(x.id)}" aria-label="빼기">✕</button></div>`).join('')}</div>
      <div class="sum"><div><span>책 ${S0.n}권</span><b>${won(S0.sum)}</b></div><div><span>배송비</span><b>${won(S0.fee)}</b></div><div class="tot"><span>합계</span><b>${won(S0.total)}</b></div></div>
      ${c.open ? '<a class="btn wide" href="#/order">주문하기</a>' : '<button class="btn wide" disabled>문을 연 뒤에 주문할 수 있습니다</button>'}<p class="hint">헌책은 모두 한 권뿐이라 장바구니에 담아도 잡아 두지 않습니다 — 주문을 마치면 그때 '주문 중'으로 잡힙니다.</p>`
      : '<div class="empty">장바구니가 비었습니다<br><a class="btn" href="#/">책 둘러보기</a></div>'}`;
    $$('[data-del]').forEach((b) => (b.onclick = () => { setCart(B.cartDel(cart(), b.dataset.del)); cartPage(); })); }

  async function orderPage() { const L = cart(); if (!L.length) { location.hash = '#/cart'; return; } let c; try { c = await cfg(true); } catch (e) { main().innerHTML = errBox(e); bindAgain(orderPage); return; }
    if (!c.open) { main().innerHTML = `${closedBar(c)}<p class="center"><a href="#/cart">장바구니로</a></p>`; return; } const S0 = B.cartSum(L, c);
    const fld = (k, lb, typ, ph, extra) => `<label class="f" data-f="${k}"><span>${lb}</span><input id="f_${k}" type="${typ || 'text'}" ${ph ? `placeholder="${esc(ph)}"` : ''} ${extra || ''}><em></em></label>`;
    main().innerHTML = `<h1 class="pt">주문서</h1><form id="of" novalidate>
      <fieldset><legend>주문하시는 분</legend>${fld('name', '이름', 'text', '', 'autocomplete="name" maxlength="30"')}${fld('phone', '휴대폰', 'tel', '010-0000-0000', 'autocomplete="tel" inputmode="numeric"')}</fieldset>
      <fieldset><legend>받는 분</legend><label class="ck"><input type="checkbox" id="f_same" checked> 주문하시는 분과 같음</label><div id="rcv" hidden>${fld('rname', '이름', 'text', '', 'maxlength="30"')}${fld('rphone', '휴대폰', 'tel', '010-0000-0000', 'inputmode="numeric"')}</div>
        ${fld('zip', '우편번호', 'text', '5자리', 'inputmode="numeric" maxlength="5" autocomplete="postal-code"')}${fld('addr1', '주소', 'text', '도로명 또는 지번 주소', 'autocomplete="address-line1" maxlength="120"')}${fld('addr2', '상세 주소', 'text', '동·호수', 'autocomplete="address-line2" maxlength="80"')}${fld('memo', '배송 메모', 'text', '예) 문 앞에 두세요', 'maxlength="100"')}</fieldset>
      <fieldset><legend>결제</legend>${c.pay.how === 'bank' ? `<div class="pay on">🏦 <b>무통장 입금</b><small>주문을 마치면 계좌를 보여 드립니다 · ${c.payDays}일 안에 입금해 주세요</small></div>${fld('dep', '입금하실 분', 'text', '주문하시는 분과 다르면', 'maxlength="20"')}` : '<div class="pay">⏳ <b>결제 안내 준비 중</b><small>주문을 받으면 가게에서 결제 방법을 연락드립니다</small></div>'}
        <div class="pay off">💳 카드·간편결제 <small>준비 중</small></div></fieldset>
      <fieldset><legend>주문할 책 ${S0.n}권</legend>${L.map((x) => `<div class="ol"><span>${esc(x.t)}</span>${gTag(x.g)}<b>${won(x.p)}</b></div>`).join('')}<div class="sum"><div><span>책값</span><b>${won(S0.sum)}</b></div><div><span>배송비</span><b>${won(S0.fee)}</b></div><div class="tot"><span>합계</span><b>${won(S0.total)}</b></div></div></fieldset>
      <fieldset class="agree"><label class="ck" data-f="agreeP"><input type="checkbox" id="f_agreeP"> (필수) 개인정보 수집·이용 동의 <a href="#/p/privacy" target="_blank">내용 보기</a><em></em></label>
        <div class="hint">모으는 것: 이름·휴대폰·주소(배송용) · 쓰는 곳: 주문 확인·배송·문의 답 · 보관: 거래 기록 보관 기간(전자상거래법 5년) 뒤 파기</div>
        <label class="ck" data-f="agreeT"><input type="checkbox" id="f_agreeT"> (필수) 주문할 책·값·배송비·<a href="#/p/terms" target="_blank">구매 조건(교환·환불)</a>을 확인했습니다<em></em></label></fieldset>
      <input type="text" id="f_hp" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn wide" id="go" type="submit">${won(S0.total)} 주문하기</button><div id="oerr" class="err" hidden></div></form>`;
    const same = $('#f_same'); same.onchange = () => { $('#rcv').hidden = same.checked; };
    ['phone', 'rphone'].forEach((k) => { const el = $('#f_' + k); if (el) el.oninput = () => { el.value = B.phoneFmt(el.value); }; });
    const val = () => { const g = (k) => { const el = $('#f_' + k); return el ? (el.type === 'checkbox' ? el.checked : el.value) : ''; }; return { name: g('name'), phone: g('phone'), same: g('same'), rname: g('rname'), rphone: g('rphone'), zip: g('zip'), addr1: g('addr1'), addr2: g('addr2'), memo: g('memo'), dep: g('dep'), agreeP: g('agreeP'), agreeT: g('agreeT'), hp: g('hp') }; };
    $('#of').onsubmit = async (e) => { e.preventDefault(); const f = val(); const E = B.formCheck(f); $$('[data-f]').forEach((el) => { const m = E[el.dataset.f]; el.classList.toggle('bad', !!m); const em = $('em', el); if (em) em.textContent = m || ''; });
      const ks = Object.keys(E); if (ks.length) { const first = $(`[data-f="${ks[0]}"]`); if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' }); toast('빠진 칸을 채워 주세요'); return; }
      const go = $('#go'); go.disabled = true; go.textContent = '주문 넣는 중…'; $('#oerr').hidden = true;
      try { const r = await api('/shop/order', { method: 'POST', body: JSON.stringify(B.orderBody(f, cart())) }); const mine = LS.get('bq-orders', []).filter((x) => x.no !== r.no); mine.unshift({ no: r.no, t: r.t, at: new Date().toISOString(), total: r.total, n: r.items.length }); LS.set('bq-orders', mine.slice(0, 20));
        setCart([]); location.hash = `#/done/${encodeURIComponent(r.no)}?t=${r.t}&new=1`; }
      catch (er) { go.disabled = false; go.textContent = `${won(S0.total)} 주문하기`; const bad = er.j && er.j.bad; if (bad && bad.length) { const ids = new Set(bad.map((x) => x.id)); setCart(cart().filter((x) => !ids.has(x.id))); }
        $('#oerr').hidden = false; $('#oerr').innerHTML = `<b>⚠ ${esc(er.message)}</b>${bad && bad.length ? `<ul>${bad.map((x) => `<li>${esc(x.t || (L.find((y) => y.id === x.id) || {}).t || x.id)} — ${esc(x.why)}</li>`).join('')}</ul><small>그 책은 장바구니에서 뺐습니다 — 나머지로 다시 주문해 주세요</small> <a href="#/cart">장바구니 보기</a>` : ''}`; } }; }

  async function done(no, q) { main().innerHTML = loading(2);
    try { const o = await api('/shop/order?' + B.qs({ no, t: q.t })); const cxl = o.st === 'new';
      main().innerHTML = `<div class="done">${q.new ? '<div class="ok">✅ 주문을 받았습니다</div>' : ''}<h1 class="pt">주문 ${esc(o.no)}</h1><div class="stt st-${esc(o.st)}">${esc(o.stTxt)}</div>
        ${o.st === 'new' && o.pay && o.pay.how === 'bank' ? `<div class="bank"><div>입금하실 곳</div><b class="acct">${esc(o.pay.bank)} ${esc(o.pay.acct)}</b><div>예금주 ${esc(o.pay.holder)}</div><div class="amt">${won(o.total)}</div><small>${esc(String(o.due || '').slice(0, 10))}까지 · 입금자 ${esc(o.dep)} 이름으로 — 입금이 확인되면 포장해 보내 드립니다</small><button class="btn ghost" id="cp">계좌 번호 복사</button></div>` : o.st === 'new' ? '<div class="bank"><b>결제 안내 준비 중</b><small>가게에서 결제 방법을 연락드립니다</small></div>' : ''}
        ${o.inv ? `<div class="bank">🚚 ${esc(o.inv.courier || '택배')} <b>${esc(o.inv.no)}</b></div>` : ''}${o.cxl ? `<div class="hint">취소 까닭: ${esc(o.cxl)}</div>` : ''}
        <div class="rows">${o.items.map((x) => `<div class="ol"><a href="#/b/${encodeURIComponent(x.id)}">${esc(x.t)}</a>${gTag(x.g)}<b>${won(x.p)}</b></div>`).join('')}</div><div class="sum"><div><span>책값</span><b>${won(o.sum)}</b></div><div><span>배송비</span><b>${won(o.shipFee)}</b></div><div class="tot"><span>합계</span><b>${won(o.total)}</b></div></div>
        <p class="hint">주문하신 분 ${esc(o.name)} · ${esc(String(o.at || '').slice(0, 16).replace('T', ' '))} — 이 화면 주소로 언제든 주문 상태를 볼 수 있습니다(이 기기 「내 주문」에도 남김).</p>
        <div class="acts"><button class="btn ghost" id="lk">조회 주소 복사</button>${cxl ? '<button class="btn ghost bad" id="cx">주문 취소</button>' : ''}<a class="btn" href="#/">계속 둘러보기</a></div></div>`;
      const cp = $('#cp'); if (cp) cp.onclick = () => copy(o.pay.acct.replace(/[^\d-]/g, ''), '계좌 번호를 복사했습니다');
      $('#lk').onclick = () => copy(location.href.replace(/&new=1/, ''), '조회 주소를 복사했습니다');
      const cx = $('#cx'); if (cx) cx.onclick = async () => { if (!twice(cx, '한 번 더 누르면 취소')) return; cx.disabled = true; try { await api('/shop/cancel', { method: 'POST', body: JSON.stringify({ no, t: q.t }) }); toast('주문을 취소했습니다'); done(no, { t: q.t }); } catch (e) { cx.disabled = false; toast(e.message); } }; }
    catch (e) { main().innerHTML = errBox(e) + '<p class="center"><a href="#/my">내 주문</a></p>'; bindAgain(() => done(no, q)); } }
  function copy(t, m) { try { navigator.clipboard.writeText(t).then(() => toast(m), () => toast(t)); } catch (e) { toast(t); } }
  function my() { const L = LS.get('bq-orders', []); main().innerHTML = `<h1 class="pt">내 주문 <small>이 기기에서 한 주문</small></h1>${L.length ? `<div class="rows">${L.map((x) => `<a class="row lk" href="#/done/${encodeURIComponent(x.no)}?t=${esc(x.t)}"><div class="rt"><b>${esc(x.no)}</b><div>${esc(String(x.at).slice(0, 10))} · ${x.n}권 · ${won(x.total)}</div></div><span>›</span></a>`).join('')}</div>` : '<div class="empty">이 기기에서 한 주문이 없습니다<br><small>다른 기기에서 주문했다면 주문 뒤 받은 조회 주소로 보실 수 있습니다</small></div>'}`; }

  async function policy(k) { let c = {}; try { c = await cfg(); } catch (e) {} const z = c.biz || {}; const v = (x) => (x ? esc(x) : '<i>준비 중</i>'); const nm = esc(z.name || c.name || '북스퀸');
    const P = { privacy: ['개인정보 처리방침', `<p>${nm}(이하 '가게')는 개인정보 보호법 제30조에 따라 손님의 개인정보를 아래처럼 처리합니다.</p>
      <h3>1. 모으는 것과 쓰는 곳</h3><p>주문 때: 주문하시는 분·받는 분의 이름, 휴대폰 번호, 주소(우편번호·상세 주소), 배송 메모, 입금하실 분 이름 — 주문 확인·입금 확인·배송·교환·환불·문의 답에만 씁니다. 회원 가입은 없습니다.</p>
      <h3>2. 보관 기간</h3><p>전자상거래 등에서의 소비자보호에 관한 법률에 따라 계약·청약철회·대금 결제·재화 공급 기록 5년, 소비자 불만·분쟁 처리 기록 3년 보관한 뒤 지체 없이 파기합니다.</p>
      <h3>3. 맡기는 곳(위탁)</h3><p>택배사(배송) · Google Firebase(주문 기록 보관 서버) — 결제 대행사(PG)를 쓰게 되면 이 칸에 더합니다.</p>
      <h3>4. 손님의 권리</h3><p>언제든 열람·정정·삭제·처리 정지를 요구하실 수 있습니다 — 아래 연락처로 말씀해 주세요.</p>
      <h3>5. 파기</h3><p>보관 기간이 끝난 기록은 다시 살릴 수 없게 지웁니다.</p><h3>6. 쿠키·기기 저장</h3><p>이 화면은 장바구니와 '내 주문' 조회 주소만 손님 기기(브라우저 저장소)에 둡니다. 광고 추적은 쓰지 않습니다.</p>
      <h3>7. 개인정보 보호책임자</h3><p>${v(z.cpo || z.ceo)} · ${v(z.tel)} · ${v(z.email)}</p><p class="hint">시행 2026-11-11</p>`],
      terms: ['이용약관 · 구매 조건', `<h3>헌책 거래</h3><p>모든 책은 한 권뿐인 중고 실물입니다. 등급(최상·상·중·하)과 사진으로 상태를 알려 드리며, 사진과 설명에 없는 큰 흠이 있으면 교환·환불해 드립니다.</p>
      <h3>주문과 결제</h3><p>주문서를 보내면 그 책은 바로 '주문 중'으로 잡힙니다. 무통장 입금은 ${esc(String(c.payDays || 2))}일 안에 해 주세요 — 기한이 지나면 주문이 취소될 수 있습니다. 드물게 다른 곳에서 먼저 팔린 경우 바로 연락드리고 받은 돈을 모두 돌려 드립니다.</p>
      <h3>청약철회(교환·환불)</h3><p>책을 받은 날부터 7일 안에 청약철회를 하실 수 있습니다(전자상거래법 제17조). 손님 변심일 때 돌려보내는 배송비는 손님이, 책 상태가 설명과 다를 때는 가게가 냅니다. 손님 잘못으로 책이 훼손되면 철회가 어려울 수 있습니다.</p>
      <h3>배송</h3><p>입금 확인 뒤 보통 1~3일(영업일) 안에 보냅니다. 배송비 ${c.shipFee ? won(c.shipFee) : '없음'}${c.freeOver ? ` · ${won(c.freeOver)} 넘으면 무료` : ''}. 제주·도서산간은 추가 배송비가 생길 수 있습니다.</p>
      <h3>분쟁</h3><p>불만·분쟁은 아래 연락처로 먼저 말씀해 주세요. 해결되지 않으면 한국소비자원(1372) 등에 도움을 청하실 수 있습니다.</p>`] };
    const x = P[k] || P.terms; main().innerHTML = `<article class="doc"><h1 class="pt">${x[0]}</h1>${x[1]}</article>`; }
  function foot() { const c = ST.cfg || {}; const z = c.biz || {}; const v = (x) => (x ? esc(x) : '준비 중'); const f = $('#foot'); if (!f) return;
    f.innerHTML = `<div class="fl1"><a href="#/p/terms">이용약관·구매 조건</a><a href="#/p/privacy"><b>개인정보 처리방침</b></a><a href="#/my">내 주문</a></div>
      <div class="biz">상호 ${v(z.name || c.name)} · 대표 ${v(z.ceo)} · 사업자등록번호 ${v(z.no)} · 통신판매업 신고 ${v(z.mo)}<br>주소 ${v(z.addr)} · 전화 ${v(z.tel)} · 메일 ${v(z.email)} · 호스팅 ${esc(z.host || 'Google Firebase')}</div>`; }
  async function render() { const R = B.route(location.hash); document.title = (ST.cfg && ST.cfg.name) || '북스퀸 — 헌책방'; window.scrollTo(0, 0); $$('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.r === R.name));
    if (R.name === 'list') return list(R.q); if (R.name === 'b') return item(R.arg); if (R.name === 'cart') return cartPage(); if (R.name === 'order') return orderPage(); if (R.name === 'done') return done(R.arg, R.q); if (R.name === 'my') return my(); if (R.name === 'p') return policy(R.arg); return home(); }
  window.addEventListener('hashchange', render); badge(); foot(); cfg().catch(() => {}); render();
})();

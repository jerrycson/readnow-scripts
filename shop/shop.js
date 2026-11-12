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
  /* (shelf6) 클라우드가 바쁠 때(429 'Rate exceeded' — 클라우드 한 대가 동시 4개까지만 받음 · 그 429엔 출처(CORS) 머리가 없어 브라우저는 '연결 실패'로만 봄)
   *  ① 읽기(GET)는 booksqueen.com 같은 주소 /shop/…로(Hosting이 클라우드로 넘김 · Firebase CDN이 1분 대신 답함 · 출처 미리 묻기 없음) — 같은 주소가 안 되면(옛 Hosting 설정) 그 화면 동안 클라우드 주소로
   *  ② 읽기에 'Content-Type' 머리를 붙이지 않음(붙이면 브라우저가 요청마다 OPTIONS를 먼저 보내 클라우드 자리를 두 배로 씀)
   *  ③ 읽기가 429·502·503·504·연결 실패면 Retry-After(없으면 1.5·4·8초 + 흔들기)만큼 기다렸다 최대 3번 다시 — 주문(POST)은 다시 보내지 않음(두 번 접수 막기) */
  const SAME = { on: !window.BQ_API && /(^|\.)booksqueen\.(com|web\.app|firebaseapp\.com)$/.test(location.hostname || '') };
  const RETRY_ST = [429, 502, 503, 504]; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function api1(path, opt) { const get = !opt || !opt.method || opt.method === 'GET'; const base = get && SAME.on ? location.origin : API; const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), (opt && opt.ms) || 15000);
    try { const r = await fetch(base + path, { ...(opt || {}), signal: ctl.signal, ...(get ? {} : { headers: { 'Content-Type': 'application/json' } }) }); let j = null; try { j = await r.json(); } catch (e) {}
      if (get && base !== API && (!j || typeof j !== 'object') && r.status !== 429 && r.status < 500) { SAME.on = false; return api1(path, opt); } /* 같은 주소 넘김이 아직 없음(HTML 404 등) → 클라우드 주소로 */
      if (!r.ok || !j || j.ok === false) { const e = new Error((j && j.err) || (r.status === 429 ? '사람이 많아 잠시 기다리는 중입니다' : '연결이 잠시 안 됩니다')); e.j = j; e.status = r.status; e.wait = +(r.headers.get('Retry-After') || 0) * 1000 || (j && j.retry ? j.retry * 1000 : 0); throw e; } return j; }
    catch (e) { if (e.name === 'AbortError') { const x = new Error('응답이 늦습니다 — 잠시 뒤 다시 해 주세요'); x.slow = 1; throw x; } if (e instanceof TypeError) { const x = new Error('인터넷 연결을 확인해 주세요'); x.net = 1; throw x; } throw e; } finally { clearTimeout(t); } }
  async function api(path, opt) { const get = !opt || !opt.method || opt.method === 'GET'; const tries = get && !(opt && opt.retry === false) ? 3 : 0;
    for (let i = 0; ; i++) { try { return await api1(path, opt); }
      catch (e) { const again = i < tries && (e.net || RETRY_ST.includes(e.status)) && navigator.onLine !== false; if (!again) throw e;
        await sleep(Math.min(20000, e.wait || [1500, 4000, 8000][i]) + Math.round(Math.random() * 700)); } } }
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
  const newTag = (x, day) => { const w = x.st !== 'o' && day ? B.ago(x.d, day) : ''; return w ? `<span class="nw${w === '오늘' ? ' td' : ''}">${w === '오늘' ? '오늘 들어옴' : esc(w)}</span>` : ''; };
  /* (11/11 shopc1) 🏷 배지(할인·NEW·추천·희귀·마지막 1권·인기) · 할인가는 원래 값에 줄 긋고 할인율 */
  const priceH = (x) => { const o = B.saleOf(x); return `${gTag(x.g)}${o && o.from === 'p0' ? `<s class="was">${won(o.was)}</s>` : ''}<b>${won(x.p)}</b>${o ? `<small class="off${o.from === 'p0' ? ' sale' : ''}">${o.pct}%</small>` : ''}`; };
  const cardBd = (x, day) => B.badgeH((x.bd || []).filter((k) => !(k === 'new' && x.st !== 'o' && day && B.ago(x.d, day))), 3); /* 'N일 전' 표가 이미 있으면 NEW 배지는 겹쳐 달지 않음(shop4 표 그대로) */
  const cardH = (x, day) => `<a class="card${x.st === 'o' ? ' held' : ''}" href="#/b/${encodeURIComponent(x.id)}"><div class="im">${x.im ? `<img loading="lazy" src="${esc(x.im)}" alt="">` : '<span class="noim">📕</span>'}${x.st === 'o' ? '<span class="hold">주문 중</span>' : ''}${newTag(x, day)}${cardBd(x, day) ? `<span class="bds">${cardBd(x, day)}</span>` : ''}</div>
    <div class="tx"><div class="t">${esc(x.t)}</div>${x.a ? `<div class="a">${esc(x.a)}</div>` : ''}<div class="pr">${priceH(x)}</div></div></a>`;
  function closedBar(c) { if (c.open) return c.notice ? `<div class="bar info">📢 ${esc(c.notice)}</div>` : ''; return `<div class="bar wait">🛠 <b>곧 문을 엽니다</b> — 지금은 책을 둘러보실 수 있고, 주문은 문을 연 뒤에 받습니다.</div>`; }
  function searchBox(q) { return `<form class="search" id="sf" role="search"><input id="sq" type="search" enterkeyhint="search" placeholder="책 제목 · 지은이 · 출판사 · ISBN" value="${esc(q || '')}" aria-label="책 찾기" list="sqs" autocomplete="off"><datalist id="sqs"></datalist><button class="btn" aria-label="찾기">찾기</button></form>`; }
  /* (11/11 shopc1) 🔎 자동완성 — 두 글자부터 0.25초 쉬면 클라우드가 제목·지은이·출판사 낱말을 줌(브라우저 기본 목록 · 기억 2분) */
  const SUG = new Map(); let sugT = null;
  function bindSearch() { const f = $('#sf'); if (f) f.onsubmit = (e) => { e.preventDefault(); const q = $('#sq').value.trim(); location.hash = '#/list?' + B.qs({ q }); };
    const i = $('#sq'), dl = $('#sqs'); if (!i || !dl) return; i.oninput = () => { clearTimeout(sugT); const q = i.value.trim(); if (q.length < 2 || /^\d{5,}$/.test(q)) { dl.innerHTML = ''; return; }
      sugT = setTimeout(async () => { try { let r = SUG.get(q); if (!r) { r = await api('/shop/suggest?' + B.qs({ q })); SUG.set(q, r); if (SUG.size > 60) SUG.delete(SUG.keys().next().value); } if (i.value.trim() !== q) return;
        dl.innerHTML = (r.s || []).map((x) => `<option value="${esc(x.v)}" label="${x.k === 'a' ? '지은이' : x.k === 'pb' ? '출판사' : '제목'} · ${x.n}권"></option>`).join(''); } catch (e) {} }, 250); }; }

  /* (11/11 shop4) 🆕 새로 들어온 책 자동 갱신 — 성공 사례(AbeBooks 'Recently added'·Shopify 'New arrivals'·헌책 자사몰 '오늘 입고'):
   *  첫 화면에 '오늘 N권 · 이번 주 N권' · 책마다 '오늘 들어옴/어제/N일 전' · 첫 화면을 띄워 둔 채면 5분마다(화면이 보일 때만) 조용히 다시 받아 새 책만 알림 */
  const FR = { t: null, at: 0, items: null };
  const freshHead = (L) => (L.today ? `<span class="fresh">오늘 ${L.today.toLocaleString('ko-KR')}권 새로</span>` : L.wk ? `<span class="fresh wk">이번 주 ${L.wk.toLocaleString('ko-KR')}권</span>` : '');
  const newGrid = (L) => (L.items.length ? `<div class="grid">${L.items.slice(0, 12).map((x) => cardH(x, L.day)).join('')}</div>` : '<div class="empty">아직 올라온 책이 없습니다</div>');
  async function freshPoll(force) { if (B.route(location.hash).name !== 'home' || document.hidden || !$('#nwg')) return; if (!force && Date.now() - FR.at < 4.5 * 60e3) return; FR.at = Date.now();
    try { const L = await api('/shop/list?s=new'); if (B.route(location.hash).name !== 'home' || !$('#nwg')) return; const add = B.freshIds(FR.items, L.items.slice(0, 12)); FR.items = L.items.slice(0, 12);
      $('#nwg').innerHTML = newGrid(L); const fh = $('#nwh'); if (fh) fh.innerHTML = freshHead(L); if (add.length) toast(`새 책 ${add.length}권이 들어왔습니다`); } catch (e) {} }
  function freshArm() { clearInterval(FR.t); FR.t = setInterval(() => freshPoll(false), 5 * 60e3); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) freshPoll(false); });
  async function home() { main().innerHTML = `<section class="hero"><h1>읽은 책, 다음 사람에게</h1><p>한 권 한 권 직접 살펴 등급을 매긴 헌책 — 사진 그대로 보내 드립니다.</p>${searchBox('')}</section><div id="hc">${loading(6)}</div>`; bindSearch();
    try { const [c, L] = await Promise.all([cfg(), api('/shop/list?s=new')]);
      if (!$('#hc')) return; const pr = c.promo || {}; const seen = LS.get('bq-seen', []).slice(0, 8);
      $('#hc').innerHTML = `${closedBar(c)}${pr.bundle ? `<div class="bar info">📚 <b>${pr.bundle.n}권 넘게 담으면 ${pr.bundle.pct ? pr.bundle.pct + '%' : won(pr.bundle.won)} 할인</b> — 장바구니에서 저절로</div>` : ''}<div class="chips"><a class="chip" href="#/list?sale=1&s=off">🏷 할인 중인 책</a>${c.freeOver ? `<span class="chip">🚚 ${won(c.freeOver)} 넘으면 무료 배송</span>` : ''}</div>${(c.cats || []).length ? `<h2>분야</h2><div class="chips">${c.cats.slice(0, 16).map(([k, n]) => `<a class="chip" href="#/list?${B.qs({ c: k })}">${esc(k)} <small>${n}</small></a>`).join('')}</div>` : ''}
        <h2>새로 들어온 책 <span id="nwh">${freshHead(L)}</span><a class="more" href="#/list?s=new">전체 ${c.n != null ? c.n.toLocaleString('ko-KR') + '권' : ''} ›</a></h2><div id="nwg">${newGrid(L)}</div>
        ${seen.length ? `<h2>최근 본 책 <small class="hint">이 기기에만</small></h2><div class="grid">${seen.map((x) => cardH(x)).join('')}</div>` : ''}
        <section class="trust"><div>📷<b>실물 사진</b><small>받으실 그 책을 찍었습니다</small></div><div>🔎<b>등급 풀이</b><small>최상·상·중·하 — 책마다 표시</small></div><div>📦<b>한 권뿐</b><small>주문하면 바로 '주문 중'으로 잡아 둡니다</small></div></section>`;
      FR.items = L.items.slice(0, 12); FR.at = Date.now(); freshArm(); }
    catch (e) { if (!$('#hc')) return; $('#hc').innerHTML = errBox(e); bindAgain(home); } }

  async function list(q) { const p0 = { q: q.q || '', c: q.c || '', g: q.g || '', s: q.s || 'new', pr: q.pr || '', sale: q.sale || '' }; const rg = B.rangeOf(p0.pr); /* (11/11 shopc1) 값 범위·할인만·할인 많은 차례 */
    main().innerHTML = `${searchBox(p0.q)}<div class="fl"><div class="chips sm">${['', '최상', '상', '중', '하'].map((g) => `<a class="chip${p0.g === g ? ' on' : ''}" href="#/list?${B.qs({ ...p0, g })}">${g || '모든 등급'}</a>`).join('')}</div>
      <select id="srt" aria-label="정렬">${[['new', '새로 들어온 차례'], ['low', '낮은 값 차례'], ['high', '높은 값 차례'], ['off', '할인 많은 차례']].map(([k, n]) => `<option value="${k}"${p0.s === k ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="fl"><div class="chips sm"><a class="chip${p0.sale ? ' on' : ''}" href="#/list?${B.qs({ ...p0, sale: p0.sale ? '' : '1' })}">🏷 할인만</a></div><select id="prg" aria-label="값 범위">${B.PRICE_RANGES.map(([k, n]) => `<option value="${k}"${p0.pr === k ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
      <div id="lh" class="lh">${p0.c ? `분야 <b>${esc(p0.c)}</b> <a href="#/list?${B.qs({ ...p0, c: '' })}">✕</a>` : ''}</div><div id="lg">${loading(8)}</div><div id="lm"></div>`; bindSearch();
    $('#srt').onchange = (e) => { location.hash = '#/list?' + B.qs({ ...p0, s: e.target.value }); }; $('#prg').onchange = (e) => { location.hash = '#/list?' + B.qs({ ...p0, pr: e.target.value }); };
    let page = 0; const grid = $('#lg'); const myHash = location.hash;
    const load = async () => { try { const r = await api('/shop/list?' + B.qs({ q: p0.q, c: p0.c, g: p0.g, s: p0.s, sale: p0.sale, ...rg, p: page })); if (!grid.isConnected) return; /* (shop4) 받는 사이 다른 화면으로 갔으면 그만(실제 점검: innerHTML null 오류) */ if (!page) grid.innerHTML = r.items.length ? `<div class="grid">${r.items.map((x) => cardH(x, r.day)).join('')}</div>` : `<div class="empty">찾는 책이 없습니다${p0.q ? ` — '${esc(p0.q)}'` : ''}<br><small>낱말을 줄이거나 다른 이름(지은이·출판사)으로 찾아 보세요</small></div>`;
        else $('.grid', grid).insertAdjacentHTML('beforeend', r.items.map((x) => cardH(x, r.day)).join(''));
        $('#lh').innerHTML = `${p0.q ? `'${esc(p0.q)}' ` : ''}${p0.c ? `분야 <b>${esc(p0.c)}</b> <a href="#/list?${B.qs({ ...p0, c: '' })}" aria-label="분야 빼기">✕</a> ` : ''}<b>${r.total.toLocaleString('ko-KR')}</b>권`;
        $('#lm').innerHTML = r.more ? '<button class="btn ghost wide" id="more">더 보기</button>' : ''; const m = $('#more'); if (m) m.onclick = () => { page++; m.disabled = true; m.textContent = '불러오는 중…'; load(); }; LST.page = page; autoMore(); }
      catch (e) { if (!grid.isConnected) return; if (!page) { grid.innerHTML = errBox(e); bindAgain(() => list(q)); } else { toast(e.message); $('#lm').innerHTML = '<button class="btn ghost wide" id="more">더 보기</button>'; $('#more').onclick = () => load(); } } };
    /* (shelf4 · 원칙 56) 책을 보고 '뒤로' 오면 불러온 쪽·보던 자리 그대로(쿠팡·아마존 목록) — 전엔 첫 쪽 맨 위로 돌아가 다시 내려야 했음 */
    if (LST.key === myHash && LST.grid && Date.now() - LST.at < 10 * 60e3) { grid.innerHTML = LST.grid; $('#lh').innerHTML = LST.lh; page = LST.page; const y = LST.y; LST.key = ''; if (LST.more) { $('#lm').innerHTML = '<button class="btn ghost wide" id="more">더 보기</button>'; $('#more').onclick = () => { page++; $('#more').disabled = true; $('#more').textContent = '불러오는 중…'; load(); }; } requestAnimationFrame(() => window.scrollTo(0, y)); autoMore(); return; }
    load(); }
  /* 끝까지 내리면 저절로 다음 쪽(쿠팡·알라딘 휴대폰 목록) — '더 보기' 단추도 그대로(키보드·화면 읽기) */
  const LST = { key: '', grid: '', lh: '', page: 0, more: false, y: 0, at: 0 }; let moreIO = null;
  function autoMore() { if (!('IntersectionObserver' in window)) return; if (moreIO) moreIO.disconnect(); const lm = $('#lm'); if (!lm) return; moreIO = new IntersectionObserver((es) => { if (!es.some((e) => e.isIntersecting)) return; const m = $('#more'); if (m && !m.disabled) m.click(); }, { rootMargin: '600px 0px' }); moreIO.observe(lm); }
  function listKeep() { const g = $('#lg .grid'); if (!g || B.route(LST.cur || '').name !== 'list') return; LST.key = LST.cur; LST.grid = $('#lg').innerHTML; LST.lh = ($('#lh') || {}).innerHTML || ''; LST.more = !!$('#more'); LST.y = window.scrollY; LST.at = Date.now(); }

  async function item(id) { main().innerHTML = `<div class="det sk"><div class="gal"><div class="ph"></div></div><div class="info"><i></i><i></i><i></i></div></div>`;
    try { const [c, r] = await Promise.all([cfg(), api('/shop/item?' + B.qs({ id }))]); if (B.route(location.hash).arg !== id) return; const x = r.item; const pics = [x.im, ...(x.ph || [])].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i); const G = B.gradeOf(x.g); const off = B.offPct(x.p, x.lp); const inCart = cart().some((y) => y.id === x.id); const so = B.saleOf(x); const lt = B.leftTxt(x.pe);
      document.title = x.t + ' — ' + (c.name || '북스퀸'); LS.set('bq-seen', B.seenAdd(LS.get('bq-seen', []), x)); /* (shopc1) 최근 본 책 */
      const rs = shelfRet(); main().innerHTML = `${rs && rs.id === x.id ? '<a class="backshelf" href="#/shelf" data-backshelf="1">← 서가 책장의 이 책 자리로 <small>Esc · 뒤로가기</small></a>' : ''}<div class="det"><div class="gal" id="gal">${pics.length ? pics.map((u, i) => `<div class="ph"><img src="${esc(u)}" alt="${i ? '실물 사진 ' + i : '표지'}" ${i ? 'loading="lazy"' : ''}></div>`).join('') : '<div class="ph"><span class="noim">📕</span></div>'}</div>${pics.length > 1 ? `<div class="dots">${pics.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}
        <div class="info">${x.bd && x.bd.length ? `<div class="bds in">${B.badgeH(x.bd, 6)}</div>` : ''}<h1>${esc(x.t)}</h1><div class="meta">${[x.a, x.pb, x.pd ? x.pd.replace('-', '년 ') + '월' : ''].filter(Boolean).map(esc).join(' · ')}</div>
        <div class="price">${so && so.from === 'p0' ? `<s>${won(so.was)}</s> <span class="off sale">${so.pct}% 할인</span>${lt ? ` <small class="left">⏰ ${esc(lt)}</small>` : ''}<br>` : x.lp && off ? `<s>${won(x.lp)}</s> <span class="off">${off}%</span><br>` : ''}<b>${won(x.p)}</b>${so && so.from === 'p0' && x.lp ? `<small class="hint"> · 정가 ${won(x.lp)}</small>` : ''}</div>
        <div class="gbox">${gTag(x.g)} <b>${esc(G[0])}</b> <span>${esc(G[1])}</span></div>
        <ul class="facts"><li>📦 <b>한 권뿐인 실물</b> — 사진 속 그 책을 보냅니다</li><li>🚚 배송비 ${c.shipFee ? won(c.shipFee) : '없음'}${c.freeOver ? ` · ${won(c.freeOver)} 넘으면 무료` : ''}</li>${c.promo && c.promo.bundle ? `<li>📚 ${c.promo.bundle.n}권 넘게 담으면 ${c.promo.bundle.pct ? c.promo.bundle.pct + '%' : won(c.promo.bundle.won)} 할인</li>` : ''}${x.isbn ? `<li>🔢 ISBN ${esc(x.isbn)}</li>` : ''}${x.c ? `<li>🗂 <a href="#/list?${B.qs({ c: x.c })}">${esc(x.c)}</a></li>` : ''}</ul>
        ${(r.same || []).length ? `<div class="same"><b>같은 책 다른 매물</b>${r.same.map((y) => `<a href="#/b/${encodeURIComponent(y.id)}">${gTag(y.g)} ${won(y.p)}${y.st === 'o' ? ' <small>주문 중</small>' : ''}</a>`).join('')}</div>` : ''}
        <div class="buy">${x.st === 'o' ? '<button class="btn wide" disabled>다른 분이 주문한 책입니다</button>' : !c.open ? '<button class="btn wide" disabled>문을 연 뒤에 주문할 수 있습니다</button>' : inCart ? '<a class="btn wide ghost" href="#/cart">장바구니에 담겨 있음 — 보러 가기</a>' : '<button class="btn ghost" id="add">장바구니</button><button class="btn" id="now">바로 주문</button>'}<button type="button" class="btn ghost wishb${wish().some((w) => w.id === x.id) ? ' on' : ''}" id="wsh" aria-pressed="${wish().some((w) => w.id === x.id)}" aria-label="찜">${wish().some((w) => w.id === x.id) ? '♥' : '♡'}</button></div></div></div>
        ${(r.rel || []).length ? `<h2>함께 보면 좋은 책</h2><div class="grid rel">${r.rel.map((y) => cardH(y)).join('')}</div>` : ''}`;
      const gal = $('#gal'); if (gal && pics.length > 1) gal.onscroll = () => { const i = Math.round(gal.scrollLeft / gal.clientWidth); $$('.dots i').forEach((d, k) => d.classList.toggle('on', k === i)); };
      const add = (go) => { const r2 = B.cartAdd(cart(), x, c.maxItems); if (r2.why) toast(r2.why); else { setCart(r2.cart); toast('장바구니에 담았습니다'); } if (go) location.hash = '#/order'; else item(id); };
      /* (shelf4 · 원칙 56) 책 한 권 화면에서 바로 찜(알라딘·교보 상품 화면의 ♡) — 서가·찜 목록과 같은 저장 */
      const ws = $('#wsh'); if (ws) ws.onclick = () => { const L0 = wish(); const on = L0.some((w) => w.id === x.id); setWish(on ? L0.filter((w) => w.id !== x.id) : [{ id: x.id, t: x.t, a: x.a || null, p: +x.p || 0, g: x.g || null, im: x.im || null, at: new Date().toISOString() }, ...L0].slice(0, 300)); ws.classList.toggle('on', !on); ws.setAttribute('aria-pressed', String(!on)); ws.textContent = on ? '♡' : '♥'; toast(on ? '찜을 뺐습니다' : '♥ 찜 목록에 넣었습니다'); };
      const a = $('#add'); if (a) a.onclick = () => add(false); const n = $('#now'); if (n) n.onclick = () => add(true); }
    catch (e) { main().innerHTML = errBox(e) + '<p class="center"><a href="#/">첫 화면으로</a></p>'; bindAgain(() => item(id)); } }

  /* ══ (11/11 shopc1) 🧮 장바구니 값은 클라우드가 셈(/shop/quote — 규칙 할인·묶음 할인·쿠폰·배송비) · 옛 클라우드면 이 기기 셈(예전 그대로)
   *  근거(약속 42): 쿠팡·알라딘 장바구니 '○원 더 담으면 무료배송' 막대 · 교보 '몇 권 더 담으면 추가 할인' · Shopify 할인 코드 칸(주문서 안) */
  const localQ = (L, c) => { const S0 = B.cartSum(L, c); const fl = B.freeLeft(S0.sum, c); return { n: S0.n, sum0: S0.sum, bundle: 0, coupon: null, disc: 0, sum: S0.sum, fee: S0.fee, total: S0.total, free: fl == null ? null : { over: c.freeOver, left: fl }, nextB: null, local: 1 }; };
  async function quoteOf(cp) { return api('/shop/quote', { method: 'POST', body: JSON.stringify({ items: cart().map((x) => x.id), cp: cp || '' }) }); }
  /* 받은 값으로 장바구니를 맞춤 — 값이 바뀐 책은 새 값으로 · 팔린 책은 뺌(알림) · 바뀐 것이 있으면 참 */
  function syncCart(Q) { if (!Q || Q.local) return false; const P = new Map((Q.items || []).map((x) => [x.id, x])); const badIds = new Set((Q.bad || []).map((x) => x.id)); let ch = false;
    const next = cart().filter((x) => { if (badIds.has(x.id)) { ch = true; return false; } return true; }).map((x) => { const y = P.get(x.id); if (y && (y.p !== x.p || (y.p0 || null) !== (x.p0 || null))) { ch = true; const o = { ...x, p: y.p }; if (y.p0) o.p0 = y.p0; else delete o.p0; return o; } return x; });
    if (ch) { setCart(next); if ((Q.bad || []).length) toast(`팔린 책 ${Q.bad.length}권을 장바구니에서 뺐습니다`); else toast('할인이 바뀐 책 값을 새로 맞췄습니다'); } return ch; }
  function sumH(Q) { const fr = Q.free; const pct = fr && fr.over ? Math.min(100, Math.round(((fr.over - fr.left) / fr.over) * 100)) : 0;
    return `${fr ? `<div class="free${fr.left ? '' : ' ok'}"><div>${fr.left ? `🚚 <b>${won(fr.left)}</b> 더 담으면 무료 배송` : '🎉 무료 배송!'}</div><i style="--p:${fr.left ? pct : 100}%"></i></div>` : ''}
      ${Q.nextB ? `<div class="hint nb">📚 ${Q.nextB.need}권 더 담으면 ${Q.nextB.pct ? Q.nextB.pct + '%' : won(Q.nextB.won)} 묶음 할인</div>` : ''}
      <div class="sum"><div><span>책 ${Q.n}권</span><b>${won(Q.sum0)}</b></div>${Q.bundle ? `<div class="dc"><span>묶음 할인</span><b>−${won(Q.bundle)}</b></div>` : ''}${Q.coupon ? `<div class="dc"><span>쿠폰 ${esc(Q.coupon.nm)}</span><b>−${won(Q.coupon.d)}</b></div>` : ''}<div><span>배송비</span><b>${won(Q.fee)}</b></div><div class="tot"><span>합계</span><b>${won(Q.total)}</b></div></div>`; }
  /* (shelf2 · 원칙 56) 담은 책 살펴보기 — 팔린 책은 빼고 값이 바뀐 책은 새 값으로 · 무엇이 바뀌었는지 알림 글(없으면 '') · 클라우드가 옛 판(404)이거나 연결이 안 되면 그대로 */
  async function cartFresh() { const L = cart(); if (!L.length) return ''; let r; try { r = await api('/shop/check?' + B.qs({ ids: L.map((x) => x.id).join(',') })); } catch (e) { return ''; }
    const f = B.cartFix(cart(), r.st, r.p); if (!f.gone.length && !f.moved.length) return ''; setCart(f.cart);
    return `<div class="bar wait fresh" role="status">🔎 <b>담아 두신 책을 살펴보았습니다</b><ul>${f.gone.map((x) => `<li><b>${esc(x.t)}</b> — ${esc(x.why)}이라 장바구니에서 뺐습니다</li>`).join('')}${f.moved.map((x) => `<li><b>${esc(x.t)}</b> — 값이 ${won(x.a)} → <b>${won(x.b)}</b>로 바뀌었습니다</li>`).join('')}</ul></div>`; }
  /* (shelf3) 장바구니 — 먼저 /shop/check로 팔린 책·값 바뀐 책을 알려 드리고(shelf2) 그다음 클라우드 셈(/shop/quote · shopc1) · 둘 다 옛 클라우드면 이 기기 셈 */
  async function cartPage(note) { let c = null; try { c = await cfg(); } catch (e) { c = { shipFee: 0, open: 0 }; } const L = cart(); const Q0 = localQ(L, c);
    main().innerHTML = `<h1 class="pt">장바구니</h1>${note || ''}${L.length ? `<div class="rows">${L.map((x) => `<div class="row"><a href="#/b/${encodeURIComponent(x.id)}" class="ri">${x.im ? `<img src="${esc(x.im)}" alt="">` : '📕'}</a><div class="rt"><a href="#/b/${encodeURIComponent(x.id)}">${esc(x.t)}</a><div>${priceH(x)}</div></div><button class="x" data-del="${esc(x.id)}" aria-label="빼기: ${esc(x.t)}">✕</button></div>`).join('')}</div>
      <div id="qsum">${sumH(Q0)}</div>
      ${c.open ? `<a class="btn wide" href="#/order" id="toOrder">${won(Q0.total)} 주문하기 ›</a>` : '<button class="btn wide" disabled>문을 연 뒤에 주문할 수 있습니다</button>'}<div class="more2"><a href="#/list?s=new">＋ 책 더 둘러보기</a><a href="#/shelf">📚 서가 책장에서 더 보기</a></div><p class="hint">헌책은 모두 한 권뿐이라 장바구니에 담아도 잡아 두지 않습니다 — 주문을 마치면 그때 '주문 중'으로 잡힙니다.${c.promo && c.promo.coupon ? ' 쿠폰은 주문서에서 넣습니다.' : ''}</p>`
      : `<div class="empty">장바구니가 비었습니다<br><a class="btn" href="#/">책 둘러보기</a> <a class="btn ghost" href="#/shelf">📚 서가 책장</a></div>`}`;
    $$('[data-del]').forEach((b) => (b.onclick = () => { const x = cart().find((y) => y.id === b.dataset.del); setCart(B.cartDel(cart(), b.dataset.del)); cartPage(''); if (x) undoToast(x); }));
    if (!L.length) return; if (note === undefined) { const n = await cartFresh(); if (B.route(location.hash).name !== 'cart') return; if (n) return cartPage(n); note = ''; }
    try { const Q = await quoteOf(''); if (B.route(location.hash).name !== 'cart' || !$('#qsum')) return; if (syncCart(Q)) return cartPage(note); $('#qsum').innerHTML = sumH(Q); const g = $('#toOrder'); if (g) g.textContent = `${won(Q.total)} 주문하기 ›`; } catch (e) {} }
  /* 뺀 책 되돌리기(실수로 ✕ — 4초) */
  function undoToast(x) { const t = $('#toast'); t.innerHTML = `「${esc(x.t)}」 뺐습니다 <button type="button" class="undo">되돌리기</button>`; t.classList.add('on'); clearTimeout(tT); tT = setTimeout(() => t.classList.remove('on'), 4200);
    const u = $('.undo', t); if (u) u.onclick = () => { const r = B.cartAdd(cart(), x, (ST.cfg || {}).maxItems); if (!r.why) { setCart(r.cart); if (B.route(location.hash).name === 'cart') cartPage(''); } t.classList.remove('on'); }; }


  async function orderPage() { if (!cart().length) { location.hash = '#/cart'; return; } let c; try { c = await cfg(true); } catch (e) { main().innerHTML = errBox(e); bindAgain(orderPage); return; }
    if (!c.open) { main().innerHTML = `${closedBar(c)}<p class="center"><a href="#/cart">장바구니로</a></p>`; return; } const note = await cartFresh(); if (B.route(location.hash).name !== 'order') return; const L = cart(); if (!L.length) { location.hash = '#/cart'; return; } const S0 = B.cartSum(L, c); let Q = localQ(L, c); let cpOk = ''; /* (shopc1) Q = 클라우드가 셈한 값(묶음·쿠폰) · cpOk = 적용된 쿠폰 번호 · (shelf2) note = 살펴본 알림 */
    const fld = (k, lb, typ, ph, extra) => `<label class="f" data-f="${k}"><span>${lb}</span><input id="f_${k}" type="${typ || 'text'}" ${ph ? `placeholder="${esc(ph)}"` : ''} ${extra || ''}><em></em></label>`;
    main().innerHTML = `<h1 class="pt">주문서</h1>${note || ''}<form id="of" novalidate>
      <fieldset><legend>주문하시는 분</legend>${fld('name', '이름', 'text', '', 'autocomplete="name" maxlength="30"')}${fld('phone', '휴대폰', 'tel', '010-0000-0000', 'autocomplete="tel" inputmode="numeric"')}${fld('email', '메일 (선택)', 'email', '주문 안내를 메일로도 받으려면', 'autocomplete="email" maxlength="80"')}<div class="hint">주문 접수·입금 확인·보냄 알림은 휴대폰 문자(메일을 적으시면 메일도)로 — 알림 보내기는 준비 중이라 지금은 주문 뒤 받는 조회 주소로 확인해 주세요</div></fieldset>
      <fieldset><legend>받는 분</legend><label class="ck"><input type="checkbox" id="f_same" checked> 주문하시는 분과 같음</label><div id="rcv" hidden>${fld('rname', '이름', 'text', '', 'maxlength="30"')}${fld('rphone', '휴대폰', 'tel', '010-0000-0000', 'inputmode="numeric"')}</div>
        ${fld('zip', '우편번호', 'text', '5자리', 'inputmode="numeric" maxlength="5" autocomplete="postal-code"')}${fld('addr1', '주소', 'text', '도로명 또는 지번 주소', 'autocomplete="address-line1" maxlength="120"')}${fld('addr2', '상세 주소', 'text', '동·호수', 'autocomplete="address-line2" maxlength="80"')}${fld('memo', '배송 메모', 'text', '예) 문 앞에 두세요', 'maxlength="100"')}</fieldset>
      <fieldset><legend>결제</legend>${c.pay.how === 'bank' ? `<div class="pay on">🏦 <b>무통장 입금</b><small>주문을 마치면 계좌를 보여 드립니다 · ${c.payDays}일 안에 입금해 주세요</small></div>${fld('dep', '입금하실 분', 'text', '주문하시는 분과 다르면', 'maxlength="20"')}` : '<div class="pay">⏳ <b>결제 안내 준비 중</b><small>주문을 받으면 가게에서 결제 방법을 연락드립니다</small></div>'}
        <div class="pay off">💳 카드·간편결제 <small>준비 중</small></div></fieldset>
      <fieldset><legend>주문할 책 <span id="on">${S0.n}</span>권 <a class="edit" href="#/cart">고치기</a></legend><div id="olines">${L.map((x) => `<div class="ol"><span>${esc(x.t)}</span>${priceH(x)}</div>`).join('')}</div>
        ${c.promo && c.promo.coupon ? `<label class="f" data-f="cp"><span>쿠폰 번호 (있으면)</span><span class="cprow"><input id="f_cp" type="text" maxlength="20" autocomplete="off" autocapitalize="characters"><button type="button" class="btn ghost" id="cpgo">적용</button></span><em></em></label>` : ''}<div id="qsum">${sumH(Q)}</div></fieldset>
      <fieldset class="agree"><label class="ck all"><input type="checkbox" id="f_all"> <b>모두 동의</b> <small>(아래 필수 둘)</small></label><label class="ck" data-f="agreeP"><input type="checkbox" id="f_agreeP"> (필수) 개인정보 수집·이용 동의 <a href="#/p/privacy" target="_blank">내용 보기</a><em></em></label>
        <div class="hint">모으는 것: 이름·휴대폰·주소(배송용)·메일(적으셨을 때만) · 쓰는 곳: 주문 확인·주문 알림·배송·문의 답 · 보관: 거래 기록 보관 기간(전자상거래법 5년) 뒤 파기</div>
        <label class="ck" data-f="agreeT"><input type="checkbox" id="f_agreeT"> (필수) 주문할 책·값·배송비·<a href="#/p/terms" target="_blank">구매 조건(교환·환불)</a>을 확인했습니다<em></em></label></fieldset>
      <input type="text" id="f_hp" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="gobar"><button class="btn wide" id="go" type="submit">${won(Q.total)} 주문하기</button></div><div id="oerr" class="err" hidden></div></form>`;
    const showQ = (q) => { Q = q; $('#qsum').innerHTML = sumH(q); $('#olines').innerHTML = cart().map((x) => `<div class="ol"><span>${esc(x.t)}</span>${priceH(x)}</div>`).join(''); const on = $('#on'); if (on) on.textContent = cart().length; const g = $('#go'); if (g && !g.disabled) g.textContent = `${won(q.total)} 주문하기`; };
    const reQ = async (cp) => { try { const q = await quoteOf(cp); if (!$('#qsum')) return null; syncCart(q); if (!cart().length) { location.hash = '#/cart'; return null; } showQ(q); return q; } catch (e) { return null; } };
    reQ('');
    const cg = $('#cpgo'); if (cg) cg.onclick = async () => { const v = $('#f_cp').value.trim(); const box = $('[data-f="cp"]'); cg.disabled = true; const q = await reQ(v); cg.disabled = false; const em = $('em', box);
      if (!q) { em.textContent = '지금은 쿠폰을 확인할 수 없습니다 — 잠시 뒤'; return; } if (v && q.cpErr) { cpOk = ''; box.classList.add('bad'); em.textContent = q.cpErr; } else { cpOk = v; box.classList.remove('bad'); em.textContent = v ? `✓ ${won(q.coupon ? q.coupon.d : 0)} 할인` : ''; } };
    const same = $('#f_same'); same.onchange = () => { $('#rcv').hidden = same.checked; };
    /* (shelf4 · 원칙 56) ① 모두 동의(쿠팡·무신사 주문서처럼 한 번에) ② 장바구니를 고치러 갔다 와도 적은 칸이 그대로 — 이 탭에만(sessionStorage · 탭을 닫으면 지워짐 · 동의 칸·쿠폰은 안 남김 · 주문을 마치면 지움) */
    const fa = $('#f_all'), ap = $('#f_agreeP'), at = $('#f_agreeT'); const syncAll = () => { fa.checked = ap.checked && at.checked; }; fa.onchange = () => { ap.checked = at.checked = fa.checked; ap.dispatchEvent(new Event('change')); at.dispatchEvent(new Event('change')); }; ap.addEventListener('change', syncAll); at.addEventListener('change', syncAll);
    const DK = 'bq-odraft', DF = ['name', 'phone', 'email', 'rname', 'rphone', 'zip', 'addr1', 'addr2', 'memo', 'dep']; try { const d = JSON.parse(sessionStorage.getItem(DK) || 'null'); if (d) { DF.forEach((k) => { const el = $('#f_' + k); if (el && d[k]) el.value = d[k]; }); if (d.same === false) { same.checked = false; same.onchange(); } } } catch (e) {}
    let dT = 0; $('#of').addEventListener('input', () => { clearTimeout(dT); dT = setTimeout(() => { try { const v0 = val(); const d = { same: v0.same }; DF.forEach((k) => { if (v0[k]) d[k] = v0[k]; }); sessionStorage.setItem(DK, JSON.stringify(d)); } catch (e) {} }, 300); });
    /* (shelf2 · 원칙 56) 칸을 떠날 때 그 칸만 바로 검사(빨간 글은 손댄 칸만 · 고치면 바로 사라짐) — 마지막에 한꺼번에 틀렸다고 하지 않게 */
    const touched = new Set(); const live = () => { const E = B.formCheck(val()); $$('[data-f]').forEach((el) => { const k = el.dataset.f; if (!touched.has(k)) return; const m = E[k]; el.classList.toggle('bad', !!m); el.classList.toggle('good', !m); const em = $('em', el); if (em) em.textContent = m || ''; }); };
    $$('[data-f]').forEach((el) => { const i = $('input', el); if (!i) return; i.addEventListener(i.type === 'checkbox' ? 'change' : 'blur', () => { touched.add(el.dataset.f); live(); }); i.addEventListener('input', () => { if (touched.has(el.dataset.f)) live(); }); });
    ['phone', 'rphone'].forEach((k) => { const el = $('#f_' + k); if (el) el.oninput = () => { el.value = B.phoneFmt(el.value); }; });
    const val = () => { const g = (k) => { const el = $('#f_' + k); return el ? (el.type === 'checkbox' ? el.checked : el.value) : ''; }; return { name: g('name'), phone: g('phone'), email: g('email'), same: g('same'), rname: g('rname'), rphone: g('rphone'), zip: g('zip'), addr1: g('addr1'), addr2: g('addr2'), memo: g('memo'), dep: g('dep'), agreeP: g('agreeP'), agreeT: g('agreeT'), hp: g('hp') }; };
    $('#of').onsubmit = async (e) => { e.preventDefault(); const f = val(); const E = B.formCheck(f); $$('[data-f]').forEach((el) => { const m = E[el.dataset.f]; el.classList.toggle('bad', !!m); const em = $('em', el); if (em) em.textContent = m || ''; });
      const ks = Object.keys(E); if (ks.length) { const first = $(`[data-f="${ks[0]}"]`); if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' }); toast('빠진 칸을 채워 주세요'); return; }
      const go = $('#go'); go.disabled = true; go.textContent = '주문 넣는 중…'; $('#oerr').hidden = true;
      try { const r = await api('/shop/order', { method: 'POST', body: JSON.stringify(B.orderBody({ ...f, cp: cpOk, expect: Q.local ? null : Q.total }, cart())) }); /* (shopc1) expect = 손님이 본 합계 — 서버 셈과 다르면 주문하지 않음 */ const mine = LS.get('bq-orders', []).filter((x) => x.no !== r.no); mine.unshift({ no: r.no, t: r.t, at: new Date().toISOString(), total: r.total, n: r.items.length }); LS.set('bq-orders', mine.slice(0, 20));
        setCart([]); try { sessionStorage.removeItem('bq-odraft'); } catch (e2) {} location.hash = `#/done/${encodeURIComponent(r.no)}?t=${r.t}&new=1`; }
      catch (er) { go.disabled = false; go.textContent = `${won(Q.total)} 주문하기`; const bad = er.j && er.j.bad;
        if (er.j && er.j.price) { await reQ(cpOk); go.textContent = `${won(Q.total)} 주문하기`; } if (er.j && er.j.cp) { cpOk = ''; const box = $('[data-f="cp"]'); if (box) { box.classList.add('bad'); $('em', box).textContent = er.message; } } if (bad && bad.length) { const ids = new Set(bad.map((x) => x.id)); setCart(cart().filter((x) => !ids.has(x.id))); if (cart().length) { await reQ(cpOk); go.textContent = `${won(Q.total)} 주문하기`; } else go.disabled = true; } /* (shelf2) 뺀 뒤 줄·합계·단추 값도 새로 */
        $('#oerr').hidden = false; $('#oerr').innerHTML = `<b>⚠ ${esc(er.message)}</b>${bad && bad.length ? `<ul>${bad.map((x) => `<li>${esc(x.t || (L.find((y) => y.id === x.id) || {}).t || x.id)} — ${esc(x.why)}</li>`).join('')}</ul><small>그 책은 장바구니에서 뺐습니다 — 나머지로 다시 주문해 주세요</small> <a href="#/cart">장바구니 보기</a>` : ''}`; } }; }

  async function done(no, q) { main().innerHTML = loading(2);
    try { const o = await api('/shop/order?' + B.qs({ no, t: q.t })); if (B.route(location.hash).arg !== no) return; const cxl = o.st === 'new';
      main().innerHTML = `<div class="done">${q.new ? '<div class="ok">✅ 주문을 받았습니다</div>' : ''}<h1 class="pt">주문 ${esc(o.no)}</h1><div class="stt st-${esc(o.st)}">${esc(o.stTxt)}</div>
        ${o.st === 'new' && o.pay && o.pay.how === 'bank' ? `<div class="bank"><div>입금하실 곳</div><b class="acct">${esc(o.pay.bank)} ${esc(o.pay.acct)}</b><div>예금주 ${esc(o.pay.holder)}</div><div class="amt">${won(o.total)}</div><small>${esc(String(o.due || '').slice(0, 10))}까지 · 입금자 ${esc(o.dep)} 이름으로 — 입금이 확인되면 포장해 보내 드립니다</small><button class="btn ghost" id="cp">계좌 번호 복사</button></div>` : o.st === 'new' ? '<div class="bank"><b>결제 안내 준비 중</b><small>가게에서 결제 방법을 연락드립니다</small></div>' : ''}
        ${o.inv ? `<div class="bank">🚚 ${esc(o.inv.courier || '택배')} <b>${esc(o.inv.no)}</b></div>` : ''}${o.cxl ? `<div class="hint">취소 까닭: ${esc(o.cxl)}</div>` : ''}
        <div class="rows">${o.items.map((x) => `<div class="ol"><a href="#/b/${encodeURIComponent(x.id)}">${esc(x.t)}</a>${gTag(x.g)}<b>${won(x.p)}</b></div>`).join('')}</div><div class="sum">${o.disc ? `<div class="dc"><span>할인(묶음·쿠폰)</span><b>−${won(o.disc)}</b></div>` : ''}<div><span>책값</span><b>${won(o.sum)}</b></div><div><span>배송비</span><b>${won(o.shipFee)}</b></div><div class="tot"><span>합계</span><b>${won(o.total)}</b></div></div>
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
      <h3>1. 모으는 것과 쓰는 곳</h3><p>주문 때: 주문하시는 분·받는 분의 이름, 휴대폰 번호, 주소(우편번호·상세 주소), 배송 메모, 입금하실 분 이름, 메일 주소(선택 — 적으셨을 때만) — 주문 확인·입금 확인·주문 알림(접수·입금 확인·보냄)·배송·교환·환불·문의 답에만 씁니다. 회원 가입은 없습니다.</p>
      <h3>2. 보관 기간</h3><p>전자상거래 등에서의 소비자보호에 관한 법률에 따라 계약·청약철회·대금 결제·재화 공급 기록 5년, 소비자 불만·분쟁 처리 기록 3년 보관한 뒤 지체 없이 파기합니다.</p>
      <h3>3. 맡기는 곳(위탁)</h3><p>택배사(배송) · Google Firebase(주문 기록 보관 서버) — 결제 대행사(PG)·알림 보내기 서비스(문자·메일)를 쓰게 되면 이 칸에 더합니다.</p>
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
  /* ══ (11/11 shelf1) 📚 서가 책장 #/shelf · ♡ 찜 목록 #/wish — 책장 화면(shelf.js·shelf.css)은 처음 열 때만 받음(첫 화면 가볍게)
   *  자료: /shop/shelf(판매중 전부 · 4,000권씩) → 클라우드가 아직 옛 판이면 /shop/list 쪽을 모아 대신(분야·등록일 없이) · #/shelf?demo=1200 시범 자료 · ?cfg=… 관리 화면 미리 보기(저장 안 함) */
  const wish = () => LS.get('bq-wish', []); const setWish = (w) => { LS.set('bq-wish', w); wishBadge(); };
  function wishBadge() { const n = wish().length; const b = $('#wishN'); if (b) { b.textContent = n; b.hidden = !n; } }
  const SHL = { h: null, items: null, at: 0, js: null };
  /* (shelf5) 첫 로딩이 가끔 한 번 실패('책장 화면을 받지 못했습니다') — 휴대폰 망이 잠깐 끊기거나 새 판을 올리는 몇 초 사이 파일 하나가 안 오면 곧바로 실패로 끝냈음
   *  → 파일마다 15초 기다림 · 실패하면 그 태그를 떼고 0.8초·2초 뒤 다시(주소에 r=번호를 붙여 캐시를 피함 · 최대 3번) · 오프라인이면 다시 연결될 때까지 기다렸다 다시 · 끝내 안 되면 어느 파일인지 알려 줌 */
  const loadRes = (tag, attr) => { const key = tag === 'link' ? 'href' : 'src'; const u0 = attr[key];
    const one = (n) => new Promise((ok, no) => { const e = document.createElement(tag); Object.assign(e, attr); if (n) e[key] = u0 + (u0.includes('?') ? '&' : '?') + 'r=' + n; let done = false;
      const fin = (f, v) => { if (done) return; done = true; clearTimeout(t); if (f === no) e.remove(); f(v); }; const t = setTimeout(() => fin(no, new Error('시간 넘음')), 15000);
      e.onload = () => fin(ok); e.onerror = () => fin(no, new Error('못 받음')); document.head.appendChild(e); });
    const waitOn = () => (navigator.onLine === false ? new Promise((r) => { const f = () => { window.removeEventListener('online', f); r(); }; window.addEventListener('online', f); setTimeout(f, 20000); }) : Promise.resolve());
    const go = (n) => one(n).catch((e) => { if (n >= 2) { const x = new Error(`책장 화면을 받지 못했습니다(${String(u0).split('?')[0]} · ${e.message}) — 인터넷 연결을 확인한 뒤 다시 해 보기를 눌러 주세요`); x.res = u0; throw x; } return waitOn().then(() => new Promise((r) => setTimeout(r, n ? 2000 : 800))).then(() => go(n + 1)); });
    return go(0); };
  const shelfJs = () => SHL.js || (SHL.js = Promise.all([window.BQS ? 1 : loadRes('script', { src: 'shelf-core.js?v=0.2.6' }), loadRes('link', { rel: 'stylesheet', href: 'shelf.css?v=0.2.6' })]).then(() => (window.BQShelf ? 1 : loadRes('script', { src: 'shelf.js?v=0.2.6' }))).catch((e) => { SHL.js = null; throw e; }));
  /* (shelf4) 첫 화면 빠르게: 첫 묶음(새 책 4,000권)은 화면 파일과 함께 미리 받기 시작 → 오면 바로 첫 책장(early) · 나머지 묶음은 한꺼번에(나란히) 받아 뒤에서 더함 */
  async function shelfItems(prog, early) { if (SHL.items && Date.now() - SHL.at < 5 * 60e3) return SHL.items; const S = window.BQS; let all = [];
    try { const k0 = () => api('/shop/shelf?k=0', { ms: 30000 }); const J0 = await (SHL.p0 || k0()).catch((e) => { if (e.status === 404) throw e; return new Promise((r) => setTimeout(r, 1200)).then(k0); }); SHL.p0 = null; /* (shelf5) 클라우드가 막 깨어나 책 목록을 처음 세우면 15초를 넘길 때가 있음 → 첫 묶음은 30초 · 한 번 더 */ all = S.unpack(J0); prog(all.length, J0.n); if (J0.kn > 1 && early) early(all.slice());
      /* (shelf6) 나머지 묶음은 한 번에(k=1-) — 전엔 묶음마다 나란히(4번)라 클라우드 자리(동시 4개)를 혼자 다 씀 · 클라우드가 옛 판이면(k2 없음) 남은 묶음을 하나씩 차례로 */
      const rest = []; if (J0.kn > 1) { const J1 = await api('/shop/shelf?k=1-', { ms: 45000 }); rest.push(J1); prog(all.length + (J1.rows || []).length, J0.n);
        for (let k = (J1.k2 != null ? J1.k2 : J1.k || 1) + 1; k < J0.kn; k++) { const J = await api('/shop/shelf?k=' + k); rest.push(J); prog(all.length + rest.reduce((a, x) => a + (x.rows || []).length, 0), J0.n); } }
      for (const J of rest) { const base = all.length; all = all.concat(S.unpack(J).map((x) => ({ ...x, _o: base + x._o }))); } prog(all.length, J0.n); }
    catch (e) { if (e.status !== 404) throw e; /* 클라우드 옛 판 — 새로 들어온 차례 쪽을 모음(최대 40쪽) */ all = []; for (let p = 0; p < 40; p++) { const r = await api('/shop/list?' + B.qs({ s: 'new', p })); const base = all.length; all = all.concat(r.items.map((x, i) => ({ ...x, c: x.c || null, at: x.at || null, _o: -(base + i) }))); prog(all.length, r.total); if (!r.more) break; } }
    const seen = new Set(); all = all.filter((x) => !seen.has(x.id) && seen.add(x.id)); SHL.items = all; SHL.at = Date.now(); return all; }
  async function shelfPage(q) { document.body.classList.add('shelf-on'); main().innerHTML = '<div class="bqs-wait">📚 책장을 세우는 중…</div>';
    if (!q.demo && !(SHL.items && Date.now() - SHL.at < 5 * 60e3) && !SHL.p0) { SHL.p0 = api('/shop/shelf?k=0', { ms: 30000 }); SHL.p0.catch(() => { SHL.p0 = null; }); } /* 화면 파일·설정과 나란히 */
    let c = {}; try { await Promise.all([shelfJs(), cfg().then((x) => { c = x; }, () => {})]); } catch (e) { main().innerHTML = errBox(e); bindAgain(() => shelfPage(q)); return; } if (B.route(location.hash).name !== 'shelf') return;
    const S = window.BQS; const raw = { ...((c && c.shelf) || {}), ...(q.cfg ? S.previewCfg(q.cfg) : {}) }; const sc = S.cfgOf(raw);
    if (!sc.on && !q.cfg && !q.demo) { main().innerHTML = '<div class="empty">서가 책장은 지금 쉬는 중입니다<br><a href="#/list?s=new">책 찾기로</a></div>'; return; }
    const demo = Math.max(0, Math.min(20000, parseInt(q.demo, 10) || 0));
    SHL.h = window.BQShelf.mount(main(), { cfg: raw, sort: q.s, start: q.i != null || q.f ? { ...(q.i != null ? { i: +q.i } : {}), f: q.f || null } : null, /* (shelf8) f = 상세에서 돌아올 책 */ shop: { open: !!(c && c.open) || !!demo }, toast,
      load: (prog, early) => (demo ? Promise.resolve(S.demoItems(demo)) : shelfItems(prog, early)),
      cart: { n: () => cart().length, has: (id) => cart().some((y) => y.id === id), add: (x) => { if (demo) return '시범 자료라 담지 않습니다(움직임만 보기는 ⚙ 보기에서)'; const r = B.cartAdd(cart(), x, c.maxItems); if (r.why) return r.why; setCart(r.cart); return null; } },
      saveLooks: demo ? null : (L, g) => api('/shop/spines', { method: 'POST', body: JSON.stringify({ g, L }) }).catch(() => {}), /* (shelf2) 책등 모양 영구 저장 — 먼저 정한 것이 이김 */
      get fontApi() { return SAME.on ? location.origin : null; }, /* (shelf6) 글꼴도 같은 주소(CDN 1년 캐시)로 — 넘김이 아직 없으면 클라우드 주소 */
      wish: { get: wish, set: setWish }, open: (id) => { if (!demo) location.hash = '#/b/' + encodeURIComponent(id); else toast('시범 자료 — 자세히 화면 없음'); },
      item: demo ? null : (id) => api('/shop/item?' + B.qs({ id })).then((r) => r && r.item), /* (shelf8) 펼친 책 아래 기본 정보·책소개·목차·샘플 쪽 */
      onState: (s) => { const h = '#/shelf?' + B.qs({ s: s.s, i: s.i, f: s.f || '', demo: demo || '', cfg: q.cfg || '' }); if (location.hash !== h) history.replaceState(null, '', h); } });
    if (demo) main().insertAdjacentHTML('afterbegin', `<div class="bar info">🧪 시범 자료 ${demo.toLocaleString('ko-KR')}권 — 실제 책이 아닙니다</div>`); if (q.cfg) main().insertAdjacentHTML('afterbegin', '<div class="bar info">👀 설정 미리 보기 — 저장하지 않은 설정으로 보고 있습니다</div>'); }
  function wishPage() { const L = wish(); main().innerHTML = `<h1 class="pt">♡ 찜 목록 <small>이 기기에 저장 · ${L.length}권</small></h1>${L.length ? `<div class="grid">${L.map((x) => `<div class="wcard">${cardH(x)}<div class="wact"><button class="btn ghost" data-wc="${esc(x.id)}">장바구니</button><button class="btn ghost" data-wd="${esc(x.id)}" aria-label="찜 빼기: ${esc(x.t)}">✕</button></div></div>`).join('')}</div>` : '<div class="empty">아직 찜한 책이 없습니다<br><a href="#/shelf">📚 서가 책장에서 둘러보기</a></div>'}`;
    main().querySelectorAll('[data-wd]').forEach((b) => (b.onclick = () => { setWish(wish().filter((x) => x.id !== b.dataset.wd)); wishPage(); }));
    main().querySelectorAll('[data-wc]').forEach((b) => (b.onclick = async () => { let c = {}; try { c = await cfg(); } catch (e) {} if (!c.open) return toast('문을 연 뒤에 담을 수 있습니다'); const x = wish().find((y) => y.id === b.dataset.wc); const r = B.cartAdd(cart(), x, c.maxItems); if (r.why) return toast(r.why); setCart(r.cart); toast('장바구니에 담았습니다'); })); }
  cfg().then((c) => { const n = $('#navShelf'); if (n && c && c.shelf && c.shelf.on === false) n.hidden = true; }).catch(() => {});
  async function render() { listKeep(); if (moreIO) { moreIO.disconnect(); moreIO = null; } LST.cur = location.hash; const R = B.route(location.hash); document.title = (ST.cfg && ST.cfg.name) || '북스퀸 — 헌책방'; if (SHL.h) { SHL.h.destroy(); SHL.h = null; } document.body.classList.remove('shelf-on'); window.scrollTo(0, 0); $$('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.r === R.name));
    if (R.name === 'shelf') return shelfPage(R.q); if (R.name === 'wish') return wishPage(); if (R.name === 'list') return list(R.q); if (R.name === 'b') return item(R.arg); if (R.name === 'cart') return cartPage(); if (R.name === 'order') return orderPage(); if (R.name === 'done') return done(R.arg, R.q); if (R.name === 'my') return my(); if (R.name === 'p') return policy(R.arg); return home(); }
  /* (11/11 shop4) 사진이 안 열리면(실제 배포본 점검: Storage 작은 사진 *_t.webp가 ORB로 막힘) → 큰 사진으로 한 번 더 → 그래도 안 되면 📕 (깨진 그림 아이콘 0) */
  document.addEventListener('error', (e) => { const i = e.target; if (!i || i.tagName !== 'IMG') return; const big = i.src.replace(/_t\.(webp|jpe?g|png)(?=\?|$)/i, '.$1');
    if (!i.dataset.fb && big !== i.src) { i.dataset.fb = '1'; i.src = big; return; } if (i.dataset.fb === 'x') return; i.dataset.fb = 'x'; const n = document.createElement('span'); n.className = 'noim'; n.textContent = '📕'; i.replaceWith(n); }, true);
  /* (shelf8 · 정범님 11/12) 서가에서 펼친 책 → 상세로 왔으면: 맨 위 '← 서가 책장으로' · Esc · 뒤로가기 모두 그 책 자리로(서가가 bq-shelf-ret으로 스크롤·책을 되살림) */
  const shelfRet = () => { try { const r = JSON.parse(sessionStorage.getItem('bq-shelf-ret') || 'null'); return r && r.go && Date.now() - r.t < 3 * 3600e3 ? r : null; } catch (e) { return null; } };
  const backToShelf = (r) => { if (history.length > 1 && LST.fromShelf) history.back(); else location.hash = '#/shelf?' + B.qs({ s: r.s, i: r.i, f: r.id }); };
  document.addEventListener('keydown', (e) => { if (e.key !== 'Escape' || e.defaultPrevented) return; const R = B.route(location.hash); const r = shelfRet(); if (R.name !== 'b' || !r || r.id !== R.arg) return; if (document.querySelector('.lb, .modal, dialog[open]')) return; e.preventDefault(); backToShelf(r); });
  document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('[data-backshelf]'); if (!a) return; e.preventDefault(); const r = shelfRet(); if (r) backToShelf(r); });
  window.addEventListener('hashchange', (e) => { try { LST.fromShelf = /#\/shelf/.test(new URL(e.oldURL).hash) && /#\/b\//.test(location.hash); } catch (er) { LST.fromShelf = false; } });
  window.addEventListener('hashchange', render); badge(); wishBadge(); foot(); cfg().catch(() => {}); render();
})();

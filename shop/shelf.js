/* 📚 북스퀸 서가 책장 — 화면 모듈(11/11 shelf1) · 외부 라이브러리 없음 · 셈은 shelf-core.js(BQS)
 *  쓰는 법(독립 모듈 — 우리숍 #/shelf · 리드나우2 꾸밈 블록 어디든):
 *    const h = BQShelf.mount(자리, { cfg, load(진행) → 책[], shop:{open}, cart:{ has(id), add(책) → 못 담은 까닭|null, n() }, wish:{ get(), set(목록) }, open(id), toast(글), key:'bq-shelf-' })
 *    h.destroy() — 붙인 듣개·글꼴 모두 뗌
 *  가볍게: DOM엔 지금 책장과 양옆 둘(최대 3 × 300권)만 · 그림은 화면 가까이 올 때 받음 · 글꼴은 그 책장에 쓰인 글자만(Google Fonts text=)
 *  (shelf2) 책등 모양은 상품 번호마다 한 번 정하면 영구(서버 lk · 이 기기 lk) · 앞표지 대표색은 canvas 16×16(CORS 안 되면 제목 낱말로) · 책등을 누르면 그 책등 표면에 바로 단추 셋(담기·찜·자세히)
 *  접근성: 책등 = 단추(이름에 제목·지은이·값) · 화살표 ←→ 옆 책 · ↑↓ 위아래 선반 · Home/End · Enter 담기 창 · Esc 닫기 · [ ] 책장 돌리기 · + − 확대 · 움직임 줄이기 설정을 따름 */
(function (root) {
  'use strict';
  const B = root.BQS; if (!B) throw new Error('shelf-core.js가 먼저 필요');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const won = (n) => (Math.round(+n || 0)).toLocaleString('ko-KR') + '원';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const RM = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const FONT_CSS = new Map(); /* 별칭 → <style> (최근 160개만 · 책장이 DOM에서 빠지면 그 책장 별칭도 뗌) */
  const MEM = {}; /* 정렬마다 마지막 책장·스크롤(다른 화면 갔다 와도) */

  function mount(el, o) {
    o = o || {}; const K = o.key || 'bq-shelf-';
    const LS = { get(k, d) { try { const v = localStorage.getItem(K + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(K + k, JSON.stringify(v)); } catch (e) {} } };
    const C0 = B.cfgOf(o.cfg); let VW = null; const view = () => (C0.viewerCfg ? (VW || (VW = LS.get('view', {}) || {})) : {}); /* (shelf4) 기기 저장소를 책등마다 읽던 것 → 한 번(첫 책장 0.8초 → 0.1초) */
    let C = B.cfgOf({ ...C0, ...view() }); /* 손님 ⚙ 보기(움직임·글 방향·툴팁 등)는 이 기기만 */
    const st = { items: [], P: null, sort: (C.remember && LS.get('sort', null)) || o.sort || C.sort0, j: 0, z: +LS.get('zoom', 0) || (root.innerWidth && innerWidth < 520 ? Math.max(0.5, Math.round(C.zoom0 * 0.8 * 100) / 100) : C.zoom0), /* 휴대폰은 처음에 조금 작게(한 화면에 책이 더) */ W: 0, busy: false, dead: false, focusId: null, tipT: 0 };
    if (!C.sorts.includes(st.sort)) st.sort = C.sorts.includes(C.sort0) ? C.sort0 : C.sorts[0];
    const offs = []; const on = (t, ev, fn, op) => { t.addEventListener(ev, fn, op); offs.push(() => t.removeEventListener(ev, fn, op)); };
    const sortOpts = () => B.SORTS.filter(([k]) => C.sorts.includes(k)).map(([k, n]) => `<option value="${k}"${k === st.sort ? ' selected' : ''}>${esc(n)}</option>`).join('');
    el.innerHTML = `<section class="bqs room-${esc(C.room)} wood-${esc(C.wood)}" aria-label="${esc(C.title)}">
      <div class="bqs-bar" role="toolbar" aria-label="책장 도구">
        <h1 class="bqs-h">📚 ${esc(C.title)} <small class="bqs-n" aria-live="polite"></small></h1>
        <label class="bqs-sl">정렬 <select class="bqs-sort" aria-label="정렬">${sortOpts()}</select></label>
        <div class="bqs-zoom" role="group" aria-label="확대"><button type="button" data-z="-" aria-label="작게">−</button><output class="bqs-zv" aria-live="polite">100%</output><button type="button" data-z="+" aria-label="크게">+</button><button type="button" data-z="1" class="bqs-z1" aria-label="원래 크기">1:1</button></div>
        <a class="bqs-wl" href="#/wish" aria-label="찜 목록">♡ 찜 <b class="bqs-wn">0</b></a>
        ${C0.viewerCfg ? '<button type="button" class="bqs-gear" aria-expanded="false" aria-controls="bqsView">⚙ 보기</button>' : ''}
      </div>
      <div class="bqs-view" id="bqsView" hidden></div>
      <nav class="bqs-nav" aria-label="책장 넘기기" hidden><button type="button" class="bqs-pv"></button><div class="bqs-here"><b></b><small></small><div class="bqs-dots" aria-hidden="true"></div><span class="bqs-loop" title="끝과 끝이 이어진 둥근 책장 — 마지막 다음은 처음" aria-hidden="true">↻ 이어짐</span></div><button type="button" class="bqs-nx"></button></nav>
      <div class="bqs-chips" role="tablist" aria-label="책장(분야) 고르기" hidden></div>
      <div class="bqs-stage"><div class="bqs-ring"></div><div class="bqs-load" role="status"><div class="bqs-lbar"><i></i></div><span>책을 꽂는 중…</span></div></div>
      <button type="button" class="bqs-arrow l" aria-label="이전 책장" hidden><i class="ab" aria-hidden="true"><span>‹</span></i><em class="pk" aria-hidden="true"></em></button><button type="button" class="bqs-arrow r" aria-label="다음 책장" hidden><i class="ab" aria-hidden="true"><span>›</span></i><em class="pk" aria-hidden="true"></em></button>
      <div class="bqs-tip" role="tooltip" hidden></div><div class="bqs-pop" role="dialog" aria-modal="false" hidden></div>
      <div class="bqs-mbar" role="toolbar" aria-label="서가 도구" hidden><label class="mb-s"><span>정렬</span><select class="bqs-msort" aria-label="정렬">${sortOpts()}</select></label><button type="button" class="mb-v" aria-pressed="false">🖼 표지</button><a class="mb-w" href="#/wish" aria-label="찜 목록">♡ <b class="bqs-wn2">0</b></a><a class="mb-c" href="#/cart" aria-label="장바구니">🛒 <b class="bqs-cn2">0</b></a></div>
      <div class="bqs-sheet" hidden><div class="sh-bg" data-a="x"></div><div class="sh-p" role="dialog" aria-modal="true" aria-label="책 보기"><div class="sh-grip" aria-hidden="true"></div><div class="sh-in"></div></div></div>
      <a class="bqs-cart" href="#/cart" aria-label="장바구니"><span class="bqs-cart-i" aria-hidden="true">🛒</span><b class="bqs-cn">0</b></a>
      <div class="bqs-sr" aria-live="polite"></div></section>`;
    const $ = (s) => el.querySelector(s); const sec = $('.bqs'), ring = $('.bqs-ring'), stage = $('.bqs-stage'), tip = $('.bqs-tip'), pop = $('.bqs-pop'), live = $('.bqs-sr');
    const say = (m) => { live.textContent = ''; setTimeout(() => { live.textContent = m; }, 30); };
    const badge = () => { WS = null; const n = o.cart && o.cart.n ? o.cart.n() : 0; $('.bqs-cn').textContent = n; $('.bqs-cart').classList.toggle('has', n > 0); const w = (o.wish && o.wish.get()) || []; $('.bqs-wn').textContent = w.length; const c2 = $('.bqs-cn2'), w2 = $('.bqs-wn2'); if (c2) c2.textContent = n; if (w2) w2.textContent = w.length; };
    const setZ = (z, anchor) => { z = Math.round(clamp(z, 0.5, 4) * 100) / 100; if (z === st.z && sec.style.getPropertyValue('--z')) return; const a = anchor || centerSpine(); const y0 = a ? a.getBoundingClientRect().top : 0;
      st.z = z; sec.style.setProperty('--z', z); $('.bqs-zv').textContent = Math.round(z * 100) + '%'; LS.set('zoom', z); relayout(); cutAll(); if (a && a.isConnected) { const y1 = a.getBoundingClientRect().top; window.scrollBy(0, y1 - y0); } };
    sec.style.setProperty('--rh', C.rowH); sec.style.setProperty('--z', st.z); $('.bqs-zv').textContent = Math.round(st.z * 100) + '%';

    /* ── 책장 하나 그리기 */
    let WS = null; const wishSet = () => WS || (WS = new Set(((o.wish && o.wish.get()) || []).map((w) => (w && typeof w === 'object' ? w.id : w)))); const isWish = (id) => wishSet().has(id); /* (shelf4) 찜 목록도 한 번만 읽어 둠 — 바뀌면 badge()가 지움 */
    /* (shelf3) 세로쓰기에서 짧은 숫자(1~2자리)는 세워 묶음(text-combine-upright) · (shelf4) 영문·긴 숫자 덩어리는 따로 감싸 앞뒤 한글과 띄움(리드 화면 확인: '와Python'·'딩100'·'밀1'이 붙어 엉킴) */
    const tcy = (t) => { const S = String(t == null ? '' : t); const re = /([A-Za-z][A-Za-z0-9'’.&+\-]*(?: [A-Za-z0-9][A-Za-z0-9'’.&+\-]*)*)|([0-9]{3,})|([0-9]{1,2})|([:;,…!?]+)/g; let o = '', k = 0, m;
      while ((m = re.exec(S))) { o += esc(S.slice(k, m.index)); o += m[3] != null ? `<span class="tcy">${m[0]}</span>` : m[4] != null ? `<span class="pn">${esc(m[0])}</span>` : `<span class="lt">${esc(m[0])}</span>`; k = m.index + m[0].length; } return o + esc(S.slice(k)); };
    const auOf = (x) => B.auName(x.a); /* (shelf4) 책등엔 이름만 */
    const spineH = (x, cs, ck) => { const L = lookOf(x); const f = B.fontById(L.f); const fb = f.gen === 'serif' ? `'Noto Serif KR','Batang','AppleMyungjo',serif` : `'Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo',${f.gen}`; const ff = C.fontsOn ? `'bqf-${L.f}-${ck}','${f.name}',${fb}` : fb; /* (shelf4) 받기 전·못 받을 때도 세로 글자 자리(세로 metrics)가 바른 한글 글꼴로 */ const img = C.spineImg && x.sp; const tg = B.tagOf(x); const so = B.saleOf(x);
      const lab = `${x.t}${x.a ? ' · ' + x.a : ''} · ${won(x.p)}${so && so.from === 'p0' ? ` (할인 ${so.pct}% · 원래 ${won(so.was)})` : ''}${tg && tg.k !== 'sale' ? ' · ' + B.BADGE[tg.k] : ''}${x.st === 'o' ? ' · 주문 중' : ''}${isWish(x.id) ? ' · 찜함' : ''}`;
      return `<button type="button" class="sp${img ? ' img' : ''}${x.st === 'o' ? ' held' : ''}${isWish(x.id) ? ' wished' : ''}${tg ? ' tag' : ''}${L.tilt ? ' tilt' + (L.tilt > 0 ? 'r' : 'l') : ''}" data-id="${esc(x.id)}" data-d="${L.d}" data-p="${L.p}" data-s="${L.body}" data-h="${L.head}" data-o="${L.o}" data-tk="${L.tk}" data-fg="${L.fg}"${L.tp ? ' data-tp="1"' : ''}${L.thin ? ' data-thin="1"' : ''} tabindex="-1" aria-label="${esc(lab)}" style="--bw:${L.w};--bh:${L.h};--c:${L.c};--c2:${L.c2};--k:${L.k};--g:${L.ac};--ft:${L.ft};--fa:${L.fa};--fw:${L.fw};--zt:${L.zt};--zb:${L.zb};--zs:${L.zs};${L.tp ? `--tp:${L.tp};` : ''}font-family:${esc(ff)}"><span class="sk">${img ? `<img class="si" src="${esc(x.sp)}" alt="" loading="lazy" decoding="async">` : ''}${L.head > 1 ? '<span class="hd" aria-hidden="true"></span>' : ''}${x.st === 'o' ? '<span class="hb" aria-hidden="true">주문중</span>' : ''}<span class="tx" aria-hidden="true"><span class="tt">${tcy(x.t)}</span>${auOf(x) ? `<span class="au">${tcy(auOf(x))}</span>` : ''}</span>${L.d === 37 ? `<span class="cn" aria-hidden="true">${B.callNo(x).map(esc).join('<br>')}</span>` : ''}${tg ? `<span class="bt bt-${tg.k}" aria-hidden="true">${esc(tg.t)}</span>` : ''}</span><span class="rb" aria-hidden="true"></span></button>`; };
    /* ── (shelf3) 책등 글 맞추기 — 실제로 재서 맞춤(정범님 '확대하면 전체, 축소하면 줄임' · 리드 화면 확인: 잘림·넘침·겹침)
     *  글 자리(.tx = 장식이 없는 곳) 안에서 제목·지은이 칸 높이를 나누고, 글자 크기를 반씩 좁혀 찾음(모든 책등을 한꺼번에 — 쓰기 한 번·읽기 한 번 × 8번)
     *  가장 작은 글자(minFs · 화면 px)로도 안 들어가면 그때만 앞부분 + 「…」 — 글이 글 자리 밖으로 나가는 일은 없음 */
    const FIT = { z: 0, fk: 0 };
    function fitSpines(list) { if (st.dead) return; const t0 = performance.now(); const sps = [...list].filter((b) => b.isConnected && !(b.classList.contains('img') && b.classList.contains('ok'))); if (!sps.length) return;
      const minF = C.minFs, J = [];
      for (const b of sps) { const tx = b.querySelector('.tx'); if (!tx) continue; const tt = tx.querySelector('.tt'), au = tx.querySelector('.au'); const x = byId.get(b.dataset.id) || { t: tt.textContent, a: au ? au.textContent : '' };
        J.push({ b, tx, tt, au, t: x.t || '', a: (au && (x.a != null ? auOf(x) : au.textContent)) || '', W: 0, H: 0 }); }
      for (const j of J) if (j.au) { j.au.style.display = ''; j.b.classList.remove('noau'); }
      for (const j of J) if (j.b.classList.contains('cut')) { j.tt.innerHTML = tcy(j.t); if (j.au) j.au.innerHTML = tcy(j.a); j.b.classList.remove('cut'); } /* 줄였던 책만 글을 되돌림 */
      for (const j of J) { j.W = j.tx.clientWidth; j.H = j.tx.clientHeight; }
      for (const j of J) { const nt = Math.max(1, [...j.t].length), na = j.au ? [...j.a].length : 0; const gap = na ? Math.max(3, j.H * 0.045) : 0; const ra = na ? clamp(na / (nt + na), 0.14, 0.32) : 0;
        j.Ha = j.H * ra; j.Ht = j.H - j.Ha - gap; j.tt.style.height = j.Ht + 'px'; if (j.au) j.au.style.height = j.Ha + 'px'; }
      /* (shelf4 · 정범님 11/12) 세로 제목은 웬만하면 한 줄(.one) — 한 줄로는 너무 작아질 때만 여러 줄(.ml · 왼쪽 줄부터 오른쪽으로 · 줄 사이 넓게 · 줄 머리 맞춤) */
      const LHM = 1.34; const mode = (el, m) => { el.classList.toggle('one', m === 'one'); el.classList.toggle('ml', m === 'ml'); };
      const fits = (el, W, H) => { const tx = el.parentNode; return el.offsetWidth <= W - 2 && el.scrollWidth <= W - 2 && el.scrollHeight <= H + 0.5 && tx.scrollWidth <= tx.clientWidth && tx.scrollHeight <= tx.clientHeight; }; /* 글 자리 넘침까지 · 양옆 1px씩 남김 · scrollWidth = 잉크가 삐져나온 것까지 */
      const est = (n, W, H, hi) => { for (let f = hi; f > minF; f -= 0.25) { const per = Math.max(1, Math.floor(H / (f * 1.08))); if (Math.ceil(n / per) * f * LHM <= W - 2) return f; } return minF; };
      /* ① 한 줄: 큰 글자로 한 번 재서 글 길이를 알고 비례로 줄임(재기 2~3번) */
      const one = (pick, hiOf, txt) => { const S = J.map((j) => { const el = pick(j); if (!el) return null; const H = el === j.tt ? j.Ht : j.Ha; return { j, el, H, hi: Math.max(minF, hiOf(j, H)), n: [...txt(j)].length, f: 0, ok: false }; }).filter(Boolean);
        for (const q of S) { mode(q.el, 'one'); q.el.style.fontSize = q.hi + 'px'; } for (const q of S) q.len = q.el.scrollHeight;
        for (const q of S) { q.f = Math.min(q.hi, Math.floor(q.hi * (q.H - 1) / Math.max(1, q.len) * 0.985 * 4) / 4); q.el.style.fontSize = Math.max(minF, q.f) + 'px'; }
        let L = S.filter((q) => q.f >= minF); for (let it = 0; it < 4 && L.length; it++) { for (const q of L) q.ok = fits(q.el, q.j.W, q.H); L = L.filter((q) => !q.ok && q.f > minF); for (const q of L) { q.f = Math.max(minF, Math.round(q.f * 0.94 * 4) / 4); q.el.style.fontSize = q.f + 'px'; } }
        return S; };
      /* ② 여러 줄: 셈으로 어림 → 재 보고 안 되면 8%씩 줄임 → 한 번 더 키워 봄 */
      const multi = (L0, hiOf, txt) => { const S = L0.map((q) => ({ ...q, f: est(q.n, q.j.W, q.H, q.hi), ok: false, bad: null })); for (const q of S) mode(q.el, 'ml');
        let L = S; for (let it = 0; it < 8 && L.length; it++) { for (const q of L) q.el.style.fontSize = q.f + 'px'; for (const q of L) q.ok = fits(q.el, q.j.W, q.H);
          L = L.filter((q) => !q.ok && q.f > minF); for (const q of L) { q.bad = q.f; q.f = Math.max(minF, Math.round(q.f * 0.92 * 4) / 4); } }
        const up = S.filter((q) => q.ok && q.bad && q.bad - q.f > 0.6); for (const q of up) { q.f0 = q.f; q.el.style.fontSize = (q.f + q.bad) / 2 + 'px'; } for (const q of up) if (fits(q.el, q.j.W, q.H)) q.f0 = (q.f + q.bad) / 2; for (const q of up) { q.f = q.f0; q.el.style.fontSize = q.f0 + 'px'; }
        return S; };
      /* 한 줄이 여러 줄보다 많이 작지 않으면(50% 넘게) 한 줄 · 여러 줄로도 다 안 들어가면 한 줄로 돌아가 줄임(…) */
      const lay = (pick, hiOf, txt) => { const S1 = one(pick, hiOf, txt); const go2 = S1.filter((q) => !q.ok || q.f < 0.5 * est(q.n, q.j.W, q.H, q.hi)); const back = new Map(go2.map((q) => [q, q.f]));
        const S2 = go2.length ? multi(go2, hiOf, txt) : []; const cut = [];
        for (const q of S2) { const q1 = go2[S2.indexOf(q)]; if (q.ok && !(q1.ok && q.f < back.get(q1) * 1.12)) continue; if (q1.ok) { mode(q.el, 'one'); q.el.style.fontSize = back.get(q1) + 'px'; continue; } mode(q.el, 'one'); cut.push(q); }
        return cut; };
      const trim = (L, txt) => { const put = (u) => { u.q.el.innerHTML = tcy(u.ch.slice(0, u.n).join('').replace(/\s+$/, '')) + '<span class="pn">…</span>'; };
        let S = L.map((q) => { const ch = [...txt(q.j)]; const per = Math.max(1, Math.floor(q.H / (minF * 1.04))); return { q, ch, n: Math.max(0, Math.min(ch.length - 1, per - 1)) }; });
        for (const u of S) { mode(u.q.el, 'one'); u.q.el.style.fontSize = minF + 'px'; u.q.j.b.classList.add('cut'); }
        for (let it = 0; it < 10 && S.length; it++) { for (const u of S) put(u); S = S.filter((u) => !fits(u.q.el, u.q.j.W, u.q.H) && u.n > 0); for (const u of S) u.n = Math.max(0, Math.min(u.n - 1, Math.floor(u.n * 0.85))); }
        for (const u of S) { u.n = 0; put(u); }
        /* 지은이가 한 글자도 안 들어가면(「…」만 남음) 지은이는 숨김 — 다시 맞출 때 되살림 */
        for (const u of L.map((q) => q).filter((q) => q.el === q.j.au)) { const tx0 = u.el.textContent.replace('…', ''); if ([...tx0].length < 2 || !fits(u.el, u.j.W, u.H)) { u.el.style.display = 'none'; u.j.b.classList.add('noau'); } } };
      for (const j of J) if (j.au) j.au.style.display = 'none'; /* 제목을 맞추는 동안 지은이는 잠깐 숨김 */
      const hiT = (j, H) => Math.min(j.W * 0.9, H * 0.9, 34 * st.z, 46);
      if (C.fullText) { const cutT = lay((j) => j.tt, hiT, (j) => j.t); trim(cutT, (j) => j.t); }
      else { for (const j of J) { mode(j.tt, 'one'); j.tt.style.fontSize = clamp(j.W * 0.62, minF, 18 * st.z) + 'px'; } trim(J.filter((j) => !fits(j.tt, j.W, j.Ht)).map((j) => ({ j, el: j.tt, H: j.Ht })), (j) => j.t); }
      for (const j of J) j.ftNow = parseFloat(j.tt.style.fontSize) || minF; for (const j of J) if (j.au) j.au.style.display = '';
      /* 지은이 = 제목보다 뚜렷이 작게(제목의 62% 아래 · 강약) */
      const hiA = (j, H) => Math.min(j.W * 0.8, H * 0.9, (j.ftNow || minF) * 0.62, 20 * st.z, 24);
      if (C.fullText) { const cutA = lay((j) => j.au, hiA, (j) => j.a); trim(cutA, (j) => j.a); }
      else { const L = J.filter((j) => j.au); for (const j of L) { mode(j.au, 'one'); j.au.style.fontSize = clamp(j.W * 0.45, minF, 13 * st.z) + 'px'; } trim(L.filter((j) => !fits(j.au, j.W, j.Ha)).map((j) => ({ j, el: j.au, H: j.Ha })), (j) => j.a); }
      for (const j of J) { j.b.dataset.ft = Math.round((parseFloat(j.tt.style.fontSize) || 0) * 10) / 10; j.b.dataset.fz = st.z; } sec.dataset.fit = (+sec.dataset.fit || 0) + 1; sec.dataset.fitMs = Math.round(performance.now() - t0); /* 시험이 '다시 맞췄나'·걸린 시간 봄 */ }
    /* 지금 책장은 바로 · 양옆 책장은 한가할 때(또는 돌기 직전) — 확대·글꼴이 바뀌면 다시(확대 중엔 0.15초 모아서) */
    /* (shelf4 첫 화면 1초) 지금 화면 안(과 한 화면 아래)까지만 바로 맞추고, 나머지는 한가할 때 60권씩 — 다 맞추면 sec.dataset.fitBusy 지움 */
    let fitTok = 0; const idleF = (f) => (root.requestIdleCallback ? root.requestIdleCallback(f, { timeout: 300 }) : setTimeout(f, 30));
    const fitCase = (c) => { const key = String(st.z) + '|' + (+sec.dataset.fk || 0); if (!c || c.dataset.fz === key) return; c.dataset.fz = key; const tok = ++fitTok; const all = [...c.querySelectorAll('.sp')]; const H = innerHeight || 900, W = innerWidth || 1400;
      const near = [], rest = []; for (const b of all) { const r = b.getBoundingClientRect(); (r.top < H && r.bottom > 0 && r.left < W ? near : rest).push(b); }
      fitSpines(near); if (!rest.length) { delete sec.dataset.fitBusy; return; } sec.dataset.fitBusy = '1';
      const step = () => { if (st.dead || tok !== fitTok || c.dataset.fz !== key) return; fitSpines(rest.splice(0, 60)); if (rest.length) idleF(step); else delete sec.dataset.fitBusy; }; idleF(step); };
    let sideT = 0; const fitSides = () => { clearTimeout(sideT); const idle = root.requestIdleCallback || ((f) => setTimeout(f, 200)); sideT = setTimeout(() => idle(() => { if (!st.dead && !st.busy) [...ring.children].forEach((c) => fitCase(c)); }), 250); };
    let fitT = 0; const refit = (fontChanged) => { if (fontChanged) sec.dataset.fk = (+sec.dataset.fk || 0) + 1; clearTimeout(fitT); fitT = setTimeout(() => { fitT = 0; fitCase(curCase()); fitSides(); }, 150); };
    const cutAll = () => refit();
    try { if (document.fonts && document.fonts.addEventListener) { const fl = () => refit(true); document.fonts.addEventListener('loadingdone', fl); offs.push(() => document.fonts.removeEventListener('loadingdone', fl)); } } catch (e) {}
    /* ── 책등 모양 영구 저장(정범님 11/11): 서버에 정해진 것(x.lk) → 이 기기에 정한 것 → 새로 정함(앞표지 대표색을 기다려야 하면 잠깐 임시 모양 · 저장 안 함) */
    const LKC = new Map(); const LKL = LS.get('lk', {}) || {}; const LQ = []; let lkT = 0; const gen = C0.lookGen || 0;
    const CC = { ok: !!(root.document && root.HTMLCanvasElement), fail: 0, okN: 0, got: new Map(), done: new Set(), q: [], run: 0 };
    function keep(id, code) { if (!C0.lookKeep) return; LKL[id] = code; LQ.push([id, code]); clearTimeout(lkT); lkT = setTimeout(() => { const ks = Object.keys(LKL); if (ks.length > 6000) ks.slice(0, ks.length - 6000).forEach((k) => delete LKL[k]); LS.set('lk', LKL);
      const L = LQ.splice(0, LQ.length); if (L.length && o.saveLooks) for (let i = 0; i < L.length; i += 300) o.saveLooks(L.slice(i, i + 300), gen); }, 2500); }
    keep.flush = () => { clearTimeout(lkT); lkT = setTimeout(() => { const L = LQ.splice(0, LQ.length); if (L.length && o.saveLooks) for (let i = 0; i < L.length; i += 300) o.saveLooks(L.slice(i, i + 300), gen); }, 2500); };
    function lookOf(x) { let L = LKC.get(x.id); if (L) return L; let A = null; let temp = false;
      if (C0.lookKeep) for (const code of [x.lk, LKL[x.id]]) { const a = code && B.decode(code); if (a && a.g === gen) { A = a; if (code !== x.lk && !o.demo) { LQ.push([x.id, code]); keep.flush(); } break; } } /* 이 기기에만 있던 모양은 서버에도 알림(서버가 먼저 정한 것이 있으면 서버 것) */
      if (!A) { /* (shelf4) 앞표지 대표색·글꼴 갈래는 클라우드가 미리 셈해 cv로 보냄(우리 저장소 그림은 CORS가 닫혀 손님 화면이 못 읽음 — 11/12 확인) · 아직 셈 전이면 임시 모양(저장 안 함) · 다른 곳 그림만 화면에서 읽어 봄 */
        const ours = /firebasestorage\.googleapis\.com/.test(x.im || ''); const useCv = C0.coverColor && x.im && !(C0.spineImg && x.sp);
        if (useCv && x.cv) { A = B.assign(x, C0, x.cc || null); keep(x.id, B.encode(A)); } else if (useCv && ours) { A = B.assign(x, C0, null); temp = true; }
        else { const want = useCv && CC.ok && !CC.done.has(x.id); A = B.assign(x, C0, CC.got.get(x.id) || null); if (want) { temp = true; ccAsk(x); } else keep(x.id, B.encode(A)); } }
      const vo = view().orient; if (vo === 'v' || vo === 'h') A = { ...A, o: vo }; /* 손님 ⚙ 보기 글 방향은 그 기기 화면만(저장하는 모양은 그대로) */
      L = B.dress(x, A, C); L.temp = temp; LKC.set(x.id, L); return L; }
    /* 앞표지 대표색 — 16×16으로 줄여 읽음(그림 서버가 CORS를 안 열면 canvas가 막힘 → 4번 막히면 이 화면에선 그만 · 제목 낱말로) */
    function readColor(u) { return new Promise((ok) => { let dn = false; const im = new Image(); const fin = (v) => { if (dn) return; dn = true; clearTimeout(t); ok(v); }; const t = setTimeout(() => fin(undefined), 6000);
      im.crossOrigin = 'anonymous'; im.decoding = 'async'; im.onload = () => { try { const cv = document.createElement('canvas'); cv.width = cv.height = 16; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, 16, 16); CC.okN++; fin(B.dominant(g.getImageData(0, 0, 16, 16).data)); } catch (e) { CC.fail++; fin(null); } };
      im.onerror = () => { CC.fail++; fin(null); }; im.src = u; }); }
    function ccAsk(x) { CC.q.push(x); ccRun(); }
    function ccRun() { while (CC.run < 3 && CC.q.length && !st.dead) { const x = CC.q.shift(); if (CC.done.has(x.id)) continue; CC.run++;
      readColor(x.im).then((hex) => { CC.run--; if (st.dead) return; if (hex === undefined) { ccRun(); return; } CC.done.add(x.id); if (hex) CC.got.set(x.id, hex); if (CC.fail >= 4 && !CC.okN) CC.ok = false;
        LKC.delete(x.id); const A = B.assign(x, C0, hex || null); keep(x.id, B.encode(A)); const b = ring.querySelector(`.sp[data-id="${CSS.escape(x.id)}"]`); if (b && b !== popFor) { const c = b.closest('.bqs-case'); const ti = b.tabIndex; b.outerHTML = spineH(x, null, st.sort + c.dataset.i); const n = ring.querySelector(`.sp[data-id="${CSS.escape(x.id)}"]`); if (n) { n.tabIndex = ti; if (c.classList.contains('cur')) fitSpines([n]); } ccFont(); }
        if (!CC.ok) CC.q.splice(0).forEach((y) => { CC.done.add(y.id); LKC.delete(y.id); keep(y.id, B.encode(B.assign(y, C0, null))); }); ccRun(); }); } }
    let ccFT = 0; const ccFont = () => { clearTimeout(ccFT); ccFT = setTimeout(() => fontsFor(curCase()), 400); };
    const labH = (s) => `<div class="lab" role="heading" aria-level="3"><span>${esc(s.lab)}</span><small>${(s.n || 0).toLocaleString('ko-KR')}권</small></div>`;
    /* ── (shelf4 · 정범님 11/12 휴대폰은 형식을 달리) 휴대폰 책장 = 분야 줄마다 가로로 쓸어 넘기는 선반(넷플릭스·쿠팡 홈의 '줄마다 한 주제' 가로 줄) · 표지 보기(알라딘·교보 앱 목록처럼 표지) ↔ 책등 보기 */
    const MOB = () => (root.innerWidth || 1000) < 640; st.mob = MOB(); st.cov = !!LS.get('cov', false);
    const coverH = (x) => { const so = B.saleOf(x); return `<button type="button" class="sp cvb${x.st === 'o' ? ' held' : ''}${isWish(x.id) ? ' wished' : ''}" data-id="${esc(x.id)}" tabindex="-1" aria-label="${esc(x.t)} · ${won(x.p)}"><span class="cvf">${x.im ? `<img src="${esc(x.im)}" alt="" loading="lazy" decoding="async">` : `<i>${esc(x.t)}</i>`}${so && so.from === 'p0' ? `<em>−${so.pct}%</em>` : ''}${x.st === 'o' ? '<u>주문중</u>' : ''}</span><b>${esc(x.t)}</b><small>${won(x.p)}</small></button>`; };
    function caseM(j) { const P = st.P; const N = P.cases.length; const i = B.mod(j, N); const cs = P.cases[i]; const ck = st.sort + i; const rows = []; let cur = null;
      for (const sl of cs.slots) { if (sl.lab) { cur = { h: sl.lab, n: sl.n, L: [] }; rows.push(cur); continue; } if (!cur || cur.L.length >= 24) { const b0 = cur ? cur.b || cur.h : null; cur = { h: b0 ? b0 + ' (이어서)' : cs.name, b: b0 || cs.name, n: 0, L: [] }; rows.push(cur); } cur.L.push(sl); } /* (shelf5) 이어진 줄도 처음 표찰에 '(이어서)'를 한 번만(전엔 줄마다 덧붙어 「영미소설 (이어서) (이어서)」) */
      return `<div class="bqs-case mcase" data-j="${j}" data-i="${i}" role="region" aria-label="책장 ${i + 1}/${N}: ${esc(cs.name)}" style="transform:${place(j)}"><header class="bqs-top"><b>${esc(cs.name)}</b> <small>${esc(cs.sub || '')} · ${cs.n.toLocaleString('ko-KR')}권</small></header>
        ${rows.map((r, k) => `<section class="mrow" aria-label="${esc(r.h)}"><h3>${esc(r.h)}${r.n ? ` <small>${r.n.toLocaleString('ko-KR')}권</small>` : ''}</h3><div class="mstrip${st.cov ? ' cov' : ''}" role="group">${r.L.map((x) => (st.cov ? coverH(x) : spineH(x, cs, ck))).join('')}</div></section>`).join('')}</div>`; }
    function chipsH() { const ch = $('.bqs-chips'); if (!st.mob || !st.P || st.P.cases.length <= 1) { ch.hidden = true; return; } const N = st.P.cases.length; const i = B.mod(st.j, N); ch.hidden = false;
      if (ch.dataset.k !== st.sort + N) { ch.innerHTML = st.P.cases.map((c, k) => `<button type="button" role="tab" data-ci="${k}" aria-selected="false">${esc(c.name)}</button>`).join(''); ch.dataset.k = st.sort + N; }
      ch.querySelectorAll('[data-ci]').forEach((b) => { const on = +b.dataset.ci === i; b.setAttribute('aria-selected', String(on)); if (on) b.scrollIntoView({ block: 'nearest', inline: 'center' }); }); }
    function caseH(j) { if (st.mob) return caseM(j); const P = st.P; const N = P.cases.length; const i = B.mod(j, N); const cs = P.cases[i]; const ck = st.sort + i; const W = innerW(); const k = B.bays(W, C, st.z);
      const parts = B.split(cs.slots, k);
      return `<div class="bqs-case" data-j="${j}" data-i="${i}" role="region" aria-roledescription="책장" aria-label="책장 ${i + 1}/${N}: ${esc(cs.name)}" style="transform:${place(j)}">
        <header class="bqs-top"><b>${esc(cs.name)}</b> <small>${esc(cs.sub || '')} · ${cs.n.toLocaleString('ko-KR')}권</small></header>
        <div class="bqs-bays" style="--k:${k}">${parts.map((ps, b) => `<div class="bqs-bay" role="group" aria-label="${b + 1}번째 칸">${ps.map((s) => (s.lab ? labH(s) : spineH(s, cs, ck))).join('')}</div>`).join('')}</div>
        <div class="bqs-foot" aria-hidden="true"></div></div>`; }
    const innerW = () => Math.max(260, (st.W || stage.clientWidth) - 24); /* (shelf4) sync가 잰 폭을 씀 — 책장마다 다시 재면 3D 장면 전체를 다시 배치(첫 화면 2초의 원인) */
    /* ── 원형 배치 · 돌리기 */
    let RG = B.ring(1, 1000);
    const DIR = -1; /* (shelf3 · 정범님 11/12) 도는 방향 뒤집음: 다음 책장은 오른쪽에 서 있다가 → · ] · 왼쪽으로 쓸기로 다가옴 */
    const place = (j) => (C.turn3d ? `rotateY(${DIR * j * RG.step}deg) translateZ(${-RG.R}px)` : `translateX(${j * (st.W + 40)}px)`);
    const ringT = (j, pull) => (C.turn3d ? `translateZ(${RG.R - (pull || 0)}px) rotateY(${-DIR * j * RG.step}deg)` : `translateX(${-j * (st.W + 40)}px) scale(${pull ? 0.94 : 1})`);
    const want = () => { const N = st.P.cases.length; if (N <= 1) return [st.j]; if (N === 2) return [st.j, st.j + 1]; return [st.j - 1, st.j, st.j + 1]; };
    function sync(full) { /* 필요한 책장만 DOM에 */ if (!st.P || st.dead) return; st.W = stage.clientWidth; RG = B.ring(st.P.cases.length, st.W); stage.style.perspective = RG.persp + 'px';
      const need = new Set(want()); [...ring.children].forEach((c) => { const j = +c.dataset.j; if (full || !need.has(j)) { if (!need.has(j)) fontsDrop(c); c.remove(); } });
      const have = new Set([...ring.children].map((c) => +c.dataset.j)); if (!have.has(st.j)) ring.insertAdjacentHTML('beforeend', caseH(st.j));
      /* (shelf4 첫 화면 1초) 양옆 책장은 지금 책장을 그린 뒤 한가할 때 넣음(전엔 셋을 한꺼번에 — 3D 장면 배치가 600권이라 2초) */
      const side = [...need].filter((j) => j !== st.j && !have.has(j)); if (side.length) { const tok = (st.sideTok = (st.sideTok || 0) + 1); idleF(() => { if (st.dead || tok !== st.sideTok || st.busy) return; const h2 = new Set([...ring.children].map((c) => +c.dataset.j)); for (const j of side) if (!h2.has(j) && want().includes(j)) { ring.insertAdjacentHTML('beforeend', caseH(j)); const c = ring.querySelector(`.bqs-case[data-j="${j}"]`); c.style.transform = place(j); c.inert = true; c.setAttribute('aria-hidden', 'true'); } fitSides(); }); }
      [...ring.children].forEach((c) => { c.style.transform = place(+c.dataset.j); const cur = +c.dataset.j === st.j; c.classList.toggle('cur', cur); c.inert = !cur; c.setAttribute('aria-hidden', cur ? 'false' : 'true'); });
      ring.style.transform = ringT(st.j); fitCase(curCase()); fitSides(); fitH(); fontsFor(curCase()); roving(); navH(); }
    const curCase = () => ring.querySelector(`.bqs-case[data-j="${st.j}"]`);
    function fitH() { if (st.dead) return; const c = curCase(); if (c) stage.style.height = c.offsetHeight + 'px'; }
    function navH() { const N = st.P.cases.length; const i = B.mod(st.j, N); const cs = st.P.cases[i]; const nv = $('.bqs-nav'); nv.hidden = N <= 1; $('.bqs-arrow.l').hidden = $('.bqs-arrow.r').hidden = N <= 1;
      const nm = (d) => st.P.cases[B.mod(st.j + d, N)].name; $('.bqs-pv').innerHTML = `‹ <span>${esc(nm(-1))}</span>`; $('.bqs-nx').innerHTML = `<span>${esc(nm(1))}</span> ›`; $('.bqs-pv').setAttribute('aria-label', '이전 책장: ' + nm(-1)); $('.bqs-nx').setAttribute('aria-label', '다음 책장: ' + nm(1));
      $('.bqs-arrow.l').setAttribute('aria-label', '이전 책장: ' + nm(-1)); $('.bqs-arrow.r').setAttribute('aria-label', '다음 책장: ' + nm(1)); $('.bqs-arrow.l .pk').textContent = '‹ ' + nm(-1); $('.bqs-arrow.r .pk').textContent = nm(1) + ' ›'; $('.bqs-loop').hidden = N <= 2;
      $('.bqs-here b').textContent = cs.name; $('.bqs-here small').textContent = `${i + 1} / ${N} · ${B.compass(i, i, N)}쪽 · 다음 책장은 ${B.compass(i + 1, i, N)}쪽`;
      const D = Math.min(N, 24); $('.bqs-dots').innerHTML = N > 1 ? Array.from({ length: D }, (_, k) => `<i class="${Math.floor(i * D / N) === k ? 'on' : ''}"></i>`).join('') : '';
      MEM[st.sort] = { j: st.j }; LS.set('pos', { s: st.sort, i }); o.onState && o.onState({ s: st.sort, i }); chipsH(); $('.bqs-mbar').hidden = !st.mob; sec.classList.toggle('mob', st.mob); try { document.body.classList.toggle('shelf-mob', st.mob); } catch (e) {} const mv = $('.mb-v'); mv.setAttribute('aria-pressed', String(st.cov)); mv.textContent = st.cov ? '📚 책등' : '🖼 표지'; mv.setAttribute('aria-label', st.cov ? '책등 보기로' : '표지 보기로'); }
    function turn(d) { if (!st.P || st.busy || st.P.cases.length <= 1) return; closePop(); hideTip(); const N = st.P.cases.length; const j0 = st.j, j1 = st.j + d;
      if (!ring.querySelector(`.bqs-case[data-j="${j1}"]`)) ring.insertAdjacentHTML('beforeend', caseH(j1)); fitCase(ring.querySelector(`.bqs-case[data-j="${j1}"]`)); /* 다가올 책장 글을 미리 맞춤 */ [...ring.children].forEach((c) => { c.style.transform = place(+c.dataset.j); c.inert = true; });
      const nc = ring.querySelector(`.bqs-case[data-j="${j1}"]`); stage.style.height = Math.max(stage.offsetHeight, nc.offsetHeight) + 'px';
      const r = stage.getBoundingClientRect(); stage.style.perspectiveOrigin = `50% ${clamp(innerHeight / 2 - r.top, 80, r.height - 80)}px`;
      const ms = RM() ? 0 : C.turnMs; st.busy = true; sec.classList.add('turning'); const pull = Math.min(320, st.W * 0.22);
      const done = () => { if (st.dead) return; ring.style.transition = 'none'; st.peek = 0; sec.classList.remove('peekl', 'peekr'); st.j = j1; /* sync가 새 책장 글을 맞춤 */ ring.style.transform = ringT(j1); sec.classList.remove('turning'); st.busy = false; sync(false); const t = curCase(); const top = t.getBoundingClientRect().top; if (top < 0) window.scrollBy(0, top - 60);
        say(`책장 ${B.mod(j1, N) + 1}/${N}: ${st.P.cases[B.mod(j1, N)].name}`); };
      if (!ms || !ring.animate) return done();
      const j0s = j0 + (st.peek || 0); peekOff(true); dust(d, ms); if (N > 2 && B.mod(j1, N) === (d > 0 ? 0 : N - 1)) loopFx(d);
      const a = ring.animate([{ transform: ringT(j0s) }, { transform: ringT(j0 + d * 0.5, pull), offset: 0.5 }, { transform: ringT(j1) }], { duration: ms, easing: 'cubic-bezier(.45,.05,.25,1)' }); a.onfinish = done; a.oncancel = done; }
    /* ── (shelf3) 엿보기 — 화살표에 다가가면 책장 둘레가 그쪽으로 살짝 돌아 다음 책장 모서리가 보임(누르지 않으면 제자리) */
    function peekOn(d) { if (!C.peek || RM() || st.busy || !st.P || st.P.cases.length <= 1 || st.peek === d * 0.07) return; st.peek = d * 0.07; ring.style.transition = 'transform .45s cubic-bezier(.3,.7,.3,1)'; ring.style.transform = ringT(st.j + st.peek); sec.classList.toggle('peekl', d < 0); sec.classList.toggle('peekr', d > 0); }
    function peekOff(now) { if (!st.peek) return; st.peek = 0; sec.classList.remove('peekl', 'peekr'); ring.style.transition = now ? 'none' : 'transform .35s ease'; if (!now) ring.style.transform = ringT(st.j); }
    /* 책장이 돌 때 먼지·종이 조각이 그 쪽에서 살짝 날림(0.8초 · 12개 · 움직임 줄이기면 안 함) */
    function dust(d, ms) { if (!C.turnFx || RM() || !sec.animate) return; const r = stage.getBoundingClientRect(); const x0 = d > 0 ? r.right - 30 : r.left + 30; const y0 = clamp(innerHeight / 2, r.top + 40, r.bottom - 40);
      for (let i = 0; i < 12; i++) { const e = document.createElement('i'); const paper = i % 3 === 0; e.className = 'bqs-dust' + (paper ? ' pp' : ''); e.setAttribute('aria-hidden', 'true'); Object.assign(e.style, { left: x0 + 'px', top: y0 + (Math.random() - 0.5) * 220 + 'px' }); sec.appendChild(e);
        const dx = -d * (60 + Math.random() * 160), dy = (Math.random() - 0.6) * 120, rot = (Math.random() - 0.5) * 540; e.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 0 }, { opacity: paper ? 0.95 : 0.7, offset: 0.2 }, { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg)`, opacity: 0 }], { duration: Math.min(1100, ms * 0.9 + Math.random() * 300), delay: Math.random() * 120, easing: 'cubic-bezier(.2,.6,.4,1)' }).onfinish = () => e.remove(); setTimeout(() => e.remove(), 1600); } }
    /* 끝 → 처음(또는 처음 → 끝)으로 넘어갈 때 '한 바퀴' 표시 */
    function loopFx(d) { const t = document.createElement('div'); t.className = 'bqs-lapt'; t.setAttribute('role', 'status'); t.textContent = d > 0 ? '↻ 한 바퀴 — 첫 책장으로' : '↺ 거꾸로 한 바퀴 — 마지막 책장으로'; stage.appendChild(t); setTimeout(() => t.remove(), 1700); }
    function go(i) { if (!st.P) return; const N = st.P.cases.length; st.j = B.mod(i, N); sync(true); }

    /* ── 손님 ⚙ 보기(이 기기만) */
    function viewH() { const v = view(); const sel = (k, L, d) => `<select data-v="${k}">${L.map(([a, n]) => `<option value="${a}"${String(v[k] != null ? v[k] : C0[k]) === String(a) ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
      const ck = (k, n) => `<label><input type="checkbox" data-v="${k}"${(v[k] != null ? v[k] : C0[k]) ? ' checked' : ''}> ${esc(n)}</label>`;
      return `<div class="bqs-vg"><label>책장 종류 ${sel('wood', B.CASES)}</label><label>책등 누르면 ${sel('popMode', [['spine', '책등에 바로 단추'], ['bubble', '말풍선 창']])}</label><label>담기 움직임 ${sel('cartAnim', [['rand', '매번 랜덤'], ...B.CART_ANIMS, ['off', '없음']])}</label><label>찜 움직임 ${sel('wishAnim', [['rand', '매번 랜덤'], ...B.WISH_ANIMS, ['off', '없음']])}</label>
        <label>책등 글 ${sel('orient', [['rand', '책마다 랜덤'], ['v', '세로쓰기'], ['h', '가로쓰기(눕힘)']])}</label>${ck('turn3d', '책장 3D로 돌기')}${ck('tip', '마우스 올리면 책 정보')}${ck('fontsOn', '여러 글꼴(끄면 더 가벼움)')}
        <button type="button" class="bqs-vr">가게 기본으로</button></div><p class="bqs-hint">이 기기에만 저장됩니다 · 키보드: ←→ 옆 책 · ↑↓ 위아래 선반 · Enter 담기 창 · [ ] 책장 돌리기 · + − 확대 · Ctrl+휠·두 손가락으로도 확대</p>`; }
    function setView(k, v) { VW = null; const V = { ...view() }; VW = null; if (k == null) { LS.set('view', {}); } else { V[k] = v; LS.set('view', V); } C = B.cfgOf({ ...C0, ...view() }); sec.className = `bqs room-${C.room} wood-${C.wood}`; LKC.clear(); sync(true); $('#bqsView').innerHTML = viewH(); }

    /* ── 글꼴: 그 책장에 쓰인 글자만 받아 별칭(bqf-글꼴-책장)으로 */
    function fontsFor(cEl) { if (!C.fontsOn || !cEl || !root.fetch) return; const ck = st.sort + cEl.dataset.i; const by = new Map();
      cEl.querySelectorAll('.sp:not(.ok)').forEach((b) => { const x = byId.get(b.dataset.id); if (!x) return; const f = lookOf(x).f; by.set(f, (by.get(f) || '') + x.t + (x.a || '')); });
      const jobs = [...by].map(([f, txt]) => () => { const al = `bqf-${f}-${ck}`; if (FONT_CSS.has(al)) { const s = FONT_CSS.get(al); FONT_CSS.delete(al); FONT_CSS.set(al, s); return Promise.resolve(); }
        const own = B.fontCss && B.fontCss(f, txt, al, o.fontApi || root.BQ_API); /* (shelf5) 우리 클라우드 글꼴은 CSS를 받지 않고 바로 만듦 */
        return (own ? Promise.resolve(own) : fetch(B.fontUrl(f, txt)).then((r) => (r.ok ? r.text() : ''))).then((css) => { if (!css || st.dead) return; const s = document.createElement('style'); s.dataset.bqf = al; s.textContent = css.replace(/font-family:\s*'[^']+'/g, `font-family:'${al}'`); document.head.appendChild(s); FONT_CSS.set(al, s);
          while (FONT_CSS.size > 160) { const [k0, s0] = FONT_CSS.entries().next().value; s0.remove(); FONT_CSS.delete(k0); } }).catch(() => {}); });
      let n = 0; const next = () => { if (st.dead || n >= jobs.length) return; jobs[n++]().then(next); }; const idle = root.requestIdleCallback || ((f) => setTimeout(f, 60)); idle(() => { for (let i = 0; i < 4; i++) next(); }); }
    const fontsDrop = (c) => { if (!c || !c.dataset) return; const ck = '-' + st.sort + c.dataset.i; for (const [al, s0] of [...FONT_CSS]) if (al.endsWith(ck)) { s0.remove(); FONT_CSS.delete(al); } };

    /* ── 툴팁(앞·뒤 표지 · 책 정보) */
    const byId = new Map();
    function showTip(b) { const x = byId.get(b.dataset.id); if (!x || !C.tip) return; const off = x.lp > 0 && x.p < x.lp ? Math.round((1 - x.p / x.lp) * 100) : 0;
      const so = B.saleOf(x); const bdH = (x.bd || []).filter((k) => B.BADGE[k]).slice(0, 3).map((k) => `<span class="bd bd-${k}">${B.BADGE[k]}</span>`).join('');
      tip.innerHTML = `${bdH ? `<div class="bds in">${bdH}</div>` : ''}<div class="tc">${x.im ? `<img src="${esc(x.im)}" alt="앞표지">` : '<span class="ni">앞표지<br>사진 없음</span>'}${x.bk ? `<img src="${esc(x.bk)}" alt="뒤표지">` : '<span class="ni">뒤표지<br>사진 없음</span>'}</div>
        <b>${esc(x.t)}</b><div class="tm">${esc([B.auName(x.a), x.pb].filter(Boolean).join(' · '))}</div><div class="tp">${x.g ? `<span class="g g-${esc(x.g)}">${esc(x.g)}</span> ` : ''}${so && so.from === 'p0' ? `<s class="was">${won(so.was)}</s> ` : ''}<b>${won(x.p)}</b>${so && so.from === 'p0' ? ` <small class="off sale">할인 ${so.pct}%</small>` : off ? ` <small class="off">${off}%↓</small>` : ''}${x.lp ? ` <small class="lp">정가 ${won(x.lp)}</small>` : ''}</div>
        <div class="tm">${esc([x.c, x.at ? x.at.slice(5).replace('-', '/') + ' 들어옴' : '', x.pg ? x.pg + '쪽' : ''].filter(Boolean).join(' · '))}${x.st === 'o' ? ' · <b>주문 중</b>' : ''}${isWish(x.id) ? ' · ♥ 찜함' : ''}</div><small class="tk">눌러서 담기·찜</small>`;
      tip.hidden = false; const r = b.getBoundingClientRect(); const tw = tip.offsetWidth, th = tip.offsetHeight; let L = r.right + 12; if (L + tw > innerWidth - 8) L = r.left - tw - 12; if (L < 8) L = clamp(r.left + r.width / 2 - tw / 2, 8, innerWidth - tw - 8);
      let T = clamp(r.top + r.height / 2 - th / 2, 8, innerHeight - th - 8); tip.style.left = L + 'px'; tip.style.top = T + 'px'; }
    const hideTip = () => { clearTimeout(st.tipT); tip.hidden = true; };
    on(ring, 'pointerover', (e) => { if (e.pointerType !== 'mouse') return; const b = e.target.closest('.sp'); if (!b || !pop.hidden) return; clearTimeout(st.tipT); st.tipT = setTimeout(() => showTip(b), C.tipMs); });
    on(ring, 'pointerout', (e) => { const b = e.target.closest('.sp'); if (b && !b.contains(e.relatedTarget)) hideTip(); });

    /* ── 책등 누름 → 그 자리에 담기·찜 */
    let popFor = null;
    /* 책등을 누르면(정범님 11/11): 기본은 그 책등 표면에 바로 단추 셋 — 누른 높이에 🛒이 오게(커서를 거의 안 움직이고 담기·찜) · 설정 popMode=bubble이면 옛 말풍선 */
    function openPop(b, y) { hideTip(); closePop(); const x = byId.get(b.dataset.id); if (!x) return; popFor = b; b.classList.add('out'); const inC = o.cart && o.cart.has && o.cart.has(x.id); const w = isWish(x.id); const sp = C.popMode !== 'bubble';
      const lb = (i, t) => (sp ? `<i aria-hidden="true">${i}</i><small>${t}</small>` : `${i} ${t}`);
      const cartB = x.st === 'o' ? `<button type="button" disabled aria-label="다른 분이 주문함">${lb('⏳', '주문 중')}</button>` : !(o.shop && o.shop.open) ? `<button type="button" disabled title="문을 연 뒤 주문" aria-label="문을 연 뒤 담기">${lb('🛒', '문 연 뒤')}</button>` : inC ? `<a class="pb" href="#/cart" aria-label="장바구니에 담겨 있음 — 보러 가기">${lb('✓', '담김')}</a>` : `<button type="button" class="pc" data-a="cart" aria-label="장바구니에 담기">${lb('🛒', sp ? '담기' : '장바구니')}</button>`;
      const wishB = `<button type="button" class="pw${w ? ' on' : ''}" data-a="wish" aria-pressed="${w}" aria-label="${w ? '찜 빼기' : '찜하기'}">${lb(w ? '♥' : '♡', w ? '찜함' : '찜')}</button>`; const openB = `<button type="button" data-a="open" aria-label="자세히 보기">${lb('ⓘ', '자세히')}</button>`;
      const so = B.saleOf(x); const prH = `${so && so.from === 'p0' ? `<s>${won(so.was)}</s> ` : ''}${won(x.p)}${so && so.from === 'p0' ? ` <em>−${so.pct}%</em>` : ''}`;
      pop.className = 'bqs-pop' + (sp ? ' onsp' : ''); pop.removeAttribute('style');
      pop.innerHTML = sp ? `<div class="pcap"><b>${esc(x.t)}</b><small>${esc(x.a || '')}${x.a ? ' · ' : ''}${prH}</small><button type="button" class="px" data-a="x" aria-label="닫기">✕</button></div><div class="pa">${cartB}${wishB}${openB}</div>`
        : `<div class="pt"><b>${esc(x.t)}</b><small>${esc(x.a || '')} · ${prH}</small></div><div class="pa">${cartB}${wishB}${openB}</div><button type="button" class="px" data-a="x" aria-label="닫기">✕</button>`;
      if (sp) { pop.style.setProperty('--c', b.style.getPropertyValue('--c')); pop.style.setProperty('--k', b.style.getPropertyValue('--k')); pop.style.setProperty('--g', b.style.getPropertyValue('--g')); }
      pop.setAttribute('aria-label', x.t + ' — 담기·찜'); pop.hidden = false; st.popY = y; st.popAt = Date.now(); posPop(); const f = pop.querySelector('.pa button:not([disabled]),.pa a'); if (f) f.focus({ preventScroll: true }); }
    function posPop() { if (!popFor || pop.hidden) return; const sk = popFor.querySelector('.sk') || popFor; const r = sk.getBoundingClientRect(); const pw = pop.offsetWidth, ph = pop.offsetHeight;
      if (pop.classList.contains('onsp')) { /* (shelf3) 정범님: 단추는 책등 표면 안 — 너비 = 책등 너비 · 좁으면 작은 아이콘만 세로로 · 누른 높이에 🛒(표면 안에서) */
        const w = Math.max(16, r.width); const n = pop.querySelectorAll('.pa > *').length || 3; const g = clamp(w * 0.08, 2, 5); const bh = clamp(Math.min(w * 1.15, 52, (r.height - g * (n + 1)) / n), 14, 52);
        pop.style.width = w + 'px'; pop.style.setProperty('--bh2', bh + 'px'); pop.style.setProperty('--gap', g + 'px'); pop.style.setProperty('--ic', clamp(Math.min(w * 0.56, bh * 0.5), 9, 19) + 'px'); pop.classList.toggle('slim', w < 46 || bh < 34);
        const ph2 = pop.offsetHeight; const pa = pop.querySelector('.pa'); const b0 = pa.firstElementChild; const off = b0 ? b0.offsetTop + b0.offsetHeight / 2 : ph2 / 2; const y = st.popY != null ? st.popY : r.top + r.height / 2;
        let T = ph2 <= r.height ? clamp(y - off, r.top, r.bottom - ph2) : r.top + (r.height - ph2) / 2; T = clamp(T, 4, innerHeight - ph2 - 4); const L = r.left;
        pop.style.left = L + 'px'; pop.style.top = T + 'px'; const cap = pop.querySelector('.pcap'); if (cap) { const cw = cap.offsetWidth; const cl = clamp(L + w / 2 - cw / 2, 8, innerWidth - cw - 8); cap.style.left = (cl - L) + 'px'; const up = r.top - cap.offsetHeight - 8 >= 4; cap.classList.toggle('below', !up); cap.style.setProperty('--cy', (up ? r.top - T : r.bottom - T) + 'px'); } return; }
      let L = clamp(r.left + r.width / 2 - pw / 2, 8, innerWidth - pw - 8); let T = r.top - ph - 10; if (T < 8) T = Math.min(innerHeight - ph - 8, r.bottom + 10);
      pop.style.left = L + 'px'; pop.style.top = T + 'px'; pop.style.setProperty('--ax', clamp(r.left + r.width / 2 - L, 14, pw - 14) + 'px'); pop.classList.toggle('below', T > r.top); }
    function closePop(back) { if (pop.hidden) return; pop.hidden = true; const b = popFor; popFor = null; if (b) { b.classList.remove('out'); if (back) b.focus({ preventScroll: true }); } }
    on(ring, 'click', (e) => { const b = e.target.closest('.sp'); if (!b || st.busy) return; e.preventDefault(); if (st.lpDone) { st.lpDone = false; return; } if (st.mob) return openSheet(b); if (popFor === b) return closePop(true); setFocus(b); openPop(b, e.detail ? e.clientY : null); });
    /* ── (shelf4) 휴대폰 아래 시트 — 쿠팡·아마존 앱의 '아래에서 올라오는 상품 시트'처럼: 표지·값·상태 + 큰 단추(담기·찜·자세히 · 48px) · 배경 누름·✕·아래로 쓸어 닫기 */
    const sheet = $('.bqs-sheet'); let shFor = null;
    function openSheet(b) { const x = byId.get(b.dataset.id); if (!x) return; shFor = b; const inC = o.cart && o.cart.has && o.cart.has(x.id); const w = isWish(x.id); const so = B.saleOf(x);
      const cartB = x.st === 'o' ? '<button type="button" class="sb-c" disabled>⏳ 다른 분이 주문 중</button>' : !(o.shop && o.shop.open) ? '<button type="button" class="sb-c" disabled>🛒 문을 연 뒤 담기</button>' : inC ? '<a class="sb-c in" href="#/cart">🛒 담겨 있음 · 장바구니 보기</a>' : '<button type="button" class="sb-c" data-a="cart">🛒 장바구니에 담기</button>';
      sheet.querySelector('.sh-in').innerHTML = `<div class="sh-top">${x.im ? `<img src="${esc(x.im)}" alt="" class="sh-im">` : ''}<div class="sh-tx"><b>${esc(x.t)}</b><small>${esc(B.auName(x.a))}${x.pb ? ' · ' + esc(x.pb) : ''}</small><div class="sh-pr">${so && so.from === 'p0' ? `<s>${won(so.was)}</s> ` : ''}<strong>${won(x.p)}</strong>${so && so.from === 'p0' ? ` <em>−${so.pct}%</em>` : ''}${x.lp > x.p ? ` <span class="sh-lp">정가 ${won(x.lp)}</span>` : ''}</div>${x.g ? `<div class="sh-g">상태 <span class="g g-${esc(x.g)}">${esc(x.g)}</span></div>` : ''}</div><button type="button" class="sh-x" data-a="x" aria-label="닫기">✕</button></div>
        <div class="sh-act">${cartB}<button type="button" class="sb-w${w ? ' on' : ''}" data-a="wish" aria-pressed="${w}">${w ? '♥ 찜함' : '♡ 찜'}</button><button type="button" class="sb-o" data-a="open">자세히</button></div>`;
      sheet.hidden = false; sheet.querySelector('.sh-p').style.transform = ''; requestAnimationFrame(() => sheet.classList.add('on')); const f = sheet.querySelector('[data-a="cart"],.sb-w'); if (f) f.focus({ preventScroll: true }); }
    function closeSheet() { if (sheet.hidden) return; sheet.classList.remove('on'); const b = shFor; shFor = null; setTimeout(() => { if (!sheet.classList.contains('on')) sheet.hidden = true; }, RM() ? 0 : 200); if (b && b.isConnected) b.focus({ preventScroll: true }); }
    on(sheet, 'click', (e) => { const a = e.target.closest('[data-a]'); if (!a) return; const b = shFor; const x = b && byId.get(b.dataset.id); const k = a.dataset.a; if (k === 'x') return closeSheet(); if (!x) return;
      if (k === 'open') { closeSheet(); return o.open && o.open(x.id); }
      if (k === 'cart') { const why = o.cart.add(x); if (why) { o.toast && o.toast(why); return; } closeSheet(); badge(); say(x.t + ' — 장바구니에 담았습니다'); o.toast && o.toast('🛒 장바구니에 담았습니다'); }
      if (k === 'wish') { wishOf(b, x); openSheet(b); } });
    { let y0 = null, dy = 0; const P0 = sheet.querySelector('.sh-p');
      on(P0, 'touchstart', (e) => { y0 = e.touches[0].clientY; dy = 0; P0.style.transition = 'none'; }, { passive: true });
      on(P0, 'touchmove', (e) => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); P0.style.transform = `translateY(${dy}px)`; }, { passive: true });
      on(P0, 'touchend', () => { P0.style.transition = ''; if (dy > 80) closeSheet(); else P0.style.transform = ''; y0 = null; }); }
    function wishOf(b, x) { const r = B.wishToggle((o.wish && o.wish.get()) || [], x); o.wish.set(r.wish); b.classList.toggle('wished', r.on); badge(); if (r.on) wishFx(b); o.toast && o.toast(r.on ? '♥ 찜 목록에 넣었습니다' : '찜을 뺐습니다'); return r.on; }
    /* 길게 누르면(0.5초) 바로 찜 — 당근·인스타그램처럼 길게 눌러 빠른 동작 · 손가락이 움직이면(쓸기) 안 함 */
    { let lp = null; on(ring, 'pointerdown', (e) => { if (e.pointerType !== 'touch') return; const b = e.target.closest('.sp'); if (!b) return; const x0 = e.clientX, y0 = e.clientY; clearTimeout(lp && lp.t);
        lp = { x0, y0, t: setTimeout(() => { const x = byId.get(b.dataset.id); if (!x) return; st.lpDone = true; wishOf(b, x); try { navigator.vibrate && navigator.vibrate(15); } catch (er) {} }, 500) }; });
      const lpOff = () => { if (lp) clearTimeout(lp.t); lp = null; }; on(ring, 'pointermove', (e) => { if (lp && Math.hypot(e.clientX - lp.x0, e.clientY - lp.y0) > 10) lpOff(); }); on(ring, 'pointerup', lpOff); on(ring, 'pointercancel', lpOff); on(ring, 'contextmenu', (e) => { if (e.target.closest('.sp') && st.mob) e.preventDefault(); }); }
    on($('.bqs-chips'), 'click', (e) => { const b = e.target.closest('[data-ci]'); if (b) { go(+b.dataset.ci); window.scrollTo({ top: Math.max(0, stage.getBoundingClientRect().top + scrollY - 120) }); } });
    on($('.bqs-msort'), 'change', (e) => { const s0 = $('.bqs-sort'); s0.value = e.target.value; s0.dispatchEvent(new Event('change')); });
    on($('.mb-v'), 'click', (e) => { st.cov = !st.cov; LS.set('cov', st.cov); e.currentTarget.setAttribute('aria-pressed', String(st.cov)); sync(true); });
    on(pop, 'click', (e) => { const a = e.target.closest('[data-a]'); if (!a) return; if (e.detail > 1) return; /* 책등을 두 번 누른 둘째 누름이 담기로 새지 않게 */ const b = popFor; const x = b && byId.get(b.dataset.id); const k = a.dataset.a;
      if (k === 'x') return closePop(true); if (!x) return; if (k === 'open') { closePop(); return o.open && o.open(x.id); }
      if (k === 'cart') { const why = o.cart.add(x); if (why) { o.toast && o.toast(why); return; } closePop(); flyCart(b, x); say(x.t + ' — 장바구니에 담았습니다'); }
      if (k === 'wish') { const r = B.wishToggle((o.wish && o.wish.get()) || [], x); o.wish.set(r.wish); b.classList.toggle('wished', r.on); b.setAttribute('aria-label', b.getAttribute('aria-label').replace(/ · 찜함$/, '') + (r.on ? ' · 찜함' : '')); closePop(true); badge(); if (r.on) wishFx(b); o.toast && o.toast(r.on ? '♥ 찜 목록에 넣었습니다' : '찜을 뺐습니다'); } });
    on(document, 'keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
    on(document, 'pointerdown', (e) => { if (!pop.hidden && !pop.contains(e.target) && !(popFor && popFor.contains(e.target))) closePop(); }, true);

    /* ── 장바구니 움직임 5가지(설정: 랜덤·하나 고정·없음) */
    const pick = (mode, L) => (mode === 'rand' ? L[Math.floor(Math.random() * L.length)][0] : mode);
    function ghost(b, x, cover) { const r = (b.querySelector('.sk') || b).getBoundingClientRect(); const g = document.createElement('div'); g.className = 'bqs-fly' + (cover ? ' cv' : ''); g.setAttribute('aria-hidden', 'true');
      if (cover) { g.innerHTML = x.im ? `<img src="${esc(x.im)}" alt="">` : `<span>${esc(x.t)}</span>`; g.style.setProperty('--c', b.style.getPropertyValue('--c')); g.style.setProperty('--k', b.style.getPropertyValue('--k')); }
      else { const sk = b.querySelector('.sk').cloneNode(true); g.appendChild(sk); g.dataset.d = b.dataset.d; g.dataset.o = b.dataset.o; g.style.cssText = b.style.cssText; g.style.fontFamily = b.style.fontFamily; if (b.classList.contains('img')) g.classList.add('img'); }
      Object.assign(g.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); sec.appendChild(g); return { g, r }; }
    function flyCart(b, x) { badge(); const cart = (st.mob && $('.mb-c')) || $('.bqs-cart'); /* (shelf5) 휴대폰은 둥근 카트가 숨어 있어 아래 줄 🛒로 날아감(전엔 화면 왼쪽 위 0,0으로) */ const m = pick(C.cartAnim, B.CART_ANIMS); if (m === 'off' || RM() || !b.animate) return bump(cart);
      const { g, r } = ghost(b, x, m === 'cover'); const t = cart.getBoundingClientRect(); const dx = t.left + t.width / 2 - (r.left + r.width / 2), dy = t.top + t.height / 2 - (r.top + r.height / 2); let K, ms = 950;
      if (m === 'pull') K = [{ transform: 'translate(0,0)' }, { transform: 'translate(0,-34px) rotate(-4deg)', offset: 0.22 }, { transform: 'translate(0,-34px) rotate(-4deg) scale(1.05)', offset: 0.32 }, { transform: `translate(${dx}px,${dy}px) rotate(14deg) scale(.18)`, opacity: 0.7 }];
      else if (m === 'arc') { K = []; const h = Math.min(260, Math.abs(dy) + 160); for (let i = 0; i <= 14; i++) { const t2 = i / 14; const X = dx * t2, Y = dy * t2 - 4 * h * t2 * (1 - t2); K.push({ transform: `translate(${X}px,${Y}px) rotate(${t2 * 540}deg) scale(${1 - t2 * 0.8})` }); } ms = 1050; }
      else if (m === 'cover') { const cw = Math.max(r.width, r.height * 0.68); K = [{ transform: 'translate(0,0) rotateY(80deg)', width: r.width + 'px' }, { transform: `translate(${-cw / 2 + r.width / 2}px,-20px) rotateY(0deg)`, width: cw + 'px', offset: 0.35 }, { transform: `translate(${dx - cw / 2}px,${dy}px) scale(.16)`, width: cw + 'px', opacity: 0.6 }]; ms = 1150; }
      else if (m === 'tumble') { K = []; for (let i = 0; i <= 12; i++) { const t2 = i / 12; const e2 = t2 < 0.85 ? t2 / 0.85 : 1; const bo = t2 > 0.85 ? Math.sin((t2 - 0.85) / 0.15 * Math.PI) * -18 : 0; K.push({ transform: `translate(${dx * e2}px,${dy * e2 + bo}px) rotate(${t2 * 720}deg) scale(${1 - e2 * 0.78})` }); } ms = 1100; }
      else { const up = -(r.top + r.height + 40); K = [{ transform: 'translate(0,0)' }, { transform: `translate(0,${up}px)`, offset: 0.4, easing: 'ease-in' }, { transform: `translate(${dx}px,${dy - innerHeight * 0.6}px) scale(.35)`, offset: 0.55, opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.3)`, offset: 0.85, easing: 'cubic-bezier(.3,1.6,.6,1)' }, { transform: `translate(${dx}px,${dy}px) scale(.12)`, opacity: 0.4 }]; ms = 1250; }
      const a = g.animate(K, { duration: ms, easing: m === 'drop' ? 'linear' : 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }); a.onfinish = () => { g.remove(); bump(cart); }; setTimeout(() => g.remove(), ms + 400); }
    const bump = (cart) => { badge(); if (cart.animate && !RM()) cart.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3) rotate(-8deg)' }, { transform: 'scale(.95) rotate(4deg)' }, { transform: 'scale(1)' }], { duration: 480, easing: 'ease-out' }); };
    /* ── 찜 움직임 5가지(위트) */
    function wishFx(b) { const m = pick(C.wishAnim, B.WISH_ANIMS); if (m === 'off' || RM() || !b.animate) return; const sk = b.querySelector('.sk'); const r = b.getBoundingClientRect(); const fx = (cls, html, css) => { const d = document.createElement('div'); d.className = 'bqs-fx ' + cls; d.innerHTML = html; d.setAttribute('aria-hidden', 'true'); Object.assign(d.style, { left: r.left + r.width / 2 + 'px', top: r.top + 'px' }, css || {}); sec.appendChild(d); return d; };
      if (m === 'heart') { for (let i = 0; i < 7; i++) { const d = fx('ht', ['❤', '💗', '💕'][i % 3], { top: r.top + r.height * 0.4 + 'px' }); const dx = (Math.random() - 0.5) * 90; d.animate([{ transform: 'translate(-50%,0) scale(.4)', opacity: 0 }, { transform: `translate(calc(-50% + ${dx * 0.4}px),-30px) scale(1.1)`, opacity: 1, offset: 0.3 }, { transform: `translate(calc(-50% + ${dx}px),-${90 + Math.random() * 60}px) scale(.8)`, opacity: 0 }], { duration: 900 + i * 90, delay: i * 70, easing: 'ease-out' }).onfinish = () => d.remove(); }
        sk.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08,1.03)' }, { transform: 'scale(1)' }], { duration: 360 }); }
      else if (m === 'blush') { const d = document.createElement('i'); d.className = 'bl'; sk.appendChild(d); d.animate([{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 1500 }).onfinish = () => d.remove(); sk.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(0)' }], { duration: 1100, easing: 'ease-in-out' }); const h2 = fx('ht', '♡'); h2.animate([{ transform: 'translate(-50%,0)', opacity: 0 }, { transform: 'translate(-50%,-26px)', opacity: 1 }, { transform: 'translate(-50%,-40px)', opacity: 0 }], { duration: 1200 }).onfinish = () => h2.remove(); }
      else if (m === 'bookmark') { const d = document.createElement('i'); d.className = 'bm'; b.appendChild(d); d.animate([{ transform: 'translate(-50%,-160%)', opacity: 0 }, { transform: 'translate(-50%,10%)', opacity: 1, offset: 0.6, easing: 'cubic-bezier(.3,1.7,.6,1)' }, { transform: 'translate(-50%,0)' }], { duration: 800 }).onfinish = () => setTimeout(() => d.remove(), 900); }
      else if (m === 'jump') { sk.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-22%) scaleY(1.04)', offset: 0.25 }, { transform: 'translateY(0) scaleY(.94)', offset: 0.45 }, { transform: 'translateY(-11%)', offset: 0.65 }, { transform: 'translateY(0)' }], { duration: 900, easing: 'ease-out' }); for (let i = 0; i < 4; i++) { const d = fx('ht', '✨', { top: r.top + Math.random() * r.height * 0.6 + 'px', left: r.left + (Math.random() < 0.5 ? -8 : r.width + 8) + 'px' }); d.animate([{ opacity: 0, transform: 'translate(-50%,0) scale(.3)' }, { opacity: 1, transform: 'translate(-50%,-8px) scale(1)' }, { opacity: 0, transform: 'translate(-50%,-16px) scale(.6)' }], { duration: 800, delay: 150 + i * 120 }).onfinish = () => d.remove(); } }
      else { const e2 = document.createElement('i'); e2.className = 'ey'; e2.textContent = '😉'; sk.appendChild(e2); const d = fx('say', '데려가 주세요!', { top: r.top - 6 + 'px' }); const k2 = [{ opacity: 0, transform: 'translate(-50%,-90%) scale(.6)' }, { opacity: 1, transform: 'translate(-50%,-110%) scale(1)', offset: 0.15 }, { opacity: 1, transform: 'translate(-50%,-110%) scale(1)', offset: 0.8 }, { opacity: 0, transform: 'translate(-50%,-120%) scale(.9)' }];
        d.animate(k2, { duration: 1700 }).onfinish = () => d.remove(); e2.animate([{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 1700 }).onfinish = () => e2.remove(); } }

    /* ── 키보드(한 책장 안에서 하나만 Tab 자리 — 로빙 tabindex) */
    const spines = () => { const c = curCase(); return c ? [...c.querySelectorAll('.sp')] : []; };
    function setFocus(b, move) { spines().forEach((s) => (s.tabIndex = -1)); if (!b) return; b.tabIndex = 0; st.focusId = b.dataset.id; if (move) { b.focus({ preventScroll: true }); const r = b.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight - 20) b.scrollIntoView({ block: 'center', behavior: RM() ? 'auto' : 'smooth' }); } }
    function roving() { const L = spines(); if (!L.length) return; const b = (st.focusId && L.find((s) => s.dataset.id === st.focusId)) || L[0]; setFocus(b); }
    function vert(b, d) { const L = spines(); const r = b.getBoundingClientRect(); const cx = r.left + r.width / 2; const rh = C.rowH * st.z; let best = null, bd = 1e9;
      for (const s of L) { const q = s.getBoundingClientRect(); const dy = (q.top - r.top) * d; if (dy < rh * 0.5 || dy > rh * 1.6) continue; const dd = Math.abs(q.left + q.width / 2 - cx); if (dd < bd) { bd = dd; best = s; } }
      if (!best) { for (const s of L) { const q = s.getBoundingClientRect(); const dy = (q.top - r.top) * d; if (dy < rh * 0.5) continue; const dd = dy * 10 + Math.abs(q.left + q.width / 2 - cx); if (dd < bd) { bd = dd; best = s; } } } return best; }
    on(ring, 'keydown', (e) => { const b = e.target.closest('.sp'); if (!b) return; const L = spines(); const i = L.indexOf(b); let n = null;
      if (e.key === 'ArrowRight') n = L[i + 1]; else if (e.key === 'ArrowLeft') n = L[i - 1]; else if (e.key === 'ArrowDown') n = vert(b, 1); else if (e.key === 'ArrowUp') n = vert(b, -1); else if (e.key === 'Home') n = L[0]; else if (e.key === 'End') n = L[L.length - 1]; else return;
      e.preventDefault(); if (n) setFocus(n, true); });
    on(document, 'keydown', (e) => { if (st.dead) return; const tg = e.target; if (tg && /INPUT|SELECT|TEXTAREA/.test(tg.tagName)) return;
      if (e.key === 'Escape') { if (!pop.hidden) { closePop(true); e.preventDefault(); } hideTip(); return; }
      if (!sec.contains(tg) && tg !== document.body) return; if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === ']') { turn(1); e.preventDefault(); } else if (e.key === '[') { turn(-1); e.preventDefault(); } else if (e.key === '+' || e.key === '=') { setZ(st.z + 0.1); e.preventDefault(); } else if (e.key === '-') { setZ(st.z - 0.1); e.preventDefault(); } });
    /* ── 확대: 단추 · Ctrl+휠(노트북 두 손가락 오므리기도 같음) · 터치 두 손가락 */
    on($('.bqs-zoom'), 'click', (e) => { const b = e.target.closest('[data-z]'); if (!b) return; const z = b.dataset.z; setZ(z === '+' ? st.z + 0.15 : z === '-' ? st.z - 0.15 : 1); });
    let wz = 0; on(stage, 'wheel', (e) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); wz += -e.deltaY * 0.0022; if (!st._wr) st._wr = requestAnimationFrame(() => { st._wr = 0; const a = document.elementFromPoint(e.clientX, e.clientY); setZ(st.z * (1 + wz), a && a.closest && a.closest('.sp')); wz = 0; }); }, { passive: false });
    const P2 = new Map(); let pin = null, sw = null;
    on(stage, 'pointerdown', (e) => { if (e.pointerType !== 'touch') return; if (st.mob && e.target.closest('.mstrip')) { sw = null; return; } P2.set(e.pointerId, [e.clientX, e.clientY]); if (P2.size === 2) { const [a, b] = [...P2.values()]; pin = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: st.z }; sw = null; } else sw = { x: e.clientX, y: e.clientY, t: Date.now() }; });
    on(stage, 'pointermove', (e) => { if (!P2.has(e.pointerId)) return; P2.set(e.pointerId, [e.clientX, e.clientY]); if (pin && P2.size === 2) { const [a, b] = [...P2.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (!st._pr) st._pr = requestAnimationFrame(() => { st._pr = 0; setZ(pin.z * d / pin.d); }); } });
    const pUp = (e) => { if (!P2.has(e.pointerId)) return; P2.delete(e.pointerId); if (P2.size < 2) pin = null; if (sw && e.type === 'pointerup') { const dx = e.clientX - sw.x, dy = e.clientY - sw.y; if (Math.abs(dx) > 70 && Math.abs(dy) < 40 && Date.now() - sw.t < 600) turn(dx < 0 ? 1 : -1); } sw = null; };
    on(stage, 'pointerup', pUp); on(stage, 'pointercancel', pUp);
    /* ── 좌우 화살표 — 커서가 가까이 가면 살아남 */
    const AL = $('.bqs-arrow.l'), AR = $('.bqs-arrow.r'); on(AL, 'click', () => turn(-1)); on(AR, 'click', () => turn(1)); on($('.bqs-pv'), 'click', () => turn(-1)); on($('.bqs-nx'), 'click', () => turn(1));
    on(window, 'pointermove', (e) => { if (e.pointerType !== 'mouse' || AL.hidden) return; for (const A of [AL, AR]) { const r = A.getBoundingClientRect(); const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)); const k = clamp(1 - d / 300, 0, 1); A.style.setProperty('--near', k.toFixed(3)); A.classList.toggle('hot', d < 90); } const hot = AR.classList.contains('hot') ? 1 : AL.classList.contains('hot') ? -1 : 0; if (hot) peekOn(hot); else peekOff(); }, { passive: true });
    on(AL, 'focus', () => peekOn(-1)); on(AR, 'focus', () => peekOn(1)); on(AL, 'blur', () => peekOff()); on(AR, 'blur', () => peekOff());
    /* ── 정렬 · 보기 · 크기 바뀜 */
    on($('.bqs-sort'), 'change', (e) => { st.sort = e.target.value; if (C.remember) LS.set('sort', st.sort); st.P = B.plan(st.items, C, st.sort); st.focusId = null; st.j = (MEM[st.sort] && MEM[st.sort].j) || 0; sync(true); say(`${e.target.selectedOptions[0].textContent}으로 · 책장 ${st.P.cases.length}개`); });
    const gear = $('.bqs-gear'); if (gear) on(gear, 'click', () => { const v = $('#bqsView'); v.hidden = !v.hidden; gear.setAttribute('aria-expanded', String(!v.hidden)); if (!v.hidden) v.innerHTML = viewH(); });
    on($('#bqsView'), 'change', (e) => { const t = e.target.closest('[data-v]'); if (t) setView(t.dataset.v, t.type === 'checkbox' ? t.checked : t.value); });
    on($('#bqsView'), 'click', (e) => { if (e.target.closest('.bqs-vr')) setView(null); });
    let rw = 0; const relayout = () => { if (!st.P || st.dead) return; if (MOB() !== st.mob) { st.mob = MOB(); return sync(true); } const c = curCase(); if (st.mob) return fitH(); const k = B.bays(innerW(), C, st.z); const kNow = c ? +(c.querySelector('.bqs-bays') || { style: {} }).style.getPropertyValue('--k') : 0; if (c && kNow === k && Math.abs(stage.clientWidth - st.W) < 2) return fitH(); sync(true); };
    const RO = root.ResizeObserver ? new ResizeObserver(() => { cancelAnimationFrame(rw); rw = requestAnimationFrame(() => { if (!st.busy) relayout(); fitH(); }); }) : null; if (RO) RO.observe(stage);
    on(window, 'scroll', () => { if (!pop.hidden) posPop(); if (!tip.hidden) hideTip(); }, { passive: true });
    const centerSpine = () => { const r = stage.getBoundingClientRect(); const e = document.elementFromPoint(clamp(innerWidth / 2, 0, innerWidth - 1), clamp(innerHeight / 2, Math.max(0, r.top), Math.min(innerHeight - 1, r.bottom))); return e && e.closest ? e.closest('.sp') : null; };
    /* 책등 그림이 오면 그 그림 비율로 두께를 맞춤(진짜 책 두께) · 안 열리면 디자인 책등으로 */
    on(ring, 'load', (e) => { const im = e.target; if (!im.classList || !im.classList.contains('si') || !im.naturalHeight) return; const b = im.closest('.sp'); const w = clamp(Math.round((C.rowH * 0.86 * (+b.style.getPropertyValue('--bh') || 92) / 100) * im.naturalWidth / im.naturalHeight), 10, 90); b.style.setProperty('--bw', w); b.classList.add('ok'); }, true);
    on(ring, 'error', (e) => { const im = e.target; if (im.classList && im.classList.contains('si')) { const b = im.closest('.sp'); im.remove(); if (b) { b.classList.remove('img'); fitSpines([b]); } } }, true);

    /* ── 자료 받기 → 그리기 */
    const T0 = performance.now(); badge(); const lt = $('.bqs-load span'), lb = $('.bqs-lbar i');
    /* (shelf4) 첫 묶음이 오면 바로 첫 책장(early) → 다 오면 같은 자리(같은 이름 책장)를 지키며 다시 짬 */
    const early = (items) => { if (st.dead || st.P || !items || !items.length) return; st.part = true; show(items); };
    const full = (items) => { if (st.dead) return; if (!st.P || !st.part) return show(items); st.part = false; const nm = st.P.cases[B.mod(st.j, st.P.cases.length)].name; st.items = items || []; byId.clear(); st.items.forEach((x) => byId.set(x.id, x)); LKC.clear();
      $('.bqs-n').textContent = st.items.length.toLocaleString('ko-KR') + '권'; st.P = B.plan(st.items, C, st.sort); const k = st.P.cases.findIndex((c) => c.name === nm); st.j = k >= 0 ? k : B.mod(st.j, st.P.cases.length); const l = $('.bqs-load2'); if (l) l.remove(); sync(true); };
    Promise.resolve(o.load ? o.load((n, of) => { if (st.dead) return; const t = `책을 꽂는 중… ${n.toLocaleString('ko-KR')}${of ? ' / ' + of.toLocaleString('ko-KR') : ''}권`; if (lt.isConnected) { lt.textContent = t; if (of) lb.style.width = Math.round(n / of * 100) + '%'; } else { const l2 = $('.bqs-load2'); if (l2) l2.textContent = t; } }, early) : [])
      .then(full)
      .catch((e) => { if (st.dead) return; if (st.P) { const l2 = $('.bqs-load2'); if (l2) l2.textContent = '⚠ 나머지 책을 못 받음 — 새로 고침하면 다시'; return; } const l = $('.bqs-load'); if (l) l.innerHTML = `<div class="err"><b>⚠ ${esc(e.message || e)}</b> <button type="button" class="btn ghost bqs-again">다시 해 보기</button></div>`; const a = $('.bqs-again'); if (a) a.onclick = () => { api.destroy(); mount(el, o); }; });
    function show(items) { if (st.dead) return; sec.dataset.tData = Math.round(performance.now() - T0); st.items = items || []; byId.clear(); st.items.forEach((x) => byId.set(x.id, x)); const ld = $('.bqs-load'); if (ld) ld.remove(); $('.bqs-n').textContent = st.items.length.toLocaleString('ko-KR') + '권';
        if (st.part) $('.bqs-h').insertAdjacentHTML('afterend', '<small class="bqs-load2" role="status">나머지 책을 받는 중…</small>');
        if (!st.items.length) { ring.innerHTML = '<div class="bqs-empty">아직 꽂을 책이 없습니다</div>'; stage.style.height = 'auto'; return; }
        st.P = B.plan(st.items, C, st.sort); const N = st.P.cases.length; const p0 = o.start || {}; const pos = LS.get('pos', null);
        st.j = p0.i != null ? B.mod(+p0.i || 0, N) : MEM[st.sort] ? B.mod(MEM[st.sort].j, N) : pos && pos.s === st.sort ? B.mod(pos.i, N) : 0; sec.dataset.tPlan = Math.round(performance.now() - T0); sync(true); sec.dataset.firstMs = Math.round(performance.now() - T0); sec.dataset.firstAt = Math.round(performance.now()); o.ready && o.ready(api); }
    const api = { get state() { return { sort: st.sort, i: st.P ? B.mod(st.j, st.P.cases.length) : 0, N: st.P ? st.P.cases.length : 0, z: st.z, n: st.items.length }; }, turn, go, zoom: setZ, badge, refit: () => { const c = curCase(); if (c) delete c.dataset.fz; fitCase(c); }, lookOf: (id) => { const x = byId.get(id); return x ? lookOf(x) : null; }, get colorState() { return { ok: CC.ok, fail: CC.fail, okN: CC.okN, got: CC.got.size, q: CC.q.length }; },
      destroy() { st.dead = true; try { document.body.classList.remove('shelf-mob'); } catch (e) {} cancelAnimationFrame(rw); offs.forEach((f) => f()); if (RO) RO.disconnect(); closePop(); hideTip(); el.querySelectorAll('.bqs-fly,.bqs-fx,.bqs-dust').forEach((x) => x.remove()); } };
    return api; }
  root.BQShelf = { mount, VER: B.VER };
})(typeof self !== 'undefined' ? self : this);

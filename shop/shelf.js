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
    const C0 = B.cfgOf(o.cfg); const view = () => (C0.viewerCfg ? LS.get('view', {}) : {});
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
      <nav class="bqs-nav" aria-label="책장 넘기기" hidden><button type="button" class="bqs-pv"></button><div class="bqs-here"><b></b><small></small><div class="bqs-dots" aria-hidden="true"></div></div><button type="button" class="bqs-nx"></button></nav>
      <div class="bqs-stage"><div class="bqs-ring"></div><div class="bqs-load" role="status"><div class="bqs-lbar"><i></i></div><span>책을 꽂는 중…</span></div></div>
      <button type="button" class="bqs-arrow l" aria-label="이전 책장" hidden><span>‹</span></button><button type="button" class="bqs-arrow r" aria-label="다음 책장" hidden><span>›</span></button>
      <div class="bqs-tip" role="tooltip" hidden></div><div class="bqs-pop" role="dialog" aria-modal="false" hidden></div>
      <a class="bqs-cart" href="#/cart" aria-label="장바구니"><span class="bqs-cart-i" aria-hidden="true">🛒</span><b class="bqs-cn">0</b></a>
      <div class="bqs-sr" aria-live="polite"></div></section>`;
    const $ = (s) => el.querySelector(s); const sec = $('.bqs'), ring = $('.bqs-ring'), stage = $('.bqs-stage'), tip = $('.bqs-tip'), pop = $('.bqs-pop'), live = $('.bqs-sr');
    const say = (m) => { live.textContent = ''; setTimeout(() => { live.textContent = m; }, 30); };
    const badge = () => { const n = o.cart && o.cart.n ? o.cart.n() : 0; $('.bqs-cn').textContent = n; $('.bqs-cart').classList.toggle('has', n > 0); const w = (o.wish && o.wish.get()) || []; $('.bqs-wn').textContent = w.length; };
    const setZ = (z, anchor) => { z = Math.round(clamp(z, 0.5, 2.5) * 100) / 100; if (z === st.z && sec.style.getPropertyValue('--z')) return; const a = anchor || centerSpine(); const y0 = a ? a.getBoundingClientRect().top : 0;
      st.z = z; sec.style.setProperty('--z', z); $('.bqs-zv').textContent = Math.round(z * 100) + '%'; LS.set('zoom', z); relayout(); cutAll(); if (a && a.isConnected) { const y1 = a.getBoundingClientRect().top; window.scrollBy(0, y1 - y0); } };
    sec.style.setProperty('--rh', C.rowH); sec.style.setProperty('--z', st.z); $('.bqs-zv').textContent = Math.round(st.z * 100) + '%';

    /* ── 책장 하나 그리기 */
    const isWish = (id) => B.wishHas((o.wish && o.wish.get()) || [], id);
    const cutOf = (L) => !C.fullText || L.ft * st.z < C.minFs || (L.fa > 0 && L.fa * st.z < C.minFs - 1.5);
    const spineH = (x, cs, ck) => { const L = lookOf(x); const f = B.fontById(L.f); const ff = C.fontsOn ? `'bqf-${L.f}-${ck}','${f.name}',${f.gen}` : f.gen; const img = C.spineImg && x.sp;
      const lab = `${x.t}${x.a ? ' · ' + x.a : ''} · ${won(x.p)}${x.st === 'o' ? ' · 주문 중' : ''}${isWish(x.id) ? ' · 찜함' : ''}`;
      return `<button type="button" class="sp${img ? ' img' : ''}${x.st === 'o' ? ' held' : ''}${isWish(x.id) ? ' wished' : ''}${cutOf(L) ? ' cut' : ''}${L.tilt ? ' tilt' + (L.tilt > 0 ? 'r' : 'l') : ''}" data-id="${esc(x.id)}" data-d="${L.d}" data-p="${L.p}" data-s="${L.body}" data-h="${L.head}" data-o="${L.o}" data-ft="${L.ft}" data-fa="${L.fa}" tabindex="-1" aria-label="${esc(lab)}" style="--bw:${L.w};--bh:${L.h};--c:${L.c};--c2:${L.c2};--k:${L.k};--g:${L.ac};--ft:${L.ft};--fa:${L.fa};--fw:${L.fw};font-family:${esc(ff)}"><span class="sk">${img ? `<img class="si" src="${esc(x.sp)}" alt="" loading="lazy" decoding="async">` : ''}${L.head > 1 ? '<span class="hd" aria-hidden="true"></span>' : ''}<span class="tx"><span class="tt">${esc(x.t)}</span>${x.a ? `<span class="au">${esc(x.a)}</span>` : ''}</span></span>${x.st === 'o' ? '<span class="hb" aria-hidden="true">주문 중</span>' : ''}<span class="rb" aria-hidden="true"></span></button>`; };
    const cutAll = () => ring.querySelectorAll('.sp').forEach((b) => b.classList.toggle('cut', cutOf({ ft: +b.dataset.ft, fa: +b.dataset.fa })));
    /* ── 책등 모양 영구 저장(정범님 11/11): 서버에 정해진 것(x.lk) → 이 기기에 정한 것 → 새로 정함(앞표지 대표색을 기다려야 하면 잠깐 임시 모양 · 저장 안 함) */
    const LKC = new Map(); const LKL = LS.get('lk', {}) || {}; const LQ = []; let lkT = 0; const gen = C0.lookGen || 0;
    const CC = { ok: !!(root.document && root.HTMLCanvasElement), fail: 0, okN: 0, got: new Map(), done: new Set(), q: [], run: 0 };
    function keep(id, code) { if (!C0.lookKeep) return; LKL[id] = code; LQ.push([id, code]); clearTimeout(lkT); lkT = setTimeout(() => { const ks = Object.keys(LKL); if (ks.length > 6000) ks.slice(0, ks.length - 6000).forEach((k) => delete LKL[k]); LS.set('lk', LKL);
      const L = LQ.splice(0, LQ.length); if (L.length && o.saveLooks) for (let i = 0; i < L.length; i += 300) o.saveLooks(L.slice(i, i + 300), gen); }, 2500); }
    keep.flush = () => { clearTimeout(lkT); lkT = setTimeout(() => { const L = LQ.splice(0, LQ.length); if (L.length && o.saveLooks) for (let i = 0; i < L.length; i += 300) o.saveLooks(L.slice(i, i + 300), gen); }, 2500); };
    function lookOf(x) { let L = LKC.get(x.id); if (L) return L; let A = null; let temp = false;
      if (C0.lookKeep) for (const code of [x.lk, LKL[x.id]]) { const a = code && B.decode(code); if (a && a.g === gen) { A = a; if (code !== x.lk && !o.demo) { LQ.push([x.id, code]); keep.flush(); } break; } } /* 이 기기에만 있던 모양은 서버에도 알림(서버가 먼저 정한 것이 있으면 서버 것) */
      if (!A) { const want = C0.coverColor && x.im && !(C0.spineImg && x.sp) && CC.ok && !CC.done.has(x.id); A = B.assign(x, C0, CC.got.get(x.id) || null); if (want) { temp = true; ccAsk(x); } else keep(x.id, B.encode(A)); }
      const vo = view().orient; if (vo === 'v' || vo === 'h') A = { ...A, o: vo }; /* 손님 ⚙ 보기 글 방향은 그 기기 화면만(저장하는 모양은 그대로) */
      L = B.dress(x, A, C); L.temp = temp; LKC.set(x.id, L); return L; }
    /* 앞표지 대표색 — 16×16으로 줄여 읽음(그림 서버가 CORS를 안 열면 canvas가 막힘 → 4번 막히면 이 화면에선 그만 · 제목 낱말로) */
    function readColor(u) { return new Promise((ok) => { let dn = false; const im = new Image(); const fin = (v) => { if (dn) return; dn = true; clearTimeout(t); ok(v); }; const t = setTimeout(() => fin(undefined), 6000);
      im.crossOrigin = 'anonymous'; im.decoding = 'async'; im.onload = () => { try { const cv = document.createElement('canvas'); cv.width = cv.height = 16; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, 16, 16); CC.okN++; fin(B.dominant(g.getImageData(0, 0, 16, 16).data)); } catch (e) { CC.fail++; fin(null); } };
      im.onerror = () => { CC.fail++; fin(null); }; im.src = u; }); }
    function ccAsk(x) { CC.q.push(x); ccRun(); }
    function ccRun() { while (CC.run < 3 && CC.q.length && !st.dead) { const x = CC.q.shift(); if (CC.done.has(x.id)) continue; CC.run++;
      readColor(x.im).then((hex) => { CC.run--; if (st.dead) return; if (hex === undefined) { ccRun(); return; } CC.done.add(x.id); if (hex) CC.got.set(x.id, hex); if (CC.fail >= 4 && !CC.okN) CC.ok = false;
        LKC.delete(x.id); const A = B.assign(x, C0, hex || null); keep(x.id, B.encode(A)); const b = ring.querySelector(`.sp[data-id="${CSS.escape(x.id)}"]`); if (b && b !== popFor) { const c = b.closest('.bqs-case'); const ti = b.tabIndex; b.outerHTML = spineH(x, null, st.sort + c.dataset.i); const n = ring.querySelector(`.sp[data-id="${CSS.escape(x.id)}"]`); if (n) n.tabIndex = ti; ccFont(); }
        if (!CC.ok) CC.q.splice(0).forEach((y) => { CC.done.add(y.id); LKC.delete(y.id); keep(y.id, B.encode(B.assign(y, C0, null))); }); ccRun(); }); } }
    let ccFT = 0; const ccFont = () => { clearTimeout(ccFT); ccFT = setTimeout(() => fontsFor(curCase()), 400); };
    const labH = (s) => `<div class="lab" role="heading" aria-level="3"><span>${esc(s.lab)}</span><small>${(s.n || 0).toLocaleString('ko-KR')}권</small></div>`;
    function caseH(j) { const P = st.P; const N = P.cases.length; const i = B.mod(j, N); const cs = P.cases[i]; const ck = st.sort + i; const W = innerW(); const k = B.bays(W, C, st.z);
      const parts = B.split(cs.slots, k);
      return `<div class="bqs-case" data-j="${j}" data-i="${i}" role="region" aria-roledescription="책장" aria-label="책장 ${i + 1}/${N}: ${esc(cs.name)}" style="transform:${place(j)}">
        <header class="bqs-top"><b>${esc(cs.name)}</b> <small>${esc(cs.sub || '')} · ${cs.n.toLocaleString('ko-KR')}권</small></header>
        <div class="bqs-bays" style="--k:${k}">${parts.map((ps, b) => `<div class="bqs-bay" role="group" aria-label="${b + 1}번째 칸">${ps.map((s) => (s.lab ? labH(s) : spineH(s, cs, ck))).join('')}</div>`).join('')}</div>
        <div class="bqs-foot" aria-hidden="true"></div></div>`; }
    const innerW = () => Math.max(260, stage.clientWidth - 24);
    /* ── 원형 배치 · 돌리기 */
    let RG = B.ring(1, 1000);
    const place = (j) => (C.turn3d ? `rotateY(${j * RG.step}deg) translateZ(${-RG.R}px)` : `translateX(${j * (st.W + 40)}px)`);
    const ringT = (j, pull) => (C.turn3d ? `translateZ(${RG.R - (pull || 0)}px) rotateY(${-j * RG.step}deg)` : `translateX(${-j * (st.W + 40)}px) scale(${pull ? 0.94 : 1})`);
    const want = () => { const N = st.P.cases.length; if (N <= 1) return [st.j]; if (N === 2) return [st.j, st.j + 1]; return [st.j - 1, st.j, st.j + 1]; };
    function sync(full) { /* 필요한 책장만 DOM에 */ if (!st.P || st.dead) return; st.W = stage.clientWidth; RG = B.ring(st.P.cases.length, st.W); stage.style.perspective = RG.persp + 'px';
      const need = new Set(want()); [...ring.children].forEach((c) => { const j = +c.dataset.j; if (full || !need.has(j)) { if (!need.has(j)) fontsDrop(c); c.remove(); } });
      const have = new Set([...ring.children].map((c) => +c.dataset.j)); for (const j of need) if (!have.has(j)) ring.insertAdjacentHTML('beforeend', caseH(j));
      [...ring.children].forEach((c) => { c.style.transform = place(+c.dataset.j); const cur = +c.dataset.j === st.j; c.classList.toggle('cur', cur); c.inert = !cur; c.setAttribute('aria-hidden', cur ? 'false' : 'true'); });
      ring.style.transform = ringT(st.j); fitH(); fontsFor(curCase()); roving(); navH(); }
    const curCase = () => ring.querySelector(`.bqs-case[data-j="${st.j}"]`);
    function fitH() { if (st.dead) return; const c = curCase(); if (c) stage.style.height = c.offsetHeight + 'px'; }
    function navH() { const N = st.P.cases.length; const i = B.mod(st.j, N); const cs = st.P.cases[i]; const nv = $('.bqs-nav'); nv.hidden = N <= 1; $('.bqs-arrow.l').hidden = $('.bqs-arrow.r').hidden = N <= 1;
      const nm = (d) => st.P.cases[B.mod(st.j + d, N)].name; $('.bqs-pv').innerHTML = `‹ <span>${esc(nm(-1))}</span>`; $('.bqs-nx').innerHTML = `<span>${esc(nm(1))}</span> ›`; $('.bqs-pv').setAttribute('aria-label', '이전 책장: ' + nm(-1)); $('.bqs-nx').setAttribute('aria-label', '다음 책장: ' + nm(1));
      $('.bqs-arrow.l').setAttribute('aria-label', '이전 책장: ' + nm(-1)); $('.bqs-arrow.r').setAttribute('aria-label', '다음 책장: ' + nm(1));
      $('.bqs-here b').textContent = cs.name; $('.bqs-here small').textContent = `${i + 1} / ${N} · ${B.compass(i, i, N)}쪽 · 다음 책장은 ${B.compass(i + 1, i, N)}쪽`;
      const D = Math.min(N, 24); $('.bqs-dots').innerHTML = N > 1 ? Array.from({ length: D }, (_, k) => `<i class="${Math.floor(i * D / N) === k ? 'on' : ''}"></i>`).join('') : '';
      MEM[st.sort] = { j: st.j }; LS.set('pos', { s: st.sort, i }); o.onState && o.onState({ s: st.sort, i }); }
    function turn(d) { if (!st.P || st.busy || st.P.cases.length <= 1) return; closePop(); hideTip(); const N = st.P.cases.length; const j0 = st.j, j1 = st.j + d;
      if (!ring.querySelector(`.bqs-case[data-j="${j1}"]`)) ring.insertAdjacentHTML('beforeend', caseH(j1)); [...ring.children].forEach((c) => { c.style.transform = place(+c.dataset.j); c.inert = true; });
      const nc = ring.querySelector(`.bqs-case[data-j="${j1}"]`); stage.style.height = Math.max(stage.offsetHeight, nc.offsetHeight) + 'px';
      const r = stage.getBoundingClientRect(); stage.style.perspectiveOrigin = `50% ${clamp(innerHeight / 2 - r.top, 80, r.height - 80)}px`;
      const ms = RM() ? 0 : C.turnMs; st.busy = true; sec.classList.add('turning'); const pull = Math.min(320, st.W * 0.22);
      const done = () => { if (st.dead) return; st.j = j1; ring.style.transform = ringT(j1); sec.classList.remove('turning'); st.busy = false; sync(false); const t = curCase(); const top = t.getBoundingClientRect().top; if (top < 0) window.scrollBy(0, top - 60);
        say(`책장 ${B.mod(j1, N) + 1}/${N}: ${st.P.cases[B.mod(j1, N)].name}`); };
      if (!ms || !ring.animate) return done();
      const a = ring.animate([{ transform: ringT(j0) }, { transform: ringT(j0 + d * 0.5, pull), offset: 0.5 }, { transform: ringT(j1) }], { duration: ms, easing: 'cubic-bezier(.45,.05,.25,1)' }); a.onfinish = done; a.oncancel = done; }
    function go(i) { if (!st.P) return; const N = st.P.cases.length; st.j = B.mod(i, N); sync(true); }

    /* ── 손님 ⚙ 보기(이 기기만) */
    function viewH() { const v = view(); const sel = (k, L, d) => `<select data-v="${k}">${L.map(([a, n]) => `<option value="${a}"${String(v[k] != null ? v[k] : C0[k]) === String(a) ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
      const ck = (k, n) => `<label><input type="checkbox" data-v="${k}"${(v[k] != null ? v[k] : C0[k]) ? ' checked' : ''}> ${esc(n)}</label>`;
      return `<div class="bqs-vg"><label>책장 종류 ${sel('wood', B.CASES)}</label><label>책등 누르면 ${sel('popMode', [['spine', '책등에 바로 단추'], ['bubble', '말풍선 창']])}</label><label>담기 움직임 ${sel('cartAnim', [['rand', '매번 랜덤'], ...B.CART_ANIMS, ['off', '없음']])}</label><label>찜 움직임 ${sel('wishAnim', [['rand', '매번 랜덤'], ...B.WISH_ANIMS, ['off', '없음']])}</label>
        <label>책등 글 ${sel('orient', [['rand', '책마다 랜덤'], ['v', '세로쓰기'], ['h', '가로쓰기(눕힘)']])}</label>${ck('turn3d', '책장 3D로 돌기')}${ck('tip', '마우스 올리면 책 정보')}${ck('fontsOn', '여러 글꼴(끄면 더 가벼움)')}
        <button type="button" class="bqs-vr">가게 기본으로</button></div><p class="bqs-hint">이 기기에만 저장됩니다 · 키보드: ←→ 옆 책 · ↑↓ 위아래 선반 · Enter 담기 창 · [ ] 책장 돌리기 · + − 확대 · Ctrl+휠·두 손가락으로도 확대</p>`; }
    function setView(k, v) { const V = view(); if (k == null) { LS.set('view', {}); } else { V[k] = v; LS.set('view', V); } C = B.cfgOf({ ...C0, ...view() }); sec.className = `bqs room-${C.room} wood-${C.wood}`; LKC.clear(); sync(true); $('#bqsView').innerHTML = viewH(); }

    /* ── 글꼴: 그 책장에 쓰인 글자만 받아 별칭(bqf-글꼴-책장)으로 */
    function fontsFor(cEl) { if (!C.fontsOn || !cEl || !root.fetch) return; const ck = st.sort + cEl.dataset.i; const by = new Map();
      cEl.querySelectorAll('.sp:not(.ok)').forEach((b) => { const x = byId.get(b.dataset.id); if (!x) return; const f = lookOf(x).f; by.set(f, (by.get(f) || '') + x.t + (x.a || '')); });
      const jobs = [...by].map(([f, txt]) => () => { const al = `bqf-${f}-${ck}`; if (FONT_CSS.has(al)) { const s = FONT_CSS.get(al); FONT_CSS.delete(al); FONT_CSS.set(al, s); return Promise.resolve(); }
        return fetch(B.fontUrl(f, txt)).then((r) => (r.ok ? r.text() : '')).then((css) => { if (!css || st.dead) return; const s = document.createElement('style'); s.dataset.bqf = al; s.textContent = css.replace(/font-family:\s*'[^']+'/g, `font-family:'${al}'`); document.head.appendChild(s); FONT_CSS.set(al, s);
          while (FONT_CSS.size > 160) { const [k0, s0] = FONT_CSS.entries().next().value; s0.remove(); FONT_CSS.delete(k0); } }).catch(() => {}); });
      let n = 0; const next = () => { if (st.dead || n >= jobs.length) return; jobs[n++]().then(next); }; const idle = root.requestIdleCallback || ((f) => setTimeout(f, 60)); idle(() => { for (let i = 0; i < 4; i++) next(); }); }
    const fontsDrop = (c) => { if (!c || !c.dataset) return; const ck = '-' + st.sort + c.dataset.i; for (const [al, s0] of [...FONT_CSS]) if (al.endsWith(ck)) { s0.remove(); FONT_CSS.delete(al); } };

    /* ── 툴팁(앞·뒤 표지 · 책 정보) */
    const byId = new Map();
    function showTip(b) { const x = byId.get(b.dataset.id); if (!x || !C.tip) return; const off = x.lp > 0 && x.p < x.lp ? Math.round((1 - x.p / x.lp) * 100) : 0;
      tip.innerHTML = `<div class="tc">${x.im ? `<img src="${esc(x.im)}" alt="앞표지">` : '<span class="ni">앞표지<br>사진 없음</span>'}${x.bk ? `<img src="${esc(x.bk)}" alt="뒤표지">` : '<span class="ni">뒤표지<br>사진 없음</span>'}</div>
        <b>${esc(x.t)}</b><div class="tm">${esc([x.a, x.pb].filter(Boolean).join(' · '))}</div><div class="tp">${x.g ? `<span class="g g-${esc(x.g)}">${esc(x.g)}</span> ` : ''}<b>${won(x.p)}</b>${off ? ` <small class="off">${off}%↓</small>` : ''}${x.lp ? ` <s>${won(x.lp)}</s>` : ''}</div>
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
      pop.className = 'bqs-pop' + (sp ? ' onsp' : '');
      pop.innerHTML = sp ? `<div class="pcap"><b>${esc(x.t)}</b><small>${esc(x.a || '')}${x.a ? ' · ' : ''}${won(x.p)}</small><button type="button" class="px" data-a="x" aria-label="닫기">✕</button></div><div class="pa">${cartB}${wishB}${openB}</div>`
        : `<div class="pt"><b>${esc(x.t)}</b><small>${esc(x.a || '')} · ${won(x.p)}</small></div><div class="pa">${cartB}${wishB}${openB}</div><button type="button" class="px" data-a="x" aria-label="닫기">✕</button>`;
      if (sp) { pop.style.setProperty('--c', b.style.getPropertyValue('--c')); pop.style.setProperty('--k', b.style.getPropertyValue('--k')); pop.style.setProperty('--g', b.style.getPropertyValue('--g')); }
      pop.setAttribute('aria-label', x.t + ' — 담기·찜'); pop.hidden = false; st.popY = y; st.popAt = Date.now(); posPop(); const f = pop.querySelector('.pa button:not([disabled]),.pa a'); if (f) f.focus({ preventScroll: true }); }
    function posPop() { if (!popFor || pop.hidden) return; const sk = popFor.querySelector('.sk') || popFor; const r = sk.getBoundingClientRect(); const pw = pop.offsetWidth, ph = pop.offsetHeight;
      if (pop.classList.contains('onsp')) { const pa = pop.querySelector('.pa'); const b0 = pa.firstElementChild; const off = b0 ? b0.offsetTop + b0.offsetHeight / 2 : 24; const y = st.popY != null ? st.popY : r.top + r.height / 2;
        let T = clamp(y - off, r.top - ph * 0.5, r.bottom - ph * 0.5); T = clamp(T, 8, innerHeight - ph - 8); /* 🛒이 누른 높이에 오게(책등 밖으로 반까지 나가도 됨) */ const L = clamp(r.left + r.width / 2 - pw / 2, 4, innerWidth - pw - 4);
        pop.style.left = L + 'px'; pop.style.top = T + 'px'; const cap = pop.querySelector('.pcap'); if (cap) { const cw = cap.offsetWidth; const cl = clamp(L + pw / 2 - cw / 2, 8, innerWidth - cw - 8); cap.style.left = (cl - L) + 'px'; cap.classList.toggle('below', T - cap.offsetHeight - 8 < 4); } return; }
      let L = clamp(r.left + r.width / 2 - pw / 2, 8, innerWidth - pw - 8); let T = r.top - ph - 10; if (T < 8) T = Math.min(innerHeight - ph - 8, r.bottom + 10);
      pop.style.left = L + 'px'; pop.style.top = T + 'px'; pop.style.setProperty('--ax', clamp(r.left + r.width / 2 - L, 14, pw - 14) + 'px'); pop.classList.toggle('below', T > r.top); }
    function closePop(back) { if (pop.hidden) return; pop.hidden = true; const b = popFor; popFor = null; if (b) { b.classList.remove('out'); if (back) b.focus({ preventScroll: true }); } }
    on(ring, 'click', (e) => { const b = e.target.closest('.sp'); if (!b || st.busy) return; e.preventDefault(); if (popFor === b) return closePop(true); setFocus(b); openPop(b, e.detail ? e.clientY : null); });
    on(pop, 'click', (e) => { const a = e.target.closest('[data-a]'); if (!a) return; if (e.detail > 1) return; /* 책등을 두 번 누른 둘째 누름이 담기로 새지 않게 */ const b = popFor; const x = b && byId.get(b.dataset.id); const k = a.dataset.a;
      if (k === 'x') return closePop(true); if (!x) return; if (k === 'open') { closePop(); return o.open && o.open(x.id); }
      if (k === 'cart') { const why = o.cart.add(x); if (why) { o.toast && o.toast(why); return; } closePop(); flyCart(b, x); say(x.t + ' — 장바구니에 담았습니다'); }
      if (k === 'wish') { const r = B.wishToggle((o.wish && o.wish.get()) || [], x); o.wish.set(r.wish); b.classList.toggle('wished', r.on); b.setAttribute('aria-label', b.getAttribute('aria-label').replace(/ · 찜함$/, '') + (r.on ? ' · 찜함' : '')); closePop(true); badge(); if (r.on) wishFx(b); o.toast && o.toast(r.on ? '♥ 찜 목록에 넣었습니다' : '찜을 뺐습니다'); } });
    on(document, 'pointerdown', (e) => { if (!pop.hidden && !pop.contains(e.target) && !(popFor && popFor.contains(e.target))) closePop(); }, true);

    /* ── 장바구니 움직임 5가지(설정: 랜덤·하나 고정·없음) */
    const pick = (mode, L) => (mode === 'rand' ? L[Math.floor(Math.random() * L.length)][0] : mode);
    function ghost(b, x, cover) { const r = (b.querySelector('.sk') || b).getBoundingClientRect(); const g = document.createElement('div'); g.className = 'bqs-fly' + (cover ? ' cv' : ''); g.setAttribute('aria-hidden', 'true');
      if (cover) { g.innerHTML = x.im ? `<img src="${esc(x.im)}" alt="">` : `<span>${esc(x.t)}</span>`; g.style.setProperty('--c', b.style.getPropertyValue('--c')); g.style.setProperty('--k', b.style.getPropertyValue('--k')); }
      else { const sk = b.querySelector('.sk').cloneNode(true); g.appendChild(sk); g.dataset.d = b.dataset.d; g.dataset.o = b.dataset.o; g.style.cssText = b.style.cssText; g.style.fontFamily = b.style.fontFamily; if (b.classList.contains('img')) g.classList.add('img'); }
      Object.assign(g.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); sec.appendChild(g); return { g, r }; }
    function flyCart(b, x) { badge(); const cart = $('.bqs-cart'); const m = pick(C.cartAnim, B.CART_ANIMS); if (m === 'off' || RM() || !b.animate) return bump(cart);
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
    on(stage, 'pointerdown', (e) => { if (e.pointerType !== 'touch') return; P2.set(e.pointerId, [e.clientX, e.clientY]); if (P2.size === 2) { const [a, b] = [...P2.values()]; pin = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: st.z }; sw = null; } else sw = { x: e.clientX, y: e.clientY, t: Date.now() }; });
    on(stage, 'pointermove', (e) => { if (!P2.has(e.pointerId)) return; P2.set(e.pointerId, [e.clientX, e.clientY]); if (pin && P2.size === 2) { const [a, b] = [...P2.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (!st._pr) st._pr = requestAnimationFrame(() => { st._pr = 0; setZ(pin.z * d / pin.d); }); } });
    const pUp = (e) => { if (!P2.has(e.pointerId)) return; P2.delete(e.pointerId); if (P2.size < 2) pin = null; if (sw && e.type === 'pointerup') { const dx = e.clientX - sw.x, dy = e.clientY - sw.y; if (Math.abs(dx) > 70 && Math.abs(dy) < 40 && Date.now() - sw.t < 600) turn(dx < 0 ? 1 : -1); } sw = null; };
    on(stage, 'pointerup', pUp); on(stage, 'pointercancel', pUp);
    /* ── 좌우 화살표 — 커서가 가까이 가면 살아남 */
    const AL = $('.bqs-arrow.l'), AR = $('.bqs-arrow.r'); on(AL, 'click', () => turn(-1)); on(AR, 'click', () => turn(1)); on($('.bqs-pv'), 'click', () => turn(-1)); on($('.bqs-nx'), 'click', () => turn(1));
    on(window, 'pointermove', (e) => { if (e.pointerType !== 'mouse' || AL.hidden) return; for (const A of [AL, AR]) { const r = A.getBoundingClientRect(); const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)); const k = clamp(1 - d / 300, 0, 1); A.style.setProperty('--near', k.toFixed(3)); A.classList.toggle('hot', d < 90); } }, { passive: true });
    /* ── 정렬 · 보기 · 크기 바뀜 */
    on($('.bqs-sort'), 'change', (e) => { st.sort = e.target.value; if (C.remember) LS.set('sort', st.sort); st.P = B.plan(st.items, C, st.sort); st.focusId = null; st.j = (MEM[st.sort] && MEM[st.sort].j) || 0; sync(true); say(`${e.target.selectedOptions[0].textContent}으로 · 책장 ${st.P.cases.length}개`); });
    const gear = $('.bqs-gear'); if (gear) on(gear, 'click', () => { const v = $('#bqsView'); v.hidden = !v.hidden; gear.setAttribute('aria-expanded', String(!v.hidden)); if (!v.hidden) v.innerHTML = viewH(); });
    on($('#bqsView'), 'change', (e) => { const t = e.target.closest('[data-v]'); if (t) setView(t.dataset.v, t.type === 'checkbox' ? t.checked : t.value); });
    on($('#bqsView'), 'click', (e) => { if (e.target.closest('.bqs-vr')) setView(null); });
    let rw = 0; const relayout = () => { if (!st.P || st.dead) return; const c = curCase(); const k = B.bays(innerW(), C, st.z); const kNow = c ? +(c.querySelector('.bqs-bays') || { style: {} }).style.getPropertyValue('--k') : 0; if (c && kNow === k && Math.abs(stage.clientWidth - st.W) < 2) return fitH(); sync(true); };
    const RO = root.ResizeObserver ? new ResizeObserver(() => { cancelAnimationFrame(rw); rw = requestAnimationFrame(() => { if (!st.busy) relayout(); fitH(); }); }) : null; if (RO) RO.observe(stage);
    on(window, 'scroll', () => { if (!pop.hidden) posPop(); if (!tip.hidden) hideTip(); }, { passive: true });
    const centerSpine = () => { const r = stage.getBoundingClientRect(); const e = document.elementFromPoint(clamp(innerWidth / 2, 0, innerWidth - 1), clamp(innerHeight / 2, Math.max(0, r.top), Math.min(innerHeight - 1, r.bottom))); return e && e.closest ? e.closest('.sp') : null; };
    /* 책등 그림이 오면 그 그림 비율로 두께를 맞춤(진짜 책 두께) · 안 열리면 디자인 책등으로 */
    on(ring, 'load', (e) => { const im = e.target; if (!im.classList || !im.classList.contains('si') || !im.naturalHeight) return; const b = im.closest('.sp'); const w = clamp(Math.round((C.rowH * 0.86 * (+b.style.getPropertyValue('--bh') || 92) / 100) * im.naturalWidth / im.naturalHeight), 10, 90); b.style.setProperty('--bw', w); b.classList.add('ok'); }, true);
    on(ring, 'error', (e) => { const im = e.target; if (im.classList && im.classList.contains('si')) { const b = im.closest('.sp'); im.remove(); if (b) b.classList.remove('img'); } }, true);

    /* ── 자료 받기 → 그리기 */
    badge(); const lt = $('.bqs-load span'), lb = $('.bqs-lbar i');
    Promise.resolve(o.load ? o.load((n, of) => { if (st.dead) return; lt.textContent = `책을 꽂는 중… ${n.toLocaleString('ko-KR')}${of ? ' / ' + of.toLocaleString('ko-KR') : ''}권`; if (of) lb.style.width = Math.round(n / of * 100) + '%'; }) : [])
      .then((items) => { if (st.dead) return; st.items = items || []; byId.clear(); st.items.forEach((x) => byId.set(x.id, x)); $('.bqs-load').remove(); $('.bqs-n').textContent = st.items.length.toLocaleString('ko-KR') + '권';
        if (!st.items.length) { ring.innerHTML = '<div class="bqs-empty">아직 꽂을 책이 없습니다</div>'; stage.style.height = 'auto'; return; }
        st.P = B.plan(st.items, C, st.sort); const N = st.P.cases.length; const p0 = o.start || {}; const pos = LS.get('pos', null);
        st.j = p0.i != null ? B.mod(+p0.i || 0, N) : MEM[st.sort] ? B.mod(MEM[st.sort].j, N) : pos && pos.s === st.sort ? B.mod(pos.i, N) : 0; sync(true); o.ready && o.ready(api); })
      .catch((e) => { if (st.dead) return; const l = $('.bqs-load'); if (l) l.innerHTML = `<div class="err"><b>⚠ ${esc(e.message || e)}</b> <button type="button" class="btn ghost bqs-again">다시 해 보기</button></div>`; const a = $('.bqs-again'); if (a) a.onclick = () => { api.destroy(); mount(el, o); }; });
    const api = { get state() { return { sort: st.sort, i: st.P ? B.mod(st.j, st.P.cases.length) : 0, N: st.P ? st.P.cases.length : 0, z: st.z, n: st.items.length }; }, turn, go, zoom: setZ, badge, lookOf: (id) => { const x = byId.get(id); return x ? lookOf(x) : null; }, get colorState() { return { ok: CC.ok, fail: CC.fail, okN: CC.okN, got: CC.got.size, q: CC.q.length }; },
      destroy() { st.dead = true; cancelAnimationFrame(rw); offs.forEach((f) => f()); if (RO) RO.disconnect(); closePop(); hideTip(); el.querySelectorAll('.bqs-fly,.bqs-fx').forEach((x) => x.remove()); } };
    return api; }
  root.BQShelf = { mount, VER: B.VER };
})(typeof self !== 'undefined' ? self : this);

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
        <button type="button" class="bqs-cvt" aria-pressed="false" title="표지 보기 ↔ 책등 보기">🖼 표지로 보기</button><a class="bqs-wl" href="#/wish" aria-label="찜 목록">♡ 찜 <b class="bqs-wn">0</b></a>
        ${C0.viewerCfg ? '<button type="button" class="bqs-gear" aria-expanded="false" aria-controls="bqsView">⚙ 보기</button>' : ''}
      </div>
      <div class="bqs-view" id="bqsView" hidden></div>
      <nav class="bqs-nav" aria-label="책장 넘기기" hidden><button type="button" class="bqs-pv"></button><div class="bqs-here"><b></b><small></small><div class="bqs-dots" aria-hidden="true"></div><span class="bqs-loop" title="끝과 끝이 이어진 둥근 책장 — 마지막 다음은 처음" aria-hidden="true">↻ 이어짐</span></div><button type="button" class="bqs-nx"></button></nav>
      <div class="bqs-stick"><div class="bqs-mpos" hidden><button type="button" class="mp-pv" aria-label="이전 책장">‹</button><button type="button" class="mp-nm" aria-expanded="false" aria-label="책장 고르기"><b></b><small></small></button><button type="button" class="mp-nx" aria-label="다음 책장">›</button><div class="mp-dots" aria-hidden="true"></div></div>
      <nav class="bqs-jump" aria-label="구역 바로 가기" hidden></nav></div>
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
    sec.style.setProperty('--rh', C.rowH); sec.style.setProperty('--ep', C.edgePct); sec.style.setProperty('--z', st.z); $('.bqs-zv').textContent = Math.round(st.z * 100) + '%';

    /* ── 책장 하나 그리기 */
    let WS = null; const wishSet = () => WS || (WS = new Set(((o.wish && o.wish.get()) || []).map((w) => (w && typeof w === 'object' ? w.id : w)))); const isWish = (id) => wishSet().has(id); /* (shelf4) 찜 목록도 한 번만 읽어 둠 — 바뀌면 badge()가 지움 */
    /* (shelf3) 세로쓰기에서 짧은 숫자(1~2자리)는 세워 묶음(text-combine-upright) · (shelf4) 영문·긴 숫자 덩어리는 따로 감싸 앞뒤 한글과 띄움(리드 화면 확인: '와Python'·'딩100'·'밀1'이 붙어 엉킴) */
    const tcy = (t) => { const S = String(t == null ? '' : t); const re = /([A-Za-z][A-Za-z0-9'’.&+\-]*(?: [A-Za-z0-9][A-Za-z0-9'’.&+\-]*)*)|([0-9]{3,})|([0-9]{1,2})|([:;,…!?]+)/g; let o = '', k = 0, m;
      while ((m = re.exec(S))) { o += esc(S.slice(k, m.index)); o += m[3] != null ? `<span class="tcy">${m[0]}</span>` : m[4] != null ? `<span class="pn">${esc(m[0])}</span>` : `<span class="lt">${esc(m[0])}</span>`; k = m.index + m[0].length; } return o + esc(S.slice(k)); };
    const auOf = (x) => B.auName(x.a); /* (shelf4) 책등엔 이름만 */
    /* ══ (shelf3 · 정범님 11/13 21:28·21:40) 📷 표지 차례(① 관리자 ② 알라딘 ③ '표지로 알맞음' 우리 사진 ④ 고유 디자인) · 📀 책이 아닌 제품 · 🎨 고유 표지 */
    const KD_N = { cd: 'CD', dvd: 'DVD', bd: 'Blu-ray', vhs: 'VHS', lp: 'LP' };
    const faceX = (x) => B.faceOf(x, C);
    const mdX = (x) => (C.mediaOn !== false && x && x.kd && x.kd !== 'book' && KD_N[x.kd] ? x.kd : '');
    const artH = (x, cls) => { const A = B.artOf(x); const by = B.auName(x.a); return `<span class="art ap-${A.pat} al-${A.lay} af-${A.fg}${cls ? ' ' + cls : ''}" style="--a1:${A.bg};--a2:${A.ac};--ak:${A.ink}" data-art="${esc(A.code)}" aria-hidden="true">${C.artText !== false ? `<b>${esc(x.t)}</b>${by ? `<small>${esc(by)}</small>` : ''}` : ''}${mdX(x) ? `<i class="ak">${KD_N[x.kd]}</i>` : ''}</span>`; };
    /* 표지 모드 그림 칸 — 관리자 표지·알라딘·알맞은 우리 사진은 그림 · 물건 사진·그림 없음은 고유 디자인(artOn 끄면 예전처럼 사진) */
    const faceImg = (x) => { const F = faceX(x); if (F.use === 'cover') return `<img src="${esc(F.src)}" alt="" loading="lazy" decoding="async">`; if (C.artOn !== false) return artH(x); return x.im ? `<img src="${esc(x.im)}" alt="" loading="lazy" decoding="async">` : `<i>${esc(x.t)}</i>`; };
    /* 누르면 무엇이 나오나 — 'photo'(물건 사진 자체) · 'media'(제품답게 열림) · ''(책 펼침) */
    const prodMode = (x) => { const F = faceX(x); if (F.use === 'photo' && C.photoOpen !== 'book') return 'photo'; if (mdX(x) && C.mediaOpen !== 'book') return 'media'; return ''; };
    const spineH = (x, cs, ck, V) => { const L = V ? V.L : lookOf(x); /* (shelfset1) V = 세트 한 권 { L, i, n, vn, base, img } */ const f = B.fontById(L.f); const fb = f.gen === 'serif' ? `'Noto Serif KR','Batang','AppleMyungjo',serif` : `'Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo',${f.gen}`; const ff = C.fontsOn ? `'bqf-${L.f}-${ck}','${f.name}',${fb}` : fb; /* (shelf4) 받기 전·못 받을 때도 세로 글자 자리(세로 metrics)가 바른 한글 글꼴로 */ const img = V ? V.img : C.spineImg && x.sp; const md = V ? '' : mdX(x); const eg = !V && !img && !md && C.edgeSpine && x.im && faceX(x).use === 'cover'; /* (shelf3) 물건 사진·자리 그림의 가장자리 띠는 책등처럼 보이지 않음 */ /* (shelf6) 책등 그림이 없으면 앞표지 왼쪽 가장자리 띠를 늘려 책등으로 */ const tg = V && V.i ? null : B.tagOf(x); const so = B.saleOf(x);
      const qn = V ? 0 : qnOf(x); const lab = (V ? `${V.base} ${V.vn}권 (전 ${V.n}권 세트 · 한 번에 모두 담김) · ` : '') + `${x.t}${x.a ? ' · ' + x.a : ''} · ${won(x.p)}${so && so.from === 'p0' ? ` (할인 ${so.pct}% · 원래 ${won(so.was)})` : ''}${tg && tg.k !== 'sale' ? ' · ' + B.BADGE[tg.k] : ''}${x.st === 'o' ? ' · 주문 중' : ''}${isWish(x.id) ? ' · 찜함' : ''}${x.q > 1 ? ` · ${x.q}권 있음` : ''}${x._dup ? ` · 같은 책 ${x._dup}/${x._dq}` : ''}`;
      return `<button type="button" class="sp${V ? ' sv' + (V.i === 0 ? ' sv0' : '') + (V.i === V.n - 1 ? ' svl' : '') + (L.bc && !img ? ' sb' : '') : ''}${md ? ' md md-' + md : ''}${x._dup ? ' dup' : ''}${img ? ' img' : ''}${x.st === 'o' ? ' held' : ''}${isWish(x.id) ? ' wished' : ''}${tg ? ' tag' : ''}${L.tilt ? ' tilt' + (L.tilt > 0 ? 'r' : 'l') : ''}" data-id="${esc(x.id)}"${V ? ` data-v="${V.i}"` : ''} data-d="${md ? 0 : L.d}" data-p="${md ? 0 : L.p}" data-s="${md ? 1 : L.body}" data-h="${md ? 1 : L.head}" data-o="${L.o}" data-tk="${L.tk}" data-fg="${L.fg}"${L.tp ? ' data-tp="1"' : ''}${L.thin ? ' data-thin="1"' : ''} tabindex="-1" aria-label="${esc(lab)}" style="--bw:${L.w};--bh:${L.h};--c:${L.c};--c2:${L.c2};--k:${L.k};--g:${L.ac};--ft:${L.ft};--fa:${L.fa};--fw:${L.fw};--zt:${L.zt};--zb:${L.zb};--zs:${L.zs};${L.tp ? `--tp:${L.tp};` : ''}${L.vk ? `--vk:${L.vk};` : ''}font-family:${esc(ff)}"><span class="sk">${img ? `<img class="si" src="${esc(x.sp)}" alt="" loading="lazy" decoding="async">` : eg ? `<span class="eg" aria-hidden="true"><img class="ei" src="${esc(x.im)}" alt="" loading="lazy" decoding="async"></span>` : ''}${L.head > 1 && !md ? '<span class="hd" aria-hidden="true"></span>' : ''}${md ? `<span class="mk" aria-hidden="true">${KD_N[md]}</span>` : ''}${x.st === 'o' ? '<span class="hb" aria-hidden="true">주문중</span>' : ''}${V && L.cap && !img ? `<span class="vc vc-${C.setNum === 'top' ? 'b' : 't'}" aria-hidden="true"></span>` : ''}${V && C.setNum !== 'off' ? `<span class="vn vn-${C.setNum === 'top' ? 't' : 'b'}" aria-hidden="true">${esc(V.vn)}</span>` : ''}<span class="tx" aria-hidden="true"><span class="tt">${tcy(V ? V.base : x.t)}</span>${!V && auOf(x) ? `<span class="au">${tcy(auOf(x))}</span>` : ''}</span>${L.d === 37 ? `<span class="cn" aria-hidden="true">${B.callNo(x).map(esc).join('<br>')}</span>` : ''}${tg ? `<span class="bt bt-${tg.k}" aria-hidden="true">${esc(tg.t)}</span>` : ''}${qn ? `<span class="qn" aria-hidden="true">×${qn}</span>` : ''}</span><span class="rb" aria-hidden="true"></span></button>`; };
    /* ══ (shelfset1 · 정범님 11/14 00:29) 📚 세트 — 권 수만큼 책등으로 나눠 꽂음(한 묶음 span.bqs-set · 줄이 바뀌어도 되도록 감쌈) · 권 모양은 세트 모양을 같이 씀(B.setDress)
     *  권별 책등 그림 차례: ① 관리자 그림(setSp) ② 알라딘 책등 그림(setSpImg 'all' — 모든 권 같은 그림 + 권 번호) ③ 앞표지 색으로 만든 세트 디자인 */
    const setX = (x) => { if (!x) return null; if (x._st === undefined) x._st = C.setOn === false ? null : B.setOf(x, C); return x._st; };
    const SVC = new Map(); /* 상품 번호 → { L0, vs } */
    function volsOf(x) { const S = setX(x); if (!S) return null; const L0 = lookOf(x); const h = SVC.get(x.id); if (h && h.L0 === L0) return h.vs; const A = { ...B.decode(L0.code), o: L0.o };
      const Ls = B.setDress(x, A, C, S); const vs = Ls.map((L, i) => { const ad = B.setVolSp(x, S.v[i], C); return { L, i, n: S.n, vn: S.v[i], base: S.base, img: ad || (C.spineImg && C.setSpImg !== 'skip' && x.sp) || null, by: ad ? 'admin' : C.spineImg && C.setSpImg !== 'skip' && x.sp ? 'aladin' : L.bc ? 'design-fb' : 'design' }; }); /* (shelfset2) design-fb = 앞·뒤표지 색 한 벌 */ SVC.set(x.id, { L0, vs }); return vs; }
    const spineX = (x, cs, ck) => { const vs = volsOf(x); if (!vs) return spineH(x, cs, ck); return `<span class="bqs-set" data-set="${esc(x.id)}" style="--sn:${vs.length}">${vs.map((V) => spineH(x, cs, ck, V)).join('')}</span>`; };
    const setBadge = (x) => { const S = setX(x); return S ? `<i class="setb" aria-hidden="true">📚 ${S.n}권</i>` : ''; };
    /* (shop2 · 정범님 11/13) 수량 표시 — '한 권만 진열'이면 수량 2 넘는 책에 ×수량 · '모두 진열'이면 최대 권 수를 넘는 책의 첫 권에만 · 사본(_dup)엔 없음 */
    const qnOf = (x) => (!x || x._dup || !(x.q > 1) ? 0 : C.qtyMode === 'all' ? (x.q > C.qtyMax ? x.q : 0) : x.q);
    const qLine = (x, cls) => (x && x.q > 1 ? `<div class="${cls}">📚 같은 책 <b>${x.q}권</b> 있음 · 한 번에 한 권씩 담깁니다</div>` : '');
    const jkA = (s) => { const [a, b2] = B.jumpKeys ? B.jumpKeys(s) : ['', '']; return a ? ` data-jk="${esc(a)}"${b2 ? ` data-jk2="${esc(b2)}"` : ''}` : ''; };
    /* ── (shelf3) 책등 글 맞추기 — 실제로 재서 맞춤(정범님 '확대하면 전체, 축소하면 줄임' · 리드 화면 확인: 잘림·넘침·겹침)
     *  글 자리(.tx = 장식이 없는 곳) 안에서 제목·지은이 칸 높이를 나누고, 글자 크기를 반씩 좁혀 찾음(모든 책등을 한꺼번에 — 쓰기 한 번·읽기 한 번 × 8번)
     *  가장 작은 글자(minFs · 화면 px)로도 안 들어가면 그때만 앞부분 + 「…」 — 글이 글 자리 밖으로 나가는 일은 없음 */
    const FIT = { z: 0, fk: 0 }; const OVL = { n: 0 }; /* (shelf6) 여러 줄 겹침을 찾아 한 줄로 바꾼 수(시험·진단용 sec.dataset.ovl) */
    function fitSpines(list) { if (st.dead) return; const t0 = performance.now(); const sps = [...list].filter((b) => b.isConnected && !(b.classList.contains('img') && b.classList.contains('ok'))); if (!sps.length) return;
      const minF = C.minFs, J = [];
      for (const b of sps) { const tx = b.querySelector('.tx'); if (!tx) continue; const tt = tx.querySelector('.tt'), au = tx.querySelector('.au'); const x0 = byId.get(b.dataset.id); const x = x0 && b.dataset.v != null && x0._st ? { ...x0, t: x0._st.base } : x0 || { t: tt.textContent, a: au ? au.textContent : '' }; /* (shelfset1) 권 책등 글 = 세트 이름 */
        J.push({ b, tx, tt, au, t: x.t || '', a: (au && (x.a != null ? auOf(x) : au.textContent)) || '', W: 0, H: 0 }); }
      for (const j of J) if (j.au) { j.au.style.display = ''; j.b.classList.remove('noau'); }
      for (const j of J) if (j.b.classList.contains('cut')) { j.tt.innerHTML = tcy(j.t); if (j.au) j.au.innerHTML = tcy(j.a); j.b.classList.remove('cut'); } /* 줄였던 책만 글을 되돌림 */
      for (const j of J) { j.W = j.tx.clientWidth; j.H = j.tx.clientHeight; }
      /* (shelf8) 실제 두께 비율로 그리면 아주 얇은 책(글 자리가 가장 작은 글자보다 좁음)이 생김 — 실제 얇은 책처럼 책등 글을 감춤(마우스를 올리면 툴팁 · 누르면 펼친 책에 다 보임) */
      for (let q = J.length - 1; q >= 0; q--) { const j = J[q]; const thin = j.W < minF * 1.2 + 2; j.b.classList.toggle('notx', thin); if (thin) { J.splice(q, 1); continue; }
        /* 좁은 책(글 자리 16px 아래): 지은이는 감추고 제목만 · 눕힌 글은 세로로(좁은 폭에 눕힌 줄은 읽히지 않음) — 넓어지면(확대) 되돌림 */
        const nar = j.W < 16; if (nar) { if (j.b.dataset.o0 == null) j.b.dataset.o0 = j.b.dataset.o; j.b.dataset.o = 'v'; if (j.au) { j.au.style.display = 'none'; j.b.classList.add('noau'); j.au = null; j.a = ''; } } else if (j.b.dataset.o0 != null) { j.b.dataset.o = j.b.dataset.o0; delete j.b.dataset.o0; } }
      if (!J.length) return;
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
      /* (shelf6) 여러 줄 글자 겹침 찾기 — 휴대폰 사진(서가 2행)에서 여러 줄 제목의 두 줄이 같은 자리에 겹쳐 그려진 책등('어린 가정부 조앤') · 글 상자 크기 검사는 통과했음
       *  → 글자마다 상자(Range)를 재어 서로 30% 넘게 겹치는 두 글자가 있으면 여러 줄을 버리고 한 줄(+ 줄임 …)로 · 글자 40자까지만 셈(가벼움) */
      const overlapped = (el) => { const B = []; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; const rg = document.createRange();
        while ((n = w.nextNode()) && B.length < 40) { const t = n.data; for (let i = 0; i < t.length && B.length < 40; i++) { if (/\s/.test(t[i])) continue; rg.setStart(n, i); rg.setEnd(n, i + 1); const r = rg.getBoundingClientRect(); if (r.width && r.height) B.push(r); } }
        for (let a = 0; a < B.length; a++) for (let b = a + 1; b < B.length; b++) { const x = Math.min(B[a].right, B[b].right) - Math.max(B[a].left, B[b].left), y = Math.min(B[a].bottom, B[b].bottom) - Math.max(B[a].top, B[b].top);
          if (x > 0 && y > 0 && x * y > 0.3 * Math.min(B[a].width * B[a].height, B[b].width * B[b].height)) return true; } return false; };
      const lay = (pick, hiOf, txt) => { const S1 = one(pick, hiOf, txt); const go2 = S1.filter((q) => q.j.W >= minF * 2.3 && (!q.ok || q.f < 0.5 * est(q.n, q.j.W, q.H, q.hi))); /* (shelf8) 두 줄이 들어갈 폭(가장 작은 글자 두 줄)이 없으면 여러 줄을 시도하지 않음 — 실제 비율로 좁아진 책에서 줄이 엉킴 */ const back = new Map(go2.map((q) => [q, q.f]));
        const S2 = go2.length ? multi(go2, hiOf, txt) : []; const cut = S1.filter((q) => !q.ok && !go2.includes(q)); /* (shelf8) 여러 줄을 시도하지 않은 좁은 책도 안 들어가면 줄임(…) */
        for (const q of S2) if (q.ok && overlapped(q.el)) { q.ok = false; q.ovl = 1; OVL.n++; } /* 겹치면 여러 줄 실패로 셈 */
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
      for (const j of J) { j.b.dataset.ft = Math.round((parseFloat(j.tt.style.fontSize) || 0) * 10) / 10; j.b.dataset.fz = st.z; } sec.dataset.fit = (+sec.dataset.fit || 0) + 1; sec.dataset.ovl = OVL.n; sec.dataset.fitMs = Math.round(performance.now() - t0); /* 시험이 '다시 맞췄나'·걸린 시간 봄 */ }
    /* 지금 책장은 바로 · 양옆 책장은 한가할 때(또는 돌기 직전) — 확대·글꼴이 바뀌면 다시(확대 중엔 0.15초 모아서) */
    /* (shelf4 첫 화면 1초) 지금 화면 안(과 한 화면 아래)까지만 바로 맞추고, 나머지는 한가할 때 60권씩 — 다 맞추면 sec.dataset.fitBusy 지움 */
    let fitTok = 0; const idleF = (f) => (root.requestIdleCallback ? root.requestIdleCallback(f, { timeout: 300 }) : setTimeout(f, 30));
    const fitCase = (c) => { const key = String(st.z) + '|' + (+sec.dataset.fk || 0); if (!c || c.dataset.fz === key) return; c.dataset.fz = key; const tok = ++fitTok; const all = [...c.querySelectorAll('.sp')]; const H = innerHeight || 900, W = innerWidth || 1400;
      const near = [], rest = []; for (const b of all) { const r = b.getBoundingClientRect(); (r.top < H && r.bottom > 0 && r.left < W ? near : rest).push(b); }
      fitSpines(near); if (!rest.length) { delete sec.dataset.fitBusy; return; } sec.dataset.fitBusy = '1';
      const step = () => { if (st.dead || tok !== fitTok || c.dataset.fz !== key) return; fitSpines(rest.splice(0, 60)); if (rest.length) idleF(step); else delete sec.dataset.fitBusy; }; idleF(step); };
    let sideT = 0; const fitSides = () => { clearTimeout(sideT); const idle = root.requestIdleCallback || ((f) => setTimeout(f, 200)); sideT = setTimeout(() => idle(() => { if (!st.dead && !st.busy) [...ring.children].forEach((c) => fitCase(c)); }), 250); };
    let fitT = 0; const refit = (fontChanged) => { if (fontChanged) sec.dataset.fk = (+sec.dataset.fk || 0) + 1; clearTimeout(fitT); fitT = setTimeout(() => { fitT = 0; fitCase(curCase()); fitSides(); }, 150); };
    const FQ = []; let fRun = 0; const FST = { ok: 0, fail: 0, retry: 0, gave: 0 }; /* (shelf7) 글꼴 받기 줄·셈(api.fontState) */
    const cutAll = () => refit();
    try { if (document.fonts && document.fonts.addEventListener) { const fl = () => refit(true); document.fonts.addEventListener('loadingdone', fl); offs.push(() => document.fonts.removeEventListener('loadingdone', fl)); } } catch (e) {}
    /* ── 책등 모양 영구 저장(정범님 11/11): 서버에 정해진 것(x.lk) → 이 기기에 정한 것 → 새로 정함(앞표지 대표색을 기다려야 하면 잠깐 임시 모양 · 저장 안 함) */
    const LKC = new Map(); const LKL = LS.get('lk', {}) || {}; const LQ = []; let lkT = 0; const gen = C0.lookGen || 0;
    const CC = { ok: !!(root.document && root.HTMLCanvasElement), fail: 0, okN: 0, got: new Map(), done: new Set(), q: [], run: 0 };
    function keep(id, code) { if (!C0.lookKeep) return; LKL[id] = code; LQ.push([id, code]); clearTimeout(lkT); lkT = setTimeout(() => { const ks = Object.keys(LKL); if (ks.length > 6000) ks.slice(0, ks.length - 6000).forEach((k) => delete LKL[k]); LS.set('lk', LKL);
      sendLooks(); }, 2500); }
    keep.flush = () => { clearTimeout(lkT); lkT = setTimeout(sendLooks, 2500); };
    /* (shelf7) 클라우드가 '이미 다른 책이 쓴 조합'이라 고쳐 돌려준 모양(fix)은 이 기기에도 바로 바꿔 넣고 책등을 다시 그림 */
    function sendLooks() { const L = LQ.splice(0, LQ.length); if (!L.length || !o.saveLooks) return; for (let i = 0; i < L.length; i += 300) { const r = o.saveLooks(L.slice(i, i + 300), gen); if (r && r.then) r.then(lookFix, () => {}); } }
    function lookFix(j) { const F = j && Array.isArray(j.fix) ? j.fix : []; if (!F.length || st.dead) return; for (const [id, code] of F) { if (typeof code !== 'string' || !B.decode(code)) continue; LKL[id] = code; const x = byId.get(id); if (x) x.lk = code; LKC.delete(id);
        const b = ring && ring.querySelector(`.sp[data-id="${CSS.escape(id)}"]`); if (x && b && b !== popFor) { const c = b.closest('.bqs-case'); const ti = b.tabIndex; b.outerHTML = spineH(x, null, st.sort + c.dataset.i); const n = ring.querySelector(`.sp[data-id="${CSS.escape(id)}"]`); if (n) { n.tabIndex = ti; if (c.classList.contains('cur')) fitSpines([n]); } } }
      try { LS.set('lk', LKL); } catch (e) {} ccFont(); }
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
    const labH = (s) => `<div class="lab"${jkA(s)}${s.tip ? ` title="${esc(s.tip)}"` : ''} role="heading" aria-level="3"><span>${esc(s.lab)}</span><small>${(s.n || 0).toLocaleString('ko-KR')}권</small></div>`;
    /* ── (shelf4 · 정범님 11/12 휴대폰은 형식을 달리) 휴대폰 책장 = 분야 줄마다 가로로 쓸어 넘기는 선반(넷플릭스·쿠팡 홈의 '줄마다 한 주제' 가로 줄) · 표지 보기(알라딘·교보 앱 목록처럼 표지) ↔ 책등 보기 */
    const MOB = () => (root.innerWidth || 1000) < 640; st.mob = MOB(); st.cov = !!LS.get('cov', false);
    const coverH = (x) => { const so = B.saleOf(x); return `<button type="button" class="sp cvb${mdX(x) ? ' md md-' + x.kd : ''}${x.st === 'o' ? ' held' : ''}${isWish(x.id) ? ' wished' : ''}" data-id="${esc(x.id)}" tabindex="-1" aria-label="${esc(x.t)} · ${won(x.p)}"><span class="cvf">${faceImg(x)}${setBadge(x)}${so && so.from === 'p0' ? `<em>−${so.pct}%</em>` : ''}${x.st === 'o' ? '<u>주문중</u>' : ''}</span><b>${esc(x.t)}</b><small>${won(x.p)}</small></button>`; };
    /* (shelf8 · 정범님 11/12 '표지 보기 ↔ 책등 보기를 PC에도') 넓은 화면 표지 보기 = 선반에 표지가 보이게 세운 책 · 키·너비는 실제 판형 mm 비율(책등 보기와 같은 자) */
    const coverS = (x) => { const d = B.dimOf(x, C); const kz = d.H > 297 ? 297 / d.H : 1; /* (shelf3) LP처럼 선반보다 큰 제품은 가로·세로 같은 비율로 줄임 */ const pxmm = (C.rowH - 24) / 297 * kz; const so = B.saleOf(x); const tg = B.tagOf(x); const md = mdX(x);
      return `<button type="button" class="sp cvb cvs${md ? ' md md-' + md : ''}${x.st === 'o' ? ' held' : ''}${isWish(x.id) ? ' wished' : ''}" data-id="${esc(x.id)}" tabindex="-1" aria-label="${esc(x.t)}${x.a ? ' · ' + esc(B.auName(x.a)) : ''} · ${won(x.p)}" style="--cw:${Math.round(d.W * pxmm)};--ch:${Math.min(100, d.H * kz / 2.97).toFixed(1)};--c:${lookOf(x).c}"><span class="cvf">${faceImg(x)}${setBadge(x)}${so && so.from === 'p0' ? `<em>−${so.pct}%</em>` : tg && tg.k !== 'sale' ? `<em class="t-${tg.k}">${esc(tg.t)}</em>` : ''}${x.st === 'o' ? '<u>주문중</u>' : ''}${qnOf(x) ? `<b class="qn">×${qnOf(x)}</b>` : ''}</span></button>`; };
    function caseM(j) { const P = st.P; const N = P.cases.length; const i = B.mod(j, N); const cs = P.cases[i]; const ck = st.sort + i; const rows = []; let cur = null;
      for (const sl of cs.slots) { if (sl.lab) { cur = { h: sl.lab, n: sl.n, L: [], s: sl }; rows.push(cur); continue; } if (!cur) { /* (shelf8) 휴대폰 줄은 이제 접혀 여러 선반으로(옆으로 밀기는 책장 넘기기) — 24권씩 끊지 않음 */ const b0 = cur ? cur.b || cur.h : null; cur = { h: b0 ? b0 + ' (이어서)' : cs.name, b: b0 || cs.name, n: 0, L: [] }; rows.push(cur); } cur.L.push(sl); } /* (shelf5) 이어진 줄도 처음 표찰에 '(이어서)'를 한 번만(전엔 줄마다 덧붙어 「영미소설 (이어서) (이어서)」) */
      return `<div class="bqs-case mcase" data-j="${j}" data-i="${i}" role="region" aria-label="책장 ${i + 1}/${N}: ${esc(cs.name)}" style="transform:${place(j)}"><header class="bqs-top"><b>${esc(cs.name)}</b> <small>${esc(cs.sub || '')} · ${cs.n.toLocaleString('ko-KR')}권</small></header>
        ${rows.map((r, k) => `<section class="mrow"${r.s ? jkA(r.s) : ''} aria-label="${esc(r.h)}"><h3>${esc(r.h)}${r.n ? ` <small>${r.n.toLocaleString('ko-KR')}권</small>` : ''}</h3><div class="mstrip${st.cov ? ' cov' : ''}" role="group">${r.L.map((x) => (st.cov ? coverH(x) : spineX(x, cs, ck))).join('')}</div></section>`).join('')}</div>`; }
    function chipsH() { const ch = $('.bqs-chips'); if (!st.mob || !st.P || st.P.cases.length <= 1 || !st.chipsOpen) { ch.hidden = true; const nm = $('.mp-nm'); if (nm) nm.setAttribute('aria-expanded', 'false'); return; } const N = st.P.cases.length; const i = B.mod(st.j, N); ch.hidden = false; $('.mp-nm').setAttribute('aria-expanded', 'true'); /* (shelf8) 휴대폰: 책장 이름표 줄은 접어 두고 위치 표시를 누르면 펼침 */
      if (ch.dataset.k !== st.sort + N) { ch.innerHTML = st.P.cases.map((c, k) => `<button type="button" role="tab" data-ci="${k}" aria-selected="false">${esc(c.name)}</button>`).join(''); ch.dataset.k = st.sort + N; }
      ch.querySelectorAll('[data-ci]').forEach((b) => { const on = +b.dataset.ci === i; b.setAttribute('aria-selected', String(on)); if (on) b.scrollIntoView({ block: 'nearest', inline: 'center' }); }); }
    function caseH(j) { if (st.mob) return caseM(j); const P = st.P; const N = P.cases.length; const i = B.mod(j, N); const cs = P.cases[i]; const ck = st.sort + i; const W = innerW(); const k = B.bays(W, C, st.z);
      const parts = B.split(cs.slots, k);
      return `<div class="bqs-case" data-j="${j}" data-i="${i}" role="region" aria-roledescription="책장" aria-label="책장 ${i + 1}/${N}: ${esc(cs.name)}" style="transform:${place(j)}">
        <header class="bqs-top"><b>${esc(cs.name)}</b> <small>${esc(cs.sub || '')} · ${cs.n.toLocaleString('ko-KR')}권</small></header>
        <div class="bqs-bays${st.cov ? ' cov' : ''}" style="--k:${k}">${parts.map((ps, b) => `<div class="bqs-bay" role="group" aria-label="${b + 1}번째 칸">${ps.map((s) => (s.lab ? labH(s) : st.cov ? coverS(s) : spineX(s, cs, ck))).join('')}</div>`).join('')}</div>
        <div class="bqs-foot" aria-hidden="true"></div></div>`; }
    const innerW = () => Math.max(260, (st.W || stage.clientWidth) - 24); /* (shelf4) sync가 잰 폭을 씀 — 책장마다 다시 재면 3D 장면 전체를 다시 배치(첫 화면 2초의 원인) */
    /* ── 원형 배치 · 돌리기 */
    let RG = B.ring(1, 1000);
    const DIR = -1; /* (shelf3 · 정범님 11/12) 도는 방향 뒤집음: 다음 책장은 오른쪽에 서 있다가 → · ] · 왼쪽으로 쓸기로 다가옴 */
    const place = (j) => (C.turn3d && !st.mob ? `rotateY(${DIR * j * RG.step}deg) translateZ(${-RG.R}px)` : `translateX(${j * (st.W + 40)}px)`);
    const ringT = (j, pull) => (C.turn3d && !st.mob ? /* (shelf8) 휴대폰은 옆으로 미끄러짐(손가락을 따라옴) */ `translateZ(${RG.R - (pull || 0)}px) rotateY(${-DIR * j * RG.step}deg)` : `translateX(${-j * (st.W + 40)}px) scale(${pull ? 0.94 : 1})`);
    const want = () => { const N = st.P.cases.length; if (N <= 1) return [st.j]; if (N === 2) return [st.j, st.j + 1]; return [st.j - 1, st.j, st.j + 1]; };
    function sync(full) { /* 필요한 책장만 DOM에 */ if (!st.P || st.dead) return; if (OB.el) closeBook(true); if (!st.P.cases.length) { ring.innerHTML = `<div class="bqs-empty">${st.sort === 'pv' ? '앞 몇 쪽 샘플을 모은 책이 아직 없습니다 — 모이는 대로 이 책장에 꽂힙니다' : '꽂을 책이 없습니다'}</div>`; stage.style.height = 'auto'; $('.bqs-nav').hidden = true; return; } /* (shelf8) 샘플 있는 책이 0권일 때 */ st.W = stage.clientWidth; RG = B.ring(st.P.cases.length, st.W); stage.style.perspective = RG.persp + 'px';
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
      MEM[st.sort] = { j: st.j }; LS.set('pos', { s: st.sort, i }); o.onState && o.onState({ s: st.sort, i }); chipsH(); $('.bqs-mbar').hidden = !st.mob; sec.classList.toggle('mob', st.mob); try { document.body.classList.toggle('shelf-mob', st.mob); } catch (e) {} const mp = $('.bqs-mpos'); mp.hidden = !st.mob || N <= 1; if (!mp.hidden) { mp.querySelector('b').textContent = cs.name; mp.querySelector('small').textContent = `${i + 1}/${N}`; mp.querySelector('.mp-dots').innerHTML = Array.from({ length: D }, (_, k) => `<i class="${Math.floor(i * D / N) === k ? 'on' : ''}"></i>`).join(''); }
      try { const hd = document.querySelector('header.top'); if (hd) sec.style.setProperty('--bqs-hdr', hd.offsetHeight + 'px'); } catch (e) {} sec.classList.toggle('jstick', st.mob && !!C.jumpStick); sec.classList.toggle('jwrap', C.jumpMob === 'wrap'); jumpH(); liftOff();
      const cvt = $('.bqs-cvt'); cvt.hidden = st.mob; cvt.setAttribute('aria-pressed', String(st.cov)); cvt.textContent = st.cov ? '📚 책등으로 보기' : '🖼 표지로 보기'; const mv = $('.mb-v'); mv.setAttribute('aria-pressed', String(st.cov)); mv.textContent = st.cov ? '📚 책등' : '🖼 표지'; mv.setAttribute('aria-label', st.cov ? '책등 보기로' : '표지 보기로'); }
    function turn(d) { if (!st.P || st.busy || st.P.cases.length <= 1 || OB.el) return; closePop(); hideTip(); const N = st.P.cases.length; const j0 = st.j, j1 = st.j + d;
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
    /* ══ (shop2 · 정범님 11/13) 🔖 구역 바로 가기 — 정렬이 주제 분류·상품명·가격대(설정 jumpSorts)일 때 서가 위에 구역 링크 줄
     *  누르면 그 구역이 있는 책장(쪽)으로 넘어가 그 표찰 자리로 스크롤 · 내려가며 지금 구역 링크에 불 · 위치 길잡이(‹ 책장 ›)는 그대로
     *  참고(약속 42): 쿠팡·무신사 앱의 가로로 미는 분류 줄 · 교보 매장 안내 표찰 · 휴대폰 주소록의 ㄱㄴㄷ 바로 가기 */
    let JP = null, JL = [];
    function jumpH() { const nv = $('.bqs-jump'); if (!nv) return; if (JP !== st.P) { JP = st.P; JL = B.jumps ? B.jumps(st.P, C) : []; nv.dataset.v = ''; }
      if (!JL || JL.length < 2) { nv.hidden = true; nv.innerHTML = ''; return; } nv.hidden = false; const N = st.P.cases.length;
      if (!nv.dataset.v) { nv.innerHTML = `<span class="jh" aria-hidden="true">바로 가기</span><div class="jls">${JL.map((J) => `<button type="button" class="jl${J.lv ? ' sub' : ''}" data-jk="${esc(J.k)}" data-ci="${J.ci}"${J.tip ? ` title="${esc(J.tip)}"` : ''} aria-label="${esc(J.name)} 구역으로 — 책장 ${J.ci + 1}/${N}${C.jumpN ? ` · ${J.n.toLocaleString('ko-KR')}권` : ''}${J.tip ? ' · ' + esc(J.tip) : ''}">${esc(J.name)}${C.jumpN ? ` <small>${J.n.toLocaleString('ko-KR')}</small>` : ''}</button>`).join('')}</div>`; nv.dataset.v = '1'; }
      const here = B.mod(st.j, N); nv.querySelectorAll('.jl').forEach((b) => b.classList.toggle('far', +b.dataset.ci !== here)); jumpCur(); }
    const stickH = () => { let h = 0; try { const hd = document.querySelector('header.top'); if (hd && getComputedStyle(hd).position !== 'static') h = hd.getBoundingClientRect().bottom; } catch (e) {} if (st.mob && C.jumpStick) { const s0 = $('.bqs-stick'); if (s0) h = Math.max(h, h + s0.offsetHeight); } else if (!st.mob) { const br = $('.bqs-bar'); if (br) h = Math.max(h, h + br.offsetHeight); } return h; };
    function markJ(k) { const nv = $('.bqs-jump'); if (!nv || nv.hidden) return; let on = null; const top = k ? k.split('|')[0] : '';
      nv.querySelectorAll('.jl').forEach((b) => { const me = b.dataset.jk === k; const up = !me && b.dataset.jk === top; b.classList.toggle('on', me || up); if (me) { on = b; b.setAttribute('aria-current', 'location'); } else b.removeAttribute('aria-current'); });
      const box = nv.querySelector('.jls'); if (on && box && box.scrollWidth > box.clientWidth + 2 && on.dataset.jk !== st.jkSeen) { st.jkSeen = on.dataset.jk; box.scrollLeft = Math.max(0, on.offsetLeft - box.clientWidth / 2 + on.offsetWidth / 2); } }
    function jumpCur() { const nv = $('.bqs-jump'); if (!nv || nv.hidden) return; const c = curCase(); if (!c) return; const lim = stickH() + 16; let best = null, bt = -1e9;
      if (st.jkHold && Date.now() < st.jkHold.t) return markJ(st.jkHold.k); /* 바로 가기로 움직이는 동안(부드러운 스크롤)은 누른 링크 그대로 */
      const H = document.documentElement; const atEnd = innerHeight + scrollY >= H.scrollHeight - 4; /* 맨 아래라 더 못 내려가면 화면에 보이는 마지막 표찰 */
      c.querySelectorAll('[data-jk]').forEach((e) => { const t = e.getBoundingClientRect().top; if ((t <= lim || (atEnd && t < innerHeight - 60)) && t >= bt) { bt = t; best = e; } }); if (!best) best = c.querySelector('[data-jk]'); if (!best) return;
      const k2 = best.dataset.jk2; markJ(k2 && nv.querySelector(`.jl[data-jk="${CSS.escape(k2)}"]`) ? k2 : best.dataset.jk); }
    function jumpTo(k) { const J = JL && JL.find((x) => x.k === k); if (!J || !st.P || st.busy) return; closePop(); hideTip(); liftOff(); if (OB.el) closeBook(true); const N = st.P.cases.length; const here = B.mod(st.j, N);
      const fin = () => { const c = curCase(); const sel = k.includes('|') ? `[data-jk2="${CSS.escape(k)}"]` : `[data-jk="${CSS.escape(k)}"]`; const t = c && c.querySelector(sel); if (!t) return; const y = t.getBoundingClientRect().top + scrollY - stickH() - 8;
        window.scrollTo({ top: Math.max(0, y), behavior: RM() ? 'auto' : 'smooth' }); t.classList.add('hit'); setTimeout(() => t.classList.remove('hit'), 1800); st.jkHold = { k, t: Date.now() + (RM() ? 300 : 1200) }; markJ(k); sec.dataset.jumped = k; say(`${J.name} 구역 — 책장 ${J.ci + 1}/${N}`); };
      if (J.ci !== here) { st.j = st.j + (J.ci - here); sync(true); requestAnimationFrame(() => requestAnimationFrame(fin)); } else fin(); }
    on($('.bqs-jump'), 'click', (e) => { const b = e.target.closest('.jl'); if (b) jumpTo(b.dataset.jk); });
    { let jt = 0; on(window, 'scroll', () => { if (jt) return; jt = requestAnimationFrame(() => { jt = 0; if (!st.dead) jumpCur(); }); }, { passive: true }); }
    /* ══ (shop2 · 정범님 11/13) 📱 휴대폰에서도 책이 앞으로 나오게 — 설정 mobPop: sheet(아래 창 · 지금까지) · open(뽑혀 나와 펼침) · lift(첫 누름에 책등이 앞으로 쏙 · 한 번 더 누르면 펼침) */
    let LB = null, LCAP = null;
    function liftOff() { if (LB) { LB.classList.remove('lift'); LB = null; } if (LCAP) { LCAP.remove(); LCAP = null; } }
    function liftPos() { if (!LB || !LCAP) return; if (!LB.isConnected) return liftOff(); const r = (LB.querySelector('.sk') || LB).getBoundingClientRect(); const w = LCAP.offsetWidth, h = LCAP.offsetHeight; let T = r.top - h - 10; if (T < stickH() + 4) T = Math.min(innerHeight - h - 90, r.bottom + 10);
      LCAP.style.left = clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8) + 'px'; LCAP.style.top = T + 'px'; LCAP.style.setProperty('--ax', clamp(r.left + r.width / 2 - clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8), 14, w - 14) + 'px'); LCAP.classList.toggle('below', T > r.top); }
    function liftTap(b) { if (LB === b) { liftOff(); return openBook(b); } liftOff(); const x = byId.get(b.dataset.id); if (!x) return; LB = b; b.classList.add('lift'); setFocus(b);
      LCAP = document.createElement('div'); LCAP.className = 'bqs-lcap'; LCAP.setAttribute('role', 'status'); const so = B.saleOf(x);
      LCAP.innerHTML = `<b>${esc(x.t)}</b><small>${esc(B.auName(x.a) || '')}${x.a ? ' · ' : ''}${so && so.from === 'p0' ? `<s>${won(so.was)}</s> ` : ''}${won(x.p)}${x.q > 1 ? ` · ${x.q}권` : ''}</small><em>한 번 더 누르면 펼쳐 봅니다</em>`; sec.appendChild(LCAP); liftPos(); say(x.t + ' — 한 번 더 누르면 펼쳐 봅니다'); }
    on(window, 'scroll', () => { if (LB) liftPos(); }, { passive: true });
    on(document, 'pointerdown', (e) => { if (LB && !LB.contains(e.target) && !(LCAP && LCAP.contains(e.target))) liftOff(); }, true);
    on(document, 'keydown', (e) => { if (e.key === 'Escape' && LB) liftOff(); });
    const mobTap = (b) => (C.mobPop === 'open' ? openBook(b) : C.mobPop === 'lift' ? liftTap(b) : openSheet(b));

    /* ── 손님 ⚙ 보기(이 기기만) */
    function viewH() { const v = view(); const sel = (k, L, d) => `<select data-v="${k}">${L.map(([a, n]) => `<option value="${a}"${String(v[k] != null ? v[k] : C0[k]) === String(a) ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
      const ck = (k, n) => `<label><input type="checkbox" data-v="${k}"${(v[k] != null ? v[k] : C0[k]) ? ' checked' : ''}> ${esc(n)}</label>`;
      return `<div class="bqs-vg"><label>책장 종류 ${sel('wood', B.CASES)}</label>${st.mob ? `<label>책 누르면 ${sel('mobPop', [['sheet', '아래 정보 창'], ['open', '책이 앞으로 나와 펼쳐짐'], ['lift', '책등이 쏙 나오고 한 번 더 누르면 펼침']])}</label>` : `<label>책등 누르면 ${sel('popMode', [['open', '책이 뽑혀 나와 펼쳐짐'], ['spine', '책등에 바로 단추'], ['bubble', '말풍선 창']])}</label>`}<label>담기 움직임 ${sel('cartAnim', [['rand', '매번 랜덤'], ...B.CART_ANIMS, ['off', '없음']])}</label><label>찜 움직임 ${sel('wishAnim', [['rand', '매번 랜덤'], ...B.WISH_ANIMS, ['off', '없음']])}</label>
        <label>책등 글 ${sel('orient', [['rand', '책마다 랜덤'], ['v', '세로쓰기'], ['h', '가로쓰기(눕힘)']])}</label>${ck('turn3d', '책장 3D로 돌기')}${ck('tip', '마우스 올리면 책 정보')}${ck('fontsOn', '여러 글꼴(끄면 더 가벼움)')}
        <button type="button" class="bqs-vr">가게 기본으로</button></div><p class="bqs-hint">이 기기에만 저장됩니다 · 키보드: ←→ 옆 책 · ↑↓ 위아래 선반 · Enter 담기 창 · [ ] 책장 돌리기 · + − 확대 · Ctrl+휠·두 손가락으로도 확대</p>`; }
    function setView(k, v) { VW = null; const V = { ...view() }; VW = null; if (k == null) { LS.set('view', {}); } else { V[k] = v; LS.set('view', V); } C = B.cfgOf({ ...C0, ...view() }); sec.className = `bqs room-${C.room} wood-${C.wood}`; LKC.clear(); sync(true); $('#bqsView').innerHTML = viewH(); }

    /* ── 글꼴: 그 책장에 쓰인 글자만 받아 별칭(bqf-글꼴-책장)으로 */
    function fontsFor(cEl) { if (!C.fontsOn || !cEl || !root.fetch) return; const ck = st.sort + cEl.dataset.i; const by = new Map();
      cEl.querySelectorAll('.sp:not(.ok)').forEach((b) => { const x = byId.get(b.dataset.id); if (!x) return; const f = lookOf(x).f; by.set(f, (by.get(f) || '') + x.t + (x.a || '')); });
      const jobs = [...by].map(([f, txt]) => () => { const al = `bqf-${f}-${ck}`; if (FONT_CSS.has(al)) { const s = FONT_CSS.get(al); FONT_CSS.delete(al); FONT_CSS.set(al, s); return Promise.resolve(); }
        const src = B.fontSrc && B.fontSrc(f, txt, o.fontApi || root.BQ_API); /* (shelf7) 우리 클라우드 글꼴 — FontFace로 받아 429·실패면 2~8초 뒤 다시(3번까지) */
        if (src && root.FontFace && document.fonts && document.fonts.add) return fontGet(al, src, 0);
        const own = B.fontCss && B.fontCss(f, txt, al, o.fontApi || root.BQ_API); /* (shelf5) 우리 클라우드 글꼴은 CSS를 받지 않고 바로 만듦 */
        return (own ? Promise.resolve(own) : fetch(B.fontUrl(f, txt)).then((r) => (r.ok ? r.text() : ''))).then((css) => { if (!css || st.dead) return; const s = document.createElement('style'); s.dataset.bqf = al; s.textContent = css.replace(/font-family:\s*'[^']+'/g, `font-family:'${al}'`); document.head.appendChild(s); fontKeep(al, s); }).catch(() => {}); });
      FQ.push(...jobs); fontPump(); }
    /* (shelf7 · rel9 휴대폰 확인: 첫 주소·둘째 주소가 함께 429 → 글꼴 6~10개 못 붙음) 글꼴 받기 줄 — 한 번에 2개(넓은 화면 3개)씩 차례로 · 다시 받기는 줄 자리를 잡지 않고 기다렸다가 끝에 다시 섬 */
    function fMax() { return root.matchMedia && root.matchMedia('(min-width: 900px)').matches ? 3 : 2; }
    function fontPump() { while (!st.dead && fRun < fMax() && FQ.length) { const job = FQ.shift(); fRun++; Promise.resolve().then(job).catch(() => {}).then(() => { fRun--; fontPump(); }); } }
    function fontKeep(al, s) { FONT_CSS.set(al, s); while (FONT_CSS.size > 160) { const [k0, s0] = FONT_CSS.entries().next().value; s0.remove(); FONT_CSS.delete(k0); } }
    function fontGet(al, src, n) { if (st.dead || FONT_CSS.has(al)) return Promise.resolve(); const u = src.url + (n ? '&r=' + n : ''); /* 다시 받을 땐 주소 끝을 바꿔 막힌 답(캐시)을 안 씀 · 서버는 r을 안 봄 */
      return fetch(u, { mode: 'cors', credentials: 'omit' }).then((r) => { if (!r.ok) { const e = new Error('font ' + r.status); e.status = r.status; e.wait = +(r.headers.get('Retry-After') || 0) * 1000; throw e; } return r.arrayBuffer(); })
        .then((buf) => { if (st.dead) return; const ff = new FontFace(al, buf, { weight: String(src.wt || 400), style: 'normal', display: 'swap' }); return ff.load().then(() => { if (st.dead) return; document.fonts.add(ff); fontKeep(al, { remove: () => { try { document.fonts.delete(ff); } catch (e) {} } }); FST.ok++; refit(true); }); })
        .catch((e) => { if (st.dead) return; FST.fail++; if (n >= 3 || (e && e.status === 404)) { FST.gave++; return; } FST.retry++; const w = Math.min(8000, Math.max(e && e.wait ? e.wait : 0, 2000 * Math.pow(2, n))) + Math.round(Math.random() * 600); /* 2초 → 4초 → 8초 */
          setTimeout(() => { if (st.dead) return; FQ.push(() => fontGet(al, src, n + 1)); fontPump(); }, w); }); }
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
    function posPop() { if (!popFor || pop.hidden) return; const sk = popFor.querySelector('.sk') || popFor; const tr0 = sk.style.transition; sk.style.transition = 'none'; const r = sk.getBoundingClientRect(); sk.style.transition = tr0; /* (shelf8) 마우스를 올려 커진 채 움직이는 중에 재면 단추가 책등 밖으로 — 끝 자리로 잼 */ const pw = pop.offsetWidth, ph = pop.offsetHeight;
      if (pop.classList.contains('onsp')) { /* (shelf3) 정범님: 단추는 책등 표면 안 — 너비 = 책등 너비 · 좁으면 작은 아이콘만 세로로 · 누른 높이에 🛒(표면 안에서) */
        const w = Math.max(16, r.width); const n = pop.querySelectorAll('.pa > *').length || 3; const g = clamp(w * 0.08, 2, 5); const bh = clamp(Math.min(w * 1.15, 52, (r.height - g * (n + 1)) / n), 14, 52);
        pop.style.width = w + 'px'; pop.style.setProperty('--bh2', bh + 'px'); pop.style.setProperty('--gap', g + 'px'); pop.style.setProperty('--ic', clamp(Math.min(w * 0.56, bh * 0.5), 9, 19) + 'px'); pop.classList.toggle('slim', w < 46 || bh < 34);
        const ph2 = pop.offsetHeight; const pa = pop.querySelector('.pa'); const b0 = pa.firstElementChild; const off = b0 ? b0.offsetTop + b0.offsetHeight / 2 : ph2 / 2; const y = st.popY != null ? st.popY : r.top + r.height / 2;
        let T = ph2 <= r.height ? clamp(y - off, r.top, r.bottom - ph2) : r.top + (r.height - ph2) / 2; T = clamp(T, 4, innerHeight - ph2 - 4); const L = r.left;
        pop.style.left = L + 'px'; pop.style.top = T + 'px'; const cap = pop.querySelector('.pcap'); if (cap) { const cw = cap.offsetWidth; const cl = clamp(L + w / 2 - cw / 2, 8, innerWidth - cw - 8); cap.style.left = (cl - L) + 'px'; const up = r.top - cap.offsetHeight - 8 >= 4; cap.classList.toggle('below', !up); cap.style.setProperty('--cy', (up ? r.top - T : r.bottom - T) + 'px'); } return; }
      let L = clamp(r.left + r.width / 2 - pw / 2, 8, innerWidth - pw - 8); let T = r.top - ph - 10; if (T < 8) T = Math.min(innerHeight - ph - 8, r.bottom + 10);
      pop.style.left = L + 'px'; pop.style.top = T + 'px'; pop.style.setProperty('--ax', clamp(r.left + r.width / 2 - L, 14, pw - 14) + 'px'); pop.classList.toggle('below', T > r.top); }
    function closePop(back) { if (pop.hidden) return; pop.hidden = true; const b = popFor; popFor = null; if (b) { b.classList.remove('out'); if (back) b.focus({ preventScroll: true }); } }
    on(ring, 'click', (e) => { const b = e.target.closest('.sp'); if (!b || st.busy) return; e.preventDefault(); if (st.lpDone) { st.lpDone = false; return; } { const xs = byId.get(b.dataset.id); if (xs && setX(xs) && !(st.mob && C.setMob === 'sheet')) return openSet(b); } /* (shelfset1) 세트 → 한 권씩 빠져 앞에 */ if (st.mob) return mobTap(b); if (obWanted()) return openBook(b); /* (shelf8) 넓은 화면: 책이 뽑혀 나와 펼쳐짐 */ if (popFor === b) return closePop(true); setFocus(b); openPop(b, e.detail ? e.clientY : null); });
    /* ── (shelf4) 휴대폰 아래 시트 — 쿠팡·아마존 앱의 '아래에서 올라오는 상품 시트'처럼: 표지·값·상태 + 큰 단추(담기·찜·자세히 · 48px) · 배경 누름·✕·아래로 쓸어 닫기 */
    const sheet = $('.bqs-sheet'); let shFor = null;
    function openSheet(b) { const x = byId.get(b.dataset.id); if (!x) return; shFor = b; const inC = o.cart && o.cart.has && o.cart.has(x.id); const w = isWish(x.id); const so = B.saleOf(x);
      const cartB = x.st === 'o' ? '<button type="button" class="sb-c" disabled>⏳ 다른 분이 주문 중</button>' : !(o.shop && o.shop.open) ? '<button type="button" class="sb-c" disabled>🛒 문을 연 뒤 담기</button>' : inC ? '<a class="sb-c in" href="#/cart">🛒 담겨 있음 · 장바구니 보기</a>' : '<button type="button" class="sb-c" data-a="cart">🛒 장바구니에 담기</button>';
      sheet.querySelector('.sh-in').innerHTML = `<div class="sh-top">${faceX(x).use === 'art' && C.artOn !== false ? `<span class="sh-im sh-art">${artH(x)}</span>` : x.im || faceX(x).src ? `<img src="${esc(faceX(x).src || x.im)}" alt="" class="sh-im">` : ''}<div class="sh-tx"><b>${esc(x.t)}</b><small>${esc(B.auName(x.a))}${x.pb ? ' · ' + esc(x.pb) : ''}</small><div class="sh-pr">${so && so.from === 'p0' ? `<s>${won(so.was)}</s> ` : ''}<strong>${won(x.p)}</strong>${so && so.from === 'p0' ? ` <em>−${so.pct}%</em>` : ''}${x.lp > x.p ? ` <span class="sh-lp">정가 ${won(x.lp)}</span>` : ''}</div>${x.g ? `<div class="sh-g">상태 <span class="g g-${esc(x.g)}">${esc(x.g)}</span></div>` : ''}${qLine(x, 'sh-q')}</div><button type="button" class="sh-x" data-a="x" aria-label="닫기">✕</button></div>
        <div class="sh-act">${cartB}<button type="button" class="sb-w${w ? ' on' : ''}" data-a="wish" aria-pressed="${w}">${w ? '♥ 찜함' : '♡ 찜'}</button><button type="button" class="sb-o" data-a="open">자세히</button></div>`;
      itemOf(x.id).then((m) => { const P = m && Array.isArray(m.pvs) && !(setX(x) && !C.setPv) ? m.pvs : []; if (!P.length || shFor !== b || sheet.hidden) return; const a2 = sheet.querySelector('.sh-act'); if (a2 && !sheet.querySelector('.sb-pv')) a2.insertAdjacentHTML('afterend', `<button type="button" class="sb-pv" data-a="pv">📖 앞 ${P.length}쪽 샘플 보기 <small>알라딘 미리보기처럼 쪽을 넘겨 봅니다</small></button>`); }); /* (shelf8) 샘플이 있는 책 */
      sheet.hidden = false; sheet.querySelector('.sh-p').style.transform = ''; requestAnimationFrame(() => sheet.classList.add('on')); const f = sheet.querySelector('[data-a="cart"],.sb-w'); if (f) f.focus({ preventScroll: true }); }
    function closeSheet() { if (sheet.hidden) return; sheet.classList.remove('on'); const b = shFor; shFor = null; setTimeout(() => { if (!sheet.classList.contains('on')) sheet.hidden = true; }, RM() ? 0 : 200); if (b && b.isConnected) b.focus({ preventScroll: true }); }
    on(sheet, 'click', (e) => { const a = e.target.closest('[data-a]'); if (!a) return; const b = shFor; const x = b && byId.get(b.dataset.id); const k = a.dataset.a; if (k === 'x') return closeSheet(); if (!x) return;
      if (k === 'open') { closeSheet(); remember(x.id, true); return o.open && o.open(x.id); }
      if (k === 'pv') { closeSheet(); return setTimeout(() => openBook(b, { inside: true }), RM() ? 0 : 220); }
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
    on($('.mp-pv'), 'click', () => turn(-1)); on($('.mp-nx'), 'click', () => turn(1)); on($('.mp-nm'), 'click', () => { st.chipsOpen = !st.chipsOpen; chipsH(); });
    on($('.bqs-cvt'), 'click', () => { st.cov = !st.cov; LS.set('cov', st.cov); sync(true); say(st.cov ? '표지 보기' : '책등 보기'); });
    on($('.bqs-chips'), 'click', (e) => { const b = e.target.closest('[data-ci]'); if (b) { st.chipsOpen = false; go(+b.dataset.ci); window.scrollTo({ top: Math.max(0, stage.getBoundingClientRect().top + scrollY - 120) }); } });
    on($('.bqs-msort'), 'change', (e) => { const s0 = $('.bqs-sort'); s0.value = e.target.value; s0.dispatchEvent(new Event('change')); });
    on($('.mb-v'), 'click', (e) => { st.cov = !st.cov; LS.set('cov', st.cov); e.currentTarget.setAttribute('aria-pressed', String(st.cov)); sync(true); });
    on(pop, 'click', (e) => { const a = e.target.closest('[data-a]'); if (!a) return; if (e.detail > 1) return; /* 책등을 두 번 누른 둘째 누름이 담기로 새지 않게 */ const b = popFor; const x = b && byId.get(b.dataset.id); const k = a.dataset.a;
      if (k === 'x') return closePop(true); if (!x) return; if (k === 'open') { closePop(); return o.open && o.open(x.id); }
      if (k === 'cart') { const why = o.cart.add(x); if (why) { o.toast && o.toast(why); return; } closePop(); flyCart(b, x); say(x.t + ' — 장바구니에 담았습니다'); }
      if (k === 'wish') { const r = B.wishToggle((o.wish && o.wish.get()) || [], x); o.wish.set(r.wish); b.classList.toggle('wished', r.on); b.setAttribute('aria-label', b.getAttribute('aria-label').replace(/ · 찜함$/, '') + (r.on ? ' · 찜함' : '')); closePop(true); badge(); if (r.on) wishFx(b); o.toast && o.toast(r.on ? '♥ 찜 목록에 넣었습니다' : '찜을 뺐습니다'); } });
    on(document, 'keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
    on(document, 'pointerdown', (e) => { if (!pop.hidden && !pop.contains(e.target) && !(popFor && popFor.contains(e.target))) closePop(); }, true);

    /* ══ (shelf8 · 정범님 11/12) 📖 책 뽑기 → 앞으로 나와 펼침(넓은 화면 · 설정 popMode 'open')
     *  ① 누른 책등이 선반에서 살짝 들려 뽑히고(0.38초) ② 화면 가운데로 나와(0.56초) ③ 앞표지·뒤표지가 책등 뒤쪽에서 펴짐(뒤표지 | 책등 | 앞표지 — 실제 mm 비율)
     *  ④ 아래에 책 기본 정보(주제분류·출간일·지은이·옮긴이·쪽수·크기·무게·ISBN)·책소개·목차 요약과 담기·찜·상세 단추 · 바깥 아무 곳(또는 Esc) → 접혀 제자리로 꽂힘
     *  ⑤ 앞 몇 쪽 샘플이 있는 책: 펼친 책을 누르면 뒤집혀 속(펼친 쪽) · 모서리 접힌 귀(또는 ← →)로 쪽 넘김 · 다시 누르면 표지로
     *  ⑥ 상세 페이지로 가기 전에 이 책·스크롤 자리를 적어 둠 → 뒤로가기·Esc로 돌아오면 그 책 자리(o.onState f · sessionStorage bq-shelf-ret)
     *  참고(약속 42): Apple Books 옛 책장의 책 꺼내기 · 알라딘 '미리보기' 쪽 넘김 · 교보 바로드림 책 정보 카드 */
    const OB = { el: null, b: null, x: null, set: null, busy: false, inside: false, k: 0, P: null, info: new Map(), from: 'sp' };
    const itemOf = (id) => { if (OB.info.has(id)) return OB.info.get(id); const p = Promise.resolve(o.item ? o.item(id) : null).catch(() => null); OB.info.set(id, p); if (OB.info.size > 60) OB.info.delete(OB.info.keys().next().value); return p; };
    const obWanted = () => !st.mob && C.popMode === 'open';
    function obGeo(x) { const d = B.dimOf(x, C); const vw = innerWidth || 1280, vh = innerHeight || 800; const maxW = Math.min(vw - 56, 1000), maxH = Math.min(vh * 0.5, 470);
      const s = Math.min(maxW / (2 * d.W + d.D), maxH / d.H); return { d, s, W: Math.round(d.W * s), H: Math.round(d.H * s), D: Math.max(5, Math.round(d.D * s)) }; }
    const dimTxt = (d) => `${d.W}×${d.H}${d.dReal ? '×' + d.D : ''}mm${d.est ? ` <em class="est">판형 추정${d.fmt ? '(' + esc(d.fmt) + ')' : ''} — 분야·쪽수로 어림</em>` : ''}${!d.est && d.dEst ? ' <em class="est">두께는 쪽수로 어림 약 ' + d.D + 'mm</em>' : ''}`;
    /* 뒤표지 그림이 없으면 바탕색 뒤표지(지은이·출판사·바코드 자리)를 그림 */
    const backH = (x, L) => (x.bk ? `<img src="${esc(x.bk)}" alt="뒤표지" decoding="async" fetchpriority="high">` : `<div class="ob-dbk" style="--c:${L.c};--k:${L.k}"><p>${esc(x.t)}</p><small>${esc([B.auName(x.a), x.pb].filter(Boolean).join(' · '))}</small><i class="bc" aria-hidden="true"></i><b>${x.lp ? '정가 ' + won(x.lp) : ''}</b></div>`);
    const frontH = (x, L) => (faceX(x).use === 'cover' || (C.artOn === false && x.im) ? `<img src="${esc(faceX(x).use === 'cover' ? faceX(x).src : x.im)}" alt="앞표지" decoding="async" fetchpriority="high">` : C.artOn !== false ? `<div class="ob-art">${artH(x)}</div>` : `<div class="ob-dfr" style="--c:${L.c};--k:${L.k};--g:${L.ac}"><p>${esc(x.t)}</p><small>${esc(B.auName(x.a))}</small></div>`);
    function obHtml(x, g, L) { const so = B.saleOf(x); const inC = o.cart && o.cart.has && o.cart.has(x.id); const w = isWish(x.id);
      const cartB = x.st === 'o' ? '<button type="button" class="oc-b oc-c" disabled>⏳ 다른 분이 주문 중</button>' : !(o.shop && o.shop.open) ? '<button type="button" class="oc-b oc-c" disabled>🛒 문을 연 뒤 담기</button>' : inC ? '<a class="oc-b oc-c in" href="#/cart">✓ 담겨 있음 · 장바구니</a>' : '<button type="button" class="oc-b oc-c" data-a="cart">🛒 장바구니에 담기</button>';
      return `<div class="ob-bg" aria-hidden="true"></div><div class="ob-sc"><p class="ob-hint">책 바깥 아무 곳이나 누르면 제자리에 꽂힙니다 <kbd>Esc</kbd></p>
        <div class="ob-stage" style="height:${g.H + 26}px"><div class="ob-book" style="width:${2 * g.W + g.D}px;height:${g.H}px">
          <div class="ob-jk"><div class="ob-sp" style="left:${g.W}px;width:${g.D}px"><div class="ob-spf"></div><div class="ob-bk" style="width:${g.W}px">${backH(x, L)}<i class="ob-crease l" aria-hidden="true"></i></div></div>
            <div class="ob-fr" style="left:${g.W + g.D}px;width:${g.W}px">${frontH(x, L)}<i class="ob-crease r" aria-hidden="true"></i></div></div>
          <div class="ob-inn" style="left:${g.D / 2}px;width:${2 * g.W}px" hidden></div></div><div class="ob-tag" hidden></div></div>
        <section class="ob-card" aria-labelledby="obT"><div class="oc-hd"><div class="oc-t"><span class="oc-cat">${esc([x.c, x.c2].filter(Boolean).join(' › ') || '분류 없음')}</span><h2 id="obT">${esc(x.t)}</h2><p class="oc-by">${esc(B.auName(x.a) || '')}${x.a && !mdX(x) ? ' 지음' : ''}<span class="oc-tr"></span>${x.pb ? ' · ' + esc(x.pb) : ''}</p><p class="oc-rv"${x.rv ? '' : ' hidden'}>${x.rv ? rvH(x.rv) : ''}</p></div>
          <div class="oc-buy"><div class="oc-pr">${so && so.from === 'p0' ? `<s>${won(so.was)}</s> <em>−${so.pct}%</em> ` : ''}<strong>${won(x.p)}</strong>${x.lp > x.p ? `<small>정가 ${won(x.lp)}</small>` : ''}</div>${x.g ? `<div class="oc-g">헌책 상태 <b class="g g-${esc(x.g)}">${esc(x.g)}</b></div>` : ''}${qLine(x, 'oc-q')}
            <div class="oc-act">${cartB}<button type="button" class="oc-b oc-w${w ? ' on' : ''}" data-a="wish" aria-pressed="${w}">${w ? '♥ 찜함' : '♡ 찜'}</button><a class="oc-b oc-o" href="#/b/${encodeURIComponent(x.id)}" data-a="open">상세 페이지 →</a></div></div></div>
          <dl class="oc-dl"></dl><div class="oc-tx"></div></section></div><button type="button" class="ob-x" data-a="x" aria-label="닫고 책장에 꽂기">✕</button>`; }
    /* (shelf8 · 리드 11/12) 손님 별점 ★평균(수) — 공개 리뷰가 있을 때만 */
    const rvH = (v) => { const a = Math.round(+v[0] * 10) / 10, n = +v[1] || 0; const w = Math.max(0, Math.min(100, a / 5 * 100)); return `<span class="stars" aria-hidden="true"><i style="width:${w}%"></i></span> <b>${a.toFixed(1)}</b> <small>(${n.toLocaleString('ko-KR')}명)</small>`; };
    function obInfo(x, m) { const el = OB.el; if (!el || OB.x !== x) return; const y = { ...x, ...(m || {}) }; { const rv = (m && Array.isArray(m.rv) && m.rv[1] > 0 && m.rv) || x.rv; const e2 = el.querySelector('.oc-rv'); if (e2) { e2.hidden = !rv; e2.innerHTML = rv ? rvH(rv) : ''; e2.setAttribute('aria-label', rv ? `손님 별점 ${(+rv[0]).toFixed(1)} · ${rv[1]}명` : ''); } } const d = B.dimOf(y, C); const dl = el.querySelector('.oc-dl'); const tr = el.querySelector('.oc-tr'); if (tr && y.tr) tr.textContent = ' · ' + y.tr + ' 옮김';
      const R = [['주제분류', String(y.cp || [y.c, y.c2].filter(Boolean).join(' › ')).replace(/\s*>\s*/g, ' › ')], ['출간일', y.pd ? y.pd.replace('-', '년 ') + '월' : ''], [mdX(y) ? '아티스트' : '지은이', B.auName(y.a)], ['옮긴이', y.tr || ''], ['출판사', y.pb], ['쪽수', y.pg && !mdX(y) ? y.pg.toLocaleString('ko-KR') + '쪽' : ''], ['크기', '#' + dimTxt(d)], ['무게', y.wt ? y.wt.toLocaleString('ko-KR') + 'g' : ''], ['ISBN', y.isbn || '']];
      dl.innerHTML = R.map(([k, v]) => `<div${v ? '' : ' class="no"'}><dt>${k}</dt><dd>${v ? (String(v)[0] === '#' ? String(v).slice(1) : esc(v)) : (m ? '—' : '<i class="ld"></i>')}</dd></div>`).join('');
      const I = (m && m.info) || {}; const tocL = I.toc ? I.toc.split(/\n+/).map((t) => t.trim()).filter(Boolean) : [];
      const sec2 = (h, body, none) => `<section><h3>${h}</h3>${body || `<p class="none">${m ? none : '불러오는 중…'}</p>`}</section>`;
      el.querySelector('.oc-tx').innerHTML = sec2('책소개', I.intro ? `<p class="clamp">${esc(I.intro)}</p>` : '', '책소개를 모으는 중입니다 — 모이면 이 자리에 저절로 보입니다') + sec2('목차', tocL.length ? `<ol class="toc">${tocL.slice(0, 9).map((t) => `<li>${esc(t)}</li>`).join('')}${tocL.length > 9 ? `<li class="more">… 모두 ${tocL.length}줄은 상세 페이지에서</li>` : ''}</ol>` : '', '목차를 모으는 중입니다')
        + (I.pubRev ? sec2('출판사 서평', `<p class="clamp">${esc(I.pubRev)}</p>`) : '') + (I.auIntro ? sec2('지은이 소개', `<p class="clamp">${esc(I.auIntro)}</p>`) : '');
      const P = (m && Array.isArray(m.pvs) && m.pvs) || null; const bk0 = el.querySelector('.ob-book'); const setNo = setX(x) && !C.setPv; /* (shelfset1) 세트는 샘플 페이지 없음이 기본 */ OB.P = P && P.length && bk0 && !setNo ? P : null; if (OB.set && P && P.length && C.setPv) { const tg0 = el.querySelector('.ob-tag'); if (tg0) { tg0.hidden = false; tg0.innerHTML = `<button type="button" class="oc-b" data-a="spv">📖 1권 앞 ${P.length}쪽 샘플 보기</button>`; } } if (OB.P) OB.P.slice(0, 2).forEach((u) => { const im = new Image(); try { im.fetchPriority = 'high'; } catch (e) {} im.src = u; }); /* (shelf8 실제 주소 확인) 책장 그림 수백 장이 줄 서 있어도 펼친 책·샘플 첫 쪽을 먼저 받음 */ const tag = el.querySelector('.ob-tag');
      if (OB.P) { tag.hidden = false; tag.innerHTML = `📖 앞 ${OB.P.length}쪽 샘플 — <b>책을 누르면 뒤집혀 펼쳐집니다</b>`; el.querySelector('.ob-book').classList.add('has-pv'); innH(); if (OB.wantIn && !OB.busy && !OB.inside) { OB.wantIn = false; flipBook(); } } else if (m && !(OB.set && C.setPv && P && P.length)) { tag.hidden = true; } }
    /* 책등 판(가운데) — 선반의 책등을 그대로 복제해 비율대로 키움(글 맞춤을 다시 하지 않게 한 덩어리로) */
    function spineInto(host, b, g) { const sk = b && b.querySelector('.sk'); host.innerHTML = ''; if (!sk) return; const r = sk.getBoundingClientRect(); const w0 = r.width || sk.offsetWidth, h0 = r.height || sk.offsetHeight; if (!w0 || !h0) return;
      const wr = document.createElement('div'); wr.className = b.className.replace(/\b(out|pulled|tilt[lr]|back)\b/g, '') + ' ob-spc'; for (const k of ['d', 'p', 's', 'h', 'o', 'tk', 'fg', 'tp', 'thin']) if (b.dataset[k] != null) wr.dataset[k] = b.dataset[k];
      wr.style.cssText = b.style.cssText; wr.style.width = w0 + 'px'; wr.style.height = h0 + 'px'; const k = g.H / h0; wr.style.transform = `translateX(${(g.D - w0 * k) / 2}px) scale(${k})`; wr.appendChild(sk.cloneNode(true)); host.appendChild(wr); }
    function lockScroll(on) { try { const H = document.documentElement; if (on) { const sb = Math.max(0, innerWidth - H.clientWidth); H.style.paddingRight = sb ? sb + 'px' : ''; H.classList.add('bqs-lock'); } else { H.classList.remove('bqs-lock'); H.style.paddingRight = ''; } } catch (e) {} } /* 뒤 화면 스크롤 막기 — 스크롤 막대 너비만큼 채워 책장 폭이 안 바뀌게(바뀌면 책장을 다시 그려 뽑은 책이 사라짐) */
    function openBook(b, op) { if (OB.busy || !b || !b.isConnected) return; if (OB.el) return closeBook(true); const x = byId.get(b.dataset.id); if (!x) return; if (setX(x) && !(op && op.single)) return openSet(b); /* (shelfset1) */ { const pm = prodMode(x); if (pm) return openProd(b, x, pm); } /* (shelf3) 물건 사진은 사진 자체 · 제품은 제품답게 */ hideTip(); closePop(); OB.wantIn = !!(op && op.inside); /* (휴대폰 시트 '샘플 보기') 펼친 뒤 바로 속으로 */
      const L = lookOf(x); const g = obGeo(x); OB.vw = innerWidth; OB.b = b; OB.x = x; OB.inside = false; OB.k = 0; OB.P = null; OB.from = b.classList.contains('cvb') ? 'cv' : 'sp'; setFocus(b); remember(x.id);
      const el = document.createElement('div'); el.className = 'bqs-ob'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', x.t + ' — 책 보기'); el.innerHTML = obHtml(x, g, L); sec.appendChild(el); OB.el = el; OB.g = g;
      spineInto(el.querySelector('.ob-spf'), OB.from === 'sp' ? b : null, g); if (OB.from === 'cv' || !el.querySelector('.ob-spf').firstChild) el.querySelector('.ob-spf').innerHTML = `<div class="ob-dsp" style="--c:${L.c};--k:${L.k}"><span>${esc(x.t)}</span></div>`;
      obInfo(x, null); itemOf(x.id).then((m) => obInfo(x, m || {})); lockScroll(true); const fx = el.querySelector('.ob-x'); fx.focus({ preventScroll: true });
      const book = el.querySelector('.ob-book'), card = el.querySelector('.ob-card'), sp = el.querySelector('.ob-sp'), fr = el.querySelector('.ob-fr'), bk = el.querySelector('.ob-bk'), bg = el.querySelector('.ob-bg'), hint = el.querySelector('.ob-hint');
      const fold = OB.from === 'cv' ? () => { sp.style.transform = 'rotateY(-90deg)'; bk.style.transform = 'rotateY(-90deg)'; } : () => { fr.style.transform = 'rotateY(90deg)'; bk.style.transform = 'rotateY(-90deg)'; };
      if (RM() || !el.animate) { b.classList.add('pulled'); el.classList.add('on'); sec.dataset.obPhase = 'open'; return; }
      OB.busy = true; fold(); book.style.visibility = 'hidden'; card.style.opacity = '0'; hint.style.opacity = '0'; bg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 520, fill: 'forwards' }); el.classList.add('on');
      const src = (OB.from === 'cv' ? b.querySelector('.cvf') : b.querySelector('.sk')) || b; const r0 = src.getBoundingClientRect(); const tgt = (OB.from === 'cv' ? fr : sp).getBoundingClientRect();
      const gh = document.createElement('div'); gh.className = (OB.from === 'cv' ? '' : b.className.replace(/\b(out|pulled|tilt[lr]|back)\b/g, '') + ' ') + 'bqs-fly ob-gh' + (OB.from === 'cv' ? ' cv' : ''); /* 책등 모양 CSS(.sp …)가 그대로 먹게 */ gh.setAttribute('aria-hidden', 'true'); if (OB.from === 'cv') gh.innerHTML = x.im ? `<img src="${esc(x.im)}" alt="">` : `<span>${esc(x.t)}</span>`; else { const c = src.cloneNode(true); gh.appendChild(c); gh.dataset.d = b.dataset.d; gh.dataset.o = b.dataset.o; gh.dataset.s = b.dataset.s; gh.dataset.h = b.dataset.h; gh.dataset.p = b.dataset.p; gh.style.cssText = b.style.cssText; }
      Object.assign(gh.style, { left: r0.left + 'px', top: r0.top + 'px', width: r0.width + 'px', height: r0.height + 'px', transformOrigin: '0 0', zIndex: 72 }); sec.appendChild(gh); b.classList.add('pulled'); sec.dataset.obPhase = 'pull';
      const lift = -Math.min(r0.height * 0.22, 46); const a1 = gh.animate([{ transform: 'translate(0,0)', filter: 'drop-shadow(0 0 0 rgba(0,0,0,0))' }, { transform: `translate(0,${lift * 0.55}px) rotate(-1.2deg)`, offset: 0.55 }, { transform: `translate(${r0.width * 0.08}px,${lift}px) scale(1.06) rotate(0.6deg)`, filter: 'drop-shadow(0 14px 18px rgba(0,0,0,.45))' }], { duration: 380, easing: 'cubic-bezier(.3,.1,.3,1)', fill: 'forwards' });
      a1.onfinish = () => { if (OB.el !== el) return gh.remove(); sec.dataset.obPhase = 'fly'; const dx = tgt.left - r0.left, dy = tgt.top - r0.top, sx = tgt.width / r0.width, sy = tgt.height / r0.height;
        const a2 = gh.animate([{ transform: `translate(${r0.width * 0.08}px,${lift}px) scale(1.06) rotate(0.6deg)`, filter: 'drop-shadow(0 14px 18px rgba(0,0,0,.45))' }, { transform: `translate(${dx * 0.55}px,${dy * 0.5 - 40}px) scale(${1 + (sx - 1) * 0.6},${1 + (sy - 1) * 0.6}) rotate(-2deg)`, filter: 'drop-shadow(0 30px 30px rgba(0,0,0,.5))', offset: 0.55 }, { transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})`, filter: 'drop-shadow(0 22px 26px rgba(0,0,0,.45))' }], { duration: 560, easing: 'cubic-bezier(.45,.05,.2,1)', fill: 'forwards' });
        a2.onfinish = () => { if (OB.el !== el) return gh.remove(); book.style.visibility = ''; gh.remove(); sec.dataset.obPhase = 'unfold'; const E = 'cubic-bezier(.25,.8,.25,1)';
          const go = (n, k0, k1, dl) => n.animate([{ transform: k0 }, { transform: k1 }], { duration: 720, delay: dl || 0, easing: E, fill: 'forwards' });
          let last; if (OB.from === 'cv') { go(sp, 'rotateY(-90deg)', 'rotateY(0deg)'); last = go(bk, 'rotateY(-90deg)', 'rotateY(0deg)', 140); } else { go(fr, 'rotateY(90deg)', 'rotateY(0deg)'); last = go(bk, 'rotateY(-90deg)', 'rotateY(0deg)', 60); }
          book.animate([{ transform: 'translateZ(60px) rotateX(8deg)' }, { transform: 'translateZ(0) rotateX(0)' }], { duration: 760, easing: E });
          const ca = card.animate([{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, delay: 420, easing: 'ease-out', fill: 'forwards' }); ca.onfinish = () => { card.style.opacity = ''; ca.cancel(); };
          const ha = hint.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 700, fill: 'forwards' }); ha.onfinish = () => { hint.style.opacity = ''; ha.cancel(); };
          last.onfinish = () => { [sp, fr, bk].forEach((n) => { n.style.transform = ''; n.getAnimations().forEach((a) => a.cancel()); }); OB.busy = false; sec.dataset.obPhase = 'open'; say(x.t + ' — 책을 앞으로 꺼냈습니다'); if (OB.wantIn && OB.P) { OB.wantIn = false; flipBook(); } }; }; }; }
    /* ══ (shelf3) 📷 사진 보기 · 📀 제품 열림 — 책 펼침과 같은 틀(.bqs-ob · 정보 카드·담기·찜·상세 단추 그대로)에 무대만 바꿈
     *  photo: 물건 전체 사진이 책장 자리에서 앞으로 나와 크게 보임(표지처럼 자르지 않음)
     *  media: 실제 크기 비율 제품 — CD 케이스 뚜껑이 열리며 디스크가 살짝 · DVD·블루레이 케이스가 펼쳐지며 디스크 · VHS 슬리브에서 테이프 · LP 재킷에서 판이 반쯤 · 움직임 줄이기면 끝 모습 그대로 */
    function prodGeo(x) { const d = B.dimOf(x, C); const vw = innerWidth || 1280, vh = innerHeight || 800; const maxW = Math.min(vw - 40, 760), maxH = Math.min(vh * (st.mob ? 0.4 : 0.5), 430); const open = { cd: 1.9, dvd: 2.05, bd: 2.05, vhs: 1.6, lp: 1.55 }[x.kd] || 1;
      const s = Math.min(maxW / (d.W * open), maxH / d.H); return { d, W: Math.round(d.W * s), H: Math.round(d.H * s), D: Math.max(4, Math.round(d.D * s)) }; }
    function mediaH(x) { const g = prodGeo(x); const kd = x.kd; const F = faceX(x); const face = faceImg(x); const disc = `<i class="dsc" aria-hidden="true"><i class="dl" style="--c:${lookOf(x).c}"></i></i>`;
      const st0 = `--w:${g.W}px;--h:${g.H}px;--d:${g.D}px;--ms:${RM() ? 0 : Math.max(0, +C.mediaMs || 0)}ms`;
      if (kd === 'lp') return `<div class="pm pm-lp" style="${st0}"><div class="vin">${disc}</div><div class="jk">${face}</div></div>`;
      if (kd === 'vhs') return `<div class="pm pm-vhs" style="${st0}"><div class="tape"><i class="rl l"></i><i class="rl r"></i><span>${esc(x.t)}</span></div><div class="slv">${face}<i class="op"></i></div></div>`;
      return `<div class="pm pm-${kd}" style="${st0}"><div class="cs"><div class="in">${disc}</div><div class="lid"><div class="lf">${face}</div><div class="lb"></div></div></div></div>`; } /* cd·dvd·bd: 왼쪽 경첩으로 뚜껑이 열림 */
    function openProd(b, x, mode) { const L = lookOf(x); hideTip(); closePop(); OB.wantIn = false; OB.vw = innerWidth; OB.b = b; OB.x = x; OB.inside = false; OB.k = 0; OB.P = null; OB.pv = mode; OB.from = b.classList.contains('cvb') ? 'cv' : 'sp'; setFocus(b); remember(x.id);
      const el = document.createElement('div'); el.className = 'bqs-ob bqs-pvw pv-' + mode + (mdX(x) ? ' md-' + x.kd : ''); el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', x.t + (mode === 'photo' ? ' — 실물 사진' : ' — ' + (KD_N[x.kd] || '제품') + ' 보기'));
      el.innerHTML = obHtml(x, obGeo(x), L); const F = faceX(x);
      const stage = mode === 'photo' ? `<figure class="pv-ph"><img src="${esc(F.src || x.im)}" alt="${esc(x.t)} 실물 사진" decoding="async" fetchpriority="high"><figcaption>📷 실물 사진 — 표지 그림이 아니라 ${mdX(x) ? '제품' : '책'} 전체 모습입니다</figcaption></figure>` : mediaH(x);
      const stg = el.querySelector('.ob-stage'); if (stg) stg.outerHTML = `<div class="pv-stage">${stage}</div><div class="ob-tag" hidden></div>`; /* 정보 칸 자리(obInfo가 씀) */ const hint = el.querySelector('.ob-hint'); if (hint) hint.innerHTML = '바깥 아무 곳이나 누르면 제자리에 놓입니다 <kbd>Esc</kbd>';
      sec.appendChild(el); OB.el = el; OB.g = null; obInfo(x, null); itemOf(x.id).then((m) => obInfo(x, m || {})); lockScroll(true); b.classList.add('pulled'); sec.dataset.obPhase = 'open'; sec.dataset.pv = mode + (mdX(x) ? ':' + x.kd : '');
      el.querySelector('.ob-x').focus({ preventScroll: true }); el.classList.add('on');
      if (RM() || !el.animate) { el.classList.add('go'); return say(x.t + (mode === 'photo' ? ' — 실물 사진을 앞으로 꺼냈습니다' : ' — 제품을 열었습니다')); }
      const r0 = b.getBoundingClientRect(); const pv = el.querySelector('.pv-stage > *'); const r1 = pv.getBoundingClientRect(); const sx = r0.width / Math.max(1, r1.width), sy = r0.height / Math.max(1, r1.height);
      el.querySelector('.ob-bg').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, fill: 'forwards' });
      const a = pv.animate([{ transform: `translate(${r0.left - r1.left}px,${r0.top - r1.top}px) scale(${sx},${sy})`, transformOrigin: '0 0', opacity: 0.6 }, { transform: 'none', transformOrigin: '0 0', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.3,.1,.2,1)' });
      OB.busy = true; a.onfinish = () => { OB.busy = false; if (OB.el !== el) return; requestAnimationFrame(() => el.classList.add('go')); say(x.t + (mode === 'photo' ? ' — 실물 사진을 앞으로 꺼냈습니다' : ' — 제품을 열었습니다')); }; }
    /* ══ (shelfset1 · 정범님 11/14 00:29) 📚 세트 꺼내기 — 누르면 1권부터 한 권씩 기차처럼 연달아 빠르게 빠져 앞에 차곡차곡 쌓임 · 닫으면 역순(마지막 권부터)으로 제자리
     *  모양(설정 setAnim): stack 쌓임(기본) · fan 부채꼴 · row 나란히 · lean 비스듬히 기대어 · one 1권만 크게 앞으로 + 나머지 뒤에 비스듬히 · off 바로 끝 모습
     *  움직임은 transform·opacity만(Web Animations · 끝 모습 fill) · 권 그림자(ss-v)는 무대(.ss-stage) 안 absolute — 정보 창을 밀어 내려도 같이 움직임
     *  세트는 샘플 페이지 없음이 기본(setPv 켜면 「1권 샘플 보기」 단추) · 담기·찜·상세 단추는 세트 한 상품 그대로 · 표지 모드에서는 표지 자리에서 권들이 나옴
     *  참고(약속 42): 교보·알라딘 전집 매대(권 번호 띠가 같은 자리) · 츠타야 평대 쌓기 · Apple Books 책 꺼내기 */
    const SET_M = ['stack', 'fan', 'row', 'lean', 'one'];
    const rot = (a, u, v) => { const r = a * Math.PI / 180, c = Math.cos(r), s0 = Math.sin(r); return [u * c - v * s0, u * s0 + v * c]; };
    /* 끝 자리 — [{ X, Y(무대 안에서 그림 왼쪽 위가 갈 곳), a(도), s(배), z }] · 기준점(px,py · 책 안)이 T로 가게 X,Y를 셈 */
    function setLay(mode, D, W, H) { const n = D.length; const hM = Math.max(...D.map((d) => d.h)), wS = D.reduce((a, d) => a + d.w, 0); const big = +C.setBig || 2.6; const pad = +C.setPad || 0; const R0 = B.rng(B.hash('setjit' + n));
      const at = (d, a, s, px, py, tx, ty, z) => { const [u, v] = rot(a, px * s, py * s); return { X: tx - u, Y: ty - v, a, s, z }; };
      if (mode === 'fan') { const F = +C.setFan || 80; let s = Math.min(H * 0.9 / hM, big); const half = (F / 2) * Math.PI / 180; s = Math.min(s, (W * 0.94) / (2 * hM * Math.sin(Math.min(half, Math.PI / 2)) + (D[0].w || 10))); return D.map((d, i) => at(d, n > 1 ? -F / 2 + (F * i) / (n - 1) : 0, s, d.w / 2, d.h, W / 2, H - 4, i + 1)); }
      if (mode === 'row') { const s = Math.min(H * 0.9 / hM, (W * 0.94 - pad * (n - 1)) / Math.max(1, wS), big); const tot = wS * s + pad * (n - 1); let x0 = (W - tot) / 2; return D.map((d, i) => { const r = at(d, 0, s, 0, d.h, x0, H - 4, i + 1); x0 += d.w * s + pad; return r; }); }
      if (mode === 'lean') { const t = +C.setTilt || 12; const ct = Math.cos(t * Math.PI / 180), st0 = Math.sin(t * Math.PI / 180); let s = Math.min(H * 0.9 / (hM * ct), big); const span = (s0) => wS * s0 / ct + pad * (n - 1) + hM * s0 * st0; if (span(s) > W * 0.94) s = s * (W * 0.94) / span(s);
        let bx = (W - span(s)) / 2 + hM * s * st0; return D.map((d, i) => { const r = at(d, -t, s, 0, d.h, bx, H - 4, i + 1); bx += d.w * s / ct + pad; return r; }); }
      if (mode === 'one') { const d0 = D[0]; const s1 = Math.min(H * 0.94 / d0.h, big * 1.15); const t = +C.setTilt || 12; const R = D.slice(1); const s2 = s1 * 0.62; const ct = Math.cos(t * Math.PI / 180), st0 = Math.sin(t * Math.PI / 180);
        const wR = R.reduce((a, d) => a + d.w, 0); let k = 1; const room = W / 2 - d0.w * s1 / 2 - 14; const need = (wR * s2) / ct + pad * Math.max(0, R.length - 1) + hM * s2 * st0; if (need > room * 2) k = (room * 2) / need;
        const out = [at(d0, 0, s1, d0.w / 2, d0.h, W / 2, H - 2, n + 5)]; const L = [], Rt = []; R.forEach((d, i) => (i % 2 ? L : Rt).push([d, i + 1]));
        let bx = W / 2 + d0.w * s1 / 2 + 10; for (const [d, i] of Rt) { out[i] = at(d, t, s2 * k, 0, d.h, bx, H - 14, n - i); bx += (d.w * s2 * k) / ct + pad; }
        let ex = W / 2 - d0.w * s1 / 2 - 10; for (const [d, i] of L) { out[i] = at(d, -t, s2 * k, d.w, d.h, ex, H - 14, n - i); ex -= (d.w * s2 * k) / ct + pad; } return out; }
      /* stack — 책등이 앞을 보게 눕혀(−90°) 아래에서 위로 · 1권이 맨 아래 */ const s = Math.max(0.5, Math.min((W * 0.8) / hM, (H * 0.92) / Math.max(1, wS), big)); const J = +C.setJit || 0; let cum = 0;
      return D.map((d, i) => { const a = -90 + (R0() - 0.5) * 2 * J; const X = (W - d.h * s) / 2 + (R0() - 0.5) * 2 * Math.min(8, J * 3); const r = { X, Y: H - 6 - cum, a, s, z: i + 1 }; cum += d.w * s * 0.985; return r; }); }
    const tfm = (dx, dy, a, s) => `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) rotate(${a.toFixed(2)}deg) scale(${s.toFixed(4)})`;
    function openSet(b, op) { if (OB.busy || !b || !b.isConnected) return; if (OB.el) return closeBook(true); const x = byId.get(b.dataset.id); const S = setX(x); if (!S) return openBook(b, { single: 1 });
      const vs = volsOf(x); hideTip(); closePop(); liftOff(); if (!sheet.hidden) closeSheet(); const L = lookOf(x); OB.wantIn = false; OB.vw = innerWidth; OB.b = b; OB.x = x; OB.inside = false; OB.k = 0; OB.P = null; OB.pv = null; OB.from = b.classList.contains('cvb') ? 'cv' : 'sp';
      const mode = C.setAnim === 'off' || RM() ? 'off' : SET_M.includes(C.setAnim) ? C.setAnim : 'stack'; const lay = mode === 'off' ? (SET_M.includes(C.setAnim) ? C.setAnim : 'stack') : mode; setFocus(b); remember(x.id);
      const el = document.createElement('div'); el.className = 'bqs-ob bqs-sset ss-' + lay; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', `${S.base} — 전 ${S.n}권 세트 꺼내 보기`); el.innerHTML = obHtml(x, obGeo(x), L);
      const vh = innerHeight || 800, vw = innerWidth || 1280; const H = Math.round(st.mob ? clamp(vh * 0.4, 220, 360) : clamp(vh * 0.46, 260, 430));
      const stg = el.querySelector('.ob-stage'); if (stg) stg.outerHTML = `<div class="ss-stage" style="height:${H}px"><div class="ob-tag" hidden></div></div>`;
      const hint = el.querySelector('.ob-hint'); if (hint) hint.innerHTML = `바깥 아무 곳이나 누르면 한 권씩 ${C.setBack === 'same' ? '나온 차례대로' : C.setBack === 'all' ? '한꺼번에' : '역순으로'} 제자리에 꽂힙니다 <kbd>Esc</kbd>`;
      const miss = S.v.length && S.v[S.v.length - 1] - S.v[0] + 1 !== S.n; const by = el.querySelector('.oc-by'); if (by) by.insertAdjacentHTML('afterend', `<p class="oc-set">📚 <b>전 ${S.n}권 세트</b> · ${S.v[0]}~${S.v[S.v.length - 1]}권${miss ? ' (빠진 권 있음 — 제목 참고)' : ''} · 한 번에 모두 담깁니다${faceX(x).use === 'photo' && x.im ? ' · <button type="button" class="oc-ph" data-a="sph">📷 실물 사진</button>' : ''}</p>`);
      sec.appendChild(el); OB.el = el; OB.g = null; obInfo(x, null); itemOf(x.id).then((m) => obInfo(x, m || {})); lockScroll(true); el.classList.add('on'); sec.dataset.set = lay + ':' + S.n; sec.dataset.obPhase = 'pull';
      el.querySelector('.ob-x').focus({ preventScroll: true }); const stage = el.querySelector('.ss-stage'); const sr = stage.getBoundingClientRect(); const W = sr.width || Math.min(vw - 32, 980);
      const grp = OB.from === 'sp' ? b.closest('.bqs-set') : null; const srcs = grp ? [...grp.querySelectorAll('.sp.sv')] : []; const cr = OB.from === 'cv' ? (b.querySelector('.cvf') || b).getBoundingClientRect() : null; const ck = st.sort + ((b.closest('.bqs-case') || { dataset: { i: 0 } }).dataset.i);
      const G = vs.map((V, i) => { const src = srcs[i] || null; let g, r0;
        if (src) { const sk = src.querySelector('.sk'); r0 = sk.getBoundingClientRect(); g = document.createElement('div'); g.className = src.className.replace(/\b(out|pulled|tilt[lr]|back|lift)\b/g, '') + ' ss-v'; for (const k in src.dataset) g.dataset[k] = src.dataset[k]; g.style.cssText = src.style.cssText; g.appendChild(sk.cloneNode(true)); }
        else { const tmp = document.createElement('div'); tmp.innerHTML = spineH(x, null, ck, V); const bt = tmp.firstElementChild; g = document.createElement('div'); g.className = bt.className + ' ss-v'; for (const k in bt.dataset) g.dataset[k] = bt.dataset[k]; g.style.cssText = bt.style.cssText; const sk = bt.querySelector('.sk'); if (sk) g.appendChild(sk);
          const w = Math.max(3, V.L.w * st.z), h = Math.max(30, (cr ? cr.height : 160) * 0.96); r0 = { left: (cr ? cr.left + cr.width / 2 : vw / 2) - w / 2 + (i - (vs.length - 1) / 2) * 0.6, top: cr ? cr.top + 2 : vh / 2, width: w, height: h }; }
        g.setAttribute('aria-hidden', 'true'); const l0 = r0.left - sr.left, t0 = r0.top - sr.top; Object.assign(g.style, { left: l0 + 'px', top: t0 + 'px', width: r0.width + 'px', height: r0.height + 'px', transformOrigin: '0 0', margin: '0' }); stage.appendChild(g); return { g, src, l0, t0, w: r0.width, h: r0.height, V }; });
      if (OB.from === 'cv') b.classList.add('pulled'); for (const q of G) if (q.src) q.src.classList.add('pulled'); /* 그림자가 제자리를 덮고 있어 바로 비워도 같아 보임 */
      const F = setLay(lay, G.map((q) => ({ w: q.w, h: q.h })), W, H);
      /* 그림자 권은 '앞에 나온 크기'로 만들고(글자를 그 크기로 다시 맞춰 또렷하게 · 얇은 권도 제목이 보임) 책장 크기로 줄여(scale 1/k) 출발 */
      G.forEach((q, i) => { const f = F[i]; const k = Math.max(0.2, f.s); q.f = f; q.k = k; q.g.classList.remove('notx'); Object.assign(q.g.style, { width: q.w * k + 'px', height: q.h * k + 'px' }); q.g.style.setProperty('--bw', String((q.w * k) / (st.z || 1))); q.g.style.zIndex = String(f.z || i + 1);
        q.g.style.transform = tfm(0, 0, 0, 1 / k); q.fx = tfm(f.X - q.l0, f.Y - q.t0, f.a, 1); });
      try { fitSpines(G.map((q) => q.g)); } catch (e) {}
      OB.set = { S, G, mode: lay, H, sr0: sr }; const card = el.querySelector('.ob-card'), bg = el.querySelector('.ob-bg');
      const fin = () => { if (OB.el !== el) return; OB.busy = false; sec.dataset.obPhase = 'open'; say(`${S.base} 전 ${S.n}권 — 한 권씩 꺼내 ${lay === 'stack' ? '앞에 쌓았습니다' : lay === 'fan' ? '부채꼴로 펼쳤습니다' : lay === 'one' ? '1권을 앞으로 꺼냈습니다' : '앞에 세웠습니다'}`); };
      if (mode === 'off' || !el.animate) { for (const q of G) q.g.style.transform = q.fx; return fin(); }
      OB.busy = true; const gap = Math.max(0, +C.setGap || 0), ms = Math.max(80, +C.setMs || 460); const n = G.length; const cov = OB.from === 'cv';
      bg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, fill: 'forwards' }); card.style.opacity = '0';
      let left = n; G.forEach((q, i) => { const lift = Math.min(q.h * 0.18, 34); const f = q.f; const a1 = f.a * 0.12;
        const k = q.k; const K = cov ? [{ transform: tfm(0, 0, 0, 0.7 / k), opacity: 0 }, { transform: tfm(0, -lift, a1, 1 / k), opacity: 1, offset: 0.2 }, { transform: q.fx, opacity: 1 }] : [{ transform: tfm(0, 0, 0, 1 / k) }, { transform: tfm(q.w * 0.06, -lift, a1, 1.04 / k), offset: 0.22 }, { transform: q.fx }];
        const a = q.g.animate(K, { duration: ms, delay: i * gap, easing: 'cubic-bezier(.3,.1,.2,1)', fill: 'both' }); q.a = a; a.onfinish = () => { if (--left === 0) fin(); }; });
      const ca = card.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 360, delay: Math.min(1400, (n - 1) * gap + ms * 0.6), easing: 'ease-out', fill: 'forwards' }); ca.onfinish = () => { card.style.opacity = ''; ca.cancel(); }; }
    function closeSet(now) { const el = OB.el, Z = OB.set; if (!el || !Z) return; if (Z.closing && !now) return; Z.closing = true; /* 꺼내는 중에 닫아도 그 자리에서 되돌아감 */ const b = OB.b, x = OB.x; const cov = OB.from === 'cv';
      const done = () => { for (const q of Z.G) { if (q.src) q.src.classList.remove('pulled'); } if (b) b.classList.remove('pulled'); el.remove(); if (OB.el === el) { OB.el = null; OB.b = null; OB.x = null; OB.busy = false; OB.set = null; } delete sec.dataset.set; lockScroll(false); sec.dataset.obPhase = 'shelved'; if (b && b.isConnected) b.focus({ preventScroll: true }); };
      for (const q of Z.G) { q.now = q.fx; if (q.a) { try { q.a.commitStyles(); q.now = q.g.style.transform || q.fx; } catch (e) { q.g.style.transform = q.fx; } q.a.cancel(); } }
      if (now || !el.animate || Z.mode === 'off' || RM() || !b || !b.isConnected) return done();
      OB.busy = true; sec.dataset.obPhase = 'return'; const stage = el.querySelector('.ss-stage'); const sr = stage.getBoundingClientRect(); const card = el.querySelector('.ob-card'), bg = el.querySelector('.ob-bg'), hint = el.querySelector('.ob-hint');
      card.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(14px)' }], { duration: 180, fill: 'forwards' }); if (hint) hint.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
      const n = Z.G.length; const gap = C.setBack === 'all' ? 0 : Math.max(0, +C.setGap || 0), ms = Math.max(80, (+C.setMs || 460) * 0.85); const order = Z.G.map((q, i) => i); if (C.setBack !== 'same') order.reverse(); /* 역순 — 마지막에 나온 권(맨 위)부터 */
      const cr = cov ? (b.querySelector('.cvf') || b).getBoundingClientRect() : null; let left = n; const tot = (n - 1) * gap + ms;
      bg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: Math.min(900, tot), delay: Math.max(0, tot - 900), fill: 'forwards' });
      order.forEach((i, k) => { const q = Z.G[i]; let tx = 0, ty = 0, sc = 1, op = 1; if (q.src && q.src.isConnected) { const r = q.src.querySelector('.sk').getBoundingClientRect(); tx = r.left - sr.left - q.l0; ty = r.top - sr.top - q.t0; } else if (cr) { tx = cr.left + cr.width / 2 - q.w / 2 - sr.left - q.l0; ty = cr.top - sr.top - q.t0; sc = 0.7; op = 0; } else { op = 0; }
        q.g.style.zIndex = String(n * 2 - k); const lift = Math.min(q.h * 0.16, 30);
        const a = q.g.animate([{ transform: q.now, opacity: 1 }, { transform: tfm(tx + q.w * 0.05, ty - lift, q.f.a * 0.1, 1.03 / q.k), opacity: 1, offset: 0.78 }, { transform: tfm(tx, ty, 0, sc / q.k), opacity: op }], { duration: ms, delay: k * gap, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' });
        a.onfinish = () => { if (q.src) { q.src.classList.remove('pulled'); const sk = q.src.querySelector('.sk'); if (sk && sk.animate) sk.animate([{ transform: 'translateY(-2px)' }, { transform: 'translateY(0)' }], { duration: 160, easing: 'ease-out' }); } q.g.style.visibility = 'hidden'; if (--left === 0) { done(); say((x ? (x._st ? x._st.base : x.t) : '세트') + ' — 한 권씩 제자리에 꽂았습니다'); } }; }); }
    function closeBook(now) { if (OB.set) return closeSet(now); /* (shelfset1) */ const el = OB.el; if (!el || (OB.busy && !now)) return; const b = OB.b, x = OB.x; const done = () => { el.remove(); if (OB.el === el) { OB.el = null; OB.b = null; OB.x = null; OB.busy = false; } OB.pv = null; if (sec.dataset.pv) delete sec.dataset.pv; if (b) { b.classList.remove('pulled'); if (b.isConnected) b.focus({ preventScroll: true }); } lockScroll(false); sec.dataset.obPhase = 'shelved'; };
      if (OB.pv) { if (now || RM() || !el.animate) return done(); OB.busy = true; el.classList.remove('go'); el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'forwards' }).onfinish = done; return; } /* (shelf3) 사진·제품 보기는 흐려지며 닫힘 */ if (now || RM() || !el.animate || !b || !b.isConnected) return done(); OB.busy = true; sec.dataset.obPhase = 'fold';
      const book = el.querySelector('.ob-book'), card = el.querySelector('.ob-card'), sp = el.querySelector('.ob-sp'), fr = el.querySelector('.ob-fr'), bk = el.querySelector('.ob-bk'), bg = el.querySelector('.ob-bg'), hint = el.querySelector('.ob-hint'); const E = 'cubic-bezier(.5,0,.75,.4)';
      const fin1 = () => { const cv = OB.from === 'cv'; const s0 = (cv ? fr : sp).getBoundingClientRect(); const src = (cv ? b.querySelector('.cvf') : b.querySelector('.sk')) || b; b.classList.remove('pulled'); const r1 = src.getBoundingClientRect(); b.classList.add('pulled');
        const gh = document.createElement('div'); gh.className = (cv ? '' : b.className.replace(/\b(out|pulled|tilt[lr]|back)\b/g, '') + ' ') + 'bqs-fly ob-gh' + (cv ? ' cv' : ''); gh.setAttribute('aria-hidden', 'true'); if (cv) gh.innerHTML = x.im ? `<img src="${esc(x.im)}" alt="">` : `<span>${esc(x.t)}</span>`; else { gh.appendChild(src.cloneNode(true)); for (const k of ['d', 'o', 's', 'h', 'p']) gh.dataset[k] = b.dataset[k]; gh.style.cssText = b.style.cssText; }
        Object.assign(gh.style, { left: r1.left + 'px', top: r1.top + 'px', width: r1.width + 'px', height: r1.height + 'px', transformOrigin: '0 0', zIndex: 72 }); sec.appendChild(gh); book.style.visibility = 'hidden'; sec.dataset.obPhase = 'return';
        const dx = s0.left - r1.left, dy = s0.top - r1.top, sx = s0.width / r1.width, sy = s0.height / r1.height; const up = -Math.min(r1.height * 0.2, 40);
        bg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 640, fill: 'forwards' });
        const a = gh.animate([{ transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})`, filter: 'drop-shadow(0 22px 26px rgba(0,0,0,.45))' }, { transform: `translate(${dx * 0.4}px,${dy * 0.5 - 40}px) scale(${1 + (sx - 1) * 0.35},${1 + (sy - 1) * 0.35}) rotate(2deg)`, offset: 0.5 }, { transform: `translate(0,${up}px) rotate(0)`, filter: 'drop-shadow(0 10px 12px rgba(0,0,0,.4))', offset: 0.78 }, { transform: 'translate(0,0)', filter: 'drop-shadow(0 0 0 rgba(0,0,0,0))', easing: 'cubic-bezier(.3,1.5,.6,1)' }], { duration: 760, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' });
        a.onfinish = () => { gh.remove(); done(); const sk = b.querySelector('.sk, .cvf'); if (sk && sk.animate) sk.animate([{ transform: 'translateY(-2px)' }, { transform: 'translateY(1px)' }, { transform: 'translateY(0)' }], { duration: 220, easing: 'ease-out' }); say((x ? x.t : '책') + ' — 제자리에 꽂았습니다'); }; };
      card.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(14px)' }], { duration: 200, fill: 'forwards' }); hint.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }); const tagE = el.querySelector('.ob-tag'); if (tagE) tagE.hidden = true;
      const unflip = OB.inside ? new Promise((r) => { book.classList.remove('flip'); OB.inside = false; setTimeout(r, 620); }) : Promise.resolve();
      unflip.then(() => { let last; const go = (n, k0, k1, dl) => n.animate([{ transform: k0 }, { transform: k1 }], { duration: 420, delay: dl || 0, easing: E, fill: 'forwards' });
        if (OB.from === 'cv') { go(bk, 'rotateY(0deg)', 'rotateY(-90deg)'); last = go(sp, 'rotateY(0deg)', 'rotateY(-90deg)', 80); } else { go(bk, 'rotateY(0deg)', 'rotateY(-90deg)'); last = go(fr, 'rotateY(0deg)', 'rotateY(90deg)', 40); }
        last.onfinish = fin1; }); }
    /* 속(펼친 쪽) — 칸: [앞 면지, 샘플 1쪽, 2쪽 …, 뒤 면지] · 펼친 자리 k = 왼쪽 칸 2k · 오른쪽 칸 2k+1 */
    const slot = (i) => { const P = OB.P || []; if (i <= 0) return { e: 'f' }; if (i > P.length) return { e: 'b' }; return { u: P[i - 1], n: i }; };
    const pageH = (q, side) => (q.u ? `<img src="${esc(q.u)}" alt="샘플 ${q.n}쪽" decoding="async" fetchpriority="high"><small class="pn">${q.n}</small>` : q.e === 'f' ? `<div class="ep"><b>북스퀸</b><span>앞 ${(OB.P || []).length}쪽 샘플</span><small>모서리 접힌 귀를 누르면 쪽이 넘어갑니다</small></div>` : `<div class="ep"><span>샘플은 여기까지</span><a href="#/b/${encodeURIComponent(OB.x ? OB.x.id : '')}" data-a="open">상세 페이지 →</a></div>`) + `<i class="ear ${side}" data-ear="${side === 'r' ? 1 : -1}" role="button" tabindex="0" aria-label="${side === 'r' ? '다음 쪽' : '앞 쪽'}"></i>`;
    const kMax = () => Math.ceil(((OB.P || []).length + 2) / 2) - 1;
    function innH() { const el = OB.el; if (!el || !OB.P) return; const inn = el.querySelector('.ob-inn'); const k = OB.k; inn.hidden = false;
      inn.innerHTML = `<div class="pg l${k === 0 ? ' ep0' : ''}">${pageH(slot(2 * k), 'l')}</div><div class="pg r${2 * k + 1 > OB.P.length ? ' ep0' : ''}">${pageH(slot(2 * k + 1), 'r')}</div><i class="gut" aria-hidden="true"></i><div class="pgn" aria-live="polite">${k + 1} / ${kMax() + 1}</div>`;
      inn.querySelector('.pg.l .ear').hidden = k === 0; inn.querySelector('.pg.r .ear').hidden = k >= kMax(); [2 * k + 2, 2 * k + 3].forEach((i) => { const q = slot(i); if (q.u) { const im = new Image(); try { im.fetchPriority = 'high'; } catch (e) {} im.src = q.u; } }); const c = el.querySelector('.ob-tag .pgc'); if (c) c.textContent = `${k + 1} / ${kMax() + 1}`; }
    function flipBook() { const el = OB.el; if (!el || !OB.P || OB.busy) return; const book = el.querySelector('.ob-book'); OB.inside = !OB.inside; book.classList.toggle('flip', OB.inside); sec.dataset.obSide = OB.inside ? 'in' : 'out';
      const tag = el.querySelector('.ob-tag'); if (tag) tag.innerHTML = OB.inside ? `<span class="pgc">${OB.k + 1} / ${kMax() + 1}</span> 모서리 접힌 귀(또는 ← →)로 쪽 넘기기 · <b>책을 누르면 다시 표지로</b>` : `📖 앞 ${OB.P.length}쪽 샘플 — <b>책을 누르면 뒤집혀 펼쳐집니다</b>`; }
    function turnPage(d) { const el = OB.el; if (!el || !OB.inside || OB.turning) return; const k1 = OB.k + d; if (k1 < 0 || k1 > kMax()) return; const inn = el.querySelector('.ob-inn'); const k = OB.k;
      if (RM() || !inn.animate) { OB.k = k1; innH(); return; } OB.turning = true; const lf = document.createElement('div'); lf.className = 'lf ' + (d > 0 ? 'r' : 'l');
      lf.innerHTML = d > 0 ? `<div class="lf-a pg r">${pageH(slot(2 * k + 1), 'r')}</div><div class="lf-b pg l">${pageH(slot(2 * k + 2), 'l')}</div>` : `<div class="lf-a pg l">${pageH(slot(2 * k), 'l')}</div><div class="lf-b pg r">${pageH(slot(2 * k - 1), 'r')}</div>`;
      const under = inn.querySelector(d > 0 ? '.pg.r' : '.pg.l'); under.innerHTML = pageH(slot(d > 0 ? 2 * k + 3 : 2 * k - 2), d > 0 ? 'r' : 'l'); under.classList.toggle('ep0', d > 0 ? 2 * k + 3 > OB.P.length : 2 * k - 2 <= 0); inn.appendChild(lf);
      const a = lf.animate(d > 0 ? [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-90deg) translateZ(2px)', offset: 0.5 }, { transform: 'rotateY(-180deg)' }] : [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(90deg) translateZ(2px)', offset: 0.5 }, { transform: 'rotateY(180deg)' }], { duration: 640, easing: 'cubic-bezier(.4,.1,.3,1)' });
      a.onfinish = () => { OB.k = k1; OB.turning = false; innH(); }; }
    on(sec, 'click', (e) => { const el = OB.el; if (!el || !el.contains(e.target)) return; const a = e.target.closest('[data-a],[data-ear]');
      if (a && a.dataset.ear) { e.preventDefault(); return turnPage(+a.dataset.ear); }
      const pg = OB.inside && e.target.closest('.ob-inn .pg'); if (pg) { const r = pg.getBoundingClientRect(); const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height; const R = pg.classList.contains('r'); /* 접힌 귀 자리(바깥 아래 모서리 · 쪽의 28%) — 3D 안에서는 귀가 눌림을 못 받을 때가 있어 자리로 셈 */
        if (fy > 0.72 && (R ? fx > 0.72 : fx < 0.28)) { e.preventDefault(); return turnPage(R ? 1 : -1); } }
      if (a) { const k = a.dataset.a; const x = OB.x; const b = OB.b; if (k === 'x') return closeBook(); if (!x) return;
        if (k === 'spv' || k === 'sph') { e.preventDefault(); const Z = OB.set; const s0 = Z && Z.G[0] && Z.G[0].src; closeBook(true); const t = s0 && s0.isConnected ? s0 : b; return k === 'spv' ? openBook(t, { inside: true, single: 1 }) : openProd(t, x, 'photo'); } /* (shelfset1) */
        if (k === 'open') { e.preventDefault(); remember(x.id, true); closeBook(true); return o.open && o.open(x.id); }
        if (k === 'cart') { const why = o.cart.add(x); if (why) { o.toast && o.toast(why); return; } badge(); a.outerHTML = '<a class="oc-b oc-c in" href="#/cart">✓ 담겨 있음 · 장바구니</a>'; say(x.t + ' — 장바구니에 담았습니다'); o.toast && o.toast('🛒 장바구니에 담았습니다'); bump((st.mob && $('.mb-c')) || $('.bqs-cart')); return; }
        if (k === 'wish') { const r = B.wishToggle((o.wish && o.wish.get()) || [], x); o.wish.set(r.wish); if (b) b.classList.toggle('wished', r.on); badge(); a.classList.toggle('on', r.on); a.setAttribute('aria-pressed', String(r.on)); a.textContent = r.on ? '♥ 찜함' : '♡ 찜'; o.toast && o.toast(r.on ? '♥ 찜 목록에 넣었습니다' : '찜을 뺐습니다'); return; } return; }
      if (e.target.closest('.ob-book')) { if (OB.P) flipBook(); return; } if (e.target.closest('.ss-v')) return; /* (shelfset1) 꺼낸 권을 눌러도 닫히지 않음 */ if (e.target.closest('.ob-card,.ob-tag')) return; closeBook(); });
    on(document, 'keydown', (e) => { if (!OB.el) return; if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); return closeBook(); } if (OB.inside && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); turnPage(e.key === 'ArrowRight' ? 1 : -1); }
      if (e.key === 'Enter' && e.target && e.target.dataset && e.target.dataset.ear) { e.preventDefault(); turnPage(+e.target.dataset.ear); } }, true);
    on(window, 'resize', () => { if (OB.el && !OB.busy && !(st.mob && Math.abs((innerWidth || 0) - (OB.vw || 0)) < 40)) closeBook(true); }); /* (shop2) 휴대폰은 주소 막대가 접히며 높이만 바뀌는 일이 잦음 — 폭이 그대로면 펼친 책 유지 */
    /* ── 돌아오기: 상세로 가기 전 이 책·자리를 적고(이 탭만) · 다시 서가에 오면 그 책을 화면 가운데 그 자리로 · 금빛으로 잠깐 알려 줌 */
    function remember(id, go) { try { sessionStorage.setItem('bq-shelf-ret', JSON.stringify({ id, y: Math.round(scrollY), t: Date.now(), go: go ? 1 : 0, s: st.sort, i: st.P ? B.mod(st.j, st.P.cases.length) : 0, cov: st.cov ? 1 : 0 })); } catch (e) {} if (o.onState && st.P) o.onState({ s: st.sort, i: B.mod(st.j, st.P.cases.length), f: id }); }
    let RET = (() => { const f = o.start && o.start.f; if (!f) return null; let r = null; try { r = JSON.parse(sessionStorage.getItem('bq-shelf-ret') || 'null'); } catch (e) {} return { id: String(f), y: r && r.id === String(f) && Date.now() - r.t < 3 * 3600e3 ? r.y : null, done: false }; })();
    function retTry() { if (!RET || RET.done || !st.P) return; const b = ring.querySelector(`.bqs-case.cur .sp[data-id="${CSS.escape(RET.id)}"]`); if (!b) return; RET.done = true; st.focusId = RET.id; setFocus(b);
      const put = () => { if (RET.y != null) window.scrollTo(0, RET.y); const r = b.getBoundingClientRect(); if (RET.y == null || r.top < 60 || r.bottom > innerHeight - 10) b.scrollIntoView({ block: 'center' }); b.focus({ preventScroll: true }); b.classList.add('back'); setTimeout(() => b.classList.remove('back'), 2600); sec.dataset.ret = RET.id; };
      requestAnimationFrame(() => requestAnimationFrame(put)); }

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
    on(stage, 'pointerdown', (e) => { if (e.pointerType !== 'touch') return; P2.set(e.pointerId, [e.clientX, e.clientY]); if (P2.size === 2) { const [a, b] = [...P2.values()]; pin = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: st.z }; sw = null; } else sw = { x: e.clientX, y: e.clientY, t: Date.now() }; });
    on(stage, 'pointermove', (e) => { if (!P2.has(e.pointerId)) return; P2.set(e.pointerId, [e.clientX, e.clientY]); if (sw && st.mob && P2.size === 1 && !st.busy && st.P && st.P.cases.length > 1) { const dx = e.clientX - sw.x, dy = e.clientY - sw.y; if (sw.h == null && Math.hypot(dx, dy) > 10) sw.h = Math.abs(dx) > Math.abs(dy) * 1.2; if (sw.h) { st.peek = -dx / (st.W + 40); ring.style.transition = 'none'; ring.style.transform = ringT(st.j + st.peek); sec.classList.add('drag'); } } /* (shelf8 · 정범님 11/12) 휴대폰: 옆으로 밀면 책장이 손가락을 따라옴 */ if (pin && P2.size === 2) { const [a, b] = [...P2.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (!st._pr) st._pr = requestAnimationFrame(() => { st._pr = 0; setZ(pin.z * d / pin.d); }); } });
    on(window, 'pointerup', (e) => { if (!stage.contains(e.target)) { P2.delete(e.pointerId); if (P2.size < 2) pin = null; } }); on(window, 'pointercancel', (e) => P2.delete(e.pointerId)); /* (shelf8) 책장 밖에서 뗀 손가락이 남아 다음 밀기를 두 손가락(확대)으로 보던 것 */
    const pUp = (e) => { if (!P2.has(e.pointerId)) return; P2.delete(e.pointerId); if (P2.size < 2) pin = null; if (sw) { const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sec.classList.remove('drag'); const fast = Date.now() - sw.t < 600 && Math.abs(dx) > 50 && Math.abs(dy) < 60; if (e.type === 'pointerup' && (sw.h || !st.mob) && (Math.abs(dx) > (st.W || 360) * 0.28 || fast)) { if (st.mob) swHint(true); turn(dx < 0 ? 1 : -1); } else if (st.peek) peekOff(); } sw = null; };
    function swHint(seen) { if (seen) { if (!LS.get('swH', 0)) LS.set('swH', 1); return; } if (!st.mob || LS.get('swH', 0) || !st.P || st.P.cases.length <= 1 || $('.bqs-swh')) return; const t = document.createElement('div'); t.className = 'bqs-swh'; t.setAttribute('role', 'status'); t.innerHTML = '<span>‹</span> 옆으로 밀면 다음 책장 <span>›</span>'; sec.appendChild(t); setTimeout(() => t.remove(), 3600); }
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
    on(ring, 'load', (e) => { const im = e.target; if (im.classList && im.classList.contains('ei') && im.naturalWidth) { const b = im.closest('.sp'); if (b) b.classList.add('eok'); } }, true); /* (shelf6) 표지 띠 책등 — 받은 뒤에만 보임(받기 전·실패는 지금처럼 지어낸 책등) */
    on(ring, 'error', (e) => { const im = e.target; if (im.classList && im.classList.contains('ei')) { const g = im.closest('.eg'); if (g) g.remove(); return; } if (im.classList && im.classList.contains('si')) { const b = im.closest('.sp'); im.remove(); if (b) { b.classList.remove('img'); fitSpines([b]); } } }, true);

    /* ── 자료 받기 → 그리기 */
    const T0 = performance.now(); badge(); const lt = $('.bqs-load span'), lb = $('.bqs-lbar i');
    /* (shelf4) 첫 묶음이 오면 바로 첫 책장(early) → 다 오면 같은 자리(같은 이름 책장)를 지키며 다시 짬 */
    const early = (items) => { if (st.dead || st.P || !items || !items.length) return; st.part = true; show(items); };
    const full = (items) => { if (st.dead) return; if (!st.P || !st.part) return show(items); st.part = false; const nm = st.P.cases[B.mod(st.j, st.P.cases.length)].name; st.items = items || []; byId.clear(); st.items.forEach((x) => byId.set(x.id, x)); LKC.clear();
      $('.bqs-n').textContent = st.items.length.toLocaleString('ko-KR') + '권'; st.P = B.plan(st.items, C, st.sort); const k = st.P.cases.findIndex((c) => c.name === nm); st.j = k >= 0 ? k : B.mod(st.j, st.P.cases.length); const l = $('.bqs-load2'); if (l) l.remove(); sync(true); retTry(); };
    Promise.resolve(o.load ? o.load((n, of) => { if (st.dead) return; const t = `책을 꽂는 중… ${n.toLocaleString('ko-KR')}${of ? ' / ' + of.toLocaleString('ko-KR') : ''}권`; if (lt.isConnected) { lt.textContent = t; if (of) lb.style.width = Math.round(n / of * 100) + '%'; } else { const l2 = $('.bqs-load2'); if (l2) l2.textContent = t; } }, early) : [])
      .then(full)
      .catch((e) => { if (st.dead) return; if (st.P) { const l2 = $('.bqs-load2'); if (l2) l2.textContent = '⚠ 나머지 책을 못 받음 — 새로 고침하면 다시'; return; } const l = $('.bqs-load'); if (l) l.innerHTML = `<div class="err"><b>⚠ ${esc(e.message || e)}</b> <button type="button" class="btn ghost bqs-again">다시 해 보기</button></div>`; const a = $('.bqs-again'); if (a) a.onclick = () => { api.destroy(); mount(el, o); }; });
    function show(items) { if (st.dead) return; sec.dataset.tData = Math.round(performance.now() - T0); st.items = items || []; byId.clear(); st.items.forEach((x) => byId.set(x.id, x)); const ld = $('.bqs-load'); if (ld) ld.remove(); $('.bqs-n').textContent = st.items.length.toLocaleString('ko-KR') + '권';
        if (st.part) $('.bqs-h').insertAdjacentHTML('afterend', '<small class="bqs-load2" role="status">나머지 책을 받는 중…</small>');
        if (!st.items.length) { ring.innerHTML = '<div class="bqs-empty">아직 꽂을 책이 없습니다</div>'; stage.style.height = 'auto'; return; }
        st.P = B.plan(st.items, C, st.sort); const N = st.P.cases.length; const p0 = o.start || {}; const pos = LS.get('pos', null);
        st.j = p0.i != null ? B.mod(+p0.i || 0, N) : MEM[st.sort] ? B.mod(MEM[st.sort].j, N) : pos && pos.s === st.sort ? B.mod(pos.i, N) : 0; sec.dataset.tPlan = Math.round(performance.now() - T0); sync(true); retTry(); swHint(); sec.dataset.firstMs = Math.round(performance.now() - T0); sec.dataset.firstAt = Math.round(performance.now()); o.ready && o.ready(api); }
    const api = { get fontState() { return { ...FST, q: FQ.length, run: fRun, n: FONT_CSS.size }; }, get state() { return { sort: st.sort, i: st.P ? B.mod(st.j, st.P.cases.length) : 0, N: st.P ? st.P.cases.length : 0, z: st.z, n: st.items.length }; }, turn, go, zoom: setZ, badge, refit: () => { const c = curCase(); if (c) delete c.dataset.fz; fitCase(c); }, lookOf: (id) => { const x = byId.get(id); return x ? lookOf(x) : null; }, get colorState() { return { ok: CC.ok, fail: CC.fail, okN: CC.okN, got: CC.got.size, q: CC.q.length }; },
      destroy() { st.dead = true; if (OB.el) { OB.el.remove(); OB.el = null; } lockScroll(false); try { document.body.classList.remove('shelf-mob'); } catch (e) {} cancelAnimationFrame(rw); offs.forEach((f) => f()); if (RO) RO.disconnect(); closePop(); hideTip(); el.querySelectorAll('.bqs-fly,.bqs-fx,.bqs-dust').forEach((x) => x.remove()); } };
    return api; }
  root.BQShelf = { mount, VER: B.VER };
})(typeof self !== 'undefined' ? self : this);

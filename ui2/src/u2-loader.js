/* 리드나우 2 — 지금 웹앱 불러오기 + 옛 기능 잇기(어댑터 첫 묶음) (설계안 3-5 · 4-2)
 * 차례: ① 지금 웹앱 틀(U2_BASE/index.html)을 읽음 → ② 그 안 CSS를 '@layer legacy'로 감싸 붙임(새 웹앱 CSS가 늘 이김 · 옛 화면 모양은 그대로)
 *       → ③ <script>를 적힌 차례대로 하나씩(Firebase → 공용 파일 → 틀 안 작은 스크립트 → 본문) · 공용 파일 주소는 U2_BASE 기준 절대 주소로
 *       → Firebase가 들어온 바로 뒤 쓰기 막이(u2-guard)를 걺 — 막이를 못 걸면 본문을 불러오지 않음(안전 모드)
 *       → ④ 본문이 끝나면 shell·renderMain을 새 웹앱 쪽으로 이어 걺
 * 실패하면 '안전 모드': 새 꾸미기 위젯만 쓰고, 기능 위젯 자리에는 '지금 웹앱에서 열기 ›' */
(function () {
  'use strict';
  const U2 = (window.U2 = window.U2 || {});
  const L = (U2.legacy = { ready: false, shellDone: false, lastTab: null, tabMounted: 0, cards: new Set(), errs: [], appVer: null });
  const SKIP = [/webmanifest/]; /* 빼는 틀 안 스크립트: 휴대폰 설치 파일 고르기(새 웹앱은 자기 설치 파일) */
  /* (0.4.15 rv4 · 지금 웹앱 1.78.559 priv1 따라 들임) 옛 주소(jerrycson.github.io)에서 열린 리드나우 2 안에서는 지금 웹앱의 '🚚 웹앱 주소가 readnow.kr/app/로' 노란 띠를 빼고
   *  리드나우 2 자기 띠(u2-move.js M.addrBar — 새 주소 readnow.kr/ui2/로 · 같은 짐 넘기기 약속)를 씀 — 지금 웹앱 띠를 누르면 리드나우 2가 아닌 지금 웹앱 새 주소로 가 버림
   *  새 주소(readnow.kr)에서는 그대로 돌림(그 틀 안 '짐 받기' 쪽이 리드나우 2 새 주소에서도 짐을 받음) */
  const skipT = (t) => SKIP.some((re) => re.test(t)) || (/rn-move-bar/.test(t) && /rn-move-ready/.test(t) && location.origin === 'https://jerrycson.github.io');
  const loadScript = (src, text) => new Promise((res, rej) => {
    const s = document.createElement('script');
    if (text != null) { s.textContent = text; document.body.appendChild(s); return res(); }
    s.src = src; s.async = false; let to = setTimeout(() => rej(new Error('시간 넘김: ' + src)), 120e3);
    s.onload = () => { clearTimeout(to); res(); }; s.onerror = () => { clearTimeout(to); rej(new Error('파일을 못 받음: ' + src)); };
    document.body.appendChild(s);
  });
  L.safe = (why) => { L.ready = false; U2.safe = { why: String(why && why.message || why) }; L.errs.push(U2.safe.why); try { U2.ls.set('lastErr', { at: U2.now(), why: U2.safe.why }); } catch (e) {} U2.emit('safe', U2.safe); };

  L.run = async function () {
    const base = U2.base; const t0 = performance.now();
    let html;
    try { const r = await fetch(new URL('index.html', base).href, { cache: 'no-cache' }); if (!r.ok) throw new Error('지금 웹앱 틀을 받지 못함 (' + r.status + ')'); html = await r.text(); } catch (e) { return L.safe(e); }
    let doc; try { doc = new DOMParser().parseFromString(html, 'text/html'); } catch (e) { return L.safe('틀을 읽지 못함'); }
    const scripts = Array.from(doc.querySelectorAll('script'));
    if (!scripts.some((s) => /readnow-webapp\.js/.test(s.getAttribute('src') || ''))) return L.safe('틀 모양이 바뀜 — 본문(readnow-webapp.js) 줄을 찾지 못함');
    /* ② 옛 CSS */
    const css = Array.from(doc.querySelectorAll('style')).map((s) => s.textContent).join('\n');
    if (css) { const st = document.createElement('style'); st.id = 'u2-legacy-css'; st.textContent = '@layer legacy{\n' + css + '\n}'; document.head.insertBefore(st, document.head.firstChild); }
    const tc = doc.querySelector('meta[name="theme-color"]'); if (tc) { /* 새 웹앱 띠 색은 그대로 둠 */ }
    /* ③ 스크립트 차례대로 */
    try {
      for (const s of scripts) {
        const src = s.getAttribute('src');
        if (!src) { const t = s.textContent || ''; if (skipT(t)) continue; await loadScript(null, t); continue; }
        const url = new URL(src, base).href; const isBody = /readnow-webapp\.js/.test(src);
        if (isBody) {
          if (!(U2.guard && U2.guard.install())) throw new Error('쓰기 막이를 걸 수 없음(Firebase 모양이 다름) — 안전하게 본문을 불러오지 않음');
          U2.emit('loadStep', '본문');
        }
        await loadScript(url);
        if (U2.guard && !U2.guard.installed && window.firebase && window.firebase.firestore) U2.guard.install();
        if (isBody) L.attach();
      }
    } catch (e) { return L.safe(e); }
    L.loadMs = Math.round(performance.now() - t0);
    try { L.appVer = typeof APP_VER !== 'undefined' ? APP_VER : null; } catch (e) {}
    U2.guard.startTimers();
    U2.emit('legacyLoaded', L);
  };

  /* ④ 잇기 */
  L.attach = function () {
    const miss = ['shell', 'renderMain'].filter((n) => typeof window[n] !== 'function');
    if (miss.length) throw new Error('계약 함수가 없음: ' + miss.join(', '));
    const oShell = window.shell; L.oRender = window.renderMain;
    window.shell = function () { const r = oShell.apply(this, arguments); L.shellDone = true; L.shellAt = performance.now(); L.watchSheet(); try { L.lastTab = S.tab; } catch (e) {} /* 여는 순간의 옛 탭은 따라가지 않음(옛 코드가 '그 자리 되살리기'로 탭을 정해도 새 웹앱 페이지는 주소 ?p= 그대로) */ document.body.classList.add('u2-legacy-on'); U2.emit('legacyShell'); return r; };
    window.renderMain = function () {
      if (U2.adapters && U2.adapters.rendering) return; /* 섹션 위젯을 그리는 동안 옛 코드가 부른 다시 그리기는 무시(탭을 잠깐 바꿔 두었으므로) */
      let tab = null; try { tab = S.tab; } catch (e) {}
      if (L.shellDone && tab && tab !== L.lastTab) { L.lastTab = tab; const pid = U2.pageForTab && U2.pageForTab(tab); if (pid && pid !== U2.cur) { U2.go(pid, { fromLegacy: true }); return; } }
      L.refreshCards(); if (U2.data) U2.data.bump(); if (U2.adapters) U2.adapters.refresh(); /* 식이 든 위젯도 0.7초 모아 */
      if (!L.tabMounted) { L.dirty = true; return; } /* 이 페이지에 옛 탭이 없으면 그리지 않음(가벼움) */
      if (U2.dock && U2.dock.renderNow()) { let u0; try { u0 = S._userAt; S._userAt = Date.now(); } catch (e) {} try { return L.oRender.apply(this, arguments); } finally { try { S._userAt = u0; } catch (e) {} } } /* 옛 화면과 함께 쓰는 중: 지금 웹앱이 '상세가 열려 있으면 뒤 탭 다시 그리기를 미룸' → 페이지의 옛 탭이 낡지 않게 그때만 '방금 누름'으로 쳐서 그림(u2-dock) */
      return L.oRender.apply(this, arguments);
    };
    L.attachAt = performance.now(); L.wrapBoot();
    L.ready = true;
    setTimeout(() => { try { U2.adapters && U2.adapters.check(); } catch (e) {} }, 0); /* 계약 검사 */
    try { firebase.auth().onAuthStateChanged((u) => { U2.authed = !!u; U2.emit('auth', u); }); } catch (e) {}
  };
  /* ── 페이지 맞춤(정범님 11/05 '어느 페이지를 골라도 같은 등록 화면') ──
   * 까닭: 새 웹앱(…/readnow-ui2/)과 지금 웹앱(…/readnow-scripts/app/)은 같은 주소 공간(jerrycson.github.io)이라 기기 저장소를 함께 씀
   *   → 지금 웹앱이 연 지 0.9초 뒤 '하던 상품 등록 화면 다시 엶'(localStorage rn-reg-ui)·'새로고침 전 자리'(sessionStorage rn-place)를 되살림
   *   → 옛 상세 층 #sheet(position:fixed · 화면 전체 · z-index 10)가 켜진 채로 남아, 새 웹앱 페이지를 바꿔도(탭은 바뀌지만) 그 층이 늘 위를 덮음
   * 고침(지금 웹앱 코드는 그대로 · 바깥에서 그 전역 함수만 감쌈):
   *   ① 여는 동안(옛 화면 틀이 선 뒤 12초 · 사람이 아무것도 누르기 전)은 '저절로 되살리기'를 하지 않음 — placeRead → 없음 · openRegister → 건너뜀(기록만)
   *      그 사이 다른 길로 저절로 열린 상세 층도 닫음(주소 #c= 같은 링크로 연 것은 그대로)
   *   ② 사람이 새 웹앱 페이지를 고르면(U2.go) 옛 상세 층·점수 창을 닫고(지금 웹앱 closeDetail·closeModal) 그 페이지의 옛 탭(맞춤표 L.tabFor)으로 옮김
   *   ③ 옛 상세 층은 새 웹앱 머리 아래에서 시작(--u2-top · 머리 높이·알림 띠·화면 폭이 바뀌면 다시 잼) */
  L.userAt = 0; L.suppressed = [];
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => document.addEventListener(ev, (e) => { if (e.isTrusted !== false) L.userAt = performance.now(); }, { capture: true, passive: true }));
  const LINK_HASH = /^#(c|open|man|upd)=/; /* 지금 웹앱 주소 링크로 일부러 여는 것 — 막지 않음 */
  /* (0.4.8) 📱 화면마다 설치 앱·알림의 바로 가기(?go=화면 — 지금 웹앱 주소에서 넘어와도 그대로 붙음)는 일부러 여는 것 → 그 상세 층은 닫지 않음
   *  지금 웹앱이 연 뒤 주소에서 ?go=를 지우므로(deliv·y24ord·qna) 여는 순간에 잡아 둠 · 새로고침 전 자리(placeRead)는 그래도 막음(새 웹앱 자리는 ?p=) */
  L.GO_SHEET = ['confirm', 'deliv', 'y24ord', 'reg', 'ppt', 'batch', 'mgr'];
  L.go0 = (() => { try { return new URLSearchParams(location.search).get('go') || ''; } catch (e) { return ''; } })();
  L.goOpen = (n) => L.GO_SHEET.includes(L.go0) && (n === 'sheet' || (n === 'openRegister' && L.go0 === 'reg'));
  L.bootGate = (n) => !(L.userAt > (L.attachAt || 0)) && (!L.shellAt || performance.now() - L.shellAt < 12000) && !LINK_HASH.test(location.hash || '') && !(n && L.goOpen(n));
  L.wrapBoot = function () {
    const wrap = (n, alt) => { const o = window[n]; if (typeof o !== 'function' || o._u2) return; const f = function () { if (L.bootGate(n)) { L.suppressed.push({ n, at: Math.round(performance.now()) }); return alt; } return o.apply(this, arguments); }; f._u2 = 1; f._orig = o; window[n] = f; };
    wrap('placeRead', null); /* 새로고침 전 자리(탭·상세 화면) — 새 웹앱은 주소 ?p= 가 자리 */
    wrap('openRegister', undefined); /* 하던 상품 등록 다시 엶(rn-reg-ui) — 사람이 누른 뒤에는 그대로 열림 */
  };
  L.closeOverlays = function (why, o) {
    o = o || {}; const out = [];
    try { const md = document.getElementById('modal'); if (md && md.classList.contains('on') && typeof closeModal === 'function') { closeModal(); out.push('modal'); } } catch (e) {}
    if (o.sheet !== false) try { const sh = document.getElementById('sheet'); if (sh && (sh.classList.contains('on') || (typeof S !== 'undefined' && S.detail))) { if (typeof closeDetail === 'function') closeDetail(); else { sh.classList.remove('on'); document.body.style.overflow = ''; } out.push('sheet'); } } catch (e) { console.warn('[u2] 옛 상세 층 닫기', e); }
    if (out.length) L.closed = (L.closed || []).concat([{ why, out, at: Math.round(performance.now()) }]).slice(-20);
    return out;
  };
  /* 새 웹앱 페이지 → 옛 탭 맞춤표(페이지 안 '지금 웹앱 탭 전체' 위젯이 가리키는 탭 · 없으면 같은 이름 탭 · 그래도 없으면 없음) */
  L.tabFor = function (pid) {
    try { const pg = U2.effective ? U2.effective(pid) : null; const w = pg && Object.values(pg.widgets || {}).find((x) => x.type === 'legacy.tab'); if (w && w.props && w.props.ref) return w.props.ref; } catch (e) {}
    return (U2W && U2W.TABS && U2W.TABS[pid]) || (U2.EXTRA_TABS && U2.EXTRA_TABS[pid]) ? pid : null;
  };
  L.syncTo = function (pid, o) {
    o = o || {}; if (!L.ready) return [];
    /* 11/05 동시에 쓰기: 설정 '페이지 바꿀 때 옛 화면 두기'(기본)면 옛 상세 층은 닫지 않고 나란히 창·화면 위젯 칸으로(u2-dock) · 점수 창(#modal)만 닫음 */
    const keepSheet = !o.keepOverlay && U2.dock && U2.dock.keep();
    const out = o.keepOverlay ? [] : L.closeOverlays('page:' + pid, { sheet: !keepSheet });
    if (U2.dock) U2.dock.onPage(!o.keepOverlay);
    const tab = L.tabFor(pid); if (tab) { try { if (S.tab !== tab) { S.tab = tab; S.limit = 30; } L.lastTab = tab; } catch (e) {} }
    return out;
  };
  /* 상세 층·머리 높이 */
  L.measureTop = function () {
    const bar = document.getElementById('u2-bar'); if (!bar) return;
    const ed = document.querySelector('.u2-edtop'); const r = (ed || bar).getBoundingClientRect(); const top = Math.max(0, Math.round(r.bottom));
    if (top !== L._top) { L._top = top; document.documentElement.style.setProperty('--u2-top', top + 'px'); }
  };
  L.watchSheet = function () {
    const sh = document.getElementById('sheet'); if (!sh || sh._u2w) return; sh._u2w = 1;
    let iv = null;
    const on = () => {
      const isOn = sh.classList.contains('on'); document.body.classList.toggle('u2-sheet-on', isOn); if (U2.dock) U2.dock.sync();
      if (isOn) { L.measureTop(); if (!iv) iv = setInterval(L.measureTop, 600); if (L.bootGate('sheet')) { L.suppressed.push({ n: 'sheet', at: Math.round(performance.now()) }); setTimeout(() => { if (L.bootGate('sheet') && sh.classList.contains('on')) L.closeOverlays('boot'); }, 0); } }
      else if (iv) { clearInterval(iv); iv = null; }
    };
    new MutationObserver(on).observe(sh, { attributes: true, attributeFilter: ['class'] }); on();
  };
  addEventListener('resize', () => L.measureTop && L.measureTop(), { passive: true });
  addEventListener('scroll', () => { if (document.body.classList.contains('u2-sheet-on')) L.measureTop(); }, { passive: true });
  const home = () => document.getElementById('app');
  /* T1 탭 위젯: 옛 #main을 이 칸으로 옮기고 그 탭을 그림(한 페이지에 하나) */
  L.mountTab = function (b, ref) {
    b.classList.add('u2-lg');
    const put = () => {
      const main = document.getElementById('main'); if (!main) { b.innerHTML = '<div class="u2-empty">⏳ 지금 웹앱을 여는 중…</div>'; return false; }
      b.innerHTML = ''; b.appendChild(main); L.tabMounted++;
      try { S.tab = ref; S.limit = 30; S._userAt = Date.now(); } catch (e) {} L.lastTab = ref; /* 사람이 페이지를 바꾼 것 = 옛 화면도 미루지 않고 바로 그림 */
      try { L.oRender(); } catch (e) { console.error('[u2] 옛 탭 그리기', e); }
      try { U2.catalog && setTimeout(() => U2.catalog.learn(main, ref), 1500); } catch (e) {} /* 화면에 나온 섹션을 목록에 더함 */
      return true;
    };
    let ok = put(), off = null, dead = false;
    if (!ok) off = U2.on('legacyShell', () => { if (!ok && !dead) ok = put(); });
    return () => { dead = true; if (off) off(); const main = document.getElementById('main'); if (ok && main && b.contains(main)) { L.tabMounted--; const a = home(); if (a) a.appendChild(main); } };
  };
  L.mountHeader = function (b) {
    b.classList.add('u2-lg');
    const put = () => { const h = document.querySelector('header.top'); if (!h) { b.innerHTML = '<div class="u2-empty">⏳ 여는 중…</div>'; return false; } b.innerHTML = ''; b.appendChild(h); return true; };
    let ok = put(), off = null, dead = false; if (!ok) off = U2.on('legacyShell', () => { if (!ok && !dead) ok = put(); });
    return () => { dead = true; if (off) off(); const h = document.querySelector('header.top'); if (ok && h && b.contains(h)) { const a = home(); if (a) a.insertBefore(h, a.firstChild); } };
  };
  /* T3 홈 칸(보기 전용) — 옛 코드가 자료가 바뀌었다고 하면(renderMain) 0.7초 모아 다시 그림 */
  L.mountHomeCard = function (b, ref) {
    b.classList.add('u2-lg');
    const draw = () => { let W0 = null; try { W0 = typeof WIDGETS !== 'undefined' ? WIDGETS[ref] : null; } catch (e) {} if (!W0) { b.innerHTML = '<div class="u2-empty">홈 칸을 찾지 못함: ' + U2.esc(ref) + '</div>'; return; } let h = ''; try { h = W0[1](); } catch (e) { h = '<div class="u2-empty">아직 자료가 없음</div>'; } b.innerHTML = '<div class="u2-hc"><b>' + U2.esc(W0[0]) + '</b><div>' + h + '</div></div>'; };
    const it = { draw }; L.cards.add(it); draw();
    return () => L.cards.delete(it);
  };
  L.refreshCards = function () { if (!L.cards.size) return; clearTimeout(L._ch); L._ch = setTimeout(() => L.cards.forEach((c) => { try { c.draw(); } catch (e) {} }), 700); };
  /* 지금 웹앱 전역 목록(const라 window에 없음 — 이름마다 typeof로 읽음 · eval 안 씀) */
  const GL = { FEAT: () => (typeof FEAT !== 'undefined' ? FEAT : null), PG_SCR: () => (typeof PG_SCR !== 'undefined' ? PG_SCR : null), WIDGETS: () => (typeof WIDGETS !== 'undefined' ? WIDGETS : null), W_DESC: () => (typeof W_DESC !== 'undefined' ? W_DESC : null), FEATIX: () => (typeof featIndex === 'function' ? featIndex() : null) /* (0.4.8) 🔍 기능 찾기 전체 = FEAT + 섹션(SECS) + 홈 칸 — 지금 웹앱 기능 찾기와 같은 목록 */,
    /* (0.4.11) ⚙ 설정 묶음(지금 웹앱 ⑧ 설정 묶음과 같은 갈래 · 없으면 새 웹앱이 한 묶음으로) */ UX2_SG: () => (typeof UX2_SG !== 'undefined' ? UX2_SG : null), UX2_SGSEC: () => (typeof UX2_SGSEC !== 'undefined' ? UX2_SGSEC : null), UX2_SGTXT: () => (typeof UX2_SGTXT !== 'undefined' ? UX2_SGTXT : null) };
  L.list = (n) => { try { return GL[n] ? GL[n]() : null; } catch (e) { return null; } };
  /* 기능 찾기 — 같은 이름 → 앞 그림 글자만 뗀 이름이 같음('🚚 오늘 출고' = '오늘 출고') → 그 글을 품은 것 중 가장 짧은 이름
   * (11/10) 예전엔 '품은 것 중 맨 앞'이라, 지금 웹앱 1.78.463이 목록 앞에 '🔎 오늘 출고 검색창 — …'을 더하자 '오늘 출고' 단추가 그 긴 기능으로 바뀌었음 */
  L.findFeat = (q) => { const F = L.list('FEAT'); if (!F || !q) return null; const bare = (t) => String(t).replace(/^[^0-9A-Za-z가-힣]+/u, '').trim(); const qb = bare(q);
    return F.find((f) => f.t === q) || F.find((f) => bare(f.t) === qb) || F.filter((f) => String(f.t).indexOf(q) >= 0).sort((a, b) => String(a.t).length - String(b.t).length)[0] || null; };
  /* (0.4.8) 기능 찾기 항목을 그대로 엶(이름으로 다시 찾지 않음 — 섹션·홈 칸 항목은 FEAT에 없어서) */
  L.featGo = (f) => { if (!f) return; L.userAt = performance.now(); U2.setCtx('feat:' + f.t); try { return typeof featGo === 'function' ? featGo(f) : f.go && f.go.fn && f.go.fn(); } catch (e) { U2.toast('기능 실행 중 오류: ' + e.message, 1); } };
  L.feat = (q) => { const f = L.findFeat(q); if (!f) return U2.toast('기능을 찾지 못함: ' + q, 1); L.userAt = performance.now(); /* 새 웹앱에서 일부러 연 것 = 여는 동안 막이를 끝냄 */ U2.setCtx('feat:' + q); try { return typeof featGo === 'function' ? featGo(f) : f.go && f.go.fn && f.go.fn(); } catch (e) { U2.toast('기능 실행 중 오류: ' + e.message, 1); } };
  /* 대상이 있어야 열리는 화면 — 지금 웹앱은 상세 화면 함수를 '화면 쌓기'(navWrap)로 감싸 인자 수(fn.length)가 늘 0으로 보임 → 11/05 실화면 점검에서 대상 없이 열면 오류 난 8개 + 열어 보다 오류가 난 것(이 기기에 기억 rn2-scrArg) */
  L.ARG_SCR = new Set(['shipDay', 'invMatch', 'shipCost', 'book', 'cashForm', 'purEntry', 'sellerCount', 'listView']);
  L.needsArg = (k) => { const fn = (L.findScreen(k) || [])[3]; if (L.ARG_SCR.has(k) || (U2.ls.get('scrArg', []) || []).indexOf(k) >= 0) return true; const f = fn && window[fn]; return !!(f && f.length > 0); };
  L.findScreen = (k) => { const P = L.list('PG_SCR'); if (!P) return null; return P.find((r) => r[0] === k) || null; };
  L.screen = (k) => { const r = L.findScreen(k); const fn = r && window[r[3]]; if (typeof fn !== 'function') return U2.toast('화면을 열 수 없음: ' + k, 1); if (L.needsArg(k)) return U2.toast("'" + String(r[1]) + "'은(는) 대상(주문·상품·날짜 등)이 있어야 열립니다 — 그 대상의 상세 화면 안에서 여세요", 1, 4000); L.userAt = performance.now(); U2.setCtx('screen:' + k); try { return fn(); } catch (e) { const a = U2.ls.get('scrArg', []) || []; if (a.indexOf(k) < 0) U2.ls.set('scrArg', a.concat([k]).slice(-40)); U2.toast("'" + String(r[1]) + "'은(는) 대상 없이 열 수 없어 서랍에서 뺐습니다(" + e.message + ')', 1, 4000); } };
  /* 서랍에 보일 옛 기능 목록 — 실행 중에 지금 웹앱 목록에서 저절로(설계안 6-3 첫 단계) */
  L.catalog = () => {
    const out = { screens: [], feats: [], home: [] };
    const P = L.list('PG_SCR'); if (P) P.forEach((r) => { if (typeof window[r[3]] === 'function' && !L.needsArg(r[0])) out.screens.push({ k: r[0], t: r[1] }); });
    const F = L.list('FEAT'); if (F) F.forEach((f) => out.feats.push({ t: f.t, k: f.k || '' }));
    const Wd = L.list('WIDGETS'), D = L.list('W_DESC') || {}; if (Wd) Object.keys(Wd).forEach((k) => out.home.push({ k, t: Wd[k][0], d: D[k] || '' }));
    return out;
  };
  /* 새 판 확인(설계안 3-2): 불러온 지금 웹앱 판(APP_VER) · 새 웹앱 판(U2_VER)이 바뀌면 띠 */
  L.checkNew = async function () {
    const out = {};
    try { const t = await (await fetch(new URL('index.html', U2.base).href, { cache: 'no-cache' })).text(); const m = /const APP_VER = '([^']+)'/.exec(t); if (m && L.appVer && m[1] !== L.appVer) out.app = m[1]; } catch (e) {}
    try { const t = await (await fetch('u2-config.js', { cache: 'no-cache' })).text(); const m = /U2_VER = '([^']+)'/.exec(t); if (m && m[1] !== U2.ver) out.u2 = m[1]; } catch (e) {}
    if (out.app || out.u2) U2.emit('newVer', out);
    return out;
  };
})();

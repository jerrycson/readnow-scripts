/* 리드나우 2 — 🧩 바깥 블록 받는 자리 (0.4.9 · 약속 53 「우리숍 기능이 리드나우 2 커스토마이징 템플릿으로 옮겨 오게」)
 *  우리숍(readnow-scripts shop/)처럼 따로 만든 화면 조각을 그 파일 그대로 받아 격자 위젯(U2W)으로 놓음 — 복사하지 않음(U2_BASE처럼 '그대로 불러오기')
 *  블록 하나 = U2.blocks.add('종류', { name, icon, w, h, files:{ css:[], js:[] }, ready() → 참이면 파일을 다 받은 것, schema() → 설정 틀, props:[블록 쪽 속성], mount(자리, 설정, ctx) → 정리 함수 })
 *    · 설정 틀(SCHEMA) 한 줄 = { k, label, type: number|select|check|text|area|multi, def, min, max, step, opts, group, help } — 우리숍 shop/shelf-core.js SCHEMA와 같은 꼴 → 편집기 속성판이 그대로 그림(묶음 머리·도움말·여럿 고르기)
 *    · 파일은 블록이 처음 놓이거나 보일 때만 받음(첫 화면 무게 0) · 받은 뒤 설정 틀을 속성에 붙이고 속성판을 다시 그림
 *    · CSS는 그 블록 칸 안에만(@scope) — 우리숍 CSS의 .err·.au 같은 이름이 지금 웹앱 화면을 바꾸지 않게
 *    · 기기 저장 열쇠는 rn2-blk-<종류>- · Firestore에는 아무것도 쓰지 않음(설정은 페이지 배치 ui2_pages 안 위젯 속성으로만)
 *    · 블록 안 '#/…' 링크(우리숍 주소 길)는 새 웹앱 주소를 바꾸지 않게 막고 알림으로
 *  첫 블록: 📚 서가 책장(BQShelf.mount · shop/shelf-core.js·shelf.js·shelf.css) — 견본 책(손님·상품 정보 아님) 또는 우리숍 책장 자료 주소 */
(function () {
  'use strict';
  const U2 = (window.U2 = window.U2 || {});
  const W = window.U2W; if (!W) return;
  const esc = (s) => U2.esc(s);
  const GROUP = '우리숍 블록';
  if (W.GROUPS.indexOf(GROUP) < 0) W.GROUPS.splice(W.GROUPS.indexOf('리드나우 기능') < 0 ? W.GROUPS.length : W.GROUPS.indexOf('리드나우 기능'), 0, GROUP);
  /* 우리숍 파일이 있는 곳 — U2_SHOP_BASE(없으면 지금 웹앱 주소 옆 shop/) */
  const shopBase = () => window.U2_SHOP_BASE || new URL('../shop/', U2.base || window.U2_BASE || location.href).href;
  const B = (U2.blocks = { GROUP, specs: {}, shopBase, TYPES: ['number', 'select', 'check', 'text', 'area', 'multi'] });

  /* 설정 틀 → 위젯 속성(모르는 종류는 글 칸 · 겹치는 열쇠는 뺌) */
  const RESERVED = new Set(['guide', 's_title', 's_bg', 's_accent', 's_pat', 's_radius', 's_shadow', 's_pad', 'showIf', 'devOnly', 'night', 'key']);
  B.propsOf = (schema) => (Array.isArray(schema) ? schema : []).filter((f) => f && f.k && !RESERVED.has(f.k)).map((f) => {
    const t = B.TYPES.indexOf(f.type) >= 0 ? f.type : 'text';
    const o = { k: f.k, label: String(f.label || f.k), type: t, def: t === 'multi' ? (Array.isArray(f.def) ? f.def.slice() : []) : f.def };
    if (f.opts) o.opts = f.opts; if (f.group) o.group = f.group; if (f.help) o.help = f.help;
    ['min', 'max', 'step'].forEach((k) => { if (f[k] != null) o[k] = f[k]; }); return o; });

  /* 파일 받기(한 번만 · 차례대로) — CSS는 글을 받아 @scope로 감쌈 */
  const got = new Map();
  const scopeCss = (txt, sel) => { const keep = []; const rest = String(txt).replace(/@(?:-webkit-)?keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, (m) => { keep.push(m); return ''; }).replace(/@font-face\s*\{[^}]*\}/g, (m) => { keep.push(m); return ''; });
    return keep.join('\n') + `\n@scope (${sel}) {\n${rest}\n}`; };
  B.loadCss = (url, sel) => { const key = 'css|' + url + '|' + sel; if (got.has(key)) return got.get(key);
    const pr = fetch(url, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error('못 받음(' + r.status + ')'); return r.text(); }).then((t) => { const st = document.createElement('style'); st.dataset.u2blk = sel; st.textContent = scopeCss(t, sel); document.head.appendChild(st); });
    pr.catch(() => got.delete(key)); got.set(key, pr); return pr; };
  B.loadJs = (url) => { const key = 'js|' + url; if (got.has(key)) return got.get(key);
    const pr = new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = url; sc.async = false; sc.onload = () => res(); sc.onerror = () => { sc.remove(); rej(new Error('못 받음: ' + url.split('/').pop().split('?')[0])); }; document.head.appendChild(sc); });
    pr.catch(() => got.delete(key)); got.set(key, pr); return pr; };
  B.load = (spec) => { if (spec.ready && spec.ready()) return Promise.resolve(); const f = spec.files || {}; const base = f.base ? f.base() : shopBase(); const v = '?v=' + encodeURIComponent(U2.ver || '');
    return Promise.all([(f.js || []).reduce((p, n) => p.then(() => B.loadJs(new URL(n, base).href + v)), Promise.resolve()), Promise.all((f.css || []).map((n) => B.loadCss(new URL(n, base).href + v, '.u2-blk-' + spec.cls)))]); };

  /* 블록 더하기 → U2W 위젯 */
  B.add = (type, spec) => {
    spec.type = type; spec.cls = spec.cls || type.replace(/[^a-z0-9]+/gi, '-'); B.specs[type] = spec;
    const base = spec.props || [];
    const d = { name: spec.name, group: GROUP, icon: spec.icon || '🧩', w: spec.w || 12, h: spec.h || 24, minW: spec.minW || 4, minH: spec.minH || 8, block: true, one: !!spec.one, props: base.slice(), desc: spec.desc || '' };
    const fill = () => { if (d._full || !spec.ready || !spec.ready()) return false; d.props = base.concat(B.propsOf((spec.schema ? spec.schema() : []).filter((f) => !(spec.skip || []).includes(f.k)))); d._full = true; return true; };
    B.fill = B.fill || {}; B.fill[type] = fill;
    d.render = function (b, p, ctx) {
      b.classList.add('u2-blk', 'u2-blk-' + spec.cls); let dead = false, off = null;
      b.innerHTML = `<div class="u2-empty">⏳ ${esc(spec.icon || '')} ${esc(spec.name)} 파일을 받는 중…</div>`;
      /* 우리숍 주소 길(#/cart 같은) 링크는 새 웹앱 주소를 바꾸지 않게 */
      const stopHash = (e) => { const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || !b.contains(a)) return; e.preventDefault(); if (!ctx.edit) U2.toast(spec.hashMsg ? spec.hashMsg(a.getAttribute('href')) : '리드나우 2 안에서는 이 링크를 열지 않습니다', 0); };
      b.addEventListener('click', stopHash, true);
      B.load(spec).then(() => {
        if (dead) return;
        if (fill() && ctx.edit && U2.edit && typeof U2.edit.drawProps === 'function') { try { U2.edit.drawProps(); } catch (e) {} }
        const props = Object.assign(W.defaults(type), p || {}); b.innerHTML = '';
        try { off = spec.mount(b, props, ctx) || null; } catch (e) { b.innerHTML = `<div class="u2-empty">⚠ ${esc(spec.name)}을(를) 그리지 못함: ${esc(U2.errKo ? U2.errKo(e) : e.message)}</div>`; }
      }).catch((e) => { if (!dead) b.innerHTML = `<div class="u2-empty">⚠ ${esc(spec.icon || '')} ${esc(spec.name)} 파일을 아직 받을 수 없습니다<small>${esc(e.message)} · ${esc(spec.missing || '우리숍 쪽 파일이 배포되면 저절로 보입니다')}</small></div>`; });
      return () => { dead = true; b.removeEventListener('click', stopHash, true); if (typeof off === 'function') { try { off(); } catch (e) {} } };
    };
    W.def(type, d); return d;
  };
  /* 쉬는 때 설정 틀을 미리 붙여 둠(편집기 속성판이 처음부터 모든 칸을 보이게) — 이미 받은 파일만 */
  B.fillAll = () => Object.keys(B.fill || {}).forEach((k) => B.fill[k]());

  /* ═══ 📚 서가 책장 (우리숍 shop/shelf.js · 11/11 shelf1) ═══ */
  const LSK = 'rn2-blk-shelf-';
  const wishGet = () => { try { return JSON.parse(localStorage.getItem(LSK + 'wish') || '[]') || []; } catch (e) { return []; } };
  const wishSet = (L) => { try { localStorage.setItem(LSK + 'wish', JSON.stringify((L || []).slice(0, 300))); } catch (e) {} };
  B.add('shop.shelf', {
    name: '서가 책장(우리숍)', icon: '📚', w: 24, h: 40, cls: 'shelf', one: true, /* 책장 화면 안 id(bqsView) 하나 — 한 페이지에 하나 */
    desc: '우리숍 서가 책장 화면 그대로 — 설정은 우리숍 ⚙ 서가 책장 설정과 같은 칸',
    files: { js: ['shelf-core.js', 'shelf.js'], css: ['shelf.css'] },
    ready: () => !!(window.BQS && window.BQShelf && window.BQS.SCHEMA),
    schema: () => window.BQS.SCHEMA,
    missing: '우리숍 서가 책장(shop/shelf-core.js·shelf.js·shelf.css)이 지금 웹앱 쪽에 합쳐지면 저절로 보입니다',
    hashMsg: (h) => (/wish/.test(h) ? '♡ 찜은 이 기기에만 남습니다 — 찜 목록 화면은 우리숍에서' : /cart/.test(h) ? '🛒 장바구니는 우리숍에서 — 리드나우 2는 미리 보기' : '우리숍 안의 링크 — 리드나우 2에서는 열지 않음'),
    props: [
      { k: 'b_src', label: '책 자료', type: 'select', opts: { demo: '견본 책(지어낸 제목 · 손님·상품 정보 아님)', url: '우리숍 책장 자료 주소(읽기만)' }, def: 'demo', group: '블록' },
      { k: 'b_n', label: '견본 책 수', type: 'number', def: 240, min: 20, max: 1200, step: 20, group: '블록' },
      { k: 'b_url', label: '책장 자료 주소(우리숍 /shop/shelf · 비우면 견본)', type: 'text', def: '', group: '블록', help: '다른 주소(우리숍)의 자료는 그 서버가 이 주소를 허락해야 읽힘 — 안 되면 칸 안에 까닭이 나옴' },
      { k: 'b_bar', label: '관리 줄 보이기(관리자 기기만 — 이 설정으로 우리숍 손님 화면 미리 보기 · 설정 글 복사)', type: 'check', def: true, group: '블록' },
      { k: 'b_shop', label: '우리숍 주소(미리 보기 링크)', type: 'text', def: 'https://booksqueen.com/', group: '블록' }],
    skip: ['on'], /* 우리숍 메뉴에 '서가 책장' 보이기 — 새 웹앱에선 페이지 배치가 대신함 */
    mount(b, p, ctx) {
      const B0 = window.BQS; const cfg = B0.cfgOf(p);
      /* 관리 줄(관리자 기기 · 보기 모드): 우리숍 관리 화면 '미리 보기'와 같은 주소(#/shelf?cfg=… — 저장 없이 그 화면만) · 설정 글(기본값과 다른 칸만) 복사 — 여기서는 우리숍 설정을 쓰지 않음(ui2_ 밖 쓰기 0) */
      if (p.b_bar && !ctx.edit && U2.isAdmin && U2.isAdmin()) {
        const base = /^https:\/\//.test(p.b_shop || '') ? String(p.b_shop).replace(/[#?].*$/, '').replace(/\/?$/, '/') : 'https://booksqueen.com/';
        const bar = document.createElement('div'); bar.className = 'u2-blkbar'; const diff = B0.cfgDiff(cfg); const n = Object.keys(diff).length;
        bar.innerHTML = `<span class="u2-sub">📚 우리숍 서가 책장 블록 · 기본값과 다른 칸 ${n}개</span><a class="u2-btn" target="_blank" rel="noopener" href="${esc(base + '#/shelf?cfg=' + B0.previewArg(cfg))}">🔗 이 설정으로 우리숍 미리 보기 ›</a><button type="button" class="u2-btn" data-cp>📋 설정 글 복사</button>`;
        bar.querySelector('[data-cp]').onclick = () => { const t = JSON.stringify(diff); const done = () => U2.toast('📋 설정 글 복사 — 우리숍 ⚙ 서가 책장 설정에 그대로 옮길 값(' + n + '칸)'); try { navigator.clipboard.writeText(t).then(done, () => U2.toast('복사하지 못함 — 브라우저가 막음', 1)); } catch (e) { U2.toast('복사하지 못함', 1); } };
        b.appendChild(bar);
      }
      const host = document.createElement('div'); host.className = 'u2-shelfhost'; b.appendChild(host);
      const load = (prog) => {
        if (p.b_src === 'url' && /^https?:\/\//.test(p.b_url || '')) return fetch(p.b_url).then((r) => { if (!r.ok) throw new Error('책장 자료를 못 받음(' + r.status + ')'); return r.json(); }).then((J) => (J && J.cols ? B0.unpack(J) : Array.isArray(J) ? J : (J && J.items) || []));
        if (prog) { try { prog(1, 1); } catch (e) {} }
        return Promise.resolve(B0.demoItems(Math.max(20, Math.min(1200, +p.b_n || 240)), cfg.seed));
      };
      const h = window.BQShelf.mount(host, {
        cfg, load, key: LSK,
        shop: { open: true },
        cart: { has: () => false, add: () => '리드나우 2 미리 보기 — 장바구니는 우리숍에서', n: () => 0 },
        wish: { get: wishGet, set: wishSet },
        open: (id) => U2.toast('📚 ' + String(id) + ' — 우리숍 책 화면은 우리숍에서', 0),
        toast: (t) => U2.toast(String(t), 0) });
      return () => { try { h && h.destroy && h.destroy(); } catch (e) {} host.remove(); };
    } });
})();

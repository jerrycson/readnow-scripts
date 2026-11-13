/* 리드나우 2 — 위젯 목록을 지금 웹앱에서 '실행 중에' 저절로 뽑음 (설계안 6-2 · 6-3 · 단계 6)
 * 읽는 곳(지금 웹앱 전역 · 읽기만): featIndex()(🔍 기능 찾기 FEAT + 섹션 SECS + 홈 칸) · THIN_SEC·PT_SECS(휴대폰 섹션 고르기 + 받는 자료) · PG_SCR(상세 화면) · WIDGETS·W_DESC(홈 칸)
 *   + 옛 탭을 그릴 때 화면에 나온 details.sec[data-sec](기기에 기억 rn2-seccat — 다녀간 탭의 섹션이 목록에 더해짐)
 * 같은 것 하나로: 기능 찾기 항목이 같은 섹션·화면·홈 칸을 가리키면 그 위젯의 '찾을 낱말'로 묶음
 * 분류 12가지(설계안 6-2) · 메모리 값표(켜면 받음 ≈MB — 지금 웹앱 THIN_DS 값 그대로) · 지난번에 없던 것은 🆕 */
(function () {
  'use strict';
  const U2 = (window.U2 = window.U2 || {});
  const L = () => U2.legacy;
  const g = (n) => (L() && L().list ? L().list(n) : null);
  const CATS = ['🔔 오늘·알림', '🚚 출고·송장', '🧾 주문·매출', '📚 상품·등록', '⚖ 가격·전략', '🛒 매입', '💹 경영·수익', '👤 고객·평판', '🧑‍💼 판매자·시장', '🟦 예스24·다른 판매처', '🤖 수집기·기기·클라우드', '⚙ 설정·도움'];
  const TAB_CAT = { home: 0, search: 7, products: 3, sellers: 8, orders: 2, purchase: 5, biz: 6, market: 8, projects: 11, settings: 11 };
  /* 낱말 규칙(근거: 섹션 id 머리 + 이름 낱말 · 정범님이 고친 분류는 ui2_site.catOverride가 이김) */
  const RULES = [[/출고|송장|택배|ALPS|발송|운송장|수거|합포/, 1], [/예스24|yes24|이중 판매/i, 9], [/가격|전략|추격|판정|수동 일괄|조회수 실험|조건 묶음/, 4], [/매입|매입처|환급|사진 견적/, 5], [/수집|PC|기기|클라우드|로거|자동 수집|관리도구|노선표|데이터 사용량/, 10], [/문의|구매평|고객|응대|평판|가게 성적/, 7], [/판매자|시장|벤치마킹|키워드|규약|출판/, 8], [/매출|주문|반품|정산|부가세|페이스/, 2], [/상품|등록|재고|SKU|라벨|서가|사진|도서/, 3], [/오늘 확인|알림|경고|할 일/, 0], [/설정|설명서|업데이트|백업|보안|책방 친구|프로젝트|휴대폰 앱/, 11]];
  const PFX = { bz: 6, pu: 5, p: 3, pt: 3, o: 2, mg: 10, set: 11, sl: 8, mk: 8, who: 7, pj: 11 };
  const catOf = (key, title, tab) => {
    const ov = (U2.site && U2.site.catOverride) || {}; if (ov[key] != null) { const i = CATS.indexOf(ov[key]); if (i >= 0) return i; }
    for (const [re, i] of RULES) if (re.test(title || '')) return i;
    const pf = String(key || '').split('_')[0]; if (PFX[pf] != null) return PFX[pf];
    return TAB_CAT[tab] != null ? TAB_CAT[tab] : 11;
  };
  const memOf = (tab, id) => { try { if (typeof thinNeedOf !== 'function' || typeof thinMB !== 'function') return null; const ds = thinNeedOf(tab, [id]); return { mb: thinMB(ds), ds: ds.map((d) => (typeof THIN_DS !== 'undefined' && THIN_DS[d] ? THIN_DS[d][0] : d)) }; } catch (e) { return null; } };
  const memAll = (tab) => { try { const T = typeof THIN_SEC !== 'undefined' && THIN_SEC[tab]; if (!T) return null; const ds = thinNeedOf(tab, T.secs.map((x) => x[0])); return { mb: thinMB(ds), ds: ds.map((d) => (typeof THIN_DS !== 'undefined' && THIN_DS[d] ? THIN_DS[d][0] : d)) }; } catch (e) { return null; } };
  const strip = (t) => String(t || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const C = (U2.catalog = { CATS });
  /* 화면에 그려진 섹션 기억(옛 탭 위젯이 그릴 때) */
  C.learn = (root, tab) => { try { const m = U2.ls.get('seccat', {}) || {}; let n = 0; root.querySelectorAll('details.sec[data-sec]').forEach((d) => { const id = d.dataset.sec; const s = d.querySelector(':scope > summary'); const t = strip(s ? s.textContent : id).slice(0, 80); if (!m[id] || m[id].t !== t) { m[id] = { t, tab }; n++; } }); if (n) U2.ls.set('seccat', m); } catch (e) {}
    /* (11/10 정범님 '옮길 때 빠지면 곤란') 섹션(details) 밖 카드·큰 단추·줄도 — 지금 웹앱 ✎ 첫 화면 편집 목록(tobBlocks)과 같은 줄을 그대로 기억 → 서랍에 '🧱 칸' 위젯으로 */
    try { if (typeof tobBlocks !== 'function' || tab === 'home' || tab === 'settings') return; /* 홈은 홈 칸 위젯이 따로 · 설정은 첫 화면 편집 밖 */ const bm = U2.ls.get('blkcat', {}) || {}; let n2 = 0; const bk = (U2.adapters && U2.adapters.blkKey) || ((k) => k); /* (11/10) 상태 글이 섞이던 열쇠는 고정 열쇠로(엔진 상태마다 서랍에 겹쳐 쌓이지 않게) */ tobBlocks(root).forEach((b0) => { if (!/^(#|b:)/.test(b0.k) || /#\d+$/.test(b0.k)) return; const b = { k: bk(b0.k), el: b0.el }; const id = tab + '|' + b.k; Object.keys(bm).forEach((o) => { if (o !== id && o.startsWith(tab + '|') && bk(o.slice(tab.length + 1)) === b.k) { delete bm[o]; n2++; } }); let t = strip(typeof tobLabel === 'function' ? tobLabel(b.el) : b.k).slice(0, 80); if (!/[가-힣A-Za-z]/.test(t)) t = strip(b.el.textContent).replace(/◐/g, '').slice(0, 80); /* 제목이 숫자뿐이면(예: 고객 수 400) 카드 글 전체로 */ if (!bm[id] || bm[id].t !== t) { bm[id] = { t, tab, k: b.k, cov: C.coverOf(tab, b.k, t, b.el) }; n2++; } }); if (n2) { U2.ls.set('blkcat', bm); C.at = 0; } } catch (e) {} };
  /* 칸이 이미 섹션 위젯(휴대폰 고르기 PT_SECS·THIN_X)으로 있는지 — 이름 앞 글자로 견줌(같으면 서랍에 겹쳐 넣지 않음 · 시험 t_parity가 실제로 그려서 다시 확인) */
  const nk = (t) => String(t || '').replace(/<[^>]+>/g, '').replace(/[\s\d,.:%·()\[\]~+\-–—/\\'"!?*×◐●○✳›»—]/g, '').replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu, '');
  const near = (tab, label) => { const a = nk(label).slice(0, 4); if (a.length < 2) return []; return (C.items || C.get()).filter((i) => i.kind === 'sec' && i.tab === tab && !/^(#|b:)/.test(i.key) && (() => { const b = nk(i.title).slice(0, 4); return b.length >= 2 && (a.startsWith(b) || b.startsWith(a)); })()); };
  /* 이름이 비슷한 섹션 위젯을 실제로 그려 그 칸(같은 열쇠)이 나오는지 — 새 칸을 처음 볼 때 한 번만(이름 비슷한 1~2개만 그림) · 확인 못 하면 '안 덮음'(서랍에 넣는 쪽) */
  C.coverOf = (tab, k, label, el) => { try { const X = typeof THIN_X !== 'undefined' ? THIN_X[tab] || [] : []; for (const [id, q] of X) if (id && el && (el.matches(q) || el.querySelector(q))) return id; /* 지금 웹앱 휴대폰 고르기 표(THIN_X)가 가리키는 카드 */
    const A = U2.adapters; if (!A || !A.resolve) return ''; for (const it of near(tab, label)) { const n = A.resolve(tab, [it.key])[it.key]; if (!n) continue; let ks = []; if (n.matches('details.sec[data-sec]')) ks = ['sec:' + n.dataset.sec]; else { const w = document.createElement('div'); w.style.cssText = 'position:absolute;left:-99999px;visibility:hidden;width:1200px'; document.body.appendChild(w); if (n.classList.contains('u2-seccards')) [...n.children].forEach((c) => w.appendChild(c)); else w.appendChild(n); ks = tobBlocks(w).map((b) => b.k); w.remove(); } if (ks.includes(k)) return it.key; } } catch (e) {} return ''; };
  C.build = () => {
    const out = new Map(); const add = (it) => { const k = it.kind + ':' + it.key; const o = out.get(k); if (o) { o.words = (o.words + ' ' + (it.words || '')).slice(0, 600); return o; } it.words = it.words || ''; it.cat = catOf(it.key, it.title, it.tab); out.set(k, it); return it; };
    const TABS = (window.U2W && U2W.TABS) || {};
    Object.entries(TABS).forEach(([k, v]) => add({ kind: 'tab', key: k, tab: k, title: '탭 전체 — ' + v[1], icon: v[0], type: 'legacy.tab', props: { ref: k }, perm: 'tab:' + k }));
    add({ kind: 'dock', key: 'sheet', tab: '', title: '🪟 옛 화면 자리 — 등록·출고 등을 이 칸 안에(페이지로 박기)', desc: '옛 상세 화면이 이 칸 안에 열림 · 한 번에 하나', icon: '🪟', type: 'legacy.dock', props: { title: '옛 화면 자리', scrs: 'register,ship' }, perm: '', phone: false });
    const secAdd = (id, title, tab, desc) => { if (!id || id === 'all' || id === 'prod') return; const m = memOf(tab, id); add({ kind: 'sec', key: id, tab, title: strip(title), desc: strip(desc), icon: '🧩', type: 'legacy.sec', props: { ref: id, tab }, perm: 'sec:' + id, mem: m, phone: !!(m && m.mb === 0) }); };
    const TS = g('THIN_SEC') || (typeof THIN_SEC !== 'undefined' ? THIN_SEC : null); if (TS) Object.entries(TS).forEach(([tab, T]) => (T.secs || []).forEach((x) => secAdd(x[0], x[1], tab, x[2])));
    try { if (typeof PT_SECS !== 'undefined') PT_SECS.forEach((x) => secAdd(x[0], x[1], 'products', x[2])); } catch (e) {}
    let FI = null; try { FI = typeof featIndex === 'function' ? featIndex() : g('FEAT'); } catch (e) { FI = g('FEAT'); }
    const learned = U2.ls.get('seccat', {}) || {}; Object.entries(learned).forEach(([id, v]) => secAdd(id, v.t, v.tab, '화면에서 찾은 섹션'));
    { const cur = [...out.values()]; const bl = U2.ls.get('blkcat', {}) || {}; Object.values(bl).forEach((v) => { if (!v || !v.k || !v.tab || (v.cov && cur.some((i) => i.kind === 'sec' && i.key === v.cov))) return; /* 이미 섹션 위젯이 그 칸을 그리면 겹쳐 넣지 않음 */ const m = memAll(v.tab); /* 탭을 통째로 그려 떼어 내므로 그 탭 자료 전부 */ add({ kind: 'sec', key: v.k, tab: v.tab, title: strip(v.t), desc: '탭 첫 화면 칸 — 지금 웹앱 ✎ 첫 화면 편집의 줄 그대로(화면에서 찾음)', icon: '🧱', type: 'legacy.sec', props: { ref: v.k, tab: v.tab }, perm: 'sec:' + v.k, mem: m, phone: false, blk: true }); }); }
    const Wd = g('WIDGETS'), D = g('W_DESC') || {};
    if (Wd) Object.keys(Wd).forEach((k) => add({ kind: 'home', key: k, tab: 'home', title: strip(Wd[k][0]), desc: D[k] || '', icon: '🏠', type: 'legacy.homecard', props: { ref: k }, perm: 'home:' + k, phone: true }));
    const P = g('PG_SCR'); if (P) P.forEach((r) => { const fn = window[r[3]]; if (typeof fn !== 'function') return; add({ kind: 'screen', key: r[0], tab: '', title: strip(r[1]), desc: (U2.legacy.needsArg ? U2.legacy.needsArg(r[0]) : fn.length) ? '열려면 대상이 필요함(상세 화면 안에서만)' : '상세 화면 열기', icon: '🪟', type: 'legacy.screen', props: { scr: r[0] }, perm: 'screen:' + r[0], needsArg: U2.legacy.needsArg ? U2.legacy.needsArg(r[0]) : fn.length > 0, phone: true }); });
    /* 기능 찾기 — 섹션·홈 칸·화면을 가리키면 그 위젯의 별칭(찾을 낱말)으로, 아니면 기능 단추 */
    const scrByFn = new Map((P || []).map((r) => [r[3], r[0]]));
    if (FI) FI.forEach((f) => {
      const go = f.go || {}; const words = strip(f.t + ' ' + (f.k || '') + ' ' + (f.w || ''));
      if (go.sec) { const ex = out.get('sec:' + go.sec); if (ex) { ex.words += ' ' + words; return; } secAdd(go.sec, f.t, go.tab, f.w); const it = out.get('sec:' + go.sec); if (it) it.words += ' ' + words; return; }
      if (go.sel && /^#wc_/.test(go.sel)) { const ex = out.get('home:' + go.sel.slice(4)); if (ex) { ex.words += ' ' + words; return; } }
      let fnName = null; try { const m = /^\s*\(\)\s*=>\s*(?:\{\s*)?(open\w+)\(\)\s*;?\s*\}?\s*$/.exec(String(go.fn || '')); fnName = m && m[1]; } catch (e) {}
      if (fnName && scrByFn.has(fnName)) { const ex = out.get('screen:' + scrByFn.get(fnName)); if (ex) { ex.words += ' ' + words; return; } }
      if (go.tab && !go.sec && !go.fn) { const ex = out.get('tab:' + go.tab); if (ex) { ex.words += ' ' + words; return; } }
      add({ kind: 'feat', key: f.t, tab: go.tab || '', title: strip(f.t), desc: strip(f.w), icon: '🔧', type: 'legacy.feat', props: { feat: f.t }, perm: 'feat:' + f.t, words: words, phone: true });
    });
    /* 🆕 — 지난번 목록에 없던 것 */
    const seen = new Set(U2.ls.get('catseen', []) || []); const first = !seen.size; const keys = [...out.keys()];
    out.forEach((it, k) => { it.isNew = !first && !seen.has(k); });
    U2.ls.set('catseen', keys);
    C.items = [...out.values()]; C.at = Date.now(); return C.items;
  };
  C.get = () => (C.items && Date.now() - C.at < 60e3 ? C.items : C.build());
  C.count = () => { const c = {}; C.get().forEach((i) => (c[i.kind] = (c[i.kind] || 0) + 1)); return c; };
  /* 메모리 예산 막대(E1 ★): 이 페이지 옛 위젯이 받는 자료 합(같은 자료는 한 번) */
  C.pageMem = (pg) => { const ds = new Set(); let unknown = 0; Object.values(pg.widgets || {}).forEach((w) => { const p = w.props || {}; let tab = null, id = null; if (w.type === 'legacy.sec') { tab = p.tab; id = p.ref; } else if (w.type === 'legacy.tab') { try { if (typeof THIN_SEC !== 'undefined' && THIN_SEC[p.ref]) { (THIN_SEC[p.ref].need || []).forEach((d) => ds.add(d)); THIN_SEC[p.ref].secs.forEach((x) => (x[3] || []).forEach((d) => ds.add(d))); } else if (['products', 'sellers', 'market'].includes(p.ref)) unknown++; } catch (e) {} return; } if (tab && id) { try { thinNeedOf(tab, [id]).forEach((d) => ds.add(d)); } catch (e) {} } }); let mb = 0; try { mb = thinMB([...ds]); } catch (e) {} return { mb, ds: [...ds], unknown }; };
  C.PHONE_MB = 350; /* 설계안 8-1 휴대폰 기본 배치 예산 */
})();

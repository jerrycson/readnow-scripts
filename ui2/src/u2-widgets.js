/* 리드나우 2 — 위젯 (설계안 6-1 기본 UI 위젯 · 6-2 리드나우 기능 위젯 일부)
 * 위젯 하나 = U2W.def('종류', { name, group, icon, w, h(기본 크기 — 24칸 기준), minW, minH, props:[속성], render(body, p, ctx) → 정리 함수(있으면) })
 * 모든 위젯은 자기 몸(.u2-b) 안에만 그림 · id를 쓰지 않음(같은 위젯 여럿이어도 id 겹침 0) · 타이머는 정리 함수에서 꼭 멈춤
 * 기기에만 두는 값(체크·별점·메모)은 rn2- 열쇠 · 실제 자료를 바꾸는 쓰기는 하지 않음(시범 중 읽기만 — Q3 ①)
 * 옛 기능 위젯(legacy.*)은 지금 웹앱 함수를 그대로 부름 — 쓰기는 u2-guard가 위젯 종류별 허락으로 거름 */
(function () {
  'use strict';
  const U2 = (window.U2 = window.U2 || {});
  const esc = (s) => U2.esc(s);
  const W = (window.U2W = { defs: {}, order: [] });
  W.def = (type, d) => { d.type = type; if (!W.defs[type]) W.order.push(type); W.defs[type] = d; };
  W.GROUPS = ['글·그림', '단추·링크', '틀', '자료 보기', '입력', '기타', '리드나우 기능'];
  const lines = (t) => String(t || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const num = (v) => { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; };
  /* 행동(설계안 5-4 일부): 페이지로·링크·알림·복사·옛 기능 실행·옛 화면 열기 — 확인이 필요하면 두 번 누르기 */
  /* 행동은 u2-actions.js(단계 5) — 여기서는 속성 칸만 가져옴 */
  W.ACTS = U2.actions.opts();
  const ACT_PROPS = U2.actions.PROPS();
  const actOf = (p) => ({ do: p.act, arg: p.arg, confirm: p.confirm });
  const linkAttr = (p) => (p.act === 'link' && /^https?:\/\//.test(p.arg || '') ? ` href="${esc(p.arg)}" target="${p.newTab ? '_blank' : '_self'}" rel="noopener"` : '');
  const btnHtml = (p, cls) => (p.act === 'link' ? `<a class="u2-btn ${cls || ''}"${linkAttr(p)}>${esc(p.icon || '')} ${esc(p.label || '')}</a>` : `<button type="button" class="u2-btn ${cls || ''}">${esc(p.icon || '')} ${esc(p.label || '')}</button>`);
  const wireBtn = (body, p, ctx) => { body.querySelectorAll('button.u2-btn').forEach((b) => (b.onclick = () => !ctx.edit && U2.actions.fire(p, b, ctx))); };

  /* ═══ 글·그림 (10) ═══ */
  W.def('heading', { name: '제목', group: '글·그림', icon: '🔠', w: 12, h: 3, props: [{ k: 'text', label: '글', type: 'text', def: '제목' }, { k: 'size', label: '크기', type: 'select', opts: { s: '작게', m: '보통', l: '크게', xl: '아주 크게' }, def: 'l' }, { k: 'align', label: '맞춤', type: 'select', opts: { left: '왼쪽', center: '가운데', right: '오른쪽' }, def: 'left' }],
    render(b, p) { b.innerHTML = `<div class="u2-h u2-h-${esc(p.size)}" style="text-align:${esc(p.align)}">${esc(p.text)}</div>`; } });
  /* 짧은 서식: **굵게** · *기울임* · [글](주소) */
  const rich = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener">$1</a>').replace(/\n/g, '<br>');
  W.rich = rich;
  W.def('text', { name: '문구', group: '글·그림', icon: '📝', w: 8, h: 5, props: [{ k: 'text', label: '글 (**굵게** *기울임* [글](주소))', type: 'area', def: '여기에 글을 쓰세요' }], render(b, p) { b.innerHTML = `<div class="u2-txt">${rich(p.text)}</div>`; } });
  W.def('image', { name: '그림', group: '글·그림', icon: '🖼', w: 6, h: 10, props: [{ k: 'src', label: '그림 주소(https)', type: 'text', def: '' }, { k: 'alt', label: '설명 글', type: 'text', def: '' }, { k: 'fit', label: '맞춤', type: 'select', opts: { cover: '꽉 채움', contain: '다 보이게' }, def: 'cover' }],
    render(b, p) { b.innerHTML = /^https:\/\//.test(p.src || '') ? `<img class="u2-img" alt="${esc(p.alt)}" src="${esc(p.src)}" style="object-fit:${esc(p.fit)}" loading="lazy">` : `<div class="u2-empty">🖼 그림 주소를 넣으세요</div>`; } });
  W.def('icon', { name: '아이콘', group: '글·그림', icon: '⭐', w: 2, h: 4, props: [{ k: 'icon', label: '아이콘', type: 'icon', def: '⭐' }, { k: 'size', label: '크기(px)', type: 'number', def: 32 }], render(b, p) { b.innerHTML = `<div class="u2-ico" style="font-size:${Math.max(10, Math.min(200, num(p.size)))}px">${esc(p.icon)}</div>`; } });
  W.def('badge', { name: '배지', group: '글·그림', icon: '🏷', w: 3, h: 3, props: [{ k: 'text', label: '글', type: 'text', def: '새 소식' }, { k: 'tone', label: '색', type: 'select', opts: { cloth: '초록', red: '빨강', amber: '주황', gold: '금색', sub: '회색' }, def: 'cloth' }], render(b, p) { b.innerHTML = `<span class="u2-badge u2-t-${esc(p.tone)}">${esc(p.text)}</span>`; } });
  W.def('divider', { name: '구분선', group: '글·그림', icon: '➖', w: 24, h: 3, minH: 1, props: [{ k: 'style', label: '모양', type: 'select', opts: { solid: '실선', dashed: '점선', double: '두 줄' }, def: 'solid' }], render(b, p) { b.innerHTML = `<hr class="u2-hr" style="border-top-style:${esc(p.style)}">`; } });
  W.def('spacer', { name: '빈칸', group: '글·그림', icon: '⬜', w: 4, h: 2, props: [], render(b, p, ctx) { b.innerHTML = ctx.edit ? '<div class="u2-empty">빈칸</div>' : ''; } });
  W.def('pattern', { name: '무늬 바탕', group: '글·그림', icon: '🟩', w: 8, h: 6, props: [{ k: 'pat', label: '무늬', type: 'select', opts: { dots: '점', lines: '줄', grid: '격자', paper: '종이결', grad: '그라데이션' }, def: 'dots' }, { k: 'text', label: '글(있으면)', type: 'text', def: '' }],
    render(b, p) { b.innerHTML = `<div class="u2-patbox" style="background:${U2.theme.pattern(p.pat)}"><span>${esc(p.text)}</span></div>`; } });
  W.def('quote', { name: '인용', group: '글·그림', icon: '❝', w: 8, h: 5, props: [{ k: 'text', label: '글', type: 'area', def: '좋은 책은 다시 팔린다' }, { k: 'who', label: '누가', type: 'text', def: '' }], render(b, p) { b.innerHTML = `<blockquote class="u2-quote">${rich(p.text)}${p.who ? `<cite>— ${esc(p.who)}</cite>` : ''}</blockquote>`; } });
  W.def('code', { name: '코드·메모 글', group: '글·그림', icon: '⌨', w: 8, h: 6, props: [{ k: 'text', label: '글(고정폭)', type: 'area', def: '메모' }], render(b, p) { b.innerHTML = `<pre class="u2-pre">${esc(p.text)}</pre>`; } });

  /* ═══ 단추·링크 (7) ═══ */
  W.def('button', { name: '단추', group: '단추·링크', icon: '🔘', w: 4, h: 3, props: [{ k: 'label', label: '글', type: 'text', def: '단추' }, { k: 'icon', label: '아이콘', type: 'icon', def: '' }, ...ACT_PROPS, { k: 'newTab', label: '바깥 주소는 새 탭', type: 'check', def: false }, { k: 'tone', label: '모양', type: 'select', opts: { pri: '진하게', plain: '옅게', red: '빨강' }, def: 'pri' }],
    render(b, p, ctx) { b.innerHTML = `<div class="u2-fill">${btnHtml(p, 'u2-' + p.tone)}</div>`; wireBtn(b, p, ctx); } });
  W.def('btngroup', { name: '단추 묶음', group: '단추·링크', icon: '🔘', w: 10, h: 4, props: [{ k: 'items', label: '단추(한 줄에 하나: 글 | 페이지 id)', type: 'area', def: '홈 | home\n주문 | orders' }],
    render(b, p, ctx) { b.innerHTML = `<div class="u2-row">${lines(p.items).map((l) => { const [t, pg] = l.split('|').map((s) => s.trim()); return `<button type="button" class="u2-btn" data-pg="${esc(pg || '')}">${esc(t)}</button>`; }).join('')}</div>`; b.querySelectorAll('[data-pg]').forEach((x) => (x.onclick = () => !ctx.edit && x.dataset.pg && U2.go(x.dataset.pg))); } });
  W.def('link', { name: '링크', group: '단추·링크', icon: '🔗', w: 4, h: 3, props: [{ k: 'label', label: '글', type: 'text', def: '링크' }, { k: 'url', label: '주소(https) 또는 페이지 id', type: 'text', def: '' }, { k: 'newTab', label: '새 탭', type: 'check', def: false }],
    render(b, p, ctx) { const ext = /^https?:\/\//.test(p.url || ''); b.innerHTML = ext ? `<a class="u2-link" href="${esc(p.url)}" target="${p.newTab ? '_blank' : '_self'}" rel="noopener">${esc(p.label)} ›</a>` : `<a class="u2-link" href="?p=${encodeURIComponent(p.url || '')}" data-pg="${esc(p.url || '')}">${esc(p.label)} ›</a>`; const a = b.querySelector('[data-pg]'); if (a) a.onclick = (e) => { e.preventDefault(); if (!ctx.edit) U2.go(a.dataset.pg); }; } });
  W.def('iconbtn', { name: '아이콘 단추', group: '단추·링크', icon: '⚪', w: 2, h: 3, props: [{ k: 'icon', label: '아이콘', type: 'icon', def: '🔍' }, { k: 'label', label: '설명(읽어 주는 글)', type: 'text', def: '찾기' }, ...ACT_PROPS],
    render(b, p, ctx) { b.innerHTML = `<div class="u2-fill"><button type="button" class="u2-btn u2-round" aria-label="${esc(p.label)}">${esc(p.icon)}</button></div>`; wireBtn(b, p, ctx); } });
  W.def('cardbtn', { name: '큰 카드 단추', group: '단추·링크', icon: '🃏', w: 6, h: 6, props: [{ k: 'icon', label: '아이콘', type: 'icon', def: '🚚' }, { k: 'label', label: '제목', type: 'text', def: '오늘 출고' }, { k: 'sub', label: '한 줄 설명', type: 'text', def: '' }, ...ACT_PROPS],
    render(b, p, ctx) { b.innerHTML = `<button type="button" class="u2-btn u2-cardbtn"><span class="u2-cb-i">${esc(p.icon)}</span><b>${esc(p.label)}</b><small>${esc(p.sub)}</small></button>`; wireBtn(b, p, ctx); } });
  W.def('switch', { name: '스위치', group: '단추·링크', icon: '🎚', w: 5, h: 4, props: [{ k: 'label', label: '글', type: 'text', def: '켜기' }, { k: 'var', label: '변수 이름(이 기기)', type: 'text', def: '켜짐' }],
    render(b, p, ctx) { const k = 'var-' + p.var; const on = !!U2.ls.get(k, false); b.innerHTML = `<label class="u2-sw"><input type="checkbox" ${on ? 'checked' : ''}><span></span>${esc(p.label)}</label>`; b.querySelector('input').onchange = (e) => { U2.ls.set(k, e.target.checked); U2.vars[p.var] = e.target.checked; U2.toast(p.label + (e.target.checked ? ' 켬' : ' 끔')); }; } });
  W.def('fab', { name: '떠 있는 단추', group: '단추·링크', icon: '➕', w: 2, h: 3, float: true, props: [{ k: 'icon', label: '아이콘', type: 'icon', def: '➕' }, { k: 'label', label: '설명', type: 'text', def: '빠른 일' }, ...ACT_PROPS],
    render(b, p, ctx) { b.innerHTML = ctx.edit ? `<div class="u2-empty">떠 있는 단추 ${esc(p.icon)} (보기 모드에서 화면 오른쪽 아래)</div>` : `<button type="button" class="u2-btn u2-fab" aria-label="${esc(p.label)}">${esc(p.icon)}</button>`; wireBtn(b, p, ctx); } });

  /* ═══ 틀 (13) — '묶음 칸(위젯 안 격자)'은 다음 단계 ═══ */
  W.def('card', { name: '카드', group: '틀', icon: '🗂', w: 8, h: 8, props: [{ k: 'title', label: '제목', type: 'text', def: '카드' }, { k: 'text', label: '내용', type: 'area', def: '' }, { k: 'foot', label: '아래 줄', type: 'text', def: '' }],
    render(b, p) { b.innerHTML = `<div class="u2-card"><div class="u2-ct">${esc(p.title)}</div><div class="u2-txt">${rich(p.text)}</div>${p.foot ? `<div class="u2-cf">${esc(p.foot)}</div>` : ''}</div>`; } });
  W.def('accordion', { name: '접기', group: '틀', icon: '🔽', w: 8, h: 8, props: [{ k: 'items', label: '칸(제목 줄 다음에 내용 · 칸 사이는 ---)', type: 'area', def: '첫째\n내용\n---\n둘째\n내용' }, { k: 'one', label: '하나만 펼침', type: 'check', def: true }],
    render(b, p) { const parts = String(p.items || '').split(/\n-{3,}\n/); b.innerHTML = parts.map((x) => { const [t, ...r] = x.split('\n'); return `<details class="u2-acc"><summary>${esc(t)}</summary><div class="u2-txt">${rich(r.join('\n'))}</div></details>`; }).join(''); if (p.one) b.querySelectorAll('details').forEach((d) => d.addEventListener('toggle', () => { if (d.open) b.querySelectorAll('details').forEach((o) => o !== d && (o.open = false)); })); } });
  W.def('tabs', { name: '탭', group: '틀', icon: '📑', w: 10, h: 8, props: [{ k: 'items', label: '탭(제목 줄 다음에 내용 · 탭 사이는 ---)', type: 'area', def: '하나\n첫 탭 내용\n---\n둘\n둘째 탭 내용' }],
    render(b, p) { const parts = String(p.items || '').split(/\n-{3,}\n/).map((x) => { const [t, ...r] = x.split('\n'); return [t, r.join('\n')]; }); b.innerHTML = `<div class="u2-tabh" role="tablist">${parts.map(([t], i) => `<button type="button" role="tab" class="${i ? '' : 'on'}" data-i="${i}">${esc(t)}</button>`).join('')}</div><div class="u2-tabb u2-txt"></div>`; const show = (i) => { b.querySelector('.u2-tabb').innerHTML = rich(parts[i][1]); b.querySelectorAll('[data-i]').forEach((x) => x.classList.toggle('on', +x.dataset.i === i)); }; b.querySelectorAll('[data-i]').forEach((x) => (x.onclick = () => show(+x.dataset.i))); show(0); } });
  /* 서랍·모달 블록: 화면 안 층(브라우저 창 아님) */
  const layer = (cls, title, html) => { const L = document.createElement('div'); L.className = 'u2-layer ' + cls; L.innerHTML = `<div class="u2-lbox" role="dialog" aria-modal="true"><div class="u2-lhead"><b>${esc(title)}</b><button type="button" class="u2-btn" data-x>닫기</button></div><div class="u2-lbody u2-txt">${html}</div></div>`; const close = () => { L.remove(); document.removeEventListener('keydown', kd, true); }; const kd = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } }; L.querySelector('[data-x]').onclick = close; L.onclick = (e) => { if (e.target === L) close(); }; document.addEventListener('keydown', kd, true); (U2.$('.u2-root') || document.body).appendChild(L); return L; };
  W.layer = layer;
  W.h = { esc, lines, num, rich, layer }; /* 늦게 받는 위젯 파일이 같은 도구를 씀 */
  W.def('drawer', { name: '서랍', group: '틀', icon: '🗄', w: 4, h: 3, props: [{ k: 'label', label: '단추 글', type: 'text', def: '서랍 열기' }, { k: 'side', label: '나오는 쪽', type: 'select', opts: { right: '오른쪽', left: '왼쪽', bottom: '아래' }, def: 'right' }, { k: 'title', label: '서랍 제목', type: 'text', def: '서랍' }, { k: 'text', label: '내용', type: 'area', def: '' }],
    render(b, p, ctx) { b.innerHTML = `<div class="u2-fill"><button type="button" class="u2-btn">${esc(p.label)}</button></div>`; b.querySelector('button').onclick = () => !ctx.edit && layer('u2-drawer u2-d-' + p.side, p.title, rich(p.text)); } });
  W.def('modal', { name: '모달 블록', group: '틀', icon: '🪟', w: 4, h: 3, props: [{ k: 'label', label: '단추 글', type: 'text', def: '자세히' }, { k: 'title', label: '제목', type: 'text', def: '안내' }, { k: 'text', label: '내용', type: 'area', def: '' }],
    render(b, p, ctx) { b.innerHTML = `<div class="u2-fill"><button type="button" class="u2-btn">${esc(p.label)}</button></div>`; b.querySelector('button').onclick = () => !ctx.edit && layer('u2-modal', p.title, rich(p.text)); } });
  const navList = () => (U2.site && U2.site.nav) || [];
  const navBtns = (cls, cur) => navList().filter((n) => !n.hide).map((n) => `<button type="button" class="${cls} ${n.id === cur ? 'on' : ''}" data-pg="${esc(n.id)}">${esc(n.icon || '')} ${esc(n.title)}</button>`).join('');
  const wirePg = (b, ctx) => b.querySelectorAll('[data-pg]').forEach((x) => (x.onclick = (e) => { e.preventDefault(); if (!ctx.edit && x.dataset.pg) U2.go(x.dataset.pg); }));
  W.def('header', { name: '머리줄', group: '틀', icon: '🔝', w: 24, h: 4, props: [{ k: 'title', label: '제목', type: 'text', def: '리드나우' }, { k: 'sub', label: '작은 글', type: 'text', def: '' }], render(b, p) { b.innerHTML = `<div class="u2-headw"><b>${esc(p.title)}</b><small>${esc(p.sub)}</small></div>`; } });
  W.def('footer', { name: '바닥줄', group: '틀', icon: '🔚', w: 24, h: 3, props: [{ k: 'text', label: '글', type: 'text', def: '북스킹 · 리드나우' }], render(b, p) { b.innerHTML = `<div class="u2-footw">${rich(p.text)}</div>`; } });
  W.def('hamburger', { name: '햄버거 메뉴', group: '틀', icon: '☰', w: 2, h: 3, props: [], render(b, p, ctx) { b.innerHTML = `<div class="u2-fill"><button type="button" class="u2-btn u2-round" aria-label="메뉴">☰</button></div>`; b.querySelector('button').onclick = () => { if (ctx.edit) return; const L = layer('u2-drawer u2-d-left', '메뉴', `<div class="u2-col">${navBtns('u2-btn', ctx.page)}</div>`); wirePg(L, ctx); L.querySelectorAll('[data-pg]').forEach((x) => x.addEventListener('click', () => L.remove())); }; } });
  W.def('breadcrumb', { name: '지금 자리(브레드크럼)', group: '틀', icon: '🧭', w: 12, h: 3, props: [], render(b, p, ctx) { const pg = navList().find((n) => n.id === ctx.page); b.innerHTML = `<nav class="u2-crumb"><a href="?p=home" data-pg="home">홈</a>${pg && pg.id !== 'home' ? ` › <b>${esc(pg.title)}</b>` : ''}</nav>`; wirePg(b, ctx); } });
  W.def('tabbar', { name: '탭 줄', group: '틀', icon: '🗂', w: 24, h: 4, props: [], render(b, p, ctx) { b.innerHTML = `<div class="u2-row u2-tabbar">${navBtns('u2-btn', ctx.page)}</div>`; wirePg(b, ctx); } });
  W.def('sidemenu', { name: '옆 메뉴', group: '틀', icon: '📚', w: 4, h: 38, /* (0.4.7) 지금 웹앱 탭 12개(1.78.481 nav1) + 설정·할 일 = 14줄 */ props: [], render(b, p, ctx) { b.innerHTML = `<div class="u2-col">${navBtns('u2-btn', ctx.page)}</div>`; wirePg(b, ctx); } });
  W.def('dock', { name: '독(늘 보이는 줄)', group: '틀', icon: '⚓', w: 24, h: 6, props: [{ k: 'items', label: '페이지 id(쉼표)', type: 'text', def: 'home, orders, products' }], render(b, p, ctx) { const ids = String(p.items || '').split(',').map((s) => s.trim()).filter(Boolean); b.innerHTML = `<div class="u2-row u2-dock">${ids.map((id) => { const n = navList().find((x) => x.id === id) || { id, title: id }; return `<button type="button" class="u2-btn" data-pg="${esc(id)}">${esc(n.icon || '')}<small>${esc(n.title)}</small></button>`; }).join('')}</div>`; wirePg(b, ctx); } });
  W.def('folder', { name: '폴더', group: '틀', icon: '📁', w: 4, h: 4, props: [{ k: 'label', label: '이름', type: 'text', def: '자주 가는 곳' }, { k: 'items', label: '안에 든 것(글 | 페이지 id 또는 https 주소)', type: 'area', def: '주문 | orders\n상품 | products' }],
    render(b, p, ctx) { b.innerHTML = `<div class="u2-fill"><button type="button" class="u2-btn u2-folder">📁 ${esc(p.label)}</button></div>`; b.querySelector('button').onclick = () => { if (ctx.edit) return; const L = layer('u2-modal', p.label, `<div class="u2-col">${lines(p.items).map((l) => { const [t, g] = l.split('|').map((s) => s.trim()); return /^https?:\/\//.test(g || '') ? `<a class="u2-btn" href="${esc(g)}" rel="noopener">${esc(t)}</a>` : `<button type="button" class="u2-btn" data-pg="${esc(g || '')}">${esc(t)}</button>`; }).join('')}</div>`); wirePg(L, ctx); L.querySelectorAll('[data-pg]').forEach((x) => x.addEventListener('click', () => L.remove())); }; } });

  /* ═══ 자료 보기 (10) — 지금은 속성에 적은 값으로(자료 연결은 5단계 u2-data) ═══ */
  W.def('kpi', { name: '숫자 카드', group: '자료 보기', icon: '🔢', w: 4, h: 5, props: [{ k: 'label', label: '이름', type: 'text', def: '오늘 주문' }, { k: 'value', label: '값', type: 'text', def: '0' }, { k: 'prev', label: '전 값(견줌 ▲▼)', type: 'text', def: '' }, { k: 'unit', label: '단위', type: 'text', def: '건' }, { k: 'warnOver', label: '이 값보다 크면 빨강', type: 'text', def: '' }],
    render(b, p) { const v = num(p.value), pv = p.prev === '' ? null : num(p.prev); const d = pv == null ? '' : v > pv ? `<span class="u2-up">▲ ${(v - pv).toLocaleString()}</span>` : v < pv ? `<span class="u2-dn">▼ ${(pv - v).toLocaleString()}</span>` : '<span class="u2-sub">＝</span>'; const warn = p.warnOver !== '' && p.warnOver != null && v > num(p.warnOver); b.innerHTML = `<div class="u2-kpi ${warn ? 'u2-warn' : ''}"><small>${esc(p.label)}</small><b>${esc(String(p.value))}<span class="u2-unit">${esc(p.unit)}</span></b>${d}</div>`; } });
  const csv = (t) => lines(t).map((l) => l.split(',').map((s) => s.trim()));
  W.def('table', { name: '표', group: '자료 보기', icon: '📋', w: 12, h: 12, minW: 4, minH: 4, props: [{ k: 'data', label: '자료(쉼표로 칸 · 첫 줄은 머리)', type: 'area', def: '책,권수,금액\n가,3,12000\n나,1,4500' }, { k: 'pageN', label: '한 쪽 줄 수', type: 'number', def: 20 }],
    render(b, p) { const rows = csv(p.data); const head = rows.shift() || []; let sk = -1, rev = false, pg = 0; const n = Math.max(1, num(p.pageN) || 20);
      const draw = () => { const r = rows.slice(); if (sk >= 0) r.sort((a, c) => { const x = a[sk], y = c[sk]; const nx = parseFloat(x), ny = parseFloat(y); const o = isFinite(nx) && isFinite(ny) ? nx - ny : String(x).localeCompare(String(y), 'ko'); return rev ? -o : o; }); const pages = Math.max(1, Math.ceil(r.length / n)); pg = Math.min(pg, pages - 1);
        b.innerHTML = `<div class="u2-tblw"><table class="u2-tbl"><thead><tr>${head.map((h, i) => `<th data-k="${i}" aria-sort="${sk === i ? (rev ? 'descending' : 'ascending') : 'none'}">${esc(h)}${sk === i ? (rev ? ' ▼' : ' ▲') : ''}</th>`).join('')}</tr></thead><tbody>${r.slice(pg * n, pg * n + n).map((x) => `<tr>${x.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${pages > 1 ? `<div class="u2-pager"><button type="button" class="u2-btn" data-pv>‹</button> ${pg + 1} / ${pages} <button type="button" class="u2-btn" data-nx>›</button></div>` : ''}`;
        b.querySelectorAll('th').forEach((th) => (th.onclick = () => { const k = +th.dataset.k; if (sk === k) rev = !rev; else { sk = k; rev = false; } draw(); })); const pv = b.querySelector('[data-pv]'), nx = b.querySelector('[data-nx]'); if (pv) pv.onclick = () => { pg = Math.max(0, pg - 1); draw(); }; if (nx) nx.onclick = () => { pg++; draw(); }; };
      draw(); } });
  W.def('list', { name: '목록', group: '자료 보기', icon: '📃', w: 6, h: 8, props: [{ k: 'items', label: '줄마다 하나', type: 'area', def: '첫째\n둘째\n셋째' }, { k: 'more', label: '처음 보일 수(더 보기)', type: 'number', def: 10 }],
    render(b, p) { const all = lines(p.items); let n = Math.max(1, num(p.more) || 10); const draw = () => { b.innerHTML = `<ul class="u2-list">${all.slice(0, n).map((x) => `<li>${rich(x)}</li>`).join('')}</ul>${all.length > n ? `<button type="button" class="u2-btn" data-more>더 보기 · ${Math.min(10, all.length - n)}개 더 (남은 ${all.length - n})</button>` : ''}`; const m = b.querySelector('[data-more]'); if (m) m.onclick = () => { n += 10; draw(); }; }; draw(); } });





  W.def('u2plan', { name: '새 웹앱 전체 일정', group: '자료 보기', icon: '🗓', w: 24, h: 6, minW: 6, minH: 3, props: [],
    render(b) { /* 설계안 단계 0~13 한 줄 막대 — 누르면 단계마다 예상·실제 시간과 진행 막대(U2.planScreen) */
      b.innerHTML = '<div class="u2-empty">🗓 일정 받는 중…</div>'; let dead = false;
      const draw = (P) => { if (dead) return; if (!P || !P.stages) { b.innerHTML = '<div class="u2-empty">일정 표를 받지 못함</div>'; return; } const T = U2.planSum(P); b.innerHTML = `<button type="button" class="u2-pl-mini" data-plan><span>🗓 <b>새 웹앱 일정</b> ${T.pct}% · 끝 ${T.cnt.done}/${T.n} · 🙋 정범님 필요 ${T.cnt.boss}${T.cur ? ' · 지금 ' + T.cur.n + '단계 ' + esc(T.cur.name) : ''}</span><span class="u2-pl-bar"><i style="width:${T.pct}%"></i></span><small class="u2-sub">눌러서 단계마다 보기 ›</small></button>`; b.querySelector('[data-plan]').onclick = () => U2.planScreen && U2.planScreen(); };
      const go = () => (U2._plan ? Promise.resolve(U2._plan) : U2.loadPlan ? U2.loadPlan() : Promise.resolve(null)).then(draw).catch(() => draw(null));
      go(); const iv = setInterval(() => { if (U2._plan) draw(U2._plan); }, 60e3);
      return () => { dead = true; clearInterval(iv); };
    } });
  W.def('progress', { name: '진행 막대', group: '자료 보기', icon: '⏳', w: 8, h: 4, props: [{ k: 'label', label: '이름', type: 'text', def: '오늘 출고' }, { k: 'value', label: '값', type: 'number', def: 3 }, { k: 'max', label: '전체', type: 'number', def: 10 }],
    render(b, p) { const f = Math.max(0, Math.min(1, num(p.value) / (num(p.max) || 1))); b.innerHTML = `<div class="u2-prog"><small>${esc(p.label)} ${num(p.value)} / ${num(p.max)}</small><div class="u2-pbar" role="progressbar" aria-valuenow="${num(p.value)}" aria-valuemax="${num(p.max)}"><i style="width:${(f * 100).toFixed(1)}%"></i></div></div>`; } });
  W.def('meter', { name: '계기판', group: '자료 보기', icon: '🎛', w: 8, h: 4, props: [{ k: 'label', label: '이름', type: 'text', def: '재고 건강' }, { k: 'value', label: '값(0~100)', type: 'number', def: 62 }, { k: 'warn', label: '주의 아래', type: 'number', def: 40 }, { k: 'bad', label: '나쁨 아래', type: 'number', def: 20 }],
    render(b, p) { const v = num(p.value), tone = v < num(p.bad) ? 'red' : v < num(p.warn) ? 'amber' : 'cloth'; b.innerHTML = `<div class="u2-prog"><small>${esc(p.label)} <b class="u2-t-${tone}">${v}</b></small><div class="u2-pbar u2-meter"><i class="u2-bg-${tone}" style="width:${Math.max(0, Math.min(100, v))}%"></i></div></div>`; } });

  /* ═══ 입력 (7) — 값은 이 기기(rn2-)나 페이지 변수(U2.vars)에만 ═══ */
  U2.vars = U2.vars || {};
  const varIn = (b, p, sel, ev) => { const el = b.querySelector(sel); if (!el) return; el.addEventListener(ev || 'input', () => { U2.vars[p.var || 'v'] = el.type === 'checkbox' ? el.checked : el.value; U2.emit('vars', U2.vars); }); };
  W.def('search', { name: '찾기 칸', group: '입력', icon: '🔍', w: 8, h: 4, props: [{ k: 'ph', label: '자리 글', type: 'text', def: '찾기' }, { k: 'var', label: '변수 이름', type: 'text', def: '찾기' }], render(b, p) { b.innerHTML = `<input type="search" class="u2-in" placeholder="${esc(p.ph)}" aria-label="${esc(p.ph)}">`; varIn(b, p, 'input'); } });
  W.def('select', { name: '고르기', group: '입력', icon: '🔽', w: 5, h: 5, props: [{ k: 'label', label: '이름', type: 'text', def: '판매처' }, { k: 'opts', label: '고를 것(쉼표)', type: 'text', def: '전체, 알라딘, 예스24' }, { k: 'var', label: '변수 이름', type: 'text', def: '판매처' }],
    render(b, p) { b.innerHTML = `<label class="u2-lab">${esc(p.label)} <select class="u2-in">${String(p.opts || '').split(',').map((s) => `<option>${esc(s.trim())}</option>`).join('')}</select></label>`; varIn(b, p, 'select', 'change'); } });
  W.def('date', { name: '날짜', group: '입력', icon: '📆', w: 5, h: 6, props: [{ k: 'label', label: '이름', type: 'text', def: '날짜' }, { k: 'var', label: '변수 이름', type: 'text', def: '날짜' }], render(b, p) { b.innerHTML = `<label class="u2-lab">${esc(p.label)} <input type="date" class="u2-in"></label>`; varIn(b, p, 'input', 'change'); } });
  W.def('number', { name: '숫자', group: '입력', icon: '#️⃣', w: 4, h: 5, props: [{ k: 'label', label: '이름', type: 'text', def: '수' }, { k: 'var', label: '변수 이름', type: 'text', def: '수' }], render(b, p) { b.innerHTML = `<label class="u2-lab">${esc(p.label)} <input type="number" class="u2-in" inputmode="decimal"></label>`; varIn(b, p, 'input'); } });
  W.def('input', { name: '글 칸', group: '입력', icon: '✏', w: 6, h: 5, props: [{ k: 'label', label: '이름', type: 'text', def: '메모' }, { k: 'var', label: '변수 이름', type: 'text', def: '글' }], render(b, p) { b.innerHTML = `<label class="u2-lab">${esc(p.label)} <input type="text" class="u2-in"></label>`; varIn(b, p, 'input'); } });
  W.def('checklist', { name: '체크 목록', group: '입력', icon: '☑', w: 6, h: 8, props: [{ k: 'items', label: '줄마다 하나', type: 'area', def: '상자 접기\n테이프 확인\n송장 붙이기' }],
    render(b, p, ctx) { const k = 'chk-' + ctx.wid; const st = U2.ls.get(k, {}) || {}; b.innerHTML = `<div class="u2-col">${lines(p.items).map((x, i) => `<label class="u2-chk"><input type="checkbox" data-i="${i}" ${st[i] ? 'checked' : ''}> ${esc(x)}</label>`).join('')}</div>`; b.querySelectorAll('input').forEach((c) => (c.onchange = () => { st[c.dataset.i] = c.checked; U2.ls.set(k, st); })); } });
  W.def('rating', { name: '별점', group: '입력', icon: '⭐', w: 5, h: 6, props: [{ k: 'label', label: '이름', type: 'text', def: '오늘 기분' }], render(b, p, ctx) { const k = 'rate-' + ctx.wid; let v = U2.ls.get(k, 0); const draw = () => { b.innerHTML = `<div class="u2-rate" role="radiogroup" aria-label="${esc(p.label)}"><small>${esc(p.label)}</small> ${[1, 2, 3, 4, 5].map((i) => `<button type="button" role="radio" aria-checked="${i === v}" data-v="${i}" class="${i <= v ? 'on' : ''}">★</button>`).join('')}</div>`; b.querySelectorAll('[data-v]').forEach((x) => (x.onclick = () => { v = +x.dataset.v; U2.ls.set(k, v); draw(); })); }; draw(); } });

  /* ═══ 기타 (6) ═══ */
  W.def('clock', { name: '시계·남은 시간', group: '기타', icon: '⏰', w: 5, h: 4, props: [{ k: 'until', label: '남은 시간 셀 시각(예 14:00 · 비우면 시계)', type: 'text', def: '' }, { k: 'label', label: '이름', type: 'text', def: '' }],
    render(b, p) { const tick = () => { const n = new Date(); let t; const m = /^(\d{1,2}):(\d{2})$/.exec(p.until || ''); if (m) { const d = new Date(n); d.setHours(+m[1], +m[2], 0, 0); let s = Math.round((d - n) / 1000); t = s <= 0 ? '지남' : `${Math.floor(s / 3600)}시간 ${Math.floor((s % 3600) / 60)}분 남음`; } else t = n.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }); b.innerHTML = `<div class="u2-clock"><small>${esc(p.label || (m ? p.until + '까지' : '지금'))}</small><b>${t}</b></div>`; }; tick(); const h = setInterval(tick, 15000); return () => clearInterval(h); } });
  W.def('memo', { name: '메모장(이 기기)', group: '기타', icon: '🗒', w: 6, h: 8, props: [{ k: 'ph', label: '자리 글', type: 'text', def: '이 기기에만 저장되는 메모' }],
    render(b, p, ctx) { const k = 'memo-' + ctx.wid; b.innerHTML = `<textarea class="u2-in u2-memo" placeholder="${esc(p.ph)}" aria-label="메모"></textarea>`; const t = b.querySelector('textarea'); t.value = U2.ls.get(k, '') || ''; let h; t.oninput = () => { clearTimeout(h); h = setTimeout(() => U2.ls.set(k, t.value), 500); }; return () => clearTimeout(h); } });



  W.def('recent', { name: '최근 연 페이지', group: '기타', icon: '🕘', w: 6, h: 11, props: [], render(b, p, ctx) { const r = U2.ls.get('recent', []) || []; b.innerHTML = r.length ? `<div class="u2-row u2-recent">${r.slice(0, 8).map((id) => { const n = navList().find((x) => x.id === id) || { title: id }; return `<button type="button" class="u2-chip" data-pg="${esc(id)}">${esc(n.icon || '')} ${esc(n.title)}</button>`; }).join('')}</div>` : '<div class="u2-empty">아직 없음</div>'; /* 작은 칩 · 여러 줄로 흘림(11/05 실화면 점검 — 세로 단추 8개가 기본 칸을 넘쳐 굴림 막대) */ wirePg(b, ctx); } });

  /* ═══ 자료·계산(단계 5) ═══ */
  W.def('calc', { name: '계산 카드', group: '자료 보기', icon: '🧮', w: 5, h: 5, props: [{ k: 'label', label: '이름', type: 'text', def: '계산' }, { k: 'expr', label: '식(예 퍼센트(연결확정.수, 주문.전체수))', type: 'text', def: '주문.전체수' }, { k: 'unit', label: '단위', type: 'text', def: '' }, { k: 'warnIf', label: '빨강 조건(식 · 값은 이름 값)', type: 'text', def: '' }],
    render(b, p) { const r = U2.data.eval(p.expr); let warn = false; if (p.warnIf) { const w = U2Expr.eval(p.warnIf, U2.data.ctx({ 값: r.v })); warn = !w.err && U2Expr.truthy(w.v); } b.innerHTML = `<div class="u2-kpi ${warn ? 'u2-warn' : ''}"><small>${esc(p.label)}</small><b>${r.err ? '<span class="u2-t-red" style="font-size:13px">⚠ ' + esc(r.err) + '</span>' : esc(U2Expr.show(r.v))}<span class="u2-unit">${esc(p.unit)}</span></b></div>`; return { dyn: true }; } });

  W.def('views', { name: '저장한 보기', group: '기타', icon: '⭐', w: 12, h: 7, props: [{ k: 'save', label: "'지금 보기 저장' 칸 보이기", type: 'check', def: true }],
    render(b, p, ctx) { const draw = () => { const vs = U2.data.views(); b.innerHTML = `<div class="u2-row">${vs.map((v) => `<button type="button" class="u2-btn" data-v="${esc(v.name)}">⭐ ${esc(v.name)} <small class="u2-sub">${esc(v.scope)}</small></button>`).join('') || '<span class="u2-sub">저장한 보기가 없음</span>'}${p.save && !ctx.edit ? '<input class="u2-in" style="width:140px" placeholder="보기 이름" aria-label="보기 이름"><button type="button" class="u2-btn u2-pri" data-sv>지금 보기 저장</button>' : ''}</div>`;
        b.querySelectorAll('[data-v]').forEach((x) => (x.onclick = () => !ctx.edit && U2.data.openView(x.dataset.v).catch((e) => U2.toast(e.message, 1))));
        const sv = b.querySelector('[data-sv]'); if (sv) sv.onclick = () => { const n = b.querySelector('input').value; U2.data.saveView(n, false).then(() => U2.toast('보기 저장: ' + n)).catch((e) => U2.toast(e.message, 1)); }; };
      draw(); return U2.on('views', draw); } });

  /* ═══ 📥 할 일 받은편지함(N3 ★) — 흩어진 '안 끝난 것'을 한 목록으로 · 숫자는 지금 웹앱 상태 별칭(읽기만) · 누르면 원래 화면 ═══ */
  W.INBOX = '📥 | 등록 진행 중 | 등록.진행 | 지금 웹앱 화면 열기: register\n🚚 | 오늘 출고 남은 일 | 출고.남은 | 지금 웹앱 화면 열기: ship | 🟥 알라딘=출고.알라딘, 🟦 예스24=출고.예스24, 🟩 네이버=출고.네이버, 🛍 우리숍=출고.우리숍\n🔗 | 연결 확정 기다림 | 연결확정.수 | 지금 웹앱 탭 열기: pending\n🔁 | 사후 확인 어긋남 | 사후확인.어긋남 | 지금 웹앱 통합 장부 보기: rc\n💬 | 받은 문의(전체) | 문의.전체수 | 지금 웹앱 기능 실행: 고객 문의 주제\n🔒 | 이 기기에서 막은 쓰기(시범) | 막은쓰기.수 | 새 웹앱 화면 열기: 충돌 감시\n🔁 | 새 웹앱 따라잡기 할 일 | 따라잡기.할일 | 새 웹앱 화면 열기: 따라잡기\n⚠ | 계약이 깨진 옛 기능 | 계약.깨짐 | 새 웹앱 화면 열기: 따라잡기'; /* (0.4.5) 📥 등록·🚚 출고 줄(성공 사례 견줌 ②⑥ — 처리할 일을 숫자로 맨 위에) · 모든 줄이 눌러서 그 화면으로 */
  W.def('inbox', { name: '할 일 받은편지함', group: '자료 보기', icon: '📥', w: 12, h: 31 /* (0.4.13) 🔁 사후 확인 줄 더해 8줄 */, props: [{ k: 'items', label: '줄마다: 아이콘 | 이름 | 식(숫자) | 행동: 대상 | (세부: 이름=식, 이름=식 …)', type: 'area', def: W.INBOX }, { k: 'hideZero', label: '0인 줄은 숨김', type: 'check', def: false }],
    render(b, p, ctx) { const rows = lines(p.items).map((l) => { const [ic, nm, ex, ac, sub] = l.split('|').map((s) => (s || '').trim()); const r = ex ? U2.data.eval(ex) : { v: null };
        /* (0.4.9) 세부(판매처별 등): '이름=식, …' — 숫자가 있는 것만 칩으로(0은 흐리게) · 통합 솔루션답게 알라딘·예스24·네이버·우리숍을 한 줄에 */
        const parts = sub ? sub.split(',').map((x) => { const i = x.indexOf('='); if (i < 0) return null; const e = U2.data.eval(x.slice(i + 1).trim()); return { n: x.slice(0, i).trim(), v: e.err ? null : e.v }; }).filter((x) => x && typeof x.v === 'number') : [];
        return { ic, nm, v: r.err ? null : r.v, err: r.err, ac, parts }; }).filter((r) => !(p.hideZero && !r.v));
      const total = rows.reduce((s0, r) => s0 + (typeof r.v === 'number' ? r.v : 0), 0);
      b.innerHTML = `<div class="u2-inbox"><div class="u2-ibh">처리할 것 <b class="${total ? 'u2-t-red' : 'u2-t-cloth'}">${total.toLocaleString()}</b></div>${rows.map((r, i) => `<div class="u2-ibr ${typeof r.v === 'number' && r.v > 0 ? 'u2-ibon' : ''}"><span>${esc(r.ic)}</span><span class="u2-ibn">${esc(r.nm)}${r.parts.length ? `<span class="u2-ibsub">${r.parts.map((x) => `<span class="${x.v ? 'on' : ''}">${esc(x.n)} <b>${esc(x.v)}</b></span>`).join('')}</span>` : ''}</span><b>${r.err ? '—' : esc(U2Expr.show(r.v))}</b>${r.ac ? `<button type="button" class="u2-btn" data-i="${i}">열기 ›</button>` : '<span></span>'}</div>`).join('')}</div>`;
      b.querySelectorAll('[data-i]').forEach((x) => (x.onclick = () => { if (ctx.edit) return; const r = rows[+x.dataset.i]; U2.actions.run(U2.actions.parseSeq(r.ac), ctx); }));
      return { dyn: true }; } });

  /* ═══ 🚦 처리할 주문 숫자 줄(성공 사례 견줌 ⑥ — Shopify 주문 목록 위 '처리할 주문 n건' 띠처럼) ═══
   *  지금 웹앱 🚚 오늘 출고 단계 칸 셈(shipCnt · SHIP_STG) 그대로 · 판매처 칩(전체·알라딘·예스24·네이버·우리숍 — 고른 것은 이 기기에 기억) · 단계를 누르면 그 단계 출고 화면(S.shipTab → openShip) · 읽기만 */
  W.SHIP_SRC = { all: '전체', al: '🟥 알라딘', y24: '🟦 예스24', nv: '🟩 네이버', shop: '🛍 우리숍' };
  W.SHIP_STG0 = [['confirm', '🆕', '확인할 주문', '확인'], ['deliv', '📦', '출고 준비', '준비'], ['printed', '🖨', '송장 인쇄됨', '인쇄됨'], ['sending', '📤', '송장 보내는 중', '보내는 중'], ['done', '✅', '오늘 끝', '끝']];
  const SHIP_LEFT = ['confirm', 'deliv', 'printed', 'sending'];
  W.def('shipbar', { name: '처리할 주문 숫자 줄', group: '자료 보기', icon: '🚦', w: 24, h: 9, props: [{ k: 'src', label: '판매처(처음)', type: 'select', opts: W.SHIP_SRC, def: 'all' }, { k: 'chips', label: '판매처 칩 보이기', type: 'check', def: true }, { k: 'done', label: "'오늘 끝' 칸도 보이기", type: 'check', def: true }],
    render(b, p, ctx) {
      let stg = W.SHIP_STG0; try { if (typeof SHIP_STG !== 'undefined' && Array.isArray(SHIP_STG) && SHIP_STG.length) stg = SHIP_STG; } catch (e) {}
      const key = 'shipbarSrc:' + (ctx.page || '') + ':' + (ctx.wid || ''); let src = U2.ls.get(key, null) || p.src || 'all'; if (!W.SHIP_SRC[src]) src = 'all';
      const ok = !!(U2.legacy && U2.legacy.ready) && (!U2.adapters || !U2.adapters.kindOk || U2.adapters.kindOk('shipbar'));
      let C = null; try { if (ok && typeof S !== 'undefined' && (S.ship || S.shipC) && typeof shipCnt === 'function') C = shipCnt(); } catch (e) { C = null; }
      const sum = (c) => SHIP_LEFT.reduce((a, k) => a + ((c || {})[k] || 0), 0);
      const c = C ? C[src] || {} : null; const left = c ? sum(c) : null;
      const chip = (k) => { const n = C ? sum(C[k]) : null; return `<button type="button" class="u2-chip ${k === src ? 'u2-on' : ''}" data-src="${k}" aria-pressed="${k === src}">${esc(W.SHIP_SRC[k])}${n != null ? ` <b>${n}</b>` : ''}</button>`; };
      b.innerHTML = `<div class="u2-shipbar"><div class="u2-sbh"><b>🚦 처리할 주문</b> <span class="u2-sbn ${left ? 'u2-t-red' : 'u2-t-cloth'}">${left == null ? '—' : left.toLocaleString()}</span>${p.chips ? `<span class="u2-sbsrc" role="group" aria-label="판매처">${Object.keys(W.SHIP_SRC).map(chip).join('')}</span>` : ''}</div>
        <div class="u2-sbst">${stg.filter((x) => p.done || x[0] !== 'done').map((x) => { const n = c ? c[x[0]] || 0 : null; return `<button type="button" class="u2-sbs ${n ? 'u2-on' : ''} ${x[0] === 'done' ? 'u2-sbdone' : ''}" data-st="${esc(x[0])}" ${ok ? '' : 'disabled'} title="${esc(x[2])} — 누르면 🚚 오늘 출고 화면"><span class="u2-sbl">${esc(x[1])} ${esc(x[2])}</span><span class="u2-sbsh">${esc(x[1])} ${esc(x[3] || x[2])}</span><b>${n == null ? '—' : n}</b></button>`; }).join('<span class="u2-sbarr" aria-hidden="true">›</span>')}</div>
        ${C ? '' : `<div class="u2-sub u2-sbnote">${ok ? '출고 기록을 아직 받지 않음 — 단계를 누르면 🚚 오늘 출고 화면이 열리고 숫자가 채워짐' : '지금 웹앱을 불러오지 못해 숫자를 볼 수 없음'}</div>`}</div>`;
      b.querySelectorAll('[data-src]').forEach((x) => (x.onclick = () => { if (ctx.edit) return; U2.ls.set(key, x.dataset.src); U2.mountCell(ctx.cell, ctx.wid, ctx.pg, false); }));
      b.querySelectorAll('[data-st]').forEach((x) => (x.onclick = () => { if (ctx.edit || !ok) return; const st = x.dataset.st; U2.legacy.userAt = performance.now(); U2.setCtx('screen:ship');
        try { S.shipTab = st === 'confirm' ? 'confirm' : st === 'done' ? 'all' : 'deliv'; if (src !== 'all') S.shipSrc = src; openShip(); } catch (e) { U2.toast('열지 못함: ' + U2.errKo(e), 1); } }));
      return { dyn: true };
    } });

  /* ═══ 🔎 스캔 검수(N8 ①) — 바코드(블루투스 스캐너는 글 칸에 치고 Enter · 휴대폰은 카메라 BarcodeDetector)로 '맞는 책인지' 대조 · 읽기만(자료를 바꾸지 않음) ═══ */


  /* ── 📋 목록 보기 탭(0.4.10 · 성공 사례 견줌 '한 목록 + 보기 탭(저장한 거르기)' — Shopify 관리자 목록 위 보기 탭·Linnworks 저장한 보기처럼) ──
   *  지금 웹앱의 큰 목록(📚 상품 전체 · 📋 주문 전체 · 🟦 예스24 전체 · 🧾 통합 장부 …)을 한 줄 탭으로 · 그 목록을 연 채 '＋ 지금 보기 저장'을 누르면 그 거르기·정렬·검색어가 ⭐ 탭이 됨
   *  탭을 누르면 = 그 거르기를 지금 웹앱 목록 상태(S._bt_<목록>)에 넣고 그 화면을 엶 — 목록 엔진·단추는 지금 웹앱 그대로(새로 그리지 않음)
   *  저장은 이 기기(rn2-listViews)만 · Firestore 쓰기 없음 · 지우기는 알림의 '↶ 되돌리기'(10초) */
  W.LV_DEF = 'prodAll, ordAll, y24All, ledger, shopAdm';
  W.lvAll = () => (U2.ls.get('listViews', []) || []).filter((v) => v && v.name && v.scr);
  W.lvOpen = (scr, st) => { const L = U2.legacy; if (!L || !L.ready || U2.safe) return U2.toast('지금 웹앱을 아직 불러오지 못함 — 잠시 뒤 다시', 1);
    if (st && st.bt) { try { const cur = S['_bt_' + st.bt] || {}; S['_bt_' + st.bt] = Object.assign({}, cur, { q: st.q || '', sort: st.sort || cur.sort, f: Object.assign({}, st.f || {}), lim: 200 }); } catch (e) {} }
    return L.screen(scr); };
  W.lvNow = () => { /* 지금 열린 지금 웹앱 큰 목록 → { scr, bt, title, q, sort, f } */
    try { const d = S.detail; if (!d || !d.bigTable) return null; const sh = document.getElementById('sheet'); if (!sh || !sh.classList.contains('on')) return null;
      const P = (U2.legacy && U2.legacy.list('PG_SCR')) || []; const r = P.find((x) => { try { return typeof x[2] === 'function' && x[2](d); } catch (e) { return false; } }); if (!r) return null;
      const st = S['_bt_' + d.bigTable] || {}; return { scr: r[0], bt: d.bigTable, title: String(r[1]), q: st.q || '', sort: st.sort || '', f: Object.assign({}, st.f || {}) }; } catch (e) { return null; } };
  W.def('listtabs', { name: '목록 보기 탭', group: '자료 보기', icon: '📋', w: 24, h: 8, minH: 3, /* (0.4.11) 거르기 칩 줄 → 기본 높이 6 → 8 */ props: [{ k: 'lists', label: '기본 탭(지금 웹앱 화면 이름 · 쉼표)', type: 'text', def: W.LV_DEF }, { k: 'save', label: "'＋ 지금 보기 저장' 단추 보이기", type: 'check', def: true }, { k: 'chips', label: '켜진 거르기를 칩으로(× 풀기 · ＋ 거르기)', type: 'check', def: true }],
    render(b, p, ctx) {
      const L = U2.legacy; const ok = !!(L && L.ready) && !U2.safe; const lastK = 'listTab:' + (ctx.page || '') + ':' + (ctx.wid || '');
      const base = String(p.lists || W.LV_DEF).split(/[,\s]+/).filter(Boolean).map((k) => [k, ok ? L.findScreen(k) : null]).filter(([, r]) => !ok || r);
      const draw = () => { const vs = W.lvAll(); const now = W.lvNow(); const last = U2.ls.get(lastK, '');
        b.innerHTML = `<div class="u2-lvt"><div class="u2-row u2-lvrow" role="tablist" aria-label="목록 보기">${base.map(([k, r]) => `<button type="button" role="tab" class="u2-chip ${last === 'b:' + k ? 'u2-on' : ''}" aria-selected="${last === 'b:' + k}" data-lvb="${esc(k)}" ${ok ? '' : 'disabled'}>${esc(r ? String(r[1]) : k)}</button>`).join('')}${vs.map((v, i) => `<span class="u2-lvv"><button type="button" role="tab" class="u2-chip ${last === 'v:' + v.name ? 'u2-on' : ''}" aria-selected="${last === 'v:' + v.name}" data-lvv="${i}" title="${esc(v.title + ' · ' + W.lvDesc(v))}" ${ok ? '' : 'disabled'}>⭐ ${esc(v.name)}</button><button type="button" class="u2-lvx" data-lvx="${i}" aria-label="보기 지우기: ${esc(v.name)}" title="이 보기 지우기(이 기기)">×</button></span>`).join('')}</div>
          ${now && p.chips !== false ? '<div class="u2-row u2-lvchips" data-lvc role="group" aria-label="켜진 거르기"></div>' : ''}${p.save ? `<div class="u2-row u2-lvsave">${now ? `<input class="u2-in" data-lvn maxlength="24" placeholder="보기 이름(예: 예스24 품절)" aria-label="보기 이름" value=""><button type="button" class="u2-btn u2-pri" data-lvs>＋ 지금 보기 저장</button><span class="u2-sub">${esc(now.title)}${p.chips === false ? ' · ' + esc(W.lvDesc(now)) : ''}</span>` : `<span class="u2-sub" title="목록을 열고 거르기·정렬을 고른 뒤 ＋ 지금 보기 저장 — ⭐ 탭이 됩니다(이 기기)">${ok ? '목록을 열고 거르기·정렬을 고른 뒤 여기서 ＋ 지금 보기 저장 — ⭐ 탭이 됩니다(이 기기)' : '지금 웹앱을 불러오지 못해 목록을 열 수 없음'}</span>`}</div>` : ''}</div>`;
        b.querySelectorAll('[data-lvb]').forEach((x) => (x.onclick = () => { if (ctx.edit) return; U2.ls.set(lastK, 'b:' + x.dataset.lvb); W.lvOpen(x.dataset.lvb); draw(); }));
        b.querySelectorAll('[data-lvv]').forEach((x) => (x.onclick = () => { if (ctx.edit) return; const v = W.lvAll()[+x.dataset.lvv]; if (!v) return; U2.ls.set(lastK, 'v:' + v.name); W.lvOpen(v.scr, v); draw(); }));
        b.querySelectorAll('[data-lvx]').forEach((x) => (x.onclick = () => { if (ctx.edit) return; const all = W.lvAll(); const v = all[+x.dataset.lvx]; if (!v) return; U2.ls.set('listViews', all.filter((y) => y !== v)); draw();
          U2.toast('보기 지움: ⭐ ' + v.name, false, 0, { act: { label: '↶ 되돌리기', fn: () => { U2.ls.set('listViews', W.lvAll().filter((y) => y.name !== v.name).concat([v])); U2.emit('listViews'); U2.toast('되살림: ⭐ ' + v.name); } } }); U2.emit('listViews'); }));
        const sb = b.querySelector('[data-lvs]'); if (sb) sb.onclick = () => { const n = W.lvNow(); if (!n) return U2.toast('열린 목록이 없음 — 목록을 다시 연 뒤', 1); const nm = (b.querySelector('[data-lvn]').value || '').trim().slice(0, 24) || n.title.replace(/^\W+\s*/, '') + (n.q ? ' ' + n.q : '');
          const all = W.lvAll(); if (all.length >= 30) return U2.toast('보기는 30개까지 — 안 쓰는 것을 지운 뒤', 1); const v = Object.assign({ name: nm, at: Date.now() }, n, { fl: W.lvLabels() }); U2.ls.set('listViews', all.filter((y) => y.name !== nm).concat([v])); U2.ls.set(lastK, 'v:' + nm); U2.toast('⭐ 보기 저장: ' + nm + ' (이 기기)'); U2.emit('listViews'); draw(); };
        const chips = () => { const c = b.querySelector('[data-lvc]'); if (!c) return; const G = W.lvFilters(); const n = W.lvNow(); const sig = JSON.stringify([n && n.q, (G || []).map((g) => g.cur && g.cur.k)]); if (c._sig === sig) return; c._sig = sig; W.lvChipsPaint(c, G, n, ctx, chips); };
        b._lvChips = chips; chips();
      };
      draw(); const off = U2.on ? U2.on('listViews', draw) : null; const t = setInterval(() => { if (document.hidden || b.contains(document.activeElement)) return; const has = !!W.lvNow(); if ((p.save || p.chips !== false) && has !== !!(b.querySelector('[data-lvs]') || b.querySelector('[data-lvc]'))) draw(); else if (b._lvChips) b._lvChips(); }, 700);
      return () => { clearInterval(t); if (typeof off === 'function') off(); };
    } });
  /* ── (0.4.11 · 성공 사례 견줌 '조건은 탭이 아니라 거르기 칩' — Shopify 관리자 목록의 '＋ 거르기'·켜진 조건 칩 ×) ──
   *  열린 지금 웹앱 큰 목록의 거르기 단추(data-btf)를 그대로 읽어 켜진 것만 칩으로 · × = 그 갈래 첫 값(전체)으로 · ＋ 거르기 = 갈래·값 판(누르면 바로 · 2번 누름)
   *  거르는 일은 지금 웹앱 단추를 대신 누르는 것뿐(목록 엔진·셈 그대로 · 저장·쓰기 없음) */
  W.lvFilters = () => { try { const sh = document.getElementById('sheet'); if (!sh || !sh.classList.contains('on') || !W.lvNow()) return null;
      return [...sh.querySelectorAll('.bt-f')].map((g) => { const bs = [...g.querySelectorAll('[data-btf]')]; if (bs.length < 2) return null;
        const opts = bs.map((x, i) => { const [fid, k] = String(x.dataset.btf).split('|'); const nb = x.querySelector('b'); const n = nb ? nb.textContent.trim() : ''; return { fid, k, i, l: x.textContent.replace(n, '').trim(), n, on: x.classList.contains('on') }; });
        const lab = ((g.querySelector('small') || {}).textContent || '').trim(); const cur = opts.find((o) => o.on) || opts[0]; return { fid: opts[0].fid, lab, opts, cur, def: opts[0], act: cur.i > 0 }; }).filter(Boolean); } catch (e) { return null; } };
  W.lvLabels = () => { const o = {}; (W.lvFilters() || []).forEach((g) => { if (g.act) o[g.fid] = (g.lab ? g.lab + ': ' : '') + g.cur.l; }); return o; };
  W.lvPick = (fid, k) => { const sh = document.getElementById('sheet'); const x = sh && sh.querySelector('[data-btf="' + (window.CSS && CSS.escape ? CSS.escape(fid + '|' + k) : fid + '|' + k) + '"]'); if (!x) { U2.toast('그 거르기를 찾지 못함 — 목록을 다시 연 뒤', 1); return false; } x.click(); return true; };
  W.lvChipsPaint = (c, G, n, ctx, again) => { const act = (G || []).filter((g) => g.act);
    c.innerHTML = `<span class="u2-sub u2-lvck">거르기</span>${n && n.q ? `<span class="u2-chip u2-on u2-lvc"><span>🔎 ‘${esc(n.q)}’</span><button type="button" class="u2-lvx" data-lvcq aria-label="찾기 글 풀기: ${esc(n.q)}" title="찾기 글 풀기">×</button></span>` : ''}${act.map((g) => `<span class="u2-chip u2-on u2-lvc"><span>${esc((g.lab ? g.lab + ': ' : '') + g.cur.l)}${g.cur.n ? ' <b>' + esc(g.cur.n) + '</b>' : ''}</span><button type="button" class="u2-lvx" data-lvcx="${esc(g.fid)}" aria-label="거르기 풀기: ${esc(g.lab)} ${esc(g.cur.l)}" title="풀기 → ${esc(g.def.l)}">×</button></span>`).join('')}${act.length || (n && n.q) ? '' : '<span class="u2-sub">없음 — 전체</span>'}${(G || []).length ? '<button type="button" class="u2-chip u2-lvadd" data-lvca aria-haspopup="dialog">＋ 거르기</button>' : ''}${act.length + (n && n.q ? 1 : 0) >= 2 ? '<button type="button" class="u2-chip" data-lvcall>모두 풀기</button>' : ''}`;
    const later = () => setTimeout(() => { c._sig = ''; again(); }, 150);
    c.querySelectorAll('[data-lvcx]').forEach((x) => (x.onclick = () => { if (ctx.edit) return; const g = (W.lvFilters() || []).find((y) => y.fid === x.dataset.lvcx); if (g && W.lvPick(g.fid, g.def.k)) { U2.toast('거르기 풂: ' + (g.lab ? g.lab + ' ' : '') + g.cur.l); later(); } }));
    const qx = c.querySelector('[data-lvcq]'); if (qx) qx.onclick = () => { if (ctx.edit) return; const qi = document.getElementById('bt_q'); if (!qi) return; qi.value = ''; qi.dispatchEvent(new Event('input', { bubbles: true })); U2.toast('찾기 글 풂'); setTimeout(() => { c._sig = ''; again(); }, 450); };
    const all = c.querySelector('[data-lvcall]'); if (all) all.onclick = () => { if (ctx.edit) return; (W.lvFilters() || []).filter((g) => g.act).forEach((g) => W.lvPick(g.fid, g.def.k)); if (qx) qx.click(); else U2.toast('거르기 모두 풂'); later(); };
    const add = c.querySelector('[data-lvca]'); if (add) add.onclick = () => { if (ctx.edit) return; W.lvAddPanel(n, () => { c._sig = ''; again(); }); };
  };
  W.lvAddPanel = (n, after) => { const G = W.lvFilters() || []; if (!G.length) return U2.toast('이 목록엔 거르기가 없음', 1);
    const L = U2.panel('＋ 거르기 — ' + ((n && n.title) || '목록'), `<div class="u2-col u2-lvpan">${G.map((g) => `<div class="u2-sec"><b>${esc(g.lab || '거르기')}</b><div class="u2-row">${g.opts.map((o) => `<button type="button" class="u2-chip ${o.on ? 'u2-on' : ''}" aria-pressed="${o.on}" data-lvp="${esc(g.fid + '|' + o.k)}">${esc(o.l)}${o.n ? ' <b>' + esc(o.n) + '</b>' : ''}</button>`).join('')}</div></div>`).join('')}<p class="u2-hint">누르면 바로 거름(지금 웹앱 목록 단추와 같음 · 숫자는 지금 거른 것 안에서 셈) · 켜진 것은 목록 위젯의 칩 ×로 풂</p></div>`, 'u2-lvpanel');
    L.querySelectorAll('[data-lvp]').forEach((x) => (x.onclick = () => { const [fid, k] = String(x.dataset.lvp).split('|'); const g = G.find((y) => y.fid === fid); const o = g && g.opts.find((y) => y.k === k); L.remove(); if (W.lvPick(fid, k)) { U2.toast('거름: ' + (g && g.lab ? g.lab + ' ' : '') + (o ? o.l : k)); setTimeout(after, 150); } }));
    return L; };
  W.lvDesc = (v) => { if (v.fl && Object.keys(v.fl).length) return [v.q ? '찾기 ‘' + v.q + '’' : '', Object.values(v.fl).join(' · ')].filter(Boolean).join(' · ');
    const f = Object.entries(v.f || {}).filter(([, x]) => x && x !== 'all').map(([, x]) => x); return [v.q ? '찾기 ‘' + v.q + '’' : '', f.length ? '거르기 ' + f.join('·') : '', v.sort ? '정렬 ' + v.sort : ''].filter(Boolean).join(' · ') || '거르기 없음'; };

  /* ── 늦게 받는 위젯(설계안 8-4 '위젯 코드 늦게 받기'): 덜 쓰는 무거운 위젯은 src/u2-widgets-extra.js — 처음 놓이거나 보일 때 받음(쉬는 때 미리 받아 둠) ── */
  W.LAZY_FILE = 'src/u2-widgets-extra.js';
  W.lazyLoad = () => W._lz || (W._lz = new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = W.LAZY_FILE + '?v=' + U2.ver; sc.onload = () => res(); sc.onerror = () => { W._lz = null; rej(new Error('위젯 파일을 못 받음')); }; document.head.appendChild(sc); }));
  const lazyRender = function (b, p, ctx) { b.innerHTML = '<div class="u2-empty">⏳ 위젯을 불러오는 중…</div>'; let dead = false; W.lazyLoad().then(() => { if (!dead && ctx.cell && ctx.cell.isConnected) U2.mountCell(ctx.cell, ctx.wid, ctx.pg || (U2.edit ? U2.edit.draft : U2.effective(U2.cur)), ctx.edit); }).catch((e) => { if (!dead) b.innerHTML = '<div class="u2-empty">⚠ ' + esc(e.message) + '</div>'; }); return () => { dead = true; }; };
  W.def('gallery', Object.assign({"name": "카드 목록", "group": "자료 보기", "icon": "🖼", "w": 12, "h": 10, "lazy": true}, { props: [], render: lazyRender }));
  W.def('board', Object.assign({"name": "보드(단계 칸)", "group": "자료 보기", "icon": "🧱", "w": 16, "h": 12, "lazy": true}, { props: [], render: lazyRender }));
  W.def('calendar', Object.assign({"name": "달력", "group": "자료 보기", "icon": "📅", "w": 10, "h": 14, "minW": 6, "lazy": true}, { props: [], render: lazyRender }));
  W.def('timeline', Object.assign({"name": "타임라인", "group": "자료 보기", "icon": "🕒", "w": 8, "h": 10, "lazy": true}, { props: [], render: lazyRender }));
  W.def('chart', Object.assign({"name": "차트", "group": "자료 보기", "icon": "📊", "w": 8, "h": 10, "minW": 3, "minH": 4, "lazy": true}, { props: [], render: lazyRender }));
  W.def('iframe', Object.assign({"name": "바깥 페이지 보기", "group": "기타", "icon": "🪟", "w": 12, "h": 16, "lazy": true}, { props: [], render: lazyRender }));
  W.def('varbar', Object.assign({"name": "변수 바", "group": "기타", "icon": "🎚", "w": 24, "h": 3, "lazy": true}, { props: [], render: lazyRender }));
  W.def('repeat', Object.assign({"name": "반복", "group": "기타", "icon": "🔁", "w": 12, "h": 8, "lazy": true}, { props: [], render: lazyRender }));
  W.def('query', Object.assign({"name": "Firestore 질의 목록(읽기만)", "group": "자료 보기", "icon": "🗃", "w": 12, "h": 12, "adminOnly": true, "lazy": true}, { props: [], render: lazyRender }));
  W.def('scan', Object.assign({"name": "스캔 검수", "group": "입력", "icon": "🔎", "w": 8, "h": 12, "lazy": true}, { props: [], render: lazyRender }));

  /* ═══ 리드나우 기능(옛 화면 그대로 — 어댑터 첫 묶음 · 나머지는 6단계) ═══ */
  const legacyOk = (type) => U2.legacy && U2.legacy.ready && (!type || !U2.adapters || U2.adapters.kindOk(type));
  const safeBox = (b, what) => { b.innerHTML = `<div class="u2-empty">⚠ 지금 웹앱을 불러오지 못해 '${esc(what)}'을(를) 여기서 볼 수 없습니다<br><a class="u2-link" href="${esc(U2.base)}">지금 웹앱에서 열기 ›</a></div>`; };
  W.TABS = { home: ['🏠', '홈'], search: ['👤', '고객'], products: ['📚', '상품'], sellers: ['🧑‍💼', '판매자'], orders: ['🧾', '주문·매출'], purchase: ['🛒', '매입'], biz: ['💹', '경영'], market: ['🌐', '시장조사'], projects: ['🧪', '프로젝트'], settings: ['⚙', '설정'] }; /* 설정은 지금 웹앱 머리줄 ⚙ 단추 화면 — 10번째 페이지(설계안 단계 8) */
  W.def('legacy.tab', { name: '지금 웹앱 탭 전체', group: '리드나우 기능', icon: '🧩', legacy: true, one: true, w: 24, h: 40, autoH: true, props: [{ k: 'ref', label: '탭', type: 'select', opts: Object.fromEntries(Object.entries(W.TABS).map(([k, v]) => [k, v.join(' ')])), def: 'home' }],
    render(b, p, ctx) { if (!legacyOk('legacy.tab')) return safeBox(b, (W.TABS[p.ref] || [])[1] || p.ref); if (ctx.edit) { b.innerHTML = `<div class="u2-empty">🧩 지금 웹앱 '${esc((W.TABS[p.ref] || [])[1] || p.ref)}' 탭이 여기에 그대로 나옵니다 (편집 중에는 자리만)</div>`; return; } return U2.legacy.mountTab(b, p.ref, ctx); } });
  W.def('legacy.sec', { name: '지금 웹앱 섹션 하나', group: '리드나우 기능', icon: '🧩', legacy: true, one: true, w: 12, h: 16, autoH: true, props: [{ k: 'ref', label: '섹션 id', type: 'text', def: 'bz_pace' }, { k: 'tab', label: '탭', type: 'select', opts: Object.fromEntries(Object.entries(W.TABS).map(([k, v]) => [k, v.join(' ')])), def: 'biz' }],
    render(b, p, ctx) { const it = U2.catalog && (U2.catalog.items || []).find((i) => i.kind === 'sec' && i.key === p.ref); const nm = it ? it.title : p.ref; if (!legacyOk('legacy.sec')) return safeBox(b, nm); if (ctx.edit) { b.innerHTML = `<div class="u2-empty">🧩 ${esc(nm)}<small>${esc((W.TABS[p.tab] || [])[1] || p.tab)} 탭 섹션 · 받는 자료 ≈${it && it.mem ? it.mem.mb : '?'}MB</small></div>`; return; } return U2.adapters.mountSec(b, p.tab, p.ref); } });
  W.def('legacy.header', { name: '지금 웹앱 머리줄(찾기·설정 단추)', group: '리드나우 기능', icon: '🔝', legacy: true, one: true, w: 24, h: 8, autoH: true, props: [],
    render(b, p, ctx) { if (!legacyOk()) return safeBox(b, '머리줄'); if (ctx.edit) { b.innerHTML = '<div class="u2-empty">🔝 지금 웹앱 머리줄(찾기 칸·⚙ 설정·❓ 설명서)</div>'; return; } return U2.legacy.mountHeader(b); } });
  W.def('legacy.feat', { name: '지금 웹앱 기능 단추', group: '리드나우 기능', icon: '🔧', legacy: true, w: 6, h: 4, props: [{ k: 'feat', label: '기능(🔍 기능 찾기 이름 일부)', type: 'text', def: '오늘 출고' }, { k: 'label', label: '단추 글(비우면 기능 이름)', type: 'text', def: '' }],
    render(b, p, ctx) { const f = U2.legacy && U2.legacy.findFeat(p.feat); b.innerHTML = `<div class="u2-fill"><button type="button" class="u2-btn u2-pri" ${f ? `title="${esc(f.t)}"` : 'disabled'}>${esc(p.label || (f ? f.t : '기능을 찾지 못함: ' + p.feat))}</button></div>`; b.querySelector('button').onclick = () => !ctx.edit && f && U2.legacy.feat(p.feat, ctx); } });
  W.def('legacy.screen', { name: '지금 웹앱 화면 열기', group: '리드나우 기능', icon: '🪟', legacy: true, w: 6, h: 4, props: [{ k: 'scr', label: '화면', type: 'scr', def: 'ship' }, { k: 'label', label: '단추 글(비우면 화면 이름)', type: 'text', def: '' }],
    render(b, p, ctx) { const s = U2.legacy && U2.legacy.findScreen(p.scr); b.innerHTML = `<div class="u2-fill"><button type="button" class="u2-btn u2-pri" ${s ? '' : 'disabled'}>${esc(p.label || (s ? s[1] : '화면을 찾지 못함: ' + p.scr))}</button></div>`; b.querySelector('button').onclick = () => !ctx.edit && s && U2.legacy.screen(p.scr, ctx); } });
  /* T4 '페이지로 박기'(11/05 동시에 쓰기) — 옛 상세 화면(#sheet · 등록·출고 등)이 이 칸 안에 열림 · 한 번에 한 칸(지금 웹앱은 상세 화면이 하나) */
  W.def('legacy.dock', { name: '옛 화면 자리(등록·출고 등을 이 칸 안에)', group: '리드나우 기능', icon: '🪟', legacy: true, one: true, w: 12, h: 40, props: [{ k: 'title', label: '이름', type: 'text', def: '옛 화면 자리' }, { k: 'scrs', label: '빈 칸에 보일 화면 단추(화면 이름 · 쉼표)', type: 'text', def: 'register,ship' }],
    render(b, p, ctx) { if (!legacyOk('legacy.dock')) return safeBox(b, '옛 화면'); return U2.dock ? U2.dock.mountCell(b, p, ctx) : undefined; } });
  W.def('legacy.homecard', { name: '지금 웹앱 홈 칸(보기 전용)', group: '리드나우 기능', icon: '🏠', legacy: true, autoH: true, w: 8, h: 10, props: [{ k: 'ref', label: '홈 칸', type: 'hw', def: 'pace' }],
    render(b, p, ctx) { if (!legacyOk()) return safeBox(b, '홈 칸'); return U2.legacy.mountHomeCard(b, p.ref, ctx); } });

  /* 위젯 기본 속성값 */
  W.defaults = (type) => { const d = W.defs[type]; const o = {}; (d ? d.props : []).forEach((x) => (o[x.k] = x.def)); return o; };
  /* 공통 '모양' 속성(모든 위젯) — 설계안 5-3 모양 쪽 */
  W.STYLE = [{ k: 's_title', label: '머리 띠 제목', type: 'text', def: '' }, { k: 's_bg', label: '바탕', type: 'select', opts: { '': '테마대로', paper: '흰 종이', bg: '옅은 회색', soft: '옅은 초록', amberSoft: '옅은 주황', redSoft: '옅은 빨강', none: '투명' }, def: '' }, { k: 's_accent', label: '왼쪽 강조 띠', type: 'select', opts: { '': '없음', cloth: '초록', amber: '주황', red: '빨강', gold: '금색' }, def: '' }, { k: 's_pat', label: '무늬', type: 'select', opts: { none: '없음', dots: '점', lines: '줄', grid: '격자', paper: '종이결', grad: '그라데이션' }, def: 'none' }, { k: 's_radius', label: '둥근 정도(px)', type: 'number', def: '' }, { k: 's_shadow', label: '그림자', type: 'select', opts: { '': '테마대로', 0: '없음', 1: '얕게', 2: '보통', 3: '깊게' }, def: '' }, { k: 's_pad', label: '안쪽 간격(px)', type: 'number', def: '' }];
})();

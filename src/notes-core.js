/* ⟦jbn core 시작⟧ 📓 정범 노트 화면 핵심 (note2 · 정범님 11/13 11:54) — 웹앱(src/app.html)과 아티팩트 '정범 노트'가 글자까지 같은 이 덩어리를 씀(시험 tNOTE2가 두 사본을 견줌)
 *  원본: src/notes-core.js · 웹앱엔 app.html 안 같은 표시 사이 · 아티팩트엔 readnow-chats tools/note-ui/build.py가 넣음
 *  JBN.mount(root, store, opt) — store = { docs(): Map(id → 문서), write(ops) → Promise, onChange(fn), status() → {mode, label, tip, ok}, send(text, memoIds) → Promise<{status, via, err}>, linkTo? }
 *  구조: 대분류(cat) › 중분류(sub) › 소분류(leaf) — 같은 칸 안에서는 중요도(imp 3→1) 높은 것부터 · 카드 겉 [✅ 완료] [🗄 보관] [🗑 휴지통] · 지우지 않음(휴지통에서 되살림)
 *  탭: 검토 · 🆕 새로 온 것(아직 안 읽은 리드 카드 — 검토 중인 묶음과 섞지 않음 · 펼치는 순간 읽음 = 검토로 옮김 · 접을 때 이 목록에서 빠짐) · ⏸ 보류(정범님 '보류해줘' — note4 11/13) · ✅ 완료 · 🗄 보관함 · 🗑 휴지통 · 📝 내 메모(정범님 혼자 · 리드에게 안 감 · 접기·⭐·보관 — note5) · ⚙ 노트 설정(입력칸 펼침 높이·저장 단추 크기·내 메모 처음 모양) · 맨 아래 🧾 통합 노트(메모가 함께 쌓임 · 직접 쓰기 · 💬 리드에게 보내기 · 💾 저장1·2·3 칸마다 따로 쌓고 서버에 보존 — note5) */
(function (G) {
  'use strict';
  if (G.JBN) return;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const kst = (iso) => { const t = Date.parse(iso || ''); if (!Number.isFinite(t)) return ''; const d = new Date(t + 9 * 36e5); return `${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`; };
  const nowIso = () => new Date().toISOString();
  const rid = (p) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const CAT_ORDER = ['완수 관제탑', '사업 결정', '출고·주문', '우리숍', '벤치마킹·엔진', '연구', '수집기·PC', '웹앱', '클라우드', '운영·장치', '보고·점검', '노트'];
  const TABS = [['review', '검토'], ['fav', '⭐ 즐겨찾기'], ['mine', '📝 내 메모'], ['new', '🆕 새로 온 것'], ['held', '⏸ 보류'], ['done', '✅ 완료'], ['archived', '🗄 보관함'], ['trashed', '🗑 휴지통']]; /* 📝 내 메모(note5)는 휴대폰 첫 화면에 보이게 앞쪽 */
  /* (note5 · 정범님 11/13 18:01) 💾 저장1·2·3 — 통합 노트를 칸 셋에 나눠 쌓고, 보내기 전까지 서버(jb_notes)에 영구 보존
   *  메모 문서 slot(1~3 · 예전 메모는 1) · 칸마다 입력 중인 글 = 문서 slot_<n> { kind:'slot', slot, draft } (입력할 때마다 곧바로 저장) · 고른 칸 = _meta.slotCur
   *  📝 내 메모 = kind 'jbmemo' — 정범님 혼자 쓰는 노트(queueOf·compose·리드 받은 편지에 잡히지 않음 · Claude에게 가지 않음) */
  const SLOTS = [1, 2, 3];
  const slotOf = (m) => (m && m.slot >= 1 && m.slot <= 3 ? m.slot : 1);
  /* (note5 둘째 · 정범님 11/13 20:47 · 약속 79) 노트 설정 — _meta에 두어 모든 기기 같음: 입력칸 펼침 높이(화면 %) · 저장 단추 크기(s 작게·m 보통) · 내 메모 처음 펼침 */
  const DOCKH = [40, 55, 70, 85];
  const cfgOf = (meta) => { const m = meta || {}; return { dockH: DOCKH.includes(m.uiDockH) ? m.uiDockH : 55, slotSz: m.uiSlotSz === 'm' ? 'm' : 's', mineOpen: m.uiMineOpen === true }; };

  /* ── 문서 → 카드 꼴 (예전 노트: kind 없음 · folder·archived·trashed) ── */
  function kindOf(d) { return d.kind || (d.text != null && d.cardId !== undefined ? 'memo' : 'card'); }
  function stateOf(d) { if (STATE_OK.includes(d.state)) return d.state; return d.trashed ? 'trashed' : d.archived ? 'archived' : 'open'; }
  const STATE_OK = ['open', 'held', 'done', 'archived', 'trashed']; /* held = ⏸ 보류(note4 · 정범님 11/13 14:57 — '보류해줘'라고 하신 것은 모두 여기) */
  function isNew(d) { return kindOf(d) === 'card' && d.kind === 'card' && stateOf(d) === 'open' && !d.readAt && d.src !== 'jb'; }
  /* ⭐ 즐겨찾기(note3 · 정범님 11/13 14:03) = 문서 칸 pinned(예전 노트 1판의 📌 고정과 같은 칸 — 클라우드·웹앱·아티팩트 모두 이미 받음) · 휴지통 카드는 빼고 */
  const isFav = (d) => !!(d && d.pinned) && stateOf(d) !== 'trashed';
  function tabOf(d) { const st = stateOf(d); if (st === 'open') return isNew(d) ? 'new' : 'review'; return st; }
  function model(docs) {
    const cards = [], memos = [], batches = [], mine = [], slots = new Map(); let meta = null;
    for (const [id, d0] of docs) { if (!d0 || id.startsWith('_')) { if (id === '_meta') meta = d0; continue; } const d = { id, ...d0 }; const k = kindOf(d); if (k === 'card') cards.push(d); else if (k === 'memo') memos.push(d); else if (k === 'batch') batches.push(d); else if (k === 'jbmemo') mine.push(d); else if (k === 'slot' && d.slot >= 1 && d.slot <= 3) slots.set(d.slot, d); }
    const byCard = new Map(); for (const m of memos) { if (m.state === 'trashed') continue; if (m.cardId) { if (!byCard.has(m.cardId)) byCard.set(m.cardId, []); byCard.get(m.cardId).push(m); } }
    for (const L of byCard.values()) L.sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')));
    return { cards, memos, batches, byCard, meta, mine, slots };
  }
  const impOf = (c) => (c.imp >= 1 && c.imp <= 3 ? c.imp : 2); /* ⭐(pinned)는 차례만 바꾸지 않음 — 위 ⭐ 묶음으로 따로 보임 */
  const whenOf = (c) => c.srcAt || c.createdAt || c.updatedAt || '';
  function catOf(c) { const x = (c.cat || c.folder || '노트').trim() || '노트'; return x === '참고LOST' ? '완수 관제탑' : x; }   /* (11/13 tower1) 옛 이름 참고LOST 카드도 새 이름 칸에 모음 */
  function tree(cards) {
    const T = new Map();
    for (const c of cards) { const a = catOf(c), b = (c.sub || '').trim() || '(묶음 없음)', l = (c.leaf || '').trim(); if (!T.has(a)) T.set(a, new Map()); const B = T.get(a); if (!B.has(b)) B.set(b, new Map()); const Lm = B.get(b); if (!Lm.has(l)) Lm.set(l, []); Lm.get(l).push(c); }
    const score = (arr) => arr.reduce((m, c) => Math.max(m, impOf(c) * 1e13 + (Date.parse(whenOf(c)) || 0)), 0);
    const sortC = (arr) => arr.sort((x, y) => impOf(y) - impOf(x) || String(whenOf(y)).localeCompare(String(whenOf(x))));
    const out = [];
    for (const [a, B] of T) { const subs = []; let all = [];
      for (const [b, Lm] of B) { const leaves = []; let sAll = []; for (const [l, arr] of Lm) { sortC(arr); leaves.push({ name: l, cards: arr, s: score(arr) }); sAll = sAll.concat(arr); } leaves.sort((x, y) => (x.name ? 1 : 0) - (y.name ? 1 : 0) || y.s - x.s); subs.push({ name: b, leaves, n: sAll.length, s: score(sAll) }); all = all.concat(sAll); }
      subs.sort((x, y) => y.s - x.s); const oi = CAT_ORDER.indexOf(a); out.push({ name: a, subs, n: all.length, s: score(all), oi: oi < 0 ? 99 : oi }); }
    out.sort((x, y) => Math.floor(y.s / 1e13) - Math.floor(x.s / 1e13) || x.oi - y.oi || y.s - x.s);
    return out;
  }

  /* ── 마크다운(바깥 그림은 그리지 않음 · 링크는 https만) ── */
  const safeUrl = (u) => (/^(https?:|mailto:)/i.test(u) ? u : null);
  function emph(s) { return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/~~(.+?)~~/g, '<del>$1</del>').replace(/==(.+?)==/g, '<mark>$1</mark>').replace(/(^|[^*\w])\*([^*\s](?:[^*]*?[^*\s])?)\*(?!\*)/g, '$1<em>$2</em>'); }
  function inl(s) { const st = []; const keep = (h) => { st.push(h); return '\u0001' + (st.length - 1) + '\u0001'; };
    s = String(s).replace(/`([^`]+)`/g, (_, c) => keep(`<code>${esc(c)}</code>`)); s = esc(s);
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, (_, a, u) => { const ok = safeUrl(u); return keep(ok ? `<a href="${ok}" target="_blank" rel="noopener noreferrer">그림: ${a || '열기'}</a>` : `[그림: ${a}]`); });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => { const ok = safeUrl(u.replace(/&amp;/g, '&')); return keep(ok ? `<a href="${esc(ok)}" target="_blank" rel="noopener noreferrer">${emph(t)}</a>` : emph(t)); });
    s = s.replace(/(^|[\s(])(https?:\/\/[^\s<\u0001]+[^\s<.,;:!?)\]'"\u0001])/g, (_, p, u) => p + keep(`<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`));
    s = s.replace(BRE, (_, p, id) => p + keep(`<a class="jbn-bd" href="${BOARD}#${id}" target="_blank" rel="noopener noreferrer" title="작업판 카드 ${id} 열기(새 탭)">📋 ${id}</a>`));
    s = emph(s); return s.replace(/\u0001(\d+)\u0001/g, (_, k) => st[+k]).replace(/\u0001(\d+)\u0001/g, (_, k) => st[+k]); }
  const LI = /^(\s*)([-*+]|\d{1,3}[.)])\s+(.*)$/;
  const isSep = (t) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(t) && t.includes('-');
  function row(t) { let s = t.trim(); if (s.startsWith('|')) s = s.slice(1); if (s.endsWith('|')) s = s.slice(0, -1); return s.split('|').map((c) => c.trim()); }
  function md(src) {
    const L = String(src || '').replace(/\r\n?/g, '\n').split('\n'); let out = '', i = 0, m;
    const blank = (t) => /^\s*$/.test(t);
    const starts = (k) => { const t = L[k]; return /^\s*(```|~~~)/.test(t) || /^ {0,3}#{1,6}\s/.test(t) || /^\s*>/.test(t) || LI.test(t) || /^ {0,3}([-*_])(\s*\1){2,}\s*$/.test(t) || (t.includes('|') && k + 1 < L.length && isSep(L[k + 1])); };
    while (i < L.length) { const t = L[i];
      if (blank(t)) { i++; continue; }
      if ((m = t.match(/^\s*(```|~~~)/))) { const f = m[1], b = []; i++; while (i < L.length && !L[i].trim().startsWith(f)) b.push(L[i++]); i++; out += `<pre><code>${esc(b.join('\n'))}</code></pre>`; continue; }
      if ((m = t.match(/^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/))) { const lv = Math.min(6, m[1].length + 2); out += `<h${lv}>${inl(m[2])}</h${lv}>`; i++; continue; }
      if (/^ {0,3}([-*_])(\s*\1){2,}\s*$/.test(t)) { out += '<hr>'; i++; continue; }
      if (t.includes('|') && i + 1 < L.length && isSep(L[i + 1])) { const h = row(t); i += 2; const R = []; while (i < L.length && L[i].includes('|') && !blank(L[i])) R.push(row(L[i++])); out += `<div class="jbn-tbl"><table><thead><tr>${h.map((c) => `<th>${inl(c)}</th>`).join('')}</tr></thead><tbody>${R.map((r) => `<tr>${h.map((_, k) => `<td>${inl(r[k] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; continue; }
      if (/^\s*>/.test(t)) { const b = []; while (i < L.length && /^\s*>/.test(L[i])) b.push(L[i++].replace(/^\s*>\s?/, '')); out += `<blockquote>${md(b.join('\n'))}</blockquote>`; continue; }
      if ((m = t.match(LI))) { const ord = /\d/.test(m[2]); const base = m[1].length; const items = [];
        while (i < L.length) { const mm = L[i].match(LI); if (mm && mm[1].length === base) { items.push([mm[3]]); i++; continue; } if (!blank(L[i]) && items.length && (L[i].match(/^\s*/)[0].length > base || !starts(i))) { items[items.length - 1].push(L[i].replace(new RegExp('^\\s{0,' + (base + 3) + '}'), '')); i++; continue; } if (blank(L[i]) && i + 1 < L.length && L[i + 1].match(/^\s*/)[0].length > base && items.length) { items[items.length - 1].push(''); i++; continue; } break; }
        out += `<${ord ? 'ol' : 'ul'}>${items.map((it) => { const f = it[0].replace(/^\[( |x|X)\]\s+/, (x, c) => (c === ' ' ? '☐ ' : '☑ ')); const rest = it.slice(1); const nested = rest.some((x) => LI.test(x)); return `<li>${inl(f)}${rest.length ? (nested ? md(rest.join('\n')) : '<br>' + rest.map(inl).join('<br>')) : ''}</li>`; }).join('')}</${ord ? 'ol' : 'ul'}>`; continue; }
      const b = []; while (i < L.length && !blank(L[i]) && (b.length === 0 || !starts(i))) b.push(L[i++].trim()); out += `<p>${b.map(inl).join('<br>')}</p>`; }
    return out;
  }
  /* (note4 · 정범님 11/13 16:00) 작업판 카드 번호(n1113p 꼴)를 작업판 그 카드로 잇는 링크 — 작업판은 주소 #카드번호로 바로 열림(board1) */
  const BOARD = 'https://claude.ai/artifact/QSpoAQ2dd2PpGNtwHV9QfN';
  const BRE = /(^|[^A-Za-z0-9_#/-])(n1\d{3}[a-z]{1,2})(?![A-Za-z0-9_])/g;
  const boardIds = (c) => { const out = []; const t = String(c.ref || '') + '\n' + String(c.body || ''); let m; BRE.lastIndex = 0; while ((m = BRE.exec(t))) if (!out.includes(m[2])) out.push(m[2]); return out.slice(0, 4); };
  const plain = (s) => String(s || '').replace(/```[\s\S]*?```/g, ' ').replace(/[#>*`|_~=-]+/g, ' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\s+/g, ' ').trim();

  /* ── 보낼 글(리드 채팅으로) ── */
  function compose(memos, cardsById, link) {
    const t = kst(nowIso()); const L = [`📨 정범 노트에서 보낸 피드백 ${memos.length}건 (${t})`, ''];
    memos.forEach((m, k) => { const c = m.cardId ? cardsById.get(m.cardId) : null; const where = c ? `「${c.title || m.cardTitle || '카드'}」 (${catOf(c)}${c.sub ? ' › ' + c.sub : ''})` : m.cardId ? `「${m.cardTitle || '카드'}」` : '(통합 노트에 바로 씀)';
      L.push(`[${k + 1}] ${where}`); if (m.quote) String(m.quote).trim().split(/\n+/).slice(0, 12).forEach((q) => L.push('> ' + q.trim().slice(0, 500))); L.push(String(m.text || '').trim()); L.push(''); });
    if (link) L.push(`— 노트: ${link}`);
    return L.join('\n');
  }
  const qOrd = (m) => (typeof m.ord === 'number' ? m.ord : Date.parse(m.at || '') || 0);
  const queueOf = (M, slot) => M.memos.filter((m) => !m.batchId && m.state !== 'trashed' && (slot == null || slotOf(m) === slot)).sort((a, b) => qOrd(a) - qOrd(b) || String(a.at || '').localeCompare(String(b.at || '')));

  /* ── 모양 (색은 --jbn-* 토큰 · 없으면 밝은 기본값) ── */
  const STYLE = `.jbn{--a:var(--jbn-accent,#0d6b66);--ai:var(--jbn-accent-ink,#fff);--as:var(--jbn-accent-soft,#d3e9e6);--bg:var(--jbn-bg,#eef2f1);--sf:var(--jbn-surface,#fbfcfc);--s2:var(--jbn-surface-2,#e4eae9);--ln:var(--jbn-line,#cfd9d8);--tx:var(--jbn-text,#132120);--mu:var(--jbn-muted,#536664);--fa:var(--jbn-faint,#7d8f8d);--memo:var(--jbn-memo,#fff4c2);--memo-ln:var(--jbn-memo-line,#e0b400);--memo-tx:var(--jbn-memo-ink,#3d2f00);--new:var(--jbn-new,#2f6fb5);--dn:var(--jbn-danger,#b3261e);--ok:var(--jbn-ok,#3d8a4a);color:var(--tx);font-size:15px;line-height:1.6;max-width:900px;margin-inline:auto}
.jbn *{box-sizing:border-box}.jbn button{font:inherit;color:inherit;cursor:pointer}
.jbn-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding-block:10px 6px}.jbn-top h2{margin:0;font-size:19px;letter-spacing:-.01em}.jbn-sp{flex:1}
.jbn-conn{font-size:12.5px;border-radius:999px;padding:3px 10px;border:1px solid var(--ln);background:var(--sf);color:var(--mu);max-width:100%;overflow-wrap:anywhere}.jbn-conn[data-ok="1"]{border-color:var(--ok);color:var(--ok)}.jbn-conn[data-ok="0"]{border-color:var(--memo-ln);color:var(--memo-tx);background:var(--memo)}
.jbn-q{width:100%;border:1px solid var(--ln);background:var(--sf);border-radius:8px;padding:8px 12px;font:inherit;color:inherit}
.jbn-tabs{display:flex;gap:2px;overflow-x:auto;border-bottom:1px solid var(--ln);margin-block:8px 10px;scrollbar-width:none}.jbn-tabs button{border:0;background:none;padding:8px 10px;white-space:nowrap;color:var(--mu);border-bottom:2px solid transparent;margin-bottom:-1px;font-size:14px}.jbn-tabs button[aria-selected="true"]{color:var(--tx);border-bottom-color:var(--a);font-weight:700}.jbn-tabs .n{font-size:11.5px;color:var(--fa);margin-left:4px;font-variant-numeric:tabular-nums}.jbn-tabs .n:empty{display:none}.jbn-tabs button[data-tab="new"] .n{color:#fff;background:var(--new);border-radius:999px;padding:0 6px}
.jbn-banner{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:13.5px;background:var(--s2);border-radius:8px;padding:8px 12px;margin-bottom:10px}
.jbn-cat{margin-block:12px}.jbn-cat>summary{list-style:none;cursor:pointer;display:flex;gap:8px;align-items:baseline;font-weight:700;font-size:16.5px;padding-block:4px;border-bottom:2px solid var(--tx)}.jbn-cat>summary::-webkit-details-marker{display:none}.jbn-cat>summary .c{font-size:12px;color:var(--fa);font-weight:500}
.jbn-sub{margin-block:8px 4px;margin-left:4px}.jbn-sub>summary{list-style:none;cursor:pointer;font-weight:600;font-size:14.5px;color:var(--mu);padding-block:4px;border-bottom:1px solid var(--ln)}.jbn-sub>summary::-webkit-details-marker{display:none}
.jbn-leaf{font-size:12.5px;color:var(--fa);margin-block:6px 2px;margin-left:6px;letter-spacing:.02em}
.jbn-card{background:var(--sf);border:1px solid var(--ln);border-radius:10px;margin-block:8px;padding:10px 12px}.jbn-card[data-new="1"]{border-color:var(--new);box-shadow:inset 3px 0 0 var(--new)}
.jbn-ch{display:flex;gap:8px;align-items:flex-start}.jbn-star{flex:none;border:0;background:none;padding:0 2px;font-size:19px;line-height:1.2;min-width:32px;min-height:32px;color:var(--fa)}.jbn-star[aria-pressed="true"]{color:#e0a800}.jbn-star:hover{color:#e0a800}.jbn-cat.fav>summary{border-bottom-color:#e0a800}.jbn-imp{flex:none;font-size:10px;letter-spacing:1px;color:var(--a);padding-top:5px;white-space:nowrap}.jbn-imp i{opacity:.25;font-style:normal}
.jbn-tt{flex:1;min-width:0;border:0;background:none;text-align:left;padding:0;font-weight:700;font-size:15px;line-height:1.4;overflow-wrap:anywhere}.jbn-tt:hover{color:var(--a)}
.jbn-meta{font-size:12px;color:var(--fa);display:flex;gap:4px 10px;flex-wrap:wrap;margin-top:2px}.jbn-meta .mc{color:var(--memo-tx);background:var(--memo);border-radius:4px;padding:0 5px}.jbn-meta .nw{color:#fff;background:var(--new);border-radius:4px;padding:0 5px}.jbn-meta .mv{color:var(--tx);background:var(--s2);border:1px dashed var(--ln);border-radius:4px;padding:0 5px}.jbn-meta .hd{color:var(--tx);background:var(--s2);border-radius:4px;padding:0 5px}
.jbn-snip{font-size:13.5px;color:var(--mu);margin-top:4px;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.jbn-acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.jbn-b{border:1px solid var(--ln);background:var(--sf);border-radius:7px;padding:4px 10px;font-size:13px;min-height:32px;white-space:nowrap}.jbn-b:hover{border-color:var(--fa)}.jbn-b.pri{background:var(--a);color:var(--ai);border-color:var(--a);font-weight:600}.jbn-b.dn{color:var(--dn)}.jbn-b:disabled{opacity:.45;cursor:default}
.jbn-body{margin-top:10px;border-top:1px dashed var(--ln);padding-top:8px;font-size:14.5px;overflow-wrap:anywhere}.jbn-body h3,.jbn-body h4,.jbn-body h5,.jbn-body h6{margin-block:1em .4em;font-size:1.02em}.jbn-body h3{font-size:1.1em}.jbn-body p{margin-block:.5em}.jbn-body ul,.jbn-body ol{padding-inline-start:1.3em;margin-block:.4em}.jbn-body code{background:var(--s2);border-radius:4px;padding:0 .3em;font-size:.9em}.jbn-body pre{background:var(--s2);border-radius:8px;padding:10px;overflow:auto;font-size:12.5px}.jbn-body blockquote{margin:.6em 0;padding-left:12px;border-left:3px solid var(--ln);color:var(--mu)}.jbn-body a{color:var(--a)}
.jbn-tbl{overflow-x:auto;margin-block:.6em;border:1px solid var(--ln);border-radius:8px}.jbn-tbl table{border-collapse:collapse;width:100%;font-size:13px}.jbn-tbl th,.jbn-tbl td{padding:5px 8px;border-bottom:1px solid var(--ln);vertical-align:top;text-align:left}.jbn-tbl th{background:var(--s2);white-space:nowrap}
.jbn-hl{background:var(--memo);box-shadow:inset 0 -2px 0 var(--memo-ln);color:inherit;border-radius:2px}
.jbn-memo{background:var(--memo);color:var(--memo-tx);border-left:4px solid var(--memo-ln);border-radius:2px 10px 10px 2px;padding:6px 10px 6px 12px;margin-block:6px;font-family:var(--jbn-hand,"Gowun Dodum","Gaegu","Nanum Pen Script",inherit);font-size:15px;box-shadow:0 1px 0 rgba(0,0,0,.06)}
.jbn-memo .who{font-family:inherit;font-weight:700;font-size:12px;letter-spacing:.03em;margin-right:6px}.jbn-memo .qt{display:block;font-size:12.5px;opacity:.8;margin-bottom:2px;font-style:italic;overflow-wrap:anywhere}.jbn-memo .tx{white-space:pre-wrap;overflow-wrap:anywhere}.jbn-memo .ft{font-size:11.5px;opacity:.7;display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:2px}.jbn-memo .ft button{border:0;background:none;padding:0;font-size:11.5px;color:inherit;text-decoration:underline}
.jbn-compose{margin-top:8px;display:grid;gap:6px}.jbn-compose textarea{width:100%;min-height:64px;border:1px solid var(--memo-ln);background:var(--memo);color:var(--memo-tx);border-radius:8px;padding:8px 10px;font:inherit;font-family:var(--jbn-hand,"Gowun Dodum",inherit);resize:vertical}.jbn-compose .qt{font-size:12.5px;color:var(--mu);font-style:italic;overflow-wrap:anywhere}
.jbn-selbtn{position:fixed;z-index:60;border:1px solid var(--memo-ln);background:var(--memo);color:var(--memo-tx);border-radius:999px;padding:6px 12px;font-size:13.5px;font-weight:700;box-shadow:0 6px 18px rgba(0,0,0,.18)}
.jbn-bdb{text-decoration:none;color:var(--a);border-color:var(--a);display:inline-flex;align-items:center}.jbn-bd{white-space:nowrap}
.jbn-dock{position:sticky;bottom:0;z-index:20;margin-top:16px;background:var(--sf);border:1px solid var(--ln);border-bottom:0;border-radius:12px 12px 0 0;box-shadow:0 -6px 18px rgba(0,0,0,.10);padding:8px 10px calc(8px + env(safe-area-inset-bottom,0px));display:grid;gap:6px}.jbn-dock .dh{display:flex;gap:8px;align-items:center;font-size:13.5px;flex-wrap:wrap}.jbn-dock .dn{color:var(--mu);font-variant-numeric:tabular-nums}.jbn-dock .dr{display:flex;gap:6px;align-items:flex-end}.jbn-dock textarea{flex:1;min-width:0;min-height:40px;max-height:30vh;border:1px solid var(--memo-ln);background:var(--memo);color:var(--memo-tx);border-radius:8px;padding:8px 10px;font:inherit;font-family:var(--jbn-hand,"Gowun Dodum",inherit);resize:vertical}
.jbn-bub{position:fixed;z-index:65;box-sizing:border-box;max-width:calc(100vw - 24px);margin:0;background:var(--sf);border:1px solid var(--memo-ln);border-radius:12px;box-shadow:0 10px 28px rgba(0,0,0,.22);padding:10px;display:grid;gap:6px;font-size:14px}.jbn-bub[hidden]{display:none}.jbn-bub .qt{font-size:12.5px;color:var(--mu);font-style:italic;overflow-wrap:anywhere;max-height:4.8em;overflow:auto}.jbn-bub textarea{width:100%;min-height:56px;border:1px solid var(--memo-ln);background:var(--memo);color:var(--memo-tx);border-radius:8px;padding:8px 10px;font:inherit;font-family:var(--jbn-hand,"Gowun Dodum",inherit);resize:vertical}.jbn-bub .bf{display:flex;gap:6px;align-items:center;font-size:12px;color:var(--fa);flex-wrap:wrap}
.jbn-feed{margin-top:28px;scroll-margin-bottom:140px;border-top:3px double var(--tx);padding-top:10px}.jbn-feed h3{margin:0 0 4px;font-size:17px}.jbn-feed .sub{font-size:12.5px;color:var(--mu);margin-bottom:8px}.jbn-feed .ref{font-family:inherit;font-size:12.5px;font-weight:600;margin-bottom:2px}.jbn-feed .ref button{border:0;background:none;padding:0;color:var(--a);text-decoration:underline;font-weight:600}
.jbn-sent{margin-top:10px;border:1px solid var(--ln);border-radius:8px;padding:6px 10px;background:var(--sf)}.jbn-sent>summary{cursor:pointer;font-size:13px;color:var(--mu)}.jbn-sent pre{white-space:pre-wrap;font-size:12.5px;background:var(--s2);border-radius:6px;padding:8px;overflow-wrap:anywhere}
.jbn-jump{position:fixed;z-index:50;right:calc(14px + env(safe-area-inset-right,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px));border:1px solid var(--memo-ln);background:var(--memo);color:var(--memo-tx);border-radius:999px;padding:7px 14px;font-weight:700;font-size:13.5px;box-shadow:0 6px 18px rgba(0,0,0,.18)}
.jbn-empty{color:var(--mu);font-size:14px;padding:24px 4px;text-align:center}.jbn-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(150px + env(safe-area-inset-bottom,0px));z-index:70;background:var(--tx);color:var(--bg);border-radius:9px;padding:8px 14px;font-size:13.5px;max-width:calc(100vw - 32px)}
.jbn-slots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.jbn-slots.s{gap:4px}.jbn-slot,.jbn-slot span{white-space:nowrap}.jbn-slots.s .jbn-slot{min-height:28px;padding:2px 6px;display:flex;gap:4px;justify-content:center;align-items:center;font-size:12px;border-radius:7px}.jbn-slots.s .jbn-slot .jsn{font-size:10.5px}
.jbn-dock.big textarea{height:var(--dockh,55vh);max-height:none;resize:none}.jbn-dock.big .dr{flex-wrap:wrap}.jbn-dock.big textarea{flex-basis:100%}
.jbn-cfg{background:var(--sf);border:1px solid var(--ln);border-radius:10px;padding:8px 12px;margin-block:4px 8px;display:grid;gap:6px;font-size:13.5px}.jbn-cfg .r{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.jbn-cfg .r>b{font-weight:600;min-width:9em}.jbn-cfg .jbn-b[aria-pressed="true"]{background:var(--a);color:var(--ai);border-color:var(--a)}
.jbn-mchips{display:flex;gap:6px;flex-wrap:wrap}.jbn-mchips .jbn-b[aria-pressed="true"]{background:var(--a);color:var(--ai);border-color:var(--a)}.jbn-mi .mh{display:flex;gap:6px;align-items:flex-start}.jbn-mi .mt{flex:1;min-width:0;border:0;background:none;padding:2px 0;text-align:left;font-weight:600;font-size:14.5px;overflow-wrap:anywhere;color:inherit}.jbn-mi .ms{font-size:12.5px;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jbn-mi[data-arch="1"]{border-left-color:var(--fa)}.jbn-slot{border:1px solid var(--ln);background:var(--s2);border-radius:9px;padding:4px 6px;min-height:40px;display:grid;line-height:1.25;text-align:center;font-size:13.5px;font-weight:600}.jbn-slot .jsn{font-size:11px;font-weight:500;color:var(--mu);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jbn-slot[aria-pressed="true"]{background:var(--a);border-color:var(--a);color:var(--ai)}.jbn-slot[aria-pressed="true"] .jsn{color:var(--ai);opacity:.9}.jbn-dock .sv{font-size:11.5px;color:var(--fa)}
.jbn-mine{display:grid;gap:8px}.jbn-mw{display:grid;gap:6px;background:var(--sf);border:1px solid var(--ln);border-radius:10px;padding:10px}.jbn-mw textarea,.jbn-mi textarea{width:100%;min-height:72px;border:1px solid var(--ln);background:var(--bg);color:var(--tx);border-radius:8px;padding:8px 10px;font:inherit;resize:vertical}.jbn-mi{background:var(--sf);border:1px solid var(--ln);border-left:4px solid var(--a);border-radius:4px 10px 10px 4px;padding:8px 12px}.jbn-mi .tx{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14.5px}.jbn-mi .ft{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12px;color:var(--fa);margin-top:6px}.jbn-mi .ft .jbn-sp{flex:1}
@media (max-width:520px){.jbn-dock .dr{flex-wrap:wrap}.jbn-dock textarea{flex-basis:100%}.jbn-acts .jbn-b{padding:4px 8px}.jbn-cat>summary{font-size:15.5px}}`;

  function mount(root, store, opt) {
    opt = opt || {};
    if (!document.getElementById('jbn-css')) { const st = document.createElement('style'); st.id = 'jbn-css'; st.textContent = STYLE; document.head.appendChild(st); }
    const U = { seen: new Set(), tab: 'review', q: '', open: new Set(), comp: null, draft: '', feedDraft: '', busy: false, pend: false, toastT: 0, slot: 1, slotSeen: undefined, dDirty: false, dT: 0, sv: '', mineDraft: '', medit: null };
    try { const p = JSON.parse(localStorage.getItem('jbn-ui') || '{}'); if (TABS.some((t) => t[0] === p.tab)) U.tab = p.tab; if (SLOTS.includes(p.slot)) U.slot = p.slot; } catch (e) {}
    const saveUi = () => { try { localStorage.setItem('jbn-ui', JSON.stringify({ tab: U.tab, slot: U.slot })); } catch (e) {} }; /* 기기 편의(고른 탭)만 — 칸 내용은 서버 */
    root.classList.add('jbn');
    const selBtn = document.createElement('button'); selBtn.className = 'jbn-selbtn'; selBtn.type = 'button'; selBtn.hidden = true; selBtn.textContent = '💬 메모 달기'; document.body.appendChild(selBtn);
    const jump = document.createElement('button'); jump.className = 'jbn-jump'; jump.type = 'button'; jump.hidden = true; document.body.appendChild(jump);
    const toast = (m) => { let t = U.toastEl; if (!t) { t = U.toastEl = document.createElement('div'); t.className = 'jbn-toast jbn'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = m; t.hidden = false; clearTimeout(U.toastT); U.toastT = setTimeout(() => { t.hidden = true; }, 2600); };
    /* (note4 · 정범님 11/13 16:00 '단추 반응이 매우 느려') 누르면 화면은 바로 바뀌고 저장은 뒤에서 — 덧씌움(U.ov)에 먼저 반영해 그리고, 저장이 끝나면 걷음 · 실패하면 되돌리고 알림
     *  (예전: 아티팩트는 커넥터 왕복 note_write가 끝나야 화면이 바뀜 · 웹앱은 Firestore 쓰기 확인을 기다림) */
    U.ov = new Map(); U.ovN = 0; U.mOpen = new Set(); U.mClosed = new Set(); U.mview = 'all';
    function view() { const base = store.docs(); if (!U.ov.size) return base; const m = new Map(base); for (const [id, o] of U.ov) m.set(id, o.set ? { ...o.d } : { ...(m.get(id) || {}), ...o.d }); return m; }
    const W = (ops, ok) => { const tok = ++U.ovN; const mine = [];
      for (const o of ops) { const prev = U.ov.get(o.id); const ent = o.op === 'set' ? { set: true, d: { ...o.data }, tok } : { set: !!(prev && prev.set), d: { ...((prev && prev.d) || {}), ...o.data }, tok }; U.ov.set(o.id, ent); mine.push([o.id, ent]); }
      render(); if (ok) toast(ok);
      const t0 = Date.now();
      return Promise.resolve().then(() => store.write(ops)).then(() => { U.lastW = Date.now() - t0; for (const [id, ent] of mine) if (U.ov.get(id) === ent) U.ov.delete(id); renderSoon(); })
        .catch((e) => { for (const [id, ent] of mine) if (U.ov.get(id) === ent) U.ov.delete(id); render(); toast('저장 못 함 — 되돌렸습니다 · ' + (e && (e.message || e.code) || '연결 확인')); }); };

    function cardHtml(c, M, tab, showPath) {
      const open = U.open.has(c.id); const ms = M.byCard.get(c.id) || []; const nw = isNew(c); const imp = impOf(c);
      const st = stateOf(c); const acts = st === 'open' ? `<button class="jbn-b" data-act="done">✅ 완료</button><button class="jbn-b" data-act="hold">⏸ 보류</button><button class="jbn-b" data-act="archive">🗄 보관</button><button class="jbn-b dn" data-act="trash">🗑 휴지통</button>${nw ? '<button class="jbn-b" data-act="read">👁 읽음</button>' : ''}`
        : st === 'held' ? '<button class="jbn-b pri" data-act="restore">↩ 검토로</button><button class="jbn-b" data-act="done">✅ 완료</button><button class="jbn-b dn" data-act="trash">🗑 휴지통</button>'
        : st === 'trashed' ? '<button class="jbn-b pri" data-act="restore">↩ 되살리기</button>' : `<button class="jbn-b" data-act="restore">↩ 검토로</button>${st === 'done' ? '<button class="jbn-b" data-act="archive">🗄 보관</button>' : ''}<button class="jbn-b dn" data-act="trash">🗑 휴지통</button>`;
      const bds = st === 'trashed' ? [] : boardIds(c); const bdl = bds.map((id) => `<a class="jbn-b jbn-bdb" href="${BOARD}#${id}" target="_blank" rel="noopener noreferrer" title="이 일과 이어진 작업판 카드 — 정범님 손으로 할 일·고를 것은 거기서">📋 작업판 ${esc(id)} ↗</a>`).join('');
      const meta = [showPath ? esc(catOf(c) + (c.sub ? ' › ' + c.sub : '')) : '', c.src ? esc(c.src === 'lead' ? '리드' : c.src === 'jb' ? '정범' : c.src) : '', kst(whenOf(c)), c.ref ? esc(c.ref) : '', ms.length ? `<span class="mc">메모 ${ms.length}</span>` : '', nw ? '<span class="nw">새로 옴</span>' : '', tab === 'new' && !nw && U.seen.has(c.id) ? '<span class="mv">👁 읽음 — 검토로 옮겨짐 · 접으면 이 목록에서 빠집니다</span>' : '', st === 'held' && tab !== 'held' ? '<span class="hd">⏸ 보류</span>' : ''].filter(Boolean).map((x) => `<span>${x}</span>`).join('');
      let body = '';
      if (open) { const comp = U.comp && U.comp.cardId === c.id;
        body = `<div class="jbn-body" data-body="${esc(c.id)}">${md(c.body) || '<p style="opacity:.6">(본문 없음)</p>'}</div>
        ${ms.map((m) => memoHtml(m, false)).join('')}
        <div class="jbn-compose" data-comp="${esc(c.id)}">${comp && U.comp.quote ? `<div class="qt">고른 글: “${esc(U.comp.quote.slice(0, 300))}” <button class="jbn-b" data-act="unquote" style="min-height:24px;padding:0 6px">고른 글 빼기</button></div>` : ''}
          <label class="sr-only" for="jbn-ta-${esc(c.id)}" style="position:absolute;left:-9999px">이 카드에 메모</label><textarea id="jbn-ta-${esc(c.id)}" data-ta="${esc(c.id)}" placeholder="${comp && U.comp.quote ? '고른 글에 대한 메모' : '이 카드 전체에 대한 메모 — 본문에서 글을 고르면 그 문장에 대한 메모'}">${comp ? esc(U.draft) : ''}</textarea>
          <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="jbn-b pri" data-act="memo">💬 메모 달기</button><span style="font-size:12px;color:var(--fa);align-self:center">카드 전체 메모 · 본문 글을 고르면 그 자리 버블로 · 아래 🧾 통합 노트에도 함께 쌓입니다</span></div></div>`; }
      return `<article class="jbn-card" data-card="${esc(c.id)}" data-new="${nw ? 1 : 0}" data-moved="${tab === 'new' && !nw && U.seen.has(c.id) ? 1 : 0}"><div class="jbn-ch"><span class="jbn-imp" title="중요도 ${imp}/3">${'●'.repeat(imp)}<i>${'●'.repeat(3 - imp)}</i></span><div style="flex:1;min-width:0"><button class="jbn-tt" data-act="toggle" aria-expanded="${open}">${esc(c.title || '제목 없음')}</button><div class="jbn-meta">${meta}</div>${open ? '' : `<div class="jbn-snip">${esc(plain(c.body).slice(0, 220))}</div>`}</div><button class="jbn-star" type="button" data-act="fav" aria-pressed="${c.pinned ? 'true' : 'false'}" title="${c.pinned ? '즐겨찾기에서 빼기' : '⭐ 즐겨찾기에 넣기'}" aria-label="${c.pinned ? '즐겨찾기에서 빼기' : '즐겨찾기에 넣기'}">${c.pinned ? '★' : '☆'}</button></div><div class="jbn-acts">${acts}${bdl}</div>${body}</article>`;
    }
    function memoHtml(m, inFeed, cardsById) {
      const c = inFeed && m.cardId ? cardsById.get(m.cardId) : null;
      const ref = inFeed ? `<div class="ref">${m.cardId ? `카드 <button data-goto="${esc(m.cardId)}">「${esc((c && c.title) || m.cardTitle || '카드')}」</button>${m.quote ? ' › 고른 글' : ' 전체'}` : '통합 노트에 바로 씀'}</div>` : '';
      if (inFeed && U.edit === m.id) return `<div class="jbn-memo" data-memo="${esc(m.id)}">${ref}${m.quote ? `<span class="qt">“${esc(String(m.quote).slice(0, 400))}”</span>` : ''}<label for="jbn-ed" style="position:absolute;left:-9999px">메모 고치기</label><div class="jbn-compose" style="margin-top:4px"><textarea id="jbn-ed" data-edta="1">${esc(U.editDraft != null ? U.editDraft : m.text)}</textarea><div style="display:flex;gap:6px"><button class="jbn-b pri" data-act="qsave" data-mid="${esc(m.id)}">저장</button><button class="jbn-b" data-act="qcancel">그만두기</button></div></div></div>`;
      return `<div class="jbn-memo" data-memo="${esc(m.id)}">${ref}${m.quote ? `<span class="qt">“${esc(String(m.quote).slice(0, 400))}”</span>` : ''}<span class="who">정범</span><span class="tx">${esc(m.text)}</span><div class="ft"><span>${kst(m.at)}</span>${m.batchId ? '<span>💬 보냄</span>' : '<span>아직 안 보냄</span>'}${!m.batchId && inFeed ? `<button data-act="qup" data-mid="${esc(m.id)}" title="위로">↑ 위로</button><button data-act="qdown" data-mid="${esc(m.id)}" title="아래로">↓ 아래로</button><button data-act="qedit" data-mid="${esc(m.id)}">✏ 고치기</button>` : ''}${!m.batchId ? `<button data-act="memotrash" data-mid="${esc(m.id)}">빼기</button>` : ''}</div></div>`;
    }
    /* (note4 · 정범님 11/13 15:06) 화면 아래 붙은 통합 입력칸 — 쌓인 메모·인용 수 · 바로 쓰기(Enter 적기 · Shift+Enter 줄바꿈) · 모두 보내기 · 목록으로 */
    function slotsHtml(M) {
      const sz = cfgOf(M.meta).slotSz;
      return `<div class="jbn-slots ${sz}" role="group" aria-label="저장 칸">${SLOTS.map((n) => { const q = queueOf(M, n); const nq = q.filter((m) => m.quote).length; const dr = (n === U.slot ? U.feedDraft : String((M.slots.get(n) || {}).draft || '')).trim();
        const sn = sz === 's' ? (q.length || dr ? `${q.length}${nq ? `·❝${nq}` : ''}${dr ? '·✎' : ''}` : '빈 칸') : q.length || dr ? `메모 ${q.length}${nq ? ` · 인용 ${nq}` : ''}${dr ? ' · ✎' : ''}` : '비어 있음';
        return `<button type="button" class="jbn-slot" data-slot="${n}" aria-pressed="${n === U.slot}" title="💾 저장${n} — ${q.length ? `보내기 전 메모 ${q.length}건(인용 ${nq}건)` : '쌓인 메모 없음'}${dr ? ' · 쓰던 글 있음' : ''} · 보내기 전까지 서버에 보존">${sz === 's' ? `<span>저장${n}</span>` : `<span>💾 저장${n}</span>`}<span class="jsn" data-slotn="${n}">${sn}</span></button>`; }).join('')}</div>`;
    }
    function dockHtml(M) {
      const un = queueOf(M, U.slot); const nq = un.filter((m) => m.quote).length; const can = (un.length || U.feedDraft.trim()) && !U.busy;
      return `<div class="jbn-dock" id="jbn-dock" role="region" aria-label="통합 입력칸" style="--dockh:${cfgOf(M.meta).dockH}vh">${slotsHtml(M)}<div class="dh"><b>🧾 저장${U.slot}</b><span class="dn" data-dockn="${un.length}">${un.length ? `쌓인 메모 ${un.length}건${nq ? ` · 인용 ${nq}건` : ''}` : '쌓인 메모 없음'}</span><span class="sv" data-sv="1">${esc(U.sv)}</span><span class="jbn-sp"></span>${un.length ? '<button class="jbn-b" data-act="tofeed">목록 보기 ↓</button>' : ''}</div>
        <div class="dr"><label for="jbn-feed-ta" style="position:absolute;left:-9999px">통합 노트에 쓰기</label><textarea id="jbn-feed-ta" data-feedta="1" rows="1" placeholder="리드에게 남길 말 — Enter 적기 · Shift+Enter 줄바꿈">${esc(U.feedDraft)}</textarea><button class="jbn-b" data-act="feedmemo">✍ 적기</button><button class="jbn-b pri" data-act="send" ${can ? '' : 'disabled'} title="💾 저장${U.slot}에 쌓인 것만 보내고 이 칸을 비웁니다(다른 칸은 그대로)">📨 저장${U.slot} 보내기${un.length ? ` (${un.length})` : ''}</button></div></div>`;
    }
    function feedHtml(M) {
      const cardsById = new Map(M.cards.map((c) => [c.id, c]));
      const un = queueOf(M, U.slot);
      const bs = M.batches.slice().sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
      const st = (b) => (b.status === 'picked' ? '✅ 리드가 받음' : b.status === 'sent' ? '💬 리드 채팅으로 보냄' : b.status === 'failed' ? '⚠ 못 보냄' : '⏳ 리드 확인 기다림(10분 안)');
      return `<section class="jbn-feed" id="jbn-feed" aria-label="통합 노트"><h3>🧾 통합 노트 — 💾 저장${U.slot} 보낼 대기</h3><div class="sub">카드 글을 드래그로 고르면 [💬 메모 달기] → 그 자리 작은 버블에 메모를 쓰고 Enter — 고른 글(인용)과 메모가 여기 차례로 쌓입니다(읽던 자리 그대로). 순서 바꾸기·고치기·빼기를 한 뒤 화면 아래 통합 입력칸의 [📨 저장${U.slot} 보내기]로 한 메시지로 리드에게 갑니다. 아래 입력칸에 바로 써도 됩니다. 입력칸 위 💾 저장1·2·3은 따로 쌓는 칸 셋 — 쓰는 대로 서버에 바로 저장되고, 보내기 전까지 남습니다(다른 칸은 보내도 그대로).</div>
        ${un.length ? un.map((m) => memoHtml(m, true, cardsById)).join('') : '<div class="jbn-empty" style="padding:10px 4px">아직 보낼 메모가 없습니다.</div>'}
        ${bs.map((b) => `<details class="jbn-sent" data-batch="${esc(b.id)}"><summary>보냄 ${kst(b.at)}${b.slot ? ` · 💾 저장${b.slot}` : ''} · ${(b.memoIds || []).length}건 · ${st(b)}${b.err ? ' · ' + esc(String(b.err).slice(0, 80)) : ''}</summary><pre>${esc(b.text || '')}</pre></details>`).join('')}</section>`;
    }
    /* ⚠ data-open 이름은 쓰지 않음 — 웹앱이 문서 전체에서 [data-open]을 누르면 새 창을 열고 눌림을 멈춤(내 메모 고치기가 웹앱에서 안 되던 까닭) · 펼침 표시는 data-fold
    /* (note5 둘째 · 정범님 11/13 20:47) 📝 내 메모 — 카드마다 접기·펴기 · ⭐ 즐겨찾기(pinned) · 🗄 보관(state archived · 지우지 않음) · 보기: 전체·⭐·🗄 보관함·🗑 휴지통 */
    const mOpenOf = (M, id) => (U.medit === id ? true : cfgOf(M.meta).mineOpen ? !U.mClosed.has(id) : U.mOpen.has(id));
    function mineHtml(M, q) {
      const ord = (d) => String(d.editedAt || d.at || d.createdAt || '');
      const st = (d) => (d.state === 'trashed' ? 'trashed' : d.state === 'archived' ? 'archived' : 'open');
      const V = { all: (d) => st(d) === 'open', fav: (d) => !!d.pinned && st(d) !== 'trashed', arch: (d) => st(d) === 'archived', trash: (d) => st(d) === 'trashed' };
      const n = {}; for (const k of Object.keys(V)) n[k] = M.mine.filter(V[k]).length;
      const v = V[U.mview] ? U.mview : 'all';
      const L = M.mine.filter((d) => V[v](d) && (!q || String(d.text || '').toLowerCase().includes(q))).sort((x, y) => (y.pinned ? 1 : 0) - (x.pinned ? 1 : 0) || ord(y).localeCompare(ord(x)));
      const first = (t) => { const ln = String(t || '').split('\n').map((x) => x.trim()).filter(Boolean); return [ln[0] || '(빈 메모)', ln.slice(1).join(' ')]; };
      const item = (d) => { const sd = st(d); const op = mOpenOf(M, d.id); const [t1, rest] = first(d.text);
        const star = sd === 'trashed' ? '' : `<button class="jbn-star" type="button" data-act="mfav" data-mid="${esc(d.id)}" aria-pressed="${d.pinned ? 'true' : 'false'}" aria-label="${d.pinned ? '즐겨찾기에서 빼기' : '즐겨찾기에 넣기'}" title="${d.pinned ? '즐겨찾기에서 빼기' : '⭐ 즐겨찾기'}">${d.pinned ? '★' : '☆'}</button>`;
        const head = `<div class="mh"><button class="mt" type="button" data-act="mtoggle" data-mid="${esc(d.id)}" aria-expanded="${op}">${op ? '▾' : '▸'} ${esc(t1.slice(0, 120))}</button>${star}</div>`;
        if (U.medit === d.id && sd !== 'trashed') return `<div class="jbn-mi" data-mine="${esc(d.id)}" data-fold="1">${head}<label for="jbn-med" style="position:absolute;left:-9999px">내 메모 고치기</label><textarea id="jbn-med">${esc(U.meditDraft != null ? U.meditDraft : d.text)}</textarea><div class="ft"><button class="jbn-b pri" data-act="msave" data-mid="${esc(d.id)}">저장</button><button class="jbn-b" data-act="mcancel">그만두기</button></div></div>`;
        if (!op) return `<div class="jbn-mi" data-mine="${esc(d.id)}" data-fold="0" data-arch="${sd === 'archived' ? 1 : 0}">${head}<div class="ms">${esc(rest.slice(0, 140))}${rest ? ' · ' : ''}${kst(d.editedAt || d.at || d.createdAt)}${sd === 'archived' && v !== 'arch' ? ' · 🗄 보관' : ''}</div></div>`;
        const acts = sd === 'trashed' ? `<button class="jbn-b pri" data-act="mrestore" data-mid="${esc(d.id)}">↩ 되살리기</button>`
          : `<button class="jbn-b" data-act="medit" data-mid="${esc(d.id)}">✏ 고치기</button>${sd === 'archived' ? `<button class="jbn-b" data-act="mrestore" data-mid="${esc(d.id)}">↩ 보관에서 꺼내기</button>` : `<button class="jbn-b" data-act="march" data-mid="${esc(d.id)}">🗄 보관</button>`}<button class="jbn-b dn" data-act="mtrash" data-mid="${esc(d.id)}">🗑 휴지통</button>`;
        return `<div class="jbn-mi" data-mine="${esc(d.id)}" data-fold="1" data-arch="${sd === 'archived' ? 1 : 0}">${head}<div class="tx">${esc(d.text)}</div><div class="ft"><span>${kst(d.at || d.createdAt)}${d.editedAt ? ' · 고침 ' + kst(d.editedAt) : ''}${sd === 'archived' ? ' · 🗄 보관' : ''}</span><span class="jbn-sp"></span>${acts}</div></div>`; };
      const chip = (k, l) => `<button class="jbn-b" type="button" data-mview="${k}" aria-pressed="${v === k}">${l}${n[k] ? ` ${n[k]}` : ''}</button>`;
      const empty = q ? `'${esc(U.q)}'에 맞는 내 메모가 없습니다.` : { all: '아직 내 메모가 없습니다. 위 칸에 적어 보세요.', fav: '⭐ 즐겨찾기한 내 메모가 없습니다. 메모 오른쪽 ☆를 누르면 여기 모입니다.', arch: '🗄 보관한 내 메모가 없습니다. 메모를 펼쳐 [🗄 보관]을 누르면 여기 모입니다(지우지 않음).', trash: '🗑 휴지통이 비었습니다. 휴지통 메모는 지워지지 않고 되살릴 수 있습니다.' }[v];
      return `<section class="jbn-mine" aria-label="내 메모"><div class="jbn-banner">📝 정범님만 보는 메모입니다 — Claude(리드)에게 보내지 않고 받은 편지에도 잡히지 않습니다. 웹앱 📓과 아티팩트 어디서 열어도 같습니다. 제목 줄을 누르면 펼치고 접힙니다.</div>
        <div class="jbn-mw"><label for="jbn-mine-ta" style="position:absolute;left:-9999px">새 내 메모</label><textarea id="jbn-mine-ta" data-mineta="1" placeholder="나만 볼 메모 — [📝 적기] 또는 Ctrl+Enter">${esc(U.mineDraft)}</textarea><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><button class="jbn-b pri" data-act="mineadd">📝 적기</button><span style="font-size:12px;color:var(--fa)">첫 줄이 제목 · 고치기·⭐·보관·휴지통(지우지 않음)</span></div></div>
        <div class="jbn-mchips" role="group" aria-label="내 메모 보기">${chip('all', '전체')}${chip('fav', '⭐ 즐겨찾기')}${chip('arch', '🗄 보관함')}${chip('trash', '🗑 휴지통')}</div>
        ${L.length ? L.map(item).join('') : `<div class="jbn-empty">${empty}</div>`}</section>`;
    }
    function cfgHtml(M) { const c = cfgOf(M.meta); const b = (k, val, l, on) => `<button class="jbn-b" type="button" data-cfg="${k}" data-v="${val}" aria-pressed="${on}">${l}</button>`;
      return `<div class="jbn-cfg" role="group" aria-label="노트 설정"><div class="r"><b>✍ 입력칸 펼침 높이</b>${DOCKH.map((h) => b('uiDockH', h, `화면 ${h}%`, c.dockH === h)).join('')}</div>
        <div class="r"><b>💾 저장 단추 크기</b>${b('uiSlotSz', 's', '작게', c.slotSz === 's')}${b('uiSlotSz', 'm', '보통(두 줄)', c.slotSz === 'm')}</div>
        <div class="r"><b>📝 내 메모 처음 모양</b>${b('uiMineOpen', '0', '접힘', !c.mineOpen)}${b('uiMineOpen', '1', '펼침', c.mineOpen)}</div>
        <div class="r" style="font-size:12px;color:var(--fa)">모든 기기에 같게 저장됩니다(웹앱 📓 · 아티팩트) · 통합 입력칸은 누르면 위 높이로 펼쳐지고, 칸 밖을 누르면 줄어듭니다. <button class="jbn-b" type="button" data-act="cfgx">닫기</button></div></div>`; }
    const setSv = (t) => { U.sv = t; const el = root.querySelector('[data-sv]'); if (el) el.textContent = t; };
    /* (note5) 쓰는 대로 그 칸 문서 slot_<n>에 곧바로 저장(0.4초 모아서 · 칸을 바꾸거나 칸을 떠나거나 창을 닫을 때는 바로) — 다시 그리지 않음(쓰던 글자판 그대로) */
    function saveDraft(now) { clearTimeout(U.dT); const go = () => { const n = U.slot, v = U.feedDraft;
        Promise.resolve().then(() => store.write([{ op: 'merge', id: 'slot_' + n, data: { kind: 'slot', slot: n, draft: v, at: nowIso() } }])).then(() => { if (U.slot === n && U.feedDraft === v) U.dDirty = false; if (U.slot === n) setSv('💾 저장됨 ' + kst(nowIso()).slice(6)); const sn = root.querySelector(`[data-slotn="${n}"]`); if (sn && v.trim() && !/✎/.test(sn.textContent)) sn.textContent = /빈 칸/.test(sn.textContent) ? '0·✎' : /^\d/.test(sn.textContent) ? sn.textContent + '·✎' : (/비어/.test(sn.textContent) ? '메모 0' : sn.textContent) + ' · ✎'; })
          .catch((e) => { if (U.slot === n) setSv('⚠ 저장 못 함 — 이어 쓰면 다시 저장 · ' + String((e && (e.message || e.code)) || '').slice(0, 40)); }); };
      if (now) go(); else U.dT = setTimeout(go, 400); }
    function switchSlot(n) { if (!SLOTS.includes(n)) return; const ta = root.querySelector('#jbn-feed-ta'); if (ta && n !== U.slot) U.feedDraft = ta.value; if (n === U.slot) { if (ta) ta.focus(); return; }
      if (U.dDirty) saveDraft(true); U.slot = n; U.slotSeen = n; U.dDirty = false; U.sv = ''; U.feedDraft = String((model(view()).slots.get(n) || {}).draft || ''); saveUi();
      W([{ op: 'merge', id: '_meta', data: { slotCur: n } }]); toast(`💾 저장${n}로 바꿨습니다 — 여기에 쌓입니다`); }
    function render() {
      if (U.dead) return;
      const ae = document.activeElement; if (Date.now() - (U.act || 0) > 80 && root.contains(ae) && ((ae.tagName === 'TEXTAREA' && (ae.value || ae.dataset.feedta || ae.dataset.mineta)) || (ae.tagName === 'INPUT' && ae.value && ae.id !== 'jbn-q'))) { U.pend = true; return; } /* 찾기 칸은 입력 처리에서 다시 그린 뒤 글자 자리까지 되돌림(예전엔 여기서 막혀 찾기가 먹지 않았음) */ /* (note5) 통합 입력칸·내 메모 칸은 비어도 손이 있으면 다시 그리지 않음(쓰던 자리·글자판 그대로) */
      U.pend = false; const M = model(view());
      const ms = M.meta && M.meta.slotCur; if (SLOTS.includes(ms) && ms !== U.slotSeen) { U.slotSeen = ms; if (ms !== U.slot && !U.dDirty) { U.slot = ms; saveUi(); } } /* 다른 기기에서 고른 칸도 같게 */
      if (!U.dDirty) U.feedDraft = String((M.slots.get(U.slot) || {}).draft || ''); const st = store.status ? store.status() : { label: '', ok: true };
      const q = U.q.trim().toLowerCase(); const hit = (c) => !q || (c.title + '\n' + (c.body || '') + '\n' + catOf(c) + ' ' + (c.sub || '') + ' ' + (c.leaf || '') + '\n' + (M.byCard.get(c.id) || []).map((m) => m.text).join('\n')).toLowerCase().includes(q);
      const cnt = {}; TABS.forEach(([k]) => { cnt[k] = 0; }); M.cards.forEach((c) => { cnt[tabOf(c)]++; if (isFav(c)) cnt.fav++; }); cnt.mine = M.mine.filter((d) => d.state !== 'trashed' && d.state !== 'archived').length;
      const inTab = (c) => (U.tab === 'fav' ? isFav(c) : tabOf(c) === U.tab || (U.tab === 'new' && U.seen.has(c.id) && stateOf(c) === 'open')); /* 새로 온 것에서 펼쳐 읽은 카드는 탭을 바꿀 때까지 그 자리에 */
      let list = M.cards.filter((c) => inTab(c) && hit(c)); let favTop = [];
      if (U.tab === 'review') { favTop = M.cards.filter((c) => isFav(c) && stateOf(c) === 'open' && hit(c)).sort((x, y) => impOf(y) - impOf(x) || String(whenOf(y)).localeCompare(String(whenOf(x)))); list = list.filter((c) => !isFav(c)); } /* ⭐ 즐겨찾기는 검토 맨 위 한 묶음(아래 갈래에 다시 안 나옴) */
      const T = tree(list);
      const y = (opt.scroller ? opt.scroller() : document.scrollingElement || document.documentElement).scrollTop;
      root.innerHTML = `<div class="jbn-top"><h2>📓 정범 노트</h2><span class="jbn-conn" data-ok="${st.ok ? 1 : 0}" title="${esc(st.tip || '')}">${esc(st.label || '')}</span><span class="jbn-sp"></span><button class="jbn-b" type="button" data-act="cfg" aria-expanded="${!!U.cfgOpen}" title="노트 설정 — 입력칸 펼침 높이·저장 단추 크기·내 메모 처음 모양">⚙ 노트 설정</button>${opt.topExtra || ''}</div>${U.cfgOpen ? cfgHtml(M) : ''}
        <label for="jbn-q" style="position:absolute;left:-9999px">찾기</label><input id="jbn-q" class="jbn-q" type="search" placeholder="제목·본문·메모 찾기" value="${esc(U.q)}" autocomplete="off">
        <div class="jbn-tabs" role="tablist">${TABS.map(([k, l]) => `<button role="tab" data-tab="${k}" aria-selected="${U.tab === k}">${l}<span class="n">${cnt[k] || ''}</span></button>`).join('')}</div>
        ${U.tab === 'review' && cnt.new ? `<div class="jbn-banner">🆕 검토하시는 동안 새로 온 카드 ${cnt.new}개는 따로 모아 두었습니다. <button class="jbn-b" data-tab="new">새로 온 것 보기</button></div>` : ''}
        ${U.tab === 'new' && cnt.new ? `<div class="jbn-banner">리드가 새로 쌓은 카드입니다. 펼쳐 읽는 순간 검토로 옮겨지고, 읽던 카드는 접을 때 이 목록에서 빠집니다. <button class="jbn-b" data-act="readall">👁 모두 읽음</button></div>` : ''}
        ${favTop.length ? `<details class="jbn-cat fav" open><summary>⭐ 즐겨찾기<span class="c">${favTop.length}</span></summary>${favTop.map((c) => cardHtml(c, M, U.tab, true)).join('')}</details>` : ''}
        ${U.tab === 'mine' ? mineHtml(M, q) : T.length || favTop.length ? T.map((a) => `<details class="jbn-cat" open><summary>${esc(a.name)}<span class="c">${a.n}</span></summary>${a.subs.map((b) => `<details class="jbn-sub" open><summary>${esc(b.name)} <span style="font-weight:400;color:var(--fa);font-size:12px">${b.n}</span></summary>${b.leaves.map((l) => `${l.name ? `<div class="jbn-leaf">› ${esc(l.name)}</div>` : ''}${l.cards.map((c) => cardHtml(c, M, U.tab)).join('')}`).join('')}</details>`).join('')}</details>`).join('') : `<div class="jbn-empty">${q ? `'${esc(U.q)}'에 맞는 카드가 없습니다.` : { review: '검토할 카드가 없습니다. 리드가 응답할 때마다 카드가 쌓입니다.', new: '새로 온 카드가 없습니다.', held: '⏸ 보류한 카드가 없습니다. 카드의 [⏸ 보류]를 누르거나 리드에게 \'보류해줘\'라고 하시면 여기에 모입니다(웹앱 📓과 같음).', fav: '⭐ 즐겨찾기한 카드가 없습니다. 카드 오른쪽 ☆를 누르면 여기에 모입니다(웹앱 📓과 같음).', done: '완료한 카드가 없습니다.', archived: '보관한 카드가 없습니다.', trashed: '휴지통이 비었습니다. 휴지통 카드는 지워지지 않고 되살릴 수 있습니다.' }[U.tab]}</div>`}
        ${U.tab === 'mine' ? '' : feedHtml(M) + dockHtml(M)}`;
      // 고른 문장 칠하기
      root.querySelectorAll('[data-body]').forEach((el) => { const L = (M.byCard.get(el.dataset.body) || []).filter((m) => m.quote); for (const m of L) hiQuote(el, String(m.quote)); });
      const un = queueOf(M, U.slot).length; jump.hidden = true; /* (note4) 오른쪽 아래 떠 있던 단추 대신 아래 붙은 통합 입력칸이 수를 보임 */
      const sc = opt.scroller ? opt.scroller() : document.scrollingElement || document.documentElement; sc.scrollTop = y;
      if (opt.onRender) opt.onRender({ unread: cnt.new, unsent: un });
    }
    function hiQuote(el, qt) {
      const want = qt.replace(/\s+/g, ' ').trim().slice(0, 160); if (want.length < 2) return;
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const v = n.nodeValue; const k = v.indexOf(want); if (k < 0) continue; const r = document.createRange(); r.setStart(n, k); r.setEnd(n, k + want.length); const mk = document.createElement('mark'); mk.className = 'jbn-hl'; mk.title = '정범 메모가 있는 글'; try { r.surroundContents(mk); } catch (e) {} return; }
    }
    let rT = 0; const renderSoon = () => { clearTimeout(rT); rT = setTimeout(function go() { if (U.ptr || Date.now() - (U.ptrUp || 0) < 300 || U.bub || selIn()) { rT = setTimeout(go, 150); return; } render(); }, 60); };
    const selIn = () => { try { const g = window.getSelection(); if (!g || g.isCollapsed) return false; const n = g.anchorNode; return !!(n && root.contains(n.nodeType === 1 ? n : n.parentElement)); } catch (e) { return false; } }; /* 글을 고르는 중·버블이 열린 동안은 뒤에서 다시 그리지 않음(고른 글이 풀리지 않게) */
    root.addEventListener('pointerdown', () => { U.ptr = true; }, true); const ptrUp = () => { U.ptr = false; U.ptrUp = Date.now(); }; document.addEventListener('pointerup', ptrUp, true); document.addEventListener('pointercancel', ptrUp, true);
    /* (note5 둘째) 통합 입력칸 — 누르면 설정 높이로 크게 · 칸 밖을 누르면 줄어듦(쓰던 글은 칸에 저장) */
    const dockBig = (on) => { const d = root.querySelector('#jbn-dock'); if (d) d.classList.toggle('big', !!on); };
    root.addEventListener('focusin', (e) => { if (e.target && e.target.dataset && e.target.dataset.feedta) dockBig(true); });
    root.addEventListener('focusout', (e) => { if (e.target && e.target.dataset && e.target.dataset.feedta) setTimeout(() => { const ae = document.activeElement; if (!(ae && ae.dataset && ae.dataset.feedta)) dockBig(false); }, 120); });
    document.addEventListener('pointerdown', (e) => { const d = root.querySelector('#jbn-dock.big'); if (!d || d.contains(e.target)) return; const ta = d.querySelector('#jbn-feed-ta'); if (ta && document.activeElement === ta) ta.blur(); dockBig(false); }, true);
    /* (note5 둘째 · 휴대폰 '목록 보기'가 안 됨) 부드러운 굴림이 다시 그리기에 끊겼음 → 바로 그 자리로 */
    function goFeed() { const f = root.querySelector('#jbn-feed'); if (!f) return; const sc = opt.scroller ? opt.scroller() : null; const ta = root.querySelector('#jbn-feed-ta'); if (ta && document.activeElement === ta) ta.blur(); dockBig(false);
      if (sc && sc !== document.scrollingElement && sc !== document.documentElement && sc !== document.body) { const top = f.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 8 - (opt.padTop ? +opt.padTop() || 0 : 0); /* 웹앱 창은 위에 붙은 머리(.sh)만큼 덜 내림 */ const go = () => { try { sc.scrollTo({ top: Math.max(0, top), behavior: 'instant' }); } catch (e) { sc.scrollTop = Math.max(0, top); } }; go(); requestAnimationFrame(go); setTimeout(go, 150); } /* 창에 부드러운 굴림(scroll-behavior)이 걸려 있어도 바로 · 이미 돌던 굴림이 덮지 않게 한 번 더 */
      else { const y1 = Math.max(0, f.getBoundingClientRect().top + window.scrollY - 8); const go = () => { try { window.scrollTo({ top: y1, behavior: 'instant' }); } catch (e) { window.scrollTo(0, y1); } }; go(); requestAnimationFrame(go); setTimeout(go, 150); } }
    store.onChange(renderSoon);
    root.addEventListener('focusout', (e) => { if (e.target && e.target.dataset && e.target.dataset.feedta && U.dDirty) saveDraft(true); });
    const flush = () => { if (U.dDirty) saveDraft(true); }; window.addEventListener('pagehide', flush); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
    root.addEventListener('focusout', () => setTimeout(() => { if (U.pend && !(root.contains(document.activeElement) && /TEXTAREA|INPUT/.test(document.activeElement.tagName))) render(); }, 30));
    root.addEventListener('keydown', (e) => { const t = e.target; if (t && t.dataset && t.dataset.mineta && e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.isComposing) { e.preventDefault(); const bt = root.querySelector('[data-act="mineadd"]'); if (bt) bt.click(); return; } if (t && t.dataset && t.dataset.feedta && e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); const bt = root.querySelector('[data-act="feedmemo"]'); if (bt) bt.click(); } });
    root.addEventListener('input', (e) => { const t = e.target; if (t.id === 'jbn-q') { U.q = t.value; clearTimeout(U.qT); U.qT = setTimeout(() => { const p = t.selectionStart; render(); const q2 = root.querySelector('#jbn-q'); if (q2) { q2.focus(); try { q2.setSelectionRange(p, p); } catch (e2) {} } }, 200); } else if (t.dataset.ta) { U.comp = U.comp && U.comp.cardId === t.dataset.ta ? U.comp : { cardId: t.dataset.ta, quote: null }; U.draft = t.value; } else if (t.dataset.feedta) { U.feedDraft = t.value; U.dDirty = true; setSv('✎ 저장 중…'); saveDraft(false); const sb = root.querySelector('[data-act="send"]'); const dn = root.querySelector('[data-dockn]'); if (sb && !U.busy) sb.disabled = !(+((dn && dn.dataset.dockn) || 0) || t.value.trim()); } else if (t.dataset.mineta) U.mineDraft = t.value; else if (t.id === 'jbn-med') U.meditDraft = t.value; else if (t.id === 'jbn-ed') U.editDraft = t.value; });
    const docOf = (id) => view().get(id);
    root.addEventListener('click', async (e) => {
      U.act = Date.now(); /* (note5 둘째) 사람이 누른 동작은 글칸에 손이 있어도 바로 그림 — 휴대폰에서 글칸이 손을 쥔 채라 [✏ 고치기]가 미뤄져 '안 됨'으로 보였음 */
      const cf = e.target.closest('[data-cfg]'); if (cf && root.contains(cf)) { const k = cf.dataset.cfg, v0 = cf.dataset.v; const val = k === 'uiDockH' ? +v0 : k === 'uiMineOpen' ? v0 === '1' : v0; U.mOpen.clear(); U.mClosed.clear(); return W([{ op: 'merge', id: '_meta', data: { [k]: val } }], k === 'uiDockH' ? `✍ 입력칸 펼침 높이 = 화면 ${val}%` : k === 'uiSlotSz' ? `💾 저장 단추 = ${val === 's' ? '작게' : '보통(두 줄)'}` : `📝 내 메모 처음 = ${val ? '펼침' : '접힘'}`); }
      const mv = e.target.closest('[data-mview]'); if (mv && root.contains(mv)) { U.mview = mv.dataset.mview; render(); return; }
      const tb = e.target.closest('[data-tab]'); if (tb && root.contains(tb)) { U.seen.clear(); U.tab = tb.dataset.tab; saveUi(); render(); return; }
      const sb = e.target.closest('[data-slot]'); if (sb && root.contains(sb)) { switchSlot(+sb.dataset.slot); return; }
      const gt = e.target.closest('[data-goto]'); if (gt) { const id = gt.dataset.goto; const d = docOf(id); if (d) { U.tab = tabOf({ id, ...d }); U.open.add(id); render(); const el = root.querySelector(`[data-card="${CSS.escape(id)}"]`); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); } return; }
      const b = e.target.closest('[data-act]'); if (!b || !root.contains(b)) return;
      const cardEl = b.closest('[data-card]'); const id = cardEl && cardEl.dataset.card; const at = nowIso(); const a = b.dataset.act;
      if (a === 'toggle') { if (U.open.has(id)) { U.open.delete(id); U.seen.delete(id); /* 접을 때 새로 온 것 목록에서 빠짐(펼친 동안은 그 자리 — 읽던 카드가 튀지 않게) */ } else { U.open.add(id); const d = docOf(id); if (d && isNew({ id, ...d })) U.seen.add(id); if (d && isNew({ id, ...d })) W([{ op: 'merge', id, data: { readAt: at } }]); } render(); return; }
      if (a === 'fav') { const on = !(docOf(id) || {}).pinned; return W([{ op: 'merge', id, data: { pinned: on } }], on ? '⭐ 즐겨찾기에 넣었습니다' : '즐겨찾기에서 뺐습니다'); }
      if (a === 'done') return W([{ op: 'merge', id, data: { state: 'done', stateAt: at, readAt: (docOf(id) || {}).readAt || at } }], '✅ 완료로 옮겼습니다');
      if (a === 'hold') return W([{ op: 'merge', id, data: { state: 'held', stateAt: at, readAt: (docOf(id) || {}).readAt || at } }], '⏸ 보류로 옮겼습니다 — ⏸ 보류 탭에서 [↩ 검토로]');
      if (a === 'archive') return W([{ op: 'merge', id, data: { state: 'archived', stateAt: at, readAt: (docOf(id) || {}).readAt || at } }], '🗄 보관함으로 옮겼습니다');
      if (a === 'trash') return W([{ op: 'merge', id, data: { state: 'trashed', stateAt: at, readAt: (docOf(id) || {}).readAt || at } }], '🗑 휴지통으로 옮겼습니다 — 휴지통에서 되살릴 수 있습니다');
      if (a === 'restore') return W([{ op: 'merge', id, data: { state: 'open', stateAt: at, readAt: (docOf(id) || {}).readAt || at, trashed: false, archived: false } }], '↩ 검토로 되돌렸습니다');
      if (a === 'read') return W([{ op: 'merge', id, data: { readAt: at } }], '👁 읽음 — 검토로 옮겼습니다');
      if (a === 'readall') { const M = model(view()); const L = M.cards.filter(isNew).map((c) => ({ op: 'merge', id: c.id, data: { readAt: at } })); for (let i = 0; i < L.length; i += 50) await W(L.slice(i, i + 50)); toast(`👁 ${L.length}개를 읽음으로`); return; }
      if (a === 'tofeed') { goFeed(); return; }
      if (a === 'cfg') { U.cfgOpen = !U.cfgOpen; render(); return; }
      if (a === 'cfgx') { U.cfgOpen = false; render(); return; }
      if (a === 'mtoggle') { const mid = b.dataset.mid; const op = mOpenOf(model(view()), mid); const S0 = cfgOf(model(view()).meta).mineOpen ? U.mClosed : U.mOpen; if (cfgOf(model(view()).meta).mineOpen ? !op : op) S0.delete(mid); else S0.add(mid); if (U.medit === mid && op) { U.medit = null; U.meditDraft = null; } render(); return; }
      if (a === 'mfav') { const on = !(docOf(b.dataset.mid) || {}).pinned; return W([{ op: 'merge', id: b.dataset.mid, data: { pinned: on } }], on ? '⭐ 내 메모 즐겨찾기에 넣었습니다' : '즐겨찾기에서 뺐습니다'); }
      if (a === 'march') return W([{ op: 'merge', id: b.dataset.mid, data: { state: 'archived', stateAt: at } }], '🗄 보관함으로 옮겼습니다 — 지우지 않음 · 🗄 보관함에서 꺼냅니다');
      if (a === 'unquote') { if (U.comp) U.comp.quote = null; render(); return; }
      if (a === 'memo') { const ta = root.querySelector(`[data-ta="${CSS.escape(id)}"]`); const txt = ((ta && ta.value) || '').trim(); if (!txt) { toast('메모 글을 적어 주세요'); if (ta) ta.focus(); return; } const d = docOf(id) || {}; const quote = U.comp && U.comp.cardId === id ? U.comp.quote : null; const mid = rid('m');
        if (ta) ta.value = ''; U.draft = ''; U.comp = null; if (ta) ta.blur();
        const ops = [{ op: 'set', id: mid, data: { kind: 'memo', cardId: id, cardTitle: String(d.title || '').slice(0, 300), quote: quote || null, text: txt, by: 'jb', at, state: 'open', slot: U.slot } }]; if (d && isNew({ id, ...d })) ops.push({ op: 'merge', id, data: { readAt: at } });
        return W(ops, '💬 메모를 달았습니다 — 통합 노트(보낼 대기)에 쌓였습니다'); }
      if (a === 'feedmemo') { const ta = root.querySelector('#jbn-feed-ta'); const txt = ((ta && ta.value) || '').trim(); if (!txt) { toast('적을 글이 없습니다'); return; } if (ta) { ta.value = ''; ta.blur(); } U.feedDraft = ''; clearTimeout(U.dT); U.dDirty = false; const n = U.slot;
        return W([{ op: 'set', id: rid('m'), data: { kind: 'memo', cardId: null, cardTitle: null, quote: null, text: txt, by: 'jb', at, state: 'open', slot: n } }, { op: 'merge', id: 'slot_' + n, data: { kind: 'slot', slot: n, draft: '', at } }], `💾 저장${n}에 쌓았습니다`); }
      if (a === 'mineadd') { const ta = root.querySelector('#jbn-mine-ta'); const txt = ((ta && ta.value) || '').trim(); if (!txt) { toast('적을 글이 없습니다'); if (ta) ta.focus(); return; } if (ta) { ta.value = ''; ta.blur(); } U.mineDraft = '';
        return W([{ op: 'set', id: rid('j'), data: { kind: 'jbmemo', text: txt, by: 'jb', at, state: 'open' } }], '📝 내 메모에 적었습니다 — Claude에게는 가지 않습니다'); }
      if (a === 'medit') { U.medit = b.dataset.mid; U.meditDraft = String((docOf(U.medit) || {}).text || ''); render(); const t = root.querySelector('#jbn-med'); if (t) t.focus(); return; }
      if (a === 'mcancel') { U.medit = null; U.meditDraft = null; const t = root.querySelector('#jbn-med'); if (t) { t.value = ''; t.blur(); } render(); return; }
      if (a === 'msave') { const t = root.querySelector('#jbn-med'); const v = ((t && t.value) || '').trim(); if (!v) { toast('글이 비었습니다 — 버리려면 [🗑 휴지통]'); return; } U.medit = null; U.meditDraft = null; if (t) { t.value = ''; t.blur(); } return W([{ op: 'merge', id: b.dataset.mid, data: { text: v, editedAt: at } }], '📝 고쳤습니다'); }
      if (a === 'mtrash') return W([{ op: 'merge', id: b.dataset.mid, data: { state: 'trashed', stateAt: at } }], '🗑 내 메모를 휴지통으로 — 아래 휴지통에서 되살릴 수 있습니다');
      if (a === 'mrestore') { const was = (docOf(b.dataset.mid) || {}).state; return W([{ op: 'merge', id: b.dataset.mid, data: { state: 'open', stateAt: at } }], was === 'archived' ? '↩ 보관에서 꺼냈습니다 — 전체에 있습니다' : '↩ 내 메모를 되살렸습니다'); }
      if (a === 'qup' || a === 'qdown') { const Q = queueOf(model(view())); const k = Q.findIndex((m) => m.id === b.dataset.mid); const j = a === 'qup' ? k - 1 : k + 1; if (k < 0 || j < 0 || j >= Q.length) return; const ord = Q.map((m, x) => x * 10); [ord[k], ord[j]] = [ord[j], ord[k]]; return W(Q.map((m, x) => ({ op: 'merge', id: m.id, data: { ord: ord[x] } }))); }
      if (a === 'qedit') { U.edit = b.dataset.mid; U.editDraft = String((docOf(U.edit) || {}).text || ''); render(); const t = root.querySelector('#jbn-ed'); if (t) t.focus(); return; }
      if (a === 'qcancel') { U.edit = null; const t = root.querySelector('#jbn-ed'); if (t) { t.value = ''; t.blur(); } render(); return; }
      if (a === 'qsave') { const t = root.querySelector('#jbn-ed'); const v = ((t && t.value) || '').trim(); if (!v) { toast('글이 비었습니다 — 빼려면 [빼기]'); return; } U.edit = null; if (t) { t.value = ''; t.blur(); } return W([{ op: 'merge', id: b.dataset.mid, data: { text: v, editedAt: at } }], '고쳤습니다'); }
      if (a === 'memotrash') { const mid = b.dataset.mid; return W([{ op: 'merge', id: mid, data: { state: 'trashed' } }], '메모를 휴지통으로 — 지우지는 않았습니다'); }
      if (a === 'send') { if (U.busy) return; const n = U.slot; clearTimeout(U.dT); const fta = root.querySelector('#jbn-feed-ta'); const dr = ((fta && fta.value) || U.feedDraft || '').trim();
        if (dr) { const mid = rid('m'); if (fta) fta.value = ''; U.feedDraft = ''; U.dDirty = false; /* 아직 [적기] 안 한 글도 잃지 않게 그 칸 메모로 먼저 */
          await W([{ op: 'set', id: mid, data: { kind: 'memo', cardId: null, cardTitle: null, quote: null, text: dr, by: 'jb', at, state: 'open', slot: n } }, { op: 'merge', id: 'slot_' + n, data: { kind: 'slot', slot: n, draft: '', at } }]); if (!view().get(mid)) return; }
        const M = model(view()); const un = queueOf(M, n); if (!un.length) return;
        U.busy = true; b.disabled = true; b.textContent = '보내는 중…'; const bid = rid('b'); const text = compose(un, new Map(M.cards.map((c) => [c.id, c])), opt.link) + ` · 묶음 ${bid}`;
        let r; try { r = await store.send(text, un.map((m) => m.id)); } catch (e2) { r = { status: 'queued', via: 'outbox', err: String((e2 && (e2.code || e2.message)) || e2).slice(0, 200) }; }
        r = r || { status: 'queued', via: 'outbox' };
        const ops = [{ op: 'set', id: bid, data: { kind: 'batch', slot: n, memoIds: un.map((m) => m.id), text, at, via: r.via || 'outbox', status: r.status || 'queued', err: r.err || null } }, { op: 'merge', id: 'slot_' + n, data: { kind: 'slot', slot: n, draft: '', at, sentAt: at } }].concat(un.map((m) => ({ op: 'merge', id: m.id, data: { batchId: bid } })));
        U.busy = false; for (let i = 0; i < ops.length; i += 50) await W(ops.slice(i, i + 50)); toast((r.status === 'sent' ? '📨 리드 채팅으로 보냈습니다' : '⏳ 리드가 10분 안에 받아 갑니다(바로 보내기 연결이 안 됨)') + ` · 💾 저장${n}은 비었습니다`); return; }
    });
    // 문장 고르기 → 메모
    const selCheck = () => { const s = window.getSelection && window.getSelection(); const t = s && !s.isCollapsed ? String(s).trim() : ''; const n = s && s.anchorNode; const bd = n && (n.nodeType === 1 ? n : n.parentElement); const body = bd && bd.closest && bd.closest('[data-body]'); if (!t || !body || !root.contains(body) || t.length > 2000) { selBtn.hidden = true; return; } const r = s.getRangeAt(0).getBoundingClientRect(); selBtn.hidden = false; selBtn.style.left = Math.max(8, Math.min(window.innerWidth - 180, r.left)) + 'px'; selBtn.style.top = Math.max(8, Math.min(window.innerHeight - 50, r.bottom + 8)) + 'px'; selBtn._q = t; selBtn._card = body.dataset.body; selBtn._r = { left: r.left, top: r.top, bottom: r.bottom }; };
    const onSel = () => { clearTimeout(U.selT); U.selT = setTimeout(selCheck, 180); }; document.addEventListener('selectionchange', onSel);
    selBtn.addEventListener('mousedown', (e) => e.preventDefault());
    /* (note4 · 정범님 11/13 15:06) 고른 글 → 그 자리 작은 버블(claude.ai 채팅처럼) — 메모 쓰고 Enter = 인용+메모가 통합 노트에 쌓임 · Shift+Enter 줄바꿈 · Esc 닫기 · 화면은 움직이지 않음(읽던 자리 그대로) */
    const bub = document.createElement('div'); bub.className = 'jbn jbn-bub'; bub.hidden = true; bub.setAttribute('role', 'dialog'); bub.setAttribute('aria-label', '고른 글에 메모');
    bub.innerHTML = '<div class="qt" data-bq></div><label for="jbn-bub-ta" style="position:absolute;left:-9999px">고른 글에 대한 메모</label><textarea id="jbn-bub-ta" rows="2" placeholder="메모 — Enter 쌓기 · Shift+Enter 줄바꿈 · Esc 닫기"></textarea><div class="bf"><span>인용과 함께 아래 통합 노트에 쌓입니다</span><span class="jbn-sp"></span><button type="button" class="jbn-b" data-bub="x">닫기</button><button type="button" class="jbn-b pri" data-bub="ok">💬 쌓기</button></div>';
    document.body.appendChild(bub); const bta = bub.querySelector('textarea');
    const bubClose = () => { bub.hidden = true; U.bub = null; bta.value = ''; };
    function bubOpen(id, q, r) { U.bub = { cardId: id, quote: q }; bub.querySelector('[data-bq]').textContent = '“' + q.slice(0, 240) + (q.length > 240 ? '…' : '') + '”'; bta.value = ''; bub.hidden = false;
      const W0 = window.innerWidth, H0 = window.innerHeight, w = Math.min(380, W0 - 24); bub.style.width = w + 'px';
      if (W0 <= 520) { bub.style.left = '12px'; bub.style.top = 'calc(8px + env(safe-area-inset-top, 0px))'; } /* 휴대폰: 자판이 아래에서 올라오므로 화면 위에 */
      else { const h = bub.offsetHeight || 150; const below = r.bottom + 8 + h < H0 - 8; bub.style.left = Math.max(12, Math.min(W0 - w - 12, r.left)) + 'px'; bub.style.top = (below ? r.bottom + 8 : Math.max(8, r.top - h - 8)) + 'px'; }
      try { bta.focus({ preventScroll: true }); } catch (e) { bta.focus(); } }
    async function bubSave() { const b0 = U.bub; const txt = bta.value.trim(); if (!b0) return; if (!txt) { toast('메모 글을 적어 주세요'); bta.focus({ preventScroll: true }); return; }
      const d = docOf(b0.cardId) || {}; const at = nowIso(); bubClose(); try { const s0 = window.getSelection(); if (s0) s0.removeAllRanges(); } catch (e) {}
      const ops = [{ op: 'set', id: rid('m'), data: { kind: 'memo', cardId: b0.cardId, cardTitle: String(d.title || '').slice(0, 300), quote: b0.quote, text: txt, by: 'jb', at, state: 'open', slot: U.slot } }]; if (isNew({ id: b0.cardId, ...d })) ops.push({ op: 'merge', id: b0.cardId, data: { readAt: at } });
      await W(ops, '💬 인용과 메모를 아래 통합 노트에 쌓았습니다'); }
    bta.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); bubClose(); return; } if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); bubSave(); } });
    bub.addEventListener('click', (e) => { const t = e.target.closest('[data-bub]'); if (!t) return; if (t.dataset.bub === 'x') bubClose(); else bubSave(); });
    document.addEventListener('mousedown', (e) => { if (!bub.hidden && !bub.contains(e.target) && !bta.value.trim()) bubClose(); });
    selBtn.addEventListener('click', () => { const id = selBtn._card, q = selBtn._q, r = selBtn._r || { left: 20, top: 20, bottom: 40 }; selBtn.hidden = true; if (!id) return; bubOpen(id, q, r); });
    jump.addEventListener('click', () => { const f = root.querySelector('#jbn-feed'); if (f) f.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
    render();
    return { render, destroy() { document.removeEventListener('selectionchange', onSel); clearTimeout(rT); U.dead = true; selBtn.remove(); jump.remove(); bub.remove(); if (U.toastEl) U.toastEl.remove(); root.innerHTML = ''; }, U };
  }
  G.JBN = { mount, model, tree, md, compose, queueOf, isNew, tabOf, stateOf, isFav, slotOf, SLOTS, STYLE, version: '4' };
})(typeof window !== 'undefined' ? window : globalThis);
/* ⟦jbn core 끝⟧ */

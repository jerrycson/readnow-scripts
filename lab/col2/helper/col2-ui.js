/* col2-ui.js — 📊 옆 창 골격 (0.1.7 정범님 11/09 밤 'UI도 앞으로 이 수집기만을 쓰는 것을 전제로 — 전체 골격은 내가 모든 것을 설정하고 조정하는 형태
 *   · 접고 열고 · 아이콘 형태로 최소화 등 디테일 · 기존에 불편했던 점·중복·쓸데없는 것도 추려서')
 * 틀: 머리띠(이 PC · 🗒 기록 · ❓ 설명서 · ⚙ 설정 · ▁ 작게) + 칸(카드) 여럿 — 칸마다 접기·열기 · 순서 · 숨기기(지우지 않고 설정에서 다시 켬)
 *   · ▁ 작게 = 창 전체를 떠 있는 작은 단추(상태 색 점)로 → 누르면 원래 자리·크기로 · ⚙ 설정 = 칸·단축키·창·바로 가기·일 켜기·이 PC 이름·내보내기/가져오기·기본값
 *   · 설정은 PC마다(도우미 col2.json 의 ui · 화면엔 rn3-ui 로 먼저 그림) · 앞으로 기능이 늘면 helper statusHtml 에 <details class="card" data-card="새이름"> 하나 + CARDS 한 줄
 * 순수 부분(normalize·단축키 이름·겹침 검사)은 도우미(node)와 화면이 같이 씀 · 브라우저 팝업 없음(두 번 누르기·화면 안 알림) · 기기 저장은 Col2Store.ls(rn3-)만 */
(function (root) {
  'use strict';
  /* ── 칸(카드) — office: 사무실 PC만(로거엔 칸 자체가 없음 · 약속 0) · open/hide = 기본값 ── */
  const CARDS = [
    /* (11/11 col2ui1 정범님 '자주 쓰는 기능은 앞면, 아닌 것은 가리면서') 맨 위 한눈 카드(이 PC·로그인 점·오늘 읽음 막대·지금 하는 일·문제 한 줄·단추 넷)가 앞면 — 아래 칸은 처음엔 접힘 */
    { id: 'now', icon: '▶', t: '자세한 상태', open: false },
    { id: 'y24', icon: '🟦', t: '예스24 판매관리 읽기', open: false, office: true },
    { id: 'go', icon: '🔗', t: '바로 가기', open: false },
    { id: 'al', icon: '🟧', t: '알라딘 샵매니저 읽기(그림자)', open: false, office: true }, /* (알라딘 읽기) 읽기만 · 기본 꺼짐 */
    { id: 'reads', icon: '📥', t: '최근 그림자 읽기', open: false },
    { id: 'work', icon: '🪟', t: '숨은 작업 창·점검', open: false },
    { id: 'tail', icon: '🧾', t: '도우미 글 끝(옛 칸)', open: false, hide: true },
    { id: 'rect', icon: '📐', t: '창 자리·크기 숫자(옛 칸)', open: false, hide: true },
  ];
  /* ── 단축키 — 정범님이 ⚙ 설정에서 바꿈(비우면 끔) ── */
  const ACTIONS = [
    { id: 'log', t: '🗒 기록창 열기·닫기', def: 'Alt+L' },
    { id: 'close', t: '열린 겹창(기록창·설정·설명서) 닫기', def: 'Esc' },
    { id: 'find', t: '기록창 찾기 칸으로', def: '/' },
    { id: 'help', t: '❓ 설명서 열기·닫기', def: 'Alt+H' },
    { id: 'set', t: '⚙ 설정 열기·닫기', def: 'Alt+O' }, /* (11/10 ux2 · 웹앱과 맞춤) 예전 Alt+S = 웹앱 등록 「🔎 검색창」과 같은 글자 */
    { id: 'mini', t: '▁ 작은 단추로 줄이기·펼치기', def: 'Alt+Shift+M' }, /* 예전 Alt+M = 웹앱 「💬 팀 채팅 입력 줄」 */
    { id: 'go', t: '🔗 바로 가기 칸으로(찾기 칸에 커서)', def: 'Ctrl+K' }, /* 예전 Alt+G = 웹앱 「📖 화면 설명서」 · Ctrl+K = 웹앱 '검색창으로'와 같은 뜻(11/10) */
    { id: 'reload', t: '↻ 상태 지금 새로 보기', def: 'Alt+U' }, /* 예전 Alt+R = 웹앱 「🪟 알라딘 화면」 */
  ];
  /* (11/10 ux2) 웹앱(리드나우)에서 다른 일을 하는 키 — 고를 수는 있지만 ⚠ 노랑 알림(같은 PC에서 오가면 손이 헷갈림) · 같은 뜻인 키(Ctrl+K·Alt+K 찾기 칸 · Alt+H 설명서 · Esc 닫기 · / 찾기)와 웹앱에 기록창이 없는 Alt+L은 뺌
   *  예전 기본값(OLD_DEF)은 저장된 설정에서도 한 번 새 기본값으로 옮김(kv 2) — 사람이 일부러 고른 다른 키는 그대로 */
  const WEBAPP = { 'Alt+S': '등록 「🔎 검색창」', 'Alt+G': '「📖 화면 설명서」', 'Alt+M': '「💬 팀 채팅 입력 줄」', 'Alt+R': '「🪟 알라딘 화면」', 'Alt+E': '「📑 옆에서 크게」', 'Alt+N': '「💬 대화 기록」·등록 「빼기」', 'Alt+B': '「→ 결정 대기」', 'Alt+A': '「🪟 알라딘 창」', 'Alt+Z': '「시장 지표 위 가격」', 'Alt+C': '「시장 지표 아래 가격」', 'Alt+X': '「+5%」', 'Alt+F': '등록 「늘 포커스」', 'Alt+V': '등록 「보기 바꾸기」', 'Alt+P': '등록 「판매가 칸」', 'Alt+J': '등록 「지금 할 카드 다음」', 'Alt+Q': '「하위 탭 이전」', 'Alt+W': '「하위 탭 다음」', 'Alt+1': '「탭 이전」', 'Alt+2': '「탭 다음」', 'Alt+,': '「💬 입력 줄 펼치기」', 'Alt+ArrowUp': '「이전 카드」', 'Alt+ArrowDown': '「다음 카드」', 'Alt+Home': '「맨 위로」', 'Alt+End': '「맨 아래로」', 'Alt+Shift+F': '등록 「⚡ 상태 모음 빠른 찾기」', 'Alt+Shift+D': '등록 「📚 옆 서랍」', 'Alt+Shift+N': '등록 「💬 대화 기록」', 'Alt+Shift+A': '책방 친구 「👥 모두에게로」', 'Alt+Shift+W': '책방 친구 「🤫 속삭임 상대」', 'Alt+Shift+R': '책방 친구 「🤫 속삭임 답장」' };
  const OLD_DEF = { set: 'Alt+S', mini: 'Alt+M', go: 'Alt+G', reload: 'Alt+R' };
  /* 크롬·윈도우가 쓰는 단축키 — 고르지 못하게(눌러도 크롬이 먼저 가져감) */
  const RESERVED = ['Ctrl+W', 'Ctrl+Shift+W', 'Ctrl+R', 'Ctrl+Shift+R', 'F5', 'Ctrl+F5', 'Alt+F4', 'Alt+F', 'Alt+E', 'Ctrl+T', 'Ctrl+Shift+T', 'Ctrl+N', 'Ctrl+Shift+N', 'Ctrl+Q', 'Ctrl+Shift+Q', 'F12', 'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+P', 'Ctrl+L', 'Alt+Space', 'Ctrl+Tab', 'Alt+Tab', 'Alt+Home', 'Alt+ArrowLeft', 'Alt+ArrowRight', 'F11', 'Ctrl+D', 'Ctrl+H', 'Ctrl+J', 'Ctrl+F', 'Ctrl+S', 'Ctrl+O', 'Ctrl+U', 'Ctrl+C', 'Ctrl+V', 'Ctrl+X', 'Ctrl+A', 'Ctrl+Z', 'F1', 'F3', 'F6', 'F7', 'F10'];
  const MINI = { w: 132, h: 104, top: true }; /* 작은 단추 창 크기 — 근거: 없음, 설정으로 바꿈(크롬이 이보다 작게 못 줄이면 크롬 최소 크기) */
  const MODS = ['Ctrl', 'Alt', 'Shift', 'Meta'];
  const ENTRY = ['Enter', 'Tab', 'Space', 'Backspace', 'Delete'];
  /* 누른 키 → 이름(한글 입력 중에도 같게 — 글자·숫자는 자리(code)로) */
  function keyName(e) { const c = String(e.code || ''), k = String(e.key || ''); if (MODS.concat(['Control', 'AltGraph']).includes(k)) return '';
    if (/^Key[A-Z]$/.test(c)) return c.slice(3); if (/^Digit\d$/.test(c)) return c.slice(5); if (k === 'Escape' || k === 'Esc') return 'Esc'; if (k === ' ') return 'Space';
    if (/^F\d{1,2}$/.test(k) || ['Enter', 'Tab', 'Backspace', 'Delete', 'Home', 'End', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Insert'].includes(k)) return k;
    if (k.length === 1) return /[a-z]/.test(k) ? k.toUpperCase() : k; return ''; }
  const single = (k) => k.length === 1 && !/[A-Z0-9]/.test(k); /* '/' '?' 같은 기호 하나 — Shift는 글자에 이미 들어 있음 */
  function comboOf(e) { const k = keyName(e); if (!k) return ''; const m = []; if (e.ctrlKey) m.push('Ctrl'); if (e.altKey) m.push('Alt'); if (e.shiftKey && !single(k)) m.push('Shift'); if (e.metaKey) m.push('Meta'); return m.concat(k).join('+'); }
  /* 글로 적은 단축키를 한 꼴로(Alt+l → Alt+L · shift+alt+x → Alt+Shift+X) · 이상하면 null */
  function normCombo(s) { s = String(s == null ? '' : s).trim(); if (!s) return ''; if (s.length > 24) return null; const parts = s === '+' ? ['+'] : s.split('+').filter((x, i, a) => x !== '' || (i === a.length - 1 && a.length > 1)); let key = parts.pop(); if (key === '') key = '+';
    const mods = new Set(); for (const p of parts) { const q = MODS.find((m) => m.toLowerCase() === p.toLowerCase()) || (p.toLowerCase() === 'control' ? 'Ctrl' : null); if (!q) return null; mods.add(q); }
    if (/^esc(ape)?$/i.test(key)) key = 'Esc'; else if (/^[a-z]$/i.test(key)) key = key.toUpperCase(); else if (/^f\d{1,2}$/i.test(key)) key = key.toUpperCase(); else if (/^space$/i.test(key)) key = 'Space';
    if (!(key.length === 1 || /^(Esc|Space|Enter|Tab|Backspace|Delete|Home|End|PageUp|PageDown|Insert|Arrow(Up|Down|Left|Right)|F\d{1,2})$/.test(key))) return null;
    if (single(key)) mods.delete('Shift'); return MODS.filter((m) => mods.has(m)).concat(key).join('+'); }
  const match = (e, combo) => !!combo && comboOf(e) === combo;
  /* 겹침·못 쓰는 키 검사 → { ok, errs:[{a, why}] } */
  function check(keys) { const errs = []; const seen = {};
    for (const A of ACTIONS) { const c = keys[A.id]; if (!c) continue; const p = c.split('+'); const key = p[p.length - 1]; const hasMod = p.some((x) => ['Ctrl', 'Alt', 'Meta'].includes(x));
      if (!hasMod && (/^[A-Z0-9]$/.test(key) || ENTRY.includes(key))) errs.push({ a: A.id, why: `${c} 하나만은 글 쓰다 잘못 눌림 — Alt·Ctrl과 함께` });
      else if (RESERVED.includes(c)) errs.push({ a: A.id, why: `${c}는 크롬·윈도우가 먼저 씀` });
      if (seen[c]) errs.push({ a: A.id, why: `${c}가 '${ACTIONS.find((x) => x.id === seen[c]).t}'와 겹침`, with: seen[c] }); else seen[c] = A.id; }
    const warns = []; for (const A of ACTIONS) { const c = keys[A.id]; if (c && WEBAPP[c]) warns.push({ a: A.id, why: `⚠ ${c}는 웹앱(리드나우)에서 ${WEBAPP[c]} — 같은 PC에서 오가면 헷갈릴 수 있음(창이 달라 실제로 부딪히진 않음)` }); }
    return { ok: !errs.length, errs, warns }; }
  const defKeys = () => Object.fromEntries(ACTIONS.map((a) => [a.id, a.def]));
  const num = (v, lo, hi, d) => { const n = Math.round(+v); return Number.isFinite(n) && n >= lo && n <= hi ? n : d; };
  /* 설정 한 꼴로 — 모르는 칸·이상한 값은 버리고 기본값 · keys 는 겹치면 그대로 두고 check 가 알림 */
  function normalize(u) { u = u && typeof u === 'object' ? u : {}; const ids = CARDS.map((c) => c.id);
    const order = (Array.isArray(u.order) ? u.order.map(String).filter((x, i, a) => ids.includes(x) && a.indexOf(x) === i) : []).concat(ids.filter((x) => !(Array.isArray(u.order) && u.order.includes(x))));
    const cards = {}; for (const c of CARDS) { const v = (u.cards && typeof u.cards === 'object' && u.cards[c.id]) || {}; cards[c.id] = { open: v.open == null ? !!c.open : !!v.open, hide: v.hide == null ? !!c.hide : !!v.hide }; }
    const keys = defKeys(); const mig = u.kv !== 2; if (u.keys && typeof u.keys === 'object') for (const A of ACTIONS) if (u.keys[A.id] != null) { const n = normCombo(u.keys[A.id]); if (n != null && !(mig && OLD_DEF[A.id] && n === OLD_DEF[A.id])) keys[A.id] = n; } /* (11/10 ux2) 예전 기본값 → 새 기본값(한 번) */
    const prof = String(u.goProf == null ? '' : u.goProf); return { v: 1, kv: 2, order, cards, keys, mini: !!u.mini, miniW: num(u.miniW, 60, 400, MINI.w), miniH: num(u.miniH, 40, 400, MINI.h), miniTop: u.miniTop == null ? MINI.top : !!u.miniTop, goProf: /^[\w .-]{0,40}$/.test(prof) ? prof.trim() : '', logPop: u.logPop == null ? true : !!u.logPop, at: num(u.at, 0, 9e15, 0) }; } /* (0.1.8) logPop = 🗒 기록창을 따로 작은 창으로(기본 · 정범님 11/10 새벽) · false면 예전처럼 옆 창 안 */
  /* 내보낼 파일 꼴(비밀값·계정 없음 — 칸·단축키·창·바로 가기 프로필 이름·일 켜기 셋뿐) */
  const EXPORT_KIND = 'readnow-col2-settings';
  function exportDoc(ui, opts, meta) { return { kind: EXPORT_KIND, v: 1, ver: meta && meta.ver, pc: meta && meta.pc, at: new Date().toISOString(), ui: normalize(ui), opts: { side: !!(opts && opts.side), y24: !!(opts && opts.y24), y24Jobs: !!(opts && opts.y24Jobs) } }; }
  function importDoc(txt) { let j; try { j = typeof txt === 'string' ? JSON.parse(txt) : txt; } catch (e) { return { ok: false, err: '설정 파일이 아님(JSON 아님)' }; }
    if (!j || j.kind !== EXPORT_KIND) return { ok: false, err: '번외 수집기 설정 파일이 아님' }; const ui = normalize(j.ui); const ck = check(ui.keys); const o = j.opts || {};
    return { ok: true, ui, opts: { side: o.side != null ? !!o.side : null, y24: o.y24 != null ? !!o.y24 : null, y24Jobs: o.y24Jobs != null ? !!o.y24Jobs : null }, from: { pc: j.pc || '', ver: j.ver || '', at: j.at || '' }, keyErrs: ck.errs }; }
  const CUR = { keys: defKeys(), logPop: true };
  const keysNow = () => CUR.keys;
  /* /log 따로 창처럼 골격 없이 기록창만 있는 화면도 바꾼 단축키를 씀 */
  async function loadKeys(api) { try { const j = await api('GET', '/ui'); if (j && j.ok) { const u = normalize(j.ui); CUR.keys = u.keys; CUR.logPop = u.logPop; } } catch (e) {} return CUR.keys; }
  const logMode = () => ((CUR.logPopFn ? CUR.logPopFn() : CUR.logPop) ? 'pop' : 'in'); /* (0.1.8) 기록창 여는 곳 — col2-logwin mount(o.mode)가 누를 때마다 봄 */
  const logMatch = (e, a) => match(e, CUR.keys[a]);
  const keyLabel = (a) => CUR.keys[a] || '끔';

  /* ── 화면(브라우저) ── */
  const CSS = `h1#hd{position:sticky;top:0;z-index:40;flex-wrap:nowrap;align-items:center}h1#hd #hdT{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}h1#hd .jwb{margin:0;padding:2px 6px;flex:none}h1#hd .jwb.on{background:#2F5D50;color:#fff}
details.card>summary{display:flex;gap:4px;align-items:baseline}details.card>summary .cs{margin-left:auto;font-weight:400;color:var(--sub);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55%}
.ov2{position:fixed;left:6px;right:6px;top:36px;bottom:6px;z-index:60;background:var(--card);color:var(--ink);border:1px solid var(--pri);border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.2);display:none;flex-direction:column;overflow:hidden}.ov2.on{display:flex}
.ov2 .oh{display:flex;align-items:center;gap:6px;padding:5px 8px;background:var(--pri);color:#fff;font-weight:700}.ov2 .oh b{flex:1}.ov2 .oh button{background:#fff;color:var(--pri);border:0;margin:0}.ov2 .obody{flex:1;overflow:auto;padding:6px 8px}
.ov2 h3{font-size:12.5px;margin:8px 0 3px;color:var(--pri)}.ov2 table{border-collapse:collapse;width:100%;font-size:11.5px}.ov2 td,.ov2 th{border-bottom:1px solid var(--line);padding:2px 3px;text-align:left;vertical-align:top}
.row{display:flex;align-items:center;gap:4px;flex-wrap:wrap;padding:2px 0;border-bottom:1px solid var(--line)}.row .rt{flex:1;min-width:120px}.row button{padding:1px 6px;margin:0}
.kb{font:11.5px ui-monospace,Consolas,monospace;min-width:70px}.kb.cap{background:var(--warn);color:#fff;border-color:var(--warn)}.bad{color:var(--no);font-size:11px}
#miniIc{display:none;position:fixed;inset:0;width:100%;height:100%;border:0;border-radius:0;margin:0;background:#5A4A86;color:#fff;font:700 13px system-ui,'Malgun Gothic';cursor:pointer;flex-direction:column;align-items:center;justify-content:center;gap:2px}
#miniIc .dot{width:14px;height:14px;border-radius:50%;background:#9AA5A1;box-shadow:0 0 0 2px #fff}#miniIc .dot.ok{background:#3DBE7A}#miniIc .dot.warn{background:#F0A030}#miniIc .dot.err{background:#E0483C}#miniIc small{font-weight:400;font-size:10.5px;opacity:.9;max-width:96%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
body.mini>*:not(#miniIc):not(script):not(style){display:none!important}body.mini #miniIc{display:flex}body.mini{overflow:hidden}
.gob{display:flex;flex-wrap:wrap;gap:2px}.gob button{margin:0}.gog{font-size:11px;color:var(--sub);margin:3px 0 1px}#gom{min-height:1.3em}
.gl{background:var(--card);border:1px solid var(--line);border-radius:var(--r,10px);padding:9px 10px;margin:0 0 8px;display:flex;flex-direction:column;gap:7px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.gl1{display:flex;align-items:center;gap:6px;min-width:0}.gl1 b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.glsp{flex:1}
.gdot{width:11px;height:11px;border-radius:50%;background:#9AA5A1;flex:none}.gdot.ok{background:#3DBE7A}.gdot.warn{background:#F0A030}.gdot.err{background:#E0483C}
.glch{display:flex;gap:5px;flex-wrap:wrap}.ch{display:inline-flex;align-items:center;gap:4px;font-size:12px;padding:2px 9px;border-radius:999px;background:var(--bg);border:1px solid var(--line);white-space:nowrap}.ch[hidden]{display:none}.ch i{font-style:normal;color:var(--sub)}
.ch::before{content:'';width:8px;height:8px;border-radius:50%;background:#9AA5A1}.ch.ok::before{background:#3DBE7A}.ch.warn::before{background:#F0A030}.ch.err::before{background:#E0483C}.ch.err{border-color:var(--no);color:var(--no)}
.glt{display:flex;justify-content:space-between;font-size:12px;color:var(--sub)}.glt b{color:var(--ink)}.bar{height:8px;border-radius:4px;background:var(--soft,#E6EFEB);overflow:hidden;margin-top:2px}.bar i{display:block;height:100%;width:0;background:var(--pri);transition:width .4s}.bar i.full{background:var(--warn)}
.glnow{font-size:12.5px;min-height:1.4em;overflow-wrap:anywhere}
.glerr{display:flex;align-items:center;gap:8px;background:var(--noSoft,#FDECEA);border:1px solid var(--no);border-radius:8px;padding:6px 8px}.glerr[hidden]{display:none}.glerr.warn{background:var(--warnSoft,#FFF4E5);border-color:var(--warn)}.glet{flex:1;min-width:0;display:flex;flex-direction:column}.glet b{color:var(--no);font-size:12.5px}.glerr.warn .glet b{color:var(--warn)}.glet span{font-size:11.5px;color:var(--ink)}.glerr button{flex:none;margin:0}.glerr button[hidden]{display:none}
.front{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.front button{margin:0;padding:6px 2px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-radius:8px}
@media (max-width:330px){.front{grid-template-columns:repeat(2,1fr)}}
.ib{border:0;background:none;color:var(--sub);padding:0 3px;margin:0;font-size:12px;cursor:help}.ibt{background:var(--bg);border-radius:6px;padding:4px 6px;margin:3px 0;font-size:11.5px;white-space:normal}.ibt[hidden]{display:none}
.gh{font-weight:700;font-size:12.5px;color:var(--pri);margin:4px 0 2px}
details.grp{border:1px solid var(--line);border-radius:8px;margin:6px 0;padding:0 8px;background:var(--card)}details.grp>summary{cursor:pointer;padding:6px 0;font-weight:700;list-style:none}details.grp>summary::-webkit-details-marker{display:none}details.grp>summary::before{content:'▸ ';color:var(--sub)}details.grp[open]>summary::before{content:'▾ '}details.grp>summary .k{font-weight:400;margin-left:4px}details.grp[open]{padding-bottom:6px}
.sgrid{display:flex;flex-direction:column}.srow{display:grid;grid-template-columns:1fr auto;gap:2px 6px;align-items:center;padding:4px 0;border-bottom:1px solid var(--line)}.srow:last-child{border-bottom:0}
.srow .sl{min-width:0;font-size:12.5px}.srow .sv{display:flex;align-items:center;gap:3px;justify-self:end}.srow .sv input[type=number]{width:72px;text-align:right}.srow .sv input[type=time]{width:92px}.srow .sd{grid-column:1/-1;font-size:11px;color:var(--sub)}.srow .se{grid-column:1/-1;font-size:11px}.srow .se:empty{display:none}.srow .ibt{grid-column:1/-1}
.bdg{display:inline-block;font-size:10.5px;padding:0 5px;border-radius:999px;border:1px solid var(--line);margin-left:3px}.bdg.all{border-color:var(--pri);color:var(--pri)}.bdg.pc{border-color:var(--warn);color:var(--warn)}
.srow .rs{padding:0 5px;font-size:11px;margin:0}.sgh{font-size:11.5px;color:var(--sub);margin:6px 0 0;font-weight:700}
.lg{font-size:11.5px;padding:2px 0;border-bottom:1px dashed var(--line)}`;

  /* side({ api, ls, ver }) — 옆 창(상태 창 /) 골격 · 칸 내용(HTML)은 도우미 statusHtml 이 그려 둠 · 여기선 다룸·고침·설정 */
  function side(o) {
    const doc = document, api = o.api, ls = o.ls; const $ = (i) => doc.getElementById(i);
    const E = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const st0 = doc.createElement('style'); st0.textContent = CSS; doc.head.appendChild(st0);
    let UI = normalize(ls.get('ui', null)); CUR.keys = UI.keys; CUR.logPopFn = () => UI.logPop; /* (0.1.8) 설정을 받거나·가져오거나·기본값으로 돌려도 늘 지금 UI 값 */ let S = null, kind = ls.get('kind', 'office'), saveT = null, armReset = 0, armImp = 0, imp = null, cap = null, edit = 0, arm = 0, lastLoad = 0;
    const post = (p, b) => api('POST', p, b || {});
    const msg = (t, el) => { const m = el || $('m'); if (m) m.textContent = t; };
    /* 칸 놓기 — 순서대로 옮기고, 숨긴 칸·로거에 없는 칸은 감춤(지우지 않음) */
    const cardOf = (id) => doc.querySelector(`details.card[data-card="${id}"]`);
    const cardDef = (id) => CARDS.find((c) => c.id === id);
    const absent = (id) => { const c = cardDef(id); return !!(c && c.office && kind === 'logger'); };
    function apply() { const box = $('cards'); for (const id of UI.order) { const el = cardOf(id); if (!el) continue; box.appendChild(el); const v = UI.cards[id]; el.style.display = v.hide || absent(id) ? 'none' : ''; if (el.open !== v.open) el.open = v.open; }
      CUR.keys = UI.keys; drawKeysHint(); }
    function save(now) { UI.at = Date.now(); ls.set('ui', UI); clearTimeout(saveT); const go = async () => { try { const j = await post('/ui', { ui: UI }); if (j && j.ok === false && j.errs) msg('✗ 단축키: ' + j.errs.map((x) => x.why).join(' · '), $('setm')); } catch (e) {} }; if (now) return go(); saveT = setTimeout(go, 300); }
    doc.querySelectorAll('details.card').forEach((el) => { el.addEventListener('toggle', () => { const id = el.dataset.card; if (!UI.cards[id] || UI.cards[id].open === el.open) return; UI.cards[id].open = el.open; save(); if (el.open) load(); }); });
    /* 머리띠 단추 */
    const ovs = { set: $('ovSet'), help: $('ovHelp') };
    const isOpen = (k) => ovs[k].classList.contains('on');
    function openOv(k, on) { for (const x of Object.keys(ovs)) if (x !== k) ovs[x].classList.remove('on'); ovs[k].classList.toggle('on', on == null ? !isOpen(k) : !!on); $(k === 'set' ? 'setBtn' : 'helpBtn').classList.toggle('on', isOpen(k)); $(k === 'set' ? 'helpBtn' : 'setBtn').classList.remove('on');
      if (isOpen(k)) { if (k === 'set') { drawSet(); drawSetRows(); } else drawHelp(); } }
    $('setBtn').onclick = () => openOv('set'); $('helpBtn').onclick = () => openOv('help');
    doc.querySelectorAll('[data-ovx]').forEach((b) => (b.onclick = () => openOv(b.dataset.ovx, false)));
    /* ▁ 작게 — 창 전체를 떠 있는 작은 단추로 · 누르면 원래 자리·크기(도우미가 기억한 옆 창 자리) */
    async function setMini(on, why) { UI.mini = !!on; doc.body.classList.toggle('mini', UI.mini); save(true); drawMini();
      try { const j = await post('/win/mini', { on: UI.mini, w: UI.miniW, h: UI.miniH, top: UI.miniTop, why: why || '' }); if (j && !j.ok && !UI.mini) msg('✗ ' + (j.err || '')); } catch (e) {} if (!UI.mini) load(); }
    $('miniBtn').onclick = () => setMini(true, '머리띠 ▁'); $('miniIc').onclick = () => setMini(false, '작은 단추');
    function lvl() { const W = root.Col2Log ? root.Col2Log.stopWhy(S, kind) : []; return { l: !S ? 'err' : W.some((x) => x.l === 'err') ? 'err' : W.length ? 'warn' : 'ok', W }; }
    function drawMini() { const ic = $('miniIc'); if (!ic) return; const { l, W } = lvl(); ic.querySelector('.dot').className = 'dot ' + l; ic.querySelector('small').textContent = W.length ? W[0].t : S ? '잘 돎' : '도우미 안 보임'; ic.title = '눌러서 펼치기 (' + keyLabel('mini') + ')' + (W.length ? '\n' + W.map((x) => x.t).join('\n') : ''); }
    /* ── 지금 칸 · 예스24 칸 · 읽기 칸 · 작업 창 칸 고침 ── */
    const hm = (ms) => (ms ? new Date(+ms + 9 * 3600e3).toISOString().slice(11, 16) : '—'); const T = (ms) => new Date(+ms + 9 * 3600e3).toISOString().slice(11, 19);
    /* (11/11 정범님 '바깥 사이트 읽기 몫') 바깥 사이트는 알라딘 몫과 따로 — 사이트마다 오늘 쓴 수/하루 상한 · 간격(운영 외부 정보 출처 규칙) */
    function siteLine(x) { const L = (x && x.sites) || []; if (!L.length) return '<b>🌐 바깥 사이트 몫</b>(사이트마다 따로 · 알라딘 몫과 별개) — 오늘 아직 안 씀';
      return '<b>🌐 바깥 사이트 몫</b>(사이트마다 따로 · 알라딘 몫과 별개) — 오늘 ' + x.n + '번: ' + L.slice(0, 8).map((y) => E(y.label) + ' ' + y.n + '/' + y.cap + (y.coolMs ? '(쉼 ' + Math.ceil(y.coolMs / 60000) + '분)' : y.n >= y.cap ? '(다 씀)' : '') + ' · ' + Math.round(y.gapMs / 100) / 10 + '초 간격').join(' · ') + (L.length > 8 ? ' 외 ' + (L.length - 8) + '곳' : ''); }
    function drawNow(s) { const rl = s.relay || {}; const { W } = lvl(); $('stop').innerHTML = W.length ? W.map((x) => `<div class="${x.l === 'err' ? 'no' : 'wa'}">⛔ ${E(x.t)}</div>`).join('') : '<div class="ok">✓ 멈춘 데 없음 — 잘 돌고 있음</div>';
      const p = s.pace || {}; $('st').innerHTML = '번외 수집 ' + (s.on ? '<span class="ok">켜짐</span>' : '<span class="no">꺼짐</span>') + ' · 숨은 크롬 ' + (s.alive ? '<span class="ok">떠 있음</span>' : '<span class="no">없음</span>') + '<br>' + (root.autoLine ? root.autoLine(s) : '')
        + '<br><span class="k" id="paceAl"><b>🟧 알라딘 몫</b>(사람 속도 두 배 · 알라딘 화면만) — 한 장 뒤 ' + Math.round((p.minGapMs || 0) / 100) / 10 + '초 안팎 · 이번 시간 ' + (p.hourN || 0) + '/' + (p.hourCap || 0) + '장 · 오늘 ' + (p.dayN || 0) + '/' + (p.dayCap || 0) + '장' + (p.coolMs ? ' · 쉬는 중 ' + Math.ceil(p.coolMs / 60000) + '분' : '') + '</span>'
        + '<br><span class="k" id="paceExt">' + siteLine(s.site) + '</span>' + (rl.outN ? '<br><span class="k">웹앱이 아직 안 올린 결과 ' + rl.outN + '건</span>' : '');
      $('onb').textContent = arm ? (s.on ? '한 번 더 누르면 끔' : '한 번 더 누르면 켬') : (s.on ? '⏹ 끄기' : '▶ 켜기'); $('onb').className = s.on ? 'warn' : 'p';
      const cs = cardOf('now') && cardOf('now').querySelector('.cs'); if (cs) cs.textContent = W.length ? '⛔ ' + W[0].t : s.on ? '잘 돎' : '꺼짐'; }
    function drawAl(s) { const a = s.al || {}; if (!$('al')) return; let h; if (a.logger) h = '<span class="k">로거 PC — 알라딘 로그인 일 안 함(약속 0)</span>'; else if (!a.on) h = '<span class="wa">꺼 둠</span> <span class="k">(기본 꺼짐 · ⚙ 설정 › 일 켜기·끄기에서 켬 · 읽기만)</span>';
      else if (a.pp) h = '<span class="no">⛔ 핑퐁 의심으로 멈춤</span><br><span class="k">' + E(a.pp) + '</span>';
      else if (a.login === 'need') h = '<span class="no">🔐 알라딘 샵매니저 로그인 필요</span><br><span class="k">아래 단추를 한 번 누르면 알라딘 창이 앞으로 나옵니다 — 그 창에서 직접 로그인하면 저절로 숨음(아이디·비밀번호는 저장하지 않음 · 저절로 다시 로그인하지 않음)' + (a.loginMsg ? ' · 까닭: ' + E(a.loginMsg) : '') + '</span>';
      else if (a.login === 'wait') h = '<span class="wa">🔐 알라딘 로그인 창이 열려 있음</span>';
      else { const d = a.day || {}; h = (a.active ? '<span class="ok">그림자 읽는 중</span>' : '<span class="wa">쉬는 중</span>') + '<br><span class="k">오늘 ' + (d.n || 0) + '장 · 견줌 같음 ' + (d.same || 0) + ' · 다름 ' + (d.diff || 0) + ' · 운영 문서 기다림 ' + (d.wait || 0) + '</span>'; }
      /* (11/11) 창의 실제 주소로 본 로그인 상태 — 표시가 실제 창과 어긋나지 않게 */ if (a.on && a.pg && a.pg.p) h += '<br><span class="' + (a.pg.login ? 'no' : 'k') + '">창 주소: ' + (a.pg.login ? '로그인 화면(' + E(a.pg.p) + ') — 지금 로그인 안 됨' : E(a.pg.p)) + '</span>';
      /* (11/11) 🪑 로그인 자리 — 누가 확인했는지(이 PC 운영 수집기 다리 · 또는 다리가 없을 때 웹앱이 자리 문서로) · 빈자리가 없으면 몇 대를 어느 기기가 쓰는지 */
      if (a.on) { const w = a.ws || {}; const by = a.seatBy === 'bridge' ? '이 PC 운영 수집기(다리)가 확인' : a.seatBy === 'web' ? '운영 수집기가 꺼져 있어 웹앱이 자리 문서로 확인' : !a.feed ? (a.web ? '운영 수집기가 꺼져 있어 웹앱이 자리 문서로 확인하는 중' : '운영 수집기·웹앱 모두 안 보임 — 이 PC에서 웹앱을 열면 곧바로 확인') : '다리가 확인하는 중';
        h += '<br><span id="alSeat" class="' + (a.seat ? 'ok' : 'wa') + '">🪑 알라딘 로그인 자리: ' + (a.seat ? '받음' : '아직 없음') + (w.max != null && !a.feed ? ' (' + (w.n != null ? w.n : '?') + '/' + w.max + '대)' : '') + '</span> <span class="k">' + E(by) + (!a.seat && a.tell ? ' · ' + E(a.tell.now) : !a.seat && a.seatWhy ? ' · ' + E(a.seatWhy) : '') + (!a.seat && !a.tell && w.held && w.held.length ? ' · 쓰는 기기: ' + E(w.held.join(', ')) : '') + '</span>' + (!a.seat && a.tell && a.tell.todo ? '<br><span id="alSeatTodo" class="wa">→ 지금 할 일: ' + E(a.tell.todo) + '</span>' : ''); } /* (11/11 col2rep1) 무엇이 자리를 쥐고 있는지(기기·마지막 신호)·누가 확인하는지·지금 할 일 */
      if (a.on && a.msg && a.login !== 'need') h += '<br><span class="k">' + E(a.msg) + '</span>'; $('al').innerHTML = h;
      const want = a.logger || !a.on ? '' : a.login !== 'ok' || a.pp ? 'lg' : 'run'; if ($('alb').dataset.w !== want) { $('alb').dataset.w = want;
        $('alb').innerHTML = want === 'lg' ? '<button class="p" id="allg">🔐 알라딘 로그인 (처음 한 번)</button>' : want === 'run' ? '<button data-a="confirm">📦 주문확인요청 지금</button><button data-a="list">📋 상품 목록 지금</button>' : '';
        const lg = $('allg'); if (lg) lg.onclick = async () => { msg('…'); const j = await post('/al/login', { why: '옆 창 단추' }); msg((j.ok ? '✓ ' : '✗ ') + (j.msg || j.err || '')); load(); };
        $('alb').querySelectorAll('[data-a]').forEach((b) => (b.onclick = async () => { const j = await post('/al/run', { what: b.dataset.a }); msg((j.ok ? '✓ ' : '✗ ') + (j.msg || j.err || '')); load(); })); }
      const cs = cardOf('al') && cardOf('al').querySelector('.cs'); if (cs) cs.textContent = a.logger ? '' : !a.on ? '꺼 둠' : a.pp ? '⛔ 멈춤' : a.login === 'need' ? '🔐 로그인 필요' : a.active ? '읽는 중' : '쉼'; }
    function drawY24(s) { const y = s.y24 || {}; let h; if (y.logger) h = '<span class="k">로거 PC — 예스24 판매관리 읽기 안 함(약속 0)</span>'; else if (y.mine === false) h = '<span class="k">🔒 예스24는 ' + E(y.holder || 'HOME') + '이(가) 맡음 — 이 PC 번외는 예스24 일을 하지 않음(바꾸기: 웹앱 ⚙ 설정 › 🟦 예스24)</span>'; else if (!y.on) h = '<span class="wa">꺼 둠</span> <span class="k">' + E(s.on ? '(⚙ 설정 › 일 켜기·끄기에서 켬)' : '(번외 수집이 꺼져 있음)') + '</span>';
      else if (y.login === 'need') h = '<span class="no">🔐 예스24 로그인 필요</span><br><span class="k">아래 단추를 한 번 누르면 예스24 창이 앞으로 나옵니다 — 그 창에서 로그인하면 저절로 숨고 읽기를 이어 갑니다(아이디·비밀번호는 저장하지 않음)' + (y.loginMsg ? ' · 까닭: ' + E(y.loginMsg) : '') + '</span>' + (y.reWhy ? '<br><span class="wa">스스로 다시 로그인을 안 하는 까닭: ' + E(y.reWhy.why) + '</span>' : '') + (y.already ? '<br><span class="no">⛔ 「이미 로그인된 예스24」 화면 ' + E(y.already.n) + '번 — 되풀이 로그인하지 않고 멈춤 · 아래 단추로 사람이 한 번</span>' : '');
      else if (y.login === 'wait') h = '<span class="wa">🔐 예스24 로그인 창이 열려 있음</span> <span class="k">— 그 창에서 로그인하면 저절로 숨김 · 입력이 없으면 저장된 계정으로 번외가 스스로 로그인</span>';
      else h = (y.active ? '<span class="ok">읽는 중</span>' : '<span class="wa">쉬는 중</span>') + ' · 로그인 ' + (y.login === 'ok' ? '<span class="ok">살아 있음</span>' : '확인 중') + '<br><span class="k">주문 두 목록 마지막 ' + hm(y.ord && y.ord.at) + (y.ord && y.ord.nextMs != null ? ' · 다음 ' + Math.ceil(y.ord.nextMs / 60000) + '분 뒤' : '') + ' · 등록상품 ' + (y.prd && y.prd.at ? hm(y.prd.at) + ' 매물 ' + (y.prd.n || 0) : '아직') + '</span>';
      /* (11/11) 창의 실제 주소로 본 로그인 상태 — 표시가 실제 창과 어긋나지 않게 */ if (y.on && y.pg && y.pg.p) h += '<br><span class="' + (y.pg.login ? 'no' : 'k') + '">창 주소: ' + (y.pg.login ? '로그인 화면(' + E(y.pg.p) + ') — 지금 로그인 안 됨' : E(y.pg.p)) + '</span>';
      if (y.on && y.msg && y.login !== 'need') h += '<br><span class="k">' + E(y.msg) + '</span>'; $('y24').innerHTML = h;
      const want = y.logger || !y.on ? '' : y.login !== 'ok' ? 'lg' : 'run'; if ($('y24b').dataset.w !== want) { $('y24b').dataset.w = want;
        $('y24b').innerHTML = want === 'lg' ? '<button class="p" id="y24lg">🔐 예스24 로그인 (처음 한 번)</button>' : want === 'run' ? '<button data-y="ord">🔁 주문 지금</button><button data-y="prd">📋 등록상품 전부</button><button data-y="tour">🛰 둘러보기</button>' : '';
        const lg = $('y24lg'); if (lg) lg.onclick = async () => { msg('…'); const j = await post('/y24/login', { why: '옆 창 단추' }); msg((j.ok ? '✓ ' : '✗ ') + (j.msg || j.err || '')); load(); };
        $('y24b').querySelectorAll('[data-y]').forEach((b) => (b.onclick = async () => { const j = await post('/y24/run', { what: b.dataset.y }); msg((j.ok ? '✓ ' : '✗ ') + (j.msg || j.err || '')); load(); })); }
      const cs = cardOf('y24') && cardOf('y24').querySelector('.cs'); if (cs) cs.textContent = y.logger ? '' : y.mine === false ? '🔒 ' + (y.holder || 'HOME') + ' 맡음' : !y.on ? '꺼 둠' : y.login === 'need' ? '🔐 로그인 필요' : y.active ? '읽는 중' : '쉼'; }
    function drawWork(s) { $('wk').innerHTML = '숨은 크롬 ' + (s.alive ? '떠 있음' : '없음') + (s.alive && !s.headless ? (s.shown ? ' · <b>보이는 중</b>' : ' · 숨김') : '') + (s.headless ? ' · 화면 없음' : '') + '<br><span class="k">' + E(s.msg || '') + ' · 최근 한 시간 다시 띄움 ' + s.opens + '번 · 운영 공용 파일 ' + E(Object.entries((s.core && s.core.ver) || {}).map(([k, v]) => k.replace(/^readnow-|-core\.js$/g, '') + ' ' + v).join(' · ') || '아직 안 받음') + (s.upd && s.upd.msg ? ' · 새 판: ' + E(s.upd.msg) : '') + '</span>'; }
    function drawLists(s) { if ($('rd') && UI.cards.reads.open) $('rd').innerHTML = s.reads && s.reads.length ? s.reads.slice().reverse().map((x) => E(String(x.at).slice(11)) + ' ' + E(x.itemId) + ' ' + (x.ok ? '✓ ' + E(x.title || '') : '✗ ' + E(x.why || ''))).join('\n') : '—';
      if ($('ln') && !UI.cards.tail.hide && UI.cards.tail.open) $('ln').innerHTML = s.logs && s.logs.length ? s.logs.map((e) => T(e.t) + ' ' + E(e.m)).join('\n') : '—';
      if (!edit && !UI.cards.rect.hide) { const f = (q, v) => ['x', 'y', 'w', 'h'].forEach((k) => { const i = $(q + k); if (i) i.value = v && v[k] != null ? v[k] : ''; }); f('w', s.win); f('h', s.hwin); } }
    function drawHead(s) { const k = s.kind === 'logger' ? 'logger' : 'office'; if (k !== kind) { kind = k; ls.set('kind', k); apply(); drawGo(); } $('hdP').textContent = '🖥 이 PC: ' + (s.pc || '—') + (kind === 'logger' ? ' · 🛰 로거' : ' · 🏢 사무실'); doc.title = '📊 번외 수집기 — ' + (s.pc || ''); }
    async function load() { lastLoad = Date.now(); try { const s = await api('GET', '/status'); if (s.ver && s.ver !== o.ver && new URLSearchParams(location.search).get('v') !== s.ver) { location.replace(location.pathname + '?v=' + encodeURIComponent(s.ver)); return; }
        S = s; if (root.pcShow) root.pcShow(s); if (root.__jw && root.__jw.setState) root.__jw.setState(s); drawHead(s); drawMini(); if (UI.mini) return; drawGlance(s); drawNow(s); if (kind !== 'logger') drawAl(s); if (kind !== 'logger') drawY24(s); drawWork(s); drawLists(s); if (isOpen('set')) drawToggles(); }
      catch (e) { S = null; drawMini(); try { drawGlance(null); } catch (er) {} if ($('stop')) $('stop').innerHTML = '<div class="no">⛔ 도우미에 닿지 못함: ' + E(e.message) + '</div>'; } }
    /* ── (11/11 col2ui1 정범님 '디자인을 더 직관적이고 심플하게') 한눈 카드 — 이 PC · 로그인 점 · 오늘 읽음/한도 막대 · 지금 하는 일 · 문제 한 줄(무엇·할 일)과 [고치기] ── */
    const hhmm = (t) => (t ? new Date(+t + 9 * 3600e3).toISOString().slice(11, 16) : '');
    function probs(s) { const P = []; if (!s) return [{ l: 'err', w: '도우미에 닿지 못함', t: '잠시 기다리세요 — 번외 도우미가 다시 켜지는 중일 수 있음' }];
      const y = s.y24 || {}, a = s.al || {}, ch = s.chrome || {}, p = s.pace || {}, R = s.relogin || {}, off = kind === 'logger';
      if (s.pause) P.push({ l: 'warn', w: '⏸ 잠깐 멈춤', t: hhmm(s.pause) + '에 저절로 다시 켬', fix: '지금 켜기', go: () => post('/pause', { min: 0 }) });
      else if (!s.on) P.push({ l: 'err', w: '번외 수집 꺼짐', t: '켜야 읽음 — 운영 수집기는 그대로', fix: '켜기', go: () => post('/cfg', { on: true, src: 'pc' }) });
      if (s.on && !off && y.on && y.login === 'need') P.push({ l: 'err', w: '예스24 로그인 풀림', t: (R.y24 && R.y24.has ? '저장된 계정으로 스스로 다시 해 보거나, ' : '') + '한 번 로그인하면 이어 읽음', fix: '로그인', go: () => post('/y24/login', { why: '한눈 카드 [고치기]' }) });
      if (s.on && !off && a.on && a.pp) P.push({ l: 'err', w: '알라딘 읽기 멈춤(핑퐁 의심)', t: '기록을 보고 까닭 확인', fix: '기록 보기', go: async () => { if (root.__jw && root.__jw.setOpen) root.__jw.setOpen(true); return { ok: true, msg: '기록창' }; } });
      else if (s.on && !off && a.on && a.login === 'need') P.push({ l: 'err', w: '알라딘 샵매니저 로그인 풀림', t: a.seat ? '한 번 로그인하면 이어 읽음' : '로그인 자리가 나면 이어 감', fix: '로그인', go: () => post('/al/login', { why: '한눈 카드 [고치기]' }) });
      for (const pf of ['y24', 'al']) { const r = R[pf]; if (!off && r && r.stop) P.push({ l: 'err', w: (pf === 'al' ? '알라딘' : '예스24') + ' 스스로 다시 로그인 멈춤', t: '저장된 계정을 확인하고 [다시 해 보기]', fix: '계정 보기', go: async () => { openGrp('cred'); return { ok: true, msg: '계정 칸' }; } }); }
      if (s.on && ch.coolUntil) P.push({ l: 'err', w: '숨은 크롬이 자꾸 꺼짐', t: String(ch.coolUntil).slice(11, 16) + '까지 쉼 — 다시 열어 볼 수 있음', fix: '다시 열기', go: () => post('/win/reopen', { why: '한눈 카드 [고치기]' }) });
      if (s.on && p.coolMs) P.push({ l: 'warn', w: '알라딘 「요청 많음」', t: Math.ceil(p.coolMs / 60000) + '분 쉬고 저절로 다시' });
      if (s.relay && s.relay.err) P.push({ l: 'warn', w: '웹앱이 결과를 못 올림', t: '이 PC 웹앱이 열려 있는지 확인' });
      return P.sort((x, z) => (x.l === 'err' ? 0 : 1) - (z.l === 'err' ? 0 : 1)); }
    const chipOf = (el, l, t) => { if (!el) return; el.className = 'ch ' + l; el.querySelector('i').textContent = t; };
    function drawGlance(s) { const g = $('glance'); if (!g) return; const P = probs(s); const lv = !s ? 'err' : P.some((x) => x.l === 'err') ? 'err' : P.length ? 'warn' : 'ok';
      $('glDot').className = 'gdot ' + lv; $('glPc').textContent = (s && s.pc) || '이 PC'; $('glKind').textContent = kind === 'logger' ? '🛰 로거' : '🏢 사무실';
      const y = (s && s.y24) || {}, a = (s && s.al) || {}, nv = s && s.naver; const C = (k) => g.querySelector(`.ch[data-s="${k}"]`);
      if (kind === 'logger') chipOf(C('al'), s && s.on ? 'ok' : '', '공개 화면만');
      else if (a.on) chipOf(C('al'), a.login === 'ok' ? 'ok' : a.login === 'need' || a.pp ? 'err' : 'warn', a.pp ? '멈춤' : a.login === 'ok' ? '로그인' : a.login === 'need' ? '로그인 필요' : '확인 중');
      else chipOf(C('al'), s && s.on ? 'ok' : '', '공개 화면');
      const cy = C('y24'); cy.hidden = kind === 'logger'; if (!y.on) chipOf(cy, '', '꺼 둠'); else chipOf(cy, y.login === 'ok' ? 'ok' : y.login === 'need' ? 'err' : 'warn', y.login === 'ok' ? '로그인' : y.login === 'need' ? '로그인 필요' : y.login === 'wait' ? '로그인 창 열림' : '확인 중');
      const cn = C('nv'); cn.hidden = !nv; if (nv) chipOf(cn, !nv.on ? '' : nv.login === 'ok' || nv.ok ? 'ok' : nv.login === 'need' ? 'err' : 'warn', !nv.on ? '꺼 둠' : nv.login === 'need' ? '로그인 필요' : nv.login === 'ok' || nv.ok ? '돎' : '확인 중');
      const p = (s && s.pace) || {}; const n = +p.dayN || 0, cap = +p.dayCap || 0; $('glN').textContent = `${n.toLocaleString('ko-KR')} / ${cap ? cap.toLocaleString('ko-KR') : '—'}장`; const bi = $('glBar'); bi.style.width = (cap ? Math.min(100, Math.round((n / cap) * 100)) : 0) + '%'; bi.className = cap && n >= cap ? 'full' : '';
      const au = (s && s.auto) || {}; let now = !s ? '도우미를 찾는 중' : s.pause ? '⏸ 잠깐 멈춤 — ' + hhmm(s.pause) + '에 다시 켬' : !s.on ? '꺼짐' : s.reading ? '📖 알라딘 공개 화면 읽는 중' : cap && n >= cap ? '✓ 오늘 몫을 다 읽음 — 내일 이어 감' : au.msg ? String(au.msg).split(' — ')[0].slice(0, 70) : '돌고 있음';
      if (s && s.on && !s.pause && au.nextMs != null && !s.reading && !(cap && n >= cap)) { const sec = Math.ceil(au.nextMs / 1000); now += ` · 다음 ${sec >= 120 ? Math.round(sec / 60) + '분' : sec + '초'} 뒤`; } $('glNow').textContent = now;
      const e = $('glErr'), top = P[0]; e.hidden = !top; if (top) { e.className = 'glerr' + (top.l === 'err' ? '' : ' warn'); $('glErrW').textContent = top.w + (P.length > 1 ? ` (외 ${P.length - 1})` : ''); $('glErrT').textContent = top.t; $('glFix').hidden = !top.go; $('glFix').textContent = top.fix || '고치기';
        $('glFix').onclick = async () => { msg('…'); try { const j = await top.go(); msg(j && j.ok === false ? '✗ ' + (j.err || '') : '✓ ' + ((j && j.msg) || top.fix)); } catch (er) { msg('✗ ' + er.message); } load(); }; e.title = P.map((x) => x.w + ' — ' + x.t).join('\n'); }
      /* 앞면 단추 넷 — 로그인 · 지금 읽기 · 잠깐 멈춤 · 자세히 */
      const need = !s || kind === 'logger' ? null : y.on && y.login === 'need' ? 'y24' : a.on && a.login === 'need' ? 'al' : null; const fl = $('fLogin');
      fl.disabled = !need; fl.textContent = need ? '🔐 ' + (need === 'y24' ? '예스24' : '알라딘') + ' 로그인' : '🔐 로그인 ✓'; fl.title = need ? '그 사이트 창이 앞으로 나옴 — 직접 로그인하면 저절로 숨음' : kind === 'logger' ? '로거 PC는 로그인 일을 안 함' : '로그인이 필요한 곳 없음';
      fl.onclick = async () => { if (!need) return; const j = await post(need === 'y24' ? '/y24/login' : '/al/login', { why: '앞면 [로그인]' }); msg((j.ok ? '✓ ' : '✗ ') + (j.msg || j.err || '')); load(); };
      const fp = $('fPause'); const ps = !!(s && s.pause), offN = !!(s && !s.on && !s.pause); fp.textContent = ps ? '▶ 다시 켜기' : offN ? '▶ 켜기' : '⏸ 30분 멈춤'; fp.className = ps || offN ? 'p' : ''; fp.title = ps ? '잠깐 멈춤을 풀고 곧바로 다시 켬' : offN ? '번외 수집 켜기' : '30분 동안 숨은 크롬을 닫고 쉼 — 그 뒤 저절로 다시 켬';
      fp.onclick = async () => { const j = ps ? await post('/pause', { min: 0 }) : offN ? await post('/cfg', { on: true, src: 'pc' }) : await post('/pause', { min: 30 }); msg(j && j.ok === false ? '✗ ' + (j.err || '') : '✓ ' + (ps ? '다시 켬' : offN ? '켰습니다' : '30분 멈춤 — 그 뒤 저절로 다시 켬')); load(); };
      const fr = $('fRead'); fr.disabled = !s || !s.on; fr.title = '쉬는 중이면 기다리지 않고 지금 다음 차례를 읽음(속도·하루 한도는 그대로)';
      fr.onclick = async () => { const j = await post('/read/now', {}); msg((j.ok ? '✓ ' : '✗ ') + (j.msg || j.err || '')); load(); }; }
    if ($('fMore')) $('fMore').onclick = () => openOv('set', true);
    if ($('glBarBox')) $('glBarBox').onclick = () => openGrp('limit');
    /* ⓘ 설명 — 눌러야 보임(뒤에 오는 .ibt · 없으면 같은 줄 안의 .ibt) */
    doc.addEventListener('click', (ev) => { const b = ev.target.closest && ev.target.closest('.ib'); if (!b) return; ev.preventDefault(); let t = b.nextElementSibling; while (t && !t.classList.contains('ibt')) t = t.nextElementSibling; if (!t) { const row = b.closest('.srow,.row,#pcbar,#ownbox,.grp'); t = row && row.querySelector('.ibt'); } if (t) t.hidden = !t.hidden; });
    function openGrp(id) { openOv('set', true); const g = doc.querySelector(`details.grp[data-grp="${id}"]`); if (g) { g.open = true; g.scrollIntoView({ block: 'start' }); } }
    /* ── (11/11 col2ui1) ⚙ 자세히 — 설정 표(도우미 /settings) · 바꾸면 곧바로 도우미에(범위 검사 · 기록) · 공통 값은 이 PC 웹앱이 모든 PC로 ── */
    let SETR = null; const SM = root.Col2Set;
    const shw = (r, v) => (SM ? SM.show(r, v) : String(v));
    const srcB = (r) => (r.src === 'all' ? '<span class="bdg all" title="모든 PC 같음 — 웹앱 ⚙ 설정 › 🧪 번외 수집기에서도 같은 값">공통</span>' : r.src === 'pc' ? '<span class="bdg pc" title="이 PC에만 적힌 값(예전 설정 파일)">이 PC</span>' : '');
    const valIn = (r) => r.ty === 'bool' ? `<input type="checkbox" data-sk="${E(r.k)}" ${r.v ? 'checked' : ''}>` : r.ty === 'time' ? `<input type="time" data-sk="${E(r.k)}" value="${E(r.v)}">` : `<input type="number" data-sk="${E(r.k)}" value="${E(Math.round((+r.v / r.mul) * 100) / 100)}" min="${E(r.lo / r.mul)}" max="${E(r.hi / r.mul)}" step="${r.ty === 'int' && r.mul === 1 ? 1 : 'any'}">`;
    const rowH = (r) => `<div class="srow" data-srow="${E(r.k)}"><span class="sl">${E(r.t)}${r.i ? ' <button class="ib" type="button" title="설명">ⓘ</button>' : ''}${srcB(r)}</span><span class="sv">${valIn(r)}${r.ty !== 'bool' && r.u ? '<span class="k">' + E(r.u) + '</span>' : ''}${r.src !== 'def' && r.sc === 'all' ? `<button class="rs" type="button" data-sreset="${E(r.k)}" title="기본값(${E(shw(r, r.d))})으로">↺</button>` : ''}</span>${r.i ? `<div class="ibt" hidden>${E(r.i)}</div>` : ''}${r.src !== 'def' ? `<span class="sd">기본 ${E(shw(r, r.d))}</span>` : ''}<span class="se"></span></div>`;
    async function drawSetRows() { if (!$('setG_limit')) return; let j; try { j = await api('GET', '/settings'); } catch (e) { $('setG_limit').textContent = '도우미에 닿지 못함'; return; } if (!j || !j.ok) return; SETR = j;
      const L = j.rows; const site = L.filter((r) => r.site); const by = (g) => L.filter((r) => r.g === g && !r.site);
      $('setOften').innerHTML = L.filter((r) => r.f === 'often' && r.g !== 'pc').map(rowH).join('') || '<span class="k">—</span>';
      $('setG_limit').innerHTML = by('limit').map(rowH).join('') + (site.length ? '<div class="sgh">🌐 바깥 사이트(사이트마다 따로 · 알라딘 몫과 별개)</div>' + site.map(rowH).join('') : '');
      $('setG_time').innerHTML = by('time').map(rowH).join('');
      const lg = j.log || []; $('setLog').innerHTML = (j.pend ? `<div class="wa">⏳ 공통 값 ${j.pend}개 — 이 PC 웹앱이 열려 있으면 1분 안에 모든 PC로 올림</div>` : '') + (j.shared && j.shared.at ? `<div class="k">공통 값 마지막: ${E(hmd(j.shared.at))} · ${E(j.shared.by || '')}</div>` : '') + (lg.length ? lg.map((e) => `<div class="lg">${E(hmd(e.at))} <b>${E(e.t)}</b> ${E(e.from)} → <b>${E(e.to)}</b> <span class="k">· ${E(e.by || '')}${e.sc === 'all' ? ' · 공통' : ' · 이 PC'}</span></div>`).join('') : '<span class="k">아직 바꾼 것 없음</span>'); }
    async function setOne(k, v, el) { const r0 = SETR && SETR.rows.find((x) => x.k === k); const row = el && el.closest('.srow'); const se = row && row.querySelector('.se');
      let j; try { j = await post('/set', { k, v }); } catch (e) { j = { ok: false, err: e.message }; } const t = j.ok ? `✓ 저장 — ${r0 && r0.sc === 'all' ? '모든 PC 공통(이 PC엔 바로 · 다른 PC엔 웹앱이 1분 안에)' : '이 PC'}` : '✗ ' + (j.err || '저장 못 함') + ' — 값은 그대로';
      if (se) { se.className = 'se ' + (j.ok ? 'ok' : 'no'); se.textContent = t; } msg(t, $('setm')); if (j.ok) setTimeout(() => { drawSetRows(); load(); }, 1200); else { const keep = t; await drawSetRows(); const r2 = $('ovSet').querySelector(`[data-srow="${k}"] .se`); if (r2) { r2.className = 'se no'; r2.textContent = keep; } } }
    if ($('ovSet')) { $('ovSet').addEventListener('change', (ev) => { const i = ev.target.closest && ev.target.closest('[data-sk]'); if (!i) return; const r = SETR && SETR.rows.find((x) => x.k === i.dataset.sk); if (!r) return; const v = r.ty === 'bool' ? i.checked : r.ty === 'time' ? i.value : (i.value === '' ? '' : Math.round(+i.value * r.mul * 1e6) / 1e6); setOne(r.k, v, i); });
      $('ovSet').addEventListener('click', (ev) => { const b = ev.target.closest && ev.target.closest('[data-sreset]'); if (!b) return; setOne(b.dataset.sreset, null, b); }); }
    /* 지금 칸 켜기 — 두 번 누르기 */
    $('onb').onclick = async () => { if (!arm) { arm = Date.now(); if (S) drawNow(S); setTimeout(() => { if (arm && Date.now() - arm >= 4000) { arm = 0; if (S) drawNow(S); } }, 4100); return; } arm = 0; const j = await post('/cfg', { on: !(S && S.on), src: 'pc' }); msg(j.on ? '✓ 켰습니다' : '✓ 껐습니다'); load(); };
    doc.querySelectorAll('[data-a]').forEach((b) => (b.onclick = async () => { msg('…'); try { const j = await post('/win/' + b.dataset.a, { why: '옆 창' }); msg((j.ok ? '✓ ' : '✗ ') + (j.msg || j.err || '')); } catch (e) { msg('✗ ' + e.message); } load(); }));
    doc.querySelectorAll('input.n').forEach((i) => (i.oninput = () => { edit = Date.now(); }));
    doc.querySelectorAll('[data-s]').forEach((b) => (b.onclick = async () => { const q = b.dataset.s === 'win' ? 'w' : 'h'; const v = {}; ['x', 'y', 'w', 'h'].forEach((k) => (v[k] = +$(q + k).value)); try { const j = await post('/win/rect', { [b.dataset.s]: v }); msg((j.ok ? '✓ 저장 — ' : '✗ ') + (j.msg || j.err || '')); edit = 0; } catch (e) { msg('✗ ' + e.message); } load(); }));
    /* ── 🔗 바로 가기 ── */
    function drawGo() { const G = root.Col2Go; if (!G || !$('gobox')) return; const L = G.forPc(kind); const by = {}; L.forEach((l) => (by[l.g] = by[l.g] || []).push(l));
      $('gobox').innerHTML = `<div class="k">열리는 곳: <b>평소 크롬</b>(정범님이 로그인해 둔 크롬 · ${UI.goProf ? '프로필 ' + E(UI.goProf) : '마지막에 쓴 프로필'}) 새 탭 — 번외 크롬에서는 열지 않음${kind === 'logger' ? ' · 🛰 로거: 우리 숍·계정 화면은 없음(약속 0)' : ''}</div>`
        + `<div class="row"><input id="goq" type="search" placeholder="찾을 책·ISBN (${E(keyLabel('go'))})" maxlength="60" style="flex:1;min-width:90px"><button data-gq="al-find">알라딘 중고</button>${L.some((l) => l.id === 'y24-find') ? '<button data-gq="y24-find">예스24 중고</button>' : ''}</div>`
        + Object.keys(by).map((g) => `<div class="gog">${E(G.GROUPS[g] || g)}</div><div class="gob">${by[g].filter((l) => !l.q).map((l) => `<button data-go="${E(l.id)}" title="${E(l.url)}">${l.icon} ${E(l.t)}</button>`).join('')}</div>`).join('') + '<div id="gom" class="k"></div>';
      const open = async (id, q) => { msg('…', $('gom')); try { const j = await post('/go', { id, q }); msg((j.ok ? '✓ ' : '✗ ') + (j.msg || j.err || ''), $('gom')); } catch (e) { msg('✗ ' + e.message, $('gom')); } };
      $('gobox').querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => open(b.dataset.go)));
      $('gobox').querySelectorAll('[data-gq]').forEach((b) => (b.onclick = () => open(b.dataset.gq, $('goq').value)));
      $('goq').onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); open('al-find', $('goq').value); } }; }
    /* ── ❓ 설명서 ── */
    function drawHelp() { const H = root.Col2Help; $('helpBody').innerHTML = H ? H.html({ kind, keys: UI.keys, actions: ACTIONS, ver: o.ver, cards: CARDS }) : '설명서 파일을 못 읽음';
      $('helpBody').querySelectorAll('[data-go]').forEach((b) => (b.onclick = async () => { const j = await post('/go', { id: b.dataset.go }); b.title = (j.ok ? '✓ ' : '✗ ') + (j.msg || j.err || ''); }));
      $('helpBody').querySelectorAll('[data-hj]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); const t = $('helpBody').querySelector('#' + a.dataset.hj); if (t) { t.open = true; t.scrollIntoView({ block: 'start' }); } })); }
    /* ── ⚙ 설정 ── */
    function drawToggles() { if (!S || !$('tgbox')) return; const y = S.y24 || {}; const cb = (id, v, k) => { const e = $(id); if (!e) return; e.checked = !!v; e.onchange = async () => { await post('/cfg', { [k]: e.checked, src: 'pc' }); load(); }; };
      $('tgy').style.display = kind === 'logger' ? 'none' : ''; cb('tg_y24', S.y24Want, 'y24'); cb('tg_y24j', S.y24Jobs, 'y24Jobs'); cb('tg_side', S.side, 'side'); cb('tg_al', S.alWant, 'al'); cb('tg_alown', S.alOwn, 'alOwn'); drawCred(); }
    /* (11/10 정범님 '수집기에 아이디·비밀번호 — 필요할 때 스스로 다시 로그인') 🔐 계정 칸 — 로거 PC는 칸 자체를 숨김(약속 0) · 넣은 값은 [잠가 저장] 뒤 곧바로 칸에서 지움 · 상태 글엔 값 없음 */
    function drawCred() { const box = $('crbox'); if (!box) return; box.style.display = kind === 'logger' ? 'none' : ''; if (kind === 'logger') return; const R = S.relogin || {};
      for (const pf of ['y24', 'al']) { const r = R[pf] || {}; const st = $('crs_' + pf); if (!st) continue;
        const ck = !r.has ? '' : r.chk === 'pending' ? ' · ⚠ 확인 기다림(다음 다시 로그인 때 확인)' : r.chk === 'bad' ? ' · ⛔ 저장된 값이 맞지 않음 — 다시 넣어 주세요' : ' · 확인됨';
        /* (11/11 정범님 '아이디·비번 칸이 빈 채로 있어 입력했는지 안 했는지 헷갈림') 저장된 계정 = 큰 배지(🔐 저장됨 · 확인됨 · 아이디 앞 3자) · 칸은 [바꾸기] 때만 열림(자리 표시 ••••(저장됨))
         *  · 저장·확인 뒤에 있었던 옛 실패 줄은 흐리게 '지난 기록'으로 · 지금도 유효한 실패(멈춤·저장 뒤 실패)는 그대로 빨갛게 */
        const okAt = Math.max(+r.chkAt || 0, +r.at || 0); const lastOld = r.last && !r.last.ok && r.chk === 'ok' && okAt && +r.last.at < okAt;
        const lastTxt = r.last ? `마지막 다시 로그인 ${hmd(r.last.at)} ${r.last.ok ? '됨' : '실패 — ' + (r.last.why || '')}` : '';
        st.innerHTML = r.has ? (r.stop ? '<span class="no">' + E(`⛔ 멈춤 — ${r.stop.why}`) + '</span>' : lastTxt ? (lastOld ? '<span class="crold" title="저장·확인 전에 있었던 일 — 지금은 해당 없음">지난 기록: ' + E(lastTxt) + '</span>' : '<span class="' + (r.last.ok ? 'k' : 'no') + '">' + E(lastTxt) + '</span>') : '') + (r.today ? ' <span class="k">· 오늘 ' + r.today + '번</span>' : '')
          : '<span class="wa">저장 안 됨</span>' + (lastTxt ? ' <span class="crold">지난 기록: ' + E(lastTxt) + '</span>' : '');
        const bd = $('crbadge_' + pf), inp = $('crin_' + pf); const busy = !!CRB[pf] || !!(r.job && r.job.on); const open = !r.has || r.chk === 'bad' || !!ED[pf] || busy;
        if (bd) { bd.style.display = r.has ? '' : 'none'; bd.className = 'crbadge ' + (r.chk === 'bad' ? 'bad' : r.chk === 'pending' ? 'pend' : 'ok');
          const hd = `<span id="crbt_${pf}">🔐 저장됨 · ${r.chk === 'bad' ? '⛔ 맞지 않음 — 다시 넣어 주세요' : r.chk === 'pending' ? '⚠ 확인 기다림' : '확인됨'}${r.hint ? ' · 아이디 ' + E(r.hint) : ''}</span><span class="k" style="font-weight:400">${E(hmd(r.chkAt || r.at))} 저장${r.chk === 'ok' ? '·확인' : ''}</span>`;
          if (bd.dataset.h !== hd + open) { bd.dataset.h = hd + open; bd.innerHTML = hd + (open ? '' : `<button id="crch_${pf}" title="저장된 아이디·비밀번호를 바꿀 때만 — 칸이 열림">바꾸기</button>`); const c = $('crch_' + pf); if (c) c.onclick = () => { ED[pf] = true; drawCred(); const i = $('cri_' + pf); if (i) i.focus(); }; } }
        if (inp) inp.style.display = open ? '' : 'none'; const xb = $('crx_' + pf); if (xb) { xb.style.display = r.has && ED[pf] && !busy ? '' : 'none'; xb.onclick = () => { ED[pf] = false; $('cri_' + pf).value = ''; $('crp_' + pf).value = ''; drawCred(); }; }
        if (r.has) { $('cri_' + pf).placeholder = (r.hint || '••••') + '(저장됨 — 바꿀 때만)'; $('crp_' + pf).placeholder = '••••(저장됨)'; } else { $('cri_' + pf).placeholder = '아이디'; $('crp_' + pf).placeholder = '비밀번호'; }
        $('crr_' + pf).style.display = r.stop ? '' : 'none'; const a = $('cra_' + pf); a.checked = r.auto !== false; a.disabled = !r.has; credLine(pf, r.job);
        if (!box.dataset.bound) { a.onchange = async () => { await post('/cred/auto', { pf, on: a.checked }); load(); };
          $('crr_' + pf).onclick = async () => { await post('/cred/reset', { pf }); load(); };
          $('crb_' + pf).onclick = () => credGo(pf, false); $('crf_' + pf).onclick = () => credForce(pf); } }
      box.dataset.bound = '1'; }
    /* (11/10 밤 정범님 '입력하면 예스24는 「확인 중」만 오래 있다가 그냥 풀리고, 알라딘은 아예 안 먹혀') 🔐 [확인하고 저장]
     *  · 누르면 곧바로 '⏳ 확인 중 — 무엇을 하는 중(몇 초째)' — 도우미 relogin.<pf>.job(값 없음)을 1초마다 읽음
     *  · 끝난 결과는 그 칸 아래 줄에 그대로 남음(다시 그려도·창을 다시 열어도 — 도우미가 결과를 지님) · 도우미 답이 끊겨도 결과를 기다려 보임(예전엔 아무 글 없이 단추만 돌아옴)
     *  · 확인을 끝내지 못했으면(시간 넘음·자리 없음 등 — '틀림'이 아닐 때만) [그래도 잠가 저장] 두 번 누르기 · 비밀번호 칸은 그때까지 그대로(맞으면·틀리면 비움) */
    const hmd = (t) => (t ? new Date(t + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' ') : '');
    const CRB = { y24: null, al: null }; const armF = { y24: 0, al: 0 }; const ED = { y24: false, al: false }; /* (11/11) [바꾸기]로 칸을 연 동안 */
    /* (11/11 정범님 '모든 진행에 진행 막대와 끝 요약 · 끝까지 진행되면 정해진 시간 뒤 숨김' · 약속 47) 🔐 계정 확인 로그인 — 웹앱 원스톱 진행 막대와 같은 틀(✓ 지난 단계 › ▶ 지금 › · 남은 단계 · 지금 줄 · 끝 요약)
     *  · 문제없이 끝나면 60초 뒤 한 줄로 숨김(「진행 보기」로 다시) · 실패면 그 단계에 ✗와 까닭을 남김(숨기지 않음) */
    const CR_MS = ['자리 확인', '창 준비', '로그인 화면', '아이디·비밀번호 넣기', '[로그인] 누름', '다시 읽어 확인', '잠가 저장'];
    const crMsI = (ph) => { const t = String(ph || ''); return /자리|하던 읽기/.test(t) ? 0 : /크롬 준비|살아 있는지|임시 창/.test(t) ? 1 : /로그인 화면 여는|보안 문자/.test(t) ? 2 : /칸 찾는|아이디 넣는|비밀번호 넣는/.test(t) ? 3 : /\[로그인\]|떠나기/.test(t) ? 4 : /로그인 뒤|첫 화면으로|확인하는 중/.test(t) ? 5 : /시작/.test(t) ? 0 : -1; };
    const CR_SHOW = { y24: 0, al: 0 }; const CR_HIDE_SEC = 60;
    function crMs(pf, jb, m) { let el = $('crms_' + pf); if (!el) { el = doc.createElement('div'); el.id = 'crms_' + pf; el.className = 'crms'; el.style.cssText = 'font-size:11.5px;margin:3px 0;padding:5px 7px;border-radius:7px;line-height:1.6'; m.parentNode.insertBefore(el, m); }
      if (!jb || (!jb.on && !jb.res)) { el.style.display = 'none'; return; } const res = jb.res; const done = !jb.on && res; const good = done && res.ok; const q = done && res.kind === 'queued';
      let cur = crMsI(jb.phase); if (cur < 0) cur = jb.on ? 0 : 5; const fin = good ? CR_MS.length : cur;
      if (good && res.kind === 'live') cur = 6; /* 세션이 살아 있어 확인 없이 저장 */
      if (good && jb.end && Date.now() - jb.end > CR_HIDE_SEC * 1000 && CR_SHOW[pf] !== jb.end) { el.style.display = ''; el.style.background = 'transparent'; el.style.border = '0'; el.innerHTML = `<span class="k">🔐 계정 확인: ✓ 끝까지 감(${E(hmd(jb.end))}) <small>(문제없이 끝나 ${CR_HIDE_SEC}초 뒤 진행 막대 숨김)</small></span> <button data-crshow="${pf}" style="font-size:11px">진행 보기</button>`; const b = el.querySelector('[data-crshow]'); if (b) b.onclick = () => { CR_SHOW[pf] = jb.end; credLine(pf, jb); }; return; }
      const chip = (l, i) => `<span style="white-space:nowrap;${i === cur && jb.on ? 'font-weight:800' : ''}${(i < fin) ? ';color:#1F6F5C' : done && !good && i === cur ? ';color:#B0322A;font-weight:800' : ''}">${i < fin ? '✓' : jb.on && i === cur ? '▶' : done && !good && i === cur ? (q ? '⏸' : '✗') : '·'} ${E(l)}</span>`;
      const pct = Math.round((good ? 1 : Math.max(0, cur) / CR_MS.length) * 100);
      el.style.display = ''; el.style.border = '2px solid ' + (jb.on ? '#1F6F5C' : good ? '#2E9D5B' : q ? '#E8A33A' : '#B0322A'); el.style.background = jb.on ? '#F2FAF6' : good ? '#E3F4EA' : q ? '#FFF6E6' : '#FDECEC';
      el.innerHTML = `<b>🔐 ${pf === 'al' ? '알라딘' : '예스24'} 계정 확인 로그인</b> <small class="k">${jb.on ? '하는 중' : good ? '끝' : q ? '자리 기다림' : '멈춤'}</small><div style="height:6px;border-radius:3px;background:#0001;margin:3px 0;overflow:hidden"><i style="display:block;height:100%;width:${pct}%;background:${jb.on || good ? '#2E9D5B' : q ? '#E8A33A' : '#B0322A'}"></i></div><div>${CR_MS.map(chip).join(' <small class="k">›</small> ')}</div>`
        + (jb.on ? `<div style="font-weight:700;font-size:13px">▶ 지금: ${E(jb.phase || '')}</div>` : done ? `<div style="font-size:12px">${good ? '끝 요약: ' : q ? '기다림: ' : '멈춘 단계: ' + E(CR_MS[cur] || '') + ' — '}${E(String(res.msg || '').replace(/^[✓✗⏳]\s*/, '').slice(0, 200))}</div>` : ''); }
    function credLine(pf, jb, extra) { const m = $('crm_' + pf), b = $('crb_' + pf), fb = $('crf_' + pf); if (!m) return; crMs(pf, jb || (CRB[pf] ? { on: true, phase: '시작 — 도우미에 보내는 중' } : ((S && S.relogin && S.relogin[pf]) || {}).job || null), m); const on = !!(jb && jb.on) || !!CRB[pf];
      b.disabled = on; b.textContent = on ? '확인하는 중…' : '확인하고 저장';
      if (on) { const at0 = (jb && jb.on && jb.at0) || (CRB[pf] && CRB[pf].t0) || Date.now(); const sec = Math.max(0, Math.round((Date.now() - at0) / 1000)); const ph = (jb && jb.on && jb.phase) || '도우미에 보내는 중';
        m.className = 'k'; m.textContent = `⏳ 확인 중 — ${ph} (${sec}초째${jb && jb.max ? ' · 길어도 ' + jb.max + '초면 끝냄' : ''})${extra ? ' · ' + extra : ''}`; fb.style.display = 'none'; return; }
      const res = jb && jb.res; if (!res) { if (!m.dataset.keep) m.textContent = ''; fb.style.display = 'none'; return; }
      m.className = res.ok ? (res.kind === 'ok' ? 'ok' : 'wa') : res.kind === 'queued' ? 'wa' : 'no'; m.textContent = `${res.msg}${jb.end ? ' (' + hmd(jb.end) + ')' : ''}`; m.dataset.keep = '1';
      const can = !res.ok && res.canForce && jb.end && Date.now() - jb.end < 15 * 60e3 && !!$('crp_' + pf).value; fb.style.display = can ? '' : 'none'; if (!armF[pf]) fb.textContent = '그래도 잠가 저장'; }
    async function credPoll(pf) { let miss = 0; while (CRB[pf]) { await new Promise((r) => setTimeout(r, 1000)); if (!CRB[pf]) break; try { const s = await api('GET', '/status'); miss = 0; const jb = (s.relogin || {})[pf];
          if (CRB[pf].lost && jb && !jb.on && jb.res && jb.end >= CRB[pf].t0 - 2000) { CRB[pf] = null; S = s; credLine(pf, jb); load(); break; }
          if (CRB[pf].lost && !(jb && jb.on)) { CRB[pf].lostN = (CRB[pf].lostN || 0) + 1; if (CRB[pf].lostN > 15) { CRB[pf] = null; credLine(pf, null); const m = $('crm_' + pf); if (m) { m.className = 'no'; m.textContent = '✗ 도우미 답이 끊겨 확인 결과를 모름(저장 안 됐을 수 있음) — 다시 [확인하고 저장]을 눌러 주세요'; m.dataset.keep = '1'; } break; } } credLine(pf, jb && jb.on ? jb : null, CRB[pf].lost ? '도우미 답이 끊겨 결과를 기다리는 중' : '');
        } catch (e) { if (++miss > 20) { CRB[pf] = null; const m = $('crm_' + pf); credLine(pf, null); if (m) { m.className = 'no'; m.textContent = '✗ 도우미에 닿지 못해 결과를 모름 — 도우미가 다시 켜진 뒤 ⚙ › 🔐 칸의 「저장됨」 표시를 보거나 다시 눌러 주세요'; m.dataset.keep = '1'; } } } } }
    async function credGo(pf, force) { const i = $('cri_' + pf), p = $('crp_' + pf); if (CRB[pf]) return; if (!force && (!i.value.trim() || !p.value)) { const m = $('crm_' + pf); m.className = 'no'; m.textContent = '✗ 아이디와 비밀번호를 모두 넣어 주세요'; m.dataset.keep = '1'; return; }
      CRB[pf] = { t0: Date.now() }; credLine(pf, null); msg(force ? '🔐 확인 없이 잠가 저장하는 중' : '🔐 넣은 아이디·비밀번호로 이 PC에서 실제로 로그인해 보는 중 — 맞으면 저장(진행은 그 칸 아래 줄)', $('setm')); credPoll(pf);
      let j = null; try { j = await post('/cred/save', { pf, id: i.value, pw: p.value, ...(force ? { force: true } : {}) }); } catch (e) { if (CRB[pf]) CRB[pf].lost = true; return; } /* 답이 끊겨도 credPoll이 결과를 기다림 */
      CRB[pf] = null; const kd = j && j.kind; if (j && (j.ok || kd === 'bad')) p.value = ''; if (j && j.ok) { i.value = ''; ED[pf] = false; }
      const m = $('crm_' + pf); m.dataset.keep = '1'; const text = j ? (j.ok ? j.msg || '✓ 저장함' : (j.queued ? '⏳ ' : '✗ ') + (j.err || '저장 못 함')) : '✗ 저장 못 함';
      if (j && j.relogin) { S = { ...(S || {}), relogin: j.relogin }; credLine(pf, j.relogin[pf] && j.relogin[pf].job && !j.relogin[pf].job.on ? j.relogin[pf].job : null); }
      if (!j || !j.relogin || !(j.relogin[pf] || {}).job || (j.relogin[pf].job.res || {}).msg == null) { m.className = j && j.ok ? 'ok' : 'no'; m.textContent = text; }
      msg(text, $('setm')); load(); }
    function credForce(pf) { const fb = $('crf_' + pf); if (!armF[pf] || Date.now() - armF[pf] > 4000) { armF[pf] = Date.now(); fb.textContent = '한 번 더 누르면 확인 없이 잠가 저장'; setTimeout(() => { if (armF[pf] && Date.now() - armF[pf] >= 4000) { armF[pf] = 0; fb.textContent = '그래도 잠가 저장'; } }, 4100); return; }
      armF[pf] = 0; fb.textContent = '그래도 잠가 저장'; credGo(pf, true); }
    function drawKeysHint() { const b = (id, a, base) => { const e = $(id); if (e) e.title = base + ' (' + keyLabel(a) + ')'; }; b('helpBtn', 'help', '❓ 이 수집기 설명서'); b('setBtn', 'set', '⚙ 설정 — 칸·단축키·창·바로 가기·내보내기'); b('miniBtn', 'mini', '▁ 작은 단추로 줄이기'); }
    function drawSet() { const ids = UI.order.filter((id) => !absent(id) && cardOf(id));
      $('setCards').innerHTML = ids.map((id, i) => { const c = cardDef(id), v = UI.cards[id]; return `<div class="row" data-cid="${id}"><label class="rt"><input type="checkbox" data-c="show" ${v.hide ? '' : 'checked'}> ${c.icon} ${E(c.t)}</label><label class="k"><input type="checkbox" data-c="open" ${v.open ? 'checked' : ''}> 펼침</label><button data-c="up" ${i ? '' : 'disabled'} title="위로">▲</button><button data-c="down" ${i < ids.length - 1 ? '' : 'disabled'} title="아래로">▼</button></div>`; }).join('');
      const ck = check(UI.keys);
      $('setKeys').innerHTML = ACTIONS.map((A) => { const bad = ck.errs.filter((x) => x.a === A.id); return `<div class="row" data-kid="${A.id}"><span class="rt">${E(A.t)}</span><button class="kb${cap === A.id ? ' cap' : ''}" data-k="cap">${cap === A.id ? '키를 누르세요…' : E(UI.keys[A.id] || '끔')}</button><button data-k="off" title="이 단축키 끄기">끔</button><button data-k="def" title="기본값 ${E(A.def)}">기본</button>${bad.length ? `<div class="bad" style="flex-basis:100%">✗ ${E(bad.map((x) => x.why).join(' · '))}</div>` : ''}${(ck.warns || []).filter((x) => x.a === A.id).map((x) => `<div class="warn" style="flex-basis:100%;color:#8A5A00">${E(x.why)}</div>`).join('')}</div>`; }).join('');
      $('setWin').innerHTML = `<div class="row"><span class="rt">▁ 작은 단추 크기(폭·높이)</span><input class="n" id="mw" value="${UI.miniW}"> <input class="n" id="mh" value="${UI.miniH}"></div><div class="row"><label class="rt"><input type="checkbox" id="mtop" ${UI.miniTop ? 'checked' : ''}> 작은 단추는 늘 다른 창 위에</label></div>`
        + `<div class="row"><span class="rt">🗒 기록창 여는 곳</span><label><input type="radio" name="lpop" id="lpop1" ${UI.logPop ? 'checked' : ''}> 따로 작은 창(기본 · 옆 창 밖에서 옮기고 크기 조절)</label> <label><input type="radio" name="lpop" id="lpop0" ${UI.logPop ? '' : 'checked'}> 이 옆 창 안</label></div>`
        + `<div class="row"><span class="rt">🔗 바로 가기를 열 평소 크롬 프로필 이름 <span class="k">(비우면 마지막에 쓴 프로필 · 예: Default · Profile 1)</span></span><input id="gprof" maxlength="40" value="${E(UI.goProf)}" style="width:110px"></div>`;
      $('mw').onchange = $('mh').onchange = () => { UI.miniW = num($('mw').value, 60, 400, MINI.w); UI.miniH = num($('mh').value, 40, 400, MINI.h); save(); drawSet(); };
      $('mtop').onchange = () => { UI.miniTop = $('mtop').checked; save(); };
      const lp = (v) => () => { UI.logPop = v; save(); if (v && root.__jw && root.__jw.open()) root.__jw.setOpen(false); if (root.__jw && root.__jw.syncBtn) root.__jw.syncBtn(S); msg(v ? '✓ 🗒 기록창은 따로 작은 창으로' : '✓ 🗒 기록창은 이 옆 창 안으로', $('setm')); }; $('lpop1').onchange = lp(true); $('lpop0').onchange = lp(false);
      $('gprof').onchange = () => { const v = $('gprof').value.trim(); if (!/^[\w .-]{0,40}$/.test(v)) { msg('✗ 프로필 이름엔 영문·숫자·빈칸·점·줄표만', $('setm')); return; } UI.goProf = v; save(); drawGo(); };
      drawToggles(); }
    $('setCards').addEventListener('click', (ev) => { const b = ev.target.closest('button,input'); const row = ev.target.closest('[data-cid]'); if (!b || !row) return; const id = row.dataset.cid, c = b.dataset.c;
      if (c === 'show') UI.cards[id].hide = !b.checked; else if (c === 'open') UI.cards[id].open = b.checked;
      else if (c === 'up' || c === 'down') { const vis = UI.order.filter((x) => !absent(x) && cardOf(x)); const i = vis.indexOf(id), j = c === 'up' ? i - 1 : i + 1; if (j < 0 || j >= vis.length) return; const a = UI.order.indexOf(vis[i]), bb = UI.order.indexOf(vis[j]); [UI.order[a], UI.order[bb]] = [UI.order[bb], UI.order[a]]; } else return;
      apply(); save(); drawSet(); load(); });
    $('setAll').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; for (const id of Object.keys(UI.cards)) UI.cards[id].open = b.dataset.all === 'open'; apply(); save(); drawSet(); };
    $('setKeys').addEventListener('click', (ev) => { const b = ev.target.closest('button'); const row = ev.target.closest('[data-kid]'); if (!b || !row) return; const a = row.dataset.kid;
      if (b.dataset.k === 'cap') cap = cap === a ? null : a; else if (b.dataset.k === 'off') { UI.keys[a] = ''; cap = null; } else if (b.dataset.k === 'def') { UI.keys[a] = ACTIONS.find((x) => x.id === a).def; cap = null; }
      if (b.dataset.k !== 'cap') { const ck = check(UI.keys); if (ck.ok) save(); msg(ck.ok ? '✓ 단축키 저장' : '✗ 겹치거나 못 쓰는 키 — 고칠 때까지 저장하지 않음', $('setm')); apply(); } drawSet(); });
    /* 기본값 되돌리기 · 내보내기 · 가져오기 — 팝업 대신 두 번 누르기 */
    $('setReset').onclick = async () => { const b = $('setReset'); if (!armReset || Date.now() - armReset > 4000) { armReset = Date.now(); b.textContent = '한 번 더 누르면 기본값으로'; setTimeout(() => { if (Date.now() - armReset >= 4000) { armReset = 0; b.textContent = '↺ 기본값 되돌리기'; } }, 4100); return; }
      armReset = 0; b.textContent = '↺ 기본값 되돌리기'; const mini = UI.mini; UI = normalize({}); UI.mini = mini; apply(); await save(true); try { await post('/ui', { reset: true }); } catch (e) {} drawSet(); drawGo(); msg('✓ 칸·단축키·창 설정을 기본값으로(일 켜기·이 PC 이름은 그대로)', $('setm')); load(); };
    $('setExp').onclick = () => { const d = exportDoc(UI, S ? { side: S.side, y24: S.y24Want, y24Jobs: S.y24Jobs } : {}, { ver: o.ver, pc: S && S.pc }); const a = doc.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 1)], { type: 'application/json' }));
      a.download = `readnow-col2-settings-${String((S && S.pc) || 'pc').replace(/[^\w.-]+/g, '_')}-${new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)}.json`; doc.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); msg('✓ 설정 파일을 내려받음(비밀값·계정 없음)', $('setm')); };
    $('setImpF').onchange = async () => { const f = $('setImpF').files[0]; if (!f) return; const r = importDoc(await f.text()); $('setImpF').value = ''; if (!r.ok) { imp = null; $('setImp').style.display = 'none'; msg('✗ ' + r.err, $('setm')); return; }
      imp = r; armImp = 0; $('setImp').style.display = ''; $('setImp').textContent = '가져오기 — ' + (r.from.pc || '?') + ' ' + String(r.from.at).slice(0, 10); msg(`읽음: ${r.from.pc || '어느 PC'}의 설정(${r.from.ver || '?'}) · 칸 ${r.ui.order.length} · 단축키 ${Object.values(r.ui.keys).filter(Boolean).length}${r.keyErrs.length ? ' · ✗ 겹치는 단축키 ' + r.keyErrs.length + '개는 기본값으로' : ''} — [가져오기]를 두 번 누르면 바꿈`, $('setm')); };
    $('setImp').onclick = async () => { if (!imp) return; const b = $('setImp'); if (!armImp || Date.now() - armImp > 4000) { armImp = Date.now(); b.textContent = '한 번 더 누르면 바꿈'; return; } armImp = 0;
      const n = imp.ui; for (const x of imp.keyErrs) n.keys[x.a] = ACTIONS.find((a) => a.id === x.a).def; if (!check(n.keys).ok) n.keys = defKeys(); n.mini = false; UI = n; apply(); await save(true);
      const op = {}; for (const k of ['side', 'y24', 'y24Jobs']) if (imp.opts[k] != null) op[k] = imp.opts[k]; if (Object.keys(op).length) await post('/cfg', { ...op, src: 'pc' }); imp = null; b.style.display = 'none'; drawSet(); drawGo(); msg('✓ 가져온 설정으로 바꿈(이 PC 이름은 그대로)', $('setm')); load(); };
    /* ── 단축키 — 먼저 받음(겹창 닫기 · 키 고르기) · 기록창 열기·찾기는 기록창이 같은 표로 ── */
    root.addEventListener('keydown', (e) => {
      if (cap) { if (MODS.concat(['Control', 'AltGraph']).includes(e.key)) return; e.preventDefault(); e.stopImmediatePropagation(); const c = comboOf(e); if (c) { UI.keys[cap] = c; cap = null; const ck = check(UI.keys); if (ck.ok) save(); msg(ck.ok ? '✓ ' + c + ' 저장' : '✗ ' + ck.errs.map((x) => x.why).join(' · '), $('setm')); apply(); drawSet(); } return; }
      const inField = /^(INPUT|SELECT|TEXTAREA)$/.test((e.target && e.target.tagName) || ''); const c = comboOf(e); if (!c) return; const K = UI.keys; const plain = !/(Ctrl|Alt|Meta)\+/.test(c);
      if (c === K.close && (isOpen('set') || isOpen('help'))) { e.preventDefault(); e.stopImmediatePropagation(); openOv(isOpen('set') ? 'set' : 'help', false); return; }
      if (inField && plain) return;
      const act = ['help', 'set', 'mini', 'go', 'reload'].find((a) => K[a] === c); if (!act) return; e.preventDefault(); e.stopImmediatePropagation();
      if (act === 'help' || act === 'set') openOv(act); else if (act === 'mini') setMini(!UI.mini, '단축키'); else if (act === 'reload') { load(); msg('↻ 새로 봄'); }
      else if (act === 'go') { if (UI.mini) setMini(false, '바로 가기 단축키'); const el = cardOf('go'); if (el) { if (UI.cards.go.hide) { UI.cards.go.hide = false; apply(); save(); } el.open = true; el.scrollIntoView({ block: 'nearest' }); const q = $('goq'); if (q) q.focus(); } } }, true);
    /* 자리·크기 알림(작은 단추일 때는 안 함 — 원래 크기를 덮지 않게) */
    let lastR = ''; setInterval(() => { if (UI.mini) return; const v = { x: screenX, y: screenY, w: outerWidth, h: outerHeight }; const k = JSON.stringify(v); if (k !== lastR && v.w > 200 && v.h > 150) { lastR = k; post('/win/hrect', v).catch(() => {}); } }, 15000);
    /* 고침 — 보일 때 4초 · 작은 단추이거나 창이 가려졌을 때 30초(메모리·CPU 아낌) */
    setInterval(() => { const slow = UI.mini || doc.hidden; if (edit && Date.now() - edit < 60000) return; edit = 0; if (Date.now() - lastLoad >= (slow ? 30000 : 4000) - 50) load(); }, 1000);
    apply(); drawGo(); doc.body.classList.toggle('mini', UI.mini); drawMini();
    /* 도우미에 저장된 이 PC 설정이 더 새것이면 그것으로 */
    api('GET', '/ui').then((j) => { if (j && j.ok) { const n = normalize(j.ui); if (n.at >= UI.at) { const was = UI.mini; UI = n; ls.set('ui', UI); apply(); drawGo(); doc.body.classList.toggle('mini', UI.mini); if (was !== UI.mini || UI.mini) setMini(UI.mini, '처음'); } else save(); } }).catch(() => {});
    load();
    return { get ui() { return UI; }, setMini, openOv, load, apply }; }

  const api = { CARDS, ACTIONS, RESERVED, WEBAPP, OLD_DEF, MINI, keyName, comboOf, normCombo, match, check, defKeys, normalize, exportDoc, importDoc, EXPORT_KIND, keysNow, loadKeys, logMatch, keyLabel, logMode, CSS, side };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2UI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

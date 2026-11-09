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
    { id: 'now', icon: '▶', t: '지금', open: true },
    { id: 'y24', icon: '🟦', t: '예스24 판매관리 읽기', open: true, office: true },
    { id: 'go', icon: '🔗', t: '바로 가기', open: true },
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
    { id: 'set', t: '⚙ 설정 열기·닫기', def: 'Alt+S' },
    { id: 'mini', t: '▁ 작은 단추로 줄이기·펼치기', def: 'Alt+M' },
    { id: 'go', t: '🔗 바로 가기 칸으로(찾기 칸에 커서)', def: 'Alt+G' },
    { id: 'reload', t: '↻ 상태 지금 새로 보기', def: 'Alt+R' },
  ];
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
    return { ok: !errs.length, errs }; }
  const defKeys = () => Object.fromEntries(ACTIONS.map((a) => [a.id, a.def]));
  const num = (v, lo, hi, d) => { const n = Math.round(+v); return Number.isFinite(n) && n >= lo && n <= hi ? n : d; };
  /* 설정 한 꼴로 — 모르는 칸·이상한 값은 버리고 기본값 · keys 는 겹치면 그대로 두고 check 가 알림 */
  function normalize(u) { u = u && typeof u === 'object' ? u : {}; const ids = CARDS.map((c) => c.id);
    const order = (Array.isArray(u.order) ? u.order.map(String).filter((x, i, a) => ids.includes(x) && a.indexOf(x) === i) : []).concat(ids.filter((x) => !(Array.isArray(u.order) && u.order.includes(x))));
    const cards = {}; for (const c of CARDS) { const v = (u.cards && typeof u.cards === 'object' && u.cards[c.id]) || {}; cards[c.id] = { open: v.open == null ? !!c.open : !!v.open, hide: v.hide == null ? !!c.hide : !!v.hide }; }
    const keys = defKeys(); if (u.keys && typeof u.keys === 'object') for (const A of ACTIONS) if (u.keys[A.id] != null) { const n = normCombo(u.keys[A.id]); if (n != null) keys[A.id] = n; }
    const prof = String(u.goProf == null ? '' : u.goProf); return { v: 1, order, cards, keys, mini: !!u.mini, miniW: num(u.miniW, 60, 400, MINI.w), miniH: num(u.miniH, 40, 400, MINI.h), miniTop: u.miniTop == null ? MINI.top : !!u.miniTop, goProf: /^[\w .-]{0,40}$/.test(prof) ? prof.trim() : '', logPop: u.logPop == null ? true : !!u.logPop, at: num(u.at, 0, 9e15, 0) }; } /* (0.1.8) logPop = 🗒 기록창을 따로 작은 창으로(기본 · 정범님 11/10 새벽) · false면 예전처럼 옆 창 안 */
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
.gob{display:flex;flex-wrap:wrap;gap:2px}.gob button{margin:0}.gog{font-size:11px;color:var(--sub);margin:3px 0 1px}#gom{min-height:1.3em}`;

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
      if (isOpen(k)) { if (k === 'set') drawSet(); else drawHelp(); } }
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
    function drawNow(s) { const rl = s.relay || {}; const { W } = lvl(); $('stop').innerHTML = W.length ? W.map((x) => `<div class="${x.l === 'err' ? 'no' : 'wa'}">⛔ ${E(x.t)}</div>`).join('') : '<div class="ok">✓ 멈춘 데 없음 — 잘 돌고 있음</div>';
      const p = s.pace || {}; $('st').innerHTML = '번외 수집 ' + (s.on ? '<span class="ok">켜짐</span>' : '<span class="no">꺼짐</span>') + ' · 숨은 크롬 ' + (s.alive ? '<span class="ok">떠 있음</span>' : '<span class="no">없음</span>') + '<br>' + (root.autoLine ? root.autoLine(s) : '')
        + '<br><span class="k">한 장 뒤 ' + Math.round((p.minGapMs || 0) / 100) / 10 + '초 안팎 · 이번 시간 ' + (p.hourN || 0) + '/' + (p.hourCap || 0) + '장' + (p.coolMs ? ' · 쉬는 중 ' + Math.ceil(p.coolMs / 60000) + '분' : '') + (rl.outN ? ' · 웹앱이 아직 안 올린 결과 ' + rl.outN + '건' : '') + '</span>';
      $('onb').textContent = arm ? (s.on ? '한 번 더 누르면 끔' : '한 번 더 누르면 켬') : (s.on ? '⏹ 끄기' : '▶ 켜기'); $('onb').className = s.on ? 'warn' : 'p';
      const cs = cardOf('now') && cardOf('now').querySelector('.cs'); if (cs) cs.textContent = W.length ? '⛔ ' + W[0].t : s.on ? '잘 돎' : '꺼짐'; }
    function drawY24(s) { const y = s.y24 || {}; let h; if (y.logger) h = '<span class="k">로거 PC — 예스24 판매관리 읽기 안 함(약속 0)</span>'; else if (!y.on) h = '<span class="wa">꺼 둠</span> <span class="k">' + E(s.on ? '(⚙ 설정 › 일 켜기·끄기에서 켬)' : '(번외 수집이 꺼져 있음)') + '</span>';
      else if (y.login === 'need') h = '<span class="no">🔐 예스24 로그인 필요</span><br><span class="k">아래 단추를 한 번 누르면 예스24 창이 앞으로 나옵니다 — 그 창에서 로그인하면 저절로 숨고 읽기를 이어 갑니다(아이디·비밀번호는 저장하지 않음)' + (y.loginMsg ? ' · 까닭: ' + E(y.loginMsg) : '') + '</span>';
      else if (y.login === 'wait') h = '<span class="wa">🔐 예스24 로그인 창이 열려 있음</span> <span class="k">— 그 창에서 로그인하면 저절로 숨김</span>';
      else h = (y.active ? '<span class="ok">읽는 중</span>' : '<span class="wa">쉬는 중</span>') + ' · 로그인 ' + (y.login === 'ok' ? '<span class="ok">살아 있음</span>' : '확인 중') + '<br><span class="k">주문 두 목록 마지막 ' + hm(y.ord && y.ord.at) + (y.ord && y.ord.nextMs != null ? ' · 다음 ' + Math.ceil(y.ord.nextMs / 60000) + '분 뒤' : '') + ' · 등록상품 ' + (y.prd && y.prd.at ? hm(y.prd.at) + ' 매물 ' + (y.prd.n || 0) : '아직') + '</span>';
      if (y.on && y.msg && y.login !== 'need') h += '<br><span class="k">' + E(y.msg) + '</span>'; $('y24').innerHTML = h;
      const want = y.logger || !y.on ? '' : y.login !== 'ok' ? 'lg' : 'run'; if ($('y24b').dataset.w !== want) { $('y24b').dataset.w = want;
        $('y24b').innerHTML = want === 'lg' ? '<button class="p" id="y24lg">🔐 예스24 로그인 (처음 한 번)</button>' : want === 'run' ? '<button data-y="ord">🔁 주문 지금</button><button data-y="prd">📋 등록상품 전부</button><button data-y="tour">🛰 둘러보기</button>' : '';
        const lg = $('y24lg'); if (lg) lg.onclick = async () => { msg('…'); const j = await post('/y24/login', { why: '옆 창 단추' }); msg((j.ok ? '✓ ' : '✗ ') + (j.msg || j.err || '')); load(); };
        $('y24b').querySelectorAll('[data-y]').forEach((b) => (b.onclick = async () => { const j = await post('/y24/run', { what: b.dataset.y }); msg((j.ok ? '✓ ' : '✗ ') + (j.msg || j.err || '')); load(); })); }
      const cs = cardOf('y24') && cardOf('y24').querySelector('.cs'); if (cs) cs.textContent = y.logger ? '' : !y.on ? '꺼 둠' : y.login === 'need' ? '🔐 로그인 필요' : y.active ? '읽는 중' : '쉼'; }
    function drawWork(s) { $('wk').innerHTML = '숨은 크롬 ' + (s.alive ? '떠 있음' : '없음') + (s.alive && !s.headless ? (s.shown ? ' · <b>보이는 중</b>' : ' · 숨김') : '') + (s.headless ? ' · 화면 없음' : '') + '<br><span class="k">' + E(s.msg || '') + ' · 최근 한 시간 다시 띄움 ' + s.opens + '번 · 운영 공용 파일 ' + E(Object.entries((s.core && s.core.ver) || {}).map(([k, v]) => k.replace(/^readnow-|-core\.js$/g, '') + ' ' + v).join(' · ') || '아직 안 받음') + (s.upd && s.upd.msg ? ' · 새 판: ' + E(s.upd.msg) : '') + '</span>'; }
    function drawLists(s) { if ($('rd') && UI.cards.reads.open) $('rd').innerHTML = s.reads && s.reads.length ? s.reads.slice().reverse().map((x) => E(String(x.at).slice(11)) + ' ' + E(x.itemId) + ' ' + (x.ok ? '✓ ' + E(x.title || '') : '✗ ' + E(x.why || ''))).join('\n') : '—';
      if ($('ln') && !UI.cards.tail.hide && UI.cards.tail.open) $('ln').innerHTML = s.logs && s.logs.length ? s.logs.map((e) => T(e.t) + ' ' + E(e.m)).join('\n') : '—';
      if (!edit && !UI.cards.rect.hide) { const f = (q, v) => ['x', 'y', 'w', 'h'].forEach((k) => { const i = $(q + k); if (i) i.value = v && v[k] != null ? v[k] : ''; }); f('w', s.win); f('h', s.hwin); } }
    function drawHead(s) { const k = s.kind === 'logger' ? 'logger' : 'office'; if (k !== kind) { kind = k; ls.set('kind', k); apply(); drawGo(); } $('hdP').textContent = '🖥 이 PC: ' + (s.pc || '—') + (kind === 'logger' ? ' · 🛰 로거' : ' · 🏢 사무실'); doc.title = '📊 번외 수집기 — ' + (s.pc || ''); }
    async function load() { lastLoad = Date.now(); try { const s = await api('GET', '/status'); if (s.ver && s.ver !== o.ver && new URLSearchParams(location.search).get('v') !== s.ver) { location.replace(location.pathname + '?v=' + encodeURIComponent(s.ver)); return; }
        S = s; if (root.pcShow) root.pcShow(s); if (root.__jw && root.__jw.setState) root.__jw.setState(s); drawHead(s); drawMini(); if (UI.mini) return; drawNow(s); if (kind !== 'logger') drawY24(s); drawWork(s); drawLists(s); if (isOpen('set')) drawToggles(); }
      catch (e) { S = null; drawMini(); if ($('stop')) $('stop').innerHTML = '<div class="no">⛔ 도우미에 닿지 못함: ' + E(e.message) + '</div>'; } }
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
      $('tgy').style.display = kind === 'logger' ? 'none' : ''; cb('tg_y24', S.y24Want, 'y24'); cb('tg_y24j', S.y24Jobs, 'y24Jobs'); cb('tg_side', S.side, 'side'); }
    function drawKeysHint() { const b = (id, a, base) => { const e = $(id); if (e) e.title = base + ' (' + keyLabel(a) + ')'; }; b('helpBtn', 'help', '❓ 이 수집기 설명서'); b('setBtn', 'set', '⚙ 설정 — 칸·단축키·창·바로 가기·내보내기'); b('miniBtn', 'mini', '▁ 작은 단추로 줄이기'); }
    function drawSet() { const ids = UI.order.filter((id) => !absent(id) && cardOf(id));
      $('setCards').innerHTML = ids.map((id, i) => { const c = cardDef(id), v = UI.cards[id]; return `<div class="row" data-cid="${id}"><label class="rt"><input type="checkbox" data-c="show" ${v.hide ? '' : 'checked'}> ${c.icon} ${E(c.t)}</label><label class="k"><input type="checkbox" data-c="open" ${v.open ? 'checked' : ''}> 펼침</label><button data-c="up" ${i ? '' : 'disabled'} title="위로">▲</button><button data-c="down" ${i < ids.length - 1 ? '' : 'disabled'} title="아래로">▼</button></div>`; }).join('');
      const ck = check(UI.keys);
      $('setKeys').innerHTML = ACTIONS.map((A) => { const bad = ck.errs.filter((x) => x.a === A.id); return `<div class="row" data-kid="${A.id}"><span class="rt">${E(A.t)}</span><button class="kb${cap === A.id ? ' cap' : ''}" data-k="cap">${cap === A.id ? '키를 누르세요…' : E(UI.keys[A.id] || '끔')}</button><button data-k="off" title="이 단축키 끄기">끔</button><button data-k="def" title="기본값 ${E(A.def)}">기본</button>${bad.length ? `<div class="bad" style="flex-basis:100%">✗ ${E(bad.map((x) => x.why).join(' · '))}</div>` : ''}</div>`; }).join('');
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

  const api = { CARDS, ACTIONS, RESERVED, MINI, keyName, comboOf, normCombo, match, check, defKeys, normalize, exportDoc, importDoc, EXPORT_KIND, keysNow, loadKeys, logMatch, keyLabel, logMode, CSS, side };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2UI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

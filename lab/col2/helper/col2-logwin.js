/* col2-logwin.js — 📜 번외 수집기 기록창 (정범님 11/09 밤 '번외 수집기도 기록창을 쉽게 열고 닫게 · 기존 기록창을 똑같이 → 훨씬 편하고 쓸모 있게')
 * 1단계 = 운영 수집기 기록창(src/readnow-collector.src.js #rn-jw)과 같은 모양·같은 동작:
 *   초록 띠(잡고 끌어 옮김 · 두 번 누르면 처음 자리 · 오른쪽 아래 모서리로 크기) · [오늘 기록][전체 기록] · 중요만/전체/오류·경고만 · 검색 · 자동 스크롤(기억)
 *   · [내려받기·비우기](팝업 대신 두 번 누르기 · 지우지 않고 old/로 옮김) · [닫기] · 위쪽 '지금 무엇을' 칸 · 줄 = 시각 일 이름 글 · 색(오류 빨강·경고 주황·됨 초록·자세히 옅게) · 3,000줄까지
 *   (운영의 🛰 감시·🖥 다른 PC 탭은 넣지 않음 — 감시기가 없고, 다른 PC 기록을 끌어오는 것은 로거와 사무실을 엮는 일이라 약속 0)
 * 2단계 = 더 편하고 쓸모 있게(무엇을·왜는 README '기록창'):
 *   종류 단추(⚠오류·!경고·📥받음·⏸쉼·🪟창·🟦예스24·🔄새 판·그 밖 — 수 보임 · 여러 개 함께) · ⚠ 오류만 한 번에 · 찾기(맞은 곳 칠함 · 수 · Enter로 다음)
 *   · 같은 줄 접기(숫자만 다른 같은 줄이 이어지면 한 줄 ×N · 처음~끝 시각) · 시간 묶음(10분마다 머리줄 · 줄 수·오류 수) · 복사 · 보이는 줄만 내려받기
 *   · ⛔ 멈춘 까닭 띠(꺼짐·자동 읽기 쉼·크롬 쉼·429 쉼·예스24 로그인 필요·기록 못 올림·공용 파일 실패 — 맨 위에 바로)
 *   · 회차 요약(한 시간 = 한 회차: 읽은 화면·같음/다름/운영 칸 없음·실패·평균 걸린 시간·쉼 까닭) · ↗ 따로 창(작은 앱 창 380×560 · 자리·크기 기억 · 약속 15)
 *   · PC 종류(🛰 로거 / 🏢 사무실)에 맞는 일 이름·회차 요약 — 로거는 예스24 칸·단추가 아예 없음(약속 0)
 *   · 단축키: Alt+L 열기·닫기 · Esc 닫기 · / 찾기 칸으로 (운영 기록창엔 단축키가 없었음 — 새로 더함)
 * 기기 저장은 Col2Store.ls(rn3-)로만 · 브라우저 팝업 없음 · 열려 있을 때만 2초마다 새 줄을 받음(닫혀 있으면 받지 않음 — 메모리·CPU 아낌) */
(function (root) {
  'use strict';
  /* ── 순수 함수(시험이 node에서 바로 부름) ── */
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const KIND = { err: '⚠ 오류', warn: '! 경고', read: '📥 받음', rest: '⏸ 쉼', win: '🪟 창', y24: '🟦 예스24', upd: '🔄 새 판', sys: '· 그 밖' };
  const kindsFor = (pc) => Object.keys(KIND).filter((k) => !(pc === 'logger' && k === 'y24'));
  /* 일 이름 — PC 종류에 맞게(로거는 알라딘 비로그인 일만) */
  const JOBS = { office: { read: '알라딘 그림자 읽기(로그인 없음)', y24: '예스24 판매관리 읽기', win: '숨은 작업 창 지킴이' }, logger: { read: '알라딘 공개 화면 읽기(로거 · 로그인 없음)', win: '숨은 작업 창 지킴이' } };
  const tagOf = (e) => (e.l === 'err' ? 'err' : e.l === 'warn' ? 'warn' : e.k || 'sys');
  /* 거르기 — f: imp(중요만)·all(전체)·err(오류·경고만)·errOnly(⚠ 오류만) · kinds: 고른 종류(비면 모두) · q: 찾기 */
  function pass(e, f, kinds, q) {
    if (f === 'imp' && e.l === 'detail') return false;
    if (f === 'err' && e.l !== 'err' && e.l !== 'warn') return false;
    if (f === 'errOnly' && e.l !== 'err') return false;
    if (kinds && kinds.length) { const ok = kinds.some((k) => (k === 'err' ? e.l === 'err' : k === 'warn' ? e.l === 'warn' : (e.k || 'sys') === k)); if (!ok) return false; }
    if (q && !String(e.x).toLowerCase().includes(String(q).toLowerCase()) && !String(e.m).toLowerCase().includes(String(q).toLowerCase())) return false;
    return true; }
  const counts = (L) => { const c = {}; for (const e of L) { const t = tagOf(e); c[t] = (c[t] || 0) + 1; if (t === 'err' || t === 'warn') c[e.k || 'sys'] = (c[e.k || 'sys'] || 0) + 1; } return c; };
  /* 같은 줄 접기 — 숫자만 다른 같은 일·같은 수준 줄이 이어지면 하나로(n · 처음 시각 t0 · 끝 시각 t) */
  const shape = (e) => e.l + '|' + e.m + '|' + String(e.x).replace(/\d[\d,.:]*/g, '#');
  function fold(L) { const out = []; for (const e of L) { const p = out[out.length - 1]; if (p && shape(p) === shape(e)) { p.n++; p.t = e.t; p.x = e.x; p.s = e.s; } else out.push({ ...e, n: 1, t0: e.t }); } return out; }
  /* 시간 묶음 — min분마다 머리줄 { g:1, t, n, err, warn } 를 끼움 */
  function group(L, min) { const W = (min || 10) * 60e3; const out = []; let cur = null; for (const e of L) { const b = Math.floor((e.t0 || e.t) / W) * W; if (!cur || cur.t !== b) { cur = { g: 1, t: b, n: 0, err: 0, warn: 0 }; out.push(cur); } cur.n += e.n || 1; if (e.l === 'err') cur.err++; if (e.l === 'warn') cur.warn++; out.push(e); } return out; }
  const kst = (t) => new Date(+t + 9 * 3600e3);
  const tm = (t) => { const d = kst(t); return `${d.getUTCMonth() + 1}. ${d.getUTCDate()}. ${d.toISOString().slice(11, 19)}`; };
  const hm = (t) => kst(t).toISOString().slice(11, 16);
  const hl = (s, q) => { const h = esc(s); if (!q) return h; const qq = esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); return h.replace(new RegExp(qq, 'gi'), (m) => `<mark>${m}</mark>`); };
  function rowHtml(e, q) {
    if (e.g) return `<div class="gh">🕘 ${hm(e.t)}~${hm(e.t + 600e3)} · ${e.n.toLocaleString()}줄${e.err ? ` · <span class="err">오류 ${e.err}</span>` : ''}${e.warn ? ` · <span class="warn">경고 ${e.warn}</span>` : ''}</div>`;
    return `<div class="${esc(e.l)}" data-s="${+e.s || 0}"><span class="tm">${tm(e.t)}</span> <span class="md">${esc(e.m)}</span> ${hl(e.x, q)}${e.n > 1 ? ` <b class="xn" title="${tm(e.t0)} ~ ${tm(e.t)} 같은 줄 ${e.n}번(숫자만 다름)">×${e.n}</b>` : ''}</div>`; }
  const textOf = (L) => L.filter((e) => !e.g).map((e) => `${kst(e.t).toISOString().slice(0, 19).replace('T', ' ')} [${e.m}] [${e.l}] ${e.x}${e.n > 1 ? ` ×${e.n}` : ''}`).join('\n');
  /* ⛔ 멈춘 까닭 — 상태(/status)에서 바로(없으면 빈 목록 = 잘 돎) · 로거는 예스24 줄을 보지 않음 */
  function stopWhy(s, pc) { const W = []; if (!s) return [{ l: 'err', t: '도우미에 닿지 못함 — 번외 도우미가 꺼졌거나 다시 켜지는 중' }]; const a = s.auto || {}, p = s.pace || {}, ch = s.chrome || {}, rl = s.relay || {}, y = s.y24 || {};
    if (!s.on) W.push({ l: 'err', t: '번외 수집이 꺼져 있음 — 옆 창 [▶ 켜기]를 두 번 누르면 켬' });
    else { if (a.on === false || (a.msg && !/도는 중/.test(a.msg))) W.push({ l: 'warn', t: '자동 읽기 쉼: ' + (a.msg || '까닭 모름') });
      if (ch.coolUntil) W.push({ l: 'err', t: `숨은 크롬이 자꾸 꺼져 ${ch.coolUntil.slice(11, 16)}까지 쉼 — 까닭: ${(ch.last && ch.last.why) || '모름'}` });
      if (p.coolMs) W.push({ l: 'warn', t: `알라딘이 '요청이 너무 많다'(429)고 해 ${Math.ceil(p.coolMs / 60000)}분 쉼(저절로 다시)` });
      if (s.core && s.core.err) W.push({ l: 'warn', t: '운영 공용 파일: ' + s.core.err });
      if (rl.err) W.push({ l: 'warn', t: '웹앱이 대신 기록하지 못함: ' + rl.err });
      if (pc !== 'logger' && y.on && y.login === 'need') W.push({ l: 'err', t: '🔐 예스24 로그인 필요 — 옆 창 [🔐 예스24 로그인] 한 번' }); }
    return W; }
  function roundsHtml(R, pc, open) { if (!R || !R.length) return ''; const one = (r) => `<div class="rd"><b>${esc(r.h)}</b> 읽은 화면 <b>${r.reads}</b>${r.reads ? ` · 같음 ${r.same} · <span class="${r.diff ? 'warn' : ''}">다름 ${r.diff}</span> · 운영 칸 없음 ${r.no} · <span class="${r.fail ? 'err' : ''}">실패 ${r.fail}</span>` : ''}${r.avgMs ? ` · 한 장 ${(r.avgMs / 1000).toFixed(1)}초` : ''}${r.err ? ` · <span class="err">오류 줄 ${r.err}</span>` : ''}${pc !== 'logger' && r.y24 ? ` · 예스24 ${r.y24}줄` : ''}${r.rest.length ? `<br><span class="sub">쉼 까닭: ${r.rest.map((x) => esc(x.w) + ' ×' + x.c).join(' · ')}</span>` : ''}</div>`;
    return `<details class="rds"${open ? ' open' : ''}><summary>🧾 회차 요약 <span class="sub">(한 시간 = 한 회차 · ${esc(JOBS[pc === 'logger' ? 'logger' : 'office'].read)})</span></summary>${R.map(one).join('')}</details>`; }
  /* 화면 단위로 쓸 줄 만들기 — 거르기 → 접기 → 묶음 → 끝 3,000줄 */
  function view(L, o) { o = o || {}; let v = L.filter((e) => pass(e, o.f || 'all', o.kinds, o.q)); if (o.fold) v = fold(v); if (v.length > (o.max || 3000)) v = v.slice(-(o.max || 3000)); if (o.group) v = group(v, o.groupMin); return v; }

  const CORE = { esc, KIND, JOBS, kindsFor, pass, counts, fold, group, view, rowHtml, textOf, stopWhy, roundsHtml, tm, shape };

  /* ── 화면(브라우저) ── */
  const CSS = `#rn-jw{position:fixed;left:6px;right:6px;top:36px;bottom:6px;z-index:50;background:var(--card,#fff);color:var(--ink,#1E2B27);border:1px solid #2F5D50;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.18);display:none;flex-direction:column;font:12px/1.5 Consolas,'Malgun Gothic',monospace;resize:both;overflow:hidden;min-width:260px;min-height:180px}
#rn-jw.on{display:flex}#rn-jw.full{left:0;right:0;top:0;bottom:0;border-radius:0;resize:none}
#rn-jw .h{display:flex;flex-wrap:wrap;gap:4px;align-items:center;padding:5px 7px;background:#2F5D50;color:#fff;font:600 12px system-ui,'Malgun Gothic';cursor:move;user-select:none}#rn-jw .h b{flex:1 1 100%;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#rn-jw .h button,#rn-jw .h select,#rn-jw .h input{font:11.5px system-ui,'Malgun Gothic';border:0;border-radius:5px;padding:2px 6px;margin:0;color:#1E2B27;background:#fff;max-width:100%}#rn-jw .h input[type=search]{width:96px;flex:1 1 80px}#rn-jw .h label{font-weight:400;white-space:nowrap}
#rn-jw .jt button{background:#24493F;color:#cfe3da;margin-right:2px}#rn-jw .jt button.on{background:#fff;color:#2F5D50;font-weight:700}
#rn-jw .t2{display:flex;flex-wrap:wrap;gap:3px;align-items:center;padding:4px 7px;background:#F2F6F4;border-bottom:1px solid #D7E2DD;font:11.5px system-ui,'Malgun Gothic';color:#1E2B27}
#rn-jw .t2 button{font:11px system-ui,'Malgun Gothic';border:1px solid #D7E2DD;background:#fff;color:#5B6B66;border-radius:9px;padding:0 6px;margin:0;cursor:pointer}#rn-jw .t2 button.on{background:#2F5D50;border-color:#2F5D50;color:#fff;font-weight:700}#rn-jw .t2 .sp{flex:1}
#rn-jw .ov{padding:5px 9px;background:#F2F6F4;border-bottom:1px solid #D7E2DD;font:12px/1.45 system-ui,'Malgun Gothic';color:#1E2B27;max-height:38%;overflow:auto}#rn-jw .ov .sub,#rn-jw .sub{color:#5B6B66;font-size:11px}
#rn-jw .stop{border-radius:6px;padding:3px 6px;margin:2px 0;font-weight:700}#rn-jw .stop.err{background:#FDE8E6;color:#B0322A}#rn-jw .stop.warn{background:#FFF4E0;color:#A8661B}#rn-jw .stop.ok{background:#E3F1E8;color:#2F7D4F}
#rn-jw details.rds>summary{cursor:pointer;font-weight:700;color:#2F5D50}#rn-jw .rd{margin:2px 0 2px 8px}
#rn-jw .b{flex:1;overflow:auto;padding:5px 7px;white-space:pre-wrap;word-break:break-all;background:var(--card,#fff)}#rn-jw .b>div{border-bottom:1px solid #F1F3F2}
#rn-jw .detail{color:#5B6B66}#rn-jw .info{color:#1E2B27;font-weight:600}#rn-jw .warn{color:#A8661B;font-weight:600}#rn-jw .err{color:#B0322A;font-weight:700}#rn-jw .ok{color:#2F7D4F;font-weight:600}
#rn-jw .tm{color:#9AA5A1}#rn-jw .md{display:inline-block;min-width:34px;color:#2F5D50}#rn-jw .xn{color:#fff;background:#8A9692;border-radius:8px;padding:0 5px;font-size:10.5px}#rn-jw mark{background:#FFE58A;color:inherit}#rn-jw mark.cur{background:#F5A623}
#rn-jw .gh{position:sticky;top:-5px;background:#E4ECE8;color:#2F5D50;font:600 11.5px system-ui,'Malgun Gothic';padding:1px 4px;border-radius:4px;margin-top:3px}
#rn-jw details.jd{border-bottom:1px solid #E4ECE8}#rn-jw details.jd>summary{cursor:pointer;padding:3px 2px;font:600 12px system-ui,'Malgun Gothic';color:#2F5D50}#rn-jw details.jd>summary small{color:#8A9692;font-weight:400}
@media (prefers-color-scheme: dark){#rn-jw .t2,#rn-jw .ov{background:#23302C;color:#E4ECE8;border-color:#3A4B45}#rn-jw .info{color:#E4ECE8}#rn-jw .b>div{border-color:#2B3632}#rn-jw .gh{background:#2B3A35;color:#BFE0D2}#rn-jw .t2 button{background:#1B2421;color:#BFD0CA;border-color:#3A4B45}}`;

  /* mount({ el(붙일 곳), full(따로 창), api(path,o) → JSON, ls(Col2Store.ls), status() → 마지막 상태(없으면 /status를 직접) , btn(여닫는 단추 · 상태 따라 색) }) */
  function mount(o) {
    const doc = o.doc || document; const ls = o.ls || { get: (k, d) => d, set() {} }; const api = o.api; const full = !!o.full;
    if (!doc.getElementById('rn-jw-css')) { const st = doc.createElement('style'); st.id = 'rn-jw-css'; st.textContent = CSS; doc.head.appendChild(st); }
    const w = doc.createElement('div'); w.id = 'rn-jw'; if (full) w.classList.add('full');
    w.innerHTML = `<div class="h"><b id="rnjT" title="이 띠를 잡고 끌어서 옮김 · 두 번 누르면 처음 자리로 · 오른쪽 아래 모서리로 크기 조절 · Alt+L 열기·닫기">⠿ 작업 기록</b><span class="jt"><button data-jt="today" class="on" title="오늘(0시부터) 기록 — 도우미를 다시 켜도 이어서 보임">오늘 기록</button><button data-jt="hist" title="날짜별로 쌓인 모든 기록(오늘 포함)">전체 기록</button></span><select id="rnjF" title="보일 줄"><option value="imp">중요만</option><option value="all" selected>전체 (항목마다)</option><option value="err">오류·경고만</option><option value="errOnly">⚠ 오류만</option></select><input id="rnjQ" type="search" placeholder="검색 (/)" title="글·일 이름에서 찾기 — 맞은 곳을 칠함 · Enter = 다음 맞은 곳"><label title="새 줄이 생기면 맨 아래로 저절로 내려감 — 켜고 끈 것은 이 PC에 저장"><input type="checkbox" id="rnjA"> 자동 스크롤</label><button id="rnjD" title="모든 기록(오늘+지난)을 파일로 받고, 화면의 기록을 비움 — 두 번 누름 · 파일은 지우지 않고 journal\\old 로 옮김">내려받기·비우기</button>${full ? '' : '<button id="rnjP" title="기록창을 따로 된 작은 창(380×560 · 옮긴 자리·크기 기억)으로">↗ 따로 창</button>'}<button id="rnjX" title="닫기 (Esc · Alt+L)">닫기</button></div>
<div class="t2" id="rnjK"></div><div class="ov" id="rnjO"></div><div class="b" id="rnjB"></div>`;
    (o.el || doc.body).appendChild(w);
    const $ = (s) => w.querySelector(s); const B = $('#rnjB'), OV = $('#rnjO'), K = $('#rnjK');
    const S = { tab: 'today', lines: [], after: 0, pc: 'office', name: '', rounds: [], st: null, kinds: ls.get('jw-kinds', []) || [], fold: ls.get('jw-fold', true) !== false, group: !!ls.get('jw-group', false), hit: -1, drawn: '', arm: 0, loadT: null, busy: false };
    $('#rnjA').checked = ls.get('log-autoscroll', true) !== false;
    $('#rnjF').value = ls.get('jw-f', 'all') || 'all';
    /* 자리·크기 기억(화면 밖으로 안 나감) — 따로 창은 창 자체가 자리를 기억(도우미 /win/hrect) */
    const view0 = doc.defaultView || root;
    const place = () => { if (full) return; const g = ls.get('jw-geo', null); if (!g) return; const iw = view0.innerWidth, ih = view0.innerHeight; const W = Math.max(260, Math.min(g.w || 380, iw - 8)), H = Math.max(180, Math.min(g.h || 360, ih - 8));
      Object.assign(w.style, { width: W + 'px', height: H + 'px', left: Math.max(0, Math.min(g.x, iw - W)) + 'px', top: Math.max(0, Math.min(g.y, ih - 40)) + 'px', right: 'auto', bottom: 'auto' }); };
    const save = () => { if (full) return; const r = w.getBoundingClientRect(); ls.set('jw-geo', { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }); };
    place(); view0.addEventListener('resize', place);
    $('.h').addEventListener('mousedown', (ev) => { if (full || ev.target.closest('button,select,input,label') || ev.button !== 0) return; ev.preventDefault(); const r = w.getBoundingClientRect(); const dx = ev.clientX - r.left, dy = ev.clientY - r.top;
      Object.assign(w.style, { width: r.width + 'px', height: r.height + 'px', right: 'auto', bottom: 'auto' });
      const mv = (e) => { w.style.left = Math.max(0, Math.min(e.clientX - dx, view0.innerWidth - 120)) + 'px'; w.style.top = Math.max(0, Math.min(e.clientY - dy, view0.innerHeight - 40)) + 'px'; };
      const up = () => { doc.removeEventListener('mousemove', mv); doc.removeEventListener('mouseup', up); save(); }; doc.addEventListener('mousemove', mv); doc.addEventListener('mouseup', up); });
    w.addEventListener('mouseup', (ev) => { if (!ev.target.closest('.h')) save(); });
    $('.h').addEventListener('dblclick', (ev) => { if (full || ev.target.closest('button,select,input,label')) return; ls.set('jw-geo', null); w.removeAttribute('style'); });

    const opts = () => ({ f: $('#rnjF').value, kinds: S.kinds, q: $('#rnjQ').value.trim(), fold: S.fold, group: S.group });
    const auto = () => { if ($('#rnjA').checked) B.scrollTop = B.scrollHeight; };
    function drawKinds() { const c = counts(S.lines); const ks = kindsFor(S.pc);
      const h = ks.map((k) => `<button data-k="${k}" class="${S.kinds.includes(k) ? 'on' : ''}" title="이 종류만 보기(여러 개 함께 · 다시 누르면 풂)">${KIND[k]} ${c[k] || 0}</button>`).join('') + `<span class="sp"></span><button data-o="fold" class="${S.fold ? 'on' : ''}" title="숫자만 다른 같은 줄이 이어지면 한 줄로(×N)">같은 줄 접기</button><button data-o="group" class="${S.group ? 'on' : ''}" title="10분마다 머리줄(줄 수·오류 수)">시간 묶음</button><button data-o="copy" title="지금 보이는 줄을 복사">복사</button><button data-o="save" title="지금 보이는 줄만 파일로(비우지 않음)">↓ 보이는 줄</button>`;
      if (K.innerHTML !== h) K.innerHTML = h; }
    function drawOv() { const W = stopWhy(S.st, S.pc); const J = JOBS[S.pc === 'logger' ? 'logger' : 'office']; const a = (S.st && S.st.auto) || {}; const y = (S.st && S.st.y24) || {};
      const now = S.st ? `<div><b>지금</b> · ${esc(J.read)}: ${a.on ? (/도는 중/.test(a.msg || '') ? '<span class="ok">도는 중</span>' : '쉼') : '멈춤'} · 오늘 ${a.dayN || 0}/${a.dayCap || 0}장${a.last ? ` · 마지막 ${esc(String(a.last.at || '').slice(11, 16))} ${esc(a.last.itemId || '')} ${a.last.ok ? '✓' : '✗'}${a.last.verdict ? ' ' + esc({ same: '같음', diff: '다름', noprod: '운영 칸 없음' }[a.last.verdict] || a.last.verdict) : ''}` : ''}${S.pc !== 'logger' && y.on ? `<br>${esc(J.y24)}: ${y.login === 'ok' ? (y.active ? '<span class="ok">읽는 중</span>' : '쉼') : y.login === 'need' ? '<span class="err">로그인 필요</span>' : '확인 중'}` : ''}</div>` : '';
      const h = (W.length ? W.map((x) => `<div class="stop ${x.l}">⛔ ${esc(x.t)}</div>`).join('') : S.st ? '<div class="stop ok">✓ 멈춘 데 없음 — 잘 돌고 있음</div>' : '') + now + roundsHtml(S.rounds, S.pc, ls.get('jw-rds', false));
      if (OV.dataset.h !== h) { OV.dataset.h = h; OV.innerHTML = h; const d = OV.querySelector('details.rds'); if (d) d.ontoggle = () => ls.set('jw-rds', d.open); } }
    function draw(force) { if (!w.classList.contains('on') || S.tab !== 'today') return; const o2 = opts(); const v = view(S.lines, o2); const key = JSON.stringify([o2, S.lines.length ? S.lines[S.lines.length - 1].s : 0, S.lines.length]);
      if (!force && key === S.drawn) return; S.drawn = key; const atEnd = B.scrollHeight - B.scrollTop - B.clientHeight < 30;
      B.innerHTML = v.length ? v.map((e) => rowHtml(e, o2.q)).join('') : '<div class="detail">기록 없음</div>'; drawKinds(); S.hit = -1;
      const n = o2.q ? B.querySelectorAll('mark').length : 0; $('#rnjQ').title = o2.q ? `찾음 ${n}곳 — Enter = 다음` : '글·일 이름에서 찾기 — 맞은 곳을 칠함 · Enter = 다음 맞은 곳';
      if ($('#rnjA').checked || atEnd) auto(); }
    async function drawHist() { B.innerHTML = '<div class="detail">불러오는 중</div>'; let ds = []; try { ds = ((await api('GET', '/log/days')) || {}).days || []; } catch (e) {}
      B.innerHTML = ds.map((d) => `<details class="jd" data-day="${esc(d)}"><summary>${esc(d)}${d === S.today ? ' (오늘)' : ''} <small>펼쳐서 보기</small></summary><div class="jdb"></div></details>`).join('') || '<div class="detail">쌓인 기록 없음</div>';
      B.querySelectorAll('details.jd').forEach((d) => (d.ontoggle = async () => { if (!d.open) return; const j = (await api('GET', '/log/day?d=' + encodeURIComponent(d.dataset.day))) || {}; const L = (j.lines || []).map((e, i) => ({ ...e, s: i + 1 })); const o2 = opts(); const v = view(L, { ...o2, max: 5000 });
        d.querySelector('summary small').textContent = `${L.length.toLocaleString()}줄 · 오류 ${L.filter((e) => e.l === 'err').length} · 경고 ${L.filter((e) => e.l === 'warn').length}${v.length !== L.length ? ` · 거른 결과 ${v.filter((e) => !e.g).length.toLocaleString()}줄` : ''}`;
        d.querySelector('.jdb').innerHTML = v.map((e) => rowHtml(e, o2.q)).join('') || '<div class="detail">없음</div>'; })); }
    async function load() { if (S.busy || !w.classList.contains('on')) return; S.busy = true;
      try { let j = await api('GET', '/log/lines?after=' + S.after); if (j && j.ok && S.boot && j.boot !== S.boot) { S.lines = []; S.after = 0; j = await api('GET', '/log/lines?after=0'); } /* 도우미가 다시 켜지면 줄 차례가 새로 매겨짐 → 처음부터 다시 받음 */ if (j && j.ok) { S.boot = j.boot; if (j.lines && j.lines.length) { S.lines = S.lines.concat(j.lines); if (S.lines.length > 5000) S.lines = S.lines.slice(-5000); S.after = j.lines[j.lines.length - 1].s; } S.pc = j.kind || 'office'; S.name = j.pc || ''; S.rounds = j.rounds || []; S.today = j.today; if (j.state) S.st = j.state;
          $('#rnjT').textContent = `⠿ 작업 기록 — ${S.name}${S.pc === 'logger' ? ' · 🛰 로거' : ' · 🏢 사무실'}`; } else S.st = null; }
      catch (e) { S.st = null; } finally { S.busy = false; } drawOv(); draw(); }
    function setOpen(on) { w.classList.toggle('on', on); ls.set('jw-open', on ? 1 : 0); if (o.btn) { o.btn.classList.toggle('on', on); o.btn.title = on ? '🗒 기록창 닫기 (Alt+L)' : '🗒 기록창 열기 (Alt+L)'; }
      clearInterval(S.loadT); S.loadT = null; if (on) { S.drawn = ''; load(); S.loadT = setInterval(() => { if (!doc.hidden) load(); }, 2000); } }
    const toggle = () => setOpen(!w.classList.contains('on'));
    w.querySelectorAll('[data-jt]').forEach((bt) => (bt.onclick = () => { S.tab = bt.dataset.jt; w.querySelectorAll('[data-jt]').forEach((x) => x.classList.toggle('on', x === bt)); if (S.tab === 'hist') drawHist(); else draw(true); }));
    $('#rnjF').onchange = () => { ls.set('jw-f', $('#rnjF').value); S.tab === 'hist' ? drawHist() : draw(true); };
    $('#rnjQ').oninput = () => (S.tab === 'hist' ? drawHist() : draw(true));
    $('#rnjQ').onkeydown = (e) => { if (e.key !== 'Enter') return; e.preventDefault(); const ms = [...B.querySelectorAll('mark')]; if (!ms.length) return; ms.forEach((m) => m.classList.remove('cur')); S.hit = (S.hit + (e.shiftKey ? -1 : 1) + ms.length) % ms.length; ms[S.hit].classList.add('cur'); ms[S.hit].scrollIntoView({ block: 'center' }); $('#rnjA').checked = false; };
    $('#rnjA').onchange = () => { ls.set('log-autoscroll', $('#rnjA').checked); auto(); };
    $('#rnjX').onclick = () => setOpen(false);
    if ($('#rnjP')) $('#rnjP').onclick = async () => { try { const j = await api('POST', '/win/app?p=log', { why: '기록창 ↗ 따로 창' }); if (j && j.ok) setOpen(false); else OV.insertAdjacentHTML('afterbegin', `<div class="stop warn">따로 창을 못 엶: ${esc((j && (j.err || j.msg)) || '')}</div>`); } catch (e) {} };
    K.addEventListener('click', async (ev) => { const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.k) { const k = b.dataset.k; S.kinds = S.kinds.includes(k) ? S.kinds.filter((x) => x !== k) : S.kinds.concat(k); ls.set('jw-kinds', S.kinds); }
      else if (b.dataset.o === 'fold') { S.fold = !S.fold; ls.set('jw-fold', S.fold); } else if (b.dataset.o === 'group') { S.group = !S.group; ls.set('jw-group', S.group); }
      else if (b.dataset.o === 'copy' || b.dataset.o === 'save') { const t = textOf(view(S.lines, { ...opts(), group: false }));
        if (b.dataset.o === 'copy') { let ok = false; try { await view0.navigator.clipboard.writeText(t); ok = true; } catch (e) { try { const ta = doc.createElement('textarea'); ta.value = t; doc.body.appendChild(ta); ta.select(); ok = doc.execCommand('copy'); ta.remove(); } catch (x) {} } b.textContent = ok ? '✓ 복사함' : '✗ 복사 못 함'; setTimeout(() => drawKinds(), 1500); return; }
        dl(fname('visible'), t); return; }
      S.tab === 'hist' ? drawHist() : draw(true); drawKinds(); });
    /* 파일 이름은 영문·숫자만(한글 이름은 크롬에 따라 'download'로 바뀌는 일이 있어 — 시험 크로미움에서 확인) */
    const fname = (w) => `readnow-col2-log-${String(S.name || 'pc').replace(/[^\w.-]+/g, '_')}-${S.today || ''}${w === 'visible' ? '-visible' : ''}.txt`;
    const dl = (name, t) => { const a = doc.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/plain;charset=utf-8' })); a.download = name; doc.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); };
    $('#rnjD').onclick = async () => { const b = $('#rnjD'); if (!S.arm || Date.now() - S.arm > 4000) { S.arm = Date.now(); b.textContent = '한 번 더 누르면 받고 비움'; setTimeout(() => { if (Date.now() - S.arm >= 4000) { S.arm = 0; b.textContent = '내려받기·비우기'; } }, 4100); return; }
      S.arm = 0; b.textContent = '받는 중…'; try { const t = await api('GET', '/log/all', null, true); dl(fname('all'), t); const j = await api('POST', '/log/clear', { why: '기록창 내려받기·비우기' }); S.lines = []; S.after = 0; b.textContent = j && j.ok ? `✓ 받고 비움(${j.moved}일치 · 파일은 old에)` : '✗ 비우지 못함'; await load(); draw(true); } catch (e) { b.textContent = '✗ ' + e.message; } setTimeout(() => { b.textContent = '내려받기·비우기'; }, 3000); };
    /* 단축키 — Alt+L 열기·닫기 · Esc 닫기(기록창 안에서) · / 찾기 칸 */
    doc.addEventListener('keydown', (e) => { const inField = /^(INPUT|SELECT|TEXTAREA)$/.test((e.target && e.target.tagName) || '');
      if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'l' || e.key === 'L' || e.code === 'KeyL')) { e.preventDefault(); if (!full) toggle(); return; }
      if (!w.classList.contains('on')) return; if (e.key === 'Escape' && !full && (w.contains(e.target) || !inField)) { setOpen(false); return; }
      if (e.key === '/' && !inField) { e.preventDefault(); $('#rnjQ').focus(); } });
    if (o.btn) o.btn.onclick = (e) => { e.preventDefault(); toggle(); };
    setOpen(full ? true : !!ls.get('jw-open', 0));
    return { toggle, open: () => w.classList.contains('on'), setOpen, setState: (s) => { S.st = s; if (w.classList.contains('on')) drawOv(); }, el: w, S }; }

  const api = { ...CORE, CSS, mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2Log = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

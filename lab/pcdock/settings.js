/* settings.js — ⚙ 설정 꼴·기본값·검사 (브라우저 화면과 Node가 함께 씀 · 저장은 Node만: %LOCALAPPDATA%\ReadNow\pcdock\settings.json)
 *  비밀값을 두지 않음 — 비밀번호·토큰 같은 이름의 칸이 오면 저장을 거절함
 *  꼴:
 *   { v:1, base:{ aw, ah, cols, rows },                       ← 일반 모니터 기준(16:9 · 4×3)
 *     mons:{ <모니터 이름>:{ grid:'auto'|'fine'|'8x6'|{cols,rows}, cols, rows, w, h } },  ← 저장할 때의 칸 수·크기(모니터가 빠져도 칸 검사)
 *     apps:[{ id, kind, name, icon, … 종류별 칸 }],
 *     place:[{ app, mon, c, r, w, h }],                      ← 칸 자리(왼쪽 위 c·r · 너비 w · 높이 h) · 한 칸에 하나
 *     auto:{ on, delaySec },  run:{ waitSec, reuse },  clean:{ keep:[프로세스 이름] } } */
(function (root, factory) { const M = factory(root); if (typeof module === 'object' && module.exports) module.exports = M; else root.PDSet = M; })(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';
  const G = typeof module === 'object' && module.exports ? require('./grid.js') : root.PDGrid;
  const A = typeof module === 'object' && module.exports ? require('./apps.js') : root.PDApps;
  const MAX_BYTES = 200 * 1024;
  const SECRET = /pass(word)?|passwd|비밀번호|token|secret|cookie|cred|api[_-]?key/i;
  const KIND_FIELDS = { chrome: ['urls', 'windows', 'profile'], folder: ['path'], phone: [], crd: ['url', 'profile'], web: ['url', 'profile'], claude: ['mode', 'room', 'artifact', 'how', 'folder', 'profile'], exe: ['exe', 'file'] };
  function defaults() { return { v: 1, base: { ...G.BASE }, mons: {}, apps: A.defaultApps(), place: [], auto: { on: false, delaySec: 20 }, run: { waitSec: 40, reuse: true }, clean: { keep: [] } }; }
  const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, n || 400);
  const okPath = (p) => !p || (/^([a-zA-Z]:\\|\\\\)[^<>"|?*]*$/.test(p) && !/\.\.(\\|$)/.test(p));
  const okUrl = (u) => /^https?:\/\/[^\s"<>]{3,}$/.test(u);
  /* 검사 + 고르게 — { ok, errs:[글], warns:[글], cfg } · mons(지금 모니터)가 있으면 칸 수를 그 모니터로 셈 */
  function validate(input, mons) { const errs = [], warns = []; const d = defaults();
    if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errs: ['설정이 비었거나 꼴이 틀림'], warns, cfg: d };
    let size = 0; try { size = JSON.stringify(input).length; } catch (e) { return { ok: false, errs: ['설정을 글로 바꿀 수 없음'], warns, cfg: d }; }
    if (size > MAX_BYTES) errs.push(`설정이 너무 큼(${Math.round(size / 1024)}KB · 최대 200KB)`);
    (function walk(o, at) { if (!o || typeof o !== 'object') return; for (const k of Object.keys(o)) { if (SECRET.test(k)) errs.push(`비밀값처럼 보이는 칸(${at}${k})은 저장하지 않음`); walk(o[k], at + k + '.'); } })(input, '');
    const cfg = { v: 1, base: G.baseOf(input.base), mons: {}, apps: [], place: [], auto: { on: !!(input.auto && input.auto.on), delaySec: (() => { const v = input.auto && input.auto.delaySec; return v === '' || v == null || !Number.isFinite(+v) ? 20 : Math.max(0, Math.min(600, Math.round(+v))); })() },
      run: { waitSec: Math.max(5, Math.min(180, Math.round(+(input.run && input.run.waitSec)) || 40)), reuse: !(input.run && input.run.reuse === false) },
      clean: { keep: Array.isArray(input.clean && input.clean.keep) ? input.clean.keep.map((x) => str(x, 80).replace(/\.exe$/i, '')).filter(Boolean).slice(0, 100) : [] } };
    /* 프로그램 */
    const ids = new Set(); for (const a0 of Array.isArray(input.apps) ? input.apps : []) { if (!a0 || typeof a0 !== 'object') continue; const kind = A.KINDS[a0.kind] ? a0.kind : null; if (!kind) { errs.push(`모르는 종류의 프로그램(${str(a0.kind, 20)})`); continue; }
      const id = str(a0.id, 40).replace(/[^\w-]/g, ''); if (!id) { errs.push('이름표(id)가 없는 프로그램'); continue; } if (ids.has(id)) { errs.push(`같은 이름표가 두 번(${id})`); continue; } ids.add(id);
      const a = { id, kind, name: str(a0.name, 60) || A.KINDS[kind], icon: str(a0.icon, 8) };
      for (const f of KIND_FIELDS[kind]) { const v = a0[f]; if (v == null || v === '') continue;
        if (f === 'urls') { const L = (Array.isArray(v) ? v : String(v).split(/\s+/)).map((u) => str(u, 600).trim()).filter(Boolean).slice(0, 30); const bad = L.filter((u) => !okUrl(u)); if (bad.length) errs.push(`${a.name}: 주소가 http(s)로 시작하지 않음(${bad[0].slice(0, 40)})`); a.urls = L.filter(okUrl); }
        else if (f === 'windows') a.windows = Math.max(1, Math.min(8, Math.round(+v) || 1));
        else if (f === 'url' || f === 'artifact') { const u = str(v, 600).trim(); if (u && !/^https:\/\//.test(u)) errs.push(`${a.name}: 주소는 https://로 시작해야 함`); else a[f] = u; }
        else if (f === 'room') { const u = str(v, 600).trim(); if (u && !A.UUID.test(u) && !/^https:\/\/claude\.ai\//.test(u)) errs.push(`${a.name}: 대화 방은 claude.ai 주소나 대화 번호`); else a.room = u; }
        else if (f === 'path' || f === 'exe' || f === 'file' || f === 'folder') { const p = str(v, 500).trim().replace(/^"|"$/g, ''); if (!okPath(p)) errs.push(`${a.name}: 경로 꼴이 틀림(${p.slice(0, 40)})`); else a[f] = p; if (f === 'exe' && p && !/\.(exe|lnk|bat|cmd)$/i.test(p)) warns.push(`${a.name}: 실행 파일이 .exe가 아님`); }
        else if (f === 'mode') a.mode = v === 'code' ? 'code' : 'chat';
        else if (f === 'how') a.how = v === 'web' ? 'web' : 'app';
        else if (f === 'profile') a.profile = str(v, 60).replace(/[^\w .-]/g, ''); }
      if (kind === 'chrome' && !a.windows) a.windows = 1; cfg.apps.push(a); }
    /* 모니터 칸 */
    const now = {}; (mons || []).forEach((m) => { now[m.id] = m; });
    const src = input.mons && typeof input.mons === 'object' ? input.mons : {};
    for (const id of Object.keys(src)) { const s = src[id] || {}; const gopt = s.grid && typeof s.grid === 'object' ? { cols: +s.grid.cols, rows: +s.grid.rows } : str(s.grid || 'auto', 10);
      const m = now[id] || (s.w && s.h ? { b: { x: 0, y: 0, w: +s.w, h: +s.h } } : null); const g = m ? G.gridOf(m, gopt, cfg.base) : { cols: G.MAXN, rows: G.MAXN };
      cfg.mons[str(id, 80)] = { grid: gopt, cols: g.cols, rows: g.rows, ...(m ? { w: m.b.w, h: m.b.h } : {}) }; }
    for (const m of mons || []) if (!cfg.mons[m.id]) { const g = G.gridOf(m, 'auto', cfg.base); cfg.mons[m.id] = { grid: 'auto', cols: g.cols, rows: g.rows, w: m.b.w, h: m.b.h }; }
    /* 놓은 자리 */
    for (const p0 of Array.isArray(input.place) ? input.place : []) { if (!p0) continue; const p = { app: str(p0.app, 40), mon: str(p0.mon, 80), c: Math.round(+p0.c), r: Math.round(+p0.r), w: Math.round(+p0.w) || 1, h: Math.round(+p0.h) || 1 };
      if (!ids.has(p.app)) { errs.push(`놓은 자리의 프로그램(${p.app})이 목록에 없음`); continue; }
      const mo = cfg.mons[p.mon]; if (!mo) { errs.push(`놓은 자리의 모니터(${p.mon})를 모름`); continue; }
      if (![p.c, p.r, p.w, p.h].every(Number.isFinite) || !G.inGrid(p, mo)) { errs.push(`${p.app}: 칸이 모니터 밖(${mo.cols}×${mo.rows})`); continue; }
      cfg.place.push(p); }
    for (const [i, j] of G.overlaps(cfg.place)) errs.push(`한 칸에 둘(${cfg.place[i].app} · ${cfg.place[j].app}) — 한 칸에 하나만`);
    const pc = {}; for (const p of cfg.place) pc[p.app] = (pc[p.app] || 0) + 1; for (const k of Object.keys(pc)) if (pc[k] > 1) warns.push(`${k}을(를) ${pc[k]}곳에 놓음 — 곳마다 새로 엶`);
    return { ok: !errs.length, errs, warns, cfg }; }
  return { defaults, validate, MAX_BYTES, SECRET, KIND_FIELDS };
});

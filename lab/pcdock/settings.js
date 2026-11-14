/* settings.js — ⚙ 설정 꼴·기본값·검사 (브라우저 화면과 Node가 함께 씀 · 저장은 Node만: %LOCALAPPDATA%\ReadNow\pcdock\settings.json)
 *  비밀값을 두지 않음 — 비밀번호·토큰 같은 이름의 칸이 오면 저장을 거절함
 *  꼴:
 *   { v:2, base:{ aw, ah, cols, rows },                       ← 일반 모니터 기준(16:9 · 4×3)
 *     mons:{ <모니터 이름>:{ grid:'auto'|'fine'|'8x6'|{cols,rows}, cols, rows, w, h } },  ← 저장할 때의 칸 수·크기(모니터가 빠져도 칸 검사)
 *     apps:[{ id, kind, name, icon, … 종류별 칸 }],             ← 목록의 '틀'(놓을 때 처음 값)
 *     place:[{ id, app, name, o:{ 종류별 칸 }, mon, c, r, w, h }],  ← 배치(인스턴스) — 배치마다 자기 설정 o · 칸 자리(왼쪽 위 c·r · 너비 w · 높이 h) · 한 칸에 하나
 *   0.1.0의 v:1(배치에 자기 설정이 없음)은 읽을 때 틀의 값을 배치마다 복사해 v:2로 옮김(migrated) — 예전 파일은 old\에 남김(지우지 않음)
 *     auto:{ on, delaySec },  run:{ waitSec, reuse, closeFirst },  clean:{ keep:[프로세스 이름] },
 *     selfAdded:true } ← (0.1.7) PC 배치 작은 창을 목록·칸에 한 번 넣었음(사람이 빼면 다시 안 넣음) */
(function (root, factory) { const M = factory(root); if (typeof module === 'object' && module.exports) module.exports = M; else root.PDSet = M; })(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';
  const G = typeof module === 'object' && module.exports ? require('./grid.js') : root.PDGrid;
  const A = typeof module === 'object' && module.exports ? require('./apps.js') : root.PDApps;
  const MAX_BYTES = 200 * 1024;
  const SECRET = /pass(word)?|passwd|비밀번호|token|secret|cookie|cred|api[_-]?key/i;
  const KIND_FIELDS = A.KIND_FIELDS;
  function defaults() { return { v: 2, base: { ...G.BASE }, mons: {}, apps: A.defaultApps(), place: [], auto: { on: false, delaySec: 20 }, run: { waitSec: 40, reuse: true, closeFirst: true }, clean: { keep: [] } }; }
  const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, n || 400);
  const okPath = (p) => !p || (/^([a-zA-Z]:\\|\\\\)[^<>"|?*]*$/.test(p) && !/\.\.(\\|$)/.test(p));
  const okUrl = (u) => /^https?:\/\/[^\s"<>]{3,}$/.test(u);
  /* 종류별 칸 검사 — 틀(apps)과 배치(place.o)가 함께 씀 */
  function fields(kind, src, dst, nm, errs, warns) {
    for (const f of KIND_FIELDS[kind] || []) { let v = src[f]; if (f === 'paths' && (v == null || v === '' || (Array.isArray(v) && !v.length)) && src.path) v = [src.path]; if (v == null || v === '') continue;
        if (f === 'urls') { const L = (Array.isArray(v) ? v : String(v).split(/\s+/)).map((u) => str(u, 600).trim()).filter(Boolean).slice(0, 30); const bad = L.filter((u) => !okUrl(u)); if (bad.length) errs.push(`${nm}: 주소가 http(s)로 시작하지 않음(${bad[0].slice(0, 40)})`); dst.urls = L.filter(okUrl); }
        else if (f === 'paths') { const L = (Array.isArray(v) ? v : String(v).split(/\r?\n/)).map((x) => str(x, 500).trim().replace(/^"|"$/g, '')).filter(Boolean).slice(0, 20); const bad = L.filter((x) => !okPath(x)); if (bad.length) errs.push(`${nm}: 폴더 경로 꼴이 틀림(${bad[0].slice(0, 40)})`); dst.paths = L.filter(okPath); }
        else if (f === 'windows') dst.windows = Math.max(1, Math.min(8, Math.round(+v) || 1));
        else if (f === 'url' || f === 'artifact') { const u = str(v, 600).trim(); if (u && !/^https:\/\//.test(u)) errs.push(`${nm}: 주소는 https://로 시작해야 함`); else dst[f] = u; }
        else if (f === 'room') { const u = str(v, 600).trim(); if (u && !A.UUID.test(u) && !/^https:\/\/claude\.ai\//.test(u)) errs.push(`${nm}: 대화 방은 claude.ai 주소나 대화 번호`); else dst.room = u; }
        else if (f === 'path' || f === 'exe' || f === 'file' || f === 'folder') { const p = str(v, 500).trim().replace(/^"|"$/g, ''); if (!okPath(p)) errs.push(`${nm}: 경로 꼴이 틀림(${p.slice(0, 40)})`); else dst[f] = p; if (f === 'exe' && p && !/\.(exe|lnk|bat|cmd)$/i.test(p)) warns.push(`${nm}: 실행 파일이 .exe가 아님`); }
        else if (f === 'mode') dst.mode = v === 'code' ? 'code' : 'chat';
        else if (f === 'how') dst.how = v === 'web' ? 'web' : 'app';
        else if (f === 'profile') dst.profile = str(v, 60).replace(/[^\w .-]/g, ''); }
  }
  /* 검사 + 고르게 — { ok, errs:[글], warns:[글], cfg } · mons(지금 모니터)가 있으면 칸 수를 그 모니터로 셈 */
  function validate(input, mons) { const errs = [], warns = []; const d = defaults();
    if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errs: ['설정이 비었거나 꼴이 틀림'], warns, cfg: d };
    let size = 0; try { size = JSON.stringify(input).length; } catch (e) { return { ok: false, errs: ['설정을 글로 바꿀 수 없음'], warns, cfg: d }; }
    if (size > MAX_BYTES) errs.push(`설정이 너무 큼(${Math.round(size / 1024)}KB · 최대 200KB)`);
    (function walk(o, at) { if (!o || typeof o !== 'object') return; for (const k of Object.keys(o)) { if (SECRET.test(k)) errs.push(`비밀값처럼 보이는 칸(${at}${k})은 저장하지 않음`); walk(o[k], at + k + '.'); } })(input, '');
    const cfg = { v: 2, base: G.baseOf(input.base), mons: {}, apps: [], place: [], auto: { on: !!(input.auto && input.auto.on), delaySec: (() => { const v = input.auto && input.auto.delaySec; return v === '' || v == null || !Number.isFinite(+v) ? 20 : Math.max(0, Math.min(600, Math.round(+v))); })() },
      run: { waitSec: Math.max(5, Math.min(180, Math.round(+(input.run && input.run.waitSec)) || 40)), reuse: !(input.run && input.run.reuse === false), closeFirst: !(input.run && input.run.closeFirst === false) }, /* (0.1.6) ③ 때 목록의 프로그램 창을 먼저 닫고 새로 — 기본 켬 */
      clean: { keep: Array.isArray(input.clean && input.clean.keep) ? input.clean.keep.map((x) => str(x, 80).replace(/\.exe$/i, '')).filter(Boolean).slice(0, 100) : [] } };
    /* 프로그램 */
    const ids = new Set(); for (const a0 of Array.isArray(input.apps) ? input.apps : []) { if (!a0 || typeof a0 !== 'object') continue; const kind = A.KINDS[a0.kind] ? a0.kind : null; if (!kind) { errs.push(`모르는 종류의 프로그램(${str(a0.kind, 20)})`); continue; }
      const id = str(a0.id, 40).replace(/[^\w-]/g, ''); if (!id) { errs.push('이름표(id)가 없는 프로그램'); continue; } if (ids.has(id)) { errs.push(`같은 이름표가 두 번(${id})`); continue; } ids.add(id);
      const a = { id, kind, name: str(a0.name, 60) || A.KINDS[kind], icon: str(a0.icon, 8) };
      fields(kind, a0, a, a.name, errs, warns);
      if (kind === 'chrome' && !a.windows) a.windows = 1; cfg.apps.push(a); }
    /* 0.1.0 설정에는 새 틀(번외 수집기·ALPS 도우미)이 없음 → 더함 */
    if (input.v !== 2 && Array.isArray(input.apps)) for (const c of A.defaultApps()) if ((c.kind === 'col2' || c.kind === 'alps') && !ids.has(c.id) && !cfg.apps.some((x) => x.kind === c.kind)) { ids.add(c.id); cfg.apps.push(c); }
    /* 모니터 칸 */
    const now = {}; (mons || []).forEach((m) => { now[m.id] = m; });
    const src = input.mons && typeof input.mons === 'object' ? input.mons : {};
    for (const id of Object.keys(src)) { const s = src[id] || {}; const gopt = s.grid && typeof s.grid === 'object' ? { cols: +s.grid.cols, rows: +s.grid.rows } : str(s.grid || 'auto', 10);
      const m = now[id] || (s.w && s.h ? { b: { x: 0, y: 0, w: +s.w, h: +s.h } } : null); const g = m ? G.gridOf(m, gopt, cfg.base) : { cols: G.MAXN, rows: G.MAXN };
      cfg.mons[str(id, 80)] = { grid: gopt, cols: g.cols, rows: g.rows, ...(m ? { w: m.b.w, h: m.b.h } : {}) }; }
    for (const m of mons || []) if (!cfg.mons[m.id]) { const g = G.gridOf(m, 'auto', cfg.base); cfg.mons[m.id] = { grid: 'auto', cols: g.cols, rows: g.rows, w: m.b.w, h: m.b.h }; }
    /* 놓은 자리 */
    const v1 = input.v !== 2; let migrated = false; const pids = new Set();
    for (const p0 of Array.isArray(input.place) ? input.place : []) { if (!p0) continue; const p = { id: str(p0.id, 40).replace(/[^\w-]/g, ''), app: str(p0.app, 40), name: str(p0.name, 60), o: {}, mon: str(p0.mon, 80), c: Math.round(+p0.c), r: Math.round(+p0.r), w: Math.round(+p0.w) || 1, h: Math.round(+p0.h) || 1 };
      if (!ids.has(p.app)) { errs.push(`놓은 자리의 프로그램(${p.app})이 목록에 없음`); continue; }
      const tpl = cfg.apps.find((x) => x.id === p.app);
      if (!p.id || pids.has(p.id)) { let i = 1; while (pids.has('p' + i)) i++; p.id = 'p' + i; } pids.add(p.id);
      /* 0.1.0 설정(배치에 자기 설정 없음) → 틀의 값을 이 배치에 복사(그 뒤로는 따로) */
      const hasO = !!(p0.o && typeof p0.o === 'object'); const src = hasO ? p0.o : A.newInstO(tpl); if (!hasO && v1) migrated = true;
      fields(tpl.kind, src, p.o, p.name || tpl.name, errs, warns);
      const mo = cfg.mons[p.mon]; if (!mo) { errs.push(`놓은 자리의 모니터(${p.mon})를 모름`); continue; }
      if (![p.c, p.r, p.w, p.h].every(Number.isFinite) || !G.inGrid(p, mo)) { errs.push(`${p.name || p.app}: 칸이 모니터 밖(${mo.cols}×${mo.rows})`); continue; }
      cfg.place.push(p); }
    /* (0.1.7 · 정범님 11/14 16:29) 🖥 PC 배치 작은 창 자신 — 창이 하나라 배치도 하나만 · 처음 한 번 목록에 더하고 비어 있는 작은 칸에 놓음(selfAdded — 사람이 뺀 뒤엔 다시 안 넣음 · 모니터를 모르면 다음에) */
    { const sIds = new Set(cfg.apps.filter((a) => a.kind === 'self').map((a) => a.id)); let seen = false;
      cfg.place = cfg.place.filter((p) => { if (!sIds.has(p.app)) return true; if (seen) { warns.push('PC 배치 작은 창은 한 곳에만 놓을 수 있어 두 번째 자리는 뺐습니다'); return false; } seen = true; return true; });
      if (input.selfAdded) cfg.selfAdded = true;
      else if (mons && mons.length) { let tpl = cfg.apps.find((a) => a.kind === 'self'); if (!tpl) { tpl = A.defaultApps().find((a) => a.kind === 'self'); if (ids.has(tpl.id)) tpl = { ...tpl, id: tpl.id + '1' }; ids.add(tpl.id); cfg.apps.push(tpl); }
        if (!cfg.place.some((p) => p.app === tpl.id)) { const sp = A.selfSpot(cfg, mons, G); if (sp) { let i = 1; while (pids.has('p' + i)) i++; pids.add('p' + i); cfg.place.push({ id: 'p' + i, app: tpl.id, name: '', o: {}, ...sp }); cfg.selfNew = true; } }
        cfg.selfAdded = true; } }
    for (const [i, j] of G.overlaps(cfg.place)) errs.push(`한 칸에 둘(${cfg.place[i].name || cfg.place[i].app} · ${cfg.place[j].name || cfg.place[j].app}) — 한 칸에 하나만`);
    if (v1 && Array.isArray(input.apps) && input.apps.some((a) => a && a.kind === 'folder' && a.path)) migrated = true;
    cfg.migrated = migrated || (v1 && !!input.v);
    const mg = cfg.migrated; delete cfg.migrated; const sn = !!cfg.selfNew; delete cfg.selfNew; return { ok: !errs.length, errs, warns, cfg, migrated: !!mg, selfNew: sn }; }
  return { defaults, validate, MAX_BYTES, SECRET, KIND_FIELDS };
});

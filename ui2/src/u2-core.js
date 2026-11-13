/* 리드나우 2 — 바탕(U2): 작은 도구·알림·확인·기기·저장소(ui2_* 칸과 기기 저장 rn2-)
 * 규칙: 브라우저 팝업(alert/confirm/prompt/window.open) 쓰지 않음 — 화면 안 알림(U2.toast)·확인(U2.ask)·두 번 누르기(U2.twice)
 *       기기 저장 열쇠는 모두 'rn2-' 머리 · 기기 이름(rn-device)만 지금 웹앱과 일부러 함께 씀 */
(function () {
  'use strict';
  const U2 = (window.U2 = window.U2 || {});
  U2.ver = window.U2_VER || '0.0.0';
  U2.base = window.U2_BASE || '../app/';
  /* 근거 없는 기준값은 모두 여기(설정으로 바꿈) */
  U2.CFG = {
    ctxMs: 1500, /* 위젯이 부른 쓰기로 칠 시간(누른 뒤 ms) — 근거: 없음, 설정으로 바꿈 (설계안은 0.5초 — 느린 기기 여유) */
    lockMin: 10, /* 편집 잠금 유효 시간(분) — 설계안 5-2 */
    undoMax: 100, /* 되돌리기 걸음 — 설계안 5-2 */
    verCheckMin: 10, /* 새 판 확인 간격(분) — 근거: 없음, 설정으로 바꿈 */
    perfMin: 5, /* 충돌 감시 요약 저장 간격(분) — 설계안 8-3 */
    iframeOk: ['https://jerrycson.github.io/', 'https://readnow.kr/'], /* 바깥 페이지 보기 위젯이 열 수 있는 주소 머리 */
  };
  U2.$ = (s, r) => (r || document).querySelector(s);
  U2.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  U2.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U2.uid = (p) => (p || 'w') + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 6);
  U2.clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));
  U2.now = () => new Date().toISOString();
  U2.today = () => { const d = new Date(); return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0'); };

  /* ── 사건 줄(버스) ── */
  const H = {};
  U2.on = (k, f) => { (H[k] = H[k] || []).push(f); return () => { H[k] = (H[k] || []).filter((x) => x !== f); }; };
  U2.emit = (k, v) => { (H[k] || []).slice().forEach((f) => { try { f(v); } catch (e) { console.error('[u2]', k, e); } }); };

  /* ── 기기 저장(rn2-) — 실패해도 멈추지 않음 ── */
  U2.ls = {
    get(k, d) { try { const v = localStorage.getItem('rn2-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('rn2-' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem('rn2-' + k); } catch (e) {} },
  };

  /* ── 기기 이름·관리자 ── 지금 웹앱이 불러와졌으면 그 판정을 그대로(isAdminDevice) · 아니면(안전 모드) 관리자 아님 */
  U2.dev = () => { try { if (typeof deviceName === 'function') return String(deviceName() || '').trim() || '이름 없는 기기'; } catch (e) {} try { return (localStorage.getItem('rn-device') || '').trim() || '이름 없는 기기'; } catch (e) { return '이름 없는 기기'; } };
  U2.isAdmin = () => { if (U2._adminOverride != null) return !!U2._adminOverride; try { if (typeof isAdminDevice === 'function') return !!isAdminDevice(); } catch (e) {} return false; };

  /* ── 화면 안 알림 ── */
  /* ── 화면 안 알림 — 🔔 알림 한 자리(성공 사례 견줌 ① · 지금 웹앱 1.78.467 '알림 한 자리'를 이어서 · 0.4.5)
   *  왼쪽 아래 한 줄 기둥에 차례로 쌓음(최대 3 · 오래된 것부터 사라짐) · 지금 웹앱 알림 자리(#ux2dock)·💰 매입가 단추가 있으면 그 위로 · 페이지 단추를 가리지 않게 글만 누를 수 없음(단추만 누름)
   *  오류 알림은 6초 · 영어 원문은 사람 말로(U2.errKo — ⑬) · opt.act = { label, fn } → '되돌리기' 같은 단추 하나(⑪) */
  U2.ERRKO = [[/QuotaExceeded|exceeded the quota|storage.*full/i, '기기 저장 공간이 모자람'], [/permission|insufficient permissions|unauthorized|\b403\b/i, '권한 없음 — 이 계정·기기에 허락이 없음'], [/unauthenticated|id-token-expired|auth\//i, '로그인이 풀림 — 다시 로그인'],
    [/Failed to fetch|NetworkError|network ?error|ERR_INTERNET|offline|unavailable/i, '연결이 끊김 — 인터넷 연결을 확인하고 잠시 뒤 다시'], [/timeout|timed out|deadline-exceeded/i, '시간 초과 — 잠시 뒤 다시'], [/resource-exhausted|quota/i, '사용 한도를 넘음 — 잠시 뒤 다시'],
    [/Unexpected end of JSON|Unexpected token|JSON\.parse|not valid JSON/i, '응답이 비었거나 잘려 읽지 못함 — 잠시 뒤 다시'], [/not-found|\b404\b/i, '찾는 자료·파일이 없음'], [/Cannot read propert|undefined is not|is not a function|is not defined|null/i, '화면 코드 오류 — 리드에게 이 글을 알려 주세요'], [/abort/i, '그만둠(중간에 끊김)']];
  U2.errKo = (e) => {
    try { if (typeof errKo === 'function') return errKo(e); } catch (x) {} /* 지금 웹앱 것이 있으면 그대로(같은 말) */
    const o = e && typeof e === 'object'; const raw = String((o ? e.code || e.message || e.name : e) || '').trim(); if (!raw) return '알 수 없는 오류';
    if (/[가-힣]/.test(raw) && !/[A-Za-z]{3,}[\s:'-]+[A-Za-z]{3,}/.test(raw)) return raw; const all = (o ? (e.code || '') + ' ' + (e.message || '') : raw);
    for (const [re, ko] of U2.ERRKO) if (re.test(all)) return ko + ' (' + raw.slice(0, 120) + ')'; return '확인 못 한 오류 (' + raw.slice(0, 160) + ')';
  };
  /* 알림 글 끝의 영어 오류(': Failed to fetch' 같은)만 사람 말로 — 앞의 한국어 설명은 그대로 */
  U2.koMsg = (m) => { m = String(m == null ? '' : m); const i = m.search(/[A-Za-z][A-Za-z0-9_]*(?:[\s:'().,\/-]+[A-Za-z0-9_]+){1,}[^가-힣]*$/); if (i < 0) return m; const tail = m.slice(i); if (!/[A-Za-z]{2,}[\s:'-]+[A-Za-z]{2,}|^[a-z]+(-[a-z]+)+$/.test(tail.trim())) return m; return m.slice(0, i) + U2.errKo(tail.trim()); };
  U2.notesBottom = () => { let b = 12; for (const id of ['ux2dock', 'buyp_fab']) { const el = document.getElementById(id); if (!el || !el.isConnected) continue; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || el.classList.contains('empty')) continue; const r = el.getBoundingClientRect(); if (r.width && r.height && r.left < 260 && r.top > innerHeight / 2) b = Math.max(b, Math.round(innerHeight - r.top + 8)); } return b; };
  U2.toast = (m, err, ms, opt) => {
    opt = opt || {}; let t = document.getElementById('u2-toast');
    if (!t) { t = document.createElement('div'); t.id = 'u2-toast'; t.className = 'u2-toast u2-notes'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
    const text = err ? U2.koMsg(m) : String(m == null ? '' : m);
    const last = t.lastElementChild; if (last && last._m === text && !opt.act) { last._n = (last._n || 1) + 1; last.querySelector('.u2-nt').textContent = text + ' ×' + last._n; clearTimeout(last._h); last._h = setTimeout(() => last.remove(), ms || (err ? 6000 : 2400)); return last; } /* 같은 글이 잇달아 오면 한 줄 + 횟수 */
    const n = document.createElement('div'); n.className = 'u2-note' + (err ? ' err' : ''); n._m = text; n.innerHTML = '<span class="u2-nt"></span>'; n.firstChild.textContent = text;
    if (opt.act && typeof opt.act.fn === 'function') { const b = document.createElement('button'); b.type = 'button'; b.className = 'u2-nact'; b.textContent = opt.act.label || '되돌리기'; b.onclick = () => { clearTimeout(n._h); n.remove(); try { opt.act.fn(); } catch (e) { U2.toast('되돌리지 못함: ' + U2.errKo(e), 1); } }; n.appendChild(b); }
    t.appendChild(n); while (t.children.length > 3) t.firstElementChild.remove();
    t.style.bottom = 'calc(' + U2.notesBottom() + 'px + env(safe-area-inset-bottom, 0px))'; const fab = document.querySelector('.u2-fab'); t.style.left = fab && fab.getBoundingClientRect().width ? Math.round(fab.getBoundingClientRect().right + 10) + 'px' : ''; /* 왼쪽 떠 있는 단추(위젯)가 있으면 그 옆으로 — 겹치지 않음(H-06) */ t.classList.add('on'); t.classList.toggle('err', !!err);
    n._h = setTimeout(() => { n.remove(); if (!t.children.length) t.classList.remove('on'); }, ms || (opt.act ? 10000 : err ? 6000 : 2400));
    return n;
  };
  /* ── 화면 안 확인(브라우저 confirm 대신) — 대상 이름을 꼭 보임 ── */
  U2.ask = (msg, opt) => new Promise((res) => {
    opt = opt || {}; const old = document.getElementById('u2-ask'); if (old) old.remove();
    const b = document.createElement('div'); b.id = 'u2-ask'; b.className = 'u2-ask'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-modal', 'true');
    b.innerHTML = `<div class="u2-askbox"><div class="u2-askm"></div><div class="u2-askb"><button type="button" class="u2-btn u2-pri" data-ok>${U2.esc(opt.ok || '확인')}</button><button type="button" class="u2-btn" data-no>${U2.esc(opt.no || '그만두기')}</button></div></div>`;
    b.querySelector('.u2-askm').textContent = msg; document.body.appendChild(b);
    const done = (v) => { b.remove(); document.removeEventListener('keydown', kd, true); res(v); };
    const kd = (e) => { if (e.key === 'Escape') { e.stopPropagation(); done(false); } };
    document.addEventListener('keydown', kd, true);
    b.querySelector('[data-ok]').onclick = () => done(true); b.querySelector('[data-no]').onclick = () => done(false);
    b.addEventListener('click', (e) => { if (e.target === b) done(false); });
    setTimeout(() => b.querySelector('[data-ok]').focus(), 0);
  });
  /* ── 두 번 누르기 확인: 첫 번째 = 단추 글이 '한 번 더 누르면 …'으로 바뀜 (4초 안에 다시) ──
   *  (0.4.10 · 성공 사례 견줌 '확인 방식 하나로' — 지금 웹앱 W11과 같은 규칙) 0.4초 안 더블클릭의 두 번째 누름은 무시(손이 미끄러진 더블클릭·두 번 톡이 곧바로 실행되지 않게)
   *  더블클릭인지는 브라우저가 세는 누름 횟수(click.detail ≥ 2)로 봄 — 천천히 두 번 누른 것·키보드(Enter)는 그대로
   *  opt.undo(fn) — 한 뒤 알림에 '↶ 되돌리기'(10초) · opt.done — 한 뒤 알림 글 */
  U2.TWICE_GAP = 400; U2._clk = { at: 0, n: 0 };
  document.addEventListener('click', (e) => { U2._clk = { at: Date.now(), n: e.detail || 0 }; }, true);
  U2.isDbl = () => Date.now() - U2._clk.at < 60 && U2._clk.n >= 2;
  U2.twice = (btn, label, fn, opt) => {
    opt = opt || {};
    if (btn._u2arm && Date.now() - btn._u2arm < U2.TWICE_GAP && U2.isDbl()) { btn.classList.add('u2-dblno'); setTimeout(() => btn.classList.remove('u2-dblno'), 500); return; } /* 더블클릭의 두 번째 — 무장 상태 그대로 */
    if (btn._u2arm && Date.now() - btn._u2arm < 4000) { btn._u2arm = 0; clearTimeout(btn._u2h); btn.classList.remove('u2-armed'); btn.removeAttribute('aria-live'); if (btn._u2txt != null) btn.innerHTML = btn._u2txt;
      const after = () => { if (typeof opt.undo === 'function') U2.toast(opt.done || label + ' — 했음', false, 0, { act: { label: '↶ 되돌리기', fn: opt.undo } }); else if (opt.done) U2.toast(opt.done); };
      let r; try { r = fn(); } catch (e) { U2.toast(U2.errKo(e), 1); return; } if (r && typeof r.then === 'function') return r.then((v) => { if (v !== false) after(); return v; }, (e) => U2.toast(U2.errKo(e), 1)); if (r !== false) after(); return r; }
    btn._u2txt = btn.innerHTML; btn._u2arm = Date.now(); btn.classList.add('u2-armed'); btn.setAttribute('aria-live', 'polite'); btn.textContent = '한 번 더 누르면 ' + label;
    clearTimeout(btn._u2h); btn._u2h = setTimeout(() => { btn._u2arm = 0; btn.classList.remove('u2-armed'); btn.removeAttribute('aria-live'); if (btn._u2txt != null) btn.innerHTML = btn._u2txt; }, 4000);
  };

  /* ── 저장소: Firestore(지금 웹앱이 연 것 · 칸 이름 ui2_*만) — 못 쓰면 기기에만(rn2-c:) ──
   * 읽기 수를 세어 둠(설계안 8-1: 배치 불러오기 3문서 안) */
  U2.stat = { reads: 0, writes: 0 };
  U2.store = {
    fs() { try { if (window.firebase && firebase.apps && firebase.apps.length && firebase.firestore) return firebase.firestore(); } catch (e) {} return null; },
    _lk: (col, id) => 'c:' + col + '/' + id,
    async get(col, id) {
      if (!/^ui2_/.test(col)) throw new Error('ui2_ 칸만 씀');
      const db = this.fs();
      if (db && U2.authed) { try { const s = await db.collection(col).doc(id).get(); U2.stat.reads++; const v = s.exists ? s.data() : null; if (v) U2.ls.set(this._lk(col, id), v); return v; } catch (e) { U2.emit('storeErr', e); } }
      return U2.ls.get(this._lk(col, id), null);
    },
    async set(col, id, v, merge) {
      if (!/^ui2_/.test(col)) throw new Error('ui2_ 칸만 씀');
      const cur = merge ? Object.assign({}, U2.ls.get(this._lk(col, id), {}) || {}, v) : v;
      U2.ls.set(this._lk(col, id), cur);
      const db = this.fs();
      if (db && U2.authed) { try { await db.collection(col).doc(id).set(v, merge ? { merge: true } : undefined); U2.stat.writes++; return true; } catch (e) { U2.emit('storeErr', e); return false; } }
      return true;
    },
    async where(col, f, val) {
      const db = this.fs(); const out = [];
      if (db && U2.authed) { try { const q = await db.collection(col).where(f, '==', val).get(); U2.stat.reads += Math.max(1, q.size || 0); q.forEach((d) => out.push(Object.assign({ _id: d.id }, d.data()))); return out; } catch (e) { U2.emit('storeErr', e); } }
      /* 기기에만: 머리로 찾음 */
      try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('rn2-c:' + col + '/') === 0) { const v = JSON.parse(localStorage.getItem(k)); if (v && v[f] === val) out.push(Object.assign({ _id: k.split('/').pop() }, v)); } } } catch (e) {}
      return out;
    },
  };
})();

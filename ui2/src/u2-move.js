/* 리드나우 2 — 단계 13 이전 장치 (정범님 11/05 결정 '옮기기 ㉮' · MOVE.md)
 * ㉮ = 지금 웹앱 주소를 열면 새 웹앱으로 바로 넘어가고, 옛 화면(지금 웹앱)은 30일 동안 다른 주소(<지금 웹앱>?old=1)로 남김.
 *  - 이전 상태는 ui2_site/main.move 한 칸 { state:'off'|'on'|'back', at, by, until, to, old, plan } + moveLog(바꾼 기록 50줄)
 *  - 같은 주소 공간(jerrycson.github.io)이라 기기 저장 rn2-move 에 같은 것을 적어 둠 → 지금 웹앱 틀 맨 앞의 짧은 글(tools/move-snippet.js · 리드가 넣음)이
 *    그것만 보고 곧바로 넘김(무거운 본문을 받기 전) · rn2-move 를 쓰는 것은 새 웹앱뿐(지금 웹앱은 읽기만)
 *  - 한 번에 되돌리기: move.state 'back' + 비상 '모두 막기'(lockAll) → 다음 열기부터 지금 웹앱 주소가 넘어가지 않음.
 *    'on'을 기억한 기기가 넘어와도 새 웹앱이 'back'을 읽고 rn2-move를 고친 뒤 곧바로 옛 주소로 돌려보냄(돌고 도는 일 없음 — 시험 t_move)
 *  - 이전 전 점검(M.checks): 막히는 줄(hard)이 하나라도 있으면 '이전 시작' 단추가 눌리지 않음 · 시작·되돌리기 모두 두 번 누르기
 *  - Claude 혼자 누르지 않음 — 날짜·시각은 정범님이 정하고 정범님이 누름(MOVE.md) */
(function () {
  'use strict';
  const U2 = (window.U2 = window.U2 || {});
  const M = (U2.move = U2.move || {});
  const esc = (s) => U2.esc(s);
  M.KEY = 'move'; /* 기기 저장 rn2-move */
  M.DAYS = 30; /* 옛 화면을 남기는 날 수(정범님 ㉮) */
  M.TRIAL_END = '2026-11-19'; /* 단계 12 시범 14일이 끝나는 날(11/05 시작) — U2.CFG.trialEnd 로 바꿀 수 있음 */
  const day = (d) => { const x = d ? new Date(d) : new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  /* 열린 순간 주소(지금 웹앱 주소에서 넘어왔나) — 새 웹앱·옛 본문이 곧 주소를 고쳐 쓰므로 먼저 잡아 둠 */
  M.q0 = location.search; M.h0 = location.hash; M.fromOld = new URLSearchParams(M.q0).get('from') === 'old';
  M.cur = () => Object.assign({ state: 'off' }, (U2.site && U2.site.move) || {});
  /* 새 웹앱 주소(이 파일이 있는 곳 맨 위) · 옛 화면 주소(지금 웹앱 + ?old=1) */
  M.toUrl = () => new URL('./', location.href.split('#')[0]).href.replace(/index\.html$/, '');
  M.oldUrl = (extra) => { const u = new URL(U2.base, location.href); u.searchParams.set('old', '1'); if (extra) Object.entries(extra).forEach(([k, v]) => u.searchParams.set(k, v)); return u.href; };
  M.daysLeft = (m) => { m = m || M.cur(); if (!m.until) return null; return Math.max(0, Math.ceil((new Date(m.until) - Date.now()) / 864e5)); };
  /* 기기 저장(rn2-move) — 지금 웹앱 틀의 짧은 글이 읽는 것 */
  M.cache = (m) => { m = m || M.cur(); U2.ls.set(M.KEY, { state: m.state || 'off', to: m.to || M.toUrl(), old: m.old || M.oldUrl(), until: m.until || '', at: m.at || '', rev: m.rev || 0 }); };
  M.cached = () => U2.ls.get(M.KEY, null);

  /* ── 열 때 맞추기: 전체 설정(ui2_site/main)을 읽은 뒤 한 번 ── */
  M.sync = () => {
    const m = M.cur(); const c = M.cached();
    if (m.state === 'on' || (c && c.state !== m.state)) M.cache(m); /* 'on'이 아니게 바뀌었으면 기기 저장도 고침(되돌린 뒤 넘어오지 않게) */
    const q = new URLSearchParams(M.q0);
    if (M.fromOld && m.state !== 'on' && !M._went) { /* 되돌렸는데 옛 기억으로 넘어옴 → 곧바로 지금 웹앱으로(옛 주소 그대로 · ?old 없이) */
      M._went = true; const u = new URL(U2.base, location.href); q.delete('from'); q.delete('p'); q.forEach((v, k) => u.searchParams.set(k, v)); u.hash = M.h0;
      try { U2.toast('되돌린 상태 — 지금 웹앱으로 돌아갑니다'); } catch (e) {} setTimeout(() => location.replace(u.href), M.backDelay == null ? 400 : M.backDelay); return 'back';
    }
    if (M.fromOld && m.state === 'on' && !M._hi) { M._hi = true; const n = M.daysLeft(m); try { U2.toast('리드나우 2로 옮겼습니다 — 옛 화면은 ☰ → ↩ 옛 화면' + (n != null ? ' (' + n + '일 남음)' : ''), false, 6000); } catch (e) {} }
    return m.state;
  };

  /* ── 이전 전 점검 — 줄마다 { k, name, ok, hard, note } ── */
  M.checks = async () => {
    const out = []; const add = (k, name, ok, hard, note) => out.push({ k, name, ok: !!ok, hard: !!hard, note: note == null ? '' : String(note) });
    const end = (U2.CFG && U2.CFG.trialEnd) || M.TRIAL_END; const today = day();
    add('trial', '단계 12 시범 14일이 끝남(' + end + ' 뒤)', today >= end, true, '오늘 ' + today);
    const L = U2.legacy || {};
    add('legacy', '지금 웹앱을 불러와 그림(안전 모드 아님)', L.ready && L.shellDone && !U2.safe, true, L.appVer ? '지금 웹앱 ' + L.appVer : '불러오지 못함');
    add('guard', '쓰기 막이가 걸림', U2.guard && U2.guard.installed, true, U2.guard ? '감싼 곳 ' + (U2.guard.wrapped || 0) : '');
    const bad = (U2.adapters && U2.adapters.bad) || []; add('contract', '새 웹앱이 부르는 옛 함수(계약) 깨짐 0', !bad.length, true, bad.map((b) => b.n).join(', ') || '0');
    let T = U2._track; try { if (!T && U2.loadTrack) T = await U2.loadTrack(); } catch (e) {}
    const nx = T && T.rows ? T.rows.filter((r) => r.state === '❌').length : null;
    add('track', '따라잡기 표 ❌ 0줄', nx === 0, true, nx == null ? '표를 받지 못함' : '❌ ' + nx + '줄 · 마지막 ' + ((T.rows[T.rows.length - 1] || {}).app || '-'));
    const ok = (U2.site && U2.site.writeOk) || {}; const on = Object.entries(ok).filter(([, v]) => v && v.on); const wide = on.filter(([, v]) => !(v.cols && v.cols.length));
    add('cols', '켠 쓰기 허락이 모두 칸(컬렉션)까지 좁혀짐', !wide.length, true, on.length ? '켠 것 ' + on.length + ' · 칸 없음 ' + wide.map(([k]) => k).join(', ') : '켠 것 없음(모두 읽기만)');
    add('admin', '관리자 기기에서 누름', U2.isAdmin(), true, U2.dev());
    let oldOk = false; try { const r = await fetch(new URL('index.html', U2.base).href, { cache: 'no-store' }); oldOk = r.ok && /readnow-webapp\.js/.test(await r.text()); } catch (e) {}
    add('old', '옛 화면 주소가 열림(지금 웹앱 틀)', oldOk, true, M.oldUrl());
    const m = M.cur(); add('plan', '정범님이 정한 이전 날짜·시각', !!m.plan, false, m.plan ? m.plan.replace('T', ' ') : '아직 — 아래 칸에서 정함');
    add('both', '이 기기에 지금 웹앱 탭이 따로 열려 있지 않음', !U2._both, false, U2._both ? '닫고 다시' : '');
    add('lock', "비상 '모두 막기'가 꺼져 있음", !(U2.site && U2.site.lockAll), false, U2.site && U2.site.lockAll ? '켜져 있음 — 이전 뒤에도 읽기만' : '');
    add('blocked', '이 기기에서 막은 쓰기', true, false, (U2.guard ? U2.guard.blocked.length : 0) + '번');
    M.last = { at: U2.now(), rows: out }; return out;
  };
  M.ready = (rows) => rows.every((r) => r.ok || !r.hard);

  const log = (v) => ((U2.site.moveLog || []).concat([v])).slice(-50);
  /* ── 이전 시작(모든 기기) — 점검을 다시 돌려 막히는 줄이 없을 때만 ── */
  M.start = async () => {
    const rows = await M.checks(); if (!M.ready(rows)) { const why = rows.filter((r) => r.hard && !r.ok).map((r) => r.name); U2.toast('이전 못 함 — ' + why.join(' · '), true, 6000); return false; }
    const at = U2.now(); const until = new Date(Date.now() + M.DAYS * 864e5).toISOString(); const m0 = M.cur();
    const m = { state: 'on', at, by: U2.dev(), until, to: M.toUrl(), old: M.oldUrl(), plan: m0.plan || '', rev: (m0.rev || 0) + 1, app: (U2.legacy || {}).appVer || '', ui2: U2.ver };
    U2.site.move = m; U2.site.moveLog = log({ k: 'on', at, by: m.by }); M.cache(m);
    await U2.store.set('ui2_site', 'main', { move: m, moveLog: U2.site.moveLog }, true);
    U2.toast('🚚 이전 시작 — 지금 웹앱 주소를 열면 이제 리드나우 2로 넘어갑니다(옛 화면 ' + M.DAYS + '일)'); U2.drawBar && U2.drawBar(); return true;
  };
  /* ── 한 번에 되돌리기(모든 기기) — 관리자 기기가 아니어도 됨(비상) · 새 웹앱은 곧바로 읽기만 ── */
  M.back = async () => {
    const at = U2.now(); const m0 = M.cur(); const m = Object.assign({}, m0, { state: 'back', backAt: at, backBy: U2.dev(), rev: (m0.rev || 0) + 1 });
    U2.site.move = m; U2.site.lockAll = true; if (U2.guard) U2.guard.lockAll = true; U2.site.moveLog = log({ k: 'back', at, by: m.backBy }); M.cache(m);
    await U2.store.set('ui2_site', 'main', { move: m, lockAll: true, moveLog: U2.site.moveLog }, true);
    U2.toast('↩ 되돌림 — 지금 웹앱 주소가 다시 지금 웹앱을 엽니다 · 새 웹앱은 읽기만'); U2.drawBar && U2.drawBar(); return true;
  };
  M.savePlan = async (v) => { const m = Object.assign({}, M.cur(), { plan: v || '' }); U2.site.move = m; await U2.store.set('ui2_site', 'main', { move: m }, true); };

  /* ── ☰ → 🚚 이전(단계 13) 화면 ── */
  U2.moveScreen = async () => {
    const m = M.cur(); const adm = U2.isAdmin(); const n = M.daysLeft(m);
    const st = { off: '아직 안 옮김(지금 웹앱 주소는 지금 웹앱)', on: '🚚 옮김 — 지금 웹앱 주소를 열면 리드나우 2로' + (n != null ? ' · 옛 화면 ' + n + '일 남음' : ''), back: '↩ 되돌림 — 지금 웹앱 주소는 다시 지금 웹앱' }[m.state] || m.state;
    const L = U2.panel('🚚 이전(단계 13 · 옮기기 ㉮)', `<p class="u2-hint">정범님 결정 ㉮: 지금 웹앱 주소를 열면 <b>리드나우 2로 바로</b> 넘어가고, 옛 화면은 <b>${M.DAYS}일 동안</b> <code>${esc(M.oldUrl())}</code> 에 남습니다. 아래 점검에서 ✗(막힘)가 하나라도 있으면 시작할 수 없습니다. 되돌리기는 언제든 한 번에(모든 기기 · 새 웹앱은 읽기만).</p>
      <p class="u2-banner ${m.state === 'on' ? 'u2-info' : ''}" data-mvstate><b>지금:</b> ${esc(st)}${m.at ? ` <small>(${esc(m.by || '')} · ${esc(String(m.at).slice(0, 16).replace('T', ' '))})</small>` : ''}</p>
      <div class="u2-row"><label class="u2-lab">이전 날짜·시각(정범님) <input type="datetime-local" class="u2-in" data-mvplan value="${esc((m.plan || '').slice(0, 16))}" ${adm ? '' : 'disabled'}></label><button type="button" class="u2-btn" data-mvsave ${adm ? '' : 'disabled'}>날짜 저장</button></div>
      <div class="u2-tblw"><table class="u2-tbl u2-mvchk"><thead><tr><th>이전 전 점검</th><th>결과</th><th>메모</th></tr></thead><tbody><tr><td colspan="3" class="u2-sub">점검 중…</td></tr></tbody></table></div>
      <div class="u2-row"><button type="button" class="u2-btn u2-pri" data-mvgo disabled>🚚 이전 시작(모든 기기)</button><button type="button" class="u2-btn" data-mvback ${m.state === 'on' ? '' : 'disabled'}>↩ 한 번에 되돌리기(모든 기기)</button><button type="button" class="u2-btn" data-mvre>점검 다시</button></div>
      <p class="u2-hint">바꾼 기록: ${(U2.site.moveLog || []).slice(-5).map((x) => esc(({ on: '시작', back: '되돌림' }[x.k] || x.k) + ' ' + String(x.at || '').slice(5, 16).replace('T', ' ') + ' ' + (x.by || ''))).join(' · ') || '없음'}</p>`);
    const fill = async () => {
      const rows = await M.checks(); const tb = L.querySelector('.u2-mvchk tbody'); if (!tb) return rows;
      tb.innerHTML = rows.map((r) => `<tr data-mv="${esc(r.k)}" class="${r.ok ? '' : r.hard ? 'u2-t-red' : ''}"><td>${esc(r.name)}${r.hard ? '' : ' <small class="u2-sub">(참고)</small>'}</td><td>${r.ok ? '✓' : r.hard ? '✗ 막힘' : '△'}</td><td><small>${esc(r.note)}</small></td></tr>`).join('');
      const go = L.querySelector('[data-mvgo]'); go.disabled = !(M.ready(rows) && adm && m.state !== 'on'); go.title = go.disabled ? (m.state === 'on' ? '이미 옮김' : '✗ 줄을 먼저 풀어야 함') : ''; return rows;
    };
    L.querySelector('[data-mvre]').onclick = fill;
    L.querySelector('[data-mvsave]').onclick = async () => { await M.savePlan(L.querySelector('[data-mvplan]').value); U2.toast('이전 날짜 저장'); fill(); };
    L.querySelector('[data-mvgo]').onclick = (e) => U2.twice(e.currentTarget, '모든 기기 이전 시작(옛 화면 ' + M.DAYS + '일)', async () => { if (await M.start()) { L.remove(); U2.moveScreen(); } });
    L.querySelector('[data-mvback]').onclick = (e) => U2.twice(e.currentTarget, '모든 기기 되돌리기(새 웹앱 읽기만)', async () => { await M.back(); L.remove(); U2.moveScreen(); });
    M._fill = fill(); return L;
  };
  /* ── (0.4.15 rv4 · 지금 웹앱 1.78.559 priv1 따라 들임) 🚚 주소 옮기기 — 옛 주소(jerrycson.github.io/readnow-ui2/) → 새 주소(readnow.kr/ui2/) ──
   *  까닭: 저장소를 비공개로 바꾸면 GitHub Pages가 꺼져 옛 주소가 닫힘 · 기기 저장(localStorage)은 주소(출처)마다 따로라 새 주소에서 열면 이 기기 이름·설정·리드나우 2 배치가 비어 보임
   *  지금 웹앱 1.78.559의 노란 띠와 같은 약속(postMessage 'rn-move-ready' → 'rn-move'(rn로 시작하는 칸) → 'rn-move-done')을 씀 — 새 주소 쪽 '짐 받기'는 지금 웹앱 틀 안 글 그대로(리드나우 2가 새 주소에서 그 틀을 불러올 때 돎)
   *  지금 웹앱 띠는 옛 주소 리드나우 2 안에서 빼고(u2-loader.js skipT) 이 띠를 보임 — 그 띠를 누르면 리드나우 2가 아닌 지금 웹앱 새 주소로 가 버리므로
   *  저절로 옮기지 않음(사람이 누를 때만) · 브라우저 팝업 없음(새 탭은 화면 안 링크 · rel=opener) · 값은 이 기기 안 두 탭 사이에서만 오감 · 이전 상태(rn2-move)는 넘기지 않음(새 주소가 ui2_site에서 다시 셈) */
  M.ADDR_OLD = 'https://jerrycson.github.io'; M.ADDR_NEW = 'https://readnow.kr';
  M.addrOld = () => { try { return location.origin === M.ADDR_OLD; } catch (e) { return false; } };
  M.addrTo = () => { const pg = new URLSearchParams(M.q0).get('p'); return M.ADDR_NEW + '/ui2/?rnmove=1' + (pg ? '&p=' + encodeURIComponent(pg) : ''); };
  M.addrItems = () => { const it = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^rn/.test(k) && k !== 'rn2-move') it[k] = localStorage.getItem(k); } } catch (e) {} return it; };
  M.addrBar = () => {
    if (!M.addrOld() || !U2.banner || !document.getElementById('u2-banners')) return null;
    const host = document.getElementById('u2-banners'); const had = document.getElementById('u2-addr'); if (had) { if (host.firstChild !== had) host.insertBefore(had, host.firstChild); return had; } /* 시범 띠보다 늘 위 */
    const was = U2.ls.get('addrMoved', null);
    const b = U2.banner('u2-addr', `<b>🚚 리드나우 2 주소가 <u>readnow.kr/ui2/</u> 로 옮겨 갑니다</b> <span class="u2-sub">(이 옛 주소는 저장소 비공개 뒤 닫힘)</span> <a class="u2-btn u2-pri" data-addr href="${esc(M.addrTo())}" target="_blank" rel="opener">이 기기 설정 가지고 새 주소로</a> <small data-addr-msg>${was ? '이미 한 번 옮겼습니다(' + esc(String(was.at || '').slice(5, 16).replace('T', ' ')) + ' · ' + (+was.n || 0) + '칸) — 새 주소를 쓰세요' : '한 번만 누르면 이 기기 이름·설정·리드나우 2 배치를 그대로 가져갑니다(새 주소에서 구글 로그인은 한 번 다시)'}</small>`, 'u2-warn u2-addr');
    const msg = (t) => { const m = b.querySelector('[data-addr-msg]'); if (m) m.textContent = t; };
    let tm = 0;
    b.querySelector('[data-addr]').addEventListener('click', () => { msg('새 탭에 옮기는 중… (새 탭에서 리드나우 2가 다 열리면 저절로 끝남)'); clearTimeout(tm);
      tm = setTimeout(() => msg('새 탭이 답하지 않음 — 새 탭에서 리드나우 2가 다 열린 뒤(⏳ 불러오는 중 띠가 사라진 뒤) 이 단추를 한 번 더 누르세요'), 90e3); });
    if (!M._addrL) { M._addrL = true; window.addEventListener('message', (e) => { if (e.origin !== M.ADDR_NEW || !e.data) return;
      if (e.data.t === 'rn-move-ready') { try { e.source.postMessage({ t: 'rn-move', items: M.addrItems() }, M.ADDR_NEW); } catch (x) {} }
      if (e.data.t === 'rn-move-done') { clearTimeout(tm); const n = +e.data.n || 0; U2.ls.set('addrMoved', { at: new Date().toISOString(), n }); msg('✅ ' + n + '칸 옮김 — 이제 새 탭(readnow.kr/ui2/)을 쓰고, 북마크도 새 주소로 바꾸세요. 이 탭은 닫아도 됩니다.'); } }); }
    if (host.firstChild !== b) host.insertBefore(b, host.firstChild);
    return b;
  };
})();

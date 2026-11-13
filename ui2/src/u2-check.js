/* 리드나우 2 — ✅ 단계 12 시범 체크리스트(정범님이 직접 써 보는 줄 · STEP12.md 체크리스트 표와 같은 줄 — 고치면 둘 다)
 * 여는 길: 맨 위 시범 띠 '✅ 체크리스트 열기' · ☰ 메뉴 '✅ 시범 체크리스트' · 주소 ?check=1
 * 줄마다 ✓ 통과 / ✕ 안 됨 / 메모 → 기기 저장(rn2-check12) + Firestore ui2_checks/<기기>(kind 'step12' · 리드가 읽음)
 * 실제 자료는 건드리지 않음(ui2_ 칸만) · 브라우저 팝업 없음 */
(function () {
  'use strict';
  const U2 = (window.U2 = window.U2 || {});
  const esc = (s) => U2.esc(s);
  const APP = 'https://readnow.kr/app/'; /* (0.4.14 priv1) 저장소 비공개 준비 — readnow.kr */
  const SITE = 'https://readnow.kr/ui2/';
  const MD = 'https://github.com/jerrycson/readnow-ui2/blob/main/STEP12.md';
  /* go: { p: 페이지 } 이 웹앱 페이지로 · { url } 새 탭 · { fn: 'menu'|'watch'|'track'|'edit'|'perm' } 그 화면을 엶 */
  U2.CHECK12 = [
    { n: 1, where: '시범 주소', go: [{ copy: SITE, t: '📋 주소 복사' }],
      act: '관리자 PC(JS-MAIN) 크롬에서 <code>' + SITE + '</code> 를 엶',
      pass: '맨 위 띠 <b>🔒 리드나우 2 시범 중 — 읽기만</b>(오른쪽에 ✅ 체크리스트 열기 단추) · 머리줄 왼쪽 <b>리드나우 2 시범 0.4.x</b> · 노란 <b>⚠ 안전 모드</b> 띠가 없음 · 머리줄에 <b>⚠ 다른 리드나우 탭도 열려 있음</b> 표가 없음' },
    { n: 2, where: '☰ 메뉴 맨 아래', go: [{ fn: 'menu', t: '☰ 메뉴 열기' }],
      act: '머리줄 오른쪽 끝 <b>☰</b> → 메뉴 맨 아래 회색 한 줄을 읽음',
      pass: '<b>이 기기: JS-MAIN · 관리자 기기(공용 배치 게시 가능) · 지금 웹앱 1.78.45x · 새 웹앱 0.4.x</b> (지금 웹앱 숫자 = 지금 웹앱 화면 아래 판 번호와 같음)' },
    { n: 3, where: '🏠 홈 페이지', go: [{ p: 'home', t: '🏠 홈으로' }, { url: APP, t: '지금 웹앱 홈(새 탭)' }],
      act: '새 웹앱 🏠 홈과 지금 웹앱 홈을 나란히 놓고 견줌(견준 뒤 지금 웹앱 탭은 닫기)',
      pass: '같은 칸·같은 숫자 · 특히 <b>매출 페이스</b> 칸의 막대와 기간 단추(1주~전체)가 몇 초 안에 채워짐(‘주문 기록을 받는 중’에 머물면 ✕)' },
    { n: 4, where: '머리줄 아래 페이지 줄', go: [{ p: 'search', t: '👤 고객부터' }],
      act: '<b>🏠 홈 · 👤 고객 · 📚 상품 · 🧑‍💼 판매자 · 🧾 주문·매출 · 🛒 매입 · 💹 경영 · 🌐 시장조사 · 🧪 프로젝트 · ⚙ 설정 · 📥 할 일</b>(11개)을 차례로 누르고, 브라우저 ← 뒤로 가기',
      pass: '페이지마다 <b>다른</b> 화면 · 등록 화면이 모든 페이지를 덮지 않음 · 주소 끝이 <code>?p=home</code>·<code>?p=search</code>…<code>?p=inbox</code>로 바뀜 · 뒤로 가기로 앞 페이지' },
    { n: 5, where: '📚 상품 페이지 맨 위', go: [{ p: 'products', t: '📚 상품으로' }, { p: 'orders', t: '🧾 주문·매출로' }],
      act: '📚 상품 맨 위 <b>📥 등록</b> 단추(또는 🧾 주문·매출 맨 위 <b>○월 ○일(요일)의 출고</b> 카드)를 누름 → 가운데 세로 손잡이를 끎 → 페이지 줄에서 다른 페이지 → 옛 화면 위 <b>✕ 닫기</b>·Esc·← 뒤로 가기',
      pass: '옛 화면이 오른쪽에 <b>나란히</b> 뜸 · 손잡이를 끌면 폭이 바뀜 · 다른 페이지로 가도 옛 화면이 <b>남아 있음</b> · ✕ 닫기·Esc·뒤로 가기 셋 다 닫힘' },
    { n: 6, where: '옛 등록 화면 안', go: [{ p: 'products', t: '📚 상품으로' }, { fn: 'watch', t: '🩺 충돌 감시 보기' }],
      act: '5번처럼 연 📥 등록 화면에서 저장·등록 단추 하나를 누름 → ☰ → <b>🩺 충돌 감시 보기</b>',
      pass: '화면 아래 알림 <b>🔒 시범 중 — 이 일은 지금 웹앱에서 해 주세요</b> · 지금 웹앱에서 보면 <b>실제 자료가 안 바뀜</b> · 충돌 감시 표의 <b>막은 쓰기</b> 숫자가 늘어남' },
    { n: 7, where: '✏ 꾸미기(이 기기만)', go: [{ fn: 'edit', t: '✏ 이 기기만 꾸미기' }],
      act: '머리줄 <b>✏ 꾸미기</b> → 편집기 위 <b>📱 이 기기만</b> → 칸 하나를 끌어 옮김 → 오른쪽 위 <b>💾 이 기기에 저장</b>을 두 번(‘한 번 더 누르면 …’이 뜨면 한 번 더) → <b>◀ 보기로</b> → F5 새로 고침 → ☰ → <b>↩ 이 페이지 개인 배치 끄고 공용으로</b>(두 번)',
      pass: '새로 고침 뒤에도 옮긴 자리 그대로 · 머리줄에 <b>📱 이 기기 배치</b> 표 · 되돌리면 원래 모습 · 저장할 때 빨간 오류 알림이 없음(= Firebase <code>ui2_*</code> 칸 쓰기 규칙 확인 · 오류가 나면 그 글을 메모에)' },
    { n: 8, where: '📥 할 일 페이지', go: [{ p: 'inbox', t: '📥 할 일로' }],
      act: '<b>📥 할 일 받은편지함</b> 칸과 오른쪽 <b>오늘 확인할 것(지금 웹앱 홈 칸)</b> 칸을 봄 · 줄 하나를 눌러 봄',
      pass: '연결 확정 기다림·받은 문의·이 기기에서 막은 쓰기·따라잡기 할 일·계약이 깨진 옛 기능이 줄로 보임(0이 아니면 빨강) · 누르면 그 화면으로 감' },
    { n: 9, where: '휴대폰(JS-PHONE)', go: [{ copy: SITE + '?check=1', t: '📋 휴대폰에 보낼 주소 복사' }],
      act: '휴대폰 크롬으로 같은 시범 주소 → 페이지 몇 개 → 📚 상품 📥 등록을 열고 페이지를 바꿈 → ✏ 꾸미기에서 칸을 길게 눌러 끎',
      pass: '좁은 배치(4칸) · 옛 화면은 접히고 아래 <b>▸ 펼치기</b>로 다시 · 칸을 길게 누르면 끌림(꾸미기)' },
    { n: 10, where: '다른 PC(MJ-MAIN·HOME 등)', go: [{ copy: SITE + '?check=1', t: '📋 그 PC에 보낼 주소 복사' }],
      act: '<b>출고하지 않을 때만</b> · 지금 웹앱 탭은 닫지 말고 새 탭에서 시범 주소 → 1·2·4번만(로거 PC는 빼기)',
      pass: '1·2·4번과 같음(PC마다 5분) · 이때는 <b>⚠ 다른 리드나우 탭도 열려 있음</b> 표가 떠도 통과' },
    { n: 11, where: '☰ → 🔁 따라잡기 표', go: [{ fn: 'track', t: '🔁 따라잡기 표 열기' }],
      act: '☰ → <b>🔁 따라잡기 표</b> → 맨 위 회색 글과 첫 몇 줄',
      pass: '맨 위 글에 <b>❌ 계약 깨짐 0</b> · 지금 웹앱 최근 판(1.78.45x)이 줄로 있음' },
  ];
  const N = U2.CHECK12.length;
  const pad = (x) => String(x).padStart(2, '0');
  const hm = (iso, day) => { const d = new Date(iso); return isNaN(d) ? '' : (day ? d.getMonth() + 1 + '/' + d.getDate() + ' ' : '') + pad(d.getHours()) + ':' + pad(d.getMinutes()); }; /* 기기 시각(한국)으로 */
  const KEY = 'check12';
  const load = () => { const s = U2.ls.get(KEY, null); return s && s.rows ? s : { rows: {} }; };
  U2.check = {
    st: load(),
    sum() { const r = Object.values(this.st.rows || {}); return { ok: r.filter((x) => x.s === 'ok').length, no: r.filter((x) => x.s === 'no').length, total: N }; },
    set(n, patch) { const r = (this.st.rows[n] = Object.assign({ s: '', m: '' }, this.st.rows[n], patch, { at: U2.now() })); if (!r.s && !r.m) delete this.st.rows[n]; U2.ls.set(KEY, this.st); this.push(); U2.pilotBar(); },
    /* Firestore ui2_checks/<기기> — 1.5초 모아 한 번(메모 칠 때 글자마다 쓰지 않음) */
    push() { clearTimeout(this._h); this._h = setTimeout(() => this.flush(), 1500); },
    async flush() {
      clearTimeout(this._h); const s = this.sum();
      const doc = { kind: 'step12', dev: U2.dev(), ver: U2.ver, app: (U2.legacy && U2.legacy.appVer) || '', at: U2.now(), ok: s.ok, no: s.no, total: s.total, rows: this.st.rows };
      let ok = false; try { ok = await U2.store.set('ui2_checks', U2.devKey(), doc); } catch (e) { ok = false; }
      this.sentAt = ok && U2.store.fs() && U2.authed ? U2.now() : null; this.sendErr = !ok;
      const o = document.querySelector('.u2-ck [data-ck-sent]'); if (o) o.innerHTML = this.sentHtml();
      return ok;
    },
    sentHtml() { return this.sendErr ? '<b class="u2-t-red">⚠ 리드나우 서버에 올리지 못함 — 이 기기에는 저장됨</b>' : this.sentAt ? '☁ 리드에게 올림 ' + esc(hm(this.sentAt)) : '이 기기에 저장됨(로그인되면 리드에게 올림)'; },
  };
  const H = (s) => s; /* 줄 글은 위 표에서 직접 쓴 HTML(손님 자료 없음) */
  U2.checkScreen = (focus) => {
    const C = U2.check; const s = C.sum();
    const goBtn = (g, i, n) => `<button type="button" class="u2-btn" data-ck-go="${n}:${i}">${esc(g.t)}${g.url ? ' ↗' : ''}</button>`;
    const row = (r) => { const v = C.st.rows[r.n] || {}; return `<div class="u2-ck-row ${v.s ? 'u2-ck-' + v.s : ''}" data-ck="${r.n}">
      <div class="u2-ck-h"><b class="u2-ck-n">${r.n}</b><b>${esc(r.where)}</b><span class="u2-sp"></span>${r.go.map((g, i) => goBtn(g, i, r.n)).join('')}</div>
      <div><span class="u2-sub">무엇을</span> ${H(r.act)}</div><div><span class="u2-sub">통과</span> ${H(r.pass)}</div>
      <div class="u2-row"><button type="button" class="u2-btn ${v.s === 'ok' ? 'u2-pri' : ''}" data-ck-s="ok" aria-pressed="${v.s === 'ok'}">✓ 통과</button><button type="button" class="u2-btn ${v.s === 'no' ? 'u2-pri u2-ck-nob' : ''}" data-ck-s="no" aria-pressed="${v.s === 'no'}">✕ 안 됨</button>
        <input class="u2-in u2-ck-memo" data-ck-m placeholder="메모(안 됐으면 무엇이 보였는지)" aria-label="${r.n}번 메모" value="${esc(v.m || '')}">${v.at ? `<span class="u2-sub">${esc(hm(v.at, 1))}</span>` : ''}</div></div>`; };
    const L = U2.panel('✅ 시범 체크리스트 (단계 12)', `<div class="u2-ck">
      <p class="u2-hint">정범님이 직접 한 줄씩(다 해도 약 30분) — 각 줄의 단추가 그 자리로 데려갑니다. 끝나면 맨 위 띠 <b>✅ 체크리스트 열기</b>로 돌아와 ✓ 통과 / ✕ 안 됨을 누르세요. 처음 1주는 <b>읽기만</b>(무엇을 눌러도 주문·상품·가격이 바뀌지 않음). 같은 표: <a class="u2-link" href="${esc(MD)}" target="_blank" rel="noopener">STEP12.md ↗</a></p>
      <div class="u2-row"><b data-ck-sum>✓ ${s.ok} · ✕ ${s.no} · 남음 ${N - s.ok - s.no} / ${N}</b><span class="u2-sub" data-ck-sent>${C.sentHtml()}</span></div>
      <p class="u2-hint">준비: 관리자 PC(JS-MAIN) 크롬 — 지금 웹앱에 로그인된 그 브라우저 그대로(로그인·기기 이름이 이어짐). 다른 리드나우 탭은 닫기(두 웹앱을 함께 열면 메모리 2배). 출고 중인 PC에서는 하지 않기.</p>
      ${U2.CHECK12.map(row).join('')}
      <div class="u2-sec"><b>2주째(쓰기 허락 — 정범님만)</b><p class="u2-hint">☰ → 🔒 쓰기 허락 → 위젯 <b>하나만</b> 켬(두 번 누름) → 실제로 한 건 써 봄 → 지금 웹앱에서 같은 결과인지 봄. 이상하면 같은 화면 <b>비상: 허락한 것까지 모두 막기</b>(곧바로 읽기만).</p></div>
      <div class="u2-sec"><b>문제가 생기면</b><p class="u2-hint">그 줄 메모에 무엇이 보였는지 적고 ✕ 안 됨 → 리드나우 방에 “체크리스트 n번 안 됨” 한 줄(메모는 리드가 바로 봄). 언제든 ☰ → <b>↩ 지금 웹앱으로 가기</b> — 지금 웹앱은 그대로이므로 일은 이어집니다.</p></div>
      <div class="u2-sec"><b>모든 기기 결과</b> <button type="button" class="u2-btn" data-ck-all>다른 기기 결과 보기</button><div data-ck-allout></div></div></div>`, 'u2-ckp');
    const sum = () => { const t = C.sum(); const o = L.querySelector('[data-ck-sum]'); if (o) o.textContent = `✓ ${t.ok} · ✕ ${t.no} · 남음 ${N - t.ok - t.no} / ${N}`; };
    L.querySelectorAll('[data-ck]').forEach((el) => {
      const n = +el.dataset.ck;
      el.querySelectorAll('[data-ck-s]').forEach((b) => (b.onclick = () => { const cur = (C.st.rows[n] || {}).s; const v = cur === b.dataset.ckS ? '' : b.dataset.ckS; C.set(n, { s: v });
        el.className = 'u2-ck-row ' + (v ? 'u2-ck-' + v : ''); el.querySelectorAll('[data-ck-s]').forEach((x) => { const on = x.dataset.ckS === v; x.classList.toggle('u2-pri', on); x.classList.toggle('u2-ck-nob', on && v === 'no'); x.setAttribute('aria-pressed', on); }); sum(); }));
      const m = el.querySelector('[data-ck-m]'); m.oninput = () => C.set(n, { m: m.value.slice(0, 500) });
    });
    L.querySelectorAll('[data-ck-go]').forEach((b) => (b.onclick = () => {
      const [n, i] = b.dataset.ckGo.split(':').map(Number); const g = U2.CHECK12.find((r) => r.n === n).go[i]; U2.check.doing = n; U2.pilotBar();
      if (g.copy) { const t = () => U2.toast('주소를 복사했습니다: ' + g.copy); try { navigator.clipboard.writeText(g.copy).then(t, () => U2.toast(g.copy, 0, 8000)); } catch (e) { U2.toast(g.copy, 0, 8000); } return; }
      if (g.url) { const a = document.createElement('a'); a.href = g.url; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); return; }
      L.remove();
      if (g.p) return U2.go(g.p);
      if (g.fn === 'menu') return U2.menu();
      if (g.fn === 'watch') return U2.watchScreen();
      if (g.fn === 'track') return U2.trackScreen();
      if (g.fn === 'perm') return U2.permScreen();
      if (g.fn === 'edit') return U2.openEditor && U2.openEditor('mine');
    }));
    L.querySelector('[data-ck-all]').onclick = async () => {
      const out = L.querySelector('[data-ck-allout]'); out.innerHTML = '<p class="u2-hint">⏳ 받는 중…</p>';
      const list = await U2.store.where('ui2_checks', 'kind', 'step12');
      out.innerHTML = list.length ? `<div class="u2-tblw"><table class="u2-tbl"><thead><tr><th>기기</th><th>✓</th><th>✕</th><th>새 웹앱</th><th>마지막</th><th>안 된 줄</th></tr></thead><tbody>${list.map((d) => `<tr><td>${esc(d.dev || d._id)}</td><td>${+d.ok || 0}</td><td>${+d.no || 0}</td><td>${esc(d.ver || '')}</td><td>${esc(hm(d.at, 1))}</td><td>${Object.entries(d.rows || {}).filter(([, v]) => v && v.s === 'no').map(([k, v]) => esc(k + '번' + (v.m ? ' ' + v.m : ''))).join(' · ') || '-'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="u2-hint">아직 올린 기기가 없음</p>';
    };
    if (focus) { const el = L.querySelector('[data-ck="' + focus + '"]'); if (el) { el.classList.add('u2-ck-focus'); setTimeout(() => el.scrollIntoView({ block: 'center' }), 50); } }
    return L;
  };
  /* 맨 위 시범 띠(늘 보임 · 한 줄): 읽기만 상태 + 체크리스트 진행 + '체크리스트 열기' */
  U2.pilotBar = () => {
    if (!U2.banner || !document.getElementById('u2-banners')) return;
    const G = U2.guard || {}; const some = Object.values(G.writeOk || {}).some((x) => x && x.on);
    const mode = G.lockAll ? '🔒 리드나우 2 시범 중 — 모두 막음' : some ? '🔓 리드나우 2 시범 중 — 정범님이 켠 위젯만 쓰기' : '🔒 리드나우 2 시범 중 — 읽기만';
    const s = U2.check.sum(); const left = N - s.ok - s.no;
    const b = U2.banner('u2-pilot', `<span class="u2-pilott">${mode}</span> <span class="u2-sub">✅ 체크리스트 ${s.ok}/${N} 통과${s.no ? ' · ✕ ' + s.no + ' 안 됨' : ''}${left && U2.check.doing ? ' · 지금 ' + U2.check.doing + '번' : ''}</span> <button type="button" class="u2-btn u2-pri" data-ck-open>✅ 체크리스트 열기</button>`, 'u2-info u2-pilot');
    const host = document.getElementById('u2-banners'); if (b && host.firstChild !== b) host.insertBefore(b, host.firstChild);
    b.querySelector('[data-ck-open]').onclick = () => U2.checkScreen(U2.check.doing);
  };
  /* 주소 ?check=1 이면 첫 화면 뒤 체크리스트를 바로 엶 */
  try { if (/[?&]check=1\b/.test(location.search)) { let done = false; const go = () => { if (done || !U2.panel) return; done = true; U2.checkScreen(); }; const wait = () => (U2.on ? (U2.on('legacyLoaded', () => setTimeout(go, 300)), U2.on('safe', () => setTimeout(go, 300))) : null); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wait); else wait(); setTimeout(go, 8000); } } catch (e) {}
})();

/* readnow-pc-helper.js — 리드나우 수집기 1.45.0의 모듈 ⑥ 화면 도우미 — 고객 응대 문구
 * Tampermonkey의 '리드나우 수집기' 본체가 @require로 불러옴 (이 파일만 따로 설치하지 않음). 본체와 판이 같아야 함 — 다르면 관제판에 빨간 띠.
 * 원본 한 파일에서 기계로 나눈 것: 모듈을 차례로 이으면 원본 코드와 글자 하나까지 같음 (같은 코드 = 같은 기록). */
;(function (g) { g.ReadnowPcMods = Object.assign(g.ReadnowPcMods || {}, { helper: '1.45.0' }); })(typeof globalThis !== 'undefined' ? globalThis : this);
/* ══════════ 고객 응대 문구 도우미 (1.34.0): 묻고 답하기 답변 입력 화면 · 구매평 목록 ══════════
 * 세 칸: ① 인사말 ② 내용 ③ 마무리. 문구를 누르면 답변 칸(지금 커서 자리, 없으면 맨 끝)에 한 줄로 들어감. 순서대로 누르면 답변 완성.
 * 칸마다 문구 고치기·지우기·끌어서 순서 바꾸기·새로 넣기. 문구는 Firebase(app_settings/qna_phrases) 한 곳에 두고 모든 PC·웹앱(⚙ 설정)이 같이 씀 — 이 PC에도 사본을 둬서 바로 뜸.
 * 답변 칸: 묻고 답하기 = #txtAnswer, 그 밖의 화면 = 마지막으로 누른 입력칸(textarea). 알라딘 '등록' 단추는 사람이 직접 누름 (자동으로 보내지 않음). */
(function rnPhraseHelper() {
  if (window.top !== window || !/\/scm\/(wUsedShopC2C|wShopSurvey)/i.test(location.pathname)) return;
  const DEF = {
    greet: ['안녕하세요? 반갑습니다!', '안녕하세요, 북스킹입니다. 문의 주셔서 진심으로 감사드립니다.', '안녕하세요, 고객님. 저희 상품에 관심 가져 주셔서 감사합니다.', '안녕하세요, 고객님. 답변이 늦어 죄송합니다.', '안녕하세요, 북스킹입니다. 기다려 주셔서 감사합니다.', '안녕하세요, 고객님. 소중한 구매평 남겨 주셔서 진심으로 감사드립니다.'],
    body: ['문의하신 상품은 현재 재고가 있어 바로 구매하실 수 있습니다.', '확인해 보니 문의하신 상품은 아쉽게도 현재 품절되었습니다.', '상품 상태는 등록된 등급과 상품 설명에 적힌 내용과 같습니다.', '직접 확인한 결과 말씀하신 부분(낙서·밑줄·변색 등)은 없으며 상태 양호합니다.', '확인 결과 일부 사용감이 있어 상품 설명에 자세히 적어 두었습니다.', '영업일 오후 2시까지 주문하시면 당일 출고를 원칙으로 하고 있습니다.', '택배는 롯데택배로 보내 드리며, 출고 후 송장번호로 배송 조회가 가능합니다.', '저희(북스킹) 상품끼리는 한 상자에 묶어 보내 드립니다.', '주문 취소는 출고 전까지 알라딘 주문 내역에서 바로 하실 수 있습니다.', '반품·교환은 상품을 받으신 날로부터 7일 안에 신청하실 수 있습니다.', '불편을 드려 대단히 죄송합니다. 확인하는 대로 신속하게 처리해 드리겠습니다.', '말씀해 주신 의견은 상품 검수에 꼭 반영하겠습니다.', '만족스러운 거래가 되셨다니 저희도 정말 기쁩니다.'],
    close: ['오늘도 좋은 하루 보내세요!', '또 궁금하신 점 있으면 언제든 편하게 문의주세요!', '감사합니다.', '북스킹을 이용해 주셔서 감사합니다.', '앞으로도 더 좋은 상품과 서비스로 보답하겠습니다.', '다시 한번 불편을 드려 죄송합니다.', '즐거운 독서 되세요!'] };
  const PARTS = [['greet', '① 인사말'], ['body', '② 내용'], ['close', '③ 마무리']];
  const LKEY = 'rn-phrases'; let P = null; try { P = GM_getValue(LKEY, null); } catch (e) {}
  const okP = (x) => x && PARTS.every(([k]) => Array.isArray(x[k]));
  if (!okP(P)) P = JSON.parse(JSON.stringify(DEF));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // ── 답변 칸 찾기: 묻고 답하기 = #txtAnswer, 그 밖 = 마지막으로 누른 textarea
  let lastTa = null; document.addEventListener('focusin', (e) => { if (e.target && e.target.tagName === 'TEXTAREA' && !e.target.closest('#rn-ph')) lastTa = e.target; }, true);
  document.addEventListener('focusout', (e) => { const t = e.target; if (t && t.tagName === 'TEXTAREA' && !t.closest('#rn-ph')) { t._rnPos = t.selectionStart; t._rnEnd = t.selectionEnd; } }, true); // 커서 자리 기억 (문구를 누르는 순간 입력칸에서 커서가 빠져도 그 자리에 넣음)
  const target = () => (lastTa && document.contains(lastTa) ? lastTa : null) || document.querySelector('#txtAnswer') || [...document.querySelectorAll('textarea')].find((t) => !t.closest('#rn-ph') && t.getClientRects().length) || null;
  function insert(text) { const ta = target(); if (!ta) { flash('답변 입력칸을 찾지 못했습니다 — 입력칸을 한 번 누른 뒤 문구를 누르세요'); return; }
    const v = ta.value; const act = document.activeElement === ta; const s = Math.min(v.length, act ? ta.selectionStart : ta._rnPos ?? v.length); const e2 = Math.min(v.length, Math.max(s, act ? ta.selectionEnd : ta._rnEnd ?? s));
    const before = v.slice(0, s), after = v.slice(e2); const pre = before && !/\n$/.test(before) ? '\n' : ''; const post = after && !/^\n/.test(after) ? '\n' : '';
    ta.value = before + pre + text + post + after; const pos = (before + pre + text).length; ta._rnPos = ta._rnEnd = pos + post.length;
    ta.dispatchEvent(new Event('input', { bubbles: true })); ta.dispatchEvent(new Event('change', { bubbles: true })); try { ta.focus(); ta.setSelectionRange(ta._rnPos, ta._rnPos); } catch (e) {} flash(''); }
  // ── 저장: 이 PC 사본(GM) + Firebase 한 곳
  let fs = null, user = null;
  const saveAll = () => { try { GM_setValue(LKEY, P); } catch (e) {} if (fs && user) fs.collection('app_settings').doc('qna_phrases').set({ ...P, at: new Date().toISOString(), by: user.email || '', from: 'collector' }).catch((e) => flash('Firebase 저장 실패 (이 PC에만 저장됨): ' + (e.code || e.message))); };
  try { if (window.firebase) { if (!firebase.apps.length) firebase.initializeApp({ apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385', storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15' });
    fs = firebase.firestore(); firebase.auth().onAuthStateChanged((u) => { user = u; if (!u) return; fs.collection('app_settings').doc('qna_phrases').onSnapshot((d) => { if (!d.exists) { saveAll(); return; } const x = d.data(); if (okP(x)) { P = { greet: x.greet, body: x.body, close: x.close }; try { GM_setValue(LKEY, P); } catch (e) {} draw(); } }, () => {}); }); } } catch (e) {}
  // ── 화면
  const st = document.createElement('style'); st.textContent = `#rn-ph{position:fixed;right:14px;top:90px;z-index:2147483640;width:340px;max-height:calc(100vh - 110px);display:flex;flex-direction:column;background:#fff;border:1px solid #2F5D50;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.18);font:12.5px/1.45 system-ui,'Malgun Gothic',sans-serif;color:#1E2B27}
  #rn-ph .hd{display:flex;align-items:center;gap:6px;padding:7px 10px;background:#2F5D50;color:#fff;border-radius:9px 9px 0 0;cursor:move;user-select:none} #rn-ph .hd b{flex:1} #rn-ph .hd button{border:0;border-radius:5px;background:#24493F;color:#fff;padding:2px 8px;cursor:pointer}
  #rn-ph .bd{overflow:auto;padding:6px 8px} #rn-ph.min .bd{display:none} #rn-ph h4{margin:8px 0 3px;font-size:12.5px;color:#2F5D50;display:flex;justify-content:space-between} #rn-ph h4 small{font-weight:400;color:#8A9692}
  #rn-ph .ls{max-height:130px;overflow-y:auto;border:1px solid #D7E2DD;border-radius:6px;padding:2px} #rn-ph .it{display:flex;align-items:center;gap:4px;padding:3px 5px;border-bottom:1px dashed #EEF2F0;cursor:grab} #rn-ph .it:hover{background:#EEF6F2}
  #rn-ph .it .tx{flex:1;cursor:pointer} #rn-ph .it .ed,#rn-ph .it .dl{font-size:11px;cursor:pointer;padding:0 3px} #rn-ph .it .ed{color:#1F5FAF} #rn-ph .it .dl{color:#B0322A} #rn-ph .it.over{box-shadow:inset 0 3px 0 #2F5D50} #rn-ph .it.under{box-shadow:inset 0 -3px 0 #2F5D50} #rn-ph .it.dragging{opacity:.45} #rn-ph .dh{cursor:grab;color:#8A9692;padding:0 3px 0 0;touch-action:none;user-select:none;font-size:13px} #rn-ph .it{cursor:default}
  #rn-ph .it input{flex:1;border:1px solid #2F5D50;border-radius:4px;padding:2px 4px;font:inherit} #rn-ph .ad{display:flex;gap:4px;margin-top:3px} #rn-ph .ad input{flex:1;border:1px solid #C9D6D0;border-radius:5px;padding:3px 6px;font:inherit} #rn-ph .ad button,#rn-ph .ft button{border:0;border-radius:5px;background:#2F5D50;color:#fff;padding:3px 9px;cursor:pointer;font:inherit}
  #rn-ph .ft{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px} #rn-ph .ft button.g{background:#EEF2F0;color:#2F5D50} #rn-ph .msg{color:#A8661B;font-size:11.5px;min-height:14px;margin-top:4px}`;
  document.head.appendChild(st);
  const box = document.createElement('div'); box.id = 'rn-ph'; if (GM_getValue('rn-ph-min', 0)) box.classList.add('min');
  let msgT = null; function flash(t) { const m = box.querySelector('.msg'); if (!m) return; m.textContent = t; clearTimeout(msgT); if (t) msgT = setTimeout(() => (m.textContent = ''), 6000); }
  let drag = null;
  function draw() { const open = !box.classList.contains('min');
    box.innerHTML = `<div class="hd"><b>✍ 고객 응대 문구</b><button data-a="min">${open ? '접기' : '펼치기'}</button></div><div class="bd">
      <div class="hint" style="color:#5B6B66">누르면 답변 칸에 한 줄로 들어감 (① → ② → ③ 차례로) · 왼쪽 ⠿ 를 잡고 위아래로 끌면 순서 바꿈 · 모든 PC·웹앱 공유</div>
      ${PARTS.map(([k, l]) => `<h4>${l} <small>${P[k].length}개</small></h4><div class="ls" data-k="${k}">${P[k].map((t, i) => `<div class="it" data-k="${k}" data-i="${i}"><span class="dh" title="잡고 위아래로 끌어 순서 바꾸기">⠿</span><span class="tx" title="누르면 답변 칸에 넣기">${esc(t)}</span><span class="ed">수정</span><span class="dl">삭제</span></div>`).join('') || '<div class="it"><i style="color:#8A9692">문구 없음 — 아래에 넣기</i></div>'}</div>
        <div class="ad"><input data-new="${k}" placeholder="새 ${l.slice(2)} 문구"><button data-add="${k}">넣기</button></div>`).join('')}
      <div class="ft"><button class="g" data-a="clear" title="답변 칸 비우기">답변 칸 비우기</button><button class="g" data-a="reset" title="기본 문구를 빠진 것만 다시 넣음 (지금 문구는 그대로)">기본 문구 다시 넣기</button></div><div class="msg"></div></div>`;
    box.querySelectorAll('.it[data-i]').forEach((el) => { const k = el.dataset.k, i = +el.dataset.i;
      el.querySelector('.tx').onmousedown = (ev) => ev.preventDefault(); // 입력칸의 커서를 빼앗지 않음
      el.querySelector('.tx').onclick = () => insert(P[k][i]);
      el.querySelector('.dl').onclick = (ev) => { ev.stopPropagation(); if (!confirm(`이 문구를 지울까요?\n\n${P[k][i]}`)) return; P[k].splice(i, 1); saveAll(); draw(); };
      el.querySelector('.ed').onclick = (ev) => { ev.stopPropagation(); el.innerHTML = `<input value="${esc(P[k][i])}"><span class="ed">저장</span><span class="dl">취소</span>`; const inp = el.querySelector('input'); inp.focus(); inp.select();
        const ok = () => { const v = inp.value.trim(); if (v) { P[k][i] = v; saveAll(); } draw(); }; el.querySelector('.ed').onclick = ok; el.querySelector('.dl').onclick = () => draw(); inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); ok(); } if (e.key === 'Escape') draw(); }; };
      // (1.34.3) 왼쪽 ⠿ 를 잡고 위아래로 끌면 순서가 바뀜 (마우스·터치 모두) — 놓는 자리에 초록 줄이 보임
      const dh = el.querySelector('.dh'); if (dh) dh.onpointerdown = (e) => { e.preventDefault(); const list = el.parentElement; const rows = () => [...list.querySelectorAll('.it[data-i]')]; el.classList.add('dragging'); try { dh.setPointerCapture(e.pointerId); } catch (x) {} let to = i;
        const mv = (ev) => { const R = rows(); R.forEach((r) => r.classList.remove('over', 'under')); let tgt = R.length - 1; for (let j = 0; j < R.length; j++) { const b = R[j].getBoundingClientRect(); if (ev.clientY < b.top + b.height / 2) { tgt = j; break; } tgt = j + 1; }
          to = tgt; if (to < R.length) R[to].classList.add('over'); else R[R.length - 1].classList.add('under'); const lb = list.getBoundingClientRect(); if (ev.clientY < lb.top + 14) list.scrollTop -= 8; else if (ev.clientY > lb.bottom - 14) list.scrollTop += 8; };
        const up = () => { dh.removeEventListener('pointermove', mv); dh.removeEventListener('pointerup', up); dh.removeEventListener('pointercancel', up); el.classList.remove('dragging'); rows().forEach((r) => r.classList.remove('over', 'under'));
          let dst = to > i ? to - 1 : to; if (dst !== i && dst >= 0) { const [m] = P[k].splice(i, 1); P[k].splice(dst, 0, m); saveAll(); } draw(); };
        dh.addEventListener('pointermove', mv); dh.addEventListener('pointerup', up); dh.addEventListener('pointercancel', up); }; });
    box.querySelectorAll('[data-add]').forEach((b) => (b.onclick = () => { const k = b.dataset.add; const inp = box.querySelector(`[data-new="${k}"]`); const v = inp.value.trim(); if (!v) return; P[k].push(v); saveAll(); draw(); }));
    box.querySelectorAll('[data-new]').forEach((inp) => (inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); box.querySelector(`[data-add="${inp.dataset.new}"]`).click(); } }));
    box.querySelector('[data-a="min"]').onclick = () => { box.classList.toggle('min'); GM_setValue('rn-ph-min', box.classList.contains('min') ? 1 : 0); draw(); };
    const cl = box.querySelector('[data-a="clear"]'); if (cl) cl.onclick = () => { const ta = target(); if (!ta) return flash('답변 입력칸을 찾지 못했습니다'); if (ta.value && !confirm('답변 칸의 글을 모두 지울까요?')) return; ta.value = ''; ta._rnPos = 0; ta.dispatchEvent(new Event('input', { bubbles: true })); };
    const rs = box.querySelector('[data-a="reset"]'); if (rs) rs.onclick = () => { let n = 0; PARTS.forEach(([k]) => DEF[k].forEach((t) => { if (!P[k].includes(t)) { P[k].push(t); n++; } })); saveAll(); draw(); flash(n ? `기본 문구 ${n}개를 다시 넣었습니다` : '빠진 기본 문구가 없습니다'); };
    // 띠를 잡고 옮김 (자리 기억)
    box.querySelector('.hd').onmousedown = (ev) => { if (ev.target.closest('button')) return; ev.preventDefault(); const r = box.getBoundingClientRect(); const dx = ev.clientX - r.left, dy = ev.clientY - r.top;
      const mv = (e) => { box.style.left = Math.max(0, Math.min(e.clientX - dx, innerWidth - 80)) + 'px'; box.style.top = Math.max(0, Math.min(e.clientY - dy, innerHeight - 40)) + 'px'; box.style.right = 'auto'; };
      const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); const q = box.getBoundingClientRect(); GM_setValue('rn-ph-pos', { x: Math.round(q.left), y: Math.round(q.top) }); }; addEventListener('mousemove', mv); addEventListener('mouseup', up); }; }
  const mount = () => { document.body.appendChild(box); const pos = GM_getValue('rn-ph-pos', null); if (pos) { box.style.left = Math.min(pos.x, innerWidth - 80) + 'px'; box.style.top = Math.min(pos.y, innerHeight - 40) + 'px'; box.style.right = 'auto'; } draw(); };
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
/* ══════════ (1.45.0) 📥 개별·미등록 등록 — 알라딘 '상품 등록' 화면(wrecord.aspx)을 웹앱에서 정한 대로 채움 ══════════
 * 웹앱 📥 등록 카드에서 '알라딘 등록 화면 채워서 열기'를 누르면 이 화면이 #rnreg=상품줄번호 로 열림 → 이 스크립트가 Firebase(reg_items)의 계획(plan)대로 채움:
 *   미등록: 상품 구분 · 'ISBN 없는 상품' 체크(확인 창 자동) · 분류(최대 3) · 상품명·원제·부제 · 지은이·옮긴이·출판사(알라딘 번호로 — 팝업 없이) 또는 직접 입력 · 19세 · 쪽수 · 규격 · 출간일 · 정가
 *   공통(개별·미등록): 상품 관리 코드 · 품질(최상·상·중 — 품질 팝업이 하는 것과 같은 요청으로 팝업 없이) · 상태 부연 설명 · 판매가 · 판매상태 · 수량 · 상품 설명(편집기)
 *   팝업이 하는 일은 저장해 둔 실제 팝업 화면(품질·저자·출판사·분류)의 스크립트를 그대로 따라 함 — 짐작으로 칸을 만들지 않음
 * 채운 뒤 오른쪽 위 판에서 칸마다 ✓ · 사진(대표·보조·설명 사진)은 아직 직접 첨부(사진 폴더에서 맞는 파일 이름을 판에 보여 줌)
 * '등록완료'(판의 단추): 실행 문(exec_log)에 시작을 적을 수 있을 때만 → 등록 전 상품 조회 최근 번호(기준) → 맡긴 일 regOne(보냄 표시) → 알라딘 화면의 등록 함수 그대로
 *   → 화면이 바뀌면 공개 확인(대량 등록과 같은 지킴이·짝짓기 — ISBN·코드·판매가·품질·수량)
 * 사진 자동 첨부를 위한 조사: 이 화면이 열릴 때 하루 한 번, 알라딘 화면의 사진 올리기·등록 함수 원문과 사진 올리기 칸 모양을 reg_probe에 기록(읽기만) */
(function rnRegFill() {
  if (window.top !== window || !/\/scm\/wrecord(_edit)?\.aspx/i.test(location.pathname)) return;
  const onRecord = /\/scm\/wrecord\.aspx/i.test(location.pathname);
  const W0 = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window; const PC_NAME = (() => { try { return (window.__rnPcName && window.__rnPcName.get()) || GM_getValue('pcName', null) || 'PC'; } catch (e) { return 'PC'; } })(); // 수집기와 같은 이 PC 이름
  const nowIso = () => new Date().toISOString(); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  if (!firebase.apps.length) firebase.initializeApp({ apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385', storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15' });
  const db = firebase.app().firestore(); const auth = firebase.app().auth(); const TS = () => firebase.firestore.FieldValue.serverTimestamp(); const C = (n) => db.collection(n);
  const RG = () => window.ReadnowRegister || globalThis.ReadnowRegister || null; const XC = () => window.ReadnowExec || globalThis.ReadnowExec || null; const PR = () => window.ReadnowProducts || globalThis.ReadnowProducts || null;
  const KEY_PEND = 'rn-reg-pending'; const TAB = Math.random().toString(36).slice(2, 8);
  const whenAuth = () => new Promise((res) => { if (auth.currentUser) return res(auth.currentUser); const un = auth.onAuthStateChanged((u) => { if (u) { un(); res(u); } }); setTimeout(() => res(auth.currentUser), 15000); });
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /* ── ① 보낸 뒤 화면이 바뀌었으면: 그 일을 공개 확인으로 (보낸 뒤 10분 안 · 이 PC) ── */
  (async () => { const pd = GM_getValue(KEY_PEND, null); if (!pd || Date.now() - pd.at > 10 * 60000 || pd.url === location.href && Date.now() - pd.at < 4000) return; await whenAuth(); if (!auth.currentUser) return;
    GM_deleteValue(KEY_PEND); const ref = C('shp_cmds').doc(pd.cmdId); const ok = !(pd.alerts || []).some((a) => /실패|오류|입력해|선택해|확인해|없습니다|불가|잘못/.test(a));
    await ref.set({ status: 'verify', step: 6, regAt: pd.sentAt || nowIso(), reg: { alerts: (pd.alerts || []).slice(0, 5), after: location.pathname }, results: { [pd.itemId]: { state: ok ? 'registered' : 'unknown', at: nowIso(), msg: ok ? null : '알라딘 알림: ' + (pd.alerts || []).slice(0, 2).join(' / ') } }, uploadedAt: TS() }, { merge: true }).catch(() => {});
    await C('reg_items').doc(pd.itemId).set({ result: { state: ok ? 'registered' : 'unknown', at: nowIso() }, uploadedAt: TS() }, { merge: true }).catch(() => {});
    const X = XC(); if (X) await X.finish(db, { kind: 'regOne', key: pd.execKey }, ok ? 'done' : 'unknown', { msg: (pd.alerts || []).join(' / ') || null }).catch(() => {}); })();
  if (!onRecord) return;
  /* ── ② 사진 자동 첨부를 위한 조사 (하루 한 번 · 읽기만) ── */
  (async () => { const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); if (GM_getValue('rn-reg-probe', '') === day) return; await sleep(4000); await whenAuth(); if (!auth.currentUser) return;
    const src = {}; ['imgUp2', 'frmRecord_submit', 'frmRecord_submit_C2C', 'setCategory', 'setBookInfo', 'checkAutoIsbn2', 'catPopUp', 'authorSearch', 'openBrand', 'fn_formSet', 'stockStatusChg', 'checkOver1Digit'].forEach((k) => { try { const f = W0[k]; if (typeof f === 'function') src[k] = String(f).slice(0, 20000); } catch (e) {} });
    let up = null; try { const fr = document.getElementById('imgUploader'); const d = fr && (fr.contentDocument || (fr.contentWindow && fr.contentWindow.document)); up = { src: fr ? fr.getAttribute('src') : null, html: d && d.documentElement ? d.documentElement.outerHTML.slice(0, 30000) : null }; } catch (e) { up = { err: e.message }; }
    const files = [...document.querySelectorAll('input[type=file]')].map((x) => x.outerHTML.slice(0, 300)); const scripts = [...document.querySelectorAll('script[src]')].map((x) => x.src).slice(0, 40);
    try { await C('reg_probe').doc('wrecord_' + day + '_' + TAB).set({ at: nowIso(), pc: PC_NAME, url: location.href, src, uploader: up, files, scripts, uploadedAt: TS() }); GM_setValue('rn-reg-probe', day); } catch (e) {} })();
  const m = location.hash.match(/rnreg=([\w-]+)/); if (!m) return; const itemId = m[1];
  /* ── ③ 판 ── */
  const box = document.createElement('div'); box.id = 'rnRegFill'; box.style.cssText = 'position:fixed;right:12px;top:12px;z-index:2147483646;width:360px;max-height:92vh;overflow:auto;background:#fff;border:2px solid #2F5D50;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.25);font:13px/1.5 system-ui,"Malgun Gothic",sans-serif;color:#1E2B28';
  const paint = (html) => { box.innerHTML = `<div style="background:#2F5D50;color:#fff;padding:8px 12px;font-weight:800;display:flex;justify-content:space-between"><span>📥 리드나우 등록 도우미</span><span id="rnRfX" style="cursor:pointer">✕</span></div><div style="padding:10px 12px">${html}</div>`; const x = box.querySelector('#rnRfX'); if (x) x.onclick = () => (box.style.display = 'none'); };
  const mount = () => { if (!box.isConnected) document.body.appendChild(box); }; if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  paint('Firebase에서 등록 계획을 읽는 중…');
  const $ = (id) => document.getElementById(id);
  const fire = (el) => { if (!el) return; ['input', 'change', 'keyup', 'blur'].forEach((t) => { try { el.dispatchEvent(new Event(t, { bubbles: true })); } catch (e) {} }); };
  const setV = (id, v) => { const el = $(id); if (!el) return false; el.removeAttribute && el.removeAttribute('readonly'); el.value = v == null ? '' : String(v); fire(el); return true; };
  const selectVal = (el, want) => { if (!el) return false; const w = String(want); const o = [...el.options].find((op) => op.value === w || +op.value === +w || op.text.trim() === w || (+op.text.trim() === +w && w !== '')); if (!o) return false; el.value = o.value; fire(el); return true; };
  async function readyEditor() { for (let i = 0; i < 60; i++) { if (W0.EditorManager && W0.Editor && $('frmRecord')) return true; await sleep(250); } return false; }
  async function quality(plan) { /* 품질 팝업(wc2c_itemsales.aspx)의 frmsubmit과 같은 일 — 같은 추천가 요청 → 같은 칸 */
    const ps = $('priceStd') && $('priceStd').value; if (!(+ps > 0)) throw new Error('정가가 없어 품질을 정할 수 없음');
    const r = await fetch(`/shop/usedshop/c2c_sales_ajax.aspx?method=recomPriceSales&priceStd=${encodeURIComponent(ps)}&itemQuailty=${+plan.grade}`, { credentials: 'include' }); const j = JSON.parse(await r.text());
    setV('QualityType', String(+plan.grade)); setV('CommentDirty', String(plan.comment || '').slice(0, 50)); const pS = $('priceSales'); if (pS) { pS.readOnly = false; pS.value = j.PriceSales; } setV('QualityTypeKOR', j.QualityTypeDesc || ''); const g = $('Guaranted'); if (g) g.checked = true;
    try { W0.PercentPriceSales(); W0.calcSummaryC2C(); } catch (e) {} return j; }
  async function fill(plan) { const out = []; const ok = (k, v, note) => out.push({ k, ok: !!v, note: note || '' });
    if (!(await readyEditor())) throw new Error('알라딘 등록 화면이 다 열리지 않음 (편집기 없음)');
    const nativeConfirm = W0.confirm; W0.confirm = () => true; // 'ISBN 없는 상품' 확인 창 등 — 채우는 동안만 '확인'
    try {
      if (plan.method === 'new') { const N = plan.new || {};
        const rb = $('SelectType' + plan.branch); if (rb) { rb.checked = true; try { W0.fn_formSet(+plan.branch); } catch (e) {} } ok('상품 구분', rb && rb.checked);
        const ai = $('autoIsbn'); if (ai && !ai.checked) ai.click(); ok('ISBN 없는 상품', ai && ai.checked);
        (N.cats || []).slice(0, 3).forEach((c, i) => { let done = false; try { if (typeof W0.setCategory === 'function') { W0.setCategory(i, +c.cid, c.path, !!c.mag); done = true; } } catch (e) {} ok(`분류 ${i + 1}`, done, c.path); });
        ok('상품명', setV('title', String(N.title || '').slice(0, 100))); if (N.titleOrigin) ok('원제', setV('titleOrigin', N.titleOrigin)); if (N.subtitle) ok('부제', setV('itemSubTitle', N.subtitle));
        if (N.customAuthor || N.customPublisher || !N.author || !N.publisher) { const ck = $('chkCustomAuthor'); if (ck && !ck.checked) ck.click(); ok('저자 직접 입력', setV('custom_authorNm0', N.customAuthor || (N.author && N.author.name) || '')); ok('출판사 직접 입력', setV('custom_makingCompany', N.customPublisher || (N.publisher && N.publisher.name) || '')); }
        else { let a1 = false; try { W0.setBookInfo(0, N.author.id, N.author.name); a1 = true; } catch (e) {} ok('지은이', a1, N.author.name);
          if (N.translator && N.translator.id) { ok('옮긴이', setV('authorInfoId1', N.translator.id) && setV('authorInfoNm1', N.translator.name), N.translator.name); }
          ok('출판사', setV('makingCompany', N.publisher.name) && setV('makingCompanyId', N.publisher.id), N.publisher.name); }
        const ad = $('chkAgeAdultLevel'); if (ad) { ad.checked = !!N.adult; fire(ad); }
        if (N.pages) ok('쪽수', setV('ItemPage', +N.pages));
        if (N.sizeSel) { const s0 = $('selItemSize'); const r0 = selectVal(s0, N.sizeSel); try { W0.selItemSize_Change(s0); } catch (e) {} if (+N.sizeSel === 19) setV('size', N.sizeText || ''); ok('규격', r0, (s0 && s0.options[s0.selectedIndex] || {}).text); }
        if (N.pubDate) { const [y, mo, d] = String(N.pubDate).split('-').map((x) => +x); const r1 = $('noPubDate1'); if (r1) r1.checked = true; ok('출간일', selectVal($('pubY'), y) && selectVal($('pubM'), mo) && selectVal($('pubD'), d), N.pubDate); } else { const r0 = $('noPubDate0'); if (r0) r0.checked = true; }
        ok('정가', setV('priceStd', +plan.priceStd));
      } else if (plan.priceStd && !(+($('priceStd') || {}).value > 0)) ok('정가', setV('priceStd', +plan.priceStd));
      ok('관리 코드', setV('supItemCode', plan.code), plan.code);
      try { const j = await quality(plan); ok('품질', true, j.QualityTypeDesc || ''); } catch (e) { ok('품질', false, e.message); }
      ok('판매가', setV('priceSales', +plan.price), (+plan.price).toLocaleString() + '원'); try { W0.calcSummaryC2C(); } catch (e) {}
      const st = $('stockState'); ok('판매상태', selectVal(st, { 1: 1, 2: 3, 3: 15 }[+plan.saleState || 1])); try { W0.stockStatusChg(); } catch (e) {}
      ok('수량', setV('stockCount', Math.max(1, +plan.qty || 1)));
      if (plan.descHtml) { let d0 = false; try { W0.EditorManager.loadContent(plan.descHtml); d0 = true; } catch (e) {} ok('상품 설명', d0); }
    } finally { W0.confirm = nativeConfirm; }
    return out; }
  async function newestListing(code) { const P = PR(); const r = await fetch(`/scm/wrecord_edit.aspx?chkItemStockStatus=${code}&chkItemInDate=0&searchCat1=0&searchType=1&keyword=&ViewRowsCount=100&page=1&SortOrder=6&itemStockStatus=${code}&categoryId=0`, { credentials: 'include' }); const d = new DOMParser().parseFromString(await r.text(), 'text/html'); return Math.max(0, ...P.parseScmList(d, new Date().getFullYear()).rows.map((x) => +x.listingId || 0)); }
  async function submit(it, plan, fillRep) { const X = XC(); if (!X) throw new Error('실행 문 공용 파일이 없음 — 기록 없이 등록하지 않음');
    const tries = (it.tries || 0) + 1; const execKey = `${itemId}#${tries}`; let g; try { g = await X.begin(db, { kind: 'regOne', key: execKey, by: PC_NAME, detail: { title: plan.title || null, price: plan.price } }); } catch (e) { throw new Error('실행 기록(exec_log)을 못 적어 등록하지 않음 — ' + (e.code || e.message)); }
    if (!g.ok) throw new Error('실행 문이 막음: ' + g.why);
    const sc = { 1: 1, 2: 3, 3: 15 }[+plan.saleState || 1]; let base = 0; try { base = Math.max(await newestListing(1), sc !== 1 ? await newestListing(sc) : 0); } catch (e) {} const cur = +(((await C('prd_system').doc('cursor').get()).data() || {}).maxListingId || 0); base = Math.max(base, cur);
    const RGx = RG(); const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); const cmdId = `ro_${itemId}_${tries}`; const row = { isbn: plan.isbn || '', state: +plan.saleState || 1, qty: Math.max(1, +plan.qty || 1), grade: +plan.grade || 2, price: Math.round(+plan.price), title: String(plan.title || '').slice(0, 100), code: plan.code, desc: '', regItem: itemId };
    const ref = C('shp_cmds').doc(cmdId); const b = db.batch();
    b.set(ref, { type: 'regOne', method: plan.method, status: 'running', claim: { pc: PC_NAME, tab: TAB, at: nowIso() }, step: 5, sent: true, sentAt: nowIso(), beatAt: nowIso(), rows: [row], n: 1, qty: row.qty, sum: row.price * row.qty, day: today, regDay: today, verify: base ? { base, codes: [sc], until: new Date(Date.now() + 90 * 60000).toISOString(), tries: 0 } : null, fill: fillRep.map((x) => `${x.ok ? '✓' : '✗'} ${x.k}`).join(' · ').slice(0, 900), createdAt: nowIso(), by: PC_NAME, uploadedAt: TS() });
    b.set(C('reg_items').doc(itemId), { stage: 'done', via: plan.method, cmdId, tries, day: today, confirmedAt: nowIso(), confirmedBy: PC_NAME, result: null, final: { isbn: row.isbn, price: row.price, code: row.code, grade: row.grade, qty: row.qty, state: row.state, desc: '', title: row.title }, uploadedAt: TS() }, { merge: true });
    await b.commit(); // 못 적으면 여기서 멈춤 — 등록하지 않음
    const pend = { cmdId, itemId, execKey, at: Date.now(), sentAt: nowIso(), url: location.href, alerts: [] }; GM_setValue(KEY_PEND, pend);
    const nativeAlert = W0.alert; W0.alert = function (msg) { try { const p = GM_getValue(KEY_PEND, null); if (p) { p.alerts = [...(p.alerts || []), String(msg).slice(0, 200)]; GM_setValue(KEY_PEND, p); } } catch (e) {} return nativeAlert.call(W0, msg); };
    W0.confirm = ((nc) => function (msg) { try { const p = GM_getValue(KEY_PEND, null); if (p) { p.alerts = [...(p.alerts || []), '(확인) ' + String(msg).slice(0, 200)]; GM_setValue(KEY_PEND, p); } } catch (e) {} return nc.call(W0, msg); })(W0.confirm);
    W0.frmRecord_submit_C2C(false, '6', plan.method === 'one');
    /* 화면이 그대로면(알라딘이 입력을 막음 = 보내지 않음) 5초 뒤: 알림 글을 보여 주고 이 일은 '보내지 않음'으로 — 다시 고쳐서 누를 수 있게 */
    setTimeout(async () => { const p = GM_getValue(KEY_PEND, null); if (!p || p.cmdId !== cmdId) return; const al = p.alerts || []; if (!al.length) return; // 알림 없이 기다리는 중이면 화면이 바뀔 때 처리
      if (al.some((a) => /등록되었|완료/.test(a))) return; GM_deleteValue(KEY_PEND);
      await ref.set({ status: 'fail', sent: false, msg: '알라딘이 입력을 막음: ' + al.join(' / ').slice(0, 300), results: { [itemId]: { state: 'fail', at: nowIso(), msg: al.join(' / ').slice(0, 200) } }, doneAt: nowIso(), uploadedAt: TS() }, { merge: true }).catch(() => {});
      await C('reg_items').doc(itemId).set({ stage: 'pick', cmdId: null, final: null, lookErr: '알라딘 등록 화면: ' + al.join(' / ').slice(0, 200), uploadedAt: TS() }, { merge: true }).catch(() => {});
      await X.finish(db, { kind: 'regOne', key: execKey }, 'failed', { msg: al.join(' / ') }).catch(() => {});
      paint(`<b style="color:#B0322A">알라딘이 등록을 막았습니다</b><div style="margin:6px 0">${al.map(esc).join('<br>')}</div><div>알라딘에 등록되지 않았습니다. 화면에서 고친 뒤 알라딘의 '등록완료'를 직접 누르거나, 웹앱에서 고쳐 다시 여세요.</div>`); }, 5000); }
  (async () => { await whenAuth(); if (!auth.currentUser) return paint('Firebase 로그인이 안 됨 — 수집기 탭에서 로그인한 뒤 다시 여세요');
    const sn = await C('reg_items').doc(itemId).get().catch(() => null); const it = sn && sn.exists ? sn.data() : null; if (!it || !it.plan) return paint('등록 계획을 찾지 못함 — 웹앱에서 다시 \'채워서 열기\'');
    if (it.stage === 'done') return paint('이미 등록을 보낸 상품입니다 (웹앱 확정 탭에서 결과 확인) — 다시 채우지 않음');
    const plan = it.plan; let rep = []; try { rep = await fill(plan); } catch (e) { return paint(`<b style="color:#B0322A">채우지 못함</b><div>${esc(e.message)}</div>`); }
    const bad = rep.filter((x) => !x.ok); const im = plan.images || {};
    paint(`<div style="font-weight:800;font-size:14px">${esc(plan.method === 'new' ? '미등록 상품 등록' : '개별 등록')} · ${esc(plan.title || '')}</div>
      <div style="margin:4px 0;color:#5B6B66">${esc(plan.code)} · ${(+plan.price).toLocaleString()}원 · ${esc({ 1: '최상', 2: '상', 3: '중' }[+plan.grade])} · ${+plan.qty || 1}부</div>
      <div style="margin:6px 0">${rep.map((x) => `<div style="color:${x.ok ? '#2F5D50' : '#B0322A'}">${x.ok ? '✓' : '✗'} ${esc(x.k)}${x.note ? ` <small style="color:#5B6B66">${esc(x.note)}</small>` : ''}</div>`).join('')}</div>
      ${im.main || (im.subs || []).length || (im.desc || []).length ? `<div style="background:#FFF7E0;border:1px solid #E9D79A;border-radius:8px;padding:6px 8px;margin:6px 0"><b>사진은 직접 첨부</b> (자동 첨부는 다음 판)<br>${im.main ? `대표: <b>${esc(im.main)}</b><br>` : ''}${(im.subs || []).length ? `보조: ${im.subs.map(esc).join(', ')}<br>` : ''}${(im.desc || []).length ? `설명 끝 사진(편집기의 사진 단추): ${im.desc.map(esc).join(', ')}` : ''}</div>` : plan.method === 'new' ? '<div style="color:#A8661B;margin:6px 0">미등록 상품은 대표 이미지가 필수 — 화면 아래 \'대표 이미지\'에서 첨부</div>' : ''}
      ${bad.length ? `<div style="color:#B0322A;margin:4px 0">✗ 칸은 화면에서 직접 확인·입력</div>` : ''}
      <button id="rnRfGo" style="width:100%;margin-top:6px;padding:10px;border:0;border-radius:8px;background:#B0322A;color:#fff;font-weight:800;font-size:14px;cursor:pointer">확인했음 → 등록완료 (기록 남기고 알라딘에 보냄)</button>
      <div style="color:#5B6B66;font-size:11.5px;margin-top:4px">알라딘의 '등록완료'를 직접 눌러도 등록되지만, 그러면 웹앱이 결과를 모릅니다 — 이 단추로 누르세요.</div>`);
    const go = box.querySelector('#rnRfGo'); go.onclick = async () => { go.disabled = true; go.textContent = '보내는 중…'; try { await submit(it, plan, rep); go.textContent = '보냄 — 알라딘 화면 결과를 기다리는 중'; } catch (e) { go.disabled = false; go.textContent = '확인했음 → 등록완료'; alert('등록하지 않음: ' + e.message); } };
  })();
})();

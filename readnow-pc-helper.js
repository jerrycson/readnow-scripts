/* readnow-pc-helper.js — 리드나우 수집기 1.56.1의 모듈 ⑥ 화면 도우미 — 고객 응대 문구
 * Tampermonkey의 '리드나우 수집기' 본체가 @require로 불러옴 (이 파일만 따로 설치하지 않음). 본체와 판이 같아야 함 — 다르면 관제판에 빨간 띠.
 * 원본 한 파일에서 기계로 나눈 것: 모듈을 차례로 이으면 원본 코드와 글자 하나까지 같음 (같은 코드 = 같은 기록). */
;(function (g) { g.ReadnowPcMods = Object.assign(g.ReadnowPcMods || {}, { helper: '1.56.1' }); })(typeof globalThis !== 'undefined' ? globalThis : this);
/* ══════════ 고객 응대 문구 도우미 (1.34.0): 묻고 답하기 답변 입력 화면 · 구매평 목록 ══════════
 * 세 칸: ① 인사말 ② 내용 ③ 마무리. 문구를 누르면 답변 칸(지금 커서 자리, 없으면 맨 끝)에 한 줄로 들어감. 순서대로 누르면 답변 완성.
 * 칸마다 문구 고치기·지우기·끌어서 순서 바꾸기·새로 넣기. 문구는 Firebase(app_settings/qna_phrases) 한 곳에 두고 모든 PC·웹앱(⚙ 설정)이 같이 씀 — 이 PC에도 사본을 둬서 바로 뜸.
 * 답변 칸: 묻고 답하기 = #txtAnswer, 그 밖의 화면 = 마지막으로 누른 입력칸(textarea). 알라딘 '등록' 단추는 사람이 직접 누름 (자동으로 보내지 않음). */
(function rnPhraseHelper() {
  if (window.top !== window || !/\/scm\/(wUsedShopC2C|wShopSurvey)/i.test(location.pathname)) return;
  const DEF = {
    greet: ['안녕하세요? 반갑습니다!', '안녕하세요, 북스킹입니다. 문의 주셔서 진심으로 감사드립니다.', '안녕하세요, 고객님. 저희 상품에 관심 가져 주셔서 감사합니다.', '안녕하세요, 고객님. 답변이 늦어 죄송합니다.', '안녕하세요, 북스킹입니다. 기다려 주셔서 감사합니다.', '안녕하세요, 고객님. 소중한 구매평 남겨 주셔서 진심으로 감사드립니다.'],
    body: ['문의하신 상품은 현재 재고가 있어 바로 구매하실 수 있습니다.', '확인해 보니 문의하신 상품은 아쉽게도 현재 품절되었습니다.', '상품 상태는 등록된 등급과 상품 설명에 적힌 내용과 같습니다.', '직접 확인한 결과 말씀하신 부분(낙서·밑줄·변색 등)은 없으며 상태 양호합니다.', '확인 결과 일부 사용감이 있어 상품 설명에 자세히 적어 두었습니다.', '영업일 오후 2시까지 주문하시면 당일 출고를 원칙으로 하고 있습니다.', '택배는 롯데택배로 보내 드리며, 출고 후 송장번호로 배송 조회가 가능합니다.', '저희(북스킹) 상품끼리는 한 상자에 묶어 보내 드립니다.', '주문 취소는 출고 전까지 알라딘 주문 내역에서 바로 하실 수 있습니다.', '반품·교환은 상품을 받으신 날로부터 7일 안에 신청하실 수 있습니다.', '불편을 드려 대단히 죄송합니다. 확인하는 대로 신속하게 처리해 드리겠습니다.', '말씀해 주신 의견은 상품 검수에 꼭 반영하겠습니다.', '만족스러운 거래가 되셨다니 저희도 정말 기쁩니다.', '부득이하게 중고상품의 경우 각 상품마다 품질 정보가 상이하며 매입 후 별도의 상품번호로 재고 관리가 진행되고 있어 교환 불가한점 안내드리며, 알라딘 부담으로 반품접수 하였습니다.'],
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
  let seeded = ['nx1']; /* (1.46.0) 웹앱이 한 번만 넣은 기본 문구 표시 — 저장할 때 같이 남김(지운 문구가 다시 들어오지 않게) */
  const saveAll = () => { try { GM_setValue(LKEY, P); } catch (e) {} if (fs && user) fs.collection('app_settings').doc('qna_phrases').set({ ...P, seeded, at: new Date().toISOString(), by: user.email || '', from: 'collector' }).catch((e) => flash('Firebase 저장 실패 (이 PC에만 저장됨): ' + (e.code || e.message))); };
  try { if (window.firebase) { if (!firebase.apps.length) firebase.initializeApp({ apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385', storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15' });
    fs = firebase.firestore(); firebase.auth().onAuthStateChanged((u) => { user = u; if (!u) return; fs.collection('app_settings').doc('qna_phrases').onSnapshot((d) => { if (!d.exists) { saveAll(); return; } const x = d.data(); if (Array.isArray(x.seeded)) seeded = x.seeded; if (okP(x)) { P = { greet: x.greet, body: x.body, close: x.close }; try { GM_setValue(LKEY, P); } catch (e) {} draw(); } }, () => {}); }); } } catch (e) {}
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
 *   공통(개별·미등록): 상품 관리 코드 · 품질(최상·상·중 — 품질 팝업이 하는 것과 같은 요청으로 팝업 없이) · 판매가 · 판매상태 · 수량 · 상품 설명(편집기)
 *   팝업이 하는 일은 저장해 둔 실제 팝업 화면(품질·저자·출판사·분류)의 스크립트를 그대로 따라 함 — 짐작으로 칸을 만들지 않음
 * 채운 뒤 오른쪽 위 판에서 칸마다 ✓ · 사진(대표·보조·설명 사진)은 아직 직접 첨부(사진 폴더에서 맞는 파일 이름을 판에 보여 줌)
 * '등록완료'(판의 단추): 실행 문(exec_log)에 시작을 적을 수 있을 때만 → 등록 전 상품 조회 최근 번호(기준) → 맡긴 일 regOne(보냄 표시) → 알라딘 화면의 등록 함수 그대로
 *   → 화면이 바뀌면 공개 확인(대량 등록과 같은 지킴이·짝짓기 — ISBN·코드·판매가·품질·수량)
 * 사진 자동 첨부를 위한 조사: 이 화면이 열릴 때 하루 한 번, 알라딘 화면의 사진 올리기·등록 함수 원문과 사진 올리기 칸 모양을 reg_probe에 기록(읽기만) */
(function rnRegFill() {
  /* (1.47.0) 채우는 일을 '틀'(makeFiller)로 묶음 — 사람이 보는 등록 화면(이 탭)과, 창 없이 하는 자동 등록(보이지 않는 틀 안의 등록 화면) 둘 다 같은 것을 씀 */
  const UW = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window; const PC_NAME = (() => { try { return (window.__rnPcName && window.__rnPcName.get()) || GM_getValue('pcName', null) || 'PC'; } catch (e) { return 'PC'; } })(); // 수집기와 같은 이 PC 이름
  const nowIso = () => new Date().toISOString(); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  if (typeof firebase === 'undefined') return;
  if (!firebase.apps.length) firebase.initializeApp({ apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385', storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15' });
  const db = firebase.app().firestore(); const auth = firebase.app().auth(); const TS = () => firebase.firestore.FieldValue.serverTimestamp(); const C = (n) => db.collection(n);
  const RG = () => window.ReadnowRegister || globalThis.ReadnowRegister || null; const XC = () => window.ReadnowExec || globalThis.ReadnowExec || null; const PR = () => window.ReadnowProducts || globalThis.ReadnowProducts || null;
  const KEY_PEND = 'rn-reg-pending'; const TAB = Math.random().toString(36).slice(2, 8);
  const whenAuth = () => new Promise((res) => { if (auth.currentUser) return res(auth.currentUser); const un = auth.onAuthStateChanged((u) => { if (u) { un(); res(u); } }); setTimeout(() => res(auth.currentUser), 15000); });
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ERR_RE = /실패|오류|입력해|선택해|확인해|없습니다|불가|잘못/;
  /* 사진 받기: 웹앱이 사진 폴더에서 Firebase 저장소(reg_photos/…)에 올려 둔 것 → 이 PC로 (알라딘 화면에 넣을 파일) */
  async function getPhoto(x) { if (!x || !x.path) throw new Error('저장소 경로 없음'); const url = await firebase.storage().ref(x.path).getDownloadURL();
    const blob = await new Promise((res, rej) => GM_xmlhttpRequest({ method: 'GET', url, responseType: 'blob', timeout: 60000, onload: (r) => (r.status === 200 ? res(r.response) : rej(new Error('HTTP ' + r.status))), onerror: () => rej(new Error('받기 실패')), ontimeout: () => rej(new Error('시간 초과')) }));
    return new File([blob], x.name || 'photo.jpg', { type: blob.type || 'image/jpeg' }); }
  function makeFiller(doc, W0, opt) { opt = opt || {};
    const $ = (id) => doc.getElementById(id);
    const fire = (el) => { if (!el) return; ['input', 'change', 'keyup', 'blur'].forEach((t) => { try { el.dispatchEvent(new Event(t, { bubbles: true })); } catch (e) {} }); };
    const setV = (id, v) => { const el = $(id); if (!el) return false; el.removeAttribute && el.removeAttribute('readonly'); el.value = v == null ? '' : String(v); fire(el); return true; };
    const selectVal = (el, want) => { if (!el) return false; const w = String(want); const o = [...el.options].find((op) => op.value === w || +op.value === +w || op.text.trim() === w || (+op.text.trim() === +w && w !== '')); if (!o) return false; el.value = o.value; fire(el); return true; };
    async function readyEditor() { for (let i = 0; i < 80; i++) { if (W0.EditorManager && W0.Editor && $('frmRecord')) return true; await sleep(250); } return false; }
    async function quality(plan) { /* 품질 팝업(wc2c_itemsales.aspx)의 frmsubmit과 같은 일 — 같은 추천가 요청 → 같은 칸 */
      const ps = $('priceStd') && $('priceStd').value; if (!(+ps > 0)) throw new Error('정가가 없어 품질을 정할 수 없음');
      const r = await fetch(`/shop/usedshop/c2c_sales_ajax.aspx?method=recomPriceSales&priceStd=${encodeURIComponent(ps)}&itemQuailty=${+plan.grade}`, { credentials: 'include' }); const j = JSON.parse(await r.text());
      setV('QualityType', String(+plan.grade)); /* (1.49.0) 품질 창의 '상태 부연 설명'은 입력 칸이 없어 건드리지 않음 · 창 아래 확인 질문(ISBN이 맞습니까 · 정가가 맞습니까)은 '예'와 같음 = 정가 그대로(priceStd)·추천가 요청 */ const pS = $('priceSales'); if (pS) { pS.readOnly = false; pS.value = j.PriceSales; } setV('QualityTypeKOR', j.QualityTypeDesc || ''); const g = $('Guaranted'); if (g) g.checked = true;
      try { W0.PercentPriceSales(); W0.calcSummaryC2C(); } catch (e) {} return j; }
    /* 대학교장터(등록 화면의 '대학교장터 상품으로 등록하기' 칸들 — 저장해 둔 실제 화면 그대로): 체크 → SetIsUniv() · 카테고리는 팝업이 부르는 UnivCategory_Selected(번호, 경로) · 학부·학과(필수)·사용년도·과목명·사용학년·사용학기·교수명 */
    function univ(plan, ok) { const u = plan.univ; if (!u || !u.on) return; const ck = $('chkIsUniv'); if (ck && !ck.checked) { ck.checked = true; fire(ck); try { W0.SetIsUniv(); } catch (e) {} } ok('대학교장터', !!(ck && ck.checked));
      if (u.catId) { let d0 = false; try { W0.UnivCategory_Selected(String(u.catId), String(u.catNav || '')); d0 = true; } catch (e) { d0 = setV('UnivCategoryId', u.catId); } ok('대학교장터 카테고리', d0, u.catNav || u.catId); } else ok('대학교장터 카테고리', false, '고르지 않음');
      ok('학부·학과', !!String(u.dept || '').trim() && setV('UnivColleage', String(u.dept).slice(0, 20)), u.dept);
      [['CourseYear', u.year, 4], ['Course', u.course, 20], ['CourseGrade', u.grade, 1], ['CourseTerm', u.term, 10], ['ProfessorName', u.prof, 20]].forEach(([id, v, n]) => { if (v != null && v !== '') setV(id, String(v).slice(0, n)); });
      const sv = $('chkSaveUnivInfo'); if (sv) sv.checked = false; /* 알라딘 계정의 '대학교장터 기본 등록정보'는 건드리지 않음 (우리 기본값은 웹앱 등록 설정에) */ }
    async function fill(plan) { const out = []; const ok = (k, v, note) => out.push({ k, ok: !!v, note: note || '' });
      if (!(await readyEditor())) throw new Error('알라딘 등록 화면이 다 열리지 않음 (편집기 없음 — 로그인이 풀렸을 수 있음)');
      const nativeConfirm = W0.confirm; W0.confirm = () => true; // 'ISBN 없는 상품' 확인 창 등 — 채우는 동안만 '확인'
      try {
        if (plan.method === 'new') { const N = plan.new || {};
          const rb = $('SelectType' + plan.branch); if (rb) { rb.checked = true; try { W0.fn_formSet(+plan.branch); } catch (e) {} } ok('상품 구분', rb && rb.checked);
          univ(plan, ok);
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
        } else { univ(plan, ok); if (plan.priceStd && !(+($('priceStd') || {}).value > 0)) ok('정가', setV('priceStd', +plan.priceStd)); }
        ok('관리 코드', setV('supItemCode', plan.code), plan.code);
        try { const j = await quality(plan); ok('품질', true, `${j.QualityTypeDesc || ''} · ISBN·정가 확인 '예'`); } catch (e) { ok('품질', false, e.message); }
        ok('판매가', setV('priceSales', +plan.price), (+plan.price).toLocaleString() + '원'); try { W0.calcSummaryC2C(); } catch (e) {}
        const st = $('stockState'); ok('판매상태', selectVal(st, { 1: 1, 2: 3, 3: 15 }[+plan.saleState || 1])); try { W0.stockStatusChg(); } catch (e) {}
        ok('수량', setV('stockCount', Math.max(1, +plan.qty || 1)));
        if (plan.descHtml) { let d0 = false; try { W0.EditorManager.loadContent(plan.descHtml); d0 = true; } catch (e) {} ok('상품 설명', d0); }
      } finally { W0.confirm = nativeConfirm; }
      return out; }
    /* 사진 한 장: 알라딘 화면의 사진 단추와 같은 imgUp2(칸, 6, 0)를 부른 뒤 → 생긴 '파일 고르기' 칸(숨은 imgUploader 틀 · 새 창 · 화면 안)에 파일을 넣고 바뀜을 알림 → 그 칸(mainCover·zoomCoverN)에 사진 주소가 들어올 때까지 기다림
     *  파일 고르기 창은 사람이 누를 때만 뜨므로 여기서는 열리지 않음. 칸이 안 채워지면 ✗ (그 사진만 직접) */
    /* (1.52.0) 사진 올리기 — 정범이 저장해 준 알라딘 사진 창 2개(2026-10-09) 그대로:
     *  ① 대표·추가 사진 창 /scm/upload/imgUpPopup.aspx : 폼 fSCMImgUploader(multipart) → 같은 주소로 보냄 · 칸 SCMImg(파일) · Action=1 · targetO=칸 이름(mainCover·zoomCoverN) · branchType=6
     *     → 알라딘이 돌려주는 화면이 window.opener(등록 화면)의 그 칸·그림을 채움(창 안 함수 pd(id) = opener.document.getElementById(id))
     *  ② 편집기(설명 안) 사진 창 /scm/upload/wimage_upload_scm.aspx : 폼 Myform(multipart) → 같은 주소 · 칸 uploadFile(파일) · action=1 · imgalign=1(왼쪽 · 창 기본값) · 가로 570픽셀 이하
     *     → 돌려주는 화면이 opener.InsertHtml(그림)을 불러 편집기에 넣음 (등록 화면: function InsertHtml(img){ EditorManager.pasteContent(img); })
     *  방법: 창을 띄우지 않고 그 폼과 똑같은 내용을 직접 보냄(fetch · 같은 알라딘 로그인) → 돌려받은 화면을 보이지 않는 빈 틀에 그대로 그리되 그 틀의 opener를 등록 화면으로 정해 둠
     *  → 사람이 창에서 올렸을 때와 똑같이 알라딘 화면 스크립트가 칸을 채움. 예전(1.50~1.51)엔 틀이 새 화면으로 넘어가며 opener가 사라져 안 들어갔음
     *  돌려받은 화면은 처음 몇 번 reg_probe/{mainImg·editorImg}에 남김(안 맞으면 그걸로 고침) */
    const sniffText = async (r) => { const buf = await r.arrayBuffer(); const ct = String(r.headers.get('content-type') || ''); let cs = (ct.match(/charset=([\w-]+)/i) || [])[1]; let t = new TextDecoder(cs || 'utf-8').decode(buf); if (!cs) { const m = t.slice(0, 2000).match(/charset=["']?([\w-]+)/i); if (m && !/utf-?8/i.test(m[1])) { try { t = new TextDecoder(m[1]).decode(buf); } catch (e) {} } } return t; };
    const runAsPopup = async (html, url) => { const fr = doc.createElement('iframe'); fr.style.cssText = 'position:fixed;left:-4000px;top:0;width:560px;height:480px;border:0;opacity:0;pointer-events:none'; doc.body.appendChild(fr); const w = fr.contentWindow; const d = fr.contentDocument; const errs = [];
      try { try { w.opener = W0; } catch (e) {} w.onerror = (m) => { errs.push(String(m).slice(0, 200)); return true; }; w.alert = (m) => errs.push('(알림) ' + String(m).slice(0, 200)); w.close = () => {}; try { w.resizeTo = () => {}; } catch (e) {}
        d.open(); try { w.opener = W0; } catch (e) {} const base = `<base href="${String(url).replace(/"/g, '')}">`; d.write(/<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + base) : base + html); d.close(); } catch (e) { errs.push('그리기 오류: ' + e.message); }
      await sleep(1500); setTimeout(() => { try { fr.remove(); } catch (e) {} }, 8000); return errs; };
    let probeN = 0; const probeUp = async (kind, data) => { if (probeN++ > 6) return; try { await C('reg_probe').doc(kind).set({ last: { at: nowIso(), pc: PC_NAME, ...data }, pc: PC_NAME, ...W() }, { merge: true }); } catch (e) {} };
    /* 편집기 사진은 가로 570픽셀 이하만 받음(창 안내) → 넓으면 줄여서 JPEG로 (세로는 비율대로) · 이름 확장자도 jpg로 */
    async function fitWidth(file, maxW) { try { const bmp = await createImageBitmap(file); if (bmp.width <= maxW && /\.(jpe?g|png|gif)$/i.test(file.name)) { bmp.close && bmp.close(); return file; } const r = Math.min(1, maxW / bmp.width); const cv = doc.createElement('canvas'); cv.width = Math.round(bmp.width * r); cv.height = Math.round(bmp.height * r); cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height); bmp.close && bmp.close();
      const blob = await new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.9)); return new File([blob], String(file.name || 'photo').replace(/\.[^.]*$/, '') + '.jpg', { type: 'image/jpeg' }); } catch (e) { return file; } }
    async function postUpload(kind, url, fields, fileKey, file) { const fd = new FormData(); for (const [k, v] of Object.entries(fields)) fd.append(k, v); fd.append(fileKey, file, file.name || 'photo.jpg');
      const r = await fetch(url, { method: 'POST', body: fd, credentials: 'include' }); const html = await sniffText(r); if (!r.ok) throw new Error('알라딘이 받지 않음 HTTP ' + r.status);
      if (/로그인|login/i.test(html) && /<form[^>]+login/i.test(html)) throw new Error('알라딘 로그인이 풀림'); const errs = await runAsPopup(html, r.url || url); return { html, errs }; }
    async function attachOne(field, file) { const inp0 = $(field); if (!inp0) return { ok: false, why: '사진 칸 없음' }; const before = inp0.value; const imgEl = $(field + 'img'); const src0 = imgEl ? imgEl.getAttribute('src') : null; let res = null, why = '';
      try { res = await postUpload('mainImg', '/scm/upload/imgUpPopup.aspx', { Action: '1', targetO: field, branchType: '6' }, 'SCMImg', file); } catch (e) { why = e.message; }
      for (let i = 0; i < 20 && res; i++) { const v = ($(field) || {}).value; const s2 = imgEl ? imgEl.getAttribute('src') : null; if ((v && v !== before) || (s2 && s2 !== src0 && !/space/i.test(s2))) { await probeUp('mainImg', { field, ok: true, value: v || null, src: s2 || null, html: res.html.slice(0, 30000), errs: res.errs }); return { ok: true, where: '직접 올림' }; } await sleep(300); }
      if (res) await probeUp('mainImg', { field, ok: false, html: res.html.slice(0, 30000), errs: res.errs });
      const old = await attachOneOld(field, file); if (old.ok) return old; return { ok: false, why: `${why || '올렸지만 칸이 안 채워짐'}${res && res.errs.length ? ' · ' + res.errs.join(' / ').slice(0, 160) : ''} — 돌려받은 화면을 reg_probe/mainImg에 남김` }; }
    /* 예전 방식(사진 단추 imgUp2를 불러 생긴 파일 칸에 넣기) — 직접 올리기가 안 될 때만 */
    async function attachOneOld(field, file) { const inp0 = $(field); if (!inp0) return { ok: false, why: '사진 칸 없음' }; const before = inp0.value; let popup = null;
      const nOpen = W0.open; W0.open = function () { popup = nOpen.apply(W0, arguments); return popup; };
      try { if (typeof W0.imgUp2 !== 'function') return { ok: false, why: '알라딘 사진 단추 함수(imgUp2)가 없음' }; W0.imgUp2(field, 6, 0); } catch (e) { return { ok: false, why: 'imgUp2 오류: ' + e.message }; } finally { W0.open = nOpen; }
      let fi = null, where = ''; for (let i = 0; i < 40 && !fi; i++) { await sleep(250); try { const fr = $('imgUploader'); const d = fr && fr.contentDocument; const x = d && d.querySelector('input[type=file]'); if (x && !x.dataset.rnUsed) { fi = x; where = '숨은 틀'; } } catch (e) {}
        if (!fi && popup) { try { const x = popup.document.querySelector('input[type=file]'); if (x) { fi = x; where = '새 창'; } } catch (e) {} } if (!fi) { const x = [...doc.querySelectorAll('input[type=file]')].find((y) => !y.dataset.rnUsed); if (x) { fi = x; where = '화면'; } } }
      if (!fi) return { ok: false, why: '사진 올리기 칸을 찾지 못함' };
      try { const DT = (fi.ownerDocument.defaultView && fi.ownerDocument.defaultView.DataTransfer) || DataTransfer; const dt = new DT(); dt.items.add(file); fi.files = dt.files; fi.dataset.rnUsed = '1'; ['input', 'change'].forEach((t) => fi.dispatchEvent(new Event(t, { bubbles: true }))); } catch (e) { return { ok: false, why: '파일을 넣지 못함: ' + e.message }; }
      for (let i = 0; i < 80; i++) { await sleep(500); const v = ($(field) || {}).value; if (v && v !== before) { try { if (popup && !popup.closed) popup.close(); } catch (e) {} return { ok: true, where }; } if (i === 8 && fi.form && !fi.form.dataset.rnSent) { fi.form.dataset.rnSent = '1'; try { fi.form.submit(); } catch (e) {} } }
      return { ok: false, why: `올렸지만 칸에 사진이 들어오지 않음 (${where})` }; }
    /* 사진 목록 (웹앱 카드의 사진 칸 그대로): 대표 → mainCover · 추가 1~8 → zoomCover0~7 · 설명 안 사진 → 편집기(자동 넣기 없음 — 받아서 편집기 사진 넣기로) · (1.48.0) 예전 계획(subs·desc 이름만)도 읽음 */
    function photoTodo(plan) { const im = plan.images || {}; const out = []; if (im.main && im.main.path) out.push({ field: 'mainCover', x: im.main, label: '대표(기본) 이미지' });
      (im.zoom || []).forEach((x, i) => { if (x && x.path) out.push({ field: 'zoomCover' + i, x, label: '추가 이미지 ' + (i + 1) }); }); (im.subs || []).filter((x) => x && x.path).slice(0, 2).forEach((x, i) => out.push({ field: 'zoomCover' + i, x, label: '추가 이미지 ' + (i + 1) }));
      (im.desc || []).filter((x) => x && x.path).forEach((x, i) => out.push({ field: null, x, label: '설명 안 사진 ' + (i + 1) })); return out; }
    /* (1.50.0) 설명 안 사진(편집기): 사람이 편집기 '사진' 단추를 누르면 뜨는 창(알라딘 편집기 설정 popPageUrl = /scm/upload/wimage_upload_scm.aspx)을
     *  보이지 않는 틀로 열고(그 창의 opener = 이 등록 화면) → 파일 칸에 사진을 넣고 → 그 창의 올리기 단추·폼을 누름 → 올린 뒤 화면의 '넣기·확인' 단추(InsertHtml 부르는 것)를 누름
     *  → 편집기 글에 새 <img>가 들어왔는지 확인. 창 모양은 처음 보는 것이라 화면을 reg_probe/editorImg에 남김(안 맞으면 그걸로 고침) · 안 들어가면 ✗ → 자동 등록은 보내지 않음 */
    async function editorPhoto(file, label) { const getC = () => { try { return W0.Editor.getContent(); } catch (e) { return ''; } }; const nImg = (h) => (String(h || '').match(/<img\b/gi) || []).length; const n0 = nImg(getC());
      let got = null; const nIns = W0.InsertHtml; W0.InsertHtml = function (img) { got = String(img || ''); try { return nIns.apply(W0, arguments); } catch (e) { try { W0.EditorManager.pasteContent(img); } catch (e2) { try { W0.EditorManager.pasteContentBottom(img); } catch (e3) {} } } };
      let res = null, why = ''; const f2 = await fitWidth(file, 570);
      try { try { res = await postUpload('editorImg', '/scm/upload/wimage_upload_scm.aspx', { action: '1', imgalign: '1' }, 'uploadFile', f2); } catch (e) { why = e.message; }
        for (let i = 0; i < 20 && res; i++) { if (got || nImg(getC()) > n0) { await probeUp('editorImg', { ok: true, inserted: (got || '').slice(0, 2000), html: res.html.slice(0, 30000), errs: res.errs }); return { ok: true, note: label }; } await sleep(300); }
        /* 알라딘 화면 스크립트가 넣지 않았을 때: 돌려받은 화면 안의 올린 그림 주소(image.aladin.co.kr …)를 찾으면 그 그림을 편집기에 넣음 */
        if (res) { const m = res.html.match(/https?:\/\/[\w.-]*aladin\.co\.kr\/[^"'\s<>()]+\.(?:jpe?g|png|gif)/i); if (m) { try { W0.InsertHtml(`<img src="${m[0]}">`); } catch (e) {} if (nImg(getC()) > n0) { await probeUp('editorImg', { ok: true, via: 'url', url: m[0], html: res.html.slice(0, 30000), errs: res.errs }); return { ok: true, note: label + ' (주소로 넣음)' }; } }
          await probeUp('editorImg', { ok: false, html: res.html.slice(0, 30000), errs: res.errs }); } }
      finally { W0.InsertHtml = nIns; }
      const old = await editorPhotoOld(file, label); if (old.ok) return old; return { ok: false, why: `${why || '올렸지만 편집기에 안 들어감'}${res && res.errs.length ? ' · ' + res.errs.join(' / ').slice(0, 160) : ''} — 돌려받은 화면을 reg_probe/editorImg에 남김` }; }
    async function editorPhotoOld(file, label) { const before = (() => { try { return W0.Editor.getContent(); } catch (e) { return ''; } })(); const nImg = (h) => (String(h || '').match(/<img\b/gi) || []).length; const n0 = nImg(before); const trace = [];
      let got = null; const nIns = W0.InsertHtml; W0.InsertHtml = function (img) { got = String(img || ''); trace.push('InsertHtml'); try { return nIns.apply(W0, arguments); } catch (e) { try { W0.EditorManager.pasteContentBottom(img); } catch (e2) {} } };
      const fr = doc.createElement('iframe'); fr.style.cssText = 'position:fixed;left:-4000px;top:0;width:560px;height:480px;border:0;opacity:0;pointer-events:none'; const ld = () => new Promise((res) => { const t = setTimeout(() => res(false), 30000); fr.addEventListener('load', () => { clearTimeout(t); res(true); }, { once: true }); });
      let p = ld(); fr.src = '/scm/upload/wimage_upload_scm.aspx'; doc.body.appendChild(fr); const probe = async (stage, dd) => { try { await C('reg_probe').doc('editorImg').set({ [stage]: { at: nowIso(), html: dd && dd.documentElement ? dd.documentElement.outerHTML.slice(0, 60000) : null, trace }, pc: PC_NAME }, { merge: true }); } catch (e) {} };
      try { if (!(await p)) return { ok: false, why: '편집기 사진 창이 열리지 않음' }; const w = fr.contentWindow; try { w.opener = W0; } catch (e) {} const d = fr.contentDocument; await probe('open', d);
        const fi = d.querySelector('input[type=file]'); if (!fi) return { ok: false, why: '편집기 사진 창에 파일 칸이 없음 (화면을 reg_probe에 남김)' };
        try { const dt = new DataTransfer(); dt.items.add(file); fi.files = dt.files; } catch (e) { return { ok: false, why: '파일을 넣지 못함: ' + e.message }; } ['input', 'change'].forEach((t) => fi.dispatchEvent(new Event(t, { bubbles: true }))); trace.push('file');
        await sleep(800); const clickable = (dd, rx) => [...dd.querySelectorAll('button,input[type=button],input[type=submit],input[type=image],a,img,span')].find((el) => rx.test((el.getAttribute('onclick') || '') + ' ' + (el.value || '') + ' ' + (el.textContent || '') + ' ' + (el.alt || '') + ' ' + (el.title || '')));
        if (!got && nImg((() => { try { return W0.Editor.getContent(); } catch (e) { return ''; } })()) <= n0) { const up = clickable(d, /upload|올리기|업로드|첨부|확인|등록|submit/i); p = ld(); if (up) { up.click(); trace.push('click:' + (up.value || up.textContent || up.alt || '').trim().slice(0, 20)); } else { const f = fi.form; if (f) { f.submit(); trace.push('form.submit'); } } await Promise.race([p, sleep(20000)]); }
        for (let i = 0; i < 3 && !got; i++) { await sleep(700); let d2 = null; try { d2 = fr.contentDocument; } catch (e) {} if (!d2) break; if (i === 0) await probe('after', d2); const ins = clickable(d2, /InsertHtml|opener|넣기|삽입|적용|확인/); if (ins) { trace.push('click2:' + (ins.value || ins.textContent || '').trim().slice(0, 20)); try { fr.contentWindow.opener = W0; } catch (e) {} ins.click(); } else break; }
        for (let i = 0; i < 20; i++) { const h = (() => { try { return W0.Editor.getContent(); } catch (e) { return ''; } })(); if (nImg(h) > n0) return { ok: true, note: label }; await sleep(300); }
        await probe('fail', (() => { try { return fr.contentDocument; } catch (e) { return null; } })()); return { ok: false, why: `편집기 글에 사진이 안 들어감 (${trace.join(' → ') || '단계 없음'}) — 창 화면을 reg_probe/editorImg에 남김` }; }
      finally { W0.InsertHtml = nIns; setTimeout(() => { try { fr.remove(); } catch (e) {} }, 1500); } }
    async function attachImages(plan) { const out = []; for (const t of photoTodo(plan)) { if (!t.field) { let r; try { const f = await getPhoto(t.x); r = await editorPhoto(f, t.x.name); } catch (e) { r = { ok: false, why: e.message }; } out.push({ k: t.label, ok: r.ok, note: r.ok ? t.x.name : `${t.x.name} — ${r.why}`, photo: true }); continue; } let r; try { const f = await getPhoto(t.x); r = await attachOne(t.field, f); } catch (e) { r = { ok: false, why: e.message }; } out.push({ k: t.label, ok: r.ok, note: r.ok ? t.x.name : `${t.x.name} — ${r.why}`, photo: true }); } return out; }
    async function newestListing(code) { const P = PR(); const r = await fetch(`/scm/wrecord_edit.aspx?chkItemStockStatus=${code}&chkItemInDate=0&searchCat1=0&searchType=1&keyword=&ViewRowsCount=100&page=1&SortOrder=6&itemStockStatus=${code}&categoryId=0`, { credentials: 'include' }); const d = new DOMParser().parseFromString(await r.text(), 'text/html'); return Math.max(0, ...P.parseScmList(d, new Date().getFullYear()).rows.map((x) => +x.listingId || 0)); }
    /* 보내기 전 기록: 실행 문(exec_log) 시작 → 등록 전 상품 조회 최근 번호(공개 확인 기준) → 맡긴 일 regOne '보냄' + 상품 줄 '확정' (한 번에) — 못 적으면 보내지 않음 */
    async function prep(itemId, it, plan, rep, cmdIdIn) { const X = XC(); if (!X) throw new Error('실행 문 공용 파일이 없음 — 기록 없이 등록하지 않음');
      const tries = (it.tries || 0) + 1; const execKey = `${itemId}#${tries}`; let g; try { g = await X.begin(db, { kind: 'regOne', key: execKey, by: PC_NAME, detail: { title: plan.title || null, price: plan.price, auto: !!cmdIdIn } }); } catch (e) { throw new Error('실행 기록(exec_log)을 못 적어 등록하지 않음 — ' + (e.code || e.message)); }
      if (!g.ok) throw new Error('실행 문이 막음: ' + g.why);
      const sc = { 1: 1, 2: 3, 3: 15 }[+plan.saleState || 1]; let base = 0; try { base = Math.max(await newestListing(1), sc !== 1 ? await newestListing(sc) : 0); } catch (e) {} const cur = +(((await C('prd_system').doc('cursor').get()).data() || {}).maxListingId || 0); base = Math.max(base, cur);
      const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); const cmdId = cmdIdIn || `ro_${itemId}_${tries}`; const row = { isbn: plan.isbn || '', state: +plan.saleState || 1, qty: Math.max(1, +plan.qty || 1), grade: +plan.grade || 2, price: Math.round(+plan.price), title: String(plan.title || '').slice(0, 100), code: plan.code, desc: '', regItem: itemId };
      const ref = C('shp_cmds').doc(cmdId); const b = db.batch();
      b.set(ref, { type: 'regOne', method: plan.method, itemId, auto: !!cmdIdIn, status: 'running', claim: { pc: PC_NAME, tab: TAB, at: nowIso() }, step: 5, sent: true, sentAt: nowIso(), beatAt: nowIso(), rows: [row], n: 1, qty: row.qty, sum: row.price * row.qty, day: today, regDay: today, verify: base ? { base, codes: [sc], until: new Date(Date.now() + 90 * 60000).toISOString(), tries: 0 } : null, fill: rep.map((x) => `${x.ok ? '✓' : '✗'} ${x.k}`).join(' · ').slice(0, 900), ...(cmdIdIn ? {} : { createdAt: nowIso(), by: PC_NAME }), uploadedAt: TS() }, { merge: true });
      b.set(C('reg_items').doc(itemId), { stage: 'done', via: plan.method, cmdId, tries, day: today, confirmedAt: nowIso(), confirmedBy: PC_NAME, result: null, final: { isbn: row.isbn, price: row.price, code: row.code, grade: row.grade, qty: row.qty, state: row.state, desc: '', title: row.title }, uploadedAt: TS() }, { merge: true });
      await b.commit(); // 못 적으면 여기서 멈춤 — 등록하지 않음
      return { cmdId, execKey, ref, X }; }
    /* 알림·확인 창: 사람이 보는 화면은 기록하고 그대로 띄움 · 자동(틀 안)은 기록만 — 확인 창은 '등록·저장하시겠습니까'만 예, 그 밖(중복 경고 등)은 아니오(보내지 않음) */
    function hook(sink, auto) { const nA = W0.alert, nC = W0.confirm;
      W0.alert = function (msg) { sink.push(String(msg).slice(0, 200)); if (!auto) return nA.call(W0, msg); };
      W0.confirm = function (msg) { const m = String(msg); sink.push('(확인) ' + m.slice(0, 200)); if (!auto) return nC.call(W0, msg); return /(등록|저장|진행)\s*하시겠습니까/.test(m) && !/중복|이미|다시/.test(m); }; }
    return { fill, attachImages, attachOne, photoTodo, prep, hook, $ }; }
  window.__rnRegMake = makeFiller;
  /* ── 창 없이 하는 자동 등록 (웹앱 '🤖 자동 등록' → 맡긴 일 regOne auto): 보이지 않는 틀 안에 알라딘 등록 화면을 열고 같은 방법으로 채움 → 못 채운 칸이 하나라도 있으면 보내지 않음 → 보냄 → 화면이 바뀌면 공개 확인 ── */
  let autoChain = Promise.resolve(); /* 한 PC에서 하나씩 (틀이 여럿 동시에 열리지 않게) — 기다리는 일은 1분마다 '살아 있음'(beatAt)을 남겨 지킴이가 멈춘 일로 보지 않게 */
  window.__rnRegAuto = (ref, v, id) => { const hb = setInterval(() => ref.set({ beatAt: nowIso(), waitMsg: '이 PC의 앞 자동 등록이 끝나길 기다림' }, { merge: true }).catch(() => {}), 60000);
    const p = autoChain.then(() => { clearInterval(hb); return regAutoOne(ref, v, id); }).catch((e) => console.warn('[리드나우] 자동 등록', e)).finally(() => clearInterval(hb)); autoChain = p; return p; };
  async function regAutoOne(ref, v, id) { const itemId = v.itemId; await ref.set({ beatAt: nowIso(), waitMsg: null, step: 1 }, { merge: true }).catch(() => {}); const sn = await C('reg_items').doc(itemId).get().catch(() => null); const it = sn && sn.exists ? sn.data() : null;
    const notSent = async (msg, extra) => { await ref.set({ status: 'fail', sent: false, msg: (v.mock ? '🧷 모의 등록 — ' : '자동 등록 — 보내지 않음: ') + msg, doneAt: nowIso(), ...(extra || {}), uploadedAt: TS() }, { merge: true }).catch(() => {}); await C('reg_items').doc(itemId).set(v.mock ? { mockResult: { at: nowIso(), ok: false, msg: '못 채움 — ' + String(msg).slice(0, 200), fill: (extra && extra.fill) || null, kind: 'auto' }, autoCmd: null, uploadedAt: TS() } : { lookErr: '🤖 자동 등록 멈춤: ' + String(msg).slice(0, 200), autoCmd: null, uploadedAt: TS() }, { merge: true }).catch(() => {}); };
    if (!it || !it.plan) return notSent('등록 계획이 없음 — 웹앱에서 다시');
    if (it.stage !== 'pick' || (it.cmdId && it.cmdId !== id)) return notSent('결정 대기가 아님(이미 등록을 보냈거나 옮겨짐)');
    const plan = it.plan; const url = plan.method === 'one' ? `/scm/wrecord.aspx?ISBN=${encodeURIComponent(plan.isbn)}` : '/scm/wrecord.aspx';
    const fr = document.createElement('iframe'); fr.id = 'rnRegAuto_' + TAB + '_' + Date.now().toString(36); fr.style.cssText = 'position:fixed;left:-5000px;top:0;width:1280px;height:1000px;border:0;opacity:0;pointer-events:none'; fr.setAttribute('aria-hidden', 'true');
    const loaded = (ms) => new Promise((res) => { const t = setTimeout(() => res(false), ms); fr.addEventListener('load', () => { clearTimeout(t); res(true); }, { once: true }); });
    const p0 = loaded(60000); fr.src = url; document.body.appendChild(fr); const clean = () => setTimeout(() => { try { fr.remove(); } catch (e) {} }, 3000);
    try { if (!(await p0)) return await notSent('알라딘 등록 화면이 1분 안에 열리지 않음'); await sleep(1500);
      const uf = UW.document.getElementById(fr.id); const W = uf && uf.contentWindow; const d = fr.contentDocument; if (!W || !d || !/wrecord\.aspx/i.test(String(W.location.pathname))) return await notSent('등록 화면이 아님(로그인이 풀렸을 수 있음)');
      const F = makeFiller(d, W, { auto: true }); let rep; try { rep = await F.fill(plan); /* (1.49.0) 사진 칸(대표·추가)의 사진도 넣음 — 넣은 뒤 칸에 사진 주소가 들어왔는지 확인(attachOne) · 하나라도 안 되면 아래에서 보내지 않음 · 설명 안 사진(편집기)은 자동으로 못 넣음 */ const todo = F.photoTodo(plan); if (todo.length) { /* (1.50.0) 설명 안 사진(편집기)도 넣음 — editorPhoto */ await ref.set({ beatAt: nowIso(), step: 2, waitMsg: `사진 ${todo.length}장 넣는 중` }, { merge: true }).catch(() => {}); rep.push(...(await F.attachImages(plan))); } } catch (e) { return await notSent('채우지 못함: ' + e.message); }
      const bad = rep.filter((x) => !x.ok); const fillTxt = rep.map((x) => `${x.ok ? '✓' : '✗'} ${x.k}${x.note && !x.ok ? ' (' + x.note + ')' : ''}`).join(' · ').slice(0, 900);
      if (bad.length) return await notSent('못 채운 칸 ' + bad.map((x) => x.k + (x.note ? ` (${x.note})` : '')).join(', ') + ' — 카드에서 고치거나 \'채워서 열기\'로 직접', { fill: fillTxt });
      if (v.mock) { /* (1.50.0) 🧷 모의 등록: 모든 칸·사진을 채웠으니 여기서 멈춤 — 실행 문·보냄 기록도 만들지 않고, 알라딘 '등록'은 누르지 않음 */ const msg = `알라딘에 보내지 않음 · ${rep.length}칸 모두 채움`; await ref.set({ status: 'done', mock: true, sent: false, step: 4, fill: fillTxt, msg: '🧷 모의 등록 — ' + msg, results: { [itemId]: { state: 'mock', at: nowIso(), msg } }, doneAt: nowIso(), uploadedAt: TS() }, { merge: true }).catch(() => {});
        await C('reg_items').doc(itemId).set({ mockResult: { at: nowIso(), ok: true, msg, fill: fillTxt, kind: 'auto' }, autoCmd: null, lookErr: null, uploadedAt: TS() }, { merge: true }).catch(() => {}); return; }
      let P; try { P = await F.prep(itemId, it, plan, rep, id); } catch (e) { return await notSent(e.message, { fill: fillTxt }); }
      const al = []; F.hook(al, true); const nav = loaded(30000); try { W.frmRecord_submit_C2C(false, '6', plan.method === 'one'); } catch (e) { al.push('보내기 함수 오류: ' + e.message); }
      const went = await nav; const errA = al.some((a) => ERR_RE.test(a) || /^\(확인\)/.test(a));
      if (!went && al.length) { /* 화면이 그대로 + 알림 = 알라딘이 막음 → 보내지 않음으로 되돌림 */
        await P.ref.set({ status: 'fail', sent: false, msg: '알라딘이 입력을 막음: ' + al.join(' / ').slice(0, 300), results: { [itemId]: { state: 'fail', at: nowIso(), msg: al.join(' / ').slice(0, 200) } }, doneAt: nowIso(), uploadedAt: TS() }, { merge: true }).catch(() => {});
        await C('reg_items').doc(itemId).set({ stage: 'pick', cmdId: null, final: null, autoCmd: null, lookErr: '🤖 알라딘 등록 화면: ' + al.join(' / ').slice(0, 200), uploadedAt: TS() }, { merge: true }).catch(() => {});
        await P.X.finish(db, { kind: 'regOne', key: P.execKey }, 'failed', { msg: al.join(' / ') }).catch(() => {}); return; }
      if (!went) return; /* 알림 없이 화면이 그대로 = 아직 모름 → '보냄'으로 둠(지킴이가 15분 뒤 공개 확인) — 되돌리면 두 번 등록될 수 있어서 */
      const ok = !errA; await P.ref.set({ status: 'verify', step: 6, regAt: nowIso(), reg: { alerts: al.slice(0, 5), auto: true }, results: { [itemId]: { state: ok ? 'registered' : 'unknown', at: nowIso(), msg: ok ? null : '알라딘 알림: ' + al.slice(0, 2).join(' / ') } }, uploadedAt: TS() }, { merge: true }).catch(() => {});
      await C('reg_items').doc(itemId).set({ result: { state: ok ? 'registered' : 'unknown', at: nowIso() }, autoCmd: null, uploadedAt: TS() }, { merge: true }).catch(() => {});
      await P.X.finish(db, { kind: 'regOne', key: P.execKey }, ok ? 'done' : 'unknown', { msg: al.join(' / ') || null }).catch(() => {});
    } finally { clean(); } }
  if (window.top !== window || !/\/scm\/wrecord(_edit)?\.aspx/i.test(location.pathname)) return;
  const onRecord = /\/scm\/wrecord\.aspx/i.test(location.pathname); const W0 = UW;
  /* ── ① 보낸 뒤 화면이 바뀌었으면: 그 일을 공개 확인으로 (보낸 뒤 10분 안 · 이 PC) ── */
  (async () => { const pd = GM_getValue(KEY_PEND, null); if (!pd || Date.now() - pd.at > 10 * 60000 || pd.url === location.href && Date.now() - pd.at < 4000) return; await whenAuth(); if (!auth.currentUser) return;
    GM_deleteValue(KEY_PEND); const ref = C('shp_cmds').doc(pd.cmdId); const ok = !(pd.alerts || []).some((a) => ERR_RE.test(a));
    await ref.set({ status: 'verify', step: 6, regAt: pd.sentAt || nowIso(), reg: { alerts: (pd.alerts || []).slice(0, 5), after: location.pathname }, results: { [pd.itemId]: { state: ok ? 'registered' : 'unknown', at: nowIso(), msg: ok ? null : '알라딘 알림: ' + (pd.alerts || []).slice(0, 2).join(' / ') } }, uploadedAt: TS() }, { merge: true }).catch(() => {});
    await C('reg_items').doc(pd.itemId).set({ result: { state: ok ? 'registered' : 'unknown', at: nowIso() }, uploadedAt: TS() }, { merge: true }).catch(() => {});
    const X = XC(); if (X) await X.finish(db, { kind: 'regOne', key: pd.execKey }, ok ? 'done' : 'unknown', { msg: (pd.alerts || []).join(' / ') || null }).catch(() => {}); })();
  if (!onRecord) return;
  /* ── ② 조사 (하루 한 번 · 읽기만): 사진 올리기·등록 함수 원문과 사진 칸 모양 → reg_probe (자동 첨부가 안 맞을 때 고치는 자료) ── */
  (async () => { const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); if (GM_getValue('rn-reg-probe', '') === day) return; await sleep(4000); await whenAuth(); if (!auth.currentUser) return;
    const src = {}; ['imgUp2', 'imgRemove', 'frmRecord_submit', 'frmRecord_submit_C2C', 'setCategory', 'setBookInfo', 'checkAutoIsbn2', 'catPopUp', 'authorSearch', 'openBrand', 'fn_formSet', 'stockStatusChg', 'checkOver1Digit', 'SetIsUniv', 'UnivCategory_Selected', 'FindUnivCategory_Show'].forEach((k) => { try { const f = W0[k]; if (typeof f === 'function') src[k] = String(f).slice(0, 20000); } catch (e) {} });
    let up = null; try { const fr = document.getElementById('imgUploader'); const d = fr && (fr.contentDocument || (fr.contentWindow && fr.contentWindow.document)); up = { src: fr ? fr.getAttribute('src') : null, html: d && d.documentElement ? d.documentElement.outerHTML.slice(0, 30000) : null }; } catch (e) { up = { err: e.message }; }
    const files = [...document.querySelectorAll('input[type=file]')].map((x) => x.outerHTML.slice(0, 300)); const scripts = [...document.querySelectorAll('script[src]')].map((x) => x.src).slice(0, 40);
    try { await C('reg_probe').doc('wrecord_' + day + '_' + TAB).set({ at: nowIso(), pc: PC_NAME, url: location.href, src, uploader: up, files, scripts, uploadedAt: TS() }); GM_setValue('rn-reg-probe', day); } catch (e) {} })();
  const m = location.hash.match(/rnreg=([\w-]+)/); if (!m) return; const itemId = m[1];
  /* ── ③ 판 (사람이 보는 등록 화면) ── */
  const box = document.createElement('div'); box.id = 'rnRegFill'; box.style.cssText = 'position:fixed;right:12px;top:12px;z-index:2147483646;width:360px;max-height:92vh;overflow:auto;background:#fff;border:2px solid #2F5D50;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.25);font:13px/1.5 system-ui,"Malgun Gothic",sans-serif;color:#1E2B28';
  const paint = (html) => { box.innerHTML = `<div style="background:#2F5D50;color:#fff;padding:8px 12px;font-weight:800;display:flex;justify-content:space-between"><span>📥 리드나우 등록 도우미</span><span id="rnRfX" style="cursor:pointer">✕</span></div><div style="padding:10px 12px">${html}</div>`; const x = box.querySelector('#rnRfX'); if (x) x.onclick = () => (box.style.display = 'none'); };
  const mount = () => { if (!box.isConnected) document.body.appendChild(box); }; if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  paint('Firebase에서 등록 계획을 읽는 중…'); const F = makeFiller(document, W0, {});
  async function submit(it, plan, rep) { const P = await F.prep(itemId, it, plan, rep, null);
    const pend = { cmdId: P.cmdId, itemId, execKey: P.execKey, at: Date.now(), sentAt: nowIso(), url: location.href, alerts: [] }; GM_setValue(KEY_PEND, pend);
    const sink = { push: (msg) => { try { const p = GM_getValue(KEY_PEND, null); if (p) { p.alerts = [...(p.alerts || []), msg]; GM_setValue(KEY_PEND, p); } } catch (e) {} } }; F.hook(sink, false);
    W0.frmRecord_submit_C2C(false, '6', plan.method === 'one');
    /* 화면이 그대로면(알라딘이 입력을 막음 = 보내지 않음) 5초 뒤: 알림 글을 보여 주고 이 일은 '보내지 않음'으로 — 다시 고쳐서 누를 수 있게 */
    setTimeout(async () => { const p = GM_getValue(KEY_PEND, null); if (!p || p.cmdId !== P.cmdId) return; const al = p.alerts || []; if (!al.length) return; // 알림 없이 기다리는 중이면 화면이 바뀔 때 처리
      if (al.some((a) => /등록되었|완료/.test(a))) return; GM_deleteValue(KEY_PEND);
      await P.ref.set({ status: 'fail', sent: false, msg: '알라딘이 입력을 막음: ' + al.join(' / ').slice(0, 300), results: { [itemId]: { state: 'fail', at: nowIso(), msg: al.join(' / ').slice(0, 200) } }, doneAt: nowIso(), uploadedAt: TS() }, { merge: true }).catch(() => {});
      await C('reg_items').doc(itemId).set({ stage: 'pick', cmdId: null, final: null, lookErr: '알라딘 등록 화면: ' + al.join(' / ').slice(0, 200), uploadedAt: TS() }, { merge: true }).catch(() => {});
      await P.X.finish(db, { kind: 'regOne', key: P.execKey }, 'failed', { msg: al.join(' / ') }).catch(() => {});
      paint(`<b style="color:#B0322A">알라딘이 등록을 막았습니다</b><div style="margin:6px 0">${al.map(esc).join('<br>')}</div><div>알라딘에 등록되지 않았습니다. 화면에서 고친 뒤 알라딘의 '등록완료'를 직접 누르거나, 웹앱에서 고쳐 다시 여세요.</div>`); }, 5000); }
  (async () => { await whenAuth(); if (!auth.currentUser) return paint('Firebase 로그인이 안 됨 — 수집기 탭에서 로그인한 뒤 다시 여세요');
    const sn = await C('reg_items').doc(itemId).get().catch(() => null); const it = sn && sn.exists ? sn.data() : null; if (!it || !it.plan) return paint('등록 계획을 찾지 못함 — 웹앱에서 다시 \'채워서 열기\'');
    if (it.stage === 'done') return paint('이미 등록을 보낸 상품입니다 (웹앱 확정 탭에서 결과 확인) — 다시 채우지 않음');
    const plan = it.plan; let rep = []; try { rep = await F.fill(plan); } catch (e) { return paint(`<b style="color:#B0322A">채우지 못함</b><div>${esc(e.message)}</div>`); }
    /* (1.48.0) 사진: 자동으로 넣지 않음 — 칸마다 사진을 보여 주고 '받기'(이 PC에 내려받기 → 알라딘 '찾아보기'에서 고름) · '넣기 (시험)'(한 칸만 자동 시도) */
    const todo = F.photoTodo(plan); let photoState = {};
    const photoHtml = () => todo.length ? `<div style="background:#F4F8FE;border:1px solid #B9CCEB;border-radius:8px;padding:6px 8px;margin:6px 0"><b>📷 사진 ${todo.length}장</b> <small style="color:#5B6B66">받기 → 아래 알라딘 사진 칸의 '찾아보기'에서 고름</small>${todo.map((t, i) => `<div style="display:flex;gap:6px;align-items:center;margin-top:4px"><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><b>${esc(t.label)}</b> <small style="color:#5B6B66">${esc(t.x.name)}${t.field ? ' → ' + esc(t.field) : ' → 편집기 사진 넣기'}</small>${photoState[i] ? ` <small style="color:${photoState[i].ok ? '#2F5D50' : '#B0322A'}">${esc(photoState[i].msg)}</small>` : ''}</span><button data-rnpdl="${i}" style="border:1px solid #2F5D50;background:#fff;color:#2F5D50;border-radius:6px;padding:2px 8px;cursor:pointer">받기</button>${t.field ? `<button data-rnpput="${i}" style="border:1px solid #9FB3AC;background:#fff;color:#5B6B66;border-radius:6px;padding:2px 6px;cursor:pointer" title="이 칸에 자동으로 넣어 봄 (시험 — 안 되면 받기로)">넣기</button>` : ''}</div>`).join('')}</div>` : (plan.method === 'new' ? '<div style="color:#A8661B;margin:6px 0">미등록 상품은 대표 이미지가 필수 — 웹앱 카드의 사진 칸에 끌어 놓거나, 화면 아래 \'대표 이미지\'에서 직접 첨부</div>' : '');
    const draw = () => { const bad = rep.filter((x) => !x.ok);
      paint(`<div style="font-weight:800;font-size:14px">${esc(plan.method === 'new' ? '미등록 상품 등록' : '개별 등록')}${plan.univ && plan.univ.on ? ' · 🎓 대학교장터' : ''} · ${esc(plan.title || '')}</div>
      <div style="margin:4px 0;color:#5B6B66">${esc(plan.code)} · ${(+plan.price).toLocaleString()}원 · ${esc({ 1: '최상', 2: '상', 3: '중' }[+plan.grade])} · ${+plan.qty || 1}부</div>
      <div style="margin:6px 0">${rep.map((x) => `<div style="color:${x.ok ? '#2F5D50' : '#B0322A'}">${x.ok ? '✓' : '✗'} ${esc(x.k)}${x.note ? ` <small style="color:#5B6B66">${esc(x.note)}</small>` : ''}</div>`).join('')}</div>
      ${photoHtml()}${bad.length ? `<div style="color:#B0322A;margin:4px 0">✗ 칸은 화면에서 직접 확인·입력</div>` : ''}
      <button id="rnRfGo" style="width:100%;margin-top:6px;padding:10px;border:0;border-radius:8px;background:#B0322A;color:#fff;font-weight:800;font-size:14px;cursor:pointer">확인했음 → 등록완료 (기록 남기고 알라딘에 보냄)</button>
      <div style="color:#5B6B66;font-size:11.5px;margin-top:4px">알라딘의 '등록완료'를 직접 눌러도 등록되지만, 그러면 웹앱이 결과를 모릅니다 — 이 단추로 누르세요.</div>`);
      box.querySelectorAll('[data-rnpdl]').forEach((b) => (b.onclick = async () => { const t = todo[+b.dataset.rnpdl]; b.disabled = true; try { const f = await getPhoto(t.x); const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = (t.field ? t.field + '_' : 'desc_') + (t.x.name || 'photo.jpg').replace(/\.[^.]+$/, '') + '.jpg'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000); photoState[+b.dataset.rnpdl] = { ok: true, msg: '받음' }; } catch (e) { photoState[+b.dataset.rnpdl] = { ok: false, msg: e.message }; } draw(); }));
      box.querySelectorAll('[data-rnpput]').forEach((b) => (b.onclick = async () => { const i = +b.dataset.rnpput; const t = todo[i]; b.disabled = true; b.textContent = '넣는 중'; let r; try { r = await F.attachOne(t.field, await getPhoto(t.x)); } catch (e) { r = { ok: false, why: e.message }; } photoState[i] = { ok: r.ok, msg: r.ok ? '들어감' : '안 됨 — 받기로: ' + r.why }; draw(); }));
      const go = box.querySelector('#rnRfGo'); go.onclick = async () => { go.disabled = true; go.textContent = '보내는 중…'; try { await submit(it, plan, rep); go.textContent = '보냄 — 알라딘 화면 결과를 기다리는 중'; } catch (e) { go.disabled = false; go.textContent = '확인했음 → 등록완료'; alert('등록하지 않음: ' + e.message); } }; };
    draw();
  })();
})();
/* ══════════ (1.47.0) 알라딘 화면의 우리 상품 옆에: ⚠ 취소 주문 기록 · 참고 가격(정가·알라딘 새상품 판매가) · 예스24 중고 링크 ══════════
 * 어디: 상품 조회/수정(wrecord_edit) · 판매관리·주문확인요청(worders·worder_preparatory_complete) — 화면 안의 우리 상품 링크(상품번호 ItemId)마다
 * 자료(웹앱과 같은 곳): 상품 기록 prd_listings(상품번호 → 우리 상품) · 도서 prd_books(정가·새상품 판매가) · 취소 대조 prd_cancel_hits(웹앱이 쌓음) — 이 PC에 12시간 기억 */
(function rnPrdMarks() {
  if (window.top !== window || !/\/scm\/(wrecord_edit|worders|worder_preparatory_complete)\.aspx/i.test(location.pathname)) return;
  if (typeof firebase === 'undefined') return; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const won = (n) => (n > 0 ? Number(n).toLocaleString() : '-');
  const CK = 'rn-prdmarks-cache'; let cache = {}; try { cache = GM_getValue(CK, {}) || {}; } catch (e) {} const fresh = (x) => x && Date.now() - x.t < 12 * 3600e3;
  (async () => { await sleep(1800); if (!firebase.apps.length) return; const auth = firebase.app().auth(); for (let i = 0; i < 30 && !auth.currentUser; i++) await sleep(1000); if (!auth.currentUser) return; const db = firebase.app().firestore();
    const st = document.createElement('style'); st.textContent = '.rnpm{display:inline-flex;gap:4px;align-items:center;flex-wrap:wrap;margin-left:6px;font:11px/1.4 system-ui,"Malgun Gothic",sans-serif;vertical-align:middle}.rnpm .ref{color:#7A8A85}.rnpm .ref s{color:#8E9C98}.rnpm a.y24{color:#1F5FAF;text-decoration:none;border:1px solid #B9CCEB;border-radius:6px;padding:0 5px}.rnpm .cx{background:#B0322A;color:#fff;border-radius:6px;padding:0 6px;font-weight:700;cursor:help}.rnpm .cx.pre{background:#A8661B}'; document.head.appendChild(st);
    const run = async () => { const anchors = new Map(); /* 상품번호(listingId) → 그 상품 이름 칸 */
      document.querySelectorAll('input.batchChkBox').forEach((cb) => { const tr = cb.closest('tr'); const a = tr && (tr.querySelector('a.name2') || tr.querySelector('a')); if (a && cb.value && !anchors.has(cb.value)) anchors.set(String(cb.value), a); });
      document.querySelectorAll('a[href*="wproduct.aspx?ItemId="], a[href*="wproduct.aspx?itemid="]').forEach((a) => { const m = (a.getAttribute('href') || '').match(/ItemId=(\d+)/i); if (m && !anchors.has(m[1]) && a.textContent.trim().length > 1) anchors.set(m[1], a); });
      const ids = [...anchors.keys()].filter((id) => !anchors.get(id).parentNode.querySelector(`.rnpm[data-l="${id}"]`)).slice(0, 200); if (!ids.length) return;
      const need = ids.filter((id) => !fresh(cache[id]));
      for (let i = 0; i < need.length; i += 10) { const part = need.slice(i, i + 10); const vals = [...part, ...part.map(Number).filter((x) => Number.isFinite(x))]; let qs = null; try { qs = await db.collection('prd_listings').where('listingId', 'in', vals.slice(0, 10)).get(); } catch (e) {}
        const got = new Map(); if (qs) qs.forEach((d) => { const v = d.data(); got.set(String(v.listingId), { key: d.id, isbn: v.isbn13 || null, bookId: v.bookId || null, pl: v.priceList || null, title: v.title || '' }); });
        if (got.size < part.length) { try { const q2 = await db.collection('prd_listings').where('listingId', 'in', part.map(Number).filter(Number.isFinite).slice(0, 10)).get(); q2.forEach((d) => { const v = d.data(); if (!got.has(String(v.listingId))) got.set(String(v.listingId), { key: d.id, isbn: v.isbn13 || null, bookId: v.bookId || null, pl: v.priceList || null, title: v.title || '' }); }); } catch (e) {} }
        for (const id of part) { const x = got.get(id) || { key: null }; if (x.bookId) { try { const b = (await db.collection('prd_books').doc(String(x.bookId)).get()).data() || {}; x.pl = x.pl || b.priceList || null; x.ps = b.priceSales || null; x.isbn = x.isbn || b.isbn13 || null; } catch (e) {} }
          if (x.key) { try { const c = (await db.collection('prd_cancel_hits').doc(x.key).get()).data(); x.cx = c && c.hits ? c.hits.map((h) => ({ kind: h.kind, at: h.at, o: h.o })) : null; } catch (e) {} } cache[id] = { ...x, t: Date.now() }; } }
      try { const keep = {}; Object.entries(cache).filter(([, v]) => fresh(v)).slice(-3000).forEach(([k, v]) => (keep[k] = v)); cache = keep; GM_setValue(CK, cache); } catch (e) {}
      for (const id of ids) { const x = cache[id]; const a = anchors.get(id); if (!x || !a || !a.parentNode) continue; const q = x.isbn || (x.title || a.textContent || '').replace(/^\[중고[^\]]*\]\s*/, '').trim();
        const so = (x.cx || []).filter((h) => h.kind === '품절취소'); const other = (x.cx || []).filter((h) => h.kind !== '품절취소');
        const sp = document.createElement('span'); sp.className = 'rnpm'; sp.dataset.l = id;
        sp.innerHTML = `${so.length ? `<span class="cx" title="품절취소 ${so.length}번 (주문을 받고 서가에서 못 찾아 취소) — 지금도 판매중이면 서가 확인: ${esc(so.map((h) => h.at.slice(0, 10) + ' ' + h.o).join(', '))}">⚠ 품절취소 ${so.length}</span>` : ''}${other.length ? `<span class="cx pre" title="${esc(other.map((h) => h.kind + ' ' + h.at.slice(0, 10) + ' ' + h.o).join(', '))}">취소 ${other.length}</span>` : ''}${x.pl || x.ps ? `<span class="ref" title="참고 — 알라딘 새상품(공장에서 바로 온 새책)의 정가·판매가">정가 <s>${won(x.pl)}</s> · 새상품 ${won(x.ps)}</span>` : ''}${q ? `<a class="y24" target="_blank" rel="noopener" href="https://www.yes24.com/Product/Search?domain=USED&query=${encodeURIComponent(q)}" title="예스24 중고 검색">예스24↗</a>` : ''}`;
        if (sp.innerHTML) a.insertAdjacentElement('afterend', sp); } };
    try { await run(); } catch (e) { console.warn('[리드나우] 상품 표시 실패', e); }
    let t = null; new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => run().catch(() => {}), 1500); }).observe(document.body, { childList: true, subtree: true }); })();
})();

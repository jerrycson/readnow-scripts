/* readnow-pc-helper.js — 리드나우 수집기 1.42.0의 모듈 ⑥ 화면 도우미 — 고객 응대 문구
 * Tampermonkey의 '리드나우 수집기' 본체가 @require로 불러옴 (이 파일만 따로 설치하지 않음). 본체와 판이 같아야 함 — 다르면 관제판에 빨간 띠.
 * 원본 한 파일에서 기계로 나눈 것: 모듈을 차례로 이으면 원본 코드와 글자 하나까지 같음 (같은 코드 = 같은 기록). */
;(function (g) { g.ReadnowPcMods = Object.assign(g.ReadnowPcMods || {}, { helper: '1.42.0' }); })(typeof globalThis !== 'undefined' ? globalThis : this);
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

/* col2-compare.js — 그림자 비교 화면
 * 차례: (책마다) 운영 prd_ids/itemId_<번호> → bookId → 운영 prd_books/<bookId> 읽기(읽기만) → 번외 도우미 /read/product(속도 규칙 · 로그인 없음)
 *       → 칸마다 견줌(col2-compare-core) → col2_books/<bookId> 쓰기 → 끝나면 col2_runs 에 한 줄
 * 화면 안 알림만(브라우저 팝업 없음) · 켜기는 두 번 누르기 */
(function () {
  'use strict';
  const C = window.COL2, ST = window.Col2Store, CMP = window.Col2Compare; const $ = (i) => document.getElementById(i);
  const E = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  /* 번외 도우미가 보낸 화면(127.0.0.1:<포트>/compare)이면 같은 출처 · Pages에 올린 화면이면 이 PC 도우미 기본 포트 */
  const HB = /^\/compare/.test(location.pathname) && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(location.origin) ? '' : `http://127.0.0.1:${C.PORT}`;
  const H = { 'X-RN-Col2': '1', 'Content-Type': 'application/json' };
  let tt = 0; const toast = (m) => { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 3200); };
  const hget = async (p) => (await fetch(HB + p, { headers: H, cache: 'no-store' })).json();
  const hpost = async (p, b) => { const r = await fetch(HB + p, { method: 'POST', headers: H, body: JSON.stringify(b || {}) }); const j = await r.json().catch(() => ({ ok: false, err: '응답이 이상함' })); j._code = r.status; return j; };
  $('ver').textContent = 'col2 ' + C.COL2_VER + ' · 시험 환경';

  /* (0.1.1 정범님 11/05 밤 '구글로 로그인이 실패') 이 화면은 Firebase에 로그인하지 않음 — 이 PC에 열린 운영 웹앱(이미 로그인)이 도우미를 거쳐 대신 읽고 씀
   * (운영 칸은 웹앱이 읽기만 · 쓰기는 col2_* 만 — 막이 Col2Store.make 를 그대로 씌움) */
  const S = ST.make(ST.relayDb(hpost));
  const ago = (t) => (t ? Math.max(0, Math.round((Date.now() - t) / 60000)) + '분 전' : '아직 없음');
  function fbShow() { const rl = (HS && HS.relay) || {}; $('fbst').innerHTML = !HS ? '—' : `웹앱이 대신 기록함 · 마지막 기록 ${ago(rl.ackAt)}${rl.outN ? ` · 남은 ${rl.outN}건` : ''}${rl.pullAt && Date.now() - rl.pullAt > 3 * 60e3 ? ' · <span class="wa">웹앱이 ' + ago(rl.pullAt) + '부터 안 보임 — 이 PC에서 리드나우 웹앱을 열어 두세요</span>' : !rl.pullAt ? ' · <span class="wa">아직 웹앱이 안 보임 — 이 PC에서 리드나우 웹앱을 열어 두세요</span>' : ''}${rl.err ? ` · <span class="no">기록 실패: ${E(rl.err)}</span>` : ''}`;
    $('auto').innerHTML = HS && window.autoLine ? window.autoLine(HS) : ''; }

  /* 번외 도우미 상태 */
  let HS = null, arm = 0;
  async function hload() { try { HS = await hget('/status'); const p = HS.pace;
      $('hst').innerHTML = `${HS.on ? '<span class="ok">켜짐</span>' : '<span class="no">꺼짐</span>'} · 번외 크롬 ${HS.alive ? '떠 있음' : '없음'}${HS.alive && !HS.headless ? (HS.shown ? ' · 보이는 중' : ' · 숨김') : ''} · 한 장 뒤 ${Math.round(p.minGapMs / 100) / 10}초 안팎 · 이번 시간 ${p.hourN}/${p.hourCap} · 오늘 ${p.dayN}/${p.dayCap}${p.coolMs ? ' · 쉬는 중' : ''} · 도우미 ${E(HS.ver)}`;
      if (window.__pcShow) window.__pcShow(HS); fbShow();
      $('onb').textContent = arm ? (HS.on ? '한 번 더 누르면 끔' : '한 번 더 누르면 켬') : HS.on ? '⏹ 끄기' : '▶ 켜기'; }
    catch (e) { HS = null; $('hst').innerHTML = '<span class="no">번외 도우미에 닿지 못함</span> — 이 PC에서 번외 도우미가 켜져 있어야 합니다(README 켜는 법)'; } }
  $('onb').onclick = async () => { if (!HS) return toast('번외 도우미에 닿지 못함'); if (!arm) { arm = Date.now(); hload(); setTimeout(() => { if (arm && Date.now() - arm >= 4000) { arm = 0; hload(); } }, 4100); return; }
    arm = 0; const j = await hpost('/cfg', { on: !HS.on }); toast(j.on ? '번외 수집을 켰습니다' : '번외 수집을 껐습니다'); hload(); };
  const winAct = (a) => async () => { const j = await hpost('/win/' + a, { why: '비교 화면' }); toast((j.ok ? '✓ ' : '✗ ') + (j.msg || j.err || '')); hload(); };
  $('showb').onclick = winAct('show'); $('hideb').onclick = winAct('hide'); $('statb').onclick = winAct('status-open');
  /* 작은 창 자리·크기 기억(옮기면 다음에 그 자리) */
  let lastR = ''; setInterval(() => { const v = { p: 'compare', x: screenX, y: screenY, w: outerWidth, h: outerHeight }; const k = JSON.stringify(v); if (k !== lastR && v.w > 200 && v.h > 150 && HB === '') { lastR = k; fetch('/win/hrect', { method: 'POST', headers: H, body: k }).catch(() => {}); } }, 15000);

  /* 읽을 책 */
  const idsOf = () => [...new Set(String($('ids').value).split(/[\s,]+/).map((x) => x.trim()).filter((x) => /^\d{1,13}$/.test(x)))].slice(0, 20);
  $('ids').value = (ST.ls.get('ids', []) || []).join('\n'); $('nsample').value = ST.ls.get('n', 5);
  const BMAP = {}; /* 표본에서 고른 책은 bookId를 이미 앎 */
  $('pickb').onclick = async () => { const n = Math.max(1, Math.min(20, +$('nsample').value || 5)); ST.ls.set('n', n);
    try { const L = (await S.sample('prd_books', n * 3)).filter((b) => b.aladinItemId).slice(0, n); L.forEach((b) => (BMAP[b.aladinItemId] = b.id)); $('ids').value = L.map((b) => b.aladinItemId).join('\n'); toast(`운영 도서 ${L.length}권을 골랐습니다(읽기만 · 웹앱이 넘겨줌)`); }
    catch (e) { toast('운영 도서를 못 읽음: ' + e.message + (e.code ? ` (${e.code})` : '')); } };

  let stop = false; $('stopb').onclick = () => { stop = true; $('prog').textContent = '이 책까지 읽고 멈춥니다'; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function rowHtml(id, prod, r, cmp, err) { const t = (r && r.page && r.page.title) || (prod && prod.title) || ''; const v = err ? `<span class="no">✗</span> ${E(err)}` : cmp.verdict === 'same' ? '<span class="ok">같음</span>' : cmp.verdict === 'noprod' ? '<span class="wa">운영 문서 없음</span>' : `<span class="no">다름</span> ${E(cmp.diffFields.join(', '))}`;
    const det = cmp ? `<details><summary>칸 ${cmp.rows.length}개 · 같음 ${cmp.n.same + cmp.n.seen} · 출처 다름 ${cmp.n.ext} · 다름 ${cmp.n.diff + cmp.n.lack} · 운영 빔 ${cmp.n.fill}</summary><table>${cmp.rows.map((x) => `<tr data-f="${E(x.f)}" data-k="${x.k}"><td>${E(x.f)}</td><td>${E(x.label)}</td><td class="f">운영: ${E(CMP.show(x.prod))}<br>그림자: ${E(CMP.show(x.shadow))}</td></tr>`).join('')}</table></details>` : '';
    return `<tr data-id="${E(id)}" data-v="${err ? 'err' : cmp.verdict}"><td>${E(id)}<br><span class="k">${E(t)}</span></td><td>${v}</td><td>${det}</td></tr>`; }

  $('runb').onclick = async () => { const ids = idsOf(); if (!ids.length) return toast('읽을 상품 번호를 넣어 주세요'); if (!HS || !HS.on) return toast('번외 수집이 꺼져 있음 — 먼저 켜기');
    ST.ls.set('ids', ids); stop = false; $('runb').disabled = true; $('stopb').disabled = false; $('out').innerHTML = ''; const runId = 'r' + Date.now(); const items = []; const t0 = Date.now();
    try { for (let i = 0; i < ids.length && !stop; i++) { const id = ids[i]; $('prog').textContent = `${i + 1}/${ids.length} — ${id} 읽는 중(운영보다 느린 속도)`;
        let bookId = BMAP[id] || null, prod = null; try { if (!bookId) { const x = await S.get('prd_ids', 'itemId_' + id); bookId = x && x.bookId ? x.bookId : null; } if (bookId) prod = await S.get('prd_books', bookId); } catch (e) { toast('운영 문서를 못 읽음: ' + e.message + (e.code ? ` (${e.code})` : '')); }
        let r = await hpost('/read/product', { itemId: id });
        for (let k = 0; k < 3 && !r.ok && r.paced && r.retryMs != null && r.retryMs < 60e3 && !stop; k++) { $('prog').textContent = `${id} — ${r.err} · ${Math.ceil(r.retryMs / 1000)}초 기다림`; await sleep(r.retryMs + 200); r = await hpost('/read/product', { itemId: id }); }
        if (!r.ok) { $('out').insertAdjacentHTML('beforeend', rowHtml(id, prod, r, null, r.err || r.why)); items.push({ itemId: id, bookId, ok: false, why: r.err || r.why || null }); if (r.paced && (r.retryMs == null || r.retryMs >= 60e3)) { toast(r.err); break; } continue; }
        const sh = CMP.pickPage(r.page, C.BOOK_FIXED); const cmp = CMP.compareBook(prod, sh, C.BOOK_FIXED);
        const docId = bookId || 'itemId_' + id;
        try { await S.set('col2_books', docId, { itemId: id, bookId, at: new Date().toISOString(), runId, page: sh, coreVer: r.coreVer || null, alVer: r.alVer || null, helperVer: r.helperVer || null, pc: r.pc || null, ms: r.ms || null, cmp: { verdict: cmp.verdict, n: cmp.n, diffFields: cmp.diffFields } }); }
        catch (e) { toast('col2_books 쓰기 실패: ' + e.message); }
        $('out').insertAdjacentHTML('beforeend', rowHtml(id, prod, r, cmp)); items.push({ itemId: id, bookId, ok: true, verdict: cmp.verdict, diffFields: cmp.diffFields }); }
    } finally { $('runb').disabled = false; $('stopb').disabled = true; }
    const sameN = items.filter((x) => x.verdict === 'same').length, diffN = items.filter((x) => x.verdict === 'diff').length, failN = items.filter((x) => !x.ok).length, noN = items.filter((x) => x.verdict === 'noprod').length;
    $('sum').textContent = `${items.length}권 — 같음 ${sameN} · 다름 ${diffN} · 운영 문서 없음 ${noN} · 못 읽음 ${failN} · ${Math.round((Date.now() - t0) / 1000)}초`; $('prog').textContent = stop ? '멈춤' : '끝';
    try { await S.set('col2_runs', runId, { at: new Date().toISOString(), n: items.length, sameN, diffN, noN, failN, sec: Math.round((Date.now() - t0) / 1000), items, ver: C.COL2_VER }); } catch (e) { toast('col2_runs 쓰기 실패: ' + e.message); }
    hload(); };

  /* 막이 상태(혹시 막은 쓰기가 있으면 보임) */
  setInterval(() => { if (S && S.blocked.length) { $('blk').style.display = ''; } if (S && S.blocked.length) $('blk').innerHTML = `<span class="no">막은 쓰기 ${S.blocked.length}번</span> — ${E(S.blocked.slice(-3).map((b) => b.col).join(', '))} (col2_* 밖은 쓰지 않음)`; }, 1500);
  hload(); setInterval(hload, 5000);
  window.__col2 = { S, idsOf, hload };
})();

/* readnow-pc-ship.js — 리드나우 수집기 1.51.0의 모듈 ④ 출고 — 발송 요청 화면 송장 입력
 * Tampermonkey의 '리드나우 수집기' 본체가 @require로 불러옴 (이 파일만 따로 설치하지 않음). 본체와 판이 같아야 함 — 다르면 관제판에 빨간 띠.
 * 원본 한 파일에서 기계로 나눈 것: 모듈을 차례로 이으면 원본 코드와 글자 하나까지 같음 (같은 코드 = 같은 기록). */
;(function (g) { g.ReadnowPcMods = Object.assign(g.ReadnowPcMods || {}, { ship: '1.51.0' }); })(typeof globalThis !== 'undefined' ? globalThis : this);
/* ══════════ 송장 입력 (1.28.0): 발송 요청 화면(worder_delivery.aspx?orderstep=4)에서 주문마다 송장번호를 넣고 알라딘의 '입력완료'(deliveryNoComplete)를 누름 ══════════
 * 한 번에 한 주문 → 화면이 다시 열리면 결과 확인 → 다음 주문 (진행은 shp_invoices/{id}.items[].state 에 저장: todo → sent → done / fail / missing)
 * 알라딘 화면의 기능을 그대로 씀(새로 만든 요청 없음). 확인 창은 '예'로, 알림 글은 기록으로 남김
 * 이 화면에는 ALPS 업로드 파일 받기 · ALPS 운송장 목록 넣기 단추도 있음 (웹앱 오늘 출고 화면과 같은 기능, 기준은 readnow-shipping-core.js 한 곳) */
(async function rnInvoiceRunner() {
  'use strict';
  if (window.top !== window || !/\/scm\/(worder_delivery|worder_process)\.aspx/i.test(location.pathname)) return;
  const act = GM_getValue('rn-inv-active', null); const DELIV = 'https://www.aladin.co.kr/scm/worder_delivery.aspx?orderstep=4';
  if (/worder_process/i.test(location.pathname)) { if (act) setTimeout(() => { location.href = DELIV; }, 2500); return; } // 입력완료 뒤 거치는 화면이면 발송 요청으로 돌아감
  const SH = window.ReadnowShipping || globalThis.ReadnowShipping; if (!SH || !SH.matchInvoices) return;
  if (!firebase.apps.length) firebase.initializeApp({ apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385', storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15' });
  const db = firebase.app().firestore(); const auth = firebase.app().auth(); const TS = () => firebase.firestore.FieldValue.serverTimestamp(); const PCN = GM_getValue('pcName', '') || (GM_getValue('rn-pc', {}) || {}).name || '';
  const nowIso = () => new Date().toISOString(); const e = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const box = document.createElement('div'); box.id = 'rn-inv-box'; box.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:99999;width:340px;max-height:60vh;overflow:auto;background:#fff;border:2px solid #2F5D50;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.25);font:12.5px/1.5 system-ui,sans-serif;color:#1E2B28;padding:10px';
  document.body.appendChild(box); const say = (h) => { box.innerHTML = `<b style="color:#2F5D50">리드나우 · 송장 입력</b><div style="margin-top:4px">${h}</div>`; };
  await new Promise((r) => { const u = auth.onAuthStateChanged((x) => { u(); r(x); }); });
  if (!auth.currentUser) { say('수집기에서 구글 로그인 후 다시 열어 주세요'); return; }
  const pageOrders = () => SH.parseDeliveryPage(document).orders;
  const xlsxDown = (aoa, name) => { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Sheet1'); XLSX.writeFile(wb, name); };
  const ymdhm = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/^(\d{8})/, '$1_');
  function idle(msg) {
    say(`${msg ? `<div style="margin-bottom:6px">${msg}</div>` : ''}<button id="rn-alps-up" style="width:100%;margin:2px 0;padding:6px;border:1px solid #2F5D50;border-radius:6px;background:#2F5D50;color:#fff;cursor:pointer">① ALPS 업로드 파일 받기</button>
      <label style="display:block;margin-top:6px">② 출력한 운송장 목록 넣기 (ALPS 통합관리 운송장출력 → 엑셀)<input type="file" id="rn-alps-wb" accept=".xlsx,.xls,.csv" style="width:100%"></label><div id="rn-inv-res"></div>`);
    box.querySelector('#rn-alps-up').onclick = async () => { const fd = new URLSearchParams({ status: '4', keywordType: '0', keyword: '', filterType: '0', limitDate: '0', dnb: '0', page: '' });
      try { const rr = await fetch('https://www.aladin.co.kr/scm/worder_excel.aspx', { method: 'POST', body: fd, credentials: 'include' }); const ex = SH.parseAladinOrderExcel(new DOMParser().parseFromString(await rr.text(), 'text/html'));
        if (!ex || !ex.rows.length) return alert('발송 요청 주문이 없습니다'); xlsxDown(SH.alpsUploadAoa(ex), `ALPS업로드_${ymdhm()}.xlsx`); } catch (er) { alert('실패: ' + er.message); } };
    box.querySelector('#rn-alps-wb').onchange = async (ev) => { const f = ev.target.files[0]; if (!f) return; const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' }); const aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false });
      const W = SH.parseAlpsWaybills(aoa); if (!W) return alert('ALPS 운송장 목록 파일이 아닙니다 (운송장번호·수하인명 칸이 없음)'); const M = SH.matchInvoices(pageOrders(), W); const okA = M.byOrder.filter((x) => x.status === 'ok'); const parL = M.byOrder.filter((x) => x.status === 'partial'); let okL = okA; // (1.34.0) '일부만 맞음'은 확인하고 따로
      const res = box.querySelector('#rn-inv-res'); res.innerHTML = `<div style="margin-top:6px">맞춤: <b>${okL.length}</b>건 · 확인 필요 ${M.byOrder.length - okL.length}건 · ALPS에만 있음 ${M.extra.length}줄</div>
        ${M.byOrder.map((x) => `<div style="color:${x.status === 'ok' ? '#2e7d32' : x.status === 'partial' ? '#b58100' : '#B0322A'}">${e(x.recipient)} · ${e(x.invoice || '-')} · ${{ ok: '맞음', partial: '일부 상품만 맞음', many: '운송장 여럿', none: '못 찾음' }[x.status]}</div>`).join('')}
        ${okL.length ? `<button id="rn-inv-one" style="margin-top:6px;padding:5px 8px">1건 먼저 입력해 보기</button> <button id="rn-inv-all" style="padding:5px 8px;background:#2F5D50;color:#fff;border:0;border-radius:5px">맞은 ${okL.length}건 모두 입력</button>` : ''}${parL.length ? ` <button id="rn-inv-par" style="padding:5px 8px">일부만 맞은 ${parL.length}건 확인하고 넣기</button>` : ''}`;
      const start = async (limit) => { if (!confirm(`알라딘 발송 요청에 송장번호 ${limit ? 1 : okL.length}건을 입력하고 '입력완료'를 누릅니다. 진행할까요?`)) return;
        const ref = db.collection('shp_invoices').doc(); await ref.set({ createdAt: nowIso(), by: auth.currentUser.email, from: 'collector', fileName: f.name, limit: limit || 0, status: 'running', claim: { pc: PCN, at: nowIso() },
          items: okL.map((x) => ({ orderNo: x.orderNo, invoice: x.invoice, recipient: x.recipient, match: x.status, state: 'todo' })), skipped: M.byOrder.filter((x) => !okL.includes(x)).map((x) => ({ orderNo: x.orderNo, recipient: x.recipient, status: x.status, invoices: x.invoices })), extra: M.extra.map((w) => ({ invoice: w.invoice, name: w.name, title: w.title, sku: w.sku })), uploadedAt: TS() });
        GM_setValue('rn-inv-active', { id: ref.id, at: Date.now() }); try { sessionStorage.setItem('rn-inv-tab', ref.id); } catch (e) {} step(ref.id); };
      const o1 = box.querySelector('#rn-inv-one'); if (o1) o1.onclick = () => start(1); const oa = box.querySelector('#rn-inv-all'); if (oa) oa.onclick = () => start(0);
      const op = box.querySelector('#rn-inv-par'); if (op) op.onclick = () => { if (!confirm(`상품 일부만 맞은 주문 ${parL.length}건 — 같은 수령인의 다른 상자 송장일 수 있습니다:\n${parL.slice(0, 12).map((x) => `· ${x.recipient} ${x.orderNo} → ${x.invoice || '-'}`).join('\n')}\n\n하나하나 확인했으면 '확인'`)) return; okL = parL; Promise.resolve(start(0)).finally(() => { okL = okA; }); }; };
  }
  async function step(id) {
    const ref = db.collection('shp_invoices').doc(id); const v = (await ref.get()).data();
    if (!v || ['done', 'stopped', 'paused'].includes(v.status)) { GM_deleteValue('rn-inv-active'); return idle(v ? `지난 송장 입력: ${({ done: '끝남', stopped: '멈춤', paused: '첫 건 확인 대기' })[v.status]}` : ''); }
    { const SHx = window.ReadnowShipping || globalThis.ReadnowShipping; let pg = null; try { pg = SHx ? SHx.parseDeliveryPage(document) : null; } catch (er) {} // (1.34.7) 화면을 제대로 읽었을 때만 판단 — 알라딘 오류·점검 화면이면 '끝남/없음'으로 잘못 처리하던 것
      if (!pg || !pg.tabCounts || !Object.keys(pg.tabCounts).length) { const k = +(sessionStorage.getItem('rn-inv-bad') || 0) + 1; sessionStorage.setItem('rn-inv-bad', String(k)); if (k <= 5) { say(`발송 요청 화면을 제대로 못 읽음 — ${k * 5}초 뒤 다시 엶 (${k}/5)`); setTimeout(() => { location.href = DELIV; }, k * 5000); return; } sessionStorage.removeItem('rn-inv-bad'); await ref.set({ status: 'paused', pausedAt: nowIso(), pauseWhy: '발송 요청 화면을 5번 못 읽음', uploadedAt: TS() }, { merge: true }); GM_deleteValue('rn-inv-active'); return idle('발송 요청 화면을 5번 못 읽어 멈춤 — 알라딘 화면을 확인한 뒤 웹앱에서 다시 시작'); }
      sessionStorage.removeItem('rn-inv-bad'); }
    const items = v.items.map((x) => ({ ...x })); const pres = new Map(pageOrders().map((o) => [o.orderNo, o])); const alertMsg = sessionStorage.getItem('rnInvAlert'); sessionStorage.removeItem('rnInvAlert');
    const EXI = window.ReadnowExec || globalThis.ReadnowExec; const exKey = (x) => `${id}:${x.orderNo}:${x.invoice}`; // (1.40.0) 실행도구의 한 문 — 입력완료 전 시작을 적고, 다시 열린 화면에서 결과를 적음
    for (const x of items) if (x.state === 'sent') { const o = pres.get(x.orderNo);
      if (!o || (o.deliveryNo && o.deliveryNo === x.invoice)) { x.state = 'done'; x.doneAt = nowIso(); if (alertMsg) x.note = alertMsg; }
      else { x.tries = (x.tries || 0) + 1; x.err = alertMsg || '입력 뒤에도 발송 요청에 그대로 있음'; x.state = x.tries >= 2 ? 'fail' : 'todo'; }
      if (EXI) await EXI.finish(db, { kind: 'invoice', key: exKey(x) }, x.state === 'done' ? 'done' : 'failed', { msg: x.state === 'done' ? (alertMsg || null) : x.err }).catch(() => {}); }
    const save = (extra) => ref.set({ items, ...(extra || {}), uploadedAt: TS() }, { merge: true });
    const doneN = items.filter((x) => x.state === 'done').length;
    if (v.limit && doneN >= v.limit) { await save({ status: 'paused', pausedAt: nowIso() }); GM_deleteValue('rn-inv-active'); return idle(`첫 ${doneN}건 입력 끝 — 배송&구매확정전 탭에서 송장번호가 맞게 들어갔는지 확인한 뒤, 웹앱 오늘 출고 화면에서 '나머지 계속'을 누르세요.`); }
    let next = null; for (const x of items) { if (x.state && x.state !== 'todo') continue; if (!pres.has(x.orderNo)) { x.state = 'missing'; x.err = '발송 요청에 없음 (이미 입력됐거나 취소)'; continue; } next = x; break; }
    if (!next) { const c = (k) => items.filter((x) => x.state === k).length; await save({ status: 'done', doneAt: nowIso() }); GM_deleteValue('rn-inv-active');
      try { GM_notification({ title: '리드나우 — 송장 입력 끝', text: `입력 ${c('done')} · 실패 ${c('fail')} · 없음 ${c('missing')}` }); } catch (er) {}
      idle(`<b>송장 입력 끝</b>: 입력 ${c('done')} · 실패 ${c('fail')} · 발송 요청에 없음 ${c('missing')}`); if (v.from !== 'collector') setTimeout(() => window.close(), 8000); return; }
    const inp = document.getElementById('deliveryNo.' + next.orderNo); if (!inp) { next.state = 'fail'; next.err = '송장번호 칸을 못 찾음'; await save(); return step(id); }
    say(`송장 입력 중 ${doneN + 1} / ${items.length}<br>${e(next.recipient)} · ${e(next.orderNo)} → <b>${e(next.invoice)}</b><br><button id="rn-inv-stop" style="margin-top:6px">멈추기</button>`);
    box.querySelector('#rn-inv-stop').onclick = async () => { GM_deleteValue('rn-inv-active'); await ref.set({ status: 'stopped', stoppedAt: nowIso(), uploadedAt: TS() }, { merge: true }); location.reload(); };
    await new Promise((r) => setTimeout(r, 1500)); if (!GM_getValue('rn-inv-active', null)) return;
    // (1.34.7) 넣기 직전에 서버 상태를 다시 확인(트랜잭션) — 웹앱에서 '멈추기'를 눌렀으면 넣지 않음 (예전: 멈춤을 'running'으로 덮어써 계속 넣었음)
    next.state = 'sent'; next.sentAt = nowIso(); let go = false; try { await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const cur = sn.data(); if (!cur || ['stopped', 'done', 'paused'].includes(cur.status)) return; tx.set(ref, { items, status: 'running', uploadedAt: TS() }, { merge: true }); go = true; }); } catch (er) { go = false; }
    if (!go) { GM_deleteValue('rn-inv-active'); return idle('송장 입력 멈춤 (웹앱에서 멈추기)'); }
    if (EXI) { let g = null; try { g = await EXI.begin(db, { kind: 'invoice', key: exKey(next), by: PCN, detail: { orderNo: next.orderNo, invoice: next.invoice } }); } catch (er) { g = { ok: true, none: true }; } // 기록 칸 문제로 송장 입력을 막지 않음
      if (!g.ok) { next.state = g.state === 'done' ? 'done' : 'fail'; next.err = '실행 문: ' + g.why; await save(); return step(id); } }
    inp.value = next.invoice;
    const sc = document.createElement('script'); sc.textContent = `(function(){ window.confirm = function(){ return true; }; window.alert = function(m){ try { sessionStorage.setItem('rnInvAlert', String(m)); } catch (e) {} }; deliveryNoComplete(${JSON.stringify(next.orderNo)}); })();`;
    document.body.appendChild(sc);
    setTimeout(() => { if (/worder_delivery/.test(location.pathname)) location.href = DELIV; }, 20000); // 화면이 안 바뀌면 다시 열어 결과 확인
  }
  { const hm = location.hash.match(/rninv=([\w-]+)/); if (hm) { try { sessionStorage.setItem('rn-inv-tab', hm[1]); } catch (e) {} history.replaceState(null, '', location.pathname + location.search); } }
  const mine = (id) => { try { return sessionStorage.getItem('rn-inv-tab') === id; } catch (e) { return false; } }; // (1.34.0) 맡은 탭에서만 진행 — 사람이 다른 발송 요청 탭을 새로 열어도 두 탭이 같이 입력하지 않음
  if (act && Date.now() - act.at < 3 * 3600e3) { if (mine(act.id)) step(act.id); else idle('다른 탭에서 송장 입력 중 — 그 탭이 진행합니다'); } else { if (act) GM_deleteValue('rn-inv-active'); idle(''); }
})();

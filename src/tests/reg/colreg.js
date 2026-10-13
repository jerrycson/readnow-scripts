  /* (1.44.0) 📥 알라딘 대량 등록 (웹앱 '상품 등록'의 일괄 확정 → shp_cmds type 'regBulk' · rows [{isbn, state, qty, grade, price, title, code, desc, regItem}] · 200줄까지)
   *  돈이 걸린 일 — 한 단계라도 어긋나면 알라딘에 등록하지 않고 멈춤:
   *   ⓪ 한 번에 하나(모든 PC): 등록 자리(prd_system/reg_lane)를 잡은 일만 · 다른 등록이 하는 중이면 '차례 기다림'(held)으로 두고 그 일이 끝나면 이어서
   *   ① 실행도구의 한 문(exec_log)에 '시작'을 적을 수 있을 때만 (기록 칸을 못 쓰면 하지 않음 — 같은 일을 두 번 등록하지 않게)
   *   ② 엑셀 = 알라딘 원본 양식(공용 파일 readnow-register-core.js 안)에 줄만 넣어 만듦 → 다시 읽어 넣은 값과 같은지 확인
   *   ③ 등록 전 우리 상품 조회의 가장 최근 상품 번호(기준)를 적어 둠 — 등록 뒤 '새로 생긴 상품'만 찾으려고 (못 읽으면 멈춤)
   *   ④ 대량 등록 화면에 올림 → 미리보기를 읽어 넣은 줄과 ISBN·판매가·코드·품질·수량·판매상태가 하나도 다르지 않고 다른 줄도 없을 때만
   *   ⑤ '보냄'을 먼저 Firebase에 적고(못 적으면 보내지 않음) 우리 줄만 골라 '등록완료'와 같은 요청 → 한 번 보낸 일은 자동으로 다시 하지 않음
   *   ⑥ 공개 확인(한 PC·한 탭만, 3분마다): 상품 조회(최신순)에서 기준보다 새로 올라온(새등록) 상품 중 ISBN·코드·판매가·품질·수량이 맞는 것 → '알라딘에 보임'(U코드)
   *      상품 번호는 한 번만 짝지음(reg_claims) — 손으로 같이 등록한 다른 상품을 우리 것으로 잘못 잡지 않게 · 90분 안에 못 찾으면 '결과 모름'
   *   ⑦ 보이면 '신규 등록분 수집'으로 상품 목록에 넣고 그 상품들의 시장 지표를 맡김(등록 뒤 나머지 수집)
   *   지킴이: 탭이 중간에 닫혀 '하는 중'으로 15분 넘게 조용하면 — 보내기 전이면 '멈춤(등록 안 함)'으로(다시 맡길 수 있음), 보낸 뒤면 공개 확인으로 */
  const RGF = () => window.ReadnowRegister || globalThis.ReadnowRegister || null;
  const BULK_URL = 'https://www.aladin.co.kr/scm/UsedItemBulkReg.aspx';
  const REG_LIST_CODE = { 1: 1, 2: 3, 3: 15 }; // 대량 등록 판매상태(1 판매중·2 일시판매중지·3 판매중지) → 상품 조회 상태 번호
  const REG_ME = () => PC_NAME + ':' + TAB_ID; const REG_LANE = () => C('prd_system').doc('reg_lane'); const REG_LANE_STALE = 20 * 60000;
  const regNotSent = (m) => Object.assign(new Error(m), { notSent: true });
  const regIsbnEq = (a, b) => { a = String(a || '').replace(/[^0-9Xx]/g, '').toUpperCase(); b = String(b || '').replace(/[^0-9Xx]/g, '').toUpperCase(); if (!a || !b) return false; if (a === b) return true; const t = (x) => (x.length === 10 ? '978' + x.slice(0, 9) : x.length === 13 && x.startsWith('978') ? x : null); const k = (x) => (x ? x.slice(0, 12) : null); return !!t(a) && !!t(b) && k(t(a)) === k(t(b)); };
  async function regNewest(codes, beat) { let base = 0; for (const code of [...new Set([1, ...codes])]) { if (beat) await beat(); const g = await lookDoc(listUrl(code, 1)); if (looksLoggedOut(g.finalUrl, g.doc)) throw regNotSent('알라딘 로그인이 풀림 — 샵매니저에 로그인한 뒤 웹앱에서 다시 맡기기'); const r = P.parseScmList(g.doc, new Date().getFullYear()); base = Math.max(base, ...r.rows.map((x) => +x.listingId || 0)); }
    const cur = +(((await C('prd_system').doc('cursor').get()).data() || {}).maxListingId || 0); if (!base && !cur) throw regNotSent('상품 조회 목록을 읽지 못해 등록 전 기준을 못 정함 — 등록하지 않음'); return Math.max(base, cur); }
  async function regItemsSet(rows, results, extra) { try { const b = db.batch(); let n = 0; for (const r of rows) { if (!r.regItem) continue; const x = results[r.regItem]; if (!x) continue; b.set(C('reg_items').doc(r.regItem), { result: x, ...(extra || {}), ...W() }, { merge: true }); n++; } if (n) await b.commit(); } catch (e) { log('등록 결과를 상품 줄에 못 적음: ' + (e.code || e.message), 1); } }
  async function regLane(cmdId, op) { const ref = REG_LANE(); let res = { ok: false, holder: null }; await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const v = sn.exists ? sn.data() : {}; const fresh = v.cmd && Date.now() - Date.parse(v.at || 0) < REG_LANE_STALE;
      if (op === 'take') { if (fresh && v.cmd !== cmdId) { res = { ok: false, holder: v.cmd }; return; } tx.set(ref, { cmd: cmdId, by: REG_ME(), at: nowIso() }); res = { ok: true }; }
      else if (op === 'beat') { if (v.cmd === cmdId) tx.set(ref, { at: nowIso() }, { merge: true }); res = { ok: true }; }
      else if (op === 'free') { if (v.cmd === cmdId) tx.set(ref, { cmd: null, by: null, at: nowIso(), last: cmdId }); res = { ok: true }; } }); return res; }
  async function regHeldToQueued(ref, prev) { await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const v = sn.data() || {}; if (v.status !== 'held' || (prev !== undefined && v.prev !== prev)) return; tx.update(ref, { status: 'queued', claim: null, heldMsg: null, releasedAt: nowIso(), uploadedAt: TS() }); }); } /* 트랜잭션: 그사이 웹앱에서 '맡김 취소'했으면 되살리지 않음 */
  async function regReleaseNext(cmdId) { try { const qs = await C('shp_cmds').where('status', '==', 'held').get(); for (const d of qs.docs) { const v = d.data(); if ((v.type === 'regBulk' || v.type === 'regBulkMock') && v.prev === cmdId) await regHeldToQueued(d.ref, cmdId).catch(() => {}); } } catch (e) {} }
  async function regBulkCmd(ref, v) { const RG = RGF(); const X = EXC(); const rows = Array.isArray(v.rows) ? v.rows : []; const results = {}; const t0 = Date.now(); let laneOk = false;
    const st = (step, extra) => Promise.all([ref.set({ step, beatAt: nowIso(), ...(extra || {}), uploadedAt: TS() }, { merge: true }).catch(() => {}), laneOk ? regLane(ref.id, 'beat').catch(() => {}) : null]);
    const stop = async (msg, extra, state) => { rows.forEach((r) => (results[r.regItem] = { state: state || 'fail', at: nowIso(), msg })); try { await ref.set({ status: 'fail', msg, results, sent: false, doneAt: nowIso(), by: PC_NAME, ...(extra || {}), uploadedAt: TS() }, { merge: true }); } catch (e) { log('멈춤을 적지 못함: ' + (e.code || e.message), 1); } await regItemsSet(rows, results); log(`📥 대량 등록 멈춤 (알라딘에 등록하지 않음): ${msg}`, 1); };
    log(`📥 대량 등록 맡음: ${rows.length}줄 · ${v.qty || rows.length}부 · 판매가 합계 ${(+v.sum || 0).toLocaleString()}원`);
    if (!RG || typeof XLSX === 'undefined' || !XLSX.CFB) return stop('공용 파일 readnow-register-core.js 또는 엑셀 도구(SheetJS)를 못 읽음 — 수집기 탭을 새로고침');
    if (!rows.length || rows.length > 200) return stop(`줄 수가 이상함 (${rows.length}) — 한 번에 1~200줄`);
    if (!X) return stop('실행도구 공용 파일(readnow-exec-core.js)이 없음 — 돈이 걸린 일이라 기록 없이 하지 않음');
    try { const ln = await regLane(ref.id, 'take'); if (!ln.ok) { await ref.set({ status: 'held', prev: ln.holder, claim: null, heldMsg: '다른 등록이 하는 중 — 끝나면 이어서 (한 번에 하나)', uploadedAt: TS() }, { merge: true }); log('📥 다른 대량 등록이 하는 중 — 끝나면 이어서'); return; } laneOk = true; }
    catch (e) { return stop('등록 자리(prd_system/reg_lane)를 못 잡음 — ' + (e.code || e.message)); }
    let sent = false, base = 0; const xend = (s, m, r) => exEnd('regBulk', ref.id, s, m, r);
    try {
      let gate; try { gate = await X.begin(db, { kind: 'regBulk', key: ref.id, by: PC_NAME, detail: { n: rows.length, qty: v.qty || null, sum: v.sum || null }, staleMin: 120 }); } catch (e) { return await stop(`실행 기록(exec_log)을 못 적어 하지 않음 — ${e.code || e.message}${/permission/i.test(e.code || e.message) ? ' (Firestore 규칙에 exec_log 허용 필요)' : ''}`); }
      if (!gate.ok) { if (gate.state === 'done' && v.verify && v.verify.base) { await ref.set({ status: 'verify', msg: '이미 등록한 일 — 공개 확인만 이어감', uploadedAt: TS() }, { merge: true }); return; }
        return await stop('실행 문이 막음: ' + gate.why + ' — 이미 등록됐을 수 있음, 알라딘 상품 조회에서 확인한 뒤 관리도구에서 닫기', { gate: gate.state }, 'unknown'); }
      const codes = [...new Set(rows.map((r) => REG_LIST_CODE[+r.state || 1] || 1))];
      await st(2); const bytes = RG.buildBulkXls(RG.templateBytes(), rows, XLSX.CFB); const vr = RG.verifyBulkXls(bytes, rows, XLSX); if (!vr.ok) throw regNotSent('만든 엑셀을 다시 읽으니 넣은 값과 다름: ' + vr.bad.slice(0, 3).join(' / '));
      base = await regNewest(codes, () => st(2));
      await st(3, { base, codes }); const g0 = await lookDoc(BULK_URL); const p0 = RG.parseBulkPage(g0.doc); if (looksLoggedOut(g0.finalUrl, g0.doc) || !p0.loggedIn) throw regNotSent('알라딘 로그인이 풀림 — 샵매니저에 로그인한 뒤 웹앱에서 다시 맡기기'); if (!p0.hasUpload || !p0.excelKey) throw regNotSent('대량 등록 화면에서 올리기 칸(excelKey)을 못 찾음 — 알라딘 화면이 바뀌었을 수 있음');
      const fd = new FormData(); fd.append('excelFileInputText', `readnow_${ref.id}.xls`); fd.append('excelFileInput', new Blob([bytes], { type: 'application/vnd.ms-excel' }), `readnow_${ref.id}.xls`); fd.append('x', '31'); fd.append('y', '11'); fd.append('excelAction', '1'); fd.append('excelKey', p0.excelKey);
      await PACE.wait(sleep); await st(3); const ac = new AbortController(); const tmo = setTimeout(() => ac.abort(), 120000); let r1; try { r1 = await fetch(BULK_URL, { method: 'POST', body: fd, credentials: 'include', signal: ac.signal }); } catch (e) { throw regNotSent('올리기 응답 없음(2분) — 등록하지 않음: ' + e.message); } finally { clearTimeout(tmo); } const h1 = await r1.text(); const d1 = new DOMParser().parseFromString(h1, 'text/html'); const p1 = RG.parseBulkPage(d1);
      await st(4, { upload: { http: r1.status, n: p1.count, alerts: p1.alerts.slice(0, 5), token: p1.tokenId || null } });
      if (!r1.ok) throw regNotSent(`올리기 실패 (HTTP ${r1.status})`); if (!p1.hasPreview || !p1.tokenId) throw regNotSent('올린 뒤 미리보기가 없음' + (p1.alerts.length ? ' — 알라딘: ' + p1.alerts.slice(0, 3).join(' / ') : ' (파일을 받지 않았을 수 있음)'));
      const m = RG.matchPreview(p1, rows); if (!m.ok) throw regNotSent(`미리보기가 넣은 것과 다름 — 등록하지 않음${m.miss.length ? ` · 빠진 ISBN ${m.miss.slice(0, 5).join(', ')}` : ''}${m.diff.length ? ' · 다름: ' + m.diff.slice(0, 3).join(' / ') : ''}${m.extra.length ? ` · 넣지 않은 줄 ${m.extra.length}개가 미리보기에 있음` : ''}${p1.alerts.length ? ' · 알라딘: ' + p1.alerts.slice(0, 2).join(' / ') : ''}`);
      if (v.mock) { /* (1.50.0) 🧷 모의 등록: 엑셀 만들기·올리기·미리보기 대조까지 했으니 여기서 멈춤 — '등록 완료'는 누르지 않음(알라딘에 안 올라감) · 상품은 결정 대기로 */
        const msg = `알라딘에 보내지 않음 · 엑셀 ${rows.length}줄 만들기·올리기·미리보기 대조 모두 맞음 (미리보기 ${p1.count}줄)`; rows.forEach((r) => (results[r.regItem] = { state: 'mock', at: nowIso(), msg }));
        await ref.set({ status: 'done', mock: true, step: 4, msg: '🧷 모의 등록 — ' + msg, results, doneAt: nowIso(), by: PC_NAME, uploadedAt: TS() }, { merge: true }).catch(() => {});
        try { const b = db.batch(); rows.forEach((r) => r.regItem && b.set(C('reg_items').doc(r.regItem), { stage: 'pick', cmdId: null, final: null, confirmedAt: null, result: null, mockResult: { at: nowIso(), ok: true, msg, kind: 'bulk' }, ...W() }, { merge: true })); await b.commit(); } catch (e) { log('모의 결과를 상품 줄에 못 적음: ' + (e.code || e.message), 1); }
        await xend('failed', '🧷 모의 등록 — 보내지 않음', { n: rows.length, mock: true }); log(`🧷 대량 모의 등록 끝: ${rows.length}줄 — 미리보기 대조까지 맞음, 알라딘에 보내지 않음`); return; }
      const q = new URLSearchParams(); m.pairs.forEach((pk) => q.append('chk_' + pk, pk)); q.append('x', '52'); q.append('y', '14'); q.append('regItemAction', '1'); q.append('tokenId', p1.tokenId);
      /* 보냄 표시는 트랜잭션: 이 일이 아직 '하는 중'이고 이 탭이 맡았고 등록 자리도 이 일일 때만 — 지킴이가 그사이 '멈춤'으로 바꿨거나 다른 곳이 맡았으면 보내지 않음 */
      let mine = false; try { await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const lane = await tx.get(REG_LANE()); const cv = sn.data() || {}; const lv = lane.exists ? lane.data() : {}; if (cv.status !== 'running' || (cv.claim || {}).tab !== TAB_ID || lv.cmd !== ref.id) return;
          tx.update(ref, { step: 5, sent: true, sentAt: nowIso(), beatAt: nowIso(), preview: { n: p1.count }, verify: { base, codes, until: new Date(Date.now() + 90 * 60000).toISOString(), tries: 0 }, uploadedAt: TS() }); tx.set(REG_LANE(), { at: nowIso() }, { merge: true }); mine = true; }); }
      catch (e) { throw regNotSent('보내기 전 기록(보냄 표시)을 못 적음 — 두 번 등록을 막으려고 보내지 않음: ' + (e.code || e.message)); }
      if (!mine) { laneOk = false; log('📥 이 일이 그사이 멈춤 처리됐거나 다른 곳이 맡음 — 등록을 보내지 않음', 1); return; }
      await PACE.wait(sleep); sent = true; const regAt = nowIso(); let h2 = '', http2 = null, al2 = [];
      try { const r2 = await fetch(BULK_URL + '?' + q.toString(), { credentials: 'include' }); http2 = r2.status; h2 = await r2.text(); al2 = RG.pageAlerts(h2); } catch (e) { al2 = ['응답을 못 받음: ' + e.message]; } /* 화면 자체 안내 알림(등록할 상품이 없습니다 등 늘 있는 글)은 빼고 서버가 넣은 알림만 */
      const bad = http2 !== 200 || al2.some((a) => /실패|오류|불가|잘못|없습니다|초과|error/i.test(a)) || (/로그인|wlogin/i.test(h2.slice(0, 3000)) && !/wC2Cuser_logout/.test(h2)); const stt = bad ? 'unknown' : 'registered';
      rows.forEach((r, i) => (results[r.regItem] = { state: stt, at: nowIso(), pkid: m.pairs[i], msg: bad ? `알라딘 답: ${al2.slice(0, 2).join(' / ') || 'HTTP ' + http2} — 공개 확인으로 판단` : null }));
      await ref.set({ status: 'verify', step: 6, regAt, reg: { http: http2, alerts: al2.slice(0, 5) }, results, by: PC_NAME, ms: Date.now() - t0, uploadedAt: TS() }, { merge: true }).catch((e) => log('등록 결과를 못 적음(공개 확인이 이어서 적음): ' + (e.code || e.message), 1));
      await regItemsSet(rows, results); await xend(bad ? 'unknown' : 'done', al2.slice(0, 2).join(' / ') || null, { n: rows.length, http: http2, base });
      log(`📥 대량 등록 ${bad ? '보냄(알라딘 답 확인 필요)' : '완료'}: ${rows.length}줄 — 이제 상품 조회에서 공개 확인 (3분마다, 90분까지)`, bad ? 1 : 0); setTimeout(() => regVerifyAll().catch(() => {}), 60000);
    } catch (e) { if (!sent) { await xend('failed', e.message, null); return await stop(e.message); }
      rows.forEach((r) => (results[r.regItem] = results[r.regItem] || { state: 'unknown', at: nowIso(), msg: '등록 요청 뒤 오류: ' + e.message }));
      await ref.set({ status: 'verify', step: 6, results, msg: '등록 요청 뒤 오류 — 공개 확인으로 판단: ' + e.message, uploadedAt: TS() }, { merge: true }).catch(() => {});
      await xend('unknown', e.message, { base }); log('📥 대량 등록: 등록 요청 뒤 오류 — ' + e.message, 1); }
    finally { if (laneOk) { await regLane(ref.id, 'free').catch(() => {}); await regReleaseNext(ref.id); } } }
  /* 공개 확인·지킴이 — 3분마다 · 읽기만(알라딘을 바꾸지 않음) · 한 일은 한 곳만(lease) */
  let regVerBusy = false;
  async function regLease(ref) { let ok = false; await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const v = sn.data() || {}; const L = v.lease || {}; if (L.by && L.by !== REG_ME() && Date.parse(L.until || 0) > Date.now()) return; tx.set(ref, { lease: { by: REG_ME(), until: new Date(Date.now() + 6 * 60000).toISOString() } }, { merge: true }); ok = true; }); return ok; }
  async function regVerifyAll() { if (regVerBusy || !auth.currentUser || !RGF()) return; regVerBusy = true; const X = EXC();
    try { // ① 지킴이: '하는 중'·'멈춘 일(sweep)'인데 15분 넘게 조용함
      for (const stName of ['running', 'stuck']) { const qs = await C('shp_cmds').where('status', '==', stName).get(); for (const d of qs.docs) { const v = d.data(); if (!['regBulk', 'regOne', 'regBulkMock', 'regOneMock'].includes(v.type)) continue; const quiet = Date.now() - Math.max(Date.parse(v.beatAt || 0) || 0, Date.parse((v.claim || {}).at || 0) || 0, Date.parse(v.createdAt || 0) || 0) > 15 * 60000; if (!quiet || !(await regLease(d.ref))) continue;
          if (v.sent) { await d.ref.set({ status: 'verify', msg: '수집기 탭이 등록 요청 뒤 멈춤 — 공개 확인으로 판단', verify: { ...(v.verify || {}), base: (v.verify || {}).base || v.base || 0, codes: (v.verify || {}).codes || v.codes || [1], until: new Date(Date.now() + 90 * 60000).toISOString() }, uploadedAt: TS() }, { merge: true }); log('📥 지킴이: 등록 요청 뒤 멈춘 일 → 공개 확인으로', 1); }
          else { const res = {}; (v.rows || []).forEach((r) => (res[r.regItem] = { state: 'fail', at: nowIso(), msg: '수집기 탭이 중간에 멈춤 — 알라딘에 등록하지 않음' })); await d.ref.set({ status: 'fail', sent: false, msg: '수집기 탭이 등록 요청 전에 멈춤(탭 닫힘·새로고침) — 알라딘에 등록하지 않음 · 다시 맡길 수 있음', results: res, doneAt: nowIso(), uploadedAt: TS() }, { merge: true });
            if (X && v.type === 'regBulk') await X.finish(db, { kind: 'regBulk', key: d.id }, 'failed', { msg: '보내기 전에 멈춤 (지킴이)' }).catch(() => {}); await regItemsSet(v.rows || [], res); log('📥 지킴이: 보내기 전에 멈춘 등록 → 멈춤(등록 안 함)', 1); }
          await regLane(d.id, 'free').catch(() => {}); await regReleaseNext(d.id); } }
      // ② 차례 기다림: 앞 일이 끝났으면(또는 사라졌으면) 대기로
      { const qs = await C('shp_cmds').where('status', '==', 'held').get(); for (const d of qs.docs) { const v = d.data(); if (v.type !== 'regBulk') continue; const pv = v.prev ? (await C('shp_cmds').doc(v.prev).get()).data() : null; if (!pv || ['verify', 'done', 'fail', 'cancelled'].includes(pv.status)) await regHeldToQueued(d.ref, v.prev).catch(() => {}); } }
      // ③ 공개 확인
      const qs = await C('shp_cmds').where('status', '==', 'verify').get(); for (const d of qs.docs) { const v = d.data(); if (!['regBulk', 'regOne', 'regBulkMock', 'regOneMock'].includes(v.type)) continue; if (!(await regLease(d.ref))) continue; await regVerifyOne(d.ref, v); }
      const q2 = await C('shp_cmds').where('post', '==', 'need').get(); for (const d of q2.docs) { const v = d.data(); if (!['regBulk', 'regOne', 'regBulkMock', 'regOneMock'].includes(v.type) || v.status !== 'done') continue; if (!(await regLease(d.ref))) continue; await regPostCollect(d.ref, v.rows || [], v.results || {}); } }
    catch (e) { log('공개 확인 실패: ' + (e.code || e.message), 1); } finally { regVerBusy = false; } }
  async function regClaim(lid, cmdId, regItem) { let ok = false; const ref = C('reg_claims').doc(String(lid)); await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const v = sn.exists ? sn.data() : null; if (v && !(v.cmd === cmdId && v.regItem === regItem)) return; tx.set(ref, { cmd: cmdId, regItem, at: nowIso(), by: PC_NAME }); ok = true; }); return ok; }
  async function regVerifyOne(ref, v) { const rows = v.rows || []; const results = { ...(v.results || {}) }; const vf = v.verify || {}; const base = +vf.base || 0;
    const pend = rows.filter((r) => !results[r.regItem] || results[r.regItem].state !== 'live'); if (!pend.length) { await ref.set({ status: 'done', doneAt: nowIso(), uploadedAt: TS() }, { merge: true }); return; }
    if (!base) { rows.forEach((r) => { if (!results[r.regItem] || results[r.regItem].state !== 'live') results[r.regItem] = { ...(results[r.regItem] || {}), state: 'unknown', at: nowIso(), msg: '등록 전 기준이 없어 공개 확인을 못 함 — 알라딘 상품 조회에서 확인' }; }); await ref.set({ results, status: 'done', doneAt: nowIso(), uploadedAt: TS() }, { merge: true }); await regItemsSet(rows, results); return; }
    const found = []; const codes = vf.codes && vf.codes.length ? vf.codes : [...new Set(rows.map((r) => REG_LIST_CODE[+r.state || 1] || 1))];
    for (const code of codes) for (let pg = 1; pg <= 6; pg++) { const g = await lookDoc(listUrl(code, pg)); if (looksLoggedOut(g.finalUrl, g.doc)) throw new Error('알라딘 로그인이 풀림'); const L = P.parseScmList(g.doc, new Date().getFullYear()).rows; const nw = L.filter((x) => +x.listingId > base); found.push(...nw.map((x) => ({ ...x, code }))); if (nw.length < L.length || !L.length) break; }
    const used = new Set(Object.values(results).map((x) => x && x.listingId).filter(Boolean).map(String)); let hit = 0; const G = RGF().GRADE;
    for (const r of pend) { const want = { sku: r.code, price: Math.round(+r.price), grade: G[+r.grade || 2], qty: Math.max(1, +r.qty || 1), code: REG_LIST_CODE[+r.state || 1] || 1 };
      const cands = found.filter((x) => !used.has(String(x.listingId)) && String(x.sku || '') === want.sku && +x.price === want.price && x.grade === want.grade && +x.qty === want.qty && x.code === want.code)
        .map((x) => ({ x, isb: r.isbn && (x.isbn13 || x.isbn10) ? regIsbnEq(x.isbn13 || x.isbn10, r.isbn) || regIsbnEq(x.isbn10, r.isbn) : null, /* 미등록 상품(ISBN 없음)은 상품명으로만 */ s: P.nameCoverage ? P.nameCoverage(r.title || '', x.title || '') : 0 }))
        .filter((c) => c.isb === true || (c.isb === null && c.s >= 0.6)).sort((a, b) => (b.isb === true) - (a.isb === true) || b.s - a.s); /* ISBN이 보이면 ISBN이 같아야 · 안 보이면 상품명이 60% 넘게 같아야 */
      for (const c of cands) { if (!(await regClaim(c.x.listingId, ref.id, r.regItem).catch(() => false))) continue; used.add(String(c.x.listingId)); hit++; results[r.regItem] = { ...(results[r.regItem] || {}), state: 'live', at: nowIso(), usedCode: c.x.usedCode || null, listingId: String(c.x.listingId), by: c.isb ? 'isbn' : 'title', msg: null }; break; } }
    const left = rows.filter((r) => !results[r.regItem] || results[r.regItem].state !== 'live').length; const over = vf.until && Date.now() > Date.parse(vf.until);
    if (over && left) rows.forEach((r) => { const x = results[r.regItem]; if (!x || x.state !== 'live') results[r.regItem] = { ...(x || {}), state: 'unknown', at: nowIso(), msg: '90분 안에 상품 조회에서 못 찾음 — 알라딘 상품 조회(코드·판매가)로 확인' }; });
    const done = !left || over; await ref.set({ results, status: done ? 'done' : 'verify', ...(done ? { doneAt: nowIso() } : {}), verify: { ...vf, tries: (vf.tries || 0) + 1, lastAt: nowIso(), by: PC_NAME, foundNew: found.length }, post: hit ? 'need' : v.post || null, uploadedAt: TS() }, { merge: true });
    await regItemsSet(rows, results); if (hit) log(`📥 공개 확인: ${hit}개가 알라딘에 보임 (남은 ${left}개)`);
    if (hit || v.post === 'need') await regPostCollect(ref, rows, results); }
  /* 등록 뒤 나머지 수집: 신규 등록분 수집(상품 목록에 넣음) → 그 상품들 시장 지표를 맡김. 다른 작업 중이면 다음 확인 때 */
  async function regPostCollect(ref, rows, results) { if (running) { await ref.set({ post: 'need' }, { merge: true }).catch(() => {}); return; }
    const had = new Set(((await ref.get()).data() || {}).postKeys || []); const keys = rows.map((r) => results[r.regItem]).filter((x) => x && x.state === 'live' && x.usedCode).map((x) => 'aladin_' + x.usedCode).filter((k) => !had.has(k)); if (!keys.length) { await ref.set({ post: 'done' }, { merge: true }).catch(() => {}); return; }
    await ref.set({ post: 'done', postAt: nowIso(), postKeys: firebase.firestore.FieldValue.arrayUnion(...keys) }, { merge: true }); /* 먼저 적어 두 번 맡기지 않음 */
    await runJob('scanNew'); await C('shp_cmds').add({ type: 'metrics', keys, label: '📥 등록 뒤 시장 지표 (' + keys.length + '개)', status: 'queued', createdAt: nowIso(), by: PC_NAME + ' (등록 뒤 자동)', uploadedAt: TS() }).catch(() => {});
    log(`📥 등록 뒤 나머지 수집: 신규 등록분 수집 끝 → 시장 지표 ${keys.length}개 맡김`); }
  setInterval(() => { regVerifyAll().catch(() => {}); }, 3 * 60000);

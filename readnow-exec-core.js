/* readnow-exec-core.js — 실행도구의 한 문 (개편 4단계 · 공용 파일)
 * 알라딘에 무언가를 바꾸는 일(가격 반영·판매보류·발송준비시작·송장 입력·팔기 장바구니·판매중지)은 모두 이 문을 지나감:
 *   begin  → Firebase exec_log/{종류}__{열쇠} 를 트랜잭션으로 '시작'으로 적음 — 같은 열쇠가 이미 '끝남'이거나 다른 곳이 '하는 중'이면 하지 않음(중복 실행 0)
 *   finish → 결과(끝남·실패·결과 모름)와 알라딘 답을 적음 (모든 실행에 기록)
 *   '시작'으로 남은 채 정한 시간(기본 30분)이 지나면 = 결과 모름 → 자동으로 다시 하지 않고 사람 확인(관리도구 ⑩)
 * 열쇠 = 그 일 하나를 가리키는 값(맡긴 일 번호+주문번호, 결정 시각+상품 등). 같은 결정을 두 번 보내지 않게 하는 것이지, 사람이 새로 결정한 일을 막지 않음.
 * 쓰는 곳: PC 수집기 · 가격 감시기(브라우저 Firebase) · 클라우드(firebase-admin) — 둘 다 db.collection().doc() · db.runTransaction(tx.get/tx.set) 만 씀.
 * 기록은 지우지 않음. 실패 뒤 다시 하면 tries가 늘고 지난 결과는 hist에 쌓임. */
(function (root) {
  const VERSION = '0.1.0';
  const COL = 'exec_log';
  const KINDS = { price: '가격 반영', hold: '판매보류풀로', unhold: '판매보류풀 해제', startDelivery: '발송준비시작', invoice: '송장 입력', c2bAdd: '팔기 장바구니 담기', cashStop: '현금 판매 → 판매중지' };
  const safeId = (s) => String(s).replace(/[\/#?\[\]*.]/g, '_').slice(0, 300);
  const docId = (kind, key) => safeId(kind) + '__' + safeId(key);
  const iso = () => new Date().toISOString();
  /* begin(db, { kind, key, by, detail, staleMin }) → { ok: true, id } | { ok: false, why, state, prev }
   *  · 처음: '시작'으로 적고 ok · '실패'였으면: 다시 '시작'(tries+1) ok · '끝남': 이미 함 → 안 함
   *  · '시작'이고 staleMin(기본 30분) 안: 다른 곳이 하는 중 → 안 함 · 그보다 오래: 결과 모름 → 안 함(사람 확인) */
  async function begin(db, o) { const id = docId(o.kind, o.key); const ref = db.collection(COL).doc(id); let res = null; const now = iso(); const stale = (o.staleMin || 30) * 60000;
    await db.runTransaction(async (tx) => { const sn = await tx.get(ref); const x = sn.exists ? (typeof sn.data === 'function' ? sn.data() : sn.data) : null;
      if (x && x.status === 'done') { res = { ok: false, state: 'done', why: `이미 함 (${x.by || '?'} ${String(x.finishedAt || '').slice(0, 16)})`, prev: x }; return; }
      if (x && x.status === 'started') { const age = Date.now() - Date.parse(x.startedAt || 0); res = age < stale ? { ok: false, state: 'busy', why: `${x.by || '?'}가 하는 중 (${Math.round(age / 60000)}분 전 시작)`, prev: x } : { ok: false, state: 'unknown', why: `${x.by || '?'}가 ${String(x.startedAt || '').slice(0, 16)}에 시작했지만 결과를 못 적음 — 알라딘에서 확인 필요`, prev: x }; return; }
      if (x && x.status === 'unknown') { res = { ok: false, state: 'unknown', why: '결과 모름으로 남아 있음 — 알라딘에서 확인한 뒤 관리도구에서 닫기', prev: x }; return; }
      const hist = x ? [...(x.hist || []), { status: x.status, at: x.finishedAt || x.startedAt || null, by: x.by || null, msg: x.msg || null }].slice(-10) : [];
      tx.set(ref, { kind: o.kind, label: KINDS[o.kind] || o.kind, key: String(o.key), by: o.by || null, status: 'started', startedAt: now, day: now.slice(0, 10), tries: ((x && x.tries) || 0) + 1, detail: o.detail || null, hist, finishedAt: null, msg: null, result: null, cmd: o.cmd || null });
      res = { ok: true, id }; });
    return res; }
  /* finish(db, { kind, key } | id, status('done'|'failed'|'unknown'), { msg, result }) */
  async function finish(db, k, status, extra) { const id = typeof k === 'string' ? k : docId(k.kind, k.key); const e = extra || {};
    await db.collection(COL).doc(id).set({ status, finishedAt: iso(), msg: e.msg != null ? String(e.msg).slice(0, 500) : null, result: e.result || null }, { merge: true }); }
  /* run(db, o, fn): begin → fn() → finish. fn은 { status, msg, result }를 돌려줌(status 없으면 'done'). 던지면 'failed'로 적고 다시 던짐.
   *  begin이 막으면 fn을 부르지 않고 { skipped: true, why, state } */
  async function run(db, o, fn) { const b = await begin(db, o); if (!b.ok) return { skipped: true, why: b.why, state: b.state };
    let r; try { r = (await fn()) || {}; } catch (e) { await finish(db, b.id, 'failed', { msg: e.message }).catch(() => {}); throw e; }
    await finish(db, b.id, r.status || 'done', { msg: r.msg, result: r.result }).catch(() => {}); return { ...r, id: b.id }; }
  // 관리도구: 7일 기록 요약 (rows = exec_log 문서들)
  function summarize(rows, now, staleMin) { const st = (staleMin || 30) * 60000; const by = {}; let open = [], unknown = [];
    for (const x of rows || []) { const k = x.kind || '?'; const o = by[k] || (by[k] = { label: KINDS[k] || k, n: 0, done: 0, failed: 0, unknown: 0, started: 0, retried: 0 }); o.n++; const stl = x.status === 'started' && now - Date.parse(x.startedAt || 0) > st; o[stl ? 'unknown' : x.status] = (o[stl ? 'unknown' : x.status] || 0) + 1; /* 오래된 '시작' = 결과 모름 */ if ((x.tries || 1) > 1) o.retried++;
      if (x.status === 'started' && now - Date.parse(x.startedAt || 0) > st) unknown.push(x); else if (x.status === 'started') open.push(x); if (x.status === 'unknown') unknown.push(x); }
    return { by, open, unknown }; }
  const api = { VERSION, COL, KINDS, docId, begin, finish, run, summarize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ReadnowExec = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

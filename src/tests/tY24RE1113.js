/* tY24RE1113 — (11/13 일꾼 y24re · 헌장 제25조 · FACTS F31) 실패·'저장되지 않음'으로 끝난 예스24 쓰기를 저절로 다시 맡긴 일 줄로
 *  ① 순수 셈(웹앱 ◆y24re y24ReOf·y24RePatch) — 다시 해도 되는 실패만 · 가격 아님 · 문서마다 3번 · n×10분 뒤 · 까닭 남김 — 수집기 다리에 같은 글자로 있는지 · 두 곳을 같은 표로
 *  ② 한 번짜리(y24Re1113Pick) — 11/13 걸린 꼴(JS-MAIN '처음 한 건을 확인하는 중' 두 문서 · HOME 옛 판 '확실하지 않음') · 그 줄의 가장 새 문서만 · re1113 한 번
 *  ③ 수집기 🟦 예스24 쓰기 다리(wRelay1)를 가짜 Firestore·가짜 번외로 돌림 — 번외가 거절한 맡김·'저장되지 않음' 결과 → 같은 문서 hold(새 문서 0) · 확실하지 않음·자체코드 다름은 done
 *  ④ 웹앱 거울 끝(y24PMirrorFin) — 맡은 PC가 제 번외에 바로 맡긴 일도 같은 규칙 · 맡긴 일 줄 처리가 retryAt 전엔 보내지 않음 · 한 번짜리가 그 처리 안에서 불림
 *  ⑤ 번외 0.1.52 — '저장되지 않음' 글에 칸 고침·줄 상태·칸 고칠 수 있음(근원 진단) · 판 번호
 * 실행: node src/tests/tY24RE1113.js (서버·브라우저 필요 없음) · 손님 정보 없음 */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..')].find((p) => fs.existsSync(path.join(p, 'src/app.html')));
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 400))); };
const A = rd('src/app.html'), C = rd('src/readnow-collector.src.js');
const blkA = (A.match(/const Y24_RE_MAX = 3;[\s\S]*?\nfunction y24RePatch\([\s\S]*?\} \}; \}\n/) || [''])[0];
const blkC = (C.match(/    const Y24_RE_MAX = 3;[\s\S]*?\n    function y24RePatch\([\s\S]*?\} \}; \}\n/) || [''])[0];
const mk = (b) => new Function(b + '; return { y24ReOf, y24RePatch, Y24_RE_MAX, Y24_RE_GAP };')();
const row = (o) => ({ rid: 'K1|195142826', rk: 'rk1', no: '195142826', kind: 'qty', to: 1, ...o });
const doc = (o) => ({ k: 'w', job: { id: 'j1', rows: [row()] }, at: '2026-11-13T00:52:28.051Z', ...o });

(async () => {
console.log('① 순수 셈 — 웹앱·수집기 같은 글자');
ok(!!blkA && !!blkC, '두 곳에 덩어리 있음');
ok(blkA.replace(/^ {4}/mg, '') === blkC.replace(/^ {4}/mg, ''), '웹앱 ◆y24re와 수집기 다리의 셈이 글자 그대로 같음');
for (const [nm, F] of [['웹앱', mk(blkA)], ['수집기', mk(blkC.replace(/^ {4}/mg, ''))]]) {
  const T0 = Date.parse('2026-11-13T05:00:00Z');
  const busy = { state: 'fail', pre: true, msg: '처음 한 건을 확인하는 중 — 그 결과를 본 뒤 이어 맡김(첫 실행은 1건 확인 뒤)' };
  const p1 = F.y24RePatch(doc(), busy, 'HOME', T0);
  ok(p1 && p1.st === 'hold' && p1.reN === 0 && p1.busyN === 1 && Date.parse(p1.retryAt) === T0 + 10 * 60e3 && /처음 한 건/.test(p1.holdWhy) && /기다림 1\/24/.test(p1.holdWhy) && p1.lastRej.err && p1.lastRes === busy && p1.res === null && p1.ok === null && p1._t && /되돌림\(기다림 1\/24\)/.test(p1._t.m), `${nm}: 번외가 '처음 한 건 확인 중'(앞 맡김 하는 중)으로 거절 → 같은 문서 hold · 되돌림 3번은 안 씀(기다림 1/24) · 10분 뒤 · 까닭 남김`, p1);
  ok(F.y24RePatch(doc({ reN: 3, busyN: 5 }), busy, 'HOME', T0).busyN === 6 && F.y24RePatch(doc({ busyN: 24 }), busy, 'HOME', T0) === null, `${nm}: 기다림은 3번을 다 써도 이어 감 · 24번(≈4시간) 넘으면 끝`);
  const notSaved = { state: 'fail', rows: { 'K1|195142826': { state: 'fail', pre: true, same: true, msg: '눌렀지만 예스24가 아무 물음·알림도 안 띄웠고 등록상품 목록 값도 그대로 판매중·2권·45000원(바라는 값 수량 1권) — 저장되지 않음' } } };
  const p2 = F.y24RePatch(doc({ reN: 1 }), notSaved, 'HOME', T0); ok(p2 && p2.reN === 2 && Date.parse(p2.retryAt) === T0 + 20 * 60e3, `${nm}: '저장되지 않음' → 2/3 · 20분 뒤`, p2);
  ok(F.y24RePatch(doc({ reN: 3 }), notSaved, 'HOME', T0) === null, `${nm}: 3번 넘으면 되돌리지 않음(사람 확인 · 되풀이 0)`);
  ok(F.y24RePatch(doc({ job: { id: 'j', rows: [row({ kind: 'price', src: 'price', to: 9000 })] } }), notSaved, 'HOME', T0) === null, `${nm}: 💲 판매가 맡김은 저절로 다시 하지 않음(예전처럼 끝)`);
  ok(F.y24RePatch(doc({ job: { id: 'j', rows: [row({ rk: '' })] } }), busy, 'HOME', T0) === null, `${nm}: 할 일 열쇠(rk) 없는 줄은 다시 셀 수 없어 되돌리지 않음`);
  ok(F.y24RePatch(doc({ k: 'relogin' }), busy, 'HOME', T0) === null, `${nm}: 다시 로그인·이어 가기 맡김은 아님`);
  ok(F.y24RePatch(doc(), { state: 'unsure', msg: '눌렀지만 등록상품 목록 값이 판매중·2권(바라는 값 수량 1권) — 예스24 알림: 저장되었습니다.' }, 'HOME', T0) === null, `${nm}: '확실하지 않음'(알림이 떴는데 그대로)은 끝 · 사람 확인`);
  ok(F.y24RePatch(doc(), { state: 'fail', msg: '누른 뒤 오류 — x' }, 'HOME', T0) === null, `${nm}: 누른 뒤 실패(pre 아님)는 끝`);
  ok(F.y24RePatch(doc(), { state: 'fail', pre: true, msg: '예스24 195968648의 자체코드가 이미 PNKLUX — 장부가 이은 실물과 달라 아무것도 누르지 않음' }, 'HOME', T0) === null, `${nm}: 다시 해도 소용없는 까닭(자체코드가 이미 다름)은 끝`);
  { const q = F.y24RePatch(doc({ reN: 3 }), { state: 'fail', pre: true, stop: true, msg: '⛔ 예스24 쓰기 멈춤 — x' }, 'HOME', T0); ok(q && q.busyN === 1 && q.reN === 3, `${nm}: 쓰기 멈춤으로 받지 못한 것은 기다림(닫지 않음 · 3번을 쓰지 않음 · 멈춤이 풀리면 돎)`, q); }
  ok(F.y24RePatch(doc(), { state: 'fail', pre: true, msg: 'HOME 번외 도우미(127.0.0.1:8797)에 닿지 못함 — 아무것도 안 누름' }, 'HOME', T0).reN === 1 && F.y24RePatch(doc({ reN: 2 }), notSaved, 'HOME', T0).reN === 3, `${nm}: 번외에 닿지 못함 → 되돌림`);
  ok(F.y24RePatch(doc(), { state: 'fail', pre: true, msg: '맡긴 지 95분 지나 HOME가 받음 — 그사이 재고가 바뀌었을 수 있어 넘기지 않음(아무것도 안 누름) · 늦음 되돌림 3번을 다 씀 — 사람 확인' }, 'HOME', T0) === null, `${nm}: 늦음 되돌림을 다 쓴 맡김은 여기서도 되돌리지 않음(led4 규칙과 겹치지 않음)`);
  const two = doc({ job: { id: 'j', rows: [row(), row({ rid: 'K2|195968648', rk: 'rk2', no: '195968648' })] } });
  ok(F.y24RePatch(two, { state: 'part', rows: { 'K1|195142826': { state: 'done', msg: 'ok' }, 'K2|195968648': notSaved.rows['K1|195142826'] } }, 'HOME', T0).reN === 1, `${nm}: 여러 줄 중 한 줄만 '저장되지 않음'이면 문서째 되돌림(된 줄은 보내기 직전 다시 셈에서 '할 일 없음'으로 닫힘)`);
  ok(F.y24RePatch(two, { state: 'unsure', rows: { 'K1|195142826': { state: 'unsure', msg: 'x' }, 'K2|195968648': notSaved.rows['K1|195142826'] } }, 'HOME', T0) === null, `${nm}: 한 줄이라도 확실하지 않음이면 되돌리지 않음`);
  ok(F.y24RePatch(doc(), { state: 'done', rows: { a: { state: 'done' } } }, 'HOME', T0) === null, `${nm}: 성공은 그대로`);
  ok(F.y24RePatch(doc(), busy, 'HOME', T0, 0).retryAt === new Date(T0).toISOString(), `${nm}: gap 0이면 바로(한 번짜리 되돌림)`); }

console.log('② 한 번짜리 — 걸린 두 건');
{ const m = A.match(/const Y24_RE1113_END = [^\n]*\nfunction y24Re1113Pick[\s\S]*?\n    if \(y24ReOf\(d, res\)\) out\.push\(\{ d, res \}\); \} return out; \}\n/); ok(!!m, 'y24Re1113Pick 있음');
  const P = new Function(blkA + (m ? m[0] : '') + '; return { y24Re1113Pick, Y24_RE1113_END };')();
  ok(P.Y24_RE1113_END === Date.parse('2026-11-16T00:00:00+09:00'), '11/16 0시 뒤엔 돌지 않음(한 번짜리)');
  const busyRes = { state: 'fail', pre: true, msg: '처음 한 건을 확인하는 중 — 그 결과를 본 뒤 이어 맡김(첫 실행은 1건 확인 뒤)' };
  const A1 = { id: 'y24w-261113005226kh9', st: 'done', by: 'JS-MAIN', at: '2026-11-13T00:52:28.051Z', doneAt: '2026-11-13T00:52:54.928Z', ok: false, k: 'w', job: { id: 'y24w-261113005226kh9', rows: [row()] }, res: busyRes };
  const A2 = { id: 'y24w-261113005229chg', st: 'done', by: 'JS-MAIN', at: '2026-11-13T00:52:30.139Z', doneAt: '2026-11-13T00:52:55.138Z', ok: false, k: 'w', job: { id: 'y24w-261113005229chg', rows: [row({ rid: 'K2|195968648', rk: 'rk2', no: '195968648' })] }, res: busyRes };
  const OLD = { id: 'y24w-261112115511z2e', st: 'done', by: 'HOME', at: '2026-11-12T11:55:11.427Z', doneAt: '2026-11-13T02:07:15.683Z', k: 'w', job: { id: 'y24w-261112115511z2e', rows: [row()] }, res: { state: 'unsure', rows: { 'K1|195142826': { state: 'unsure', msg: '눌렀지만 등록상품 목록 값이 판매중·2권·45000원(바라는 값 수량 1권)' } }, msg: '맡은 PC 번외 결과 — ❓ 확실하지 않음' } };
  const got = P.y24Re1113Pick([OLD, A1, A2], []).map((x) => x.d.id).sort();
  ok(JSON.stringify(got) === JSON.stringify(['y24w-261113005226kh9', 'y24w-261113005229chg']), '두 줄 각각 가장 새 문서(JS-MAIN 00:52 두 맡김)만 되돌림 — 옛 HOME 문서는 같은 줄이라 건드리지 않음', got);
  const only = P.y24Re1113Pick([OLD], []); ok(only.length === 1 && only[0].res.state === 'fail' && only[0].res.rows['K1|195142826'].same === true, "옛 판이 '확실하지 않음'으로 닫은 '눌렀지만 목록 값이 그대로(알림 없음)'는 '저장되지 않음'으로 바로잡아 되돌림", only[0] && only[0].res);
  ok(P.y24Re1113Pick([{ ...OLD, res: { state: 'unsure', rows: { x: { state: 'unsure', msg: '눌렀지만 등록상품 목록 값이 2권 — 예스24 알림: 저장되었습니다.' } } } }], []).length === 0, '예스24 알림이 있었던 확실하지 않음은 되돌리지 않음');
  ok(P.y24Re1113Pick([A1], [{ id: 'hold1', st: 'hold', at: '2026-11-13T03:00:00Z', job: { rows: [row()] } }]).length === 0, '같은 줄의 새 맡김이 줄에 있으면(기다림·하는 중) 끝난 옛 문서는 되돌리지 않음(겹침 0)');
  ok(P.y24Re1113Pick([{ ...A1, re1113: 'x', res: { state: 'already', msg: '할 일 없음' } }], []).length === 0 && P.y24Re1113Pick([{ ...A1, re1113: 'x', reN: 3 }], []).length === 1 && P.y24Re1113Pick([{ ...A1, re1113g: 'x' }], []).length === 0 && P.y24Re1113Pick([{ ...A1, re1113: 'x', reN: 3, res: { state: 'fail', rows: { 'K1|195142826': { state: 'fail', pre: true, same: true, msg: '눌렀지만 예스24가 저장했다는 말 없이(화면 상자: 경고 × 수정한 상품이 없습니다. 확인 [×]) 등록상품 목록 값도 그대로 — 저장되지 않음' } } } }], []).length === 1 && P.y24Re1113Pick([{ ...A1, re1113: 'x', res: { state: 'fail', pre: true, msg: '⛔ 예스24 쓰기 멈춤 — 눌렀지만 등록상품 목록 값이 판매중·2권 — 예스24 알림: 화면 상자: 경고 × [×] · 칸 고침 setValue · 줄 상태 updated · 칸 고칠 수 있음 아니오' } }], []).length === 1 && P.y24Re1113Pick([{ ...OLD, re1113: 'x', res: { state: 'unsure', rows: { 'K1|195142826': { state: 'unsure', msg: '눌렀지만 등록상품 목록 값이 판매중·2권 — 예스24 알림: 화면 상자: 경고 × [×] · 칸 고침 setValue · 줄 상태 updated · 칸 고칠 수 있음 아니오' } } } }], []).length === 1 && P.y24Re1113Pick([{ ...A1, st: 'hold' }], []).length === 0 && P.y24Re1113Pick([{ ...A1, ok: true }], []).length === 0, "이미 되돌린 문서(re1113b · 첫 판에서 되돌렸는데 '할 일 없음'으로 닫힌 것)·끝나지 않은 문서·성공은 아님 · 첫 판이 '앞 맡김 하는 중'으로 3번을 다 쓰고 닫은 문서는 한 번 더");
  ok(/where\('doneAt', '>=', new Date\(Date\.now\(\) - 48 \* 3600e3\)\.toISOString\(\)\)\.limit\(150\)/.test(A) && /localStorage\.getItem\('rn-y24re1113g'\)/.test(A) && /if \(c\.st !== 'done' \|\| c\.re1113g\) return;/.test(A) && /reN: Math\.min\(\+P0\.reN \|\| 0, Y24_RE_MAX - 1\)/.test(A) && /y24RePatch\(c, pk\.res, me, Date\.now\(\), 0\)/.test(A), '지난 48시간 끝난 맡김만 · 기기마다 한 번 · 문서마다 트랜잭션으로 한 번(re1113) · 바로 보냄');
  ok(/const Y24_RE1113_NEED = '0\.1\.55'/.test(A) && /if \(vn\(hv\) < vn\(Y24_RE1113_NEED\)\) return;/.test(A), '맡은 PC 번외가 0.1.55(사람처럼 더블 클릭)를 받은 뒤에만 되돌림 — 옛 판에서 셈을 헛되이 쓰지 않음');
  ok(/await y24Re1113\(\); \/\* \(y24re\)/.test(A), '맡긴 일 줄 처리(ledY24HoldRetry — 1분마다 · 로거·출고 중 PC 빼고) 안에서 불림'); }

console.log('③ 수집기 다리 — 가짜 Firestore·가짜 번외');
{ const i0 = C.indexOf("    const W_CMD = 'col2_y24_cmd'"), i1 = C.indexOf('    G.__rnC2yWRelay = wRelay;'); ok(i0 > 0 && i1 > i0, '다리 덩어리');
  const run = async (docs, net) => { const D = JSON.parse(JSON.stringify(docs)); const writes = []; const ins = [];
    const ref = (id) => ({ id, get: async () => ({ exists: !!D[id], data: () => D[id] }), set: async (v, o) => { writes.push([id, v]); const c = D[id] || {}; for (const [k, x] of Object.entries(v)) { if (x && x.__au) c[k] = [...(c[k] || []), ...x.__au]; else c[k] = x; } D[id] = c; } });
    const fsx = { collection: () => ({ doc: (id) => { if (!D[id]) ins.push(id); return ref(id); }, where: (f, op, v) => ({ limit: () => ({ get: async () => ({ docs: Object.keys(D).filter((id) => D[id][f] === v).map((id) => ({ id, ref: ref(id), data: () => D[id] })) }) }) }) }),
      runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v, o) => r.set(v, o) }) };
    const G = {}; const firebase = { firestore: Object.assign(() => fsx, { FieldValue: { arrayUnion: (...a) => ({ __au: a }) } }) };
    const GM_xmlhttpRequest = (o) => { const p = o.url.replace('http://127.0.0.1:8797', ''); const r = net(p, o.data ? JSON.parse(o.data) : null); setTimeout(() => (r == null ? o.onerror() : o.onload({ status: r._st || 200, responseText: JSON.stringify(r) })), 0); };
    const window = { __rnLog: () => {} }; const f = new Function('G', 'firebase', 'GM_xmlhttpRequest', 'window', 'C2Y', C.slice(i0, i1) + '; return wRelay1;')(G, firebase, GM_xmlhttpRequest, window, 'http://127.0.0.1:8797');
    await f('HOME'); return { D, writes, ins }; };
  const now = new Date().toISOString(); const busyR = { ok: false, _st: 409, err: '처음 한 건을 확인하는 중 — 그 결과를 본 뒤 이어 맡김(첫 실행은 1건 확인 뒤)' };
  const n1 = { k: 'w', st: 'new', holder: 'HOME', at: now, job: { id: 'jA', rows: [row()] } };
  let r = await run({ jA: n1 }, (p) => (p === '/y24/w/put' ? busyR : null));
  ok(r.D.jA.st === 'hold' && r.D.jA.reN === 0 && r.D.jA.busyN === 1 && /처음 한 건/.test(r.D.jA.holdWhy) && r.D.jA.retryAt > now && r.D.jA.tookBy === null && (r.D.jA.trail || []).some((t) => /기다림 1\/24/.test(t.m)) && r.ins.length === 0, "번외가 '처음 한 건 확인 중'으로 거절 → 같은 문서 hold(새 문서 0) · 자취", r.D.jA);
  r = await run({ jA: { ...n1, job: { id: 'jA', rows: [row({ kind: 'price', src: 'price', to: 9000 })] } } }, (p) => (p === '/y24/w/put' ? busyR : null));
  ok(r.D.jA.st === 'done' && r.D.jA.ok === false, '💲 판매가 맡김은 예전처럼 끝(done · 못 함)', r.D.jA);
  r = await run({ jA: { ...n1, reN: 3 } }, (p) => (p === '/y24/w/put' ? { ok: false, err: 'HOME 번외에 닿지 못함' } : null)); ok(r.D.jA.st === 'done', '3번 다 쓴 문서는 끝');
  { let put = 0; r = await run({ jA: { ...n1, retryAt: new Date(Date.now() + 600e3).toISOString(), reN: 1 } }, (p) => { if (p === '/y24/w/put') put++; return busyR; }); ok(r.D.jA.st === 'hold' && put === 0 && r.D.jA.reN === 1 && !r.D.jA.busyN, '옛 웹앱이 retryAt 전에 다시 보내도 다리가 넘기지 않고 줄로 되돌림(셈 그대로)', r.D.jA); }
  const run1 = { k: 'w', st: 'run', holder: 'HOME', at: now, tookBy: 'HOME', runAt: now, job: { id: 'jB', rows: [row()] } };
  const notSaved = { state: 'fail', rows: { 'K1|195142826': { state: 'fail', pre: true, same: true, msg: '눌렀지만 예스24가 아무 물음·알림도 안 띄웠고 등록상품 목록 값도 그대로 판매중·2권·45000원(바라는 값 수량 1권) — 저장되지 않음 · 칸 고침 setValue · 줄 상태 none · 칸 고칠 수 있음 아니오' } }, msg: 'x' };
  let acked = null; r = await run({ jB: run1 }, (p, b) => { if (p === '/y24/w/state') return { ok: true, res: { jB: notSaved }, wait: [], cur: null }; if (p === '/y24/w/ack') { acked = b; return { ok: true }; } return null; });
  ok(r.D.jB.st === 'hold' && r.D.jB.reN === 1 && r.D.jB.lastRes && r.D.jB.lastRes.rows['K1|195142826'].same === true && /줄 상태 none/.test(r.D.jB.lastRes.rows['K1|195142826'].msg) && acked && acked.ids[0] === 'jB', "번외 결과 '저장되지 않음' → 같은 문서 hold · 결과는 lastRes에(근원 진단 글 그대로) · 번외 결과는 받음(ack)", r.D.jB);
  r = await run({ jB: run1 }, (p) => (p === '/y24/w/state' ? { ok: true, res: { jB: { state: 'unsure', rows: { 'K1|195142826': { state: 'unsure', msg: '눌렀지만 확인하지 못함' } } } }, wait: [] } : { ok: true }));
  ok(r.D.jB.st === 'done' && r.D.jB.ok === false && !r.D.jB.reN, '확실하지 않음은 예전처럼 done(사람 확인)', r.D.jB);
  r = await run({ jB: run1 }, (p) => (p === '/y24/w/state' ? { ok: true, res: { jB: { state: 'done', rows: { 'K1|195142826': { state: 'done', msg: '수량 1권 — 확인' } } } }, wait: [] } : { ok: true }));
  ok(r.D.jB.st === 'done' && r.D.jB.ok === true, '성공은 done · ✅'); }

console.log('④ 웹앱 거울 끝·맡긴 일 줄 처리');
{ const m = A.match(/const y24PFinOf = [\s\S]*?\nasync function y24PMirrorFin\(R\) \{[^\n]*\n/); ok(!!m, 'y24PMirrorFin 있음');
  const D = { jL: { k: 'w', st: 'local', at: '2026-11-13T03:00:00Z', job: { id: 'jL', rows: [row()] }, trail: [] } };
  const ref = (id) => ({ get: async () => ({ data: () => D[id] }), set: async (v) => { D[id] = { ...D[id], ...v }; } });
  const db = { collection: () => ({ doc: (id) => ref(id) }), runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v) => r.set(v) }) };
  const S = { y24p: { L: [] } };
  const f = new Function('db', 'S', 'deviceName', 'Y24W_CMD', blkA + m[0] + '; return y24PMirrorFin;')(db, S, () => 'HOME', 'col2_y24_cmd');
  await f({ jL: { 'K1|195142826': { st: 'fail', msg: '… — 저장되지 않음', pre: true, same: true } } });
  ok(D.jL.st === 'hold' && D.jL.reN === 1 && D.jL.retryAt && D.jL.trail.length === 1 && /되돌림/.test(D.jL.trail[0].m), "맡은 PC가 제 번외에 바로 맡긴 일도 '저장되지 않음' → 같은 문서 hold", D.jL);
  D.jM = { k: 'w', st: 'local', at: '2026-11-13T03:00:00Z', job: { id: 'jM', rows: [row()] }, trail: [] }; await f({ jM: { 'K1|195142826': { st: 'unsure', msg: '확실하지 않음' } } });
  ok(D.jM.st === 'done' && D.jM.ok === false, '확실하지 않음은 done');
  ok(/pre: !!m\[rid\]\.pre, same: !!m\[rid\]\.same \}; y24PMirrorFin\(RJ\)/.test(A) && /\.\.\.\(y\.pre \|\| \(y === x && x\.pre\) \? \{ pre: 1 \} : \{\}\), \.\.\.\(y\.same \? \{ same: 1 \} : \{\}\)/.test(A), '번외 결과의 pre·same을 거울 끝까지 넘김');
  ok(/for \(const d of H\) \{ if \(\(Date\.parse\(d\.retryAt \|\| ''\) \|\| 0\) > now\) continue;/.test(A), '맡긴 일 줄 처리가 retryAt 전엔 보내지 않음(바로 되풀이 0)'); }

console.log('⑤ 번외 0.1.52');
{ const W = rd('lab/col2/helper/col2-y24w.js'); ok(/rs=typeof ds\.getRowState==='function'/.test(W) && /ce=c\?c\.editable!==false:null/.test(W), '재고수량 칸 고친 뒤 줄 상태(rs)·칸 고칠 수 있음(ce)을 받음');
  ok(/저장되지 않음\$\{R\.qhow \|\| ''\}/.test(W) && /칸 고침 \$\{e\.how \|\| '\?'\} · 줄 상태/.test(W), "'저장되지 않음' 글에 칸 고침·줄 상태·칸 고칠 수 있음 — 근원 진단(hist)");
  ok(/slice\(0, 220\)/.test(W), '자취 글 220자');
  ok(/COL2_VER: '0\.1\.(5[5-9]|[6-9]\d)'/.test(rd('lab/col2/col2-config.js')), '번외 0.1.55 이상'); }

console.log(bad ? `❌ tY24RE1113 실패 ${bad}` : '✓ tY24RE1113 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 오류', e); process.exit(1); });

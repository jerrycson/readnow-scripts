// tBQMKT1118 — (11/18 19:47 정범님 I-1118-1947-22.4·22.5) 📈 수동 일괄 시장 지표
//  ① 「이 그룹 시장 지표 갱신」 = 모든 탭(조건 이미 부합·추천 못 함·알라딘 하한·묶음 경계·조건 밖·보류·휴지통·잠가서 뺀 상품) · 🏷 생성후판매완료만 뺌 · 탭마다 개수
//  ② 선택 대기가 아닌 탭의 👁 살핀 상품 패널에 「📈 이 탭 상품 시장 지표 다시 읽기(N개)」 — 두 번 누름 · 그룹 24시간 잠금 · 탭마다 24시간에 한 번 · 막히면 다시 되는 때
//  ③ 카드마다 「📈 시장 지표 갱신」 — 상품 상세와 같은 pmkRequest · 맡김·읽는 중·끝난 시각 · ✕로 표시 닫기
// 실행: node tBQMKT1118.js (코드·순수 셈 — 화면 시험 없음) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i + a.length); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const kTime = (iso) => { const t = Date.parse(iso || ''); if (!Number.isFinite(t)) return ''; return new Date(t + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' '); };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
console.log('① 순수 셈');
const blk = cut('/* ◆bqmkt1 시작', '/* ◆bqmkt1 끝 */');
const S = { pmk: { req: {} } };
const F = new Function('S', 'num', 'esc', 'kTime', 'BKF_BUSY', blk + '\nreturn { BQ_TABMET, bqMetBreak, bqTabMetState, bqMetBtn };')(S, (n) => String(n), esc, kTime, new Set(['queued', 'running', 'paused']));
{ const now = Date.parse('2026-11-18T12:00:00Z');
  ok(['ok', 'keep', 'bb', 'lot', 'gone', 'hold', 'trash'].every((t) => F.BQ_TABMET.includes(t)) && !F.BQ_TABMET.includes('sel') && !F.BQ_TABMET.includes('sold'), '대상 탭 = 선택 대기·결정 대기·확정·생성후판매완료가 아닌 탭');
  const s0 = F.bqTabMetState({}, 'keep', 5, [], now); ok(s0.ok && /24시간에 한 번/.test(s0.why), '처음이면 맡길 수 있음', s0);
  ok(!F.bqTabMetState({}, 'keep', 0, [], now).ok, '빈 탭은 못 맡김');
  ok(!F.bqTabMetState({}, 'sel', 5, [], now).ok, '선택 대기 탭은 대상 아님');
  const sb = F.bqTabMetState({}, 'ok', 5, [{ status: 'done' }, { status: 'running' }], now); ok(!sb.ok && sb.busy, '그룹 모으기가 줄에 있으면 기다림', sb);
  const sg = F.bqTabMetState({ lastMetricsReqAt: '2026-11-18T02:00:00Z' }, 'bb', 5, [{ status: 'done' }], now); ok(!sg.ok && sg.until === Date.parse('2026-11-19T02:00:00Z') && /그룹 전체 갱신/.test(sg.why) && /11-19 11:00부터 다시/.test(sg.why), '그룹 24시간 잠금 — 다시 되는 때(한국 시각)', sg);
  const st = F.bqTabMetState({ lastMetricsReqAt: '2026-11-16T02:00:00Z', tabMetReqAt: { bb: '2026-11-18T06:00:00Z' } }, 'bb', 5, [], now); ok(!st.ok && /이 탭을 맡김/.test(st.why) && /11-19 15:00부터 다시/.test(st.why), '탭마다 24시간에 한 번', st);
  ok(F.bqTabMetState({ tabMetReqAt: { bb: '2026-11-18T06:00:00Z' } }, 'hold', 5, [], now).ok, '다른 탭은 따로 셈');
  ok(F.bqTabMetState({ tabMetReqAt: { bb: '2026-11-17T06:00:00Z' } }, 'bb', 5, [], now).ok, '24시간 지나면 다시 됨');
  const TT = [['ok', '조건 이미 부합'], ['keep', '추천 못 함'], ['hold', '보류']];
  const br = F.bqMetBreak({ sel: [1], ok: [1, 2], keep: [], hold: [3], sold: [4, 5] }, TT, 2); ok(/조건 이미 부합 2/.test(br) && /보류 1/.test(br) && /잠가서 뺀 2/.test(br) && /생성후판매완료 2개는 뺌/.test(br) && !/추천 못 함/.test(br), '탭마다 개수(빈 탭 빼고 · 판매완료는 뺌 표시)', br);
  ok(/data-bqmet="aladin_A"/.test(F.bqMetBtn('aladin_A')) && !/disabled/.test(F.bqMetBtn('aladin_A')), '카드 단추(맡김 전)');
  S.pmk.req.aladin_A = { state: 'queued', t: now }; const q = F.bqMetBtn('aladin_A'); ok(/disabled/.test(q) && /⏳ 맡김 11-18 21:00/.test(q), '맡김 — 단추 막고 맡긴 시각', q);
  S.pmk.req.aladin_A.run = true; ok(/읽는 중/.test(F.bqMetBtn('aladin_A')), '읽는 중');
  S.pmk.req.aladin_A = { state: 'done', ok: true, t: now, doneAt: now + 600e3 }; const d = F.bqMetBtn('aladin_A'); ok(/✓ 끝 11-18 21:10/.test(d) && /data-bqmetx="aladin_A"/.test(d) && !/disabled/.test(d), '끝난 시각 + ✕ 닫기(A100) · 다시 누를 수 있음', d);
  S.pmk.req.aladin_A = { state: 'done', ok: false, t: now, doneAt: now }; ok(/못 읽음/.test(F.bqMetBtn('aladin_A')), '못 읽음 표시');
  S.pmk.req.aladin_A = { state: 'err', txt: 'x' }; ok(/맡기기 실패/.test(F.bqMetBtn('aladin_A')) && /data-bqmetx/.test(F.bqMetBtn('aladin_A')), '맡기기 실패 + ✕'); }
console.log('② 코드 확인');
{ ok(!/\b(alert|confirm|prompt)\s*\(/.test(blk) && !/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/.test(blk), '새 코드에 브라우저 창·휴대전화 번호 꼴 없음');
  const pm = cut('async function pmkRequest(', 'function pmkHook('); ok(/r\.doneAt = Date\.now\(\)/.test(pm) && /pmkHook\(pid\)/.test(pm) && /r\.run = true/.test(pm), 'pmkRequest — 끝난 시각·읽는 중·화면 알림 갈고리');
  ok(/id="b_metrics"[^\n]{0,300}>이 그룹 시장 지표 갱신 \(\$\{num\(R\.length - tabs\.sold\.length\)\}개\)/.test(T), '그룹 단추 수 = 판매완료 뺀 전부');
  ok(/const so = new Set\(tabs\.sold\); const mk = R\.filter\(\(x, i\) => !so\.has\(i\)\)\.map\(keyOf\)/.test(T) && /bMetricsSend\(id, c\.name, mk,/.test(T), '그룹 갱신이 보내는 상품 = 모든 탭(판매완료만 뺌)');
  ok((T.match(/\$\{bqMetBtn\(k\)\}/g) || []).length >= 2, '카드 단추 — 한눈에·자세히 카드 둘 다');
  ok(/querySelectorAll\('\[data-bqmet\]'\)[\s\S]{0,400}(pmkRequest|bqMetRequest)\(l(, false)?\)/.test(T) && /e\.stopPropagation\(\)/.test(T), '카드 단추 = pmkRequest 재사용(카드 펼침과 겹치지 않음)');
  ok(/tabAct: BQ_TABMET\.includes\(T\)/.test(T) && /tabMetReqAt: \{ \[T\]: q\.lastMetricsReqAt \}/.test(T) && /get\(\{ source: 'server' \}\)/.test(T), '탭 단추 — 서버에서 다시 읽어 잠금 확인 · 탭 시각만 저장(그룹 시각·lastKeys는 그대로)');
  const sa = cut('async function seenTabAct(', 'async function seenRun('); ok(/armTU = Date\.now\(\) \+ 4000/.test(sa) && /SEENP\.done = \{/.test(sa), '탭 단추 두 번 누름 · 끝남 표시(닫기 있음)');
  ok(/if \(sp === 'tabact'\) return seenTabAct\(\);/.test(T) && /\$\{seenTabActHtml\(c, B\)\}\$\{PL\}/.test(T), '살핀 패널 — 살핀 것 단추와 따로 구획');
  ok(/tabMetReqAt: g2\.tabMetReqAt \|\| \{\}/.test(T) && /tabMetReqAt: g\.tabMetReqAt \|\| \{\}/.test(T), '그룹 문서의 탭 시각을 읽어 옴'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tBQMKT1118 ${bad}개 실패` : '✓ tBQMKT1118 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('③ 화면');
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); }); const perr = []; p.on('pageerror', (e) => perr.push(e.message));
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); window.ask = async () => true; const FS = window.__FS; const out = {};
    const now = new Date().toISOString(); const L = [...S.plist.values()].filter((l) => l.active).slice(0, 6);
    S.batchRes = L.map((l, j) => ({ l, target: l.price - 500 - j, reasons: ['시험'], page1: [], at: now, out: false })); S.batchId = 'bM'; S.prBatches = [{ id: 'bM', name: '시장 지표 시험' }];
    const K = (j) => 'aladin_' + L[j].usedCode; S.batchSt = { start: {}, picks: {}, decided: {}, held: { [K(4)]: { at: now }, [K(5)]: { at: now } }, trashed: {}, added: {} }; S.batchMeta = {}; S.batchT = 'sel'; S._bFresh = true; S.bqOpen = new Set();
    try { localStorage.removeItem('rn-bq-view'); } catch (e) {} openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: '시장 지표 시험' }))); await W(600);
    const sh = document.getElementById('sheet'); const res = () => sh.querySelector('#b_res');
    out.gbtn = ((res().querySelector('#b_metrics') || {}).textContent || ''); out.gtitle = ((res().querySelector('#b_metrics') || {}).title || '');
    out.cardBtns = res().querySelectorAll('[data-bqmet]').length;
    const b0 = res().querySelector(`[data-bqmet="${K(0)}"]`); const n0 = Object.keys(FS.shp_cmds || {}).length; b0 && b0.click(); await W(500);
    const C1 = Object.values(FS.shp_cmds || {}); out.card = { n: C1.length - n0, keys: (C1.find((v) => v.keys && v.keys[0] === K(0)) || {}).keys, st: (S.pmk.req[K(0)] || {}).state, tag: ((res().querySelector(`[data-bqmet="${K(0)}"]`) || {}).nextElementSibling || {}).textContent || '', dis: !!(res().querySelector(`[data-bqmet="${K(0)}"]`) || {}).disabled };
    sh.querySelector('[data-btab="hold"]').click(); await W(500); const pan = () => document.querySelector('.seenp'); const tb = () => pan() && pan().querySelector('[data-sp="tabact"]');
    out.tab = { btn: !!tb(), txt: tb() ? tb().textContent : '', dis: tb() ? tb().disabled : null, show: pan() ? pan().style.display : 'x' };
    const n1 = Object.values(FS.shp_cmds || {}).filter((v) => /그룹/.test(v.label || '')).length; if (tb()) { tb().click(); await W(200); out.arm = { txt: tb().textContent, n: Object.values(FS.shp_cmds || {}).filter((v) => /그룹/.test(v.label || '')).length - n1 }; tb().click(); await W(1200); }
    const G = Object.values(FS.shp_cmds || {}).filter((v) => /그룹/.test(v.label || '')); const g = G[G.length - 1] || {};
    out.sent = { n: G.length - n1, keys: (g.keys || []).slice().sort().join(','), want: [K(4), K(5)].sort().join(','), batchId: g.batchId, tabAt: (((FS.prd_price_batches || {}).bM || {}).tabMetReqAt || {}).hold, last: ((FS.prd_price_batches || {}).bM || {}).lastMetricsReqAt };
    out.after = { dis: tb() ? tb().disabled : null, why: ((pan() && pan().querySelector('.seenp-tabw')) || {}).textContent || '', done: !!(pan() && pan().querySelector('.seenp-done [data-sp="done"]')) };
    return out; });
  if (process.env.V) console.log(JSON.stringify(r, null, 1));
  ok(/이 그룹 시장 지표 갱신 \(6개\)/.test(r.gbtn) && /보류 2/.test(r.gtitle), '그룹 단추 = 모든 탭 6개 · 탭마다 개수(보류 2)', [r.gbtn, r.gtitle]);
  ok(r.cardBtns >= 4, '선택 대기 카드마다 📈 시장 지표 갱신', r.cardBtns);
  ok(r.card.n === 1 && r.card.keys && r.card.keys.length === 1 && r.card.st && /맡김|읽는 중|끝/.test(r.card.tag), '카드 단추 → 그 상품 하나만 맡김 · 상태 표시', r.card);
  ok(r.tab.btn && /이 탭 상품 시장 지표 다시 읽기/.test(r.tab.txt) && /2/.test(r.tab.txt) && !r.tab.dis, '보류 탭 살핀 패널에 「이 탭 상품 시장 지표 다시 읽기(2개)」', r.tab);
  ok(r.arm && r.arm.n === 0 && /한 번 더/.test(r.arm.txt), '한 번 누르면 아직 안 맡김(두 번 누름)', r.arm);
  ok(r.sent.n === 1 && r.sent.keys === r.sent.want && r.sent.batchId === 'bM' && !!r.sent.tabAt && !r.sent.last, '두 번 → 보류 탭 2개만 맡김 · 탭 시각만 저장(그룹 24시간 시각은 그대로)', r.sent);
  ok(r.after.dis === true && /부터 다시|줄에 있음/.test(r.after.why) && r.after.done, '맡긴 뒤 막힘 + 다시 되는 때/기다림 · 끝남 표시에 닫기', r.after);
  ok(!dlg.length, '브라우저 창 없음', dlg); ok(!perr.length, '화면 오류 없음', perr);
  console.log(bad ? `❌ tBQMKT1118 ${bad}개 실패` : '✓ tBQMKT1118 통과'); process.exitCode = bad ? 1 : 0; });

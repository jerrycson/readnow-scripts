// tPXSTALL1113 — 11/13 조회수 실험 매일 조각이 '멈춤'으로 끝나던 것(rv1b)
//  까닭(진단 HOME 기록 11/13): 조각을 맡은 지 1~5분 뒤 ⚡ 새 판 새로고침(새 탭이 이어받고 옛 탭 닫음)이 일어나 결과를 조각 끝에만 적던 옛 탭의 기록이 0으로 사라짐 → 10분 뒤 '멈춤'(다시 하지 않는 종류)
//  ① 새 판 바꾸기 지킴이는 맡긴 일을 하는 중이면(15분 안) 기다리고, 끊어도 되는 조각(pxExp)에 '상품 사이에서 멈춰 달라'(__rnVerCutReq)를 알림
//  ② pxExpPc는 그 알림을 상품 사이에서 보고 자리(results) 저장 뒤 끝냄 · 매일 조각은 2분 뒤
//  ③ 상품마다 결과를 바로 남김(results.<상품>) · 수정 수(시간당 상한 cnt)도 바로 셈 — 탭이 갑자기 닫혀도 붙인 기록이 남고 이어 받는 쪽은 남은 것만
//  ④ 멈춘 오늘의 매일 조각(신호 없음)은 로그인된 PC가 다시 차례(held)에 넣음 · 3번까지 · 지난 날·다른 까닭·사람이 맡긴 것은 그대로
//  노드만(가짜 Firestore) — tOOM1과 같은 틀
const fs = require('fs'), path = require('path');
const P1 = path.join(__dirname, '..', 'readnow-collector.src.js'), P2 = path.join(__dirname, '..', 'readnow-collector.user.js');
const s = fs.readFileSync(fs.existsSync(P1) ? P1 : P2, 'utf8');
const cut = (a, endMark) => { const i = s.indexOf(a); const j = s.indexOf(endMark, i); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a); return s.slice(i, j); };
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
const MIN = 60e3;

(async () => {
  // ── ① 새 판 지킴이 ──
  const vt = cut('const t = verTimer = setInterval(', 'safeReload(tried ?');
  ok(/const cmdB = !!\(window\.__rnCmdCur && Date\.now\(\) - \(\+window\.__rnCmdCur\.t0 \|\| 0\) < 15 \* 60e3\)/.test(vt), '① 맡긴 일 하는 중(15분 안)을 봄');
  ok(/\|\| cmdB; const hw = /.test(vt) && vt.indexOf('cmdB') < vt.indexOf('if (busy) { idleSince = null; return; }'), '① 하는 중이면 바쁨으로 보고 새로고침을 미룸');
  ok(/window\.__rnVerCutReq = \{ at: Date\.now\(\), v \}/.test(vt) && /if \(!cmdB\) window\.__rnVerCutReq = null;/.test(vt), '① 끊어도 되는 조각에 상품 사이 멈춤을 알리고, 끝나면 알림을 지움');

  // ── ②③ 실제 pxExpPc ──
  const pxSrc = cut('async function pxExpPc(ref, v, id)', 'window.__rnPxExp = (ref, v, id)');
  const run = async ({ ids, results, daily, cutAfter, gate }) => {
    const ev = []; const sets = []; const pxSets = []; let edits = 0;
    const W = { __rnBusyMem: () => ({ act: 'none' }), __rnLog() {}, __rnPcName: { get: () => 'HOME' } };
    const doc = (col, id) => ({ get: async () => ({ data: () => (col === 'app_settings' && id === 'main' ? { cloudUrl: 'https://cf.example' } : {}) }), set: async (o) => { if (col === 'app_settings' && id === 'pxDaily') pxSets.push(o); } });
    const C = (col) => ({ doc: (id) => doc(col, id) });
    const ref = { set: async (o) => { sets.push(JSON.parse(JSON.stringify(o))); } };
    const prdEditPc = async (sink, v2) => { ev.push('edit:' + v2.listingId); edits++; if (cutAfter && edits >= cutAfter) W.__rnVerCutReq = { at: Date.now(), v: '9.9.9' }; await sink.set({ f: { note: { st: 'scm' } } }); sink.now2 = { ok: true, uid: v2.listingId, noteHtml: v2.ch.note }; };
    const fetch = async () => ({ status: 200, text: async () => '' });
    const AS = gate ? { AS: { pxGate: () => ({ ok: true, sliceMs: 10 * MIN, edMax: 99, ckMax: 99, day: '2026-11-13', hh: '10', pubPct: 0, failMax: 3, edGap: [0, 0] }), pxRest: () => 5 * MIN } } : undefined;
    const fn = new Function('window', 'C', 'firebase', 'TS', 'nowIso', 'sleep', 'PC_NAME', 'peTxt', 'peReadPc', 'pxChain', 'prdEditPc', 'fetch', 'ReadnowAuto', 'globalThis', pxSrc + '; return pxExpPc;')(
      W, C, { firestore: { FieldValue: { increment: (x) => ({ inc: x }), arrayUnion: (...a) => a } } }, () => 0, () => new Date().toISOString(), async () => {}, 'HOME', (h) => String(h || '').replace(/<[^>]+>/g, '').trim(),
      async (lid) => { ev.push('read:' + lid); return { ok: true, uid: lid, noteHtml: '<p>글</p>', qtk: '상' }; }, (f) => f(), prdEditPc, fetch, AS, {});
    const r = await fn(ref, { listingIds: ids, results: results || {}, op: 'add', daily: !!daily, startedAt: 'x' }, 'cmd1');
    return { r, ev, sets, pxSets, last: sets[sets.length - 1] };
  };
  const ids = ['101', '102', '103', '104', '105'];
  const a = await run({ ids, cutAfter: 2 });
  ok(a.ev.filter((x) => x.startsWith('edit:')).join() === 'edit:101,edit:102', '② 새 판 알림 뒤 두 번째 상품을 끝내고 세 번째는 열지 않음');
  ok(a.last.status === 'queued' && a.last.claim === null && Object.keys(a.last.results).join() === '101,102' && /⚡ 새 판 9\.9\.9/.test(a.last.waitMsg), '② 자리 저장(대기 · 결과 101·102 · 까닭 ⚡ 새 판)');
  const d = await run({ ids, daily: true, cutAfter: 1, gate: true });
  { const na = Date.parse(d.last.nextAt) - Date.now(); ok(d.last.status === 'held' && na > MIN && na <= 2 * MIN + 5e3, '② 매일 조각은 쉼(held) · 2분 뒤 이어 함(새로고침 뒤)'); }
  const per = a.sets.filter((o) => o.results && Object.keys(o.results).length === 1 && o.beatAt);
  ok(per.length === 2 && per[0].results['101'] && per[0].results['101'].state === 'done' && per[1].results['102'], '③ 상품마다 결과를 바로 남김(results.101 → results.102)');
  const full = await run({ ids, daily: true, gate: true });
  const perEd = full.pxSets.filter((o) => o.cnt && o.cnt['2026-11-13'] && o.cnt['2026-11-13'].ed && o.cnt['2026-11-13'].ed.inc === 1).length;
  const endEd = full.pxSets.filter((o) => o.slice && o.slice.end).map((o) => o.cnt['2026-11-13'].ed.inc)[0];
  ok(full.r === 'done' && perEd === 5 && endEd === 0, `③ 수정 수는 상품마다 바로 셈(5번 +1) · 조각 끝에는 남은 수만(0) — 탭이 닫혀도 시간당 상한이 맞음 (${perEd}·${endEd})`);
  const b2 = await run({ ids, results: a.last.results });
  ok(b2.r === 'done' && b2.ev.filter((x) => x.startsWith('edit:')).join() === 'edit:103,edit:104,edit:105', '③ 이어 받으면 남은 103부터');

  // ── ④ 멈춘 조각 이어받기 ──
  const rsSrc = cut('let pxResNext = 0; async function pxRescuePc()', 'window.__rnPxRescue = ');
  const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  const todayIso = new Date(Date.parse(today + 'T00:30:00+09:00') + 3600e3).toISOString();
  const mk = (id, o) => ({ id, x: { type: 'pxExp', daily: true, status: 'stuck', createdAt: todayIso, stuckWhy: '맡은 곳 HOME · 맡은 뒤 12분 신호 없음 — 다시 하면 알라딘에 두 번 반영될 수 있어 자동으로 다시 하지 않음', claim: { pc: 'HOME' }, listingIds: ['1', '2', '3'], results: { 1: { state: 'done' } }, label: id, ...o } });
  const docs = [mk('s1', {}), mk('s2', { createdAt: '2026-11-01T01:00:00Z' }), mk('s3', { rescueN: 3 }), mk('s4', { stuckWhy: '사람 확인' }), mk('s5', { daily: false })];
  const upd = {}; const logs = [];
  const db = { runTransaction: async (f) => f({ get: async (r) => ({ data: () => docs.find((d) => d.id === r.id).x }), update: (r, o) => { upd[r.id] = o; } }) };
  const C = (col) => ({ where: () => ({ where: () => ({ get: async () => ({ docs: docs.map((d) => ({ id: d.id, ref: { id: d.id }, data: () => d.x })) }) }) }) });
  const rescue = new Function('PUBONLY', 'auth', 'pcLoggedNow', 'C', 'db', 'firebase', 'nowIso', 'TS', 'PC_NAME', 'log', rsSrc + '; return pxRescuePc;')(false, { currentUser: {} }, () => true, C, db, { firestore: { FieldValue: { increment: (x) => ({ inc: x }), arrayUnion: (...a) => a } } }, () => new Date().toISOString(), () => 0, 'JS-MAIN', (m) => logs.push(m));
  const n = await rescue();
  ok(n === 1 && Object.keys(upd).join() === 's1', '④ 오늘·신호 없음·3번 안·매일 조각만 다시 차례에(지난 날·3번 다 씀·다른 까닭·사람이 맡긴 것은 그대로)');
  { const u = upd.s1 || {}; const na = Date.parse(u.nextAt) - Date.now(); ok(u.status === 'held' && u.claim === null && na >= 55e3 && na <= 4 * MIN + 5e3 && u.rescueN && u.rescueN.inc === 1 && !('results' in u), '④ held · 1~4분 뒤 · 이어받은 횟수 +1 · 남은 결과는 지우지 않음'); }
  ok(/1\/3 결과 남음/.test((upd.s1 || {}).waitMsg || '') && logs.some((l) => /멈춘 조각/.test(l)), '④ 까닭 글(누구 탭이 끊겼는지 · 결과 몇 개 남았는지)과 기록 줄');
  ok(await rescue() === 0, '④ 5분 안에 다시 부르면 묻지 않음(읽기 아낌)');
  ok(/if \(await pxRescuePc\(\)\) pxPromNext = 0;/.test(s), '④ 2~4분마다 도는 차례 고리에서 부르고, 넣었으면 바로 차례 올리기');

  console.log(bad ? `❌ tPXSTALL1113 실패 ${bad}개` : '✓ tPXSTALL1113 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ tPXSTALL1113 오류: ' + (e && e.stack || e)); process.exit(1); });

// tOOM1 — 정범님 11/09 HOME·MJ-MAIN 수집기 탭 'Out of Memory'·'DNS_PROBE_FINISHED_NXDOMAIN'(oom1)
//  ① 숨은 틀을 만들기 전에 알라딘 화면의 Clarity(방문 녹화)를 공식 명령 clarity('stop')으로 멈춤 · 틀 속 화면도 · 멈춘 뒤엔 다시 부르지 않음
//  ② 틀은 다시 쓰지 않고(까닭은 아래) 쓰고 나면 빈 쪽 → 떼기 · 등록 틀도 같은 멈춤·치우기
//  ③ 바쁜 중 힙이 기준(기본 60%)을 넘으면 '상품 하나 끝난 틈'에만 멈추고 자리(results) 저장 → 새로고침 뒤 남은 상품부터 이어감(가짜 맡김으로 실제 pxExpPc를 돌림)
//  ④ 출고·송장·로그인·예스24 발송처리 등 하던 일이 있으면 새로고침하지 않음(지킴이를 가짜로 돌림) · 기다리는 동안 조회수 실험 맡김을 새로 잡지 않음
//  ⑤ 되풀이 막기(30분 · rnu-idlemem-last) · 죽은 탭 되살리기(웹앱 탭·PC 도우미) 1시간 2번·방금 연 뒤 기다림·인터넷 없으면 기다림·크롬 꺼져 있으면 안 띄움
//  노드만(가짜 화면·가짜 Firestore) — tMEMIDLE과 같은 틀
const fs = require('fs'), path = require('path'), os = require('os');
const P1 = path.join(__dirname, '..', 'readnow-collector.src.js'), P2 = path.join(__dirname, '..', 'readnow-collector.user.js');
const s = fs.readFileSync(fs.existsSync(P1) ? P1 : P2, 'utf8');
const WK = [path.join(__dirname, '..', '..', 'local', 'readnow-work.js'), path.join(__dirname, '..', 'local', 'readnow-work.js')].find((f) => fs.existsSync(f));
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
const cut = (a, endMark) => { const i = s.indexOf(a); const j = s.indexOf(endMark, i); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a); return s.slice(i, j); };
const MIN = 60e3;

(async () => {
  // ── ① Clarity 멈춤 ── clarity-js 0.8.75 queue.ts와 같은 모양: 돌고 있으면 window.clarity.v가 있고, stop 뒤엔 v 없는 줄 세우기 함수로 바뀜
  const { clarityStop } = new Function(cut('function clarityStop(w)', '/* ⟦clarityStop 끝⟧ */') + '; return { clarityStop };')();
  const mkClarity = () => { const w = { calls: [] }; const live = function (m, ...a) { w.calls.push(m); if (m === 'stop') { w.clarity = function () { (w.clarity.q = w.clarity.q || []).push(arguments); }; } }; live.v = '0.8.75'; w.clarity = live; return w; };
  const w1 = mkClarity(); ok(clarityStop(w1) === true && w1.calls.join() === 'stop', "① 돌고 있는 Clarity(v 있음)에 clarity('stop')을 한 번 부름");
  ok(clarityStop(w1) === false && w1.calls.length === 1, '① 멈춘 뒤(줄 세우기 함수 · v 없음)엔 다시 부르지 않음');
  ok(clarityStop({}) === false && clarityStop(null) === false, '① Clarity가 없는 화면이면 아무것도 안 함');
  ok(clarityStop({ clarity: Object.assign(() => { throw new Error('x'); }, { v: '1' }) }) === false, '① Clarity가 오류를 내도 수집기는 멈추지 않음');
  const pe = cut('async function prdEditPc(ref, v, id)', 'window.__rnPrdEdit = (ref, v, id)');
  ok(/clarityQuiet\('수정 틀'\); const fr = document\.createElement\('iframe'\); fr\.id = 'rnPrdEdit_'/.test(pe), '① 수정 틀을 만들기 바로 앞에서 부모 화면 Clarity를 멈춤');
  ok(/throw new Error\('수정 화면 편집기가 안 뜸'\); clarityStop\(W\);/.test(pe), '① 틀 속 수정 화면(편집기가 뜬 뒤)의 Clarity도 멈춤');
  ok(/clarityQuiet\('등록 틀'\); const fr = document\.createElement\('iframe'\); fr\.id = 'rnRegAuto_'/.test(s), '① 자동 등록 틀도 만들기 전에 멈춤');
  ok(/clarityStop\(UW\)/.test(cut('let clarityN = 0;', 'window.__rnClarityQuiet')), '① 부모 화면은 페이지 쪽 창(unsafeWindow)의 clarity를 부름');

  // ── ② 틀 치우기(다시 쓰지 않음) ──
  ok(/finally \{ fr\.__rnLive = 0; setTimeout\(\(\) => peFrameDispose\(fr\), 3000\); \}/.test(pe), '② 수정 틀은 끝나면 3초 뒤 빈 쪽 → 뗌(상품마다 새 틀 · 다시 쓰면 Clarity가 문서마다 기록을 쌓는 것은 같아 근본은 ①)');
  ok(s.includes("setInterval(() => { try { const n = peFrameSweep(Date.now());"), '② 2분마다 쓰고 남은 틀 쓸기는 그대로');

  // ── ③ 바쁜 중 안전망 판단 ──
  const { busyMemDecide } = new Function(cut('function busyMemDecide(o)', '/* ⟦busyMemDecide 끝⟧ */') + '; return { busyMemDecide };')();
  const now = 1e12, B = { now, ratio: 0.62, pct: 60, last: 0, gapMin: 30, pend: false };
  ok(busyMemDecide({ ...B, ratio: 0.5 }).act === 'none', '③ 힙 50%(기준 60% 아래) → 그대로 일함');
  ok(busyMemDecide(B).act === 'reload', '③ 힙 62% → 상품 사이에서 멈추고 새로고침 기다림');
  ok(busyMemDecide({ ...B, ratio: 0.62, pct: 70 }).act === 'none', '③ 기준은 설정(SET.busyMemPct)으로 바뀜');
  ok(/const pct = \+SET\.busyMemPct \|\| 60;/.test(s) && s.includes('SET.busyMemPct(기본 60% — 근거: 없음, 설정으로 바꿈)'), "③ 기본 60% · 주석에 '근거: 없음, 설정으로 바꿈'");
  ok(busyMemDecide({ ...B, ratio: 0.1, pend: true }).act === 'reload', '③ 이미 새로고침을 기다리면 다음 맡김도 바로 멈춤');

  // 실제 pxExpPc를 가짜 Firestore로 돌림
  const pxSrc = cut('async function pxExpPc(ref, v, id)', 'window.__rnPxExp = (ref, v, id)');
  const run = async ({ ids, results, daily, bm, busyAt }) => {
    const ev = []; let bmN = 0; const sets = [];
    const W = { __rnBusyMem: (what) => { bmN++; ev.push('bm'); const a = bmN >= busyAt ? bm : 'none'; return a === 'none' ? { act: 'none' } : { act: a, ratio: 0.63, until: now + 20 * MIN }; }, __rnLog() {}, __rnPcName: { get: () => 'HOME' } };
    const doc = (col, id) => ({ get: async () => ({ data: () => (col === 'app_settings' && id === 'main' ? { cloudUrl: 'https://cf.example' } : {}) }), set: async () => {} });
    const C = (col) => ({ doc: (id) => doc(col, id) });
    const ref = { set: async (o) => { sets.push(o); } };
    const prdEditPc = async (sink, v2) => { ev.push('edit:' + v2.listingId); await sink.set({ f: { note: { st: 'scm' } } }); sink.now2 = { ok: true, uid: v2.listingId, noteHtml: v2.ch.note }; };
    const fetch = async () => ({ status: 200, text: async () => '' });
    const fn = new Function('window', 'C', 'firebase', 'TS', 'nowIso', 'sleep', 'PC_NAME', 'peTxt', 'peReadPc', 'pxChain', 'prdEditPc', 'fetch', 'ReadnowAuto', 'globalThis', pxSrc + '; return pxExpPc;')(
      W, C, { firestore: { FieldValue: { increment: (x) => x, arrayUnion: (...a) => a } } }, () => 0, () => new Date().toISOString(), async () => {}, 'HOME', (h) => String(h || '').replace(/<[^>]+>/g, '').trim(),
      async (lid) => { ev.push('read:' + lid); return { ok: true, uid: lid, noteHtml: '<p>글</p>', qtk: '상' }; }, (f) => f(), prdEditPc, fetch, undefined, {});
    const r = await fn(ref, { listingIds: ids, results: results || {}, op: 'add', daily: !!daily, startedAt: 'x' }, 'cmd1');
    return { r, ev, sets, last: sets[sets.length - 1] };
  };
  const ids = ['101', '102', '103', '104', '105'];
  const a = await run({ ids, bm: 'reload', busyAt: 3 });
  ok(a.r === 'mem', '③ 맡긴 일이 메모리 때문에 멈췄다고 돌려줌(mem)');
  ok(a.ev.filter((x) => x.startsWith('edit:')).length === 2, '③ 두 상품을 끝낸 뒤 세 번째를 열기 전에 멈춤');
  { const seq = a.ev.join(' '); ok(/^bm read:101 edit:101 bm read:102 edit:102 bm$/.test(seq), '③ 메모리는 상품과 상품 사이에서만 봄(수정 도중엔 안 봄): ' + seq); }
  ok(a.last.status === 'queued' && a.last.claim === null && Object.keys(a.last.results).join() === '101,102' && a.last.prog.done === 2, '③ 자리 저장: 맡김을 대기로 · 끝낸 두 상품 결과(results) · 진행 2/5');
  ok(!a.last.pcBack && /메모리/.test(a.last.waitMsg) && /새로고침 뒤 이어/.test(a.last.waitMsg), '③ 새로고침 경우엔 이 PC가 다시 이어 함(pcBack 없음) · 대기 글에 까닭');
  const b2 = await run({ ids, results: a.last.results, bm: 'none', busyAt: 99 });
  ok(b2.r === 'done' && b2.ev.filter((x) => x.startsWith('edit:')).join() === 'edit:103,edit:104,edit:105', '③ 새로고침 뒤(같은 맡김 다시 받음) 끝낸 두 상품은 건너뛰고 103부터 이어감');
  const d1 = await run({ ids, daily: true, bm: 'reload', busyAt: 2 });
  { const na = Date.parse(d1.last.nextAt) - Date.now(); ok(d1.last.status === 'held' && na > 60e3 && na < 3 * MIN && d1.last.lastBy === 'HOME', '③ 매일 조각: 쉼(held) · 2분 뒤 같은 PC가 이어 함'); }
  ok(/memCut = bm; cut = true; break;/.test(pxSrc) && pxSrc.indexOf('__rnBusyMem') < pxSrc.indexOf('const ti = Date.now();'), '③ 멈춤 검사는 다음 상품 화면을 읽기 전');

  // ── ④ 하던 일이 있으면 새로고침 안 함 ──
  const wSrc = cut("setInterval(async () => { try { const P = window.__rnBusyMemPend;", '}, 10000);').replace(/^setInterval\(/, '') + '}';
  const mkW = (busyName, pendAgeMs) => { const W = { __rnBusyMemPend: { at: Date.now() - (pendAgeMs || 0), what: '🔬 조회수 실험 그림' } }; const rec = { reload: 0, gm: 0, logs: [] };
    const f = new Function('window', 'idleMemNow', 'GM_setValue', 'log', 'safeReload', 'let memReload = false; const f = ' + wSrc + '; return { f, mr: () => memReload };')(W, async () => busyName, () => rec.gm++, (m) => rec.logs.push(m), () => rec.reload++); return { W, rec, ...f }; };
  for (const why of ['맡긴 일 처리(출고·송장 포함)', '알라딘 로그인 중', '예스24 맡긴 일(발송처리·주문접수)', '수집 중', '숨은 수정·등록 틀이 아직 있음', '발송 요청 다시 읽기 대기']) { const m = mkW(why); await m.f(); ok(m.rec.reload === 0 && !m.mr(), `④ ${why} → 새로고침 안 함(기다림)`); }
  { const m = mkW(null); await m.f(); ok(m.rec.reload === 1 && m.rec.gm === 1 && m.mr(), '④ 하던 일이 모두 끝나면 → 정리 시각(rnu-idlemem-last)을 적고 안전한 새로고침 한 번'); await m.f(); ok(m.rec.reload === 1, '④ 두 번 새로고침하지 않음(memReload)'); }
  { const m = mkW('맡긴 일 처리(출고·송장 포함)', 21 * MIN); await m.f(); ok(m.W.__rnBusyMemPend === null && m.rec.reload === 0, '④ 20분 넘게 바쁘면 새로고침을 포기하고 기록(맡김을 다시 받음)'); }
  const { idleMemBusy } = new Function(cut('function idleMemBusy(E)', '/* ⟦idleMemDecide 끝⟧ */') + '; return { idleMemBusy };')();
  ok(/출고|송장/.test(idleMemBusy({ cmdCur: { type: 'startDelivery' } })) && idleMemBusy({ loginBusy: true }) && idleMemBusy({ y24Busy: true }), '④ 지킴이가 쓰는 바쁨 판단(idleMemBusy)이 출고·로그인·예스24를 바쁨으로 봄');
  ok(/\(x\.type === 'pxExp' && window\.__rnBusyMemPend\)/.test(s), '④ 새로고침을 기다리는 동안 🔬 조회수 실험 맡김은 새로 잡지 않음(출고 맡김은 받음 — 끝난 뒤 새로고침)');

  // ── ⑤ 되풀이 막기 ──
  ok(busyMemDecide({ ...B, last: now - 10 * MIN }).act === 'hold', '⑤ 10분 전에 이미 메모리 새로고침 → 새로고침 대신 일만 쉼(hold)');
  ok(busyMemDecide({ ...B, last: now - 31 * MIN }).act === 'reload', '⑤ 31분 지나면 다시 새로고침');
  { const h = await run({ ids, bm: 'hold', busyAt: 2 }); ok(h.last.status === 'queued' && h.last.pcBack && h.last.pcBack.HOME && /되풀이 막기/.test(h.last.waitMsg), '⑤ 되풀이 막기 중엔 맡김을 다른 PC·클라우드 차례로(pcBack 30분)'); }
  { const h = await run({ ids, daily: true, bm: 'hold', busyAt: 2 }); ok(Math.abs(Date.parse(h.last.nextAt) - (now + 20 * MIN + 30e3)) < 1000, '⑤ 매일 조각은 되풀이 막기가 끝난 뒤(+30초)로 쉼'); }
  ok(/GM_getValue\('rnu-idlemem-last', 0\)/.test(cut('window.__rnBusyMem = (what)', '}, 10000);')), '⑤ 쉬는 때 정리와 같은 칸(rnu-idlemem-last)을 씀 — 두 정리가 합쳐 30분에 한 번');
  { let last = 0, n = 0; for (let t = 0; t < 180 * MIN; t += 30e3) { const d = busyMemDecide({ ...B, now: 1e9 + t, last }); if (d.act === 'reload') { n++; last = 1e9 + t; } } ok(n === 6, `⑤ 늘 힙 높은 PC 3시간: 새로고침 ${n}번(30분 간격)`); }

  // ── ⑤ 죽은 탭 되살리기 — 웹앱 탭 쪽(수집기 rnRevive) ──
  const { reviveDecide } = new Function(cut('function reviveDecide(o)', '/* ⟦reviveDecide 끝⟧ */') + '; return { reviveDecide };')();
  const R0 = { now, seen: { at: now - 12 * MIN, paused: false }, watchFrom: now - 5 * MIN, off: false, staleMin: 10, aliveH: 6, perHour: 2, opens: [], last: 0, net: true };
  ok(reviveDecide(R0).act === 'open', '⑤ 수집기 탭 신호 12분 없음·지켜본 지 5분·인터넷 됨 → 새 탭 엶');
  ok(reviveDecide({ ...R0, seen: { at: now - 5 * MIN } }).act === 'none', '⑤ 5분 전 신호 → 살아 있음');
  ok(reviveDecide({ ...R0, seen: { at: now - 8 * 3600e3 } }).act === 'none', '⑤ 8시간 전 신호 → 이 PC 수집기가 아닌 것으로 봄');
  ok(reviveDecide({ ...R0, seen: { at: now - 12 * MIN, paused: true } }).act === 'none', '⑤ 일시정지로 둔 수집기는 되살리지 않음');
  ok(reviveDecide({ ...R0, watchFrom: now - 1 * MIN }).act === 'none', '⑤ PC 잠자기에서 막 깸(지켜본 지 1분) → 아직 안 엶');
  ok(reviveDecide({ ...R0, net: false }).act === 'wait-net', '⑤ 인터넷이 안 되면 기다렸다 다시(DNS 오류 화면을 또 만들지 않게)');
  ok(reviveDecide({ ...R0, last: now - 4 * MIN, opens: [now - 4 * MIN] }).act === 'none', '⑤ 4분 전에 연 탭이 뜨길 기다림');
  ok(reviveDecide({ ...R0, opens: [now - 50 * MIN, now - 20 * MIN], last: now - 20 * MIN }).act === 'limit', '⑤ 1시간에 2번 넘게는 안 엶');
  ok(reviveDecide({ ...R0, off: true }).act === 'none', "⑤ 끌 수 있음(GM 'rn-revive-cfg'.on=false)");
  { let seenAt = 0, opens = [], last = 0, n = 0; for (let t = 0; t < 120 * MIN; t += MIN) { const d = reviveDecide({ ...R0, now: 1e9 + t, seen: { at: 1e9 + seenAt }, watchFrom: 1e9 - 10 * MIN, opens, last }); if (d.act === 'open') { n++; opens = [...opens.filter((x) => 1e9 + t - x < 3600e3), 1e9 + t]; last = 1e9 + t; } } ok(n === 4, `⑤ 탭이 끝내 안 살아나는 2시간: 연 횟수 ${n}번(1시간 2번)`); }
  const rv = cut('(function rnRevive()', '(function rnPcName()');
  ok(/GM_openInTab\(URL0, \{ active: false/.test(rv) && rv.includes("'https://www.aladin.co.kr/scm/worders.aspx'") && !/location\.reload|window\.close|\.close\(\)/.test(rv), '⑤ 뒤쪽 새 탭으로 주문조회만 엶(다른 탭·크롬은 닫지 않음)');
  ok(/generate_204/.test(rv) && (rv.match(/https:\/\/www\.aladin\.co\.kr\/[^'"`\s]*/g) || []).every((u) => u === 'https://www.aladin.co.kr/scm/worders.aspx'), '⑤ 인터넷 확인은 알라딘이 아닌 곳(알라딘 요청을 늘리지 않음)');
  ok(/GM_setValue\('rnu-lead-seen'/.test(cut('const beat = () =>', 'const heirOther')), "⑤ 수집기 탭은 30초마다 'rnu-lead-seen'을 남김(닫아도 지우지 않음)");
  ok(/call\('\/work\/lead'/.test(s) && /window\.__rnRole\(\) !== 'lead'/.test(s), '⑤ 일하는 수집기 탭이 PC 도우미에 1분마다 살아 있음을 알림');

  // ── ⑤ 죽은 탭 되살리기 — PC 도우미 쪽(readnow-work.js) ──
  if (!WK) ok(false, 'local/readnow-work.js를 못 찾음'); else {
    process.env.RN_WORK_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'rnwork-')); const M = require(WK); const Dn = Date.now();
    const H0 = { now: Dn, lead: { at: Dn - 15 * MIN, paused: false }, off: false, workOn: false, staleMin: 13, aliveH: 6, perHour: 2, last: 0, opens: [] };
    ok(M.reviveDecide(H0).act === 'check' && M.reviveDecide({ ...H0, chrome: true, net: true }).act === 'open', '⑤ 도우미: 신호 15분 없음 → 크롬·인터넷 확인 뒤 엶');
    ok(M.reviveDecide({ ...H0, chrome: false, net: true }).act === 'none', '⑤ 도우미: 사람 크롬이 꺼져 있으면 띄우지 않음');
    ok(M.reviveDecide({ ...H0, chrome: true, net: false }).act === 'wait-net', '⑤ 도우미: 인터넷이 안 되면 기다림');
    ok(M.reviveDecide({ ...H0, workOn: true }).act === 'none', '⑤ 도우미: 작업 창 모드면 작업 창 지킴이가 맡음');
    ok(M.reviveDecide({ ...H0, lead: { at: Dn - 11 * MIN } }).act === 'none', '⑤ 도우미는 13분(웹앱 탭 10분보다 늦게) — 웹앱 탭이 먼저 엶');
    ok(M.reviveDecide({ ...H0, lead: null }).act === 'none', '⑤ 도우미: 수집기 신호를 한 번도 못 받았으면 안 함');
    let opened = [], chk = 0; M._RV_DEPS.chrome = async () => { chk++; return true; }; M._RV_DEPS.net = async () => true; M._RV_DEPS.open = (u) => { opened.push(u); return true; };
    const ST = M._ST; ST.lead = { at: Date.now() - 15 * MIN, paused: false };
    for (let i = 0; i < 5; i++) await M.reviveTick();
    ok(opened.length === 1 && opened[0] === 'https://www.aladin.co.kr/scm/worders.aspx', `⑤ 도우미: 1분마다 5번 봐도 한 번만 엶(${opened.length})`);
    M._RV.last = Date.now() - 14 * MIN; await M.reviveTick(); M._RV.last = Date.now() - 14 * MIN; await M.reviveTick(); ok(opened.length === 2, `⑤ 도우미: 1시간 2번까지(${opened.length})`);
    const api = (p, body) => new Promise((res) => { const req = { method: 'POST', headers: { 'x-rn-work': '1' } }; const out = { writeHead(c) { this.c = c; }, end(b) { res({ c: this.c, j: JSON.parse(b) }); } }; M.api(req, out, new URL('http://127.0.0.1:8898' + p), { readBody: (r, n, cb) => cb(null, Buffer.from(JSON.stringify(body))) }); });
    const r1 = await api('/work/lead', { pc: 'HOME', page: 'worders.aspx', paused: false }); ok(r1.c === 200 && Date.now() - ST.lead.at < 2000, '⑤ 도우미 /work/lead가 신호를 받음');
    const st = M.status(); ok(st.revive && st.revive.leadAge != null && st.revive.opens === 2, '⑤ 도우미 상태에 되살리기(신호 나이·연 횟수)가 보임');
    ok(/const VERSION = '0\.1\.([1-9]|\d{2,})'/.test(fs.readFileSync(WK, 'utf8')), '⑤ 도우미 판 번호가 0.1.0보다 올라감(PC가 새 판을 받음 · 1.78.427에서 0.1.1)');
  }

  console.log(bad ? `❌ tOOM1 실패 ${bad}개` : '✓ tOOM1 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ tOOM1 오류: ' + (e && e.stack || e)); process.exit(1); });

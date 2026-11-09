// tSHIPFZ — 정범님 11/09 약속 0-1 '출고 처리 중에는 절대로 어떤 것도 출고 작업 중인 컴퓨터와 MJ-MAIN을 건드리지 않아 … 끝나면 정지된 시점부터 손실 없이 정확히 이어 감' (shipfz1)
//  ① '출고 중' 판단 한 곳(shipGuardDecide): 출고 하는 PC · MJ-MAIN 무조건 · 끝 표시 · 최대 시간(기본 1시간 · 설정 — 11/09 저녁 shipsafe2) 풀림 · 이름 대소문자
//  ② 가짜 화면(수집기 바탕 모듈): 출고 중 새 판 도착·메모리 높음·되살리기 조건·매일 자동 새 회차·맡긴 일·안전한 새로고침 → 모두 미룸(기록 한 번씩) · 출고 끝 → 차례대로 이어 감(새로고침이 있으면 그것 하나만)
//  ③ 자리 손실 없음: 돌던 🔬 조회수 실험 맡김이 출고 시작에 상품 사이에서 멈추고 results 저장 → 출고 끝 뒤 같은 맡김이 남은 상품부터
//  ④ 새로고침·자동 일 길마다 출고 보호가 걸려 있음(원본 글 확인) · 쉬는 때 메모리 정리 판단 · 되살리기 판단(웹앱 탭·PC 도우미) · 도우미 스스로 새 판 미룸
//  ⑤ 웹앱(Playwright · 있으면): 출고 화면 한 줄 '출고 보호 중 · 미룬 것 n' · 출고 중 새 판 → 미룸 → 끝나면 다시 엶 · 원스톱 진행이 출고 표(shp_runs/_guard)에 칸을 적고 끝나면 end
const fs = require('fs'), path = require('path'), os = require('os');
const pick = (...L) => L.find((f) => fs.existsSync(f));
const s = fs.readFileSync(pick(path.join(__dirname, '..', 'readnow-collector.src.js'), path.join(__dirname, '..', 'readnow-collector.user.js')), 'utf8');
const WK = pick(path.join(__dirname, '..', '..', 'local', 'readnow-work.js'), path.join(__dirname, '..', 'local', 'readnow-work.js'));
const PR = pick(path.join(__dirname, '..', '..', 'local', 'readnow-print.js'), path.join(__dirname, '..', 'local', 'readnow-print.js'));
const APPF = pick(path.join(__dirname, '..', 'app.html'));
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
const cut = (a, endMark) => { const i = s.indexOf(a); const j = s.indexOf(endMark, i); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a); return s.slice(i, j); };
const MIN = 60e3, H = 3600e3;

/* 가짜 화면: 수집기 바탕 모듈의 rnShipGuard를 그대로 돌림(GM 저장소·시계·기록·화면 속성은 가짜) */
function mkRt(o) { o = o || {}; const GM = { 'rnu-pcname': o.pc || 'JS-MAIN', ...(o.gm || {}) }; const logs = []; const timers = []; const attrs = {}; const clock = { now: o.now || 1.8e12 };
  const FakeDate = class extends Date { static now() { return clock.now; } };
  const W = { __rnLog: (m, lv, x) => logs.push(lv + ' ' + x) }; W.top = W;
  const doc = { documentElement: { getAttribute: (k) => (k in attrs ? attrs[k] : null), setAttribute: (k, v) => { attrs[k] = String(v); } } };
  const src = cut('(function rnShipGuard()', '/* (정범님 11/09 oom1) 🩺 죽은 수집기 탭 되살리기');
  new Function('window', 'GM_getValue', 'GM_setValue', 'location', 'document', 'setInterval', 'setTimeout', 'Date', src)(W, (k, d) => (k in GM ? GM[k] : d), (k, v) => { GM[k] = v; }, { hostname: o.host || 'www.aladin.co.kr' }, doc, (f) => timers.push(f), (f) => { Promise.resolve().then(f); return 0; }, FakeDate);
  return { W, GM, logs, attrs, clock, tick: () => W.__rnShipTick() }; }

(async () => {
  // ── ① 판단 한 곳 ──
  const { shipGuardDecide } = new Function(cut('function shipGuardDecide(o)', '/* ⟦shipGuardDecide 끝⟧ */') + '; return { shipGuardDecide };')();
  const now = 1.8e12; const hJS = { a: { pc: 'JS-MAIN', why: '▶ 오늘 출고 끝까지', t0: now - 20 * MIN } };
  ok(!shipGuardDecide({ now, pc: 'JS-MAIN', holds: {} }).on, '① 출고 칸이 없으면 보호 안 함');
  { const d = shipGuardDecide({ now, pc: 'JS-MAIN', holds: hJS }); ok(d.on && d.mine === 1 && /오늘 출고 끝까지/.test(d.why) && d.until === hJS.a.t0 + 1 * H, '① 출고 하는 PC(JS-MAIN) → 보호 · 최대 시간 기본 1시간(정범님 11/09 저녁)'); }
  { const d = shipGuardDecide({ now, pc: 'MJ-MAIN', holds: hJS }); ok(d.on && d.mj && /MJ-MAIN 보호 — JS-MAIN/.test(d.why), '① MJ-MAIN은 다른 PC가 출고 중이어도 무조건 보호'); }
  ok(!shipGuardDecide({ now, pc: 'HOME', holds: hJS }).on, '① 출고와 상관없는 PC(HOME)는 그대로 일함');
  ok(shipGuardDecide({ now, pc: ' js-main ', holds: hJS }).on, '① PC 이름은 대소문자·빈칸 무시');
  ok(!shipGuardDecide({ now, pc: 'JS-MAIN', holds: { a: { ...hJS.a, end: now - MIN } } }).on && !shipGuardDecide({ now, pc: 'MJ-MAIN', holds: { a: { ...hJS.a, end: now - MIN } } }).on, '① 끝 표시(end)가 오면 두 PC 모두 풀림');
  { const old = { a: { pc: 'JS-MAIN', why: 'x', t0: now - 1 * H - 1000 } }; const d = shipGuardDecide({ now, pc: 'MJ-MAIN', holds: old }); ok(!d.on && d.expired.length === 1, '① 끝 소식이 안 오면 1시간 지나 풀림(최대 시간)'); ok(shipGuardDecide({ now, pc: 'MJ-MAIN', holds: old, maxH: 5 }).on, '① 최대 시간은 설정(oneShot.guardMaxH)으로 바뀜'); }
  ok(/oneShot\.guardMaxH/.test(s) && /근거: 없음, 설정 oneShot\.guardMaxH로 바꿈/.test(s), "① 주석에 '근거: 없음, 설정으로 바꿈'");
  ok((s.match(/function shipGuardDecide\(/g) || []).length === 1 && !/function shipGuardDecide\(/.test(fs.readFileSync(APPF || __filename, 'utf8')), '① 판단 함수는 수집기 한 곳뿐(웹앱은 그 결과 data-rn-shiphold를 읽음)');

  // ── ② 가짜 화면: 미룸 → 끝 → 이어 감 ──
  { const R = mkRt({ pc: 'JS-MAIN' }); const W = R.W; ok(!W.__rnSgOn(), '② 처음엔 보호 아님');
    W.__rnShipLocal('cmd_A', "출고 맡긴 일 '발송준비시작'"); ok(W.__rnSgOn(), '② 이 PC 수집기가 출고 일을 맡는 순간 서버를 거치지 않고 바로 보호');
    const did = []; const wait = (k, n, fn, o) => W.__rnShipWait(k, n, fn, o);
    ok(wait('verReload', '⚡ 새 수집기 1.89.240로 바꾸기'), '② 출고 중 새 판 도착 → 미룸');
    ok(wait('memIdle', '메모리 정리(쉬는 때)') && wait('busy:🔬', "'🔬 조회수 실험 그림'(상품 사이에서 자리 저장)"), '② 메모리 높음(쉬는 때·바쁜 중) → 미룸');
    ok(wait('revive', '죽은 수집기 탭 되살리기'), '② 되살리기 조건이 맞아도 → 미룸');
    ok(wait('sched', '⏰ 매일 자동 새 회차·쉴 때 하는 일'), '② 매일 자동 새 회차 → 미룸');
    ok(wait('cmd:c1', "맡긴 일 '🔬 조회수 실험 그림'", () => did.push('cmd:c1')) && wait('cmd:c2', "맡긴 일 '시장 지표 다시 읽기'", () => did.push('cmd:c2')), '② 출고 아닌 맡긴 일 → 새로 잡지 않고 미룸');
    wait('verReload', '⚡ 새 수집기 1.89.240로 바꾸기'); wait('sched', '⏰ 매일 자동 새 회차');
    const defLogs = R.logs.filter((x) => /🚚 출고 중 — .* 미룸\(출고 끝나면 이어 감\)/.test(x)); ok(defLogs.length === 7, `② 기록 줄 '🚚 출고 중 — ○○ 미룸(출고 끝나면 이어 감)' — 일마다 한 번(${defLogs.length})`);
    ok(W.__rnShipDefN() === 7, '② 미룬 것 7가지를 이 PC 공용 줄(rn-sg-def)에 적음');
    await R.tick(); ok(did.length === 0, '② 출고 중엔 아무것도 이어 가지 않음');
    W.__rnShipLocal('cmd_A', null, true); ok(!W.__rnSgOn(), '② 출고 일이 끝나면 풀림');
    await R.tick(); ok(R.logs.some((x) => /🚚 출고 끝 — 미룬 7가지 이어 감/.test(x)), "② 기록 줄 '🚚 출고 끝 — 미룬 n가지 이어 감'"); ok(did.join() === 'cmd:c1,cmd:c2', '② 맡긴 일은 미룬 차례대로 다시 잡음: ' + did.join()); ok(W.__rnShipDefN() === 0, '② 미룬 줄 비움');
    ok(!W.__rnShipWait('verReload', 'x'), '② 풀린 뒤엔 미루지 않음(새 판 지킴이가 그대로 바꿈)'); }
  { const R = mkRt({ pc: 'JS-MAIN' }); const W = R.W; const did = []; W.__rnShipLocal('inv_1', '송장 입력');
    W.__rnShipWait('cmd:c1', 'a', () => did.push('cmd')); W.__rnShipWait('reload', '안전한 새로고침(메모리 정리)', () => did.push('reload'), { reload: true }); W.__rnShipWait('ctlUpd', '원격 업데이트', () => did.push('upd'));
    W.__rnShipLocal('inv_1', null, true); await R.tick(); ok(did.join() === 'reload', '② 새로고침이 끼어 있으면 그것 하나만(새 탭이 저장된 자리부터 모두 이어 감): ' + did.join()); }
  // MJ-MAIN 보호 — 서버 출고 표(다른 PC가 적은 칸)로
  { const R = mkRt({ pc: 'MJ-MAIN' }); const W = R.W; ok(!W.__rnSgOn(), '② MJ-MAIN: 출고 없으면 보호 아님');
    W.__rnShipGuardFeed({ holds: { os_d1: { pc: 'JS-MAIN', why: '▶ 오늘 출고 끝까지', t0: R.clock.now - MIN } } }, 'fs'); ok(W.__rnSgOn() && W.__rnShipHold().mj, '② MJ-MAIN: 다른 PC(JS-MAIN)가 출고를 시작하면 보호');
    ok(W.__rnSgShip().on && W.__rnSgShip().until === R.clock.now - MIN + 1 * H, '② PC 도우미에 보낼 알림(until = 최대 시간)');
    W.__rnShipWait('verReload', '⚡ 새 판'); W.__rnShipGuardFeed({ holds: { os_d1: { pc: 'JS-MAIN', why: 'x', t0: R.clock.now - MIN, end: R.clock.now } } }, 'fs'); await R.tick(); ok(!W.__rnSgOn() && R.logs.some((x) => /출고 끝 — 미룬 1가지/.test(x)), '② JS-MAIN 출고 끝 → MJ-MAIN도 풀리고 이어 감');
    W.__rnShipGuardFeed({ holds: { os_d2: { pc: 'JS-MAIN', why: '▶ 오늘 출고 끝까지', t0: R.clock.now - MIN } } }, 'fs'); ok(W.__rnSgOn(), '② 새 출고 → 다시 보호'); R.clock.now += 1 * H; await R.tick();
    ok(!W.__rnSgOn() && R.logs.filter((x) => /최대 시간\(1시간\) 지나 풀림/.test(x)).length === 1, '② 끝 소식 없이 1시간 → 풀리고 기록(한 번만)'); await R.tick(); ok(R.logs.filter((x) => /최대 시간/.test(x)).length === 1, '② 최대 시간 기록은 되풀이하지 않음'); }
  // 웹앱 화면 다리
  { const R = mkRt({ pc: 'MJ-MAIN', host: 'jerrycson.github.io' }); R.attrs['data-rn-sgdoc'] = JSON.stringify({ holds: { alps_r1: { pc: 'MJ-MAIN', why: '📦 ALPS 송장 인쇄', t0: R.clock.now } }, at: R.clock.now }); await R.tick(); R.W.__rnShipWait('x', 'y');
    const h = JSON.parse(R.attrs['data-rn-shiphold'] || '{}'); ok(h.on === true && /ALPS/.test(h.why) && h.at === R.clock.now, '② 웹앱 화면: 웹앱이 건넨 출고 표(data-rn-sgdoc)를 받아 판단 → data-rn-shiphold로 알림'); R.W.__rnShipWait('x2', 'y'); await R.tick(); ok(JSON.parse(R.attrs['data-rn-shiphold']).n === 2, '② 웹앱 화면에 미룬 수(n)도 알림'); }

  // ── ③ 자리 손실 없음: 🔬 조회수 실험 맡김(실제 pxExpPc) ──
  { const R = mkRt({ pc: 'HOME' }); const W = R.W; W.__rnPcName = { get: () => 'HOME' };
    const bmSrc = cut('window.__rnBusyMem = (what) =>', '  setInterval(async () => { try { const P = window.__rnBusyMemPend;');
    new Function('window', 'performance', 'SET', 'GM_getValue', 'log', bmSrc)(W, { memory: { usedJSHeapSize: 1e8, jsHeapSizeLimit: 4e9 } }, {}, () => 0, () => {});
    const pxSrc = cut('async function pxExpPc(ref, v, id)', 'window.__rnPxExp = (ref, v, id)');
    const run = async (results, onRead) => { const ev = [], sets = []; const C = () => ({ doc: () => ({ get: async () => ({ data: () => ({}) }), set: async () => {} }) }); const ref = { set: async (o) => { sets.push(o); } };
      const prdEditPc = async (sink, v2) => { ev.push('edit:' + v2.listingId); await sink.set({ f: { note: { st: 'scm' } } }); sink.now2 = { ok: true, uid: v2.listingId, noteHtml: v2.ch.note }; };
      const fn = new Function('window', 'C', 'firebase', 'TS', 'nowIso', 'sleep', 'PC_NAME', 'peTxt', 'peReadPc', 'pxChain', 'prdEditPc', 'fetch', 'ReadnowAuto', 'globalThis', pxSrc + '; return pxExpPc;')(
        W, C, { firestore: { FieldValue: { increment: (x) => x, arrayUnion: (...a) => a } } }, () => 0, () => new Date().toISOString(), async () => {}, 'HOME', (h) => String(h || '').replace(/<[^>]+>/g, '').trim(),
        async (lid) => { ev.push('read:' + lid); if (onRead) onRead(lid); return { ok: true, uid: lid, noteHtml: '<p>글</p>', qtk: '상' }; }, (f) => f(), prdEditPc, async () => ({ status: 200, text: async () => '' }), undefined, {});
      const r = await fn(ref, { listingIds: ['101', '102', '103', '104', '105'], results: results || {}, op: 'add', startedAt: 'x' }, 'c1'); return { r, ev, last: sets[sets.length - 1] }; };
    const a = await run({}, (lid) => { if (lid === '102') W.__rnShipLocal('cmd_S', "출고 맡긴 일 '발송준비시작'"); }); /* 두 번째 상품을 하는 사이 이 PC가 출고 일을 맡음 */
    ok(a.ev.join() === 'read:101,read:102' && a.r === 'mem', '③ 출고가 시작되면 하던 상품(102)은 끝내고 다음 상품 사이에서 멈춤');
    ok(a.last && a.last.status === 'queued' && Object.keys(a.last.results || {}).join() === '101,102' && /🚚 출고 중/.test(a.last.waitMsg || ''), '③ 자리 저장: 끝낸 두 상품 결과(results) · 맡김을 대기로 · 대기 글에 출고 까닭');
    ok(R.logs.some((x) => /🔬 조회수 실험 그림.*미룸/.test(x)), '③ 기록 줄에 미룸');
    W.__rnShipLocal('cmd_S', null, true); await R.tick();
    const b = await run(a.last.results); ok(b.ev.filter((x) => x.startsWith('read:')).join() === 'read:103,read:104,read:105', '③ 출고 끝 뒤 같은 맡김을 다시 받으면 103부터(이미 한 상품은 건너뜀 — 손실·되풀이 없음)'); }

  // ── ④ 길마다 출고 보호가 걸려 있음(원본 글) ──
  const has = (re, m) => ok(re.test(s), m);
  has(/const t = verTimer = setInterval\(\(\) => \{ if \(window\.__rnShipWait && window\.__rnShipWait\('verReload'/, '④ ⚡ 새 수집기 판 바꾸기(verReload) — 하던 일을 끊지도 새로고침하지도 않음');
  has(/async function safeReload\(reason, resumeKey\) \{ if \(window\.__rnShipWait && window\.__rnShipWait\('reload'[^\n]*\{ reload: true \}\)\)/, '④ 안전한 새로고침(safeReload) — 마지막 받침(끝나면 그때 새로고침)');
  has(/window\.__rnShipWait\('memRun', '메모리 정리\(수집 중\)'\)\) return;/, '④ 수집 중 메모리 정리');
  { const { idleMemBusy } = new Function(cut('function idleMemBusy(E)', '/* ⟦idleMemDecide 끝⟧ */') + '; return { idleMemBusy };')(); ok(idleMemBusy({ ship: true }) === '🚚 출고 중' && idleMemBusy({}) === null, '④ 쉬는 때·바쁜 중 메모리 정리 지킴이(idleMemBusy)가 출고 중을 바쁨으로 봄'); }
  has(/return idleMemBusy\(\{ ship: \(window\.__rnSgOn && window\.__rnSgOn\(\)\),/, '④ 지킴이가 출고 보호를 넘겨줌');
  has(/if \(c\.cmd === 'update'\) \{ if \(window\.__rnShipWait && window\.__rnShipWait\('ctlUpd'/, '④ 🛰 원격 업데이트도 미룸(답은 \'출고 끝나면 바로\')');
  has(/async function schedTick\(\) \{ if \(!AS \|\| schedBusy \|\| !auth\.currentUser\) return; if \(SCHED && SCHED\.on && window\.__rnShipWait && window\.__rnShipWait\('sched'/, '④ ⏰ 매일 자동 새 회차(쉴 때 하는 일 포함)를 새로 잡지 않음');
  has(/if \(cur\.rank >= 2 && curKey !== 'shipRead' && \(window\.__rnSgOn && window\.__rnSgOn\(\)\)\) why = '🚚 출고 중/, '④ 돌던 자동 일(차례 2 이상)은 지금 항목까지 저장하고 자리 내줌 · 🚨 발송 요청 다시 읽기는 그대로');
  has(/!SG_SHIP_CMDS\.has\(x0\.type\) && window\.__rnShipWait && window\.__rnShipWait\('cmd:' \+ id/, '④ 출고 아닌 맡긴 일은 새로 잡지 않음(출고 맡긴 일은 받음)');
  has(/const SG_SHIP_CMDS = new Set\(\['startDelivery', 'read', 'cancelOrder', 'cashStop'\]\)/, '④ 출고 맡긴 일 = 발송준비시작·발송 요청 다시 읽기·주문 취소·현금 판매 중지');
  has(/if \(SG_SHIP_CMDS\.has\(v\.type\)\) window\.__rnSgStart\('cmd_' \+ id/, '④ 출고 맡긴 일을 맡는 순간 출고 칸 시작');
  has(/async function runCmd\(id\) \{ try \{ await runCmd0\(id\); \} finally \{ window\.__rnSgEnd && window\.__rnSgEnd\('cmd_' \+ id\); \}/, '④ 맡긴 일이 끝나면(오류여도) 출고 칸 끝');
  has(/window\.__rnSgStart && window\.__rnSgStart\('inv_' \+ id, '송장 입력'\)/, '④ 송장 입력 맡김(CSV 일괄·한 건씩)도 출고 칸');
  has(/!\['queued', 'running'\]\.includes\(v\.status\)\) window\.__rnSgEnd\(id, '송장 입력 '/, '④ 송장 입력 맡김이 끝나면(1분마다 확인) 출고 칸 끝');
  has(/ctx === 'urgent' && key === 'shipRead' \? 'shipRead_'/, '④ 🚨 발송 요청 다시 읽기도 출고 칸');
  has(/C\('shp_runs'\)\.doc\('_guard'\)\.onSnapshot/, '④ 수집기가 출고 표를 들음(문서 하나)');
  for (const [re, m] of [[/async function parTick\(\) \{ if \(\(window\.__rnSgOn/, '동시 진행 회차'], [/window\.__rnShipWait\('restExt', '✨ 쉴 때 외부 조회'\)/, '쉴 때 외부 조회'], [/async function extTick\(\) \{ if \(EXT_S\.busy \|\| !auth\.currentUser \|\| window\.__rnPaused \|\| \(window\.__rnSgOn/, '외부 정보'], [/async function regPreTick\(\) \{[^\n]*if \(\(window\.__rnSgOn/, '등록 미리 조회'], [/async function qchkNext\(\)[^\n]*window\.__rnPaused \|\| \(window\.__rnSgOn/, '정보수정 확인'], [/async function pxPromotePc\(\) \{ if \(PUBONLY \|\| !auth\.currentUser \|\| window\.__rnPaused \|\| \(window\.__rnSgOn/, '조회수 실험 올리기']]) has(re, `④ 쉴 때 하는 일·자동 일(${m})도 새로 시작하지 않음`);
  has(/if \(\(window\.__rnSgOn && window\.__rnSgOn\(\)\) && !PAR_STOP\[RESTX\.k\]\) \{ PAR_STOP\[RESTX\.k\] = true;/, '④ 돌던 쉴 때 외부 조회는 자리 내줌');
  { const { reviveDecide } = new Function(cut('function reviveDecide(o)', '/* ⟦reviveDecide 끝⟧ */') + '; return { reviveDecide };')(); const n0 = 1e9; const R0 = { now: n0, seen: { at: n0 - 12 * MIN }, watchFrom: n0 - 5 * MIN, off: false, staleMin: 10, aliveH: 6, perHour: 2, opens: [], last: 0, net: true };
    ok(reviveDecide(R0).act === 'open' && reviveDecide({ ...R0, ship: true }).act === 'none' && reviveDecide({ ...R0, ship: true }).ship, '④ 죽은 탭 되살리기(웹앱 탭 쪽): 조건이 맞아도 출고 중이면 안 엶'); ok(reviveDecide({ ...R0, ship: true, seen: { at: n0 - MIN } }).why === '살아 있음', '④ 살아 있으면 미룸 기록도 없음'); }
  has(/ship: window\.__rnSgShip \? window\.__rnSgShip\(\) : null, ver:/, '④ PC 도우미에 /work/lead로 출고 보호를 알림');
  if (WK) { process.env.RN_WORK_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'rnsg-')); const M = require(WK); const Dn = Date.now(); const H0 = { now: Dn, lead: { at: Dn - 15 * MIN, paused: false }, off: false, workOn: false, staleMin: 13, aliveH: 6, perHour: 2, last: 0, opens: [], chrome: true, net: true };
    ok(M.reviveDecide(H0).act === 'open' && M.reviveDecide({ ...H0, ship: true }).act === 'none', '④ PC 도우미 되살리기: 출고 중이면 안 엶');
    M.shipSet({ on: true, until: Dn + H, why: 'x' }); ok(M.shipHold(), '④ PC 도우미가 출고 보호를 받음'); let opened = 0; M._RV_DEPS.open = () => { opened++; return true; }; M._RV_DEPS.chrome = async () => true; M._RV_DEPS.net = async () => true; M._ST.lead = { at: Date.now() - 15 * MIN };
    await M.reviveTick(); ok(opened === 0, '④ PC 도우미: 출고 중엔 되살리기 안 함'); M.shipSet({ on: false }); await M.reviveTick(); ok(opened === 1, '④ PC 도우미: 출고 끝나면 다음 확인 때 이어서 엶');
    M.shipSet({ on: true, until: Date.now() - 1 }); ok(!M.shipHold(), '④ PC 도우미: 수집기 탭이 죽어도 최대 시간(until)이 지나면 풀림'); }
  if (PR) { const p = fs.readFileSync(PR, 'utf8'); ok(/function selfUpdate\(\) \{ if \(alpsBusy\(\) \|\| shipHold\(\)\)/.test(p) && /if \(alpsBusy\(\) \|\| shipHold\(\)\) \{ if \(shipHold\(\)\) log\(`ALPS 모듈 새 판/.test(p) && /if \(shipHold\(\)\) \{ log\(`작업 창 모듈 새 판/.test(p) && /if \(p === 'update'\) \{ if \(alpsBusy\(\) \|\| shipHold\(\)\)/.test(p), '④ 인쇄 도우미·ALPS·작업 창 모듈 스스로 새 판 받기(다시 켜기)를 출고 중엔 미룸(10분 뒤 다시)'); }
  ok(/^\/\/ @require/m.test(s) && !/shipGuard/.test(s.split('// ==/UserScript==')[0]), '④ 수집기 머리(==UserScript==)는 그대로');

  // ── ⑤ 웹앱(Playwright) ──
  const HP = path.join(__dirname, 'harness.js');
  if (!fs.existsSync(HP) || !process.env.RN_PORT) { console.log('… ⑤ 웹앱 시험은 빌드 폴더 pw에서 RN_PORT로(건너뜀)'); }
  else { const harness = require(HP); await harness(async (p) => {
    await p.waitForFunction(() => typeof window.sgHere === 'function' || typeof sgHere === 'function', null, { timeout: 15000 }).catch(() => {});
    const nav = []; p.on('framenavigated', (f) => { if (f === p.mainFrame()) nav.push(Date.now()); });
    const r1 = await p.evaluate(() => { const h0 = sgHere(); document.documentElement.setAttribute('data-rn-shiphold', JSON.stringify({ on: true, why: 'MJ-MAIN 보호 — JS-MAIN ▶ 오늘 출고 끝까지', n: 3, at: Date.now() })); const h1 = sgHere(); return { h0, h1, line: shipOneShotHtml() }; });
    ok(!r1.h0.on && r1.h1.on && r1.h1.n === 3, '⑤ 웹앱이 수집기 판단(data-rn-shiphold)을 읽음');
    ok(/🛡 출고 보호 중 · 미룬 것 3/.test(r1.line), "⑤ 출고 화면 한 줄 '출고 보호 중 · 미룬 것 n'");
    const r3 = await p.evaluate(async () => { document.documentElement.removeAttribute('data-rn-shiphold'); S.sg.def = []; S.os.drive = true; S.os.doc = { id: '2026-11-09_1', status: 'run', owner: { tab: OS_TAB } }; await sgTick(); const g1 = JSON.parse(JSON.stringify(((window.__FS || {}).shp_runs || {})._guard || null)); const h = sgHere();
      S.os.doc = { ...S.os.doc, status: 'done' }; S.os.drive = false; await sgTick(); const g2 = JSON.parse(JSON.stringify(((window.__FS || {}).shp_runs || {})._guard || null)); return { g1, g2, h }; });
    const k = 'os_2026-11-09_1'; const e1 = r3.g1 && r3.g1.holds && r3.g1.holds[k]; const e2 = r3.g2 && r3.g2.holds && r3.g2.holds[k];
    ok(e1 && e1.t0 > 0 && !e1.end && /오늘 출고 끝까지/.test(e1.why) && r3.g1.cfg && r3.g1.cfg.maxH === 1, '⑤ 원스톱이 돌면 출고 표에 칸(이 기기·시작 시각·최대 1시간)');
    ok(r3.h.on && !r3.h.col, '⑤ 수집기가 없는 기기(휴대폰 등)는 이 탭 흐름으로 보호');
    ok(e2 && e2.end > 0 && e2.t0 === e1.t0, '⑤ 원스톱이 끝나면 그 칸에 end(지우지 않음)');
    ok(nav.length === 0, '⑤ 여기까지 화면을 다시 열지 않음');
    await p.evaluate(() => { document.documentElement.setAttribute('data-rn-shiphold', JSON.stringify({ on: true, why: 'MJ-MAIN 보호 — JS-MAIN ▶ 오늘 출고 끝까지', n: 0, at: Date.now() })); window.__kp = setInterval(() => { const a = JSON.parse(document.documentElement.getAttribute('data-rn-shiphold') || '{}'); if (a.on) document.documentElement.setAttribute('data-rn-shiphold', JSON.stringify({ ...a, at: Date.now() })); }, 1000); autoUpdate('9.99.999'); });
    await p.waitForTimeout(6000); const r2 = await p.evaluate(() => ({ def: S.sg.def.map((x) => x.k), toast: document.body.innerText.includes('웹앱 새 판 v9.99.999으로 바꾸기 미룸') }));
    ok(nav.length === 0 && r2 && r2.def.includes('newver'), '⑤ 출고 중 웹앱 새 판 → 다시 열지 않고 미룸: ' + JSON.stringify(r2));
    await p.evaluate(() => { document.documentElement.setAttribute('data-rn-shiphold', JSON.stringify({ on: false, n: 0, at: Date.now() })); });
    await p.waitForTimeout(9000); ok(nav.length >= 1, `⑤ 출고 끝 → 미뤄 둔 새 판으로 다시 엶(${nav.length}번)`);
  }, { noFriend: true }); }

  console.log(bad ? `❌ tSHIPFZ 실패 ${bad}개` : '✓ tSHIPFZ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ tSHIPFZ 오류: ' + (e && e.stack || e)); process.exit(1); });

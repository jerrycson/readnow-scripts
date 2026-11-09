/* tLGDAY — 로거 24시간 원칙(정범님 11/06 '로거 고유 업무는 집중 벤치마킹 하나')
 *  ① 🔁 로거 부재 판정 AS.loggerAway — 신호 10분(설정 lgAway.min) 넘게 없음·일시 정지·테더링 길 막힘이면 부재 · 끄면 판정 안 함
 *  ② 📶 일반 몫 시간대 나눔 AS.genPace — 11/05 숫자(하루 몫 3.93GB · 벤치 2.82GB)로 10:30엔 절반만 · 11:00 시간대 몫을 다 쓰면 12:00에 더 열림 · 18시 뒤 전부 · 벤치 하는 중이면 벤치 몫을 남겨 둠
 *  ③ due(): 지금 시간대 몫만 다 썼으면(ctx.budWait) 정한 시각 칸을 '건너뜀'으로 굳히지 않고 기다림 · 하루 몫을 다 썼으면 그대로 건너뜀
 *  ⑤ 로거 대신 보관 AS.bkSubDue(정한 PC·정한 시간) · 웹앱 ⚙ '로거 대신 보관할 PC' 칸 저장 · ⑥ 로거 부재 동안 사무실 담당 PC가 우리 상품 와이파이 도서 정보를 이어받음(연결)
 *  ④ 수집기 연결: 사무실 PC가 로거 부재일 때 벤치마킹 아닌 비로그인 칸만 이어받음 · 수집기 머리(==UserScript==) 그대로 · 신호에 셈 식(pace) */
const fs = require('fs'); const path = require('path');
const pick = (...L) => L.find((p) => { try { return fs.existsSync(p); } catch (e) { return false; } });
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const r = await p.evaluate(async () => { const AS = ReadnowAuto.AS; const o = {}; const GiB = 1073741824; const at = (hhmm, day = '2026-11-05') => Date.parse(`${day}T${hhmm}:00+09:00`);
    // ① 로거 부재
    const now = at('14:00'); const bt = (min, x) => ({ pcs: { LOGGER: { atMs: now - min * 60e3, ...(x || {}) } } });
    o.a3 = AS.loggerAway({}, bt(3), 'LOGGER', now).away; o.a11 = AS.loggerAway({}, bt(11), 'LOGGER', now).away; o.aNone = AS.loggerAway({}, { pcs: {} }, 'LOGGER', now).away;
    o.aPause = AS.loggerAway({}, bt(1, { paused: true }), 'LOGGER', now).away; o.aGate = AS.loggerAway({}, bt(1, { gate: { ok: false, why: '테더링 없음' } }), 'LOGGER', now).away;
    o.aOff = AS.loggerAway({ lgAway: { on: false } }, bt(60), 'LOGGER', now).away; o.a30 = AS.loggerAway({ lgAway: { min: 30 } }, bt(11), 'LOGGER', now).away; o.aBad = AS.lgAwayOf({ lgAway: { min: 1 } }).min; o.aNoName = AS.loggerAway({}, bt(60), '', now).away;
    o.aWhy = AS.loggerAway({}, bt(11), 'LOGGER', now).why;
    // ② 일반 몫 시간대 나눔 — 11/05: 하루 몫 3.93 · 벤치 2.82(10:03 끝) · 기타 0.05
    const D = 3.93 * GiB, M = 2.82 * GiB; const G = (hhmm, genUsed, x) => AS.genPace({}, { now: at(hhmm), dayCap: D, usedT: M + genUsed * GiB, umT: M, mainCap: 2.75 * GiB, owe: false, ...(x || {}) });
    const g1030 = G('10:30', 0.05); o.p1030 = { k: g1030.k, n: g1030.n, pool: +(g1030.pool / GiB).toFixed(2), allow: +(g1030.allow / GiB).toFixed(3), left: +(g1030.left / GiB).toFixed(3), more: g1030.more };
    const g1100 = G('11:00', 0.6); o.p1100 = { left: g1100.left > 0, more: g1100.more, next: new Date(g1100.nextAt + 9 * 3600e3).toISOString().slice(11, 16) };
    const g1200 = G('12:00', 0.6); o.p1200 = +(g1200.left / GiB).toFixed(3);
    const g1830 = G('18:30', 0.6); o.p1830 = { k: g1830.k, allow: +(g1830.allow / GiB).toFixed(2), more: g1830.more };
    const g2330 = G('23:30', 1.11); o.p2330 = { left: g2330.left <= 1e6, more: g2330.more };
    const gOwe = AS.genPace({}, { now: at('02:00'), dayCap: D, usedT: 1.0 * GiB, umT: 1.0 * GiB, mainCap: 2.75 * GiB, owe: true }); o.pOwe = { res: +(gOwe.mainRes / GiB).toFixed(2), pool: +(gOwe.pool / GiB).toFixed(2), k: gOwe.k };
    o.txt = g1030.txt; o.txtOk = /하루 몫 3\.93GB/.test(g1030.txt) && /벤치마킹 2\.82GB/.test(g1030.txt) && /시간대 2\/4 열림/.test(g1030.txt) && /12:00에/.test(g1030.txt);
    o.cfg = AS.genPaceOf({ budget: { genPace: { at: ['12:00'] } } }).at.join(); o.off = AS.genPace({ budget: { genPace: { on: false } } }, { now: at('10:30'), dayCap: D, usedT: M, umT: M }).on;
    // ③ due — 일반 칸(06:00 시장 지표 맡기기)
    const doc = { on: true, slots: [{ id: 'lgMetricsAuto', job: 'prd:metricsAuto', tier: 'gen', trig: { t: 'time', times: ['06:00'] } }].map(AS.sanitize) };
    const bud = { left: { main: 1, gen: 0 } }; const d = (ctx) => AS.due(doc, {}, { now: at('11:00'), pc: 'LOGGER', pubAll: true, anyPc: () => true, bud, budLeft: () => 0, ...ctx }).map((x) => x.key + ':' + x.mark);
    o.dWait = d({ budWait: () => true }); o.dSkip = d({ budWait: () => false }); o.dNo = d({});
    // ⑤ 로거 대신 보관
    const bs = (h) => ({ pcs: { LOGGER: { atMs: now - h * 3600e3 } } });
    o.k5 = AS.bkSubDue({}, bs(5), 'LOGGER', 'MJ-MAIN', now).due; o.k7 = AS.bkSubDue({}, bs(7), 'LOGGER', 'mj-main', now).due; o.kOther = AS.bkSubDue({}, bs(7), 'LOGGER', 'JS-MAIN', now).due;
    o.kSet = AS.bkSubDue({ pc: 'JS-MAIN', h: 12 }, bs(7), 'LOGGER', 'JS-MAIN', now).due; o.kSet13 = AS.bkSubDue({ pc: 'JS-MAIN', h: 12 }, bs(13), 'LOGGER', 'JS-MAIN', now).due; o.kOff = AS.bkSubDue({ on: false }, bs(30), 'LOGGER', 'MJ-MAIN', now).due; o.kNone = AS.bkSubDue({}, { pcs: {} }, 'LOGGER', 'MJ-MAIN', now).due;
    try { localStorage.setItem('rn-device', 'TEST-PC'); } catch (e) {} S.devOk = true; S.app.adminDevices = [deviceName() || 'TEST-PC'];
    const box = document.createElement('div'); box.innerHTML = bkSubHtml(); document.body.appendChild(box); o.ui = !!document.getElementById('bks_box') && /로거 대신 보관할 PC/.test(box.textContent) && document.getElementById('bks_pc').value === 'MJ-MAIN' && document.getElementById('bks_h').value === '6';
    document.getElementById('bks_pc').value = 'JS-MAIN'; document.getElementById('bks_h').value = '8'; document.getElementById('bks_save').click(); await new Promise((r) => setTimeout(r, 600));
    const sv = (await db.collection('app_settings').doc('backup_sub').get()).data() || {}; o.saved = { pc: sv.pc, h: sv.h, on: sv.on };
    return o; });
  // ④ 수집기·공용 파일 소스 연결 (노드에서)
  const col = pick(path.join(__dirname, '../readnow-collector.user.js'), path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../../src/readnow-collector.src.js'));
  const S = col ? fs.readFileSync(col, 'utf8') : ''; const W = {};
  W.filter = /isPubKey\(String\(d\.slot\.job\)\.slice\(4\)\) && !lgTakeKey\(String\(d\.slot\.job\)\.slice\(4\)\)\)/.test(S);
  W.bench = /const lgTakeKey = \(k\) => SET\.loggerTakeOk === true && loggerAway\(\) && \(!isBenchKey\(k\) \|\| benchTakeKey\(k\)\)/.test(S) && /const benchTakeKey = \(k\) => SET\.benchOfficeOk === true && /.test(S); /* (정범님 11/09 최우선 법칙) 사무실 PC의 로거 일 이어받기는 설정을 켤 때만 — 기본 끔 */
  W.lane = /!\(window\.__rnAuto && lgTakeKey\(curKey\)/.test(S);
  W.budWait = /budWait: PUBONLY && BUD && BUD\.genPace/.test(S) && /b\.genPace = gp; if \(gp && gp\.on && b\.left && b\.left\.gen > gp\.left\)/.test(S);
  W.beat = /pace: BUD && BUD\.genPace \?/.test(S);
  W.bi = /const biSub = \(\) => !PUBONLY && loggerAway\(\) && asOwnMine\(\) && !REGPC\(\)/.test(S) && /async function biTick\(\) \{ if \(!\(PUBONLY \|\| biSub\(\)\)/.test(S) && /if \(biSub\(\) && !BX\.busyO\) biTick\(\)/.test(S);
  W.bk = (S.match(/if \(!\(PUBONLY \|\| bkSubOn\(\)\)/g) || []).length === 3 && /const BKH = \(\) => \(PUBONLY \? HLP : BKSUB_HLP\)/.test(S) && !/url: HLP \+ '\/(img|bk)-/.test(S);
  const head = (t) => { const i = t.indexOf('// ==/UserScript=='); return t.slice(0, i).split('\n').filter((l) => /@(match|grant|connect|require|noframes|run-at)/.test(l)).map((l) => l.replace(/\?v=[\d.]+/, '')).join('\n'); };
  const ref = pick(path.join(__dirname, '../../w/readnow-collector.user.js'), '/home/user/w/readnow-collector.user.js'); W.head = ref ? head(fs.readFileSync(ref, 'utf8')) === head(S) : 'ref 없음';
  console.log(JSON.stringify(r), JSON.stringify(W), errs.join('|'));
  const ok = r.a3 === false && r.a11 === true && r.aNone === true && r.aPause === true && r.aGate === true && r.aOff === false && r.a30 === false && r.aBad === 10 && r.aNoName === false && /11분째/.test(r.aWhy)
    && r.p1030.k === 2 && r.p1030.n === 4 && r.p1030.pool === 1.11 && Math.abs(r.p1030.allow - 0.555) < 0.002 && Math.abs(r.p1030.left - 0.505) < 0.002 && r.p1030.more === true
    && r.p1100.left === false && r.p1100.more === true && r.p1100.next === '12:00' && r.p1200 > 0.2 && r.p1830.k === 4 && r.p1830.allow === 1.11 && r.p1830.more === false && r.p2330.left && r.p2330.more === false
    && r.pOwe.res === 2.75 && r.pOwe.pool === 1.18 && r.pOwe.k === 1 && r.txtOk && r.cfg === '00:00,12:00' && r.off === false
    && r.dWait.length === 0 && r.dSkip.join() === 'lgMetricsAuto@2026-11-05@06:00:skipped' && r.dNo.join() === 'lgMetricsAuto@2026-11-05@06:00:skipped'
    && r.k5 === false && r.k7 === true && r.kOther === false && r.kSet === false && r.kSet13 === true && r.kOff === false && r.kNone === true && r.ui && r.saved.pc === 'JS-MAIN' && r.saved.h === 8 && r.saved.on === true && W.bi && W.bk && W.filter && W.bench && W.lane && W.budWait && W.beat && W.head === true && !errs.length;
  console.log(ok ? '✓ tLGDAY 통과' : '❌ tLGDAY 실패');
});

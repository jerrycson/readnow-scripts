// node pw/tOPSn.js — 정범님 11/02: 클라우드 🖥 기기 운영 하루 집계(devOpsBuild) · 🌙 밤 시간(nightIn — 수집기·클라우드 같은 규칙) · 수집기 고침 글 확인(국중 상한·외국 책·밤 간격·주문·문의 다시 하기·판매자 연결 골라 받기·자료 보관 나눠 보내기·흩음)
const fs = require('fs'); const path = require('path'); const W = path.join(__dirname, '..');
const CLD = fs.readFileSync(path.join(W, 'cloud/index.js'), 'utf8'); const COL = fs.readFileSync(path.join(W, 'readnow-collector.user.js'), 'utf8');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const grab = (src, head) => { const i = src.indexOf(head); if (i < 0) throw new Error('없음: ' + head); let d = 0, j = src.indexOf('{', i); for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); } } };
const nowIso = () => new Date().toISOString(); const VER = 't'; const DEVOPS_V = 1;
const devOpsBuild = eval('(' + grab(CLD, 'function devOpsBuild(').replace(/^function devOpsBuild/, 'function') + ')');
const nightInC = eval('(' + grab(CLD, 'function nightIn(').replace(/^function nightIn/, 'function') + ')');
const nightInP = eval('(' + grab(COL, 'function nightIn(').replace(/^function nightIn/, 'function') + ')');
const day = '2026-11-01'; const t = (h, m) => new Date(Date.parse(`${day}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+09:00`)).toISOString();
const runs = { [`orders@${day}@10:00`]: { by: 'JS-MAIN', st: t(10, 0), at: t(10, 5), state: 'done', ms: 300e3, job: 'crm:orders' }, [`orders@${day}@11:00`]: { by: 'JS-MAIN', st: t(11, 0), at: t(11, 2), beat: t(11, 2), state: 'running', job: 'crm:orders' }, [`orders@${day}@11:00~r1`]: { by: 'JS-MAIN', st: t(11, 30), at: t(11, 33), state: 'error', ms: 180e3, job: 'crm:orders' },
  [`bench@${day}@01:00`]: { by: 'LOGGER', st: t(1, 0), at: t(4, 0), state: 'done', ms: 3 * 3600e3, job: 'prd:bench' }, [`x@2026-10-31@01:00`]: { by: 'LOGGER', state: 'done', ms: 1, job: 'prd:bench' }, [`y@${day}@09:00`]: { by: 'HOME', state: 'stop', ms: 1000, job: 'prd:market', yield: true } };
const net = { pcs: { LOGGER: { jobs: { bench: { pages: 5000, chars: 1.5e8 } }, helper: { tether: 2.5e9, wifi: 4e8 }, route: 'tether' }, 'JS-MAIN': { jobs: { crm: { pages: 300, chars: 9e6 }, scanDaily: { pages: 40, chars: 1e6 } } } } };
const cs = { pcs: { LOGGER: { c: { bench: { ok: 900, fail: 3, n: 2000, b: 5e6 }, bx_nl: { ok: 50, none: 5 } }, w: { bench: { 'fail: 429': 3 } } } } };
const D = devOpsBuild(day, runs, net, cs); const J = D.pcs['JS-MAIN'], L = D.pcs.LOGGER, H = D.pcs.HOME;
ok(J.runs === 3 && J.jobs['crm:orders'].n === 3 && J.jobs['crm:orders'].lost === 1 && J.jobs['crm:orders'].error === 1 && J.fail === 2 && J.ok === 1, 'JS-MAIN 회차 3 · 끊김 1(25분 넘게 신호 없음) · 오류 1: ' + JSON.stringify(J.jobs['crm:orders']));
ok(J.runMs === 300e3 + 120e3 + 180e3, '끊긴 회차는 시작~마지막 신호까지 시간으로 셈: ' + J.runMs);
ok(L.runs === 1 && L.runMs === 3 * 3600e3 && L.pages === 5000 && L.tether === 2.5e9 && L.cs.ok === 950 && L.cs.n === 2000 && L.whys[0][1] === 3, '로거 — 다른 날 회차는 빼고 · 쪽·테더링·수집 분석 합');
ok(H.jobs['prd:market'].yield === 1 && H.fail === 0, '자리 내줌은 실패로 안 셈');
ok(D.src.runs === 5 && D.src.net && D.src.cs, '출처 표시');
ok(D.pcs['JS-MAIN'].first === t(10, 0) && D.pcs['JS-MAIN'].last === t(11, 33), '처음~마지막 시각');
const tm = (s) => Date.parse(`2026-11-02T${s}:00+09:00`);
for (const f of [nightInC, nightInP]) ok(f({ quiet: '01:00-04:55' }, tm('01:00')) && f({ quiet: '01:00-04:55' }, tm('04:54')) && !f({ quiet: '01:00-04:55' }, tm('04:55')) && !f({ quiet: '01:00-04:55' }, tm('00:59')) && f({ quiet: '23:00-02:00' }, tm('23:30')) && !f({ quiet: '' }, tm('02:00')), '밤 시간 판단(1:00 안 · 4:55 밖 · 자정 넘김 · 빈 값 = 끔)');
ok(grab(CLD, 'function nightIn(') === grab(COL, 'function nightIn(').replace(/^\s+/, ''), '밤 시간 판단 글이 수집기·클라우드에서 같음');
// 수집기 고침 확인(글)
ok(/const BX_NL_CAP0 = 200000/.test(COL) && /nlN: \{ \[bxNlToday\(\)\]: firebase\.firestore\.FieldValue\.increment\(out\.length\)/.test(COL) && /st\.nlForeign !== false/.test(COL), '🏛 국중 하루 상한(기본 20만 · 날짜별 셈) · 외국 책 기본 포함');
ok(/< 30 \* 60e3\) \/\* \(10\/30 정범님 '사람은 워프할 수 없어' · 11\/02 '30분으로 해'\)/.test(COL) && /const PX_STICK_MS = 30 \* 60e3/.test(CLD), '🔬 실험 조각 넘겨받기 30분(수집기·클라우드)');
ok(/nightGapMs\('prd'\)/.test(COL) && /nightGapMs\('order'\)/.test(COL) && /await nightGap\('order'\)/.test(CLD) && /nightExtMs\(\) \|\| 4 \* 60e3/.test(COL), '🌙 밤 간격(상품 조회·주문 읽기) · 외부 일 시간 상자');
ok(/RT_JOBS = \/\^crm:\(orders\|cancels\|returns\|qna\)\$\//.test(COL) && (COL.match(/AS\.due\(schedRt\(\), SCHED_RUNS/g) || []).length === 3, '끊긴 주문·문의 회차 10분 뒤 다시(판단 세 곳 모두)');
ok(/where\('linkN', '>', 0\)/.test(COL) && /doc\.linkN = \(doc\.linkedCustomers \|\| \[\]\)\.length/.test(COL), '판매자 연결 서버에서 골라 받기(linkN)');
ok(/pbytes > 4e6/.test(COL) && /lim = Math\.max\(20, Math\.floor\(lim \/ 2\)\)/.test(COL), '💾 자료 보관 나눠 보내기(4MB · 큰 쪽이면 다음 쪽 반)');
ok((CLD.match(/await jsleep\(/g) || []).length >= 10 && /0\.8 \+ Math\.random\(\) \* 0\.4/.test(COL), '고정 간격 흩기(클라우드 알라딘 요청 사이 · 수집기 다시 시도)');
// 자료 보관 나눠 보내기 — 몸통이 예전 JSON.stringify({lines})와 같은 모양
const lines = [{ id: 'a', path: 'c/a', d: { x: 1 } }, { id: 'b', path: 'c/b', d: { y: '한' } }]; const pre = '{"lines":[' + lines.map((x) => JSON.stringify(x)).join(',') + ']}';
ok(pre === JSON.stringify({ lines }), '나눠 만든 몸통이 예전과 같은 글');
console.log(bad ? `❌ tOPSn 실패 ${bad}` : '✓ tOPSn 통과');

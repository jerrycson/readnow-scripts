/* t_quota — (0.1.4 정범님 11/09 '번외 수집기 — 이 작업은 왜 진행을 안 해?')
 *  HOME 진단(11/09 17:40): 오늘 1600/1600 · 표본 1바퀴 0권째 · col2_runs 0 · col2_books 0 · 상태 글 '창 다루기 실패: R : ID …에 대한 기록을 찾을 수 없습니다'
 *  ① 숨은 크롬이 안 뜨는 동안(바로 꺼짐·30분 쉼) 10초마다 다시 해 볼 때 하루 몫(시간 240 · 하루 1,600)을 세지 않음 — 알라딘에 실제로 요청할 때만 셈
 *  ② 옛 판이 거짓으로 채운 오늘 몫은 새 판이 켜질 때 한 번 실제로 읽은 수로 바로잡아 그날 바로 다시 돎(한 번만)
 *  ③ 자동 읽기가 쉬는 까닭이 상태 글(msg — 웹앱 col2_ctl·진단에 보이는 칸)에 보임 · 작업 창 준비 실패도 '마지막 읽기'(reads)에 남음
 *  ④ 창 다루기 PowerShell에 'R' 함수가 없음(별칭 r = Invoke-History가 먼저 불림)
 * 실행: node tests/t_quota.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path');
const F = require('./fixtures.js'); const COL2 = require('../col2-config.js'); const { PS_SRC } = require('../helper/col2-win.js');
const killDir = (D) => { for (const p of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) { try { if (fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').includes(D)) process.kill(+p, 'SIGKILL'); } catch (e) {} } };
const kday = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 40); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };

(async () => {
  const A = await L.fakeAladin(F.productHtml); const IDS = ['100001', '100002', '100003'];
  const PROD = await L.prodBooks(F.productHtml, IDS, COL2.BOOK_FIXED); const pool = PROD.map((b, i) => ({ id: 'b' + (i + 1), ...b }));

  console.log('① 숨은 크롬이 안 뜨는 동안은 하루 몫을 세지 않음');
  let H = await L.startHelper({ aladin: A.base, cfg: { headless: true, pace: { minGapMs: 300 }, watch: { tickSec: 60, coolMs: 60000, handoffMs: 200 } } }); const D = H.D;
  try {
    fs.writeFileSync(D + '/chrome-die', '0'); /* 가짜 크롬이 곧바로 끝남(HOME의 바로 꺼짐 꼴) */
    await H.api('POST', '/cfg', { on: true }); await H.api('POST', '/relay/answer', { pool });
    let s = await until(async () => { const j = (await H.api('GET', '/status')).j; return j.chrome && j.chrome.fails >= 2 ? j : null; }, 160);
    ok(s && s.chrome.fails >= 2, '흉내: 숨은 크롬이 거듭 바로 꺼짐(자동 읽기가 10초마다 다시 해 봄)', JSON.stringify(s && s.chrome));
    await wait(2500); s = (await H.api('GET', '/status')).j;
    const wp = A.reqs.filter((q) => /wproduct/.test(q.path)).length;
    ok(s.pace.dayN === 0 && s.pace.hourN === 0 && wp === 0, `알라딘에 한 번도 안 갔으면 하루 몫 그대로 0(예전엔 다시 해 볼 때마다 한 장씩 줄어 1,600이 거짓으로 참) — 오늘 ${s.pace.dayN}/${s.pace.dayCap}`, { dayN: s.pace.dayN, hourN: s.pace.hourN, wp });
    ok(s.auto.day.n === 0 && s.auto.lap.read === 0 && s.auto.left === 3, '표본 자리도 그대로(그 책을 다음에 다시)', JSON.stringify({ n: s.auto.day.n, read: s.auto.lap.read, left: s.auto.left, poolN: s.auto.poolN }));
    ok(/자동 읽기: 잠깐 쉼 — 작업 창 준비 실패/.test(s.msg || ''), "상태 글(msg)에 자동 읽기가 쉬는 까닭 — 웹앱 col2_ctl·진단에 보임", s.msg);
    const last = s.reads[s.reads.length - 1]; ok(last && last.ok === false && last.pre && /작업 창 준비 실패/.test(last.why), "작업 창 준비 실패도 '마지막 읽기'에 남음(인쇄 도우미가 last로 넘김)", last);
    fs.unlinkSync(D + '/chrome-die'); /* 크롬이 고쳐짐 → 쉼을 빨리 끝냄(시험) */
    await H.stop(); killDir(D);
    H = await L.startHelper({ dir: D, aladin: A.base, cfg: { on: true, headless: true, pace: { minGapMs: 300 }, watch: { tickSec: 1 } } });
    s = await until(async () => { const j = (await H.api('GET', '/status')).j; return j.auto.day.n >= 3 ? j : null; }, 120);
    ok(s && s.pace.dayN === 3 && s.auto.day.same === 3, '크롬이 뜨면 읽은 만큼만 셈(3권 읽음 = 오늘 3장)', s && { pace: s.pace.dayN, day: s.auto.day });
  } finally { try { await H.stop(); } catch (e) {} killDir(D); }

  console.log('② 옛 판이 거짓으로 채운 오늘 몫 바로잡기(한 번만)');
  H = await L.startHelper({ aladin: A.base, cfg: { headless: true, pace: { minGapMs: 300 }, watch: { tickSec: 1 }, auto: false } }); const D2 = H.D;
  try { await H.stop(); killDir(D2);
    const home = path.join(D2, 'home'); const t = Date.now(); const d = kday();
    fs.writeFileSync(path.join(home, 'pace.json'), JSON.stringify({ last: t - 60e3, hour: [t - 120e3, t - 90e3], day: { d, n: 1600 }, coolUntil: 0, n429: 0, fails: 1600, oks: 0 }));
    fs.writeFileSync(path.join(home, 'pool-at.json'), JSON.stringify({ cur: 0, day: { d, n: 2, same: 2, diff: 0, no: 0, fail: 0 }, last: null, lap: { n: 1, read: 2 } }));
    H = await L.startHelper({ dir: D2, aladin: A.base, cfg: { headless: true, auto: false } });
    let s = (await H.api('GET', '/status')).j; const P = JSON.parse(fs.readFileSync(path.join(home, 'pace.json'), 'utf8'));
    ok(s.pace.dayN === 2 && P.day.n === 2 && P.fixOnce, `오늘 1600 → 실제로 읽은 2장으로 바로잡음 → 오늘 남은 몫 ${s.pace.dayCap - s.pace.dayN}장으로 그날 바로 다시 돎`, s.pace);
    ok(s.pace.hourN <= 2 && /오늘 몫 바로잡음 — 1600장/.test(H.out()), '바로잡은 기록을 남김', s.pace.hourN);
    await H.stop(); killDir(D2);
    const P2 = JSON.parse(fs.readFileSync(path.join(home, 'pace.json'), 'utf8')); P2.day.n = 50; fs.writeFileSync(path.join(home, 'pace.json'), JSON.stringify(P2));
    H = await L.startHelper({ dir: D2, aladin: A.base, cfg: { headless: true, auto: false } }); s = (await H.api('GET', '/status')).j;
    ok(s.pace.dayN === 50, '바로잡기는 한 번만(그 뒤 셈은 실제 요청과 같아 손대지 않음 — 비교 화면에서 손으로 읽은 것도 그대로 셈)', s.pace.dayN);
  } finally { try { await H.stop(); } catch (e) {} killDir(D2); }

  console.log('④ 창 다루기 PowerShell');
  const ps = PS_SRC({ showW: 1200, showH: 820 });
  ok(!/function R\(/.test(ps) && !/\(R \$h\)/.test(ps) && /function Get-RnRect\(\$h\)/.test(ps) && /r = \(Get-RnRect \$h\)/.test(ps), "창 자리 함수가 'R'이 아님(PowerShell 별칭 r = Invoke-History가 함수보다 먼저 불려 'ID …에 대한 기록을 찾을 수 없습니다'로 실패하던 것)");
  A.srv.close(); L.done('t_quota');
})();

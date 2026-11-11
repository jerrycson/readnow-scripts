// tY24OPS3 — (11/11 y24ops3 · 약속 48 예스24 운영 3회차) 💓 수집기가 번외 예스24 상태를 직접 올림 · 🎓 배우기 모드 · 🧪 첫 실행 결과 · 🟦 판매 숫자 한 줄
//   ① 웹앱 c2CtlRow: col2_ctl 문서의 웹앱 st와 수집기 y24hb 중 새것 · hlp:false = 번외 도우미가 답하지 않음
//   ② 맡은 PC 경보: 웹앱이 닫혀도 y24hb가 새로우면 '소식 없음' 아님 · 도우미가 답하지 않으면 빨강 · 로그인 필요 까닭(reWhy)을 그대로
//   ③ 판매 숫자 한 줄(y24SalesLine): 판매중(GetMainGoods → 없으면 웹앱 매물 수) · 오늘 주문 · 반품 · 문의 · 예치금 · 맡은 PC 숫자 먼저
//   ④ 글 검사: 수집기 본문 hbPut(머리 그대로) · 🧰 예스24 운영 🎓 두 번 누름(y24Arm) · 첫 실행 카드 · 판매처 탭 카드·홈 칸 줄 · 브라우저 창 없음
// 실행: node src/tests/tY24OPS3.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path'); const cp = require('child_process');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const T = fs.readFileSync(path.join(ROOT, 'src', 'app.html'), 'utf8'); const CS = fs.readFileSync(path.join(ROOT, 'src', 'readnow-collector.src.js'), 'utf8');
const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const F = new Function('num', cut('/* ◆y24hold 시작', '/* ◆y24hold 끝 */') + '\nreturn { c2CtlRow, y24HoldState, y24HoldAlertOf, y24HNm, Y24H_DEF, y24HolderOf };')((n) => String(n));
const now = Date.parse('2026-11-11T08:30:00Z'); const iso = (m) => new Date(now - m * 60e3).toISOString();

console.log('① col2_ctl 한 문서 → 새것');
{ const a = F.c2CtlRow('HOME', { at: iso(300), st: { running: true, y24: { login: 'ok' } }, y24hb: { at: iso(2), hlp: true, login: 'need', msg: '로그인 필요' } });
  ok(a.at === iso(2) && a.y.login === 'need' && a.run && a.hb, '수집기 y24hb가 더 새로우면 그것(웹앱이 닫혀 있어도)');
  const b = F.c2CtlRow('HOME', { at: iso(1), st: { running: true, y24: { login: 'ok' } }, y24hb: { at: iso(20), login: 'need' } }); ok(b.y.login === 'ok' && !b.hb, '웹앱 st가 더 새로우면 그것');
  const c = F.c2CtlRow('HOME', { y24hb: { at: iso(3), hlp: false, msg: '번외 도우미가 답하지 않음' } }); ok(c.y.hlp === false && c.run === false, 'hlp:false = 도우미 꺼짐');
  const d = F.c2CtlRow('JS-MAIN', { at: iso(5), st: { running: true } }); ok(d.y === null && d.run, '예전 꼴(y24hb 없음) 그대로'); }

console.log('② 맡은 PC 경보');
{ const st = F.y24HoldState('HOME', [F.c2CtlRow('HOME', { at: iso(300), y24hb: { at: iso(3), hlp: true, login: 'need', reWhy: '저장된 계정 없음', on: true, mine: true } })], now);
  ok(!st.stale && st.login === 'need' && st.reWhy === '저장된 계정 없음', '웹앱이 5시간 닫혀도 수집기 💓가 3분 전이면 소식 있음');
  const al = F.y24HoldAlertOf(st, now); ok(al && al.k === 'y24holdlg' && /저장된 계정 없음/.test(al.why), '로그인 필요 경보에 스스로 다시 로그인하지 않는 까닭', al);
  const s2 = F.y24HoldState('HOME', [F.c2CtlRow('HOME', { y24hb: { at: iso(4), hlp: false, msg: 'x' } })], now); const a2 = F.y24HoldAlertOf(s2, now); ok(a2 && a2.k === 'y24holdhlp' && a2.lv === 'red', '도우미가 답하지 않으면 빨강 경보', a2);
  const s3 = F.y24HoldState('HOME', [F.c2CtlRow('HOME', { at: iso(300), st: { y24: { login: 'ok' } } })], now); ok(F.y24HoldAlertOf(s3, now).k === 'y24holdstale', '둘 다 오래면 예전처럼 소식 없음 경보'); }

console.log('③ 판매 숫자 한 줄');
{ const blk = cut('/* (11/11 y24ops3 · 할 일 4)', 'function y24HoldNow');
  const mk = (ctl, extra) => new Function('S', 'db', 'y24HolderOf', 'y24HNm', 'Y24H_DEF', 'num', 'won', 'kTime', 'y24Stats', 'y24oList', blk + '\nreturn { y24SalesNums, y24SalesLine };')(
    { app: { platforms: { y24Holder: 'HOME' } }, y24: { loaded: true }, y24o: { m: new Map(extra && extra.ord ? [[1, 1]] : []) }, y24h: { ctl, at: now, busy: 0 } }, null, F.y24HolderOf, F.y24HNm, 'HOME', (n) => String(n), (n) => n + '원', (s) => '2026-11-11 ' + new Date(Date.parse(s) + 9 * 3600e3).toISOString().slice(11, 16), () => ({ on: 290 }),
    () => (extra && extra.ord) || []);
  const ctl = [{ id: 'JS-MAIN', y: { main: { ord: 9, at: now } } }, { id: 'HOME', y: { login: 'ok', main: { ord: 1, retIn: 0, noreply: 2, dep: 12300, at: now }, goods: { sell: 312, at: now }, opsNum: { retReq: 1, qaNo: 1, at: now } } }];
  const X = mk(ctl, { ord: [{ orderedAt: new Date(now - 3600e3).toISOString() }, { orderedAt: '2026-11-09T01:00:00Z' }] });
  const n = X.y24SalesNums(now); ok(n.pc === 'HOME' && n.sell === 312 && n.today === 1 && n.ordNew === 1 && n.ret === 1 && n.qa === 2 && n.dep === 12300, '맡은 PC 숫자 · 오늘 주문은 주문일이 오늘인 것만', n);
  const ln = X.y24SalesLine(now); ok(/판매중 312/.test(ln) && /오늘 주문 1 \(새 주문 1\)/.test(ln) && /반품 1/.test(ln) && /문의 2/.test(ln) && /정산\(예치금\) 12300원/.test(ln) && /17:30 기준/.test(ln), '한 줄 글', ln);
  const Y2 = mk([], null); ok(/^🟦 예스24 판매중 290$/.test(Y2.y24SalesLine(now)), '번외 숫자가 없으면 웹앱 매물 수만', Y2.y24SalesLine(now));
  const Y3 = mk([{ id: 'HOME', y: { login: 'need', main: { ord: 0, at: now } } }], null); ok(/🔐 로그인 필요/.test(Y3.y24SalesLine(now)), '로그인이 풀리면 줄 끝에 알림'); }

console.log('④ 글 검사');
{ ok(/const hbPut = async \(pc, o\)/.test(CS) && /collection\('col2_ctl'\)\.doc\(pc\)\.set\(\{ y24hb:/.test(CS) && /if \(!y\.logger\) hbPut\(pc, hbOf\(y\)\)/.test(CS) && /hlp: false/.test(CS), '수집기 본문: 번외 상태를 col2_ctl/<PC>.y24hb에(도우미가 답하지 않으면 hlp:false)');
  ok(/sg === hbSig \? t - hbAt < 10 \* 60e3 : t - hbAt < 60e3/.test(CS), '바뀐 때만(1분 안 두 번 안 씀) · 같아도 10분에 한 번');
  let head0 = ''; try { head0 = cp.execSync('git -C ' + JSON.stringify(ROOT) + ' show origin/main:src/readnow-collector.src.js', { maxBuffer: 64e6 }).toString(); } catch (e) {}
  const hd = (s) => s.split('\n').filter((l) => /^\/\/ @(match|grant|connect|require|include|noframes|run-at)/.test(l)).join('\n');
  ok(!head0 || hd(head0) === hd(CS), '수집기 머리(@match·@grant·@connect·@require) 그대로');
  const ops = cut('/* (11/11 y24ops3 · 할 일 3)', "document.addEventListener('click', async (e) => { const t = e.target.closest && e.target.closest('[data-y24ops]");
  ok(/data-y24lrn=/.test(ops) && /y24FirstHtml\(O, hold0\)/.test(ops) && /y24LearnHtml\(O, hold0\)/.test(ops) && /collection\('app_settings'\)\.doc\('y24_learn'\)/.test(ops), '🧰 예스24 운영: 🎓 배우기 단추 · 🧪 첫 실행 카드 · 받은 모양을 app_settings/y24_learn에');
  ok(/if \(t\.dataset\.y24lrn\) \{ if \(!y24Arm\(t,/.test(T), '🎓 켜기는 두 번 누름(y24Arm)');
  ok(/it\.k === 'y24Ops' \? y24SalesLine\(\)/.test(T) && /data-navgo="y24Ops" role="button" title="🧰 예스24 운영 열기">\$\{esc\(y\)\}/.test(T), '🛒 판매처 탭 🧰 예스24 운영 카드 · 🏠 홈 🧾 통합 장부 칸에 한 줄');
  ok(!/\b(alert|confirm|prompt)\(/.test(ops + cut('/* (11/11 y24ops3 · 할 일 4)', 'function y24HoldNow')), '브라우저 창(alert/confirm/prompt) 없음'); }
console.log(bad ? `✗ tY24OPS3 ${bad}개 실패` : '✓ tY24OPS3 모두 통과'); process.exit(bad ? 1 : 0);

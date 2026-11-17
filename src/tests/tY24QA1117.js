// tY24QA1117 — (11/17 y24qa2 · 정범님 11/17 12:19 「예스24 묻고답하기 … 아직 문의에 답변하지 않았는데 웹앱에서 인식도 못 해」 · 12:06 「관리자가 전혀 예스24를 열지 않고도」)
//   ① 미답변 알아봄: 번외 혼자 길이 col2_ctl.st.y24.qa에 적은 문의 줄이 💓(y24hb)보다 옛것이 아니면 c2CtlRow가 옮겨 씀 → 홈 알림·🧰 예스24 운영·👥 문의 모음
//   ② 문의 한 줄 → 알라딘 문의 꼴(y24QaItem) · 미답변 수(y24QaOpenN) · 홈 알림 숫자(y24SalesNums — 5분 문의 목록이 3시간 숫자보다 새것이면 그것)
//   ③ 답 보냄 대기열(y24QaPutOf): 맡김 문서 꼴 · 처리 중·확인됨·확실하지 않음·이미 답함이면 거절(되풀이 0) · 글 길이
//   ④ 글 검사: 문의 모음이 예스24를 합침 · 답 창 두 번 누름 · 손님 칸 없음 · 브라우저 창 없음 · 자동 답 없음
// 실행: node src/tests/tY24QA1117.js · 시험 자료에 손님 정보 없음(손님A·지어낸 문의)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const T = fs.readFileSync(path.join(ROOT, 'src', 'app.html'), 'utf8');
const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const H = new Function('num', cut('/* ◆y24hold 시작', '/* ◆y24hold 끝 */') + '\nreturn { c2CtlRow, y24HNm, Y24H_DEF };')((n) => String(n));
const fnOf = (name) => { const i = T.indexOf('function ' + name + '('); if (i < 0) throw new Error('함수 못 찾음: ' + name); let d = 0, j = T.indexOf('{', i); for (; j < T.length; j++) { if (T[j] === '{') d++; else if (T[j] === '}' && --d === 0) break; } return T.slice(i, j + 1); };
const now = Date.parse('2026-11-17T04:00:00Z'); const iso = (m) => new Date(now - m * 60e3).toISOString();
const S = { app: { platforms: {} } };
const Q = new Function('S', 'y24HNm', 'Y24H_DEF', 'num', 'esc', 'y24Off', 'y24HoldLoad', 'y24HoldCtl', 'y24HolderOf', 'db',
  fnOf('y24WDocSt') + '\n' + cut('/* ◆y24qr 시작', '/* ◆y24qr 끝 */') + '\n' + fnOf('y24QaAlertOf') + '\n' + fnOf('y24SalesNums') + '\nreturn { y24QaNo, y24QaPick, y24QaAy, y24QaItem, y24QaOpenN, y24QaPutOf, y24QnaList, y24SalesNums, y24QaAlertOf, y24WDocSt };')(
  S, H.y24HNm, H.Y24H_DEF, (n) => String(n), (s) => String(s == null ? '' : s), () => false, () => {}, () => S._ctl || [], () => 'HOME', undefined);
const qa = (at, rows, noAns) => ({ at, n: rows.length, noAns, rows });
const R1 = { no: '900001', ttl: '배송 문의', gnm: '시험 책', gno: '555', dt: '2026-11-17', ay: 0, gb: '02', ord: 1 };
const R2 = { no: '900002', ttl: '상태', gnm: '다른 책', dt: '2026-11-16', ay: 1, ans: '네 좋습니다', ansDt: '2026-11-16', gb: '01' };
const doneDoc = (no) => ({ k: 'qa', st: 'done', by: 'HOME 웹앱', doneAt: iso(1), job: { id: 'y24qa-' + no + '-t1', rows: [{ kind: 'qa', rid: 'q' + no, qno: no, txt: '오늘 보냅니다' }] }, res: { rows: { ['q' + no]: { state: 'done', msg: '답 보냄', after: { ay: 1 } } } } });

console.log('① col2_ctl → 문의 줄이 살아 옴(전엔 💓 쪽이 이겨 qa가 빠졌음)');
{ const a = H.c2CtlRow('HOME', { at: iso(4), by: '번외 홀로 HOME', st: { y24: { login: 'ok', qa: qa(now - 4 * 60e3, [R1, R2], 1), qaq: { wait: 0 } } }, y24hb: { at: iso(1), hlp: true, login: 'ok', on: true } });
  ok(a.hb && a.y.qa && a.y.qa.rows.length === 2 && a.y.qaq, '💓가 더 새로워도 번외 혼자 길의 문의 줄·대기열을 옮겨 씀', a.y);
  const b = H.c2CtlRow('HOME', { at: iso(4), st: { y24: { qa: qa(1, [R1], 1) } }, y24hb: { at: iso(1), hlp: false } }); ok(!b.y.qa, '도우미가 답하지 않으면(hlp:false) 옛 문의 줄을 옮기지 않음');
  const c = H.c2CtlRow('HOME', { at: iso(1), st: { running: true, y24: { qa: qa(now, [R1], 1) } } }); ok(c.y.qa && !c.hb, '💓 없는 예전 꼴도 그대로'); }

console.log('② 문의 한 줄 → 알라딘 문의 꼴 · 미답변 수 · 홈 알림');
{ const i1 = Q.y24QaItem(R1, null), i2 = Q.y24QaItem(R2, null);
  ok(i1.questionId === 'y24-900001' && i1.plat === 'y24' && i1.answerStatus === '미답변' && i1.title === '시험 책' && i1.kind === '주문 문의', '미답변 문의 → questionId y24-번호 · 미답변', i1);
  ok(i2.answerStatus === 'Yes' && i2.answer === '네 좋습니다' && !i2.answeredVia && i2.kind === '상품 문의', '답한 문의 → Yes · 답 글', i2);
  const i3 = Q.y24QaItem(R1, doneDoc('900001')); ok(i3.answerStatus === 'Yes' && i3.answeredVia === 'webapp' && i3.answer === '오늘 보냅니다', '웹앱에서 보내 확인됨 → 다시 읽기 전에도 답함', i3);
  ok(Q.y24QaItem({ no: '5', ttl: 'x' }, null).answerStatus === null, '답 여부를 모르면 null(미답변으로 세지 않음)');
  ok(Q.y24QaNo('y24-900001') === '900001' && Q.y24QaNo('Q123') === null && Q.y24QaNo('y24-12a') === null, '문의 번호 가려냄(알라딘 번호와 안 섞임)');
  const P = { pc: 'HOME', q: qa(now, [R1, R2], 1) }; ok(Q.y24QaOpenN(P, {}) === 1 && Q.y24QaOpenN(P, { 900001: doneDoc('900001') }) === 0, '미답변 수 — 웹앱에서 보내 확인된 것은 뺌');
  ok(Q.y24QaOpenN({ q: qa(now, [R1], 3) }, {}) === 3, '미답변 수 — 목록 NO_ANSWER_COUNT가 크면 그것(첫 쪽 밖 미답변)');
  const pk = Q.y24QaPick([{ id: 'JS-MAIN', y: { qa: qa(now, [R2], 0) } }, { id: 'HOME', y: { qa: qa(now - 60e3, [R1], 1) } }], 'HOME'); ok(pk.pc === 'HOME', '예스24를 맡은 PC 목록 먼저');
  S._ctl = [{ id: 'HOME', y: { main: { at: now - 3 * 3600e3, noreply: 0 }, qa: qa(now - 2 * 60e3, [R1, R2], 1) } }];
  const X = Q.y24SalesNums(now); ok(X.qa === 1, '홈 숫자 — 3시간 전 숫자(0)보다 5분 문의 목록(1)이 새것이면 그것', X);
  const A = Q.y24QaAlertOf(X); ok(A.length === 1 && A[0].k === 'qa' && A[0].n === 1 && /미답변 문의 1건/.test(A[0].t), '홈 알림 — 「예스24 미답변 문의 1건」', A);
  S._ctl = [{ id: 'HOME', y: { main: { at: now, noreply: 2 }, qa: qa(now - 60 * 60e3, [R2], 0) } }]; ok(Q.y24SalesNums(now).qa === 2, '문의 목록이 숫자보다 15분 넘게 옛것이면 숫자 그대로');
  S._ctl = [{ id: 'HOME', y: { qa: qa(now, [R1], 1) } }]; ok(Q.y24SalesNums(now).qa === 1, '숫자가 없어도 문의 목록만으로 셈');
  S._ctl = [{ id: 'HOME', y: { qa: qa(now, [R1], 1) } }]; const L = Q.y24QnaList(); ok(L.length === 1 && L[0].questionId === 'y24-900001', '👥 문의 모음에 들어갈 예스24 목록', L);
  S._ctl = [{ id: 'HOME', y: { qa: qa(now, [R1, { ...R1 }, { no: 'x', ay: 0 }], 1) } }]; ok(Q.y24QnaList().length === 1, '같은 문의 번호 한 줄 · 이상한 번호 버림'); }

console.log('③ 답 보냄 대기열 · 되풀이 0');
{ const ctx = { holder: 'HOME', by: '사무실 PC', email: 'x', iso: iso(0) };
  const a = Q.y24QaPutOf(null, '900001', '  주문 확인했습니다 \r\n', ctx);
  ok(a.ok && a.doc && a.doc.k === 'qa' && a.doc.st === 'new' && a.doc.holder === 'HOME' && a.doc.job.id === 'y24qa-900001-t1' && a.doc.job.rows.length === 1 && a.doc.job.rows[0].kind === 'qa' && a.doc.job.rows[0].rid === 'q900001' && a.doc.job.rows[0].txt === '주문 확인했습니다', '맡김 문서 — k qa · 한 문의 한 줄 · 글 다듬음', a.doc);
  ok(Q.y24QaPutOf(null, '900001', '네네', {}).ok && !Q.y24QaPutOf(null, '900001', '네네', {}).doc, '맡은 PC 없이는 미리 검사만(문서 안 만듦)');
  for (const st of ['new', 'took', 'run', 'hold']) ok(Q.y24QaPutOf({ st }, '900001', '네네', ctx).busy, `처리 중(${st})이면 거절`);
  ok(/다시 보내지 않음/.test(Q.y24QaPutOf(doneDoc('900001'), '900001', '네네', ctx).err || ''), '되풀이 0 — 보내 확인된 문의는 거절');
  const un = { st: 'done', job: { rows: [{ rid: 'q900001' }] }, res: { stop: true, rows: { q900001: { state: 'unsure', msg: '확실하지 않음' } } } }; ok(/확실하지 않음/.test(Q.y24QaPutOf(un, '900001', '네네', ctx).err || ''), '되풀이 0 — 확실하지 않음이면 거절');
  ok(/이미 답이 있는/.test(Q.y24QaPutOf(null, '900002', '네네', { ...ctx, answered: true }).err || ''), '예스24에 이미 답이 있으면 거절');
  const f = { st: 'done', tries: 1, at: iso(10), by: 'HOME', job: { rows: [{ rid: 'q900001', txt: '처음 글' }] }, res: { msg: '저장 안 됨', rows: { q900001: { state: 'fail', msg: '저장 안 됨' } } } };
  const b = Q.y24QaPutOf(f, '900001', '고친 글입니다', ctx); ok(b.doc && b.doc.tries === 2 && b.doc.job.id === 'y24qa-900001-t2' && b.doc.hist.length === 1 && b.doc.hist[0].txt === '처음 글', '못 보낸 뒤 다시 — 새 맡김 번호(t2)·지난 기록 남김', b.doc);
  ok(Q.y24QaPutOf(null, '900001', '   ', ctx).err && Q.y24QaPutOf(null, '900001', '가', ctx).err && Q.y24QaPutOf(null, '900001', '가'.repeat(2001), ctx).err && Q.y24QaPutOf(null, 'q1', '네네', ctx).err, '빈 답·1자·2001자·이상한 번호 거절'); }

console.log('④ 글 검사');
{ const qr = cut('/* ◆y24qr 시작', '/* ◆y24qr 끝 */');
  ok(/S\.qnaAll\.concat\(y24QnaList\(\)\)/.test(T), '👥 문의 모음이 알라딘 + 예스24를 합침');
  ok(/🟦 예스24/.test(fnOf('renderQnaBox')) && /🟧 알라딘/.test(fnOf('renderQnaBox')), '문의 모음 카드에 판매처 표시');
  ok(/y24QaSend\(/.test(fnOf('qrSend')) && /y24QrHtml\(/.test(fnOf('qrHtml')), '답 창 보내기가 예스24 문의는 예스24 길로');
  ok(/runTransaction/.test(fnOf('y24QaSend')) && /y24WRelayWhy/.test(fnOf('y24QaSend')), '맡김은 한 거래(transaction) 안 · 맡은 PC가 살아 있을 때만');
  ok(/두 번 누름/.test(fnOf('y24QaRowBtn')), '🧰 예스24 운영 줄 — 「💬 답 쓰기 · 보내기(두 번 누름)」');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(qr), '브라우저 창(alert·confirm·prompt) 없음');
  ok(!/setInterval|자동 답 보냄/.test(qr), '엔진 자동 답 없음(사람이 쓴 글 · 사람이 두 번 눌러야만)');
  ok(!/MEM_ID|MEM_NM|ORD_NM|EMAIL/.test(qr), '예스24 손님 칸(아이디·이름·메일)을 웹앱이 읽지 않음'); }

console.log(bad ? `❌ tY24QA1117 ${bad}개 실패` : '✓ tY24QA1117 모두 통과'); process.exit(bad ? 1 : 0);

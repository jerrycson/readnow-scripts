/* t_y24qa.js — (11/17 y24qa2) ❓ 예스24 문의 답: 미답변 알아봄 · 답 보냄 대기열 · 되풀이 0 — 가짜 예스24(o.api) · 크롬 없음 · 실제로 아무것도 안 보냄
 *   정범님 11/17 12:19 「아직 문의에 답변하지 않았는데 웹앱에서 인식도 못 해」 · 손님 글·답 글은 지어낸 것(손님A) */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const Y = require('../helper/col2-y24.js'); const { makeY24QA, isQa, txtWhy, initOf } = require('../helper/col2-y24qa.js'); const { stSum } = require('../../../cloud/col2solo.js');
let n = 0, bad = 0; const ok = (c, m, x) => { n++; if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ✗ ' + m + (x ? ' — ' + String(x).slice(0, 300) : '')); } };
const P_INIT = '/api/CustomerService/QAUpdateInit', P_SAVE = '/api/CustomerService/QAUpdate';
const TMP = []; const tmp = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'y24qa-')); TMP.push(d); return d; }; process.on('exit', () => { for (const d of TMP) try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) {} });
/* 가짜 예스24 — 문의 번호마다 답 글 · saves = 실제로 '보낸' 횟수 */
function fake(opt = {}) { const Q = { '900001': { ans: '', rpt: 'N' }, '900002': { ans: '이미 답한 글', rpt: 'Y' }, ...(opt.Q || {}) }; const F = { saves: [], inits: 0, dropSave: !!opt.dropSave, initFailAfterSave: !!opt.initFailAfterSave, saved: false };
  F.api = async (p, body) => { if (p === P_INIT) { F.inits++; if (F.initFailAfterSave && F.saved) return { st: 0, err: '끊김' }; const q = Q[String(body)]; if (!q) return { st: 200, j: { RESULT_CODE: 'E001' } }; return { st: 200, j: { RESULT_CODE: 'S000', UPDATE_TYPE: q.ans ? 'Modify' : 'Insert', QA: { INQRY_NO: +body, RPT_YN: q.rpt, ANSWR_CONT: q.ans, INQRY_CONT: '<p>언제 와요 010-1234-5678</p>' } } }; }
    if (p === P_SAVE) { const b = JSON.parse(body); F.saves.push(b); F.saved = true; if (!F.dropSave && Q[b.INQRY_NO]) Q[b.INQRY_NO].ans = b.ANSWR_CONT; return { st: 200, j: { RESULT_CODE: 'S000' } }; } return { st: 404 }; };
  F.Q = Q; return F; }
function mk(o = {}) { const notes = []; const HOME = o.HOME || tmp(); const F = o.F || fake(); const st = { logger: false, pc: 'HOME', en: true, login: 'ok', hold: false, ...(o.st || {}) };
  const q = makeY24QA({ HOME, SC: 0.001, note: (s) => notes.push(s), pcName: () => st.pc, isLogger: () => st.logger, enabled: () => st.en, login: () => st.login, holdOn: () => st.hold, api: F.api, onDone: (no) => notes.push('done:' + no) });
  return { q, F, HOME, notes, st }; }
const job = (id, qno, txt = '주문 확인했습니다. 오늘 보냅니다.') => ({ id, by: '웹앱 시험', rows: [{ kind: 'qa', rid: 'q' + qno, qno: String(qno), txt }] });

(async () => {
  /* ① 미답변 알아봄 — 목록 → 줄(ay 0) · 번외 → 클라우드 요약까지 qa가 살아 감(전엔 y24Line·hbOf·ySum에서 빠졌음) */
  const L = Y.qaRows({ QA_LIST: [{ INQRY_NO: 900001, TTL: '배송 문의', REG_DTS: '20261117', ANSWR_YN: 'N', MEM_ID: 'ab***', MEM_NM: '손님A', GOODS_NO: 555, GOODS_NM: '시험 책' }, { INQRY_NO: 900002, TTL: '상태', REG_DTS: '20261116', ANSWR_YN: 'Y', ANSWR_CONT: '네', ANSWR_REG_DTS: '20261116' }], NO_ANSWER_COUNT: 1, TOTAL_COUNT: 2 });
  ok(L && L.noAns === 1 && L.rows[0].ay === 0 && L.rows[1].ay === 1 && L.rows[0].no === '900001', '미답변 알아봄 — 목록의 미답변 수·줄 ay 0', JSON.stringify(L && L.rows));
  const S = stSum({ ver: '0.1.76', y24: { on: true, qa: { at: 1, n: 2, noAns: 1, rows: L.rows }, qaq: { wait: 1, cur: null, sent: { '900001': { st: 'done', at: 5 }, 'x<': { st: 'done' } }, hist: [{ at: 1, qno: '900001', st: 'done', msg: '됨' }] } } });
  ok(S && S.y24 && S.y24.qa && S.y24.qa.noAns === 1 && S.y24.qa.rows.length === 2 && S.y24.qa.rows[0].ay === 0, '클라우드 요약(col2solo) — 문의 줄·미답변 수가 col2_ctl로 감', JSON.stringify(S && S.y24));
  ok(S.y24.qaq && S.y24.qaq.wait === 1 && S.y24.qaq.sent['900001'] && !S.y24.qaq.sent['x<'], '클라우드 요약 — 답 대기열(qaq) · 이상한 문의 번호 버림');
  ok(!/손님A|ab\*\*\*/.test(JSON.stringify(S)), '클라우드 요약 — 손님 칸 없음');
  ok(isQa(job('y24qa-1-t1', 1)) && !isQa({ rows: [{ kind: 'price', rid: 'a' }] }) && !isQa({ rows: [] }), 'isQa — 줄이 모두 kind:qa일 때만 문의 답');
  ok(txtWhy('   ') && txtWhy('가') && txtWhy('가'.repeat(2001)) && !txtWhy('네 감사합니다') && txtWhy(null), '답 글 검사 — 공백만·1자·2001자·없음 거절');
  const I = initOf({ RESULT_CODE: 'S000', UPDATE_TYPE: 'Insert', QA: { ANSWR_CONT: '', RPT_YN: 'N', INQRY_CONT: '010-1111-2222 a@b.co' } });
  ok(I.ok && !I.answered && I.rpt === 'N' && !/1111|a@b/.test(I.q), '답 화면 읽기 — 미답변 · 손님 글은 전화·메일 가림');
  ok(initOf({ UPDATE_TYPE: 'Modify', QA: { ANSWR_CONT: '' } }).answered && initOf({ QA: { ANSWR_CONT: '<p>네</p>' } }).answered && !initOf(null).ok, '답 화면 읽기 — Modify·답 글 있음 = 이미 답함');

  /* ② 답 보냄 대기열 — 넣기 → 보내기 → 다시 읽어 확인 → done · after.ay 1 */
  { const { q, F, notes } = mk(); const r = q.put(job('y24qa-900001-t1', 900001));
    ok(r.code === 200 && r.body.took === 'y24qa-900001-t1' && q.state().wait.length === 1 && q.pick(), '대기열 — 맡김 받음 · 줄에 하나 · 고를 수 있음');
    const m = q.merge({ ok: true, wait: [{ id: 'w1', n: 3 }], cur: null, res: { w0: { state: 'done' } } });
    ok(m.wait.length === 2 && m.res.w0 && m.qa && m.qa.n === 1, '예스24 쓰기 상태와 합침 — 수집기는 한 상태만 봄');
    await q.once(); const R = q.state().res['y24qa-900001-t1'];
    ok(F.saves.length === 1 && F.saves[0].INQRY_NO === '900001' && F.saves[0].RPT_YN === 'N' && R && R.state === 'done' && R.rows['q900001'].after.ay === 1, '보냄 — 한 번만 보내고 다시 읽어 답 붙은 것 확인(done · after.ay 1)', JSON.stringify(R));
    ok(notes.includes('done:900001') && !notes.some((s) => /오늘 보냅니다/.test(s)), '기록엔 문의 번호·결과만(답 글 없음)');
    const s = q.sum(); ok(s.sent['900001'] && s.sent['900001'].st === 'done' && s.wait === 0 && !s.cur, '요약 — 보냄 기록(30일)');
    /* 되풀이 0 — 같은 맡김 번호 · 같은 문의 다른 맡김 */
    const a = q.put(job('y24qa-900001-t1', 900001)); ok(a.code === 200 && a.body.already, '되풀이 0 — 같은 맡김 번호는 이미 받음(다시 안 넣음)');
    const b = q.put(job('y24qa-900001-t2', 900001)); ok(b.code === 400 && /이미 답을 보냄/.test(b.body.err), '되풀이 0 — 30일 안에 답 보낸 문의는 새 맡김도 거절', JSON.stringify(b));
    q.ack(['y24qa-900001-t1']); ok(!q.state().res['y24qa-900001-t1'], '결과 받음(ack) — 결과 지움');
    await q.once(); ok(F.saves.length === 1, '되풀이 0 — 그 뒤로 보낸 것 없음'); }

  /* 같은 문의가 줄에 둘 · 줄 둘 · 글 길이 */
  { const { q, F } = mk(); ok(q.put(job('y24qa-900001-t1', 900001)).code === 200, '줄에 넣음');
    const d = q.put(job('y24qa-900001-t9', 900001)); ok(d.code === 400 && /이미 줄에 있음/.test(d.body.err), '되풀이 0 — 같은 문의가 줄에 있으면 거절');
    ok(q.put({ id: 'y24qa-2-t1', rows: [{ kind: 'qa', rid: 'q1', qno: '1', txt: '네네' }, { kind: 'qa', rid: 'q2', qno: '2', txt: '네네' }] }).code === 400, '한 맡김 = 문의 하나');
    ok(q.put(job('y24qa-3-t1', 3, ' ')).code === 400 && q.put(job('y24qa-4-t1', 'x1')).code === 400 && q.put(job('bad id!', 5)).code === 400, '빈 답·문의 번호 꼴·맡김 번호 꼴 거절');
    ok(F.saves.length === 0, '넣기만으론 아무것도 안 보냄'); }

  /* 이미 답한 문의 → 아무것도 안 보냄 */
  { const { q, F } = mk(); q.put(job('y24qa-900002-t1', 900002)); await q.once(); const R = q.state().res['y24qa-900002-t1'];
    ok(F.saves.length === 0 && R.state === 'already' && R.rows['q900002'].after.ay === 1, '이미 답한 문의 — 보내지 않음(already)', JSON.stringify(R));
    ok(q.put(job('y24qa-900002-t2', 900002)).code === 400, '이미 답함으로 본 문의 — 새 맡김도 거절'); }

  /* 저장 안 됨 → fail · 다시 보낼 수 있음(보냄 기록 지움) */
  { const F = fake({ dropSave: true }); const { q } = mk({ F }); q.put(job('y24qa-900001-t1', 900001)); await q.once(); const R = q.state().res['y24qa-900001-t1'];
    ok(F.saves.length === 1 && R.state === 'fail' && !q.sum().sent['900001'] && !q.R.stop, '다시 읽어도 답 없음 — 못 보냄(fail) · 멈추지 않음', JSON.stringify(R));
    ok(q.put(job('y24qa-900001-t2', 900001)).code === 200, '못 보낸 문의는 사람이 다시 보낼 수 있음'); }

  /* 보낸 뒤 확인 못 함 → unsure + 멈춤 · 다시 안 보냄 */
  { const F = fake({ initFailAfterSave: true }); const { q } = mk({ F }); q.put(job('y24qa-900001-t1', 900001)); await q.once(); const R = q.state().res['y24qa-900001-t1'];
    ok(F.saves.length === 1 && R.state === 'unsure' && R.stop && q.R.stop && q.sum().sent['900001'].st === 'sending', '확인 못 함 — 확실하지 않음 + 멈춤', JSON.stringify(R));
    const x = q.put(job('y24qa-900003-t1', 900003)); ok(x.code === 409 && x.body.stop, '멈춘 동안 새 맡김 거절');
    q.resume('시험'); const y = q.put(job('y24qa-900001-t2', 900001)); ok(y.code === 400 && /이미 답을 보냄/.test(y.body.err), '이어 가도 그 문의는 다시 안 보냄(보내는 중 기록)'); }

  /* 보내는 사이 다시 켜짐 → 확인만 */
  { const HOME = tmp(); const F = fake(); F.Q['900001'].ans = '이미 붙은 답';
    fs.writeFileSync(path.join(HOME, 'y24-qa.json'), JSON.stringify({ wait: [], cur: { id: 'y24qa-900001-t1', rid: 'q900001', qno: '900001', txt: '네 보냅니다', step: 'send' }, res: {}, sent: { '900001': { st: 'sending', at: Date.now() } }, hist: [] }));
    const { q } = mk({ HOME, F }); ok(q.R.cur && q.R.cur.vfy && q.pick(), '다시 켜짐(보내는 단계) — 확인만 할 차례');
    await q.once(); const R = q.state().res['y24qa-900001-t1']; ok(F.saves.length === 0 && R.state === 'done', '다시 켜짐 — 다시 보내지 않고 읽어 답 붙은 것 확인', JSON.stringify(R)); }
  { const HOME = tmp(); const F = fake();
    fs.writeFileSync(path.join(HOME, 'y24-qa.json'), JSON.stringify({ wait: [], cur: { id: 'y24qa-900001-t1', rid: 'q900001', qno: '900001', txt: '네 보냅니다', step: 'send' }, res: {}, sent: {}, hist: [] }));
    const { q } = mk({ HOME, F }); await q.once(); const R = q.state().res['y24qa-900001-t1']; ok(F.saves.length === 0 && R.state === 'fail', '다시 켜짐 · 답 없음 — 그래도 다시 보내지 않음(사람이 다시 누름)', JSON.stringify(R)); }
  { const HOME = tmp(); fs.writeFileSync(path.join(HOME, 'y24-qa.json'), JSON.stringify({ wait: [], cur: { id: 'y24qa-900001-t1', rid: 'q900001', qno: '900001', txt: '네 보냅니다', step: 'init' }, res: {}, sent: {}, hist: [] }));
    const { q } = mk({ HOME }); ok(!q.R.cur && q.R.wait.length === 1 && q.R.wait[0].id === 'y24qa-900001-t1', '다시 켜짐(보내기 전) — 줄 맨 앞으로 되돌림'); }

  /* 지킴 — 로거·MJ-MAIN·꺼짐·로그인·출고 */
  { const a = mk({ st: { logger: true } }); ok(a.q.put(job('y24qa-900001-t1', 900001)).code === 409, '로거 PC — 거절(헌장 제5조)');
    const b = mk({ st: { pc: 'MJ-MAIN' } }); ok(b.q.put(job('y24qa-900001-t1', 900001)).code === 409, 'MJ-MAIN — 거절');
    const c = mk({ st: { en: false } }); ok(c.q.put(job('y24qa-900001-t1', 900001)).code === 409, '예스24 읽기 꺼짐 — 거절');
    const d = mk(); d.q.put(job('y24qa-900001-t1', 900001)); d.st.hold = true; ok(!d.q.pick() && /출고/.test(d.q.state().why), '출고 중 — 보내기 전 기다림');
    d.st.hold = false; d.st.login = 'need'; ok(!d.q.pick() && /로그인/.test(d.q.state().why), '로그인 풀림 — 보내기 전 기다림');
    d.st.login = 'ok'; ok(d.q.pick(), '풀리면 다시 고름'); }

  /* 파일 — 결과 뒤엔 답 글이 남지 않음 */
  { const { q, HOME } = mk(); q.put(job('y24qa-900001-t1', 900001)); await q.once(); const t = fs.readFileSync(path.join(HOME, 'y24-qa.json'), 'utf8');
    ok(!/오늘 보냅니다/.test(t), '보낸 뒤 이 PC 파일에 답 글이 남지 않음'); }
  console.log(bad ? `✗ t_y24qa ${bad}/${n} 실패` : `✓ t_y24qa 모두 통과 (${n}개)`); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('✗ t_y24qa 오류 ' + e.stack); process.exit(1); });

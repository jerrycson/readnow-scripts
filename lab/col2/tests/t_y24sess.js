/* t_y24sess — (11/13 y24sess1 · 정범님 22:53 카드 n1113y24sess 「끊는 곳 찾기 + 한도도 올려」) 스스로 다시 로그인 하루 한도·끊긴 뒤 기다림 늘리기
 *  ① 기본 하루 한도 30(예전 10) · 오늘 10번 쓴 PC도 새 판을 받으면 곧바로 다시 해도 됨(11:06까지 기다리지 않음) · 설정 값(perDay)이 있으면 그 값
 *  ② 오래 산 세션(예: 60분 뒤 풀림)은 기다림을 늘리지 않음 — 예스24 세션이 1시간쯤 뒤 풀리는 것은 서로 끊기가 아님
 *  ③ 금방 끊김(shortMin분 안)·「이미 로그인된」 끊김이 연달아 n번이면 gapMin × 2^n분 기다림(5 → 10 → 20 … backMaxMin까지) · 오래 산 세션이 나오면 처음부터
 *  ④ 간격 0(시험)이면 늘리기 끔 · 상태(sum)에 기다림·수명 자취(값 없음)
 * 실행: node tests/t_y24sess.js */
const L = require('./lib.js'); const { ok } = L; const fs = require('fs'), path = require('path'), os = require('os');
const { makeRelogin, DEF } = require(path.join(L.ROOT, 'helper', 'col2-relogin.js'));
const SM = require(path.join(L.ROOT, 'helper', 'col2-settings.js'));

(async () => {
  let T = Date.now(); const realNow = Date.now; Date.now = () => T; /* 시계를 손으로 돌림 */
  const mk = (D, rc, notes) => makeRelogin({ HOME: D, cred: { has: () => true, PF: { y24: { name: '예스24 판매관리' } }, sum: () => ({ y24: { has: true } }) }, cfg: () => ({ relogin: rc || {} }), isLogger: () => false, note: (m) => notes && notes.push(m) });
  const okCtx = { name: '예스24 판매관리', loginUrl: 'x', pre: async () => ({ ok: true }), nav: async () => {}, ev: async () => '', sleep: async () => {}, type: async () => {}, check: async () => true };
  const dir = () => { const D = fs.mkdtempSync(path.join(os.tmpdir(), 'c2ys_')); L.track(D); return D; };

  console.log('① 하루 한도 30');
  ok(DEF.perDay === 30 && DEF.perHour === 3 && DEF.gapMin === 5, '기본 하루 30 · 한 시간 3 · 사이 5분 그대로', DEF);
  { const row = (SM.SCHEMA || []).find((r) => r.k === 'relogin.perDay'); ok(!SM.SCHEMA || (row && row.hi >= 30), '⚙ 설정 › 🧪 번외 › 🔐 다시 로그인 하루 칸에서 바꿀 수 있음(1~100)', row); }
  { const D = dir(); const t = T; /* HOME 11/13 꼴: 지난 24시간에 10번 · 마지막 18:12 */
    fs.writeFileSync(path.join(D, 'relogin.json'), JSON.stringify({ y24: { tries: Array.from({ length: 10 }, (_, i) => t - 4 * 3600e3 - i * 3600e3), fails: 0, stop: null, auto: true, n: 40, last: { at: t - 4 * 3600e3, ok: true } } }));
    for (const m of ['.fix1111', '.fix1112', '.fix1113']) fs.writeFileSync(path.join(D, 'relogin.json' + m), '1');
    ok(mk(D, { perDay: 10 }).why('y24', {}) !== null && /24시간에 10번까지/.test(mk(D, { perDay: 10 }).why('y24', {})), '예전 한도(10)라면 막힘', mk(D, { perDay: 10 }).why('y24', {}));
    const R = mk(D, {}); ok(R.why('y24', {}) === null, '새 판(30)을 받으면 곧바로 다시 해도 됨 — 다음 날 11:06까지 기다리지 않음', R.why('y24', {})); ok(R.sum().y24.next === null && R.sum().y24.perDay === 30, '상태: 다시 되는 때 없음 · 한도 30', R.sum().y24); }

  console.log('② 오래 산 세션은 기다림을 늘리지 않음');
  { const D = dir(); const R = mk(D, { perHour: 50 });
    for (let i = 0; i < 4; i++) { await R.run('y24', okCtx); T += 60 * 60e3; R.dropAfterOk('y24', '창 주소가 로그인 화면으로 바뀜(/Login/Login)'); ok(R.why('y24', {}) === null, `${i + 1}번째: 60분 산 세션이 풀림 → 곧바로 다시 로그인`, R.why('y24', {})); }
    ok(!R.back('y24'), '기다림 없음'); ok(R.sum().y24.lives.length === 4 && R.sum().y24.lives.every((x) => x.m === 60 && !x.kick), '수명 자취 60분 × 4', R.sum().y24.lives); }

  console.log('③ 금방 끊김이 이어지면 기다림을 늘림');
  { const D = dir(); const nt = []; const R = mk(D, { perHour: 50 }, nt); const want = [10, 20, 40, 80, 120, 120];
    for (let i = 0; i < want.length; i++) { await R.run('y24', okCtx); T += 10 * 60e3; R.dropAfterOk('y24', i === 1 ? '「이미 로그인된 예스24」 화면 — 다른 곳 로그인으로 세션이 끊김' : '창 주소가 로그인 화면으로 바뀜(/Login/Login)');
      const b = R.back('y24'); const w = R.why('y24', {}) || ''; ok(b && b.n === i + 1 && b.min === want[i] && new RegExp(`끊긴 뒤 ${i + 1}번 연달아 금방 끊김 — ${want[i]}분 기다림`).test(w), `${i + 1}번 연달아 → ${want[i]}분 기다림`, { b, w });
      T += (want[i] - 1) * 60e3; ok(/기다림/.test(R.why('y24', {}) || ''), `${want[i] - 1}분 뒤엔 아직 기다림`); T += 61e3; ok(R.why('y24', {}) === null, `${want[i]}분 지나면 다시 해도 됨`, R.why('y24', {})); }
    await R.run('y24', okCtx); T += 90 * 60e3; R.dropAfterOk('y24', '창 주소가 로그인 화면으로 바뀜(/Login/Login)'); ok(!R.back('y24') && R.why('y24', {}) === null, '오래 산 세션(90분)이 한 번 나오면 셈을 처음부터');
    { const D2 = dir(); const R2 = mk(D2, { perHour: 50 }); await R2.run('y24', okCtx); T += 50 * 60e3; R2.dropAfterOk('y24', '「이미 로그인된 예스24」 화면 — 다른 곳 로그인으로 세션이 끊김'); ok(R2.back('y24') && R2.back('y24').min === 10, '「이미 로그인된」 끊김은 오래 살았어도 금방 끊김으로 셈(다른 곳이 막 로그인함 → 10분 양보)', R2.back('y24')); }
    { const D3 = dir(); const R3 = mk(D3, { perHour: 50, shortMin: 9, backMaxMin: 30 }); await R3.run('y24', okCtx); T += 10 * 60e3; R3.dropAfterOk('y24', 'x'); ok(!R3.back('y24'), '설정 shortMin 9분 — 10분 산 세션은 금방 끊김 아님');
      for (let i = 0; i < 4; i++) { await R3.run('y24', okCtx); T += 3 * 60e3 + 30e3; R3.dropAfterOk('y24', 'x'); } ok(R3.back('y24').min === 30, '설정 backMaxMin 30분이 끝', R3.back('y24')); }
    ok(!/비밀번호:|pw/.test(JSON.stringify(R.sum().y24.lives)), '자취에 값 없음'); }

  console.log('④ 간격 0이면 늘리기 끔');
  { const D = dir(); const R = mk(D, { gapMin: 0, perHour: 50 }); for (let i = 0; i < 3; i++) { await R.run('y24', okCtx); T += 60e3; R.dropAfterOk('y24', 'x'); } ok(!R.back('y24') && !/기다림/.test(R.why('y24', {}) || ''), '간격 0 = 늘리기 없음', R.why('y24', {})); }
  Date.now = realNow;
  L.done('t_y24sess');
})().catch((e) => { console.log('✗ 예외', e); process.exit(1); });

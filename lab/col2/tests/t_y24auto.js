/* t_y24auto — (11/17 bunoe1 · 리드 알림 I-1117-1616-16.8 · 바로잡은 사실 F02 「저장된 정보로 저절로 로그인 — 정범님께 손 로그인을 청하지 않음」)
 *  ① 문의 답이 로그인만 기다리면(urgent) 스스로 다시 로그인을 서두름 — 끊긴 뒤 늘린 기다림(최대 120분) 건너뜀 · 앞 시도 간격 2분까지 · 출고 중·멈춤·한 시간·하루 몫은 그대로
 *  ② 문의 답 기다림 글은 「저장된 계정으로 스스로 다시 로그인한 뒤 보냄(사람 손 필요 없음)」 · 스스로 못 하는 까닭이 있으면 함께 · wants() = 답이 로그인만 기다림
 *  ③ 번외 홀로 상태(col2_ctl/<PC>.st)는 칸마다 통째로 바꿈 — 옛 st.y24.loginMsg·at(11/13 「판매관리 첫 화면이 로그인 화면」)이 지금 'ok' 옆에 남지 않음 · 번외가 모르는 칸은 그대로
 *  ④ 본문 — 로그인 풀림 알림이 계정이 있으면 단추를 누르라고 하지 않음
 * 실행: node tests/t_y24auto.js */
const L = require('./lib.js'); const { ok } = L; const fs = require('fs'), path = require('path'), os = require('os');
const { makeRelogin } = require(path.join(L.ROOT, 'helper', 'col2-relogin.js'));
const { makeY24QA } = require(path.join(L.ROOT, 'helper', 'col2-y24qa.js'));
const { stSum } = require(path.join(L.ROOT, '..', '..', 'cloud', 'col2solo.js'));
const { makeDb } = require('./fakefs-admin.js');

(async () => {
  let T = Date.now(); const realNow = Date.now; Date.now = () => T;
  const dir = () => { const D = fs.mkdtempSync(path.join(os.tmpdir(), 'c2ya_')); L.track(D); return D; };
  const mk = (D, rc) => makeRelogin({ HOME: D, cred: { has: () => true, PF: { y24: { name: '예스24 판매관리' } }, sum: () => ({ y24: { has: true } }) }, cfg: () => ({ relogin: rc || {} }), isLogger: () => false, note: () => {} });
  const okCtx = { name: '예스24 판매관리', loginUrl: 'x', pre: async () => ({ ok: true }), nav: async () => {}, ev: async () => '', sleep: async () => {}, type: async () => {}, check: async () => true };

  console.log('① 문의 답이 기다리면 스스로 다시 로그인을 서두름');
  { const R = mk(dir(), { perHour: 50 });
    for (let i = 0; i < 3; i++) { await R.run('y24', okCtx); T += 10 * 60e3; R.dropAfterOk('y24', '「이미 로그인된 예스24」 화면 — 다른 곳 로그인으로 세션이 끊김'); }
    const w = R.why('y24', {}) || ''; ok(/분 기다림/.test(w) && R.back('y24'), '보통 때는 끊긴 뒤 늘린 기다림 그대로', w);
    ok(R.why('y24', { urgent: true }) === null, '답이 기다리면 늘린 기다림을 건너뛰고 곧바로 다시 로그인', R.why('y24', { urgent: true }));
    ok(/출고/.test(R.why('y24', { urgent: true, hold: true }) || ''), '출고 중엔 답이 기다려도 미룸(약속 0-1)');
    ok(/핑퐁/.test(R.why('y24', { urgent: true, pp: '핑퐁' }) || ''), '핑퐁 멈춤은 그대로'); }
  { const R = mk(dir(), {}); await R.run('y24', okCtx); T += 60e3;
    ok(/5분 기다림/.test(R.why('y24', {}) || ''), '보통 때는 앞 시도 뒤 5분', R.why('y24', {}));
    ok(/2분 기다림/.test(R.why('y24', { urgent: true }) || ''), '답이 기다려도 앞 시도 뒤 2분은 지킴', R.why('y24', { urgent: true }));
    T += 2 * 60e3; ok(R.why('y24', { urgent: true }) === null, '2분 뒤엔 다시 로그인'); }
  { const R = mk(dir(), { perHour: 2, gapMin: 0 }); await R.run('y24', okCtx); await R.run('y24', okCtx); ok(/한 시간 2번/.test(R.why('y24', { urgent: true }) || ''), '한 시간 몫은 답이 기다려도 그대로(계정 보호)'); }
  { const R = mk(dir(), { perHour: 50, perDay: 2, gapMin: 0 }); await R.run('y24', okCtx); await R.run('y24', okCtx); ok(/24시간에 2번/.test(R.why('y24', { urgent: true }) || ''), '하루 몫도 그대로'); }

  console.log('② 문의 답 기다림 글 · wants()');
  { const HOME = dir(); const st = { login: 'need', hold: false, en: true, reWhy: '' };
    const q = makeY24QA({ HOME, SC: 0.001, note: () => {}, pcName: () => 'HOME', isLogger: () => false, enabled: () => st.en, login: () => st.login, holdOn: () => st.hold, reWhy: () => st.reWhy, api: async () => ({ st: 404 }) });
    ok(!q.wants(), '줄이 비면 서두르지 않음');
    const r = q.put({ id: 'y24qa-900001', by: '정범님', rows: [{ qno: '900001', txt: '안녕하세요. 문의 주셔서 감사합니다. 오늘 보내 드립니다.' }] }); ok(r.code === 200 && r.body.ok, '맡김 받음(로그인이 풀려 있어도)', r.body);
    const s = q.state(); ok(/로그인 기다림/.test(s.why || '') && /스스로 다시 로그인한 뒤 보냄/.test(s.why) && /사람 손 필요 없음/.test(s.why) && !/단추/.test(s.why), '기다림 글 = 저장된 계정으로 스스로 다시 로그인한 뒤 보냄(단추를 누르라 하지 않음)', s.why);
    ok(q.wants() && !q.pick(), '답이 로그인만 기다림 → 서두름 · 아직 안 보냄');
    st.reWhy = '24시간에 30번까지 — 21:07부터 다시'; ok(/스스로 못 하는 까닭: 24시간에 30번/.test(q.state().why || ''), '스스로 못 하는 까닭을 함께 보임', q.state().why);
    st.hold = true; ok(!q.wants(), '출고 중엔 서두르지 않음'); st.hold = false;
    st.login = 'ok'; ok(q.pick(), '다시 로그인되면 곧바로 보낼 차례'); }

  console.log('③ 번외 홀로 상태 — 옛 st.y24 칸이 남지 않음');
  { const s = stSum({ ver: '0.1.77', running: true, y24: { on: true, login: 'ok', loginMsg: null, loginAt: T } }); ok(s.y24 && s.y24.login === 'ok' && s.y24.loginMsg === null && s.y24.loginAt === T, '요약에 로그인 글·때를 실음(ok면 비움)', s.y24);
    const F = makeDb(); const ref = F.db.collection('col2_ctl').doc('HOME');
    await ref.set({ at: '2026-11-13T00:41:58Z', st: { helper: { v: '웹앱이 쓴 값' }, y24: { login: 'need', loginMsg: '판매관리 첫 화면이 로그인 화면', at: '2026-11-13T00:41:58Z' } } });
    const src = fs.readFileSync(path.join(L.ROOT, '..', '..', 'cloud', 'col2solo.js'), 'utf8'); const m = src.match(/async function putSt[\s\S]*?return 'put'; \}/); ok(!!m && /mergeFields: \['at', 'by', 'solo', \.\.\.Object\.keys\(s\)\.map\(\(k\) => 'st\.' \+ k\)\]/.test(m[0]) && !/merge: true/.test(m[0]), 'putSt는 st 칸마다 통째로(mergeFields) — 깊은 merge 아님');
    await ref.set({ at: 'x', by: '번외 홀로 HOME', st: s, solo: { at: 'x' } }, { mergeFields: ['at', 'by', 'solo', ...Object.keys(s).map((k) => 'st.' + k)] });
    const d = (await ref.get()).data(); ok(d.st.y24.login === 'ok' && d.st.y24.loginMsg === null && d.st.y24.at === undefined, '옛 loginMsg·at(11/13)이 사라지고 지금 ok만', d.st.y24);
    ok(d.st.helper && d.st.helper.v === '웹앱이 쓴 값', '번외가 모르는 칸(helper)은 그대로', d.st.helper); }

  console.log('④ 본문 — 계정이 있으면 손 로그인을 청하지 않음');
  { const y = fs.readFileSync(path.join(L.ROOT, 'helper', 'col2-y24.js'), 'utf8');
    ok(/R\.why\('y24', \{ hold: holdOn\(\), urgent: !!\(QA && QA\.wants && QA\.wants\(\)\) \}\)/.test(y), 'autoRe가 문의 답 기다림을 urgent로 넘김');
    ok(/au \? '🔐 예스24 세션 풀림 — 저장된 계정으로 번외가 곧 스스로 다시 로그인\(사람 손 필요 없음/.test(y), '로그인 풀림 알림 = 계정이 있으면 스스로 다시 로그인');
    ok(/reWhy: \(\) => \(Y\.reWhy && Y\.reWhy\.why\) \|\| ''/.test(y), '문의 답에 스스로 못 하는 까닭을 넘김'); }
  Date.now = realNow; L.done('t_y24auto');
})();

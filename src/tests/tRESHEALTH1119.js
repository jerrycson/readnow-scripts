// 🩺 연구·엔진 건강 장부(cloud/reshealth.js · engloop1 11/19) 시험 — node src/tests/tRESHEALTH1119.js
// ① 판정(ok·늦음·0·없음) ② 늦음/0 → 스스로 다시 부름 → 나아지면 실패 0 ③ 두 번 다시 불러도 안 되면 카드 하루 한 장(✕ 닫기 되는 노트 카드)
// ④ dailyJobs 실패 남김 ⑤ R12·C05 셈이 score.py와 같음 ⑥ 맥박 대신 넣기 — 세션이 넣은 새 값은 안 덮음 · 오래된 것만 · trend 덧붙임 ⑦ 끄기
const R = require('../../cloud/reshealth.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ✗', m); } else console.log('  ✓', m); };
const H = 3600e3; let T = Date.parse('2026-11-19T09:00:00Z'); // 한국 18시
const iso = (ms) => new Date(ms).toISOString();
function fakeDb() { const M = new Map(); const C = (c) => ({ doc: (id) => ({ get: async () => { const k = c + '/' + id; return { exists: M.has(k), data: () => (M.has(k) ? JSON.parse(JSON.stringify(M.get(k))) : undefined) }; },
  set: async (v, o) => { const k = c + '/' + id; const deep = (a, b) => { const r = { ...(a || {}) }; for (const [kk, vv] of Object.entries(b)) r[kk] = vv && typeof vv === 'object' && !Array.isArray(vv) && r[kk] && typeof r[kk] === 'object' && !Array.isArray(r[kk]) ? deep(r[kk], vv) : vv; return r; }; M.set(k, o && o.merge ? deep(M.get(k), v) : v); } }) }); return { M, C }; }
function seedOk(M) { for (const j of R.RH_JOBS) { const d = {}; const put = (p, v) => { const s = p.split('.'); let x = d; for (let i = 0; i < s.length - 1; i++) x = x[s[i]] = x[s[i]] || {}; x[s[s.length - 1]] = v; }; put(j.at, iso(T - 2 * H)); if (j.n) put(j.n, 10); M.set(j.doc, d); } }

(async () => {
  console.log('① 판정');
  const J = R.RH_JOBS.find((j) => j.k === 'cons');
  ok(R.rhJudge(J, null, T).st === 'none', '문서 없음 → none');
  ok(R.rhJudge(J, { at: iso(T - 31 * H), tot: { orders: 5 } }, T).st === 'late', '30시간 넘음 → late');
  ok(R.rhJudge(J, { at: iso(T - 2 * H), tot: { orders: 0 } }, T).st === 'zero', '결과 0 → zero');
  const g = R.rhJudge(J, { at: { _seconds: (T - 2 * H) / 1000 }, tot: { orders: 7 } }, T); ok(g.st === 'ok' && g.n === 7 && g.ageH === 2, 'Firestore 때 값도 읽음 · ok · n 7 · 2시간');
  ok(R.rhJudge(R.RH_JOBS.find((j) => j.k === 'learn'), { learn: { at: iso(T - H), rows: 94619 } }, T).n === 94619, '안쪽 칸(learn.rows)');

  console.log('② 늦음 → 다시 부름 → 나아짐');
  { const { M, C } = fakeDb(); seedOk(M); M.set('app_settings/cons_study', { at: iso(T - 40 * H), tot: { orders: 9 } }); let n = 0; const notes = [];
    const RH = R.makeResHealth({ C, W: () => ({}), log: () => {}, nowIso: () => iso(T), now: () => T, notes: async (o) => notes.push(o), redo: { cons: async () => { n++; M.set('app_settings/cons_study', { at: iso(T), tot: { orders: 9 } }); return { ok: 1 }; } } });
    M.set('app_settings/research_pulse', { studies: { R05: { at: iso(T - 3 * H), src: '진단 …' } } });
    const d = await RH.check({ force: true }); const x = M.get('app_settings/research_health');
    ok(n === 1 && d.jobs.cons.st === 'ok' && d.jobs.cons.tries === 1 && d.jobs.cons.fail === 0 && x.ok === true, '소비심리 늦음 → 한 번 다시 셈 → ok · 실패 0 · 장부 ok');
    ok(notes.length === 0, '나아지면 카드 없음');
    const d2 = await RH.check(); ok(d2 === null, '30분 안에는 다시 안 봄'); }

  console.log('③ 두 번 다시 불러도 안 됨 → 카드 하루 한 장');
  { const { M, C } = fakeDb(); seedOk(M); M.set('app_settings/badge_study', { at: iso(T - 50 * H), runs: 3 }); let n = 0; const notes = [];
    M.set('app_settings/research_pulse', { studies: { R05: { at: iso(T - 3 * H), src: '진단' } } });
    const RH = R.makeResHealth({ C, W: () => ({}), log: () => {}, nowIso: () => iso(T), now: () => T, notes: async (o, by) => notes.push([o, by]), redo: { badge: async () => { n++; throw new Error('셈 3분 넘김'); } } });
    let d = await RH.check({ force: true }); ok(d.jobs.badge.fail === 1 && d.jobs.badge.tries === 1 && /실패 셈 3분/.test(d.jobs.badge.redoR) && notes.length === 0, '1번째: 다시 → 실패 1 · 아직 카드 없음');
    d = await RH.check({ force: true }); ok(d.jobs.badge.fail === 2 && notes.length === 1, '2번째도 실패 → 카드');
    const c = notes[0][0][0]; ok(c.op === 'merge' && c.id === 'rh_2026-11-19' && c.data.kind === 'card' && c.data.state === 'open' && c.data.cat === '연구' && /표시 배지/.test(c.data.body) && notes[0][1] === 'engine:health', '카드: 노트 카드(웹앱 #rn-notes ✕ 닫기) · 일 이름·실패 수');
    d = await RH.check({ force: true }); ok(n === 2 && d.jobs.badge.tries === 2 && notes.length === 1, '하루 2번까지만 다시 부름 · 같은 날 카드 한 장');
    T += 24 * H; d = await RH.check({ force: true }); ok(n === 3 && d.jobs.badge.tries === 1, '다음 날 다시 셈 처음부터'); T -= 24 * H; }

  console.log('③-2 다시 부를 길이 없는 일 · 세션 맥박 묵음');
  { const { M, C } = fakeDb(); seedOk(M); M.set('app_settings/voice_study', { at: iso(T - 60 * H), n: 5 }); const notes = [];
    M.set('app_settings/research_pulse', { studies: { R05: { at: iso(T - 50 * H), src: '진단 …' }, N05: { at: iso(T - H), src: 'cloud engself 1.0.0' }, N15: { at: iso(T - H), src: 'app_settings/ed_study' } } });
    const RH = R.makeResHealth({ C, W: () => ({}), log: () => {}, nowIso: () => iso(T), now: () => T, notes: async (o) => notes.push(o), redo: {} });
    const d = await RH.check({ force: true }); ok(d.jobs.voice.st === 'late' && d.jobs.voice.fail === 0 && d.sess.st === 'late' && d.sess.ageH === 50, '구매평 늦음(깃발만) · 세션 맥박 50시간(클라우드 src는 뺌)');
    ok(notes.length === 1 && /세션/.test(notes[0][0].data.body) && /R05/.test(notes[0][0].data.body), '세션 맥박 48시간 넘음 → 카드'); }

  console.log('④ dailyJobs 실패 남김');
  { const { M, C } = fakeDb(); seedOk(M); const notes = []; M.set('app_settings/research_pulse', { studies: { R05: { at: iso(T - H), src: 'x' } } });
    const RH = R.makeResHealth({ C, W: () => ({}), log: () => {}, nowIso: () => iso(T), now: () => T, notes: async (o) => notes.push(o), redo: {} });
    await RH.noteRun({ consErr: '소비심리 셈 180초 넘김', pxErr: null }); await RH.noteRun({ consErr: '또' });
    const x = M.get('app_settings/research_health'); ok(x.jobs.cons.errN === 2 && x.jobs.cons.err === '또' && !x.jobs.px, '실패 키 → 일마다 errN · 없는 키는 안 남김');
    const d = await RH.check({ force: true }); ok(d.jobs.cons.st === 'ok' && d.jobs.cons.errN === 2 && notes.length === 1, '하루 실패 2번 → 일은 ok여도 카드'); }

  console.log('⑤ R12·C05 셈(score.py와 같은 값)');
  { const tl = [['2026-11-01', '상', 10, 8], ['2026-11-01', '최상', 5, 5], ['2026-11-02', '상', 10, 6], ['2026-11-02', '중', 4, 1], ['2026-11-03', '상', 8, 7], ['2026-11-03', '최상', 2, 0]];
    const c = R.rhCalib(tl); // 같은 자료로 score.py calib_timesplit을 파이썬으로 돌린 값: n 24 · groups 3 · brier_chall 0.321593038 · brier_base 0.311803849 · ECE 0.324796/0.218199
    ok(c && c.n === 24 && c.groups === 3 && Math.abs(c.brier_chall - 0.32159303836800207) < 1e-12 && Math.abs(c.brier_base - 0.31180384903333774) < 1e-12 && Math.abs(c.chall - 0.3247956577266923) < 1e-12 && Math.abs(c.base - 0.21819923371647518) < 1e-12, `Brier 등급별 ${c && c.brier_chall.toFixed(7)} · 전체율 ${c && c.brier_base.toFixed(7)}`);
    ok(R.rhCalib([]) === null && R.rhCalib([['2026-11-01', '상', 3, 1]]) === null, '첫 날만 있으면 셈 없음');
    const A = R.rhPairs([{ why: ['사업자 등록번호 같음', '주소 건물 같음'] }, { why: ['주소 건물 같음'] }, { why: ['전화 같음', '공정위 대표자명 같음'] }, { why: ['택배 같음', '분야 같음'] }]);
    ok(A.pairs === 4 && A.truth === 2 && A.flagged === 3 && A.both === 1 && Math.abs(A.prec - 1 / 3) < 1e-9 && A.recall === 0.5, `짝 일치 정밀 ${A.prec} · 되찾음 ${A.recall} (전화 같음 = 셈에서 뺌)`); }

  console.log('⑥ 맥박 대신 넣기');
  { const { M, C } = fakeDb(); const calls = [];
    M.set('app_settings/voice_study', { at: iso(T), cover: 0.3, n: 9 }); M.set('app_settings/badge_study', { at: iso(T), liftMed: 1.7, runs: 3 }); M.set('app_settings/eng_fence', { noLossMode: true });
    M.set('app_settings/ml_state', { learn: { at: iso(T), rows: 5, metrics: { champ: { logloss: 0.056531 }, chall: { logloss: 0.053869 }, base: { logloss: 0.056436 } } } });
    M.set('app_settings/buyback_stats', { tl: [['2026-11-01', '상', 10, 8], ['2026-11-02', '상', 10, 6]] });
    M.set('seller_fp_runs/2026-11-18_deep', { day: '2026-11-18', pairs: [{ why: ['사업자 등록번호 같음', '주소 건물 같음'] }, { why: ['주소 건물 같음'] }] });
    M.set('app_settings/research_pulse', { studies: { N06: { at: iso(T - 40 * H), metric: '구매평 주제 찾은 몫(cover · 높을수록 좋음)', trend: [{ d: '2026-11-17', v: 0.26 }], src: '진단 app_settings/voice_study' }, R20: { at: iso(T - 3 * H), src: '진단 …', value: 1.61 } } });
    const RH = R.makeResHealth({ C, W: () => ({}), log: () => {}, nowIso: () => iso(T), now: () => T, pulse: async (P, by) => { calls.push([P, by]); return { n: Object.keys(P.studies).length }; } });
    T -= 3 * H; ok(await RH.relay() === null, '한국 17시 전에는 안 함'); T += 3 * H;
    const r = await RH.relay(); const S = calls[0][0].studies;
    ok(calls.length === 1 && calls[0][1] === 'engine:health' && S.N06 && S.N06.value === 0.3 && S.N06.trend.length === 2 && S.N06.trend[1].d === '2026-11-19' && /^cloud reshealth/.test(S.N06.src), 'N06 40시간 묵음 → 대신 넣음 · trend 덧붙임 · src cloud reshealth');
    ok(!S.R20 && r.skipped.includes('R20'), 'R20은 세션이 3시간 전에 넣음 → 안 덮음');
    ok(S.R02 && S.R02.champ === 0.056531 && S.R02.chall === 0.053869 && S.R18.value === 1 && S.R12 && S.C05 && S.C05.value === 0.5, 'R02 챔피언·도전자(소수 6자리) · R18 · R12 · C05(어제 _deep 문서)');
    ok(await RH.relay() === null && M.get('app_settings/research_health').relay.day === '2026-11-19', '하루 한 번만 · 장부에 relay 남김'); }

  console.log('⑦ 끄기');
  { const { M, C } = fakeDb(); M.set('app_settings/research_health_cfg', { on: false }); const RH = R.makeResHealth({ C, W: () => ({}), log: () => {}, nowIso: () => iso(T), now: () => T });
    ok((await RH.check({ force: true })).skip === 'off' && (await RH.relay({ force: true })).skip === 'off' && !M.has('app_settings/research_health'), 'research_health_cfg.on=false면 아무것도 안 씀'); }

  console.log(bad ? `❌ ${bad}개 실패` : '✓ tRESHEALTH1119 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 예외', e.stack); process.exit(1); });

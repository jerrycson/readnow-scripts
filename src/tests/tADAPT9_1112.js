// tADAPT9_1112 — 11/12 밤 adapt9: 🔄 목표·방법 적응 틀(약속 64 '상대는 방식을 바꾼다'가 전제 · 모든 엔진 공용)
//   ① 가짜 원문에서 표기가 바뀜('Sales Point' → '세일즈포인트') → 판정 '무너짐' → 바뀐 것 찾기(표기 바뀜 · 사라진/새 낱말) → 같은 뜻 다른 표기 후보 → 작은 표본 시험 → 채택 → 달성률 회복 · 옛 방법 보관 · 기록 줄
//   ② 옛 방법이 좋으면 고수(작은 표본 한 번 이긴 후보로 바꾸지 않음 · 연속 두 번 이겨야)
//   ③ 100%여도 탐색을 멈추지 않음(ε ≥ 3%) · 같은 성공률이면 비용이 싼 길로(효율)
//   ④ 상대가 옛 표기로 돌아오면 보관한 옛 방법으로 '되돌림'
//   ⑤ 막힘·경로 바뀜 분류 · 요약(웹앱 🔬 연구 탭) · 클라우드·웹앱에 붙은 자리(글 검사)
// 실행: cd src/tests && node tADAPT9_1112.js · 지어낸 값만(손님 정보 없음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const find = (L) => { for (const b of [path.join(__dirname, '..'), path.join(__dirname, '../..')]) for (const x of L) { const f = path.join(b, x); if (fs.existsSync(f)) return f; } return null; };
const A = require(find(['readnow-adapt-core.js']));
const CSRC = fs.readFileSync(find(['cloud/index.js']), 'utf8');
const APP = fs.readFileSync(find(['src/app.html', 'app.html']), 'utf8');
const fmt = (n) => n.toLocaleString('en-US');
const T0 = Date.parse('2026-11-01T03:00:00Z'); const H = 3600e3;
/* 지어낸 목록 한 줄 원문 — 표기(lbl)만 바꿔 냄 */
const row = (sp, lbl, cls) => `<li class="${cls || 'ss_line'}">판매가 <em>13,500원</em> (10%할인) · ${lbl} :<span class="sales_point"> ${fmt(sp)}</span> · 지은이 가나다</li>`;
const SPS = Array.from({ length: 40 }, (_, i) => 120 + i * 977);
/* 엔진 한 회차 흉내: 챔피언 방법(이름표 정규식)으로 원문을 읽어 성공 수를 넣음 */
const runOnce = (g, lbl, t, k0, use) => { const S = SPS.slice(k0, k0 + 8).map((sp) => ({ s: row(sp, lbl), v: sp })); const mid = use || g.champ; const m = g.methods[mid]; let got = 0; for (const x of S) if (A.agApply(m, x.s) === x.v) got++; A.agRecord(g, mid, { n: S.length, ok: got, cost: 1 }, t); A.agSample(g, mid, S[0].s, got >= S.length * 0.8, t); return { S, got }; };

(async () => {
  console.log('① 표기가 바뀌면 스스로 새 표기를 찾아 달성률 회복');
  const G = {}; const seed = { label: '목록 SP 읽기', goal: '검색 목록 줄마다 세일즈포인트', unit: '줄', target: 0.9, methods: [{ id: 'lbl:Sales Point', label: "이름표 'Sales Point'", how: 'label', re: A.agLblRe('Sales Point') }], champ: 'lbl:Sales Point' };
  const g = A.agEnsure(G, 'list_sp', seed);
  ok(g.champ === 'lbl:Sales Point' && g.methods['lbl:Sales Point'].st === 'champ', '씨앗으로 챔피언 정함');
  for (let d = 0; d < 5; d++) for (let h = 0; h < 3; h++) { const r = runOnce(g, 'Sales Point', T0 + d * 24 * H + h * H, (d * 3 + h) % 30); A.agAdapt(g, { now: T0 + d * 24 * H + h * H, samples: r.S, spec: { field: 'salesPoint', type: 'int', range: [0, 1e7] } }); }
  ok(A.agJudge(g).st === 'ok' && g.champ === 'lbl:Sales Point', '5일 동안 잘 됨 → 판정 ok · 챔피언 그대로', A.agJudge(g));
  /* 6일째 — 상대가 표기를 한글로 바꿈 */
  const t6 = T0 + 5 * 24 * H; let lines = [];
  for (let h = 0; h < 3; h++) { const r = runOnce(g, '세일즈포인트', t6 + h * H, 10 + h * 8); const o = A.agAdapt(g, { now: t6 + h * H, samples: r.S, spec: { field: 'salesPoint', type: 'int', range: [0, 1e7] } }); lines = lines.concat(o.lines); }
  const ch = lines.find((l) => l.kind === '바뀜'); const ad = lines.find((l) => l.kind === '채택');
  ok(ch && /표기 바뀜/.test(ch.t) && /Sales/.test(ch.t) && /세일즈포인트/.test(ch.t), "바뀐 것 찾기: '표기 바뀜' · 사라진 낱말·새 낱말을 줄에 적음", ch);
  ok(ad && /세일즈포인트/.test(ad.ev.to) && ad.ev.why === 'broken', "새 표기 '세일즈포인트' 방법 채택(옛 방법이 무너짐)", ad);
  ok(g.champ === 'lbl:세일즈포인트', '챔피언 = 새 표기', g.champ);
  ok(g.methods['lbl:Sales Point'].st === 'arch' && g.arch.length === 1 && g.arch[0].id === 'lbl:Sales Point', '옛 방법은 지우지 않고 보관(arch)', g.arch);
  ok(lines.every((l) => l.src === '엔진' && l.eng === 'list_sp' && l.at && l.t), "기록 줄 형식 {at, src:'엔진', eng, kind, t}", lines[0]);
  /* 다음 회차 — 새 챔피언으로 달성률 회복 */
  const r7 = runOnce(g, '세일즈포인트', t6 + 5 * H, 20); const o7 = A.agAdapt(g, { now: t6 + 5 * H, samples: r7.S, spec: { field: 'salesPoint' } });
  ok(r7.got === 8, '채택 뒤 회차 달성률 100%로 회복', r7.got);
  ok(A.agJudge(g).st === 'ok' || (o7.lines || []).some((l) => l.kind === '회복'), '판정 다시 ok(회복 줄)', A.agJudge(g));
  ok((g.ev || []).some((e) => e.kind === '채택') && (g.ev || []).some((e) => e.kind === '바뀜'), '목표 장부에도 바뀜·채택 기록', g.ev);

  console.log('② 먹히는 방법은 고수');
  const g2 = A.agEnsure({}, 'keep', { label: '고수 시험', unit: '건', methods: [{ id: 'a', label: '길 A' }, { id: 'b', label: '길 B' }], champ: 'a' });
  for (let d = 0; d < 4; d++) A.agRecord(g2, 'a', { n: 50, ok: 48, cost: 50 }, T0 + d * 24 * H);
  A.agRecord(g2, 'b', { n: 4, ok: 4, cost: 4 }, T0 + 3 * 24 * H);
  let L2 = A.agDecide(g2, T0 + 3 * 24 * H);
  ok(!L2.length && g2.champ === 'a', '작은 표본(4건 100%) 후보로는 바꾸지 않음 — 챔피언 96% 고수', { L2, champ: g2.champ });
  A.agRecord(g2, 'b', { n: 30, ok: 29, cost: 30 }, T0 + 3 * 24 * H); L2 = A.agDecide(g2, T0 + 3 * 24 * H);
  ok(!L2.length && g2.champ === 'a', '성공률 비슷(97% vs 96%)하면 한 번 이겨도 그대로', { champ: g2.champ, w: g2.methods.b.win });
  /* 잠깐 흔들림(한 회차 나쁨)으로 판정이 '무너짐'이 되지 않게 */
  A.agRecord(g2, 'a', { n: 50, ok: 40, cost: 50 }, T0 + 3 * 24 * H + H); ok(A.agJudge(g2).st !== 'broken', '한 회차 80%로 떨어진 것은 무너짐이 아님', A.agJudge(g2));

  console.log('③ 100%여도 탐색 · 같은 성공률이면 싼 길로');
  const g3 = A.agEnsure({}, 'eff', { label: '효율 시험', methods: [{ id: 'one', label: '한 권씩' }, { id: 'multi', label: '여러 번호 한 검색어' }], champ: 'one' });
  for (let d = 0; d < 3; d++) A.agRecord(g3, 'one', { n: 100, ok: 100, cost: 100 }, T0 + d * 24 * H);
  const picks = {}; for (let i = 0; i < 200; i++) { const p = A.agPick(g3, i / 200); picks[p.why] = (picks[p.why] || 0) + 1; }
  ok(picks['탐색'] >= 6 && picks['고수'] > 150, '100%여도 3% 넘게 다른 길을 시험(탐색) · 대부분 고수', picks);
  ok(A.agPick(g3, 0.5).mid === 'one', '탐색 아닌 회차는 챔피언', A.agPick(g3, 0.5));
  A.agRecord(g3, 'multi', { n: 60, ok: 60, cost: 6 }, T0 + 2 * 24 * H);
  let L3 = A.agDecide(g3, T0 + 2 * 24 * H); ok(!L3.length, '처음 한 번 이김은 그대로(안정 — 연속 두 번)', L3);
  A.agRecord(g3, 'multi', { n: 60, ok: 60, cost: 6 }, T0 + 2 * 24 * H + H); L3 = A.agDecide(g3, T0 + 2 * 24 * H + H);
  ok(L3.length === 1 && L3[0].kind === '채택' && L3[0].ev.why === 'cheaper' && g3.champ === 'multi', '두 번째에 채택 — 성공률 같고 비용당 성공 10배', L3[0]);

  console.log('④ 상대가 옛 표기로 돌아오면 보관한 옛 방법으로 되돌림');
  const t9 = t6 + 2 * 24 * H; let L4 = [];
  for (let h = 0; h < 3; h++) { const r = runOnce(g, 'Sales Point', t9 + h * H, 5 + h * 8); L4 = L4.concat(A.agAdapt(g, { now: t9 + h * H, samples: r.S, spec: { field: 'salesPoint' } }).lines); }
  const back = L4.find((l) => l.kind === '되돌림');
  ok(back && g.champ === 'lbl:Sales Point', "옛 방법 'Sales Point'로 되돌림(지우지 않고 보관했기 때문)", { L4, champ: g.champ });
  ok(g.methods['lbl:세일즈포인트'].st === 'arch' && g.arch.length === 2, '방금 쓰던 방법도 보관', g.arch);

  console.log('⑤ 분류 · 요약 · 붙은 자리');
  ok(A.agClassify('<b>a</b>', '<html>Too Many Requests</html>', { status: 429 }).k === 'block', '429 = 막힘');
  ok(A.agClassify('<b>상품</b>', '<a href="/login/wlogin.aspx">로그인이 필요합니다</a>').k === 'path', '로그인으로 넘겨짐 = 경로 바뀜');
  ok(A.agClassify(row(5, 'Sales Point', 'ss_line'), row(5, 'Sales Point', 'ss_row2')).k === 'place', 'class 이름만 바뀜 = 자리 바뀜', A.agClassify(row(5, 'Sales Point', 'ss_line'), row(5, 'Sales Point', 'ss_row2')));
  ok(A.agClassify(null, '').k === 'empty', '빈 답');
  const c0 = A.agLabelCands([{ s: '판매지수 4,210 · 정가 15,000원' }], { field: 'salesPoint' });
  ok(c0.some((c) => c.lbl === '판매지수' && c.src === 'syn'), '아는 값이 없어도 같은 뜻 다른 표기 사전(AG_SYN)으로 후보', c0);
  ok(A.agApply({ re: A.agLblRe('세일즈 포인트') }, '세일즈포인트 : 1,234') === 1234, '띄어쓰기 달라도 같은 이름표로 읽음');
  const sm = A.agSummary(g); ok(sm && sm.champ && sm.champ.label && sm.st && Array.isArray(sm.cands) && sm.last && /되돌림|회복/.test(sm.last.kind) && sm.arch === 2, '요약(지금 방법·성공률·최근 바뀜·대체 후보)', sm);
  ok(JSON.stringify(G).length < 20000, '목표 장부 하나가 작음(20KB 밑 · Firestore 한 문서에 여러 엔진)', JSON.stringify(G).length);
  ok(!/\.reduce\(/.test(fs.readFileSync(find(['readnow-adapt-core.js']), 'utf8').split('목표·방법 적응 틀')[1].split('const api =')[0]), '적응 틀은 reduce를 쓰지 않음(알라딘 화면 prototype.js)');
  ok(/async function agObs\(/.test(CSRC) && /adapt_goals/.test(CSRC) && /finds_inbox/.test(CSRC), '클라우드: agObs · app_settings/adapt_goals · 발견 모음 넘김(finds_inbox)');
  for (const k of ['spfill', 'list_sp', 'sp_panel', 'y24_search', 'seller_shop', 'seller_items', 'read_']) ok(CSRC.includes(`'${k}`), `클라우드 엔진 붙음: ${k}`);
  ok(/function openAdaptSt\(/.test(APP) && /adapt_goals/.test(APP) && /adaptSt:/.test(APP), '웹앱 🔬 연구 탭 카드 🔄 엔진 적응 상태');

  console.log('⑥ 클라우드 붙이기 덩어리를 가짜 Firestore로 실제로 돌림');
  { const blk = CSRC.slice(CSRC.indexOf('/* ◆ag (adapt9'), CSRC.indexOf('/* ◆adapt 끝 */')); const DB = {}; const docOf = (c, d) => ({ get: async () => { const v = DB[c + '/' + d]; return { exists: !!v, data: () => (v ? JSON.parse(JSON.stringify(v)) : undefined) }; }, set: async (v, o) => { const cur = DB[c + '/' + d] || {}; const mg = (a, b) => { for (const [k, x] of Object.entries(b)) { if (x && typeof x === 'object' && !Array.isArray(x) && x.__au) a[k] = (a[k] || []).concat(x.__au); else if (x && typeof x === 'object' && !Array.isArray(x) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) mg(a[k], x); else a[k] = x; } return a; }; DB[c + '/' + d] = o && o.merge ? mg(cur, JSON.parse(JSON.stringify(v, (k, x) => x))) : v; }, update: async (...a) => { const cur = DB[c + '/' + d]; if (!cur) throw new Error('없음'); for (let i = 0; i < a.length; i += 2) { const f = a[i]; const segs = typeof f === 'string' ? f.split('.') : f.segs; let o = cur; for (const sg of segs.slice(0, -1)) o = o[sg] = o[sg] || {}; o[segs[segs.length - 1]] = a[i + 1]; } } });
    const logs = []; const env = { C: (c) => ({ doc: (d) => docOf(c, d) }), adaptMod: async () => A, log: (...a) => logs.push(a.join(' ')), nowIso: () => new Date().toISOString(), kDay: () => '2026-11-12', FV: { arrayUnion: (...x) => ({ __au: x }) }, FieldPath: function (...segs) { this.segs = segs; }, ADS: () => docOf('app_settings', 'adapt_sel'), ADSEL: { at: 1 } };
    const fn = new Function(...Object.keys(env), blk + '\nreturn { agObs, agChoose, agSave, agLoad, AGX, AG_SEED };'); const M = fn(...Object.values(env));
    const raw = (lbl, sp) => `<li>판매가 13,500원 · ${lbl} : ${sp}</li>`;
    for (let i = 0; i < 4; i++) await M.agObs('list_sp', M.AG_SEED.list_sp, 'base', { n: 40, ok: 38, cost: 4 });
    for (let i = 0; i < 3; i++) await M.agObs('list_sp', M.AG_SEED.list_sp, 'base', { n: 40, ok: 0, cost: 4 }, { raw: raw('판매지수', 120 + i), good: false, samples: [1, 2, 3, 4].map((k) => ({ s: raw('판매지수', 100 * k + i) })), spec: { field: 'salesPoint', type: 'int', range: [0, 1e7] } });
    await M.agSave(true); const G = DB['app_settings/adapt_goals']; const F = DB['app_settings/finds_inbox'];
    ok(G && G.g && G.g.list_sp && G.sum && G.sum.list_sp, '장부 저장(app_settings/adapt_goals g·sum)', Object.keys(G || {}));
    ok(G.g.list_sp.champ === 'lbl:판매지수', "목록 SP가 무너지자 같은 뜻 다른 표기 '판매지수'를 사전에서 찾아 채택", G.g.list_sp.champ);
    ok(F && F.L && F.L.some((l) => l.kind === '바뀜') && F.L.some((l) => l.kind === '채택') && F.fmt, '발견 모음 넘김(finds_inbox) — 바뀜·채택 줄과 형식 설명', F);
    ok(logs.some((l) => /🔄 적응/.test(l)), '클라우드 기록에도 한 줄', logs.slice(0, 3));
    const pk = await M.agChoose('sp_panel', M.AG_SEED.sp_panel); ok(pk && pk.mid, '길 고르기(agChoose) 답', pk); }
  console.log(bad ? `\n❌ ${bad}개 실패` : '\n✅ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

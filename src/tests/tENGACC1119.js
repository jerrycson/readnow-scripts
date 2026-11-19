// (engacc1 11/19) 🎯 팔릴 확률 엔진 정확도 — 무게 배우기 · 대리 표본(시장 매물) · 사라짐 보정 확률 · 새 승격(문턱 = 지금 모델·새 기준선 중 나은 쪽) · 조율 한 걸음
const ML = require([__dirname + '/../readnow-ml-core.js', __dirname + '/../../readnow-ml-core.js'].find((f) => require('fs').existsSync(f))); /* (testfix1 11/19) 박혀 있던 /home/claude/w 경로 대신 — 시험 문지기 자리(w/pw → w/)·저장소(src/tests → 뿌리) 둘 다 */ const fs = require('fs'); let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) bad++; };
ok(ML.VERSION >= '0.10.0', 'ml-core 판 ' + ML.VERSION);
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const rows = [], y = []; for (let i = 0; i < 3000; i++) { const r = { price: 2000 + Math.round(rnd() * 150) * 100, grade: i % 3, rank: 1 + (i % 7), sameMin: 3000, minAll: 2500, age: 30 + (i % 200), list: 15000 }; const z = -2.5 + (r.rank === 1 ? 1.3 : 0) - 0.00008 * r.price; rows.push(r); y.push(rnd() < 1 / (1 + Math.exp(-z)) ? 1 : 0); }
const X = rows.map(ML.feats);
// ① 무게 없음 = 예전 그대로 · 무게 모두 1 = 무게 없음 · 두 번 넣기 = 무게 2
const a = ML.train(X, y), b = ML.train(X, y, { w: X.map(() => 1) }); ok(JSON.stringify(a.w) === JSON.stringify(b.w) && a.b === b.b, '무게 모두 1 = 무게 없음(글자 그대로)');
const h = X.slice(0, 500), hy = y.slice(0, 500); const c2 = ML.train(h.concat(h), hy.concat(hy)), w2 = ML.train(h, hy, { w: h.map(() => 2) }); ok(Math.max(...c2.w.map((v, i) => Math.abs(v - w2.w[i]))) < 1e-9, '두 번 넣기 = 무게 2');
const soft = ML.train(X.slice(0, 300), y.slice(0, 300).map((v) => v * 0.7)); ok(soft.w.every(Number.isFinite), '부드러운 답(0~1)도 배움');
// ② 사라짐 보정 확률 — 사전값·한꺼번에 사라짐은 낮게·범위 안
const p0 = ML.goneSaleP({}); ok(Math.abs(p0 - ML.GONE_P.prior) < 1e-9 || (p0 > 0.5 && p0 < 0.9), '사전값 ' + p0);
const pb = ML.goneSaleP({ k: 40, med: 2 }); ok(pb < p0 && pb >= ML.GONE_P.min, '한꺼번에 사라짐은 낮게 ' + pb);
ok([{ k: 1, med: 1, life: 1, rank: 1 }, { k: 99, med: 0.1, life: 0, rank: 20, relist: true }].every((o) => { const p = ML.goneSaleP(o); return p >= ML.GONE_P.min && p <= ML.GONE_P.max; }), '늘 범위 안');
// ③ 대리 줄 — 안 사라짐 y=0 · 사라짐 y=확률 + 남은 날 y=0 · 특징이 만들어짐
const PR = ML.proxyRows([{ price: 5000, g: '상', rank: 1, w: 14 }, { price: 7000, g: '최상', rank: 2, w: 21, y: 1, k: 1, med: 1, life: 10 }, { price: 0, w: 3 }], { age: 90, mkt: 5 });
ok(PR.rows.length === 3 && PR.gone === 1 && PR.rows[0].y === 0 && Math.abs(PR.rows[0].w - 2) < 1e-9, '대리 줄 ' + JSON.stringify(PR.rows.map((q) => [q.y, q.w])));
ok(PR.rows[1].y > 0 && PR.rows[1].y < 1 && PR.rows[2].y === 0 && PR.goneP === PR.rows[1].y, '사라짐 = 판매 확률 · 남은 날 0');
ok(PR.rows.every((q) => Array.isArray(ML.feats(q.r)) && ML.feats(q.r).length === ML.FEATURES.length && q.r.proxy), '대리 줄 특징 ' + ML.FEATURES.length + '칸');
// ④ 새 승격 — 문턱 = 지금 모델과 새 기준선 중 나은 쪽 · 이어서 2일 · 그림자 거부
const E = (ll, auc, pos) => ({ n: 30000, pos: pos ?? 370, logloss: ll, auc });
const val = { chall: E(0.053869, 0.703), champ: E(0.056531, 0.501), base: E(0.056436, 0.547) };
const d1 = ML.promoteCheck({ val, streak: 0 }); ok(d1.win && !d1.ok && d1.streak === 1 && d1.bar.auc === 0.547, '11/18 숫자 첫날 이김(아직 1/2) — ' + d1.why);
const d2 = ML.promoteCheck({ val, streak: 1 }); ok(d2.ok, '이어서 2일 → 승격');
ok(!ML.promoteCheck({ val: { ...val, chall: E(0.0562, 0.71) }, streak: 1 }).win, '로그 손실 여유(1%) 못 넘으면 안 이김');
ok(!ML.promoteCheck({ val: { ...val, chall: E(0.05, 0.54) }, streak: 1 }).win, 'AUC가 새 기준선 못 넘으면 안 이김');
ok(!ML.promoteCheck({ val: { ...val, chall: E(0.05, 0.8, 10) }, streak: 1 }).win, '검증 팔림 30건 미만이면 안 이김');
const shL = [1, 2, 3].map(() => ({ champ: E(0.05, 0.6), chall: E(0.06, 0.55) })); const vt = ML.promoteCheck({ val, streak: 1, shadow: shL }); ok(vt.win && vt.veto && !vt.ok, '그림자 3번 중 3번 지면 거부');
// ⑤ 조율 — 범위 안 한 걸음 · 여유는 그림자로
const T = ML.tuneClamp({ l2: 9, share: -1, margin: 1 }); ok(T.l2 === ML.ML_TUNE.l2[1] && T.share === 0 && T.margin === ML.ML_TUNE.margin[1], '범위 밖은 울타리 안으로');
const C = ML.tuneCands(ML.ML_TUNE.def, '2026-11-19', true); ok(C.length >= 3 && C[0].tag === 'cur' && C.every((c) => c.l2 >= ML.ML_TUNE.l2[0] && c.l2 <= ML.ML_TUNE.l2[1] && c.share >= 0 && c.share <= ML.ML_TUNE.share[1]), '후보 ' + JSON.stringify(C));
ok(!ML.tuneCands(ML.ML_TUNE.def, '2026-11-19', false).some((c) => /^share/.test(c.tag)), '대리 표본 없으면 몫 후보 없음');
ok(ML.tuneMargin(0.01, shL) > 0.01 && ML.tuneMargin(0.01, [1, 2, 3].map(() => ({ champ: E(0.06, 0.5), chall: E(0.05, 0.6) }))) < 0.01, '여유: 그림자 지면 올림 · 모두 이기면 내림');
// ⑥ 대리 표본이 함께하면 검증(진짜 줄만)이 무너지지 않음
const tr = X.slice(0, 2000), ty = y.slice(0, 2000); const vX = rows.slice(2000), vY = y.slice(2000); const ev = (M) => ML.evaluate(vX.map((r) => ML.predict(M, r)), vY);
const px = []; for (let i = 0; i < 2000; i++) { const r = rows[i]; px.push({ price: r.price, g: ['최상', '상', '중'][r.grade], rank: r.rank, sameMin: r.sameMin, minAll: r.minAll, list: r.list, w: 14, ...(y[i] ? { y: 1, k: 1, med: 1, life: 20 } : {}) }); }
const P2 = ML.proxyRows(px, { age: 90 }); const pw = P2.rows.reduce((a, q) => a + q.w, 0), f = 0.3 * tr.length / pw;
const m0 = ML.train(tr, ty), m1 = ML.train(tr.concat(P2.rows.map((q) => ML.feats(q.r))), ty.concat(P2.rows.map((q) => q.y)), { w: tr.map(() => 1).concat(P2.rows.map((q) => q.w * f)) });
const e0 = ev(m0), e1 = ev(m1); ok(e1.logloss < e0.logloss * 1.05 && e1.auc > 0.5, `대리 표본 30% — 검증 로그 손실 ${e0.logloss.toFixed(4)} → ${e1.logloss.toFixed(4)} · AUC ${e0.auc.toFixed(3)} → ${e1.auc.toFixed(3)}`);
// ⑦ 클라우드 코드 모양
const S = fs.readFileSync(__dirname + '/../../cloud/index.js', 'utf8');
ok(/function mlProxyKeep\(BO\)/.test(S) && /mlProxyKeep\(BO\)/.test(S), '판매가치 배우기 관찰을 대리 표본으로 담음');
ok(/ML\.promoteCheck\(/.test(S) && /valWin/.test(S) && /champStale/.test(S), '새 승격(이어서 이긴 날 · 낡은 기준선 갈아 끼움)');
ok(/goneSaleP: PR\.goneP/.test(S) && /proxy, tune/.test(S), '보고 칸: 대리 표본 수·사라짐 보정 확률');
ok(/doc\('ml_health'\)/.test(S) && /mlHealth\(\{ ok: false/.test(S), '건강 장부(실패 2번 = alert)');
ok(/q\.mllearn/.test(S) && /\|ml_eval\|ml_models\|/.test(S), '진단 mllearn · ml_eval·ml_models 읽기');
ok(/ML\.train\(workerData\.X, workerData\.Y, workerData\.O/.test(S), '일꾼 배우기에 무게·l2 넘김');
console.log(bad ? `✗ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);

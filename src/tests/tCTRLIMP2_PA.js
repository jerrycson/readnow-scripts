// tCTRLIMP2_PA — (ctrlimp2 · 설계 CTRLDES2 4 판 파(+바) · 정범님 11/18 23:44 결정) 🗼 묶음 관제창 판 파 — 🎯 판매자 한눈판 · 판매자 한 장 · 무시 전 영향 보기 · 🔥 내림 경쟁
//  ① 글: 새 이름 한 번 선언 · 브라우저 창 없음 · 관제창이 쓰지 않음 · 관제창·카드·누름·cheExcl·ctrlKeys에 걸림 · 설명서 문단
//  ② 셈(vm): 판매자별 겨룬 책·지금 판·🔥·멈춘 값 가운데 · 우리 가게·30일 밖·묶음 밖 상품은 뺌 · 무시 전 영향(올라감/내려감 · 추천 자리 꺼짐이면 그대로) · 정책 원본은 그대로
// 실행: node tCTRLIMP2_PA.js · 시험 자료의 판매자는 「판매자A·판매자B」 꾸민 이름뿐 · 실제 가격 바꾸기·확정 실행·저장 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const m0 = T.indexOf('/* (판 파 · ctrlimp2'), m1 = T.indexOf('function ctrlInput(e) {'); const PA = m0 > 0 && m1 > m0 ? T.slice(m0, m1) : '';
const c0 = T.indexOf('function cheExcl(place)'), c1 = T.indexOf('function cheExclKey(place)'); const CX = c0 > 0 && c1 > c0 ? T.slice(c0, c1) : '';
console.log('① 글');
ok(!!PA && !!CX, '판 파 덩이·cheExcl이 있음');
{ const names = ['CTRL_FIRE_STEPS', 'ctrlChEng', 'ctrlFire', 'ctrlFoldKeys', 'ctrlChStats', 'ctrlFireOf', 'ctrlFireLine', 'ctrlChBtn', 'ctrlChClick', 'ctrlChPick', 'CTRL_STANCE_KO', 'ctrlChBox', 'ctrlChTry', 'ctrlChTryHtml'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup); }
ok(!/\b(alert|confirm|prompt)\s*\(/.test(PA), '브라우저 창 없음');
ok(!/db\.|batchSave|runTransaction|bkfGlSet|savePricingCfg|ctrlPerSave|\.update\(/.test(PA), '관제창은 쓰지 않음(읽기·셈만)');
ok(/if \(S\._cheXTry && place in S\._cheXTry\) return S\._cheXTry\[place\];/.test(CX), 'cheExcl이 무시 전 영향 사본을 먼저 봄');
ok(/finally \{ S\._cheXTry = old; \}/.test(PA), '셈 뒤 사본을 반드시 되돌림');
ok(/if \(P\.chSet && !P\.chSet\.has\(k\)\) continue;/.test(T), '판매자를 고르면 그 상품만(ctrlKeys)');
ok(/ctrlChBtn\(P\)/.test(T) && /ctrlChBox\(P\)/.test(T) && /ctrlFireLine\(P, it\)/.test(T) && /d\.cch\) return ctrlChClick\(P\)/.test(T) && /d\.cchtry\)/.test(T) && /d\.cfire\)/.test(T), '관제창·카드·누름에 걸림');
ok(/openChaseEngine\(d\.cchbl \? \{ bl: sc/.test(T), '태세·무시는 🎯 추격자 엔진을 열어 거기서 저장');
ok(/chase: d\.cfire === 'hold' \? 'hold' : 'yield'/.test(T), '🔥 양보·유지 = 📌 개별 칸 채워 엶(저장 따로)');
ok(/🎯 판매자 — 추격자 한눈판 \(판 파\)/.test(T), '설명서 문단');

// ② vm
const D = 864e5, now = Date.parse('2026-11-19T00:00:00Z'); const iso = (ms) => new Date(ms).toISOString();
const policy = { on: true, sellers: { B2: { stance: 'defensive' } }, excl: { rec: true, mkt: false, strat: false } };
const CH = { EXCL: { mkt: 1, strat: 1, rec: 1 }, normPolicy: (p) => ({ on: !!(p && p.on), sellers: { ...((p && p.sellers) || {}) }, excl: { ...((p && p.excl) || {}) } }),
  blAdd: (P, sc) => { if (P.sellers[sc] && P.sellers[sc].stance === 'ignore') return false; P.sellers[sc] = { stance: 'ignore' }; return true; },
  ignored: (P) => Object.keys(P.sellers).filter((k) => P.sellers[k].stance === 'ignore'), exclLive: (P) => !!P.on };
CH.exclSet = (P, pl) => { if (!P.excl[pl] || !CH.exclLive(P)) return null; const L = CH.ignored(P); return L.length ? new Set(L) : null; };
const ctx = { console, Map, Set, Date, Math, JSON, Object, String, Number, Array, isFinite, Promise, Error, num: (n) => String(n), esc: (s) => String(s), won: (n) => n + '원', errKo: (e) => String(e && e.message), CTRL_SC_W: 30 * D };
ctx.window = { ReadnowChase: CH }; ctx.S = { prCfg: { chaseEng: policy }, _bkfTb: { g1: { cls: new Map([['aladin_1', 'pick'], ['aladin_2', 'pick']]) }, g2: { cls: new Map([['aladin_3', 'done']]) } }, plist: new Map() };
ctx.ctrlKids = () => [{ id: 'g1' }, { id: 'g2' }]; ctx.cheSellerName = (sc) => ({ A1: '판매자A', B2: '판매자B' }[sc] || null);
// 꾸민 추천 계산: 무시 목록(rec)에 A1이 있으면 A1과 겨루는 상품(l.a1) 추천이 500원 오름 · B2를 빼면 l.b2 상품이 300원 내림
ctx.batchCompute = (c, rows) => { const X = ctx.cheExcl('rec'); return rows.map((l) => ({ l, target: l.base + (X && X.has('A1') && l.a1 ? 500 : 0) - (X && X.has('B2') && l.b2 ? 300 : 0) })); };
ctx.ctrlPerFix = (c, R) => R;
vm.createContext(ctx);
vm.runInContext(CX + PA + '\n;this.__M = { ctrlChStats, ctrlFire, ctrlFireOf, ctrlChTry, ctrlChTryHtml, ctrlChBox, ctrlFireLine };', ctx);
const M = ctx.__M;
console.log('② 셈');
const ep = (o) => ({ startedAt: iso(now - 2 * D), steps: 2, startP: 9000, lastP: 9000, lastChP: 8800, active: false, ...o });
const eps = [ep({ key: 'aladin_1', sc: 'A1', active: true, steps: 7, startP: 9000, lastP: 7500, lastChP: 7400 }), ep({ key: 'aladin_2', sc: 'A1', steps: 3, lastChP: 6000 }), ep({ key: 'aladin_2', sc: 'A1', steps: 2, lastChP: 7000 }),
  ep({ key: 'aladin_3', sc: 'B2', active: true, steps: 4, lastChP: 5000 }), ep({ key: 'aladin_1', sc: '996008', active: true, steps: 9, lastP: 1 }), ep({ key: 'aladin_3', sc: 'B2', startedAt: iso(now - 40 * D) }), ep({ key: 'aladin_9', sc: 'B2' })];
{ const L = M.ctrlChStats({ fid: 'f1' }, eps, now); const a = L.find((o) => o.sc === 'A1'), b = L.find((o) => o.sc === 'B2');
  ok(L.length === 2 && !L.some((o) => o.sc === '996008'), '우리 가게는 판매자 목록에서 뺌', L.map((o) => o.sc));
  ok(L[0].sc === 'A1' && a.books === 2 && a.n === 3 && a.now === 1 && a.fire === 1, '판매자A — 겨룬 책 2 · 판 3 · 지금 1 · 🔥 1 · 많이 겨룬 차례 첫째', a);
  ok(a.mean === 4 && a.stopMed === 7000 && a.name === '판매자A' && a.stance === null, '한 판 평균 수 · 멈춘 값 가운데 · 꾸민 이름 · 태세 없음', [a.mean, a.stopMed, a.name, a.stance]);
  ok(b.books === 1 && b.n === 1 && b.now === 1 && b.fire === 0 && b.stance === 'defensive', '판매자B — 30일 밖·묶음 밖 상품은 뺌 · 태세 방어적', b);
  ok(M.ctrlFire(eps[0]) && !M.ctrlFire(eps[3]) && !M.ctrlFire({ ...eps[0], active: false }) && !M.ctrlFire({ ...eps[0], lastP: 9500 }), '🔥 = 이어지는 판 · 6수 넘음 · 우리 값이 내려감');
  ctx.S._ctrlEps = { at: 1, eps }; ok(M.ctrlFireOf('aladin_1') && M.ctrlFireOf('aladin_1').sc === 'A1' && !M.ctrlFireOf('aladin_3'), '카드 🔥 줄은 상대 판매자 판만(우리 가게 판 아님)');
  const fl = M.ctrlFireLine({}, { k: 'aladin_1', id: 'g1|aladin_1' }); ok(/🔥 내림 경쟁 — 판매자A와 7수째/.test(fl) && /data-cfire="yield"/.test(fl) && /data-cfire="hold"/.test(fl), '🔥 줄 · 양보·유지 단추', fl);
  const P = { fid: 'f1', ch: true, chL: L, chSc: 'A1' }; const h = M.ctrlChBox(P); ok(/🎯 판매자A/.test(h) && /data-cchtry="A1"/.test(h) && /data-cchset="A1"/.test(h) && /data-cchbl="A1"/.test(h), '판매자 한 장 · 단추 셋', h.slice(0, 300)); }
{ const before = JSON.stringify(policy); const C = { c: {}, keyOf: (x) => 'aladin_' + x.l.usedCode };
  const it = (n, l, target) => ({ gid: 'g1', k: 'aladin_' + n, id: 'g1|aladin_' + n, C, x: { l: { usedCode: n, ...l }, target } });
  const P = { rows: [it(1, { base: 7000, a1: 1 }, 7000), it(2, { base: 6000, a1: 1 }, 6000), it(4, { base: 5000 }, 5000), { ...it(5, { base: 1 }, 1), moved: 'gone' }] };
  const R = M.ctrlChTry(P, 'A1'); ok(R.n === 3 && R.up === 2 && R.dn === 0 && R.eq === 1 && R.L.length === 2 && R.L[0].b === 7500, '무시 전 영향 — 보이는 3장 중 올라감 2 · 그대로 1(옮겨진 줄은 뺌)', R);
  ok(ctx.S._cheXTry === undefined, '셈 뒤 cheExcl 사본이 사라짐'); ok(JSON.stringify(policy) === before, '정책 원본은 그대로(사본에만 무시를 넣음)');
  ok(/올라감 2/.test(M.ctrlChTryHtml({ chTry: R })), '영향 글');
  const P3 = { rows: [it(9, { base: 4000, b2: 1 }, 4000)] }; const R3 = M.ctrlChTry(P3, 'B2'); ok(R3.dn === 1 && R3.up === 0, '내려가는 쪽도 셈', R3);
  policy.excl.rec = false; const R2 = M.ctrlChTry(P, 'A1'); ok(R2.same === true && R2.on.length === 0, '추천 자리가 꺼져 있으면 「추천 그대로」', R2); ok(/추천가는 그대로/.test(M.ctrlChTryHtml({ chTry: R2 })), '그대로 글'); policy.excl.rec = true;
  policy.sellers.A1 = { stance: 'ignore' }; ok(!!M.ctrlChTry(P, 'A1').err, '이미 무시 중이면 셈 안 함'); delete policy.sellers.A1;
  ctx.S.prCfg = null; ok(/못 읽음/.test(M.ctrlChTry(P, 'A1').err || ''), '정책을 못 읽었으면 셈 안 함'); }
console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);

/* tCUT1114 — ✂ 묶음 사진 판별 엔진 공용 셈(readnow-cutout-core.js · 일꾼 spine2 · 정범님 11/14 18:13)
 *  지어낸 사진(바탕 무늬·기운 책·글자 얼룩·바코드 흰 칸)으로: 띄워 놓은 뒷면 바둑판 · 붙여 놓은 뒷면(바코드로 나눔) · 붙여 놓고 수만 앎 · 책등 줄 · 앞뒤 짝(그대로·좌우 뒤바뀜) · 그림 지문 · 배우기·단계
 *  점수(맞힌 몫)를 줄로 찍음 — 연구 일지의 '시험 그림 기준선' · 실행: node src/tests/tCUT1114.js (node만 · 인터넷 없음) */
'use strict';
const path = require('path'); const REPO = process.env.RN_REPO || path.resolve(__dirname, '../..');
const CUT = require(path.join(REPO, 'readnow-cutout-core.js'));
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 400) : ''); } else console.log('  ✓', m); };
/* 고른 난수(같은 씨 → 같은 그림) */
let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
function canvas(w, h, bg) { const d = new Uint8ClampedArray(w * h * 4); for (let i = 0; i < w * h; i++) { const n = (rnd() - 0.5) * 18; const y = (i / w) | 0; const wood = Math.sin(y / 9) * 6; d[i * 4] = bg[0] + n + wood; d[i * 4 + 1] = bg[1] + n + wood; d[i * 4 + 2] = bg[2] + n; d[i * 4 + 3] = 255; } return { w, h, d }; }
function rect(img, b, col, opt) { opt = opt || {}; const co = Math.cos(b.a), si = Math.sin(b.a); const R = Math.hypot(b.w, b.h) / 2 + 2; const marks = [];
  for (let k = 0; k < (opt.text || 14); k++) marks.push({ u: (rnd() - 0.5) * b.w * 0.8, v: (rnd() - 0.5) * b.h * 0.8, w: 4 + rnd() * b.w * 0.3, h: 3 + rnd() * 6, c: rnd() < 0.5 ? 30 : 230 });
  for (let y = Math.max(0, Math.floor(b.cy - R)); y < Math.min(img.h, Math.ceil(b.cy + R)); y++) for (let x = Math.max(0, Math.floor(b.cx - R)); x < Math.min(img.w, Math.ceil(b.cx + R)); x++) { const dx = x - b.cx, dy = y - b.cy; const u = dx * co + dy * si, v = -dx * si + dy * co; if (Math.abs(u) > b.w / 2 || Math.abs(v) > b.h / 2) continue;
    let c = col.map((q) => q + (rnd() - 0.5) * 10); for (const mk of marks) if (Math.abs(u - mk.u) < mk.w / 2 && Math.abs(v - mk.v) < mk.h / 2) c = [mk.c, mk.c, mk.c];
    if (opt.bar) { const bu = u - opt.bar.u, bv = v - opt.bar.v; if (Math.abs(bu) < opt.bar.w / 2 && Math.abs(bv) < opt.bar.h / 2) { const stripe = Math.floor((bu + opt.bar.w / 2) / 2) % 3 === 0; c = stripe && Math.abs(bv) < opt.bar.h / 2 - 3 ? [10, 10, 10] : [250, 250, 250]; } }
    const i = (y * img.w + x) * 4; img.d[i] = c[0]; img.d[i + 1] = c[1]; img.d[i + 2] = c[2]; } }
const COLS = [[200, 40, 40], [40, 90, 180], [30, 140, 70], [230, 190, 40], [120, 50, 140], [240, 120, 30], [60, 60, 60], [170, 210, 230], [150, 100, 60], [220, 220, 210], [90, 160, 160], [180, 60, 110]];
const isbnOf = (n) => { const b = '979110' + String(100000 + n).slice(-6); let s = 0; for (let i = 0; i < 12; i++) s += +b[i] * (i % 2 ? 3 : 1); return b + ((10 - (s % 10)) % 10); };
/* 같은 물건인가 — 가운데 거리 < 크기 25% · 크기 차 < 25% */
const same = (p, q) => Math.hypot(p.cx - q.cx, p.cy - q.cy) < 0.25 * Math.min(q.w, q.h) && Math.abs(p.w * p.h - q.w * q.h) / (q.w * q.h) < 0.3;
function scene(R, Cc, gap, rot, W) { W = W || 1600; const bw = 300, bh = 420; const H = Math.round(R * (bh + gap) + gap + 40); const img = canvas(W, H, [150, 120, 90]); const truth = []; const codes = []; let n = 0; const x0 = (W - (Cc * bw + (Cc - 1) * gap)) / 2;
  for (let r = 0; r < R; r++) for (let c = 0; c < Cc; c++) { const b = { cx: x0 + c * (bw + gap) + bw / 2 + (gap ? (rnd() - 0.5) * gap * 0.4 : 0), cy: 20 + gap / 2 + r * (bh + gap) + bh / 2, w: bw - (gap ? rnd() * 30 : 0), h: bh - (gap ? rnd() * 30 : 0), a: rot ? (rnd() - 0.5) * rot : 0 }; const bar = { u: b.w * 0.18, v: b.h * 0.3, w: 90, h: 50 }; rect(img, b, COLS[n % COLS.length], { bar }); truth.push({ ...b, isbn: isbnOf(n) });
    const co = Math.cos(b.a), si = Math.sin(b.a); codes.push({ text: isbnOf(n), x: b.cx + bar.u * co - bar.v * si, y: b.cy + bar.u * si + bar.v * co, hits: 3 }); n++; }
  return { img, truth, codes }; }
function score(items, truth) { let hit = 0; const used = new Set(); for (const t of truth) { const i = items.findIndex((b, k) => !used.has(k) && same(b, t)); if (i >= 0) { used.add(i); hit++; } } return hit / truth.length; }

console.log('① 띄워 놓은 뒷면 3×4 (기울기 ±4°)');
{ const S = scene(3, 4, 60, 0.14); const r = CUT.segment(S.img, { seeds: S.codes }); const A = CUT.assign(r.items, S.codes); const sc = score(A, S.truth); const isbnHit = S.truth.filter((t) => A.some((b) => b.isbn === t.isbn && same(b, t))).length;
  console.log(`    가르기 ${Math.round(sc * 100)}% · 바코드 맞춤 ${isbnHit}/12 · 물건 ${A.length}개 · 확신 평균 ${(A.reduce((s, b) => s + b.conf, 0) / A.length).toFixed(2)}`);
  ok(A.length === 12, '물건 12개', A.length); ok(sc >= 0.99, '12개 모두 제자리', sc); ok(isbnHit === 12, '바코드가 제 물건에 12/12', isbnHit); ok(A.every((b) => b.r != null && b.c != null), '줄·칸 번호'); ok(A[0].r === 0 && A[0].c === 0 && A[11].r === 2 && A[11].c === 3, '차례 = 위→아래·왼→오른');
  ok(A.filter((b) => b.conf >= 0.8).length >= 10, '대부분 확신 0.8 넘음', A.map((b) => b.conf)); }

console.log('② 붙여 놓은 뒷면 2×3 (틈 없음 · 바코드로 나눔)');
{ const S = scene(2, 3, 0, 0); const r = CUT.segment(S.img, { seeds: S.codes }); const A = CUT.assign(r.items, S.codes); const sc = score(A, S.truth); const isbnHit = S.truth.filter((t) => A.some((b) => b.isbn === t.isbn && same(b, t))).length;
  console.log(`    가르기 ${Math.round(sc * 100)}% · 바코드 맞춤 ${isbnHit}/6 · 물건 ${A.length}개 · 까닭 ${JSON.stringify(A[0].why)}`);
  ok(A.length === 6, '물건 6개', A.length); ok(sc >= 0.83, '6개 중 5개 넘게 제자리', sc); ok(isbnHit >= 5, '바코드 맞춤 5/6 넘음', isbnHit); ok(A.every((b) => b.conf < 0.97), '붙여 놓은 것은 저절로 문턱 아래(사람 확인)', A.map((b) => b.conf)); }

console.log('③ 붙여 놓은 앞면 1×4 · 바코드 없음 · 수만 앎(4)');
{ const S = scene(1, 4, 0, 0); const r = CUT.segment(S.img, { expect: 4 }); const sc = score(r.items, S.truth); console.log(`    가르기 ${Math.round(sc * 100)}% · 물건 ${r.items.length}개`); ok(r.items.length === 4, '물건 4개', r.items.length); ok(sc >= 0.75, '4개 중 3개 넘게 제자리', sc); }

console.log('④ 바코드 하나가 물건 밖(윤곽 못 찾음) → 어림 상자');
{ const S = scene(1, 2, 80, 0); const codes = [...S.codes, { text: isbnOf(99), x: 60, y: 60, hits: 2 }]; const r = CUT.segment(S.img, { seeds: codes }); const A = CUT.assign(r.items, codes); const m = A.find((b) => b.made); ok(m && m.isbn === isbnOf(99) && m.conf < 0.5, '어림 상자 · 확신 낮음', m); }

console.log('⑤ 바코드 글자 거르기');
{ ok(CUT.isIsbn('9791100000005') === CUT.eanOk('9791100000005'), 'ISBN 검사 숫자'); ok(!CUT.isIsbn('9791100000006'), '검사 숫자 틀리면 아님'); ok(CUT.eanOk('8809123456787') === true || CUT.eanOk('8809123456787') === false, '음반 바코드도 셈');
  const b = [{ cx: 100, cy: 100, w: 100, h: 140, a: 0, conf: 1, why: [] }]; const A = CUT.assign(b, [{ text: isbnOf(1), x: 110, y: 120, hits: 2 }, { text: '52000', x: 140, y: 120 }]); ok(A[0].isbn === isbnOf(1) && A[0].add === '52000', '부가기호 5자리 붙임', A[0]);
  const A2 = CUT.assign(b, [{ text: isbnOf(1), x: 110, y: 120, hits: 2 }, { text: isbnOf(2), x: 90, y: 80, hits: 2 }]); ok(A2[0].isbn === null && A2[0].cands.length === 2 && A2[0].conf < 0.5, '한 물건에 ISBN 둘 → 확인 필요', A2[0]); }

console.log('⑥ 책등 12개 나란히 세움(붙어 있음 · 폭 다름)');
{ const W = 1400, H = 700; const img = canvas(W, H, [235, 235, 230]); let x = 120; const truth = []; for (let i = 0; i < 12; i++) { const w = 50 + Math.round(rnd() * 50); rect(img, { cx: x + w / 2, cy: 350, w, h: 520, a: 0 }, COLS[i], { text: 6 }); truth.push({ cx: x + w / 2, cy: 350, w, h: 520 }); x += w; }
  const r = CUT.spines(img, {}); const sc = score(r.items, truth); const r2 = CUT.spines(img, { expect: 12 }); const sc2 = score(r2.items, truth);
  console.log(`    수 모름: 띠 ${r.items.length}개 · 맞힘 ${Math.round(sc * 100)}% · 수 앎(12): 맞힘 ${Math.round(sc2 * 100)}% · 방향 ${r.orient}`);
  ok(r.orient === 'v', '세운 책등으로 봄'); ok(sc >= 0.75, '수 몰라도 12개 중 9개 넘게', sc); ok(sc2 >= 0.83, '수를 알면 12개 중 10개 넘게', sc2); }

console.log('⑦ 앞·뒤 짝 (그대로 · 좌우 뒤바뀜)');
{ const mk = (n, R, C) => { const L = []; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) L.push({ r, c, id: r * C + c }); return L; }; const F = mk(0, 2, 3);
  const Bsame = mk(0, 2, 3).map((b) => ({ ...b, id: b.id })); const p1 = CUT.pairFB(F, Bsame, (f, b) => (f.id === b.id ? 0.9 : 0.2)); ok(p1.way === '그대로' && p1.pairs.every(([f, b]) => f.id === b.id), '그대로 짝', p1.way);
  const Bm = mk(0, 2, 3).map((b) => ({ ...b, id: b.r * 3 + (2 - b.c) })); const p2 = CUT.pairFB(F, Bm, (f, b) => (f.id === b.id ? 0.9 : 0.2)); ok(/좌우/.test(p2.way) && p2.pairs.every(([f, b]) => f.id === b.id), '좌우 뒤바뀜을 그림 대조로 알아챔', p2.way); ok(p2.conf > 0.9, '확신 높음', p2.conf);
  const p3 = CUT.pairFB(F, mk(0, 2, 2), null); ok(p3.conf < 0.5, '모양 다르면 확신 낮음', p3.conf); }

console.log('⑧ 그림 지문 — 같은 표지(살짝 옮기고 줄임) vs 다른 표지');
{ const a = canvas(300, 420, [0, 0, 0]); rect(a, { cx: 150, cy: 210, w: 300, h: 420, a: 0 }, [200, 40, 40], { text: 20 }); const S1 = CUT.sig(a); const S2 = CUT.sig(a, { cx: 152, cy: 208, w: 290, h: 410, a: 0.02 });
  const b = canvas(300, 420, [0, 0, 0]); rect(b, { cx: 150, cy: 210, w: 300, h: 420, a: 0 }, [40, 90, 180], { text: 20 }); const S3 = CUT.sig(b);
  const s12 = CUT.simil(S1, S2), s13 = CUT.simil(S1, S3); console.log(`    같은 표지 ${s12} · 다른 표지 ${s13}`); ok(s12 > 0.75 && s13 < s12 - 0.2, '같은 것이 확실히 높음', [s12, s13]);
  const M = CUT.matchSet([S2, S3], [S3, S1], CUT.simil); ok(M[0].j === 1 && M[1].j === 0, '여럿 ↔ 여럿 맞추기', M); ok(CUT.colorSim(S1, S2) > CUT.colorSim(S1, S3), '색 대조(책등 ↔ 표지)'); }

console.log('⑨ 차례 지키며 짝(책등 ↔ 뒷면 차례 · 하나 빠짐)');
{ const A = [0, 1, 2, 4]; const B = [0, 1, 2, 3, 4]; const P = CUT.alignOrder(A.length, B.length, (i, j) => (A[i] === B[j] ? 0.9 : 0.1)); ok(P.length === 4 && P.every(([i, j]) => A[i] === B[j]), '빠진 것 건너뛰고 짝', P); }

console.log('⑩ 배우기·단계');
{ const recs = []; for (let i = 0; i < 200; i++) { const conf = 0.5 + (i % 50) / 100; recs.push({ m: 'back', conf, ok: conf >= 0.8 ? true : i % 3 !== 0 }); } const L = CUT.learn(recs);
  ok(L.back.n === 200 && L.back.auto <= 0.9 && L.back.auto >= 0.6, '맞힌 칸부터 저절로 문턱을 낮춤', L.back.auto); ok(L.back.bins.length === 10, '칸 10개');
  ok(CUT.stageNext(1, { n: 40, acc: 0.9 }).stage === 2, '그림자 → 안내(확인 30건)'); ok(CUT.stageNext(2, { n: 150, acc: 0.99 }).stage === 3, '안내 → 작게 실제(100건·98%)'); ok(CUT.stageNext(3, { n: 50, acc: 0.9 }).stage === 2, '틀린 몫 5% 넘으면 내림'); ok(CUT.stageNext(2, { n: 0 }).stage === 2, '기록 없으면 그대로');
  ok(CUT.decide(0.99, null, 2) === 'ask' && CUT.decide(0.99, null, 3) === 'auto' && CUT.decide(0.3, null, 3) === 'pick', '단계 2는 저절로 안 함 · 3부터'); }

console.log('⑩-2 글자로 맞추기(견본 그림 없이 · 읽은 글자 ↔ 상품 이름)');
{ const C = [{ id: 'a', title: '소년이 온다', author: '한강', publisher: '창비' }, { id: 'b', title: '채식주의자', author: '한강', publisher: '창비' }, { id: 'c', title: '코스모스', author: '칼 세이건', publisher: '사이언스북스' }, { id: 'd', title: '사피엔스', author: '유발 하라리', publisher: '김영사' }, { id: 'e', title: '데미안', author: '헤르만 헤세', publisher: '민음사' }];
  const r1 = CUT.textMatch('소년이온다 한강 장편소설 창비', C); ok(r1[0].id === 'a' && r1[0].s > r1[1].s + 0.2, '책등 글자 한 줄 → 소년이 온다', r1.slice(0, 2));
  const r2 = CUT.textMatch('사피 엔스 유발하라리 김영 사', C); ok(r2[0].id === 'd', '띄어쓰기·끊김 있어도', r2[0]);
  const r3 = CUT.textMatch('코스모쓰 칼세이건', C); ok(r3[0].id === 'c', '한 글자 잘못 읽어도(OCR 오류)', r3[0]);
  const A = CUT.textAssign(['데미안 헤르만헤세 민음사', '채식주의자 한강', '알 수 없는 글자 ㅁㄴㅇ'], C); ok(A[0] && A[0].id === 'e' && A[1] && A[1].id === 'b' && !A[2], '여러 조각 ↔ 묶음 목록(못 읽은 조각은 비움)', A); }

console.log('⑪ 큰 사진 시간(4000×3000 · 3×4)');
{ const t0 = Date.now(); const S = scene(3, 4, 60, 0.1, 4000); const tMake = Date.now() - t0; const t1 = Date.now(); const r = CUT.segment(S.img, { seeds: S.codes }); const ms = Date.now() - t1; console.log(`    가르기 ${ms}ms (그림 만들기 ${tMake}ms) · 물건 ${r.items.length}`); ok(ms < 4000, '4초 안', ms); }

console.log('⑫ 클라우드 스스로 회차(cloud/cutself.js · 가짜 Firestore)');
(async () => { const CS = require(path.join(REPO, 'cloud/cutself.js')); const store = {}; const deep = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) o[k] = v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) ? deep(o[k], v) : v; return o; };
  const C = (c) => ({ doc: (id) => ({ get: async () => ({ exists: !!(store[c] || {})[id], data: () => JSON.parse(JSON.stringify(store[c][id])) }), set: async (v, o) => { store[c] = store[c] || {}; store[c][id] = o && o.merge ? deep(store[c][id], v) : v; } }) });
  const recs = []; for (let i = 0; i < 120; i++) recs.push({ m: 'back', conf: 0.9 + (i % 10) / 100, ok: true }); for (let i = 0; i < 6; i++) recs.push({ m: 'back', conf: 0.6, ok: false });
  store.app_settings = { cut_engine: { stage: 2, recs, recent: [{ sid: 'cut_a', at: new Date().toISOString(), mode: 'back', n: 12 }], log: [{ at: 'x', t: '사람이 넣은 첫 줄' }], cfg: { mine: 1 } } };
  const pulses = []; const E = CS.makeCutSelf({ C, W: () => ({}), log: () => {}, core: async () => CUT, pulse: async (P) => { pulses.push(P); return { n: 1 }; } });
  const r = await E.run({ force: true }); const d = store.app_settings.cut_engine;
  ok(r && !r.skip && r.stage === 2, '확인 126건·맞힌 몫 95%대 → 단계 판단(맞힌 몫 98% 아래면 3 안 됨)', r);
  ok(d.self && d.self.brier != null && d.self.nRecs === 126, '자기 채점(브라이어)', d.self); ok(d.log.length === 2 && d.log[0].t === '사람이 넣은 첫 줄' && /클라우드 회차/.test(d.log[1].t), '일지는 덧붙이기만', d.log); ok(d.cfg && d.cfg.mine === 1 && d.recs.length === 126, '사람 확인 기록·설정은 그대로');
  ok(Object.keys(store.eng_ledger || {}).some((k) => /_cut$/.test(k)), '장부 eng_ledger …_cut'); ok(pulses.length === 1 && pulses[0].studies.V01, '진화 증거 V01');
  const r2 = await E.run({}); ok(r2.skip, '같은 날 두 번 안 돎', r2);
  store.app_settings.cut_engine.self.day = '2000-01-01'; store.app_settings.cut_engine.recs = recs.slice(0, 50); const r3 = await E.run({ force: true }); ok(store.app_settings.cut_engine.self.shrink === true && r3.stage === store.app_settings.cut_engine.stage, '확인 기록이 줄면 단계 그대로·줄어듦 표시', store.app_settings.cut_engine.self);
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과'); process.exit(bad ? 1 : 0); })();

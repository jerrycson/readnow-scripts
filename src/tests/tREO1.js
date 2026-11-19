// tREO1 — (reo1 · 정범님 I-1120-0051-01 · I-1120-0108-02 ①) 수동 일괄 — 확정은 선택 대기로 튕기지 않음 · 🔎 참고 탭(시장이 바뀐 상품을 경우마다 모아 봄 · 실물은 그대로)
//  ① 확정 뒤 자동 재편성은 표시만(설정 move여도) · 예전 판이 옮긴 확정 7일 안만 되돌림 · 관제소 「모두 확정」에서 빠진 상품은 까닭을 남김 · 감시 강제로 안 붙음
//  ② 참고 탭 7가지 — 경우마다 하나씩 · 기준 없으면 「모름」 · 참고 탭이 실물 탭(bqCls) 수를 바꾸지 않음
// 실행: node tREO1.js · 시험 자료에 손님 정보 없음 · 실제 가격 바꾸기·확정 실행 없음(저장은 흉내)
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const line = (re) => { const m = T.match(re); return m ? m[0] : ''; };
const fn = (n) => { const i = T.indexOf(`function ${n}(`); if (i < 0) return ''; const s = T.lastIndexOf('\n', i) + 1; const ends = ['\nfunction ', '\nasync function ', '\nconst ', '\n/*'].map((q) => T.indexOf(q, i + 10)).filter((j) => j > 0); return T.slice(s, Math.min(...ends)); };
const b0 = T.indexOf('/* ◆bqref '), b1 = T.indexOf('/* ◆bqref 끝 */'); const REF = b0 > 0 && b1 > b0 ? T.slice(b0, b1) : '';

console.log('① 확정은 선택 대기로 튕기지 않음 (I-1120-0051-01)');
ok(/const BKF_DONE_MV = 'mark';/.test(T), '관제소 확정 뒤 재편성 = 표시만(BKF_DONE_MV mark)');
{ const s = fn('ctrlReoDone'); ok(!!s && /const stay = auto && r\.pct <= gp \? 'auto' : 'mark';/.test(s) && !/reoDone === 'move'/.test(s), 'ctrlReoDone은 reo에 늘 stay(mark·auto)를 씀(move 설정이어도 표시만)'); }
ok(!/data-ccfg="reoDone:move"/.test(T) && /🔁 표시만 — 확정 탭에 그대로/.test(T), '설정 화면에 「옮김」 고름 없음 — 표시만');
ok(/🛰 감시는 켜지 않음/.test(T), '「모두 확정」 확인 글에 「감시는 켜지 않음」');
{ const s = fn('bqOnceStart'); ok(!!s && !/watch\s*:|'watch\.|watch\.on\s*=/.test(s), '한 번 반영(bqOnceStart)은 감시 설정을 건드리지 않음'); }
ok(/data-brep=/.test(T) && /data-breo=/.test(T) && /a === 'redec'/.test(T), '「다시 결정 대기로」·「그대로 둠」은 사람이 누를 때만(그룹 화면·관제창)');
ok(/⚠ 반영 안 됨 — /.test(T) && /다시 확정/.test(T), '막힘·기한 지남 확정은 「⚠ 반영 안 됨 — 까닭」과 「다시 확정」');
{ const s = fn('bkfExecOne'); ok(!!s && /dropK/.test(s) && /고른 값/.test(s) && /지금 추천/.test(s), '관제소 확정에서 빠진 상품 까닭 — 「고른 값 A → 지금 추천 B」'); }
ok(/reofix/.test(line(/const BQ_LOGW[^\n]*/)) && /reopick/.test(line(/const BQ_LOGW[^\n]*/)), '목록 기록 글자에 reofix·reopick');

const ctx = { console, Map, Set, Date, Math, JSON, Object, String, Number, Array, isFinite, Promise, Error,
  firebase: { firestore: { FieldValue: { arrayUnion: (...a) => ({ __au: a }) } } },
  num: (n) => String(n), esc: (s) => String(s), won: (n) => n + '원', kMs: (v) => Date.parse(v) || 0,
  bqFewOf: () => '', bqSameP: (a, b) => Math.round(+a) === Math.round(+b), W: [], batchSave: async (g, p) => { ctx.W.push(['save', g, p]); }, bkfGlSet: (g, p) => ctx.W.push(['gl', g, p]),
  page1FromMetrics: () => null, S: { pmetrics: new Map(), user: { email: 't@x' } } };
vm.createContext(ctx);
const SRC = [line(/const bqReoMv = [^\n]*/), line(/\nfunction bqCls\([^\n]*/), line(/const avCode = [^\n]*/), line(/const AV_NM = [^\n]*/), line(/const OBS_VALID = [^\n]*/), line(/const ctrlRecOf = [^\n]*/), fn('reoFixPlan'), fn('bkfDropSave'), REF].join('\n');
vm.runInContext(SRC + '\n;this.__R = { bqCls, bqReoMv, reoFixPlan, bkfDropSave, bqMk, bqBaseOf, bqRefOf, bqRefSum, bqRefCnt, bqAvN, BQ_REFDEF };', ctx);
const R = ctx.__R; const now = Date.now(); const iso = (ms) => new Date(ms).toISOString();
const K = (i) => 'aladin_U9' + String(i).padStart(6, '0'); const X = (i, target, o) => ({ l: { usedCode: K(i).slice(7), title: '시험 책 ' + i, price: 9000, bookId: 'B' + i, grade: '상', ...((o && o.l) || {}) }, target, ...(o || {}), ...(o && o.l ? { l: { usedCode: K(i).slice(7), title: '시험 책 ' + i, price: 9000, bookId: 'B' + i, grade: '상', ...o.l } } : {}) });
const pg = (...ps) => ps.map((p) => ({ c: 'green', p, g: '상' }));

{ const st = { picks: {}, decided: { [K(1)]: { price: 8000, at: iso(now - 3600e3), reo: { at: iso(now), was: 'done', p: 8000, t: 7000, stay: 'mark' } } }, held: {}, trashed: {} };
  ok(R.bqCls(X(1, 7000), { st, SRV: new Map(), sold: new Set() }) === 'done', '표시만(stay mark) 확정은 확정 탭 그대로'); }
{ const g = { id: 'g', decided: { [K(1)]: { price: 8000, at: iso(now - 2 * 864e5), reo: { at: iso(now), p: 8000, t: 7000 } }, [K(2)]: { price: 8000, at: iso(now - 9 * 864e5), reo: { at: iso(now), p: 8000, t: 7000 } }, [K(3)]: { price: 8000, at: iso(now - 864e5), reo: { stay: 'mark' } }, [K(4)]: { price: 8000, at: iso(now - 864e5) } } };
  const P = R.reoFixPlan(g, now); ok(P.n === 1 && P.fix[K(1)] && P.fix[K(1)].reo.stay === 'mark' && P.fix[K(1)].reo.fixAt && P.fix[K(1)].price === 8000, '예전 판이 옮긴 확정 — 7일 안만 표시만으로 되돌림(값·시각 그대로 · 지우지 않음)', P);
  ok(!R.reoFixPlan({ ...g, viewOnly: true }, now).n && !R.reoFixPlan({ ...g, archived: true }, now).n, '보기 전용·보관 그룹은 안 건드림'); }
(async () => {
  { ctx.W.length = 0; const st = { picks: { [K(1)]: { price: 8000, at: iso(now) }, [K(2)]: { price: 9000, at: iso(now) } } };
    const n = await R.bkfDropSave('g', st, [[K(1), '고른 값 8000원 → 지금 추천 7000원'], [K(9), '없음']]); const sv = ctx.W.find((w) => w[0] === 'save');
    ok(n === 1 && st.picks[K(1)].dropWhy.includes('지금 추천') && st.picks[K(1)].dropAt && !st.picks[K(2)].dropWhy && sv && Object.keys(sv[2].picks).length === 1, '빠진 상품 까닭(dropWhy·dropAt) 남김 · 결정 대기 그대로', st.picks); }

  console.log('② 🔎 참고 탭 (I-1120-0108-02 ①)');
  ok(!!REF && R.BQ_REFDEF.map((d) => d[0]).join() === 'up,dn,cheap,alone,stat,blk,old', '참고 탭 7가지(오름·내림·더 싼 매물·경쟁 사라짐·상태·막힘·오래됨)');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(REF), '참고 탭 덩이에 브라우저 창 없음');
  ok(!/st\.(picks|decided)\[[^\]]+\]\s*=|delete st\.|\.push\(/.test(REF.replace(/ix\[c\]\.push\(i\)/g, '')), '참고 탭 셈은 그룹 문서를 고치지 않음(셈만)');
  ok(/\$\{refBarHtml\(\)\}\$\{refPanelHtml\(\)\}/.test(T) && (T.match(/\$\{bqTagHtml\(x, k\)\}\$\{bqRefChipH\(k\)\}/g) || []).length === 2, '그룹 화면에 참고 탭 줄·판 · 카드 두 꼴에 표시 칩');
  ok(/data-brgo=/.test(T) && /원래 탭에서 보기/.test(T) && /data-brrp=/.test(T) && /<details[^>]*><summary[^>]*>더 보기 \(0건/.test(T), '참고 탭 판 — 「원래 탭에서 보기」·「다시 결정 대기로」(사람만) · 0건은 더 보기 뒤로');
  ok((T.match(/bqBaseOf\(/g) || []).length >= 10, '결정 대기·확정에 넣는 곳마다 기준(base) 남김');
  ctx.S.pmetrics = new Map([['B1', { availability: 'onSale', lastCheckedAt: iso(now - 3600e3) }]]);
  const base = R.bqBaseOf(X(1, 7000, { page1: pg(7500, 8200) }), 7000); ok(base.rec === 7000 && base.base.lo === 7500 && base.base.nc === 2 && base.base.av === 'onSale' && base.base.at, '기준 = 추천·최저가·경쟁 수·새책 상태', base);
  const B0 = { lo: 7500, nc: 2, av: 'onSale', at: iso(now - 864e5) };
  const RO = (x, t, e, sv) => { const k = 'aladin_' + x.l.usedCode; const st = { picks: {}, decided: {} }; (t === 'pick' ? st.picks : st.decided)[k] = { price: 8000, at: iso(now - 864e5), ...e }; return R.bqRefOf(x, t, k, st, sv || null, R.bqMk(x), now); };
  ctx.S.pmetrics = new Map(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'].map((b) => [b, { availability: 'onSale', lastCheckedAt: iso(now - 3600e3) }]));
  { const r = RO(X(1, 9000, { page1: pg(7500, 8200) }), 'pick', { rec: 8000, base: B0 }); ok(r.on.up && !r.on.dn && /8000원 → 9000원/.test(r.on.up), '📈 추천 오름', r); }
  { const r = RO(X(2, 7000, { page1: pg(7500, 8200) }), 'done', { rec: 8000, base: B0 }); ok(r.on.dn && !r.on.up, '📉 추천 내림', r); }
  { const r = RO(X(3, 8000, { page1: pg(6900, 8200) }), 'pick', { rec: 8000, base: B0 }); ok(r.on.cheap && /7500원 → 6900원/.test(r.on.cheap) && !r.on.up && !r.on.dn, '🏷 더 싼 매물 새로 생김', r); }
  { const r = RO(X(3, 8000, { page1: pg(6900) }), 'pick', { rec: 8000, base: { ...B0, lo: null, nc: 0 } }); ok(r.on.cheap && /없던 데/.test(r.on.cheap), '🏷 경쟁 매물이 없던 데 우리보다 싼 매물이 생김', r); }
  { const r = RO(X(4, 8000, { page1: [] , l: {} }), 'pick', { rec: 8000, base: B0 }); ok(r.unk.has('alone'), '시장 자료가 비면 경쟁 매물 경우는 「모름」(0개로 세지 않음)', r); }
  { const r = RO(X(4, 8000, { page1: [{ c: 'ours', p: 8000, g: '상' }, { c: 'green', p: 8000, so: 1, g: '상' }] }), 'pick', { rec: 8000, base: B0 }); ok(r.on.alone && /혼자 남음/.test(r.on.alone), '🥇 경쟁 매물 사라짐 — 혼자 남음', r); }
  { const r = RO(X(4, 8000, { page1: pg(8500) }), 'done', { rec: 8000, base: { ...B0, lo: 7900 } }); ok(r.on.alone && /우리 8000원 이하/.test(r.on.alone), '🥇 경쟁 매물 사라짐 — 우리가 최저가가 됨', r); }
  { ctx.S.pmetrics.set('B5', { availability: '품절', lastCheckedAt: iso(now - 3600e3) }); const r = RO(X(5, 8000, { page1: pg(7500, 8200) }), 'pick', { rec: 8000, base: B0 }); ok(r.on.stat === '판매중 → 품절', '⛔ 상품 상태 바뀜 — 판매중 → 품절', r);
    ctx.S.pmetrics.set('B5', { availability: 'onSale', lastCheckedAt: iso(now - 3600e3) }); const r2 = RO(X(5, 8000, { page1: pg(7500, 8200) }), 'pick', { rec: 8000, base: { ...B0, av: '절판' } }); ok(r2.on.stat === '절판 → 판매중', '⛔ 상품 상태 바뀜 — 판매 중으로 돌아옴', r2); }
  ok(R.bqAvN('onSale') === R.bqAvN('판매중') && R.bqAvN('품절') === 'P' && R.bqAvN(null) === null, '상태 이름 맞춤(onSale = 판매중)');
  { const e = { rec: 8000, base: B0 }; const at = iso(now - 864e5); const r = RO(X(6, 8000, { page1: pg(7500, 8200) }), 'done', e, { approvalState: 'blocked', approval: { at }, execNote: '알라딘이 돌려준 값이 다름' }); ok(r.on.blk && /막힘 — 알라딘/.test(r.on.blk), '⏳ 반영 막힘·기한 지남 — 확정 탭', r);
    const r2 = RO(X(6, 8000, { page1: pg(7500, 8200) }), 'pick', e, { approvalState: 'blocked', approval: { at } }); ok(!r2.on.blk, '결정 대기 상품은 반영 막힘 칸에 안 듦');
    const r3 = RO(X(6, 8000, { page1: pg(7500, 8200) }), 'done', e, { approvalState: 'stale', approval: { at: iso(now - 9 * 864e5) } }); ok(!r3.on.blk, '앞선 확정의 막힘은 이 확정에 안 붙음'); }
  { ctx.S.pmetrics.set('B7', { availability: 'onSale', lastCheckedAt: iso(now - 50 * 3600e3) }); const r = RO(X(7, 8000, { page1: pg(7500, 8200) }), 'pick', { rec: 8000, base: B0 }); ok(r.on.old && /50시간 전/.test(r.on.old), '🕰 판정 근거 오래됨(48시간)', r);
    ctx.S.pmetrics.delete('B7'); const r2 = RO(X(7, 8000, { page1: pg(7500, 8200) }), 'pick', { rec: 8000, base: B0 }); ok(r2.unk.has('old') && r2.unk.has('stat') && !r2.on.old, '시장 지표가 없으면 오래됨·상태는 「모름」', r2); }
  { const r = RO(X(1, 9000, { page1: pg(6000) }), 'pick', {}); ok(!Object.keys(r.on).length && ['up', 'dn', 'cheap', 'alone', 'stat'].every((c) => r.unk.has(c)), '기준을 남기지 않은 옛 상품은 「모름」(아무 칸에도 안 듦)', r); }
  { const r = RO(X(1, 9000, { page1: pg(6000) }), 'sel', { rec: 8000, base: B0 }); ok(!Object.keys(r.on).length && !r.unk.size, '선택 대기 등 다른 탭 상품은 참고 탭 셈에 안 듦'); }
  { const r = RO(X(1, 9000, { page1: pg(6900, 8200) }), 'pick', { rec: 8000, base: B0 }); ok(r.on.up && r.on.cheap, '한 상품이 여러 참고 탭에 동시에(오름 + 더 싼 매물)', r); }
  { const S1 = R.bqRefSum([[0, { on: { up: 'a', cheap: 'b' }, unk: new Set() }], [1, { on: {}, unk: new Set(['up', 'dn']) }], [2, { on: { up: 'c' }, unk: new Set() }]]);
    ok(S1.n.up === 2 && S1.n.cheap === 1 && S1.u.up === 1 && S1.ix.up.join() === '0,2' && S1.n.old === 0, '참고 탭 셈 — 수·모름·번호', S1);
    ok(R.bqRefCnt(2, 1) === '2 · 모름 1' && R.bqRefCnt(0, 3) === '모름 3' && R.bqRefCnt(0, 0) === '0', '셀 재료가 없으면 0이 아니라 「모름」'); }
  { // 참고 탭이 실물 탭(cls) 수를 바꾸지 않음
    ctx.S.pmetrics = new Map(['B1', 'B2', 'B3'].map((b) => [b, { availability: '품절', lastCheckedAt: iso(now - 90 * 3600e3) }]));
    const st = { picks: { [K(1)]: { price: 8000, at: iso(now), rec: 7000, base: B0 } }, decided: { [K(2)]: { price: 8000, at: iso(now - 3600e3), rec: 9000, base: B0 } }, held: {}, trashed: {}, fewsel: {}, edkw: {} };
    const XS = [X(1, 9000, { page1: pg(6000) }), X(2, 7000, { page1: pg(6000) }), X(3, 7000, { toSel: 1 })]; const c = { st, SRV: new Map(), sold: new Set() };
    const cnt = () => { const n = {}; XS.forEach((x) => { const t = R.bqCls(x, c); n[t] = (n[t] || 0) + 1; }); return n; }; const before = JSON.stringify(cnt()); const snap = JSON.stringify(st);
    const L = XS.map((x, i) => { const k = 'aladin_' + x.l.usedCode; return [i, R.bqRefOf(x, R.bqCls(x, c), k, st, null, R.bqMk(x), now)]; }); const SM = R.bqRefSum(L);
    ok(SM.n.up === 1 && SM.n.dn === 1 && SM.n.stat === 2 && SM.n.old === 2, '참고 탭은 결정 대기·확정 상품을 셈', SM);
    ok(JSON.stringify(cnt()) === before && JSON.stringify(st) === snap && before === JSON.stringify({ pick: 1, done: 1, sel: 1 }), '참고 탭이 실물 탭(cls) 수를 바꾸지 않음 · 그룹 문서 그대로', before); }
  console.log(bad ? `❌ tREO1 실패 ${bad}` : '✓ tREO1 통과'); process.exit(bad ? 1 : 0);
})();

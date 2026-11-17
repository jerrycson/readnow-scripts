// 📚 판본 추적 엔진 0.1.4(edq1 11/18 · watch1 0.1.3 빌린 몫 위에) 시험 — node src/tests/tEDQ1118.js
// ① 사람이 건 다시 보기 대기 칸(몫이 없어도 남김 · 하루 몫이 새로 차면 정기 회차보다 먼저 · 정기 회차는 하루 몫 − 60까지)
// ② 몫 새는 고리 막음(이어 보기는 읽은 판본을 다시 씀 · 하루 처음 + 2번까지 · 진척 없으면 보통 날로) ③ 못 읽는 화면은 하루 한 번 ④ 판본 결과 그대로
const E = require('../../cloud/edition.js'); const X = E._t;
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ✗', m); } else console.log('  ✓', m); };
const kDay = (t) => new Date((t || Date.now()) + 9 * 3600e3).toISOString().slice(0, 10);
const yest = kDay(Date.now() - 864e5);

function world(P, store) {
  store = store || new Map(); const getD = (p) => store.get(p);
  const docRef = (c, id) => ({ id, path: c + '/' + id, get: async () => ({ exists: store.has(c + '/' + id), id, data: () => store.get(c + '/' + id) }), set: async (v, o) => { store.set(c + '/' + id, o && o.merge ? { ...(store.get(c + '/' + id) || {}), ...JSON.parse(JSON.stringify(v)) } : JSON.parse(JSON.stringify(v))); } });
  const rows = (c, k, op, v) => [...store].filter(([p, d]) => p.startsWith(c + '/') && (k == null || (op === 'in' ? v.includes(d[k]) : d[k] === v))).map(([p, d]) => ({ id: p.split('/')[1], data: () => d }));
  const res = (f, n) => ({ get: async () => { const r = f().slice(0, n); return { docs: r, forEach: (fn) => r.forEach(fn) }; } });
  const coll = (c) => ({ doc: (id) => docRef(c, id), where: (k, op, v) => ({ select: () => res(() => rows(c, k, op, v), 1e9), limit: (n) => res(() => rows(c, k, op, v), n), ...res(() => rows(c, k, op, v), 1e9) }), limit: (n) => res(() => [], n), orderBy: () => ({ limit: () => res(() => [], 0) }) });
  const db = { batch: () => { const ops = []; return { set: (r, v, o) => ops.push([r, v, o]), commit: async () => { for (const [r, v, o] of ops) await r.set(v, o); } }; }, getAll: async (...refs) => Promise.all(refs.filter((r) => r && r.get).map((r) => r.get())) };
  const byIsbn = () => Object.fromEntries(Object.values(P).filter((x) => x.f.isbn).map((x) => [x.f.isbn, x]));
  const seen = []; const page = { evaluate: async (fn, o) => { if (fn === X.IN_PAGE_SEARCH) { seen.push('s'); return { L: [] }; } seen.push(o.iid || o.isbn); const x = o.iid ? P[o.iid] : byIsbn()[o.isbn]; if (!x) return { none: 1 }; return { f: x.f, anchors: x.nx.map(([iid, t]) => ({ iid, a: t, ctx: t })), segs: {} }; } };
  const mk = (more) => E.makeEdition({ db, C: coll, FV: {}, W: () => ({}), log: () => {}, getPage: async () => page, notes: async () => {}, push: async () => ({ ok: 1 }), pulse: async () => {}, ...(more || {}) });
  const target = (isbn, bid) => { store.set('prd_listings/L' + bid, { active: true, isbn13: isbn, bookId: bid, title: 't' + bid, priceList: 10000 }); store.set('prd_book_metrics/' + bid, { availability: '절판' }); };
  return { store, getD, mk, seen, target };
}
const ed = (iid, isbn, title, au, d, nx) => ({ f: { iid, isbn, title, authors: [au], translators: [], publisher: '물결', pubDate: d, pages: 300 }, nx });
const past = '2000-01-01T00:00:00Z';

(async () => {
  console.log('① 사람이 건 다시 보기 대기 칸');
  { const P = { '1001': ed('1001', '9788900000001', '바다의 책', '한바다', '2001-03-01', [['1002', '개정판 보기']]), '1002': ed('1002', '9788900000002', '바다의 책 (개정판)', '한바다', '2010-05-01', [['1001', '구판 보기'], ['1003', '이 책의 개정판이 출간되었습니다']]), '1003': ed('1003', '9788900000003', '바다의 책 (개정3판)', '한바다', '2020-09-01', [['1002', '구판 보기']]), '1009': ed('1009', '9788900000009', '산의 책', '김산', '2012-01-01', []) };
    const Wd = world(P); Wd.target('9788900000002', 'B1'); Wd.target('9788900000009', 'B9');
    Wd.store.set('app_settings/ed_cfg', { gapMin: 0, gapMax: 1, nl: false, dayCap: 30, rrRes: 10 }); Wd.store.set('app_settings/ed_study', { today: { day: kDay(), pages: 30, books: 9 } }); /* 오늘 몫 다 씀(11/18 06:42와 같은 꼴) */
    const A = Wd.mk(); const d1 = await A.diag({ edrun: 'ed_work/w9788900000002' });
    ok(d1.queued && d1.queued.added && /하루 몫/.test(d1.now || '') && !d1.ran, '몫이 없으면 버리지 않고 대기 칸에 남김 — ' + (d1.now || JSON.stringify(d1)).slice(0, 60));
    ok(d1.rerun && d1.rerun.q.length === 1 && d1.rerun.q[0].isbn === '9788900000002', 'ed_work/w<ISBN> 꼴도 ISBN으로 다듬어 넣음');
    const d2 = await A.diag({ edrun: '9788900000002' }); ok(d2.queued && d2.queued.dup && d2.rerun.q.length === 1, '같은 책은 두 번 안 넣음');
    ok((await A.diag({ edrun: '12345' })).err, 'ISBN 아니면 거절');
    const t0 = await A.tick(); ok(t0.skip === 'cap', '오늘은 정기 회차도 안 돎(cap)');
    ok(Wd.getD('app_settings/ed_study').rerun.q.length === 1 && Wd.getD('app_settings/ed_study').today.pages === 30, '대기 칸 그대로 · 오늘 셈 지우지 않음');
    /* 다음 날 — 인스턴스가 새로 뜸(오늘 셈 어제 것) → 대기 칸 먼저 */
    Wd.store.set('app_settings/ed_study', { ...Wd.getD('app_settings/ed_study'), today: { day: yest, pages: 30, books: 9 } });
    const B = Wd.mk(); const R = await B.tick();
    ok(R.books.length >= 2 && R.books[0].rr === 1 && R.books[0].isbn === '9788900000002', '하루 몫이 새로 차면 다시 보기가 정기 회차보다 먼저 — ' + R.books.map((b) => b.isbn.slice(-2) + (b.rr ? 'rr' : '')).join(','));
    ok(R.books[1].isbn === '9788900000009' && !R.books[1].rr, '그 뒤 정기 회차');
    const st = Wd.getD('app_settings/ed_study'); ok(st.rerun.q.length === 0 && st.rerun.done[0].isbn === '9788900000002' && st.rerun.done[0].res.eds === 3 && st.rerun.done[0].v === E.ED_V, '마친 다시 보기는 done으로(판본 3 · 새 판 번호)');
    const w = Wd.getD('ed_work/w9788900000002'); ok(w && w.v === E.ED_V && w.eds.map((e) => e.rel).join() === 'older,ours,newer', '④ 판본 결과 그대로(옛 판·우리·새 판) · 묶음 판 번호 새로');
    const lg = [...Wd.store.keys()].filter((k) => k.startsWith('ed_ledger/')).map((k) => Wd.getD(k)); ok(lg.some((x) => x.rr && x.rr.ran === 1 && x.did.some((b) => b.rr === 1)), '일지에 다시 보기(rr) 보임');
    const dg = await B.diag({ edition: 1 }); ok(dg.rr && dg.rr.wait === 0 && dg.rr.done.length === 1 && dg.rr.regCap === 20, '진단 edition=1에 대기 칸·정기 상한 보임'); }

  console.log('① 정기 회차는 하루 몫 − 다시 보기 몫까지');
  { const P = {}; for (let i = 0; i < 40; i++) { const iid = String(5000 + i); P[iid] = ed(iid, '97889555' + String(10000 + i).slice(-5), '혼자 책 ' + i, '나홀로' + i, '2010-01-01', []); }
    const Wd = world(P); Object.values(P).forEach((x, i) => Wd.target(x.f.isbn, 'C' + i)); Wd.store.set('app_settings/ed_cfg', { gapMin: 0, gapMax: 1, nl: false, dayCap: 30, rrRes: 10 });
    const A = Wd.mk(); const R = await A.tick(); const m = (await A.diag({ edition: 1 })).mem;
    ok(m.used <= 20 && m.used >= 18, `정기 회차가 20쪽(30 − 10)에서 멈춤 — ${m.used}쪽`);
    const t2 = await A.tick(); ok(t2.skip === 'cap' && t2.used <= 20, '대기 칸이 비었으면 다음 회차는 cap');
    const d = await A.diag({ edrun: Object.values(P)[39].f.isbn }); ok(d.ran && d.ran.books.length === 1 && d.ran.books[0].rr === 1 && !d.ran.books[0].err, '남겨 둔 몫으로 다시 보기는 바로 돎');
    const m2 = (await A.diag({ edition: 1 })).mem; ok(m2.used > 20 && m2.used <= 30, `다시 보기는 하루 몫 끝까지 씀 — ${m2.used}쪽`); }

  console.log('② 이어 보기 고리 막음');
  { const P = {}; const N = 12; for (let i = 1; i <= N; i++) { const iid = String(3000 + i); P[iid] = ed(iid, '97889300000' + String(i).padStart(2, '0'), '긴 사슬 ' + (i > 1 ? `(개정${i}판)` : ''), '사슬', `${2000 + i}-01-01`, [...(i > 1 ? [[String(2999 + i), '구판 보기']] : []), ...(i < N ? [[String(3001 + i), '개정판이 출간되었습니다']] : [])]); }
    const Wd = world(P); const ours = P['3001'].f.isbn; Wd.target(ours, 'S1'); Wd.store.set('app_settings/ed_cfg', { gapMin: 0, gapMax: 1, nl: false, maxLinkHops: 2 });
    const A = Wd.mk(); const run = async () => { const b = Wd.getD('ed_book/' + ours); if (b) Wd.store.set('ed_book/' + ours, { ...b, nextAt: past }); Wd.seen.length = 0; const R = await A.tick(); return { r: R.books[0], w: Wd.getD('ed_work/w' + ours), b: Wd.getD('ed_book/' + ours), pg: Wd.seen.filter((x) => x !== 's').length }; };
    const r1 = await run(); ok(r1.r.part === 'link' && r1.w.pt.n === 1 && r1.b.part === 'link' && Date.parse(r1.w.nextAt) - Date.now() < 26 * 60e3, `사슬 다 못 봄 → 25분 뒤 이어 봄(판본 ${r1.w.n})`);
    const r2 = await run(); ok(r2.w.n > r1.w.n && r2.r.reuse >= 2, `이어 볼 때 읽은 판본은 다시 씀(다시 씀 ${r2.r.reuse} · 판본 ${r1.w.n}→${r2.w.n} · 화면 ${r2.pg}쪽)`);
    ok(r2.pg <= 3, '이어 보기는 새 화면만 읽음(0.1.2는 처음부터 다시 읽어 하루 4번 16~17쪽씩)');
    const r3 = await run(); const toMid = Date.parse(r3.w.nextAt) - Date.now(); ok(r3.w.pt.n === 3 && r3.r.part === 'link' && toMid > 30 * 60e3 && toMid <= 24 * 3600e3 + 60e3 && new Date(Date.parse(r3.w.nextAt) + 9 * 3600e3).toISOString().slice(11, 16) === '00:00', `하루 처음 + 2번 넘으면 다음 날 0시로(${r3.w.nextAt})`);
    ok(r3.w.eds.map((e) => e.rel).join().startsWith('ours,newer') && r3.w.latest === r3.w.eds[r3.w.eds.length - 1].k, '차례·가장 새 판 그대로'); }

  console.log('② 진척 없는 이어 보기는 보통 날로');
  { const P = { '4001': ed('4001', '9788940000001', '외딴 책', '외딴', '2005-01-01', [['4101', '개정판 보기'], ['4102', '개정판 보기'], ['4103', '개정판 보기'], ['4104', '개정판 보기']]) };
    for (const i of ['4101', '4102', '4103', '4104']) P[i] = ed(i, null, '전혀 다른 ' + i, '남' + i, '2011-01-01', []);
    const Wd = world(P); const ours = '9788940000001'; Wd.target(ours, 'D1'); Wd.store.set('app_settings/ed_cfg', { gapMin: 0, gapMax: 1, nl: false, maxLinkHops: 2 });
    const A = Wd.mk(); await A.tick(); const w1 = Wd.getD('ed_work/w' + ours); ok(w1.partial === 'link' && !w1.stuck, '첫 회차 partial');
    Wd.store.set('ed_book/' + ours, { ...Wd.getD('ed_book/' + ours), nextAt: past }); Wd.store.set('ed_work/w' + ours, { ...w1, pt: null });
    await A.tick(); const w2 = Wd.getD('ed_work/w' + ours); ok(w2.stuck && Date.parse(w2.nextAt) - Date.now() > 10 * 864e5, `새로 찾은 판이 없으면 stuck → 보통 다시 보기 날(${w2.nextAt.slice(0, 10)})`); }

  console.log('③ 못 읽는 화면은 하루 한 번');
  { const P = { '1009': ed('1009', '9788900000009', '산의 책', '김산', '2012-01-01', []) };
    const Wd = world(P); Wd.target('9791195936380', 'F1'); Wd.target('9788900000009', 'F2'); Wd.store.set('app_settings/ed_cfg', { gapMin: 0, gapMax: 1, nl: false });
    const A = Wd.mk(); const R1 = await A.tick(); const f = (Wd.getD('app_settings/ed_study').fail || {})['9791195936380'];
    ok(R1.books.some((b) => b.isbn === '9791195936380' && /못 읽음/.test(b.err || '')) && f && f.n === 1 && new Date(Date.parse(f.next) + 9 * 3600e3).toISOString().slice(11, 16) === '00:00', `못 읽으면 다음 한국 날 0시까지 미룸(${f && f.next})`);
    Wd.seen.length = 0; const R2 = await A.tick(); ok(R2.failSkip === 1 && !Wd.seen.includes('9791195936380') && !R2.books.length, '같은 날 다음 회차는 화면을 안 읽음(1쪽 되풀이 없음)');
    const B = Wd.mk(); Wd.seen.length = 0; const R3 = await B.tick(); ok(R3.failSkip === 1 && !Wd.seen.includes('9791195936380'), '인스턴스가 새로 떠도 장부(ed_study.fail)로 이어 미룸');
    Wd.store.set('app_settings/ed_study', { ...Wd.getD('app_settings/ed_study'), fail: { '9791195936380': { ...f, next: past } } }); P['1010'] = ed('1010', '9791195936380', '돌아온 책', '박돌', '2019-01-01', []);
    const Cc = Wd.mk(); await Cc.tick(); const f2 = (Wd.getD('app_settings/ed_study').fail || {})['9791195936380']; ok(f2 && f2.n === 0 && !f2.next && Wd.getD('ed_work/w9791195936380'), '다시 읽히면 장부 풂(n 0)·묶음 남김'); }

  console.log('④ 빌린 몫(watch1 0.1.3)과 함께 — 정기 상한 = 오늘 상한 − 다시 보기 몫');
  { const Wd = world({}); Wd.store.set('app_settings/ed_cfg', { dayCap: 80, alDay: 100000, capMax: 400, gapMin: 0, gapMax: 1, nl: false });
    let blk = false; const A = Wd.mk({ alUse: () => ({ others: [], alBlk: blk }) }); const dg = await A.diag({ edition: 1 }); const cap = dg.mem.cap.cap;
    ok(cap >= 80 && cap <= 400 && dg.rr.regCap === cap - 60, `빌린 몫이 있어도 정기 상한은 오늘 상한 − 60(${cap} → ${dg.rr.regCap})`);
    blk = true; const B = Wd.mk({ alUse: () => ({ others: [], alBlk: blk }) }); const dg2 = await B.diag({ edition: 1 }); ok(dg2.mem.cap.cap === 80 && dg2.rr.regCap === 20, '막힘 기록이 있으면 바닥 80 · 정기 상한 20'); }

  console.log(bad ? `\n✗ ${bad}개 실패` : '\n✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('✗ 오류', e); process.exit(1); });

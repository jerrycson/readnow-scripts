/* t_unit — 순수 부품: 칸 견주기(col2-compare-core) · 속도 지키기(col2-pace · 가짜 시계) · 저장 막이(col2-store · 가짜 db)
 * 실행: node tests/t_unit.js */
const L = require('./lib.js'); const { ok } = L; const fs = require('fs'), os = require('os'), path = require('path');
const COL2 = require('../col2-config.js'); const CMP = require('../shadow/col2-compare-core.js'); const ST = require('../shadow/col2-store.js'); const { makePace } = require('../helper/col2-pace.js');

(async () => {
  console.log('① 칸 견주기');
  const F = COL2.BOOK_FIXED; const base = { aladinItemId: '1', title: '가', subtitle: null, contributors: [{ name: '갑', role: '지은이', aladinAuthorId: '9' }], publisher: '나', pubDate: '2024-01-01', pages: 100, categories: [{ path: ['국내도서'], cids: ['1'] }], basicExtra: [] };
  let r = CMP.compareBook(base, JSON.parse(JSON.stringify(base)), F); ok(r.verdict === 'same' && r.n.same === 7 && !r.rows.some((x) => x.f === 'subtitle' || x.f === 'basicExtra'), '똑같으면 같음 · 둘 다 빈 칸은 세지 않음', JSON.stringify(r.n));
  const reord = { ...base, contributors: [{ aladinAuthorId: '9', role: '지은이', name: '갑' }] }; ok(CMP.compareBook(base, reord, F).verdict === 'same', '묶음 안 칸 순서가 달라도 같음(Firestore가 칸 이름 순으로 돌려줌)');
  r = CMP.compareBook({ ...base, publisher: '다' }, base, F); ok(r.verdict === 'diff' && r.diffFields.join() === 'publisher', '출판사가 다르면 다름 · 그 칸 이름');
  { /* (11/11 col2rep1) 운영이 오래전에 읽은 문서의 고정형 칸 다름 = 'old'(까닭 있음) · 최근에 읽었으면 그대로 'diff' */ const T = Date.now(), D = 864e5;
    const o1 = CMP.compareBook({ ...base, publisher: '다', lastFetchedAt: new Date(T - 30 * D).toISOString() }, base, F, { now: T }); ok(o1.verdict === 'diff' && o1.rows.find((x) => x.f === 'publisher').k === 'old' && o1.n.diff === 0 && o1.ageDays === 30, '운영이 30일 전에 읽음 → 다름의 까닭 = 오래됨(old) · 나이 적음', JSON.stringify(o1.n));
    const o2 = CMP.compareBook({ ...base, publisher: '다', lastFetchedAt: new Date(T - 2 * D).toISOString() }, base, F, { now: T }); ok(o2.rows.find((x) => x.f === 'publisher').k === 'diff', '운영이 2일 전에 읽었으면 까닭 모를 다름(diff) 그대로');
    const o3 = CMP.compareBook({ ...base, publisher: '다', lastFetchedAt: { seconds: Math.floor((T - 10 * D) / 1000) } }, base, F, { now: T, oldDays: 14 }); ok(o3.rows.find((x) => x.f === 'publisher').k === 'diff', '기준 날 수(oldDays)를 설정으로 바꿈 · Firestore 시각 꼴도 읽음'); }
  r = CMP.compareBook({ ...base, title: '옛 제목', seenInfo: { title: '가' } }, base, F); ok(r.verdict === 'same' && r.rows.find((x) => x.f === 'title').k === 'seen', '운영이 처음 값을 지켰지만 지금 화면 값(seenInfo)이 같으면 같음(seen)');
  r = CMP.compareBook({ ...base, title: '교보 제목', infoFrom: { title: 'kyobo' } }, base, F); ok(r.verdict === 'same' && r.rows.find((x) => x.f === 'title').k === 'ext', '운영 값이 바깥 정보(infoFrom)면 출처 다름(고장 아님)');
  r = CMP.compareBook({ ...base, pages: null }, base, F); ok(r.verdict === 'same' && r.rows.find((x) => x.f === 'pages').k === 'fill', '운영 칸이 비어 있고 그림자만 있으면 fill(다름 아님)');
  r = CMP.compareBook(base, { ...base, pages: null }, F); ok(r.verdict === 'diff' && r.rows.find((x) => x.f === 'pages').k === 'lack', '그림자 칸이 비면 lack = 다름(해석이 달라졌을 수 있음)');
  ok(CMP.compareBook(null, base, F).verdict === 'noprod', '운영 문서가 없으면 noprod');
  const pk = CMP.pickPage({ ...base, ranks: ['x'], images: { front: 'a' }, salesPoint: 3, priceList: 1000 }, F); ok(!('ranks' in pk) && !('images' in pk) && pk.priceList === 1000 && pk.originalTitle === null && Object.keys(pk).length === F.length + 3, '저장할 칸만 골라 작게(정해진 칸 + 가격 둘)');

  console.log('② 속도 지키기(가짜 시계)');
  let T = 1_800_000_000_000; const slept = []; const D = fs.mkdtempSync(path.join(os.tmpdir(), 'col2u_'));
  const cfg = { minGapMs: 8000, jitter: 0, hourCap: 3, dayCap: 5, cool429Min: 10 };
  const P = makePace(path.join(D, 'pace.json'), () => cfg, { now: () => T, sleep: async (ms) => { slept.push(ms); T += ms; } });
  let a = await P.take(); ok(a.ok && a.waited === 0, '처음은 바로');
  a = await P.take(); ok(a.ok && slept[0] === 8000, '두 번째는 8초 기다림(운영 0.7초보다 훨씬 느림)', slept.join(','));
  a = await P.take(); ok(a.ok, '세 번째'); a = await P.take(); ok(!a.ok && /한 시간에 3장/.test(a.why) && a.retryMs > 0, '한 시간 상한을 넘으면 기다리지 않고 거절 + 다시 될 때까지 남은 시간', a.why);
  T += 3600e3; a = await P.take(); ok(a.ok, '한 시간 지나면 다시 됨'); T += 3600e3; await P.take(); a = await P.take(); ok(!a.ok && /하루 5장/.test(a.why), '하루 상한', a.why);
  const P2 = makePace(path.join(D, 'pace.json'), () => cfg, { now: () => T, sleep: async (ms) => { T += ms; } }); ok(P2.state().dayN === 5, '도우미를 다시 켜도 하루 수를 이어 셈(pace.json)');
  T += 86400e3; P2.fail('429'); a = P2.check(); ok(!a.ok && /쉬는 중/.test(a.why) && a.retryMs === 600e3, '429면 10분 쉼', a.why); P2.fail('429'); ok(P2.check().retryMs === 1200e3, '또 429면 20분(횟수만큼 길게)');

  console.log('③ 저장 막이');
  const W = []; const fakeDb = { collection: (c) => ({ doc: (id) => ({ get: async () => ({ exists: c === 'prd_books', data: () => ({ title: '가' }) }), set: async (v) => W.push([c, id, v]) }), add: async (v) => { W.push([c, 'auto', v]); return { id: 'x' }; }, limit: () => ({ get: async () => ({ docs: [] }) }) }) };
  const S = ST.make(fakeDb); ok((await S.get('prd_books', 'b1')).title === '가', '운영 칸은 읽기만 됨');
  await S.set('col2_books', 'b1', { a: undefined, b: 1 }); ok(W.length === 1 && W[0][0] === 'col2_books' && W[0][2].a === null, 'col2_* 칸은 씀(undefined는 null로)');
  for (const c of ['prd_books', 'ui2_site', 'crm_system', 'col2', 'col2_x/y/z', 'COL2_books']) { let e = null; try { await S.set(c, 'z', { x: 1 }); } catch (x) { e = x; } ok(e && e.blocked, `'${c}' 쓰기는 막음`); }
  let e2 = null; try { await S.add('prd_metric_changes', { x: 1 }); } catch (x) { e2 = x; } ok(e2 && e2.blocked && W.length === 1 && S.blocked.length === 7, '더하기(add)도 막음 · 막은 것을 셈 · 실제 쓰기 없음');
  ok(ST.LSP === 'rn3-' && COL2.LS === 'rn3-', '기기 저장 열쇠 머리 rn3-');
  L.done('t_unit');
})();

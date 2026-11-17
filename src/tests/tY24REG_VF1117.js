// tY24REG_VF1117 — (y24reg5 · 11/17 00:08Z 블루레이가 실제로 예스24에 올라갔는데 번외가 '등록 완료' 창을 못 봐 '확인 필요'로 멈춤) 🔎 클라우드 올라감 확인
//   ① 확인 필요(sent · unsure · 번호 없음) 줄을 공개 자료에서 '꼭 하나'일 때만 찾아 올라감(ok 1 · gno)으로 — 허브 공개 화면 판매자 우리 가게 · 관리자 목록 자체코드 · 우리 가게 새 매물
//   ② 그 묶음의 확인 필요 줄이 모두 풀리면 그 묶음이 건 멈춤(unsure)만 풂 · 다른 까닭의 멈춤은 그대로
//   ③ 애매(둘 넘음)·맡기기 전 있던 번호·다른 판매자·다른 값/등급이면 아무것도 바꾸지 않음 · 한 줄은 10분에 한 번만 읽음
//   ④ 번외 결과에 raw가 없으면 장부 auto.last.raw = null(예전엔 옛 raw가 남음) · 허브 번호(mno)를 줄에 적음
// 실행: node src/tests/tY24REG_VF1117.js · 지어낸 자료(손님 정보 없음) · 실제 Firebase·예스24에 아무것도 안 함
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const TOP = path.resolve(__dirname, '..', '..'); const rd = (f) => fs.readFileSync(path.join(TOP, f), 'utf8');
const BC = '8809866320756', LID = 'aladin_U495184596', JOB = 'y24a261117000741m7c', HUB = '150109556', GNO = '201101131';
const li = (id, p, g, sid, nm) => `<li saleprice="${p}"><a data-goods-no="${id}" href="#"></a><em class="yes_b">${Number(p).toLocaleString('en-US')}</em><span class="ico_used">${g}</span><div class="store_name"><a href="https://www.yes24.com/24/usedShop/mall/${sid}/main">${nm}</a></div></li>`;
const hubHtml = (items) => '<html><body><ul>' + items.join('') + '</ul></body></html>';
(async () => {
  const { makeDb } = require(path.join(TOP, 'lab/col2/tests/fakefs-admin.js'));
  const { makeY24Auto } = require(path.join(TOP, 'cloud/y24auto.js'));
  const XLP = [path.join(__dirname, 'xlsx.full.min.js'), '/home/user/w/pw/xlsx.full.min.js', process.env.RN_XLSX].filter(Boolean).find((f) => fs.existsSync(f));
  if (!XLP) { ok(false, 'xlsx.full.min.js 없음 — 클라우드 시험을 못 돌림(건너뛰지 않고 ❌)'); return fin(); }
  const XLSX = (() => { const m = { exports: {} }; new Function('module', 'exports', fs.readFileSync(XLP, 'utf8'))(m, m.exports); return m.exports; })();
  const texts = { 'src/app.html': rd('src/app.html'), 'readnow-ext-core.js': rd('readnow-ext-core.js'), 'readnow-registry.js': rd('readnow-registry.js'), 'readnow-shipping-core.js': rd('readnow-shipping-core.js') };
  const row = (o) => ({ lid: LID, title: '시험 블루레이', isbn: BC, bc: BC, grade: '최상', qty: 1, price: 298000, skus: ['KHKd8784EX'], at: '2026-11-17T00:07:41.943Z', by: '🤖 자동 올림 · 클라우드(HOME)', batch: JOB, job: JOB, auto: 1, st: 'sent', unsure: 1, why: '[등록]을 눌렀지만 확인이 흐림', todo: '예스24 등록상품 관리에서 확인', before: [], hist: [], ...o });
  /* 한 판 꾸미기 — led = 장부 · hub = 허브 화면 글(주소 → 글) · extra(store) = 다른 자료 */
  async function mk(led, hub, extra) { let T = Date.parse('2026-11-17T00:30:00Z'); const now = () => T; const Fd = makeDb(); const { store } = Fd; const put = (c, id, v) => { (store[c] = store[c] || {})[id] = JSON.parse(JSON.stringify(v)); };
    put('app_settings', 'main', { reg: { srcX: [] } }); put('app_settings', 'platforms', { y24: {} }); put('app_settings', 'ship_auto', {}); put('app_settings', 'y24_link', { m: {}, x: {} }); put('app_settings', 'sku_seq', { mapN: 0 }); put('app_settings', 'sku_map_0', { m: {} });
    put('prd_listings', LID, { listingId: 9101, usedCode: 'U495184596', title: '시험 블루레이', isbn13: null, grade: '최상', price: 298000, priceList: 400000, qty: 1, sku: 'BD_U1', active: true, status: '판매중' });
    put('app_settings', 'y24_reg', led); if (extra) extra(put);
    const got = []; const hubGet = async (u) => { got.push(u); const k = Object.keys(hub || {}).find((x) => u.includes(x)); if (!k) throw new Error('HTTP 404'); return hub[k]; };
    const Y = makeY24Auto({ db: Fd.db, C: Fd.C, FV: Fd.FV, now, getText: async (f) => { if (!texts[f]) throw new Error('없음 ' + f); return texts[f]; }, getUrl: async () => { throw new Error('바깥 안 감'); }, xlsx: XLSX, hubGet });
    return { Y, store, got, led: () => store.app_settings.y24_reg, tick: (ms) => { T += ms; } }; }
  const stopU = { why: '[등록]을 눌렀지만 확인이 흐림', state: 'unsure', job: JOB, at: '2026-11-17T00:08:52Z', hv: '0.1.74' };
  const lastRaw = { job: JOB, state: 'unsure', raw: { vs: { rows: [{ bc: BC, no: HUB }] } } };
  const yOf = () => ({ st: { login: 'ok', hold: false, en: true, ver: '0.1.75', bc: 1, wait: [], cur: null }, res: {}, rej: [] });

  console.log('① 허브 공개 화면 판매자 우리 가게 — 꼭 하나면 올라감 · 멈춤 풂');
  { const H = hubHtml([li('201000001', 250000, '최상', 'other1', '남의 가게'), li(GNO, 298000, '최상', 'jerrycson', '북스퀸'), li('201000002', 298000, '상', 'jerrycson', '북스퀸'), li('201000003', 298000, '최상', 'other2', '남의 가게2')]);
    const S = await mk({ r: { [LID]: row() }, auto: { stop: stopU, last: lastRaw } }, { ['Hub/' + HUB]: H });
    const y = await S.Y.step('HOME', yOf()); const e = S.led().r[LID];
    ok(e.st === 'sent' && e.ok === 1 && e.gno === GNO && e.unsure === null && e.why === null && e.todo === null && /클라우드/.test(e.okBy) && /허브/.test(e.how), '블루레이 줄 = 올라감(ok 1 · gno ' + GNO + ' · 확인 필요 지움)', e);
    ok(e.mno === HUB, '허브 번호(mno)는 번외가 본 미리보기 결과 줄(auto.last.raw.vs.rows)에서', e.mno);
    ok(S.led().auto.stop === null && S.led().auto.vf && S.led().auto.vf.freed && S.led().auto.vf.freed.job === JOB, '그 묶음 멈춤(unsure) 풂 · 기록 auto.vf.freed', S.led().auto);
    ok(S.got.length === 1 && S.got[0].includes('/Product/UsedShopHub/Hub/' + HUB), '허브 화면 한 쪽만 읽음', S.got);
    ok(y.vf && y.vf.ok.length === 1 && !/멈춤/.test(y.why), '같은 차례에 멈춤이 풀려 다음 판단으로 이어감', { why: y.why, vf: y.vf }); }

  console.log('② 애매하면 아무것도 바꾸지 않음');
  { const H = hubHtml([li(GNO, 298000, '최상', 'jerrycson', '북스퀸'), li('201101132', 298000, '최상', 'jerrycson', '북스퀸')]);
    const S = await mk({ r: { [LID]: row() }, auto: { stop: stopU, last: lastRaw } }, { ['Hub/' + HUB]: H });
    const y = await S.Y.step('HOME', yOf()); const e = S.led().r[LID];
    ok(!e.ok && !e.gno && e.unsure === 1 && S.led().auto.stop && S.led().auto.stop.job === JOB && /멈춤/.test(y.why), '같은 값·등급 우리 매물 둘 → 그대로(사람 확인) · 멈춤 그대로', { e, why: y.why });
    ok(y.vf && y.vf.amb.length === 1, '애매 까닭이 진단에 보임', y.vf); }
  { const H = hubHtml([li(GNO, 298000, '최상', 'jerrycson', '북스퀸')]);
    const S = await mk({ r: { [LID]: row({ before: [GNO] }) }, auto: { stop: stopU, last: lastRaw } }, { ['Hub/' + HUB]: H });
    await S.Y.step('HOME', yOf()); ok(!S.led().r[LID].gno && S.led().auto.stop, '맡기기 전부터 있던 번호(before)는 우리 새 매물로 보지 않음', S.led().r[LID]); }
  { const H = hubHtml([li(GNO, 298000, '최상', 'other1', '남의 가게'), li('201000009', 290000, '최상', 'jerrycson', '북스퀸')]);
    const S = await mk({ r: { [LID]: row() }, auto: { stop: stopU, last: lastRaw } }, { ['Hub/' + HUB]: H });
    await S.Y.step('HOME', yOf()); ok(!S.led().r[LID].gno && S.led().auto.stop, '다른 판매자 같은 값 · 우리 가게 다른 값 → 못 찾음(그대로)', S.led().r[LID]);
    S.tick(61e3); await S.Y.step('HOME', yOf()); ok(S.got.length === 1, '한 줄은 10분에 한 번만 읽음(그 사이 차례는 화면을 다시 읽지 않음)', S.got);
    S.tick(10 * 60e3); await S.Y.step('HOME', yOf()); ok(S.got.length === 2, '10분 뒤 다시 읽음', S.got); }
  { const H = hubHtml([li(GNO, 298000, '최상', 'jerrycson', '북스퀸')]);
    const S = await mk({ r: { [LID]: row(), aladin_U2: row({ lid: 'aladin_U2', isbn: '9788900000011', bc: undefined, st: 'sent', ok: 1, unsure: null, gno: GNO, job: 'y24aOLD' }) }, auto: { stop: stopU, last: lastRaw } }, { ['Hub/' + HUB]: H });
    await S.Y.step('HOME', yOf()); ok(!S.led().r[LID].gno, '장부 다른 줄의 번호는 쓰지 않음', S.led().r[LID]); }
  { const S = await mk({ r: { [LID]: row() }, auto: { stop: stopU } }, {});
    const y = await S.Y.step('HOME', yOf()); ok(!S.led().r[LID].gno && S.got.length === 0 && y.vf && /허브 번호 모름/.test(y.vf.none[0] || ''), '허브 번호를 모르면 화면을 읽지 않고 그대로', y.vf); }

  console.log('③ 다른 증거 — 관리자 목록 자체코드 · 우리 가게 새 매물');
  { const S = await mk({ r: { [LID]: row() }, auto: { stop: stopU, last: lastRaw } }, {}, (put) => {
      put('crm_y24_raw', 'raw1', { sig: 'POST /api/Product/ProductList', at: '2026-11-17T00:20:00Z', body: JSON.stringify({ PRODUCT_LIST: [{ GOODS_NO: GNO, EAN: BC, GOODS_LEVEL_GB: '01', GOODS_STAT_GB: '02', ENTR_GOODS_CD: 'KHKd8784EX' }, { GOODS_NO: '199999999', EAN: BC, GOODS_LEVEL_GB: '01', GOODS_STAT_GB: '02', ENTR_GOODS_CD: 'ZZ_OTHER' }] }) }); });
    await S.Y.step('HOME', yOf()); const e = S.led().r[LID]; ok(e.gno === GNO && e.ok === 1 && /자체코드/.test(e.how) && S.got.length === 0 && S.led().auto.stop === null, '관리자 목록 자체코드가 꼭 하나 → 올라감(화면을 읽지 않음) · 멈춤 풂', { e, got: S.got }); }
  { const S = await mk({ r: { [LID]: row() }, auto: { stop: stopU } }, {}, (put) => {
      put('y24_listings', '190000001', { goodsNo: '190000001', grade: '최상', price: 298000, firstSeenAt: '2026-11-10T00:00:00Z', lastSeenAt: '2026-11-17T00:00:00Z' });
      put('y24_listings', GNO, { goodsNo: GNO, grade: '최상', price: 298000, firstSeenAt: '2026-11-17T00:15:00Z', lastSeenAt: '2026-11-17T00:15:00Z' });
      put('y24_listings', '201101140', { goodsNo: '201101140', grade: '상', price: 298000, firstSeenAt: '2026-11-17T00:15:00Z', lastSeenAt: '2026-11-17T00:15:00Z' }); });
    await S.Y.step('HOME', yOf()); const e = S.led().r[LID]; ok(e.gno === GNO && /우리 가게/.test(e.how) && S.led().auto.stop === null, '우리 가게 목록에 맡긴 뒤 처음 보인 같은 값·등급 매물이 꼭 하나 → 올라감(옛 매물·다른 등급은 뺌)', e); }

  console.log('④ 멈춤 풀기는 그 묶음만 · 줄이 남으면 그대로');
  { const H = hubHtml([li(GNO, 298000, '최상', 'jerrycson', '북스퀸')]);
    const S = await mk({ r: { [LID]: row() }, auto: { stop: { ...stopU, state: 'fail' }, last: lastRaw } }, { ['Hub/' + HUB]: H });
    await S.Y.step('HOME', yOf()); ok(S.led().r[LID].gno === GNO && S.led().auto.stop && S.led().auto.stop.state === 'fail', '줄은 올라감으로 고치되 다른 까닭(fail) 멈춤은 그대로', S.led().auto.stop); }
  { const H = hubHtml([li(GNO, 298000, '최상', 'jerrycson', '북스퀸')]);
    const S = await mk({ r: { [LID]: row(), aladin_U3: row({ lid: 'aladin_U3', isbn: '9788900000028', bc: undefined, skus: ['QQ1'], price: 15000, grade: '상' }) }, auto: { stop: stopU, last: lastRaw } }, { ['Hub/' + HUB]: H });
    await S.Y.step('HOME', yOf()); ok(S.led().r[LID].gno === GNO && S.led().r.aladin_U3.unsure === 1 && S.led().auto.stop && S.led().auto.stop.job === JOB, '같은 묶음에 아직 확인 필요 줄이 남으면 멈춤 그대로', S.led().auto.stop); }

  console.log('⑤ 번외 결과 raw 없음 → null · 허브 번호 적음');
  { const S = await mk({ r: { [LID]: row({ st: 'auto', unsure: null, why: null, todo: null }) }, auto: { stop: null, last: { job: 'y24aOLD', raw: { old: 1, txt: '옛 화면' } } } }, {});
    const y = yOf(); y.res = { [JOB]: { state: 'unsure', rows: [LID], msg: '[등록]을 눌렀지만 확인이 흐림', mno: { [LID]: HUB } } };
    await S.Y.step('HOME', y); const L = S.led(); ok(L.auto.last && L.auto.last.job === JOB && L.auto.last.raw === null, 'raw가 없는 결과 → auto.last.raw = null(옛 raw 남지 않음)', L.auto.last);
    ok(L.r[LID].st === 'sent' && L.r[LID].unsure === 1 && L.r[LID].mno === HUB, '확인 필요 줄에 허브 번호(mno) 적음', L.r[LID]); }
  { const S = await mk({ r: { [LID]: row({ st: 'auto', unsure: null }) }, auto: { stop: null } }, {});
    const y = yOf(); y.res = { [JOB]: { state: 'done', rows: [LID], msg: '올라감', gno: { [LID]: GNO }, mno: { [LID]: HUB }, raw: { vl: { k: 1 } } } };
    await S.Y.step('HOME', y); const L = S.led(); ok(L.r[LID].ok === 1 && L.r[LID].gno === GNO && L.r[LID].mno === HUB && L.auto.last.raw && L.auto.last.raw.vl.k === 1, '번외가 찾은 줄(gno)에도 mno · raw는 그대로 담음', { r: L.r[LID], raw: L.auto.last.raw }); }

  console.log('⑥ 연결');
  { const ix = rd('cloud/index.js'); ok(/makeY24Auto\(\{[^}]*hubGet: \(u\) => y24Get\(u\)/.test(ix), '클라우드 본체가 허브 화면 읽기(y24Get · 손님 · 읽기만)를 넘김');
    const h = rd('lab/col2/helper/readnow-col2-helper.js'); ok(/res: s\.res/.test(h), '번외 홀로 연결이 결과(mno·raw 포함)를 통째로 클라우드에 넘김'); }
  fin();
})().catch((e) => { bad++; console.log('  ❌ 오류', e && e.stack); fin(); });
function fin() { console.log(bad ? `❌ tY24REG_VF1117 ${bad}개 실패` : '✓ tY24REG_VF1117 통과'); process.exitCode = bad ? 1 : 0; }

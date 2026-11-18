// tY24VF1118 — (y24vf1 · 11/18 09:04Z 「총 균 쇠 리커버」 40,000원 1건: 예스24 「1/1건 등록」인데 2시간 가까이 「확인 필요」 멈춤) 🔎 클라우드 올라감 확인 빠르게·끝까지
//   까닭(11/18 실측): 허브 매물 246줄 · 같은 등급 「상」 133줄(6쪽) · 값 낮은 차례라 40,000원 우리 매물은 6쪽 — 예전 vfStep은 같은 등급 1~3쪽만 봐서 영영 못 찾음
//   ① 상품등록순(sortGb 03) 목록 한 쪽을 먼저 봄 → 막 올린 우리 매물을 찾아 올라감(ok 1 · gno) · 멈춤 풂 · 같은 차례에 다음 1건으로 이어 감(같은 책은 다시 안 올림)
//   ② 새 매물 차례 쪽을 못 읽어도 예전 길(허브 첫 화면)로 찾음
//   ③ 처음 ⚙ vfFastH시간(기본 2)은 ⚙ vfMin분(기본 3)마다 · 그 뒤엔 10분마다 · 설정 값을 따름
//   ④ 찾는 동안 상태 글 = 「🔎 확인 중」(새로 맡기지 않음 · 확인 필요 줄은 다시 후보 아님) · 그 시간이 지나도 못 찾으면 그때 「⛔ 멈춤 … 사람 확인」
//   ⑤ 웹앱 y24RegCfg가 vfMin·vfFastH를 받아 범위로 자름 · ⚙ 화면에 칸
// 실행: node src/tests/tY24VF1118.js · 지어낸 자료(손님 정보 없음) · 실제 Firebase·예스24에 아무것도 안 함
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const TOP = path.resolve(__dirname, '..', '..'); const rd = (f) => fs.readFileSync(path.join(TOP, f), 'utf8');
const ISBN = '9788900000028', LID = 'aladin_U900000001', LID2 = 'aladin_U900000002', JOB = 'y24a261118090331tst', HUB = '1900001', GNO = '201900001';
const li = (id, p, g, sid, nm) => `<li saleprice="${p}"><a data-goods-no="${id}" href="#"></a><em class="yes_b">${Number(p).toLocaleString('en-US')}</em><span class="ico_used">${g}</span><div class="store_name"><a href="https://www.yes24.com/24/usedShop/mall/${sid}/main">${nm}</a></div></li>`;
const page = (items, last) => '<html><body><ul>' + items.join('') + '</ul>' + (last ? `<a onclick="getUsedGoodsListPage(this, ${last})">${last}</a>` : '') + '</body></html>';
const cheap = (n, from) => Array.from({ length: n }, (_, i) => li(String(202000000 + from + i), 10000 + (from + i) * 100, '상', 'other' + i, '남의 가게' + i));
(async () => {
  const { makeDb } = require(path.join(TOP, 'lab/col2/tests/fakefs-admin.js'));
  const { makeY24Auto } = require(path.join(TOP, 'cloud/y24auto.js'));
  const XLP = [path.join(__dirname, 'xlsx.full.min.js'), '/home/user/w/pw/xlsx.full.min.js', process.env.RN_XLSX].filter(Boolean).find((f) => fs.existsSync(f));
  if (!XLP) { ok(false, 'xlsx.full.min.js 없음 — 클라우드 시험을 못 돌림(건너뛰지 않고 ❌)'); return fin(); }
  const XLSX = (() => { const m = { exports: {} }; new Function('module', 'exports', fs.readFileSync(XLP, 'utf8'))(m, m.exports); return m.exports; })();
  const texts = { 'src/app.html': rd('src/app.html'), 'readnow-ext-core.js': rd('readnow-ext-core.js'), 'readnow-registry.js': rd('readnow-registry.js'), 'readnow-shipping-core.js': rd('readnow-shipping-core.js') };
  const row = (o) => ({ lid: LID, title: '시험 책 리커버', isbn: ISBN, grade: '상', qty: 1, price: 40000, alPrice: 40000, skus: ['TSTa0001EX'], mno: HUB, at: '2026-11-18T09:03:31.090Z', by: '🤖 자동 올림 · 클라우드(HOME)', batch: JOB, job: JOB, auto: 1, st: 'sent', unsure: 1,
    why: '예스24가 1건 등록했다고 함 · 판매중 1·미출간 0 (전체 1) · 등록상품 목록에서 자체코드 확인 0/1 · 클라우드가 공개 화면(판매자 북스퀸)에서 다시 찾음', todo: '예스24 판매관리 › 등록상품 관리에서 확인 못 한 줄을 보고 📤 장부에서 「올라감 확인」 또는 「↩ 다시 올릴 수 있게」', before: [], hist: [], ...o });
  const stopU = { why: row().why, todo: row().todo, state: 'unsure', job: JOB, at: '2026-11-18T09:04:34.695Z', hv: '0.1.78' };
  async function mk(led, hub, at, plat) { let T = Date.parse(at || '2026-11-18T09:10:00Z'); const now = () => T; const Fd = makeDb(); const { store } = Fd; const put = (c, id, v) => { (store[c] = store[c] || {})[id] = JSON.parse(JSON.stringify(v)); };
    put('app_settings', 'main', { reg: { srcX: [] } }); put('app_settings', 'platforms', plat || { y24: {} }); put('app_settings', 'ship_auto', {}); put('app_settings', 'y24_link', { m: {}, x: {} }); put('app_settings', 'sku_seq', { mapN: 0 });
    put('prd_listings', LID, { listingId: 9201, usedCode: 'U900000001', title: '시험 책 리커버', isbn13: ISBN, grade: '상', price: 40000, priceList: 50000, qty: 1, sku: 'TST_1', active: true, status: '판매중' });
    put('app_settings', 'y24_reg', led);
    const got = []; const hubGet = async (u) => { got.push(u); const k = Object.keys(hub || {}).find((x) => u.includes(x)); if (!k) throw new Error('HTTP 404'); return hub[k]; };
    const Y = makeY24Auto({ db: Fd.db, C: Fd.C, FV: Fd.FV, now, getText: async (f) => { if (!texts[f]) throw new Error('없음 ' + f); return texts[f]; }, getUrl: async () => { throw new Error('바깥 안 감'); }, xlsx: XLSX, hubGet });
    return { Y, store, got, led: () => store.app_settings.y24_reg, tick: (ms) => { T += ms; } }; }
  const yOf = () => ({ st: { login: 'ok', hold: false, en: true, ver: '0.1.78', wait: [], cur: null }, res: {}, rej: [] });
  const NEW = 'sortGb=03'; const HUBK = 'Hub/' + HUB;
  /* 실측 모양: 허브 첫 화면·값 차례 1~3쪽엔 우리 매물이 없음(6쪽) · 상품등록순 첫 쪽 맨 앞에 우리 매물 */
  const hubPages = { [NEW]: page([li(GNO, 40000, '상', 'jerrycson', '북스퀸'), ...cheap(5, 0)], 6), [HUBK]: page(cheap(24, 0), 11), 'pageNumber=1&sortGb=01': page(cheap(24, 0), 6), 'pageNumber=2&sortGb=01': page(cheap(24, 24), 6), 'pageNumber=3&sortGb=01': page(cheap(24, 48), 6) };

  console.log('① 상품등록순 목록에서 우리 새 매물을 찾음 → 올라감 · 멈춤 풂');
  { const S = await mk({ r: { [LID]: row() }, auto: { stop: stopU } }, hubPages);
    const y = await S.Y.step('HOME', yOf()); const e = S.led().r[LID];
    ok(e.st === 'sent' && e.ok === 1 && e.gno === GNO && e.unsure === null && e.todo === null && /클라우드/.test(e.okBy), '줄 = 올라감(ok 1 · gno) · 확인 필요 지움', e);
    ok(S.got.length === 1 && S.got[0].includes(NEW) && S.got[0].includes('levelGb=02'), '상품등록순 같은 등급 한 쪽만 읽고 끝(허브 첫 화면·값 차례 쪽은 안 읽음)', S.got);
    ok(S.led().auto.stop === null && S.led().auto.vf.freed.job === JOB, '그 묶음 멈춤 풂 · auto.vf.freed', S.led().auto);
    ok(!/멈춤|확인 중/.test(y.why) && !(y.jobs || []).some((j) => (j.rows || []).some((r) => r.lid === LID)), '같은 차례에 이어 감 · 그 책을 다시 맡기지 않음(되풀이 0)', { why: y.why, jobs: (y.jobs || []).map((j) => j.id) }); }
  { const S = await mk({ r: { [LID]: row() }, auto: { stop: stopU } }, { [HUBK]: hubPages[HUBK], 'pageNumber=1&sortGb=01': hubPages['pageNumber=1&sortGb=01'], 'pageNumber=2&sortGb=01': hubPages['pageNumber=2&sortGb=01'], 'pageNumber=3&sortGb=01': hubPages['pageNumber=3&sortGb=01'] });
    await S.Y.step('HOME', yOf()); ok(!S.led().r[LID].gno && S.led().auto.stop, '(대조) 상품등록순 쪽이 없으면 값 차례 1~3쪽엔 없어 못 찾음 = 11/18 그대로의 모양', S.got); }

  console.log('② 새 매물 차례 쪽을 못 읽어도 예전 길(허브 첫 화면)로');
  { const S = await mk({ r: { [LID]: row() }, auto: { stop: stopU } }, { [HUBK]: page([li(GNO, 40000, '상', 'jerrycson', '북스퀸'), ...cheap(3, 0)], 1) });
    const y = await S.Y.step('HOME', yOf()); ok(S.led().r[LID].gno === GNO && S.led().auto.stop === null, '허브 첫 화면에서 찾음 · 멈춤 풂', { got: S.got, vf: y.vf }); ok(y.vf && y.vf.err.some((x) => /새 매물 차례/.test(x)), '못 읽은 까닭은 진단(vf.err)에 남음', y.vf); }

  console.log('③ 다시 찾는 간격 — 처음 2시간 3분마다 · 그 뒤 10분마다 · ⚙ 값');
  { const S = await mk({ r: { [LID]: row() }, auto: { stop: stopU } }, {}); await S.Y.step('HOME', yOf()); const n1 = S.got.length; ok(n1 >= 1, '첫 차례 읽음', S.got);
    S.tick(2 * 60e3); await S.Y.step('HOME', yOf()); ok(S.got.length === n1, '2분 뒤 = 안 읽음', S.got.length);
    S.tick(61e3); await S.Y.step('HOME', yOf()); ok(S.got.length === 2 * n1, '3분 지나면 다시 읽음', S.got.length);
    S.tick(2 * 3600e3); await S.Y.step('HOME', yOf()); const n3 = S.got.length; ok(n3 === 3 * n1, '2시간 넘어서도 읽음(한 번)', n3);
    S.tick(5 * 60e3); await S.Y.step('HOME', yOf()); ok(S.got.length === n3, '2시간 뒤엔 5분 지나도 안 읽음(10분마다)', S.got.length);
    S.tick(5 * 60e3 + 1e3); await S.Y.step('HOME', yOf()); ok(S.got.length === 4 * n1, '10분 지나면 읽음', S.got.length); }
  { const S = await mk({ r: { [LID]: row() }, auto: { stop: stopU } }, {}, null, { y24: { reg: { vfMin: 7, vfFastH: 1 } } }); await S.Y.step('HOME', yOf()); const n1 = S.got.length;
    S.tick(5 * 60e3); await S.Y.step('HOME', yOf()); ok(S.got.length === n1, '⚙ vfMin 7 → 5분 뒤 안 읽음', S.got.length);
    S.tick(2 * 60e3 + 1e3); const y = await S.Y.step('HOME', yOf()); ok(S.got.length === 2 * n1 && /7분마다/.test(y.why) && /처음 1시간/.test(y.why), '7분 지나 읽음 · 상태 글에 ⚙ 값', { n: S.got.length, why: y.why }); }

  console.log('④ 찾는 동안 「확인 중」 · 시간이 지나 못 찾으면 그때 「멈춤 · 사람 확인」');
  { const S = await mk({ r: { [LID]: row(), [LID2]: row({ lid: LID2, st: 'retry', unsure: null, job: null, batch: null, auto: 1, skus: ['TSTa0002EX'], isbn: '9788900000035', mno: null }) }, auto: { stop: stopU } }, {});
    const y = await S.Y.step('HOME', yOf()); ok(/^🔎 확인 중/.test(y.why) && /3분마다/.test(y.why), '상태 글 = 🔎 확인 중(사람 할 일 아님)', y.why);
    ok(!(y.jobs || []).length && S.led().auto.stop && S.led().r[LID].st === 'sent' && S.led().r[LID2].st === 'retry', '찾는 동안 새로 맡기지 않음 · 확인 필요 줄은 그대로 sent(다시 후보 아님)', { jobs: y.jobs, r: S.led().r });
    S.tick(2 * 3600e3); const y2 = await S.Y.step('HOME', yOf()); ok(/^⛔ 멈춤/.test(y2.why) && /2시간 동안 공개 화면에서 못 찾음 — 사람 확인/.test(y2.why) && S.led().auto.stop, '2시간 뒤 못 찾음 → 그때 사람 확인 멈춤', y2.why); }
  { const S = await mk({ r: { [LID]: row({ st: 'autofail', unsure: null }) }, auto: { stop: { why: '올리기 전 오류', state: 'fail', job: JOB, at: '2026-11-18T09:04:34Z' } } }, {});
    const y = await S.Y.step('HOME', yOf()); ok(/^⛔ 멈춤 — 올리기 전 오류$/.test(y.why), '다른 까닭 멈춤(fail)은 예전 글 그대로', y.why); }

  console.log('⑤ 웹앱 설정');
  { const h = rd('src/app.html'); const s = h.indexOf('const Y24R_DEF'); const e = h.indexOf('\nfunction y24RegCfg', s); const f = h.indexOf('\n', h.indexOf('return c; }', e));
    const B = new Function(h.slice(s, f) + '\nreturn { Y24R_DEF, y24RegCfg };')();
    ok(B.Y24R_DEF.vfMin === 3 && B.Y24R_DEF.vfFastH === 2, '기본 3분 · 2시간', B.Y24R_DEF);
    const c = B.y24RegCfg({ vfMin: 99, vfFastH: -1 }); ok(c.vfMin === 30 && c.vfFastH === 0, '범위로 자름(1~30분 · 0~24시간)', c);
    ok(B.y24RegCfg({ vfMin: 5, vfFastH: 1.5 }).vfMin === 5 && B.y24RegCfg({ vfMin: 5, vfFastH: 1.5 }).vfFastH === 1.5, '저장 값 그대로', B.y24RegCfg({ vfMin: 5, vfFastH: 1.5 }));
    ok(/id="y24r_vfm"/.test(h) && /id="y24r_vfh"/.test(h) && /vfMin: \+q\('#y24r_vfm'\)\.value/.test(h), '⚙ 예스24 올리기 설정 줄에 칸 · 저장 단추가 받음'); }
  fin();
})().catch((e) => { bad++; console.log('  ❌ 오류', e && e.stack); fin(); });
function fin() { console.log(bad ? `❌ tY24VF1118 ${bad}개 실패` : '✓ tY24VF1118 통과'); process.exitCode = bad ? 1 : 0; }

// tSELSHOP1111 — 11/11 engfix1: 🏪 판매자 숍 요약 다시 읽기(클라우드 sellerShopTick) · 로거 6개월 평가 수 일이 '이미 새로 읽힌 판매자' 건너뜀
//   왜: 로거 '⭐ 6개월 평가 수'가 11/09 목록 12,504곳 중 11/11까지 537곳만(쉴 때 일 자리 내줌 · 테더링 몫 없음) → 판매자 가치(N04)·S20 재료 멈춤
//   ① 숍 화면 → 칸(sshSumOf) ② 클라우드 회차 — 가짜 Firestore · 가짜 응답(진짜 사이트에 요청하지 않음) ③ 수집기 건너뛰기 글자 확인 ④ 진단 S 표 끝 칸
// 실행: cd pw && node tSELSHOP1111.js   (공용 파일·클라우드는 ../readnow-ext-core.js · ../cloud/index.js) · 브라우저 필요 없음
// 시험 자료는 모두 지어낸 값(가게A · 업체A · 대표A · 010-0000-0000 · 가게 번호 9000001…)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m, x === undefined ? '' : JSON.stringify(x).slice(0, 220)); };
const ROOT = path.join(__dirname, '..'); const X = require(path.join(ROOT, 'readnow-ext-core.js'));
const shop = (o) => `<html><body><div class="shopname">${o.name || '가게A'}<span class="usedseller_label_${o.pro ? 'pro' : 'gold'}">${o.pro ? '전문셀러' : '골드셀러'}</span></div>
<div>전체상품 (${o.items || '12,345'})</div>
<div id="guide_GoodPoint"><table><tr><th>기간</th><th>평점</th><th>평가수</th><th>만족</th><th>보통</th><th>불만족</th></tr>
<tr><td>최근 6개월</td><td>${o.r6 === '-' ? '-' : '91.5%'}</td><td>${o.r6 || '120'}</td><td>110</td><td>5</td><td>5</td></tr><tr><td>전체 기간</td><td>90.0%</td><td>300</td><td>270</td><td>15</td><td>15</td></tr></table></div>
<div id="guide_OutStockCancelRate">품절 취소율 최근 3개월 ${o.cancel || '2.5'}%</div>
${o.pro ? '<div id="sellerInfoLayer"><ul class="seller_infolayer_list"><li><span class="left">상호/대표자</span><span class="right">업체A, 대표A</span></li><li><span class="left">전화번호</span><span class="right">010-0000-0000</span></li></ul></div>' : '<div id="sellerInfoLayer"><p>최근 7일 내 거래 고객에게만 연락처 제공</p></div>'}</body></html>`;

(async () => {
  const src = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8'); const i0 = src.indexOf('let sshAt = 0;'); const i1 = src.indexOf('/* 끝: 판매자 숍 요약 다시 읽기 */'); ok(i0 > 0 && i1 > i0, '클라우드에 sellerShopTick 있음');
  ok(/\/\* 끝: 판매자 숍 요약 다시 읽기 \*\/\nsetInterval\(\(\) => \{ sellerShopTick\(\)/.test(src), '3분마다 스스로 돎(회차에 기대지 않음)');
  const page = (status, text, url) => ({ ok: status >= 200 && status < 300, status, url: url || 'https://www.aladin.co.kr/shop/usedshop/wshopitem.aspx', headers: { get: () => 'text/html; charset=utf-8' }, arrayBuffer: async () => Buffer.from(text, 'utf8') });
  const sdpDec = (buf) => Buffer.from(buf).toString('utf8');
  const get = (o, k) => k.split('.').reduce((a, x) => (a == null ? a : a[x]), o);
  const mkFS = () => { const D = {}; const col = (n) => (D[n] = D[n] || {}); const cp = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v))); let reads = 0;
    const Q = (n, fl, lim) => ({ where: (k, op, v) => Q(n, [...fl, [k, op, v]], lim), select: () => Q(n, fl, lim), limit: (x) => Q(n, fl, x), get: async () => { const L = Object.entries(col(n)).filter(([, v]) => fl.every(([k, op, x]) => { const a = get(v, k); return a != null && (op === '==' ? a === x : true); })).slice(0, lim || 1e9); const docs = L.map(([id, v]) => ({ id, exists: true, data: () => cp(v) })); return { docs, size: docs.length, forEach: (f) => docs.forEach(f) }; } });
    const merge = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) { if (v && v.__rm) { o[k] = (o[k] || []).filter((x) => !v.__rm.includes(x)); continue; } o[k] = v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) ? merge(o[k], v) : v; } return o; }; /* Firestore set merge는 안쪽 칸까지 합침 */
    const C = (n) => ({ ...Q(n, [], 0), doc: (id) => ({ get: async () => { reads++; return { exists: !!col(n)[id], data: () => cp(col(n)[id]) }; }, set: async (v, o) => { const v2 = JSON.parse(JSON.stringify(v, (k, x) => (x && x.__rm ? { __rm: x.__rm } : x))); col(n)[id] = o && o.merge ? merge(col(n)[id], v2) : v2; } }) });
    return { D, C, reads: () => reads }; };
  const FV = { arrayRemove: (...x) => ({ __rm: x.map(String) }) }; const W = () => ({ writer: 'cloud', writerSchema: 6 });
  const run = async (FS, site, force = true) => { const calls = []; const logs = [];
    const f = new Function('C', 'extMod', 'fetch', 'nowIso', 'log', 'sleep', 'UA', 'W', 'FV', 'sdpDec', src.slice(i0, i1) + '\nreturn { sellerShopTick, sshSumOf, sshList };')(FS.C, async () => X, async (u) => { calls.push(String(u)); return site(u); }, () => new Date().toISOString(), (...m) => logs.push(m.join(' ')), async () => {}, 'UA', W, FV, sdpDec);
    const out = await f.sellerShopTick(force); return { out, calls, logs, f }; };
  const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); const old = '2026-10-01T00:00:00.000Z';

  console.log('① 숍 화면 → 칸');
  { const { f } = await run(mkFS(), () => page(200, ''), true); const S1 = f.sshSumOf(X, shop({ pro: true }));
    ok(S1.status === 'ok' && S1.rev6m === 120 && S1.total === 300 && S1.grade === '전문셀러' && S1.isPro === true && S1.cancel3m === 0.025 && S1.items === 12345 && S1.info && S1.periods['최근 6개월'].rating === 0.915, '6개월 평가 수·전체 평가·등급·품절 취소율·상품 수·판매자 정보', S1);
    const S2 = f.sshSumOf(X, shop({ r6: '-' })); ok(S2.status === 'lt3' && S2.rev6m == null && S2.rev6mLt3 === true && S2.infoNote, "6개월 '-'(3건 미만) → lt3 · 개인셀러 안내 글", S2);
    ok(f.sshSumOf(X, '<p>다른 화면</p>').status === 'missing', '표가 없으면 missing'); }

  console.log('② 클라우드 회차');
  const F1 = mkFS(); F1.D.app_settings = { seller_queue: { sc: ['9000005'] }, seller_shop_state: { tickMax: 3 } };
  F1.D.sellers = { sc_9000001: { sc: '9000001', rev6m: 5, rev6mAt: old, totalItems: 777, source: 'tooltip' }, sc_9000002: { sc: '9000002', rev6m: 900, rev6mAt: old }, sc_9000003: { sc: '9000003', rev6m: 50, rev6mAt: new Date().toISOString() }, sc_996008: { sc: '996008', rev6m: 9999 }, sc_9000004: { sc: '9000004', rev6m: 1 } };
  const R1 = await run(F1, (u) => page(200, shop({ pro: /9000002/.test(u), items: /9000002/.test(u) ? '4,321' : '12,345' })));
  const st1 = F1.D.app_settings.seller_shop_state;
  ok(st1.listDay === day && st1.list.join() === '9000005,9000002,9000001,9000004' && st1.queueN === 1, '목록: 모으기 줄 먼저 → 활동 큰 판매자 → … · 새로 읽은 곳·우리 숍 뺌', st1.list);
  ok(R1.calls.length === 3 && R1.calls.every((u) => /^https:\/\/www\.aladin\.co\.kr\/shop\/usedshop\/wshopitem\.aspx\?SC=\d+$/.test(u)) && !R1.calls.some((u) => /996008|login|scm|account/i.test(u)), '한 회차 tickMax(3)화면 · 공개 가게 첫 화면만(로그인·우리 숍·관리 화면 없음)', R1.calls);
  const s2 = F1.D.sellers.sc_9000002; ok(s2.rev6m === 120 && s2.rev6mBy === 'cloud' && s2.shopItems === 4321 && s2.shopItemsAt && s2.aladinGrade === '전문셀러' && s2.cancel3m === 0.025 && s2.shopSig && s2.bizInfo && s2.writer === 'cloud', '판매자 문서: 로거와 같은 칸 + 상품 수(shopItems) · 누가(cloud)', s2);
  const s1 = F1.D.sellers.sc_9000001; ok(s1.totalItems === 777 && s1.shopItems === 12345, '옛 툴팁 상품 수(totalItems)는 덮지 않음 — 새 값은 shopItems', { t: s1.totalItems, s: s1.shopItems });
  ok(F1.D.seller_rev6m.sc_9000002.days[day] === 120 && F1.D.seller_rev6m.sc_9000002.items[day] === 4321, '날짜별로 쌓음(6개월 평가 수·상품 수)', F1.D.seller_rev6m.sc_9000002);
  ok(Object.keys(F1.D.seller_history).length === 3 && Object.values(F1.D.seller_history).every((h) => h.kind === 'shopSummary' && h.by === 'cloud'), '처음 읽음(바뀜) → seller_history에 그 판 보관', Object.keys(F1.D.seller_history));
  ok(F1.D.app_settings.seller_queue.sc.length === 0 && F1.D.sellers.sc_9000005 && F1.D.sellers.sc_9000005.rev6m === 120, '모으기 줄 판매자는 기록을 만들고 줄에서 뺌', F1.D.app_settings.seller_queue);
  ok(st1.n === 3 && st1.pos === 3 && st1.day === day && st1.sum.got === 3, '하루 쓴 화면 수·자리·오늘 합', { n: st1.n, pos: st1.pos, sum: st1.sum });
  // 둘째 회차: 남은 하나 · 같은 내용이면 이력 안 늘림
  F1.D.sellers.sc_9000004.rev6mAt = new Date().toISOString(); /* 그사이 로거가 읽음 */
  const R2 = await run(F1, (u) => page(200, shop({}))); ok(R2.calls.length === 0 && F1.D.app_settings.seller_shop_state.sum.skip === 1 && F1.D.app_settings.seller_shop_state.pos === 4, '그사이 다른 곳이 새로 읽은 판매자는 건너뜀(화면 안 씀)', F1.D.app_settings.seller_shop_state.lastTick);
  const R3 = await run(F1, (u) => page(200, shop({}))); ok(R3.out === null && R3.calls.length === 0, '오늘 목록 다 읽으면 내일까지 쉼(판매자 표를 다시 훑지 않음)');
  // 같은 판매자 다시(이력 늘지 않음 · 상품 수 바뀌면 늘어남)
  F1.D.app_settings.seller_shop_state = { tickMax: 2 }; F1.D.sellers.sc_9000001.rev6mAt = old; F1.D.sellers.sc_9000002.rev6mAt = old; F1.D.sellers.sc_9000005.rev6mAt = new Date().toISOString(); F1.D.sellers.sc_9000004.rev6mAt = new Date().toISOString();
  const h0 = Object.keys(F1.D.seller_history).length; await run(F1, (u) => page(200, shop({ pro: /9000002/.test(u), items: /9000002/.test(u) ? '4,321' : '20,000' })));
  ok(Object.keys(F1.D.seller_history).length === h0 + 1 && Object.values(F1.D.seller_history).some((h) => h.sellerId === 'sc_9000001' && h.items === 20000 && h.prevItems === 12345), '같은 내용이면 이력 그대로 · 상품 수만 바뀌어도 그 판 보관(앞 값과 함께)', Object.keys(F1.D.seller_history).length - h0);
  // 하루 상한
  const F2 = mkFS(); F2.D.app_settings = { seller_shop_state: { cap: 2, day, n: 2, listDay: day, list: ['9000001'], pos: 0 } }; F2.D.sellers = { sc_9000001: { sc: '9000001', rev6mAt: old } };
  const R4 = await run(F2, () => page(200, shop({}))); ok(R4.calls.length === 0 && !F2.D.sellers.sc_9000001.rev6m, '하루 상한(cap) 다 쓰면 읽지 않음');
  // 막힘
  const F3 = mkFS(); F3.D.app_settings = { seller_shop_state: {} }; F3.D.sellers = { sc_9000001: { sc: '9000001', rev6m: 7, rev6mAt: old }, sc_9000002: { sc: '9000002', rev6mAt: old } };
  const R5 = await run(F3, () => page(429, 'too many requests')); const st3 = F3.D.app_settings.seller_shop_state;
  ok(R5.calls.length === 1 && Date.parse(st3.stopUntil) > Date.now() + 5 * 3600e3 && /429/.test(st3.stopWhy) && F3.D.sellers.sc_9000001.rev6m === 7 && F3.D.sellers.sc_9000001.rev6mAt === old, '429면 6시간 멈춤 · 기록 덮지 않음', st3.stopWhy);
  const R6 = await run(F3, () => page(200, shop({}))); ok(R6.calls.length === 0 && R6.out && /멈춤/.test(R6.out.stop), '멈춘 동안 읽지 않음');
  const F3b = mkFS(); F3b.D.app_settings = { seller_shop_state: {} }; F3b.D.sellers = { sc_9000001: { sc: '9000001', rev6m: 7, rev6mAt: old } };
  await run(F3b, () => page(200, '<p>점검 중</p>')); ok(F3b.D.sellers.sc_9000001.rev6m === 7 && F3b.D.sellers.sc_9000001.rev6mTriedBy === 'cloud' && F3b.D.app_settings.seller_shop_state.sum.miss === 1, '표 없는 화면 → 시도 시각만(값 안 덮음)');
  await run(F3b, () => page(200, shop({}), 'https://www.aladin.co.kr/login/wlogin.aspx')); ok(F3b.D.sellers.sc_9000001.rev6m === 7, '로그인 화면으로 넘어가면 읽지 않음');
  const F4 = mkFS(); F4.D.app_settings = { seller_shop_state: { on: false } }; F4.D.sellers = { sc_9000001: { sc: '9000001', rev6mAt: old } }; const R7 = await run(F4, () => page(200, shop({}))); ok(R7.out === null && R7.calls.length === 0, '끄기(on:false)');
  // 출고 마감 쉼(force 아님 · 시각 고정 대신 quiet를 지금 시각 둘레로)
  { const hm = new Date(Date.now() + 9 * 3600e3).toISOString().slice(11, 16); const F5 = mkFS(); F5.D.app_settings = { seller_shop_state: { quiet: ['00:00', '23:59'] } }; F5.D.sellers = { sc_9000001: { sc: '9000001', rev6mAt: old } };
    const R8 = await run(F5, () => page(200, shop({})), false); ok(hm >= '23:59' || (R8.out === null && R8.calls.length === 0), '쉬는 시간(quiet · 기본 출고 마감 12:30~14:10)엔 읽지 않음'); }

  console.log('③ 로거 6개월 평가 수 — 이미 새로 읽힌 판매자 건너뜀(두 파일 같은 글자)');
  for (const f of ['src/readnow-collector.src.js', 'readnow-pc-products.js']) { const p = [path.join(ROOT, f), path.join(ROOT, '..', f)].find((x) => fs.existsSync(x)); if (!p) { ok(true, f + ' 없음(빌드 자리) — 건너뜀'); continue; } const s = fs.readFileSync(p, 'utf8');
    ok(/let sPre = null; if \(mode !== 'all'\) \{ const sd0 = await C\('sellers'\)\.doc\(id\)\.get\(\)[^\n]*sPre\.rev6mAt && Date\.now\(\) - Date\.parse\(sPre\.rev6mAt\) < Math\.max\(1, SET\.rev6mDays \|\| 7\) \* 864e5\) \{ prog\.skipFresh = [^\n]*continue; \} \}/.test(s) && /const sd = sPre \? null : \(await C\('sellers'\)\.doc\(id\)\.get\(\)\.catch\(\(\) => null\)\); const sPrev = sPre \|\| /.test(s), f + ': 화면 열기 전에 판매자 문서를 한 번 읽어 새로 읽힌 곳은 건너뜀 · 그 문서를 sPrev로 다시 씀'); }

  console.log('④ 진단 S 표 — 끝에 칸 셋(앞 칸 차례 그대로)');
  ok(/'totalItems', 'reviewStats', 'shopItems', 'rev6mAt', 'rev6mBy'\)\.get\(\)/.test(src) && /v\.totalItems \?\? null, \(v\.reviewStats && v\.reviewStats\.d180\) \?\? null, v\.shopItems \?\? null, v\.rev6mAt \|\| null, v\.rev6mBy \|\| null\]/.test(src), '[14] 상품 수 · [15] 읽은 시각 · [16] 누가');

  console.log(bad ? `❌ tSELSHOP1111 실패 ${bad}` : '✓ tSELSHOP1111 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e); process.exit(1); });

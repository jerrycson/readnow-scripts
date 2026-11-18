// tY24LOW1118 — (y24low1 11/18 · F57 · 발견 f_261118_y24mkt_used_miss) 예스24 🤖 자동 올림 지킴 둘
//   ① 알라딘 값이 ⚙ 「값 경고」(lowWon · 기본 1,000원) 미만인 책은 자동 후보(판매중 전부·처음 한 건)에서 뺌 · 「🟦 예스24도」로 사람이 고른 줄은 그대로 · 0 = 끔
//   ② 「우리뿐」(예스24 중고에 이 책 없음) 판정 전에 확인 — 검색 결과 화면이 아니면(첫 화면으로 넘어감) 「없음」으로 적지 않음 · 확인 안 된 옛 「없음」은 +% 대신 알라딘 값 그대로·사람 확인 · 허브 첫 쪽이 있으면 첫 쪽이 먼저 · 다른 근거(중고샵 모음·다른 판매자 값)가 보이면 우리뿐 아님
// 실행: node src/tests/tY24LOW1118.js · 시험 자료에 손님 정보 없음(가짜 ISBN·가짜 상품)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x !== undefined ? JSON.stringify(x).slice(0, 400) : ''); } else console.log('  ✓', m); };
const ROOT = [path.resolve(__dirname, '..', '..'), path.resolve(__dirname, '..')].find((d) => fs.existsSync(path.join(d, 'readnow-ext-core.js')));
const APP = process.env.RN_APP || path.join(ROOT, 'src', 'app.html');
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i + 1); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const X = require(path.join(ROOT, 'readnow-ext-core.js'));
const CL = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8'); const YA = fs.readFileSync(path.join(ROOT, 'cloud', 'y24auto.js'), 'utf8');

console.log('① 자동 후보에서 알라딘 1,000원 미만 책 빼기(y24AutoCand)');
const F = new Function(cut('/* ◆y24reg 시작', '/* ◆y24reg 끝 */') + '\nreturn { Y24R_DEF, y24RegCfg, y24AutoCand };')();
const row = (id, al, o) => ({ k: 'ok', lid: id, want: (o && o.want) || null, row: { lid: id, isbn: '97889000001' + id.slice(-2), grade: '상', alPrice: al, price: al, val: { mode: 'solo' }, skus: ['S' + id], self: 'S' + id } });
const rows = [row('L01', 90), row('L02', 110), row('L03', 5000), row('L04', 999), row('L05', 1000), row('L06', 90, { want: { on: 1 } })];
const has = () => true; const go = () => false;
const cfg = F.y24RegCfg({ autoAll: 1 }); ok(cfg.lowWon === 1000, '기본 lowWon 1,000원', cfg.lowWon);
const all = F.y24AutoCand(rows, cfg, 1, go, has).map((r) => r.lid);
ok(!all.includes('L01') && !all.includes('L02') && !all.includes('L04'), '판매중 전부(autoAll) — 90·110·999원 책은 저절로 고르지 않음', all);
ok(all.includes('L03') && all.includes('L05'), '1,000원 이상(1,000원 포함)은 그대로 후보', all);
ok(all.includes('L06'), '「🟦 예스24도」로 사람이 고른 90원 책은 그대로 후보(손으로 고르면 올릴 수 있음)', all);
const first = F.y24AutoCand(rows.filter((r) => !r.want), F.y24RegCfg({ autoAll: 0, firstAny: 1 }), 0, go, has);
ok(first.length && first.every((r) => r.alPrice >= 1000) && first[0].lid === 'L05', '처음 한 건(firstAny) — 값 싼 것부터지만 1,000원 미만은 건너뜀(첫 후보 = 1,000원 책)', first.map((r) => [r.lid, r.alPrice]));
const first2 = F.y24AutoCand([row('L01', 90), row('L02', 110)], F.y24RegCfg({ autoAll: 0, firstAny: 1 }), 0, go, has);
ok(first2.length === 0, '싼 책만 있으면 처음 한 건도 고르지 않음(0건)', first2.map((r) => r.lid));
const off = F.y24AutoCand(rows, F.y24RegCfg({ autoAll: 1, lowWon: 0 }), 1, go, has).map((r) => r.lid);
ok(off.includes('L01') && off.includes('L02'), '⚙ 값 경고 0 = 끔 → 예전처럼 모두 후보', off);
const w500 = F.y24AutoCand(rows, F.y24RegCfg({ autoAll: 1, lowWon: 100 }), 1, go, has).map((r) => r.lid);
ok(!w500.includes('L01') && w500.includes('L02'), '⚙ 기준을 100원으로 바꾸면 90원만 빠짐', w500);
ok(/const lowA = \(x\) => lowW > 0 && !W\.has\(x\.l\.id\) && x\.L\.price > 0 && x\.L\.price < lowW/.test(YA) && /ok0\.filter\(\(x\) => !lowA\(x\)\)\.sort/.test(YA), '클라우드 자동 올림 — 시장 지표 받을 60권도 싼 책으로 채우지 않음(같은 기준)');
ok(/자동 올림\(판매중 전부·처음 한 건\)은 이 책을 고르지 않음/.test(T) && !/표시만 · 올리기는 막지 않음/.test(T), '⚙ 값 경고 안내 글이 새 동작(자동은 안 고름 · 손으로는 됨)을 말함');

console.log('② 「우리뿐」 판정 지킴(y24PriceOf · y24SearchSeen)');
ok(X.VERSION >= '0.6.26' && typeof X.y24SearchSeen === 'function', '공용 파일 0.6.26 · y24SearchSeen 내보냄', X.VERSION);
const L = { alPrice: 8000, grade: '상' };
const old = X.y24PriceOf(L, { none: true });
ok(old.mode === 'noData' && old.price === 8000 && old.chk && old.noneBad, '확인 안 된 옛 「없음」(noneHow 없음) → 우리뿐 +20% 대신 알라딘 값 그대로 · 사람 확인', old);
const L90 = X.y24PriceOf({ alPrice: 90, grade: '상' }, { none: true });
ok(L90.mode === 'noData' && L90.price !== 110, '11/18 두 책 꼴(알라딘 90원 · 옛 「없음」) → 110원(우리뿐 +20%)으로 정하지 않음', L90);
const sure = X.y24PriceOf(L, { none: true, noneHow: 'search' });
ok(sure.mode === 'solo' && sure.price === 9600, '검색 결과 화면을 확인한 「없음」(noneHow search) → 우리뿐 +20% 그대로(9,600)', sure);
const hubRow = { r: 1, id: '7001', g: '상', p: 3000, s: 0, sid: 'other1', fk: { lv: 'real', p: 0.1 } };
const p1 = X.y24PriceOf(L, { none: true, noneHow: 'search', page1: [hubRow], total: 1, full: true });
ok(p1.mode !== 'solo' && p1.n && p1.n.all === 1, '허브 첫 쪽에 다른 판매자가 있으면 옛 「없음」 표시보다 첫 쪽이 먼저(우리뿐 아님)', p1);
const used = X.y24PriceOf(L, { none: true, noneHow: 'search' }, { used: { n: 1, min: 3000, src: '예스24 중고샵 모음' } });
ok(used.mode === 'noData' && used.price === 8000 && /다른 매물 1개/.test(used.why.join(' ')), '다른 근거(중고샵 모음 1개 · 3,000원)가 보이면 「없음」이어도 우리뿐으로 정하지 않음', used);
const used2 = X.y24PriceOf(L, { page1: [{ r: 1, id: '1', g: '상', p: 9000, sid: 'jerrycson', fk: { lv: 'own' } }], total: 1 }, { used: { n: 2, src: '다른 판매자 값' } });
ok(used2.mode === 'noData' && used2.chk, '첫 쪽엔 우리 매물뿐이어도 다른 근거에 매물이 보이면 우리뿐 아님', used2);
const own = X.y24PriceOf(L, { page1: [{ r: 1, id: '1', g: '상', p: 9000, sid: 'jerrycson', fk: { lv: 'own' } }], total: 1 });
ok(own.mode === 'solo', '다른 근거가 없고 첫 쪽이 우리 매물뿐이면 예전처럼 우리뿐', own);
const S1 = X.y24SearchSeen('<html><title>예스24</title>첫 화면</html>', 'https://www.yes24.com/Main/default.aspx', '9788900000011');
ok(!S1.ok && /넘어감/.test(S1.why), '첫 화면으로 넘어간 검색 → 확인 못 함(없음으로 적지 않음)', S1);
const S2 = X.y24SearchSeen('<html>검색 결과 없음</html>', 'https://www.yes24.com/product/search?domain=USED_GOODS&query=9788900000011', '9788900000011');
ok(!S2.ok, '검색 주소여도 화면에 물은 ISBN이 없으면 확인 못 함', S2);
const S3 = X.y24SearchSeen('<input value="9788900000011"> 검색 결과가 없습니다', 'https://www.yes24.com/product/search?domain=USED_GOODS&query=9788900000011&page=1', '9788900000011');
ok(S3.ok, '검색 주소 그대로 + 물은 ISBN이 보이는 화면 → 확인한 검색 결과(이때만 「없음」)', S3);
ok(!X.y24SearchSeen('', 'https://www.yes24.com/product/search?query=1', '1').ok, '빈 화면 → 확인 못 함');

console.log('③ 클라우드 시장 지표 읽기(y24MktTick) 꼴');
const tick = CL.slice(CL.indexOf('async function y24MktTick()'), CL.indexOf('async function fin()', CL.indexOf('async function y24MktTick()')));
ok(/async function y24HubKnown\(isbn\)/.test(CL) && /C\('y24_listings'\)\.where\('isbn13', '==', String\(isbn\)\)\.select\('masterNo'\)/.test(CL) && /yes24used/.test(CL.slice(CL.indexOf('async function y24HubKnown'), CL.indexOf('async function y24MktTick'))), '허브 번호를 검색보다 먼저 이미 아는 기록에서(우리 예스24 매물 masterNo · 바깥 중고 기록 yes24used)');
ok(/const K = await y24HubKnown\(isbn\)/.test(tick) && tick.indexOf('y24HubKnown(isbn)') < tick.indexOf('X.y24SearchUrl(isbn)'), 'y24MktTick이 검색 전에 y24HubKnown을 부름');
ok(/X\.y24SearchSeen\(H0, lastU, isbn\)/.test(tick) && /lastU = \(r && r\.url\) \|\| u/.test(tick), '검색 화면 확인에 최종 주소(넘겨졌으면 넘어간 곳)를 씀');
const noneSets = tick.match(/none: true[^}]*}/g) || [];
ok(noneSets.length === 1 && /noneHow: 'search'/.test(noneSets[0]), '「없음(none: true)」은 한 곳에서만 · 언제나 noneHow search와 함께', noneSets);
ok(/none: null, noneHow: null, noneTry: at, err: m/.test(tick), '검색 화면이 아니면 「못 읽음」(none 지움 · 까닭 남김)');
ok(/err: null, none: false, noneHow: null, req:/.test(tick), '허브를 읽으면 옛 「없음」을 지움(예전엔 merge라 none:true가 남아 우리뿐으로 셈)');
ok(/why: 'noneFix'/.test(tick) && /where\('none', '==', true\)/.test(tick) && tick.indexOf("why: 'noneFix'") < tick.indexOf("why: 'old'"), '확인 안 된 옛 「없음」 기록을 오래된 책보다 먼저 다시 읽음');
ok(/prev\.none && !prev\.noneHow \? \{ none: null, noneTry: at \}/.test(tick), '다시 읽다 오류가 나도 확인 안 된 옛 「없음」은 지움(우리뿐 +%로 안 쓰임)');
ok(/noneHow: v\.noneHow \|\| null/.test(YA) && /noneHow: v\.noneHow \|\| null/.test(T), '웹앱·클라우드 자동 올림이 시장 지표를 줄여 담을 때 noneHow를 함께 담음');
ok(!/\balert\(|\bconfirm\(/.test(cut('/* ◆y24reg 시작', '/* ◆y24reg 끝 */')), '브라우저 팝업 0');

console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);

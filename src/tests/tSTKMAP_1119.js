// tSTKMAP — (11/18 정범님 I-1118-2245-28.4 판 ①) 📦 재고 품목 「없어진 것 0」: 설계 §1 대응표 15줄마다 새 자리에서 기능이 살아 있는지 확인(기능이 사라지면 여기서 잡힘)
// 실행: node tSTKMAP_1119.js · 화면 소스(openStockView)와 탭 덩어리를 글로 확인
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const a = T.indexOf('function openStockView(keep)'); if (a < 0) throw new Error('openStockView 못 찾음'); const b = T.indexOf('\nfunction ', a + 20); const V = T.slice(a, b < 0 ? a + 40000 : b);
const a0 = T.indexOf('/* ◆stktab 시작'); const TAB = T.slice(a0, T.indexOf('/* ◆stktab 끝 */', a0));
const has = (re) => re.test(V);
ok(has(/id="stk_q"/) && has(/qi\.oninput[^;]*STK\.q = qi\.value/) && has(/setTimeout\([^]*?250\)/) && has(/skuOfL\(r\.l\)/), '1 찾기: 찾기 칸·제목/ISBN/U코드/관리코드/SKU·250ms 늦춤');
ok(has(/chip\('ch', 'aladin'/) && has(/chip\('ch', 'yes24'/) && has(/chip\('ch', 'both'/) && has(/stkYRows\(\)/) && has(/stkAlRows\(\)/), '2 채널: 알라딘·예스24·둘 다 등록');
ok(/\['on', '판매중'/.test(TAB) && /\['pause', '일시판매중지'/.test(TAB) && has(/data-stktab/) && has(/stkTabBar\(STK\.tab, TC/), '3 상태: 전체·판매중·일시판매중지 탭 + 수');
ok(/\['pend', '⏳ 반영 대기'/.test(TAB) && has(/pend: stkPend/) && has(/stkPendHtml\(l\)/), '4 처리: ⏳ 반영 대기 탭 · 꼬리표 stkPendHtml');
ok(/\['px', '👀 조회수'/.test(TAB) && has(/px: pxMark/) && has(/STK\.tab === 'px'[^]{0,120}data-pxopen="1"/), '5 조회수: 👀 조회수 탭 · 「조회수 분석 ›」 단추');
ok(has(/거르기 · 구분[^`]*chip\('grp'/) && has(/거르기 · 분야[^`]*chip\('fld'/) && has(/slice\(0, 40\)/) && has(/stkCat|r\.c\.g/), '6 구분·분야: 「거르기」 줄(구분·분야 칩 · 분야 40개 한도)');
ok(has(/const SO = \{ new:[^}]*price:[^}]*title:[^}]*code:[^}]*qty:/) && has(/STK\.dir = -STK\.dir/), '7 정렬 5종(등록 최신·판매가·제목·관리코드·수량) · 다시 누르면 반대');
ok(/\['grp', '🗂 그룹'/.test(TAB) && has(/data-stkg="/) && has(/data-stkgm/) && has(/data-stkgnew/) && has(/data-stkgput/) && has(/data-stkgadd="1"/) && has(/data-stkgren/) && has(/data-stkgdel/) && has(/data-stkgrm1/) && has(/data-stkgadd1/) && has(/data-stkgsel/) && has(/stkGSet\(/) && has(/stkGAdd\(/), '8 그룹: 그룹 탭 · 만들기·넣기·더하기·이름·지우기(두 번)·빼기');
ok(has(/data-stkdel1/) && has(/prdDel1Twice\(/) && has(/data-stkdel="1"/) && has(/data-stkall/) && has(/data-stkgo/) && has(/prdDelReview\('__prd'/) && has(/ux2TwMove\(/), '9 삭제: 카드 🗑 두 번 · 삭제 고르기 → 모두 고르기 → 삭제 검토');
ok(has(/bt-sum/) && has(/isTestL\(r\.l\)/) && has(/시험 \$\{num\(nTst\)\}개 뺌/) && has(/합계/) && has(/판매가 합/), '10 합계 줄: 개수·수량·판매가 합 · 🧪 시험 뺌 · 탭 이름 붙은 합계');
ok(has(/prodCard2\(l\)/) && has(/probPin\(/) && has(/data-y24pid/), '11 카드: prodCard2 · 문제 상품 맨 위 · 예스24 카드');
ok(has(/STK\.lim \+= 60/) && has(/R\.slice\(0, STK\.lim\)/), '12 60개씩 더 보기');
ok(has(/openProduct\(b\.dataset\.pid\)/) && has(/openY24Product\(/), '13 카드 누르면 상품 상세');
ok(/prodCard2/.test(V) && has(/stkPendHtml\(l\)/) && /function prdDelBadge|const prdDelBadge|prdDelBadge\s*=/.test(T), '14 삭제 배지·진행 칩은 카드 안에 그대로(prodCard2 · prdDelBadge)');
ok(has(/pcUiPrefetch\(sh/) && has(/ckRun\(\)/), '15 미리 받기·점검');
console.log('16 탭 기억·옛 진입로');
ok(/rn-stk-tab/.test(TAB) && has(/stkTabMem\(k\)/), '탭을 기기에 기억');
ok(/STK\.tab = 'pend'/.test(T) && !/STK\.pd = 'pend'; openStockView/.test(T), '기능 찾기 「반영 대기」 안내는 탭으로 들어감');
console.log(bad ? '❌ ' + bad + '개 없어짐' : '✓ tSTKMAP_1119 통과 — 15줄 모두 살아 있음 (없어진 것 0)'); process.exit(bad ? 1 : 0);

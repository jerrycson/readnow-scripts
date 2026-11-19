/* readnow-pricing-core.js — 판매가 자동 결정(판정 엔진) 핵심 계산
 * 순수 함수만 둔다 (저장·네트워크·화면 없음). 같은 입력이면 항상 같은 출력.
 * 수집기(Tampermonkey)·웹앱·나중의 PC 작업 엔진·클라우드(Cloud Run)가 모두 이 파일 하나로 같은 판정을 낸다.
 *
 * 입력 4가지
 *   listing : 우리 상품 1개 (prd_listings 문서 + 매입원가)
 *   market  : 그 책의 온라인 중고 목록 관측 (parseUsedPage 결과를 쪽 순서대로 이어 붙인 것 + 관측 시각 정보)
 *   sellers : Firestore sellers 문서 그대로 (키 = 'sc_번호'). 분류는 readnow-core.js classifySellerDoc 한 곳의 기준 (이 파일에 복사본 없음)
 *   ctx     : 지금 시각·우리 배송비 정책·운영 비용·추격자 상태·설정
 * 출력 : decide() → 판정 1건 (추천가·적용 규칙·근거·자동 적용 가능 여부·막힌 이유)
 *
 * 원칙 (정범과 합의한 것)
 *   - 판매자 분류(유효·노랑·주황·무효)는 '판매가 기준점을 믿어도 되는가'의 분류. 지금은 판매자 기준, 자료가 쌓이면 상품 기준으로 교체(ctx.classify)
 *   - 재고 기간은 '최저가 등록 기간'(우리가 최저가 자리를 지킨 날수)으로 잼. 측정 전 상품은 등록 후 일수로 임시 판정하되 T3까지만
 *   - 유효 상품 = 유효 판매자(초록·짙은 초록) + 알라딘측. 노랑·주황·빨강은 기본 무시, 재고 기간이 길어지면 노랑→주황 순으로 포함. 빨강은 절대 기준이 아님
 *   - 비교는 목록 첫 페이지만. 단 특별판 키워드가 제목에 있으면 첫 페이지 조건 제외(뒤쪽 쪽까지 봄). 비교 대상 없으면 관리자 대기열
 *   - 목표는 유효 최저가와 '정확히' 동가 → 기준 상품이 목록 맨 위면 그대로 동가, 아니면 배송비 차이를 반영해 구매자에게 1~5% 이점
 *   - 가격 단위 = 가격대의 5% (100원대 5원, 1,000원대 50원, 10,000원대 500원). 상대 가격과 정확히 같게 맞출 때만 단위 예외
 *   - 하한선은 알라딘 매입가 하나뿐. 목표가가 그 하한가보다 10% 넘게 낮을 때만 멈춤 (원가 하한선 없음)
 *   - 알라딘 반영 지연(대부분 24시간 내) → 새로 나타난 싼 매물·사라진 매물·우리 가격 변경은 24시간 지나 확정된 뒤에 판단
 *   - 일시판매중지는 우리 전용 보관함: 관리코드 뒤 3자리로 구분 — PND = 판매보류풀(가격상승대기), BAD = 불용(4년 초과, 관리자 승인)
 *     (판매중지는 알라딘이 다른 이유로 쓰는 일이 많아 쓰지 않음 · '판매금지'는 알라딘만 정하는 상태)
 */
(function (root) {
  'use strict';
  /* (0.17.22 edall1b) 판본 낱말 한 벌 — 상품 공용(readnow-products-core)이 같은 곳에 있으면 그 목록을 씀(없으면 아래 글자 그대로 · 결과는 같음) */
  const PEd = (() => { try { return root.ReadnowProducts || (typeof require === 'function' ? require('./readnow-products-core.js') : null); } catch (e) { return null; } })();
  const SPECIAL_KW = (PEd && Array.isArray(PEd.ED_KW) && PEd.ED_KW.length ? PEd.ED_KW : ['한정', '특별', '특전', '특장', '기념', '주년', '리커버', '초판', '초회', '교보', '알라딘', '예스24', '밀리의', '인터파크', '텀블벅', '펀딩']).slice();
  const VERSION = '0.17.26'; // (0.17.26 strat6) 🎣 판 ⑨ relDelta — 판매자 움직이는 때(시각·내림 폭·따라 올림·떠난 뒤 올림·사라져 끝남) · 감시기가 chase_rel에 더함 // (0.17.25 strat6) 🧬 판매자 유형 sellerType·SELLER_TYPES·typeAdvice(셈만 · 감시기는 아직 안 읽음) // (0.17.24 engimp1) 💲 값 주인 하나 — 울타리 fence(cur, v, S0, o) 순수 함수(크게 내림·크게 올림·터무니없는 값·하한) · 판정 장부·그림자 도전자가 같은 셈을 씀(정범님 j1118eng3 ⑦) // (0.17.23 판 ③ strat3) 🧭 엔진 규칙 층(부르는 곳 없이 먼저) — ruleNorm·ruleCheck·ruleFor·policyFor·whenPick·ladderPick·ruleFloor·ruleCeil·judgeRule·fastChaserOf(detect.fastLagMin)·기본값(TRY_DEF·FAST_DEF) · 규칙이 없거나 깨지면 judge와 글자까지 같음 · 바닥은 맨 마지막에 올리기만 // (0.17.21 판 서 · ctrlimp3) 🎯 기록 줄에 반응 시간 lag(분) — 추격자가 값을 내린 때 우리 마지막 값 바꿈에서 몇 분 지났나(7일 넘으면 안 셈) // (0.17.20 판 러) 🎛 관제창 설정 기본값(ctrlCfg)을 엔진 쪽으로 옮김 · ⏸ 묶음 자동 멈춤 셈(Ctrl — 원장 내림 합·알림선·멈춤·다시 켬·14일 되짚기) // (0.17.19) (판 카) stratFor 층 둘 더함 — 📌 상품 개별(끔 = 지금 값 유지)·📁 묶음 기본 · 같은 묶음 안 겹침은 주인 그룹 · 옛 입력은 답 그대로 // (0.17.18 memo2) 📝 판단 메모 일곱 길 — 출판사 범위(pub)·엔진이 못 보는 요인(factor: 상태·사은품·계절·희귀)·예외(exc · 엔진이 따로 다룸)·가설 채점(score — 시장 매물·지난 판매만 · 헌장 제43조)·비슷한 상품 메모(similar)·값 바꾼 내력(timeline)·엔진이 틀린 사례(wrongCases) · 메모 앞 엔진 값 out.memo.eng · 정범님 11/19 // (0.17.17 memo1) 📝 판단 메모 엔진 Memo(풀이·찾기·묶음·critTarget 한 겹 — 처리 기준 뒤·하한선 앞 · 낮추는 규칙은 「맞음」 뒤 · 못 알아들은 메모는 저절로 내리지 않음 · 정범님 11/18) // (0.17.16 edkw1) specialKeywords 기본값에 주년·텀블벅·펀딩(판본 낱말 16개 · 정범님 11/17 14:00) // (0.17.15) 🚚 bbCourier(택배 계약 중 그날 적용 줄)·bbWithCourier(매입 판정 재료에 얹기) · bbNetParts 출처 칸 crSrc // (0.17.14) 🏷 매입 후보 순이익(bbNetParts): 택배비 마진(손님 배송비 − 평균 택배비)을 더함·우리 부담이면 뺌(예전엔 마진을 버림 · 하한 셈 sellNet은 그대로) · 칸 pkPer·ship · 우리 매입원가(cost)를 주면 profit·bbProfit(차는 그대로) // (0.17.13) 판매자 가치 판정 스위치(기본 끔)·그림자(기록만) · 예스24 대조에서 시트 빼기 없앰 // (0.17.12) 상태(등급)별 알라딘 매입 조건 표 bbGrRow·bbGrDef(기본값 = 지금 동작) // (0.17.11) 알라딘 매입 등급 밖(중·하) 판단 bbGradeOut · 추격자 전략 고르기 하나 ReadnowChase.stratFor(그룹 개별 > 반자동 조건 묶음 > 전체 · 애매하면 전체) // (0.17.10) 🔬 정밀 점검 11/06 · bbNear 까닭 글(calc)은 처음 읽을 때 만듦(경영 계산·휴대폰 매입 탭이 상품 2.6만 개마다 원 표시 4번 — 느린 함수 1위 self 6.0초·긴 멈춤 41번 46초) · bbW 원 표시를 글자 식으로(같은 결과) // (0.17.9) 🏷 알라딘 매입가 한 곳 — bbValid(정가보다 큰 매입가 무시)·bbPick·bbNetParts·bbNear(매입 후보 판정)·bbFloor(하한 · 기준 차액 넣기는 설정 floorMargin, 기본 끔) // (0.17.8) 하한가로 올리기 전 값 out.preFloor(알라딘 매입 근삿값 표시용 · 판정은 그대로) // (0.17.7) 🚫 빼기 '언제 뺄까'(excl.when · exclLive) // (0.17.6) 🚫 무시 판매자 빼기 설정(excl) · 블랙리스트 기록 // (0.17.5) 🎯 추격자 엔진 ReadnowChase 분리(찾기·정책·고르기·한 걸음·기록) · 지정 판매자 태세 · 불특정 규칙 n회만·되돌아가 2위·그대로 두기 · 옛 chaseStep 그대로 // (0.17.4) 🏝 같은 책 근거 등급 — 확정(우리·장터) 값은 목표 · 사라진 매물 추정은 2건 이상일 때만 · 1건은 참고(정가 9.9배 추천 막음) // (0.17.3) 📐 soloHigh가 시장 전체 팔린 비율(무리별 p75 목표·p95 상한·같은 책 시장 최고값)을 먼저 근거로 · 터무니없는 값 거르기 상한도 무리 p95 // (0.17.2) 🏝 새책 상한 = 우리 결제 총액 ≤ 새책 결제 총액(알라딘 판매가+새책 배송) − 100원(79% 없앰) // (0.17.1) 🤖 추격자 다시 보기 간격 ±15% 흩음(같은 입력이면 같은 값) // (0.17.0) 정범님 10/30 재정의 — ① 터무니없는 값 거르기는 남의 매물만(남의 매물이 3개 미만이면 중앙값 대신 정가·우리 최고 판매 비율로 상한) ② 정가 1.5배 넘는 추천 막기 없앰 ③ 🏝 우리 단독이면 soloHigh로 올릴 근거(같은 책 판매가·우리 판매 비율 분포·상한 = 우리가 받아 본 최고 비율) // (0.16.2) 수동 일괄 기준 critTarget — 터무니없는 첫 쪽 매물 빼기(엔진과 같은 기준) · 정가 1.5배 넘는 추천은 하지 않음(10/30 연계 점검) // (0.16.1) 🕘 임시 기준 끝나는 날 한국 날짜 // (0.16.0) 정범님 10/19: 재고 기간 할인(T2 5~10% … T7 70%)을 없앰 — 우리 판매 자료(10/08~10/18 · 상품·일 17만)로 판매 확률은 등록 30일 뒤 약 1.2~1.5‰로 내려간 뒤 1년까지 거의 그대로이고, 수요 낮은 책은 값을 내려도 판매가 늘지 않음 → 기간에 따라 깎을 근거가 없음 · 오래된 재고의 값은 판매가치 엔진(ml-core valueOf: 수요×자리 · 알라딘 매입 검토)이 맡음 · 단계(T1~T8)는 남김(기준 판매자 색 넓히기·불용 판정에 씀) // (0.15.2) 같은 설정 합치기를 한 번만 — 상품마다 기본 설정 전체를 깊게 복사하던 것(수동 일괄 그룹 6천 개에 30초 넘게 걸림) · 판정 결과는 그대로 // (0.17.22 edall1b) 판본 낱말 한 벌 — specialKeywords 기본값·메모 ED_KW가 상품 공용 목록(ED_KW·ED_ALL)을 받아 씀 // (0.17.21 판 서 · ctrlimp3) 🎯 기록 줄에 반응 시간 lag(분) — 추격자가 값을 내린 때 우리 마지막 값 바꿈에서 몇 분 지났나(7일 넘으면 안 셈) // (0.17.20 판 러) 🎛 관제창 설정 기본값(ctrlCfg)을 엔진 쪽으로 옮김 · ⏸ 묶음 자동 멈춤 셈(Ctrl — 원장 내림 합·알림선·멈춤·다시 켬·14일 되짚기) // (0.17.19) (판 카) stratFor 층 둘 더함 — 📌 상품 개별(끔 = 지금 값 유지)·📁 묶음 기본 · 같은 묶음 안 겹침은 주인 그룹 · 옛 입력은 답 그대로 // (0.17.18 memo2) 📝 판단 메모 일곱 길 — 출판사 범위(pub)·엔진이 못 보는 요인(factor: 상태·사은품·계절·희귀)·예외(exc · 엔진이 따로 다룸)·가설 채점(score — 시장 매물·지난 판매만 · 헌장 제43조)·비슷한 상품 메모(similar)·값 바꾼 내력(timeline)·엔진이 틀린 사례(wrongCases) · 메모 앞 엔진 값 out.memo.eng · 정범님 11/19 // (0.17.17 memo1) 📝 판단 메모 엔진 Memo(풀이·찾기·묶음·critTarget 한 겹 — 처리 기준 뒤·하한선 앞 · 낮추는 규칙은 「맞음」 뒤 · 못 알아들은 메모는 저절로 내리지 않음 · 정범님 11/18) // (0.17.16 edkw1) specialKeywords 기본값에 주년·텀블벅·펀딩(판본 낱말 16개 · 정범님 11/17 14:00) // (0.17.15) 🚚 bbCourier(택배 계약 중 그날 적용 줄)·bbWithCourier(매입 판정 재료에 얹기) · bbNetParts 출처 칸 crSrc // (0.17.14) 🏷 매입 후보 순이익(bbNetParts): 택배비 마진(손님 배송비 − 평균 택배비)을 더함·우리 부담이면 뺌(예전엔 마진을 버림 · 하한 셈 sellNet은 그대로) · 칸 pkPer·ship · 우리 매입원가(cost)를 주면 profit·bbProfit(차는 그대로) // (0.17.13) 판매자 가치 판정 스위치(기본 끔)·그림자(기록만) · 예스24 대조에서 시트 빼기 없앰 // (0.17.12) 상태(등급)별 알라딘 매입 조건 표 bbGrRow·bbGrDef(기본값 = 지금 동작) // (0.17.11) 알라딘 매입 등급 밖(중·하) 판단 bbGradeOut · 추격자 전략 고르기 하나 ReadnowChase.stratFor(그룹 개별 > 반자동 조건 묶음 > 전체 · 애매하면 전체) // (0.17.10) 🔬 정밀 점검 11/06 · bbNear 까닭 글(calc)은 처음 읽을 때 만듦(경영 계산·휴대폰 매입 탭이 상품 2.6만 개마다 원 표시 4번 — 느린 함수 1위 self 6.0초·긴 멈춤 41번 46초) · bbW 원 표시를 글자 식으로(같은 결과) // (0.17.9) 🏷 알라딘 매입가 한 곳 — bbValid(정가보다 큰 매입가 무시)·bbPick·bbNetParts·bbNear(매입 후보 판정)·bbFloor(하한 · 기준 차액 넣기는 설정 floorMargin, 기본 끔) // (0.17.8) 하한가로 올리기 전 값 out.preFloor(알라딘 매입 근삿값 표시용 · 판정은 그대로) // (0.17.7) 🚫 빼기 '언제 뺄까'(excl.when · exclLive) // (0.17.6) 🚫 무시 판매자 빼기 설정(excl) · 블랙리스트 기록 // (0.17.5) 🎯 추격자 엔진 ReadnowChase 분리(찾기·정책·고르기·한 걸음·기록) · 지정 판매자 태세 · 불특정 규칙 n회만·되돌아가 2위·그대로 두기 · 옛 chaseStep 그대로 // (0.17.4) 🏝 같은 책 근거 등급 — 확정(우리·장터) 값은 목표 · 사라진 매물 추정은 2건 이상일 때만 · 1건은 참고(정가 9.9배 추천 막음) // (0.17.3) 📐 soloHigh가 시장 전체 팔린 비율(무리별 p75 목표·p95 상한·같은 책 시장 최고값)을 먼저 근거로 · 터무니없는 값 거르기 상한도 무리 p95 // (0.17.2) 🏝 새책 상한 = 우리 결제 총액 ≤ 새책 결제 총액(알라딘 판매가+새책 배송) − 100원(79% 없앰) // (0.17.1) 🤖 추격자 다시 보기 간격 ±15% 흩음(같은 입력이면 같은 값) // (0.17.0) 정범님 10/30 재정의 — ① 터무니없는 값 거르기는 남의 매물만(남의 매물이 3개 미만이면 중앙값 대신 정가·우리 최고 판매 비율로 상한) ② 정가 1.5배 넘는 추천 막기 없앰 ③ 🏝 우리 단독이면 soloHigh로 올릴 근거(같은 책 판매가·우리 판매 비율 분포·상한 = 우리가 받아 본 최고 비율) // (0.16.2) 수동 일괄 기준 critTarget — 터무니없는 첫 쪽 매물 빼기(엔진과 같은 기준) · 정가 1.5배 넘는 추천은 하지 않음(10/30 연계 점검) // (0.16.1) 🕘 임시 기준 끝나는 날 한국 날짜 // (0.16.0) 정범님 10/19: 재고 기간 할인(T2 5~10% … T7 70%)을 없앰 — 우리 판매 자료(10/08~10/18 · 상품·일 17만)로 판매 확률은 등록 30일 뒤 약 1.2~1.5‰로 내려간 뒤 1년까지 거의 그대로이고, 수요 낮은 책은 값을 내려도 판매가 늘지 않음 → 기간에 따라 깎을 근거가 없음 · 오래된 재고의 값은 판매가치 엔진(ml-core valueOf: 수요×자리 · 알라딘 매입 검토)이 맡음 · 단계(T1~T8)는 남김(기준 판매자 색 넓히기·불용 판정에 씀) // (0.15.2) 같은 설정 합치기를 한 번만 — 상품마다 기본 설정 전체를 깊게 복사하던 것(수동 일괄 그룹 6천 개에 30초 넘게 걸림) · 판정 결과는 그대로

  // ───────────────────────── 기본 설정 (웹앱 설정에서 모두 바꿈) ─────────────────────────
  // 데이터에는 코드(T1~T8)만 저장하고 이름은 화면용 → 이름을 바꿔도 과거 기록이 깨지지 않음
  const DEFAULTS = {
    ourSeller: '996008',
    // 재고 기간 경계(등록 후 일수). 경계 하나만 저장 → 앞뒤 구간이 자동으로 이어짐. 마지막 경계를 넘으면 T8(불용)
    tierBounds: [90, 180, 365, 548, 730, 1095, 1460],
    tiers: {
      T1: { name: '신규 재고', colors: ['dkgreen', 'green'], disc: [0, 0] },
      T2: { name: '정상 재고', colors: ['dkgreen', 'green'], disc: [0, 0] },
      T3: { name: '둔화 재고', colors: ['dkgreen', 'green'], disc: [0, 0] },
      T4: { name: '장기 재고', colors: ['dkgreen', 'green', 'yellow'], disc: [0, 0] },
      T5: { name: '체화 재고', colors: ['dkgreen', 'green', 'yellow'], disc: [0, 0] },
      T6: { name: '부동 재고', colors: ['dkgreen', 'green', 'yellow'], disc: [0, 0] },
      T7: { name: '청산 재고', colors: ['dkgreen', 'green', 'yellow', 'orange'], disc: [0, 0] },
      T8: { name: '불용 재고', colors: [], disc: [0, 0] },
    },
    discPick: 'low', // 범위 중 어느 값을 쓸지: 'low'(작은 할인) / 'high'. 판매 자료가 쌓이면 학습값으로 바꿈
    // 판매자 분류 기준은 이 파일에 없음 → readnow-core.js(1.2.0) sellerBg 한 곳. 못 읽으면 판정하지 않음
    // 재고 기간의 기준 = '최저가 등록 기간'(우리 매물이 최저가 자리를 지킨 날수). 측정 안 된 상품은 임시 기준(등록 후 일수)을 쓰되 tempTierCap 단계까지만
    tempTierCap: 'T3',
    cutoverAt: null,        // 매일 감시를 처음 시작한 날 (한 번 정하면 바꾸지 않음 — prd_system/pricing 에 저장)
    tempSunsetDays: 365,    // 감시 시작 후 이 날수가 지나면 임시 기준은 완전히 꺼짐
    // 적용 단계: A = 적용 1% · 3일 → B = 적용 25% / 비교 25% · 1주 → (확인 후) C = 적용 묶음 안에서 강도 나누기. 비교 묶음은 계속 유지
    // 자동 감시에서 항상 빼는 관리코드 (관리자 확인 필수). KHKDVD = 음반·영상 — 마진 구조가 달라 따로 정할 때까지 무조건 사람 확인
    excludeSku: ['KHKDVD'], excludeUsed: [],
    rollout: { treatPct: 1, controlPct: 0 }, // 실제 적용 비율: 상품코드로 고정 배정(0~99) → 비율을 올려도 이미 들어간 상품은 그대로

    lowestMaxGapHours: 48, // 두 관측 사이가 이보다 길면 그 사이는 최저가 기간에 넣지 않음 (정확히 아는 것만 셈)
    aladinSideNames: ['알라딘 직접 배송', '우주점', '중고매장'],
    gradeCoef: { '최상': 1, '상': 0.95, '중': 0.85 }, // 정범 지정 2026-10-04
    useBetterGrade: true, // 더 좋은 등급 유효 매물도 기준 후보로 (끄면 같은 등급만 — 수동 일괄 처리 그룹에서 바꿀 수 있음)
    buybackGrades: ['최상', '상'], // 알라딘은 '중' 상태를 사지 않음 → 중 상품은 매입가 하한선 없음
    // 첫 페이지 예외 키워드 (제목에 있으면 뒤쪽 쪽까지 봄)
    specialKeywords: SPECIAL_KW.slice(), // (0.17.16 edkw1) 판본 낱말 16개 = readnow-products-core ED_KW와 같게(주년·텀블벅·펀딩 더함)
    specialMaxPages: 10,
    firstTieMaxShipGap: 1000, // 맨 위 매물의 배송비가 우리보다 이만큼 넘게 비싸면 판매가 동가 대신 총액 기준 (배송비로 남기는 판매자에게 마진을 퍼주지 않음)
    advPct: 0,             // 구매자 이점: 기본은 주지 않음(정확히 동가). 정범 지정 2026-10-04
    confirmHours: 24,      // 알라딘 반영 지연: 이 시간 지나야 '확정'
    staleHours: 48,        // 관측이 이보다 오래되면 판정하지 않음
    buybackTolerance: 0.10, // 목표가가 알라딘 매입가 하한가보다 이만큼 이상 낮을 때만 하한가에 멈춤
    feeRate: 0.10,
    packPerOrder: 394,
    courierPerOrder: 2500,
    booksPerOrder: 1,      // 주문당 평균 권수 (실제 주문 자료로 계산해 넣음. 없으면 1 = 가장 보수적)
    insaneMult: 3,         // 다른 매물 중앙값의 3배 초과 = 터무니없는 가격 (웹앱 유효 최저가와 같은 철학)
    insaneListMult: 1.5,   // 정가의 1.5배 초과 = 터무니없는 가격
    queueGapMult: 3,       // 유효 기준이 목록 맨 위(빨강 포함)보다 3배 넘게 비싸면 사람 확인 (판매자 점수로 진짜 싼 매물을 버린 사고 방지)
    // 자동 적용 (L0 = 전부 사람 확인, L1 = 조건 맞는 것만 자동, L2 = 예외만 사람 확인)
    autoLevel: 'L0',
    maxAutoDropPct: 0.30,  // 한 번에 이보다 많이 내리면 사람 확인
    maxAutoRaisePct: 0.50, // 한 번에 이보다 많이 올리면 사람 확인
    autoAllowConverted: false, // 등급 환산으로 만든 기준은 자동 적용 안 함
    // 희소 후보: 우리 말고 유효 판매자 0~1곳 + 전체 판매자 2곳 이하
    rareMaxValid: 1, rareMaxAll: 2,
    // 추격자
    peerUse: false,    // (sv1 11/10) 🧭 true = 비교 매물 판매자 색을 '판매자 가치 무게'(readnow-sellers-core peerW · 엔진 근거 · 옛 시트 표시 안 읽음)로 · 기본 끔(넘기는 기준은 research PEER_W 셈 식)
    peerShadow: true,  // (sv1 11/10) 그림자 — 지금 판정은 그대로 두고 판매자 가치로 한 번 더 판정해 out.peerShadow에 기록만(값·상태 안 바꿈)
    useYes24Proxy: false,  // 예스24 대조로 무효·보류(주황 등) 매물을 경쟁 매물로 올리는 기능 — 관리자 판정 기간에는 끔 (주황이 기준이 되는 일이 없게, 정범 지정 2026-10-04)
    chase: { windowHours: 24, lookbackDays: 7, minEvents: 3, halfLifeDays: 14, releaseDays: 30, sellerMinBooks: 3,
      // (0.10.0) 추격자 양보(방임): 기준 판매자가 추격자면 따라 내리지 않고 그 매물이 팔릴 때까지 기다림 — 다음 유효 매물을 기준으로, 없으면 지금 가격 유지.
      //   우리 재고 기간이 maxTier(기본 T3 = 등록 1년 안)까지만 — 더 오래된 재고는 기다릴 이유가 줄어 원래대로 경쟁. 추격 기록이 releaseDays(30일) 없으면 추격자 표시가 풀려 저절로 끝남
      yield: { on: true, maxTier: 'T3' } },
  };

  const LABEL = { // 한글 사전 (필드명은 영어로 저장)
    dkgreen: '짙은 초록', green: '초록', yellow: '노랑', orange: '주황', red: '빨강', aladin: '알라딘측', proxy: '대행 가능(예스24 대조)',
  };

  // ───────────────────────── 작은 도구 ─────────────────────────
  const HOUR = 3600e3, DAY = 864e5;
  const t = (iso) => { if (iso == null || iso === '') return null; if (typeof iso === 'number') return Number.isFinite(iso) ? iso : null; if (iso instanceof Date) return iso.getTime(); if (typeof iso === 'object') { if (typeof iso.toMillis === 'function') return iso.toMillis(); if (iso.seconds != null) return iso.seconds * 1000 + Math.round((iso.nanoseconds || 0) / 1e6); return null; } const v = Date.parse(String(iso).length === 10 ? iso + 'T00:00:00+09:00' : iso); return Number.isFinite(v) ? v : null; }; /* (0.15.3) Firestore 시각(Timestamp·{seconds})·Date도 · 못 읽으면 null */
  const merge = (a, b) => { const o = JSON.parse(JSON.stringify(a)); for (const k of Object.keys(b || {})) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && o[k] && typeof o[k] === 'object') o[k] = merge(o[k], b[k]); else if (b[k] !== undefined) o[k] = b[k]; } return o; };
  /* (0.15.2) 기본 설정 + 덮어쓸 설정 → 합친 설정을 내용(글자)마다 한 번만 만듦. 합친 설정은 엔진 안에서 읽기만 하므로(바꾸는 곳 없음) 같은 것을 다시 써도 결과가 같음 */
  const _mergeC = new Map(); let _mergeId = null; const _mergeE = {}; /* 같은 일(한 번의 계산 묶음) 안에서는 같은 설정 객체 → 바로 찾음. 일이 끝나면(약속 차례) 잊음 → 그 뒤 설정을 고쳐도 다시 봄 */
  const mergeD = (S0) => { if (S0 != null && typeof S0 !== 'object') return mergeD2(S0); const o = S0 || _mergeE; if (_mergeId === null) { _mergeId = new WeakMap(); Promise.resolve().then(() => { _mergeId = null; }); } const hit = _mergeId.get(o); if (hit !== undefined) return hit; const r = mergeD2(S0); _mergeId.set(o, r); return r; };
  const mergeD2 = (S0) => { const k = JSON.stringify(S0 || {}); let v = _mergeC.get(k); if (v === undefined) { if (_mergeC.size > 64) _mergeC.clear(); v = JSON.parse(JSON.stringify(merge(DEFAULTS, S0 || {}))); /* 깊은 복사본을 기억 — 부른 쪽 목록을 나중에 바꿔도 기억한 설정은 그대로 */ _mergeC.set(k, v); } return v; };

  // 가격 단위: 가격이 속한 자릿수 구간 시작값의 5% (100~999 → 5, 1,000~9,999 → 50, 10,000~99,999 → 500 …). 100원 미만은 1원
  function priceStep(p) { if (!(p > 0)) return 1; const band = Math.pow(10, Math.floor(Math.log10(p))); return band < 100 ? 1 : band * 0.05; }
  // 단위에 맞춰 내림/올림. 구간 경계에서는 '결과 가격'의 단위를 씀 (10,000에서 한 단위 내리면 9,950)
  function snapDown(p) { if (!(p > 0)) return 0; let s = priceStep(p); let v = Math.floor(p / s) * s; const s2 = priceStep(v); if (s2 !== s) v = Math.floor(p / s2) * s2; return Math.round(v); }
  function snapUp(p) { if (!(p > 0)) return 0; const s = priceStep(p); return Math.round(Math.ceil(p / s) * s); }
  function stepDown(p) { const v = snapDown(p); return v < p ? v : snapDown(p - 1); } // p보다 한 단위 아래

  // 재고 기간: 등록 후 일수 → T1~T8
  function tierOf(days, bounds) {
    const b = bounds || DEFAULTS.tierBounds;
    for (let i = 0; i < b.length; i++) if (days <= b[i]) return 'T' + (i + 1);
    return 'T' + (b.length + 1);
  }
  // 경계 하나를 바꾸면 앞뒤가 자동으로 이어지게: 구간 i의 [시작,끝] 을 고치면 경계 배열 전체를 다시 만듦
  function setTierRange(bounds, i, from, to) {
    const b = bounds.slice();
    if (i > 0 && from != null) b[i - 1] = from - 1;
    if (i < b.length && to != null) b[i] = to;
    for (let k = 1; k < b.length; k++) if (!(b[k] > b[k - 1])) throw new Error('재고 기간 경계는 앞에서 뒤로 커져야 합니다');
    return b;
  }

  // ── 판매자 분류: 이 파일에는 기준이 없음. readnow-core.js(1.2.0)의 classifySellerDoc 한 곳만 부름 (툴팁·웹앱과 같은 함수) ──
  // ctx.core = ReadNowCore, ctx.RS = ReadnowSellers 를 넘기거나 전역에 있어야 함. 없으면 판정하지 않음(복사본으로 계산하지 않음)
  // 나중에 '상품 기준'으로 바꿀 때는 ctx.classify(row, listing) 만 갈아 끼움
  const coreOf = (ctx) => ctx.core || (root && root.ReadNowCore) || null;
  const rsOf = (ctx) => ctx.RS || (root && root.ReadnowSellers) || null;
  // 알라딘측 = 알라딘 직접 배송(판매자 번호 0) · 이 광활한 우주점(표시) · 알라딘 중고매장 ○○점(판매자 링크 없이 매장 이름) — 유효 판매자와 같이 항상 기준 후보
  const isAladinSide = (row, S) => String(row.sellerCode || '') === '0' || !row.sellerCode || (S.aladinSideNames || []).some((n) => String(row.sellerName || '').includes(n) || String(row.sellerBadge || '').includes(n));
  function specialHit(title, S) { const s = String(title || ''); return (S.specialKeywords || []).filter((k) => k && s.includes(k)); }

  // ───────────────────────── 남는 돈과 하한선 ─────────────────────────
  // 한 권 팔았을 때 손에 남는 돈 (매입원가 빼기 전): 판매가 − 수수료 − 주문당 비용(택배 − 고객 배송비 + 포장재) ÷ 주문당 평균 권수
  // (0.17.14) ⚠ 이 하한 셈(sellNet·minPriceFor)은 아직 택배비 마진(손님 배송비 > 택배비)을 0으로 봄 — 값을 올리고 내리는 엔진 하한이라 정범님 결정 전 그대로 · 🏷 매입 후보 판정(bbNetParts)만 마진을 더함
  function sellNet(p, ctx, S) {
    if (!S || S.feeRate == null || S.packPerOrder == null || S.courierPerOrder == null || S.booksPerOrder == null) S = mergeD(S); /* (0.15.3) 설정 일부만 넘겨도 기본값을 채움 — 예전엔 NaN → 최소가 1,000만 원 */ const pol = (ctx && ctx.policy) || {}; const custShip = pol.freeOver != null && p >= pol.freeOver ? 0 : (pol.fee || 0);
    const orderCost = S.packPerOrder + Math.max(0, S.courierPerOrder - custShip);
    return p * (1 - S.feeRate) - orderCost / Math.max(1, S.booksPerOrder);
  }
  // sellNet(p) >= need 를 만족하는 가장 낮은 단위 가격 (가격이 오르면 남는 돈이 줄지 않는 범위에서 찾음)
  function minPriceFor(need, ctx, S) {
    if (need == null) return null; let lo = 1, hi = 10000000;
    if (sellNet(hi, ctx, S) < need) return null;
    while (hi - lo > 1) { const m = Math.floor((lo + hi) / 2); if (sellNet(m, ctx, S) >= need) hi = m; else lo = m; }
    let p = snapUp(hi); while (sellNet(p, ctx, S) < need) p = snapUp(p + 1); return p;
  }
  // ───────────────────────── 🏷 알라딘 매입가 — 한 곳 (정범님 11/06) ─────────────────────────
  // 원칙: '이 책을 손님에게 이 값에 파는 것이 알라딘에 파는 것보다 나은가'에 답하는 곳(웹앱 📥/🏷/경영 매입 후보 · 자동 발송요청 저가 규칙 · 이 엔진의 매입가 하한)은
  //       모두 아래 셈 하나(bbNear · bbFloor)를 씀 — 순이익 = 판매가 × (1 − 수수료율) − (포장비 + 택배비 − 손님 배송비) ÷ 주문당 권수(반올림) · 차 = 순이익 − 알라딘 매입가 · 차 < 기준 차액(기본 500원 · app_settings/main.bbMargin)이면 매입 후보
  //       하한가 = 기본(끔): 예전 그대로 순이익 = 매입가가 되는 가장 낮은 가격(minPriceFor) · 설정 floorMargin 켬: 매입 후보가 아니게 되는 가장 낮은 가격(기준 차액 넣음 · 가격 단위 올림)
  //       (정범님 결정 전이라 기본 끔 — 켜면 하한이 기준 차액만큼 오름: 매입가 7,000원 → 11,000원 → 12,000원 · ctx.floorMargin 또는 판정 설정 floorMargin · 웹앱 app_settings/main.bbFloorOn)
  // 매입가 거르기(정범님 11/06 '매입가를 잘못 읽으면 추천가가 77배까지 올라감'): 알라딘 매입가가 그 책 정가보다 크면 잘못 읽은 값으로 보고 무시(쓰는 곳 모두) · 정가를 모르면 그대로 씀(noList로 표시해 셀 수 있게)
  // 등급: 우리 등급 칸 먼저 · 없으면 가장 가까운 등급(같은 거리면 더 좋은 등급 — 정범님 10/28 · alt) · 값을 올리는 하한은 우리 등급 칸만(alt:false · 다른 등급 값으로 값을 올리지 않음) · 중은 ⚠(알라딘이 안 살 수 있음)
  const BB_MARGIN_DEF = 500; const BB_ORD = ['최상', '상', '중', '하'];
  const bbW = (v) => { v = Math.round(+v || 0); return (v < 0 ? '-' : '') + String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원'; }; /* (0.17.10 🔬 정밀 점검 11/06) toLocaleString → 글자 식(같은 결과): bbNear가 상품마다 까닭 글을 4번 만들어 경영 계산·휴대폰 매입 탭 매입처 화면에서 느린 함수 1위(self 6.0초 · 긴 멈춤 41번 46초)였음 */
  function bbMarginOf(v) { return v != null && v !== '' && Number.isFinite(+v) && +v >= 0 && +v <= 100000 ? Math.round(+v) : BB_MARGIN_DEF; }
  /* 매입가 하나 거르기 → null(값 없음) · { v, ok: true, noList } · { v, ok: false, list, why }(정가보다 큼 — 잘못 읽은 값) */
  function bbValid(buy, list) { const v = +buy; if (!Number.isFinite(v) || !(v > 0)) return null; const L = +list; if (!(L > 0)) return { v, ok: true, noList: true };
    if (v > L) return { v, ok: false, list: L, why: `알라딘 매입가 ${bbW(v)}이 정가 ${bbW(L)}보다 큼 — 잘못 읽은 값으로 보고 무시` }; return { v, ok: true, noList: false }; }
  /* 매입가 표(mkt.buyback {최상, 상, 중}) 거르기 → { B: 쓸 수 있는 값만, bad: [{ g, v, list, why }], noList } */
  function bbClean(B, list) { const out = {}, bad = []; let any = false; if (B && typeof B === 'object') for (const g of Object.keys(B)) { const x = bbValid(B[g], list); if (!x) continue; any = true; if (x.ok) out[g] = x.v; else bad.push({ g, v: x.v, list: x.list, why: x.why }); }
    return { B: out, bad, any, noList: !(+list > 0) }; }
  /* 견줄 매입가 고르기 → null(쓸 값 없음 · 무시한 값도 없음) · { v, g, alt, warn, bad, noList } — v가 null이면 '값이 있었지만 모두 무시' (bad에 까닭)
   *  o = { list: 정가, alt: 다른 등급으로 대신(기본 true), grades: 쓸 등급 목록(없으면 모두) } */
  function bbPick(B, grade, o) { o = o || {}; const C = bbClean(B, o.list); const okG = (g) => !o.grades || o.grades.includes(g); const bad = C.bad.filter((x) => okG(x.g)); const base = { bad, noList: C.noList };
    const warnOf = (g, alt) => (g === '중' ? '⚠ 중 — 알라딘이 매입하지 않을 수 있음' : '') + (alt ? `${g === '중' ? ' · ' : ''}우리 등급(${grade || '모름'}) 칸이 없어 가장 가까운 ${g} 매입가로 견줌` : '');
    if (grade && okG(grade) && C.B[grade] != null) return { ...base, v: C.B[grade], g: grade, alt: false, warn: warnOf(grade, false) };
    if (o.alt !== false) { const gi = BB_ORD.indexOf(grade); const c = Object.keys(C.B).filter(okG).map((k) => { const i = BB_ORD.indexOf(k); return { k, d: i < 0 ? 9 : gi < 0 ? i : Math.abs(i - gi), i: i < 0 ? 9 : i }; }).sort((a, b) => a.d - b.d || a.i - b.i);
      if (c.length) return { ...base, v: C.B[c[0].k], g: c[0].k, alt: true, warn: warnOf(c[0].k, true) }; }
    const myBad = bad.filter((x) => x.g === grade || o.alt !== false); return myBad.length ? { ...base, bad: myBad, v: null, g: myBad[0].g, alt: myBad[0].g !== grade, warn: '', why: myBad.map((x) => `${x.g} ${x.why}`).join(' · ') } : null; }
  /* 직접 팔아 남는 돈(순이익)의 구성 — sellNet과 같은 셈(반올림) · o = { policy: { fee, freeOver }, D: { feeRate, packPerOrder, courierPerOrder, booksPerOrder } (없으면 DEFAULTS) } */
  function bbNetParts(P, o) { P = +P; if (!(P > 0)) return null; o = o || {}; const D = o.D || {}; const pol = o.policy || {}; const num = (v, d) => (v != null && v !== '' && Number.isFinite(+v) ? +v : d);
    const fr = num(D.feeRate, DEFAULTS.feeRate), pk = num(D.packPerOrder, DEFAULTS.packPerOrder), cr = num(D.courierPerOrder, DEFAULTS.courierPerOrder), bpo = Math.max(1, num(D.booksPerOrder, DEFAULTS.booksPerOrder));
    /* (0.17.14 · 정범님 11/12 밤 '택배비를 빼는 게 아니야 — 택배비 마진이 있다면 더하고, 우리 부담일 때 빼는 거야') 택배비 몫 = 손님이 낸 배송비 − 실제 평균 택배비
     *  양수 = 택배비 마진(순이익에 더함) · 음수 = 우리 부담(무료배송 등 — 순이익에서 뺌) · 예전: 우리 부담만 빼고 마진은 0으로 버림(max(0, 택배 − 손님 배송비)) → 손님 배송비 2,800원·택배 2,500원이면 300원을 놓쳤음
     *  ship = 택배비 몫(주문당 권수로 나눔 · 반올림) · shipNet = 예전 이름(우리가 내는 택배비 − 손님 배송비 · 음수 = 마진) */
    const cust = pol.freeOver != null && pol.freeOver !== '' && P >= +pol.freeOver ? 0 : num(pol.fee, 0); const fee = Math.round(P * fr), shipNet = cr - cust, per = Math.round((pk + shipNet) / bpo), pkPer = Math.round(pk / bpo), ship = Math.round((cust - cr) / bpo);
    const crSrc = o.crSrc || (D.courierPerOrder != null && D.courierPerOrder !== '' ? null : '엔진 기본값'); /* (리드 11/12 밤) 평균 택배비가 어디서 왔나 — ⚙ 택배 계약(bbCourier) · 없으면 엔진 기본값 */
    const net = Math.round(P * (1 - fr) - (pk + shipNet) / bpo); return { fee, fr, pk, cr, cust, shipNet, bpo, per, pkPer, ship, net, crSrc }; }
  /* (리드 11/12 밤 '평균 택배비 = 설정 택배 계약의 실제 계약 택배비') ⚙ 설정 › ④ 택배 계약(crm_system/accounting.couriers [{ from, carrier, cost }]) 중 그날(iso · 없으면 오늘 한국 날짜) 적용되는 줄
   *  → { cost, src } · 계약 줄이 없거나 값이 이상하면 null(엔진 기본값 2,500원을 씀) · 웹앱·클라우드·PC가 같이 부름 */
  function bbCourier(acct, iso) { const L = acct && Array.isArray(acct.couriers) ? acct.couriers.filter((c) => c && +c.cost > 0 && +c.cost < 100000) : []; if (!L.length) return null;
    const d = String(iso || new Date(Date.now() + 9 * 3600e3).toISOString()).slice(0, 10); const S0 = L.slice().sort((a, b) => String(a.from || '').localeCompare(String(b.from || ''))); let hit = null; for (const c of S0) if (String(c.from || '') <= d) hit = c; if (!hit) hit = S0[0];
    const f = String(hit.from || ''); return { cost: Math.round(+hit.cost), carrier: hit.carrier || '', from: f, src: `택배 계약${hit.carrier ? ' ' + hit.carrier : ''}${f && f !== '2000-01-01' ? ' ' + f + '~' : ''}` }; }
  /* 매입 판정 재료에 택배 계약을 얹음 — o = { margin, policy, D } → D.courierPerOrder = 계약 택배비 · crSrc = 출처 글 */
  function bbWithCourier(o, acct, iso) { o = o || {}; const K = bbCourier(acct, iso); if (!K) return { ...o, crSrc: '엔진 기본값' }; return { ...o, D: { ...(o.D || DEFAULTS), courierPerOrder: K.cost }, crSrc: K.src }; }
  /* 🏷 매입 후보 판정 — o = { margin: 기준 차액, policy, D, list: 정가(주면 매입가 거르기) } → null(셀 수 없음) · { in, below, P, buy, k, net, gain, parts, calc } · 무시한 매입가면 { in: false, ignored: { buy, list, why }, calc: 까닭 } */
  function bbNear(P, buy, o) { P = +P; buy = +buy; if (!(P > 0) || !(buy > 0)) return null; o = o || {}; const k = bbMarginOf(o.margin); const x = bbNetParts(P, o); if (!x) return null;
    const V = bbValid(buy, o.list); if (V && !V.ok) return { in: false, below: false, P, buy, k, net: x.net, gain: null, parts: x, ignored: { buy, list: V.list, why: V.why }, calc: V.why };
    const net = x.net, gain = net - buy; const R = { in: gain < k, below: gain <= 0, P, buy, k, net, gain, parts: x, ...(V && V.noList ? { noList: true } : {}) };
    /* (0.17.14 · 정범님 11/12 밤 '(있다면) 매입가') 우리 매입원가(o.cost)를 알면 순이익에서도 뺀 값(profit)과 알라딘에 팔 때 남는 돈(bbProfit = 매입가 − 원가)을 함께 둠 — 원가는 두 쪽에 똑같이 들어가 차(gain)는 그대로 */
    if (+o.cost > 0) { R.cost = Math.round(+o.cost); R.profit = net - R.cost; R.bbProfit = buy - R.cost; }
    /* (0.17.10 🔬 정밀 점검 11/06) 까닭 글(calc)은 처음 읽을 때 만듦 — 경영 계산(bizCalc)·휴대폰 매입 탭이 상품 2.6만 개마다 bbNear를 불러 글을 미리 만들던 것(원 표시 10만 번 · 느린 함수 1위) · 읽는 쪽은 그대로 R.calc */
    Object.defineProperty(R, 'calc', { enumerable: true, configurable: true, get() { const s = `순이익 ${bbW(net)} − 알라딘 매입가 ${bbW(buy)} = 차 ${gain < 0 ? '−' + bbW(-gain) : bbW(gain)} ${gain < k ? '<' : '≥'} 기준 ${bbW(k)}`; Object.defineProperty(R, 'calc', { value: s, enumerable: true, writable: true, configurable: true }); return s; } }); return R; }
  /* 매입가 하한가 — o.floorMargin 켬: 매입 후보가 아니게 되는(순이익 − 매입가 ≥ 기준 차액) 가장 낮은 가격(가격 단위 올림) · 끔(기본): 예전 하한(minPriceFor — 순이익 = 매입가) · 무시한 매입가·셀 수 없으면 null */
  function bbFloor(buy, o) { buy = +buy; if (!(buy > 0)) return null; o = o || {}; const V = bbValid(buy, o.list); if (!V || !V.ok) return null; if (o.floorMargin !== true) return minPriceFor(buy, { policy: o.policy || null }, mergeD(o.D || null)); const k = bbMarginOf(o.margin); const okP = (p) => { const x = bbNetParts(p, o); return !!x && x.net - buy >= k; };
    let lo = 1, hi = 10000000; if (!okP(hi)) return null; while (hi - lo > 1) { const m = Math.floor((lo + hi) / 2); if (okP(m)) hi = m; else lo = m; } let p = snapUp(hi); let n = 0; while (!okP(p) && n++ < 200) p = snapUp(p + 1); return okP(p) ? p : null; }
  /* 하한 한 번에(엔진 floors·critTarget·웹앱 📥 등록·📷 사진 가격) — 우리 등급 칸만 · grades(기본 최상·상) · → null · { buy, floor, g, bad, noList } (buy null이면 무시한 값만 있었음) */
  function bbFloorPick(B, grade, o) { o = o || {}; const pk = bbPick(B, grade, { list: o.list, alt: false, grades: o.grades || ['최상', '상'] }); if (!pk) return null; if (pk.v == null) return { buy: null, floor: null, g: pk.g, bad: pk.bad, noList: pk.noList, why: pk.why };
    const fl = bbFloor(pk.v, o); return { buy: pk.v, floor: fl, g: pk.g, bad: pk.bad, noList: pk.noList }; }
  /* (정범님 11/09 '알라딘 매입 조건에서 상품 상태가 중이면 해당하지 않으니 빼라') 매입 등급 판정 — 한 곳
   *  우리 상품 상태(등급 칸 grade: 최상·상·중·하)가 알라딘이 사는 등급(DEFAULTS.buybackGrades = 최상·상 — '알라딘은 중 상태를 사지 않음')이 아니면 '알라딘 매입' 조건에서 뺌
   *  쓰는 곳: 🤖 자동 발송요청 저가·관리코드 규칙(출고 공용 autoShipDecide ⑥ — 클라우드·PC 수집기·PC 도우미가 실행) · 웹앱 출고 카드 '매입가' 알약(shipLowBB) — 같은 상품이면 같은 답
   *  등급을 모르거나 모르는 글자면 빼지 않음(예전 그대로) → null(뺄 것 아님) · { g, why } */
  function bbGradeOut(grade, S0, T) { if (T && typeof T === 'object') { const R = bbGrRow(grade, T); if (R.on) return null; const g = R.k === '모름' ? String(grade == null ? '' : grade).trim() || '모름' : R.k;
      return { g, k: R.k, row: R, why: R.def ? `상품 상태 '${g}' — 알라딘은 '${g}' 상태를 매입하지 않아 알라딘 매입 조건에서 뺌` : `상품 상태 '${g}' — ⚙ 상태별 매입 조건 '${R.k}' 줄을 꺼 알라딘 매입 조건에서 뺌` }; }
    const g = String(grade == null ? '' : grade).trim(); if (!g || !(g in GRADE_RANK)) return null; const L = S0 && Array.isArray(S0.buybackGrades) ? S0.buybackGrades : DEFAULTS.buybackGrades; if (L.includes(g)) return null;
    return { g, why: `상품 상태 '${g}' — 알라딘은 '${g}' 상태를 매입하지 않아 알라딘 매입 조건에서 뺌` }; }
  /* (정범님 11/09 '설정에서 모든 상태에 대한 세세한 조건을 조정할 수 있게') 상태(등급)별 알라딘 매입 조건 표 — 🤖 자동 발송요청 ⑥ 저가·관리코드 규칙(출고 공용 autoShipDecide)·웹앱 출고 카드 칩이 같이 읽음
   *  저장 = app_settings/ship_auto.bbGr { 최상|상|중|하|모름: { on, margin, match, lowPrice, rest, cheapPct } } (자동 발송요청 설정 문서 · 새 모음 없음)
   *   on       = 알라딘 매입 후보로 볼지 (기본: 최상·상 켬 — DEFAULTS.buybackGrades · 중·하 끔 — 알라딘이 사지 않음 · 모름 켬 = 예전 그대로)
   *   margin   = 기준 차액(원) 덮어쓰기 · null = 전체 값(app_settings/main.bbMargin · 기본 500원) — 근거: 없음, 설정으로 바꿈
   *   match    = 견줄 알라딘 매입가 등급 'near'(우리 등급 칸이 없으면 가장 가까운 등급 — 정범님 10/28 · 기본) | 'same'(같은 등급만 — 없으면 매입가 모름)
   *   lowPrice = 저가 기준(원 이하면 ⑥에 듦) 덮어쓰기 · null = 전체 값(lowPrice 4,000원) — 근거: 없음, 설정으로 바꿈
   *   rest     = 매입 후보로 안 볼 때(꺼짐)·매입가 모를 때 'pass'(퍼센트 따지지 않고 통과 — 정범님 11/05 밤 · 기본) | 'pct'(유효 최저가 대비 기준으로 봄)
   *   cheapPct = rest 'pct'일 때 쓰는 기준(%) 덮어쓰기 · null = 전체 값(cheapPct 25) — 근거: 없음, 설정으로 바꿈
   *  등급 글자를 모르거나 비었으면 '모름' 줄 */
  const BB_GR_KEYS = ['최상', '상', '중', '하', '모름'];
  function bbGrDef(k) { return { on: k === '모름' || DEFAULTS.buybackGrades.includes(k), margin: null, match: 'near', lowPrice: null, rest: 'pass', cheapPct: null }; }
  function bbGrNorm(T) { const out = {}; const nn = (v, hi) => (v == null || v === '' || !Number.isFinite(+v) ? null : Math.round(Math.min(hi, Math.max(0, +v))));
    for (const k of BB_GR_KEYS) { const d = bbGrDef(k), r = (T && typeof T === 'object' && T[k] && typeof T[k] === 'object') ? T[k] : {};
      out[k] = { on: typeof r.on === 'boolean' ? r.on : d.on, margin: nn(r.margin, 100000), match: r.match === 'same' ? 'same' : 'near', lowPrice: nn(r.lowPrice, 1e7), rest: r.rest === 'pct' ? 'pct' : 'pass', cheapPct: nn(r.cheapPct, 100) }; }
    return out; }
  const bbGrKey = (grade) => { const g = String(grade == null ? '' : grade).trim(); return g in GRADE_RANK ? g : '모름'; };
  /* 그 상품 상태의 줄 → { k, on, margin, match, lowPrice, rest, cheapPct, def(모두 기본값인가), set:[바꾼 칸] } */
  function bbGrRow(grade, T) { const k = bbGrKey(grade); const r = bbGrNorm(T)[k]; const d = bbGrDef(k); const set = Object.keys(d).filter((q) => r[q] !== d[q]); return { k, ...r, def: !set.length, set }; }
  // 하한선: 매입가 하한(모든 단계) + 원가 하한(T1~T3) / 처분 하한(T4~: 매입원가는 이미 쓴 돈 → 팔아서 손해만 안 보면 됨)
  // 하한선 = 알라딘 매입가 하나뿐 (정범 결정 2026-10-04: 원가·손해선 같은 다른 제약은 걸지 않음)
  // 매입가 하한가 = 팔아서 손에 남는 돈(판매가 − 수수료 − 주문당 비용)이 알라딘 매입가와 같아지는 판매가.
  // 목표가가 그보다 낮아도 차이가 buybackTolerance(10%) 안이면 그대로 둠(최저가 자리가 더 중요) — 10% 넘게 낮을 때만 하한가에 멈추고 '알라딘에 팔기' 검토로 표시
  function floors(listing, tier, ctx, S) {
    ctx = ctx || {}; if (!S || S.buybackGrades == null) S = mergeD(S); /* (정범님 11/06) 공용 bbFloorPick — 우리 등급 칸만(buybackGrades · 중은 알라딘이 사지 않을 수 있어 하한 안 씀) · 정가보다 큰 매입가는 무시 · 하한 = 매입 후보가 아니게 되는 가장 낮은 값(순이익 − 매입가 ≥ 기준 차액 · 웹앱 🏷 매입 후보와 같은 셈) */
    const FP = listing.grade && ctx.buyback ? bbFloorPick(ctx.buyback, listing.grade, { list: listing.priceList || ctx.priceList || null, grades: S.buybackGrades || [], margin: ctx.bbMargin != null ? ctx.bbMargin : S.bbMargin, floorMargin: (ctx.floorMargin != null ? ctx.floorMargin : S.floorMargin) === true, policy: ctx.policy || null, D: S }) : null;
    const bb = FP && FP.buy != null ? FP.buy : null; const fBuyback = FP ? FP.floor : null;
    const fm = (ctx.floorMargin != null ? ctx.floorMargin : S.floorMargin) === true; return { buyback: bb, fBuyback, tolerance: S.buybackTolerance, applied: fBuyback, floorMargin: fm, margin: fm ? bbMarginOf(ctx.bbMargin != null ? ctx.bbMargin : S.bbMargin) : 0, ...(FP && FP.bad.length ? { ignored: FP.bad } : {}), ...(FP && FP.noList ? { noList: true } : {}) };
  }

  // ── 관리코드 표시 (일시판매중지 보관함 구분) ── 기준은 여기 한 곳: 앞 3자리 = 서가(절대 안 건드림), 뒤 3자리 = 가격 코드 자리에 표시를 씀
  const SKU_TAGS = { hold: 'PND', retire: 'BAD' }; // PND = 판매보류풀(가격상승대기) · BAD = 불용
  function skuTag(sku) { const t = String(sku || '').slice(3, 6).toUpperCase(); return t === SKU_TAGS.hold ? 'hold' : t === SKU_TAGS.retire ? 'retire' : null; }
  function skuWith(sku, kind) { const s0 = String(sku || ''); if (s0.length < 3) return null; return s0.slice(0, 3) + SKU_TAGS[kind] + s0.slice(6); } // 예: BLKCMN → BLKPND / BLKBAD

  // ── 대행형 판별 (예스24 대조) ──
  // ① 같은 판매자: 알라딘 판매자 이름 = 예스24 이 책의 판매자 이름(또는 아이디) → 두 곳에 같은 재고를 올린 것 = 실제로 팔리는 경쟁 매물
  // ② 대행 이윤: 알라딘에서 받는 돈(판매가 − 수수료 + 배송비) − 예스24에서 같은 등급 이상을 사서 바로 보내는 비용(판매가 + 배송비) ≥ 0 → 대행해도 남음 = 실제로 보낼 수 있음
  //    배송비를 높게 받는 판매자는 판매가가 조금 낮아도 배송비에서 남기므로 반드시 배송비까지 셈
  const GRADE_RANK = { '최상': 3, '상': 2, '중': 1, '하': 0 };
  const normName = (x) => String(x || '').toLowerCase().replace(/[\s·.,'"()\[\]{}<>\-_=~!@#$%^&*+|/\\:;?]/g, '');
  function proxyCheck(row, y24, S0) {
    const S = S0 || DEFAULTS;
    if (!y24 || !y24.offers) return { verdict: 'noData', why: '예스24 자료 없음' };
    const nm = normName(row.sellerName);
    const same = nm && y24.offers.find((o) => normName(o.shopName) === nm || normName(o.shopId) === nm);
    if (same) return { verdict: 'sameSeller', why: `예스24에도 같은 판매자(${same.shopName})가 이 책을 올림 ${same.price.toLocaleString()}원`, offer: same };
    const need = GRADE_RANK[row.grade] ?? 0;
    const src = y24.offers.filter((o) => (GRADE_RANK[o.grade] ?? -1) >= need && o.price > 0).map((o) => ({ o, cost: o.price + (o.freeOver != null && o.price >= o.freeOver ? 0 : o.ship || 0) })).sort((a, b) => a.cost - b.cost)[0];
    if (!src) return { verdict: 'noSource', why: `예스24에 ${row.grade || ''} 이상 매물 없음 → 대행 불가 → 실물 없을 가능성 큼` };
    const income = row.price * (1 - S.feeRate) + (row.ship || 0); const margin = Math.round(income - src.cost);
    return margin >= 0
      ? { verdict: 'profitable', why: `대행해도 ${margin.toLocaleString()}원 남음 (알라딘 ${row.price.toLocaleString()}+배송 ${(row.ship || 0).toLocaleString()} vs 예스24 ${src.o.shopName} ${src.cost.toLocaleString()})`, margin, offer: src.o }
      : { verdict: 'loss', why: `대행하면 ${(-margin).toLocaleString()}원 손해 → 실제로 보낼 가능성 낮음`, margin, offer: src.o };
  }

  // ───────────────────────── 판정 ─────────────────────────
  function decide(listing, market, sellers, ctxIn) {
    const ctx = ctxIn || {}; const S = mergeD(ctx.settings); const now = t(ctx.now) || Date.now();
    const R = []; const block = []; const out = { v: VERSION, key: listing.key, at: new Date(now).toISOString(), current: listing.price, reasons: R, autoBlock: block };
    out.group = groupOfListing(listing, S);
    const done = (status, extra) => { Object.assign(out, { status }, extra || {}); peerShadowOf(out, listing, market, sellers, ctx, S); out.auto = out.action === 'set' && block.length === 0 && autoAllowed(out, S); out.execute = out.group === 'treat' && out.action === 'set'; if (out.group === 'control') out.reasons.push('비교군 — 판정만 기록, 가격은 바꾸지 않음'); return out; };

    // 0. 대상: 판매중만
    if (listing.status && listing.status !== '판매중') { R.push(`판매 상태가 '${listing.status}' — 수정 모드는 판매중만`); return done('skip', { action: 'none' }); }
    if (!(Number(listing.price) > 0)) { R.push('지금 판매가를 모름 — 사람이 확인'); return done('queue', { action: 'review', why: 'noPrice' }); } /* (0.15.3) 값이 없으면 계산하다 멈추던 것 */
    // 재고 기간 = '최저가 등록 기간'(측정값). 임시 기준은 '감시 시작일(cutoverAt) 전에 등록된 상품'에만, 그리고 스스로 끝남:
    //   임시 단계 = 감시 시작일 당시의 등록 후 일수로 고정(시간이 지나도 늘지 않음) → 최대 tempTierCap(T3)
    //   적용 단계 = max(측정 단계, 임시 단계) → 측정 단계가 T3에 닿는 순간 임시는 의미가 없어짐
    //   감시 시작일 + tempSunsetDays(365일)가 지나면 임시 기준은 코드에서 완전히 꺼짐 (그 뒤엔 측정값만)
    //   → 1년 뒤 '등록 2년차'로 잘못 뛰는 일 없음: 감시 전 시간은 T3 이상으로 절대 세지 않고, 감시 뒤에는 최저가를 지킨 날만 셈
    const regDays = Math.floor((now - t(listing.registeredAt)) / DAY);
    if (t(listing.registeredAt) == null || !Number.isFinite(regDays)) { R.push('등록일을 읽지 못함 — 재고 기간(단계)을 셀 수 없어 사람이 확인 (예전엔 불용으로 잘못 갈 수 있었음)'); return done('queue', { action: 'review', why: 'noRegDate' }); } /* (0.15.3) */
    const lw = listing.lowest || { days: 0 }; const lowDays = Math.floor(lw.days || 0);
    const cut = S.cutoverAt ? t(S.cutoverAt) : null;
    const legacy = cut != null && t(listing.registeredAt) < cut;
    const sunset = cut != null ? cut + S.tempSunsetDays * DAY : null;
    let tier = tierOf(lowDays, S.tierBounds), basis = `최저가 등록 기간 ${lowDays}일`, days = lowDays, temp = null;
    if (cut == null) { tier = tierOf(regDays, S.tierBounds); if (tier !== 'T8' && +tier.slice(1) > +S.tempTierCap.slice(1)) tier = S.tempTierCap; basis = `감시 시작 전: 등록 후 ${regDays}일 (${S.tempTierCap}까지만)`; days = regDays; }
    else if (legacy && now < sunset) {
      const frozen = Math.floor((cut - t(listing.registeredAt)) / DAY); let tt = tierOf(frozen, S.tierBounds); if (+tt.slice(1) > +S.tempTierCap.slice(1)) tt = S.tempTierCap;
      if (+tt.slice(1) > +tier.slice(1)) { temp = { tier: tt, frozenDays: frozen, endsAt: new Date(sunset + 9 * 3600e3).toISOString().slice(0, 10) }; tier = tt; basis = `임시 기준: 감시 시작일까지 등록 ${frozen}일 → ${tt} (최저가 기간 ${lowDays}일이 따라잡거나 ${temp.endsAt}에 자동 종료)`; }
    }
    if (listing.registeredAt && regDays > S.tierBounds[S.tierBounds.length - 1]) { tier = 'T8'; basis = `등록 ${regDays}일 — 불용은 등록일 기준`; days = regDays; }
    const T = S.tiers[tier];
    out.tier = { code: tier, name: T.name, days, basis, regDays, lowestDays: lowDays, temp };
    if (listing.lock) { R.push('가격 잠금 상품 — 자동 수정 안 함'); return done('hold', { action: 'none' }); }
    const excl = isExcluded(listing, S); if (excl) { block.push(`${listing.sku}: 관리자 확인 필수 (자동 감시 제외 코드)`); R.push(`관리코드 ${listing.sku} — 자동 감시에서 제외, 판정은 참고용으로만 계산`); }
    if (tier === 'T8') { R.push(`등록 ${days}일 — 불용 재고: 일시판매중지 + 관리코드 뒤 3자리 ${SKU_TAGS.retire} (관리자 승인 필요, 원래 관리코드는 기록에 남김)`); return done('retire', { action: 'retire', toStatus: '일시판매중지', newSku: skuWith(listing.sku, 'retire'), origSku: listing.sku || null, autoBlock: block.concat('불용 처리는 항상 관리자 승인') }); }

    // 1. 관측이 쓸 만한가
    if (!market || !market.rows) { R.push('온라인 중고 관측이 없음'); return done('queue', { action: 'review', why: 'noMarket' }); }
    const age = (now - t(market.at)) / HOUR;
    if (age > S.staleHours) { R.push(`관측이 ${Math.round(age)}시간 전 — ${S.staleHours}시간 넘은 자료로는 판정하지 않음`); return done('wait', { action: 'none', why: 'stale' }); }
    if (listing.pendingChange && now - t(listing.pendingChange.at) < S.confirmHours * HOUR) {
      R.push(`우리가 ${listing.pendingChange.price.toLocaleString()}원으로 바꾼 지 ${S.confirmHours}시간이 안 됨 — 알라딘 반영 대기`); return done('wait', { action: 'none', why: 'ourReflect' });
    }

    // 2. 비교 범위: 첫 페이지 / 특별판 키워드면 뒤쪽 쪽까지
    const hits = specialHit(listing.title, S); const special = hits.length > 0;
    out.special = special ? hits : null;
    const maxPage = special ? S.specialMaxPages : 1;
    if (special && (market.pagesSeen || 1) < Math.min(S.specialMaxPages, market.lastPage || 1)) {
      R.push(`특별판 키워드(${hits.join(', ')}) — ${Math.min(S.specialMaxPages, market.lastPage)}쪽까지 봐야 하는데 ${market.pagesSeen || 1}쪽만 관측됨`);
      return done('wait', { action: 'none', why: 'needPages', needPages: Math.min(S.specialMaxPages, market.lastPage) });
    }
    // 우리 매물 빼기, 판매중지 줄 빼기. 24시간 안에 사라진 매물은 아직 있는 것으로 봄(반영 지연), 24시간 안에 새로 생긴 싼 매물은 '미확정'
    const ours = String(S.ourSeller);
    const all = market.rows.map((r, i) => ({ ...r, rank: i + 1 }))
      .concat((market.recentGone || []).filter((g) => now - t(g.goneAt) < S.confirmHours * HOUR).map((g) => ({ ...g, rank: (g.rank != null ? g.rank : 1) - 0.5, ghost: true })))
      .filter((r) => (r.page || 1) <= maxPage && !r.soldOut && r.price > 0)
      .map((r) => (isAladinSide(r, S) && !['최상', '상', '중'].includes(r.grade) ? { ...r, gradeRaw: r.grade, grade: '중' } : r)); // 알라딘측 균일가 = 중 상태로 (정범 지정)
    const others = all.filter((r) => String(r.sellerCode || '') !== ours && !(listing.usedCode && r.usedCode === listing.usedCode));
    others.sort((a, b) => a.rank - b.rank);
    if (!others.length) { R.push('비교할 다른 매물이 없음 (우리만 있음)'); const sh = soloHigh(listing, {}, ctx); R.push(...sh.reasons.slice(1)); return done('queue', { action: 'review', why: 'alone', rare: true, solo: sh, soloTarget: sh.t }); } // (0.17.0) 우리 단독 = 사람 확인으로 두되 올릴 근거와 제안 값을 함께 (깎지 않음)

    // 3. 터무니없는 가격 빼기 (다른 매물 중앙값 3배 초과 · 정가 1.5배 초과)
    const ps = others.map((r) => r.price).sort((a, b) => a - b); const med = ps[Math.floor(ps.length / 2)];
    const lp = listing.priceList || ctx.priceList || 0;
    const sane = others.filter((r) => r.price <= Math.max(med * S.insaneMult, lp * S.insaneListMult, 20000));
    if (sane.length < others.length) R.push(`터무니없는 가격 ${others.length - sane.length}건 뺌`);

    // 4. 판매자 색 붙이기
    const Core = coreOf(ctx); const RSx = rsOf(ctx);
    if (!ctx.classify && !(Core && Core.classifySellerDoc)) { R.push('기준 파일 readnow-core.js(1.2.0)를 못 읽음 — 판매자 분류 없이 판정하지 않음'); return done('queue', { action: 'review', why: 'noCore' }); }
    const docOf = (r) => (sellers && r.sellerCode ? sellers['sc_' + r.sellerCode] || sellers[r.sellerCode] || null : null);
    const peerOn = !!(S.peerUse && RSx && RSx.peerW); /* (sv1 11/10) 판매자 가치 무게 — 시트 '허위' 표시를 읽지 않음 · 엔진 근거 ctx.peerEv[판매자 번호] = { grp, sold, passed } */
    const peerCls = (r) => { const p = RSx.peerW(docOf(r), ctx.peerEv ? ctx.peerEv[String(r.sellerCode)] || null : null, S.peerCfg || null); r.peerW = p.w; return { cls: p.cls, why: p.why }; };
    const classify = ctx.classify || (peerOn ? peerCls : (r) => Core.classifySellerDoc(docOf(r), RSx));
    sane.forEach((r) => { if (isAladinSide(r, S)) { r.color = 'aladin'; r.why = '알라딘측'; } else { const c = classify(r, listing); r.color = c.cls; r.why = c.why; } });
    // 예스24 대조 (대행형 판별): (sv1 11/10) 옛 시트 허위 표시로 빼던 것 없앰(근거 아님) — 판매자 가치 길에서는 엔진 무리 근거로 뺌
    if (S.useYes24Proxy) sane.forEach((r) => {
      if (!['red', 'orange', 'yellow'].includes(r.color) || r.color === 'unknown') return;
      if (peerOn && ctx.peerEv && (ctx.peerEv[String(r.sellerCode)] || {}).grp) return; /* (sv1) 판매자 가치 길에서는 시트 대신 엔진 무리 근거로 제외 */
      const pc = proxyCheck(r, ctx.yes24, S); r.proxy = pc; if (pc.verdict === 'sameSeller' || pc.verdict === 'profitable') { r.color = 'proxy'; r.why = pc.why; }
    });
    const tot = (r) => r.price + (r.ship || 0);
    const first = sane[0]; // 목록 맨 위 (우리 제외)
    const allow = new Set(T.colors.concat('aladin', 'proxy'));
    let pool = sane.filter((r) => allow.has(r.color));
    out.rows = sane.map((r) => [r.rank, r.sellerCode || null, r.color, r.grade || null, r.price, r.ship || 0, r.sellerName || null]); // 학습용 근거 (상품 기준으로 옮겨 갈 자료)
    out.counts = { all: sane.length, valid: sane.filter((r) => ['dkgreen', 'green', 'aladin'].includes(r.color)).length, inPool: pool.length };

    // 희소 후보: 기간 할인에서 빼고 사람 확인
    const nValid = out.counts.valid; const rare = nValid <= S.rareMaxValid && sane.length <= S.rareMaxAll;
    out.rare = rare;
    if (listing.protect || rare) { R.push(listing.protect ? `보호 재고(${listing.protect}) — 기간 할인·자동 인하 안 함` : `희소 후보 — 유효 판매자 ${nValid}곳·전체 ${sane.length}곳`); }

    // 5. 기준 상품 고르기 — 상태 등급: 최상 > 상 > 중 (최상이 가장 좋음)
    // ★ 소비자는 상태가 같거나 더 좋은 매물이 더 싸면 그쪽을 산다 → 같은 등급뿐 아니라 '더 좋은 등급' 유효 매물도 모두 기준 후보.
    //   더 좋은 등급 매물은 판매가를 우리 등급 값으로 환산(등급 계수 비율)해 비교 → 우리 가격은 항상 그 매물보다 확실히 싸짐
    //   (2026-10-04 사고: 우리 '중' 1,000원 위에 '상' 590원 유효 매물이 있는데 같은 등급만 봐서 놓침)
    //   더 나쁜 등급 매물은 기준으로 삼지 않되(상태 이점 유지), 우리보다 싸면 이유 칸에 알림
    const gr = (g) => (GRADE_RANK[g] != null ? GRADE_RANK[g] : -1); const myR = gr(listing.grade);
    const myC = S.gradeCoef[listing.grade];
    const effTotal = (r) => { if (myR < 0 || r.grade === listing.grade) return tot(r); const c = S.gradeCoef[r.grade]; return c && myC ? Math.round(r.price * (myC / c)) + (r.ship || 0) : tot(r); }; // 환산은 판매가에만, 배송비는 그대로
    let cand = pool.filter((r) => myR < 0 || (S.useBetterGrade ? gr(r.grade) >= myR : r.grade === listing.grade));
    let ref = null, how = '';
    if (tier === 'T1') {
      const fresh = listing.pubDate && now - t(listing.pubDate) < 365 * DAY;
      if (!fresh && cand.some((r) => r.color === 'dkgreen')) { cand = cand.filter((r) => r.color === 'dkgreen' || r.color === 'aladin'); how = '신규: 짙은 초록(·알라딘측) 기준'; }
      else if (fresh) how = '신규 + 출간 12개월 이내: 초록 기준';
    }
    const ourShip0 = listing.ship != null ? listing.ship : (ctx.policy && ctx.policy.fee) || 0;
    if (cand.length) {
      const best = cand.reduce((a, b) => (effTotal(b) < effTotal(a) ? b : a));
      const firstOk = first && cand.includes(first) && first.grade === listing.grade && (first.ship || 0) - ourShip0 <= S.firstTieMaxShipGap
        && !cand.some((r) => r.grade !== listing.grade && effTotal(r) < tot(first)); // 더 좋은 등급이 환산해서 더 싸면 맨 위 동가로 끝내지 않음
      if (firstOk) { ref = first; ref.conv = null; how = how || '목록 맨 위(최저가 표시)가 같은 등급 유효 상품'; }
      else if (best.grade === listing.grade || myR < 0) { ref = best; ref.conv = null; how = how || '같은 등급 유효 최저(배송비 포함 총액)'; }
      else { ref = { ...best, conv: effTotal(best) }; how = `더 좋은 등급(${best.grade}) 매물이 더 쌈 → ${listing.grade} 값으로 환산 (판매가 ${best.price.toLocaleString()} × ${myC}/${S.gradeCoef[best.grade]})`; R.push(`상태가 더 좋은 ${best.grade} 매물(${best.sellerName || best.sellerCode || '알라딘측'})이 ${best.price.toLocaleString()}원 — 우리 상품(${listing.grade})은 그보다 싸야 팔림`); if (!S.autoAllowConverted) block.push('더 좋은 등급 기준(환산)'); }
    }
    const worse = pool.filter((r) => myR >= 0 && gr(r.grade) >= 0 && gr(r.grade) < myR).sort((a, b) => tot(a) - tot(b))[0];
    if (worse) out.worseCheapest = { grade: worse.grade, price: worse.price, ship: worse.ship || 0, sellerName: worse.sellerName || null };
    // (0.10.0) 추격자 양보: 기준이 추격자면 그 판매자 매물을 빼고 다음 기준으로 (그 매물이 첫 페이지에서 사라지면 = 팔리면 다음 판정에서 저절로 원래대로)
    { const Y = (S.chase && S.chase.yield) || {}; const ch0 = ref && ref.sellerCode && ctx.chase && (ctx.chase[ref.sellerCode] || {}).active;
      if (ch0 && Y.on !== false && +tier.slice(1) <= +String(Y.maxTier || 'T3').slice(1)) { const ys = ref.sellerName || ref.sellerCode; out.yield = { sellerCode: ref.sellerCode, sellerName: ref.sellerName || null, price: ref.price, grade: ref.grade || null };
        const rest = cand.filter((r) => String(r.sellerCode || '') !== String(ref.sellerCode));
        if (rest.length) { const b2 = rest.reduce((a, b) => (effTotal(b) < effTotal(a) ? b : a)); ref = b2.grade === listing.grade || myR < 0 ? { ...b2, conv: null } : { ...b2, conv: effTotal(b2) }; how = `추격자(${ys}) 양보 — 그 매물이 팔릴 때까지 다음 유효 매물 기준`;
          R.push(`기준 판매자 ${ys}가 우리를 따라 내리는 추격자 → 따라 내리지 않고 그 매물이 팔릴 때까지 양보, 다음 유효 매물을 기준으로 (재고 기간 ${String(Y.maxTier || 'T3')}까지만 · 추격 기록이 ${S.chase.releaseDays}일 없으면 저절로 풀림)`); }
        else { R.push(`기준 판매자 ${ys}가 추격자 — 다른 기준 매물이 없어 지금 가격 유지(양보), 그 매물이 팔리면 다시 판정`); return done('hold', { action: 'none', why: 'yieldChaser' }); } } }
    if (!ref) { R.push(`${special ? `${maxPage}쪽까지` : '첫 페이지에'} 기준이 될 매물(${T.colors.map((c) => LABEL[c]).join('·')}·알라딘측)이 없음`); return done('queue', { action: 'review', why: 'noRef' }); }
    const refTotal = ref.conv != null ? ref.conv : tot(ref);
    if (S.useYes24Proxy && !ctx.yes24 && sane.some((r) => r.rank < ref.rank && ['red', 'orange', 'yellow'].includes(r.color))) { out.needYes24 = true; R.push('기준보다 앞에 무효·보류 매물이 있음 — 예스24 대조 자료가 없어 일단 제외하고 판정 (다음 감시 때 예스24를 같이 봄)'); }
    const unknownAhead = sane.filter((r) => r.color === 'unknown' && r.rank < ref.rank);
    if (unknownAhead.length) { R.push(`기준보다 앞에 판매자 기록이 없는 매물 ${unknownAhead.length}건 — 판매자 정보를 먼저 모아야 판정 가능`); return done('wait', { action: 'none', why: 'needSellers', needSellers: [...new Set(unknownAhead.map((r) => r.sellerCode))] }); }
    out.ref = { rank: ref.rank, sellerCode: ref.sellerCode || null, sellerName: ref.sellerName || null, color: ref.color, grade: ref.grade, price: ref.price, ship: ref.ship || 0, total: refTotal, how, isFirst: !!(first && ref.rank === first.rank), ghost: !!ref.ghost };
    if (ref.ghost) { R.push('기준 매물이 사라졌지만 24시간이 안 돼 아직 있는 것으로 봄 — 확정될 때까지 지금 가격 유지'); return done('wait', { action: 'none', why: 'refGone' }); }
    // 안전: 유효 기준이 목록 맨 위보다 터무니없이 비쌈 → 진짜 싼 매물을 판매자 점수로 버린 것일 수 있음
    if (first && refTotal > tot(first) * S.queueGapMult) { R.push(`유효 기준(${refTotal.toLocaleString()}원)이 목록 맨 위(${tot(first).toLocaleString()}원, ${LABEL[first.color] || first.color})보다 ${S.queueGapMult}배 넘게 비쌈`); return done('queue', { action: 'review', why: 'gapToFirst' }); }
    // 24시간 안에 새로 생긴 기준은 아직 확정 아님 (내리는 쪽만 기다림)
    const refYoung = ref.firstSeenAt && now - t(ref.firstSeenAt) < S.confirmHours * HOUR;

    // 6. 소매 기준가: 맨 위면 동가, 아니면 배송비 차이 반영 + 구매자 이점
    const ourShip = listing.ship != null ? listing.ship : (ctx.policy && ctx.policy.fee) || 0;
    let base, rule;
    if (ref.conv != null) { const cv = ref.price * (myC / S.gradeCoef[ref.grade]); base = snapDown(cv); if (base >= ref.price) base = stepDown(ref.price); rule = `더 좋은 등급(${ref.grade}) 매물 판매가 ${ref.price.toLocaleString()}원 × 등급 계수 ${myC}/${S.gradeCoef[ref.grade]} = ${Math.round(cv).toLocaleString()}원 (단위 내림) — 판매가끼리 비교, 배송비는 계산에 넣지 않음`; }
    else if (out.ref.isFirst && (ref.ship || 0) - ourShip <= S.firstTieMaxShipGap) { base = ref.price; rule = '기준이 목록 맨 위(최저가 표시) → 동가, 더 내리지 않음'; }
    else if (out.ref.isFirst) { const tie = Math.max(10, ref.price + (ref.ship || 0) - ourShip); base = S.advPct > 0 ? snapDown(tie * (1 - S.advPct)) : tie; if (S.advPct > 0 && base >= tie) base = stepDown(tie); rule = `맨 위지만 배송비가 우리보다 ${((ref.ship || 0) - ourShip).toLocaleString()}원 비쌈 → 판매가 동가로 맞추면 배송비 차이만큼 마진을 버림 → 총액 기준 ${Math.round(S.advPct * 100)}% 이점`; }
    else { const tie = Math.max(10, ref.price + (ref.ship || 0) - ourShip); if (S.advPct > 0) { base = snapDown(tie * (1 - S.advPct)); if (base >= tie) base = stepDown(tie); rule = `총액 동가 ${tie.toLocaleString()}원에서 구매자 이점 ${Math.round(S.advPct * 100)}%`; } else { base = tie; rule = `배송비 포함 총액이 기준 매물과 정확히 같게 (기준 ${ref.price.toLocaleString()}+${(ref.ship || 0).toLocaleString()}, 우리 배송비 ${ourShip.toLocaleString()})`; } }

    if (base != null && ref.price && base < ref.price * 0.5) { block.push('배송비 차이로 목표가가 기준 판매가의 절반 아래 — 사람 확인'); R.push(`기준 판매가 ${ref.price.toLocaleString()}원인데 배송비 차이를 빼면 ${Number(base).toLocaleString()}원 — 너무 낮아 자동으로 바꾸지 않음`); } /* (0.15.3) 예: 기준 1,500원·배송비 0 vs 우리 배송비 2,500원 → 10원 */
    // 7. 재고 기간 할인 (보호·희소는 할인 없음). 추격자가 기준이면 '맨 위 동가'보다 더 내리지 않음
    let d = 0; /* (0.16.0) 재고 기간 할인 없앰(근거 없음) — 예전 설정(disc)이 남아 있어도 쓰지 않음 */
    if (listing.protect || rare) d = 0;
    const chased = ctx.chase && ref.sellerCode && (ctx.chase[ref.sellerCode] || {}).active;
    if (chased && d > 0) { R.push(`기준 판매자가 추격자(${ref.sellerName || ref.sellerCode}) — 할인 없이 동가 유지 (가격 싸움 피함)`); d = 0; }
    // ★ 맨 위 동가 우선(정범 원칙): 기준이 목록 맨 위(최저가 표시)면 기간 할인을 하지 않음 — 최저가 표시는 같은 가격이면 함께 달리고,
    //   그 자리를 우리가 더 싸게 뺏으면 상대(프로그램을 쓰는 판매자 포함)와 쓸데없는 출혈 경쟁이 시작됨
    if (d > 0 && out.ref.isFirst) { R.push(`기준이 목록 맨 위(최저가 표시) — 동가 우선이라 ${T.name} 할인 ${Math.round(d * 100)}%는 하지 않음`); d = 0; }
    let target = d > 0 ? snapDown(base * (1 - d)) : base;
    if (d > 0) rule += ` → ${T.name} 할인 ${Math.round(d * 100)}%`;
    // 할인을 해도 같은 등급 유효 매물이 맨 위에 있으면 그 가격 밑으로는 내리지 않음 (함께 최저가 표시, 뺏지 않음)
    if (first && first.grade === listing.grade && allow.has(first.color) && target < first.price && ref.conv == null) { R.push(`맨 위 유효 매물(${first.sellerName || first.sellerCode || '알라딘측'}) ${first.price.toLocaleString()}원 밑으로는 내리지 않음 — 동가로 최저가 표시만 함께`); target = first.price; }

    // 8. 하한선 (알라딘 매입가만)
    const F = floors(listing, tier, ctx, S); out.floors = F;
    if (F.ignored) R.push(`알라딘 매입가 무시 — ${F.ignored.map((x) => `${x.g} ${x.why}`).join(' · ')} (하한에 안 씀)`);
    let floored = false;
    if (F.fBuyback && target < F.fBuyback) {
      const gap = (F.fBuyback - target) / F.fBuyback;
      if (gap >= S.buybackTolerance) { R.push(`목표가 ${target.toLocaleString()}원이 알라딘 매입가 하한가 ${F.fBuyback.toLocaleString()}원보다 ${Math.round(gap * 100)}% 낮음 → 하한가에 멈춤 (알라딘 매입가 ${F.buyback.toLocaleString()}원 — ${F.floorMargin ? `이 가격에 팔면 직접 팔아 남는 돈이 매입가보다 기준 차액 ${F.margin.toLocaleString()}원 넘게 많지 않음 · 알라딘 매입 후보` : '이 가격에 팔면 알라딘에 파는 것보다 덜 남음'})`); out.preFloor = target; /* (웹앱 11/05) 하한가로 올리기 전 시장대로 정한 값 — 알라딘 매입 근삿값 판정이 씀 */ target = F.fBuyback; floored = true; out.sellToAladin = true; block.push('알라딘 매입가 하한'); }
      else R.push(`목표가가 알라딘 매입가 하한가보다 ${Math.round(gap * 100)}% 낮지만 ${Math.round(S.buybackTolerance * 100)}% 안이라 최저가를 그대로 맞춤`);
    }

    if (out.worseCheapest && out.worseCheapest.price + out.worseCheapest.ship < target + ourShip) R.push(`참고: 상태가 낮은 ${out.worseCheapest.grade} 매물(${out.worseCheapest.sellerName || ''})이 ${out.worseCheapest.price.toLocaleString()}원 + 배송 ${out.worseCheapest.ship.toLocaleString()}원으로 더 쌈 — 상태 이점이 있어 기준으로 삼지 않음 (판단 기록으로 확인 중)`);
    // 9. 바꿀 만한가: 한 단위 미만 차이는 그대로. 단 기준 가격을 넘나드는 변화(순위가 바뀜)는 바꿈
    const cur = listing.price; const delta = target - cur; const crosses = ref.conv == null && ((cur > ref.price && target <= ref.price) || (cur <= ref.price && target > ref.price));
    out.target = target; out.delta = delta; out.deltaPct = cur ? delta / cur : null; out.rule = rule; out.discount = d;
    if (delta === 0 || (Math.abs(delta) < priceStep(cur) && !crosses)) { R.push(`지금 가격 유지 (${rule})`); return done('ok', { action: 'none' }); }
    if (delta < 0 && refYoung) { R.push(`기준 매물이 ${S.confirmHours}시간 안에 새로 나타남 — 확정될 때까지 내리지 않음`); return done('wait', { action: 'none', why: 'refYoung' }); }
    if (delta < 0 && (listing.protect || rare)) { R.push('보호·희소 상품 — 자동으로는 내리지 않음 (관리자 결정)'); block.push(listing.protect ? '보호 재고' : '희소 후보'); }
    if (special) block.push(`특별판 키워드(${hits.join(', ')})`);
    if (delta < 0 && -out.deltaPct > S.maxAutoDropPct) block.push(`한 번에 ${Math.round(-out.deltaPct * 100)}% 인하`);
    if (delta > 0 && out.deltaPct > S.maxAutoRaisePct) block.push(`한 번에 ${Math.round(out.deltaPct * 100)}% 인상`);
    R.push(`${delta > 0 ? '올림' : '내림'} ${cur.toLocaleString()} → ${target.toLocaleString()}원 (${rule})`);
    return done(floored ? 'floor' : 'ok', { action: 'set' });
  }

  // (sv1 11/10) 🧭 판매자 가치 그림자 — 같은 입력을 판매자 가치 무게로 한 번 더 판정해 요약만 붙임(지금 판정·값·상태는 그대로)
  //  넘기는 기준(셈 식)은 research/ENGINES PEER_W.md · 매일 엔진 한 걸음(peer_w.py)이 그림자 기록과 판매 결과를 맞대 무게를 고침
  const PEER_NOSET = {}; const PEER_SET = new WeakMap();
  function peerShadowOf(out, listing, market, sellers, ctx, S) {
    if (!S.peerShadow || S.peerUse || ctx._peerShadow || ctx.classify || out.status === 'skip') return; const RSx = rsOf(ctx); if (!RSx || !RSx.peerW) return;
    const base = ctx.settings && typeof ctx.settings === 'object' ? ctx.settings : PEER_NOSET; let SS = PEER_SET.get(base); if (!SS) { SS = { ...(base === PEER_NOSET ? {} : base), peerUse: true, peerShadow: false }; PEER_SET.set(base, SS); } /* 같은 설정이면 같은 그림자 설정 객체(설정 합치기 기억이 맞게) */
    try { const d = decide(listing, market, sellers, { ...ctx, _peerShadow: true, settings: SS });
      out.peerShadow = { status: d.status, action: d.action, target: d.target ?? null, ref: d.ref ? { sc: d.ref.sellerCode || null, price: d.ref.price, color: d.ref.color } : null, same: (d.target ?? null) === (out.target ?? null) && d.action === out.action, inPool: d.counts ? d.counts.inPool : null, ev: !!ctx.peerEv };
    } catch (e) { out.peerShadow = { err: String(e && e.message || e).slice(0, 120) }; }
  }

  // 실험 묶음: 상품코드를 0~99 칸에 고정 배정 (FNV 해시). 0..treat-1 = 적용, 그다음 control 칸 = 비교군(판정만 기록, 절대 안 바꿈), 나머지 = 꺼짐
  function bucketOf(code) { let h = 2166136261; const s = String(code || ''); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h % 100; }
  function groupOf(code, S0) { const S = mergeD(S0); const b = bucketOf(code); const tp = S.rollout.treatPct, cp = S.rollout.controlPct;
    return b < tp ? 'treat' : b >= 100 - cp ? 'control' : 'off'; }
  // 상품 단위 묶음: 제외 관리코드(KHKDVD 등)와 보관함(PND·BAD)을 먼저 보고, 그다음 상품코드 칸으로 적용·비교·꺼짐
  // (0.11.0) 자동 제외: 관리코드 앞부분 일치(묶음 — 예 KHKDVD, BLK) 또는 상품코드(한 권씩, excludeUsed). 웹앱 '자동 제외 관리'에서 켜고 끄고 더하고 뺌
  function isExcluded(listing, S0) { const S = mergeD(S0); const sku = String((listing && listing.sku) || '').toUpperCase(); const uc = String((listing && (listing.usedCode || '')) || '');
    return (S.excludeSku || []).some((x) => x && sku.startsWith(String(x).toUpperCase())) || (!!uc && (S.excludeUsed || []).some((x) => String(x) === uc)); }
  function groupOfListing(listing, S0) {
    if (!listing) return 'off'; const tag = skuTag(listing.sku); if (tag) return tag; if (isExcluded(listing, S0)) return 'excluded';
    if (listing.status && listing.status !== '판매중') return 'off'; return groupOf(listing.usedCode || listing.key, S0);
  }
  function autoAllowed(o, S) {
    if (S.autoLevel === 'L0') { o.autoBlock.push('자동 단계 L0 (전부 사람 확인)'); return false; }
    if (S.autoLevel === 'L1' && Math.abs(o.deltaPct || 0) > 0.15) { o.autoBlock.push('L1: 15% 넘는 변경은 사람 확인'); return false; }
    return true;
  }

  /* (0.18.0) 추격자 찾기(chaseEvents·chaseState·sellerChase)는 맨 아래 🎯 추격자 엔진(ReadnowChase)으로 옮김 — 이름은 api에 그대로 남김 */

  // ───────────────────────── 최저가 등록 기간 ─────────────────────────
  // 하루 관측(확정된 것)마다 호출. atLowest = 그 관측에서 우리 매물이 기준(유효 최저가·맨 위 동가) 자리였는가 (decide 결과 action 'none' + status 'ok' 또는 방금 그 자리로 맞춘 뒤 확정)
  // 두 관측이 모두 최저가였고 간격이 lowestMaxGapHours 이하일 때만 그 사이 시간을 더함 → 정확히 아는 시간만 셈. 처음 관측부터 측정 시작(measured=true)
  function trackLowest(state, obs, S0) {
    const S = mergeD(S0); const st = state ? { ...state } : { days: 0, measured: true, since: obs.at, lastAt: null, lastLowest: false, obsN: 0 };
    const at = t(obs.at); const prev = st.lastAt ? t(st.lastAt) : null;
    if (prev != null && at <= prev) return st; // 같은·옛 관측은 무시
    if (prev != null && st.lastLowest && obs.atLowest && at - prev <= S.lowestMaxGapHours * HOUR) st.days = Math.round((st.days + (at - prev) / DAY) * 1000) / 1000;
    st.lastAt = new Date(at).toISOString(); st.lastLowest = !!obs.atLowest; st.obsN = (st.obsN || 0) + 1; return st;
  }

  /* (0.12.0) 같은 등급 최저가 동가 (수동 일괄 처리 기준 '같은 등급 동가') — 배송비는 보지 않고 판매가끼리만
   *  상태 등급: 최상 > 상 > 중 (최상이 가장 좋음 = 가장 비싸야 함). 우리 등급 G일 때
   *  ① 기준 = 허용 판매자(유효·알라딘측 등) 매물 중 G와 같은 등급의 최저 판매가 → 그 값과 완전히 같게
   *  ② 더 좋은 등급(G보다 위) 매물이 그보다 싸면(useBetter): 소비자는 더 좋은 상태를 사므로 그 판매가 × 등급 계수(우리/그쪽)로 환산, 그 판매가보다 반드시 한 단위 아래 — 더 좋은 상태보다 비싸거나 같게 두지 않음
   *  ③ 더 나쁜 등급(G보다 아래) 매물은 기준으로 삼지 않음 (우리가 더 좋은 상태라 그보다 비싸도 됨) — 우리 값보다 싸면 이유에 알림만
   *  rows: [{ g, p, ok }] (ok = 기준으로 써도 되는 판매자) · 알라딘측 균일가처럼 등급 글자가 없는 것은 부르는 쪽에서 '중'으로 넘김 */
  function sameGradeMatch(grade, rows, opt) { const o = opt || {}; const coef = o.coef || DEFAULTS.gradeCoef; const R = []; const myR = GRADE_RANK[grade];
    if (myR == null) return { t: null, reasons: [`우리 상태 등급(${grade || '없음'})을 몰라 같은 등급을 고를 수 없음`] };
    const ok = (rows || []).filter((r) => r && r.ok && r.p > 0 && GRADE_RANK[r.g] != null);
    const same = ok.filter((r) => r.g === grade).sort((a, b) => a.p - b.p)[0] || null; let t = same ? same.p : null;
    if (same) R.push(`같은 등급(${grade}) 유효 최저가 ${same.p.toLocaleString()}원과 동가 (배송비는 보지 않음)`); else R.push(`첫 페이지에 같은 등급(${grade}) 유효 매물이 없음`);
    if (o.useBetter !== false) { let bb = null; for (const r of ok) { if (GRADE_RANK[r.g] <= myR) continue; const c0 = coef[r.g], c1 = coef[grade]; let v = c0 && c1 ? snapDown(r.p * (c1 / c0)) : stepDown(r.p); if (!(v < r.p)) v = stepDown(r.p); if (!bb || v < bb.v) bb = { r, v }; }
      if (bb && (t == null || bb.v < t)) { R.push(`더 좋은 등급(${bb.r.g}) 매물 ${bb.r.p.toLocaleString()}원이 ${t == null ? '있음' : '더 쌈'} → ${grade} 값으로 환산 ${bb.v.toLocaleString()}원 (× ${coef[grade]}/${coef[bb.r.g]}, 그 매물보다 반드시 낮게)`); t = bb.v; } }
    if (t != null) { const w = ok.filter((r) => GRADE_RANK[r.g] < myR && r.p < t).sort((a, b) => a.p - b.p)[0]; if (w) R.push(`더 낮은 등급(${w.g}) 매물 ${w.p.toLocaleString()}원이 더 싸지만 따라가지 않음 (우리 상태가 더 좋음)`); }
    return { t, reasons: R }; }
  /* ───────────── (0.13.0) 조건 묶음(수동 일괄 처리 · 반자동 감시가 같이 씀 — 한 곳) ─────────────
   *  crit = { mode: 'valid'|'same'|'top'|'topAny'|'under'|'shipMin'|'charm'|'newPct' (0.15.0), underScope, underRank, newPct, colors: ['yellow'…], pct, better, coef, bb, minPrice, maxDrop, topNearOn, topNear }
   *  critSettings(crit): 엔진(decide)을 이 조건으로 돌릴 설정 — 기준 판매자 색, 등급 계수, 매입가 하한, 할인 없음, 24시간 확정 없음(eng로 덮어씀)
   *  critTarget(listing, page1, d, crit, ctx, buyback): 첫 페이지(우리 판매자 분류 c 포함)·엔진 결과 d로 이 조건의 추천가 → { t, reasons, bbHit, floor } */
  const CHARM_TH = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 12000, 15000, 20000, 25000, 30000, 40000, 50000]; // 사람이 '앞자리가 바뀌었다'고 느끼는 경계 (관찰 도구 '경계 바로 위 가격' 칸과 같은 목록 — 한 곳)
  function critSettings(c0, eng) { const c = c0 || {}; const colors = ['dkgreen', 'green', ...(c.colors || [])]; const tiers = {}; for (const k of Object.keys(DEFAULTS.tiers)) tiers[k] = { ...DEFAULTS.tiers[k], colors, disc: [0, 0] };
    const S = { tiers, tierBounds: [0, 1e9, 1e9 + 1, 1e9 + 2, 1e9 + 3, 1e9 + 4, 1e9 + 5], cutoverAt: null, tempTierCap: 'T7', gradeCoef: c.coef || DEFAULTS.gradeCoef, useBetterGrade: !!c.better, advPct: 0, staleHours: 24 * 400, confirmHours: 0, queueGapMult: 999, useYes24Proxy: false, excludeSku: [], buybackGrades: c.bb ? ['최상', '상'] : [], buybackTolerance: 0, rareMaxValid: -1, rareMaxAll: -1, specialKeywords: [] };
    const e = eng || {}; if (e.confirmHours != null) S.confirmHours = +e.confirmHours; if (e.discOn) for (const k of Object.keys(tiers)) tiers[k].disc = DEFAULTS.tiers[k].disc; return S; }
  /* (정범님 10/30) 📐 시장 전체 팔린 비율(클라우드 ratioStudy → app_settings/ratio_study.cells) — 무리 열쇠 '새책 상태|중고 수 구간|분야' · 칸 [n, 중앙, p75, p90, p95, p99, 최대]
   *  웹앱(soloCtx·💎 희귀본)과 이 파일이 같은 무리 나누기·이름·분위 고르기를 씀 */
  const RATIO_QK = [0.5, 0.75, 0.9, 0.95, 0.99, 1]; function ratioQ(a, k) { if (!Array.isArray(a) || !(a[0] > 0)) return null; let i = RATIO_QK.findIndex((x) => x >= k - 1e-9); if (i < 0) i = 5; return +a[1 + i] || null; }
  const RG_AV = { oop: '절판·품절', on: '새책 판매중', old: '구판·합본절판', unk: '새책 상태 모름' }, RG_U = { u0: '알라딘 중고 0~2', u3: '알라딘 중고 3~9', u10: '알라딘 중고 10~29', u30: '알라딘 중고 30+', 'u?': '중고 수 모름' }, RG_C = { comic: '만화·라노벨', etc: '그 밖 분야' };
  function ratioGroupName(k) { const [a, u, c] = String(k || '*|*|*').split('|'); const L = [RG_AV[a], RG_U[u], RG_C[c]].filter(Boolean); return L.length ? L.join(' · ') : '시장 전체'; }
  function ratioAv(a) { a = String(a || ''); if (!a) return 'unk'; if (/^(구판|합본)절판/.test(a)) return 'old'; if (a === 'onSale' || /일시품절/.test(a)) return 'on'; if (/^절판|품절/.test(a)) return 'oop'; return 'on'; }
  function ratioUb(u) { return u == null || u === '' || !isFinite(+u) ? 'u?' : +u <= 2 ? 'u0' : +u <= 9 ? 'u3' : +u <= 29 ? 'u10' : 'u30'; }
  function ratioPick(cells, av, used, comic, minN) { if (!cells) return null; const a = ratioAv(av), u = ratioUb(used), c = comic ? 'comic' : 'etc'; const n0 = +minN > 0 ? +minN : 20; for (const k of [`${a}|${u}|${c}`, `${a}|${u}|*`, `${a}|*|*`, '*|*|*']) { const x = cells[k]; if (x && x.sold && x.sold[0] >= n0) return { k, g: x, name: ratioGroupName(k) }; } return null; }
  const RSRC = { ours: '우리 판매', ext: '장터 판매완료', bench: '벤치 숍 사라짐', p1: '남의 첫 쪽 사라짐', al: '알라딘측 사라짐', look: '조회 첫 쪽 사라짐' };
  function ratioSrcText(s) { const o = typeof s === 'string' ? Object.fromEntries([...s.matchAll(/([a-zA-Z0-9]+):(\d+)/g)].map((m) => [m[1], +m[2]])) : s || {}; return Object.entries(o).filter(([x]) => RSRC[x]).map(([x, n]) => `${RSRC[x]} ${(+n).toLocaleString()}`).join(' · '); }
  /* (0.17.0 정범님 10/30) 🏝 soloHigh — 시장(첫 쪽)에 우리 매물만 있을 때 올릴 근거를 찾아 추천가를 정함. 내리지 않음(지금 가격이 바닥).
   *  근거(ctx.solo — 웹앱이 우리 판매 기록으로 만듦): book.max = 이 책(같은 ISBN)을 우리가 판 가장 높은 값 · allR/oopR = 우리 판매의 '판매가/정가' 비율 목록(전체 / 판매 때 새책이 안 팔리던 = 절판·품절 책) · maxR = 우리가 판 가장 높은 정가 비율(상한)
   *  ① 같은 책을 그 값에 판 적이 있으면 그 값  ② 같은 처지(절판·품절이면 그 무리) 우리 판매 비율의 상위 soloQ 분위(기본 0.75 · 근거: 우리 판매 분포 · 설정 crit.soloQ로 바꿈) × 정가
   *  상한: 정가 × maxR(받아 본 가장 높은 비율 — 지어낸 배수 아님) · 새책이 지금 팔리면 우리 결제 총액 ≤ 새책 결제 총액(알라딘 판매가+새책 배송) − 100원  · 근거가 하나도 없으면 지금 가격 유지 */
  function soloHigh(l, c0, ctx) { const c = c0 || {}; const R = []; const st = (ctx && ctx.solo) || {}; const lp = +(l.priceList || (ctx && ctx.priceList) || 0); const cur = +l.price || 0; const ps = +((ctx && ctx.priceSales) || l.priceSales || 0); const oop = !!(ctx && ctx.oop);
    const q = (a, k) => { const v = (a || []).filter((x) => x > 0).sort((x, y) => x - y); if (v.length < 5) return null; return v[Math.min(v.length - 1, Math.floor(k * (v.length - 1)))]; };
    R.push(`🏝 첫 쪽에 우리 매물뿐(남의 매물 없음) — 맞출 기준이 없으니 깎지 않고 올릴 근거를 찾음${oop ? ' · 새책이 안 팔림(절판·품절)' : ''}`);
    if (!lp) { R.push('정가를 몰라 비율 근거를 못 씀 — 지금 가격 유지'); return { t: cur || null, reasons: R }; }
    /* (정범님 10/30 📐) 시장 전체 근거 먼저 — ctx.solo.market(웹앱이 클라우드 ratioStudy 결과로 넣음): g = 이 책 무리의 '팔린 값 ÷ 정가' 분포(우리·장터·벤치 사라짐·첫 쪽 사라짐·알라딘측·조회) · book = 이 ISBN이 시장에서 팔린 최고값 m(근거 n건 · 확정 c = 우리·장터)
     *  ① 이 책이 시장에서 팔린 가장 높은 값  ② 무리 분포의 soloQ 분위(기본 0.75) × 정가  · 상한 = 무리 분포의 soloCapQ 분위(기본 0.95 — 근거: 우리 판매 10,339건에서 p99·최대는 한두 건(정가 18배 하나 등)이 정하고 p95는 절판·품절·중고 ≤9 무리에서 2.3~5배로 '정가 3배에 팔리는 희귀본'을 막지 않음) × 정가
     *  단 같은 책이 확정(우리·장터)으로 그보다 높게 팔렸으면 그 값까지 · 우리 기록(같은 책 우리 판매가·우리 판매 비율)은 (참고)로 함께 */
    const mk = st.market || null; const cf = (mk && mk.cfg) || {}; const pk = (a, b, d0, hi) => (+a > 0 && +a <= hi ? +a : +b > 0 && +b <= hi ? +b : d0); /* 설정: 조건(crit.soloQ·soloCapQ·soloMinN)이 먼저, 없으면 웹앱 💎 희귀본 쪽 설정(app_settings/ratio_cfg q·capQ·minN) */ const minN = pk(c.soloMinN, cf.minN, 20, 1e9); const k = pk(c.soloQ, cf.q, 0.75, 0.999); const capK = pk(c.soloCapQ, cf.capQ, 0.95, 1); const pct = (x) => `${Math.round((1 - x) * 100)}%`;
    const mg = mk && mk.g && mk.g.sold && mk.g.sold[0] >= minN ? mk.g : null; const mb = mk && mk.book && +mk.book.m > 0 ? mk.book : null; const ev = []; const ref = []; const mbOk = !!(mb && (+mb.c > 0 || (+mb.n || 1) >= 2)); /* (0.17.4) 사라진 매물 1건뿐인 같은 책 근거는 시장 근거로 치지 않음 */
    if (mg || mbOk) { if (mb) { /* (0.17.4 · 11/01 정밀 점검 알림) 같은 책 근거 등급 — 확정(우리·장터 판매)은 그 값을 목표로 · 추정(사라진 매물 = 팔렸을 수도 내렸을 수도)은 2건 이상일 때만 목표 · 1건뿐이면 참고로만(예전: 사라진 매물 1건으로 정가 2~9.9배를 추천할 수 있었음) */ const nE = +mb.n || 1; if (+mb.c > 0) ev.push({ t: +mb.c, why: `이 책이 실제로(우리·장터) ${(+mb.c).toLocaleString()}원(정가의 ${(mb.c / lp).toFixed(2)}배)에 팔림 · 근거 ${nE}건(${ratioSrcText(mb.s) || '출처 모름'})` }); else if (nE >= 2) ev.push({ t: +mb.m, why: `이 책이 시장에서 ${(+mb.m).toLocaleString()}원(정가의 ${(mb.m / lp).toFixed(2)}배)에 팔림(사라진 매물 값 — 팔림 추정) · 근거 ${nE}건(${ratioSrcText(mb.s) || '출처 모름'})` }); else ref.push(`이 책의 사라진 매물 ${(+mb.m).toLocaleString()}원(정가의 ${(mb.m / lp).toFixed(2)}배) 1건 — 팔렸는지 내렸는지 몰라 목표로 쓰지 않음(2건 이상이거나 실제 판매면 씀)`); }
      if (mg) { const r2 = ratioQ(mg.sold, k); if (r2) ev.push({ t: snapDown(lp * r2), why: `시장 전체 팔린 비율 — ${mk.name || ratioGroupName(mk.k)} ${mg.sold[0].toLocaleString()}건(${ratioSrcText(mg.src) || '-'})의 상위 ${pct(k)} 선 ${r2.toFixed(2)}배` }); }
      if (st.book && +st.book.max > 0) ref.push(`우리가 이 책을 ${(+st.book.max).toLocaleString()}원(정가의 ${(st.book.max / lp).toFixed(2)}배)에 판 적 있음${st.book.n ? ` · ${st.book.n}권` : ''}`);
      { const arr = oop && (st.oopR || []).length >= 5 ? st.oopR : st.allR; const r3 = q(arr, k); if (r3) ref.push(`우리 판매 ${arr.length}권(${arr === st.oopR ? '절판·품절 책' : '전체'})만 보면 상위 ${pct(k)} 선 ${r3.toFixed(2)}배 · 우리 최고 ${(+st.maxR || 0).toFixed(2)}배`); }
      if (mg && mg.ask && mg.ask[0] > 0) ref.push(`같은 무리의 부르는 값(호가 · 팔린 값 아님 — 확인용) ${mg.ask[0].toLocaleString()}개: 가운데 ${(+mg.ask[1]).toFixed(2)}배 · 상위 10% ${(+mg.ask[3]).toFixed(2)}배`); }
    else { if (mb && !mbOk) R.push(`(참고) 이 책의 사라진 매물 ${(+mb.m).toLocaleString()}원 1건 — 팔렸는지 몰라 근거로 쓰지 않음`); if (st.book && +st.book.max > 0) ev.push({ t: +st.book.max, why: `이 책을 우리가 ${(+st.book.max).toLocaleString()}원(정가의 ${(st.book.max / lp).toFixed(2)}배)에 판 적 있음${st.book.n ? ` · ${st.book.n}권` : ''}` });
      const arr = oop && (st.oopR || []).length >= 5 ? st.oopR : st.allR; const r2 = q(arr, k);
      if (r2) ev.push({ t: snapDown(lp * r2), why: `우리 판매 ${arr.length}권(${arr === st.oopR ? '절판·품절 책' : '전체'})의 정가 비율 상위 ${pct(k)} 선 ${r2.toFixed(2)}배` }); if (mk) R.push(`(시장 전체 근거 없음 — ${mk.g ? `무리 근거 ${mk.g.sold ? mk.g.sold[0] : 0}건 < ${minN}건` : '연구 결과를 아직 못 받음'} · 우리 기록으로)`); }
    if (!ev.length) { R.push('시장·우리 판매 근거가 없음(연구 결과·주문 자료를 못 읽었거나 비슷한 판매가 적음) — 지금 가격 유지'); return { t: cur || null, reasons: R }; }
    const best = ev.reduce((a, b) => (b.t > a.t ? b : a)); let t = best.t; R.push(`근거: ${best.why}`); for (const e of ev) if (e !== best) R.push(`(참고) ${e.why}`); for (const x of ref) R.push(`(참고) ${x}`);
    if (mg || mbOk) { const capR = mg ? ratioQ(mg.sold, capK) : null; const conf = Math.max(mb && +mb.c > 0 ? +mb.c : 0, st.book && +st.book.max > 0 ? +st.book.max : 0); const capT = Math.max(capR ? lp * capR : 0, conf, !mg ? lp * (+st.maxR || 0) : 0);
      if (capT > 0 && t > capT) { t = snapDown(capT); R.push(capT === conf && conf > 0 ? `상한: 이 책이 실제로 팔린(우리·장터) 가장 높은 값 → ${t.toLocaleString()}원` : capR && capT === lp * capR ? `상한: 시장 전체 팔린 비율(${mk.name || ratioGroupName(mk.k)})의 상위 ${pct(capK)} 선 ${capR.toFixed(2)}배 → ${t.toLocaleString()}원` : `상한: 우리가 실제로 받아 본 가장 높은 정가 비율 ${(+st.maxR).toFixed(2)}배 → ${t.toLocaleString()}원`); } }
    else { const hiR = +st.maxR || 0; if (hiR > 0 && t > lp * hiR) { t = snapDown(lp * hiR); R.push(`상한: 우리가 실제로 받아 본 가장 높은 정가 비율 ${hiR.toFixed(2)}배 → ${t.toLocaleString()}원`); } }
    if (ps > 0 && !oop) { /* (0.17.2 정범님 10/30) 새책 79% 제한 없앰 — '새책보다 싸기만 하면 됨 · 알라딘 판매가(할인 적용)에 배송비를 더해 견줘 100원만 싸도 우리 것을 살 수 있음' → 우리 결제 총액(판매가+우리 배송비) ≤ 새책 결제 총액 − 100원
       *  새책 배송: ctx.newShip { fee, freeOver }(웹앱 설정 · 기본 알라딘 국내도서 1만 5천 원 이상 무료·아니면 2,500원 — 바뀌면 설정에서) · 우리 배송: ctx.policy { fee, freeOver, paidOnly } */
      const ns = (ctx && ctx.newShip) || {}; const nFee = ns.fee != null ? +ns.fee : 2500, nFree = ns.freeOver != null ? +ns.freeOver : 15000; const newTot = ps + (ps >= nFree ? 0 : nFee); const pol = (ctx && ctx.policy) || {}; const oFee = pol.fee != null ? +pol.fee : 0; const oFree = pol.paidOnly ? Infinity : pol.freeOver != null ? +pol.freeOver : Infinity;
      const lim = newTot - 100; const c1 = lim >= oFree ? lim : null; const c2 = lim - oFee < oFree ? lim - oFee : null; const cap = Math.floor(Math.max(c1 || 0, c2 || 0) / 10) * 10;
      if (cap > 0 && t > cap) { t = cap; R.push(`새책이 ${ps.toLocaleString()}원(배송 ${(newTot - ps).toLocaleString()}원 · 결제 ${newTot.toLocaleString()}원)에 팔리는 중 — 우리 결제 총액이 그보다 100원 싸게: 판매가 ${cap.toLocaleString()}원 + 배송 ${(cap >= oFree ? 0 : oFee).toLocaleString()}원`); } }
    if (cur && t <= cur) { R.push(`근거 값 ${t.toLocaleString()}원이 지금 가격 이하 — 깎지 않고 지금 가격 유지`); t = cur; } else R.push(`→ ${t.toLocaleString()}원으로 올려 봄(지금 ${cur.toLocaleString()}원 · 최대 인상 % 조건이 있으면 그만큼만)`);
    return { t, reasons: R, ev }; }
  function critTarget(l, page1, d, c0, ctx, buyback) { const c = c0 || {}; const R = []; const out = { t: null, reasons: R, bbHit: null, floor: 0 }; const coef = c.coef || DEFAULTS.gradeCoef;
    const colors = ['dkgreen', 'green', ...(c.colors || [])]; const allow = new Set([...colors, 'aladin']); const gOf = (w) => (w.c === 'aladin' && !(w.g in GRADE_RANK) ? '중' : w.g); // 알라딘측 균일가 = 중 (엔진과 같은 기준)
    let P = (page1 || []).filter((w) => w); let t = null; const mode = c.mode || 'valid';
    /* (0.17.17 memo1 · 정범님 11/18 I-1118-2255-30) 📝 판단 메모 — ctx.memoD(묶음) 또는 ctx.memos(기록들) · 메모로 뺀 판매자 매물은 시장에서 뺌 · 규칙을 못 읽으면(오류) 그 상품 판정을 세움(지금 가격) */
    let MD = null; if (ctx && (ctx.memoD || (Array.isArray(ctx.memos) && ctx.memos.length))) { try { MD = ctx.memoD || Memo.digest(ctx.memos, P); if (Memo.has(MD)) P = Memo.rowsDrop(P, MD); else MD = null; } catch (e) { out.memoErr = String((e && e.message) || e); } }
    if (out.memoErr) { const cur0 = l && l.price > 0 ? +l.price : null; R.push(`📝 메모 규칙을 읽지 못해 이 상품 판정을 세움 → 지금 가격${cur0 ? ' ' + cur0.toLocaleString() + '원' : ''} 그대로 (${out.memoErr})`); out.t = cur0; out.memo = { n: 0, used: [], need: [], wait: [], err: out.memoErr, hold: 'err' }; out.memoHold = 'err'; return out; }
    { /* (10/30 정범님 '세 기능 연계 만전' · 위험 11) 터무니없는 가격 매물 빼기 — 엔진 decide 3단계와 같은 기준(다른 매물 중앙값 × insaneMult · 정가 × insaneListMult · 2만 원 중 큰 값 초과) · 예전엔 일괄 기준(same·under·topAny)이 첫 쪽 5만 원 매물 하나를 따라 정가 1.5만 원 책에 5만 원을 추천했음 */
      const S0 = (ctx && ctx.settings) || DEFAULTS; const iM = S0.insaneMult || DEFAULTS.insaneMult || 3, iL = S0.insaneListMult || DEFAULTS.insaneListMult || 1.5;
      const ps = P.filter((w) => w.c !== 'ours' && w.p > 0).map((w) => w.p).sort((a, b) => a - b); if (ps.length) { const med = ps[Math.floor(ps.length / 2)]; const lp = +(l.priceList || (ctx && ctx.priceList) || 0); const so0 = (ctx && ctx.solo) || {}; const mkR = (so0.market && so0.market.g && ratioQ(so0.market.g.sold, +c.soloCapQ > 0 && +c.soloCapQ <= 1 ? +c.soloCapQ : +((so0.market.cfg || {}).capQ) > 0 ? +so0.market.cfg.capQ : 0.95)) || 0; const hiR = mkR > 0 ? mkR : +so0.maxR || 0; /* (정범님 10/30 📐) 상한 비율 = 시장 전체 팔린 비율(이 책 무리의 soloCapQ 분위 — 기본 p95) · 시장 자료가 없을 때만 우리가 받아 본 최고 비율(전체 최대 18배 한 건이 모든 책의 상한이 되던 것) */ /* (0.17.0 정범님 10/30) 이 거르기는 '남의 매물'만 대상(우리 것은 늘 남김) · 남의 매물이 3개 미만이면 중앙값이 그 매물 자신이라 못 거르므로 중앙값 대신 정가 × 1.5와 '우리가 실제로 판 가장 높은 정가 비율'로 상한 */ const cap = ps.length < 3 ? Math.max(lp * iL, lp * hiR, 20000) : Math.max(med * iM, lp * iL, 20000); const n0 = P.length; const cut = P.filter((w) => w.c !== 'ours' && w.p > cap); if (cut.length) out.cutHi = Math.max(...cut.map((w) => w.p)); P = P.filter((w) => w.c === 'ours' || !(w.p > 0) || w.p <= cap); if (P.length < n0) R.push(`남의 터무니없는 가격 ${n0 - P.length}건 뺌(${Math.round(cap).toLocaleString()}원 넘음${ps.length < 3 ? ' · 남의 매물이 적어 정가·팔린 비율(우리·시장 전체) 상한으로' : ''})`); } }
    if (mode === 'valid') R.push(...((d && d.reasons) || []).filter((x) => !/희소|보호/.test(x))); // 최상단 배치·같은 등급 동가는 엔진 이유를 섞지 않음
    /* (0.15.1) '무조건 최상단 배치' = 말 그대로 첫 페이지 맨 위(우리 것 빼고 · 판매자 색·등급·배송비 가리지 않음)와 동가 — 예전엔 '기준 판매자'로 고른 색만 봐서, 노랑·주황·빨강 매물이 맨 위면 그 아래 매물을 기준으로 삼아 '이미 부합'·'추천 못 함'이 나왔음. 하한선(매입가·최소 판매가·최대 인하)·처리 기준(내림만 등)은 이 뒤에 그대로 */
    if (mode === 'top') { const top = P.find((w) => w.c !== 'ours' && w.p > 0); if (top) { t = top.p; R.unshift(`최상단 배치: 첫 페이지 맨 위 ${top.n || (top.c === 'aladin' ? '알라딘측' : '매물')} ${gOf(top) || ''} ${(top.p || 0).toLocaleString()}원과 판매가 동가 (판매자·등급·배송비 가리지 않음)`); if (GRADE_RANK[gOf(top)] != null && GRADE_RANK[l.grade] != null && GRADE_RANK[gOf(top)] < GRADE_RANK[l.grade]) R.push(`⚠ 맨 위 매물은 우리(${l.grade})보다 낮은 등급(${gOf(top)}) — 우리 더 좋은 상태를 그 값에 맞춤`); } else R.unshift('최상단 배치: 첫 페이지에 다른 매물이 없음'); }
    else if (mode === 'same') { const m = sameGradeMatch(l.grade, P.filter((w) => w.c !== 'ours').map((w) => ({ g: gOf(w), p: w.p, ok: allow.has(w.c) })), { coef, useBetter: !!c.better }); t = m.t; R.unshift(...m.reasons); }
    /* (0.15.0) 알라딘 관찰 도구 칸 → 수동 일괄 처리 그룹이 쓰는 기준 (칸이 요구하는 자리를 그대로 목표로)
     *  topAny  맨 위 매물(판매자·배송비 가리지 않음, 우리 것 빼고)과 판매가 동가 — '근소한 차이로 1위를 놓침'·'최상단'
     *  under   기준 매물 바로 한 단위 아래 — underScope: any(전체)·valid(유효, 등급 상관없이)·same(유효 같은 등급), underRank n: 싼 쪽에서 n번째 매물 아래(n위 안 유지)
     *          (우리가 이미 그 자리면 = 자리를 지키면서 올릴 수 있는 만큼 올림 · '너무 싸게 둔 1위'·'세 칸 안'·'유효 최저가')
     *  shipMin 판매가 + 배송비가 유효 매물(기준 판매자) 중 최저와 같게 — 우리 배송비 = 정책(무료 기준 이상이면 0, 아니면 기본 배송비), 결제 총액 동가라 단위 예외(10원)
     *  charm   경계 바로 위 가격(5,000·10,100 등) → 경계 아래 단위 가격(4,900·9,900, 1만 원대는 그 단위로 11,500 등)
     *  newPct  새책 판매가의 newPct%(기본 79 — 80% 밑) 단위 가격 — 새책 값을 모르면 계산 안 함
     *  reach(옵션) 하한선(매입가·최소 판매가·최대 인하) 때문에 목표까지 못 내리면 내리지 않고 지금 가격 유지 — 목표 자리에 서지 못하는 어중간한 인하 막음 */
    else if (mode === 'topAny') { const top = P.find((w) => w.c !== 'ours' && w.p > 0); if (top) { t = top.p; R.unshift(`맨 위 매물과 동가: ${top.n || (top.c === 'aladin' ? '알라딘측' : '매물')} ${gOf(top) || ''} ${top.p.toLocaleString()}원 (판매자·배송비 가리지 않음)`); if (GRADE_RANK[gOf(top)] != null && GRADE_RANK[l.grade] != null && GRADE_RANK[gOf(top)] < GRADE_RANK[l.grade]) R.push(`⚠ 맨 위 매물은 우리(${l.grade})보다 낮은 등급(${gOf(top)})`); } else R.unshift('첫 페이지에 다른 매물이 없음 — 맞출 맨 위가 없음'); }
    else if (mode === 'under') { const sc = c.underScope || 'any'; const n = Math.max(1, +c.underRank || 1); const pool = P.filter((w) => w.c !== 'ours' && w.p > 0 && (sc === 'any' || allow.has(w.c)) && (sc !== 'same' || gOf(w) === l.grade)).sort((a, b) => a.p - b.p); const ref = pool[n - 1]; const nm = { any: '전체', valid: '유효', same: `유효 같은 등급(${l.grade})` }[sc];
      if (ref) { t = stepDown(ref.p); R.unshift(`${nm} 매물 중 싼 쪽 ${n}번째 ${ref.n || (ref.c === 'aladin' ? '알라딘측' : '')} ${gOf(ref) || ''} ${ref.p.toLocaleString()}원보다 한 단위 아래 → ${t.toLocaleString()}원 (${n === 1 ? '맨 위' : n + '위 안'} 유지)`); } else { t = l.price ?? null; R.unshift(`${nm} 매물이 첫 페이지에 ${pool.length}개뿐 — ${n}번째 기준이 없어 지금 가격 유지`); } }
    else if (mode === 'shipMin') { const pol = (ctx && ctx.policy) || {}; const me = P.find((w) => w.c === 'ours'); const fee = pol.fee != null ? +pol.fee : me && me.s != null ? +me.s : l.ship != null ? +l.ship : 0; const fo = pol.paidOnly ? null : pol.freeOver != null ? +pol.freeOver : null;
      const vt = P.filter((w) => w.c !== 'ours' && allow.has(w.c) && w.p > 0).map((w) => ({ w, tot: w.p + (+w.s || 0) })).sort((a, b) => a.tot - b.tot)[0];
      if (!vt) R.unshift('유효 매물이 첫 페이지에 없음 — 결제 총액 기준을 정할 수 없음'); else { const cand = []; if (fo != null && vt.tot >= fo) cand.push({ p: vt.tot, s: 0 }); const p2 = vt.tot - fee; if (p2 > 0 && (fo == null || p2 < fo)) cand.push({ p: p2, s: fee }); const best = cand.sort((a, b) => b.p - a.p)[0];
        if (best) { t = Math.floor(best.p / 10) * 10; R.unshift(`결제 총액 동가: 유효 최저 총액 ${vt.w.n || (vt.w.c === 'aladin' ? '알라딘측' : '')} ${vt.w.p.toLocaleString()} + 배송 ${(+vt.w.s || 0).toLocaleString()} = ${vt.tot.toLocaleString()}원 → 우리 ${t.toLocaleString()} + 배송 ${best.s.toLocaleString()}원${fo != null ? ` (우리 ${fo.toLocaleString()}원 이상 무료)` : ''}`); } else R.unshift(`유효 최저 총액 ${vt.tot.toLocaleString()}원보다 우리 배송비(${fee.toLocaleString()}원)가 커서 맞출 수 없음`); } }
    else if (mode === 'charm') { const cur0 = l.price || 0; const th = CHARM_TH.filter((x) => cur0 >= x && cur0 <= x + Math.max(100, x * 0.02)).pop(); if (th) { t = snapDown(th - 100); R.unshift(`경계(${th.toLocaleString()}원) 바로 위 ${cur0.toLocaleString()}원 → 경계 아래 ${t.toLocaleString()}원 (앞자리 효과)`); } else { t = cur0 || null; R.unshift('경계 바로 위 가격이 아님 — 지금 가격 유지'); } }
    else if (mode === 'newPct') { const ps = +((ctx && ctx.priceSales) || l.priceSales || 0); const k = +c.newPct > 0 ? +c.newPct : 79; if (ps > 0) { t = snapDown(ps * k / 100); R.unshift(`새책 판매가 ${ps.toLocaleString()}원의 ${k}% → ${t.toLocaleString()}원 (새책 값에 너무 가까우면 구매자가 새책을 고름)`); } else R.unshift('새책 판매가를 몰라 계산하지 않음 (시장 지표 필요)'); }
    else if (d) { t = d.action === 'set' || d.status === 'ok' || d.status === 'floor' ? (d.target ?? l.price) : null; if (d.status === 'floor') out.bbHit = { buy: (d.floors && d.floors.buyback) || null, floor: d.target ?? null }; } // 엔진의 하한선 = 알라딘 매입가 하나뿐 → 매입가 하한
    /* (0.17.0 정범님 10/30) 🏝 우리 단독 — 첫 쪽에 남의 매물이 없고 우리 것만 있으면 '맞출 기준이 없다'로 끝내지 않고, 깎을 이유가 아니라 올릴 근거를 찾음(soloHigh) · 새책 % 기준·결제 총액·경계 가격처럼 기준을 따로 고른 조건은 그대로 */
    { const oth = P.filter((w) => w.c !== 'ours' && w.p > 0); if (!oth.length && l.price > 0 && !['newPct', 'charm', 'shipMin'].includes(mode)) { const sh = soloHigh(l, c, ctx); t = sh.t; const keep = R.filter((x) => !/다른 매물이 없음|기준이 없어 지금 가격 유지|맞출 맨 위가 없음|매물이 첫 페이지에 \d+개뿐/.test(x)); R.length = 0; R.push(...sh.reasons, ...keep); if (out.cutHi) R.push(`(참고) 남이 ${out.cutHi.toLocaleString()}원에 내놓은 매물이 있음 — 팔린 값이 아니라 부르는 값이고 우리 근거 상한을 넘어 따르지 않음(값을 높게 받을 수 있다는 신호로만 봄)`); out.solo = sh; } }
    const goal = t; // (0.15.0) 조건이 정한 목표가 (기준 대비 %·처리 기준·하한선 전)
    if (t != null && +c.pct) { const k = 1 + (+c.pct) / 100; t = +c.pct < 0 ? snapDown(t * k) : snapUp(t * k); R.push(`기준 대비 ${c.pct > 0 ? '+' : ''}${c.pct}% (가격대 5% 단위 맞춤)`); }
    if (t != null && c.topNearOn && mode !== 'top' && +c.topNear > 0) { const top = P.find((w) => w.c !== 'ours' && w.p > 0); if (top && top.p !== t) { const gap = Math.abs(t - top.p) / t; if (gap <= +c.topNear / 100) { const tg = gOf(top); R.push(`최상단 동가: 맨 위 ${top.n || (top.c === 'aladin' ? '알라딘측' : '매물')} ${tg || ''} ${top.p.toLocaleString()}원이 ${t.toLocaleString()}원과 ${(gap * 100).toFixed(1)}% 차이(${c.topNear}% 이내) → 맨 위와 같게${GRADE_RANK[tg] != null && GRADE_RANK[l.grade] != null && GRADE_RANK[tg] < GRADE_RANK[l.grade] ? ` · ⚠ 맨 위는 우리(${l.grade})보다 낮은 등급` : ''}`); t = top.p; } else R.push(`최상단 동가 안 함: 맨 위 ${top.p.toLocaleString()}원과 ${(gap * 100).toFixed(1)}% 차이 (${c.topNear}% 넘음)`); } }
    /* (0.14.0) 처리 기준 — 올리지 않고 유지(이미 최상단 · 이미 같은 등급 유효 최저가), 바꾸는 방향(내림만·올림만), 최대 인상 %. 하한선(매입가·최소 판매가·최대 인하)은 이 뒤에 그대로 (늘 우선) */
    const cur = l.price; if (t != null && cur != null && t > cur && !out.solo) { /* (0.17.0) 우리 단독이면 '이미 맨 위·이미 최저가라 올리지 않음'을 쓰지 않음 — 맨 위가 우리뿐이라 그 조건의 뜻(경쟁 자리 지키기)이 없음 */ const ours = P.filter((w) => w.c === 'ours'); const top = P[0] && P[0].c === 'ours';
      const sameMin = P.filter((w) => w.c !== 'ours' && allow.has(w.c) && gOf(w) === l.grade && w.p > 0).reduce((m, w) => Math.min(m, w.p), Infinity); const lowest = ours.length > 0 && cur <= sameMin;
      if (c.keepTop && top) { R.push(`이미 첫 페이지 맨 위 — 올리지 않고 지금 가격 유지 (${t.toLocaleString()}원 대신)`); t = cur; }
      else if (c.keepLowest && lowest) { R.push(`이미 같은 등급(${l.grade}) 유효 최저가${Number.isFinite(sameMin) ? ` (다음 ${sameMin.toLocaleString()}원)` : ''} — 올리지 않고 지금 가격 유지 (${t.toLocaleString()}원 대신)`); t = cur; } }
    if (t != null && cur != null && c.dir === 'down' && t > cur) { R.push(`내림만 — 올리지 않음 (${t.toLocaleString()}원 대신 지금 가격)`); t = cur; }
    if (t != null && cur != null && c.dir === 'up' && t < cur) { R.push(`올림만 — 내리지 않음 (${t.toLocaleString()}원 대신 지금 가격)`); t = cur; }
    if (t != null && cur && +c.maxRise > 0 && t > cur * (1 + c.maxRise / 100)) { const f = snapDown(cur * (1 + c.maxRise / 100)); R.push(`지금 가격 대비 최대 ${c.maxRise}% 인상으로 제한 → ${f.toLocaleString()}원`); t = Math.max(cur, f); }
    if (MD) t = Memo.onTarget(t, l, MD, R, out); /* (0.17.17) 메모 한 겹 — 처리 기준 뒤 · 하한선(매입가·최소 판매가·최대 인하) 앞이라 그 하한선이 늘 이김(헌장 제8조) */
    const FPc = c.bb && buyback ? bbFloorPick(buyback, l.grade, { list: l.priceList || (ctx && ctx.priceList) || null, grades: ['최상', '상'], margin: ctx && ctx.bbMargin, floorMargin: !!(ctx && ctx.floorMargin === true), policy: (ctx && ctx.policy) || null, D: mergeD((ctx && ctx.settings) || null) }) : null; /* (0.15.3) 사용자 설정(수수료·택배)으로 — decide와 같은 하한 · (정범님 11/06) 공용 bbFloorPick: 정가보다 큰 매입가 무시 · 기준 차액 넣은 하한 */
    if (FPc && FPc.bad.length && !R.some((x) => /^알라딘 매입가 무시/.test(x))) R.push(`알라딘 매입가 무시 — ${FPc.bad.map((x) => `${x.g} ${x.why}`).join(' · ')} (하한에 안 씀)`); if (FPc && FPc.bad.length) out.bbIgnored = FPc.bad;
    const fbb = FPc && FPc.floor ? FPc.floor : null;
    if (t != null && fbb && t < fbb) { R.push(`알라딘 매입가(${l.grade} ${FPc.buy.toLocaleString()}원) 하한 ${fbb.toLocaleString()}원으로 올림${ctx && ctx.floorMargin === true ? ` — 이보다 싸면 직접 팔아 남는 돈이 매입가보다 기준 차액 ${bbMarginOf(ctx && ctx.bbMargin).toLocaleString()}원 넘게 많지 않음(알라딘 매입 후보)` : ''}`); t = fbb; out.bbHit = { buy: FPc.buy, floor: fbb }; }
    if (t != null && +c.minPrice && t < +c.minPrice) { R.push(`최소 판매가 ${(+c.minPrice).toLocaleString()}원으로 올림`); t = +c.minPrice; }
    if (t != null && +c.maxDrop && l.price && t < l.price * (1 - c.maxDrop / 100)) { const f = snapUp(l.price * (1 - c.maxDrop / 100)); R.push(`지금 가격 대비 최대 ${c.maxDrop}% 인하로 제한 → ${f.toLocaleString()}원`); t = f; }
    if (c.reach && goal != null && t != null && cur != null && t > goal && t < cur) { R.push(`목표 ${goal.toLocaleString()}원까지 못 내림(하한선 ${t.toLocaleString()}원) — 반만 내리면 목표 자리에 못 서고 값만 깎이므로 지금 가격 유지`); t = cur; } // (0.15.0) 목표 자리 아니면 안 내림
    out.floor = Math.max(0, fbb || 0, +c.minPrice || 0, +c.maxDrop && l.price ? snapUp(l.price * (1 - c.maxDrop / 100)) : 0, MD && MD.floor ? +MD.floor.won : 0); out.goal = goal; /* (0.17.0) 10/30 0.16.2의 '추천가가 정가 1.5배 넘으면 추천 안 함'은 없앰 — 터무니없는 값은 남의 매물을 거를 때만 가림(우리 값을 그 기준으로 막지 않음 · 정범님 10/30) */ out.t = t; return out; }

  /* (0.18.0) 추격자 기록 찾기·대응 전략(chaseMap·chaserOn·chaseStep·STRATS)은 맨 아래 🎯 추격자 엔진(ReadnowChase)으로 옮김 */
  /* ══════════════════ 🎯 추격자 엔진 ReadnowChase (정범님 11/02 '자동 감시에서 추격자 부분을 도려내 별도 엔진으로') ══════════════════
   *  순수 함수만(저장·네트워크·화면 없음). 판정 엔진 decide(양보)·가격 감시기(감시 그룹 판정·기록)·웹앱(🎯 추격자 엔진 페이지)이 모두 이 덩어리 하나를 부름.
   *  이 파일 안에 둔 까닭: 가격 감시기·수집기·웹앱·클라우드가 이미 readnow-pricing-core.js를 불러옴 → 새 파일을 @require로 더하지 않아도 됨(수집기·가격 감시기 '머리' 그대로)
   *  밖에서 부르는 이름: 브라우저 window.ReadnowChase · ReadnowPricing.Chase · node require(...).Chase — 옛 이름(chaseMap·chaserOn·chaseStep·STRATS·chaseEvents·chaseState·sellerChase)도 그대로
   *  ① 찾기   events·state·sellerWide·map·collect(+ 판매자마다 마지막 값 바꾼 때 moves)·find(지금 첫 쪽의 추격자 + 특정/불특정 구분)
   *  ② 정책   POLICY_DEF·normPolicy·mapWithPolicy — 특정 판매자(여러 명) 태세·조건 · 불특정 판매자 규칙 · 조건 묶음(같이 쓰는 조건)
   *  ③ 고르기 plan(누구냐 → 태세 → 규칙 → 전략)
   *  ④ 한 걸음 step(옛 5가지 그대로 + follow n회만 따르기 · second 되돌아가 2위 · hold 그대로) · judge(plan + 조건 + step 한 번에)
   *  ⑤ 기록   logEntry(바뀐 것만 한 줄) · episode(전략 한 판 요약) · perf(전략별 성과 표)
   *  ★ 정책이 꺼져 있으면(기본) judge = 옛 chaseStep과 같은 입력 → 같은 출력(회귀 시험 src/tests/chase/tCHeng.js · 3,000 사례) */
  function makeChase() {
    const CVER = '1.0.0';
  // ───────────────────────── 추격자 ─────────────────────────
  // 추격 사건 = 우리가 가격을 바꾼 뒤 windowHours(기본 24시간) 안에 그 판매자가 같은 책에서 우리 새 가격 이하로 바꾼 것 (가격 폭은 안 봄, 횟수만)
  // ourChanges: [{at, price}]  theirChanges: [{sellerCode, at, price}]  (둘 다 같은 책)
  function chaseEvents(ourChanges, theirChanges, S0) {
    const S = mergeD(S0).chase; const ev = [];
    for (const o of ourChanges || []) for (const c of theirChanges || []) { const dt = t(c.at) - t(o.at); if (dt > 0 && dt <= S.windowHours * HOUR && c.price <= o.price) ev.push({ sellerCode: c.sellerCode, at: c.at, ourAt: o.at }); }
    return ev;
  }
  // 책 단위 판정: lookbackDays(7일) 안에 minEvents(3회) 이상 → 추격자. 점수는 halfLifeDays(14일)마다 절반, releaseDays(30일) 동안 사건 없으면 해제
  function chaseState(events, now0, S0) {
    const S = mergeD(S0).chase; const now = t(now0) || Date.now(); const by = {};
    for (const e of events || []) (by[e.sellerCode] = by[e.sellerCode] || []).push(t(e.at));
    const out = {};
    for (const [sc, ts] of Object.entries(by)) {
      const recent = ts.filter((x) => now - x <= S.lookbackDays * DAY).length; const last = Math.max(...ts);
      const score = ts.reduce((a, x) => a + Math.pow(0.5, (now - x) / (S.halfLifeDays * DAY)), 0);
      const active = recent >= S.minEvents || (score >= 1 && now - last < S.releaseDays * DAY && ts.length >= S.minEvents);
      out[sc] = { active, recent, score: Math.round(score * 100) / 100, last: new Date(last).toISOString() };
    }
    return out;
  }
  // 판매자 단위: 서로 다른 책 sellerMinBooks(3권) 이상에서 추격자면 판매자 전체 표시
  function sellerChase(bookStates, S0) {
    const S = mergeD(S0).chase; const n = {};
    for (const st of Object.values(bookStates || {})) for (const [sc, x] of Object.entries(st)) if (x.active) n[sc] = (n[sc] || 0) + 1;
    const out = {}; for (const [sc, c] of Object.entries(n)) out[sc] = { books: c, active: c >= S.sellerMinBooks }; return out;
  }

  /* ───────────── (0.13.0) 추격자: 기록에서 찾기 + 대응 전략 ─────────────
   *  chaseMap(ourActs, changeDocs, now, S): 우리 가격 변경(반영 기록 at·to)과 그 책의 매물 변화 기록(prd_metric_changes: chg의 판매가가 내려간 것, 우리 것 빼고)으로
   *    추격 사건(우리가 바꾼 뒤 windowHours 안에 우리 새 가격 이하로 내림)을 세어 판매자마다 { active, recent, score, last } — chaseEvents·chaseState 그대로
   *  chaseStep(o): 추격자가 우리보다 같거나 좋은 등급으로 첫 페이지에 있을 때 전략대로 가격을 정함. 상태(state)는 결정 문서에 남겨 다음 확인(every 시간 뒤)에 이어감
   *    yield  양보 — 추격자를 빼고 다음 유효 매물 기준(엔진 기본), 추격자가 팔리면 원래대로
   *    match  동가 — 추격자와 같은 가격(더 내리지 않음), 하한 아래로는 안 감
   *    shadow 그림자 — 추격자 바로 한 단위 위: 추격자가 먼저 팔리고 우리가 바로 다음
   *    lure   끌어내린 뒤 빠지기 — 추격자보다 한 단위 아래로 두고(추격자가 또 내리게) 반응하면 되풀이, 하한(유인 하한)에 닿거나 maxRounds를 채우거나
   *           두 번 반응이 없으면 '빠짐': 추격자를 뺀 다음 기준 값(없으면 유인 전 값)으로 올려 추격자가 낮은 값에 먼저 팔리게 함
   *    lift   끌어올리기 — 우리 값을 liftStep%씩 올려 추격자가 따라 올라오면 되풀이(상한 = 다음 유효 매물 값·시작 가격 +liftCap%), 따라오지 않으면 멈춤
   *  안전: 모든 전략은 floor(조건 묶음 하한·매입가 하한·최소 판매가) 아래로 내리지 않음. lure의 유인 하한 = max(floor, 시작 가격 × (1 − floorPct%)) */
  function chaseMap(ourActs, changeDocs, now0, S0) { const S = mergeD(S0); const ours = (ourActs || []).filter((a) => a && a.at && a.to != null).map((a) => ({ at: a.at, price: +a.to }));
    const theirs = []; for (const doc of changeDocs || []) { if (!doc || !doc.at) continue; for (const c of doc.chg || []) { const f = (c.f || {}).price; if (!f || !(f[1] < f[0])) continue; const sc = String(c.sellerCode || ''); if (!sc || sc === String(S.ourSeller || '996008')) continue; /* (0.15.3) 설정의 우리 판매자 번호 */ theirs.push({ sellerCode: sc, at: doc.at, price: f[1] }); } }
    return chaseState(chaseEvents(ours, theirs, S), now0, S); }
  function chaserOn(page1, chase, grade) { const myR = GRADE_RANK[grade]; let best = null; // 우리보다 같거나 좋은 등급의 추격자 매물(첫 페이지) 중 가장 싼 것
    for (const w of page1 || []) { if (!w || w.c === 'ours') continue; const sc = String(w.sc || w.sellerCode || ''); if (!sc || !(chase && chase[sc] && chase[sc].active)) continue; const r = GRADE_RANK[w.g || w.grade]; if (myR != null && (r == null || r < myR)) continue; const p = +(w.p ?? w.price); if (!(p > 0)) continue; if (!best || p < best.price) best = { sellerCode: sc, name: w.n || w.sellerName || null, price: p, grade: w.g || w.grade || null }; }
    return best; }
  const exitT0 = (o, st) => (o.yieldT != null ? o.yieldT : (st && st.preP) || o.cur);
  /* (사람처럼 · 10/30 로봇 점검) 다시 보기 간격을 ±15% 흩음 — 예전엔 꼭 6시간마다(같은 바퀴에서 시작한 상품이 모두 같은 분에 다시 보고 같은 분에 가격을 바꿈)
   *  근거: 공용 속도 조절기(makePacer)의 흩음 0.85~1.15 · 같은 입력이면 같은 값(시험이 흔들리지 않게 — 추격자·시각으로 정함) */
  const jit15 = (k) => { let x = 2166136261; for (const c of String(k)) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return 0.85 + ((x >>> 0) % 1000) / 1000 * 0.3; };
  function chaseStep(o) { const C0 = o.strat || {}; const name = C0.name || 'yield'; const R = []; const now = o.now || new Date().toISOString(); const every = Math.round(Math.max(1, +C0.every || 6) * HOUR * (C0.exact ? 1 : jit15(`${(o.chaser && o.chaser.sellerCode) || ''}|${o.cur}|${now}`))); const nextAt = new Date(t(now) + every).toISOString();
    const fl = Math.max(o.floor || 0, name === 'lure' && o.start && C0.floorPct != null ? snapUp(o.start * (1 - C0.floorPct / 100)) : 0); const maxR = Math.max(1, +C0.maxRounds || 3);
    const ch = o.chaser; const prev = o.state && o.state.active ? o.state : null;
    if (!ch) { if (prev) R.push(`추격자(${prev.scName || prev.sc}) 매물이 첫 페이지에서 사라짐(팔렸거나 내림) → 전략 끝, 원래 기준으로`); return { t: o.base, state: prev ? { ...prev, active: false, endedAt: now, end: 'chaserGone' } : null, reasons: R, active: false }; }
    const nm = ch.name || ch.sellerCode; const st0 = prev && prev.name === name && prev.sc === ch.sellerCode ? prev : null;
    if (st0 && ['probe', 'lift'].includes(st0.phase) && st0.ourP != null && o.cur !== st0.ourP) { const wa = (st0.waitApply || 0) + 1; // 앞 단계 가격이 아직 공개 목록에 안 보이면(반영 대기·관리자 승인 대기·반영 늦음) 추격자 반응을 판단하지 않음
      if (wa >= 4) return { t: exitT0(o, st0), state: { ...st0, phase: 'exit', waitApply: wa, lastAt: now, nextAt, exitAt: now }, reasons: [`앞 단계 가격 ${st0.ourP.toLocaleString()}원이 ${wa}번 확인에도 공개 목록에 안 보임 → 전략 그만, 빠진 자리로`], active: true, nextAt };
      return { t: st0.ourP, state: { ...st0, waitApply: wa, lastAt: now, nextAt }, reasons: [`앞 단계 가격 ${st0.ourP.toLocaleString()}원이 아직 공개 목록에 안 보임(지금 ${o.cur != null ? o.cur.toLocaleString() : '?'}원) — 반영될 때까지 추격자 반응을 판단하지 않고 기다림`], active: true, nextAt }; }
    if (!st0 && o.base != null && ch.price > o.base) return { t: o.base, state: null, reasons: [`추격자 ${nm}(${ch.price.toLocaleString()}원)가 우리 기준가(${o.base.toLocaleString()}원)보다 비쌈 — 전략 필요 없음`], active: false }; const exitT = o.yieldT != null ? o.yieldT : (st0 && st0.preP) || o.cur;
    const fin = (tt, st, why) => { let v = tt; if (v != null && v < fl) { R.push(`하한 ${fl.toLocaleString()}원 아래로는 안 감`); v = fl; } if (why) R.unshift(why); return { t: v, state: st, reasons: R, active: !!(st && st.active), nextAt: st && st.active ? st.nextAt || nextAt : null }; };
    const base = { name, sc: ch.sellerCode, scName: nm, active: true, startedAt: (st0 && st0.startedAt) || now, preP: (st0 && st0.preP) || o.cur, lastAt: now, nextAt };
    if (name === 'match') return fin(ch.price, { ...base, phase: 'match' }, `추격자 ${nm}(${ch.grade || ''} ${ch.price.toLocaleString()}원)와 동가 유지 — 더 내리지 않음`);
    if (name === 'shadow') { const sp = snapUp(ch.price + 1); const tt = o.yieldT != null ? Math.min(sp, o.yieldT) : sp; return fin(tt, { ...base, phase: 'shadow' }, `그림자: 추격자 ${nm} ${ch.price.toLocaleString()}원 바로 위 ${tt.toLocaleString()}원 — 추격자가 먼저 팔리고 우리가 바로 다음`); }
    if (name === 'lift') { const capS = o.start && C0.liftCap != null ? snapUp(o.start * (1 + C0.liftCap / 100)) : Infinity; const cap = Math.min(o.yieldT != null ? o.yieldT : Infinity, capS); const step = 1 + Math.max(1, +C0.liftStep || 5) / 100;
      if (!st0 || st0.phase === 'start') { const p = snapUp(o.cur * step); if (!(p > o.cur) || p > cap) return fin(exitT, { ...base, phase: 'done', round: 0 }, `끌어올리기 불가(상한 ${Number.isFinite(cap) ? cap.toLocaleString() + '원' : '없음'}) → 양보`); return fin(p, { ...base, phase: 'lift', round: 1, ourP: p, chP: ch.price, noReact: 0 }, `끌어올리기 1회: ${o.cur.toLocaleString()} → ${p.toLocaleString()}원 — 추격자 ${nm}(${ch.price.toLocaleString()}원)가 따라 올라오는지 봄`); }
      if (st0.phase === 'lift') { if (ch.price > st0.chP) { const round = st0.round + 1; const p = snapUp(st0.ourP * step); if (round > maxR || !(p > st0.ourP) || p > cap) return fin(st0.ourP, { ...base, ...st0, phase: 'done', round, chP: ch.price, lastAt: now, nextAt }, `추격자가 ${st0.chP.toLocaleString()} → ${ch.price.toLocaleString()}원으로 따라 올라옴 — ${round > maxR ? `${maxR}회 채움` : '상한'}이라 여기서 멈춤 (${st0.ourP.toLocaleString()}원 유지)`);
          return fin(p, { ...base, ...st0, round, ourP: p, chP: ch.price, noReact: 0, lastAt: now, nextAt }, `추격자가 따라 올라옴(${st0.chP.toLocaleString()} → ${ch.price.toLocaleString()}원) → 끌어올리기 ${round}회: ${p.toLocaleString()}원`); }
        const nr = (st0.noReact || 0) + 1; if (nr >= 2) return fin(Math.min(st0.ourP, exitT), { ...base, ...st0, phase: 'done', noReact: nr, lastAt: now, nextAt }, `추격자가 따라 올라오지 않음(${nr}번) → 끌어올리기 멈춤, 양보 자리`); return fin(st0.ourP, { ...base, ...st0, noReact: nr, lastAt: now, nextAt }, `추격자 반응 기다림(${nr}번째 확인) — ${st0.ourP.toLocaleString()}원 유지`); }
      return fin(Math.min(st0.ourP || exitT, exitT), { ...base, ...st0, lastAt: now, nextAt }, `끌어올리기 끝 — 추격자가 팔릴 때까지 양보 자리`); }
    if (name === 'lure') { const probe = (chp) => stepDown(chp);
      if (!st0) { const p = probe(ch.price); if (p < fl) return fin(exitT, { ...base, phase: 'exit', round: 0 }, `유인 가격(${p.toLocaleString()}원)이 유인 하한 ${fl.toLocaleString()}원 아래 → 유인하지 않고 빠진 자리(양보)`); return fin(p, { ...base, phase: 'probe', round: 1, ourP: p, chP: ch.price, noReact: 0 }, `끌어내리기 1회: 추격자 ${nm} ${ch.price.toLocaleString()}원보다 한 단위 아래 ${p.toLocaleString()}원 — 추격자가 또 내리게 함 (유인 하한 ${fl.toLocaleString()}원)`); }
      if (st0.phase === 'probe') { if (ch.price <= st0.ourP) { const round = st0.round + 1; const p = probe(ch.price); if (round > maxR || p < fl) return fin(exitT, { ...base, ...st0, phase: 'exit', round, chP: ch.price, exitAt: now, lastAt: now, nextAt }, `추격자가 ${ch.price.toLocaleString()}원까지 내려옴 — ${round > maxR ? `${maxR}회 채움` : '유인 하한에 닿음'} → 빠짐: ${exitT != null ? exitT.toLocaleString() + '원' : '지금 값'}으로 올려 추격자가 먼저 팔리게`);
          return fin(p, { ...base, ...st0, round, ourP: p, chP: ch.price, noReact: 0, lastAt: now, nextAt }, `추격자가 따라 내림(${st0.chP.toLocaleString()} → ${ch.price.toLocaleString()}원) → 끌어내리기 ${round}회: ${p.toLocaleString()}원`); }
        const nr = (st0.noReact || 0) + 1; if (nr >= 2) return fin(exitT, { ...base, ...st0, phase: 'exit', noReact: nr, exitAt: now, lastAt: now, nextAt }, `추격자가 반응 없음(${nr}번) → 빠짐: 추격자를 뺀 다음 기준 값으로`); return fin(st0.ourP, { ...base, ...st0, noReact: nr, lastAt: now, nextAt }, `추격자 반응 기다림(${nr}번째 확인) — ${st0.ourP.toLocaleString()}원 유지`); }
      return fin(exitT, { ...base, ...st0, lastAt: now, nextAt }, `빠진 자리 유지 — 추격자 ${nm}(${ch.price.toLocaleString()}원)가 팔릴 때까지`); }
    /* (엔진 1.0.0) 새 전략 3가지 — 정책(특정 판매자 태세·불특정 규칙)이 고를 때만 씀. 옛 5가지는 위 그대로 */
    if (name === 'follow') { /* n회만 따르기: 추격자가 새로 우리 밑으로 내릴 때마다 엔진 기준가(base · 보통 추격자와 동가)로 따라감 — maxFollow번까지, 시작 가격의 rangePct% 아래로는 안 따름. 그 뒤는 그만(stopAt) */
      const n = Math.max(0, C0.maxFollow != null && C0.maxFollow !== '' ? +C0.maxFollow : 2); const rng = Math.max(0, C0.rangePct != null && C0.rangePct !== '' ? +C0.rangePct : 10); const low = o.start ? snapUp(o.start * (1 - rng / 100)) : 0;
      const fol = (st0 && st0.follows) || 0; const stopT = C0.stopAt === 'yield' ? (o.yieldT != null ? o.yieldT : o.cur) : C0.stopAt === 'second' && +C0.hp > ch.price ? Math.max(stepDown(+C0.hp), snapUp(ch.price + 1)) : st0 && st0.ourP != null ? st0.ourP : o.cur;
      const stopWhy = { yield: '추격자를 뺀 다음 유효 매물 기준(양보)', second: '가만히 있는 더 높은 판매자 바로 아래(2위)', hold: '지금 값 유지' }[C0.stopAt || 'hold'] || '지금 값 유지';
      if (st0 && st0.phase === 'stop') return fin(stopT, { ...base, ...st0, lastAt: now, nextAt }, `따르기 그만 자리 유지 — ${fol}번 따름 · ${stopWhy}`);
      const moved = !st0 || st0.chP == null || ch.price < st0.chP;
      if (!moved) return fin(st0.ourP != null ? st0.ourP : o.cur, { ...base, ...st0, lastAt: now, nextAt }, `추격자 ${nm} 그대로(${ch.price.toLocaleString()}원) — ${fol}/${n}번 따른 값 유지`);
      if (fol >= n || (low && ch.price < low)) return fin(stopT, { ...base, ...(st0 || {}), phase: 'stop', follows: fol, chP: ch.price, stopAt: now, lastAt: now, nextAt }, `추격자 ${nm}가 또 내림(${ch.price.toLocaleString()}원) — ${fol >= n ? `${n}번 따름을 채움` : `시작 가격의 ${rng}% 아래(${low.toLocaleString()}원 밑)`} → 더 따르지 않음: ${stopWhy}`);
      const tt = Math.max(o.base != null ? o.base : ch.price, low || 0); return fin(tt, { ...base, ...(st0 || {}), phase: 'follow', follows: fol + 1, chP: ch.price, ourP: tt, lastAt: now, nextAt }, `따르기 ${fol + 1}/${n}번: 추격자 ${nm} ${ch.price.toLocaleString()}원 → 우리 ${tt.toLocaleString()}원 (범위: 시작 가격의 ${rng}% 아래까지)`); }
    if (name === 'second') { /* 되돌아가 2위: 추격자와 '가만히 있는 더 높은 판매자' 사이가 backPct% 넘게 벌어지면 추격자를 따라 내려가지 않고 높은 판매자 바로 아래(2위)로 */
      const hp = +C0.hp; if (!(hp > ch.price)) return fin(o.yieldT != null ? o.yieldT : o.cur, { ...base, phase: 'yield' }, `되돌아가 2위: 가만히 있는 더 높은 판매자가 없음 → 양보`);
      let tt = stepDown(hp); for (let u = 1; u < Math.max(1, +C0.under || 1); u++) tt = stepDown(tt); if (tt <= ch.price) tt = snapUp(ch.price + 1);
      const gC = o.cur != null ? o.cur - ch.price : null, gH = o.cur != null ? hp - o.cur : null;
      return fin(tt, { ...base, phase: 'second', hp, hsc: C0.hsc || null }, `되돌아가 2위: 추격자 ${nm} ${ch.price.toLocaleString()}원 · 가만히 있는 ${C0.hname || C0.hsc || '더 높은 판매자'} ${hp.toLocaleString()}원 (사이 ${Math.round((hp - ch.price) / hp * 100)}%${gC != null ? ` · 우리와 추격자 ${gC.toLocaleString()}원 · 우리와 높은 판매자 ${gH.toLocaleString()}원` : ''}) → 높은 판매자 바로 아래 ${tt.toLocaleString()}원`); }
    if (name === 'hold') return fin(o.cur, { ...base, phase: 'hold' }, `지금 값 유지 — 추격자 ${nm}(${ch.price.toLocaleString()}원)에 대응하지 않음`);
    return fin(o.yieldT != null ? o.yieldT : o.cur, { ...base, phase: 'yield' }, `양보: 추격자 ${nm}(${ch.price.toLocaleString()}원)를 따라 내리지 않고 다음 유효 매물 기준`); }
  const STRATS = { yield: '양보 (따라 내리지 않고 기다림)', match: '동가 유지', shadow: '그림자 (추격자 바로 위)', lure: '끌어내린 뒤 빠지기', lift: '끌어올리기' };
    const STRATS_ALL = { ...STRATS, follow: 'n회만 따르기 (그 뒤 그만)', second: '되돌아가 2위 (가만히 있는 높은 판매자 바로 아래)', hold: '지금 값 유지 (대응 안 함)' };
    /* 전략마다 쉬운 설명 · 근거 — 화면(🎯 페이지)이 그대로 씀. 근거가 우리 자료로 확인되지 않은 것은 '근거: 없음(설정)'으로 */
    const STRAT_INFO = {
      yield: { what: '추격자를 빼고 다음 유효 매물을 기준으로 — 따라 내리지 않고 추격자가 팔리기를 기다림', basis: '추격자 재고는 보통 한두 권 — 팔리고 나면 기준이 다시 올라옴(엔진 0.10.0부터 기본)' },
      match: { what: '추격자와 같은 값 — 더 내리지 않음(함께 맨 위)', basis: '같은 값이면 최저가 표시를 함께 받음 · 출혈 경쟁 없음' },
      shadow: { what: '추격자 바로 한 단위 위 — 추격자가 먼저 팔리고 우리가 바로 다음', basis: '근거: 없음(설정) — 2위 자리의 판매 확률은 기록으로 재는 중' },
      lure: { what: '추격자보다 한 단위 아래로 둬 또 내리게 하고, 하한·횟수·무반응이면 빠져서 추격자가 낮은 값에 먼저 팔리게', basis: '근거: 없음(설정) — 공격적 태세의 기본' },
      lift: { what: '우리 값을 조금씩 올려 추격자가 따라 올라오는지 봄 — 내리지 않아 위험이 가장 적음', basis: '근거: 없음(설정)' },
      follow: { what: '추격자가 새로 내릴 때마다 n번(기본 2)까지만 따라가고, 시작 가격의 범위%(기본 10) 아래로는 안 따름 — 그 뒤는 그대로·양보·2위 중 고른 대로', basis: '근거: 없음(설정) — 정범님 11/02 예시(2회 특정 범위 안에서만 따르기)' },
      second: { what: '추격자와 가만히 있는(정한 시간 동안 값을 안 바꾼) 더 높은 판매자 사이가 정한 %(기본 15)보다 벌어지면 따라가지 않고 그 높은 판매자 바로 아래(2위)로 되돌아감', basis: '근거: 없음(설정) — 정범님 11/02 예시(간격 비교 → 높은 판매자 근처 2위)' },
      hold: { what: '움직이지 않음 — 지금 값 유지', basis: '시간대 밖·쉼 시간·작은 차이일 때 쓰는 자리' },
    };
    const STANCES = { auto: '그룹 전략 그대로(지금 동작)', normal: '추격자로 보지 않음 — 보통 매물처럼 경쟁', ignore: '무시 — 따라가지 않음(그 매물을 기준에서 뺌)', aggressive: '공격적', defensive: '방어적', flexible: '유동적(조건으로 바뀜)' };
    const STANCE_DEF_STRAT = { aggressive: 'lure', defensive: 'yield', flexible: 'shadow' }; /* 태세의 기본 전략(판매자마다 바꿀 수 있음) · 유동적의 shadow는 규칙이 하나도 안 맞을 때 */
    /* 조건 묶음 — 특정·불특정 판매자가 같은 칸을 씀(같은 조건·다른 조건 섞기). 빈 칸 = 쓰지 않음 · 숫자 근거는 모두 '없음(설정)' */
    const COND_DEF = { maxFollow: 2, rangePct: 10, stopAt: 'hold', backPct: 15, quietH: 48, under: 1, minGapPct: '', restH: '', hours: '', minPrice: '', floorPct: '', maxTier: '' };
    const COND_INFO = {
      maxFollow: ['따를 횟수', '번', 'n회만 따르기 — 이만큼 따른 뒤엔 더 따르지 않음'], rangePct: ['따를 범위', '%', '시작 가격에서 이만큼 아래까지만 따름'], stopAt: ['그만둔 뒤', '', 'hold 그대로 · yield 양보 · second 2위'],
      backPct: ['2위로 되돌아갈 간격', '%', '추격자와 가만히 있는 더 높은 판매자 사이가 높은 판매자 값의 이만큼 넘게 벌어지면'], quietH: ['가만히 있음', '시간', '더 높은 판매자가 이 시간 동안 값을 안 바꿨을 때만 기준으로'], under: ['2위 자리', '단위', '높은 판매자보다 몇 단위 아래'],
      minGapPct: ['작은 차이 무시', '%', '추격자가 우리보다 이만큼도 안 싸면 대응하지 않음'], restH: ['쉼', '시간', '우리가 값을 바꾼 뒤 이 시간 동안은 다시 바꾸지 않음'], hours: ['시간대', '', '예 9-22 — 이 시각(한국)에만 움직임'],
      minPrice: ['최저가 하한', '원', '이 값 아래로는 어떤 전략도 내리지 않음'], floorPct: ['시작 가격 대비 하한', '%', '감시 시작 가격에서 이만큼 아래까지만'], maxTier: ['재고 기간', '', '예 T3 — 우리 재고가 이보다 오래되면 이 판매자 규칙을 쓰지 않음(그룹 전략)'],
    };
    const ANON_RULES = { second: '되돌아가 2위(간격 비교)', follow: 'n회만 따르기' }; /* 불특정 판매자 규칙 차례: 2위 먼저 보고(간격이 크면), 아니면 n회만 따르기 */
    /* (11/04 정범님 '무시 판매자 빼는 설정 · 빠지지 않는 지금 상태를 기본으로') excl = 무시 판매자를 다른 셈에서도 뺄 곳(곳마다 따로 · 처음 값 모두 꺼짐 = 지금 그대로)
     *  · 정책 켜짐(on)과 따로 — 이 칸만 켜도 빠짐(11/05부터 '언제 뺄까' excl.when으로 '엔진이 켜졌을 때만'도 고를 수 있음) · 벤치마킹 수집(읽기)·시장 지표 기록 자체는 그대로(관찰은 계속) · blLog = 🚫 블랙리스트 더하기·해제·메모 기록(지우지 않음) */
    const EXCL = { mkt: '시장 지표 — 경쟁 매물 셈(최저가 배지 수·시장 관찰·우리가 싼 상품·수동 일괄 시장 조건·기준 시장가·알라딘 매입 비교)', strat: '⚡ 희소 전략 — 경쟁 매물 셈(앞선 매물·다음 매물·희소 분류)', rec: '판매가 추천·가격 판정 — 경쟁 목록(수동 일괄 추천가·사진 가격 추천·판매가 평가)' };
    /* (11/05 정범님 '엔진이 켜졌을 때만 빼야 하면 — 설정에서 켜고 끌 때 선택 가능하게') excl.when = 언제 뺄까 · always 늘(엔진 꺼져도 · 처음 값 = 11/04 동작 그대로) · on 엔진(정책 on)이 켜졌을 때만 */
    const EXCL_WHEN = { always: '늘(엔진 꺼져도)', on: '엔진이 켜졌을 때만' };
    const POLICY_DEF = () => ({ on: false, rec: true, sellers: {}, condSets: {}, anon: { trigger: 'chaser', minEvents: 1, rules: { second: false, follow: false }, cond: {} }, excl: { mkt: false, strat: false, rec: false, when: 'always' }, blLog: [] });
    const normPolicy = (p) => { const D = POLICY_DEF(); if (!p || typeof p !== 'object') return D; const a = p.anon || {}; return { ...D, ...p, sellers: { ...(p.sellers || {}) }, condSets: { ...(p.condSets || {}) }, anon: { ...D.anon, ...a, rules: { ...D.anon.rules, ...(a.rules || {}) }, cond: { ...(a.cond || {}) } }, excl: { ...D.excl, ...(p.excl && typeof p.excl === 'object' ? p.excl : {}) }, blLog: Array.isArray(p.blLog) ? p.blLog.slice() : [] }; };
    const condOf = (P, x) => { const o = { ...COND_DEF }; const cs = x && x.condSet && P.condSets[x.condSet] ? P.condSets[x.condSet].cond || {} : {}; for (const src of [cs, (x && x.cond) || {}]) for (const [k, v] of Object.entries(src)) if (k in COND_DEF && v !== '' && v != null) o[k] = v; return o; };
    const sellerOf = (P, sc) => (sc != null ? P.sellers[String(sc)] || null : null);
    const tierN = (x) => (x ? +String(x).replace(/^T/i, '') || null : null);
    const kstHour = (iso) => new Date((t(iso) || Date.now()) + 9 * HOUR).getUTCHours();
    const kstDay = (iso) => new Date((t(iso) || Date.now()) + 9 * HOUR).toISOString().slice(0, 10);
    const inHours = (iso, spec) => { const m = String(spec || '').match(/^\s*(\d{1,2})\s*[-~]\s*(\d{1,2})\s*$/); if (!m) return true; const h = kstHour(iso), a = +m[1], b = +m[2]; return a <= b ? h >= a && h < b : h >= a || h < b; };

    /* ① 찾기 더하기 — collect: 옛 chaseMap 그대로 + 판매자마다 마지막으로 값을 바꾼 때(올림·내림 모두) moves → '가만히 있는 판매자' 판단 */
    function collect(ourActs, changeDocs, now0, S0) { const map = chaseMap(ourActs, changeDocs, now0, S0); const moves = {};
      for (const doc of changeDocs || []) { if (!doc || !doc.at) continue; for (const c of doc.chg || []) { const f = (c.f || {}).price; if (!f || f[0] === f[1]) continue; const sc = String(c.sellerCode || ''); if (!sc) continue; if (!moves[sc] || t(doc.at) > t(moves[sc])) moves[sc] = doc.at; } }
      return { map, moves }; }
    /* ② 정책을 판정 엔진(decide의 양보)에 — 무시·방어적 판매자는 추격 기록이 없어도 추격자로(양보), '추격자로 보지 않음'은 추격자 표시를 끔. 정책이 꺼져 있으면 그대로 */
    function mapWithPolicy(map, policy) { const P = normPolicy(policy); if (!P.on) return map; const out = { ...(map || {}) };
      for (const [sc, x] of Object.entries(P.sellers)) { const st = x && x.stance; if (st === 'normal') { if (out[sc]) out[sc] = { ...out[sc], active: false, byPolicy: 'normal' }; } else if (st === 'ignore' || st === 'defensive') out[sc] = { ...(out[sc] || { recent: 0, score: 0, last: null }), active: true, byPolicy: st }; }
      return out; }
    /* 지금 첫 쪽의 추격자 — 정책이 꺼져 있으면 옛 chaserOn 그대로. 켜져 있으면: 특정 판매자(태세가 '그룹 전략 그대로'가 아니면 추격 기록 없이도) · 추격자로 찾은 판매자 · (불특정 '1번이라도 따라 내린 판매자'를 고르면) 그 판매자 — 가장 싼 하나 */
    function find(page1, map, grade, policy) { const P = normPolicy(policy); if (!P.on) return chaserOn(page1, map, grade); const myR = GRADE_RANK[grade]; let best = null;
      for (const w of page1 || []) { if (!w || w.c === 'ours') continue; const sc = String(w.sc || w.sellerCode || ''); if (!sc) continue; const r = GRADE_RANK[w.g || w.grade]; if (myR != null && (r == null || r < myR)) continue; const p = +(w.p ?? w.price); if (!(p > 0)) continue;
        const sp = sellerOf(P, sc); const m = (map || {})[sc] || null; let who = null, stance = 'auto';
        if (sp && sp.stance && sp.stance !== 'auto') { if (sp.stance === 'normal') continue; who = 'specific'; stance = sp.stance; }
        else if (m && m.active) who = sp ? 'specific' : 'anon';
        else if (!sp && P.anon.trigger === 'events' && m && (m.recent || 0) >= Math.max(1, +P.anon.minEvents || 1)) who = 'anon';
        else continue;
        if (!best || p < best.price) best = { sellerCode: sc, name: w.n || w.sellerName || (sp && sp.name) || null, price: p, grade: w.g || w.grade || null, who, stance }; }
      return best; }
    /* '가만히 있는 더 높은 판매자' — 추격자보다 비싼 첫 쪽 매물(우리·추격자 빼고 · 같거나 좋은 등급) 중 가장 싼 것. moves 기록으로 quietH 시간 안에 값을 바꿨으면 빼고 그다음 */
    function higherQuiet(page1, ch, grade, moves, quietH, now0) { const myR = GRADE_RANK[grade]; const now = t(now0) || Date.now(); const L = [];
      for (const w of page1 || []) { if (!w || w.c === 'ours') continue; const sc = String(w.sc || w.sellerCode || ''); if (sc && ch && sc === String(ch.sellerCode)) continue; const r = GRADE_RANK[w.g || w.grade]; if (myR != null && (r == null || r < myR)) continue; const p = +(w.p ?? w.price); if (!(p > 0) || (ch && p <= ch.price) || w.so) continue; L.push({ sc, name: w.n || w.sellerName || null, price: p }); }
      L.sort((a, b) => a.price - b.price); for (const x of L) { const mv = x.sc && moves ? moves[x.sc] : null; if (mv && quietH && now - t(mv) < quietH * HOUR) continue; return x; } return null; }

    /* ③ 고르기 — 누구냐(특정/불특정) → 태세 → 규칙 → 전략. 돌려줌 { strat, who, stance, rule, cond, why[] } */
    function plan(o) { const P = normPolicy(o.policy); const g = o.groupStrat || { name: 'yield' }; const ch = o.chaser; const why = [];
      if (!ch) return { strat: g, who: null, stance: null, rule: null, cond: {}, why };
      if (!P.on) return { strat: g, who: 'anon', stance: 'auto', rule: 'group', cond: {}, why };
      const sp = ch.who === 'specific' || sellerOf(P, ch.sellerCode) ? sellerOf(P, ch.sellerCode) : null; const cond = condOf(P, sp || P.anon); const who = sp ? 'specific' : 'anon';
      if (cond.maxTier && o.tier && tierN(o.tier) > tierN(cond.maxTier)) { why.push(`우리 재고 기간 ${o.tier} > ${cond.maxTier} — ${who === 'specific' ? '이 판매자' : '불특정'} 규칙을 쓰지 않고 그룹 전략`); return { strat: g, who, stance: sp ? sp.stance || 'auto' : 'auto', rule: 'tier', cond, why }; }
      const chain = (rules, fb, fbRule) => { if (rules.second) { const H = higherQuiet(o.page1, ch, o.grade, o.moves, +cond.quietH || 0, o.now); if (H && (H.price - ch.price) / H.price * 100 >= +cond.backPct) { why.push(`추격자와 가만히 있는 더 높은 판매자(${H.name || H.sc} ${H.price.toLocaleString()}원) 사이 ${Math.round((H.price - ch.price) / H.price * 100)}% ≥ ${cond.backPct}%`); return { strat: { ...g, name: 'second', hp: H.price, hsc: H.sc, hname: H.name, under: cond.under }, rule: 'second' }; } if (rules.follow && cond.stopAt === 'second' && H) cond._hp = H; }
        if (rules.follow) { const H = cond._hp; delete cond._hp; return { strat: { ...g, name: 'follow', maxFollow: cond.maxFollow, rangePct: cond.rangePct, stopAt: cond.stopAt, ...(H ? { hp: H.price, hsc: H.sc, hname: H.name } : {}) }, rule: 'follow' }; }
        return { strat: fb, rule: fbRule }; };
      if (sp) { const st = sp.stance || 'auto'; const named = sp.strat && STRATS_ALL[sp.strat] ? sp.strat : null;
        if (st === 'ignore') return { strat: { ...g, name: 'yield', ignore: true }, who, stance: st, rule: 'ignore', cond, why: [...why, `지정 판매자 ${sp.name || ch.sellerCode}: 무시 — 따라가지 않음`] };
        if (st === 'aggressive' || st === 'defensive') return { strat: { ...g, name: named || STANCE_DEF_STRAT[st] }, who, stance: st, rule: st, cond, why: [...why, `지정 판매자 ${sp.name || ch.sellerCode}: ${STANCES[st]}`] };
        if (st === 'flexible') { const r = chain({ second: true, follow: true }, { ...g, name: named || STANCE_DEF_STRAT.flexible }, 'flexible'); return { strat: r.strat, who, stance: st, rule: r.rule, cond, why: [...why, `지정 판매자 ${sp.name || ch.sellerCode}: 유동적`] }; }
        return { strat: named ? { ...g, name: named } : g, who, stance: 'auto', rule: named ? 'named' : 'group', cond, why }; }
      const r = chain(P.anon.rules || {}, g, 'group'); return { strat: r.strat, who, stance: 'auto', rule: r.rule, cond, why }; }

    /* ④ judge — plan + 조건(시간대·쉼·작은 차이·하한) + step. 정책이 꺼져 있으면 step(옛 chaseStep)과 같은 결과 + plan만 덧붙임 */
    function judge(o) { const pl = plan(o); const P = normPolicy(o.policy);
      if (!P.on || !o.chaser) { const r = chaseStep({ ...o, strat: pl.strat }); return { ...r, plan: pl }; }
      const c = pl.cond || {}; const now = o.now || new Date().toISOString(); const prev = o.state && o.state.active ? o.state : null; const keepT = prev && prev.ourP != null ? prev.ourP : o.cur;
      const every = Math.round(Math.max(1, +(pl.strat || {}).every || 6) * HOUR); const nextAt = new Date(t(now) + every).toISOString();
      const meta = { who: pl.who, stance: pl.stance, rule: pl.rule, lastChP: o.chaser.price };
      const holdR = (why, held) => ({ t: keepT, state: prev ? { ...prev, ...meta, lastAt: now, nextAt } : null, reasons: [why, ...pl.why], active: !!prev, nextAt: prev ? nextAt : null, plan: pl, held });
      if (c.hours && !inHours(now, c.hours)) return holdR(`시간대 ${c.hours}시(한국) 밖 — 지금은 움직이지 않음`, 'hours');
      if (+c.restH > 0 && prev && prev.lastMoveAt && t(now) - t(prev.lastMoveAt) < +c.restH * HOUR) return holdR(`쉼 ${c.restH}시간 — 마지막으로 값을 바꾼 지 ${Math.round((t(now) - t(prev.lastMoveAt)) / HOUR * 10) / 10}시간`, 'rest');
      if (+c.minGapPct > 0 && o.cur && o.chaser.price < o.cur && (o.cur - o.chaser.price) / o.cur * 100 < +c.minGapPct) return holdR(`추격자가 우리보다 ${Math.round((o.cur - o.chaser.price) / o.cur * 1000) / 10}%만 쌈(< ${c.minGapPct}%) — 작은 차이라 대응하지 않음`, 'gap');
      let floor = o.floor || 0; if (+c.minPrice > 0) floor = Math.max(floor, +c.minPrice); if (+c.floorPct > 0 && o.start) floor = Math.max(floor, snapUp(o.start * (1 - c.floorPct / 100)));
      const r = chaseStep({ ...o, strat: pl.strat, floor }); const moved = r.t != null && o.cur != null && r.t !== o.cur;
      const st = r.state ? { ...r.state, ...meta, ...(moved ? { lastMoveAt: now } : prev && prev.lastMoveAt ? { lastMoveAt: prev.lastMoveAt } : {}) } : r.state;
      return { ...r, state: st, reasons: [...(r.reasons || []), ...pl.why], plan: pl, floor }; }

    /* ⑤ 기록 — logEntry: 바뀐 것(단계·전략·추격자 값·우리 목표·시작/끝)만 한 줄 · 같은 판정이면 null(쓰지 않음) */
    function logEntry(prev, r, x) { const ch = x.chaser || null; const st = (r && r.state) || null; if (!ch && !(prev && prev.active)) return null;
      const pchp = x.prevChP !== undefined ? x.prevChP : prev ? (prev.lastChP != null ? prev.lastChP : prev.chP != null ? prev.chP : null) : null; /* 감시기는 결정 문서의 지난 추격자 값(prevD.chaser)을 넘김 — 정책이 꺼진 상태(옛 단계)에는 추격자 값이 없음 */ const chp = ch ? ch.price : null;
      const changed = !!(prev && prev.active) !== !!(st && st.active) || (st && prev && (prev.phase !== st.phase || prev.name !== st.name)) || pchp !== chp || (r && r.t != null && x.cur != null && r.t !== x.cur);
      if (!changed) return null; const pl = (r && r.plan) || {};
      return { at: x.now, day: kstDay(x.now), key: x.key || null, usedCode: x.usedCode || null, bookId: x.bookId || null, title: x.title ? String(x.title).slice(0, 80) : null,
        sc: ch ? ch.sellerCode : (prev && prev.sc) || null, scName: ch ? ch.name || null : (prev && prev.scName) || null, who: pl.who || (prev && prev.who) || null, stance: pl.stance || null, rule: pl.rule || null,
        strat: (st && st.name) || ((pl.strat || {}).name) || null, phase: (st && st.phase) || null, active: !!(st && st.active), end: (st && st.end) || null,
        from: x.cur ?? null, to: r && r.t != null ? r.t : null, chP: chp, chPrev: pchp, start: x.start ?? null, held: (r && r.held) || null, why: String(((r && r.reasons) || [])[0] || '').slice(0, 160), lag: lagMin(prev, pchp, chp, x.now) }; }
    /* (0.17.21 판 서) 반응 시간 — 추격자 값이 내려간 줄에서만: 지금 − 우리가 마지막으로 값을 바꾼 때(prev.lastMoveAt) · 분 · 0~7일만(넘으면 따라 내린 것으로 보지 않음) · 모르면 null */
    function lagMin(prev, pchp, chp, now) { if (pchp == null || chp == null || !(+chp < +pchp) || !prev || !prev.lastMoveAt) return null; const a = t(prev.lastMoveAt), b = t(now); if (a == null || b == null) return null; const m = Math.round((b - a) / 60000); return m >= 0 && m <= 7 * 1440 ? m : null; }
    /* (0.17.26 판 ⑨) relDelta(prev, L) → { hr 0~23(내림일 때 한국 시각) , cut 내림 폭 %, up 우리 전략 중 따라 올림, back 우리가 떠난 뒤 올림, gone 사라져 끝남 } | null — 추격자 값이 바뀐 줄만 · 모르면 칸 없음 */
    function relDelta(prev, L) { if (!L) return null; const a = L.chPrev, b = L.chP; const o = {}; const dn = a != null && b != null && +b < +a, up = a != null && b != null && +b > +a;
      if (dn) { o.hr = new Date(t(L.at) + 9 * HOUR).getUTCHours(); o.cut = Math.round((a - b) / a * 1000) / 10; } if (up) { if (prev && prev.active) o.up = 1; else o.back = 1; } if (L.end === 'chaserGone') o.gone = 1; return Object.keys(o).length ? o : null; }
    /* episode: 전략 한 판(시작 ~ 끝) 요약 문서 { id, data } — 같은 상품·같은 시작 시각이면 같은 문서에 덧씀 */
    function episode(prev, r, x) { const st = (r && r.state) || (prev ? { ...prev, active: false } : null); if (!st || !st.startedAt) return null; const id = `${x.key}_${String(st.startedAt).replace(/[^0-9]/g, '').slice(0, 14)}`;
      const pl = (r && r.plan) || {}; const ch = x.chaser || null;
      return { id, data: { key: x.key || null, usedCode: x.usedCode || null, bookId: x.bookId || null, title: x.title ? String(x.title).slice(0, 80) : null, sc: st.sc || (ch && ch.sellerCode) || null, scName: st.scName || (ch && ch.name) || null,
        who: st.who || pl.who || null, stance: st.stance || pl.stance || null, rule: st.rule || pl.rule || null, strat: st.name || null, startedAt: st.startedAt, startP: st.preP ?? x.cur ?? null, lastP: r && r.t != null ? r.t : x.cur ?? null, lastChP: ch ? ch.price : st.lastChP ?? null,
        lastAt: x.now, phase: st.phase || null, active: !!st.active, end: st.end || null, endedAt: st.endedAt || null } }; }
    /* perf: 전략별 성과 — eps(전략 한 판 요약들) + salesOf(key) → [{ ms, p }] (판매 시각·한 권 판매가) + costOf(key) → 매입가|null
     *  줄마다 { k, n, sold, soldPct, daysMed, saleRatio(판매가 ÷ 시작 가격), chgPct(마지막 값 ÷ 시작 가격 − 1), profit(판매가 − 매입가 평균 · 매입가 아는 것만), profitN } */
    function perf(eps, salesOf, costOf, keyOf) { const by = new Map(); const med = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
      for (const e of eps || []) { const k = keyOf ? keyOf(e) : e.strat || '?'; const g = by.get(k) || by.set(k, { k, n: 0, sold: 0, days: [], ratio: [], chg: [], prof: [] }).get(k); g.n++;
        const s0 = t(e.startedAt); const sp = +e.startP || 0; if (sp && +e.lastP) g.chg.push(+e.lastP / sp - 1);
        const sl = (salesOf ? salesOf(e.key) || [] : []).filter((x) => x.ms && x.ms >= s0).sort((a, b) => a.ms - b.ms)[0];
        if (sl) { g.sold++; g.days.push((sl.ms - s0) / DAY); if (sp && sl.p) g.ratio.push(sl.p / sp); const c = costOf ? costOf(e.key) : null; if (c != null && sl.p) g.prof.push(sl.p - c); } }
      return [...by.values()].map((g) => ({ k: g.k, n: g.n, sold: g.sold, soldPct: g.n ? g.sold / g.n : 0, daysMed: med(g.days), saleRatio: g.ratio.length ? g.ratio.reduce((a, b) => a + b, 0) / g.ratio.length : null, chgPct: g.chg.length ? g.chg.reduce((a, b) => a + b, 0) / g.chg.length : null, profit: g.prof.length ? Math.round(g.prof.reduce((a, b) => a + b, 0) / g.prof.length) : null, profitN: g.prof.length })); }

    /* ⑦ 🧭 어느 추격자 전략을 쓸까 — 그룹마다 개별 전략 (정범님 11/09 '추격자 전략을 그룹마다 따로')
     *  규칙: 전체 추격자 전략(prd_system/pricing.autoChase — 웹앱 '자동 감시의 추격자 전략')이 기본 · 그룹(수동 일괄 감시 그룹)에 개별 전략(그룹 watch.chase)이 있으면 그 상품엔 개별이 먼저
     *        · 반자동 그룹에 개별 전략이 없으면 예전처럼 그 조건 묶음의 전략 · 한 상품이 여러 그룹에 걸리는 등 애매하면 전체 전략
     *  가격 감시기(감시 그룹 판정)·웹앱(그룹 감시 칸·결정 카드 한 줄)이 모두 이 함수 하나를 부름(판단을 따로 만들지 않음)
     *  o = { global: 전체 전략 { name, every, … } | null, groups: [{ id, name, chase: 그룹 개별 전략 | null, preset: { name, chase } | null }] (그 상품이 걸린 그룹 — 같은 id는 하나로) }
     *  → { strat, src: 'item'|'group'|'preset'|'fold'|'global', gid, gname, why, text } — text = 화면 한 줄('어느 전략이 왜') */
    const stratOk = (c) => !!(c && typeof c === 'object' && c.name && STRATS_ALL[c.name]);
    /* (판 카 · ctrlimp2 · 설계 CTRLDES2 1.3 · 정범님 I-1118-2344-32 감시 셋 ③) 층 둘 더함 — 옛 입력(item·fold 없음)은 답이 한 글자도 안 바뀜
     *  o.item = 📌 상품 개별 전략 { name, … } | 'off'(그 상품은 추격자에 대응 안 함 = 지금 값 유지) · o.fold = 📁 그 상품 그룹이 든 묶음 { id, name, gids: [묶음 안 그룹 차례], chase: 묶음 기본 전략 | null }
     *  차례 = 상품 개별 > 그룹 개별 > 조건 묶음 > 묶음 기본 > 전체 · 한 상품이 여러 그룹에 걸렸어도 그 그룹이 모두 한 묶음 안이면 묶음 차례에서 맨 앞 그룹(= 묶음 겹침 셈 bkfOverlap의 주인 그룹) 하나로 봄 */
    function stratFor(o) { o = o || {}; const G0 = { name: 'yield' }; const glob = stratOk(o.global) ? o.global : { ...(o.global && typeof o.global === 'object' ? o.global : {}), ...G0 };
      const seen = new Set(); let gs = (o.groups || []).filter((g) => g && g.id != null && !seen.has(String(g.id)) && seen.add(String(g.id)));
      const nm = (c) => STRATS_ALL[c.name] || c.name; const out = (strat, src, g, why) => ({ strat, src, gid: g ? String(g.id) : null, gname: g ? g.name || String(g.id) : null, why, text: `추격자 전략: ${nm(strat)} — ${why}` });
      const F = o.fold && typeof o.fold === 'object' && Array.isArray(o.fold.gids) ? o.fold : null; const fn = F ? `묶음 '${F.name || F.id || '?'}'` : '';
      let ow = ''; if (gs.length > 1 && F) { const ids = F.gids.map(String); if (gs.every((g) => ids.includes(String(g.id)))) { const i = Math.min(...gs.map((g) => ids.indexOf(String(g.id)))); const g1 = gs.find((g) => String(g.id) === ids[i]); ow = ` · ${fn} 안 겹침 — 주인 그룹 '${g1.name || g1.id}'(묶음 차례 맨 앞)`; gs = [g1]; } }
      const g = gs.length === 1 ? gs[0] : null;
      if (o.item === 'off') return out({ ...glob, name: 'hold' }, 'item', g, `📌 상품 개별: 추격자에 대응 안 함(지금 값 유지)${ow}`);
      if (stratOk(o.item)) return out({ ...glob, ...o.item }, 'item', g, `📌 상품 개별 전략${ow}`);
      if (!gs.length) return out(glob, 'global', null, '전체 추격자 전략(그룹 없음)');
      if (gs.length > 1) return out(glob, 'global', null, `여러 그룹(${gs.slice(0, 3).map((g) => `'${g.name || g.id}'`).join('·')}${gs.length > 3 ? ' 등' : ''})에 걸려 애매 — 전체 추격자 전략`);
      if (stratOk(g.chase)) return out({ ...glob, ...g.chase }, 'group', g, `그룹 '${g.name || g.id}' 개별 전략${ow}`);
      if (g.preset && stratOk(g.preset.chase)) return out(g.preset.chase, 'preset', g, `그룹 '${g.name || g.id}'의 반자동 조건 묶음 '${g.preset.name || '?'}' 전략(그룹 개별 전략 없음)${ow}`);
      if (F && stratOk(F.chase) && F.gids.map(String).includes(String(g.id))) return out({ ...glob, ...F.chase }, 'fold', g, `${fn} 기본 전략(그룹 '${g.name || g.id}' 개별 전략 없음)${ow}`);
      return out(glob, 'global', g, `그룹 '${g.name || g.id}'에 개별 전략 없음 — 전체 추격자 전략${ow}`); }

    /* ⑥ 🚫 무시 판매자(블랙리스트) — 다른 셈에서 빼기 · 더하기/해제/메모(정책 사본 P를 고침 · 저장은 부르는 쪽) */
    function ignored(policy) { const P = normPolicy(policy); return Object.entries(P.sellers).filter(([sc, x]) => x && x.stance === 'ignore' && sc !== '996008').map(([sc]) => sc); }
    /* (11/05) 지금 빼기가 살아 있나 — '언제 뺄까'(excl.when)가 엔진이 켜졌을 때만(on)이면 정책 on일 때만 · 늘(always · 모르는 값도)이면 언제나. 엔진·웹앱·클라우드 모두 이 판단 하나를 씀 */
    function exclLive(policy) { const P = normPolicy(policy); return (P.excl && P.excl.when) === 'on' ? !!P.on : true; }
    /* 그 곳(mkt·strat·rec)을 켰고 '언제 뺄까'에 맞고 무시 판매자가 있으면 판매자 번호 Set, 아니면 null(= 지금 그대로) */
    function exclSet(policy, place) { const P = normPolicy(policy); if (!P.excl || !P.excl[place] || !exclLive(P)) return null; const L = ignored(P); return L.length ? new Set(L) : null; }
    /* 매물 줄(첫 쪽 원본 sellerCode · 블록 sc 둘 다)에서 무시 판매자 줄을 뺌 — set이 없거나 뺄 것이 없으면 같은 배열 그대로 */
    function dropIgnored(rows, set) { if (!set || !Array.isArray(rows) || !rows.length) return rows; const o = rows.filter((r) => !(r && set.has(String(r.sellerCode != null ? r.sellerCode : r.sc != null ? r.sc : '')))); return o.length === rows.length ? rows : o; }
    const blNow = (o) => (o && o.at) || new Date().toISOString();
    function blAdd(P, sc, o) { o = o || {}; sc = String(sc || ''); if (!sc || sc === '996008') return false; const x = P.sellers[sc]; if (x && x.stance === 'ignore') return false; const at = blNow(o);
      P.sellers[sc] = { ...(x || { strat: '', condSet: '', cond: {}, note: '' }), name: o.name || (x && x.name) || null, stance: 'ignore', blPrev: x ? x.stance || 'auto' : null, blAt: at, blBy: o.by || null, note: o.memo != null && o.memo !== '' ? String(o.memo) : (x && x.note) || '' };
      (P.blLog = P.blLog || []).push({ sc, name: P.sellers[sc].name, act: 'on', at, by: o.by || null, memo: o.memo || null, prev: x ? x.stance || 'auto' : null }); return true; }
    /* 해제 — 지정 전 모습으로(지정 전에 없던 판매자면 목록에서 빠짐 · 있던 판매자면 그 태세로) · 기록은 blLog에 남김(지우지 않음) */
    function blOff(P, sc, o) { o = o || {}; sc = String(sc || ''); const x = P.sellers[sc]; if (!x || x.stance !== 'ignore') return false; const at = blNow(o);
      (P.blLog = P.blLog || []).push({ sc, name: x.name || null, act: 'off', at, by: o.by || null, memo: o.memo || null, since: x.blAt || null });
      if (x.blPrev === null) delete P.sellers[sc]; else { const y = { ...x, stance: x.blPrev && x.blPrev !== 'ignore' ? x.blPrev : 'auto' }; delete y.blPrev; delete y.blAt; delete y.blBy; P.sellers[sc] = y; } return true; }
    function blMemo(P, sc, memo, o) { o = o || {}; sc = String(sc || ''); const x = P.sellers[sc]; if (!x) return false; const v = String(memo || ''); if ((x.note || '') === v) return false; x.note = v; (P.blLog = P.blLog || []).push({ sc, name: x.name || null, act: 'memo', at: blNow(o), by: o.by || null, memo: v }); return true; }
    /* 목록 — 지금 무시 중(on) + 해제된 판매자(off · 마지막 기록이 해제) */
    function blList(policy) { const P = normPolicy(policy); const on = ignored(P).map((sc) => { const x = P.sellers[sc]; return { sc, name: x.name || null, at: x.blAt || null, by: x.blBy || null, memo: x.note || '', prev: x.blPrev === undefined ? 'auto' : x.blPrev, on: true }; });
      const last = new Map(); for (const e of P.blLog || []) if (e && e.sc && e.act !== 'memo') last.set(String(e.sc), e); const off = [];
      for (const [sc, e] of last) if (e.act === 'off' && !(P.sellers[sc] && P.sellers[sc].stance === 'ignore')) off.push({ sc, name: e.name || null, at: e.since || null, offAt: e.at, offBy: e.by || null, memo: e.memo || '', on: false });
      return { on, off }; }


    /* ═════════ (엔진 0.17.22 · 감시 전략 설정 개편 판 ③ · 설계 STRAT_DESIGN_1119 2.3~2.11) 📐 규칙 층 — 부르는 곳 없이 먼저 ═════════
     *  새 함수는 아무도 부르지 않음(죽은 코드) — 이 판이 나가도 값은 하나도 안 바뀜. 규칙이 없거나(빈 꼴) 깨지면 judgeRule = 지금 judge 그대로(글자까지 같음 — 시험 tRULE 1번).
     *  규칙 = { floor{costMult,listPct,minProfit,minPrice}, ceil{listPct,newPct}, step{downPct,upPct}, maxDropPct, time{hours,restH,dayMax,minGapPct},
     *           when[≤8 {k,op,v,act,strat?,mult?}], ladder[≤5 {afterD,strat?,maxFollow?,downPct?,approve?}], back{goneH,to,stepPct}, applyDir{up,down} }
     *  넘겨받은 칸만 쓴다(RULE_DEF는 화면에 보일 기본값 — 칸이 없으면 그 손잡이는 걸리지 않음). 바닥은 늘 마지막에 걸리고 올리기만 한다. */
    const RULE_DEF = { floor: { costMult: 1.1, listPct: '', minProfit: 0, minPrice: 1000 }, ceil: { listPct: 130, newPct: 90 }, step: { downPct: 15, upPct: 15 }, maxDropPct: '', time: { hours: '', restH: '', dayMax: 2, minGapPct: '' }, when: [], ladder: [], back: { goneH: '', to: 'base', stepPct: 10 }, detect: { fastLagMin: '', minEvents: 3 }, applyDir: { up: '', down: '' } };
    const RULE_RNG = { 'floor.costMult': [1, 3], 'floor.listPct': [5, 100], 'floor.minProfit': [0, 100000], 'floor.minPrice': [100, 100000], 'ceil.listPct': [50, 300], 'ceil.newPct': [50, 100], 'step.downPct': [1, 30], 'step.upPct': [1, 30], maxDropPct: [1, 80],
      'time.restH': [0, 240], 'time.dayMax': [1, 10], 'time.minGapPct': [0, 20], 'back.goneH': [1, 720], 'back.stepPct': [1, 30], 'detect.fastLagMin': [1, 1440], 'detect.minEvents': [1, 20] };
    const RULE_MAX = { when: 8, ladder: 5 };
    const RULE_INFO = {
      'floor.costMult': ['바닥 — 매입가 배수', '배', '매입가 × 이 값 아래로는 안 내림(1.0 아래는 못 넣음 · 매입가를 모르는 상품은 이 칸 건너뜀)'], 'floor.listPct': ['바닥 — 정가 비율', '%', '정가 × 이 % 아래로는 안 내림(정가를 모르면 적용 안 함)'],
      'floor.minProfit': ['바닥 — 최저 이익', '원', '(값 − 수수료 − 매입가)가 이보다 작아지는 값으로는 안 내림'], 'floor.minPrice': ['바닥 — 최저가', '원', '이 값 아래로는 어떤 길로도 안 내림'],
      'ceil.listPct': ['천장 — 정가 비율', '%', '올리는 값의 한도 — 정가 × 이 %'], 'ceil.newPct': ['천장 — 새 책 대비', '%', '새 책을 살 수 있을 때 새 책 값 × 이 %까지만'],
      'step.downPct': ['따라 내림 폭 — 한 번에', '%', '한 걸음에 내릴 수 있는 가장 큰 폭(넘는 목표는 폭까지만 가고 까닭을 남김)'], 'step.upPct': ['올림 폭 — 한 번에', '%', '한 걸음에 올릴 수 있는 가장 큰 폭'],
      maxDropPct: ['감시 시작가 대비 합한 인하 한도', '%', '시작가에서 이만큼 넘게 내려가는 값은 바꾸지 않고 결정 대기로'], 'time.hours': ['움직이는 시간대', '', '예 9-22 — 이 시각(한국)에만 값을 바꿈'], 'time.restH': ['반응 시간(쉼)', '시간', '우리가 값을 바꾼 뒤 이 시간은 다시 안 바꿈'],
      'time.dayMax': ['하루 바꿈 횟수', '번', '한 상품 값을 하루(한국 날짜)에 바꾸는 횟수 — 넘으면 그날은 그대로'], 'time.minGapPct': ['작은 차이 무시', '%', '상대가 우리보다 이만큼도 안 싸면 대응 안 함'],
      'back.goneH': ['추격자가 사라진 뒤 기다림', '시간', '추격자 매물이 첫 쪽에서 사라진 뒤 이 시간이 지나면 되돌림'], 'back.to': ['되돌릴 곳', '', 'base 판정 엔진 목표 · start 감시 시작가 · keep 안 되돌림'], 'back.stepPct': ['되돌릴 때 한 걸음', '%', '되돌림 한 번에 올리는 폭'],
      'detect.fastLagMin': ['빠른 추격자로 보는 반응 시간', '분', '추격자가 값을 내리고 평균 이 분 안에 또 따라 내리면 🤖 빠른 추격자(비움 = 판매자 탭 관찰 기준 fastLagMin 그대로 · 기본 60분)'], 'detect.minEvents': ['빠른 추격자 판정에 필요한 사건 수', '번', '따라 내린 기록이 이보다 적으면 「아직 모름」 — 빠른 추격자로 보지 않음(기본 3번)'],
      'applyDir.up': ['올림 반영 방식', '', 'approve 결정 대기 · auto 바로 반영 · 비움 = 위 값 따름'], 'applyDir.down': ['내림 반영 방식', '', 'approve 결정 대기 · auto 바로 반영 · 비움 = 위 값 따름'],
    };
    /* 조건별 규칙 — 조건 종류(k)마다 쓸 수 있는 비교 · 행동(act) */
    const WHEN_K = { comp: { name: '경쟁 매물 수(우리 등급 이상 · 첫 쪽)', ops: ['<=', '>='] }, total: { name: '전체 중고 수', ops: ['<=', '>='] }, ourQty: { name: '같은 책 우리 재고 수', ops: ['<=', '>='] }, grade: { name: '우리 등급', ops: ['='] }, edition: { name: '판본 딱지', ops: ['has', 'none'] },
      tier: { name: '재고 기간(T1~T8)', ops: ['>=', '<='] }, days: { name: '감시 시작 뒤 날수', ops: ['>='] }, price: { name: '우리 값', ops: ['>=', '<='] }, gapPct: { name: '상대와의 차이(%)', ops: ['>='] }, rarity: { name: '희소 분류', ops: ['='] } };
    const WHEN_ACT = { strat: '이 추격자 전략으로(strat 이름)', hold: '값을 움직이지 않음', approve: '계산은 하되 결정 대기로', off: '추격자 대응만 끔(보통 감시 판정은 그대로)', floorUp: '매입가 배수를 더 높게(mult · 낮게는 못 함)' };
    const ruleNum = (v) => { if (v == null || v === '' || typeof v === 'boolean') return null; const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[,%원\s]/g, '')); return Number.isFinite(n) ? n : null; };
    const ruleClamp = (path, n) => { const g = RULE_RNG[path]; return g ? Math.min(g[1], Math.max(g[0], n)) : n; };
    const ruleHoursOk = (s) => { const m = String(s == null ? '' : s).match(/^\s*(\d{1,2})\s*[-~]\s*(\d{1,2})\s*$/); return !!m && +m[1] <= 24 && +m[2] <= 24 && +m[1] !== +m[2]; };
    const ruleGet = (r, path) => path.split('.').reduce((a, k) => (a && typeof a === 'object' ? a[k] : undefined), r);
    const ruleSet = (r, path, v) => { const ks = path.split('.'); let a = r; for (let i = 0; i < ks.length - 1; i++) { if (!a[ks[i]] || typeof a[ks[i]] !== 'object') a[ks[i]] = {}; a = a[ks[i]]; } a[ks[ks.length - 1]] = v; };
    /* ruleNorm — 아무 꼴 → 깨끗한 규칙. 숫자로 바꾸고 범위에 맞춤 · 모르는 칸 버림 · 목록 길이 자름 · 넘겨받지 않은 칸은 만들지 않음(빈 규칙 = {}) */
    function ruleNorm(r0) { const out = {}; if (!r0 || typeof r0 !== 'object' || Array.isArray(r0)) return out;
      for (const path of Object.keys(RULE_RNG)) { const n = ruleNum(ruleGet(r0, path)); if (n != null) ruleSet(out, path, ruleClamp(path, n)); }
      const hs = ruleGet(r0, 'time.hours'); if (hs != null && hs !== '' && ruleHoursOk(hs)) ruleSet(out, 'time.hours', String(hs).replace(/\s/g, '').replace('~', '-'));
      const bt = ruleGet(r0, 'back.to'); if (['base', 'start', 'keep'].includes(bt)) ruleSet(out, 'back.to', bt);
      for (const d of ['up', 'down']) { const v = ruleGet(r0, `applyDir.${d}`); if (v === 'approve' || v === 'auto') ruleSet(out, `applyDir.${d}`, v); }
      if (Array.isArray(r0.when)) { const w = r0.when.slice(0, RULE_MAX.when).map((x) => (x && typeof x === 'object' && !Array.isArray(x) ? { ...x } : { bad: true })); if (w.length) out.when = w; }
      if (Array.isArray(r0.ladder)) { const l = []; for (const x of r0.ladder.slice(0, RULE_MAX.ladder)) { const a = x && typeof x === 'object' ? ruleNum(x.afterD) : null; if (a == null || a < 0) continue;
          const s = { afterD: Math.min(3650, Math.round(a)) }; if (typeof x.strat === 'string' && x.strat) s.strat = x.strat; const mf = ruleNum(x.maxFollow); if (mf != null) s.maxFollow = Math.min(10, Math.max(0, Math.round(mf))); const dp = ruleNum(x.downPct); if (dp != null) s.downPct = ruleClamp('step.downPct', dp); if (x.approve === true) s.approve = true; l.push(s); }
        l.sort((a, b) => a.afterD - b.afterD); if (l.length) out.ladder = l; }
      return out; }
    const ruleEmpty = (rn) => !rn || !Object.keys(rn).length;
    /* ruleCheck(raw 규칙, ctx) → { stop[], warn[] } — 저장 전 검사(2.11). 줄 하나 = { code, msg } · stop이 하나라도 있으면 화면이 저장을 막음
     *  ctx(모두 선택) = { pol{sellers}, apply('approve'|'auto'), guardPct, previewRan, preview{hit,total}, expOver, noTrial, strat } */
    function ruleCheck(r0, ctx) { const stop = [], warn = []; ctx = ctx || {}; const r = r0 && typeof r0 === 'object' ? r0 : {}; const S = (code, msg) => stop.push({ code, msg }), W = (code, msg) => warn.push({ code, msg });
      const cm = ruleNum(ruleGet(r, 'floor.costMult')); if (cm != null && cm < 1) S('costMult', `바닥 매입가 배수 ${cm}는 1.0 아래라 못 넣음 — 매입가보다 싸게 파는 값은 막음`);
      const mp = ruleNum(ruleGet(r, 'floor.minProfit')); if (mp != null && mp < 0) S('minProfit', `최저 이익 ${mp}원은 음수라 못 넣음`);
      const hs = ruleGet(r, 'time.hours'); if (hs != null && hs !== '' && !ruleHoursOk(hs)) S('hours', `시간대 '${hs}'의 꼴이 틀림 — 예 9-22`);
      const wh = Array.isArray(r.when) ? r.when : []; if (wh.length > RULE_MAX.when) S('whenMax', `조건별 규칙 ${wh.length}줄 — ${RULE_MAX.when}줄까지만`);
      wh.slice(0, 50).forEach((x, i) => { const bad = whenBad(x); if (bad) S('whenBad', `조건별 규칙 ${i + 1}번째 줄: ${bad}`); });
      const ld = Array.isArray(r.ladder) ? r.ladder : []; if (ld.length > RULE_MAX.ladder) S('ladderMax', `사다리 ${ld.length}단 — ${RULE_MAX.ladder}단까지만`);
      for (let i = 1; i < ld.length; i++) { const a = ruleNum((ld[i - 1] || {}).afterD), b = ruleNum((ld[i] || {}).afterD); if (a == null || b == null || b <= a) { S('ladderOrder', `사다리 날수가 오름차순이 아님(${i}단 → ${i + 1}단)`); break; } }
      ld.forEach((x, i) => { if (x && x.strat && !STRATS_ALL[x.strat]) S('ladderStrat', `사다리 ${i + 1}단: 모르는 전략 '${x.strat}'`); });
      const sl = ctx.pol && ctx.pol.sellers && typeof ctx.pol.sellers === 'object' ? Object.keys(ctx.pol.sellers) : []; if (sl.length > 50) S('sellerMax', `판매자 예외 ${sl.length}명 — 50명까지만`); if (sl.includes('996008')) S('sellerOurs', '우리 판매자 번호는 예외에 못 넣음');
      if (ctx.apply === 'auto' && ctx.previewRan === false) S('noPreview', '미리 보기를 한 번도 안 돌리고 「바로 반영」 그룹에 적용할 수 없음');
      for (const path of Object.keys(RULE_RNG)) { const n = ruleNum(ruleGet(r, path)); if (n != null && path !== 'floor.costMult' && path !== 'floor.minProfit' && (n < RULE_RNG[path][0] || n > RULE_RNG[path][1])) W('range', `${(RULE_INFO[path] || [path])[0]} ${n} — 범위 ${RULE_RNG[path][0]}~${RULE_RNG[path][1]} 밖이라 맞춰 저장됨`); }
      if (+ctx.guardPct > 30) W('guard', `바로 반영 한도 ${ctx.guardPct}%는 30%를 넘음`);
      const names = [ctx.strat, ...ld.map((x) => x && x.strat), ...wh.map((x) => x && x.act === 'strat' && x.strat)]; if (ctx.apply === 'auto' && names.includes('lure')) W('lureAuto', '끌어내린 뒤 빠지기를 「바로 반영」으로 두면 값이 빨리 내려감');
      const dm = ruleNum(ruleGet(r, 'time.dayMax')); if (dm != null && dm > 5) W('dayMax', `하루 바꿈 횟수 ${dm}번은 5번을 넘음`);
      if (sl.some((sc) => ctx.pol.sellers[sc] && ctx.pol.sellers[sc].stance === 'aggressive')) W('aggressive', '판매자 「공격」 태세 — 끌어내리기');
      if (ctx.preview && ctx.preview.total > 0 && ctx.preview.hit / ctx.preview.total > 0.3) W('floorHit', '이 설정은 대부분 바닥에서 멈춥니다(미리 보기에서 바닥에 걸린 상품이 30% 넘음)');
      if (ctx.expOver) W('expOver', '실험 한도(판매중의 20%)를 이 그룹이 넘김'); if (ctx.noTrial && (wh.length || ld.length)) W('noTrial', '그림자 없이 처음 쓰는 손잡이 묶음(조건별 규칙·사다리)을 바로 적용');
      return { stop, warn }; }
    /* 조건별 규칙 한 줄이 읽히는가 — 읽히면 '', 아니면 까닭 */
    function whenBad(x) { if (!x || typeof x !== 'object' || x.bad) return '줄을 읽지 못함'; const K = WHEN_K[x.k]; if (!K) return `모르는 조건 '${x.k}'`; if (!K.ops.includes(x.op)) return `조건 '${x.k}'에 못 쓰는 비교 '${x.op}'`; if (!WHEN_ACT[x.act]) return `모르는 행동 '${x.act}'`;
      if (x.act === 'strat' && !STRATS_ALL[x.strat]) return `모르는 전략 '${x.strat}'`; if (x.act === 'floorUp' && !(ruleNum(x.mult) >= 1)) return '매입가 배수는 1.0 이상이어야 함';
      if (x.op !== 'has' && x.op !== 'none' && x.k !== 'grade' && x.k !== 'rarity' && ruleNum(x.v) == null) return '비교할 값이 숫자가 아님'; return ''; }
    /* whenPick(when, facts, skipped?) → { i, line } | null — 위에서부터 처음 맞는 한 줄 · 깨진 줄은 건너뛰고 skipped[]에 까닭을 더함 · 자료가 없는 조건은 '안 맞음'(없는 것을 0으로 보지 않음) */
    function whenPick(when, facts, skipped) { const f = facts || {}; if (!Array.isArray(when)) return null;
      for (let i = 0; i < Math.min(when.length, RULE_MAX.when); i++) { const x = when[i]; const bad = whenBad(x); if (bad) { if (skipped) skipped.push(`규칙 ${i + 1}번째 줄을 읽지 못해 건너뜀 — ${bad}`); continue; }
        let v = f[x.k]; if (x.k === 'tier') v = v == null ? null : tierN(v); let ok = false;
        if (x.op === 'has') ok = x.k === 'edition' && v === true; else if (x.op === 'none') ok = x.k === 'edition' && v === false;
        else if (v == null || v === '') ok = false; else if (x.op === '=') ok = String(v) === String(x.v); else { const a = ruleNum(v), b = ruleNum(x.v); ok = a != null && b != null && (x.op === '<=' ? a <= b : a >= b); }
        if (ok) return { i, line: x }; }
      return null; }
    /* ladderPick(ladder, days) → 그 날수에 걸린 단 | null — afterD ≤ 날수인 단 중 가장 늦은 것(13일·14일 경계) · 날수를 모르면 없음 */
    function ladderPick(ladder, days) { const d = ruleNum(days); if (d == null || !Array.isArray(ladder)) return null; let best = null;
      for (const s of ladder) { const a = s && ruleNum(s.afterD); if (a != null && a <= d && (!best || a >= best.afterD)) best = { ...s, afterD: a }; } return best; }
    /* ruleFor({ global, fold, preset, group, item }) → { v, src } — 손잡이마다 물려받아 한 벌로(차례 item > group > preset > fold > global) · 목록(when·ladder)은 층 통째로 · 빈 칸은 아래 층 */
    const RULE_LAYERS = ['item', 'group', 'preset', 'fold', 'global'];
    function ruleFor(L) { L = L || {}; const norm = {}; for (const k of RULE_LAYERS) norm[k] = ruleNorm(L[k]); const v = {}, src = {};
      const leaves = [...Object.keys(RULE_RNG), 'time.hours', 'back.to', 'applyDir.up', 'applyDir.down', 'when', 'ladder'];
      for (const path of leaves) for (const k of RULE_LAYERS) { const x = ruleGet(norm[k], path); if (x !== undefined) { ruleSet(v, path, x); src[path] = k; break; } }
      return { v, src }; }
    /* policyFor({ global, fold, group }) → 정책 한 벌 — 판매자 예외 겹치기(그룹 pol > 묶음 pol > 가게 전체 · 같은 판매자는 가장 위 층 한 줄 통째로). 층 pol이 하나도 없으면 가게 전체 정책 그대로(같은 값).
     *  가게 전체 정책이 꺼져 있어도 층 pol(판매자 예외·불특정 규칙)이 있으면 그 그룹 상품 판정에서만 켠 것으로 봄 · 무시 판매자를 다른 셈에서 빼는 excl·blLog는 가게 전체 것만 */
    function policyFor(L) { L = L || {}; const has = (p) => p && typeof p === 'object' && ((p.sellers && Object.keys(p.sellers).length) || (p.anon && typeof p.anon === 'object' && Object.keys(p.anon).length));
      const layers = [L.fold, L.group].filter(has); if (!layers.length) return L.global; const G = normPolicy(L.global); const sellers = { ...G.sellers }, condSets = { ...G.condSets }; let anon = G.anon;
      for (const p of layers) { for (const [sc, x] of Object.entries(p.sellers || {})) if (sc !== '996008' && x && typeof x === 'object') sellers[sc] = x; Object.assign(condSets, p.condSets || {}); if (p.anon && typeof p.anon === 'object' && Object.keys(p.anon).length) anon = { ...G.anon, ...p.anon, rules: { ...G.anon.rules, ...(p.anon.rules || {}) }, cond: { ...(p.anon.cond || {}) } }; }
      return { ...G, on: true, sellers, condSets, anon }; }
    /* ruleFloor(o, rule, mult?) → { v, by, why[], skip[] } — 바닥 다섯 중 가장 높은 것(판정 엔진 바닥 o.floor · 조건 묶음 합한 한도 o.groupFloor · 매입가×배수 · 정가×% · 최저 이익 · 최저가). 규칙은 올리기만 함 · 아는 값이 없으면 그 칸 건너뜀
     *  o.facts = { cost 매입가, list 정가, S 판매가 평가 설정(수수료율 등), ship 배송 정책 }  mult = 조건별 규칙 floorUp이 더 높인 배수 */
    function ruleFloor(o, rule, mult) { o = o || {}; const f = o.facts || {}; const r = ruleNorm(rule); const c = []; const skip = []; const add = (v, by, why) => { if (Number.isFinite(v) && v > 0) c.push({ v, by, why }); };
      if (o.floor > 0) add(+o.floor, 'engine', `판정 엔진 바닥 ${(+o.floor).toLocaleString()}원`); if (o.groupFloor > 0) add(+o.groupFloor, 'group', `조건 묶음 합한 한도 ${(+o.groupFloor).toLocaleString()}원`);
      const cost = ruleNum(f.cost), list = ruleNum(f.list); const fl = r.floor || {}; let cm = fl.costMult != null ? fl.costMult : null; const mm = ruleNum(mult); if (mm != null && mm >= 1) cm = Math.max(cm != null ? cm : 1, mm);
      if (cm != null) { if (cost > 0) add(snapUp(cost * cm), 'costMult', `매입가 ${cost.toLocaleString()}원 × ${cm} = ${snapUp(cost * cm).toLocaleString()}원`); else skip.push('매입가 모름 — 매입가 배수 칸 건너뜀'); }
      if (fl.listPct != null) { if (list > 0) add(snapUp(list * fl.listPct / 100), 'listPct', `정가 ${list.toLocaleString()}원 × ${fl.listPct}%`); else skip.push('정가 모름 — 정가 비율 칸 건너뜀'); }
      if (fl.minProfit != null) { if (cost > 0) { const m = minPriceFor(cost + fl.minProfit, { policy: f.ship }, f.S); if (m != null) add(m, 'minProfit', `최저 이익 ${fl.minProfit.toLocaleString()}원을 남기는 가장 낮은 값 ${m.toLocaleString()}원`); } else skip.push('매입가 모름 — 최저 이익 칸 건너뜀'); }
      if (fl.minPrice != null) add(snapUp(fl.minPrice), 'minPrice', `최저가 ${fl.minPrice.toLocaleString()}원`);
      let best = null; for (const x of c) if (!best || x.v > best.v) best = x; return { v: best ? best.v : 0, by: best ? best.by : null, why: best ? [`바닥 ${best.v.toLocaleString()}원 — ${best.why}`] : [], skip }; }
    /* ruleCeil(o, rule) → { v, why } | null — 올리는 값의 천장(정가 비율·새 책 대비 중 낮은 것) · 알 수 있는 값이 없으면 null */
    function ruleCeil(o, rule) { o = o || {}; const f = o.facts || {}; const cl = (ruleNorm(rule).ceil) || {}; const c = [];
      if (cl.listPct != null && ruleNum(f.list) > 0) c.push({ v: snapDown(f.list * cl.listPct / 100), why: `정가 ${(+f.list).toLocaleString()}원 × ${cl.listPct}%` });
      if (cl.newPct != null && ruleNum(f.newPrice) > 0) c.push({ v: snapDown(f.newPrice * cl.newPct / 100), why: `새 책 ${(+f.newPrice).toLocaleString()}원 × ${cl.newPct}%` });
      let best = null; for (const x of c) if (!best || x.v < best.v) best = x; return best ? { v: best.v, why: `천장 ${best.v.toLocaleString()}원 — ${best.why}` } : null; }
    /* judgeRule(o) — judge의 입력 + { rule, facts, dayN, polFold, polGroup, goneAt, groupFloor } → judge의 출력(규칙이 있을 때만 rule{ hit[], cut[], approve, dry, auto } 더함)
     *  차례: 0 규칙 없음/깨짐 → judge 그대로 · 1 때(시간대·쉼·하루 횟수) · 2 조건별 규칙 · 3 사다리 · 4 작은 차이 · 5 judge(정책 겹침 · 정한 전략) · 6 되돌림 · 7 조임(천장 → 한 번 폭 → 합한 인하 한도 → 바닥(늘 마지막) → 단위 맞춤) · 8 반영 표시
     *  dry = 규칙이 값을 그대로 두게 했음(때·조건·작은 차이·되돌림 기다림 · 합한 인하 한도) */
    function judgeRule(o) { o = o || {}; const pol = o.polFold || o.polGroup ? policyFor({ global: o.policy, fold: o.polFold, group: o.polGroup }) : o.policy; const jo = (x) => (pol === o.policy ? judge(x) : judge({ ...x, policy: pol }));
      let res = null; try { res = ruleStep(o, pol, jo); } catch (e) { res = null; } return res || jo(o); }
    function ruleStep(o, pol, jo) { const rn = ruleNorm(o.rule); if (ruleEmpty(rn)) return null;
      const f = o.facts || {}; const now = o.now || new Date().toISOString(); const cur = o.cur != null ? +o.cur : null; const ch = o.chaser || null; const hit = [], cut = []; let approve = false, dry = false, auto = false; const tm = rn.time || {};
      const prevSt = o.state && typeof o.state === 'object' ? o.state : null; const lastMove = o.lastMoveAt || (prevSt && prevSt.lastMoveAt) || null;
      const hold = (why, held) => { const rule = { hit: [...hit, why], cut, approve, dry: true, auto }; return { t: cur, state: prevSt && prevSt.active ? prevSt : null, reasons: [why], active: !!(prevSt && prevSt.active), nextAt: prevSt && prevSt.active ? prevSt.nextAt || null : null, plan: plan({ ...o, policy: pol }), held, rule }; };
      if (tm.hours && !inHours(now, tm.hours)) return hold(`규칙 시간대 ${tm.hours}시(한국) 밖 — 지금은 움직이지 않음`, 'rule-hours');
      if (tm.restH > 0 && lastMove && t(now) - t(lastMove) < tm.restH * HOUR) return hold(`규칙 쉼 ${tm.restH}시간 — 마지막으로 값을 바꾼 지 ${Math.round((t(now) - t(lastMove)) / HOUR * 10) / 10}시간`, 'rule-rest');
      if (tm.dayMax > 0 && o.dayN && o.dayN.day === kstDay(now) && +o.dayN.n >= tm.dayMax) return hold(`규칙 하루 ${tm.dayMax}번 — 오늘 이미 ${o.dayN.n}번 바꿈, 오늘은 그대로`, 'rule-day');
      const days = f.days != null ? f.days : o.days; const facts = { ...f, days, price: f.price != null ? f.price : cur, gapPct: f.gapPct != null ? f.gapPct : ch && cur > 0 && ch.price < cur ? (cur - ch.price) / cur * 100 : null };
      let sName = null, sExtra = {}, off = false, mult = null, downPct = rn.step ? rn.step.downPct : null; const skipped = []; const w = whenPick(rn.when, facts, skipped); for (const s of skipped) hit.push(s);
      if (w) { const x = w.line; const tag = `조건별 규칙 ${w.i + 1}번째 줄(${WHEN_K[x.k].name})이 맞음`;
        if (x.act === 'hold') return hold(`${tag} — 값 유지`, 'rule-when'); hit.push(`${tag} — ${WHEN_ACT[x.act].split('(')[0]}`);
        if (x.act === 'strat') sName = x.strat; else if (x.act === 'off') off = true; else if (x.act === 'approve') approve = true; else if (x.act === 'floorUp') mult = ruleNum(x.mult); }
      if (!w || w.line.act !== 'strat') { const st = ladderPick(rn.ladder, days); if (st) { hit.push(`사다리 ${st.afterD}일~ 단`); if (st.strat) sName = st.strat; if (st.maxFollow != null) sExtra.maxFollow = st.maxFollow; if (st.downPct != null) downPct = st.downPct; if (st.approve) approve = true; } }
      if (sName && !STRATS_ALL[sName]) { hit.push(`모르는 전략 '${sName}' — 양보로 봄`); sName = 'yield'; }
      if (tm.minGapPct > 0 && facts.gapPct != null && facts.gapPct > 0 && facts.gapPct < tm.minGapPct) return hold(`추격자가 우리보다 ${Math.round(facts.gapPct * 10) / 10}%만 쌈(< ${tm.minGapPct}%) — 작은 차이라 대응하지 않음`, 'rule-gap');
      const g0 = o.groupStrat || { name: 'yield' }; const jin = { ...o }; if (sName) jin.groupStrat = { ...g0, name: sName, ...sExtra }; else if (Object.keys(sExtra).length) jin.groupStrat = { ...g0, ...sExtra }; if (off) jin.chaser = null;
      const r = jo(jin); let tt = r.t; const reasons = [...(r.reasons || [])]; const state = r.state;
      /* 6 되돌림 — 추격자가 사라진 뒤 기다림 */
      const bk = rn.back; if (bk && bk.goneH > 0 && bk.to !== 'keep' && !ch && !off && tt != null && cur != null) { const goneAt = o.goneAt || (prevSt && prevSt.end === 'chaserGone' ? prevSt.endedAt : null) || (prevSt && prevSt.active && state && state.endedAt) || null;
        const tgt = bk.to === 'start' ? (o.start != null ? +o.start : null) : tt;
        if (goneAt && tgt != null && tgt > cur) { if (t(now) - t(goneAt) < bk.goneH * HOUR) { hit.push(`되돌림: 추격자가 사라진 지 ${Math.round((t(now) - t(goneAt)) / HOUR * 10) / 10}시간 < ${bk.goneH}시간 — 기다림`); tt = cur; dry = true; }
          else { const stp = bk.stepPct != null ? bk.stepPct : 10; tt = Math.min(tgt, snapUp(cur * (1 + stp / 100))); hit.push(`되돌림: 추격자가 사라진 지 ${bk.goneH}시간 지남 — ${bk.to === 'start' ? '감시 시작가' : '기준'} 쪽으로 한 걸음(${stp}%)`); } } }
      /* 7 조임 */
      const t0 = tt; let floorV = 0;
      if (tt != null) {
        const cap = ruleCeil(o, rn); if (cap && tt > cap.v && (cur == null || tt > cur)) { tt = cur == null ? cap.v : Math.max(cap.v, cur); cut.push(`${cap.why} 위로는 안 올림 → ${tt.toLocaleString()}원`); }
        const st = rn.step || {}; if (cur > 0) { if (downPct != null && tt < cur && (cur - tt) / cur * 100 > downPct) { tt = Math.min(cur, snapUp(cur * (1 - downPct / 100))); cut.push(`한 번에 ${downPct}%까지만 내림 → ${tt.toLocaleString()}원`); }
          if (st.upPct != null && tt > cur && (tt - cur) / cur * 100 > st.upPct) { tt = Math.max(cur, snapDown(cur * (1 + st.upPct / 100))); cut.push(`한 번에 ${st.upPct}%까지만 올림 → ${tt.toLocaleString()}원`); } }
        if (rn.maxDropPct != null && o.start > 0 && cur != null && tt < o.start * (1 - rn.maxDropPct / 100) && tt < cur) { cut.push(`감시 시작가 ${(+o.start).toLocaleString()}원에서 합쳐 ${rn.maxDropPct}% 넘게 내려가 값을 바꾸지 않고 결정 대기로`); tt = cur; approve = true; dry = true; }
        const fl = ruleFloor(o, rn, mult); floorV = fl.v; for (const s of fl.skip) hit.push(s); if (floorV > 0 && tt < floorV) { cut.push(`${fl.why[0]} 아래로는 안 내림 → ${floorV.toLocaleString()}원`); tt = floorV; }
        if (tt !== t0 && tt > 0) { if (cur != null && tt < cur) tt = Math.min(snapUp(tt), cur); else if (cur != null && tt > cur) { const v = snapDown(tt); tt = v < cur ? tt : v; } if (floorV > 0 && tt < floorV) tt = floorV; } }
      /* 8 반영 표시 */
      const dir = tt != null && cur != null ? (tt > cur ? 'up' : tt < cur ? 'down' : null) : null; const ad = dir && rn.applyDir ? rn.applyDir[dir] : null; if (ad === 'approve') approve = true; else if (ad === 'auto') auto = true;
      return { ...r, t: tt, reasons: [...hit, ...cut, ...reasons], rule: { hit, cut, approve, dry, auto } }; }

    /* 이름 없이 손잡이만 덮기(옵트인 o.overlay) — stratFor는 chase에 이름이 있어야 그 층 것으로 봄(stratOk). 이 함수는 o.overlay가 참일 때만, 이름 없는 chase({ every: 12 } 같은)를 그 아래 층에서 정해진 전략 위에 겹침(윗층 것이 이김).
     *  o.overlay가 없으면 stratFor 그대로(옛 입력은 답이 한 글자도 안 바뀜) · 이름이 있는 층은 지금처럼 통째로 그 층 것 */
    /* fastChaserOf(stat, rule, obsCfg) — 🤖 빠른 추격자 판정(정범님 11/19 14:38) · stat = { lagSum(분 합), lagN(사건 수) } · 기준 분 = 규칙 detect.fastLagMin → 없으면 관찰 기준 obsCfg.fastLagMin → 없으면 60 · 사건 수가 minEvents(기본 3) 아래면 fast = null(아직 모름 — 빠른 추격자로 보지 않음) */
    function fastChaserOf(stat, rule, obsCfg) { const rn = ruleNorm(rule); const d = rn.detect || {}; const oc = ruleNum(obsCfg && obsCfg.fastLagMin); const obs = oc != null && oc >= 1 && oc <= 1440 ? Math.round(oc) : 60; const lim = d.fastLagMin != null ? d.fastLagMin : obs; const minN = d.minEvents != null ? d.minEvents : 3;
      const n = Math.max(0, Math.round(ruleNum(stat && stat.lagN) || 0)); const sum = ruleNum(stat && stat.lagSum); const avg = n > 0 && sum != null && sum >= 0 ? sum / n : null;
      return { fast: n < minN || avg == null ? null : avg < lim, avg: avg == null ? null : Math.round(avg * 10) / 10, n, minN, lim, src: d.fastLagMin != null ? 'rule' : oc != null ? 'obs' : 'default' }; }
    /* 새 기본값 둘(정범님 11/19 13:42 · I-1119-1342-12) — 아무도 부르지 않는 순수 함수 · 판정(judge·judgeRule)은 이 값을 읽지 않으므로 옛 입력의 답은 그대로
     *  ① 처음 7일은 값을 안 바꾸고 셈만(그림자) — 관제창 설정에 값이 없을 때의 엔진 기본(tryMode 'dry' · tryDays 7). 설정에 값이 있으면 그 값. CTRL_DEF 자체('ask')는 건드리지 않음(화면은 판 ①)
     *  ② 🤖 빠른 추격형 판매자는 누르지 않아도 1위를 쫓지 않고 2위로 물러남(유동 태세 · second · 간격 15% · 따를 횟수 0) */
    const TRY_DEF = { mode: 'dry', days: 7 };
    const FAST_DEF = { stance: 'flexible', rules: { second: true, follow: false }, cond: { backPct: 15, maxFollow: 0 } };
    function tryDefault(ctrl) { const c = ctrl && typeof ctrl === 'object' ? ctrl : {}; const m = ['ask', 'dry', 'live'].includes(c.tryMode) ? c.tryMode : null; const d = Math.round(+c.tryDays); const days = c.tryDays != null && c.tryDays !== '' && d >= 1 && d <= 60 ? d : null;
      return { mode: m || TRY_DEF.mode, days: days || TRY_DEF.days, src: { mode: m ? 'ctrl' : 'default', days: days ? 'ctrl' : 'default' } }; }
    function fastChaserEntry(name) { return { ...(name ? { name } : {}), stance: FAST_DEF.stance, rules: { ...FAST_DEF.rules }, cond: { ...FAST_DEF.cond } }; }
    function stratForOv(o) { o = o || {}; if (!o.overlay) return stratFor(o); const bare = (c) => !!(c && typeof c === 'object' && !c.name && Object.keys(c).length);
      const seen = new Set(); const gs = (o.groups || []).filter((g) => g && g.id != null && !seen.has(String(g.id)) && seen.add(String(g.id))); const g = gs.length === 1 ? gs[0] : null; const F = o.fold && typeof o.fold === 'object' && Array.isArray(o.fold.gids) ? o.fold : null;
      const lay = { item: bare(o.item) ? o.item : null, group: g && bare(g.chase) ? g.chase : null, preset: g && g.preset && bare(g.preset.chase) ? g.preset.chase : null, fold: F && g && F.gids.map(String).includes(String(g.id)) && bare(F.chase) ? F.chase : null };
      const strip = { ...o, item: bare(o.item) ? undefined : o.item, groups: (o.groups || []).map((x) => (x && (bare(x.chase) || (x.preset && bare(x.preset.chase))) ? { ...x, chase: bare(x.chase) ? null : x.chase, preset: x.preset && bare(x.preset.chase) ? { ...x.preset, chase: null } : x.preset } : x)), fold: F && bare(F.chase) ? { ...F, chase: null } : o.fold };
      const res = stratFor(strip); const rank = RULE_LAYERS.indexOf(res.src === 'global' ? 'global' : res.src); const over = []; let strat = res.strat;
      for (let i = Math.min(rank, RULE_LAYERS.length) - 1; i >= 0; i--) { const k = RULE_LAYERS[i]; if (lay[k]) { strat = { ...strat, ...lay[k] }; over.push(k); } }
      if (!over.length || res.src === 'item' && res.strat.name === 'hold' && o.item === 'off') return res; return { ...res, strat, ov: over, text: `${res.text} · 손잡이만 덮은 층: ${over.join('·')}` }; }
    /* ═══ 🧬 판매자 유형 sellerType · typeAdvice (판 ⑦ strat6 · 정범님 11/19 I-1119-1304-10) — 순수 함수(저장·화면 없음) · 셈만 ═══
     *  f = 한 판매자의 사실 한 벌: { ov 우리와 겹친 횟수, cheap 우리보다 싼 횟수, low 최저가 차지 횟수, near 공정가 근처 횟수, dumpN 덤핑 횟수, refN 기준 수,
     *    multi 같은 책 여러 매물 낸 책 수, ev 그 판매자를 따라 내린 기록 수, lagMin 반응 시간 중앙값(분), upN 우리 올림 뒤 따라 올린 횟수, quiet 가만히 있는 날수 또는 null, fresh 처음 겹친지 며칠, chased 우리가 따라간 적 있는지, cfg 문턱 덮기 }
     *  차례(여러 유형이 맞으면 위가 이김): 새로 겹침 > 덤핑형 > 빠른 추격형 > 느린 추격형 > 최저가 지킴형 > 따라 올림형 > 여러 매물형 > 모범가형 > 가만형 > 모름 */
    const SELLER_TYPES = {
      fresh: ['🆕', '새로 겹침', '처음 겹친 지 얼마 안 돼 아직 모릅니다 — 지켜봅니다'],
      dump: ['📉', '덤핑형', '시세보다 훨씬 싸게 던지는 판매자'],
      fast: ['🤖', '빠른 추격형', '우리가 값을 내리면 몇 분 안에 따라 내리는 판매자'],
      slow: ['🐢', '느린 추격형', '우리가 값을 내리면 따라 내리지만 한참 뒤에 움직이는 판매자'],
      keeper: ['🥇', '최저가 지킴형', '우리와 자주 겹치면서 늘 최저가 자리를 차지하고 따라 내리지는 않는 판매자'],
      riser: ['🎣', '따라 올림형', '우리가 올리면 따라 올리는 판매자 — 올릴 때 함께 가는 상대'],
      multi: ['👥', '여러 매물형', '같은 책을 여러 개 올려 두는 판매자'],
      fair: ['🏅', '모범가형', '값이 시세 근처인 판매자'],
      still: ['🧍', '가만형', '값을 거의 안 바꾸는 판매자'],
      unknown: ['❔', '아직 모름', '자료가 모자라 유형을 말할 수 없습니다'],
    };
    const TYPE_CFG = { sampleOv: 5, sampleEv: 3, fastMin: 60, dumpShare: 50, keeperOv: 10, keeperShare: 40, riserN: 2, fairShare: 60, multiN: 3, freshDays: 7, stillDays: 30 };
    function sellerType(f, cfg0) { f = f && typeof f === 'object' ? f : {}; const c = { ...TYPE_CFG, ...(cfg0 && typeof cfg0 === 'object' ? cfg0 : {}), ...(f.cfg && typeof f.cfg === 'object' ? f.cfg : {}) };
      const n = (x) => (+x > 0 ? +x : 0); const ov = n(f.ov), ev = n(f.ev), ref = n(f.refN) || ov; const pct = (a, b) => (b > 0 ? a / b * 100 : 0); const why = [];
      const enough = ov >= c.sampleOv || ev >= c.sampleEv;
      const mk = (k, w) => ({ type: k, icon: SELLER_TYPES[k][0], label: SELLER_TYPES[k][1], text: SELLER_TYPES[k][2], why: w, enough });
      if (f.fresh != null && +f.fresh < c.freshDays && !enough) return mk('fresh', [`처음 겹친 지 ${Math.round(+f.fresh)}일 · 겹침 ${ov}번 — 표본 모자람`]);
      if (!enough) return mk('unknown', [`겹침 ${ov}번 · 따라 내린 기록 ${ev}건 — 표본이 ${c.sampleOv}번(또는 ${c.sampleEv}건)보다 적음`]);
      const dumpShare = pct(n(f.dumpN), ref); if (n(f.dumpN) > 0 && dumpShare > c.dumpShare) return mk('dump', [`기준 ${ref}번 중 시세 70% 아래 ${Math.round(dumpShare)}% > ${c.dumpShare}%`]);
      const lag = f.lagMin != null && f.lagMin !== '' ? +f.lagMin : null;
      if (ev >= c.sampleEv && lag != null && lag >= 0) { if (lag < c.fastMin) return mk('fast', [`따라 내린 기록 ${ev}건 · 반응 ${Math.round(lag)}분 < ${c.fastMin}분`]); return mk('slow', [`따라 내린 기록 ${ev}건 · 반응 ${Math.round(lag)}분 ≥ ${c.fastMin}분`]); }
      const lowShare = pct(n(f.low), ov); if (ov >= c.keeperOv && lowShare >= c.keeperShare && !f.chased) return mk('keeper', [`겹침 ${ov}번 중 최저가 차지 ${Math.round(lowShare)}% ≥ ${c.keeperShare}% · 따라 내린 기록 없음`]);
      if (n(f.upN) >= c.riserN) return mk('riser', [`우리가 올린 뒤 따라 올린 횟수 ${n(f.upN)}번 ≥ ${c.riserN}번`]);
      if (n(f.multi) >= c.multiN) return mk('multi', [`같은 책을 여러 개 올린 책 ${n(f.multi)}권 ≥ ${c.multiN}권`]);
      const nearShare = pct(n(f.near), ref); if (nearShare >= c.fairShare) return mk('fair', [`기준 ${ref}번 중 시세 근처 ${Math.round(nearShare)}% ≥ ${c.fairShare}%`]);
      if (f.quiet != null && +f.quiet >= c.stillDays) return mk('still', [`값을 ${Math.round(+f.quiet)}일째 안 바꿈`]);
      if (!f.chased && ev === 0 && ov >= c.sampleOv) return mk('still', ['따라 내린 기록이 없음(값을 안 바꾸는지는 아직 못 봄 — 짐작)']);
      return mk('unknown', ['어느 유형에도 뚜렷이 맞지 않음']); }
    /* typeAdvice(type) → { rec: 추천 한 줄 {name?, stance, strat?, rules?, cond, from:'type:<유형>'} | null, alt: 둘째 길 | null, text, altText, store } — 정범님이 [예외로 적용]을 눌러야 들어감 */
    function typeAdvice(type, name) { const nm = name ? { name: String(name) } : {}; const R = (o) => ({ ...nm, ...o, from: 'type:' + type });
      switch (type) {
        case 'fast': return { rec: R({ stance: 'flexible', rules: { second: true, follow: false }, cond: { backPct: 15, maxFollow: 0, stopAt: 'yield' } }), alt: R({ stance: 'flexible', rules: { second: true, follow: true }, cond: { backPct: 15, maxFollow: 1, rangePct: 5, stopAt: 'hold' } }), text: '따라가지 않고 2위로 물러남(우리 값을 지킴 · 1위는 한동안 내줌)', altText: '한 번만 따라가고 멈춤(1위를 한 번은 되찾으려 함 · 한 번은 깎임)' };
        case 'slow': return { rec: R({ stance: 'flexible', rules: { second: true, follow: true }, cond: { maxFollow: 1, rangePct: 5, stopAt: 'hold' } }), alt: R({ stance: 'normal', cond: {} }), text: '한 번만 따라가고 멈춤(5% 안에서)', altText: '추격자로 보지 않고 보통 매물처럼 겨룸' };
        case 'dump': return { rec: R({ stance: 'ignore', cond: {} }), alt: R({ stance: 'defensive', strat: 'yield', cond: {} }), text: '무시 — 따라가지 않고 이 판매자를 기준에서 뺌', altText: '양보 — 우리 값을 지키고 자리를 내줌', store: '가게 전체 블랙리스트에도 올릴지는 「🎯 추격자 엔진」 화면에서 따로 정합니다' };
        case 'keeper': return { rec: R({ stance: 'defensive', strat: 'yield', cond: { minGapPct: 3 } }), alt: R({ stance: 'defensive', strat: 'shadow', cond: { minGapPct: 3 } }), text: '방어적 — 3% 넘게 싸지 않으면 반응하지 않음', altText: '그림자로 지켜봄(값은 안 바꿈)' };
        case 'riser': return { rec: R({ stance: 'aggressive', strat: 'lift', cond: {} }), alt: R({ stance: 'aggressive', strat: 'match', cond: {} }), text: '올릴 때 함께 올라감(올리기 전략)', altText: '같은 값에 맞춤' };
        case 'multi': return { rec: R({ stance: 'aggressive', strat: 'match', cond: {} }), alt: R({ stance: 'flexible', rules: { second: false, follow: true }, cond: { maxFollow: 1, rangePct: 5, stopAt: 'hold' } }), text: '같은 값에 맞춤', altText: '한 번만 따라감' };
        case 'fair': return { rec: R({ stance: 'normal', cond: {} }), alt: null, text: '보통 매물처럼 겨룸(따로 예외 필요 없음)', altText: '' };
        case 'still': return { rec: R({ stance: 'normal', cond: {} }), alt: R({ stance: 'aggressive', strat: 'second', cond: {} }), text: '보통 매물처럼 겨룸', altText: '이 판매자 값 바로 아래 2위로' };
        case 'fresh': return { rec: null, alt: null, text: '아직 예외를 두지 않고 7일 그림자로 지켜봄', altText: '' };
        default: return { rec: null, alt: null, text: '자료가 모자라 추천하지 않음', altText: '' }; } }
    return { VERSION: CVER, STRATS, STRATS_ALL, STRAT_INFO, STANCES, STANCE_DEF_STRAT, COND_DEF, COND_INFO, ANON_RULES, POLICY_DEF, normPolicy, SELLER_TYPES, TYPE_CFG, sellerType, typeAdvice, condOf, EXCL, EXCL_WHEN, exclLive, ignored, exclSet, dropIgnored, blAdd, blOff, blMemo, blList,
      events: chaseEvents, state: chaseState, sellerWide: sellerChase, map: chaseMap, collect, mapWithPolicy, find, chaserOn, higherQuiet, plan, step: chaseStep, judge, logEntry, lagMin, relDelta, episode, perf, stratFor, kstDay, inHours,
      chaseEvents, chaseState, sellerChase, chaseMap, chaseStep,
      fastChaserOf, TRY_DEF, FAST_DEF, tryDefault, fastChaserEntry, RULE_DEF, RULE_RNG, RULE_INFO, WHEN_K, WHEN_ACT, ruleNorm, ruleCheck, ruleFor, policyFor, whenPick, ladderPick, ruleFloor, ruleCeil, judgeRule, stratForOv };
  }
  /* ══════════════════ 📝 판단 메모 엔진 ReadnowPricing.Memo (memo1 · 정범님 11/18 22:55 I-1118-2255-30 「판단의 반영에 깊숙히 새겨 듣게」) ══════════════════
   *  메모 = 정범님이 판단 이유 옆에 적은 '명시적 규칙·사실'(F32 — 엔진이 흉내 낼 표본이 아님 · 배움 자료와 섞지 않음). 순수 함수만(저장·네트워크·화면 없음).
   *  이 파일 안에 둔 까닭: 웹앱·가격 감시기·수집기·클라우드가 이미 이 파일을 부름 → 새 @require 없음(머리 그대로)
   *  기록 한 건(Firestore prd_judge_memos 한 문서 · 지우지 않음 — 끄기 off·고친 옛 글 hist):
   *    { scope 'lid'(이 상품만)·'isbn'(같은 ISBN)·'seller'(이 판매자 — 모든 상품) · key · kind 닻(무엇에 대한 메모 — keep 추천 못 함·price 추천가·seller·base·few·edkw·note 유의 사항·ship·bundle…)
   *      text · ok 정범님 「맞음」(풀이 확인) · off · at · by · ref {sc, n}(그 이유 줄의 판매자 — '이 판매자' 말에 씀) · hist [{text, at, by}] }
   *  ① parse(text) → { rules [{k, won|pct|kw|name, t}], need [못 알아들은 글 조각] } — 「이렇게 알아들었습니다」
   *  ② index(list) · forItem(IDX, {lid, uc, isbn}) — 그 상품에 걸린 메모(상품 → ISBN) + 모든 판매자 메모
   *  ③ digest(memos, rows) → 한 상품의 규칙 묶음(JSON 그대로 — 클라우드·판매가 평가로 넘김)
   *  ④ rowsDrop(rows, D) · onTarget(t, l, D, R, out) — critTarget에서 처리 기준 뒤 · 하한선(매입가·최소 판매가·최대 인하) 앞(관제창 설계 6.3 「3-1」)
   *  ⚠ 돈(헌장 제8조): 값을 높이거나 멈추는 규칙(바닥값·내리지 않음·그대로·판매자 빼기·다른 상품)은 적는 즉시 반영 ·
   *    값을 낮추는 규칙(천장값·이 값에·정가의 n%가 지금보다 낮음)은 정범님 「맞음」(ok) 뒤에만 · 어느 경우든 그 뒤 하한선·최대 인하 %가 늘 이김
   *  ⚠ 못 알아들은 글(need)이 붙은 상품은 저절로 내리지 않음(지금 가격) — 「사람 확인 필요」로 판정 옆에 남김(버리지 않음) */
  function makeMemo() {
    const MVER = '1.1.0'; /* (1.1.0 memo2) pub 범위·factor·exc·score·similar·timeline·wrongCases·forValue */
    const SCOPES = { lid: '이 상품만', isbn: '같은 ISBN 모두', seller: '이 판매자(모든 상품)', pub: '같은 출판사 모두' };
    const KINDS = { keep: '추천 못 함 이유', price: '추천가 까닭', base: '기준가 까닭', seller: '판매자 색·판단', few: '3개이하·미등록', edkw: '판본 키워드', note: '유의 사항', ship: '출고 판매가 평가', bundle: '묶음', stock: '재고 품목', reg: '등록 추천가', etc: '판단 이유' };
    const ED_KW0 = ['리커버', '한정판', '개정판', '개정증보', '증보판', '초판', '양장', '반양장', '특별판', '스페셜', '사인본', '기념판', '에디션', '합본', '세트', '낱권', '부록', '영문판', '원서', '큰글자', '보급판', '소장판', '애장판', '무선', '포켓', '미니북', '굿즈', '주년', '텀블벅', '펀딩'];
    const ED_KW = ED_KW0.concat(((PEd && PEd.ED_ALL) || []).filter((k) => !ED_KW0.includes(k))); /* 상품 공용 낱말 표(ED_ALL)를 뒤에 더함 — 메모 기존 낱말은 그대로 앞에 */
    const snapW = (v) => Math.round(v / 10) * 10;
    /* 돈 글 → 원: 8,000원 · 8000 · 8천 원 · 1만 원 · 1만 2천 원 · 1.2만 */
    function wonOf(s) { s = String(s || ''); let m = s.match(/(\d+(?:\.\d+)?)\s*만\s*(?:(\d+)\s*천)?/); if (m) return Math.round(+m[1] * 10000 + (m[2] ? +m[2] * 1000 : 0));
      m = s.match(/(\d+)\s*천\s*(?:(\d+)\s*백)?/); if (m) return +m[1] * 1000 + (m[2] ? +m[2] * 100 : 0);
      m = s.match(/(\d{1,3}(?:,\d{3})+|\d{3,})\s*원?/); return m ? +m[1].replace(/,/g, '') : null; }
    const pctOf = (s) => { const m = String(s || '').match(/(\d+(?:\.\d+)?)\s*(?:%|퍼센트|프로)/); return m ? +m[1] : null; };
    const W = (v) => (+v || 0).toLocaleString() + '원';
    /* (memo2 ②) 엔진이 못 보는 요인 — 상태·사은품(부록)·계절·희귀 · '+'(값을 받칠 까닭 → 저절로 내리지 않음) · '-'(값을 깎을 까닭 → 알림만 · 내리는 것은 사람이) */
    const FACT = { cond: '상태', gift: '사은품·부록', season: '계절·시기', rare: '희귀·절판' };
    function factorOf(t) { t = String(t || ''); const neg = /(없|빠|분실|누락|안\s*옴|지남|끝남|끝났|비수기|흔함|흔해)/.test(t);
      if (/(얼룩|파손|낙서|밑줄|변색|찢|젖|헌\s*책|상태\s*(?:나쁨|안\s*좋|별로|하)|곰팡|접힘|구김|때\s*탐)/.test(t)) return { k: 'factor', f: 'cond', dir: '-', t };
      if (/(깨끗|새\s*책\s*같|미개봉|최상|상태\s*(?:좋|최상|훌륭|새것)|비닐\s*안\s*뜯)/.test(t)) return { k: 'factor', f: 'cond', dir: '+', t };
      if (/(사은품|부록|굿즈|엽서|포스터|씨디|CD|DVD|별책|스티커|책갈피|키링)/i.test(t)) return { k: 'factor', f: 'gift', dir: neg ? '-' : '+', t };
      if (/(시즌|계절|방학|입학|개학|수능|시험\s*(?:철|기간|앞)|크리스마스|연말|명절|여름\s*(?:방학|휴가|시즌)|겨울\s*(?:방학|시즌)|성수기|비수기|학기)/.test(t)) return { k: 'factor', f: 'season', dir: neg ? '-' : '+', t };
      if (/(희귀|절판|품절|구하기\s*어려|귀한|드문|찾는\s*사람)/.test(t)) return { k: 'factor', f: 'rare', dir: neg ? '-' : '+', t };
      return null; }
    /* 한 조각 → 규칙 하나(못 알아들으면 null) · 순서: 판매자 → 다른 상품 → 돈이 있는 말 → 돈 없는 멈춤 */
    function one(s) { const t = String(s || '').trim(); if (!t) return null; const w = wonOf(t); const pc = pctOf(t); const NEG = /(말|마|않|안\s*(?:됨|돼|함)|금지|못|없게)/;
      if (/(판매자|셀러|상점|가게|업체)/.test(t) && /(허위|가짜|사기|유령|믿지|무시|빼|제외|재고\s*없|거짓|엉터리|안\s*봄|보지\s*마)/.test(t)) { let nm = (t.match(/^(.*?)\s*(?:판매자|셀러|상점|가게|업체)/) || [])[1] || ''; nm = nm.replace(/^(이|그|저|이번|해당)$/, '').replace(/[「」"'『』]/g, '').trim(); return { k: 'ign', name: nm || null, t }; }
      if (/(예외|따로\s*(?:다루|봐|관리|처리|둬|두)|별도\s*(?:관리|처리)|엔진\s*(?:에서\s*)?(?:빼|제외|말고|쓰지)|자동\s*판정\s*(?:빼|제외|말))/.test(t)) return { k: 'exc', t }; /* (memo2 ④) 예외 — 엔진이 이 상품을 따로 다룸 */
      if (/(같은\s*(?:책|상품|판본)\s*(?:맞|임|이다|이야))/.test(t)) return { k: 'same', t };
      const kw = ED_KW.filter((k) => t.includes(k)); if (/(다른\s*(?:상품|판본|책|판|물건)|판본이?\s*(?:달|다름)|같은\s*(?:책|상품)이?\s*아님?)/.test(t) || (kw.length && /(라|이라|임|이다|이야|판이|본이|다름|달라|아님)/.test(t))) return { k: 'diff', kw, t };
      if (/(사람만|사람이\s*(?:정|직접)|직접\s*정|자동\s*(?:말|끄|금지|하지)|감시\s*(?:끄|빼|말))/.test(t)) return { k: 'human', t };
      if (pc != null && /정가/.test(t)) return { k: 'listPct', pct: pc, t };
      if (w != null) { if (/(밑|아래|미만|이하|싸게)/.test(t) && /(내리|팔|낮추|떨어|가지|가면)/.test(t) && NEG.test(t)) return { k: 'floor', won: w, t };
        if (/(최소|바닥|하한|적어도|이상)/.test(t)) return { k: 'floor', won: w, t };
        if (/(넘게|위로|초과|이상으로|비싸게)/.test(t) && /(올리|받|팔)/.test(t) && NEG.test(t)) return { k: 'ceil', won: w, t };
        if (/(최대|천장|상한|넘지|이하로|까지만)/.test(t)) return { k: 'ceil', won: w, t };
        if (/(에\s*(?:팔|맞|두|올|내|고정)|으로\s*(?:팔|맞|두|올|내|고정|해)|로\s*(?:팔|맞|두|올|내|고정|해)|가\s*맞)/.test(t)) return { k: 'fix', won: w, t }; return factorOf(t); }
      if (/(내리지|내림|인하|깎지|낮추지)/.test(t) && NEG.test(t)) return { k: 'noDown', t };
      if (/(올리지|인상|올림)/.test(t) && NEG.test(t)) return { k: 'noUp', t };
      if (/(그대로|유지|고정|바꾸지|건드리지|손대지)/.test(t)) return { k: 'hold', t };
      return factorOf(t); }
    /* ① 풀이 — 한 메모 글 → 규칙들 + 못 알아들은 조각(빈 말·인사는 버리지 않고 need로) */
    function parse(text) { const s = String(text || '').trim(); const rules = [], need = []; if (!s) return { rules, need };
      const parts = s.split(/(?:[.\n!;?]|,(?!\d{3})|\s그리고\s|\s하고\s)+/).map((x) => x.trim()).filter(Boolean);
      for (const p of parts) { const r = one(p); if (r) rules.push(r); else need.push(p); }
      /* 조각으로 못 알아들었는데 글 전체로는 알아들으면(예: 「리커버라 다른 상품」을 쉼표로 끊은 경우) 전체 규칙 하나로 */
      if (!rules.length && parts.length > 1) { const r = one(s); if (r) return { rules: [r], need: [] }; }
      return { rules, need }; }
    /* 사람이 읽는 풀이 한 줄 */
    function ruleTxt(r) { if (!r) return ''; switch (r.k) {
      case 'floor': return `바닥값 ${W(r.won)} — 이 값 밑으로 내리지 않음`; case 'ceil': return `천장값 ${W(r.won)} — 이 값 넘게 올리지 않음`; case 'fix': return `판매가 ${W(r.won)}으로`;
      case 'noDown': return '내리지 않음'; case 'noUp': return '올리지 않음'; case 'hold': return '가격 그대로(바꾸지 않음)'; case 'human': return '자동으로 바꾸지 않음 — 사람만';
      case 'ign': return `판매자 ${r.name ? '「' + r.name + '」' : '(이 이유 줄의 판매자)'} 매물을 시장 비교에서 뺌`; case 'diff': return `다른 상품${r.kw && r.kw.length ? '(' + r.kw.join('·') + ')' : ''} — 같은 이름 시장과 견주지 않음`;
      case 'same': return '같은 책 맞음(판본 의심 아님)'; case 'listPct': return `추천 못 할 때 정가의 ${r.pct}%`;
      case 'exc': return '예외 — 엔진이 따로 다룸(자동 판정·자동 출고에서 빼고 사람이 봄)'; case 'factor': return `엔진이 못 보는 요인: ${FACT[r.f] || r.f} ${r.dir === '+' ? '↑ 값을 받침 → 저절로 내리지 않음' : '↓ 값을 깎을 까닭 → 알림만(내리는 것은 사람이)'}`; default: return r.k; } }
    const lower = (r) => ['ceil', 'fix', 'listPct'].includes(r.k); /* 값을 낮출 수 있는 규칙 — 「맞음」 뒤에만 */
    const on = (m) => m && !m.off && String(m.text || '').trim();
    /* ② 찾기 표 */
    const pubKey = (v) => String(v || '').replace(/\(주\)|㈜|주식회사|\s|[·.,()\[\]]/g, '').toLowerCase();
    function index(list) { const I = { lid: new Map(), isbn: new Map(), pub: new Map(), seller: [], n: 0 }; for (const m of list || []) { if (!on(m)) continue; I.n++; const k = String(m.key || ''); if (m.scope === 'seller') { I.seller.push(m); continue; } const mp = m.scope === 'isbn' ? I.isbn : m.scope === 'pub' ? I.pub : I.lid; if (!k) continue; const kk = m.scope === 'pub' ? pubKey(k) : k; if (!mp.has(kk)) mp.set(kk, []); mp.get(kk).push(m); } return I; }
    function forItem(I, o) { if (!I) return []; o = o || {}; const out = []; const seen = new Set(); const add = (L) => { for (const m of L || []) { const id = m.id || m.scope + ':' + m.key + ':' + m.kind; if (!seen.has(id)) { seen.add(id); out.push(m); } } };
      for (const k of [o.lid, o.uc, o.key].filter((v) => v != null && v !== '')) add(I.lid.get(String(k))); if (o.isbn) add(I.isbn.get(String(o.isbn).replace(/[^0-9Xx]/g, ''))); if (o.pub && I.pub) add(I.pub.get(pubKey(o.pub))); add(I.seller); return out; }
    const nmEq = (a, b) => { a = String(a || '').replace(/\s/g, ''); b = String(b || '').replace(/\s/g, ''); return !!a && !!b && (a === b || (a.length >= 2 && b.includes(a)) || (b.length >= 2 && a.includes(b))); };
    const rowSc = (r) => String(r && (r.sellerCode != null ? r.sellerCode : r.sc != null ? r.sc : '') || '');
    const rowNm = (r) => (r && (r.n != null ? r.n : r.sellerName)) || '';
    /* ③ 한 상품의 규칙 묶음 — rows(지금 첫 페이지)는 '이름으로 적은 판매자'가 이 시장에 있는지 볼 때만 */
    function digest(memos, rows) { const D = { n: 0, ign: [], floor: null, ceil: null, fix: null, listPct: null, noDown: false, noUp: false, hold: false, human: false, diff: null, same: false, exc: null, factors: [], need: [], used: [], wait: [], clash: [] };
      for (const m of memos || []) { if (!on(m)) continue; D.n++; const P = parse(m.text); const src = { id: m.id || null, scope: m.scope || 'lid', kind: m.kind || 'etc', ok: !!m.ok };
        P.need.forEach((x) => D.need.push({ ...src, text: x }));
        for (const r of P.rules) { const tag = { ...src, k: r.k, txt: ruleTxt(r) };
          if (r.k === 'ign') { const sc = m.scope === 'seller' ? String(m.key || '') : m.ref && m.ref.sc ? String(m.ref.sc) : ''; const nm = r.name || (m.scope === 'seller' ? m.name || (m.ref && m.ref.n) || '' : m.ref && m.ref.n) || '';
            if (!sc && !nm) { D.need.push({ ...src, text: r.t, why: '어느 판매자인지 몰라 — 판매자 이름을 글에 넣거나 「이 판매자」 범위로' }); continue; } tag.txt = ruleTxt({ ...r, name: nm || sc }); D.ign.push({ sc: sc || null, name: nm || null, from: tag }); continue; }
          if (r.k === 'diff') { D.diff = { kw: [...new Set([...((D.diff && D.diff.kw) || []), ...(r.kw || [])])], from: tag }; continue; }
          if (r.k === 'same') { D.same = true; D.used.push(tag); continue; }
          if (r.k === 'exc') { if (!D.exc) D.exc = { from: tag }; continue; }
          if (r.k === 'factor') { D.factors.push({ f: r.f, dir: r.dir, from: tag }); continue; }
          if (['noDown', 'noUp', 'hold', 'human'].includes(r.k)) { D[r.k] = true; D.used.push(tag); continue; }
          if (r.k === 'floor') { if (!D.floor || r.won > D.floor.won) D.floor = { won: r.won, from: tag }; continue; } /* 부딪히면 더 조심스러운 쪽(높은 바닥) */
          if (r.k === 'ceil') { if (!D.ceil || r.won > D.ceil.won) D.ceil = { won: r.won, ok: !!m.ok, from: tag }; continue; } /* 천장은 높은 쪽이 덜 깎음 */
          if (r.k === 'fix') { if (!D.fix || r.won > D.fix.won) D.fix = { won: r.won, ok: !!m.ok, from: tag }; continue; }
          if (r.k === 'listPct') { if (!D.listPct || r.pct > D.listPct.pct) D.listPct = { pct: r.pct, ok: !!m.ok, from: tag }; continue; } } }
      if (D.floor && D.ceil && D.ceil.won < D.floor.won) { D.clash.push(`메모 둘이 부딪힘: 바닥 ${W(D.floor.won)} > 천장 ${W(D.ceil.won)} — 더 조심스러운 바닥을 씀`); D.ceil = null; }
      if (D.floor && D.fix && D.fix.won < D.floor.won) { D.clash.push(`메모 둘이 부딪힘: 판매가 ${W(D.fix.won)} < 바닥 ${W(D.floor.won)} — 바닥을 씀`); D.fix = null; }
      if (D.noUp && D.floor) { /* 그대로 */ }
      if (rows && D.ign.length) D.ign.forEach((g) => { g.here = (rows || []).filter((r) => ignHit(r, [g])).length; });
      return D; }
    function ignHit(r, ign) { if (!r || !ign || !ign.length) return false; const sc = rowSc(r), nm = rowNm(r); return ign.some((g) => (g.sc && sc && g.sc === sc) || (g.name && nmEq(g.name, nm))); }
    /* ④-1 시장 줄에서 메모로 뺀 판매자 매물 빼기(우리 줄은 그대로) — 뺀 것이 없으면 같은 배열 */
    function rowsDrop(rows, D) { if (!D || !D.ign || !D.ign.length || !Array.isArray(rows)) return rows; const o = rows.filter((r) => !(r && r.c !== 'ours' && ignHit(r, D.ign))); return o.length === rows.length ? rows : o; }
    const has = (D) => !!(D && (D.n || 0) > 0);
    /* ④-2 목표가에 한 겹 — R(이유 줄)에 「📝 메모 반영됨: …」 · out.memo = 한눈 요약 · 하한선은 이 뒤 critTarget에서 늘 이김 */
    function onTarget(t, l, D, R, out) { if (!has(D)) return t; const eng = t; const cur = l && l.price > 0 ? +l.price : null; const lp = +((l && l.priceList) || 0); const used = []; const tag = (x) => `📝 메모 반영됨: ${x}`; const WT = [...(D.wait || [])]; /* 묶음(D)은 여러 번 써도 그대로 — 고치지 않음 */
      const FU = (D.factors || []).filter((f) => f.dir === '+'), FD = (D.factors || []).filter((f) => f.dir === '-');
      if (D.exc) { R.push(tag(`${D.exc.from.txt} → 엔진 값${t != null ? ' ' + W(t) : ''}을 쓰지 않고 ${cur ? '지금 가격 그대로' : '추천 못 함'}`)); used.push(D.exc.from); t = cur; out.memoHold = 'exc'; out.memoExc = true; }
      else if (D.diff) { R.push(tag(`${D.diff.from.txt} → 첫 페이지 시장으로 정한 값을 쓰지 않고 ${cur ? '지금 가격 그대로' : '추천 못 함'}`)); used.push(D.diff.from); t = cur; out.memoHold = 'diff'; }
      else if (D.human || D.hold) { const f = D.used.find((u) => u.k === 'human' || u.k === 'hold'); R.push(tag(`${f ? f.txt : '가격 그대로'} → 지금 가격 그대로`)); used.push(f); t = cur; out.memoHold = D.human ? 'human' : 'hold'; }
      else {
        /* 값을 낮추는 규칙(정가의 n%·이 값에·천장)은 정범님 「맞음」(ok) 뒤에만 — 단 지금 가격보다 낮추지 않거나 엔진 추천보다 높은 경우는 바로 씀 */
        const okLow = (x, v) => x.ok || !cur || v >= cur || (t != null && v >= t); /* 엔진 추천보다 높게 두는 쪽이면 더 조심스러움 → 바로 씀 */ const wait = (x, v) => { WT.push({ ...x.from, txt: `${x.from.txt}${v != null ? ' (' + W(v) + ' — 지금 가격 ' + W(cur) + '보다 낮음)' : ''}` }); };
        if (t == null && D.listPct && lp > 0) { const v = snapW(lp * D.listPct.pct / 100); if (okLow(D.listPct, v)) { t = v; R.push(tag(`${D.listPct.from.txt} → ${W(t)}`)); used.push(D.listPct.from); } else wait(D.listPct, v); }
        if (D.fix) { if (okLow(D.fix, D.fix.won)) { R.push(tag(`${D.fix.from.txt} (${t != null ? W(t) + ' 대신' : '추천 못 함 대신'})`)); t = D.fix.won; used.push(D.fix.from); } else wait(D.fix, D.fix.won); }
        if (t != null && D.ceil && t > D.ceil.won) { if (okLow(D.ceil, D.ceil.won)) { R.push(tag(`${D.ceil.from.txt} → ${W(t)} 대신 ${W(D.ceil.won)}`)); t = D.ceil.won; used.push(D.ceil.from); } else { wait(D.ceil, D.ceil.won); if (t > cur) { R.push(tag(`${D.ceil.from.txt} (확인 전) → 올리지는 않음 · ${W(t)} 대신 지금 가격 ${W(cur)}`)); t = cur; used.push(D.ceil.from); } } }
        if (t != null && cur && D.noDown && t < cur) { const f = D.used.find((u) => u.k === 'noDown'); R.push(tag(`내리지 않음 → ${W(t)} 대신 지금 가격 ${W(cur)}`)); t = cur; used.push(f); }
        if (t != null && cur && D.noUp && t > cur) { const f = D.used.find((u) => u.k === 'noUp'); R.push(tag(`올리지 않음 → ${W(t)} 대신 지금 가격 ${W(cur)}`)); t = cur; used.push(f); }
        if (D.floor) { if (t != null && t < D.floor.won) { R.push(tag(`${D.floor.from.txt} → ${W(t)}에서 ${W(D.floor.won)}으로 올림`)); t = D.floor.won; } else R.push(tag(`${D.floor.from.txt} (지금 추천 ${t != null ? W(t) : '-'}은 그 위)`)); used.push(D.floor.from); }
        if (FU.length && t != null && cur && t < cur) { R.push(tag(`${FU.map((f) => f.from.txt).join(' · ')} → ${W(t)} 대신 지금 가격 ${W(cur)}`)); t = cur; FU.forEach((f) => used.push(f.from)); out.memoHold = out.memoHold || 'factor'; } else FU.forEach((f) => R.push(tag(`${f.from.txt} (지금 추천은 내리지 않음)`)));
        FD.forEach((f) => R.push(tag(`${f.from.txt}${t != null && cur && t >= cur ? ' — 엔진은 이 까닭을 못 봄 · 내릴지 사람이 정함' : ''}`)));
        if (D.need.length && t != null && cur && t < cur) { R.push(`📝 사람 확인 필요 메모 ${D.need.length}개가 있어 저절로 내리지 않음 → 지금 가격 ${W(cur)} (메모를 알아들을 수 있게 고치거나 정범님이 값을 정함)`); t = cur; out.memoHold = 'need'; } }
      D.ign.forEach((g) => { used.push(g.from); R.push(tag(`${g.from.txt}${g.here != null ? ' — 이 첫 페이지에서 ' + g.here + '개' : ''}`)); }); if (D.same) used.push(D.used.find((u) => u.k === 'same'));
      WT.forEach((w) => R.push(`📝 메모 확인 전(값을 낮추는 규칙) — ${w.txt} · 📝 칸에서 「맞음」을 누르면 다음 판정부터 씀`)); D.clash.forEach((x) => R.push('📝 ' + x));
      if (D.need.length) R.push(`📝 사람 확인 필요 — 못 알아들은 메모: ${D.need.map((x) => '「' + String(x.text).slice(0, 40) + '」' + (x.why ? '(' + x.why + ')' : '')).join(' · ')}`);
      out.memo = { n: D.n, used: used.filter(Boolean).map((u) => u.txt), need: D.need.map((x) => x.text), wait: WT.map((w) => w.txt), floor: D.floor ? D.floor.won : null, hold: out.memoHold || null, eng: eng != null ? eng : null, exc: !!D.exc, factors: (D.factors || []).map((f) => f.f + f.dir) };
      return t; }
    /* ══ (memo2 · 정범님 11/19 I-1119-0007-01.2) 메모를 실제로 쓰는 길 ③⑤⑥⑦ — 모두 순수 함수(웹앱·클라우드가 같은 답) ══ */
    /* ③-1 메모가 무엇을 주장하나 — keep(이 값을 지켜도 팔림: 바닥·내리지 않음·그대로·예외·받치는 요인) · cut(내리면/이 값이면 팔림: 천장·정가 n%·깎을 요인) · mkt(시장 판단: 판매자 빼기·다른 상품·같은 책) */
    function dirOf(m, uses) { const P = parse(m && m.text); const ks = P.rules.map((r) => r.k + (r.k === 'factor' ? r.dir : ''));
      if (ks.includes('fix')) { const U = Object.values(uses || (m && m.use) || {}).filter((e) => e && e.from > 0 && e.to > 0); const dn = U.filter((e) => e.to < e.from).length; return dn * 2 > U.length && U.length ? 'cut' : 'keep'; }
      if (ks.some((k) => ['ceil', 'listPct', 'factor-'].includes(k))) return 'cut'; if (ks.some((k) => ['floor', 'noDown', 'hold', 'human', 'exc', 'factor+', 'noUp'].includes(k))) return 'keep'; if (ks.some((k) => ['ign', 'diff', 'same'].includes(k))) return 'mkt'; return null; }
    /* ③-2 대조 고르기 — 메모 없는 비슷한 상품(같은 출판사 또는 같은 분야 · 값 ±20%) · pool = [{k, pub, cat, price}] · 메모 상품(keys)은 뺌 */
    function pickCtrl(it, pool, o) { o = o || {}; const keys = o.keys || new Set(); const p = +(it && it.price) || 0; const pk = pubKey(it && it.pub); const ct = String((it && it.cat) || ''); const band = o.band != null ? o.band : 0.2; const out = [];
      for (const c of pool || []) { if (!c || keys.has(c.k) || c.k === (it && it.k)) continue; const cp = +c.price || 0; if (p > 0 && (cp <= 0 || Math.abs(cp - p) > p * band)) continue; if (!((pk && pubKey(c.pub) === pk) || (ct && String(c.cat || '') === ct))) continue; out.push(c); if (out.length >= (o.max || 40)) break; } return out; }
    /* ③-3 가설 채점 — 돈 드는 실험 없이 지난 판매·시장 매물로만(헌장 제43조 대리 표본)
     *  o = { memo, items:[{k, at(메모가 쓰인 때), sold, soldAt}], ctrl:[{k, sold(같은 기간 안에 팔림)}], days(기본 30), now(ms) }
     *  돌려줌 { verdict: hit(맞음)·miss(틀림)·wait(기다림)·na(판단 못 함), dir, n, nM(기간 다 찬 상품), sM, rateM, nC, rateC, why } */
    function score(o) { o = o || {}; const days = +o.days || 30; const now = o.now != null ? +o.now : Date.now(); const DAY = 864e5; const ms = (v) => (v == null ? NaN : typeof v === 'number' ? v : Date.parse(v)); const dir = o.dir || dirOf(o.memo);
      const items = (o.items || []).filter((e) => e && Number.isFinite(ms(e.at))); const done = items.filter((e) => (e.sold && ms(e.soldAt) - ms(e.at) <= days * DAY) || now - ms(e.at) >= days * DAY); const sM = done.filter((e) => e.sold && ms(e.soldAt) - ms(e.at) <= days * DAY).length;
      const C = o.ctrl || []; const nC = C.length; const sC = C.filter((c) => c && c.sold).length; const rateC = nC ? sC / nC : null; const rateM = done.length ? sM / done.length : null; const pc = (v) => (v == null ? '-' : Math.round(v * 100) + '%');
      const R = { verdict: 'na', dir, n: items.length, nM: done.length, sM, rateM, nC, rateC, days, why: '' };
      if (!dir) { R.why = '채점할 주장이 없는 메모(사람 확인 필요·풀이 없음)'; return R; } if (!items.length) { R.why = '아직 이 메모가 쓰인 상품이 없음'; return R; }
      if (!done.length) { R.verdict = 'wait'; R.why = `쓰인 뒤 ${days}일이 아직 안 참(${items.length}개 지켜보는 중)`; return R; }
      if (nC < 3) { R.why = `대조할 비슷한 상품(메모 없음·같은 출판사/분야·값 ±20%)이 ${nC}개뿐 — 3개 이상일 때 채점`; return R; }
      const claim = dir === 'cut' ? '내린 값이면 팔림' : dir === 'keep' ? '값을 지켜도 팔림' : '시장 판단이 맞음(견준 시장에서 팔림)';
      if (done.length === 1) { if (sM) { R.verdict = 'hit'; R.why = `${claim} — 이 상품이 ${days}일 안에 팔림 · 대조 ${pc(rateC)}(${nC}개)`; } else if (rateC >= 0.3) { R.verdict = 'miss'; R.why = `${claim}라 했으나 ${days}일 안 안 팔림 · 비슷한 상품은 ${pc(rateC)} 팔림(${nC}개)`; } else { R.why = `안 팔렸지만 비슷한 상품도 ${pc(rateC)}만 팔림 — 메모 탓인지 알 수 없음`; } return R; }
      const bar = dir === 'cut' ? rateC : rateC * 0.7; R.verdict = rateM >= bar ? 'hit' : 'miss';
      R.why = `${claim} — 메모 상품 ${pc(rateM)} 팔림(${done.length}개 중 ${sM}) · 대조 ${pc(rateC)}(${nC}개)${dir === 'cut' ? ' · 기준: 대조 이상' : ' · 기준: 대조의 70% 이상(값을 지킨 만큼 조금 덜 팔려도 맞음)'}`; return R; }
    /* ⑤ 비슷한 상품의 지난 메모 — 제목 낱말·같은 시리즈(끝 번호 뺀 제목)·출판사+저자 · it = {title, pub, author, isbn, key} · 이미 이 상품에 걸린 메모는 뺌 */
    const ttlStem = (t) => String(t || '').replace(/\(.*?\)|\[.*?\]/g, ' ').replace(/[\s:·,\-]*(?:제?\s*\d+\s*(?:권|부|편|장)?|[上中下]|상|중|하|세트|합본)\s*$/, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const ttlTok = (t) => new Set(String(t || '').toLowerCase().replace(/\(.*?\)|\[.*?\]/g, ' ').split(/[^0-9a-z가-힣]+/).filter((w) => w.length >= 2 && !/^\d+$/.test(w) && !['세트', '전집', '개정판', '리커버', '한정판', '특별판'].includes(w)));
    function similar(list, it, o) { o = o || {}; it = it || {}; const T = ttlTok(it.title); const st = ttlStem(it.title); const pk = pubKey(it.pub); const au = String(it.author || '').replace(/\s/g, ''); const isb = String(it.isbn || '').replace(/[^0-9Xx]/g, ''); const own = new Set((o.own || []).map((m) => m.id)); const out = [];
      for (const m of list || []) { if (!on(m) || own.has(m.id) || m.scope === 'seller') continue; if ((it.key && String(m.key) === String(it.key)) || (isb && m.scope === 'isbn' && String(m.key) === isb)) continue;
        const MT = ttlTok(m.title); let inter = 0; T.forEach((w) => { if (MT.has(w)) inter++; }); const uni = T.size + MT.size - inter; let sim = uni ? inter / uni : 0; const why = [];
        if (sim >= 0.5) why.push('제목 낱말 ' + Math.round(sim * 100) + '% 같음'); if (st && st.length >= 2 && ttlStem(m.title) === st) { sim = Math.max(sim, 0.9); why.push('같은 시리즈(제목 앞부분 같음)'); }
        const mp = pubKey(m.pub || (m.scope === 'pub' ? m.key : '')); if (pk && mp === pk) { if (au && String(m.author || '').replace(/\s/g, '') === au) { sim = Math.max(sim, 0.7); why.push('같은 출판사·저자'); } else if (m.scope === 'pub') { sim = Math.max(sim, 0.6); why.push('같은 출판사 메모'); } else if (sim >= 0.3) { sim += 0.15; why.push('같은 출판사'); } }
        if (sim >= (o.min || 0.5)) out.push({ m, sim: Math.min(1, sim), why: why.join(' · ') }); }
      return out.sort((a, b) => b.sim - a.sim).slice(0, o.n || 5); }
    /* ⑥ 넘겨받기·설명 — 이 상품의 값을 누가·언제·왜 바꿨나(메모 적음·고침·맞음·끔 + 엔진이 메모로 바꾼 값 + 밖의 가격 바꿈 기록 o.changes[{at, by, from, to, why}]) · 새것 먼저 */
    function timeline(memos, key, o) { o = o || {}; const E = []; const nm = (v) => String(v || '').split('@')[0]; const SRC = { web: '웹앱', cloud: '클라우드', pc: '수집기 PC' };
      for (const m of memos || []) { if (!m) continue; const head = String(m.text || '').slice(0, 60); E.push({ at: m.at, who: nm(m.byName || m.by), what: '📝 메모 적음', text: head, id: m.id, scope: m.scope });
        (m.hist || []).forEach((h) => E.push({ at: h.at, who: nm(h.by), what: '📝 ' + (h.what || '고침'), text: h.text ? String(h.text).slice(0, 60) : '', id: m.id }));
        const e = key != null && m.use ? m.use[key] : null; if (e) E.push({ at: e.at, who: SRC[e.src] || e.src || '엔진', what: '🤖 메모로 판정', from: e.from, to: e.to, eng: e.eng != null ? e.eng : null, why: e.why || '', hold: e.hold || null, id: m.id }); }
      (o.changes || []).forEach((c) => c && E.push({ at: c.at, who: nm(c.by) || '사람', what: '💲 값 바꿈', from: c.from, to: c.to, why: c.why || '' }));
      return E.filter((e) => e.at).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, o.n || 60); }
    /* ⑦ 엔진이 틀린 사례 모음 — 메모가 엔진 값을 바꿨거나 멈췄고(eng ≠ to 또는 멈춤) 채점이 맞음(hit)이면 「엔진이 틀림」 · 채점 전이면 「확인 기다림」 · 다음 학습 재료(메모 글은 넣지 않음 — 규칙 종류·값만) */
    function wrongCases(memos, scores, o) { o = o || {}; const S = scores || {}; const out = [];
      for (const m of memos || []) { if (!m || m.off) continue; const sc = S[m.id] || m.score || null; if (sc && sc.verdict === 'miss') continue; const kinds = parse(m.text).rules.map((r) => r.k + (r.k === 'factor' ? r.f + r.dir : ''));
        for (const [k, e] of Object.entries(m.use || {})) { if (!e) continue; const moved = e.eng != null && e.to != null && +e.eng !== +e.to; const stop = ['diff', 'exc', 'human', 'hold', 'factor'].includes(e.hold); if (!moved && !stop) continue;
          out.push({ id: m.id, k, at: e.at, title: e.t || '', eng: e.eng != null ? e.eng : null, to: e.to != null ? e.to : null, from: e.from != null ? e.from : null, hold: e.hold || null, kinds, mkind: m.kind || null, verdict: sc ? sc.verdict : 'wait', state: sc && sc.verdict === 'hit' ? '엔진이 틀림(메모가 맞음)' : '확인 기다림' }); } }
      return out.sort((a, b) => String(b.at || '').localeCompare(String(a.at || ''))).slice(0, o.n || 500); }
    return { VERSION: MVER, SCOPES, KINDS, ED_KW, FACT, wonOf, pctOf, parse, one, factorOf, ruleTxt, lower, pubKey, index, forItem, digest, ignHit, rowsDrop, onTarget, has, dirOf, pickCtrl, score, similar, timeline, wrongCases };
  }
  const Memo = makeMemo();
  if (root && typeof root === 'object') { try { root.ReadnowMemo = Memo; } catch (e) {} }
  const Chase = makeChase(); const { chaseEvents, chaseState, sellerChase, chaseMap, chaserOn, chaseStep, STRATS } = Chase; /* 판정 엔진 api의 옛 이름 그대로(같은 함수) */
  if (root && typeof root === 'object') { try { root.ReadnowChase = Chase; } catch (e) {} }
  /* (0.17.20 · 판 러 · ctrlimp3 · CTRLDES3 2.2·2.3 · 정범님 I-1118-2344-32) 🎛 관제창 설정 기본값(웹앱 판 더 ctrlCfg와 같은 글자)·⏸ 묶음 자동 멈춤 셈 — 가격 감시기와 웹앱이 함께 씀
   *  · 셈 자료 = 하루 손해 원장 eng_fence_ledger/{한국 날짜}.x[상품] — src 'pw:<그룹>'(감시 자동 반영·추격자) · od(오늘 그 상품이 기준 아래로 새로 내려간 몫 · 반영 끝난 것만) · 새 문서·새 쓰기 없음
   *  · 알림선 'auto' = 하루 손해 한도(eng_fence_now.dayLoss) × (이 묶음 감시 상품 수 ÷ 감시 중 전체) · 바닥 2,000원 · 숫자면 그 값
   *  · 멈춤 표시 = _bkfold.ctl[묶음].pause { at, day, by, why:'dayDrop'|'chased', sum, limit, n } · 다시 켜기 = pause:null + resume { at, by, day, mode:'recount'|'skipToday', base }
   *  · 멈춘 동안: 값을 내리는 자동 반영·추격 전략의 새 내림은 선택 대기로 · 시장 읽기·값 올리기는 그대로 · 미끼(lure) 진행 중이면 'restore'(기본) = 시작 값으로 되돌림 */
  function makeCtrl() {
    const CTRL_DEF = { lazy: 'all', doneChg: 'mark', reoDone: 'move', perItem: ['watch', 'chase', 'floor', 'strat'], onChased: 'alert', chasedMin: { n: 3, pct: 20 }, learnAt: 'both', tryMode: 'ask', tryDays: 7, memoConfirm: 'once', memoAuto: 'off', dayDrop: { act: 'pause', limit: 'auto', lure: 'restore', resume: 'manual' }, allOnKeep: 'keep', dualGroup: 'owner' };
    const FLOOR = 2000;
    const rng = (a, b) => (v) => { const n = Math.round(+v); return v != null && v !== '' && n >= a && n <= b ? n : undefined; };
    const inn = (...vs) => (v) => (vs.includes(v) ? v : undefined);
    const PI = ['watch', 'chase', 'floor', 'strat'];
    const V = { lazy: (v) => inn('all', 'done')(v === 'final' ? 'done' : v), doneChg: (v) => inn('mark', 'auto')(v === 'autoCancel' ? 'auto' : v), reoDone: inn('move', 'mark'),
      perItem: (v) => (Array.isArray(v) ? PI.filter((x) => v.includes(x)) : undefined), onChased: inn('alert', 'pause'), 'chasedMin.n': rng(1, 999), 'chasedMin.pct': rng(1, 100),
      learnAt: inn('both', 'audit', 'ctrl'), tryMode: inn('ask', 'dry', 'live'), tryDays: rng(1, 60), memoConfirm: inn('once', 'always', 'off'), memoAuto: inn('off', 'markOnly'),
      'dayDrop.act': inn('pause', 'alert'), 'dayDrop.limit': (v) => (v === 'auto' ? 'auto' : rng(1000, 1000000)(v)), 'dayDrop.lure': inn('restore', 'hold'), 'dayDrop.resume': inn('manual', 'nextDay'),
      allOnKeep: inn('keep', 'ask', 'overwrite'), dualGroup: inn('owner', 'global', 'safer') };
    function cfgPick(r, g) { r = r && typeof r === 'object' && !Array.isArray(r) ? r : {}; if (r.onDrift != null && r.doneChg == null) r = { ...r, doneChg: r.onDrift }; const out = {};
      for (const [p, f] of Object.entries(V)) { if (!g && p === 'learnAt') continue; const [a, b] = p.split('.'); const v = b ? (r[a] && typeof r[a] === 'object' ? r[a][b] : undefined) : r[a]; if (v == null) continue; const w = f(v); if (w === undefined) continue; if (b) (out[a] = out[a] || {})[b] = w; else out[a] = w; }
      return out; }
    const merge = (a, b) => { const o = JSON.parse(JSON.stringify(a)); for (const [k, v] of Object.entries(b || {})) o[k] = v && typeof v === 'object' && !Array.isArray(v) ? { ...(o[k] || {}), ...v } : v; return o; };
    function cfgNorm(raw, opt) { const g = merge(CTRL_DEF, cfgPick(raw, 1)); return opt ? merge(g, cfgPick(opt, 0)) : g; }
    function optNorm(o) { const p = cfgPick(o, 0); return Object.keys(p).length ? p : null; }
    const N = (v) => { const n = +v; return v != null && v !== '' && Number.isFinite(n) ? n : null; };
    const won = (v) => Math.round(+v || 0).toLocaleString('ko-KR');
    /* foldOf(bkf, gid) — 그 그룹이 든 📁 묶음(웹앱 bkfNorm과 같은 차례: order의 f: 먼저 · 한 그룹은 처음 묶음에만) · 보관한 묶음이면 null */
    function foldOf(bkf, gid) { if (!bkf || !gid) return null; const F = bkf.folds && typeof bkf.folds === 'object' ? bkf.folds : {}; const ord = (Array.isArray(bkf.order) ? bkf.order : []).filter((k) => typeof k === 'string' && k.startsWith('f:')).map((k) => k.slice(2));
      for (const fid of [...new Set(ord.concat(Object.keys(F)))]) { const f = F[fid]; if (!f || typeof f !== 'object' || !Array.isArray(f.gids) || !f.gids.includes(gid)) continue; if (f.archived) return null; return { fid, name: String(f.name || '묶음'), gids: f.gids.filter((g) => typeof g === 'string' && g) }; }
      return null; }
    /* daySum(L, gids) — 원장 하루치에서 이 그룹들의 감시·추격자 내림 합 · n = 내린 상품 수 · top = 많이 내린 5개 */
    function daySum(L, gids) { const G = new Set(gids || []); let sum = 0, n = 0; const top = [];
      for (const [k, e] of Object.entries((L && L.x) || {})) { if (!e || typeof e.src !== 'string') continue; const m = /^pw:(.+)$/.exec(e.src); if (!m || !G.has(m[1])) continue; const od = Math.max(0, N(e.od) || 0); if (!(od > 0)) continue; sum += od; n++; top.push({ k, od, gid: m[1] }); }
      return { sum: Math.round(sum), n, top: top.sort((a, b) => b.od - a.od).slice(0, 5) }; }
    /* dayLimit(cfg, dayLoss, nFold, nAll, gFold, gAll) — 알림선 · 상품 수 몫(없으면 그룹 수 몫) */
    function dayLimit(cfg, dayLoss, nFold, nAll, gFold, gAll) { const lim = ((cfg || CTRL_DEF).dayDrop || {}).limit; if (typeof lim === 'number' && lim > 0) return { limit: Math.round(lim), how: 'fixed', share: null };
      const dl = N(dayLoss); if (!(dl > 0)) return { limit: FLOOR, how: 'floor', share: null, why: '하루 손해 한도를 못 받아 바닥 ' + won(FLOOR) + '원' };
      const sh = N(nAll) > 0 ? Math.min(1, (N(nFold) || 0) / N(nAll)) : N(gAll) > 0 ? Math.min(1, (N(gFold) || 0) / N(gAll)) : 1;
      return { limit: Math.max(FLOOR, Math.round(dl * sh)), how: 'auto', share: Math.round(sh * 1000) / 1000 }; }
    /* pauseLive(ctl, cfg, day) — 지금 걸려 있는 멈춤(없으면 null) · resume 'nextDay'면 앞날 멈춤은 저절로 풀림 */
    function pauseLive(ctl, cfg, day) { const p = ctl && ctl.pause; if (!p || typeof p !== 'object' || !p.at) return null; if (((cfg || CTRL_DEF).dayDrop || {}).resume === 'nextDay' && p.day && day && String(p.day) < String(day)) return null; return p; }
    /* pauseCheck(o) — o = { cfg, ctl, day, sum, n, limit, chased(오늘 추격자 붙은 상품 수 · 다시 켠 뒤부터), nFold, nowIso, by }
     *  → { pause(지금 걸린 것 · 없으면 null), write: null | { pause } | { alert }, line } — 같은 날 같은 알림은 다시 쓰지 않음 */
    function pauseCheck(o) { o = o || {}; const cfg = o.cfg || CTRL_DEF; const ctl = o.ctl || {}; const day = o.day || ''; const at = o.nowIso || new Date().toISOString();
      const live = pauseLive(ctl, cfg, day); if (live) return { pause: live, write: null, line: line(live) };
      const rs = ctl.resume && typeof ctl.resume === 'object' && ctl.resume.day === day ? ctl.resume : null; if (rs && rs.mode === 'skipToday') return { pause: null, write: null, line: '' };
      const base = rs ? Math.max(0, N(rs.base) || 0) : 0; const s = Math.max(0, (N(o.sum) || 0) - base); const lim = N(o.limit) || FLOOR; const hits = [];
      if (s > lim) hits.push({ why: 'dayDrop', act: cfg.dayDrop.act === 'alert' ? 'alert' : 'pause' });
      const c = N(o.chased) || 0; const cm = cfg.chasedMin || CTRL_DEF.chasedMin; if (c > 0 && (c >= cm.n || (N(o.nFold) > 0 && (c / o.nFold) * 100 >= cm.pct))) hits.push({ why: 'chased', act: cfg.onChased === 'pause' ? 'pause' : 'alert' });
      if (!hits.length) return { pause: null, write: null, line: '' };
      const h = hits.find((x) => x.act === 'pause') || hits[0]; const rec = { at, day, by: o.by || 'auto', why: h.why, sum: s, limit: lim, n: N(o.n) || 0, chased: c };
      if (h.act === 'pause') return { pause: rec, write: { pause: rec }, line: line(rec) };
      const al = ctl.alert && typeof ctl.alert === 'object' ? ctl.alert : null; if (al && al.day === day && al.why === h.why && (!rs || String(al.at) > String(rs.at || ''))) return { pause: null, write: null, line: '' };
      return { pause: null, write: { alert: rec }, line: '' }; }
    const hm = (iso) => { const d = new Date(Date.parse(iso) + 9 * 3600e3); return isNaN(d) ? '' : d.toISOString().slice(11, 16); };
    const whyTxt = (p) => (p.why === 'chased' ? `추격자 붙은 상품 ${p.chased || 0}개` : `오늘 내림 ${won(p.sum)}원 > 알림선 ${won(p.limit)}원`);
    function line(p) { return p ? `⏸ 묶음 자동 멈춤(${hm(p.at)} · ${whyTxt(p)}) — 값을 내리는 자동 반영은 선택 대기로` : ''; }
    /* 글(설계 CTRLDES3 2.3 그대로) — 알림 · 띠 · 다시 켬 */
    function msgPause(name, p, recent) { const t = p.why === 'chased' ? `오늘 이 묶음에서 추격자가 붙은 상품이 ${p.chased || 0}개 — 문턱을 넘었습니다.` : `오늘 이 묶음에서 값이 ${p.n || 0}건 내려가 합 ${won(p.sum)}원 — 알림선 ${won(p.limit)}원을 넘었습니다.`;
      return `⏸ 묶음 「${name}」 가격 감시·추격을 멈췄습니다. ${t} 멈춘 것: 값을 내리는 자동 반영 · 추격 전략의 새 걸음. 시장 읽기와 값 올리기는 그대로입니다.${recent >= 3 ? ' 사흘 안에 세 번째 멈춤입니다 — 알림선이나 전략을 다시 보실 때입니다.' : ''}`; }
    function msgAlert(name, p) { return p.why === 'chased' ? `🔔 묶음 「${name}」 오늘 추격자가 붙은 상품 ${p.chased || 0}개 — 감시는 그대로 돕니다(설정에서 「알리고 멈춤」으로 바꿀 수 있음).` : `🔔 묶음 「${name}」 오늘 내림 합 ${won(p.sum)}원이 알림선 ${won(p.limit)}원을 넘었습니다 — 감시는 그대로 돕니다(설정에서 「알리고 멈춤」으로 바꿀 수 있음).`; }
    function band(p, wait) { return `⏸ 자동 멈춤(${hm(p.at)} · ${whyTxt(p)}) · 기다리는 내림 ${wait || 0}건은 선택 대기에 · 다시 켜기`; }
    function msgResume(name, mode, lim, at) { return `▶ 묶음 「${name}」 가격 감시·추격을 다시 켰습니다(${mode === 'skipToday' ? '오늘은 다시 멈추지 않음' : '지금부터 다시 셈'} · ${hm(at)}). ${mode === 'skipToday' ? '내일부터 다시 셉니다.' : `지금부터 다시 셉니다 — 같은 날 ${won(lim)}원을 또 넘으면 다시 멈춥니다.`}`; }
    /* resumeRec(ctl, mode, o) — 다시 켤 때 쓸 칸 · base = 지금까지 오늘 합(다시 셈은 그 위로만) */
    function resumeRec(mode, o) { o = o || {}; return { at: o.nowIso || new Date().toISOString(), by: o.by || '', day: o.day || '', mode: mode === 'skipToday' ? 'skipToday' : 'recount', base: Math.max(0, Math.round(N(o.sum) || 0)) }; }
    /* recentPauses(log, day) — 사흘 안 멈춤 수(바꿈 기록 log의 kind 'pause') */
    function recentPauses(log, nowIso) { const t0 = Date.parse(nowIso || new Date().toISOString()) - 3 * 864e5; return (Array.isArray(log) ? log : []).filter((x) => x && x.kind === 'pause' && Date.parse(x.at) >= t0).length; }
    /* retro(days, folds, o) — 지난 원장들로 「이 설정이면 며칠 멈췄을까」 · days = [{ day, L }] · folds = [{ fid, name, gids, nFold }] · o = { cfg, nAll, dayLoss(없으면 그날 원장 limit) }
     *  → [{ fid, name, over(넘은 날 수), days:[{ day, sum, n, limit, over }] }] (읽기만) */
    function retro(days, folds, o) { o = o || {}; const cfg = o.cfg || CTRL_DEF; return (folds || []).map((f) => { const D = (days || []).map(({ day, L }) => { const s = daySum(L, f.gids); const lim = dayLimit(o.cfgOf ? o.cfgOf(f.fid) : cfg, o.dayLoss != null ? o.dayLoss : L && L.limit, f.nFold, o.nAll, (f.gids || []).length, o.gAll).limit; return { day, sum: s.sum, n: s.n, limit: lim, over: s.sum > lim }; });
      return { fid: f.fid, name: f.name, over: D.filter((x) => x.over).length, days: D }; }); }
    return { VERSION: '1.0.0', CTRL_DEF, FLOOR, V, cfgPick, merge, cfgNorm, optNorm, foldOf, daySum, dayLimit, pauseLive, pauseCheck, line, msgPause, msgAlert, band, msgResume, resumeRec, recentPauses, retro };
  }
  const Ctrl = makeCtrl();
  if (root && typeof root === 'object') { try { root.ReadnowCtrl = Ctrl; } catch (e) {} }
  /* 💲 (0.17.22 engimp1) 값 주인 하나 — 값을 바꾸기 전 울타리 셈(순수 함수 · 판정 장부 cloud/judge.js와 같은 규칙)
     cur 지금 값 · v 새 값 · S0 설정(maxAutoDropPct·maxAutoRaisePct·insaneMult) · o {others: 남의 값들, floor: 하한} → {ok, why} */
  function fence(cur, v, S0, o) { const S = S0 || {}; o = o || {}; if (v == null || !(cur > 0)) return { ok: true, why: null }; const dp = (v - cur) / cur;
    if (dp < 0 && -dp > (S.maxAutoDropPct ?? 0.30)) return { ok: false, why: 'drop' }; if (dp > 0 && dp > (S.maxAutoRaisePct ?? 0.50)) return { ok: false, why: 'raise' };
    const ps = (o.others || []).filter((x) => x > 0).sort((a, b) => a - b); if (ps.length >= 3 && v > ps[Math.floor(ps.length / 2)] * (S.insaneMult ?? 3)) return { ok: false, why: 'insane' };
    if (o.floor && v < o.floor) return { ok: false, why: 'floor' }; return { ok: true, why: null }; }
  const api = { VERSION, fence, Ctrl, ctrlCfgNorm: Ctrl.cfgNorm, CTRL_DEF: Ctrl.CTRL_DEF, BB_MARGIN_DEF, bbMarginOf, bbValid, bbClean, bbPick, bbNetParts, bbCourier, bbWithCourier, bbNear, bbFloor, bbFloorPick, bbGradeOut, BB_GR_KEYS, bbGrDef, bbGrNorm, bbGrRow, CHARM_TH, GRADE_RANK, sameGradeMatch, critSettings, critTarget, soloHigh, ratioQ, ratioPick, ratioGroupName, ratioSrcText, ratioAv, ratioUb, RATIO_QK, chaseMap, chaserOn, chaseStep, STRATS, DEFAULTS, LABEL, priceStep, snapDown, snapUp, stepDown, tierOf, setTierRange, trackLowest, bucketOf, groupOf, groupOfListing, isExcluded, isAladinSide: (r, S0) => isAladinSide(r, mergeD(S0)), proxyCheck, SKU_TAGS, skuTag, skuWith, specialHit, sellNet, minPriceFor, floors, decide, chaseEvents, chaseState, sellerChase, Chase, Memo };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ReadnowPricing = api;
})(typeof window !== 'undefined' ? window : this);

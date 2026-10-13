# 리드나우 작업 인계 — 웹앱 0.81.0 / 수집기 1.34.0 / 클라우드 0.5.0 (2026-10-07 13:46 중단, 미배포·검증 중)

## 정범 요청 (2026-10-07 13:06)
1. 매입 탭 상단: 실제 진행중 매입이 여럿인데 예전 것과 그 수량만 잡힘
2. 매입 기록에 저장한 결제 정보가 다시 안 뜸 · 카드도 이전에 쓴 것을 옵션으로
3. 웹앱 모든 카드(고객 평가의 상품 등)를 누르면 해당 상품·고객·판매자 상세로 가게 — 전부 찾아서
4. 묻고답하기 입력 화면 문구 도우미: 등록 도우미처럼, 세 편집창(①인사말 ②내용 ③마무리), 편집·추가 가능.
   ①첫 문구 "안녕하세요? 반갑습니다!" ③ "오늘도 좋은 하루 보내세요!" "또 궁금하신 점 있으면 언제든 편하게 문의주세요!" + 전문 상담 멘트 채우기
5. 겉만 고치지 말고 모든 기능·코드를 미리 살펴 느리게 하는 것 제거, 빠르게 할 곳 개선. 충분히 숙고·테스트 후 자랑스러운 결과물

## 한 것 (파일: /home/claude/w/app.html, readnow-collector.user.js, cloud/index.js — out/ 에는 아직 안 복사)
- [3] 웹앱 화면 쌓기(nav stack): 상세 안에서 다른 상세로 가면 뒤로=앞 화면. history.pushState 패치 + S.detail setter, navWrap(openCustomer/Product/Seller/BookSheet/Pending/PurRec/PurAll 다시 그림), navReplace, closeDetail이 쌓인 것 비움
- [3] 공용 링크: gC(고객) gB({lk,uc,lid,iid,isbn,ono,t})(책) gS({id,sc,n})(판매자) gO(주문→data-gor; data-go는 기존 바로가기가 씀) gR(매입) + 전역 capture 클릭 처리 + openBook(못 찾으면 '책 한눈에' 시트) + bkT/cuT
- [3] ~60곳 연결(고객 상세 주문·타임라인, 평가/문의 목록, 홈 칸 topBooks·badRecent·unanswered·lateOrders 등, 주문 행, 현금 판매, 출고 화면 제목·수령인·다른 재고, 송장, 통합 검색(고객 c.id 버그 고침), 순위, 분류, 가격 결정·기록, 시장 블록 판매자, 매입 품목 목록, 판매자 상세에 '우리 책에 올린 이 판매자 매물' 추가, 상품 상세 판매 기록에 구매자)
- [2] 진행중 매입 화면·매입 자세히에 거래 정보(결제·계좌·카드·판매자·주소·배송·비고·사진) 표시(purDealHtml), 카드 입력+app_settings/main.purCards 기억, 고치기→저장하면 그 화면으로 돌아와 새로 그림
- [1] 진행중 매입 칸을 매입 탭 맨 위로(건수·권수), pur_entries/pur_aladin_orders(2026-09-29~) 실시간 수신 → aoToApp 자동, aoCanceled에 noteNow
- [1] 클라우드 0.5.0 buyRead: 5분마다 알라딘 구매 목록 1쪽 → 새 주문 상세까지 pur_aladin_orders (비고 바뀌면 noteNow/noteLog 덧붙임) · shp_cmds type 'aladinBuy' · 수집기는 CMD_NOT_PC로 안 맡음. 모의 테스트 통과(t5.js)
- [4] 수집기 1.34.0 rnPhraseHelper: @match wUsedShopC2C*/wShopSurvey*, #txtAnswer 또는 마지막 textarea 커서 자리에 한 줄 넣기, 수정/삭제/끌기/추가, 기본 문구 다시 넣기, Firebase app_settings/qna_phrases + GM 사본. 모의 화면 테스트 통과. 웹앱 설정 ⑬에서도 편집
- [5] 웹앱 속도: 자료 종류별 memo 판(S.dv, bump('o'|'c'|'p'|'r'|'u'|'s'), MEMO_DEPS), bizCalc 1분 재계산 제거, agg memo, renderLive(0.7초·숨김 시 미룸), 상품 목록 lzmap·검색키 memo, 순위 칸 숨김/같으면 안 그림, 검색 입력 0.18초 디바운스, 표시고객 수 memo, 고객 정렬 Collator·memo, 평가 연결 제목 색인, 반품·현금주문·matchAladinOrders O(n²) 제거, 부팅 _sk 재사용(SKV), 판매자 검색키·칩 memo, 홈 요약 쓰기 조건(숨김·자료 그대로·다른 기기 45초), 글꼴 CSS 비차단, openCustomer 기기 주문 먼저
- 버그: syncReviews의 정의 안 된 'cached' (처음 기기에서 구매평 못 받던 것) 고침
- 수집기 속도: refreshStats count로(전체 읽기는 작업 끝에만), localInfo count, marketSnapPC가 필요한 책만 조회, shp_cmds 듣기 docChanges+재시도, lockdoc 바뀔 때만
- 클라우드 속도: 기준 파일 병렬 받기·바뀌면 다시 넣기, 보강 실패 지수 대기, 유의사항 getAll+시간 상자, tabCounts 키 비교, 같은 오류 로그 30분 1회, 회차 52초 상자

## 남은 일
- out/ 로 복사(index.html, readnow-collector.user.js, cloud/index.js), 웹앱 APP_VER 0.81.0 · CHANGELOG · ❓설명서(링크·화면 쌓기·문구 도우미·속도) · UPDATE_LOG 갱신
- 검증: tt.js 하네스로 부팅(boot/boot2 PAGEERR 0), nav1.txt, 매입 탭 렌더, 링크 클릭 각 화면, hs2/idb2, 린트(lint.js)
- 미처리 감사 항목: 매입 등 컬렉션 매번 전체 받기(증분화), 사진 서명 URL, confirm 리스너 stringify, collector market()/dynJob 전체 metrics 읽기, saveProgress list 재업로드, serverOrders, recomputeCustomers, cloud 브라우저 재활용
- 배포 안내: 클라우드 bash deploy.sh, 수집기 교체, Firestore 규칙 app_settings/qna_phrases 쓰기 확인

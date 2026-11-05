/* col2-config.js — 번외 수집 일꾼(col2) 설정 한 곳 (도우미 Node · 비교 화면 브라우저가 같이 씀)
 * 운영(readnow-scripts 수집기·인쇄 도우미 8898·로거 도우미 8899·웹앱)과 따로 도는 시험 환경 — 운영 파일은 '그대로 불러오기(읽기만)' */
(function (root) {
  'use strict';
  const COL2 = {
    COL2_VER: '0.1.0', /* 번외 일꾼 판 번호 — 운영 APP_VER·수집기 @version과 따로 */
    PORT: 8797, /* 번외 도우미 포트 — 운영 인쇄 도우미 8898·로거 도우미 8899와 겹치면 켜지 않음 */
    PROD_PORTS: [8898, 8899],
    PREFIX: 'col2_', /* Firestore 쓰기는 이 머리 칸만 */
    LS: 'rn3-', /* 기기 저장 열쇠 머리 */
    WEB_ORIGIN: 'https://jerrycson.github.io', /* 비교 화면을 Pages에 올리면 이 출처 — 웹앱과 같은 출처라 구글 로그인을 나눠 씀 */
    /* 운영 공용 파일을 그대로 받아 씀(복사하지 않음) — 판은 받은 파일의 VERSION을 기록에 남김 */
    CORE_BASE: 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/',
    CORE_FILES: ['readnow-aladin-core.js', 'readnow-products-core.js'],
    ALADIN: 'https://www.aladin.co.kr',
    /* 그림자로 읽어도 되는 주소(로그인 없는 공개 상품 화면 하나뿐) — 판매자 센터(scm)·로그인 화면·그 밖은 거절 */
    READ_PATH: '/shop/wproduct.aspx?ItemId=',
    /* 운영 수집기 BOOK_FIXED(src/readnow-collector.src.js 'const BOOK_FIXED =')와 같아야 함 — tests/t_isolation.js가 운영 원본과 견줌 */
    BOOK_FIXED: ['title', 'subtitle', 'series', 'contributors', 'publisher', 'aladinPublisherId', 'pubDate', 'originalTitle', 'isbn13', 'pages', 'size', 'weightG', 'categories', 'basicExtra'],
    /* 그림자 읽기 속도 — 운영(요청 사이 최소 0.7초 · 분당 22권 안팎)보다 훨씬 느리게 해서 같은 PC 주소에서 운영과 겹쳐도 사람다움을 넘지 않게
     * 근거: 없음, 설정으로 바꿈(도우미 col2.json 의 pace) · floorMs = 운영 reqMinMs 700 — 이보다 짧게는 못 고침 */
    PACE: { minGapMs: 8000, jitter: 0.15, hourCap: 120, dayCap: 800, cool429Min: 10, floorMs: 700 },
    /* 작업 창 지킴이 — 근거: 없음, 설정으로 바꿈 */
    WATCH: { tickSec: 60, opensPerHour: 4, hideW: 1280, hideH: 900, showW: 1200, showH: 820, hwinW: 460, hwinH: 680, pageTimeoutSec: 25 },
    /* 운영 웹앱과 같은 Firebase(공개 설정값 — 운영 app.html에 이미 공개돼 있음) · 쓰기는 col2_* 만 */
    FIREBASE: { apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385', storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15' },
    FIREBASE_SDK: 'https://www.gstatic.com/firebasejs/10.12.2/',
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = COL2; else root.COL2 = COL2;
})(typeof globalThis !== 'undefined' ? globalThis : this);

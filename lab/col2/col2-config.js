/* col2-config.js — 번외 수집 일꾼(col2) 설정 한 곳 (도우미 Node · 비교 화면 브라우저가 같이 씀)
 * 운영(readnow-scripts 수집기·인쇄 도우미 8898·로거 도우미 8899·웹앱)과 따로 도는 시험 환경 — 운영 파일은 '그대로 불러오기(읽기만)' */
(function (root) {
  'use strict';
  const COL2 = {
    COL2_VER: '0.1.14', /* 번외 일꾼 판 번호 — 운영 APP_VER·수집기 @version과 따로 */
    PORT: 8797, /* 번외 도우미 포트 — 운영 인쇄 도우미 8898·로거 도우미 8899와 겹치면 켜지 않음 */
    PROD_PORTS: [8898, 8899],
    PREFIX: 'col2_', /* Firestore 쓰기는 이 머리 칸만 */
    LS: 'rn3-', /* 기기 저장 열쇠 머리 */
    WEB_ORIGIN: 'https://jerrycson.github.io', /* 비교 화면을 Pages에 올리면 이 출처 — 웹앱과 같은 출처라 구글 로그인을 나눠 씀 */
    /* 운영 공용 파일을 그대로 받아 씀(복사하지 않음) — 판은 받은 파일의 VERSION을 기록에 남김 */
    CORE_BASE: 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/',
    CORE_FILES: ['readnow-aladin-core.js', 'readnow-products-core.js'],
    /* (0.1.9) 그림자 일에 더 쓰는 운영 공용 파일(그대로 받아 씀) — 판매자(숍 요약·평가 쪽)는 번외 크롬 떨어진 칸에 · 외부 정보(교보·장터 등)는 도우미(Node)에서 운영과 같은 ReadnowExt.run */
    CORE_MORE: ['readnow-sellers-core.js'], CORE_NODE: ['readnow-ext-core.js'],
    /* (0.1.9) 운영 수집기 본체 안에만 있는 해석 함수(🎯 벤치마킹 숍 목록) — 본체 파일을 그대로 받아 이 이름의 함수 글자만 떼어 씀(고치지 않음 · 복사본 없음) */
    LIFT: { file: 'src/readnow-collector.src.js', fns: ['coverKey', 'benchParseSimple', 'benchParse',
      /* (0.1.10) 👥 구매자 분포(숨은 창 그려 읽기) · 🔍 새상품 없는 시세 · 🖼 그린 화면 해석(도우미 /render 답) · 📚 KPIPA — 모두 글자 그대로(받침은 helper/col2-shim.js) */
      'getProductFull', 'nbMarketJob', 'extRenderHelper', 'KP_PAGE', 'kpReq', 'kpYmd', 'kpAdd', 'kpParse', 'kpSig', 'kpToken', 'kpFetch'] },
    /* (0.1.10) 📚 KPIPA 그림자 — 하루 한 번(한국 시각 after 뒤 · 운영 14:30 규칙) 최근 days일 · 근거: 없음, 설정으로 바꿈 */
    KPIPA: { host: 'https://bnk.kpipa.or.kr', days: 7, after: '14:40' },
    /* (0.1.10) 🔍 새상품 없는 시세 그림자 — 사무실 PC만 · 운영이 본 prd_market_nobook 문서를 한 번에 listN개씩 웹앱이 넘김(everyH시간에 한 번) · 근거: 없음, 설정으로 바꿈 */
    NB: { listN: 20, everyH: 6 },
    /* (0.1.10) 🔑 운영 키 — 웹앱이 메모리로만 넘김 · ttlH시간 지나면 버리고 다시 부탁(파일에 안 씀) · 로거는 받지 않음 · 근거: 없음, 설정으로 바꿈 */
    KEYS: { ttlH: 6 },
    /* (0.1.9) 우리 숍 번호 — 그림자는 어느 PC든 우리 숍 화면을 열지 않음(로거 약속 0 · 운영 판매자 센터 일과 안 겹치게) */
    OWN_SC: ['996008'],
    /* (0.1.9) '넘길 수 있음' 셈 — 하루(한국 날짜) 한 일에서 견준 표본 minN개 이상 · 까닭 모를 다름 0 · 못 읽음 maxFailPct% 이하 · 근거: 없음, 설정으로 바꿈(col2.json pass) */
    PASS: { minN: 30, maxFailPct: 20, waitMin: 15 },
    /* (0.1.9) 그림자 일이 운영과 함께 바쁠 때 쉼 — 운영 수집기가 알린 🚚 출고 보호(예스24 다리 hold) · /busy 알림(초) · 근거: 없음, 설정으로 바꿈 */
    BUSY: { maxSec: 1800, restMs: 60e3 },
    ALADIN: 'https://www.aladin.co.kr',
    /* 그림자로 읽어도 되는 주소(로그인 없는 공개 상품 화면 하나뿐) — 판매자 센터(scm)·로그인 화면·그 밖은 거절 */
    READ_PATH: '/shop/wproduct.aspx?ItemId=',
    /* 운영 수집기 BOOK_FIXED(src/readnow-collector.src.js 'const BOOK_FIXED =')와 같아야 함 — tests/t_isolation.js가 운영 원본과 견줌 */
    BOOK_FIXED: ['title', 'subtitle', 'series', 'contributors', 'publisher', 'aladinPublisherId', 'pubDate', 'originalTitle', 'isbn13', 'pages', 'size', 'weightG', 'categories', 'basicExtra'],
    /* 그림자 읽기 속도 — 운영(요청 사이 최소 0.7초 · 분당 22권 안팎)보다 훨씬 느리게 해서 같은 PC 주소에서 운영과 겹쳐도 사람다움을 넘지 않게
     * 근거: 없음, 설정으로 바꿈(도우미 col2.json 의 pace) · floorMs = 운영 reqMinMs 700 — 이보다 짧게는 못 고침 */
    /* (정범님 11/05 밤 — 메인으로 돌릴 때까지 사람 속도의 두 배) 한 장 뒤 4초 안팎(흩음 ±15% 그대로) · 한 시간 240장 · 하루 1,600장 · 429·503 쉼(10분)과 최소 0.7초는 그대로 */
    PACE: { minGapMs: 4000, jitter: 0.15, hourCap: 240, dayCap: 1600, cool429Min: 10, floorMs: 700 },
    /* 작업 창 지킴이 — 근거: 없음, 설정으로 바꿈 */
    WATCH: { tickSec: 60, opensPerHour: 4, coolMin: 30, /* (0.1.2 정범님 11/06) 한 시간 4번 상한에 걸리면 원인을 남기고 30분 뒤 다시 — 근거: 없음, 설정으로 바꿈 */ handoffSec: 10, /* (0.1.3 정범님 11/09) 띄운 크롬이 0으로 곧바로 끝났을 때 같은 프로필의 다른 크롬이 조종 주소를 쓰기를 기다리는 시간(넘겨받기) — 근거: 없음, 설정으로 바꿈 */ hideW: 1280, hideH: 900, showW: 1200, showH: 820, hwinW: 380, hwinH: 560, appW: 380, appH: 560, pageTimeoutSec: 25 },
    /* (0.1.1 정범님 11/05 밤 '도우미는 ALPS·로거 도우미처럼 작게') 📊 상태 창·🔎 비교 화면은 작은 앱 창(크롬 --app · 380×560 · 기억한 자리 · 화면 밖이면 오른쪽 위) */
    /* (0.1.1) 비교 화면은 Firebase에 직접 로그인하지 않음 — 그 PC에 열린 운영 웹앱(이미 로그인)이 도우미의 결과를 받아 col2_* 칸에 대신 씀(RELAY) · 아래 값은 기록용
     * 웹앱이 대신 읽어 줄 수 있는 운영 칸은 READ_OK 뿐(읽기만) */
    /* (0.1.9 정범님 11/09 밤 '로그인 없는 일 전부 그림자') 그림자 일이 운영 결과와 견주려고 읽는 칸(읽기만) — 웹앱(C2R.ok)이 이 칸을 넘겨주기 전까지는 '운영 값 못 받음'으로 남김(웹앱 고침은 lead 몫 · README '0.1.9')
     * app_settings 는 READ_ID 의 문서(bench — 🎯 벤치마킹 대상 숍 번호)만 */
    RELAY: { READ_OK: ['prd_ids', 'prd_books', 'prd_book_metrics', 'bench_items', 'sellers', 'seller_review_daily', 'ext_basic', 'ext_used', 'ext_foreign', 'ext_lib', 'ext_ebook', 'ext_fx', 'app_settings', 'mkt_kpipa', 'prd_market_nobook'], READ_ID: { app_settings: ['bench'] }, READ_RE: { mkt_kpipa: '^\\d{8}$' }, LIST_OK: ['prd_market_nobook'], idleSec: 30, hotSec: 2, gotMin: 10, outMax: 5000, poolN: 1000, poolLow: 50 }, /* (0.1.2) poolN = 웹앱이 한 번에 이어 넘기는 수 · 표본은 운영 prd_books 전체를 한 바퀴씩(하루마다 갈아끼우던 poolDayH는 없앰 — 같은 책 다시 읽기만 늘림) */
    /* (0.1.1 정범님 11/05 밤 '자야 되니까 번외 수집기가 돌아가게만 · 새벽 1~5시에도 돌려') 저절로 돌기 — 웹앱이 넘긴 표본 목록에서 차례로 그림자 읽기·비교(속도는 PACE 그대로)
     * nightOn: 새벽 1~5시(한국 시각)에도 읽음(기본 켬 · 운영 수집기의 밤 쉼 규칙과 따로) · 도우미 col2.json 의 auto:false / nightOn:false 로 끔 · 근거: 없음, 설정으로 바꿈 */
    AUTO: { on: true, nightOn: true, nightFrom: 1, nightTo: 5 }, /* 근거: 없음, 설정으로 바꿈 */
    /* 운영 웹앱과 같은 Firebase(공개 설정값 — 운영 app.html에 이미 공개돼 있음) · 쓰기는 col2_* 만 */
    FIREBASE: { apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385', storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15' },
    FIREBASE_SDK: 'https://www.gstatic.com/firebasejs/10.12.2/',
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = COL2; else root.COL2 = COL2;
})(typeof globalThis !== 'undefined' ? globalThis : this);

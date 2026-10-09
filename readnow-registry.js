/* readnow-registry.js — 관리도구 노선표 (개편 2단계, 관리도구 1판)
 * 누가 무엇을 언제 어떤 길로 하는지를 이 한 곳에 적는다. 웹앱·수집기·가격 감시기·클라우드가 모두 이 파일(과 Firebase의 같은 내용)만 보고 움직인다.
 * 순수 자료 + 순수 함수만 (저장·네트워크·화면 없음). 같은 입력이면 같은 답.
 *
 * 살아 있는 노선표 = Firebase app_settings/sys_registry (Firebase가 기준). 이 파일은 기본값이자 처음 올릴 내용:
 *   웹앱(관리자 기기)이 이 파일의 판이 Firebase 문서보다 새것이면 문서에 올림(덮어쓰지 않고 정범이 바꾼 값 overrides는 그대로 둠).
 *   도구들은 merge(이 파일 기본값, Firebase 문서)로 읽음 → 정범이 웹앱에서 바꾼 값(일 멈춤·맡는 곳 순서·기한)이 바로 모두에게.
 *
 * 1) KINDS — 맡긴 일(shp_cmds)의 종류. by = 맡을 수 있는 곳(앞이 먼저), lane = 쓰는 알라딘 자리(같은 자리 일은 한 번에 하나),
 *    leaseMin = '맡음(running)'이 이만큼 아무 신호 없이 지나면 멈춘 것으로 봄, retry = 멈췄을 때 다시 대기로 돌리는 횟수,
 *    safe = 다시 해도 같은 결과인지(알라딘에 이미 일부 반영됐을 수 있는 일은 false → 다시 돌리지 않고 '사람 확인'),
 *    money = 알라딘에 무언가를 바꾸는 일(실행도구 몫), waitMin = 대기(queued)가 이만큼 넘으면 '아무도 안 맡음' 알림
 * 2) COLLECTIONS — 자료 칸마다 쓰는 도구(주인)·읽는 도구·얼마나 자주 새로워야 하는지(freshMin, 없으면 감시 안 함)·시각 칸
 * 3) PINS — 이번 출시에서 모두가 쓸 공용 파일 판. 도구마다 실제로 읽은 판을 신호로 올리면 건강판이 다른 것을 빨갛게
 * 4) SETTINGS — 흩어진 설정 문서가 어디에 무엇이 있는지 (값은 지금 자리에 둠)
 */
(function (root) {
  'use strict';
  const VERSION = '0.13.4';
  const MIN = 60e3;

  const KINDS = {
    read: { label: '출고 목록 다시 읽기', by: ['cloud', 'pc'], lane: 'scm', prio: 2, leaseMin: 10, retry: 2, safe: true, money: false, waitMin: 10, from: '웹앱 출고 화면' },
    startDelivery: { label: '발송준비시작', by: ['cloud', 'pc'], lane: 'scm', prio: 1, leaseMin: 15, retry: 0, safe: false, money: true, waitMin: 10, from: '웹앱 출고 ①',
      stuckNote: '일부 주문은 이미 발송 요청으로 넘어갔을 수 있음 — 출고 화면에서 주문확인요청을 다시 읽어 남은 주문만 다시 넘기세요' },
    cashStop: { label: '현금 판매 → 알라딘 판매중지', by: ['cloud', 'pc'], lane: 'scm', prio: 1, leaseMin: 10, retry: 2, safe: true, money: true, waitMin: 10, from: '웹앱 현금 판매 저장 (0.97.0)',
      note: '판매중지 목록에서 그 상품을 찾아야 완료 · 이미 판매중지면 그대로 — 다시 해도 두 번 바뀌지 않음' },
    usedInfo: { label: "'중' 상품 유의 사항 다시 읽기", by: ['cloud', 'pc'], lane: 'shop', prio: 3, leaseMin: 15, retry: 2, safe: true, money: false, waitMin: 60, from: '웹앱·클라우드 (중인데 글 없음)' },
    market: { label: '주문 책 시장 다시 읽기', by: ['cloud'], lane: 'shop', prio: 3, leaseMin: 15, retry: 2, safe: true, money: false, waitMin: 15, from: '웹앱 출고 카드' },
    aladinBuy: { label: '알라딘 구매 내역 읽기', by: ['cloud'], lane: 'shop', prio: 5, leaseMin: 60, retry: 1, safe: true, money: false, waitMin: 30, from: '웹앱 매입 탭' },
    c2bAdd: { label: '알라딘 팔기 장바구니 담기', by: ['pc'], lane: 'shop', prio: 4, leaseMin: 30, retry: 1, safe: true, money: true, waitMin: 24 * 60, from: '웹앱 알라딘 매입',
      note: '담기 전에 장바구니를 먼저 읽어 이미 담긴 책은 건너뜀 → 다시 해도 두 번 담기지 않음 (매입 신청·판매 확정은 하지 않음)' },
    regBulk: { label: '📥 알라딘 대량 등록', by: ['pc'], lane: 'scm', prio: 3, leaseMin: 30, retry: 0, safe: false, money: true, waitMin: 60, from: '웹앱 상품 등록 (1.5.0)',
      note: '실행 문(exec_log)에 시작을 적을 수 있을 때만 · 미리보기가 넣은 줄과 하나도 다르지 않을 때만 등록완료 · 등록 뒤 상품 조회에서 공개 확인(90분)', stuckNote: '등록완료를 이미 눌렀을 수 있음 — 웹앱 등록 화면·알라딘 상품 조회에서 확인한 뒤 다시 맡기기' },
    regOne: { label: '📥 개별·미등록 등록 (알라딘 등록 화면)', by: ['pc'], lane: 'scm', prio: 3, leaseMin: 30, retry: 0, safe: false, money: true, waitMin: 60, from: '웹앱 상품 등록 → 알라딘 등록 화면 채워서 열기 (1.6.0)',
      note: '(1.6.0) 사람이 보는 등록 화면: 수집기가 \'하는 중·보냄\'으로 만들어 둠(아무도 가져가지 않음) · (0.10.0) auto=true면 웹앱이 \'대기\'로 맡기고 수집기 PC가 받아 보이지 않는 틀에서 채움 → 못 채운 칸이 있으면 보내지 않음 · 화면이 바뀌면 공개 확인 · 탭이 닫히면 15분 뒤 지킴이가 공개 확인으로', stuckNote: '등록완료를 이미 눌렀을 수 있음 — 알라딘 상품 조회에서 확인' },
    regBulkMock: { label: '🧷 대량 모의 등록 (알라딘에 안 올림)', by: ['pc'], lane: 'scm', prio: 3, leaseMin: 30, retry: 0, safe: true, money: false, waitMin: 60, from: '웹앱 상품 등록 (1.11.0)', note: '엑셀 만들기·올리기·미리보기 대조까지만 — 등록완료는 누르지 않음. 종류를 따로 둔 것은 예전 판 수집기가 받아 실제로 올리지 않게' },
    regOneMock: { label: '🧷 개별·미등록 모의 등록 (알라딘에 안 올림)', by: ['pc'], lane: 'scm', prio: 3, leaseMin: 30, retry: 0, safe: true, money: false, waitMin: 60, from: '웹앱 상품 등록 (1.11.0)', note: '보이지 않는 틀에서 모든 칸·사진 채우기까지 — 등록 단추는 누르지 않음' },
    regAux: { label: '📥 분류·저자·출판사 찾기', by: ['pc'], lane: 'shop', prio: 2, leaseMin: 10, retry: 1, safe: true, money: false, waitMin: 10, from: '웹앱 상품 등록 (클라우드가 안 될 때)' },
    lookup: { label: '사진 가격 조회', by: ['pc'], lane: 'shop', prio: 2, leaseMin: 10, retry: 1, safe: true, money: false, waitMin: 10, from: '웹앱 사진 가격·매입' },
    metrics: { label: '그룹 시장 지표 갱신', by: ['pc'], lane: 'shop', prio: 6, leaseMin: 6 * 60, retry: 3, safe: true, money: false, waitMin: 24 * 60, from: '웹앱 수동 일괄·감시 묶음·관찰 도구',
      note: '긴 일 — 5권마다 진행(i)을 남기므로 다른 PC가 이어받아도 처음부터 하지 않음' },
    cashTest: { label: '(웹앱 시험) 현금 판매', by: ['webapp'], lane: 'none', prio: 9, leaseMin: 5, retry: 0, safe: true, money: false, waitMin: 0, test: true, from: '웹앱 테스트' },
    permCheck: { label: '(웹앱 시험) 쓰기 권한 확인', by: ['webapp'], lane: 'none', prio: 9, leaseMin: 5, retry: 0, safe: true, money: false, waitMin: 0, test: true, from: '웹앱 설정' },
  };

  // 매일 자동 수집(수집기 SCHED_ITEMS)과 요청 작업(prd_jobs/request) — 1판은 목록과 순서만 (실행 위치는 지금 그대로 수집기)
  const JOBS = [
    { k: 'qna', label: '묻고 답하기', by: ['pc'], order: 1 }, { k: 'returns', label: '반품', by: ['pc'], order: 2 }, { k: 'scanDaily', label: '상품 조회/수정', by: ['pc'], order: 3 },
    { k: 'buyback', label: '알라딘 팔기 정산', by: ['pc'], order: 4 }, { k: 'aladinBuy', label: '알라딘 구매 내역', by: ['pc', 'cloud'], order: 5 }, { k: 'crmBulk', label: '고객·주문 일괄', by: ['pc'], order: 6 }, { k: 'chain', label: '일괄 수집', by: ['pc'], order: 7 },
    { k: 'tick', label: '주문확인요청·발송 요청·상품 보강 (1분마다)', by: ['cloud'], order: 0 }, { k: 'costs', label: '데이터 관리 비용 기록 (매일)', by: ['cloud'], order: 8 }, { k: 'ml', label: '결과 기록 (매일 한국 1시 뒤)', by: ['cloud'], order: 8 },
  ];

  // 자료 칸: w = 쓰는 도구(주인), r = 읽는 도구, freshMin = 이 시간 안에 새 자료가 있어야 정상(감시 대상만 — 바뀔 때만 쓰는 칸은 조용한 때 '늦음'으로 잘못 보이므로 넣지 않음), ts = 시각 칸
  const C = (w, r, freshMin, ts, note) => ({ w, r, freshMin: freshMin || null, ts: ts || 'uploadedAt', note: note || '' });
  const COLLECTIONS = {
    shp_state: C(['cloud', 'pc'], ['webapp'], null, 'uploadedAt', '주문확인요청·발송 요청 지금 목록 (바뀔 때만 씀 → 살아 있음은 클라우드 신호로)'),
    shp_cmds: C(['webapp', 'cloud', 'pc'], ['cloud', 'pc', 'webapp'], null, 'uploadedAt', '맡긴 일 — 노선표 KINDS'),
    shp_days: C(['webapp'], ['webapp'], null),
    crm_orders: C(['pc', 'cloud'], ['webapp', 'cloud'], 26 * 60, 'uploadedAt', '주문 (하루 주문 10건 넘음 — 하루 넘게 새 주문이 없으면 수집이 멈춘 것)'),
    crm_customers: C(['pc'], ['webapp'], null), crm_interactions: C(['pc'], ['webapp'], null, 'uploadedAt', '문의·구매평'), crm_returns: C(['pc'], ['webapp'], null),
    crm_order_ops: C(['webapp'], ['webapp'], null), crm_notes: C(['webapp'], ['webapp'], null), crm_system: C(['pc', 'webapp'], ['webapp', 'pc'], null),
    prd_listings: C(['pc', 'watch'], ['webapp', 'cloud', 'watch'], null, 'uploadedAt', '우리 상품'),
    prd_listing_changes: C(['pc', 'watch'], ['webapp'], null), prd_books: C(['pc'], ['webapp'], null),
    prd_book_metrics: C(['pc', 'cloud'], ['webapp', 'watch', 'cloud'], null, 'uploadedAt', '시장 지표'), prd_metric_changes: C(['pc', 'cloud'], ['watch', 'webapp'], null),
    prd_used_info: C(['pc', 'cloud'], ['webapp'], null), prd_lookups: C(['pc', 'cloud'], ['webapp'], null),
    prd_price_actions: C(['watch'], ['webapp', 'cloud'], null, 'at'), prd_price_decisions: C(['watch', 'webapp'], ['webapp', 'watch'], null), prd_price_reviews: C(['watch'], ['webapp'], null),
    prd_price_batches: C(['webapp'], ['watch', 'pc', 'webapp'], null), prd_system: C(['webapp', 'watch', 'pc'], ['webapp', 'watch', 'pc'], null),
    sellers: C(['pc', 'tooltip'], ['webapp', 'watch', 'cloud'], null), seller_history: C(['pc'], ['webapp'], null), seller_review_daily: C(['pc'], ['webapp'], null), seller_reviews: C(['pc'], ['webapp'], null),
    rn_status: C(['pc'], ['webapp'], 30, 'atMs', 'PC 수집기 살아 있음 신호'), rn_logs: C(['pc'], ['webapp'], null), cloud_log: C(['cloud'], ['webapp'], null, 'uploadedAt', '클라우드 오류 기록 (오류 때만)'),
    app_settings: C(['webapp', 'cloud'], ['webapp', 'cloud', 'pc'], null), ml_days: C(['cloud'], ['cloud', 'webapp'], 26 * 60, 'uploadedAt', '결과 기록 (매일)'), ml_outcomes: C(['cloud'], ['cloud', 'webapp'], null),
    ml_models: C(['cloud'], ['webapp', 'cloud'], null, 'trainedAt', '팔릴 확률 모델 (0.5.0)'), ml_shadow: C(['cloud'], ['cloud'], null), ml_eval: C(['cloud'], ['webapp', 'cloud'], null, 'at', '그림자 채점'), strategy_weeks: C(['webapp'], ['webapp'], null, 'at', '주간 조언'),
    reg_aux: C(['cloud', 'pc'], ['webapp'], null, 'uploadedAt', '📥 분류·저자·출판사 찾기 결과 보관 (웹앱이 먼저 봄) (0.8.0)'), reg_probe: C(['pc'], ['webapp'], null, 'uploadedAt', '알라딘 등록 화면 조사 기록 — 사진 자동 첨부를 만들려고 (0.8.0)'),
    bench_books: C(['pc'], ['pc', 'webapp'], null, 'at', '🎯 벤치마킹 상품 페이지에서 읽은 ISBN·주제 분류·출간 연월 (알라딘 상품 번호마다 · 판매자끼리 같이 씀 · 0.13.0)'),     bench_items: C(['pc'], ['webapp'], null, 'uploadedAt', '🎯 집중 벤치마킹 판매자 상품 — 처음 본 날·사라진 날·값 바뀜·최저가 표시 붙음/떨어짐(lowEvents) (덧붙이기만) (0.9.0 · 0.11.0)'), bench_days: C(['pc'], ['webapp'], null, 'uploadedAt', '🎯 집중 벤치마킹 하루 요약 + 새로 올린 것·사라진 것 목록 (0.9.0)'), bench_state: C(['pc'], ['pc'], null, 'uploadedAt', '🎯 집중 벤치마킹 지금 목록(다음 날 비교용) (0.9.0)'), bench_probe: C(['pc'], ['webapp'], null, 'uploadedAt', '🎯 판매자 숍 화면 읽기 확인(첫 쪽 일부·읽은 결과) (0.9.0)'),
    prd_cancel_hits: C(['webapp'], ['webapp'], null, 'uploadedAt', '취소 주문 줄과 정확히 맞은 상품(안 팔린 것·뒤에 팔린 것) — 맞은 줄을 쌓기만 · 처리 완료/이유(resolved·resolvedLog) (0.9.0 · 0.11.0)'),
    reg_items: C(['webapp', 'pc'], ['webapp', 'pc'], null, 'uploadedAt', '📥 상품 등록 줄 (조회·선택·결정·확정 — 지우지 않음, 빼기 = stage gone) (0.6.0)'),
    /* (0.6.0) 코드에서 실제로 쓰고 읽는 곳을 찾아 빠졌던 칸을 모두 넣음 (w 쓰는 곳 · r 읽는 곳 — 새로움 기준은 정하지 않음) */
    app_devices: C(['webapp'], ['webapp'], null), app_summary: C(['webapp'], ['webapp'], null), perf_logs: C(['webapp'], ['webapp'], null), ppt_sessions: C(['webapp', 'cloud'], ['webapp', 'cloud'], null), prd_cat_manual: C(['webapp'], ['webapp', 'pc'], null), prd_dyn_history: C(['pc'], ['webapp'], null), prd_explore: C(['pc'], ['pc'], null), prd_ids: C(['pc'], ['pc'], null), prd_imports: C(['pc'], ['webapp'], null), prd_jobs: C(['webapp', 'pc'], ['webapp', 'pc'], null), prd_market_nobook: C(['pc'], ['webapp', 'pc'], null), prd_market_watch: C(['watch'], ['webapp'], null), prd_rank_periods: C(['pc'], ['pc'], null), prd_stop_reasons: C(['webapp'], ['webapp', 'pc'], null), pur_aladin_list: C(['webapp'], ['webapp'], null), pur_aladin_orders: C(['webapp', 'pc', 'cloud'], ['webapp', 'pc'], null), pur_buyback: C(['webapp', 'pc'], ['webapp', 'pc'], null), pur_disposals: C(['webapp'], ['webapp'], null), pur_entries: C(['webapp'], ['webapp'], null), pur_entry_state: C(['webapp'], ['webapp'], null), pur_existing: C(['webapp'], ['webapp'], null), pur_heonot: C(['webapp'], ['webapp'], null), pur_matches: C(['webapp'], ['webapp', 'pc'], null), seller_rev6m: C(['pc'], ['webapp'], null), shp_enrich: C(['cloud'], ['webapp', 'cloud'], null), shp_invoices: C(['webapp', 'pc'], ['webapp', 'pc'], null), shp_market: C(['pc'], ['webapp'], null), shp_orders: C(['pc', 'cloud'], ['webapp', 'cloud'], null), shp_plan: C(['webapp'], ['webapp'], null), shp_snapshots: C(['pc', 'cloud'], ['webapp'], null), reg_claims: C(['pc'], ['webapp'], null),
    exec_log: C(['pc', 'watch', 'cloud', 'webapp'], ['webapp', 'pc', 'watch', 'cloud'], null, 'startedAt', '실행도구의 한 문 — 알라딘을 바꾼 일의 시작·결과 (0.4.0)'),
  };

  // 공용 파일 판 — 이번 출시에서 모두가 써야 하는 판 하나
  const PINS = { 'readnow-core.js': '1.4.1', 'readnow-sellers-core.js': '1.3.0', 'readnow-products-core.js': '0.14.0', 'readnow-pricing-core.js': '0.15.1', 'readnow-shipping-core.js': '0.5.1', 'readnow-orders-core.js': '0.3.0', 'readnow-aladin-core.js': '0.2.0', 'readnow-exec-core.js': '0.1.0', 'readnow-ml-core.js': '0.1.0', 'readnow-register-core.js': '0.6.0', 'readnow-registry.js': VERSION }; // (0.6.0) 등록 엔진 — 상품 관리 코드 판정·대량 등록 엑셀 (웹앱·PC 수집기) // (0.5.0) 스스로 배우기 — 팔릴 확률 모델 (웹앱·클라우드) // (0.4.0) 실행도구의 한 문 — 알라딘을 바꾸는 모든 일이 시작·결과를 exec_log에 // (0.3.0) 알라딘 창구 — 수집기·가격 감시기가 알라딘 화면을 읽는 길 하나
  // 도구마다 쓰는 공용 파일 (판 비교 대상)
  const USES = {
    webapp: ['readnow-core.js', 'readnow-sellers-core.js', 'readnow-products-core.js', 'readnow-pricing-core.js', 'readnow-shipping-core.js', 'readnow-exec-core.js', 'readnow-ml-core.js', 'readnow-register-core.js', 'readnow-registry.js'],
    pc: ['readnow-core.js', 'readnow-sellers-core.js', 'readnow-products-core.js', 'readnow-pricing-core.js', 'readnow-shipping-core.js', 'readnow-orders-core.js', 'readnow-aladin-core.js', 'readnow-exec-core.js', 'readnow-register-core.js', 'readnow-registry.js'],
    watch: ['readnow-core.js', 'readnow-sellers-core.js', 'readnow-products-core.js', 'readnow-pricing-core.js', 'readnow-aladin-core.js', 'readnow-exec-core.js'],
    cloud: ['readnow-core.js', 'readnow-sellers-core.js', 'readnow-products-core.js', 'readnow-pricing-core.js', 'readnow-shipping-core.js', 'readnow-exec-core.js', 'readnow-ml-core.js', 'readnow-register-core.js', 'readnow-registry.js'], // (0.7.0) 클라우드도 등록 엔진(상품 번호 맞춤)
  };
  const TOOLS = { webapp: '웹앱', pc: 'PC 수집기', cloud: '클라우드', watch: '가격 감시기', tooltip: '툴팁' };

  const SETTINGS = [
    ['prd_system/pricing', '가격: 판정 엔진 설정·실험 한도·감시 묶음·조건 묶음·감시 탭', ['webapp', 'watch', 'pc']], ['prd_system/settings', '수집기 설정(작업 중요도·자리 수)', ['pc', 'webapp']],
    ['app_settings/main', '웹앱 공용 설정(비용·목표·출고 마감·📥 등록 조건 reg·맡긴 일 기록 기간 cmdWinDays)', ['webapp']], ['crm_system/accounting', '택배 계약(기간별 택배비)', ['webapp']], ['crm_system/shopPolicy', '우리 배송비 정책', ['pc', 'webapp']],
    ['app_settings/qna_phrases', '고객 응대 문구', ['webapp', 'pc']], ['app_settings/bench', '🎯 집중 벤치마킹 대상 판매자(15명까지 · targets · 처음 15명 seed190) · 수집 그룹·주기(groups) · 모을 정보(fields·detail) · 보기 기준(view) · 주기 수집 켜기(autoOn)', ['webapp', 'pc']], ['prd_system/buyback', '알라딘 매입 진행 상태', ['webapp', 'pc']], ['app_settings/expenses', '기타 지출(수동)', ['webapp']],
    ['app_settings/cloud', '클라우드 신호·판', ['cloud', 'webapp']], ['app_settings/sys_registry', '이 노선표 (Firebase 기준)', ['webapp', 'cloud', 'pc', 'watch']],
  ];


  /* ══════════ (0.13.0) 🎯 집중 벤치마킹 — 웹앱·수집기가 같이 쓰는 기준 한 곳 ══════════
   * ① FIELDS: 판매자 상품마다 모을 수 있는 정보 목록(켜고 끄기 · app_settings/bench.fields) — 'list' = 숍 목록 화면에 이미 있어 시간이 거의 안 듦 · 'detail' = 상품 페이지를 하나씩 열어야 함(한 개당 약 1~2초)
   * ② 수집 주기: 그룹(app_settings/bench.groups — 위에서부터 차례) 마다 'n시간에 한 번' 또는 'n일에 한 번'. 겹치면 위 그룹 먼저 · 그룹 안은 위에서부터
   *    'n일에 한 번' = 한국 날짜로 n일이 바뀌면 · 'n시간에 한 번' = 지난번 시작부터 n시간 지나면 · 그룹에 없는 판매자는 '그룹 없음 — 1일에 한 번'
   * ③ VIEW: 판매자 상세 화면의 보는 기준(가격대 경계·걸린 날 묶음·기간 등) 처음 값 — 관리자가 바꾸면 app_settings/bench.view */
  const BENCH_FIELDS = [
    { k: 'price', grp: 'list', label: '판매가', why: '가격대별 올림·사라짐·회전 · 값 바뀜 · 우리 값과 비교', uses: '가격대·회전·값 바뀜' },
    { k: 'grade', grp: 'list', label: '상태 (최상·상·중·하)', why: '상태별로 잘 팔리는지', uses: '상태' },
    { k: 'title', grp: 'list', label: '책 제목', why: '빨리 팔린 책·새로 올린 책 목록에 이름으로', uses: '목록' },
    { k: 'low', grp: 'list', label: '🏷 최저가 배지', why: '배지 획득·상실·보유 소진 · 배지 효과', uses: '배지' },
    { k: 'priceList', grp: 'list', label: '정가', why: '정가 대비 몇 %에 파는지', uses: '할인율' },
    { k: 'byline', grp: 'list', label: '지은이·출판사 줄', why: '어느 출판사·지은이 책이 잘 빠지는지(출판사별)', uses: '출판사' },
    { k: 'usedCode', grp: 'list', label: '중고 상품 코드', why: '같은 책의 다른 매물과 구분 (기록용)', uses: '기록' },
    { k: 'cover', grp: 'list', label: '표지 그림 이름', why: '표지 파일 이름(ISBN과 비슷하지만 확인 안 된 값) — 기록용', uses: '기록' },
    { k: 'page', grp: 'list', label: '숍 쪽 번호', why: '배지를 얻은 상품이 숍 몇 쪽에 있었는지', uses: '배지' },
    /* (0.13.1) 상품 페이지는 한 번 열면 그 안의 정보를 다 읽는 데 시간이 같음 → 셋으로 나누지 않고 하나로: 켜면 우리가 우리 책에서 모으는 도서 정보 전부(ISBN·분류·출간일·지은이들·출판사·쪽수·크기·무게·원제·시리즈·정가·판매가·Sales Point·순위·평점·리뷰 수·표지 주소·절판/품절 등) */
    { k: 'detail', grp: 'detail', label: '상품 페이지 정보 전부', why: 'ISBN·주제 분류·출간일·지은이·출판사·쪽수·크기·무게·원제·시리즈·정가·새상품 판매가·Sales Point·순위·평점·리뷰 수·표지·절판/품절 — 우리 책에서 모으는 도서 정보와 같은 것 전부', uses: '겹치는 책·매입 후보·분야·출간 연도' },
  ];
  const BENCH_FIELDS_DEF = Object.fromEntries(BENCH_FIELDS.map((f) => [f.k, f.grp === 'list']));
  const BENCH_DETAIL_DEF = { max: 300, maxMin: 30 }; // 상품 페이지 열기: 판매자 한 번 수집에 최대 개수·최대 분 (새로 올린 것 먼저, 남으면 예전 것 채움)
  const BENCH_VIEW_DEF = { bands: [3000, 6000, 10000, 20000, 40000], life: [3, 7, 14, 30, 60], days: 0, cohortDays: 7, fastDays: 7, catDepth: 2, recentN: 60, ourDays: 30, minN: 5 };
  const benchFields = (cfg) => { const f = { ...BENCH_FIELDS_DEF, ...((cfg && cfg.fields) || {}) }; if (f.detail == null || (cfg && cfg.fields && cfg.fields.detail == null)) f.detail = !!(cfg && cfg.fields && (cfg.fields.isbn || cfg.fields.cat || cfg.fields.pubYm)); f.isbn = f.cat = f.pubYm = !!f.detail; return f; }; /* 예전(0.13.0) 세 칸 설정도 읽음 */
  const benchNeedsDetail = (cfg) => { const f = benchFields(cfg); return BENCH_FIELDS.some((x) => x.grp === 'detail' && f[x.k]); };
  const kstDay = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
  const dayMs = (d) => Date.parse(d + 'T00:00:00+09:00');
  /* 그룹 목록(빈 칸·없는 판매자 정리) — 그룹에 없는 '따라가는' 판매자는 맨 아래 '그룹 없음(1일에 한 번)' */
  function benchGroups(cfg) { const T = ((cfg && cfg.targets) || []).filter((t) => t && t.sc && t.on !== false); const on = new Set(T.map((t) => String(t.sc))); const seen = new Set();
    const G = ((cfg && cfg.groups) || []).filter((g) => g && g.id).map((g) => ({ id: g.id, name: g.name || '그룹', unit: g.unit === 'h' ? 'h' : 'd', n: Math.max(1, Math.round(+g.n || 1)), scs: (g.scs || []).map(String).filter((sc) => on.has(sc) && !seen.has(sc) && seen.add(sc)) }));
    const rest = T.map((t) => String(t.sc)).filter((sc) => !seen.has(sc)); if (rest.length) G.push({ id: '_none', name: '그룹 없음', unit: 'd', n: 1, scs: rest, auto: true }); return G; }
  /* 다음 수집 시각: last = 지난번 시작(ms) · lastDay = 지난번 날짜(예전 기록은 시각이 없음) */
  /* (0.13.4) '다 읽은 지 얼마 안 된 판매자는 다시 읽지 않음' — 기준은 지난 회차가 '끝난' 시각(bench_state.endAt · 없으면 시작 시각)
   *  'n일에 한 번' = 날짜가 n번 바뀌고 + 끝난 지 (n×24 − 4)시간(1일 = 20시간) 지남 · 'n시간에 한 번' = 시작부터 n시간 + 끝난 지 n시간의 절반 지남
   *  (0.13.3은 시작 시각부터 20시간이라, 일찍 시작해 늦게 끝낸 회차(멈췄다 이어서·다른 PC로 옮김)는 끝난 지 얼마 안 돼도 다시 읽었음) */
  const BENCH_DAY_GAP_H = (n) => n * 24 - 4;
  const benchGapMs = (g) => (g.unit === 'h' ? g.n * 1800e3 : BENCH_DAY_GAP_H(g.n) * 3600e3);
  function benchNext(g, last, lastDay, end) { if (!last && !lastDay && !end) return 0; const fin = end || last; const gap = fin ? fin + benchGapMs(g) : 0;
    if (g.unit === 'h') return Math.max((last || end || dayMs(lastDay)) + g.n * 3600e3 - 60e3, gap); return Math.max(dayMs(lastDay || kstDay(last || end)) + g.n * 864e5, gap); }
  /* 지금 할 차례: [{sc, gi, g, rank, due, next}] — rank = 전체 순서(위 그룹 먼저, 그룹 안은 위에서부터) */
  /* (0.13.3) 하던 회차(bench_state.prog — 수집기 1.54.0이 10쪽마다 남김)가 시작 20시간 안이면 '하는 중' → 늘 할 차례
   *  behind = 한 주기 이상 밀린 횟수(예: 1일에 한 번인데 어제 차례를 못 끝냄 = 1) */
  function benchPlan(cfg, states, now) { const G = benchGroups(cfg); const out = []; let rank = 0;
    G.forEach((g, gi) => g.scs.forEach((sc) => { const st = (states && states[sc]) || {}; const last = st.runAt ? Date.parse(st.runAt) : null; const end = st.endAt ? Date.parse(st.endAt) : null; const next = benchNext(g, last, st.day || null, end);
      const fresh = !!(end || last) && now - (end || last) < benchGapMs(g); /* 끝난 지 얼마 안 됨 — 수동(모두) 실행에서도 건너뜀 */
      const ps = st.prog && st.prog.startedAt ? Date.parse(st.prog.startedAt) : NaN; const inProg = Number.isFinite(ps) && now - ps < 20 * 3600e3 && !(last && last >= ps);
      const per = g.n * (g.unit === 'h' ? 3600e3 : 864e5); const behind = next <= now && next > 0 ? Math.floor((now - next) / per) : next === 0 ? 1 : 0;
      out.push({ sc, gi, g, rank: rank++, last, end, next, inProg, behind, fresh: fresh && !inProg, due: inProg || next <= now }); }));
    return out; }
  /* (0.13.3) 할 차례 순서 — ① 하던 회차(멈췄다 다시 시작해도 처음 판매자로 돌아가지 않고 하던 판매자부터 이어서) ② 한 주기 이상 밀린 판매자(지난 차례를 못 끝낸 쪽 먼저)
   *  ③ 그다음은 관리자가 정한 블록·판매자 순서(위 블록 먼저 · 블록 안은 위에서부터). 예) 1일에 한 번 15명을 돌다 자정을 넘기면, 이미 끝낸 맨 위 판매자를 다시 읽기 전에 어제 못 한 판매자부터 */
  const benchCmp = (a, b) => (b.inProg ? 1 : 0) - (a.inProg ? 1 : 0) || (b.behind || 0) - (a.behind || 0) || a.rank - b.rank;
  const benchOrder = (P) => P.slice().sort(benchCmp);
  /* 순서표: 지금부터 차례로 했을 때 판매자마다 다음 수집 시작·끝 (durOf(sc) = 걸릴 초) — 겹치면 위 차례가 먼저, 한 번에 하나 */
  function benchSim(cfg, states, now, durOf, horizonH) { const P = benchPlan(cfg, states, now); const end = now + (horizonH || 48) * 3600e3; let t = now; const first = {}; const runs = [];
    const S = P.map((x) => ({ ...x, nx: x.next })); let guard = 0;
    while (guard++ < 2000 && t < end && Object.keys(first).length < S.length) { const ready = S.filter((x) => x.nx <= t || x.inProg).map((x) => ({ x, k: { ...x, behind: x.nx <= t && x.nx > 0 ? Math.floor((t - x.nx) / (x.g.n * (x.g.unit === 'h' ? 3600e3 : 864e5))) : x.behind } })).sort((a, b) => benchCmp(a.k, b.k)).map((o) => o.x)[0];
      if (!ready) { t = Math.min(...S.map((x) => x.nx)); continue; }
      const d = Math.max(60, +durOf(ready.sc) || 600) * 1000; const r = { sc: ready.sc, start: t, end: t + d, rank: ready.rank, gi: ready.gi }; runs.push(r); if (!first[ready.sc]) first[ready.sc] = r; t += d;
      ready.inProg = false; ready.nx = benchNext(ready.g, r.start, null, r.end); }
    return { plan: P, first, runs }; }
  const BENCH = { FIELDS: BENCH_FIELDS, FIELDS_DEF: BENCH_FIELDS_DEF, DETAIL_DEF: BENCH_DETAIL_DEF, VIEW_DEF: BENCH_VIEW_DEF, fields: benchFields, needsDetail: benchNeedsDetail, groups: benchGroups, next: benchNext, plan: benchPlan, order: benchOrder, sim: benchSim, kstDay };
  const DEFAULTS = { KINDS, JOBS, COLLECTIONS, PINS, USES, SETTINGS };
  // Firebase 문서(doc)의 overrides를 기본값 위에 얹음: overrides.kinds.{종류}.{by,prio,leaseMin,retry,waitMin,off} · overrides.pins.{파일}
  function merge(doc) { const o = (doc && doc.overrides) || {}; const K = {}; for (const [k, v] of Object.entries(KINDS)) K[k] = { ...v, ...((o.kinds || {})[k] || {}) };
    for (const [k, v] of Object.entries(o.kinds || {})) if (!K[k] && v && v.label) K[k] = { lane: 'shop', prio: 5, leaseMin: 30, retry: 0, safe: false, money: false, waitMin: 60, by: [], ...v }; // 문서에만 있는 새 종류(코드보다 먼저 적은 것)
    return { ver: VERSION, docVer: (doc && doc.ver) || null, KINDS: K, JOBS, COLLECTIONS, PINS: { ...PINS, ...(o.pins || {}) }, USES, SETTINGS, TOOLS }; }
  const kindOf = (R, type) => (R.KINDS || KINDS)[type] || null;
  // 이 도구(who)가 이 종류를 맡아도 되나: 노선표에 있고, 멈춤(off)이 아니고, by에 들어 있을 때만 — 모르는 종류는 아무도 맡지 않음(예전 수집기는 모르는 종류를 '끝남'으로 처리해 일이 사라질 수 있었음)
  function canHandle(R, type, who) { const k = kindOf(R, type); return !!(k && !k.off && Array.isArray(k.by) && k.by.includes(who)); }
  const tms = (v) => { if (v == null) return NaN; if (typeof v === 'number') return v; if (typeof v === 'string') return Date.parse(v); if (v.toMillis) return v.toMillis(); if (v.seconds != null) return v.seconds * 1000; if (v._seconds != null) return v._seconds * 1000; return NaN; };
  const lastSign = (x) => Math.max(...[x.beatAt, x.uploadedAt, x.claim && x.claim.at, x.createdAt].map(tms).filter(Number.isFinite), 0); // 마지막 살아 있음 신호
  /* sweep(R, cmds, now, alive): 맡긴 일 목록 → 할 일 (클라우드가 1분마다 실행, 웹앱 건강판은 같은 판단을 보여 주기만)
   *  running인데 leaseMin 넘게 신호 없음 → safe이고 retry 남음: 'requeue'(대기로 되돌림, attempts+1) / 아니면 'stuck'(사람 확인, 이유 남김)
   *  queued인데 waitMin 넘음 → 'late'(알림만 — 맡을 곳이 살아 있는지 함께) · 노선표에 없는 종류 → 'unknown'(알림만)
   *  alive = { cloud: bool, pc: bool, webapp: bool } (살아 있는 맡을 곳) */
  function sweep(R, cmds, now, alive) { const out = []; const A = alive || {};
    for (const x of cmds || []) { if (!x || !x.type || !['queued', 'running'].includes(x.status)) continue; const k = kindOf(R, x.type);
      if (!k) { out.push({ id: x.id, type: x.type, act: 'unknown', why: '노선표에 없는 종류 — 맡을 곳이 정해지지 않음' }); continue; } if (k.test) continue;
      const age = (now - lastSign(x)) / MIN;
      if (x.status === 'running' && age > k.leaseMin) { const att = +x.attempts || 0; const who = (x.claim && x.claim.pc) || '?';
        if (k.safe && att < k.retry) out.push({ id: x.id, type: x.type, act: 'requeue', why: `맡은 곳 ${who} · 맡은 뒤 ${Math.round(age)}분 신호 없음 (기한 ${k.leaseMin}분) → 대기로 되돌림 ${att + 1}/${k.retry}`, attempts: att + 1 });
        else out.push({ id: x.id, type: x.type, act: 'stuck', why: `맡은 곳 ${who} · 맡은 뒤 ${Math.round(age)}분 신호 없음 — ${k.safe ? `다시 하기 ${k.retry}번을 다 씀` : '다시 하면 알라딘에 두 번 반영될 수 있어 자동으로 다시 하지 않음'}${k.stuckNote ? ' · ' + k.stuckNote : ''}` }); continue; }
      if (x.status === 'queued' && k.waitMin && (now - tms(x.createdAt)) / MIN > k.waitMin) { const live = (k.by || []).filter((w) => A[w]); out.push({ id: x.id, type: x.type, act: 'late', why: `${Math.round((now - tms(x.createdAt)) / MIN)}분째 아무도 안 맡음 (기준 ${k.waitMin}분) · 맡을 곳 ${(k.by || []).map((w) => TOOLS[w] || w).join('·') || '없음'}${k.off ? ' · 이 종류는 멈춤 상태' : live.length ? ` (살아 있음: ${live.map((w) => TOOLS[w] || w).join('·')})` : ' — 지금 살아 있는 곳 없음'}` }); } }
    return out; }
  // 판 비교: reported = { 'readnow-core.js': '1.4.1', … } (도구가 실제로 읽은 판) → 핀과 다른 것
  const fileKey = (f) => String(f).replace(/^readnow-/, '').replace(/\.js$/, '').replace(/-core$/, ''); // 'readnow-core.js' → 'core', 'readnow-pricing-core.js' → 'pricing' (Firebase 칸 이름에 점을 피함)
  function pinDiff(R, tool, reported) { const P = (R && R.PINS) || PINS; const g = (f) => (reported ? reported[f] || reported[fileKey(f)] || null : null); return (USES[tool] || []).map((f) => ({ f, want: P[f], got: g(f) })).map((x) => ({ ...x, ok: x.got != null && x.got === x.want })); }
  // 도구가 지금 읽은 공용 파일 판 (브라우저 전역에서) — 신호에 실어 보냄 (짧은 이름 키)
  function loadedVers(g) { const G = g || (typeof globalThis !== 'undefined' ? globalThis : {}); const v = (n, k) => (G[n] && (G[n][k || 'VERSION'] || null)) || null;
    return { core: v('ReadNowCore', 'CORE_VERSION'), sellers: v('ReadnowSellers'), products: v('ReadnowProducts'), pricing: v('ReadnowPricing'), shipping: v('ReadnowShipping'), orders: v('ReadnowOrders'), aladin: v('ReadnowAladin'), exec: v('ReadnowExec'), ml: v('ReadnowML'), register: v('ReadnowRegister'), registry: v('ReadnowRegistry') }; }
  // 칸 새로움: lastMs = 그 칸의 가장 새 시각 → 정한 주기보다 오래면 늦음
  function freshness(R, name, lastMs, now) { const c = ((R && R.COLLECTIONS) || COLLECTIONS)[name]; if (!c || !c.freshMin) return null; if (!Number.isFinite(lastMs)) return { ok: false, ageMin: null, want: c.freshMin }; const ageMin = (now - lastMs) / MIN; return { ok: ageMin <= c.freshMin, ageMin, want: c.freshMin }; }

  const api = { VERSION, BENCH, DEFAULTS, KINDS, JOBS, COLLECTIONS, PINS, USES, SETTINGS, TOOLS, merge, kindOf, canHandle, sweep, pinDiff, freshness, lastSign, tms, fileKey, loadedVers };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ReadnowRegistry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

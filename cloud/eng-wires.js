/* 만든 곳: readnow-chats research/ENGINES/engine/wires_bundle.py — 손으로 고치지 말고 다시 만듦 */
module.exports = {
 "_about": "배선 정의(기계 칸만) — 원본 readnow-chats research/ENGINES/registry/wires.json · 만든 곳 wires_bundle.py · 클라우드 cloud/engself.js가 읽음",
 "_v": 1,
 "wires": [
  {
   "id": "W00",
   "stage": 4,
   "money": true,
   "status": "배선",
   "from": "R01 PROBABILITY:SALE_SOON·AMOUNT:SALE_SOON (판매가치 엔진)",
   "srcDoc": "app_settings/value_model",
   "score": {
    "min_n": 30,
    "k_days": 7
   },
   "reads": [
    "web:W00"
   ]
  },
  {
   "id": "W01",
   "stage": 1,
   "money": true,
   "status": "배선",
   "from": "R02 PROBABILITY:SALE_SOON (팔릴 확률 모형 챔피언 7일 확률)",
   "score": {
    "expect": 0,
    "min_n": 30,
    "k_days": 7,
    "doc": "eng_wire/W01",
    "n": "score.eff30.nT",
    "v": "score.eff30.d",
    "down": -0.05
   },
   "reads": [
    "cloud:W01"
   ]
  },
  {
   "id": "W02",
   "stage": 2,
   "money": true,
   "status": "배선",
   "from": "N05 EFFECT_CI:TIMING_EFFECT (소비심리 「내일 주문 ±%」 신호 tmr)",
   "srcDoc": "app_settings/cons_study",
   "score": {
    "expect": 0,
    "min_n": 30,
    "k_days": 7,
    "doc": "eng_wire/W02",
    "n": "score.eff30.nT",
    "v": "score.eff30.d",
    "down": -0.05
   },
   "reads": [
    "web:W02",
    "cloud:W02"
   ]
  },
  {
   "id": "W03",
   "stage": 2,
   "money": false,
   "status": "배선",
   "from": "N05 EFFECT_CI:TIMING_EFFECT·AMOUNT:ENV_DEMAND (요일·연휴·주문 몰리는 ",
   "srcDoc": "app_settings/cons_study",
   "score": {
    "min_n": 20,
    "k_days": 14
   },
   "reads": [
    "web:W03"
   ]
  },
  {
   "id": "W04",
   "stage": 2,
   "money": false,
   "status": "배선",
   "from": "N06 TAGS:BUYER_CONCERN (구매평에서 손님이 자주 걱정한 낱말)",
   "srcDoc": "app_settings/voice_study",
   "score": {
    "min_n": 30,
    "k_days": 7
   },
   "reads": [
    "web:W04"
   ]
  },
  {
   "id": "W05",
   "stage": 0,
   "money": true,
   "status": "후보",
   "from": "R19 AMOUNT:ATTR_EFFECT (상태 글 요소 웃돈 — 미개봉·사인본·특전)",
   "srcDoc": "app_settings/extras_study",
   "score": {
    "min_n": 30,
    "k_days": 7
   }
  },
  {
   "id": "W06",
   "stage": 0,
   "money": false,
   "status": "후보",
   "from": "R20 AMOUNT:ATTR_EFFECT (최저가 배지 효과)",
   "srcDoc": "app_settings/badge_study",
   "score": {
    "min_n": 30,
    "k_days": 7
   }
  },
  {
   "id": "W07",
   "stage": 4,
   "money": true,
   "status": "배선",
   "from": "R12 AMOUNT:EXIT_ACCEPT (알라딘 매입가 — 되받는 값)",
   "srcDoc": "app_settings/buyback_stats",
   "score": {
    "min_n": 30,
    "k_days": 7
   },
   "reads": [
    "web:W07"
   ]
  },
  {
   "id": "W08",
   "stage": 1,
   "money": true,
   "status": "배선",
   "from": "N04 SCORE:PEER_TRUST (판매자 가치 무게 sellerW)",
   "srcDoc": "app_settings/peer_ev",
   "score": {
    "expect": 0,
    "min_n": 30,
    "k_days": 7,
    "doc": "eng_wire/W08",
    "n": "score.eff30.nT",
    "v": "score.eff30.d",
    "down": -0.05
   },
   "reads": [
    "cloud:W08"
   ]
  },
  {
   "id": "W10",
   "stage": 2,
   "money": false,
   "status": "배선",
   "from": "N09 EFFECT_CI:EXPOSURE_EFFECT (숍 앞 페이지 구성 효과)",
   "srcDoc": "app_settings/seller_learn",
   "score": {
    "min_n": 30,
    "k_days": 7
   },
   "reads": [
    "web:W10"
   ]
  },
  {
   "id": "W11",
   "stage": 0,
   "money": false,
   "status": "후보",
   "from": "N07 ORDERED:PRACTICE_GAP (성공 사례 견줌)",
   "srcDoc": "app_settings/bench_obs",
   "score": {
    "min_n": 7,
    "k_days": 7
   }
  },
  {
   "id": "W12",
   "stage": 2,
   "money": false,
   "status": "배선",
   "from": "R14 AMOUNT:REVENUE_FUTURE (이번 달 예상 매출)",
   "score": {
    "min_n": 3,
    "k_days": 1
   },
   "reads": [
    "web:W12"
   ]
  },
  {
   "id": "W15",
   "stage": 4,
   "money": false,
   "status": "배선",
   "from": "R06 AMOUNT:DEMAND_FUTURE (수요 지수 SP)",
   "srcDoc": "app_settings/sp_obs",
   "score": {
    "min_n": 1,
    "k_days": 1
   }
  },
  {
   "id": "W16",
   "stage": 4,
   "money": true,
   "status": "배선",
   "from": "R18 BUDGET:LOSS_BUDGET (하루 손해 한도·5%)",
   "srcDoc": "app_settings/eng_fence",
   "score": {
    "min_n": 1,
    "k_days": 1
   }
  },
  {
   "id": "W17",
   "stage": 2,
   "money": false,
   "status": "배선",
   "from": "N08 ORDERED:ACTOR_PRACTICE (배울 판매자 따라 하기)",
   "srcDoc": "app_settings/seller_learn",
   "score": {
    "min_n": 10,
    "k_days": 14
   },
   "reads": [
    "web:W17"
   ]
  },
  {
   "id": "W18",
   "stage": 0,
   "money": true,
   "status": "후보",
   "from": "N03 PROBABILITY:ACTOR_EXIT (경쟁자 사라짐 예측)",
   "score": {
    "min_n": 30,
    "k_days": 7
   }
  }
 ]
};

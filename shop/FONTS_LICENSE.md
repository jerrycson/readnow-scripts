# 서가 책등 글꼴 — 목록·라이선스 근거 (11/12 shelf4)

정범님 11/12: 책등 제목 글꼴은 그 책 앞표지 제목 글꼴과 최대한 비슷하게(없으면 느낌이 비슷한 갈래로) · 상업 사용 가능한 무료 글꼴만 · 목록은 뒤에 덧붙이기만(저장된 책등 유지).

## 1. 지금 쓰는 글꼴 50개 (`shop/shelf-core.js` FONTS · 갈래 FGEN)

모두 **Google Fonts** 한글 글꼴(SIL Open Font License 1.1 — 상업 사용·웹 삽입 자유). 11/12 `fonts.googleapis.com/css2?family=…`로 37개 집안 모두 응답 200 확인.
받는 법: 그 책장에 쓰인 글자만 `text=`로 받음(한 글꼴 수십 KB).

| 갈래 | 글꼴 |
|---|---|
| 명조·바탕(my) | Noto Serif KR(보통·가늘게·아주 굵게) · Nanum Myeongjo(보통·아주 굵게) · Gowun Batang · Song Myung · Hahmlet(보통·가늘게·아주 굵게) · Diphylleia |
| 고딕(go) | Noto Sans KR(보통·가늘게) · Nanum Gothic · Gowun Dodum · Sunflower(보통·굵게) · Gothic A1(보통·가늘게) · IBM Plex Sans KR(보통·가늘게·굵게) · Stylish |
| 굵은 제목체(bd) | Black Han Sans · Do Hyeon · Bagel Fat One · Gasoek One · Noto Sans KR 아주 굵게 · Gothic A1 아주 굵게 · Nanum Gothic 아주 굵게 |
| 둥근(rd) | Jua · Dongle |
| 손글씨(hw) | Nanum Pen Script · Gaegu · Hi Melody · Yeon Sung · Cute Font · Gamja Flower · Poor Story · Single Day |
| 붓글씨(br) | Nanum Brush Script · Dokdo · East Sea Dokdo |
| 타자기·코딩(tw) | Nanum Gothic Coding · Orbit |
| 꾸밈(dp) | Black And White Picture · Gugi · Kirang Haerang · Moirai One · Grandiflora One |

Google Fonts의 한글 글꼴은 이 37개 집안이 전부입니다(11/12 후보 이름 60여 개를 직접 물어 확인 — Pretendard·Jeju·Nanum Square 등은 Google Fonts에 없음).

## 2. 더 늘릴 수 있는 것 — 스스로 올려 쓰는 상업 무료 글꼴(아직 안 씀)

npm 꾸러미(registry.npmjs.org — 클라우드가 받을 수 있음)의 라이선스 칸으로 1차 확인. **원 배포처 라이선스를 한 번 더 확인한 뒤** 목록에 덧붙입니다.

| 글꼴 | 꾸러미 | npm 라이선스 | 원 배포처 라이선스(알려진 것) | 갈래 |
|---|---|---|---|---|
| Pretendard | `pretendard` 1.3.9 | OFL-1.1 | OFL 1.1 | 고딕 |
| SUIT | `@sun-typeface/suit` 2.0.5 | OFL-1.1 | OFL 1.1 | 고딕 |
| Wanted Sans | `wanted-sans` 1.0.3 | OFL-1.1 | OFL 1.1 | 고딕 |
| 갈무리 | `galmuri` 2.40.3 | OFL-1.1 | OFL 1.1 | 꾸밈(점 글꼴) |
| 마루 부리 | `@kfonts/maruburi` | OFL-1.1 | OFL 1.1(네이버) | 명조 |
| 나눔스퀘어·라운드·네오 | `@kfonts/nanum-square*` | OFL-1.1 | OFL 1.1(네이버) | 고딕·둥근 |
| 나눔바른고딕·바른펜 | `@kfonts/nanum-barun-*` | OFL-1.1 | OFL 1.1(네이버) | 고딕·손글씨 |
| 나눔손글씨 100여 종 | `@kfonts/nanum-handwritting-*` | OFL-1.1 | OFL 1.1(네이버) | 손글씨 |
| 리디바탕 | `@kfonts/ridi-batang` | OFL-1.1 | OFL 1.1(리디) | 명조 |
| LINE Seed KR | `@kfonts/line-seed-sans-kr` | OFL-1.1 | OFL 1.1(LINE) | 고딕 |
| Neo둥근모 | `@kfonts/neodgm` | OFL-1.1 | OFL 1.1 | 꾸밈(점 글꼴) |
| 학교안심 20여 종 | `@kfonts/hakgyoansim-*` | OFL-1.1 | 원 배포처 확인 필요 | 손글씨·바탕·돋움 |
| KCC 한빛 | `@kfonts/kcc-hanbit` | OFL-1.1 | 원 배포처 확인 필요 | 꾸밈 |

**빼 둔 것**: 배달의민족 글꼴(`@kfonts/bm-*` — npm엔 OFL로 적혀 있으나 원 라이선스는 배민 자체 약관) · 넥슨 글꼴(`SEE LICENSE IN README`) · G마켓 산스 등 자체 약관 글꼴 — 원 약관 확인 전엔 쓰지 않음.

### 쓰려면 남은 일 (제안)
한글 글꼴 파일은 하나에 1~10MB라 손님 화면이 통째로 받으면 첫 화면이 느려집니다. Google Fonts처럼 **그 책장에 쓰인 글자만** 잘라 주는 창구가 필요합니다:
클라우드 `/shop/font?f=<글꼴>&t=<글자>` → npm 꾸러미의 woff2를 한 번 받아 두고(저장소) `subset-font`(MIT · harfbuzz wasm)로 잘라 woff2로 돌려줌 · 같은 글자 묶음은 캐시.
그 뒤 FONTS 뒤에 덧붙이고(번호 51~ · 저장 글 `fi`는 두 자리까지 → 99개까지) FGEN에 갈래를 함께 덧붙입니다.

## 3. 앞표지 → 글꼴 갈래 (클라우드 `cloud/shop-cover.js`)
앞표지 위 45%(제목 자리)에서 글자 잉크를 가려 세로/가로 획 굵기 대비·획 굵기를 셈 → 명조(대비 1.6배 넘음)·굵은 제목체(획이 그림 폭의 2% 넘음)·고딕.
실제 표지 표본 12장으로 맞춤(11/12): 사진·그림이 많은 표지는 갈래를 정하지 않고(손님 화면이 분야·제목 낱말로 고름), 손글씨·붓·둥근은 표지 셈으로는 믿을 만하지 않아 고르지 않음.

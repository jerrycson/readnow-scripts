# 드로잉·페인팅·컴퓨터 그래픽 — 웹 심화 조사 (책방 친구 바이블 v2) · 2026-10-29

기존 조사(`research/drawing_cg/findings.md`·`sources.md`·`applied.md`, `notes_web.md` §2, `mascot_rebuild_plan.md` §2.4·2.5)를 먼저 읽고, **빠진 것(구조 드로잉 수치·선 규칙·2.5D 기하·리그 비교·SVG 성능·LOD px 기준·색 체계)** 을 채웠다. 이미 있는 내용(Gooch 식, 셀 2~3단, 외곽선 2×, 그림자 보라 이동, 명암 9단, Live2D 표준 파라미터·물리 값)은 "기존 조사 그대로"로 표시하고 넘어간다.

표기: `[n]` = 출처 번호(§5). "제안" = 출처가 수치를 주지 않아 Claude가 기하·계산으로 만든 값. "관행" = 실무 글 기준(정량 근거 약함). 단위 cm·도(°)·초·프레임(24fps)·CSS px.

---

## 1. 핵심 규칙

1. **머리 = 공 + 옆면 깎음 + 턱 쐐기(Loomis).** 공 지름 D를 기준으로 옆면을 평평하게 깎은 타원의 **높이는 D의 2/3**, 타원은 공 안에서 위아래로 각각 D/6 안쪽에 들어가 세로 중앙에 놓인다. 타원 **폭은 고정이 아니고** 머리가 돌아갈수록 넓어진다(정면에선 얇은 조각만 보임). [1][2]
2. **얼굴 세로 삼등분(Loomis).** 정면·정시선에서 **눈썹선 = 공의 중심**. 옆면 타원 높이의 절반(= D/3)을 한 단위로 하여 눈썹선에서 아래로 한 단위 = 코끝선, 두 단위 = 턱끝, 위로 한 단위 = 머리카락선. 따라서 머리 전체 높이 H = D/2 + 2D/3 = 7D/6 → **D = 0.857 H**, 턱은 공 바닥 아래 **D/6**(=0.143 H)에 있다. [1][2] (바이블 §3.1의 애니 규칙 "공 0.77 H·적도 = 윗눈꺼풀선·턱 0.30 D 아래"는 공이 더 작고 적도가 눈꺼풀선인 **다른 약속**이다. 둘 중 하나만 쓰고 이름을 다르게 둔다: `headModel: "loomis" | "anime"`.)
3. **귀·턱 뒤끝.** 귀는 눈썹선~코끝선 사이(가운데 1/3)에 있고 보통 공의 원래 윤곽 바깥선에서 끝난다. 턱뼈 뒤 끝점(각)은 옆면 타원 안으로 **절반쯤, 또는 조금 더 뒤**에 둔다. 고개를 숙이면 귀는 타원 아래 절반으로 내려가고(눈썹선은 공 중심보다 아래), 들면 반대. [1][2]
4. **눈 간격.** 머리 폭 = 눈 5개, 두 눈 사이 = 눈 1개(보조 출처·공동체 메모 수준, 애니에선 이보다 눈이 커서 머리 폭 = 눈 3.5~4개가 관행). [2][3]
5. **몸통 = 가슴 덩어리 + 골반 덩어리, 사이는 부드러운 허리(Bean/Robo Bean).** 두 타원(또는 상자)은 허리에서 **겹친다**. 남자는 가슴과 골반 폭이 거의 같고, 여자는 가슴이 좁고 골반이 넓다. 기울임(tilt) = 중심선 C자·눌린 쪽 주름·늘어난 쪽 강조, 앞으로 숙임 = 앞면 꺾임(pinch), 비틀기(twist) = 중심선 S자·가까운 모서리 선이 먼 모서리를 덮는다. 수치 비율은 출처가 주지 않는다(바이블 §2.2 표를 쓴다). [4][5]
6. **척추 굽힘 한계(실측 정상 가동 범위, 흉요추 합계).** 앞굽힘 45~50°, 뒤젖힘 25°, 옆굽힘 25°, 회전 30°(한쪽). 목(경추) 굽힘 60°, 젖힘 75°, 옆 45°, 회전 80°. [6] 바이블 §2.2의 "갈비뼈 대 골반 비틀림 70°" 클램프는 실측(30°)의 2배가 넘는 **과장값**이므로 `twistMaxDeg` 기본 45, 최대 70(과장 모드)로 나눈다(제안).
7. **선 굵기 위계: 바깥 실루엣 1.0 · 안쪽 형태선 0.5 · 세부(눈·머리카락 결·옷 디테일) 0.25~0.35.** 가장 굵은 선은 초점(얼굴·실루엣)에, 멀어질수록·빛을 받는 쪽일수록 가늘게, **그림자 쪽·형태가 겹치는 곳·바닥에 닿는 곳은 굵게**, 빛 쪽은 아주 가늘거나 끊는다. [7][8] (기존 조사 "실루엣 2×" 그대로. 안쪽 = 바깥의 50%는 바이블 §0.3와 일치.)
8. **겹침(overlap) 선.** 앞 형태의 윤곽은 끊기지 않고 지나가고, 뒤 형태의 윤곽은 앞 형태에 닿기 **1~1.5 선폭 전에 끊는다**(제안값). 겹치는 곳의 앞 형태 선은 그 지점에서 굵기를 ×1.3~1.5 올린다(Proko "형태가 겹치는 곳은 굵게"). 먼 쪽 모서리의 선은 가까운 모서리 선에 덮인다. [4][7]
9. **테이퍼(선 끝 가늘어짐).** 디지털 선화의 표준 설정은 "시작·끝(Starting and ending)"을 **길이 또는 비율**로 지정하고 최소값(min)까지 내려가는 방식. 우리 값(제안): 양 끝 각 15~25% 구간에서 폭이 100% → 30%로, 끝점 폭 0은 쓰지 않음(안티앨리어싱 때 사라짐). [9]
10. **셀 그림자는 2단(애니) 또는 3단(툰), 경계는 딱딱하게**(기존 조사 그대로). 그림자 영역은 "빛 쪽으로 d만큼 옮긴 같은 도형"으로 깎아 만든다(현 엔진 방식 유지). d 기본 = 부품 폭의 0.15(범위 0.08~0.25, 제안). [10][11]
11. **쿨-웜(Gooch)** `I = ((1+l·n)/2)·k_cool + (1−(1+l·n)/2)·k_warm`, `k_cool=(0,0,b)+α·k_d`, `k_warm=(y,y,0)+β·k_d`, 예시 b 0.4 · y 0.4 · α 0.2 · β 0.6(기존 조사 그대로). 2D에선 n을 실제로 구하지 않고 "빛 쪽 영역 = warm, 그림자 영역 = cool" 두 값으로 양자화한다. [11]
12. **피부 산란 흉내 = 랩 라이팅 + 경계 따뜻한 띠(GPU Gems).** `diffuse_wrap = max(0, (N·L + wrap)/(1 + wrap))`, wrap 0~1(예시 0.2) → 그림자 영역이 좁아진다(구에서 wrap 0.2면 그림자 호가 50% → 43.6%). 경계 띠: `scatter = smoothstep(0, w, x)·smoothstep(2w, w, x)`, w = 0.3, 띠 색 (0.15, 0, 0) 더하기(= 붉게). [12] 2D 대응: 피부 그림자 **경계의 빛 쪽에 부품 폭 0.04~0.06의 따뜻한 띠**(H +8~12° 주황 쪽, S +15%)를 깐다(제안, 근거 [12][13]).
13. **림라이트(Roystan 툰 셰이더 표준값).** `rim = 1 − N·V`, `rimI = rim · lightI^0.1`, `smoothstep(0.716−0.01, 0.716+0.01, rimI)`, 림색 흰색. [14] 2D 대응: 실루엣 안쪽 **부품 반지름의 4%**(구 기하 환산: N·V < 0.284 ↔ 띠 폭 0.041 R) 띠, 애니 관행은 더 굵으므로 기본 부품 폭의 0.05(범위 0.02~0.10), **빛 반대쪽 실루엣**에만 깐다(제안).
14. **그림자색 산출(HSL 이동).** 1차 그림자: 명도 조금 내림·채도 조금 올림·색상을 파랑/보라 쪽으로 이동. 2차 그림자: 1차보다 **조금만** 더 어둡고 색상은 더 파랑 쪽. 하이라이트: 가장 밝은 면에 밝은 색 먼저, 그 위에 흰 점. [13] 수치는 출처가 주지 않으므로 제안: 1차 H → 240° 쪽으로 8°(범위 4~14°), S +6%p(0~+12), L −14%p(−10~−20); 2차 추가 H +4°, L −8%p. (기존 조사 "+0.05~+0.12 색조 이동(관행)"과 같은 범위.)
15. **2.5D 머리 돌리기의 기하 = 구면 위 위치 + 코사인 단축.** 얼굴 중심에서 각 φ(경도)에 있는 부품의 폭 배율은 `cos(φ + yaw)/cos(φ)`(먼 쪽), `cos(φ − yaw)/cos(φ)`(가까운 쪽). 애니 얼굴은 구보다 평평하므로 **유효 반지름 R_eff = k × HW/2, k 기본 1.6**(제안)으로 눈 위치각 φ_eye ≈ 22°가 되게 한다. 이때 yaw 20°에서 먼 눈 폭 0.80, 가까운 눈 1.0~1.05 → Live2D 관행(먼 눈 75~85%)과 맞는다. 즉 **Live2D AngleX ±30 ≒ 실제 yaw ±20°** 로 매핑한다. [15][16][17] (바이블 §2.5의 "yaw ±90(편안 ±70)"은 이 기하로 돌리면 yaw 40°에서 먼 눈이 0.51, 53°에서 콧대에 가려 사라지므로, **편안 범위 ±40°·한계 ±60°** 로 고친다 — 제안.)
16. **Live2D 머리 XY 작업 절차(공식 튜토리얼).** Angle X·Y 각각 키 3개, 대각(4모서리)은 자동 생성 후 손보기. 변형기 분할: 윤곽 2×3 · 눈 3×3(각각) · 코 2×2(점코)/2×3(긴 코) · 입 3×2 · 눈썹 2×2 · 귀 2×2 · 앞머리 2×2 · 옆·뒷머리 2×3. 규칙: 세로로 긴 부품 2×3, 가로로 긴 부품 3×2, 정사각형에 가까우면 2×2/3×3. **부모 변형기는 자식보다 작으면 안 된다.** 변환 분할은 5×5(크면 무거움). 원근: 먼 쪽 조금 좁게·가까운 쪽 넓게, Y는 뒤쪽을 조금만 좁힘, **정지 모양이 아니라 파라미터를 움직이며 판단**. [16][18] (파라미터 범위·시차 계수·먼 눈 폭 수치는 notes_web §2-2 그대로.)
17. **키뷰 보간식 2.5D(Rivers·Igarashi·Durand).** 부품마다 3D 앵커 1점 + 키뷰(정면·옆·위 등 2~4장)의 2D 그림을 두고, 새 각도에서 **위치는 앵커를 3D 회전**, **모양은 키뷰 점들의 들로네 삼각형 안에서 2D 보간**, **z-순서는 앵커 깊이로 매 뷰 재계산 + 작가가 뷰 범위별 '겹침 제약'으로 덮어씀**. 뾰족·오목·얇은 껍질(머리카락)은 보간이 나쁘므로 볼록 조각으로 쪼개 합친다. [15] 우리 엔진은 "앵커 = 구면 위도·경도 + 돌출 깊이, 모양 = 코사인 단축"이라 키뷰가 1장(정면)이면 되지만, **옆얼굴 전용 윤곽·귀·코 그림을 두 번째 키뷰(yaw 90°)로 추가**하면 ±60°까지 자연스럽다(제안).
18. **벡터 2D 리그 공통 구조(Spine·Live2D·Harmony·Moho).** ① 뼈 계층(부모→자식 전파만, 자식 편집은 부모에 영향 없음) ② 메시/워프 변형(가중치 바인딩이 기본, 정점별 키는 최소) ③ z-순서 키(그리기 순서 타임라인 또는 깊이 재계산) ④ IK는 1~2 뼈, 굽힘 방향·늘림·압축·**softness(최대 뻗음 전 감속 거리)**·mix 0~100 ⑤ 물리 = 관성·강성(복원력)·감쇠·질량·바람·중력·mix, 갱신 30~60Hz 고정 ⑥ 블렌드 = 키폼 선형 보간(큰 회전은 회전 변형기로, 워프로 돌리면 중간에 쪼그라듦). [16][18][19][20][21][22][23]
19. **메시 비용.** 정점 수 × 영향 뼈 수 = 변환 횟수(100정점×2뼈 = 200). 정점 수는 최소로, 정점 키(deform key)는 키마다 메시 전체를 저장하므로 피한다. 실무 감각: 캐릭터당 600~800 정점은 괜찮음(공동체 수치). [24][25]
20. **프레임 예산.** 60fps = 16.7 ms, 브라우저 몫 ≈ 6 ms → **앱 작업 10 ms/프레임**. 합성(compositing)은 4~5 ms 목표. [26][27] 24fps 연출이라도 휴대폰 화면은 60Hz이므로 **갱신 프레임의 JS+레이아웃+페인트 합이 10 ms 안**이어야 한다. 바이블 §2.9 "데스크톱 ≤4 ms·휴대폰 ≤8 ms"는 이 안에 든다(유지).
21. **합성 전용 속성은 transform·opacity 둘뿐**, filter도 GPU 가속 목록(Chrome). SVG 애니메이션은 **Chromium 89부터 기본 GPU 합성**. `will-change`는 ① 바꾸기 직전에 넣고 끝나면 `auto`로 되돌림 ② 많은 요소에 쓰지 않음(레이어 폭발·메모리) ③ 넣으면 비트맵이 고정돼 **확대 시 흐려짐**(Chrome 53+: will-change 없으면 스케일 때 재래스터). [26][27][28][29][30]
22. **블러는 애니메이션하지 않는다.** 비용 ∝ 면적 × 커널(또는 상자 3~4패스), 512² σ6 ≈ 2 ms(uint8 CPU) · 1024² ≈ 9.6 ms. 흐림 정도를 바꿔야 하면 **1·2·4·8 px 4단계를 미리 만들어 opacity로 교차 페이드**(Chrome 권장). 흐린 복사본에 각각 will-change를 주면 더 느려지고, **부모 래퍼 하나만 승격**해야 한다. [30][31]
23. **`<use>`는 바이트를 줄이지 페인트를 줄이지 않는다.** 인스턴스마다 그림자 트리를 만들어 스타일을 다시 계산하므로, 같은 모양(눈 하이라이트·단추·대칭 머리칼)의 **파일 크기(130 KB 예산) 절감용**으로만 쓰고, 프레임마다 바뀌는 부품에는 쓰지 않는다. [32][33]
24. **측정법.** DevTools Performance: CPU 4× 느리게(저가 휴대폰은 20×) 녹화 → Frames 트랙·FPS 차트 빨간 막대·긴 작업(빨간 삼각) 확인, `Show Rendering stats`로 실시간 FPS. 코드 안에서는 `performance.now()`로 갱신 함수 구간을 재고 `PerformanceObserver('longtask')`(50 ms 이상)로 기록한다. [34]
25. **LOD의 물리 근거.** CSS 기준 픽셀 = 96 dpi 화면을 팔 길이(28 in ≈ 71 cm)에서 볼 때 1 px의 시각(0.0213°) → 1 CSS px ≈ 0.265 mm(데스크톱). 휴대폰은 25~30 cm에서 보고 CSS px가 1/160 in ≈ 0.159 mm(안드로이드 dp 정의, 원문 미접속). 정상 시력 1 arcmin = 30 cm에서 0.087 mm, 60 cm에서 0.175 mm → **1 CSS px은 두 화면 모두 1.5~1.8 arcmin으로 보이므로, 0.5 px 이하 선은 식별 한계 밖(회색 번짐)**. 최소 선폭 1 CSS px, 최소 틈 1 px. [35][36][37]
26. **캐릭터 실제 크기 → px.** 7 cm = 데스크톱 265 px / 휴대폰 441 px, 14 cm = 529 / 882 px. 6등신이면 머리 44/74 px(7 cm), 88/147 px(14 cm); SD 3등신이면 88/147, 176/294 px. [35][36]
27. **부품별 그리기 문턱(px 계산, 제안).** 손가락 분리 = 손가락 폭 ≥ 3 px(안쪽선 2개 + 채움 1 px) ⇔ 손 폭 ≥ 14 px ⇔ 머리 ≥ 24 px. 속눈썹 가시 = 길이 ≥ 2 px·폭 1 px ⇔ 눈 높이 ≥ 8 px ⇔ 머리 ≥ 60 px. 쌍꺼풀 선 = 속눈썹선과 ≥ 2 px 떨어짐(바이블 E6: 눈 높이의 0.25~0.35) ⇔ 눈 높이 ≥ 8 px ⇔ 머리 ≥ 55~65 px. → **바이블 §0.3 LOD 표(<24 / 24~60 / >60 px)와 일치**하며, 7 cm 6등신 데스크톱(44 px)은 중간 단계, 그 외는 모두 상세 단계가 된다. [35][36][37]
28. **색 체계.** 한 캐릭터 팔레트 = 재질마다 {기본, 1차 그림자, 2차 그림자(돌출부 캐스트만), 하이라이트, 선색} 5값. 선색은 그 재질 기본색의 어두운 판(순검정 금지, 기존 조사 그대로). 실제 피부 범위는 Monk 10단계(#f6ede4 ~ #292420)로 두고, 애니 피부는 Monk 1~4 사이를 **채도 +10~20%p, 색상 주황 쪽**으로 옮긴 값(제안). **의미를 지닌 도형 쌍(눈동자-흰자, 선-채움, 피부-옷)은 명도 대비 ≥ 3:1**(WCAG 1.4.11), 말풍선 글자는 4.5:1(G18). [38][39]

---

## 2. 세부 조사

### Q1. 구조 드로잉 — 머리 공·턱 쐐기, 몸통 두 덩어리, 척추 한계

**Loomis 머리(Proko 강의 노트·finearttutorials 요약)** [1][2]

| 항목 | 값 | 근거 |
|---|---|---|
| 공(두개골) | 정원(완전한 원), 지름 D | [1] |
| 옆면 깎음(평면 타원) | 높이 = **2/3 D**, 위아래 각 D/6 안쪽, 세로 중앙. 폭은 돌림각에 따라 변함(정면: 얇은 조각) | [1][2] |
| 눈썹선 | 정면·정시선 = 공 중심(적도). 고개 들면 중심 위, 숙이면 아래 | [2] |
| 단위 | 옆면 타원 높이의 절반 = D/3 = 얼굴 1/3 | [2] |
| 코끝선 | 눈썹선 + D/3 | [1][2] |
| 턱끝 | 코끝선 + D/3 (= 공 바닥 + D/6) | [1][2] |
| 머리카락선 | 눈썹선 − D/3 (= 공 꼭대기와 눈썹선의 중간) | [1][2] |
| 턱 뒤 각(gonion) | 옆면 타원 안 절반, 또는 조금 더 뒤 | [1] |
| 귀 | 눈썹선~코끝선 사이, 공 원래 윤곽 바깥쪽 끝. 숙이면 타원 아래 절반 | [2] |
| 눈구멍 | 정면 평면에서 20~30° 안으로 기울어짐; 두 눈알 사이 = 눈알 하나 폭 | [3] |
| 머리 폭 | 눈 5개(보조·공동체 메모) | [2][3] |
| 중심선 | 정면에서만 가운데, 돌면 보는 방향으로 이동 | [2] |
| 단축 | 가까운 1/3(예: 이마)은 옆면 타원 높이의 절반쯤, 먼 두 칸은 점점 작아짐 | [2] |

파생 수치: H(정수리~턱) = D/2 + 2D/3 = 7D/6 → D = 0.857 H, 눈썹선 = 0.43 H, 코끝선 = 0.71 H, 턱 = 1.0 H, 머리카락선 = 0.14 H. (실사 비율. 애니 비율은 바이블 §3.9.)

**몸통 두 덩어리(Proko Bean·Robo Bean)** [4][5]
- 두 타원(가슴·골반)이 **허리에서 겹친다**. 가슴 타원은 10번 갈비뼈쯤에서 실제 곡선이 멈추지만 연장해 타원으로 닫고, 골반 타원은 사선근을 따라 허리 가장 얇은 곳까지 올라와 가슴 타원과 만난다. [4]
- 남 = 가슴·골반 폭 거의 같음, 여 = 가슴 좁고 골반 넓음. [5]
- 상자 모서리(ASIS 두 점 = 골반 각도 지표, 견갑골 가시 = 가슴 윗면·뒷면 경계). 모서리 각 = 좌우 기울임, 윗면·바닥면 보임 = 앞뒤 숙임, 옆면 보임 = 비틀림. [5]
- 동작 표현: 기울임 → 중심선 C, 눌린 쪽 주름·늘어난 쪽 강조 / 앞숙임 → 앞면 꺾임선(pinch), 등은 제스처 선 / 뒤젖힘 → 꺾임이 숨어 기울임처럼 보이므로 단면선으로 단축 표현 / 비틀기 → 중심선 S, 옆에서 보면 앞면 중심선은 위, 뒷면 중심선은 아래 / 단축 → 타원이 둥글어지고 겹침 증가. [4]
- 수치 비율·휴식 자세 기울기는 두 출처 모두 주지 않음("근거 없음" → 바이블 §2.2·§1.5 사용).

**척추 가동 범위(실측 정상값)** [6]

| 부위 | 앞굽힘 | 뒤젖힘 | 옆굽힘 | 회전 |
|---|---|---|---|---|
| 경추(목) | 60° | 75° | 45° | 80° |
| 흉요추(가슴+허리 합) | 45~50° | 25° | 25° | 30° |
| 어깨 | 굽힘 180·젖힘 50·벌림 180·모음 50·내/외회전 90 | | | |
| 팔꿈치 | 140° | 0 | | |
| 엉덩이 | 100° | 30° | 벌림 40·모음 20 | 내 40·외 50 |
| 무릎 | 150° | 0 | | |

→ 바이블 §2.2의 "갈비뼈-골반 비틀림 70°"는 실측 회전(30°)보다 큰 과장값. 엔진에 `twistMaxDeg` 기본 45°(애니 과장 1.5×), 과장 모드 70°를 두고 설명서에 "실측 30°"를 적는다(제안).

### Q2. 선 그리기 — 굵기 위계·테이퍼·겹침·끊김

**Proko 선 굵기 규칙(요약)** [7]
- 무게 = 굵기 + 어둡기 + 가장자리(날카로움). 세 단계(굵고 어둡게 / 중간 / 가늘고 밝게)로 단순화.
- 바깥 실루엣 굵게, 안쪽 중간, 가장 작은 세부 가장 가늘게. 주제 안의 선은 윤곽보다 가볍게(눈 같은 핵심 세부만 예외).
- 초점(눈·얼굴)에 가장 굵은 선. 멀리 있는 것은 가늘게(전경 > 중경 > 배경). 한 물체 안에서도 **가까운 모서리 굵게, 멀어질수록 가늘게**.
- **그림자 쪽(광원에서 먼 쪽) 굵게, 빛 쪽은 아주 가늘거나 없음.** 물체가 서로 닿는 곳·겹치는 곳은 굵게(빛이 못 들어감).
- 테이퍼로 무게감: 튀어나온 곳(코끝·신발 앞)은 굵게.
- 수치 없음(세 단계만).

**Clip Studio 공식 가이드** [8][9]
- "굵은 외곽선 + 가는 안쪽 선"이 대비·깊이를 만든다. 얼굴 이목구비·머리카락 결·옷 세부는 가는 선. [8]
- 시작·끝(Starting and ending): 브러시 크기·농도 등에 적용, **길이 지정 / 비율 지정 / 페이드** 세 방식, 각 항목에 최소값(min), "속도에 따라" 옵션(느리면 효과 약함). 기본값·범위는 문서에 없음. [9]

**우리 값(제안, 근거 [7][8][9] + 바이블 §0.3)**

| 선 종류 | 굵기 배율(outer=1) | 테이퍼 | 색 |
|---|---|---|---|
| 바깥 실루엣(부품 묶음 전체) | 1.0 | 양 끝 15~25% 구간, 100→30% | 재질 기본색의 어두운 판 |
| 부품 사이 겹침선(앞 부품이 뒤 부품을 덮는 곳) | 1.3~1.5 | 겹침 시작점에서 굵고 1.5 선폭 뒤에 1.0으로 | 같음 |
| 안쪽 형태선(쇄골·팔꿈치·무릎·주름) | 0.5 | 양 끝 30~40%, 100→0(끝이 사라짐 = '잃은 선') | 같음, 투명도 0.8 |
| 세부(속눈썹·머리카락 결·단추) | 0.25~0.35 | 전체 테이퍼(가운데 굵고 양 끝 0) | 같음 |
| 빛 쪽 실루엣(빛 방향 ±45° 안) | 0.6~0.7 (끊어도 됨) | — | 같음 |
| 그림자 쪽 실루엣 | 1.0~1.2 | — | 같음 |

- 뒤 부품의 윤곽은 앞 부품 윤곽에 닿기 **1~1.5 선폭 전에 끊는다**(끊김 = 깊이 신호). 앞 부품 윤곽은 끊지 않는다. [4][7]
- SVG 선은 폭이 일정하므로 테이퍼는 **폭 프로파일 w(t)로 오프셋한 닫힌 리본 path(채움)** 로 그린다(§3 `lineRibbon`).

### Q3. 셀 셰이딩 알고리즘

**그림자 영역 나누기(2D, 법선 없이)** — 현 엔진의 "옮겨서 깎기" 방식이 표준이다. 부품 채움 P, 빛 단위벡터 L(왼쪽 위 고정, 바이블 §0.3):
- 1차 그림자 S1 = P − translate(P, +d·L) (빛 쪽으로 d만큼 옮긴 복사본으로 깎음 → 빛 반대쪽 가장자리에 띠). d = 부품 폭 × 0.15(0.08~0.25).
- 코어 섀도(가장 어두운 띠, 반사광 없음) S2 = S1 ∩ (P − translate(P, +1.6d·L)) 의 바깥쪽 절반 — 3단 툰일 때만.
- 캐스트 섀도 = 돌출부(앞머리·턱·가슴·치마) 채움을 −L 방향으로 d_c(= 돌출 깊이 × 1.0~1.5) 옮겨 **아래 부품에 clip**. 바이블 §2.4 5항과 같음.
- 법선 추정이 꼭 필요하면(Gooch 연속 음영) 거리장: n(p) ≈ ∇(dist to outline), N·L = cos(각). 2D 셀에서는 쓰지 않음(비용·필요 없음).
- 존재하는 그림자 마스크의 **translate 부호 점검**은 applied.md 1번 그대로(가장 먼저).

**Gooch** — 기존 조사 그대로(식·값 규칙 11). 2D 양자화: `colWarm = mix(k_d, (y,y,0), 1−β)`… 실제로는 `k_warm = (y,y,0)+β·k_d`, `k_cool = (0,0,b)+α·k_d` 두 색만 만들어 빛 영역/그림자 영역에 칠한다. [11]

**랩 라이팅·피부 산란(GPU Gems 16장)** [12]
- `wrap_diffuse = max(0,(N·L + wrap)/(1+wrap))`, wrap 0~1, 예시 0.2. 2D 환산: 구에서 경계(터미네이터)는 N·L = −wrap → 각 101.5°(wrap 0.2) → 그림자 호 비율 (180−101.5)/180 = 0.436. **즉 피부 부품의 d를 옷보다 13% 줄인다**(0.15 → 0.13). 
- 경계 띠: `scatter = smoothstep(0, 0.3, x)·smoothstep(0.6, 0.3, x)`, x = wrap_diffuse; 띠 색 (0.15,0,0) 더하기. 2D: 피부 그림자 경계의 빛 쪽에 폭 0.04~0.06 × 부품 폭 띠, 색 = 기본색 H +8~12°(주황), S +15%p, L 같음(더하기이므로 어둡지 않음).

**림라이트(Roystan 툰 표준값)** [14]
- `lightI = smoothstep(0.1−0.01, 0.1+0.01, N·L)`(2단 양자화 문턱 0.1, 폭 0.01), `rimDot = 1−N·V`, `rimI = rimDot·lightI^0.1`, `rim = smoothstep(0.716−0.01, 0.716+0.01, rimI)·rimColor(흰색)`, 스펙큘러 `pow(smoothstep(0.985±0.01, N·H), 100)·0.1`.
- 2D 환산: 구에서 rim 띠 = N·V < 0.284 → 실루엣에서 0.041 R 안쪽. 애니 관행은 더 굵게(0.05~0.08 부품 폭). `lightI^0.1` 항 때문에 **빛 반대쪽(그림자 영역) 안에서만 그려지는 '반사광' 띠**가 된다 → 우리도 S1 안쪽에서만, 실루엣 쪽에서만.

**그림자색(HSL)** [13] + 기존 조사
- 공식 글(Clip Studio 공식 블로그): 1차 = V 조금↓ · S 조금↑ · H를 파랑/초록 쪽으로. 2차 = 1차보다 조금만 어둡고 H 더 파랑 쪽, 가장 깊은 곳에만. 흰 옷 = 밝은 회색에서 시작해 S 조금↑ + 팔레트 쪽 H(연파랑/연녹). 경계색 = 가는 따뜻한 주황(햇빛). 하이라이트 = 밝은 면 먼저 틴트, 그 위 흰색.
- 수치(제안·관행 범위): 1차 ΔH = 240° 쪽 8°(4~14), ΔS +6%p(0~+12), ΔL −14%p(−10~−20). 2차 추가 ΔH +4°, ΔL −8%p. 피부는 ΔH를 **보라 쪽 6°**(파랑까지 가면 탁해짐)·ΔS +10%p. 흰색/아주 밝은 색(L>90)은 ΔL −10, ΔS +8부터.

### Q4. 2.5D 머리 돌리기

**업계 기법 두 갈래**
1. **파츠 변형(Live2D)** — 정면 그림 1장을 워프 변형기로 키 3개(−30/0/+30)씩 X·Y, 대각 자동 생성. 변형기 분할·순서는 규칙 16. 원근은 "먼 쪽 조금 좁게, 가까운 쪽 넓게, Y는 뒤쪽을 조금만". 큰 회전은 워프가 아니라 **회전 변형기**(워프로 돌리면 중간 키에서 쪼그라듦). [16][18] 시차 계수·먼 눈 폭(75~85%)·눈 사이(80~85%)·입 먼 쪽(70~80%)은 notes_web §2-2 그대로(관행).
2. **키뷰 보간(Rivers 2010, 특허)** — 앵커 3D 점 + 키뷰 2~4장(정면·옆·위), 위치는 3D 회전, 모양은 키뷰 삼각형 안 2D 보간, z-순서는 앵커 깊이 + 겹침 제약. 한계: 뾰족·오목·얇은 껍질(머리카락)·내부 선이 나쁨, 겹치는 부품의 z-순서가 바뀔 때 '팝'. [15]
3. 참고: 아동 그림 2.5D(2025) — 좌/우 2뷰만 두고 시야각 θ로 보간, 뒤돌면 좌우 팔다리를 **바꿔 끼움**, 삼각형 단위로 **매 프레임 깊이 정렬**, 부품 속성 'Enclosed'(부모 밖으로 나가면 숨김)·'Hide on Back'. [17]

**우리 기하(제안, 규칙 15)**
- 얼굴 부품의 각 위치: 눈 중심 x = ±0.3 HW(바이블 §3.2 기준) → 유효 반지름 R_eff = k·HW/2, k = 1.6 → sin φ = 0.3/0.8 → **φ_eye = 22°**. 입꼬리 ±0.18 HW → φ 13°. 귀 ±0.5 HW → φ 39°(귀는 옆면 평면이라 별도).
- 폭 배율 `W(φ, yaw) = max(0.25, cos(φ+yaw)/cos φ)`(먼 쪽 +, 가까운 쪽 −).

| yaw(실제) | 먼 눈 폭 | 가까운 눈 폭 | 먼 입 절반 | Live2D AngleX 대응 |
|---|---|---|---|---|
| 10° | 0.92 | 1.06 | 0.95 | 15 |
| 20° | 0.80 | 1.08 | 0.86 | **30** |
| 30° | 0.66 | 1.07 | 0.75 | 45 |
| 40° | 0.51 | 1.03 | 0.62 | 60 |
| 53° | 0.28(콧대에 가리기 시작) | 0.92 | 0.42 | 80 |

(입 먼 쪽 절반 φ = 13°. 관행 "먼 입 70~80%(AngleX 30)"보다 조금 넓게 나오므로 입은 `mouthFarK` 0.9를 곱해 맞춘다 — 제안.)

- 피치: 세로 간격 압축 `cos(θ+pitch)/cos θ`(θ = 적도에서 아래 각). 입 θ ≈ 35°: pitch 10° → 0.86, 12° → 0.83 → Live2D "눈~입 85~90%(AngleY −30)" ≒ **실제 pitch 10~12°**. 우리 ±20°까지 쓰면 입은 0.70까지 압축(위를 보면 반대로 늘어나고 턱 아래 면 띠가 보임, 바이블 §3.7).
- 시차(코 돌출): 코끝 깊이 z_n = +0.12 HW(제안) → 중심선 이동 = sin(yaw)·z_n = 20°에서 0.041 HW(=얼굴 폭의 4%). 관행 "12~18%"는 윤곽(0.3)·눈(0.78) 상대 이동을 합친 체감값이므로 **부품 상대 시차 계수는 바이블 §3.7 표를 오라클로**만 쓴다.
- 한계각: 편안 ±40°(먼 눈 0.5), 한계 ±60°(먼 눈 0.25 + 콧대 클립, 옆얼굴 키뷰 혼합 시작), 피치 ±20°, 롤 ±35°(바이블 그대로).

### Q5. 벡터 2D 리그 공통 구조 → SVG 대응

| 구성 | Spine [19][20][22][24] | Live2D [16][18] | Toon Boom Harmony [21] | Moho [23] | 우리 SVG 대응 |
|---|---|---|---|---|---|
| 뼈 계층 | bone 트리, rotation/scale/shear/inherit | 회전 변형기(각·크기·원점) + 워프 변형기 부모-자식, 자식→부모 영향 없음 | Bone/Game Bone(루트→자식 순 배치, 관절 radius·bias·영향 영역), 페그 위에 디포머 | 뼈(fLength·fStrength 영향, 각 제한 fMin/MaxConstraint) | `rig.bones[]` 트리, 각 뼈 {parent, len, rot, pos}, 월드 변환은 부모→자식 한 방향 |
| 메시/변형 | 메시(정점·삼각·hull·수동 edge), **가중치 바인딩이 기본**, deform key 최소 | 워프 변형기 베지어 2×2/3×3, 변환 5×5, 부모 ≥ 자식 | Curve(베지어 한 줄)·Envelope(윤곽만)·Free Form(내부 텍스처까지)·Shape-Aware | Smart warp/뼈 영향 | 로프트 단면 반지름(바이블 §2.3) = 뼈별 가중 1.0; 머리는 구면 앵커 |
| z-순서 | Draw order 타임라인 키 | 그리기 순서 파라미터 | 레이어/Position Z | 레이어 순서 | 깊이 티어(§2.4) + 뷰 범위별 **겹침 제약표**(Rivers [15]) |
| IK | 1~2뼈, bend+, compress, stretch, uniform, **softness(감속 거리)**, mix 0~100 | 없음(파라미터로 대체) | 체인 | fTargetBone, fMaxAutoScaling, fIgnoredByIK | 2뼈 해석 IK + softness 기본 0.08 × (상완+전완) |
| 물리 | 관성·강성·감쇠·질량·바람·중력·mix·limit·FPS 30~60 | 진자(Mobility·Delay·Acceleration·Radius) 60Hz | — | 뼈 동역학 torque/spring/damping(예 4/2/2, 2/2/5, 2/4/1) | Verlet 진자(notes_web §2-4) + Spine식 `inertia/strength/damping` 이름으로 노출 |
| 블렌드 | 트랙 mix, 애니 간 crossfade | 키폼 선형 보간(큰 회전은 회전 변형기) | — | — | 파라미터 키폼 3점 + smoothstep(바이블 §2.6) |

Spine 물리 의미(공식 가이드) [19]: Inertia = 뼈 움직임이 오프셋으로 전달되는 비율(0~100%), Strength = 원 자세로 당기는 힘, Damping = 속도가 클수록 더 줄임(큰 진동 억제), Mass = 가속 저항(클수록 Strength 필요), Wind/Gravity = 월드 X/Y 상수력, Limit = 물리에 반영되는 최대 이동 속도, Mix = 영향 %, FPS 30~60 권장(낮으면 튀고 실패), FPS를 바꾸면 다른 값도 다시 맞춰야 함(프레임 독립 아님). 기본값·적분식은 공개 문서에 없음(근거 없음).

### Q6. SVG 성능

| 항목 | 사실 | 출처 |
|---|---|---|
| 프레임 예산 | 60fps 16.7 ms, 브라우저 ≈6 ms, 앱 10 ms; 합성 4~5 ms 목표 | [26][27] |
| 합성 전용 속성 | transform·opacity(만). filter는 GPU 가속 목록. SVG 애니메이션 Chromium 89+ 기본 가속 | [27][28] |
| will-change | 바꾸기 직전 설정·끝나면 auto, 많은 요소 금지(레이어마다 GPU 텍스처 메모리), 마지막 수단. 설정 시 비트맵 고정 → 스케일 때 흐림(Chrome 53+, will-change 없으면 재래스터로 선명) | [29][30][26] |
| 블러 | 비용 ∝ 면적×커널(상자 근사 3~4패스로 커널 무관), 512² σ6 2 ms·1024² 9.6 ms(uint8 CPU). 애니메이션 금지 → 1/2/4/8 px 4단 미리 렌더 + opacity 교차, 부모 래퍼만 승격 | [30][31] |
| `<use>` | 인스턴스마다 그림자 트리·스타일 재계산(구현자 설명). 1,330 아이콘을 5개 정의로 — 바이트 절감이 목적 | [32][33] |
| path 수 | 500개 삼각 path를 매 프레임 교체 → Firefox가 Chrome보다 느렸던 사례(채움률 문제). 2008 벤치마크는 50개 단위. 정량 한도는 공개 근거 없음 | [40][41] |
| 메시 정점 | Spine: 정점×뼈 수 = 변환 횟수, 600~800 정점 OK(공동체) | [24][25] |
| 측정 | DevTools Performance(CPU 4×/20× 느리게, Frames·FPS·긴 작업), Rendering stats | [34] |

우리 예산(제안·근거 위 표 + 바이블 §2.9): 전체 그림 ≤ 400 `<path>`, 총 점 ≤ 6,000, 필터 ≤ 2(블러는 정적 1개), clipPath/mask ≤ 16, 프레임당 `d` 재생성 부품 ≤ 12, 갱신 JS ≤ 4 ms(데스크톱)/8 ms(휴대폰 4× 느리게 모드).

### Q7. 화면 크기별 LOD(px)

- 1 CSS px = 0.265 mm(데스크톱 96 dpi) / ≈0.159 mm(휴대폰 160 dpi 기준). 1 arcmin = 0.087 mm(30 cm) / 0.175 mm(60 cm). [35][36][37]
- 7 cm·14 cm 캐릭터의 px와 머리 px는 규칙 26. 그릴지 말지(규칙 27):

| 요소 | 최소 조건 | 머리 px 문턱 | 7 cm 6등신 데스크톱(44) | 7 cm 6등신 폰(74) | 7 cm SD3 폰(147) | 14 cm 6등신 데스크톱(88) |
|---|---|---|---|---|---|---|
| 손가락 분리 | 손가락 폭 ≥ 3 px | ≥ 24 | ○ | ○ | ○ | ○ |
| 손톱 | 손톱 ≥ 2×2 px | ≥ 60 | ✕ | ○ | ○ | ○ |
| 속눈썹 가시 | 길이 ≥ 2 px | ≥ 60 | ✕ | ○ | ○ | ○ |
| 쌍꺼풀 선 | 간격 ≥ 2 px | ≥ 55~65 | ✕ | ○ | ○ | ○ |
| 홍채 안쪽 고리 | 고리 폭 ≥ 1 px | ≥ 60 | ✕ | ○ | ○ | ○ |
| 무릎·팔꿈치 안쪽선 | 선 길이 ≥ 4 px | ≥ 24 | ○ | ○ | ○ | ○ |
| 1차 그림자 | 띠 폭 ≥ 2 px | ≥ 16 | ○ | ○ | ○ | ○ |
| 2차 그림자·림 | 띠 폭 ≥ 1.5 px | ≥ 40 | ○ | ○ | ○ | ○ |
| 따뜻한 경계 띠 | 폭 ≥ 1 px | ≥ 40 | ○ | ○ | ○ | ○ |

→ 바이블 §0.3 표(<24/24~60/>60)를 유지하되 **문턱을 'px 계산'으로 설명서에 적는다**. 추가 규칙: 선폭은 머리 px에 비례(`lineW = 머리px × 0.012`, 최소 1 px, 데스크톱 2 dppx에서 0.75 px 허용)하고, 머리 < 24 px에서는 안쪽선(0.5×)이 1 px 미만이 되므로 **안쪽선 전부 생략**.

### Q8. 색 체계

- 팔레트 구조: 재질(피부·머리·눈·옷 N·소품) × {base, sh1, sh2, hi, line}. sh1/sh2/line은 base에서 **함수로 파생**(규칙 14·28)하고 캐릭터 시트에는 base와 예외만 저장(같은 기준은 한 곳에).
- 실제 피부 범위(Monk 10단계) [38]: 1 #f6ede4 · 2 #f3e7db · 3 #f7ead0 · 4 #eadaba · 5 #d7bd96 · 6 #a07e56 · 7 #825c43 · 8 #604134 · 9 #3a312a · 10 #292420. 애니 피부(제안) = Monk 1~4의 L 유지, S +10~20%p, H 주황(25~35°)로; 어두운 피부(Monk 6~8)는 S +5, L +5(화면에서 선·그림자 대비 확보).
- 대비(WCAG 1.4.11) [39]: 이해에 필요한 도형과 인접색 3:1 — 선 vs 채움, 눈동자 vs 흰자, 피부 vs 옷(실루엣 분리). 장식(하이라이트·블러시)은 예외. 말풍선 글자 4.5:1(G18).
- 그림자 방향·색온도(따뜻한 빛 → 차가운 그림자)는 기존 조사 그대로.

---

## 3. 우리 엔진에 적용하는 법 (SVG/JS 2.5D 리그)

아래 이름은 r15 코드(`msc2_*.js`, `mscLn`·`mscS1/S2`·`MSC2_LW`·`MSC_DP`)와 충돌하지 않게 `rn` 접두어를 썼다. 입력·출력은 JS 값, 좌표는 바이블 §0.1(H 단위, y 아래, z 앞).

### 3.1 구조(뼈대·덩어리)
| 함수 | 입력 | 출력 | 설명 |
|---|---|---|---|
| `rnHeadLoomis(H, model)` | H(px), `model: "loomis"|"anime"` | `{D, brow, nose, chin, hairline, sideOval:{h, insetTop, insetBottom}, gonionDepth}` | loomis: D=0.857H, brow 0.43H, nose 0.71H, hairline 0.14H, sideOval.h=2D/3; anime: 바이블 §3.1 값. 두 모델을 섞지 않음(규칙 2). |
| `rnTorsoBlocks(obj)` | 객체 비례표(§2.2) | `{chest:{w,h,tilt}, pelvis:{w,h,tilt}, overlap}` | overlap = 허리 겹침 높이(기본 0.12 H). 남 chest.w≈pelvis.w, 여 chest.w<pelvis.w. |
| `rnSpineClamp(bend, side, twist)` | 요청 각(°) | 클램프된 각 | 기본 `spineBendF 45, spineBendB 25, spineSide 25, twistMax 45(과장 70)`, 목 `neckBendF 60, neckBendB 75, neckSide 45, neckTwist 80`. 분배 골반 30/허리 40/가슴 30(바이블 §2.2). |

설정: `twistMaxDeg` 45 (30~70), `twistExaggerate` false, `spineBendFDeg` 45 (30~60), `spineBendBDeg` 25 (15~35), `spineSideDeg` 25 (15~35), `torsoOverlapH` 0.12 (0.06~0.2).

### 3.2 선
| 함수 | 입력 | 출력 | 설명 |
|---|---|---|---|
| `rnLineRibbon(pts, w0, taper)` | 중심선 점열, 기본 폭 w0(px), `taper:{inPct, outPct, minPct, endZero}` | 닫힌 `d`(채움용) | 폭 프로파일 w(t) = w0·lerp(minPct,1, smoothstep(0,inPct,t))·lerp(1,minPct, smoothstep(1−outPct,1,t)). 법선 방향 오프셋 ±w/2. 끝 폭 0 금지(endZero=false 기본). |
| `rnLineWeight(kind, ctx)` | `kind: "outer"|"overlap"|"inner"|"detail"`, ctx{lightSide, depthRank, headPx} | 폭 배율 | outer 1.0 · overlap 1.4 · inner 0.5 · detail 0.3; 빛 쪽 ×0.65, 그림자 쪽 ×1.1; depthRank(0 앞)마다 ×0.9; headPx<24면 inner/detail 0. |
| `rnOverlapBreak(backPath, frontPath, gapLW)` | 뒤·앞 윤곽 path, 틈(선폭 배수) | 잘린 뒤 윤곽 | 뒤 윤곽이 앞 채움에 들어가기 gapLW(기본 1.25) 선폭 전에서 끊고, 앞 윤곽은 그대로. 티어 사이 겹침(§2.4 3항)에 적용. |

설정: `lineBase` = 머리px×0.012 (최소 1 px), `lineOuterK` 1.0, `lineOverlapK` 1.4 (1.2~1.6), `lineInnerK` 0.5 (0.4~0.6), `lineDetailK` 0.3 (0.25~0.35), `lineLightSideK` 0.65 (0.5~0.8), `lineShadowSideK` 1.1 (1.0~1.25), `taperInPct` 0.2 (0.1~0.3), `taperOutPct` 0.2, `taperMinPct` 0.3 (0.2~0.5), `overlapGapLW` 1.25 (1~1.5).

### 3.3 셀 셰이딩
| 함수 | 입력 | 출력 | 설명 |
|---|---|---|---|
| `rnShadeRegions(partPath, L, d, tiers)` | 채움 path, 빛 벡터 L(단위, 기본 (−0.6,−0.8) 왼쪽 위), d(px), tiers 2|3 | `{s1, s2?, rim, warmEdge?}` 각각 clip용 path | s1 = P − translate(P, +d·L); s2 = s1 ∩ (P − translate(P, 1.6d·L))의 바깥 절반(tiers 3); rim = s1 ∩ (P − inset(P, rimW))에서 −L 쪽 실루엣만; warmEdge = 피부일 때 s1 경계 빛 쪽 폭 warmW. **translate 부호는 applied.md 1번 점검 뒤 확정.** |
| `rnCastShadow(srcPath, dstPath, depth, L)` | 돌출 부품, 받는 부품, 돌출 깊이(px) | clip path | srcPath를 −L·depth·castK 만큼 옮겨 dstPath로 clip. castK 1.2. |
| `rnShadeColor(base, mat, tier)` | base(HSL), 재질, tier 1|2 | HSL | 규칙 14: tier1 ΔH→240° 쪽 8°(피부 6°·보라 쪽), ΔS +6(피부 +10), ΔL −14; tier2 추가 ΔH +4, ΔL −8. L>90이면 ΔL −10·ΔS +8. |
| `rnGoochPair(kd, cfg)` | 기본색, {b,y,α,β} | `{warm, cool}` | 기존 조사 식. 그림자색을 Gooch로 만들 때 `cool`을 쓰고 rnShadeColor 대신 선택(설정 `shadeMode: "hsl"|"gooch"`). |
| `rnWarmEdge(base)` | 피부 base | 색 | H +10°(주황), S +15%p, L 0. |
| `rnRimColor(base, light)` | base, 빛색 | 색 | 기본 흰색 90% + 빛색 10%, 불투명 0.35. |

설정: `lightDir` (−0.6,−0.8), `shadeTiers` 2 (2~3), `shadeOffsetK` 0.15 (0.08~0.25, 피부 0.13), `shadeMode` "hsl", `shadeHueShift` 8 (4~14), `shadeSatShift` 6 (0~12), `shadeLumShift` −14 (−20~−10), `shade2HueShift` 4, `shade2LumShift` −8, `skinWrap` 0.2 (0~0.4 → shadeOffsetK×(1−wrap·0.65)), `warmEdgeW` 0.05 (0.03~0.08 부품 폭), `rimW` 0.05 (0.02~0.10), `rimOpacity` 0.35 (0.2~0.5), `castK` 1.2 (1.0~1.5), `goochB` 0.4, `goochY` 0.4, `goochAlpha` 0.2, `goochBeta` 0.6.

### 3.4 2.5D 머리
| 함수 | 입력 | 출력 | 설명 |
|---|---|---|---|
| `rnFaceAnchor(feature)` | 부품 이름 | `{lat, lon, depth}` | 정면 2D 위치(x/HW, y/H)에서 `lon = asin(x / (k·HW/2))`, lat 비슷하게, depth = 돌출(코 +0.12 HW, 귀 0, 눈 −0.02). k = `faceCurvatureK` 1.6. |
| `rnProjectFeature(anchor, yaw, pitch, roll)` | 앵커, 각 | `{x, y, wScale, hScale, visible, zRank}` | wScale = max(0.25, cos(lon+yaw)/cos lon), hScale = cos(lat+pitch)/cos lat; 먼 눈은 (lon+yaw) ≥ noseClipDeg부터 콧대 path로 clip, (lon+yaw) ≥ 90°면 숨김; zRank로 티어 정렬. |
| `rnLive2dToYaw(angleX)` | −30~30 | yaw(°) | yaw = angleX × (20/30). AngleY → pitch × (12/30). 설명서에 "Live2D 30 = 실제 20°"를 적음. |
| `rnHeadContour(yaw, pitch, sections)` | 각, 7단면(§2.5) | 윤곽 path(2° 버킷 캐시) | yaw > 45°부터 옆얼굴 키뷰 윤곽과 `t=(yaw−45)/15`로 혼합(Rivers식 2D 보간). |
| `rnParallaxCheck(yaw)` | 20° | 부품별 상대 이동 | 코 1.0 기준 입 0.85·눈 0.78·윤곽 0.3·귀 −0.4·뒷머리 −0.6 ±0.1 안이면 통과(바이블 §3.7 오라클). |

설정: `faceCurvatureK` 1.6 (1.0~2.5), `yawComfortDeg` 40, `yawMaxDeg` 60, `pitchMaxDeg` 20, `rollMaxDeg` 35, `noseClipDeg` 75 (= 먼 눈이 콧대에 가리기 시작하는 lon+yaw, 범위 65~85 → φ_eye 22°면 yaw 53°부터), `mouthFarK` 0.9 (0.8~1.0), `profileBlendStartDeg` 45, `profileBlendEndDeg` 60, `noseDepthHW` 0.12 (0.08~0.18).

### 3.5 리그·물리
| 함수 | 입력 | 출력 | 설명 |
|---|---|---|---|
| `rnIK2(root, lenA, lenB, target, bendSign, softness)` | 뼈 길이, 목표, 굽힘 방향, softness(px) | `{angA, angB, reach}` | 해석 IK. 목표 거리 r이 (lenA+lenB−softness)를 넘으면 r' = max−softness + softness·(1−exp(−(r−(max−softness))/softness))로 감속(Spine softness 의미). 기본 softness = 0.08·(lenA+lenB). |
| `rnPhysicsNode(cfg)` | `{inertia, strength, damping, mass, gravity, wind, mix, limit, fps}` | 노드 | Verlet 진자(notes_web §2-4)에 Spine식 이름을 입힘: inertia = 부모 이동 전달 비율(0~1), strength = 복원 가속 계수, damping = 속도 비례 감쇠, mass 역수로 힘 나눔, limit = 입력 속도 상한. 60Hz 고정 스텝, 최대 5스텝. |
| `rnOverlapRules(view)` | yaw/pitch | 티어 순서 덮어쓰기표 | Rivers '겹침 제약': 예 `{a:"earL", b:"hairSideL", above:true, yawRange:[−60,−10]}`. 뷰 범위 밖이면 깊이 정렬 결과를 쓴다. |
| `rnZPopGuard(prev, next, dt)` | 두 프레임 티어 순서 | 전환 플래그 | 티어 순서가 바뀌는 프레임에서 두 부품이 겹치는 면적 > 2% 부품 면적이면 1프레임 홀드 후 바꿈(팝 완화, Rivers 한계 대응). |

설정: `ikSoftnessK` 0.08 (0.03~0.15), `physFps` 60, `physMaxSteps` 5, 부위별 {inertia, strength, damping}: 앞머리 {0.9, 0.6, 0.12}, 옆머리 {0.8, 0.45, 0.1}, 뒷머리 {0.75, 0.35, 0.08}, 치마 {0.8, 0.5, 0.1}, 리본 {0.97, 0.7, 0.06} (Moho 예시 비율·Live2D Delay/Mobility를 옮긴 제안값).

### 3.6 SVG 성능·LOD
| 함수 | 입력 | 출력 | 설명 |
|---|---|---|---|
| `rnLod(headPx)` | 렌더된 머리 px | `{tier:0|1|2, lineW, drawFingers, drawNails, drawLashes, drawCrease, drawIrisRing, drawShade2, drawRim, drawWarmEdge}` | 규칙 27 표. 2 dppx면 lineW 최소 0.75. |
| `rnFrameBudget()` | — | `{jsMs, isPhone}` | `navigator.hardwareConcurrency ≤ 4` 또는 폭 < 600px이면 phone(8 ms), 아니면 4 ms. |
| `rnDirtyParts(params, prev)` | 파라미터, 이전 값 | 갱신할 부품 목록 | 관절 > 0.4°, 파라미터 > 0.01만(바이블 §2.9). 머리 그룹·손은 임계 아래면 `transform`만. |
| `rnWholeMove(dx, dy, rot)` | 전체 이동 | — | `<svg>`를 감싼 `<div>`의 CSS transform으로만(합성 전용). SVG 안 요소에 will-change를 주지 않음. |
| `rnBlurBank(path, levels)` | 블러 대상, [1,2,4,8] | 미리 렌더된 그룹 4개 | 흐림 변화는 opacity 교차(규칙 22). 부모 래퍼만 `will-change: opacity`. |
| `rnPerfProbe()` | — | `{avgMs, p95Ms, longTasks}` | `performance.now()` 구간 + `PerformanceObserver('longtask')`. 설정 창에 표시(진행·상태가 보이게). |
| `rnSvgBudget(svg)` | 그림 | `{paths, points, filters, clips, bytes}` | 빌드 시 검사: 400/6000/2/16/130 KB 넘으면 실패. |

설정: `budgetPaths` 400, `budgetPoints` 6000, `budgetFilters` 2, `budgetClips` 16, `budgetBytes` 133120, `jsBudgetDesktopMs` 4, `jsBudgetPhoneMs` 8, `useSymbolForRepeats` true(눈 하이라이트·단추·대칭 머리칼 — 바이트 절감용), `blurLevelsPx` [1,2,4,8].

### 3.7 색
| 함수 | 입력 | 출력 |
|---|---|---|
| `rnPalette(baseByMat)` | {skin, hair, eye, cloth[], prop[]} base HSL | 재질별 {base, sh1, sh2, hi, line} (sh1/sh2 = rnShadeColor, line = base L −35·S +5, hi = base L +18·S −10) |
| `rnSkinFromMonk(level, animeK)` | 1~10, 0~1 | 애니 피부 base (Monk hex → HSL, S + 15·animeK, H → 30° 쪽) |
| `rnContrastCheck(palette)` | 팔레트 | 3:1 미만 쌍 목록 (line/base, iris/sclera, skin/cloth) |

설정: `lineLumShift` −35 (−45~−25), `hiLumShift` +18, `animeSkinK` 0.7 (0~1), `contrastMinGraphic` 3.0, `contrastMinText` 4.5.

### 3.8 설명서·홈 카드 갱신(정범님 규칙)
- 웹앱 ❓ 설명서 '책방 친구' 항목에 §1 규칙 2·6·15·25~27을 그대로 옮기고(Loomis/anime 머리 모델 구분, 비틀림 실측 30° vs 과장, Live2D 30 = 실제 20°, LOD px 계산), 설정값 이름·기본값·범위를 표로 둔다.
- 캐릭터 카드 설정 시트에 `faceCurvatureK`·`twistMaxDeg`·`shade*`·`line*`·`rim*` 슬라이더를 추가(캐릭터 미세 수치는 전부 설정으로).

---

## 4. 합격 기준 제안 (자동 시험)

| 번호 | 시험 | 통과 조건 | 근거 |
|---|---|---|---|
| T-D1 | Loomis 머리 비례 | `headModel:"loomis"`에서 brow/H = 0.43±0.01, nose 0.71±0.01, hairline 0.14±0.02, sideOval.h/D = 0.667±0.01 | 규칙 1·2 |
| T-D2 | 머리 모델 분리 | 한 캐릭터 렌더에서 loomis·anime 상수가 동시에 참조되지 않음(정적 분석) | 규칙 2 |
| T-D3 | 척추 클램프 | 요청 twist 90° → 출력 45°(기본)/70°(과장), bendF 60 → 45, bendB 40 → 25 | 규칙 6 |
| T-L1 | 선 위계 | 렌더 SVG의 리본 폭 중앙값: outer 1.0, inner 0.5±0.05, detail 0.3±0.05(머리 ≥ 24 px); 머리 < 24 px에서 inner·detail 수 0 | 규칙 7·27 |
| T-L2 | 겹침 끊김 | 티어 경계 32쌍 샘플에서 뒤 윤곽 끝점과 앞 채움 사이 거리 = 1.0~1.5 선폭, 앞 윤곽은 연속(끊김 0) | 규칙 8 |
| T-L3 | 테이퍼 | 리본 양 끝 폭/w0 = 0.3±0.05, 끝점 폭 > 0.25 px(사라짐 없음) | 규칙 9 |
| T-S1 | 그림자 방향 | 각 부품 s1 무게중심 − 부품 무게중심 벡터와 −L의 내적 > 0(모든 부품, 모든 포즈 24개) | 규칙 10·applied 1 |
| T-S2 | 그림자색 | sh1 = base 대비 ΔH 4~14°(240° 쪽), ΔS 0~+12, ΔL −10~−20; sh2 L < sh1 L, |sh2 L − sh1 L| ≤ 10 | 규칙 14 |
| T-S3 | 피부 랩 | 피부 부품의 s1 면적 비율 = 옷 부품의 0.80~0.92(같은 폭 기준) | 규칙 12 |
| T-S4 | 림 위치 | rim path가 −L 쪽 실루엣 반구 안에만(빛 쪽 픽셀 0) 있고 폭 = 0.05±0.015 부품 폭 | 규칙 13 |
| T-H1 | 먼 눈 폭 | yaw 20°에서 먼 눈 bbox 폭/정면 폭 = 0.80±0.05, 가까운 눈 1.00~1.10, 눈 사이 0.80~0.85 | 규칙 15 |
| T-H2 | 시차 오라클 | yaw 20°에서 코 1.0 기준 입 0.85·눈 0.78·윤곽 0.3·귀 −0.4·뒷머리 −0.6 각 ±0.1 | 바이블 §3.7 |
| T-H3 | 피치 압축 | pitch −12°에서 눈~입 간격 0.85~0.90, 귀 밑 = 눈선 ±0.02 H | 바이블 §3.7 |
| T-H4 | 한 머리 한 각도 | 눈·코·입·턱·귀·머리카락의 yaw 입력값이 같은 프레임에서 동일(불일치 0) | 바이블 §3.7 규칙 |
| T-H5 | 연속성 | yaw 0→60° 1° 간격 렌더에서 부품 bbox 중심 이동 ≤ 0.02 HW/°, 윤곽 꼭짓점 점프 ≤ 0.01 HW(팝 없음) | 규칙 17 |
| T-R1 | IK softness | 목표가 최대 뻗음 ±softness 범위를 지날 때 팔꿈치 각속도 최대값 ≤ softness 0일 때의 40% | 규칙 18 |
| T-R2 | 물리 안정 | 탭 복귀(dt 2 s)에서 5스텝만 실행, 노드 진폭 ≤ 정상 최대의 1.2배 | notes_web §2-4 |
| T-P1 | 예산 | rnSvgBudget: paths ≤ 400, points ≤ 6000, filters ≤ 2, clips ≤ 16, bytes ≤ 130 KB | 규칙 20~23 |
| T-P2 | 프레임 시간 | CPU 4× 느리게 모드에서 갱신 함수 p95 ≤ 8 ms, longtask 0/60 s; 데스크톱 p95 ≤ 4 ms | 규칙 20·24 |
| T-P3 | 블러 정적 | 애니메이션 중 `stdDeviation` 속성 변경 횟수 0 | 규칙 22 |
| T-P4 | will-change | SVG 내부 요소에 will-change 0개, 래퍼 div 1개 이하 | 규칙 21 |
| T-O1 | LOD 문턱 | 머리 23 px: 손가락·속눈썹·쌍꺼풀 0개; 25 px: 손가락 5개·속눈썹 0; 61 px: 속눈썹·쌍꺼풀·홍채 고리 있음 | 규칙 27 |
| T-O2 | 최소 선폭 | 모든 리본 최소 폭 ≥ 1 CSS px(2 dppx면 0.75) | 규칙 25 |
| T-C1 | 대비 | line/base, iris/sclera, skin/cloth 3:1 이상; 말풍선 글자 4.5:1 | 규칙 28 |
| T-C2 | 팔레트 파생 | 캐릭터 시트에 저장된 색 = base + 예외만; sh1/sh2/line은 함수 출력과 일치 | 규칙 28·"한 곳에만" |

---

## 5. 출처 (접속일 모두 2026-10-29)

| 번호 | 제목 | 저자/기관 | URL | 신뢰도 |
|---|---|---|---|---|
| 1 | How to Draw the Head from Any Angle — 강의 노트 | Stan Prokopenko (Proko) | https://proko.com/course-lesson/how-to-draw-the-head-from-any-angle/notes | 높음 — 업계 표준 교재(Loomis 방법) 공식 강의 노트. 댓글 수치는 제외 |
| 2 | How to Draw the Head – Front View — 강의 노트 | Proko | https://proko.com/course-lesson/how-to-draw-the-head-front-view/notes | 높음 — 동일 |
| 3 | Loomis Method 가이드 | finearttutorials.com | https://finearttutorials.com/guide/loomis-method/ | 중간 — 2차 해설. 삼등분·눈 간격만 참고 |
| 4 | How to Simplify the Motion of the Torso – The Bean | Proko | https://proko.com/course-lesson/how-to-simplify-the-motion-of-the-torso-the-bean | 높음 — 공식 강의 본문 |
| 5 | How to Draw Structure in the Body – Robo Bean — 강의 노트 | Proko | https://proko.com/course-lesson/how-to-draw-structure-in-the-body-robo-bean/notes | 높음 — 공식 강의 노트(Hampton 계열 상자 모델) |
| 6 | Range of Motion Normative Values | Physiopedia (WikEM 인용) | https://www.physio-pedia.com/Range_of_Motion_Normative_Values | 중간 — 의료 위키, 출처가 WikEM 한 건. 흉요추 합산값만 있음 |
| 7 | How to Draw with Line Weight — 강의 노트 | Proko | https://www.proko.com/course-lesson/how-to-draw-with-line-weight/notes | 높음 — 공식 강의 노트, 수치는 없음 |
| 8 | Tips for Flawless Line Art in Clip Studio Paint | Clip Studio TIPS(공식) | https://tips.clip-studio.com/en-us/articles/8847 | 중간 — 제작사 공식 팁(수치 없음) |
| 9 | Starting and ending — Clip Studio Paint 사용 설명서 | CELSYS | https://help.clip-studio.com/en-us/manual_en/810_subtools/S.htm | 높음 — 도구 공식 문서(범위·기본값은 없음) |
| 10 | Cel shading 관련 기존 조사(Saarland CG1·Wikipedia·Strayspark) | — | research/drawing_cg/sources.md A3·B2·C3 | 기존 조사 그대로 |
| 11 | A Non-Photorealistic Lighting Model for Automatic Technical Illustration | Gooch et al., SIGGRAPH 1998 | https://users.cs.northwestern.edu/~bgooch/PDFs/gooch98.pdf | 높음 — 기존 조사 그대로 |
| 12 | GPU Gems Ch.16 Real-Time Approximations to Subsurface Scattering | NVIDIA (Simon Green) | https://developer.nvidia.com/gpugems/gpugems/part-iii-materials/chapter-16-real-time-approximations-subsurface-scattering | 높음 — 업계 표준 교재, 식·상수 명시 |
| 13 | 影色の作り方(아니메 塗り 그림자색) 공식 블로그 | CELSYS clipstudio.net | https://www.clipstudio.net/oekaki/archives/152709 | 중간 — 제작사 공식 블로그, 정성 규칙만 |
| 14 | Toon shader (Roystan 튜토리얼 코드 사본) | gist (bzgeb) | https://gist.github.com/bzgeb/bd6db50a9ca9b650d05727a8a8db1ac8 | 중간 — 널리 쓰이는 공개 튜토리얼의 코드 사본, 기본값 명시. 원문 roystan.net 미접속 |
| 15 | Computer method and apparatus for rotating 2D cartoons using 2.5D cartoon models (US 8,791,942) | Rivers, Igarashi, Durand (MIT/도쿄대) | https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/8791942 | 높음 — SIGGRAPH 2010 논문의 특허 원문 |
| 16 | 5. Adding XY Facial Movement — Cubism 튜토리얼 | Live2D Inc. | https://docs.live2d.com/en/cubism-editor-tutorials/xy/ | 높음 — 제작사 공식 |
| 17 | Animating Childlike Drawings with 2.5D Character Rigs (arXiv 2502.17866) | Smith et al. 2025 | https://arxiv.org/pdf/2502.17866v1 | 높음 — 학술 논문(2뷰 보간·깊이 정렬·부품 속성) |
| 18 | Warp Deformer / About Deformers / Parent-Child Hierarchy — Cubism 매뉴얼 | Live2D Inc. | https://docs.live2d.com/en/cubism-editor-manual/making-and-placement-of-warp-deformer/ · https://docs.live2d.com/en/cubism-editor-manual/deformer/ · https://docs.live2d.com/en/cubism-editor-manual/system-of-parent-child-relation | 높음 — 공식 매뉴얼 |
| 19 | Physics constraints — Spine User Guide | Esoteric Software | https://esotericsoftware.com/spine-physics-constraints | 높음 — 공식(기본값·적분식은 없음) |
| 20 | IK constraints — Spine User Guide | Esoteric Software | https://en.esotericsoftware.com/spine-ik-constraints | 높음 — 공식 |
| 21 | How to Use Deformers — Harmony 25 Premium | Toon Boom | https://docs.toonboom.com/help/harmony-25/premium/getting-started/deformation.html | 높음 — 공식 |
| 22 | Tutorial 3.3 Bone dynamics — Moho 매뉴얼 | Lost Marble | https://lostmarble.com/moho/manual/tut03/03/index.html | 높음 — 공식(예시 값 3세트) |
| 23 | Class M_Bone — Moho Scripting 레퍼런스 | mohoscripting.com | https://mohoscripting.com/classes/M_Bone | 중간 — 공식 API 문서 미러 |
| 24 | Mesh attachments — Spine User Guide | Esoteric Software | https://fr.esotericsoftware.com/spine-meshes | 높음 — 공식 |
| 25 | How performance heavy is Spine (포럼) | Esoteric 포럼(Nate 답변) | https://pt.esotericsoftware.com/forum/d/10938-how-performance-heavy-is-spine | 낮음 — 포럼, 600~800 정점은 사용자 의견 |
| 26 | Stick to Compositor-Only Properties and Manage Layer Count | web.dev (Google) | https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count | 높음 — 브라우저 제작사 공식 |
| 27 | Measure performance with the RAIL model | web.dev | https://web.dev/articles/rail | 높음 |
| 28 | Updates in hardware-accelerated animation capabilities | Chrome Developers | https://developer.chrome.com/blog/hardware-accelerated-animations | 높음 — Chromium 89 SVG 가속 명시 |
| 29 | will-change — CSS reference | MDN | https://developer.mozilla.org/docs/Web/CSS/will-change | 높음 |
| 30 | Re-rastering composited layers on scale change | Chrome Developers | https://developer.chrome.com/blog/re-rastering-composite | 높음 — Chrome 53 동작 명시 |
| 31 | Animating a blur | Chrome Developers | https://developer.chrome.com/blog/animated-blur/ | 높음 |
| 31b | Filter performance 설계 문서(Donner SVG 렌더러) | jwmcglynn | https://jwmcglynn.github.io/donner/md_docs_2design__docs_20014-filter__performance.html | 중간 — 오픈소스 구현 문서, 측정치 명시(CPU 경로) |
| 32 | www-svg: use element와 스타일 상속 비용 | Robert O'Callahan (Mozilla) | https://lists.w3.org/Archives/Public/www-svg/2009Sep/0026.html | 높음 — 브라우저 구현자 설명 |
| 33 | Reusing SVG icons for faster pages | dev.to (J. Eguiluz) | https://dev.to/javiereguiluz/reusing-svg-icons-for-faster-pages-62o | 낮음 — 사례 글(바이트 절감 사례만) |
| 34 | Analyze runtime performance — DevTools | Chrome Developers | https://developer.chrome.com/docs/devtools/performance | 높음 |
| 35 | [css-values-4] 기준 픽셀 정의 논의(원 사양 인용) | W3C 메일링 리스트 | https://lists.w3.org/Archives/Public/public-css-archive/2020Jun/0542.html | 중간 — 사양 원문(w3.org/TR) 차단, 인용문으로 확인(96 dpi·28 in·0.0213°) |
| 36 | Mobile display resolution: how far should you go | eeNews Europe | https://www.eenewseurope.com/en/mobile-display-resolution-how-far-should-you-go/ | 중간 — 업계지(1 arcmin·30 cm·300 ppi) |
| 37 | Retina display | Wikipedia | https://en.wikipedia.org/wiki/Retina_display | 보조 — 시청 거리(폰 25~30 cm, 태블릿 38 cm)·PPD 환산 |
| 38 | Monk Skin Tone Scale | Wikipedia(Google 연구 요약) | https://en.wikipedia.org/wiki/Monk_Skin_Tone_Scale | 중간 — 10단계 hex 명시, 원 자료(skintone.google) 미접속 |
| 39 | Understanding SC 1.4.11 Non-text Contrast | W3C WAI | https://w3c.github.io/wcag21/understanding/non-text-contrast | 높음 — 표준 |
| 40 | Bug 1348607 — SVG benchmark 4× slower than Chrome | Mozilla Bugzilla | https://bugzilla.mozilla.org/show_bug.cgi?id=1348607 | 중간 — 500 path/프레임 사례 |
| 41 | SVG Benchmarks (2008) | David Dailey (SRU) | https://srufaculty.sru.edu/david.dailey/Benchmarks.htm | 낮음 — 오래된 50개 단위 측정 |

---

## 6. 근거를 못 찾은 것 (솔직하게)

1. **Loomis 옆면 깎음의 '깊이'(공 폭 대비 얼마나 평평하게)** — 타원 높이(2/3 D)와 위치는 있으나, 정면에서 타원 폭(깎인 깊이)의 수치는 어떤 출처도 주지 않음. 엔진은 "정면 폭 = HW(바이블 §2.2)"로 두고 옆면 폭은 yaw로만 바뀌게 함.
2. **Hampton/Bridgman 몸통 상자의 수치 비율·휴식 자세 기울기** — Proko 두 강의 모두 "길이·각도가 중요, 정확한 모서리는 덜 중요"라며 수치를 주지 않음. 바이블 §2.2·§1.5 표를 그대로 씀. Hampton 원저는 저작권 자료라 내려받지 않음.
3. **흉추·요추 분리 가동 범위** — 찾은 출처는 흉요추 합산값만. 분배(골반 30/허리 40/가슴 30)는 바이블 값 유지.
4. **선 굵기 비율·테이퍼 길이·끊김 간격의 수치** — Proko·Clip Studio 모두 정성 규칙만(세 단계, 굵은 바깥/가는 안쪽). 표의 배율(1.4/0.5/0.3, 테이퍼 20%·최소 30%, 끊김 1.25 선폭)은 제안값.
5. **그림자색 HSL 이동 수치** — 제작사 공식 글도 "조금"으로만 말함. 수치는 관행 범위(기존 조사 +0.05~0.12)와 맞춘 제안.
6. **Live2D AngleX 30이 실제 몇 도인지** — 공식 문서는 "약 30°"라고도 하지 않음. '실제 20°' 매핑은 눈 위치각 기하 계산으로 만든 제안(먼 눈 75~85% 관행과 맞도록).
7. **Spine 물리의 기본값과 적분식** — 공식 가이드·타입 선언 모두 기본값 없음, 소스 파일은 차단. 우리 물리는 Verlet(기존 조사) 유지.
8. **Toon Boom의 z-순서(Position Z·nudge) 규칙, Live2D 변형기 중첩 깊이 권장, Material 아이콘 선폭 규칙** — 문서가 차단되거나 해당 내용 없음.
9. **SVG path 수·점 수의 정량 한계** — 공개 벤치마크는 오래됐거나 사례 수준. 예산(400 path·6,000점)은 Spine 정점 관행과 블러 비용에서 유추한 제안. 실제 값은 T-P2 측정으로 정한다.
10. **휴대폰에서 인라인 SVG 자식 요소의 transform이 합성 레이어를 받는지** — Chrome 블로그는 "SVG 애니메이션 가속(89+)"만 말하고 JS로 속성을 바꾸는 경우는 명시하지 않음. 그래서 전체 이동은 래퍼 div로, 내부는 측정(T-P2)으로 판단.
11. **안드로이드 dp = 1/160 in 정의** — 사양 지식으로만 씀(원문 미접속).

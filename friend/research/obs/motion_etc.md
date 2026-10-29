# 관찰 보고 — 움직임·동작·포즈 (motion_etc · 39장)

- 그림 폴더: /home/claude/readnow-chats/mascot/refs/ · 기존 노트: research/notes_00~09.md
- 원본 크기로 한 장씩 열어 봄(webp는 PIL로 png 변환, 세로로 긴 튜토리얼은 3등분·2배 확대, 작은 스캔은 3~4배 확대, 치수는 50px 격자를 덧씌워 잼). 변환·격자 파일은 scratchpad/conv_motion/ 에만 둠.
- 표기: H = 머리 높이(정수리~턱). "약"은 눈대중, 숫자만 쓴 것은 격자로 잰 값(±5%).
- **중요 발견: 끝 9장(9c186b45·2183bc13·8bf763c5·071abaa4·d8fc9ea0·06b69111·1674536d·8a03d048·5259c9b0)은 그림 참고가 아니라 리드나우 로거 PC·웹앱·알라딘 샵매니저 화면 캡처**임(10/23~10/25). 그중 5259c9b0에는 실제 주문자 이름·이메일 일부가 보임 → mascot/refs 에서 빼서 다른 곳(예: readnow-chats/screens/)으로 옮기기를 제안(이 보고에서는 개인정보를 옮겨 적지 않음).

---

## 요약 규칙

1. **서기(콘트라포스토)의 기울기 부호는 반대** — 무게 발 쪽 골반이 올라가고(약 7~8°), 같은 쪽 어깨는 내려간다(약 5~6°). 어깨선 기울기와 골반선 기울기는 항상 반대 부호, 각각 5~12°. 머리는 높은 어깨 쪽으로 2~5° 기울어 균형. [근거: 661e8241 그림7 실측 어깨 5.5°·골반 7.5°, e3b03194 "TWIST + TILT", 7fd7bff1 뒷모습]
2. **추선(plumb line) 검사** — 목 아래(흉골 윗점, 턱 아래 약 1H)에서 수직선을 내리면 한 발 서기는 무게 발 위, 두 발 서기는 두 발 사이에 떨어져야 한다. 어긋나면 넘어지는 그림. 몸이 밖으로 나가면(팔 뻗기 등) 반대쪽이 그만큼 보상(엉덩이·반대 팔). [근거: e74246be, 6674b2b6 실측 — 다리 든 자세에서 디딤발이 추선 위로 이동, 디딤 다리는 안쪽으로 약 10° 기울고 몸통은 디딤발 쪽으로 약 5° 기울음]
3. **'전봇대' 원인 = 세 선이 모두 수평·수직** — 어깨선 0°, 골반선 0°, 몸통 중심선 직선, 두 발 대칭, 두 팔 똑같이 늘어짐. 어깨·골반 중 하나라도 기울이고(≥5°), 중심선을 C/S 곡선으로, 두 발 간격·발끝 각을 다르게, 한 팔이라도 10~20° 굽히면 사라진다. [근거: 661e8241 8인, b6fbef88 "Start with a gesture line", 28f15491(기존)·6c9583a4 "relaxed arm bends slightly"]
4. **걷기 접촉 프레임(측면)** — 앞발 뒤꿈치~뒷발 뒤꿈치 = 약 2.0H ≈ 키의 0.37~0.40배 ≈ 다리 길이의 0.7배(5.5H 아니메 소녀 기준). 앞발은 뒤꿈치만 닿고 발끝 15° 들림, 뒷발은 발끝만 닿고 뒤꿈치 0.3~0.35H 들림. 앞 무릎 거의 폄(≈175°), 뒷무릎 약 150°. 팔은 같은 쪽 다리와 반대로 수직에서 ±15~22°. 몸통은 거의 수직(앞으로 0~8°). [근거: 2e0c9942 격자 실측, c98418d8 뒷발 뒤꿈치 0.3H, b6fbef88 걷기 패널]
5. **걷기 통과 프레임** — 디딤 다리 수직으로 곧게, 몸 높이 최고(이 참고서들은 0.03~0.1H만 올림 — 일상 걸음은 튀지 않음), 지나가는 발 지면에서 0.1H 띄움·무릎 30° 굽힘, 팔은 수직 ±5°. 통통 튀는 걸음(아이·기쁨)은 무릎을 골반 높이까지 올리고 몸을 0.2H 이상 띄운다. [근거: 2e0c9942 중간 프레임, 46c074b0 주황 꼬마 '튀는 걸음', 7f34f112(AI·참고만) 0.1H 상하동]
6. **걸음에 성격을 싣는 변수는 5개** — ① 몸통 기울기(자신감 뒤로 10° / 급함·몰래 앞으로 30°) ② 걸음 길이(활보 = 다리 길이 1배, 소심 = 0.3배) ③ 무릎 높이(행진·기쁨 = 골반 높이, 지침 = 발끝 끌기) ④ 팔 흔들기(활보 = 크게 ±40°, 주머니·슬픔 = 0) ⑤ 머리 높이(기쁨 = 턱 올림, 슬픔 = 턱이 어깨선 아래). 같은 뼈대(회색 마네킹)에 이 5개만 바꿔 13가지 걸음을 만든 시트. [근거: 46c074b0 — 색 실루엣마다 옆에 같은 자세의 마네킹을 붙여 '뼈대는 같고 변수만 다름'을 보여줌]
7. **동적 동작의 3단: 예비 → 본동작 → 정착** — 예비 동작은 본동작의 **반대 방향**으로 간다(팔꿈치 뒤로 치기 전에 팔을 앞으로 내밀며 10° 앞으로 숙임; 점프 전 'WIND UP' 웅크림은 키의 약 60%까지 낮춤; 춤의 CLOSED 포즈 = 팔다리 접고 머리 숙임 → OPEN 포즈 = 몸 세우고 팔다리 길게 머리 들기). [근거: 9e4916c1 ①~④, 9570464f "WIND UP → LAUNCH → A LEAP OF FAITH", f9008054 "CLOSED poses are often ANTICIPATORY for an OPEN"]
8. **비틀기 한계** — 몸통(갈비뼈 vs 골반) 45~70°, 머리(vs 어깨) 70~90°, 다리/발 50~90°+. 합치면 발과 머리가 정반대를 볼 수 있다. "KEEP TWIST UNDER 70°". 갈비뼈·골반은 강체, 늘어나고 접히는 것은 배·허리뿐(접히는 쪽 주름 1~2개, 늘어나는 쪽 한 줄 곡선). [근거: 8bc43f63·1785c8a9 "45–70 / 70–90 / 50/90+ DEGREES", e3b03194 "SOLID / SOFT / SOLID"]
9. **돌아보기 순서 = 머리 → 가슴 → 골반** — 머리가 먼저 돌고 몸통이 따라온다("TORSO FOLLOWS HEAD", 4단계 그림). 비행 중 방향 전환도 "머리가 먼저 새 방향을 본다". 애니메이션에서는 머리·가슴·골반을 각각 지연시켜 돌린다. [근거: e3b03194 ①~④, 9570464f "HAVE THEIR HEAD TURN TO LOOK IN THE NEW DIRECTION FIRST"]
10. **옷·머리카락은 지나온 방향을 가리킨다(2차 동작)** — 느슨한 옷은 "캐릭터가 있었던 곳(BEEN)"을 보여 주므로 치마·머리카락·코트 자락은 현재 이동 방향의 반대로 흐른다. 같은 포즈라도 옷 흐름 방향을 바꾸면 다른 동작이 된다. 달릴 때 치마 밑단은 수평이 아니라 진행 반대쪽으로 15~30° 올라가는 각진 물결(3~5파). [근거: f9008054 "LOOSE CLOTHING shows SECONDARY MOTION… where your character has BEEN", d26b7efd "ANGLE AWAY ✓ / NOT STRAIGHT ✗", fca3f769]
11. **달리기** — 몸통 앞기울기 10~25°(기울수록 빠름), 뒷다리 무릎 90° 접고 뒤꿈치가 엉덩이 쪽, 앞다리 무릎 골반 높이, 팔꿈치 90°, 팔 흔들기 방향이 바뀌는 순간 그쪽 어깨가 0.1H 올라감. 정면 달리기는 다가오는 다리 허벅지를 50~70%로 줄이고 발을 1.3~1.6배 키움. [근거: b546baab "THE MORE LEAN… THE FASTER", "SHOULDERS LIFT WHEN ARM SWING IS AT POINT OF DIRECTION CHANGE", fca3f769 주인공]
12. **공중·무중력 포즈** — 모든 관절을 20~40° 부드럽게 굽히고(잠긴 관절 없음), 발끝 내리고(발목 30° 폄), 팔은 몸에서 30~60° 띄움. 'PUSH'(밀려남 = 사지 위로 접히고 몸 C자로 말림·의도치 않음) / 'PULL'(끌려감 = 사지 뒤로 끌리고 머리 숙임·의도적·깨끗한 S선) 중 먼저 정하기. 땅을 떠난 그림은 반드시 바닥 그림자 타원을 두고, 그림자와 발 사이 거리로 높이를 말한다. [근거: 9570464f·5a6ebe29, 8a9297f6, e74246be "FIGURES THAT HAVE LEFT THE GROUND CAST SHADOWS! HOW HIGH?", 87192ca2 점프 그림자 ≈ 0.3H 아래]
13. **동작선(line of action)은 한 줄 C 또는 S** — 우아한 도약·비행·춤은 머리~척추~뒷다리까지 끊기지 않는 곡선 하나. 어색한 동작 = 꺾인 직선들. 손·발 각도는 팔·다리 곡선을 그대로 이어야(손목 꺾어 선을 연장, 발끝 뻗어 다리 선 연장) 한다. [근거: 9570464f "A CLEANER THROUGH-LINE", 863dd475(머리→몸통→뒷다리 C자), f9008054 "USE THE ANGLES OF THE HANDS… FEET, TOO!"]
14. **뒤 팔다리는 선 끊기(line break)로 앞뒤를 만든다** — 몸 뒤로 가는 팔다리는 몸 윤곽에 닿기 전 2~4px 끊는다. SVG에서는 뒤 팔다리를 먼저 그리고 앞 형태에 배경색 외곽선(halo)을 준다. [근거: e74246be "LINE BREAK GIVES CLARITY"]
15. **싸움·힘 자세** — 발 간격 3.5H(어깨너비 약 1.6~1.8배), 골반 0.4H 낮춤, 앞 무릎 140°·뒷무릎 120°, 앞 주먹은 머리 크기(1.0H)로 뒤 주먹(0.65H)의 1.5배(원근 과장), 어깨를 귀 쪽으로 올려 목 40% 짧게(긴장). 힘은 비틀림에서 나온다: 상체와 하체가 다른 방향을 본다(30~45°). [근거: c8ad9c90 격자 실측, 9e4916c1 "drawing the upper body and lower body facing different directions will generate the look of a powerful strike"]
16. **다리 가동 범위** — 고관절(X)을 중심으로 무릎은 반지름 = 허벅지 길이(≈1.4H), 발은 반지름 = 다리 길이(≈2.7~3.0H)인 동심원 호 위를 움직인다. 앞/옆 들기 90°까지는 몸통 수직, 90° 넘으면 몸통을 반대로 15~20° 기울임, 뒤로 뻗기는 20~30°뿐(더 뒤로 보이려면 몸통을 앞으로 숙임), 무릎 굽힘 0~150°(뒤꿈치가 엉덩이에 닿음), 발목 등쪽 90°, 선 발은 바깥 30°. [근거: 6674b2b6 실측, e7c1d9fe, c336e6f9, c7ce4784 "A/B", 2e0c9942 "90° angle / 30° angle"]
17. **한 다리 들면 디딤발이 중심선으로 들어오고 든 쪽 골반이 올라간다** — 두 발 모아 선 상태에서 한 무릎을 들면 디딤발이 정중선(격자 세로선) 위로 이동, 든 다리 쪽 엉덩이가 위로 기운다. 앞으로 든 허벅지는 원형에 가깝게 단축되고 무릎 원이 그 앞에 겹친다. [근거: 0c0b78f3 3열×4단, 6674b2b6]
18. **실루엣만으로 포즈가 읽혀야 한다** — 팔이 몸 안에 겹치면 "HARD TO READ", 팔을 몸 밖으로 빼서 빈 공간(negative space)을 만들면 "READS EASILY". 손은 몸에 붙이지 말고 손끝은 허벅지 중간(가랑이 아래 0.5H). [근거: 6c9583a4(기존)·661e8241 손끝 위치]
19. **여성 교복 포즈의 '소심/귀여움' 코드** — 무릎 붙이고 발끝 안쪽(안짱 X다리, 무릎 닿고 발목은 발 너비 하나 벌림), 양손을 앞에서 모으고 어깨 안으로, 몸 살짝 앞으로. 반대로 '활발' = 한 다리 뒤로 차올림(무릎 90°), 팔을 머리 위로 뻗기, 가방 한쪽 어깨에. 치마 밑단은 골반선과 평행하게 기울고 움직이는 쪽으로 15° 더 퍼짐. [근거: c98418d8 10인, 2e0c9942 "twist inward"]
20. **장난꾸러기·에너지 포즈 = 비대칭·각지게** — 팔다리 각각 다른 각도, 무릎 굽힘, 한 발 이상 땅에서 뗌, 몸통 15~30° 기울기, "ADD LOTS OF BOUNCE AND SPRING". 점프 정점은 팔 V·다리 V의 별 모양. [근거: 87192ca2]

---

## 그림별 관찰

### c8ad9c90 (331×572 · 싸움 자세 · 소년 만화 남성)
- 글: 없음.
- 실측(격자): 머리 H≈85px(모자 제외). 두 발 간격 300px = **3.5H**; 골반 중심 (165,255); 앞 주먹 85px(≈1.0H), 뒤 주먹 55px(0.65H) → 1.55배; 앞 무릎 ≈140°, 뒷무릎 ≈120°; 전체 높이 560px ≈ 6.6H(서면 약 7H → 골반 ≈0.4H 낮춤). 어깨가 귀 쪽으로 올라 목이 거의 안 보임.
- 동작선: 뒷발(60,470) → 골반(165,255) → 머리(150,65)로 거의 수직인 축에, 앞 주먹이 축에서 직각으로 튀어 나감. 시선·주먹·앞발이 모두 오른쪽 → 방향 통일.
- 적용: 우리 캐릭터 '의욕·도전' 포즈에 발 간격 3H 이상, 골반 0.3~0.4H 낮춤, 앞 손을 뒤 손의 1.5배.
- 기존 노트와 다른 점: 기존 "2.7 head-widths apart, 1.6× shoulder" → H 단위로 3.5H로 보정, 골반 낮춤 0.6H → 0.4H로 보정(전체 높이 비교로 계산).

### 863dd475 (1080×1080 · 키 비주얼 · 공중 돌진)
- 글: 배경 "USOPP" 반복(이름뿐).
- 관찰: 머리(650,200) → 가슴(720,330) → 골반(800,480) → 뒤로 뻗은 다리(650,650~400,950)로 **C자 동작선 하나**; 머리는 옆모습, 골반은 3/4 정면 → 머리-골반 비틀림 약 70°(한계치). 가까운 부츠 밑창 ≈320px, 얼굴(턱~이마) ≈150px → 가까운 발 = 머리의 약 2배 이상, 먼 부츠 ≈250px. 쥔 손 ≈1.4H. 입은 턱 30° 벌림, 외침.
- 적용: 다가오는 동작은 가까운 손발을 2배까지 키워도 됨(만화 원근). 공중 그림은 몸의 어느 부위도 수직·수평이 없게.
- 기존 노트와 다른 점: 비틀림 각(≈70°)과 C자 동작선 추가.

### a4188d3e (520×1136 · 눈·눈썹 9쌍 · 중국 무협 게임 문파별)
- **분류 정정: 움직임이 아니라 눈/눈썹 주제**(목록에 잘못 들어옴). 글: 天策·万花·纯阳·明教·五毒·少林·丐帮·唐门·藏剑(문파 이름뿐, 설명문 없음).
- 움직임 관점에서 쓸 것 하나: 눈동자의 위치(가운데/옆/반쯤 감김)만으로 '시선 방향·경계'가 바뀜 — 丐帮(옆을 봄)·唐门(반쯤 감김). 나머지는 눈 주제 보고에 맡김.
- 기존 노트와 다른 점: 없음(기존 노트가 충분).

### 7fd7bff1 (397×256 · 「全身ポーズ図鑑（立ち）/（踊る）」 · 3배 확대해도 본문 판독 불가)
- 글: 제목 「全身ポーズ図鑑(立ち)」「(踊る)」, 탭 「全身」. 파란 라벨은 흐려서 후ろ姿·振り向き·腕組み / ダンス①·②·決めポーズ 로 추정(기존 노트와 같음).
- 관찰: (立ち) 뒷모습 — 무게 발 쪽 엉덩이 높음, 발 간격 ≈ 어깨너비; 돌아보기 — 머리 90° 돌림 + 손을 가슴에; 팔짱 — 어깨 수평, 발 벌림. (踊る) ダンス① 한 다리 뒤로 들고(무릎 90°) 팔 안으로, 발 뒤에 움직임 호선; ダンス② 다리 교차 스텝·골반 흔들림; 決めポーズ 몸 30° 숙이고 한 손 무릎·한 손 허리.
- 적용: '돌아보기'는 머리 90° + 손 가슴 조합이 표준. 춤 결정 포즈는 '숙임 + 양손 비대칭'.
- 기존 노트와 다른 점: 없음. 본문은 끝내 판독 불가(확인 안 됨).

### 9e4916c1 (456×673 · "Elbow Strike Torsion" · 여성 레오타드)
- 글(그대로): "The elbow strike is delivered by twisting the torso. Therefore, drawing the upper body and lower body facing different directions will generate the look of a powerful strike." / ① ② "The figure leans forward slightly." ③ "The wrist rolls back." ④ "The key is to draw the elbow thrusting to the body's rear." "The arm swings back, while the upper body rises."
- 실측(2배 확대): ① 중립 — 발 간격 ≈0.3H, 몸통 수직; ② **예비** — 몸통 앞으로 10°, 무릎 굽힘, 팔을 **앞으로** 내밀고 다른 손 주먹을 허리에; ③ 전환 — 손목이 뒤로 말림(손바닥 위); ④ **본동작** — 팔꿈치를 뒤로 쏘며 상체 세움, 앞발이 한 걸음 나가 발 간격 ≈1.2H, 몸통 둘레 나선 화살표(비틀림), 점선 수직선이 머리를 지나 앞발 위에 떨어짐(추선 유지).
- 적용: 예비 동작은 본동작의 반대 방향, 크기는 본동작의 약 1/3(앞기울기 10° vs 뒤로 치기 30°+). 강한 동작 뒤 추선이 앞발 위에 오도록.
- 기존 노트와 다른 점: 예비→본동작의 방향 반대·크기 비 추가, 발 간격 0.3H→1.2H 추가.

### 969fcb13 (435×604 · 「両手を挙げる動き」「腕を前後に出す動き」 p.133)
- 글: 기존 노트에 전문 있음(「寄りジワを作る主要な線は、左右3本ずつくらいです」「袖のシワは腕の方向に向かって引っ張られて生まれます」「山ジワは引っ張る動きで生まれます」).
- 움직임 관점 관찰: 두 팔 올리기 = 팔이 수직에서 ±15° V자, 팔꿈치 거의 폄, 셔츠 밑단 0.3H 올라가 배 보임; 팔 앞/뒤 내밀기 = 소매 주름이 팔 방향으로 늘어남(산 주름 2~3개).
- 적용: 만세·기지개 프레임에서 윗옷 밑단을 0.2~0.3H 올리고 주름은 겨드랑이에서 좌우 3줄.
- 기존 노트와 다른 점: 팔 각도(±15°)·밑단 상승량 추가.

### 661e8241 (736×1028 · 제스처 마네킹 8인 · 남성 7.5~8H)
- 글: 없음.
- 실측 그림7(손 허리 · 2배 크롭): H≈115. 어깨선 — 손 허리 쪽 어깨가 18px 높음 → **약 5.5°**; 골반선 — 무게 발 쪽 골반이 20px 높음 → **약 7.5°**(반대 부호). 추선: 목 아래(110) → 무게 발(100~160) ✔. 자유 다리는 옆으로 뻗어 발 사이 ≈1.9H. 머리는 높은 어깨 쪽으로 약 3° 기울음. 손끝 = 가랑이 아래 0.5H.
- 그림2(다리 교차): 무게 발 수직, 교차 발은 발끝만 닿음, 머리 10° 기울임, 팔 10~15° 굽힘.
- 그림8(싸움): 앞 주먹 어깨 높이, 몸통 vs 골반 30° 비틀림.
- 적용: 콘트라포스토 기본값 = 골반 7°·어깨 5°·머리 3°(모두 다른 방향으로 번갈아).
- 기존 노트와 다른 점: 기존 "hip tilt ~12°, shoulder lower" → 실측 7.5°/5.5°로 보정, 머리 기울기 추가.

### c98418d8 (236×354 · 여고생 10포즈 · 4배 확대)
- 글: 없음.
- 관찰: 약 6~6.5H. 윗줄: ① 걷기(가방 어깨) — 앞발 뒤꿈치 접촉, 뒷발 발끝, 뒤꿈치 0.3H 들림, 보폭 길어 보이는 패션 걸음(뒤꿈치~발끝 ≈2H); ② 정면 서기 양손 앞; ③ 가방 들고 3/4; ④ 뒷모습 돌아보기(머리 옆모습, 몸통 3/4 뒤); ⑤ 옆으로 걸으며 돌아봄. 아랫줄: ⑥ 뒷모습 양팔 머리 위(블라우스 올라감); ⑦ 머리 손질(한 손 뒤통수, 팔꿈치 밖); ⑧ **양손 가방 앞 모음 + 무릎 붙이고 발끝 안쪽 + 몸 앞으로** = 소심/귀여움; ⑨ 한 다리 뒤로 차올림(무릎 90°, 몸통 반대로 10° 기울임, 팔 밖); ⑩ 양팔 머리 위에서 손목 잡기(기지개). 치마 밑단은 골반과 평행, 움직이는 쪽으로 15° 더 퍼짐.
- 적용: 우리 캐릭터 '수줍음' = ⑧ 코드, '신남' = ⑨·⑩ 코드.
- 기존 노트와 다른 점: 10포즈 각각의 조합 코드와 ⑧의 안짱 X다리 수치(무릎 닿고 발목은 발 너비 하나) 추가.

### b6fbef88 (386×518 · "How to Draw Model Poses" 9패널)
- 글: 기존 노트에 전문. 핵심 인용 "Start with a gesture line to show the flow." "Use simple shapes (ovals, cylinders, boxes)." "Think about proportions, balance and direction."
- 관찰(2배): 모든 패널이 같은 뼈대(머리 타원·갈비 달걀·골반 상자·관절 원)이고 관절 각만 바꿈 — 리그 방식. 걷기 패널: 앞발 뒤꿈치 접촉, 뒷발 발끝, 팔 ±20°, 골반이 앞다리 쪽으로 돌아감. 돌아보기: 척추가 비틀린 S, 어깨선 기울어짐. 앉아 숙이기: 척추 C, 팔꿈치 무릎, 턱 손. 기지개: 손 깍지 정수리 위 ≈1H.
- 적용: 캐릭터 설정 시트도 ① 제스처선 → ② 단순 형태 → ③ 다듬기 세 겹으로 저장하면 포즈 추가가 쉽다.
- 기존 노트와 다른 점: 없음.

### 2e0c9942 (495×619 · Anime Art Academy · 다리 가동 + 걷기)
- 글: "90° angle" "30° angle" "Leg centerline" "twist inward"(×2) "A" "1~6" "Anime Art Academy".
- **걷기 실측(4배 크롭)**: 그림 높이 525px, H(머리카락 포함)≈100 → 약 5.3~5.5H. 접촉 프레임: 뒤꿈치~뒤꿈치 **195px ≈ 2.0H ≈ 키의 0.37배 ≈ 다리 길이(280px)의 0.7배**. 앞발 뒤꿈치 닿고 발끝 15° 들림, 뒷발 뒤꿈치 35px(≈0.35H) 들림. 앞 무릎 ≈175°, 뒷무릎 ≈150°. 가까운 팔: 어깨(195,215)→손(140,350) = 수직에서 **22° 뒤로**(앞다리와 반대). 몸통 거의 수직. 통과 프레임: 디딤 다리 수직, 머리 3px(≈0.03H)만 올라감, 지나는 발 지면 위 ≈0.1H, 팔 거의 수직. 화살표 1 뒷발 뒤꿈치 들림 → 2 앞으로 휘둘러 → 3 뒤꿈치 착지 → 4 지면 → 5 뒤꿈치 들림 → 6 휘두름. **왼쪽·오른쪽 프레임은 같은 접촉 포즈**(반 주기만 그린 시트).
- 적용: 우리 걷기 키프레임 수치로 그대로 사용(규칙 4·5).
- 기존 노트와 다른 점: 기존은 순서만 적음 → 보폭·팔 각·뒤꿈치 높이·상하동 수치 추가, 좌우 프레임이 동일 포즈임을 명시.

### 0c0b78f3 (720×1280 · 무릎 들기 3단×4열)
- 글: 없음.
- 관찰: 열1 두 발 모음(정중선 격자 위에 좌우 대칭) → 열2 무릎 뒤로 접음(정면에서 정강이 사라짐, 발이 뒤) → 열3 허벅지 45° 들고 정강이 수직 → 열4 허벅지 수평·관객 쪽(허벅지 = 원형 단축, 무릎 원이 앞에 겹침). **열2부터 디딤발이 정중선(x=격자선)으로 이동**, 든 쪽 골반이 올라가 골반선이 기움. 무릎 원 지름 ≈ 허벅지 폭 0.55.
- 적용: 한 발 들기 애니 = ① 디딤발을 중심선으로 슬라이드(2~3프레임) → ② 무릎 올리기. 순서를 바꾸면 넘어지는 그림.
- 기존 노트와 다른 점: 디딤발 이동이 열2에서 이미 시작됨을 추가.

### e7c1d9fe (399×501 · Anime Art Academy · 다리 호)
- 글: 로고만.
- 관찰: 마네킹 다리 0°/45°/90°/135°(앞), 180° 옆 찢기(손으로 발 잡음). 90° 넘는 옆차기에서 몸통이 차는 다리 반대로 약 20° 기울고 팔은 양옆으로 벌림. 아라베스크: 디딤 다리 수직, 뒷다리 90°, 몸통 앞으로 30°. 치어리더·발레 모두 디딤발이 목 아래 추선 위.
- 적용: 다리를 90° 넘게 들면 몸통 보상각 15~20° 필수.
- 기존 노트와 다른 점: 없음.

### 6674b2b6 (600×600 · 마네킹 추선 + 다리 호)
- 글: 없음(점·X·호·화살표).
- 실측: H=80, 키 465px → **5.8H**. 추선 시작점 y=275 = 턱 아래 1H(흉골). 선 자세: 추선이 두 발 사이. 든 자세: 추선이 디딤발(320,575) 위; 고관절 X(365,315)와 디딤발 x 차 45px → 디딤 다리 안쪽 **약 10° 기울음**; 머리 중심 x320 vs 골반 x340 → 몸통 디딤발 쪽 약 5°. 든 다리: X→발목(490,140) = 수직에서 35° = 바닥에서 145° 들림. 호 반지름: 무릎 110px ≈ **1.4H**, 발 215~240px ≈ **2.7~3.0H**. 든 다리 쪽 팔은 발 쪽으로, 반대 팔은 수직 위.
- 적용: 추선 시작점을 '턱 아래 1H'로 코드화. 한 발 서기 보상: 디딤 다리 10° + 몸통 5°.
- 기존 노트와 다른 점: 추선 시작 위치, 디딤 다리 기울기 10°, 호 반지름 H 단위 추가.

### c336e6f9 (768×403 · "Learning about legs… part 1")
- 글: 제목만.
- 관찰: 마네킹 다리 0°/45°(무릎 굽혀 정강이 수직)/90°/≈160°(손으로 잡은 수직 찢기). 가운데 소녀: 디딤 다리 수직, 든 다리 쪽 팔 위, 반대 손이 무릎. 오른쪽 킥: 몸통 뒤로 15°, 치마가 허벅지 따라 뒤집힘, 호가 발을 지남.
- 적용·차이: 기존 노트와 같음. 보탤 것 — 킥 정점에서 치마가 허벅지 선을 따라 '뒤집혀' 안감이 보이는 것이 허용됨(우리 캐릭터는 긴 치마라 뒤집힘 금지 → 대신 밑단이 호를 따라 들림).

### c7ce4784 (1024×538 · "…part 2")
- 글: "A"(초록, 무릎 위치 호) "B"(빨강, 뒤꿈치→엉덩이) 제목.
- 관찰: 왼쪽 소녀 — 다리 뒤로 차올림(무릎 90°), 몸통 앞으로 15°, 팔 양옆 수평, 치마 퍼짐, 발 호의 잔상(시작 위치 유령선). 측면 마네킹: 고관절 뒤로 폄 ≈30°뿐, 무릎 접어 뒤꿈치가 엉덩이에.
- 적용: '뒤로 차기' 프레임은 고관절 30° + 무릎 90~150°로 만들고, 더 뒤로 보이려면 몸통을 앞으로.
- 기존 노트와 다른 점: 없음.

### 9570464f (792×1554 · Etherington #309/#310 "Flying & Levitating" A/B)
- 글: 기존 노트에 전문. 추가로 읽은 라벨: "WE'RE LOOSENING LIMBS, LEANING BACK INTO IT"(의자 앉은 자세 → 같은 자세로 공중에 뒤로 30° 더 기움 / 문 앞에 선 자세 → 뒤로 20° 기울고 다리 끌림), "WIND UP"(웅크림) → "LAUNCH"(대각선 뻗기) → "A LEAP OF FAITH"(완전 신전), "MORE OF A RUNNING JUMP THAN A TAKE-OFF", "LEAN BACK AS IF IN AN ACCELERATING VEHICLE", "NOT QUITE IN CONTROL!", "ELBOWS BACK", "LEG BENT AS IF ABOUT TO PUSH OFF", "LOW ANGLE SHOTS HELP TO REMIND US WE'RE UP HIGH!".
- 관찰(수치): 'WIND UP' 웅크림 높이 ≈ 선 키의 60%; 'LAUNCH' 몸통 45° 대각; 'PUSH' 포즈는 사지가 위로 접혀 몸이 C(배 쪽으로 말림), 'PULL' 포즈는 머리 뒤로 젖히고 다리 뒤로 끌려 역C; 호버링은 척추 수직·팔꿈치 뒤·한 무릎 90°. 망토·옷은 이동 반대 방향.
- 적용: 우리 '둥실 떠서 기뻐하기' = PULL형(머리 뒤로 10°, 발끝 폄, 팔 45° 벌림), '놀라서 떠오름' = PUSH형(C자 말림). 점프 3단 비율: 예비(웅크림 0.6키) → 본(1.1키 신전) → 정점.
- 기존 노트와 다른 점: 앉기/서기 → 부유 변환 각도(20~30°), 웅크림 60% 수치 추가.

### 46c074b0 (383×1385 · Etherington #359 "Walks" A)
- 글: 기존 노트와 같음("YOUR CHARACTER'S WALK IS SUCH A HUGE PART OF HOW YOU COMMUNICATE THEIR PERSONALITY…").
- 관찰(3분할 2배): 13가지 걸음, 각 색 실루엣 옆에 **같은 포즈의 회색 마네킹** → 뼈대 동일, 변수만 다름. 분류:
  | 걸음 | 몸통 | 보폭 | 무릎 | 팔 | 머리 |
  |---|---|---|---|---|---|
  | 활보(초록 키다리) | 뒤로 10°, 가슴 펴기 | 다리 길이 1배 | 보통 | ±40° 크게 | 수평·턱 들림 |
  | 급함(초록 여성 런지) | 앞으로 30° | 1.2배 | 앞 무릎 깊이 굽힘 | 앞뒤 크게 | 앞으로 |
  | 풀 죽음(주황 주머니) | 앞으로 15°, 어깨 말림 | 0.4배 | 낮음 | 0(주머니) | 턱이 어깨선 아래 |
  | 행진·신남(주황 여성) | 수직 | 0.6배 | 골반 높이 | 팔꿈치 90° 위아래 | 턱 들림 |
  | 쿵쿵(초록 남성 다리 벌림) | 앞으로 10° | 1배, 발 바깥 | 굽힘 | 주먹 쥐고 굽힘 | 숙임 |
  | 깡충(초록 고양이귀) | 좌우 흔들 | 짧음 | 한 발 공중 | 손 펴고 위 | 들림 |
  | 캣워크(주황 여성) | 수직, 골반 10° 흔들 | 0.8배, 발 한 줄 교차 | 폄 | 몸에 붙임 | 턱 들림 |
  | 분노(초록 사각머리) | 앞 5°, 어깨 올림 | 0.9배 | 굽힘 | 주먹, 짧게 | 숙임 |
  | 몰래(초록 웅크림) | 앞으로 60°(거의 수평) | 0.8배, 발끝 | 90° | 몸 앞에 | 앞으로 |
  | 살금(주황 작은 공) | 앞 20° | 0.3배 발끝 | 굽힘 | 몸에 모음 | 숙임 |
  | 튀는 꼬마(주황) | 수직 | 짧음 | 둘 다 높이 | 위로 | 들림 |
- 적용: 우리 캐릭터 감정별 걸음 5개(기본·신남·풀죽음·급함·살금)를 위 표 변수로 리그 값만 바꿔 만든다.
- 기존 노트와 다른 점: 기존 6종 설명 → 11종 변수표로 확장, '뼈대 같고 변수만 다름' 구조 명시.

### e74246be (383×1363 · Etherington #140 "Stick Figures" B)
- 글: 기존 노트와 같음. 핵심 인용 "PLUMB LINE RUNS FROM THE BASE OF THE NECK DOWN TO WHICHEVER LIMB(S) SUPPORT THE WEIGHT", "THE FURTHER THE CENTRE OF BALANCE IS OUT, THE MORE THE BODY HAS TO COMPENSATE", "LINE BREAK GIVES CLARITY!", "FIGURES THAT HAVE LEFT THE GROUND CAST SHADOWS! HOW HIGH?".
- 관찰: 추선 그림 9개 — 한 발 서기는 선이 디딤발 위, 두 발은 사이, 앞으로 기운 몸은 뒤로 뻗은 팔·엉덩이로 'COUNTER'. 웅크린 그림 3단계: 끊김 없음(OKAY) → 뒤 팔 끊음(LINE BREAK) → BETTER. 점프 그림 2개: 그림자가 발 아래 떨어진 거리(점선)로 높이 표시. 마지막 동작선 시트: 모든 포즈에 파랑/빨강 C·S 선 하나.
- 적용: 규칙 2·12·14.
- 기존 노트와 다른 점: 없음.

### 5a6ebe29 (383×1410 · #309 세로 1열판 · 9570464f와 글 동일)
- 글: 동일 + 푸터 "TUTORIALS BOOKS COMING TO KICKSTARTER MAY 2022 · SEND 'ADD ME, LORENZO!'…"(광고).
- 관찰: 큰 그림이라 자세히 보임 — 의자 앉기(팔걸이 잡음, 무릎 90°) → 부유(같은 관절각, 몸 전체 뒤로 30°, 손 떼고 팔 벌림). 'PUSH' 영웅: 머리 앞으로 숙임, 팔꿈치·무릎 접힘, 망토 구김 / 'PULL' 영웅: 머리 뒤로, 척추 S, 망토가 한 줄로 흐름.
- 적용: 부유 변환 = 관절각 유지 + 몸 전체 회전 20~30° + 손을 지지물에서 뗌.
- 기존 노트와 다른 점: 변환 수치 추가(중복 그림이라 그 외 없음).

### e3b03194 (383×1385 · Etherington #848 "Twisting Poses" B)
- 글: 기존 노트와 같음("THE RIBCAGE AND PELVIS ARE SOLID…", "TWIST ALONE / TWIST + TILT", "TORSO FOLLOWS HEAD", "IT CAN BE SUBTLE", "PICTURING A SHEET OF FABRIC WITH OVERLAP…").
- 관찰(수치): 상자 모형 — 갈비 상자 높이 : 부드러운 허리 : 골반 상자 ≈ 1.5 : 0.4 : 1. 'TWIST + TILT' 그림에서 상체가 옆으로 30° 기울며 비틀림 → 접히는 쪽 허리에 주름 2개. ①~④ 돌아보기: ① 정면 → ② 머리 45° → ③ 머리 90°·어깨 20° → ④ 머리 90°·어깨 45°. 훌라후프 그림: 머리·갈비·골반·다리·발이 교대로 다른 방향(알록달록 상자).
- 적용: 규칙 8·9. 돌아보기 애니 키: 머리 2프레임 선행, 가슴 2프레임 뒤, 골반 2프레임 더 뒤(프레임 수는 그림 근거 없음 — 순서만 근거).
- 기존 노트와 다른 점: 상자 비율, ①~④ 각도 추가.

### 8a9297f6 (383×1368 · Etherington #699 "Characters Underwater" A)
- 글: 기존 노트와 같음("LOW GRAVITY" POSES, "PUSH" OR "PULL", "KEEPING THE LIMBS FLUID", "SEATED POSES WORK WELL UNDERWATER").
- 관찰: 모든 마네킹이 관절 20~40° 굽힘, 머리카락 위로 뜸, 몸 전체가 한 곡선(파랑/분홍 화살). 앉은 포즈를 그대로 물속에 — 무릎 90°·팔 벌림.
- 적용: 규칙 12와 같음(물속 = 부유의 동의어).
- 기존 노트와 다른 점: 없음.

### 9b934c6b (383×1390 · Etherington "Long Skirts" B)
- 글: 기존 노트와 같음(① INTERNAL VOLUME INCREASES ② HEMLINE VISUALLY BROADENS ③ LARGER/FEWER PIPE FOLDS ④ HEMLINE LIFTS, "FIGURE OF EIGHT", "FOR GENTLE MOVEMENT, THE HEMLINE WILL BECOME A CURVE", "SPINNING… CLOSER TO THE CIRCLE SHAPE", 바람 ①~④, 앉기 라벨).
- 관찰(수치): 걷는 소녀의 밑단이 한 개의 호(진행 방향 쪽 낮고 뒤쪽이 치마 길이의 약 0.2~0.3 올라감); 빠른 회전 시 밑단이 골반 높이까지 올라가 물결 가장자리; 바람 ①~④ = 다리 한쪽에 붙고(다리 윤곽 보임) 반대쪽으로 부풀음.
- 적용: 우리 캐릭터(긴 치마) 돌기 프레임: 회전 속도에 따라 밑단 높이 0(정지)→0.3(걷기)→1.0(빠른 회전, 골반 높이), 파이프 주름 수 9→5.
- 기존 노트와 다른 점: 밑단 들림 비율 수치화.

### fca3f769 (383×1401 · Etherington #938 "Running in Skirts" B)
- 글: 기존 노트와 같음("TILT THEM LIKE A RINGING BELL", "FIGURE OF EIGHT / ANGLED TRIANGLE", "PLEATED SKIRTS: SIDE / 3/4 BEHIND / FRONT", "GATHERED IN THE HANDS", "CREASES DO THIS", "DIVIDE INTO THREE SECTIONS").
- 관찰(수치): 주인공 달리기 — 몸통 앞으로 15°, 뒷다리 무릎 90°, 앞 무릎 골반 높이, 종 모양 치마가 15~20° 뒤로 기울어 뒷밑단 올라감. 세 구역: 1 앞 허벅지에 붙는 앞판, 2 옆 부풀음, 3 뒤로 끌리는 뒷판. 긴 치마를 손으로 모으면 주름이 손에서 방사.
- 적용: 우리 캐릭터 달리기 = 세 구역 치마 + 종 기울기 15°.
- 기존 노트와 다른 점: 몸통·무릎·치마 기울기 수치 추가.

### 8bc43f63 (792×1570 · Etherington #847/#848 "Twisting Poses" A/B 2열판)
- 글: 기존 노트에 전문("FOR MOST PEOPLE THE TORSO CAN ROTATE BETWEEN 45 – 70 DEGREES", "THE HEAD… 70 – 90 DEGREES", "LEG/FOOT ROTATES 50/90+ DEGREES", "KEEP TWIST UNDER 70°", "IMAGINE A CENTRE LINE ON BOTH THE FRONT AND BACK").
- 관찰: 위에서 본 도형 — 어깨선 vs 골반선 70° 부채꼴, 머리 70°, 발 50°/90°. 뼈대 앞/뒤 중심선 그림 5개: 비틀면 앞 중심선이 S, 뒤 중심선이 반대 S. 상자 3단계(FRONT/REAR).
- 적용: 규칙 8.
- 기존 노트와 다른 점: 없음(A판은 기존과 동일).

### b546baab (792×1586 · Etherington #871/#872 "Characters Running Towards You" A/B)
- 글: 기존 노트와 같음("IT HELPS TO IMAGINE IN PROFILE", "PERSPECTIVE BOXES / HOOPS", "THE TORSO WILL BOTH LEAN AND TWIST", "ANGLE OF THE LANDING LEG: IN / OUT / STRAIGHT", "THE MORE LEAN WE GIVE THE POSE, THE FASTER THE RUN FEELS", "SHOULDERS LIFT WHEN ARM SWING IS AT POINT OF DIRECTION CHANGE", "FORESHORTENED SHOES / SHOES FROM BENEATH").
- 관찰(수치): 정면 달리기 — 다가오는 허벅지 50~70% 단축, 신발 밑창이 보이며 발 1.3~1.6배; 몸통 앞기울기 10°(보통)→25°(전력). 착지 다리 각 IN(안짱)·OUT·STRAIGHT 세 종류로 성격 차이. 손 모양 6종(펼침·주먹·칼손).
- 적용: 규칙 11.
- 기존 노트와 다른 점: 없음.

### d26b7efd (792×1570 · Etherington #937/#938 "Running in Skirts" A/B)
- 글: 기존 노트와 같음("TWO FORCES… FLOWS BACKWARDS… DRIVEN UP BY THE MOTION OF THE LEGS", "DON'T GUESS — SKETCH THE FULL FIGURE FIRST", "SKETCHING RIBBONS", "THICKER MATERIALS FORM CURVED BULGES", "AN ANGLED WAVE IN THE HEMLINE… NOT STRAIGHT ✗ ANGLE AWAY ✓").
- 관찰(수치): 밑단 물결 3~5파, 진행 반대쪽으로 15~30° 상승; 두 힘 화살표 — 뒤로 흐름 + 다리가 위로 밀어 올림(앞판이 앞 무릎 위로 올라감).
- 적용: 규칙 10.
- 기존 노트와 다른 점: 없음.

### f9008054 (447×447 · Etherington #372 "Dancing" B · 2배 분할)
- 글: 기존 노트에 전문. 다시 확인한 인용 "CLOSED poses are often ANTICIPATORY for an OPEN, and can work as a VISUAL BUILD-UP", "REPEAT SHAPES", "USE THE ANGLES OF THE HANDS TO CONTINUE THE SHAPE LANGUAGE OF THE POSE. FEET, TOO!", "LOOSE CLOTHING shows SECONDARY MOTION, meaning it shows us where your character has BEEN… TWO STAGES of the dance AT THE SAME TIME!", "ONE PIECE OF CLOTHING CAN GIVE THE SAME POSE DIFFERENT DIRECTIONAL MOVEMENT!", "THE FACIAL EXPRESSION IS SO IMPORTANT TO THE POSE — IT BRINGS IT TO LIFE!"
- 관찰(수치): CLOSED — 몸통 앞으로 40°, 팔꿈치·무릎 90° 안으로, 머리 숙임, 높이 ≈ 선 키의 65%; OPEN — 몸통 수직~뒤로 5°, 팔다리 폄, 머리 들림. 같은 소녀 3인: 치마 없음 / 긴 치마가 왼쪽으로 흐름 / 짧은 치마가 오른쪽으로 퍼짐 → 세 가지 다른 이동 방향으로 읽힘. 손목·발끝이 팔다리 곡선 연장(점선 반복 형태).
- 적용: 규칙 7·10·13. 우리 '기쁨 춤' 2키: CLOSED(65% 높이) → OPEN(105%).
- 기존 노트와 다른 점: CLOSED/OPEN 높이 비 추가.

### 87192ca2 (383×1393 · Etherington #1022 "Gremlins" B)
- 글: 기존 노트와 같음("RASCALLY ENERGY — make poses ERRATIC and LIVELY", "ANGULAR, PEPPY POSES", "ADD LOTS OF BOUNCE AND SPRING").
- 관찰(수치): 점프 정점 — 팔 V(수직에서 30°), 다리 V(30°), 몸 공중, 그림자 타원이 발 아래 ≈0.3H; 달리는 그렘린 — 몸통 30° 앞, 한 발 뒤로; 뒤로 넘어가는 그렘린 — 몸 전체 역C.
- 적용: 규칙 20. (귀 모양 등 생물 디자인은 우리 사람 캐릭터와 무관.)
- 기존 노트와 다른 점: 점프 별 모양 각도·그림자 거리 추가.

### 1785c8a9 (792×792 · Quick Tip "Twisting Poses")
- 글: 기존 노트와 같음(45–70 / 70–90 / 50/90+).
- 관찰: 여성 전신 — 머리 상자·갈비 상자·골반 상자·발 상자가 각각 다른 회전(머리 왼쪽, 골반 오른쪽), 앞 중심선이 S. 발과 머리가 정반대(빨간 원 2개).
- 적용: 규칙 8.
- 기존 노트와 다른 점: 없음.

### 7f34f112 (896×1152 · AI 생성 스프라이트 시트 · 참고만)
- 글: 워터마크 "stablediffusionweb.com".
- 관찰: 2·3행 = 걷기 8프레임(한 행 8장), 4행 = 달리기 12장(머리카락·코트가 수평 뒤로), 5행 = 뒷모습 걷기 8장. 걷기 접촉 프레임 발 간격 ≈0.8H(이 시트는 보폭이 작음), 상하동 ≈0.1H. **AI 오류 많음**(다리 길이·발 모양·팔 길이 프레임마다 다름) → 수치는 쓰지 말고 '8프레임 걷기·12프레임 달리기 배치'라는 구성만 참고.
- 적용: 스프라이트 시트 배치 형식(행 = 동작, 열 = 프레임)만.
- 기존 노트와 다른 점: 없음.

### 9c186b45 · 2183bc13 · 8bf763c5 · 071abaa4 · d8fc9ea0 · 06b69111 · 1674536d · 8a03d048 · 5259c9b0 (기존 노트 없음 · **그림 참고 아님**)
- 분류: 전부 **리드나우 운영 화면 캡처**(2026-10-23~25).
  - 9c186b45: 로거 PC — 알라딘 wgate 로그인 팝업("19세 이상 이용할 수 있는 상품입니다. 로그인해주세요.") + 작업 기록 창 + Claude 채팅(로거 멈춤 보고).
  - 2183bc13: 로거 PC — 리드나우 로컬 도우미 1.8.4(연결 고르기·휴대폰 테더링 설정) + 수집기 LOGGER v1.89.47 상품·매입 탭.
  - 8bf763c5: 로거 PC — Google 로그인 화면(readnow-3a385.firebaseapp.com으로 이동) + 도우미 창.
  - 071abaa4: 다른 PC — "리드나우 공개 수집" 시작 페이지(127.0.0.1:8899/start, Tampermonkey 설치 안내 4단계).
  - d8fc9ea0: HOME PC — 샵매니저 wrecord_edit + 수집기 HOME v1.89.67 '일시정지됨' 개요(멈춘 작업 5개).
  - 06b69111 · 8a03d048: 로거 PC — wgate 메인 + 작업 기록(mySwiper is not defined 오류 2건) + Chrome 프로필 팝업.
  - 1674536d: HOME PC — 웹앱 상품 등록 화면(문구 도우미 ①구성·표시 ②상태 ③마무리, 미등록 상품 정보).
  - 5259c9b0: 샵매니저 판매관리 '주문확인요청' 1건 + 수집기 HOME v1.89.133 — **주문자 이름·이메일 일부가 보임(개인정보)**.
- 가르치는 것: 캐릭터 그리기와 무관. 바이블에 넣지 않음.
- 제안: 이 9장은 mascot/refs 에서 분리(예: readnow-chats/screens/2026-10/)하고 5259c9b0는 비공개 유지. (이 보고에서는 파일을 옮기지 않았음.)

---

## 바이블 v2 질문에 대한 답

### 1. 걷기·달리기 키프레임
- **접촉(contact)** [2e0c9942 실측, c98418d8, b6fbef88]: 뒤꿈치~뒤꿈치 ≈2.0H(5.5H 몸) = 키 0.37~0.40 = 다리 길이 0.7. 앞다리 무릎 175°(거의 폄)·앞발 뒤꿈치 접촉·발끝 15° 들림; 뒷다리 무릎 150°·발끝 접촉·뒤꿈치 0.3~0.35H 들림. 팔: 앞다리 반대쪽 팔이 앞으로, 수직에서 ±15~22°, 팔꿈치 10~15° 굽힘. 몸 높이 최저(통과보다 0.03~0.1H 낮음). 머리 수평, 몸통 0~8° 앞.
- **내림(down/recoil)** — 그림 근거 없음(이 묶음에는 접촉·통과만 있음). 통과 직전 디딤 무릎이 가장 굽는 프레임으로 접촉보다 0.05~0.1H 더 낮게 두는 것이 관행(일반 지식).
- **통과(passing)** [2e0c9942]: 디딤 다리 수직 곧게, 몸 최고, 지나는 발 지면 0.1H·무릎 30°, 팔 수직 ±5°.
- **올림(up/high)** — 그림 근거 없음. 통과 뒤 뒤꿈치 들며 몸이 더 올라가는 프레임(일반 지식 0.1~0.15H 상승).
- **걸음 길이**: 2.0H(패션·일상), 소심 0.6H, 활보 2.5~3H(다리 길이 1배) [46c074b0 변수표].
- **한 걸음 프레임 수(24fps)**: 그림 근거 없음. 일반 관행 — 보통 걸음 12프레임/걸음(2코마 작화 6장), 급한 걸음 8, 느린 걸음 16. 달리기 6~8프레임/걸음.
- **남/여/꼬마/노인 차이**: 그림에 있는 것만 — 여성 캣워크: 발을 한 줄에 교차, 골반 10° 흔들, 팔 몸에 붙임 [46c074b0]; 꼬마: 무릎 둘 다 높이, 몸 튐, 팔 위 [46c074b0 주황 꼬마]; 남성 활보: 가슴 펴고 뒤로 10°, 팔 ±40° [46c074b0]. 노인: 그림 근거 없음(풀 죽은 걸음 — 어깨 말림·보폭 0.4배·턱 아래 — 를 느리게 쓰면 됨).
- **달리기** [b546baab, fca3f769, 7f34f112 참고]: 몸통 10~25° 앞, 뒷다리 무릎 90°, 앞 무릎 골반 높이, 팔꿈치 90°, 방향 바뀌는 팔 쪽 어깨 0.1H 상승, 머리카락·치마 수평 뒤로.

### 2. 정적 포즈
- 자연스러운 서기 [661e8241 실측, 6674b2b6, e74246be]: 무게 발 쪽 골반 +7°, 같은 쪽 어깨 −5°, 머리 높은 어깨 쪽 +3°, 몸통 중심선 C, 추선(턱 아래 1H에서) 무게 발 위, 자유 다리 발 간격 0.3~1.9H(발끝 바깥 20~30°), 팔은 10~20° 굽혀 손끝 가랑이 아래 0.5H, 몸과 팔 사이 0.15H 틈.
- 팔의 쉼 위치: 늘어뜨림(손바닥 허벅지 쪽) / 한 손 허리(손등을 장골에, 팔꿈치 밖) / 팔짱(아랫팔 가슴 아래, 어깨 수평) / 손 뒤통수 / 양손 앞 모음 [661e8241, c98418d8, 7fd7bff1].
- 앉기 [b6fbef88, 9b934c6b]: 숙여 앉기 = 척추 C·팔꿈치 무릎·턱 손; 다리 꼬기 = 위 허벅지가 아래 무릎 위, 종아리 수직; 긴 치마 앉기 = 무릎이 유일한 긴장점, 무릎~무릎 팽팽한 면 + 방사 주름.
- 기대기 [b6fbef88 5]: 엉덩이가 벽/대에 닿고 몸통 뒤로 15°, 한 다리 앞으로 뻗어 추선 보상.
- 개성 요소: 고개 기울기(3~10°), 손 위치(허리/뒤통수/모음/주머니), 발 벌림(소심 = 안짱 X·무릎 닿음, 자신감 = 어깨너비 1.5배 바깥 20°) [c98418d8, c8ad9c90, 2e0c9942].
- '전봇대' 원인: 어깨 0°+골반 0°+중심선 직선+좌우 대칭+팔 완전 폄 → 규칙 3.

### 3. 동적 동작
- 예비→본동작→지나침→정착: 그림이 주는 것은 **예비의 방향(반대)과 크기** — 팔꿈치 치기 예비 = 앞으로 10° 숙임+팔 앞으로(본동작 30°+ 뒤로)의 약 1/3 [9e4916c1]; 점프 예비 웅크림 = 키의 60%(본동작 신전 110%) [9570464f]; 춤 CLOSED 65% → OPEN 105% [f9008054]. **지나침(overshoot)·정착 프레임 수는 그림 근거 없음**(일반 관행: 지나침 본동작의 5~10%·2~3프레임, 정착 4~6프레임).
- 손 흔들기·돌기: 그림 근거 없음(돌기는 e3b03194의 머리→가슴→골반 순서만 근거).
- 놀람 뒤로 젖힘: 9570464f 'PUSH' 역C(머리 앞으로 숙이며 사지 접힘)와 5a6ebe29 의자→부유 30° 뒤기울기가 유사 근거. 수치: 뒤로 20~30°.
- 동작선 휨: 활보·도약 = 척추 C 한 줄(호 높이 약 0.5H), 비틀림 추가 시 S [9570464f, 863dd475, e74246be]. 
- 스미어·잔상·효과선: 잔상 = 시작 위치를 '유령선(연한 선)'으로 남김 [c7ce4784 왼쪽 소녀 발], 움직임 호선 = 발 뒤에 호 1~2개 [7fd7bff1 ダンス①, 2e0c9942 화살표], 강조선 = 머리 위 짧은 선 3개(놀람) [e74246be 첫 그림, 9570464f]. 스미어 프레임 자체는 그림 근거 없음.

### 4. 아니메 타이밍(2코마·3코마·홀드·늦게 따라감)
- 코마·홀드: **그림 근거 없음**(이 묶음은 모두 정지 포즈 시트). 일반 관행만 — 일상 동작 2코마(12fps), 빠른 동작 1코마, 정지는 홀드 8~24프레임.
- 늦게 따라감(2차 동작): 근거 있음 — 옷·머리는 현재 이동 반대 방향(지나온 곳)을 가리킴 [f9008054, 9570464f, d26b7efd]. 프레임 수는 근거 없음(관행: 머리카락·치마 2~4프레임 지연, 정지 후 2~3번 작은 진동).

### 5. 캐릭터끼리 상호작용
- **근거 없음** — 39장 중 두 캐릭터가 서로 반응하는 그림이 없음.

### 6. 끝 9장 분류
- 위 '그림별 관찰' 마지막 항목: 전부 리드나우 운영 화면 캡처, 바이블 무관, 5259c9b0 개인정보 포함.

### 7. 그림 속 글이 가르치는 규칙 전부(이 묶음)
1. "The elbow strike is delivered by twisting the torso… upper body and lower body facing different directions" — 힘 = 상하체 반대 방향 [9e4916c1]
2. "The figure leans forward slightly." → "The wrist rolls back." → "elbow thrusting to the body's rear… upper body rises." — 예비·전환·본동작 3단 [9e4916c1]
3. "90° angle"(발목 등쪽) "30° angle"(선 발 바깥) "twist inward" [2e0c9942]
4. "Learning about legs and their natural range of movement" A=무릎 호, B=뒤꿈치→엉덩이 [c336e6f9, c7ce4784]
5. "Start with a gesture line… simple shapes… proportions, balance and direction… details at the end" [b6fbef88]
6. 「寄りジワ… 左右3本ずつ」「袖のシワは腕の方向に」「山ジワは引っ張る動き」 [969fcb13]
7. "YOUR CHARACTER'S WALK IS… HOW YOU COMMUNICATE THEIR PERSONALITY… easy to fall into the habit of drawing all your characters walking in the same way" [46c074b0]
8. "THE CORE OF ANY POSE IS BALANCE… PLUMB LINE… FROM THE BASE OF THE NECK DOWN TO WHICHEVER LIMB(S) SUPPORT THE WEIGHT" / "THE FURTHER THE CENTRE OF BALANCE IS OUT, THE MORE THE BODY HAS TO COMPENSATE" / "IF WEIGHT IS DISTRIBUTED BETWEEN LIMBS, PLUMB LINE COMES DOWN BETWEEN LIMBS" / "LINE BREAK GIVES CLARITY" / "FIGURES THAT HAVE LEFT THE GROUND CAST SHADOWS! HOW HIGH?" [e74246be]
9. "WEIGHTLESSNESS… LOOSENING LIMBS, LEANING BACK INTO IT" / "'PUSH' OR 'PULL'" / "LIMBS BENT UP, FIGURE CURLED" vs "LIMBS DRAGGING BEHIND, FEET POINTED, HEAD DROOPING" / "UNINTENTIONAL… INTENTIONAL" / "WIND UP → LAUNCH → A LEAP OF FAITH" / "LEAN BACK AS IF IN AN ACCELERATING VEHICLE" / "KEEP YOUR CHARACTER'S POSES AERODYNAMIC" / "HOVERING… RELAXED AND BALANCED, BUT… READY TO SPRING" / "HEAD TURN TO LOOK IN THE NEW DIRECTION FIRST" / "LOW ANGLE SHOTS HELP TO REMIND US WE'RE UP HIGH" [9570464f, 5a6ebe29]
10. "TORSO 45–70°, HEAD 70–90°, LEG/FOOT 50/90+°" / "KEEP TWIST UNDER 70°" / "CENTRE LINE ON BOTH THE FRONT AND BACK" / "RIBCAGE AND PELVIS AS BLOCKS" [8bc43f63, 1785c8a9]
11. "ALTERNATE OR MIX TWIST DIRECTIONS BETWEEN THE HEAD, TORSO, PELVIS, LEGS AND FEET" / "RIBCAGE AND PELVIS ARE SOLID… STRETCH AND COMPRESSION… FROM THE STOMACH AND LOWER BACK" / "EXAGGERATED BY ADDING BEND OR TILT" / "TORSO TWIST IS OFTEN A SECONDARY ACTION… TORSO FOLLOWS HEAD… IT CAN BE SUBTLE" / "SHEET OF FABRIC WITH OVERLAP" [e3b03194]
12. "'LOW GRAVITY' POSES… KEEPING THE LIMBS FLUID… WATER SMOOTHS OUT POSES" / "GESTURAL LINES CAN MORE DIRECTLY TRANSLATE INTO YOUR FINAL DRAWING" / "SEATED POSES WORK WELL UNDERWATER" [8a9297f6]
13. 긴 치마 운동 4특성 "INTERNAL VOLUME INCREASES / HEMLINE VISUALLY BROADENS / LARGER-FEWER PIPE FOLDS / HEMLINE LIFTS" / "FIGURE OF EIGHT" / "GENTLE MOVEMENT → HEMLINE… A CURVE" / "SPINNING… CLOSER TO THE CIRCLE" / "WIND… PULLED ACROSS THE LEGS AND THEN BILLOW OUT ON THE OPPOSITE SIDE" / "SITTING… THE KNEES BECOME THE MAIN TENSION POINT" [9b934c6b]
14. "HOOP SKIRTS… TILT THEM LIKE A RINGING BELL" / "FIGURE OF EIGHT → ANGLED TRIANGLE" / "VERY LONG SKIRTS MAY BE GATHERED IN THE HANDS… CREASES DO THIS" / "DIVIDE INTO THREE SECTIONS" [fca3f769, d26b7efd]
15. "TWO FORCES… FLOWS BACKWARDS… DRIVEN UP BY THE MOTION OF THE LEGS" / "DON'T GUESS — SKETCH THE FULL FIGURE FIRST" / "SKIRTS ARE NOT FLAT… RIBBONS" / "THICKER MATERIALS FORM CURVED BULGES" / "AN ANGLED WAVE IN THE HEMLINE… NOT STRAIGHT / ANGLE AWAY" [d26b7efd]
16. "IT HELPS TO IMAGINE IN PROFILE" / "PERSPECTIVE BOXES / HOOPS / CYLINDER-BASED SKETCHES" / "TORSO WILL BOTH LEAN AND TWIST" / "ANGLE OF THE LANDING LEG: IN / OUT / STRAIGHT" / "THE MORE LEAN… THE FASTER THE RUN FEELS" / "SHOULDERS LIFT WHEN ARM SWING IS AT POINT OF DIRECTION CHANGE" [b546baab]
17. "CLOSED / OPEN… CLOSED poses are often ANTICIPATORY for an OPEN" / "REPEAT SHAPES" / "ANGLES OF THE HANDS… CONTINUE THE SHAPE LANGUAGE… FEET, TOO" / "LOOSE CLOTHING shows SECONDARY MOTION… where your character has BEEN… TWO STAGES… AT THE SAME TIME" / "ONE PIECE OF CLOTHING CAN GIVE THE SAME POSE DIFFERENT DIRECTIONAL MOVEMENT" / "FACIAL EXPRESSION… BRINGS IT TO LIFE" [f9008054]
18. "RASCALLY ENERGY… ERRATIC and LIVELY… ANGULAR, PEPPY POSES… ADD LOTS OF BOUNCE AND SPRING" [87192ca2]
19. 「全身ポーズ図鑑（立ち）（踊る）」 — 제목만(본문 판독 불가) [7fd7bff1]
20. 문파 이름 9개(설명 없음) [a4188d3e] · "USOPP"(이름) [863dd475] · "stablediffusionweb.com"(워터마크) [7f34f112]

---

## 합격 기준 제안(자동 시험용)

측정은 리그의 관절 좌표(정면/측면)로 한다. H = 머리 높이.

### 정적 서기
- S1 어깨선 각 θs와 골반선 각 θp: `sign(θs) == -sign(θp)`, `5° ≤ |θp| ≤ 12°`, `3° ≤ |θs| ≤ 8°` (두 발 균등 서기만 예외: 둘 다 0~2°). [661e8241, e3b03194]
- S2 추선: 턱 아래 1.0H 점에서 내린 수직선 x가 — 한 발 서기: 디딤발 발바닥 x범위 안 / 두 발 서기: 두 발 사이. 허용 오차 ±0.1H. [e74246be, 6674b2b6]
- S3 전봇대 검사: `|θs| + |θp| + (몸통 중심선 최대 편차/H × 100) ≥ 8` 이고 좌우 발끝 각 차 ≥ 10° 또는 발 간격 ≥ 0.3H. 셋 다 0이면 실패. [661e8241, b6fbef88]
- S4 팔: 쉬는 팔 팔꿈치 각 160~170°(완전 폄 180° 금지), 손끝 y = 가랑이 + 0.4~0.6H, 팔 안쪽과 몸통 틈 ≥ 0.1H. [6c9583a4, 661e8241]
- S5 머리 기울기: 높은 어깨 쪽으로 2~10°(반대쪽이면 '당당' 포즈로만 허용). [661e8241]
- S6 한 발 들기: 디딤발 중심 x = 몸 중심선 ±0.1H, 디딤 다리 안쪽 기울기 5~12°, 든 쪽 골반 +5° 이상. 90° 넘게 들면 몸통 반대 기울기 15~20°. [0c0b78f3, 6674b2b6, e7c1d9fe]

### 걷기
- W1 접촉: 뒤꿈치 간 거리 1.8~2.2H(기본)·0.5~0.8H(소심)·2.5~3.0H(활보); 앞 무릎 170~180°, 뒷무릎 140~155°; 앞발 뒤꿈치 y = 지면, 발끝 10~20° 들림; 뒷발 뒤꿈치 0.25~0.4H 들림. [2e0c9942, c98418d8]
- W2 팔: 같은 쪽 다리와 반대 위상, 진폭 ±15~22°(기본), ±35~45°(활보), 0~5°(주머니·슬픔). [2e0c9942, 46c074b0]
- W3 통과: 디딤 무릎 ≥175°, 디딤 다리 수직 ±3°, 지나는 발 지면 위 0.05~0.15H, 몸 높이 접촉보다 +0.03~0.1H(튀는 걸음은 +0.2H 이상). [2e0c9942, 46c074b0]
- W4 성격 변수가 기본값과 ≥2개 달라야 '다른 걸음'으로 인정(몸통 기울기·보폭·무릎 높이·팔 진폭·머리 높이). [46c074b0]

### 달리기
- R1 몸통 앞기울기 10~25°, 뒷다리 무릎 80~100°, 앞 무릎 y ≤ 골반 y + 0.2H, 팔꿈치 80~100°. [b546baab, fca3f769]
- R2 방향 바뀌는 팔 쪽 어깨 y가 반대 어깨보다 0.05~0.15H 높음. [b546baab]
- R3 정면 달리기: 다가오는 허벅지 길이 = 기준의 50~70%, 발 길이 1.3~1.6배. [b546baab]
- R4 치마·머리카락 벡터 · 이동 벡터 < 0(반대 방향), 밑단 기울기 15~30°, 물결 3~5파. [d26b7efd, f9008054]

### 동적 동작
- D1 예비 동작 방향 벡터 · 본동작 벡터 < 0(반대), 예비 크기 = 본동작의 25~40%(각도 기준), 점프 예비 웅크림 높이 = 선 키의 55~65%. [9e4916c1, 9570464f, f9008054]
- D2 동작선: 머리 중심–가슴–골반–뒷발 네 점의 최소제곱 직선에서 최대 편차 0.3~0.8H(C/S 곡선), 0.1H 미만이면 '뻣뻣' 실패(힘·뛰기·춤 포즈에 한함). [9570464f, 863dd475]
- D3 비틀림: |갈비 회전 − 골반 회전| ≤ 70°(자연 30~45°), |머리 − 어깨| ≤ 90°, 발 ≤ 90°. [8bc43f63]
- D4 돌아보기 순서: 머리 회전 시작 프레임 < 가슴 < 골반. [e3b03194]
- D5 공중: 모든 관절 굽힘 20~40°(0° 또는 90° 고정 금지), 발목 폄 ≥25°, 바닥 그림자 타원 존재, 그림자–발 거리로 높이 표시. [9570464f, 8a9297f6, e74246be]
- D6 손·발 연장: 손목 꺾임 방향 = 팔 곡선 접선 ±20°, 발끝 = 다리 선 ±20°(춤·점프). [f9008054]
- D7 실루엣: 검정 실루엣만으로 팔 2·다리 2가 분리돼 보임(팔이 몸통 실루엣 안에 완전히 들어가면 실패). [6c9583a4]
- D8 힘 자세: 발 간격 ≥ 3H, 골반 낮춤 0.3~0.5H, 가까운 손 : 먼 손 = 1.4~1.6. [c8ad9c90]

### 그림 묶음 정리
- X1 mascot/refs 의 9장 화면 캡처는 참고 그림 집합에서 제외(테스트에서 '그림 아님' 태그). 5259c9b0는 개인정보 포함.

# 인체 비교 이미지

2026-11-16. 모든 결과는 **검토 중인 시안**이다. 기본형과 얼굴의 완성도는 아직 부족하며 사용자 승인을 받지 않았다.

- `adult-anime-target-v1.png`: imagegen 기본 도구로 만든 보조 기준 그림. 웹앱의 회전 모델이 아니다. 남성 근육의 강한 분절, 여성 가슴 윗선의 둥근 경계, 표기 등신과 실제 측정 차이를 수정 과제로 남겼다. 후속 수정 요청은 이미지 도구의 안전 판정으로 생성되지 않았다.
- `runtime-v7-before-after.png`: 같은 카메라·팔레트로 렌더한 6차/7차 모델의 정면·사선·측면.
- `runtime-v7-chest-study.png`: 성인 여성형의 가슴 9개 연구 형태. 완성된 체형 카탈로그가 아니다.
- `runtime-v7-chibi.png`: 2~4등신 A·B·C 비교. 머리 폭과 단순화한 몸의 실루엣을 검토한다.
- `runtime-v7-ear-face.png`: 7차의 얼굴·귀 확대. 작은 전신에서 같은 세부가 모두 보인다는 뜻은 아니다.

외부 참고 도판·사진은 이 폴더에 재배포하지 않는다. 생성 그림의 입력 참고는 [MediBang 등신 도판](https://medibangpaint.com/use/2019/09/human-figure-proportions/)과 [Proko 팔의 구조](https://www.proko.com/course-lesson/how-to-draw-forearms-anatomy-for-artists/)였다. 글과 그림을 확인한 뒤 새 시안의 방향을 설명하는 용도로 사용했다.

## 생성 프롬프트

Create an original, exceptionally carefully drawn pixel-art anatomical character design reference sheet for a game. The supplied images are supporting educational proportion/anatomy references ONLY: the Japanese six-head drawing is a joint-landmark guide, and the arm photograph is a guide to shoulder/arm planes. Do not reproduce the photo, tattoos, diagram, captions, characters or composition of either reference. New sheet: two rows, three columns; top row the SAME clearly adult man aged about 30 viewed front, 45-degree three-quarter, and exact side; bottom row the SAME clearly adult woman aged about 30 in those three views. Each body exactly seven head-lengths tall and shown complete head to feet, consistent scale and consistent anatomy between views. Anatomically believable mature bodies with Japanese anime character-design proportions and appealing expressive adult anime faces; bald heads for unobstructed anatomy study. Man moderately athletic with natural pectoral fan, long deltoid flowing down upper arm, believable ribcage, shallow abdominal plane changes and obliques, NOT a stack of spheres or six isolated muscle plates. Woman a balanced softly curving mature adult body, moderately full natural chest integrated softly into ribcage, full hip/thigh transitions, believable waist and pelvis; no exaggerated hourglass. Neutral educational modeling pose with arms slightly away from sides, relaxed elbows, hands with believable thumb/fingers, gently separated planted feet. Show shoulder slope and clavicular plane, tapered asymmetric forearms, thigh adductor wedge and medial quadriceps, kneecap plane, calves whose inner bulge sits lower than outer bulge, narrow ankles and credible feet. Nonsexual smooth anatomical mannequins with skin-colored surface, NO nipples, NO genital detail, NO pubic hair, no sensual posing. No clothing, no accessories, no scenery. Cohesive discrete square pixels, each figure approximately 160 pixels tall before integer enlargement; deliberate connected pixel clusters and restrained warm skin value steps, no dithering noise, no shiny plastic, no bevelled metal musculature. Inspired by the principle of Chuck Close's gridded image construction: close up square colored units remain visible, from farther away the large anatomical form and lighting read convincingly. Do NOT put little circles inside every pixel. Keep Japanese anime silhouette/face sensitivity rather than western heroic comic exaggeration. Plain warm off-white background, generous even space, unobtrusive small headings FRONT / THREE-QUARTER / SIDE. This is an original visual target for comparison, not a claim to be a medical illustration or final game sprites.

위 요구사항이 결과에 모두 충족되었다고 판정하지 않았다. 생성 결과도 실제 모델과 동일하게 결함을 기록하고 대조한다.


## 8차 실제 모델 비교

runtime-v8-before-after.png는 7차 고정 모델과 8차 수정 모델을 같은 현재 팔레트로 투영한 구조 비교다. runtime-v8-ear-face.png, runtime-v8-chibi.png는 얼굴·귀·작은 등신 비교다. runtime-v8-rotation-{sex}-{heads}.png 14개는 좌우 8개 × 위아래 8개의 원본 128px 회전표다. 모두 코드에서 직접 렌더한 결과이며 외부 도판이나 AI 생성 그림을 실제 모델로 표시한 것이 아니다. 인체 완성도는 미승인 상태다.

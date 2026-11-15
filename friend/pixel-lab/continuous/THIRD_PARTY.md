# 연속 인체 표면 시안의 출처

이 폴더는 기존 책방 친구 캐릭터 자산을 사용하지 않는다. 새 연구 과정에서 MakeHuman의 공식 CC0 기본 인체와 성인 형태 데이터를 변형한 비교 시안이다. 전부 직접 조형한 원본이라고 표시하지 않는다.

- 원전: https://github.com/makehumancommunity/makehuman
- 고정 커밋: a8bc2d54ff0ac92e78ff71431b1023eda42bf482
- 기본 메시: makehuman/data/3dobjs/base.obj, Git blob d26635e9326e3cca30778fd7b9c00062b03cce09
- 뼈대와 가중치: makehuman/data/rigs/default.mhskel, default_weights.mhw
- 형태: macrodetails 폴더의 african/asian/caucasian × male/female × young.target 6개. 세 형태는 동일 비중으로 섞었다. 원전의 성인 25세 기준이며 인구 집단의 평균을 재현했다는 뜻이 아니다.
- 권리 고지: Data Collection AB, Joel Palmius, Jonas Hauquier 및 원전 자산에 기재된 제작자. 원전은 기본 메시와 변형·뼈대 자산을 CC0-1.0으로 제공한다.
- 권리 근거: https://github.com/makehumancommunity/makehuman/blob/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/LICENSE.md
- CC0 전문: 같은 폴더의 LICENSE.ASSETS.md

가져온 것은 위 그래픽 데이터다. MakeHuman의 AGPL 프로그램 코드는 복사하지 않았다. 현재의 데이터 변환, 중립 자세 계산, 등신 변환, 눈·입술·눈썹 처리와 픽셀 렌더 연결은 이 연구를 위해 작성했다.

mesh-data.mjs에는 가시 인체 표면 13,380개 점과 26,756개 삼각형이 들어 있다. 원전의 보조 메시를 캐릭터 표면으로 표시하지 않는다. 팔과 다리의 중립 자세를 뼈대 가중치로 바꾸고 턱 끝 기준점으로 머리 단위를 맞췄다. 실험용 눈의 확대와 코·턱 조절은 일본풍 얼굴의 완성본으로 승인되지 않았다.

현재 적용 범위는 성인 남녀 5~8등신의 기본 전신·얼굴 비교다. 2~4등신, 체형 슬라이더·노화·의상·새 동작과의 통합은 이 폴더에서 지원하지 않는다. 기존 8차 연구 구현과 함께 비교하며 최종 채택을 보류한다.

11차의 limb-regions.mjs는 위 CC0 기본 가중치에서 팔 영역을 추출한 데이터다. 새로운 프로그램 코드를 가져온 것은 아니다. 성인 실험형의 팔꿈치 위치와 목 변형 범위를 교정했고, 눈꺼풀·눈썹·코의 표면과 얼굴 확대 중심을 직접 수정했다.

12차 arm-regions.mjs는 같은 CC0 가중치의 위팔·전완·손목·중수골·손가락 묶음이다. 손목 높이와 손 크기를 독립적으로 조절하고 전완 단면을 연결하는 변형은 직접 작성했다.

16차 surface-study.mjs는 같은 CC0 성인 자료의 추가 표면 차이다. 원전 파일·SHA·혼합량은 데이터의 provenance.targets에 기록했다. maxmuscle-averageweight 남녀 성인 파일, torso-muscle-pectoral-incr, torso-muscle-dorsi-incr, stomach-tone-incr의 5개를 사용했다. 직접 작성한 포즈 변환 뒤 머리 영역과 좁은 접힘의 변형을 제한했다. 머리 단위와 뼈대 좌표는 유지한다. selected weights는 조형 선택이며 의학적 계측치가 아니다.


### 20차 발의 기본 자세 정렬

동일한 고정 CC0 인체·뼈대·가중치 자료로 발의 누적 회전을 다시 계산했다. 기존 위다리의 좌우 0.15라디안 회전을 발 관절에서 반대로 보정한 정적 시안이다. 프로그램 소스는 차용하지 않았다. foot-alignment.mjs는 성인 남녀별 기준 높이 이동과 발·발목·종아리 하단의 희소 변위 2,406개를 기록한다. 자연형은 이전 비교 기준을 유지하며 망가 실험형에만 적용한다. 실제 보행이나 임상적 발 자세 표준이 아니다.

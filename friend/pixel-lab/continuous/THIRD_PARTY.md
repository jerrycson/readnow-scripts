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

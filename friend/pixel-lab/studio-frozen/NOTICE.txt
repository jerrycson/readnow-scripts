# 동결 렌더 코드와 생성 데이터

설치 프로그램·원본 사진·비공개 연구 원고는 포함하지 않습니다. 연구용 코드의 import 주소만 내용 해시로 바꾸었습니다. 31~33은 공개 Git 판의 순수 렌더 의존성을 사용합니다.

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


## Foundation v21 — adult female chest surface

CC0 target data from the same pinned MakeHuman commit a8bc2d54ff0ac92e78ff71431b1023eda42bf482, under makehuman/data/targets/breast/:

| File | Git blob SHA | Weight |
| --- | --- | --- |
| breast-point-decr.target | 197951d5bf51c712cc36a4a9d652349a5f8d3b93 | 0.70 |
| breast-volume-vert-down.target | c3da37d90e810d4a3fb6bee6695184ced54b013a | 0.20 |
| female-young-averagemuscle-averageweight-averagecup-minfirmness.target | 659e3f2e54a788ffb8f11ca41602f55a17166230 | 0.40 |

Compiled using the existing adult age-25 basis and v20 pose. The 299 affected vertices receive 12 passes of local Laplacian relaxation, strength 0.40, fading over 3 graph rings to a fixed boundary. Chest normals receive 3 passes at weight 0.50 only on interior affected vertices. These are our implementation choices, not anatomical standards. Only the refined female manga basis uses these deltas; male, natural, head and limbs are unchanged. Source target headers and Git blob hashes were verified locally. No MakeHuman application code was copied. External Proko images are observation references and are not redistributed.


## Foundation v22 — adult ear shape and facial readability

Same pinned MakeHuman CC0 source commit. Both ear size targets use weight 0.65:

| File | Git blob SHA |
| --- | --- |
| ears/l-ear-scale-incr.target | 6f945f8353c0ff7433d67db92a7a6bee8156c566 |
| ears/r-ear-scale-incr.target | d795b17ef87c79e8fb4c0396405bfe17c49fc534 |

The compiler subtracts the same adult posed basis before/after ear targets. Each sex has 1,016 sparse changed vertices in ears and surrounding attachment, with no joint or head-height change. Runtime face smoothing can propagate this to adjacent vertices. Raw target headers and Git blob hashes verified. Adult manga form only; natural and chibi remain unchanged. Eye palette separation, line thickness and mouth width changes are our rendering choices. Rejected shoulder smoothing trials are not part of the public geometry. No application code or third-party reference images are included.


## Foundation v24 — proportion mapping

Our manga-only mapping now coordinates body width/depth and hand length across 5–8 heads. Neck blending preserves the previous upper-face coordinates. The 8-head form, natural forms and chibi remain unchanged. No additional third-party mesh or application code is used. Public reference links and original analysis are in the research pages; external MediBang diagrams remain observation-only and are not redistributed. These mapping coefficients are design choices, not medical or population standards.


## Foundation v25 — skin tone transitions

Adult manga skin uses our 25-color refinement of the existing 9-color palette. All vertex positions, normals and faces remain v24; natural and chibi materials remain unchanged. Rejected dual-quaternion and local shoulder-fill experiments are not included in the runtime. The research records distinguish algebraic tests, visual comparison and anatomical approval. No third-party skinning code is included.


## 28차 다리 부피 분리

동일한 고정 원전 a8bc2d54ff0ac92e78ff71431b1023eda42bf482의 CC0 armslegs 변형 네 파일을 사용했다. 자체 자세 변환 뒤 차이를 계산하고 허벅지·종아리의 가중치를 따로 적용했다. 각 성별 854개 정점만 포함하며 관절·발과 상체는 보존한다. 원전의 프로그램 코드는 가져오지 않았다.

- l-lowerleg-muscle-incr.target: 1bf7eec202cb0507761a45e31895e8b18b16891f
- r-lowerleg-muscle-incr.target: b9aa5ede5ae8571478692c0981b1915afe0fc9dc
- l-upperleg-muscle-incr.target: 534e022f995865ebfe5ac6b8f03107c5dbf81e57
- r-upperleg-muscle-incr.target: 82555abf562bbda689187f655060ee80d0ed1816

각 파일의 CC0 헤더와 Git blob 해시를 확인했다. 최종 가중치는 남성 상부 0.25·하부 0.50, 여성 상부 0.10·하부 0.25다. 초기 분리 후보의 중복 가중치 오류를 수정한 C2이며 인체 정상 수치를 뜻하지 않는다. 원전 링크: https://github.com/makehumancommunity/makehuman/tree/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/targets/armslegs


# Creative Commons CC0 1.0 Universal

CREATIVE COMMONS CORPORATION IS NOT A LAW FIRM AND DOES NOT PROVIDE LEGAL SERVICES. DISTRIBUTION OF THIS DOCUMENT DOES NOT CREATE AN ATTORNEY-CLIENT RELATIONSHIP. CREATIVE COMMONS PROVIDES THIS INFORMATION ON AN "AS-IS" BASIS. CREATIVE COMMONS MAKES NO WARRANTIES REGARDING THE USE OF THIS DOCUMENT OR THE INFORMATION OR WORKS PROVIDED HEREUNDER, AND DISCLAIMS LIABILITY FOR DAMAGES RESULTING FROM THE USE OF THIS DOCUMENT OR THE INFORMATION OR WORKS PROVIDED HEREUNDER.

### Statement of Purpose

The laws of most jurisdictions throughout the world automatically confer exclusive Copyright and Related Rights (defined below) upon the creator and subsequent owner(s) (each and all, an "owner") of an original work of authorship and/or a database (each, a "Work").

Certain owners wish to permanently relinquish those rights to a Work for the purpose of contributing to a commons of creative, cultural and scientific works ("Commons") that the public can reliably and without fear of later claims of infringement build upon, modify, incorporate in other works, reuse and redistribute as freely as possible in any form whatsoever and for any purposes, including without limitation commercial purposes. These owners may contribute to the Commons to promote the ideal of a free culture and the further production of creative, cultural and scientific works, or to gain reputation or greater distribution for their Work in part through the use and efforts of others.

For these and/or other purposes and motivations, and without any expectation of additional consideration or compensation, the person associating CC0 with a Work (the "Affirmer"), to the extent that he or she is an owner of Copyright and Related Rights in the Work, voluntarily elects to apply CC0 to the Work and publicly distribute the Work under its terms, with knowledge of his or her Copyright and Related Rights in the Work and the meaning and intended legal effect of CC0 on those rights.

1. __Copyright and Related Rights.__ A Work made available under CC0 may be protected by copyright and related or neighboring rights ("Copyright and Related Rights"). Copyright and Related Rights include, but are not limited to, the following:

    i. the right to reproduce, adapt, distribute, perform, display, communicate, and translate a Work;

    ii. moral rights retained by the original author(s) and/or performer(s);

    iii. publicity and privacy rights pertaining to a person's image or likeness depicted in a Work;

    iv. rights protecting against unfair competition in regards to a Work, subject to the limitations in paragraph 4(a), below;

    v. rights protecting the extraction, dissemination, use and reuse of data in a Work;

    vi. database rights (such as those arising under Directive 96/9/EC of the European Parliament and of the Council of 11 March 1996 on the legal protection of databases, and under any national implementation thereof, including any amended or successor version of such directive); and

    vii. other similar, equivalent or corresponding rights throughout the world based on applicable law or treaty, and any national implementations thereof.

2. __Waiver.__ To the greatest extent permitted by, but not in contravention of, applicable law, Affirmer hereby overtly, fully, permanently, irrevocably and unconditionally waives, abandons, and surrenders all of Affirmer's Copyright and Related Rights and associated claims and causes of action, whether now known or unknown (including existing as well as future claims and causes of action), in the Work (i) in all territories worldwide, (ii) for the maximum duration provided by applicable law or treaty (including future time extensions), (iii) in any current or future medium and for any number of copies, and (iv) for any purpose whatsoever, including without limitation commercial, advertising or promotional purposes (the "Waiver"). Affirmer makes the Waiver for the benefit of each member of the public at large and to the detriment of Affirmer's heirs and successors, fully intending that such Waiver shall not be subject to revocation, rescission, cancellation, termination, or any other legal or equitable action to disrupt the quiet enjoyment of the Work by the public as contemplated by Affirmer's express Statement of Purpose.

3. __Public License Fallback.__ Should any part of the Waiver for any reason be judged legally invalid or ineffective under applicable law, then the Waiver shall be preserved to the maximum extent permitted taking into account Affirmer's express Statement of Purpose. In addition, to the extent the Waiver is so judged Affirmer hereby grants to each affected person a royalty-free, non transferable, non sublicensable, non exclusive, irrevocable and unconditional license to exercise Affirmer's Copyright and Related Rights in the Work (i) in all territories worldwide, (ii) for the maximum duration provided by applicable law or treaty (including future time extensions), (iii) in any current or future medium and for any number of copies, and (iv) for any purpose whatsoever, including without limitation commercial, advertising or promotional purposes (the "License"). The License shall be deemed effective as of the date CC0 was applied by Affirmer to the Work. Should any part of the License for any reason be judged legally invalid or ineffective under applicable law, such partial invalidity or ineffectiveness shall not invalidate the remainder of the License, and in such case Affirmer hereby affirms that he or she will not (i) exercise any of his or her remaining Copyright and Related Rights in the Work or (ii) assert any associated claims and causes of action with respect to the Work, in either case contrary to Affirmer's express Statement of Purpose.

4. __Limitations and Disclaimers.__

    a. No trademark or patent rights held by Affirmer are waived, abandoned, surrendered, licensed or otherwise affected by this document.

    b. Affirmer offers the Work as-is and makes no representations or warranties of any kind concerning the Work, express, implied, statutory or otherwise, including without limitation warranties of title, merchantability, fitness for a particular purpose, non infringement, or the absence of latent or other defects, accuracy, or the present or absence of errors, whether or not discoverable, all to the greatest extent permissible under applicable law.

    c. Affirmer disclaims responsibility for clearing rights of other persons that may apply to the Work or any use thereof, including without limitation any person's Copyright and Related Rights in the Work. Further, Affirmer disclaims responsibility for obtaining any necessary consents, permissions or other rights required for any use of the Work.

    d. Affirmer understands and acknowledges that Creative Commons is not a party to this document and has no duty or obligation with respect to this CC0 or use of the Work.

// 공개 준비본에서 존재를 확인한 1~42차. friend/pixel-lab/studio.html 기준 상대 경로.
export const studioHistory=Object.freeze([
  {
    "id": "round-1",
    "round": 1,
    "label": "1차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [],
    "live": [],
    "models": [
      {
        "id": "frozen-1",
        "label": "1차 동결 기본형",
        "frozenRound": 1,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "6ec952e13d565b6cef2225b740df84c834484c02c5da9751a31297804b527386",
        "frozenMode": "foundation",
        "scope": "당시 일반 기본값·렌더러."
      }
    ],
    "limits": [
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-2",
    "round": 2,
    "label": "2차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-2-0",
        "kind": "data",
        "label": "v2-tests.json",
        "path": "qa/v2-tests.json",
        "sha256": "4c463e76e4b99f864610b5d65288c0166aef72da2f586130cb22e43f55c5cd3b",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-2-1",
        "kind": "data",
        "label": "world-tests.json",
        "path": "qa/world-tests.json",
        "sha256": "eed4547ae2c2cb84c3d51ea1e4963f5d1ae09c46324f09987f8189fa7d91e681",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-2-2",
        "kind": "data",
        "label": "2차 브라우저 검사",
        "path": "qa/v2-browser-tests.json",
        "sha256": "2be31f56e3f229b8a3938b43900f6270615eb7b11919ac505791c6dcbb974067"
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-2",
        "label": "2차 동결 기본형",
        "frozenRound": 2,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "0469144e00c56092031829ba0b8e4833be6d3b84bdcccd4ae2eec2970a43b15d",
        "frozenMode": "foundation",
        "scope": "당시 일반 기본값·렌더러."
      }
    ],
    "limits": [
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-3",
    "round": 3,
    "label": "3차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-3-0",
        "kind": "data",
        "label": "motion-tests.json",
        "path": "qa/motion-tests.json",
        "sha256": "7dd6db4402fbf0c26b174ef19c00f635f37651d8c7374cec7f82e2390e1c2e48",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-3-1",
        "kind": "model-source",
        "label": "3차 동물 보존 구조",
        "path": "compare/creatures-v3.mjs",
        "sha256": "17a1000fbf6098fd454a9f446b7b011b755a5d5b60072f1938f4a28694e7f6bc"
      },
      {
        "id": "round-3-2",
        "kind": "model-source",
        "label": "3차 보존 렌더 모듈",
        "path": "compare/renderer-v3.mjs",
        "sha256": "819e72660333307504ac7b6c39ada1eb982cfba974f5dc51cdcc8bf1578aae6f"
      }
    ],
    "live": [
      {
        "id": "animals-v3",
        "label": "3차 동물 보존 구조와 이후 대조",
        "path": "comparison.html",
        "note": "좌측3차 동물과 이후 공용 비교판. 현재 사람형을3차로 간주하지 않습니다."
      }
    ],
    "models": [
      {
        "id": "frozen-3",
        "label": "3차 동결 기본형",
        "frozenRound": 3,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "c97f4f33a8ced79edef3a08da4fb7a6ff44ded3f3a3322d69180089b9a7bd190",
        "frozenMode": "foundation",
        "scope": "당시 일반 기본값·렌더러."
      },
      {
        "id": "model-v3",
        "label": "3차 보존 모듈",
        "module": "compare/renderer-v3.mjs",
        "sceneExport": "bodyParts",
        "renderExport": "renderPixels",
        "settings": {
          "species": "fox",
          "sex": "female",
          "heads": 3
        },
        "scope": "3차 동물 구조만. 사람형·기본설정·재질은 현재 공통 의존성이므로 당시 전체 프로그램 재현을 뜻하지 않습니다."
      }
    ],
    "limits": [
      "실행 가능한 보존 관찰창입니다. 공통 렌더러의 후속 변경이 들어갈 수 있어 당시 고정 그림과 구별합니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-4",
    "round": 4,
    "label": "4차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-4-0",
        "kind": "data",
        "label": "animal-tests.json",
        "path": "qa/animal-tests.json",
        "sha256": "6f1443a22caf3aa112880442878932f9b2b7a4fd5056ffae7253e0a1eca1d1b9",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-4",
        "label": "4차 동결 기본형",
        "frozenRound": 4,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "7b29662a0d487a71170695d13a1f81573050517529d17f4767b96641f547c083",
        "frozenMode": "foundation",
        "scope": "당시 일반 기본값·렌더러."
      }
    ],
    "limits": [
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-5",
    "round": 5,
    "label": "5차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-5-0",
        "kind": "model-source",
        "label": "5차 보존 렌더 모듈",
        "path": "compare/v5/renderer.mjs",
        "sha256": "0e5c7430bfe995ff0376888e679e05f3a17167a1e1621557c423813e09271ffb"
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-5",
        "label": "5차 동결 기본형",
        "frozenRound": 5,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "1d1ba43aa50c5473f195feb62866d69bdb6787a0e60951487afc251aa5300257",
        "frozenMode": "foundation",
        "scope": "당시 일반 기본값·렌더러."
      },
      {
        "id": "model-v5",
        "label": "5차 보존 모듈",
        "module": "compare/v5/renderer.mjs",
        "sceneExport": "bodyParts",
        "renderExport": "renderPixels",
        "defaultModule": "compare/v5/model.mjs",
        "defaultExport": "DEFAULTS",
        "scope": "보존 폴더의 엔진·기본설정을 함께 사용. 당시 배포 전체와 바이트 동일함을 보장하지 않습니다."
      }
    ],
    "limits": [
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-6",
    "round": 6,
    "label": "6차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-6-0",
        "kind": "data",
        "label": "body-design-tests.json",
        "path": "qa/body-design-tests.json",
        "sha256": "73f5ee4b525a933027c9d550248c049caac1a6c2cc1f1aac61580cd5e52df9c1",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-6-1",
        "kind": "data",
        "label": "hair-design-tests.json",
        "path": "qa/hair-design-tests.json",
        "sha256": "60f8e8eaaf68aa1863441f118346e34850d8ea9bddee203f2779d1871fcb5998",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-6-2",
        "kind": "model-source",
        "label": "6차 보존 렌더 모듈",
        "path": "compare/v6/renderer.mjs",
        "sha256": "eeda24975bb03be7244d11669a66c9d388157c63f8e4827209292ce293e17d89"
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-6",
        "label": "6차 동결 기본형",
        "frozenRound": 6,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "4d16c5558eebb5ba9aecacb0530f9ecf3f7df3e4764ef3db6df3e154c525b635",
        "frozenMode": "foundation",
        "scope": "당시 일반 기본값·렌더러."
      },
      {
        "id": "model-v6",
        "label": "6차 보존 모듈",
        "module": "compare/v6/renderer.mjs",
        "sceneExport": "bodyParts",
        "renderExport": "renderPixels",
        "defaultModule": "compare/v6/model.mjs",
        "defaultExport": "DEFAULTS",
        "scope": "보존 폴더의 엔진·기본설정을 함께 사용. 당시 배포 전체와 바이트 동일함을 보장하지 않습니다."
      }
    ],
    "limits": [
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-7",
    "round": 7,
    "label": "7차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-7-0",
        "kind": "image",
        "label": "runtime-v7-before-after.png",
        "path": "studies/runtime-v7-before-after.png",
        "sha256": "92aec715e42a47cb9abd98c30f65e3788d5792f73971cd30ccc639610e188668",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-7-1",
        "kind": "image",
        "label": "runtime-v7-chest-study.png",
        "path": "studies/runtime-v7-chest-study.png",
        "sha256": "c1bedf41f0424715ba774ca663409c5b6f0d4bd503bb0a4eb54042a0739477aa",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-7-2",
        "kind": "image",
        "label": "runtime-v7-chibi.png",
        "path": "studies/runtime-v7-chibi.png",
        "sha256": "be25dfcdc3a4acef0ec57f27d5dad6dab5a46ece5a900e9cd33fa47a63ff9c58",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-7-3",
        "kind": "image",
        "label": "runtime-v7-ear-face.png",
        "path": "studies/runtime-v7-ear-face.png",
        "sha256": "d5fa678c9bfb2f3e91477da47050b034076c9ceba118aeafcc94c37f68894432",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-7-4",
        "kind": "data",
        "label": "anatomy-v7-tests.json",
        "path": "qa/anatomy-v7-tests.json",
        "sha256": "456b43a5b0ec4316458cb8085e2b7abd3e77d19b4e08c2b239645c68b2a09828",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-7-5",
        "kind": "data",
        "label": "sleep-tests.json",
        "path": "qa/sleep-tests.json",
        "sha256": "51c48cef448002b179272602b6113d7dc983b42f9bbeb821182751ce8ce07b5f",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-7-6",
        "kind": "model-source",
        "label": "7차 보존 렌더 모듈",
        "path": "compare/v7/renderer.mjs",
        "sha256": "048536f31959e1039100b8a53b2ce547574a47fa9ea0c1bd1cbb76cba438e989"
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-7",
        "label": "7차 동결 기본형",
        "frozenRound": 7,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "bc7cdef7bb03f50553bb2dcafb84b5c072e03ede0158fdd01b0689591085f61d",
        "frozenMode": "foundation",
        "scope": "당시 일반 기본값·렌더러."
      },
      {
        "id": "model-v7",
        "label": "7차 보존 모듈",
        "module": "compare/v7/renderer.mjs",
        "sceneExport": "bodyParts",
        "renderExport": "renderPixels",
        "defaultModule": "compare/v7/model.mjs",
        "defaultExport": "DEFAULTS",
        "scope": "보존 폴더의 엔진·기본설정을 함께 사용. 당시 배포 전체와 바이트 동일함을 보장하지 않습니다."
      }
    ],
    "limits": [
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-8",
    "round": 8,
    "label": "8차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-8-0",
        "kind": "image",
        "label": "runtime-v8-before-after.png",
        "path": "studies/runtime-v8-before-after.png",
        "sha256": "187a0337314ddf228931747928cfa4da002ba4503cc16d54059b4f6c3b9a9133",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-8-1",
        "kind": "image",
        "label": "runtime-v8-chibi.png",
        "path": "studies/runtime-v8-chibi.png",
        "sha256": "8f975fc4a2dded0b0b077ec2652409fa652804e8f7b7c3a263532b6ff4821a84",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-8-2",
        "kind": "image",
        "label": "runtime-v8-ear-face.png",
        "path": "studies/runtime-v8-ear-face.png",
        "sha256": "7e537faa6c9986db59efb0a8163d2dd825d8a34db85ea439b74472d340909470",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-8-3",
        "kind": "rotation-sheet",
        "label": "runtime-v8-rotation-female-2.png",
        "path": "studies/runtime-v8-rotation-female-2.png",
        "sha256": "95877736fdc1496a51a77bcb2ac34140817c3ab13206c70c42aa09eb393fd35c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-8-4",
        "kind": "rotation-sheet",
        "label": "runtime-v8-rotation-female-3.png",
        "path": "studies/runtime-v8-rotation-female-3.png",
        "sha256": "0a7c7838329d73f57af35fbebb80e98d3745a5f76e55c16722a9d8c7a8c42b24",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-8-5",
        "kind": "rotation-sheet",
        "label": "runtime-v8-rotation-female-4.png",
        "path": "studies/runtime-v8-rotation-female-4.png",
        "sha256": "eccb7110b6b0d9c3fd27ae2305eb41607e519ed2da88dc16cc327d2189ff350e",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-8-6",
        "kind": "rotation-sheet",
        "label": "runtime-v8-rotation-female-5.png",
        "path": "studies/runtime-v8-rotation-female-5.png",
        "sha256": "80da759481fac4a6331119accab1a2aa2bc84d5c866841301acc5baf4faafc15",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-8-7",
        "kind": "rotation-sheet",
        "label": "runtime-v8-rotation-female-6.png",
        "path": "studies/runtime-v8-rotation-female-6.png",
        "sha256": "082aea256f5aa4c2687f790d6385e3edb6a7e2842843bcbd8aa2860ac30a2ebc",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-8-8",
        "kind": "rotation-sheet",
        "label": "runtime-v8-rotation-female-7.png",
        "path": "studies/runtime-v8-rotation-female-7.png",
        "sha256": "251c55c3cc0944c71e12118218672b2993bc1984b4b9138d1c6fdfbb6ddfb7ec",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-8-9",
        "kind": "rotation-sheet",
        "label": "runtime-v8-rotation-female-8.png",
        "path": "studies/runtime-v8-rotation-female-8.png",
        "sha256": "ad301b086e96e8f173069019f63cd14d3bbce89220db38bf89cb697e3d98cbdd",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-8-10",
        "kind": "rotation-sheet",
        "label": "runtime-v8-rotation-male-2.png",
        "path": "studies/runtime-v8-rotation-male-2.png",
        "sha256": "03079b40aaf172421b8ef23f2a48b3f12c3d6b5557a123d91b5d528ed9d4f450",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-8-11",
        "kind": "rotation-sheet",
        "label": "runtime-v8-rotation-male-3.png",
        "path": "studies/runtime-v8-rotation-male-3.png",
        "sha256": "8cf719cfa5d9c7f8273615a7e5fd82e64696408a951ecb900f768869c7ad009b",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-8-12",
        "kind": "rotation-sheet",
        "label": "runtime-v8-rotation-male-4.png",
        "path": "studies/runtime-v8-rotation-male-4.png",
        "sha256": "7c5d5c0d34351dda3b0ba965e3b126047cd40e521d6248f2bdc1fef30c360922",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-8-13",
        "kind": "rotation-sheet",
        "label": "runtime-v8-rotation-male-5.png",
        "path": "studies/runtime-v8-rotation-male-5.png",
        "sha256": "bc02c86b0a488460c23e2058c1c6e7f29fd9d48410152c4cbe39086ce69fa155",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-8-14",
        "kind": "rotation-sheet",
        "label": "runtime-v8-rotation-male-6.png",
        "path": "studies/runtime-v8-rotation-male-6.png",
        "sha256": "520c857a44b91f01bb4e69c2164eeaafb279bee8bbf2b3556ac159a7abf52c34",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-8-15",
        "kind": "rotation-sheet",
        "label": "runtime-v8-rotation-male-7.png",
        "path": "studies/runtime-v8-rotation-male-7.png",
        "sha256": "8dfde27d41335fa6efa1ceaf01804367228f023c5befb98b4aeaa494a1fc8e44",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-8-16",
        "kind": "rotation-sheet",
        "label": "runtime-v8-rotation-male-8.png",
        "path": "studies/runtime-v8-rotation-male-8.png",
        "sha256": "23a55b19059de3e724111a3ca43ee84f4b0f3731e4e30c9013e018bf465b4d46",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-8-17",
        "kind": "data",
        "label": "anatomy-v8-tests.json",
        "path": "qa/anatomy-v8-tests.json",
        "sha256": "f48cafa7e38f44b4fc8951cd8b5a8c7742ba7197ef3cd55c3e283553e300e955",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-8-18",
        "kind": "data",
        "label": "rotation-v8-tests.json",
        "path": "qa/rotation-v8-tests.json",
        "sha256": "dfdd2015edbb75607175e1f44fe5f7a2b2787d4c8ae226b1c0aaca31a955e1f4",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-8",
        "label": "8차 동결 기본형",
        "frozenRound": 8,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "097cab0cc8ffc70769ee4958a4398fa02e11e118dea0c9e62ba4114ab342b103",
        "frozenMode": "foundation",
        "scope": "당시 일반 기본값·렌더러."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-9",
    "round": 9,
    "label": "9차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-9-0",
        "kind": "image",
        "label": "continuous-v9-comparison.png",
        "path": "studies/continuous-v9-comparison.png",
        "sha256": "6669ae6db5895e07ead6a6d2041561edc575b747530c605a05a2b7d0986a3997",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-9-1",
        "kind": "image",
        "label": "continuous-v9-face.png",
        "path": "studies/continuous-v9-face.png",
        "sha256": "d37e57c59aa632ae97a1a43e4bf9e6d3888824e841356821ab0e286654584cef",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-9-2",
        "kind": "image",
        "label": "continuous-v9-proportions.png",
        "path": "studies/continuous-v9-proportions.png",
        "sha256": "85b64082e5a4d03304bf6842a5b5dd2c4b76836a0da4d13167596c0b92d039b9",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-9-3",
        "kind": "data",
        "label": "continuous-v9-tests.json",
        "path": "qa/continuous-v9-tests.json",
        "sha256": "213257cbac6d0daef8488b4ad23d868be24f028ad019c4deff672d43b403ec4d",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-9",
        "label": "9차 동결 기본형",
        "frozenRound": 9,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "87875dd42ec97f2cfaf3f358c120b7fcd54d9e6e65e24dca0bb820f8b6200e35",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-9",
        "label": "9차 일반 기본엔진",
        "frozenRound": 9,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "c8a619ac0ab5ecf5d217796efd660cd2f1c62a51c805267f31dd1b7b2d071c58",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-10",
    "round": 10,
    "label": "10차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-10-0",
        "kind": "image",
        "label": "chibi-v10-comparison.png",
        "path": "studies/chibi-v10-comparison.png",
        "sha256": "924cf32cccae8c0670f2a9f77d6dc79617e9387809adb28ebbda48e48ad03af6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-10-1",
        "kind": "image",
        "label": "chibi-v10-face.png",
        "path": "studies/chibi-v10-face.png",
        "sha256": "822c2e5eb6b68a60b0fb8ed0085eaf582ec36f2bf465913952a5ffd83e0e146c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-10-2",
        "kind": "rotation-sheet",
        "label": "runtime-v10-rotation-female-2.png",
        "path": "studies/runtime-v10-rotation-female-2.png",
        "sha256": "da6bab893cf7e82c9a4775a4d39e77b1fbb884663687fa123ed4cab803fd5c45",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-10-3",
        "kind": "rotation-sheet",
        "label": "runtime-v10-rotation-female-3.png",
        "path": "studies/runtime-v10-rotation-female-3.png",
        "sha256": "a1b5c1f4644faaaa265606f48a9d784a614ffb280ca3fb7c0700f40bd11bbd26",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-10-4",
        "kind": "rotation-sheet",
        "label": "runtime-v10-rotation-female-4.png",
        "path": "studies/runtime-v10-rotation-female-4.png",
        "sha256": "3ec740be640676ea7e0ad146d7a5988672498936c25dee2c60b724374232df31",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-10-5",
        "kind": "rotation-sheet",
        "label": "runtime-v10-rotation-female-5.png",
        "path": "studies/runtime-v10-rotation-female-5.png",
        "sha256": "1252c918b5631ff08dcbde5bed619a927ddaffca900307d8ecc959571914a022",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-10-6",
        "kind": "rotation-sheet",
        "label": "runtime-v10-rotation-female-6.png",
        "path": "studies/runtime-v10-rotation-female-6.png",
        "sha256": "0b594a30e0028059b3e9fe69cb039a854a5365b9eac4757d8bf7f38564998c05",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-10-7",
        "kind": "rotation-sheet",
        "label": "runtime-v10-rotation-female-7.png",
        "path": "studies/runtime-v10-rotation-female-7.png",
        "sha256": "bc7d5f3008f29506c0e833e69386f2e5aca58fda3f66ed1b9b9090a0572f083e",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-10-8",
        "kind": "rotation-sheet",
        "label": "runtime-v10-rotation-female-8.png",
        "path": "studies/runtime-v10-rotation-female-8.png",
        "sha256": "4f194151359012b87726f5a2a432ad16905065b47e77c3e938d436198eb958a1",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-10-9",
        "kind": "rotation-sheet",
        "label": "runtime-v10-rotation-male-2.png",
        "path": "studies/runtime-v10-rotation-male-2.png",
        "sha256": "6646d73499847cf27954d651a7e0d6144eb4a00e97db018be8616af273281d69",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-10-10",
        "kind": "rotation-sheet",
        "label": "runtime-v10-rotation-male-3.png",
        "path": "studies/runtime-v10-rotation-male-3.png",
        "sha256": "3cc7df6738bea56397fca9e4456ed5e7b95c62002c8cf5fa7891ea82baa12730",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-10-11",
        "kind": "rotation-sheet",
        "label": "runtime-v10-rotation-male-4.png",
        "path": "studies/runtime-v10-rotation-male-4.png",
        "sha256": "2c8aca8c48e95610707956c8ec578942e5db686b37cfb625d28326e58b52fa43",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-10-12",
        "kind": "rotation-sheet",
        "label": "runtime-v10-rotation-male-5.png",
        "path": "studies/runtime-v10-rotation-male-5.png",
        "sha256": "dffd7df8075398f07a12e35abce192298e191a4b16f53122aac6a31d3157e585",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-10-13",
        "kind": "rotation-sheet",
        "label": "runtime-v10-rotation-male-6.png",
        "path": "studies/runtime-v10-rotation-male-6.png",
        "sha256": "379dfebba2969510878fbbb8d3b1b07d2d00cece6854f5f31444ee38284c3e53",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-10-14",
        "kind": "rotation-sheet",
        "label": "runtime-v10-rotation-male-7.png",
        "path": "studies/runtime-v10-rotation-male-7.png",
        "sha256": "57128da080bff7d60efd2455261bf54167f253cbf58408a2ff198cde1fdc27dd",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-10-15",
        "kind": "rotation-sheet",
        "label": "runtime-v10-rotation-male-8.png",
        "path": "studies/runtime-v10-rotation-male-8.png",
        "sha256": "992a28035688709ebbdef99e749f5ed0a6ad7df1c7d628fa1c32e051452d80d8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-10-16",
        "kind": "data",
        "label": "chibi-v10-tests.json",
        "path": "qa/chibi-v10-tests.json",
        "sha256": "002fc3e0a1ab9398688a66bd59871d2d23f8e86cb3575d72814f903f11e3129b",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-10-17",
        "kind": "data",
        "label": "rotation-v10-tests.json",
        "path": "qa/rotation-v10-tests.json",
        "sha256": "a48978e5f0c2d1c051c1124c5c3d4ce3a97ff0b947a623904fea11ca858b8f16",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-10",
        "label": "10차 동결 기본형",
        "frozenRound": 10,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "af424cc40c629d339acbcab16d30e6558fcd4a446e168970777ad12206734e41",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-10",
        "label": "10차 일반 기본엔진",
        "frozenRound": 10,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "c8a619ac0ab5ecf5d217796efd660cd2f1c62a51c805267f31dd1b7b2d071c58",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-11",
    "round": 11,
    "label": "11차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-11-0",
        "kind": "image",
        "label": "anatomy-v11-comparison.png",
        "path": "studies/anatomy-v11-comparison.png",
        "sha256": "6308f178516d4072903ef105a951dce67e56272959ec0e226d2fc4660455e188",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-1",
        "kind": "image",
        "label": "anatomy-v11-face.png",
        "path": "studies/anatomy-v11-face.png",
        "sha256": "9c4821e8bf4791319ac435eb7b00f7dd3ece9157690a550d8a998ab7ec0cada6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-2",
        "kind": "image",
        "label": "anatomy-v11-landmarks.png",
        "path": "studies/anatomy-v11-landmarks.png",
        "sha256": "ae96f235283c342685897e389c88efb874bb9f9b09edb63a0b58e4497c860567",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-3",
        "kind": "image",
        "label": "anatomy-v11-proportions.png",
        "path": "studies/anatomy-v11-proportions.png",
        "sha256": "cc74ccdb3fef06ef14ef4b851f66745dfdda4431625ae2a8da80a2f39a712020",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-4",
        "kind": "rotation-sheet",
        "label": "runtime-v11-rotation-female-2.png",
        "path": "studies/runtime-v11-rotation-female-2.png",
        "sha256": "da6bab893cf7e82c9a4775a4d39e77b1fbb884663687fa123ed4cab803fd5c45",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-5",
        "kind": "rotation-sheet",
        "label": "runtime-v11-rotation-female-3.png",
        "path": "studies/runtime-v11-rotation-female-3.png",
        "sha256": "a1b5c1f4644faaaa265606f48a9d784a614ffb280ca3fb7c0700f40bd11bbd26",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-6",
        "kind": "rotation-sheet",
        "label": "runtime-v11-rotation-female-4.png",
        "path": "studies/runtime-v11-rotation-female-4.png",
        "sha256": "3ec740be640676ea7e0ad146d7a5988672498936c25dee2c60b724374232df31",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-7",
        "kind": "rotation-sheet",
        "label": "runtime-v11-rotation-female-5.png",
        "path": "studies/runtime-v11-rotation-female-5.png",
        "sha256": "55e33ade22a6a08333b5f80bd9ad2454009f8d21bb9924a99633ab9ca9b0b574",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-8",
        "kind": "rotation-sheet",
        "label": "runtime-v11-rotation-female-6.png",
        "path": "studies/runtime-v11-rotation-female-6.png",
        "sha256": "1cdeb05aa96e49724388f868f6441db86fa7f2b32038faa4bd04e17cb916861c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-9",
        "kind": "rotation-sheet",
        "label": "runtime-v11-rotation-female-7.png",
        "path": "studies/runtime-v11-rotation-female-7.png",
        "sha256": "13705f10b1511475fbcb45dc4b37c6be69e8aaf1e1c718346fdbd7d7ecb281b7",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-10",
        "kind": "rotation-sheet",
        "label": "runtime-v11-rotation-female-8.png",
        "path": "studies/runtime-v11-rotation-female-8.png",
        "sha256": "75768952de51fe77d6e2f990847dce59f26ad406c76ad0f82f871c275c77b84c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-11",
        "kind": "rotation-sheet",
        "label": "runtime-v11-rotation-male-2.png",
        "path": "studies/runtime-v11-rotation-male-2.png",
        "sha256": "6646d73499847cf27954d651a7e0d6144eb4a00e97db018be8616af273281d69",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-12",
        "kind": "rotation-sheet",
        "label": "runtime-v11-rotation-male-3.png",
        "path": "studies/runtime-v11-rotation-male-3.png",
        "sha256": "3cc7df6738bea56397fca9e4456ed5e7b95c62002c8cf5fa7891ea82baa12730",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-13",
        "kind": "rotation-sheet",
        "label": "runtime-v11-rotation-male-4.png",
        "path": "studies/runtime-v11-rotation-male-4.png",
        "sha256": "2c8aca8c48e95610707956c8ec578942e5db686b37cfb625d28326e58b52fa43",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-14",
        "kind": "rotation-sheet",
        "label": "runtime-v11-rotation-male-5.png",
        "path": "studies/runtime-v11-rotation-male-5.png",
        "sha256": "519bf8aaa21aa60f7893270b7e8a5f22f4b1174cdb0ec7eae27e0b1cb90f8e66",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-15",
        "kind": "rotation-sheet",
        "label": "runtime-v11-rotation-male-6.png",
        "path": "studies/runtime-v11-rotation-male-6.png",
        "sha256": "0ffca6c6ef0f5e333008793b78de1bdde9191c37f63bd75bfad4f68eab05e0b3",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-16",
        "kind": "rotation-sheet",
        "label": "runtime-v11-rotation-male-7.png",
        "path": "studies/runtime-v11-rotation-male-7.png",
        "sha256": "1b86344029fd64494521b0582ac0bb757919a9c595062985493a15e7adbb7df5",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-17",
        "kind": "rotation-sheet",
        "label": "runtime-v11-rotation-male-8.png",
        "path": "studies/runtime-v11-rotation-male-8.png",
        "sha256": "a09eb69ada04c0cfb98e6e4aa0a324350bffbfef066133bc1d878856821040a7",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-11-18",
        "kind": "data",
        "label": "anatomy-v11-tests.json",
        "path": "qa/anatomy-v11-tests.json",
        "sha256": "60dae568e1493966ff553c70ad116a812b906e77d1de5788a9aea37485ffc204",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-11-19",
        "kind": "data",
        "label": "rotation-v11-tests.json",
        "path": "qa/rotation-v11-tests.json",
        "sha256": "226bc9949c57fa519c0931bcd6815e9ad3f77c59a2996b5eb5bdd3beff9f0bed",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-11",
        "label": "11차 동결 기본형",
        "frozenRound": 11,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "db9c952b0182adce647f5c8252717cceae2c3a097faf2ef1e32564c50f3392dc",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-11",
        "label": "11차 일반 기본엔진",
        "frozenRound": 11,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "0e3af37218a45467e59d7b67583ddfa4e4bf42d6598e4fb66d3d6f5cb34c7292",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-12",
    "round": 12,
    "label": "12차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-12-0",
        "kind": "image",
        "label": "anatomy-v12-comparison.png",
        "path": "studies/anatomy-v12-comparison.png",
        "sha256": "4e6ee48ac29473f51930865ee9facb446c3b3757133025c4dfe0776191a1f56a",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-12-1",
        "kind": "image",
        "label": "anatomy-v12-hands.png",
        "path": "studies/anatomy-v12-hands.png",
        "sha256": "6c29f8e3a426689157829e281678f7c62c8cb3309e7d5e97c24ec72ae73482ba",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-12-2",
        "kind": "image",
        "label": "anatomy-v12-proportions.png",
        "path": "studies/anatomy-v12-proportions.png",
        "sha256": "00d53f521bc68128605018a768fa6c2bc4b9486e87e43ba57c2a3528e38990ff",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-12-3",
        "kind": "rotation-sheet",
        "label": "runtime-v12-rotation-female-2.png",
        "path": "studies/runtime-v12-rotation-female-2.png",
        "sha256": "da6bab893cf7e82c9a4775a4d39e77b1fbb884663687fa123ed4cab803fd5c45",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-12-4",
        "kind": "rotation-sheet",
        "label": "runtime-v12-rotation-female-3.png",
        "path": "studies/runtime-v12-rotation-female-3.png",
        "sha256": "a1b5c1f4644faaaa265606f48a9d784a614ffb280ca3fb7c0700f40bd11bbd26",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-12-5",
        "kind": "rotation-sheet",
        "label": "runtime-v12-rotation-female-4.png",
        "path": "studies/runtime-v12-rotation-female-4.png",
        "sha256": "3ec740be640676ea7e0ad146d7a5988672498936c25dee2c60b724374232df31",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-12-6",
        "kind": "rotation-sheet",
        "label": "runtime-v12-rotation-female-5.png",
        "path": "studies/runtime-v12-rotation-female-5.png",
        "sha256": "de185dac6ecbe362bb12c21fc70b6d9595b58f956ae65d9c0bd44dc3b978dcce",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-12-7",
        "kind": "rotation-sheet",
        "label": "runtime-v12-rotation-female-6.png",
        "path": "studies/runtime-v12-rotation-female-6.png",
        "sha256": "2ef1fd892edd41349454fd1fc85847674d22a9e56356580fae82bd4cd92b38f8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-12-8",
        "kind": "rotation-sheet",
        "label": "runtime-v12-rotation-female-7.png",
        "path": "studies/runtime-v12-rotation-female-7.png",
        "sha256": "ef8a05ccdbd5ab969532c41e8ee3ad81dc547a0e861d7383b27c82cf87d09488",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-12-9",
        "kind": "rotation-sheet",
        "label": "runtime-v12-rotation-female-8.png",
        "path": "studies/runtime-v12-rotation-female-8.png",
        "sha256": "5801004d05cfc25cad20073c0022c7ff78c6258cc306d8e6b9e2962d3e8cad4f",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-12-10",
        "kind": "rotation-sheet",
        "label": "runtime-v12-rotation-male-2.png",
        "path": "studies/runtime-v12-rotation-male-2.png",
        "sha256": "6646d73499847cf27954d651a7e0d6144eb4a00e97db018be8616af273281d69",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-12-11",
        "kind": "rotation-sheet",
        "label": "runtime-v12-rotation-male-3.png",
        "path": "studies/runtime-v12-rotation-male-3.png",
        "sha256": "3cc7df6738bea56397fca9e4456ed5e7b95c62002c8cf5fa7891ea82baa12730",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-12-12",
        "kind": "rotation-sheet",
        "label": "runtime-v12-rotation-male-4.png",
        "path": "studies/runtime-v12-rotation-male-4.png",
        "sha256": "2c8aca8c48e95610707956c8ec578942e5db686b37cfb625d28326e58b52fa43",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-12-13",
        "kind": "rotation-sheet",
        "label": "runtime-v12-rotation-male-5.png",
        "path": "studies/runtime-v12-rotation-male-5.png",
        "sha256": "c4da12baa14c106649304e45f19a38b134f26d2e2069802d5d0e4efa1af2e97b",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-12-14",
        "kind": "rotation-sheet",
        "label": "runtime-v12-rotation-male-6.png",
        "path": "studies/runtime-v12-rotation-male-6.png",
        "sha256": "8cc7710404ef8b0b6e5f5a19bb777da531ea3a855f1a294372ec209b392d71c8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-12-15",
        "kind": "rotation-sheet",
        "label": "runtime-v12-rotation-male-7.png",
        "path": "studies/runtime-v12-rotation-male-7.png",
        "sha256": "96565a8bf9d96fcd510a5b703e88b344747a00d9a1990ce67686e9ad26ac58f5",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-12-16",
        "kind": "rotation-sheet",
        "label": "runtime-v12-rotation-male-8.png",
        "path": "studies/runtime-v12-rotation-male-8.png",
        "sha256": "7c99920a3262f905ccba3034a80db31f7f35843e61f3e3108fef2b0b18a50ed8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-12-17",
        "kind": "data",
        "label": "anatomy-v12-tests.json",
        "path": "qa/anatomy-v12-tests.json",
        "sha256": "ca423e820f40a5bfcaff7c7db67d825ae5e9eab10852d0e3ccf748eb524b5b3a",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-12-18",
        "kind": "data",
        "label": "rotation-v12-tests.json",
        "path": "qa/rotation-v12-tests.json",
        "sha256": "10ba2e7b5b05288f0e53aae082f2b3d39822d07041f459bf90d4e6216cb0b6a6",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-12",
        "label": "12차 동결 기본형",
        "frozenRound": 12,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "83f33c326262a8cfe15dc871e53afc497cfd02f3e3d175542f91ba0721bbaf1a",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-12",
        "label": "12차 일반 기본엔진",
        "frozenRound": 12,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "0e3af37218a45467e59d7b67583ddfa4e4bf42d6598e4fb66d3d6f5cb34c7292",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-13",
    "round": 13,
    "label": "13차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-13-0",
        "kind": "image",
        "label": "chibi-v13-comparison.png",
        "path": "studies/chibi-v13-comparison.png",
        "sha256": "2d6f937345dfa020d38472d8ab46c292417127d3bf0ddb80852ff8dfb540c613",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-13-1",
        "kind": "image",
        "label": "chibi-v13-face.png",
        "path": "studies/chibi-v13-face.png",
        "sha256": "756cced58e6297710e892964b9d320a7c2fd6ff4dcf0e2e89f0b6b970697dec8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-13-2",
        "kind": "rotation-sheet",
        "label": "runtime-v13-rotation-female-2.png",
        "path": "studies/runtime-v13-rotation-female-2.png",
        "sha256": "b9c2f0b194a019a0ce57e5ddca91244fc63d49a36c815e07f90bf48692167681",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-13-3",
        "kind": "rotation-sheet",
        "label": "runtime-v13-rotation-female-3.png",
        "path": "studies/runtime-v13-rotation-female-3.png",
        "sha256": "3d2ccdc22b22f73be772bd898e31fe4873fb922e63e4eb36ba8eb54a0dfff4ff",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-13-4",
        "kind": "rotation-sheet",
        "label": "runtime-v13-rotation-female-4.png",
        "path": "studies/runtime-v13-rotation-female-4.png",
        "sha256": "e863fbb59e5c5a0a24482f3b5d05607c08fde611a36b2ff2433dc13d91e10fc6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-13-5",
        "kind": "rotation-sheet",
        "label": "runtime-v13-rotation-female-5.png",
        "path": "studies/runtime-v13-rotation-female-5.png",
        "sha256": "de185dac6ecbe362bb12c21fc70b6d9595b58f956ae65d9c0bd44dc3b978dcce",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-13-6",
        "kind": "rotation-sheet",
        "label": "runtime-v13-rotation-female-6.png",
        "path": "studies/runtime-v13-rotation-female-6.png",
        "sha256": "2ef1fd892edd41349454fd1fc85847674d22a9e56356580fae82bd4cd92b38f8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-13-7",
        "kind": "rotation-sheet",
        "label": "runtime-v13-rotation-female-7.png",
        "path": "studies/runtime-v13-rotation-female-7.png",
        "sha256": "ef8a05ccdbd5ab969532c41e8ee3ad81dc547a0e861d7383b27c82cf87d09488",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-13-8",
        "kind": "rotation-sheet",
        "label": "runtime-v13-rotation-female-8.png",
        "path": "studies/runtime-v13-rotation-female-8.png",
        "sha256": "5801004d05cfc25cad20073c0022c7ff78c6258cc306d8e6b9e2962d3e8cad4f",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-13-9",
        "kind": "rotation-sheet",
        "label": "runtime-v13-rotation-male-2.png",
        "path": "studies/runtime-v13-rotation-male-2.png",
        "sha256": "8e90034853795363cff756274c4ced38a72e3c60b73098c5cc4baa5d1d0d5ece",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-13-10",
        "kind": "rotation-sheet",
        "label": "runtime-v13-rotation-male-3.png",
        "path": "studies/runtime-v13-rotation-male-3.png",
        "sha256": "56581b2777e0a04ccab4dc4f82d25e072c3ff845a4c0a20ec32b1bab88003797",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-13-11",
        "kind": "rotation-sheet",
        "label": "runtime-v13-rotation-male-4.png",
        "path": "studies/runtime-v13-rotation-male-4.png",
        "sha256": "509dba4da1e1f7545d002798d0e5d6bf09eba26066c37df4b8fde41782a0dcf0",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-13-12",
        "kind": "rotation-sheet",
        "label": "runtime-v13-rotation-male-5.png",
        "path": "studies/runtime-v13-rotation-male-5.png",
        "sha256": "c4da12baa14c106649304e45f19a38b134f26d2e2069802d5d0e4efa1af2e97b",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-13-13",
        "kind": "rotation-sheet",
        "label": "runtime-v13-rotation-male-6.png",
        "path": "studies/runtime-v13-rotation-male-6.png",
        "sha256": "8cc7710404ef8b0b6e5f5a19bb777da531ea3a855f1a294372ec209b392d71c8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-13-14",
        "kind": "rotation-sheet",
        "label": "runtime-v13-rotation-male-7.png",
        "path": "studies/runtime-v13-rotation-male-7.png",
        "sha256": "96565a8bf9d96fcd510a5b703e88b344747a00d9a1990ce67686e9ad26ac58f5",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-13-15",
        "kind": "rotation-sheet",
        "label": "runtime-v13-rotation-male-8.png",
        "path": "studies/runtime-v13-rotation-male-8.png",
        "sha256": "7c99920a3262f905ccba3034a80db31f7f35843e61f3e3108fef2b0b18a50ed8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-13-16",
        "kind": "data",
        "label": "chibi-v13-tests.json",
        "path": "qa/chibi-v13-tests.json",
        "sha256": "fa77c3b3a4ea50f59e2b9cf2cc199597dfc7c3b63a57cdad975f55ad7a94f4bb",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-13-17",
        "kind": "data",
        "label": "rotation-v13-tests.json",
        "path": "qa/rotation-v13-tests.json",
        "sha256": "9ef977d0a79e9987927f80d684d4a2e78739f2406188a56f009b1a88d39fd734",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-13",
        "label": "13차 동결 기본형",
        "frozenRound": 13,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "d65140f829bfb6a6c0cf4f6a0f5027518ccc03e677b5110c0e377cd0a267760a",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-13",
        "label": "13차 일반 기본엔진",
        "frozenRound": 13,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "0e3af37218a45467e59d7b67583ddfa4e4bf42d6598e4fb66d3d6f5cb34c7292",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-14",
    "round": 14,
    "label": "14차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-14-0",
        "kind": "image",
        "label": "anatomy-v14-eyes.png",
        "path": "studies/anatomy-v14-eyes.png",
        "sha256": "745ae098337d89bd217dc18e0af273d9441103a54e8324c66b29c923ced3847b",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-14-1",
        "kind": "rotation-sheet",
        "label": "runtime-v14-rotation-female-2.png",
        "path": "studies/runtime-v14-rotation-female-2.png",
        "sha256": "b9c2f0b194a019a0ce57e5ddca91244fc63d49a36c815e07f90bf48692167681",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-14-2",
        "kind": "rotation-sheet",
        "label": "runtime-v14-rotation-female-3.png",
        "path": "studies/runtime-v14-rotation-female-3.png",
        "sha256": "3d2ccdc22b22f73be772bd898e31fe4873fb922e63e4eb36ba8eb54a0dfff4ff",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-14-3",
        "kind": "rotation-sheet",
        "label": "runtime-v14-rotation-female-4.png",
        "path": "studies/runtime-v14-rotation-female-4.png",
        "sha256": "e863fbb59e5c5a0a24482f3b5d05607c08fde611a36b2ff2433dc13d91e10fc6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-14-4",
        "kind": "rotation-sheet",
        "label": "runtime-v14-rotation-female-5.png",
        "path": "studies/runtime-v14-rotation-female-5.png",
        "sha256": "69de7f06dab8fcd854e3228a8520a0ef1d2c2f591146785bfc39804062a76c12",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-14-5",
        "kind": "rotation-sheet",
        "label": "runtime-v14-rotation-female-6.png",
        "path": "studies/runtime-v14-rotation-female-6.png",
        "sha256": "e221dfe6d9620965c7b7f650d4a30935a3895b3e5c80e34e7b01fdff7f65fe24",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-14-6",
        "kind": "rotation-sheet",
        "label": "runtime-v14-rotation-female-7.png",
        "path": "studies/runtime-v14-rotation-female-7.png",
        "sha256": "01e5b945775f5edb725163fde415686bc8195542e164c7547b1f87daba3b939d",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-14-7",
        "kind": "rotation-sheet",
        "label": "runtime-v14-rotation-female-8.png",
        "path": "studies/runtime-v14-rotation-female-8.png",
        "sha256": "0aa6f9a9d08acc05874b981c4ef57c4c1973f59a9183dcdda4ddce921672568a",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-14-8",
        "kind": "rotation-sheet",
        "label": "runtime-v14-rotation-male-2.png",
        "path": "studies/runtime-v14-rotation-male-2.png",
        "sha256": "8e90034853795363cff756274c4ced38a72e3c60b73098c5cc4baa5d1d0d5ece",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-14-9",
        "kind": "rotation-sheet",
        "label": "runtime-v14-rotation-male-3.png",
        "path": "studies/runtime-v14-rotation-male-3.png",
        "sha256": "56581b2777e0a04ccab4dc4f82d25e072c3ff845a4c0a20ec32b1bab88003797",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-14-10",
        "kind": "rotation-sheet",
        "label": "runtime-v14-rotation-male-4.png",
        "path": "studies/runtime-v14-rotation-male-4.png",
        "sha256": "509dba4da1e1f7545d002798d0e5d6bf09eba26066c37df4b8fde41782a0dcf0",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-14-11",
        "kind": "rotation-sheet",
        "label": "runtime-v14-rotation-male-5.png",
        "path": "studies/runtime-v14-rotation-male-5.png",
        "sha256": "d04649d1af3e434ed264adee560475e332ee5425ed03f0ee7124d100e453ba47",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-14-12",
        "kind": "rotation-sheet",
        "label": "runtime-v14-rotation-male-6.png",
        "path": "studies/runtime-v14-rotation-male-6.png",
        "sha256": "8cc7710404ef8b0b6e5f5a19bb777da531ea3a855f1a294372ec209b392d71c8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-14-13",
        "kind": "rotation-sheet",
        "label": "runtime-v14-rotation-male-7.png",
        "path": "studies/runtime-v14-rotation-male-7.png",
        "sha256": "aee905beaa5f77ec290093249e2bd7e7bc804ce39039067df8bd7b0b4f5146cd",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-14-14",
        "kind": "rotation-sheet",
        "label": "runtime-v14-rotation-male-8.png",
        "path": "studies/runtime-v14-rotation-male-8.png",
        "sha256": "dc4301ced3d1a827a01343dd6d55f55802e3679fd87a8c7c7cb61e2f5251d54d",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-14-15",
        "kind": "data",
        "label": "anatomy-v14-tests.json",
        "path": "qa/anatomy-v14-tests.json",
        "sha256": "0268a2cb43fe564c2f912661d4dd407487ef90a756857e5630dbf0263286eb78",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-14-16",
        "kind": "data",
        "label": "rotation-v14-tests.json",
        "path": "qa/rotation-v14-tests.json",
        "sha256": "e871aecd319b3d6414468dd002094ee7311eef7eded035a95cca3fc07673120d",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-14",
        "label": "14차 동결 기본형",
        "frozenRound": 14,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "0f8c99c25ce7278fb63b086ca5f132418fe37cb6a17bb865957e5c54fb1334dc",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-14",
        "label": "14차 일반 기본엔진",
        "frozenRound": 14,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "0e3af37218a45467e59d7b67583ddfa4e4bf42d6598e4fb66d3d6f5cb34c7292",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-15",
    "round": 15,
    "label": "15차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-15-0",
        "kind": "image",
        "label": "anatomy-v15-shadow-body.png",
        "path": "studies/anatomy-v15-shadow-body.png",
        "sha256": "ea3654640d5d6c24991c0bdc44842e9eb2c6359bf72c44501ecd155fe972d9b8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-15-1",
        "kind": "image",
        "label": "anatomy-v15-shadow-face.png",
        "path": "studies/anatomy-v15-shadow-face.png",
        "sha256": "71b1b5f5b39696f0158ab6c29d0287daee1a16bee5885e258fd1a1d6e38c198c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-15-2",
        "kind": "data",
        "label": "lighting-v15-tests.json",
        "path": "qa/lighting-v15-tests.json",
        "sha256": "9948bfb4a94aac515597d44836e7ab26e023501df36baab2cde42aa600cc199b",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-15",
        "label": "15차 동결 기본형",
        "frozenRound": 15,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "1cdc53500a0c6df31fd4f7ecb01dc82028ccd77cbefd872fd35854e06dd472f1",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-15",
        "label": "15차 일반 기본엔진",
        "frozenRound": 15,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "283209e9b85b9b5f2f579f14f10fccac23fe0277df5d4d3280889cc4deceeaef",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-16",
    "round": 16,
    "label": "16차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-16-0",
        "kind": "image",
        "label": "anatomy-v16-legs.png",
        "path": "studies/anatomy-v16-legs.png",
        "sha256": "135ac619e0a1106bdcc2f2da42c1516d49cd4cd656d37fe589aef0eed5f1b6b6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-16-1",
        "kind": "image",
        "label": "anatomy-v16-muscle.png",
        "path": "studies/anatomy-v16-muscle.png",
        "sha256": "62be8f2cf29b6fdc31da5e055d910b7507c797713db7a433ed19928b8600eb86",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-16-2",
        "kind": "image",
        "label": "anatomy-v16-proportions.png",
        "path": "studies/anatomy-v16-proportions.png",
        "sha256": "bfdd10bbf9e28de19151102fc4bbde74e39302b1e52186bcc8419fff01641e99",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-16-3",
        "kind": "rotation-sheet",
        "label": "runtime-v16-rotation-female-2.png",
        "path": "studies/runtime-v16-rotation-female-2.png",
        "sha256": "b9c2f0b194a019a0ce57e5ddca91244fc63d49a36c815e07f90bf48692167681",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-16-4",
        "kind": "rotation-sheet",
        "label": "runtime-v16-rotation-female-3.png",
        "path": "studies/runtime-v16-rotation-female-3.png",
        "sha256": "3d2ccdc22b22f73be772bd898e31fe4873fb922e63e4eb36ba8eb54a0dfff4ff",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-16-5",
        "kind": "rotation-sheet",
        "label": "runtime-v16-rotation-female-4.png",
        "path": "studies/runtime-v16-rotation-female-4.png",
        "sha256": "e863fbb59e5c5a0a24482f3b5d05607c08fde611a36b2ff2433dc13d91e10fc6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-16-6",
        "kind": "rotation-sheet",
        "label": "runtime-v16-rotation-female-5.png",
        "path": "studies/runtime-v16-rotation-female-5.png",
        "sha256": "fa6059774abd7f2b627bb745a2a4237cd53cbd90105017a240f9363391b9dbc1",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-16-7",
        "kind": "rotation-sheet",
        "label": "runtime-v16-rotation-female-6.png",
        "path": "studies/runtime-v16-rotation-female-6.png",
        "sha256": "dada565539e9ef6fe5ed1981276d227a31930fe705f61a8dc33323555882b16b",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-16-8",
        "kind": "rotation-sheet",
        "label": "runtime-v16-rotation-female-7.png",
        "path": "studies/runtime-v16-rotation-female-7.png",
        "sha256": "1077c45fc9ba058a49fdb8bb4713917fde483c3076d368992509b3850639865a",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-16-9",
        "kind": "rotation-sheet",
        "label": "runtime-v16-rotation-female-8.png",
        "path": "studies/runtime-v16-rotation-female-8.png",
        "sha256": "6830b9fa3b0f827401426efa48f149021c7e9eb845d2f10de45c1a1159150c80",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-16-10",
        "kind": "rotation-sheet",
        "label": "runtime-v16-rotation-male-2.png",
        "path": "studies/runtime-v16-rotation-male-2.png",
        "sha256": "8e90034853795363cff756274c4ced38a72e3c60b73098c5cc4baa5d1d0d5ece",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-16-11",
        "kind": "rotation-sheet",
        "label": "runtime-v16-rotation-male-3.png",
        "path": "studies/runtime-v16-rotation-male-3.png",
        "sha256": "56581b2777e0a04ccab4dc4f82d25e072c3ff845a4c0a20ec32b1bab88003797",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-16-12",
        "kind": "rotation-sheet",
        "label": "runtime-v16-rotation-male-4.png",
        "path": "studies/runtime-v16-rotation-male-4.png",
        "sha256": "509dba4da1e1f7545d002798d0e5d6bf09eba26066c37df4b8fde41782a0dcf0",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-16-13",
        "kind": "rotation-sheet",
        "label": "runtime-v16-rotation-male-5.png",
        "path": "studies/runtime-v16-rotation-male-5.png",
        "sha256": "c3f76a4826f04bfdf1019a47f1fa16ad73cb2db4f507a66b9bdbf33b40c451b7",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-16-14",
        "kind": "rotation-sheet",
        "label": "runtime-v16-rotation-male-6.png",
        "path": "studies/runtime-v16-rotation-male-6.png",
        "sha256": "45907813ae77548e755cfd44b7fde2a181391c05a5c86109c91e0102c1ff1320",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-16-15",
        "kind": "rotation-sheet",
        "label": "runtime-v16-rotation-male-7.png",
        "path": "studies/runtime-v16-rotation-male-7.png",
        "sha256": "1cc1c9cde8ddc1b82144c0e41b7abe63a504d7e4b6de086dd45af217ff22f22e",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-16-16",
        "kind": "rotation-sheet",
        "label": "runtime-v16-rotation-male-8.png",
        "path": "studies/runtime-v16-rotation-male-8.png",
        "sha256": "8d0831f46a8c62e94880571f531d9524ad4ada8d4cf9e9bac9310186634f6ad6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-16-17",
        "kind": "data",
        "label": "anatomy-v16-tests.json",
        "path": "qa/anatomy-v16-tests.json",
        "sha256": "2ba04ffe3dd7df72d4c53b965726587ce7d364ef10dff0511f76513805ef4f05",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-16-18",
        "kind": "data",
        "label": "rotation-v16-tests.json",
        "path": "qa/rotation-v16-tests.json",
        "sha256": "eb042c3562ea99154239fc0ef2ed13c78f507f3d865bcb70ef2acc1d0253cc68",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-16",
        "label": "16차 동결 기본형",
        "frozenRound": 16,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "a57ab1e73daaf4bbb13f08f1d2a557e577fbb11114334c723cfabca04b5c8066",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-16",
        "label": "16차 일반 기본엔진",
        "frozenRound": 16,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "acba9a61d83396b420c4b974bcbdd276e1d2867283ceaab388397e3ad747e1f6",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-17",
    "round": 17,
    "label": "17차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-17-0",
        "kind": "image",
        "label": "chibi-v17-comparison.png",
        "path": "studies/chibi-v17-comparison.png",
        "sha256": "78e64cd0131c6e4b4a7cd3f3179b73aceb237612c645ed47e50f26bb28efbf2e",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-17-1",
        "kind": "image",
        "label": "chibi-v17-face.png",
        "path": "studies/chibi-v17-face.png",
        "sha256": "3217d5f7955238e38fa0566f08cd9b85ee063d50b1fc23145a7cd751aea30eae",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-17-2",
        "kind": "rotation-sheet",
        "label": "runtime-v17-rotation-female-2.png",
        "path": "studies/runtime-v17-rotation-female-2.png",
        "sha256": "d21f2478e1548649978edaf10d77dcb10c55f2742b7070a203e819b33e727d21",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-17-3",
        "kind": "rotation-sheet",
        "label": "runtime-v17-rotation-female-3.png",
        "path": "studies/runtime-v17-rotation-female-3.png",
        "sha256": "57a74b691bd6058c520af3f5fc93e391d302be4e66369d84e600d6bb619c970c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-17-4",
        "kind": "rotation-sheet",
        "label": "runtime-v17-rotation-female-4.png",
        "path": "studies/runtime-v17-rotation-female-4.png",
        "sha256": "46f0d2a88276eb8d6e2b923f16c0d3d6c39b9c0567c46c6492da7348056ffbb6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-17-5",
        "kind": "rotation-sheet",
        "label": "runtime-v17-rotation-female-5.png",
        "path": "studies/runtime-v17-rotation-female-5.png",
        "sha256": "fa6059774abd7f2b627bb745a2a4237cd53cbd90105017a240f9363391b9dbc1",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-17-6",
        "kind": "rotation-sheet",
        "label": "runtime-v17-rotation-female-6.png",
        "path": "studies/runtime-v17-rotation-female-6.png",
        "sha256": "dada565539e9ef6fe5ed1981276d227a31930fe705f61a8dc33323555882b16b",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-17-7",
        "kind": "rotation-sheet",
        "label": "runtime-v17-rotation-female-7.png",
        "path": "studies/runtime-v17-rotation-female-7.png",
        "sha256": "1077c45fc9ba058a49fdb8bb4713917fde483c3076d368992509b3850639865a",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-17-8",
        "kind": "rotation-sheet",
        "label": "runtime-v17-rotation-female-8.png",
        "path": "studies/runtime-v17-rotation-female-8.png",
        "sha256": "6830b9fa3b0f827401426efa48f149021c7e9eb845d2f10de45c1a1159150c80",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-17-9",
        "kind": "rotation-sheet",
        "label": "runtime-v17-rotation-male-2.png",
        "path": "studies/runtime-v17-rotation-male-2.png",
        "sha256": "023dd6a66ab37f3215258e9d0700ad201210e9691ba9424ba9d680de47d68a16",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-17-10",
        "kind": "rotation-sheet",
        "label": "runtime-v17-rotation-male-3.png",
        "path": "studies/runtime-v17-rotation-male-3.png",
        "sha256": "10d5ec3575d679cd01a31fc2a3932fac7abb49757d49b57dffc36c2fe7f8577e",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-17-11",
        "kind": "rotation-sheet",
        "label": "runtime-v17-rotation-male-4.png",
        "path": "studies/runtime-v17-rotation-male-4.png",
        "sha256": "f87ff4dee91590979232f4780cadd38760f3e555b5520437c4b01f0ee8159eb1",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-17-12",
        "kind": "rotation-sheet",
        "label": "runtime-v17-rotation-male-5.png",
        "path": "studies/runtime-v17-rotation-male-5.png",
        "sha256": "c3f76a4826f04bfdf1019a47f1fa16ad73cb2db4f507a66b9bdbf33b40c451b7",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-17-13",
        "kind": "rotation-sheet",
        "label": "runtime-v17-rotation-male-6.png",
        "path": "studies/runtime-v17-rotation-male-6.png",
        "sha256": "45907813ae77548e755cfd44b7fde2a181391c05a5c86109c91e0102c1ff1320",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-17-14",
        "kind": "rotation-sheet",
        "label": "runtime-v17-rotation-male-7.png",
        "path": "studies/runtime-v17-rotation-male-7.png",
        "sha256": "1cc1c9cde8ddc1b82144c0e41b7abe63a504d7e4b6de086dd45af217ff22f22e",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-17-15",
        "kind": "rotation-sheet",
        "label": "runtime-v17-rotation-male-8.png",
        "path": "studies/runtime-v17-rotation-male-8.png",
        "sha256": "8d0831f46a8c62e94880571f531d9524ad4ada8d4cf9e9bac9310186634f6ad6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-17-16",
        "kind": "data",
        "label": "anatomy-v18-baseline.json",
        "path": "qa/anatomy-v18-baseline.json",
        "sha256": "c5a5e11f0eec4cc404f8c9911fd46bcb5dd81fd40bf22ccd2787a5d504b8d8bd",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-17-17",
        "kind": "data",
        "label": "chibi-v17-tests.json",
        "path": "qa/chibi-v17-tests.json",
        "sha256": "94eb37ce943f508d1ad1eb4edb1c5c221948eb2b00f8f74db719536247b0c19e",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-17-18",
        "kind": "data",
        "label": "rotation-v17-tests.json",
        "path": "qa/rotation-v17-tests.json",
        "sha256": "eceba2e61d33739807be28036637404dc96d6e2e0204cec4856d1a68afa40da0",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-17",
        "label": "17차 동결 기본형",
        "frozenRound": 17,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "990bfbaf3f10e2b430a6889b47d631c4dff543e914397364141253e319cb751c",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-17",
        "label": "17차 일반 기본엔진",
        "frozenRound": 17,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "acba9a61d83396b420c4b974bcbdd276e1d2867283ceaab388397e3ad747e1f6",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-18",
    "round": 18,
    "label": "18차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-18-0",
        "kind": "image",
        "label": "anatomy-v18-face.png",
        "path": "studies/anatomy-v18-face.png",
        "sha256": "180d4851e6fda74c3b52b63eb520e5fbe4f3894ac44386a87ef12a220fed6110",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-18-1",
        "kind": "rotation-sheet",
        "label": "runtime-v18-rotation-female-2.png",
        "path": "studies/runtime-v18-rotation-female-2.png",
        "sha256": "d21f2478e1548649978edaf10d77dcb10c55f2742b7070a203e819b33e727d21",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-18-2",
        "kind": "rotation-sheet",
        "label": "runtime-v18-rotation-female-3.png",
        "path": "studies/runtime-v18-rotation-female-3.png",
        "sha256": "57a74b691bd6058c520af3f5fc93e391d302be4e66369d84e600d6bb619c970c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-18-3",
        "kind": "rotation-sheet",
        "label": "runtime-v18-rotation-female-4.png",
        "path": "studies/runtime-v18-rotation-female-4.png",
        "sha256": "46f0d2a88276eb8d6e2b923f16c0d3d6c39b9c0567c46c6492da7348056ffbb6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-18-4",
        "kind": "rotation-sheet",
        "label": "runtime-v18-rotation-female-5.png",
        "path": "studies/runtime-v18-rotation-female-5.png",
        "sha256": "f9d9ede2d6f2538dbbeb4c097bcdb9c22a1d0b64abda6b65b78290fed8808bf6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-18-5",
        "kind": "rotation-sheet",
        "label": "runtime-v18-rotation-female-6.png",
        "path": "studies/runtime-v18-rotation-female-6.png",
        "sha256": "b5a408911d545d53d6b0e6f412b58fff084952bf5c1ddda092c731442be6a199",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-18-6",
        "kind": "rotation-sheet",
        "label": "runtime-v18-rotation-female-7.png",
        "path": "studies/runtime-v18-rotation-female-7.png",
        "sha256": "907a0f1feceffd5b5799d5e297657c10560dddad60be971c1d754dbedbe09f90",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-18-7",
        "kind": "rotation-sheet",
        "label": "runtime-v18-rotation-female-8.png",
        "path": "studies/runtime-v18-rotation-female-8.png",
        "sha256": "9fd8601d4e40c2dee6616241736eae051a56457d10d294c8703a7b5abc1572b0",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-18-8",
        "kind": "rotation-sheet",
        "label": "runtime-v18-rotation-male-2.png",
        "path": "studies/runtime-v18-rotation-male-2.png",
        "sha256": "023dd6a66ab37f3215258e9d0700ad201210e9691ba9424ba9d680de47d68a16",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-18-9",
        "kind": "rotation-sheet",
        "label": "runtime-v18-rotation-male-3.png",
        "path": "studies/runtime-v18-rotation-male-3.png",
        "sha256": "10d5ec3575d679cd01a31fc2a3932fac7abb49757d49b57dffc36c2fe7f8577e",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-18-10",
        "kind": "rotation-sheet",
        "label": "runtime-v18-rotation-male-4.png",
        "path": "studies/runtime-v18-rotation-male-4.png",
        "sha256": "f87ff4dee91590979232f4780cadd38760f3e555b5520437c4b01f0ee8159eb1",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-18-11",
        "kind": "rotation-sheet",
        "label": "runtime-v18-rotation-male-5.png",
        "path": "studies/runtime-v18-rotation-male-5.png",
        "sha256": "ad6bd91adc31138ba51258175035a819d66c523d865a3aec8b1b465321896b40",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-18-12",
        "kind": "rotation-sheet",
        "label": "runtime-v18-rotation-male-6.png",
        "path": "studies/runtime-v18-rotation-male-6.png",
        "sha256": "a3df13185fb2a39d7af2e95ff94306bd90ff7da5d678e9ef6b6a5ee30ae3915b",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-18-13",
        "kind": "rotation-sheet",
        "label": "runtime-v18-rotation-male-7.png",
        "path": "studies/runtime-v18-rotation-male-7.png",
        "sha256": "1d11ffac38323a597c0f1922f7e72fbdbc2bd3935b006c27f16a83758903bba7",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-18-14",
        "kind": "rotation-sheet",
        "label": "runtime-v18-rotation-male-8.png",
        "path": "studies/runtime-v18-rotation-male-8.png",
        "sha256": "3bec0ab2d63b7d471365a913eaab520df0e7c1fa8c96bff8b0031c474894b282",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-18-15",
        "kind": "data",
        "label": "anatomy-v18-tests.json",
        "path": "qa/anatomy-v18-tests.json",
        "sha256": "015139005e1cfdd600b48ac5f944e98bde4286afbf0474e515e2bdcecaed95b3",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-18-16",
        "kind": "data",
        "label": "detail-v19-baseline.json",
        "path": "qa/detail-v19-baseline.json",
        "sha256": "4adb87911033b38f88cd445c061d74653b7ccd1ef89f80a830c367be4735716a",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-18-17",
        "kind": "data",
        "label": "rotation-v18-tests.json",
        "path": "qa/rotation-v18-tests.json",
        "sha256": "a4e74e6c670b6d24b9fde41eae086fe9b786771d92562ca75dc5a74930562f83",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-18",
        "label": "18차 동결 기본형",
        "frozenRound": 18,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "0c3c870a216a284745e0b686e0c40f04069693cee038177ad12269459e32eede",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-18",
        "label": "18차 일반 기본엔진",
        "frozenRound": 18,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "acba9a61d83396b420c4b974bcbdd276e1d2867283ceaab388397e3ad747e1f6",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-19",
    "round": 19,
    "label": "19차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-19-0",
        "kind": "image",
        "label": "anatomy-v19-feet.png",
        "path": "studies/anatomy-v19-feet.png",
        "sha256": "e961a0330325d38240f283fb4ccf7b3f444dd36df22708157486c78c0bf1cdaf",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-19-1",
        "kind": "image",
        "label": "anatomy-v19-hands.png",
        "path": "studies/anatomy-v19-hands.png",
        "sha256": "5981a010ff5e0ae4c57b52f7b1fdddf10ac1d2f25aa1af0f4e9bf253c8e79622",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-19-2",
        "kind": "data",
        "label": "anatomy-v20-baseline.json",
        "path": "qa/anatomy-v20-baseline.json",
        "sha256": "cec9be1431bdab5d28eea40bb1a4a2fb7938e0076b89f217d2175db407d3165f",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-19-3",
        "kind": "data",
        "label": "detail-v19-tests.json",
        "path": "qa/detail-v19-tests.json",
        "sha256": "a919d44bfb4a223a7dcf08b3c9ea86b0e57797e75f827594f35fb51226b83583",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-19",
        "label": "19차 동결 기본형",
        "frozenRound": 19,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "d3e1e495edeed2a996bb0544d45b322a4f9667869a6cfa461af46eba2dafb1d9",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-19",
        "label": "19차 일반 기본엔진",
        "frozenRound": 19,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "9180131d4079727ddb20fad26637a085cfe658d7df16745be4e21a0aff4a8e7e",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-20",
    "round": 20,
    "label": "20차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-20-0",
        "kind": "image",
        "label": "anatomy-v20-body.png",
        "path": "studies/anatomy-v20-body.png",
        "sha256": "f675168f3031c2c2238ad34bf3603a560c73319b1358121e28cdbd307b008ffc",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-20-1",
        "kind": "image",
        "label": "anatomy-v20-feet.png",
        "path": "studies/anatomy-v20-feet.png",
        "sha256": "70af5f24b16e8d52a464190b8c97c82cc0aff1a0938944416c7e4713f4fa0c0a",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-20-2",
        "kind": "rotation-sheet",
        "label": "runtime-v20-rotation-female-2.png",
        "path": "studies/runtime-v20-rotation-female-2.png",
        "sha256": "d21f2478e1548649978edaf10d77dcb10c55f2742b7070a203e819b33e727d21",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-20-3",
        "kind": "rotation-sheet",
        "label": "runtime-v20-rotation-female-3.png",
        "path": "studies/runtime-v20-rotation-female-3.png",
        "sha256": "57a74b691bd6058c520af3f5fc93e391d302be4e66369d84e600d6bb619c970c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-20-4",
        "kind": "rotation-sheet",
        "label": "runtime-v20-rotation-female-4.png",
        "path": "studies/runtime-v20-rotation-female-4.png",
        "sha256": "46f0d2a88276eb8d6e2b923f16c0d3d6c39b9c0567c46c6492da7348056ffbb6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-20-5",
        "kind": "rotation-sheet",
        "label": "runtime-v20-rotation-female-5.png",
        "path": "studies/runtime-v20-rotation-female-5.png",
        "sha256": "1868c512e8cc22393de6dd33a324014c04506ff89c8a9e4eb755adf2627ecaf3",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-20-6",
        "kind": "rotation-sheet",
        "label": "runtime-v20-rotation-female-6.png",
        "path": "studies/runtime-v20-rotation-female-6.png",
        "sha256": "0afb5319808de9358561c40c1dc41e16be8d2e900f50c422b3c7a58da61fb360",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-20-7",
        "kind": "rotation-sheet",
        "label": "runtime-v20-rotation-female-7.png",
        "path": "studies/runtime-v20-rotation-female-7.png",
        "sha256": "7833d31cd0193f19a086eb59964739a31c92c30e43af2a23e883ea2cde33641b",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-20-8",
        "kind": "rotation-sheet",
        "label": "runtime-v20-rotation-female-8.png",
        "path": "studies/runtime-v20-rotation-female-8.png",
        "sha256": "74286f5689c849adcef93958c7f6293eaaef35c5d6710736b81426c9ad8d8bf2",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-20-9",
        "kind": "rotation-sheet",
        "label": "runtime-v20-rotation-male-2.png",
        "path": "studies/runtime-v20-rotation-male-2.png",
        "sha256": "023dd6a66ab37f3215258e9d0700ad201210e9691ba9424ba9d680de47d68a16",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-20-10",
        "kind": "rotation-sheet",
        "label": "runtime-v20-rotation-male-3.png",
        "path": "studies/runtime-v20-rotation-male-3.png",
        "sha256": "10d5ec3575d679cd01a31fc2a3932fac7abb49757d49b57dffc36c2fe7f8577e",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-20-11",
        "kind": "rotation-sheet",
        "label": "runtime-v20-rotation-male-4.png",
        "path": "studies/runtime-v20-rotation-male-4.png",
        "sha256": "f87ff4dee91590979232f4780cadd38760f3e555b5520437c4b01f0ee8159eb1",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-20-12",
        "kind": "rotation-sheet",
        "label": "runtime-v20-rotation-male-5.png",
        "path": "studies/runtime-v20-rotation-male-5.png",
        "sha256": "8f4ee561cd24bbae6ca156d0f1b25ca27a028c435f79adb918143ea708084917",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-20-13",
        "kind": "rotation-sheet",
        "label": "runtime-v20-rotation-male-6.png",
        "path": "studies/runtime-v20-rotation-male-6.png",
        "sha256": "87b19f04448c2e4f277f547e903507f900cd394a87f2655ffbd3c04732e7251e",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-20-14",
        "kind": "rotation-sheet",
        "label": "runtime-v20-rotation-male-7.png",
        "path": "studies/runtime-v20-rotation-male-7.png",
        "sha256": "49e3469f06f6c20ce86e4a0dba984ad81fd731035f620edcaf1f6c233ec05763",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-20-15",
        "kind": "rotation-sheet",
        "label": "runtime-v20-rotation-male-8.png",
        "path": "studies/runtime-v20-rotation-male-8.png",
        "sha256": "8e534162276073e8203cffdaea28e365b0531864d58fe5e7a9346d3af800a383",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-20-16",
        "kind": "data",
        "label": "anatomy-v20-tests.json",
        "path": "qa/anatomy-v20-tests.json",
        "sha256": "8cd43dde13d7f06d53c97a764d20b1c1ea0151fd21ed99da5c468cf3f89b5b5c",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-20-17",
        "kind": "data",
        "label": "anatomy-v21-baseline.json",
        "path": "qa/anatomy-v21-baseline.json",
        "sha256": "9b7bda1c1869603400f2101ff74e00b7fdee0b4d0542ff5d6f80bf11fc943ce9",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-20-18",
        "kind": "data",
        "label": "detail-v20-tests.json",
        "path": "qa/detail-v20-tests.json",
        "sha256": "a2f2d32bf97ebedb8913133edd7752bf44da5cb0b039f30ffc9638276f301488",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-20-19",
        "kind": "data",
        "label": "rotation-v20-tests.json",
        "path": "qa/rotation-v20-tests.json",
        "sha256": "2d142cc8b3f9bbde5b89a3ece087881b22fbd5afa1290c044a0a841b3a49e0ba",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-20",
        "label": "20차 동결 기본형",
        "frozenRound": 20,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "3e440b36474cb518e53bdcdee7161db2ea5973bae583d45a8043e245689332d5",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-20",
        "label": "20차 일반 기본엔진",
        "frozenRound": 20,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "9180131d4079727ddb20fad26637a085cfe658d7df16745be4e21a0aff4a8e7e",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-21",
    "round": 21,
    "label": "21차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-21-0",
        "kind": "image",
        "label": "anatomy-v21-body.png",
        "path": "studies/anatomy-v21-body.png",
        "sha256": "b7d323bc0f613d30d05146e428db18477103fad49e6fc349c6557eaddc873975",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-21-1",
        "kind": "image",
        "label": "anatomy-v21-chest.png",
        "path": "studies/anatomy-v21-chest.png",
        "sha256": "05cd2dc3f2f74f9ddf5b6e48541733394452dd7d593576ff0262b8474292a7e6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-21-2",
        "kind": "rotation-sheet",
        "label": "runtime-v21-rotation-female-2.png",
        "path": "studies/runtime-v21-rotation-female-2.png",
        "sha256": "d21f2478e1548649978edaf10d77dcb10c55f2742b7070a203e819b33e727d21",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-21-3",
        "kind": "rotation-sheet",
        "label": "runtime-v21-rotation-female-3.png",
        "path": "studies/runtime-v21-rotation-female-3.png",
        "sha256": "57a74b691bd6058c520af3f5fc93e391d302be4e66369d84e600d6bb619c970c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-21-4",
        "kind": "rotation-sheet",
        "label": "runtime-v21-rotation-female-4.png",
        "path": "studies/runtime-v21-rotation-female-4.png",
        "sha256": "46f0d2a88276eb8d6e2b923f16c0d3d6c39b9c0567c46c6492da7348056ffbb6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-21-5",
        "kind": "rotation-sheet",
        "label": "runtime-v21-rotation-female-5.png",
        "path": "studies/runtime-v21-rotation-female-5.png",
        "sha256": "64a40a4d0dca71467f0367b878c1c144480fe44c8ca6da36e755664dedd0d0ae",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-21-6",
        "kind": "rotation-sheet",
        "label": "runtime-v21-rotation-female-6.png",
        "path": "studies/runtime-v21-rotation-female-6.png",
        "sha256": "87c443fdf9d265bde00183ffe2b267d43bace2091b52d9288a32580db72fefde",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-21-7",
        "kind": "rotation-sheet",
        "label": "runtime-v21-rotation-female-7.png",
        "path": "studies/runtime-v21-rotation-female-7.png",
        "sha256": "6354f4856bec1c8a6c79b3a54dcbb58dc1a9a1a9d776f4accb50541cde2c6700",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-21-8",
        "kind": "rotation-sheet",
        "label": "runtime-v21-rotation-female-8.png",
        "path": "studies/runtime-v21-rotation-female-8.png",
        "sha256": "e4df5aa90b2971365df7e8c945b93d9f1b1f5e0e8da27febc6364ae4346d2b19",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-21-9",
        "kind": "rotation-sheet",
        "label": "runtime-v21-rotation-male-2.png",
        "path": "studies/runtime-v21-rotation-male-2.png",
        "sha256": "023dd6a66ab37f3215258e9d0700ad201210e9691ba9424ba9d680de47d68a16",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-21-10",
        "kind": "rotation-sheet",
        "label": "runtime-v21-rotation-male-3.png",
        "path": "studies/runtime-v21-rotation-male-3.png",
        "sha256": "10d5ec3575d679cd01a31fc2a3932fac7abb49757d49b57dffc36c2fe7f8577e",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-21-11",
        "kind": "rotation-sheet",
        "label": "runtime-v21-rotation-male-4.png",
        "path": "studies/runtime-v21-rotation-male-4.png",
        "sha256": "f87ff4dee91590979232f4780cadd38760f3e555b5520437c4b01f0ee8159eb1",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-21-12",
        "kind": "rotation-sheet",
        "label": "runtime-v21-rotation-male-5.png",
        "path": "studies/runtime-v21-rotation-male-5.png",
        "sha256": "8f4ee561cd24bbae6ca156d0f1b25ca27a028c435f79adb918143ea708084917",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-21-13",
        "kind": "rotation-sheet",
        "label": "runtime-v21-rotation-male-6.png",
        "path": "studies/runtime-v21-rotation-male-6.png",
        "sha256": "87b19f04448c2e4f277f547e903507f900cd394a87f2655ffbd3c04732e7251e",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-21-14",
        "kind": "rotation-sheet",
        "label": "runtime-v21-rotation-male-7.png",
        "path": "studies/runtime-v21-rotation-male-7.png",
        "sha256": "49e3469f06f6c20ce86e4a0dba984ad81fd731035f620edcaf1f6c233ec05763",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-21-15",
        "kind": "rotation-sheet",
        "label": "runtime-v21-rotation-male-8.png",
        "path": "studies/runtime-v21-rotation-male-8.png",
        "sha256": "8e534162276073e8203cffdaea28e365b0531864d58fe5e7a9346d3af800a383",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-21-16",
        "kind": "data",
        "label": "anatomy-v21-tests.json",
        "path": "qa/anatomy-v21-tests.json",
        "sha256": "b0de5143f6d2d0fb6315f7f0884e72ea23b40d973e2e34ffe3a80c2fbcda040a",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-21-17",
        "kind": "data",
        "label": "anatomy-v22-baseline.json",
        "path": "qa/anatomy-v22-baseline.json",
        "sha256": "de921a6cea40f1e6beeda427a16a2f3863d3ca1f25fd92d674ded1c4f20a9107",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-21-18",
        "kind": "data",
        "label": "rotation-v21-tests.json",
        "path": "qa/rotation-v21-tests.json",
        "sha256": "ba5f9cebd3780a2fe969edd72071191335f31397a251bc22af0fa59a3858e88d",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-21",
        "label": "21차 동결 기본형",
        "frozenRound": 21,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "281c0608afea051bd7af6d7109225cec7a7911fb4fe37f3bb56b9d32d870661f",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-21",
        "label": "21차 일반 기본엔진",
        "frozenRound": 21,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "9180131d4079727ddb20fad26637a085cfe658d7df16745be4e21a0aff4a8e7e",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-22",
    "round": 22,
    "label": "22차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-22-0",
        "kind": "image",
        "label": "anatomy-v22-face.png",
        "path": "studies/anatomy-v22-face.png",
        "sha256": "d42dc0d305a9ec7e6e0674bac2daa515d254c78fcee9e02001e922356031a620",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-22-1",
        "kind": "image",
        "label": "anatomy-v22-face128.png",
        "path": "studies/anatomy-v22-face128.png",
        "sha256": "07f8ccfeca1eb2202683faf514a74fd2d884593db7a1dff9466f2f8a0b0128bd",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-22-2",
        "kind": "rotation-sheet",
        "label": "runtime-v22-rotation-female-2.png",
        "path": "studies/runtime-v22-rotation-female-2.png",
        "sha256": "d21f2478e1548649978edaf10d77dcb10c55f2742b7070a203e819b33e727d21",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-22-3",
        "kind": "rotation-sheet",
        "label": "runtime-v22-rotation-female-3.png",
        "path": "studies/runtime-v22-rotation-female-3.png",
        "sha256": "57a74b691bd6058c520af3f5fc93e391d302be4e66369d84e600d6bb619c970c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-22-4",
        "kind": "rotation-sheet",
        "label": "runtime-v22-rotation-female-4.png",
        "path": "studies/runtime-v22-rotation-female-4.png",
        "sha256": "46f0d2a88276eb8d6e2b923f16c0d3d6c39b9c0567c46c6492da7348056ffbb6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-22-5",
        "kind": "rotation-sheet",
        "label": "runtime-v22-rotation-female-5.png",
        "path": "studies/runtime-v22-rotation-female-5.png",
        "sha256": "3b004f09b733922a025b54b54ed3625d6368231875a3522120d20d380dfe1aa5",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-22-6",
        "kind": "rotation-sheet",
        "label": "runtime-v22-rotation-female-6.png",
        "path": "studies/runtime-v22-rotation-female-6.png",
        "sha256": "41799f75759d2450690ddf45df490a4870bf87696c78c67eb74143bd100bf775",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-22-7",
        "kind": "rotation-sheet",
        "label": "runtime-v22-rotation-female-7.png",
        "path": "studies/runtime-v22-rotation-female-7.png",
        "sha256": "fb3b8f374f9d691379c493b1b74bcd202f32f99be6b951424b7d39ebb68034f6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-22-8",
        "kind": "rotation-sheet",
        "label": "runtime-v22-rotation-female-8.png",
        "path": "studies/runtime-v22-rotation-female-8.png",
        "sha256": "0fbac481c400e245bf3cfa8efce472d7ffa10a91e3d6541eadc3c041d7d87c14",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-22-9",
        "kind": "rotation-sheet",
        "label": "runtime-v22-rotation-male-2.png",
        "path": "studies/runtime-v22-rotation-male-2.png",
        "sha256": "023dd6a66ab37f3215258e9d0700ad201210e9691ba9424ba9d680de47d68a16",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-22-10",
        "kind": "rotation-sheet",
        "label": "runtime-v22-rotation-male-3.png",
        "path": "studies/runtime-v22-rotation-male-3.png",
        "sha256": "10d5ec3575d679cd01a31fc2a3932fac7abb49757d49b57dffc36c2fe7f8577e",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-22-11",
        "kind": "rotation-sheet",
        "label": "runtime-v22-rotation-male-4.png",
        "path": "studies/runtime-v22-rotation-male-4.png",
        "sha256": "f87ff4dee91590979232f4780cadd38760f3e555b5520437c4b01f0ee8159eb1",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-22-12",
        "kind": "rotation-sheet",
        "label": "runtime-v22-rotation-male-5.png",
        "path": "studies/runtime-v22-rotation-male-5.png",
        "sha256": "2242db1e40da6452e89139971731241dce53bef4178e0db49ff14cc3cbcf57b0",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-22-13",
        "kind": "rotation-sheet",
        "label": "runtime-v22-rotation-male-6.png",
        "path": "studies/runtime-v22-rotation-male-6.png",
        "sha256": "cb3bd724c4b324c035eaf85ebef8bbeca9394c908d8b587893357cf777e7b0c3",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-22-14",
        "kind": "rotation-sheet",
        "label": "runtime-v22-rotation-male-7.png",
        "path": "studies/runtime-v22-rotation-male-7.png",
        "sha256": "b1a2c33a8e09085a877d2a475790a17e57f75dc0efd588b8fc068808a337c7d3",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-22-15",
        "kind": "rotation-sheet",
        "label": "runtime-v22-rotation-male-8.png",
        "path": "studies/runtime-v22-rotation-male-8.png",
        "sha256": "d227e710890ae269c6f6865844abe78ddcf0bb845a8b8253d69dd33fd131c5f3",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-22-16",
        "kind": "data",
        "label": "anatomy-v22-tests.json",
        "path": "qa/anatomy-v22-tests.json",
        "sha256": "1b6c4f0893f92095910a2e58cdb1379dcd0ea55b3e13c9f3f3989325e258a95e",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-22-17",
        "kind": "data",
        "label": "rotation-v22-tests.json",
        "path": "qa/rotation-v22-tests.json",
        "sha256": "32db9a87d73376638c251231518611537706e8d8d29dab2103fc6bae16c1fb0e",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-22",
        "label": "22차 동결 기본형",
        "frozenRound": 22,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "760b25b2c7add40e78b212c0161af3f94e331d49179c7eabe4ca9ebd34f0206f",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-22",
        "label": "22차 일반 기본엔진",
        "frozenRound": 22,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "c1250b919e8cf8663f0bb6ebf8cd24cb20cf2e8e1fd3dcb41adc3f49d806f951",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-23",
    "round": 23,
    "label": "23차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-23-0",
        "kind": "image",
        "label": "chibi-v23-body.png",
        "path": "studies/chibi-v23-body.png",
        "sha256": "32acbaa3a60b98db93d97bac0b49dcd35c623fca335fb02e1149752155d2ce1e",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-23-1",
        "kind": "image",
        "label": "chibi-v23-hands.png",
        "path": "studies/chibi-v23-hands.png",
        "sha256": "504434536fbc4494371931ae1d51101c15bdf7c53dafa3175af27d6fae07b15c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-23-2",
        "kind": "rotation-sheet",
        "label": "runtime-v23-rotation-female-2.png",
        "path": "studies/runtime-v23-rotation-female-2.png",
        "sha256": "284ea049d223cf548855e3e6f010a4d74261913f0ac0ee88a8d7ce4f15b94623",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-23-3",
        "kind": "rotation-sheet",
        "label": "runtime-v23-rotation-female-3.png",
        "path": "studies/runtime-v23-rotation-female-3.png",
        "sha256": "3ef87ed31ee29b32067e3dc45316fd76b51c1419ccbbcc0742b5b487b5d817c3",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-23-4",
        "kind": "rotation-sheet",
        "label": "runtime-v23-rotation-female-4.png",
        "path": "studies/runtime-v23-rotation-female-4.png",
        "sha256": "f8a8d5f84ba04cf24b87c10b4e0cd67278b306e20f82008560cc26397250e280",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-23-5",
        "kind": "rotation-sheet",
        "label": "runtime-v23-rotation-female-5.png",
        "path": "studies/runtime-v23-rotation-female-5.png",
        "sha256": "3b004f09b733922a025b54b54ed3625d6368231875a3522120d20d380dfe1aa5",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-23-6",
        "kind": "rotation-sheet",
        "label": "runtime-v23-rotation-female-6.png",
        "path": "studies/runtime-v23-rotation-female-6.png",
        "sha256": "41799f75759d2450690ddf45df490a4870bf87696c78c67eb74143bd100bf775",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-23-7",
        "kind": "rotation-sheet",
        "label": "runtime-v23-rotation-female-7.png",
        "path": "studies/runtime-v23-rotation-female-7.png",
        "sha256": "fb3b8f374f9d691379c493b1b74bcd202f32f99be6b951424b7d39ebb68034f6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-23-8",
        "kind": "rotation-sheet",
        "label": "runtime-v23-rotation-female-8.png",
        "path": "studies/runtime-v23-rotation-female-8.png",
        "sha256": "0fbac481c400e245bf3cfa8efce472d7ffa10a91e3d6541eadc3c041d7d87c14",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-23-9",
        "kind": "rotation-sheet",
        "label": "runtime-v23-rotation-male-2.png",
        "path": "studies/runtime-v23-rotation-male-2.png",
        "sha256": "022c0fd9a1e10882fa45ad6c8053287663bd3f598b69a17533c82f050419cbfe",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-23-10",
        "kind": "rotation-sheet",
        "label": "runtime-v23-rotation-male-3.png",
        "path": "studies/runtime-v23-rotation-male-3.png",
        "sha256": "6386c69d0ef708b2a9260a6013a116bf4951cd755768f9532027ff4239ce69d2",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-23-11",
        "kind": "rotation-sheet",
        "label": "runtime-v23-rotation-male-4.png",
        "path": "studies/runtime-v23-rotation-male-4.png",
        "sha256": "c804e88d1e05bbb279d274cbb319fb5aefbf1a6b23d6d2b29761f413d7372af8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-23-12",
        "kind": "rotation-sheet",
        "label": "runtime-v23-rotation-male-5.png",
        "path": "studies/runtime-v23-rotation-male-5.png",
        "sha256": "2242db1e40da6452e89139971731241dce53bef4178e0db49ff14cc3cbcf57b0",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-23-13",
        "kind": "rotation-sheet",
        "label": "runtime-v23-rotation-male-6.png",
        "path": "studies/runtime-v23-rotation-male-6.png",
        "sha256": "cb3bd724c4b324c035eaf85ebef8bbeca9394c908d8b587893357cf777e7b0c3",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-23-14",
        "kind": "rotation-sheet",
        "label": "runtime-v23-rotation-male-7.png",
        "path": "studies/runtime-v23-rotation-male-7.png",
        "sha256": "b1a2c33a8e09085a877d2a475790a17e57f75dc0efd588b8fc068808a337c7d3",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-23-15",
        "kind": "rotation-sheet",
        "label": "runtime-v23-rotation-male-8.png",
        "path": "studies/runtime-v23-rotation-male-8.png",
        "sha256": "d227e710890ae269c6f6865844abe78ddcf0bb845a8b8253d69dd33fd131c5f3",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-23-16",
        "kind": "data",
        "label": "anatomy-v24-baseline.json",
        "path": "qa/anatomy-v24-baseline.json",
        "sha256": "b3d36cbd4f65357ddd5f4bbadb47651006cf4c19b7b3c19134de58629216587d",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-23-17",
        "kind": "data",
        "label": "chibi-v23-tests.json",
        "path": "qa/chibi-v23-tests.json",
        "sha256": "a0d5af7e52f8675b4395de11dc1058a53ee0c72a712c455f5575c7a70d43e5a4",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-23-18",
        "kind": "data",
        "label": "detail-v23-tests.json",
        "path": "qa/detail-v23-tests.json",
        "sha256": "39059b5f7e070c46b63cbaadba6a989a3b36e7cdfbe8fc2a12aea04acaa0a5b9",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-23-19",
        "kind": "data",
        "label": "rotation-v23-tests.json",
        "path": "qa/rotation-v23-tests.json",
        "sha256": "b01426f9e6f2e67b5e4ad9308e6c1438319038a6c16aad385570fe581e8737a9",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-23",
        "label": "23차 동결 기본형",
        "frozenRound": 23,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "e71a913db0fa5ce543d7c8f1a7772a7cc10236d2cdaa337661b11ce94718ab21",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-23",
        "label": "23차 일반 기본엔진",
        "frozenRound": 23,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "ce4cced3f4e75f2e311091c3d5657ebd8e5027a71271f4d6491c0f74a43f269c",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-24",
    "round": 24,
    "label": "24차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-24-0",
        "kind": "image",
        "label": "anatomy-v24-female.png",
        "path": "studies/anatomy-v24-female.png",
        "sha256": "ba7b163194cafebcc98f898f6c293007c38d3436a8abccd7db6548929ba1f706",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-24-1",
        "kind": "image",
        "label": "anatomy-v24-male.png",
        "path": "studies/anatomy-v24-male.png",
        "sha256": "13f1c9c229180d46790d054e001a7a383f13f2043337786c3d841ac0304d9ad8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-24-2",
        "kind": "rotation-sheet",
        "label": "runtime-v24-rotation-female-2.png",
        "path": "studies/runtime-v24-rotation-female-2.png",
        "sha256": "284ea049d223cf548855e3e6f010a4d74261913f0ac0ee88a8d7ce4f15b94623",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-24-3",
        "kind": "rotation-sheet",
        "label": "runtime-v24-rotation-female-3.png",
        "path": "studies/runtime-v24-rotation-female-3.png",
        "sha256": "3ef87ed31ee29b32067e3dc45316fd76b51c1419ccbbcc0742b5b487b5d817c3",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-24-4",
        "kind": "rotation-sheet",
        "label": "runtime-v24-rotation-female-4.png",
        "path": "studies/runtime-v24-rotation-female-4.png",
        "sha256": "f8a8d5f84ba04cf24b87c10b4e0cd67278b306e20f82008560cc26397250e280",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-24-5",
        "kind": "rotation-sheet",
        "label": "runtime-v24-rotation-female-5.png",
        "path": "studies/runtime-v24-rotation-female-5.png",
        "sha256": "d339b3607d1d2d9f687d2b6c469926eeabf1f3554fa8ace6c3828bfd86b6f8b3",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-24-6",
        "kind": "rotation-sheet",
        "label": "runtime-v24-rotation-female-6.png",
        "path": "studies/runtime-v24-rotation-female-6.png",
        "sha256": "0767bc0cebf1d55abbddebe3bd678721ab2fdc8b959b502d269ae55e71613751",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-24-7",
        "kind": "rotation-sheet",
        "label": "runtime-v24-rotation-female-7.png",
        "path": "studies/runtime-v24-rotation-female-7.png",
        "sha256": "fc3a468686b3a0d66b321409a79d809e5fd9c560e7f2df38eb8def12acee0e4b",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-24-8",
        "kind": "rotation-sheet",
        "label": "runtime-v24-rotation-female-8.png",
        "path": "studies/runtime-v24-rotation-female-8.png",
        "sha256": "0fbac481c400e245bf3cfa8efce472d7ffa10a91e3d6541eadc3c041d7d87c14",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-24-9",
        "kind": "rotation-sheet",
        "label": "runtime-v24-rotation-male-2.png",
        "path": "studies/runtime-v24-rotation-male-2.png",
        "sha256": "022c0fd9a1e10882fa45ad6c8053287663bd3f598b69a17533c82f050419cbfe",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-24-10",
        "kind": "rotation-sheet",
        "label": "runtime-v24-rotation-male-3.png",
        "path": "studies/runtime-v24-rotation-male-3.png",
        "sha256": "6386c69d0ef708b2a9260a6013a116bf4951cd755768f9532027ff4239ce69d2",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-24-11",
        "kind": "rotation-sheet",
        "label": "runtime-v24-rotation-male-4.png",
        "path": "studies/runtime-v24-rotation-male-4.png",
        "sha256": "c804e88d1e05bbb279d274cbb319fb5aefbf1a6b23d6d2b29761f413d7372af8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-24-12",
        "kind": "rotation-sheet",
        "label": "runtime-v24-rotation-male-5.png",
        "path": "studies/runtime-v24-rotation-male-5.png",
        "sha256": "0a66480fae2cca2a62dec21c07be0098e20ea1c1db9159984950fc10ce051095",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-24-13",
        "kind": "rotation-sheet",
        "label": "runtime-v24-rotation-male-6.png",
        "path": "studies/runtime-v24-rotation-male-6.png",
        "sha256": "7cc23f404284b52596b1fd7b33a9c0ec518b37ad28343e79ced75933da085bd6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-24-14",
        "kind": "rotation-sheet",
        "label": "runtime-v24-rotation-male-7.png",
        "path": "studies/runtime-v24-rotation-male-7.png",
        "sha256": "df535ee07f999e789c70fe76a249fc805d1c8942d094898b390cd8a28a11e67e",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-24-15",
        "kind": "rotation-sheet",
        "label": "runtime-v24-rotation-male-8.png",
        "path": "studies/runtime-v24-rotation-male-8.png",
        "sha256": "d227e710890ae269c6f6865844abe78ddcf0bb845a8b8253d69dd33fd131c5f3",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-24-16",
        "kind": "data",
        "label": "anatomy-v24-tests.json",
        "path": "qa/anatomy-v24-tests.json",
        "sha256": "401dc7221c9998c5188e72a37e9ddf61a09679c460822064c2bd732f0616efd0",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-24-17",
        "kind": "data",
        "label": "detail-v24-tests.json",
        "path": "qa/detail-v24-tests.json",
        "sha256": "30ce701b702fc7997c71b211e218c0cdc89602a989d7ee3804e7aa0c5d484d7b",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-24-18",
        "kind": "data",
        "label": "lighting-v25-baseline.json",
        "path": "qa/lighting-v25-baseline.json",
        "sha256": "71efccf0dc4ce865025eafa26945c4b3c5f5f2bbf215e43382da1f9a4c11ad22",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-24-19",
        "kind": "data",
        "label": "rotation-v24-tests.json",
        "path": "qa/rotation-v24-tests.json",
        "sha256": "5f3a69cd718d32a7867eaf39af8602352072362693e89b4d1d6cd7a70225dfc0",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-24",
        "label": "24차 동결 기본형",
        "frozenRound": 24,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "61710dfcccd07d996208947e91653221299a11568931df4db9b6e757cda2fa72",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-24",
        "label": "24차 일반 기본엔진",
        "frozenRound": 24,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "ce4cced3f4e75f2e311091c3d5657ebd8e5027a71271f4d6491c0f74a43f269c",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-25",
    "round": 25,
    "label": "25차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-25-0",
        "kind": "image",
        "label": "anatomy-v25-face.png",
        "path": "studies/anatomy-v25-face.png",
        "sha256": "b9354602f21890e93ccba0ba5f6266c40f4f7bbf12365bc989bde999d46aa1f2",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-25-1",
        "kind": "image",
        "label": "anatomy-v25-torso.png",
        "path": "studies/anatomy-v25-torso.png",
        "sha256": "bd284137e95487c454f082c39cb1f420ebe94f99806d35b672a6a362f43d577c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-25-2",
        "kind": "image",
        "label": "anatomy-v25-whole128.png",
        "path": "studies/anatomy-v25-whole128.png",
        "sha256": "59e90d7324ed8ad510674a335186e060fa558cd782347f4f42907e64d71c1759",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-25-3",
        "kind": "rotation-sheet",
        "label": "runtime-v25-rotation-female-2.png",
        "path": "studies/runtime-v25-rotation-female-2.png",
        "sha256": "284ea049d223cf548855e3e6f010a4d74261913f0ac0ee88a8d7ce4f15b94623",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-25-4",
        "kind": "rotation-sheet",
        "label": "runtime-v25-rotation-female-3.png",
        "path": "studies/runtime-v25-rotation-female-3.png",
        "sha256": "3ef87ed31ee29b32067e3dc45316fd76b51c1419ccbbcc0742b5b487b5d817c3",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-25-5",
        "kind": "rotation-sheet",
        "label": "runtime-v25-rotation-female-4.png",
        "path": "studies/runtime-v25-rotation-female-4.png",
        "sha256": "f8a8d5f84ba04cf24b87c10b4e0cd67278b306e20f82008560cc26397250e280",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-25-6",
        "kind": "rotation-sheet",
        "label": "runtime-v25-rotation-female-5.png",
        "path": "studies/runtime-v25-rotation-female-5.png",
        "sha256": "8a3cde10378de76df047a0e0f5a39dd7d729d9bba141dba17c1ad1af7873d77c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-25-7",
        "kind": "rotation-sheet",
        "label": "runtime-v25-rotation-female-6.png",
        "path": "studies/runtime-v25-rotation-female-6.png",
        "sha256": "b281b787be53c66cb9b7867eea31f1be1d89fb9cf4558644739322ee3fab7d88",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-25-8",
        "kind": "rotation-sheet",
        "label": "runtime-v25-rotation-female-7.png",
        "path": "studies/runtime-v25-rotation-female-7.png",
        "sha256": "757c528944ca854f0621cc0adcd458917b383ab14ad932968f30865345b015c4",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-25-9",
        "kind": "rotation-sheet",
        "label": "runtime-v25-rotation-female-8.png",
        "path": "studies/runtime-v25-rotation-female-8.png",
        "sha256": "1e2befd49c9a3954448a0fde3714f99b842561ac8c14906572db5339d29b7b7c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-25-10",
        "kind": "rotation-sheet",
        "label": "runtime-v25-rotation-male-2.png",
        "path": "studies/runtime-v25-rotation-male-2.png",
        "sha256": "022c0fd9a1e10882fa45ad6c8053287663bd3f598b69a17533c82f050419cbfe",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-25-11",
        "kind": "rotation-sheet",
        "label": "runtime-v25-rotation-male-3.png",
        "path": "studies/runtime-v25-rotation-male-3.png",
        "sha256": "6386c69d0ef708b2a9260a6013a116bf4951cd755768f9532027ff4239ce69d2",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-25-12",
        "kind": "rotation-sheet",
        "label": "runtime-v25-rotation-male-4.png",
        "path": "studies/runtime-v25-rotation-male-4.png",
        "sha256": "c804e88d1e05bbb279d274cbb319fb5aefbf1a6b23d6d2b29761f413d7372af8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-25-13",
        "kind": "rotation-sheet",
        "label": "runtime-v25-rotation-male-5.png",
        "path": "studies/runtime-v25-rotation-male-5.png",
        "sha256": "59fcfec961c3f6efa7ac830f59076d851fb9729aea79dd7c9a21520bf1c62fad",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-25-14",
        "kind": "rotation-sheet",
        "label": "runtime-v25-rotation-male-6.png",
        "path": "studies/runtime-v25-rotation-male-6.png",
        "sha256": "1bb5c04e4e322f3490cd0c4104f59f7acf0bb9cff87cd247e798e52ce3bc9f08",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-25-15",
        "kind": "rotation-sheet",
        "label": "runtime-v25-rotation-male-7.png",
        "path": "studies/runtime-v25-rotation-male-7.png",
        "sha256": "4101a35cb91d746ca3a72032771fc889b9009395e204b085c740fdd3e3985a8d",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-25-16",
        "kind": "rotation-sheet",
        "label": "runtime-v25-rotation-male-8.png",
        "path": "studies/runtime-v25-rotation-male-8.png",
        "sha256": "0cbe581319635257d6e08c433f4a4355481b906735612ec5dfeb6d603c510008",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-25-17",
        "kind": "data",
        "label": "lighting-v25-tests.json",
        "path": "qa/lighting-v25-tests.json",
        "sha256": "8ebdafefc86bc258c22be4c4e1af51ff2f8aa799ec418102fdd2343221a3ea1b",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-25-18",
        "kind": "data",
        "label": "rotation-v25-tests.json",
        "path": "qa/rotation-v25-tests.json",
        "sha256": "bb52dfea2f1fd4560c6e29b7c8a8df854b218e63711995773a662db09c75ce03",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-25",
        "label": "25차 동결 기본형",
        "frozenRound": 25,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "daee7cc094e0feef80335c884f335b1b7b54b630ac9ac1980661528087d567cf",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-25",
        "label": "25차 일반 기본엔진",
        "frozenRound": 25,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "21cf495c4880a61a26d3e9d59f02bb15c0a8154f814d336e8d572216396faf91",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-26",
    "round": 26,
    "label": "26차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-26-0",
        "kind": "image",
        "label": "anatomy-v26-face-pitch.png",
        "path": "studies/anatomy-v26-face-pitch.png",
        "sha256": "8981b70c7a5aff7de0216766872c1e7286c76a7ce0bb08e8ef94beb6e0b047c4",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-26-1",
        "kind": "image",
        "label": "anatomy-v26-face.png",
        "path": "studies/anatomy-v26-face.png",
        "sha256": "dc294727fc95a8f392a698062891dc4cd25fd4c7c0d8e3cc2594c853e4c0c3e4",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-26-2",
        "kind": "image",
        "label": "anatomy-v26-face128.png",
        "path": "studies/anatomy-v26-face128.png",
        "sha256": "2b8c0ae377a69c15991bd973621606a0fdc2de6bec4ff6fc83d5531ccfbb5a25",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-26-3",
        "kind": "rotation-sheet",
        "label": "runtime-v26-rotation-female-2.png",
        "path": "studies/runtime-v26-rotation-female-2.png",
        "sha256": "284ea049d223cf548855e3e6f010a4d74261913f0ac0ee88a8d7ce4f15b94623",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-26-4",
        "kind": "rotation-sheet",
        "label": "runtime-v26-rotation-female-3.png",
        "path": "studies/runtime-v26-rotation-female-3.png",
        "sha256": "3ef87ed31ee29b32067e3dc45316fd76b51c1419ccbbcc0742b5b487b5d817c3",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-26-5",
        "kind": "rotation-sheet",
        "label": "runtime-v26-rotation-female-4.png",
        "path": "studies/runtime-v26-rotation-female-4.png",
        "sha256": "f8a8d5f84ba04cf24b87c10b4e0cd67278b306e20f82008560cc26397250e280",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-26-6",
        "kind": "rotation-sheet",
        "label": "runtime-v26-rotation-female-5.png",
        "path": "studies/runtime-v26-rotation-female-5.png",
        "sha256": "6099b0d40ae6bb96294103685de1a77c6fa3c5809e49860e949e33bfa3c6dd07",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-26-7",
        "kind": "rotation-sheet",
        "label": "runtime-v26-rotation-female-6.png",
        "path": "studies/runtime-v26-rotation-female-6.png",
        "sha256": "4cc7eabcf4eb136fff30ae7a0574c1212ca43419637160077500bdf4ca9cb462",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-26-8",
        "kind": "rotation-sheet",
        "label": "runtime-v26-rotation-female-7.png",
        "path": "studies/runtime-v26-rotation-female-7.png",
        "sha256": "cf08209c9258b9e77c42e02d6ff280e7d68c746f8532aeb1e69468bc3df24f11",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-26-9",
        "kind": "rotation-sheet",
        "label": "runtime-v26-rotation-female-8.png",
        "path": "studies/runtime-v26-rotation-female-8.png",
        "sha256": "5f1f0b249eaaf99f512eb17d950cf5d56b8e821d242767ba0dc780503ba653cf",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-26-10",
        "kind": "rotation-sheet",
        "label": "runtime-v26-rotation-male-2.png",
        "path": "studies/runtime-v26-rotation-male-2.png",
        "sha256": "022c0fd9a1e10882fa45ad6c8053287663bd3f598b69a17533c82f050419cbfe",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-26-11",
        "kind": "rotation-sheet",
        "label": "runtime-v26-rotation-male-3.png",
        "path": "studies/runtime-v26-rotation-male-3.png",
        "sha256": "6386c69d0ef708b2a9260a6013a116bf4951cd755768f9532027ff4239ce69d2",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-26-12",
        "kind": "rotation-sheet",
        "label": "runtime-v26-rotation-male-4.png",
        "path": "studies/runtime-v26-rotation-male-4.png",
        "sha256": "c804e88d1e05bbb279d274cbb319fb5aefbf1a6b23d6d2b29761f413d7372af8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-26-13",
        "kind": "rotation-sheet",
        "label": "runtime-v26-rotation-male-5.png",
        "path": "studies/runtime-v26-rotation-male-5.png",
        "sha256": "6553d4b420e6e5c936c866e0c308d17b91bd1cac28758ed945982bf109084738",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-26-14",
        "kind": "rotation-sheet",
        "label": "runtime-v26-rotation-male-6.png",
        "path": "studies/runtime-v26-rotation-male-6.png",
        "sha256": "7855b23d002191b7e0c1213007d82edf07e6eab4be61078f8bef7957e9744f5b",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-26-15",
        "kind": "rotation-sheet",
        "label": "runtime-v26-rotation-male-7.png",
        "path": "studies/runtime-v26-rotation-male-7.png",
        "sha256": "48447eea71b036ab819937ff57df1ce9e889facbe380173704c617ed5e1418b7",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-26-16",
        "kind": "rotation-sheet",
        "label": "runtime-v26-rotation-male-8.png",
        "path": "studies/runtime-v26-rotation-male-8.png",
        "sha256": "e5a7b6f4bd69ad5964ba051116932d158bf15a9ed3516a937955bb5ce6302be2",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-26-17",
        "kind": "data",
        "label": "lips-v26-tests.json",
        "path": "qa/lips-v26-tests.json",
        "sha256": "8bba327df934351de969357fd0cd466cb433bd37c392fde68eb40d19bc2d2563",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-26-18",
        "kind": "data",
        "label": "rotation-v26-tests.json",
        "path": "qa/rotation-v26-tests.json",
        "sha256": "9fb81bf97de36b9b099f7bfaa730346e52e939624c38348c073daceca545bbb3",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-26",
        "label": "26차 동결 기본형",
        "frozenRound": 26,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "8726b44b1e78f7cc215ccf2c1154e64758030bfaf6bbfe65cb556fadf23727f4",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-26",
        "label": "26차 일반 기본엔진",
        "frozenRound": 26,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "9ca65a355efba45ebb0c354331c0fdf10650f43d32fe51777d9df5491585358a",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-27",
    "round": 27,
    "label": "27차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-27-0",
        "kind": "image",
        "label": "anatomy-v27-face.png",
        "path": "studies/anatomy-v27-face.png",
        "sha256": "5470ee25e19632576d2ac37d5acdbea9988c85d11714972d20a941295d7e5ef0",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-27-1",
        "kind": "image",
        "label": "anatomy-v27-face128.png",
        "path": "studies/anatomy-v27-face128.png",
        "sha256": "00e72a02375b5820fac0f6e2779c1e4ee6e7deb74a5036569ffa40ecae3b415b",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-27-2",
        "kind": "rotation-sheet",
        "label": "runtime-v27-rotation-female-2.png",
        "path": "studies/runtime-v27-rotation-female-2.png",
        "sha256": "284ea049d223cf548855e3e6f010a4d74261913f0ac0ee88a8d7ce4f15b94623",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-27-3",
        "kind": "rotation-sheet",
        "label": "runtime-v27-rotation-female-3.png",
        "path": "studies/runtime-v27-rotation-female-3.png",
        "sha256": "3ef87ed31ee29b32067e3dc45316fd76b51c1419ccbbcc0742b5b487b5d817c3",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-27-4",
        "kind": "rotation-sheet",
        "label": "runtime-v27-rotation-female-4.png",
        "path": "studies/runtime-v27-rotation-female-4.png",
        "sha256": "f8a8d5f84ba04cf24b87c10b4e0cd67278b306e20f82008560cc26397250e280",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-27-5",
        "kind": "rotation-sheet",
        "label": "runtime-v27-rotation-female-5.png",
        "path": "studies/runtime-v27-rotation-female-5.png",
        "sha256": "5d1342d8d81db61fda578f8c15525df5678b64dfa0ba22bb87163ec348c48fea",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-27-6",
        "kind": "rotation-sheet",
        "label": "runtime-v27-rotation-female-6.png",
        "path": "studies/runtime-v27-rotation-female-6.png",
        "sha256": "bd7f46751872450cf9211519063f0140b57e2581538eea0d7438c687cfb0f316",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-27-7",
        "kind": "rotation-sheet",
        "label": "runtime-v27-rotation-female-7.png",
        "path": "studies/runtime-v27-rotation-female-7.png",
        "sha256": "c8ab34ed73fe2450950bb47988a52149f82ec90d43cc9501903e3620ce6c626d",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-27-8",
        "kind": "rotation-sheet",
        "label": "runtime-v27-rotation-female-8.png",
        "path": "studies/runtime-v27-rotation-female-8.png",
        "sha256": "a24fc5465c1d829cfce0ac60dd54cefc9230e3d12a89282df4d7a94afa1f1f33",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-27-9",
        "kind": "rotation-sheet",
        "label": "runtime-v27-rotation-male-2.png",
        "path": "studies/runtime-v27-rotation-male-2.png",
        "sha256": "022c0fd9a1e10882fa45ad6c8053287663bd3f598b69a17533c82f050419cbfe",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-27-10",
        "kind": "rotation-sheet",
        "label": "runtime-v27-rotation-male-3.png",
        "path": "studies/runtime-v27-rotation-male-3.png",
        "sha256": "6386c69d0ef708b2a9260a6013a116bf4951cd755768f9532027ff4239ce69d2",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-27-11",
        "kind": "rotation-sheet",
        "label": "runtime-v27-rotation-male-4.png",
        "path": "studies/runtime-v27-rotation-male-4.png",
        "sha256": "c804e88d1e05bbb279d274cbb319fb5aefbf1a6b23d6d2b29761f413d7372af8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-27-12",
        "kind": "rotation-sheet",
        "label": "runtime-v27-rotation-male-5.png",
        "path": "studies/runtime-v27-rotation-male-5.png",
        "sha256": "5e659c99d64e334fb15f5d678bd96276d267682dd2d5a6d1176cda0884a0c710",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-27-13",
        "kind": "rotation-sheet",
        "label": "runtime-v27-rotation-male-6.png",
        "path": "studies/runtime-v27-rotation-male-6.png",
        "sha256": "99dad4ec0ae219300e994c960c4725aab6f41333582b1565ec8008b45b19143c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-27-14",
        "kind": "rotation-sheet",
        "label": "runtime-v27-rotation-male-7.png",
        "path": "studies/runtime-v27-rotation-male-7.png",
        "sha256": "abbc21918bdbc724b4ad3ab445c0fc566292c38cf81a423e3c3865505215cc5f",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-27-15",
        "kind": "rotation-sheet",
        "label": "runtime-v27-rotation-male-8.png",
        "path": "studies/runtime-v27-rotation-male-8.png",
        "sha256": "d9d1ac6191ed4699b57b53b68aef18107650edd2013e96822e05a99c99070671",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-27-16",
        "kind": "data",
        "label": "eyes-v27-tests.json",
        "path": "qa/eyes-v27-tests.json",
        "sha256": "de1a7f17c0fcc49862fd8a8e9266357988f65c739eaa10711dbf265d9a88af3b",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-27-17",
        "kind": "data",
        "label": "rotation-v27-tests.json",
        "path": "qa/rotation-v27-tests.json",
        "sha256": "2165e131079d5023606eaba1a3b0618dbc86885de269f51cd12f12624fb54002",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-27",
        "label": "27차 동결 기본형",
        "frozenRound": 27,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "65ad30e02ea614100370b0e99147ce1b52813be93e6b75d2f8ec1a6d13cc9c6c",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-27",
        "label": "27차 일반 기본엔진",
        "frozenRound": 27,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "9ca65a355efba45ebb0c354331c0fdf10650f43d32fe51777d9df5491585358a",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-28",
    "round": 28,
    "label": "28차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-28-0",
        "kind": "image",
        "label": "anatomy-v28-body.png",
        "path": "studies/anatomy-v28-body.png",
        "sha256": "40c823806274def89dd4d82aba25170a2d19920683acd1e7df895dcb5f5ebdb4",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-28-1",
        "kind": "image",
        "label": "anatomy-v28-legs.png",
        "path": "studies/anatomy-v28-legs.png",
        "sha256": "a115318251391b36f376c0bfd16a984ba55b4a5f1a9aab10e421d12ac21e6db9",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-28-2",
        "kind": "rotation-sheet",
        "label": "runtime-v28-rotation-female-2.png",
        "path": "studies/runtime-v28-rotation-female-2.png",
        "sha256": "284ea049d223cf548855e3e6f010a4d74261913f0ac0ee88a8d7ce4f15b94623",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-28-3",
        "kind": "rotation-sheet",
        "label": "runtime-v28-rotation-female-3.png",
        "path": "studies/runtime-v28-rotation-female-3.png",
        "sha256": "3ef87ed31ee29b32067e3dc45316fd76b51c1419ccbbcc0742b5b487b5d817c3",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-28-4",
        "kind": "rotation-sheet",
        "label": "runtime-v28-rotation-female-4.png",
        "path": "studies/runtime-v28-rotation-female-4.png",
        "sha256": "f8a8d5f84ba04cf24b87c10b4e0cd67278b306e20f82008560cc26397250e280",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-28-5",
        "kind": "rotation-sheet",
        "label": "runtime-v28-rotation-female-5.png",
        "path": "studies/runtime-v28-rotation-female-5.png",
        "sha256": "f778960ac94d353666a33ceb30fa4fcf20109f00038edbf996d0d33466f271a9",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-28-6",
        "kind": "rotation-sheet",
        "label": "runtime-v28-rotation-female-6.png",
        "path": "studies/runtime-v28-rotation-female-6.png",
        "sha256": "495d38625ca5a94f91d83173aa1436f78322ad43a66ebd67a6463b8955fc68fc",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-28-7",
        "kind": "rotation-sheet",
        "label": "runtime-v28-rotation-female-7.png",
        "path": "studies/runtime-v28-rotation-female-7.png",
        "sha256": "262b04f48a8bf4947aeb1fbb5868a9867a58b445ab12a0f24c3286cc3d675fc2",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-28-8",
        "kind": "rotation-sheet",
        "label": "runtime-v28-rotation-female-8.png",
        "path": "studies/runtime-v28-rotation-female-8.png",
        "sha256": "e0a5ba8a44355ecad9cce10717f6c1a0137bc8f3a79296a8fd879657453b3047",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-28-9",
        "kind": "rotation-sheet",
        "label": "runtime-v28-rotation-male-2.png",
        "path": "studies/runtime-v28-rotation-male-2.png",
        "sha256": "022c0fd9a1e10882fa45ad6c8053287663bd3f598b69a17533c82f050419cbfe",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-28-10",
        "kind": "rotation-sheet",
        "label": "runtime-v28-rotation-male-3.png",
        "path": "studies/runtime-v28-rotation-male-3.png",
        "sha256": "6386c69d0ef708b2a9260a6013a116bf4951cd755768f9532027ff4239ce69d2",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-28-11",
        "kind": "rotation-sheet",
        "label": "runtime-v28-rotation-male-4.png",
        "path": "studies/runtime-v28-rotation-male-4.png",
        "sha256": "c804e88d1e05bbb279d274cbb319fb5aefbf1a6b23d6d2b29761f413d7372af8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-28-12",
        "kind": "rotation-sheet",
        "label": "runtime-v28-rotation-male-5.png",
        "path": "studies/runtime-v28-rotation-male-5.png",
        "sha256": "f903e9b0b7ed1f8cfb18624f376ac8b1afa11e7a174e5c7bb3786165c84216cf",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-28-13",
        "kind": "rotation-sheet",
        "label": "runtime-v28-rotation-male-6.png",
        "path": "studies/runtime-v28-rotation-male-6.png",
        "sha256": "81882e913c3683be730ef6d854ba340d48e1ee3a82afe63fc7c11665d008700f",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-28-14",
        "kind": "rotation-sheet",
        "label": "runtime-v28-rotation-male-7.png",
        "path": "studies/runtime-v28-rotation-male-7.png",
        "sha256": "11aeefb0064ec705d37e8eb1a49bf8cbe7421e7abcebaa0fb7c1f083b7a04485",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-28-15",
        "kind": "rotation-sheet",
        "label": "runtime-v28-rotation-male-8.png",
        "path": "studies/runtime-v28-rotation-male-8.png",
        "sha256": "0cb90353bdafb0889418ee5871ceb887e572f1f78daff14fcf74bee7a5ec0c41",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-28-16",
        "kind": "data",
        "label": "legs-v28-tests.json",
        "path": "qa/legs-v28-tests.json",
        "sha256": "553f1cad93248fb8a639a7da6b969063b305cdf8d985470de2d1ff40a64be6ca",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-28-17",
        "kind": "data",
        "label": "rotation-v28-tests.json",
        "path": "qa/rotation-v28-tests.json",
        "sha256": "0862011e876dfbfd2023dd8c215874e8df025a472c28687e32f1a7e1bea30284",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-28",
        "label": "28차 동결 기본형",
        "frozenRound": 28,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "91dbb8a11c40b2db8e38e2df54df81c3ca5e7c9d9db86bba5cb287763b8e77d4",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-28",
        "label": "28차 일반 기본엔진",
        "frozenRound": 28,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "b0e6da3bd5ce22c8fa59dd4c2a0dcdb9b4efedf0100dc70a1cb8b5c4be930b85",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-29",
    "round": 29,
    "label": "29차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-29-0",
        "kind": "image",
        "label": "chibi-v29-body.png",
        "path": "studies/chibi-v29-body.png",
        "sha256": "c7171cd49cc1a17e5455e7308836ef74b3cf8532ebe76492b054ef3ebd6b836f",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-29-1",
        "kind": "image",
        "label": "chibi-v29-face.png",
        "path": "studies/chibi-v29-face.png",
        "sha256": "fa8f8b2be81d7a90bf43e59d38828a0f112b6cc35d826aff8a2f91e2183d7e9c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-29-2",
        "kind": "rotation-sheet",
        "label": "runtime-v29-rotation-female-2.png",
        "path": "studies/runtime-v29-rotation-female-2.png",
        "sha256": "f6b10a7a50313370ebc87f93dcf5b3176c0717ef6047a30f503ffc5b57259e2c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-29-3",
        "kind": "rotation-sheet",
        "label": "runtime-v29-rotation-female-3.png",
        "path": "studies/runtime-v29-rotation-female-3.png",
        "sha256": "304a7dfb14cfff752796653cdf0fb1553545906b2f67fd1bc0c273aceeb77b69",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-29-4",
        "kind": "rotation-sheet",
        "label": "runtime-v29-rotation-female-4.png",
        "path": "studies/runtime-v29-rotation-female-4.png",
        "sha256": "22549d1e7d7e902592d33e085f7dd80939c503fc71f7a902467099d349c648b7",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-29-5",
        "kind": "rotation-sheet",
        "label": "runtime-v29-rotation-female-5.png",
        "path": "studies/runtime-v29-rotation-female-5.png",
        "sha256": "f778960ac94d353666a33ceb30fa4fcf20109f00038edbf996d0d33466f271a9",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-29-6",
        "kind": "rotation-sheet",
        "label": "runtime-v29-rotation-female-6.png",
        "path": "studies/runtime-v29-rotation-female-6.png",
        "sha256": "495d38625ca5a94f91d83173aa1436f78322ad43a66ebd67a6463b8955fc68fc",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-29-7",
        "kind": "rotation-sheet",
        "label": "runtime-v29-rotation-female-7.png",
        "path": "studies/runtime-v29-rotation-female-7.png",
        "sha256": "262b04f48a8bf4947aeb1fbb5868a9867a58b445ab12a0f24c3286cc3d675fc2",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-29-8",
        "kind": "rotation-sheet",
        "label": "runtime-v29-rotation-female-8.png",
        "path": "studies/runtime-v29-rotation-female-8.png",
        "sha256": "e0a5ba8a44355ecad9cce10717f6c1a0137bc8f3a79296a8fd879657453b3047",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-29-9",
        "kind": "rotation-sheet",
        "label": "runtime-v29-rotation-male-2.png",
        "path": "studies/runtime-v29-rotation-male-2.png",
        "sha256": "389d943f7449a54767747f6f4e5e7c7b0a478ad8799affed11104824f05dbdf1",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-29-10",
        "kind": "rotation-sheet",
        "label": "runtime-v29-rotation-male-3.png",
        "path": "studies/runtime-v29-rotation-male-3.png",
        "sha256": "f718586f99de32e3e35a108918c3827d417ca1382d79d8f99bd33bc71d6a5e4c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-29-11",
        "kind": "rotation-sheet",
        "label": "runtime-v29-rotation-male-4.png",
        "path": "studies/runtime-v29-rotation-male-4.png",
        "sha256": "b03d030cc3d6f9ca086f50a0554266b9fef853692f6e513c53685484c4f2d782",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-29-12",
        "kind": "rotation-sheet",
        "label": "runtime-v29-rotation-male-5.png",
        "path": "studies/runtime-v29-rotation-male-5.png",
        "sha256": "f903e9b0b7ed1f8cfb18624f376ac8b1afa11e7a174e5c7bb3786165c84216cf",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-29-13",
        "kind": "rotation-sheet",
        "label": "runtime-v29-rotation-male-6.png",
        "path": "studies/runtime-v29-rotation-male-6.png",
        "sha256": "81882e913c3683be730ef6d854ba340d48e1ee3a82afe63fc7c11665d008700f",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-29-14",
        "kind": "rotation-sheet",
        "label": "runtime-v29-rotation-male-7.png",
        "path": "studies/runtime-v29-rotation-male-7.png",
        "sha256": "11aeefb0064ec705d37e8eb1a49bf8cbe7421e7abcebaa0fb7c1f083b7a04485",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-29-15",
        "kind": "rotation-sheet",
        "label": "runtime-v29-rotation-male-8.png",
        "path": "studies/runtime-v29-rotation-male-8.png",
        "sha256": "0cb90353bdafb0889418ee5871ceb887e572f1f78daff14fcf74bee7a5ec0c41",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-29-16",
        "kind": "data",
        "label": "chibi-v29-tests.json",
        "path": "qa/chibi-v29-tests.json",
        "sha256": "59ecfa2ed5704b1afb29049aa4e43bc66ae54840c2dcc9b3fcd8b6d830db4c91",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-29-17",
        "kind": "data",
        "label": "rotation-v29-tests.json",
        "path": "qa/rotation-v29-tests.json",
        "sha256": "62780728e94850ac8f93faa5636b82f70fb15e7c2f3eecde60ed1de0028f4098",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-29",
        "label": "29차 동결 기본형",
        "frozenRound": 29,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "a78cd8dbf68ac76bc8e9ad9afa80ff8e8c6dbc4f32e0120538abfba70dc9f4ba",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-29",
        "label": "29차 일반 기본엔진",
        "frozenRound": 29,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "b0e6da3bd5ce22c8fa59dd4c2a0dcdb9b4efedf0100dc70a1cb8b5c4be930b85",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-30",
    "round": 30,
    "label": "30차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-30-0",
        "kind": "image",
        "label": "anatomy-v30-closeout-bridge.png",
        "path": "studies/anatomy-v30-closeout-bridge.png",
        "sha256": "0a69bdecf0035bb624f704706a9e3852e23e1b87bae01d46a3200e722084b05c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-1",
        "kind": "image",
        "label": "anatomy-v30-overview-body.png",
        "path": "studies/anatomy-v30-overview-body.png",
        "sha256": "157c9fee67ba99752686798b10699c53a644febbf544ee851a9b132270eac579",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-2",
        "kind": "image",
        "label": "anatomy-v30-overview-face.png",
        "path": "studies/anatomy-v30-overview-face.png",
        "sha256": "cfd18b71705dde487ed585272f95e50d672034ba04ae95c3e5d571a58c868048",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-3",
        "kind": "image",
        "label": "chibi-v30-body.png",
        "path": "studies/chibi-v30-body.png",
        "sha256": "ef1e38f8a4fb2bb101f0fa020f96a9e13435ca929a2a2acc7e2338d727ade944",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-4",
        "kind": "image",
        "label": "chibi-v30-face-female.png",
        "path": "studies/chibi-v30-face-female.png",
        "sha256": "ae313718de7f2f43416678e5f8b1c2adac4952c89d40eba58bf6b58bfd916399",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-5",
        "kind": "image",
        "label": "chibi-v30-face-male.png",
        "path": "studies/chibi-v30-face-male.png",
        "sha256": "195eb11b1c62e3fb7e3257b8a24a4c67aeb8cb6a97959fed0081ab96a1a1bd32",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-6",
        "kind": "rotation-sheet",
        "label": "runtime-v30-rotation-female-2.png",
        "path": "studies/runtime-v30-rotation-female-2.png",
        "sha256": "1bcbb70e5ce59191cab18569477d0532cded2671af908c40248a362a165b7572",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-7",
        "kind": "rotation-sheet",
        "label": "runtime-v30-rotation-female-3.png",
        "path": "studies/runtime-v30-rotation-female-3.png",
        "sha256": "705a3903cc7e32578ce5698e4da3f34804e66ba7343aee2bac152167813b99fd",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-8",
        "kind": "rotation-sheet",
        "label": "runtime-v30-rotation-female-4.png",
        "path": "studies/runtime-v30-rotation-female-4.png",
        "sha256": "3ed65fe10b9cc3441c1cea93f8251c9e9b1300cb19689cf723cfffa854f0f087",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-9",
        "kind": "rotation-sheet",
        "label": "runtime-v30-rotation-female-5.png",
        "path": "studies/runtime-v30-rotation-female-5.png",
        "sha256": "f778960ac94d353666a33ceb30fa4fcf20109f00038edbf996d0d33466f271a9",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-10",
        "kind": "rotation-sheet",
        "label": "runtime-v30-rotation-female-6.png",
        "path": "studies/runtime-v30-rotation-female-6.png",
        "sha256": "495d38625ca5a94f91d83173aa1436f78322ad43a66ebd67a6463b8955fc68fc",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-11",
        "kind": "rotation-sheet",
        "label": "runtime-v30-rotation-female-7.png",
        "path": "studies/runtime-v30-rotation-female-7.png",
        "sha256": "262b04f48a8bf4947aeb1fbb5868a9867a58b445ab12a0f24c3286cc3d675fc2",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-12",
        "kind": "rotation-sheet",
        "label": "runtime-v30-rotation-female-8.png",
        "path": "studies/runtime-v30-rotation-female-8.png",
        "sha256": "e0a5ba8a44355ecad9cce10717f6c1a0137bc8f3a79296a8fd879657453b3047",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-13",
        "kind": "rotation-sheet",
        "label": "runtime-v30-rotation-male-2.png",
        "path": "studies/runtime-v30-rotation-male-2.png",
        "sha256": "dacdad3f7111acc72b184f83642c8466a59284d2751546eb7edcf5fbc0a7eb0e",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-14",
        "kind": "rotation-sheet",
        "label": "runtime-v30-rotation-male-3.png",
        "path": "studies/runtime-v30-rotation-male-3.png",
        "sha256": "75589d35ab428edebb81d46e3e7139ea87605a7d1fcf2508f47a307bd18f6294",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-15",
        "kind": "rotation-sheet",
        "label": "runtime-v30-rotation-male-4.png",
        "path": "studies/runtime-v30-rotation-male-4.png",
        "sha256": "1926326a7d94a0311d6c735566b276714577ea5fbcec199ec7d9f71fed580422",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-16",
        "kind": "rotation-sheet",
        "label": "runtime-v30-rotation-male-5.png",
        "path": "studies/runtime-v30-rotation-male-5.png",
        "sha256": "f903e9b0b7ed1f8cfb18624f376ac8b1afa11e7a174e5c7bb3786165c84216cf",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-17",
        "kind": "rotation-sheet",
        "label": "runtime-v30-rotation-male-6.png",
        "path": "studies/runtime-v30-rotation-male-6.png",
        "sha256": "81882e913c3683be730ef6d854ba340d48e1ee3a82afe63fc7c11665d008700f",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-18",
        "kind": "rotation-sheet",
        "label": "runtime-v30-rotation-male-7.png",
        "path": "studies/runtime-v30-rotation-male-7.png",
        "sha256": "11aeefb0064ec705d37e8eb1a49bf8cbe7421e7abcebaa0fb7c1f083b7a04485",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-19",
        "kind": "rotation-sheet",
        "label": "runtime-v30-rotation-male-8.png",
        "path": "studies/runtime-v30-rotation-male-8.png",
        "sha256": "0cb90353bdafb0889418ee5871ceb887e572f1f78daff14fcf74bee7a5ec0c41",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-30-20",
        "kind": "data",
        "label": "chibi-v30-tests.json",
        "path": "qa/chibi-v30-tests.json",
        "sha256": "ad2e0b3eb4104a9c121e7780d0124a2b64d10d43290908d833700d4d3a972e42",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-30-21",
        "kind": "data",
        "label": "portraits-v30-tests.json",
        "path": "qa/portraits-v30-tests.json",
        "sha256": "00d2a9a8ee632d6d68c607308378f7bd0b3d83ced76757ef4bbe71e536a1b951",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      },
      {
        "id": "round-30-22",
        "kind": "data",
        "label": "rotation-v30-tests.json",
        "path": "qa/rotation-v30-tests.json",
        "sha256": "cfcfe5ab60bd7be5ca2a3809e91fe48fad5e4cb1ae01c3321572eebc60f14c73",
        "role": "recorded-qa",
        "note": "저장된 당시 검사 결과입니다. 지금 재실행하여 통과했다는 뜻이 아닙니다."
      }
    ],
    "live": [],
    "models": [
      {
        "id": "frozen-30",
        "label": "30차 동결 기본형",
        "frozenRound": 30,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "7e708bd4d46abfd22b7ecdfd11f6d7d18ebf646b75ca13ad55f8cb4c1671baff",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-30",
        "label": "30차 일반 기본엔진",
        "frozenRound": 30,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "b0e6da3bd5ce22c8fa59dd4c2a0dcdb9b4efedf0100dc70a1cb8b5c4be930b85",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "64방향 PNG는 저장된 결과이며 연속적인 과거 실모델 회전으로 표시하지 않습니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-31",
    "round": 31,
    "label": "31차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [],
    "live": [
      {
        "id": "profile31",
        "label": "입술·턱·목 깊이",
        "path": "profile31.html"
      }
    ],
    "models": [
      {
        "id": "frozen-31",
        "label": "31차 동결 기본형",
        "frozenRound": 31,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "7e708bd4d46abfd22b7ecdfd11f6d7d18ebf646b75ca13ad55f8cb4c1671baff",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-31",
        "label": "31차 일반 기본엔진",
        "frozenRound": 31,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "b0e6da3bd5ce22c8fa59dd4c2a0dcdb9b4efedf0100dc70a1cb8b5c4be930b85",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "실행 가능한 보존 관찰창입니다. 공통 렌더러의 후속 변경이 들어갈 수 있어 당시 고정 그림과 구별합니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-32",
    "round": 32,
    "label": "32차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [],
    "live": [
      {
        "id": "blind32",
        "label": "31차C의 32차 블라인드 검토",
        "path": "blind32.html"
      }
    ],
    "models": [
      {
        "id": "frozen-32",
        "label": "32차 동결 기본형",
        "frozenRound": 32,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "a8b1233c43fb87ec10fd0a05ee9ab4afc5f05324da62894b69bff74c856b3aa5",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-32",
        "label": "32차 일반 기본엔진",
        "frozenRound": 32,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "81e6c47945fdfa452e289c206c21cb6ce7d508b58dcd9d7269ca1adbbf9ca159",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "실행 가능한 보존 관찰창입니다. 공통 렌더러의 후속 변경이 들어갈 수 있어 당시 고정 그림과 구별합니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-33",
    "round": 33,
    "label": "33차",
    "description": "실제 동결 기본형과 확인한 당시 산출물을 구별해 엽니다.",
    "status": "frozen-model-and-records",
    "artifacts": [
      {
        "id": "round-33-0",
        "kind": "image",
        "label": "atlas-chest33.png",
        "path": "studies/atlas-chest33.png",
        "sha256": "f83d04160e74bb3145c7884babfe90f2d23a8e4a464b615eca42a5f864abd26a",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-33-1",
        "kind": "image",
        "label": "atlas-face33.png",
        "path": "studies/atlas-face33.png",
        "sha256": "5962f39beba0db72de80a91f11677bf5017dae6b34def39c0d94ef8b519c31e1",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-33-2",
        "kind": "image",
        "label": "atlas-pose33.png",
        "path": "studies/atlas-pose33.png",
        "sha256": "c6e56dcaebc8ed807f8ca57855028ea7a5f09c717ccb48bcf6298e0c9acb444d",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-33-3",
        "kind": "image",
        "label": "chest33.png",
        "path": "studies/chest33.png",
        "sha256": "13af517e385ea26cce87eebc625c2d657ed8762d2da9dfb8b90bf3b9b11d30a5",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-33-4",
        "kind": "image",
        "label": "face-detail33.png",
        "path": "studies/face-detail33.png",
        "sha256": "ca70048e515cb7f1961bd69fce32cc773b441319cd723fd4da6af8289b198cf8",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-33-5",
        "kind": "image",
        "label": "faces33.png",
        "path": "studies/faces33.png",
        "sha256": "7bf08717fc0ca0b6b5ca11f70be573818b9ff6f4178ec9dad43499e78381a657",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      },
      {
        "id": "round-33-6",
        "kind": "image",
        "label": "poses33.png",
        "path": "studies/poses33.png",
        "sha256": "373380c855614a54a318574ac292419a4adcbc9d9d2e4abb05c59593fb9070a6",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      }
    ],
    "live": [
      {
        "id": "shape33",
        "label": "33차 연속 형태",
        "path": "continuous-review.html?panel=shape"
      },
      {
        "id": "pose33",
        "label": "33차 관절·극단 자세",
        "path": "continuous-review.html?panel=pose&pose=x"
      }
    ],
    "models": [
      {
        "id": "frozen-33",
        "label": "33차 동결 기본형",
        "frozenRound": 33,
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "14403d2cd46131fc9e534d02abfcf7f4b14f4208c1381d711dc3e14aa9481b84",
        "frozenMode": "study",
        "scope": "당시 집중 연구 모델(성인/작은등신). 일반 기본엔진은 별도 항목."
      },
      {
        "id": "foundation-33",
        "label": "33차 일반 기본엔진",
        "frozenRound": 33,
        "frozenMode": "foundation",
        "module": "studio-frozen.mjs",
        "loader": "loadFrozen",
        "fingerprint": "ee34cb7cf0ae3f532568ba87e2766c7afca263fe1957ac855a71c0ae495c0ac1",
        "scope": "당시 일반 연구실 기본엔진. 집중 인체 연구 모델과 구분."
      }
    ],
    "limits": [
      "실행 가능한 보존 관찰창입니다. 공통 렌더러의 후속 변경이 들어갈 수 있어 당시 고정 그림과 구별합니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-34",
    "round": 34,
    "label": "34차",
    "description": "확인한 공개 보존 자료만 연결합니다.",
    "status": "live-and-records",
    "artifacts": [
      {
        "id": "round-34-0",
        "kind": "image",
        "label": "bust34.png",
        "path": "studies/bust34.png",
        "sha256": "dee62ff7ffc9818b54d2aa32e21a4b3191b7317a6a256b5b126578e6389d238c",
        "role": "saved-result",
        "note": "당시 저장 그림. 현재 모델을 과거판으로 재생성한 이미지가 아닙니다."
      }
    ],
    "live": [
      {
        "id": "face34",
        "label": "34차 face",
        "path": "study34.html?mode=face"
      },
      {
        "id": "chest34",
        "label": "34차 chest",
        "path": "study34.html?mode=chest"
      },
      {
        "id": "body34",
        "label": "34차 body",
        "path": "study34.html?mode=body"
      }
    ],
    "models": [],
    "limits": [
      "실행 가능한 보존 관찰창입니다. 공통 렌더러의 후속 변경이 들어갈 수 있어 당시 고정 그림과 구별합니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-35",
    "round": 35,
    "label": "35차",
    "description": "확인한 공개 보존 자료만 연결합니다.",
    "status": "live-and-records",
    "artifacts": [
      {
        "id": "round-35-0",
        "kind": "image",
        "label": "preview35.png",
        "path": "preview35.png",
        "sha256": "865e0b40d5d6d6bcfc19f4f8e7dbc0bb4c979de4fb2db0f5042aea1a56c60184"
      },
      {
        "id": "round-35-1",
        "kind": "data",
        "label": "15쌍 실측 자세 파생자료",
        "path": "scan35.json",
        "sha256": "5ae88a138e319b840075767fdd9d7e5d967a8ccf0dad11a7ab11cca0d0996d5a"
      },
      {
        "id": "round-35-2",
        "kind": "data",
        "label": "얼굴40·가슴20 원전 등록",
        "path": "atlas35.json",
        "sha256": "3610eb0d54a29e6ea6bf220c009509a7d204af431c8a3a448da81b7773ddef2b"
      },
      {
        "id": "round-35-3",
        "kind": "image",
        "label": "CC BY 도판 구획",
        "path": "wallner-fig1-crop35.webp",
        "sha256": "ba8ab76ea1d3162eb910cc5590b8af5d105169745ca893fe3e7dfca64208abfd"
      },
      {
        "id": "round-35-4",
        "kind": "data",
        "label": "notes35",
        "path": "notes35.json",
        "sha256": "5e90be8b13b58f836190a04b98a32570f50d19880179774382ed51febeb45cac"
      },
      {
        "id": "round-35-source-5",
        "kind": "source-link",
        "label": "프리렌 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-1/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-6",
        "kind": "source-link",
        "label": "프리렌 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara1_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-7",
        "kind": "source-link",
        "label": "프리렌 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara1_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-8",
        "kind": "source-link",
        "label": "프리렌 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara1_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-9",
        "kind": "source-link",
        "label": "프리렌 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara1_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-10",
        "kind": "source-link",
        "label": "페른 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-5/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-11",
        "kind": "source-link",
        "label": "페른 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara2_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-12",
        "kind": "source-link",
        "label": "페른 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara2_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-13",
        "kind": "source-link",
        "label": "페른 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara2_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-14",
        "kind": "source-link",
        "label": "페른 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara2_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-15",
        "kind": "source-link",
        "label": "플람메 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-7/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-16",
        "kind": "source-link",
        "label": "플람메 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/09/chara7_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-17",
        "kind": "source-link",
        "label": "플람메 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/09/chara7_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-18",
        "kind": "source-link",
        "label": "플람메 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/09/chara7_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-19",
        "kind": "source-link",
        "label": "플람메 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/09/chara7_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-20",
        "kind": "source-link",
        "label": "제리에 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-24/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-21",
        "kind": "source-link",
        "label": "제리에 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/02/chara15_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-22",
        "kind": "source-link",
        "label": "제리에 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/02/chara15_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-23",
        "kind": "source-link",
        "label": "제리에 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/02/chara15_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-24",
        "kind": "source-link",
        "label": "제리에 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/02/chara15_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-25",
        "kind": "source-link",
        "label": "메토데 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-25/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-26",
        "kind": "source-link",
        "label": "메토데 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/02/chara16_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-27",
        "kind": "source-link",
        "label": "메토데 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/02/chara16_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-28",
        "kind": "source-link",
        "label": "메토데 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/02/chara16_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-29",
        "kind": "source-link",
        "label": "메토데 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/02/chara16_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-30",
        "kind": "source-link",
        "label": "칸네 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-11/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-31",
        "kind": "source-link",
        "label": "칸네 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara01_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-32",
        "kind": "source-link",
        "label": "칸네 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara01_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-33",
        "kind": "source-link",
        "label": "칸네 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara01_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-34",
        "kind": "source-link",
        "label": "칸네 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara01_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-35",
        "kind": "source-link",
        "label": "라비네 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-12/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-36",
        "kind": "source-link",
        "label": "라비네 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara02_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-37",
        "kind": "source-link",
        "label": "라비네 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara02_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-38",
        "kind": "source-link",
        "label": "라비네 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara02_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-39",
        "kind": "source-link",
        "label": "라비네 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara02_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-40",
        "kind": "source-link",
        "label": "위벨 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-14/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-41",
        "kind": "source-link",
        "label": "위벨 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara04_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-42",
        "kind": "source-link",
        "label": "위벨 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara04_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-43",
        "kind": "source-link",
        "label": "위벨 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara04_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-44",
        "kind": "source-link",
        "label": "위벨 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara04_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-45",
        "kind": "source-link",
        "label": "라우펜 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-18/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-46",
        "kind": "source-link",
        "label": "라우펜 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara08_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-47",
        "kind": "source-link",
        "label": "라우펜 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara08_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-48",
        "kind": "source-link",
        "label": "라우펜 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara08_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-49",
        "kind": "source-link",
        "label": "라우펜 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara08_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-50",
        "kind": "source-link",
        "label": "에레 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-19/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-51",
        "kind": "source-link",
        "label": "에레 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara09_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-52",
        "kind": "source-link",
        "label": "에레 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara09_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-53",
        "kind": "source-link",
        "label": "에레 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara09_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-54",
        "kind": "source-link",
        "label": "에레 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara09_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-55",
        "kind": "source-link",
        "label": "젠제 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-20/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-56",
        "kind": "source-link",
        "label": "젠제 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara10_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-57",
        "kind": "source-link",
        "label": "젠제 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara10_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-58",
        "kind": "source-link",
        "label": "젠제 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara10_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-59",
        "kind": "source-link",
        "label": "젠제 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara10_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-60",
        "kind": "source-link",
        "label": "에델 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-23/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-61",
        "kind": "source-link",
        "label": "에델 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara14_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-62",
        "kind": "source-link",
        "label": "에델 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara14_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-63",
        "kind": "source-link",
        "label": "에델 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara14_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-64",
        "kind": "source-link",
        "label": "에델 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara14_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-65",
        "kind": "source-link",
        "label": "아우라 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group2/2-2/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-66",
        "kind": "source-link",
        "label": "아우라 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/10/chara9_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-67",
        "kind": "source-link",
        "label": "아우라 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/10/chara9_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-68",
        "kind": "source-link",
        "label": "아우라 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/10/chara9_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-69",
        "kind": "source-link",
        "label": "아우라 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/10/chara9_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-70",
        "kind": "source-link",
        "label": "리니에 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group2/2-4/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-71",
        "kind": "source-link",
        "label": "리니에 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/10/chara11_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-72",
        "kind": "source-link",
        "label": "리니에 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/10/chara11_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-73",
        "kind": "source-link",
        "label": "리니에 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/10/chara11_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-74",
        "kind": "source-link",
        "label": "리니에 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/10/chara11_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-75",
        "kind": "source-link",
        "label": "우라라카 오챠코 원전 페이지",
        "url": "https://heroaca.com/character/chara_group01/01-03/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-76",
        "kind": "source-link",
        "label": "우라라카 오챠코 원화",
        "url": "https://heroaca.com/wp/wp-content/uploads/2020/09/41_cahra_face.png",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-77",
        "kind": "source-link",
        "label": "아스이 츠유 원전 페이지",
        "url": "https://heroaca.com/character/chara_group01/01-06/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-78",
        "kind": "source-link",
        "label": "아스이 츠유 원화",
        "url": "https://heroaca.com/wp/wp-content/uploads/2020/09/22_cahra_face.png",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-79",
        "kind": "source-link",
        "label": "아스이 츠유 원화",
        "url": "https://sculptors.jp/system/wp-content/uploads/2025/05/0d62d5c8447505e0e6742ced818aafb5.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-80",
        "kind": "source-link",
        "label": "아스이 츠유 원화",
        "url": "https://sculptors.jp/system/wp-content/uploads/2025/05/07caf8a08d2fa2ca92a1a01cc69b6201.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-81",
        "kind": "source-link",
        "label": "아스이 츠유 원화",
        "url": "https://sculptors.jp/system/wp-content/uploads/2025/05/169ccbce83746adca7493bf6813f01fc.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-82",
        "kind": "source-link",
        "label": "야오요로즈 모모 원전 페이지",
        "url": "https://heroaca.com/character/chara_group01/01-09/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-83",
        "kind": "source-link",
        "label": "야오요로즈 모모 원화",
        "url": "https://heroaca.com/wp/wp-content/uploads/2020/09/35_cahra_face.png",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-84",
        "kind": "source-link",
        "label": "지로 쿄카 원전 페이지",
        "url": "https://heroaca.com/character/chara_group01/01-13/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-85",
        "kind": "source-link",
        "label": "지로 쿄카 원화",
        "url": "https://heroaca.com/wp/wp-content/uploads/2020/09/26_cahra_face.png",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-86",
        "kind": "source-link",
        "label": "아시도 미나 원전 페이지",
        "url": "https://heroaca.com/character/chara_group01/01-14/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-87",
        "kind": "source-link",
        "label": "아시도 미나 원화",
        "url": "https://heroaca.com/wp/wp-content/uploads/2020/09/21_cahra_face.png",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-88",
        "kind": "source-link",
        "label": "켄도 이츠카 원전 페이지",
        "url": "https://heroaca.com/character/chara_group02/02-01/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-89",
        "kind": "source-link",
        "label": "켄도 이츠카 원화",
        "url": "https://heroaca.com/assets/oldimg/chara/chara_pc/c_chara_main38_2.png",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-90",
        "kind": "source-link",
        "label": "힘멜 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-2/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-91",
        "kind": "source-link",
        "label": "힘멜 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara4_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-92",
        "kind": "source-link",
        "label": "힘멜 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara4_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-93",
        "kind": "source-link",
        "label": "힘멜 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara4_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-94",
        "kind": "source-link",
        "label": "힘멜 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara4_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-95",
        "kind": "source-link",
        "label": "하이터 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-3/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-96",
        "kind": "source-link",
        "label": "하이터 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara5_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-97",
        "kind": "source-link",
        "label": "하이터 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara5_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-98",
        "kind": "source-link",
        "label": "하이터 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara5_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-99",
        "kind": "source-link",
        "label": "하이터 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara5_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-100",
        "kind": "source-link",
        "label": "슈타르크 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-6/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-101",
        "kind": "source-link",
        "label": "슈타르크 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara3_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-102",
        "kind": "source-link",
        "label": "슈타르크 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara3_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-103",
        "kind": "source-link",
        "label": "슈타르크 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara3_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-104",
        "kind": "source-link",
        "label": "자인 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-10/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-105",
        "kind": "source-link",
        "label": "자인 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/11/chara17_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-106",
        "kind": "source-link",
        "label": "자인 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/11/chara17_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-107",
        "kind": "source-link",
        "label": "자인 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/11/chara17_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-108",
        "kind": "source-link",
        "label": "자인 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/11/chara1_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-109",
        "kind": "source-link",
        "label": "뎅켄 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-15/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-110",
        "kind": "source-link",
        "label": "뎅켄 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara05_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-111",
        "kind": "source-link",
        "label": "뎅켄 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara05_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-112",
        "kind": "source-link",
        "label": "뎅켄 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara05_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-113",
        "kind": "source-link",
        "label": "뎅켄 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara05_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-114",
        "kind": "source-link",
        "label": "비어벨 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-13/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-115",
        "kind": "source-link",
        "label": "비어벨 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara03_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-116",
        "kind": "source-link",
        "label": "비어벨 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara03_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-117",
        "kind": "source-link",
        "label": "비어벨 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara03_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-118",
        "kind": "source-link",
        "label": "비어벨 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara03_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-119",
        "kind": "source-link",
        "label": "란트 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-16/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-120",
        "kind": "source-link",
        "label": "란트 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara06_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-121",
        "kind": "source-link",
        "label": "란트 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara06_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-122",
        "kind": "source-link",
        "label": "란트 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara06_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-123",
        "kind": "source-link",
        "label": "란트 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara06_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-124",
        "kind": "source-link",
        "label": "리히터 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-17/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-125",
        "kind": "source-link",
        "label": "리히터 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara07_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-126",
        "kind": "source-link",
        "label": "리히터 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara07_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-127",
        "kind": "source-link",
        "label": "리히터 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara07_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-128",
        "kind": "source-link",
        "label": "리히터 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara07_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-129",
        "kind": "source-link",
        "label": "샤르프 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-22/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-130",
        "kind": "source-link",
        "label": "샤르프 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara13_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-131",
        "kind": "source-link",
        "label": "샤르프 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara13_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-132",
        "kind": "source-link",
        "label": "샤르프 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara13_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-133",
        "kind": "source-link",
        "label": "샤르프 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara13_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-134",
        "kind": "source-link",
        "label": "레르넨 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-26/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-135",
        "kind": "source-link",
        "label": "레르넨 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/03/chara17_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-136",
        "kind": "source-link",
        "label": "레르넨 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/03/chara17_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-137",
        "kind": "source-link",
        "label": "레르넨 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/03/chara17_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-138",
        "kind": "source-link",
        "label": "레르넨 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/03/chara17_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-139",
        "kind": "source-link",
        "label": "뤼그너 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group2/2-3/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-140",
        "kind": "source-link",
        "label": "뤼그너 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/10/chara10_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-141",
        "kind": "source-link",
        "label": "뤼그너 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/10/chara10_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-142",
        "kind": "source-link",
        "label": "뤼그너 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/10/chara10_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-143",
        "kind": "source-link",
        "label": "뤼그너 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/10/chara10_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-144",
        "kind": "source-link",
        "label": "미도리야 이즈쿠 원전 페이지",
        "url": "https://heroaca.com/character/chara_group01/01-01/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-145",
        "kind": "source-link",
        "label": "미도리야 이즈쿠 원화",
        "url": "https://heroaca.com/wp/wp-content/uploads/2020/09/40_cahra_face-2.png",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-146",
        "kind": "source-link",
        "label": "바쿠고 카츠키 원전 페이지",
        "url": "https://heroaca.com/character/chara_group01/01-02/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-147",
        "kind": "source-link",
        "label": "바쿠고 카츠키 원화",
        "url": "https://heroaca.com/wp/wp-content/uploads/2020/09/34_cahra_face-1.png",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-148",
        "kind": "source-link",
        "label": "이이다 텐야 원전 페이지",
        "url": "https://heroaca.com/character/chara_group01/01-04/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-149",
        "kind": "source-link",
        "label": "이이다 텐야 원화",
        "url": "https://heroaca.com/wp/wp-content/uploads/2020/09/37_cahra_face.png",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-150",
        "kind": "source-link",
        "label": "토도로키 쇼토 원전 페이지",
        "url": "https://heroaca.com/character/chara_group01/01-05/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-151",
        "kind": "source-link",
        "label": "토도로키 쇼토 원화",
        "url": "https://heroaca.com/wp/wp-content/uploads/2020/09/24_cahra_face-3.png",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-152",
        "kind": "source-link",
        "label": "키리시마 에이지로 원전 페이지",
        "url": "https://heroaca.com/character/chara_group01/01-08/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-153",
        "kind": "source-link",
        "label": "키리시마 에이지로 원화",
        "url": "https://heroaca.com/wp/wp-content/uploads/2020/09/32_cahra_face.png",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-154",
        "kind": "source-link",
        "label": "카미나리 덴키 원전 페이지",
        "url": "https://heroaca.com/character/chara_group01/01-11/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-155",
        "kind": "source-link",
        "label": "카미나리 덴키 원화",
        "url": "https://heroaca.com/wp/wp-content/uploads/2020/09/28_cahra_face.png",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-156",
        "kind": "source-link",
        "label": "아오야마 유가 원전 페이지",
        "url": "https://heroaca.com/character/chara_group01/01-12/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-157",
        "kind": "source-link",
        "label": "아오야마 유가 원화",
        "url": "https://heroaca.com/wp/wp-content/uploads/2020/09/31_cahra_face.png",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-158",
        "kind": "source-link",
        "label": "세로 한타 원전 페이지",
        "url": "https://heroaca.com/character/chara_group01/01-17/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-159",
        "kind": "source-link",
        "label": "세로 한타 원화",
        "url": "https://heroaca.com/wp/wp-content/uploads/2020/09/30_cahra_face.png",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-160",
        "kind": "source-link",
        "label": "게나우 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-21/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-161",
        "kind": "source-link",
        "label": "게나우 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara11_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-162",
        "kind": "source-link",
        "label": "게나우 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara11_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-163",
        "kind": "source-link",
        "label": "게나우 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara11_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-35-source-164",
        "kind": "source-link",
        "label": "게나우 원화",
        "url": "https://frieren-anime.jp/wp-content/uploads/2024/01/chara11_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      }
    ],
    "live": [
      {
        "id": "faces35",
        "label": "얼굴 원형",
        "path": "atlas35.html?case=F02"
      },
      {
        "id": "scans35",
        "label": "실측 자세 쌍",
        "path": "atlas35.html?group=scans&scan=1"
      },
      {
        "id": "paper35",
        "label": "도판 기본형",
        "path": "paper35.html?form=W&cell=B3"
      },
      {
        "id": "motion35",
        "label": "움직임",
        "path": "motion35.html?form=W"
      }
    ],
    "models": [],
    "limits": [
      "실행 가능한 보존 관찰창입니다. 공통 렌더러의 후속 변경이 들어갈 수 있어 당시 고정 그림과 구별합니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-36",
    "round": 36,
    "label": "36차",
    "description": "확인한 공개 보존 자료만 연결합니다.",
    "status": "live-and-records",
    "artifacts": [
      {
        "id": "round-36-0",
        "kind": "data",
        "label": "다섯 사진 엔진 측정",
        "path": "engine-eval36.json",
        "sha256": "669f189ced9dd492f920208cb2d59540199c7069c83d733b04ef42959c77c3e2"
      },
      {
        "id": "round-36-1",
        "kind": "data",
        "label": "두상 조형 파생자료",
        "path": "head36.json",
        "sha256": "dc9103c28b927ef5055ea359cd679dd9c72b23f92e461ff15610d13f68396649"
      },
      {
        "id": "round-36-2",
        "kind": "data",
        "label": "notes36",
        "path": "notes36.json",
        "sha256": "65265f8eb9526d81bce6dc7c914172409aa40b366d36556c43bf45b66dacc51c"
      }
    ],
    "live": [
      {
        "id": "contour36-F02",
        "label": "36차 F02",
        "path": "contour36.html?case=F02"
      },
      {
        "id": "contour36-M01",
        "label": "36차 M01",
        "path": "contour36.html?case=M01"
      },
      {
        "id": "contour36-W",
        "label": "36차 W",
        "path": "contour36.html?case=W"
      },
      {
        "id": "photo36",
        "label": "다섯 사진 얼굴 작업대",
        "path": "photo-engine36.html"
      }
    ],
    "models": [],
    "limits": [
      "실행 가능한 보존 관찰창입니다. 공통 렌더러의 후속 변경이 들어갈 수 있어 당시 고정 그림과 구별합니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-37",
    "round": 37,
    "label": "37차",
    "description": "확인한 공개 보존 자료만 연결합니다.",
    "status": "live-and-records",
    "artifacts": [
      {
        "id": "round-37-0",
        "kind": "data",
        "label": "사선 정합 수치",
        "path": "oblique37.json",
        "sha256": "c2166ef85da930afff6d0b7aac5c4b031ba75f2102eb44cb6d6d0322a3af5b43"
      },
      {
        "id": "round-37-1",
        "kind": "data",
        "label": "고정 정합 가시 표본",
        "path": "projected37.json",
        "sha256": "6f4cf4000a7b7d0cac58f65fa930c9d791f9c5b31a70ec7e83b193ce6a41eeec"
      },
      {
        "id": "round-37-2",
        "kind": "data",
        "label": "notes37",
        "path": "notes37.json",
        "sha256": "800b2f2da172460fd991f05515112d5b0439164bf3e3dd56cf249c5c73dbc4e5"
      }
    ],
    "live": [
      {
        "id": "oblique37",
        "label": "두 인물 사선",
        "path": "profile37.html?case=F02&image=2"
      },
      {
        "id": "chin37",
        "label": "페른 강도0.75 후보",
        "path": "contour36.html?case=F02&cell=side&variant=chin37"
      }
    ],
    "models": [],
    "limits": [
      "실행 가능한 보존 관찰창입니다. 공통 렌더러의 후속 변경이 들어갈 수 있어 당시 고정 그림과 구별합니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-38",
    "round": 38,
    "label": "38차",
    "description": "확인한 공개 보존 자료만 연결합니다.",
    "status": "live-and-records",
    "artifacts": [
      {
        "id": "round-38-0",
        "kind": "image",
        "label": "orbit38-F02.png",
        "path": "orbit38-F02.png",
        "sha256": "862a456952793e741e9c712342f3350b5c393d64228195ac6e73a0c33a7be68f"
      },
      {
        "id": "round-38-1",
        "kind": "image",
        "label": "orbit38-M01.png",
        "path": "orbit38-M01.png",
        "sha256": "500e2654d13bc012278924645306587e7840a9adb4fa997bac3c9c4752bc4bab"
      },
      {
        "id": "round-38-2",
        "kind": "image",
        "label": "orbit38-W.png",
        "path": "orbit38-W.png",
        "sha256": "837f29ae1aacff63a09dea2649dc5b48f8670e5ca73623c9650f80adef04a90f"
      },
      {
        "id": "round-38-3",
        "kind": "data",
        "label": "face-eval38",
        "path": "face-eval38.json",
        "sha256": "48c104b9df4475b48c709831efe4b38e7e880df275a554867e951badd1cc8a63"
      },
      {
        "id": "round-38-4",
        "kind": "data",
        "label": "chest-eval38",
        "path": "chest-eval38.json",
        "sha256": "538f08a53c48fe760147ff70c74dae12a6b6cb95754a6d3631763e31134be8f1"
      },
      {
        "id": "round-38-5",
        "kind": "data",
        "label": "face-note38",
        "path": "face-note38.json",
        "sha256": "721ccaf849818f5ce16a48e71f6d7e67ae8f1a46e9a491f90c6006194010b9f4"
      },
      {
        "id": "round-38-6",
        "kind": "data",
        "label": "chest-note38",
        "path": "chest-note38.json",
        "sha256": "ab9480b41c999a403ca9cf95b8b2bb4b34cdaa5c5f4d2396b9ddf5e3b07deefb"
      },
      {
        "id": "round-38-source-7",
        "kind": "source-link",
        "label": "F02 2 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara2_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-38-source-8",
        "kind": "source-link",
        "label": "F02 4 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara2_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-38-source-9",
        "kind": "source-link",
        "label": "M01 2 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara4_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-38-source-10",
        "kind": "source-link",
        "label": "M01 4 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara4_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-38-source-11",
        "kind": "source-link",
        "label": "페른의 턱밑에서 머리카락이 시작되는 곳 원전",
        "url": "https://frieren-anime.jp/character/chara_group1/1-5/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-38-source-12",
        "kind": "source-link",
        "label": "힘멜의 턱끝과 옷깃 사이에서 피부선 구분하기 원전",
        "url": "https://frieren-anime.jp/character/chara_group1/1-2/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-38-source-13",
        "kind": "source-link",
        "label": "사선에서 넓고 높아 보이는 밑선 원전",
        "url": "https://doi.org/10.1007/s00266-021-02753-y",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-38-source-14",
        "kind": "source-link",
        "label": "양팔을 들 때 밑선과 유두 표식의 위치 원전",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10122703/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      }
    ],
    "live": [
      {
        "id": "viewer-38-F02",
        "label": "38차 F02",
        "path": "contour36.html?round=38&case=F02"
      },
      {
        "id": "viewer-38-M01",
        "label": "38차 M01",
        "path": "contour36.html?round=38&case=M01"
      },
      {
        "id": "viewer-38-W",
        "label": "38차 W",
        "path": "contour36.html?round=38&case=W"
      }
    ],
    "models": [],
    "limits": [
      "실행 가능한 보존 관찰창입니다. 공통 렌더러의 후속 변경이 들어갈 수 있어 당시 고정 그림과 구별합니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-39",
    "round": 39,
    "label": "39차",
    "description": "확인한 공개 보존 자료만 연결합니다.",
    "status": "live-and-records",
    "artifacts": [
      {
        "id": "round-39-0",
        "kind": "image",
        "label": "samples39-F02.png",
        "path": "samples39-F02.png",
        "sha256": "7e20a49d45a4be1bbc20ed1937fe666161a3ae96846c30745c443bda507fff89"
      },
      {
        "id": "round-39-1",
        "kind": "image",
        "label": "samples39-M01.png",
        "path": "samples39-M01.png",
        "sha256": "d4ada32c846f42091e4702f976435d873fb5179898a4a1dd9b3f9d2cdee26cda"
      },
      {
        "id": "round-39-2",
        "kind": "image",
        "label": "samples39-W.png",
        "path": "samples39-W.png",
        "sha256": "8e95180bbd7160039644bc865786b8882f047fbad28c0b1e0da84dfb88c8524e"
      },
      {
        "id": "round-39-3",
        "kind": "data",
        "label": "face-eval39",
        "path": "face-eval39.json",
        "sha256": "529564d66fb76217a948cce86b253dc7b10b99cafa32c84d46cc35eefaa7ce20"
      },
      {
        "id": "round-39-4",
        "kind": "data",
        "label": "chest-eval39",
        "path": "chest-eval39.json",
        "sha256": "652161ad33ad1666456f52a1a3f9f73769250094f0577fa93f31349bc507b983"
      },
      {
        "id": "round-39-5",
        "kind": "data",
        "label": "face-note39",
        "path": "face-note39.json",
        "sha256": "b61c33aaf86e350d1f17d9351d18274d256dbe1071c1f196f5eb096312dce3b4"
      },
      {
        "id": "round-39-6",
        "kind": "data",
        "label": "chest-note39",
        "path": "chest-note39.json",
        "sha256": "067bdaecc396913fa060adf44af7496440684a7978107fb68d725693d7b962b5"
      },
      {
        "id": "round-39-source-7",
        "kind": "source-link",
        "label": "페른의 턱밑에서 밝은 두 선을 따로 재다 원전",
        "url": "https://frieren-anime.jp/character/chara_group1/1-5/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-39-source-8",
        "kind": "source-link",
        "label": "추가 원전",
        "url": "https://escholarship.org/uc/item/7657d8h3",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-39-source-9",
        "kind": "source-link",
        "label": "추가 원전",
        "url": "https://doi.org/10.1080/10867651.1999.10487501",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-39-source-10",
        "kind": "source-link",
        "label": "힘멜의 턱 그림자가 뒤쪽에서 다시 밝아지는 조건 원전",
        "url": "https://frieren-anime.jp/character/chara_group1/1-2/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-39-source-11",
        "kind": "source-link",
        "label": "사선과 측면에서 밑바닥을 만드는 피부점 원전",
        "url": "https://doi.org/10.1007/s00266-021-02753-y",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-39-source-12",
        "kind": "source-link",
        "label": "정면에서 두 줄로 보이던 접힘 원전",
        "url": "https://scholars.houstonmethodist.org/en/publications/the-intradermal-anatomy-of-the-inframammary-fold/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      }
    ],
    "live": [
      {
        "id": "viewer-39-F02",
        "label": "39차 F02",
        "path": "contour36.html?round=39&case=F02"
      },
      {
        "id": "viewer-39-M01",
        "label": "39차 M01",
        "path": "contour36.html?round=39&case=M01"
      },
      {
        "id": "viewer-39-W",
        "label": "39차 W",
        "path": "contour36.html?round=39&case=W"
      }
    ],
    "models": [],
    "limits": [
      "실행 가능한 보존 관찰창입니다. 공통 렌더러의 후속 변경이 들어갈 수 있어 당시 고정 그림과 구별합니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-40",
    "round": 40,
    "label": "40차",
    "description": "확인한 공개 보존 자료만 연결합니다.",
    "status": "live-and-records",
    "artifacts": [
      {
        "id": "round-40-0",
        "kind": "image",
        "label": "native40-F02-48.png",
        "path": "native40-F02-48.png",
        "sha256": "3734c4fd1eec67dfbe00c0157c179803f1e5d35ddbbbe163b43f39f5af2c407c"
      },
      {
        "id": "round-40-1",
        "kind": "image",
        "label": "native40-F02-96.png",
        "path": "native40-F02-96.png",
        "sha256": "04f90ddde96eedae1bf36f249f9e621ddf56c1224a4dca073bdb7dccb805ac85"
      },
      {
        "id": "round-40-2",
        "kind": "image",
        "label": "native40-M01-48.png",
        "path": "native40-M01-48.png",
        "sha256": "a51973d3ddfbc2e512694815f1ddcef3b8ebea26de26cf7c0a3fb4ab066e69ac"
      },
      {
        "id": "round-40-3",
        "kind": "image",
        "label": "native40-M01-96.png",
        "path": "native40-M01-96.png",
        "sha256": "4376b328fe2580e2a8f106d5861dd1089578ab394b9962dbc3cb307aeabd66dc"
      },
      {
        "id": "round-40-4",
        "kind": "data",
        "label": "face-eval40",
        "path": "face-eval40.json",
        "sha256": "ca50aca29545356aaa1c3772912ed1a4e8d475164beac957397b617595d9961a"
      },
      {
        "id": "round-40-5",
        "kind": "data",
        "label": "chest-eval40",
        "path": "chest-eval40.json",
        "sha256": "f803a87788a0f77fb5a37f2bac78a281ecd13200ec61d75c3dd040aae00d7015"
      },
      {
        "id": "round-40-6",
        "kind": "data",
        "label": "face-note40",
        "path": "face-note40.json",
        "sha256": "69ca4dbb9eeb8798f5e82c823fafe8a787dae3e237c55a4e337f3da06ffc6ce6"
      },
      {
        "id": "round-40-7",
        "kind": "data",
        "label": "chest-note40",
        "path": "chest-note40.json",
        "sha256": "f9608c88b3f63717c80695d10a4e2e5ceb2c113fc6da217175212b0b449442ea"
      },
      {
        "id": "round-40-source-8",
        "kind": "source-link",
        "label": "F02 1 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara2_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-40-source-9",
        "kind": "source-link",
        "label": "F02 2 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara2_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-40-source-10",
        "kind": "source-link",
        "label": "F02 3 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara2_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-40-source-11",
        "kind": "source-link",
        "label": "F02 4 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara2_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-40-source-12",
        "kind": "source-link",
        "label": "M01 1 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara4_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-40-source-13",
        "kind": "source-link",
        "label": "M01 2 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara4_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-40-source-14",
        "kind": "source-link",
        "label": "M01 3 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara4_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-40-source-15",
        "kind": "source-link",
        "label": "M01 4 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara4_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-40-source-16",
        "kind": "source-link",
        "label": "페른의 먼 눈은 얼마나 보이는가 원전",
        "url": "https://frieren-anime.jp/character/chara_group1/1-5/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-40-source-17",
        "kind": "source-link",
        "label": "추가 원전",
        "url": "https://doi.org/10.1145/311535.311556",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-40-source-18",
        "kind": "source-link",
        "label": "추가 원전",
        "url": "https://shapemodelling.cs.unibas.ch/gravis-site-archive/Sigg99.html",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-40-source-19",
        "kind": "source-link",
        "label": "힘멜의 사선에서 먼 눈이 사라지는 반례 원전",
        "url": "https://frieren-anime.jp/character/chara_group1/1-2/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-40-source-20",
        "kind": "source-link",
        "label": "측면과 사선에서 밑바닥을 만드는 피부점 원전",
        "url": "https://doi.org/10.1068/p130321",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-40-source-21",
        "kind": "source-link",
        "label": "같은 형상의 카메라 대조와 반대쪽 팔 자세 원전",
        "url": "https://doi.org/10.1007/s00266-021-02753-y",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      }
    ],
    "live": [
      {
        "id": "viewer-40-F02",
        "label": "40차 F02",
        "path": "contour36.html?round=40&case=F02"
      },
      {
        "id": "viewer-40-M01",
        "label": "40차 M01",
        "path": "contour36.html?round=40&case=M01"
      },
      {
        "id": "viewer-40-W",
        "label": "40차 W",
        "path": "contour36.html?round=40&case=W"
      }
    ],
    "models": [],
    "limits": [
      "실행 가능한 보존 관찰창입니다. 공통 렌더러의 후속 변경이 들어갈 수 있어 당시 고정 그림과 구별합니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-41",
    "round": 41,
    "label": "41차",
    "description": "확인한 공개 보존 자료만 연결합니다.",
    "status": "live-and-records",
    "artifacts": [
      {
        "id": "round-41-0",
        "kind": "image",
        "label": "iris41-F02-192.png",
        "path": "iris41-F02-192.png",
        "sha256": "e4a539b8c3fd06b7fb170a3e4a819853b226d6e4b67f46c85549dab8e88d6dce"
      },
      {
        "id": "round-41-1",
        "kind": "image",
        "label": "iris41-F02-48.png",
        "path": "iris41-F02-48.png",
        "sha256": "963eea40d04c513ab92f9b747be8e4261e2cd87c3db050d55e6626f4bec4ea13"
      },
      {
        "id": "round-41-2",
        "kind": "image",
        "label": "iris41-F02-96.png",
        "path": "iris41-F02-96.png",
        "sha256": "554f2e16071b712e0667d4ed208dc7c04e93d2b878cb57318b92a8c87ef44ce1"
      },
      {
        "id": "round-41-3",
        "kind": "image",
        "label": "iris41-M01-192.png",
        "path": "iris41-M01-192.png",
        "sha256": "5ebf6c7e0238abec4a3b5fafe22b86c542c0899178e2b004d849dbcf02ebb9ac"
      },
      {
        "id": "round-41-4",
        "kind": "image",
        "label": "iris41-M01-48.png",
        "path": "iris41-M01-48.png",
        "sha256": "1ce979cd0d933c6d0306667d129e72e6217232600d1d6a5d002881fc281eb81b"
      },
      {
        "id": "round-41-5",
        "kind": "image",
        "label": "iris41-M01-96.png",
        "path": "iris41-M01-96.png",
        "sha256": "2dcb686c8e762d33a396f241305ef49d0cce067f43e1e572f48c882dda30389c"
      },
      {
        "id": "round-41-6",
        "kind": "data",
        "label": "face-eval41",
        "path": "face-eval41.json",
        "sha256": "91db53ebfb6b4a513f9ee588a507963c7282af3f85ede09af9c0f7abcc8ba91b"
      },
      {
        "id": "round-41-7",
        "kind": "data",
        "label": "chest-eval41",
        "path": "chest-eval41.json",
        "sha256": "876b583097ef3658cee05f5344daf9f1ea2e3636b7d3704539f1f3655d0450d5"
      },
      {
        "id": "round-41-8",
        "kind": "data",
        "label": "face-note41",
        "path": "face-note41.json",
        "sha256": "a79798aef5043127f6ec8e6d8aea6a41fb53480afc18ed93a65dac71c4d75e84"
      },
      {
        "id": "round-41-9",
        "kind": "data",
        "label": "chest-note41",
        "path": "chest-note41.json",
        "sha256": "0ccfc7921c9558c9d97213b0dd6d029ff1ef8691d462cbfa9a9109e6c5f9ef41"
      },
      {
        "id": "round-41-10",
        "kind": "data",
        "label": "iris-eval41",
        "path": "iris-eval41.json",
        "sha256": "aa33763823d4ff83bd76e60153fadbbd995f5ddeebb9d83a2e9126295a1ac86a"
      },
      {
        "id": "round-41-11",
        "kind": "data",
        "label": "iris-note41",
        "path": "iris-note41.json",
        "sha256": "8fdc0500b00b0653d97fec346412b1e98f191acf6ae09725267f0dc279f2997a"
      },
      {
        "id": "round-41-source-12",
        "kind": "source-link",
        "label": "M01 설정1 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara4_face1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-41-source-13",
        "kind": "source-link",
        "label": "해당 공식 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-2/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-41-source-14",
        "kind": "source-link",
        "label": "M01 설정2 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara4_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-41-source-15",
        "kind": "source-link",
        "label": "M01 설정3 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara4_face3.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-41-source-16",
        "kind": "source-link",
        "label": "M01 설정4 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara4_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-41-source-17",
        "kind": "source-link",
        "label": "M01 1화2 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/09/01_02.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-41-source-18",
        "kind": "source-link",
        "label": "해당 공식 원전 페이지",
        "url": "https://frieren-anime.jp/story/1st/ep01/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-41-source-19",
        "kind": "source-link",
        "label": "M01 12화1 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/11/01_01-4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-41-source-20",
        "kind": "source-link",
        "label": "해당 공식 원전 페이지",
        "url": "https://frieren-anime.jp/story/1st/ep12/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-41-source-21",
        "kind": "source-link",
        "label": "추가 원전",
        "url": "https://www.epfl.ch/labs/cvlab/software/multi-view-stereo/epnp/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-41-source-22",
        "kind": "source-link",
        "label": "B3 밑선은 화면에서 무엇을 가리키는가 원전",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7228683/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-41-source-23",
        "kind": "source-link",
        "label": "두 밑면 후보를 회전시켜 40차와 비교 원전",
        "url": "https://doi.org/10.1007/s00266-021-02753-y",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-41-source-24",
        "kind": "source-link",
        "label": "페른의 같은 눈 위에 보라색 두 층을 놓았을 때 원전",
        "url": "https://frieren-anime.jp/character/chara_group1/1-5/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-41-source-25",
        "kind": "source-link",
        "label": "추가 원전",
        "url": "https://www.w3.org/TR/css-color-4/#ok-lab",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      }
    ],
    "live": [
      {
        "id": "viewer-41-F02",
        "label": "41차 F02",
        "path": "contour36.html?round=41&case=F02"
      },
      {
        "id": "viewer-41-M01",
        "label": "41차 M01",
        "path": "contour36.html?round=41&case=M01"
      },
      {
        "id": "viewer-41-W",
        "label": "41차 W",
        "path": "contour36.html?round=41&case=W"
      }
    ],
    "models": [],
    "limits": [
      "실행 가능한 보존 관찰창입니다. 공통 렌더러의 후속 변경이 들어갈 수 있어 당시 고정 그림과 구별합니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  },
  {
    "id": "round-42",
    "round": 42,
    "label": "42차",
    "description": "확인한 공개 보존 자료만 연결합니다.",
    "status": "live-and-records",
    "artifacts": [
      {
        "id": "round-42-0",
        "kind": "image",
        "label": "chest-plate42.png",
        "path": "chest-plate42.png",
        "sha256": "1942c49b569e1b61640982ffa12cded0d3451a15fa6579318c8aedc6e3175712"
      },
      {
        "id": "round-42-1",
        "kind": "image",
        "label": "chest-poses42.png",
        "path": "chest-poses42.png",
        "sha256": "43d2a5987bd8c4baa35e3d48440bba3055dd83242a70ef8394592390e4bfc46d"
      },
      {
        "id": "round-42-2",
        "kind": "data",
        "label": "face-eval42",
        "path": "face-eval42.json",
        "sha256": "91f423ddde9f0d03d5561d17bf2d277d6b86cff53db655fd8475630418bf3756"
      },
      {
        "id": "round-42-3",
        "kind": "data",
        "label": "chest-eval42",
        "path": "chest-eval42.json",
        "sha256": "b564f0d005e0a916f0d74e3ff0f970df18ab6f20f9f13a61d266e678d9ecc9be"
      },
      {
        "id": "round-42-4",
        "kind": "data",
        "label": "face-note42",
        "path": "face-note42.json",
        "sha256": "fc4b3e2f4fb3a007c9ada947deb7d161acd87f150ed7bc4762d109013c18268c"
      },
      {
        "id": "round-42-5",
        "kind": "data",
        "label": "chest-note42",
        "path": "chest-note42.json",
        "sha256": "3e5671718228c48f9239c3d7ef7679d108899a6f4548a9ef4e4547e750b56bb3"
      },
      {
        "id": "round-42-6",
        "kind": "data",
        "label": "과거 기준 머리로 등록한 반례",
        "path": "face-legacy-registration42.json",
        "sha256": "580613a22f3479f228396a69545bcab1b39cab7bd9e890d43cfad458d00cb642"
      },
      {
        "id": "round-42-7",
        "kind": "data",
        "label": "구도 민감도 반례",
        "path": "face-registration-sensitivity42.json",
        "sha256": "20641a3cc591263225b6963db25309ec62aff41cf35b3405225530552d108dde"
      },
      {
        "id": "round-42-source-8",
        "kind": "source-link",
        "label": " 설정2 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara2_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-42-source-9",
        "kind": "source-link",
        "label": "해당 공식 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-5/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-42-source-10",
        "kind": "source-link",
        "label": " 설정4 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara2_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-42-source-11",
        "kind": "source-link",
        "label": " 17-10 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/12/01_06.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-42-source-12",
        "kind": "source-link",
        "label": "해당 공식 원전 페이지",
        "url": "https://frieren-anime.jp/story/1st/ep17/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-42-source-13",
        "kind": "source-link",
        "label": " 5-9 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/09/01_09-1.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-42-source-14",
        "kind": "source-link",
        "label": "해당 공식 원전 페이지",
        "url": "https://frieren-anime.jp/story/1st/ep05/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-42-source-15",
        "kind": "source-link",
        "label": " 설정2 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara4_face2.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-42-source-16",
        "kind": "source-link",
        "label": "해당 공식 원전 페이지",
        "url": "https://frieren-anime.jp/character/chara_group1/1-2/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-42-source-17",
        "kind": "source-link",
        "label": " 설정4 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/08/chara4_face4.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-42-source-18",
        "kind": "source-link",
        "label": " 16-3 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/12/01_02-5.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-42-source-19",
        "kind": "source-link",
        "label": "해당 공식 원전 페이지",
        "url": "https://frieren-anime.jp/story/1st/ep16/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-42-source-20",
        "kind": "source-link",
        "label": " 17-4 원본",
        "url": "https://frieren-anime.jp/wp-content/uploads/2023/12/01_03-6.jpg",
        "role": "original-image",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-42-source-21",
        "kind": "source-link",
        "label": "추가 원전",
        "url": "https://www.gutenberg.org/files/77743/77743-h/77743-h.htm",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-42-source-22",
        "kind": "source-link",
        "label": "흉벽으로 돌아가는 자리를 두고 밑면의 굽이를 옮겼다 원전",
        "url": "https://pubmed.ncbi.nlm.nih.gov/32590636/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      },
      {
        "id": "round-42-source-23",
        "kind": "source-link",
        "label": "같은 광원에서 본 사선·측면·두 팔 올림 원전",
        "url": "https://pubmed.ncbi.nlm.nih.gov/27693271/",
        "role": "citation",
        "note": "원전 서버로 연결합니다. 원본 픽셀을 이 공개 묶음에 복사하지 않았습니다."
      }
    ],
    "live": [
      {
        "id": "fern42",
        "label": "41기준·42페른 턱 후보",
        "path": "face42.html?case=F02"
      },
      {
        "id": "himmel42",
        "label": "힘멜 권고 기본 유지",
        "path": "face42.html?case=M01"
      },
      {
        "id": "himmel-held42",
        "label": "힘멜 보류 후보",
        "path": "face42.html?case=M01&variant=candidate&cell=16-3"
      },
      {
        "id": "chest42",
        "label": "40기본·42가슴 후보",
        "path": "chest-review42.html?cell=B3"
      }
    ],
    "models": [],
    "limits": [
      "실행 가능한 보존 관찰창입니다. 공통 렌더러의 후속 변경이 들어갈 수 있어 당시 고정 그림과 구별합니다.",
      "비공개 원본의 존재·범위는 공개 파일만으로 추정하지 않습니다. 관리자 기록은 별도 권한에서 확인합니다."
    ]
  }
]);

export const studioHistoryUnassigned=Object.freeze([
  {
    "id": "unassigned-0",
    "kind": "image",
    "label": "adult-anime-target-v1.png",
    "path": "studies/adult-anime-target-v1.png",
    "sha256": "1b670bb3ae93119f34225652b54ae26c9c190b34c3dc4f2ef13109dd736b2990",
    "note": "파일명의 v1은 참고 시안 자체의 판수입니다. 연구1차와 동일하다는 증거가 없어 회차에 배정하지 않습니다."
  },
  {
    "id": "unassigned-1",
    "kind": "image",
    "label": "adult-face-target-v1.png",
    "path": "studies/adult-face-target-v1.png",
    "sha256": "b80f5a930598a81d0c6a30c183e10f1fe6fb26c8af024899adb9a9a3d839db3b",
    "note": "파일명의 v1은 참고 시안 자체의 판수입니다. 연구1차와 동일하다는 증거가 없어 회차에 배정하지 않습니다."
  },
  {
    "id": "unassigned-initial-tests",
    "kind": "data",
    "label": "회차번호 없는 초기 순수 함수 검사",
    "path": "qa/pure-tests.json",
    "sha256": "b805af8604e4faea9cb36c0db164c487fd087684f6e4d1ffc0d6bbe4534dca69",
    "note": "실제 파일이나 round/version 필드가 없어1차에 귀속시키지 않습니다."
  }
]);
export const studioHistorySources=Object.freeze([
  {
    "path": "../research/hub/releases.json",
    "kind": "hosted-releases",
    "description": "현재 공개 release별 id/round/at/cardsSha/hostSource를 보존. 같은 회차도 id별로 구분."
  },
  {
    "path": "round{round}.html",
    "kind": "journal-links",
    "description": "실제 비교 진입 링크를 수집하는 최신 경로. 없는 회차의 페이지를 지어내지 않음."
  },
  {
    "path": "face-note{round}.json",
    "kind": "notes",
    "description": "실제 새 원고가 있는 회차만 수집. 카드/모델 동일성을 자동 추정하지 않음."
  },
  {
    "path": "chest-note{round}.json",
    "kind": "notes",
    "description": "가슴 원고의 local·url·sources·noteId로 연결."
  },
  {
    "path": "studio-catalog.mjs",
    "kind": "manual-tools",
    "description": "일반 관찰 도구. 새 화면은 명시적 등록 필요."
  }
]);
// release는 문서의 공개 판이다. 같은 모델인지에 대한 증거가 없으면 release id를 모델 해시로 쓰지 않는다.
export function withHostedReleases(rows){
 const result=[...studioHistory],seen=new Set(result.map(r=>r.id));
 for(const r of Array.isArray(rows)?rows:[]){if(r?.project!=='bookfriend'||!Number.isSafeInteger(r.round)||r.round<1||typeof r.id!=='string'||!/^[a-f0-9]{24}$/.test(r.id))continue;const id='release-'+r.id;if(seen.has(id))continue;seen.add(id);const base=studioHistory.find(x=>x.round===r.round);result.push({...(base||{round:r.round,artifacts:[],live:[],models:[],limits:['이 회차의 모델/그림은 아직 색인하지 않았습니다. 최신 일지를 확인하세요.']}),id,label:r.label||r.round+'차 공개판',status:base?.status||'unindexed',release:{id:r.id,at:r.at,cards:r.cards,cardsSha:r.cardsSha,hostSource:r.hostSource||null,extraHostedNotes:r.extraHostedNotes||[],adminOriginal:(r.sealedSha||r.hostSource)?'별도 관리자 보존본. 이 목록에서 열거나 복호화하지 않음':'공개 metadata로 확인 못 함'},modelEvidence:'release의 문서 지문과 모델 기하 지문은 다릅니다. 같은 회차·같은 live 경로라도 release id를 분리해 보존합니다.'});}
 return result;
}

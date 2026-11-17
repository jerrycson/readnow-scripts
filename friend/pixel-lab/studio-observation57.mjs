// 확정57 원자료를 바꾸지 않는 관측형 정정. 원파일 지문과 행 전체를 확인한다.
export const observationSource57=Object.freeze({file:'studio-training57.json',sha256:'c81ffbcef8c3e70688bef0651480863d5d68d3f4eeb3447ea8015514f4d2a99e',adapter:'57-diagnostic-1'});
const originals=[
  {
    "id": "r57-437",
    "subject": "studio",
    "episode": "r57-knee-first",
    "source": "knee-eval57.json",
    "unit": "px",
    "task": "movement",
    "method": "pose",
    "outcome": "measured",
    "metricBefore": 322,
    "metricAfter": 19,
    "note": "48px · 200쌍의 첫 굽힘에서 채널차 8 이상인 화소 합계. 반복 중립 렌더를 고유 상태로 세지 않음. 실제 사람 움직임 오차가 아님.",
    "publicationPhase": "pre-publication",
    "adoption": "not-approved",
    "scope": "cohort",
    "resolution": 48,
    "pairs": 200
  },
  {
    "id": "r57-438",
    "subject": "studio",
    "episode": "r57-knee-first",
    "source": "knee-eval57.json",
    "unit": "px",
    "task": "movement",
    "method": "pose",
    "outcome": "measured",
    "metricBefore": 1164,
    "metricAfter": 62,
    "note": "96px · 200쌍의 첫 굽힘에서 채널차 8 이상인 화소 합계. 반복 중립 렌더를 고유 상태로 세지 않음. 실제 사람 움직임 오차가 아님.",
    "publicationPhase": "pre-publication",
    "adoption": "not-approved",
    "scope": "cohort",
    "resolution": 96,
    "pairs": 200
  },
  {
    "id": "r57-439",
    "subject": "studio",
    "episode": "r57-knee-first",
    "source": "knee-eval57.json",
    "unit": "px",
    "task": "movement",
    "method": "pose",
    "outcome": "measured",
    "metricBefore": 84386,
    "metricAfter": 1338,
    "note": "1024px · 200쌍의 첫 굽힘에서 채널차 8 이상인 화소 합계. 반복 중립 렌더를 고유 상태로 세지 않음. 실제 사람 움직임 오차가 아님.",
    "publicationPhase": "pre-publication",
    "adoption": "not-approved",
    "scope": "cohort",
    "resolution": 1024,
    "pairs": 200
  },
  {
    "id": "r57-446",
    "subject": "W",
    "episode": "r57-chest-registration",
    "source": "chest-eval57.json",
    "unit": "px",
    "task": "alignment",
    "method": "direct",
    "outcome": "measured",
    "metricBefore": 34.255460941327264,
    "metricAfter": 62.85464478772958,
    "note": "상단·최대돌출 · 84°/0° · 같은 측면의 등록 선택에 따라 판정이 반대다. 성공·실패를 모두 보존하고 등록 확정 전 형상 학습에서 제외.",
    "publicationPhase": "pre-publication",
    "adoption": "not-approved",
    "scope": "cohort",
    "yaw": 84,
    "pitch": 0,
    "registration": "상단·최대돌출"
  },
  {
    "id": "r57-447",
    "subject": "W",
    "episode": "r57-chest-registration",
    "source": "chest-eval57.json",
    "unit": "px",
    "task": "alignment",
    "method": "direct",
    "outcome": "measured",
    "metricBefore": 133.78825022055838,
    "metricAfter": 82.2784202198464,
    "note": "상단·유두 · 84°/0° · 같은 측면의 등록 선택에 따라 판정이 반대다. 성공·실패를 모두 보존하고 등록 확정 전 형상 학습에서 제외.",
    "publicationPhase": "pre-publication",
    "adoption": "not-approved",
    "scope": "cohort",
    "yaw": 84,
    "pitch": 0,
    "registration": "상단·유두"
  },
  {
    "id": "r57-448",
    "subject": "W",
    "episode": "r57-chest-registration",
    "source": "chest-eval57.json",
    "unit": "px",
    "task": "alignment",
    "method": "direct",
    "outcome": "measured",
    "metricBefore": 34.633203063470084,
    "metricAfter": 60.307554325328915,
    "note": "상단·최대돌출 · 90°/0° · 같은 측면의 등록 선택에 따라 판정이 반대다. 성공·실패를 모두 보존하고 등록 확정 전 형상 학습에서 제외.",
    "publicationPhase": "pre-publication",
    "adoption": "not-approved",
    "scope": "cohort",
    "yaw": 90,
    "pitch": 0,
    "registration": "상단·최대돌출"
  },
  {
    "id": "r57-449",
    "subject": "W",
    "episode": "r57-chest-registration",
    "source": "chest-eval57.json",
    "unit": "px",
    "task": "alignment",
    "method": "direct",
    "outcome": "measured",
    "metricBefore": 97.74314531325612,
    "metricAfter": 64.37831296368857,
    "note": "상단·유두 · 90°/0° · 같은 측면의 등록 선택에 따라 판정이 반대다. 성공·실패를 모두 보존하고 등록 확정 전 형상 학습에서 제외.",
    "publicationPhase": "pre-publication",
    "adoption": "not-approved",
    "scope": "cohort",
    "yaw": 90,
    "pitch": 0,
    "registration": "상단·유두"
  },
  {
    "id": "r57-450",
    "subject": "W",
    "episode": "r57-chest-registration",
    "source": "chest-eval57.json",
    "unit": "px",
    "task": "alignment",
    "method": "direct",
    "outcome": "measured",
    "metricBefore": 33.31291328761151,
    "metricAfter": 50.82508623355546,
    "note": "상단·최대돌출 · 96°/0° · 같은 측면의 등록 선택에 따라 판정이 반대다. 성공·실패를 모두 보존하고 등록 확정 전 형상 학습에서 제외.",
    "publicationPhase": "pre-publication",
    "adoption": "not-approved",
    "scope": "cohort",
    "yaw": 96,
    "pitch": 0,
    "registration": "상단·최대돌출"
  },
  {
    "id": "r57-451",
    "subject": "W",
    "episode": "r57-chest-registration",
    "source": "chest-eval57.json",
    "unit": "px",
    "task": "alignment",
    "method": "direct",
    "outcome": "measured",
    "metricBefore": 78.22845020875249,
    "metricAfter": 42.22864835365173,
    "note": "상단·유두 · 96°/0° · 같은 측면의 등록 선택에 따라 판정이 반대다. 성공·실패를 모두 보존하고 등록 확정 전 형상 학습에서 제외.",
    "publicationPhase": "pre-publication",
    "adoption": "not-approved",
    "scope": "cohort",
    "yaw": 96,
    "pitch": 0,
    "registration": "상단·유두"
  }
];
const exact=new Map(originals.map(row=>[row.id,Object.freeze(row)]));
const canonical=value=>value===null||typeof value!=='object'?JSON.stringify(value):Array.isArray(value)?'['+value.map(canonical).join(',')+']':'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
function same(row){const {observation57,...payload}=row;return exact.has(row.id)&&canonical(payload)===canonical(exact.get(row.id));}
function marker(id){return {id:'r57-observation-'+id,sourceFile:observationSource57.file,sourceSha256:observationSource57.sha256};}
export function applyObservations57(rows,source){
 return rows.map(row=>{
  if(!exact.has(row.id))return row;
  if(source.file!==observationSource57.file||source.sha256!==observationSource57.sha256)throw Error('진단 관측의 원본 지문이 다릅니다.');
  if(!same(row))throw Error('진단 관측의 원래 행 내용이 다릅니다.');
  return {...row,observation57:marker(row.id)};
 });
}
export function diagnosticObservation57(row){
 if(row.observation57==null)return null;
 if(!same(row)||canonical(row.observation57)!==canonical(marker(row.id)))throw Error('검증하지 않은 진단 관측 표식입니다.');
 const total=row.id==='r57-437'||row.id==='r57-438'||row.id==='r57-439';
 return {id:row.observation57.id,rowId:row.id,sourceFile:observationSource57.file,sourceSha256:observationSource57.sha256,adapter:observationSource57.adapter,
  kind:total?'changed-pixel-total':'registration-sensitivity',
  label:total?'바뀐 화소 합계':'등록 민감도',
  reason:total?'같은 모델의 첫 굽힘 200쌍에서 채널차 8 이상인 화소의 합계입니다. 표본 평균·독립 사람 표본·회귀학습·승격 점수로 쓰지 않습니다.':'같은 측면의 카메라와 등록 표점 선택을 대조한 진단입니다. 대응이 미확정이므로 독립 표본·평균점수·회귀학습·승격 근거로 쓰지 않습니다.',
  ...(total?{resolution:row.resolution,pairs:row.pairs}:{yaw:row.yaw,pitch:row.pitch,registration:row.registration})};
}

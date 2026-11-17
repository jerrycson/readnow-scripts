// 두 연구의 결정·결과 서식을 묶는다. 입력은 수치와 공개 연구 식별자만 받는다.
export const definitions=Object.freeze({
 'friend-studio':{title:'정밀 조형',purpose:'얼굴·몸통 표점이 사용자가 찍은 화면 좌표에 닿도록 두 교정값을 제안한다.',
  metric:'목표 정점까지 거리 · 192px 환산, 작을수록 좋음',next:'같은 중립 표점·목표·시점을 고정하고 추천을 보기 전 사람의 직접 조작 결과를 별도로 잰다.',
  limits:'미학습 부위, 관절을 움직인 자세, 사진으로 바꾼 형상은 보류한다.',target:'../../pixel-lab/studio-sculpt.html?case=F02#sculptLearning44'},
 'friend-photo':{title:'내 참고그림',purpose:'여러 방향의 실루엣에서 두상 외곽을 복원해 보류 시점의 경계 오차를 줄인다.',
  metric:'보류 시점 피부 경계 거리 · 128px, 작을수록 좋음',next:'동일한 보류 시점에서 사람이 독립적으로 만든 윤곽과 엔진 결과를 같은 경계 거리로 잰다.',
  limits:'다른 머리, 기울어진 상자 및 각진 도형의 결과를 따로 확인한다.',target:'../photo-model/ridge44.html'}
});
export const stages=['후보','그림자 · 셈만','안내','작게 실제 적용','전부 적용'];
const units=['px','ratio','step','none'],outcomes=['observed','measured','accepted','rejected','deferred','reverted'];
const tasks=['surface','alignment','movement','comparison','repeatability'],methods=['direct','learned','baseline','photo','pose','archive','simulation'];
const finite=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
const fail=msg=>{throw new TypeError(msg);};
const iso=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))?new Date(s).toISOString():fail('관측 시각을 확인하세요.');
const okName=v=>typeof v==='string'&&v.length>0&&v.length<160&&!/[\r\n<>]/.test(v);
export function studyOf(row){return row.task==='alignment'||row.method==='photo'?'friend-photo':'friend-studio';}
export function evidenceType(r,origin){
 if(origin==='device')return 'device';
 if(r.source==='photo-oof44.json'&&r.id==='r44-face-oof-four-fold')return 'synthetic-oof';
 if(r.source==='photo-eval44.json'){
  const group=r.id.replace(/^r44-/,'');if(group==='scanClean'||group==='scanTiltedBox')return 'scan';
  if(group==='counterexample')return 'counterexample';if(group==='syntheticHeld')return 'synthetic';
 }
 if(r.source==='studio-sculpt-eval44.json')return 'mesh';
 if(r.source==='face-eval42.json'||r.source==='chest-eval42.json')return 'registered';
 return 'published';
}
export function toFramework(row,{origin,at}){
 if(!['device','release'].includes(origin)||!okName(row?.id)||!okName(row.episode)||!tasks.includes(row.task)||!methods.includes(row.method)||!outcomes.includes(row.outcome)||!units.includes(row.unit))fail('지원하지 않는 근거 형식입니다.');
 const t=iso(origin==='device'?row.at:at);
 if((row.metricBefore!=null||row.metricAfter!=null)&&(!finite(row.metricBefore)||!finite(row.metricAfter)))fail('전후 측정값 쌍이 불완전합니다.');
 if(row.outcome==='measured'&&(row.metricBefore==null||row.unit==='none'))fail('측정 기록에는 단위와 실제 수치가 필요합니다.');
 if(!['F02','M01','W','studio','world'].includes(row.subject))fail('등록되지 않은 대상입니다.');
 const engine=studyOf(row),type=evidenceType(row,origin),decisionId=engine+'/'+origin+'/'+row.id,entityId=engine+'/'+row.subject;
 const allowReview=origin==='device'&&['accepted','rejected','deferred','reverted'].includes(row.outcome);
 const src=origin==='release'?'release:'+String(row.source||'연구 공개본'):'device';
 const fv={};for(const key of ['yaw','pitch'])if(row[key]!=null){if(!Number.isFinite(row[key])||Math.abs(row[key])>360)fail('카메라 각도가 유효하지 않습니다.');fv[key]=row[key];}
 if(row.metricBefore!=null)fv.initialMetric=row.metricBefore;
 const attrs={subject:row.subject};if(typeof row.zone==='string'&&/^[a-zA-Z][a-zA-Z0-9_-]{0,30}$/.test(row.zone))attrs.zone=row.zone;
 const count=row.scope==='cohort'?row.count:1;if(!Number.isInteger(count)||count<1)fail('집계 표본 수 오류');
 const numeric=row.metricAfter!=null;
 return {
  entity:{id:entityId,kind:'source',attrs,domain:'bookfriend'},
  event:{entity:entityId,t,type:'snapshot',src,v:{task:row.task,method:row.method,outcome:row.outcome,origin,type,count,scope:row.scope==='cohort'?'cohort':'single',episode:row.episode,clock:origin==='device'?'recorded':'release'}},
  feature:{entity:entityId,t,fset:'friend-observation-1',fv},
  decision:{id:decisionId,engine,engineVer:'44',modelId:origin==='release'?row.source||null:null,entity:entityId,t,
   options:['record','hold'],pick:'record',why:[numeric?'관측한 전후 수치와 단위를 함께 기록':'도구 사용 또는 검토 선택을 기록','독립 사람 기준선이 없어 자동 실행 보류'],
   conf:0,expect:{confidenceBasis:'자동 실행을 뒷받침하는 독립 사람 대조 미수집'},undo:{how:'append-correction',to:decisionId,until:null},
   human:allowReview?{pick:row.outcome,by:'device-review',t}:null,exp:null,act:'none'},
  outcome:{decision:decisionId,due:t,closedAt:t,y:{before:row.metricBefore??null,after:row.metricAfter??null,unit:row.unit,observed:row.outcome}},
  feedback:{decision:decisionId,score:{engine:row.method==='learned'||row.method==='photo'?row.metricAfter??null:null,human:null,baseline:numeric?row.metricBefore:null},metric:row.unit,winner:null},
  experiment:{id:null,hypo:null,arms:[],assign:null,fence:{maxShare:0,dayLoss:null,stopIf:'사람 독립 대조 없음'},state:'unassigned',result:{effect:null,ci:null,n:0},proposedBy:null,approvedBy:null}
 };
}
export function validateFramework(record){
 const r=record;const keys=['entity','event','feature','decision','outcome','feedback','experiment'];
 if(!r||Object.keys(r).length!==7||keys.some(k=>!r[k]))fail('공통 일곱 칸 누락');
 const required={entity:['id','kind','attrs','domain'],event:['entity','t','type','v','src'],feature:['entity','t','fv','fset'],
  decision:['id','engine','engineVer','modelId','entity','t','options','pick','why','conf','expect','undo','human','exp','act'],
  outcome:['decision','due','y','closedAt'],feedback:['decision','score','metric','winner'],
  experiment:['id','hypo','arms','assign','fence','state','result','proposedBy','approvedBy']};
 for(const [k,fields] of Object.entries(required))if(fields.some(field=>!Object.hasOwn(r[k],field)))fail(k+' 필수 필드 누락');
 const d=r.decision;
 if(!Object.hasOwn(definitions,d.engine)||!okName(d.id)||!d.why?.length||d.why.some(s=>!okName(s))||!Number.isFinite(d.conf)||d.conf<0||d.conf>1||!d.undo?.how)fail('판정 근거·확신·복원 정보 누락');
 if(d.entity!==r.entity.id||r.event.entity!==r.entity.id||r.feature.entity!==r.entity.id||r.outcome.decision!==d.id||r.feedback.decision!==d.id)fail('서로 다른 대상 또는 결정이 연결됐습니다.');
 if(!['none','engine','human'].includes(d.act))fail('실행자 오류');
 return r;
}
export function summarize(records){
 const groups={},score=[],episodes=new Set();let device=0,deviceMeasures=0,reviews=0,failures=0;
 for(const r of records){
  validateFramework(r);const v=r.event.v,y=r.outcome.y;
  groups[v.type]=(groups[v.type]||0)+1;
  if(v.origin==='device'){device++;episodes.add(v.episode);if(y.observed==='measured')deviceMeasures++;if(r.decision.human)reviews++;}
  if(y.observed==='measured'&&y.unit==='px'&&y.after>y.before)failures++;
  if(v.scope==='cohort'&&y.unit==='px')score.push({id:r.decision.id.split('/').at(-1),before:y.before,after:y.after,n:v.count});
 }
 return {records:records.length,groups,score,device,deviceMeasures,reviews,deviceEpisodes:episodes.size,humanPairs:0,failures};
}
// 일별 짝은 같은 대상·시점에서 추천을 보기 전 따로 측정한 경우만 입력할 수 있다.
export function assessStage({previous=0,days=[],policy=null,stale=false,error=false,shadowSince=null,now}={}){
 if(!Number.isInteger(previous)||previous<0||previous>4)fail('이전 단계 범위 오류');
 if(error)return {stage:Math.max(0,previous-1),reason:'원자료 오류 · 자동 적용 보류'};
 if(stale)return {stage:Math.min(previous,1),reason:'자료 36시간 초과 · 다시 읽기와 확인 필요'};
 if(!policy||!Number.isInteger(policy.minPairs)||policy.minPairs<1||!Number.isInteger(policy.kDays)||policy.kDays<1||!finite(policy.minGain))return {stage:previous,reason:'연구별 최소 독립 짝 수·연속 일수의 승인 기준 미등록'};
 const sorted=[...days].sort((a,b)=>a.day.localeCompare(b.day));
 if(sorted.some((v,i)=>!/^\d{4}-\d\d-\d\d$/.test(v.day)||!Number.isFinite(Date.parse(v.day))||v.day>iso(now).slice(0,10)||!Number.isInteger(v.pairs)||v.pairs<1||!finite(v.engine)||!finite(v.human)||v.human===0||v.independent!==true||v.sameCondition!==true||(i&&sorted[i-1].day===v.day)))fail('독립 일별 대조 자료 오류');
 const valid=v=>v.pairs>=policy.minPairs;const gain=v=>(v.human-v.engine)/v.human;
 const recent=n=>{const a=sorted.slice(-n);return a.length===n&&a.at(-1).day===iso(now).slice(0,10)&&a.every((v,i)=>valid(v)&&(!i||Date.parse(v.day)-Date.parse(a[i-1].day)===86400000))?a:[];};
 if(recent(2).length===2&&recent(2).every(d=>gain(d)<0))return {stage:Math.max(0,previous-1),reason:'같은 조건 대조에서 이틀 연속 악화'};
 const k=Math.max(3,policy.kDays),win=recent(k);
 if(!win.length||!win.every(v=>gain(v)>Math.max(.01,policy.minGain)))return {stage:previous,reason:'최소 독립 짝 수와 연속 개선 일수를 충족한 대조 없음'};
 if(previous>=1&&(!shadowSince||!Number.isFinite(Date.parse(shadowSince))||Date.parse(now)-Date.parse(shadowSince)<7*86400000))return {stage:previous,reason:'7일 그림자 관찰 미충족'};
 return {stage:Math.min(4,previous+1),reason:previous===4?'독립 대조 유지':'독립 대조 기준 충족 · 한 단계 이동'};
}

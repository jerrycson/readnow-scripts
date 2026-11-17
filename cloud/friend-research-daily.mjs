import {createHash} from 'node:crypto';
import {evaluate,fit} from './friend-research-learning.mjs';
import {runStandardRound} from './friend-study/standard-round.mjs';
import {readDeviceCases} from './friend-study/device-cases.mjs';
import {preferenceScore} from './friend-study/preference.mjs';
import {validationState} from './friend-study/validation.mjs';
import {studyOf} from './friend-study/standard.mjs';

const origin='https://readnow.kr';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const dayAt=t=>new Date(Date.parse(t)+9*3600000).toISOString().slice(0,10);
async function remoteBytes(path){
  const r=await fetch(origin+path,{redirect:'error',signal:AbortSignal.timeout(6000),cache:'no-store'});
  if(!r.ok)throw Error('공개 자료 HTTP '+r.status);
  const sizeLimit=2*1024*1024;
  if(Number(r.headers.get('content-length'))>sizeLimit)throw Error('공개 자료 길이 초과');
  let length=0;const chunks=[];
  for await(const chunk of r.body){length+=chunk.length;if(length>sizeLimit)throw Error('공개 자료 길이 초과');chunks.push(chunk);}
  return Buffer.concat(chunks);
}
export async function getMaterial(readBytes=remoteBytes){
  const index=JSON.parse(await readBytes('/friend/research/hub/releases.json'));
  if(!Array.isArray(index.releases))throw Error('연구 목록 오류');
  const sets=new Map(),rows=new Map();
  for(const r of [...index.releases].filter(r=>r.project==='bookfriend'&&r.learningEvidence).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))){
    const {file,sha256}=r.learningEvidence;
    if(!/^studio-training[0-9]+(?:-r[1-9][0-9]*)?\.json$/.test(file)||!/^[a-f0-9]{64}$/.test(sha256)||!Number.isFinite(Date.parse(r.at)))throw Error('학습 자료 식별자 오류');
    if(sets.has(sha256))continue;
    const bytes=await readBytes('/friend/pixel-lab/'+file);
    if(sha(bytes)!==sha256)throw Error('학습 자료 지문 불일치');
    const input=JSON.parse(bytes);if(!Array.isArray(input)||input.length>12000)throw Error('학습 자료 형식 오류');
    sets.set(sha256,true);
    for(const row of input){
      const prior=rows.get(row.id);
      if(prior&&JSON.stringify(prior.row)!==JSON.stringify(row))throw Error('기존 사례 변경 감지');
      if(!prior)rows.set(row.id,{row,origin:'release',at:r.at});
    }
  }
  if(!rows.size)throw Error('배포된 책방 친구 학습 사례가 없습니다.');
  return {rows:[...rows.values()],dataset:sha([...sets.keys()].sort().join(','))};
}
export async function runBookfriendDaily({db,now=new Date().toISOString(),readBytes=remoteBytes,readDevices=readDeviceCases,validation=validationState}){
  const day=dayAt(now),dateRecord=db.collection('friend_engine_public').doc(day);
  const existing=await dateRecord.get();
  if(existing.exists)return {status:'already_recorded',day};
  let material,refresh,issue;
  async function materialWithCases(){
    const [published,device]=await Promise.all([getMaterial(readBytes),readDevices(db)]);
    return {rows:[...published.rows,...device],dataset:sha(published.dataset+JSON.stringify(device.map(x=>x.row.id).sort()))};
  }
  // 두 연구가 같은 원전과 재조회 요청을 함께 사용한다.
  const read=async(study,{retry})=>{
    if(retry)refresh??=materialWithCases();else material??=materialWithCases();
    const input=await (retry?refresh:material);
    const rows=input.rows.filter(x=>studyOf(x.row)===study);
    return {rows,materialTimes:rows.map(x=>x.at),reference:{dataset:input.dataset}};
  };
  const studies={},logs={},stages={};
  for(const key of ['friend-studio','friend-photo']){
    const assessment=await validation(db,key,now);
    const checkedRead=async(study,opts)=>{const pkt=await read(study,opts);for(const v of assessment.days)pkt.materialTimes.push(v.day+'T00:00:00.000Z');return pkt;};
    const result=await runStandardRound({...assessment,study:key,now,trigger:'cloud-daily',read:checkedRead,append:async log=>{logs[key]=log;}});
    const pairs=assessment.days.reduce((sum,d)=>sum+d.pairs,0);if(logs[key]?.saw)logs[key].saw.humanPairs=pairs;
    stages[key]={at:now,stage:result.log?.stage??0,candidate:assessment.candidate??assessment.previous?.candidate??null,
      shadowSince:result.log?.stage>0?(assessment.shadowSince||now):null,stageJudgedDay:result.log?.stageJudgedDay??null,humanPairs:pairs,proof:assessment.days};
    if(!result.log)throw Error('일지 구성 실패');
    if(result.code==='source_error'){issue='source_error';}
    const measures=result.records.map(r=>({episode:r.event.v.episode,baseline:r.feedback.score.baseline,candidate:r.outcome.y.after,count:r.event.v.count,kind:r.event.v.type})).filter(r=>r.baseline!=null&&r.candidate!=null);
    const records=result.records;
    // 원전의 소표본 묶음은 같은 사람의 독립 표본 수에 더하지 않는다.
    studies[key]={code:result.code,items:records.length,humanPairs:pairs,stage:result.log.stage,materialAt:result.log.materialAt,cohortScores:measures.filter(r=>r.count>1).slice(-32),measureGroups:measures.reduce((groups,r)=>{const group=groups[r.kind]??={records:0,improved:0,worsened:0};group.records++;if(r.candidate<r.baseline)group.improved++;if(r.candidate>r.baseline)group.worsened++;return groups;}, {})};
  }
  let dataset=null,model=null,holdout=null,preferences=null;
  try{const source=await(refresh??material);dataset=source.dataset;
    const input=source.rows.map(x=>x.row);model=fit(input);preferences=preferenceScore(input);const {byEpisode,...scores}=evaluate(input);holdout=scores;
  }catch{issue='source_error';}
  const label=k=>studies[k].stage>0?studies[k].code+' · 검증 단계 '+studies[k].stage:studies[k].code;
  const brief={at:now,day,studioState:label('friend-studio'),photoState:label('friend-photo'),
    studioCount:studies['friend-studio'].items,photoCount:studies['friend-photo'].items,
    studioHumanPairs:studies['friend-studio'].humanPairs,photoHumanPairs:studies['friend-photo'].humanPairs};
  const digest=dataset?.slice(0,24)||'source-error';
  const key='bookfriend-'+day+'-'+digest;
  const ledger=db.collection('eng_ledger').doc(key);
  // 한 트랜잭션에 일지 및 수치만 추가한다. 중복 실행 및 도중 오류를 함께 처리한다.
  const status=await db.runTransaction(async t=>{
    const [prior,marker]=await Promise.all([t.get(ledger),t.get(dateRecord)]);
    if(marker.exists)return 'already_recorded';
    if(prior.exists)return issue?'source_error':'already_recorded';
    t.create(ledger,{at:now,day,dataset,studies,logs,model,holdout,preferences,deviceWindow:400,revision:2});
    if(!issue){for(const [study,stage] of Object.entries(stages))t.create(db.collection('friend_engine_stage_'+study).doc(day),stage);t.create(dateRecord,brief);}
    return issue?'source_error':'recorded';
  });
  if(status==='recorded'&&!(await dateRecord.get()).exists)throw Error('일일 요약 원격 재조회 실패');
  return {status,day,ledger:key,studies:brief};
}
export async function inCloud(){
  const {getFirestore}=await import('firebase-admin/firestore');
  return runBookfriendDaily({db:getFirestore('readnow-research')});
}

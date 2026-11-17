import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {runBookfriendDaily,getMaterial} from './friend-research-daily.mjs';

const at='2026-11-17T01:00:00Z';
const base={episode:'case-1',subject:'studio',outcome:'measured',metricBefore:2,metricAfter:1,unit:'px'};
const examples=[{...base,id:'s',task:'surface',method:'direct'},{...base,id:'p',task:'alignment',method:'photo'}];
function fixture(data=examples,materialAt=at){
  const bytes=Buffer.from(JSON.stringify(data)),digest=createHash('sha256').update(bytes).digest('hex');
  const index=Buffer.from(JSON.stringify({releases:[{project:'bookfriend',at:materialAt,learningEvidence:{file:'studio-training44.json',sha256:digest}}]}));
  return path=>path.endsWith('releases.json')?index:bytes;
}
function memory(){
  const saved=new Map();
  const get=k=>({exists:saved.has(k)});
  const ref=k=>({id:k,get:async()=>get(k)});
  return {saved,collection:n=>({doc:k=>ref(n+'/'+k),orderBy:()=>({limit:()=>({get:async()=>({docs:[]})})})}),runTransaction:async fn=>{
    const ops=[];const result=await fn({get:async r=>get(r.id),create:(r,v)=>ops.push([r.id,v])});
    for(const [k] of ops)assert(!saved.has(k));for(const [k,v] of ops)saved.set(k,v);return result;
  }};
}
test('하루 두 연구 채점·중복 호출 및 공개 필드',async()=>{
  const db=memory(),readBytes=fixture();const first=await runBookfriendDaily({db,readBytes,now:at});
  assert.equal(first.status,'recorded');const summary=db.saved.get('friend_engine_public/2026-11-17');assert.equal(summary.studioCount,1);assert.equal(summary.photoCount,1);
  assert.equal(Object.keys(summary).length,8);assert.equal(summary.studioHumanPairs,0);
  assert.equal((await runBookfriendDaily({db,now:at,readBytes})).status,'already_recorded');assert.equal(db.saved.size,4);
});
test('동일 입력 36시간 정체 시 한 번 재조회하며 원래 날짜를 지킨다',async()=>{
  const db=memory(),source=fixture(),now='2026-11-19T02:00:00Z';let calls=0;
  const r=await runBookfriendDaily({db,now,readBytes:p=>{calls++;return source(p)}});
  assert.equal(r.studies.photoState,'stalled');assert.equal(r.studies.studioState,'stalled');assert.equal(calls,4);
});
test('잘못된 지문은 성공 표식을 쓰지 않고 같은 날 재시도할 수 있다',async()=>{
  const db=memory(),f=fixture(),corrupt=p=>p.endsWith('releases.json')?f(p):Buffer.from('[]');
  await assert.rejects(getMaterial(corrupt),/지문/);assert.equal((await runBookfriendDaily({db,readBytes:corrupt,now:at})).status,'source_error');
  assert.equal((await runBookfriendDaily({db,readBytes:f,now:at})).status,'recorded');assert.equal(db.saved.size,5);
});
test('최신 자료가 없으면 성공 수치 0으로 위장되지 않는다',async()=>{
  const db=memory();const result=await runBookfriendDaily({db,readBytes:()=>Buffer.from('{"releases":[]}'),now:at});
  assert.equal(result.status,'source_error');assert.equal(db.saved.has('friend_engine_public/2026-11-17'),false);
});

test('실험자의 기준선과 분리한 선택 학습 및 무관한 전문 불허',async()=>{
  const {preferenceScore}=await import('./friend-study/preference.mjs');
  const {deviceCase}=await import('./friend-study/device-cases.mjs');
  const items=[];
  for(let i=0;i<4;i++){
    const id='12345678-1234-1234-1234-12345678900'+i,record={id,episode:id,at:new Date(Date.parse(at)-i*1000).toISOString(),task:'surface',subject:'F02',method:'direct',outcome:'accepted',unit:'none',metricBefore:null,metricAfter:null};
    const row=deviceCase({id,data:()=>record});items.push(row);
    assert.throws(()=>deviceCase({id,data:()=>({...record,photo:'private'})}));
  }
  const db=memory(),result=await runBookfriendDaily({db,readBytes:fixture(),now:at,readDevices:()=>items});
  assert.equal(result.studies.studioCount,5);const ledger=db.saved.get('eng_ledger/'+result.ledger);
  assert.equal(ledger.preferences.pairs,4);assert.equal(ledger.preferences.episodes,4);
  assert.equal(ledger.studies['friend-studio'].humanPairs,0);
  const reversed={...items[0].row,at:'2026-11-17T02:00:00Z',outcome:'reverted'};
  const scores=preferenceScore([...items.map(x=>x.row),reversed]);assert.equal(scores.pairs,4);assert(scores.groups['surface|F02|direct'].acceptance<ledger.preferences.groups['surface|F02|direct'].acceptance);
});

test('독립 짝을 다시 쓰지 않고 증거 있는 연속 개선만 단계에 반영',async()=>{
  const {verifiedDays}=await import('./friend-study/validation.mjs'),study='friend-studio',now='2026-11-17T07:00:00.000Z';
  const sample=d=>({study,candidate:'test-v1',sourceKey:'source-'+d,conditionKey:'base-chin',blind:true,closedAt:'2026-11-'+d+'T02:00:00Z',humanCommittedAt:'2026-11-'+d+'T00:00:00Z',candidateShownAt:'2026-11-'+d+'T01:00:00Z',engineError:1,humanError:2,unit:'px'});
  const source=[15,16,17].map(sample);const days=verifiedDays([...source,{...source[0],closedAt:now},{...source[0],sourceKey:'hidden',blind:false}],study,now);
  assert.equal(days.length,3);assert.deepEqual(days.map(d=>d.pairs),[1,1,1]);const db=memory();
  const a=await runBookfriendDaily({db,now,readBytes:fixture(),validation:async(_,key)=>key===study?{days,policy:{minPairs:1,kDays:3,minGain:.01},candidate:'test-v1'}:{days:[],policy:null}});
  assert.match(a.studies.studioState,/단계 1/);assert.equal(a.studies.studioHumanPairs,3);assert.equal(a.studies.photoHumanPairs,0);
});

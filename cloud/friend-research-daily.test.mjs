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
  return {saved,collection:n=>({doc:k=>ref(n+'/'+k)}),runTransaction:async fn=>{
    const ops=[];const result=await fn({get:async r=>get(r.id),create:(r,v)=>ops.push([r.id,v])});
    for(const [k] of ops)assert(!saved.has(k));for(const [k,v] of ops)saved.set(k,v);return result;
  }};
}
test('하루 두 연구 채점·중복 호출 및 공개 필드',async()=>{
  const db=memory(),readBytes=fixture();const first=await runBookfriendDaily({db,readBytes,now:at});
  assert.equal(first.status,'recorded');const summary=db.saved.get('friend_engine_public/2026-11-17');assert.equal(summary.studioCount,1);assert.equal(summary.photoCount,1);
  assert.equal(Object.keys(summary).length,8);assert.equal(summary.studioHumanPairs,0);
  assert.equal((await runBookfriendDaily({db,now:at,readBytes})).status,'already_recorded');assert.equal(db.saved.size,2);
});
test('동일 입력 36시간 정체 시 한 번 재조회하며 원래 날짜를 지킨다',async()=>{
  const db=memory(),source=fixture(),now='2026-11-19T02:00:00Z';let calls=0;
  const r=await runBookfriendDaily({db,now,readBytes:p=>{calls++;return source(p)}});
  assert.equal(r.studies.photoState,'stalled');assert.equal(r.studies.studioState,'stalled');assert.equal(calls,4);
});
test('잘못된 지문은 성공 표식을 쓰지 않고 같은 날 재시도할 수 있다',async()=>{
  const db=memory(),f=fixture(),corrupt=p=>p.endsWith('releases.json')?f(p):Buffer.from('[]');
  await assert.rejects(getMaterial(corrupt),/지문/);assert.equal((await runBookfriendDaily({db,readBytes:corrupt,now:at})).status,'source_error');
  assert.equal((await runBookfriendDaily({db,readBytes:f,now:at})).status,'recorded');assert.equal(db.saved.size,3);
});
test('최신 자료가 없으면 성공 수치 0으로 위장되지 않는다',async()=>{
  const db=memory();const result=await runBookfriendDaily({db,readBytes:()=>Buffer.from('{"releases":[]}'),now:at});
  assert.equal(result.status,'source_error');assert.equal(db.saved.has('friend_engine_public/2026-11-17'),false);
});

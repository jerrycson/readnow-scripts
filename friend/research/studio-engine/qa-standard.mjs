import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {studyOf,toFramework,validateFramework,summarize,assessStage} from './standard.mjs';
import {runStandardRound,staleMs} from './standard-round.mjs';
import {publicHeartbeat} from './standard-heartbeat.mjs';
const read=async name=>JSON.parse(await readFile(new URL(name,import.meta.url),'utf8'));
const seed=await read('../../pixel-lab/studio-training44.json'),manifest=await read('../hub/releases.json');
const released=manifest.releases.find(r=>r.learningEvidence?.file==='studio-training44.json').at;
const packet=id=>({rows:seed.filter(r=>studyOf(r)===id).map(row=>({row,at:released,origin:'release'})),materialTimes:[]});
const logs=[];const append=async line=>logs.push(line);
const extra=await read('../../pixel-lab/studio-training44-r2.json');
assert.equal(extra.length,1);const oof=toFramework(extra[0],{at:released,origin:'release'});
assert.equal(oof.event.v.type,'synthetic-oof');assert.equal(oof.event.v.count,96);
assert.equal(oof.feedback.score.human,null);assert.equal(oof.outcome.y.after,.32095886);
assert.equal(new Set([...seed,...extra].map(r=>r.id)).size,19);
const revision=manifest.releases.find(r=>r.learningEvidence?.file==='studio-training44-r2.json');
assert(revision,'보완판 지문이 회차 목록에 연결돼야 합니다.');
const joined=await runStandardRound({study:'friend-photo',now:revision.at,append,read:async()=>({rows:[...packet('friend-photo').rows,...extra.map(row=>({row,origin:'release',at:revision.at}))],materialTimes:[]})});
assert.equal(joined.ok,true);assert.equal(joined.records.length,5);assert.equal(joined.summary.groups['synthetic-oof'],1);assert.equal(joined.summary.humanPairs,0);
console.log('보완 공개 근거 19건 · 조형 14, 사진 5 · 새 단면 거리',oof.outcome.y.before,'→',oof.outcome.y.after,'px');
for(const [id,count] of [['friend-studio',14],['friend-photo',4]]){
 const run=await runStandardRound({study:id,read:async()=>packet(id),append,now:released});
 assert.equal(run.ok,true);assert.equal(run.records.length,count);assert.equal(run.log.stage,0);assert.equal(run.summary.humanPairs,0);
 for(const r of run.records){assert.equal(Object.keys(validateFramework(r)).length,7);assert.equal(r.decision.act,'none');assert.equal(r.feedback.score.human,null);}
 const test=structuredClone(run.records[0]);delete test.decision.why;assert.throws(()=>validateFramework(test));
 console.log(id,'공개 기록',run.records.length,'단계',run.log.stage,'사람 짝',run.summary.humanPairs,'악화 행',run.summary.failures);
}
const device={id:'qa1',task:'surface',subject:'F02',method:'learned',outcome:'accepted',unit:'px',metricBefore:2,metricAfter:1,episode:'qa',at:released};
const accepted=toFramework(device,{origin:'device'});assert.equal(accepted.decision.human.pick,'accepted');assert.equal(summarize([accepted]).humanPairs,0);
assert.throws(()=>toFramework({...device,metricAfter:NaN},{origin:'device'}));
const staleAt=new Date(Date.parse(released)+staleMs+1).toISOString();let retried=0;
const run=(read,extra={})=>runStandardRound({study:'friend-studio',read,append,now:staleAt,...extra});
const unchanged=await run(async(_,opts)=>{if(opts.retry)retried++;return packet('friend-studio');},{previous:{stage:3}});
assert.equal(retried,1);assert.equal(unchanged.code,'stalled');assert.equal(unchanged.log.stage,1);
const fresh=await run(async(_,opts)=>({...packet('friend-studio'),materialTimes:opts.retry?[staleAt]:[]}));
assert(fresh.ok&&fresh.log.retried);
const bad=await run(async()=>{throw Error('시험 원본 오류');});assert.equal(bad.code,'source_error');assert.equal(bad.ok,false);
const failedWrite=await run(async()=>packet('friend-studio'),{append:async()=>{throw Error('시험 쓰기 오류');}});assert.equal(failedWrite.code,'ledger_error');
assert.equal((await run(async()=>packet('friend-studio'),{previous:{stage:-5}})).code,'invalid_input');
const now='2026-11-17T12:00:00Z',policy={minPairs:15,kDays:3,minGain:.01},days=[15,16,17].map(i=>({day:'2026-11-'+i,pairs:16,engine:.7,human:1,independent:true,sameCondition:true}));
assert.equal(assessStage({previous:1,days,policy,shadowSince:'2026-11-09T00:00:00Z',now}).stage,2);
assert.equal(assessStage({previous:1,days,policy:null,now}).stage,1);
assert.equal(assessStage({previous:1,days,policy,shadowSince:'2026-11-16T00:00:00Z',now}).stage,1);
assert.equal(assessStage({previous:3,days:days.map(d=>({...d,engine:1.1})),policy,now}).stage,2);
assert.throws(()=>assessStage({days:days.map(d=>({...d,independent:false})),policy,now}));
const calls=[];const unavailable=await publicHeartbeat({clock:Date.parse('2026-11-17T15:12:00Z'),request:async url=>{calls.push(url);return {ok:false,status:403};}});
assert.equal(unavailable.ok,false);assert(calls[0].endsWith('2026-11-18')&&calls[1].endsWith('2026-11-17'));assert.equal(calls.length,2);
async function today(url){const day=url.split('/').at(-1);const fields={at:{stringValue:'2026-11-17T15:01:00Z'}};
 for(const k of ['studio','photo']){fields[k+'State']={stringValue:'ok'};fields[k+'Count']={integerValue:'5'};fields[k+'HumanPairs']={integerValue:'0'};}
 return {ok:true,json:async()=>({name:'projects/readnow-3a385/databases/readnow-research/documents/friend_engine_public/'+day,fields})};}
const verified=await publicHeartbeat({clock:Date.parse('2026-11-17T15:12:00Z'),request:today});assert(verified.ok);assert.equal(verified.values['friend-photo'].count,5);assert(!('stage' in verified.values['friend-photo']));
console.log('합성 분리 시험 · 36시간 정체/재조회 복구·일지 저장 실패·4단계 범위·연속일·공개 요약/거부 응답을 확인했습니다.');

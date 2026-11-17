import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {observationSource57,applyObservations57,diagnosticObservation57} from '../studio-observation57.mjs';
import {publishedEvidence} from '../studio-cases44.mjs';
import {fit,evaluate} from '../studio-learning44.mjs';
import {toFramework,summarize,studyOf} from '../../research/studio-engine/standard.mjs';
import {runStandardRound} from '../../research/studio-engine/standard-round.mjs';
const lab=new URL('../',import.meta.url),repo=fileURLToPath(new URL('../../',lab)),hash=b=>createHash('sha256').update(b).digest('hex');
const publicBytes=url=>execFileSync('git',['show','HEAD:'+fileURLToPath(url).slice(repo.length).replaceAll('\\','/')],{cwd:repo,windowsHide:true});
const preserved=Object.fromEntries(['44','56','57'].map(n=>{const file=new URL('studio-training'+n+'.json',lab);return[n,{file,sha256:hash(fs.readFileSync(file)),publicSha256:hash(publicBytes(file))}];}));
const bytes=publicBytes(new URL(observationSource57.file,lab));assert.equal(hash(bytes),observationSource57.sha256);
const raw=JSON.parse(bytes),source={file:observationSource57.file,sha256:hash(bytes)},marked=applyObservations57(raw,source);
assert.equal(raw.length,457);assert.equal(marked.length,raw.length);
const diagnostics=marked.filter(r=>diagnosticObservation57(r));assert.equal(diagnostics.length,9);
assert.deepEqual(fit(marked),fit(raw));assert.deepEqual(evaluate(marked),evaluate(raw));
for(let i=0;i<raw.length;i++){
 const {observation57,...payload}=marked[i];assert.deepEqual(payload,raw[i]);
 if(!observation57)assert.equal(marked[i],raw[i]);
}
assert.throws(()=>applyObservations57(raw,{...source,sha256:'0'.repeat(64)}),/지문/);
assert.throws(()=>applyObservations57(raw,{...source,file:'studio-training56.json'}),/지문/);
for(const r of diagnostics){
 assert.throws(()=>applyObservations57(raw.map(x=>x.id===r.id?{...x,metricAfter:x.metricAfter+1}:x),source),/내용/);
 assert.throws(()=>diagnosticObservation57({...r,note:r.note+'변조'}),/표식/);
 assert.throws(()=>diagnosticObservation57({...r,observation57:{...r.observation57,sourceSha256:'0'.repeat(64)}}),/표식/);
 const {observation57,...unmarked}=r;assert.throws(()=>toFramework(unmarked,{origin:'release',at:new Date().toISOString()}),/집계 표본 수/);
}
const originalFetch=globalThis.fetch;
try{
 globalThis.fetch=async url=>{try{const u=new URL(url);return new Response(/^studio-training[0-9]+(?:-r[1-9][0-9]*)?\.json$/.test(u.pathname.split('/').at(-1))?publicBytes(u):fs.readFileSync(u));}catch{return new Response('',{status:404});}};
 const rows=await publishedEvidence(),without=rows.map(row=>{const {observation57,...rest}=row;return rest;});
 assert.equal(rows.length,1159);assert.deepEqual(fit(rows),fit(without));assert.deepEqual(evaluate(rows),evaluate(without));
 const at=new Date().toISOString(),records=rows.map(row=>toFramework(row,{origin:'release',at}));
 const summary=summarize(records),selected=records.filter(r=>r.event.v.scope==='diagnostic');
 assert.equal(selected.length,9);assert.equal(summary.diagnostics.length,9);assert.equal(summary.diagnostics.filter(r=>r.worse).length,3);
 for(const r of selected){
  assert.equal(Object.keys(r).length,7);assert.equal(r.decision.engineVer,'44');assert.equal(r.event.v.count,null);
  assert.deepEqual(r.feedback.score,{engine:null,human:null,baseline:null});assert.equal(r.decision.act,'none');
  const sourceRow=rows.find(row=>r.decision.id.endsWith('/'+row.id));assert.equal(r.outcome.y.before,sourceRow.metricBefore);assert.equal(r.outcome.y.after,sourceRow.metricAfter);assert.equal(r.outcome.y.unit,sourceRow.unit);
  assert(!summary.score.some(p=>p.id===sourceRow.id));
 }
 const ordinary=records.filter(r=>r.event.v.scope!=='diagnostic');assert.deepEqual(summary.score,summarize(ordinary).score);
 assert.equal(summary.failures-summarize(ordinary).failures,3);
 const states=[];
 for(const study of ['friend-studio','friend-photo']){
  const relevant=rows.filter(r=>studyOf(r)===study),read=async()=>({rows:relevant.map(row=>({row,at,origin:'release'})),materialTimes:[]});
  const run=await runStandardRound({study,read,now:at,append:async()=>{}});
  const baseline=await runStandardRound({study,read:async()=>({rows:relevant.filter(r=>!diagnosticObservation57(r)).map(row=>({row,at,origin:'release'})),materialTimes:[]}),now:at,append:async()=>{}});
  assert.equal(run.ok,true);assert.equal(run.log.stage,baseline.log.stage);assert.equal(run.log.stage,0);assert.deepEqual(run.summary.score,baseline.summary.score);
  assert.deepEqual(run.records.filter(r=>r.event.v.scope!=='diagnostic'),baseline.records);
  states.push({study,records:run.records.length,diagnostics:run.summary.diagnostics.length,failures:run.summary.failures,stage:run.log.stage,learningRecords:run.summary.learningRecords});
 }
 for(const item of Object.values(preserved)){assert.equal(hash(fs.readFileSync(item.file)),item.sha256);assert.equal(hash(publicBytes(item.file)),item.publicSha256);}
 const report={at,sourceSha256:source.sha256,sourceRows:raw.length,publicRows:rows.length,diagnostics:9,changedPixelTotals:3,registrationSensitivity:6,worseDiagnostics:3,
  unchangedFit:fit(rows),unchangedEvaluation:evaluate(rows),engineVersion:'44',adapterVersion:observationSource57.adapter,
  scope:'9행은 원 before/after/unit을 유지하고 count=null인 diagnostic으로 보존. 평균/독립표본/회귀/승격에 쓰지 않으며 원 관측 악화3행은 실패 목록에 유지.',
  malformedCohortRejected:true,exactPayloadRequired:true,allOldRecordsEqual:true,source44And56And57Unchanged:true,states};
 if(process.env.BOOKFRIEND_DIAGNOSTIC_REPORT)fs.writeFileSync(process.env.BOOKFRIEND_DIAGNOSTIC_REPORT,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({...report,unchangedFit:{count:report.unchangedFit.count},unchangedEvaluation:{observations:report.unchangedEvaluation.observations,baselineMAE:report.unchangedEvaluation.baselineMAE,candidateMAE:report.unchangedEvaluation.candidateMAE,worseEpisodes:report.unchangedEvaluation.worseEpisodes}}));
}finally{globalThis.fetch=originalFetch;}

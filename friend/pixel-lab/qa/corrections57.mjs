import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {correction57,applyCorrections57,learningCorrection} from '../studio-corrections57.mjs';
import {gain,fit,evaluate} from '../studio-learning44.mjs';
import {publishedEvidence} from '../studio-cases44.mjs';
import {runStandardRound} from '../../research/studio-engine/standard-round.mjs';
import {toFramework,studyOf} from '../../research/studio-engine/standard.mjs';
const root=new URL('../',import.meta.url),file=new URL(correction57.sourceFile,root);
const workspace=fileURLToPath(new URL('../../',root));
const originalFile=fs.readFileSync(file);
const publicBytes=url=>execFileSync('git',['show','HEAD:'+fileURLToPath(url).slice(workspace.length).replaceAll('\\','/')],{cwd:workspace,windowsHide:true});
const bytes=publicBytes(file),sha256=createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256,correction57.sourceSha256);
const rows=JSON.parse(bytes),before=JSON.stringify(rows),context={file:correction57.sourceFile,sha256};
const corrected=applyCorrections57(rows,context),target=corrected.find(r=>r.id===correction57.rowId);
assert.equal(corrected.length,rows.length);assert.equal(corrected.filter(r=>learningCorrection(r)).length,1);
assert.equal(gain(target),null);assert.equal(gain(rows.find(r=>r.id===target.id)),.12);
assert.equal(fit(rows).count-fit(corrected).count,1);assert.equal(evaluate(corrected).excluded,1);
assert(!evaluate(corrected).byEpisode.some(r=>r.episode===target.episode));
for(let i=0;i<rows.length;i++)if(rows[i].id!==target.id)assert.equal(corrected[i],rows[i]);
for(const id of ['r56-55','r56-57']){const a=rows.find(r=>r.id===id),b=corrected.find(r=>r.id===id);assert.equal(gain(a),gain(b));assert.equal(learningCorrection(b),null);}
assert.throws(()=>applyCorrections57(rows,{...context,sha256:'0'.repeat(64)}),/지문/);
assert.throws(()=>applyCorrections57(rows,{...context,file:'studio-training55.json'}),/지문/);
assert.throws(()=>applyCorrections57(rows.map(r=>r.id===target.id?{...r,metricAfter:21}:r),context),/내용/);
assert.throws(()=>learningCorrection({...target,learningCorrection:{...target.learningCorrection,sourceSha256:'0'.repeat(64)}}),/표식/);
assert.throws(()=>learningCorrection({...target,metricAfter:21}),/표식/);
assert.equal(JSON.stringify(rows),before);assert.deepEqual(fs.readFileSync(file),originalFile);
const at=new Date().toISOString(),items=corrected.filter(r=>studyOf(r)==='friend-studio').map(row=>({row,at,origin:'release'}));
let stored;
const result=await runStandardRound({study:'friend-studio',now:at,read:async()=>({rows:items,materialTimes:[]}),append:async(log,records)=>{stored={log,records};}});
assert.equal(result.ok,true);assert.equal(result.records.length,items.length);assert.equal(result.summary.learningRecords,items.length-1);assert.equal(result.summary.excluded.length,1);assert.equal(result.log.stage,0);assert.equal(result.summary.humanPairs,0);
const oldRecord=toFramework(rows.find(r=>r.id===target.id),{at,origin:'release'}),newRecord=stored.records.find(r=>r.decision.id.endsWith('/'+target.id));
assert.deepEqual(newRecord,oldRecord);assert.equal(newRecord.outcome.y.before,25);assert.equal(newRecord.outcome.y.after,22);
const originalFetch=globalThis.fetch;
try{
 globalThis.fetch=async url=>{try{const u=new URL(url);return new Response(/^studio-training[0-9]+(?:-r[1-9][0-9]*)?\.json$/.test(u.pathname.split('/').at(-1))?publicBytes(u):fs.readFileSync(u));}catch{return new Response('',{status:404});}};
 const published=await publishedEvidence();assert.equal(published.filter(r=>learningCorrection(r)).length,1);assert.equal(gain(published.find(r=>r.id===target.id)),null);
 const retainedUnits={};
 for(const row of published){const adapted=toFramework(row,{at,origin:'release'});assert.equal(adapted.outcome.y.unit,row.unit);if(['deg','표식간거리비'].includes(row.unit))retainedUnits[row.unit]=(retainedUnits[row.unit]||0)+1;}
 assert.throws(()=>toFramework({...target,unit:'unknown-unit'},{at,origin:'release'}));
 const report={at,sourceSha256:sha256,sourceRows:rows.length,retainedRows:corrected.length,excludedRows:1,unaffectedRows:corrected.length-1,
  fitBefore:fit(rows).count,fitAfter:fit(corrected).count,publicRows:published.length,publicExcluded:1,retainedUnits,standardRecords:result.records.length,standardLearningRecords:result.summary.learningRecords,
  standardRecordUnchanged:true,originalFileUnchanged:true,sourceBytes:'보존된 Git HEAD의 LF 바이트. Windows CRLF 작업파일은 변경하지 않음.',stage:result.log.stage,humanPairs:result.summary.humanPairs,
  cases:['파일 지문·행 완전 일치','잘못된 SHA 거절','다른 파일명 거절','변조 행 거절','위조 정정 표식 거절','옆 행 유지','학습·보류평가 한 행 제외','공개 로더 연결','7칸 장부 원본 동일','승격 없음']};
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
}finally{globalThis.fetch=originalFetch;}

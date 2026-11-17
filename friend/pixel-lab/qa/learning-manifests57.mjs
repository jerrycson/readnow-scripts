import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {publishedEvidence} from '../studio-cases44.mjs';
import {fit,evaluate} from '../studio-learning44.mjs';
import {diagnosticObservation57} from '../studio-observation57.mjs';
import {studyOf} from '../../research/studio-engine/standard.mjs';
import {runStandardRound} from '../../research/studio-engine/standard-round.mjs';
const lab=new URL('../',import.meta.url),repo=fileURLToPath(new URL('../../',lab)),manifest=JSON.parse(fs.readFileSync(new URL('../../research/hub/releases.json',import.meta.url),'utf8'));
const source=url=>execFileSync('git',['show','HEAD:'+fileURLToPath(url).slice(repo.length).replaceAll('\\','/')],{cwd:repo,windowsHide:true});
const originalFetch=globalThis.fetch,report=[];
try{
 for(const round of [56,...(manifest.releases.some(r=>r.round===57)?[57]:[])]){
  const chosen={...manifest,releases:manifest.releases.filter(r=>!r.round||r.round<=round)},requests=[];
  globalThis.fetch=async url=>{
   const u=new URL(url),name=u.pathname.split('/').at(-1);requests.push(name);
   if(name==='releases.json')return Response.json(chosen);
   if(round===56&&name==='studio-training57.json')throw Error('56에는57 원자료를 제공하지 않습니다.');
   try{return new Response(/^studio-training[0-9]+(?:-r[1-9][0-9]*)?\.json$/.test(name)?source(u):fs.readFileSync(u));}catch{return new Response('',{status:404});}
  };
  const rows=await publishedEvidence(),at=new Date().toISOString(),states=[];
  assert.equal(rows.length,round===56?702:1159);assert.equal(rows.filter(r=>diagnosticObservation57(r)).length,round===56?0:9);
  if(round===56)assert(!requests.includes('studio-training57.json'));
  for(const study of ['friend-studio','friend-photo']){
   const relevant=rows.filter(row=>studyOf(row)===study),result=await runStandardRound({study,now:at,read:async()=>({rows:relevant.map(row=>({row,at,origin:'release'})),materialTimes:[]}),append:async()=>{}});
   assert.equal(result.ok,true);assert.equal(result.log.stage,0);assert.equal(result.records.length,relevant.length);
   states.push({study,records:result.records.length,diagnostics:result.summary.diagnostics.length,failures:result.summary.failures,stage:result.log.stage,learningRecords:result.summary.learningRecords});
  }
  report.push({round,rows:rows.length,fit:fit(rows).count,diagnostics:rows.filter(r=>diagnosticObservation57(r)).length,observations:evaluate(rows).observations,source57Requested:requests.includes('studio-training57.json'),states});
 }
 if(process.env.BOOKFRIEND_MANIFEST_REPORT)fs.writeFileSync(process.env.BOOKFRIEND_MANIFEST_REPORT,JSON.stringify({at:new Date().toISOString(),method:'실제 manifest의 보존행으로56/57 경로를 분리. 56에서는57 JSON 요청 자체를 오류 처리.',report},null,2)+'\n');
 console.log(JSON.stringify({manifestCompatibility:report}));
}finally{globalThis.fetch=originalFetch;}

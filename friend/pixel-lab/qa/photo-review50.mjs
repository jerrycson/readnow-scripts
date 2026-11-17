import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {views,SIZE,extent} from '../hull36.mjs';
import {scanImage} from '../scan-view36.mjs';
import {challengeAngles,makePair,assessPhotoPair,renderRegistered} from '../photo-review50.mjs';
import {syntheticHead,syntheticMesh} from './photo-heads44.mjs';
if(!globalThis.ImageData)globalThis.ImageData=class{constructor(data,width,height){Object.assign(this,{data,width,height});}};
const n=SIZE,canonical={cx:n/2,cy:n/2,scale:n*.797},sha=b=>createHash('sha256').update(b).digest('hex');
function record(im,[yaw,pitch]){
  const mask=Uint8Array.from({length:n*n},(_,i)=>Number(im.data[4*i+3]>0));
  return {yaw,pitch,camera:canonical,mask,rows:extent(mask),visible:[0,n-1],key:sha(im.data),group:'frame-'+yaw+'/'+pitch};
}
function specimen(mesh){
  const scan=(a)=>record(scanImage(mesh,...a,n),a);
  return {training:views.map(y=>scan([y,0])),held:challengeAngles.map(scan)};
}
function report(pair,refs,options={}){
  return assessPhotoPair(pair,refs.training,refs.held,{candidateId:'frozen',...options});
}
const measured=JSON.parse(fs.readFileSync(new URL('../head36.json',import.meta.url))).meshes[0],cases=[];
const subjects=[['실측 두상',measured],...([10794491,81003613,77180931].map(seed=>['새 합성 '+seed,syntheticMesh(syntheticHead(seed,true))]))];
for(const [subject,mesh] of subjects){
  const refs=specimen(mesh);
  for(const [mode,settings] of [['학습',{learned:true,width:0,depth:0}],['아래턱 확대',{learned:false,width:.8,depth:.25}]]){
    const pair=makePair(refs.training,settings),rs=report(pair,refs);
    assert.equal(rs.views.length,9);assert.equal(rs.canPromote,false);
    assert.equal(rs.common.measured,18);assert.equal(rs.meshFlips,0);
    assert(rs.worse>0?rs.decision==='regressed':rs.decision!=='regressed');
    cases.push({subject,mode,status:rs.decision,flips:rs.meshFlips,worseViews:rs.worse,views:rs.views.map(v=>({role:v.role,yaw:v.yaw,pitch:v.pitch,
      rows:v.before.targetRows,before:v.before.error,after:v.after.error,iouBefore:v.before.iou,iouAfter:v.after.iou,rgba:v.pixels.changed,alpha:v.pixels.silhouette}))});
  }
}
const refs=specimen(measured),pair=makePair(refs.training,{learned:true,width:0,depth:0});
assert.equal(report(pair,{...refs,held:[]}).decision==='review',false);
const reused=report(pair,{...refs,held:[{...refs.held[0],key:refs.training[0].key},...refs.held.slice(1)]});
assert(reused.views[5].reasons.includes('동일 원본 반복'));
const cropRepeat=report(pair,{...refs,held:[{...refs.held[0],group:refs.training[0].group},...refs.held.slice(1)]});
assert(cropRepeat.views[5].reasons.includes('같은 촬영 원본에서 나눈 입력'));assert.notEqual(cropRepeat.decision,'review');
const observed=report(pair,refs,{seen:new Map([[refs.held[0].key,'prior candidate']])});
assert(observed.views[5].reasons.some(s=>s.includes('이미 사용')));
const covered=report(pair,{...refs,held:refs.held.map((s,i)=>i?s:{...s,visible:[44,51]})});
assert(covered.views[5].reasons.length);assert.notEqual(covered.decision,'review');
const reversed=report(pair,{...refs,held:refs.held.map((s,i)=>i?s:{...s,yaw:-45})});
assert(reversed.views[5].reasons.includes('입력과 같은 투영축'));
const identical=report(makePair(refs.training,{learned:false,width:0,depth:0}),refs);
assert.equal(identical.decision,'hold');assert.equal(identical.worse,0);
// 판정기의 양성 통제. 정답을 후보 메시로 만든 합성 fixture는 연구 성능을 뜻하지 않는다.
const exact=(list)=>list.map(s=>record(renderRegistered(pair.candidate,s),[s.yaw,s.pitch]));
const controlled=report(pair,{training:exact(refs.training),held:exact(refs.held)});
assert.equal(controlled.decision,'review');assert.equal(controlled.canPromote,false);
assert.equal(report({...pair,meshFlips:1},{training:exact(refs.training),held:exact(refs.held)}).decision,'hold');
// 앞선 8건을 고정한 뒤 정상 저장 경로에 도달하는 실제 생성 가능한 QA 시드를 찾았다.
const knownGood=specimen(syntheticMesh(syntheticHead(10794507,true)));
const passing=report(makePair(knownGood.training,{learned:true,width:0,depth:0}),knownGood);
assert.equal(passing.decision,'review');assert.equal(passing.canPromote,false);
const file=new URL('../photo-review-eval50.json',import.meta.url);
const summary={schema:1,study:'사진 실루엣 생성 · 판별기 검증',units:'실제 128px, 보이는 각 행 양쪽 경계의 평균 거리와 실루엣 겹침',caseCount:cases.length,
  provenance:'실측 Lee Perry-Smith 두상 하나와 동결 학습 모듈 뒤 정한 합성 시드 셋. 같은 두상의 네 방향은 생성에서 제외. 세계의 다른 두상 일반화나 사람 승인을 뜻하지 않음.',
  challenges:challengeAngles,cases,controls:{missing: true,reused:true,sourceGroup:true,seen:true,hidden:true,duplicateOrthographicAxis:true,identical:true,flipped:true,
    positive:{status:controlled.decision,automatic:false,description:'후보 자체를 정답으로 만든 판정기 양성 통제'},
    selectableSynthetic:{seed:10794507,afterInspection:true,worse:passing.worse,status:passing.decision,automatic:false,description:'별도 시드 탐색 뒤 고른 정상 수동 선택·저장 재현. 독립 성능 집계에서 제외'}}};
const generated=JSON.stringify(summary,null,2)+'\n';
if(process.argv.includes('--write'))fs.writeFileSync(file,generated);
else assert.deepEqual(JSON.parse(fs.readFileSync(file)),summary);
console.log(cases.map(v=>[v.subject,v.mode,v.status,v.worseViews].join(' · ')).join('\n'));
console.log(cases.length+'건 × 9개 시점 = '+cases.length*9+'개 원본 대조 · 실패/보류/검토 상태 검증');

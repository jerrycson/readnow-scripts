import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {loadRig} from '../rig32.mjs';
import {buildSculptBase} from '../studio-sculpt-model.mjs';
import {candidateFace47} from '../face47.mjs';
import {candidateFace49,expressMouth49,probeEyeOpening49} from '../face49.mjs';
import {portraitPixels} from '../portrait48.mjs';
const raw=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
const json=async file=>JSON.parse(await raw(file));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const [atlas,traces,evidence,overlay,notes]=await Promise.all(['atlas35.json','traces36.json','face-eval49.json','face-overlay49.json','face-note49.json'].map(json));
await loadRig();
assert.equal(sha((await raw('face49.mjs')).replaceAll('\r\n','\n')),evidence.modelSha256);
const lip=p=>['mouth-line34','upper-lip34','lower-lip34'].includes(p.name);
function render(scene,model,camera){
 return portraitPixels({...model.settings,resolution:48},{sceneOverride:scene,portrait:'face',freeOrbit:true,yaw:camera.yaw,pitch:camera.pitch,cameraZoom:1}).data;
}
function countChanged(a,b){
 let count=0;for(let i=0;i<a.length;i+=4)if([0,1,2,3].some(k=>Math.abs(a[i+k]-b[i+k])>=8))count++;
 return count;
}
function valid(scene){
 for(const p of scene.parts){
  for(const f of p.faces)for(const i of f)assert(Number.isInteger(i)&&i>=0&&i<p.vertices.length);
  for(const v of p.vertices)assert(v.p.every(Number.isFinite));
 }
}
for(const [id,note] of [['F02',notes[0]],['M01',notes[1]]]){
 const model=buildSculptBase(id,{atlas,traces}),scene=candidateFace47(id==='F02'?model.next:model.prior,id);
 const snapshot=sha(JSON.stringify(scene.parts.map(p=>p.vertices.map(v=>v.p))));
 const rows=overlay.cases[id].views;
 assert.equal(rows.length,id==='F02'?2:5);
 assert(rows.some(x=>x.key.startsWith('14-'))&&rows.some(x=>x.key===note.sample.key));
 for(const row of rows){
  assert.equal(row.sourcePoints.length,3);assert.equal(row.sourceOpening.length,2);assert(row.source.startsWith('https://frieren-anime.jp/'));
  assert(row.examples.some(e=>e.key===row.preferred));
  assert.equal(row.examples.length,5);for(const e of row.examples){assert.equal(e.points.length,3);assert(e.points.flat().every(Number.isFinite));}
 }
 assert.equal(candidateFace49(scene,id),scene);assert.equal(probeEyeOpening49(scene,0),scene);
 if(id==='M01'){
  assert.equal(expressMouth49(scene,-1,NaN),scene);
  const open=expressMouth49(scene,0,1),corner=expressMouth49(scene,1,0),half=expressMouth49(scene,.5,.5);
  for(const variant of [open,corner,half]){valid(variant);assert(scene.parts.filter(p=>!lip(p)).every(p=>variant.parts.includes(p)));}
  assert.equal(open.parts.find(p=>p.expressionSurface==='윗니').faces.length>0,true);
  assert(!corner.parts.some(p=>p.expressionSurface));
  for(const row of rows){
   const before=render(scene,model,row.camera),after=render(open,model,row.camera);
   const record=evidence.cases[id].views.find(x=>x.name===row.key).models.find(x=>x.name==='벌림');
   assert.equal(countChanged(before,after),record.changed.count);
   assert.deepEqual(render(candidateFace49(scene,id,{corner:0,opening:0}),model,row.camera),before);
  }
 }else{
  assert.equal(candidateFace49(scene,id,{corner:1,opening:1}),scene);
  for(const value of [1.5,-9,9,NaN])assert.throws(()=>probeEyeOpening49(scene,value),RangeError);
  for(const steps of [-8,-3,3,8]){
   const p=probeEyeOpening49(scene,steps);valid(p);assert.equal(p.parts[0],scene.parts[0]);
   assert(scene.parts.filter(q=>!['eye34','lid34'].includes(q.name)).every(q=>p.parts.includes(q)));
  }
  for(const row of rows){
   const before=render(scene,model,row.camera);
   for(const e of row.examples){
    const step=e.input.lidSteps,probe=probeEyeOpening49(scene,step);
    const rec=evidence.cases[id].measurements[row.key][0].models.find(x=>x.modelId==='47'&&x.step===step);
    assert.equal(countChanged(before,render(probe,model,row.camera)),rec.changed.count);
   }
  }
 }
 assert.equal(sha(JSON.stringify(scene.parts.map(p=>p.vertices.map(v=>v.p)))),snapshot);
}
console.log('49 얼굴 검증 통과 · 원화 7장, 35개 표정 겹침, 48px 측정 재현과 중립 복원');

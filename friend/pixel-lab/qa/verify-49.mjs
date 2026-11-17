import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {addRound47} from '../studio-bases47.mjs';
import {prepare49,applyPose49} from '../studio-bases49.mjs';
import {buildSculptBase,defaultView,displayScene,renderSculpt} from '../studio-sculpt-model.mjs';
import {neutralPerformance} from '../performance49.mjs';
import {initial,validatePreset,performanceFormat,SculptSession} from '../studio-sculpt-settings.mjs';
import {loadRig} from '../rig32.mjs';
import './face49.mjs';
import {evaluate49} from './chest49.mjs';
const root=new URL('../',import.meta.url),get=async name=>JSON.parse(await readFile(new URL(name+'.json',root)));
const hash=a=>createHash('sha256').update(a).digest('hex');
await loadRig();const bodyEvidence=await evaluate49();assert.equal(bodyEvidence.actualFrames,48);
const assets={};for(const [k,file] of Object.entries({atlas:'atlas35',traces:'traces36',fit:'fit36',face:'face-eval42',chest:'chest-eval42'}))assets[k]=await get(file);
const tab=await get('pose-orbit49'),body=await get('chest-eval49'),learning=await get('studio-training49'),journal=await readFile(new URL('round49.html',root),'utf8');
assert.equal(learning.length,34);assert(learning.every(v=>Number.isFinite(v.metricBefore)&&Number.isFinite(v.metricAfter)));
for(const id of ['F02','M01','W']){
  const model=addRound47(buildSculptBase(id,assets),assets);prepare49(model,assets);
  assert.equal(model.round49,model.round47);assert.equal(Object.keys(tab.subjects[id]).length,64);assert(journal.includes('round=49&amp;case='+id));
  const legacy=initial(id),p={...legacy,format:performanceFormat,base:'round49',performance:neutralPerformance(id)};
  const session=new SculptSession(id);session.apply(p);session.apply({...p,view:{...p.view,size:512,yaw:45}});session.step(true);assert.equal(session.current.view.size,p.view.size);session.step(false);assert.equal(session.current.view.size,512);
  assert.deepEqual(validatePreset(JSON.parse(JSON.stringify(legacy))),legacy);assert.throws(()=>validatePreset({...p,performance:{...p.performance,unrecognized:23}}));
  for(const [trial,input] of Object.entries(tab.sets[id]))for(const yaw of [0,-45,90,180]){
    const v={...defaultView(id),size:48,pitch:0,yaw,angle:0},s=applyPose49(model,'round49',model.round49,v,input);
    const digest=hash(renderSculpt(model,displayScene(model,'round49',s),v).data),expected=tab.subjects[id][yaw+'/0'][trial];
    assert.equal(digest,expected.sha256);
    if(id==='W'&&body.frames[trial]){
      const measured=body.frames[trial].find(r=>r.yaw===yaw&&r.pitch===0);if(measured)assert.equal(digest,measured.hashes[48]);
    }
  }
}
console.log('49차 · 표정과 두 복합 자세, 원도판에 사용한 실제 표면, 구판 설정·시점 복원, 64구도 표본 검산 통과');

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {buildSculptBase,defaultView,displayScene,posed,renderSculpt} from '../studio-sculpt-model.mjs';
import {addRound47} from '../studio-bases47.mjs';
import {prepare48,poseComparison48} from '../studio-bases48.mjs';
import {validatePreset,initial} from '../studio-sculpt-settings.mjs';
import {loadRig} from '../rig32.mjs';
const root=new URL('../',import.meta.url),raw=name=>readFile(new URL(name,root));
const data=async name=>JSON.parse(await raw(name)),sha=s=>createHash('sha256').update(s).digest('hex');
await loadRig();
const assets={};for(const [key,file] of Object.entries({atlas:'atlas35',traces:'traces36',fit:'fit36',face:'face-eval42',chest:'chest-eval42'}))assets[key]=await data(file+'.json');
const orbit=await data('orbit-eval48.json'),refs=await data('face-overlay48.json'),notes=await data('studio-training48.json');
const journal=(await raw('round48.html')).toString();
for(const id of ['F02','M01','W']){
  assert(journal.includes('round=48&amp;case='+id));const model=addRound47(buildSculptBase(id,assets),assets);prepare48(model,assets);
  const chart=orbit.subjects[id];assert.equal(chart.rows.length,64);assert.equal(new Set(chart.rows.map(r=>[r.yaw,r.pitch].join('/'))).size,64);assert.equal(sha(await raw(chart.file)),chart.sha256);
  const p=initial(id);p.base='round48';assert.equal(validatePreset(p).base,'round48');
  for(const condition of [[0,0],[-45,45],[180,0]]){
    const [yaw,pitch]=condition,v={...defaultView(id),size:48,yaw,pitch,...(id==='W'?{pivot:'arms.raise',angle:90}:{})};
    const actual=key=>{const obj=poseComparison48(model,key,posed(model[key],id,v),v);return sha(renderSculpt(model,displayScene(model,key,obj),v).data);};
    const expected=chart.rows.find(r=>r.yaw===yaw&&r.pitch===pitch);assert.equal(actual('round47'),expected.before);assert.equal(actual('round48'),expected.after);
  }
  if(id==='W')continue;
  assert(refs.cases[id].views.some(row=>row.key.startsWith('2-')));
}
assert(notes.length===66&&notes.every(v=>v.outcome==='measured'&&Number.isFinite(v.metricBefore)&&Number.isFinite(v.metricAfter)));assert(notes.some(v=>v.metricAfter>v.metricBefore));
console.log('세 연구 후보 · 실제 메시와 64구도 회전표 지문 · 원화와 실패 조건 · 저장판 복원 통과');

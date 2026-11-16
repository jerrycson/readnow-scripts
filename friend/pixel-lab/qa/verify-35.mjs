import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DEFAULTS,createProfile,validateSettings} from '../model.mjs';
import {paperForms} from '../paperforms35.mjs';
import {paperShape} from '../paper-shape35.mjs';
import {paperRig} from '../paper-rig35.mjs';
import {loadRig} from '../rig32.mjs';
import {raisedPose,pose34} from '../bust34.mjs';
import {studyView} from '../camera35.mjs';
import {portraitPixels} from '../portrait48.mjs';
import {paperCompare,caseComparison} from '../paper-compare35.mjs';
import {mergeNotes35} from '../../research/hub/round35.mjs';
const data=name=>JSON.parse(readFileSync(new URL('../'+name,import.meta.url)));
const ref=data('reference35.json'),notes=data('notes35.json'),atlas=data('atlas35.json');
assert.equal(new Set(paperForms.map(r=>r.id)).size,21);
assert.equal(createProfile('new','새 친구').settings.paperForm,'W');
const legacy={...DEFAULTS};delete legacy.paperForm;assert.equal(validateSettings(legacy).paperForm,'legacy');
assert.equal(ref.cells.length,15);assert.equal(ref.cells.flatMap(c=>c.lines).length,25);
assert.equal(atlas.faces.filter(r=>r.category==='F').length,20);assert.equal(atlas.bodies.length,20);
assert.equal(new Set(notes.map(r=>r.noteId)).size,notes.length);
assert(notes.every(r=>r.unit.length>=100&&r.detail.length>=700&&r.local&&r.state));
assert.equal(mergeNotes35([{title:'보존',line:'원문'}],[])[0].line,'원문');
await loadRig();
const cases=data('case-lines35.json');assert.equal(Object.keys(cases).length,20);
const hashes=new Set(),settings={...DEFAULTS,heads:8,designStyle:'manga'};
for(const r of paperForms){
  const s={...settings,paperForm:r.id},small=paperShape({...s,chestVolume:0},.8,4,6.5),large=paperShape({...s,chestVolume:1},.8,4,6.5);
  const normalize=shape=>shape.meridian(1).map(p=>[(shape.frame(1).top-p[1])/shape.scale,p[2]/shape.scale]);
  const a=normalize(small),b=normalize(large);assert(large.scale>small.scale);
  assert(a.every((p,i)=>p.every((v,j)=>Math.abs(v-b[i][j])<1e-8)),r.id+' 크기 독립');
  const scene=paperRig(s),mesh=scene.parts[0];assert(mesh.vertices.every(v=>[...v.p,...v.n].every(Number.isFinite)));
  const img=portraitPixels(s,{...studyView(scene,false),yaw:-38,freeOrbit:true,studyResolution:128});hashes.add(createHash('sha256').update(img.data).digest('hex'));
  for(const row of cases[r.id]||[]){
    const section=caseComparison(scene,img,row);
    assert(section&&section.points.length===80&&Number.isFinite(section.error),r.id+' 원자료 대조');
  }
  const lifted=pose34(scene,raisedPose(178)).scene;assert(lifted.parts[0].vertices.every(v=>v.p.every(Number.isFinite)));
}
assert.equal(hashes.size,21,'원형별 삼차원 렌더 구분');
const s=settings,scene=paperRig(s),report=data('paper35-check.json');for(const c of ref.cells){
 const img=portraitPixels(s,{...studyView(scene,false),yaw:c.view==='측면'?-90:report.yaw,freeOrbit:true,studyResolution:192});
 const actual=paperCompare(scene,img,c),record=report.views.find(([id])=>id===c.id)[1];
 assert.equal(actual.errors.length,record.length);
 assert(actual.errors.every((e,i)=>Number.isFinite(e)&&Math.abs(e-record[i])<.002),c.id+' 원형 지문');
}
console.log('35차 검수 통과 · 원형 21종 · 크기 양끝 · 팔 178도 · 원도판 15칸 · 자료 '+notes.length+'개');

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {angleDelta46,snapAngle46} from '../studio-angle46.mjs';
import {mountAngleComparison} from '../studio-three-views46.mjs';
import {pivotSpec,pivotChoices} from '../studio-sculpt-model.mjs';
const read = name => readFile(new URL('../'+name,import.meta.url),'utf8');
const round = await read('round46.html');
const page = await read('studio-sculpt.html');
const module = await read('studio-sculpt.mjs');
assert(round.includes('data-round="46"') && round.includes('zone=lower'));
for (const subject of ['F02','M01','W']) assert(round.includes('contour36.html?round=46&amp;case='+subject));
for (const id of ['shapePad','widthGauge','triptych','poseDial46']) assert(page.includes('id="'+id+'"'));
assert(module.includes('compareAngles.update(model,left.display,right.display'));
assert.equal(typeof mountAngleComparison,'function');
assert.equal(angleDelta46(179,-179),2);
assert.equal(angleDelta46(-179,179),-2);
for(const id of ['M01','F02','W'])for(const p of pivotChoices(id)){
  const {min,max}=pivotSpec(p);
  assert.equal(snapAngle46(min-300,min,max),min);
  assert.equal(snapAngle46(max+300,min,max),max);
  assert.equal(snapAngle46(0,min,max),0);
}
for(const name of ['controller-note46','precedent-note46']){
  const [note]=JSON.parse(await read(name+'.json'));
  assert(note.unit.length>120 && note.detail.length>1200 && note.sources.length>=3);
}
console.log('관절별 범위와 중립·원점 통과·세 시점 연결·연구 두 건 확인');

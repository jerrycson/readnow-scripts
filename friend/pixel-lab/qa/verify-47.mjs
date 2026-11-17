import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildSculptBase,defaultView,displayScene,renderSculpt} from '../studio-sculpt-model.mjs';
import {addRound47,displayedBase} from '../studio-bases47.mjs';
import {validatePreset,initial} from '../studio-sculpt-settings.mjs';
const base=new URL('../',import.meta.url),get=name=>readFile(new URL(name,base));
const getJSON=async name=>JSON.parse(await get(name));
const {loadRig}=await import('../rig32.mjs');await loadRig();
const assets={};
for(const [key,file] of Object.entries({atlas:'atlas35',traces:'traces36',fit:'fit36',face:'face-eval42',chest:'chest-eval42'}))assets[key]=await getJSON(file+'.json');
const fingerprint=pixels=>createHash('sha256').update(pixels.data).digest('hex');
const journal=(await get('round47.html')).toString();
for(const id of ['F02','M01','W']){
  assert(journal.includes('round=47&amp;case='+id));
  const model=addRound47(buildSculptBase(id,assets),assets),v={...defaultView(id),yaw:-45,pitch:0,size:48};
  const draw=(key,view)=>fingerprint(renderSculpt(model,displayScene(model,key,displayedBase(model,key)),view));
  const three=['history37',id==='F02'?'candidate':'prior','round47'];
  assert.equal(new Set(three.map(key=>draw(key,v))).size,3);
  assert.notEqual(draw('round47',v),draw('round47',{...v,yaw:0}));
  const p=initial(id);p.base='round47';assert.equal(validatePreset(p).base,'round47');
}
const rows=await getJSON('studio-training47.json');assert.equal(rows.length,27);
assert(rows.every(r=>r.outcome==='measured'&&Number.isFinite(r.metricAfter)));
assert.equal(new Set(rows.filter(r=>r.subject==='W').map(r=>r.episode)).size,1);
console.log('37차·교정 전·47차 세 모델 구분, 48px 회전, 작업 설정 복원, 27건 근거 묶음 통과');

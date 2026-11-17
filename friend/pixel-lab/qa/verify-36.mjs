import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULTS} from '../model.mjs';
import {loadRig} from '../rig32.mjs';
import {chest36,face36,faceLines,unseenJaw} from '../contour-model36.mjs';
import {averageGap} from '../contour-fit36.mjs';
import {surfaceDefaults} from '../surface-settings35.mjs';
import {bindSurface,surfaceParts} from '../surface35.mjs';
import {raisedPose,pose34} from '../bust34.mjs';
const read=f=>JSON.parse(readFileSync(new URL('../'+f,import.meta.url)));
const ref=read('traces36.json'),fit=read('fit36.json'),atlas=read('atlas35.json'),head=read('head36.json');
await loadRig();
assert.equal(Object.keys(fit.paper).length,15);assert.equal(head.tests.length,50);
for(const [id,src] of Object.entries(ref.faces)){
 const record=atlas.faces.find(r=>r.id===id),m=face36({...DEFAULTS,sex:id==='F02'?'female':'male',heads:8,designStyle:'manga'},record,src);
 for(const k of ['front','side'])assert(fit.faces[id][k][1]<fit.faces[id][k][0]);
 const curves=unseenJaw(m.after,record,m.before);assert(Math.abs(averageGap([curves.flat()],[src.other])-fit.faces[id].other[1])<.01);
 assert(faceLines(m.after,m).side[0].every(p=>p.every(Number.isFinite)));
}
for(const volume of [.2,.5,.85]){
 const s={...DEFAULTS,...surfaceDefaults,showNac:true,top:'none',sex:'female',designStyle:'manga',heads:8,chestVolume:volume,paperForm:'W'};
 const sc=chest36(s,ref,fit.fit),bind=bindSurface(sc,s);assert.equal(bind?.length,4,'양쪽 유두·유륜 부착 '+volume);
 assert.equal(bindSurface(sc,{...s,showNac:false}),null);
 for(const angle of [0,90,178]){
  const pose=angle?pose34(sc,raisedPose(angle)).scene:sc;
  for(const m of surfaceParts(bind,pose.parts[0]))assert(m.vertices.every(v=>v.p.every(Number.isFinite)));
 }
}
assert(fit.paper.S3.after.errors[0]<fit.paper.S3.before.errors[0]);assert(fit.passes.at(-1)<fit.passes[0]);
assert.equal(read('landmarks36.json').length,30);
console.log('36차 원본 선·교정 메시·별도 작화·50시점·유두 부착 검증 통과');

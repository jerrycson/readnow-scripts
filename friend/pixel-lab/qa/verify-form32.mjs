import assert from 'node:assert/strict';
import {DEFAULTS} from '../model.mjs';
import {foundation} from '../foundation32.mjs';
import {poseScene,loadRig,setAngle,inspectStrain,pivots} from '../rig32.mjs';
import {renderPixels} from '../renderer.mjs';
import {selectAnatomyDetail} from '../detail-selection.mjs';
await loadRig();
for(const sex of ['female','male'])for(const heads of [2,3,4,5,6,7,8]){
  const s={...DEFAULTS,heads,sex,designStyle:'manga',candidate:'B',resolution:48};
  const scene=foundation(s),p={},rest=pivots(scene);
  const draw=(surface,yaw,pitch,portrait=false)=>renderPixels(s,{sceneOverride:surface,yaw,pitch,freeOrbit:true,portrait});
  const neutral=draw(scene,0,0);
  for(const yaw of [0,45,90,135,180,225,270,315])for(const pitch of [0,45,90,135,180,225,270,315]){
    const r=draw(scene,yaw,pitch);
    assert(r.metrics.opaque>40);assert(!r.metrics.clipped,JSON.stringify({sex,heads,yaw,pitch}));
  }
  for(const id of Object.keys(rest)){
    const single={};setAngle(single,id,'bend',30);
    const v=poseScene(scene,single),bodyIndex=scene.parts.findIndex(m=>m.name.includes('body'));
    assert(v.scene.parts[bodyIndex].vertices.some((p,i)=>p!==scene.parts[bodyIndex].vertices[i]) || (id==='jaw'&&heads<5));
  }
  setAngle(p,'right.shoulder','bend',999);assert.equal(p['right.shoulder'].bend,165);
  setAngle(p,'right.shoulder','side',100);assert.equal(p['right.shoulder'].side,0);
  setAngle(p,'right.elbow','bend',85);setAngle(p,'right.knee','bend',85);setAngle(p,'neck','turn',30);setAngle(p,'jaw','bend',18);
  const posed=poseScene(scene,p);
  assert.deepEqual(rest['left.wrist'],posed.handles['left.wrist']);
  assert.notDeepEqual(rest['right.wrist'],posed.handles['right.wrist']);
  const lengths=(a,b)=>Math.hypot(...a.map((x,k)=>x-b[k]));
  assert(Math.abs(lengths(posed.handles['right.wrist'],posed.handles['right.elbow'])-lengths(rest['right.wrist'],rest['right.elbow']))<1e-6);
  const strain=inspectStrain(posed.scene);assert(strain.count>0 && strain.count<strain.total);
  for(const mesh of posed.scene.parts)for(const v of mesh.vertices)assert(v.p.every(Number.isFinite)&&v.n.every(Number.isFinite));
  const fractional=draw(posed.scene,17.5,326.25);assert.equal(fractional.coordinates.yaw,17.5);assert.equal(fractional.coordinates.pitch,326.25);
  for(const focus of ['hand','foot'])assert(selectAnatomyDetail(strain.scene,focus).parts.length);
  assert.deepEqual(draw(poseScene(scene,{}).scene,0,0).data,neutral.data);
  console.log(sex,heads,'64 full-body views, 14 pivot checks, compound pose, strain and reset');
}

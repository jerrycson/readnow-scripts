import assert from 'node:assert/strict';
import {DEFAULTS} from '../model.mjs';
import {renderPixels,projectPoint} from '../renderer.mjs';
import {loadRig,poseScene} from '../rig32.mjs';
import {foundation} from '../foundation32.mjs';
import {articulate,presets,presetPose,commonFrame,setAngle} from '../articulation33.mjs';
import {morphForm,chestPresets,bodyPresets} from '../morph33.mjs';
import {createHash} from 'node:crypto';
await loadRig();
const finite=p=>p.every(Number.isFinite);
function check(sc){
 const seen=new Set();
 for(const m of sc.parts)if(!seen.has(m.vertices)){seen.add(m.vertices);for(const v of m.vertices)assert(finite(v.p)&&finite(v.n),m.name);}
}
const hash=r=>createHash('sha256').update(r.data).digest('hex');
let views=0,poses=0,adultHandles,smallHandles;const clip=[];
for(const sex of ['female','male'])for(let heads=2;heads<=8;heads++){
 const s={...DEFAULTS,sex,heads,candidate:'B',designStyle:'manga',resolution:48},sc=morphForm(s);
 const neutral=articulate(sc,{});assert.equal(neutral.scene,sc);
 const pose=presetPose('캡처 · 공중 X','human'),result=articulate(sc,pose);
 const prev=poseScene(foundation(s),pose);
 for(let yaw=0;yaw<360;yaw+=45)for(let pitch=0;pitch<360;pitch+=45){
  const cam=commonFrame(prev.scene,result.scene,yaw,pitch),r=renderPixels(s,{sceneOverride:{...result.scene,...cam},yaw,pitch,freeOrbit:true});
  assert(r.data.some((v,i)=>i%4===3&&v));assert(r.data.every((v,i)=>i%4!==3||!v||((i>>2)%48>0&&(i>>2)%48<47&&(i>>2)>=48&&(i>>2)<47*48)),sex+' '+heads+' '+yaw+' '+pitch);
  views++;
 }
 if(heads===8){
  const old=renderPixels(s,{sceneOverride:prev.scene,studyResolution:192}),now=renderPixels(s,{sceneOverride:{...result.scene,...commonFrame(prev.scene,result.scene)},studyResolution:192});
  const oldWrist=projectPoint(old,prev.handles['right.wrist'])[1],newWrist=projectPoint(now,result.handles['right.wrist'])[1];
  const top=sc=>Math.max(...sc.parts[0].vertices.map(v=>v.p[1]));
  const oldTop=projectPoint(old,[0,top(prev.scene),0])[1],newTop=projectPoint(now,[0,top(result.scene),0])[1];
  assert(oldTop<0 && newTop>0 && newWrist>0,JSON.stringify({oldTop,newTop,oldWrist,newWrist}));clip.push({sex,oldWrist,newWrist,oldTop,newTop});
 }
 for(const [name] of Object.entries(presets)){
  const p=presetPose(name,'trained'),m=articulate(sc,p);check(m.scene);assert(Object.values(m.handles).every(finite));poses++;
 }
 if(heads===8)adultHandles=Object.keys(result.handles).length;else if(heads===2)smallHandles=Object.keys(result.handles).length;
}
const s={...DEFAULTS,heads:8,sex:'female',designStyle:'manga',resolution:96};
const hashes=new Set();for(const c of Object.values(chestPresets))hashes.add(hash(renderPixels(s,{sceneOverride:morphForm(s,{},c),portrait:'chest',yaw:90})));assert.equal(hashes.size,6);
for(const b of Object.values(bodyPresets))check(articulate(morphForm(s,b,{volume:1,asym:.6}),presetPose('깊은 쪼그림','human')).scene);
const knee={};setAngle(knee,'right.knee','turn',79);assert.equal(knee['right.knee'].turn,0);setAngle(knee,'right.knee','bend',90);setAngle(knee,'right.knee','turn',79);assert.equal(knee['right.knee'].turn,24);
console.log(JSON.stringify({views,poses,adultHandles,smallHandles,sideChestHashes:hashes.size,clip},null,2));

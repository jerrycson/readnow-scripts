import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DEFAULTS} from '../model.mjs';
import {loadRig} from '../rig32.mjs';
import {face36} from '../contour-model36.mjs';
import {correctFernChin,underside} from '../chin37.mjs';
import {face38} from '../face38.mjs';
import {portraitPixels} from '../portrait48.mjs';

const read=name=>JSON.parse(readFileSync(new URL('../'+name,import.meta.url)));
const atlas=read('atlas35.json'),traces=read('traces36.json').faces,eval38=read('face-eval38.json');
const hash=data=>createHash('sha256').update(data).digest('hex');
const positions=scene=>hash(JSON.stringify(scene.parts[0].vertices));
function surfaceHeight(line,x){
 const hits=[];
 for(let j=1;j<line.length;j++){
  const [a,b]=[line[j-1],line[j]];
  if(a[0]===b[0]||(x-a[0])*(x-b[0])>0)continue;
  hits.push(a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0]));
 }
 return Math.max(...hits);
}
function faceNormal(mesh,f){
 const [a,b,c]=f.map(i=>mesh[i].p),u=b.map((x,k)=>x-a[k]),v=c.map((x,k)=>x-a[k]);
 return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
}
await loadRig();
for(const [id,result] of Object.entries(eval38.cases)){
 const ref=traces[id],record=atlas.faces.find(v=>v.id===id);
 const s={...DEFAULTS,heads:8,designStyle:'manga',sex:id==='F02'?'female':'male',resolution:128};
 const model=face36(s,record,ref),base=id==='F02'?correctFernChin(model.after,id,model,ref,.75):model.after;
 const snapshot=positions(base),next=face38(base,id,model,ref),old=base.parts[0].vertices,vertices=next.parts[0].vertices,chin=base.landmarks.chin[1];
 assert.equal(positions(base),snapshot,'입력 메시가 변경됐습니다');
 assert.equal(face38(base,'미지원',model,ref),base);
 assert.equal(positions(face38(base,id,model,ref)),positions(next));
 assert.equal(next.parts.length,base.parts.length);
 let changes=0,affected=0;
 for(let i=0;i<old.length;i++){
  if(vertices[i]===old[i])continue;
  const p=old[i].p,q=vertices[i],h=p[1]-chin;
  assert(h>=-.22&&h<=.18&&Math.abs(p[0])<=.41);
  assert(q.p.every(Number.isFinite)&&q.n.every(Number.isFinite));changes++;
 }
 assert.equal(changes,result.changedVertices);
 for(let k=0;k<next.parts.length;k++){
  const a=base.parts[k],b=next.parts[k];
  assert.equal(a.faces,b.faces);if(a.vertices!==old){assert.equal(a,b);continue;}
  assert.equal(b.vertices,vertices);
  for(const tri of a.faces){
   if(!tri.some(i=>old[i]!==vertices[i]))continue;
   const u=faceNormal(old,tri),v=faceNormal(vertices,tri),prior=Math.hypot(...u),current=Math.hypot(...v);
   if(prior<1e-12)continue;
   assert(current/prior>=.27 && u.reduce((sum,x,k)=>sum+x*v[k],0)>.23*prior*current);
   affected++;
  }
 }
 assert.equal(affected,result.affectedFaces);
 const [lo,hi]=result.side.visibleRangeX;
 for(const [key,scene] of [['baseline',base],['candidate',next]]){
  const actual=underside(scene,model,ref),ys=[];
  for(let x=lo;x<=hi;x+=.5){
   const delta=surfaceHeight(actual,x)-surfaceHeight(ref.side,x);if(Number.isFinite(delta))ys.push(Math.abs(delta));
  }
  const mean=ys.reduce((s,x)=>s+x,0)/ys.length;
  assert(Math.abs(mean-result[key].horizontalColumnMae)<.0006);
 }
 assert(result.candidate.horizontalColumnMae<result.baseline.horizontalColumnMae);
 assert(result.candidate.tangentMaeDeg<result.baseline.tangentMaeDeg);
 assert(result.candidate.maxTurnDeg<=result.baseline.maxTurnDeg);
 const views=eval38.views.filter(v=>v.id===id);
 assert.deepEqual(views.map(v=>v.imageNumber),[2,4]);
 for(const v of views){
  assert(v.visible37.length>100&&v.visible38.length>100);
  assert([...v.visible37,...v.visible38].every(p=>p.length===2&&p.every(x=>x>=0&&x<248)));
  assert(v.meanDistancePx[1]<v.meanDistancePx[0]);
 }
 for(const yaw of [-90,-45,45]){
  const render=scene=>portraitPixels(s,{sceneOverride:scene,portrait:'face',yaw,pitch:0,freeOrbit:true,studyResolution:192});
  const a=render(base),b=render(next);assert.equal(b.width,192);assert.notEqual(hash(a.data),hash(b.data));
 }
 console.log(id+' 실제 정점 '+changes+'개, 인접면 '+affected+'개, 측면·사선·입력 보존 통과');
}

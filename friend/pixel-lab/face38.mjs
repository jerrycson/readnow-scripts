import {underside} from './chin37.mjs';
import {orientedSkin} from './skin-normals35.mjs';

const range={F02:[57,92],M01:[58,89]};
const selected={F02:{strength:.65,width:.064,relax:.1,left:4,right:-4},M01:{strength:1.15,width:.025,relax:.42,neck:3.5}};
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function lower(curve,x){
 let y=-Infinity;
 for(let i=1;i<curve.length;i++){
  const a=curve[i-1],b=curve[i];
  if(a[0]===b[0]||(x-a[0])*(x-b[0])>0)continue;
  y=Math.max(y,a[1]+(x-a[0])/(b[0]-a[0])*(b[1]-a[1]));
 }
 return y;
}
function cross(a,b,c){
 const x=b[0]-a[0],y=b[1]-a[1],z=b[2]-a[2],u=c[0]-a[0],v=c[1]-a[1],w=c[2]-a[2];
 return [y*w-z*v,z*u-x*w,x*v-y*u];
}
// 원전에서 실제 보이는 끝 1px 밖에서는 관찰한 끝의 기울기를 짧게 연장하고
// 목 안쪽까지 20px에 걸쳐 기존 표면으로 돌아온다. 가린 목 좌표는 추정이다.
function profileField(scene,id,model,ref){
 const [start,end]=range[id],cam=model.frame.side,measured=underside(scene,model,ref),knots=[];
 for(let x=start;x<=end;x++){
  const a=lower(measured,x),b=lower(ref.side,x);
  if(Number.isFinite(a)&&Number.isFinite(b))knots.push({x,y:a,dy:Math.max(-12,Math.min(12,b-a))});
 }
 if(!knots.length)return null;
 const curve=[];
 const at=(line,x)=>lower(line,x);
 const endOfNeck=end+12,neck=at(measured,endOfNeck),neckSlope=(neck-at(measured,endOfNeck-3))/3;
 const jawSlope=(at(ref.side,end)-at(ref.side,end-5))/5;
 const span=endOfNeck-end;
 const tangent=x=>Math.atan2(at(measured,x+2)-at(measured,x-2),4);
 let bend=end,angleChange=0;
 for(let x=end-4;x<=end+7;x+=.5){
  const delta=tangent(x+1)-tangent(x-1);
  if(delta>angleChange){bend=x;angleChange=delta;}
 }
 for(let x=start-10;x<=end+26;x++){
  // 가려진 영역의 경사를 원본 관측으로 오인하지 않도록 잔차에만 완만한 경계를 준다.
  const center=Math.min(end,Math.max(start,x));let sum=0,value=0,src=0;
  for(const p of knots){const w=Math.exp(-.5*((p.x-center)/3.7)**2);sum+=w;value+=w*p.dy;src+=w*p.y;}
  let baseline=at(measured,x),offset=value/sum;
  if(x>end&&Number.isFinite(neck)&&Number.isFinite(neckSlope)){
   if(x<endOfNeck){
    const t=(x-end)/span,a=at(ref.side,end),t2=t*t,t3=t2*t;
    const target=(2*t3-3*t2+1)*a+(t3-2*t2+t)*span*jawSlope+(-2*t3+3*t2)*neck+(t3-t2)*span*neckSlope;
    offset=target-baseline;
   }else offset=0;
  }
  if(!Number.isFinite(baseline))baseline=src/sum;
  if(!Number.isFinite(offset))offset=0;
  curve.push({dy:offset*smooth(start-10,start+1,x)*(1-smooth(end-1,end+26,x)),y:baseline});
 }
 return {start:start-10,end:end+26,curve,cam,bend};
}
const fields=new WeakMap();
function prepared(scene,id,model,ref){
 let cached=fields.get(scene);
 if(cached&&cached.ref===ref&&cached.model===model&&cached.id===id)return cached;
 const field=profileField(scene,id,model,ref);if(!field)return null;
 const vertices=scene.parts[0].vertices,faces=scene.parts.filter(p=>p.vertices===vertices).flatMap(p=>p.faces);
 const chin=scene.landmarks.chin[1],{cam}=field;
 const neighbors=new Map(),weights=vertices.map(({p:[x,y,z]},i)=>{
  const h=y-chin,u=cam.x-(z-model.eyeDepth)*cam.scale;
  if(h<-.22||h>.18||Math.abs(x)>.41||u<=field.start||u>=field.end)return null;
  const t=u-field.start,j=Math.floor(t),a=field.curve[j],b=field.curve[Math.min(j+1,field.curve.length-1)];
  const dy=a.dy+(b.dy-a.dy)*(t-j),boundary=a.y+(b.y-a.y)*(t-j);
  const normalDistance=(cam.y-h*cam.scale-boundary)/cam.scale;
  const band=Math.exp(-.5*(normalDistance/.099)**2)*(1-smooth(.26,.41,Math.abs(x)))*smooth(-.22,-.13,h)*(1-smooth(.115,.18,h));
  if(band<.0005)return null;
  neighbors.set(i,new Set());
  return {dy:-band*dy/cam.scale,round:-band*Math.exp(-.5*((u-field.bend)/6.5)**2)/cam.scale,
   left:-band*Math.exp(-.5*((u-field.bend+6)/4.2)**2)/cam.scale,right:-band*Math.exp(-.5*((u-field.bend-6)/4.2)**2)/cam.scale,
   band:band*smooth(field.start,field.start+9,u)*(1-smooth(field.end-14,field.end,u))};
 });
 const patch=[];
 for(const f of faces){
  if(!f.some(i=>weights[i]))continue;
  const prior=cross(...f.map(i=>vertices[i].p)),area=Math.hypot(...prior);
  if(area>1e-12)patch.push({f,prior,area});
  for(const i of f){const list=neighbors.get(i);if(list)for(const k of f)if(i!==k)list.add(k);}
 }
 const offsets=weights.map((w,i)=>{
  if(!w)return null;
  const p=vertices[i].p,d=[0,0,0];let sum=0;
  for(const j of neighbors.get(i)){
   const q=vertices[j].p,edge=Math.hypot(...p.map((v,k)=>q[k]-v));if(edge<1e-8)continue;
   const a=1/edge;sum+=a;for(let k=0;k<3;k++)d[k]+=a*(q[k]-p[k]);
  }
  return {...w,relax:d.map(v=>sum?v/sum*w.band:0)};
 });
 cached={field,id,ref,model,vertices,faces,patch,offsets};fields.set(scene,cached);return cached;
}
export function trialFace38(scene,id,model,ref,setting){
 if(!Object.hasOwn(range,id))return scene;
 const info=prepared(scene,id,model,ref);if(!info)return scene;
 const {vertices,faces,patch,offsets}=info;
 const next=vertices.map((v,i)=>{
  const w=offsets[i];if(!w)return v;
  const [x,y,z]=v.p;
  const lateral=w.band*smooth(.04,.21,Math.abs(x));
  const vertical=setting.strength*w.dy+(setting.neck||0)*w.round+(setting.left||0)*w.left+(setting.right||0)*w.right;
  return {...v,p:[x+Math.sign(x)*setting.width*lateral+setting.relax*w.relax[0],y+vertical+setting.relax*w.relax[1],z+setting.relax*w.relax[2]]};
 });
 // 원래 작화 메시의 가느다란 면에서 움직임이 접히지 않게 정점별로 줄인다.
 for(let pass=0;pass<28;pass++){
  const bad=new Set();
  for(const {f,prior,area} of patch){
   const norm=cross(...f.map(i=>next[i].p)),mag=Math.hypot(...norm);
   if(mag<.27*area||prior.reduce((s,x,k)=>s+x*norm[k],0)<.23*mag*area)f.forEach(i=>bad.add(i));
  }
  if(!bad.size)break;
  for(const i of bad){if(next[i]===vertices[i])continue;const p=vertices[i].p,q=next[i].p;next[i]={...vertices[i],p:p.map((x,k)=>x+.5*(q[k]-x))};}
 }
 const shaped=orientedSkin(vertices,next,faces);
 return {...scene,parts:scene.parts.map(m=>m.vertices===vertices?{...m,vertices:shaped}:m)};
}
export function face38(scene37,id,model,faceRef){
 return Object.hasOwn(selected,id)?trialFace38(scene37,id,model,faceRef,selected[id]):scene37;
}

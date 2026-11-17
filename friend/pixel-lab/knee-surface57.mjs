// 57차 수동 연구. 검증된55차 네 기본형만. 기본 채택 여부는 별도 측정으로 정한다.
import {applyKneeSurface55,supportsKneeSurface55} from './knee-surface55.mjs';
import {plantFeet55,supportRig55} from './planted-leg55.mjs';
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,s)=>a.map(x=>x*s);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>mul(a,1/(Math.hypot(...a)||1)),mix=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t),clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const plans=new WeakMap(),originals=new WeakMap();
const sideOf=m=>m.vertices.reduce((n,v)=>n+v.p[0],0)>0?'right':'left';
const bend=j=>180-Math.acos(Math.max(-1,Math.min(1,dot(unit(sub(j.hip,j.knee)),unit(sub(j.ankle,j.knee))))))*180/Math.PI;
function rayHit(origin,direction,triangle){
 const [a,b,c]=triangle.p,e1=sub(b,a),e2=sub(c,a),h=cross(direction,e2),det=dot(e1,h);if(Math.abs(det)<1e-12)return null;
 const s=sub(origin,a),u=dot(s,h)/det;if(u< -1e-8||u>1+1e-8)return null;
 const q=cross(s,e1),v=dot(direction,q)/det;if(v< -1e-8||u+v>1+1e-8)return null;
 const t=dot(e2,q)/det;return t>=0?{t,normal:unit(add(add(mul(triangle.n[0],1-u-v),mul(triangle.n[1],u)),mul(triangle.n[2],v)))}:null;
}
function planFor(rest){
 if(plans.has(rest))return plans.get(rest);
 // 중립에서도 같은55차 선택 띠를 만든다. 55차의 조기 반환만 우회하는 새57 호출이다.
 const selected=applyKneeSurface55(rest,rest,{neutral:false,transform:p=>p});if(selected===rest)return null;
 const pairs=[];
 for(let index=0;index<rest.parts.length;index++){
  const before=rest.parts[index],mesh=selected.parts[index];if(before.name!=='knee'||before===mesh)continue;
  const side=sideOf(before),same=m=>['thigh','calf','knee'].includes(m.name)&&sideOf(m)===side;
  const triangles=rest.parts.filter(same).flatMap(m=>m.faces.map(face=>({p:face.map(i=>m.vertices[i].p),n:face.map(i=>m.vertices[i].n)}))).map(t=>({...t,minY:Math.min(...t.p.map(p=>p[1])),maxY:Math.max(...t.p.map(p=>p[1]))}));
  const thighId=rest.parts.findIndex(m=>m.name==='thigh'&&sideOf(m)===side),calfId=rest.parts.findIndex(m=>m.name==='calf'&&sideOf(m)===side),ring=24;
  if(mesh.vertices.length!==ring*11)throw Error('57차 검증 범위 밖의 무릎 띠 격자');
  const top=mesh.vertices.slice(0,ring).map(v=>rest.parts[thighId].vertices.indexOf(v)),bottom=mesh.vertices.slice(-ring).map(v=>rest.parts[calfId].vertices.indexOf(v));if([...top,...bottom].some(i=>i<0))throw Error('57차 띠의 경계 대응 누락');
  const center=rest.joints[side].knee;
  const fitted=mesh.vertices.map((v,i)=>{
   if(i<ring||i>=mesh.vertices.length-ring)return v.p;
   const origin=[center[0],v.p[1],center[2]],direction=unit([v.p[0]-center[0],0,v.p[2]-center[2]]);let hit=null;
   for(const t of triangles){if(v.p[1]<t.minY-1e-9||v.p[1]>t.maxY+1e-9)continue;const h=rayHit(origin,direction,t);if(h&&(!hit||h.t>hit.t))hit=h;}
   return hit?add(origin,mul(direction,hit.t)):v.p;
  });
  pairs.push({index,side,mesh,fitted,thighId,calfId,top,bottom,ring,restBend:bend(rest.joints[side])});
 }
 const plan={selected,pairs};plans.set(rest,plan);return plan;
}
export const supportsKneeSurface57=rest=>supportsKneeSurface55(rest);
export function applyKneeSurface57(rest,posed,rig,{mode='neutralFit',blendAngle=35}={}){
 if(!rest||!posed||!rig||!supportsKneeSurface57(rest)||posed.kneeSurface57)return posed;
 if(!['neutralFit','fixed55'].includes(mode)||!Number.isFinite(blendAngle)||blendAngle<=0)throw RangeError('57차 무릎 연구 설정 확인');
 const plan=planFor(rest);if(!plan)return posed;const parts=posed.parts.slice(),weights=[];
 for(const p of plan.pairs){
  const amount=mode==='fixed55'?1:rig.neutral?0:smooth((bend(rig.joints[p.side])-p.restBend)/blendAngle),side=Number(p.side==='right');weights.push(amount);
  const positions=p.mesh.vertices.map((v,i)=>{const ref=amount===1?v.p:amount===0?p.fitted[i]:mix(p.fitted[i],v.p,amount);return rig.neutral?ref:rig.transform(ref,'knee',side);}),normals=positions.map(()=>[0,0,0]);
  for(let i=0;i<p.ring;i++){positions[i]=parts[p.thighId].vertices[p.top[i]].p;positions[positions.length-p.ring+i]=parts[p.calfId].vertices[p.bottom[i]].p;}
  for(const [a,b,c]of p.mesh.faces){const n=cross(sub(positions[b],positions[a]),sub(positions[c],positions[a]));for(const i of [a,b,c])normals[i]=add(normals[i],n);}
  const vertices=positions.map((pos,i)=>({p:pos,n:unit(normals[i])}));
  for(let i=0;i<p.ring;i++){vertices[i]=parts[p.thighId].vertices[p.top[i]];vertices[vertices.length-p.ring+i]=parts[p.calfId].vertices[p.bottom[i]];}
  parts[p.thighId]={...parts[p.thighId],faces:plan.selected.parts[p.thighId].faces};parts[p.calfId]={...parts[p.calfId],faces:plan.selected.parts[p.calfId].faces};parts[p.index]={...parts[p.index],vertices,faces:p.mesh.faces};
 }
 return {...posed,parts,kneeSurface57:true,knee57:{mode,weights,topology:'fixed-selected55',blendAngle}};
}
export function plantFeetKnee57(scene,raw){
 const rest=originals.get(scene)||scene;if(!raw)return rest;
 if(raw.kneeSurface57!==true||!supportsKneeSurface57(rest))return plantFeet55(rest,raw);
 const settings={...raw,kneeSurface:false},posed=plantFeet55(rest,settings),rig=supportRig55(rest,settings);
 const result=applyKneeSurface57(rest,posed,rig,{mode:raw.kneeMode57||'neutralFit',blendAngle:raw.kneeBlend57??35});originals.set(result,rest);return result;
}

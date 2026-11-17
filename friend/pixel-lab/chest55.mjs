import {editChest54,poseReference54} from './chest54.mjs';
import {rotateNormals50} from './body-multiview50.mjs';
import {cutMaterial55} from './chest-material55.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const marker=m=>m.mat==='areola35'||m.mat==='papilla35';
const minus=(a,b)=>a.map((v,k)=>v-b[k]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((sum,v,k)=>sum+v*b[k],0);
function withSkin(scene,verts,refs,api){
  const skin=scene.parts[0],active=new Set();
  for(let i=0;i<verts.length;i++)if(verts[i]!==skin.vertices[i])active.add(i);
  if(!active.size)return scene;
  const faces=skin.faces.filter(f=>f.some(i=>active.has(i)));
  rotateNormals50(skin.vertices,verts,faces);
  const parts=scene.parts.filter(m=>!marker(m)).map(m=>m.vertices===skin.vertices?{...m,vertices:verts}:m);
  return {...scene,parts:parts.concat(api.surfaceParts(refs,parts[0]))};
}
function anchors(scene,refs){
  return [-1,1].map(side=>{
    const q=refs?.find(r=>r.side===side&&r.component==='papilla')?.points[0];
    if(!q)return null;
    return [0,1,2].map(k=>q.ids.reduce((sum,i,j)=>sum+q.weights[j]*scene.parts[0].vertices[i].p[k],0));
  });
}
// 피부의 로컬 상하 변위를 재현하는 무차원 시험. 입력 1은 힘이나 촬영 장비 압력이 아니다.
export function compress55(scene,rest,refs,api,amount,centerRefs=refs){
  if(!(amount>0))return scene;
  const level=clamp(amount),centers=anchors(scene,centerRefs);
  if(centers.every(c=>!c))return scene;
  const mesh=scene.parts[0],out=mesh.vertices.slice(),w=Math.abs(rest.joints.right.shoulder[0]);
  const shoulder=rest.joints.right.shoulder[1],hip=rest.joints.right.hip[1],length=shoulder-hip;
  for(let i=0;i<out.length;i++){
    const material=rest.restSkin35[i]?.p;
    if(!material)continue;
    const height=(material[1]-hip)/length;
    const region=smooth(.40,.53,height)*(1-smooth(.82,.94,height))*(1-smooth(1.03,1.25,Math.abs(material[0])/w));
    if(region<=0)continue;
    const p=out[i].p,hand=material[0]<0?0:1,c=centers[hand];if(!c)continue;
    const x=(p[0]-c[0])/w,y=(p[1]-c[1])/w,z=(p[2]-c[2])/w;
    const weight=region*(1-smooth(.22,.58,Math.abs(x)))*(1-smooth(.22,.52,Math.abs(y)))*smooth(-.54,-.16,z);
    if(!weight)continue;
    const lift=-level*.27*(y+.10)*weight;
    out[i]={...out[i],p:[p[0],p[1]+w*lift,p[2]]};
  }
  return withSkin(scene,out,refs,api);
}
export const relief55=Object.freeze({cx:.84,cy:-.60,cz:.64,wx:.19,wy:.29,wz:.37,strength:.76});
export function relaxLower55(current,reference,rest,refs,api,angle,plan=relief55){
  const high=smooth(110,169,angle);if(!high)return current;
  const mesh=current.parts[0],base=reference.parts[0],out=mesh.vertices.slice(),sh=rest.joints.right.shoulder,w=Math.abs(sh[0]);
  for(let i=0;i<base.vertices.length;i++){
    const p=rest.restSkin35[i].p,x=Math.abs(p[0])/w,y=(p[1]-sh[1])/w,z=(p[2]-sh[2])/w;
    const r=Math.hypot((x-plan.cx)/plan.wx,(y-plan.cy)/plan.wy,(z-plan.cz)/plan.wz);
    const weight=plan.strength*high*(1-smooth(.35,1.35,r));
    if(!weight)continue;
    const delta=base.vertices[i].p.map((x,k)=>x-mesh.vertices[i].p[k]);
    if(Math.hypot(...delta)<1e-10)continue;
    out[i]={...out[i],p:mesh.vertices[i].p.map((x,k)=>x+weight*delta[k])};
  }
  return withSkin(current,out,refs,api);
}
// 뒤통수 자세에서 피부 표식 부근의 재료면 전체를 위·안쪽으로 운반하는 시안.
export function carrySkin55(current,rest,refs,api,plan,reference=current,centerRefs=refs){
  if(!centerRefs?.length)return current;
  const restBody={...rest,parts:[{...rest.parts[0],vertices:rest.restSkin35}]};
  const center=anchors(restBody,centerRefs),mesh=current.parts[0],out=mesh.vertices.slice(),w=Math.abs(rest.joints.right.shoulder[0]);
  for(const [i,v]of rest.restSkin35.entries()){
    const p=v.p,sign=p[0]<0?-1:1,q=center[sign<0?0:1];if(!q)continue;
    const f=rest.paperShape.frame(sign),h=(p[1]-f.foot)/f.h;
    const r=Math.hypot((p[0]-q[0])/(w*.47),(p[1]-q[1])/(w*.42),(p[2]-q[2])/(w*.39));
    const weight=(1-smooth(.24,1.35,r))*smooth(.15,.36,h);
    if(weight===0)continue;
    const n=out[i].n,dx=-sign*plan.medial,dy=plan.up;
    const dz=plan.tangent?Math.min(.13,Math.max(-.13,-(dx*n[0]+dy*n[1])/Math.max(.32,n[2]))):0;
    out[i]={...out[i],p:out[i].p.map((x,k)=>x+[dx,dy,dz][k]*w*weight)};
  }
  if(plan.guard){
    const moves=new Map(),gains=new Map();
    out.forEach((v,i)=>{if(v!==mesh.vertices[i]){moves.set(i,minus(v.p,mesh.vertices[i].p));gains.set(i,1);}});
    const position=(i,scale=1)=>moves.has(i)?mesh.vertices[i].p.map((x,k)=>x+scale*gains.get(i)*moves.get(i)[k]):mesh.vertices[i].p;
    const faces=mesh.faces.filter(t=>t.some(i=>moves.has(i))).map(t=>{
      const [a,b,c]=t.map(i=>mesh.vertices[i].p),n=cross(minus(b,a),minus(c,a));
      return {t,n,area:dot(n,n)};
    }).filter(f=>f.area>1e-16);
    for(let pass=0;pass<32;pass++){
      const reduce=new Set();
      for(const {t,n,area}of faces){const [a,b,c]=t.map(i=>position(i));
        if(dot(cross(minus(b,a),minus(c,a)),n)<.55*area)for(const i of t)if(moves.has(i))reduce.add(i);
      }
      if(!reduce.size)break;
      for(const i of reduce)gains.set(i,gains.get(i)*.78);
    }
    const front=rest.restSkin35.map(v=>{const [x,y,z]=v.p,sg=x<0?-1:1,f=rest.paperShape.frame(sg);
      return z>=.12&&Math.abs((x-f.c)/f.root)<.93&&(y-f.foot)/f.h>=-.07&&(y-f.foot)/f.h<.82;
    });
    const patch=rest.parts[0].faces.filter(t=>t.every(i=>front[i]));
    const volume=p=>Math.abs(patch.reduce((sum,t)=>{const [a,b,c]=t.map(p);
      return sum+((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))*(a[2]+b[2]+c[2])/6;
    },0));
    const baseline=volume(i=>reference.parts[0].vertices[i].p),safe=s=>Math.abs(volume(i=>position(i,s))/baseline-1)<=.012;
    let gain=1;
    if(!safe(1)){let lo=0,hi=1;for(let k=0;k<18;k++){const x=(hi+lo)/2;if(safe(x))lo=x;else hi=x;}gain=lo;}
    for(const i of moves.keys())out[i]={...mesh.vertices[i],p:position(i,gain)};
  }
  return withSkin(current,out,refs,api);
}
export function editPressure55(study,edit={},engine,observe){
  let refs=null;
  const capture=(input,view)=>engine({...input,api:{...input.api,surfaceParts(bound,skin){
    refs=bound;return input.api.surfaceParts(bound,skin);
  }}},view);
  const current=editChest54(study,edit,capture),angle=Number(edit.angle)||0;
  observe?.(refs);
  const correct=study.id==='W'&&(!edit.pose||edit.pose==='neutral')&&(!edit.pivot||edit.pivot==='arms.raise')&&angle>110;
  if(!correct&&!(edit.compression>0))return current;
  const rest=study.raw;
  const result=correct?relaxLower55(current,poseReference54(study,edit,engine),rest,refs,study.api,angle):current;
  const displayRefs=refs;
  if(!refs?.length&&edit.compression>0){
    poseReference54(study,{...edit,surface:{...edit.surface,showNac:true,top:'none'}},capture);
  }
  return compress55(result,rest,displayRefs,study.api,edit.compression,refs);
}
export const markerTypes55=Object.freeze(['W','paper:B15','review:B11','review:B15','review:R01','review:R04','review:U05',
  'atlas:B09','atlas:B11','atlas:B14','atlas:B18','atlas:B21','atlas:B42','atlas:B43','form34:drop','form34:lateral','form34:narrow','form34:upper']);
export function editShape55(study,edit,engine,observe){
  if(study.id!=='W'||edit.pose!=='behindHead')return editPressure55(study,edit,engine,observe);
  let refs=null,centerRefs=null;
  const current=editPressure55(study,{...edit,compression:0},engine,r=>{refs=r;});
  const reference=poseReference54(study,edit,engine);
  if(refs?.length)centerRefs=refs;
  else editPressure55(study,{...edit,compression:0,surface:{...edit.surface,showNac:true,top:'none'}},engine,r=>{centerRefs=r;});
  const skin=carrySkin55(current,study.raw,refs,study.api,{medial:.065,up:.105,tangent:true,guard:true},reference,centerRefs);
  observe?.(refs);
  return compress55(skin,study.raw,refs,study.api,edit.compression,centerRefs);
}
export function editChest55(study,edit={},engine,observe){
  let refs=null;
  const current=editShape55(study,edit,engine,bound=>{refs=bound;});
  if(refs?.length&&markerTypes55.includes(study.id)){
    const rest=editChest54(study,{...edit,pose:'neutral',angle:0},engine);
    refs=cutMaterial55(refs,rest.parts[0]);
    const parts=current.parts.filter(m=>!marker(m));
    const result={...current,parts:parts.concat(study.api.surfaceParts(refs,parts[0]))};
    observe?.(refs);
    return result;
  }
  observe?.(refs);
  return current;
}

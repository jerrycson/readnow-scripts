import {editChest53,supportsChest53} from './chest53.mjs';
import {rotateNormals50} from './body-multiview50.mjs';
import {poseSpec49} from './chest49.mjs';

const cache=new WeakMap();
const refinements=new WeakMap();
// 양손 허리에서 가운데 겨드랑이의 접힘 95백분위가 10도 넘게 더 커진 세 원형.
const waistPreserved=new Set(['atlas:B09','atlas:B14','atlas:B46']);
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ramp=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const minus=(a,b)=>a.map((x,i)=>x-b[i]);
const cross=([a,b,c],[d,e,f])=>[b*f-c*e,c*d-a*f,a*e-b*d];
const dot=(a,b)=>a.reduce((s,x,k)=>s+x*b[k],0);
const unit=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
export const options54=Object.freeze({inward:.56,lift:0,back:.14,smooth:0,passes:0,spread:14,limit:true,depthCap:.10,sizeTolerance:.012,guardDepth:true});
function regions(neutral){
  const source=neutral.restSkin35;
  if(!cache.has(neutral.paperShape))cache.set(neutral.paperShape,new WeakMap());
  const bySkin=cache.get(neutral.paperShape);
  if(bySkin.has(source))return bySkin.get(source);
  const mesh=neutral.parts[0],groups=[],selected=new Set(),volumeVertices=new Set(),volumeWeights=new Map();
  const sh=neutral.joints.right.shoulder,w=Math.abs(sh[0]);
  for(const [i,v] of source.entries()){
    const [x,y,z]=v.p,sg=Math.sign(x),lateral=Math.abs(x)/w,level=(y-sh[1])/w,depth=(z-sh[2])/w;
    const frame=neutral.paperShape.frame(sg||1);
    const q=(x-frame.c)*sg/frame.root,h=(y-frame.foot)/frame.h;
    if(z>=.12&&Math.abs(q)<.93&&h>=-.07&&h<.82){
      volumeVertices.add(i);
      const weight=ramp(.18,.39,h)*(1-ramp(.64,.81,h))*ramp(.16,.53,q)*(1-ramp(.76,.93,q))*ramp(.12,.30,z);
      if(weight>0)volumeWeights.set(i,weight);
    }
    const keepFloor=ramp(.15,.38,(y-frame.foot)/frame.h);
    const zone=ramp(.59,.81,lateral)*(1-ramp(1.05,1.23,lateral))*ramp(-.88,-.59,level)*(1-ramp(.02,.30,level))*keepFloor;
    if(zone<1e-5)continue;
    const rear=1-ramp(-.45,.18,depth);
    groups.push({i,zone,rear,sg,level,lateral,depth,neighbors:[]});selected.add(i);
  }
  const faces=mesh.faces.filter(f=>f.some(i=>selected.has(i)));
  const adjacent=new Map(groups.map(g=>[g.i,new Set()]));
  for(const f of faces)for(const i of f)if(adjacent.has(i))for(const j of f)if(j!==i)adjacent.get(i).add(j);
  for(const g of groups)g.neighbors=[...adjacent.get(g.i)];
  const volumeFaces=mesh.faces.filter(t=>t.every(i=>volumeVertices.has(i)));
  const normalFaces=mesh.faces.filter(t=>t.some(i=>selected.has(i)||volumeWeights.has(i)));
  const allGroups=[...new Set([...selected,...volumeWeights.keys()])].map(i=>({i}));
  const result={groups,faces,volumeFaces,volumeWeights,normalFaces,allGroups};bySkin.set(source,result);return result;
}
function projected(v,faces,weights){
  let sum=0;
  for(const t of faces){
    const [a,b,c]=t.map(i=>v[i].p);
    const area=((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))*.5;
    const height=weights?t.reduce((s,i)=>s+(weights.get(i)||0),0):a[2]+b[2]+c[2];
    sum+=area*height/3;
  }
  return sum;
}
function guardSize(src,out,region,scale,plan){
  const {volumeFaces,volumeWeights}=region,initial=projected(src,volumeFaces);
  if(Math.abs(initial)<1e-7)return;
  let now=projected(out,volumeFaces);
  if(plan.depthCap){
    const coefficient=projected(out,volumeFaces,volumeWeights);
    if(Math.abs(coefficient)>1e-8){
      const delta=clamp((initial-now)/coefficient,-scale*plan.depthCap,scale*plan.depthCap);
      for(const [i,w]of volumeWeights){
        const {p}=out[i];out[i]={...out[i],p:[p[0],p[1],p[2]+delta*w]};
      }
      now=projected(out,volumeFaces);
    }
  }
  if(Math.abs(now/initial-1)<=plan.sizeTolerance)return;
  const trial=src.slice(),changed=[];
  for(let i=0;i<out.length;i++)if(out[i]!==src[i])changed.push(i);
  const set=g=>{for(const i of changed)trial[i]={p:src[i].p.map((v,k)=>v+g*(out[i].p[k]-v))};};
  let lo=0,hi=1;
  for(let i=0;i<12;i++){
    const g=(lo+hi)*.5;set(g);
    if(Math.abs(projected(trial,volumeFaces)/initial-1)<=plan.sizeTolerance)lo=g;else hi=g;
  }
  set(lo);for(const i of changed)out[i]={...src[i],p:trial[i].p};
}
function limitChanges(src,out,groups,faces){
  const shifts=new Map(groups.filter(({i})=>src[i]!==out[i]).map(({i})=>[i,minus(out[i].p,src[i].p)]));
  const gain=new Map([...shifts.keys()].map(i=>[i,1]));
  const reference=faces.map(t=>{
    const [a,b,c]=t.map(i=>src[i].p),n=cross(minus(b,a),minus(c,a));
    return {t,n,v:dot(n,n)};
  }).filter(x=>x.v>1e-20);
  const trial=i=>{const dp=shifts.get(i);if(!dp)return src[i].p;return src[i].p.map((x,k)=>x+dp[k]*gain.get(i));};
  for(let k=0;k<15;k++){
    const atRisk=new Map();
    for(const {t,n,v}of reference){
      const [a,b,c]=t.map(trial),ratio=dot(n,cross(minus(b,a),minus(c,a)))/v;
      if(ratio>=.50)continue;
      for(const i of t)if(shifts.has(i))atRisk.set(i,Math.min(atRisk.get(i)??1,clamp(.65+.22*ratio,.30,.78)));
    }
    if(!atRisk.size)break;
    for(const [i,f] of atRisk)gain.set(i,gain.get(i)*f);
  }
  for(const i of shifts.keys())out[i]={...src[i],p:trial(i)};
}
// 이미 포즈·표식이 계산된 53차 장면에 적용한다. 기존 피부 인덱스와 표식 메시를 유지한다.
export function shapeAxilla54(neutral,posed,plan=options54){
  if(!neutral?.restSkin35||!neutral.paperShape)return posed;
  const ref=neutral.parts[0].vertices,src=posed.parts[0].vertices;
  if(ref===src||ref.length!==src.length)return posed;
  const region=regions(neutral),{groups,faces}=region,delta=new Map(),offset=i=>delta.get(i)||src[i].p.map((x,k)=>x-ref[i].p[k]);
  for(const {i,zone,rear,sg}of groups){
    const d=offset(i),out=d.slice();
    // 흉곽에 붙은 바깥 뿌리의 바깥쪽 끌림만 줄인다. 앞뒤 피부에 다른 비중을 둔다.
    out[0]-=sg*zone*((1-rear)*plan.inward+rear*plan.back)*Math.max(0,sg*d[0]);
    out[1]-=zone*plan.lift*Math.max(0,d[1]);
    delta.set(i,out);
  }
  for(let pass=0;pass<plan.passes;pass++){
    const next=new Map();
    for(const {i,zone,neighbors}of groups){
      const d=offset(i),av=[0,0,0];
      for(const j of neighbors){const e=offset(j);for(let k=0;k<3;k++)av[k]+=e[k]/neighbors.length;}
      next.set(i,d.map((x,k)=>x+zone*plan.smooth*(av[k]-x)));
    }
    for(const [i,d]of next)delta.set(i,d);
  }
  if(plan.spread){
    let residual=new Map(groups.map(({i})=>[i,minus(delta.get(i),minus(src[i].p,ref[i].p))]));
    for(let pass=0;pass<plan.spread;pass++){
      const next=new Map();
      for(const {i,neighbors}of groups){
        const a=residual.get(i),av=[0,0,0];
        for(const j of neighbors){
          const adjacent=residual.get(j);
          if(adjacent)for(let k=0;k<3;k++)av[k]+=adjacent[k]/neighbors.length;
        }
        next.set(i,a.map((v,k)=>.44*v+.56*av[k]));
      }
      residual=next;
    }
    for(const [i,d]of residual)delta.set(i,src[i].p.map((v,k)=>v-ref[i].p[k]+d[k]));
  }
  const out=src.slice();let changed=false;
  if(plan.groove){
    const width=Math.abs(neutral.joints.right.shoulder[0]);
    for(const {i,lateral,level,depth}of groups){
      const extent=ramp(.55,.70,lateral)*(1-ramp(.90,1.06,lateral))*ramp(.18,.37,depth);
      if(!extent)continue;
      const activity=ramp(.035,.45,Math.hypot(...minus(src[i].p,ref[i].p))/width);
      const band=(level-(plan.line??.068))/(plan.band||.065);
      const relief=Math.exp(-.5*band*band)-.38*Math.exp(-.5*((band+1.6)/1.15)**2);
      delta.get(i)[2]-=width*plan.groove*extent*activity*relief;
    }
  }
  for(const [i,d]of delta){
    const p=ref[i].p.map((v,k)=>v+d[k]);
    if(Math.hypot(...p.map((v,k)=>v-src[i].p[k]))<1e-8)continue;
    changed=true;out[i]={...src[i],p};
  }
  if(!changed)return posed;
  if(plan.limit)limitChanges(src,out,groups,faces);
  if(plan.sizeTolerance)guardSize(src,out,region,neutral.paperShape.scale,plan);
  if(plan.guardDepth){
    limitChanges(src,out,region.allGroups,region.normalFaces);
    guardSize(src,out,region,neutral.paperShape.scale,{sizeTolerance:plan.sizeTolerance});
  }
  rotateNormals50(src,out,plan.depthCap?region.normalFaces:faces);
  return {...posed,parts:posed.parts.map(m=>m.vertices===src?{...m,vertices:out}:m)};
}
export const supportsChest54=id=>supportsChest53(id);
function samePose(study,edit,engine,receive){
  const capture=(input,view)=>engine({...input,api:{...input.api,
    poseChest49(rest,key){
      if(!supportsChest53(study.id)||study.id==='W')return input.api.poseChest49(rest,key);
      return input.api.pose34(rest,poseSpec49(key)).scene;
    },
    surfaceParts(refs,mesh){
      if(receive)receive(refs);return input.api.surfaceParts(refs,mesh);
    }
  }},view);
  return editChest53(study,edit,capture);
}
export function poseReference54(study,edit,engine){return samePose(study,edit,engine);}
function foldTopology(neutral){
 const material=neutral.restSkin35;
 if(refinements.has(material))return refinements.get(material);
 const j=neutral.joints.right.shoulder,w=Math.abs(j[0]),base=neutral.parts[0],recipes=[],coords=material.map(v=>v.p);
 let faces=base.faces.slice();
 const local=p=>[Math.abs(p[0])/w,(p[1]-j[1])/w,(p[2]-j[2])/w];
 const within=p=>{const [x,y,z]=local(p);return x>.49&&x<1.13&&y>-.19&&y<.34&&z>.17;};
 const append=ids=>{
   const i=coords.length;coords.push([0,1,2].map(k=>ids.reduce((s,j)=>s+coords[j][k],0)/ids.length));recipes.push(ids);return i;
 };
 const key=(a,b)=>Math.min(a,b)*65536+Math.max(a,b);
 for(let pass=0;pass<2;pass++){
   const selected=coords.map(within),edges=new Map();
   for(const t of faces)if(t.every(i=>selected[i]))for(let k=0;k<3;k++){
     const a=t[k],b=t[(k+1)%3],e=key(a,b);if(!edges.has(e))edges.set(e,append([a,b]));
   }
   const next=faces.slice();
   for(const [i,t] of faces.entries()){
     const boundary=[];
     for(let k=0;k<3;k++){boundary.push(t[k]);const j=edges.get(key(t[k],t[(k+1)%3]));if(j!==undefined)boundary.push(j);}
     if(boundary.length===3)continue;
     const center=append(t);
     next[i]=[center,boundary[0],boundary[1]];
     for(let k=1;k<boundary.length;k++)next.push([center,boundary[k],boundary[(k+1)%boundary.length]]);
   }
   faces=next;
 }
 const active=[];
 for(const [i,p]of coords.entries()){
   if(!within(p))continue;
   const [x,y,z]=local(p),b=(y-.07)/.055;
   const shape=ramp(.53,.69,x)*(1-ramp(.92,1.05,x))*ramp(.18,.34,z)*
     (Math.exp(-.5*b*b)-.32*Math.exp(-.5*((b+1.48)/1.18)**2));
   if(Math.abs(shape)>.0001)active.push({i,shape});
 }
 const ids=new Set(active.map(a=>a.i)),localFaces=faces.filter(t=>t.some(i=>ids.has(i)));
 const result={recipes,faces,localFaces,active,w};refinements.set(material,result);return result;
}
function formAnteriorFold(neutral,posed){
 const mesh=posed.parts[0],ref=neutral.parts[0].vertices.map(v=>v.p),v=mesh.vertices.slice();
 const {recipes,faces,localFaces,active,w}=foldTopology(neutral);
 function average(ids,field){return [0,1,2].map(k=>ids.reduce((sum,i)=>sum+field(i)[k],0)/ids.length);}
 for(const input of recipes){
   v.push({p:average(input,i=>v[i].p),n:unit(average(input,i=>v[i].n))});
   ref.push(average(input,i=>ref[i]));
 }
 const shifted=v.slice();
 for(const {i,shape}of active){
   const movement=ramp(.06,.40,Math.hypot(...minus(v[i].p,ref[i]))/w);
   const relief=-w*.035*movement*shape;
   if(Math.abs(relief)>1e-6)shifted[i]={...v[i],p:v[i].p.map((x,k)=>x+relief*v[i].n[k])};
 }
 const faceNormal=(v,[i,j,k])=>cross(minus(v[j].p,v[i].p),minus(v[k].p,v[i].p));
 // 같은 재료 삼각형의 원래 방향으로 투영된 면적을 40% 이상 보존한다.
 let gain=1;
 for(const t of localFaces){
   const n=faceNormal(v,t),area=dot(n,n);if(area<1e-16)continue;
   const [i,j,k]=t,ab=minus(v[j].p,v[i].p),ac=minus(v[k].p,v[i].p);
   const delta=i=>minus(shifted[i].p,v[i].p),du=minus(delta(j),delta(i)),dv=minus(delta(k),delta(i));
   const linear=(dot(n,cross(du,ac))+dot(n,cross(ab,dv)))/area,quadratic=dot(n,cross(du,dv))/area;
   const low=quadratic>0?clamp(-linear/(2*quadratic),0,gain):gain;
   const ratio=x=>1+linear*x+quadratic*x*x;
   if(ratio(low)>=.4)continue;
   let l=0,h=low;for(let step=0;step<14;step++){const x=(l+h)/2;if(ratio(x)>=.4)l=x;else h=x;}gain=l;
 }
 if(gain<1)for(const {i}of active)if(shifted[i]!==v[i])shifted[i]={...v[i],p:v[i].p.map((x,k)=>x+gain*(shifted[i].p[k]-x))};
 rotateNormals50(v,shifted,localFaces,1);
 let minProjected=1;
 for(const t of localFaces){
   const n=faceNormal(v,t),area=dot(n,n);if(area>=1e-16)minProjected=Math.min(minProjected,dot(n,faceNormal(shifted,t))/area);
 }
 return {...posed,parts:posed.parts.map(m=>m===mesh?{...m,vertices:shifted,faces}:m.vertices===mesh.vertices?{...m,vertices:shifted}:m),
   fold54:{gain,minProjected,addedVertices:recipes.length,addedFaces:faces.length-mesh.faces.length}};
}
export function editChest54(study,edit,engine){
  if(!supportsChest54(study.id)||(!edit?.angle&&(!edit?.pose||edit.pose==='neutral')))return samePose(study,edit,engine);
  if(edit.pose==='waist'&&waistPreserved.has(study.id))return samePose(study,edit,engine);
  let bindings=null;
  const current=samePose(study,edit,engine,refs=>{bindings=refs;});
  const neutral=editChest53(study,{...edit,angle:0,pose:'neutral'},engine);
  const next=formAnteriorFold(neutral,shapeAxilla54(neutral,current));
  if(!bindings||next===current)return next;
  const parts=next.parts.filter(m=>m.mat!=='areola35'&&m.mat!=='papilla35');
  return {...next,parts:parts.concat(study.api.surfaceParts(bindings,parts[0]))};
}

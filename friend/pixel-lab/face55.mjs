const clamp=x=>Math.max(0,Math.min(1,x));
const ramp=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const mix=(a,b,w)=>a.map((n,k)=>n+w*(b[k]-n));
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const len=v=>Math.hypot(...v);
const unit=v=>{const n=len(v)||1;return v.map(x=>x/n);};
const face=(p,[a,b,c])=>cross(sub(p[b],p[a]),sub(p[c],p[a]));
const modes={local:{steps:3,strength:.48},wide:{steps:8,strength:.88},arch:{steps:5,strength:.70},
  surface:{steps:5,strength:.70,raw:true},tangent:{steps:9,strength:.85,raw:true,normals:.52},
  tangentEar:{steps:9,strength:.85,raw:true,normals:.52,ear:true}};
export function earDistance55(p,chin,id){
 const z=id==='F02'?.163:.153;
 return Math.hypot((p[1]-chin-.408)/.159,(p[2]-z)/.124);
}
export function region55(p,chin){
 const a=Math.abs(p[0]),h=p[1]-chin,z=p[2];
 const lateral=ramp(.175,.30,a),vertical=ramp(.22,.34,h)*(1-ramp(.60,.72,h));
 return lateral*vertical*ramp(-.03,.085,z)*(1-ramp(.46,.58,z));
}
function areaGuard(original,trial,triangles){
 let p=trial;
 for(let pass=0;pass<24;pass++){
  const bad=new Set();
  for(const f of triangles){
   const n=face(original,f),m=face(p,f),d=dot(n,n);
   if(d>1e-17&&dot(n,m)<.08*d)for(const i of f)bad.add(i);
  }
  if(!bad.size)break;
  p=p.slice();for(const i of bad)p[i]=mix(original[i],p[i],.50);
 }
 return p;
}
function transport(vertices,positions,triangles){
 const old=vertices.map(v=>v.p),a=new Map(),b=new Map();
 for(const f of triangles){
  const before=face(old,f),after=face(positions,f);
  for(const i of f){
   if(!a.has(i)){a.set(i,[0,0,0]);b.set(i,[0,0,0]);}
   for(let k=0;k<3;k++){a.get(i)[k]+=before[k];b.get(i)[k]+=after[k];}
  }
 }
 return vertices.map((v,i)=>{
  const pos=positions[i];if(pos===v.p || pos.every((n,k)=>n===v.p[k]))return v;
  if(!a.has(i))return {...v,p:pos};
  const n=unit(a.get(i)),m=unit(b.get(i)),t=cross(n,m),c=dot(n,m);
  if(c<-.99999)return {...v,p:pos};
  const d=cross(t,v.n),e=cross(t,d);
  return {...v,p:pos,n:unit(v.n.map((x,k)=>x+d[k]+e[k]/(1+c)))};
 });
}
function arch(scene,reference,mode,id){
 const vs=scene.parts[0].vertices,base=vs.map(v=>v.p),rs=reference.parts[0].vertices.map(v=>v.p);
 const tri=scene.parts.filter(p=>p.vertices===vs&&p.name==='portrait-skin34').flatMap(p=>p.faces);
 const ns=new Map();for(const f of tri)for(let k=0;k<3;k++){const i=f[k];if(!ns.has(i))ns.set(i,new Set());ns.get(i).add(f[(k+1)%3]);ns.get(i).add(f[(k+2)%3]);}
 const chin=scene.landmarks.chin[1],spec=modes[mode],w=base.map(p=>region55(p,chin)*(spec.ear?ramp(1,1.48,earDistance55(p,chin,id)):1));
 const delta=base.map((p,i)=>sub(p,rs[i])),initial=spec.raw?base:delta;let field=initial;
 for(let j=0;j<spec.steps;j++){
  const next=field.slice();
  for(const [i,neighbors] of ns){
   if(!w[i])continue;
   const avg=[0,0,0];let total=0;
   for(const n of neighbors){const g=1/Math.max(.008,len(sub(rs[i],rs[n])));total+=g;for(let k=0;k<3;k++)avg[k]+=g*field[n][k];}
   next[i]=mix(field[i],avg.map(x=>x/total),.63);
  }
  field=next;
 }
 const target=base.map((p,i)=>{
  if(!w[i])return p;
  const h=p[1]-chin,z=p[2],ridge=.438-.12*Math.max(0,z-.15);
  const support=mode==='arch'?.009*Math.exp(-(((h-ridge)/.069)**2))-.006*Math.exp(-(((h-.56)/.08)**2)):0;
  const v=p.map((x,k)=>x+w[i]*spec.strength*(field[i][k]-initial[i][k]));
  v[0]+=Math.sign(p[0])*support*w[i];return v;
 });
 let vs2=transport(vs,areaGuard(base,target,tri),tri);
 if(spec.normals){
  const pos=vs2.map(v=>v.p),sums=new Map();
  for(const t of tri){
   const n=face(pos,t);
   for(const i of t)if(w[i]){const a=sums.get(i)||[0,0,0],sign=dot(n,vs[i].n)<0?-1:1;
    sums.set(i,a.map((x,k)=>x+sign*n[k]));}
  }
  vs2=vs2.map((v,i)=>sums.has(i)?{...v,n:unit(mix(v.n,unit(sums.get(i)),w[i]*spec.normals))}:v);
 }
 return {...scene,parts:scene.parts.map(m=>m.vertices===vs?{...m,vertices:vs2}:m)};
}
export function lips55(scene,original,amount){
 if(!amount)return scene;
 const main=scene.parts[0].vertices,chin=scene.landmarks.chin[1],by=new Map();
 return {...scene,parts:scene.parts.map((m,j)=>{
  if(by.has(m.vertices))return {...m,vertices:by.get(m.vertices)};
  const lip=['upper-lip34','lower-lip34','mouth-line34'].includes(m.name);
  if(m.vertices!==main&&!lip)return m;
  const ref=original.parts[j].vertices;
  const vv=m.vertices.map((v,i)=>{
   const [x,y,z]=v.p,w=lip?amount:amount*(1-ramp(.093,.17,Math.abs(x)))*(1-ramp(.031,.074,Math.abs(y-chin-.181)))*ramp(.43,.58,z);
   if(!w)return v;return {...v,p:mix(v.p,ref[i].p,w),n:unit(mix(v.n,ref[i].n,w))};
  });by.set(m.vertices,vv);return {...m,vertices:vv};
 })};
}
// 두 입꼬리·입 중앙을 둘러싼 하나의 연속 변환. 피부, 윗입술, 아랫입술과 먹선이 같은 좌표장을 따른다.
export function moveMouth55(scene,{x=0,y=0,z=0,width=1,corner=0}={}){
 const mouth=scene.parts.find(m=>m.name==='mouth-line34'),points=mouth.vertices.map(v=>v.p);
 const center=points[0].map((_,k)=>points.reduce((n,p)=>n+p[k],0)/points.length),memo=new Map();
 const shift=p=>{
  const a=p[0]-center[0],h=p[1]-center[1];
  const w=(1-ramp(.118,.204,Math.abs(a)))*(1-ramp(.028,.095,Math.abs(h)))*ramp(.43,.58,p[2]);
  return w?[p[0]+w*(x+a*(width-1)),p[1]+w*(y+corner*Math.min(1,(a/.10)**2)),p[2]+z*w]:p;
 };
 return {...scene,parts:scene.parts.map(m=>{
  if(memo.has(m.vertices))return {...m,vertices:memo.get(m.vertices)};
  if(m.vertices!==scene.parts[0].vertices&&!['upper-lip34','lower-lip34','mouth-line34'].includes(m.name))return m;
  const vv=m.vertices.map(v=>{
   const p=shift(v.p);if(p===v.p)return v;
   const axes=v.p.map((_,k)=>{const a=v.p.slice(),b=v.p.slice();a[k]+=.0001;b[k]-=.0001;return sub(shift(a),shift(b)).map(x=>x/.0002);});
   const cof=axes.map((_,k)=>cross(axes[(k+1)%3],axes[(k+2)%3]));
   return {...v,p,n:unit(v.n.map((_,k)=>cof.reduce((t,q,j)=>t+q[k]*v.n[j],0)))};
  });
  memo.set(m.vertices,vv);return {...m,vertices:vv};
 })};
}
export function study55(scene54,id,base49,reference34,region='arch',lip=0){
 if(!['F02','M01'].includes(id))return scene54;
 if(region!=='none'&&!Object.hasOwn(modes,region))throw RangeError('안면 시험 부위가 다릅니다.');
 if(!Number.isFinite(lip)||lip<0||lip>1)throw RangeError('입술 복원 비율을 확인하세요.');
 return lips55(region==='none'?scene54:arch(scene54,reference34,region,id),base49,lip);
}
const settings55=Object.freeze({F02:{width:.80,y:-.008},M01:{width:1.12,corner:.022}});
const byInput=new WeakMap();
export function candidateFace55(scene54,id,base49,reference34,mode='study'){
 if(!Object.hasOwn(settings55,id)||mode==='source')return scene54;
 if(!['study','lateral','mouth'].includes(mode))throw RangeError('55차 얼굴 비교 방식을 확인하세요.');
 if(!base49||!reference34||base49.parts[0].vertices.length!==scene54.parts[0].vertices.length||
    reference34.parts[0].vertices.length!==scene54.parts[0].vertices.length)throw Error('같은 인물의 중립면과 34차 대응면이 필요합니다.');
 let saved=byInput.get(scene54);if(!saved){saved=new Map();byInput.set(scene54,saved);}
 let entries=saved.get(id);if(!entries||entries.reference!==reference34||entries.base!==base49){entries={reference:reference34,base:base49};saved.set(id,entries);}
 if(entries[mode])return entries[mode];
 if(!entries.lateral)entries.lateral=arch(scene54,reference34,'tangentEar',id);
 if(mode==='lateral')return entries.lateral;
 const base=mode==='mouth'?scene54:entries.lateral,trial=moveMouth55(base,settings55[id]),skin=base.parts[0].vertices,changed=trial.parts[0].vertices;
 const tris=base.parts.filter(m=>m.name==='portrait-skin34'&&m.vertices===skin).flatMap(m=>m.faces);
 const guarded=areaGuard(skin.map(v=>v.p),changed.map(v=>v.p),tris);
 const vertices=changed.map((v,i)=>guarded[i]===v.p?v:{...v,p:guarded[i]});
 entries[mode]={...trial,parts:trial.parts.map(m=>m.vertices===changed?{...m,vertices}:m)};
 return entries[mode];
}

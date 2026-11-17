// W 성인 연구 원형 전용. 위치는 중립 모델 단위, q는 가로 뿌리 반경, u는 위에서 아래로 가는 비율이다.
const cache=new WeakMap();
const sub=(a,b)=>a.map((n,i)=>n-b[i]);
const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const n=Math.hypot(...a)||1;return a.map(x=>x/n);};
const clamp=x=>Math.max(0,Math.min(1,x));
const ramp=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export const surfaceFit50=Object.freeze({restore:0.9568690913589671,q:-0.15227863126434388,qWidth:0.47436502821976323,u:0.7807307610148565,uWidth:0.09910820513661021,down:0.0218820692487061,project:-0.03321212809626013,tilt:-0.9059196109604088});
export const poseFit50=Object.freeze({smooth:0.4572667194670066,passes:3,width:0.10131675302982329,outer:1.0031284815818071,upper:0.18893529845634477,sharp:87});
function material(scene,i) {
 const [x,y,z]=scene.restSkin35[i].p;if(z<.015)return null;
 const sign=x<0?-1:1,f=scene.paperShape.frame(sign),q=(x-f.c)*sign/f.root;
 if(q<-.99||q>1.25)return null;
 const g=scene.paperShape.frame(sign,sign*Math.max(-.98,Math.min(.98,q))),u=(g.top-y)/(g.top-g.foot);
 if(u<-.15||u>1.10)return null;
 return {i,q,u,sign};
}
function prepare(ref){
 if(cache.has(ref.paperShape))return cache.get(ref.paperShape);
 const mesh=ref.parts[0],zones=[];
 for(let i=0;i<mesh.vertices.length;i++){const d=material(ref,i);if(d)zones.push(d);}
 const active=new Set(zones.map(p=>p.i)),faces=mesh.faces.filter(t=>t.some(i=>active.has(i)));
 const edges=new Map(zones.map(({i})=>[i,new Set()]));
 for(const t of faces)for(const i of t){if(!active.has(i))continue;for(const j of t)if(i!==j)edges.get(i).add(j);}
 const weighted=new Map(zones.map(({i})=>{
   const p=ref.restSkin35[i].p,adj=Array.from(edges.get(i),j=>({j,w:1/Math.max(.008,Math.hypot(...sub(p,ref.restSkin35[j].p)))}));
   const sum=adj.reduce((a,b)=>a+b.w,0)||1;return [i,adj.map(({j,w})=>[j,w/sum])];
 }));
 const paired=new Map();
 for(const t of faces){for(let k=0;k<3;k++){
   const i=t[k],j=t[(k+1)%3];if(!active.has(i)&&!active.has(j))continue;
   const key=Math.min(i,j)+'/'+Math.max(i,j),prev=paired.get(key);
   if(prev)prev.b=t;else paired.set(key,{i,j,a:t});
 }}
 const info={zones,faces,weighted,hinges:[...paired.values()].filter(p=>p.b)};cache.set(ref.paperShape,info);return info;
}
function transfer(src,vs,faces,amount=.92){
 const sum=new Map();
 for(const t of faces){
  if(t.every(i=>src[i]===vs[i]))continue;
  const face=p=>cross(sub(p[t[1]].p,p[t[0]].p),sub(p[t[2]].p,p[t[0]].p));const n=face(src),area=Math.hypot(...n);
  if(area<1e-9)continue;
  const a=unit(n),b=unit(face(vs)),axis=cross(a,b),cos=dot(a,b);if(cos<-.99)continue;
  for(const i of t){if(src[i]===vs[i])continue;
   const old=src[i].n,k1=cross(axis,old),k2=cross(axis,k1),r=sum.get(i)||[0,0,0];
   for(let k=0;k<3;k++)r[k]+=area*(old[k]+k1[k]+k2[k]/(1+cos));sum.set(i,r);}
 }
 for(const [i,r] of sum){const n=src[i].n,b=unit(r);vs[i]={...vs[i],n:unit(n.map((a,k)=>a+amount*(b[k]-a)))};}
}
const replace=(s,src,out)=>({...s,parts:s.parts.map(p=>p.vertices===src?{...p,vertices:out}:p)});
export function shapeBody50(scene,base40,reference49,mode='weighted',fit=surfaceFit50){
 if(!['base49','base40','surface','weighted'].includes(mode))throw RangeError('지원하지 않는 대조');
 if(mode==='base49'||!scene?.tissue34||scene.paperShape?.form?.id!=='W')return scene;
 if(mode==='base40'&&scene===reference49)return base40;
 const m=scene.parts[0],src=m.vertices,out=src.slice(),a=base40.parts[0].vertices,b=reference49.parts[0].vertices;
 if(a.length!==b.length||src.length!==a.length)throw RangeError('다른 정점 위상');
 const {zones,faces}=prepare(reference49);
 // 기준형으로 되돌리는 변위는 편집 전의 두 원형에서 읽는다.
 const t=mode==='base40'?1:fit.restore;
 for(let i=0;i<src.length;i++){
  const dp=sub(a[i].p,b[i].p),dn=sub(a[i].n,b[i].n);
  if(Math.hypot(...dp,...dn)<1e-11)continue;
  out[i]={...src[i],p:src[i].p.map((x,k)=>x+t*dp[k]),n:unit(src[i].n.map((x,k)=>x+t*dn[k]))};
 }
 if(mode==='base40')return replace(scene,src,out);
 const moved=out.slice(),scale=scene.paperShape.scale;
 for(const {i,q,u} of zones){
   if(u<.51||u>.984||Math.abs(q)>.89)continue;
   const end=ramp(.51,.68,u)*(1-ramp(.91,.984,u))*(1-ramp(.65,.89,Math.abs(q)));
   const w=end*Math.exp(-.5*(((q-fit.q)/fit.qWidth)**2+((u-fit.u)/fit.uWidth)**2));
   if(w<1e-5)continue;
   const old=out[i],p=old.p.slice();
   // 아래로 돌아가는 구간을 넓히고, 전방 이동은 중심 높이 앞뒤에서 부호를 바꾼다.
   p[1]-=scale*fit.down*w;
   p[2]+=scale*fit.project*w*(1+fit.tilt*(fit.u-u)/fit.uWidth);
   moved[i]={...old,p};
 }
 transfer(out,moved,faces);
 return replace(scene,src,moved);
}
export function poseBody50(neutral,posed,mode='weighted',fit=poseFit50){
 if(mode!=='weighted'||neutral===posed||!neutral?.tissue34||!neutral.paperShape||!neutral.restSkin35)return posed;
 const {zones,weighted,faces,hinges}=prepare(neutral),src=posed.parts[0].vertices,rest=neutral.parts[0].vertices;
 const sharpness=new Map();
 if(fit.sharp){
   const face=(vs,t)=>unit(cross(sub(vs[t[1]].p,vs[t[0]].p),sub(vs[t[2]].p,vs[t[0]].p)));
   const angle=(vs,a,b)=>Math.acos(Math.max(-1,Math.min(1,dot(face(vs,a),face(vs,b)))))*180/Math.PI;
   for(const {i,j,a,b} of hinges){
     const delta=Math.abs(angle(src,a,b)-angle(rest,a,b));
     for(const k of [i,j])sharpness.set(k,Math.max(sharpness.get(k)||0,delta));
   }
 }
 const entries=zones.map(d=>{
   const {q,u}=d;
   const w=Math.exp(-.5*(((q-fit.outer)/fit.width)**2+((u-fit.upper)/.34)**2))*ramp(.43,.60,q)*(1-ramp(1,1.21,q))*ramp(-.08,.12,u)*(1-ramp(.86,1.015,u));
   const high=fit.sharp?ramp(fit.sharp,fit.sharp+30,sharpness.get(d.i)||0):1;
   return {...d,w:fit.smooth*w*high};
 }).filter(d=>d.w>.001);
 let shifts=new Map();
 function offset(i){return shifts.get(i)||sub(src[i].p,rest[i].p);}
 for(let step=0;step<fit.passes;step++){
  const next=new Map();
  for(const {i,w} of entries){
    const d=offset(i),av=[0,0,0];
    for(const [j,weight] of weighted.get(i)){const e=offset(j);for(let k=0;k<3;k++)av[k]+=e[k]*weight;}
    next.set(i,d.map((x,k)=>x+w*(av[k]-x)));
  }
  shifts=next;
 }
 const out=src.slice();
 for(const [i,d] of shifts){const p=rest[i].p.map((x,k)=>x+d[k]);if(Math.hypot(...sub(p,src[i].p))>1e-8)out[i]={...src[i],p};}
 transfer(src,out,faces);
 return replace(posed,src,out);
}
export {material as material50,transfer as rotateNormals50};

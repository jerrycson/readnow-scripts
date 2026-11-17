// 접지 자세의 무릎에만 연속 피부를 잇는다. 골반·허벅지 상부·종아리 하부·발은 원래 표면을 쓴다.
const add=(a,b)=>a.map((v,k)=>v+b[k]);
const sub=(a,b)=>a.map((v,k)=>v-b[k]);
const mul=(a,w)=>a.map(v=>v*w);
const dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>mul(a,1/(Math.hypot(...a)||1));
const lerp=(a,b,t)=>a.map((v,k)=>v+(b[k]-v)*t);
const mean=a=>a.reduce((s,p)=>add(s,mul(p,1/a.length)),[0,0,0]);
const smooth=t=>t*t*(3-2*t);
const cache=new WeakMap();
function grid(mesh){
 const adult=mesh.vertices.length===627,cute=mesh.vertices.length===50;
 if(!adult&&!cute)return null;
 const n=adult?24:12,step=adult?25:12,rows=(mesh.vertices.length-2)/step;
 return {n,step,rows,ring:(r)=>Array.from({length:n},(_,i)=>r*step+i)};
}
function selectRow(mesh,grid,cy,offset){
 let best=1,bestError=Infinity;
 for(let j=1;j<grid.rows-1;j++){
  const y=mean(grid.ring(j).map(i=>mesh.vertices[i].p))[1],e=Math.abs(y-cy-offset);
  if(e<bestError){best=j;bestError=e;}
 }return best;
}
function source(rest,side,span,bulge){
 const map=rest.parts,sg=side?1:-1;
 const find=name=>map.findIndex(m=>m.name===name&&Math.sign(mean(m.vertices.map(v=>v.p))[0])===sg);
 const thighId=find('thigh'),calfId=find('calf'),kneeId=find('knee');
 if([thighId,calfId,kneeId].some(i=>i<0))return null;
 const thigh=map[thighId],calf=map[calfId],ball=map[kneeId],u=grid(thigh),v=grid(calf);
 if(!u||!v||u.n!==v.n)return null;
 const c=rest.joints[side?'right':'left'].knee;
 const ext=k=>Math.max(...ball.vertices.map(p=>p.p[k]))-Math.min(...ball.vertices.map(p=>p.p[k]));
 const rx=ext(0)/2,rz=ext(2)/2;
 const top=selectRow(thigh,u,c[1],span*rz),bot=selectRow(calf,v,c[1],-span*rz);
 const topIds=u.ring(top),bottomIds=v.ring(bot);
 const tp=topIds.map(i=>thigh.vertices[i].p),bp=bottomIds.map(i=>calf.vertices[i].p),tc=mean(tp),bc=mean(bp);
 let order=null,best=Infinity;
 for(const sign of [-1,1])for(let shift=0;shift<v.n;shift++){
  const test=tp.map((_,i)=>(v.n*2+shift+sign*i)%v.n);
  const err=tp.reduce((s,p,i)=>s+Math.hypot(...sub(unit(sub(p,tc)),unit(sub(bp[test[i]],bc)))),0);
  if(err<best){best=err;order=test;}
 }
 const low=order.map(i=>bottomIds[i]),rows=10,ring=u.n,points=[];
 for(let j=0;j<=rows;j++)for(let i=0;i<ring;i++){
  const t=j/rows,a=tp[i],b=calf.vertices[low[i]].p;
  const pa=thigh.vertices[topIds[i]-u.step].p,pb=calf.vertices[low[i]+v.step].p;
  const len=Math.hypot(...sub(a,b)),da=mul(unit(sub(a,pa)),len),db=mul(unit(sub(pb,b)),len);
  const at=lerp(a,b,smooth(t)).map((x,k)=>x+t*(1-t)*((1-t)*da[k]-t*db[k]));
  const radial=[at[0]-c[0],0,at[2]-c[2]],r=Math.hypot(...radial),direction=unit(radial);
  const desired=1/Math.hypot(direction[0]/rx,direction[2]/rz);
  const gain=bulge*Math.sin(Math.PI*t)**2*(direction[2]<0?.5:1);
  points.push(add(at,mul(direction,(desired-r)*gain)));
 }
 const faces=[];
 for(let row=0;row<rows;row++)for(let i=0;i<ring;i++){
  const a=row*ring+i,b=row*ring+(i+1)%ring,c=a+ring,d=b+ring;
  faces.push([a,c,b],[b,c,d]);
 }
 const tn=(t,ps)=>cross(sub(ps[t[1]],ps[t[0]]),sub(ps[t[2]],ps[t[0]]));
 const radial=sub(points[0],tc);
 if(dot(tn(faces[0],points),radial)<0)for(const f of faces)f.reverse();
 const topFaces=thigh.faces.filter(f=>f.every(i=>i<(top+1)*u.step||i===thigh.vertices.length-2));
 const bottomFaces=calf.faces.filter(f=>f.every(i=>i>=bot*v.step&&i!==calf.vertices.length-2));
 return {thighId,calfId,kneeId,points,rows,ring,faces,topIds,low,topFaces,bottomFaces};
}
// 5개 체형 모두에서 정해 둔 20개 화면을 통과한 기본체만 같은 표면을 쓴다.
export function supportsKneeSurface55(rest){
 const shape=rest?.proportions;
 return !!shape&&!shape.cute&&(shape.f?shape.n===6:[5,7,8].includes(shape.n));
}
export function applyKneeSurface55(rest,posed,rig,{span=1.35,bulge=.68,force=false}={}){
 if(!rest||!posed||!rig||rig.neutral||posed.kneeSurface55)return posed;
 if(!force&&!supportsKneeSurface55(rest))return posed;
 let plans=cache.get(rest);if(!plans){plans=new Map();cache.set(rest,plans);}
 const key=span+'/'+bulge;
 if(!plans.has(key))plans.set(key,[0,1].map(side=>source(rest,side,span,bulge)));
 const pair=plans.get(key);if(pair.some(p=>!p))return posed;
 const parts=posed.parts.slice();
 for(const [side,p]of pair.entries()){
  const thigh=parts[p.thighId],calf=parts[p.calfId],knee=parts[p.kneeId];
  const positions=p.points.map(x=>rig.transform(x,'knee',side)),normals=positions.map(()=>[0,0,0]);
  for(let i=0;i<p.ring;i++){
   positions[i]=thigh.vertices[p.topIds[i]].p;
   positions[p.rows*p.ring+i]=calf.vertices[p.low[i]].p;
  }
  for(const [a,b,c]of p.faces){
   const n=cross(sub(positions[b],positions[a]),sub(positions[c],positions[a]));
   for(const i of [a,b,c])normals[i]=add(normals[i],n);
  }
  const vertices=positions.map((pos,i)=>({p:pos,n:unit(normals[i])}));
  for(let i=0;i<p.ring;i++){
   vertices[i]=thigh.vertices[p.topIds[i]];
   vertices[p.rows*p.ring+i]=calf.vertices[p.low[i]];
  }
  parts[p.thighId]={...thigh,faces:p.topFaces};
  parts[p.calfId]={...calf,faces:p.bottomFaces};
  parts[p.kneeId]={...knee,faces:p.faces,vertices};
 }
 return {...posed,parts,kneeSurface55:true};
}

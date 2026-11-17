const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const mix=(a,b,t)=>a.map((v,k)=>v+(b[k]-v)*t);
const unit=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];

const cache=new WeakMap();
export const supportModes53=Object.freeze({local:{radius:.055,mask:0},broad:{radius:.105,mask:0},features:{radius:.105,mask:.78},gentle:{radius:.145,mask:.52}});
function samples(base,reference){
 const V=base.parts[0].vertices,Q=reference.parts[0].vertices,chin=reference.landmarks.chin[1],vox=new Map();
 for(let i=0;i<Q.length;i++){
  const q=Q[i].p,p=V[i].p;
  if(q[1]<chin-.24||q[1]>chin+.92||q[2]<-.18||Math.abs(q[0])>.57)continue;
  const key=q.map(x=>Math.floor(x/.032)).join('/'),v=vox.get(key)??{q:[0,0,0],d:[0,0,0],n:0};
  for(let k=0;k<3;k++){v.q[k]+=q[k];v.d[k]+=p[k]-q[k];}v.n++;vox.set(key,v);
 }
 return [...vox.values()].map(v=>({q:v.q.map(x=>x/v.n),d:v.d.map(x=>x/v.n)}));
}
function fieldAt(points,radius){
 const width=radius*2,grid=new Map(),cell=p=>p.map(x=>Math.floor(x/width));
 for(const v of points){const key=cell(v.q).join('/');if(!grid.has(key))grid.set(key,[]);grid.get(key).push(v);}
 return q=>{
  const c=cell(q),m=[0,0,0],d=[0,0,0],g=[[0,0,0],[0,0,0],[0,0,0]],r2=radius*radius;let w=0;
  for(let x=c[0]-2;x<=c[0]+2;x++)for(let y=c[1]-2;y<=c[1]+2;y++)for(let z=c[2]-2;z<=c[2]+2;z++){
   const bucket=grid.get(x+'/'+y+'/'+z);if(!bucket)continue;
   for(const v of bucket){const dx=v.q[0]-q[0],dy=v.q[1]-q[1],dz=v.q[2]-q[2],dist=dx*dx+dy*dy+dz*dz;if(dist>9*r2)continue;
    const h=Math.exp(-dist/(2*r2)),u=[dx,dy,dz];w+=h;
    for(let k=0;k<3;k++){m[k]+=u[k]*h;d[k]+=v.d[k]*h;for(let j=0;j<3;j++)g[k][j]+=u[k]*v.d[j]*h;}
   }
  }
  if(w<1e-12)return {p:q,n:n=>n};
  for(let k=0;k<3;k++){m[k]/=w;d[k]/=w;}
  for(let k=0;k<3;k++)for(let j=0;j<3;j++)g[k][j]=(g[k][j]/w-m[k]*d[j])/r2+(k===j?1:0);
  const cof=[cross(g[1],g[2]),cross(g[2],g[0]),cross(g[0],g[1])];
  return {p:q.map((v,k)=>v+d[k]),n:n=>unit([0,1,2].map(k=>cof.reduce((s,a,j)=>s+a[k]*n[j],0)))};
 };
}
function facialSurface(q,id){
 const x=q[0],a=Math.abs(x),h=q[1],female=id==='F02',bell=(x,c,w)=>Math.exp(-((x-c)**2)/(w*w));
 // 34차 얼굴의 눈껍질과 입술이 붙는 매개면. 같은 차이만 운반해 도막의 깊이는 보존한다.
 return .637-.71*x*x-6.9*x**4+.012*bell(a,.205,.103)*bell(h,.35,.10)+.016*bell(a,.15,.11)*bell(h,.59,.075)
 -.022*bell(a,.165,.105)*bell(h,.475,.076)+(female?.064:.079)*bell(x,0,.052)*bell(h,.405,.133)
 +(female?.078:.091)*bell(x,0,.067)*bell(h,.301,.051)+.018*bell(a,.052,.025)*bell(h,.277,.025)
 +.022*bell(x,0,.104)*bell(h,.192,.028)+.019*bell(x,0,.095)*bell(h,.147,.030)+.025*bell(x,0,.14)*bell(h,.057,.050)
 -.013*bell(x,0,.087)*bell(h,.246,.026)-.016*bell(x,0,.10)*bell(h,.108,.026);
}
const remapped=/^(eye34|lid34|lower-lid34|brow34|upper-lip34|lower-lip34|mouth-line34|alar-crease34)$/;
export function candidateSupport53(base,id,reference,mode='features'){
 if(!['F02','M01'].includes(id)||mode==='base')return base;
 const settings=supportModes53[mode];if(!settings)throw RangeError('53차 얼굴 대조 방식을 확인하세요.');
 if(!reference||reference.parts[0].vertices.length!==base.parts[0].vertices.length)throw Error('동일 34차 얼굴 원형이 필요합니다.');
 let cached=cache.get(base);if(!cached){cached=new WeakMap();cache.set(base,cached);}
 if(!cached.has(reference))cached.set(reference,new Map());const modes=cached.get(reference),key=id+"/"+mode;if(modes.has(key))return modes.get(key);
 const chin=reference.landmarks.chin[1],field=fieldAt(samples(base,reference),settings.radius),skin=base.parts[0].vertices,seen=new Map();
 const parts=base.parts.map((m,i)=>{
  const ref=reference.parts[i];if(!ref||ref.vertices.length!==m.vertices.length||ref.name!==m.name)throw Error('얼굴 파츠의 원형 대응이 달라졌습니다.');
  if(seen.has(m.vertices))return {...m,vertices:seen.get(m.vertices)};
  const verts=m.vertices.map((old,j)=>{
   const q=ref.vertices[j],h=q.p[1]-chin;
   const weight=smooth(-.17,-.046,h)*(1-smooth(.67,.92,h))*smooth(.012,.225,q.p[2]);
   if(!weight)return old;
   let F=field(q.p),pt=F.p;
   if(settings.mask&&m.vertices!==skin&&remapped.test(m.name)){
    const e=settings.mask,xy=mix(pt,old.p,e),u=q.p[0]+xy[0]-pt[0],v=h+xy[1]-pt[1];
    const dz=facialSurface([u,v],id)-facialSurface([q.p[0],h],id);
    const adjusted=field([u,chin+v,q.p[2]+dz]);pt=[xy[0],xy[1],adjusted.p[2]];F=adjusted;
   }
   return {...old,p:mix(old.p,pt,weight),n:unit(mix(old.n,F.n(q.n),weight))};
  });
  seen.set(m.vertices,verts);return {...m,vertices:verts};
 });
 const result={...base,parts};modes.set(key,result);return result;
}


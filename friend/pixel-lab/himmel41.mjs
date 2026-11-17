const allowed=new Set(['eye34','lid34','lower-lid34','brow34']);
const cache=new WeakMap();
function prepare(sc){
 if(cache.has(sc))return cache.get(sc);
 const chin=sc.landmarks.chin[1],size=300,columns=256,xmin=-.38,ymin=chin+.28,step=.76/(size-1);
 const depth=new Float64Array(size*columns).fill(-Infinity),skin=sc.parts[0].vertices;
 for(const m of sc.parts){
  if(m.vertices!==skin&&m.name!=='cheek-orbit34')continue;
  for(const f of m.faces){
   const p=f.map(i=>m.vertices[i].p);
   if(p.some(v=>v[2]<.27)||p.every(v=>v[1]<ymin)||p.every(v=>v[1]>ymin+step*columns))continue;
   const a=p[0],b=p[1],c=p[2],u=b.map((v,i)=>v-a[i]),v=c.map((x,i)=>x-a[i]),den=u[0]*v[1]-v[0]*u[1];if(Math.abs(den)<1e-10)continue;
   const x0=Math.max(0,Math.ceil((Math.min(a[0],b[0],c[0])-xmin)/step)),x1=Math.min(size-1,Math.floor((Math.max(a[0],b[0],c[0])-xmin)/step));
   const y0=Math.max(0,Math.ceil((Math.min(a[1],b[1],c[1])-ymin)/step)),y1=Math.min(columns-1,Math.floor((Math.max(a[1],b[1],c[1])-ymin)/step));
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const dx=xmin+x*step-a[0],dy=ymin+y*step-a[1],r=(dx*v[1]-dy*v[0])/den,s=(u[0]*dy-u[1]*dx)/den;
    if(r<0||s<0||r+s>1)continue;
    const z=a[2]+r*u[2]+s*v[2],i=y*size+x;if(z>depth[i])depth[i]=z;
   }
  }
 }
 const sampler=field=>(x,y)=>{
  const xx=(x-xmin)/step,yy=(y-ymin)/step,i=Math.floor(xx),j=Math.floor(yy),sx=xx-i,sy=yy-j;
  if(i<0||i>=size-1||j<0||j>=columns-1)return NaN;
  const k=j*size+i;return (1-sx)*(1-sy)*field[k]+sx*(1-sy)*field[k+1]+(1-sx)*sy*field[k+size]+sx*sy*field[k+size+1];
 };
 const kernel=Array.from({length:17},(_,i)=>Math.exp(-.5*((i-8)/3.5)**2));
 const blurred=(src,axis)=>{
  const dest=new Float64Array(src.length).fill(NaN);
  for(let y=0;y<columns;y++)for(let x=0;x<size;x++){
   let sum=0,n=0;
   for(let t=-8;t<=8;t++){const xx=axis?x:x+t,yy=axis?y+t:y;if(xx<0||yy<0||xx>=size||yy>=columns)continue;
    const z=src[yy*size+xx];if(Number.isFinite(z)){sum+=kernel[t+8]*z;n+=kernel[t+8];}}
   if(n)dest[y*size+x]=sum/n;
  }return dest;
 };
 const sample=sampler(depth),smoothSample=sampler(blurred(blurred(depth,0),1));
 const centers=[...new Set(sc.parts.filter(m=>m.name==='eye34').map(m=>m.vertices))].map(v=>[0,1].map(k=>v.reduce((s,p)=>s+p.p[k],0)/v.length)).sort((a,b)=>a[0]-b[0]);
 const result={sample,smoothSample,centers};cache.set(sc,result);return result;
}
const unit=a=>{const d=Math.hypot(...a);return a.map(x=>x/(d||1));};
export function orbitalTrial41(sc,id,p){
 if(id!=='M01'||!p)return sc;
 const {sample:raw,smoothSample,centers}=prepare(sc),sample=p.smooth?smoothSample:raw,shared=new Map();
 const parts=sc.parts.map(m=>{
  if(!allowed.has(m.name))return m;
  if(!shared.has(m.vertices)){
   const side=Math.sign(m.vertices.reduce((s,v)=>s+v.p[0],0)),c=centers[side>0?1:0],brow=m.name==='brow34';
   const project=([x,y,z])=>{
    const t=side*(x-c[0]),h=y-c[1],u=Math.min(1,Math.max(0,(-t-.006)/.092)),medial=brow?0:u*u*(3-2*u);
    const xx=c[0]+side*(t*(brow?(p.browWidth??1):(p.width??1))+(p.shift||0)-medial*(p.medialSpan||0));
    const yy=c[1]+h*(brow?1:(p.open??1))+(brow?(p.browLift||0):(p.lift||0))+t*((p.tilt||0)+side*(p.symmetry||0))+medial*(p.medialLift||0);
    const oldZ=sample(x,y),newZ=sample(xx,yy);if(!Number.isFinite(oldZ+newZ))return [x,y,z];
    return [xx,yy,z+(newZ-oldZ)+(p.cushion||0)*Math.exp(-.5*(t/.084)**2-.5*(h/.055)**2)];
   };
   shared.set(m.vertices,m.vertices.map(v=>{
    const p=project(v.p),d=.00013,cols=[0,1].map(k=>{const a=v.p.slice(),b=v.p.slice();a[k]-=d;b[k]+=d;const l=project(a),r=project(b);return r.map((x,i)=>(x-l[i])/(2*d));});
    const [a,b]=cols,det=a[0]*b[1]-a[1]*b[0],n=v.n;
    return {...v,p,n:unit([b[1]*n[0]-a[1]*n[1]+(a[1]*b[2]-a[2]*b[1])*n[2],-b[0]*n[0]+a[0]*n[1]+(a[2]*b[0]-a[0]*b[2])*n[2],det*n[2]])};
   }));
  }
  return {...m,vertices:shared.get(m.vertices)};
 });
 return {...sc,parts};
}
// 1~4번의 가시 폭·열린 높이·중심·기울기 평균이 모두 악화하지 않고 4번 먼 눈 폭 차가
// 1픽셀 이하인 시안 중 먼 윗선 높이차 오차가 가장 작은 값. 공식 장면 두 컷은 선택에서 제외.
const selected={smooth:true,width:.963,open:1.117,tilt:.034,symmetry:-.145,lift:-.01,shift:.005,cushion:.005,medialSpan:-.004,medialLift:.015};
export function himmel41(sc,id){return orbitalTrial41(sc,id,selected);}
// 두 신규 장면과 간격을 본 후 추가 돌출 항만 제거한 후속 대조. 초기 후보와 구분한다.
export function himmel41Contact(sc,id){return orbitalTrial41(sc,id,{...selected,cushion:0});}
export function eyeClearance41(sc,candidate){
 const {sample}=prepare(sc),counts=[];
 for(let i=0;i<sc.parts.length;i++){
  const m=sc.parts[i];if(m.name!=='eye34'||m.mat!=='iris34')continue;
  const a=m.vertices,b=candidate.parts[i].vertices;
  for(let j=0;j<a.length;j++){const x=a[j].p,y=b[j].p,first=x[2]-sample(x[0],x[1]),second=y[2]-sample(y[0],y[1]);if(Number.isFinite(first+second))counts.push([first,second]);}
 }
 const pct=(a,p)=>a.slice().sort((x,y)=>x-y)[Math.floor((a.length-1)*p)];
 return [0,1].map(k=>{const a=counts.map(v=>v[k]);return {n:a.length,p05:pct(a,.05),median:pct(a,.5),p95:pct(a,.95),under:a.filter(x=>x<0).length};});
}

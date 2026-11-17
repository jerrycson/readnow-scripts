const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const normal=(p,q,r)=>cross(sub(q,p),sub(r,p));
// 각 삼각형의 34차 면 방향으로 투영한 면적을 살핀다. 양수였던 면만
// 원래 면적의 3% 이상으로 되돌리며, 바로 둘러싼 세 정점만 움직인다.
export function protectFaces54(base,trial,reference){
 const raw=base.parts[0].vertices,current=trial.parts[0].vertices,old=reference.parts[0].vertices;
 const p=current.map(v=>v.p.slice()),constraints=[];
 for(const m of base.parts.filter(q=>q.vertices===raw&&q.name==='portrait-skin34'))for(const f of m.faces){
  const n=normal(...f.map(i=>old[i].p)),length=Math.hypot(...n);if(length<1e-10)continue;
  const axis=n.map(x=>x/length),initial=dot(axis,normal(...f.map(i=>raw[i].p)));
  if(initial>1e-11)constraints.push({f,axis,limit:.03*initial});
 }
 for(let pass=0;pass<48;pass++){
  let greatest=0;
  for(const {f,axis,limit} of constraints){
   const a=p[f[0]],b=p[f[1]],c=p[f[2]],gap=limit-dot(axis,normal(a,b,c));
   if(gap<1e-13)continue;
   const gradient=[cross(sub(b,c),axis),cross(sub(c,a),axis),cross(sub(a,b),axis)];
   const denominator=gradient.reduce((s,g)=>s+dot(g,g),0);
   if(denominator<1e-16)continue;
   const gain=gap/denominator;
   for(let j=0;j<3;j++)for(let k=0;k<3;k++)p[f[j]][k]+=gain*gradient[j][k];
   greatest=Math.max(greatest,gap);
  }
  if(greatest<1e-12)break;
 }
 const vertices=current.map((v,i)=>p[i].every((x,k)=>x===v.p[k])?v:{...v,p:p[i]});
 return {...trial,parts:trial.parts.map(m=>m.vertices===current?{...m,vertices}:m)};
}

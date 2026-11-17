// 중립 표식을 원래 피부 삼각형 모서리에서 잘라 이웃 얼굴을 가로지르는 긴 현을 없앤다.
const cache=new WeakMap();
const bary=(p,a,b,c,den)=>{
  const u=((b[1]-c[1])*(p[0]-c[0])+(c[0]-b[0])*(p[1]-c[1]))/den;
  const v=((c[1]-a[1])*(p[0]-c[0])+(a[0]-c[0])*(p[1]-c[1]))/den;
  return [u,v,1-u-v];
};
const det=(a,b,c)=>(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
function clipped(poly,edge){
  const out=[];
  for(let j=0;j<poly.length;j++){
    const a=poly[j],b=poly[(j+1)%poly.length],ia=a.w[edge]>=-1e-9,ib=b.w[edge]>=-1e-9;
    if(ia)out.push(a);
    if(ia===ib)continue;
    const t=a.w[edge]/(a.w[edge]-b.w[edge]);
    out.push({p:a.p.map((v,k)=>v+t*(b.p[k]-v)),w:a.w.map((v,k)=>v+t*(b.w[k]-v))});
  }
  return out;
}
const area=points=>Math.abs(points.reduce((s,p,i)=>{const q=points[(i+1)%points.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2);
function surfacePatch(ref,skin){
  if(ref.component!=='areola')return ref;
  const xy=ref.points.map(q=>[0,1,2].map(k=>q.ids.reduce((s,id,i)=>s+q.weights[i]*skin.vertices[id].p[k],0)));
  const extent=(ps,k)=>[Math.min(...ps.map(v=>v[k])),Math.max(...ps.map(v=>v[k]))];
  const bx=extent(xy,0),by=extent(xy,1),bz=extent(xy,2),triangles=[];
  for(const ids of skin.faces){
    const vs=ids.map(i=>skin.vertices[i].p),x=extent(vs,0),y=extent(vs,1),z=extent(vs,2);
    if(x[1]<bx[0]||x[0]>bx[1]||y[1]<by[0]||y[0]>by[1]||z[1]<bz[0]-.03||z[0]>bz[1]+.03)continue;
    const den=det(...vs);
    if(Math.abs(den)>1e-10)triangles.push({ids,vs,den,x,y});
  }
  const points=ref.points.slice(),faces=[];
  const key=p=>Math.round(p[0]*1e8)+'/'+Math.round(p[1]*1e8);
  const used=new Map(xy.map((p,i)=>[key(p),i]));
  for(const base of ref.faces){
    const v=base.map(i=>xy[i]),den=det(...v),x=extent(v,0),y=extent(v,1),pieces=[];
    if(Math.abs(den)<1e-12){faces.push(base);continue;}
    let covered=0;
    for(const t of triangles){
      if(t.x[1]<x[0]||t.x[0]>x[1]||t.y[1]<y[0]||t.y[0]>y[1])continue;
      let poly=v.map(p=>({p,w:bary(p,...t.vs,t.den)}));
      for(let k=0;k<3&&poly.length;k++)poly=clipped(poly,k);
      if(poly.length<3)continue;
      const a=area(poly.map(q=>q.p));if(a<1e-12)continue;
      const gap=poly.reduce((s,q)=>s+Math.abs(q.p[2]-q.w.reduce((z,w,j)=>z+w*t.vs[j][2],0)),0)/poly.length;
      if(gap>.026)continue;
      pieces.push({t,poly});covered+=a;
    }
    // 여러 깊이의 피부가 겹치거나 한 피부가 가려진 곳은 기존 삼각형을 유지한다.
    if(Math.abs(covered-Math.abs(den)*.5)>Math.max(1e-10,2e-5*Math.abs(den))){faces.push(base);continue;}
    for(const {t,poly} of pieces){
      const ids=poly.map(({p,w})=>{
        const name=key(p);if(used.has(name))return used.get(name);
        const f=bary(p,...v,den);
        const i=points.push({ids:t.ids,weights:w,offset:f.reduce((s,a,k)=>s+a*ref.points[base[k]].offset,0)})-1;
        used.set(name,i);return i;
      });
      for(let j=1;j<ids.length-1;j++)if(new Set([ids[0],ids[j],ids[j+1]]).size===3)faces.push([ids[0],ids[j],ids[j+1]]);
    }
  }
  return {...ref,points,faces};
}
export function cutMaterial55(refs,skin){
  if(!refs?.length)return refs;
  let byMesh=cache.get(refs);
  if(!byMesh){byMesh=new WeakMap();cache.set(refs,byMesh);}
  if(!byMesh.has(skin.vertices))byMesh.set(skin.vertices,refs.map(p=>surfacePatch(p,skin)));
  return byMesh.get(skin.vertices);
}

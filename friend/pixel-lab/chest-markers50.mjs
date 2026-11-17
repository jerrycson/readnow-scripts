// 정점 사이의 긴 삼각형이 볼록한 피부를 통과할 때 원래 표식의 끝점과 돌출 높이를 보존해 중점을 피부에 되묶는다.
export function refineMarkerSkin50(bindings,surface,levels=1,keepBoundary=false,frontLimit=0){
 if(!bindings||levels===0)return bindings;
 const vs=surface.vertices,pos=point=>[0,1,2].map(k=>point.ids.reduce((s,i,j)=>s+vs[i].p[k]*point.weights[j],0));
 return bindings.map(patch=>{
  let points=patch.points.slice(),faces=patch.faces;const original=points.map(pos),xs=original.map(p=>p[0]),ys=original.map(p=>p[1]);
  const bounds=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)],triangles=[];
  for(const ids of surface.faces){
   const [a,b,c]=ids.map(i=>vs[i].p);if(Math.max(a[0],b[0],c[0])<bounds[0]||Math.min(a[0],b[0],c[0])>bounds[2]||Math.max(a[1],b[1],c[1])<bounds[1]||Math.min(a[1],b[1],c[1])>bounds[3])continue;
   const d=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(d)>1e-10)triangles.push({ids,a,b,c,d});
  }
  for(let n=0;n<levels;n++){
   const found=new Map(),next=[],count=new Map();const coordinates=points.map(pos);
   const facing=frontLimit?points.map(p=>p.ids.reduce((v,i,k)=>v+vs[i].n[2]*p.weights[k],0)):null;
   const edge=(i,j)=>Math.min(i,j)+'/'+Math.max(i,j);
   if(keepBoundary)for(const t of faces)for(let k=0;k<3;k++){const key=edge(t[k],t[(k+1)%3]);count.set(key,(count.get(key)||0)+1);}
   function midpoint(i,j){
    const key=edge(i,j);if(keepBoundary&&count.get(key)===1||facing&&Math.min(facing[i],facing[j])<frontLimit)return -1;if(found.has(key))return found.get(key);
    const [x,y,z]=coordinates[i].map((a,k)=>(a+coordinates[j][k])/2);
    let best=Infinity,binding=null;
    for(const {ids,a,b,c,d} of triangles){const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/d,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/d,w=1-u-v;
     if(Math.min(u,v,w)<-1e-7)continue;
     const distance=Math.abs(u*a[2]+v*b[2]+w*c[2]-z);
     if(distance<best){best=distance;binding={ids,weights:[u,v,w],offset:(points[i].offset+points[j].offset)/2};}
    }
    if(!binding)return -1;
    const index=points.push(binding)-1;found.set(key,index);return index;
   }
   for(const t of faces){
    const mid=t.map((i,k)=>midpoint(i,t[(k+1)%3])),n=mid.filter(i=>i>=0).length;
    if(!n){next.push(t);continue;}
    if(n===3){const [i,j,k]=t,[a,b,c]=mid;next.push([i,a,c],[j,b,a],[k,c,b],[a,b,c]);continue;}
    const k=n===1?mid.findIndex(i=>i>=0):(mid.indexOf(-1)+1)%3,i=t[k],j=t[(k+1)%3],l=t[(k+2)%3],a=mid[k],b=mid[(k+1)%3];
    if(n===1)next.push([i,a,l],[a,j,l]);else next.push([j,b,a],[i,a,b],[i,b,l]);
   }
   faces=next;
  }
  return {...patch,points,faces};
 });
}

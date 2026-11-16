export function orientedSkin(rest,posed,faces){
  const changed=posed.map((v,i)=>v!==rest[i]),acc=posed.map(()=>[0,0,0]);
  function cross(a,b,c){const u=b.map((v,k)=>v-a[k]),w=c.map((v,k)=>v-a[k]);return [u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];}
  for(const f of faces){
    if(!f.some(i=>changed[i]))continue;
    const r=f.map(i=>rest[i]),prior=cross(...r.map(v=>v.p)),n=cross(...f.map(i=>posed[i].p));
    const orient=prior.reduce((s,v,k)=>s+v*(r[0].n[k]+r[1].n[k]+r[2].n[k]),0)<0?-1:1;
    for(const i of f)if(changed[i])for(let k=0;k<3;k++)acc[i][k]+=orient*n[k];
  }
  return posed.map((v,i)=>{if(!changed[i])return v;const n=acc[i],d=Math.hypot(...n);return d>1e-9?{...v,n:n.map(c=>c/d)}:v;});
}

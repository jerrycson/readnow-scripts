// 기준 머리의 가로 단면을 삼각형과 절단 평면의 실제 교선으로 읽는다.
const ringCount=96,steps=180,start=.08,end=1.015,tau=2*Math.PI;
export function measureScalp52(mesh,chin,cx,cz){
  const radii=Array.from({length:ringCount},()=>new Float32Array(steps));
  for(const tri of mesh.faces){
    const p=tri.map(i=>mesh.vertices[i].p);
    const low=Math.min(...p.map(v=>v[1]))-chin,high=Math.max(...p.map(v=>v[1]))-chin;
    const j0=Math.max(0,Math.ceil((low-start)/(end-start)*(ringCount-1)));
    const j1=Math.min(ringCount-1,Math.floor((high-start)/(end-start)*(ringCount-1)));
    for(let j=j0;j<=j1;j++){
      const y=chin+start+(end-start)*j/(ringCount-1),edges=[];
      for(let k=0;k<3;k++){
        const a=p[k],b=p[(k+1)%3];
        if((a[1]>y)===(b[1]>y))continue;
        const t=(y-a[1])/(b[1]-a[1]);edges.push([a[0]+t*(b[0]-a[0])-cx,a[2]+t*(b[2]-a[2])-cz]);
      }
      if(edges.length!==2)continue;
      const [a,b]=edges,u=b[0]-a[0],v=b[1]-a[1];
      const angle=Math.atan2(a[0],a[1]),other=Math.atan2(b[0],b[1]),delta=Math.atan2(Math.sin(other-angle),Math.cos(other-angle));
      const first=Math.ceil(Math.min(angle,angle+delta)/tau*steps),last=Math.floor(Math.max(angle,angle+delta)/tau*steps);
      for(let i=first;i<=last;i++){
        const x=Math.sin(i*tau/steps),z=Math.cos(i*tau/steps),den=x*v-z*u;
        if(Math.abs(den)<1e-10)continue;
        const r=(a[0]*v-a[1]*u)/den,k=((i%steps)+steps)%steps;
        if(r>radii[j][k])radii[j][k]=r;
      }
    }
  }
  // 좁게 돌출된 귓바퀴도 성긴 머리 다각형 사이로 뚫지 않게 이웃 단면을 함께 덮는다.
  const cover=radii.map((row,j)=>Float32Array.from(row,(value,k)=>{
    let max=value;
    for(let v=Math.max(0,j-6);v<=Math.min(ringCount-1,j+6);v++)
      for(let u=-3;u<=3;u++)max=Math.max(max,radii[v][(steps+k+u)%steps]);
    return max;
  }));
  return function radius(x,y,z){
    const h=y-chin;if(h<start||h>end)return 0;
    const j=(h-start)/(end-start)*(ringCount-1),k=((Math.atan2(x-cx,z-cz)/tau+1)%1)*steps;
    const a=Math.floor(k)%steps,b=(a+1)%steps,f=k-Math.floor(k),lo=Math.floor(j),hi=Math.min(ringCount-1,lo+1);
    const r0=cover[lo][a]*(1-f)+cover[lo][b]*f,r1=cover[hi][a]*(1-f)+cover[hi][b]*f;
    return r0+(r1-r0)*(j-lo);
  };
}

const ramp=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function contour54(scene,params,quick=false){
 const chin=scene.landmarks.chin[1],memo=new Map();
 function warp(p){
  const [x,y,z]=p,h=y-chin,a=Math.abs(x);
  const low=ramp(-.20,-.035,h)*(1-ramp(.16,.36,h)),forward=ramp(.10,.44,z),mid=(1-ramp(.105,.32,a)),side=ramp(.035,.23,a);
  const weight=low*forward,center=mid*weight,edge=side*weight;
  return [x+Math.sign(x)*params[0]*edge+params[4]*center,
    y+params[1]*center+params[2]*edge,z+params[3]*center+params[5]*edge];
 }
 return {...scene,parts:scene.parts.map(m=>{
  if(memo.has(m.vertices))return {...m,vertices:memo.get(m.vertices)};
  const vertices=m.vertices.map(v=>{
   const p=warp(v.p);if(p.every((x,k)=>x===v.p[k]))return v;
   if(quick)return {...v,p};
   const d=[0,1,2].map(j=>{const a=[...v.p],b=[...v.p];a[j]+=.00005;b[j]-=.00005;const A=warp(a),B=warp(b);return A.map((x,k)=>(x-B[k])/.0001);});
   const cof=[cross(d[1],d[2]),cross(d[2],d[0]),cross(d[0],d[1])];
   const n=v.n.map((_,i)=>cof.reduce((s,column,j)=>s+column[i]*v.n[j],0)),l=Math.hypot(...n)||1;
   return {...v,p,n:n.map(x=>x/l)};
  });memo.set(m.vertices,vertices);return {...m,vertices};
 })};
}

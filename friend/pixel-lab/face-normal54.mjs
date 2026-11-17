const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const norm=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
export function plane54(scene,reference,strength=1){
 const original=scene.parts[0].vertices,target=reference.parts[0].vertices,chin=scene.landmarks.chin[1];
 const vertices=original.map((v,i)=>{
  const [x,y,z]=v.p,h=y-chin;
  const w=strength*smooth(-.13,-.04,h)*(1-smooth(.38,.53,h))*smooth(.10,.36,z)*(1-smooth(.38,.49,Math.abs(x)));
  if(!w)return v;
  return {...v,n:norm(v.n.map((q,j)=>q+(target[i].n[j]-q)*w))};
 });
 return {...scene,parts:scene.parts.map(p=>p.vertices===original?{...p,vertices}:p)};
}

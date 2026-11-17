const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}, bell=(x,c,s)=>Math.exp(-((x-c)**2)/(s*s));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const l=Math.hypot(...a)||1;return a.map(x=>x/l);};
export function contourSupport53(scene,params,eyeFence=false){
 const [width,lift,front]=params,chin=scene.landmarks.chin[1],memo=new Map();
 const eyes=scene.parts.filter(m=>m.name==='eye34');
 const eyeLow=eyeFence?Math.min(...eyes.flatMap(m=>m.vertices.map(v=>v.p[1]-chin))):1;
 function where(p){
  const [x,y,z]=p,h=y-chin,ax=Math.abs(x);
  const depth=smooth(.08,.31,z),lower=smooth(-.14,-.015,h)*(1-smooth(.38,.58,h));
  const side=(1-Math.exp(-((ax/.088)**2)))*Math.sign(x);
  const w=smooth(-.20,-.13,h)*side*(.80*bell(h,.18,.19)+.20*bell(h,.055,.11))*depth;
  const up=(.75+.25*(1-smooth(.44,.70,z)))*depth*lower;
  const protrude=smooth(.19,.50,z)*(1-smooth(.41,.56,h))*smooth(-.07,.06,h);
  const keep=eyeFence?1-smooth(eyeLow-.105,eyeLow-.015,h):1;
  return [x+width*w*keep,y+lift*up*keep,z+front*protrude*keep];
 }
 return {...scene,parts:scene.parts.map(m=>{
 if(memo.has(m.vertices))return {...m,vertices:memo.get(m.vertices)};
 const vs=m.vertices.map(v=>{const p=where(v.p);if(p.every((x,i)=>x===v.p[i]))return v;
 const d=[0,1,2].map(j=>{const q=v.p.slice();q[j]+=.00004;return where(q).map((a,k)=>(a-p[k])/.00004);});
 const cof=[cross(d[1],d[2]),cross(d[2],d[0]),cross(d[0],d[1])];
 return {...v,p,n:unit([0,1,2].map(k=>cof.reduce((a,n,j)=>a+n[k]*v.n[j],0)))};
 });memo.set(m.vertices,vs);return {...m,vertices:vs};})};
}






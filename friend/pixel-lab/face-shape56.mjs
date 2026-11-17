const clamp=t=>Math.max(0,Math.min(1,t));
const ramp=(a,b,t)=>{const v=clamp((t-a)/(b-a));return v*v*(3-2*v);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const lipParts=new Set(['upper-lip34','lower-lip34','mouth-line34']);
export function form56(scene,id,{kind='rest',opening=0,width=1,inset=0}={}){
 if(id!=='F02'||kind==='rest'||(!opening&&width===1))return scene;
 if(!['lower','arc','arcLocal','chinPad'].includes(kind)||!Number.isFinite(opening)||opening<0||opening>1||
  !Number.isFinite(width)||width<.60||width>1||!Number.isFinite(inset)||inset<0||inset>.085)throw RangeError('56차 얼굴 시안 범위를 확인하세요.');
 const chin=scene.landmarks.chin[1],skin=scene.parts[0].vertices,lip=scene.parts.find(p=>p.name==='mouth-line34');
 const mid=lip.vertices.reduce((a,v)=>a.map((x,k)=>x+v.p[k]/lip.vertices.length),[0,0,0]),cache=new Map();
 const theta=(kind==='lower'?0:10)*opening*Math.PI/180,co=Math.cos(theta),si=Math.sin(theta);
 function shift(p){
  const [x,y,z]=p,h=y-chin;
  const front=ramp(.12,.46,z),lower=(1-ramp(.08,.31,h))*ramp(-.17,-.045,h);
  let cheekAnchor=1;
  if(kind==='arcLocal')cheekAnchor=1-ramp(.085,.275,Math.abs(x))*ramp(.025,.14,h);
  if(kind==='chinPad')cheekAnchor=1-ramp(.115,.285,Math.abs(x));
  const core=front*lower*cheekAnchor,lipW=(1-ramp(.083,.175,Math.abs(x-mid[0])))*(1-ramp(.024,.082,Math.abs(y-mid[1])))*ramp(.47,.60,z);
  const corner=inset*front*lower*ramp(.075,.17,Math.abs(x))*(1-ramp(.29,.39,Math.abs(x)));
  if(!core&&!lipW&&!corner)return p;
  let dy=-.087*opening,dz=0;
  if(kind!=='lower'){
   const u=h-.37,v=z-.16;
   dy=(co-1)*u-si*v-.008*opening;
   dz=si*u+(co-1)*v+.015*opening;
  }
  // 피부·입선·두 입술이 같은 연속 공간장을 따른다. 눈과 치열 도형은 만들지 않는다.
  return [x-Math.sign(x)*corner+lipW*(x-mid[0])*(width-1),y+core*dy-.013*opening*lipW,z+core*dz];
 }
 function deform(v){
  const p=shift(v.p);if(p===v.p)return v;
  const col=v.p.map((n,k)=>{const a=v.p.slice(),b=v.p.slice();a[k]=n+.0001;b[k]=n-.0001;
   const u=shift(a),z=shift(b);return u.map((x,j)=>(x-z[j])/.0002);});
  const cof=col.map((_,k)=>cross(col[(k+1)%3],col[(k+2)%3]));
  const n=v.n.map((_,k)=>cof.reduce((d,a,j)=>d+a[k]*v.n[j],0)),l=Math.hypot(...n);
  return {...v,p,n:l?n.map(x=>x/l):v.n};
 }
 return {...scene,parts:scene.parts.map(m=>{
  if(m.vertices!==skin&&!lipParts.has(m.name))return m;
  if(!cache.has(m.vertices))cache.set(m.vertices,m.vertices.map(deform));
  return {...m,vertices:cache.get(m.vertices)};
 })};
}

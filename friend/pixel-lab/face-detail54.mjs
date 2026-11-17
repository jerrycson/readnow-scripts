const ramp=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const bump=(x,r)=>Math.abs(x)>=r?0:(1-(x/r)**2)**3;
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function detail54(scene,options={},quick=false){
 const {eyeY=0,eyeX=0,eyeWidth=1,eyeDepth=0,lipY=0,lipX=0,lipDepth=0,mouthWidth=1,noseY=0,noseDepth=0}=options;
 const chin=scene.landmarks.chin[1],eyes=scene.parts.filter(q=>q.name==='lid34').map(m=>{
  const vs=m.vertices.map(v=>v.p);return [0,1].map(i=>(Math.min(...vs.map(p=>p[i]))+Math.max(...vs.map(p=>p[i])))/2);
 });
 const mouth=scene.parts.find(q=>q.name==='mouth-line34'),lipCenter=mouth.vertices.reduce((n,v)=>n+v.p[1],0)/mouth.vertices.length;
 function transform(p){
  const[x,y,z]=p,h=y-chin,eye=eyes[x>=0?1:0],dx=x-eye[0],dy=y-eye[1],front=ramp(.27,.53,z);
  const orbital=(1-ramp(.115,.195,Math.abs(dx)))*(1-ramp(.065,.14,Math.abs(dy)))*front;
  const lips=(1-ramp(.100,.195,Math.abs(x)))*(1-ramp(.022,.09,Math.abs(y-lipCenter)))*front;
  const nose=bump(h-.31,.115)*bump(x,.112)*front;
  return [x+orbital*(Math.sign(x)*eyeX+dx*(eyeWidth-1))+lips*(x*(mouthWidth-1)+lipX),
    y+orbital*eyeY+lips*lipY+nose*noseY,z+orbital*eyeDepth+lips*lipDepth+nose*noseDepth];
 }
 const memo=new Map();
 return {...scene,parts:scene.parts.map(m=>{
  if(memo.has(m.vertices))return {...m,vertices:memo.get(m.vertices)};
  const vertices=m.vertices.map(v=>{
   const p=transform(v.p);if(p.every((x,k)=>x===v.p[k]))return v;
   if(quick)return {...v,p};
   const d=[0,1,2].map(j=>{const a=[...v.p],b=[...v.p];a[j]+=.00005;b[j]-=.00005;const A=transform(a),B=transform(b);return A.map((x,k)=>(x-B[k])/.0001);});
   const cof=[cross(d[1],d[2]),cross(d[2],d[0]),cross(d[0],d[1])],n=v.n.map((_,i)=>cof.reduce((sum,col,j)=>sum+col[i]*v.n[j],0));

   const len=Math.hypot(...n)||1;return {...v,p,n:n.map(x=>x/len)};
  });
  memo.set(m.vertices,vertices);return {...m,vertices};
 })};
}

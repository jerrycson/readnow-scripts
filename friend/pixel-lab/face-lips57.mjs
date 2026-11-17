const lipNames=new Set(['upper-lip34','lower-lip34','mouth-line34']);
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=x=>x>=1?0:(1-x*x)**2;
const unit=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
export const face57Options=Object.freeze({
 F02:Object.freeze({width:.46,smile:.006,support:.012,lift:.012,tilt:0,ink:.011,upper:.004,lower:.007,clearance:.0035,joined:true}),
 M01:Object.freeze({width:.82,smile:.006,support:.012,lift:.009,tilt:0,ink:.011,upper:.004,lower:.007,clearance:.0035,joined:true})
});
export function candidateFace57(scene,id,mode='source'){
 if(mode==='source'||!face57Options[id])return scene;
 if(mode!=='contact')throw new RangeError('57차 입술 시안을 확인하세요.');
 return shapeLip57(scene,id,face57Options[id]);
}

// 입 앞에 실제로 있는 피부 삼각형을 찾는다. 턱·치열·뒷머리는 국소 범위에 들어오지 않는다.
function lipSkin(vertices,faces,cx,cy,radius){
 const cells=new Map(),size=.025;
 for(const ids of faces){
  const [a,b,c]=ids.map(i=>vertices[i].p),xs=[a[0],b[0],c[0]],ys=[a[1],b[1],c[1]];
  const lo=Math.min(...xs),hi=Math.max(...xs),bot=Math.min(...ys),top=Math.max(...ys);
  if(hi<cx-radius||lo>cx+radius||top<cy-.10||bot>cy+.10||Math.max(a[2],b[2],c[2])<.48)continue;
  const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-12)continue;
  for(let x=Math.floor(lo/size);x<=Math.floor(hi/size);x++)for(let y=Math.floor(bot/size);y<=Math.floor(top/size);y++){
   const key=x+','+y;if(!cells.has(key))cells.set(key,[]);cells.get(key).push({a,b,c,den});
  }
 }
 return (x,y)=>{
  let front=-Infinity;
  for(const {a,b,c,den}of cells.get(Math.floor(x/size)+','+Math.floor(y/size))||[]){
   const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den;
   if(u>=0&&v>=0&&u+v<=1)front=Math.max(front,u*a[2]+v*b[2]+(1-u-v)*c[2]);
  }return front;
 };
}

// 사진·카메라를 입력으로 받지 않는 실제 기하 비교. source는 입력 객체를 돌려준다.
export function shapeLip57(scene,id,o){
 if(!['F02','M01'].includes(id)||!o)return scene;
 const lip=scene.parts.find(m=>m.name==='mouth-line34');
 if(!lip||lip.vertices.length!==215)return scene;
 const c=lip.vertices[107].p,L=lip.vertices[86].p,R=lip.vertices[128].p;
 const cx=(L[0]+R[0])/2,rx=Math.abs(R[0]-L[0])/2,cy=c[1];
 const skin=scene.parts[0].vertices,shared=scene.parts.filter(p=>p.vertices===skin);
 function dz(x,y,z){
  if(z<.51||!o.support)return 0;
  const u=(x-cx)/(rx*1.52),v=(y-cy)/.073;
  return -o.support*smooth(Math.abs(u))*smooth(Math.abs(v))*Math.min(1,(z-.51)/.07);
 }
 const vs=skin.map(q=>{
  const [x,y,z]=q.p,d=dz(x,y,z);if(!d)return q;
  const e=.0001,grad=[(dz(x+e,y,z)-dz(x-e,y,z))/(2*e),(dz(x,y+e,z)-dz(x,y-e,z))/(2*e)];
  return {...q,p:[x,y,z+d],n:unit([q.n[0]-grad[0]*q.n[2],q.n[1]-grad[1]*q.n[2],q.n[2]])};
 });
 const depth=lipSkin(vs,shared.flatMap(m=>m.faces),cx,cy,rx*1.8);
 const parts=scene.parts.map(part=>{
  if(part.vertices===skin)return {...part,vertices:vs};
  if(!lipNames.has(part.name))return part;
  const ink=part.name==='mouth-line34',upper=part.name==='upper-lip34',cols=ink?43:37;
  function surface(u,t){
   const arch=Math.max(0,1-u*u),taper=.10+.90*arch**.72;
   const x=cx+u*rx*o.width;
   const y0=cy+o.lift+u*(R[1]-L[1])*.5*o.tilt+o.smile*u*u;
   let y=y0;if(ink)y+=(t-.5)*o.ink*taper;
   else y+=(upper?1:-1)*taper*((o.joined?o.ink*.5:0)+t*(upper?o.upper:o.lower));
   const z=depth(x,y);if(!Number.isFinite(z))return null;
   const d=ink?o.clearance:mix(o.joined?o.clearance:.0026,.0007,t)+(o.joined?0:.002)*Math.sin(t*Math.PI)*arch;
   return [x,y,z+d];
  }
  const vertices=part.vertices.map((q,i)=>{
   const u=i%cols/(cols-1)*2-1,t=Math.floor(i/cols)/4;
   const mapped=surface(u,t);if(!mapped)return q;
   if(o.mode==='oldDepth'){
    // 실패 비교. 옛 깊이에 높이·폭만 교체해 피부와 입술이 교차하는 양을 본다.
    return {...q,p:[mapped[0],mapped[1],q.p[2]]};
   }
   const a=surface(u-.0005,t),b=surface(u+.0005,t),d=surface(u,t-.0005),e=surface(u,t+.0005);
   if(!a||!b||!d||!e)return {...q,p:mapped};
   const A=a.map((v,k)=>b[k]-v),B=d.map((v,k)=>e[k]-v);
   const n=unit([A[1]*B[2]-A[2]*B[1],A[2]*B[0]-A[0]*B[2],A[0]*B[1]-A[1]*B[0]]);
   return {...q,p:mapped,n:n[2]<0?n.map(v=>-v):n};
  });return {...part,vertices};
 });
 return {...scene,parts};
}

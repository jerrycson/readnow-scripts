// 38차 중립 피부 씬에 한 번만 적용한다. 좌표·삼각형·재질은 입력 씬과 공유한다.
export const jaw39Cases=Object.freeze({
 F02:Object.freeze({sideStart:57,sideEnd:92,radius:.08,status:'새 카메라 두 곳에서도 개선된 후보'}),
 M01:Object.freeze({sideStart:58,sideEnd:89,radius:.08,status:'뒤쪽 고각에서 악화한 수동 비교 후보'})
});
const smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
export function jaw39(scene38,id,model){
 if(!Object.hasOwn(jaw39Cases,id))return scene38;
 const {sideStart,sideEnd,radius}=jaw39Cases[id],cam=model.frame.side,chin=scene38.landmarks.chin[1];
 const original=scene38.parts[0].vertices,active=[];
 for(let i=0;i<original.length;i++){
  const [x,y,z]=original[i].p,h=y-chin,u=cam.x-(z-model.eyeDepth)*cam.scale;
  const weight=smooth(sideStart-15,sideStart+1,u)*(1-smooth(sideEnd+25,sideEnd+47,u))*
   smooth(-.16,-.06,h)*(1-smooth(.18,.28,h))*smooth(.01,.12,Math.abs(x));
  if(weight>0)active.push({i,weight,v:original[i]});
 }
 const vertices=original.slice(),variance=radius*radius;
 for(const {i,weight,v} of active){
  const sum=[0,0,0];
  for(const {v:q} of active){
   const x=v.p[0]-q.p[0],y=v.p[1]-q.p[1],z=v.p[2]-q.p[2],dist=x*x+y*y+z*z;
   if(dist>9*variance||v.n[0]*q.n[0]+v.n[1]*q.n[1]+v.n[2]*q.n[2]<-.25)continue;
   const w=Math.exp(-dist/(2*variance));
   for(let k=0;k<3;k++)sum[k]+=q.n[k]*w;
  }
  const length=Math.hypot(...sum);
  if(length<1e-10)continue;
  const n=v.n.map((c,k)=>(1-weight)*c+weight*sum[k]/length),norm=Math.hypot(...n);
  if(norm>1e-10)vertices[i]={...v,n:n.map(c=>c/norm)};
 }
 return {...scene38,parts:scene38.parts.map(p=>p.vertices===original?{...p,vertices}:p)};
}

import {orientedSkin} from './skin-normals35.mjs';
const ramp=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const normal=(a,b,c)=>{
 const u=b.map((v,k)=>v-a[k]),w=c.map((v,k)=>v-a[k]);
 return [u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];
};
function skinQuality(rest,changed,faces){
 const bad=new Set();let flipped=0,checked=0,minArea=Infinity,minCos=1;
 for(const tri of faces){
  if(!tri.some(i=>rest[i]!==changed[i]))continue;
  const a=normal(...tri.map(i=>rest[i].p)),b=normal(...tri.map(i=>changed[i].p));
  const n=Math.hypot(...a),m=Math.hypot(...b);
  if(n<1e-12)continue;
  const ratio=m/n,cos=m?a.reduce((s,x,k)=>s+x*b[k],0)/(m*n):0;
  if(cos<0)flipped++;
  if(cos<.20||ratio<.25)tri.forEach(i=>bad.add(i));
  checked++;minArea=Math.min(minArea,ratio);minCos=Math.min(minCos,cos);
 }
 return {bad,flipped,checked,minArea,minCos};
}
function bottomAt(curve,x){
 let y=-Infinity;
 for(let i=1;i<curve.length;i++){
  const a=curve[i-1],b=curve[i];
  if((a[0]-x)*(b[0]-x)>0)continue;
  if(a[0]===b[0]){y=Math.max(y,a[1],b[1]);continue;}
  const t=(x-a[0])/(b[0]-a[0]);y=Math.max(y,a[1]+t*(b[1]-a[1]));
 }
 return y;
}
// 측면의 한 열에서 피부 삼각형과 z=상수를 직접 교차한다. 턱밑이 목 쪽으로
// 다시 올라가면 한 행에 피부 경계가 둘이므로 행별 앞단을 뒤집는 방식은 쓸 수 없다.
export function underside(scene,model,ref){
 const cam=model.frame.side,chin=scene.landmarks.chin[1],skin=scene.parts[0].vertices;
 const verts=skin.map(v=>[cam.x-(v.p[2]-model.eyeDepth)*cam.scale,cam.y-(v.p[1]-chin)*cam.scale,v.p[0]]);
 const faces=scene.parts.filter(m=>m.vertices===skin).flatMap(m=>m.faces).filter(f=>f.every(i=>verts[i][1]>cam.y-35&&verts[i][1]<cam.y+32));
 const result=[];
 for(let x=Math.floor(ref.side.reduce((a,p)=>p[1]>a[1]?p:a)[0])-20;x<=Math.ceil(ref.side.at(-1)[0])+10;x+=.25){
  let y=-Infinity;
  for(const f of faces)for(let k=0;k<3;k++){
   const a=verts[f[k]],b=verts[f[(k+1)%3]];
   if(a[0]===b[0]||(a[0]-x)*(b[0]-x)>0)continue;
   const t=(x-a[0])/(b[0]-a[0]);
   if(Math.abs(a[2]+t*(b[2]-a[2]))<.38)y=Math.max(y,a[1]+t*(b[1]-a[1]));
  }
  if(Number.isFinite(y))result.push([x,y]);
 }
 return result;
}
// 원화 측면의 앞턱→밑턱 선과 현재 피부 -90도 투영의 밑선 사이 수직 차이.
// 관측된 구간 밖에서 변위는 부드럽게 0으로 돌아가고, 목·볼·입·다른 인물은 보존한다.
export function correctFernChin(scene,id,model,ref,strength=1){
 if(id!=='F02'||!strength)return scene;
 const cam=model.frame.side,chin=scene.landmarks.chin[1],actual=underside(scene,model,ref);
 const tip=ref.side.reduce((a,b)=>a[1]>b[1]?a:b);
 const last=ref.side.at(-1)[0],taperWidth=9,span=[];
 for(let x=Math.floor(tip[0])-15;x<=Math.ceil(last)+taperWidth;x+=.5){
  const source=bottomAt(actual,x),desired=bottomAt(ref.side,x);
  if(!Number.isFinite(source)||!Number.isFinite(desired))continue;
  span.push({x,y:source,d:Math.max(-9,Math.min(9,desired-source))});
 }
 if(!span.length)return scene;
 // 얇은 끝에서 높이가 급격히 바뀌므로 가장 바깥쪽 한 점의 노이즈는 2px 폭으로 평균한다.
 const filtered=span.map(s=>{
  let sum=0,w=0;
  for(const v of span){const d=Math.abs(v.x-s.x);if(d>2.5)continue;const weight=Math.exp(-d*d/2);sum+=weight*v.d;w+=weight;}
  return {...s,d:sum/w};
 });
 const first=filtered[0].x,end=filtered.at(-1).x;
 const body=scene.parts[0].vertices,faces=scene.parts.filter(m=>m.vertices===body).flatMap(m=>m.faces);
 const moved=body.map(v=>{
  const [x,y,z]=v.p,h=y-chin;
  if(h<-.12||h>.12||Math.abs(x)>=.37)return v;
  const u=cam.x-(z-model.eyeDepth)*cam.scale,sy=cam.y-h*cam.scale;
  if(u<=first-3||u>=end+9)return v;
  const k=Math.max(0,Math.min(filtered.length-1,(u-first)*2)),i=Math.floor(k),a=filtered[i],b=filtered[Math.min(i+1,filtered.length-1)],t=k-i;
  const boundary=a.y+(b.y-a.y)*t,amplitude=a.d+(b.d-a.d)*t;
  const w=ramp(first-3,first+2,u)*(1-ramp(end-2,end+9,u))*(1-ramp(.26,.37,Math.abs(x)))
   *(1-ramp(1,15,Math.abs(sy-boundary)));
  const d=amplitude*w*strength/cam.scale;
  if(Math.abs(d)<1e-10)return v;
  return {...v,p:[x,y-d,z]};
 });
 // 아주 가는 기존 삼각형 몇 개는 연속 변위에도 법선이 반대로 돌아갈 수 있다.
 // 원래 삼각형의 방향과 면적을 보존하는 범위로 해당 주변 정점의 이동량만 줄인다.
 for(let pass=0;pass<24;pass++){
  const {bad}=skinQuality(body,moved,faces);
  if(!bad.size)break;
  for(const i of bad){
   if(moved[i]===body[i])continue;
   const p=body[i].p,q=moved[i].p;
   moved[i]={...body[i],p:[p[0],p[1]+.55*(q[1]-p[1]),p[2]]};
  }
 }
 const vertices=orientedSkin(body,moved,faces);
 return {...scene,parts:scene.parts.map(m=>m.vertices===body?{...m,vertices}:m)};
}

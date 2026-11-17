// 모든 카메라는 같은 정사영 단위와 세로축을 사용한다. x는 화면 오른쪽, y는 위, z는 정면이다.
export const SIZE=128,views=[0,45,90,135,180],names=['정면','앞 45°','측면','뒤 45°','뒷면'];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const rad=a=>a*Math.PI/180;
export function visibleWeight(yaw,pitch,sourceYaw){
 const dot=clamp(Math.cos(rad(pitch))*Math.cos(rad(yaw-sourceYaw)),-1,1);
 const a=Math.acos(dot)*180/Math.PI,t=clamp((50-a)/40,0,1);
 return t*t*(3-2*t);
}
export function foreground(pixels,w,h,tolerance){
 const a=pixels,mask=new Uint8Array(w*h);const cols=[],xs=[0,1,w-2,w-1],ys=[0,1,h-2,h-1];
 for(const x of xs)for(const y of ys){const i=4*(y*w+x);cols.push([a[i],a[i+1],a[i+2],a[i+3]]);}
 const transparent=cols.filter(p=>p[3]<64).length>=5;
 for(let i=0;i<mask.length;i++){
  if(a[i*4+3]<96)continue;
  if(transparent){mask[i]=1;continue;}
  const delta=cols.map(c=>Math.hypot(a[4*i]-c[0],a[4*i+1]-c[1],a[4*i+2]-c[2])).sort((x,y)=>x-y);
  mask[i]=delta[3]>tolerance?1:0;
 }
 // 피부·머리 주위의 작은 배경 무늬가 얼굴 폭을 바꾸지 않게 가장 큰 연결 영역을 쓴다.
 const seen=new Uint8Array(mask.length),queue=new Int32Array(mask.length);let largest=[];
 for(let i=0;i<mask.length;i++){
  if(!mask[i]||seen[i])continue;let head=0,end=1;queue[0]=i;seen[i]=1;
  while(head<end){const q=queue[head++],x=q%w,y=Math.floor(q/w);
   for(const j of [x?q-1:-1,x+1<w?q+1:-1,y?q-w:-1,y+1<h?q+w:-1]){
    if(j<0||seen[j]||!mask[j])continue;seen[j]=1;queue[end++]=j;}}
  if(end>largest.length)largest=queue.slice(0,end);
 }
 const out=new Uint8Array(mask.length);for(const i of largest)out[i]=1;return out;
}
export function bounds(mask,n=SIZE){
 let left=n,right=-1,top=n,bottom=-1;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(mask[y*n+x]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 return right>=left&&bottom-top>3?{left,right,top,bottom}:null;
}
export function extent(mask,n=SIZE){
 return Array.from({length:n},(_,y)=>{let a=n,b=-1;for(let x=0;x<n;x++)if(mask[y*n+x]){a=Math.min(a,x);b=Math.max(b,x);}return b>=a?[a,b]:null;});
}
export function camera(mask,n=SIZE){
 const b=bounds(mask,n);if(!b)return null;
 return {cx:(b.left+b.right+1)/2,cy:(b.top+b.bottom+1)/2,scale:b.bottom-b.top+1};
}
export function signature(mask){
 const c=camera(mask);if(!c)return null;const rows=extent(mask);
 return Array.from({length:21},(_,i)=>{const e=rows[clamp(Math.floor(c.cy+(i/20-.5)*.92*c.scale),0,SIZE-1)];return e?e.map(x=>(x+.5-c.cx)/c.scale):[0,0];}).flat();
}
export function rankViews(mask,candidates){
 const v=signature(mask);if(!v)return [];
 return candidates.map(c=>({yaw:c.yaw,loss:Math.sqrt(c.sig.reduce((s,x,i)=>s+(x-v[i])**2,0)/v.length)})).sort((a,b)=>a.loss-b.loss);
}
function clip(poly,a,b,k){
 const output=[];
 for(let i=0;i<poly.length;i++){
  const p=poly[i],q=poly[(i+1)%poly.length],s=p[0]*a+p[1]*b-k,t=q[0]*a+q[1]*b-k;
  if(s<=0)output.push(p);
  if((s<0&&t>0)||(s>0&&t<0)){const f=s/(s-t);output.push([p[0]+f*(q[0]-p[0]),p[1]+f*(q[1]-p[1])]);}
 }
 return output;
}
export function reconstruct(images,levels=67,steps=96){
 const used=images.filter(i=>i?.camera&&i.rows);
 if(!used.some(a=>used.some(b=>Math.abs(Math.sin(rad(a.yaw-b.yaw)))>Math.sin(rad(5)))))return null;
 const rings=[],v=[],f=[];
 for(let j=0;j<levels;j++){
  const y=(.5-(j+.5)/levels)*.998;
  let poly=[[-.76,-.76],[.76,-.76],[.76,.76],[-.76,.76]];
  for(const im of used){const {cx,cy,scale}=im.camera,n=im.rows.length,py=Math.floor(cy-y*scale),e=im.rows[py];if(!e){poly=[];break;}
   const a=Math.cos(rad(im.yaw)),b=Math.sin(rad(im.yaw));poly=clip(poly,a,b,(e[1]+1-cx)/scale);poly=clip(poly,-a,-b,-(e[0]-cx)/scale);
  }
  if(poly.length<3){rings.push(null);continue;}
  const center=poly.reduce((acc,p)=>[acc[0]+p[0]/poly.length,acc[1]+p[1]/poly.length],[0,0]),ring=[];
  for(let k=0;k<steps;k++){
   const a=2*Math.PI*k/steps,u=Math.cos(a),w=Math.sin(a);let distance=Infinity;
   for(let i=0;i<poly.length;i++){
    const p=poly[i],q=poly[(i+1)%poly.length],dx=q[0]-p[0],dz=q[1]-p[1],den=u*dz-w*dx;
    if(Math.abs(den)<1e-9)continue;const px=p[0]-center[0],pz=p[1]-center[1],d=(px*dz-pz*dx)/den,along=(px*w-pz*u)/den;
    if(d>=0&&along>=-1e-7&&along<=1+1e-7)distance=Math.min(distance,d);
   }
   if(!Number.isFinite(distance))distance=0;
   ring.push(v.length/3);v.push(center[0]+distance*u,y,center[1]+distance*w);
  }
  rings.push({ids:ring,center});
 }
 for(let j=0;j<levels;j++){const r=rings[j];if(!r)continue;
  const cap=!rings[j-1]||!rings[j+1]?v.length/3:null;
  if(cap!==null)v.push(r.center[0],v[3*r.ids[0]+1],r.center[1]);
  for(let k=0;k<steps;k++){const next=(k+1)%steps;
   if(rings[j+1]){const q=rings[j+1].ids;f.push(r.ids[k],r.ids[next],q[k],r.ids[next],q[next],q[k]);}
   if(!rings[j-1])f.push(cap,r.ids[next],r.ids[k]);if(!rings[j+1])f.push(cap,r.ids[k],r.ids[next]);
  }
 }
 return f.length?{v,f,rings,steps}:null;
}
export function obj(mesh){const lines=['# 책방 친구 · 현재 부분 모델'];for(let i=0;i<mesh.v.length;i+=3)lines.push('v '+mesh.v.slice(i,i+3).map(v=>v.toFixed(6)).join(' '));for(let i=0;i<mesh.f.length;i+=3)lines.push('f '+mesh.f.slice(i,i+3).map(n=>n+1).join(' '));return lines.join('\n')+'\n';}
export function surfaceEdit(mesh,part,width,depth){
 if(!mesh)return null;
 const controls={jaw:[-.24,.16],cheek:[-.035,.12],nose:[-.03,.095],crown:[.32,.14]},[mid,range]=controls[part];
 const v=mesh.v.slice();
 for(let i=0;i<v.length;i+=3){const x=v[i],y=v[i+1],z=v[i+2],g=Math.exp(-.5*((y-mid)/range)**2);
  const local=part==='nose'?g*Math.exp(-.5*(x/.105)**2)*clamp((z+.02)/.21,0,1):g;
  v[i]=x*(1+width*.38*local);v[i+2]=z+(depth*.12*local*(part==='nose'?1:clamp((z+.15)/.3,0,1)));}
 return {...mesh,v};
}

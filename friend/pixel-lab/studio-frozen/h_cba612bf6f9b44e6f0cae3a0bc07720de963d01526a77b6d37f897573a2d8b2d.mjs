import {validateSettings,normalizeAngle} from './h_0cba91877c7cfe205c30847dc11bc3afded6fa3524e7eea4036f07ce1d5e7502.mjs';
// 절차적으로 만든 새 연구용 몸. 완성 미술 자산이 아닌 회전·비율 검증용 기본형이다.
const PI=Math.PI;
const palettes={clay:['#554335','#9e7756','#c99c70','#e7bd8f','#f6d8ae'],amber:['#493c37','#93664b','#bd8859','#dfb478','#f3d69b'],umber:['#352c31','#58413b','#805847','#a67a58','#cda879']};
const rgb=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
const mix=(a,b,t)=>a+(b-a)*t;
const norm=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
const add=(a,b)=>a.map((x,i)=>x+b[i]);
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const mul=(a,s)=>a.map(x=>x*s);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function ellipsoid(list,c,r,mat=0,axis=null){
 let basis=null;if(axis){const y=norm(axis),ref=Math.abs(y[2])>.9?[1,0,0]:[0,0,1],x=norm(cross(y,ref)),z=cross(x,y);basis=[x,y,z];}
 list.push({c,r,mat,basis});
}
function limb(list,a,b,width,depth){ellipsoid(list,mul(add(a,b),.5),[width,Math.hypot(...sub(b,a))*.5+width*.55,depth],0,sub(b,a));}
export function bodyParts(settings,phase=0,action='idle'){
 const s=validateSettings(settings),n=s.heads,t=(n-2)/6,f=s.sex==='female',variant=s.candidate;
 const bulk=variant==='A'?.91:variant==='C'?1.09:1;
 const remaining=n-1,footH=mix(.07,.14,t),legH=remaining*mix(.45,.55,t),hipY=footH+legH;
 const shoulderY=n-1.12,shoulder=mix(.29,f?.67:.81,t)*bulk,hip=mix(.23,f?.58:.48,t)*bulk;
 const torsoH=Math.max(.21,shoulderY-hipY),depth=mix(.15,.27,t),parts=[];
 const motion=action==='walk'?Math.sin(phase):0,bob=action==='walk'?Math.abs(Math.sin(phase))*.025:0;
 const E=(c,r,m=0)=>ellipsoid(parts,[c[0],c[1]+bob,c[2]],r,m);
 E([0,n-.50,0],[.355,.49,.32]);E([0,n-.79,.052],[.255,.22,.265]);
 E([0,n-1.04,0],[mix(.10,.15,t),.16,.14]);
 E([0,shoulderY-torsoH*.24,0],[shoulder*.86,torsoH*.42+.035,depth]);
 E([0,hipY+torsoH*.32,0],[mix(hip*.85,shoulder*.66,.45),torsoH*.42,depth*.87]);
 E([0,hipY,0],[hip,.15+torsoH*.14,depth*1.04]);
 const armLength=remaining*mix(.40,.39,t),armW=mix(.085,f?.13:.17,t)*bulk;
 for(const side of [-1,1]){
  const shoulderPt=[side*shoulder,shoulderY,0],elbow=[side*(shoulder+.06),shoulderY-armLength*.52,-side*motion*.15],wrist=[side*(shoulder+.10),shoulderY-armLength,-side*motion*.30];
  if(variant!=='A')E([side*shoulder*.83,shoulderY-.025,0],[armW*1.65,armW*1.25,armW*1.18]);
  limb(parts,shoulderPt,elbow,armW,armW*.95);limb(parts,elbow,wrist,armW*.77,armW*.79);
  E(wrist,[armW*.84,mix(.09,.17,t),armW*.55]);
  const hx=side*hip*.54,kneeY=footH+legH*.49;
  const hipPt=[hx,hipY-.04,0],knee=[hx+side*.025,kneeY,side*motion*.18],ankle=[hx+side*.045,footH+.03,side*motion*.31];
  limb(parts,hipPt,knee,mix(.105,f?.25:.24,t)*bulk,mix(.10,.25,t));
  limb(parts,knee,ankle,mix(.075,.16,t)*bulk,mix(.08,.17,t));
  E([ankle[0],footH,ankle[2]+mix(.07,.13,t)],[mix(.09,.15,t),footH,mix(.16,.29,t)]);
  E([side*.35,n-.56,-.01],[.06,.095,.065]);
  E([side*.127,n-.53,.299],[.033,.028,.028],1);
 }
 E([0,n-.63,.321],[.038,.052,.042]);
 E([0,n-.747,.292],[.067,.012,.012],2);
 return {parts,height:n,footH,hipY,shoulderY,provenance:'fresh-parametric-body-v1'};
}
function rotation(yaw,pitch){
 const y=normalizeAngle(yaw)*PI/180,p=normalizeAngle(pitch)*PI/180,cy=Math.cos(y),sy=Math.sin(y),cp=Math.cos(p),sp=Math.sin(p);
 return v=>{const x=cy*v[0]+sy*v[2],z=-sy*v[0]+cy*v[2];return [x,cp*v[1]-sp*z,sp*v[1]+cp*z];};
}
export function renderPixels(settings,{yaw=0,pitch=0,phase=0,action='idle',outline=true}={}){
 const s=validateSettings(settings),w=s.resolution,h=w,data=new Uint8ClampedArray(w*h*4),depthBuffer=new Float32Array(w*h).fill(-Infinity),materials=new Int8Array(w*h).fill(-1);
 const {parts,height}=bodyParts(s,phase,action),rot=rotation(yaw,pitch),scale=(w-8)/(height+1.25),colors=palettes[s.palette].map(rgb);
 const light=norm([-.55,.75,1]);
 const transform=(pos,normal)=>{const p=rot([pos[0],pos[1]-height/2,pos[2]]);return{x:w/2+p[0]*scale,y:h/2-p[1]*scale,z:p[2],n:rot(normal)};};
 function triangle(a,b,c,mat){
  const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<1e-7)return;
  const minX=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),maxX=Math.min(w-1,Math.ceil(Math.max(a.x,b.x,c.x))),minY=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),maxY=Math.min(h-1,Math.ceil(Math.max(a.y,b.y,c.y)));
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
   const u=((b.y-c.y)*(x+.5-c.x)+(c.x-b.x)*(y+.5-c.y))/den,v=((c.y-a.y)*(x+.5-c.x)+(a.x-c.x)*(y+.5-c.y))/den,z=1-u-v;
   if(u<0||v<0||z<0)continue;const index=y*w+x,d=u*a.z+v*b.z+z*c.z;if(d<=depthBuffer[index])continue;
   depthBuffer[index]=d;materials[index]=mat;
   const normal=norm(a.n.map((q,i)=>u*q+v*b.n[i]+z*c.n[i])),dot=normal.reduce((sum,q,i)=>sum+q*light[i],0);
   const tone=dot<-.10?1:dot<.28?2:dot<.74?3:4;
   const color=mat===1?[37,43,39]:mat===2?colors[1]:colors[tone];data.set([...color,255],index*4);
  }
 }
 for(const part of parts){
  const points=[],rings=8,segments=12;
  for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
   const v=j*PI/rings,u=i*PI*2/segments,unit=[Math.sin(v)*Math.cos(u),Math.cos(v),Math.sin(v)*Math.sin(u)];
   let offset=unit.map((q,k)=>q*part.r[k]),normal=norm(unit.map((q,k)=>q/part.r[k]));
   if(part.basis){offset=[0,1,2].map(k=>offset.reduce((sum,q,l)=>sum+q*part.basis[l][k],0));normal=[0,1,2].map(k=>normal.reduce((sum,q,l)=>sum+q*part.basis[l][k],0));}
   points.push(transform(add(part.c,offset),normal));
  }
  for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;triangle(points[a],points[b],points[a+1],part.mat);triangle(points[a+1],points[b],points[b+1],part.mat);}
 }
 if(outline){const alpha=data.filter((_,i)=>i%4===3);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const k=y*w+x;if(!alpha[k]&&[k-1,k+1,k-w,k+w].some(i=>alpha[i]))data.set([...colors[0],255],k*4);}}
 let opaque=0,minX=w,minY=h,maxX=-1,maxY=-1,clipped=false;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]){opaque++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);if(x===0||y===0||x===w-1||y===h-1)clipped=true;}
 return {width:w,height:h,data,metrics:{opaque,bounds:[minX,minY,maxX,maxY],clipped},coordinates:{yaw:normalizeAngle(yaw),pitch:normalizeAngle(pitch),order:'Y-then-X',up:'world-positive-Y'}};
}
export function paintCanvas(canvas,result,scale=1){
 canvas.width=result.width;canvas.height=result.height;const context=canvas.getContext('2d');context.imageSmoothingEnabled=false;context.putImageData(new ImageData(result.data,result.width,result.height),0,0);canvas.style.width=`${result.width*scale}px`;canvas.style.height=`${result.height*scale}px`;
}

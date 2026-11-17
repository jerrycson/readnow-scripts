// 36·42차의 동결 카메라와 496px 피부 깊이 검사. 원화에서 매번 다시 등록하지 않는다.
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const minus=(a,b)=>a.map((v,k)=>v-b[k]);
const rad=d=>d*Math.PI/180;
function landmarks(sc){
 const center=m=>{const ix=[...new Set(m.faces.flat())];return [0,1,2].map(j=>mean(ix.map(i=>m.vertices[i].p[j])));};
 const eyes=sc.parts.filter(m=>m.name==='eye34'&&m.mat==='iris34').map(center).sort((a,b)=>a[0]-b[0]);
 const chin=sc.landmarks.chin[1];
 const nose=sc.parts[0].vertices.map(v=>v.p).filter(([x,y])=>Math.abs(x)<.06&&y>chin+.26&&y<chin+.43).sort((a,b)=>b[2]-a[2])[0];
 return [...eyes,nose,center(sc.parts.find(m=>m.name==='mouth-line34'))];
}
function cameraAt(yaw,pitch,coords,refs){
 const cy=Math.cos(rad(yaw)),sy=Math.sin(rad(yaw)),cp=Math.cos(rad(pitch)),sp=Math.sin(rad(pitch));
 const orbit=([x,y,z])=>[x*cy+z*sy,-y*cp+(z*cy-x*sy)*sp,y*sp+(z*cy-x*sy)*cp];
 const q=coords.map(orbit),cent=(a,k)=>mean(a.map(p=>p[k]));
 const cx=cent(q,0),cy0=cent(q,1),tx=cent(refs,0),ty=cent(refs,1);
 let a=0,b=0,s=0;
 q.forEach(([x,y],i)=>{x-=cx;y-=cy0;const u=refs[i][0]-tx,v=refs[i][1]-ty;a+=u*x+v*y;b+=v*x-u*y;s+=x*x+y*y;});
 a/=s;b/=s;
 const project=point=>{const [x,y,d]=orbit(point);return [tx+a*(x-cx)-b*(y-cy0),ty+b*(x-cx)+a*(y-cy0),d];};
 const error=coords.map((p,i)=>Math.hypot(...minus(project(p).slice(0,2),refs[i])));
 return {yaw,pitch,roll:Math.atan2(b,a)*180/Math.PI,scale:Math.hypot(a,b),rms:Math.sqrt(mean(error.map(v=>v*v))),error,project};
}
function visibleEdges(scene,cam){
 const skin=scene.parts[0].vertices,chin=scene.landmarks.chin[1];
 const faces=scene.parts.filter(m=>m.vertices===skin).flatMap(m=>m.faces);
 const n=496,pts=skin.map(v=>{const [x,y,z]=cam.project(v.p);return[x*2,y*2,z];});
 const buffer=new Float32Array(n*n).fill(-Infinity),edges=new Map();
 for(const [i,j,k] of faces){
  const [a,b,c]=[pts[i],pts[j],pts[k]],dx=b[0]-a[0],dy=b[1]-a[1],ex=c[0]-a[0],ey=c[1]-a[1],den=dx*ey-dy*ex;
  if(Math.abs(den)<1e-8)continue;
  for(const [l,r] of [[i,j],[j,k],[k,i]]){
   // 화면에서 양 삼각형의 세 번째 꼭짓점이 같은 쪽이면 이 모서리를 따라 접힌다.
   // 이 판정은 삼각형의 저장 순서와 작가가 지정한 명암용 법선에 의존하지 않는다.
   const sign=Math.sign(den)*Math.sign(r-l);
   const key=Math.min(l,r)*skin.length+Math.max(l,r);
   const e=edges.get(key);
   if(e){e.count++;if(e.sign===sign)e.rim=true;}else edges.set(key,{l,r,sign,count:1,rim:false});
  }
  const xmin=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),xmax=Math.min(n-1,Math.ceil(Math.max(a[0],b[0],c[0])));
  const ymin=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),ymax=Math.min(n-1,Math.ceil(Math.max(a[1],b[1],c[1])));
  for(let y=ymin;y<=ymax;y++)for(let x=xmin;x<=xmax;x++){
   const xx=x+.5-a[0],yy=y+.5-a[1],u=(xx*ey-yy*ex)/den,v=(dx*yy-dy*xx)/den;
   if(u>=0&&v>=0&&u+v<=1){const d=a[2]+u*(b[2]-a[2])+v*(c[2]-a[2]),at=y*n+x;if(d>buffer[at])buffer[at]=d;}
  }
 }
 const results=[];
 for(const {l,r,count,rim} of edges.values()){
  if(!rim&&count!==1)continue;
  const a=pts[l],b=pts[r],p=skin[l].p,q=skin[r].p,len=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));
  for(let j=0;j<=len;j++){
   const t=len?j/len:0,x=a[0]+t*(b[0]-a[0]),y=a[1]+t*(b[1]-a[1]),z=a[2]+t*(b[2]-a[2]);
   const h=p[1]+t*(q[1]-p[1])-chin,depth=p[2]+t*(q[2]-p[2]);
   if(h<-.10||h>.44||depth<.14||x<1||x>=n-1||y<1||y>=n-1)continue;
   const idx=Math.floor(y)*n+Math.floor(x);
   if(z+.015>=buffer[idx])results.push([x/2,y/2]);
  }
 }
 return results;
}

export {landmarks,cameraAt,visibleEdges};

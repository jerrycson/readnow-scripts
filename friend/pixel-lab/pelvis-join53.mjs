import {sub,cross,norm,lerp,add,dot} from './geometry.mjs';

const average=points=>points.reduce((v,p)=>v.map((n,k)=>n+p[k]/points.length),[0,0,0]);
const circle=2*Math.PI;
function trimAt(mesh,first,cap) {
  return {...mesh,faces:mesh.faces.filter(face=>face.every(i=>i>=first&&i!==cap))};
}
function grid(mesh,segments,duplicate) {
  const stride=segments+Number(duplicate),cap=mesh.vertices.length-2;
  const rows=cap/stride;
  if(!Number.isInteger(rows))throw Error('골반 접합의 원형 고리 구성을 확인하세요.');
  const ring=row=>Array.from({length:segments},(_,i)=>mesh.vertices[row*stride+i]);
  return {stride,cap,rows,ring};
}
function interpolate(ring,t,field='p') {
  const at=t*ring.length,i=Math.floor(at),k=i%ring.length;
  return lerp(ring[k][field],ring[(k+1)%ring.length][field],at-i);
}
function addBand(faces,upper,lower,sign){
  let a=0,b=0;
  const push=(x,y,z)=>faces.push(sign>0?[x,y,z]:[x,z,y]);
  while(a<upper.length||b<lower.length){
    const i=upper[a%upper.length],j=lower[b%lower.length];
    if((a+1)/upper.length<=(b+1)/lower.length){
      a++;push(i,j,upper[a%upper.length]);
    }else{
      b++;push(i,j,lower[b%lower.length]);
    }
  }
}
function alignThigh(points,side,angle) {
  const c=average(points.map(v=>v.p));
  const theta=v=>Math.atan2(v.p[2]-c[2],side*(v.p[0]-c[0]));
  const angular=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
  const sorted=points.slice().sort((a,b)=>theta(b)-theta(a));
  let start=0;
  for(let i=1;i<sorted.length;i++){
    if(Math.abs(angular(theta(sorted[i]),angle))<Math.abs(angular(theta(sorted[start]),angle)))start=i;
  }
  return sorted.slice(start).concat(sorted.slice(0,start));
}
export function joinPelvis53(scene) {
  const torso=scene.parts.find(m=>m.name==='ribcage-waist-pelvis');
  const legs=scene.parts.filter(m=>m.name==='thigh');
  if(!torso||legs.length!==2)return scene;
  const {cute,depth}=scene.proportions,hip=scene.joints.pelvis[1];
  const torsoSegments=torso.vertices.length===6179?70:40;
  const trunk=grid(torso,torsoSegments,true);
  let cut=1;
  const targetY=hip+(cute?Math.min(.105,(scene.proportions.shoulderY-hip)*.16):.14);
  // 골반의 맨 아래 고리는 옆에서 들려 있다. 변위가 없는 상부 단면을 절단면으로 쓴다.
  while(cut<trunk.rows-2 && Math.min(...trunk.ring(cut).map(v=>v.p[1]))<targetY)cut++;
  const rim=trunk.ring(cut),front=Math.round(torsoSegments/4),back=Math.round(3*torsoSegments/4);
  const vertices=[],faces=[],normalSums=[],medialIndices=[];
  const append=(p,n)=>{vertices.push({p,n});normalSums.push([0,0,0]);return vertices.length-1;};
  const replacements=new Map([[torso,trimAt(torso,cut*trunk.stride,trunk.cap)]]);
  for(const leg of legs){
    const sign=Math.sign(leg.vertices[leg.vertices.length-2].p[0])||Math.sign(average(leg.vertices.map(v=>v.p))[0]);
    const segments=cute?12:24,thigh=grid(leg,segments,!cute),legCut=cute?2:6;
    replacements.set(leg,trimAt(leg,legCut*thigh.stride,thigh.cap));
    const outside=[];
    for(let i=front;;i=(i-sign+torsoSegments)%torsoSegments){
      outside.push(rim[i]);
      if(i===back)break;
    }
    const inners=12,upper=[...outside],nOuter=outside.length-1,count=nOuter+inners;
    const bottom=alignThigh(thigh.ring(legCut),sign,Math.PI*nOuter/count);
    const legY=average(bottom.map(v=>v.p))[1];
    const saddleY=hip-(hip-legY)*.65;
    for(let i=1;i<inners;i++){
      const t=i/inners,p=lerp(rim[back].p,rim[front].p,t);
      // 양쪽 허벅지가 뒤·앞 중심을 잇는 하나의 새들 곡선을 공유한다.
      p[1]+=(saddleY-p[1])*(Math.sin(Math.PI*t)**1.28);
      upper.push({p,n:null});
    }
    const top=upper.map(v=>append(v.p,v.n));
    medialIndices.push(top.slice(outside.length));
    let last=top;
    const rows=10;
    for(let row=1;row<rows;row++){
      const t=row/rows,bulge=Math.sin(Math.PI*t)**2,loop=[];
      for(let i=0;i<count;i++){
        const a=upper[i].p,b=interpolate(bottom,i/count),p=lerp(a,b,t);
        const delta=sub(b,a),n0=upper[i].n,n1=norm(interpolate(bottom,i/count,'n'));
        // 양끝의 접선이 기존 피부와 일치하도록 경계 법선 성분을 제거한다.
        const start=n0?t*(1-t)**2*dot(delta,n0):0,end=(t-1)*t*t*dot(delta,n1);
        for(let k=0;k<3;k++)p[k]-=start*(n0?.[k]||0)+end*n1[k];
        const angle=Math.PI*nOuter/count-circle*i/count;
        // 바깥쪽은 볼기를 둥글리고, 뒤쪽 볼륨은 허벅지 뿌리까지 잇는다.
        p[0]+=sign*depth*(cute?.045:.085)*bulge*Math.max(0,Math.cos(angle));
        p[2]-=depth*(cute?.11:.215)*bulge*Math.max(0,-Math.sin(angle))**2;
        loop.push(append(p,null));
      }
      addBand(faces,last,loop,sign);last=loop;
    }
    addBand(faces,last,bottom.map(v=>append(v.p,v.n)),sign);
  }
  for(const [a,b,c] of faces){
    const n=cross(sub(vertices[b].p,vertices[a].p),sub(vertices[c].p,vertices[a].p));
    for(const i of [a,b,c])normalSums[i]=add(normalSums[i],n);
  }
  for(let j=0;j<medialIndices[0].length;j++){
    const a=medialIndices[0][j],b=medialIndices[1][j],n=norm(add(normalSums[a],normalSums[b]));
    vertices[a].n=vertices[b].n=n;
  }
  vertices.forEach((v,i)=>{if(!v.n)v.n=norm(normalSums[i]);});
  const join={name:'pelvis-thigh-surface53',mat:torso.mat,vertices,faces};
  return {...scene,parts:scene.parts.map(m=>replacements.get(m)||m).concat(join)};
}

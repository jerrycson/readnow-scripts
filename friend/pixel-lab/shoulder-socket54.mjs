import {add,sub,mul,cross,norm,dot,lerp} from './geometry.mjs';

const mean=points=>points.reduce((v,p)=>add(v,mul(p,1/points.length)),[0,0,0]);
const posKey=p=>p.map(n=>Math.round(n*1e8)).join('/');
const key=(a,b)=>a<b?a+':'+b:b+':'+a;
function boundary(mesh,removed){
  const points=new Map(),edges=new Map(),links=new Map();
  for(const f of removed)for(let i=0;i<3;i++){
    const a=mesh.vertices[f[i]],b=mesh.vertices[f[(i+1)%3]],x=posKey(a.p),y=posKey(b.p);
    points.set(x,a);const k=key(x,y);
    if(edges.has(k))edges.delete(k);else edges.set(k,[x,y]);
  }
  for(const [a,b] of edges.values())for(const [i,j] of [[a,b],[b,a]]){
    if(!links.has(i))links.set(i,[]);links.get(i).push(j);
  }
  if(!links.size||[...links.values()].some(v=>v.length!==2))throw Error('어깨 경계가 한 고리로 닫히지 않았습니다.');
  const first=links.keys().next().value,ring=[first];let prev=first,next=links.get(first)[0];
  while(next!==first&&ring.length<=links.size){ring.push(next);const follow=links.get(next).find(i=>i!==prev);prev=next;next=follow;}
  if(ring.length!==links.size)throw Error('어깨 절단면이 여러 개로 분리됐습니다.');
  return ring.map(k=>points.get(k));
}
function ordered(ring,radial,chart){
  const center=mean(ring.map(v=>v.p));
  const uv=chart|| (v=>[radial(sub(v.p,center)),v.p[2]-center[2]]);
  const area=ring.reduce((sum,v,i)=>{const [a,b]=uv(v),[c,d]=uv(ring[(i+1)%ring.length]);return sum+a*d-b*c;},0);
  const list=area<0?ring.slice().reverse():ring.slice();
  const angularDistance=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
  const nearest=(arr,angle)=>arr.reduce((best,v,i)=>{
    const [x,y]=uv(v),error=angularDistance(Math.atan2(y,x),angle);
    return error<best.error?{i,error}:best;
  },{i:0,error:Infinity}).i;
  const start=nearest(list,0);
  const loop=list.slice(start).concat(list.slice(0,start));
  const lengths=[0];loop.forEach((v,i)=>lengths.push(lengths[i]+Math.hypot(...sub(v.p,loop[(i+1)%loop.length].p))));
  const stops=[0,nearest(loop,Math.PI/2),nearest(loop,Math.PI),nearest(loop,-Math.PI/2),loop.length];
  if(stops.slice(1).some((v,i)=>v<=stops[i]))throw Error('어깨 단면의 앞·뒤 기준점 순서가 맞지 않습니다.');
  const at=[0];
  for(let q=0;q<4;q++){
    const a=stops[q],b=stops[q+1];
    for(let i=a+1;i<=b;i++)at.push((q+(lengths[i]-lengths[a])/(lengths[b]-lengths[a]))/4);
  }
  return {loop,at};
}
function sample(ring,t,field){
  let i=0;while(i+1<ring.loop.length&&ring.at[i+1]<t)i++;
  const {loop,at}=ring;
  return lerp(loop[i][field],loop[(i+1)%loop.length][field],(t-at[i])/(at[i+1]-at[i]));
}
function zip(faces,a,b,sign){
  const tri=(i,j,k)=>faces.push(sign>0?[i,k,j]:[i,j,k]);
  let i=0,j=0;
  while(i<a.idx.length||j<b.idx.length){
    const ia=a.idx[i%a.idx.length],ib=b.idx[j%b.idx.length];
    if(i<a.idx.length&&(j===b.idx.length||a.at[i+1]<=b.at[j+1])){i++;tri(ia,ib,a.idx[i%a.idx.length]);}
    else{j++;tri(ia,ib,b.idx[j%b.idx.length]);}
  }
}
function sleeve54(socket,limb,side,radius,chart){
  const a=ordered(socket,p=>p[1],chart),b=ordered(limb,p=>side*p[0]);
  const vertices=[],faces=[],weights=[],curves=[],sums=[];
  const put=(p,n,v)=>{vertices.push({p,n});weights.push(v);sums.push([0,0,0]);return vertices.length-1;};
  let last={at:a.at,idx:a.loop.map(v=>put(v.p,v.n,0))};
  const steps=10,count=40;
  for(let row=1;row<steps;row++){
    const t=row/steps,ring={at:Array.from({length:count+1},(_,i)=>i/count),idx:[]};
    for(let i=0;i<count;i++){
      const u=i/count,ang=2*Math.PI*u;
      const x=sample(a,u,'p'),y=sample(b,u,'p'),n=norm(sample(a,u,'n')),m=norm(sample(b,u,'n'));
      const line=sub(y,x),p=lerp(x,y,t),upper=t*(1-t)**2*dot(line,n),lower=t*t*(t-1)*dot(line,m);
      const bulge=radius*.40*Math.sin(Math.PI*t)**2*Math.max(0,Math.cos(ang));
      for(let k=0;k<3;k++)p[k]-=upper*n[k]+lower*m[k];
      p[0]+=side*bulge;p[1]+=.40*bulge;
      const idx=put(p,null,t);
      curves[idx]={torso:x,limb:y,torsoNormal:n,limbNormal:m};
      ring.idx.push(idx);
    }
    zip(faces,last,ring,side);last=ring;
  }
  zip(faces,last,{at:b.at,idx:b.loop.map(v=>put(v.p,v.n,1))},side);
  for(const [i,j,k] of faces){const n=cross(sub(vertices[j].p,vertices[i].p),sub(vertices[k].p,vertices[i].p));for(const h of [i,j,k])sums[h]=add(sums[h],n);}
  vertices.forEach((v,i)=>{if(!v.n)v.n=norm(sums[i]);});
  return {name:side>0?'right-shoulder-skin54':'left-shoulder-skin54',mat:'skin',vertices,faces,weights54:weights,curves54:curves};
}
export function shoulderSocket54(scene){
  const torso=scene.parts.find(p=>p.name==='ribcage-waist-pelvis'),arms=scene.parts.filter(p=>p.name==='upper-arm');
  if(!torso||arms.length!==2)return scene;
  const segments=torso.vertices.length===6179?70:40,stride=segments+1,cap=torso.vertices.length-2;
  const cuts=new Map(),replacements=new Map(),patches=[];
  for(const arm of arms){
    const side=Math.sign(mean(arm.vertices.map(v=>v.p))[0]),j=scene.joints[side>0?'right':'left'],cute=scene.proportions.cute;
    const n=cute?12:24,step=cute?n:n+1,row=cute?2:10;
    const ring=arm.vertices.slice(row*step,row*step+n);
    const radius=(Math.max(...ring.map(v=>v.p[2]))-Math.min(...ring.map(v=>v.p[2])))*.5;
    const cy=j.shoulder[1]-(cute?.045:.18)*radius;
    const above=Math.min(radius*1.16,scene.proportions.shoulderY+.13-cy),below=radius*1.20;
    const mask=new Set();
    for(let row=0;row<(cap/stride)-1;row++)for(let col=0;col<segments;col++){
      const a=row*stride+col,theta=(col+.5)/segments*Math.PI*2;
      const lateral=Math.acos(Math.max(-1,Math.min(1,side*Math.cos(theta))));
      const y=(torso.vertices[a].p[1]+torso.vertices[a+stride].p[1])/2-cy;
      if((lateral/.91)**2+(y/(y>0?above:below))**2>=1)continue;
      mask.add(a);
    }
    const removed=torso.faces.filter(f=>{
      if(f.some(i=>i>=cap))return false;
      const row=Math.min(...f.map(i=>Math.floor(i/stride))),col=Math.min(...f.map(i=>i%stride));
      return mask.has(row*stride+col);
    });
    removed.forEach(f=>cuts.set(f,true));
    const socket=boundary(torso,removed);
    replacements.set(arm,{...arm,faces:arm.faces.filter(f=>f.every(i=>i>=row*step&&i!==arm.vertices.length-2))});
    const indices=new Map(torso.vertices.map((v,i)=>[v,i]));
    const chart=v=>{
      const i=indices.get(v),angle=i%stride/segments*Math.PI*2;
      const y=v.p[1]-cy;
      return [y/(y>0?above:below),Math.atan2(Math.sin(angle),side*Math.cos(angle))/.91];
    };
    patches.push(sleeve54(socket,ring,side,radius,chart));
  }
  replacements.set(torso,{...torso,faces:torso.faces.filter(f=>!cuts.has(f))});
  return {...scene,parts:scene.parts.filter(p=>p.name!=='deltoid').map(p=>replacements.get(p)||p).concat(patches)};
}

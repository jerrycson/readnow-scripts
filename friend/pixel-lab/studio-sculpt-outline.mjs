// 38~42차 측정의 삼각형 가시 모서리·깊이 검사를 브라우저의 실제 교정 메시에도 적용한다.
import {sliceThroughSurface} from './overlay35.mjs';
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const minus=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
const mix=(a,b,t)=>a.map((v,i)=>v+t*(b[i]-v));
function viewPoint([x,y,z],yaw){
  const angle=yaw*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  return [x*c+z*s,-y,z*c-x*s];
}
const place=([c,s,dx,dy],[x,y])=>[c*x-s*y+dx,s*x+c*y+dy];
const topology=new WeakMap();
function candidates(scene){
  const {faces}=scene.parts[0],rest=scene.restSkin35;
  if(topology.has(rest))return topology.get(rest);
  const material=rest.map(({p:[x,y,z]})=>{
    const hand=x>=0?1:-1,f=scene.paperShape.frame(hand),q=(x-f.c)/f.root;
    if(z<.05||Math.abs(q)>1.02)return null;
    const local=scene.paperShape.frame(hand,q),u=(local.top-y)/(local.top-local.foot);
    if(!Number.isFinite(u)||u<-.06||u>1.08)return null;
    const t=(f.top-y)/f.h;
    return t>=-.07&&t<=1.16?{hand,t,q}:null;
  });
  const edges=new Map(),directions=[];
  faces.forEach((face,j)=>{
    if(!face.some(i=>material[i]))return;
    const [a,b,c]=face.map(i=>rest[i]),n=cross(minus(b.p,a.p),minus(c.p,a.p));
    directions[j]=dot(n,a.n.map((v,k)=>v+b.n[k]+c.n[k]))<0?-1:1;
    face.forEach((i,k)=>{
      const other=face[(k+1)%3],key=Math.min(i,other)*rest.length+Math.max(i,other);
      if(!edges.has(key))edges.set(key,{ends:[i,other],adjacent:[]});
      edges.get(key).adjacent.push([j,i<other?1:-1]);
    });
  });
  const result={directions,edges:[...edges.values()].filter(e=>e.adjacent.length===2&&e.ends.every(i=>material[i])),material};
  topology.set(rest,result);
  return result;
}
function depthIndex(points,faces,top,bottom){
  const bins=new Map(),step=.075,bin=x=>Math.floor(x/step),key=(u,v)=>u+v*1000;
  for(const ids of faces){
    const [a,b,c]=ids.map(i=>points[i]);
    if(Math.min(a[1],b[1],c[1])>bottom||Math.max(a[1],b[1],c[1])<top)continue;
    const ax=b[0]-a[0],ay=b[1]-a[1],bx=c[0]-a[0],by=c[1]-a[1],den=ax*by-ay*bx;
    if(Math.abs(den)<1e-11)continue;
    const tri={a,ax,ay,bx,by,az:b[2]-a[2],bz:c[2]-a[2],den};
    for(let v=bin(Math.min(a[1],b[1],c[1]));v<=bin(Math.max(a[1],b[1],c[1]));v++){
      for(let u=bin(Math.min(a[0],b[0],c[0]));u<=bin(Math.max(a[0],b[0],c[0]));u++){
        if(!bins.has(key(u,v)))bins.set(key(u,v),[]);
        bins.get(key(u,v)).push(tri);
      }
    }
  }
  return ([x,y,z])=>{
    for(const t of bins.get(key(bin(x),bin(y)))||[]){
      const dx=x-t.a[0],dy=y-t.a[1],u=(dx*t.by-dy*t.bx)/t.den,v=(t.ax*dy-t.ay*dx)/t.den;
      if(u>=0&&v>=0&&u+v<=1&&t.a[2]+u*t.az+v*t.bz>z+.001)return false;
    }
    return true;
  };
}
function substantialArcs(runs){
  const endpoints=new Map(),key=p=>p.map(x=>Math.round(x*1e6)).join('/');
  runs.forEach((r,i)=>{for(const p of [r[0],r.at(-1)]){
    const k=key(p);if(!endpoints.has(k))endpoints.set(k,[]);endpoints.get(k).push(i);
  }});
  const seen=new Set(),components=[];
  runs.forEach((r,i)=>{
    if(seen.has(i))return;
    const stack=[i],lines=[];let length=0;
    while(stack.length){
      const j=stack.pop();if(seen.has(j))continue;
      seen.add(j);const line=runs[j],a=line[0],b=line.at(-1);
      lines.push(line);length+=Math.hypot(a[0]-b[0],a[1]-b[1]);
      for(const p of [a,b])for(const n of endpoints.get(key(p)))if(!seen.has(n))stack.push(n);
    }
    components.push({lines,length});
  });
  // A grazing edge can briefly disappear into the surface. Retain each
  // substantial visible arc without drawing a bridge across that gap.
  return components.filter(group=>group.length>=.035).flatMap(group=>group.lines);
}
export function visible(scene,yaw,neutral=scene){
  const {vertices,faces}=scene.parts[0],points=vertices.map(v=>viewPoint(v.p,yaw));
  const {directions,edges,material}=candidates(scene),sides=[[],[]];
  const frame=scene.paperShape.frame(1),occlusion=depthIndex(points,faces,-frame.top-.1,-frame.top+1.3*frame.h);
  const central=sliceThroughSurface(neutral,frame.c,frame.top,frame.foot),upper=central[0],lower=central.at(-1);
  const facing=directions.map((sign,i)=>{
    const [a,b,c]=faces[i].map(j=>points[j]);
    return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  });
  for(const {adjacent:[[j,d],[k,e]],ends:[i,l]} of edges){
    if(facing[j]*facing[k]*d*e<=0)continue;
    const m=material[i],n=material[l];
    if(m.hand!==n.hand||(yaw===-90&&m.hand<0))continue;
    if(yaw!==-90&&(m.t+n.t)*.5<.31)continue;
    const a=points[i],b=points[l];
    const count=Math.max(1,Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/.007));
    let run=[];
    for(let s=0;s<count;s++){
      const fraction=(s+.5)/count,mid=mix(vertices[i].p,vertices[l].p,fraction);
      const h=Math.max(0,Math.min(1,(upper[1]-mid[1])/(upper[1]-lower[1])));
      const q=(m.q+n.q)*.5;
      const wall=(1-h)*upper[2]+h*lower[2]-frame.h*(yaw===-90?.018:.025+.22*q*q);
      if(mid[2]>=wall&&mid[1]<=upper[1]+.006&&occlusion(mix(a,b,fraction))){
        if(!run.length)run.push(mix(a,b,s/count).slice(0,2));
        run.push(mix(a,b,(s+1)/count).slice(0,2));
      }else if(run.length){sides[m.hand>0?0:1].push(run);run=[];}
    }
    if(run.length)sides[m.hand>0?0:1].push(run);
  }
  return (yaw===-90?sides.slice(0,1):sides).map(substantialArcs);
}
function inLowerBand(runs,y){
  const out=[];
  for(const run of runs){
    let kept=[];
    for(let j=1;j<run.length;j++){
      let a=run[j-1],b=run[j];
      if(a[1]<y&&b[1]<y){if(kept.length)out.push(kept);kept=[];continue;}
      if((a[1]<y)!==(b[1]<y)){
        const cut=mix(a,b,(y-a[1])/(b[1]-a[1]));
        if(a[1]<y)a=cut;else b=cut;
      }
      if(!kept.length)kept.push(a);
      kept.push(b);
      if(run[j][1]<y){out.push(kept);kept=[];}
    }
    if(kept.length)out.push(kept);
  }
  return out;
}

export function chestOutline(scene,neutral,record){
  return visible(scene,record.yaw,neutral).flatMap((side,i)=>{
    const onPlate=side.map(run=>run.map(p=>place(record.camera,p)));
    return inLowerBand(onPlate,record.before.band[i]).map(run=>[run[0],run.at(-1)]);
  });
}

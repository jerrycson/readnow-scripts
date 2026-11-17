import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {DEFAULTS} from '../model.mjs';
import {chest36} from '../contour-model36.mjs';
import {chest38,chestFit38} from '../chest38.mjs';
import {loadRig} from '../rig32.mjs';
import {bindSurface,surfaceParts} from '../surface35.mjs';
import {sliceThroughSurface} from '../overlay35.mjs';
import {raisedPose,pose34} from '../bust34.mjs';
import {portraitPixels} from '../portrait48.mjs';
import {studyView} from '../camera35.mjs';
import {portraitAtResolution} from '../render-resolution.mjs';

const data=name=>JSON.parse(fs.readFileSync(new URL('../'+name,import.meta.url)));
export const settings={...DEFAULTS,heads:8,designStyle:'manga',sex:'female',paperForm:'W',top:'none',showNac:true};
export const ref=data('traces36.json');
const isSide=id=>id[0]==='S';
const yawFor=id=>isSide(id)?-90:-26.15;
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const minus=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
const mix=(a,b,t)=>a.map((v,i)=>v+t*(b[i]-v));
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;

export async function start(){
  await loadRig();
  return chest36(settings,ref,data('fit36.json').fit);
}
function viewPoint([x,y,z],yaw){
  const angle=yaw*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  return [x*c+z*s,-y,z*c-x*s];
}
function materialCenters(scene){
  const socket=bindSurface(scene,settings),vertices=scene.parts[0].vertices;
  return [1,-1].map(hand=>{
    const patch=socket.find(b=>b.side===hand&&b.component==='papilla');
    const ring=patch.points.slice(0,24);
    return [0,1,2].map(k=>mean(ring.map(p=>p.ids.reduce((sum,id,i)=>sum+vertices[id].p[k]*p.weights[i],0))));
  });
}
function similarity([a,b],[p,q]){
  const [x,y]=minus(b,a),[u,v]=minus(q,p),d=x*x+y*y;
  const c=(x*u+y*v)/d,s=(x*v-y*u)/d;
  return [c,s,p[0]-c*a[0]+s*a[1],p[1]-s*a[0]-c*a[1]];
}
const place=([c,s,dx,dy],[x,y])=>[c*x-s*y+dx,s*x+c*y+dy];
export function registrations(scene){
  const frame=scene.paperShape.frame(1),section=sliceThroughSurface(scene,frame.c,frame.top,frame.foot);
  const markers=materialCenters(scene);
  return Object.fromEntries(Object.entries(ref.paper).map(([id,cell])=>{
    const yaw=yawFor(id),ps=isSide(id)?[section[0],section.at(-1)]:markers;
    const anchors=isSide(id)?[cell.lines[0][0],cell.lines[0].at(-1)]:cell.marks;
    return [id,similarity(ps.map(p=>viewPoint(p,yaw)),anchors)];
  }));
}

// Inspect actual triangle silhouettes. For each short edge interval, an exact
// orthographic ray tests all overlapping torso triangles, including the arms.
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
const segmentDistance=([x,y],[a,b],[c,d])=>{
  const u=c-a,v=d-b,den=u*u+v*v,t=den?Math.max(0,Math.min(1,((x-a)*u+(y-b)*v)/den)):0;
  return (x-a-t*u)**2+(y-b-t*v)**2;
};
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
export function cellResult(sceneLines,id,camera,lowerOnly=true){
  const cell=ref.paper[id],all=sceneLines.map(lines=>lines.map(run=>run.map(p=>place(camera,p))));
  // The lower half of the marker-to-floor interval excludes the axilla and
  // upper-pole features. Its bounds come from the plate and are identical for
  // both models. A line missing inside this window still incurs distance.
  const band=cell.lines.map((line,i)=>(cell.marks[i][1]+Math.max(...line.map(p=>p[1])))/2);
  const groups=lowerOnly?all.map((g,i)=>inLowerBand(g,band[i])):all;
  const sources=cell.lines.map((r,i)=>lowerOnly?inLowerBand([r],band[i]):[r]);
  function gap(sources,lines){
    // Arc-length weighting guards against cell-dependent density in the traced drawings.
    let squared=0,length=0;
    for(const source of sources)for(let i=1;i<source.length;i++){
      const p=source[i-1],q=source[i],w=Math.hypot(q[0]-p[0],q[1]-p[1]),mid=mix(p,q,.5);
      let d=Infinity;
      for(const run of lines)for(let k=1;k<run.length;k++)d=Math.min(d,segmentDistance(mid,run[k-1],run[k]));
      squared+=w*d;length+=w;
    }
    return Math.sqrt(squared/length);
  }
  const directed=groups.map((lines,i)=>[gap(sources[i],lines),gap(lines,sources[i])]);
  const errorsPx=directed.map(([a,b])=>Math.hypot(a,b)/Math.sqrt(2));
  function floor(lines){
    const points=lines.flat(),bottom=Math.max(...points.map(p=>p[1]));
    const xs=points.filter(p=>p[1]>=bottom-.03*Math.hypot(...cell.size)).map(p=>p[0]);
    return {bottom,width:Math.max(...xs)-Math.min(...xs)};
  }
  const floors=groups.map((runs,k)=>({source:floor([cell.lines[k]]),model:floor(runs)}));
  return {band,lines:groups.flat().map(line=>[line[0],line.at(-1)]),runsBySide:groups.map(g=>g.length),directed,errorsPx,floors,
    errors:errorsPx.map(v=>v/Math.hypot(...cell.size))};
}

export function meshCheck(before,after){
  const prev=before.parts[0].vertices,next=after.parts[0].vertices;
  const changed=prev.flatMap((v,i)=>v.p.some((x,k)=>x!==next[i].p[k])?[i]:[]);
  const changedSet=new Set(changed),lengths=changed.map(i=>Math.hypot(...minus(next[i].p,prev[i].p)));
  let affectedFaces=0,turnsOver90=0,minAreaRatio=1;
  for(const tri of before.parts[0].faces){
    if(!tri.some(i=>changedSet.has(i)))continue;
    const normal=vs=>{const [a,b,c]=tri.map(i=>vs[i].p);return cross(minus(b,a),minus(c,a));};
    const a=normal(prev),b=normal(next),area=Math.hypot(...a);
    if(area<1e-8)continue;
    affectedFaces++;
    if(dot(a,b)<0)turnsOver90++;
    minAreaRatio=Math.min(minAreaRatio,Math.hypot(...b)/area);
  }
  return {changedVertices:changed.length,affectedFaces,turnsOver90,minAreaRatio,maxShift:Math.max(0,...lengths),rmsShift:Math.sqrt(mean(lengths.map(v=>v*v))||0)};
}

const trim=v=>JSON.parse(JSON.stringify(v,(_,x)=>typeof x==='number'?Number(x.toFixed(6)):x));
export function plateCheck(before,after){
  const cameras=registrations(before),sides={};
  for(const [key,scene] of Object.entries({before,after})){
    sides[key]=[visible(scene,-90,before),visible(scene,-26.15,before)];
  }
  return Object.fromEntries(Object.keys(ref.paper).map(id=>{
    const i=isSide(id)?0:1;
    return [id,{yaw:yawFor(id),pitch:0,camera:cameras[id],
      before:cellResult(sides.before[i],id,cameras[id]),after:cellResult(sides.after[i],id,cameras[id])}];
  }));
}
export const angles=[[0,0],[-26.15,0],[-90,0],[180,0],[0,75],[0,-90]];
export function poseCheck(before,after,onRender){
  const poses=[];
  for(const [version,scene] of Object.entries({before,after})){
    const binding=bindSurface(scene,settings);
    assert.equal(binding.length,4);
    assert.equal(bindSurface(scene,{...settings,showNac:false}),null);
    for(const arm of [0,90,178]){
      const posed=arm?pose34(scene,raisedPose(arm)).scene:scene;
      const patches=surfaceParts(binding,posed.parts[0]);
      assert.equal(patches.length,4);
      let maxAttachmentError=0;
      patches.forEach((m,k)=>m.vertices.forEach(({p},i)=>{
        const {ids,weights,offset}=binding[k].points[i],body=posed.parts[0].vertices;
        const attachment=[0,1,2].map(a=>ids.reduce((s,id,n)=>s+weights[n]*body[id].p[a],0));
        maxAttachmentError=Math.max(maxAttachmentError,Math.abs(Math.hypot(...minus(p,attachment))-offset));
      }));
      assert(maxAttachmentError<1e-7);
      const displayed={...posed,parts:[...posed.parts,...patches]},views=[];
      const terminals=patches.filter(m=>m.name.startsWith('papilla')).map(m=>[0,1,2].map(i=>mean(m.vertices.slice(0,24).map(v=>v.p[i]))));
      for(const [yaw,pitch] of angles){
        const pixels=portraitAtResolution(portraitPixels,settings,{...studyView(displayed,false),yaw,pitch,freeOrbit:true},48);
        assert.equal(pixels.width,48);assert(pixels.metrics.opaque>0);
        views.push({yaw,pitch,rgba48:createHash('sha256').update(pixels.data).digest('hex')});
        onRender?.({version,arm,yaw,pitch,scene:displayed});
      }
      poses.push({version,arm,terminals,maxAttachmentError,views});
    }
  }
  for(const pose of poses)assert.equal(new Set(pose.views.map(v=>v.rgba48)).size,angles.length);
  return poses;
}
export function report(before,after){
  const paper=plateCheck(before,after);
  const withheld=Object.entries(paper).filter(([id])=>id!=='B3'&&id!=='S3');
  const improved=withheld.filter(([,row])=>mean(row.after.errorsPx)<mean(row.before.errorsPx)).map(([id])=>id);
  return trim({training:['B3','S3'],holdout:withheld.map(([id])=>id),improved,
    source:'https://doi.org/10.1007/s00266-021-02753-y',fit:chestFit38,mesh:meshCheck(before,after),paper,poses:poseCheck(before,after)});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const before=await start(),backup=before.parts[0].vertices.map(v=>v.p.slice());
  const after=chest38(before,ref),result=report(before,after);
  assert.deepEqual(before.parts[0].vertices.map(v=>v.p),backup);
  assert.equal(result.mesh.turnsOver90,0);assert(result.mesh.changedVertices>0);
  assert.equal(result.poses.length,6);
  const file=new URL('../chest-eval38.json',import.meta.url);
  if(process.argv.includes('--write'))fs.writeFileSync(file,JSON.stringify(result));
  else assert.deepEqual(result,JSON.parse(fs.readFileSync(file)));
  console.log(JSON.stringify({mesh:result.mesh,B3:result.paper.B3.after.errorsPx,S3:result.paper.S3.after.errorsPx,improved:result.improved},null,2));
}

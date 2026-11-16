import {sliceThroughSurface} from './overlay35.mjs';
import {projectPoint} from './renderer.mjs';
function series(scene,hand){
  const {c,root,top,foot}=scene.paperShape.frame(hand);
  const cut=x=>sliceThroughSurface(scene,x,top,foot,81);
  const center=cut(c),rim=[];
  for(let i=0;i<=40;i++){
    const q=(i/20-1)*.94,x=c+root*q,f=scene.paperShape.frame(hand,q),strip=sliceThroughSurface(scene,x,f.top,f.foot,81);if(!strip.length)continue;
    const foremost=strip.reduce((a,b)=>a[2]>b[2]?a:b);
    rim.push(strip.slice(strip.indexOf(foremost)).reduce((a,b)=>a[1]<b[1]?a:b));
  }
  return {center,rim};
}
function similarity(a,b){
  // An isotropic camera registration with two anchors preserves the slope errors inside.
  const [p,q]=a,[s,t]=b,x=q[0]-p[0],y=q[1]-p[1],u=t[0]-s[0],v=t[1]-s[1],d=x*x+y*y;
  if(d<1e-6)return null;
  const A=(x*u+y*v)/d,B=(x*v-y*u)/d;
  return pt=>[s[0]+A*(pt[0]-p[0])-B*(pt[1]-p[1]),s[1]+B*(pt[0]-p[0])+A*(pt[1]-p[1])];
}
function equallySpaced(points){
  const lengths=[0];
  for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
  if(!lengths.at(-1))return points;
  return Array.from({length:80},(_,j)=>{const d=lengths.at(-1)*j/79;let i=1;while(i<points.length-1&&lengths[i]<d)i++;
    const f=(d-lengths[i-1])/Math.max(.000001,lengths[i]-lengths[i-1]);return points[i-1].map((v,k)=>v+f*(points[i][k]-v));});
}
export function paperCompare(scene,img,cell){
  const [l,t,r,b]=cell.box,w=r-l,h=b-t;
  const target=cell.lines.map(ps=>ps.map(([x,y])=>[x*w,y*h]));
  const near=series(scene,1),project=ps=>ps.map(v=>projectPoint(img,v));
  const side=cell.view==='측면',actual=side?[project(near.center)]:[project(near.rim),project(series(scene,-1).rim)];
  if(actual.some(ps=>ps.length<3))return null;
  const anchors=ps=>[ps[0],ps.at(-1)];
  let trans;
  if(side)trans=similarity(anchors(actual[0]),anchors(target[0]));
  else {
    const landmarks=[1,-1].map(hand=>{
      const {c,top,foot}=scene.paperShape.frame(hand),marker=scene.paperShape.marker(hand);
      const strip=sliceThroughSurface(scene,c,top,foot,101);
      const front=strip.filter(v=>v[1]>=marker.y-.08*scene.paperShape.scale);
      const material=front.reduce((a,b)=>Math.abs(a[1]-marker.y)<Math.abs(b[1]-marker.y)?a:b);
      return projectPoint(img,material);
    });
    trans=similarity(landmarks,cell.markers.map(([x,y])=>[x*w,y*h]));
  }
  if(!trans)return null;
  const lines=actual.map(ps=>ps.map(trans));
  function delta(a,b){const nearest=(p,ps)=>Math.min(...ps.map(q=>(q[0]-p[0])**2+(q[1]-p[1])**2));const u=equallySpaced(a),v=equallySpaced(b);
    return Math.sqrt((u.reduce((s,p)=>s+nearest(p,v),0)+v.reduce((s,p)=>s+nearest(p,u),0))/(u.length+v.length))/Math.hypot(w,h);}
  return {lines,errors:lines.map((p,i)=>delta(p,target[i])),w,h};
}

export function caseComparison(scene,image,reference){
  const [w,h]=reference.size;
  const surface=series(scene,1);
  let points=surface[reference.section].map(v=>projectPoint(image,v));
  const target=reference.points;
  if(points.length<3)return null;
  if(reference.section==='rim'){
    const leftToRight=p=>p.at(-1)[0]>p[0][0];
    if(leftToRight(points)!==leftToRight(target))points.reverse();
  }else{
    // The upper attachment and the projecting tip determine which way this profile faces.
    const bulge=ps=>ps.reduce((a,b)=>Math.abs(b[0]-ps[0][0])>Math.abs(a[0]-ps[0][0])?b:a)[0]-ps[0][0];
    if(bulge(points)*bulge(target)<0)points=points.map(([x,y])=>[-x,y]);
  }
  const ends=ps=>[ps[0],ps.at(-1)];
  const place=similarity(ends(points),ends(target));
  if(!place)return null;
  const a=equallySpaced(points.map(place)),b=equallySpaced(target);
  const distances=(p,q)=>p.map(([x,y])=>Math.min(...q.map(([u,v])=>(x-u)**2+(y-v)**2)));
  const d=[...distances(a,b),...distances(b,a)];
  return {points:a,error:Math.sqrt(d.reduce((sum,x)=>sum+x,0)/d.length)/Math.hypot(w,h)};
}

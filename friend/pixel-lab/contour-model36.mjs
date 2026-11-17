import {fittedFace} from './fitting35.mjs';
import {paperRig} from './paper-rig35.mjs';
import {paperShape} from './paper-shape35.mjs';
import {orientedSkin} from './skin-normals35.mjs';
const limit=(x,a,b)=>Math.max(a,Math.min(b,x));
function rowHits(line,y){
  const hits=[];
  for(let i=1;i<line.length;i++){
    const a=line[i-1],b=line[i];
    if(y<Math.min(a[1],b[1])||y>Math.max(a[1],b[1])||Math.abs(a[1]-b[1])<1e-6)continue;
    hits.push(a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]));
  }
  return hits;
}
const sample=(a,x)=>{const t=limit(x,0,1)*(a.length-1),i=Math.floor(t);return a[i]+(t-i)*(a[Math.min(i+1,a.length-1)]-a[i]);};
function faceFrame(ref){
  const chin=line=>Math.max(...line.map(p=>p[1]));
  const sy=(chin(ref.front)-(ref.eye[1]+ref.eye[3])*.5)/.467;
  const sz=(chin(ref.side)-ref.sideEye[1])/.467;
  return {front:{x:(ref.eye[0]+ref.eye[2])*.5,y:chin(ref.front),scale:sy},side:{x:ref.sideEye[0],y:chin(ref.side),scale:sz}};
}
// 같은 높이에서 피부 삼각형이 자르는 실제 선. 머리 뒤쪽·목 단면은 얼굴 폭 측정에서 제외한다.
export function faceCuts(scene,levels=101,angle=0){
  const co=Math.cos(angle*Math.PI/180),si=Math.sin(angle*Math.PI/180);
  const skin=scene.parts[0],chin=scene.landmarks.chin[1],cuts=Array.from({length:levels},()=>[Infinity,-Infinity,-Infinity]);
  for(const f of scene.parts.filter(m=>m.vertices===skin.vertices).flatMap(m=>m.faces)){
    const p=f.map(i=>skin.vertices[i].p);
    const lo=Math.max(0,Math.ceil((Math.min(...p.map(v=>v[1]))-chin)/.57*(levels-1)));
    const hi=Math.min(levels-1,Math.floor((Math.max(...p.map(v=>v[1]))-chin)/.57*(levels-1)));
    for(let k=lo;k<=hi;k++){
      const y=chin+.57*k/(levels-1);
      for(let j=0;j<3;j++){const a=p[j],b=p[(j+1)%3];
        if((a[1]-y)*(b[1]-y)>0||Math.abs(b[1]-a[1])<1e-7)continue;
        const t=(y-a[1])/(b[1]-a[1]),x=a[0]+t*(b[0]-a[0]),z=a[2]+t*(b[2]-a[2]);
        if(z<.205)continue;
        const u=x*co+z*si,c=cuts[k];c[0]=Math.min(c[0],u);c[1]=Math.max(c[1],u);c[2]=Math.max(c[2],z);
      }
    }
  }
  return cuts;
}
export function face36(settings,record,ref){
  const before=fittedFace(settings,record),frame=faceFrame(ref),chin=before.landmarks.chin[1],raw=faceCuts(before);
  const eyes=before.parts.filter(m=>m.name==='eye34');
  const eyeDepth=eyes[0].vertices.reduce((s,v)=>s+v.p[2],0)/eyes[0].vertices.length;
  const deltas=[[],[],[]],profileDepth=[];
  raw.forEach((c,i)=>{
    const h=i*.57/(raw.length-1),f=frame.front,s=frame.side;
    const a=rowHits(ref.front,f.y-f.scale*h),b=rowHits(ref.side,s.y-s.scale*h);
    const desired=[a.length>=2?(Math.min(...a)-f.x)/f.scale:null,a.length>=2?(Math.max(...a)-f.x)/f.scale:null,b.length?eyeDepth+(s.x-Math.min(...b))/s.scale:null];
    profileDepth.push(desired[2]);
    desired.forEach((v,k)=>deltas[k].push(v===null||!Number.isFinite(c[k])?0:limit(v-c[k],-.19,.19)));
  });
  // 턱밑에서 교점 둘이 한 점으로 합쳐지는 마지막 픽셀은 이웃 관측값으로 잇는다.
  for(let i=0;i<profileDepth.length;i++)if(profileDepth[i]===null){
    const closest=profileDepth.map((v,j)=>[v,Math.abs(i-j)]).filter(([v])=>v!==null).sort((a,b)=>a[1]-b[1])[0];profileDepth[i]=closest?.[0]??eyeDepth;
  }
  // 그림의 열린 윤곽 끝에서 보정량을 0으로 갑자기 돌리면 턱 옆면에 띠가 생긴다.
  for(const curve of deltas){const copy=curve.slice(),kernel=[1,4,7,9,7,4,1];
    for(let i=0;i<curve.length;i++)curve[i]=kernel.reduce((sum,w,k)=>sum+w*copy[limit(i+k-3,0,copy.length-1)],0)/33;}
  const shared=new Map(),base=before.parts[0].vertices;
  const warp=p=>{
    const [x,y,z]=p,h=y-chin;
    if(h<-.095||h>.655||z<.13)return p;
    const u=h/.57,fall=limit((h+.095)/.095,0,1)*limit((.655-h)/.085,0,1);
    const c=raw[Math.round(limit(u,0,1)*(raw.length-1))],span=x<0?-c[0]:c[1];
    const lateral=limit(Math.abs(x)/Math.max(.08,span),0,1),depth=limit((z-.13)/.10,0,1);
    let nz=z+fall*sample(deltas[2],u)*limit((z-.24)/.27,0,1)*Math.exp(-.5*(x/.15)**2);
    if(h>=-.045&&h<.11){
      const ceiling=sample(profileDepth,u)-.035*limit((x/.24)**2,0,1),band=.017;
      if(nz>ceiling-band){const smooth=ceiling-band*Math.exp(-(nz-ceiling+band)/band);
        nz+=(smooth-nz)*limit((.11-h)/.035,0,1)*limit((h+.045)/.03,0,1);}
    }
    return [x+fall*depth*lateral*sample(deltas[x<0?0:1],u),y,nz];
  };
  const parts=before.parts.map(m=>{
    if(!shared.has(m.vertices)){
      const changed=m.vertices.map(v=>({...v,p:warp(v.p)}));
      shared.set(m.vertices,m.vertices===base?orientedSkin(base,changed,before.parts.filter(part=>part.vertices===base).flatMap(part=>part.faces)):changed);
    }
    return {...m,vertices:shared.get(m.vertices)};
  });
  return {before,after:{...before,parts},frame,eyeDepth};
}
export function faceLines(scene,model){
  const {frame:f,eyeDepth:z}=model,cuts=faceCuts(scene),front=[[],[]],side=[];
  cuts.forEach((c,i)=>{if(!c.every(Number.isFinite))return;const h=.57*i/(cuts.length-1);
    for(const k of [0,1])front[k].push([f.front.x+c[k]*f.front.scale,f.front.y-h*f.front.scale]);
    side.push([f.side.x-(c[2]-z)*f.side.scale,f.side.y-h*f.side.scale]);});
  return {front,side:[side]};
}
export function unseenJaw(scene,record,frameScene){
  const yaw=record.blindView.yaw,co=Math.cos(yaw*Math.PI/180),si=Math.sin(yaw*Math.PI/180);
  const proj=v=>[v[0]*co+v[2]*si,frameScene.landmarks.chin[1]-v[1]];
  const eyes=[...new Map(frameScene.parts.filter(m=>m.name==='eye34').map(m=>[m.vertices,m])).values()].slice(0,2);
  const a=eyes.map(m=>proj([0,1,2].map(k=>m.vertices.reduce((s,v)=>s+v.p[k],0)/m.vertices.length)));
  const b=record.blindView.marks.map(p=>p.map(t=>t*2.48));
  const dx=a[1][0]-a[0][0],dy=a[1][1]-a[0][1],ux=b[1][0]-b[0][0],uy=b[1][1]-b[0][1],den=dx*dx+dy*dy;
  const c=(dx*ux+dy*uy)/den,t=(dx*uy-dy*ux)/den;
  const align=([x,y])=>[b[0][0]+c*(x-a[0][0])-t*(y-a[0][1]),b[0][1]+t*(x-a[0][0])+c*(y-a[0][1])];
  const cuts=faceCuts(scene,101,yaw);
  return [0,1].map(k=>cuts.flatMap((row,i)=>Number.isFinite(row[k])?[align([row[k],-.57*i/100])]:[]));
}
export function chest36(settings,ref,fit){
  const side=ref.paper.S3,points=side.lines[0],top=points[0],floor=Math.max(...points.map(p=>p[1])),span=floor-top[1];
  const depth=points.map(p=>(top[0]-p[0])/span),end=depth.at(-1);
  const shapeProfile=points.map((p,i)=>[(p[1]-top[1])/span,depth[i]-end*(p[1]-top[1])/(points.at(-1)[1]-top[1])]);
  const markerH=(side.marks[0][1]-top[1])/span;
  function fromPaper(s,w,hip,sh){
    const basic=paperShape(s,w,hip,sh);
    if(basic.form.id!=='W')return basic;
    const calibrated=paperShape({...s,paperCalibration:{width:fit.width,center:fit.center,depth:fit.depth,marker:markerH},contourProfile:shapeProfile},w,hip,sh);
    const point=(x,y,z,weight=1)=>{
      const out=calibrated.point(x,y,z,weight),hand=Math.sign(x)||1,f=calibrated.frame(hand),q=hand*(x-f.c)/f.root;
      if(Math.abs(q)>=1)return out;
      const strip=calibrated.frame(hand,hand*q),u=(strip.top-y)/(strip.top-strip.foot);
      const influence=Math.sin(Math.PI*limit(u,0,1))**2*weight;
      out[1]+=calibrated.scale*sample(fit.rim,(q+1)/2)*influence;
      return out;
    };
    return {...calibrated,point,marker(hand){const f=calibrated.frame(hand);
      const x=f.c+hand*f.root*fit.lateral;
      return {x,y:f.top-markerH*f.h,observed:true};}};
  }
  return paperRig(settings,fromPaper);
}

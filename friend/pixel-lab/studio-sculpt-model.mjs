import {DEFAULTS} from './model.mjs';
import {pair42} from './face42-model.mjs';
import {face36,chest36,faceLines} from './contour-model36.mjs';
import {underside} from './chin37.mjs';
import {chest38} from './chest38.mjs';
import {chest39} from './chest39.mjs';
import {chest40} from './chest40.mjs';
import {chest42} from './chest42.mjs';
import {bindSurface,surfaceParts} from './surface35.mjs';
import {studyView} from './camera35.mjs';
import {portraitPixels} from './portrait48.mjs?v=41';
import {portraitAtResolution} from './render-resolution.mjs';
import {chestOutline} from './studio-sculpt-outline.mjs';
import {joints,setAngle,poseScene} from './rig32.mjs';
import {renderPixels,projectPoint} from './renderer.mjs?v=41';
import {landmarks,cameraAt,visibleEdges} from './studio-sculpt-face-lines.mjs';
import {raisedPose,pose34} from './bust34.mjs';

export const subjects={F02:'페른',M01:'힘멜',W:'성인 몸통 W'};
const faceAxes={chin:'턱끝 돌출',chinHeight:'턱끝 높이',jaw:'아래턱 폭',throat:'턱밑 높이',throatDepth:'목 앞 깊이',mid:'중안면 돌출',midHeight:'중안면 높이',cheek:'광대·볼 폭'};
const bodyAxes={ribWidth:'흉곽 폭',ribDepth:'흉곽 두께',breastWidth:'가슴 가로 폭',projection:'가슴 돌출',lower:'가슴 하부 높이'};
export const axes=id=>id==='W'?bodyAxes:faceAxes;
export const zero=id=>Object.fromEntries(Object.keys(axes(id)).map(k=>[k,0]));
export const defaultBase=id=>id==='F02'?'candidate':'prior';
export const baseLabel=(id,key)=>key==='round49'?(id==='W'?'49차 자세 시험 · 47차 연구 몸통':'49차 표정 시험 · 47차 중립'):key==='round48'?'48차 연구 후보':key==='round47'?'47차 원본 대조 후보':key==='history37'?(id==='F02'?'37차 페른 턱 .75':'37차 당시 기본') : key==='candidate'?(id==='F02'?'42차 측면 후보':'42차 연구 후보'):(id==='F02'?'41차 기준 · 40차 눈':id==='M01'?'현행 39차 기본':'현행 40차 기본');
export const presets=id=>id==='W'?[
  ['얕고 넓게',{ribWidth:22,breastWidth:50,projection:-50}],['하부를 낮게',{lower:-50,projection:20}]
]:[['턱밑 올림',{throat:55,chin:-15}],['볼 폭 줄임',{cheek:-52,jaw:-20}]];
export const defaultView=id=>({yaw:id==='W'?-26.15:-45,pitch:0,zoom:1,size:192,pivot:id==='W'?'shoulder.side':'neck.bend',angle:0});
export const pivotChoices=id=>id==='W'?['shoulder.side','shoulder.bend','shoulder.turn','arms.raise']:['neck.bend','neck.turn','neck.side','jaw.bend'];
export function pivotSpec(key){
  if(key==='arms.raise')return {label:'양팔 올림 · 34차 어깨띠 반응',min:0,max:178};
  const [part,axis]=key.split('.'),[label,min,max]=joints[part].axes[axis];
  return {label:(part==='shoulder'?'양쪽 ':'')+joints[part].label+' '+label,min,max};
}
export function posed(scene,id,view){
  if(!view.angle)return scene;
  if(id==='W'&&view.pivot==='arms.raise')return pose34(scene,raisedPose(view.angle)).scene;
  const [part,axis]=view.pivot.split('.'),pose={};
  const ids=id==='W'?['left.'+part,'right.'+part]:[part];
  for(const key of ids)setAngle(pose,key,axis,view.angle);
  return poseScene(scene,pose).scene;
}
export function buildSculptBase(id,assets){
  if(id!=='W'){
    const pair=pair42(id,assets.atlas,assets.traces),record=assets.atlas.faces.find(v=>v.id===id);
    const reg=face36(pair.settings,record,assets.traces.faces[id]);
    return {...pair,id,record,reg};
  }
  const settings={...DEFAULTS,heads:8,designStyle:'manga',sex:'female',paperForm:'W',top:'none',showNac:true};
  const neutral=chest36(settings,assets.traces,assets.fit.fit);
  const prior=chest40(chest39(chest38(neutral,assets.traces),assets.traces),assets.traces);
  const next=chest42(prior,assets.traces),camera=studyView(neutral,false).sceneOverride;
  return {id,neutral,prior,next,settings,camera,bindings:{prior:bindSurface(prior,settings),candidate:bindSurface(next,settings)}};
}
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const bell=(x,mid,radius)=>{const u=(x-mid)/radius;return Math.abs(u)<1?(1-u*u)**3:0;};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const minus=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const stationary=[0,0,0];
// 정점들을 직선으로 이동할 때 원래 면법선 방향으로 잰 삼각형 면적은 강도의 이차식이다.
// 시작 형상에서 이미 가늘었던 면도 원래 부호와 투영 면적의 8% 이상을 유지한다.
export function safeGain(scene,offsets){
  let gain=1;
  for(const part of scene.parts){
    const vertices=part.vertices,d=offsets.get(vertices);
    for(const [a,b,c] of part.faces){
      if(d[a]===stationary&&d[b]===stationary&&d[c]===stationary)continue;
      const ab=minus(vertices[b].p,vertices[a].p),ac=minus(vertices[c].p,vertices[a].p),normal=cross(ab,ac);
      const norm2=dot(normal,normal);if(norm2<1e-26)continue;
      const u=minus(d[b],d[a]),v=minus(d[c],d[a]);
      const lin=(dot(normal,cross(u,ac))+dot(normal,cross(ab,v)))/norm2;
      const sq=dot(normal,cross(u,v))/norm2;
      const low=sq>0?Math.max(0,Math.min(gain,-lin/(2*sq))):gain;
      if(1+lin*low+sq*low*low>=.08)continue;
      let lo=0,hi=low;
      for(let n=0;n<20;n++){const mid=(lo+hi)*.5;if(1+lin*mid+sq*mid*mid>=.08)lo=mid;else hi=mid;}
      gain=lo;
    }
  }
  return gain;
}
function field(scene,id,v){
  if(id!=='W'){
    const chin=scene.landmarks.chin[1];
    return ([x,y,z])=>{
      const h=y-chin;
      if(h<-.28||h>.62||Math.abs(x)>.53||z<.07)return null;
      const front=smooth(.07,.28,z)*(1-smooth(.43,.53,Math.abs(x)));
      const tip=bell(h,.035,.17)*bell(x,0,.32)*smooth(.34,.56,z);
      const throat=bell(h,-.065,.19)*bell(z,.36,.24);
      const cheeks=bell(h,.28,.26)*smooth(.07,.21,Math.abs(x));
      return [front*x*(v.jaw*.00155*bell(h,.105,.20)+v.cheek*.00155*cheeks),
        front*(v.throat*.00043*throat+v.chinHeight*.00042*tip+v.midHeight*.0004*bell(h,.35,.23)*bell(x,0,.36)),
        front*(v.chin*.00058*tip+v.mid*.00055*bell(h,.35,.23)*bell(x,0,.36)+(v.throatDepth*.00035-v.throat*.00027)*throat)];
    };
  }
  const sh=scene.joints.right.shoulder,hp=scene.joints.right.hip,w=Math.abs(sh[0]);
  const form=scene.paperShape.frame(1);
  return ([x,y,z])=>{
    const h=(y-hp[1])/(sh[1]-hp[1]),a=Math.abs(x)/w;
    if(h<.28||h>1.04||a>1.10)return null;
    const gate=(1-smooth(.90,1.10,a)),rib=gate*bell(h,.685,.35);
    const sign=Math.sign(x),q=(Math.abs(x)-form.c)/form.root;
    const breast=gate*bell(q,0,1.05)*bell(y,(form.top+form.foot)/2,(form.top-form.foot)*.80)*smooth(.12,.34,z/w);
    const low=gate*bell(q,0,1.05)*bell(y,form.foot+.095,.27)*smooth(.12,.34,z/w);
    return [x*v.ribWidth*.00135*rib+sign*q*form.root*v.breastWidth*.0021*breast,
      w*v.lower*.00083*low,
      (z-.10)*v.ribDepth*.00150*rib+w*v.projection*.00135*breast];
  };
}
export function sculpt(scene,id,values){
  if(Object.values(values).every(n=>n===0))return scene;
  const offset=field(scene,id,values),cache=new Map(),offsets=new Map(),eps=.0001;
  for(const {vertices} of scene.parts)if(!offsets.has(vertices))offsets.set(vertices,vertices.map(v=>{
    const d=offset(v.p);return d?.some(Boolean)?d:stationary;
  }));
  const gain=safeGain(scene,offsets);
  const warped=vertices=>{
    if(!cache.has(vertices))cache.set(vertices,vertices.map((vertex,index)=>{
      const d=offsets.get(vertices)[index];
      if(d===stationary)return vertex;
      // 기존 명암 법선을 국소 변형의 역전치로 운반한다. 눈·입의 부속 표면도 같은 연속장에 놓는다.
      const columns=[0,1,2].map(i=>{
        const a=vertex.p.slice(),b=vertex.p.slice();a[i]-=eps;b[i]+=eps;
        const left=offset(a),right=offset(b);
        return [0,1,2].map(k=>Number(i===k)+gain*((right?.[k]||0)-(left?.[k]||0))/(2*eps));
      });
      const co=[cross(columns[1],columns[2]),cross(columns[2],columns[0]),cross(columns[0],columns[1])];
      const normal=[0,1,2].map(k=>co.reduce((s,n,i)=>s+n[k]*vertex.n[i],0)),len=Math.hypot(...normal);
      return {...vertex,p:vertex.p.map((x,k)=>x+gain*d[k]),n:normal.map(x=>x/len)};
    }));
    return cache.get(vertices);
  };
  return {...scene,sculptGain:gain,parts:scene.parts.map(part=>({...part,vertices:warped(part.vertices)}))};
}
export function displayScene(model,base,scene){
  if(model.id!=='W')return scene;
  return {...scene,frame:model.camera.frame,cameraCenter:model.camera.cameraCenter,
    parts:[...scene.parts,...surfaceParts(model.bindings[base],scene.parts[0])]};
}
export function renderSculpt(model,scene,view){
  return portraitAtResolution(portraitPixels,model.settings,{sceneOverride:scene,portrait:model.id==='W'?false:'face',
    yaw:view.yaw,pitch:view.pitch,freeOrbit:true,cameraZoom:view.zoom},view.size);
}
export function surfaceZones(scene,id){
  const h=id==='W'?0:scene.landmarks.chin[1],f=scene.paperShape?.frame?.(1);
  const defs=id==='W'?[
    ['rib','갈비우리','ribWidth','ribDepth',[.56,5.77,.32]],
    ['breast','가슴 앞면','breastWidth','projection',[f.c+.14,(f.foot+f.top)/2,.66]],
    ['lower','가슴 밑면','projection','lower',[f.c,f.foot+.10,.46]]
  ]:[
    ['chin','턱끝','chin','chinHeight',[0,h+.035,.65]],
    ['jaw','턱 모서리','jaw','throat',[.26,h+.095,.43]],
    ['throat','턱밑·목 앞','throatDepth','throat',[0,h-.09,.36]],
    ['mid','중안면','mid','midHeight',[0,h+.35,.69]],
    ['cheek','볼','cheek','midHeight',[.27,h+.31,.48]]
  ];
  const vertices=scene.parts[0].vertices;
  const skin=scene.parts.filter(p=>p.vertices===vertices);
  const indices=[...new Set(skin.flatMap(p=>p.faces.flat()))];
  return defs.map(([key,label,xAxis,yAxis,p])=>{
    const nearest=sign=>{
      const target=[p[0]*sign,p[1],p[2]];
      let index=0,nearestD=Infinity;
      for(const i of indices){const q=vertices[i].p,d=(q[0]-target[0])**2+(q[1]-target[1])**2+(q[2]-target[2])**2;
        if(d<nearestD){nearestD=d;index=i;}}
      return index;
    };
    return {key,label,xAxis,yAxis,indices:[...new Set([nearest(1),nearest(-1)])]};
  });
}
export function surfaceProjection(frame,model,scene,view){
  const camera=frame.projection?frame:renderPixels(model.settings,{sceneOverride:{...scene,parts:[]},portrait:'face',freeOrbit:true,
    yaw:view.yaw,pitch:view.pitch,cameraZoom:view.zoom*160/184,studyResolution:192});
  const yaw=camera.coordinates.yaw*Math.PI/180,pitch=camera.coordinates.pitch*Math.PI/180;
  const depth=([x,y,z])=>Math.sin(pitch)*y+Math.cos(pitch)*(Math.cos(yaw)*z-Math.sin(yaw)*x);
  const ratio=frame.width/camera.width;
  return {depth,point:p=>projectPoint(camera,p).map(q=>q*ratio)};
}
export function screenAnchors(frame,model,scene,view,zones){
  const camera=surfaceProjection(frame,model,scene,view),root=scene.parts[0],depth=camera.depth;
  return zones.map(zone=>{
    const index=zone.indices.reduce((a,b)=>depth(root.vertices[a].p)>depth(root.vertices[b].p)?a:b);
    const v=root.vertices[index],point=camera.point(v.p);
    return {...zone,index,point,front:depth(v.n)>-.05};
  });
}
export function plateInfo(model,key,assets,study47=false){
  if(model.id==='W'){
    const c=assets.traces.paper[key],rec=assets.chest.paper[key];
    return {image:'wallner-fig1-crop35.webp',width:c.size[0],height:c.size[1],bounds:[-c.box[0],-c.box[1],1137,1143],
      page:'https://doi.org/10.1007/s00266-021-02753-y',observed:c.lines,
      lines:sc=>chestOutline(sc,model.neutral,rec),credit:'Wallner 등 · 그림 1 · CC BY 4.0. 관측선과 가시 피부 하부를 고정 구도에 투영합니다.'};
  }
  const record=assets.face.cases[model.id], newView=study47?assets.face47.cases[model.id].views.find(v=>v.key===key):null;
  const oblique=newView?{...newView,pose:newView.registrations[0]}:record.views.find(v=>v.key===key);
  if(oblique){
    const [x,y,w,h]=oblique.crop,[iw,ih]=oblique.size;
    const anchorScene=key.startsWith('설정')?model.reg.before:(study47&&model.id==='F02'?model.next:model.prior);
    const cam=cameraAt(oblique.pose.yaw,oblique.pose.pitch,landmarks(anchorScene),oblique.anchors);
    const stored=newView&&assets.faceOverlay47.cases[model.id].views.find(v=>v.key===key);
    const initial=model.id==='F02'?model.next:model.prior;
    const lines=scene=>stored&&scene===model.round47?stored.after:stored&&scene===initial?stored.before:visibleEdges(scene,cam);
    return {image:oblique.source,page:oblique.page,width:248,height:248,bounds:[-x*248/w,-y*248/h,iw*248/w,ih*248/h],
      observed:oblique.jaw,pointCloud:true,lines,credit:newView?('47차 '+(newView.newAfterFreeze?'동결 뒤 처음 연 원화':'고정 정합 원화')+' · 눈·코·입 정합 잔차 '+oblique.pose.rms.toFixed(2)+'px · '+newView.limits):oblique.role+' · '+oblique.registration+' · '+oblique.limits};
  }
  const side=key==='side',ref=assets.traces.faces[model.id],range=record.sideRange;
  const crop=ps=>ps.filter(([x])=>x>=range[0]&&x<=range[1]);
  return {image:model.record.views[side?2:0].url,width:248,height:248,bounds:[0,0,248,248],page:model.record.source,
    observed:side?[crop(ref.side)]:[ref.front],lines:scene=>side?[crop(underside(scene,model.reg,ref))]:faceLines(scene,model.reg).front,
    credit:side?'공식 설정화 3 · 관측 범위 x='+range.join('–')+'px. 옆머리와 옷깃 뒤의 목은 가려집니다.':'공식 설정화 1 · 같은 정면 카메라에서 피부의 좌우 외곽을 비교합니다.'};
}

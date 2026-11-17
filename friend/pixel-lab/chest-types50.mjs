import {chestOptions50} from './chest-options50.mjs';
import {shapeBody50,poseBody50,poseFit50,rotateNormals50,material50} from './body-multiview50.mjs';
import {typeFits50} from './chest-fit-types50.mjs';
import {refineMarkerSkin50} from './chest-markers50.mjs';
import {markerLevels50,markerFront50} from './chest-marker-levels50.mjs';
export {chestOptions50};
const imports=new Map();
async function modules(root){
 const names=['definition-model','model','bust34','paper-rig35','ribcage35-review','fitting35','morph33','chest-design','body-design','renderer','studio-sculpt-model','surface35','camera35','rig32','chest49'];
 if(!imports.has(root.href))imports.set(root.href,Promise.all(names.map(name=>import(new URL(name+'.mjs',root).href))).then(
  ([definition,model,bust,paper,review,fitting,morph,chest,body,renderer,studio,surface,camera,rig,poses])=>({
   prepareDefinition:definition.prepareDefinition,definitionScene:definition.definitionScene,renderDefinitionPair:definition.renderDefinitionPair,
   DEFAULTS:model.DEFAULTS,form34:bust.form34,pose34:bust.pose34,raisedPose:bust.raisedPose,paperRig:paper.paperRig,
   reviewRig35:review.reviewRig35,fittedChest:fitting.fittedChest,morphForm:morph.morphForm,chestPresets:morph.chestPresets,
   chestPreset:chest.chestPreset,bodyPreset:body.bodyPreset,bodyParts:renderer.bodyParts,sculpt:studio.sculpt,
   zero:studio.zero,posed:studio.posed,sculptPresets:studio.presets,bindSurface:surface.bindSurface,surfaceParts:surface.surfaceParts,
   studyView:camera.studyView,loadRig:rig.loadRig,poseChest49:poses.poseChest49
  })));
 return imports.get(root.href);
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ramp=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
function materialMap(scene,id){
 if(scene.paperShape&&scene.restSkin35)return scene;
 const body=scene.parts[0],sh=scene.joints.right.shoulder,hp=scene.joints.right.hip,w=Math.abs(sh[0]),h=sh[1]-hp[1];
 const c=w*.49,root=w*.43,top=hp[1]+.95*h,foot=hp[1]+.60*h;
 const frame=hand=>({c:hand*c,root,top,foot,h:top-foot});
 return {...scene,restSkin35:scene.restSkin35||body.vertices,paperShape:{frame,scale:top-foot,form:{id}}};
}
export async function createChestStudy50(id,assets={}){
 const entry=chestOptions50.find(row=>row.id===id);if(!entry)throw RangeError('가슴 원형 선택을 확인하세요.');
 const root=assets.pixelLabRoot?new URL(assets.pixelLabRoot,import.meta.url):new URL('./',import.meta.url);
 const api=await modules(root);await api.loadRig();
 const [family,code]=id.split(':'),settings={...api.DEFAULTS,heads:8,sex:'female',designStyle:'manga',paperForm:'W',top:'none',showNac:true};
 let raw,base40;
 if(family==='W'||family==='sculpt'){
  const result=api.prepareDefinition('W',assets);raw=result.model.round49;base40=result.model.prior;
  if(family==='sculpt')raw=api.sculpt(raw,'W',{...api.zero('W'),...api.sculptPresets('W')[Number(code)][1]});
 }else if(family==='paper'||family==='review'){
  settings.paperForm=code;raw=family==='paper'?api.paperRig(settings):api.reviewRig35(settings);
 }else if(family==='atlas'){
  const atlas=assets.atlas||await fetch(new URL('atlas35.json',root)).then(r=>{if(!r.ok)throw Error('원사진 대조 자료를 열 수 없습니다.');return r.json();});
  raw=api.fittedChest(settings,atlas.bodies.find(r=>r.id===code));
 }else if(family==='form34')raw=api.form34(settings,code);
 else if(family==='morph33')raw=api.morphForm(settings,{},Object.values(api.chestPresets)[Number(code)]);
 else{
  Object.assign(settings,api.bodyPreset('balanced'),code==='body'?{}:api.chestPreset(code));
  // 실제 보존 도구는 DEFAULTS의 paperForm=W를 유지한다. 해부 표식은 아래에서 한 번만 바인딩한다.
  const native=api.bodyParts(settings);raw={...native,parts:native.parts.filter(p=>!/^(areola|papilla)35-/.test(p.name))};
  const sh=raw.joints.right.shoulder,hp=raw.joints.right.hip;
  const width=raw.proportions.shoulder;
  const fit=await import(new URL('paper-shape35.mjs',root).href);
  const torso=fit.paperShape(settings,raw.proportions.chest,hp[1],sh[1]+.08);
  raw.surfaceAnchors=[-1,1].map(k=>torso.marker(k));
  raw.surfaceFrame50={right:{shoulder:[width,sh[1]+.08,0],hip:hp}};
 }
 raw=materialMap(raw,id);
 const camera=api.studyView(raw,false).sceneOverride;
 const study={id,entry,settings,raw,base40,scene:raw,portrait:false,camera,api,marksCache:new WeakMap(),reboundCache:new WeakMap(),markerLevel:markerLevels50[id]||0};
 study.candidate=id==='W'?shapeBody50(raw,base40,raw,'weighted'):typeNeutral50(study,typeFits50[id]?.pair);
 study.scene=editChestStudy50(study,{version:'source'});return study;
}
export function typeNeutral50(study,pair){
 const raw=study.raw,[down,depth]=pair||[0,0];
 if(!down&&!depth)return raw;
 const mesh=raw.parts[0],vs=mesh.vertices.slice(),scale=raw.paperShape.scale;
 for(let i=0;i<vs.length;i++){
  const m=material50(raw,i);if(!m)continue;const {u,q}=m;
  const weight=ramp(.46,.64,u)*(1-ramp(.91,1.035,u))*(1-ramp(.65,.95,Math.abs(q)))*Math.exp(-.5*(((u-.82)/.14)**2+((q+.08)/.52)**2));
  if(weight<.00001)continue;
  const v=vs[i],p=v.p.slice();p[1]+=scale*down*weight;p[2]+=scale*depth*weight;vs[i]={...v,p};
 }
 rotateNormals50(mesh.vertices,vs,mesh.faces);
 return {...raw,parts:raw.parts.map(m=>m.vertices===mesh.vertices?{...m,vertices:vs}:m)};
}
function proceduralPose(scene,angle,pivot){
 if(!angle)return scene;
 const arm=/^(upper-arm|forearm|elbow|palm|thumb|finger|mitten|deltoid)$/;
 const axis=pivot==='shoulder.bend'?0:pivot==='shoulder.turn'?1:2;
 const rotate=(v,center,a)=>{const p=v.map((x,k)=>x-center[k]),l=(axis+1)%3,r=(axis+2)%3,c=Math.cos(a),s=Math.sin(a),x=p[l],y=p[r];p[l]=c*x-s*y;p[r]=s*x+c*y;return p.map((x,k)=>x+center[k]);};
 return {...scene,parts:scene.parts.map(m=>{
  if(!arm.test(m.name))return m;
  const side=m.vertices[0].p[0]<0?-1:1,sh=scene.joints[side<0?'left':'right'].shoulder,theta=(axis===0?-1:side)*angle*Math.PI/180;
  return {...m,vertices:m.vertices.map(v=>({...v,p:rotate(v.p,sh,theta),n:rotate(v.n,[0,0,0],theta)}))};
 })};
}
export function typePose50(study,rest,{angle=0,pivot='arms.raise',pose='neutral'}={}){
 if(study.id.startsWith('design:'))return proceduralPose(rest,angle,pivot);
 if(pose==='waist'||pose==='behindHead')return study.api.poseChest49(rest,pose);
 if(angle===0)return rest;
 if(pivot==='arms.raise')return study.api.pose34(rest,study.api.raisedPose(angle)).scene;
 return study.api.posed(rest,'W',{pivot,angle});
}
export function editChestStudy50(study,edit={}){
 const {api,id,raw,settings,camera}=study;
 const version=edit.version||'candidate',fit=typeFits50[id]||{pair:[0,0],pose:0};
 const target=version==='source'?raw:study.candidate;
 const rest=edit.values?api.sculpt(target,'W',{...api.zero('W'),...edit.values}):target;
 const moved=typePose50(study,rest,edit);
 const posed=version==='source'||!rest.tissue34?moved:poseBody50(rest,moved,'weighted',{...poseFit50,smooth:poseFit50.smooth*(id==='W'?1:fit.pose)});
 let refs=edit.surface?undefined:study.marksCache.get(rest);
 if(refs===undefined){
  refs=api.bindSurface(rest.surfaceFrame50?{...rest,joints:rest.surfaceFrame50}:rest,{...settings,...edit.surface});
  if(!edit.surface)study.marksCache.set(rest,refs);
 }
 if(edit.markerVersion==='rebound'&&study.markerLevel&&refs){
  if(!study.reboundCache.has(refs)){
   const front=markerFront50[id]||0;
   study.reboundCache.set(refs,refineMarkerSkin50(refs,rest.parts[0],study.markerLevel,front>0,front));
  }
  refs=study.reboundCache.get(refs);
 }
 return {...posed,parts:[...posed.parts,...api.surfaceParts(refs,posed.parts[0])],frame:camera.frame,cameraCenter:camera.cameraCenter};
}

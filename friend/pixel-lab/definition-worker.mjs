import {prepareDefinition,definitionScene,renderDefinitionPair,renderDefinitionView} from './definition-model.mjs?v=51-framing';
import {loadRig} from './rig32.mjs';
import {surfaceZones} from './studio-sculpt-model.mjs?v=50-zones';
import {createFaceStudy50,faceOptions50} from './face-library50.mjs';
import {isChestSubject} from './workbench-subjects50.mjs';
import {createChestStudy50,editChestStudy50} from './chest-types50.mjs';
import {cheekEnvelope50} from './face-envelope50.mjs';
import {candidateLibraryFace50,libraryChecks50} from './face-library-cheek50.mjs';
import {candidateLibraryHeight50,libraryHeightChecks50} from './face-library-height50.mjs';
import {candidateFaceSurface50,variants50} from './face-surface50.mjs';
import {candidateLibraryProfile50} from './face-library-profile50.mjs';
import {candidateOrbit51} from './face51.mjs';
import {editChest51} from './chest51.mjs';
import {appearanceScene52} from './appearance52.mjs';
import {bodyStudy52} from './chest52.mjs';
import {candidateJawBand52} from './face-jaw52.mjs';
import {fitResearchHead52} from './head-fit52.mjs';
import {applyTorso53} from './torso53.mjs';
import {candidateFace53} from './face53.mjs';
import {editChest53} from './chest53.mjs';
import {poseShoulders54} from './shoulder-rig54.mjs';
import {poseJoinedPelvis53} from './pelvis-pose53.mjs';
import {candidateFace54} from './face54.mjs';
import {editChest54,poseReference54} from './chest54.mjs';
async function load(name){
  const response=await fetch(new URL(name+'.json',import.meta.url));
  if(!response.ok)throw new Error(name+' 자료 '+response.status);
  return response.json();
}
let assetsPromise,loaded,shape,editKey,zones;
self.onmessage=async ({data})=>{
  try {
    if(!assetsPromise)assetsPromise=Promise.all([load('atlas35'),load('traces36'),load('fit36'),loadRig()]).catch(e=>{assetsPromise=null;throw e;});
    const [atlas,traces,fit]=await assetsPromise;
    const {id,serial,edit,view}=data;
    if(loaded?.id!==id){
      const assets={atlas,traces,fit};
      const extra=faceOptions50.some(option=>option.id===id&&!option.preserved);
      if(data.single&&isChestSubject(id))loaded=await createChestStudy50(id,assets);
      else if(extra){
        loaded=createFaceStudy50(id,assets);
        loaded.model={id,round49:loaded.scene};
      }else loaded=prepareDefinition(id,assets);
      editKey=null;zones=null;
    }
    const key=JSON.stringify(edit||{});
    if(key!==editKey){
      if(loaded.entry){
        if(edit?.version==='tissue54')shape=editChest54(loaded,edit,editChestStudy50);
        else if(edit?.version==='matched53')shape=poseReference54(loaded,edit,editChestStudy50);
        else if(edit?.version==='tissue53')shape=editChest53(loaded,edit,editChestStudy50);
        else if(edit?.version==='lower51')shape=editChest51(loaded,edit,editChestStudy50);
        else if(id==='W'&&['floor52','lowerContact52'].includes(edit?.version)){
          shape=editChestStudy50(bodyStudy52(loaded,edit.version),{...edit,version:'candidate'});
        }else shape=editChestStudy50(loaded,edit);
      }else if(['F02','M01'].includes(id)&&['face54','support54'].includes(edit?.version)){
        loaded.faces54??=new Map();
        if(!loaded.faces54.has(edit.version))loaded.faces54.set(edit.version,candidateFace54(loaded.model.round49,id,loaded.settings,edit.version==='face54'?'study':'support'));
        shape=definitionScene({...loaded,model:{...loaded.model,round49:loaded.faces54.get(edit.version)}},edit);
      }else if(['F02','M01'].includes(id)&&['face53','field53'].includes(edit?.version)){
        loaded.faces53??=new Map();
        if(!loaded.faces53.has(edit.version))loaded.faces53.set(edit.version,candidateFace53(loaded.model.round49,id,loaded.settings,edit.version==='face53'?'study':'field'));
        shape=definitionScene({...loaded,model:{...loaded.model,round49:loaded.faces53.get(edit.version)}},edit);
      }else if(id==='F02'&&['jawNormal52','jawBoth52'].includes(edit?.version)){
        loaded.cheek50??=cheekEnvelope50(loaded.model.round49,id,loaded.model.reg.before,.85,true);
        loaded.jaws52??=new Map();
        if(!loaded.jaws52.has(edit.version))loaded.jaws52.set(edit.version,candidateJawBand52(loaded.cheek50,id,edit.version==='jawNormal52'?'normals':'combined'));
        shape=definitionScene({...loaded,model:{...loaded.model,round49:loaded.jaws52.get(edit.version)}},edit);
      }
      else if(['orbit51','contact51'].includes(edit?.version)){
        const base=candidateOrbit51(loaded.model.round49,id,loaded.settings,edit.version==='contact51'?'contact':'study');
        shape=definitionScene({...loaded,model:{...loaded.model,round49:base}},edit);
      }
      else if(['F01','F05','M03'].includes(id)&&['smooth','half','ablation'].includes(edit?.version)){
        loaded.depthShapes??=new Map();
        if(!loaded.depthShapes.has(edit.version)){
          const record=atlas.faces.find(r=>r.id===id);
          loaded.depthShapes.set(edit.version,candidateLibraryProfile50(loaded,record,edit.version));
        }
        shape=definitionScene({...loaded,model:{...loaded.model,round49:loaded.depthShapes.get(edit.version)}},edit);
      }
      else if(['F02','M01'].includes(id)&&variants50.includes(edit?.version)){
        const base=candidateFaceSurface50(loaded.model.round49,id,edit.version);
        shape=definitionScene({...loaded,model:{...loaded.model,round49:base}},edit);
      }
      else if(id==='F02'&&data.single&&edit?.version==='candidate'){
        loaded.cheek50??=cheekEnvelope50(loaded.model.round49,id,loaded.model.reg.before,.85,true);
        shape=definitionScene({...loaded,model:{...loaded.model,round49:loaded.cheek50}},edit);
      }else if(Object.hasOwn(libraryChecks50,id)&&edit?.version==='candidate'){
        loaded.cheek50??=candidateLibraryFace50(loaded.scene,id);
        shape=definitionScene({...loaded,model:{...loaded.model,round49:loaded.cheek50}},edit);
      }else if(Object.hasOwn(libraryHeightChecks50,id)&&edit?.version==='height'){
        loaded.height50??=candidateLibraryHeight50(loaded.scene,id);
        shape=definitionScene({...loaded,model:{...loaded.model,round49:loaded.height50}},edit);
      }else shape=definitionScene(loaded,edit);
      if(edit?.appearance){
        const appearance=edit.appearance;
        const donor=faceOptions50.find(o=>o.id===appearance.researchFace&&id.startsWith(o.sex+'-'));
        if(donor){
          loaded.researchHeads??=new Map();
          if(!loaded.researchHeads.has(donor.id))loaded.researchHeads.set(donor.id,createFaceStudy50(donor.id,{atlas,traces,fit}));
          const head=loaded.researchHeads.get(donor.id);
          let selectedHead=head.scene;
          if(appearance.researchFaceVersion==='face54'&&['F02','M01'].includes(donor.id)){
            head.candidate54??=candidateFace54(head.scene,donor.id,head.settings,'study');
            selectedHead=head.candidate54;
          }
          const hair=appearanceScene52(head,selectedHead,{hair:appearance.hair});
          const body=appearanceScene52(loaded,shape,{muscularity:appearance.muscularity,adiposity:appearance.adiposity});
          shape=fitResearchHead52(loaded,body,head,hair);
        }else shape=appearanceScene52(loaded,shape,appearance);
        shape=applyTorso53(loaded,shape,edit?.nativeHip?{...appearance,pelvisJoin53:true}:appearance);
      }
      if(edit?.nativeHip&&!edit.appearance)shape=applyTorso53(loaded,shape,{pelvisJoin53:true});
      if(edit?.nativeShoulder)shape=poseShoulders54(shape,edit.nativeShoulder);
      if(edit?.nativeHip)shape=poseJoinedPelvis53(shape,edit.nativeHip);
      editKey=key;
    }
    if(data.single){
      const frame=renderDefinitionView(loaded,shape,view);
      const raw=loaded.raw||loaded.model?.round49;
      zones??=raw?surfaceZones(raw,loaded.entry?'W':id).map(({key,label,xAxis,yAxis})=>({key,label,xAxis,yAxis})):[];
      self.postMessage({serial,id,size:view.size,zones,markerLevel:loaded.markerLevel,source:loaded.entry?.source||loaded.evidence?.page||loaded.model?.record?.source,buffer:frame.data.buffer},[frame.data.buffer]);
      return;
    }
    const {high,pixel,highMs,pixelMs}=renderDefinitionPair(loaded,shape,view);
    self.postMessage({serial,id,view,high:high.data.buffer,pixel:pixel.data.buffer,highMs,pixelMs},
      [high.data.buffer,pixel.data.buffer]);
  }catch(e){self.postMessage({serial:data.serial,error:e.message});}
};

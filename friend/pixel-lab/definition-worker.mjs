import {prepareDefinition,definitionScene,renderDefinitionPair,renderDefinitionView} from './definition-model.mjs';
import {loadRig} from './rig32.mjs';
import {surfaceZones} from './studio-sculpt-model.mjs';
import {createFaceStudy50,faceOptions50} from './face-library50.mjs';
import {isChestSubject} from './workbench-subjects50.mjs';
import {createChestStudy50,editChestStudy50} from './chest-types50.mjs';
import {cheekEnvelope50} from './face-envelope50.mjs';
import {candidateLibraryFace50,libraryChecks50} from './face-library-cheek50.mjs';
import {candidateLibraryHeight50,libraryHeightChecks50} from './face-library-height50.mjs';
import {candidateFaceSurface50,variants50} from './face-surface50.mjs';
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
      if(loaded.entry)shape=editChestStudy50(loaded,edit);
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
      editKey=key;
    }
    if(data.single){
      const frame=renderDefinitionView(loaded,shape,view);
      const raw=loaded.raw||loaded.model?.round49;
      zones??=raw?surfaceZones(raw,loaded.entry?'W':id).map(({key,label,xAxis,yAxis})=>({key,label,xAxis,yAxis})):[];
      self.postMessage({serial,id,size:view.size,zones,source:loaded.entry?.source||loaded.evidence?.page||loaded.model?.record?.source,buffer:frame.data.buffer},[frame.data.buffer]);
      return;
    }
    const {high,pixel,highMs,pixelMs}=renderDefinitionPair(loaded,shape,view);
    self.postMessage({serial,id,view,high:high.data.buffer,pixel:pixel.data.buffer,highMs,pixelMs},
      [high.data.buffer,pixel.data.buffer]);
  }catch(e){self.postMessage({serial:data.serial,error:e.message});}
};

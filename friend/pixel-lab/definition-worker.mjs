import {prepareDefinition,definitionScene,renderDefinitionPair} from './definition-model.mjs';
import {loadRig} from './rig32.mjs';
async function load(name){
  const response=await fetch(new URL(name+'.json',import.meta.url));
  if(!response.ok)throw new Error(name+' 자료 '+response.status);
  return response.json();
}
let assetsPromise,loaded,shape,editKey;
self.onmessage=async ({data})=>{
  try {
    if(!assetsPromise)assetsPromise=Promise.all([load('atlas35'),load('traces36'),load('fit36'),loadRig()]).catch(e=>{assetsPromise=null;throw e;});
    const [atlas,traces,fit]=await assetsPromise;
    const {id,serial,edit,view}=data;
    if(loaded?.id!==id){loaded=prepareDefinition(id,{atlas,traces,fit});editKey=null;}
    const key=JSON.stringify(edit||{});
    if(key!==editKey){shape=definitionScene(loaded,edit);editKey=key;}
    const {high,pixel,highMs,pixelMs}=renderDefinitionPair(loaded,shape,view);
    self.postMessage({serial,id,view,high:high.data.buffer,pixel:pixel.data.buffer,highMs,pixelMs},
      [high.data.buffer,pixel.data.buffer]);
  }catch(e){self.postMessage({serial:data.serial,error:e.message});}
};

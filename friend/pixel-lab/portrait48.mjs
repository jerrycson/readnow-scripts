import {renderPixels} from './renderer.mjs?ui=49-review-4c7e86d4';
import {materialLibrary} from './materials.mjs?ui=49-review-4c7e86d4';

const code=(r,g,b)=>(r<<16)|(g<<8)|b;
// Supersample the posed, depth-tested face. Preserve thin ink only where
// several subpixels actually see the same feature.
export function portraitPixels(settings,options){
  if(settings.resolution!==48||options.studyResolution||options.portrait!=='face'||
     !options.sceneOverride.parts.some(p=>p.name==='mouth-line34'))return renderPixels(settings,options);
  const high=renderPixels(settings,{...options,studyResolution:192,cameraZoom:(options.cameraZoom??1)*160/184});
  const mats=materialLibrary(settings),pigments=new Map();
  for(const [name,group] of [['mouth-ink34',1],['face-ink',2],['portrait-pupil',2]])for(const rgb of mats[name].colors)pigments.set(code(...rgb),group);
  const data=new Uint8ClampedArray(48*48*4);
  for(let y=0;y<48;y++)for(let x=0;x<48;x++){
    const sums=[0,0,0],ink=[0,0,0];let count=0,marked=0;
    for(let j=0;j<4;j++)for(let i=0;i<4;i++){
      const p=((4*y+j)*192+4*x+i)*4,d=high.data;if(!d[p+3])continue;
      count++;const markedPixel=pigments.has(code(d[p],d[p+1],d[p+2]));
      if(markedPixel)marked++;
      for(let k=0;k<3;k++){sums[k]+=d[p+k];if(markedPixel)ink[k]+=d[p+k];}
    }
    if(count<5)continue;
    const index=(48*y+x)*4,boost=marked>=2?Math.min(.56,marked/count*1.45):0;
    for(let k=0;k<3;k++)data[index+k]=(1-boost)*sums[k]/count+(marked?boost*ink[k]/marked:0);
    data[index+3]=255;
  }
  return {width:48,height:48,data};
}

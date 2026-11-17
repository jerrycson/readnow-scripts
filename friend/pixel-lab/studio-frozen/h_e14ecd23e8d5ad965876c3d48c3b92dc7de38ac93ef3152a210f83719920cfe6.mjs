import {buildShadowMap} from './h_9422b44840f181f9c4b9035581770fcd7c3127f6039b6569ef1b3ce44ede0973.mjs';
import {validateSettings,normalizeAngle} from './h_83682298928c0cff20455ddb98e1a1e9e2f56c51fe793704808b9f4481c668af.mjs';
import {humanScene} from './h_bb3c8a95600493e531d08774c5b0db0950fbe07ea66e4f603575aea3a9a25821.mjs';
import {creatureScene} from './h_6caa8afd7c97f42557a16a7716e7c187c65e3a6d4994f6d507b899e47f958825.mjs';
import {norm} from './h_012707cff711206a2d665296f9a4e116eeda05818d85e83dd0a4bfa29c5a8103.mjs';
import {materialLibrary,shade} from './h_694dc205f47d737321b6718108897766e43b468ff400a8178e7b7922ac0f25b6.mjs';
export function bodyParts(settings,phase=0,action='idle',study={}){const s=validateSettings(settings);return s.species==='human'?humanScene(s,phase,action,study):creatureScene(s,phase,action);}
function rotation(yaw,pitch){
 const y=normalizeAngle(yaw)*Math.PI/180,p=normalizeAngle(pitch)*Math.PI/180,cy=Math.cos(y),sy=Math.sin(y),cp=Math.cos(p),sp=Math.sin(p);
 return v=>{const x=cy*v[0]+sy*v[2],z=-sy*v[0]+cy*v[2];return [x,cp*v[1]-sp*z,sp*v[1]+cp*z];};
}
export function renderPixels(settings,{yaw=0,pitch=0,phase=0,action='idle',outline=true,breathAmplitude,portrait=false,sceneOverride,studyResolution,castShadows=false}={}){
 if(studyResolution!==undefined&&![128,192,256].includes(studyResolution))throw new Error('연구용 원본 크기는 128·192·256px입니다.');
 const s=validateSettings(settings),w=studyResolution||s.resolution,h=w,data=new Uint8ClampedArray(w*h*4),depthBuffer=new Float32Array(w*h).fill(-Infinity);
 const scene=sceneOverride||bodyParts(s,phase,action,{breathAmplitude}),rot=rotation(yaw,pitch),detailJoint=portrait==='hand'?scene.joints?.right?.wrist:portrait==='foot'?scene.joints?.right?.ankle:null,scale=(w-8)/(portrait==='hand'?1.08:portrait==='foot'?1.28:portrait==='ear'?.76:portrait==='legs'?scene.height*.57:portrait==='torso'?3.8:portrait==='hair'?3.2:portrait?1.48:scene.frame),mats=materialLibrary(s);
 const center=detailJoint?detailJoint[1]+(portrait==='hand'?-.30:-.08):portrait==='ear'?scene.height-.56:portrait==='legs'?scene.height*.26:portrait==='torso'?scene.height*.66:portrait==='hair'?scene.height-1.1:portrait?scene.height-.48:scene.cameraCenter?.[1]??scene.height/2;
 const centerX=detailJoint?detailJoint[0]:portrait?0:scene.cameraCenter?.[0]||0,centerZ=detailJoint?detailJoint[2]+(portrait==='foot'?.20:0):portrait==='face'?(scene.faceCenter?.[2]??0):portrait?0:scene.cameraCenter?.[2]||0;
 const shadows=castShadows?buildShadowMap(scene,rot,portrait):null;
 const transform=v=>{const p=rot([v.p[0]-centerX,v.p[1]-center,v.p[2]-centerZ]);return{x:w/2+p[0]*scale,y:h/2-p[1]*scale,z:p[2],n:rot(v.n),world:v.p};};
 function triangle(a,b,c,material){
  const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<1e-7)return;
  const minX=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),maxX=Math.min(w-1,Math.ceil(Math.max(a.x,b.x,c.x))),minY=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),maxY=Math.min(h-1,Math.ceil(Math.max(a.y,b.y,c.y)));
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
   const u=((b.y-c.y)*(x+.5-c.x)+(c.x-b.x)*(y+.5-c.y))/den,v=((c.y-a.y)*(x+.5-c.x)+(a.x-c.x)*(y+.5-c.y))/den,z=1-u-v;
   if(u<0||v<0||z<0)continue;const index=y*w+x,d=u*a.z+v*b.z+z*c.z;if(d<=depthBuffer[index])continue;
   depthBuffer[index]=d;
   const normal=norm(a.n.map((q,i)=>u*q+v*b.n[i]+z*c.n[i])),pos=a.world.map((q,i)=>u*q+v*b.world[i]+z*c.world[i]);
   data.set([...shade(material,normal,pos,w,shadows?shadows.visibility(pos,normal):1),255],index*4);
  }
 }
 for(const mesh of scene.parts){const vertices=mesh.vertices.map(transform),material=mats[mesh.mat];if(!material)throw new Error('Unknown material: '+mesh.mat);for(const [a,b,c]of mesh.faces)triangle(vertices[a],vertices[b],vertices[c],material);}
 if(outline){const alpha=new Uint8Array(w*h);for(let i=0;i<alpha.length;i++)alpha[i]=data[i*4+3];const color=s.species==='human'?mats.skin.colors[0]:[34,42,43];for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const k=y*w+x;if(!alpha[k]&&[k-1,k+1,k-w,k+w].some(i=>alpha[i]))data.set([...color,255],k*4);}}
 let opaque=0,minX=w,minY=h,maxX=-1,maxY=-1,clipped=false;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]){opaque++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);if(x===0||y===0||x===w-1||y===h-1)clipped=true;}
 return {width:w,height:h,data,projection:{scale,center:[centerX,center,centerZ]},groundRow:h/2+scene.height/2*scale,gait:scene.gait?{stride:scene.gait.stride*scale,stance:scene.gait.stance}:null,metrics:{opaque,bounds:[minX,minY,maxX,maxY],clipped,triangles:scene.parts.reduce((n,m)=>n+m.faces.length,0)},coordinates:{yaw:normalizeAngle(yaw),pitch:normalizeAngle(pitch),order:'Y-then-X',up:'world-positive-Y'},provenance:scene.provenance};
}
export function paintCanvas(canvas,result,scale=1){canvas.width=result.width;canvas.height=result.height;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.putImageData(new ImageData(result.data,result.width,result.height),0,0);canvas.style.width=result.width*scale+'px';canvas.style.height=result.height*scale+'px';}

export function projectPoint(result,point){const rotated=rotation(result.coordinates.yaw,result.coordinates.pitch)(point.map((v,i)=>v-result.projection.center[i]));return[result.width/2+rotated[0]*result.projection.scale,result.height/2-rotated[1]*result.projection.scale];}

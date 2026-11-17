import {buildShadowMap} from './shadow-map.mjs';
import {selectAnatomyDetail} from './detail-selection.mjs';
import {validateSettings,normalizeAngle} from './model.mjs';
import {humanScene} from './anatomy.mjs';
import {creatureScene} from './creatures.mjs';
import {norm} from './geometry.mjs';
import {materialLibrary,shade} from './materials.mjs';
export function bodyParts(settings,phase=0,action='idle',study={}){const s=validateSettings(settings);return s.species==='human'?humanScene(s,phase,action,study):creatureScene(s,phase,action);}
function rotation(yaw,pitch){
 const y=yaw*Math.PI/180,p=pitch*Math.PI/180,cy=Math.cos(y),sy=Math.sin(y),cp=Math.cos(p),sp=Math.sin(p);
 return v=>{const x=cy*v[0]+sy*v[2],z=-sy*v[0]+cy*v[2];return [x,cp*v[1]-sp*z,sp*v[1]+cp*z];};
}
export function renderPixels(settings,{yaw=0,pitch=0,phase=0,action='idle',outline=true,breathAmplitude,portrait=false,sceneOverride,studyResolution,castShadows=false,isolateDetail=false,freeOrbit=false,cameraZoom=1,screenOffset=[0,0],highDefinition=false}={}){
 if(studyResolution!==undefined&&![128,192,256,512].includes(studyResolution)&&!(highDefinition&&[1024,2048].includes(studyResolution)))throw new Error('연구용 원본 크기는 128·192·256·512px, 고해상도 원형은 1024·2048px입니다.');
 const angle=v=>freeOrbit&&Number.isFinite(v)?((v%360)+360)%360:normalizeAngle(v);
 yaw=angle(yaw);pitch=angle(pitch);
 const s=validateSettings(settings),w=studyResolution||s.resolution,h=w,data=new Uint8ClampedArray(w*h*4),depthBuffer=new Float32Array(w*h).fill(-Infinity);
 const originalScene=sceneOverride||bodyParts(s,phase,action,{breathAmplitude}),scene=isolateDetail?selectAnatomyDetail(originalScene,portrait):originalScene,rot=rotation(yaw,pitch),detailJoint=portrait==='hand'?scene.joints?.right?.wrist:portrait==='foot'?scene.joints?.right?.ankle:null,scale=Math.max(.1,Math.min(8,cameraZoom))*(w-8)/(scene.detailSelection?.frame??(portrait==='hand'?1.08:portrait==='foot'?1.28:portrait==='ear'?.76:portrait==='legs'?scene.height*.57:portrait==='chest'?Math.max(1.3,Math.abs(scene.joints.right.shoulder[0])*2.7):portrait==='torso'?3.8:portrait==='hair'?3.2:portrait?1.48:scene.frame)),mats=materialLibrary(s);
 const center=scene.detailSelection?.center[1]??(detailJoint?detailJoint[1]+(portrait==='hand'?-.30:-.08):portrait==='ear'?scene.height-.56:portrait==='legs'?scene.height*.26:portrait==='chest'?(scene.joints.right.shoulder[1]*.80+scene.joints.right.hip[1]*.20):portrait==='torso'?scene.height*.66:portrait==='hair'?scene.height-1.1:portrait?scene.height-.48:scene.cameraCenter?.[1]??scene.height/2);
 const centerX=scene.detailSelection?.center[0]??(detailJoint?detailJoint[0]:portrait?0:scene.cameraCenter?.[0]||0),centerZ=scene.detailSelection?.center[2]??(detailJoint?detailJoint[2]+(portrait==='foot'?.20:0):portrait==='chest'?.16:portrait==='face'?(scene.faceCenter?.[2]??0):portrait?0:scene.cameraCenter?.[2]||0);
 const shadows=castShadows?buildShadowMap(scene,rot,portrait):null;
 const transform=v=>{const p=rot([v.p[0]-centerX,v.p[1]-center,v.p[2]-centerZ]);return{x:w*(.5+screenOffset[0])+p[0]*scale,y:h*(.5+screenOffset[1])-p[1]*scale,z:p[2],n:rot(v.n),world:v.p};};
 function triangle(a,b,c,material,strain){
  const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<1e-7)return;
  const minX=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),maxX=Math.min(w-1,Math.ceil(Math.max(a.x,b.x,c.x))),minY=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),maxY=Math.min(h-1,Math.ceil(Math.max(a.y,b.y,c.y)));
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
   const u=((b.y-c.y)*(x+.5-c.x)+(c.x-b.x)*(y+.5-c.y))/den,v=((c.y-a.y)*(x+.5-c.x)+(a.x-c.x)*(y+.5-c.y))/den,z=1-u-v;
   if(u<0||v<0||z<0)continue;const index=y*w+x,d=u*a.z+v*b.z+z*c.z;if(d<=depthBuffer[index])continue;
   depthBuffer[index]=d;
   const normal=norm(a.n.map((q,i)=>u*q+v*b.n[i]+z*c.n[i])),pos=a.world.map((q,i)=>u*q+v*b.world[i]+z*c.world[i]);
   if(strain){data.set(strain===1?[220,84,41,255]:[51,139,197,255],index*4);continue;}
   data.set([...shade(material,normal,pos,w,shadows?shadows.visibility(pos,normal):1,highDefinition),255],index*4);
  }
 }
 const projected=new Map();
 for(const mesh of scene.parts){let vertices=projected.get(mesh.vertices);if(!vertices){vertices=mesh.vertices.map(transform);projected.set(mesh.vertices,vertices);}const material=scene.studyMaterials?.[mesh.mat]??mats[mesh.mat];if(!material)throw new Error('Unknown material: '+mesh.mat);for(let i=0;i<mesh.faces.length;i++){const [a,b,c]=mesh.faces[i];triangle(vertices[a],vertices[b],vertices[c],material,mesh.strain?.[i]);}}
 if(outline){const alpha=new Uint8Array(w*h);for(let i=0;i<alpha.length;i++)alpha[i]=data[i*4+3];const color=s.species==='human'?mats.skin.colors[0]:[34,42,43];for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const k=y*w+x;if(!alpha[k]&&[k-1,k+1,k-w,k+w].some(i=>alpha[i]))data.set([...color,255],k*4);}}
 let opaque=0,minX=w,minY=h,maxX=-1,maxY=-1,clipped=false;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]){opaque++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);if(x===0||y===0||x===w-1||y===h-1)clipped=true;}
 return {width:w,height:h,data,projection:{scale,screenOffset,center:[centerX,center,centerZ]},groundRow:h/2+scene.height/2*scale,gait:scene.gait?{stride:scene.gait.stride*scale,stance:scene.gait.stance}:null,metrics:{opaque,bounds:[minX,minY,maxX,maxY],clipped,triangles:scene.parts.reduce((n,m)=>n+m.faces.length,0)},coordinates:{yaw,pitch,order:'Y-then-X',up:'world-positive-Y'},provenance:scene.provenance};
}
export function paintCanvas(canvas,result,scale=1){canvas.width=result.width;canvas.height=result.height;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.putImageData(new ImageData(result.data,result.width,result.height),0,0);canvas.style.width=result.width*scale+'px';canvas.style.height=result.height*scale+'px';}

export function projectPoint(result,point){const rotated=rotation(result.coordinates.yaw,result.coordinates.pitch)(point.map((v,i)=>v-result.projection.center[i]));return[result.width*(.5+(result.projection.screenOffset?.[0]||0))+rotated[0]*result.projection.scale,result.height*(.5+(result.projection.screenOffset?.[1]||0))-rotated[1]*result.projection.scale];}

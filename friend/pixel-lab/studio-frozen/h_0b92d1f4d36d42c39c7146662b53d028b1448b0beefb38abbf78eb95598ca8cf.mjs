import {validateSettings,normalizeAngle} from './h_d37231e142d3c60041b78e723862b9e0138c8c8887cbb32d8125874ea2863a43.mjs';
import {humanScene} from './h_67e71d9d0122aab4a55c34447c10fc175061644e107a348dd77d776d15552776.mjs';
import {creatureScene} from './h_b6abc746120c0b825d7dbb414ebfdf16d13c81207c18aa34b1d0806f088c2ac8.mjs';
import {norm} from './h_012707cff711206a2d665296f9a4e116eeda05818d85e83dd0a4bfa29c5a8103.mjs';
import {materialLibrary,shade} from './h_db73dc1e2fd9491a87bf682f0f62485f566861408f9d651f25b7be9068fdf3f2.mjs';
export function bodyParts(settings,phase=0,action='idle'){const s=validateSettings(settings);return s.species==='human'?humanScene(s,phase,action):creatureScene(s,phase,action);}
function rotation(yaw,pitch){
 const y=normalizeAngle(yaw)*Math.PI/180,p=normalizeAngle(pitch)*Math.PI/180,cy=Math.cos(y),sy=Math.sin(y),cp=Math.cos(p),sp=Math.sin(p);
 return v=>{const x=cy*v[0]+sy*v[2],z=-sy*v[0]+cy*v[2];return [x,cp*v[1]-sp*z,sp*v[1]+cp*z];};
}
export function renderPixels(settings,{yaw=0,pitch=0,phase=0,action='idle',outline=true}={}){
 const s=validateSettings(settings),w=s.resolution,h=w,data=new Uint8ClampedArray(w*h*4),depthBuffer=new Float32Array(w*h).fill(-Infinity);
 const scene=bodyParts(s,phase,action),rot=rotation(yaw,pitch),scale=(w-8)/scene.frame,mats=materialLibrary(s);
 const transform=v=>{const p=rot([v.p[0],v.p[1]-scene.height/2,v.p[2]]);return{x:w/2+p[0]*scale,y:h/2-p[1]*scale,z:p[2],n:rot(v.n),world:v.p};};
 function triangle(a,b,c,material){
  const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<1e-7)return;
  const minX=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),maxX=Math.min(w-1,Math.ceil(Math.max(a.x,b.x,c.x))),minY=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),maxY=Math.min(h-1,Math.ceil(Math.max(a.y,b.y,c.y)));
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
   const u=((b.y-c.y)*(x+.5-c.x)+(c.x-b.x)*(y+.5-c.y))/den,v=((c.y-a.y)*(x+.5-c.x)+(a.x-c.x)*(y+.5-c.y))/den,z=1-u-v;
   if(u<0||v<0||z<0)continue;const index=y*w+x,d=u*a.z+v*b.z+z*c.z;if(d<=depthBuffer[index])continue;
   depthBuffer[index]=d;
   const normal=norm(a.n.map((q,i)=>u*q+v*b.n[i]+z*c.n[i])),pos=a.world.map((q,i)=>u*q+v*b.world[i]+z*c.world[i]);
   data.set([...shade(material,normal,pos,w),255],index*4);
  }
 }
 for(const mesh of scene.parts){const vertices=mesh.vertices.map(transform),material=mats[mesh.mat];if(!material)throw new Error('Unknown material: '+mesh.mat);for(const [a,b,c]of mesh.faces)triangle(vertices[a],vertices[b],vertices[c],material);}
 if(outline){const alpha=new Uint8Array(w*h);for(let i=0;i<alpha.length;i++)alpha[i]=data[i*4+3];const color=s.species==='human'?mats.skin.colors[0]:[34,42,43];for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const k=y*w+x;if(!alpha[k]&&[k-1,k+1,k-w,k+w].some(i=>alpha[i]))data.set([...color,255],k*4);}}
 let opaque=0,minX=w,minY=h,maxX=-1,maxY=-1,clipped=false;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]){opaque++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);if(x===0||y===0||x===w-1||y===h-1)clipped=true;}
 return {width:w,height:h,data,metrics:{opaque,bounds:[minX,minY,maxX,maxY],clipped,triangles:scene.parts.reduce((n,m)=>n+m.faces.length,0)},coordinates:{yaw:normalizeAngle(yaw),pitch:normalizeAngle(pitch),order:'Y-then-X',up:'world-positive-Y'},provenance:scene.provenance};
}
export function paintCanvas(canvas,result,scale=1){canvas.width=result.width;canvas.height=result.height;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.putImageData(new ImageData(result.data,result.width,result.height),0,0);canvas.style.width=result.width*scale+'px';canvas.style.height=result.height*scale+'px';}

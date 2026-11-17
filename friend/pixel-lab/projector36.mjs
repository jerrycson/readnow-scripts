import {SIZE,visibleWeight} from './hull36.mjs';
const cache=new WeakMap();
function project(mesh,angle,tilt,n,s,cx,cy){
 const a=angle*Math.PI/180,b=tilt*Math.PI/180,c=Math.cos(a),d=Math.sin(a),e=Math.cos(b),g=Math.sin(b),src=mesh.v,points=new Float32Array(src.length);
 for(let i=0;i<src.length;i+=3){const x=src[i],y=src[i+1],z=src[i+2],depth=z*c-x*d;
 points[i]=cx+s*(x*c+z*d);points[i+1]=cy-s*(y*e-depth*g);points[i+2]=y*g+depth*e;}return points;
}
function raster(mesh,points,n,draw){
 const buffer=new Float32Array(n*n).fill(-Infinity),f=mesh.f;
 for(let k=0;k<f.length;k+=3){
  const i=3*f[k],j=3*f[k+1],l=3*f[k+2],x=points[i],y=points[i+1],z=points[i+2],ax=points[j]-x,ay=points[j+1]-y,az=points[j+2]-z,bx=points[l]-x,by=points[l+1]-y,bz=points[l+2]-z,den=ax*by-ay*bx;
  if(Math.abs(den)<1e-6)continue;
  const left=Math.max(0,Math.floor(x+Math.min(0,ax,bx))),right=Math.min(n-1,Math.ceil(x+Math.max(0,ax,bx)));
  const tone=Math.min(1,.74+.22*Math.sign(den)*((ay*bz-az*by)*(-.35*n)+(az*bx-ax*bz)*(.45*n)+den*.80)/Math.hypot((ay*bz-az*by)*n,(az*bx-ax*bz)*n,den));
  for(let py=Math.max(0,Math.floor(y+Math.min(0,ay,by)));py<=Math.min(n-1,Math.ceil(y+Math.max(0,ay,by)));py++){
   for(let px=left;px<=right;px++){
    const dx=px+.5-x,dy=py+.5-y,u=(dx*by-dy*bx)/den,w=(ax*dy-ay*dx)/den;if(u<0||w<0||u+w>1)continue;
    const idx=py*n+px,depth=z+u*az+w*bz;if(depth<buffer[idx])continue;buffer[idx]=depth;
    if(draw)draw(idx,i,j,l,u,w,tone);
   }
  }
 }
 return buffer;
}
function projection(mesh,im){
 let maps=cache.get(mesh);if(!maps){maps=new WeakMap();cache.set(mesh,maps);}
 let result=maps.get(im);if(result)return result;
 const c=im.camera,p=project(mesh,im.yaw,0,SIZE,c.scale,c.cx,c.cy);
 result={p,z:raster(mesh,p,SIZE,null)};maps.set(im,result);return result;
}
export function preview(mesh,yaw,pitch,n,zoom,image,intensity=1){
 const rgba=new Uint8ClampedArray(n*n*4),points=project(mesh,yaw,pitch,n,.83*n*zoom,n*.5,n*.5);
 const layers=(Array.isArray(image)?image:(image?[image]:[])).filter(Boolean).map(im=>({im,weight:visibleWeight(yaw,pitch,im.yaw)*intensity})).filter(l=>l.weight>0).map(l=>({...l,ref:projection(mesh,l.im)}));
 raster(mesh,points,n,(idx,i,j,l,u,w,tone)=>{
  let mix=0,sum=0,red=0,green=0,blue=0;
  for(const {ref,im,weight} of layers){const p=ref.p,x=p[i]+u*(p[j]-p[i])+w*(p[l]-p[i]),y=p[i+1]+u*(p[j+1]-p[i+1])+w*(p[l+1]-p[i+1]),z=p[i+2]+u*(p[j+2]-p[i+2])+w*(p[l+2]-p[i+2]);
   const dx=Math.floor(x),dy=Math.floor(y);if(dx>=0&&dy>=0&&dx<SIZE&&dy<SIZE){const src=dy*SIZE+dx;
    if(im.mask[src]&&z>=ref.z[src]-.025){const alpha=weight*im.rgba[4*src+3]/255;mix=Math.max(mix,alpha);sum+=alpha;red+=alpha*im.rgba[src*4];green+=alpha*im.rgba[src*4+1];blue+=alpha*im.rgba[src*4+2];}}}
  const off=4*idx;for(let k=0;k<3;k++)rgba[off+k]=(1-mix)*[207,183,148][k]*tone+(sum?mix*[red,green,blue][k]/sum:0);rgba[off+3]=255;
 });
 return new ImageData(rgba,n,n);
}

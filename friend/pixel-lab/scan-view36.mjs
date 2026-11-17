export function scanImage(mesh,yaw,pitch,size=256,zoom=1){
 const {v,f}=mesh,n=v.length/3,out=new Uint8ClampedArray(size*size*4),zbuf=new Float32Array(size*size).fill(-Infinity);
 const sy=Math.sin(yaw*Math.PI/180),cy=Math.cos(yaw*Math.PI/180),sp=Math.sin(pitch*Math.PI/180),cp=Math.cos(pitch*Math.PI/180),points=new Float64Array(v.length);
 for(let i=0;i<n;i++){
   const j=i*3,x=v[j]/10000,y=v[j+1]/10000,z=v[j+2]/10000,dep=z*cy-x*sy;
   points[j]=size*(.5+.797*zoom*(x*cy+z*sy));points[j+1]=size*(.5-.797*zoom*(y*cp-dep*sp));points[j+2]=size*.797*zoom*(y*sp+dep*cp);
 }
 for(let t=0;t<f.length;t+=3){
   const i=f[t]*3,j=f[t+1]*3,k=f[t+2]*3,x=points[i],y=points[i+1],z=points[i+2],ax=points[j]-x,ay=points[j+1]-y,az=points[j+2]-z,bx=points[k]-x,by=points[k+1]-y,bz=points[k+2]-z,d=ax*by-ay*bx;
   if(Math.abs(d)<1e-7)continue;
   const nx=ay*bz-az*by,ny=az*bx-ax*bz,mag=Math.hypot(nx,ny,d),tone=.72+.27*Math.sign(d)*(-.35*nx+.44*ny+.82*d)/mag;
   const left=Math.max(0,Math.floor(x+Math.min(0,ax,bx))),right=Math.min(size-1,Math.ceil(x+Math.max(0,ax,bx)));
   for(let py=Math.max(0,Math.floor(y+Math.min(0,ay,by)));py<=Math.min(size-1,Math.ceil(y+Math.max(0,ay,by)));py++){
     for(let px=left;px<=right;px++){
       const dx=px+.5-x,dy=py+.5-y,u=(dx*by-dy*bx)/d,w=(ax*dy-ay*dx)/d,idx=py*size+px;
       if(u<0||w<0||u+w>1)continue;
       const depth=z+u*az+w*bz;if(depth<=zbuf[idx])continue;zbuf[idx]=depth;
       for(const [c,base] of [[0,206],[1,191],[2,162]])out[4*idx+c]=base*tone;
       out[4*idx+3]=255;
     }
   }
 }
 return new ImageData(out,size,size);
}
export function silhouette(img){
 const {data:d,width:w,height:h}=img,edges=[];
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=(y*w+x)*4+3;
   if(d[i]&&(!d[i-4]||!d[i+4]||!d[i-4*w]||!d[i+4*w]))edges.push('M'+x+' '+y+'h1');}
 return edges.join('');
}

import{norm,dot,cross}from'./geometry.mjs';
// Optional anatomy-review directional shadows. Disabled by default.
export function buildShadowMap(scene,rotate,portrait=false){
 const headFocus=portrait===true||portrait==='face'||portrait==='ear';
 const L=norm([-.55,.8,1]),U=norm(cross([0,1,0],L)),V=cross(L,U),size=512;
 const raw=p=>{const q=rotate(p);return[dot(q,U),dot(q,V),dot(q,L)];};
 let lo=[Infinity,Infinity],hi=[-Infinity,-Infinity];
 for(const m of scene.parts)for(const v of m.vertices){if(headFocus&&v.p[1]<scene.height-2.2)continue;const p=raw(v.p);for(let k=0;k<2;k++){lo[k]=Math.min(lo[k],p[k]);hi[k]=Math.max(hi[k],p[k]);}}
 const scale=(size-8)/Math.max(hi[0]-lo[0],hi[1]-lo[1]),center=lo.map((v,k)=>(v+hi[k])/2),buffer=new Float32Array(size*size).fill(-Infinity);
 const project=p=>{const q=raw(p);return[size/2+(q[0]-center[0])*scale,size/2-(q[1]-center[1])*scale,q[2]];};
 for(const mesh of scene.parts){const vertices=mesh.vertices.map(v=>project(v.p));for(const face of mesh.faces){const[a,b,c]=face.map(i=>vertices[i]),den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-9)continue;const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(size-1,Math.ceil(Math.max(a[0],b[0],c[0]))),minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(size-1,Math.ceil(Math.max(a[1],b[1],c[1])));for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const u=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/den,v=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/den,w=1-u-v;if(u<0||v<0||w<0)continue;const index=y*size+x,z=u*a[2]+v*b[2]+w*c[2];buffer[index]=Math.max(buffer[index],z);}}}
 return{visibility(p,n){const[x,y,z]=project(p),cosine=Math.max(.15,dot(n,L)),bias=.003+1.6/scale*Math.sqrt(Math.max(0,1-cosine*cosine))/cosine;let hits=0,count=0;for(const dx of[-1,0,1])for(const dy of[-1,0,1]){const xx=Math.floor(x)+dx,yy=Math.floor(y)+dy;if(xx<0||yy<0||xx>=size||yy>=size)continue;hits+=z+bias<buffer[yy*size+xx]?0:1;count++;}return .22+.78*(count?hits/count:1);}};
}

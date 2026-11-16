// Small original geometry kernel. Units use one head height; no imported mesh data.
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const mul=(a,s)=>a.map(v=>v*s);
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const norm=v=>{const d=Math.hypot(...v)||1;return v.map(x=>x/d);};
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const mix=(a,b,t)=>a+(b-a)*t;
export const lerp=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
export function basis(axis){const y=norm(axis),x=norm(cross(y,Math.abs(y[2])>.9?[1,0,0]:[0,0,1]));return [x,y,cross(x,y)];}
const orient=(v,b)=>[0,1,2].map(k=>v.reduce((sum,q,i)=>sum+q*b[i][k],0));
export function ellipsoid(parts,c,r,mat='skin',axis=null,name=''){
 const b=axis?basis(axis):null,vertices=[],faces=[],rings=8,segments=12;
 for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
  const v=j*Math.PI/rings,u=i*Math.PI*2/segments,q=[Math.sin(v)*Math.cos(u),Math.cos(v),Math.sin(v)*Math.sin(u)];
  let p=q.map((v,k)=>v*r[k]),n=norm(q.map((v,k)=>v/r[k]));if(b){p=orient(p,b);n=orient(n,b);}vertices.push({p:add(c,p),n});
 }
 for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;faces.push([a,b,a+1],[a+1,b,b+1]);}
 const mesh={vertices,faces,mat,name};parts.push(mesh);return mesh;
}
// Rings: [height, half-width, half-depth, depth-center]. Smooth normals retain large planes.
export function loft(parts,rings,mat='skin',name='',segments=16){
 const vertices=[],faces=[];
 for(let j=0;j<rings.length;j++){
  const [y,rx,rz,zc=0]=rings[j],prev=rings[Math.max(0,j-1)],next=rings[Math.min(rings.length-1,j+1)],dy=next[0]-prev[0]||1;
  const dx=(next[1]-prev[1])/dy,dz=(next[2]-prev[2])/dy,dzc=((next[3]||0)-(prev[3]||0))/dy;
  for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,co=Math.cos(a),si=Math.sin(a);vertices.push({p:[co*rx,y,zc+si*rz],n:norm([co/rx,-co*co*dx/rx-si*si*dz/rz-si*dzc/rz,si/rz])});}
 }
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){const a=j*segments+i,b=j*segments+(i+1)%segments,c=a+segments,d=b+segments;faces.push([a,c,b],[b,c,d]);}
 for(const end of [0,rings.length-1]){const r=rings[end],k=vertices.length;vertices.push({p:[0,r[0],r[3]||0],n:[0,end===0?-1:1,0]});for(let i=0;i<segments;i++)faces.push([k,end*segments+i,end*segments+(i+1)%segments]);}
 const mesh={vertices,faces,mat,name};parts.push(mesh);return mesh;
}
export function taper(parts,a,b,radii,mat='skin',name=''){
 const length=Math.hypot(...sub(b,a)),frame=basis(sub(b,a)),mesh=loft(parts,radii.map(([t,w,d])=>[t*length,w,d]),mat,name,12);
 for(const v of mesh.vertices){v.p=add(a,orient(v.p,frame));v.n=orient(v.n,frame);}return mesh;
}
export function box(parts,c,r,mat='metal',name=''){
 const vertices=[],faces=[];
 for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){const k=vertices.length,other=[0,1,2].filter(i=>i!==axis);for(const [a,b]of [[-1,-1],[1,-1],[1,1],[-1,1]]){const p=[...c],n=[0,0,0];p[axis]+=sign*r[axis];p[other[0]]+=a*r[other[0]];p[other[1]]+=b*r[other[1]];n[axis]=sign;vertices.push({p,n});}faces.push([k,k+1,k+2],[k,k+2,k+3]);}
 const mesh={vertices,faces,mat,name};parts.push(mesh);return mesh;
}
export function transformMeshes(parts,fn,normalFn=fn){for(const mesh of parts)for(const v of mesh.vertices){v.p=fn(v.p);v.n=norm(normalFn(v.n));}}
export function bendPoint(p,pivot,angle,axis='x'){
 const q=sub(p,pivot),c=Math.cos(angle),s=Math.sin(angle);let r;
 if(axis==='x')r=[q[0],c*q[1]-s*q[2],s*q[1]+c*q[2]];
 else if(axis==='y')r=[c*q[0]+s*q[2],q[1],-s*q[0]+c*q[2]];
 else r=[c*q[0]-s*q[1],s*q[0]+c*q[1],q[2]];
 return add(pivot,r);
}
export function twoBone(hip,target,upper,lower){
 const d=sub(target,hip),distance=Math.hypot(...d),l=Math.max(.001,Math.min(upper+lower-.0001,distance));
 const along=(upper*upper-lower*lower+l*l)/(2*l),rise=Math.sqrt(Math.max(0,upper*upper-along*along));
 const dir=norm(d),perp=norm([0,dir[2],-dir[1]]);
 return add(hip,add(mul(dir,along),mul(perp,rise)));
}

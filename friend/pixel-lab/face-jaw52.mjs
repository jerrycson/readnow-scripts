const step=.011,minZ=.015,minH=-.09,nz=61,nh=43;
const clip=(x,a,b)=>Math.max(a,Math.min(b,x));
const ramp=(a,b,v)=>{const t=clip((v-a)/(b-a),0,1);return t*t*(3-2*t);};
const cache=new WeakMap();
function grids(scene){
 if(cache.has(scene))return cache.get(scene);
 const chin=scene.landmarks.chin[1],skin=scene.parts[0].vertices,old=[-1,1].map(()=>new Float64Array(nz*nh).fill(-Infinity));
 for(const m of scene.parts.filter(p=>p.vertices===skin))for(const f of m.faces){
 const [a,b,c]=f.map(i=>skin[i].p),dy=b[1]-a[1],dz=b[2]-a[2],ey=c[1]-a[1],ez=c[2]-a[2],den=dz*ey-dy*ez;if(Math.abs(den)<1e-12)continue;
 const j0=Math.max(0,Math.ceil((Math.min(a[2],b[2],c[2])-minZ)/step)),j1=Math.min(nz-1,Math.floor((Math.max(a[2],b[2],c[2])-minZ)/step));
 const i0=Math.max(0,Math.ceil((Math.min(a[1],b[1],c[1])-chin-minH)/step)),i1=Math.min(nh-1,Math.floor((Math.max(a[1],b[1],c[1])-chin-minH)/step));
 for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const z=minZ+j*step-a[2],y=minH+i*step+chin-a[1],u=(z*ey-y*ez)/den,v=(y*dz-z*dy)/den;if(u<0||v<0||u+v>1)continue;
 const x=a[0]+u*(b[0]-a[0])+v*(c[0]-a[0]),k=+(x>=0),at=i*nz+j;old[k][at]=Math.max(old[k][at],Math.abs(x));}
 }
 const sg=old.map(depth=>{const diff=new Float64Array(depth.length),target=new Float64Array(depth.length);
 for(let i=0;i<nh;i++)for(let j=0;j<nz;j++){const at=i*nz+j,b=depth[at];if(!Number.isFinite(b))continue;let sum=0,w=0;
 for(let di=-9;di<=9;di++)for(let dj=-3;dj<=3;dj++){const y=i+di,z=j+dj;if(y<0||z<0||y>=nh||z>=nz)continue;const t=depth[y*nz+z];if(!Number.isFinite(t))continue;const g=Math.exp(-.5*((di/4.3)**2+(dj/1.45)**2));sum+=g*t;w+=g;}
 const d=clip((sum/w-b)*.86,-.040,.040);diff[at]=d;target[at]=b+d;
 }return {diff,depth,target};});cache.set(scene,sg);return sg;
}
function value(a,z,h){const uz=clip((z-minZ)/step,0,nz-1.00001),uy=clip((h-minH)/step,0,nh-1.00001),j=Math.floor(uz),i=Math.floor(uy),u=uz-j,v=uy-i;
 return (1-u)*(1-v)*a[i*nz+j]+u*(1-v)*a[i*nz+j+1]+(1-u)*v*a[(i+1)*nz+j]+u*v*a[(i+1)*nz+j+1];}
const nrm=v=>{const mag=Math.hypot(...v)||1;return v.map(q=>q/mag);};
// 면벡터·기준면 내적은 x변위에 선형이다. 정중면과 고정 정점을 움직이지 않고 국소 제약을 푼다.
function constrain(current,proposed,parts){
 const d=current.map((v,i)=>proposed[i].p[0]-v.p[0]),initial=d.slice(),eq=[];
 for(const part of parts)for(const f of part.faces){if(f.every(i=>Math.abs(initial[i])<1e-9))continue;const p=f.map(i=>current[i].p),a=p[0],u=p[1].map((x,i)=>x-a[i]),v=p[2].map((x,i)=>x-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],sq=n.reduce((s,x)=>s+x*x,0);if(sq<1e-20)continue;
 const g=f.map((i,k)=>{const b=p[(k+1)%3],c=p[(k+2)%3];return Math.abs(initial[i])<1e-9?0:n[1]*(c[2]-b[2])+n[2]*(b[1]-c[1]);}),den=g.reduce((s,x)=>s+x*x,0);if(den>1e-24)eq.push({f,g,den,lo:-.96*sq});}
 for(let pass=0;pass<32;pass++){let k=0;for(const{f,g,den,lo}of eq){const v=f.reduce((s,i,j)=>s+g[j]*d[i],0);if(v>=lo)continue;const t=(lo-v)/den;f.forEach((i,j)=>{d[i]+=t*g[j];});if(Math.abs(t)*Math.sqrt(den)>1e-13)k++;}if(!k)break;}
 return proposed.map((v,i)=>Math.abs(initial[i]-d[i])<1e-10?v:{...v,p:[current[i].p[0]+d[i],v.p[1],v.p[2]]});
}

export function candidateJawBand52(scene,id,mode='combined'){
 if(!['F02','M01'].includes(id)||mode==='base')return scene;if(!['shape','normals','combined'].includes(mode))throw new RangeError('턱 표면 비교 모드를 확인하세요.');
 const src=scene.parts[0].vertices,chin=scene.landmarks.chin[1],data=grids(scene);
 const vertices=src.map(v=>{const p=v.p,[x,y,z]=p,h=y-chin,a=Math.abs(x),side=+(x>=0),sign=side?1:-1,sg=data[side];
 const w=ramp(.065,.17,a)*ramp(.08,.17,z)*(1-ramp(.50,.61,z))*ramp(-.04,.035,h)*(1-ramp(.21,.29,h));
 if(!w)return v;const sample=(z,h)=>value(sg.target,z,h),dist=Math.max(0,sample(z,h)-a),front=1-ramp(.05,.125,dist),amount=w*front;if(!amount)return v;
 const d=sign*amount*value(sg.diff,z,h),e=.008,dy=(sample(z,h+e)-sample(z,h-e))/(2*e),dz=(sample(z+e,h)-sample(z-e,h))/(2*e);
 const target=nrm([sign,-dy,-dz]),orig=v.n;const weight=.73*amount*ramp(.10,.53,sign*orig[0]);
 const n=mode==='shape'?orig:nrm(orig.map((t,k)=>t+weight*(target[k]-t)));
 return {...v,p:mode==='normals'?p:[x+d,y,z],n};
 });
 const guarded=mode==='normals'?vertices:constrain(src,vertices,scene.parts.filter(m=>m.vertices===src));
 return {...scene,parts:scene.parts.map(m=>m.vertices===src?{...m,vertices:guarded}:m)};
}
export function sampleBandDepth52(scene,side,z,h){return value(grids(scene)[side>0?1:0].depth,z,h);}



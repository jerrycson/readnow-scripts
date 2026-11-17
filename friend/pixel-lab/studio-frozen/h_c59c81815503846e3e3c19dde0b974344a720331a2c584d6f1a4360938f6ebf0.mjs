import {norm} from './h_012707cff711206a2d665296f9a4e116eeda05818d85e83dd0a4bfa29c5a8103.mjs';
import {chibiFace} from './h_608ba08241bf793b8c8aa8aeb5e779d4cc9c54e85f30020f67854a569d141c22.mjs';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smoothMin=(a,b,k)=>{const h=clamp(.5+.5*(b-a)/k);return b+(a-b)*h-k*h*(1-h);};
const ellipsoid=(p,c,r)=>(Math.hypot(...p.map((v,k)=>(v-c[k])/r[k]))-1)*Math.min(...r);
function tube(p,a,b,ra,rb){const d=b.map((v,k)=>v-a[k]),u=clamp(d.reduce((sum,v,k)=>sum+v*(p[k]-a[k]),0)/d.reduce((sum,v)=>sum+v*v,0)),c=a.map((v,k)=>v+d[k]*u),r=ra+(rb-ra)*u;return Math.hypot(...p.map((v,k)=>v-c[k]))-r;}
function handField23(p,wr,sign,r){const palm=ellipsoid(p,[wr[0],wr[1]-.065,.025],[r*.86,.080,r*.62]);let d=palm;for(let i=0;i<4;i++){const x=wr[0]+sign*(i-1.5)*r*.39,end=wr[1]-[.16,.195,.185,.15][i];d=smoothMin(d,tube(p,[x,wr[1]-.105,.025],[x,end,.035],r*.23,r*.20),.009);}d=smoothMin(d,tube(p,[wr[0]-sign*r*.62,wr[1]-.035,.035],[wr[0]-sign*r*1.16,wr[1]-.120,.060],r*.34,r*.25),.014);return d;}
const cache=new Map();
const bodyCache=new Map();
// Smooth implicit unions connect neutral mannequin volumes. The short figures
// have their own construction; no adult chest or pelvis detail is transferred.
export function chibiStudy(s){
 if(![2,3,4].includes(s.heads))throw new Error('작은 등신 연구는 2·3·4등신입니다.');
 const key=s.sex+':'+s.heads+':'+s.candidate;if(cache.has(key))return cache.get(key);
 const n=s.heads,t=n-2,chin=n-1,shoulder=chin-[.10,.13,.15][t],pelvis=[.50,1.22,1.86][t],torsoY=(shoulder+pelvis)*.5,bodyWidth=[.31,.38,.44][t],bodyDepth=[.235,.275,.31][t],bodyLength=(shoulder-pelvis)*.5+.18,armX=[.27,.33,.38][t],wristY=pelvis-[.03,.14,.20][t],ankleY=[.105,.13,.15][t],hipX=[.17,.23,.28][t],ankleX=hipX+.025,armR=[.10,.13,.155][t],legR=[.14,.19,.23][t];
 const elbowY=(shoulder+wristY)*.5,handY=wristY-.11,footLength=[.17,.21,.25][t],footHeight=[.085,.10,.115][t],parts=[];
 if(!bodyCache.has(n)){
 const primitives=[p=>ellipsoid(p,[0,shoulder-(shoulder-pelvis)*.30,0],[bodyWidth*.80,(shoulder-pelvis)*.38+.09,bodyDepth*.88]),p=>ellipsoid(p,[0,pelvis+(shoulder-pelvis)*.18,.014],[bodyWidth*1.06,(shoulder-pelvis)*.39+.13,bodyDepth*1.07]),p=>tube(p,[0,shoulder-.05,0],[0,chin+.12,0],.10,.115)];
 for(const sign of[-1,1]){
  const sh=[sign*armX,shoulder-.07,0],el=[sign*(armX+[.13,.16,.18][t]),elbowY,.005],wr=[sign*(armX+[.20,.24,.28][t]),wristY,.018];
  primitives.push(p=>tube(p,sh,el,armR,armR*.82),p=>tube(p,el,wr,armR*.82,armR*.72),p=>handField23(p,wr,sign,armR));
  const hip=[sign*hipX,pelvis,.0],knee=[sign*(hipX+.012),ankleY+(pelvis-ankleY)*.49,.018],ankle=[sign*ankleX,ankleY,.0];
  primitives.push(p=>tube(p,hip,knee,legR,legR*.78),p=>tube(p,knee,ankle,legR*.72,legR*.48),p=>ellipsoid(p,[sign*(hipX+.018),ankleY+(pelvis-ankleY)*.30,-.014],[legR*.78,(pelvis-ankleY)*.18,legR*.72]),p=>ellipsoid(p,[sign*ankleX,footHeight,.06],[legR*.76,footHeight,footLength]));
 }
 function field(p){let d=primitives[0](p);for(let i=1;i<primitives.length;i++)d=smoothMin(d,primitives[i](p),i<3?.09:.045);return d;}
 const step=.028,extent=armX+[.20,.24,.28][t]+armR*1.45+.06,x0=-extent,y0=-.08,z0=-.42,nx=Math.ceil(extent*2/step),ny=Math.ceil((chin+.26-y0)/step),nz=Math.ceil(.88/step),stride=(nx+1)*(nz+1),values=new Float32Array((ny+1)*stride);
 const index=(x,y,z)=>y*stride+z*(nx+1)+x;
 for(let y=0;y<=ny;y++)for(let z=0;z<=nz;z++)for(let x=0;x<=nx;x++)values[index(x,y,z)]=field([x0+x*step,y0+y*step,z0+z*step]);
 const mesh={name:'continuous-neutral-chibi-body',mat:'skin',vertices:[],faces:[]},corners=[[0,0,0],[1,0,0],[1,0,1],[0,0,1],[0,1,0],[1,1,0],[1,1,1],[0,1,1]],tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]],edges=new Map();
 function crossing(a,b,points,ids,vals){const lo=Math.min(ids[a],ids[b]),hi=Math.max(ids[a],ids[b]),key=lo+':'+hi;if(edges.has(key))return edges.get(key);const u=vals[a]/(vals[a]-vals[b]),p=points[a].map((v,k)=>v+(points[b][k]-v)*u),e=.0005,normals=[0,1,2].map(k=>{const a=[...p],b=[...p];a[k]+=e;b[k]-=e;return field(a)-field(b);}),id=mesh.vertices.length;mesh.vertices.push({p,n:norm(normals)});edges.set(key,id);return id;}
 function add(a,b,c){const A=mesh.vertices[a],B=mesh.vertices[b],C=mesh.vertices[c],u=B.p.map((v,k)=>v-A.p[k]),v=C.p.map((q,k)=>q-A.p[k]),cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];if(cross.reduce((sum,q,k)=>sum+q*A.n[k],0)<0)mesh.faces.push([a,c,b]);else mesh.faces.push([a,b,c]);}
 for(let y=0;y<ny;y++)for(let z=0;z<nz;z++)for(let x=0;x<nx;x++){
  const ids=corners.map(c=>index(x+c[0],y+c[1],z+c[2])),vals=ids.map(i=>values[i]);if(vals.every(v=>v>=0)||vals.every(v=>v<0))continue;const points=corners.map(c=>[x0+(x+c[0])*step,y0+(y+c[1])*step,z0+(z+c[2])*step]);
  for(const tet of tetra){const inside=tet.filter(i=>vals[i]<0),outside=tet.filter(i=>vals[i]>=0);if(!inside.length||!outside.length)continue;const cut=(a,b)=>crossing(a,b,points,ids,vals);if(inside.length===1||outside.length===1){const one=inside.length===1?inside[0]:outside[0],other=inside.length===1?outside:inside;add(...other.map(i=>cut(one,i)));}else{const [a,b]=inside,[c,d]=outside,A=cut(a,c),B=cut(a,d),C=cut(b,c),D=cut(b,d);add(A,B,C);add(B,D,C);}}
 }
 const floor=Math.min(...mesh.vertices.map(v=>v.p[1]));for(const v of mesh.vertices)v.p[1]-=floor;bodyCache.set(n,{mesh,floor});
 }
 const{mesh,floor}=bodyCache.get(n);parts.push(mesh);
 const p={cute:true,manga:false,f:s.sex==='female',t:(n-2)/6};chibiFace(parts,s,chin);
 const studyParts=parts.map(part=>({...part,mat:part.mat==='skin'?'study-skin':part.mat==='iris'?'portrait-iris':part.mat==='sclera'?'portrait-sclera':part.mat}));
 const scene={parts:studyParts,height:n,frame:n+1.1,joints:Object.fromEntries([['right',1],['left',-1]].map(([side,sign])=>[side,{shoulder:[sign*armX,shoulder-.07-floor,0],elbow:[sign*(armX+[.13,.16,.18][t]),elbowY-floor,.005],wrist:[sign*(armX+[.20,.24,.28][t]),wristY-floor,.018],hip:[sign*hipX,pelvis-floor,0],knee:[sign*(hipX+.012),ankleY+(pelvis-ankleY)*.49-floor,.018],ankle:[sign*ankleX,ankleY-floor,0]}])),landmarks:{chin:[0,chin,0],pelvis,shoulder},provenance:'original-neutral-chibi-study-v29',scope:'2–4 head neutral stylized mannequin; body variation and action expansion deferred'};cache.set(key,scene);return scene;
}

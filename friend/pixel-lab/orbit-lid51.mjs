const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
function capDepth(eye,x,y){
 const w=53,h=21;let lo=0,hi=w-1,increasing=eye[w-1].p[0]>eye[0].p[0];
 while(hi-lo>1){const mid=(lo+hi)>>1;if((eye[mid].p[0]<x)===increasing)lo=mid;else hi=mid;}
 const blend=(a,b,t)=>a+(b-a)*t,first=eye[lo].p,last=eye[hi].p,t=clamp((x-first[0])/(last[0]-first[0]||1),0,1);
 function sample(j,k){return blend(eye[j*w+lo].p[k],eye[j*w+hi].p[k],t);}
 let row=0;while(row<h-2&&sample(row+1,1)<y)row++;const a=sample(row,1),b=sample(row+1,1),v=clamp((y-a)/(b-a||1),0,1);
 return blend(sample(row,2),sample(row+1,2),v);
}
const sign=vs=>Math.sign(vs.reduce((s,v)=>s+v.p[0],0));
export function lidContact51(scene,strength=.8){
 const pair=[...new Set(scene.parts.filter(m=>m.name==='eye34').map(p=>p.vertices))];if(pair.length!==2)return scene;
 const parts=scene.parts.map(p=>{const upper=p.name==='lid34',lower=p.name==='lower-lid34';if(!upper&&!lower)return p;const w=upper?45:25,h=upper?4:3,eye=pair.find(q=>sign(q)===sign(p.vertices));if(!eye||eye.length!==53*21||p.vertices.length!==w*h)return p;
 const delta=Array.from({length:w},(_,j)=>{const root=p.vertices[j].p,tip=capDepth(eye,root[0],root[1]),outer=Math.abs(2*j/(w-1)-1),gate=1-smooth(.72,.99,outer);return strength*gate*clamp(tip+.0015-root[2],-.014,.014);});
 const vertices=p.vertices.map((v,i)=>{const col=i%w,row=Math.floor(i/w),d=delta[col]*(1-.42*row/(h-1));if(Math.abs(d)<1e-9)return v;
 const a=Math.max(0,col-1),b=Math.min(w-1,col+1),dx=p.vertices[b].p[0]-p.vertices[a].p[0],dh=p.vertices[(h-1)*w+col].p[1]-p.vertices[col].p[1],nx=dx?(delta[b]-delta[a])*(1-.42*row/(h-1))/dx:0,ny=dh?-.42*delta[col]/dh:0;
 const n=[v.n[0]-nx*v.n[2],v.n[1]-ny*v.n[2],v.n[2]],mag=Math.hypot(...n)||1;
 return {...v,p:[v.p[0],v.p[1],v.p[2]+d],n:n.map(q=>q/mag)};});return {...p,vertices};
 });return {...scene,parts};
}
export function lidSeams51(scene){
 const pair=[...new Set(scene.parts.filter(m=>m.name==='eye34').map(m=>m.vertices))],out=[];
 for(const p of scene.parts.filter(m=>['lid34','lower-lid34'].includes(m.name))){
 const w=p.name==='lid34'?45:25,eye=pair.find(q=>sign(q)===sign(p.vertices)),g=[];
 for(let i=Math.ceil(.16*w);i<.84*w;i++){const pos=p.vertices[i].p;g.push(pos[2]-capDepth(eye,pos[0],pos[1]));}
 out.push({side:sign(p.vertices),part:p.name,count:g.length,mean:g.reduce((s,x)=>s+x,0)/g.length,min:Math.min(...g),max:Math.max(...g),meanAbsoluteContact:g.reduce((s,x)=>s+Math.abs(x-.0015),0)/g.length});}
 return out;
}


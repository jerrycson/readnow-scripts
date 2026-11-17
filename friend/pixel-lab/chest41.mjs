const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const minus=(a,b)=>a.map((v,i)=>v-b[i]);
const unit=a=>{const l=Math.hypot(...a)||1;return a.map(x=>x/l);};
const sites=[-.45,-.24,-.05,.14,.33,.52,.71].flatMap(q=>[.63,.74,.85,.96].map(u=>[q,u]));
const cached=new WeakMap();
function bindings(scene){
 if(cached.has(scene))return cached.get(scene);
 const base=scene.parts[0],w=scene.paperShape.scale,active=[];
 scene.restSkin35.forEach((v,i)=>{
  const [x,y,z]=v.p,hand=x>0?1:-1,f=scene.paperShape.frame(hand),q=(x-f.c)*hand/f.root;
  if(z<.05||Math.abs(q)>=1.01)return;
  const local=scene.paperShape.frame(hand,hand*q),u=(local.top-y)/(local.top-local.foot);
  if(!(u>.38&&u<1.065))return;
  const gate=smooth(.38,.63,u)*(1-smooth(.94,1.065,u))*(1-smooth(.8,1.0,Math.abs(q)))*smooth(.06,.17,Math.abs(x)/w);
  const weights=sites.map(([a,b])=>gate*w*Math.exp(-.5*(((q-a)/.19)**2+((u-b)/.102)**2)));
  active.push({i,weights,hand,q,u});
 });
 const ids=new Set(active.map(a=>a.i)),faces=base.faces.filter(tri=>tri.some(i=>ids.has(i)));
 const info={active,faces};cached.set(scene,info);return info;
}
function skin41(scene,ref,field,normals=true,guard){
 if(scene.paperShape?.form.id!=='W'||!ref?.paper?.B3||!scene.tissue34)return scene;
 const mesh=scene.parts[0],src=mesh.vertices,vertices=src.slice(),{active,faces}=bindings(scene);
 for(const {i,weights,hand,q,u} of active){
  const d=[0,0,0];
  for(let j=0;j<weights.length;j++)for(let k=0;k<3;k++)d[k]+=weights[j]*field[j][k];
  if(guard){
   const [x,t,sx,st,strength]=guard,scale=1-strength*Math.exp(-.5*(((q-x)/sx)**2+((u-t)/st)**2));
   for(let k=0;k<3;k++)d[k]*=scale;
  }
  if(Math.hypot(...d)<1e-7)continue;
  const v=src[i];vertices[i]={...v,p:[v.p[0]+hand*d[0],v.p[1]+d[1],v.p[2]+d[2]]};
 }
 if(normals){
  const moved=new Map();
  for(const ids of faces){
   const fn=vs=>cross(minus(vs[ids[1]].p,vs[ids[0]].p),minus(vs[ids[2]].p,vs[ids[0]].p));
   const old=fn(src),now=fn(vertices),area=Math.hypot(...old);if(area<1e-8)continue;
   const a=unit(old),b=unit(now),axis=cross(a,b),c=dot(a,b);
   if(c<-.999)continue;
   for(const i of ids){
    const v=src[i];if(v===vertices[i])continue;
    const r1=cross(axis,v.n),r2=cross(axis,r1),sum=moved.get(i)||[0,0,0];
    for(let k=0;k<3;k++)sum[k]+=area*(v.n[k]+r1[k]+r2[k]/(1+c));
    moved.set(i,sum);
   }
  }
  for(const [i,n] of moved){
   const a=src[i].n,b=unit(n),angle=Math.acos(Math.max(-1,Math.min(1,dot(a,b))))*180/Math.PI;
   const t=Math.min(.75,10/Math.max(.001,angle));
   vertices[i]={...vertices[i],n:unit(a.map((v,j)=>v+t*(b[j]-v)))};
  }
 }
 return {...scene,parts:scene.parts.map(m=>m.vertices===src?{...m,vertices}:m)};
}

// Rest-surface lateral positions and meridian fractions set the deformations.
const fits={
  balanced: {
    guard: [0.51, 0.837, 0.09, 0.13, 0.25],
    field: [
      [1.420163323e-2, -4.06720812e-2, -2.230711155e-2],
      [-1.872291659e-2, 1.38463147e-3, -4.66175812e-3],
      [1.717432649e-2, -6.29453599e-3, -1.48920401e-2],
      [-2.638474345e-2, -2.789222518e-2, 2.822071943e-2],
      [-2.84810173e-3, -1.114477182e-2, -2.066058457e-2],
      [2.87759455e-2, 3.09862066e-3, 3.88564494e-3],
      [2.995429716e-2, 4.93389105e-3, -5.08287191e-3],
      [-9.4744007e-4, 2.582225391e-2, 4.5597472e-3],
      [2.443793848e-2, -6.307338138e-2, -6.55412873e-3],
      [6.881251743e-2, -1.024253385e-2, 2.17097585e-3],
      [-8.890299175e-2, -5.47548201e-3, -3.87116952e-3],
      [-8.682762376e-2, -9.28118917e-3, 2.775649097e-2],
      [3.586751461e-2, -2.593087211e-2, -8.06734688e-3],
      [-2.361835931e-2, 8.9293124e-3, -2.756281334e-2],
      [3.329217963e-2, -4.37188877e-3, -4.90590688e-2],
      [5.322884548e-2, 1.203795242e-2, 1.2980538e-4],
      [-8.058864154e-2, 2.010682854e-2, -1.447950653e-2],
      [5.833459221e-2, -1.191097076e-2, 1.246981899e-2],
      [-2.803788892e-2, 1.92270917e-3, -1.000163055e-2],
      [5.407764799e-2, -7.79329877e-3, 1.500549025e-2],
      [2.506934118e-2, -1.689559451e-2, -1.63858006e-3],
      [1.036337277e-2, 4.71376786e-3, -2.73963451e-2],
      [8.52845412e-3, -4.72557928e-3, 2.92361511e-3],
      [8.08658682e-3, -1.012651937e-2, 7.2301914e-3],
      [-5.97757684e-2, 2.663281389e-2, 3.31040117e-3],
      [-2.73438908e-3, 2.40154777e-3, 1.303111051e-2],
      [-5.78056412e-3, 1.179059706e-2, -2.031973427e-2],
      [4.43865654e-3, -1.135885638e-2, 1.643649851e-2]
    ]
  },
  lower: {
    guard: [0.51, 0.837, 0.09, 0.13, 0.5],
    field: [
      [-2.989358871e-2, -1.891147584e-2, -9.75034504e-3],
      [-4.499274806e-2, 5.53852587e-3, 8.32291125e-3],
      [6.538442922e-2, -2.517814398e-2, -3.194520686e-2],
      [-1.5338620734e-1, -3.772451223e-2, 3.763017775e-2],
      [7.46075931e-2, -2.387795196e-2, 1.363727191e-2],
      [6.582951062e-2, 5.46283938e-3, -8.567865762e-2],
      [1.369248232e-2, 1.97355642e-2, -3.233148764e-2],
      [5.221023972e-2, -8.71098435e-3, -6.44750263e-3],
      [-3.224824607e-2, 3.070647447e-2, 1.903522899e-2],
      [9.355548772e-2, -6.057807208e-2, 8.68390341e-3],
      [-1.1430660595e-1, -1.306934937e-2, -3.54846781e-2],
      [-6.31049506e-3, -4.67510992e-3, 8.58972117e-3],
      [2.47005845e-3, -7.004364474e-2, 4.752261019e-2],
      [-2.109727816e-2, 2.024613721e-2, -9.662472009e-2],
      [8.60809046e-2, 6.6931997e-4, -1.026462205e-2],
      [-1.537809857e-2, 9.2234396e-4, -1.468224896e-2],
      [-1.4682921501e-1, 8.842731416e-2, -4.056185833e-2],
      [1.4556850153e-1, -4.764388303e-2, -2.519082944e-2],
      [-1.0089454563e-1, 7.69083668e-3, -5.657402363e-2],
      [9.706958833e-2, -7.33050237e-3, 4.270830044e-2],
      [1.0811377856e-1, -6.758237806e-2, -6.55432026e-3],
      [-5.602787367e-2, 4.128767569e-2, -3.284333745e-2],
      [2.835896438e-2, 1.004813345e-2, 4.641758565e-2],
      [1.039095434e-2, 3.26321607e-2, -5.107923438e-2],
      [-6.132610686e-2, 3.732677904e-2, -6.192854903e-2],
      [4.121046322e-2, -6.29238144e-3, 5.212444205e-2],
      [1.89308018e-3, 6.36933569e-3, -1.005940729e-1],
      [2.48140981e-3, -4.78113061e-3, 5.668933161e-2]
    ]
  }
};

export function chest41(scene40,ref,choice='balanced'){
  const fit=Object.hasOwn(fits,choice)?fits[choice]:null;
  return fit?skin41(scene40,ref,fit.field,true,fit.guard):scene40;
}

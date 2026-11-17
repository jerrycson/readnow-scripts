const smooth=(a,b,x)=>{
  const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
  return t*t*(3-2*t);
};
const unit=v=>{const length=Math.hypot(...v)||1;return v.map(x=>x/length);};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];

// The x/y/z coefficients were fit together to the two B3 arcs and S3 in
// their fixed cameras. Each row belongs to a lateral position and a depth.
const centers=[-.40,-.16,.08,.32,.56].flatMap(x=>[1.03,1.29,1.55].map(z=>[x,z]));
const field=[
  [-.000_172_618_7, .007_231_541_3,-.000_373_862_9],
  [ .009_607_703_5, .067_461_057_1, .018_709_429_9],
  [-.001_681_155_6,-.028_128_074_1, .066_290_953_3],
  [-.000_871_412_0, .012_234_666_4,-.005_269_315_9],
  [-.007_787_524_5,-.129_252_615_9, .067_234_931_7],
  [-.039_044_595_8, .025_180_066_9,-.052_835_105_2],
  [ .016_361_633_9, .094_580_751_0, .063_328_151_5],
  [ .017_991_350_1, .027_027_184_8,-.000_342_665_7],
  [ .005_066_253_5, .002_876_075_9, .002_166_673_7],
  [ .017_444_638_7, .002_527_126_4, .021_826_891_0],
  [ .030_642_626_0,-.008_283_547_2,-.007_911_006_3],
  [-.078_545_604_2,-.029_669_777_2, .010_997_371_3],
  [-.001_127_833_0,-.006_187_236_3,-.011_330_659_5],
  [ .004_778_255_1,-.035_425_245_0,-.031_842_480_0],
  [-.003_387_868_3,-.000_115_161_4,-.002_334_013_8]
];

export function chest39(scene38,ref){
  if(scene38.paperShape?.form.id!=='W'||!scene38.tissue34||!ref?.paper?.B3||!ref?.paper?.S3)return scene38;
  const original=scene38.parts[0].vertices,scale=scene38.paperShape.scale,f=scene38.paperShape.frame(1);
  function warp(point){
    const [x,y,z]=point,hand=x<0?-1:1,lateral=(Math.abs(x)-f.c)/scale,height=(f.top-y)/scale,depth=z/scale;
    const blend=smooth(.4,.77,height)*(1-smooth(1.09,1.46,height))*smooth(0,.17,Math.abs(x)/scale)*smooth(.67,.91,depth);
    const p=point.slice();
    centers.forEach(([u,v],i)=>{
      const w=scale*blend*Math.exp(-.5*(((lateral-u)/.13)**2+((depth-v)/.13)**2));
      for(let axis=0;axis<3;axis++)p[axis]+=(axis===0?hand:1)*w*field[i][axis];
    });
    return p;
  }
  const vertices=original.map(v=>{
    const [x,y,z]=v.p,h=(f.top-y)/scale;
    if(h<=.45||h>=1.39||z<=scale*.68||Math.abs(x)>scale*1.65)return v;
    const p=warp(v.p);
    if(Math.hypot(...p.map((a,k)=>a-v.p[k]))<1e-6)return v;
    // The cofactor of the deformation gradient transports the original
    // material normal and preserves its authored direction at the boundary.
    const eps=.0001,cols=[0,1,2].map(k=>{
      const a=v.p.slice(),b=v.p.slice();a[k]+=eps;b[k]-=eps;
      const up=warp(a),down=warp(b);return up.map((v,j)=>(v-down[j])/(2*eps));
    });
    const cof=[cross(cols[1],cols[2]),cross(cols[2],cols[0]),cross(cols[0],cols[1])];
    return {...v,p,n:unit([0,1,2].map(i=>cof.reduce((s,c,k)=>s+c[i]*v.n[k],0)))};
  });
  const weight=vertices.map(v=>{
    const [x,y,z]=v.p,h=(f.top-y)/scale,q=(Math.abs(x)-f.c)/scale;
    return smooth(.47,.77,h)*(1-smooth(1.15,1.43,h))*smooth(.69,.98,z/scale)*
      (1-smooth(.56,.92,Math.abs(q)))*smooth(.06,.30,Math.abs(x)/scale);
  });
  const active=weight.flatMap((w,i)=>w>0?[i]:[]),final=vertices.slice(),radius2=(scale*.10)**2;
  for(const i of active){
    const v=vertices[i],sum=[0,0,0];
    for(const j of active){
      const q=vertices[j],delta=q.p.map((x,k)=>x-v.p[k]),dist=dot(delta,delta);
      if(dist>9*radius2||dot(v.n,q.n)<-.38)continue;
      const amount=Math.exp(-dist/(2*radius2));for(let k=0;k<3;k++)sum[k]+=amount*q.n[k];
    }
    const n=unit(sum);
    final[i]={...v,n:unit(v.n.map((a,k)=>a+.65*weight[i]*(n[k]-a)))};
  }
  return {...scene38,parts:scene38.parts.map(m=>m.vertices===original?{...m,vertices:final}:m)};
}

const centers=[-.36,-.16,.04,.24,.44].flatMap(x=>[1.02,1.23,1.39,1.55].map(z=>[x,z]));
// Coefficients of lateral, vertical and depth displacement around each material
// landmark. All values use the 39th-round breast scale.
const field=[
  [0.005_603_343_5, -0.043_353_535_6, 0.061_323_883_0],
  [-0.005_389_067_1, -0.044_043_637_4, 0.038_354_429_8],
  [0.040_828_236_5, -0.027_676_275_7, 0.070_092_430_1],
  [0.049_241_798_6, 0.044_479_786_6, -0.016_246_879_7],
  [0.007_517_413_1, 0.047_991_259_2, 0.025_460_882_4],
  [-0.015_020_463_2, 0.048_516_452_1, -0.031_607_564_8],
  [-0.011_326_303_1, 0.025_819_572_4, -0.014_796_334_0],
  [-0.006_752_381_3, 0.002_747_297_5, -0.025_999_900_4],
  [-0.007_974_921_6, 0.009_246_506_0, 0.046_009_048_3],
  [0.000_492_341_9, -0.079_072_423_6, 0.035_616_266_9],
  [-0.051_839_161_2, -0.010_054_554_0, -0.055_196_193_3],
  [0.037_667_134_2, 0.002_228_165_3, 0.012_465_707_1],
  [-0.031_699_764_8, 0.009_426_627_6, 0.032_722_653_2],
  [0.051_982_215_6, -0.029_546_834_2, 0.019_404_555_4],
  [0.019_542_462_6, 0.013_885_984_4, -0.011_179_742_6],
  [0.009_344_114_9, -0.017_656_492_7, 0.011_453_661_6],
  [-0.083_736_171_5, 0.013_447_474_5, 0.015_176_170_9],
  [-0.000_532_568_7, 0.027_289_327_5, -0.011_540_453_9],
  [-0.064_643_806_1, 0.059_602_848_4, -0.029_444_548_2],
  [-0.034_603_958_5, 0.020_588_873_2, -0.025_017_579_0],
];
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=v=>{const d=Math.hypot(...v)||1;return v.map(x=>x/d);};

export function chest40(scene39,ref){
  if(scene39.paperShape?.form.id!=='W'||!scene39.tissue34||!ref?.paper?.S3||!ref?.paper?.B3)return scene39;
  const original=scene39.parts[0].vertices,shape=scene39.paperShape,w=shape.scale,f=shape.frame(1);
  function warp([x,y,z]){
    const hand=x<0?-1:1,q=(Math.abs(x)-f.c)/w,d=z/w,h=(f.top-y)/w;
    const gate=smooth(.52,.78,h)*(1-smooth(1.18,1.46,h))*smooth(.02,.15,Math.abs(x)/w)*smooth(.73,.96,d);
    const diff=[0,0,0];
    centers.forEach(([u,v],i)=>{
      const weight=gate*Math.exp(-.5*(((q-u)/.165)**2+((d-v)/.165)**2));
      for(let j=0;j<3;j++)diff[j]+=weight*field[i][j];
    });
    return [x+hand*w*diff[0],y+w*diff[1],z+w*diff[2]];
  }
  const vertices=original.map(vertex=>{
    const [x,y,z]=vertex.p,h=(f.top-y)/w;
    if(h<.51||h>1.47||z/w<.72||Math.abs(x)>1.75*w)return vertex;
    const p=warp(vertex.p);
    if(Math.hypot(...p.map((v,k)=>v-vertex.p[k]))<1e-7)return vertex;
    const eps=.0001,columns=[0,1,2].map(k=>{
      const a=vertex.p.slice(),b=vertex.p.slice();a[k]+=eps;b[k]-=eps;
      const up=warp(a),down=warp(b);return up.map((v,i)=>(v-down[i])/(2*eps));
    });
    const co=[cross(columns[1],columns[2]),cross(columns[2],columns[0]),cross(columns[0],columns[1])];
    const prior=vertex.n,transported=unit([0,1,2].map(i=>co.reduce((s,c,k)=>s+c[i]*prior[k],0)));
    // Limit lighting variation in compressed triangles. This preserves the
    // previous lower-pole shadow while the actual geometry changes.
    const cosine=prior.reduce((s,v,k)=>s+v*transported[k],0);
    const degrees=Math.acos(Math.max(-1,Math.min(1,cosine)))*180/Math.PI;
    const t=degrees<1e-7?1:Math.min(.6,7/degrees);
    return {...vertex,p,n:unit(prior.map((v,k)=>v+t*(transported[k]-v)))};
  });
  return {...scene39,parts:scene39.parts.map(m=>m.vertices===original?{...m,vertices}:m)};
}

// 측면 3번 정합은 36차에서 동결한 중립 카메라다. 단위는 248px 원화 좌표다.
const sideFrame = {
  F02: {eyeX:67, eyeDepth:.582797942, scale:147.965739, end:92},
  M01: {eyeX:69, eyeDepth:.610940218, scale:163.126338, end:89}
};
export const faceParameters47 = Object.freeze({
  F02: Object.freeze({under:0, lift:.75, retreat:3, spread:0}),
  M01: Object.freeze({under:.5, lift:4, retreat:4, spread:0})
});
function smooth(a,b,x) {
  const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);
}
function bell(distance,radius) {
  if(Math.abs(distance)>=radius)return 0;
  const t=distance/radius;return (1-t*t)**3;
}
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];

export function trialFace47(base,id,parameters) {
  if(!Object.hasOwn(sideFrame,id)||!parameters)return base;
  const frame=sideFrame[id];
  const chin=base.landmarks.chin[1], skin=base.parts[0].vertices;
  const {under,lift,retreat,spread}=parameters, {eyeX,eyeDepth,scale,end}=frame;
  function displacement([x,y,z]) {
    const u=eyeX-(z-eyeDepth)*scale, h=y-chin, lateral=Math.abs(x);
    if(h<=-.28||h>=.145||lateral>=.46||u<end-44||u>end+31)return [0,0,0];
    const mask=smooth(-.28,-.08,h)*(1-smooth(.025,.145,h))*(1-smooth(.30,.46,lateral));
    const floor=bell(u-(end-20),19), throat=bell(u-(end+3),24);
    const cheek=smooth(.08,.29,lateral)*bell(u-(end-7),30);
    return [Math.sign(x)*spread*cheek*mask/scale, (lift*throat-under*floor)*mask/scale, -retreat*throat*mask/scale];
  }
  const vertices=skin.map(v=>{
    const shift=displacement(v.p);if(!shift.some(Boolean))return v;
    // 39차의 명암 법선을 변형장의 역전치로 운반한다.
    const columns=[0,1,2].map(axis=>{
      const left=[...v.p],right=[...v.p],eps=.0001;left[axis]-=eps;right[axis]+=eps;
      const a=displacement(left),b=displacement(right);
      return b.map((n,k)=>(n-a[k])/(2*eps)+Number(axis===k));
    });
    const co=[cross(columns[1],columns[2]),cross(columns[2],columns[0]),cross(columns[0],columns[1])];
    const n=v.n.map((_,k)=>co.reduce((s,c,i)=>s+c[k]*v.n[i],0)),length=Math.hypot(...n);
    return {...v,p:v.p.map((x,k)=>x+shift[k]),n:length?n.map(value=>value/length):v.n};
  });
  return {...base,parts:base.parts.map(part=>part.vertices===skin?{...part,vertices}:part)};
}

export function candidateFace47(base,id) {
  return trialFace47(base,id,faceParameters47[id]);
}

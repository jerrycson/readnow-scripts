// 이 함수는 팔·목 관절 포즈를 주기 전의 중립 피부에 적용한다.
const smooth = (a,b,x) => {
  const t = Math.max(0,Math.min(1,(x-a)/(b-a)));
  return t*t*(3-2*t);
};
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];

export function trialJaw42(scene,id,model,options) {
  if (!['F02','M01'].includes(id) || !options) return scene;
  const {x:eyeX,scale} = model.frame.side;
  const chinHeight = scene.landmarks.chin[1], end = id==='F02' ? 92 : 89;
  const {lift,retreat,span,tip=0,width=0} = options;
  const vertices = scene.parts[0].vertices;
  function shift([x,y,z]) {
    const u = eyeX-(z-model.eyeDepth)*scale, h = y-chinHeight;
    const support = smooth(-.35,-.13,h)*(1-smooth(.045,.195,h))*(1-smooth(.28,.46,Math.abs(x)));
    if (!support || u<end-43 || u>end+42) return [0,0,0];
    const throat = smooth(end-span,end+7,u)*(1-smooth(end+9,end+42,u));
    const chin = smooth(end-43,end-32,u)*(1-smooth(end-27,end-14,u));
    return [width*Math.tanh(x/.12)*support*throat/scale,
      support*(lift*throat+tip*chin)/scale,-retreat*support*throat/scale];
  }
  const next = vertices.map(v => {
    const d = shift(v.p);
    if (d.every(k=>k===0)) return v;
    // 접평면을 변형하고 기존 39차 음영 법선을 그 접평면과 함께 회전한다.
    const axes = [0,1,2].map(i=>{
      const eps=.0001, left=[...v.p],right=[...v.p];
      left[i]-=eps; right[i]+=eps;
      const a=shift(left), b=shift(right);
      return b.map((x,k)=>(x-a[k])/(2*eps)+(k===i?1:0));
    });
    const normals = [cross(axes[1],axes[2]),cross(axes[2],axes[0]),cross(axes[0],axes[1])];
    const n = [0,1,2].map(k=>normals.reduce((s,u,i)=>s+u[k]*v.n[i],0)),length=Math.hypot(...n);
    return {...v,p:v.p.map((x,k)=>x+d[k]),n:length?n.map(x=>x/length):v.n};
  });
  return {...scene,parts:scene.parts.map(p=>p.vertices===vertices?{...p,vertices:next}:p)};
}

export const settings42 = Object.freeze({
  F02: Object.freeze({lift:4,retreat:8,span:19,tip:0}),
  M01: Object.freeze({lift:8,retreat:8,span:14,tip:0})
});
export function jaw42(scene,id,model) {
  return trialJaw42(scene,id,model,settings42[id]);
}

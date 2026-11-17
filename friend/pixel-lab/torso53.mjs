import {supportsBody52} from './body-composition52.mjs';
import {joinPelvis53} from './pelvis-join53.mjs';

// 세 축은 보존형에 대한 변화량이다. 가로와 앞뒤는 서로 독립이다.
export const torsoPresets53 = {
  original: {waistBreadth53:0, waistDepth53:0, seatDepth53:0, pelvisJoin53:false},
  sections: {waistBreadth53:.58, waistDepth53:.84, seatDepth53:.60, pelvisJoin53:false},
  joined: {waistBreadth53:.58, waistDepth53:.84, seatDepth53:.60, pelvisJoin53:true}
};
const originals = new WeakMap();
function bell(y, low, peak, high) {
  if(y<=low||y>=high)return [0,0];
  const width=y<peak?peak-low:peak-high;
  const t=1+(y-peak)/width;
  return [t*t*(3-2*t),6*t*(1-t)/width];
}
export function applyTorso53(study, scene, controls={}) {
  if(!scene || !supportsBody52(study?.id))return scene;
  if(originals.has(scene))scene=originals.get(scene);
  const clamp=value=>{
    if(value==null)return 0;
    if(!Number.isFinite(value)||Math.abs(value)>1)throw RangeError('몸통 조절 범위는 −1부터 1까지입니다.');
    return value;
  };
  const breadth=clamp(controls.waistBreadth53),depth=clamp(controls.waistDepth53),seat=clamp(controls.seatDepth53);
  if(!breadth&&!depth&&!seat&&!controls.pelvisJoin53)return scene;
  const pelvis=study.scene.joints.right.hip[1],span=study.scene.proportions.shoulderY-pelvis;
  const cute=study.scene.proportions.cute, scale=cute?.27:1;
  const seatDepth=study.scene.proportions.depth;
  const parts=scene.parts.map(mesh=>{
    if(mesh.name!=='ribcage-waist-pelvis'&&mesh.name!=='thigh')return mesh;
    let changed=false;
    const vertices=mesh.vertices.map(v=>{
      const [x,y,z]=v.p;
      const u=(y-pelvis)/span;
      const [waist,dw]=bell(u,-.045,.29,.48),[hip,dh]=bell(u,-.29,.012,.245);
      if(!waist&&!hip)return v;
      // 몸통과 허벅지가 포개지는 높이에서 같은 월드 좌표는 같은 곳으로 이동한다.
      // 중심선의 뒤쪽 이동으로 후면에 더 많은 깊이를 배분한다.
      const sx=1+scale*.12*breadth*waist,sz=1+scale*(.44*depth*waist+.22*seat*hip);
      const shift=-scale*.085*seatDepth*seat*hip;
      const dxdy=scale*.12*breadth*dw*x/span;
      const dzdy=scale*(z*(.44*depth*dw+.22*seat*dh)-.085*seatDepth*seat*dh)/span;
      const nx=v.n[0]/sx,nz=v.n[2]/sz,ny=v.n[1]-nx*dxdy-nz*dzdy;
      const length=Math.hypot(nx,ny,nz)||1;
      changed=true;
      return {...v,p:[x*sx,y,z*sz+shift],n:[nx/length,ny/length,nz/length]};
    });
    return changed?{...mesh,vertices}:mesh;
  });
  const shaped={...scene,parts};
  const result=controls.pelvisJoin53?joinPelvis53(shaped):shaped;
  originals.set(result,scene);
  return result;
}

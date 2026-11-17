import {pose34, raisedPose} from './bust34.mjs';
import {makeChest47} from './chest47.mjs';

export const fit48 = Object.freeze({
  restore: .426303486903198, tangent: .33604154190048574,
  qWidth: .2766680982010439, uWidth: .1091699895891361,
  qCenter: .09990476854378358, uCenter: .854703846294433,
  fadeStart: 145, fadeEnd: 160
});

const materialCache = new WeakMap();
const lastCorrection = new WeakMap();
const mix = (a,b,t) => a.map((v,k)=>v+t*(b[k]-v));
const length = (a,b) => Math.hypot(...a.map((x,k)=>x-b[k]));
const unit = a => { const n=Math.hypot(...a)||1; return a.map(v=>v/n); };
function ramp(a,b,x) {
  const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
  return t*t*(3-2*t);
}

function materialPatch(base) {
  if (materialCache.has(base)) return materialCache.get(base);
  const rest=base.restSkin35, active=[];
  rest.forEach(({p:[x,y,z]},i)=>{
    if (z<.05) return;
    const hand=x<0?-1:1, frame=base.paperShape.frame(hand), q=(x-frame.c)*hand/frame.root;
    if (Math.abs(q)>=.75) return;
    const local=base.paperShape.frame(hand,hand*q), u=(local.top-y)/(local.top-local.foot);
    if (u>.52&&u<.965) active.push({i,hand,q,u});
  });
  const right=[8555,8486,8469];
  const left=right.map(i=>{
    const [x,y,z]=rest[i].p;
    const matches=active.filter(v=>v.hand===-1&&length(rest[v.i].p,[-x,y,z])<1e-5);
    if(matches.length!==1) throw new Error('48차 몸통의 대칭 피부점을 찾을 수 없습니다.');
    return matches[0].i;
  });
  const patch={active,edges:{1:right,'-1':left}};
  materialCache.set(base,patch);return patch;
}

function correctionField(base40,base47,arm) {
  const last=lastCorrection.get(base47);
  if (last?.base40===base40 && last.arm===arm) return last.field;
  const {active,edges}=materialPatch(base47), rest=base47.restSkin35;
  const pose=raisedPose(arm);
  const src=pose34(base47,pose).scene.parts[0].vertices, target=pose34(base40,pose).scene.parts[0].vertices;
  const gain=ramp(18,78,arm)*(1-ramp(fit48.fadeStart,fit48.fadeEnd,arm));
  const chord={},normalDelta={};
  for (const hand of [-1,1]) {
    const [l,m,r]=edges[hand];
    const dl=length(rest[l].p,rest[m].p),dr=length(rest[r].p,rest[m].p),t=dl/(dl+dr);
    chord[hand]=mix(src[l].p,src[r].p,t).map((v,k)=>v-src[m].p[k]);
    normalDelta[hand]=mix(src[l].n,src[r].n,t).map((v,k)=>v-src[m].n[k]);
  }
  const field=[];
  for (const {i,hand,q,u} of active) {
    const guard=(1-ramp(.90,.965,u))*ramp(.52,.61,u)*(1-ramp(.65,.75,Math.abs(q)));
    const w=gain*guard*Math.exp(-.5*(((q-fit48.qCenter)/fit48.qWidth)**2+((u-fit48.uCenter)/fit48.uWidth)**2));
    if (w<1e-5) continue;
    const a=src[i], b=target[i];
    const dp=a.p.map((v,k)=>w*(fit48.restore*(b.p[k]-v)+fit48.tangent*chord[hand][k]));
    const dn=a.n.map((v,k)=>w*(fit48.restore*(b.n[k]-v)+fit48.tangent*normalDelta[hand][k]));
    field.push({i,dp,dn});
  }
  lastCorrection.set(base47,{base40,arm,field});return field;
}

export const makeChest48 = makeChest47;

// Add the reference motion to the already posed, possibly edited body.
// Keep source vertices and all local edits intact, including the comparison pane.
export function correctChestPose48(posedScene, base40, base47, degrees) {
  if (!Number.isFinite(degrees)||degrees<=18||degrees>=fit48.fadeEnd ||
      base47?.paperShape?.form?.id!=='W'||!base40?.tissue34 ||
      posedScene?.restSkin35!==base47.restSkin35||base47.restSkin35!==base40.restSkin35) return posedScene;
  const src=posedScene.parts[0].vertices, vertices=src.slice();
  for (const {i,dp,dn} of correctionField(base40,base47,degrees)) {
    const v=src[i];
    vertices[i]={...v,p:v.p.map((x,k)=>x+dp[k]),n:unit(v.n.map((x,k)=>x+dn[k]))};
  }
  return {...posedScene,parts:posedScene.parts.map(m=>m.vertices===src?{...m,vertices}:m)};
}

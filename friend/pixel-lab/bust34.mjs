import {morphForm} from './morph33.mjs';
import {face34} from './face34.mjs';
import {normals} from './face33.mjs';
import {frontRay} from './continuous/body.mjs';
import {bell,clamp,ramp} from './region33.mjs';
import {bankFor} from './rig32.mjs';
import {articulate} from './articulation33.mjs';

// Width, superior/inferior extents, forward projection, apex height, lateral
// placement, dome exponent, inferior overhang and outward direction.
export const types=[
 ['balanced','고른 타원형',[.42,.195,.132,.37,.788,.49,.94,.029,.07]],
 ['shallow','넓고 얕은형',[.54,.172,.103,.19,.788,.51,1.16,.012,.15]],
 ['upper','상부 충만형',[.425,.225,.130,.48,.805,.48,.71,.021,.04]],
 ['drop','하부 충만형',[.435,.218,.105,.49,.751,.51,.80,.054,.11]],
 ['narrow','좁은 기저형',[.322,.181,.127,.42,.790,.50,1.12,.030,.06]],
 ['lateral','외측 분포형',[.44,.19,.142,.35,.777,.62,.89,.036,.29]],
 ['low','하수·피복형',[.45,.257,.097,.48,.727,.52,.75,.086,.10]],
 ['up','높은 중심형',[.38,.153,.151,.31,.825,.47,.93,.012,.035]]
];
const frames=new WeakMap();
function chestFrame(scene){
  if(frames.has(scene))return frames.get(scene);
  const mesh=scene.parts[0],sh=scene.joints.right.shoulder,hp=scene.joints.right.hip;
  const width=Math.abs(sh[0]),length=sh[1]-hp[1],range=y=>(y-hp[1])/length;
  const torsoFaces=mesh.faces.filter(f=>f.every(i=>{const t=range(mesh.vertices[i].p[1]);return t>.22&&t<1.26;}));
  const ray=frontRay(mesh.vertices,torsoFaces,scene.height),mid=Array.from({length:101},(_,i)=>ray(0,hp[1]+length*(.35+.008*i)));
  const arms=['left','right'].map(side=>bankFor(scene,mesh,side+'.shoulder'));
  const fields=mesh.vertices.map(({p},i)=>{
    const t=range(p[1]),x=Math.abs(p[0])/width;
    if(t<.41||t>1.12||x>1.18||p[2]<width*.09)return null;
    const index=clamp((t-.35)/.008,0,99.999),lo=Math.floor(index);
    const center=mid[lo]+(mid[lo+1]-mid[lo])*(index-lo);
    if(!Number.isFinite(center))return null;
    const gate=ramp(.07,.49,p[2]/width)*(1-ramp(.16,.74,Math.max(arms[0][i],arms[1][i])/255));
    const wall=center-width*(.32*x*x+.24*x**4);
    return gate>0?{x,t,gate,wall,side:p[0]<0?-1:1}:null;
  });
  const frame={fields,width,length,mesh};frames.set(scene,frame);return frame;
}
const basisCache=new Map();
export function basis(s){
  const key=[s.heads,s.sex,s.designStyle,s.candidate,s.palette].join('/');
  if(!basisCache.has(key))basisCache.set(key,morphForm(s));
  return basisCache.get(key);
}
export function form34(s,type='balanced',settings={}){
  const source=basis(s),scene=face34(source,s);
  if(s.sex!=='female'||s.heads<5)return scene;
  const frame=chestFrame(source),[rx,upper,lower,projection,level,placement,power,fall,angle]=(types.find(k=>k[0]===type)||types[0])[2];
  const c=k=>clamp(Number(settings[k])||0,-1,1),{width,length,fields}=frame;
  const responses=[],vertices=scene.parts[0].vertices.map((v,i)=>{
    const f=fields[i];if(!f)return v;
    const {x,t,side,gate,wall}=f,volume=c('volume')+.27*side*c('asym');
    const cy=level-.030*c('drop'),cx=placement+.083*c('spacing');
    const dx=(x-cx-angle*(cy-t))/(rx*(1+.22*c('root')+.115*volume));
    const dy=(t-cy)/(t>cy?upper*(1+.16*c('upper')+.10*volume):lower*(1+.14*c('drop')+.12*volume));
    const r2=dx*dx+dy*dy;
    const zone=(1-ramp(.72,1.88,r2))*gate;
    const slide=bell(dx,0,.88)*bell(t,cy+.008,.17)*gate;
    if(zone<.001&&slide<.005)return v;
    const edge=Math.max(0,1-r2/1.56);
    const cap=1-Math.sqrt(Math.max(0,r2/1.56))**2.35;
    const dome=Math.max(0,cap)**(power*(t<cy?.73:.94))*ramp(0,.12,edge);
    const top=ramp(-.09,.10,t-cy),support=fall*(1+.36*c('drop')+.29*volume);
    const tip=projection*(1+.51*volume)*(1+.16*c('upper')*(2*top-1));
    const p=v.p.slice();
    p[0]+=side*width*dome*(angle*.13+.064*dx)*gate;
    p[1]-=length*support*.64*slide;
    p[1]-=length*.023*(1+.32*volume)*dome*(1-top)*gate;
    // Preserve depth through the lateral wall where several surface vertices
    // share nearly the same projection onto the frontal plane.
    const relief=.16+.42*ramp(.42,.90,x);
    p[2]+=(wall+width*tip*dome-v.p[2])*zone*(1-relief);
    // The visible bottom and the chest-wall attachment occupy different curves.
    const fold=ramp(.10,.38,x)*(1-ramp(.65,1,x))*bell(t,cy-lower*.95+.035*dx*dx,.027);
    p[2]-=width*.025*fold*gate;
    const lateral=bell(x,cx+rx*.64,rx*.47)*bell(t,cy+.045,.13)*gate;
    responses[i]={side,free:dome*gate,outer:lateral,lower:(1-top)*dome*gate};
    return {...v,p};
  });
  const body=scene.parts[0].vertices,faces=scene.parts.filter(m=>m.vertices===body).flatMap(m=>m.faces);
  const normal=normals(vertices,faces);
  const shaped=vertices.map((v,i)=>v===body[i]?v:normal[i]);
  return {...scene,parts:scene.parts.map(m=>m.vertices===body?{...m,vertices:shaped}:m),
    tissue34:{responses,width,length,fall,volume:c('volume'),projection}};
}
export function raisedPose(degrees,side='both',plane='side'){
  const pose={};for(const s of ['left','right'])if(side==='both'||side===s)pose[s+'.shoulder']={[plane]:clamp(degrees,0,178)};
  return pose;
}
export function pose34(scene,pose,travel={}){
  const tissue=scene.tissue34;
  if(!tissue)return articulate(scene,pose);
  const lifts={};
  for(const side of ['right','left']){
    const arm=pose[side+'.shoulder']||{};lifts[side]=ramp(12,170,Math.max(arm.side||0,arm.bend||0));
  }
  if(!lifts.left&&!lifts.right&&!Object.values(travel).some(v=>v.some(Boolean)))return articulate(scene,pose);
  const {responses,width,length,fall,projection}=tissue;
  const result=articulate(scene,pose,0,(p,i)=>{
    const r=responses[i];if(!r)return p;const side=r.side>0?'right':'left',lift=lifts[side],d=travel[side]||[0,0,0];
    return [p[0]+width*(r.side*.029*lift*r.outer+d[0]*r.free),
      p[1]+length*lift*(.039*r.outer+.020*r.free+fall*.35*r.lower)+width*d[1]*(.68*r.free+.32*r.lower),
      p[2]+width*(-lift*(.050*r.outer+.075*projection*r.free)+d[2]*r.free)];
  });
  // Recompute surface normals in the deformed region and keep the artist's face normals.
  const mesh=result.scene.parts[0],smooth=normals(mesh.vertices,mesh.faces);
  const fixed=mesh.vertices.map((v,i)=>{
    const w=responses[i]?.free||0;
    if(w<.015)return v;
    const n=v.n.map((a,k)=>a+(smooth[i].n[k]-a)*w*.72),scale=Math.hypot(...n)||1;
    return {...v,n:n.map(a=>a/scale)};
  });
  result.scene={...result.scene,parts:result.scene.parts.map(m=>m.vertices===mesh.vertices?{...m,vertices:fixed}:m)};
  return result;
}
// Analytic underdamped displacement with a known rest pose. Time is in seconds,
// displacements in shoulder half-widths. The same time is used for both editions.
export function response34(time,axis='vertical',side='both',volume=0,fall=.03,support=.45){
  const directions={vertical:[.07,1,.28],side:[1,.18,.10],depth:[.07,.24,1]};
  const vector=directions[axis]||directions.vertical,dt=clamp(time,0,3),out={};
  for(const [name,hand] of [['left',-1],['right',1]]){
    const mass=1+.30*volume+fall*2.5,weights=[.78,1,.88];
    const v=vector.map((m,k)=>{
      const freq=(11.5+k*.8)/Math.sqrt(mass),decay=(3.6+5.2*support)/Math.sqrt(mass);
      return weights[k]*m*(name===side||side==='both'?1:.10)*(.19+.09*volume+.32*fall)*(1-.50*support)*Math.exp(-decay*dt)*Math.sin(dt*freq)*(k===0&&axis==='vertical'?hand:1);
    });out[name]=dt>=2.2?[0,0,0]:v;
  }return out;
}

import {packedWeights} from './continuous/rig32-weights.mjs';
import {norm} from './geometry.mjs';

// Limits describe this inspection rig, degrees relative to its neutral pose.
// Axes are local to the parent. A positive sagittal angle means flexion.
export const joints = {
  shoulder:{label:'어깨',axes:{bend:['앞뒤',-40,165,'x',-1],side:['벌림',0,155,'z',1],turn:['안팎 회전',-55,65,'y',1]}},
  elbow:{label:'팔꿈치',axes:{bend:['굽힘',0,140,'x',-1],turn:['아래팔 회전',-70,75,'y',1]}},
  wrist:{label:'손목',axes:{bend:['굽힘·폄',-60,54,'x',-1],side:['좌우 편위',-17,35,'z',1]}},
  hip:{label:'고관절',axes:{bend:['앞뒤',-15,125,'x',-1],side:['벌림·모음',-18,42,'z',1],turn:['안팎 회전',-35,40,'y',1]}},
  knee:{label:'무릎',axes:{bend:['굽힘',0,135,'x',1]}},
  ankle:{label:'발목',axes:{bend:['발등·발바닥',-48,13,'x',-1]}},
  neck:{label:'목',axes:{bend:['숙임·젖힘',-45,48,'x',1],turn:['좌우 회전',-65,65,'y',1],side:['기울임',-30,30,'z',1]}},
  jaw:{label:'아래턱',axes:{bend:['벌림',0,24,'x',1]}}
};
export const kindOf=id=>id.split('.').at(-1);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const scaled=(a,b,t)=>a.map((x,k)=>x+(b[k]-x)*t);
const columns={};
export async function loadRig(){
  await Promise.all(Object.entries(packedWeights).map(async ([name,encoded])=>{
    const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
    columns[name]=new Uint8Array(await new Response(stream).arrayBuffer());
  }));
}
export function setAngle(pose,id,axis,value){
  const axes=joints[kindOf(id)].axes;
  if(!axes[axis]||!Number.isFinite(value)) return;
  const [,min,max]=axes[axis];
  // Limit combined extremes while preserving already set axes.
  let used=0;
  for(const [k,[,lo,hi]] of Object.entries(axes)){
    const v=pose[id]?.[k]||0;
    if(k!==axis && v) used+=(v/(v>0?hi:lo))**2;
  }
  const room=Math.sqrt(Math.max(0,1-used));
  (pose[id]??={})[axis]=Math.round(clamp(value,min*room,max*room)*10)/10;
}
export function pivots(scene){
  const result={};
  for(const side of ['left','right']) for(const k of ['shoulder','elbow','wrist','hip','knee','ankle'])result[side+'.'+k]=scene.joints[side][k];
  const y=scene.landmarks.chin[1];
  result.neck=scene.rigPivots?.neck??[0,y+.015,-.035];
  result.jaw=scene.rigPivots?.jaw??[0,y+.29,.015];
  return result;
}
const parentOf=id=>{
  if(id==='jaw') return 'neck';
  const [side,k]=id.split('.');
  const parent={wrist:'elbow',elbow:'shoulder',ankle:'knee',knee:'hip'}[k];
  return parent?side+'.'+parent:null;
};
const order=['jaw','neck',...['left','right'].flatMap(s=>['wrist','elbow','shoulder','ankle','knee','hip'].map(k=>s+'.'+k))];
function rotate(v,axis,a){
  const c=Math.cos(a),s=Math.sin(a),[x,y,z]=v;
  if(axis==='x')return [x,y*c-z*s,y*s+z*c];
  if(axis==='y')return [x*c+z*s,y,z*c-x*s];
  return [x*c-y*s,x*s+y*c,z];
}
function operation(id,angles,points,scene){
  const kind=kindOf(id),sign=id.startsWith('left.')?-1:1,origin=points[id];
  const rotations=[];
  const next={shoulder:'elbow',elbow:'wrist',hip:'knee'}[kind];
  const tip=next?points[id.split('.')[0]+'.'+next]:null;
  const twistAxis=tip?norm(origin.map((x,i)=>x-tip[i])):null;
  for(const [axis,[,,,basis,direction]] of Object.entries(joints[kind].axes)){
    const value=angles[axis]||0;
    if(value) rotations.push([basis,value*Math.PI/180*direction*(kind!=='neck' && basis!=='x'?sign:1)]);
  }
  const reach=kind==='shoulder'?Math.max(0,angles.side||0,angles.bend||0):0;
  const elevation=smooth(45,155,reach)*(scene.height<5?.085:.14);
  const opening=kind==='jaw'?smooth(0,24,angles.bend||0):0;
  return (p,n,w)=>{
    let delta=p.map((x,k)=>x-origin[k]);
    for(const [axis,angle] of rotations){
      const apply=v=>{
        if(axis!=='y'||!twistAxis)return rotate(v,axis,angle*w);
        const [x,y,z]=twistAxis,[a,b,c]=v,cos=Math.cos(angle*w),sin=Math.sin(angle*w),dot=x*a+y*b+z*c;
        return [a*cos+(y*c-z*b)*sin+x*dot*(1-cos),b*cos+(z*a-x*c)*sin+y*dot*(1-cos),c*cos+(x*b-y*a)*sin+z*dot*(1-cos)];
      };
      delta=apply(delta);if(n)n=apply(n);
    }
    return [delta.map((x,k)=>x+origin[k]+(k===1?elevation-.012*opening:k===2?.042*opening:0)*w),n];
  };
}
// Distances to the authored limbs distinguish the arm from the hip at the same height.
function shortWeight(id,p,points,scene,headPart){
  const [x,y,z]=p,kind=kindOf(id),chin=scene.landmarks.chin[1];
  if(kind==='neck')return headPart?1:smooth(chin-.16,chin+.10,y)*(1-smooth(.12,.32,Math.abs(x)));
  if(kind==='jaw') return headPart?smooth(.06,.26,z)*(1-smooth(chin+.15,chin+.36,y)):0;
  if(headPart)return 0;
  const side=id.split('.')[0],mirror=side==='right'?1:-1;
  const point=k=>points[side+'.'+k],sh=point('shoulder'),el=point('elbow'),wr=point('wrist'),hp=point('hip'),kn=point('knee'),an=point('ankle');
  const arm=['shoulder','elbow','wrist'].includes(kind);
  const [a,b,c]=arm?[sh,el,wr]:[hp,kn,an];
  const [upper,lower]=y>=b[1]?[a,b]:[b,c];
  const center=scaled(upper,lower,clamp((upper[1]-y)/(upper[1]-lower[1]),0,1));
  const radius=arm?.105+(scene.height-2)*.027:.15+(scene.height-2)*.045;
  let region;
  if(arm){
    const lateral=smooth(center[0]*mirror-radius*1.30,center[0]*mirror-radius*.38,x*mirror);
    region=lateral*smooth(wr[1]-.28,wr[1]-.20,y);
  }else{
    region=smooth(-radius*.30,radius*.62,x*mirror);
    const besideArm=smooth((wr[0]*mirror)-radius*.71,wr[0]*mirror-radius*.22,x*mirror)*smooth(wr[1]-.26,wr[1]-.17,y);
    region*=1-besideArm;
  }
  const pivot=points[id],band=(kind==='shoulder'||kind==='hip')?radius*1.38:radius*.95;
  return region*(1-smooth(pivot[1]-band,pivot[1]+band,y));
}
function featureWeight(id,part,p,scene){
  if(id==='neck')return 1;
  if(id!=='jaw')return 0;
  if(/mouth|lip/.test(part.name))return smooth(-.05,.06,scene.landmarks.chin[1]+.20-p[1]);
  return 0;
}
const components=new WeakMap();
// Flood only below a cross-section where the limb has separated from the trunk.
// This gives the entire inner forearm the same parent as its outer surface.
function distalRegion(scene,mesh,id){
  const kind=kindOf(id),leg=['hip','knee','ankle'].includes(kind);
  const side=id.split('.')[0],j=scene.joints[side],key=side+(leg?'leg':'arm');
  let cache=components.get(scene);if(!cache){cache=new Map();components.set(scene,cache);}
  if(cache.has(key))return cache.get(key);
  if(!cache.has('neighbors')){
    const graph=mesh.vertices.map(()=>[]);
    for(const [a,b,c] of mesh.faces){graph[a].push(b,c);graph[b].push(a,c);graph[c].push(a,b);}
    cache.set('neighbors',graph);
  }
  const graph=cache.get('neighbors'),upper=leg?j.hip:j.shoulder,middle=leg?j.knee:j.elbow,end=leg?j.ankle:j.wrist;
  let seed=0,distance=Infinity;
  mesh.vertices.forEach(({p},i)=>{const d=Math.hypot(...p.map((x,k)=>x-end[k]));if(d<distance){seed=i;distance=d;}});
  let region=null;
  for(const cut of [.45,.60,.78,.91]){
    const limit=upper[1]+(middle[1]-upper[1])*cut,seen=new Uint8Array(graph.length),todo=[seed];
    seen[seed]=1;
    let crossed=false;
    while(todo.length){
      const i=todo.pop(),x=mesh.vertices[i].p[0];
      if(x*end[0]<0)crossed=true;
      for(const v of graph[i])if(!seen[v]&&mesh.vertices[v].p[1]<limit){seen[v]=1;todo.push(v);}
    }
    if(!crossed){region={seen,limit,blend:Math.min(.07,(upper[1]-middle[1])*.14)};break;}
  }
  cache.set(key,region);return region;
}
const restBanks=new WeakMap();
function bankFor(scene,part,id){
  let banks=restBanks.get(scene);if(!banks){banks=new WeakMap();restBanks.set(scene,banks);}
  let bank=banks.get(part.vertices);if(!bank){bank=new Map();banks.set(part.vertices,bank);}
  if(bank.has(id))return bank.get(id);
  let values;
  if(part.name==='continuous-CC0-derived-body' || (scene.height>=5 && part.vertices.length===columns.neck?.length))values=columns[id];
  else{
    const pvt=pivots(scene);
    values=Uint8Array.from(part.vertices,v=>Math.round(255*(scene.height<5?
      shortWeight(id,v.p,pvt,scene,part.name!=='continuous-neutral-chibi-body'):featureWeight(id,part,v.p,scene))));
  }
  if(scene.height<5 && part.name==='continuous-neutral-chibi-body' && id.includes('.')){
    const region=distalRegion(scene,part,id);
    if(region){
      const kind=kindOf(id),pivot=pivots(scene)[id],band=(.07+.028*(scene.height-2));
      part.vertices.forEach(({p},i)=>{
        if(p[1]>=region.limit)return;
        const rigid=region.seen[i]?1-smooth(pivot[1]-band,pivot[1]+band,p[1]):0;
        const blend=smooth(region.limit-region.blend,region.limit,p[1]);
        values[i]=Math.round(rigid*255*(1-blend)+values[i]*blend);
      });
    }
  }
  if(!values) throw Error('관절 가중치 미로딩');
  bank.set(id,values);return values;
}
export function poseScene(scene,pose){
  const points=pivots(scene),handles={...points};
  const active=order.filter(id=>Object.values(pose[id]||{}).some(Boolean));
  if(!active.length)return {scene,handles};
  const ops=active.map(id=>operation(id,pose[id],points,scene));
  for(const id of Object.keys(points)){
    const ancestors=new Set();
    for(let parent=parentOf(id);parent;parent=parentOf(parent))ancestors.add(parent);
    active.forEach((joint,i)=>{if(ancestors.has(joint)||joint===id)handles[id]=ops[i](handles[id],null,1)[0];});
  }
  const seen=new Map();
  const parts=scene.parts.map(part=>{
    let vertices=seen.get(part.vertices);
    if(!vertices){
      const banks=active.map(id=>bankFor(scene,part,id));
      vertices=part.vertices.map((v,k)=>{
        let p=v.p,n=v.n;
        for(let i=0;i<ops.length;i++){const w=banks[i][k];if(w)[p,n]=ops[i](p,n,w/255);}
        return p===v.p?v:{...v,p,n:norm(n)};
      });
      seen.set(part.vertices,vertices);
    }
    return {...part,vertices};
  });
  const posedJoints={};
  for(const side of ['left','right'])posedJoints[side]=Object.fromEntries(Object.keys(scene.joints[side]).map(k=>[k,handles[side+'.'+k]??scene.joints[side][k]]));
  return {scene:{...scene,parts,joints:posedJoints,restScene:scene},handles};
}
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
export function inspectStrain(scene){
  if(!scene.restScene)return {scene,count:0,total:0};
  let count=0,total=0;
  const parts=scene.parts.map((mesh,idx)=>{
    const neutral=scene.restScene.parts[idx],flags=new Uint8Array(mesh.faces.length);
    mesh.faces.forEach((f,i)=>{
      let worst=0;
      for(let j=0;j<3;j++){
        const a=f[j],b=f[(j+1)%3],length=distance(neutral.vertices[a].p,neutral.vertices[b].p);
        if(length<.0005)continue;
        const ratio=distance(mesh.vertices[a].p,mesh.vertices[b].p)/length;
        if(Math.abs(ratio-1)>Math.abs(worst))worst=ratio-1;
      }
      flags[i]=worst>.25?1:worst<-.25?2:0;
      if(flags[i])count++;total++;
    });
    return {...mesh,strain:flags};
  });
  return {scene:{...scene,parts},count,total};
}

import {joints as previous,kindOf,pivots as basePivots,bankFor,operation} from './rig32.mjs';
import {ramp,clamp,weights,bell} from './region33.mjs';
const axis=(title,lo,hi,dimension,sign=1)=>[title,lo,hi,dimension,sign];
export const joints={
 ...previous,
 girdle:{label:'어깨띠',axes:{side:axis('올림·내림',-16,28,'z'),turn:axis('앞으로·뒤로',-18,26,'y',-1)}},
 shoulder:{label:'어깨',axes:{bend:axis('앞뒤',-55,178,'x',-1),side:axis('모음·벌림',-25,178,'z'),turn:axis('안팎 회전',-82,86,'y')}},
 elbow:{label:'팔꿈치',axes:{bend:axis('굽힘',-5,150,'x',-1),turn:axis('아래팔 회전',-82,85,'y')}},
 hip:{label:'고관절',axes:{bend:axis('앞뒤',-27,135,'x',-1),side:axis('모음·벌림',-30,52,'z'),turn:axis('안팎 회전',-46,50,'y')}},
 knee:{label:'무릎',axes:{bend:axis('굽힘',-4,150,'x'),turn:axis('굽혔을 때 회전',-18,24,'y')}},
 ankle:{label:'발목',axes:{bend:axis('발등·발바닥',-55,23,'x',-1),side:axis('안팎 기울임',-18,32,'z')}},
 wrist:{label:'손목',axes:{bend:axis('굽힘·폄',-72,76,'x',-1),side:axis('좌우 편위',-20,37,'z')}},
 pelvis:{label:'골반',axes:{bend:axis('전후 기울임',-32,36,'x'),side:axis('좌우 경사',-25,25,'z'),turn:axis('회전',-45,45,'y')}},
 lumbar:{label:'허리',axes:{bend:axis('굽힘·폄',-26,47,'x'),side:axis('기울임',-22,22,'z'),turn:axis('회전',-12,12,'y')}},
 thorax:{label:'흉곽',axes:{bend:axis('굽힘·폄',-18,33,'x'),side:axis('기울임',-20,20,'z'),turn:axis('회전',-32,32,'y')}},
 toes:{label:'발가락',axes:{bend:axis('굽힘·폄',-60,38,'x')}}
};
for(const [i,name] of ['엄지','검지','중지','약지','소지'].entries())joints['digit'+(i+1)]={label:name,axes:{bend:axis('마디 굽힘',-12,i?90:58,'x')}};
export function limits(id,key,mode,pose){
  const kind=kindOf(id),[,lo,hi]=joints[kind].axes[key];
  let a=lo,b=hi;
  if(mode==='trained'&&kind==='hip'){if(key==='side')b=88;if(key==='bend'){a=-40;b=152;}}
  if(mode==='trained'&&kind==='knee'&&key==='bend')b=159;
  if(kind==='knee'&&key==='turn'){const f=ramp(2,48,pose[id]?.bend||0);a*=f;b*=f;}
  // The two swing directions share a cone, axial rotation has its own budget.
  if(['hip','shoulder'].includes(kind)&&['side','bend'].includes(key)){
    const other=key==='side'?'bend':'side',angle=pose[id]?.[other]||0;
    const bound=kind==='shoulder'?182:mode==='trained'?167:149;
    const room=Math.sqrt(Math.max(0,bound*bound-angle*angle));a=Math.max(a,-room);b=Math.min(b,room);
  }
  return [Math.ceil(a),Math.floor(b)];
}
export function setAngle(pose,id,key,value,mode='human'){
  if(!joints[kindOf(id)]?.axes[key]||!Number.isFinite(value))return;
  const [lo,hi]=limits(id,key,mode,pose);(pose[id]??={})[key]=clamp(value,lo,hi);
  if(kindOf(id)==='knee'&&key==='bend'&&pose[id].turn)setAngle(pose,id,'turn',pose[id].turn,mode);
}
export const presets={
 '중립':{},'캡처 · 공중 X':{'both.shoulder':{side:155},'both.hip':{side:42}},
 '넓게 딛기':{'both.shoulder':{side:165},'both.hip':{side:18,turn:23,bend:18},'both.knee':{bend:30},'both.ankle':{side:-18,bend:12},pelvis:{bend:-5}},
 '양팔 만세':{'both.shoulder':{bend:174,turn:20},thorax:{bend:-8}},
 '깊은 쪼그림':{'both.hip':{bend:127,side:12,turn:16},'both.knee':{bend:146},'both.ankle':{bend:22},pelvis:{bend:9},lumbar:{bend:13},'both.shoulder':{bend:57}},
 '옆차기':{'right.hip':{side:72,bend:44,turn:35},'right.knee':{bend:8},pelvis:{side:22},thorax:{side:-17},'left.shoulder':{side:75},'right.elbow':{bend:90}},
 '앞뒤 찢기':{'right.hip':{bend:115,turn:12},'left.hip':{bend:-40,turn:-19},pelvis:{bend:25},lumbar:{bend:-19},'left.knee':{bend:8}},
 '옆으로 찢기':{'both.hip':{side:88,turn:35},'both.ankle':{bend:-29}},
 '한쪽 어깨 올리기':{'right.girdle':{side:25},'left.girdle':{side:-8},neck:{side:-12}},
 '런지':{'right.hip':{bend:93},'right.knee':{bend:94},'right.ankle':{bend:17},'left.hip':{bend:-22},'left.knee':{bend:88},'left.ankle':{bend:-34},pelvis:{bend:7}},
 '무릎 꿇기':{'both.hip':{bend:68},'both.knee':{bend:143},'both.ankle':{bend:-42},pelvis:{bend:-10}},
 '가슴 앞 교차':{'both.girdle':{turn:22},'both.shoulder':{bend:64,side:-20,turn:41},'both.elbow':{bend:102}},
 '옆구리 늘이기':{'left.shoulder':{bend:157,side:31},'left.girdle':{side:15},lumbar:{side:-17},thorax:{side:-18},pelvis:{side:9}},
 '등 뒤로 손':{'right.shoulder':{bend:-50,turn:-56},'right.elbow':{bend:110},thorax:{turn:12}},
 '뒤돌아보기':{pelvis:{turn:16},lumbar:{turn:9},thorax:{turn:28},neck:{turn:62}},
 '주먹·발끝':Object.fromEntries([...[1,2,3,4,5].map(i=>['both.digit'+i,{bend:i===1?48:79}]),['both.ankle',{bend:-50}],['both.toes',{bend:28}]])
};
export function presetPose(name,mode){
  const pose={};for(const [id,axes] of Object.entries(presets[name]||{}))for(const joint of id.startsWith('both.')?['left','right'].map(s=>id.replace('both',s)):[id])for(const [key,v] of Object.entries(axes))setAngle(pose,joint,key,v,mode);return pose;
}
const restInfo=new WeakMap();
function info(scene){
  if(restInfo.has(scene))return restInfo.get(scene);
  const points=basePivots(scene),body=scene.parts[0],count=body.vertices.length,h=scene.joints.right.hip[1],s=scene.joints.right.shoulder[1];
  points.pelvis=[0,h,.04];points.lumbar=[0,h+(s-h)*.22,0];points.thorax=[0,h+(s-h)*.54,.01];
  const adult=scene.height>=5,parents={jaw:'neck',neck:'thorax',thorax:'lumbar',lumbar:'pelvis'},order=[];
  for(const side of ['left','right']){
    const j=scene.joints[side];
    function weightedPoint(id,fallback){
      if(!adult)return fallback;
      const mask=weights(side+'.'+id,count);let sum=0;const center=[0,0,0];
      mask.forEach((w,i)=>{if(!w)return;sum+=w;for(let k=0;k<3;k++)center[k]+=body.vertices[i].p[k]*w;});
      return sum?center.map(v=>v/sum):fallback;
    }
    for(let i=1;i<=5;i++){
      if(!adult)continue;
      const key=side+'.digit'+i;points[key]=weightedPoint('finger'+i+'-1',j.wrist);
      const stem='finger'+i+'-';
      const p1=weightedPoint(stem+'1',j.wrist),p2=weightedPoint(stem+'2',p1),p3=weightedPoint(stem+'3',p2);
      points[key]=p1.map((v,k)=>v+.73*(v-p2[k]));
      for(const [segment,center] of [[3,p3],[2,p2]]){
        // Internal phalanges are driven by one finger control.
        const node=key+'/'+segment;points[node]=center.map((v,k)=>v+.32*(p2[k]-p3[k]));
        parents[node]=segment===3?key+'/2':key;order.push(node);
      }
      parents[key]=side+'.wrist';order.push(key);
    }
    const toes=side+'.toes';points[toes]=weightedPoint('toes',[j.ankle[0],j.ankle[1]*.52,j.ankle[2]+.11]);
    parents[toes]=side+'.ankle';order.push(toes);
    for(const [child,parent] of [['wrist','elbow'],['elbow','shoulder'],['shoulder','girdle'],['ankle','knee'],['knee','hip'],['hip','pelvis']]){
      const id=side+'.'+child;parents[id]=['thorax','pelvis'].includes(parent)?parent:side+'.'+parent;order.push(id);
    }
    const girdle=side+'.girdle';points[girdle]=[j.shoulder[0]*.40,j.shoulder[1]-.06,j.shoulder[2]-.045];parents[girdle]='thorax';order.push(girdle);
  }
  order.push('jaw','neck','thorax','lumbar','pelvis');
  const value={points,parents,order,body,adult};restInfo.set(scene,value);return value;
}
function weight(scene,mesh,id,info){
  const kind=kindOf(id.split('/')[0]),main=mesh.vertices===info.body.vertices,side=id.split('.')[0],count=mesh.vertices.length;
  if(kind==='pelvis')return ()=>1;
  if(kind==='girdle'){
    if(!main)return ()=>0;
    const arm=bankFor(scene,mesh,side+'.shoulder'),clavicle=info.adult?weights(id,count):null;
    return i=>clamp((arm[i]+(clavicle?.[i]||0))/255);
  }
  if(kind==='lumbar'||kind==='thorax'){
    const p=info.points[id],length=scene.landmarks.shoulder-scene.landmarks.pelvis;
    if(!main)return ()=>1;
    const arms=['left','right'].map(s=>bankFor(scene,mesh,s+'.shoulder'));
    return (i,q)=>Math.max(ramp(p[1]-.20*length,p[1]+.24*length,q[1]),arms[0][i]/255,arms[1][i]/255);
  }
  if(kind.startsWith('digit')||kind==='toes'){
    if(!main)return ()=>0;
    if(!info.adult){const a=scene.joints[side].ankle;return (i,p)=>p[0]*a[0]>0?(1-ramp(a[1]*.65,a[1]*1.5,p[1]))*ramp(.055,.18,p[2]):0;}
    const data=weights(side+'.'+(kind==='toes'?'toes':'finger'+kind.slice(-1)+'-'+(id.split('/')[1]||1)),count);
    return i=>data[i]/255;
  }
  const bank=bankFor(scene,mesh,id);return i=>bank[i]/255;
}
function turn(p,origin,axis,a){
  const q=p.map((v,k)=>v-origin[k]),c=Math.cos(a),s=Math.sin(a);
  const [x,y,z]=q;const d=axis==='x'?[x,y*c-z*s,y*s+z*c]:axis==='y'?[x*c+z*s,y,z*c-x*s]:[x*c-y*s,x*s+y*c,z];
  return d.map((v,k)=>v+origin[k]);
}
function action(id,angles,I,scene){
  const kind=kindOf(id.split('/')[0]),side=id.split('.')[0],sign=side==='left'?-1:1,pivot=I.points[id];
  if(kind!=='shoulder'&&!kind.startsWith('digit')&&!['girdle','lumbar','pelvis','thorax','toes'].includes(kind))return operation(id,angles,I.points,{...scene,rigAxes:joints});
  if(kind.startsWith('digit')){
    const a=I.points[side+'.digit2'],b=I.points[side+'.digit5'];
    const raw=b.map((x,k)=>(x-a[k])*sign),length=Math.hypot(...raw);
    const unit=raw.map(x=>x/(length||1)),segment=Number(id.split('/')[1]||1);
    const coefficient=segment===2?1.06:segment===3?.68:.82;
    return (p,n,w)=>{
      const rad=angles.bend*coefficient*w*Math.PI/180,c=Math.cos(rad),s=Math.sin(rad);
      function apply(v){
        const [x,y,z]=unit,[a,b,d]=v,dot=x*a+y*b+z*d;
        return [a*c+(y*d-z*b)*s+x*dot*(1-c),b*c+(z*a-x*d)*s+y*dot*(1-c),d*c+(x*b-y*a)*s+z*dot*(1-c)];
      }
      const q=apply(p.map((x,k)=>x-pivot[k]));return [q.map((x,k)=>x+pivot[k]),n&&apply(n)];
    };
  }
  const shoulder=kind==='shoulder',lift=Math.max(angles.side||0,angles.bend||0);
  const coupled=shoulder?ramp(12,168,lift)*.30:0;
  const tip=shoulder?I.points[side+'.elbow']:null;
  const longitudinal=tip&&pivot.map((v,k)=>v-tip[k]),length=tip&&Math.hypot(...longitudinal);
  const shaft=tip&&longitudinal.map(v=>v/(length||1));
  const root=shoulder?[pivot[0]*.48,pivot[1]-.12*Math.abs(pivot[0]),pivot[2]-.085]:pivot;
  const axes=Object.entries(joints[kind].axes).filter(([k])=>angles[k]).sort(([a],[b])=>Number(b==='turn')-Number(a==='turn'));
  return (p,n,w,g=w)=>{
    let pos=p,normal=n;
    for(const [key,[,,,axis,factor]] of axes){
      const mirror=id.includes('.')&&axis!=='x'?sign:1;
      const angle=angles[key]*Math.PI/180*factor*mirror;
      if(shaft&&key==='turn'){
        const [x,y,z]=shaft,c=Math.cos(angle*w),s=Math.sin(angle*w);
        const rotate=([a,b,d])=>{const dot=x*a+y*b+z*d;return [a*c+(y*d-z*b)*s+x*dot*(1-c),b*c+(z*a-x*d)*s+y*dot*(1-c),d*c+(x*b-y*a)*s+z*dot*(1-c)];};
        pos=rotate(pos.map((v,k)=>v-pivot[k])).map((v,k)=>v+pivot[k]);if(normal)normal=rotate(normal);continue;
      }
      const f=shoulder&&key!=='turn'&&angles[key]>0?coupled:0;
      pos=turn(pos,pivot,axis,angle*(1-f)*w);
      if(normal)normal=turn(normal,[0,0,0],axis,angle*(1-f)*w);
      if(f){pos=turn(pos,root,axis,angle*f*g);if(normal)normal=turn(normal,[0,0,0],axis,angle*f*g);}
    }
    return [pos,normal];
  };
}
export function articulate(scene,pose,motion=0){
  const I=info(scene),handles=Object.fromEntries(Object.entries(I.points).filter(([id])=>!id.includes('/'))),active=I.order.filter(id=>Object.values(pose[id.split('/')[0]]||{}).some(Boolean));
  if(!active.length&&!motion)return {scene,handles};
  const ops=active.map(id=>action(id,pose[id.split('/')[0]],I,scene));
  for(const id of Object.keys(handles)){
    const chain=new Set([id]);for(let p=I.parents[id];p;p=I.parents[p])chain.add(p);
    active.forEach((k,i)=>{if(chain.has(k))handles[id]=ops[i](handles[id],null,1,1)[0];});
  }
  const cache=new Map(),parts=scene.parts.map(mesh=>{
    if(cache.has(mesh.vertices))return {...mesh,vertices:cache.get(mesh.vertices)};
    const fns=active.map(id=>weight(scene,mesh,id,I)),main=mesh.vertices===I.body.vertices;
    const gl=active.map(id=>kindOf(id)==='shoulder'&&I.adult&&main?weights(id.replace('shoulder','girdle'),mesh.vertices.length):null);
    const bends=active.map(id=>{
      const kind=kindOf(id);if(!I.adult||!main||!['hip','knee','elbow'].includes(kind))return null;
      const angles=pose[id],point=I.points[id],spread=ramp(26,78,angles.side||0),flex=ramp(65,140,angles.bend||0);
      return (spread||flex)?{kind,point,spread,flex,side:Math.sign(point[0])}:null;
    });
    const chest=motion&&I.adult&&main?['left','right'].map(s=>weights(s+'.chest',mesh.vertices.length)):null;
    const vs=mesh.vertices.map((v,i)=>{
      let p=v.p,n=v.n;
      if(chest){
        const left=typeof motion==='number'?motion:motion.left,right=typeof motion==='number'?motion:motion.right;
        const displacement=(chest[0][i]*left+chest[1][i]*right)/255;
        if(displacement)p=[p[0],p[1]+displacement*scene.joints.right.shoulder[0]*.14,p[2]+displacement*.036];
      }
      ops.forEach((op,k)=>{
        const w=fns[k](i,v.p),g=clamp(w+(gl[k]?.[i]||0)/255);
        const bend=bends[k];
        if(bend&&w>0&&w<1){
          const {kind,point,spread,flex,side}=bend,width=Math.abs(scene.joints.right.shoulder[0]);
          const x=(v.p[0]-point[0])*side/width,y=(v.p[1]-point[1])/width,z=(v.p[2]-point[2])/width;
          const blend=4*w*(1-w);
          if(kind==='hip'){
            const pad=bell(x,.1,.42)*bell(y,-.12,.44)*blend;
            p=[p[0]+side*width*.065*pad*spread,p[1]+width*.04*pad*spread,p[2]-.058*width*pad*flex*ramp(.02,.30,-z)];
          }else{
            const bendZone=bell(y,0,.33)*bell(x,0,.30)*flex*blend;
            const tip=kind==='knee'?1:-1;
            p=[p[0],p[1],p[2]+tip*width*.065*bendZone*ramp(.02,.23,z*tip)];
          }
        }
        if(gl[k]&&g){
          const joint=I.points[active[k]],side=Math.sign(joint[0]),width=Math.abs(joint[0]),torso=joint[1]-I.points.pelvis[1];
          const lift=Math.max(pose[active[k]].side||0,pose[active[k]].bend||0);
          const fold=ramp(65,155,lift)*bell(v.p[0]*side/width,.83,.21)*bell((joint[1]-v.p[1])/torso,.15,.11);
          if(fold>.001)p=[p[0]-side*width*.09*fold,p[1]+torso*.041*fold,p[2]-.024*width*fold];
        }
        if(w||g)[p,n]=op(p,n,w,g);
      });
      return p===v.p?v:{...v,p,n};
    });cache.set(mesh.vertices,vs);return {...mesh,vertices:vs};
  });
  const posedJoints={};for(const s of ['left','right'])posedJoints[s]=Object.fromEntries(Object.entries(scene.joints[s]).map(([k,p])=>[k,handles[s+'.'+k]||p]));
  return {scene:{...scene,parts,joints:posedJoints,restScene:scene},handles};
}
const boundsCache=new WeakMap();
function bounds(scene){
  if(boundsCache.has(scene))return boundsCache.get(scene);
  const a=[Infinity,Infinity,Infinity],b=[-Infinity,-Infinity,-Infinity],seen=new Set();
  for(const mesh of scene.parts)if(!seen.has(mesh.vertices)){seen.add(mesh.vertices);for(const {p} of mesh.vertices)for(let j=0;j<3;j++){a[j]=Math.min(a[j],p[j]);b[j]=Math.max(b[j],p[j]);}}
  const value={a,b};boundsCache.set(scene,value);return value;
}
export function commonFrame(before,after,yaw=0,pitch=0){
  const boxes=[bounds(before),bounds(after)],lo=[0,1,2].map(k=>Math.min(...boxes.map(b=>b.a[k]))),hi=[0,1,2].map(k=>Math.max(...boxes.map(b=>b.b[k])));
  const d=hi.map((v,i)=>v-lo[i]),y=yaw*Math.PI/180,p=pitch*Math.PI/180;
  const dx=Math.abs(Math.cos(y))*d[0]+Math.abs(Math.sin(y))*d[2];
  const dy=Math.abs(Math.cos(p))*d[1]+Math.abs(Math.sin(p))*(Math.abs(Math.sin(y))*d[0]+Math.abs(Math.cos(y))*d[2]);
  return {cameraCenter:lo.map((v,i)=>(v+hi[i])/2),frame:Math.max(dx,dy)*1.085};
}

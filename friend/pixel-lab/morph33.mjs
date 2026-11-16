import {faceForm,normals} from './face33.mjs';
import {weights,ramp,clamp,bell} from './region33.mjs';
import {bankFor} from './rig32.mjs';
export const bodyParams={shoulder:'어깨 너비',rib:'흉곽 너비',waist:'허리 너비',hip:'골반 너비',thigh:'허벅지 길이',shin:'종아리 길이',arm:'팔 길이',hand:'손 크기',foot:'발 크기',head:'얼굴 너비'};
export const chestParams={volume:'크기',root:'밑면 너비',upper:'윗부분 충만도',drop:'하부 무게 중심',spacing:'좌우 간격',asym:'좌우 차이'};
export const chestPresets={'기본':{},'작고 얕게':{volume:-.76,root:-.18,upper:-.23},'넓고 낮게':{volume:.14,root:.9,upper:-.48,drop:.48},'상부가 둥글게':{volume:.56,upper:.8,drop:-.30},'하부가 풍성하게':{volume:.77,drop:.77,upper:-.60,root:.12},'좌우 차이':{volume:.27,asym:.81,spacing:.28}};
export const bodyPresets={'기준 비율':{},'긴 팔다리':{thigh:.66,shin:.73,arm:.69,waist:-.32},'선이 강한 만화형':{thigh:.82,shin:.67,shoulder:.38,rib:-.28,waist:-.84,hip:.58,hand:.23,foot:.24},'작고 단단한 비율':{thigh:-.57,shin:-.39,rib:.45,shoulder:.51,hip:.17}};
function interpolate(y,src,dst){let i=0;while(i<src.length-2&&y>src[i+1])i++;return dst[i]+(y-src[i])*(dst[i+1]-dst[i])/(src[i+1]-src[i]);}
function values(keys,params){return Object.fromEntries(Object.keys(keys).map(k=>[k,clamp(Number(params?.[k])||0,-1,1)]));}
const softened=new Map();
function tissue(side,mesh){
  if(softened.has(side))return softened.get(side);
  const count=mesh.vertices.length,graph=mesh.vertices.map(()=>new Set());
  for(const [a,b,c] of mesh.faces){graph[a].add(b).add(c);graph[b].add(a).add(c);graph[c].add(a).add(b);}
  let data=Float32Array.from(weights(side+'.chest',count),x=>x/255);
  for(let pass=0;pass<6;pass++){
    const next=data.slice();
    for(let i=0;i<count;i++)if(graph[i].size){
      let sum=0;for(const n of graph[i])sum+=data[n];
      next[i]=.46*data[i]+.54*sum/graph[i].size;
    }
    data=next;
  }
  const out=Uint8Array.from(data,v=>255*Math.sin(Math.PI/2*clamp(v*1.18)));
  softened.set(side,out);return out;
}
export function morphForm(s,body={},chest={},motion=0){
  const base=faceForm(s),p=values(bodyParams,body),c=values(chestParams,chest),adult=s.heads>=5;
  const bust=adult&&s.sex==='female',j=base.joints.right,sh=j.shoulder,hp=j.hip,kn=j.knee,an=j.ankle,chin=base.landmarks.chin[1],width=sh[0],torso=sh[1]-hp[1];
  const raw=[0,an[1],kn[1],hp[1],sh[1],chin,base.height];
  const knee=kn[1]+(kn[1]-an[1])*p.shin*.19,hip=knee+(hp[1]-kn[1])*(1+p.thigh*.19);
  const dst=[0,an[1],knee,Math.min(hip,sh[1]-.48*torso),sh[1],chin,base.height];
  function contour(pos){
    const [x,y,z]=pos;
    const torsoMask=ramp(hp[1]-.28*torso,hp[1],y)*(1-ramp(sh[1],chin,y));
    const t=(y-hp[1])/torso;
    const dx=.25*p.hip*bell(t,.025,.20)+.31*p.waist*bell(t,.41,.23)+.23*p.rib*bell(t,.76,.22)+.20*p.shoulder*bell(t,1,.19);
    const sideScale=1+torsoMask*dx+.12*p.head*ramp(chin-.03,chin+.17,y);
    return [x*sideScale,interpolate(y,raw,dst),z*(1+torsoMask*dx*.46)];
  }
  const currentBody=base.parts[0], count=currentBody.vertices.length;
  const left=bust?tissue('left',currentBody):null,right=bust?tissue('right',currentBody):null;
  function limb(pos,side,armWeight,handWeight,footWeight){
    const center=base.joints[side],q=contour(pos);
    const shoulder=contour(center.shoulder),wrist=contour(center.wrist),ankle=contour(center.ankle);
    return q.map((v,k)=>v+(pos[k]-center.shoulder[k])*p.arm*.18*armWeight+
      (shoulder[k]-center.shoulder[k]-(q[k]-pos[k]))*armWeight+
      (v-wrist[k])*p.hand*.28*handWeight+(v-ankle[k])*p.foot*.30*footWeight);
  }
  const bodyChange=Object.values(p).some(Boolean),shapeChange=bust;
  if(!bodyChange&&!shapeChange)return base;
  const seen=new Map(),parts=base.parts.map(mesh=>{
    if(!seen.has(mesh.vertices)){
      const main=mesh.vertices===currentBody.vertices;
      const arm={};
      if(main&&bodyChange)for(const s of ['right','left'])arm[s]=['shoulder','wrist','ankle'].map(k=>bankFor(base,mesh,s+'.'+k));
      let vertices=mesh.vertices.map((v,i)=>{
        let q=bodyChange?contour(v.p):[...v.p];
        if(main&&bodyChange){
          const side=v.p[0]<0?'left':'right',ws=arm[side].map(a=>a[i]/255);
          q=limb(v.p,side,...ws);
        }
        if(main&&shapeChange){
          const side=v.p[0]<0?-1:1,mask=(side<0?left:right)[i]/255;
          if(mask||v.p[1]>hp[1]+torso*.48&&v.p[1]<sh[1]+torso*.05){
            const x=Math.abs(v.p[0])/width,t=(v.p[1]-hp[1])/torso;
            const volume=c.volume+side*c.asym*.32;
            const cx=.50+.071*c.spacing,cy=.79-.028*c.drop;
            const upper=t>cy,dx=(x-cx)/(.39+.069*c.root+.036*volume);
            const dy=(t-cy)/(upper?.167+.035*c.upper:.115+.024*c.drop);
            const r2=dx*dx+dy*dy;
            const broad=1-ramp(0,1.8,r2),front=ramp(.16,.46,v.p[2]/width);
            const dome=broad*front*(.88+.12*mask);
            const top=ramp(cy-.08,cy+.09,t);
            q[0]+=dome*((v.p[0]-side*cx*width)*(.24*c.root+.12*volume)+side*width*.08*c.spacing);
            q[1]+=torso*dome*(-.010-.033*c.drop-.019*volume+motion*.052);
            q[2]+=width*dome*(.089+.235*volume+.072*c.upper*(2*top-1)+.058*c.drop*(1-top)+.045*motion);
            // The lower fold tapers into the rib cage across a band, avoiding a sharp point.
            q[2]-=width*(.035+.048*Math.max(0,volume))*bell(x,.62,.16)*bell(t,.777,.046)*front;
            q[2]-=.023*width*bell(x,cx,.35)*bell(t,cy-.106,.043)*front;
          }
        }
        return {...v,p:q};
      });
      if(main){const faces=base.parts.filter(m=>m.vertices===mesh.vertices).flatMap(m=>m.faces);const smoothNormals=normals(vertices,faces);
        vertices=vertices.map((v,i)=>v.p[1]>chin-.04&&!p.head?{...v,n:mesh.vertices[i].n}:smoothNormals[i]);}
      seen.set(mesh.vertices,vertices);
    }
    return {...mesh,vertices:seen.get(mesh.vertices)};
  });
  const updated={};
  for(const side of ['left','right']){
    updated[side]={};for(const [k,pos] of Object.entries(base.joints[side])){
      const arm=['shoulder','elbow','wrist','handTip'].includes(k);
      updated[side][k]=arm?limb(pos,side,1,k==='handTip'?1:0,0):contour(pos);
    }
  }
  return {...base,parts,joints:updated,rigPivots:base.rigPivots&&Object.fromEntries(Object.entries(base.rigPivots).map(([k,p])=>[k,contour(p)]))};
}

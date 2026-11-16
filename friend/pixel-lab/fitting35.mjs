import {faceRecipe} from './face-study35.mjs';
import {shapeFromFront} from './front35.mjs';
import {form34,types} from './bust34.mjs';
import {clamp,ramp,bell} from './region33.mjs';
import {orientedSkin} from './skin-normals35.mjs';

const bounded=(v,a,b)=>Math.min(b,Math.max(a,v));
function shapeOfFace(record){
  const [left,right,mouth,chin]=record.marks;
  const avg=(a,k)=>a.reduce((n,p)=>n+p[k],0)/a.length;
  const eyes=[left,right].filter(Boolean);
  const gap=left&&right?Math.hypot(right[0]-left[0],right[1]-left[1]):22;
  const lids=record.lines.filter(l=>l.part.endsWith('눈꺼풀'));
  const height=lids.length>=2?Math.abs(avg(lids[1].points,1)-avg(lids[0].points,1)):3;
  const eyeWidth=record.widths.slice(0,2).filter(n=>n>0).reduce((a,b)=>a+b,0)/eyes.length;
  return {
    eye:bounded(eyeWidth/gap,.18,.56),open:bounded(height/Math.max(eyeWidth,1),.11,.75),
    mouth:mouth?bounded(record.widths[2]/gap,.08,.70):.25,
    lower:mouth&&chin?bounded((chin[1]-mouth[1])/gap,.25,.79):.50,
    length:chin?bounded((chin[1]-avg(eyes,1))/gap,.85,1.80):1.28
  };
}
// Apply the same smooth warp to skin, eyelids and eye pigment. Reusing vertex
// arrays keeps the fronts of the lips and eyelids attached while orbiting.
export function fittedFace(settings,record){
  const scene=form34(settings),f=shapeOfFace(record),chin=scene.landmarks.chin[1];
  const recipe=faceRecipe(record,settings);
  const female=settings.sex==='female',newVertices=new Map(),cx=female?.166:.163;
  function move(p){
    let [x,y,z]=p;const h=y-chin,a=Math.abs(x);
    if(h<-.08||h>1.08||z<.16)return p;
    const side=x<0?-1:1,front=ramp(.18,.42,z),height=ramp(-.08,.06,h)*(1-ramp(.62,.89,h)),core=front*height;
    const eye=bell(a,cx,.155)*bell(h,.468,.107)*front;
    const mouth=bell(x,0,.143)*bell(h,.17,.065)*front;
    const jaw=bell(h,.115,.16)*ramp(.07,.32,a)*front;
    const contour=bell(h,.30,.15)*ramp(.13,.31,a)*front;
    // Mature stylized cheek plane; the jaw narrows toward a medial chin.
    x-=side*(.047+(1.25-f.length)*.024)*jaw;
    x+=side*.014*contour;
    y+=((f.length-1.24)*.042)*bell(h,.42,.22)*front;
    x+=side*(a-cx)*(f.eye/.292-1)*.89*eye;
    y+=(h-.467)*(f.open/.37-1)*.72*eye;
    z+=.013*eye-.022*bell(a,.14,.104)*bell(h,.55,.085)*core;
    x+=x*(f.mouth/.26-1)*.65*mouth;
    y+=(f.lower-.49)*.085*mouth;
    z+=.012*bell(h,.17,.06)*bell(x,0,.11)*front+.009*contour;
    // Unify the lip–chin break instead of leaving two equally dark grooves.
    z-=.015*bell(h,.105,.043)*bell(x,0,.11)*front;
    y+=.020*jaw;
    const [refX,refY]=recipe.warp(p[0],h);
    const surface=front*ramp(-.070,.02,h)*(1-ramp(.62,.79,h));
    x=p[0]+.18*(x-p[0])+.77*surface*refX;
    y=p[1]+.18*(y-p[1])+.77*surface*refY;
    z+=surface*(recipe.noseDepth*bell(x,0,.081)*bell(h,.32,.11)+recipe.profileLips*bell(x,0,.14)*bell(h,.17,.07));
    if(record.profileFit&&h>-.03&&h<.65){
      const u=clamp((.57-h)/.57,0,1);
      const correction=sample(record.profileFit,u);
      z+=correction*.66*bell(x,0,.225)*front*ramp(-.03,.015,h)*(1-ramp(.565,.65,h));
    }
    return [x,y,z];
  }
  const parts=scene.parts.map(m=>{
    if(!newVertices.has(m.vertices)){
      const vs=m.vertices.map(v=>{const p=move(v.p);if(p===v.p)return v;
        // Transport the normal by inverse transpose of the local deformation.
        const d=.001,columns=[0,1,2].map(k=>{const q=v.p.slice();q[k]+=d;const t=move(q);return t.map((a,j)=>(a-p[j])/d);});
        const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
        const cof=[cross(columns[1],columns[2]),cross(columns[2],columns[0]),cross(columns[0],columns[1])];
        const n=[0,1,2].map(k=>cof.reduce((v2,c,i)=>v2+c[k]*v.n[i],0)),magnitude=Math.hypot(...n)||1;
        return {...v,p,n:n.map(a=>a/magnitude)};});newVertices.set(m.vertices,vs);
    }
    return {...m,vertices:newVertices.get(m.vertices)};
  });
  return {...scene,parts,fit35:{face:f}};
}
function sample(curve,x){
  const at=bounded(x,0,1)*(curve.length-1),i=Math.floor(at);return curve[i]+(curve[Math.min(curve.length-1,i+1)]-curve[i])*(at-i);
}
export function photoSection(record){
  const path=record.lines[0].points,[first,apex,lowest,fold]=record.marks;
  const dir=Math.sign(apex[0]-first[0])||1,rise=Math.max(1,lowest[1]-first[1]);
  const view=record.views[record.active],aspect=view.width/view.height;
  const last=path.findIndex(p=>p[0]===lowest[0]&&p[1]===lowest[1]);
  const visible=path.slice(0,last<0?path.length:last+1);
  const curve=Array.from({length:33},(_,i)=>{
    const t=i/32,y=first[1]+t*rise,wall=first[0]+(fold[0]-first[0])*t;
    let best=-Infinity;
    for(let j=1;j<visible.length;j++){
      const a=visible[j-1],b=visible[j],dy=b[1]-a[1];
      if(Math.abs(dy)<1e-6||(y-a[1])*(y-b[1])>1e-6)continue;
      best=Math.max(best,dir*(a[0]+(b[0]-a[0])*((y-a[1])/dy)-wall)*aspect/rise);
    }
    return bounded(Number.isFinite(best)?best:0,0,1.7);
  });
  return {curve,apex:bounded((apex[1]-first[1])/rise,.2,.94),under:bounded((lowest[1]-fold[1])/rise,0,.5)};
}
export function fittedChest(settings,record,adjust={}){
  const ref=photoSection(record),max=Math.max(...ref.curve);
  const type=ref.under>.21?'low':ref.apex>.77?'drop':max<.33?'shallow':ref.apex<.52?'upper':'balanced';
  const base=form34(settings,type,adjust),skin=base.parts[0],tissue=base.tissue34;
  if(!tissue)return base;
  const preset=types.find(row=>row[0]===type)[2],hip=base.joints.right.hip[1],{length,width,responses}=tissue;
  const top=hip+length*(preset[4]+preset[1]*.86),bottom=hip+length*(preset[4]-preset[2]-preset[7]*.50);
  const height=top-bottom,binCount=25,center=preset[5]*width;
  const profile=vs=>{
    const data=[];for(let j=0;j<binCount;j++){
      const y=top-height*j/(binCount-1);let best=-Infinity;
      for(let i=0;i<vs.length;i++){const p=vs[i].p;
        if(p[0]<center-.21*width||p[0]>center+.21*width||Math.abs(y-p[1])>.027*length)continue;
        best=Math.max(best,p[2]);}
      data.push(best);
    }
    if(data.some(n=>!Number.isFinite(n)))throw Error('가슴 단면의 흉벽 범위에 표본이 없습니다.');
    return data;
  };
  const initial=profile(skin.vertices),wall=initial[0],foot=initial.at(-1);
  const curve=initial.map((v,j)=>{const t=j/(binCount-1),behind=wall*(1-t)+foot*t;
    return behind+height*sample(ref.curve,t)*(.84+.23*(adjust.volume||0));});
  let vs=skin.vertices,errors=[];
  const score=data=>Math.sqrt(curve.reduce((s,k,i)=>s+(data[i]-k)**2,0)/curve.length)/height;
  for(let iteration=0;iteration<4;iteration++){
    const measured=iteration?profile(vs):initial,delta=curve.map((v,i)=>bounded(v-measured[i],-.10*width,.15*width));
    errors.push(score(measured));
    if(iteration===3)break;
    vs=vs.map((v,i)=>{const r=responses[i];if(!r)return v;
      const [x,y,z]=v.p,t=(top-y)/height;
      if(t<-.05||t>1.04)return v;
      const cw=bell(Math.abs(x),center,.235*width)*Math.min(1,r.free*1.7+.24*r.outer)*ramp(-.05,.13,t)*(1-ramp(.87,1.04,t));
      if(cw<.003)return v;
      return {...v,p:[x,y,z+.74*sample(delta,t)*cw]};
    });
  }
  const frontal=shapeFromFront(vs,base,record,preset);
  vs=frontal.vertices;
  const allFaces=base.parts.filter(m=>m.vertices===skin.vertices).flatMap(m=>m.faces),smooth=orientedSkin(skin.vertices,vs,allFaces);
  const shaped=vs.map((v,i)=>v===skin.vertices[i]?v:smooth[i]);
  return {...base,parts:base.parts.map(m=>m.vertices===skin.vertices?{...m,vertices:shaped}:m),
    tissue34:{...tissue,responses:frontal.poseResponses},restSkin35:skin.vertices,surfaceAnchors:frontal.anchors,fit35:{type,front:frontal.front,section:ref,before:errors[0],after:errors.at(-1),errors}};
}

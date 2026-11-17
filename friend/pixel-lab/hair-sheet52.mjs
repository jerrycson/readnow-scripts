import {HAIR_DESIGNS,addDesignedHair} from './hair-design.mjs';

const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
const unit=v=>{const len=Math.hypot(...v)||1;return v.map(x=>x/len);};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const supported=new Set(['crop','part','bob','long','wave','fringe','mullet']);
// 정수리부터 끝까지 연속된 덩어리. 모델 단위는 머리 하나의 높이다.
export function buildHair52(parts,settings,proportions,chin,width,depth,phase,moving){
  const style=HAIR_DESIGNS.find(o=>o.id===settings.hair);
  if(!style||!supported.has(style.family))return addDesignedHair(parts,settings,proportions,chin,width,depth,phase,moving);
  const {family,length,variant,part}=style;
  const short=family==='crop',fringe=family==='fringe',wave=family==='wave';
  const divisions=120,rows=29,tau=2*Math.PI,partAngle=part*.48;
  const lockCount=short?17:12+variant;
  function point(theta,t){
    const a=wrap(theta),front=Math.cos(a),back=(1-front)/2;
    const fromPart=Math.abs(wrap(a-partAngle));
    const direction=Math.sign(wrap(a-partAngle));
    const reflected=fromPart/Math.PI;
    const sidefall=smooth(.53,1.28,fromPart);
    const hairline=.77-.54*smooth(.32,2.48,Math.abs(a));
    const fringeDrop=(fringe?.27:family==='part'?.14:.08)*Math.sin(smooth(0,1.30,fromPart)*Math.PI);
    const rootY=hairline-fringeDrop+.038*Math.exp(-20*fromPart*fromPart);
    const endAngle=Math.acos(Math.max(-.99,Math.min(.99,(rootY-.505)/.545)));
    const turn=smooth(.1,.8,t)*(1-smooth(1.75,Math.PI,fromPart))*.14;
    const thetaFlow=a+direction*smooth(0,.46,fromPart)*turn;
    const phi=Math.min(t/.66,1)*endAngle;
    const drape=smooth(0,1,Math.max(0,(t-.66)/.34));
    const tuft=(1+Math.cos(lockCount*thetaFlow+variant*.46+2*t))/2;
    const rib=(tuft-.5)*(wave?.059:.043)*smooth(.08,.42,t);
    const thickness=1.09+rib;
    const radius=Math.sin(Math.min(phi,Math.PI/2))*(1-.10*smooth(Math.PI/2,2.5,phi));
    const side=Math.sin(thetaFlow),forward=Math.cos(thetaFlow);
    let rx=width*thickness*radius,rz=depth*thickness*radius;
    const near=Math.max(0,(t-.66)/.34);
    const extra=short?.04+sidefall*(.035+.18*length):(.035+sidefall*Math.min(length,proportions.n-1.20));
    const taper=1+sidefall*(-.09*drape+.035*Math.sin(drape*Math.PI));
    rx*=taper;rz*=taper;
    const texture=wave?.035*Math.sin(near*Math.PI*2.2+thetaFlow*3)*sidefall:0;
    let x=side*(rx+texture)+part*.04*(1-smooth(0,.9,t));
    let y=chin+.505+.545*Math.cos(phi)-extra*drape;
    let z=forward*(rz+texture)-.025;
    if(!short){
      const shoulder=smooth(.55,1.25,extra*drape);
      z-=shoulder*(.12+.2*back);
      x+=side*.065*shoulder;
      y+=drape*drape*Math.min(extra*.48,.10)*(.7*tuft+.3*Math.sin(a*2+variant));
      x+=direction*.036*near*(1-reflected)*smooth(0,.44,fromPart);
    }
    if(t<.005){x=part*.04;z=-.025;}
    return [x,y,z];
  }
  const mesh={name:'머리카락-52-연속면',mat:'hair',vertices:[],faces:[]};
  for(let j=0;j<=rows;j++){
    const t=j/rows;
    for(let i=0;i<divisions;i++){
      const a=tau*i/divisions,p=point(a,t),p1=point(a+.002,t),p2=point(a,Math.min(1,t+.002));
      if(t===1){const old=point(a,t-.002);for(let k=0;k<3;k++)p2[k]=p[k]+p[k]-old[k];}
      const u=p1.map((v,k)=>v-p[k]),v=p2.map((h,k)=>h-p[k]);
      const n=t===0?[0,1,0]:unit([v[1]*u[2]-v[2]*u[1],v[2]*u[0]-v[0]*u[2],v[0]*u[1]-v[1]*u[0]]);
      mesh.vertices.push({p,n});
      if(j){const b=j*divisions+i,c=j*divisions+(i+1)%divisions;mesh.faces.push([b-divisions,b,c],[b-divisions,c,c-divisions]);}
    }
  }
  parts.push(mesh);
  if(short)return true;
  // 정수리에서 옆머리로 넘어가는 다발을 가르마 양편에 배치한다.
  for(const side of [-1,1]){
    for(let lock=0;lock<4;lock++){
      const sheet={name:'머리카락-52-옆가닥',mat:'hair',vertices:[],faces:[]};
      const start=.08+.095*lock;
      const sweep=(fringe?.53:.78)+.40*lock;
      const end=(family==='part'?.68:.91)-.065*lock;
      function strand(t,u){
        const spread=(.17+.05*(1-lock/4))*Math.pow(Math.max(.0005,Math.sin(t*Math.PI)),.45);
        const a=partAngle+side*(start+sweep*smooth(0,1,t)+u*spread);
        const h=.105+end*t;
        const p=point(a,h),edgeDrop=(1-u*u)*.019+.010;
        const loft=edgeDrop*smooth(0,.17,t)*(1-.27*t)+.012;
        p[0]+=Math.sin(a)*loft;p[2]+=Math.cos(a)*loft;
        p[1]+=loft*Math.max(0,1-2*h);
        const tipExtension=smooth(.63,1,t)*(.07+.075*(3-lock))*(fringe?1.4:1);
        p[1]-=tipExtension;
        return p;
      }
      const across=6,along=32;
      for(let j=0;j<=along;j++)for(let i=0;i<=across;i++){
        const t=j/along,u=2*i/across-1,p=strand(t,u);
        const top=strand(Math.min(1,t+.001),u),bottom=strand(Math.max(0,t-.001),u);
        const right=strand(t,Math.min(1,u+.001)),left=strand(t,Math.max(-1,u-.001));
        const dv=top.map((v,k)=>v-bottom[k]),du=right.map((v,k)=>v-left[k]);
        const normal=unit([dv[1]*du[2]-dv[2]*du[1],dv[2]*du[0]-dv[0]*du[2],dv[0]*du[1]-dv[1]*du[0]].map(v=>v*side));
        sheet.vertices.push({p,n:normal});
        if(j&&i){const idx=j*(across+1)+i;sheet.faces.push([idx-across-2,idx-1,idx],[idx-across-2,idx,idx-across-1]);}
      }
      parts.push(sheet);
    }
  }
  return true;
}

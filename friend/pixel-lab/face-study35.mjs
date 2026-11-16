const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mid=ps=>[0,1].map(k=>ps.reduce((s,p)=>s+p[k],0)/ps.length);
export function faceRecipe(record,settings){
  const view=record.views[0],sx=view.width*(view.box[2]-view.box[0]),sy=view.height*(view.box[3]-view.box[1]);
  const xy=p=>[p[0]*sx/100,p[1]*sy/100];let [left,right]=record.marks.slice(0,2).map(p=>p&&xy(p));
  const eyeAt=record.marks[0]||record.marks[1];if(!left)left=[right[0]-.22*sx,right[1]];if(!right)right=[left[0]+.22*sx,left[1]];
  const origin=mid([left,right]),dx=right[0]-left[0],dy=right[1]-left[1],gap=Math.max(1,Math.hypot(dx,dy)),ux=dx/gap,uy=dy/gap;
  const fromPhoto=p=>{const [xx,yy]=xy(p),x=xx-origin[0],y=yy-origin[1];
    return [.33*(x*ux+y*uy)/gap,.467+.33*(x*uy-y*ux)/gap];};
  const controls=[],add=(x,y,d,s=.13)=>{controls.push({x,y,dx:clamp(d[0]-x,-.12,.12),dy:clamp(d[1]-y,-.14,.14),s});};
  const line=name=>record.lines.filter(v=>v.part===name);
  const sorted=ps=>ps.slice().sort((a,b)=>a[0]-b[0]);
  const at=(ps,t)=>ps[Math.round((ps.length-1)*t)];
  const female=settings.sex==='female',rx=(female?.132:.123)*(1+(7-settings.heads)*.014),cx=female?.166:.163;
  let observedEye=0;
  for(const [j,side] of [[0,-1],[1,1]]){
    if(!record.marks[j])continue;
    const upper=sorted(line('윗눈꺼풀')[observedEye].points).map(fromPhoto),lower=sorted(line('아랫눈꺼풀')[observedEye].points).map(fromPhoto);
    const o=side*cx;add(o-rx,.465-side*.017,at(upper,0),.09);add(o+rx,.465+side*.017,at(upper,1),.09);
    add(o,.465+(female?.058:.047),at(upper,.5),.070);add(o,.465-(female?.039:.028),at(lower,.5),.070);observedEye++;
    const brow=line(j?'오른눈썹':'왼눈썹')[0];if(brow){const ps=sorted(brow.points).map(fromPhoto);for(const t of [.1,.5,.9])add(o+(2*t-1)*rx*.89,.465+(female?.117:.106),at(ps,t),.083);}
  }
  const mouth=line('입선')[0];if(mouth){const ps=sorted(mouth.points).map(fromPhoto);for(const t of [0,.5,1])add((2*t-1)*(female?.117:.122),.17+.015*(2*t-1)**2,at(ps,t),.105);}
  const nose=line('코')[0];if(nose){const ps=nose.points.map(fromPhoto);add(0,.30,at(ps,.7),.09);}
  if(record.marks[3])add(0,.008,fromPhoto(record.marks[3]),.15);
  const jaw=line('뺨·하악선')[0];if(jaw){const ps=sorted(jaw.points).map(fromPhoto);for(const t of [.18,.82])add((t<.5?-1:1)*.229,.156,at(ps,t),.135);}
  const side=record.extra,profile=side?.lines[0];
  let noseDepth=0,profileLips=0;
  if(profile?.part==='옆얼굴'&&profile.points.length>8){
    const v=record.views[side.index],ar=v.width*(v.box[2]-v.box[0])/(v.height*(v.box[3]-v.box[1]));
    const ps=profile.points,dir=side.yaw===270?-1:1,first=ps[0],span=Math.max(8,Math.max(...ps.map(p=>p[1]))-first[1]);
    const depth=(lo,hi)=>{const use=ps.filter(p=>(p[1]-first[1])/span>lo&&(p[1]-first[1])/span<hi);
      return use.length?Math.max(...use.map(p=>dir*(p[0]-first[0])*ar/span)):0;};
    noseDepth=clamp((depth(.15,.57)-.12)*.48,-.068,.073);profileLips=clamp((depth(.53,.79)-.05)*.33,-.050,.048);
  }
  function warp(x,y){
    let total=.020,dx=0,dy=0;
    for(const c of controls){
      const r=((x-c.x)**2+(y-c.y)**2)/c.s**2,w=Math.exp(-r*.72)/(.45+r);
      total+=w;dx+=c.dx*w;dy+=c.dy*w;
    }
    return [dx/total,dy/total];
  }
  return {warp,noseDepth,profileLips};
}

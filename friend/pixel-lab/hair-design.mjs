import {ellipsoid as E,taper,norm} from './geometry.mjs';
// Silhouette recipes. All styles can be worn by either base; collections are browsing aids.
const male=[
 ['버즈','crop',.06,0,0],['긴 버즈','crop',.12,0,1],['낮은 페이드','crop',.09,-1,2],['높은 페이드','crop',.15,1,3],['크루컷','crop',.22,0,4],
 ['왼쪽 가르마','part',.22,-1,0],['오른쪽 가르마','part',.28,1,1],['가운데 가르마','part',.35,0,2],['깊은 옆가르마','part',.4,-1,3],['커튼형','part',.5,0,4],
 ['짧은 퀴프','quiff',.22,-1,0],['높은 퀴프','quiff',.36,0,1],['옆으로 넘긴 퀴프','quiff',.3,1,2],['퐁파두르','quiff',.44,-1,3],['물결 퀴프','quiff',.38,1,4],
 ['짧은 스파이크','spike',.20,0,0],['긴 스파이크','spike',.42,0,1],['비대칭 스파이크','spike',.34,-1,2],['모호크','spike',.5,0,3],['쌍갈래 볏','spike',.38,1,4],
 ['짧은 컬','curl',.16,0,0],['느슨한 컬','curl',.28,-1,1],['타이트 컬','curl',.32,0,2],['둥근 아프로','curl',.48,0,3],['옆으로 흐른 컬','curl',.38,1,4],
 ['턱선 스트레이트','long',.52,0,0],['어깨선 스트레이트','long',.85,0,1],['긴 레이어','long',1.2,-1,2],['긴 물결','wave',1.35,1,3],['매우 긴 직모','long',1.65,0,4],
 ['낮은 포니테일','tail',.7,0,0],['높은 포니테일','tail',.85,0,1],['옆 포니테일','tail',.8,1,2],['짧은 반묶음','tail',.45,-1,3],['긴 반묶음','tail',1.25,0,4],
 ['작은 상투','bun',.18,0,0],['높은 번','bun',.30,0,1],['낮은 번','bun',.24,-1,2],['느슨한 번','bun',.38,1,3],['쌍번','bun',.25,0,4],
 ['짧은 드레드','braid',.5,0,0],['긴 드레드','braid',1.1,0,1],['굵은 외땋기','braid',.9,-1,2],['쌍땋기','braid',1.1,0,3],['가느다란 여러 땋기','braid',1.45,1,4],
 ['짧은 멀릿','mullet',.55,0,0],['긴 멀릿','mullet',.95,0,1],['울프컷','mullet',.75,-1,2],['곱슬 멀릿','mullet',1.1,1,3],['언더컷 긴 뒤머리','mullet',1.35,0,4]
];
const female=[
 ['짧은 픽시','crop',.16,-1,0],['긴 픽시','crop',.3,1,1],['옆선 픽시','part',.28,-1,2],['짧은 샤기','spike',.26,1,3],['둥근 숏컷','crop',.26,0,4],
 ['턱선 보브','bob',.53,0,0],['A라인 보브','bob',.65,-1,1],['비대칭 보브','bob',.72,1,2],['둥근 단발','bob',.58,0,3],['긴 단발','bob',.87,0,4],
 ['가운데 가르마 긴머리','long',1.3,0,0],['옆가르마 긴머리','long',1.4,-1,1],['앞머리 긴 직모','long',1.5,0,2],['층진 긴머리','long',1.65,1,3],['등까지 긴 직모','long',1.9,0,4],
 ['짧은 물결 단발','wave',.65,0,0],['어깨선 물결','wave',.92,-1,1],['긴 S컬','wave',1.35,0,2],['비대칭 물결','wave',1.2,1,3],['굵은 긴 웨이브','wave',1.75,0,4],
 ['짧은 타이트 컬','curl',.30,-1,0],['둥근 컬 보브','curl',.5,0,1],['긴 컬','curl',.8,1,2],['볼륨 아프로','curl',.6,0,3],['길게 내려온 코일','curl',1.1,0,4],
 ['높은 포니테일','tail',1.25,0,0],['낮은 포니테일','tail',1.4,-1,1],['옆 포니테일','tail',1.1,1,2],['쌍 포니테일','tail',1.3,0,3],['반묶음 긴머리','tail',1.65,0,4],
 ['높은 발레 번','bun',.27,0,0],['낮은 시뇽','bun',.32,-1,1],['쌍번','bun',.30,0,2],['느슨한 업두','bun',.43,1,3],['땋아 올린 번','bun',.36,0,4],
 ['외땋기','braid',1.4,0,0],['쌍땋기','braid',1.45,0,1],['옆땋기','braid',1.25,1,2],['여러 가닥 땋기','braid',1.65,0,3],['굵은 긴 땋기','braid',1.85,-1,4],
 ['앞머리와 어깨 길이','fringe',.85,0,0],['시스루 앞머리','fringe',1.2,0,1],['사선 앞머리','fringe',1.1,-1,2],['짧은 일자 앞머리','fringe',.75,0,3],['길게 갈라진 앞머리','fringe',1.4,1,4],
 ['올린 롤','roll',.3,-1,0],['쌍 롤','roll',.34,0,1],['왕관 땋기','roll',.40,0,2],['깃털 레이어','mullet',1.0,1,3],['높은 볼륨 업두','roll',.55,0,4]
];
export const HAIR_DESIGNS=Object.freeze([['m',male],['f',female]].flatMap(([collection,rows])=>rows.map(([name,family,length,part,variant],i)=>Object.freeze({id:collection+String(i+1).padStart(2,'0'),collection,name,family,length,part,variant}))));
export function addDesignedHair(parts,s,p,chin,width,depth,phase,moving){
 const h=HAIR_DESIGNS.find(h=>h.id===s.hair);if(!h)return false;
 const top=chin+.83,cap=.20+(h.family==='crop'?h.length*.18:.04),spread=1.04+h.variant*.008,sw=h.part*.04;
 const shell={name:'hair-scalp',mat:'hair',vertices:[],faces:[]},segments=24,rows=6;
 for(let j=0;j<=rows;j++)for(let i=0;i<=segments;i++){
  const a=i/segments*Math.PI*2,front=Math.sin(a),fade=h.family==='crop'&&h.variant>=2;
  const bottom=front>0?.54+.21*front:(fade?.58:.48)+front*(fade?.02:.16),max=Math.acos((bottom-.55)/.51),v=j/rows*max;
  const q=[Math.sin(v)*Math.cos(a),Math.cos(v),Math.sin(v)*Math.sin(a)],r=[width*1.055,.51+h.length*.015,depth*1.06];
  shell.vertices.push({p:[q[0]*r[0],chin+.55+q[1]*r[1],q[2]*r[2]-.02],n:norm(q.map((x,k)=>x/r[k]))});
 }
 for(let j=0;j<rows;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;shell.faces.push([a,b,a+1],[a+1,b,b+1]);}parts.push(shell);
 E(parts,[sw,top,-.035],[width*spread,cap,depth*1.045],'hair',null,'hair-cap');
 const bangCount=h.variant===1?7:h.variant===2?3:5;
 for(let i=0;i<bangCount;i++){
  const u=bangCount===1?0:i/(bangCount-1)*2-1,x=u*width*.84,parting=Math.abs(u-h.part*.45),endY=chin+(h.family==='crop'?.74:.57)+parting*.10+(h.variant===3?.07:0);
  if((h.family==='part'||h.family==='long')&&h.variant!==2&&Math.abs(u-h.part*.5)<.3)continue;
  taper(parts,[x*.78,top+.07,.17],[x+sw,endY,.31-Math.abs(u)*.05],[[0,width*.26,.09],[.58,width*.24,.08],[1,.018,.022]],'hair','fringe-lock');
 }
 if(h.family==='crop')return true;
 if(h.family==='spike'||h.family==='quiff'){
  const count=h.variant===3?5:7;
  for(let i=0;i<count;i++){const u=i/(count-1)*2-1,x=h.variant===3?0:u*width*.82,z=h.variant===3?(i/(count-1)-.5)*depth*1.6:-.04+Math.abs(u)*.06,height=h.length*(.8+.2*Math.cos(i*2)),shift=h.family==='quiff'?h.part*.22:u*.13;
   taper(parts,[x,top+.06,z],[x+shift,top+height,z+(h.family==='quiff'?.14:-.08)],[[0,.13,.12],[.45,.11,.10],[1,.012,.014]],'hair','crown-lock');
  }
 }
 const curtain=['bob','long','wave','fringe','mullet','part'].includes(h.family)||(h.family==='tail'&&h.variant===4);
 if(curtain){
  const len=Math.min(h.length,Math.max(.35,p.n-1.1)),count=h.family==='mullet'?5:9;
  for(let i=0;i<count;i++){
   const a=Math.PI*.04+i/(count-1)*Math.PI*.92,x=Math.cos(a)*width*.98,z=-Math.sin(a)*depth*.91;
   const asym=h.family==='bob'&&h.variant===2?(i/(count-1))*.2:0,layer=h.variant===3?(i%3)*.075:0;
   let prev=[x,chin+.67,z];const segments=h.family==='wave'?7:3;
   for(let j=1;j<=segments;j++){const u=j/segments,wave=h.family==='wave'?Math.sin(u*Math.PI*3+i*.5)*(.055+h.variant*.012):0,next=[x*(1+u*.08)+wave,chin+.67-(len+asym-layer)*u,z-wave*.3];
    taper(parts,prev,next,[[0,.105,.10],[1,j===segments?.06:.105,j===segments?.06:.10]],'hair','hair-curtain');prev=next;
   }
  }
 }
 if(h.family==='curl'){
  const radius=.075+h.variant*.010+h.length*.045,rows=h.length>.7?5:3;
  for(let row=0;row<rows;row++)for(let i=0;i<10;i++){
   const a=i/10*Math.PI*2,front=Math.sin(a)>0;if(front&&row>0)continue;
   const y=chin+.87-row*(h.length>.7?.16:.13),spread=1.05+h.length*.12+Math.sin((row+.5)/rows*Math.PI)*.14;
   E(parts,[Math.cos(a)*width*spread,y,Math.sin(a)*depth*spread-.03],[radius,radius*1.1,radius],'hair',null,'curl');
  }
 }
 if(h.family==='tail'||h.family==='braid'){
  const twin=(h.family==='tail'&&h.variant===3)||(h.family==='braid'&&((h.collection==='f'&&h.variant===1)||(h.collection==='m'&&h.variant===3))),many=h.family==='braid'&&((h.collection==='m'&&h.variant<2)||(h.collection==='f'&&h.variant===3)||h.variant===4),count=many?7:twin?2:1;
  for(let i=0;i<count;i++){
   const side=count===1?h.part:(i/(count-1)*2-1),x=side*width*(many?.85:.92),z=count===1?-.42:-.23,rootY=chin+(h.variant===1?.49:.78),len=Math.min(h.length,p.n-1.1),segments=h.family==='braid'?Math.max(3,Math.ceil(len*7)):4;
   E(parts,[x,rootY,z],[.075,.055,.075],'brass',null,'hair-tie');let prev=[x,rootY,z];
   for(let j=1;j<=segments;j++){const u=j/segments,sway=Math.sin(phase-.7)*(moving?.12:.015)*u,coil=h.family==='braid'?Math.sin(j*Math.PI*.8)*.035:0,next=[x+side*.1*u+sway+coil,rootY-len*u,z-.08*Math.sin(u*Math.PI)],r=(many?.055:.12)*(1-u*.6);taper(parts,prev,next,[[0,r*1.2,r],[.5,r,r*.95],[1,r*.9,r*.85]],'hair',h.family==='braid'?'braid-lock':'tail-lock');prev=next;}
  }
 }
 if(h.family==='bun'||h.family==='roll'){
  const twin=(h.collection==='m'&&h.variant===4)||(h.collection==='f'&&h.family==='bun'&&h.variant===2)||(h.family==='roll'&&h.variant===1),count=twin?2:1;
  for(let i=0;i<count;i++){const side=twin?(i?1:-1):h.part*.45,y=chin+(h.variant===2||h.variant===1?.64:1.03),x=side*width,z=y<chin+.8?-.41:-.09;
   E(parts,[x,y,z],[h.length*.65,h.length*.57,h.length*.65],'hair',h.family==='roll'?[1,0,0]:null,'hair-bun');
   if(h.variant>=3)for(let j=0;j<4;j++)E(parts,[x+Math.cos(j*1.5)*h.length*.42,y+Math.sin(j*1.5)*h.length*.35,z+.05],[.07,.085,.055],'hair',null,'bun-lock');
  }
 }
 return true;
}

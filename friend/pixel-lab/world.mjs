// Reproducible local behavior experiment. It knows only the objects authored in this scene.
export function randomSequence(seed){let n=Number(seed)>>>0;return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
const objects=[{kind:'books',label:'책꽂이',action:'reach'},{kind:'plant',label:'화분',action:'look'},{kind:'ball',label:'공',action:'run'},{kind:'bench',label:'긴 의자',action:'sit'},{kind:'lamp',label:'작은 등',action:'look'}];
export function createWorld(seed=42,memory={}){
 const random=randomSequence(seed),items=objects.map((o,i)=>({...o,id:o.kind,x:.14+i*.17+(random()-.5)*.08}));
 return {seed:Number(seed)>>>0,items,memory:{...memory},x:.08,direction:1,action:'idle',state:'choose',elapsed:0,target:null,energy:1,sequence:0,events:[],random,pending:null};
}
export function stepProps(world,dt){
 dt=Math.max(0,Math.min(.10,dt));const ball=world.items.find(o=>o.kind==='ball');
 if(!ball||(!ball.vx&&!ball.vy&&!ball.elevation))return;
 ball.x+=ball.vx*dt;ball.rotation=(ball.rotation||0)+ball.vx*dt*28;
 if(ball.x<.08||ball.x>.92){ball.x=Math.max(.08,Math.min(.92,ball.x));ball.vx*=-.55;}
 ball.vx*=Math.exp(-2.6*dt);if(Math.abs(ball.vx)<.001)ball.vx=0;
 ball.vy-=420*dt;ball.elevation+=ball.vy*dt;
 if(ball.elevation<0){ball.elevation=0;const rebound=-ball.vy*.38;ball.vy=rebound>18?rebound:0;}
}
export function approachObject(world,id){const target=world.items.find(o=>o.id===id);if(!target)throw new Error('없는 사물입니다.');world.target=target;world.state='approach';world.action='walk';world.elapsed=0;world.pending=null;}
export function stepWorld(world,dt,{speed=1,travelRate=.085,standOff=.025,practice=0,exploration=0,supported=['idle','walk','look','reach','sit','run','kick']}={}){
 dt=Math.max(0,Math.min(.10,dt));world.elapsed+=dt;let event=null;
 stepProps(world,dt);
 const setAction=a=>world.action=supported.includes(a)?a:'idle';
 if(world.state==='choose'){
  const choices=world.items.map(item=>({item,weight:1/(1+(world.memory[item.id]||0))+(item.kind==='bench'?(1-world.energy)*2:0)+(item.kind==='ball'?Math.min(practice,20)*.025:0)+(item.kind==='books'?Math.min(exploration,20)*.025:0)}));
  let pick=world.random()*choices.reduce((sum,c)=>sum+c.weight,0);world.target=choices.find(c=>(pick-=c.weight)<=0)?.item||choices.at(-1).item;
  world.state='approach';world.elapsed=0;setAction('walk');
 }else if(world.state==='approach'){
  const distance=world.target.x-world.x,step=dt*travelRate*speed;world.direction=distance<0?-1:1;
  if(Math.abs(distance)<=step+standOff){world.x=world.target.x-standOff*world.direction;world.state='observe';world.elapsed=0;setAction('look');}
  else world.x+=Math.sign(distance)*step;
  world.energy=Math.max(.1,world.energy-dt*.015);
 }else if(world.state==='observe'&&world.elapsed>1.2){
  world.state='interact';world.elapsed=0;setAction(world.target.kind==='ball'&&supported.includes('kick')?'kick':world.target.action);
  world.pending={target:world.target,delay:world.target.kind==='ball'?.35:0};
 }else if(world.state==='interact'&&world.elapsed>3.2){if(world.target.kind==='bench')world.energy=Math.min(1,world.energy+.35);world.state='choose';world.elapsed=0;setAction('idle');}
 if(world.pending&&world.elapsed>=world.pending.delay){
  const target=world.pending.target,familiar=world.memory[target.id]||0;world.memory[target.id]=familiar+1;
  if(target.kind==='ball'){target.vx=world.direction*.16;target.vy=115;target.elevation=0;}
  event={sequence:++world.sequence,object:target.id,label:target.label,action:world.action,first:familiar===0,description:(familiar?'익숙한 ':'처음 만난 ')+target.label+'에 다가가 '+({reach:'손을 뻗었다',look:'살펴보았다',run:'달리기를 시도했다',sit:'앉아 쉬었다',kick:'공을 찼다',idle:'잠시 머물렀다'}[world.action]||'반응했다')};
  world.events.push(event);world.pending=null;
 }
 world.x=Math.max(.04,Math.min(.96,world.x));return event;
}
export function drawWorld(canvas,world,groundHeight){
 const width=canvas.parentElement.clientWidth,height=canvas.parentElement.clientHeight,unit=3;
 canvas.width=Math.max(1,Math.floor(width/unit));canvas.height=Math.max(1,Math.floor(height/unit));canvas.style.width=canvas.width*unit+'px';canvas.style.height=canvas.height*unit+'px';
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const circle=(cx,cy,r,col)=>{c.fillStyle=col;for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r)c.fillRect(Math.round(cx+x),Math.round(cy+y),1,1);};
 for(const o of world.items){const x=Math.round(o.x*width/unit),floor=Math.round((height-groundHeight(o.x*width,width))/unit);
  rect(x-9,floor-1,18,2,'#6d856755');
  if(o.kind==='books'){rect(x-10,floor-29,20,29,'#73533b');for(const yy of [floor-27,floor-14]){rect(x-8,yy,16,10,'#372f2d');for(let i=0;i<4;i++)rect(x-7+i*4,yy+2,3,8,['#b98050','#60867b','#b8ad78','#76849b'][i]);}rect(x-11,floor-30,22,2,'#a17a50');}
  if(o.kind==='plant'){rect(x-6,floor-9,12,9,'#a96849');rect(x-7,floor-11,14,3,'#c58a5e');rect(x-1,floor-27,2,17,'#4e7952');circle(x-4,floor-22,5,'#668e5d');circle(x+4,floor-28,6,'#7ba66d');circle(x-3,floor-32,4,'#99b77c');}
  if(o.kind==='ball'){const y=floor-6-(o.elevation||0)/unit;circle(x,y,6,'#426c7c');circle(x-2,y-2,3,'#9ab8b1');rect(x-2+Math.sin(o.rotation||0)*2,y+3,4,2,'#294453');}
  if(o.kind==='bench'){rect(x-13,floor-14,26,4,'#98714d');rect(x-11,floor-10,3,10,'#654a36');rect(x+8,floor-10,3,10,'#654a36');rect(x-13,floor-24,26,3,'#ad8759');rect(x-11,floor-24,2,12,'#76553c');rect(x+9,floor-24,2,12,'#76553c');}
  if(o.kind==='lamp'){rect(x-6,floor-2,12,2,'#647575');rect(x-1,floor-27,2,26,'#79867e');rect(x-7,floor-28,14,4,'#b9a16c');rect(x-5,floor-34,10,6,'#d6be7f');rect(x-3,floor-28,6,2,'#f4e3aa');}
 }
}

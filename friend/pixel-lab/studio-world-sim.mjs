import {randomSequence,approachObject} from './world.mjs';
import {phaseFromDistance} from './motion.mjs';

export const WIDTH=384, HEIGHT=162, FLOOR=140, DT=.1;
export const kinds=Object.freeze({
  book:{name:'책',width:17,height:5},
  crate:{name:'상자',width:31,height:26},
  step:{name:'발판',width:47,height:12}
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const int=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const overlap=(x,w,y,v)=>Math.abs(x-y)<(w+v)/2-.01;
const half=item=>kinds[item.kind].width/2;
const top=item=>item.y+kinds[item.kind].height;
export const title=item=>kinds[item.kind].name+' '+item.id;
export function initialSetup(seed=42){
  const random=randomSequence(seed),offset=()=>Math.round((random()-.5)*10);
  return {v:1,seed,climb:16,curiosity:75,items:[
    {id:1,kind:'book',x:83+offset(),y:0},{id:2,kind:'step',x:174+offset(),y:0},
    {id:3,kind:'crate',x:214+offset(),y:0},{id:4,kind:'book',x:296+offset(),y:0}
  ]};
}
export function validSetup(s){
  return s?.v===1&&int(s.seed,0,4294967295)&&int(s.climb,0,40)&&int(s.curiosity,0,100)&&
    Array.isArray(s.items)&&s.items.length<=18&&new Set(s.items.map(o=>o?.id)).size===s.items.length&&
    s.items.every(o=>o&&Object.hasOwn(kinds,o.kind)&&int(o.id,1,9999)&&int(o.x,0,WIDTH)&&int(o.y,0,FLOOR));
}
// 바닥 높이 단위는 논리 화소. 같은 높이는 원래 배열 순서대로 내려놓는다.
export function settle(items){
  const ordered=items.slice().sort((a,b)=>a.y-b.y),landed=[];
  for(const o of ordered){
    o.x=clamp(Math.round(o.x),Math.ceil(half(o))+2,WIDTH-Math.ceil(half(o))-2);
    let floor=0;
    for(const below of landed)if(overlap(o.x,kinds[o.kind].width,below.x,kinds[below.kind].width))floor=Math.max(floor,top(below));
    o.y=floor;landed.push(o);
  }
  return items;
}
export function place(setup,id,kind,x,y){
  if(!Object.hasOwn(kinds,kind))return null;
  const items=setup.items.filter(o=>o.id!==id).map(o=>({...o}));
  const next={...setup,items:[...items,{id,kind,x:Math.round(x),y:Math.round(clamp(y,0,FLOOR))}]};
  if(!validSetup(next))return null;
  settle(next.items);
  return next.items.some(o=>top(o)>FLOOR-48)?null:next;
}
export function createScene(setup){
  if(!validSetup(setup))throw Error('배치 값의 범위를 확인하세요.');
  const items=settle(setup.items.map(o=>({...o})));
  if(items.some(o=>top(o)>FLOOR-48))throw Error('쌓은 물체가 조작 가능한 높이를 벗어납니다.');
  const world={settings:setup,items,x:32,y:0,fall:0,direction:1,phase:0,action:'idle',state:'choose',
    elapsed:0,random:randomSequence(setup.seed),target:null,held:null,blocked:null,visits:{},events:[],tick:0};
  world.y=support(world,world.x);
  return world;
}
function note(w,type,text){w.events.push({tick:w.tick,type,text});if(w.events.length>45)w.events.shift();}
function support(w,x){
  let floor=0;
  for(const o of w.items)if(o.id!==w.held&&overlap(x,5,o.x,kinds[o.kind].width))floor=Math.max(floor,top(o));
  return floor;
}
function lifted(w,id){
  const o=w.items.find(i=>i.id===id);
  return o&&w.items.some(item=>item.id!==id&&item.id!==w.held&&item.y>=top(o)-.01&&overlap(o.x,kinds[o.kind].width,item.x,kinds[item.kind].width));
}
export function command(w,op,id){
  const o=w.items.find(item=>item.id===id);
  if(op==='drop'&&w.held!==null){
    const held=w.items.find(item=>item.id===w.held);
    held.x=clamp(Math.round(w.x+15*w.direction),12,WIDTH-12);
    held.y=Math.round(w.y+18);w.held=null;settle(w.items);
    w.target=null;w.state='choose';w.action='idle';w.elapsed=0;
    note(w,'drop',title(held)+'을 내려놓았다.');return true;
  }
  if(!o||o.id===w.held||!['visit','pick'].includes(op))return false;
  if(op==='pick'&&(o.kind!=='book'||w.held!==null||lifted(w,id)))return false;
  approachObject(w,id);
  w.intent=op;w.blocked=null;note(w,'goal',title(o)+(op==='pick'?'을 집으러 간다.':' 쪽으로 향한다.'));return true;
}
function choose(w){
  const available=w.items.filter(o=>o.id!==w.held);
  if(!available.length){w.state='idle';w.action='idle';return;}
  const others=available.filter(o=>o.id!==w.blocked);
  const choices=others.length?others:available;
  const weights=choices.map(o=>1+(w.settings.curiosity/12)/(1+(w.visits[o.id]||0)));
  let draw=w.random()*weights.reduce((a,b)=>a+b,0);
  let selected=choices.at(-1);
  for(let i=0;i<choices.length;i++){draw-=weights[i];if(draw<0){selected=choices[i];break;}}
  approachObject(w,selected.id);w.intent='visit';w.blocked=null;
}
export function step(w){
  w.tick++;w.elapsed+=DT;
  if(w.state==='choose')choose(w);
  if(w.state==='approach'){
    const o=w.target,side=o.x>=w.x?1:-1;
    const atBook=o.kind==='book',gap=atBook?half(o)+3:0,distance=Math.abs(o.x-w.x);
    if(atBook&&distance<=gap+.3&&o.y-w.y>26){
      w.state='blocked';w.elapsed=0;w.action='look';w.blocked=o.id;
      note(w,'blocked',title(o)+'이 손이 닿는 높이보다 위에 있다.');
    }else if(distance<=gap+.3){
      w.state='observe';w.elapsed=0;w.action='look';
      w.visits[o.id]=(w.visits[o.id]||0)+1;
      note(w,'observe',(w.visits[o.id]===1?'처음 보는 ':'다시 만난 ')+title(o)+'을 살폈다.');
    }else{
      w.direction=side;
      const next=clamp(w.x+side*Math.min(2.8,distance-gap),3,WIDTH-3),floor=support(w,next);
      if(floor-w.y>w.settings.climb+.01){
        w.state='blocked';w.elapsed=0;w.action='look';w.blocked=o.id;
        note(w,'blocked','높이 '+Math.ceil(floor-w.y)+'px의 턱 앞에서 멈췄다.');
      }else{
        if(floor>w.y+.05){w.y=floor;w.fall=0;note(w,'climb','턱을 올라 발밑이 '+Math.round(floor)+'px 높아졌다.');}
        w.phase=phaseFromDistance(w.phase,next-w.x,18,.60);w.x=next;w.action='walk';
      }
    }
  }else if(w.state==='observe'&&w.elapsed>=.5){
    const o=w.target;
    if(w.intent==='pick'&&o.kind==='book'&&w.held===null&&!lifted(w,o.id)){
      w.held=o.id;w.action='reach';note(w,'pick',title(o)+'을 집어 들었다.');
    }else{w.action=o.kind==='book'?'reach':'look';}
    w.state='interact';w.elapsed=0;
  }else if((w.state==='interact'&&w.elapsed>=1)||(w.state==='blocked'&&w.elapsed>=1)){
    w.state='choose';w.action='idle';w.target=null;w.elapsed=0;
  }
  const floor=support(w,w.x);
  if(w.y>floor){
    w.fall+=90*DT;w.y=Math.max(floor,w.y-w.fall*DT);
    if(w.y===floor){note(w,'land','발이 다시 '+Math.round(floor)+'px 높이에 닿았다.');w.fall=0;}
  }else{w.y=floor;w.fall=0;}
  if(w.action!=='walk')w.phase+=DT*2;
}
export async function restore(setup,commands,tick,stillCurrent=()=>true){
  if(!Number.isSafeInteger(tick)||tick<0||!Array.isArray(commands))throw Error('재생 기록의 범위를 확인하세요.');
  let previous=-1;
  for(const c of commands){
    if(!Array.isArray(c)||c.length!==3||!int(c[0],0,tick)||c[0]<previous||
      !['visit','pick','drop'].includes(c[1])||!int(c[2],0,9999))throw Error('재생 명령을 읽을 수 없습니다.');
    previous=c[0];
  }
  const w=createScene(setup);
  let i=0;
  for(let t=0;t<=tick;t++){
    if(t>0&&t%2048===0){
      await new Promise(resolve=>setTimeout(resolve,0));
      if(!stillCurrent())throw Error('장면 복원을 중단했습니다.');
    }
    while(i<commands.length&&commands[i][0]===t){if(!command(w,commands[i][1],commands[i][2]))throw Error('실행할 수 없는 명령입니다.');i++;}
    if(t<tick)step(w);
  }
  return w;
}

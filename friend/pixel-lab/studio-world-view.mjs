import {DEFAULTS} from './model.mjs';
import {renderPixels} from './renderer.mjs';
import {WIDTH,HEIGHT,FLOOR,kinds} from './studio-world-sim.mjs';
const sprites=new Map();
const settings={...DEFAULTS,heads:6,resolution:64,species:'human',hair:'bob',top:'coat',
  bottom:'trousers',outfitColor:'moss',designStyle:'natural',accessory:'none',showNac:false};
const rec=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
function background(){
  const b=document.createElement('canvas');b.width=WIDTH;b.height=HEIGHT;
  const c=b.getContext('2d'),r=(...v)=>rec(c,...v);
  r(0,0,WIDTH,FLOOR,'#d6c9aa');r(0,0,WIDTH,5,'#b3aa91');
  for(let x=0;x<WIDTH;x+=32){r(x,6,1,104,'#c9bea3');r(x+1,6,1,104,'#dbcfb1');}
  // 창과 유리 너머의 마을은 화면 뒤쪽 고정 배경이다.
  r(16,15,129,80,'#a5987d');r(13,11,129,81,'#776f58');r(16,14,123,74,'#bdd4c7');
  for(const [x,y,w,h] of [[20,25,20,4],[45,21,15,3],[102,30,27,4],[80,18,16,3]])r(x,y,w,h,'#dfe8ce');
  for(let i=0;i<13;i++){const x=16+i*10,h=9+(i*13)%16;r(x,85-h,10,h,'#95af9e');r(x+2,82-h,6,2,'#879f91');}
  for(const [x,h] of [[26,22],[51,15],[102,17],[128,27]]){
    r(x,82-h,3,h,'#7f907f');r(x-5,77-h,14,10,'#869f85');r(x-3,72-h,10,7,'#a2b493');
  }
  r(17,85,122,3,'#a6b99b');r(74,13,4,75,'#807b63');r(16,45,123,3,'#8e8468');r(10,91,135,4,'#96815e');r(10,91,135,1,'#c3ae87');
  // 선반에 꽂힌 책과 조명은 만질 수 있는 전경 사물과 다른 밝기로 그린다.
  r(181,17,162,83,'#9a8b6c');r(178,14,162,83,'#82745b');r(182,18,154,75,'#b7aa89');
  const colors=['#8b9c8b','#a97e69','#cab98c','#9aa196','#b79c76','#81968c'];
  for(let row=0;row<2;row++){
    const baseline=51+row*35;
    for(let i=0;i<28;i++){
      const x=185+i*5+(i>=11?3:0),h=10+(i*11+row*7)%15;
      r(x,baseline-h,3,h,colors[(i+row)%colors.length]);if(i%3!==0)r(x,baseline-h+3,3,1,'#d2bfa0');
    }
    r(180,baseline+1,158,3,'#8f8063');r(180,baseline+1,158,1,'#b9a883');
  }
  r(237,17,3,77,'#8f8063');r(301,17,3,77,'#8f8063');
  r(0,104,WIDTH,28,'#a4ae98');for(let x=4;x<WIDTH;x+=18)r(x,107,1,23,'#95a28f');
  r(0,103,WIDTH,3,'#879781');r(0,131,WIDTH,5,'#8f7c60');r(0,136,WIDTH,26,'#c9ac80');
  for(let y=138;y<HEIGHT;y+=8){r(0,y,WIDTH,1,'#b49870');for(let x=(y%3)*25;x<WIDTH;x+=72)r(x,y+1,1,7,'#b59c76');}
  r(0,FLOOR,WIDTH,1,'#998766');
  return b;
}
function object(c,o,x,y){
  const w=kinds[o.kind].width,h=kinds[o.kind].height,l=Math.round(x-w/2),t=Math.round(y-h);
  const r=(...p)=>rec(c,...p);
  if(o.kind==='book'){
    r(l,t,w,h,'#894a38');r(l+1,t+1,w-3,1,'#c07553');r(l+2,t+2,w-3,2,'#e7d4a7');r(l+1,t,w-2,1,'#ae624a');
  }else if(o.kind==='crate'){
    r(l,t,w,h,'#795a3e');r(l+1,t+1,w-2,h-2,'#bd9364');r(l+2,t+2,w-4,4,'#d9b783');
    for(let i=8;i<h-1;i+=7){r(l+1,t+i,w-2,1,'#99764e');r(l+2,t+i+1,w-4,1,'#cfaa77');}
    r(l+3,t+2,3,h-4,'#a68459');r(l+w-6,t+2,3,h-4,'#a68459');
    r(l+12,t+10,7,3,'#80664a');
  }else{
    r(l,t,w,4,'#577063');r(l+1,t,w-2,2,'#94ae93');r(l+3,t+4,5,h-4,'#607765');
    r(l+w-8,t+4,5,h-4,'#607765');r(l+7,t+7,w-14,2,'#83977e');
  }
}
function sprite(w){
  const frame=Math.floor(w.phase/(2*Math.PI)*12)%12,key=[w.action,w.direction,frame].join('/');
  if(!sprites.has(key)){
    const im=renderPixels(settings,{action:w.action,yaw:w.direction*70,phase:frame*(2*Math.PI/12),freeOrbit:true});
    const s=document.createElement('canvas');s.width=im.width;s.height=im.height;
    const c=s.getContext('2d');c.putImageData(new ImageData(im.data,im.width,im.height),0,0);
    let bottom=0;
    for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++)if(im.data[4*(y*s.width+x)+3])bottom=y;
    sprites.set(key,{image:s,bottom});
  }
  return sprites.get(key);
}
export function makeView(canvas){
  const bg=background(),ctx=canvas.getContext('2d');
  return (w,selected,ghost)=>{
    ctx.imageSmoothingEnabled=false;ctx.drawImage(bg,0,0);
    for(const o of w.items){
      if(o.id===w.held)continue;
      const floor=FLOOR-o.y,shape=kinds[o.kind];
      if(o.y===0)rec(ctx,o.x-shape.width/2-1,floor,shape.width+3,2,'#a99372');
      object(ctx,o,o.x,floor);
      if(o.id===selected){
        const l=Math.floor(o.x-shape.width/2)-2,t=floor-shape.height-3;
        ctx.strokeStyle='#346f62';ctx.setLineDash([2,2]);ctx.lineWidth=1;
        ctx.strokeRect(l+.5,t+.5,shape.width+4,shape.height+4);ctx.setLineDash([]);
      }
    }
    const foot=FLOOR-w.y,s=sprite(w);
    rec(ctx,w.x-9,FLOOR,18,2,'#aa9270');ctx.drawImage(s.image,Math.round(w.x)-32,Math.round(foot)-s.bottom-1);
    if(w.held!==null){const o=w.items.find(o=>o.id===w.held);object(ctx,o,w.x+10*w.direction,foot-21);}
    if(w.state==='observe'||w.state==='blocked'||w.state==='interact'){
      const x=Math.round(w.x+5),y=Math.round(foot-62);
      rec(ctx,x,y,13,10,'#5e715f');rec(ctx,x+1,y+1,11,8,'#f8f1d3');rec(ctx,x+3,y+9,3,2,'#5e715f');
      if(w.state==='blocked'){rec(ctx,x+6,y+2,2,4,'#a56342');rec(ctx,x+6,y+7,2,1,'#a56342');}
      else{for(const i of [3,6,9])rec(ctx,x+i,y+4,1,2,'#527768');}
    }
    if(ghost){ctx.save();ctx.globalAlpha=.6;object(ctx,ghost,ghost.x,FLOOR-ghost.y);ctx.restore();}
  };
}

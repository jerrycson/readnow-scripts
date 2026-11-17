import {appendOrbit48} from './studio-orbit48.mjs';
import {projectPoint} from './renderer.mjs';
const ns='http://www.w3.org/2000/svg';
function element(tag,text){const e=document.createElement(tag);if(text)e.textContent=text;return e;}
function svg(tag,attrs){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;}
function button(title,action){const e=element('button',title);e.type='button';e.onclick=action;return e;}
function group(title){const box=element('fieldset');box.append(element('legend',title));return box;}
function toggle(title,yes,fn){const l=element('label'),i=element('input');i.type='checkbox';i.checked=yes;i.onchange=()=>fn(i.checked);l.append(i,document.createTextNode(' '+title));return l;}

const layers=[
  ['source','원화 표식','#075c58',''],
  ['before','47차','#69489c','4 2'],
  ['after','48차','#b23c15','1.2 1.4']
];
function projectMarkers(row,kind,key){
  const value=row[kind][key];return kind==='eyes'?(value||[]):[value];
}
function drawStudy(host,subject,rows,view,requested){
  const params=new URL(location.href).searchParams;
  const saved=params.get('sample')||requested;
  let row=rows.find(v=>v.key===saved)||rows.find(v=>v.key===(subject==='F02'?'설정4':'설정2'))||rows[0];
  let kind=['eyes','mouth'].includes(params.get('feature'))?params.get('feature'):subject==='F02'?'eyes':'mouth',detail=true;
  function record(){
    const address=new URL(location.href);address.searchParams.set('sample',row.key);address.searchParams.set('feature',kind);history.replaceState(null,'',address);
  }
  const visible={photo:true,source:true,before:true,after:true},choices=group('참고 그림'),parts=group('비교 부위');
  const drawing=svg('svg',{role:'img','aria-label':'원화와 47·48차 실화소에서 읽은 위치'}),info=element('p'),camera=element('p');
  const link=element('a','원화 출처'),controls=element('div'),layout=element('div'),warning=element('p');link.target='_blank';link.rel='noopener';
  layout.className='inspect48-layout';info.className=camera.className=warning.className='inspect48-note';
  const imageButton=toggle('원화',true,on=>{visible.photo=on;paint();});
  const masks=group('겹쳐 볼 내용');masks.append(imageButton);
  for(const [k,label] of layers)masks.append(toggle(label,true,on=>{visible[k]=on;paint();}));
  const partsButtons=['eyes','mouth'].map((id,i)=>button(['위눈꺼풀','입선'][i],()=>{kind=id;record();paint();}));parts.append(...partsButtons);
  const rowButtons=rows.map(r=>button(r.key,()=>{row=r;record();paint();}));choices.append(...rowButtons);
  const snap=button('모델을 이 촬영 방향으로',()=>{const c=row[kind].camera;view({yaw:c.yaw,pitch:c.pitch,zoom:1});});
  const full=toggle('표식 부근 확대',detail,on=>{detail=on;paint();});
  controls.append(choices,parts,masks,full,element('br'),snap,camera,info,warning,link);
  layout.append(drawing,controls);host.append(element('h2','눈·입을 원화에 겹쳐 보기'),layout);
  function paint(){
    const [x,y,w,h]=row.crop,[iw,ih]=row.size,marks=[];
    rowButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(rows[i]===row)));
    partsButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===(kind==='eyes'?0:1))));
    drawing.replaceChildren();warning.textContent='';
    if(visible.photo){
      const pic=svg('image',{x:-x*248/w,y:-y*248/h,width:iw*248/w,height:ih*248/h,href:row.source,preserveAspectRatio:'none'});
      pic.addEventListener('error',()=>{if(pic.isConnected)warning.textContent='공식 원화 응답을 받지 못했습니다. 아래 출처에서 원본을 확인할 수 있습니다.';});drawing.append(pic);
    }
    for(const [key,,color,dash] of layers){
      const layer=svg('g',{fill:'none',stroke:color,'data-feature-layer':key});
      for(const segment of projectMarkers(row,kind,key)){
        if(!segment)continue;
        const pts=segment.filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite));marks.push(...pts);
        if(!visible[key])continue;
        if(pts.length===segment.length&&pts.length>=2)layer.append(svg('polyline',{points:pts.map(p=>p.join(',')).join(' '),'stroke-width':1.05,'stroke-dasharray':dash}));
        for(const [cx,cy] of pts)layer.append(svg('circle',{cx,cy,r:key==='source'?1.6:key==='before'?1.05:.7,'stroke-width':.6,fill:key==='after'?color:'none'}));
      }
      if(visible[key])drawing.append(layer);
    }
    let window='0 0 248 248';
    if(detail&&marks.length){
      const xs=marks.map(p=>p[0]),ys=marks.map(p=>p[1]),loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys);
      const len=Math.min(248,Math.max(26,hiX-loX+16,hiY-loY+16));
      const start=(lo,hi)=>Math.max(0,Math.min(248-len,(lo+hi-len)/2));
      window=[start(loX,hiX),start(loY,hiY),len,len].join(' ');
    }
    drawing.setAttribute('viewBox',window);
    const c=row[kind].camera;camera.textContent='원화 정합 · 좌우 '+c.yaw.toFixed(1)+'° · 상하 '+c.pitch.toFixed(1)+'° · 기울기 '+c.roll.toFixed(1)+'°. 모델에는 좌우·상하 방향을 적용합니다.';
    info.textContent='고정된 두 후보의 48픽셀 표식입니다. '+(row.limits||'');link.href=row.sourcePage;
  }
  paint();
}
function markSurface(canvas){
  let box=canvas.parentElement;if(!box.classList.contains('surfaceFrame')){box=element('div');box.className='surfaceFrame';canvas.before(box);box.append(canvas);}
  const overlay=svg('svg',{'class':'tracking48','aria-hidden':'true'});box.append(overlay);
  const points=[8486,8503].map((id,i)=>{
    const mark=svg('g',{'data-vertex':id,stroke:i?'#673a94':'#006855',fill:'none','stroke-width':.46});
    mark.append(svg(i?'rect':'circle',i?{x:-1.2,y:-1.2,width:2.4,height:2.4}:{r:1.4}));overlay.append(mark);return mark;
  });
  return {overlay,points};
}

export function mountStudy48(host,evidence,orbits,view){
  const panels=['before','after'].map(id=>markSurface(document.getElementById(id)));
  let current,tracking=false,lastFrames;
  function updateMarkers(){
    for(const [i,{overlay,points}] of panels.entries()){
      const packet=lastFrames?.[i],show=tracking&&current==='W'&&packet?.frame.projection;
      overlay.style.display=show?'':'none';if(!show)continue;
      const {frame,display}=packet;overlay.setAttribute('viewBox','0 0 '+frame.width+' '+frame.height);
      points.forEach(g=>{
        const xy=projectPoint(frame,display.parts[0].vertices[Number(g.dataset.vertex)].p);
        g.setAttribute('transform','translate('+xy.join(' ')+')');
      });
    }
  }
  function show(subject,requested){
    current=subject;lastFrames=null;updateMarkers();host.hidden=false;host.replaceChildren();
    if(subject!=='W'){drawStudy(host,subject,evidence.cases[subject].views,view,requested);appendOrbit48(host,subject,orbits.subjects[subject],view);return;}
    host.append(element('h2','같은 팔 각도에서 밑면 비교'));
    const poses=group('양팔 올림'),cameras=group('카메라 방향');
    for(const n of [0,60,90,120,145,160,178])poses.append(button(n+'°',()=>view({pivot:'arms.raise',angle:n})));
    cameras.append(button('도판 B3 사선',()=>view({yaw:-26.15,pitch:0,zoom:1})),button('도판 S3 측면',()=>view({yaw:-90,pitch:0,zoom:1})));
    host.append(poses,cameras,toggle('밑면 추적점 표시',tracking,on=>{tracking=on;updateMarkers();}),
      element('p','원은 47차 90°에서 꺾임이 가장 컸던 8486번, 네모는 40차의 8503번 정점입니다. 각 점은 회전해 뒤로 가려져도 같은 피부 위치의 투영을 가리킵니다.'));
    appendOrbit48(host,subject,orbits.subjects[subject],view);
  }
  return {show,track(left,right){if(current==='W'){lastFrames=[left,right];updateMarkers();}}};
}

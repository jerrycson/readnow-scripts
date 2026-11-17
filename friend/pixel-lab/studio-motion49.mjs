import {surfaceProjection} from './studio-sculpt-model.mjs';
import {showFaceEvidence49} from './studio-reference49.mjs';
const el=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
const button=(text,fn)=>{const b=el('button',text);b.type='button';b.onclick=fn;return b;};
const bound=(x,lo,hi)=>Math.max(lo,Math.min(hi,Math.round(x)));
const labels={F02:'눈 뜬 정도 민감도 시험',M01:'입꼬리와 입 벌림',W:'같은 사람의 두 팔 자세'};
const positions={neutral:'중립',waist:'양손을 허리에',behindHead:'양손을 머리 뒤로'};
export function motionLabel(id,p){
  if(!p)return '중립';
  if(id==='W')return positions[p.pose];
  if(id==='F02')return '눈 뜬 정도 '+(p.lid>0?'+':'')+p.lid;
  return '입꼬리 '+p.corner+'% · 벌림 '+p.opening+'%';
}
export function mountMotion49(host,{state,preview,commit,view,reproduce,evidence}){
  const frame=document.getElementById('after').parentElement;
  const pin=button('',()=>{});pin.className='motion49-pin';pin.hidden=true;frame.append(pin);
  let id=null,syncRows=[],check,pad,dot,iframe,drag=null,mark=null,poseButtons=[];
  function gesture(delta){preview({...state(),...delta});}
  function apply(delta){gesture(delta);commit();}
  function row(name,label,min,max){
    const box=el('div'),title=el('label',label),num=el('input'),range=el('input');box.className='motion49-axis';
    num.type='number';range.type='range';num.id='motion49-'+name;title.htmlFor=num.id;
    for(const input of [num,range]){
      input.min=String(min);input.max=String(max);input.step='1';input.setAttribute('aria-label',label+(input===num?' 수치':' 조절'));
      input.oninput=()=>{if(input.value!==''&&input.validity.valid)gesture({[name]:Number(input.value)});};input.onchange=commit;
      input.onblur=()=>{commit();sync();};
    }
    box.append(title,num,range);syncRows.push({name,num,range});return box;
  }
  function bindDrag(control,fromLocation){
    control.onpointerdown=e=>{
      if(e.button!==0)return;e.preventDefault();control.focus();control.setPointerCapture(e.pointerId);
      drag={x:e.clientX,y:e.clientY,values:{...state()},width:Math.max(1,control===pin?frame.clientWidth:control.clientWidth),height:Math.max(1,control===pin?frame.clientHeight:control.clientHeight),fine:e.shiftKey?.25:1};
      if(fromLocation)move(e);
    };
    function move(e){
      if(!drag)return;
      if(fromLocation){
        const b=control.getBoundingClientRect();gesture({corner:bound(100*(e.clientX-b.left)/b.width,0,100),opening:bound(100*(b.bottom-e.clientY)/b.height,0,100)});return;
      }
      const dx=(e.clientX-drag.x)/drag.width*drag.fine,dy=(e.clientY-drag.y)/drag.height*drag.fine;
      if(id==='F02')gesture({lid:bound(drag.values.lid-dy*36,-8,8)});
      else gesture({corner:bound(drag.values.corner+dx*200,0,100),opening:bound(drag.values.opening+dy*200,0,100)});
    }
    control.onpointermove=move;
    control.onpointerup=control.onpointercancel=control.onlostpointercapture=()=>{if(drag){drag=null;commit();}};
    control.onkeydown=e=>{
      if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();
      const vertical=['ArrowUp','ArrowDown'].includes(e.key),value=state(),step=e.shiftKey?10:1,sign=['ArrowRight','ArrowUp'].includes(e.key)?1:-1;
      if(id==='F02'){if(vertical)apply({lid:bound(value.lid+sign,-8,8)});return;}
      const k=vertical?'opening':'corner';apply({[k]:bound(value[k]+sign*step,0,100)});
    };
  }
  bindDrag(pin,false);
  function sync(){
    if(!id||!state())return;const data=state();
    for(const {name,num,range} of syncRows){range.value=data[name];if(num!==document.activeElement||num.value==='')num.value=data[name];}
    check.checked=data.match;
    for(const [b,delta] of poseButtons)b.setAttribute('aria-pressed',String(Object.keys(delta).every(k=>data[k]===delta[k])));
    if(dot){dot.style.left=data.corner+'%';dot.style.bottom=data.opening+'%';pad.setAttribute('aria-label','입꼬리 '+data.corner+'%, 입 벌림 '+data.opening+'%');}
    if(iframe?.contentWindow&&data.pose!=='neutral'&&iframe.dataset.pose!==data.pose){iframe.dataset.pose=data.pose;iframe.contentWindow.postMessage({type:'bookfriend:study49-pose',pose:data.pose},location.origin);}
  }
  function show(subject){
    if(!state()){host.hidden=true;pin.hidden=true;id=null;return;}

    id=subject;syncRows=[];poseButtons=[];dot=null;pad=null;iframe=null;pin.hidden=true;
    host.hidden=false;host.replaceChildren(el('h2',labels[id]));
    const controls=el('div'),buttons=el('div'),description=el('p');controls.className='motion49-controls';buttons.className='motion49-buttons';
    const option=(name,delta)=>{const b=button(name,()=>apply(delta));buttons.append(b);poseButtons.push([b,delta]);};
    const matching=el('label');check=el('input');check.type='checkbox';matching.append(check,document.createTextNode(' 왼쪽 대조 모델에도 이 동작 적용'));check.onchange=()=>apply({match:check.checked});
    if(id==='M01'){
      for(const [n,c,o] of [['다문 중립',0,0],['입꼬리만 올림',100,0],['입만 벌림',0,100],['벌려 웃음',100,100]])option(n,{corner:c,opening:o});
      const padBox=el('div');pad=button('',()=>{});pad.className='motion49-pad';pad.id='mouthPad49';dot=el('i');pad.append(dot);bindDrag(pad,true);
      padBox.append(el('div','위로 벌림 · 오른쪽으로 입꼬리 올림'),pad);controls.append(padBox,row('corner','입꼬리 올림 (%)',0,100),row('opening','입 벌림 (%)',0,100));
      description.textContent='모델의 입 조작점은 오른쪽으로 끌면 입꼬리가 올라가고 아래로 끌면 입이 열립니다. Shift를 누르면 천천히 움직입니다.';
    }else if(id==='F02'){
      for(const n of [-6,-3,0,3,6])option(n===0?'중립':n>0?'+'+n:String(n),{lid:n});controls.append(row('lid','눈 뜬 정도 (격자 단계)',-8,8));
      description.textContent='눈 조작점을 위·아래로 끌어 눈꺼풀의 피복을 시험합니다. 양수에서 새로 드러나는 색은 기존 눈의 위쪽 행으로 추정합니다.';
    }else{
      for(const [key,title] of Object.entries(positions))option(title,{pose:key});
      description.textContent='팔꿈치와 손목, 어깨를 함께 움직여 원저의 촬영 자세를 근사합니다. 연구에 실제 관절각은 실려 있지 않습니다.';
    }
    const marker=el('label');mark=el('input');mark.type='checkbox';mark.checked=false;mark.onchange=()=>view({});marker.append(mark,document.createTextNode(' 모델 위에서 직접 조절'));
    host.append(buttons,controls,matching);if(id!=='W')host.append(marker);host.append(description);
    if(id!=='W'&&evidence)showFaceEvidence49(host,id,evidence.cases[id].views,reproduce);
    if(id==='W'){
      const details=el('details'),summary=el('summary','원저 그림 5와 모델의 선 겹쳐 보기');details.append(summary);
      details.addEventListener('toggle',()=>{if(!details.open||iframe)return;iframe=el('iframe');iframe.title='같은 성인의 허리·머리 뒤 손 자세와 원본 표식';iframe.src='chest-reference49.html';iframe.onload=()=>{iframe.dataset.pose='';sync();};details.append(iframe);});host.append(details);
    }
    sync();
  }
  window.addEventListener('message',e=>{
    if(!iframe||e.origin!==location.origin||e.source!==iframe.contentWindow||e.data?.type!=='bookfriend:study49-pose'||!['waist','behindHead'].includes(e.data.pose)||state()?.pose===e.data.pose)return;
    iframe.dataset.pose=e.data.pose;apply({pose:e.data.pose});
  });
  function locate(model,packet,camera){
    if(!mark?.checked||model.id==='W'||model.id!==id){pin.hidden=true;return;}
    const s=packet.display,project=surfaceProjection(packet.frame,model,s,camera);
    const parts=s.parts.filter(p=>p.name===(id==='F02'?'lid34':'mouth-line34'));
    const anchors=parts.map(p=>p.vertices[Math.floor(p.vertices.length/2)]).filter(Boolean);
    const v=anchors.sort((a,b)=>project.depth(b.p)-project.depth(a.p))[0];if(!v){pin.hidden=true;return;}
    const [x,y]=project.point(v.p),size=camera.size;pin.hidden=project.depth(v.n)<.05||x<0||y<0||x>=size||y>=size;
    pin.style.left=x/size*100+'%';pin.style.top=y/size*100+'%';
    pin.setAttribute('aria-label',id==='F02'?'가까운 눈꺼풀의 뜬 정도 조절':'입의 입꼬리·벌림 조절');
  }
  return {show,locate,refresh(subject){
    if(!state()){host.hidden=true;pin.hidden=true;return;}
    if(id!==subject||host.hidden)show(subject);else sync();
  }};
}

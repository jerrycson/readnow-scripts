import {recommend,baselineDirect} from './studio-sculpt-regression44.mjs';
import {renderPixels,projectPoint} from './renderer.mjs?v=41';
const norm=p=>Math.hypot(...p),round=v=>Math.round(v*10000)/10000;
const by=id=>document.getElementById(id);
const signature=(state,zone,photo)=>JSON.stringify([state.subject,state.base,state.values,state.view,zone,photo]);
function camera(ctx){
 if(ctx.frame.projection)return ctx.frame;
 const {view}=ctx.state;
 return renderPixels(ctx.model.settings,{sceneOverride:{...ctx.shown,parts:[]},portrait:'face',freeOrbit:true,
   yaw:view.yaw,pitch:view.pitch,cameraZoom:view.zoom*160/184,studyResolution:192});
}
const at192=(cam,p)=>projectPoint(cam,p).map(x=>x*192/cam.width);
export function mountSculptLearning44({redraw,apply}){
 const section=document.createElement('section');section.id='sculptLearning44';
 section.innerHTML='<h2>목표점 교정</h2><p id="learnInfo44"></p><div class="toolrow"><button id="target44">그림에 목표 찍기</button><label>가로 <input id="dx44" type="number" min="-64" max="64" step=".25" value="0"></label><label>세로 <input id="dy44" type="number" min="-64" max="64" step=".25" value="0"></label><span>192px 환산 · 아래가 ＋</span></div><div class="toolrow"><select id="method44" aria-label="교정 시안 방식"><option value="ridge-inverse44">학습 추천</option><option value="direct-drag43">기존 직접 드래그</option></select><button id="preview44">미리보기</button><button id="apply44" disabled>교정값 적용</button><button id="reject44" disabled>거절·원형 보기</button></div><output id="learnResult44" aria-live="polite"></output>';
 document.querySelector('.workspace').after(section);
 const frame=by('after').parentElement;
 const target=document.createElement('span');target.id='sculptTarget44';target.hidden=true;target.setAttribute('aria-hidden','true');target.textContent='＋';
 Object.assign(target.style,{position:'absolute',pointerEvents:'none',transform:'translate(-50%,-50%)',fontSize:'24px',fontWeight:'bold',lineHeight:'1',color:'#a9262d',textShadow:'0 0 2px white',zIndex:'5'});frame.append(target);
 for(const id of ['dx44','dy44'])by(id).style.width='5.2em';
 let ctx,weights,armed=false,pending=null,goal=null,lastSig='',retryNote='';const measured=new Set();
 const result=s=>{by('learnResult44').textContent=s;};
 const buttons=()=>{by('apply44').disabled=!pending?.allowed;by('reject44').disabled=!pending;by('target44').setAttribute('aria-pressed',String(armed));};
 const reset=()=>{pending=null;goal=null;armed=false;target.hidden=true;buttons();};
 const keyOf=c=>signature(c.state,c.zone.key,c.photo);
 function evidence(outcome){
   if(!pending||!Number.isFinite(pending.after))return;
   const key=pending.uid+'|'+outcome;
   const bucket=outcome==='measured'?measured:pending.decisions;if(bucket.has(key))return;bucket.add(key);
   const d={task:'sculpt-target44',subject:pending.subject,outcome,metricBefore:round(pending.before),metricAfter:round(pending.after),unit:'px@192',
     method:pending.method,zone:pending.zone,yaw:pending.yaw,pitch:pending.pitch};
   for(let w=window;w;){try{w.dispatchEvent(new w.CustomEvent('bookfriend:learning-evidence',{detail:{...d}}));if(w===w.parent)break;w=w.parent;if(w.location.origin!==window.location.origin)break;}catch{break;}}
 }
 function targetMarker(){
  if(!goal||!ctx){target.hidden=true;return;}
  target.hidden=false;target.style.left=goal.point[0]/192*100+'%';target.style.top=goal.point[1]/192*100+'%';
 }
 function setGoal(delta){
  const cam=camera(ctx),anchor=ctx.guide.index,from=at192(cam,ctx.shown.parts[0].vertices[anchor].p);
  goal={from,point:from.map((x,i)=>x+delta[i]),delta,index:anchor};pending=null;targetMarker();buttons();
 }
 function begin(){
   if(!ctx||!weights)return;
   if(pending){pending=null;redraw();requestAnimationFrame(begin);return;}
   const inputs=[by('dx44'),by('dy44')];if(inputs.some(n=>!n.value||!n.validity.valid))return result('목표 이동량은 축마다 −64~64px 범위로 입력해 주세요.');
   if(!goal)setGoal(inputs.map(n=>Number(n.value)));
   const s=ctx.state,z=ctx.zone,cam=camera(ctx),reg=weights.cases[s.subject]?.[s.base]?.[z.key],kernel=reg?.vertices[goal.index];
   if(!kernel)return result('이 출발 형상과 표점에 해당하는 학습 자료가 없습니다.');
   const values=[s.values[z.xAxis],s.values[z.yAxis]],method=by('method44').value;
   const limits=Math.abs(s.view.yaw)>80||Math.abs(s.view.pitch)>27?'학습 구도 밖':ctx.photo?'내 참고그림 형상':s.view.angle!==0?'관절 포즈 적용 중':!ctx.guide.front?'뒤를 향한 표점':'';
   const solved=method==='ridge-inverse44'?recommend(kernel,{...s.view,scale:cam.projection.scale*192/cam.width,delta:goal.delta,values}):{next:baselineDirect(values,goal.delta),condition:null};
   const sig=keyOf(ctx),uid=JSON.stringify([sig,method,goal.index,goal.point.map(round)]);
   pending={sig,uid,decisions:new Set(),index:goal.index,subject:s.subject,zone:z.key,yaw:s.view.yaw,pitch:s.view.pitch,method,before:norm(goal.delta),next:solved.next,
     values:{...s.values,[z.xAxis]:solved.next[0],[z.yAxis]:solved.next[1]},allowed:false,reason:limits,condition:solved.condition};
   if(limits){pending.after=pending.before;result('보류 · '+limits+'. 현재 수치를 유지합니다.');evidence('held');buttons();return;}
   result('교정 메시에서 실제 표점 위치를 계산하는 중입니다.');redraw();
 }
 by('target44').onclick=()=>{
   if(!ctx)return;const was=armed;reset();redraw();armed=!was;buttons();
   if(armed)frame.scrollIntoView({block:'center',behavior:'instant'});
   result(armed?'오른쪽 교정본에서 선택한 표점이 도달할 자리를 찍으세요.':'목표 선택을 취소했습니다.');
 };
 frame.addEventListener('pointerdown',e=>{
   if(!armed||!ctx||e.button!==0)return;e.preventDefault();e.stopImmediatePropagation();
   const r=by('after').getBoundingClientRect(),screen=[(e.clientX-r.left)/r.width*192,(e.clientY-r.top)/r.height*192];
   const cam=camera(ctx),orig=at192(cam,ctx.shown.parts[0].vertices[ctx.guide.index].p);
   const d=screen.map((v,i)=>Math.round((v-orig[i])*4)/4);
   armed=false;if(d.some(n=>Math.abs(n)>64)){buttons();result('선택한 표점에서 각 축 64px 안의 위치를 골라주세요.');return;}
   [by('dx44').value,by('dy44').value]=d;setGoal(d);begin();
 },true);
 for(const k of ['dx44','dy44','method44'])by(k).oninput=()=>{reset();redraw();result('새 목표 또는 방식으로 미리보기를 실행하세요.');};
 by('method44').onchange=by('method44').oninput;
 by('preview44').onclick=begin;
 by('apply44').onclick=()=>{if(!pending?.allowed||!ctx||keyOf(ctx)!==pending.sig)return;evidence('accepted');const v=pending.values;reset();apply(v);result('교정값을 적용했습니다. 부위 교정의 되돌리기로 복원할 수 있습니다.');};
 by('reject44').onclick=()=>{if(!pending)return;if(!pending.reason)evidence('rejected');reset();redraw();result('시안을 닫고 출발 교정값을 복원했습니다.');};
 fetch('studio-sculpt-learning44.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(v=>{if(v.version!==44)throw Error();weights=v;redraw();}).catch(()=>{retryNote='44차 학습 자료를 읽지 못했습니다.';redraw();});
 return {
   values(state,zoneKey,photo){return pending&&!pending.reason&&pending.sig===signature(state,zoneKey,photo)?pending.values:state.values;},
   observe(c){
    ctx=c;const k=keyOf(c);if(k!==lastSig){const existed=!!pending;reset();if(existed)result('부위·구도 또는 교정값이 바뀌어 시안을 닫았습니다.');lastSig=k;}
    by('learnInfo44').textContent=retryNote||(weights?c.zone.label+' · 42차 중립 표점의 여러 시점 이동량을 학습했습니다. 목표점은 원래 표점과 같은 정점입니다.':'학습 계수를 읽는 중입니다.');
    by('preview44').disabled=!weights;by('target44').disabled=!weights;targetMarker();
    if(!pending||pending.reason||pending.sig!==k)return;
    const cam=camera(c),p=at192(cam,c.shown.parts[0].vertices[pending.index].p);
    pending.after=norm(p.map((x,i)=>x-goal.point[i]));
    pending.allowed=pending.before>=.15&&pending.before-pending.after>=.08;
    result((pending.allowed?'교정 시안':'작은 개선으로 보류')+' · 목표 거리 '+pending.before.toFixed(2)+' → '+pending.after.toFixed(2)+'px · '+c.zone.label+' 두 축 '+pending.next.join(', ')+(pending.condition!==null&&pending.condition<.008?' · 한 방향은 화면에서 거의 구별되지 않습니다.':''));
    evidence('measured');if(!pending.allowed)evidence('held');buttons();
   }
 };
}


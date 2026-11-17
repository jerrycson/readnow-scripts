const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
const svg=(tag,attrs)=>{const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
const num=(v,n=3)=>Number.isFinite(v)?v.toFixed(n):'미측정';
const read=async file=>{const r=await fetch(file);if(!r.ok)throw Error(file+' 응답 '+r.status);return r.json();};
let data,projection,current,row,id='M01',imageNumber=2,view={x:0,y:0,width:248},drag=null,probe=null;
const labels=['화면 왼눈','화면 오른눈','코끝','입 중앙'];
const line=(points,color,dash='')=>svg('polyline',{points:points.map(p=>p.join(',')).join(' '),stroke:color,'stroke-width':.85,'stroke-dasharray':dash,fill:'none','stroke-linejoin':'round'});
const dots=(points,color)=>svg('path',{d:points.map(([x,y])=>'M'+x+' '+y+'h.25').join(''),stroke:color,'stroke-width':.65,'stroke-linecap':'round',fill:'none'});
function table(headers,rows){const t=el('table');t.className='metrics';const tr=el('tr');for(const s of headers){const th=el('th',s);th.scope='col';tr.append(th);}const head=el('thead');head.append(tr);t.append(head);const body=el('tbody');for(const cells of rows){const r=el('tr');for(const c of cells)r.append(el('td',c));body.append(r);}t.append(body);return t;}
function updateView(){const plate=$('plate');plate.setAttribute('viewBox',[view.x,view.y,view.width,view.width].join(' '));$('zoomText').value=num(248/view.width,1)+'배';}
function fitFace(){if(!current)return;const p=current.handSegments.flat(),xs=p.map(v=>v[0]),ys=p.map(v=>v[1]);const w=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))+35;view={width:w,x:(Math.min(...xs)+Math.max(...xs)-w)/2,y:(Math.min(...ys)+Math.max(...ys)-w)/2};updateView();}
function nearest(p,points){return points.length?Math.min(...points.map(q=>Math.hypot(p[0]-q[0],p[1]-q[1]))):null;}
function draw(){
  if(!current)return;const plate=$('plate');plate.replaceChildren();plate.append(svg('rect',{x:0,y:0,width:248,height:248,fill:'#fff'}));
  if($('showPhoto').checked){const image=svg('image',{href:current.source,x:0,y:0,width:248,height:248,opacity:+$('opacity').value/100});image.onload=()=>{$('imageState').textContent='공식 서버 원본을 직접 읽었습니다. 원본 248×248px · 네 점 정합.';};image.onerror=()=>{$('imageState').textContent='공식 서버 그림을 열지 못했습니다. 선택한 공식 그림 링크에서 원전을 확인하세요. 관측선과 파생 좌표는 별도로 표시합니다.';};plate.append(image);}
  if($('showPrior').checked&&current.priorHandTrace?.length)plate.append(line(current.priorHandTrace,'#83877d','2 2'));
  if($('show35').checked)plate.append(dots(current.visible35||[],'#6943a0'));
  if($('show36').checked)plate.append(dots(current.visible36||[],'#c35b24'));
  if($('showHand').checked)for(const points of current.handSegments)plate.append(line(points,'#007f87'));
  if($('showAnchors').checked)current.anchors.forEach((p,i)=>{const q=current.projectedAnchors?.[i];if(q){plate.append(line([p,q],'#946b15'));plate.append(svg('rect',{x:q[0]-1.3,y:q[1]-1.3,width:2.6,height:2.6,fill:'none',stroke:'#946b15','stroke-width':.65}));}plate.append(svg('circle',{cx:p[0],cy:p[1],r:1.6,fill:'#fff',stroke:'#1c3a2c','stroke-width':.7}));const text=svg('text',{x:p[0]+2,y:p[1]-2,fill:'#1c3a2c','font-size':4});text.textContent=String(i+1);plate.append(text);});
  if(probe){plate.append(svg('path',{d:'M'+(probe[0]-3)+' '+probe[1]+'h6 M'+probe[0]+' '+(probe[1]-3)+'v6',stroke:'#1a2830','stroke-width':.6}));$('probe').textContent='원본 ('+num(probe[0],1)+', '+num(probe[1],1)+')px · 관측점까지 '+num(nearest(probe,current.handSegments.flat()),2)+'px · 35차 가시점 '+num(nearest(probe,current.visible35||[]),2)+'px · 36차 가시점 '+num(nearest(probe,current.visible36||[]),2)+'px. 클릭 위치의 참고값이며 전체 오차와 다릅니다.';}
  updateView();
}
function textBlock(host,paragraphs){$(host).replaceChildren(...paragraphs.map(t=>el('p',t)));}
function choose(){
  current=projection.views.find(v=>v.id===id&&v.imageNumber===imageNumber);row=data.rows.find(r=>r.id===id&&r.index===imageNumber-1);if(!current||!row)throw Error('이 시점의 비교 자료가 없습니다.');
  document.querySelectorAll('[data-case]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.case===id));document.querySelectorAll('[data-image]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.image===imageNumber));
  probe=null;view={x:0,y:0,width:248};$('probe').textContent='확인할 위치를 누르면 원본 좌표와 가장 가까운 관측선 거리를 표시합니다.';$('source').href=data.sources[id].source;$('imageLink').href=current.source;$('imageState').textContent='공식 서버 원본을 읽는 중입니다.';
  const [before,after]=row.rawVisible,delta=after-before;$('metrics').replaceChildren(el('h3','원본 관측점 → 가시 윤곽'),table(['35차','36차','변화'],[[num(before)+'px',num(after)+'px',(delta>0?'+':'')+num(delta)+'px · '+(delta>0?'악화':'개선')]]));
  textBlock('pose',['현재 겹침은 네 점 정합입니다. 흰 원은 원본 관측점, 금색 네모는 35차 기준 메시의 투영점입니다. 1 왼눈 · 2 오른눈 · 3 코끝 · 4 입 중앙. 턱은 카메라 추정에 쓰지 않았습니다.','좌우 '+num(row.pose.yaw,2)+'° · 상하 '+num(row.pose.pitch,2)+'° · 화면 회전 '+num(row.pose.roll,2)+'° · 배율 '+num(row.pose.scale,3)+' · 네 점 RMS '+num(row.pose.rms)+'px. 35·36차를 같은 카메라에서 비교합니다.']);
  $('pose').append(table(['기준점','정합 잔차'],labels.map((s,i)=>[s,num(row.pose.error?.[i])+'px'])));
  const hidden=row.leaveAnchorOut||[];$('hidden').replaceChildren(el('p','네 점 중 하나를 숨기고 나머지 세 점으로 카메라를 다시 추정했습니다. 숨긴 점 오차가 크므로 독립 자세 추정에 성공했다고 볼 수 없습니다.'),table(['숨긴 점','그 점의 오차'],hidden.map(v=>[labels[v.missing],num(v.miss)+'px'])));
  if(row.formerPose)textBlock('former',['예전 두 점은 양 눈 중심만 맞춰 잔차가 0이어도 턱이 맞는다는 근거가 되지 않습니다. 당시 좌우 '+num(row.formerPose.yaw,2)+'° · 상하 '+num(row.formerPose.pitch,2)+'° · 회전 '+num(row.formerPose.roll,2)+'° · 배율 '+num(row.formerPose.scale,3)+'.','당시 대용선 지표: 35차 '+num(row.formerMetric?.[0])+'px → 36차 '+num(row.formerMetric?.[1])+'px. 이는 지금의 실제 가시 윤곽 지표와 대상이 달라 직접 증감으로 합치지 않습니다.','두 점 방식의 가시 좌표는 이 데이터에 없으므로 표와 근거만 보존합니다. 위 겹침은 항상 네 점 카메라입니다.']);
  else textBlock('former',['이 4번 작화에는 예전 두 점 정합 비교 기록이 없습니다. 두 점 수치를 다른 그림에서 가져오지 않았습니다. 위 겹침은 네 점 카메라입니다.']);
  $('omitted').textContent=current.omitted;const u=new URL(location.href);u.searchParams.set('case',id);u.searchParams.set('image',imageNumber);history.replaceState(null,'',u);draw();
}
function summaries(){
  $('summary').replaceChildren(table(['그림','35차 평균','36차 평균','판정'],data.rows.map(r=>[data.sources[r.id].name+' '+(r.index+1)+'번',num(r.rawVisible[0])+'px',num(r.rawVisible[1])+'px',r.rawVisible[1]>r.rawVisible[0]?'악화':'개선'])));
  $('chin').replaceChildren(table(['측면 대상','마지막 3px의 35차','마지막 3px의 36차','1px 높이의 최대 뒤로 물러남'],Object.entries(data.side||{}).map(([k,v])=>[data.sources[k].name,num(v.bottomThreePixelsGap?.[0])+'px',num(v.bottomThreePixelsGap?.[1])+'px',num(v.maxRetreatInOnePx?.horizontalPx)+'px · y '+v.maxRetreatInOnePx?.fromY+'→'+v.maxRetreatInOnePx?.toY])));
}
function notes(list){$('notes').replaceChildren(...list.map(n=>{const a=el('article');a.className='research-note';a.id=n.noteId;a.append(el('h3',n.title),el('p',n.state),el('h4','한 줄 요약'),el('p',n.line),el('h4','한 문단 요약'),el('p',n.unit));const d=el('details'),s=el('summary','A4 한 페이지용 상세 원고'),paper=el('div',n.detail);paper.className='paper';d.append(s,el('h4','상세 설명'),paper);const p=el('p'),link=el('a','원전과 근거');link.href=n.url;p.append(link);a.append(d,p);return a;}));}
const point=e=>{const b=$('plate').getBoundingClientRect();return [view.x+(e.clientX-b.left)*view.width/b.width,view.y+(e.clientY-b.top)*view.width/b.height];};
function zoom(f,p=[view.x+view.width/2,view.y+view.width/2]){const w=Math.max(24.8,Math.min(496,view.width*f)),r=w/view.width;view={x:p[0]-(p[0]-view.x)*r,y:p[1]-(p[1]-view.y)*r,width:w};updateView();}
const plate=$('plate');plate.onwheel=e=>{e.preventDefault();zoom(Math.exp(e.deltaY*.0015),point(e));};
plate.onpointerdown=e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};plate.setPointerCapture(e.pointerId);};
plate.onpointermove=e=>{if(drag?.id!==e.pointerId)return;const b=plate.getBoundingClientRect(),dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved ||=Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>3;view.x-=dx*view.width/b.width;view.y-=dy*view.width/b.height;drag.x=e.clientX;drag.y=e.clientY;updateView();};
plate.onpointerup=e=>{if(drag?.id!==e.pointerId)return;const click=!drag.moved;drag=null;if(plate.hasPointerCapture(e.pointerId))plate.releasePointerCapture(e.pointerId);if(click){probe=point(e);draw();}};plate.onlostpointercapture=()=>drag=null;
plate.onkeydown=e=>{const shifts={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(shifts[e.key]){e.preventDefault();const [x,y]=shifts[e.key];view.x+=x*view.width*.05;view.y+=y*view.width*.05;updateView();}else if(e.key==='+'||e.key==='='){e.preventDefault();zoom(.8);}else if(e.key==='-'){e.preventDefault();zoom(1.25);}};
$('zoomIn').onclick=()=>zoom(.8);$('zoomOut').onclick=()=>zoom(1.25);$('whole').onclick=()=>{view={x:0,y:0,width:248};updateView();};$('face').onclick=fitFace;
for(const key of ['showPhoto','showHand','show35','show36','showPrior','showAnchors','opacity'])$(key).oninput=draw;
document.querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>{id=b.dataset.case;choose();});document.querySelectorAll('[data-image]').forEach(b=>b.onclick=()=>{imageNumber=+b.dataset.image;choose();});
const expandNotes=()=>document.querySelectorAll('.research-note details').forEach(d=>d.open=true);$('print').onclick=()=>{expandNotes();window.print();};window.addEventListener('beforeprint',expandNotes);
try{const n=await Promise.all([read('oblique37.json'),read('projected37.json'),read('notes37.json')]);[data,projection]=n;notes(n[2]);const params=new URLSearchParams(location.search);if(['M01','F02'].includes(params.get('case')))id=params.get('case');if(['2','4'].includes(params.get('image')))imageNumber=+params.get('image');summaries();choose();$('notice').textContent='35·36차 비교 자료를 읽었습니다. 네 점 정합의 독립 검증은 실패 조건까지 포함합니다. 37차 교정 후보는 별도 판정합니다.';}catch(e){$('notice').textContent='자료를 열 수 없습니다. '+e.message;console.error(e);}

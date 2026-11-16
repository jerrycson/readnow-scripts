import {paperForms} from './paperforms35.mjs';
import {paperRig} from './paper-rig35.mjs';
import {paperCompare,caseComparison} from './paper-compare35.mjs';
import {loadRig} from './rig32.mjs';
import {raisedPose,pose34} from './bust34.mjs';
import {portraitPixels} from './portrait48.mjs';
import {studyView} from './camera35.mjs';
import {DEFAULTS} from './model.mjs';

const el=id=>document.getElementById(id);
const ns='http://www.w3.org/2000/svg',shape=el('shape35');
const element=(name,text)=>Object.assign(document.createElement(name),{textContent:text});
function svg(name,attrs){const n=document.createElementNS(ns,name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;}
function buttons(host,options,chosen,set){host.replaceChildren(...options.map(([id,name])=>{
 const b=element('button',name);b.type='button';b.dataset.id=id;b.setAttribute('aria-pressed',String(id===chosen));b.onclick=()=>set(id);return b;}));}
function line(points,color,thick,dash=''){return svg('polyline',{points:points.map(p=>p.join(',')).join(' '),fill:'none',stroke:color,'stroke-width':thick,'stroke-linejoin':'round','stroke-linecap':'round','stroke-dasharray':dash});}
let group='S',level=3,id='W',yaw=-65,pitch=0,zoom=1,drag=null,queued=false,ready=false,reference=null;
let cache='',rest=null,poseKey='',posed=null,fitKey='',fit=null;
let clinical={},selectedView=0,photoURL='',caseKey='',caseMatch=null;
function clearPhoto(){
 photoURL='';el('caseFile').value='';el('caseClear').hidden=true;
}
function caseMenu(){
 const refs=clinical[id];el('caseSource').hidden=!refs;if(!refs)return;
 buttons(el('caseViews'),refs.map((row,i)=>[i,row.name]),selectedView,i=>{
   selectedView=i;clearPhoto();caseMenu();drawSoon();
 });
 const [w,h]=refs[selectedView].size;
 el('caseHint').textContent='원전의 해당 인물·시점 구획 '+w+' × '+h+' px. 사진을 고르면 현재 브라우저 안에서 선과 겹칩니다.';
}
function drawCase(scene,settings,key){
 const ref=clinical[id]?.[selectedView];if(!ref)return;
 const plate=el('casePlate'),[w,h]=ref.size;
 if(caseKey!==key+':'+selectedView){
   const angle=ref.view==='앞'?0:ref.view==='사'?-40:-90;
   const im=portraitPixels(settings,{...studyView(scene,false),yaw:angle,pitch:0,freeOrbit:true,studyResolution:192});
   caseMatch=caseComparison(scene,im,ref);caseKey=key+':'+selectedView;
 }
 const xs=ref.points.map(p=>p[0]),ys=ref.points.map(p=>p[1]),pad=Math.max(w,h)*.07;
 plate.setAttribute('viewBox',[Math.min(...xs)-pad,Math.min(...ys)-pad,Math.max(...xs)-Math.min(...xs)+2*pad,Math.max(...ys)-Math.min(...ys)+2*pad].join(' '));
 plate.replaceChildren();
 if(photoURL)plate.append(svg('image',{href:photoURL,width:w,height:h}));
 if(el('trace35').checked)plate.append(line(ref.points,'#007d7a',Math.max(.7,w/220)));
 if(caseMatch&&el('model35').checked)plate.append(line(caseMatch.points,'#b14a19',Math.max(.7,w/220),'4 2'));
 el('caseError').textContent=ref.name+' · 청록은 원자료에서 직접 딴 선, 주황은 선택한 삼차원 시안입니다. 양 끝을 맞춘 뒤 남은 윤곽 차이 '+(caseMatch?(caseMatch.error*100).toFixed(2)+'%':'계산할 수 없음')+' (구획 대각선 기준).'+(ref.view==='사'?' 사선은 카메라 각도가 추정값입니다.':'');
}
const q=new URLSearchParams(location.search);
if(paperForms.some(r=>r.id===q.get('form')))id=q.get('form');
if(/^[ABS][1-5]$/.test(q.get('cell')||'')){group=q.get('cell')[0];level=Number(q.get('cell')[1]);}
function syncUrl(){const u=new URL(location.href);u.searchParams.set('form',id);u.searchParams.set('cell',group+level);history.replaceState(null,'',u);}
function menu(){
 const form=paperForms.find(r=>r.id===id);el('current35').textContent=form.name;
 el('which35').textContent=form.id+' · '+form.observed+'. '+form.note;el('cite35').href=form.url;el('motionLink').href='motion35.html?form='+encodeURIComponent(id);
 buttons(el('views35'),[['A','A · 상하 비율 사선'],['B','B · 상부 돌출 사선'],['S','B · 같은 칸 측면']],group,k=>{group=k;menu();drawSoon();});
 buttons(el('levels35'),reference.cells.filter(c=>c.id[0]===group).map(c=>[Number(c.id[1]),c.level]),level,k=>{level=k;menu();drawSoon();});
 buttons(el('variants35'),paperForms.map(r=>[r.id,r.id==='W'?'기본형':r.id+' '+r.name]),id,k=>{id=k;selectedView=0;clearPhoto();menu();drawSoon();});caseMenu();syncUrl();
}
function viewButtons(){buttons(el('angles35'),[['front','정면'],['oblique','사선'],['side','측면'],['under','밑면'],['back','뒤']],Object.keys(views).find(k=>views[k][0]===yaw&&views[k][1]===pitch),k=>{[yaw,pitch]=views[k];viewButtons();drawSoon();});}
const views={front:[0,0],oblique:[-36,0],side:[-90,0],under:[-35,-32],back:[180,0]};
function draw(){
 if(!ready)return;
 const value=Number(el('size35').value)/100,arm=Number(el('arm35').value);
 const s={...DEFAULTS,heads:8,sex:'female',designStyle:'manga',paperForm:id,chestVolume:value};
 const key=id+'/'+value;
 if(key!==cache){rest=paperRig(s);cache=key;poseKey='';fitKey='';}
 const pkey=key+'/'+arm;
 if(poseKey!==pkey){posed=arm?pose34(rest,raisedPose(arm)).scene:rest;poseKey=pkey;}
 const img=portraitPixels(s,{...studyView(posed,false),yaw,pitch,freeOrbit:true,cameraZoom:zoom,studyResolution:192});
 shape.width=img.width;shape.height=img.height;shape.getContext('2d').putImageData(new ImageData(img.data,img.width,img.height),0,0);
 el('sizeOut').value=Math.round(value*100);el('armOut').value=arm+'°';
 el('position35').textContent='좌우 '+Math.round(yaw)+'° · 상하 '+Math.round(pitch)+'° · 확대 '+Math.round(zoom*100)+'%';
 drawCase(rest,s,key);
 const c=reference.cells.find(v=>v.id===group+level),[x0,y0,x1,y1]=c.box,w=x1-x0,h=y1-y0;
 if(fitKey!==key+c.id){
   const image=portraitPixels(s,{...studyView(rest,false),yaw:c.view==='측면'?-90:-26.15,pitch:0,freeOrbit:true,studyResolution:192});
   fit=paperCompare(rest,image,c);fitKey=key+c.id;
 }
 const plate=el('plate');plate.setAttribute('viewBox','0 0 '+w+' '+h);plate.replaceChildren();
 if(el('image35').checked)plate.append(svg('image',{href:'wallner-fig1-crop35.webp',x:-x0,y:-y0,width:Math.round(reference.width*725/1280),height:reference.height,preserveAspectRatio:'none'}));
 if(el('trace35').checked)for(const ps of c.lines)plate.append(line(ps.map(([x,y])=>[x*w,y*h]),'#007d7a',1.15));
 if(fit&&el('model35').checked)for(const ps of fit.lines)plate.append(line(ps,'#b14a19',1.15,'3 1.6'));
 const error=fit?fit.errors.map(v=>(v*100).toFixed(2)+'%').join(' / '):'계산할 수 없음';
 el('res35').textContent=(group==='S'?'측면 종단선':'가까운 쪽 / 먼 쪽 하부선')+' 차이 '+error+' · 원도판 칸 대각선 기준. '+(group==='S'?'보이는 선의 두 끝':'좌우 유두 중심')+'을 맞춘 기본 자세입니다.';
}
function drawSoon(){if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;try{draw();}catch(e){el('position35').textContent='관찰창 오류 · '+e.message;console.error(e);}});}}
function addField(records){for(const r of records){
 const article=element('article',''),a=element('a',r.id+' · 촬영 출처 ↗');a.href=r.page;a.target='_blank';a.rel='noopener';
 const chart=svg('svg',{'aria-label':r.id+' 측면 윤곽',role:'img'}),p=r.points.map(([x,y])=>[x*r.width/100,y*r.height/100]),xs=p.map(v=>v[0]),ys=p.map(v=>v[1]);
 chart.setAttribute('viewBox',[Math.min(...xs)-4,Math.min(...ys)-4,Math.max(...xs)-Math.min(...xs)+8,Math.max(...ys)-Math.min(...ys)+8].join(' '));chart.append(line(p,'#16645b',2));article.append(a,chart,element('p',r.note));el('field35').append(article);
}}
async function start(){
 const fetchJson=async path=>{const r=await fetch(path);if(!r.ok)throw Error(path+' '+r.status);return r.json();};
 const [data,field,cases]=await Promise.all([fetchJson('reference35.json'),fetchJson('gravity35.json'),fetchJson('case-lines35.json'),loadRig()]);reference=data;clinical=cases;ready=true;menu();viewButtons();addField(field);
 for(const key of ['size35','arm35','trace35','image35','model35'])el(key).oninput=drawSoon;
 el('caseClear').onclick=()=>{clearPhoto();drawSoon();};
 el('caseFile').onchange=async()=>{
   const file=el('caseFile').files[0],ref=clinical[id]?.[selectedView];if(!file||!ref)return;
   const image=new Image();
   try{
     image.src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);});
     await image.decode();
   }catch{el('caseHint').textContent='그림을 읽을 수 없습니다.';return;}
   if(ref!==clinical[id]?.[selectedView])return;
   if(Math.abs(image.width/image.height-ref.size[0]/ref.size[1])>.01){el('caseHint').textContent='원전의 지정 구획과 가로세로 비율이 다릅니다. '+ref.size.join(' × ')+' 비율의 같은 구획을 선택하세요.';return;}
   photoURL=image.src;el('caseClear').hidden=false;drawSoon();
 };
 el('reset35').onclick=()=>{yaw=-65;pitch=0;zoom=1;viewButtons();drawSoon();};
 shape.onpointerdown=e=>{if(e.button===0){drag=[e.pointerId,e.clientX,e.clientY];shape.setPointerCapture(e.pointerId);}};
 shape.onpointermove=e=>{if(drag?.[0]!==e.pointerId)return;yaw=(yaw+(e.clientX-drag[1])*.65)%360;pitch=(pitch+(e.clientY-drag[2])*.65)%360;drag=[e.pointerId,e.clientX,e.clientY];drawSoon();};
 shape.onlostpointercapture=()=>{drag=null;viewButtons();};shape.onwheel=e=>{e.preventDefault();zoom=Math.max(.45,Math.min(3,zoom*Math.exp(-e.deltaY*.0013)));drawSoon();};
 shape.onkeydown=e=>{const d={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,-5],ArrowDown:[0,5]}[e.key];if(d){e.preventDefault();yaw+=d[0];pitch+=d[1];viewButtons();drawSoon();}};
 drawSoon();
}
start().catch(e=>{el('position35').textContent='자료를 열 수 없습니다 · '+e.message;});
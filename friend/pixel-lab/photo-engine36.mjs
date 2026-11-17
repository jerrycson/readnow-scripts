import {SIZE as N,views,names,visibleWeight,foreground,camera,extent,signature,rankViews,surfaceEdit,obj} from './hull36.mjs';
import {MODEL_VERSION,acceptsFive,reconstructPhoto} from './photo-ml44.mjs';
import {preview} from './projector36.mjs';
import {scanImage} from './scan-view36.mjs';
const $=id=>document.getElementById(id),button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;return b;};
function choose(id,items,key,fn){$(id).replaceChildren(...items.map(([k,label])=>{const b=button(label,()=>fn(k));b.setAttribute('aria-pressed',k===key);return b;}));}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),regions={jaw:'턱',cheek:'볼',nose:'코',crown:'정수리'};
const shots=Array(5).fill(null),demonstrations=[],edits=()=>Object.fromEntries(Object.keys(regions).map(k=>[k,[0,0]]));let tuning=edits();
let pos=0,tool='align',region='jaw',yaw=0,pitch=0,zoom=1,mesh=null,fitted=null,drag=null,painting=null,serial=0,frame=0,candidates=[],db,applying=false;
const send=m=>$('msg').textContent=m;
const alpha=document.createElement('input'),alphaOut=document.createElement('output'),alphaLabel=document.createElement('label');
alpha.type='range';alpha.min='0';alpha.max='100';alpha.value='100';alpha.id='photoBlend';
alphaLabel.append(document.createTextNode('사진 투영 농도 '),alpha,alphaOut);$('texture').closest('label').after(alphaLabel);
alpha.oninput=()=>{alphaOut.value=alpha.value+'%';update();};alphaOut.value='100%';
const sculptLinks=document.createElement('p');
sculptLinks.innerHTML='<a href="studio-sculpt.html?case=F02#localReference" target="_blank" rel="noopener">페른 정밀조형에서 사진 외형 비교</a> · <a href="studio-sculpt.html?case=M01#localReference" target="_blank" rel="noopener">힘멜 정밀조형에서 비교</a>';
$('msg').after(sculptLinks);
const limits=document.createElement('small');
limits.textContent='다섯 방향 전경에서 얼굴의 바깥 부피를 근사합니다. 임의 사진의 가려진 눈·입 깊이, 상체·하체·전신의 자동 복원은 지원하지 않습니다. 입력 사진은 이 기기 브라우저에 저장합니다.';
sculptLinks.after(limits);
const update=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});};
const partLabel=button('얼굴',()=>{});partLabel.setAttribute('aria-pressed','true');$('parts').append(partLabel);
for(const text of ['상체','하체','전신']){const b=button(text+' · 연구 예정',()=>{});b.disabled=true;$('parts').append(b);}
function select(i){pos=i;const shot=shots[i];$('sourceYaw').value=shot?.yaw??views[i];$('tol').value=shot?.tolerance??44;$('photoInput').value='';menus();update();}
function menus(){
 choose('slots',views.map((v,i)=>[i,names[i]+(shots[i]?' ✓'+(shots[i].yaw!==views[i]?' ('+shots[i].yaw+'°)':''):'')]),pos,select);
 choose('brushes',[['align','중심·크기 정렬'],['add','포함 붓'],['remove','제외 붓']],tool,k=>{tool=k;menus();});
 choose('regions',Object.entries(regions),region,k=>{region=k;menus();update();});
}
const learning=$('learnedShape44');
function rebuild(){
 const ready=acceptsFive(shots);
 learning.disabled=!ready;
 if(!ready)learning.checked=false;
 mesh=reconstructPhoto(shots,learning.checked?MODEL_VERSION:null);
 fitted=mesh;
 if(mesh)for(const [k,[w,d]] of Object.entries(tuning))if(w||d)fitted=surfaceEdit(fitted,k,w,d);
 $('learningState44').textContent=!ready?'정면부터 45°씩 돌아 찍은 다섯 방향을 채우면 보정을 비교할 수 있습니다.':
   learning.checked?'학습 보정 v1 적용 중 · 체크를 풀면 같은 입력과 수동 조형값으로 기존 외피를 복원합니다.':
   '기존 외피 · 정렬을 맞춘 다섯 장에서 보정을 켜고 사선으로 돌려 비교하세요.';
 update();
}
learning.onchange=rebuild;
function shotFrom(rgba,slot,tol=44){const mask=foreground(rgba,N,N,tol),c=camera(mask);if(!c)throw Error('전경을 찾을 수 없습니다. 단색 배경 또는 투명한 여백이 있는 사진을 사용하세요.');
 return {rgba,mask,camera:c,rows:extent(mask),yaw:views[slot],tolerance:tol};}
function detected(s){return s?rankViews(s.mask,candidates):[];}
let rankKey=null,ranks=[];
function draw(){
 const shot=shots[pos],src=$('source'),ctx=src.getContext('2d'),out=$('result').getContext('2d');
 ctx.clearRect(0,0,src.width,src.height);out.clearRect(0,0,224,224);
 if(shot){
  const rgba=new Uint8ClampedArray(shot.rgba);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;let edge=false;
   if(shot.mask[i])edge=!x||!y||x===N-1||y===N-1||!shot.mask[i-1]||!shot.mask[i+1]||!shot.mask[i-N]||!shot.mask[i+N];
   if(edge)rgba.set([0,155,151,255],4*i);}
  const t=document.createElement('canvas');t.width=t.height=N;t.getContext('2d').putImageData(new ImageData(rgba,N,N),0,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(t,0,0,256,256);
  const c=shot.camera;ctx.strokeStyle='#f28026';ctx.beginPath();ctx.moveTo(c.cx*2-6,c.cy*2);ctx.lineTo(c.cx*2+6,c.cy*2);ctx.moveTo(c.cx*2,c.cy*2-6);ctx.lineTo(c.cx*2,c.cy*2+6);ctx.stroke();
 }
 if(rankKey!==shot?.mask){rankKey=shot?.mask;ranks=detected(shot);}
 const equivalent=ranks.length>1&&ranks[1].loss-ranks[0].loss<.012;
 $('direction').textContent=shot&&ranks.length?'윤곽 추정 '+ranks[0].yaw+'°'+(equivalent?' · 다른 방향과 비슷해 확인 필요':' · 실측 두상과의 비교 후보')+' / 입력 '+shot.yaw+'°':'같은 사람의 방향별 사진을 선택하세요.';
 $('acceptYaw').disabled=!ranks.length;
 if(fitted){
  const near=shots.filter(Boolean).sort((a,b)=>visibleWeight(yaw,pitch,b.yaw)-visibleWeight(yaw,pitch,a.yaw))[0];const w=visibleWeight(yaw,pitch,near.yaw);
  out.putImageData(preview(fitted,yaw,pitch,224,zoom,$('texture').checked?shots:null,Number(alpha.value)/100),0,0);
  $('angles').textContent='좌우 '+Math.round(yaw)+'° · 상하 '+Math.round(pitch)+'° · '+(w>0.005?'사진 '+near.yaw+'° · 농도 '+Math.round(w*($('texture').checked?Number(alpha.value):0))+'%':'해당 방향의 사진 없음');
 }else $('angles').textContent='서로 다른 축의 사진이 두 장 이상 있으면 복원 결과가 나타납니다.';
 const [x,y]=tuning[region];$('dot').style.left=50+47*x+'%';$('dot').style.top=50-47*y+'%';$('value').textContent=regions[region]+' 폭 '+Math.round(x*100)+' · 깊이 '+Math.round(y*100);
 $('info').textContent='얼굴 · 사진 '+shots.filter(Boolean).length+'/5장 · '+(fitted?fitted.f.length/3+'개 삼각형 · 전경 마스크의 공통 부피':'입력 대기');
 $('exportMesh').disabled=$('apply').disabled=!fitted;
}
$('photoInput').onchange=async()=>{const file=$('photoInput').files[0],slot=pos;if(!file)return;const token=++serial;
 try{const bitmap=await createImageBitmap(file),cv=document.createElement('canvas');cv.width=cv.height=N;
 const c=cv.getContext('2d'),scale=N/Math.max(bitmap.width,bitmap.height);
 // 불투명한 사진 주위 여백은 모서리 색으로 채워 검은색 패딩이 전경으로 들어오지 않게 한다.
 c.drawImage(bitmap,0,0,1,1,0,0,1,1);const p=c.getImageData(0,0,1,1).data;c.clearRect(0,0,N,N);c.fillStyle='rgba('+[p[0],p[1],p[2],p[3]/255].join(',')+')';c.fillRect(0,0,N,N);
 const w=bitmap.width*scale,h=bitmap.height*scale;c.drawImage(bitmap,(N-w)/2,(N-h)/2,w,h);bitmap.close();const rgba=c.getImageData(0,0,N,N).data;
 if(token!==serial)return;const incoming=shotFrom(rgba,slot),ranking=detected(incoming),confident=ranking.length>1&&ranking[0].loss<.055&&ranking[1].loss-ranking[0].loss>=.012;
 if($('autoYaw').checked&&confident)incoming.yaw=ranking[0].yaw;shots[slot]=incoming;select(slot);rebuild();send(confident&&$('autoYaw').checked?'윤곽을 대조해 '+incoming.yaw+'°로 적용했습니다. 촬영 각도에서 고칠 수 있습니다.':'방향을 확정하기 어려워 선택한 칸의 방향을 사용합니다. 경계와 추정 후보를 확인하세요.');}catch(e){send(e.message);}};
$('tol').oninput=()=>{const s=shots[pos];if(!s)return;try{const edited=shotFrom(s.rgba,pos,+$('tol').value);shots[pos]={...edited,yaw:s.yaw};rebuild();}catch(e){send(e.message);}};
$('acceptYaw').onclick=()=>{if(!ranks.length)return;shots[pos].yaw=ranks[0].yaw;$('sourceYaw').value=shots[pos].yaw;rebuild();};$('sourceYaw').onchange=()=>{const s=shots[pos],v=$('sourceYaw').valueAsNumber;if(!s||!Number.isFinite(v))return;s.yaw=clamp(v,-180,180);$('sourceYaw').value=s.yaw;rebuild();};
function point(e,el,n){const b=el.getBoundingClientRect();return [(e.clientX-b.left)*n/b.width,(e.clientY-b.top)*n/b.height];}
const photo=$('source');
function brush(s,p){const r=+$('brushSize').value;for(let y=Math.max(0,Math.floor(p[1]-r));y<=Math.min(N-1,p[1]+r);y++)for(let x=Math.max(0,Math.floor(p[0]-r));x<=Math.min(N-1,p[0]+r);x++)if(Math.hypot(x-p[0],y-p[1])<=r)s.mask[y*N+x]=tool==='add'?1:0;rankKey=null;update();}
photo.onpointerdown=e=>{if(!shots[pos]||e.button!==0)return;const p=point(e,photo,N);painting={id:e.pointerId,p,slot:pos};photo.setPointerCapture(e.pointerId);if(tool!=='align')brush(shots[pos],p);};
photo.onpointermove=e=>{if(painting?.id!==e.pointerId)return;const s=shots[painting.slot],p=point(e,photo,N);if(tool==='align'){s.camera.cx+=p[0]-painting.p[0];s.camera.cy+=p[1]-painting.p[1];}else brush(s,p);painting.p=p;update();};
photo.onlostpointercapture=()=>{if(painting){const s=shots[painting.slot];s.rows=extent(s.mask);painting=null;rebuild();}};
photo.onwheel=e=>{if(tool!=='align'||!shots[pos])return;e.preventDefault();const c=shots[pos].camera;c.scale=clamp(c.scale*Math.exp(-e.deltaY*.0015),12,224);rebuild();};
$('snap').onclick=()=>{yaw=shots[pos]?.yaw??views[pos];pitch=0;zoom=1;update();};$('texture').oninput=update;
const result=$('result');result.onpointerdown=e=>{if(e.button!==0)return;drag=[e.pointerId,e.clientX,e.clientY];result.setPointerCapture(e.pointerId);};result.onpointermove=e=>{if(drag?.[0]!==e.pointerId)return;yaw=(yaw+.80*(e.clientX-drag[1]))%360;pitch=(pitch+.80*(e.clientY-drag[2]))%360;drag=[e.pointerId,e.clientX,e.clientY];update();};result.onlostpointercapture=()=>drag=null;
result.onwheel=e=>{e.preventDefault();zoom=clamp(zoom*Math.exp(-e.deltaY*.0015),.5,3);update();};
result.onkeydown=e=>{const d={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,5],ArrowDown:[0,-5]}[e.key];if(d){e.preventDefault();yaw+=d[0];pitch+=d[1];update();}};
const pad=$('pad');function setPad(e){const p=point(e,pad,2);tuning[region]=[clamp(p[0]-1,-1,1),clamp(1-p[1],-1,1)];rebuild();}
pad.onpointerdown=e=>{pad.setPointerCapture(e.pointerId);setPad(e);};pad.onpointermove=e=>{if(pad.hasPointerCapture(e.pointerId))setPad(e);};pad.onkeydown=e=>{const d={ArrowLeft:[-.05,0],ArrowRight:[.05,0],ArrowUp:[0,.05],ArrowDown:[0,-.05]}[e.key];if(d){e.preventDefault();tuning[region]=tuning[region].map((v,i)=>clamp(v+d[i],-1,1));rebuild();}};
$('resetEdit').onclick=()=>{tuning[region]=[0,0];rebuild();};
$('exportMesh').onclick=()=>{if(!fitted)return;const u=URL.createObjectURL(new Blob([obj(fitted)],{type:'text/plain'})),a=document.createElement('a');a.href=u;a.download='책방친구-얼굴.obj';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
async function initial(){
 const r=await fetch('head36.json');if(!r.ok)throw Error('실측 두상 파일을 읽지 못했습니다.');const head=(await r.json()).meshes[0];
 for(const yaw of [...views,-45,-90,-135]){const rgba=scanImage(head,yaw,0,N).data,mask=foreground(rgba,N,N,44);candidates.push({yaw,sig:signature(mask)});if(views.includes(yaw))demonstrations.push(rgba);}
 $('demo').disabled=false;update();
}
$('demo').disabled=true;$('demo').onclick=()=>{serial++;learning.checked=false;demonstrations.forEach((rgba,i)=>{shots[i]=shotFrom(rgba,i);
  // 동일한 평행투영 장비로 만든 예시는 원래 교정을 사용한다.
  shots[i].camera={cx:N/2,cy:N/2,scale:N*.797};});tuning=edits();select(0);yaw=pitch=0;zoom=1;rebuild();send('동일 실측 두상의 다섯 시점을 불러왔습니다. 사진을 회전 모델에 투영할 수 있습니다.');};
const openDB=()=>new Promise((resolve,reject)=>{const q=indexedDB.open('bookfriend-photo-model',1);q.onupgradeneeded=()=>q.result.createObjectStore('versions',{keyPath:'id'});q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
const request=q=>new Promise((resolve,reject)=>{q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
let channel;
async function versions(){if(!db)return;const keys=await request(db.transaction('versions').objectStore('versions').getAllKeys());$('saved').replaceChildren(...keys.reverse().map(k=>new Option(new Date(Number(k.split('-')[0])).toLocaleString('ko-KR'),k)));$('load').disabled=!keys.length;}
async function save(){if(!db)throw Error('이 브라우저의 보존함을 열지 못했습니다.');const id=Date.now()+'-'+crypto.randomUUID(),tx=db.transaction('versions','readwrite');
 const done=new Promise((ok,bad)=>{tx.oncomplete=ok;tx.onerror=()=>bad(tx.error);tx.onabort=()=>bad(tx.error);});tx.objectStore('versions').add({id,shots:structuredClone(shots),tuning:structuredClone(tuning),pos,shapeModel:learning.checked?MODEL_VERSION:null});await done;await versions();channel?.postMessage({kind:'version',id});return id;}
$('save').onclick=async()=>{try{await save();send('이 기기에 새 판으로 저장했습니다. 같은 브라우저의 연구 페이지와 관찰창에서 열 수 있습니다.');}catch(e){send(e.message);}};
$('load').onclick=async()=>{try{const v=await request(db.transaction('versions').objectStore('versions').get($('saved').value));if(!v)return;serial++;v.shots.forEach((s,i)=>shots[i]=s);tuning=v.tuning;learning.checked=v.shapeModel===MODEL_VERSION;select(v.pos);rebuild();send('선택한 보존판을 복원했습니다.');}catch(e){send(e.message);}};
$('apply').onclick=async()=>{if(!fitted||applying)return;applying=true;try{const id=await save();localStorage.setItem('bookfriend-face-fit36',id);localStorage.setItem('bookfriend-face-enabled36','1');channel?.postMessage({kind:'apply',id});
 if(parent!==window)parent.postMessage({type:'bookfriend-face-fit36',id},location.origin);
 send('이 기기에 얼굴 판을 저장했습니다. 정밀조형에서 같은 판을 고르고 오른쪽에 사진 외형 적용을 켜면 두 모델을 대조할 수 있습니다.');}catch(e){send(e.message);}finally{applying=false;}};
try{db=await openDB();if('BroadcastChannel'in window){channel=new BroadcastChannel('bookfriend-photo-model36');channel.onmessage=()=>versions().catch(e=>send(e.message));}await versions();}catch(e){send('이 기기 보존함을 사용할 수 없습니다. '+e.message);}
select(0);initial().catch(e=>send(e.message));

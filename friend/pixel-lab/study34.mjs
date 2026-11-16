import {DEFAULTS} from './model.mjs';
import {portraitPixels} from './portrait48.mjs';
import {morphForm,chestParams} from './morph33.mjs';
import {loadRig} from './rig32.mjs';
import {articulate,commonFrame} from './articulation33.mjs';
import {types,form34,raisedPose,pose34,response34} from './bust34.mjs';
import {records34} from '../research/hub/round34.mjs';
const el=id=>document.getElementById(id),node=(tag,txt)=>Object.assign(document.createElement(tag),{textContent:txt});
const params=new URLSearchParams(location.search);
const st={mode:['chest','body'].includes(params.get('mode'))?params.get('mode'):'face',sex:'female',heads:8,type:'balanced',tuning:{},yaw:0,pitch:0,zoom:1,offset:[0,0],arm:0,side:'both',plane:'side',stim:'both',axis:'vertical',support:.45,t:0,ref:'anime',size:192};
let ready=false,tick=0,start=null,renderPending=0,restKey='',base,prior,poseKey='',scenes,nativeKey='',drag=null;
const syncs=[];
function controls(host,title,items,read,write){
 const box=node('fieldset',''),legend=node('legend',title),row=node('div','');box.append(legend,row);el(host).append(box);
 for(const [id,txt] of items){const b=node('button',txt);b.type='button';b.dataset.choice=id;b.onclick=()=>{write(id);sync();drawSoon();};row.append(b);}
 syncs.push(()=>{for(const b of row.children)b.setAttribute('aria-pressed',String(b.dataset.choice===String(read())));});
}
function sync(){syncs.forEach(f=>f());el('faceTools').hidden=st.mode!=='face';el('native').hidden=st.mode!=='face';el('chestTools').hidden=st.mode==='face';
 el('lift').value=st.arm;el('liftOut').value=st.arm+'°';el('typeNote').textContent=typeNotes[st.type];
 for(const k of Object.keys(chestParams)){el('axis-'+k).value=Math.round((st.tuning[k]||0)*100);el('out-'+k).value=el('axis-'+k).value;}}
const typeNotes={balanced:'상·하부가 고르게 이어지며 앞쪽 중심은 기저 중앙 부근입니다.',shallow:'흉곽에 넓게 붙고 앞쪽 돌출이 적습니다.',upper:'상부의 볼륨과 둥근 윗경사가 두드러집니다.',drop:'상부는 길고 완만하며 하부에 볼륨이 모입니다.',narrow:'부착 폭이 좁고 정면에 비해 측면 돌출이 큽니다.',lateral:'가장 돌출된 점과 외측 볼륨이 바깥쪽에 놓입니다.',low:'아래쪽 조직이 부착 주름을 덮고, 가시적인 최저점이 낮습니다.',up:'볼륨 중심이 높고 아래 윤곽이 짧게 돌아옵니다.'};
function stop(){cancelAnimationFrame(tick);tick=0;start=null;}
function resetCam(){st.zoom=1;st.offset=[0,0];}
controls('modes','검토 부위',[['face','얼굴'],['chest','가슴'],['body','전신에서 확인']],()=>st.mode,v=>{stop();st.mode=v;if(v!=='face')st.sex='female';resetCam();references();const u=new URL(location.href);u.searchParams.set('mode',v);history.replaceState(null,'',u);});
controls('common','성인 기본형',[['female','여성'],['male','남성']],()=>st.sex,v=>{st.sex=v;if(v==='male'){st.mode='face';stop();}references();});
controls('common','등신',[5,6,7,8].map(n=>[n,n+'등신']),()=>st.heads,v=>st.heads=Number(v));
controls('common','관찰 해상도',[48,96,192,256].map(n=>[n,n+'px']),()=>st.size,v=>st.size=+v);
controls('views','시점',[[270,'왼쪽 측면'],[315,'왼쪽 45°'],[0,'정면'],[45,'오른쪽 45°'],[90,'오른쪽 측면'],[135,'뒤 사선'],[180,'뒷면']],()=>st.pitch===0?st.yaw:-1,v=>{st.yaw=+v;st.pitch=0;});
controls('refs','참고 원본',[['anime','공식 캐릭터'],['photo','모델 촬영 시트'],['local','내 참고 그림']],()=>st.ref,v=>{st.ref=v;references();});
controls('types','기본 형태',types.map(([id,label])=>[id,label]),()=>st.type,v=>{st.type=v;});
controls('sides','들어 올리는 팔',[['both','양팔'],['left','왼팔'],['right','오른팔']],()=>st.side,v=>st.side=v);
controls('planes','올리는 방향',[['side','옆으로'],['bend','앞으로']],()=>st.plane,v=>st.plane=v);
controls('lifts','팔 각도',[0,45,90,135,178].map(n=>[n,n+'°']),()=>st.arm,v=>st.arm=+v);
controls('axes','자극 방향',[['vertical','상하'],['side','좌우'],['depth','앞뒤']],()=>st.axis,v=>st.axis=v);
controls('stim','자극 위치',[['both','양쪽'],['left','왼쪽'],['right','오른쪽']],()=>st.stim,v=>st.stim=v);
for(const [key,title] of Object.entries(chestParams)){const label=node('label',title+' '),o=node('output','0'),range=node('input','');o.id='out-'+key;range.id='axis-'+key;range.type='range';range.min=-100;range.max=100;range.step=1;range.value=0;
 range.oninput=()=>{st.tuning[key]=+range.value/100;o.value=range.value;drawSoon();};label.append(o,range);el('sliders').append(label);}
el('reset').onclick=()=>{st.tuning={};sync();drawSoon();};
el('lift').oninput=e=>{st.arm=+e.target.value;sync();drawSoon();};el('support').oninput=e=>{st.support=+e.target.value/100;drawSoon();};
el('fit').onclick=()=>{resetCam();drawSoon();};
el('play').onclick=()=>{stop();st.t=0;function next(now){start??=now;st.t=Math.min(2.2,(now-start)/1000);drawSoon();if(st.t<2.2)tick=requestAnimationFrame(next);else stop();}tick=requestAnimationFrame(next);};
el('pause').onclick=stop;el('rewind').onclick=()=>{stop();st.t=0;drawSoon();};el('time').oninput=e=>{stop();st.t=+e.target.value/1000;drawSoon();};
const safeLink=(txt,url)=>{const a=node('a',txt);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
let localURL;
function references(){
 const host=el('reference');host.replaceChildren();if(st.mode!=='face')return;
 const female=st.sex==='female',official='https://frieren-anime.jp/character/chara_group1/'+(female?'1-1/':'1-2/');
 if(st.ref==='anime'){
  const row=node('div','');row.className='refs';
  for(let i=1;i<=3;i++){const a=node('button',''),im=node('img','');a.type='button';const angle=i===1?0:i===2?315:female?90:270;a.onclick=()=>{st.yaw=angle;st.pitch=0;sync();drawSoon();};im.alt=['정면에 가까운 얼굴','사선 얼굴','측면 얼굴'][i-1];im.referrerPolicy='no-referrer';im.onerror=()=>{im.hidden=true;a.title='외부 그림을 불러올 수 없습니다. 아래 원본 링크에서도 확인할 수 있습니다.';};im.src='https://frieren-anime.jp/wp-content/uploads/2023/08/chara'+(female?'1':'4')+'_face'+i+'.jpg';a.append(im,node('span',['정면','사선','측면'][i-1]));row.append(a);}
  host.append(row,node('p',(female?'프리렌':'힘멜')+' · 정면에 가까운 컷, 사선, 측면. 그림을 누르면 두 관찰창이 그 방향으로 회전합니다.'),safeLink('제작위원회 원본 열기',official));
 }else if(st.ref==='photo'){
  const doc='https://www.indeedmodels.com/system/files/models/'+(female?'susanna-giaroli/polaroidcard/susannagiaroli-polas_1.pdf':'giovanni/polaroidcard/giovanni-polas_3.pdf');
  const frame=node('iframe','');frame.className='refdoc';frame.title='성인 모델 동일 촬영 시트';frame.src=doc+'#page=1&view=FitH';host.append(node('p',(female?'수산나 자롤리':'조반니')+' · 같은 촬영의 얼굴 정면과 옆얼굴, 비스듬한 포즈를 함께 봅니다.'),safeLink('모델 에이전시의 사진 원본',doc),frame);
 }else{
  const input=node('input','');input.type='file';input.accept='image/*';input.setAttribute('aria-label','이 기기의 참고 그림');const img=node('img','');img.style.maxWidth='100%';img.alt='선택한 참고 그림';img.hidden=!localURL;if(localURL)img.src=localURL;
  input.onchange=()=>{if(!input.files.length)return;if(localURL)URL.revokeObjectURL(localURL);localURL=URL.createObjectURL(input.files[0]);img.src=localURL;img.hidden=false;};host.append(input,img);
 }
}
for(const r of records34.filter(r=>r.url)){const a=node('article','');a.append(node('h3',r.title),node('strong',r.line),node('p',r.unit),node('p',r.detail),safeLink('원전 열기',r.url));el('sources').append(a);}
for(const id of ['before','after']){
 const c=el(id);c.onpointerdown=e=>{if(e.button!==0||drag)return;drag={id:e.pointerId,c,x:e.clientX,y:e.clientY,yaw:st.yaw,pitch:st.pitch};c.setPointerCapture(e.pointerId);};
 c.onpointermove=e=>{if(drag?.c!==c||drag.id!==e.pointerId)return;const w=c.clientWidth;st.yaw=(drag.yaw+360*(e.clientX-drag.x)/w+720)%360;st.pitch=(drag.pitch+360*(e.clientY-drag.y)/w+720)%360;sync();drawSoon();};
 c.onpointerup=c.onpointercancel=c.onlostpointercapture=e=>{if(drag?.id===e.pointerId){drag=null;drawSoon();}};
 c.onkeydown=e=>{const p={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,-5],ArrowDown:[0,5]}[e.key];if(p){e.preventDefault();st.yaw=(st.yaw+p[0]+360)%360;st.pitch=(st.pitch+p[1]+360)%360;sync();drawSoon();}};
 c.addEventListener('wheel',e=>{e.preventDefault();const rect=c.getBoundingClientRect(),old=st.zoom;st.zoom=Math.max(.5,Math.min(6,old*Math.exp(-e.deltaY*(e.deltaMode===1?.03:.0018))));const f=st.zoom/old;
 st.offset=[(e.clientX-rect.left)/rect.width-.5,(e.clientY-rect.top)/rect.height-.5].map((v,i)=>v-(v-st.offset[i])*f);drawSoon();},{passive:false});
}
function paint(c,r){c.width=r.width;c.height=r.height;c.getContext('2d').putImageData(new ImageData(r.data,r.width,r.height),0,0);}
function drawSoon(){if(ready&&!renderPending)renderPending=requestAnimationFrame(()=>{renderPending=0;draw();});}
function draw(){
 const s={...DEFAULTS,sex:st.sex,heads:st.heads,designStyle:'manga',candidate:'B',resolution:Math.min(st.size,128)};
 const tuning=st.mode==='face'?{}:st.tuning,key=JSON.stringify([st.sex,st.heads,st.type,tuning]);
 if(key!==restKey){prior=morphForm(s,{},tuning);base=form34(s,st.type,tuning);restKey=key;poseKey='';}
 const pose=st.mode==='face'?{}:raisedPose(st.arm,st.side,st.plane),time=st.mode==='face'?0:st.t;
 const pk=JSON.stringify([key,pose,time,st.axis,st.stim,st.support]);
 if(pk!==poseKey){const d=time?response34(time,st.axis,st.stim,tuning.volume||0,base.tissue34?.fall,st.support):{};
 const legacy={};for(const side of ['left','right']){const mass=1+.3*((tuning.volume||0)+(side==='left'?-1:1)*.3*(tuning.asym||0)),decay=4/mass,w=Math.sqrt(55/mass-decay*decay);
 legacy[side]=time>=2.2?0:4.7*(st.stim==='both'||st.stim===side?1:.12)*Math.exp(-decay*time)*Math.sin(w*time)/w;}
 scenes=[articulate(prior,pose,time?legacy:0).scene,pose34(base,pose,d).scene];poseKey=pk;}
 const cam=st.mode==='body'?commonFrame(...scenes,st.yaw,st.pitch):st.mode==='chest'?chestCamera(base):{};
 const size=drag||tick?Math.min(st.size,96):st.size;
 scenes.forEach((scene,i)=>paint(el(i?'after':'before'),portraitPixels({...s,resolution:Math.min(size,128)},{sceneOverride:{...scene,...cam},portrait:st.mode==='face'?'face':false,yaw:st.yaw,pitch:st.pitch,freeOrbit:true,studyResolution:size>128?size:undefined,cameraZoom:st.zoom,screenOffset:st.offset})));
 const nk=[st.sex,st.heads].join('/');if(st.mode==='face'&&nativeKey!==nk){nativeKey=nk;const host=el('trip');host.replaceChildren();for(const [n,scene] of [['33차',prior],['34차',base]]){host.append(node('span',n));for(const yaw of [0,45,90]){const c=node('canvas','');c.setAttribute('aria-label',n+' '+yaw+'도 48px');paint(c,portraitPixels({...s,resolution:48},{sceneOverride:scene,portrait:'face',yaw}));host.append(c);}}}
 el('status').textContent=st.heads+'등신 · 좌우 '+st.yaw.toFixed(1)+'° · 상하 '+st.pitch.toFixed(1)+'° · '+Math.round(st.zoom*100)+'% · '+size+'px';
 el('time').value=Math.round(st.t*1000);el('timeOut').value=st.t.toFixed(2)+'초';
}
function chestCamera(s){const sh=s.joints.right.shoulder,hp=s.joints.right.hip;return {frame:Math.abs(sh[0])*2.65,cameraCenter:[0,.78*sh[1]+.22*hp[1],.26]};}
references();sync();loadRig().then(()=>{ready=true;drawSoon();}).catch(e=>el('status').textContent='관절 자료 오류 · '+e.message);

import {camera,foreground,extent,obj} from '../../pixel-lab/hull36.mjs';
import {size,defaultAngles,coverage,fitPair,compareSides,renderFit,restoreShot} from './partial-hull55.mjs';
import {sampleShots} from './occlusion-sample55.mjs';

const $=id=>document.getElementById(id);
if(window.frameElement?.id==='activePhotoEngine')$('researchHome').target='_parent';
const text=message=>{$('status').textContent=message;};
const names={left:'왼쪽',right:'오른쪽',both:'양쪽'};
const newDb='bookfriend-photo-visibility55',oldDb='bookfriend-photo-model';
let shots=Array(defaultAngles.length).fill(null),slot=0,fit={},serial=0,head,pointer=null,legacyId=null;
function openDb(name){
  return new Promise((resolve,reject)=>{
    const q=indexedDB.open(name);
    q.onupgradeneeded=()=>{
      if(name===oldDb){q.transaction.abort();return;}
      q.result.createObjectStore('versions',{keyPath:'id'});
    };
    q.onerror=()=>q.error?.name==='AbortError'&&name===oldDb?resolve(null):reject(q.error);
    q.onsuccess=()=>resolve(q.result);
  });
}
async function access(name,action,value){
  const db=await openDb(name);
  if(!db)return action==='getAllKeys'?[]:null;
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('versions',action==='add'?'readwrite':'readonly'),store=tx.objectStore('versions');
    const request=value===undefined?store[action]():store[action](value);let result;
    request.onsuccess=()=>{result=request.result;};
    tx.oncomplete=()=>{db.close();resolve(result);};tx.onabort=tx.onerror=()=>{db.close();reject(tx.error||request.error);};
  });
}
async function versions(select){
  const list=$('versions'),all=[];
  for(const [db,label] of [[newDb,'55차 가림'],[oldDb,'이전 사진']]){
    const keys=await access(db,'getAllKeys');
    for(const id of keys.reverse()){
      const time=new Date(Number(String(id).split('-')[0])).toLocaleString('ko-KR');
      all.push(new Option(label+' · '+time,JSON.stringify([db,id])));
    }
  }
  list.replaceChildren(...all);if(select)list.value=select;
  $('load').disabled=!list.options.length;
}
function paint(canvas,im){
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,size,size);
  if(im)ctx.putImageData(im,0,0);
}
function redraw(){
  const s=shots[slot],src=$('source');paint(src,s?new ImageData(new Uint8ClampedArray(s.rgba),size,size):null);
  const fields=['all','observed'],numbers=[];
  if(s){
    const c=src.getContext('2d'),bits=coverage(s),rows=extent(s.mask);
    c.fillStyle='#d52178';
    for(let y=0;y<size;y++)if(rows[y])for(let k=0;k<2;k++)if(!(bits[y]&(1<<k)))c.fillRect(rows[y][k]-1,y,3,1);
  }
  for(const key of fields){
    const im=s&&renderFit(fit[key]?.mesh,s);
    paint($(key),im);
    if(im)numbers.push(compareSides(s,im));
  }
  $('export').disabled=!fit.observed?.mesh;
  const metric=$('metric');
  if(!s){metric.textContent='';return;}
  if(!s.visibility55.enabled){metric.textContent='이 사진 전체를 피팅과 채점에서 제외했습니다.';return;}
  if(numbers.length!==2){metric.textContent='두 외피가 준비되면 같은 가시 경계에서 거리를 비교합니다.';return;}
  const [a,b]=numbers;
  const fmt=x=>x===null?'측정 불가':x.toFixed(3)+'px';
  metric.textContent=(s.role==='check'||s.pitch!==0?'비교 전용 사진':'생성에 사용한 사진')+' · 가시 경계 '+b.count+'점, 가림 '+b.hidden+'점, 화면 끝 '+b.clipped+'점 · 평균 거리 '+fmt(a.error)+' → '+fmt(b.error);
}
function update(){
  const s=shots[slot],items=shots.map((x,i)=>new Option((i+1)+' · '+(x?x.yaw+'° / '+x.pitch+'°'+(x.visibility55.enabled?'':' · 제외'):'빈 사진'),i));
  $('slot').replaceChildren(...items);$('slot').value=String(slot);$('editor').disabled=!s;$('save').disabled=!shots.some(Boolean);
  if(s){
    $('enabled').checked=s.visibility55.enabled;$('role').value=s.role;
    for(const key of ['yaw','pitch'])$(key).value=s[key];
    for(const key of ['cx','cy','scale'])$(key).value=s.camera[key];
    const list=s.visibility55.bands.map((b,i)=>{
      const li=document.createElement('li'),button=document.createElement('button');button.type='button';
      li.append(names[b.side]+' '+b.first+'~'+b.last+'행 · ');button.textContent=b.active?'제외 중 · 다시 사용':'사용 중 · 다시 제외';
      button.onclick=()=>{s.visibility55.bands[i]={...b,active:!b.active};rebuild();};li.append(button);return li;
    });
    $('bands').replaceChildren(...list);
  }else $('bands').replaceChildren();
  redraw();
}
function rebuild(){
  fit=fitPair(shots);
  $('fitState').textContent=fit.observed.mesh?'가시 윤곽 외피 · '+(fit.observed.mesh.f.length/3).toLocaleString('ko-KR')+'개 삼각형':fit.observed.reason;
  const checks=shots.filter(s=>s?.visibility55.enabled&&(s.role==='check'||s.pitch!==0)),rows=[];
  if(fit.observed.mesh&&fit.all.mesh){
    for(const s of checks){
      const a=compareSides(s,renderFit(fit.all.mesh,s)),b=compareSides(s,renderFit(fit.observed.mesh,s));
      const line=document.createElement('li'),delta=b.error-a.error;
      line.textContent=s.yaw+'° / '+s.pitch+'° · '+(b.count?a.error.toFixed(3)+' → '+b.error.toFixed(3)+'px · '+(delta>1e-9?'악화':delta< -1e-9?'개선':'동일'):'보이는 경계 없음');rows.push(line);
    }
  }
  const summary=document.createElement('p');summary.textContent=rows.length?'이번 피팅에서 뺀 사진의 가시 경계 · 이전 열람 이력은 따로 검사하지 않습니다.':'현재 비교할 별도 사진·가시 외피가 없습니다.';
  const list=document.createElement('ul');list.append(...rows);$('heldScores').replaceChildren(summary,list);
  update();
}
$('slot').onchange=()=>{slot=+$('slot').value;$('file').value='';update();};
$('role').onchange=()=>{shots[slot].role=$('role').value;rebuild();};
$('enabled').onchange=()=>{shots[slot].visibility55.enabled=$('enabled').checked;rebuild();};
for(const key of ['yaw','pitch','cx','cy','scale'])$(key).onchange=()=>{
  const el=$(key),v=el.valueAsNumber;
  if(!el.checkValidity()||!Number.isFinite(v)){text('유효한 각도 또는 카메라 수치를 입력하세요.');update();return;}
  const s=shots[slot];if(key==='yaw'||key==='pitch')s[key]=v;else s.camera={...s.camera,[key]:v};rebuild();
};
$('add').onclick=()=>{
  const side=document.querySelector('input[name="side55"]:checked').value;
  const s=shots[slot],band={first:$('first').valueAsNumber,last:$('last').valueAsNumber,side,active:true};
  const next={...s.visibility55,bands:[...s.visibility55.bands,band]};
  try{coverage({...s,visibility55:next});s.visibility55=next;rebuild();text('선택한 경계를 외피 생성과 거리 비교에서 제외했습니다.');}catch(e){text(e.message);}
};
const rowAt=e=>Math.max(0,Math.min(size-1,Math.floor((e.clientY-$('source').getBoundingClientRect().top)*size/$('source').clientHeight)));
$('source').onpointerdown=e=>{
  if(!shots[slot]||e.button!==0)return;
  pointer={id:e.pointerId,row:rowAt(e)};$('source').setPointerCapture(e.pointerId);$('first').value=$('last').value=pointer.row;
};
$('source').onpointermove=e=>{
  if(pointer?.id!==e.pointerId)return;const y=rowAt(e);$('first').value=Math.min(y,pointer.row);$('last').value=Math.max(y,pointer.row);
};
$('source').onlostpointercapture=()=>{pointer=null;};
async function readImage(file){
  const image=await createImageBitmap(file);
  try{
    const cv=document.createElement('canvas');cv.width=cv.height=size;
    const ctx=cv.getContext('2d'),scale=size/Math.max(image.width,image.height);
    ctx.drawImage(image,0,0,1,1,0,0,1,1);const [r,g,b,a]=ctx.getImageData(0,0,1,1).data;
    ctx.clearRect(0,0,size,size);ctx.fillStyle='rgba('+[r,g,b,a/255].join(',')+')';ctx.fillRect(0,0,size,size);
    ctx.drawImage(image,(size-image.width*scale)/2,(size-image.height*scale)/2,image.width*scale,image.height*scale);
    return ctx.getImageData(0,0,size,size).data;
  }finally{image.close();}
}
$('file').onchange=async()=>{
  const file=$('file').files[0];if(!file)return;const rev=++serial,index=slot;
  try{
    const rgba=await readImage(file),mask=foreground(rgba,size,size,44),c=camera(mask);
    if(!c)throw Error('사진에서 단일 전경 외곽을 찾지 못했습니다.');
    if(rev!==serial)return;
    const prior=shots[index],angle=defaultAngles[index];
    shots[index]=restoreShot({rgba,mask,camera:c,yaw:prior?.yaw??angle[0],pitch:prior?.pitch??angle[1],role:prior?.role},index);
    $('file').value='';rebuild();text('사진을 읽고 이 사진의 가림 기록을 새로 시작했습니다.');
  }catch(e){if(rev===serial)text(e.message);}
};
$('example').onclick=async()=>{
  const rev=++serial,subject=$('subject').value;
  try{
    if(subject==='face'&&!head){const r=await fetch('../../pixel-lab/head36.json');if(!r.ok)throw Error('실측 두상 예시를 열 수 없습니다.');head=(await r.json()).meshes[0];}
    if(rev!==serial)return;
    shots=sampleShots(subject,head);slot=2;legacyId=null;rebuild();
    text((subject==='face'?'기존 실측 두상':'합성 흉부 외피')+'의 90° 사진에서 왼쪽 43~68행을 11px 가린 예시입니다. 해당 구간을 지정하고 별도 각도에서 비교하세요.');
  }catch(e){if(rev===serial)text(e.message);}
};
$('load').onclick=async()=>{
  if(!$('versions').value)return;const rev=++serial,[db,id]=JSON.parse($('versions').value);
  try{
    const row=await access(db,'get',id);if(rev!==serial)return;
    if(!row||!Array.isArray(row.shots))throw Error('보존판의 사진을 읽을 수 없습니다.');
    const next=defaultAngles.map((_,i)=>restoreShot(row.shots[i],i));if(!next.some(Boolean))throw Error('보존판에 사진이 없습니다.');
    shots=next;slot=Number.isInteger(row.pos)&&row.pos>=0&&row.pos<shots.length?row.pos:0;
    legacyId=db===oldDb?id:row.legacyId??null;$('subject').value=row.subject==='torso'?'torso':'face';rebuild();
    text(db===oldDb?'이전 판의 입력과 카메라를 읽었습니다. 가림을 지정해 55차 새 판에 저장할 수 있습니다.':'55차의 사진·구간·각도·제외 상태를 복원했습니다.');
  }catch(e){if(rev===serial)text(e.message);}
};
$('save').onclick=async()=>{
  const id=Date.now()+'-'+crypto.randomUUID(),entry={id,format:55,shots:structuredClone(shots),pos:slot,subject:$('subject').value,legacyId};
  $('save').disabled=true;
  try{await access(newDb,'add',entry);await versions(JSON.stringify([newDb,id]));text('이 기기에 55차 새 판을 저장했습니다.');}
  catch(e){text('저장하지 못했습니다. '+e.message);}finally{$('save').disabled=!shots.some(Boolean);}
};
$('export').onclick=()=>{
  if(!fit.observed.mesh)return;const link=document.createElement('a'),u=URL.createObjectURL(new Blob([obj(fit.observed.mesh)],{type:'text/plain'}));
  link.download='observed-hull55.obj';link.href=u;link.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
};
rebuild();versions().catch(e=>text('이 기기의 보존함을 읽을 수 없습니다. '+e.message));

import {SIZE as n,views,foreground,camera,extent,obj} from './hull36.mjs';
import {MODEL_VERSION} from './photo-ml44.mjs';
import {scanImage} from './scan-view36.mjs';
import {challengeAngles,makePair,assessPhotoPair,renderRegistered,exposureOf} from './photo-review50.mjs';

const $=id=>document.getElementById(id),training=Array(5).fill(null),held=Array(4).fill(null);
const angles=[...views.map(yaw=>[yaw,0]),...challengeAngles],inputs=[],challenges=[];
const fitFields=()=>[...inputs,...inputs.map(el=>$(el.id+'Group')),$('learned'),$('width'),$('depth'),$('demo')];
const keyStore='bookfriend-photo-review50-exposures';
let pair=null,settings=null,candidateId='',studyId='',report=null,head=null,isDemo=false,revision=0,writing=false,loading=0;
let seen;
try {seen=new Map(JSON.parse(localStorage.getItem(keyStore)||'[]'));} catch {seen=null;}
const msg=s=>$('state').textContent=s;
const hash=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('');
const bytes=value=>new TextEncoder().encode(JSON.stringify(value));
function noteExposure(s,trainingSource=false){
  if(!seen)return false;
  try{
    // 다른 탭에서 먼저 본 원본도 평가 직전에 다시 읽는다.
    const latest=new Map(JSON.parse(localStorage.getItem(keyStore)||'[]'));
    for(const [k,v] of latest)seen.set(k,v);
    for(const key of [s.key,s.groupKey].filter(Boolean)){
      if(trainingSource||!seen.has(key))seen.set(key,trainingSource?'training':exposureOf(candidateId,s));
    }
    localStorage.setItem(keyStore,JSON.stringify([...seen]));
    return true;
  }catch{seen=null;return false;}
}
function cleanDecision(){
  report=null;$('scores').replaceChildren();$('decision').textContent='';
  $('approve').disabled=$('decline').disabled=true;
}
function clearLock(){
  revision++;pair=null;candidateId='';held.fill(null);cleanDecision();$('heldPanel').disabled=true;
  $('saveBase').disabled=$('export').disabled=$('edit').disabled=true;$('freeze').disabled=false;
  for(const el of fitFields())el.disabled=false;
  for(const el of challenges)el.value='';draw();
}
function draw(){
  const i=+$('angle').value||0,[yaw,pitch]=angles[i],shot=i<5?training[i]:held[i-5];
  for(const [key,mesh] of [['base',pair?.baseline],['proposed',pair?.candidate],['original',null]]){
    const ctx=$(key).getContext('2d');ctx.clearRect(0,0,n,n);
    if(key==='original'){if(shot)ctx.putImageData(new ImageData(new Uint8ClampedArray(shot.rgba),n,n),0,0);}
    else if(mesh){
      ctx.putImageData(renderRegistered(mesh,{yaw,pitch,camera:shot?.camera||{cx:n/2,cy:n/2,scale:.797*n}}),0,0);
    }
  }
}
async function readImage(file){
  const bmp=await createImageBitmap(file);
  try{
    const cv=document.createElement('canvas');cv.width=cv.height=n;const c=cv.getContext('2d'),f=n/Math.max(bmp.width,bmp.height);
    c.drawImage(bmp,0,0,1,1,0,0,1,1);const [r,g,b,a]=c.getImageData(0,0,1,1).data;
    c.clearRect(0,0,n,n);c.fillStyle='rgba('+[r,g,b,a/255].join(',')+')';c.fillRect(0,0,n,n);
    c.drawImage(bmp,(n-bmp.width*f)/2,(n-bmp.height*f)/2,bmp.width*f,bmp.height*f);
    return c.getImageData(0,0,n,n).data;
  }finally{bmp.close();}
}
async function shot(rgba,angle,calibrated,visible,group){
  const mask=foreground(rgba,n,n,44),c=calibrated?{cx:n/2,cy:n/2,scale:.797*n}:camera(mask);
  if(!c)throw Error('전경이 없습니다. 투명 또는 균일한 배경의 얼굴 사진을 여세요.');
  return {yaw:angle[0],pitch:angle[1],rgba,mask,rows:extent(mask),camera:c,visible,key:await hash(rgba),group};
}
function observed(){
  const v=[$('top').valueAsNumber,$('bottom').valueAsNumber];
  if(!v.every(Number.isInteger)||v[0]<0||v[1]>=n||v[0]>v[1])throw Error('가시 행을 0~127 안에서 순서대로 입력하세요.');
  return v;
}
angles.forEach((a,i)=>{
  const testing=i>=5,slot=testing?i-5:i,label=document.createElement('label'),input=document.createElement('input');
  const desc=a[0]+'° / '+a[1]+'°';$('angle').add(new Option(desc,String(i)));label.textContent=desc+' ';
  input.type='file';input.accept='image/png,image/jpeg,image/webp';input.id=(testing?'test':'fit')+slot;
  const origin=document.createElement('input');
  origin.type='number';origin.min='1';origin.max='9999';origin.placeholder='번호';origin.id=input.id+'Group';
  origin.setAttribute('aria-label',desc+' 원본 촬영 번호');
  label.append(origin,input);$(testing?'holdouts':'training').append(label);(testing?challenges:inputs).push(input);
  origin.oninput=()=>{if(input.value){input.value='';(testing?held:training)[slot]=null;cleanDecision();draw();}};
  let token=0;input.onchange=async()=>{
    const serial=++token,rev=revision,file=input.files[0];if(!file)return;
    try{
      loading++;if(testing)cleanDecision();
      const number=origin.valueAsNumber;
      if(!Number.isInteger(number)||number<1||number>9999)throw Error('원본 촬영 번호 1~9999를 먼저 입력한 뒤 사진을 다시 여세요.');
      const range=testing?observed():[0,127],calibrated=$('calibration').value==='fixed',s=await shot(await readImage(file),a,calibrated,range,'photo-'+number);
      if(rev!==revision||serial!==token)return;
      if(testing){if(!pair)return;s.groupKey=studyId+':'+s.group;noteExposure(s);held[slot]=s;cleanDecision();}
      else{training[slot]=s;noteExposure(s,true);isDemo=false;}
      $('angle').value=String(i);draw();msg((testing?'검증 원본':'생성 입력')+' '+desc+'를 읽었습니다.');
    }catch(e){if(serial===token&&rev===revision){input.value='';(testing?held:training)[slot]=null;cleanDecision();draw();}msg(e.message);}finally{loading--;}
  };
});
$('angle').onchange=draw;$('edit').onclick=()=>{clearLock();msg('기준 설정을 바꿀 수 있습니다. 다른 후보에서 본 원본은 독립 검증에서 제외합니다.');};
$('demo').onclick=async()=>{
  const rev=++revision;loading++;
  try{
    if(!head){const response=await fetch('head36.json');if(!response.ok)throw Error('실측 두상을 읽지 못했습니다.');head=(await response.json()).meshes[0];}
    const group=await Promise.all(angles.slice(0,5).map(a=>shot(scanImage(head,...a,n).data,a,true,[0,127],'scan-'+a.join('/'))));
    if(rev!==revision)return;training.splice(0,5,...group);isDemo=true;inputs.forEach(e=>e.value='');$('angle').value='0';draw();msg('실측 두상 수평 입력 5장 준비됨. 별도 원본은 아직 열지 않았습니다.');
  }catch(e){msg(e.message);}finally{loading--;}
};
$('freeze').onclick=async()=>{
  if(loading||pair)return msg('입력 사진 읽기를 마친 뒤 후보를 고정하세요.');
  const percent=k=>$(k).valueAsNumber/100;
  const config={learned:$('learned').checked,width:percent('width'),depth:percent('depth')};
  if(![config.width,config.depth].every(x=>Number.isFinite(x)&&Math.abs(x)<=1))return msg('아래턱 조절값은 −100부터 100까지입니다.');
  const rev=++revision;$('freeze').disabled=true;
  for(const el of fitFields())el.disabled=true;
  try{
    const next=makePair(training,config);if(!next)throw Error('다섯 방향의 입력이 모두 필요합니다.');
    const id=await hash(bytes([MODEL_VERSION,training.map(s=>[s.key,s.yaw,s.camera]),config]));
    const family=await hash(bytes(training.map(s=>s.key)));
    if(rev!==revision)return;settings=config;pair=next;candidateId=id;studyId=family;
    for(const s of training){s.groupKey=studyId+':'+s.group;noteExposure(s,true);}cleanDecision();
    for(const el of [...fitFields(),$('freeze')])el.disabled=true;
    $('edit').disabled=$('heldPanel').disabled=$('saveBase').disabled=$('export').disabled=false;
    $('demoHeld').disabled=!isDemo;draw();msg('생성한 두 메시를 고정했습니다. 검증 사진은 두 메시를 바꾸지 않습니다.');
  }catch(e){clearLock();msg(e.message);}
};
$('demoHeld').onclick=async()=>{
  if(!pair||!isDemo)return;const rev=revision;loading++;
  try{const bounds=observed(),group=await Promise.all(challengeAngles.map(a=>shot(scanImage(head,...a,n).data,a,true,bounds,'scan-'+a.join('/'))));
    if(rev!==revision)return;for(const s of group){s.groupKey=studyId+':'+s.group;noteExposure(s);}
    held.splice(0,4,...group);cleanDecision();$('angle').value='5';draw();msg('같은 실측 두상의 생성에 쓰지 않은 네 원본을 열었습니다.');
  }catch(e){msg(e.message);}finally{loading--;}
};
function evaluate(){
  const result=assessPhotoPair(pair,training,held,{seen:seen||new Map(),candidateId});
  if(!seen){result.decision='hold';result.reasons.push('이 기기에서 원본 재사용 기록을 확인할 수 없음');}
  return result;
}
function show(result){
  const fmt=x=>Number.isFinite(x)?x.toFixed(3):'—';
  $('scores').replaceChildren(...result.views.map(v=>{
    const tr=document.createElement('tr');
    const values=[(v.role==='input'?'생성':'별도')+' '+v.yaw+'° / '+v.pitch+'°',v.before?.targetRows??'—',
      fmt(v.before?.error)+' → '+fmt(v.after?.error),fmt(v.before?.iou)+' → '+fmt(v.after?.iou),v.reasons.join(' · ')||(v.change>1e-9||v.iouChange< -1e-9?'악화':v.change< -1e-9?'거리 개선':'유지')];
    for(const x of values){const td=document.createElement('td');td.textContent=x;tr.append(td);}return tr;
  }));
  $('decision').textContent=({regressed:'후보 보류',hold:'판정 보류',review:'사람의 그림 검토 가능'})[result.decision]+' · '+(result.reasons.join(' · ')||'자동 적용되지 않았습니다.');
  $('approve').disabled=result.decision!=='review';$('decline').disabled=false;
}
$('measure').onclick=()=>{if(loading||!pair)return;for(const s of held)if(s)noteExposure(s);report=evaluate();show(report);};
$('decline').onclick=()=>{cleanDecision();$('decision').textContent='사람이 보류했습니다. 기존 외피를 사용할 수 있습니다.';};
function persist(key,value){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open('bookfriend-photo-model',1);req.onupgradeneeded=()=>req.result.createObjectStore('versions',{keyPath:'id'});
    req.onerror=()=>reject(req.error);req.onsuccess=()=>{
      const db=req.result,tx=db.transaction('versions','readwrite');tx.objectStore('versions').add(value);
      tx.oncomplete=()=>{db.close();resolve(key);};tx.onabort=tx.onerror=()=>{db.close();reject(tx.error);};
    };
  });
}
async function choose(useCandidate){
  if(writing||!pair||loading)return;
  if(useCandidate){
    if(!report||report.decision!=='review')return;
    for(const s of held)if(s)noteExposure(s);
    report=evaluate();show(report);if(report.decision!=='review')return;
  }
  const chosen=candidateId,id=Date.now()+'-'+crypto.randomUUID(),tuning={jaw:useCandidate?[settings.width,settings.depth]:[0,0],cheek:[0,0],nose:[0,0],crown:[0,0]};
  const entry={id,shots:structuredClone(training),tuning,pos:0,shapeModel:useCandidate&&settings.learned?MODEL_VERSION:null,
    review50:{candidateId:chosen,mode:useCandidate?'human-selected':'baseline',decision:report?.decision||'unmeasured',views:report?.views||[]}};
  writing=true;$('edit').disabled=true;
  try{await persist(id,entry);localStorage.setItem('bookfriend-face-fit36',id);localStorage.setItem('bookfriend-face-enabled36','1');
    if(typeof BroadcastChannel!=='undefined'){const c=new BroadcastChannel('bookfriend-photo-model36');c.postMessage({kind:'apply',id});c.close();}
    msg((useCandidate?'사용자가 확인한 후보':'기존 외피')+'를 이 기기의 조형에 연결했습니다.');
  }catch(err){msg('이 기기 보존·선택 실패 · '+err.message);}finally{writing=false;$('edit').disabled=false;}
}
$('saveBase').onclick=()=>choose(false);$('approve').onclick=()=>choose(true);
$('export').onclick=()=>{
  if(!pair)return;const url=URL.createObjectURL(new Blob([obj(pair.candidate)],{type:'text/plain'})),a=document.createElement('a');
  a.href=url;a.download='face-candidate50.obj';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
draw();msg('사진 다섯 장을 선택하거나 실측 예시를 준비하세요.');

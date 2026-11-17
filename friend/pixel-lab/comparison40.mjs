import {launchRound39} from './comparison39.mjs?v=40-navigation';
import {pixelLoupe40} from './pixel-loupe40.mjs';
const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
const svg=(tag,attrs)=>{const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
const read=async file=>{const r=await fetch(file,{cache:'no-store'});if(!r.ok)throw Error('40차 실제 자료를 읽지 못했습니다: '+file);return r.json();};
const wording=text=>String(text).replace(/38·39차|38\/39차|38차|39차/g,v=>({'38·39차':'39·40차','38/39차':'39/40차','38차':'39차','39차':'40차'}[v]));
const lines=v=>!v?.length?[]:typeof v[0][0]==='number'?[v]:v;
const pointsOf=eye=>eye?['upper','lower','brow'].flatMap(k=>eye[k]||[]):[];

// 가려져 끊긴 픽셀 구간은 잇지 않는다. 원전의 드문 표식은 점으로 표시한다.
function eyeLine(parent,ps,color,observed=false){let run=[];const finish=()=>{if(run.length>1)parent.append(svg('polyline',{points:run.map(p=>p.join(',')).join(' '),fill:'none',stroke:color,'stroke-width':.65}));run=[];};for(const p of ps||[]){if(run.length&&Math.abs(p[0]-run.at(-1)[0])>1.05)finish();run.push(p);if(observed)parent.append(svg('circle',{cx:p[0],cy:p[1],r:.85,fill:color}));}finish();}
function poly(parent,sets,color,dash=''){for(const ps of lines(sets))parent.append(svg('polyline',{points:ps.map(p=>p.join(',')).join(' '),fill:'none',stroke:color,'stroke-width':.9,'stroke-dasharray':dash}));}
function bounds(ps,pad=6){if(!ps.length)return null;const xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]),left=Math.max(0,Math.floor(Math.min(...xs)-pad)),top=Math.max(0,Math.floor(Math.min(...ys)-pad));return [left,top,Math.max(12,Math.ceil(Math.max(...xs)-left+pad)),Math.max(12,Math.ceil(Math.max(...ys)-top+pad))];}
function lowest(sets){const ps=lines(sets).flat();return ps.length?ps.reduce((a,b)=>b[1]>a[1]?b:a):null;}

export async function launchRound40(input){
  let eye40,chest40,eyeData,chestData,loupe,focus='all',context;
  const eyeView=({id,cell})=>eyeData?.views?.find(v=>v.id===id&&v.imageNumber===({front:1,oblique2:2,side:3,oblique4:4}[cell]||1));
  const extension={round:40,label:wording,
    mount({host}){
      host.innerHTML=wording(host.innerHTML);host.dataset.round='40';document.title='39·40차 눈과 가시 경계 비교 · 책방 친구';document.querySelector('main>h1').textContent='눈의 경계와 가림, 밑 경계를 같은 조건에서';
      document.querySelector('main>p').textContent='39차와 40차를 같은 카메라·조명·해상도로 비교합니다. 원전 관측 표식과 실제로 가시 판정된 눈·눈꺼풀·눈썹을 구별합니다.';
      const history=host.lastElementChild;history.replaceChildren(document.createTextNode('각도·회전·해상도·국소 피부 조작은 기존 공통 관찰창을 사용합니다. '));const previous=node('a','39차 보존 비교로 돌아가기');previous.href='contour36.html?round=39&case=F02';history.append(previous);
      const bar=node('div');bar.id='sourceFocus40';bar.className='controls38';$('overlay38').before(bar);for(const [key,label]of [['all','원본 전체'],['left','화면 왼눈'],['right','화면 오른눈'],['near','가까운 눈'],['far','먼 눈'],['bottom','표시된 선의 최저점']]){const b=node('button',label);b.type='button';b.dataset.focus=key;b.onclick=()=>{focus=key;if(context)source(context);};bar.append(b);}
      const loupeHost=node('section');loupeHost.id='pixelLoupe40';loupeHost.style.cssText='background:white;border:1px solid #ccd1c8;border-radius:8px;padding:14px;margin:16px 0';$('comparisonState38').before(loupeHost);loupe=pixelLoupe40({before:$('priorOrbit38'),after:$('nextOrbit38'),host:loupeHost});
      $('overlay38').style.imageRendering='pixelated';
    },
    async prepare(){const a=await Promise.all([import('./eye40.mjs'),import('./chest40.mjs'),read('face-eval40.json'),read('chest-eval40.json')]);eye40=a[0].eye40;chest40=a[1].chest40;eyeData=a[2];chestData=a[3];if(typeof eye40!=='function'||typeof chest40!=='function'||!eyeData.views?.length||!chestData.paper)throw Error('40차 모델 또는 실제 검증 자료가 비어 있습니다.');for(const id of ['F02','M01'])for(const n of [1,2,3,4]){const v=eyeData.views.find(v=>v.id===id&&v.imageNumber===n);if(!v?.sourceUrl||!v.sourceEyes||!v.visible39||!v.visible40)throw Error(id+' 원화'+n+' 눈 자료가 아직 없습니다.');}},
    pair({id,scene39,ref}){return {next:id==='W'?chest40(scene39,ref):eye40(scene39,id)};},
    angle(c){if(c.id!=='W'&&c.cell==='front')return {yaw:0,pitch:0};if(c.id!=='W'&&c.cell==='side')return {yaw:-90,pitch:0};if(c.id==='W'){const v=chestData?.paper?.[c.cell];return v?{yaw:v.yaw,pitch:v.pitch||0}:null;}const v=eyeView(c);return v?.camera?{yaw:v.camera.yaw,pitch:v.camera.pitch}:null;},
    source,
    frame(c){context=c;$('priorTag38').textContent='· 39차 보존 모델';$('priorOrbit38').dataset.version='39';$('nextOrbit38').dataset.version='40';$('comparisonState38').textContent=(c.id==='W'?'도판 가슴':c.id==='F02'?'페른':'힘멜')+' · 39/40차 동일 카메라·조명·화소 크기. 원전 고정 정합과 자유 회전 구도는 구별합니다.';$('evidence39').textContent=c.id==='W'?'측면 최저점과 가시 밑 경계를 원본 위에서 확인합니다. 원본이 없는 밑면은 국소 피부의 구조 관찰이며 모사 통과가 아닙니다.':'눈 폭·경사·윗/아랫눈꺼풀·눈썹 사이의 관계를 관찰합니다. 원화에서 가려진 눈을 임의로 복원한 표식으로 채우지 않습니다.';loupe?.refresh();},
    ready({host}){$('load38').textContent='실제 40차 모델과 관측·가시 자료를 읽었습니다. 39차는 같은 조건의 보존 기준입니다.';host.dataset.round='40';}
  };
  function source(c){
    context=c;const plate=$('overlay38');plate.replaceChildren();let size=[248,248],imageUrl,record,sourceSets,priorSets,nextSets;
    if(c.id==='W'){record=chestData.paper[c.cell];if(!record)throw Error('40차 '+c.cell+' 밑 경계 자료 없음');size=c.ref.paper[c.cell].size;imageUrl='wallner-fig1-crop35.webp';sourceSets=c.ref.paper[c.cell].lines;priorSets=record.before.lines;nextSets=record.after.lines;}
    else{record=eyeView(c);if(!record)throw Error('선택한 눈 원화 자료 없음');imageUrl=record.sourceUrl;}
    let box=[0,0,...size];const face=c.id!=='W';for(const b of $('sourceFocus40').children){const key=b.dataset.focus;b.hidden=face?key==='bottom':['left','right','near','far'].includes(key);b.disabled=face&&(key==='near'||key==='far')&&record[key==='near'?'nearEyeIndex':'farEyeIndex']===null;}
    if(face){const index=focus==='near'?record.nearEyeIndex:focus==='far'?record.farEyeIndex:focus==='left'?0:focus==='right'?1:null;if(index!==null&&index!==undefined){const crop=bounds(pointsOf(record.sourceEyes[index]),8);if(crop)box=crop;}else if(focus!=='all')focus='all';}
    else if(focus==='bottom'){const p=lowest(sourceSets);if(p)box=[Math.max(0,p[0]-22),Math.max(0,p[1]-18),44,36];}
    for(const b of $('sourceFocus40').children)b.setAttribute('aria-pressed',String(b.dataset.focus===focus));plate.setAttribute('viewBox',box.join(' '));
    if($('photo38').checked){let im;if(face)im=svg('image',{href:imageUrl,width:248,height:248});else{const [x,y]=c.ref.paper[c.cell].box;im=svg('image',{href:imageUrl,x:-x,y:-y,width:Math.round(2007*725/1280),height:1143,preserveAspectRatio:'none'});}im.setAttribute('opacity',+$('opacity38').value/100);plate.append(im);}
    for(const [toggle,color,sets]of [['trace38','#007b8c',face?record.sourceEyes:sourceSets],['prior38','#79549b',face?record.visible39:priorSets],['next38','#b34419',face?record.visible40:nextSets]])if($(toggle).checked){const g=svg('g',{'data-layer':toggle});if(face){sets.forEach((eye,i)=>{if(!eye)return;const group=svg('g',{'data-eye':i,'data-depth':i===record.nearEyeIndex?'near':i===record.farEyeIndex?'far':'unspecified'});for(const key of ['upper','lower','brow'])eyeLine(group,eye[key],color,toggle==='trace38');g.append(group);});}else{poly(g,sets,color,toggle==='prior38'?'3 2':'');const p=lowest(sets);if(p)g.append(svg('circle',{cx:p[0],cy:p[1],r:1.8,fill:'white',stroke:color,'stroke-width':.8}));}plate.append(g);}
    if(face){$('sourceInfo38').textContent='원화 '+record.imageNumber+' · '+(record.role||'관찰 자료')+' · '+(record.cameraRole||'등록된 공통 정합')+'. '+(record.nearEyeIndex===null?'이 원화의 좌우 눈 앞뒤 순서는 확정하지 않습니다. ':'가까운 눈: 화면 '+(record.nearEyeIndex===0?'왼쪽':'오른쪽')+' · 먼 눈: '+(record.farEyeIndex===null?'관측 대상 없음':record.farEyeIndex===0?'화면 왼쪽':'화면 오른쪽')+'. ')+'원전 관측 표식은 점, 모델 경계는 삼각형 가시 판정된 구간입니다. 가시 표본이 끊긴 구간은 잇지 않습니다. '+(record.omitted||'')+(record.partial?.some(Boolean)?' 일부 가린 눈이 있으므로 전체 눈 폭과 구분합니다.':'');$('credit38').href=eyeData.sources?.[c.id]?.source||c.record.source;}
    else{$('sourceInfo38').textContent=c.cell+' · 흰 원은 표시한 가시선 범위의 최저 표본입니다. 도판의 다른 부위나 가려진 선으로 연장하지 않습니다. 고정 카메라 비교이고 자유 회전은 별도입니다.';$('credit38').href='https://doi.org/10.1007/s00266-021-02753-y';}
  }
  return launchRound39(input,extension);
}

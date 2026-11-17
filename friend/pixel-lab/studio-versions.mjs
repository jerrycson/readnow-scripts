import {studioHistory,withHostedReleases} from './studio-history.mjs';
import {historicalModel} from './studio-archive-model.mjs';
const $=id=>document.getElementById(id), params=new URLSearchParams(location.search), sides=['a','b'];
let rows=[],selected={},picks={},nodes={};
const button=(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;return b;};
function changeUrl(){const u=new URL(location.href),data={type:'bookfriend:version-selection'};for(const k of sides){data[k]=selected[k]||'';data[k+'v']=picks[k]||'';for(const name of [k,k+'v'])if(data[name])u.searchParams.set(name,data[name]);else u.searchParams.delete(name);}history.replaceState(null,'',u);if(parent!==self)parent.postMessage(data,location.origin);}
function assetView(item){
  if(item.frozenRound||item.module)return historicalModel(item);
  if(item.kind==='source-link'&&item.url){const a=document.createElement('a');const u=new URL(item.url);if(u.protocol!=='https:')throw Error('원전 주소 확인 필요');a.href=u.href;a.target='_blank';a.rel='noreferrer';a.textContent=item.label+' · 원전 열기 ↗';return a;}
  const target=new URL(item.path,location.href);
  if(target.origin!==location.origin||!target.pathname.startsWith('/friend/'))throw Error('보존 경로를 확인할 수 없습니다.');
  if(/\.(?:png|jpe?g|webp|gif)$/i.test(target.pathname)){const img=new Image();img.alt=item.label;img.src=target;return img;}
  if(/\.html?$|\/$/i.test(target.pathname)){const f=document.createElement('iframe');f.title=item.label;f.src=target;return f;}
  if(target.pathname.endsWith('.json')){const p=document.createElement('pre');p.textContent='보존 기록 읽는 중';fetch(target).then(r=>{if(!r.ok)throw Error();return r.json();}).then(j=>p.textContent=JSON.stringify(j,null,2)).catch(()=>p.textContent='자료를 읽지 못했습니다.');return p;}
  const a=document.createElement('a');a.href=target;a.textContent=item.label+' · 보존 파일 열기 ↗';a.target='_blank';a.rel='noopener';return a;
}
function show(k){
  const node=nodes[k],r=rows.find(x=>x.id===selected[k]);if(!r)return;
  const query=s=>node.querySelector(s);query('h2').textContent=(k==='a'?'왼쪽':'오른쪽')+' · '+r.round+'차';
  query('.caption').textContent=r.label+(r.release?.at?' · '+new Date(r.release.at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'')+' · '+(r.description||'');
  const frozen=r.round>=1&&r.round<=33&&!r.models?.some(m=>m.frozenRound===r.round)?[{id:'frozen-'+r.round,label:r.round+'차 동결 모델',frozenRound:r.round,scope:'당시 기본값·렌더러'}]:[];
 const list=[...frozen,...(r.models||[]),...(r.live||[]),...(r.artifacts||[])].filter(t=>t.frozenRound||t.path||t.module||t.url);
  const variants=query('.variants');variants.replaceChildren();
  const current=list.find(x=>x.id===picks[k])||list[0];picks[k]=current?.id||'';
  for(const item of list){const b=button(item.label,()=>{picks[k]=item.id;show(k);changeUrl();});b.setAttribute('aria-pressed',String(item===current));variants.append(b);}
  const prev=query('.preview');prev.replaceChildren();if(current){try{prev.append(assetView(current));}catch(e){prev.textContent=e.message;}}else prev.textContent='이 회차의 실행 파일과 도판을 확인할 수 없습니다.';
  const foot=query('.limit');foot.textContent=((frozen.length||r.models?.some(m=>m.frozenRound))?['동결 모델은 당시 기본값으로 그리며 별도 촬영 도판과 실험 후보도 선택할 수 있습니다.']:(r.limits||[])).join(' ');
 if(r.release){const link=document.createElement('a');link.href='../research/hub/?rev='+r.release.id;link.target='_blank';link.rel='noopener';link.textContent=' 이 공개판의 연구 자료 '+r.release.cards+'개 보기 ↗';foot.append(link);}
 options(k);
}
function options(k){const node=nodes[k],q=node.querySelector('input').value.toLowerCase().trim(),box=node.querySelector('.editions');box.replaceChildren();
 for(const row of rows){if(q&&!(row.round+'차 '+row.label+' '+(row.description||'')+' '+row.id).toLowerCase().includes(q))continue;
 const b=button(row.round+'차 · '+row.label,()=>{selected[k]=row.id;picks[k]='';picker(k,false);show(k);changeUrl();});if(row.release)b.textContent+=' · 공개 '+row.release.id.slice(0,6);b.title=row.id;b.setAttribute('aria-pressed',String(selected[k]===row.id));box.append(b);}
 if(!box.children.length)box.textContent='이 조건에 맞는 판본이 없습니다.';
}
function picker(k,on){const n=nodes[k];n.querySelector('.picker').hidden=!on;n.querySelector('.pick').setAttribute('aria-expanded',String(on));if(on)n.querySelector('input').focus();}
for(const k of sides){const node=$('side').content.firstElementChild.cloneNode(true);nodes[k]=node;$('pair').append(node);
 node.querySelector('.pick').onclick=()=>picker(k,node.querySelector('.picker').hidden);node.querySelector('input').oninput=()=>options(k);
}
function defaults(){return [rows[0]?.id,rows.find(x=>x.round<rows[0]?.round)?.id||rows[0]?.id];}
function draw(){for(const k of sides)show(k);changeUrl();}
$('swap').onclick=()=>{[selected.a,selected.b]=[selected.b,selected.a];[picks.a,picks.b]=[picks.b,picks.a];draw();};
$('recent').onclick=()=>{[selected.a,selected.b]=defaults();picks={};draw();};
let hosted=[];try{const r=await fetch('../research/hub/releases.json',{cache:'no-store'});if(!r.ok)throw Error();hosted=(await r.json()).releases;}catch{$('source').textContent='내장 보존 목록';}
rows=(hosted.length?withHostedReleases(hosted):studioHistory).slice().sort((a,b)=>b.round-a.round||String(b.release?.at||'').localeCompare(String(a.release?.at||'')));
// 새 회차의 일지에 기록된 실제 모델만 연결한다. 판본별 과거 경로는 그대로 둔다.
await Promise.all(rows.filter(r=>r.release && !r.live?.length && r.round>=38).map(async r=>{
  const journal=new URL('round'+r.round+'.html',location.href);
  try{const res=await fetch(journal,{cache:'no-store'});if(!res.ok)return;
    const doc=new DOMParser().parseFromString(await res.text(),'text/html'),live=[];
    for(const a of doc.querySelectorAll('a[href]')){const path=a.getAttribute('href'),u=new URL(path,journal),c=u.searchParams.get('case');
      if(u.origin===location.origin&&u.pathname.endsWith('/pixel-lab/contour36.html')&&u.searchParams.get('round')===String(r.round)&&['F02','M01','W'].includes(c)&&!live.some(x=>x.id===c))live.push({id:c,label:a.textContent.trim(),path});}
    if(live.length){r.live=live;r.limits=['이 회차의 일지에 등록한 모델입니다. 원형 회차와 달라질 수 있습니다.'];}
  }catch{}
}));
sides.forEach((k,i)=>{selected[k]=rows.find(r=>r.id===params.get(k))?.id||defaults()[i];picks[k]=params.get(k+'v');});draw();
const mix=$('mix'),layers=$('layers'),choices=document.createElement('div');choices.id='mixChoice';mix.querySelector('header').after(choices);
function captureCandidates(k){
  const root=nodes[k].querySelector('.preview'),items=[];
  function visit(el){for(const n of el.querySelectorAll('canvas,img,iframe')){
    if(!n.getBoundingClientRect().width||getComputedStyle(n).visibility==='hidden')continue;
    if(n.tagName==='IFRAME'){try{if(n.contentDocument)visit(n.contentDocument);}catch{}continue;}
    const w=n.naturalWidth||n.width,h=n.naturalHeight||n.height;if(!w||!h)continue;
    const c=document.createElement('canvas');c.width=w;c.height=h;
    try{const ctx=c.getContext('2d');ctx.drawImage(n,0,0);const data=ctx.getImageData(0,0,w,h).data;if(!data.some((v,i)=>i%4===3&&v))continue;
     const label=n.getAttribute('aria-label')||n.getAttribute('alt')||n.closest('figure,article,section')?.querySelector('h2,h3,figcaption')?.textContent||'그림 '+(items.length+1);
     items.push({c,label:label.slice(0,35),w,h});}catch{}
  }}visit(root);return items;
}
$('overlay').onclick=()=>{const captures=sides.map(captureCandidates),indices=[0,0];choices.replaceChildren();layers.replaceChildren();
 function repaint(){layers.replaceChildren();for(let i=0;i<2;i++){const it=captures[i][indices[i]];if(it){layers.append(it.c);it.c.style.opacity=i?Number($('alpha').value)/100:1;}}$('opacity').value=$('alpha').value+'%';}
 for(const [i,options] of captures.entries()){const panel=document.createElement('div');panel.className='mix-choice';panel.append(i?'오른쪽 ':'왼쪽 ');
 for(const [j,im] of options.entries()){const b=button(im.label+' '+im.w+'px',()=>{indices[i]=j;for(const sibling of panel.querySelectorAll('button'))sibling.setAttribute('aria-pressed',String(sibling===b));repaint();});b.setAttribute('aria-pressed',String(!j));panel.append(b);}choices.append(panel);}
 $('mixNote').textContent=captures.every(x=>x.length)?'양쪽의 모델과 구도를 고른 뒤 비교하세요. 화면 중심에 맞춰 같은 칸에 표시합니다.':'한쪽에 캡처할 수 있는 모델이 없습니다. 회전 모델이나 보존 그림을 열고 다시 시도하세요.';
 $('alpha').oninput=repaint;repaint();mix.showModal();
};$('endMix').onclick=()=>mix.close();
let camera={yaw:0,pitch:0,settings:{}};
function matched(){for(const el of document.querySelectorAll('.archived-model'))el.dispatchEvent(new CustomEvent('bookfriend:camera',{detail:camera}));}
for(const [name,yaw,pitch] of [['정면',0,0],['앞 45°',45,0],['측면',90,0],['뒤 45°',135,0],['뒤',180,0],['위 45°',0,45],['아래 45°',0,315]])$('angles').append(button(name,()=>{camera.yaw=yaw;camera.pitch=pitch;matched();}));
for(const [key,options] of [['sex',[['여성','female'],['남성','male']]],['heads',Array.from({length:7},(_,i)=>[(i+2)+'등신',i+2])],['resolution',[['48px',48],['96px',96]]]])for(const [name,value] of options){const b=button(name,()=>{camera.settings[key]=value;matched();for(const x of $('bodyParams').querySelectorAll('button'))if(x.dataset.axis===key)x.setAttribute('aria-pressed',String(x===b));});b.dataset.axis=key;$('bodyParams').append(b);}

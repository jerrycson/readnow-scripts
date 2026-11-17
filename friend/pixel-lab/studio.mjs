import {studioTools,studioGroups} from './studio-catalog.mjs';
import {latestPublished} from '../research/hub/published-state.mjs';
import {startStudioRecord} from './studio-recorder44.mjs';
const $=id=>document.getElementById(id);
const historyTool={id:'history',group:'compare',label:'모든 판본 비교',description:'두 회차를 독립적으로 선택해 당시 보존한 모델·결과 그림을 나란히 봅니다.',path:'studio-versions.html',keywords:['이전','역사','판본','버전','전체']};
const tools=[historyTool,...studioTools], frames=new Map(), targets=new Map();
const defaults=new Map([['latest-fern','최신 모델'],['history','판본 비교'],['sculpt','정밀 조형'],['photo-engine36','내 참고그림'],['world','환경 실험']]);
let current, favorites=[], onlyFav=false, edition, refreshing=false, toastTimer;
try{const saved=JSON.parse(localStorage.getItem('bookfriend-studio-favorites')||'[]');if(Array.isArray(saved))favorites=saved;}catch{}
function button(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;return b;}
function say(msg){$('feedback').textContent=msg;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('feedback').textContent='',3000);}
function shareState(){
  const u=new URL(location.href);
  if(parent!==self) parent.postMessage({type:'bookfriend:studio-state',search:u.search},location.origin);
}
function setState(id,extra={}){
  const u=new URL(location.href);u.searchParams.set('tool',id);
  for(const k of ['a','b','av','bv','case'])if(k in extra){if(extra[k])u.searchParams.set(k,extra[k]);else u.searchParams.delete(k);}
  history.replaceState(null,'',u);shareState();
}
function paintList(){
  const q=$('search').value.trim().toLocaleLowerCase(), list=$('tools');list.replaceChildren();let count=0;
  for(const group of studioGroups){
    const rows=tools.filter(t=>t.group===group.id&&(!onlyFav||favorites.includes(t.id))&&(!q||[t.label,t.description,...t.keywords].join(' ').toLocaleLowerCase().includes(q)));
    if(!rows.length)continue;const h=document.createElement('h3');h.className='group';h.textContent=group.label;list.append(h);
    for(const t of rows){const b=button(t.label,()=>open(t.id));b.setAttribute('aria-current',String(t.id===current));list.append(b);count++;}
  }
  $('count').textContent=count+'개';if(!count)list.textContent='일치하는 도구가 없습니다.';
  for(const b of $('quick').children)b.setAttribute('aria-current',String(b.dataset.id===current||(b.dataset.id==='latest-fern'&&['latest-himmel','latest-chest'].includes(current))));
  $('star').setAttribute('aria-pressed',String(favorites.includes(current)));$('star').textContent=favorites.includes(current)?'★ 저장됨':'☆ 저장';
}
function pathFor(t){
  const u=new URL(targets.get(t.case)||t.path,location.href), q=new URL(location.href).searchParams;
  if(t.id==='history')for(const k of ['a','b','av','bv'])if(q.has(k))u.searchParams.set(k,q.get(k));
  if(t.id==='sculpt'&&['F02','M01','W'].includes(q.get('case')))u.searchParams.set('case',q.get('case'));
  return u.href;
}
function signal(f,on){f.contentWindow?.postMessage({type:'bookfriend:studio-active',active:on},location.origin);}
const observeTool=startStudioRecord(()=>tools.find(t=>t.id===current));
function open(id){
  const t=tools.find(t=>t.id===id)||tools.find(t=>t.id==='latest-fern');current=t.id;setState(current);
  let f=frames.get(current);if(!f){f=document.createElement('iframe');f.title=t.label;f.src=pathFor(t);frames.set(current,f);$('stages').append(f);f.onload=()=>signal(f,!f.hidden);}
  for(const [key,other] of frames){other.hidden=key!==current;signal(other,!other.hidden);}
  $('title').textContent=(t.case&&edition?edition.round+'차 · ':'')+t.label;$('description').textContent=t.description;paintList();observeTool();
}
for(const [id,label] of defaults){const b=button(label,()=>open(id));b.dataset.id=id;$('quick').append(b);}
$('onlyFav').onclick=()=>{onlyFav=!onlyFav;$('onlyFav').setAttribute('aria-pressed',String(onlyFav));paintList();};
$('star').onclick=()=>{favorites=favorites.includes(current)?favorites.filter(k=>k!==current):[...favorites,current];try{localStorage.setItem('bookfriend-studio-favorites',JSON.stringify(favorites));}catch{say('이 기기에서 저장소를 사용할 수 없습니다.');}paintList();};
$('search').oninput=paintList;
function focusMode(on){document.body.classList.toggle('focus',on);$('focus').textContent=on?'도구 목록':'목록 접기';$('focus').setAttribute('aria-pressed',String(on));}
$('focus').onclick=()=>focusMode(!document.body.classList.contains('focus'));focusMode(matchMedia('(max-width:760px)').matches);
$('copy').onclick=async()=>{const u=new URL('../research/hub/',location.href);u.search=location.search;u.searchParams.set('lab','studio');try{await navigator.clipboard.writeText(u.href);say('현재 작업 링크를 복사했습니다.');}catch{window.prompt('현재 작업 링크',u.href);}};
window.addEventListener('message',e=>{if(e.origin!==location.origin)return;
  if(e.source===frames.get('history')?.contentWindow&&e.data?.type==='bookfriend:version-selection'&&current==='history'){
    const next={};for(const k of ['a','b','av','bv']) if(typeof e.data[k]==='string'&&e.data[k].length<150)next[k]=e.data[k];setState('history',next);
  }
  if(e.source===frames.get('sculpt')?.contentWindow&&current==='sculpt'&&e.data?.type==='bookfriend:sculpt-case'&&['F02','M01','W'].includes(e.data.case))setState('sculpt',{case:e.data.case});
});
async function refresh(){
  if(refreshing||document.hidden)return;refreshing=true;
  try{const r=await fetch('../research/hub/releases.json',{cache:'no-store'});if(!r.ok)throw Error();const row=latestPublished((await r.json()).releases);if(!row||row.id===edition?.id)return;
    const path='round'+row.round+'.html',res=await fetch(path,{cache:'no-store'});if(!res.ok)throw Error();
    const doc=new DOMParser().parseFromString(await res.text(),'text/html'), found=new Map();
    for(const a of doc.querySelectorAll('a[href]')){const u=new URL(a.getAttribute('href'),new URL(path,location.href));const c=u.searchParams.get('case');if(u.origin===location.origin&&u.pathname.endsWith('/pixel-lab/contour36.html')&&u.searchParams.get('round')===String(row.round)&&['F02','M01','W'].includes(c)&&!found.has(c))found.set(c,u.href);}
    if(found.size!==3)return;edition=row;
    for(const [c,url] of found){targets.set(c,url);const t=tools.find(t=>t.case===c),f=frames.get(t.id);if(f&&f.src!==url)f.src=url;}
    if(tools.find(t=>t.id===current)?.case)open(current);
  }catch{if(!edition)say('회차 목록을 다시 확인합니다. 보존 관찰창을 열었습니다.');}finally{refreshing=false;}
}
open(new URL(location.href).searchParams.get('tool'));refresh();document.addEventListener('visibilitychange',refresh);addEventListener('online',refresh);setInterval(refresh,15000);
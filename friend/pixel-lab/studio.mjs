import {isWorkbenchSubject} from './workbench-subjects50.mjs';
import {mountStudioPanes} from './studio-panes50.mjs';
import {studioTools,studioGroups} from './studio-catalog.mjs?ui=57';
import {latestPublished} from '../research/hub/published-state.mjs';
import {startStudioRecord} from './studio-recorder44.mjs?v=57-diagnostic';
import {mountCaseSync} from './studio-case-sync45.mjs';
const $=id=>document.getElementById(id);
const historyTool={id:'history',group:'compare',label:'모든 판본 비교',description:'두 회차를 독립적으로 선택해 당시 보존한 모델·결과 그림을 나란히 봅니다.',path:'studio-versions.html',keywords:['이전','역사','판본','버전','전체']};
const tools=[historyTool,...studioTools], frames=new Map(), targets=new Map();
const defaults=new Map([
  ['workbench','다중 시점 작업대'],['definition','고해상도 원형 · 픽셀판'],
  ['latest-fern','최신 페른'],['latest-himmel','최신 힘멜'],['latest-chest','최신 몸통'],
  ['transition57','57차 어깨 첫 움직임'],['knee57','57차 무릎 전환'],
  ['surface56','56차 어깨 표면'],['shoulder54','어깨·겨드랑이'],['hip54','골반·무릎'],['ground55','발 접지'],['all-around','전방위 교정'],['sculpt','부위·관절'],['bust-morph34','바스트 모핑'],
  ['photo-engine50','내 참고그림 · 다중 시점 검수'],['photo-occlusion55','가린 윤곽 편집'],['photo-engine36','내 참고그림 · 이전 작업대'],['world','환경'],['learning','학습 기록'],
  ['history','모든 판 비교'],['journal','최신 결과·과정'],['methods','모델링 기법'],['photo-research','사진 연구'],
  ['acceptance','기본형 완성 기준·결함'],['round-plan','회차별 계획']
]);
const studioRound=57;
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
  for(const k of ['a','b','av','bv','case','zone'])if(k in extra){if(extra[k])u.searchParams.set(k,extra[k]);else u.searchParams.delete(k);}
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
  for(const b of $('quick').querySelectorAll('button'))b.setAttribute('aria-current',String(b.dataset.id===current));
  $('star').setAttribute('aria-pressed',String(favorites.includes(current)));$('star').textContent=favorites.includes(current)?'★ 저장됨':'☆ 저장';
}
function pathFor(t){
  const u=new URL(t.id==='journal'&&edition?'round'+edition.round+'.html':targets.get(t.case)||t.path,location.href), q=new URL(location.href).searchParams;
  if(t.id==='sculpt'&&['chin','jaw','throat','mid','cheek','rib','breast','lower'].includes(q.get('zone')))u.searchParams.set('zone',q.get('zone'));
  if(t.id==='history')for(const k of ['a','b','av','bv'])if(q.has(k))u.searchParams.set(k,q.get(k));
  if(t.id==='workbench'&&isWorkbenchSubject(q.get('case')))u.searchParams.set('case',q.get('case'));
  if(t.id==='workbench'){
    const requestedRound=q.get('round');if(['50','51','52','53','54','55','56','57'].includes(requestedRound))u.searchParams.set('round',requestedRound);
    else if(edition?.round>=50&&edition.round<=studioRound)u.searchParams.set('round',edition.round);
    if(q.get('trial'))u.searchParams.set('trial',q.get('trial'));
  }
  if(['surface56','transition57','knee57'].includes(t.id)&&/^(female|male)-[2-8]$/.test(q.get('case')))u.searchParams.set('case',q.get('case'));
  if(['sculpt','all-around','definition'].includes(t.id)&&['F02','M01','W'].includes(q.get('case')))u.searchParams.set('case',q.get('case'));
  return u.href;
}
const workspace=mountStudioPanes({host:$('stages'),tools,urlFor:pathFor,onNotice:say});
function signal(f,on){f.contentWindow?.postMessage({type:'bookfriend:studio-active',active:on},location.origin);}
const observeTool=startStudioRecord(()=>tools.find(t=>t.id===current));
mountCaseSync(document.querySelector('.workhead + details'));
function routeFromChild(e){
  const a=e.target.closest?.('a[href]');if(!a||a.target==='_blank'||e.defaultPrevented||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
  const u=new URL(a.href);if(u.origin!==location.origin)return;
  const q=u.searchParams;
  const route={'/friend/research/modeling-methods/compare.html':'all-around','/friend/research/modeling-methods/':'methods','/friend/research/modeling-methods/index.html':'methods','/friend/research/photo-model/':'photo-research','/friend/research/studio-engine/':'learning','/friend/pixel-lab/photo-engine36.html':'photo-engine36'};
  let next=route[u.pathname];
  if(u.hash)return;
  if(u.pathname==='/friend/research/hub/'&&q.get('lab')==='studio')next=q.get('tool')||'latest-fern';
  if(u.pathname==='/friend/pixel-lab/round'+(edition?.round||studioRound)+'.html')next='journal';
  if(u.pathname==='/friend/pixel-lab/studio-sculpt.html'&&q.get('round')===String(edition?.round||studioRound))next='sculpt';
  if(!tools.some(t=>t.id===next))return;
  e.preventDefault();open(next,q.has('case')?{case:q.get('case'),zone:q.get('zone')}:undefined);
}
function open(id,context){
  const t=tools.find(t=>t.id===id)||tools.find(t=>t.id==='workbench');current=t.id;setState(current,context||(t.case?{case:t.case,zone:null}:{}));
  let f=frames.get(current);if(!f){f=document.createElement('iframe');f.title=t.label;f.src=pathFor(t);frames.set(current,f);workspace.main.append(f);f.onload=()=>{signal(f,!f.hidden);try{f.contentDocument?.addEventListener('click',routeFromChild);}catch{}};}
  else if(context&&['workbench','surface56','transition57','knee57','sculpt','all-around'].includes(id)&&f.src!==pathFor(t))f.src=pathFor(t);
  for(const [key,other] of frames){other.hidden=key!==current;signal(other,!other.hidden);}
  workspace.setPrimary(t,f);$('title').textContent=(t.case?(edition?.round||studioRound)+'차 · ':'')+t.label;$('description').textContent=t.description;paintList();observeTool();
}
for(const [id,label] of defaults){const b=button(label,()=>open(id));b.dataset.id=id;$('quick').append(b);}
$('onlyFav').onclick=()=>{onlyFav=!onlyFav;$('onlyFav').setAttribute('aria-pressed',String(onlyFav));paintList();};
$('star').onclick=()=>{favorites=favorites.includes(current)?favorites.filter(k=>k!==current):[...favorites,current];try{localStorage.setItem('bookfriend-studio-favorites',JSON.stringify(favorites));}catch{say('이 기기에서 저장소를 사용할 수 없습니다.');}paintList();};
$('search').oninput=paintList;
function focusMode(on){document.body.classList.toggle('focus',on);$('focus').textContent=on?'도구 목록':'목록 접기';$('focus').setAttribute('aria-pressed',String(on));}
$('focus').onclick=()=>focusMode(!document.body.classList.contains('focus'));focusMode(matchMedia('(max-width:760px)').matches);
$('copy').onclick=async()=>{const u=new URL('../research/hub/',location.href);u.search=location.search;u.searchParams.set('lab','studio');try{await navigator.clipboard.writeText(u.href);say('현재 작업 링크를 복사했습니다.');}catch{say('현재 작업 링크: '+u.href);}};
window.addEventListener('message',e=>{if(e.origin!==location.origin)return;
  if(['workbench','surface56','transition57','knee57'].includes(current)&&e.source===frames.get(current)?.contentWindow&&workspace.isMainVisible()&&!frames.get(current).hidden&&e.data?.type==='bookfriend:workbench-case'&&isWorkbenchSubject(e.data.id))setState(current,{case:e.data.id});
  if(e.source===frames.get('history')?.contentWindow&&e.data?.type==='bookfriend:version-selection'&&current==='history'){
    const next={};for(const k of ['a','b','av','bv']) if(typeof e.data[k]==='string'&&e.data[k].length<150)next[k]=e.data[k];setState('history',next);
  }
  if(e.source===frames.get('sculpt')?.contentWindow&&current==='sculpt'&&e.data?.type==='bookfriend:sculpt-zone'&&['chin','jaw','throat','mid','cheek','rib','breast','lower'].includes(e.data.zone)&&['F02','M01','W'].includes(e.data.case))setState('sculpt',{case:e.data.case,zone:e.data.zone});
  if(e.source===frames.get('sculpt')?.contentWindow&&current==='sculpt'&&e.data?.type==='bookfriend:sculpt-case'&&['F02','M01','W'].includes(e.data.case))setState('sculpt',{case:e.data.case});
});
async function refresh(){
  if(refreshing||document.hidden)return;refreshing=true;
  try{const r=await fetch('../research/hub/releases.json',{cache:'no-store'});if(!r.ok)throw Error();const row=latestPublished((await r.json()).releases);if(!row||row.id===edition?.id)return;
    const path='round'+row.round+'.html',res=await fetch(path,{cache:'no-store'});if(!res.ok)throw Error();
    const doc=new DOMParser().parseFromString(await res.text(),'text/html'), found=new Map();
    for(const a of doc.querySelectorAll('a[href]')){const u=new URL(a.getAttribute('href'),new URL(path,location.href));const c=u.searchParams.get('case');if(u.origin===location.origin&&u.pathname.endsWith('/pixel-lab/contour36.html')&&u.searchParams.get('round')===String(row.round)&&['F02','M01','W'].includes(c)&&!found.has(c))found.set(c,u.href);}
    if(found.size!==3)return;
    if(edition&&row.round>studioRound&&!document.getElementById('newStudio')){const a=document.createElement('a');a.id='newStudio';a.textContent=row.round+'차 새 실험실 열기 ↗';a.href='../research/hub/?lab=studio&tool='+encodeURIComponent(current||'latest-fern');a.target='_blank';a.rel='noopener';$('quick').prepend(a);}
    edition=row;
    const build=$('uiBuild');if(build){build.firstChild.textContent=studioRound+'차 작업대 · 실제 공개 '+row.round+'차 ';build.dataset.publishedRound=String(row.round);}
    for(const t of tools.filter(t=>t.case)){
      const b=$('quick').querySelector('[data-id="'+t.id+'"]');
      if(b)b.textContent=row.round+'차 '+({F02:'페른',M01:'힘멜',W:'몸통'})[t.case];
    }
    if(frames.has('journal')){const f=frames.get('journal'),url=pathFor(tools.find(t=>t.id==='journal'));if(f.src!==url)f.src=url;}
    for(const [c,url] of found){targets.set(c,url);const t=tools.find(t=>t.case===c),f=frames.get(t.id);if(f&&f.src!==url)f.src=url;}
    if(tools.find(t=>t.id===current)?.case)open(current);
  }catch{if(!edition)say('회차 목록을 다시 확인합니다. 보존 관찰창을 열었습니다.');}finally{refreshing=false;}
}
open(new URL(location.href).searchParams.get('tool'));refresh();document.addEventListener('visibilitychange',refresh);addEventListener('online',refresh);setInterval(refresh,15000);

document.getElementById('buildReview').onclick=()=>open('acceptance');

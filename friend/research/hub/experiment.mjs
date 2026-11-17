import {caseName, latestCaseLink, viewerFor, followPublished} from './viewer-links.mjs';
const names={round42:'42차 턱밑과 흉벽 연결',round41:'41차 얼굴 구도와 가슴 밑선',round40:'40차 눈매와 측면 밑선',round39:'39차 명암과 밑면 비교',round38:'38차 원본 겹침 연구',profile37:'37차 사선·턱끝 검토',contour36:'36차 원본 윤곽 관찰창',motion35:'밑선·움직임 비교',paper35:'가슴 기본형과 원전',atlas35:'원형 대조실',study34:'34차 얼굴과 바스트 모핑',study33:'33차 대조 도판',blind32:'31차 C 블라인드 비교','continuous-review':'형태 관찰창','rig-study32':'32차 연구 기록'};
const dialog=document.querySelector('#experiment'),frame=document.querySelector('#experimentView');
const query=()=>new URL(location.href);
const latest = document.createElement('a');
latest.textContent = '최신 관찰창 열기';
latest.hidden = true;
document.querySelector('#separate').before(latest);
function showFrame(url){
  if(frame.dataset.loadedUrl===url)return;
  if(!frame.hasAttribute('src'))frame.src=url;
  else frame.contentWindow.location.replace(url);
  frame.dataset.loadedUrl=url;
}
function clearFrame(){
  delete frame.dataset.loadedUrl;
  if(frame.hasAttribute('src'))frame.removeAttribute('src');
}
const studioKeys=['tool','a','b','av','bv','case'];
window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.type!=='bookfriend:studio-state'||typeof e.data.search!=='string'||e.data.search.length>1600||query().searchParams.get('lab')!=='studio')return;
  const state=new URLSearchParams(e.data.search),u=query(),direct=new URL('../../pixel-lab/studio.html',location.href);
  for(const k of studioKeys){const v=state.get(k);if(v&&v.length<=150){u.searchParams.set(k,v);direct.searchParams.set(k,v);}else u.searchParams.delete(k);}
  history.replaceState(history.state,'',u);document.querySelector('#separate').href=direct.href;
});
function sync(){
  const id=query().searchParams.get('lab');
  const sub=query().searchParams;
  dialog.classList.toggle('studio',id==='studio');
  if(id==='studio'){
    const url=new URL('../../pixel-lab/studio.html',location.href);
    for(const k of studioKeys)if(sub.get(k))url.searchParams.set(k,sub.get(k));
    latest.hidden=true;const separate=document.querySelector('#separate');separate.hidden=false;separate.href=url;
    document.querySelector('#experimentName').textContent='책방 친구 · 내 실험실';frame.title='내 실험실';
    if(!frame.dataset.studio){showFrame(url.href);frame.dataset.studio='true';}if(!dialog.open)dialog.showModal();return;
  }
  delete frame.dataset.studio;
  const requested=sub.get('case') || (sub.get('mode')==='chest'?'W':'F02');
  const person=['F02','M01','W'].includes(requested)?requested:'F02';
  const archived=id==='study34' || id==='contour36' || id==='study33' || id==='continuous-review';
  latest.hidden=!archived;
  latest.href=latestCaseLink(person);
  latest.textContent='최신 '+caseName(person)+' 관찰창 열기';
  if(id==='viewer'){
    const target=viewerFor(person);
    document.querySelector('#experimentName').textContent=target.label;
    const separate=document.querySelector('#separate');
    separate.hidden=!target.url;
    if(target.url){separate.href=target.url;frame.title=target.label;showFrame(target.url);}
    else if(frame.dataset.viewCase!==person)clearFrame();
    frame.dataset.viewCase=person;
    if(!dialog.open)dialog.showModal();
    return;
  }
  delete frame.dataset.viewCase;
  document.querySelector('#separate').hidden=false;
  if(!Object.hasOwn(names,id)){if(dialog.open)dialog.close();clearFrame();return;}
  const href=new URL('../../pixel-lab/'+id+'.html',location.href);
  for(const k of ['panel','pose','focus','mode','case','group','cell','form','scan','round','variant'])if(sub.get(k))href.searchParams.set(k,sub.get(k));if(sub.get('section'))href.hash=sub.get('section');
  const title=id==='contour36' && /^\d+$/.test(sub.get('round')||'') ? sub.get('round')+'차 · '+caseName(person)+' 관찰창' : id==='study34'?'34차 보존판 · 얼굴과 바스트 모핑':names[id];
  document.querySelector('#experimentName').textContent=title;document.querySelector('#separate').href=href;frame.title=title;
  showFrame(href.href);
  if(!dialog.open)dialog.showModal();
}
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href]');if(!a||a.target==='_blank'||e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey)return;
  const u=new URL(a.href),id=u.pathname.split('/').at(-1).replace(/\.html$/,'');
  if(u.origin===location.origin&&u.pathname===location.pathname&&u.searchParams.get('lab')==='studio'){
    e.preventDefault();const back=query();const dest=new URL(back);dest.searchParams.set('lab','studio');for(const k of studioKeys)dest.searchParams.delete(k);
    history.pushState({experiment:'studio',returnTo:back.href},'',dest);sync();return;
  }
  if(u.origin===location.origin && u.pathname===location.pathname && u.searchParams.get('lab')==='viewer'){
    e.preventDefault();const url=query();url.searchParams.set('lab','viewer');url.searchParams.set('case',u.searchParams.get('case')||'F02');for(const k of ['mode','pose','panel','focus','group','cell','form','scan','round','variant','section'])url.searchParams.delete(k);
    history.pushState({experiment:'viewer',returnTo:history.state?.returnTo||(!query().searchParams.has('lab')?location.href:null)},'',url);sync();return;
  }
  if(u.origin!==location.origin||!u.pathname.includes('/friend/pixel-lab/')||!Object.hasOwn(names,id))return;
  e.preventDefault();const url=query();url.searchParams.set('lab',id);for(const k of ['panel','pose','focus','mode','case','group','cell','form','scan','round','variant']){if(u.searchParams.get(k))url.searchParams.set(k,u.searchParams.get(k));else url.searchParams.delete(k);}if(u.hash)url.searchParams.set('section',u.hash.slice(1));else url.searchParams.delete('section');history.pushState({experiment:id,returnTo:history.state?.returnTo||(!query().searchParams.has('lab')?location.href:null)},'',url);sync();
});
function closeLab(){
  const saved = history.state?.returnTo;
  const url = saved ? new URL(saved,location.href) : query();
  if(!saved)for(const k of ['tool','a','b','av','bv','lab','section','pose','panel','focus','mode','case','cell','form','scan','round','variant'])url.searchParams.delete(k);
  history.replaceState(null,'',url);sync();
}
dialog.addEventListener('cancel',e=>{e.preventDefault();closeLab();});document.querySelector('#closeLab').onclick=closeLab;
window.addEventListener('popstate',sync);followPublished(sync);

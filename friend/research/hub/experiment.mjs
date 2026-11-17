const names={round39:'39차 명암과 밑면 비교',round38:'38차 원본 겹침 연구',profile37:'37차 사선·턱끝 검토',contour36:'36차 원본 윤곽 관찰창',motion35:'밑선·움직임 비교',paper35:'가슴 기본형과 원전',atlas35:'원형 대조실',study34:'34차 얼굴과 바스트 모핑',study33:'33차 대조 도판',blind32:'31차 C 블라인드 비교','continuous-review':'형태 관찰창','rig-study32':'32차 연구 기록'};
const dialog=document.querySelector('#experiment'),frame=document.querySelector('#experimentView');
const query=()=>new URL(location.href);
function sync(){
  const id=query().searchParams.get('lab');
  if(!Object.hasOwn(names,id)){if(dialog.open)dialog.close();frame.removeAttribute('src');return;}
  const href=new URL('../../pixel-lab/'+id+'.html',location.href);
  const sub=query().searchParams;for(const k of ['panel','pose','focus','mode','case','group','cell','form','scan','round','variant'])if(sub.get(k))href.searchParams.set(k,sub.get(k));if(sub.get('section'))href.hash=sub.get('section');
  document.querySelector('#experimentName').textContent=names[id];document.querySelector('#separate').href=href;frame.title=names[id];
  if(frame.src!==href.href)frame.src=href.href;
  if(!dialog.open)dialog.showModal();
}
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href]');if(!a||a.target==='_blank'||e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey)return;
  const u=new URL(a.href),id=u.pathname.split('/').at(-1).replace(/\.html$/,'');
  if(u.origin!==location.origin||!u.pathname.includes('/friend/pixel-lab/')||!Object.hasOwn(names,id))return;
  e.preventDefault();const url=query();url.searchParams.set('lab',id);for(const k of ['panel','pose','focus','mode','case','group','cell','form','scan','round','variant']){if(u.searchParams.get(k))url.searchParams.set(k,u.searchParams.get(k));else url.searchParams.delete(k);}if(u.hash)url.searchParams.set('section',u.hash.slice(1));else url.searchParams.delete('section');history.pushState({experiment:id},'',url);sync();
});
function closeLab(){
  if(history.state?.experiment){history.back();return;}
  const url=query();for(const k of ['lab','section','pose','panel','focus','mode','case','group','cell','form','scan','round','variant'])url.searchParams.delete(k);history.replaceState(null,'',url);sync();
}
dialog.addEventListener('cancel',e=>{e.preventDefault();closeLab();});document.querySelector('#closeLab').onclick=closeLab;
window.addEventListener('popstate',sync);sync();

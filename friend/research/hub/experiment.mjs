const names={blind32:'31차 C 블라인드 비교','continuous-review':'형태 관찰창','rig-study32':'32차 연구 기록'};
const dialog=document.querySelector('#experiment'),frame=document.querySelector('#experimentView');
const query=()=>new URL(location.href);
function sync(){
  const id=query().searchParams.get('lab');
  if(!Object.hasOwn(names,id)){if(dialog.open)dialog.close();frame.removeAttribute('src');return;}
  const href=new URL('../../pixel-lab/'+id+'.html',location.href).href;
  document.querySelector('#experimentName').textContent=names[id];document.querySelector('#separate').href=href;frame.title=names[id];
  if(frame.src!==href)frame.src=href;
  if(!dialog.open)dialog.showModal();
}
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href]');if(!a||a.target==='_blank'||e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey)return;
  const u=new URL(a.href),id=u.pathname.split('/').at(-1).replace(/\.html$/,'');
  if(u.origin!==location.origin||!u.pathname.includes('/friend/pixel-lab/')||!Object.hasOwn(names,id))return;
  e.preventDefault();const url=query();url.searchParams.set('lab',id);history.pushState({experiment:id},'',url);sync();
});
function closeLab(){
  if(history.state?.experiment){history.back();return;}
  const url=query();url.searchParams.delete('lab');history.replaceState(null,'',url);sync();
}
dialog.addEventListener('cancel',e=>{e.preventDefault();closeLab();});document.querySelector('#closeLab').onclick=closeLab;
window.addEventListener('popstate',sync);sync();

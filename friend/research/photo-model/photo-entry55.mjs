const pane=document.getElementById('activePhotoEngine'),old=document.getElementById('legacyPhotoEngine');
function show(){
  const legacy=location.hash==='#photoEngine',occlusion=location.hash==='#occlusion55';
  if((pane.hasAttribute('src')||old.hasAttribute('src'))&&!legacy&&!occlusion)return;
  const url=legacy?'../../pixel-lab/photo-engine36.html':'./occlusion55.html';
  const active=legacy?old:pane;
  if(!active.hasAttribute('src'))active.src=url;
  pane.hidden=legacy;old.hidden=!legacy;document.getElementById('photoWide55').href=url;
  for(const a of document.querySelectorAll('#occlusion55 a'))a.setAttribute('aria-current',a.hash===(legacy?'#photoEngine':'#occlusion55')?'page':'false');
}
window.addEventListener('hashchange',show);show();

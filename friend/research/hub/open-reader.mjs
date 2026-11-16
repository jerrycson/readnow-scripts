const doc=location.pathname.split('/').at(-1).split('.')[0];
const hub=new URL('../hub/',location.href);
hub.searchParams.set('tab','originals');hub.searchParams.set('doc',doc);
const a=document.createElement('a');a.textContent='연구실에서 목차와 함께 읽기';a.href=hub.href;
a.addEventListener('click',()=>{const chapter=location.hash.slice(1)||document.elementFromPoint(30,90)?.closest('article[id]')?.id;if(chapter)hub.searchParams.set('chapter',chapter);a.href=hub.href;});
const nav=document.querySelector('header nav, main nav, header');
if(nav){const line=document.createElement('p');line.append(a);nav.append(line);}

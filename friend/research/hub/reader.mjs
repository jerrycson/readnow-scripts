const el=id=>document.getElementById(id);
const text=(tag,body,cls)=>Object.assign(document.createElement(tag),{textContent:body,...(cls?{className:cls}:{})});
const terms=q=>q.trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean);
const matches=(body,q)=>terms(q).every(t=>body.toLocaleLowerCase().includes(t));
const get=k=>new URL(location.href).searchParams.get(k)||'';
export function route(patch,push=false){
  const url=new URL(location.href);
  for(const [k,v] of Object.entries(patch))if(v)url.searchParams.set(k,v);else url.searchParams.delete(k);
  if(url.href!==location.href)window.history[push?'pushState':'replaceState'](null,'',url);
}
function stableKey(r){
  let hash=2166136261;
  for(const c of (r.url||'')+'|'+r.title)hash=Math.imul(hash^c.charCodeAt(0),16777619);
  return (hash>>>0).toString(36);
}
function link(label,href,base=location.href){
  if(!href)return;
  let url;try{url=new URL(href,base);}catch{return;}
  if(url.protocol!=='https:' && !(url.origin===location.origin && /^https?:$/.test(url.protocol)))return;
  const a=text('a',label);a.href=url.href;return a;
}
function button(title,onClick,cls){const b=text('button',title,cls);b.onclick=onClick;return b;}
function inline(line,base=location.href){
  const f=document.createDocumentFragment(),rx=/\[([^\]]+)\]\(([^\s)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  let i=0;
  for(const m of line.matchAll(rx)){
    f.append(line.slice(i,m.index));f.append(m[1]?(link(m[1],m[2],base)||m[1]):text(m[3]?'strong':'code',m[3]||m[4]));i=m.index+m[0].length;
  }
  f.append(line.slice(i));return f;
}
function paragraphs(content){
  const frag=document.createDocumentFragment();
  for(const block of String(content||'').trim().split(/\n\s*\n/)){
    let ul=null;
    for(const line of block.split('\n')){
      if(!line.trim())continue;
      if(/^\s*[-*] /.test(line)){
        if(!ul){ul=document.createElement('ul');frag.append(ul);}
        const li=document.createElement('li');li.append(inline(line.replace(/^\s*[-*] /,'')));ul.append(li);
      }else{ul=null;const p=document.createElement(/^#{1,5} /.test(line)?'h3':'p');p.append(inline(line.replace(/^#{1,5} /,'')));frag.append(p);}
    }
  }
  return frag;
}
function pageNav(rows,index,go){
  const nav=text('div','','pager');
  const prev=button('← 이전',()=>go(index-1)),next=button('다음 →',()=>go(index+1));
  prev.disabled=index<=0;next.disabled=index>=rows.length-1;
  nav.append(prev,text('span',(index+1)+' / '+rows.length),next);return nav;
}
function mobileBack(host,rail){
  return button('← 검색 결과',()=>{host.closest('.split').classList.remove('inspecting');route(host.id==='reading'?{card:null}:{chapter:null},true);rail.focus();},'mobileBack');
}
function reveal(host){
  host.closest('.split').classList.add('inspecting');host.focus({preventScroll:true});
  if(matchMedia('(max-width:740px)').matches||host.getBoundingClientRect().top<54)host.scrollIntoView({block:'start'});
}
function setList(container,rows,chosen,choose){
  const top=container.scrollTop;
  const nodes=rows.map((r,i)=>{
    const b=button('',()=>choose(i),'item');b.append(text('small',r.group||''),document.createTextNode(r.title));
    const snippet=r.line||r.source?.querySelector('p')?.textContent;if(snippet)b.append(text('span',snippet,'snippet'));
    if(r.key===chosen)b.setAttribute('aria-current','true');
    return b;
  });
  container.replaceChildren(...nodes);container.scrollTop=top;
}
const documents={index:'픽셀 제작 자료',sites:'주요 연구 사이트',journal:'회차별 실행 일지',architecture:'복구와 구조 선택',anatomy:'인체·재질·움직임',anime:'일본 등신·참고 대조'};
export const docName=key=>Object.hasOwn(documents,key)?key:'journal';
function studyTarget(url){
  const m=url.pathname.match(/\/research\/pixel\/(index|sites|journal|architecture|anatomy|anime)\.html$/);
  return url.origin===location.origin && m?{doc:m[1],chapter:url.hash.slice(1)}:null;
}
const stored=key=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}};
const saved=new Set(stored('friend-library-stars33')||[]);
let pin=stored('friend-library-pin33')||'';
function remember(key,val){try{localStorage.setItem(key,JSON.stringify(val));}catch{}}
export function library(rows,goDoc){
  const rail=el('cards'),host=el('reading'),q=el('search').value,group=get('group'),groups=(get('groups')||group).split('|').filter(Boolean),bookmarks=get('saved')==='1';
  const filtered=rows.filter(r=>(!groups.length||groups.includes(r.group))&&(!bookmarks||saved.has(stableKey(r)))&&matches([r.title,r.group,r.line,r.unit,r.detail,r.url||''].join(' '),q)).map(r=>({...r,key:stableKey(r)}));
  const facets=el('facets');
  const counts=new Map();for(const row of rows)counts.set(row.group,1+(counts.get(row.group)||0));
  const chips=[...counts].map(([name,count])=>{
    const b=button(name+' '+count,()=>{
      const next=groups.includes(name)?groups.filter(v=>v!==name):[...groups,name];
      route({group:null,groups:next.join('|'),card:null});host.closest('.split').classList.remove('inspecting');library(rows,goDoc);
    });
    b.dataset.group=name;b.setAttribute('aria-pressed',String(groups.includes(name)));return b;
  });
  facets.replaceChildren(...chips);
  const bookmarkMode=v=>{route({saved:v?'1':null,card:null});host.closest('.split').classList.remove('inspecting');library(rows,goDoc);};
  el('onlySaved').onclick=()=>bookmarkMode(true);el('allItems').onclick=()=>bookmarkMode(false);
  el('allItems').setAttribute('aria-pressed',String(!bookmarks));el('onlySaved').setAttribute('aria-pressed',String(bookmarks));
  el('onlySaved').textContent='★ 저장 자료 '+saved.size;
  el('clearFilter').onclick=()=>{el('search').value='';el('group').value='';route({q:null,group:null,groups:null,saved:null,card:null});host.closest('.split').classList.remove('inspecting');library(rows,goDoc);};
  const score=r=>terms(q).reduce((sum,t)=>sum+(r.title.toLocaleLowerCase().includes(t)?2:0)+(String(r.line||'').toLocaleLowerCase().includes(t)?1:0),0);
  filtered.reverse();if(q)filtered.sort((a,b)=>score(b)-score(a));
  el('count').textContent=filtered.length+' / '+rows.length+'건';
  if(!filtered.length){rail.replaceChildren();host.replaceChildren(text('p','조건에 맞는 자료가 없습니다. 검색어나 분야를 바꿔보세요.','empty'));host.closest('.split').classList.remove('inspecting');return;}
  const draw=(i,action=false)=>{
    const r=filtered[i];if(!r)return;
    if(action)route({card:r.key},true);
    setList(rail,filtered,r.key,n=>draw(n,true));
    const title=text('h2',r.title),lead=text('p',r.line||'','lead');
    const short=text('section',''),detail=text('section','');short.id='section-unit';detail.id='section-detail';
    short.append(text('h3','한 문단 요약'),paragraphs(r.unit));detail.append(text('h3','상세 설명'),paragraphs(r.detail));
    const links=text('div','','links');
    if(r.noteId){
      const paper=new URL('../../pixel-lab/study-note35.html',location.href);paper.searchParams.set('id',r.noteId);
      if(get('rev'))paper.searchParams.set('rev',get('rev'));
      links.append(link('A4 상세 연구 노트',paper.href));
    }
    const orig=link('출처 열기 ↗',r.url),local=link('연구 원문·결과 보기',r.local);
    if(orig){orig.target='_blank';orig.rel='noopener';links.append(orig);}
    if(local){const target=studyTarget(new URL(local.href));if(target)local.onclick=e=>{if(!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();goDoc(target);}};links.append(local);}
    const star=button(saved.has(r.key)?'★ 저장됨':'☆ 저장',()=>{
      if(saved.has(r.key))saved.delete(r.key);else saved.add(r.key);remember('friend-library-stars33',[...saved]);route({card:r.key});library(rows,goDoc);
    });star.setAttribute('aria-pressed',String(saved.has(r.key)));
    const pair=button(pin===r.key?'기준 해제':'비교 기준으로 고정',()=>{pin=pin===r.key?'':r.key;remember('friend-library-pin33',pin);draw(i);});links.prepend(star,pair);
    const ref=pin!==r.key&&rows.find(x=>stableKey(x)===pin),comparison=text('section','','pinned');
    if(ref){comparison.append(text('h3','고정한 자료와 비교'),text('strong',ref.title),text('p',ref.line),text('p',ref.unit),button('고정 해제',()=>{pin='';remember('friend-library-pin33','');draw(i);}));}
    const jump=text('div','','jump');
    for(const [name,dest] of [['요약',short],['상세 설명',detail]])jump.append(button(name,()=>dest.scrollIntoView()));
    host.replaceChildren(mobileBack(host,el('search')),text('p',r.group,'meta'),title,lead,links,...(ref?[comparison]:[]),jump,short,detail,pageNav(filtered,i,n=>draw(n,true)));
    if(action){reveal(host);const active=rail.children[i];if(active.offsetTop<rail.scrollTop||active.offsetTop>rail.scrollTop+rail.clientHeight)rail.scrollTop=Math.max(0,active.offsetTop-rail.offsetTop-24);}
  };
  const index=filtered.findIndex(r=>r.key===get('card'));draw(Math.max(0,index));if(index>=0)host.closest('.split').classList.add('inspecting');
}
const docCache=new Map();let loadId=0;
export async function originals(){
  const token=++loadId,key=docName(get('doc')),url=new URL('../pixel/'+key+'.html',location.href);
  const rail=el('chapters'),host=el('originalBody');el('doc').value=key;el('doc').dispatchEvent(new Event('choice-sync'));el('docSearch').value=get('dq');
  if(!docCache.has(key)){
    host.replaceChildren(text('p','원문을 읽는 중입니다.'));rail.replaceChildren();
    const res=await fetch(url);if(!res.ok)throw Error('원문을 읽을 수 없습니다 '+res.status);
    const html=new DOMParser().parseFromString(await res.text(),'text/html');
    const nodes=[...html.querySelectorAll('article[id]')];
    if(key==='journal')nodes.sort((a,b)=>(['round33','round34','round35'].indexOf(b.id)-['round33','round34','round35'].indexOf(a.id)));
    docCache.set(key,nodes.map(n=>({title:n.querySelector('h2')?.textContent||n.id,key:n.id,body:n.textContent,source:n})));
  }
  if(token!==loadId)return;
  const all=docCache.get(key),rows=all.filter(r=>matches(r.body,el('docSearch').value));
  el('docCount').textContent=rows.length+' / '+all.length+'개 단원';
  if(!rows.length){rail.replaceChildren();host.replaceChildren(text('p','검색 결과가 없습니다.','empty'));host.closest('.split').classList.remove('inspecting');return;}
  const draw=(i,action=false)=>{
    const r=rows[i];if(!r)return;
    if(action)route({chapter:r.key},true);
    setList(rail,rows,r.key,n=>draw(n,true));
    const copy=r.source.cloneNode(true);
    for(const element of copy.querySelectorAll('*')){
      if(!['P','H2','H3','H4','UL','OL','LI','STRONG','EM','A','IMG','FIGURE','FIGCAPTION','BR','TABLE','TBODY','THEAD','TR','TD','TH','CODE','PRE','BLOCKQUOTE','DETAILS','SUMMARY','DIV','SPAN','HR','B','I','SMALL'].includes(element.tagName)){element.remove();continue;}
      const href=element.getAttribute('href'),src=element.getAttribute('src'),alt=element.getAttribute('alt');
      for(const attr of [...element.attributes])element.removeAttribute(attr.name);
      if(element.tagName==='A'&&href){const a=link('',href,url);if(a){element.href=a.href;const t=studyTarget(new URL(a.href));if(t)element.onclick=e=>{if(!e.ctrlKey&&!e.metaKey){e.preventDefault();route({doc:t.doc,chapter:t.chapter,dq:null},true);originals().catch(showError);}};}}
      if(element.tagName==='IMG'&&src){const u=new URL(src,url);if(u.origin===location.origin||u.protocol==='https:'){element.src=u.href;element.alt=alt||'';element.loading='lazy';}}
    }
    host.replaceChildren(mobileBack(host,el('docSearch')),text('p',documents[key],'meta'),...copy.childNodes,link('원래 페이지에서 열기',url.href+'#'+r.key),pageNav(rows,i,n=>draw(n,true)));
    if(action)reveal(host);
  };
  const index=rows.findIndex(r=>r.key===get('chapter'));draw(Math.max(0,index));if(index>=0)host.closest('.split').classList.add('inspecting');
}
export function showError(error){el('originalBody').replaceChildren(text('p',error.message));}
export function initReader(){
  el('doc').replaceChildren(...Object.entries(documents).map(([k,v])=>new Option(v,k)));
  el('doc').onchange=()=>{route({doc:el('doc').value,chapter:null,dq:null},true);originals().catch(showError);};
  el('docSearch').oninput=()=>{route({dq:el('docSearch').value,chapter:null});originals().catch(showError);};
}

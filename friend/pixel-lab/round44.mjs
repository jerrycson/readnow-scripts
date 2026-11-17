const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text||'';return n;};
const get=async name=>{const r=await fetch(name);if(!r.ok)throw Error(name+' 응답 '+r.status);return r.json();};
async function audit(){for(const r of await get('studio-audit43.json')){const a=el('article');a.className='note';a.append(el('h3',r.title+' · '+r.status),el('p',r.evidence),el('p','다음 검증 · '+r.next));const l=el('a','관련 화면 열기');l.href=r.href;a.append(l);document.getElementById('items').append(a);}}
const studyFiles = {
  '44': ['studio-note44.json','sculpt-note44.json','photo-note44.json','study-charter44.json'],
  '45': ['sync-note45.json','preference-note45.json'],
  '46': ['controller-note46.json','precedent-note46.json'],
  '47': ['face-note47.json','chest-note47.json'],
  '48': ['face-note48.json','chest-note48.json']
};
async function notes(){for(const r of (await Promise.all((studyFiles[document.getElementById('studies').dataset.round] || studyFiles['44']).map(get))).flat()){const a=el('article');a.className='note';a.id=r.id;const full=el('details');full.append(el('summary','문단 요약과 A4 상세 원고'),el('h4','한 문단 요약'),el('p',r.unit),el('h4','상세 설명'),el('p',r.detail));const page=el('article');page.append(el('h1',r.title),el('p',r.line),el('h2','한 문단 요약'),el('p',r.unit),el('h2','상세 설명'),el('p',r.detail));for(const s of [{url:r.url,title:'원전'},...(r.sources||[])]){const l=el('a',typeof s==='string'?'추가 원전':s.title);l.href=typeof s==='string'?s:s.url;l.target='_blank';l.rel='noopener';full.append(l,document.createTextNode(' '));}const credit=el('p','원전 · '+[r.url,...(r.sources||[]).map(s=>typeof s==='string'?s:s.url)].join(' · '));credit.className='credit';page.append(credit);a.append(el('h3',r.title),el('p',r.line),full);document.getElementById('studies').append(a);document.getElementById('printDoc').append(page);}
document.getElementById('print').onclick=()=>window.print();}
notes().catch(e=>document.getElementById('studies').textContent=e.message);
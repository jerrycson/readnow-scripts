const el=id=>document.getElementById(id),node=(tag,text,cl)=>Object.assign(document.createElement(tag),{textContent:text,...(cl?{className:cl}:{})});
const qs=new URLSearchParams(location.search),initial=qs.get('id')||'shape-W';
const split=[['전체',()=>true],['얼굴',r=>/얼굴|눈꺼풀|턱|입술/.test(r.group+r.title)],['가슴',r=>/가슴|체표|기본형|중력|선호|유방/.test(r.group+r.title)],['자세 실측',r=>r.noteId.startsWith('scan-')],['이전 연구',r=>r.noteId.startsWith('prior-')]];
let data=[],active='',filter='전체',geometry;
function bodyFor(r){
 const sheet=node('article','', 'studySheet');sheet.append(node('p',r.group+' · '+r.state,'meta'),node('h2',r.title));
 for(const block of r.detail.split(/\n\s*\n/)){const lines=block.split('\n');for(const line of lines){if(!line.trim())continue;sheet.append(node(line.startsWith('### ')?'h3':'p',line.replace(/^### /,'')));}}
 const asset=geometry.get(r.noteId);
 if(asset){const fig=node('figure','','tracefigure'),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('role','img');svg.setAttribute('aria-label','이 자료에서 추적한 윤곽');
 const all=asset.lines.flat(),xs=all.map(p=>p[0]),ys=all.map(p=>p[1]),x=Math.min(...xs)-2,y=Math.min(...ys)-2;svg.setAttribute('viewBox',[x,y,Math.max(...xs)-x+2,Math.max(...ys)-y+2].join(' '));for(const points of asset.lines){const l=document.createElementNS(svg.namespaceURI,'polyline');l.setAttribute('points',points.map(p=>p.join(',')).join(' '));l.setAttribute('fill','none');l.setAttribute('stroke','#226b5a');l.setAttribute('stroke-width','1.4');svg.append(l);}fig.append(svg,node('figcaption',asset.label));sheet.append(fig);}
 const provenance=node('p','','source');provenance.append('35차 · '+r.noteId+'　');if(r.url){const a=node('a','원전 열기');a.href=r.url;a.target='_blank';a.rel='noopener';provenance.append(a);}sheet.append(provenance);return sheet;
}
function select(id,update=true){
 const r=data.find(x=>x.noteId===id);if(!r)return;active=id;const overview=el('overview');overview.replaceChildren(node('p',r.state,'meta'),node('h2',r.title),node('h3','한 줄 요약'),node('p',r.line),node('h3','한 문단 요약'),node('p',r.unit));
 const sheet=bodyFor(r);el('sheet').replaceChildren(...sheet.childNodes);el('try').href=new URL(r.local,new URL('../research/hub/',location.href));
 if(update){const u=new URL(location.href);u.searchParams.set('id',id);history.replaceState(null,'',u);}
 for(const b of el('list').children)b.setAttribute('aria-current',String(b.dataset.id===id));
}
function draw(){const test=split.find(x=>x[0]===filter)[1],terms=el('find').value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 const rows=data.filter(r=>test(r)&&terms.every(t=>[r.noteId,r.title,r.group,r.unit,r.state].join(' ').toLocaleLowerCase().includes(t)));el('count').textContent=rows.length+' / '+data.length+'개 자료';
 el('list').replaceChildren(...rows.map(r=>{const b=node('button',r.title);b.dataset.id=r.noteId;b.setAttribute('aria-current',String(r.noteId===active));b.onclick=()=>{select(r.noteId);if(innerWidth<760)el('reader').scrollIntoView();};return b;}));
 el('filters').replaceChildren(...split.map(([k])=>{const b=node('button',k);b.setAttribute('aria-pressed',String(k===filter));b.onclick=()=>{filter=k;draw();};return b;}));}
async function json(file){const r=await fetch(file);if(!r.ok)throw Error('응답 '+r.status);return r.json();}
async function start(){
 const [notes,atlas,controls,ref]=await Promise.all(['notes35.json','atlas35.json','gravity35.json','reference35.json'].map(json));data=notes;geometry=new Map();
 for(const r of [...atlas.faces,...atlas.bodies])geometry.set(r.id,{lines:r.lines.map(l=>l.points),label:r.name+'의 원자료에서 직접 딴 가시선. 회전 창에서 실제 캐릭터와 겹쳐 비교할 수 있습니다.'});
 for(const r of controls)geometry.set(r.id,{lines:[r.points],label:r.note});
 for(const k of ['shape-W','wallner'])geometry.set(k,{lines:ref.cells[12].lines.map(ps=>ps.map(([x,y])=>[x*82,y*125])),label:'지정 도판 B의 가운데 측면에서 따낸 상부 경사·돌출·하부 반환선.'});
 if(qs.has('proof')){document.body.classList.add('proof');const report=node('div','','report');for(const r of data)report.append(bodyFor(r));document.body.append(report);}
 el('find').oninput=draw;el('print').onclick=()=>window.print();select(data.some(r=>r.noteId===initial)?initial:data[0].noteId,false);draw();document.body.dataset.ready=data.length;
}start().catch(e=>{el('reader').textContent='연구 노트를 열 수 없습니다 · '+e.message;});
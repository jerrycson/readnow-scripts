import {openIrises} from './iris-panel41.mjs';
const byId=id=>document.getElementById(id);
const tag=(name,text)=>{const item=document.createElement(name);if(text!==undefined)item.textContent=text;return item;};
const studyFiles=['face-note41','chest-note41','iris-note41'];
const sourceTitles={
 'https://frieren-anime.jp/character/chara_group1/1-2/':'힘멜 공식 설정화',
 'https://frieren-anime.jp/character/chara_group1/1-5/':'페른 공식 설정화',
 'https://frieren-anime.jp/story/1st/ep01/':'공식 1화 자료',
 'https://frieren-anime.jp/story/1st/ep12/':'공식 12화 자료',
 'https://www.epfl.ch/labs/cvlab/software/multi-view-stereo/epnp/':'EPFL의 카메라 자세 추정 연구',
 'https://www.w3.org/TR/css-color-4/#ok-lab':'W3C의 지각 색공간 설명'
};
function credits(record){
 const nav=tag('nav');nav.className='sources';nav.setAttribute('aria-label','이 원고의 참고 자료');
 for(const url of new Set([record.url,...(record.sources||[])])){
   const link=tag('a',sourceTitles[url]||'원전 열기');link.href=url;nav.append(link,document.createTextNode(' '));
 }
 return nav;
}
function table(title,columnNames,rows){
 const el=tag('table');el.style.cssText='border-collapse:collapse;margin:1rem 0;max-width:100%;font-variant-numeric:tabular-nums';el.append(tag('caption',title));
 const top=el.createTHead().insertRow();for(const name of columnNames){const th=tag('th',name);th.scope='col';top.append(th);}
 const body=el.createTBody();
 for(const row of rows){const tr=body.insertRow();for(const [i,v] of row.entries()){const c=i===0?tag('th',v):tag('td',v);if(i===0)c.scope='row';tr.append(c);}}
 for(const c of el.querySelectorAll('th,td'))c.style.cssText='text-align:left;border-bottom:1px solid #ccd3cc;padding:.45em .6em';
 return el;
}
async function measurements(){
 const read=async file=>{const r=await fetch(file);if(!r.ok)throw Error(file+' 응답 '+r.status);return r.json();};
 const [face,chest]=await Promise.all([read('face-eval41.json'),read('chest-eval41.json')]);
 const eyes=face.views.filter(v=>v.role==='후보 선택 후 별도 장면').flatMap(view=>view.before.errors.flatMap((e,i)=>e.hidden?[]:[[view.key.replace(/(화)(\\d+)$/,'$1 · 장면 $2')+' · 화면 '+(i?'오른눈':'왼눈'),e.width.toFixed(1),view.after.errors[i].width.toFixed(1)]]));
 const data=key=>[chest.paper[key].before,chest.candidates.balanced.paper[key],chest.candidates.lower.paper[key]];
 const rows=[['B3 사선 · 가까운 밑바닥 높이',...data('B3').map(d=>Math.abs(d.floors[0].source.bottom-d.floors[0].model.bottom).toFixed(2))],
 ['S3 측면 · 밑선 거리',...data('S3').map(d=>d.errorsPx[0].toFixed(2))],['A5 사선 · 가까운 밑선 거리',...data('A5').map(d=>d.errorsPx[0].toFixed(2))]];
 byId('measured').append(table('힘멜 · 후보를 고른 뒤 확인한 장면의 눈폭 오차',['원본','39차','41차 후보'],eyes),table('성인 가슴 · 같은 카메라에서 잰 밑선 오차',['원도판 구획과 측정','40차','41차 균형','41차 깊은 곡선'],rows));
}
async function articles(){
 const sets=await Promise.all(studyFiles.map(async name=>{
   const response=await fetch(name+'.json');if(!response.ok)throw Error(name+' 원고의 응답 '+response.status);
   return response.json();
 }));
 for(const record of sets.flat()){
   const article=tag('article'),body=tag('details') ;
   article.className='note';
   body.append(tag('summary','문단 요약과 상세 설명'),tag('p',record.unit),tag('p',record.detail),credits(record));
   article.append(tag('h3',record.title),tag('p',record.line),body);byId('studies').append(article);
   const page=tag('article'),credit=tag('p','출처 · '+record.url);credit.className='credit';
   page.append(tag('h1',record.title),tag('p',record.line),tag('h2','문단 요약'),tag('p',record.unit),tag('h2','상세 설명'),tag('p',record.detail),credit);byId('printDoc').append(page);
 }
 byId('print').disabled=false;byId('print').onclick=()=>window.print();
}
for(const [target,start] of [['measured',measurements],['irisView',()=>openIrises(byId('irisView'))],['studies',articles]]){
 start().catch(error=>{byId(target).append(tag('p','읽기 실패 · '+error.message));});
}

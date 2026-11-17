import {nativeFaces40} from './native40.mjs';
const byId=id=>document.getElementById(id);
const tag=(name,text)=>{const item=document.createElement(name);if(text!==undefined)item.textContent=text;return item;};
const studyFiles=['face-note40','chest-note40','native-note40'];
async function articles(){
 const sets=await Promise.all(studyFiles.map(async name=>{
   const response=await fetch(name+'.json');if(!response.ok)throw Error(name+' 원고의 응답 '+response.status);
   return response.json();
 }));
 for(const record of sets.flat()){
   const article=tag('article'),body=tag('details'),link=tag('a','원전 열기');
   article.className='note';link.href=record.url;
   body.append(tag('summary','문단 요약과 상세 설명'),tag('p',record.unit),tag('p',record.detail),link);
   article.append(tag('h3',record.title),tag('p',record.line),body);byId('studies').append(article);
   const page=tag('article'),credit=tag('p','출처 · '+record.url);credit.className='credit';
   page.append(tag('h1',record.title),tag('p',record.line),tag('h2','문단 요약'),tag('p',record.unit),tag('h2','상세 설명'),tag('p',record.detail),credit);byId('printDoc').append(page);
 }
 byId('print').disabled=false;byId('print').onclick=()=>window.print();
}
for(const [target,start] of [['nativeFaces',()=>nativeFaces40(byId('nativeFaces'))],['studies',articles]]){
 start().catch(error=>{byId(target).append(tag('p','읽기 실패 · '+error.message));});
}

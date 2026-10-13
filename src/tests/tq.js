const fs=require('fs');const s=fs.readFileSync('/tmp/c.js','utf8');
const a=s.indexOf('  async function taskQna()'),b=s.indexOf('  /* ════════ 4) 구매평');
const stores={qnaList:new Map(),qnaDetail:new Map(),uploaded:new Map(),jobs:new Map()};
let fetched=[],pages={};
const env=`const now=()=>new Date().toISOString();const fmtDate=x=>x;const log=(m)=>console.log('LOG',m);const setNow=()=>{};const progress=()=>{};
const dbGet=async(s,k)=>stores[s].get(k);const dbAll=async(s)=>[...stores[s].values()];const dbPut=async(s,o)=>{(Array.isArray(o)?o:[o]).forEach(x=>stores[s].set(x._key,JSON.parse(JSON.stringify(x))))};
const dbGetMany=async(s,ks)=>{const m=new Map();ks.forEach(k=>{if(stores[s].has(k))m.set(k,stores[s].get(k))});return m};
const loadJob=async n=>stores.jobs.get(n)||{_key:n,status:'idle'};const saveJob=async j=>stores.jobs.set(j._key,j);const isFresh=j=>j.status==='done'||j.status==='idle';
const syncRemoteJob=async()=>{};const settings={stopAfterKnownPages:2};const startJob=(job)=>{Object.assign(job,{mode:job.fullDoneAt?'update':'full',phase:'list',page:1,knownRun:0,queue:null,qi:0})};
const shareJobDone=()=>{};const BASE='';const fbUser=null,fdb=null;
const P={VERSION:'x',parseQnaList:(doc)=>doc.rows,parseQnaDetail:(doc,url)=>{const id=url.match(/questionid=(\\d+)/)[1];fetched.push(id);return {questionId:id,question:'q',answer:ANS[id]||null,title:'t'}}};
const fetchDoc=async(url,o)=>{if(/List/.test(url)){const p=+url.match(/page=(\\d+)/)[1];return {doc:{rows:(pages[p]||[]).map(x=>({...x}))}}}return {doc:{querySelector:()=>null}}};
async function crawlPages(job,mk,on){job.page=job.page||1;while(true){const r=await on((await fetchDoc(mk(job.page))).doc);if(!r.count)break;if(job.mode==='update'){job.knownRun=r.allKnown?job.knownRun+1:0;if(job.knownRun>=2){console.log('stop at page',job.page);break}}if(job.page>=3)break;job.page++}}
`;
let ANS={};
const f=new Function('stores','pages','fetched','ANS',env+s.slice(a,b)+';return taskQna;');
(async()=>{
 const mk=(id,ans)=>({questionId:String(id),answered:ans,createdDate:'d'});
 for(let p=1;p<=3;p++)pages[p]=[1,2,3].map(i=>mk(p*10+i,i===1?'No':i===2?'Yes':'취소된 질문'));
 ANS={'12':'a','22':'a','32':'a'};
 let t=f(stores,pages,fetched,ANS);await t();console.log('run1 fetched',fetched.length);fetched.length=0;
 t=f(stores,pages,fetched,ANS);await t();console.log('run2 fetched',fetched);fetched.length=0;
 pages[1]=[mk(14,'No'),...pages[1]];pages[1][1]={...pages[1][1],answered:'Yes'};ANS['11']='new';
 t=f(stores,pages,fetched,ANS);await t();console.log('run3 fetched',fetched, stores.qnaList.get('11').answeredHistory, stores.qnaDetail.get('11').answer);
})();

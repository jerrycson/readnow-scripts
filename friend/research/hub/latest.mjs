import {latestPublished} from './published-state.mjs';
const link=document.getElementById('latest'),status=document.getElementById('status'),viewer=document.getElementById('viewer');
const date=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});
let busy=false,last=null;
async function refresh(){
 if(busy||document.hidden)return;
 busy=true;
 try{
   const response=await fetch(new URL('releases.json',import.meta.url),{cache:'no-store',credentials:'omit'});
   if(!response.ok)throw Error('목록 응답 '+response.status);
   const {releases}=await response.json();
   const row=latestPublished(releases);
   if(!row)throw Error('공개 회차 없음');
   link.href=row.round>=38?'../../pixel-lab/round'+row.round+'.html':'./';
   link.textContent=row.label+' 열기 ↗';link.title=row.label;const stamp=Date.parse(row.at);last='자료 '+row.cards+'개'+(Number.isFinite(stamp)?' · 기록 '+date.format(stamp):'');status.textContent=last;viewer.hidden=row.round<38;document.getElementById('uiBuild').hidden=row.round!==49;viewer.href='./?lab=studio&ui=49-review-4c7e86d4';
 }catch{status.textContent=last?last+' · 최신판 재확인 중':'최신판 확인 대기 · 위 링크로 연구실을 열 수 있습니다.';}
 finally{busy=false;}
}
refresh();document.addEventListener('visibilitychange',refresh);window.addEventListener('online',refresh);setInterval(refresh,15000);

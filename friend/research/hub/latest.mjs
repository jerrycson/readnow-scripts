const link=document.getElementById('latest'),status=document.getElementById('status');
let busy=false,last=null;
async function refresh(){
 if(busy||document.hidden)return;
 busy=true;
 try{
   const response=await fetch(new URL('releases.json',import.meta.url),{cache:'no-store',credentials:'omit'});
   if(!response.ok)throw Error('목록 응답 '+response.status);
   const {releases}=await response.json();
   const row=releases.filter(r=>r.project==='bookfriend'&&Number.isSafeInteger(r.round)&&r.round>0&&typeof r.label==='string'&&Number.isSafeInteger(r.cards)).sort((a,b)=>b.round-a.round)[0];
   if(!row)throw Error('공개 회차 없음');
   link.href=row.round>=38?'../../pixel-lab/round'+row.round+'.html':'./';
   link.textContent=row.label+' 열기 ↗';last='자료 '+row.cards+'개';status.textContent=last;
 }catch{status.textContent=last?last+' · 최신판 재확인 중':'최신판 확인 대기 · 위 링크로 연구실을 열 수 있습니다.';}
 finally{busy=false;}
}
refresh();document.addEventListener('visibilitychange',refresh);window.addEventListener('online',refresh);setInterval(refresh,15000);

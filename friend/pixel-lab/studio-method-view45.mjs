import {entries} from './studio-evidence44.mjs';
import {methodSuggestion} from './studio-method45.mjs';
export function mountMethodChoice(){
  const parent=document.getElementById('sculptLearning44'),select=document.getElementById('method44');if(!parent||!select)return;
  const row=document.createElement('div'),label=document.createElement('span'),use=document.createElement('button');
  row.className='toolrow';use.type='button';use.hidden=true;row.append(label,use);parent.append(row);
  let version=0,method=null;
  async function update(){const ticket=++version;try{const rows=await entries(),subject=document.getElementById('subject').value,zone=document.getElementById('region').value;
    if(ticket!==version)return;const s=methodSuggestion(rows,subject,zone);method=s.method;use.hidden=!method;
    label.textContent='이 부위에서 두 방법을 모두 평가한 세션 '+s.episodes+'개';
    use.textContent=method==='direct-drag43'?'내 기록에 따라 직접 교정 선택':'내 기록에 따라 학습 교정 선택';
  }catch{if(ticket===version){method=null;use.hidden=true;label.textContent='선택 기록을 확인할 수 없습니다.';}}}
  use.onclick=()=>{if(!method)return;select.value=method;select.dispatchEvent(new Event('change',{bubbles:true}));};
  new MutationObserver(update).observe(document.getElementById('handleHelp'),{childList:true});
  if(typeof BroadcastChannel!=='undefined'){const ch=new BroadcastChannel('bookfriend-lab-evidence');ch.onmessage=update;}
  update();
}

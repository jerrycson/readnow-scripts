import {entries} from '../../pixel-lab/studio-evidence44.mjs';
import {preferenceScore} from '../../pixel-lab/studio-preference45.mjs';
const result=document.getElementById('preference45'),score=v=>v==null?'수집 중':v.toFixed(4);
async function refresh(){try{const m=preferenceScore(await entries());result.textContent='명시한 선택 '+m.pairs+'쌍 · 독립 편집 세션 '+m.episodes+'개 · 브라이어 점수(작을수록 좋음) 기준 '+score(m.baselineBrier)+' / 후보 '+score(m.candidateBrier)+(m.worseEpisodes==null?'':' · 악화 '+m.worseEpisodes+'세션')+' · '+m.status;}catch{result.textContent='선택 장부를 다시 읽어 주세요.';}}
if(typeof BroadcastChannel!=='undefined'){const ch=new BroadcastChannel('bookfriend-lab-evidence');ch.onmessage=refresh;}addEventListener('focus',refresh);refresh();
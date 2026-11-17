import {preferenceScore} from './studio-preference45.mjs';

export function methodSuggestion(rows,subject,zone){
  const candidates=rows.filter(r=>r.task==='surface'&&r.subject===subject&&r.zone===zone&&['direct','learned'].includes(r.method)&&['accepted','rejected','reverted'].includes(r.outcome));
  const methods=new Map();for(const r of candidates){if(!methods.has(r.episode))methods.set(r.episode,new Set());methods.get(r.episode).add(r.method);}
  const paired=candidates.filter(r=>methods.get(r.episode).size===2),m=preferenceScore(paired);
  if(m.episodes<3||m.worseEpisodes||!(m.candidateBrier<m.baselineBrier*.99))return {method:null,episodes:m.episodes};
  const direct=m.groups['surface|'+subject+'|direct'].acceptance,learned=m.groups['surface|'+subject+'|learned'].acceptance;
  return {method:direct===learned?null:direct>learned?'direct-drag43':'ridge-inverse44',episodes:m.episodes};
}

const base=new URL('./studio-frozen/',import.meta.url),cache=new Map();let manifestPromise;
export async function frozenManifest(){return manifestPromise??=(async()=>{const r=await fetch(new URL('manifest.json',base),{cache:'no-store'});if(!r.ok)throw Error('동결 판 목록 응답 '+r.status);return r.json();})();}
export async function loadFrozen(round,options={}){
 const manifest=options.rounds?options:options.manifest||await frozenManifest(),record=manifest.rounds.find(r=>r.round===Number(round));if(!record)throw Error('확인한 동결 모델이 없습니다: '+round);
 if(!cache.has(record.fingerprint))cache.set(record.fingerprint,(async()=>{const [renderer,settings,adult,chibi]=await Promise.all([import(new URL(record.renderer,base)),import(new URL(record.defaults,base)),record.studies?.adult?import(new URL(record.studies.adult,base)):null,record.studies?.chibi?import(new URL(record.studies.chibi,base)):null]);if(typeof renderer.renderPixels!=='function'||!settings.DEFAULTS)throw Error('동결 모델 계약 확인 필요');return {renderer,settings,adult,chibi};})());
 const {renderer,settings,adult,chibi}=await cache.get(record.fingerprint),mode=options.mode||record.defaultMode||'foundation';
 const scene=(s,o)=>mode==='study'&&(s.species===undefined||s.species==='human')?(Number(s.heads)>=5?adult?.continuousStudy(s):chibi?.chibiStudy(s)):null;
 const renderPixels=(s,o={})=>{const model=o.sceneOverride||scene(s,o);const result=renderer.renderPixels(s,model?{...o,sceneOverride:model}:o);result.frozen={round:record.round,mode:model?(Number(s.heads)>=5?'study-adult':'study-chibi'):'foundation',fingerprint:record.fingerprint};return result;};
 return {round:record.round,defaults:settings.DEFAULTS,renderPixels,foundationRenderPixels:renderer.renderPixels,bodyParts:mode==='study'?(s=>scene(s,{})||renderer.bodyParts?.(s)):renderer.bodyParts||null,fingerprint:record.fingerprint,record,mode,availableModes:Object.keys(record.studies||{}).length?['study','foundation']:['foundation']};
}
export async function renderFrozen(round,settingsPatch={},view={}){const model=await loadFrozen(round);return model.renderPixels({...model.defaults,...settingsPatch},view);}

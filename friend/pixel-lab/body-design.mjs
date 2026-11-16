// Independent design axes, not medical measurements or a complete taxonomy of people.
import {CHEST_BASE,CHEST_AXES} from './chest-design.mjs';
export const BODY_AXES=Object.freeze({adiposity:'지방의 부피',muscularity:'근육의 부피',shoulderWidth:'어깨 골격',pelvisWidth:'골반 골격',chestVolume:'가슴의 부피',waistCurve:'허리의 곡선',age:'나이 표현 · 성인~노년',legRatio:'다리 비율',...CHEST_AXES});
export const BODY_BASE=Object.freeze({adiposity:.35,muscularity:.35,shoulderWidth:.5,pelvisWidth:.5,chestVolume:.45,waistCurve:.5,age:0,legRatio:.5,...CHEST_BASE});
export const BODY_PRESETS=Object.freeze([
 {id:'balanced',name:'중간 체형',values:{}},
 {id:'slender',name:'마른 체형',values:{adiposity:.08,muscularity:.18,chestVolume:.15,waistCurve:.3}},
 {id:'lean',name:'날씬한 체형',values:{adiposity:.2,muscularity:.32,waistCurve:.55}},
 {id:'athletic',name:'탄탄한 체형',values:{adiposity:.23,muscularity:.7,shoulderWidth:.64}},
 {id:'muscular',name:'근육이 두드러진 체형',values:{adiposity:.18,muscularity:1,shoulderWidth:.8,waistCurve:.62}},
 {id:'powerful',name:'두껍고 힘있는 체형',values:{adiposity:.64,muscularity:.88,shoulderWidth:.75,pelvisWidth:.65,waistCurve:.24}},
 {id:'soft',name:'부드러운 체형',values:{adiposity:.62,muscularity:.15,waistCurve:.38}},
 {id:'full',name:'풍만한 체형',values:{adiposity:.9,muscularity:.28,chestVolume:.68,pelvisWidth:.7,waistCurve:.25}},
 {id:'rounded',name:'둥근 복부 체형',values:{adiposity:1,muscularity:.25,pelvisWidth:.45,waistCurve:0}},
 {id:'curved',name:'S곡선 체형',values:{adiposity:.42,muscularity:.35,chestVolume:.85,pelvisWidth:.9,waistCurve:1}},
 {id:'glamorous',name:'글래머러스 체형',values:{adiposity:.6,muscularity:.32,chestVolume:1,pelvisWidth:.85,waistCurve:.9}},
 {id:'straight',name:'직선적인 체형',values:{adiposity:.25,muscularity:.32,chestVolume:.12,waistCurve:.05,pelvisWidth:.25}},
 {id:'pear',name:'하체가 넓은 체형',values:{adiposity:.5,muscularity:.3,shoulderWidth:.2,pelvisWidth:1,waistCurve:.65}},
 {id:'broad',name:'어깨가 넓은 체형',values:{adiposity:.3,muscularity:.6,shoulderWidth:1,pelvisWidth:.2}},
 {id:'long',name:'긴 팔다리 체형',values:{adiposity:.22,muscularity:.3,legRatio:1,shoulderWidth:.35,pelvisWidth:.35}},
 {id:'compact',name:'짧고 단단한 체형',values:{adiposity:.48,muscularity:.6,legRatio:0,shoulderWidth:.65,pelvisWidth:.6}},
 {id:'older-lean',name:'노년 · 마른 체형',values:{age:1,adiposity:.18,muscularity:.18,chestVolume:.3}},
 {id:'older-soft',name:'노년 · 부드러운 체형',values:{age:1,adiposity:.64,muscularity:.2,waistCurve:.25}},
 {id:'older-active',name:'노년 · 탄탄한 체형',values:{age:1,adiposity:.3,muscularity:.7,shoulderWidth:.6}},
 {id:'mature',name:'중년 · 중간 체형',values:{age:.5,adiposity:.48,muscularity:.4}}
]);
export function bodyPreset(id){const p=BODY_PRESETS.find(p=>p.id===id);if(!p)throw new Error('알 수 없는 체형');return {...BODY_BASE,...p.values};}
export function bodyStyle(settings){return settings.heads<=4?'cute':settings.designStyle==='manga'?'manga':'natural';}

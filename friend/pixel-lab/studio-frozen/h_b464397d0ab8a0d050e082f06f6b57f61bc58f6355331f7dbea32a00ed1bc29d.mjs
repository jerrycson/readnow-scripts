// Adult female form studies. Independent artistic controls, not clinical classes.
export const CHEST_AXES=Object.freeze({breastRootWidth:'성인 여성형 · 가슴이 붙는 폭',breastProjection:'성인 여성형 · 가슴 돌출',breastUpperFullness:'성인 여성형 · 가슴 상부 볼륨',breastDrop:'성인 여성형 · 가슴의 아래 이동',breastSeparation:'성인 여성형 · 가슴 간격',breastSplay:'성인 여성형 · 가슴의 바깥 방향',breastAsymmetry:'성인 여성형 · 가슴의 좌우 차이'});
export const CHEST_BASE=Object.freeze({breastRootWidth:.5,breastProjection:.5,breastUpperFullness:.35,breastDrop:.3,breastSeparation:.5,breastSplay:.4,breastAsymmetry:.1});
export const CHEST_PRESETS=Object.freeze([
 {id:'balanced',name:'중간형',values:{}},
 {id:'shallow-wide',name:'넓게 붙는 낮은 볼륨',values:{breastRootWidth:.85,breastProjection:.15,breastUpperFullness:.2,chestVolume:.35}},
 {id:'compact',name:'좁은 바탕 · 앞쪽 돌출',values:{breastRootWidth:.15,breastProjection:.9,breastSeparation:.4,chestVolume:.45}},
 {id:'lower-full',name:'아래쪽에 볼륨이 모인 형태',values:{breastUpperFullness:.08,breastDrop:.55,breastProjection:.65,chestVolume:.75}},
 {id:'upper-full',name:'윗면 볼륨이 있는 형태',values:{breastUpperFullness:.92,breastDrop:.12,breastProjection:.65,chestVolume:.65}},
 {id:'wide-set',name:'간격이 넓고 바깥으로 향한 형태',values:{breastSeparation:.95,breastSplay:.9,breastRootWidth:.40}},
 {id:'close-set',name:'간격이 좁은 형태',values:{breastSeparation:.08,breastSplay:.05,breastRootWidth:.4}},
 {id:'lower-hanging',name:'낮게 내려오는 부드러운 형태',values:{breastDrop:.95,breastUpperFullness:.1,breastProjection:.55,chestVolume:.8}},
 {id:'asymmetric',name:'완만한 좌우 차이',values:{breastAsymmetry:.8,breastUpperFullness:.25,chestVolume:.55}}
]);
export function chestPreset(id){const p=CHEST_PRESETS.find(p=>p.id===id);if(!p)throw new Error('알 수 없는 가슴 형태');return {...CHEST_BASE,...p.values};}

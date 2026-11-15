export const ACTION_SUPPORT={
 human:['idle','walk','run','wave','sit','look','reach','sleep','kick'],
 fox:['idle','walk','run','sit','look'],cat:['idle','walk','run','sit','look'],
 bird:['idle','walk','run','wave','sit'],drake:['idle','walk','run','wave','sit','look'],
 golem:['idle','walk','run','wave','sit'],robot:['idle','walk','run','wave','sit'],alien:['idle','walk','run','wave','sit']
};
export const PRESETS=[
 {name:'면 셔츠와 바지',note:'넓은 면 · 짧은 소매 · 허리띠',settings:{species:'human',heads:6,sex:'male',top:'shirt',bottom:'trousers',hair:'crop',fabric:'cotton',outfitColor:'moss',accessory:'none'}},
 {name:'울 코트와 가방',note:'두꺼운 옷깃 · 소매와 겹침',settings:{species:'human',heads:7,sex:'female',top:'coat',bottom:'trousers',hair:'bob',fabric:'wool',outfitColor:'ochre',accessory:'satchel'}},
 {name:'실크와 긴 머리',note:'좁은 밝은 주름 · 드리운 머리 덩어리',settings:{species:'human',heads:7,sex:'female',top:'shirt',bottom:'skirt',hair:'long',fabric:'silk',outfitColor:'navy',accessory:'none'}},
 {name:'가죽 탐험복',note:'부분 광택 · 고글 · 묶은 머리',settings:{species:'human',heads:5,sex:'male',top:'coat',bottom:'trousers',hair:'ponytail',fabric:'leather',outfitColor:'ochre',accessory:'goggles'}},
 {name:'금속 갑옷',note:'강한 명암 · 금속 테두리',settings:{species:'human',heads:6,sex:'female',top:'armor',bottom:'trousers',hair:'crop',fabric:'cotton',outfitColor:'navy',accessory:'none'}},
 {name:'작은 독서 친구',note:'3등신 · 짧은 코트 · 목도리',settings:{species:'human',heads:3,sex:'female',top:'coat',bottom:'skirt',hair:'bob',fabric:'wool',outfitColor:'moss',accessory:'scarf'}},
 {name:'여우',note:'길쭉한 주둥이 · 큰 귀 · 부푼 꼬리',settings:{species:'fox',accessory:'scarf'}},
 {name:'고양이',note:'짧은 주둥이 · 둥근 머리 · 가는 꼬리',settings:{species:'cat',accessory:'none'}},
 {name:'새',note:'가벼운 몸통 · 날개 · 세 갈래 발',settings:{species:'bird',outfitColor:'navy',accessory:'none'}},
 {name:'작은 용',note:'네 발 · 날개막 · 등 돌기',settings:{species:'drake',accessory:'none'}},
 {name:'숲의 골렘',note:'큰 하중 면 · 돌 · 자라난 잎',settings:{species:'golem',accessory:'none'}},
 {name:'탐사 로봇',note:'상자형 몸 · 회전 관절 · 표시등',settings:{species:'robot',outfitColor:'navy',accessory:'none'}},
 {name:'외계 탐험가',note:'큰 두개부 · 네 팔 · 감각 돌기',settings:{species:'alien',accessory:'none'}}
];
export const BARE={species:'human',top:'none',bottom:'none',hair:'none',accessory:'none'};

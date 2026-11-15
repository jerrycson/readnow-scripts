// 새 프로젝트의 독립 데이터 계약. 기존 캐릭터의 코드·좌표·이름을 사용하지 않는다.
import {BODY_BASE,BODY_AXES} from './body-design.mjs';
import {FACIAL_OPTIONS} from './facial.mjs';
import {HAIR_DESIGNS} from './hair-design.mjs';
export const VERSION=1;
export const ANGLES=Object.freeze(Array.from({length:8},(_,i)=>i*45));
export const HEADS=Object.freeze([2,3,4,5,6,7,8]);
export const CANDIDATES=Object.freeze({A:'A · 단순 구조',B:'B · 균형 구조',C:'C · 굵은 실루엣'});
export const SPECIES=Object.freeze({human:'사람',fox:'여우',cat:'고양이',bird:'새',drake:'작은 용',golem:'숲의 골렘',robot:'탐사 로봇',alien:'외계 탐험가'});
export const ACTIONS=Object.freeze({idle:'숨 쉬기',walk:'걷기',run:'달리기',wave:'손 흔들기',sit:'앉기',look:'살펴보기',reach:'손 뻗기',sleep:'잠들기',kick:'공 차기'});
export const APPEARANCE=Object.freeze({species:Object.keys(SPECIES),designStyle:['natural','manga'],build:['balanced','slim','strong'],top:['none','shirt','coat','armor'],bottom:['none','trousers','skirt'],fabric:['cotton','wool','silk','leather'],hair:['none','crop','bob','long','ponytail',...HAIR_DESIGNS.map(x=>x.id)],accessory:['none','satchel','scarf','goggles'],outfitColor:['moss','navy','ochre']});
export const DEFAULTS=Object.freeze({heads:5,sex:'female',candidate:'B',resolution:96,scale:4,palette:'clay',motion:true,grid:false,speed:1,species:'human',designStyle:'natural',...BODY_BASE,faceShape:0,eyeShape:3,noseShape:1,mouthShape:0,earShape:0,build:'balanced',top:'none',bottom:'none',fabric:'cotton',hair:'none',accessory:'none',outfitColor:'moss'});
export function normalizeAngle(n){return ((Math.round(Number(n)/45)*45)%360+360)%360;}
export function validateSettings(value){
 const s={...DEFAULTS,...value};
 if(!HEADS.includes(s.heads))throw new Error('등신은 2부터 8 사이의 정수로 골라 주세요.');
 if(!['male','female'].includes(s.sex))throw new Error('기본형을 다시 골라 주세요.');
 if(!Object.hasOwn(CANDIDATES,s.candidate))throw new Error('알 수 없는 시안입니다.');
 if(![48,64,96,128].includes(s.resolution))throw new Error('지원하는 원본 크기는 48·64·96·128px입니다.');
 if(![2,3,4,5,6].includes(s.scale))throw new Error('표시 배율은 정수 2~6배입니다.');
 if(!['clay','amber','umber'].includes(s.palette))throw new Error('알 수 없는 팔레트입니다.');
 if(typeof s.motion!=='boolean'||typeof s.grid!=='boolean')throw new Error('표시 설정을 확인해 주세요.');
 if(![0.5,1,1.5].includes(s.speed))throw new Error('걷기 속도를 확인해 주세요.');
 for(const [key,values]of Object.entries(APPEARANCE))if(!values.includes(s[key]))throw new Error('모양 설정을 다시 골라 주세요: '+key);
 for(const key of Object.keys(BODY_AXES))if(!Number.isFinite(s[key])||s[key]<0||s[key]>1)throw new Error('체형 범위는 0~1입니다: '+key);
 for(const [key,values]of Object.entries(FACIAL_OPTIONS))if(!Number.isInteger(s[key])||!values[s[key]])throw new Error('얼굴 모양 번호를 확인해 주세요: '+key);
 return Object.fromEntries(Object.keys(DEFAULTS).map(k=>[k,s[k]]));
}
export function createProfile(id,name,sex='female',now=Date.now()){
 if(typeof id!=='string'||!id)throw new Error('친구 식별자가 필요합니다.');
 return {id,schema:VERSION,revision:0,name:validName(name),createdAt:now,settings:validateSettings({sex}),experience:{care:0,exploration:0,practice:0},events:[]};
}
export function validName(value){const name=String(value??'').trim();if(!name||Array.from(name).length>24)throw new Error('이름은 1~24자로 적어 주세요.');return name;}
export function validateProfile(p){
 if(!p||p.schema!==VERSION||typeof p.id!=='string'||!Number.isInteger(p.revision)||p.revision<0)throw new Error('저장 형식을 확인할 수 없습니다. 원본을 덮어쓰지 않습니다.');
 validName(p.name);validateSettings(p.settings);
 if(!p.experience||!['care','exploration','practice'].every(k=>Number.isFinite(p.experience[k])&&p.experience[k]>=0)||!Array.isArray(p.events))throw new Error('경험 기록이 손상되었습니다.');
 return p;
}
export function recordExperience(profile,kind,now=Date.now(),eventId=String(now)){
 validateProfile(profile);if(!['care','exploration','practice'].includes(kind))throw new Error('지원하지 않는 경험입니다.');
 if(profile.events.some(e=>e.id===eventId))return profile;
 return {...profile,experience:{...profile.experience,[kind]:profile.experience[kind]+1},events:[...profile.events,{id:eventId,kind,at:now}]};
}
export function experienceText(p){const e=p.experience,total=e.care+e.exploration+e.practice;if(!total)return '아직 경험이 쌓이지 않았어요.';return `돌봄 ${e.care} · 탐색 ${e.exploration} · 연습 ${e.practice}회. 성격을 확정하지 않고 경험으로 남깁니다.`;}
export function rotationStates(){return ANGLES.flatMap(pitch=>ANGLES.map(yaw=>({yaw,pitch})));}
export function baseSamples(){return ['male','female'].flatMap(sex=>HEADS.map(heads=>({sex,heads})));}
export function walkPosition(x,delta,min,max){return Math.max(min,Math.min(max,x+delta));}
export function groundHeight(center,width){
 const u=width>0?center/width:0;
 const rise=u<.52||u>.88?0:u<.58?(u-.52)/.06:u<=.82?1:(.88-u)/.06;
 return 38+70*Math.max(0,Math.min(1,rise));
}

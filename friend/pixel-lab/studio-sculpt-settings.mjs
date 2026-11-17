import {subjects,axes,zero,defaultBase,defaultView,pivotChoices,pivotSpec} from './studio-sculpt-model.mjs';
export const format='bookfriend-sculpt-1';
export const initial=id=>({format,subject:id,base:defaultBase(id),values:zero(id),view:defaultView(id)});
function keys(value,fields){
  return value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===fields.length&&fields.every(k=>Object.hasOwn(value,k));
}
export function validatePreset(p){
  if(!keys(p,['format','subject','base','values','view'])||p.format!==format||typeof p.subject!=='string'||!Object.hasOwn(subjects,p.subject)||!['prior','candidate'].includes(p.base))throw Error('지원하는 조형 설정 형식·인물·기준을 확인해 주세요.');
  if(!keys(p.values,Object.keys(axes(p.subject)))||Object.values(p.values).some(v=>!Number.isInteger(v)||Math.abs(v)>100))throw Error('조절값은 이 모델의 축마다 −100~100 사이 정수여야 합니다.');
  if(!keys(p.view,['yaw','pitch','zoom','size','pivot','angle']))throw Error('시점과 피봇 설정이 완전하지 않습니다.');
  const {yaw,pitch,zoom,size,pivot,angle}=p.view;
  if(!pivotChoices(p.subject).includes(pivot)||!Number.isInteger(angle)||angle<pivotSpec(pivot).min||angle>pivotSpec(pivot).max)throw Error('기존 관절의 피봇 한계를 확인해 주세요.');
  if(![yaw,pitch,zoom].every(Number.isFinite)||Math.abs(yaw)>180||Math.abs(pitch)>90||zoom<.5||zoom>2.5||![48,96,192].includes(size))throw Error('지원하는 각도·확대·해상도 범위를 확인해 주세요.');
  return {format,subject:p.subject,base:p.base,values:{...p.values},view:{yaw,pitch,zoom,size,pivot,angle}};
}
const sameShape=(a,b)=>a.base===b.base&&Object.keys(a.values).every(k=>a.values[k]===b.values[k]);
const shape=p=>({base:p.base,values:{...p.values}});
export class SculptSession {
  constructor(id){this.current=initial(id);this.past=[];this.future=[];this.start=null;}
  preview(values){this.start??=shape(this.current);this.current={...this.current,values:{...values}};}
  commit(){
    if(!this.start)return;
    if(!sameShape(this.start,this.current)){this.past.push(this.start);if(this.past.length>80)this.past.shift();this.future=[];}
    this.start=null;
  }
  apply(p){this.commit();this.start=shape(this.current);this.current=validatePreset(p);this.commit();}
  step(back){
    this.commit();const from=back?this.past:this.future,to=back?this.future:this.past;
    if(!from.length)return;
    to.push(shape(this.current));this.current={...this.current,...from.pop()};
  }
}

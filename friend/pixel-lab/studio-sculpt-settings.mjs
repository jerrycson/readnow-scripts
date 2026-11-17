import {subjects,axes,zero,defaultBase,defaultView,pivotChoices,pivotSpec} from './studio-sculpt-model.mjs';
import {validatePerformance} from './performance49.mjs';
export const performanceFormat='bookfriend-sculpt-2';
export const format='bookfriend-sculpt-1';
export const observationSizes=Object.freeze([48,96,192,256,512]);
export const initial=id=>({format,subject:id,base:defaultBase(id),values:zero(id),view:defaultView(id)});
function keys(value,fields){
  return value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===fields.length&&fields.every(k=>Object.hasOwn(value,k));
}
export function validatePreset(p){
  const extended=p?.format===performanceFormat;
  const fields=['format','subject','base','values','view'];if(extended)fields.push('performance');
  if(!keys(p,fields)||(!extended&&p.format!==format)||typeof p.subject!=='string'||!Object.hasOwn(subjects,p.subject)||!['prior','candidate','round47','round48',...(extended?['round49']:[])].includes(p.base))throw Error('지원하는 조형 설정 형식·인물·기준을 확인해 주세요.');
  if(!keys(p.values,Object.keys(axes(p.subject)))||Object.values(p.values).some(v=>!Number.isInteger(v)||Math.abs(v)>100))throw Error('조절값은 이 모델의 축마다 −100~100 사이 정수여야 합니다.');
  if(!keys(p.view,['yaw','pitch','zoom','size','pivot','angle']))throw Error('시점과 피봇 설정이 완전하지 않습니다.');
  const {yaw,pitch,zoom,size,pivot,angle}=p.view;
  if(!pivotChoices(p.subject).includes(pivot)||!Number.isInteger(angle)||angle<pivotSpec(pivot).min||angle>pivotSpec(pivot).max)throw Error('기존 관절의 피봇 한계를 확인해 주세요.');
  if(![yaw,pitch,zoom].every(Number.isFinite)||Math.abs(yaw)>180||Math.abs(pitch)>180||zoom<.5||zoom>2.5||!observationSizes.includes(size))throw Error('지원하는 각도·확대·해상도 범위를 확인해 주세요.');
  return {format:p.format,subject:p.subject,base:p.base,values:{...p.values},view:{yaw,pitch,zoom,size,pivot,angle},...(extended?{performance:validatePerformance(p.subject,p.performance)}:{})};
}
const sameShape=(a,b)=>a.format===b.format&&a.base===b.base&&JSON.stringify(a.performance)===JSON.stringify(b.performance)&&Object.keys(a.values).every(k=>a.values[k]===b.values[k]);
const shape=p=>({format:p.format,base:p.base,values:{...p.values},performance:p.performance?{...p.performance}:undefined});
export class SculptSession {
  constructor(id){this.current=initial(id);this.past=[];this.future=[];this.start=null;}
  preview(values){this.start??=shape(this.current);this.current={...this.current,values:{...values}};}
  previewPerformance(values){this.start??=shape(this.current);this.current={...this.current,format:performanceFormat,performance:validatePerformance(this.current.subject,values)};}
  commit(){
    if(!this.start)return;
    if(this.start.restoreView||!sameShape(this.start,this.current)){this.past.push(this.start);if(this.past.length>80)this.past.shift();this.future=[];}
    this.start=null;
  }
  apply(p){
    const next=validatePreset(p);this.commit();this.start=shape(this.current);
    if(next.format===performanceFormat&&Object.keys(next.view).some(k=>next.view[k]!==this.current.view[k]))this.start.restoreView={...this.current.view};
    this.current=next;this.commit();
  }
  step(back){
    this.commit();const from=back?this.past:this.future,to=back?this.future:this.past;
    if(!from.length)return;
    const previous=from.pop(),{restoreView,...settings}=previous,backup=shape(this.current);
    if(restoreView)backup.restoreView={...this.current.view};
    to.push(backup);this.current={...this.current,...settings,view:restoreView||this.current.view};
    if(this.current.performance===undefined)delete this.current.performance;
  }
}

import {prepareDefinition,renderDefinitionView} from './definition-model.mjs';
import {applyBody52,bodyPresets52} from './body-composition52.mjs';
import {applyTorso53} from './torso53.mjs';
import {plantFeet55} from './planted-leg55.mjs';
import {plantFeetKnee57} from './knee-surface57.mjs';
const $=id=>document.getElementById(id),state={id:'male-5',form:'balanced',size:96,depth:0,yaw:45,new:true},history=[];let study,rest;
function base(){study=prepareDefinition(state.id);rest=applyTorso53(study,applyBody52(study,bodyPresets52.find(p=>p.id===state.form).values,study.scene),{pelvisJoin53:true});}
function change(values){history.push({...state});Object.assign(state,values);if(values.id||values.form)base();draw();}
const labels={'male-5':'남5','female-6':'여6','male-7':'남7','male-8':'남8',balanced:'균형',slender:'마른형',muscular:'근육형',full:'지방형',powerful:'근육·지방형'};
for(const [group,key,options]of [['subjects','id',['male-5','female-6','male-7','male-8']],['forms','form',bodyPresets52.map(p=>p.id)],['sizes','size',[48,96,1024]]])for(const value of options){const b=document.createElement('button');b.textContent=labels[value]||String(value);b.onclick=()=>change({[key]:value});b.dataset.value=value;b.dataset.key=key;$(group).append(b);}
function draw(){const raw={depth:state.depth,kneeSurface:true},a=plantFeet55(rest,raw),b=state.new?plantFeetKnee57(rest,{...raw,kneeSurface57:true}):a;
 for(const [id,scene]of [['old',a],['next',b]]){const r=renderDefinitionView(study,scene,{yaw:state.yaw,pitch:0,size:state.size,framing:'body'}),c=$(id);c.width=c.height=state.size;c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(r.data),state.size,state.size),0,0);}
 $('depth').value=state.depth;$('yaw').value=state.yaw;$('new').checked=state.new;document.querySelectorAll('[data-key]').forEach(b=>b.setAttribute('aria-pressed',String(String(state[b.dataset.key])===b.dataset.value)));$('status').textContent=`${state.id} / ${state.form} / ${state.size}×${state.size} / 회전 ${state.yaw}° / 굽힘 ${state.depth} / 연구 시안 ${state.new?'켬':'끔'}`;window.kneeReview57={state:{...state},weights:b.knee57?.weights||null};}
for(const key of ['depth','yaw'])$(key).oninput=e=>change({[key]:Number(e.target.value)});$('first').onclick=()=>change({depth:.000001});$('reset').onclick=()=>change({depth:0});$('new').onchange=e=>change({new:e.target.checked});$('undo').onclick=()=>{const old=history.pop();if(old){Object.assign(state,old);base();draw();}};
let drag;for(const c of [$('old'),$('next')]){c.onpointerdown=e=>{drag={x:e.clientX,yaw:state.yaw};c.setPointerCapture(e.pointerId);history.push({...state});};c.onpointermove=e=>{if(drag){state.yaw=Math.max(-180,Math.min(180,drag.yaw+(e.clientX-drag.x)));draw();}};c.onpointerup=c.onpointercancel=()=>drag=null;}
base();draw();

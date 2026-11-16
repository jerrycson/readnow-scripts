import {writeFile} from 'node:fs/promises';
import {DEFAULTS,rotationStates} from '../model.mjs';
import {renderPixels} from '../renderer.mjs';
import {renderPixels as beforePixels} from '../compare/renderer-v3.mjs';
import {ACTION_SUPPORT} from '../catalog.mjs';
const assert=(ok,message)=>{if(!ok)throw new Error(message);};const report={version:4,results:[]};
function test(name,fn){try{report.results.push({name,ok:true,detail:fn()});}catch(e){report.results.push({name,ok:false,error:e.message});}}
function overlap(a,b){let intersection=0,union=0;for(let i=3;i<a.data.length;i+=4){if(a.data[i]||b.data[i])union++;if(a.data[i]&&b.data[i])intersection++;}return intersection/union;}
test('변경한 동물·용 4종의 48·96px 전 방향',()=>{let renders=0;for(const species of ['fox','cat','bird','drake'])for(const resolution of [48,96])for(const angle of rotationStates()){const im=renderPixels({...DEFAULTS,species,resolution},angle);assert(im.metrics.opaque>20&&!im.metrics.clipped,JSON.stringify({species,resolution,angle}));renders++;}return {renders};});
test('지원 동작 8시점·네 방향의 48·96px',()=>{let renders=0;for(const species of ['fox','cat','bird','drake'])for(const action of ACTION_SUPPORT[species])for(const resolution of [48,96])for(let i=0;i<8;i++)for(const yaw of [0,90,180,270]){const im=renderPixels({...DEFAULTS,species,resolution},{yaw,action,phase:i*Math.PI/4});assert(im.metrics.opaque>20&&!im.metrics.clipped,JSON.stringify({species,action,resolution,i,yaw}));renders++;}return {renders};});
test('여우와 고양이의 실루엣 비교',()=>{const rows=[];for(const yaw of [0,45,90,135,180]){const pair=fn=>['fox','cat'].map(species=>fn({...DEFAULTS,species,resolution:96},{yaw}));const before=overlap(...pair(beforePixels)),after=overlap(...pair(renderPixels));assert(after<.94,'색 없이 구별하기 어려운 윤곽');rows.push({yaw,before,after});}return {rows,meaning:'lower overlap means different silhouette, not higher artistic quality'};});
report.passed=report.results.filter(x=>x.ok).length;report.total=report.results.length;await writeFile(new URL('./animal-tests.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;

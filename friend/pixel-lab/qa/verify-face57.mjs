import fs from 'node:fs';
import {loadRig} from '../rig32.mjs';
import {prepareDefinition} from '../definition-model.mjs';
import {candidateFace54} from '../face54.mjs';
import {candidateFace55} from '../face55.mjs';
import {candidateFace56} from '../face56.mjs';
import {expressMouth49} from '../face49.mjs';
import {form34} from '../bust34.mjs';
import {verifyFace57} from './face57.mjs';
const root=new URL('../',import.meta.url),read=name=>JSON.parse(fs.readFileSync(new URL(name,root),'utf8'));
const assets={atlas:read('atlas35.json'),traces:read('traces36.json'),fit:read('fit36.json')},report=[];
await loadRig();
for(const id of ['F02','M01']){
 const study=prepareDefinition(id,assets),neutral=study.model.round49;
 const prior=candidateFace54(neutral,id,study.settings,'study'),lateral=candidateFace55(prior,id,neutral,form34(study.settings),'lateral');
 const input=id==='F02'?candidateFace56(lateral,id,'fern05'):expressMouth49(lateral,.35,0);
 report.push({input:'회차 표정',...verifyFace57(input,id,id==='F02'?585:581)});
 report.push({input:'49차 중립',...verifyFace57(neutral,id)});
}
console.log(JSON.stringify({report,scope:'입술 이외 표면 보존·원형 불변·유효 좌표 계약. 미적 승인 아님.'}));

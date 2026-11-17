import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {prepareDefinition,renderDefinitionView} from '../definition-model.mjs';
import {createFaceStudy50,faceOptions50} from '../face-library50.mjs';
import {loadRig} from '../rig32.mjs';
import {fitResearchHead52} from '../head-fit52.mjs';
import {applyBody52} from '../body-composition52.mjs';
import {placeResearchHair52} from '../hair-anchor52.mjs';
import {shade,materialLibrary} from '../materials.mjs';
import {buildHair52} from '../hair-sheet52.mjs';
import {addDesignedHair} from '../hair-design.mjs';
const path=new URL('../',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f+'.json',path),'utf8').replace(/^\uFEFF/,''));
const assets={atlas:read('atlas35'),fit:read('fit36'),traces:read('traces36')};
await loadRig();
const faces=Object.fromEntries(faceOptions50.map(q=>[q.id,createFaceStudy50(q.id,assets)]));
const sha=b=>createHash('sha256').update(b).digest('hex');
const point=p=>p.map(x=>Math.round(1e8*x)).join(',');
const edge=(a,b)=>[point(a),point(b)].sort().join('/');
const diff=(p,q)=>p.map((v,k)=>v-q[k]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(p,q)=>p.reduce((s,v,k)=>s+v*q[k],0);
function boundaries(mesh){
  const edges=new Map();
  for(const f of mesh.faces)for(let k=0;k<3;k++){
    const a=mesh.vertices[f[k]],b=mesh.vertices[f[(k+1)%3]];
    if(point(a.p)===point(b.p))continue;
    const e=edge(a.p,b.p);edges.set(e,(edges.get(e)??0)+1);
  }
  return edges;
}
function geom(m,f){const [a,b,c]=f.map(i=>m.vertices[i].p);return cross(diff(b,a),diff(c,a));}
const deg=[0,45,90,160];
const rows=[],diffPixels=(a,b)=>{let n=0;for(let i=0;i<a.data.length;i+=4)if([0,1,2,3].some(k=>Math.abs(a.data[i+k]-b.data[i+k])>=8))n++;return n;};
function pixel(study,scene,yaw,size){return renderDefinitionView(study,scene,{size,yaw,pitch:yaw===160?-12:0,framing:'face'});}
for(const sex of ['female','male'])for(let n=2;n<=8;n++){
 const study=prepareDefinition(sex+'-'+n,assets),native=study.scene,i=native.parts.findIndex(m=>m.name==='head');
 const original48=deg.map(y=>pixel(study,native,y,48));
 const shaped=applyBody52(study,{muscularity:.92,adiposity:.78});
 assert.throws(()=>fitResearchHead52(study,native,faces[sex==='male'?'F02':'M01']),RangeError);
 for(const f of Object.values(faces).filter(f=>f.settings.sex===sex)){
  const result=fitResearchHead52(study,native,f),j=result.headFit52;
  const body=result.parts.slice(0,i),neck=body.find(m=>m.name==='neck'),oldNeck=native.parts.find(m=>m.name==='neck');
  const tr=result.parts.find(m=>m.name==='head-fit-throat52'),bridge=result.parts.find(m=>m.name==='head-fit-neck52');
  assert.equal(fitResearchHead52(study,result,null),native);const newBody=fitResearchHead52(study,shaped,f);
  assert.equal(fitResearchHead52(study,newBody,null),shaped);
  assert.equal(result.joints,native.joints);assert.equal(result.feet,native.feet);assert.equal(bridge.mat,neck.mat);
  for(let k=0;k<i;k++)if(native.parts[k]!==oldNeck){assert.equal(body[k],native.parts[k]);assert.equal(newBody.parts[k],shaped.parts[k]);}
  assert.deepEqual(neck.faces,oldNeck.faces.filter(t=>t.every(a=>oldNeck.vertices[a].p[1]<=j.cutY+1e-7)));assert.equal(neck.vertices,oldNeck.vertices);
  const neckEdges=boundaries(neck),upperEdges=boundaries(tr),bridgeEdges=boundaries(bridge);
  let lowerClosed=0,upperClosed=0;
  for(const [k,v]of bridgeEdges)if(v===1){if(neckEdges.get(k)===1)lowerClosed++;else if(upperEdges.get(k)===1)upperClosed++;else throw Error('불일치하는 접합 가장자리 '+k);}
  assert.equal(lowerClosed,j.baseRing);assert.equal(upperClosed,j.donorRing);
  const nativeSkin=materialLibrary(study.settings).skin,seamSkin=result.studyMaterials['head-fit-skin52'];
  for(const v of bridge.vertices)for(const hd of [true,false])assert.deepEqual(shade(nativeSkin,v.n,v.p,hd?1024:48,1,hd),shade(seamSkin,v.n,v.p,hd?1024:48,1,hd));
  const seen=new Set();for(const m of result.parts.slice(i)){
   if(seen.has(m.vertices))continue;seen.add(m.vertices);
   assert.ok(m.vertices.every(v=>v.p.every(Number.isFinite)&&v.n.every(Number.isFinite)&&Math.hypot(...v.n)>.96));
  }
  let inverted=0,minArea=Infinity;for(const t of bridge.faces){const v=t.map(i=>bridge.vertices[i]),normal=geom(bridge,t);minArea=Math.min(minArea,Math.hypot(...normal)/2);if(dot(normal,v[0].n.map((a,k)=>a+v[1].n[k]+v[2].n[k]))<0)inverted++;}
  assert.ok(minArea>1e-10);assert.equal(inverted,0);
  const frames=deg.map((yaw,k)=>diffPixels(original48[k],pixel(study,result,yaw,48)));
  assert.ok(frames.every(v=>v>0));
  assert.equal(sha(pixel(study,fitResearchHead52(study,result,null),0,48).data),sha(original48[0].data));
  const refs=f.scene.parts.filter(m=>m.name==='portrait-skin34'),final=result.parts.filter(m=>m.name==='portrait-skin34');
  let opposed=0,den=0;for(let k=0;k<refs.length;k++)for(let a=0;a<refs[k].faces.length;a++){
    const v=geom(refs[k],refs[k].faces[a]),w=geom(final[k],final[k].faces[a]);if(Math.hypot(...v)<1e-8)continue;den++;if(dot(v,w)<=0)opposed++;
  }
  const yFloor=Math.min(...oldNeck.vertices.map(v=>v.p[1]));
  let lowerPixelsCompared=0,lowerPixelsChanged=0;
  for(const yaw of [0,90]){
    const options={size:128,yaw,pitch:0,framing:'model'};
    const a=renderDefinitionView(study,native,options),b=renderDefinitionView(study,result,options);
    const bottom=Math.ceil(a.height*.5+(a.projection.center[1]-yFloor)*a.projection.scale)+1;
    for(let k=4*bottom*a.width;k<a.data.length;k+=4){
      if(!a.data[k+3]&&!b.data[k+3])continue;lowerPixelsCompared++;
      if([0,1,2,3].some(c=>a.data[k+c]!==b.data[k+c]))lowerPixelsChanged++;
    }
  }
  assert.equal(lowerPixelsChanged,0);assert.ok(lowerPixelsCompared>100);
  rows.push({lowerPixelsCompared,lowerPixelsChanged,body:study.id,face:f.id,nativeTrianglesPreserved:body.reduce((sum,m)=>sum+m.faces.length,0),lowerClosed,upperClosed,connectorTriangles:bridge.faces.length,connectorAreaMin:minArea,connectorOpposed:inverted,donorFacesCompared:den,donorNormalTurnsOver90:opposed,pixel48:frames});
 }
 console.log(study.id,'완료');
}
const hair=[];
for(const [n,id,generator,tag] of [[2,'f15',addDesignedHair,'기존 33파트'],[8,'f15',addDesignedHair,'기존 33파트'],
  ...[2,3,4,5,6,7,8].flatMap(n=>['f01','f11','f15'].map(id=>[n,id,buildHair52,'52 연속면']))]){
 const b=prepareDefinition('female-'+n,assets),f=faces.F02,extra=placeResearchHair52(f.scene,f.scene,id,generator,8);
 const origin=fitResearchHead52(b,b.scene,f,extra,{hairGround:'source'}),m=fitResearchHead52(b,b.scene,f,extra);
 const from=extra.parts.slice(f.scene.parts.length),on=m.parts.slice(-from.length),old=origin.parts.slice(-from.length);
 assert.ok(from.every((p,i)=>p.faces===on[i].faces&&p.name===on[i].name&&p.mat===on[i].mat));
 let lowest=Infinity,refMin=Infinity,changed=0,upper=0,elsewhere=0;
 for(let i=0;i<old.length;i++)for(let j=0;j<old[i].vertices.length;j++){
  const a=old[i].vertices[j].p,b=on[i].vertices[j].p;lowest=Math.min(lowest,b[1]);refMin=Math.min(refMin,a[1]);
  if(a[1]!==b[1]){changed++;if(a[1]>=n-1-.10)upper++;}
  if(a[0]!==b[0]||a[2]!==b[2])elsewhere++;
 }
 assert.ok(lowest>=-1e-8);assert.equal(upper+elsewhere,0);assert.equal(changed===0,refMin>=0);
 const a=renderDefinitionView(b,origin,{size:48,yaw:90}),c=renderDefinitionView(b,m,{size:48,yaw:90});
 const pixels=diffPixels(a,c);
 if(!changed)assert.equal(pixels,0);
 hair.push({n,id,generator:tag,parts:on.length,triangles:on.reduce((sum,q)=>sum+q.faces.length,0),sourceMin:refMin,lowestY:lowest,changed,rootOrXZChanged:upper+elsewhere,pixel48:pixels});
}
const geometryModule=fs.readFileSync(new URL('head-fit52.mjs',path));
const hairModule=fs.readFileSync(new URL('hair-sheet52.mjs',path));
const inputHashes={headFit:sha(geometryModule),hairSheet:sha(hairModule),hairAnchor:sha(fs.readFileSync(new URL("hair-anchor52.mjs",path))),scalpClearance:sha(fs.readFileSync(new URL("scalp-clearance52.mjs",path)))};
const summary={inputHashes,round:52,scope:'중립 14몸체 × 같은 성별 4얼굴. 최초 전신 머리 접합. 51/52 얼굴 보정 미적용.',angles:deg.map(yaw=>[yaw,yaw===160?-12:0]),rows,hair};
if(process.argv.includes('--record'))fs.writeFileSync(new URL('head-fit-eval52.json',path),JSON.stringify(summary,null,2)+'\n');
else assert.deepEqual(summary,read('head-fit-eval52'));
console.log('56종, 네 방향 224회, 56개 체형 병행 복원, 머리카락 추가 검증',hair.filter(x=>x.changed));


if(!process.argv.includes('--record')){
 const renders=read('head-fit-renders52');
 assert.equal(renders.head1024.length,32);assert.ok(renders.head1024.every(v=>v.pixels1024>0));
 for(const [file,digest] of Object.entries({...renders.plates,...renders.inputs}))assert.equal(sha(fs.readFileSync(new URL(file,path))),digest,file);
 for(const trial of renders.hair1024){
  const ref=hair.find(m=>m.n===trial.n&&m.id===trial.id&&m.generator===(trial.tag==='legacy'?'기존 33파트':'52 연속면'));
  assert.ok(ref);assert.ok(Math.abs(ref.sourceMin-trial.metadata.sourceMin)<1e-7);
  assert.equal(ref.changed,trial.metadata.changed);assert.equal(trial.pixels1024>0,ref.changed>0);
 }
 assert.ok(renders.browser.every(row=>row.changed&&row.displayed===row.size&&!row.restoreMismatch));
 assert.equal(read('head-fit-note52').length,2);
}

import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {syntheticHead,syntheticMesh} from './photo-heads44.mjs';
import {views,SIZE,camera,extent,reconstruct} from '../hull36.mjs';
import {MODEL_VERSION,acceptsFive,reconstructPhoto} from '../photo-ml44.mjs';
import {scanImage} from '../scan-view36.mjs';
if(!globalThis.ImageData)globalThis.ImageData=class{constructor(data,width,height){Object.assign(this,{data,width,height});}};
const n=SIZE,scale=.797*n,clean={cx:n/2,cy:n/2,scale},weights=new URL('../photo-weights44.mjs',import.meta.url);
const targets=[[13,0],[23,0],[62,0],[112,0],[-27,-12],[-68,18]];
const upperRows=Math.round(n*.54);
const heldSeeds=[760001,138861,922023,421009,938873,345991,103791,559003];
const figures=[];
const mask=image=>Uint8Array.from({length:n*n},(_,i)=>image.data[4*i+3]?1:0);
function edges(m){
  const e=[];
  for(let i=0;i<m.length;i++)if(m[i]&&(i%n===0||i%n===n-1||i<n||i>=n*(n-1)||!m[i-1]||!m[i+1]||!m[i-n]||!m[i+n]))e.push([i%n,Math.floor(i/n)]);
  return e;
}
function dist(a,b){
  let sum=0;
  for(const [x,y] of a){
    let best=Infinity;
    for(const [u,v] of b)best=Math.min(best,(x-u)**2+(y-v)**2);
    sum+=Math.sqrt(best);
  }
  return sum/a.length;
}
function score(reference,drawn){
  let both=0,either=0;
  for(let i=0;i<reference.length;i++){both+=reference[i]&drawn[i];either+=reference[i]|drawn[i];}
  const a=edges(reference),b=edges(drawn);
  assert(b.length&&a.length);
  const selected=p=>p[1]<upperRows;
  return {iou:both/either,boundaryPx:(dist(a,b)+dist(b,a))/2,upperBoundaryPx:(dist(a.filter(selected),b)+dist(b.filter(selected),a))/2};
}
function average(rows){
  return Object.fromEntries(['before','after'].map(key=>[key,Object.fromEntries(['iou','boundaryPx','upperBoundaryPx'].map(field=>[field,rows.reduce((s,x)=>s+x[key][field],0)/rows.length]))]));
}
const shape=mesh=>({...mesh,v:mesh.v.map(x=>x*10000)});
const render=(mesh,yaw,pitch,zoom=1)=>mask(scanImage(mesh,yaw,pitch,n,zoom));
function evaluate(mesh,condition,figureId=null){
  const noisy=condition==='tiltedBox';
  const shots=views.map((yaw,i)=>{
    const im=render(mesh,yaw,noisy?[-5,6,-3,5,0][i]:0,noisy?[.91,1.03,.94,1.05,.98][i]:1);
    return {yaw,rows:extent(im),camera:noisy?camera(im):clean};
  });
  const baseline=reconstruct(shots),learned=reconstructPhoto(shots,MODEL_VERSION);
  assert(baseline&&learned);
  if(condition==='clean'){
    assert.deepEqual(reconstructPhoto(shots),baseline);
    assert.deepEqual(reconstructPhoto(shots,'unknown'),baseline);
    assert(!acceptsFive(shots.slice(0,4)));
    const different=shots.map((s,i)=>i===1?{...s,yaw:s.yaw-5}:s);
    assert.deepEqual(reconstructPhoto(different,MODEL_VERSION),reconstruct(different));
  }
  const before=shape(baseline),after=shape(learned);
  if(figureId){
    const images=[mesh,before,after].map(m=>Buffer.from(scanImage(m,23,0,n).data).toString('base64'));
    figures.push({id:figureId,yaw:23,pitch:0,images});
  }
  function compare([yaw,pitch]){
    const ref=render(mesh,yaw,pitch);
    return {yaw,pitch,before:score(ref,render(before,yaw,pitch)),after:score(ref,render(after,yaw,pitch))};
  }
  return {held:targets.map(compare),aligned:views.map(y=>[y,0]).map(compare)};
}
function prismatic(y,count){
  const height=Math.sqrt(Math.max(0,1-4*y*y));
  return Array.from({length:count},(_,i)=>{
    const angle=2*Math.PI*i/count,near=angle-Math.round(angle/(Math.PI/4))*(Math.PI/4);
    const r=.35*height/Math.cos(near);
    return [r*Math.cos(angle),r*Math.sin(angle)];
  });
}
const measuredFile=new URL('../head36.json',import.meta.url),measured=JSON.parse(fs.readFileSync(measuredFile)).meshes[0];
const cases=[];
for(const seed of heldSeeds)cases.push({group:'syntheticHeld',id:String(seed),condition:'clean',...evaluate(syntheticMesh(syntheticHead(seed,true)),'clean')});
for(const condition of ['clean','tiltedBox'])cases.push({group:'scan',id:'Lee Perry-Smith',condition,...evaluate(measured,condition,condition)});
cases.push({group:'counterexample',id:'octagon',condition:'clean',...evaluate(syntheticMesh(prismatic),'clean','octagon')});
const summarize=group=>{
  const get=key=>average(group.flatMap(c=>c[key]));
  const held=group.flatMap(c=>c.held);
  return {subjects:new Set(group.map(c=>c.id)).size,heldViews:held.length,held:get('held'),aligned:get('aligned'),heldBoundaryWins:held.filter(x=>x.after.boundaryPx<x.before.boundaryPx).length};
};
const groups={syntheticHeld:summarize(cases.filter(c=>c.group==='syntheticHeld')),scanClean:summarize([cases.at(-3)]),scanTiltedBox:summarize([cases.at(-2)]),counterexample:summarize([cases.at(-1)])};
const summary={version:MODEL_VERSION,training:{syntheticHeads:96,levels:24,seed:441031,ridge:.01,observations:55296,measuredHeads:0,userApprovedExamples:0,weightsSha256:crypto.createHash('sha256').update(fs.readFileSync(weights)).digest('hex')},test:{syntheticHeldSeeds:heldSeeds,measuredHeads:1,userApprovedExamples:0,head36Sha256:crypto.createHash('sha256').update(fs.readFileSync(measuredFile)).digest('hex'),captureDegrees:[-5,6,-3,5,0],captureZoom:[.91,1.03,.94,1.05,.98],targetViews:targets,resolution:n},groups,cases};
summary.test.upperRows=upperRows;
const serialized=JSON.stringify(summary,(_,v)=>typeof v==='number'?Number(v.toFixed(8)):v,2)+'\n';
const saveIndex=process.argv.indexOf('--out');
if(saveIndex>=0)fs.writeFileSync(process.argv[saveIndex+1],serialized);
else assert.deepEqual(JSON.parse(serialized),JSON.parse(fs.readFileSync(new URL('../photo-eval44.json',import.meta.url))));
const figureIndex=process.argv.indexOf('--figure');
if(figureIndex>=0)fs.writeFileSync(process.argv[figureIndex+1],JSON.stringify(figures));
console.log(JSON.stringify(groups));

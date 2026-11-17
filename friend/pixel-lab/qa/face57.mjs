import assert from 'node:assert/strict';
import {candidateFace57} from '../face57.mjs';
export function verifyFace57(scene,id,expectedChanged){
 const before=JSON.stringify(scene),next=candidateFace57(scene,id,'contact');
 assert.equal(candidateFace57(scene,id),scene);
 assert.equal(candidateFace57(scene,'F01','contact'),scene);
 assert.throws(()=>candidateFace57(scene,id,'invalid'),RangeError);
 assert.equal(JSON.stringify(scene),before);
 const features=new Set(['upper-lip34','lower-lip34','mouth-line34']);
 let changed=0,faces=0;
 for(const [j,part]of scene.parts.entries()){
  const after=next.parts[j];assert.equal(after.faces,part.faces);assert.equal(after.mat,part.mat);
  if(!features.has(part.name)){assert.deepEqual(after.vertices,part.vertices);continue;}
  faces+=after.faces.length;
  for(const [i,v]of after.vertices.entries()){
   assert(v.p.every(Number.isFinite));assert(v.n.every(Number.isFinite));
   if(v.p.some((x,k)=>x!==part.vertices[i].p[k]))changed++;
  }
 }
 assert(changed>0&&changed<=585);if(expectedChanged!==undefined)assert.equal(changed,expectedChanged);assert.equal(faces,912);
 return {id,lipPointsChanged:changed,retainedTargetPoints:585-changed,lipFaces:faces,otherCoordinatesEqual:true,materialsEqual:true,sourceEqual:true};
}

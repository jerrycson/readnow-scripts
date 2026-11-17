import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {SIZE, views, camera, extent, foreground, obj, rankViews, reconstruct, signature, surfaceEdit, visibleWeight} from '../hull36.mjs';
import {preview} from '../projector36.mjs';
import {scanImage} from '../scan-view36.mjs';
import {reshapeHead} from '../photo-apply36.mjs';
import {DEFAULTS, baseSamples} from '../model.mjs';
import {loadRig} from '../rig32.mjs';
import {form34,pose34,raisedPose} from '../bust34.mjs';

// 브라우저 전용 화소 상자. 스캔이나 투영 계산에는 관여하지 않는다.
globalThis.ImageData ??= class {
  constructor(data, width, height) { Object.assign(this, {data, width, height}); }
};
const input = JSON.parse(readFileSync(new URL('../head36.json', import.meta.url)));
const reference = input.meshes[0];
const rad = angle => angle * Math.PI / 180;
const round = n => Number(n.toFixed(5));
const mean = a => a.reduce((sum, v) => sum + v, 0) / a.length;
const calibrated = {cx: SIZE / 2, cy: SIZE / 2, scale: SIZE * .797};
const capture = yaw => {
  const rgba = scanImage(reference, yaw, 0, SIZE).data;
  const mask = foreground(rgba, SIZE, SIZE, 44);
  return {yaw, rgba, mask, camera: {...calibrated}, rows: extent(mask)};
};

// 삼각형의 각 주사선과 만나는 두 끝을 구하고 면 전체의 합집합을 만든다.
// 사진 엔진의 삼각형 내부 판정·깊이 버퍼·시점 투영 함수를 공유하지 않는다.
function silhouette(mesh, yaw, pitch, units = 1) {
  const h = rad(yaw), v = rad(pitch);
  const right = [Math.cos(h), 0, Math.sin(h)];
  const up = [Math.sin(h) * Math.sin(v), Math.cos(v), -Math.cos(h) * Math.sin(v)];
  const coords = [];
  for (let i = 0; i < mesh.v.length; i += 3) {
    const component = d => (d[0]*mesh.v[i] + d[1]*mesh.v[i+1] + d[2]*mesh.v[i+2]) / units;
    coords.push([calibrated.cx + calibrated.scale * component(right), calibrated.cy - calibrated.scale * component(up)]);
  }
  const mask = new Uint8Array(SIZE*SIZE);
  for (let i = 0; i < mesh.f.length; i += 3) {
    const tri = [coords[mesh.f[i]], coords[mesh.f[i+1]], coords[mesh.f[i+2]]];
    const ys = tri.map(p => p[1]);
    const start = Math.max(0, Math.ceil(Math.min(...ys) - .5));
    const end = Math.min(SIZE, Math.ceil(Math.max(...ys) - .5));
    for (let y = start; y < end; y++) {
      const hits = [];
      for (let e = 0; e < 3; e++) {
        const [x0, y0] = tri[e], [x1, y1] = tri[(e+1)%3], cy = y+.5;
        if ((y0 <= cy && cy < y1) || (y1 <= cy && cy < y0))
          hits.push(x0 + (cy-y0) * (x1-x0) / (y1-y0));
      }
      if (hits.length !== 2) continue;
      const left = Math.max(0, Math.ceil(Math.min(...hits) - .5));
      const right = Math.min(SIZE-1, Math.floor(Math.max(...hits) - .5));
      if (right >= left) mask.fill(1, y*SIZE+left, y*SIZE+right+1);
    }
  }
  return mask;
}
function border(mask) {
  const points = [];
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] && (!mask[i-1] || !mask[i+1] || !mask[i-SIZE] || !mask[i+SIZE]))
      points.push([i%SIZE, Math.floor(i/SIZE)]);
  }
  return points;
}
function compare(a, b) {
  let union = 0, intersection = 0;
  for (let i = 0; i < a.length; i++) { union += a[i] | b[i]; intersection += a[i] & b[i]; }
  const aa = border(a), bb = border(b);
  const nearest = (p, to) => {
    let best = Infinity;
    for (const q of to) best = Math.min(best, (q[0]-p[0])**2 + (q[1]-p[1])**2);
    return Math.sqrt(best);
  };
  const d = [...aa.map(p=>nearest(p,bb)), ...bb.map(p=>nearest(p,aa))].sort((p,q)=>p-q);
  return {iou:round(intersection/union), meanPx:round(mean(d)), p95Px:round(d[Math.ceil(.95*d.length)-1]), maxPx:round(d.at(-1))};
}
const shots = views.map(capture);
const hull = reconstruct(shots);
const auto = reconstruct(shots.map(s => ({...s, camera:camera(s.mask)})));
const heldOut = [[22.5,0],[67.5,0],[112.5,0],[157.5,0],[-22.5,0],[-67.5,0],[-112.5,0],[-157.5,0],
  [0,40],[45,40],[90,40],[135,40],[180,40],[0,-40],[45,-40],[90,-40],[135,-40],[180,-40],[0,90],[0,-90]];
const truthCache = new Map();
function truth(yaw, pitch) {
  const key = [yaw,pitch].join('/');
  if (!truthCache.has(key)) truthCache.set(key,silhouette(reference,yaw,pitch,10000));
  return truthCache.get(key);
}
function scores(mesh, angles) {
  const rows = angles.map(([yaw,pitch])=>({yaw,pitch,...compare(truth(yaw,pitch),silhouette(mesh,yaw,pitch))}));
  return {meanIoU:round(mean(rows.map(r=>r.iou))), meanBoundaryPx:round(mean(rows.map(r=>r.meanPx))), rows};
}
const sourceViews = views.map(yaw=>[yaw,0]);
const fitScores = scores(hull, sourceViews), heldScores = scores(hull, heldOut);
const autoScores = scores(auto, heldOut);
const leaveOneOut = shots.map((s,i) => {
  const model = reconstruct(shots.filter((_,j)=>i!==j));
  return {yaw:s.yaw,...compare(truth(s.yaw,0),silhouette(model,s.yaw,0))};
});
const independentMaskIoU = shots.map(s=>compare(truth(s.yaw,0),s.mask).iou);
assert(Math.min(...independentMaskIoU)>.999);
assert(fitScores.meanIoU>.97 && heldScores.meanIoU>.91, '교정·보류 윤곽에 큰 퇴행이 있습니다');
assert(heldOut.every(([yaw,pitch])=>pitch!==0||!views.includes(yaw)));

function topology(m) {
  const edges = new Map();
  let volume = 0, flatFaces = 0;
  const p = i=>m.v.slice(3*i,3*i+3);
  for (let k=0; k<m.f.length; k+=3) {
    const ids = m.f.slice(k,k+3), [a,b,c] = ids.map(p);
    assert(ids.every(i=>Number.isInteger(i) && i>=0 && 3*i<m.v.length));
    volume += (a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
    const u = b.map((x,i)=>x-a[i]), v = c.map((x,i)=>x-a[i]);
    if (Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])<1e-12) flatFaces++;
    for (let i=0; i<3; i++) {
      const l=ids[i], r=ids[(i+1)%3], key=Math.min(l,r)+'/'+Math.max(l,r);
      const edge = edges.get(key) ?? {count:0,winding:0};
      edge.count++; edge.winding+=l<r?1:-1; edges.set(key,edge);
    }
  }
  const badEdges = Array.from(edges.values()).filter(e=>e.count!==2||e.winding!==0).length;
  return {vertices:m.v.length/3,triangles:m.f.length/3,badEdges,flatFaces,signedVolume:round(volume)};
}
const mesh = topology(hull);
assert.equal(mesh.badEdges,0);
assert.equal(mesh.flatFaces,0);
assert(mesh.signedVolume>0);
assert.equal(obj(hull).split('\n').filter(s=>s.startsWith('f ')).length,mesh.triangles);
assert.equal(reconstruct([shots[0]]),null);
for (const [a,b] of [[-90,90],[-45,135],[0,180],[90,90],[0,4]])
  assert.equal(reconstruct([{...shots[0],yaw:a},{...shots[1],yaw:b}]),null);

const candidates = [...views,-45,-90,-135].map(yaw=>({yaw,sig:signature(capture(yaw).mask)}));
const direction = shots.map(s => {
  const ranked = rankViews(truth(s.yaw,0),candidates), gap=ranked[1].loss-ranked[0].loss;
  return {yaw:s.yaw,first:ranked[0].yaw,second:ranked[1].yaw,gap:round(gap),auto:ranked[0].loss<.055&&gap>=.012};
});
function solid(yaw, rgb) {
  const rgba=new Uint8ClampedArray(SIZE*SIZE*4);
  for(let i=0;i<rgba.length;i+=4) rgba.set([...rgb,255],i);
  return {yaw,rgba,mask:new Uint8Array(SIZE*SIZE).fill(1),camera:calibrated};
}
const sample = (pic,x,y)=>Array.from(pic.data.slice(4*(y*SIZE+x),4*(y*SIZE+x)+3));
const render = (model,yaw,pitch,images)=>preview(model,yaw,pitch,SIZE,1,images);
function textureChecks() {
  const panels={v:[-.16,-.2,.24,.16,-.2,.24,.16,.2,.24,-.16,.2,.24,
    -.16,-.2,-.24,.16,-.2,-.24,.16,.2,-.24,-.16,.2,-.24], f:[0,1,2,0,2,3,4,5,6,4,6,7]};
  const red=solid(0,[255,0,0]), blue=solid(45,[0,0,255]);
  const colored = render(panels,30,0,red), plain=render(panels,30,0,null);
  const occluded=sample(colored,51,64), neutral=sample(plain,51,64), front=sample(colored,77,64);
  assert.deepEqual(occluded,neutral,'원사진의 앞판 뒤에 가려졌던 면이 물들었습니다');
  assert.notDeepEqual(front,sample(plain,77,64));
  assert.deepEqual(render(panels,180,0,red).data,render(panels,180,0,null).data);
  assert.deepEqual(render(panels,0,90,red).data,render(panels,0,90,null).data);
  const central = yaw=>sample(render(panels,yaw,0,[red,blue]),74,64);
  const left=central(22.49), middle=central(22.5), right=central(22.51);
  assert(Math.abs(middle[0]-middle[2])<12 && middle[0]>middle[1]+50 && middle[2]>middle[1]+50);
  assert(Math.max(...right.map((v,i)=>Math.abs(v-left[i])))<=2);
  const angles=[0,10,20,30,40,50,90,180];
  const fade=angles.map(yaw=>({yaw,weight:round(visibleWeight(yaw,0,0))}));
  assert.deepEqual(fade.map(v=>v.weight),[1,1,.84375,.5,.15625,0,0,0]);
  return {occludedRgb:occluded,untexturedRgb:neutral,visibleRgb:front,mixLeftRgb:left,mixCenterRgb:middle,mixRightRgb:right,fade};
}
const texture = textureChecks();
await loadRig();
const applied = baseSamples().map(({sex,heads})=>{
  const sc=form34({...DEFAULTS,sex,heads,designStyle:'manga'});
  const edited = reshapeHead(sc,hull), chin=sc.landmarks.chin[1], height=sc.height-chin;
  assert.equal(reshapeHead(sc,null),sc);
  assert.equal(sc.parts.length,edited.parts.length);
  const seen=new Set();
  let changed=0, checkedOutside=0, outsideChanged=0, maxDelta=0;
  sc.parts.forEach((part,k)=>{
    const next=edited.parts[k];
    assert.equal(next.faces,part.faces);
    assert.equal(next.vertices.length,part.vertices.length);
    if(seen.has(part.vertices))return;
    seen.add(part.vertices);
    part.vertices.forEach((v,i)=>{
      const q=next.vertices[i],d=Math.hypot(...q.p.map((x,k)=>x-v.p[k]));
      assert(q.p.every(Number.isFinite) && q.n.every(Number.isFinite));
      const h=(v.p[1]-chin)/height;
      if(h<=0 || h>=1){checkedOutside++;if(d!==0||q.n.some((x,k)=>x!==v.n[k]))outsideChanged++;}
      else if(d>1e-9){changed++;maxDelta=Math.max(d,maxDelta);}
    });
  });
  assert.equal(outsideChanged,0);
  assert(changed>0 && checkedOutside>0 && maxDelta<=.106*height);
  return {sex,heads,changed,checkedOutside,outsideChanged,maxDeltaInHeadHeights:round(maxDelta/height)};
});
const poseChecks = ['female','male'].map(sex=>{
  const neutral=form34({...DEFAULTS,sex,heads:8,designStyle:'manga'});
  const posed=pose34(neutral,raisedPose(178)).scene, fitted=reshapeHead(posed,hull);
  const chin=neutral.landmarks.chin[1], seen=new Set();
  let outside=0, affectedOutside=0, raisedBody=0, headChanges=0;
  neutral.parts.forEach((part,k)=>{
    if(seen.has(part.vertices))return;
    seen.add(part.vertices);
    part.vertices.forEach((base,i)=>{
      const a=posed.parts[k].vertices[i], b=fitted.parts[k].vertices[i];
      const changed=a.p.some((v,k)=>v!==b.p[k])||a.n.some((v,k)=>v!==b.n[k]);
      if(base.p[1]<=chin||base.p[1]>=neutral.height){
        outside++;
        if(base.p[1]<chin-.3 && a.p[1]>chin)raisedBody++;
        if(changed)affectedOutside++;
      }else if(changed)headChanges++;
    });
  });
  assert(raisedBody>0 && headChanges>0);
  assert.equal(affectedOutside,0);
  return {sex,heads:8,armElevation:178,outside,raisedBody,affectedOutside,headChanges};
});
// 전신을 강체 회전시킨 경우 '교정 뒤 회전'과 '회전 뒤 교정'의 위치가 같다.
function rigidTest(){
  const base=form34({...DEFAULTS,sex:'male',heads:4,designStyle:'manga'}),arrays=new Map();
  const rot=([x,y,z])=>[z,x,y];
  const turn=p=>rot(p).map((v,k)=>v+[.3,-.8,.24][k]);
  const posed={...base,restScene:base,parts:base.parts.map(m=>{
    if(!arrays.has(m.vertices))arrays.set(m.vertices,m.vertices.map(v=>({...v,p:turn(v.p),n:rot(v.n)})));
    return {...m,vertices:arrays.get(m.vertices)};
  })};
  const a=reshapeHead(base,hull),b=reshapeHead(posed,hull);
  let maximum=0,compared=0;
  for(let k=0;k<a.parts.length;k++)a.parts[k].vertices.forEach((v,i)=>{
    if(base.parts[k].vertices[i]===v)return;
    const p=b.parts[k].vertices[i].p;
    maximum=Math.max(maximum,Math.hypot(...turn(v.p).map((x,j)=>x-p[j])));
    compared++;
  });
  assert(compared>0 && maximum<1e-8,'머리 교정이 강체 회전을 따르지 않습니다');
  return {compared,maxError:round(maximum)};
}
const rigid = rigidTest();
for(const part of ['jaw','cheek','nose','crown']){
  assert.deepEqual(surfaceEdit(hull,part,0,0).v,hull.v);
  assert.notDeepEqual(surfaceEdit(hull,part,.6,-.5).v,hull.v);
}
const result={
  method:'실제 인물 한 명의 고해상도 3차원 측정면을 128픽셀 정사영한 영상 다섯 장만 재구성기에 전달했다. 원본 측정면과 결과 메시를 별도 주사선 코드로 투영해 합집합 대비 교집합과 양방향 윤곽 거리(픽셀)를 계산했다.',
  limits:'일반 카메라 촬영 사진, 다른 인물, 비단색 배경은 미검증이다. 실루엣은 눈구멍·입술 같은 안쪽의 오목한 깊이를 정하지 못한다. 정사영에서 방향이 180도 차이 나면 윤곽은 서로 좌우 반전이다. 기본형 14개는 중립, 남녀 8등신은 양팔 178도, 남성 4등신은 임의의 강체 회전으로 검사했다.',
  source:input.source,credit:input.credit,license:input.license,sourceSha256:input.sha256,
  inputViews:views,independentMaskIoU,mesh,calibratedFit:fitScores,calibratedHeldOut:heldScores,boundingBoxHeldOut:autoScores,
  leaveOneOut,direction,texture,applied,poseChecks,rigid
};
const output=new URL('../engine-eval36.json',import.meta.url);
if(process.argv.includes('--write'))writeFileSync(output,JSON.stringify(result,null,2)+'\n');
else assert.deepEqual(JSON.parse(readFileSync(output,'utf8')),result,'저장된 수치와 이번 재현 결과가 다릅니다');
console.log(JSON.stringify({교정다섯시점:fitScores.meanIoU,보류스무시점:heldScores.meanIoU,자동정렬보류: autoScores.meanIoU,평균윤곽오차:heldScores.meanBoundaryPx,기본형:applied.length,메시:mesh},null,2));

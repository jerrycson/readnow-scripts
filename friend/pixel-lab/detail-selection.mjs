import {ARM_DATA} from './continuous/arm-regions.mjs';

// A diagnostic cutaway of existing geometry, never a replacement body.
const handWeights = new Map(ARM_DATA.groups.L.hand);
const forearmWeights = new Map(ARM_DATA.groups.L.fore);
const selections = new WeakMap();
function connectedFacesNear(mesh,faces,anchor){const adj=new Map();for(const f of faces)for(const i of f){if(!adj.has(i))adj.set(i,new Set());for(const j of f)adj.get(i).add(j);}let seed=-1,best=Infinity;for(const i of adj.keys()){const d=Math.hypot(...mesh.vertices[i].p.map((v,k)=>v-anchor[k]));if(d<best){best=d;seed=i;}}if(seed<0)return[];const seen=new Set([seed]),todo=[seed];while(todo.length){for(const i of adj.get(todo.pop()))if(!seen.has(i)){seen.add(i);todo.push(i);}}return faces.filter(f=>f.every(i=>seen.has(i)));}

export function selectAnatomyDetail(scene, focus) {
  if (!['hand', 'foot'].includes(focus)) return scene;
  if (selections.get(scene)?.has(focus)) return selections.get(scene).get(focus);
  const joint = scene.joints?.right?.[focus === 'hand' ? 'wrist' : 'ankle'];
  if (!joint) return scene;
  const parts = [];
  for (const mesh of scene.parts) {
    const adult = mesh.name === 'continuous-CC0-derived-body';
    const neutral = mesh.name === 'continuous-neutral-chibi-body';
    if (!adult && !neutral && !/hand|palm|finger|thumb|forearm|wrist|foot|toe|ankle/.test(mesh.name || '')) continue;
    const posed=scene.restScene;
    const faceFlags=posed&&mesh.strain?new Map(mesh.faces.map((f,i)=>[f,mesh.strain[i]])):null;
    if(posed){
      const original=selectAnatomyDetail(posed,focus).parts.find(p=>p.name===mesh.name);
      if(original)parts.push({...mesh,faces:original.faces,strain:mesh.strain?Uint8Array.from(original.faces,face=>faceFlags.get(face)):undefined});
      continue;
    }
    const selected = mesh.vertices.map(({p}, i) => {
      if (focus === 'hand' && adult) {
        return (handWeights.get(i) || 0) > .05 ||
          ((forearmWeights.get(i) || 0) > .2 && Math.hypot(...p.map((x, k) => x - joint[k])) < .18);
      }
      if (focus === 'foot') return p[0] > 0 && p[1] <= joint[1] + .22;
      return p[0] > joint[0] - .18 && p[1] < joint[1] + .16 && p[1] > joint[1] - (neutral ? .32 : .9);
    });
    let faces = mesh.faces.filter(face => face.every(i => selected[i]));
    if(neutral && focus === 'hand') faces = connectedFacesNear(mesh, faces, [joint[0],joint[1]-.10,joint[2]]);
    if (faces.length) parts.push({...mesh, faces});
  }
  const points = parts.flatMap(mesh => [...new Set(mesh.faces.flat())].map(i => mesh.vertices[i].p));
  if (!points.length) throw new Error('선택 부위의 표면이 없습니다.');
  const bounds = [0, 1, 2].map(k => [Math.min(...points.map(p => p[k])), Math.max(...points.map(p => p[k]))]);
  const center = bounds.map(([a, b]) => (a + b) / 2);
  const radius = Math.max(...points.map(p => Math.hypot(...p.map((x, k) => x - center[k]))));
  const frame = Math.max(focus === 'hand' ? 1.08 : 1.28, radius * 2.10);
  const result = {...scene, parts, detailSelection: {focus, side: 'right', cutaway: true, center, frame}};
  if (!selections.has(scene)) selections.set(scene, new Map());
  selections.get(scene).set(focus, result);
  return result;
}

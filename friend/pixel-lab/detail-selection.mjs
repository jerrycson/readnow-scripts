import {ARM_DATA} from './continuous/arm-regions.mjs';

// A diagnostic cutaway of existing geometry, never a replacement body.
const handWeights = new Map(ARM_DATA.groups.L.hand);
const forearmWeights = new Map(ARM_DATA.groups.L.fore);
const selections = new WeakMap();
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
    const selected = mesh.vertices.map(({p}, i) => {
      if (focus === 'hand' && adult) {
        return (handWeights.get(i) || 0) > .05 ||
          ((forearmWeights.get(i) || 0) > .2 && Math.hypot(...p.map((x, k) => x - joint[k])) < .18);
      }
      if (focus === 'foot') return p[0] > 0 && p[1] <= joint[1] + .22;
      return p[0] > joint[0] - .18 && p[1] < joint[1] + .16 && p[1] > joint[1] - .9;
    });
    const faces = mesh.faces.filter(face => face.every(i => selected[i]));
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

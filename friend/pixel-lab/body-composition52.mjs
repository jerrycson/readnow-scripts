import {BODY_AXES, BODY_BASE, bodyPreset} from './body-design.mjs';
import {bodyParts} from './renderer.mjs';
import {safeGain} from './studio-sculpt-model.mjs';
import {rotateNormals50} from './body-multiview50.mjs';

export const bodyAxes52 = Object.freeze({
  muscularity: BODY_AXES.muscularity,
  adiposity: BODY_AXES.adiposity
});
const pick = source => Object.fromEntries(Object.keys(bodyAxes52).map(key => [key, source[key]]));
export const bodyDefault52 = Object.freeze(pick(BODY_BASE));
export const bodyPresets52 = Object.freeze([
  ['balanced', '기본'], ['slender', '마른'], ['muscular', '근육'],
  ['full', '지방'], ['powerful', '근육·지방 조합']
].map(([id, label]) => Object.freeze({id, label, values: Object.freeze(pick(bodyPreset(id)))})));
export const supportsBody52 = id => /^(female|male)-[2-8]$/.test(id);

const prepared = new WeakMap();
const original = new WeakMap();
const zero = Object.freeze([0, 0, 0]);
const members = {
  'upper-arm': ['shoulder', 'elbow'], forearm: ['elbow', 'wrist'],
  thigh: ['hip', 'knee'], calf: ['knee', 'ankle']
};
const sideOf = mesh => mesh.vertices.reduce((sum, v) => sum + v.p[0], 0) < 0 ? 'left' : 'right';
function partKey(mesh) {
  if (mesh.name === 'ribcage-waist-pelvis') return mesh.name;
  if (Object.hasOwn(members, mesh.name)) return mesh.name + '/' + sideOf(mesh);
}
const delta = (a, b) => a.map((value, i) => value - b[i]);
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const unit = v => {
  const length = Math.hypot(...v) || 1;
  return v.map(value => value / length);
};
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
function ramp(start, end, value) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t*t*(3-2*t);
}
function limbAxes(scene, mesh) {
  const side = sideOf(mesh);
  const [from, to] = members[mesh.name];
  const anchor = scene.joints[side][from];
  const d = delta(scene.joints[side][to], anchor);
  const along = unit(d);
  const width = unit(cross(along, [0, 0, 1]));
  return {anchor, along, width, depth: unit(cross(width, along)), length: Math.hypot(...d)};
}
function nativeDonors(study) {
  if (prepared.has(study)) return prepared.get(study);
  const native = study.scene;
  const targets = [];
  for (const axis of Object.keys(bodyAxes52)) {
    for (const end of [0, 1]) targets.push({axis, end, scene: bodyParts({...study.settings, [axis]: end})});
  }
  const parts = new Map();
  native.parts.forEach((mesh, index) => {
    const trunk = mesh.name === 'ribcage-waist-pelvis';
    if (!trunk && !Object.hasOwn(members, mesh.name)) return;
    const width = Math.abs(native.joints.right.shoulder[0]);
    const hip = native.joints.right.hip[1];
    const height = native.joints.right.shoulder[1] - hip;
    const frame = trunk ? null : limbAxes(native, mesh);
    const chart = mesh.vertices.map(v => {
      if (trunk) {
        const u = (v.p[1] - hip) / height;
        const upperFront = ramp(.14, .48, u) * ramp(-.18, -.015, v.p[2] / width);
        const gate = ramp(-.22, -.045, u) * (1 - ramp(.83, 1.01, u)) * (1 - upperFront);
        // 양팔을 내린 중립에서 안쪽 팔과 만나는 옆구리의 가로 팽창은 적게 준다.
        const lateral = ramp(.50, .80, Math.abs(v.p[0]) / width);
        const nearArm = lateral * (1 - ramp(.16, .48, Math.abs(v.p[2]) / width))
          * ramp(-.15, .09, u) * (1 - ramp(.86, 1.03, u));
        return {gate, nearArm};
      }
      const q = delta(v.p, frame.anchor);
      const t = dot(q, frame.along) / frame.length;
      return {t, gate: ramp(.045, .22, t) * (1 - ramp(.76, .955, t)),
        width: dot(q, frame.width), depth: dot(q, frame.depth)};
    });
    const fields = targets.map(({axis, end, scene}) => {
      const donor = scene.parts[index];
      if (donor?.name !== mesh.name || donor.vertices.length !== mesh.vertices.length) {
        throw Error('기본체 정점 대응을 확인하세요.');
      }
      const to = trunk ? null : limbAxes(scene, donor);
      const scale = native.proportions?.cute ? .59 : 1;
      const response = trunk ? {muscularity: .68, adiposity: .66} : {muscularity: .83, adiposity: .48};
      const offsets = mesh.vertices.map((v, i) => {
        const c = chart[i];
        if (c.gate < .00001) return zero;
        const gain = c.gate * scale * response[axis];
        const p = donor.vertices[i].p;
        if (trunk) {
          const dx = p[0] - v.p[0], dz = p[2] - v.p[2];
          const lateral = end > study.settings[axis] ? 1 - .91*c.nearArm : 1;
          if (axis === 'muscularity') return [dx*gain*lateral, 0, dz*gain];
          // 기존 복부 앞쪽 한 점에 집중된 돌출을 넓은 단면에 분배한다.
          const step = end - study.settings.adiposity;
          return [gain*lateral*(.61*dx + .39*v.p[0]*.43*step), 0,
                  gain*(.53*dz + .47*v.p[2]*.65*step)];
        }
        const q = delta(p, to.anchor);
        let dr = dot(q, to.width) - c.width;
        let dz = dot(q, to.depth) - c.depth;
        // 2~4등신 팔다리의 두 중간 고리는 기본 생성기에서 두 축에 반응하지 않는다.
        // 고리의 반지름을 기준으로 굵기만 바꾼다. 뼈 길이와 끝 고리는 고정한다.
        if (native.proportions.cute) {
          const proximal = 1 - ramp(.23, .73, c.t);
          const amount = axis === 'muscularity' ? .42 + .53*proximal : .68;
          const step = (end - study.settings[axis]) * amount;
          dr += c.width * step;
          dz += c.depth * step * (axis === 'muscularity' ? 1.07 : 1);
        }
        const arm = mesh.name === 'upper-arm' || mesh.name === 'forearm';
        if (arm && end > study.settings[axis] && frame.anchor[0]*frame.width[0]*dr < 0) dr *= .10;
        return frame.width.map((x, k) => gain * (x*dr + frame.depth[k]*dz));
      });
      return {axis, end, offsets};
    });
    parts.set(partKey(mesh), {native: mesh, fields});
  });
  prepared.set(study, parts);
  return parts;
}
function levels(study, controls) {
  return Object.fromEntries(Object.keys(bodyAxes52).map(axis => {
    const value = controls?.[axis] ?? study.settings[axis] ?? BODY_BASE[axis];
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw RangeError('근육량과 피하지방량은 0부터 1 사이의 수여야 합니다.');
    }
    return [axis, value];
  }));
}
// controls는 절대값이다. 앞선 동일 조형의 반환값을 전달해도 누적되지 않는다.
export function applyBody52(study, controls = {}, neutral = study?.scene) {
  if (!study || !supportsBody52(study.id) || !neutral) return neutral;
  const source = original.get(neutral);
  if (source?.study === study) neutral = source.neutral;
  const selected = levels(study, controls);
  const base = pick(study.settings);
  if (Object.keys(base).every(k => selected[k] === base[k])) return neutral;
  const fields = nativeDonors(study);
  let changed = 0;
  const gains = {};
  const parts = neutral.parts.map(mesh => {
    const data = fields.get(partKey(mesh));
    if (!data) return mesh;
    if (mesh.vertices.length !== data.native.vertices.length || mesh.faces.length !== data.native.faces.length) {
      throw Error('현재 몸체의 정점 대응을 확인하세요.');
    }
    const active = [];
    for (const field of data.fields) {
      const d = selected[field.axis] - base[field.axis];
      if ((field.end === 0 && d < 0) || (field.end === 1 && d > 0)) {
        active.push({offsets: field.offsets, weight: d / (field.end - base[field.axis])});
      }
    }
    const offsets = mesh.vertices.map((_, i) => {
      const d = [0, 0, 0];
      for (const field of active) {
        for (let k = 0; k < 3; k++) d[k] += field.weight * field.offsets[i][k];
      }
      return d[0] === 0 && d[1] === 0 && d[2] === 0 ? zero : d;
    });
    const gain = safeGain({parts: [mesh]}, new Map([[mesh.vertices, offsets]]));
    gains[mesh.name] = Math.min(gains[mesh.name] ?? 1, gain);
    const vertices = mesh.vertices.map((v, i) => {
      if (offsets[i] === zero || !gain) return v;
      changed++;
      return {...v, p: v.p.map((value, k) => value + gain * offsets[i][k])};
    });
    rotateNormals50(mesh.vertices, vertices, mesh.faces);
    return {...mesh, vertices};
  });
  const result = {...neutral, parts, bodyComposition52: {values: selected, changed, gains}};
  original.set(result, {study, neutral});
  return result;
}


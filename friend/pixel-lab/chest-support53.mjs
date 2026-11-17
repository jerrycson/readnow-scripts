import {lowerBody51} from './lower-body51.mjs';
import {rotateNormals50} from './body-multiview50.mjs';

function ramp(start, end, value) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t*t*(3-2*t);
}
// 52차 흉벽 이음 중립에서 시작한다. 아래 호의 이미 돌출한 피부는 거의 그대로 둔다.
export function support53(contact) {
  const scene = lowerBody51(contact, {
    center: .66, width: .19, band: .65, soft: .095, down: .014, depth: .022, normals: .9
  });
  const skin = scene.parts[0];
  const reference = skin.vertices;
  const vertices = reference.slice();
  const height = scene.paperShape.scale;
  const foot = scene.paperShape.frame(1).foot;
  for (const [i, vertex] of reference.entries()) {
    const [x, y, z] = vertex.p;
    const level = (foot - y) / height;
    const vertical = ramp(.095, .28, level) * (1 - ramp(2.15-.72, 2.15, level));
    const sideways = 1 - ramp(.34, .78, Math.abs(x));
    const strength = .34 * vertical * sideways * ramp(.06, .55, z);
    if (strength < 1e-6) continue;
    const target = 1.20 - .52*x*x;
    const offset = strength * .035 * Math.log1p(Math.exp((target-z)/.035));
    if (offset < 1e-7) continue;
    vertices[i] = {...vertex, p: [x, y, z+offset]};
  }
  rotateNormals50(reference, vertices, skin.faces, .9);
  return {...scene, parts: scene.parts.map(m => m.vertices===reference ? {...m, vertices} : m)};
}


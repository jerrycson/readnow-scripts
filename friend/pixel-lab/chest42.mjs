// 정적 원도판의 아래 경계에 맞춘 성인 W 형태의 국소 피부 변위.
// q는 원래 피부의 안쪽-바깥쪽 위치, u는 위에서 아래로 내려간 비율이다.
const patches = [-.52, -.31, -.10, .11, .32, .53, .70].flatMap(q =>
  [.60, .72, .81, .89].map(u => [q, u])
);
const field = [
  [0.031557309076, 0.080261887083, -0.047401930291],
  [0.032367721523, -0.008801400719, 0.007175141259],
  [0.005316481876, -0.017575504558, -0.000663769787],
  [0.015897104258, 0.000770922627, 0.000533846407],
  [-0.089683827908, -0.008300517741, 0.02408072821],
  [-0.00281786734, 0.019010376863, -0.005311520794],
  [0.006768940122, -0.004694993477, -0.013310246739],
  [0.015076908702, 0.003204285493, -0.000760145738],
  [-0.006890275325, -0.027369172959, -0.002947577922],
  [-0.011006780571, 0.015308580521, 0.052603783624],
  [-0.023764126027, 0.011860919052, 0],
  [-0.005967996617, -0.003401503103, -0.016758854342],
  [0.002831931488, 0.004391773658, -0.019709676019],
  [0.028121550386, -0.015856992247, -0.008341574096],
  [0.056899903979, -0.00731093151, -0.00084906478],
  [0.053480294366, -0.000083941483, -0.002554799906],
  [-0.011180657159, 0.024894202623, 0.027025511433],
  [0.006055787445, 0.018089225696, 0.001631743614],
  [0.000972120279, -0.004807252171, -0.006450622427],
  [-0.00149727734, -0.002807495575, -0.000234513828],
  [-0.000624609696, 0.061264271305, 0.016709202883],
  [-0.004915937497, 0.007257835639, 0.001215859286],
  [-0.039520321409, 0.005734465555, 0],
  [0.017479153567, 0.006239074664, -0.003612224867],
  [-0.050982078774, -0.031676420079, -0.04580128583],
  [0.009852630184, -0.035876264084, -0.01566882177],
  [1.007581969e-2, -0.015867533668, 0.00233210206],
  [0.03027407866, -0.002286427198, 0.006005430142]
];

function smooth(a, b, x) {
  const t = Math.max(0, Math.min(1, (x-a)/(b-a)));
  return t*t*(3-2*t);
}

const minus = (a,b) => a.map((value,k) => value-b[k]);
const dot = (a,b) => a.reduce((sum,value,k) => sum+value*b[k],0);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
function unit(a) {
  const length = Math.hypot(...a) || 1;
  return a.map(value => value/length);
}
function faceNormal(vertices, [a,b,c]) {
  return cross(minus(vertices[b].p,vertices[a].p), minus(vertices[c].p,vertices[a].p));
}

function displace(scene, src) {
  const vertices = src.slice();
  const scale = scene.paperShape.scale;
  scene.restSkin35.forEach(({p:[x,y,z]}, i) => {
    if (z < .05) return;
    const hand = x > 0 ? 1 : -1;
    const frame = scene.paperShape.frame(hand);
    const q = (x-frame.c)*hand/frame.root;
    if (Math.abs(q) >= .80) return;
    const local = scene.paperShape.frame(hand,hand*q);
    const u = (local.top-y)/(local.top-local.foot);
    if (u <= .38 || u >= .965) return;
    const gate = smooth(.38,.63,u)*(1-smooth(.875,.965,u))*
      (1-smooth(.66,.80,Math.abs(q)))*smooth(.06,.17,Math.abs(x)/scale);
    const d = [0,0,0];
    patches.forEach(([a,b],j) => {
      const weight = gate*scale*Math.exp(-.5*(((q-a)/.16)**2 + ((u-b)/.078)**2));
      for (let k=0; k<3; k++) d[k] += weight*field[j][k];
    });
    if (Math.hypot(...d) < 1e-7) return;
    const old = src[i];
    vertices[i] = {...old,p:[old.p[0]+hand*d[0],old.p[1]+d[1],old.p[2]+d[2]]};
  });
  return vertices;
}

function transportNormals(faces, src, vertices) {
  const sums = new Map();
  for (const face of faces) {
    if (face.every(i => vertices[i] === src[i])) continue;
    const old = faceNormal(src,face), area = Math.hypot(...old);
    if (area < 1e-8) continue;
    const a = unit(old), b = unit(faceNormal(vertices,face));
    const axis = cross(a,b), cosine = dot(a,b);
    if (cosine < -.999) continue;
    for (const i of face) {
      if (vertices[i] === src[i]) continue;
      const n = src[i].n, r1 = cross(axis,n), r2 = cross(axis,r1);
      const acc = sums.get(i) || [0,0,0];
      for (let k=0; k<3; k++) acc[k] += area*(n[k]+r1[k]+r2[k]/(1+cosine));
      sums.set(i,acc);
    }
  }
  for (const [i,sum] of sums) {
    const old = src[i].n, target = unit(sum);
    const angle = Math.acos(Math.max(-1,Math.min(1,dot(old,target))))*180/Math.PI;
    const t = Math.min(.75,10/Math.max(.001,angle));
    vertices[i] = {...vertices[i],n:unit(old.map((value,k) => value+t*(target[k]-value)))};
  }
}

export function chest42(scene40, ref) {
  if (scene40.paperShape?.form.id !== 'W' || !scene40.tissue34 || !ref?.paper?.B3) return scene40;
  const mesh = scene40.parts[0], src = mesh.vertices;
  const vertices = displace(scene40,src);
  transportNormals(mesh.faces,src,vertices);
  return {...scene40,parts:scene40.parts.map(part => part.vertices === src ? {...part,vertices} : part)};
}

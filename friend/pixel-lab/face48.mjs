// 47차 중립 모델의 위눈꺼풀 또는 입술 표면에만 적용한다. 단위는 모델 좌표다.
const lipParts = new Set(['mouth-line34','upper-lip34','lower-lip34']);
export const parameters48 = Object.freeze({
  F02:Object.freeze({width:1.12, tilt:-.12, wrap:.65}),
  M01:Object.freeze({width:1.32, smile:.005, curve:.4})
});
function horizontalExtent(part) {
  const left=Math.min(...part.vertices.map(v=>v.p[0])),right=Math.max(...part.vertices.map(v=>v.p[0]));
  return {center:(left+right)/2,radius:(right-left)/2};
}
export function faceTrial48(base,id,parameters) {
  if(!Object.hasOwn(parameters48,id)||!parameters)return base;
  const eyes=id==='F02', mouth=base.parts.find(part=>part.name==='mouth-line34');
  if(!eyes&&!mouth)return base;
  const mouthExtent=mouth&&horizontalExtent(mouth), width=parameters.width;
  const parts=base.parts.map(part=>{
    if(eyes?part.name!=='lid34':!lipParts.has(part.name))return part;
    const {center,radius}=eyes?horizontalExtent(part):mouthExtent;
    if(radius<=0)return part;
    const sign=Math.sign(center);
    const vertices=part.vertices.map(vertex=>{
      const [x,y,z]=vertex.p,dx=x-center,expanded=dx*width;
      const dy=eyes?parameters.tilt*sign*dx:parameters.smile*(dx/radius)**2;
      const dz=eyes?-parameters.wrap*sign*(expanded-dx):-parameters.curve*(expanded*expanded-dx*dx);
      const ySlope=eyes?parameters.tilt*sign:2*parameters.smile*dx/(radius*radius);
      const zSlope=eyes?-parameters.wrap*sign*(width-1):-2*parameters.curve*(width*width-1)*dx;
      // 이동한 접평면의 역전치. 삼각형 winding과 얼굴의 원래 조명을 보존한다.
      const [nx,ny,nz]=vertex.n,n=[(nx-ySlope*ny-zSlope*nz)/width,ny,nz],len=Math.hypot(...n);
      return {...vertex,p:[center+expanded,y+dy,z+dz],n:n.map(v=>v/len)};
    });
    return {...part,vertices};
  });
  return {...base,parts};
}
export function candidateFace48(base,id) {
  return faceTrial48(base,id,parameters48[id]);
}

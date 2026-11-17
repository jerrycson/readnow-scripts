// 47차 다문 중립을 기준으로 움직이는 연구용 입 표면과 눈 뜬 정도 검사.
const lips = new Set(['upper-lip34', 'lower-lip34', 'mouth-line34']);
const unit = n => Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
export function expressMouth49(base, corner=0, opening=0) {
  corner=unit(corner);
  opening=unit(opening);
  if(!corner&&!opening)return base;
  const result=[];
  for(const part of base.parts){
    if(!lips.has(part.name)){ result.push(part); continue; }
    const columns=part.name==='mouth-line34'?43:37;
    if(part.vertices.length!==columns*5)throw Error('입술 격자 판을 확인하세요.');
    const vertices=part.vertices.map((vertex,index)=>{
      const u=2*(index%columns)/(columns-1)-1,v=Math.floor(index/columns)/4;
      const [x,y,z]=vertex.p;
      const half=(part.vertices[columns-1].p[0]-part.vertices[0].p[0])/2;
      const arc=Math.max(0,1-u*u);
      const dx=corner*.25*half*u;
      const lineRow=part.name==='upper-lip34'?1:part.name==='lower-lip34'?0:v;
      const dy=.027*corner*u*u+.052*opening*arc*(lineRow-.70);
      // 가로로 잡아당긴 입꼬리는 뺨 곡면을 따라 뒤로 간다.
      const dz=-.42*((half*u+dx)**2-(half*u)**2);
      return {...vertex,p:[x+dx,y+dy,z+dz]};
    });
    if(!opening||part.name!=='mouth-line34'){ result.push({...part,vertices}); continue; }
    // 윗줄을 나눠 입을 벌릴수록 치아 띠가 연속해서 드러나게 한다.
    // 끝으로 갈수록 치아가 입안으로 돌아가므로 두 색의 경계도 닫힌다.
    const tooth=[],inside=[],splitStart=vertices.length,weights=[];
    for(let i=0;i<columns;i++){
      const u=Math.abs(2*i/(columns-1)-1);
      const t=Math.max(0,Math.min(1,(.86-u)/.22));
      const weight=opening*.98*t*t*(3-2*t);
      const top=vertices[4*columns+i],below=vertices[3*columns+i];
      weights.push(weight);
      vertices.push({...top,p:top.p.map((coord,k)=>coord+weight*(below.p[k]-coord))});
    }
    for(const face of part.faces){
      inside.push(face.map(i=>i>=4*columns?splitStart+i%columns:i));
    }
    for(let i=0;i<columns-1;i++){
      const a=splitStart+i,b=4*columns+i;
      if(weights[i]>0)tooth.push([a,a+1,b]);
      if(weights[i+1]>0)tooth.push([a+1,b+1,b]);
    }
    result.push({...part,vertices,faces:inside});
    if(tooth.length)result.push({...part,vertices,faces:tooth,mat:'portrait-sclera',expressionSurface:'윗니'});
  }
  return {...base,parts:result};
}
export function candidateFace49(base,id,{corner=0,opening=0}={}) {
  return id==='M01'?expressMouth49(base,corner,opening):base;
}
export const expressionPresets49=Object.freeze(Object.fromEntries(
  Object.entries({neutral:[0,0],corner:[1,0],open:[0,1],smileOpen:[1,1]}).map(
    ([name,[corner,opening]])=>[name,Object.freeze({corner,opening})])));
export function probeEyeOpening49(scene,steps){
  // +4는 위로 4/20칸 연장, -4는 같은 칸수 가림. 원래 홍채 정점과 피부는 고정.
  if(!Number.isInteger(steps)||Math.abs(steps)>8)throw RangeError('눈 진단은 -8~8 정수입니다.');
  if(!steps)return scene;
  const eyeParts=scene.parts.filter(p=>p.name==='eye34');
  if(!eyeParts.length)return scene;
  const sideOf=part=>Math.sign(part.vertices[0].p[0]);
  const cores=new Map(eyeParts.map(p=>[sideOf(p),p.vertices]));
  function movement(grid,u){
    const k=Math.max(0,Math.min(52,(u+1)*26)),lo=Math.floor(k),hi=Math.ceil(k),t=k-lo;
    const sourceRow=steps<0?20+steps:20-steps;
    return [1,2].map(d=>{
      const delta=i=>grid[sourceRow*53+i].p[d]-grid[20*53+i].p[d];
      return (steps<0?1:-1)*(delta(lo)*(1-t)+delta(hi)*t);
    });
  }
  const result=[];
  for(const p of scene.parts){
    if(p.name==='lid34'){
      const grid=cores.get(sideOf(p));
      const vertices=p.vertices.map((v,i)=>{
        const [dy,dz]=movement(grid,2*(i%45)/44-1);
        return {...v,p:[v.p[0],v.p[1]+dy,v.p[2]+dz]};
      });
      result.push({...p,vertices});
    }else if(p.name==='eye34'){
      if(steps<0){
        result.push({...p,faces:p.faces.filter(f=>f.every(i=>Math.floor(i/53)<=20+steps))});
      }else{
        result.push(p);
        // 중앙 홍채의 크기를 유지한 채 위쪽 마지막 행의 색만 이어 그린다. 실제 위눈꺼풀 뒤의 색은 알 수 없다.
        const vertices=[];
        for(let row=0;row<2;row++)for(let k=0;k<=52;k++){
          const v=p.vertices[20*53+k],[dy,dz]=movement(p.vertices,2*k/52-1);
          vertices.push({...v,p:[v.p[0],v.p[1]+dy*row,v.p[2]+dz*row]});
        }
        const top=p.faces.filter(f=>Math.min(...f.map(i=>Math.floor(i/53)))===19);
        if(top.length)result.push({...p,vertices,faces:top.map(f=>f.map(i=>i-19*53))});
      }
    }else result.push(p);
  }
  return {...scene,parts:result};
}

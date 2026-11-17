import {measureScalp52} from './scalp-clearance52.mjs';
const subtract=(a,b)=>a.map((x,k)=>x-b[k]);
const dot=(a,b)=>a.reduce((v,x,k)=>v+x*b[k],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=v=>{const length=Math.hypot(...v)||1;return v.map(x=>x/length);};
const mean=(vertices,indices)=>indices.reduce((sum,i)=>sum.map((v,k)=>v+vertices[i].p[k]/indices.length),[0,0,0]);
const anchors=new WeakMap();
function frame(vertices,rings){
  const left=mean(vertices,rings.left),right=mean(vertices,rings.right),crown=mean(vertices,rings.crown);
  const origin=left.map((v,k)=>(v+right[k])/2),x=unit(subtract(right,left));
  const z=unit(cross(x,subtract(crown,origin))),y=unit(cross(z,x));
  return {origin,axis:[x,y,z]};
}
function capture(ref){
  if(anchors.has(ref))return anchors.get(ref);
  const chin=ref.landmarks.chin[1],skin=ref.parts[0].vertices,rings={left:[],right:[],crown:[]};
  let front=-Infinity,back=Infinity,minX=Infinity,maxX=-Infinity;
  for(let i=0;i<skin.length;i++){
    const [x,y,z]=skin[i].p,h=y-chin;
    if(h>.88&&h<1.04)rings.crown.push(i);
    if(h<.52||h>.87)continue;
    front=Math.max(front,z);back=Math.min(back,z);minX=Math.min(minX,x);maxX=Math.max(maxX,x);
    if(h<.73&&Math.abs(x)>.23)rings[x<0?'left':'right'].push(i);
  }
  if(Object.values(rings).some(r=>!r.length))return null;
  const value={chin,rings,frame:frame(skin,rings),centerX:(minX+maxX)/2,centerZ:(front+back)/2,width:(maxX-minX)/2,depth:(front-back)/2};
  const scalpFaces=ref.parts.filter(m=>m.vertices===skin).flatMap(m=>m.faces);
  value.skinRadius=measureScalp52({vertices:skin,faces:scalpFaces},chin,value.centerX,value.centerZ);
  anchors.set(ref,value);return value;
}
export function placeResearchHair52(ref,posed,hair,generate,heads){
  const cap=capture(ref);if(!cap)return posed;
  const after=frame(posed.parts[0].vertices,cap.rings),before=cap.frame;
  function rotate(v){
    const local=before.axis.map(a=>dot(a,v));
    return [0,1,2].map(k=>after.axis.reduce((sum,a,j)=>sum+a[k]*local[j],0));
  }
  const meshes=[];
  generate(meshes,{hair},{n:heads},cap.chin,cap.width,cap.depth,0,false);
  const attached=meshes.map(m=>({...m,vertices:m.vertices.map(v=>{
    const neutral=[v.p[0]+cap.centerX,v.p[1],v.p[2]+cap.centerZ];
    if(m.name.startsWith('머리카락-52-')){
      const radial=Math.hypot(v.p[0],v.p[2]);
      const required=cap.skinRadius(...neutral);
      const clearance=m.name==='머리카락-52-옆가닥'?.054:.030;
      if(required&&radial>1e-5&&radial<required+clearance){
        const gain=(required+clearance)/radial;
        neutral[0]=cap.centerX+v.p[0]*gain;neutral[2]=cap.centerZ+v.p[2]*gain;
      }
    }
    return {p:rotate(subtract(neutral,before.origin)).map((x,k)=>x+after.origin[k]),n:unit(rotate(v.n))};
  })}));
  return {...posed,parts:[...posed.parts,...attached]};
}

import {orientedSkin} from './skin-normals35.mjs';

const smooth=(a,b,x)=>{
  const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
  return t*t*(3-2*t);
};

export const chestFit38={lower:-.06,outer:-.10,depth:0,shift:-.08};

const sideWeights=new WeakMap();
function preserveProfile(body){
  if(sideWeights.has(body.vertices))return sideWeights.get(body.vertices);
  const {faces,vertices}=body,edges=new Map(),neighbours=Array.from(vertices,()=>[]);
  // A side-view silhouette lies between opposite-facing triangles in the
  // y-z projection. Keep those vertices fixed in y and z, then ease the
  // correction in across neighbouring rings. Width can change along x.
  const guards=new Set();
  for(const face of faces){
    const [a,b,c]=face.map(i=>vertices[i].p);
    const sign=Math.sign((b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]));
    face.forEach((i,j)=>{
      const k=face[(j+1)%3],key=Math.min(i,k)*vertices.length+Math.max(i,k);
      const directed=sign*(i<k?1:-1);
      if(edges.has(key)){
        if(edges.get(key)*directed>0){guards.add(i);guards.add(k);}
      }else{
        edges.set(key,directed);
        neighbours[i].push(k);neighbours[k].push(i);
      }
    });
  }
  const weights=new Float32Array(vertices.length).fill(1);
  let ring=[...guards];
  for(const weight of [0,.28,.72]){
    const next=[];
    for(const i of ring)if(weights[i]===1){
      weights[i]=weight;next.push(...neighbours[i]);
    }
    ring=next;
  }
  sideWeights.set(vertices,weights);return weights;
}

// A smooth displacement in three dimensions keeps neighbouring triangles
// together, including the two layers where the surface returns to the thorax.
export function chest38(scene37,ref,fit=chestFit38){
  const shape=scene37.paperShape,rest=scene37.restSkin35,tissue=scene37.tissue34;
  if(shape?.form.id!=='W'||!rest||!tissue||!ref?.paper?.B3||!ref?.paper?.S3)return scene37;
  const body=scene37.parts[0],skin=body.vertices,profile=preserveProfile(body);
  const points=skin.map((v,i)=>{
    const [x,y,z]=v.p,hand=x<0?-1:1,frame=shape.frame(hand);
    const q=(hand*x-Math.abs(frame.c))/frame.root,u=(frame.top-y)/frame.h;
    const lower=smooth(.30,.75,u)*(1-smooth(1.07,1.40,u));
    const weight=lower*(1-smooth(.75,1.30,Math.abs(q)))*smooth(.50,.98,z/tissue.width)*smooth(0,.42,Math.abs(x)/frame.root);
    if(!weight)return v;
    const amount=shape.scale*weight;
    return {...v,p:[v.p[0]+hand*amount*(fit.outer*q+(fit.shift??0)),
      v.p[1]+amount*fit.lower*profile[i],v.p[2]+amount*fit.depth*profile[i]]};
  });
  const deformed=orientedSkin(skin,points,scene37.parts.filter(m=>m.vertices===skin).flatMap(m=>m.faces));
  return {...scene37,parts:scene37.parts.map(m=>m.vertices===skin?{...m,vertices:deformed}:m)};
}

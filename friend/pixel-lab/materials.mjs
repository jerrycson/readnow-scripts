import {norm,dot} from './geometry.mjs';
const hex=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
const ramp=(colors,extra={})=>({colors:colors.map(hex),roughness:.8,specular:0,pattern:'none',...extra});
const skin={clay:['#49372f','#93694c','#c08e65','#e1b183','#f3d5ac'],amber:['#483731','#8c5b3e','#b67a4f','#d9a164','#f0c997'],umber:['#2c2730','#51372f','#794e3d','#a37152','#cfa37b']};
const skinStudy={clay:['#594237','#90664f','#ad7f61','#c39573','#d5a887','#e3ba98','#edc7a7','#f5d6b8','#fde2c8'],amber:['#483731','#805239','#a16c49','#b88055','#cb9463','#d9a574','#e5b585','#efc597','#f6d4ac'],umber:['#2c2730','#51372f','#6b4637','#815640','#95674d','#a7795b','#b68c6b','#c8a080','#d8b394']};
export const FABRIC_NAMES={cotton:'면 · 넓고 무광인 면',wool:'울 · 부드러운 부피와 낮은 대비',silk:'실크 · 좁고 긴 밝은 주름',leather:'가죽 · 단단한 경계와 부분 광택'};
export function materialLibrary(s){
 const cloth={moss:['#203934','#34584c','#528168','#84a17d','#c0c9a0'],navy:['#202a42','#35435d','#506984','#8598aa','#c4d0d1'],ochre:['#493730','#7f5738','#b38242','#d6ad64','#f0dba6']}[s.outfitColor];
 return {
  'face-ink':ramp(['#352722','#3b2b24','#433025','#4d372a','#59412e']),
  sclera:ramp(['#7b807e','#a9b2a4','#d7dfcb','#f0edd7','#fff6df']),iris:ramp(['#2b211e','#3d2c24','#6f5134','#a08257','#d4b78a']),lip:ramp(['#513d36','#785047','#a97868','#c99c86','#e3bea1']),'skin-shadow':ramp(skin[s.palette].slice(0,3).concat(skin[s.palette].slice(2,4))),
  'lower-lip':ramp(['#805b49','#b4866e','#d0a28a','#e5bba0','#f0cbb0']),skin:ramp(skinStudy[s.palette],{skin:true}),eye:ramp(['#15252b','#15252b','#1d3038','#263e44','#b1d0cb']),mouth:ramp(skin[s.palette].slice(0,2).concat(skin[s.palette].slice(1,4))),
  cloth:ramp(cloth,{roughness:{cotton:.9,wool:1,silk:.25,leather:.5}[s.fabric],specular:{cotton:.04,wool:.02,silk:.85,leather:.4}[s.fabric],pattern:s.fabric}),
  trousers:ramp(['#242f39','#39444b','#59656b','#808981','#b0afa1'],{roughness:.9,pattern:'cotton'}),
  hair:ramp(['#201d27','#322c31','#554137','#81604a','#b88a60'],{roughness:.35,specular:.7,pattern:'hair'}),
  leather:ramp(['#30272a','#583c30','#81523a','#ad7950','#cf9c68'],{roughness:.5,specular:.32,pattern:'leather'}),
  metal:ramp(['#1f293a','#374556','#637f8b','#a7c4c8','#f0f4dc'],{roughness:.16,specular:1.1,metal:true}),
  brass:ramp(['#3e302e','#70512f','#a7803b','#d7ba6c','#fff1bb'],{roughness:.23,specular:1,metal:true}),
  fur:ramp(['#3c2c2e','#794337','#b16b3b','#da9b54','#f0c78a'],{pattern:'fur'}),
  catFur:ramp(['#30343e','#535b68','#79858c','#a6b2b3','#d5dcce'],{pattern:'cat'}),
  catEye:ramp(['#354331','#596e3b','#88a258','#b7c879','#e4e8b4']),
  feather:ramp(['#222b35','#35424e','#536472','#82939b','#b9c5c2'],{roughness:.8,specular:.10}),
  white:ramp(['#55575b','#8a9695','#b7c0ad','#d9d9bb','#f4eacf']),
  scale:ramp(['#203c39','#326153','#4c8e6e','#80b28a','#c1d6a1'],{roughness:.5,specular:.25,pattern:'scale'}),
  stone:ramp(['#2e3c41','#53635b','#788574','#a2ad8b','#d0d2ad'],{pattern:'stone'}),
  leaf:ramp(['#233e34','#3c674a','#5f9661','#94b475','#d0dca3'],{roughness:.5,specular:.12}),
  alien:ramp(['#33334a','#5f4e70','#93739b','#bca0c1','#e4cde0'],{roughness:.55,specular:.16}),
  glow:ramp(['#0f4b54','#207b81','#56b1ad','#a9e5ca','#e1ffe1'],{emission:true})
 };
}
const light=norm([-.55,.8,1]),half=norm([light[0],light[1],light[2]+1]);
export function shade(mat,normal,pos,resolution){
 const diffuse=dot(normal,light),nh=Math.max(0,dot(normal,half));
 if(mat.skin){const value=.27+.69*Math.max(0,diffuse);return mat.colors[Math.min(mat.colors.length-1,Math.max(1,Math.round(value*(mat.colors.length-1))))];}
 let value=(diffuse+.18)/1.15;
 const spec=Math.pow(nh,4+(1-mat.roughness)*65)*(mat.specular||0);
 if(mat.metal)value=.05+.60*Math.max(0,diffuse)+spec;else value+=spec;
 // Object-space bands follow a surface when it rotates; no random per-frame noise.
 if(resolution>=64){
  if(mat.pattern==='silk')value+=.075*Math.sin(pos[0]*26+pos[1]*3);
  if(mat.pattern==='wool')value+=.018*Math.sin(pos[0]*34)*Math.sin(pos[1]*28);
  if(mat.pattern==='hair')value+=.06*Math.sin(pos[0]*28+pos[2]*9);
  if(mat.pattern==='fur')value+=.025*Math.sin(pos[0]*21+pos[1]*10);
  if(mat.pattern==='cat')value-=Math.max(0,Math.sin(pos[2]*17+pos[1]*5))*.08;
  if(mat.pattern==='scale')value+=.035*Math.sin(pos[0]*18)*Math.sin(pos[1]*19);
  if(mat.pattern==='stone')value+=.04*Math.sin(pos[0]*13+pos[1]*7+pos[2]*11);
 }
 if(mat.emission)value=.65+.30*Math.max(0,diffuse);
 const tone=value<.06?0:value<.29?1:value<.53?2:value<.83?3:4;
 return mat.colors[tone];
}

// 공식 도판 1·2번에서 관찰한 홍채 윗면, 아랫면, 반사광의 RGB 중앙값을 평균했다.
const palette={
 F02:{top:[49,36,88],bottom:[197,106,246],glint:[225,168,218]},
 M01:{top:[109,130,181],bottom:[196,201,169],glint:[253,254,253]}
};
const mixture=(a,b,t)=>a.map((v,k)=>Math.round(v*(1-t)+b[k]*t));
function pigments(colors){
 const entries=[['upper',colors.top],['lower',colors.bottom],['middle',mixture(colors.top,colors.bottom,.46)],['glint',colors.glint]];
 return Object.fromEntries(entries.map(([name,rgb])=>['iris41-'+name,{colors:[.84,.88,.94,1,1.02].map(v=>rgb.map(c=>Math.min(255,Math.round(c*v)))),roughness:.8,specular:0,pattern:'none'}]));
}
// 눈 표면을 만들 때 사용한 열·행 순서에서 안료 삼각형만 나눈다. 위치·법선·깊이 검사는 그대로 쓴다.
export function iris41(scene,id,mode='bands'){
 if(!Object.hasOwn(palette,id)||!['tint','bands'].includes(mode))return scene;
 const materials=pigments(palette[id]),parts=[];
 const columns=52,rows=20;
 for(const patch of scene.parts){
   if(patch.name!=='eye34'||patch.vertices.length!==(columns+1)*(rows+1)){parts.push(patch);continue;}
   const groups=new Map(),female=id==='F02';
   for(const face of patch.faces){
     const index=Math.min(...face),row=Math.min(rows-1,Math.floor(index/(columns+1)));
     const u=2*face.reduce((sum,k)=>sum+k%(columns+1),0)/(3*columns)-1;
     const v=face.reduce((sum,k)=>sum+Math.floor(k/(columns+1)),0)/(3*rows);
     let mat=patch.mat;
     if(mode==='tint'){
       if(mat==='iris34')mat='iris41-middle';
     }else if(mat!=='portrait-sclera'){
       // 기존 홍채 테두리의 범위를 넘지 않는다. 힘멜은 반사광이 동공 아래, 페른은 중앙에 보인다.
       if(mat==='iris34')mat=v<.44?'iris41-lower':v<.55?'iris41-middle':'iris41-upper';
       if(mat==='sclera')mat=v<.45?'iris41-lower':'iris41-upper';
       const cx=female?-.045:-.04,cy=female?.51:.34;
       const spot=((u-cx)/(female?.095:.145))**2+((v-cy)/(female?.15:.092))**2;
       if(spot<1&&row>0)mat='iris41-glint';
     }
     if(!groups.has(mat))groups.set(mat,[]);groups.get(mat).push(face);
   }
   for(const [mat,faces]of groups)parts.push({...patch,mat,faces});
 }
 return {...scene,studyMaterials:{...scene.studyMaterials,...materials},parts};
}

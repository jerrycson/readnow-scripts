import {ellipsoid as E,loft,taper,mix} from './geometry.mjs';
import {humanEar} from './ear-anatomy.mjs';
import {sculptHead} from './head-surface.mjs';
// Authored shape recipes; descriptors do not imply ethnicity, personality or health.
const entries=(rows,keys)=>rows.map(([name,...values],i)=>Object.freeze({id:i,name,...Object.fromEntries(keys.map((k,j)=>[k,values[j]]))}));
export const FACE_SHAPES=entries([
 ['타원',1,1,.56,.88],['둥근형',1.15,.96,.78,1],['긴 타원',.87,1.06,.52,.80],['사각',1.08,1,.92,.96],['둥근 사각',1.10,1,.84,1.04],
 ['하트형',1.10,1,.40,.86],['역삼각',1.12,1.02,.34,.76],['마름모',1,1.04,.44,1.12],['넓은 턱',1.02,1,.94,.83],['좁은 턱',.98,1,.36,.90],
 ['넓은 볼',1.13,.96,.60,1.14],['좁은 볼',.90,1.03,.60,.76],['길고 각진형',.91,1.08,.82,.88],['짧은 타원',1.08,.91,.62,.96],['배형',1.02,.98,.92,1.08],
 ['작은 턱과 볼',.95,.95,.44,.81],['높은 광대',1.02,1.03,.48,1.16],['낮고 넓은 턱',1.08,.94,1,.96],['완만한 오각',1.04,1,.72,1.02],['부드러운 하트',1.08,.98,.50,.98]
],['width','length','jaw','cheek']);
export const EYE_SHAPES=entries([
 ['둥근 눈',.88,1.25,0,.85],['큰 둥근 눈',1.12,1.35,0,.88],['가로로 긴 눈',1.32,.72,0,.64],['아몬드',1.16,.92,.03,.70],['올라간 아몬드',1.15,.88,.24,.70],
 ['내려간 아몬드',1.16,.90,-.22,.70],['가는 눈',1.25,.46,.05,.58],['두터운 윗눈꺼풀',1.10,.77,0,.82],['작고 둥근 눈',.74,.96,0,.72],['넓고 부드러운 눈',1.30,1.12,-.07,.82],
 ['길고 올라간 눈',1.40,.64,.27,.62],['길고 내려간 눈',1.35,.66,-.25,.65],['깊은 눈두덩',1,.72,.06,.62],['타원형 눈',.88,1.16,.03,.82],['넓은 아랫눈꺼풀',1.18,1.06,-.04,.95],
 ['평평한 윗선',1.22,.78,0,.52],['아치형 윗선',1.06,1.22,0,1],['날렵한 눈꼬리',1.30,.86,.32,.66],['동그란 눈꼬리',.96,1.02,-.08,.94],['작고 긴 눈',.86,.60,.12,.68]
],['width','height','tilt','arch']);
export const NOSE_SHAPES=entries([
 ['작은 코',.72,.72,.65,0],['곧은 코',1,1,1,0],['긴 코',.92,1.35,1.2,0],['넓은 코',1.45,.94,.85,0],['둥근 코끝',1.15,.86,1.12,.02],
 ['들린 코끝',.9,.8,.9,.08],['아래로 향한 코끝',.92,1.12,1.22,-.07],['높은 콧대',.80,1.17,1.42,0],['낮은 콧대',1.15,.85,.55,0],['좁은 코',.65,1.07,.96,0],
 ['매부리 곡선',.92,1.22,1.35,-.025],['짧고 넓은 코',1.35,.70,.72,.02],['긴 둥근 코끝',1.16,1.25,1.08,-.04],['넓은 콧방울',1.6,1,.95,0],['가는 콧방울',.70,.90,1.16,0],
 ['작은 단추코',.88,.57,.76,.04],['뭉툭한 코끝',1.32,.82,1.30,0],['길고 낮은 코',1.10,1.30,.64,0],['각진 코끝',1.04,.95,1.44,0],['완만한 콧대',1.12,1.08,.82,.02]
],['width','length','depth','tip']);
export const MOUTH_SHAPES=entries([
 ['중간 입술',1,1,0,.02],['작은 입',.68,.83,0,.02],['넓은 입',1.45,.95,0,.01],['얇은 입술',1.16,.45,0,.01],['도톰한 입술',1.12,1.65,0,.04],
 ['작고 도톰한 입술',.76,1.45,0,.05],['넓고 얇은 입술',1.52,.5,0,.01],['윗입술 강조',1.05,1.3,.03,.06],['아랫입술 강조',1.08,1.4,-.025,.015],['선명한 입술산',.98,1.1,0,.08],
 ['완만한 입술산',1.2,.9,0,.01],['살짝 오른 입꼬리',1.08,.9,.04,.03],['살짝 내린 입꼬리',1.10,.9,-.04,.03],['가로로 긴 중간형',1.55,1.1,0,.04],['짧은 직선형',.72,.55,0,0],
 ['둥근 중심형',.95,1.35,0,.07],['두터운 바깥입술',1.25,1.45,0,.01],['길고 선명한 입술산',1.35,.85,0,.08],['작은 아치형',.8,.9,.03,.06],['완만한 중간형',1.14,.78,-.015,.015]
],['width','fullness','corner','cupid']);
export const EAR_SHAPES=entries([
 ['중간 귀',1,1,0,.8],['작은 귀',.72,.75,0,.6],['큰 귀',1.25,1.30,0,.95],['긴 귀',.92,1.4,0,.9],['넓은 귀',1.4,.98,0,.7],
 ['붙은 귓불',.98,1.02,0,.2],['둥근 귓불',1.08,1.1,0,1.2],['두터운 귓불',1.22,1.06,0,1.45],['얇은 테두리',.82,1.14,0,.68],['도톰한 테두리',1.28,1.05,0,.8],
 ['윗부분이 넓은 귀',1.35,1.16,.04,.45],['아랫부분이 넓은 귀',1.15,1.18,-.04,1.25],['앞으로 열린 귀',1.4,1.12,.09,.8],['머리에 붙은 귀',.64,1.18,-.05,.7],['짧고 둥근 귀',1.2,.75,0,.7],
 ['길고 좁은 귀',.70,1.48,0,.8],['기울어진 귀',.96,1.2,.10,.8],['각진 윗귀',1.12,1.18,.07,.6],['얇은 긴 귓불',.82,1.3,0,1.5],['작은 넓은 귀',1.18,.84,-.03,.4]
],['width','length','tilt','lobe']);
export const FACIAL_OPTIONS={faceShape:FACE_SHAPES,eyeShape:EYE_SHAPES,noseShape:NOSE_SHAPES,mouthShape:MOUTH_SHAPES,earShape:EAR_SHAPES};
export function makeFace(parts,s,p,chin){
 const {cute,manga,t}=p,face=FACE_SHAPES[s.faceShape],eyes=EYE_SHAPES[s.eyeShape],nose=NOSE_SHAPES[s.noseShape],mouth=MOUTH_SHAPES[s.mouthShape],ear=EAR_SHAPES[s.earShape];
 const {width,depth,front,normal}=sculptHead(parts,s,p,chin,face,nose,mouth);
 const patchOnFace=(name,mat,cx,cy,rx,ry,offset)=>{const vertices=[{p:[cx,cy,front(cx,cy)+offset],n:normal(cx,cy)}],faces=[];for(let k=0;k<20;k++){const a=k/20*Math.PI*2,x=cx+Math.cos(a)*rx,y=cy+Math.sin(a)*ry;vertices.push({p:[x,y,front(x,y)+offset],n:normal(x,y)});}for(let k=0;k<20;k++)faces.push([0,k+1,(k+1)%20+1]);parts.push({name,mat,vertices,faces});};
 const eyeY=chin+(cute?.35:manga?.46:.49),eyeX=width*(cute?.40:.43),ew=(cute?.125:manga?.089:.070)*eyes.width,eh=(cute?.115:manga?(p.f?.057:.048):.032)*eyes.height*(1-s.age*.22);
 for(const side of [-1,1]){
  const ex=side*eyeX,ez=front(ex,eyeY)+.006;
  const patch={name:'eye-white',mat:'sclera',vertices:[{p:[ex,eyeY,ez],n:normal(ex,eyeY)}],faces:[]};
  for(let k=0;k<16;k++){const a=k/16*Math.PI*2,x=Math.cos(a)*ew,y=Math.sin(a)*eh*(Math.sin(a)>0?eyes.arch:.8)+x*eyes.tilt*side;patch.vertices.push({p:[ex+x,eyeY+y,front(ex+x,eyeY+y)+.006],n:normal(ex+x,eyeY+y)});}
  for(let k=0;k<16;k++)patch.faces.push([0,1+k,1+(k+1)%16]);parts.push(patch);
  patchOnFace('iris','iris',ex,eyeY,Math.min(ew*.49,eh*.64),eh*.76,.009);
  patchOnFace('pupil','eye',ex,eyeY,Math.min(ew*.23,eh*.28),eh*.43,.012);
  if(cute||manga)patchOnFace('eye-glint','sclera',ex-ew*.12,eyeY+eh*.28,ew*.10,eh*.14,.015);
  for(let k=0;k<12;k++){const a=k/12*Math.PI,b=(k+1)/12*Math.PI,x1=Math.cos(a)*ew,x2=Math.cos(b)*ew,y1=Math.sin(a)*eh*eyes.arch+x1*eyes.tilt*side,y2=Math.sin(b)*eh*eyes.arch+x2*eyes.tilt*side;taper(parts,[ex+x1,eyeY+y1,front(ex+x1,eyeY+y1)+.006],[ex+x2,eyeY+y2,front(ex+x2,eyeY+y2)+.006],[[0,cute?.008:p.f?.005:.006,.004],[1,cute?.008:p.f?.005:.006,.004]],'hair','upper-eyelid');}
  for(let k=0;k<6;k++){const x1=ex-ew*.9+k*ew*.3,x2=x1+ew*.3,y1=eyeY+eh+.045+eyes.tilt*(x1-ex)*side,y2=eyeY+eh+.045+eyes.tilt*(x2-ex)*side;taper(parts,[x1,y1,front(x1,y1)+.004],[x2,y2,front(x2,y2)+.004],[[0,p.f?.005:.008,.003],[1,p.f?.004:.007,.003]],'hair','brow');}
  humanEar(parts,ear,side,width,chin,cute);
  if(!cute&&s.age>.4){taper(parts,[ex-ew*.6,eyeY-eh-.035,front(ex,eyeY)-.003],[ex+ew*.9,eyeY-eh-.045,front(ex+ew*.8,eyeY)+.008],[[0,.008,.006],[1,.006,.006]],'skin-shadow','under-eye-fold');}
 }
 const ny=chin+(cute?.27:.305+nose.tip*.4-(nose.length-1)*.075);
 if(cute)E(parts,[0,ny+nose.tip,front(0,ny)+.011],[.021*nose.width,.022*nose.length,.018*nose.depth],'skin',null,'nose');
 else if(!manga)for(const side of [-1,1]){const x=side*.032*nose.width;patchOnFace('nostril','lip',x,ny-.031,.010*nose.width,.004,.005);}
 const my=chin+(cute?.17:.19),mw=(cute?.059:p.f?.095:.10)*mouth.width;
 // A ribbon conforms to the mask in every view, including the lip corners.
 // Small changes in surface colour describe the lips without detached rods.
 const line=u=>my+(cute?.014:mouth.corner)*u*u-(cute?.003:mouth.cupid*.16*Math.exp(-((u/.23)**2)));
 for(const [name,mat,lower]of cute?[['mouth-line','lip',false]]:[['upper-lip','lip',false],['lower-lip','lower-lip',true]]){
  const mesh={name,mat,vertices:[],faces:[]};
  for(let i=0;i<=24;i++){const u=i/12-1,x=u*mw,y=line(u),thickness=(cute?.012:lower?.017:.012)*mouth.fullness*Math.max(0,1-u*u),edge=y+(lower?-1:1)*thickness;for(const yy of [y,edge])mesh.vertices.push({p:[x,yy,front(x,yy)+.005],n:normal(x,yy)});if(i){const j=i*2;mesh.faces.push([j-2,j-1,j],[j,j-1,j+1]);}}
  parts.push(mesh);
 }
 return {width,depth};
}


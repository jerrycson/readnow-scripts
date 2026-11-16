import {ellipsoid as E,loft,taper,mix} from './geometry.mjs';
import {humanEar} from './ear-anatomy.mjs';
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
 const baseWidth=cute?(s.candidate==='A'?.54:s.candidate==='C'?.63:.59):manga?.38:mix(.365,.35,t),width=baseWidth*face.width,depth=cute?.435:.36;
 const lower=cute?width*.52:face.jaw*(manga?.20:.24),cheek=width*face.cheek;
 const rings=[[chin+.015,lower,depth*.46,.02],[chin+.14,cute?width*.79:width*(.50+face.jaw*.32),depth*.78,.025],[chin+.34,cheek*(cute?.97:.92),depth*.98,.01],[chin+.58,width,depth,-.015],[chin+.79,width*.94,depth*.91,-.02],[chin+.94,width*.58,depth*.58,-.02],[chin+1,.04,.05,-.025]];
 for(const ring of rings)ring[0]=chin+(ring[0]-chin-.5)*face.length+.5;
 loft(parts,rings,'skin','head');
 const front=(x,y)=>{let a=rings[0],b=rings[1];for(let i=0;i<rings.length-1;i++)if(y>=rings[i][0]&&y<=rings[i+1][0]){a=rings[i];b=rings[i+1];break;}const k=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0]))),rx=mix(a[1],b[1],k),rz=mix(a[2],b[2],k),zc=mix(a[3],b[3],k);return zc+rz*Math.sqrt(Math.max(.06,1-(x/rx)**2));};
 const patchOnFace=(name,mat,cx,cy,rx,ry,offset)=>{const vertices=[{p:[cx,cy,front(cx,cy)+offset],n:[0,0,1]}],faces=[];for(let k=0;k<20;k++){const a=k/20*Math.PI*2,x=cx+Math.cos(a)*rx,y=cy+Math.sin(a)*ry;vertices.push({p:[x,y,front(x,y)+offset],n:[0,0,1]});}for(let k=0;k<20;k++)faces.push([0,k+1,(k+1)%20+1]);parts.push({name,mat,vertices,faces});};
 const eyeY=chin+(cute?.40:manga?.46:.49),eyeX=width*(cute?.40:.43),ew=(cute?.10:manga?.080:.062)*eyes.width,eh=(cute?.105:manga?.060:.032)*eyes.height*(1-s.age*.22);
 for(const side of [-1,1]){
  const ex=side*eyeX,ez=front(ex,eyeY)+.012;
  const patch={name:'eye-white',mat:'sclera',vertices:[{p:[ex,eyeY,ez+.014],n:[0,0,1]}],faces:[]};
  for(let k=0;k<16;k++){const a=k/16*Math.PI*2,x=Math.cos(a)*ew,y=Math.sin(a)*eh*(Math.sin(a)>0?eyes.arch:.8)+x*eyes.tilt*side;patch.vertices.push({p:[ex+x,eyeY+y,front(ex+x,eyeY+y)+.018],n:[0,0,1]});}
  for(let k=0;k<16;k++)patch.faces.push([0,1+k,1+(k+1)%16]);parts.push(patch);
  patchOnFace('iris','iris',ex,eyeY,Math.min(ew*.46,eh*.65),eh*.72,.029);
  patchOnFace('pupil','eye',ex,eyeY,Math.min(ew*.25,eh*.3),eh*.45,.032);
  if(cute||manga)patchOnFace('eye-glint','sclera',ex-ew*.12,eyeY+eh*.28,ew*.13,eh*.17,.035);
  for(let k=0;k<6;k++){const a=k/6*Math.PI,b=(k+1)/6*Math.PI,x1=Math.cos(a)*ew,x2=Math.cos(b)*ew,y1=Math.sin(a)*eh*eyes.arch+x1*eyes.tilt*side,y2=Math.sin(b)*eh*eyes.arch+x2*eyes.tilt*side;taper(parts,[ex+x1,eyeY+y1,front(ex+x1,eyeY+y1)+.025],[ex+x2,eyeY+y2,front(ex+x2,eyeY+y2)+.025],[[0,cute?.012:.009,.009],[1,cute?.012:.009,.009]],'hair','upper-eyelid');}
  for(let k=0;k<3;k++){const x1=ex-ew*.9+k*ew*.6,x2=x1+ew*.6,y1=eyeY+eh+.055+eyes.tilt*(x1-ex)*side,y2=eyeY+eh+.055+eyes.tilt*(x2-ex)*side;taper(parts,[x1,y1,front(x1,y1)+.008],[x2,y2,front(x2,y2)+.008],[[0,.011,.005],[1,.010,.005]],'hair','brow');}
  humanEar(parts,ear,side,width,chin,cute);
  if(!cute&&s.age>.4){taper(parts,[ex-ew*.6,eyeY-eh-.035,front(ex,eyeY)-.003],[ex+ew*.9,eyeY-eh-.045,front(ex+ew*.8,eyeY)+.008],[[0,.008,.006],[1,.006,.006]],'skin-shadow','under-eye-fold');}
 }
 const ny=chin+(cute?.27:.34),nw=(cute?.025:.043)*nose.width,nh=(cute?.030:.085)*nose.length,nz=front(0,ny);
 if(cute)E(parts,[0,ny+nose.tip,nz+.025],[nw,nh,.027*nose.depth],'skin',null,'nose');
 else {
  const top=chin+.53,tip=ny+nose.tip*.4-(nose.length-1)*.09,extension=(manga?.065:.095)*nose.depth;
  loft(parts,[[tip-.045,nw*.75,.025,nz+.035],[tip-.012,nw,.043,nz+extension*.62],[tip+.035,nw*.72,.040,nz+extension*.8],[top-.055,nw*.50,.028,front(0,top-.055)+extension*.30],[top,nw*.34,.014,front(0,top)+.003]],'skin','nose-bridge-tip');
  for(const side of [-1,1]){E(parts,[side*nw*.82,tip-.025,nz+.032],[nw*.52,.026,.036],'skin',null,'nose-wing');if(!manga)E(parts,[side*nw*.64,tip-.040,nz+.048],[nw*.25,.008,.012],'skin-shadow',null,'nostril');}
 }
 const my=chin+(cute?.17:.19),mw=(cute?.059:.071)*mouth.width,mz=front(0,my)+.018;
 for(const side of [-1,1]){
  taper(parts,[0,my+mouth.cupid*.25,mz],[side*mw,my+mouth.corner,mz-.007],[[0,.010*mouth.fullness,.008],[1,.006,.006]],'lip','upper-lip');
  if(!cute)taper(parts,[0,my-.014*mouth.fullness,mz+.005],[side*mw,my+mouth.corner,mz-.007],[[0,.012*mouth.fullness,.008],[1,.005,.006]],'lip','lower-lip');
 }
 return {width,depth};
}

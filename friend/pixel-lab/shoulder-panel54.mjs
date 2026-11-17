import {mountAngle46} from './studio-angle46.mjs';

const neutral={plane:'side',side:'both',elevation:0,flexion:0,twist:0,reach:false,joined:true};
const dimensions={elevation:['팔 들기',0,178],flexion:['팔꿈치 굽힘',0,145],twist:['위팔 비틀기',-70,70]};
export function mountShoulder54(host,change,edition=54){
  const make=(tag,txt='')=>{const node=document.createElement(tag);node.textContent=txt;return node;};
  const rest=edition>=56?{...neutral,surface56:0}:neutral;
  let state={...rest},dimension='elevation',applied=false;
  const labels=[];
  function group(title,options,choose){
    const head=make('h2',title),row=make('div');row.className='choices';host.append(head,row);
    for(const [key,label] of options){
      const b=make('button',label);b.type='button';b.dataset.key=key;row.append(b);b.onclick=()=>choose(key);
    }
    return key=>{for(const b of row.children)b.setAttribute('aria-pressed',String(b.dataset.key===String(key)));};
  }
  function update(delta,done=true){state={...state,...delta};applied=true;refresh();change({...state},done);}
  labels.push(['side',group('움직일 팔',[['both','양팔'],['left','모델 왼팔'],['right','모델 오른팔']],side=>update({side}))]);
  labels.push(['plane',group('팔을 드는 방향',[['side','옆'],['scapular','비스듬히 앞'],['front','앞']],plane=>update({plane,reach:false}))]);
  const markPose=group('자세 비교',[['original','기존 중립'],['0','연결 중립'],['45','45°'],['90','90°'],['120','120°'],['178','178°'],['head','머리 뒤에 손']],key=>{
    if(key==='original'){applied=false;state={...rest};refresh();change(null,true);return;}
    if(key==='head')update({plane:'scapular',elevation:120,reach:true,twist:0,flexion:0});
    else update({reach:false,elevation:Number(key),flexion:0,twist:0});
  });
  const markDim=group('각도 정밀 조절',Object.entries(dimensions).map(([k,v])=>[k,v[0]]),key=>{dimension=key;refresh();});
  const wheel=make('div'),row=make('div'),range=make('input'),number=make('input');
  row.className='row';range.type='range';range.min=0;range.max=178;range.value=0;number.type='number';
  range.step=number.step=1;row.append(range,number);host.append(wheel,row);
  const dial=mountAngle46({host:wheel,range,number});
  range.oninput=()=>update({[dimension]:range.valueAsNumber,reach:false},false);
  const seam=make('label'),check=make('input');seam.className='check';check.type='checkbox';seam.append(check,' 몸통과 위팔을 잇는 피부');host.append(seam);
  check.onchange=()=>update({joined:check.checked});
  let surface,amount,surfaceMark;
  if(edition>=56){
    const title=make('h2','56차 어깨 표면 · 수동 비교'),label=make('label','표면보정 강도'),row=make('div');row.className='row';
    surface=make('input');surface.id='shoulderSurface56';surface.type='range';amount=make('input');amount.type='number';amount.id='shoulderSurface56Number';label.htmlFor=surface.id;
    for(const input of [surface,amount]){input.min=0;input.max=100;input.step=1;input.ariaLabel='56차 어깨 표면보정 강도'+(input===amount?' 직접 입력':'');input.oninput=()=>{if(input.validity.valid&&Number.isFinite(input.valueAsNumber))update({surface56:input.valueAsNumber/100},false);};input.onchange=()=>{if(input.validity.valid&&Number.isFinite(input.valueAsNumber))update({surface56:input.valueAsNumber/100});};}
    row.append(surface,amount,make('span','%'));host.append(title,label,row);
    surfaceMark=group('표면 비교',[['0','0% · 55차 표면'],['100','100% · 56차 후보']],v=>update({surface56:Number(v)/100}));
    host.append(make('p','강도와 관절은 되돌리기로 복원합니다. 국소 보정 후보이며 모든 방향의 개선이나 기본형 승인 결과는 아닙니다.'));
  }
  const note=make('p');host.append(note);
  function refresh(){
    for(const [key,mark] of labels)mark(state[key]);
    markDim(dimension);
    markPose(!applied?'original':state.reach?'head':state.twist||state.flexion?'':state.elevation);
    range.min=dimensions[dimension][1];range.max=dimensions[dimension][2];range.value=state[dimension];
    range.ariaLabel=dimensions[dimension][0];number.ariaLabel=dimensions[dimension][0]+' 직접 입력';
    dial.sync();wheel.querySelector('canvas').ariaLabel=dimensions[dimension][0]+' 각도 다이얼';
    check.checked=state.joined;
    if(surface){const percent=Math.round(100*(state.surface56||0));surface.value=percent;amount.value=percent;surfaceMark(String(percent));}
    note.textContent=state.reach?'손목을 뒤통수 쪽에 두는 도달 시험입니다.':state.elevation>120?'120°를 넘는 어깨뼈 움직임은 추정 구간입니다.':'';
  }
  return raw=>{state={...rest,...raw};applied=Boolean(raw);refresh();};
}

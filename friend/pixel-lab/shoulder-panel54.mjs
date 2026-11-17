import {mountAngle46} from './studio-angle46.mjs';

const neutral={plane:'side',side:'both',elevation:0,flexion:0,twist:0,reach:false,joined:true};
const dimensions={elevation:['팔 들기',0,178],flexion:['팔꿈치 굽힘',0,145],twist:['위팔 비틀기',-70,70]};
export function mountShoulder54(host,change,edition=54){
  const make=(tag,txt='')=>{const node=document.createElement(tag);node.textContent=txt;return node;};
  const rest=edition>=57?{...neutral,surface56:0,transition57:0}:edition>=56?{...neutral,surface56:0}:neutral;
  let state={...rest},dimension='elevation',applied=false,haltPlayback=()=>{};
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
  range.step=number.step=edition>=57?.001:1;row.append(range,number);host.append(wheel,row);
  const dial=mountAngle46({host:wheel,range,number});
  range.oninput=()=>update({[dimension]:range.valueAsNumber,reach:false},false);
  if(edition>=57){
    const commitAngle=()=>change({...state},true);
    range.onchange=commitAngle;number.addEventListener('change',commitAngle);
    number.addEventListener('keydown',e=>{if(e.key==='Enter')commitAngle();});
    for(const type of ['pointerup','pointercancel','lostpointercapture','keyup'])wheel.addEventListener(type,commitAngle);
  }
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
  let transition,transitionMark;
  if(edition>=57){
    host.append(make('h2','57차 · 첫 움직임의 피부'));
    const label=make('label');label.className='check';transition=make('input');transition.type='checkbox';transition.id='shoulderTransition57';
    label.append(transition,' 중립 피부를 골격에 붙여 이동');host.append(label);
    transition.onchange=()=>update({transition57:transition.checked?1:0});
    transitionMark=group('작은 각도 맞대기',[['0','정지'],['0.001','0.001°'],['0.1','0.1°'],['1','1°'],['5','5°'],['10','10°']],v=>update({elevation:Number(v),twist:0,flexion:0,reach:false}));
    const play=make('button','0→10→0° 재생');play.type='button';play.id='shoulderTransitionPlay57';host.append(play);
    let timer=0,epoch=0;
    const stop=(commit=false)=>{if(timer)clearInterval(timer);timer=0;play.textContent='0→10→0° 재생';play.setAttribute('aria-pressed','false');if(commit)change({...state},true);};
    haltPlayback=()=>stop();
    play.onclick=()=>{
      if(timer){stop(true);return;}
      epoch=performance.now();play.textContent='재생 멈춤';play.setAttribute('aria-pressed','true');
      update({elevation:0,twist:0,flexion:0,reach:false},false);
      timer=setInterval(()=>{
        if(document.hidden||!host.getClientRects().length){stop(true);return;}
        const t=Math.min(1,(performance.now()-epoch)/8000),angle=10*Math.sin(Math.PI*t)**2;
        update({elevation:Math.round(angle*1000)/1000,twist:0,flexion:0,reach:false},false);
        if(t===1)stop(true);
      },160);
    };
    addEventListener('pagehide',()=>stop());
    addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='bookfriend:studio-active'&&!e.data.active)stop(true);});
    host.append(make('p','첫 10°를 비교하는 연구 후보입니다. 일부 체형의 주름은 아직 악화되므로 기본값은 꺼짐입니다. 관측 각도·해상도·체형을 함께 바꿔 확인하세요.'));
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
    if(transition){transition.checked=!!state.transition57;transitionMark(state.twist||state.flexion?'':String(state.elevation));}
    note.textContent=state.reach?'손목을 뒤통수 쪽에 두는 도달 시험입니다.':state.elevation>120?'120°를 넘는 어깨뼈 움직임은 추정 구간입니다.':'';
  }
  return raw=>{haltPlayback();state={...rest,...raw};applied=Boolean(raw);refresh();};
}

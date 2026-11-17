const node=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text??''});
const $=id=>document.getElementById(id);
const names={F02:'페른',M01:'힘멜',W:'가슴 기본형'};
for(const [id,name] of Object.entries(names)){
  const article=node('article');article.className='strip';article.append(node('h3',name));
  const sheet=node('div');sheet.className='sheet';const keys=node('div');keys.className='keys';keys.append(node('span','37차'),node('span','38차'));
  const scroll=node('div');scroll.className='scroll';scroll.tabIndex=0;scroll.setAttribute('aria-label',name+' 회전 표본');
  const angles=node('div');angles.className='angles';for(const a of ['정면','−45°','−90°','−135°','후면','135°','90°','45°'])angles.append(node('span',a));
  const img=node('img');img.src='orbit38-'+id+'.png';img.width=384;img.height=96;img.alt=name+' 같은 각도의 두 회차, 정면부터 한 바퀴';scroll.append(angles,img);sheet.append(keys,scroll);article.append(sheet);$('sheets').append(article);
}
function size(double){$('sheets').classList.toggle('enlarged',double);$('actual').setAttribute('aria-pressed',!double);$('double').setAttribute('aria-pressed',double);}
$('actual').onclick=()=>size(false);$('double').onclick=()=>size(true);
try{
  async function data(name){const r=await fetch(name);if(!r.ok)throw Error(name);return r.json();}
  const [face,chest]=await Promise.all(['face-eval38.json','chest-eval38.json'].map(data));
  const grid=$('figures');grid.className='results-grid';
  for(const id of ['F02','M01']){
    const {baseline:a,candidate:b}=face.cases[id],art=node('article');
    art.append(node('h3',names[id]+' · 측면 턱밑'),node('p','가시 밑선의 높이 오차 '+a.horizontalColumnMae.toFixed(2)+' → '+b.horizontalColumnMae.toFixed(2)+'px'),node('p','턱선 접선의 각도 오차 '+a.tangentMaeDeg.toFixed(1)+' → '+b.tangentMaeDeg.toFixed(1)+'°. 목으로 꺾이는 구간의 최대 각도 변화 '+a.maxTurnDeg.toFixed(1)+' → '+b.maxTurnDeg.toFixed(1)+'°.'));grid.append(art);
  }
  const art=node('article');art.append(node('h3','가슴 기본형 · 밑선'));
  for(const [cell,label] of [['B3','사선 B3'],['S3','측면 S3']]){
    const row=chest.paper[cell],px=record=>record.errorsPx.map(v=>v.toFixed(2)).join(' / ');
    if(row?.before?.errorsPx&&row?.after?.errorsPx)art.append(node('p',label+' 관측선 거리 '+px(row.before)+' → '+px(row.after)+'px'));
  }
  const near=chest.paper.B3,initial=near.before.floors?.[0],final=near.after.floors?.[0];
  if(initial&&final){
    const gap=q=>Math.abs(q.model.bottom-q.source.bottom).toFixed(2);
    art.append(node('p','사선에서 가까운 쪽 밑바닥 높이 차 '+gap(initial)+' → '+gap(final)+'px.'),node('p','초기 시안은 이 차이를 3.51px까지 줄였지만, 밑선만 분리해 다시 재자 측면 오차가 2.55→7.81px로 커져 보류했습니다.'));
  }
  art.append(node('p','정면에서는 짧게 두 줄로 보이는 접힘이 남습니다. 바로 아래에서 본 전신은 발과 골반에 가려 이 도판만으로 밑면을 확인하기 어렵습니다.'));
  const link=node('a','밑선 겹쳐 보기');link.href='contour36.html?round=38&case=W&cell=B3';art.append(link);grid.append(art);
  const results=await Promise.all(['face-note38.json','chest-note38.json'].map(async path=>{const r=await fetch(path);if(!r.ok)throw Error(path);return r.json();}));
  $('studies').replaceChildren();
  for(const rec of results.flat()){
    const article=node('article');article.className='note';const d=node('details');d.append(node('summary','한 문단 요약과 상세 설명'),node('p',rec.unit),node('p',rec.detail));const a=node('a','원전 열기');a.href=rec.url;d.append(a);article.append(node('h3',rec.title),node('p',rec.line),d);$('studies').append(article);
    const print=node('article');print.append(node('h1',rec.title),node('p',rec.line),node('h2','문단 요약'),node('p',rec.unit),node('h2','상세 설명'),node('p',rec.detail));const credit=node('p','출처 · '+rec.url);credit.className='credit';print.append(credit);$('printDoc').append(print);
  }
  $('print').disabled=false;$('print').onclick=()=>window.print();
}catch(error){$('studies').textContent='원고를 여는 중 문제가 생겼습니다. 새로고침해 주세요. '+error.message;}

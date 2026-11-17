const el=(tag,text,className)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(className)e.className=className;return e;};
const external=url=>{const u=new URL(url,location.href);if(!['https:','http:'].includes(u.protocol))throw Error('지원하지 않는 출처 주소');return u.href;};
async function notes(){
  const box=document.getElementById('notes');
  try{
    const response=await fetch('../../pixel-lab/engine-notes36.json');if(!response.ok)throw Error('원고 파일 응답 '+response.status);
    const data=await response.json();if(!Array.isArray(data))throw Error('원고 형식을 확인하세요.');
    const articles=data.map(n=>{
      const article=el('article',null,'research-note');article.id=n.noteId;
      article.append(el('p',n.group,'eyebrow'),el('h3',n.title),el('p',n.state,'status'),el('h4','한 줄 요약'),el('p',n.line),el('h4','한 문단 요약'),el('p',n.unit));
      const details=el('details'),summary=el('summary','A4 한 페이지용 상세 원고');details.append(summary,el('h4','상세 설명'),el('div',n.detail,'paper'));article.append(details);
      const source=el('p',null,'source'),a=el('a','원전 보기');a.href=external(n.url);a.target='_blank';a.rel='noopener';source.append(a);article.append(source);return article;
    });
    box.replaceChildren(...articles);
  }catch(error){box.textContent='원고를 읽지 못했습니다. 아래 연구 원고 데이터 링크에서 확인할 수 있습니다. '+error.message;}
}
async function evaluation(){
  const state=document.getElementById('evalState'),box=document.getElementById('evalMetrics');
  try{
    const r=await fetch('../../pixel-lab/engine-eval36.json',{cache:'no-store'});if(!r.ok)throw Error();const data=await r.json();
    const finite=Number.isFinite,conditions=[['calibratedFit','알려진 공통 카메라 · 입력 시점'],['calibratedHeldOut','알려진 공통 카메라 · 교정에 안 쓴 시점'],['boundingBoxHeldOut','사진별 자동 중심·크기 · 교정에 안 쓴 시점']];
    const table=el('table');table.style.cssText='width:100%;border-collapse:collapse;font-size:14px';
    const caption=el('caption','독립 투영 코드로 비교한 실루엣 · 최신 검증 파일에서 읽은 값');caption.style.textAlign='left';table.append(caption);
    const head=el('thead'),hr=el('tr');for(const text of ['조건','시점 수','평균 겹침률','평균 윤곽 거리']){const th=el('th',text);th.scope='col';th.style.cssText='text-align:left;padding:10px 6px;border-bottom:1px solid #bacbc1';hr.append(th);}head.append(hr);table.append(head);
    const body=el('tbody');
    for(const [key,label] of conditions){const value=data[key];if(!value||!finite(value.meanIoU)||!finite(value.meanBoundaryPx))continue;
      const row=el('tr');for(const text of [label,Array.isArray(value.rows)?String(value.rows.length):'—',(100*value.meanIoU).toFixed(3)+'%',value.meanBoundaryPx.toFixed(3)+'px']){const td=el('td',text);td.style.cssText='padding:10px 6px;border-bottom:1px solid #e3e8e0';row.append(td);}body.append(row);
    }
    table.append(body);const content=[];if(body.children.length)content.push(table);
    if(data.mesh&&finite(data.mesh.vertices)&&finite(data.mesh.triangles))content.push(el('p','독립 검증 기본 설정 메시: 정점 '+data.mesh.vertices.toLocaleString('ko-KR')+'개 · 삼각형 '+data.mesh.triangles.toLocaleString('ko-KR')+'개. 위의 촬영각 31° 브라우저 사례와 설정이 다릅니다.','source'));
    if(typeof data.method==='string')content.push(el('p',data.method,'source'));
    if(typeof data.limits==='string')content.push(el('p','검증 한계: '+data.limits,'status'));
    if(typeof data.credit==='string'){const p=el('p','입력 출처: '+data.credit+' · ','source');if(typeof data.source==='string'){const a=el('a','원본 출처');a.href=external(data.source);p.append(a);}if(typeof data.license==='string'){p.append(' · ');const a=el('a','이용 허락');a.href=external(data.license);p.append(a);}content.push(p);}
    box.replaceChildren(...content);state.textContent=body.children.length?'검증 파일을 읽어 대표값 반영 · 자세한 조건은 원문 확인':'검증 파일 있음 · 지원하는 대표 지표 없음';
  }
  catch{state.textContent='독립 검증 파일 준비 중 · 수치를 임의로 채우지 않습니다';}
}
document.getElementById('print').onclick=()=>{document.querySelectorAll('.research-note details').forEach(d=>d.open=true);window.print();};
window.addEventListener('beforeprint',()=>document.querySelectorAll('.research-note details').forEach(d=>d.open=true));
await Promise.allSettled([notes(),evaluation()]);

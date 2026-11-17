// 기존 관찰창 주소를 유지하며 42차만 전용 화면으로 보낸다. 이전 회차 엔진은 그대로 읽는다.
const url=new URL(location.href);
if(['50','51','52','53','54','55','56'].includes(url.searchParams.get('round'))){
  const target=new URL('workbench.html',url);
  target.search=url.search;target.hash=url.hash;location.replace(target.href);
}else if(['46','47','48','49'].includes(url.searchParams.get('round'))){
  const target=new URL('studio-sculpt.html',url);
  target.search=url.search;target.hash=url.hash;location.replace(target.href);
}else if(['42','43','44','45'].includes(url.searchParams.get('round'))){
 const id=['F02','M01','W'].includes(url.searchParams.get('case'))?url.searchParams.get('case'):'F02',target=new URL(id==='W'?'chest-review42.html':'face42.html',url);
 if(id==='W')target.searchParams.set('cell',url.searchParams.get('cell')||'B3');else{target.searchParams.set('case',id);for(const key of ['cell','variant'])if(url.searchParams.has(key))target.searchParams.set(key,url.searchParams.get(key));}
 target.hash=url.hash;location.replace(target.href);
}else await import('./contour36.mjs?v=44-lab');

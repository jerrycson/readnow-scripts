// 허용한 기존 탭만 주소로 연다. 다른 쿼리/해시와 기본 URL을 보존한다.
export function tabRoute({allowed,fallback,onPop}){
 const values=new Set(allowed),read=()=>{const value=new URL(location.href).searchParams.get('tab');return values.has(value)?value:fallback;};
 addEventListener('popstate',()=>onPop(read()));
 return {read,write(value){if(!values.has(value)||read()===value)return;const url=new URL(location.href);if(value===fallback)url.searchParams.delete('tab');else url.searchParams.set('tab',value);history.pushState(history.state,'',url);}};
}

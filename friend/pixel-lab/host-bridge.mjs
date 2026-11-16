// 기존 프로그램의 공개 통신 규약만 구현한다. 기존 캐릭터/boot 코드는 불러오지 않는다.
export function createHostBridge(host=globalThis){
 const direct=host.__rnFriendHost,tauri=host.__TAURI_INTERNALS__,android=host.RnHostAndroid;
 const kind=direct?.post?direct.type:tauri?.invoke?'tauri':android?.post?'android':'web';
 async function send(kindName,data){
  if(!['rects','open_settings','settings_close'].includes(kindName))throw new Error('허용하지 않은 프로그램 요청입니다.');
  if(direct?.post){await direct.post(kindName,data);return true;}
  if(tauri?.invoke){await tauri.invoke('friend_post',{kind:kindName,data});return true;}
  if(android?.post){await android.post(kindName,JSON.stringify(data));return true;}
  return false;
 }
 return {kind,available:kind!=='web',openSettings:()=>send('open_settings',{}),closeSettings:()=>send('settings_close',{}),rects:({rects,width,height,dpr=1})=>{
  if(!rects.every(r=>r.length===4&&r.every(Number.isFinite))||!Number.isFinite(width)||!Number.isFinite(height)||dpr<=0)throw new Error('눌림 영역의 좌표를 확인해 주세요.');
  return send('rects',{r:rects,vw:width,vh:height,dpr,kb:false,card:null,drag:false});
 }};
}

const digestPattern=/^[a-f0-9]{64}$/;
const releasePattern=/^[a-f0-9]{24}$/;
const media=new Set(['image/png','image/jpeg','image/webp','application/pdf']);
const decoder=new TextDecoder('utf-8',{fatal:true});

function fieldValid(file){
  return file && typeof file.key==='string' && file.key.length>0 && typeof file.path==='string' && file.path.length>0 &&
    media.has(file.mime) && digestPattern.test(file.sha256) && Number.isSafeInteger(file.bytes) && file.bytes>0;
}
function sameFile(a,b){return a.sha256===b.sha256 && a.bytes===b.bytes && a.mime===b.mime;}
function member(object,key){
  if(!object || !Object.hasOwn(object,key))throw Error('등록된 원본 키가 회차 본문에 없습니다.');
  return object[key];
}
function fileBytes(uri,file){
  const prefix='data:'+file.mime+';base64,';
  if(!uri.startsWith(prefix) || uri.length-prefix.length!==4*Math.ceil(file.bytes/3))throw Error('파일 형식 또는 원본 바이트 수가 다릅니다.');
  let bytes;
  try{
    const base64=uri.slice(prefix.length);
    if(typeof Uint8Array.fromBase64==='function')bytes=Uint8Array.fromBase64(base64);
    else {
      bytes=new Uint8Array(file.bytes);let at=0;
      for(let i=0;i<base64.length;i+=65536){
        const part=atob(base64.slice(i,i+65536));
        for(let j=0;j<part.length;j++)bytes[at++]=part.charCodeAt(j);
      }
      if(at!==file.bytes)throw Error();
    }
  }catch{throw Error('원본의 base64 부호를 읽을 수 없습니다.');}
  if(bytes.length!==file.bytes)throw Error('실제 파일의 바이트 수가 다릅니다.');
  const head=String.fromCharCode(...bytes.subarray(0,12));
  const matches=file.mime==='image/png'?head.startsWith('\x89PNG\r\n\x1a\n'):
    file.mime==='image/jpeg'?head.startsWith('\xff\xd8\xff'):
    file.mime==='image/webp'?head.startsWith('RIFF')&&head.slice(8,12)==='WEBP':head.startsWith('%PDF-');
  if(!matches)throw Error('파일 앞부분이 등록한 미디어 형식과 다릅니다.');
  return bytes;
}

// 보존된 JSON에서 문자열 경계를 바이트로 찾는다. 이전 회차 전체를 V8 문자열로 만들지 않는다.
function endString(bytes,start){
  let quote=start;
  while((quote=bytes.indexOf(34,quote+1))>=0){
    let back=quote-1;while(back>=start&&bytes[back]===92)back--;
    if((quote-1-back)%2===0)return quote+1;
  }
  throw Error('이전 원문의 문자열이 끝나지 않았습니다.');
}
const blank=x=>x===32||x===9||x===10||x===13;
function skipBlank(bytes,at){while(blank(bytes[at]))at++;return at;}
function endValue(bytes,start){
  if(bytes[start]===34)return endString(bytes,start);
  let depth=0,i=start;
  for(;i<bytes.length;i++){
    const c=bytes[i];
    if(c===34){i=endString(bytes,i)-1;continue;}
    if(c===123||c===91)depth++;
    else if(c===125||c===93){if(!depth)break;if(!--depth)return i+1;}
    else if(c===44&&!depth)break;
  }
  return i;
}
function objectFields(bytes,start,callback){
  if(bytes[skipBlank(bytes,start)]!==123)throw Error('이전 원문에 파일 목록이 없습니다.');
  let i=skipBlank(bytes,skipBlank(bytes,start)+1);
  while(bytes[i]!==125){
    if(bytes[i]!==34)throw Error('이전 원문 객체의 항목 이름이 잘못되었습니다.');
    const keyEnd=endString(bytes,i),key=JSON.parse(decoder.decode(bytes.subarray(i,keyEnd)));
    const colon=skipBlank(bytes,keyEnd);
    if(bytes[colon]!==58)throw Error('이전 원문 객체의 구분자를 확인해 주세요.');
    const valueStart=skipBlank(bytes,colon+1);
    if(callback(key,valueStart)===false)return;
    i=skipBlank(bytes,endValue(bytes,valueStart));
    if(bytes[i]===125)return;
    if(bytes[i]!==44)throw Error('이전 원문 객체의 항목을 구분할 수 없습니다.');
    i=skipBlank(bytes,i+1);
  }
}
function indexTexts(bytes){
  let found=false;const ranges=new Map();
  objectFields(bytes,0,(name,start)=>{
    if(name!=='texts')return;
    found=true;
    objectFields(bytes,start,(key,at)=>{
      if(ranges.has(key))throw Error('이전 원문에 중복 키가 있습니다.');
      ranges.set(key,[at,endValue(bytes,at)]);
    });
    return false;
  });
  if(!found)throw Error('이전 회차에 원본 자료가 없습니다.');
  return ranges;
}

export function createPreviousReader54({release,block,hash}){
  let cached=null;
  return async(ref,signal)=>{
    signal.throwIfAborted();
    const row=await release(ref.sourceRelease);
    signal.throwIfAborted();
    if(!row || row.project!=='bookfriend')throw Error('이전 회차가 인증된 Firestore에 없습니다.');
    if(row.adminSha!==ref.adminSha)throw Error('이전 회차의 관리자 지문이 참조 기록과 다릅니다.');
    if(!cached || cached.id!==ref.sourceRelease || cached.digest!==ref.adminSha){
      cached=null;
      if(!Array.isArray(row.docBlocks)||!row.docBlocks.length)throw Error('이전 회차의 원문 조각이 없습니다.');
      const parts=[];
      for(const id of row.docBlocks){
        if(!digestPattern.test(id))throw Error('이전 회차의 조각 ID가 올바르지 않습니다.');
        signal.throwIfAborted();
        const slice=await block(id);
        if(await hash(slice)!==id)throw Error('이전 회차의 원문 조각 지문이 다릅니다.');
        parts.push(new Blob([slice]));
      }
      signal.throwIfAborted();
      const blob=new Blob(parts),raw=new Uint8Array(await blob.arrayBuffer());
      if(await hash(raw)!==ref.adminSha)throw Error('이전 회차의 관리자 원문 전체 지문이 다릅니다.');
      signal.throwIfAborted();
      cached={id:ref.sourceRelease,digest:ref.adminSha,blob,ranges:indexTexts(raw)};
    }
    const range=cached.ranges.get(ref.sourceKey);
    if(!range)throw Error('이전 회차에 지정한 원본 키가 없습니다.');
    const value=JSON.parse(await cached.blob.slice(...range).text());
    signal.throwIfAborted();
    return value;
  };
}
export async function resolveEvidence54(archive,file,{previous,hash,signal}){
  if(!fieldValid(file))throw Error('자료 목록의 형식·지문·바이트 수를 확인해 주세요.');
  let value=member(archive.texts,file.key);const seen=new Set();
  while(typeof value!=='string'){
    signal.throwIfAborted();
    if(!value || !releasePattern.test(value.sourceRelease) || !digestPattern.test(value.adminSha) ||
      typeof value.sourceKey!=='string' || !value.sourceKey || !sameFile(file,value))throw Error('이전 회차 참조의 파일 지문·형식·바이트 수가 다릅니다.');
    if(!previous)throw Error('열람 파일로 이 회차의 직접 자료를 볼 수 있습니다. 이전 회차 원본은 Firebase 관리자 연결이 필요합니다.');
    const token=JSON.stringify([value.sourceRelease,value.sourceKey]);
    if(seen.has(token))throw Error('이전 회차 참조가 순환합니다.');
    seen.add(token);value=await previous(value,signal);
  }
  signal.throwIfAborted();
  const bytes=fileBytes(value,file);
  if(await hash(bytes)!==file.sha256)throw Error('선택한 파일의 원본 지문이 다릅니다.');
  signal.throwIfAborted();
  return new Blob([bytes],{type:file.mime});
}

export function mountEvidence54(host,hash){
  const find=host.querySelector('[type=search]'),list=host.querySelector('select'),status=host.querySelector('[role=status]'),
    preview=host.querySelector('[data-preview]'),download=host.querySelector('[download]'),open=host.querySelector('button');
  let current=null,previous=null,rows=[],url='',pending=null;
  function close(){
    pending?.abort();pending=null;preview.replaceChildren();download.removeAttribute('href');download.removeAttribute('download');download.hidden=true;
    if(url){URL.revokeObjectURL(url);url='';}
    status.textContent='';
  }
  function filter(){
    close();const query=find.value.toLocaleLowerCase().trim();
    const matches=[];
    rows.forEach((file,index)=>{if(file.path.toLocaleLowerCase().includes(query))matches.push(new Option(file.path,String(index)));});
    list.replaceChildren(...matches);
    open.disabled=list.disabled=!matches.length;status.textContent=matches.length+' / '+rows.length+'개 자료';
  }
  find.oninput=filter;list.onchange=close;
  open.onclick=async()=>{
    close();
    const file=rows[Number(list.value)];if(!file)return;
    const controller=new AbortController();pending=controller;
    status.textContent='회차와 선택한 파일의 지문을 확인하고 있습니다.';
    try{
      const blob=await resolveEvidence54(current,file,{previous,hash,signal:controller.signal});
      if(controller.signal.aborted)return;
      url=URL.createObjectURL(blob);
      const pdf=file.mime==='application/pdf',view=document.createElement(pdf?'embed':'img');
      if(pdf){view.type=file.mime;view.title=file.path;}else view.alt=file.path;
      view.src=url;preview.replaceChildren(view);
      download.href=url;download.download=file.path.split(/[\\/]/).at(-1);download.hidden=false;
      status.textContent='원본 지문 확인 · '+file.path+' · '+file.bytes.toLocaleString('ko-KR')+'바이트';
    }catch(error){if(!controller.signal.aborted)status.textContent=error.message;}
  };
  return function show(archive,readPrevious=null){
    if(current===archive && previous===readPrevious)return;
    close();current=archive;previous=readPrevious;find.value='';list.replaceChildren();rows=[];
    if(Array.isArray(archive?.evidenceFiles))rows=archive.evidenceFiles.filter(f=>typeof f?.path==='string'&&media.has(f.mime));
    host.hidden=!rows.length;
    if(rows.length)filter();
  };
}

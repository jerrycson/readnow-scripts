import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {canonicalUrl,validateSources} from './core.mjs';
export async function collectSources(registry,{fetcher=fetch,timeoutMs=8000,maxBytes=1000000,previous=[]}={}){
 validateSources(registry);const allowed=new Set(registry.sources.map(s=>new URL(s.url).hostname.replace(/^www\./,''))),prior=new Map(previous.map(x=>[x.id,x]));
 const allowedUrl=value=>{const url=new URL(canonicalUrl(value));if(!allowed.has(url.hostname.replace(/^www\./,'')))throw new Error('색인 밖 호스트로 이동하여 보류');return url.href;};
 const output=[];
 async function collect(source){let received=0;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);try{
  let url=allowedUrl(source.url),response;
  for(let redirects=0;redirects<4;redirects++){response=await fetcher(url,{signal:controller.signal,redirect:'manual'});if(response.status<300||response.status>=400)break;const location=response.headers.get('location');if(!location)throw new Error('이동 주소 누락');url=allowedUrl(new URL(location,url).href);if(redirects===3)throw new Error('이동 횟수 제한');}
  if(!response.ok){await response.body?.cancel();throw new Error('HTTP '+response.status);}
  const type=response.headers.get('content-type')||'';if(!/text\/(html|plain)|application\/(json|xhtml\+xml)/i.test(type)){await response.body?.cancel();throw new Error('본문 수집 대상이 아닌 형식: '+type);}
  const reader=response.body.getReader(),chunks=[];for(;;){const {done,value}=await reader.read();if(done)break;received+=value.length;if(received>maxBytes){await reader.cancel();throw new Error('본문 크기 제한');}chunks.push(value);}
  const bytes=Buffer.concat(chunks),hash=createHash('sha256').update(bytes).digest('hex'),old=prior.get(source.id);
  const baselineHash=old?.baselineHash||old?.hash||hash;
  return {id:source.id,url,ok:true,bytes:received,hash,baselineHash,changed:old?.hash?baselineHash!==hash:null,checkedAt:new Date().toISOString(),note:'원문 바이트 변경 감지이며 의미 변화나 새 기법의 검증이 아님'};
 }catch(error){return {id:source.id,url:source.url,ok:false,error:error.name==='AbortError'?'응답 시간 제한':error.message,checkedAt:new Date().toISOString()};}finally{clearTimeout(timer);}}
 // Two requests at a time. No discovery crawl, credentials, paid resources, or remote code execution.
 for(let i=0;i<registry.sources.length;i+=2){const group=await Promise.all(registry.sources.slice(i,i+2).map(collect));output.push(...group);}
 return output;
}
if(process.argv.includes('--run')){
 const registry=JSON.parse(await readFile(new URL('./sources.json',import.meta.url),'utf8'));let old=[];try{old=JSON.parse(await readFile(new URL('./collection.json',import.meta.url),'utf8')).results;}catch{}
 const results=await collectSources(registry,{previous:old});await writeFile(new URL('./collection.json',import.meta.url),JSON.stringify({schema:1,results},null,2));console.log(JSON.stringify({sources:results.length,available:results.filter(x=>x.ok).length,unavailable:results.filter(x=>!x.ok).map(x=>({id:x.id,error:x.error}))},null,2));
}

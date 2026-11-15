'use strict';
const path=require('node:path'),assert=require('node:assert/strict');
async function run({root}){
  const {create,KEY,LOCK}=require(path.join(root,'shop/token-store.js')),results=[];
  const test=async(name,fn)=>{try{await fn();results.push({name:'로그인 저장: '+name,ok:true});}catch(e){results.push({name:'로그인 저장: '+name,ok:false,error:e.stack});}};
  function env(value='old') {const h={value,writes:0,removes:0,reads:0};h.env={AbortController,setTimeout,clearTimeout,navigator:{locks:{request:async(name,opt,fn)=>{assert.equal(name,LOCK);assert.equal(opt.mode,'exclusive');assert(opt.signal);return fn({name,mode:'exclusive'});}}},localStorage:{getItem:k=>{assert.equal(k,KEY);h.reads++;return h.value;},setItem:(k,v)=>{assert.equal(k,KEY);h.writes++;h.value=v;},removeItem:k=>{assert.equal(k,KEY);h.removes++;h.value=null;}}};h.store=create(h.env);return h;}
  await test('권한 확인은 값을 바꾸지 않음',async()=>{const h=env();await h.store.check('old');assert.equal(h.writes+h.removes,0);});
  await test('이전 소유자와 다르면 쓰기·삭제 모두 거절',async()=>{const h=env('new');await assert.rejects(h.store.replace('stale','old'),{code:'changed'});await assert.rejects(h.store.replace('','old'),{code:'changed'});assert.equal(h.value,'new');assert.equal(h.writes+h.removes,0);});
  await test('쓰기 거절은 성공 결과를 반환하지 않음',async()=>{const h=env();h.env.localStorage.setItem=()=>{throw Error('합성 용량 거절');};await assert.rejects(h.store.replace('next','old'),{code:'storage'});assert.equal(h.value,'old');});
  await test('삭제 거절은 이전 열쇠를 보존',async()=>{const h=env();h.env.localStorage.removeItem=()=>{throw Error('합성 권한 거절');};await assert.rejects(h.store.replace('','old'),{code:'storage'});assert.equal(h.value,'old');});
  await test('조용한 쓰기 유실도 다시 읽어서 확인',async()=>{const h=env();h.env.localStorage.setItem=()=>{};await assert.rejects(h.store.replace('next','old'),{code:'storage'});});
  await test('확인 읽기 실패 뒤 같은 결과를 재확인할 때 다시 쓰지 않음',async()=>{const h=env(),read=h.env.localStorage.getItem;h.env.localStorage.getItem=k=>{if(h.writes)throw Error('합성 읽기 거절');return read(k);};await assert.rejects(h.store.replace('next','old'),{code:'storage'});assert.equal(h.value,'next');h.env.localStorage.getItem=read;await h.store.replace('next','old');assert.equal(h.writes,1);});
  await test('정리 완료 재확인은 삭제를 반복하지 않음',async()=>{const h=env();await h.store.replace('','old');await h.store.replace('','old');assert.equal(h.removes,1);assert.equal(h.store.read(),'');});
  await test('저장소 접근 자체가 거절되면 게스트로 바꾸지 않음',async()=>{const h=env();Object.defineProperty(h.env,'localStorage',{get(){throw Error('합성 저장 차단');}});assert.throws(()=>h.store.read(),{code:'storage'});await assert.rejects(h.store.check(''),{code:'storage'});});
  await test('잘못된 저장값과 잘못된 인자는 쓰지 않음',async()=>{const h=env({tok:'malformed'});assert.throws(()=>h.store.read(),{code:'storage'});await assert.rejects(h.store.replace(undefined,'old'),{code:'storage'});assert.equal(h.writes+h.removes,0);});
  await test('잠금 미지원은 무잠금 저장으로 우회하지 않음',async()=>{const h=env();h.env.navigator={};await assert.rejects(h.store.replace('next','old'),{code:'unavailable'});assert.equal(h.writes+h.removes,0);});
  await test('대기 취소는 잠금을 빼앗거나 쓰지 않음',async()=>{const h=env();h.env.navigator.locks.request=async()=>{const e=Error('합성 대기 취소');e.name='AbortError';throw e;};await assert.rejects(h.store.replace('next','old'),{code:'busy'});assert.equal(h.writes+h.removes,0);});
  return results;
}
module.exports={run};

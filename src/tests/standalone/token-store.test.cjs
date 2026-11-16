'use strict';
const path=require('node:path'),assert=require('node:assert/strict');
async function run({root}){
 const {create,KEY,LOCK,VERSION}=require(path.join(root,'shop/token-store.js')),results=[];
 const test=async(name,fn)=>{try{await fn();results.push({name:'로그인 저장: '+name,ok:true});}catch(e){results.push({name:'로그인 저장: '+name,ok:false,error:e.stack});}};
 function env(value='synthetic-old'){const h={value,writes:0};h.env={AbortController,navigator:{locks:{request:async(name,opt,fn)=>{assert.equal(name,LOCK);assert.equal(opt.mode,'exclusive');assert(opt.signal);return fn({name,mode:'exclusive'});}}},localStorage:{getItem:k=>{assert.equal(k,KEY);return h.value;},setItem:(k,v)=>{h.writes++;h.value=v;},removeItem:()=>{h.writes++;h.value=null;}}};h.store=create(h.env);return h;}
 await test('새 계약 표시와 표시용 읽기는 유지',async()=>{const h=env();assert.equal(VERSION,2);assert.equal(h.store.version,2);assert.equal(h.store.read(),'synthetic-old');assert.equal(h.writes,0);});
 await test('저장소 접근 자체가 거절돼도 비회원으로 바꾸지 않음',async()=>{const h=env();Object.defineProperty(h.env,'localStorage',{get(){throw Error('합성 접근 거절');}});assert.throws(()=>h.store.read(),{code:'storage'});assert.equal(h.writes,0);});
 await test('잘못된 표시 사본은 로그인으로 사용하지 않음',async()=>{const h=env({tok:'broken'});assert.throws(()=>h.store.read(),{code:'storage'});assert.equal(h.writes,0);});
 await test('작업표 없는 구형 작성자는 값이 같아도 저장 성공으로 우회하지 않음',async()=>{const h=env();await assert.rejects(h.store.replace('synthetic-old','synthetic-old'),{code:'storage'});assert.equal(h.writes,0);});
 await test('잘못된 작업표는 비회원 정리도 우회하지 않음',async()=>{const h=env();await assert.rejects(h.store.replace('','synthetic-old',{}),{code:'storage'});assert.equal(h.value,'synthetic-old');});
 await test('거래 저장소가 없으면 인증 전송 0회',async()=>{const h=env();let calls=0;await assert.rejects(h.store.withOwner('synthetic-old',()=>calls++),{code:'storage'});assert.equal(calls,0);assert.equal(h.writes,0);});
 await test('거래 저장소 접근이 거절돼도 사본만으로 허용하지 않음',async()=>{const h=env();h.env.indexedDB={open(){throw Error('합성 거절');}};await assert.rejects(h.store.check('synthetic-old'),{code:'storage'});assert.equal(h.writes,0);});
 await test('잠금 미지원은 무잠금 인증 전송으로 우회하지 않음',async()=>{const h=env();h.env.navigator={};let calls=0;await assert.rejects(h.store.withOwner('synthetic-old',()=>calls++),{code:'unavailable'});assert.equal(calls,0);});
 await test('잠금 대기 취소는 잠금을 빼앗거나 요청을 보내지 않음',async()=>{const h=env();h.env.navigator.locks.request=async()=>{const e=Error('합성 대기 취소');e.name='AbortError';throw e;};await assert.rejects(h.store.check('synthetic-old'),{code:'busy'});assert.equal(h.writes,0);});
 await test('난수·해시 도구가 없으면 변경 준비를 완료하지 않음',async()=>{const h=env();await assert.rejects(h.store.prepare('synthetic-old','login'),{code:'storage'});assert.equal(h.writes,0);});
 await test('지원하지 않는 변경 종류는 요청 준비 전에 거절',async()=>{const h=env();await assert.rejects(h.store.prepare('synthetic-old','unknown'),{code:'storage'});assert.equal(h.writes,0);});
 return results;
}
module.exports={run};

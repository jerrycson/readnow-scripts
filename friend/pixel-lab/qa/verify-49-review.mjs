import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import './verify-49.mjs';
import './drawing-review.mjs';
import './photo-review50.mjs';
const lab=new URL('../',import.meta.url);
const registry=JSON.parse(await readFile(new URL('../research/hub/releases.json',lab),'utf8'));
const original=registry.releases.find(r=>r.id==='152344f0cea83934077707ec');
assert.equal(original?.round,49);
assert.equal(original.cards,353);
assert.equal(original.cardsSha,'ab28028d9240c30b391bbe62305cdd94caae943cdbdb394677f2b2eb15568a8a');
assert.equal(original.sealedSha,'45c2585b6c852e937aa7703f11b3f9ce3789fd4946568e02504114d34a41051d');
assert.equal(original.hostSource,'81f099cf091d319f86602e22');
const studio=await readFile(new URL('studio.html',lab),'utf8');
// 새 UI 회차에도 49차 자료는 보존한다. 현재 UI 지문을 과거 UI 한 개로 고정하지 않는다.
assert(/data-ui-build="[a-zA-Z0-9-]+"/.test(studio)&&studio.includes('buildReview'));
console.log('49차 자료 id·카드·암호문 지문 보존과 별도 UI 보완 표시 확인');

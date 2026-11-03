// tHOT1 — 정범님 11/03 초시급: ① 분류 고르기에서 아래 단계가 없는 '고서/희귀본'도 '이 분류로' ② 새등록 상품 기본 매입처에 사람이 더한 매입처(숨긴 것 빼고)
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const R = await p.evaluate(async () => { const o = {}; const it = { id: 'R1', method: 'new', branch: 1, stage: 'sel', new: {} }; S.regItems = S.regItems || new Map(); S.regItems.set('R1', it);
    S._rgCat = { id: 'R1', levels: [{ list: [{ cid: '4395', name: '고서/희귀본' }] }], path: [{ cid: '4395', name: '고서/희귀본' }], done: true, busy: false };
    o.leaf = /data-rgcatok/.test(raCatRow(it));
    S._rgCat = { id: 'R1', levels: [{ list: [{ cid: '1', name: '소설' }] }], path: [{ cid: '1', name: '소설' }], done: false, busy: false }; o.mid = /data-rgcatok/.test(raCatRow(it));
    S._rgCat = { id: 'R1', levels: [], path: [{ cid: '1', name: '소설' }, { cid: '2', name: '한국소설' }], done: false, busy: false }; o.two = /data-rgcatok/.test(raCatRow(it)); S._rgCat = null;
    const REG = { srcX: [{ id: 'xb', suffix: '_bbs', name: '바보사' }, { id: 'xc', suffix: '_ck', name: '클리어킹' }], hide: { src: ['xb'], add: [] } }; await db.collection('app_settings').doc('main').set({ reg: REG }, { merge: true }); await new Promise((r) => setTimeout(r, 500)); S.app = { ...(S.app || {}), reg: { ...((S.app || {}).reg || {}), ...REG } };
    await openRegister(); await new Promise((r) => setTimeout(r, 900)); const h = document.getElementById('sheet').innerHTML; const m = h.match(/새등록 상품 기본[\s\S]{0,6000}/); const seg = m ? m[0] : '';
    o.ck = /data-rgcfg="source" data-v="xc"/.test(seg); o.bbs = /data-rgcfg="source" data-v="xb"/.test(seg); o.ms = /data-rgcfg="source" data-v="ms"/.test(seg); return o; });
  console.log(JSON.stringify(R));
  ok(R.leaf, "아래 단계 없는 분류(고서/희귀본)를 고르면 '이 분류로' 단추");
  ok(!R.mid, '아래 단계가 남은 대분류만 고른 때는 단추 없음(예전과 같음)');
  ok(R.two, '두 단계 고르면 단추(예전과 같음)');
  ok(R.ck && R.ms, '새등록 상품 기본 매입처에 클리어킹(사람이 더한 매입처)·김미소책방');
  ok(!R.bbs, '지운(숨긴) 매입처 바보사는 안 보임');
  console.log(bad ? `❌ tHOT1 실패 ${bad}` : '✓ tHOT1 통과'); });

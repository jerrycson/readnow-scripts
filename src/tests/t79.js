const SP = '/tmp/claude-0/-home-claude/2514b938-5524-5e43-ad0a-05319ceb1a3b/scratchpad/';
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const LONG = '책등에 작은 흠집이 있고 앞표지 모서리가 살짝 눌렸습니다. 본문 깨끗하며 밑줄·필기 없음. 띠지 없음. 이 글은 140자를 넘기도록 길게 씁니다 — 끝까지 보여야 합니다. 마지막 글자는 끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝끝 ZZ';
  await p.evaluate(async (LONG) => { S.regItems = S.regItems || new Map(); S.uinfo = S.uinfo || new Map(); const t = new Date().toISOString();
    const Ls = [{ id: 'LX2a', listingId: '7002', title: '같은책 여럿', isbn13: '9790000000028', aladinItemId: '9002', grade: '상', qty: 1, status: '판매중', active: true, sku: 'PNKLUX', price: 9000, usedCode: 'U2' },
      { id: 'LX2b', listingId: '7003', title: '같은책 여럿', isbn13: '9790000000028', aladinItemId: '9002', grade: '중', qty: 1, status: '판매중', active: true, sku: 'PNKLUX_1024a', price: 8000, usedCode: 'U3' },
      { id: 'LX2c', listingId: '7004', title: '같은책 여럿', isbn13: '9790000000028', aladinItemId: '9002', grade: '중', qty: 1, status: '판매중', active: true, sku: 'PNKLUX', price: 8000, usedCode: 'U4' }];
    Ls.forEach((l) => S.plist.set(l.id, l)); S.uinfo.set('7002', { none: true }); S.uinfo.set('7003', { note: LONG }); S.uinfo.set('7004', { none: true }); S.ver++;
    const doc = { stage: 'pick', isbn: '9790000000028', test: true, info: { title: '시험 dup', isbn13: '9790000000028', itemId: '9002', categories: [1], page1: [], priceList: 20000, at: t }, grade: 3, qty: 1, price: 9000, by: S.user.email, ws: regWsCur(), createdAt: t, descMode: 'manual', descParts: { a: '', b: '', c: '' } };
    await db.collection('reg_items').doc('d9').set(doc); S.regItems.set('d9', { id: 'd9', ...doc });
    S.regT = 'pick'; S.regSub = S.regSub || {}; S.regSub.pick = 'dup'; openRegister(); }, LONG);
  await p.waitForTimeout(2500); await p.evaluate(() => { S.regT = 'pick'; S.regSub.pick = 'dup'; regRerender(); }); await p.waitForTimeout(800);
  const card = () => p.evaluate(() => { const c = document.querySelector('.rgdup2[data-rgcid="d9"]'); return c ? c.innerText.replace(/\s+/g, ' ') : 'NO CARD'; });
  let t1 = await card(); console.log('card1', t1.slice(0, 700));
  const r = { mode: /🧪 시험/.test(t1), match: /이 상품 ↔ 기존 상품 매칭/.test(t1) && /U4/.test(t1), full: /ZZ/.test(t1), edit: await p.evaluate(() => !!document.querySelector('.rgdup-me .card')), order: await p.evaluate(() => [...document.querySelectorAll('.rgdup2 .rgdup-ex')].map((x) => x.className.match(/o(\d)/)[1]).join('')) };
  await p.evaluate(() => document.querySelector('[data-rgduppick="d9"][data-l="LX2b"]').click()); await p.waitForTimeout(900);
  let t2 = await card(); r.manual = /관리자가 직접 고름/.test(t2) && /U3/.test(t2.split('기존 상품 매칭')[1] || ''); r.pick = await p.evaluate(() => S.regItems.get('d9').dupPick);
  await p.evaluate(() => { const c = document.querySelector('.rgdup2'); c.scrollIntoView(); }); await p.waitForTimeout(300); await p.screenshot({ path: SP + 't79.png', fullPage: false });
  await p.evaluate(() => document.querySelector('[data-rgduppick="d9"][data-l=""]').click()); await p.waitForTimeout(900);
  let t3 = await card(); r.unpick = /자동: 등급·유의 사항이 같음/.test(t3) && !(await p.evaluate(() => S.regItems.get('d9').dupPick));
  console.log(JSON.stringify(r)); console.log('errs', errs.join(' | '));
  const ok = r.mode && r.match && r.full && r.edit && r.order === '012' && r.manual && r.pick === 'LX2b' && r.unpick && !errs.length; console.log(ok ? '✓ t79 통과' : '❌ t79 실패');
});

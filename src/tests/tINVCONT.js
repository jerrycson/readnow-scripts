/* tINVCONT — 정범님 11/05 '그런 버튼은 없어': ⚠ 사람이 볼 것 칸의 멈춘 송장 입력에 「✅ 알라딘에서 확인했음 — 나머지 계속」 → 맡김 문서를 다시 대기로(같은 송장은 다시 안 넣음) */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, JSON.stringify(x || '')); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  const r = await p.evaluate(async () => { await db.collection('shp_invoices').doc('alps_x1').set({ status: 'paused', verifyFail: true, verified: { ok: false, orderNo: 'O1', invoice: '265412976706', why: '주문은 있으나 송장번호가 안 보임' }, items: [{ orderNo: 'O1', invoice: '265412976706', state: 'done' }, { orderNo: 'O2', invoice: '265412976707', state: 'todo' }] });
    const b = document.createElement('button'); b.dataset.invcontid = 'alps_x1'; document.body.appendChild(b); window.__askOrig = window.ask; window.ask = async () => true; b.click(); await new Promise((z) => setTimeout(z, 800)); const d = (await db.collection('shp_invoices').doc('alps_x1').get()).data(); window.ask = window.__askOrig;
    const b2 = document.createElement('button'); b2.dataset.invcontid = 'alps_x1'; document.body.appendChild(b2); b2.click(); await new Promise((z) => setTimeout(z, 500)); const d2 = (await db.collection('shp_invoices').doc('alps_x1').get()).data();
    return { st: d.status, lim: d.limit, vf: d.verifyFail, ho: !!d.humanOk, st2: d2.status, items: d.items.map((x) => x.state).join() }; });
  ok(r.st === 'queued' && r.lim === 0 && r.vf === false && r.ho && r.items === 'done,todo', '누르면(확인 받은 뒤) 맡김을 다시 대기로 · 첫 건 검증 다시 안 함(limit 0) · 입력된 건 그대로 · 누른 사람 기록', r);
  ok(r.st2 === 'queued', '이미 대기면 다시 눌러도 바꾸지 않음(토스트만)', r); }).then(() => { console.log(bad ? `❌ ${bad}개 실패` : '✓ tINVCONT 통과'); process.exit(bad ? 1 : 0); });

// (10/26 wX3) 클라우드 ❓ 답할 문의 알림 qnaPushTick — 노드에서 함수만 떼어 가짜 Firestore로 시험
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../cloud/index.js'), 'utf8');
const a = src.indexOf('const Q_DONE_C'); const b = src.indexOf('/* ══════════ 🤖 (정범님 10/26) 자동 발송요청'); const code = src.slice(a, b);
const store = { app_settings: {}, crm_interactions: {}, qna_push: {} }; const sent = [];
const ref = (c, id) => ({ id, get: async () => ({ exists: !!store[c][id], data: () => store[c][id] }), set: async (v, o) => { store[c][id] = o && o.merge ? { ...(store[c][id] || {}), ...v } : v; }, create: async (v) => { if (store[c][id]) throw new Error('ALREADY_EXISTS'); store[c][id] = v; } });
const docs = (c, f) => Object.entries(store[c]).filter(([, v]) => f(v)).map(([id, v]) => ({ id, data: () => v }));
const C = (c) => ({ doc: (id) => ref(c, id), where: (k, op, v) => { const q = { _f: [[k, op, v]], where: (k2, o2, v2) => { q._f.push([k2, o2, v2]); return q; }, orderBy: () => q, limit: () => q, get: async () => ({ docs: docs(c, (d) => q._f.every(([k, o, x]) => (o === '==' ? d[k] === x : o === '>=' ? +new Date(d[k]) >= +x : true))) }) }; return q; } });
const db = { batch: () => { const ops = []; return { set: (r, v, o) => ops.push(() => r.set(v, o)), commit: async () => { for (const f of ops) await f(); } }; } };
const ctx = { C, db, webpush: {}, nowIso: () => new Date().toISOString(), VER: 't', log: () => {}, Date, Math, String, JSON, encodeURIComponent, pushSend: async (n, p, k) => { sent.push({ p, k }); return { 폰: 'ok' }; } };
vm.runInNewContext(code + '\nthis.qnaPushTick = qnaPushTick; this.reset = () => { qnaPushAt = 0; };', ctx);
(async () => { const now = new Date();
  store.crm_interactions.old1 = { type: 'qna', questionId: 'OLD1', answerStatus: '', body: '옛 문의', uploadedAt: new Date(now - 3600e3) };
  store.crm_interactions.done1 = { type: 'qna', questionId: 'D1', answerStatus: 'Yes', body: '답함', uploadedAt: now };
  const r1 = await ctx.qnaPushTick(); // 처음 = baseline
  store.crm_interactions.new1 = { type: 'qna', questionId: 'N1', answerStatus: '', authorMasked: '김**', title: '해리포터 1권', body: '책 상태가 어떤가요? 밑줄이 있나요? 아주 긴 문의 글이 이어집니다 아주 긴 문의 글이 이어집니다 아주 긴 문의 글', uploadedAt: new Date(Date.now() + 1000) };
  store.crm_interactions.rev = { type: 'review', uploadedAt: new Date(Date.now() + 1000) };
  store.crm_interactions.old1.uploadedAt = new Date(Date.now() + 1000); // 옛 문의가 다시 올라와도 안 보냄
  store.crm_interactions.cx = { type: 'qna', questionId: 'C1', answerStatus: '취소된 질문', uploadedAt: new Date(Date.now() + 1000) };
  ctx.reset(); const r2 = await ctx.qnaPushTick(); ctx.reset(); const r3 = await ctx.qnaPushTick(); // 같은 문의 두 번 안 보냄
  console.log(JSON.stringify({ r1, r2, r3, sent, qp: store.qna_push }, null, 1));
  const ok = r1 && r1.baseline === 1 && r2 && r2.sent.length === 1 && r2.sent[0] === 'N1' && !r3 && sent.length === 1 && sent[0].k === 'qna' && /해리포터/.test(sent[0].p.title) && /^김\*\*: 책 상태/.test(sent[0].p.body) && sent[0].p.url === './?go=qna&qid=N1' && store.qna_push.OLD1.state === 'baseline' && store.qna_push.N1.state === 'sent';
  console.log(ok ? '✓ tX3cloud 통과' : '❌ tX3cloud 실패'); })();

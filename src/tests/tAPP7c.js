// tAPP7c — 정범님 11/05: 클라우드 휴대폰 알림 규칙 — ① 🛎 주문 발생(예스24 새 주문 · 종류 y24)은 기본 끔 · 예전 kinds.y24 값은 보지 않음 · 기기가 켠 시각(kOn.y24)이 있어야 받음
//   ② 🟦 예스24 🤖 자동 처리 끝 → ✅ 자동 주문처리 완료(autodone) · 멈춤 → 🔎 관리자 검토 필요(autorev) · 일·차례·결과마다 한 번 · 6시간 지난 결과는 안 보냄
//   ③ 🔕 PC 부재 알림 — 모든 PC 기본 끔 · 예전에 적힌 값(v 없음)은 끔으로 · 이번 바뀜 뒤 켠 값(v: 2)만 푸시
// 노드에서 함수만 떼어 가짜 Firestore로 시험 (손님 이름 없음 · 공개 저장소)
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../cloud/index.js'), 'utf8');
const cut = (a, b) => { const i = src.indexOf(a); const j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('자리 못 찾음: ' + a.slice(0, 40)); return src.slice(i, j); };
const code = cut("/* (정범님 11/05 '휴대폰 웹앱 알림에서", "/* (정범님 10/27 15:12)") + '\n' + cut('let y24oTickAt = 0;', "/* (정범님 11/04 '예스24에 이미 매물이 있는데") + '\n' + cut('async function loggerWatchTick', '/* (0.17.0) 📊 수집 분석 기록');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const store = { app_settings: {}, crm_y24_orders: {}, crm_y24_raw: {}, y24_push: {}, prd_jobs: {} }; const sent = [];
const ref = (c, id) => ({ id, get: async () => ({ exists: !!store[c][id], data: () => store[c][id] }), set: async (v, o) => { store[c][id] = o && o.merge ? { ...(store[c][id] || {}), ...v } : v; }, create: async (v) => { if (store[c][id]) throw new Error('ALREADY_EXISTS'); store[c][id] = v; } });
const docsOf = (c, f) => Object.entries(store[c]).filter(([, v]) => f(v)).map(([id, v]) => ({ id, ref: ref(c, id), data: () => v }));
const C = (c) => { store[c] = store[c] || {}; return { doc: (id) => ref(c, id), where: (k, op, v) => { const q = { _f: [[k, op, v]], where: (k2, o2, v2) => { q._f.push([k2, o2, v2]); return q; }, select: () => q, orderBy: () => q, limit: () => q, get: async () => { const L = docsOf(c, (d) => q._f.every(([k, o, x]) => (o === '==' ? d[k] === x : o === '>=' ? String(d[k] || '') >= String(x) : o === '>' ? String(d[k] || '') > String(x) : true))); return { docs: L, size: L.length, forEach: (fn) => L.forEach(fn) }; } }; return q; } }; };
const webpush = { sendNotification: async (sub, body) => { sent.push({ to: sub.ep, p: JSON.parse(body) }); } };
const ctx = { C, db: {}, webpush, FV: { delete: () => null, serverTimestamp: () => null }, pushKeys: async () => ({ ok: 1 }), nowIso: () => new Date().toISOString(), VER: 't', log: () => {}, wonT: (n) => Math.round(+n || 0) + '원', kstDay: (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10),
  shipCoreNode: () => ({ y24OrdParse: () => ({ kind: 'x', rows: [] }), y24OrdGroup: () => [], y24OrdMerge: () => null }), Date, Math, String, JSON, Object, Array, Set, Map, Number, encodeURIComponent };
vm.runInNewContext(code + '\nthis.pushSend = pushSend; this.y24OrdTick = y24OrdTick; this.loggerWatchTick = loggerWatchTick; this.reset = () => { y24oTickAt = 0; };', ctx);
(async () => { const now = Date.now(); const iso = (ms) => new Date(ms).toISOString();
  // 기기 셋: 폰A = 예전 값 그대로(kinds 안 정함) · 폰B = 예전에 kinds.y24 true였음(옛 값 — 이번에 꺼져야 함) · 폰C = 이번 바뀜 뒤 🛎 주문 발생을 켬(kOn.y24) · 폰D = 🔎 검토 알림을 끔
  store.app_settings.push_subs = { subs: { 폰A: { sub: { ep: 'A' } }, 폰B: { sub: { ep: 'B' }, kinds: { y24: true } }, 폰C: { sub: { ep: 'C' }, kOn: { y24: iso(now - 60e3) } }, 폰D: { sub: { ep: 'D' }, kinds: { autorev: false } } } };
  // ① 주문 발생(새 주문)
  store.crm_y24_orders.Y1 = { orderNo: 'Y1', ystage: 'new', firstSeenAt: iso(now - 60e3), items: [{ title: '새로 들어온 책', price: 9000, qty: 1 }] };
  // ② 자동 처리 — 접수확인 끝 · 발송처리 멈춤 · 6시간 넘은 끝은 안 보냄
  store.crm_y24_orders.Y2 = { orderNo: 'Y2', ystage: 'deliv', firstSeenAt: iso(now - 26 * 3600e3), items: [{ title: '자동 처리된 책', price: 12000, qty: 1 }, { title: '싼 책', price: 3000, qty: 1 }], auto: { ack: { state: 'done', seq: 1, at: iso(now - 20 * 60e3), endAt: iso(now - 10 * 60e3) }, ship: { state: 'fail', seq: 1, at: iso(now - 5 * 60e3), msg: '발송관리 화면에서 주문을 못 찾음' } } };
  store.crm_y24_orders.Y3 = { orderNo: 'Y3', ystage: 'deliv', firstSeenAt: iso(now - 40 * 3600e3), items: [{ title: '예전 책', price: 5000, qty: 1 }], auto: { ack: { state: 'done', seq: 1, at: iso(now - 30 * 3600e3), endAt: iso(now - 30 * 3600e3) } } };
  const r1 = await ctx.y24OrdTick(); const s1 = sent.slice(); sent.length = 0;
  const byT = (re) => s1.filter((x) => re.test(x.p.title)).map((x) => x.to).sort().join('');
  ok(byT(/예스24 새 주문/) === 'C', '🛎 주문 발생: 켠 기기(폰C)만 · 예전 값(폰A 안 정함·폰B kinds.y24 true)은 끔: ' + byT(/예스24 새 주문/));
  ok(byT(/자동 주문처리 완료 · 주문접수확인/) === 'ABCD', '✅ 예스24 자동 주문처리 완료(접수확인 끝) → 모든 기기(autodone 기본 켬): ' + byT(/자동 주문처리 완료/));
  ok(byT(/관리자 검토 필요 · 예스24 발송처리/) === 'ABC', '🔎 관리자 검토 필요(발송처리 멈춤) → 검토 알림을 끈 폰D 빼고: ' + byT(/관리자 검토 필요/));
  ok(!s1.some((x) => /Y3/.test(x.p.body)), '6시간 넘은 자동 처리 결과(Y3)는 안 보냄');
  const rev = s1.find((x) => /관리자 검토 필요/.test(x.p.title)); ok(rev && /못 찾음/.test(rev.p.body) && /자동 처리된 책/.test(rev.p.body) && /15000원/.test(rev.p.title), '검토 알림 본문 = 까닭 · 대표(가장 비싼) 상품 · 총액: ' + (rev && rev.p.title + ' / ' + rev.p.body));
  ctx.reset(); await ctx.y24OrdTick(); ok(sent.length === 0, '같은 일·차례·결과는 두 번 안 보냄: ' + sent.length); sent.length = 0;
  store.crm_y24_orders.Y2.auto.ship = { state: 'done', seq: 2, at: iso(now - 60e3), endAt: iso(now) }; ctx.reset(); await ctx.y24OrdTick(); ok(sent.length === 4 && sent.every((x) => /자동 주문처리 완료 · 발송처리/.test(x.p.title)), '다시 맡긴 발송처리(2번째)가 끝나면 한 번 더 ✅: ' + sent.length); sent.length = 0;
  // 사람이 다시 끔 → 안 받음
  store.app_settings.push_subs.subs.폰C.kOn = {}; store.crm_y24_orders.Y4 = { orderNo: 'Y4', ystage: 'new', firstSeenAt: iso(now), items: [{ title: '또 새 책', price: 1000 }] }; ctx.reset(); await ctx.y24OrdTick(); ok(sent.length === 0, '켰던 기기가 다시 끄면 주문 발생 안 받음: ' + sent.length); sent.length = 0;
  // ③ PC 부재 알림 — 모든 PC 기본 끔
  store.prd_jobs.pcBeat = { pcs: { 'JS-MAIN': { atMs: now - 30 * 60e3 }, HOME: { atMs: now - 30 * 60e3 }, 'MJ-MAIN': { atMs: now - 30 * 60e3 } } };
  store.app_settings.logger_watch = { alwaysOn: ['JS-MAIN', 'HOME', 'MJ-MAIN'], absAlert: { HOME: { on: true, at: iso(now - 864e5) } } }; /* HOME = 예전(11/04) 켬 기록(v 없음) */
  const lw1 = await ctx.loggerWatchTick(); const st1 = store.app_settings.logger_watch.st || {};
  ok(!lw1 && sent.length === 0, 'PC 부재: 아무 PC도 안 켰으면(예전 HOME 켬 기록 포함) 푸시 없음: ' + sent.length);
  ok(st1['JS-MAIN'] && st1['JS-MAIN'].k === 'down' && st1['JS-MAIN'].muted && st1.HOME.muted, '상태는 그대로 적음(끔 표시 muted) — 관리도구 상태 표시용');
  store.app_settings.logger_watch.absAlert['JS-MAIN'] = { on: true, v: 2, at: iso(now) }; store.app_settings.logger_watch.checkedAt = null; const lw2 = await ctx.loggerWatchTick();
  ok(lw2 && lw2.length === 1 && lw2[0].name === 'JS-MAIN' && sent.length === 4, '이번에 켠 PC(JS-MAIN · v 2)만 부재 푸시: ' + JSON.stringify((lw2 || []).map((x) => x.name)));
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); })().catch((e) => { console.log('❌ 오류', e.stack); });

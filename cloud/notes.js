/* 📓 정범 노트 — 한 곳(Firestore jb_notes)에 두고 웹앱·아티팩트·리드가 함께 읽고 씀 (note2 · 정범님 11/13 11:54)
 *  자리: Firestore jb_notes/{id} — 한 문서 = 카드 하나(kind 'card') · 메모 하나(kind 'memo') · 보낸 묶음 하나(kind 'batch') · 설정 '_meta'
 *    카드  { kind:'card', cat(대분류), sub(중분류), leaf(소분류), imp(1~3 중요도), title, body(마크다운), src('lead'|'jb'|'worker:<이름>'|…), srcAt, ref,
 *            state('open'|'done'|'archived'|'trashed'), stateAt, readAt(정범님이 읽은 때 · 없으면 '새로 온 것'), tags[], pinned, color, createdAt, updatedAt }
 *    메모  { kind:'memo', cardId(없으면 통합 노트에 바로 쓴 것), cardTitle, quote(고른 문장), text, by('jb'), at, batchId(보낸 묶음), state('open'|'trashed'), updatedAt }
 *    묶음  { kind:'batch', memoIds[], text(보낸 글), at, via('mcp'|'outbox'), status('sent'|'queued'|'picked'|'failed'), err, pickedAt, updatedAt }
 *  쓰는 길: ① 아티팩트 → claude.ai 연결 「리드나우 노트」(이 파일의 MCP 길 /mcp/n/<열쇠>) ② 웹앱 → Firestore 직접 ③ 리드·일꾼 → /kp-in 암호문 notes:{ops}
 *  읽는 길: 웹앱 onSnapshot · 아티팩트 note_sync(길게 기다리기 — 바뀌면 바로 답) · 리드 진단 notes=1
 *  지우지 않음 — 휴지통(state 'trashed')에서 되살림. 공개 저장소에는 이 코드만 — 노트 글은 Firestore·비공개 쪽에만 */
'use strict';
const crypto = require('crypto');
const COL = 'jb_notes';
const KINDS = ['card', 'memo', 'batch', 'meta'];
const STATES = ['open', 'done', 'archived', 'trashed'];
const BST = ['sent', 'queued', 'picked', 'failed'];
const STR = { cat: 40, sub: 60, leaf: 60, title: 300, src: 60, srcAt: 40, ref: 300, stateAt: 40, readAt: 40, cardId: 80, cardTitle: 300, quote: 2000, text: 20000, by: 40, at: 40, via: 20, status: 20, err: 400, pickedAt: 40, createdAt: 40, updatedAt: 40, editedAt: 40, color: 12, trashedAt: 40, folder: 60, leadSession: 120 };
const BODY_MAX = 200000;
const s = (x, n) => (x == null ? '' : String(x).slice(0, n));
const nowIso = () => new Date().toISOString();
const idOk = (id) => /^[A-Za-z0-9_.:@+-]{1,120}$/.test(String(id || '')) && !/^\.\.?$/.test(String(id));

/* 한 문서를 고르게 — 아는 칸만 · 길이 자름 · kind 없으면 card(예전 노트) */
function clean(d, isMeta) {
  const o = {}; if (!d || typeof d !== 'object' || Array.isArray(d)) return { o, bad: '모양' };
  for (const [k, v] of Object.entries(d)) {
    if (v === null) { o[k] = null; continue; }
    if (k === 'body') { o.body = s(v, BODY_MAX); continue; }
    if (STR[k]) { o[k] = s(v, STR[k]); continue; }
    if (k === 'kind') { if (KINDS.includes(v)) o.kind = v; continue; }
    if (k === 'state') { if (STATES.includes(v)) o.state = v; continue; }
    if (k === 'status') { if (BST.includes(v)) o.status = v; continue; }
    if (k === 'ord') { const n = +v; if (Number.isFinite(n)) o.ord = n; continue; }
    if (k === 'imp') { const n = Math.round(+v); if (n >= 1 && n <= 3) o.imp = n; continue; }
    if (k === 'tags' || k === 'memoIds') { if (Array.isArray(v)) o[k] = v.map((x) => s(x, 80)).filter(Boolean).slice(0, k === 'tags' ? 12 : 300); continue; }
    if (k === 'pinned' || k === 'archived' || k === 'trashed' || k === 'fwd') { o[k] = !!v; continue; }
    if (isMeta && k === 'imported' && Array.isArray(v)) { o.imported = v.map((x) => s(x, 120)).slice(0, 500); continue; }
  }
  return { o, bad: null };
}

/* 쓰기 묶음 — ops:[{op:'set'|'merge', id, data}] · 서버가 updatedAt을 찍음(아티팩트·웹앱 시계와 상관없이 늘 앞으로) */
async function writeOps(C, ops, by) {
  const out = { n: 0, bad: [], ids: [] }; if (!Array.isArray(ops)) return { ...out, bad: ['ops 없음'] };
  const L = ops.slice(0, 60); const at = nowIso();
  for (const x of L) {
    const id = String((x && x.id) || ''); if (!idOk(id)) { out.bad.push('id:' + id.slice(0, 20)); continue; }
    const { o, bad } = clean(x.data, id === '_meta'); if (bad) { out.bad.push(id + ':' + bad); continue; }
    if (id !== '_meta' && !o.kind && x.op === 'set') o.kind = 'card';
    o.updatedAt = at; o.lastBy = s(by || 'claude', 40);
    if (x.op === 'set' && !o.createdAt) o.createdAt = at;
    const txt = JSON.stringify(o); if (/01[016789][- ]?\d{3,4}[- ]?\d{4}/.test(txt.replace(/010-0000-0000/g, ''))) { out.bad.push(id + ':휴대전화 번호 꼴'); continue; }
    try { await C(COL).doc(id).set(o, { merge: x.op !== 'set' }); out.n++; out.ids.push(id); } catch (e) { out.bad.push(id + ':' + String(e.message || e).slice(0, 60)); }
  }
  return out;
}

/* 실시간 기억 — 한 번 듣기(onSnapshot) · 바뀔 때마다 순번(seq) · 기다리는 note_sync에 바로 답 · 15분 아무도 안 부르면 듣기를 멈춤(메모리·읽기) */
function makeLive(C, log) {
  const L = { docs: new Map(), seq: 0, boot: crypto.randomBytes(4).toString('hex'), un: null, ready: null, waiters: new Set(), lastUse: 0, timer: null };
  const plain = (d) => { const o = {}; for (const [k, v] of Object.entries(d || {})) { if (k === 'uploadedAt' || k === 'writer' || k === 'writerSchema') continue; o[k] = v && typeof v.toDate === 'function' ? v.toDate().toISOString() : v; } return o; };
  function start() {
    if (L.ready) return L.ready;
    L.ready = new Promise((res) => { let first = true; const to = setTimeout(() => { if (first) { first = false; res(false); } }, 12000);
      L.un = C(COL).onSnapshot((ss) => { ss.docChanges().forEach((ch) => { L.seq++; if (ch.type === 'removed') L.docs.set(ch.doc.id, { seq: L.seq, gone: true }); else L.docs.set(ch.doc.id, { seq: L.seq, d: plain(ch.doc.data()) }); });
        if (first) { first = false; clearTimeout(to); res(true); } for (const w of [...L.waiters]) w(); },
      (e) => { log && log('📓 노트 듣기 실패', e.message); stop(); if (first) { first = false; clearTimeout(to); res(false); } }); });
    if (!L.timer) L.timer = setInterval(() => { if (Date.now() - L.lastUse > 15 * 60e3) stop(); }, 60e3);
    return L.ready;
  }
  function stop() { try { L.un && L.un(); } catch (e) {} L.un = null; L.ready = null; L.docs = new Map(); L.boot = crypto.randomBytes(4).toString('hex'); L.seq = 0; if (L.timer) { clearInterval(L.timer); L.timer = null; } for (const w of [...L.waiters]) w(); }
  /* cursor = '<boot>:<seq>' · 없거나 boot가 다르면 전부 · 너무 크면 본문 없이(note_get으로 따로) */
  async function sync(cursor, waitS) {
    L.lastUse = Date.now(); const ok = await start(); if (!ok) throw new Error('노트 저장소를 읽지 못함');
    const [b, q] = String(cursor || '').split(':'); let since = b === L.boot ? +q || 0 : -1;
    const pick = () => [...L.docs.entries()].filter(([, v]) => since < 0 || v.seq > since);
    let ch = pick(); const wait = Math.max(0, Math.min(25, +waitS || 0));
    if (!ch.length && since >= 0 && wait) { await new Promise((res) => { const t = setTimeout(done, wait * 1000); function done() { clearTimeout(t); L.waiters.delete(done); res(); } L.waiters.add(done); }); L.lastUse = Date.now(); const [b2] = [L.boot]; if (b2 !== b) since = -1; ch = pick(); }
    const full = since < 0; let size = 0; const docs = []; const gone = []; const lite = [];
    for (const [id, v] of ch) { if (v.gone) { gone.push(id); continue; } const d = { id, ...v.d }; const n = JSON.stringify(d).length; if (size + n > 650000 && d.body) { const { body, ...rest } = d; docs.push({ ...rest, _noBody: true }); lite.push(id); size += 300; } else { docs.push(d); size += n; } }
    return { cursor: `${L.boot}:${L.seq}`, full, docs, gone, lite, n: L.docs.size, at: nowIso() };
  }
  async function get(ids) { L.lastUse = Date.now(); await start(); return (Array.isArray(ids) ? ids : []).slice(0, 40).map((id) => { const v = L.docs.get(String(id)); return v && v.d ? { id: String(id), ...v.d } : null; }).filter(Boolean); }
  return { sync, get, stop, L };
}

/* ── MCP(Streamable HTTP · JSON 답) — claude.ai 연결 「리드나우 노트」 ── */
const TOOLS = [
  { name: 'note_info', description: '정범 노트 저장소 연결 확인 — 문서 수·판 번호(읽기만)', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true } },
  { name: 'note_sync', description: '정범 노트의 바뀐 문서 받기. cursor 없이 부르면 전부, 앞 답의 cursor를 주면 그 뒤 바뀐 것만. wait(초, 0~25)를 주면 바뀐 것이 없을 때 그만큼 기다렸다가 바뀌는 순간 답함(실시간).', inputSchema: { type: 'object', properties: { cursor: { type: 'string' }, wait: { type: 'number', minimum: 0, maximum: 25 } }, additionalProperties: false }, annotations: { readOnlyHint: true } },
  { name: 'note_get', description: '본문이 빠져 온 문서(_noBody)의 전체를 id로 받기(최대 40개)', inputSchema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' }, maxItems: 40 } }, required: ['ids'], additionalProperties: false }, annotations: { readOnlyHint: true } },
  { name: 'note_write', description: '정범 노트 쓰기 — ops:[{op:"set"|"merge", id, data}] (최대 60) · kind card·memo·batch · 지우지 않음(state "trashed")', inputSchema: { type: 'object', properties: { ops: { type: 'array', maxItems: 60, items: { type: 'object', properties: { op: { type: 'string', enum: ['set', 'merge'] }, id: { type: 'string' }, data: { type: 'object' } }, required: ['op', 'id', 'data'] } }, by: { type: 'string' } }, required: ['ops'], additionalProperties: false }, annotations: { readOnlyHint: false, destructiveHint: false } },
];
const PROTOS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
function makeNotes({ C, log, ver }) {
  const live = makeLive(C, log);
  let keyMemo = null, keyAt = 0;
  async function keyIs(k) { if (!k || k.length < 24) return false; if (!keyMemo || Date.now() - keyAt > 60e3) { try { const d = await C('app_secrets').doc('notes_mcp').get(); keyMemo = (d.exists && d.data().key) || ''; keyAt = Date.now(); } catch (e) { keyMemo = keyMemo || ''; } } if (!keyMemo) return false; const a = Buffer.from(String(k)), b = Buffer.from(String(keyMemo)); return a.length === b.length && crypto.timingSafeEqual(a, b); }
  const txt = (o) => ({ content: [{ type: 'text', text: JSON.stringify(o) }], structuredContent: o });
  async function call(name, a, by) {
    a = a || {};
    if (name === 'note_info') { const r = await live.sync('', 0); return { ok: true, n: r.n, ver, at: r.at }; }
    if (name === 'note_sync') return live.sync(a.cursor, a.wait);
    if (name === 'note_get') return { docs: await live.get(a.ids) };
    if (name === 'note_write') return writeOps(C, a.ops, by || a.by || 'artifact');
    throw Object.assign(new Error('모르는 도구: ' + name), { code: -32602 });
  }
  async function rpc(m, authed) {
    const id = m && m.id; const R = (result) => ({ jsonrpc: '2.0', id, result }); const E = (code, message) => ({ jsonrpc: '2.0', id: id == null ? null : id, error: { code, message } });
    if (!m || m.jsonrpc !== '2.0' || typeof m.method !== 'string') return E(-32600, 'Invalid Request');
    if (m.method === 'initialize') { const want = m.params && m.params.protocolVersion; return R({ protocolVersion: PROTOS.includes(want) ? want : PROTOS[1], capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'readnow-notes', title: '리드나우 노트', version: String(ver || '0') }, instructions: '정범 노트(카드·메모·통합 노트) 읽기·쓰기. 지우지 않음 — 휴지통으로.' }); }
    if (m.method === 'ping') return R({});
    if (m.method === 'tools/list') return R({ tools: TOOLS });
    if (m.method === 'tools/call') { if (!authed) return E(-32001, '열쇠가 맞지 않음 — 웹앱 ⚙ 설정 › 📓 노트 연결의 주소를 다시 넣어 주세요');
      const nm = m.params && m.params.name; try { return R(txt(await call(nm, m.params && m.params.arguments, 'artifact'))); } catch (e) { if (e && e.code === -32602) return E(-32602, e.message); return R({ ...txt({ ok: false, err: String(e.message || e).slice(0, 200) }), isError: true }); } }
    if (m.method.startsWith('notifications/')) return null;
    if (m.method === 'resources/list') return R({ resources: [] });
    if (m.method === 'prompts/list') return R({ prompts: [] });
    return E(-32601, 'Method not found');
  }
  /* path = /mcp/n/<열쇠> — initialize·tools/list는 열쇠 없이도(연결 확인) · tools/call은 열쇠가 맞아야 */
  async function handle(req, res, path, bodyOf) {
    const key = decodeURIComponent(path.slice('/mcp/n/'.length).split('/')[0] || '');
    const H = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
    if (req.method === 'GET' || req.method === 'DELETE') { res.writeHead(405, { ...H, Allow: 'POST' }); return res.end(JSON.stringify({ ok: false, err: 'POST만' })); }
    if (req.method !== 'POST') { res.writeHead(405, H); return res.end('{}'); }
    let b; try { b = await bodyOf(req); } catch (e) { res.writeHead(400, H); return res.end(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } })); }
    const authed = await keyIs(key);
    const one = Array.isArray(b) ? null : b; const L = Array.isArray(b) ? b : [b];
    const out = []; for (const m of L) { const r = await rpc(m, authed); if (r) out.push(r); }
    if (!out.length) { res.writeHead(202, H); return res.end(); }
    if (one && one.method === 'initialize') H['Mcp-Session-Id'] = crypto.randomBytes(12).toString('hex');
    res.writeHead(200, H); return res.end(JSON.stringify(one ? out[0] : out));
  }
  /* 진단 notes=1 — 리드 10분 확인이 읽음: 문서 수·종류별·새로 온 카드 수·보낼 묶음(queued)·최근 바뀐 20 */
  async function diag(q) {
    const r = await live.sync('', 0); const D = r.docs; const by = {}; for (const d of D) { const k = (d.kind || 'card') + ':' + (d.state || d.status || '-'); by[k] = (by[k] || 0) + 1; }
    const queued = D.filter((d) => d.kind === 'batch' && d.status === 'queued').map((d) => ({ id: d.id, at: d.at, via: d.via, text: s(d.text, 8000), memoIds: d.memoIds || [] }));
    const recent = D.slice().sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))).slice(0, +q.n || 20).map((d) => ({ id: d.id, kind: d.kind || 'card', title: s(d.title || d.text, 80), state: d.state || d.status || null, updatedAt: d.updatedAt, lastBy: d.lastBy || null }));
    const unread = D.filter((d) => (d.kind || 'card') === 'card' && !d.readAt && d.state !== 'trashed').length;
    return { n: r.n, by, unread, queued, recent, at: r.at };
  }
  return { handle, write: (ops, by) => writeOps(C, ops, by), diag, live, rpc, TOOLS };
}
module.exports = { makeNotes, clean, writeOps, COL };

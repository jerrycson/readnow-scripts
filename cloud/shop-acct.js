/* 🛍 우리숍 booksqueen.com — 👤 손님 계정 · ⭐ 리뷰(별점·100자평·긴 글·사진) · 📚 내 서재·북리스트·밑줄·팔로우·알림 신청 (11/12 · 일꾼 shop9)
 *  원칙(PLATFORM_PLAN 3-3 그대로): 손님 브라우저는 Firestore를 직접 읽지 않음 — 모두 이 클라우드 창구를 거침(관리자 SDK · 보안 규칙 staff() 밖 손님은 문서 0)
 *  모은 것: 메일(로그인용 · 남에게 안 보임)·별명(공개)·비밀번호 해시(PBKDF2-SHA256 12만 번 + 손님마다 소금 · 원문 저장 0)·소개 글(선택)
 *  공개되는 것: 별명·소개·리뷰·밑줄·공개 북리스트·서재 권수만 — 메일·주문·찜·알림 신청은 본인만
 *  창구
 *    POST /shop/a {op,…}            계정 일 전부(가입 join·로그인 login은 열쇠 없이 · 나머지는 Authorization: Bearer <열쇠>)
 *    POST /shop/a/photo (그림 본문)  리뷰 사진 올리기(본인 · 1.5MB · 하루 30장) → 이름
 *    GET  /shop/rv?k&s&f&p          책 하나의 리뷰·별점 분포·밑줄(공개 · 시험 계정 글·숨긴 글 빠짐)
 *    GET  /shop/rvnew               새로 올라온 리뷰(첫 화면)
 *    GET  /shop/pf?u                손님 공개 서재(별명·리뷰·북리스트·밑줄·서재 권수)
 *    GET  /shop/bl?l                북리스트 하나
 *    GET  /shop/rvimg?n             리뷰 사진(저장소에서 · 1년 캐시)
 *  운영자(관리 웹앱 → 클라우드 /shop-admin · 로그인 허용 계정만): 시험 계정 만들기·목록·보관/숨김·비밀번호 다시 · 리뷰/밑줄 숨김·보이기 — 지우기 없음
 *  시험 계정(test:1): 별명 앞 🧪 · 실제 주문 못 넣음(매출 0) · 그 글은 본인 화면에만(공개 목록·별점 평균·첫 화면에서 빠짐) */
'use strict';
const crypto = require('crypto');
const s = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n || 200);
const sLong = (v, n) => String(v == null ? '' : v).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').replace(/\n{4,}/g, '\n\n\n').trim().slice(0, n);
const H = (x) => crypto.createHash('sha256').update(String(x)).digest('hex');
const rnd = (n) => crypto.randomBytes(n).toString('hex');
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,80}\.[a-z]{2,}$/i;
const PW_IT = Math.max(1000, +process.env.BQ_PW_IT || 120000); /* 근거: OWASP 2023 PBKDF2-SHA256 권장 60만 — 클라우드 한 대(동시 4)에서 로그인 한 번 ≈ 60ms 되게 12만 · 로그인 막기(IP 10분 10번)와 함께 */
const SESS_DAYS = 90, SESS_MAX = 5;
/* ── 비밀번호 */
function pwHash(pw, salt, it) { salt = salt || rnd(16); it = it || PW_IT; return `p2$${it}$${salt}$${crypto.pbkdf2Sync(String(pw), salt, it, 32, 'sha256').toString('hex')}`; }
function pwOk(pw, enc) { const m = /^p2\$(\d+)\$([0-9a-f]+)\$([0-9a-f]{64})$/.exec(String(enc || '')); if (!m) return false; const a = Buffer.from(pwHash(pw, m[2], +m[1]).split('$')[3], 'hex'); const b = Buffer.from(m[3], 'hex'); return a.length === b.length && crypto.timingSafeEqual(a, b); }
const pwWhy = (pw) => { const p = String(pw || ''); if (p.length < 8) return '비밀번호는 8자 이상'; if (p.length > 64) return '비밀번호는 64자까지'; if (!/[a-z]/i.test(p) || !/\d/.test(p)) return '비밀번호에 영문과 숫자를 함께'; return null; };
/* ── 별명: 2~12자 · 전화 번호·메일·주소 꼴 막음(개인 정보가 공개 화면에 새지 않게) · 가게 이름 흉내 막음 */
const nickNorm = (v) => s(v, 40).replace(/\s+/g, ' ');
function nickWhy(v) { const n = nickNorm(v); const L = [...n].length; if (L < 2 || L > 12) return '별명은 2~12자'; if (/[<>"'`\\/@]/.test(n)) return '별명에 쓸 수 없는 글자(< > " \' ` \\ / @)'; if (/\d{6,}/.test(n.replace(/[\s-]/g, ''))) return '별명에 긴 숫자(전화 번호 등)는 넣지 않습니다';
  if (/^(운영자|관리자|북스퀸|booksqueen|admin|시험손님)/i.test(n.replace(/\s/g, ''))) return '쓸 수 없는 별명입니다'; if (/^🧪/.test(n)) return '쓸 수 없는 별명입니다'; return null; }
const nickKey = (v) => H('nk|' + nickNorm(v).toLowerCase().replace(/\s/g, ''));
const emKey = (v) => H('em|' + String(v || '').trim().toLowerCase());
/* ── 리뷰 */
const kOf = (it) => (it && it.isbn ? 'i' + it.isbn : it && it.id ? 'd' + String(it.id).slice(0, 80) : null); /* 같은 책(ISBN)이면 다른 실물로 다시 들어와도 리뷰가 이어짐 — 헌책은 한 권씩 팔려 사라지므로 */
const K_RE = /^(i97[89]\d{10}|d[A-Za-z0-9_.:-]{1,80})$/;
const LINK = /(https?:\/\/|www\.|\.(com|kr|net|io|me|ly)\b\/?)/i;
const PHONEISH = /01[016789][\s.-]?\d{3,4}[\s.-]?\d{4}/;
function rvCheck(b) { b = b || {}; const st = Math.round(+b.st); if (!(st >= 1 && st <= 10)) return { err: '별점을 골라 주세요(반 별 단위)' };
  const s100 = sLong(b.s100, 400).replace(/\n+/g, ' '); const L = [...s100].length; if (L < 2) return { err: '100자평을 두 글자 이상 적어 주세요' }; if (L > 100) return { err: `100자평은 100자까지(지금 ${L}자)` };
  const body = sLong(b.body, 6000); if ([...body].length > 5000) return { err: '긴 글은 5,000자까지' }; if (body && [...body].length < 20) return { err: '긴 글은 20자 이상(짧으면 100자평만)' };
  if (LINK.test(s100) || LINK.test(body)) return { err: '리뷰에 인터넷 주소는 넣을 수 없습니다(광고 막기)' }; if (PHONEISH.test(s100) || PHONEISH.test(body)) return { err: '리뷰에 전화 번호는 넣지 않습니다(개인 정보)' };
  const ph = [...new Set((Array.isArray(b.ph) ? b.ph : []).map((x) => String(x || '')).filter((x) => PH_RE.test(x)))].slice(0, 3);
  return { v: { st, s100, body: body || null, spo: b.spo ? 1 : 0, ph } }; }
const PH_RE = /^rv\/u_[0-9a-f]{16}\/[0-9a-f]{16}\.(jpg|png|webp)$/;
/* 별점 요약 — st는 1~10(반 별 · 10 = ★5) · avg는 별 다섯 기준 소수 한 자리 · d = 별 1~5칸(올림) 수 */
function rvStats(L) { const d = [0, 0, 0, 0, 0]; let sum = 0, n = 0, buy = 0, ph = 0; for (const r of L || []) { if (!r || !(r.st >= 1)) continue; n++; sum += r.st; d[Math.min(5, Math.ceil(r.st / 2)) - 1]++; if (r.buy) buy++; if (r.ph && r.ph.length) ph++; }
  return { n, avg: n ? Math.round((sum / n / 2) * 10) / 10 : 0, d, buy, ph }; }
const rvShown = (r) => !!r && !r.hid && !r.test && !r.gone;
function rvSort(L, k) { const at = (a, b) => String(b.at || '').localeCompare(String(a.at || '')); const f = k === 'new' ? at : k === 'hi' ? (a, b) => b.st - a.st || at(a, b) : k === 'lo' ? (a, b) => a.st - b.st || at(a, b)
    : (a, b) => (b.lk || 0) - (a.lk || 0) || (b.buy || 0) - (a.buy || 0) || (b.body ? 1 : 0) - (a.body ? 1 : 0) || at(a, b); /* 기본 = 공감순(아마존 '도움이 됨' 많은 차례) → 같으면 구매 인증·긴 글 먼저 */ return (L || []).slice().sort(f); }
const rvPub = (r, me) => ({ rid: r.rid, uid: r.uid, nick: r.nick, st: r.st, s100: r.s100, body: r.body || null, spo: r.spo || 0, ph: r.ph || [], buy: r.buy || 0, lk: r.lk || 0, at: r.at, up: r.up || null, t: r.t || null, k: r.k, id: r.id || null, im: r.im || null, ...(r.reply && r.reply.tx ? { reply: { tx: r.reply.tx, at: r.reply.at } } : {}),
  ...(me && r.uid === me ? { mine: 1, ...(r.test ? { test: 1 } : {}), ...(r.hid ? { hid: r.hid } : {}) } : {}) });
/* (shop9 2회) 리뷰 요약 — 근거: Amazon 'Customers say'·'가장 도움 된 좋은 평/아쉬운 평' · 리뷰 3개부터
 *  kw = 100자평·긴 글에서 자주 나온 낱말(두 글자 넘게 · 조사 떼고 · 흔한 말 뺌 · 두 사람 넘게 쓴 것) · pos = 별 4 넘는 것 중 공감 많은 것 · neg = 별 3 아래 중 공감 많은 것 */
const KW_STOP = new Set(['그리고', '하지만', '그래서', '정말', '너무', '진짜', '아주', '조금', '좋아요', '좋았어요', '좋습니다', '있어요', '있습니다', '없어요', '했어요', '합니다', '같아요', '이책', '이번', '그냥', '읽었어요', '읽었습니다', '읽기', '읽고', '책은', '책이', '책을', '책입니다', '생각', '때문에', '하는', '있는', '없는', '그런', '이런', '저는', '제가', '것이', '것은', '수가', '수도', '보다', '에서', '으로', '입니다', '어요']);
const KW_TAIL = /(은|는|이|가|을|를|의|에|에서|으로|로|와|과|도|만|까지|부터|이라|라고|이고|하고|했고|해서|하게|했다|한다|해요|했어요|합니다|입니다|이에요|예요|네요|어요|아요|었어요|았어요|군요|고요)$/;
function rvSummary(L) { const S = (L || []).filter(Boolean); if (S.length < 3) return null; const by = new Map();
  for (const r of S) { const seen = new Set(); for (const w0 of String((r.s100 || '') + ' ' + (r.body || '')).split(/[^0-9A-Za-z가-힣]+/)) { let w = w0.replace(KW_TAIL, ''); if ([...w].length < 2 || [...w].length > 8 || /^\d+$/.test(w) || KW_STOP.has(w) || KW_STOP.has(w0)) continue; w = w.toLowerCase(); if (seen.has(w)) continue; seen.add(w); by.set(w, (by.get(w) || 0) + 1); } }
  const kw = [...by.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8).map(([w, n]) => ({ w, n }));
  const top = (f) => S.filter(f).sort((a, b) => (b.lk || 0) - (a.lk || 0) || (b.buy || 0) - (a.buy || 0) || String(b.at).localeCompare(String(a.at)))[0] || null;
  return { kw, pos: top((r) => r.st >= 8), neg: top((r) => r.st <= 5) }; }
const qaAcct = (u) => !!u && (u.test || /\.invalid$/i.test(String(u.em || ''))); /* 시험 계정 · 점검 계정(어디로도 안 가는 .invalid 메일) — 운영자 보관 대상 */
/* 밑줄(인상 깊은 문장) — 300자 · 쪽수 선택 */
function qCheck(b) { const tx = sLong(b && b.tx, 600).replace(/\n{2,}/g, '\n'); const L = [...tx].length; if (L < 4) return { err: '문장을 네 글자 이상 적어 주세요' }; if (L > 300) return { err: '문장은 300자까지' }; if (LINK.test(tx) || PHONEISH.test(tx)) return { err: '주소·전화 번호는 넣지 않습니다' };
  const pg = Math.round(+(b && b.pg)); return { v: { tx, pg: pg > 0 && pg < 10000 ? pg : null } }; }
/* 서재 상태 — want 읽고 싶어요 · ing 읽는 중 · done 다 읽음 (Goodreads 세 칸 그대로) */
const RD = { want: '읽고 싶어요', ing: '읽는 중', done: '다 읽음' };
const bookMini = (x) => ({ id: s(x && x.id, 80) || null, t: s(x && x.t, 120), a: s(x && x.a, 60) || null, im: /^https:\/\//.test(String((x && x.im) || '')) ? String(x.im).slice(0, 400) : null });
function goalOf(u, y) { const g = (u && u.goal) || {}; const yr = y || new Date(Date.now() + 9 * 3600e3).getUTCFullYear(); const n = g.y === yr ? Math.max(0, +g.n || 0) : 0;
  const done = Object.values((u && u.rd) || {}).filter((r) => r && r.s === 'done' && String(r.fin || r.at || '').slice(0, 4) === String(yr)).length; return { y: yr, n, done, pct: n ? Math.min(100, Math.round((done / n) * 100)) : 0 }; }
/* 알림 신청 판정 — 값 내림: 지금 값 < 신청 때 값 · 다시 들어옴: 같은 책(ISBN)의 판매중 실물이 생김(주문 중·팔림 빼고) */
function alertState(A, V, held, sold) { const out = []; const H0 = held || new Set(), X = sold || new Set(); const byIsbn = new Map(); for (const x of V.values()) if (x && x.isbn && !H0.has(x.id) && !X.has(x.id)) { if (!byIsbn.has(x.isbn)) byIsbn.set(x.isbn, []); byIsbn.get(x.isbn).push(x); }
  for (const [key, a] of Object.entries(A || {})) { if (!a) continue; if (a.k === 'price') { const x = V.get(a.id); const live = x && !X.has(x.id); out.push({ key, ...a, now: live ? x.p : null, hit: !!(live && !H0.has(x.id) && x.p < a.p), gone: !live }); }
    else if (a.k === 'restock') { const L = a.isbn ? byIsbn.get(a.isbn) || [] : []; const best = L.slice().sort((p, q) => p.p - q.p)[0]; out.push({ key, ...a, hit: !!best, to: best ? { id: best.id, p: best.p, g: best.g } : null }); } }
  return out.sort((p, q) => (q.hit ? 1 : 0) - (p.hit ? 1 : 0) || String(q.at || '').localeCompare(String(p.at || ''))); }
/* 시험 계정 — 가짜 이름·없는 메일(.invalid 끝 · RFC 2606 — 어디로도 안 감) */
const TEST_NICK = ['책벌레', '밤독서', '헌책사랑', '첫장', '책갈피', '서재지기', '느린독자', '오늘한권'];
const mkTestOne = (i, tag) => ({ em: `test-${tag}-${i}@test.booksqueen.invalid`, nick: `🧪${TEST_NICK[i % TEST_NICK.length]}${tag.slice(0, 3)}${i}`, pw: 'Bq' + rnd(4) + (10 + (i % 90)) });
const ORD_OK = new Set(['paid', 'ship', 'sent', 'done']);

function makeAcct({ db, C, FV, log, bucket, ready, vw, held, soldX, ipKey, limitWait, view }) {
  const UC = new Map(); /* 손님 문서 30초 기억 */ const RVC = new Map(); /* 책마다 리뷰·밑줄 60초 기억 */ const PFC = new Map(); let NEW = { at: 0, L: [] }; const IMC = new Map(); const FAIL = new Map();
  const nowIso = () => new Date().toISOString(); const UID_RE = /^u_[0-9a-f]{16}$/;
  const E = (code, err, x) => [code, { ok: false, err, ...(x || {}) }]; const OK = (x) => [200, { ok: true, ...(x || {}) }];
  async function uGet(uid, fresh) { if (!UID_RE.test(String(uid || ''))) return null; const c = UC.get(uid); if (!fresh && c && Date.now() - c.at < 30e3) return c.d; const d = await C('shop_users').doc(uid).get(); const v = d.exists ? d.data() : null; UC.set(uid, { at: Date.now(), d: v }); if (UC.size > 3000) UC.clear(); return v; }
  async function uSet(uid, v) { await C('shop_users').doc(uid).set({ ...v, up: nowIso() }, { merge: true }); UC.delete(uid); PFC.delete(uid); }
  /* 열쇠 = 손님 번호 + '.' + 무작위 32자 · 문서엔 해시만(sess) · 90일 · 기기 5대 */
  async function authOf(req) { const m = /^Bearer\s+(u_[0-9a-f]{16})\.([0-9a-f]{32})$/.exec(String((req.headers && req.headers.authorization) || '')); if (!m) return null; const u = await uGet(m[1]); if (!u || u.gone || u.arch) return null;
    const h = H(m[1] + '.' + m[2]); const t = Date.now(); const ok = (u.sess || []).some((x) => x && x.h === h && Date.parse(x.exp) > t); return ok ? { uid: m[1], u, h } : null; }
  const sessNew = (u) => { const tok = u.uid + '.' + rnd(16); const t = Date.now(); const sess = [{ h: H(tok), exp: new Date(t + SESS_DAYS * 864e5).toISOString(), at: new Date(t).toISOString() }, ...(u.sess || []).filter((x) => x && Date.parse(x.exp) > t)].slice(0, SESS_MAX); return { tok, sess }; };
  const rdList = (u) => Object.entries((u && u.rd) || {}).filter(([, r]) => r && r.s).map(([k, r]) => ({ k, ...r })).sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
  function meView(u) { const rd = rdList(u); const cnt = { want: 0, ing: 0, done: 0 }; rd.forEach((r) => { if (cnt[r.s] != null) cnt[r.s]++; });
    return { uid: u.uid, em: u.em, nick: u.nick, bio: u.bio || '', test: u.test ? 1 : 0, at: u.at, notif: { order: 1, restock: 1, price: 1, follow: 1, news: 0, ...(u.notif || {}) }, goal: goalOf(u), rd, rdN: cnt, wish: u.wish || [], seen: u.seen || [], fol: u.fol || [], folN: u.folN || 0,
      alertN: Object.values(u.alerts || {}).filter(Boolean).length, ordN: (u.ords || []).length, rvN: u.rvN || 0, pts: 0, cps: [] /* 적립금·쿠폰 = 자리만(돈 흐름은 정범님 결정) */ }; }
  /* ── 가입 · 로그인 */
  async function join(b, req, test, by) { const em = String(b.em || '').trim().toLowerCase(); if (!EMAIL.test(em) || em.length > 120) return E(400, '메일 주소를 다시 확인해 주세요', { f: 'em' }); const pw = String(b.pw || ''); const pwE = pwWhy(pw); if (pwE) return E(400, pwE, { f: 'pw' });
    const nick = nickNorm(b.nick); const nE = test ? null : nickWhy(nick); if (nE) return E(400, nE, { f: 'nick' }); if (!test && !(b.agree && b.agree.privacy && b.agree.terms)) return E(400, '회원 개인정보 수집·이용과 이용약관에 동의해 주세요', { f: 'agree' });
    const uid = 'u_' + rnd(8); const t = nowIso(); const u = { uid, em, nick, pw: pwHash(pw), at: t, last: t, test: test ? 1 : 0, ...(test ? { by: s(by, 80) } : { agree: { privacy: t, terms: t, ver: '2026-11-12' }, ipk: ipKey(req) }), notif: { order: 1, restock: 1, price: 1, follow: 1, news: b.news ? 1 : 0 }, rvN: 0 };
    const S0 = sessNew(u); u.sess = S0.sess; let out = null;
    await db.runTransaction(async (tx) => { out = null; const er = C('shop_users_em').doc(emKey(em)), nr = C('shop_users_nk').doc(nickKey(nick)); const [ed, nd] = [await tx.get(er), await tx.get(nr)];
      if (ed.exists && (ed.data() || {}).uid) { out = E(409, '이미 가입한 메일입니다 — 로그인해 주세요', { f: 'em' }); return; } if (nd.exists && (nd.data() || {}).uid) { out = E(409, '이미 쓰이는 별명입니다', { f: 'nick' }); return; }
      tx.set(C('shop_users').doc(uid), u); tx.set(er, { uid, at: t }); tx.set(nr, { uid, at: t }); out = OK({ tok: S0.tok, me: meView(u) }); });
    if (out && out[0] === 200) log && log(`👤 우리숍 ${test ? '시험 ' : ''}손님 가입 ${uid}`); return out; }
  async function login(b, req) { const ik = ipKey(req); const f = (FAIL.get(ik) || []).filter((x) => Date.now() - x < 600e3); if (f.length >= 10) return E(429, '로그인을 너무 많이 틀렸습니다 — 10분 뒤 다시 해 주세요');
    const em = String(b.em || '').trim().toLowerCase(); const fail = () => { f.push(Date.now()); FAIL.set(ik, f); if (FAIL.size > 5000) FAIL.clear(); return E(401, '메일 또는 비밀번호가 맞지 않습니다'); };
    if (!EMAIL.test(em)) return fail(); const ed = await C('shop_users_em').doc(emKey(em)).get(); const uid = ed.exists ? (ed.data() || {}).uid : null; const u = uid ? await uGet(uid, true) : null; if (!u || u.gone || !pwOk(b.pw, u.pw)) return fail();
    if (u.arch) return E(403, '보관된 계정입니다(운영자가 쉬게 함)'); const S0 = sessNew(u); await uSet(uid, { sess: S0.sess, last: nowIso() }); return OK({ tok: S0.tok, me: meView({ ...u, sess: S0.sess }) }); }
  /* ── 구매 인증: 이 계정으로 한 주문 중 입금 확인 뒤(입금·출고·보냄·끝) 같은 책(ISBN 또는 그 실물) */
  async function buyOf(u, k) { const L = (u.ords || []).slice(0, 100).map((x) => x && x.no).filter(Boolean); if (!L.length) return null; const ds = await db.getAll(...L.map((no) => C('shop_orders').doc(no)));
    for (const d of ds) { const o = d.exists ? d.data() : null; if (!o || o.uid !== u.uid || !ORD_OK.has(o.st)) continue; const x = (o.items || []).find((y) => (y.isbn && 'i' + y.isbn === k) || 'd' + y.lid === k); if (x) return { t: x.t, im: x.im || null, id: x.lid }; } return null; }
  const RS = { m: new Map(), at: 0, busy: null }; /* (shop9 2회) 책마다 [평균, 수] — 목록·서가 카드·/b/ 화면 별점 */
  const rsSet = (k, L) => { const S0 = rvStats(L.filter(rvShown)); if (S0.n) RS.m.set(k, [S0.avg, S0.n]); else RS.m.delete(k); };
  function rsLoad() { if (RS.busy || Date.now() - RS.at < 600e3) return RS.busy; RS.busy = (async () => { try { const ss = await C('shop_reviews').where('hid', '==', 0).get(); const by = new Map(); ss.forEach((d) => { const r = d.data(); if (!r || !r.k) return; if (!by.has(r.k)) by.set(r.k, []); by.get(r.k).push(r); });
      const m = new Map(); for (const [k, L] of by) { const S0 = rvStats(L.filter(rvShown)); if (S0.n) m.set(k, [S0.avg, S0.n]); } RS.m = m; RS.at = Date.now(); } catch (e) { RS.at = Date.now() - 480e3; log && log('⭐ 별점 요약 못 읽음', e.message); } finally { RS.busy = null; } })(); return RS.busy; }
  const ratingOf = (x) => { if (Date.now() - RS.at > 600e3) rsLoad(); const k = kOf(x); return (k && RS.m.get(k)) || null; };
  async function rvFor(k) { const c = RVC.get(k); if (c && Date.now() - c.at < 60e3) return c; const [a, b] = await Promise.all([C('shop_reviews').where('k', '==', k).get(), C('shop_quotes').where('k', '==', k).get()]); const L = [], Q = []; a.forEach((d) => L.push(d.data())); b.forEach((d) => Q.push(d.data()));
    const v = { at: Date.now(), L, Q }; RVC.set(k, v); rsSet(k, L); if (RVC.size > 2000) RVC.clear(); return v; }
  const bookOf = async (id, k) => { await ready(); const V = await vw(); const x = id ? V.get(String(id)) : null; if (x && kOf(x) === k) return x; if (k && k[0] === 'd' && V.get(k.slice(1))) return V.get(k.slice(1)); if (k && k[0] === 'i') { for (const y of V.values()) if (y.isbn === k.slice(1)) return y; } return null; };
  const qPub = (x, me) => ({ qid: x.qid, uid: x.uid, nick: x.nick, tx: x.tx, pg: x.pg || null, at: x.at, t: x.t || null, k: x.k, ...(me && x.uid === me ? { mine: 1, ...(x.test ? { test: 1 } : {}) } : {}) });
  /* ── 계정 일(op) */
  async function op(req, b) { b = b && typeof b === 'object' ? b : {}; const o = String(b.op || '');
    if (o === 'join') { const ik = ipKey(req); if (limitWait('aj' + ik, 5, 3600e3)) return E(429, '잠시 뒤 다시 해 주세요(가입이 많음)'); if (b.hp) return E(400, '잘못된 요청'); return join(b, req); }
    if (o === 'login') return login(b, req);
    const A = await authOf(req); if (!A) return E(401, '로그인이 필요합니다', { login: 1 }); const { uid } = A; let u = A.u;
    if (limitWait('au' + uid, 300, 600e3)) return E(429, '잠시 뒤 다시 해 주세요');
    if (o === 'me') { if (Date.now() - Date.parse(u.last || 0) > 3600e3) uSet(uid, { last: nowIso() }).catch(() => {}); return OK({ me: meView(u) }); }
    if (o === 'out') { await uSet(uid, { sess: (u.sess || []).filter((x) => x && x.h !== A.h) }); return OK(); }
    if (o === 'set') { const up = {}; if (b.bio != null) { const bio = sLong(b.bio, 300).replace(/\n+/g, ' '); if ([...bio].length > 150) return E(400, '소개는 150자까지'); if (LINK.test(bio) || PHONEISH.test(bio)) return E(400, '소개에 주소·전화 번호는 넣지 않습니다'); up.bio = bio; }
      if (b.notif && typeof b.notif === 'object') { up.notif = {}; for (const k of ['order', 'restock', 'price', 'follow', 'news']) if (k in b.notif) up.notif[k] = b.notif[k] ? 1 : 0; }
      if (b.goal != null) { const n = Math.round(+b.goal); if (!(n >= 0 && n <= 1000)) return E(400, '독서 목표는 0~1,000권'); up.goal = { y: goalOf(u).y, n }; }
      if (b.nick != null && nickNorm(b.nick) !== u.nick) { const nick = nickNorm(b.nick); const nE = u.test ? null : nickWhy(nick); if (nE) return E(400, nE, { f: 'nick' }); let bad = null;
        await db.runTransaction(async (tx) => { bad = null; const nr = C('shop_users_nk').doc(nickKey(nick)); const nd = await tx.get(nr); if (nd.exists && (nd.data() || {}).uid && nd.data().uid !== uid) { bad = '이미 쓰이는 별명입니다'; return; } tx.set(nr, { uid, at: nowIso() }); tx.set(C('shop_users_nk').doc(nickKey(u.nick)), { uid: null, freeAt: nowIso() }, { merge: true }); });
        if (bad) return E(409, bad, { f: 'nick' }); up.nick = nick; }
      await uSet(uid, up); u = await uGet(uid, true); return OK({ me: meView(u) }); }
    if (o === 'pw') { if (!pwOk(b.old, u.pw)) return E(400, '지금 비밀번호가 맞지 않습니다', { f: 'old' }); const w = pwWhy(b.nw); if (w) return E(400, w, { f: 'nw' }); const S0 = sessNew({ ...u, sess: [] }); await uSet(uid, { pw: pwHash(b.nw), sess: S0.sess }); return OK({ tok: S0.tok }); }
    if (o === 'bye') { if (!pwOk(b.pw, u.pw)) return E(400, '비밀번호가 맞지 않습니다', { f: 'pw' }); /* 회원 탈퇴 — 메일·별명 묶음을 풀고 로그인 0 · 쓴 글은 화면에서 빠짐(개인정보 보호법 · 주문 기록은 전자상거래법 5년 그대로) */
      const t = nowIso(); await C('shop_users_em').doc(emKey(u.em)).set({ uid: null, freeAt: t }, { merge: true }); await C('shop_users_nk').doc(nickKey(u.nick)).set({ uid: null, freeAt: t }, { merge: true });
      for (const cn of ['shop_reviews', 'shop_quotes', 'shop_lists']) { const ss = await C(cn).where('uid', '==', uid).get(); const W = []; ss.forEach((d) => W.push(d.ref.set({ gone: 1 }, { merge: true }))); await Promise.all(W); } RVC.clear(); NEW.at = 0;
      await uSet(uid, { gone: 1, goneAt: t, em: null, sess: [], wish: [], seen: [], alerts: {}, bio: '' }); return OK(); }
    if (o === 'rd') { const k = String(b.k || ''); if (!K_RE.test(k)) return E(400, '책 번호가 이상함'); const st = b.s == null || b.s === '' ? null : String(b.s); if (st && !RD[st]) return E(400, '서재 칸이 이상함');
      if (st && !(u.rd || {})[k] && Object.keys(u.rd || {}).length >= 2000) return E(400, '서재는 2,000권까지'); const was = (u.rd || {})[k] || {}; const x = await bookOf(b.id, k); const bk = x ? bookMini(x) : bookMini(b.book || was);
      if (!bk.t) return E(400, '책 정보를 찾을 수 없음'); const v = st ? { s: st, ...bk, at: nowIso(), ...(st === 'done' ? { fin: was.fin && was.s === 'done' ? was.fin : nowIso() } : {}) } : null; await uSet(uid, { rd: { [k]: v } }); u = await uGet(uid, true); return OK({ rd: v, goal: goalOf(u) }); }
    if (o === 'wish' || o === 'seen') { const max = o === 'wish' ? 300 : 30; const L = (Array.isArray(b.L) ? b.L : []).slice(0, max).map((x) => ({ ...bookMini(x), p: Math.max(0, Math.round(+x.p || 0)), g: s(x.g, 4) || null, ...(o === 'wish' ? { at: s(x.at, 30) || nowIso() } : {}) })).filter((x) => x.id && x.t);
      await uSet(uid, { [o]: L }); return OK({ n: L.length }); }
    if (o === 'alert') { const kk = b.k === 'price' ? 'price' : b.k === 'restock' ? 'restock' : null; if (!kk) return E(400, '알림 종류가 이상함'); await ready(); const V = await vw(); const x = V.get(s(b.id, 80));
      const isbn = x ? x.isbn : /^97[89]\d{10}$/.test(String(b.isbn || '')) ? String(b.isbn) : null; if (kk === 'price' && !x) return E(400, '판매중인 책만 값 내림 알림을 걸 수 있습니다'); if (kk === 'restock' && !isbn) return E(400, 'ISBN이 없는 책은 다시 들어옴 알림을 걸 수 없습니다');
      const key = kk + ':' + (kk === 'price' ? x.id : isbn); const on = !!b.on; if (on && !(u.alerts || {})[key] && Object.values(u.alerts || {}).filter(Boolean).length >= 100) return E(400, '알림 신청은 100개까지');
      const v = on ? { k: kk, id: x ? x.id : s(b.id, 80) || null, isbn, t: x ? x.t : s(b.t, 120), im: x ? x.im || null : null, p: x ? x.p : null, at: nowIso() } : null; await uSet(uid, { alerts: { [key]: v } }); return OK({ key, on }); }
    if (o === 'alerts') { await ready(); const st = alertState(u.alerts, await vw(), await held(), await soldX()); return OK({ L: st }); }
    if (o === 'orders') { const L = (u.ords || []).slice(0, 100); if (!L.length) return OK({ L: [] }); const ds = await db.getAll(...L.map((x) => C('shop_orders').doc(x.no))); const out = [];
      ds.forEach((d, i) => { const ob = d.exists ? d.data() : null; if (!ob || ob.uid !== uid) return; out.push({ ...view(ob), t: L[i].t || null }); }); return OK({ L: out }); }
    if (o === 'rv') { if (limitWait('arv' + uid, 20, 3600e3)) return E(429, '잠시 뒤 다시 해 주세요(짧은 시간에 리뷰가 많음)'); const k = String(b.k || ''); if (!K_RE.test(k)) return E(400, '책 번호가 이상함'); const c = rvCheck(b); if (c.err) return E(400, c.err);
      if (c.v.ph.some((n) => !n.startsWith('rv/' + uid + '/'))) return E(400, '사진이 이상함'); const x = await bookOf(b.id, k); const buy = await buyOf(u, k).catch(() => null); const rid = 'r_' + H(k + '|' + uid).slice(0, 20); let out = null;
      await db.runTransaction(async (tx) => { out = null; const ref = C('shop_reviews').doc(rid); const d = await tx.get(ref); const was = d.exists ? d.data() : null; const info = x ? { id: x.id, t: x.t, a: x.a || null, im: x.im || null } : was ? { id: was.id, t: was.t, a: was.a, im: was.im } : buy ? { id: buy.id, t: buy.t, a: null, im: buy.im } : null;
        if (!info) { out = E(400, '책 정보를 찾을 수 없음(판매가 끝난 책은 산 분만 리뷰를 쓸 수 있습니다)'); return; } const t = nowIso();
        const v = { rid, k, ...info, uid, nick: u.nick, ...c.v, buy: buy ? 1 : 0, test: u.test ? 1 : 0, hid: was && was.hid && was.hid !== 'self' ? was.hid : 0, gone: 0, lk: (was && was.lk) || 0, rep: (was && was.rep) || 0, repBy: (was && was.repBy) || [], at: (was && was.at) || t, up: was ? t : null };
        tx.set(ref, v); out = OK({ rv: rvPub(v, uid), new: !was }); });
      if (out[0] === 200) { RVC.delete(k); NEW.at = 0; PFC.delete(uid); const up = {}; if (out[1].new) up.rvN = (u.rvN || 0) + 1; if (!(u.rd || {})[k] && x) up.rd = { [k]: { s: 'done', ...bookMini(x), at: nowIso(), fin: nowIso() } }; /* 별점을 매기면 '다 읽음'(Goodreads 같은 흐름) */ if (Object.keys(up).length) await uSet(uid, up); } return out; }
    if (o === 'rvDel') { const k = String(b.k || ''); if (!K_RE.test(k)) return E(400, '책 번호가 이상함'); const rid = 'r_' + H(k + '|' + uid).slice(0, 20); const d = await C('shop_reviews').doc(rid).get(); if (!d.exists) return E(404, '리뷰가 없습니다'); if ((d.data() || {}).hid === 'adm') return E(403, '운영자가 숨긴 리뷰는 고칠 수 없습니다');
      await d.ref.set({ hid: 'self', up: nowIso() }, { merge: true }); RVC.delete(k); NEW.at = 0; PFC.delete(uid); await uSet(uid, { rvN: Math.max(0, (u.rvN || 0) - 1) }); return OK(); } /* 지우지 않고 숨김(되살리기는 다시 쓰기) */
    if (o === 'like' || o === 'rep') { if (limitWait('alk' + uid, 200, 3600e3)) return E(429, '잠시 뒤 다시'); const rid = String(b.rid || ''); if (!/^r_[0-9a-f]{20}$/.test(rid)) return E(400, '리뷰 번호가 이상함'); let out = null; let k = null;
      await db.runTransaction(async (tx) => { out = null; const ref = C('shop_reviews').doc(rid); const d = await tx.get(ref); const r = d.exists ? d.data() : null; if (!r || r.gone) { out = E(404, '리뷰가 없습니다'); return; } k = r.k; if (r.uid === uid) { out = E(400, o === 'like' ? '내 리뷰에는 공감할 수 없습니다' : '내 리뷰는 신고할 수 없습니다'); return; }
        if (o === 'like') { const lr = C('shop_rlikes').doc(rid + '_' + uid); const l = await tx.get(lr); const on = !(l.exists && (l.data() || {}).on); tx.set(lr, { on: on ? 1 : 0, at: nowIso(), rid, uid }); const lk = Math.max(0, (r.lk || 0) + (on ? 1 : -1)); tx.set(ref, { lk }, { merge: true }); out = OK({ on, lk }); return; }
        const me = H('rp|' + uid).slice(0, 16); const by = r.repBy || []; if (by.includes(me)) { out = OK({ already: 1 }); return; } const nb = [...by, me].slice(-50); const why = s(b.why, 40) || '기타';
        tx.set(ref, { repBy: nb, rep: nb.length, repWhy: [...(r.repWhy || []), why].slice(-20), ...(nb.length >= 3 && !r.hid ? { hid: 'rep', hidAt: nowIso() } : {}) }, { merge: true }); out = OK({ rep: nb.length }); }); /* 서로 다른 손님 신고 3번이면 저절로 가림(교보 Klover리뷰 규칙과 같은 생각) → 운영자가 보고 되살리거나 그대로 */
      if (k) RVC.delete(k); return out; }
    if (o === 'myLikes') { const ids = (Array.isArray(b.rids) ? b.rids : []).map(String).filter((x) => /^r_[0-9a-f]{20}$/.test(x)).slice(0, 50); if (!ids.length) return OK({ on: [] }); const ds = await db.getAll(...ids.map((r) => C('shop_rlikes').doc(r + '_' + uid))); return OK({ on: ids.filter((r, i) => ds[i].exists && (ds[i].data() || {}).on) }); }
    if (o === 'q') { if (limitWait('aq' + uid, 30, 3600e3)) return E(429, '잠시 뒤 다시'); const k = String(b.k || ''); if (!K_RE.test(k)) return E(400, '책 번호가 이상함'); const c = qCheck(b); if (c.err) return E(400, c.err); const x = await bookOf(b.id, k); if (!x) return E(400, '판매중인 책에만 밑줄을 남길 수 있습니다');
      const qid = 'q_' + rnd(8); const v = { qid, k, id: x.id, t: x.t, uid, nick: u.nick, ...c.v, test: u.test ? 1 : 0, hid: 0, at: nowIso() }; await C('shop_quotes').doc(qid).set(v); RVC.delete(k); PFC.delete(uid); return OK({ q: qPub(v, uid) }); }
    if (o === 'qDel') { const qid = String(b.qid || ''); if (!/^q_[0-9a-f]{16}$/.test(qid)) return E(400, '번호가 이상함'); const d = await C('shop_quotes').doc(qid).get(); const x = d.exists ? d.data() : null; if (!x || x.uid !== uid) return E(404, '내 밑줄이 아닙니다'); await d.ref.set({ hid: 'self' }, { merge: true }); RVC.delete(x.k); PFC.delete(uid); return OK(); }
    if (o === 'fol') { const t = String(b.u || ''); if (!UID_RE.test(t) || t === uid) return E(400, '팔로우할 수 없습니다'); const on = !!b.on; const L = (u.fol || []).filter((x) => x !== t); if (on && L.length >= 300) return E(400, '팔로우는 300명까지'); let out = null;
      await db.runTransaction(async (tx) => { out = null; const tr = C('shop_users').doc(t); const d = await tx.get(tr); const v = d.exists ? d.data() : null; if (!v || v.gone || v.arch) { out = E(404, '없는 손님입니다'); return; } const had = (u.fol || []).includes(t); if (had === on) { out = OK({ on, folN: v.folN || 0 }); return; }
        const folN = Math.max(0, (v.folN || 0) + (on ? 1 : -1)); tx.set(tr, { folN }, { merge: true }); tx.set(C('shop_users').doc(uid), { fol: on ? [t, ...L] : L, up: nowIso() }, { merge: true }); out = OK({ on, folN }); }); UC.delete(uid); UC.delete(t); PFC.delete(t); return out; }
    if (o === 'folList') { const F = (u.fol || []).slice(0, 300); const out = []; for (let i = 0; i < F.length; i += 100) { const ds = await db.getAll(...F.slice(i, i + 100).map((x) => C('shop_users').doc(x))); ds.forEach((d) => { const v = d.exists ? d.data() : null; if (v && !v.gone && !v.arch) out.push({ uid: v.uid, nick: v.nick, bio: v.bio || '', rvN: v.rvN || 0, folN: v.folN || 0 }); }); }
      /* 추천(Goodreads '취향 비슷한 독자'): 내가 별 4 넘게 준 책에 똑같이 별 4 넘게 준 손님 — 겹친 책 수 차례 · 이미 팔로우·나·시험 계정 뺌 · 없으면 리뷰 많이 쓴 손님 */
      const mine = await C('shop_reviews').where('uid', '==', uid).get(); const K = []; mine.forEach((d) => { const r = d.data(); if (r && r.st >= 8 && !r.gone) K.push(r.k); }); const cnt = new Map(); const nk = new Map(); const fol = new Set(u.fol || []);
      for (let i = 0; i < Math.min(K.length, 30); i += 10) { const ss = await C('shop_reviews').where('k', 'in', K.slice(i, i + 10)).get(); ss.forEach((d) => { const r = d.data(); if (!r || r.uid === uid || fol.has(r.uid) || r.st < 8 || !rvShown(r)) return; cnt.set(r.uid, (cnt.get(r.uid) || 0) + 1); nk.set(r.uid, r.nick); }); }
      let rec = [...cnt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([x, n]) => ({ uid: x, nick: nk.get(x), same: n }));
      if (rec.length < 3) { const since = new Date(Date.now() - 90 * 864e5).toISOString(); const ss = await C('shop_reviews').where('at', '>', since).get(); const c2 = new Map(); ss.forEach((d) => { const r = d.data(); if (!r || r.uid === uid || fol.has(r.uid) || !rvShown(r) || cnt.has(r.uid)) return; c2.set(r.uid, (c2.get(r.uid) || 0) + 1 + (r.lk || 0)); nk.set(r.uid, r.nick); });
        rec = rec.concat([...c2.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6 - rec.length).map(([x]) => ({ uid: x, nick: nk.get(x), same: 0 }))); }
      return OK({ L: out, rec }); }
    if (o === 'feed') { const F = (u.fol || []).slice(0, 30); if (!F.length) return OK({ L: [], Q: [] }); const L = [], Q = []; for (let i = 0; i < F.length; i += 10) { const part = F.slice(i, i + 10); const [a, c2] = await Promise.all([C('shop_reviews').where('uid', 'in', part).get(), C('shop_quotes').where('uid', 'in', part).get()]); a.forEach((d) => L.push(d.data())); c2.forEach((d) => Q.push(d.data())); }
      return OK({ L: rvSort(L.filter(rvShown), 'new').slice(0, 40).map((r) => rvPub(r)), Q: Q.filter(rvShown).sort((a, b2) => String(b2.at).localeCompare(String(a.at))).slice(0, 20).map((x) => qPub(x)) }); }
    if (o === 'mine') { const k = String(b.k || ''); if (!K_RE.test(k)) return E(400, '책 번호가 이상함'); const rid = 'r_' + H(k + '|' + uid).slice(0, 20); const [d, R] = await Promise.all([C('shop_reviews').doc(rid).get(), rvFor(k)]); const r = d.exists ? d.data() : null;
      const isbn = k[0] === 'i' ? k.slice(1) : null; const al = Object.entries(u.alerts || {}).filter(([key, a]) => a && ((a.k === 'price' && a.id === s(b.id, 80)) || (a.k === 'restock' && isbn && a.isbn === isbn))).map(([key]) => key); const LS = await C('shop_lists').where('uid', '==', uid).get(); const lists = [];
      LS.forEach((x) => { const v = x.data(); if (v && !v.hid && !v.gone) lists.push({ lid: v.lid, nm: v.nm, has: (v.items || []).some((y) => y.k === k) }); });
      return OK({ rv: r && r.hid !== 'self' && !r.gone ? rvPub(r, uid) : null, rd: (u.rd || {})[k] || null, al, lists, q: R.Q.filter((x) => x.uid === uid && !x.hid && !x.gone).map((x) => qPub(x, uid)) }); }
    if (o === 'myRv') { const [a, c2] = await Promise.all([C('shop_reviews').where('uid', '==', uid).get(), C('shop_quotes').where('uid', '==', uid).get()]); const L = [], Q = []; a.forEach((d) => { const r = d.data(); if (r && r.hid !== 'self' && !r.gone) L.push(rvPub(r, uid)); }); c2.forEach((d) => { const x = d.data(); if (x && !x.hid && !x.gone) Q.push(qPub(x, uid)); });
      return OK({ L: rvSort(L, 'new'), Q: Q.sort((p, q2) => String(q2.at).localeCompare(String(p.at))) }); }
    if (o === 'bl') { const nm = s(b.nm, 60); if ([...nm].length < 1 || [...nm].length > 40) return E(400, '목록 이름은 1~40자'); const ds = sLong(b.ds, 600).replace(/\n{2,}/g, '\n'); if ([...ds].length > 300) return E(400, '설명은 300자까지'); if (LINK.test(nm + ds) || PHONEISH.test(nm + ds)) return E(400, '주소·전화 번호는 넣지 않습니다');
      let lid = String(b.lid || ''); const t = nowIso(); if (lid) { if (!/^l_[0-9a-f]{16}$/.test(lid)) return E(400, '목록 번호가 이상함'); const d = await C('shop_lists').doc(lid).get(); if (!d.exists || d.data().uid !== uid) return E(404, '내 목록이 아닙니다'); await d.ref.set({ nm, ds, pub: b.pub === 0 || b.pub === false ? 0 : 1, up: t }, { merge: true }); }
      else { const LS = await C('shop_lists').where('uid', '==', uid).get(); let n = 0; LS.forEach((x) => { if (!x.data().hid) n++; }); if (n >= 30) return E(400, '북리스트는 30개까지'); lid = 'l_' + rnd(8); await C('shop_lists').doc(lid).set({ lid, uid, nick: u.nick, nm, ds, pub: b.pub === 0 || b.pub === false ? 0 : 1, items: [], test: u.test ? 1 : 0, hid: 0, at: t, up: t }); }
      PFC.delete(uid); return OK({ lid }); }
    if (o === 'blAdd') { const lid = String(b.lid || ''); if (!/^l_[0-9a-f]{16}$/.test(lid)) return E(400, '목록 번호가 이상함'); const k = String(b.k || ''); if (!K_RE.test(k)) return E(400, '책 번호가 이상함'); let out = null;
      const x = await bookOf(b.id, k); await db.runTransaction(async (tx) => { out = null; const ref = C('shop_lists').doc(lid); const d = await tx.get(ref); const v = d.exists ? d.data() : null; if (!v || v.uid !== uid || v.hid) { out = E(404, '내 목록이 아닙니다'); return; }
        let L = (v.items || []).filter((y) => y.k !== k); if (b.on) { if (L.length >= 100) { out = E(400, '한 목록에 100권까지'); return; } const bk = x ? bookMini(x) : bookMini(b.book); if (!bk.t) { out = E(400, '책 정보를 찾을 수 없음'); return; } L = [...L, { k, ...bk, note: s(b.note, 100) || null, at: nowIso() }]; }
        tx.set(ref, { items: L, up: nowIso() }, { merge: true }); out = OK({ n: L.length }); }); PFC.delete(uid); return out; }
    if (o === 'blDel') { const lid = String(b.lid || ''); const d = /^l_[0-9a-f]{16}$/.test(lid) ? await C('shop_lists').doc(lid).get() : null; if (!d || !d.exists || d.data().uid !== uid) return E(404, '내 목록이 아닙니다'); await d.ref.set({ hid: 'self', up: nowIso() }, { merge: true }); PFC.delete(uid); return OK(); }
    if (o === 'blMine') { const LS = await C('shop_lists').where('uid', '==', uid).get(); const L = []; LS.forEach((x) => { const v = x.data(); if (v && !v.hid && !v.gone) L.push({ lid: v.lid, nm: v.nm, ds: v.ds, pub: v.pub, items: v.items || [], up: v.up }); }); return OK({ L: L.sort((p, q2) => String(q2.up).localeCompare(String(p.up))) }); }
    return E(404, '없는 일'); }
  /* ── 공개 읽기 */
  async function rvGet(q) { const k = String(q.k || ''); if (!K_RE.test(k)) return E(400, '책 번호가 이상함'); const R = await rvFor(k); const L0 = R.L.filter(rvShown); const st = rvStats(L0);
    let L = L0; if (q.f === 'ph') L = L.filter((r) => r.ph && r.ph.length); else if (q.f === 'buy') L = L.filter((r) => r.buy); else if (q.f === 'long') L = L.filter((r) => r.body); L = rvSort(L, q.s); const p = Math.max(0, Math.min(200, parseInt(q.p, 10) || 0));
    return OK({ k, st, sum: (() => { const z = rvSummary(L0); return z ? { kw: z.kw, pos: z.pos ? rvPub(z.pos) : null, neg: z.neg && (!z.pos || z.neg.rid !== z.pos.rid) ? rvPub(z.neg) : null } : null; })(), total: L.length, more: (p + 1) * 10 < L.length, items: L.slice(p * 10, (p + 1) * 10).map((r) => rvPub(r)), q: R.Q.filter(rvShown).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 12).map((x) => qPub(x)) }); }
  async function rvNew() { if (Date.now() - NEW.at < 60e3) return OK({ L: NEW.L }); const since = new Date(Date.now() - 60 * 864e5).toISOString(); const ss = await C('shop_reviews').where('at', '>', since).get(); const L = []; ss.forEach((d) => L.push(d.data()));
    NEW = { at: Date.now(), L: rvSort(L.filter(rvShown), 'new').slice(0, 12).map((r) => rvPub(r)) }; return OK({ L: NEW.L }); }
  async function pfGet(q) { const t = String(q.u || ''); if (!UID_RE.test(t)) return E(400, '손님 번호가 이상함'); const c = PFC.get(t); if (c && Date.now() - c.at < 60e3) return c.v; const u = await uGet(t); if (!u || u.gone || u.arch) return E(404, '없는 손님입니다');
    const [a, b, l] = await Promise.all([C('shop_reviews').where('uid', '==', t).get(), C('shop_quotes').where('uid', '==', t).get(), C('shop_lists').where('uid', '==', t).get()]); const ok2 = (x) => x && !x.hid && !x.gone; const L = [], Q = [], B = [];
    a.forEach((d) => { const r = d.data(); if (ok2(r)) L.push(r); }); b.forEach((d) => { const x = d.data(); if (ok2(x)) Q.push(x); }); l.forEach((d) => { const x = d.data(); if (ok2(x) && x.pub) B.push({ lid: x.lid, nm: x.nm, ds: x.ds, n: (x.items || []).length, im: (x.items || []).slice(0, 4).map((y) => y.im).filter(Boolean), up: x.up }); });
    const rdN = { want: 0, ing: 0, done: 0 }; rdList(u).forEach((r) => { if (rdN[r.s] != null) rdN[r.s]++; });
    const v = OK({ u: { uid: t, nick: u.nick, bio: u.bio || '', at: String(u.at || '').slice(0, 10), folN: u.folN || 0, folC: (u.fol || []).length, test: u.test ? 1 : 0, rdN, goal: goalOf(u), st: rvStats(L) }, L: rvSort(L, 'new').slice(0, 30).map((r) => rvPub(r)), Q: Q.sort((p, q2) => String(q2.at).localeCompare(String(p.at))).slice(0, 20).map((x) => qPub(x)), B });
    PFC.set(t, { at: Date.now(), v }); if (PFC.size > 1000) PFC.clear(); return v; }
  async function blGet(q) { const lid = String(q.l || ''); if (!/^l_[0-9a-f]{16}$/.test(lid)) return E(400, '목록 번호가 이상함'); const d = await C('shop_lists').doc(lid).get(); const v = d.exists ? d.data() : null; if (!v || v.hid || v.gone || !v.pub) return E(404, '없거나 비공개인 목록입니다');
    await ready(); const V = await vw(); const H0 = await held(); const X = await soldX(); return OK({ l: { lid, uid: v.uid, nick: v.nick, nm: v.nm, ds: v.ds, up: v.up, items: (v.items || []).map((y) => { const x = y.id ? V.get(y.id) : null; const live = x && !X.has(x.id); return { ...y, live: live ? (H0.has(x.id) ? 'o' : 's') : null, p: live ? x.p : null, g: live ? x.g : null }; }) } }); }
  /* ── 사진: 손님 기기에서 1080px 안으로 줄여 보냄 · 클라우드는 첫 바이트로 꼴만 확인(JPEG·PNG·WebP) · 저장소 shop_rv/ */
  const magic = (b) => (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff ? ['jpg', 'image/jpeg'] : b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 ? ['png', 'image/png'] : b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP' ? ['webp', 'image/webp'] : null);
  const rawBody = (req, max) => new Promise((ok, no) => { const ch = []; let n = 0; req.on('data', (c) => { n += c.length; if (n > max) { no(Object.assign(new Error('너무 큼'), { code: 413 })); req.destroy(); } else ch.push(c); }); req.on('end', () => ok(Buffer.concat(ch))); req.on('error', no); });
  async function photo(req) { const A = await authOf(req); if (!A) return E(401, '로그인이 필요합니다', { login: 1 }); if (!bucket) return E(503, '사진 저장소가 아직 없습니다'); if (limitWait('aph' + A.uid, 30, 864e5)) return E(429, '사진은 하루 30장까지');
    let buf; try { buf = await rawBody(req, 1.5e6); } catch (e) { return E(413, '사진이 너무 큽니다(1.5MB까지)'); } const m = buf.length > 16 ? magic(buf) : null; if (!m) return E(400, 'JPEG·PNG·WebP 사진만');
    const n = `rv/${A.uid}/${rnd(8)}.${m[0]}`; await bucket().file('shop_' + n).save(buf, { resumable: false, contentType: m[1], metadata: { cacheControl: 'public, max-age=31536000' } }); return OK({ n }); }
  async function img(res, q) { const n = String(q.n || ''); if (!PH_RE.test(n) || !bucket) { res.writeHead(404); res.end(); return true; } let c = IMC.get(n);
    if (!c) { try { const [b] = await bucket().file('shop_' + n).download(); c = { b, ty: magic(b) ? magic(b)[1] : 'application/octet-stream' }; IMC.set(n, c); if (IMC.size > 40) IMC.delete(IMC.keys().next().value); } catch (e) { res.writeHead(404, { 'Cache-Control': 'no-store' }); res.end(); return true; } }
    res.writeHead(200, { 'Content-Type': c.ty, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Robots-Tag': 'noindex', 'Cross-Origin-Resource-Policy': 'cross-origin' }); res.end(c.b); return true; }
  async function handle(req, res, path, q, send, readBody) {
    if (path === '/shop/a' && req.method === 'POST') { const b = await readBody(req); const [c, o] = await op(req, b); return send(c, o); }
    if (path === '/shop/a/photo' && req.method === 'POST') { const [c, o] = await photo(req); return send(c, o); }
    if (path === '/shop/rv') { const [c, o] = await rvGet(q); return send(c, o, c === 200 ? 'public, max-age=20, s-maxage=20' : null); }
    if (path === '/shop/rvnew') { const [c, o] = await rvNew(); return send(c, o, 'public, max-age=60, s-maxage=60'); }
    if (path === '/shop/pf') { const [c, o] = await pfGet(q); return send(c, o, c === 200 ? 'public, max-age=30, s-maxage=30' : null); }
    if (path === '/shop/bl') { const [c, o] = await blGet(q); return send(c, o, c === 200 ? 'public, max-age=30, s-maxage=30' : null); }
    if (path === '/shop/rvimg') return img(res, q);
    return false; }
  /* 주문이 계정과 이어짐(주문 접수 성공 뒤) — 마이페이지 주문 내역·구매 인증 */
  async function addOrder(uid, rec) { const u = await uGet(uid, true); if (!u) return; await uSet(uid, { ords: [{ no: rec.no, t: rec.t, at: rec.at, total: rec.total, n: rec.n }, ...(u.ords || []).filter((x) => x && x.no !== rec.no)].slice(0, 200) }); }
  /* ── 운영자(관리 웹앱 · 클라우드 로그인 허용 계정) — 지우기 없음(보관·숨김만) */
  async function admin(b, who) { b = b || {}; const o = String(b.op || ''); const by = s(who && who.email, 80) || 'admin';
    if (o === 'mkTest') { const n = Math.max(1, Math.min(10, Math.round(+b.n || 3))); const tag = rnd(2); const out = []; for (let i = 1; i <= n; i++) { const T = mkTestOne(i, tag); const r = await join({ em: T.em, pw: T.pw, nick: T.nick }, { headers: {} }, true, by); if (r[0] === 200) out.push({ uid: r[1].me.uid, em: T.em, nick: T.nick, pw: T.pw }); }
      log && log(`👤 우리숍 시험 계정 ${out.length}개 만듦(${by})`); return { L: out }; }
    if (o === 'users') { const ss = await C('shop_users').where('test', '==', b.real ? 0 : 1).get(); const L = []; ss.forEach((d) => { const u = d.data(); if (u && !u.gone) L.push({ uid: u.uid, em: u.em, nick: u.nick, at: u.at, last: u.last, arch: u.arch ? 1 : 0, test: u.test ? 1 : 0, rvN: u.rvN || 0, ordN: (u.ords || []).length }); }); return { L: L.sort((p, q2) => String(q2.at).localeCompare(String(p.at))).slice(0, 300) }; }
    if (o === 'arch') { const u = await uGet(String(b.uid || ''), true); if (!qaAcct(u)) return { err: '시험 계정·점검 계정(.invalid 메일)만 보관할 수 있습니다' }; await uSet(u.uid, { arch: b.on ? 1 : 0, ...(b.on ? { sess: [] } : {}), archBy: by }); return { ok: 1 }; }
    if (o === 'pwReset') { const u = await uGet(String(b.uid || ''), true); if (!u || !u.test) return { err: '시험 계정만 비밀번호를 다시 정합니다' }; const pw = 'Bq' + rnd(4) + '7'; await uSet(u.uid, { pw: pwHash(pw), sess: [] }); return { pw }; }
    if (o === 'rvList') { const days = Math.max(1, Math.min(365, +b.days || 30)); const since = new Date(Date.now() - days * 864e5).toISOString(); const [a, c2] = await Promise.all([C('shop_reviews').where('at', '>', since).get(), C('shop_quotes').where('at', '>', since).get()]); const L = [], Q = [];
      a.forEach((d) => { const r = d.data(); if (r && !r.gone) L.push({ rid: r.rid, k: r.k, t: r.t, nick: r.nick, uid: r.uid, reply: r.reply && r.reply.tx ? r.reply.tx : null, st: r.st, s100: r.s100, body: r.body ? String(r.body).slice(0, 300) : null, ph: (r.ph || []).length, buy: r.buy || 0, test: r.test || 0, hid: r.hid || 0, rep: r.rep || 0, repWhy: r.repWhy || [], lk: r.lk || 0, at: r.at }); });
      c2.forEach((d) => { const x = d.data(); if (x && !x.gone) Q.push({ qid: x.qid, t: x.t, nick: x.nick, tx: x.tx, test: x.test || 0, hid: x.hid || 0, at: x.at }); });
      return { L: L.sort((p, q2) => (q2.rep || 0) - (p.rep || 0) || String(q2.at).localeCompare(String(p.at))).slice(0, 300), Q: Q.sort((p, q2) => String(q2.at).localeCompare(String(p.at))).slice(0, 100) }; }
    if (o === 'find') { const q = s(b.q, 40).toLowerCase(); if ([...q].length < 2) return { err: '두 글자 넘게' }; const ss = await C('shop_users').get(); const L = []; ss.forEach((d) => { const u = d.data(); if (!u || u.gone || !qaAcct(u)) return; if (String(u.nick || '').toLowerCase().includes(q) || String(u.em || '').toLowerCase().includes(q)) L.push({ uid: u.uid, em: u.em, nick: u.nick, at: u.at, arch: u.arch ? 1 : 0, test: u.test ? 1 : 0, rvN: u.rvN || 0 }); }); return { L: L.slice(0, 50) }; } /* 시험·점검 계정만 찾음(진짜 손님 메일은 안 줌) */
    if (o === 'rvReply') { const id = String(b.id || ''); if (!/^r_[0-9a-f]{20}$/.test(id)) return { err: '번호가 이상함' }; const tx = sLong(b.tx, 1000); if ([...tx].length > 500) return { err: '답글은 500자까지' }; const d = await C('shop_reviews').doc(id).get(); if (!d.exists) return { err: '없음' };
      await d.ref.set({ reply: tx ? { tx, at: nowIso(), by } : null }, { merge: true }); RVC.delete(d.data().k); PFC.delete(d.data().uid); return { ok: 1 }; } /* 🏪 가게 답글(교보·쿠팡 판매자 답글) — 비우면 내림 */
    if (o === 'rvHide' || o === 'qHide') { const cn = o === 'rvHide' ? 'shop_reviews' : 'shop_quotes'; const id = String(b.id || ''); if (!/^[rq]_[0-9a-f]{16,20}$/.test(id)) return { err: '번호가 이상함' }; const d = await C(cn).doc(id).get(); if (!d.exists) return { err: '없음' };
      await d.ref.set({ hid: b.on ? 'adm' : 0, hidBy: by, hidAt: nowIso() }, { merge: true }); RVC.delete(d.data().k); NEW.at = 0; PFC.delete(d.data().uid); return { ok: 1 }; }
    return { err: '없는 일' }; }
  /* /b/ 검색용 화면 — 공개 리뷰 평균·수·대표 3개(구글 별점 표시 · 리뷰가 실제로 화면에 있을 때만) */
  async function seoRv(it) { const k = kOf(it); if (!k) return null; try { const R = await rvFor(k); const L = R.L.filter(rvShown); if (!L.length) return null; const S0 = rvStats(L); return { avg: S0.avg, n: S0.n, top: rvSort(L).slice(0, 3).map((r) => ({ nick: r.nick, st: r.st, s100: r.s100, at: r.at })) }; } catch (e) { return null; } }
  rsLoad();
  return { handle, authOf, addOrder, admin, op, ratingOf, seoRv, rsLoad };
}
module.exports = { rvSummary, qaAcct, pwHash, pwOk, pwWhy, nickWhy, nickNorm, nickKey, emKey, kOf, K_RE, rvCheck, rvStats, rvShown, rvSort, rvPub, qCheck, RD, goalOf, alertState, mkTestOne, PH_RE, bookMini, makeAcct };

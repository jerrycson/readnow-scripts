/* 📚 (11/12 shelf5) 우리숍 서가 — 책등 그림이 없는 책에 알라딘 '책등 규칙 주소'를 클라우드가 물어 채움
 *  까닭(배포 뒤 조사 spineprobe=40): 도서 49,240권 중 책등 그림 22,805권뿐 · 나머지는 책등 그림 대신 지어낸 책등으로 보임
 *   · 그 조사가 '알라딘 표지 주소 0'으로 나온 것은 조사 코드가 표지 칸을 글로 여겼기 때문(실제 칸은 { src: 알라딘 주소, stored: 우리 저장소 길 } 묶음) — 이 파일이 src를 읽음
 *  규칙: 앞표지 원래 주소 https://image.aladin.co.kr/product/<A>/<B>/cover…/<K>_<n>.jpg → 책등 https://image.aladin.co.kr/product/<A>/<B>/spineflip/<K>_d.jpg
 *  하는 일(약속 0 — 클라우드가 공개 그림만 · 로그인·쿠키·손님 정보 없음 · 로거 PC와 상관없음):
 *   ① 판매중 책 중 책등 없는 책을 '새로 들어온 책 먼저' 차례로 회차마다 최대 N권(기본 40 · 10분마다 · 한 번 묻고 0.4초 쉼) HEAD로 물음
 *   ② 있으면(200 · 그림 · 500바이트 넘음) 도서 정보 prd_books/<도서>.images.spine = { src: 규칙 주소, stored: null, by: 'cloud-rule' } · imgStatus 'pending'
 *      → 수집기의 '이미지 가져오기'(앞·뒤표지와 같은 길)가 우리 저장소 img/<도서>/spine.* 로 받아 둠 → 그 뒤 서가가 우리 저장소 그림을 씀(알라딘 주소를 손님 화면에 바로 쓰지 않음)
 *   ③ 없으면(404) shop_spinetry/b00~b31 {m:{도서: 'YYMMDD.상태'}}에 적어 120일 동안 다시 묻지 않음 · 403·429·5xx·연결 실패는 그 회차를 멈추고 1시간 쉼
 *  이미 책등 칸이 있는 책(수집기가 알라딘 화면 .c_left에서 모은 것)은 건드리지 않음 · 앞으로 모으는 책도 같음(수집기는 화면에 책등이 있으면 그대로 모음 — 없으면 이 일이 뒤에 채움) */
'use strict';
const N_BUCKET = 32;
const bucketOf = (k) => { let h = 2166136261 >>> 0; const t = String(k); for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return 'b' + String(h % N_BUCKET).padStart(2, '0'); };
const RULE_RE = /^(?:https?:)?\/\/image\.aladin\.co\.kr\/product\/(\d{1,7})\/(\d{1,3})\/cover[a-z0-9]*\/([A-Za-z0-9]{6,20})_\d{1,2}\.(?:jpe?g|gif|png)(?:\?.*)?$/i;
/* 앞표지 원래 주소 → 책등 규칙 주소(아니면 null) */
const ruleOf = (src) => { const m = RULE_RE.exec(String(src || '').trim()); return m ? `https://image.aladin.co.kr/product/${m[1]}/${m[2]}/spineflip/${m[3]}_d.jpg` : null; };
/* 도서 정보의 그림 칸(글 또는 { src, stored }) → 원래 주소 */
const srcOf = (im) => (!im ? null : typeof im === 'string' ? im : typeof im.src === 'string' ? im.src : null);
const hasSpine = (b) => !!(b && b.images && b.images.spine && (srcOf(b.images.spine) || b.images.spine.stored));
const ymd = (t) => new Date(t + 9 * 3600e3).toISOString().slice(2, 10).replace(/-/g, '');
const ageDays = (code, now) => { const m = /^(\d{2})(\d{2})(\d{2})\./.exec(String(code || '')); if (!m) return 1e9; return (now - Date.parse(`20${m[1]}-${m[2]}-${m[3]}T00:00:00+09:00`)) / 864e5; };
const RETRY_DAYS = 120;
/* 물을 차례 — cand = [{ id(도서), at(들어온 때) }] 중 책등 없고 규칙 주소가 서고 최근에 묻지 않은 것 · 새 책 먼저 · 같은 도서 한 번 */
function pick(cand, books, tried, n, now) { const out = []; const seen = new Set(); const L = (cand || []).slice().sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
  for (const c of L) { const id = c && c.id && String(c.id); if (!id || seen.has(id)) continue; seen.add(id); const b = books.get(id); if (!b || hasSpine(b)) continue;
    const u = ruleOf(srcOf(b.images && b.images.front) || srcOf(b.cover)); if (!u) continue; const t = tried.get(id); if (t && ageDays(t, now) < RETRY_DAYS) continue; out.push({ id, u }); if (out.length >= n) break; }
  return out; }

/* 클라우드 일 — makeShop이 부름 · deps: { C(컬렉션), FV(FieldValue), log, fetch(시험용 바꿈) } */
function makeSpine({ C, FV, log, fetch: F }) {
  const fx = F || ((u, o) => fetch(u, o));
  const ST = { tried: new Map(), at: 0, busy: null, dirty: new Map(), runAt: 0, pauseUntil: 0, asked: 0, found: 0, miss: 0, err: 0, lastErr: null, wait: new Set(), last: [] };
  const load = async () => { if (ST.at && Date.now() - ST.at < 6 * 3600e3) return; try { const ss = await C('shop_spinetry').get(); ss.forEach((d) => { const m = (d.data() || {}).m || {}; for (const k in m) if (typeof m[k] === 'string') ST.tried.set(k, m[k]); }); ST.at = Date.now(); } catch (e) { log && log('📚 책등 묻기 기록 읽기 실패', e.message); } };
  const flush = async () => { const by = new Map(); for (const [k, v] of ST.dirty) { const b = bucketOf(k); if (!by.has(b)) by.set(b, {}); by.get(b)[k] = v; } ST.dirty.clear();
    for (const [b, m] of by) { try { await C('shop_spinetry').doc(b).set({ m, at: new Date().toISOString(), writer: 'cloud-shop' }, { merge: true }); } catch (e) { log && log('📚 책등 묻기 기록 쓰기 실패', b, e.message); } } };
  /* 회차: cand(판매중 책의 도서 번호·들어온 때) · books(도서 번호 → 도서 정보 요약) · o = { n, gapMs } */
  async function tick(cand, books, o) { o = o || {}; if (ST.busy) return ST.busy; if (Date.now() < ST.pauseUntil) return 0;
    ST.busy = (async () => { await load(); const now = Date.now(); const L = pick(cand, books, ST.tried, Math.max(1, Math.min(200, o.n || 40)), now); let hit = 0; const gap = o.gapMs == null ? 400 : o.gapMs;
      for (const { id, u } of L) { let st = 0, ty = '', len = 0; try { const r = await fx(u, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(6000) }); st = r.status; ty = String((r.headers && r.headers.get && r.headers.get('content-type')) || ''); len = +((r.headers && r.headers.get && r.headers.get('content-length')) || 0); } catch (e) { st = -1; ST.lastErr = String(e.message || e).slice(0, 120); }
        ST.asked++; ST.last.unshift([id, st]); ST.last.length = Math.min(ST.last.length, 12);
        if (st === 200 && /^image\//i.test(ty) && !(len && len < 500)) { try { await C('prd_books').doc(id).set({ images: { spine: { src: u, stored: null, by: 'cloud-rule', foundAt: new Date().toISOString() } }, imgStatus: 'pending', ...(FV ? { uploadedAt: FV.serverTimestamp() } : {}), writer: 'cloud-shop' }, { merge: true }); ST.found++; hit++; ST.wait.add(id); ST.dirty.set(id, ymd(now) + '.200'); } catch (e) { ST.err++; ST.lastErr = '쓰기 ' + String(e.message || e).slice(0, 100); } }
        else if (st === 404 || st === 410 || (st === 200 && !/^image\//i.test(ty)) || (st >= 300 && st < 400)) { ST.miss++; ST.dirty.set(id, ymd(now) + '.' + st); ST.tried.set(id, ymd(now) + '.' + st); }
        else { ST.err++; ST.pauseUntil = Date.now() + 3600e3; ST.lastErr = ST.lastErr || 'HTTP ' + st; break; } /* 403·429·5xx·연결 실패 — 알라딘을 괴롭히지 않게 1시간 쉼 */
        if (ST.dirty.has(id) && ST.tried.get(id) !== ST.dirty.get(id)) ST.tried.set(id, ST.dirty.get(id));
        if (gap) await new Promise((r) => setTimeout(r, gap)); }
      if (ST.dirty.size) await flush(); ST.runAt = Date.now(); return hit; })().finally(() => { ST.busy = null; }); return ST.busy; }
  return { tick, load, wait: ST.wait, state: () => ({ tried: ST.tried.size, asked: ST.asked, found: ST.found, miss: ST.miss, err: ST.err, runAt: ST.runAt, pauseUntil: ST.pauseUntil || null, lastErr: ST.lastErr, waitStore: ST.wait.size, last: ST.last.slice(0, 8) }) };
}
module.exports = { ruleOf, srcOf, hasSpine, pick, makeSpine, bucketOf, ageDays, RETRY_DAYS };

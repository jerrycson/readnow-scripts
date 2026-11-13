'use strict';
/* (priv2 11/13) 🌐 웹앱 출처 세기 — 저장소 비공개·GitHub Pages 끄기 전 '옛 주소(jerrycson.github.io)로 웹앱을 쓰는 기기 0'을 진단으로 셈
 *  클라우드가 받는 요청의 Origin 머리(웹앱 출처)와 기기 종류(User-Agent에서 윈도우·안드로이드·맥·아이폰 · 크롬 판)만 셈 — 주소·몸통·열쇠·사람 정보는 안 봄
 *  한국 날짜마다 {출처 → {n, first, last, kinds{종류: n}, paths{앞 경로: n}}} · 10분마다 한 번만 Firestore app_settings/web_origin 에 합쳐 씀(쓰기 하루 ~144번) · 14일치만 둠
 *  진단: doc=app_settings/web_origin (또는 webOrigin=1 — 아직 안 쓴 것까지) */
const KEEP_DAYS = 14;
const kstDay = (ms) => new Date(+ms + 9 * 3600e3).toISOString().slice(0, 10);
function uaKind(ua) {
  const s = String(ua || '');
  const os = /Android/i.test(s) ? 'android' : /iPhone|iPad|iPod/i.test(s) ? 'ios' : /Windows/i.test(s) ? 'win' : /Mac OS X|Macintosh/i.test(s) ? 'mac' : /Linux/i.test(s) ? 'linux' : 'etc';
  const app = /\bwv\b|; wv\)/.test(s) ? 'webview' : /Edg\//.test(s) ? 'edge' : /Chrome\/(\d+)/.test(s) ? 'chrome' + (s.match(/Chrome\/(\d+)/) || [])[1] : /Safari\//.test(s) ? 'safari' : 'etc';
  return os + '·' + app;
}
function make(dep) {
  const { C, now = () => Date.now(), flushMs = 10 * 60e3 } = dep;
  let P = {}; let lastFlush = now(); let busy = false; let err = null;
  function seen(req) {
    try {
      const o = String((req.headers && req.headers.origin) || '');
      if (!/^https:\/\/(jerrycson\.github\.io|readnow\.kr|www\.readnow\.kr|readnow-3a385\.(web|firebaseapp)\.(app|com))$/.test(o)) return;
      const t = now(); const d = kstDay(t); const p0 = '/' + String(req.url || '/').split('?')[0].split('/').filter(Boolean).slice(0, 1).join('/');
      const day = (P[d] = P[d] || {}); const r = (day[o] = day[o] || { n: 0, first: new Date(t).toISOString(), last: null, kinds: {}, paths: {} });
      r.n++; r.last = new Date(t).toISOString(); const k = uaKind(req.headers['user-agent']); r.kinds[k] = (r.kinds[k] || 0) + 1;
      if (Object.keys(r.paths).length < 30 || r.paths[p0]) r.paths[p0] = (r.paths[p0] || 0) + 1;
      if (t - lastFlush > flushMs) flush().catch(() => {});
    } catch (e) {}
  }
  async function flush() {
    if (busy || !Object.keys(P).length) return { ok: true, n: 0 };
    busy = true; const add = P; P = {}; lastFlush = now();
    try {
      const ref = C('app_settings').doc('web_origin'); const cur = ((await ref.get()).data() || {}).days || {};
      for (const [d, byO] of Object.entries(add)) { const D = (cur[d] = cur[d] || {});
        for (const [o, r] of Object.entries(byO)) { const x = D[o];
          if (!x) { D[o] = r; continue; }
          x.n = (x.n || 0) + r.n; if (!x.first || r.first < x.first) x.first = r.first; if (!x.last || r.last > x.last) x.last = r.last;
          for (const [k, v] of Object.entries(r.kinds)) x.kinds = { ...(x.kinds || {}), [k]: ((x.kinds || {})[k] || 0) + v };
          for (const [k, v] of Object.entries(r.paths)) if (Object.keys(x.paths || {}).length < 30 || (x.paths || {})[k]) x.paths = { ...(x.paths || {}), [k]: ((x.paths || {})[k] || 0) + v };
        } }
      const keep = Object.keys(cur).sort().slice(-KEEP_DAYS); const days = {}; for (const d of keep) days[d] = cur[d];
      const old = (o) => keep.reduce((a, d) => a + (((days[d] || {})[o] || {}).n || 0), 0);
      const lastOld = keep.slice().reverse().find((d) => ((days[d] || {})['https://jerrycson.github.io'] || {}).n) || null;
      await ref.set({ days, at: new Date(now()).toISOString(), sum: { oldN: old('https://jerrycson.github.io'), newN: old('https://readnow.kr'), lastOldDay: lastOld, keepDays: KEEP_DAYS }, note: '옛 주소(jerrycson.github.io) 요청이 며칠 0이면 그 주소로 웹앱을 쓰는 기기가 없음(priv2 11/13)' });
      err = null; return { ok: true, days: keep.length };
    } catch (e) { err = String(e && e.message || e).slice(0, 200); for (const [d, byO] of Object.entries(add)) { P[d] = P[d] || {}; for (const [o, r] of Object.entries(byO)) if (!P[d][o]) P[d][o] = r; } return { ok: false, err }; } finally { busy = false; }
  }
  return { seen, flush, peek: () => ({ pending: P, lastFlush: new Date(lastFlush).toISOString(), err }) };
}
module.exports = { make, uaKind, kstDay, KEEP_DAYS };

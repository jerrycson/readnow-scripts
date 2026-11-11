// tKEYCHK1110 — (정범님 11/10 '아이디/비번·열쇠를 넣는 모든 곳은 저장을 누르면 먼저 맞는지 확인 → 맞으면 저장, 틀리면 다시 넣어 주세요와 까닭')
//  ⚙ 설정 › 🌦 기상청 날씨(인증키 받는 법 · 확인하고 저장) · ⑱ 🌐 외부 정보 [키 저장](클라우드 /key-check) · 🔐 › 📦 보관 열쇠(GitHub에 한 번 물어 봄)
//  쓰는 법: RN_PORT=<포트> node tKEYCHK1110.js (harness.js·seed.js 옆) · 브라우저 alert/confirm/prompt가 뜨면 실패
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
(async () => {
  await require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
    await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    await p.route(/api\.github\.com\/repos\//, (r) => { const a = r.request().headers().authorization || ''; r.fulfill({ status: /GOOD/.test(a) ? 200 : /NOREPO/.test(a) ? 404 : 401, contentType: 'application/json', body: '{}' }); });
    const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; localStorage.setItem('rn-device', 'TEST-PC'); S.devOk = true; S.app.adminDevices = [deviceName() || 'TEST-PC']; await db.collection('app_settings').doc('main').set({ adminDevices: [deviceName() || 'TEST-PC'] }, { merge: true }); await W(400);
      const calls = []; let wxMode = 'bad', kMode = {}; window.pptCloudUrl = () => 'http://cloud.test';
      window.cloudCall = async (path, body) => { calls.push({ path, k: body.k, has: !!(body.key || body.v) });
        if (path === '/wx-key') { if (wxMode === 'bad') return { ok: false, bad: true, why: '인증키가 맞지 않거나, 이 API(지상관측 › 종관기상관측(ASOS) › 일자료 기간 조회)를 아직 활용신청하지 않았음' }; if (wxMode === 'net') throw new Error('Failed to fetch'); await db.collection('app_settings').doc('wx_run').set({ key: { at: new Date().toISOString(), by: 't', tail: 'ab12' } }, { merge: true }); return { ok: true, sample: { d: '2026-11-02', nm: '서울', ta: 12.3, rn: 0.5 } }; }
        if (path === '/key-check') { const m = kMode[body.k] || 'ok'; return m === 'ok' ? { ok: true } : m === 'bad' ? { ok: false, bad: true, why: '키가 맞지 않음 (HTTP 401)' } : { ok: false, unsure: true, why: '응답 없음(30초) — 확인 못 함' }; } return { ok: false }; };
      uxTabGo('settings'); let d = null; for (let i = 0; i < 40 && !(d = document.querySelector('details[data-sec="set_wx"]')); i++) await W(150); o.sec = !!d; if (!d) return o; await W(1500); d = document.querySelector('details[data-sec="set_wx"]'); d.open = true; d.dispatchEvent(new Event('toggle')); await W(900);
      const adm = () => { S.devOk = true; S.app.adminDevices = [deviceName() || 'TEST-PC']; if (S.ext.keys) extRedraw(); }; adm(); WXW.run = undefined; wxRedraw(); await W(600); const box = document.getElementById('wx_box'); o.guide = box ? box.textContent : 'NOBOX';
      const put = async (v) => { const i = document.getElementById('wx_key'); i.value = v; document.getElementById('wx_save').click(); await W(500); return (document.getElementById('wx_msg') || {}).textContent || ''; };
      o.dbg = { adm: isAdminDevice(), len: box && box.innerHTML.length, vis: box && box.getClientRects().length }; o.m1 = await put('WRONGKEY123456'); o.dbg.toast = document.getElementById('toast').textContent; o.left1 = document.getElementById('wx_key').value; wxMode = 'net'; o.m2 = await put('SOMEKEY1234567'); wxMode = 'ok'; o.m3 = await put('GOODKEY_ab12'); await W(800); o.after = document.getElementById('wx_box').textContent;
      o.wxCalls = calls.filter((c) => c.path === '/wx-key').length;
      o.feat = featIndex().some((x) => /기상청 날씨/.test(x.t) && x.go && (x.go.sec === 'set_wx' || /set_wx/.test(x.go.sel || '')));
      /* ⑱ 외부 정보 키 */ const e2 = document.querySelector('details[data-sec="set_ext"]'); e2.open = true; e2.dispatchEvent(new Event('toggle')); await W(1200); adm(); S.ext.keys = { keys: {} }; S.ext.keysErr = null; extRedraw(); await W(300);
      const setK = (k, v) => { const i = document.querySelector(`[data-extkey="${k}"]`); if (i) i.value = v; return !!i; }; const save = async () => { document.getElementById('ext_keysave').click(); await W(700); return (document.getElementById('ext_kchk') || {}).textContent || ''; };
      const sec = async () => { const s = await db.collection('app_secrets').doc('ext').get(); return s.exists ? (s.data() || {}).keys || {} : {}; };
      kMode = { kakaoRest: 'bad', nlKey: 'ok' }; o.hasIn = setK('kakaoRest', 'BADKAKAO123') && setK('nlKey', 'GOODNL123'); o.e1 = await save(); o.dbg2 = { hasIn: o.hasIn, kchk: !!document.getElementById('ext_kchk'), toast: document.getElementById('toast').textContent, X: !!EXTF(), btn: document.getElementById('ext_keysave').disabled, adm: isAdminDevice(), dis: document.querySelector('[data-extkey="kakaoRest"]').disabled }; o.s1 = await sec(); o.kakaoLeft = document.querySelector('[data-extkey="kakaoRest"]').value;
      kMode = { d4lKey: 'unsure' }; document.querySelectorAll('[data-extkey]').forEach((i) => { i.value = ''; }); setK('d4lKey', 'LIBKEY99999'); o.e2 = await save(); o.s2 = await sec(); setK('d4lKey', 'LIBKEY99999'); o.e3 = await save(); o.s3 = await sec();
      kMode = { nlKey: 'ok' }; document.querySelectorAll('[data-extkey]').forEach((i) => { i.value = ''; }); setK('nlKey', 'GOODNL123'); o.e4 = await save(); o.s4 = await sec();
      o.kcCalls = calls.filter((c) => c.path === '/key-check').map((c) => c.k); o.ttbIn = !!document.querySelector('[data-extkey="aladinTtb"]'); o.ttbEnd = ((document.querySelector('[data-extkeyend="aladinTtb"]') || {}).textContent || ''); /* (ttb1 11/11) 알라딘 TTB 키 칸 대신 종료 안내 */
      /* 📦 보관 열쇠(GitHub) */ const v = document.querySelector('details[data-sec="set_vault"]'); v.open = true; v.dispatchEvent(new Event('toggle')); await W(900); adm(); S.arcKey = undefined; const ab = document.getElementById('arckey_box'); if (ab) ab.innerHTML = arcKeyBody(); await W(400); const gh = async (val) => { const i = document.getElementById('arckey_in'); if (!i) return 'no-input'; i.value = val; document.getElementById('arckey_save').click(); await W(600); return document.getElementById('toast').textContent; };
      const ghs = async () => { const s = await db.collection('app_secrets').doc('gh_archive').get(); return s.exists ? (s.data() || {}).token || null : null; };
      o.g1 = await gh('github_pat_WRONGWRONGWRONGWRONG1'); o.gs1 = await ghs(); o.g2 = await gh('github_pat_NOREPONOREPONOREPO12'); o.gs2 = await ghs(); o.g3 = await gh('github_pat_GOODGOODGOODGOODGOOD'); o.gs3 = await ghs();
      return o; });
    ok(R.sec, '⚙ 설정에 🌦 기상청 날씨 칸', R);
    ok(/아이디·비밀번호가 아니라/.test(R.guide) && /회원가입/.test(R.guide) && /지상관측/.test(R.guide) && /종관기상관측\(ASOS\)/.test(R.guide) && /일자료/.test(R.guide) && /API 활용신청/.test(R.guide) && /마이페이지/.test(R.guide) && /확인하고 저장/.test(R.guide), '받는 법 안내 = 회원가입 → 지상관측 › 종관기상관측(ASOS) › 일자료 → API 활용신청 → 마이페이지 인증키 · 「아이디·비밀번호가 아니라 인증키」', R.guide.slice(0, 600));
    ok(/저장하지 않았습니다 — 다시 넣어 주세요/.test(R.m1) && /활용신청/.test(R.m1) && R.left1 === '', '틀린 인증키 = 「저장하지 않았습니다 — 다시 넣어 주세요 · 까닭」 · 칸 비움', R.m1);
    ok(/저장하지 않았습니다/.test(R.m2) && /클라우드에 닿지 못함/.test(R.m2), '클라우드가 안 닿음 = 저장 안 함 · 까닭', R.m2);
    ok(/맞는 인증키 — 저장했습니다/.test(R.m3) && /서울/.test(R.m3) && R.wxCalls === 3, '맞는 인증키 = 「✓ 맞는 인증키 — 저장했습니다(시험: 서울 …)」', R.m3);
    ok(/인증키 저장됨 ••••ab12/.test(R.after) && /서울/.test(R.after) && /수원/.test(R.after) && /인천/.test(R.after), '저장 뒤 상태 = 끝 4자리만 · 지점 표(서울·수원·인천)', R.after.slice(0, 400));
    ok(R.feat, '🔍 기능 찾기에 「🌦 기상청 날씨」');
    ok(R.hasIn && /저장하지 않았습니다 — 다시 넣어 주세요/.test(R.e1) && /카카오/.test(R.e1) && !R.s1.kakaoRest && !R.s1.nlKey && R.kakaoLeft === '', '⑱ 키 하나라도 틀리면 아무것도 저장 안 함 · 틀린 키 이름·까닭 · 틀린 칸만 비움', { e1: R.e1, s1: R.s1 });
    ok(/확인 못 한 키/.test(R.e2) && /한 번 더/.test(R.e2) && !R.s2.d4lKey && R.s3.d4lKey === 'LIBKEY99999' && /확인 못 함\(그대로 저장\)/.test(R.e3), '⑱ 확인 못 함(서버가 안 닿음) = 첫 번째는 저장 안 하고 「한 번 더」 · 두 번째에 저장', { e2: R.e2, e3: R.e3 });
    ok(/국립중앙도서관 ISBN 서지 API 인증키 맞음/.test(R.e4) && R.s4.nlKey === 'GOODNL123', '⑱ 맞는 키 = 「… 맞음 — 저장」 후 저장', R.e4);
    ok(!R.ttbIn && /종료됨/.test(R.ttbEnd) && /OpenAPI 종료/.test(R.ttbEnd), '⑱ 알라딘 TTB 키 칸 없음 — 「알라딘 OpenAPI 종료(10/30)」 안내', R.ttbEnd);
    ok(R.kcCalls.includes('kakaoRest') && R.kcCalls.includes('nlKey') && R.kcCalls.includes('d4lKey'), '⑱ 새 값마다 클라우드 /key-check를 부름', R.kcCalls);
    ok(/저장하지 않았습니다 — 다시 넣어 주세요/.test(R.g1) && /401/.test(R.g1) && R.gs1 === null, '📦 보관 열쇠 — GitHub 401 = 저장 안 함 · 까닭', R.g1);
    ok(/readnow-chats를 볼 수 없음/.test(R.g2) && R.gs2 === null, '📦 보관 열쇠 — 저장소 권한 없음(404) = 저장 안 함 · 까닭', R.g2);
    ok(R.gs3 === 'github_pat_GOODGOODGOODGOODGOOD', '📦 보관 열쇠 — 맞으면 저장', R.g3);
    ok(dlg.length === 0, '브라우저 팝업(alert/confirm/prompt) 없음', dlg);
  });
  console.log(bad ? `❌ tKEYCHK1110 ${bad}개 실패` : '✓ tKEYCHK1110 모두 통과'); process.exit(bad ? 1 : 0); })();

/* readnow-pc-crm.js — 리드나우 수집기 1.41.0의 모듈 ① 고객·주문 — 전체·취소 주문, 반품, 문의, 구매평, 고객 점수, 대조
 * Tampermonkey의 '리드나우 수집기' 본체가 @require로 불러옴 (이 파일만 따로 설치하지 않음). 본체와 판이 같아야 함 — 다르면 관제판에 빨간 띠.
 * 원본 한 파일에서 기계로 나눈 것: 모듈을 차례로 이으면 원본 코드와 글자 하나까지 같음 (같은 코드 = 같은 기록). */
;(function (g) { g.ReadnowPcMods = Object.assign(g.ReadnowPcMods || {}, { crm: '1.41.0' }); })(typeof globalThis !== 'undefined' ? globalThis : this);
/* ═════════════ 고객·주문 (예전 고객 수집기) ═════════════ */


(async function () {
  'use strict';
  const APP_VER = (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || '1.41.0'; // (1.36.0) 판 번호는 맨 위 @version 한 곳 — 고객 쪽·상품 쪽이 같은 값
  const BASE = 'https://www.aladin.co.kr/scm/';
  const now = () => new Date().toISOString();
  const LOGIN_FLAG = 'rn-autologin-pending';

  /* ════════════════════════════════════════════════════════════
   * A. 로그인 페이지에서 동작하는 부분 (자동 재로그인)
   *    수집기가 로그인 풀림을 감지해 이 탭을 열었을 때만 동작한다.
   * ════════════════════════════════════════════════════════════ */
  const pwInput = [...document.querySelectorAll('input[type="password"]')].find((i) => i.offsetParent !== null || i.getClientRects().length);
  const flag = GM_getValue(LOGIN_FLAG, null);
  if (flag && Date.now() - flag.at < 3 * 60 * 1000) {
    if (pwInput) { await autoFillLogin(pwInput, flag); return; }
    if (flag.submittedAt) { GM_setValue(LOGIN_FLAG, { ...flag, result: 'maybe-ok', landedAt: Date.now(), landedUrl: location.href }); }
  }
  /* ════════════════════════════════════════════════════════════
   * C. 알라딘 화면의 고객 정보 (웹앱과 같은 내용)
   *    · 주문 상세 팝업: 고객 카드 전체
   *    · 판매관리·주문조회 목록: 주문번호 옆에 고객 표시(VIP·주의·블랙리스트·불만족·판매자 일치·재구매), 누르면 카드
   *    웹앱에 고객 기능이 추가되면 이 카드에도 함께 반영한다.
   * ════════════════════════════════════════════════════════════ */
  const RN_APP_URL = 'https://jerrycson.github.io/readnow-scripts/app/';
  const RN_FB_CONFIG = { apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385', storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15' };
  const CARD = (() => {
    const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const won = (n) => (n == null ? '-' : `${Math.round(n).toLocaleString('ko-KR')}원`);
    const d10 = (s) => (s ? String(s).slice(0, 10) : '-');
    const CFG0 = { vip: { minValue: 65, maxRisk: 25, minOrders: 3, excludeSellers: true }, caution: { minRisk: 35 } };
    let cfg = CFG0; let cfgAt = 0;
    const FBx = () => { const F = (typeof firebase !== 'undefined' && firebase) || window.firebase; if (F && !F.apps.length) F.initializeApp(RN_FB_CONFIG); return F; };
    const user = () => new Promise((r) => { const F = FBx(); if (!F) return r(null); if (F.auth().currentUser) return r(F.auth().currentUser); let un = null; un = F.auth().onAuthStateChanged((u) => { setTimeout(() => { if (typeof un === 'function') un(); }, 0); r(u); }); });
    async function loadCfg(db) { if (Date.now() - cfgAt < 5 * 60000) return cfg; try { const d = await db.collection('crm_system').doc('scoring').get(); const x = d.exists ? d.data() : {}; cfg = { vip: { ...CFG0.vip, ...(x.vip || {}) }, caution: { ...CFG0.caution, ...(x.caution || {}) } }; cfgAt = Date.now(); } catch (e) {} return cfg; }
    const strongSel = (c) => (c.sellerLinks || []).filter((x) => (x.level ? x.level === 'match' : x.strong !== false));
    function eff(c, k) {
      const m = (c.flags || {})[k];
      if (m && (m.on === true || m.on === false)) return { on: m.on, src: 'manual', reason: m.reason || '', by: m.byName || m.by || '' };
      const sc = c.scores;
      if (k === 'vip' && sc) { const v = cfg.vip; const on = sc.value >= v.minValue && sc.risk < v.maxRisk && (c.saleOrderCount || 0) >= v.minOrders && !(v.excludeSellers && strongSel(c).length); if (on) return { on, src: 'auto', reason: `가치 ${sc.value}점 · 주의 ${sc.risk}점` }; }
      if (k === 'caution' && sc && sc.risk >= cfg.caution.minRisk) { const top = (sc.riskParts || []).filter((x) => x.pts > 0).sort((a, b) => b.pts - a.pts).slice(0, 2).map((x) => `${x.label}: ${x.text}`); return { on: true, src: 'auto', reason: `주의 ${sc.risk}점 · ${top.join(' / ')}` }; }
      if (k === 'blacklist' && c.sheetFlags && c.sheetFlags.blacklist) return { on: true, src: 'sheet', reason: c.sheetFlags.blacklist.reason || '' };
      return { on: false };
    }
    // 여러 고객을 한 번에: 고객 문서 + 구매평 + 메모
    async function loadBundles(db, cids) {
      const out = new Map(); const ids = [...new Set(cids.filter(Boolean))]; if (!ids.length) return out;
      const FP = FBx().firestore.FieldPath.documentId();
      for (let i = 0; i < ids.length; i += 30) {
        const part = ids.slice(i, i + 30);
        const [cs, is, ns] = await Promise.all([db.collection('crm_customers').where(FP, 'in', part).get(), db.collection('crm_interactions').where('customerId', 'in', part).get(), db.collection('crm_notes').where('customerId', 'in', part).get()]);
        part.forEach((id) => out.set(id, { c: null, reviews: [], qna: [], notes: [] }));
        cs.forEach((d) => { out.get(d.id).c = { customerId: d.id, ...d.data() }; });
        is.forEach((d) => { const v = d.data(); const b = out.get(v.customerId); if (!b) return; if (v.type === 'review') b.reviews.push(v); else if (v.type === 'qna') b.qna.push(v); else b.notes.push({ ...v, sheet: true }); });
        ns.forEach((d) => { const v = d.data(); const b = out.get(v.customerId); if (b) b.notes.push(v); });
      }
      await attachSellerScores(db, out);
      return out;
    }
    // 연결된 판매자의 모범·우리 이득 (웹앱·판매자 툴팁과 같은 파일 readnow-sellers-core.js로 계산 → 세 곳 점수가 항상 같음)
    const RSx = () => (typeof ReadnowSellers !== 'undefined' && ReadnowSellers) || window.ReadnowSellers || globalThis.ReadnowSellers || null;
    const sellerCache = new Map(); let sThr = null;
    async function attachSellerScores(db, out) {
      const RS = RSx(); if (!RS) return;
      if (!sThr) { try { const d = await db.collection('app_settings').doc('main').get(); sThr = (d.exists && d.data().seller) || {}; } catch (e) { sThr = {}; } }
      const names = new Set(); out.forEach((b) => ((b && b.c && b.c.sellerLinks) || []).forEach((x) => x.name && names.add(x.name)));
      const need = [...names].filter((n) => !sellerCache.has(n));
      for (let i = 0; i < need.length; i += 30) {
        const part = need.slice(i, i + 30); part.forEach((n) => sellerCache.set(n, null));
        try { const ss = await db.collection('sellers').where('name', 'in', part).get(); ss.forEach((d) => { const v = { ...d.data(), _id: d.id }; const cur = sellerCache.get(v.name); if (!cur || (d.id.startsWith('sc_') && !String(cur._id).startsWith('sc_'))) sellerCache.set(v.name, v); }); } catch (e) {}
      }
      for (const n of names) {
        const s = sellerCache.get(n); if (!s || s._score) continue;
        let bought = 0; const L = (s.linkedCustomers || []).filter((l) => RS.linkLevel(l) === 'match').slice(0, 10);
        if (L.length) { try { const FP = FBx().firestore.FieldPath.documentId(); const cs = await db.collection('crm_customers').where(FP, 'in', L.map((l) => l.customerId)).get(); cs.forEach((d) => (bought += d.data().salesAmount || 0)); } catch (e) {} }
        s._score = RS.score(s, { bought, thresholds: sThr });
      }
      out.forEach((b) => { if (b) b.sellerScore = (name) => { const s = sellerCache.get(name); return s ? s._score : null; }; });
    }
    function sellerBadges(b, name) {
      const RS = RSx(); const x = b && b.sellerScore ? b.sellerScore(name) : null; if (!RS || !x) return '';
      const q = RS.quadrant(x);
      return ` <i class="rnsm ${x.mcls}" title="모범: 배울 만한가">${x.mcls === 'bad' ? '✕' : x.mcls === 'good' ? '★' : '☆'} ${RS.MODEL_TXT[x.mcls]}${x.model != null ? ' ' + x.model : ''}</i> <i class="rnsg ${x.gcls}" title="우리 이득: 우리 돈에 이득인가${q ? ' · ' + q : ''}">₩${x.gcls === 'good' ? '＋' : x.gcls === 'bad' ? '－' : '·'} ${(RS.GAIN_SHORT || RS.GAIN_TXT)[x.gcls]} ${x.gain}</i>${q ? `<span class="s" style="display:block;font-weight:normal">${esc(q)}</span>` : ''}`;
    }
    const tsMs = (t) => (t && t.toMillis ? t.toMillis() : typeof t === 'string' ? Date.parse(t) || 0 : t && t.seconds ? t.seconds * 1000 : 0);
    function reviewCounts(b) { const r = { good: 0, mid: 0, bad: 0 }; b.reviews.forEach((x) => { const k = { 만족: 'good', 보통: 'mid', 불만족: 'bad' }[String(x.rating || '').trim()]; if (k) r[k] += 1; }); return r; }
    function badges(b) {
      if (!b || !b.c) return '<span class="rnb rnb-none">기록 없음</span>';
      const c = b.c; const rc = reviewCounts(b); const out = [];
      if (eff(c, 'blacklist').on) out.push('<span class="rnb rnb-bl">블랙리스트</span>');
      if (eff(c, 'caution').on) out.push('<span class="rnb rnb-cau">주의</span>');
      if (eff(c, 'vip').on) out.push('<span class="rnb rnb-vip">VIP</span>');
      if (rc.bad) out.push(`<span class="rnb rnb-bl">불만족 ${rc.bad}</span>`);
      if (strongSel(c).length) out.push('<span class="rnb rnb-bl">판매자 정보 일치</span>');
      else if ((c.otherRecipientCount || 0) >= 3) out.push(`<span class="rnb rnb-cau">수령인 ${c.otherRecipientCount}명</span>`);
      out.push((c.saleOrderCount || 0) > 1 ? `<span class="rnb rnb-rep">재구매 ${c.saleOrderCount}회</span>` : '<span class="rnb rnb-new">첫 구매</span>');
      return out.join('');
    }
    function cardHtml(b, cid) {
      if (!b || !b.c) return `<b>리드나우 고객 정보</b><div class="s">처음 주문한 고객이거나 아직 수집 전입니다.</div><div class="act"><a href="${RN_APP_URL}#c=${encodeURIComponent(cid)}" target="_blank">웹앱에서 메모 남기기</a></div>`;
      const c = b.c; const rc = reviewCounts(b); const sc = c.scores;
      const fl = [['blacklist', '블랙리스트', 'bl'], ['caution', '주의고객', 'ag'], ['vip', 'VIP', 'vip']].map(([k, l, cls]) => { const e = eff(c, k); return e.on ? `<div class="ban ${cls}">${l} <span class="src">(${{ manual: '직접', auto: '자동', sheet: '구글 시트' }[e.src]}${e.by ? ' · ' + esc(e.by) : ''})</span>${e.reason ? ': ' + esc(e.reason.slice(0, 90)) : ''}</div>` : ''; }).join('');
      const sl = c.sellerLinks || []; const slm = strongSel(c); const sls = sl.filter((x) => !slm.includes(x));
      const notes = b.notes.slice().sort((a, x) => tsMs(x.createdAt) - tsMs(a.createdAt)).slice(0, 5);
      const lowRv = b.reviews.filter((x) => String(x.rating).trim() !== '만족').sort((a, x) => String(x.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 3);
      return `<b>${esc(c.displayName || '')}</b> <span class="s">${d10(c.firstOrderAt)} ~ ${d10(c.lastOrderAt)}</span>
        ${fl}
        ${slm.length ? `<div class="ban bl">판매자 정보 일치: ${slm.map((x) => esc(x.name) + (x.aladinGrade ? ` <i class="gr">${esc(x.aladinGrade)}</i>` : '') + (x.grade === 'fake' ? ' (허위 매물)' : '') + sellerBadges(b, x.name)).join(', ')}</div>` : ''}
        ${sls.length ? `<div class="ban ag">판매자 일치 의심: ${sls.map((x) => esc(x.name) + sellerBadges(b, x.name)).join(', ')}</div>` : ''}
        ${(c.otherRecipientCount || 0) >= 3 ? `<div class="ban ag">대행 의심: 다른 수령인 ${c.otherRecipientCount}명</div>` : ''}
        <div class="n"><div><b>${c.saleOrderCount || 0}</b><span>주문</span></div><div><b>${(c.saleItemQty || 0).toLocaleString()}</b><span>권</span></div><div><b>${(c.salesAmount || 0).toLocaleString()}</b><span>순매출</span></div><div><b>${(c.cancelOrderCount || 0) + (c.returnCount || 0)}</b><span>취소·반품</span></div><div><b>${c.reviewCount || 0}</b><span>구매확정</span></div></div>
        <div class="s">구매평 <i class="rv g">만족 ${rc.good}</i> <i class="rv m">보통 ${rc.mid}</i> <i class="rv b">불만족 ${rc.bad}</i> · 문의 ${c.qnaCount || b.qna.length || 0}건</div>
        ${sc ? `<div class="s">점수: 가치 <b style="color:#2F5D50">${sc.value}</b> · 주의 <b style="color:#A8661B">${sc.risk}</b> (${esc(sc.day || '')})</div>` : ''}
        <div class="s">배송비: 무료배송 ${c.freeShipCount || 0}회(우리 부담) · 고객 부담 ${c.paidShipCount || 0}회 ${won(c.shipPaidTotal || 0)}</div>
        ${lowRv.length ? `<ul>${lowRv.map((x) => `<li><i class="rv ${String(x.rating).trim() === '불만족' ? 'b' : 'm'}">${esc(x.rating)}</i> ${esc(d10(x.createdAt))} ${esc(x.title || '')}${x.body ? ` “${esc(String(x.body).slice(0, 60))}”` : ''}</li>`).join('')}</ul>` : ''}
        ${notes.length ? `<ul>${notes.map((n) => `<li>${n.type === 'flag' ? `[${{ vip: 'VIP', caution: '주의', blacklist: '블랙리스트' }[n.flag] || n.flag} ${n.on === true ? '지정' : n.on === false ? '해제' : '자동으로'}] ${esc(n.reason || '')}` : n.sheet ? `[시트] ${esc(n.body || '')}` : esc(n.body || '')} <span class="s">${esc(n.byName || '')}</span></li>`).join('')}</ul>` : ''}
        <div class="act"><textarea placeholder="메모 (모든 기기에 공유, 지울 수 없음)"></textarea>
          <div class="ab"><button data-rn="memo">메모 저장</button><button data-rn="vip">${eff(c, 'vip').on ? 'VIP 해제' : 'VIP'}</button><button data-rn="caution">${eff(c, 'caution').on ? '주의 해제' : '주의'}</button><button data-rn="blacklist">${eff(c, 'blacklist').on ? '블랙 해제' : '블랙리스트'}</button></div>
          <a href="${RN_APP_URL}#c=${encodeURIComponent(c.customerId)}" target="_blank">웹앱에서 전체 보기</a></div>`;
    }
    async function write(db, u, cid, kind, payload) {
      const F = FBx(); const TS = F.firestore.FieldValue.serverTimestamp(); const who = { by: u.email || '', byName: u.displayName || (u.email || '').split('@')[0] };
      const b = db.batch();
      if (kind === 'memo') b.set(db.collection('crm_notes').doc(), { customerId: cid, type: 'memo', body: payload.body, ...who, createdAt: TS, writerSchema: 6, via: 'aladin' });
      else {
        b.set(db.collection('crm_customers').doc(cid), { flags: { [kind]: { on: payload.on, ...who, at: TS, reason: payload.reason || null } }, uploadedAt: TS, writerSchema: 6 }, { merge: true });
        b.set(db.collection('crm_notes').doc(), { customerId: cid, type: 'flag', flag: kind, on: payload.on, reason: payload.reason || null, ...who, createdAt: TS, writerSchema: 6, via: 'aladin' });
      }
      await b.commit();
    }
    // 카드 상자에 동작 연결
    function bind(box, db, u, cid, b, reload) {
      box.querySelectorAll('[data-rn]').forEach((btn) => (btn.onclick = async () => {
        const k = btn.dataset.rn;
        try {
          if (k === 'memo') { const t = box.querySelector('textarea').value.trim(); if (!t) return; btn.disabled = true; await write(db, u, cid, 'memo', { body: t }); }
          else { const cur = b && b.c ? eff(b.c, k).on : false; const r = prompt(`${{ vip: 'VIP', caution: '주의고객', blacklist: '블랙리스트' }[k]} ${cur ? '해제' : '지정'} 사유 (기록으로 영구 보존됩니다)`); if (r === null) return; btn.disabled = true; await write(db, u, cid, k, { on: !cur, reason: r.trim() }); }
          await reload();
        } catch (e) { alert('저장 실패: ' + (e.code || e.message)); btn.disabled = false; }
      }));
    }
    const CSS = `.rncard{background:#fff;color:#1E2B28;border:1px solid #D6DDDA;border-top:4px solid #2F5D50;border-radius:8px;box-shadow:0 6px 20px rgba(30,43,40,.2);font:12px/1.5 "Malgun Gothic","Apple SD Gothic Neo",sans-serif;padding:8px 10px;width:290px;max-height:80vh;overflow:auto;text-align:left}
      .rncard b{font-size:13px} .rncard .x{float:right;border:0;background:none;cursor:pointer;color:#5B6B66;font-size:14px}
      .rncard .ban{margin:5px -10px 0;padding:5px 10px;font-weight:bold;font-size:11.5px} .rncard .bl{background:#FDECEA;color:#B0322A} .rncard .vip{background:#FBF3DC;color:#8A6D1D} .rncard .ag{background:#FFF4E5;color:#A8661B} .rncard .src{font-weight:normal;font-size:10.5px}
      .rncard .n{display:grid;grid-template-columns:repeat(5,1fr);text-align:center;margin:6px 0 2px} .rncard .n b{display:block;font-size:12.5px} .rncard .n span{font-size:10px;color:#5B6B66}
      .rncard ul{margin:5px 0 0;padding:0;list-style:none;max-height:130px;overflow:auto} .rncard li{border-top:1px dashed #D6DDDA;padding:3px 0;font-size:11.5px}
      .rncard .s{color:#5B6B66;font-size:11px;margin-top:2px} .rncard i.rv{font-style:normal;font-weight:bold;border-radius:4px;padding:0 4px} .rncard i.g{background:#E6EFEB;color:#2F5D50} .rncard i.m{background:#FFF1D6;color:#9A6200} .rncard i.b{background:#FDECEA;color:#B0322A}
      .rncard i.gr{font-style:normal;background:#3F7FD1;color:#fff;border-radius:4px;padding:0 4px;font-size:10.5px}
      .rncard i.rnsm{font-style:normal;font-size:10.5px;padding:0 5px;border:1.5px solid #4B4E9E;border-radius:3px;background:#fff;color:#4B4E9E;white-space:nowrap} .rncard i.rnsm.bad{background:#3A3A3A;border-color:#3A3A3A;color:#fff} .rncard i.rnsm.mid,.rncard i.rnsm.na{border-color:#B9BAD6;color:#6E7098}
      .rncard i.rnsg{font-style:normal;font-size:10.5px;padding:0 6px;border-radius:999px;background:#EEF1F3;color:#56636C;white-space:nowrap} .rncard i.rnsg.good{background:#2F7D4F;color:#fff} .rncard i.rnsg.bad{background:#B0322A;color:#fff}
      .rncard .act{margin-top:6px;border-top:1px solid #D6DDDA;padding-top:6px} .rncard textarea{width:100%;box-sizing:border-box;min-height:38px;border:1px solid #D6DDDA;border-radius:5px;font:inherit;padding:4px}
      .rncard .ab{display:flex;gap:4px;flex-wrap:wrap;margin:4px 0} .rncard .ab button{border:1px solid #2F5D50;background:#fff;color:#2F5D50;border-radius:5px;padding:3px 7px;font-size:11px;cursor:pointer} .rncard .ab button:first-child{background:#2F5D50;color:#fff}
      .rncard a{display:block;text-align:center;padding:4px;border:1px solid #2F5D50;border-radius:5px;color:#2F5D50;text-decoration:none;font-weight:bold}
      .rnb{display:inline-block;margin:0 0 0 3px;padding:0 5px;border-radius:4px;font:bold 11px "Malgun Gothic",sans-serif;cursor:pointer;vertical-align:middle;white-space:nowrap} .rnb-bl{background:#FDECEA;color:#B0322A} .rnb-cau{background:#FFF4E5;color:#A8661B} .rnb-vip{background:#FBF3DC;color:#8A6D1D} .rnb-rep{background:#E6EFEB;color:#2F5D50} .rnb-new{background:#EEF1F3;color:#56636C} .rnb-none{background:#F3F3F3;color:#999}
      .rnfloat{position:fixed;z-index:2147483646}`;
    function style() { if (document.getElementById('rn-card-css')) return; const st = document.createElement('style'); st.id = 'rn-card-css'; st.textContent = CSS; document.head.appendChild(st); }
    return { esc, FBx, user, loadCfg, loadBundles, badges, cardHtml, bind, style };
  })();

  // 주문번호 → 알라딘 고객번호: 이 PC에 모아 둔 주문 상세, 없으면 Firebase의 주문 기록
  async function customerIdsForOrders(db, onos) {
    const map = new Map(); const need = [];
    try {
      const idb = await new Promise((res) => { const r = indexedDB.open('readnow-crm'); r.onsuccess = () => res(r.result); r.onerror = () => res(null); });
      if (idb && idb.objectStoreNames.contains('popups')) {
        await Promise.all(onos.map((o) => new Promise((res) => { const q = idb.transaction('popups').objectStore('popups').get(o); q.onsuccess = () => { const p = q.result; if (p && p.customerKey) map.set(o, `aladin_${p.customerKey}`); res(); }; q.onerror = () => res(); })));
      }
      if (idb) idb.close();
    } catch (e) {}
    onos.forEach((o) => { if (!map.has(o)) need.push(o); });
    const FP = CARD.FBx().firestore.FieldPath.documentId();
    for (let i = 0; i < need.length; i += 30) { const s = await db.collection('crm_orders').where(FP, 'in', need.slice(i, i + 30).map((o) => `aladin_${o}`)).get(); s.forEach((d) => { const v = d.data(); if (v.customerId) map.set(v.orderNo, v.customerId); }); }
    return map;
  }

  // ── 주문 상세 팝업: 카드 전체
  if (/\/scm\/wpopup_order\.aspx/i.test(location.pathname)) {
    const blk = document.querySelector('[data-custkey]'); if (!blk) return;
    const cid = `aladin_${blk.getAttribute('data-custkey')}`;
    CARD.style(); const box = document.createElement('div'); box.className = 'rncard rnfloat'; box.style.cssText = 'top:6px;right:6px'; box.innerHTML = '<b>리드나우 고객 정보</b><div class="s">불러오는 중</div>'; document.body.appendChild(box);
    const F = CARD.FBx(); if (!F) { box.innerHTML = '<b>리드나우 고객 정보</b><div class="s">Firebase를 불러오지 못했습니다</div>'; return; }
    const u = await CARD.user(); if (!u) { box.innerHTML = '<b>리드나우 고객 정보</b><div class="s">판매관리·주문조회 화면의 수집기 패널에서 로그인하면 고객 정보가 보입니다.</div>'; return; }
    const db = F.firestore();
    const load = async () => { await CARD.loadCfg(db); const m = await CARD.loadBundles(db, [cid]); const b = m.get(cid); box.innerHTML = '<button class="x" title="닫기">×</button>' + CARD.cardHtml(b, cid); box.querySelector('.x').onclick = () => box.remove(); CARD.bind(box, db, u, cid, b, load); };
    try { await load(); } catch (e) { box.innerHTML = `<b>리드나우 고객 정보</b><div class="s">불러오기 실패: ${CARD.esc(e.code || e.message)}</div>`; }
    return;
  }

  // ── 판매관리·주문조회 목록: 주문번호 옆에 고객 표시, 누르면 카드
  if (/\/scm\/(worders|worder_preparatory_complete)\.aspx/i.test(location.pathname)) {
    (async () => {
      await new Promise((r) => setTimeout(r, 1200));
      const F = CARD.FBx(); if (!F) return; const u = await CARD.user(); if (!u) return;
      const db = F.firestore(); CARD.style();
      const links = [...document.querySelectorAll('a[onclick*="viewOrderDetail"], a[href*="viewOrderDetail"], a[href*="OrderDetail_Popup"], a[onclick*="OrderDetail_Popup"]')];
      const byOno = new Map(); links.forEach((a) => { const m = (a.getAttribute('onclick') || a.getAttribute('href') || '').match(/(\d{3}-[A-Z]\d{9})/); if (m && /^\d{3}-[A-Z]\d{9}$/.test(a.textContent.trim())) (byOno.get(m[1]) || byOno.set(m[1], []).get(m[1])).push(a); });
      if (!byOno.size) return;
      try {
        await CARD.loadCfg(db);
        const o2c = await customerIdsForOrders(db, [...byOno.keys()]);
        const bundles = await CARD.loadBundles(db, [...o2c.values()]);
        let open = null;
        for (const [ono, as] of byOno) {
          const cid = o2c.get(ono); const b = cid ? bundles.get(cid) : null;
          as.forEach((a) => {
            if (a.parentNode.querySelector(`.rn-bd[data-ono="${ono}"]`)) return;
            const span = document.createElement('span'); span.className = 'rn-bd'; span.dataset.ono = ono; span.innerHTML = CARD.badges(b); span.title = '눌러서 리드나우 고객 정보 보기';
            span.onclick = (ev) => {
              ev.preventDefault(); ev.stopPropagation(); if (open) open.remove();
              const box = document.createElement('div'); box.className = 'rncard rnfloat'; const r = span.getBoundingClientRect();
              box.style.left = Math.min(window.innerWidth - 310, r.left) + 'px'; box.style.top = Math.min(window.innerHeight - 200, r.bottom + 4) + 'px';
              const draw = async () => { if (cid) { const m = await CARD.loadBundles(db, [cid]); bundles.set(cid, m.get(cid)); } const bb = cid ? bundles.get(cid) : null; box.innerHTML = '<button class="x" title="닫기">×</button>' + CARD.cardHtml(bb, cid || ''); box.querySelector('.x').onclick = () => box.remove(); if (cid) CARD.bind(box, db, u, cid, bb, async () => { await draw(); span.innerHTML = CARD.badges(bundles.get(cid)); }); };
              draw(); document.body.appendChild(box); open = box;
            };
            a.insertAdjacentElement('afterend', span);
          });
        }
        document.addEventListener('click', (e) => { if (open && !open.contains(e.target) && !e.target.closest('.rn-bd')) { open.remove(); open = null; } });
      } catch (e) { console.warn('[리드나우] 목록 고객 표시 실패', e); }
    })();
  }

  if (!/\/scm\/(worders|worder_preparatory_complete|wrecord_edit)\.aspx/i.test(location.pathname) || window.top !== window) return; // 수집 패널: 주문조회·판매관리·상품 조회 화면 (통합 수집기)

  async function autoFillLogin(pw, fl) {
    if (window.__rnLoginMethod && window.__rnLoginMethod() === 'naver') return;
    const cred = (GM_getValue('rn-cred', null) || GM_getValue('rnp-cred', null));
    if (!cred || !cred.id || !cred.pw) return;
    if (fl.submittedAt && Date.now() - fl.submittedAt < 60000) { // 제출했는데 다시 로그인 화면 = 실패
      GM_setValue(LOGIN_FLAG, { ...fl, result: 'failed', message: (document.body.innerText.match(/(아이디|비밀번호)[^\n]{0,60}/) || [''])[0] });
      return;
    }
    const form = pw.form || document;
    const idInput = [...form.querySelectorAll('input[type="text"],input[type="email"],input:not([type])')].find((i) => i.getClientRects().length && i !== pw);
    if (!idInput) { GM_setValue(LOGIN_FLAG, { ...fl, result: 'no-id-field' }); return; }
    const setVal = (inp, v) => { const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); d.set.call(inp, v); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); };
    setVal(idInput, cred.id); setVal(pw, cred.pw);
    // '로그인 상태 유지'가 있으면 체크 (끊김 자체를 줄임)
    [...document.querySelectorAll('input[type="checkbox"]')].forEach((c) => { const lab = (c.id && document.querySelector(`label[for="${c.id}"]`)) || c.closest('label') || c.parentElement; if (lab && /상태\s*유지|자동\s*로그인/.test(lab.textContent) && !c.checked) c.click(); });
    GM_setValue(LOGIN_FLAG, { ...fl, submittedAt: Date.now() });
    await new Promise((r) => setTimeout(r, 400));
    const btn = [...form.querySelectorAll('button,input[type="submit"],input[type="image"],a')].find((b) => /^\s*로그인\s*$/.test(b.textContent || b.value || b.alt || '') || b.type === 'submit' || b.type === 'image');
    if (btn) btn.click(); else if (pw.form) pw.form.submit(); else pw.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
  }

  /* ════════════════════════════════════════════════════════════
   * B. 수집기 (주문조회 페이지)
   * ════════════════════════════════════════════════════════════ */
  const P = (typeof ReadnowOrders !== 'undefined' && ReadnowOrders) || window.ReadnowOrders || globalThis.ReadnowOrders;
  if (!P) { alert('[리드나우 고객 수집기] 파서 파일(readnow-orders-core.js)을 불러오지 못했습니다. GitHub 주소를 확인해 주세요.'); return; }
  const NEED_CORE = '0.3.0';
  const verNum = (v) => String(v || '0').split('.').reduce((a, x) => a * 1000 + (parseInt(x, 10) || 0), 0);
  if (verNum(P.VERSION) < verNum(NEED_CORE)) alert(`[리드나우 고객 수집기] GitHub의 파서 파일이 옛 버전(${P.VERSION})입니다. ${NEED_CORE} 파일로 바꿔 올린 뒤 몇 분 기다렸다가 새로고침해 주세요.`);

  /* ── 저장소 (브라우저 IndexedDB) ── */
  const STORES = ['orderLines', 'popups', 'returns', 'qnaList', 'qnaDetail', 'reviews', 'jobs', 'issues', 'meta', 'uploaded', 'excelLines', 'sheetRows', 'sellerRaw'];
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('readnow-crm', 4);
    r.onupgradeneeded = () => { for (const s of STORES) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s, { keyPath: '_key' }); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    r.onblocked = () => alert('[리드나우 고객 수집기] 예전 버전 수집기가 열린 다른 탭이 있어 저장소를 새 버전으로 바꿀 수 없습니다. 주문조회 탭을 모두 닫고 하나만 다시 열어 주세요.');
  });
  const reqP = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const dbGet = (s, k) => reqP(db.transaction(s).objectStore(s).get(k));
  const dbAll = (s) => reqP(db.transaction(s).objectStore(s).getAll());
  const dbCount = (s) => reqP(db.transaction(s).objectStore(s).count());
  const dbPut = (s, objs) => new Promise((res, rej) => {
    const t = db.transaction(s, 'readwrite'); const st = t.objectStore(s);
    (Array.isArray(objs) ? objs : [objs]).forEach((o) => st.put(o));
    t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  });
  const dbDelete = (s, keys) => new Promise((res, rej) => {
    const t = db.transaction(s, 'readwrite'); const st = t.objectStore(s);
    keys.forEach((k) => st.delete(k)); t.oncomplete = () => res(); t.onerror = () => rej(t.error);
  });
  const dbGetMany = async (s, keys) => { const m = new Map(); for (const k of keys) { const v = await dbGet(s, k); if (v) m.set(k, v); } return m; };

  /* ── 설정 (비밀번호는 IndexedDB·백업이 아닌 Tampermonkey 저장소에만) ── */
  const DEFAULTS = { remoteRun: true, billing: 'paid', dailyWriteCap: 200000, noCapUntil: '2026-12-29', shopSc: '996008', syncTooltip: true, autoRun: false, autoTime: '06:00', delayMin: 1500, delayMax: 3000, forceFull: false, autoLogin: true, stopAfterKnownPages: 2, maxLoginTries: 0, loginRetrySec: 60, autoUpload: true }; // maxLoginTries 0 = 무제한
  let settings = { ...DEFAULTS, ...((await dbGet('meta', 'settings')) || {}) }; delete settings._key;
  const saveSettings = () => dbPut('meta', { _key: 'settings', ...settings });

  /* ── 대기: 백그라운드 탭에서도 덜 느려지도록 워커 타이머 사용 (안 되면 일반 타이머) ── */
  let worker = null; const waiters = new Map(); let wseq = 0;
  try {
    worker = new Worker(URL.createObjectURL(new Blob(['onmessage=e=>setTimeout(()=>postMessage(e.data.id),e.data.ms)'], { type: 'text/javascript' })));
    worker.onmessage = (e) => { const f = waiters.get(e.data); if (f) { waiters.delete(e.data); f(); } };
  } catch (e) { worker = null; }
  if (worker) { // 사이트 보안 정책으로 워커가 조용히 막히는 경우 대비: 1초 안에 응답 없으면 일반 타이머 사용
    const ok = await new Promise((r) => { const id = ++wseq; waiters.set(id, () => r(true)); worker.onerror = () => r(false); worker.postMessage({ id, ms: 1 }); setTimeout(() => r(false), 1000); });
    if (!ok) { try { worker.terminate(); } catch (e) {} worker = null; waiters.clear(); }
  }
  const sleep = (ms) => new Promise((r) => { if (worker) { const id = ++wseq; waiters.set(id, r); worker.postMessage({ id, ms }); } else setTimeout(r, ms); });

  /* ── 요청: 사람 속도 간격, 서버 불안정 시 길게 재시도, 로그인 풀림 시 자동 재로그인 ── */
  let lastReqAt = 0; const reqTimes = [];
  class StopSignal extends Error { constructor(code, msg) { super(msg || code); this.code = code; } }
  const PACE_C = (window.ReadnowProducts || globalThis.ReadnowProducts).makePacer('aladin'); // 상품 수집·가격 감시와 같은 속도 조절 하나 (설정은 상품 수집기 설정의 '알라딘 요청 간격')
  async function politeWait() { await PACE_C.wait(sleep); lastReqAt = Date.now(); }
  // (1.39.0) 알라딘 화면 읽기는 공용 '알라딘 창구'(readnow-aladin-core.js) 하나로 — 다시 하기·점검 화면·로그인 풀림·글자 인코딩을 상품 쪽·가격 감시기와 같은 코드로
  const AL = window.ReadnowAladin || globalThis.ReadnowAladin;
  const looksLoggedOut = (finalUrl, doc) => AL.looksLoggedOut(finalUrl, doc, { titleOk: /샵매니저/ });
  const RETRY_WAITS = AL.RETRY_WAITS;
  const MAX_OUTAGE_MIN = 60; // 서버가 이 시간 넘게 계속 안 되면 일시정지
  const fetchDoc = AL.makeReader({ pace: PACE_C, sleep, wait: politeWait, beforeEach: () => checkPause(),
    loggedOut: (fu, doc) => looksLoggedOut(fu, doc),
    onLoggedOut: async (fu, loginTries) => {
      const ml = GM_getValue('rnu-maxlogin', 6); const limit = ml > 0 ? ml : Infinity; // 설정 ⑨ (0 = 무제한, 기본 6)
      if (!settings.autoLogin) throw new StopSignal('LOGIN', '로그인이 풀렸습니다. 직접 로그인한 뒤 이어하기를 눌러 주세요.');
      if (loginTries > limit) throw new StopSignal('LOGIN', `자동 로그인을 ${limit}번 시도했지만 실패했습니다. 직접 로그인한 뒤 이어하기를 눌러 주세요.`);
      if (loginTries > 1) { log(`자동 로그인 ${loginTries}번째 시도 전 ${settings.loginRetrySec}초 기다립니다.`, 'warn'); setNow(`자동 로그인 재시도 대기: ${settings.loginRetrySec}초`); await sleep(settings.loginRetrySec * 1000); checkPause(); }
      PACE_C.fail('login'); await autoRelogin(fu, loginTries); },
    fatal: (e) => e instanceof StopSignal,
    maxOutageMin: () => MAX_OUTAGE_MIN, outageError: (m) => new Error(`알라딘 서버가 ${m}분 넘게 응답하지 않아 멈췄습니다. 나중에 이어하기를 눌러 주세요.`),
    on429: (st) => log(`알라딘이 요청이 너무 많다고 함(${st}) — 이 PC의 모든 수집이 ${Math.round(PACE_C.cooling() / 60000)}분 쉬고 간격 ${PACE_C.state().gap}ms로`, 'warn'),
    onOk: (ms) => { reqTimes.push(ms + PACE_C.state().gap); if (reqTimes.length > 30) reqTimes.shift(); },
    onRecover: () => log('서버 연결이 회복되어 계속합니다.', 'ok'),
    onRetry: (e, w, attempt) => { log(`요청 실패 (${e.name === 'AbortError' ? '응답 시간 초과' : e.message}). ${w}초 뒤 다시 시도합니다.`, 'warn'); setNow(`서버 응답 대기 중: ${w}초 뒤 재시도 (${attempt}번째)`); } });

  async function isLoggedIn() {
    try { const r = await fetch(BASE + 'worders.aspx?searchType=1&limitDate=1', { credentials: 'include' }); const h = await r.text(); const d = new DOMParser().parseFromString(h, 'text/html'); return r.ok && !looksLoggedOut(r.url, d, h); } catch (e) { return false; }
  }
  async function autoRelogin(loginUrl, tryNo = 1) {
    if (window.__rnLoginMethod && window.__rnLoginMethod() === 'naver') { setNow(`네이버로 다시 로그인 중 (${tryNo}번째)`); const ok = await window.__rnNaverLogin({ isLoggedIn, log: (m, lv) => log(m, lv === 'err' ? 'err' : lv ? 'warn' : 'ok'), stopped: () => pauseRequested, ret: BASE + 'worders.aspx' }); if (!ok && tryNo >= 2) throw new StopSignal('LOGIN', '네이버로 다시 로그인하지 못했습니다. 이 PC 브라우저에서 네이버에 로그인(로그인 상태 유지)한 뒤 이어하기를 눌러 주세요.'); return ok; }
    const cred = (GM_getValue('rn-cred', null) || GM_getValue('rnp-cred', null));
    if (!cred || !cred.id || !cred.pw) throw new StopSignal('LOGIN', '로그인이 풀렸습니다. 설정에 아이디·비밀번호를 넣으면 다음부터 자동으로 다시 로그인합니다. 지금은 직접 로그인한 뒤 이어하기를 눌러 주세요.');
    log(tryNo > 1 ? `자동 로그인 ${tryNo}번째 시도` : '로그인이 풀려 자동으로 다시 로그인합니다.', 'warn'); setNow(`자동 로그인 중 (${tryNo}번째)`);
    let url = /login/i.test(loginUrl) ? loginUrl : null;
    if (!url) { try { const r = await fetch(BASE + 'worders.aspx', { credentials: 'include' }); if (/login/i.test(r.url)) url = r.url; } catch (e) {} }
    url = url || 'https://www.aladin.co.kr/login/wlogin.aspx?returnurl=' + encodeURIComponent(BASE + 'worders.aspx');
    GM_setValue(LOGIN_FLAG, { at: Date.now() });
    const tab = GM_openInTab(url, { active: false, insert: true });
    let ok = false;
    for (let i = 0; i < 18; i++) { // 최대 90초
      await sleep(5000);
      if (pauseRequested) break;
      const f = GM_getValue(LOGIN_FLAG, {});
      if (f.result === 'failed' || f.result === 'no-id-field') break;
      if (await isLoggedIn()) { ok = true; break; }
    }
    try { tab.close(); } catch (e) {}
    GM_deleteValue(LOGIN_FLAG);
    if (!ok) log('자동 로그인이 이번에는 되지 않았습니다.', 'warn');
    else log('다시 로그인했습니다. 수집을 계속합니다.', 'ok');
    return ok;
  }

  /* ── 작업 상태 (이어하기) ── */
  let running = false; let pauseRequested = false; let currentTask = null;
  function checkPause() { if (pauseRequested) throw new StopSignal('PAUSED', '일시정지했습니다.'); }
  async function loadJob(name) { return (await dbGet('jobs', name)) || { _key: name, status: 'idle' }; }
  const saveJob = (job) => { job.updatedAt = now(); return dbPut('jobs', job); };
  async function addIssue(type, key, detail) { await dbPut('issues', { _key: `${type}|${key}`, type, key, detail, createdAt: now() }); }
  const fmtDate = (iso) => (iso ? iso.slice(0, 10) : '?');

  function lastPageOf(doc) {
    const a = [...doc.querySelectorAll('a[onclick*="Page_Set"]')].map((x) => parseInt((x.getAttribute('onclick').match(/Page_Set\('(\d+)'\)/) || [])[1], 10));
    const b = [...doc.querySelectorAll('#pagingNavigation a[data-page]')].map((x) => parseInt(x.getAttribute('data-page'), 10));
    const nums = [...a, ...b].filter(Boolean); return nums.length ? Math.max(...nums) : 1;
  }
  // 페이지를 넘기며 수집. 갱신 모드에서는 '이미 다 아는 페이지'가 연속으로 나오면 멈춘다.
  async function crawlPages(job, makeUrl, onPage, label, expect) {
    job.page = job.page || 1; job.knownRun = job.knownRun || 0;
    while (true) {
      const url = makeUrl(job.page);
      setNow(`${label} 목록 ${job.page}${job.lastPage ? '/' + job.lastPage : ''}페이지 불러오는 중`);
      const { doc } = await fetchDoc(url, { expect });
      if (job.page === 1 || !job.lastPage) job.lastPage = lastPageOf(doc);
      const r = await onPage(doc, url, job.page);
      if (job.page > 1 && r.firstKey && r.firstKey === job.prevFirstKey) throw new Error(`${label}: ${job.page}페이지 내용이 앞 페이지와 같습니다. 페이지 넘김 방식 확인이 필요합니다.`);
      job.prevFirstKey = r.firstKey;
      progress(`${label} 목록`, job.page, job.lastPage);
      setNow(`${label} 목록 ${job.page}/${job.lastPage}페이지: ${r.summary || ''}`);
      if (!r.count) { if (job.page < job.lastPage) await addIssue('EMPTY_PAGE', `${label}|${job.page}`, `${job.page}페이지가 비어 있음`); break; }
      if (job.mode === 'update') {
        job.knownRun = r.allKnown ? job.knownRun + 1 : 0;
        if (job.knownRun >= settings.stopAfterKnownPages) { log(`${label}: 이미 수집된 구간에 도달해 목록 갱신을 마칩니다 (${job.page}페이지).`); break; }
      }
      if (job.page >= job.lastPage) break;
      job.page += 1; await saveJob(job);
    }
  }
  function startJob(job) {
    const mode = settings.forceFull || !job.fullDoneAt ? 'full' : 'update';
    Object.assign(job, { mode, phase: 'list', page: 1, lastPage: null, prevFirstKey: null, knownRun: 0, queue: null, qi: 0, startedAt: now(), message: null });
  }
  const isFresh = (job) => job.status === 'done' || job.status === 'idle';
  const listExpect = (doc) => !!doc.querySelector('.total2') || /주문상품이 없습니다|검색 결과가 없/.test(doc.body ? doc.body.textContent : '');

  /* ════════ 1) 전체주문 / 취소주문: 목록 → 주문 상세 ════════ */
  // 서버(Firebase crm_orders)의 주문 상세 목록 — '이미 받았는지'의 기준. 한 번 읽어 30분 기억 (이 PC 기록은 속도용 보조)
  let _svOrders = null, _svAt = 0;
  // (1.34.4) 서버 주문 목록: 처음(또는 7일마다) 한 번만 전부 읽고, 그 뒤엔 '바뀐 주문(uploadedAt)'만 받아 이 PC에 둔 표에 더함
  //   예전: 주문 수집 때마다(30분마다) crm_orders 전체(수천~수만 건, 상품 줄 포함)를 다시 읽어 느리고 읽기 사용량이 큼. 모든 쓰는 쪽(수집기·클라우드·웹앱)이 uploadedAt을 남김 — 웹앱도 같은 방식.
  async function serverOrders() { if (_svOrders && Date.now() - _svAt < 5 * 60000) return _svOrders; if (!fdb) { log('Firebase에 로그인되지 않아 이 PC 기록만으로 판단합니다 (구글 로그인 권장)', 'warn'); return null; }
    const put = (m, v) => { if (v.orderNo) m.set(v.orderNo, { stage: v.stage || '', kind: v.kind, items: (v.items || []).length }); };
    const ms = (v) => (v.uploadedAt && v.uploadedAt.toMillis ? v.uploadedAt.toMillis() : 0);
    try { let c = null; try { c = await dbGet('meta', 'svOrders'); } catch (e) {}
      const m = new Map(); let max = 0; let full = !c || !c.last || !Array.isArray(c.rows) || Date.now() - (c.fullAt || 0) > 7 * 864e5;
      if (!full) { c.rows.forEach(([o, st, k, n]) => m.set(o, { stage: st, kind: k, items: n })); max = c.last;
        setNow('서버 주문 중 바뀐 것만 받는 중'); const ss = await fdb.collection('crm_orders').where('uploadedAt', '>', FB.firestore.Timestamp.fromMillis(c.last - 120000)).get(); // 2분 겹쳐 읽어 시계 차이로 빠지는 것 없게
        ss.forEach((d) => { const v = d.data(); put(m, v); max = Math.max(max, ms(v)); }); log(`서버 주문 ${m.size.toLocaleString()}건 (바뀐 ${ss.size.toLocaleString()}건만 받음) — 이미 받은 주문은 서버 기준으로 건너뜁니다`); }
      else { setNow('서버의 주문 상세 목록을 읽는 중 (처음 한 번 전체 — 다음부터는 바뀐 것만)'); (await fdb.collection('crm_orders').get()).forEach((d) => { const v = d.data(); put(m, v); max = Math.max(max, ms(v)); }); log(`서버 주문 ${m.size.toLocaleString()}건 전체 확인 — 이미 받은 주문은 서버 기준으로 건너뜁니다`); }
      try { await dbPut('meta', { _key: 'svOrders', rows: [...m].map(([o, x]) => [o, x.stage, x.kind, x.items]), last: max || Date.now(), fullAt: full ? Date.now() : c.fullAt }); } catch (e) {}
      _svOrders = m; _svAt = Date.now(); return m; }
    catch (e) { log('서버 주문 목록 읽기 실패: ' + e.message + ' — 이 PC 기록만으로 판단', 'warn'); return null; } }
  const sameLine = (a, b) => a && b && a.shipped?.raw === b.shipped?.raw && a.rowStatus === b.rowStatus && a.cancelQty === b.cancelQty && a.returnReason === b.returnReason && a.price === b.price;
  async function taskOrderList(name, searchType, kind, label) {
    const job = await loadJob(name);
    if (isFresh(job)) { await syncRemoteJob(job); startJob(job); }
    job.status = 'running'; await saveJob(job);
    log(`${label} ${job.mode === 'full' ? '전체 수집' : '갱신 수집'} 시작`);

    if (job.phase === 'list') {
      job.touched = job.touched || [];
      await crawlPages(job, (p) => `${BASE}worders.aspx?page=${p}&keywordType=0&keyword=&searchType=${searchType}&limitDate=0`, async (doc, url, page) => {
        const L = P.parseOrderList(doc, url);
        if (page === 1 && L.total != null) job.total = L.total;
        const occ = {}; const recs = L.rows.map((r) => {
          const base = `${kind}|${r.orderNo}|${r.rawTitle}|${r.price}`; occ[base] = (occ[base] || 0) + 1;
          return { _key: `${base}|${occ[base]}`, kind, ...r, page, collectedAt: now(), parserVersion: P.VERSION };
        });
        const old = await dbGetMany('orderLines', recs.map((r) => r._key)); const SV = await serverOrders();
        let fresh = 0; const touched = new Set();
        for (const r of recs) {
          const o = old.get(r._key);
          if (o) r.firstCollectedAt = o.firstCollectedAt || o.collectedAt; else r.firstCollectedAt = now();
          const final = kind === 'cancel' || !!(r.shipped && r.shipped.date);
          const stale = !final && (!o || !o.detailTouchAt || Date.now() - Date.parse(o.detailTouchAt) > 24 * 3600e3); // 출고 전 주문: 목록 줄이 그대로면 하루 한 번만 상세 확인
          const sv = SV ? SV.get(r.orderNo) : null; const svDone = sv && sv.items && (kind === 'cancel' || /정산완료/.test(sv.stage));
          if (svDone && (!o || sameLine(o, r))) { r.detailTouchAt = (o && o.detailTouchAt) || now(); } // 서버에 끝난 상세가 있으면 '아는 줄' (이 PC에 없어도)
          else if (!o || !sameLine(o, r) || stale || (SV && !sv)) { fresh += 1; touched.add(r.orderNo); r.detailTouchAt = now(); } else r.detailTouchAt = o.detailTouchAt || now(); // 서버에 없는 주문은 이 PC에 있어도 '새 줄'
        }
        if (recs.length) await dbPut('orderLines', recs);
        touched.forEach((o) => { if (!job.touched.includes(o)) job.touched.push(o); });
        const d = recs.map((r) => r.orderedAt).filter(Boolean).sort();
        return { count: recs.length, firstKey: recs[0] && recs[0]._key, allKnown: fresh === 0,
          summary: `${fmtDate(d[0])} ~ ${fmtDate(d[d.length - 1])} 주문 ${recs.length}줄, 새로 바뀐 줄 ${fresh}` };
      }, label, listExpect);
      job.phase = 'popup'; job.qi = 0; job.queue = null; await saveJob(job);
    }

    if (job.phase === 'popup') {
      if (!job.queue) {
        const lines = (await dbAll('orderLines')).filter((l) => l.kind === kind);
        const oldest = {}; lines.forEach((l) => { if (!oldest[l.orderNo] || (l.orderedAt || '') < oldest[l.orderNo]) oldest[l.orderNo] = l.orderedAt || ''; });
        const existing = new Map((await dbAll('popups')).map((p) => [p._key, p]));
        const recent = new Date(Date.now() - 60 * 864e5).toISOString();
        const fbStage = await serverOrders(); // 서버 기준
        const touched = new Set(job.touched || []);
        job.queue = Object.keys(oldest).filter((o) => {
          const e = existing.get(o);
          const f = fbStage ? fbStage.get(o) : null;
          if (f && f.items && (kind === 'cancel' || /정산완료/.test(f.stage))) return false;          // ① 서버에 상세가 있고 끝난 주문 → 다시 안 엶 (어느 PC든 같은 결과)
          if (e && Date.now() - Date.parse(e.collectedAt || 0) < 7 * 864e5 && !touched.has(o)) return false; // ② 이 PC가 7일 안에 받아 둔 것 → 올리기 단계에서 서버로 감
          if (!f || !f.items) { if (!fbStage && e) return false; return true; }                      // ③ 서버에 상세 없음 → 받음 (서버를 못 읽으면: 이 PC에 있으면 건너뜀)
          if (kind === 'cancel') return false;
          if (!e) return oldest[o] >= recent;                                                          // ④ 서버에 미정산 상세만 있고 이 PC엔 없음 → 최근 60일 주문만 다시
          if (kind === 'cancel') return false;                   // 취소 건은 한 번이면 충분
          if (job.mode === 'full') return !/정산완료/.test(e.stage || '');
          // 갱신: 새 주문·목록 줄이 바뀐 주문만. 최근 60일 미정산 주문은 정산 단계 확인을 위해 상세를 받은 지 7일 넘었을 때만 (예전엔 매번 전부 다시 받음)
          return touched.has(o) || (!/정산완료/.test(e.stage || '') && oldest[o] >= recent && Date.now() - Date.parse(e.collectedAt || 0) > (settings.popupRecheckDays ?? 7) * 864e5);
        }).sort((a, b) => oldest[a].localeCompare(oldest[b]));   // 개인정보가 먼저 지워지는 오래된 주문부터
        job.qi = 0; await saveJob(job);
      }
      while (job.qi < job.queue.length) {
        const ono = job.queue[job.qi];
        const url = `${BASE}wpopup_order.aspx?ono=${encodeURIComponent(ono)}`;
        setNow(`${label} 주문 상세 ${ono} 불러오는 중`);
        const { doc } = await fetchDoc(url, { expect: (d) => /주문번호/.test(d.body ? d.body.textContent : '') });
        const p = P.parseOrderPopup(doc, url); popupExtras(doc, p);
        if (p.orderNo !== ono) await addIssue('POPUP_MISMATCH', ono, `팝업 주문번호가 다름: ${p.orderNo}`);
        else await savePopup(ono, p);
        job.qi += 1; if (job.qi % 5 === 0 || job.qi === job.queue.length) await saveJob(job);
        progress(`${label} 주문 상세`, job.qi, job.queue.length);
        const who = p.buyer && p.buyer.name ? p.buyer.name : '개인정보 없음';
        setNow(`${label} 주문 상세 ${ono} (${fmtDate(p.orderedDate)} 주문, ${who}): 상품 ${p.items.length}개, 판매총액 ${p.totalAmount != null ? p.totalAmount.toLocaleString() + '원' : '-'}, ${p.stage || ''}`);
      }
    }
    job.status = 'done'; job.finishedAt = now(); if (job.mode === 'full') job.fullDoneAt = now(); job.touched = []; await saveJob(job); shareJobDone(job);
    log(`${label} 완료 (목록 ${job.page || 0}페이지, 주문 상세 ${job.queue ? job.queue.length : 0}건)`, 'ok');
  }
  // 주문 상세의 배송비 칸: 그 주문에 실제 적용된 배송비(주문 시점 값)와 무료배송 기준·도서산간 배송비 문구
  function popupExtras(doc, p) {
    const t = (sel) => { const e = doc.querySelector(sel); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; };
    p.freeRuleText = t('#lblPriceType'); const rp = t('#lblDeliveryPriceRP'); p.remoteFee = rp ? parseInt(rp.replace(/[^\d]/g, ''), 10) || null : null;
  }
  async function savePopup(ono, p) { // 개인정보가 지워진 뒤 다시 받아도 먼저 확보한 개인정보는 유지
    const old = await dbGet('popups', ono);
    const rec = { _key: ono, ...p, collectedAt: now(), parserVersion: P.VERSION };
    if (old && old.piiAvailable && !p.piiAvailable) {
      Object.assign(rec, { buyer: old.buyer, recipient: old.recipient, recipientSameAsBuyer: old.recipientSameAsBuyer, shippingRequest: old.shippingRequest,
        piiAvailable: true, piiCollectedAt: old.piiCollectedAt || old.collectedAt, piiGoneSeenAt: now() });
    } else if (p.piiAvailable) rec.piiCollectedAt = now();
    rec.firstCollectedAt = (old && old.firstCollectedAt) || now();
    if (old && old.orderStatus && old.orderStatus !== p.orderStatus) rec.statusHistory = [...(old.statusHistory || []), { from: old.orderStatus, to: p.orderStatus, seenAt: now() }];
    else if (old && old.statusHistory) rec.statusHistory = old.statusHistory;
    await dbPut('popups', rec);
  }

  /* ════════ 2) 반품: 반품관리(wreturn.aspx)의 모든 상태 탭 ════════ */
  const RETURN_TABS = [[1, '반품확인요청'], [2, '수거신청/수거중'], [4, '수거완료'], [6, '환불보류'], [5, '반품완료'], [99, '반품취소']];
  async function taskReturns() {
    const job = await loadJob('returns');
    if (isFresh(job)) Object.assign(job, { ti: 0, page: 1, knownRun: 0, tabCounts: {}, startedAt: now(), message: null });
    job.status = 'running'; await saveJob(job);
    while (job.ti < RETURN_TABS.length) {
      const [code, name] = RETURN_TABS[job.ti];
      const url = `${BASE}wreturn.aspx?returnStatus=${code}&page=${job.page}`;
      setNow(`반품 [${name}] ${job.page}페이지 불러오는 중`);
      const { doc } = await fetchDoc(url, { expect: (d) => /반품관리/.test(d.title) || !!d.querySelector('.scm2019_table') });
      if (job.page === 1) {
        doc.querySelectorAll('.scm2019_table a[href*="returnStatus="]').forEach((a) => { const c = (a.getAttribute('href').match(/returnStatus=(\d+)/) || [])[1]; const n = (a.textContent.match(/\((\d+)건\)/) || [])[1]; if (c) job.tabCounts[c] = n ? +n : null; });
      }
      const rows = P.parseReturnList(doc); let known = 0;
      for (const r of rows) {
        const old = await dbGet('returns', r.claimId); if (old && old.status === r.status && old.tab === name) known += 1;
        const hist = (old && old.history) || [];
        if (!hist.length || hist[hist.length - 1].status !== r.status) hist.push({ status: r.status, tab: name, seenAt: now() });
        await dbPut('returns', { _key: r.claimId, ...r, tab: name, history: hist, firstSeenAt: (old && old.firstSeenAt) || now(), lastSeenAt: now(), parserVersion: P.VERSION });
      }
      setNow(`반품 [${name}] ${job.page}페이지: ${rows.length}건`);
      const last = lastPageOf(doc);
      const finalTab = code === 5 || code === 99; const allKnown = rows.length && known === rows.length;
      job.knownRun = allKnown ? (job.knownRun || 0) + 1 : 0;
      if (finalTab && job.fullDoneAt && !settings.forceFull && job.knownRun >= (settings.stopAfterKnownPages || 2)) { log(`반품 [${name}]: 이미 수집된 구간에 도달해 이 탭을 마칩니다 (${job.page}페이지)`); job.ti += 1; job.page = 1; job.knownRun = 0; }
      else if (rows.length && job.page < last) job.page += 1; else { job.ti += 1; job.page = 1; job.knownRun = 0; }
      progress('반품 (상태별)', job.ti, RETURN_TABS.length); await saveJob(job);
    }
    job.status = 'done'; job.finishedAt = now(); job.fullDoneAt = job.fullDoneAt || now(); job.knownRun = 0; await saveJob(job);
    const tc = RETURN_TABS.map(([c, n]) => `${n} ${job.tabCounts[c] ?? '?'}`).join(', ');
    log(`반품 완료 (${tc})`, 'ok');
  }

  /* ════════ 3) 묻고 답하기: 목록 → 상세 ════════ */
  async function taskQna() {
    const job = await loadJob('qna');
    if (isFresh(job)) { await syncRemoteJob(job); startJob(job); }
    job.status = 'running'; await saveJob(job);
    if (job.phase === 'list') {
      await crawlPages(job, (p) => `${BASE}wUsedShopC2CQnASellerList.aspx?page=${p}`, async (doc) => {
        const rows = P.parseQnaList(doc).map((r) => ({ _key: r.questionId, ...r, collectedAt: now() }));
        const det = await dbGetMany('qnaDetail', rows.map((r) => r._key)); const old = await dbGetMany('qnaList', rows.map((r) => r._key));
        // '아는 줄' = 전에 본 줄과 답변여부가 같고 상세도 받아 둔 줄. 답변 없는 질문·취소된 질문도 상태가 그대로면 아는 줄 (예전엔 답변이 없으면 매번 새 줄로 봐서 끝까지 다 넘겼음)
        let fresh = 0;
        for (const r of rows) { const o = old.get(r._key);
          r.firstCollectedAt = (o && (o.firstCollectedAt || o.collectedAt)) || now();
          r.answeredHistory = (o && o.answeredHistory) || (o ? [{ v: o.answered ?? null, seenAt: o.firstCollectedAt || o.collectedAt || null }] : []);
          if (!o || (o.answered ?? null) !== (r.answered ?? null)) { r.answeredHistory = [...r.answeredHistory, { v: r.answered ?? null, seenAt: now() }]; }
          if (!o || (o.answered ?? null) !== (r.answered ?? null) || !det.has(r._key)) fresh += 1; }
        if (rows.length) await dbPut('qnaList', rows);
        return { count: rows.length, firstKey: rows[0] && rows[0]._key, allKnown: fresh === 0, summary: `문의 ${rows.length}건, 새로 바뀐 것 ${fresh}건 (${fmtDate(rows[rows.length - 1]?.createdDate)} ~ ${fmtDate(rows[0]?.createdDate)})` };
      }, '묻고 답하기');
      job.phase = 'detail'; job.queue = null; await saveJob(job);
    }
    if (job.phase === 'pubstatus') { job.phase = 'detail'; await saveJob(job); } // (1.5.3에서 잘못 넣은 단계 — 남아 있던 작업은 바로 다음 단계로)
    if (job.phase === 'detail') {
      if (!job.queue) {
        const det = new Map((await dbAll('qnaDetail')).map((d) => [d._key, d]));
        const fix = []; // 예전 기록(상세에 목록 답변여부가 없음)은 지금 목록 값으로 한 번 맞춰 두고 다시 열지 않음
        job.queue = (await dbAll('qnaList')).filter((q) => { const d = det.get(q._key); if (!d) return true;
          if (!('listStatus' in d)) { fix.push({ ...d, listStatus: q.answered ?? null }); return false; }
          return (d.listStatus ?? null) !== (q.answered ?? null); }).map((q) => q._key);
        if (fix.length) await dbPut('qnaDetail', fix);
        log(`묻고 답하기 상세: 새 질문·답변여부가 바뀐 질문 ${job.queue.length}건만 엽니다`);
        job.qi = 0; await saveJob(job);
      }
      while (job.qi < job.queue.length) {
        const id = job.queue[job.qi]; const url = `${BASE}wUsedShopC2CAnswer.aspx?questionid=${id}`;
        setNow(`묻고 답하기 상세 ${id} 불러오는 중`);
        const { doc } = await fetchDoc(url, { expect: (d) => !!d.querySelector('#divQuestion') });
        const d = P.parseQnaDetail(doc, url);
        if (!d.answer) { const ta = doc.querySelector('#txtAnswer'); const v = ta ? String(ta.value || ta.textContent || '').trim() : ''; if (v) d.answer = v; }
        if (!d.answer) { // 우리 답변은 '수정하기' 화면(method=edit)의 답변 입력칸(#txtAnswer)에 있음
          const e2 = await fetchDoc(`${BASE}wUsedShopC2CAnswer.aspx?questionid=${id}&method=edit`, { expect: (x) => !!x.querySelector('#divQuestion, #txtAnswer') });
          const ta = e2.doc.querySelector('#txtAnswer'); const v = ta ? String(ta.value || ta.textContent || '').trim() : ''; if (v) { d.answer = v; d.answerFrom = 'edit'; } }
        { const o = await dbGet('qnaDetail', id); const ql = await dbGet('qnaList', id); const rec = { _key: id, ...d, listStatus: ql ? ql.answered ?? null : null, collectedAt: now(), parserVersion: P.VERSION };
          if (o) { rec.firstCollectedAt = o.firstCollectedAt || o.collectedAt || null; for (const k of Object.keys(o)) if ((rec[k] === null || rec[k] === undefined || rec[k] === '') && o[k] !== null && o[k] !== undefined && o[k] !== '') rec[k] = o[k]; // 새로 읽은 값이 비면 먼저 받은 값 유지
            rec.answerHistory = o.answerHistory || []; if (o.answer && d.answer && o.answer !== d.answer) rec.answerHistory = [...rec.answerHistory, { answer: o.answer, until: now() }]; }
          else rec.firstCollectedAt = now();
          await dbPut('qnaDetail', rec); }
        job.qi += 1; if (job.qi % 5 === 0 || job.qi === job.queue.length) await saveJob(job);
        progress('묻고 답하기 상세', job.qi, job.queue.length);
        setNow(`묻고 답하기 ${id} (${fmtDate(d.createdDate)}): ${d.title || '상품 정보 없음'}${d.answer ? ', 답변 있음' : ', 미답변'}`);
      }
    }
    job.status = 'done'; job.finishedAt = now(); if (job.mode === 'full') job.fullDoneAt = now(); await saveJob(job); shareJobDone(job); log('묻고 답하기 완료', 'ok');
    await uploadQnaNow();
  }
  // 묻고 답하기는 수집이 끝나면 바로 Firebase에 올림 (전체 올리기를 기다리지 않음). 답변여부 = 샵매니저 목록 행 5번째 칸 그대로
  async function uploadQnaNow() {
    const list = await dbAll('qnaList'); const det = new Map((await dbAll('qnaDetail')).map((d) => [d._key, d]));
    const cnt = {}; list.forEach((r) => { const k = r.answered == null ? '(빈칸)' : r.answered; cnt[k] = (cnt[k] || 0) + 1; });
    log(`묻고 답하기 목록 ${list.length}건의 답변여부: ${Object.entries(cnt).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    if (!fbUser || !fdb) { log('Firebase 로그인이 안 되어 묻고 답하기를 올리지 못했습니다 (구글 로그인 후 다시)', 'err'); return; }
    const sent = new Map((await dbAll('uploaded')).filter((u) => u._key.startsWith('qnaNow/')).map((u) => [u._key, u.hash]));
    const todo = [];
    list.forEach((r) => { const q = det.get(r._key) || {}; const cid = q.customerKey ? `aladin_${q.customerKey}` : null;
      const data = { type: 'qna', platform: 'aladin', questionId: r._key, answerStatus: r.answered ?? null, authorMasked: q.authorMasked || r.authorMasked || null, body: q.question || r.question || null, createdAt: q.createdDate || r.createdDate || null };
      if (q._key) Object.assign(data, { customerId: cid, orderId: q.orderNo ? `aladin_${q.orderNo}` : null, itemId: q.itemId ?? null, title: q.title ?? null, condition: q.condition ?? null, answer: q.answer ?? null });
      Object.keys(data).forEach((k) => { if (data[k] === null || data[k] === undefined || data[k] === '') delete data[k]; }); // 빈 값은 안 보냄 → 서버의 기존 값 유지
      const h = hashStr(stableStr(data)); if (sent.get('qnaNow/' + r._key) !== h) todo.push({ id: r._key, data, h }); });
    if (!todo.length) { log('묻고 답하기: 지난번에 올린 것과 같아 올릴 것 없음', 'ok'); return; }
    const stamp = FB.firestore.FieldValue.serverTimestamp(); let n = 0;
    for (let i = 0; i < todo.length; i += 300) { const part = todo.slice(i, i + 300); const b = fdb.batch();
      part.forEach((t) => { b.set(fdb.collection('crm_interactions').doc(`aladin_qna_${t.id}`), { ...t.data, uploadedAt: stamp, uploaderVersion: APP_VER, writerSchema: WRITER_SCHEMA, lastWrittenBy: PC.name || '' }, { merge: true }); n++; });
      await commitWithRetry(b, part.length); await dbPut('uploaded', part.map((t) => ({ _key: 'qnaNow/' + t.id, hash: t.h, at: now() }))); }
    log(`묻고 답하기 ${n}건(새것·바뀐 것만)을 Firebase에 올렸습니다 — 전체 ${list.length}건`, 'ok');
  }

  /* ════════ 4) 구매평 ════════ */
  async function taskReviews() {
    const job = await loadJob('reviews');
    if (isFresh(job)) { await syncRemoteJob(job); startJob(job); }
    job.status = 'running'; await saveJob(job);
    await crawlPages(job, (p) => `${BASE}wShopSurveySellerList.aspx?page=${p}`, async (doc) => {
      const occ = {}; const rows = P.parseReviewList(doc).map((r) => {
        const b = `${r.orderNo}|${r.title}|${r.createdDate}`; occ[b] = (occ[b] || 0) + 1;
        return { _key: `${b}|${occ[b]}`, ...r, collectedAt: now() };
      });
      const old = await dbGetMany('reviews', rows.map((r) => r._key));
      rows.forEach((r) => { const o = old.get(r._key); r.firstCollectedAt = (o && (o.firstCollectedAt || o.collectedAt)) || now(); });
      if (rows.length) await dbPut('reviews', rows);
      return { count: rows.length, firstKey: rows[0] && rows[0]._key, allKnown: rows.every((r) => old.has(r._key)), summary: `구매평 ${rows.length}건` };
    }, '구매평');
    job.status = 'done'; job.finishedAt = now(); if (job.mode === 'full') job.fullDoneAt = now(); await saveJob(job); shareJobDone(job); log('구매평 완료', 'ok');
  }

  /* ════════ 5) 검증 (자동 수정 없이 '확인 필요'만 기록) ════════ */
  async function taskVerify() {
    setNow('수집 결과 검증 중'); progress('검증', 0, 1);
    const old = (await dbAll('issues')).filter((i) => i.type.startsWith('V_')).map((i) => i._key); if (old.length) await dbDelete('issues', old);
    const lines = await dbAll('orderLines'); const popups = new Map((await dbAll('popups')).map((p) => [p._key, p]));
    const byOrder = (kind) => { const m = {}; lines.filter((l) => l.kind === kind).forEach((l) => (m[l.orderNo] = m[l.orderNo] || []).push(l)); return m; };
    const sale = byOrder('sale'); const cancel = byOrder('cancel'); let n = 0;
    for (const [ono, ls] of Object.entries(sale)) {
      const p = popups.get(ono);
      if (!p) { await addIssue('V_NO_POPUP', ono, '주문 상세를 아직 받지 못함'); n++; continue; }
      const m = P.matchListToPopup(ls, p);
      if (m.countMismatch) { await addIssue('V_LINE_COUNT', ono, `목록 ${ls.length}줄 / 상세 ${p.items.length}개 (주문 안 취소 ${p.items.length - (m.activeItemCount ?? p.items.length)}개 제외 시 ${m.activeItemCount ?? p.items.length}개)`); n++; }
      const sum = ls.reduce((s, l) => s + (l.price || 0) * (l.qty || 1), 0);
      if (p.totalAmount != null && sum !== p.totalAmount) { await addIssue('V_TOTAL', ono, `판매가 합계 ${sum} / 판매총액 ${p.totalAmount}`); n++; }
      if (p.orderStatus && p.orderStatus !== '정상') { await addIssue('V_STATUS', ono, `주문상태: ${p.orderStatus}`); n++; }
      const odd = ls.filter((l) => l.rowStatus && l.rowStatus !== '정상'); if (odd.length) { await addIssue('V_ROW_STATUS', ono, odd.map((l) => `${l.title}: ${l.rowStatus}${l.returnReason ? ' / ' + l.returnReason : ''}`).join('; ')); n++; }
    }
    for (const ono of Object.keys(cancel)) if (sale[ono]) { await addIssue('V_CANCEL_OVERLAP', ono, '판매 목록과 취소 목록에 모두 있음 (부분취소 등 확인 필요)'); n++; }
    // 샵매니저 표시 건수와 비교 (표시 건수가 줄 수인지 수량 합인지 몰라 둘 다 계산)
    for (const [jobName, grp, label] of [['orders', sale, '판매'], ['cancels', cancel, '취소']]) {
      const j = await loadJob(jobName); const all = Object.values(grp).flat();
      const nLines = all.length; const nQty = all.reduce((s, l) => s + (l.qty || 1), 0);
      if (j.total) await dbPut('meta', { _key: `count_${jobName}`, shown: j.total, lines: nLines, qty: nQty, at: now() });
      if (j.total && nLines < j.total && nQty < j.total) { await addIssue('V_COUNT', jobName, `${label}: 수집 ${nLines}줄(수량 합 ${nQty}) / 샵매니저 표시 ${j.total}건`); n++; }
    }
    await dbPut('meta', { _key: 'lastVerify', at: now(), issues: n });
    progress('검증', 1, 1); setNow(`검증 끝: 확인 필요 ${n}건`); log(`검증 완료: 확인 필요 ${n}건`, n ? 'warn' : 'ok');
  }

  /* ════════ 6) Firebase 올리기 (통합 프로젝트 readnow-3a385) ════════
   * 구조 (ERP 이전 시 orders.items는 order_items 표로 분리):
   *   crm_customers/{aladin_고객번호}   고객 요약·연락처 목록 (flags·메모는 웹앱에서 관리, 업로더는 건드리지 않음)
   *   crm_orders/{aladin_주문번호}      주문 + items[] (상품 줄마다 상태: normal/cancelled/returned/…)
   *   crm_interactions/{id}            묻고 답하기·구매평 (나중에 관리자 메모도 여기)
   *   crm_orderEvents/{aladin_return_클레임번호}  반품 이력
   */
  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385',
    storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15',
  };
  const FB = (typeof firebase !== 'undefined' && firebase) || window.firebase || null;
  let fbUser = null; let fdb = null;
  if (FB) {
    try {
      if (!FB.apps.length) FB.initializeApp(FIREBASE_CONFIG);
      fdb = FB.firestore();
      FB.auth().onAuthStateChanged((u) => { fbUser = u; if (u) { watchUsage(); watchLock(); } render(); });
    } catch (e) { console.error(e); }
  }
  // 로그인: 구글 창 방식(기본). 창 방식이 이 환경에서 안 되면 Firebase 전용 이메일·비밀번호 방식 사용.
  let fbLoggingIn = false;
  async function fbLogin() {
    if (!FB) { alert('Firebase 파일을 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침해 주세요.'); return; }
    if (fbLoggingIn) {
      if (Date.now() - fbLoggingIn < 40000) { log('로그인 창이 이미 열려 있습니다. 작업표시줄에 새 크롬 창이 떠 있는지 확인해 주세요.', 'warn'); return; }
      log('앞의 로그인 창을 취소하고 새로 엽니다.', 'warn');
    }
    fbLoggingIn = Date.now(); render();
    const myTry = fbLoggingIn;
    // 40초 안에 결과가 없으면(창이 안 보이거나 막힌 경우) 다시 시도할 수 있게 풀어 줌
    setTimeout(() => { if (fbLoggingIn === myTry && !fbUser) { fbLoggingIn = false; render(); log('로그인 창에서 40초 동안 응답이 없습니다. ① 작업표시줄에 뒤로 숨은 크롬 창이 있는지 ② 주소창 오른쪽에 팝업 차단 표시가 있는지 확인한 뒤 다시 눌러 주세요. 계속 안 되면 이 페이지를 새로고침하고 다시 시도하세요.', 'warn'); } }, 40000);
    const pc = GM_getValue('rn-fbmode', 'google') === 'password' ? GM_getValue('rn-fbpw', null) : null; // 기본은 구글 로그인
    try {
      if (pc && pc.email && pc.pw) {
        log('Firebase 전용 계정으로 로그인하는 중');
        await FB.auth().signInWithEmailAndPassword(pc.email, pc.pw);
      } else {
        log('구글 로그인 창을 여는 중입니다. 뜨는 창에서 계정을 한 번만 골라 주세요.');
        await FB.auth().signInWithPopup(new FB.auth.GoogleAuthProvider());
      }
      log(`Firebase 로그인: ${FB.auth().currentUser.email}`, 'ok');
    } catch (e) {
      const c = e.code || '';
      const why = {
        'auth/cancelled-popup-request': '로그인 창이 두 번 열리려 해서 앞의 것이 취소됐습니다.',
        'auth/popup-closed-by-user': '계정을 고르기 전에 로그인 창이 닫혔습니다.',
        'auth/popup-blocked': '크롬이 로그인 창을 막았습니다. 주소창 오른쪽의 팝업 차단 아이콘에서 www.aladin.co.kr 팝업을 허용해 주세요.',
        'auth/unauthorized-domain': 'Firebase 콘솔 → Authentication → 설정 → 승인된 도메인에 www.aladin.co.kr 을 추가해야 합니다.',
        'auth/operation-not-allowed': 'Firebase 콘솔 → Authentication → 로그인 방법에서 이 방식이 꺼져 있습니다.',
        'auth/invalid-credential': 'Firebase 전용 이메일 또는 비밀번호가 틀립니다.',
        'auth/network-request-failed': '인터넷 연결 또는 Firebase 접속에 실패했습니다.',
      }[c];
      log(`로그인 실패 (${c || e.message})${why ? ': ' + why : ''}`, 'err');
      if (pc && /invalid-credential|wrong-password|user-not-found|invalid-email/.test(c)) log("설정의 '로그인 방식'을 '구글 계정'으로 바꾸면 구글 로그인 창으로 들어갈 수 있습니다.", 'warn');
    } finally { if (fbLoggingIn === myTry) fbLoggingIn = false; render(); }
  }

  const docHash = (d) => hashStr(JSON.stringify({ ...d.data, source: undefined, piiCollectedAt: undefined })); // 수집 시각만 바뀐 문서는 다시 올리지 않음
  const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + ':' + s.length; };
  const clean = (o) => JSON.parse(JSON.stringify(o)); // undefined 제거
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];

  /* ── 엑셀·구글 시트 해석 (순수 함수) ── */
  const isDateLike = (v) => v instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(String(v || ''));
  function kDate(v) { // "2025-10-26 오후 11:22:23" / Date / 엑셀 날짜 숫자 → "2025-10-26T23:22"
    if (v == null || v === '') return null;
    if (v instanceof Date) { const z = (x) => String(x).padStart(2, '0'); return `${v.getFullYear()}-${z(v.getMonth() + 1)}-${z(v.getDate())}` + (v.getHours() || v.getMinutes() ? `T${z(v.getHours())}:${z(v.getMinutes())}` : ''); }
    if (typeof v === 'number' && v > 30000 && v < 80000) return kDate(new Date(Math.round((v - 25569) * 864e5) + new Date().getTimezoneOffset() * 60000));
    const s = String(v).trim();
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(오전|오후)?\s*(\d{1,2}):(\d{2}))?/);
    if (m) { let h = m[5] != null ? parseInt(m[5], 10) : null; if (h != null && m[4] === '오후' && h < 12) h += 12; if (h != null && m[4] === '오전' && h === 12) h = 0; return `${m[1]}-${m[2]}-${m[3]}` + (h != null ? `T${String(h).padStart(2, '0')}:${m[6]}` : ''); }
    m = s.match(/^(\d{2,4})\.\s*(\d{1,2})\.\s*(\d{1,2})/); if (m) { const y = m[1].length === 2 ? '20' + m[1] : m[1]; return `${y}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`; }
    return null;
  }
  const numOrNull = (v) => { if (v == null || v === '') return null; if (typeof v === 'number') return v; const n = parseInt(String(v).replace(/[^\d-]/g, ''), 10); return Number.isFinite(n) ? n : null; };
  const strOrNull = (v) => { if (v == null) return null; const s = String(v).replace(/\u00a0/g, ' ').trim(); return s ? s : null; };
  const stripUsed = (t) => (t || '').replace(/^\s*\[중고[^\]]*\]\s*/, '').trim();
  const normTitle = (t) => stripUsed(t).replace(/\s+/g, '').toLowerCase();
  const zip5 = (v) => { const s = strOrNull(v); return s && /^\d{4,5}$/.test(s.replace(/\.0$/, '')) ? s.replace(/\.0$/, '').padStart(5, '0') : null; };
  const phonesIn = (s) => (String(s || '').match(/0\d{1,2}-?\d{3,4}-?\d{4}/g) || []).map((x) => x.replace(/\D/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3'));
  const platformOf = (ono, status) => (/^\d{3}-A\d+/.test(ono || '') ? 'aladin' : /^Y/i.test(ono || '') || /yes|예스/i.test(status || '') ? 'yes24' : /입금|직접|무통장/.test(status || '') ? 'direct' : ono ? 'unknown' : 'direct');

  // 판매완료 엑셀: 행마다 열이 어긋났는지 내용으로 판별해 스스로 맞춘다.
  //  앞 구간(수령인~수수료)은 날짜·금액 칸 위치로, 뒤 구간(우편번호~요청사항)은 우편번호·주소·전화 칸 위치로 각각 맞춤.
  const isNumLike = (v) => typeof v === 'number' || /^[\d,]+$/.test(String(v ?? '').trim());
  const isZipLike = (v) => /^\d{4,5}(\.0)?$/.test(String(v ?? '').trim());
  const isAddrLike = (v) => /(시|도|구|군|로|길)\s/.test(String(v ?? ''));
  const isPhoneLike = (v) => /0\d{1,2}-\d{3,4}-\d{4}|^--$|^0+-0+-0+$/.test(String(v ?? '').trim());
  function bestOffset(r, scoreAt, min) { let best = null; for (let o = -2; o <= 3; o++) { const sc = scoreAt(o); if (!best || sc > best.sc) best = { o, sc }; } return best.sc >= min ? best.o : null; }
  function parseSalesExcel(aoa) {
    const out = []; const seen = new Set(); let dup = 0; let skipped = 0; let realigned = 0; let manualN = 0; const occ = {};
    for (let i = 1; i < aoa.length; i++) {
      const r0 = aoa[i]; if (!r0 || !r0.some((c) => c != null && c !== '')) continue;
      const r = [...r0, null, null, null, null, null];
      const o1 = bestOffset(r, (o) => (isDateLike(r[11 + o]) ? 2 : 0) + (isDateLike(r[12 + o]) ? 1 : 0) + (isNumLike(r[13 + o]) ? 1 : 0), 3);
      const o2 = bestOffset(r, (o) => (isZipLike(r[21 + o]) ? 2 : 0) + (isAddrLike(r[22 + o]) ? 2 : 0) + (isPhoneLike(r[23 + o]) ? 1 : 0) + (isPhoneLike(r[24 + o]) ? 1 : 0), 3);
      const manual = o1 == null;
      if (manual && !strOrNull(r[3])) { skipped++; continue; } // 제목도 날짜도 없는 행만 버림
      const a = o1 ?? o2 ?? 0; const b2 = o2 ?? a;
      if (a !== 0 || b2 !== 0) realigned++; if (manual) manualN++;
      const sig = JSON.stringify(r0); if (seen.has(sig)) { dup++; continue; } seen.add(sig);
      const ono = strOrNull(r[1]); const status = strOrNull(r[0]);
      const line = { orderNo: ono, platform: platformOf(ono, status), status, sku: strOrNull(r[2]), rawTitle: strOrNull(r[3]), title: stripUsed(r[3]),
        aladinUsedCode: strOrNull(r[4]), isbnAlt: strOrNull(r[5]), isbn13: strOrNull(r[6]) ? String(r[6]).replace(/\.0$/, '') : null, publisher: strOrNull(r[7]),
        qty: numOrNull(r[8]) || 1, buyerName: strOrNull(r[9]), recipientName: strOrNull(r[10 + a]), orderedAt: kDate(r[11 + a]), paidAt: kDate(r[12 + a]),
        price: numOrNull(r[13 + a]), fee: numOrNull(r[15 + a]), memo: strOrNull(r[20 + b2]), zip: zip5(r[21 + b2]), address: strOrNull(r[22 + b2]),
        phone1: P.normPhone(strOrNull(r[23 + b2]) || ''), phone2: P.normPhone(strOrNull(r[24 + b2]) || ''), shippingRequest: strOrNull(r[25 + b2]), note: strOrNull(r[28 + b2]),
        alignment: { front: o1, back: o2 }, manual, excelRow: i + 1 };
      if (manual) { line.price = line.price ?? numOrNull(r[2]) ?? numOrNull(r[13]); if (line.sku && /원$/.test(line.sku)) line.sku = null; }
      if (line.recipientName && isDateLike(line.recipientName)) line.recipientName = null;
      const odd = [r[18 + b2], r[19 + b2]].map(strOrNull).filter((x) => x && !/택배|^\d+$/.test(x)); if (odd.length) line.cellNotes = odd; // 택배사·송장 칸에 적힌 메모
      const k = `${ono || 'noorder-' + line.orderedAt}|${line.isbn13 || line.title}|${line.price}`; occ[k] = (occ[k] || 0) + 1;
      line._key = `${k}|${occ[k]}`; out.push(line);
    }
    return { lines: out, dup, skipped, realigned, manual: manualN };
  }

  // 구글 시트 (고객 쪽 세 시트만)
  function parsePurchaseCell(v) { // "제목\n상, 12000원, 1개\n2026.01.08 10:51 등록\n9788988295205  (BLKCMN)"
    const lines = String(v || '').split(/\n/).map((x) => x.trim()).filter(Boolean); const items = []; let cur = null;
    for (const l of lines) {
      let m;
      if ((m = l.match(/^(최상|상|중|하)\s*,\s*([\d,]+)원\s*,\s*(\d+)개/))) { if (cur) Object.assign(cur, { condition: m[1], price: numOrNull(m[2]), qty: +m[3] }); }
      else if ((m = l.match(/(\d{4}\.\d{2}\.\d{2}\s+\d{1,2}:\d{2})\s*등록/))) { if (cur) cur.registeredAt = kDate(m[1].replace(/\./g, '-').replace(/-(\d{2}\s)/, '-$1')); }
      else if ((m = l.match(/^(\d{13})\s*\(([^)]+)\)/))) { if (cur) Object.assign(cur, { isbn13: m[1], sku: m[2].trim() }); }
      else { cur = { title: stripUsed(l), rawTitle: l }; items.push(cur); }
    }
    return items;
  }
  function parseCustomerSheets(wbSheets) {
    const rows = []; const found = [];
    const S = (name, head) => { const k = Object.keys(wbSheets).find((n) => n.replace(/\s/g, '') === name.replace(/\s/g, '')); if (!k) return null; found.push(k);
      const aoa = wbSheets[k]; const h = aoa.findIndex((r) => r && String(r[0] || '').trim() === head); return h >= 0 ? aoa.slice(h) : aoa; }; // 제목 행 위의 빈 행 건너뜀
    const push = (type, sheet, i, rec, raw) => rows.push({ _key: `${type}_${hashStr(JSON.stringify(raw)).split(':')[0]}`, type, sheet, sheetRow: i + 1, ...rec, raw: raw.map((c) => (c instanceof Date ? kDate(c) : c)).filter((c, j, a) => j < 14) });
    const c = S('고객 취소 목록', '주문일');
    if (c) c.slice(1).forEach((r, i) => { if (!r || !r.some((x) => x != null && x !== '')) return;
      const items = parsePurchaseCell(r[3]); if (items[0] && !items[0].isbn13 && r[2]) items[0].isbn13 = String(r[2]).replace(/\.0$/, '');
      if (items[0] && items[0].price == null) items[0].price = numOrNull(r[4]); if (items[0] && !items[0].sku) items[0].sku = strOrNull(r[5]);
      const addr = strOrNull(String(r[10] || '').replace(/\s*\n\s*/g, ' ')); const zm = addr && addr.match(/\((\d{5})\)/);
      push('customerCancel', '고객 취소 목록', i + 1, { date: kDate(r[0]), paidAt: kDate(r[1]), items, buyerName: strOrNull(r[6]), recipientName: strOrNull(r[7]),
        phones: phonesIn(r[8]), zip: zip5(r[9]) || (zm ? zm[1] : null), address: addr ? addr.replace(/\(\d{5}\)/, '').trim() : null, email: strOrNull(r[11]), note: strOrNull(r[12]) }, r); });
    const b = S('블랙리스트', '차단 날짜');
    if (b) b.slice(1).forEach((r, i) => { if (!r || !r.some((x) => x != null && x !== '')) return;
      push('blacklist', '블랙리스트', i + 1, { date: kDate(r[0]), idMasked: strOrNull(r[1]), items: parsePurchaseCell(r[2]), total: numOrNull(r[3]), reason: strOrNull(r[4]),
        name: strOrNull(r[5]), email: strOrNull(r[6]), phones: phonesIn(`${r[7] || ''} ${r[8] || ''}`), address: strOrNull(String(r[8] || '').replace(/\s*\n\s*/g, ' ')), extra: strOrNull(r[9]) }, r); });
    const e = S('기타 고객', '관련 상품');
    if (e) e.slice(1).forEach((r, i) => { if (!r || !r.some((x) => x != null && x !== '')) return;
      const emails = String(`${r[6] || ''} ${r[3] || ''}`).match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || [];
      push('otherCustomer', '기타 고객', i + 1, { items: [{ title: stripUsed(r[0]), rawTitle: strOrNull(r[0]) }], date: kDate(r[1]), scope: strOrNull(r[2]), body: strOrNull(r[3]),
        idMasked: strOrNull(r[4]), name: strOrNull(r[5]), email: emails[0] || strOrNull(r[6]) }, r); });
    // 판매자 시트 3개 (전문셀러·개인셀러·허위 매물) → 판매자 기록
    for (const [sheetName, grade] of [['전문셀러', 'pro'], ['개인셀러', 'personal'], ['허위 매물', 'fake']]) {
      const k = Object.keys(wbSheets).find((n) => n.replace(/\s/g, '') === sheetName.replace(/\s/g, '')); if (!k) continue; found.push(k);
      const aoa = wbSheets[k]; const h = aoa.findIndex((r) => r && String(r[0] || '').trim() === '이름'); const body = h >= 0 ? aoa.slice(h + 1) : aoa;
      body.forEach((r, i) => {
        if (!r || !strOrNull(r[0])) return;
        const nm = String(r[0]).split(/\n/)[0].trim();
        const n = (v) => (v == null || v === '' || v === '-' ? null : typeof v === 'number' ? v : Number.isFinite(parseFloat(String(v).replace(/,/g, ''))) ? parseFloat(String(v).replace(/,/g, '')) : strOrNull(v));
        const pct = (v) => { const x = n(v); return typeof x === 'number' ? (x > 1 ? x / 100 : x) : null; };
        const cats = [[2, 3], [4, 5], [6, 7], [8, 9]].map(([a, b]) => (strOrNull(r[a]) ? { name: String(r[a]).trim(), count: n(r[b]) } : null)).filter(Boolean);
        const comp = strOrNull(r[25]); const parts = comp ? comp.split(/\s*,\s*/) : [];
        rows.push({ _key: `seller_${hashStr(sheetName + '|' + nm).split(':')[0]}`, type: 'seller', sheet: k, sheetRow: (h >= 0 ? h + 2 : 1) + i, name: nm, grade,
          stock: n(r[1]), topCategories: cats, freeShipping: n(r[10]), shippingFee: n(r[11]), expectDays: n(r[12]), actualDays: n(r[13]), lowPrice: n(r[14]),
          rating6m: pct(r[15]), ratingAll: pct(r[16]), reviews6m: n(r[17]), reviewsAll: n(r[18]), neutral6m: n(r[19]), neutralAll: n(r[20]), bad6m: n(r[21]), badAll: n(r[22]),
          outstockRate: pct(r[23]), notice: strOrNull(r[24]), company: parts[0] || null, owner: parts[1] || null, phone: strOrNull(r[26]), email: strOrNull(r[27]), bizNo: strOrNull(r[28]),
          mailOrderNo: strOrNull(r[29]), address: strOrNull(r[30]), courier: strOrNull(r[31]), asPhone: strOrNull(r[32]), returnAddress: strOrNull(r[33]), returnGuide: strOrNull(r[34]), remark: strOrNull(r[36]) });
      });
    }
    return { rows, found };
  }


  /* ── 고객 점수: 소매·전자상거래에서 널리 쓰는 RFM(최근성·빈도·금액) + 참여도·거래기간을 '가치 점수'로,
   *    취소·반품·대행 의심·문의 부담·기록을 '주의 점수'로 계산. 기준을 바꾸면 SCORE_VER를 올림 ── */
  const SCORE_VER = 2;
  const SCORE_DEFAULTS = { vip: { minValue: 65, maxRisk: 25, minOrders: 3, excludeSellers: true }, caution: { minRisk: 35 } };
  let SCORE_RULES = JSON.parse(JSON.stringify(SCORE_DEFAULTS));
  async function loadScoringConfig() { try { const d = await fdb.collection('crm_system').doc('scoring').get(); if (d.exists) { const x = d.data(); SCORE_RULES = { vip: { ...SCORE_DEFAULTS.vip, ...(x.vip || {}) }, caution: { ...SCORE_DEFAULTS.caution, ...(x.caution || {}) } }; } } catch (e) {} }
  let sellerLinkMap = new Map(); // customerId → [{name, grade}] (판매자 시트와 연결된 고객)
  function scoreCustomer(c, todayIso) {
    const today = todayIso ? new Date(todayIso) : new Date();
    const days = (iso) => (iso ? Math.floor((today - new Date(String(iso).slice(0, 10))) / 864e5) : null);
    const won = (n) => `${Math.round(n || 0).toLocaleString()}원`;
    const V = []; const R = [];
    const orders = c.saleOrderCount || 0; const amt = c.salesAmount || 0; const last = days(c.lastSaleAt || c.lastOrderAt);
    // 가치 ① 최근성 (25)
    let r = 0; if (orders) r = last <= 30 ? 25 : last <= 90 ? 20 : last <= 180 ? 14 : last <= 365 ? 8 : 3;
    V.push({ k: 'recency', label: '최근성', pts: r, max: 25, text: orders ? `마지막 구매 ${last}일 전` : '구매 없음' });
    // ② 빈도 (25)
    const f = orders >= 10 ? 25 : orders >= 5 ? 20 : orders >= 3 ? 15 : orders === 2 ? 10 : orders === 1 ? 5 : 0;
    V.push({ k: 'frequency', label: '구매 빈도', pts: f, max: 25, text: `구매 주문 ${orders}회` });
    // ③ 금액 (30)
    const m = amt >= 300000 ? 30 : amt >= 150000 ? 27 : amt >= 70000 ? 22 : amt >= 30000 ? 16 : amt >= 10000 ? 10 : amt > 0 ? 5 : 0;
    V.push({ k: 'monetary', label: '누적 매출', pts: m, max: 30, text: `순매출 ${won(amt)}` });
    // ④ 참여도: 구매확정·평가 비율 (10)
    const rv = c.reviewCount || 0; const rr = orders ? rv / orders : 0;
    const e = rr >= 0.5 ? 10 : rr >= 0.25 ? 7 : rv > 0 ? 4 : 0;
    V.push({ k: 'engagement', label: '구매확정·평가', pts: e, max: 10, text: `평가 ${rv}건${orders ? ` (주문 대비 ${Math.round(rr * 100)}%)` : ''}` });
    // ⑤ 거래 기간 (10): 재구매 고객만
    const span = orders >= 2 && c.firstOrderAt && c.lastOrderAt ? Math.floor((new Date(String(c.lastOrderAt).slice(0, 10)) - new Date(String(c.firstOrderAt).slice(0, 10))) / 864e5 / 30) : 0;
    const t = span >= 12 ? 10 : span >= 6 ? 7 : span >= 3 ? 4 : 0;
    V.push({ k: 'tenure', label: '거래 기간', pts: t, max: 10, text: orders >= 2 ? `첫 주문부터 ${span}개월` : '재구매 없음' });
    // 주의 ① 고객 취소율 (35): 판매 전 취소 + 고객 취소 (우리 품절 취소는 제외)
    const cancels = (c.cancelOrderCount || 0); const crate = cancels / Math.max(1, orders + cancels);
    // 한 번 취소는 흔한 일이라 가볍게, 반복될수록 무겁게
    let cp = 0; if (cancels === 1) cp = 5; else if (cancels >= 2) cp = crate >= 0.5 ? (cancels >= 3 ? 35 : 25) : crate >= 0.3 ? 20 : crate >= 0.15 ? 12 : 6; if (cancels >= 5) cp = Math.max(cp, 25);
    R.push({ k: 'cancel', label: '고객 취소', pts: cp, max: 35, text: `취소 ${cancels}건 (취소율 ${Math.round(crate * 100)}%)` });
    // ② 반품 (25)
    const rt = c.returnCount || 0; const rp = rt >= 2 ? 25 : rt === 1 ? 15 : 0;
    R.push({ k: 'return', label: '반품', pts: rp, max: 25, text: `반품 ${rt}건` });
    // ③ 대행·되팔이 의심 (20)
    const oth = c.otherRecipientCount || 0; const ap = oth >= 30 ? 35 : oth >= 10 ? 25 : oth >= 3 ? 12 : 0;
    R.push({ k: 'agent', label: '대행 의심', pts: ap, max: 35, text: `주문인과 다른 수령인 ${oth}명` });
    // ④ 문의 부담 (10)
    const q = c.qnaCount || 0; const qp = q >= 5 && q >= orders ? 10 : q >= 3 && orders === 0 ? 6 : 0;
    R.push({ k: 'inquiry', label: '문의 부담', pts: qp, max: 10, text: `문의 ${q}건 / 구매 ${orders}회` });
    // ⑤ 기록된 문제 (10): 구글 시트의 고객 취소·불만 기록
    const cn = c.cancelNoteCount || 0; const np = cn >= 1 ? 10 : 0;
    R.push({ k: 'record', label: '기록된 문제', pts: np, max: 10, text: `취소·불만 기록 ${cn}건` });
    // ⑥ 판매자 연결 (30): 허위 매물 판매자와 연결되면 되팔이·대행 가능성이 매우 큼
    const sl = (sellerLinkMap.get(c.customerId) || []).filter((x) => x.strong !== false); const hasFake = sl.some((x) => x.grade === 'fake'); // 이메일이 비슷하기만 한 약한 연결은 점수에 넣지 않음
    const sp = hasFake ? 30 : sl.length ? 15 : 0;
    R.push({ k: 'seller', label: '판매자 연결', pts: sp, max: 30, text: sl.length ? `판매자 ${sl.map((x) => x.name).slice(0, 3).join(', ')}${hasFake ? ' (허위 매물)' : ''}` : '연결 없음' });
    const value = V.reduce((s, x) => s + x.pts, 0); const risk = Math.min(100, R.reduce((s, x) => s + x.pts, 0));
    const top = (arr) => arr.filter((x) => x.pts > 0).sort((a, b) => b.pts - a.pts).slice(0, 3).map((x) => `${x.label}: ${x.text}`);
    const vipOn = value >= SCORE_RULES.vip.minValue && risk < SCORE_RULES.vip.maxRisk && orders >= SCORE_RULES.vip.minOrders && !(SCORE_RULES.vip.excludeSellers && sl.length);
    const cauOn = risk >= SCORE_RULES.caution.minRisk;
    return {
      scores: { value, risk, valueParts: V, riskParts: R, ver: SCORE_VER, day: today.toISOString().slice(0, 10) },
      autoFlags: {
        vip: { on: vipOn, reasons: vipOn ? [`가치 점수 ${value}점 (기준 ${SCORE_RULES.vip.minValue}점 이상), 주의 점수 ${risk}점`, ...top(V)] : [] },
        caution: { on: cauOn, reasons: cauOn ? [`주의 점수 ${risk}점 (기준 ${SCORE_RULES.caution.minRisk}점 이상)`, ...top(R)] : [] },
      },
    };
  }

  /* ── 고객 요약 계산 (주문·기록 목록 → 고객 문서). 이 PC 데이터로도, Firebase에서 읽은 데이터로도 같은 함수를 씀 ── */
  function aggregateCustomers(orders, inters) {
    const agg = {};
    const get = (cid, plat) => (agg[cid] = agg[cid] || { customerId: cid, platform: plat || null, platformCustomerKey: /^aladin_\d+$/.test(cid) ? cid.slice(7) : null,
      names: [], emails: [], emailsMasked: [], phones: [], addresses: {}, otherRecipients: [], saleOrderCount: 0, saleItemQty: 0, salesAmount: 0, cancelOrderCount: 0, cancelledItemQty: 0, sellerCancelQty: 0, lastSaleAt: null, cancelNoteCount: 0,
      returnCount: 0, firstOrderAt: null, lastOrderAt: null, orderIds: [], platforms: [], qnaCount: 0, reviewCount: 0, noteCount: 0, sheetFlags: null });
    for (const order of orders) {
      if (!order || !order.customerId) continue;
      const c = get(order.customerId, order.platform); const buyer = order.buyer || {}; const rc = order.recipient;
      c.platforms.push(order.platform); c.names.push(buyer.name); c.emails.push(buyer.email); c.emailsMasked.push(buyer.emailMasked); c.phones.push(buyer.phone1, buyer.phone2);
      if (rc && (rc.sameAsBuyer || (rc.name && rc.name === buyer.name))) c.phones.push(rc.phone1, rc.phone2); // 수령인=주문인이면 주문인 연락처
      if (rc && rc.address) {
        const ak = `${rc.zip}|${rc.address}`; const a = c.addresses[ak] = c.addresses[ak] || { zip: rc.zip, address: rc.address, recipientNames: [], recipientPhones: [], useCount: 0, lastUsedAt: null };
        a.recipientNames.push(rc.sameAsBuyer ? buyer.name : rc.name); a.recipientPhones.push(rc.phone1, rc.phone2);
        a.useCount += 1; if (!a.lastUsedAt || (order.orderedAt || '') > a.lastUsedAt) a.lastUsedAt = order.orderedAt;
      }
      if (rc && rc.name && !rc.sameAsBuyer && rc.name !== buyer.name) c.otherRecipients.push(rc.name); // 주문인과 다른 수령인 (대행·업자 판별 단서)
      c.orderIds.push(order._id || `${order.platform}_${order.orderNo}`);
      const items = order.items || [];
      if (order.kind === 'sale') {
        c.saleOrderCount += 1;
        const stp = shipTypeOf(order);
        if (stp === 'free') c.freeShipCount = (c.freeShipCount || 0) + 1; else if (stp === 'paid' || stp === 'remote') { c.paidShipCount = (c.paidShipCount || 0) + 1; c.shipPaidTotal = (c.shipPaidTotal || 0) + (order.shippingFee || 0); }
        items.forEach((it) => { if (it.lineStatus === 'normal') { c.saleItemQty += it.qty || 1; c.salesAmount += (it.price || 0) * (it.qty || 1); } else if (it.lineStatus === 'cancelledInOrder') c.sellerCancelQty += it.qty || 1; /* 우리 품절 취소: 고객 책임 아님 */ else if (/cancel/i.test(it.lineStatus || '')) c.cancelledItemQty += it.qty || 1; else if (it.lineStatus === 'returned') c.returnCount += 1; });
        if (order.orderedAt && (!c.lastSaleAt || order.orderedAt > c.lastSaleAt)) c.lastSaleAt = order.orderedAt;
      } else { c.cancelOrderCount += 1; c.cancelledItemQty += items.reduce((s, it) => s + (it.qty || 1), 0); }
      if (order.orderedAt) { if (!c.firstOrderAt || order.orderedAt < c.firstOrderAt) c.firstOrderAt = order.orderedAt; if (!c.lastOrderAt || order.orderedAt > c.lastOrderAt) c.lastOrderAt = order.orderedAt; }
    }
    for (const it of inters) {
      if (!it || !it.customerId) continue; const c = get(it.customerId, it.platform === 'gsheet' ? null : it.platform);
      if (it.type === 'qna') c.qnaCount += 1; else if (it.type === 'review') c.reviewCount += 1;
      if (it.platform === 'gsheet') { c.noteCount += 1; if (it.type === 'customerCancelNote') c.cancelNoteCount += 1; if (it.type === 'blacklistNote') c.sheetFlags = { ...(c.sheetFlags || {}), blacklist: { since: it.createdAt || null, reason: it.body || null, sheetRow: it.sheetRow || null } }; }
    }
    return Object.values(agg).map((c) => {
      const phones = uniq(c.phones); const names = uniq(c.names); const other = uniq(c.otherRecipients); const oids = uniq(c.orderIds);
      const base = { ...c, platforms: uniq(c.platforms), displayName: names[names.length - 1] || null, names, emails: uniq(c.emails), emailsMasked: uniq(c.emailsMasked), phones,
        phoneKeys: phones.map((x) => x.replace(/\D/g, '')), addresses: Object.values(c.addresses).map((a) => ({ ...a, recipientNames: uniq(a.recipientNames), recipientPhones: uniq(a.recipientPhones) })),
        otherRecipients: other, otherRecipientCount: other.length, orderIds: oids, orderCount: oids.length,
        unresolvedKey: !/^aladin_\d+$/.test(c.customerId), sellerLinks: sellerLinkMap.get(c.customerId) || [] };
      return { ...base, ...scoreCustomer(base) };
    });
  }
  function setSellerLinks(sellers) { sellerLinkMap = new Map(); sellers.forEach((s) => (s.linkedCustomers || []).forEach((l) => { const a = sellerLinkMap.get(l.customerId) || []; a.push({ name: s.name, grade: s.ourGrade || s.grade || null, aladinGrade: s.aladinGrade || null, reasons: l.reasons, level: l.level || null, strong: l.level ? l.level === 'match' : (l.reasons || []).some((r) => r !== '비슷한 이메일') }); sellerLinkMap.set(l.customerId, a); })); }
  async function loadSellerLinks() { try { const ss = await fdb.collection('sellers').get(); const arr = []; ss.forEach((d) => arr.push(d.data())); setSellerLinks(arr); } catch (e) {} }

  // 이 PC에 주문 데이터가 적으면(다른 PC가 주로 수집한 경우) 고객 연결에 쓸 주문을 Firebase에서 내려받음
  let serverOrdersCache = [];
  async function pullServerOrdersIfNeeded() {
    if (!fdb || !fbUser) return;
    try {
      const localN = new Set((await dbAll('orderLines')).map((l) => l.orderNo)).size;
      let serverN; try { serverN = (await fdb.collection('crm_orders').count().get()).data().count; } catch (e) { serverN = null; }
      if (serverN != null && serverN <= localN + 50) return;
      setNow('고객 연결을 위해 Firebase의 주문을 내려받는 중'); const snap = await fdb.collection('crm_orders').get();
      serverOrdersCache = []; snap.forEach((d) => serverOrdersCache.push({ _id: d.id, ...d.data() }));
      log(`이 PC의 주문(${localN.toLocaleString()}건)이 Firebase보다 적어, Firebase 주문 ${serverOrdersCache.length.toLocaleString()}건을 함께 써서 고객을 연결합니다.`);
    } catch (e) { log('Firebase 주문 내려받기 실패: ' + e.message, 'warn'); }
  }
  // 배송비 구분: 무료(우리 부담) / 유료(고객 부담) / 도서산간 / 모름(상세를 못 받은 주문)
  function shipTypeOf(o) {
    if (o.kind !== 'sale') return null; const f = o.shippingFee;
    if (f == null) return 'unknown'; if (f === 0) return 'free';
    if ((o.remoteFee && f >= o.remoteFee) || f >= 6000) return 'remote'; return 'paid';
  }
  // 수집 원본 + 엑셀 + 시트 → 올릴 문서들 (순수 계산, 저장소 읽기만)
  async function buildDocs() {
    const lines = await dbAll('orderLines'); const popups = new Map((await dbAll('popups')).map((p) => [p._key, p]));
    const returns = await dbAll('returns'); const qna = await dbAll('qnaDetail'); const reviews = await dbAll('reviews');
    const excel = await dbAll('excelLines'); const sheetRows = await dbAll('sheetRows'); const sellerRawAll = await dbAll('sellerRaw');
    const byOrder = {}; lines.forEach((l) => { const k = `${l.kind}|${l.orderNo}`; (byOrder[k] = byOrder[k] || []).push(l); });
    const saleOrders = new Set(lines.filter((l) => l.kind === 'sale').map((l) => l.orderNo));
    const scmOrders = new Set(lines.map((l) => l.orderNo));
    const exByOrder = {}; excel.forEach((x) => { if (x.orderNo) (exByOrder[x.orderNo] = exByOrder[x.orderNo] || []).push(x); });
    const docs = []; const orderDocs = [];
    const custIdOf = (p, ono) => (p && p.customerKey ? `aladin_${p.customerKey}` : `aladin_nokey_${ono}`);
    const retByOrder = {}; returns.forEach((r) => (retByOrder[r.orderNo] = retByOrder[r.orderNo] || []).push(r));

    // ① 샵매니저 주문 (+ 엑셀로 빈 개인정보 채움)
    for (const [k, ls] of Object.entries(byOrder)) {
      const [kind, ono] = k.split('|');
      if (kind === 'cancel' && saleOrders.has(ono)) continue;
      ls.sort((a, b) => (a.page - b.page) || (a.seq - b.seq));
      const p = popups.get(ono) || null;
      const m = p ? P.matchListToPopup(ls, p) : { lines: ls.map((r) => ({ row: r, item: null })) };
      const cancelLines = kind === 'sale' ? (byOrder[`cancel|${ono}`] || []) : [];
      const usedCancel = new Set(); const review = [];
      const items = m.lines.map(({ row, item }, i) => {
        const it = { lineNo: i + 1, title: row.title, rawTitle: item ? item.raw : row.rawTitle, condition: item ? item.condition : row.condition,
          option: item ? item.option : null, qty: row.qty, price: row.price, isbn13: item ? item.isbn13 : null, isbnAlt: item ? item.isbnAlt : null,
          sku: item ? item.sku : null, note: item ? item.note : null, popupCancelQty: item ? item.cancelQty || 0 : 0, listStatus: row.rowStatus, cancelQty: row.cancelQty, returnReason: row.returnReason,
          lineStatus: kind === 'cancel' ? 'cancelled' : 'normal' };
        if (kind === 'sale') {
          if (row.rowStatus && row.rowStatus !== '정상') it.lineStatus = 'check';
          if (row.cancelQty) it.lineStatus = row.cancelQty >= (row.qty || 1) ? 'cancelled' : 'partialCancelled';
          const ci = cancelLines.findIndex((c, j) => !usedCancel.has(j) && c.rawTitle === row.rawTitle && c.price === row.price && c.qty === row.qty);
          if (ci >= 0) { usedCancel.add(ci); it.lineStatus = 'cancelled'; it.cancelledAt = cancelLines[ci].cancelRequestedAt || null; }
          const rt = (retByOrder[ono] || []).find((r) => r.title === row.title && (!r.sku || !it.sku || r.sku === it.sku));
          if (rt) { it.returnClaimId = rt.claimId; it.itemId = rt.itemId; if (/완료/.test(rt.status || '')) it.lineStatus = 'returned'; else it.returnStatus = rt.status; }
        }
        return it;
      });
      cancelLines.forEach((c, j) => { if (!usedCancel.has(j)) review.push(`취소 목록의 '${c.title}' (${c.price}원 × ${c.qty})이 판매 줄과 정확히 맞지 않음`); });
      if (p && m.countMismatch) review.push(`목록 ${ls.length}줄 / 상세 ${m.activeItemCount ?? p.items.length}개`);
      if (p && m.leftoverItems && m.leftoverItems.length) m.leftoverItems.forEach((x) => items.push({ lineNo: items.length + 1, title: x.title, rawTitle: x.raw, condition: x.condition, option: x.option, qty: x.qty, cancelQty: x.cancelQty || 0, price: null, isbn13: x.isbn13, isbnAlt: x.isbnAlt, sku: x.sku, note: x.note,
        lineStatus: x.cancelled ? 'cancelledInOrder' : 'check', fromPopupOnly: true }));
      if (p && m.leftoverItems && m.leftoverItems.some((x) => !x.cancelled)) review.push('상세에만 있고 취소 표시도 없는 상품이 있음');
      const first = ls[0];
      const order = {
        _id: `aladin_${ono}`, platform: 'aladin', orderNo: ono, kind: kind === 'sale' ? 'sale' : 'cancelledBeforeSale', customerId: custIdOf(p, ono),
        orderedAt: first.orderedAt || (p && p.orderedDate) || null, paidAt: first.paidAt || null,
        shippedAt: (p && p.shipped && p.shipped.date) || (first.shipped && first.shipped.date) || null,
        shippedRaw: (first.shipped && first.shipped.raw) || (p && p.shipped && p.shipped.raw) || null,
        cancelRequestedAt: kind === 'cancel' ? first.cancelRequestedAt || null : null,
        stage: p ? p.stage : null, orderStatus: p ? p.orderStatus : null, invoiceNo: p ? p.invoiceNo : null,
        totalAmount: p ? p.totalAmount : null, fee: p ? p.fee : null, shippingFee: p ? p.shippingFee : null, ...(p && p.freeRuleText ? { freeRuleText: p.freeRuleText } : {}), ...(p && p.remoteFee ? { remoteFee: p.remoteFee } : {}),
        buyer: p && p.buyer ? { ...p.buyer, emailMasked: first.buyerEmailMasked || null } : { name: first.buyerName || null, email: null, emailMasked: first.buyerEmailMasked || null, phone1: null, phone2: null },
        recipient: p && p.recipient ? p.recipient : (first.recipient && (first.recipient.address || first.recipient.phone2) ? { name: first.recipient.name, phone1: first.recipient.phone1, phone2: first.recipient.phone2, zip: first.recipient.zip, address: first.recipient.address } : null),
        recipientSameAsBuyer: p ? p.recipientSameAsBuyer : null,
        shippingRequest: (p && p.shippingRequest) || (first.recipient && first.recipient.shippingRequest) || null,
        rowNotes: uniq(ls.map((l) => l.rowNote)),
        items, reviewNeeded: review, piiSource: p && p.piiAvailable ? 'scm' : null,
        piiCollectedAt: p ? p.piiCollectedAt || null : null, source: { scmCollectedAt: first.collectedAt, popupCollectedAt: p ? p.collectedAt : null },
      };
      // 작은 정보도 보관: 목록에 남은 수령인 이름('상동'이면 주문인과 같음)
      if (!order.recipient && first.recipientLabel) {
        if (first.recipientLabel === '상동') { order.recipient = { name: null, phone1: null, phone2: null, zip: null, address: null }; order.recipientSameAsBuyer = true; }
        else order.recipient = { name: first.recipientLabel, phone1: null, phone2: null, zip: null, address: null };
        if (order.recipientSameAsBuyer == null) order.recipientSameAsBuyer = first.recipientLabel === '상동' || first.recipientLabel === order.buyer.name;
      }
      // 엑셀 병합: 샵매니저가 지운 수령인 정보 채우기, 상품 보조 정보 붙이기
      const ex = exByOrder[ono] || [];
      if (ex.length) {
        const x0 = ex[0];
        if (!order.recipient || !order.recipient.address) {
          order.recipient = { name: x0.recipientName, phone1: x0.phone1, phone2: x0.phone2, zip: x0.zip, address: x0.address };
          order.recipientSameAsBuyer = !!(x0.recipientName && x0.recipientName === (order.buyer.name || x0.buyerName)); order.piiSource = 'excel';
        }
        if (!order.shippingRequest) order.shippingRequest = x0.shippingRequest;
        if (!order.buyer.name) order.buyer.name = x0.buyerName;
        const used = new Set();
        order.items.forEach((it) => {
          const j = ex.findIndex((x, n) => !used.has(n) && normTitle(x.title) === normTitle(it.title) && (x.price == null || it.price == null || x.price === it.price));
          if (j < 0) return; used.add(j); const x = ex[j];
          Object.assign(it, { publisher: x.publisher || null, aladinUsedCode: x.aladinUsedCode || null, isbn13: it.isbn13 || x.isbn13, isbnAlt: it.isbnAlt || x.isbnAlt, sku: it.sku || x.sku });
          if (x.status && x.status !== '정상') it.excelNote = x.status;
        });
        ex.forEach((x, n) => { if (!used.has(n)) review.push(`엑셀에만 있는 상품: '${x.title}' ${x.price}원`); });
        const notes = uniq(ex.flatMap((x) => [x.memo, x.note, ...(x.cellNotes || []), x.status && x.status !== '정상' ? x.status : null]));
        if (notes.length) order.excelNotes = notes;
        if (order.kind !== 'sale') review.push('엑셀에는 판매로 기록되어 있으나 샵매니저에서는 취소된 주문');
        order.source.excel = true;
      }
      if (order.recipientSameAsBuyer && order.recipient) { // 주문인=수령인 → 주문인 하나로 통합 (연락처는 주문인 쪽으로)
        if (!order.buyer.phone1 && !order.buyer.phone2) { order.buyer.phone1 = order.recipient.phone1; order.buyer.phone2 = order.recipient.phone2; }
        order.recipient = { name: null, phone1: null, phone2: null, zip: order.recipient.zip, address: order.recipient.address, sameAsBuyer: true };
      }
      order.itemCount = order.items.length; // 배송비 구분은 배송비 값으로 계산 (따로 저장하지 않아 기존 주문을 다시 올리지 않음)
      orderDocs.push({ order, pKey: p && p.customerKey ? p.customerKey : null });
    }

    // 전화번호 → 고객 (엑셀 전용 주문을 기존 고객에 연결하는 데 사용)
    const phoneToCust = {};
    const notePhones = (o) => { const r = o.recipient || {}; const same = r.sameAsBuyer || (r.name && r.name === o.buyer.name);
      [o.buyer.phone1, o.buyer.phone2, same ? r.phone1 : null, same ? r.phone2 : null].filter(Boolean).forEach((ph) => { const k = ph.replace(/\D/g, ''); (phoneToCust[k] = phoneToCust[k] || new Set()).add(o.customerId); }); };
    orderDocs.forEach(({ order }) => notePhones(order)); serverOrdersCache.forEach((o) => { if (o && o.buyer) notePhones(o); });

    // ② 엑셀에만 있는 주문 (수집 기간 밖, 예스24, 직접 판매)
    const exOnly = {}; excel.forEach((x) => { if (x.orderNo && scmOrders.has(x.orderNo)) return; const k = x.orderNo || `direct_${(x.orderedAt || '').slice(0, 16)}_${x.recipientName || x.buyerName || ''}`; (exOnly[k] = exOnly[k] || []).push(x); });
    for (const [k, xs] of Object.entries(exOnly)) {
      const x0 = xs[0]; const plat = x0.platform === 'unknown' ? 'aladin' : x0.platform;
      const idBase = String(k).replace(/[\/\s]/g, '_');
      const same = !!(x0.recipientName && x0.recipientName === x0.buyerName);
      const phKeys = [x0.phone1, x0.phone2].filter(Boolean).map((p) => p.replace(/\D/g, ''));
      const cands = [...new Set(phKeys.flatMap((p) => [...(phoneToCust[p] || [])]))];
      const cid = same && cands.length === 1 ? cands[0] : phKeys.length && same ? `phone_${phKeys[phKeys.length - 1]}` : `excel_nokey_${hashStr(idBase).split(':')[0]}`;
      const order = { _id: `${plat}_${idBase}`, platform: plat, orderNo: x0.orderNo, kind: 'sale', customerId: cid, orderedAt: x0.orderedAt, paidAt: x0.paidAt, shippedAt: null, shippedRaw: null,
        stage: null, orderStatus: null, invoiceNo: null, totalAmount: xs.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0), fee: xs.reduce((s, x) => s + (x.fee || 0), 0), shippingFee: null,
        buyer: { name: x0.buyerName, email: null, emailMasked: null, phone1: null, phone2: null },
        recipient: same ? { name: null, phone1: null, phone2: null, zip: x0.zip, address: x0.address, sameAsBuyer: true } : { name: x0.recipientName, phone1: x0.phone1, phone2: x0.phone2, zip: x0.zip, address: x0.address },
        recipientSameAsBuyer: same, shippingRequest: x0.shippingRequest,
        items: xs.map((x, i) => ({ lineNo: i + 1, title: x.title, rawTitle: x.rawTitle, condition: null, qty: x.qty, price: x.price, isbn13: x.isbn13, isbnAlt: x.isbnAlt, sku: x.sku, publisher: x.publisher, aladinUsedCode: x.aladinUsedCode,
          lineStatus: 'normal', excelNote: x.status && x.status !== '정상' ? x.status : null })),
        reviewNeeded: [...(plat === 'aladin' ? ['샵매니저 수집 기간 밖의 주문 (엑셀 기록만 있음)'] : []), ...(xs.some((x) => x.manual) ? ['날짜 없이 손으로 적은 엑셀 기록'] : [])], piiSource: 'excel',
        excelNotes: uniq(xs.flatMap((x) => [x.memo, x.note, ...(x.cellNotes || []), x.status && x.status !== '정상' ? x.status : null])), source: { excel: true } };
      if (same) order.buyer.phone1 = null;
      order.itemCount = order.items.length;
      if (same) { order.recipient.phone1 = null; }
      // 수령인=주문인이면 연락처를 주문인 쪽으로
      if (same) { order.buyer.phone1 = x0.phone1; order.buyer.phone2 = x0.phone2; }
      orderDocs.push({ order, pKey: null });
    }

    for (const { order } of orderDocs) docs.push({ col: 'crm_orders', id: order._id, data: order });

    // ③ 묻고 답하기·구매평·반품
    const orderCust = {}; orderDocs.forEach(({ order }) => { if (order.orderNo) orderCust[order.orderNo] = order.customerId; });
    const qListMap = new Map((await dbAll('qnaList')).map((r) => [r._key, r]));
    // 답변여부: 샵매니저 묻고 답하기 목록의 행 5번째 칸(관리 버튼 앞)을 그대로 — 예: Yes, 취소된 질문
    for (const q of qna) {
      const cid = q.customerKey ? `aladin_${q.customerKey}` : null; const ql = qListMap.get(q._key) || {};
      docs.push({ col: 'crm_interactions', id: `aladin_qna_${q._key}`, data: { type: 'qna', platform: 'aladin', questionId: q._key, customerId: cid, orderId: q.orderNo ? `aladin_${q.orderNo}` : null,
        itemId: q.itemId, title: q.title, condition: q.condition, authorMasked: q.authorMasked, body: q.question, answer: q.answer, answerStatus: ql.answered ?? null, createdAt: q.createdDate, source: { scmCollectedAt: q.collectedAt } } });
    }
    for (const r of reviews) {
      const cid = orderCust[r.orderNo] || null; const n = r._key.split('|').pop();
      docs.push({ col: 'crm_interactions', id: `aladin_review_${r.orderNo}_${hashStr(r._key).split(':')[0]}_${n}`, data: { type: 'review', platform: 'aladin', customerId: cid, orderId: `aladin_${r.orderNo}`,
        title: r.title, condition: r.condition, rating: r.rating, body: r.comment, authorMasked: r.authorMasked, createdAt: r.createdDate, source: { scmCollectedAt: r.collectedAt } } });
    }
    for (const r of returns) {
      docs.push({ col: 'crm_orderEvents', id: `aladin_return_${r.claimId}`, data: { type: 'return', platform: 'aladin', orderId: `aladin_${r.orderNo}`, customerId: orderCust[r.orderNo] || null,
        claimId: r.claimId, itemId: r.itemId, title: r.title, condition: r.condition, sku: r.sku, registeredAt: r.registeredAt, price: r.price, qty: r.qty, reason: r.reason, status: r.status, tab: r.tab,
        requestedAt: r.requestedAt, approvedAt: r.approvedAt, completedAt: r.completedAt, history: r.history, firstSeenAt: r.firstSeenAt, lastSeenAt: r.lastSeenAt } });
    }

    // ④ 구글 시트 행 → 고객 연결 (확실한 것만 자동, 나머지는 '연결 대기')
    const idx = { phone: {}, email: {}, local: {}, name: {}, isbn: {}, title: {} };
    const addIdx = (m, k, cid) => { if (!k) return; (m[k] = m[k] || new Set()).add(cid); };
    for (const order of [...orderDocs.map((x) => x.order), ...serverOrdersCache.filter((o) => o && o.buyer)]) {
      const cid = order.customerId; const r = order.recipient || {};
      [order.buyer.phone1, order.buyer.phone2, r.phone1, r.phone2].filter(Boolean).forEach((p) => addIdx(idx.phone, p.replace(/\D/g, ''), cid));
      if (order.buyer.email) { addIdx(idx.email, order.buyer.email.toLowerCase(), cid); addIdx(idx.local, order.buyer.email.split('@')[0].toLowerCase(), cid); }
      if (order.buyer.emailMasked) addIdx(idx.local, order.buyer.emailMasked.split('@')[0].toLowerCase(), cid);
      [order.buyer.name, r.name].filter(Boolean).forEach((n) => addIdx(idx.name, n.replace(/\(.*\)/, '').trim(), cid));
      order.items.forEach((it) => { addIdx(idx.isbn, it.isbn13, cid + '|' + (order.orderedAt || '')); addIdx(idx.title, normTitle(it.title), cid + '|' + (order.orderedAt || '')); });
    }
    const qnaByTitle = {}; qna.forEach((q) => { if (q.customerKey && q.title) (qnaByTitle[normTitle(q.title)] = qnaByTitle[normTitle(q.title)] || []).push(q); });
    const pending = [];
    // ── 판매자: 툴팁 데이터(판매자 번호 SC 기준) + 구글 시트(이름 기준, 우리 분류: 전문·개인·허위 매물)를 이름으로 합침
    {
      // 주소 비교: 띄어쓰기·기호를 뺀 전체가 같으면 '일치', 앞부분(시·구·도로명)만 같고 동·호수 등이 다르면 '일치 의심'
      const normA = (a) => String(a || '').replace(/[\s,.()\-]/g, '').toLowerCase();
      const addrFull = {}; const addrMap = {};
      orderDocs.forEach(({ order }) => { const a = normA((order.recipient || {}).address); if (a.length > 12) { (addrFull[a] = addrFull[a] || new Set()).add(order.customerId); (addrMap[a.slice(0, 16)] = addrMap[a.slice(0, 16)] || new Set()).add(order.customerId); } });
      const addrKeysByPrefix = {}; Object.keys(addrFull).forEach((a) => (addrKeysByPrefix[a.slice(0, 16)] = addrKeysByPrefix[a.slice(0, 16)] || []).push(a));
      const linkOf = (f) => {
        const links = new Map(); const addL = (cid, why, level) => { const v = links.get(cid) || { reasons: [], level: 'suspect' }; v.reasons.push(why); if (level === 'match') v.level = 'match'; links.set(cid, v); };
        [f.phone, f.asPhone].filter(Boolean).forEach((ph) => { const k = String(ph).replace(/\D/g, ''); if (k.length >= 9) (idx.phone[k] || []).forEach((cid) => addL(cid, '전화번호 같음', 'match')); });
        if (f.email) {
          (idx.email[String(f.email).toLowerCase()] || []).forEach((cid) => addL(cid, '이메일 같음', 'match'));
          const lp = String(f.email).split('@')[0].toLowerCase().replace(/\d+$/, '');
          if (lp.length >= 5) (idx.localStem[lp] || []).forEach((cid) => { if (!links.has(cid) || links.get(cid).level !== 'match') addL(cid, '이메일 앞부분이 비슷함', 'suspect'); });
        }
        const ra = normA(f.returnAddress);
        if (ra.length > 12) {
          (addrKeysByPrefix[ra.slice(0, 16)] || []).forEach((a) => {
            const exact = a === ra || (Math.min(a.length, ra.length) >= 25 && (a.startsWith(ra) || ra.startsWith(a)));
            addrFull[a].forEach((cid) => addL(cid, exact ? '반품 주소 = 우리고객 배송지' : '반품 주소가 우리고객 배송지와 비슷함 (동·호수 등 다름)', exact ? 'match' : 'suspect'));
          });
        }
        if (f.owner) (idx.name[f.owner] || []).forEach((cid) => { if (links.has(cid)) addL(cid, '대표자 이름 같음', links.get(cid).level); });
        return [...links.entries()].map(([cid, v]) => ({ customerId: cid, reasons: uniq(v.reasons), level: v.level }));
      };
      idx.localStem = {}; Object.entries(idx.local).forEach(([k2, set]) => { const st = k2.replace(/[\d*.]+$/, ''); if (st.length >= 5) set.forEach((cid) => addIdx(idx.localStem, st, cid)); });
      const normName = (n) => String(n || '').split(/\n/)[0].replace(/\s+/g, '').replace(/(전문셀러|파워셀러|골드셀러|실버셀러|새내기셀러)$/, '').toLowerCase();
      const sheetS = sheetRows.filter((x) => x.type === 'seller'); const sheetByName = new Map(sheetS.map((x) => [normName(x.name), x])); const usedSheet = new Set();
      for (const raw of sellerRawAll) {
        const { lean, history } = tooltipSellerDocs(raw); const sh = sheetByName.get(normName(lean.name));
        if (sh) usedSheet.add(sh._key);
        const doc = { ...lean, ourGrade: sh ? sh.grade : null, sheet: sh ? { sheet: sh.sheet, sheetRow: sh.sheetRow, remark: sh.remark, rating6m: sh.rating6m, reviews6m: sh.reviews6m, bad6m: sh.bad6m, actualDays: sh.actualDays, lowPrice: sh.lowPrice, stock: sh.stock } : null };
        doc.linkedCustomers = linkOf({ phone: doc.phone || (sh && sh.phone), asPhone: doc.asPhone || (sh && sh.asPhone), email: doc.email || (sh && sh.email), returnAddress: doc.returnAddress || (sh && sh.returnAddress), owner: doc.owner || (sh && sh.owner) });
        docs.push({ col: 'sellers', id: `sc_${raw._sc}`, data: doc });
        docs.push({ col: 'seller_history', id: `sc_${raw._sc}`, data: history });
      }
      for (const s of sheetS) {
        if (usedSheet.has(s._key)) continue;
        const { _key, importedAt, fileName, type, grade, ...rest } = s;
        docs.push({ col: 'sellers', id: `sheet_${_key.replace(/^seller_/, '')}`, data: { ...rest, ourGrade: grade, source: 'gsheet', linkedCustomers: linkOf(s) } });
      }
    }
    for (const s of sheetRows.filter((x) => x.type !== 'seller')) {
      const score = {};

 const why = {}; const add = (cid, n, w) => { score[cid] = (score[cid] || 0) + n; (why[cid] = why[cid] || []).push(w); };
      const phones = s.phones || []; phones.forEach((p) => (idx.phone[p.replace(/\D/g, '')] || []).forEach((cid) => add(cid, 3, '전화')));
      const em = (s.email || '').toLowerCase();
      if (/@[\w-]+\./.test(em)) (idx.email[em] || []).forEach((cid) => add(cid, 3, '이메일'));
      else if (em.includes('@')) { const lp = em.split('@')[0]; Object.entries(idx.local).forEach(([k, set]) => { if (lp.length >= 4 && (k.startsWith(lp) || lp.startsWith(k.replace(/\*+$/, '')))) set.forEach((cid) => add(cid, 2, '이메일 앞부분')); }); }
      const nm = s.name || s.buyerName || s.recipientName; if (nm) (idx.name[nm] || []).forEach((cid) => add(cid, 1, '이름'));
      (s.items || []).forEach((it) => {
        const hits = [...(it.isbn13 ? idx.isbn[it.isbn13] || [] : []), ...(idx.title[normTitle(it.title)] || [])];
        new Set(hits.map((h) => h.split('|')[0])).forEach((cid) => add(cid, 2, '구매 상품'));
      });
      if (s.idMasked && s.items && s.items[0]) (qnaByTitle[normTitle(s.items[0].title)] || []).forEach((q) => { if (q.authorMasked && s.idMasked.slice(0, 2) === q.authorMasked.slice(0, 2)) add(`aladin_${q.customerKey}`, 3, '문의 기록'); });
      const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]);
      let status = 'none'; let cid = null;
      if (ranked.length && ranked[0][1] >= 3 && (!ranked[1] || ranked[1][1] < ranked[0][1])) { status = 'matched'; cid = ranked[0][0]; }
      else if (ranked.length) status = 'pending';
      const cands = ranked.slice(0, 3).map(([c, sc]) => ({ customerId: c, score: sc, reasons: uniq(why[c]) }));
      const type = { blacklist: 'blacklistNote', customerCancel: 'customerCancelNote', otherCustomer: 'adminNote' }[s.type];
      docs.push({ col: 'crm_interactions', id: `gsheet_${s._key}`, data: { type, platform: 'gsheet', sheet: s.sheet, sheetRow: s.sheetRow, customerId: cid, matchStatus: status, matchReason: cid ? uniq(why[cid]) : null, candidates: cands,
        createdAt: s.date, title: s.items && s.items[0] ? s.items[0].title : null, items: s.items, body: s.reason || s.body || s.note || null, scope: s.scope || null,
        name: nm || null, email: s.email || null, phones, address: s.address || null, idMasked: s.idMasked || null, raw: s.raw } });
      if (status === 'pending') pending.push(s._key);
    }

    const inters = docs.filter((d) => d.col === 'crm_interactions').map((d) => d.data);
    if (docs.some((d) => d.col === 'sellers')) setSellerLinks(docs.filter((d) => d.col === 'sellers').map((d) => d.data));
    for (const c of aggregateCustomers(orderDocs.map((x) => x.order), inters)) docs.push({ col: 'crm_customers', id: c.customerId, data: c });
    buildDocs.lastPending = pending.length;
    return docs.map((d) => ({ ...d, data: clean(d.data) }));
  }

  /* ── 엑셀·시트 파일 읽기 (브라우저 안에서만) ── */
  async function readWorkbook(file) {
    if (typeof XLSX === 'undefined') throw new Error('엑셀 읽기 도구(SheetJS)를 불러오지 못했습니다. 새로고침해 주세요.');
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
    const out = {}; wb.SheetNames.forEach((n) => { out[n] = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null }); });
    return out;
  }
  /* ── 판매자 툴팁 데이터(예전 Realtime Database 내보내기 JSON) → 통합 프로젝트의 판매자 기록 ── */
  const numK = (v) => { if (v == null || v === '') return null; if (typeof v === 'number') return v; const n = parseFloat(String(v).replace(/[^\d.\-]/g, '')); return Number.isFinite(n) ? n : null; };
  function tooltipSellerDocs(raw) {
    const snaps = Object.values(raw.snapshots || {}).sort((a, b) => (a.fetchedAt || 0) - (b.fetchedAt || 0));
    const last = snaps[snaps.length - 1] || {}; const lastWithRating = [...snaps].reverse().find((x) => x.rating) || {};
    const lastCats = [...snaps].reverse().find((x) => x.domesticCategories) || {};
    const quick = Object.values(raw.quickUpdates || {}).sort((a, b) => (a.fetchedAt || 0) - (b.fetchedAt || 0));
    const lq = quick[quick.length - 1] || null; const co = raw.company || {};
    const nameParts = String(co.name || '').split(/\s*,\s*/);
    const pct = (v) => { const n = numK(v); return n == null ? null : n > 1 ? n / 100 : n; };
    const lean = {
      sc: raw._sc, name: last.sellerName || null, aladinGrade: last.sellerGrade || null, logo: last.logo || null,
      totalItems: numK(last.totalItems), domesticBooks: numK(last.domesticBookCount), foreignBooks: numK(last.foreignBookCount), music: numK(last.musicCount), video: numK(last.videoCount),
      rating: pct(lq && lq.rowRating ? lq.rowRating : lastWithRating.rating), reviewCount: numK(lastWithRating.reviewCount), totalReviewCount: numK(last.totalReviewCount),
      outstockRate: numK(lastWithRating.outstockRate ?? last.outstockRate), shippingDays: numK(last.shippingDays), freeShipping: numK(last.freeShipping),
      shippingFee: lq && lq.rowShippingFee != null ? lq.rowShippingFee : numK(last.shippingFee), notices: (last.notices || []).filter((x) => x && x !== '공지 없음').slice(0, 3),
      categories: (lastCats.domesticCategories || []).map((c) => ({ name: c.name, count: numK(c.count) })).filter((c) => c.count).sort((a, b) => b.count - a.count).slice(0, 8),
      company: nameParts[0] || null, owner: nameParts[1] || null, phone: co.phone || null, asPhone: co.asPhone || null, email: co.email || null, bizNo: co.bizRegNo || null,
      mailOrderNo: co.mailOrderNo || null, address: co.address || null, courier: co.courier || null, returnAddress: co.returnAddress || null, notice: co.noticeIntro || null,
      firstReviewDate: co.firstReviewDate || null, snapshotCount: snaps.length, quickCount: quick.length,
      lastFetchedAt: Math.max(last.fetchedAt || 0, lq ? lq.fetchedAt || 0 : 0) || null, source: 'tooltip',
    };
    const history = {
      sc: raw._sc,
      snapshots: snaps.map((x) => ({ t: x.fetchedAt || null, items: numK(x.totalItems), rating: pct(x.rating), reviews: numK(x.reviewCount), total: numK(x.totalReviewCount), outstock: numK(x.outstockRate), fee: numK(x.shippingFee), free: numK(x.freeShipping), grade: x.sellerGrade || null })),
      quick: quick.slice(-400).map((x) => ({ t: x.fetchedAt || null, rating: pct(x.rowRating), fee: x.rowShippingFee ?? null })),
    };
    return { lean, history };
  }
  async function importSellerJson(data, file) {
    const sellers = data.sellers || {}; const now2 = now();
    const rows = Object.entries(sellers).map(([sc, v]) => ({ _key: sc, _sc: sc, ...v, importedAt: now2, fileName: file.name }));
    await dbPut('sellerRaw', rows);
    const summary = `판매자 ${rows.length.toLocaleString()}곳 (스냅샷·평점 기록 포함)`;
    await dbPut('meta', { _key: 'import_sellerjson', fileName: file.name, at: now2, summary });
    log(`판매자 툴팁 데이터: ${summary}`, 'ok'); return summary;
  }

  // 파일 종류를 내용으로 알아봄: 판매완료 엑셀(두 번째 열 '주문번호') / 고객 구글 시트(고객 시트 이름)
  function detectKind(sheets) {
    const names = Object.keys(sheets).map((n) => n.replace(/\s/g, ''));
    if (names.some((n) => ['고객취소목록', '블랙리스트', '기타고객'].includes(n))) return 'sheet';
    const first = sheets[Object.keys(sheets)[0]] || [];
    if (first[0] && String(first[0][1] || '').trim() === '주문번호') return 'sales';
    return null;
  }
  async function importSalesSheets(sheets, file) {
    const first = sheets[Object.keys(sheets)[0]];
    const { lines, dup, skipped, realigned, manual } = parseSalesExcel(first);
    const now2 = now(); await dbPut('excelLines', lines.map((l) => ({ ...l, importedAt: now2, fileName: file.name })));
    const inScm = new Set((await dbAll('orderLines')).map((l) => l.orderNo)); const orders = new Set(lines.map((l) => l.orderNo || 'x'));
    const only = [...orders].filter((o) => !inScm.has(o)).length;
    const summary = `${lines.length.toLocaleString()}줄 정리 (어긋난 ${realigned.toLocaleString()}줄 자동 맞춤, 수기 기록 ${manual}줄 보관, 중복 ${dup}줄 제외). 샵매니저에 없던 주문 ${only}건 추가`;
    await dbPut('meta', { _key: 'import_sales', fileName: file.name, at: now2, summary });
    log(`판매완료 엑셀: ${summary}`, 'ok'); return summary;
  }
  async function importSheetSheets(sheets, file) {
    const { rows } = parseCustomerSheets(sheets);
    const now2 = now(); await dbPut('sheetRows', rows.map((r) => ({ ...r, importedAt: now2, fileName: file.name })));
    const by = {}; rows.forEach((r) => (by[r.sheet] = (by[r.sheet] || 0) + 1));
    const docs = await buildDocs(); const cnt = { matched: 0, pending: 0, none: 0 }; docs.filter((d) => d.data.platform === 'gsheet').forEach((d) => cnt[d.data.matchStatus]++);
    const summary = `${Object.entries(by).map(([k, v]) => `${k} ${v}행`).join(', ')}. 고객 자동 연결 ${cnt.matched}건, 연결 대기 ${cnt.pending}건, 후보 없음 ${cnt.none}건`;
    await dbPut('meta', { _key: 'import_sheet', fileName: file.name, at: now2, summary, pending: cnt.pending + cnt.none });
    log(`고객 구글 시트: ${summary}`, cnt.pending + cnt.none ? 'warn' : 'ok'); return summary;
  }
  // 파일 넣기 → ① 읽기 → ② 이 PC에 정리 → ③ Firebase에 올리기 (로그인되어 있으면 자동)
  let impBusy = false;
  function setStep(n, state, text) { const li = $(`.isteps li[data-n="${n}"]`); li.className = state; if (text != null) li.querySelector('small').textContent = text; }
  async function handleImportFiles(files) {
    if (impBusy || running) { alert('다른 작업이 진행 중입니다. 끝난 뒤 다시 넣어 주세요.'); return; }
    files = [...files].filter((f) => /\.(xlsx?|json)$/i.test(f.name));
    if (!files.length) { alert('.xlsx 엑셀 파일이나 판매자 툴팁 .json 파일만 넣을 수 있습니다.'); return; }
    impBusy = true; $('.isteps').classList.add('on'); [1, 2, 3].forEach((n) => setStep(n, 'wait', ''));
    let ok = 0;
    try {
      setStep(1, 'doing', files.map((f) => f.name).join(', '));
      const loaded = [];
      for (const f of files) {
        if (/\.json$/i.test(f.name)) { let j = null; try { j = JSON.parse(await f.text()); } catch (e) {} loaded.push({ f, json: j, kind: j && j.sellers && typeof j.sellers === 'object' ? 'sellerjson' : null }); continue; }
        const sh = await readWorkbook(f); loaded.push({ f, sh, kind: detectKind(sh) });
      }
      const allBad = loaded.every((x) => !x.kind);
      setStep(1, allBad ? 'error' : 'done', loaded.map((x) => `${x.f.name}: ${x.kind === 'sales' ? '판매완료 엑셀' : x.kind === 'sheet' ? '고객·판매자 구글 시트' : x.kind === 'sellerjson' ? '판매자 툴팁 데이터' : '알 수 없는 파일이라 건너뜀'}`).join(' / '));
      if (allBad) return;
      setStep(2, 'doing', '정리하는 중'); await pullServerOrdersIfNeeded();
      const out = [];
      for (const x of loaded) { if (x.kind === 'sales') { out.push('판매완료 엑셀: ' + await importSalesSheets(x.sh, x.f)); ok++; } if (x.kind === 'sheet') { out.push('고객 구글 시트: ' + await importSheetSheets(x.sh, x.f)); ok++; } if (x.kind === 'sellerjson') { out.push('판매자 툴팁: ' + await importSellerJson(x.json, x.f)); ok++; } }
      setStep(2, 'done', out.join(' / '));
      await refreshStats(true); await renderImportStatus();
    } catch (e) { log('가져오기 실패: ' + e.message, 'err'); setStep(2, 'error', e.message); return; }
    finally { impBusy = false; render(); }
    if (!ok) return;
    if (fbUser && settings.autoUpload) {
      setStep(3, 'doing', 'Firebase에 올리는 중');
      const t0 = Date.now(); await start('upload');
      const lu = await dbGet('meta', 'lastUpload'); const fine = lu && Date.parse(lu.at) >= t0 - 1000;
      setStep(3, fine ? 'done' : 'error', fine ? `올리기 완료 (${lu.count.toLocaleString()}개). 모든 과정이 끝났습니다.` : '올리기가 중간에 멈췄습니다. 이미 올라간 것은 그대로 있고, 이어하기를 누르면 남은 것부터 올립니다.');
    } else setStep(3, 'need', fbUser ? "자동 올리기가 꺼져 있습니다. 위의 'Firebase로 올리기'를 눌러 주세요." : "구글 로그인 후 위의 'Firebase로 올리기'를 눌러야 반영됩니다.");
  }
  async function renderImportStatus() {
    const fmt = (m) => (m ? `${m.fileName} (${new Date(m.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })})<br>${m.summary}` : '아직 가져오지 않음');
    $('.ist-sales').innerHTML = fmt(await dbGet('meta', 'import_sales'));
    $('.ist-sheet').innerHTML = fmt(await dbGet('meta', 'import_sheet'));
    $('.ist-sjson').innerHTML = fmt(await dbGet('meta', 'import_sellerjson'));
  }



  /* ── Firebase 무료 한도: 하루 쓰기 2만 건, 미국 서부 자정(한국 오후 4시, 서머타임이 끝나면 오후 5시)에 초기화 ── */
  const FREE_WRITES = 20000; const WRITE_MARGIN = 500;
  // 유료(Blaze): 무료 한도를 넘어도 계속 쓰되, 코드 실수로 무한히 쓰는 사고를 막는 '하루 안전 상한'에서 멈춤
  // 무료 크레딧 기간(기본 2026-12-29까지)에는 상한 없이 쓰고, 그 뒤부터 하루 안전 상한 적용
  const noCapNow = () => settings.billing === 'paid' && settings.noCapUntil && todayKst() <= settings.noCapUntil;
  const writeCap = () => (settings.billing === 'paid' ? (noCapNow() ? Infinity : Math.max(1000, settings.dailyWriteCap || 200000)) : FREE_WRITES - WRITE_MARGIN);
  function quotaDay() { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); } // 한도 기준 날짜
  function nextResetAt() {
    const la = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const mid = new Date(la); mid.setHours(24, 0, 0, 0); return new Date(Date.now() + (mid - la));
  }
  function resetText() {
    const t = nextResetAt(); const mins = Math.max(0, Math.round((t - Date.now()) / 60000));
    const hm = t.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
    return `${t.getDate() === new Date().getDate() ? '오늘' : '내일'} ${hm} (${Math.floor(mins / 60)}시간 ${mins % 60}분 뒤)`;
  }
  async function writesToday() { const m = await dbGet('meta', 'writes'); const local = m && m.day === quotaDay() ? m.count : 0; return Math.max(local, sharedUsage && sharedUsage.day === quotaDay() ? sharedUsage.writes : 0); }
  async function addWrites(n) { const day = quotaDay(); const m = await dbGet('meta', 'writes'); const same = m && m.day === day; await dbPut('meta', { _key: 'writes', day, count: (same ? m.count : 0) + n, hitLimit: same ? !!m.hitLimit : false, hitAt: same ? m.hitAt || null : null }); }
  async function markLimitHit() { const day = quotaDay(); const m = await dbGet('meta', 'writes'); const same = m && m.day === day; await dbPut('meta', { _key: 'writes', day, count: same ? m.count : 0, hitLimit: true, hitAt: now() }); }
  async function limitHitToday() { const m = await dbGet('meta', 'writes'); return !!(m && m.day === quotaDay() && m.hitLimit) || !!(sharedUsage && sharedUsage.day === quotaDay() && sharedUsage.hitLimit); }
  // commit이 멈춘 채 대답이 없으면(한도 초과 시 Firebase가 조용히 재시도함) 일정 시간 뒤 일시정지. 일시정지 버튼도 즉시 반영.
  async function commitWatched(b, limitSec) {
    let settled = false; let err = null; const pr = b.commit().then(() => { settled = true; }, (e) => { settled = true; err = e; });
    const t0 = Date.now();
    while (!settled) {
      await Promise.race([pr, sleep(1000)]);
      if (settled) break;
      if (pauseRequested) throw new StopSignal('PAUSED', '일시정지했습니다. 이어하기를 누르면 남은 것부터 올립니다.');
      const sec = Math.round((Date.now() - t0) / 1000);
      if (sec > 5) setNow(`Firebase 응답 기다리는 중 (${sec}초). 한도 초과나 연결 문제일 수 있습니다.`);
      if (sec >= limitSec) { await markLimitHit(); throw new StopSignal('FBSTALL', `Firebase가 ${limitSec}초 넘게 응답하지 않아 멈췄습니다. 가장 흔한 원인은 오늘 무료 쓰기 한도(2만 건) 초과입니다. 한도 초기화: ${resetText()}. 그 뒤 이어하기를 누르면 남은 것부터 올립니다. 인터넷 연결 문제라면 연결 확인 후 바로 이어하기를 누르세요.`); }
    }
    if (err) throw err;
  }

  /* ════════ 여러 PC에서 안전하게 쓰기 위한 장치 ════════
   * ① 작업 잠금: 한 번에 한 PC만 수집·올리기 (1분마다 신호, 5분 끊기면 자동 해제)
   * ② 오늘 사용량·한도 도달을 Firebase에 공유 (모든 PC가 같은 숫자를 봄)
   * ③ 수집 완료 기록 공유 (어느 PC든 이어서 갱신 수집)
   * ④ 올릴 때 Firebase의 기존 내용과 합침: 빈 값·일부만 가진 데이터로 기존 정보를 지우지 않음
   * ⑤ 고객 요약은 Firebase의 전체 주문으로 다시 계산 (PC마다 가진 데이터가 달라도 정확)
   */
  const WRITER_SCHEMA = 6; // Firestore 규칙이 이 값 이상만 쓰기를 허용 → 옛 버전 스크립트가 데이터를 덮어쓰는 것을 서버에서 차단
  const PC = (() => { let v = GM_getValue('rn-pc', null); if (!v) { v = { id: Math.random().toString(36).slice(2, 10), name: '' }; GM_setValue('rn-pc', v); } const n = window.__rnPcName && window.__rnPcName.get(); if (n && v.name !== n) { v.name = n; GM_setValue('rn-pc', v); } return v; })();
  let autoTriggered = false;
  const SYS = () => fdb.collection('crm_system');
  const WEB_OWNED = ['flags', 'memo', 'tags', 'manual', 'confirmed', 'confirmedBy', 'confirmedAt', 'vip', 'blacklist']; // 웹앱이 관리하는 칸: 업로더가 절대 덮지 않음
  let lockBeat = null; let lockHeld = false;
  async function acquireLock(task) {
    if (!FB || !fdb) throw new Error('Firebase 파일을 불러오지 못했습니다. 새로고침해 주세요.');
    if (!fbUser) throw new StopSignal('FBLOGIN', '여러 PC가 동시에 작업하지 않도록, 수집·올리기 전에 Firebase 로그인이 필요합니다. "구글 로그인"을 눌러 주세요.');
    if (!PC.name) { const n = (window.__rnPcName && (window.__rnPcName.get() || (autoTriggered ? null : window.__rnPcName.ask('여러 PC 중 어느 PC가 작업 중인지 표시할 때 씁니다.')))); if (!n) throw new StopSignal('PCNAME', '이 PC 이름을 정해야 시작할 수 있습니다 (패널 설정에서 정하기).'); PC.name = n; GM_setValue('rn-pc', PC); }
    const ref = SYS().doc(GM_getValue('rnu-lockdoc', 'work_lock'));
    // 고객 수집이 먼저: 상품 수집기(평가 수집 등 몇 시간 걸리는 작업)가 잡고 있으면 양보를 요청하고, 멈추는 대로 자동 시작 (최대 6분 기다림)
    const deadline = Date.now() + 90 * 1000; let asked = false; let force = false; // 90초 안에 양보가 없으면(예전 버전 상품 수집기) 함께 돌도록 잠금을 넘겨받음
    for (;;) {
      try {
        await fdb.runTransaction(async (tx) => {
          const s = await tx.get(ref); const d = s.exists ? s.data() : null;
          if (!force && d && d.holder && d.holder !== PC.id && d.heartbeatMs && Date.now() - d.heartbeatMs < 5 * 60000) {
            const e = new StopSignal('LOCKED', `다른 PC(${d.pcName})에서 '${d.taskLabel}' 작업 중입니다 (마지막 신호 ${Math.max(0, Math.round((Date.now() - d.heartbeatMs) / 60000))}분 전). 그 PC 작업이 끝나면 다시 눌러 주세요. 그 PC가 꺼졌다면 5분 뒤 자동으로 풀립니다.`); e.info = d; throw e;
          }
          tx.set(ref, { writerSchema: WRITER_SCHEMA, holder: PC.id, pcName: PC.name, task, taskLabel: task === 'bulk' ? '전체 일괄 수집' : (TASKS[task] ? TASKS[task].label : task), startedAt: now(), heartbeatMs: Date.now(), by: fbUser.email });
        });
        if (asked) log('상품 수집기가 양보했습니다. 고객 수집을 시작합니다', 'ok');
        break;
      } catch (e) {
        const prod = e && e.code === 'LOCKED' && e.info && String(e.info.task || '').startsWith('product_');
        if (!prod) throw e;
        if (Date.now() > deadline) { force = true; log(`${e.info.pcName}의 상품 수집기가 응답하지 않습니다 (예전 버전). 고객 수집을 먼저 해야 하므로 지금 함께 시작합니다 — 잠시 두 PC가 동시에 알라딘에 접속합니다`, 'err'); continue; }
        if (!asked) { asked = true; await ref.set({ yieldReq: { pc: PC.id, pcName: PC.name, tool: '고객 수집기', task, at: Date.now() } }, { merge: true }).catch(() => {});
          log(`${e.info.pcName}의 상품 수집기('${e.info.taskLabel}')에 양보를 요청했습니다. 그쪽이 진행 위치를 저장하고 멈추면 자동으로 시작합니다 (보통 1분 안)`); }
        else await ref.set({ yieldReq: { pc: PC.id, pcName: PC.name, tool: '고객 수집기', task, at: Date.now() } }, { merge: true }).catch(() => {});
        await sleep(8000);
      }
    }
    lockHeld = true; clearInterval(lockBeat);
    lockBeat = setInterval(() => { if (lockHeld) ref.set({ heartbeatMs: Date.now(), writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {}); }, 60000);
  }
  async function releaseLock() {
    clearInterval(lockBeat); if (!lockHeld || !fdb) return; lockHeld = false;
    const ref = SYS().doc(GM_getValue('rnu-lockdoc', 'work_lock'));
    try { await fdb.runTransaction(async (tx) => { const s = await tx.get(ref); if (s.exists && s.data().holder === PC.id) tx.delete(ref); }); } catch (e) {}
  }
  let lockInfo = null; let lockUnsub = null;
  function watchLock() { if (!fdb || lockUnsub) return; lockUnsub = SYS().doc(GM_getValue('rnu-lockdoc', 'work_lock')).onSnapshot((s) => { lockInfo = s.exists ? s.data() : null; render(); }, () => {}); }
  // ② 공유 사용량
  let sharedUsage = { day: null, writes: 0, hitLimit: false }; let usageUnsub = null;
  function watchUsage() {
    if (!fdb || !fbUser) return; const day = quotaDay(); if (sharedUsage.day === day && usageUnsub) return;
    if (usageUnsub) usageUnsub(); sharedUsage = { day, writes: 0, hitLimit: false };
    usageUnsub = SYS().doc(`usage_${day}`).onSnapshot((s) => { const d = s.exists ? s.data() : {}; sharedUsage = { day, writes: d.writes || 0, hitLimit: !!d.hitLimit, hitBy: d.hitBy || null }; render(); }, () => {});
  }
  function shareWrites(n) { if (fdb) SYS().doc(`usage_${quotaDay()}`).set({ writes: FB.firestore.FieldValue.increment(n + 1), day: quotaDay(), writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {}); }
  function shareLimitHit() { if (fdb) SYS().doc(`usage_${quotaDay()}`).set({ hitLimit: true, hitAt: now(), hitBy: PC.name || '', writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {}); }
  // ③ 수집 완료 기록 공유
  async function syncRemoteJob(job) {
    if (!fdb || !fbUser || job.fullDoneAt) return;
    try { const s = await SYS().doc('jobs').get(); const r = s.exists ? (s.data()[job._key] || null) : null; if (r && r.fullDoneAt) { job.fullDoneAt = r.fullDoneAt; job.fullDoneBy = r.pcName; } } catch (e) {}
  }
  function shareJobDone(job) { if (fdb && fbUser) SYS().doc('jobs').set({ writerSchema: WRITER_SCHEMA, [job._key]: { fullDoneAt: job.fullDoneAt || null, lastDoneAt: now(), pcName: PC.name || '', mode: job.mode || null } }, { merge: true }).catch(() => {}); }
  // ④ 기존 내용과 합치기: 새 값이 비어 있으면 기존 값 유지, 상품 줄은 줄 번호별로 합침, 이름·전화 같은 목록은 합집합
  function mergeVal(o, n) {
    if (n === null || n === undefined || n === '') return o === undefined ? n : o;
    if (Array.isArray(n)) {
      if (!Array.isArray(o) || !o.length) return n;
      if (n.length && n[0] && typeof n[0] === 'object' && 'lineNo' in n[0]) {
        const ob = new Map(o.map((x) => [x && x.lineNo, x])); const out = n.map((x) => mergeVal(ob.get(x.lineNo), x));
        o.forEach((x) => { if (x && !n.some((y) => y.lineNo === x.lineNo)) out.push(x); }); return out;
      }
      if (n.every((x) => x === null || typeof x !== 'object') && o.every((x) => x === null || typeof x !== 'object')) return [...new Set([...o, ...n].filter((x) => x !== null && x !== ''))];
      return n.length ? n : o;
    }
    if (typeof n === 'object') {
      if (!o || typeof o !== 'object' || Array.isArray(o) || typeof o.toMillis === 'function') return n;
      const r = { ...o }; for (const k of Object.keys(n)) r[k] = mergeVal(o[k], n[k]); return r;
    }
    return n;
  }
  const stripMeta = (d) => { const x = { ...d }; delete x.uploadedAt; delete x.uploaderVersion; delete x.lastWrittenBy; delete x.writerSchema; WEB_OWNED.forEach((k) => delete x[k]); return x; };
  async function readExisting(col, ids) {
    const out = new Map(); const FP = FB.firestore.FieldPath.documentId();
    for (let i = 0; i < ids.length; i += 30) {
      const part = ids.slice(i, i + 30);
      const snap = await fdb.collection(col).where(FP, 'in', part).get();
      snap.forEach((d) => out.set(d.id, d.data()));
    }
    return out;
  }

  async function commitWithRetry(b, n) {
    let tries = 0;
    while (true) {
      try { await commitWatched(b, 120); await addWrites(n); shareWrites(n); return; }
      catch (e) {
        if (e instanceof StopSignal) { if (e.code === 'FBSTALL' || e.code === 'FBQUOTA') shareLimitHit(); throw e; }
        if (e.code === 'permission-denied') throw new StopSignal('FBPERM', `Firebase가 쓰기를 거부했습니다. ① Firestore 보안 규칙의 이메일과 지금 로그인한 계정(${fbUser.email})이 같은지, ② 이 PC의 수집기가 최신 버전인지 확인해 주세요.`);
        if (e.code === 'resource-exhausted') { await markLimitHit(); shareLimitHit(); throw new StopSignal('FBQUOTA', `Firebase 무료 쓰기 한도(하루 2만 건)에 도달했습니다. 한도 초기화: ${resetText()}. 그 뒤 이어하기를 누르면 남은 것부터 올립니다.`); }
        tries += 1; const w = Math.min(300, 10 * tries); log(`올리기 실패 (${e.code || e.message}). ${w}초 뒤 다시 시도합니다.`, 'warn'); await sleep(w * 1000); checkPause();
      }
    }
  }
  async function guardQuota(n, left) {
    if (settings.billing === 'paid' && writeCap() !== Infinity && (await writesToday()) + n > writeCap()) { throw new StopSignal('FBCAP', `오늘 쓰기가 설정한 하루 안전 상한(${writeCap().toLocaleString()}건)에 닿아 멈췄습니다. 정상이라면 설정에서 상한을 올리고 이어하기를 누르세요. 평소보다 훨씬 많다면 오류일 수 있으니 알려주세요.`); }
    if (settings.billing !== 'paid' && (await writesToday()) + n > FREE_WRITES - WRITE_MARGIN) { await markLimitHit(); shareLimitHit(); throw new StopSignal('FBQUOTA', `오늘 무료 쓰기 한도(2만 건)에 거의 다 찼습니다. 한도에 걸려 멈추기 전에 미리 멈췄습니다. 한도 초기화: ${resetText()}. 그 뒤 이어하기를 누르면 남은 ${left.toLocaleString()}개를 올립니다.`); }
  }
  async function taskUpload() {
    if (!FB || !fdb) throw new Error('Firebase 파일을 불러오지 못했습니다. 새로고침해 주세요.');
    if (!fbUser) throw new StopSignal('FBLOGIN', 'Firebase에 올리려면 먼저 "구글 로그인"을 눌러 주세요.');
    if (settings.billing !== 'paid' && await limitHitToday() && !confirm(`오늘은 이미 무료 쓰기 한도에 도달한 것으로 보입니다.\n한도 초기화: ${resetText()}\n\n초기화 전에 올리면 다시 2분쯤 기다리다 멈출 가능성이 큽니다. 그래도 지금 시도할까요?\n(인터넷 연결 문제로 멈췄던 경우라면 '확인'을 누르세요)`)) throw new StopSignal('FBQUOTA', `한도 초기화(${resetText()}) 뒤 이어하기를 눌러 주세요.`);
    const ujob = await loadJob('upload'); ujob.status = 'running'; ujob.startedAt = ujob.startedAt || now(); await saveJob(ujob);
    setNow('올릴 문서를 계산하는 중'); progress('Firebase 올리기', 0, 1);
    const docs = (await buildDocs()).filter((d) => d.col !== 'crm_customers'); // 고객 요약은 아래에서 Firebase 전체 데이터로 계산
    const sent = new Map((await dbAll('uploaded')).map((u) => [u._key, u.hash]));
    const todo = docs.filter((d) => sent.get(`${d.col}/${d.id}`) !== docHash(d));
    const pendingCust = new Set(((await dbGet('meta', 'pendingCustomers')) || { ids: [] }).ids); // 지난번에 다 못 한 고객 요약
    log(`올릴 문서 ${todo.length.toLocaleString()}개 (바뀐 것만), 다시 계산할 고객 요약은 올린 뒤 정해집니다`);
    const BATCH = 300; let done = 0; let skipped = 0;
    for (let i = 0; i < todo.length; i += BATCH) {
      checkPause();
      const chunk = todo.slice(i, i + BATCH);
      // Firebase에 이미 있는 내용 읽어서 합치기 (다른 PC가 올린 정보·엑셀로 채운 정보를 지우지 않음)
      const byCol = {}; chunk.forEach((d) => (byCol[d.col] = byCol[d.col] || []).push(d));
      const b = fdb.batch(); const stamp = FB.firestore.FieldValue.serverTimestamp(); let n = 0; const wrote = [];
      for (const [col, ds] of Object.entries(byCol)) {
        setNow(`Firebase의 기존 내용 확인 중 (${col})`);
        const ex = await readExisting(col, ds.map((d) => d.id));
        for (const d of ds) {
          const old = ex.get(d.id);
          const merged = old ? mergeVal(stripMeta(old), d.data) : d.data;
          if (old && old.confirmed) ['customerId', 'matchStatus', 'matchReason', 'candidates'].forEach((k) => { if (k in old) merged[k] = old[k]; }); // 웹앱에서 사람이 확정한 연결은 그대로
          if (old && d.data.customerId !== undefined && old.customerId && old.customerId !== merged.customerId) pendingCust.add(old.customerId);
          if (merged.customerId) pendingCust.add(merged.customerId);
          const cmp = (x) => stableStr(clean({ ...x, source: undefined, piiCollectedAt: undefined }));
          if (old && cmp(stripMeta(old)) === cmp(merged)) { skipped++; wrote.push(d); continue; } // 이미 같은 내용 (수집 시각만 다른 것 포함)
          b.set(fdb.collection(col).doc(d.id), { ...merged, uploadedAt: stamp, uploaderVersion: APP_VER, writerSchema: WRITER_SCHEMA, lastWrittenBy: PC.name || '' }, { merge: true }); n++; wrote.push(d);
        }
      }
      if (n) { await guardQuota(n, todo.length - done); await commitWithRetry(b, n); }
      await dbPut('uploaded', wrote.map((d) => ({ _key: `${d.col}/${d.id}`, hash: docHash(d), at: now() })));
      await dbPut('meta', { _key: 'pendingCustomers', ids: [...pendingCust] });
      done += chunk.length; progress('Firebase 올리기 (주문·기록)', done, todo.length); setNow(`올린 문서 ${done.toLocaleString()} / ${todo.length.toLocaleString()} (같은 내용이라 건너뜀 ${skipped.toLocaleString()})`);
    }
    // 웹앱에서 연결을 확정·변경한 고객도 요약을 다시 계산
    let fromApp = [];
    try { const rq = await SYS().doc('recompute').get(); fromApp = rq.exists ? (rq.data().ids || []) : []; fromApp.forEach((x) => pendingCust.add(x)); } catch (e) {}
    await recomputeCustomers(pendingCust);
    if (fromApp.length) SYS().doc('recompute').set({ ids: FB.firestore.FieldValue.arrayRemove(...fromApp), writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {});
    await dbPut('meta', { _key: 'lastUpload', at: now(), count: todo.length, total: docs.length, by: fbUser.email });
    ujob.status = 'done'; ujob.finishedAt = now(); ujob.startedAt = null; await saveJob(ujob);
    log(`Firebase 올리기 완료: 문서 ${todo.length.toLocaleString()}개 확인 (그중 같은 내용 ${skipped.toLocaleString()}개는 건너뜀)${buildDocs.lastPending ? `, 구글 시트 연결 대기 ${buildDocs.lastPending}건은 웹앱에서 확정 예정` : ''}`, 'ok');
  }
  // 고객 요약: 그 고객의 모든 주문·기록을 Firebase에서 읽어 다시 계산 (어느 PC에서 올려도 정확)
  async function recomputeCustomers(set) {
    const ids = [...set]; if (!ids.length) return; await loadSellerLinks(); await loadScoringConfig();
    log(`고객 요약 ${ids.length.toLocaleString()}명을 Firebase 전체 데이터로 다시 계산합니다`);
    let i = 0; let b = fdb.batch(); let n = 0; let doneIds = [];
    const flush = async () => { if (!n) return; await guardQuota(n, ids.length - i); await commitWithRetry(b, n); const rest = new Set(ids.slice(i)); await dbPut('meta', { _key: 'pendingCustomers', ids: [...rest] }); b = fdb.batch(); n = 0; doneIds = []; };
    for (; i < ids.length; i++) {
      checkPause();
      const cid = ids[i];
      const [os, is] = await Promise.all([fdb.collection('crm_orders').where('customerId', '==', cid).get(), fdb.collection('crm_interactions').where('customerId', '==', cid).get()]);
      const orders = []; os.forEach((d) => orders.push({ _id: d.id, ...d.data() })); const inters = []; is.forEach((d) => inters.push(d.data()));
      const [c] = aggregateCustomers(orders, inters);
      if (c) { b.set(fdb.collection('crm_customers').doc(cid), { ...clean(c), uploadedAt: FB.firestore.FieldValue.serverTimestamp(), uploaderVersion: APP_VER, writerSchema: WRITER_SCHEMA, lastWrittenBy: PC.name || '' }, { merge: true }); n++; }
      doneIds.push(cid);
      if (n >= 300) { i++; await flush(); i--; }
      if (i % 20 === 0) { progress('고객 요약 다시 계산', i + 1, ids.length); setNow(`고객 요약 ${(i + 1).toLocaleString()} / ${ids.length.toLocaleString()}`); }
    }
    await flush(); await dbPut('meta', { _key: 'pendingCustomers', ids: [] });
    progress('고객 요약 다시 계산', ids.length, ids.length);
  }

  /* ════════ 7) 문제 주문 상세 다시 받기 (파서가 새로 읽게 된 정보 반영) ════════ */
  async function taskRecheck() {
    const job = await loadJob('recheck');
    if (isFresh(job) || !job.queue) {
      const iss = (await dbAll('issues')).filter((i) => ['V_LINE_COUNT', 'V_TOTAL', 'V_NO_POPUP'].includes(i.type)).map((i) => i.key);
      const lines = await dbAll('orderLines'); const cnt = {}; lines.filter((l) => l.kind === 'sale').forEach((l) => (cnt[l.orderNo] = (cnt[l.orderNo] || 0) + 1));
      const old = (await dbAll('popups')).filter((p) => verNum(p.parserVersion) < verNum(NEED_CORE) && cnt[p._key] != null && p.items.length > cnt[p._key]).map((p) => p._key);
      Object.assign(job, { queue: [...new Set([...iss, ...old])], qi: 0, startedAt: now() });
    }
    job.status = 'running'; await saveJob(job);
    while (job.qi < job.queue.length) {
      const ono = job.queue[job.qi]; const url = `${BASE}wpopup_order.aspx?ono=${encodeURIComponent(ono)}`;
      setNow(`문제 주문 상세 다시 받는 중: ${ono}`);
      const { doc } = await fetchDoc(url, { expect: (d) => /주문번호/.test(d.body ? d.body.textContent : '') });
      const p = P.parseOrderPopup(doc, url); popupExtras(doc, p); if (p.orderNo === ono) await savePopup(ono, p);
      job.qi += 1; if (job.qi % 5 === 0 || job.qi === job.queue.length) await saveJob(job);
      progress('문제 주문 상세 다시 받기', job.qi, job.queue.length);
      const c = p.items.filter((i) => i.cancelled).length; setNow(`${ono}: 상품 ${p.items.length}개 중 주문 안 취소 ${c}개`);
    }
    job.status = 'done'; job.finishedAt = now(); job.queue = null; await saveJob(job); log('문제 주문 상세 다시 받기 완료', 'ok');
  }

  /* ════════ 8) Firebase 대조: 올라간 문서 수와 표본 내용 비교 ════════ */
  const stableStr = (v) => (v === null || typeof v !== 'object') ? JSON.stringify(v) : Array.isArray(v) ? '[' + v.map(stableStr).join(',') + ']'
    : '{' + Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => JSON.stringify(k) + ':' + stableStr(v[k])).join(',') + '}';
  async function taskFbCheck() {
    if (!FB || !fdb) throw new Error('Firebase 파일을 불러오지 못했습니다.');
    if (!fbUser) throw new StopSignal('FBLOGIN', 'Firebase 대조를 하려면 먼저 로그인해 주세요.');
    setNow('비교할 문서를 계산하는 중'); const docs = await buildDocs(); const byCol = {};
    docs.forEach((d) => (byCol[d.col] = byCol[d.col] || []).push(d));
    let bad = 0; const cols = Object.keys(byCol);
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i]; let remote;
      try { remote = (await fdb.collection(col).count().get()).data().count; }
      catch (e) { remote = (await fdb.collection(col).get()).size; }
      const local = byCol[col].length; const ok = remote >= local;
      log(`${col}: 이 PC ${local.toLocaleString()}개 / Firebase ${remote.toLocaleString()}개 ${ok ? '일치' : '부족'}`, ok ? 'ok' : 'err'); if (!ok) bad++;
      progress('Firebase 대조', i + 1, cols.length + 1);
    }
    const sample = docs.slice().sort(() => Math.random() - 0.5).slice(0, 20); let diff = 0;
    for (const d of sample) {
      const snap = await fdb.collection(d.col).doc(d.id).get();
      if (!snap.exists) { diff++; log(`없음: ${d.col}/${d.id}`, 'err'); continue; }
      const r = snap.data(); delete r.uploadedAt; delete r.uploaderVersion;
      if (stableStr(clean({ ...r, source: undefined, piiCollectedAt: undefined })) !== stableStr({ ...clean(d.data), source: undefined, piiCollectedAt: undefined })) { diff++; log(`내용 다름: ${d.col}/${d.id} (아직 안 올린 변경일 수 있음)`, 'warn'); }
    }
    progress('Firebase 대조', cols.length + 1, cols.length + 1);
    log(`Firebase 대조 끝: 문서 수 ${bad ? bad + '개 컬렉션 부족' : '모두 일치'}, 표본 20개 중 내용 다름 ${diff}개`, bad || diff ? 'warn' : 'ok');
    setNow(`Firebase 대조: 문서 수 ${bad ? '부족 있음' : '일치'}, 표본 내용 다름 ${diff}/20`);
  }

  /* ════════ 9) 고객 요약·점수 전체 재계산 (매일: 최근성 점수는 날짜가 지나면 바뀜) ════════ */
  async function taskScore() {
    if (!FB || !fdb) throw new Error('Firebase 파일을 불러오지 못했습니다.');
    if (!fbUser) throw new StopSignal('FBLOGIN', '점수 계산은 Firebase 로그인 후에 할 수 있습니다.');
    setNow('Firebase에서 주문·기록을 읽는 중 (약 7천 건 읽기)'); progress('고객 점수 계산', 0, 1); await loadSellerLinks(); await loadScoringConfig();
    const [os, is] = await Promise.all([fdb.collection('crm_orders').get(), fdb.collection('crm_interactions').get()]);
    const orders = []; os.forEach((d) => orders.push({ _id: d.id, ...d.data() })); const inters = []; is.forEach((d) => inters.push(d.data()));
    const custs = aggregateCustomers(orders, inters);
    const sent = new Map((await dbAll('uploaded')).filter((u) => u._key.startsWith('crm_customers/')).map((u) => [u._key, u.hash]));
    const hashC = (c) => hashStr(stableStr(clean({ ...c, scores: { ...c.scores, day: undefined } })));
    const todo = custs.filter((c) => sent.get(`crm_customers/${c.customerId}`) !== hashC(c));
    log(`고객 ${custs.length.toLocaleString()}명 중 점수·요약이 바뀐 ${todo.length.toLocaleString()}명을 올립니다`);
    for (let i = 0; i < todo.length; i += 300) {
      checkPause();
      const chunk = todo.slice(i, i + 300); const b = fdb.batch();
      chunk.forEach((c) => b.set(fdb.collection('crm_customers').doc(c.customerId), { ...clean(c), uploadedAt: FB.firestore.FieldValue.serverTimestamp(), uploaderVersion: APP_VER, writerSchema: WRITER_SCHEMA, lastWrittenBy: PC.name || '' }, { merge: true }));
      await guardQuota(chunk.length, todo.length - i); await commitWithRetry(b, chunk.length);
      await dbPut('uploaded', chunk.map((c) => ({ _key: `crm_customers/${c.customerId}`, hash: hashC(c), at: now() })));
      progress('고객 점수 계산', Math.min(todo.length, i + 300), todo.length);
    }
    const vip = custs.filter((c) => c.autoFlags.vip.on).length; const cau = custs.filter((c) => c.autoFlags.caution.on).length;
    await dbPut('meta', { _key: 'lastScore', at: now(), vip, cau });
    log(`점수 계산 완료: 자동 VIP ${vip}명, 자동 주의고객 ${cau}명 (사람이 직접 정한 표시는 그대로 우선)`, 'ok');
  }

  /* ════════ 매일 자동 수집 (이 PC에서 켜 둔 경우, 주문조회·판매관리 탭이 열려 있을 때) ════════ */
  const todayKst = () => { const d = new Date(); const z = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
  async function autoRunCheck() {
    if (window.__rnUniAuto || window.__rnPaused || window.__rnSchedOn || window.__rnSchedHas) return; // (1.34.0) 새 '⏰ 매일 자동 수집'이 맡음 · 통합 수집기의 '매일 자동(모두 일괄)'이 대신 함
    if (!settings.autoRun || running || otherTabBusy()) return;
    const [hh, mm] = String(settings.autoTime || '06:00').split(':').map((x) => parseInt(x, 10));
    const nowD = new Date(); if (nowD.getHours() * 60 + nowD.getMinutes() < hh * 60 + mm) return;
    const day = todayKst(); const la = await dbGet('meta', 'lastAutoRun'); if (la && la.day === day) return;
    if (fdb && fbUser) { try { const s = await SYS().doc('jobs').get(); const a = s.exists ? s.data().autoRun : null; if (a && a.day === day) { await dbPut('meta', { _key: 'lastAutoRun', day, skipped: true, by: a.pcName }); log(`오늘 자동 수집은 이미 ${a.pcName}에서 했습니다.`); return; } } catch (e) {} }
    await dbPut('meta', { _key: 'lastAutoRun', day, at: now() });
    if (fdb && fbUser) SYS().doc('jobs').set({ autoRun: { day, pcName: PC.name || '', at: now() }, writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {});
    log(`매일 자동 수집 시작 (${settings.autoTime})`, 'ok'); autoTriggered = true; setTimeout(() => { autoTriggered = false; }, 60000);
    const r = await resumable(); start(r === 'bulk' ? 'bulk' : 'bulk', { fresh: r !== 'bulk' });
  }

  /* ════════ 판매자 툴팁 DB 동기화 (툴팁은 예전 Realtime Database에 계속 기록 → 매일 통합 프로젝트로 가져옴) ════════ */
  // 판매자 툴팁 저장소: 통합 프로젝트(readnow) 안의 Realtime Database (로그인 토큰 필요)
  const TOOLTIP_DB = 'https://readnow-3a385-default-rtdb.asia-southeast1.firebasedatabase.app';
  function gmGetJson(url) {
    return new Promise((res, rej) => GM_xmlhttpRequest({ method: 'GET', url, timeout: 120000, onload: (r) => { try { res(JSON.parse(r.responseText)); } catch (e) { rej(new Error('응답을 읽지 못함')); } }, onerror: () => rej(new Error('연결 실패')), ontimeout: () => rej(new Error('시간 초과')) }));
  }
  async function taskSellerSync() {
    setNow('판매자 툴팁 데이터 받는 중 (약 10MB)'); progress('판매자 툴팁 동기화', 0, 1);
    if (!fbUser) throw new StopSignal('FBLOGIN', '판매자 툴팁 동기화는 Firebase 로그인 후에 할 수 있습니다.');
    const token = await FB.auth().currentUser.getIdToken();
    const data = await gmGetJson(`${TOOLTIP_DB}/sellers.json?auth=${encodeURIComponent(token)}`);
    if (data && data.error) throw new Error(`판매자 저장소 접근 거부: ${data.error} (저장소 규칙과 로그인 계정 확인)`);
    if (!data || typeof data !== 'object') throw new Error('판매자 툴팁 데이터가 비어 있습니다');
    const now2 = now(); const rows = Object.entries(data).map(([sc, v]) => ({ _key: sc, _sc: sc, ...v, importedAt: now2, fileName: 'tooltip-db' }));
    await dbPut('sellerRaw', rows);
    await dbPut('meta', { _key: 'import_sellerjson', fileName: '툴팁 DB 자동 동기화', at: now2, summary: `판매자 ${rows.length.toLocaleString()}곳` });
    progress('판매자 툴팁 동기화', 1, 1); log(`판매자 툴팁 동기화: ${rows.length.toLocaleString()}곳 (다음 올리기 때 바뀐 판매자만 반영)`, 'ok');
  }

  /* ════════ 우리 가게 배송비 정책 기록 (정책은 수시로 바뀌므로 매일 그때의 값을 남김) ════════ */
  function parseShopPolicy(html) {
    let free = (html.match(/이상\s*구매시\s*무료배송,\s*<strong>([^<]+)<\/strong>\s*미만/) || [])[1];
    let fee = (html.match(/미만\s*주문시\s*배송비\s*<span[^>]*>([\d,]+)<\/span>/) || [])[1];
    let paidOnly = false;
    if (!free) { const m = html.match(/무조건\s*유료배송,\s*배송비\s*<span[^>]*>([\d,]+)<\/span>/); if (m) { paidOnly = true; fee = m[1]; } }
    const n = (v) => (v == null ? null : parseInt(String(v).replace(/[^\d]/g, ''), 10) || 0);
    return { freeOver: paidOnly ? null : n(free), fee: n(fee), paidOnly };
  }
  async function taskShopPolicy() {
    const sc = settings.shopSc || '996008';
    setNow(`우리 가게(SC ${sc}) 배송비 정책 확인 중`);
    const r = await fetch(`https://www.aladin.co.kr/shop/usedshop/wshopitem.aspx?SC=${sc}`, { credentials: 'include' });
    const html = await r.text(); const pol = parseShopPolicy(html);
    if (pol.fee == null && pol.freeOver == null) { log('우리 가게 배송비 정책을 읽지 못했습니다 (가게 번호 확인 필요)', 'warn'); return; }
    const day = todayKst(); const ref = SYS().doc('shopPolicy'); const cur = await ref.get(); const d = cur.exists ? cur.data() : {};
    const last = (d.history || []).slice(-1)[0];
    const changed = !last || last.freeOver !== pol.freeOver || last.fee !== pol.fee || !!last.paidOnly !== pol.paidOnly;
    const upd = { sc, current: { ...pol, day, checkedAt: now() }, writerSchema: WRITER_SCHEMA };
    if (changed) upd.history = FB.firestore.FieldValue.arrayUnion({ ...pol, from: day, seenAt: now(), by: PC.name || '' });
    await ref.set(upd, { merge: true });
    log(`배송비 정책: ${pol.paidOnly ? '무조건 유료' : `${(pol.freeOver || 0).toLocaleString()}원 이상 무료`}, 배송비 ${(pol.fee || 0).toLocaleString()}원${changed ? ' (바뀜, 기록함)' : ''}`, 'ok');
  }
  // 툴팁 기록에 남은 우리 가게의 예전 배송비 정책도 역사로 채워 넣음 (처음 한 번)
  async function seedPolicyFromTooltip() {
    try {
      const raw = await dbGet('sellerRaw', settings.shopSc || '996008'); if (!raw) return;
      const snaps = Object.values(raw.snapshots || {}).sort((a, b) => (a.fetchedAt || 0) - (b.fetchedAt || 0));
      const n = (v) => (v == null ? null : parseInt(String(v).replace(/[^\d]/g, ''), 10) || 0);
      const hist = []; snaps.forEach((s) => { const paidOnly = /무조건/.test(s.freeShipping || ''); const p = { freeOver: paidOnly ? null : n(s.freeShipping), fee: n(s.shippingFee), paidOnly, from: new Date(s.fetchedAt).toISOString().slice(0, 10), seenAt: new Date(s.fetchedAt).toISOString(), by: '툴팁 기록' }; const l = hist[hist.length - 1]; if (!l || l.freeOver !== p.freeOver || l.fee !== p.fee) hist.push(p); });
      if (hist.length) await SYS().doc('shopPolicy').set({ tooltipHistory: hist, writerSchema: WRITER_SCHEMA }, { merge: true });
    } catch (e) {}
  }

  /* ── 실행기 ── */
  const TASKS = {
    orders: { label: '전체주문', run: () => taskOrderList('orders', 20, 'sale', '전체주문') },
    cancels: { label: '취소주문', run: () => taskOrderList('cancels', 7, 'cancel', '취소주문') },
    returns: { label: '반품', run: taskReturns },
    qna: { label: '묻고 답하기', run: taskQna },
    reviews: { label: '구매평', run: taskReviews },
    verify: { label: '검증', run: taskVerify },
    upload: { label: 'Firebase 올리기', run: async () => { await taskUpload(); currentTask = 'score'; render(); try { await taskScore(); } catch (e) { if (e.code === 'PAUSED') throw e; log(`점수 계산 멈춤: ${e.message}`, 'warn'); } } },
    recheck: { label: '문제 주문 재확인', run: taskRecheck },
    score: { label: '고객 점수 계산', run: taskScore },
    sellerSync: { label: '판매자 툴팁 동기화', run: taskSellerSync },
    shopPolicy: { label: '배송비 정책 확인', run: async () => { await taskShopPolicy(); await seedPolicyFromTooltip(); } },
    fbcheck: { label: 'Firebase 대조', run: taskFbCheck },
  };
  const BULK = ['shopPolicy', 'orders', 'cancels', 'returns', 'qna', 'reviews', 'verify', 'recheck', 'verify', 'sellerSync'];
  // 같은 PC의 여러 탭(판매관리·주문조회)이 동시에 작업하지 않게: 브라우저 안 표시(10초마다 갱신, 30초 끊기면 해제)
  const TAB_ID = Math.random().toString(36).slice(2, 10); let tabBeat = null;
  const TAB_KEY = 'rn-crm-running';
  function otherTabBusy() { try { const v = JSON.parse(localStorage.getItem(TAB_KEY) || 'null'); return v && v.tab !== TAB_ID && Date.now() - v.ts < 30000 ? v : null; } catch (e) { return null; } }
  function markTab(on, label) {
    clearInterval(tabBeat);
    if (on) { const w = () => localStorage.setItem(TAB_KEY, JSON.stringify({ tab: TAB_ID, ts: Date.now(), label, page: location.pathname.split('/').pop() })); w(); tabBeat = setInterval(w, 10000); }
    else { const v = otherTabBusy(); if (!v) localStorage.removeItem(TAB_KEY); }
  }
  window.addEventListener('pagehide', () => { if (running) { try { const v = JSON.parse(localStorage.getItem(TAB_KEY) || 'null'); if (v && v.tab === TAB_ID) localStorage.removeItem(TAB_KEY); } catch (e) {} } });
  window.addEventListener('storage', async (e) => { if (e.key === TAB_KEY) { if (!e.newValue) await refreshStats(); render(); } });
  async function markCrmComplete() { try { const bj = await loadJob('bulk'); if (bj.status === 'done') GM_setValue('rnu-crm-complete', new Date().toISOString()); } catch (e) {} }
  window.__rnCrm = { localInfo: async () => { let lines = 0, pops = 0; try { lines = await dbCount('orderLines'); pops = await dbCount('popups'); } catch (e) {} return { lines, pops, complete: !!GM_getValue('rnu-crm-complete', false) }; }, localCount: async () => { try { const a = await dbAll('popups'); return a.length; } catch (e) { return 0; } }, pause: () => { if (running) pauseRequested = true; }, otherBusy: () => !!otherTabBusy(), upload: () => (fbUser ? start('upload') : Promise.resolve()), oldAuto: async () => ({ on: !!settings.autoRun, time: settings.autoTime || '06:00' }), offOldAuto: async () => { if (settings.autoRun) { settings.autoRun = false; await saveSettings(); } }, start: (n, o) => { autoTriggered = true; return start(n, o).finally(() => { autoTriggered = false; markCrmComplete(); }); }, busy: () => running, label: () => currentTask,
    // (1.38.0) 개요 화면의 '멈춘 작업' 목록에 고객 작업도 함께 (이 PC 안에 저장된 자리)
    resumableInfo: async () => { if (running || otherTabBusy()) return null; const r = await resumable(); if (!r) return null; const j = await loadJob(r); return { key: r, name: r === 'bulk' ? '고객 전체 일괄 수집' : (TASKS[r] ? TASKS[r].label : r), savedAt: j.updatedAt ? Date.parse(j.updatedAt) || 0 : 0, why: j.message || null }; },
    resume: async () => { const r = await resumable(); if (!r) return; window.__rnResumeOk && window.__rnResumeOk(); return start(r); },
    discard: async (t) => { if (running || otherTabBusy()) return { ok: false, why: '고객 작업이 지금 진행 중입니다 — 먼저 일시정지하세요' }; const names = t === 'bulk' ? ['bulk', ...BULK] : [t]; for (const n of names) { const j = await loadJob(n); if (['paused', 'running', 'error'].includes(j.status)) { j.status = 'idle'; j.discardedAt = now(); await saveJob(j); } } log(`'${t === 'bulk' ? '고객 전체 일괄 수집' : (TASKS[t] ? TASKS[t].label : t)}'의 멈춘 자리만 잊었습니다 (받은 기록은 그대로)`); render(); return { ok: true }; } };
  async function start(name, { fresh = false } = {}) {
    if (running) return;
    const ob = otherTabBusy();
    if (ob) { alert(`이 PC의 다른 탭(${ob.page === 'worders.aspx' ? '주문조회' : '판매관리'})에서 '${ob.label}' 작업 중입니다.\n그 탭에서 진행 상황을 확인하거나, 끝난 뒤 다시 눌러 주세요.`); return; }
    markTab(true, name === 'bulk' ? '전체 일괄 수집' : (TASKS[name] ? TASKS[name].label : name));
    running = true; pauseRequested = false; render();
    const needsLock = !['verify', 'fbcheck'].includes(name);
    try {
      if (needsLock) await acquireLock(name);
      if (name === 'bulk') {
        const bj = await loadJob('bulk');
        if (fresh || bj.status !== 'paused') { Object.assign(bj, { si: 0, startedAt: now(), message: null, preScored: false }); for (const t of BULK) { const j = await loadJob(t); if (j.status !== 'paused') { j.status = 'idle'; await saveJob(j); } } }
        bj.status = 'running'; await saveJob(bj); shareBulk('running');
        const RS = window.__rnStatus || {}; const MS = { order: BULK.map((t, i) => String(i)), labels: Object.fromEntries(BULK.map((t, i) => [String(i), TASKS[t] ? TASKS[t].label : t])), on: Object.fromEntries(BULK.map((t, i) => [String(i), true])), res: Object.fromEntries(BULK.slice(0, bj.si).map((t, i) => [String(i), 'done'])), cur: null };
        const standalone = !RS.job; if (standalone) Object.assign(RS, { job: '고객 전체 일괄 수집', jobStart: Date.now(), chain: MS, sub: null, cur: {} }); else RS.sub = MS;
        // 수집 전에 한 번: 날짜가 바뀌었거나 지난 계산 뒤 새로 올린 게 있을 때만 (없으면 건너뜀)
        if (bj.si === 0 && fbUser && !bj.preScored) {
          const ls = await dbGet('meta', 'lastScore'); const lu = await dbGet('meta', 'lastUpload');
          const stale = !ls ? false : String(ls.at).slice(0, 10) !== new Date().toISOString().slice(0, 10) || (lu && lu.at > ls.at);
          if (stale) { currentTask = 'score'; render(); try { await taskScore(); } catch (e) { if (e.code === 'PAUSED' || e.code === 'LOGIN') throw e; log(`수집 전 점수 계산 건너뜀: ${e.message}`, 'warn'); } }
          else log(ls ? '수집 전 점수 계산: 바뀐 내용이 없어 건너뜁니다.' : '수집 전 점수 계산: 아직 계산 기록이 없어 수집 뒤에 합니다.');
          bj.preScored = true; await saveJob(bj);
        }
        while (bj.si < BULK.length) { currentTask = BULK[bj.si]; render(); { const M2 = (window.__rnStatus || {}).sub || ((window.__rnStatus || {}).chain && (window.__rnStatus || {}).chain.labels && (window.__rnStatus || {}).chain.labels['0'] === (TASKS[BULK[0]] || {}).label ? window.__rnStatus.chain : null); if (M2) M2.cur = String(bj.si); }
          if (['shopPolicy', 'sellerSync'].includes(currentTask)) { if (currentTask === 'sellerSync' && !settings.syncTooltip) { bj.si += 1; continue; } if (!fbUser && currentTask === 'shopPolicy') { bj.si += 1; continue; } try { await TASKS[currentTask].run(); } catch (e) { if (e instanceof StopSignal) throw e; log(`${TASKS[currentTask].label} 건너뜀: ${e.message}`, 'warn'); } }
          else await TASKS[currentTask].run();
          { const M2 = (window.__rnStatus || {}).sub || (window.__rnStatus || {}).chain; if (M2 && M2.res) M2.res[String(bj.si)] = 'done'; }
          bj.si += 1; await saveJob(bj); }
        if (settings.autoUpload && fbUser) { currentTask = 'upload'; render(); await taskUpload(); currentTask = 'score'; render(); try { await taskScore(); } catch (e) { if (e.code === 'PAUSED') throw e; log(`수집 뒤 점수 계산 멈춤: ${e.message}`, 'warn'); } }
        else if (settings.autoUpload) log('구글 로그인이 되어 있지 않아 Firebase 올리기는 건너뛰었습니다.', 'warn');
        bj.status = 'done'; bj.finishedAt = now(); bj.preScored = false; await saveJob(bj); shareBulk('done');
        if (settings.forceFull) { settings.forceFull = false; await saveSettings(); }
        log('일괄 수집이 모두 끝났습니다. 백업 저장을 눌러 파일로 보관해 주세요.', 'ok');
      } else {
        currentTask = name; render();
        if (fresh) { const j = await loadJob(name); if (j.status !== 'paused') { j.status = 'idle'; await saveJob(j); } }
        await TASKS[name].run();
        if (settings.forceFull && name !== 'verify' && name !== 'upload') { settings.forceFull = false; await saveSettings(); log("'처음부터 전체 수집' 설정을 다시 껐습니다."); }
      }
    } catch (e) {
      const status = e instanceof StopSignal ? 'paused' : 'error';
      for (const n of [name, currentTask]) { if (!n) continue; const j = await loadJob(n); if (j.status === 'running') { j.status = status; j.message = e.message; await saveJob(j); } }
      if (name === 'bulk') { const bj = await loadJob('bulk'); bj.status = 'paused'; bj.message = e.message; await saveJob(bj); shareBulk('paused', e.message); }
      log(e.message, status === 'paused' ? 'warn' : 'err'); setNow(e.message);
      if (e.code === 'LOGIN') try { GM_notification({ title: '리드나우 고객 수집기', text: e.message }); } catch (x) {}
    } finally { markTab(false); if (needsLock) await releaseLock(); running = false; pauseRequested = false; currentTask = null; if (name === 'bulk') markCrmComplete();
      { const RS = window.__rnStatus || {}; if (RS.job === '고객 전체 일괄 수집') Object.assign(RS, { job: null, chain: null, lastEnd: { name: '고객 전체 일괄 수집', at: Date.now(), ms: Date.now() - (RS.jobStart || Date.now()) } }); RS.sub = null; } if (window.__rnStatus && window.__rnStatus.crm) window.__rnStatus.crm.active = false; await refreshStats(true); render(); } // 작업이 끝났을 때만 전체를 다시 셈
  }
  // 웹앱에 보여줄 수집 상태 (crm_system/jobs.lastBulk)
  function shareBulk(state, message) { if (!fdb || !fbUser) return; SYS().doc('jobs').set({ lastBulk: { state, at: now(), day: todayKst(), pcName: PC.name || '', message: message || null }, writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {}); }
  async function resumable() {
    const bj = await loadJob('bulk'); if (bj.status === 'paused' || bj.status === 'running') return 'bulk';
    for (const t of Object.keys(TASKS)) { const j = await loadJob(t); if (['paused', 'running', 'error'].includes(j.status)) return t; }
    return null;
  }

  /* ── 백업 ── */
  async function exportBackup() {
    if (!confirm('백업 파일에는 고객 이름·연락처·주소가 들어 있습니다.\n구글 드라이브 비공개 폴더에만 보관하고, GitHub 등 공개된 곳에는 절대 올리지 마세요.\n(아이디·비밀번호는 백업에 들어가지 않습니다.)\n\n저장할까요?')) return;
    const out = { app: 'readnow-crm', appVersion: APP_VER, parserVersion: P.VERSION, exportedAt: now(), stores: {} };
    for (const s of STORES) out.stores[s] = await dbAll(s);
    const blob = new Blob([JSON.stringify(out)], { type: 'application/json' });
    const a = document.createElement('a'); const d = new Date(); const z = (x) => String(x).padStart(2, '0');
    a.href = URL.createObjectURL(blob); a.download = `readnow-crm-backup-${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    log('백업 파일을 저장했습니다.', 'ok');
  }
  async function importBackup(file) {
    const data = JSON.parse(await file.text());
    if (data.app !== 'readnow-crm') { alert('리드나우 고객 수집기 백업 파일이 아닙니다.'); return; }
    if (!confirm(`${data.exportedAt} 백업을 불러옵니다. 같은 항목은 백업 내용으로 바뀌고, 없는 항목은 추가됩니다. 계속할까요?`)) return;
    for (const s of STORES) if (Array.isArray(data.stores[s]) && s !== 'jobs' && s !== 'meta') await dbPut(s, data.stores[s]);
    await refreshStats(); render(); log('백업을 불러왔습니다.', 'ok');
  }

  /* ── 화면 ── */
  const GUIDE = `
  <h4>수집 중 지킬 것</h4>
  <p><b>이 탭을 화면에 띄워 두세요.</b> 다른 탭으로 옮기거나 창을 최소화하면 크롬이 속도를 늦춰 몇 시간 작업이 훨씬 길어질 수 있습니다. 가능하면 이 창 하나만 띄워 두세요.</p>
  <p><b>PC 절전 모드를 꺼 두세요.</b> 절전에 들어가면 수집이 멈춥니다. 깨어나면 이어하기를 누르면 됩니다.</p>
  <p><b>알라딘에 많이 접속하는 다른 도구와 동시에 돌리지 마세요.</b> '판매자 전체 갱신' 같은 일괄 기능이 해당됩니다.</p>
  <p><b>브라우저의 쿠키·사이트 데이터 삭제를 하지 마세요.</b> 수집 데이터가 이 브라우저 안에 있어 함께 지워집니다. 끝나면 꼭 백업 저장을 하세요.</p>
  <h4>멈췄을 때</h4>
  <p>창을 닫았거나 PC가 꺼졌어도 이 페이지를 다시 열고 <b>이어하기</b>를 누르면 멈춘 곳부터 계속합니다.</p>
  <p>서버가 불안정하면 5초에서 5분 간격으로 스스로 다시 시도하고, 60분 넘게 안 되면 일시정지합니다.</p>
  <p>로그인이 풀리면 설정에 넣은 아이디·비밀번호로 자동으로 다시 로그인합니다. 실패하면 설정한 간격(기본 60초)마다 다시 시도하며, 기본값은 성공할 때까지 무제한입니다. 횟수 제한은 설정에서 바꿀 수 있습니다.</p>
  <h4>처음 수집과 다음 수집</h4>
  <p>처음에는 모든 페이지를 받습니다. 한 번 끝까지 받은 종류는 다음부터 <b>갱신 수집</b>으로 바뀌어, 새 주문과 바뀐 주문만 받고 이미 받은 구간에 닿으면 멈춥니다. 반품은 양이 적어 매번 전부 확인합니다.</p>
  <p>반품관리 화면은 진행 중인 반품만 보여주므로, 과거 반품은 전체주문 목록의 상태·반품사유 칸과 주문 상세의 주문상태에서 찾아 검증 단계의 '확인 필요'에 올립니다.</p>
  <p>처음부터 전부 다시 받고 싶으면 설정에서 '다음 실행은 처음부터 전체 수집'을 켜세요.</p>
  <h4>Firebase 올리기</h4>
  <p>'구글 로그인'으로 보안 규칙에 등록한 구글 계정에 로그인한 뒤 'Firebase로 올리기'를 누르면, 바뀐 문서만 골라 통합 프로젝트(readnow)에 올립니다. 로그인은 이 PC에 유지됩니다. 설정에서 '일괄 수집이 끝나면 자동으로 올리기'가 켜져 있으면 일괄 수집 끝에 자동으로 올립니다.</p>
  <p><b>무료 쓰기 한도는 하루 2만 건</b>이고, 미국 서부 자정 기준이라 <b>한국 시간 오후 4시</b>(미국 서머타임이 끝나는 11월 초부터 3월 중순까지는 <b>오후 5시</b>)에 초기화됩니다. Firebase 칸에 오늘 사용량과 다음 초기화 시각이 표시됩니다. 한도에 가까워지면 미리 멈추고, 초기화 뒤 이어하기를 누르면 남은 것부터 올립니다. Firebase가 2분 넘게 응답하지 않을 때도 멈추고 알려줍니다.</p>
  <h4>매일 자동 수집</h4>
  <p>전체 일괄 수집 아래 스위치를 켜고 시각을 정하면, 그 시각 이후 이 PC의 주문조회·판매관리 탭이 열려 있을 때 하루 한 번 자동으로 수집 → 올리기 → 점수 계산까지 합니다. 설정은 바꾸는 즉시 저장됩니다. 여러 PC에서 켜 두어도 하루 한 번만 실행되고, 다른 PC가 이미 했으면 건너뜁니다. 브라우저가 꺼져 있으면 실행되지 않으니, 그 PC에서 알라딘 탭을 열어 두세요.</p>
  <h4>새 PC에서 처음 할 일 (PC마다 한 번)</h4>
  <p>구글 로그인, 이 PC 이름, 알라딘 아이디·비밀번호는 PC마다 따로 저장됩니다. 새 PC에서는 패널 맨 위에 주황색 '처음 한 번 해야 할 설정' 칸이 나타나고, 모두 마치면 초록색 한 줄로 바뀝니다.</p>
  <h4>여러 PC에서 쓸 때</h4>
  <p>한 번에 한 PC만 수집·올리기를 할 수 있습니다. 다른 PC가 작업 중이면 Firebase 칸에 빨간 글씨로 어느 PC가 무엇을 하는지 보이고, 시작 버튼을 눌러도 기다리라고 알려줍니다. 작업 중인 PC가 꺼지면 5분 뒤 자동으로 풀립니다.</p>
  <p>올릴 때는 Firebase에 이미 있는 내용과 합칩니다. 이 PC에 없는 정보(다른 PC가 모은 것, 엑셀로 채운 연락처 등)를 빈 값으로 지우지 않습니다. 고객 요약은 Firebase의 전체 주문으로 다시 계산하므로, PC마다 가진 데이터가 달라도 결과가 같습니다.</p>
  <p>수집을 끝까지 한 번 마쳤다는 기록도 공유되어, 새 PC에서도 처음부터 다시 받지 않고 갱신 수집으로 이어갑니다. 무료 한도 사용량도 모든 PC가 같은 숫자를 봅니다.</p>
  <h4>보안</h4>
  <p>백업 파일에는 고객 개인정보가 들어 있습니다. 구글 드라이브 비공개 폴더에만 두고 GitHub에는 올리지 마세요. 아이디·비밀번호는 이 PC의 Tampermonkey 안에만 저장되며 백업 파일에는 들어가지 않습니다.</p>`;
  const C = { paper: '#FFFFFF', ink: '#1E2B28', sub: '#5B6B66', line: '#D6DDDA', cloth: '#2F5D50', clothSoft: '#E6EFEB', amber: '#A8661B', red: '#B0322A' };
  const style = document.createElement('style');
  style.textContent = `
  #rn-crm{position:fixed;top:12px;right:12px;z-index:2147483646;width:310px;max-height:calc(100vh - 24px);overflow:auto;background:${C.paper};color:${C.ink};border:1px solid ${C.line};border-top:4px solid ${C.cloth};border-radius:8px;box-shadow:0 8px 28px rgba(30,43,40,.16);font:13px/1.45 "Malgun Gothic","Apple SD Gothic Neo",sans-serif}
  #rn-crm *{box-sizing:border-box;font-family:inherit}
  #rn-crm .hd{display:flex;align-items:baseline;justify-content:space-between;padding:10px 12px 6px;cursor:pointer;user-select:none}
  #rn-crm .hd b{font-size:14px} #rn-crm .hd span{color:${C.sub};font-size:11px}
  #rn-crm .bd{padding:0 12px 10px} #rn-crm.min .bd{display:none}
  #rn-crm .sec{margin-top:10px} #rn-crm .cap{font-size:11px;color:${C.sub};margin:0 0 4px;letter-spacing:.02em}
  #rn-crm button{font-size:12px;cursor:pointer;border-radius:5px}
  #rn-crm button:disabled{opacity:.4;cursor:default}
  #rn-crm button:focus-visible{outline:2px solid ${C.cloth};outline-offset:1px}
  /* 1순위: 전체 일괄 수집 */
  #rn-crm .b1{width:100%;padding:10px;border:0;background:${C.cloth};color:#fff;font-size:14px;font-weight:bold}
  #rn-crm .b1:hover:not(:disabled){background:#264D42}
  /* 2순위: 개별 수집 (같은 계열의 옅은 색) */
  #rn-crm .g2{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:5px}
  #rn-crm .b2{padding:6px 2px;border:1px solid #C9DDD5;background:${C.clothSoft};color:${C.cloth};font-weight:bold}
  #rn-crm .b2:hover:not(:disabled){border-color:${C.cloth}}
  /* 진행 제어: 필요할 때만 보임 */
  #rn-crm .ctl{display:none;margin-top:6px} #rn-crm .ctl.on{display:block}
  #rn-crm .ctl button{width:100%;padding:7px;border:1px solid ${C.amber};background:#FFF8EE;color:${C.amber};font-weight:bold}
  /* 상태 */
  #rn-crm .st{margin-top:10px;padding:8px 9px;background:#F6F8F7;border:1px solid ${C.line};border-radius:6px}
  #rn-crm .stt{font-weight:bold;font-size:12.5px}
  #rn-crm .bar{height:5px;background:#E3E9E6;border-radius:3px;overflow:hidden;margin:6px 0 3px}
  #rn-crm .bar i{display:block;height:100%;width:0;background:${C.cloth};transition:width .3s}
  #rn-crm .stn{font-size:11.5px;color:${C.sub}} #rn-crm .now{margin-top:3px;font-size:11.5px;word-break:break-all}
  #rn-crm .nums{display:grid;grid-template-columns:1fr auto;gap:1px 8px;margin:8px 0 0;font-size:12px}
  #rn-crm .nums dt{color:${C.sub}} #rn-crm .nums dd{margin:0;text-align:right;font-variant-numeric:tabular-nums}
  /* 3순위: 점검·보조 (글자 버튼, 옅게) */
  #rn-crm .quiet{display:flex;flex-wrap:wrap;gap:2px 10px;padding-top:7px;border-top:1px dashed ${C.line}}
  #rn-crm .b3{padding:2px 0;border:0;background:none;color:${C.sub};font-size:11.5px;text-decoration:underline;text-underline-offset:2px;text-decoration-color:#C3CCC8}
  #rn-crm .b3:hover:not(:disabled){color:${C.ink}}
  #rn-crm .badge{display:inline-block;min-width:16px;padding:0 4px;margin-left:3px;border-radius:8px;background:${C.amber};color:#fff;font-size:10.5px;text-align:center;text-decoration:none}
  #rn-crm .badge.zero{background:#C3CCC8}
  /* Firebase */
  #rn-crm .fb{margin-top:10px;padding:8px 9px;border:1px solid ${C.line};border-radius:6px}
  #rn-crm .fbs{font-size:12px} #rn-crm .fbl{margin-top:4px;font-size:11.5px} #rn-crm .fbl.busy{padding:5px 7px;border-radius:4px;background:#FDECEA;color:${C.red};font-weight:bold} #rn-crm .fbq{margin-top:5px;padding:5px 7px;border-radius:4px;background:#F6F8F7;font-size:11px;color:${C.sub};line-height:1.5} #rn-crm .fbq b{color:${C.ink}} #rn-crm .fbq.hot{background:#FFF4E5;color:${C.amber}} #rn-crm .fbq.hot b{color:${C.amber}} #rn-crm .fbrow{display:flex;gap:4px;margin-top:6px;align-items:center}
  #rn-crm .fbrow .bf{flex:1;padding:6px;border:1px solid ${C.line};background:#fff;color:${C.ink}}
  #rn-crm .fbrow .bf:hover:not(:disabled){border-color:${C.cloth}}
  /* 아래쪽 메뉴 */
  #rn-crm .foot span{display:flex;gap:10px} #rn-crm .foot{display:flex;justify-content:space-between;margin-top:10px;padding-top:7px;border-top:1px solid ${C.line}}
  #rn-crm .log{margin-top:8px;max-height:84px;overflow:auto;font-size:11px;color:${C.sub}}
  #rn-crm .log p{margin:0 0 2px} #rn-crm .log .warn{color:${C.amber}} #rn-crm .log .err{color:${C.red}} #rn-crm .log .ok{color:${C.cloth}}
  #rn-crm .pane{display:none;margin-top:8px;font-size:12px;border-top:1px solid ${C.line};padding-top:6px}
  #rn-crm.showset .set,#rn-crm.showguide .guide,#rn-crm.showiss .iss,#rn-crm.showimp .imp{display:block}
  #rn-crm .iss h4{margin:8px 0 2px;font-size:12.5px} #rn-crm .iss p{margin:0 0 3px;font-size:11.5px;word-break:break-all}
  #rn-crm .pane .row{display:flex;gap:4px;margin-top:6px} #rn-crm .pane .row button{flex:1;padding:6px;border:1px solid ${C.line};background:#fff}
  #rn-crm .set label{display:block;margin-top:5px;color:${C.sub}}
  #rn-crm .set input[type=text],#rn-crm .set input[type=password],#rn-crm .set input[type=number]{width:100%;padding:4px;border:1px solid ${C.line};border-radius:3px;font-size:12px;color:${C.ink}}
  #rn-crm .pwst{font-weight:normal;font-size:11px} #rn-crm .pwst.on{color:${C.cloth}} #rn-crm .pwst.off{color:${C.amber}}
  #rn-crm .set .chk{display:flex;gap:6px;align-items:center;color:${C.ink}}
  #rn-crm .drop{margin-top:2px;padding:16px 10px;border:2px dashed #B9CFC6;border-radius:8px;background:#F6FAF8;text-align:center;cursor:pointer;transition:background .15s,border-color .15s}
  #rn-crm .drop b{display:block;color:${C.cloth};font-size:13px} #rn-crm .drop span{display:block;margin-top:3px;font-size:11px;color:${C.sub}}
  #rn-crm .drop.over{background:${C.clothSoft};border-color:${C.cloth}}
  #rn-crm .isteps{display:none;margin:8px 0 0;padding:0;list-style:none;counter-reset:st} #rn-crm .isteps.on{display:block}
  #rn-crm .isteps li{position:relative;padding:3px 0 5px 24px;font-size:12px;color:${C.sub};counter-increment:st}
  #rn-crm .isteps li::before{content:counter(st);position:absolute;left:0;top:3px;width:17px;height:17px;border-radius:50%;background:#E3E9E6;color:${C.sub};font-size:10.5px;line-height:17px;text-align:center}
  #rn-crm .isteps li small{display:block;font-size:11px;font-weight:normal;word-break:break-all}
  #rn-crm .isteps li.doing{color:${C.ink};font-weight:bold} #rn-crm .isteps li.doing::before{background:${C.amber};color:#fff}
  #rn-crm .isteps li.done{color:${C.ink}} #rn-crm .isteps li.done::before{content:'✓';background:${C.cloth};color:#fff}
  #rn-crm .isteps li.need{color:${C.amber};font-weight:bold} #rn-crm .isteps li.need::before{content:'!';background:${C.amber};color:#fff}
  #rn-crm .isteps li.error{color:${C.red}} #rn-crm .isteps li.error::before{content:'×';background:${C.red};color:#fff}
  #rn-crm .ist p{margin:0 0 5px;font-size:11.5px;color:${C.sub}} #rn-crm .ist b{color:${C.ink}}

#rn-crm .setup{margin-top:4px;border-radius:6px}
  #rn-crm .setup.todo{padding:8px 9px;border:2px solid ${C.amber};background:#FFF8EE}
  #rn-crm .setup.todo h5{margin:0 0 4px;font-size:12.5px;color:${C.amber}}
  #rn-crm .setup.todo p{margin:0 0 5px;font-size:11px;color:${C.sub}}
  #rn-crm .setup ul{margin:0;padding:0;list-style:none}
  #rn-crm .setup li{display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:12px;border-top:1px dashed #EBD9BE}
  #rn-crm .setup li:first-child{border-top:0}
  #rn-crm .setup li.ok{color:${C.cloth}} #rn-crm .setup li.no{color:${C.ink};font-weight:bold}
  #rn-crm .setup li button{padding:2px 8px;border:1px solid ${C.amber};background:#fff;color:${C.amber};font-size:11px}
  #rn-crm .setup.done{padding:4px 2px;font-size:11px;color:${C.cloth}}
  #rn-crm .autohelp{display:none;margin-top:6px;padding:8px 9px;background:#F6F8F7;border:1px solid ${C.line};border-radius:6px;font-size:11.5px;line-height:1.55} #rn-crm.showauto .autohelp{display:block} #rn-crm .autohelp ol{margin:4px 0;padding-left:18px} #rn-crm .autohelp p{margin:4px 0} #rn-crm .autohelp code{font-size:10.5px;background:#fff;padding:0 3px;border-radius:3px;word-break:break-all}
  #rn-crm .auto{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12px}
  #rn-crm .auto input[type=time]{border:1px solid ${C.line};border-radius:4px;padding:2px 4px;font-size:12px;color:${C.ink}}
  #rn-crm .auto .an{color:${C.sub};font-size:11px;margin-left:auto}
  #rn-crm .sw{position:relative;display:inline-block;width:32px;height:18px} #rn-crm .sw input{opacity:0;width:0;height:0}
  #rn-crm .sw span{position:absolute;inset:0;background:#C3CCC8;border-radius:9px;transition:.2s;cursor:pointer}
  #rn-crm .sw span::before{content:'';position:absolute;left:2px;top:2px;width:14px;height:14px;background:#fff;border-radius:50%;transition:.2s}
  #rn-crm .sw input:checked+span{background:${C.cloth}} #rn-crm .sw input:checked+span::before{transform:translateX(14px)}
  #rn-crm .guide h4{margin:8px 0 2px;font-size:12.5px} #rn-crm .guide p{margin:0 0 5px}`;
  document.head.appendChild(style);

  const el = document.createElement('div'); el.id = 'rn-crm';
  el.innerHTML = `
  <div class="hd"><b>리드나우 고객 수집</b><span>v${APP_VER} (눌러서 접기)</span></div>
  <div class="bd">
    <div class="setup"></div>
    <div class="sec">
      <button class="b1" data-a="bulk">전체 일괄 수집</button>
      <div class="hint" style="font-size:11px;color:#5B6B66;margin:4px 0 0">⏰ 매일 자동 수집(묻고 답하기·반품·고객 일괄 등)은 <b>상품 탭 맨 위</b>에서 켜고 시각을 정합니다.</div>
      <div class="ctl"><button data-a="pause">일시정지</button></div>
      <div class="ctl"><button data-a="resume">이어하기</button></div>
    </div>
    <div class="sec">
      <p class="cap">개별 수집</p>
      <div class="g2">
        <button class="b2" data-a="orders">전체주문</button><button class="b2" data-a="cancels">취소주문</button><button class="b2" data-a="returns">반품</button>
        <button class="b2" data-a="qna">묻고 답하기</button><button class="b2" data-a="reviews">구매평</button>
      </div>
    </div>
    <div class="st"><div class="stt">대기 중</div><div class="bar"><i></i></div><div class="stn"></div><div class="now"></div><dl class="nums"></dl></div>
    <div class="sec quiet">
      <span class="cap" style="margin:2px 2px 0 0">점검</span><button class="b3" data-a="verify">검증</button><button class="b3" data-a="recheck">문제 주문 재확인</button><button class="b3" data-a="issues">확인 필요<span class="badge zero">0</span></button>
    </div>
    <div class="fb"><div class="fbs">Firebase: 확인 중</div>
      <div class="fbl"></div>
      <div class="fbq"></div>
      <div class="fbrow"><button class="bf" data-a="fblogin">구글 로그인</button><button class="bf" data-a="upload">Firebase로 올리기</button></div>
      <div style="margin-top:3px;display:flex;gap:10px"><button class="b3" data-a="fbcheck">올라간 내용 대조</button><button class="b3" data-a="fbusage">Firebase 실제 사용량 보기</button></div>
    </div>
    <div class="foot">
      <span><button class="b3" data-a="importpane">엑셀·시트 가져오기</button><button class="b3" data-a="export">백업 저장</button><button class="b3" data-a="import">불러오기</button></span>
      <span><button class="b3" data-a="settings">설정</button> <button class="b3" data-a="guide">사용 안내</button></span>
    </div>
    <div class="pane set">
      <p style="font-size:11.5px;color:#5B6B66;margin:2px 0 6px">알라딘 요청 간격은 상품·고객·가격 감시가 모두 같은 자동 조절 하나를 씁니다 → 상품·매입 탭의 설정 '알라딘 요청 간격'에서 바꿉니다.</p>
      <label class="chk"><input data-s="forceFull" type="checkbox"> 다음 실행은 처음부터 전체 수집</label>
      <label class="chk"><input data-s="autoUpload" type="checkbox"> 일괄 수집이 끝나면 Firebase로 자동으로 올리기</label>
      <label class="chk"><input data-s="autoLogin" type="checkbox"> 로그인이 풀리면 자동으로 다시 로그인</label>
      <label>자동 로그인 최대 시도 횟수 (0 = 무제한)<input data-s="maxLoginTries" type="number" step="1" min="0"></label>
      <label>자동 로그인 재시도 간격(초)<input data-s="loginRetrySec" type="number" step="10" min="10"></label>
      <label>Firebase 요금제</label>
      <label class="chk"><input type="radio" name="rn-bill" data-bill="paid"> 유료 (Blaze, 사용한 만큼 청구)</label>
      <label class="chk"><input type="radio" name="rn-bill" data-bill="free"> 무료 (Spark, 하루 2만 건에서 멈춤)</label>
      <label>유료일 때 하루 쓰기 안전 상한 (건)<input data-s="dailyWriteCap" type="number" step="10000" min="1000"></label>
      <label>이 날짜까지는 상한 없이 쓰기 (무료 크레딧 기간)<input data-s="noCapUntil" type="date"></label>
      <label class="chk"><input data-s="remoteRun" type="checkbox"> 핸드폰·웹앱의 수집 요청을 이 PC에서 받기</label>
      <label class="chk"><input data-s="syncTooltip" type="checkbox"> 매일 판매자 툴팁 데이터도 가져오기</label>
      <label>우리 가게 판매자 번호(SC, 배송비 정책 확인용)<input data-s="shopSc" type="text"></label>
      <label>이 PC 이름 (여러 PC 구분용, 예: 사무실-1)<input data-c="pcname" type="text" autocomplete="off"></label>
      <label>알라딘 아이디<input data-c="id" type="text" autocomplete="off"></label>
      <p style="margin:3px 0 0;font-size:11px;color:${C.sub}">비밀번호 칸을 비워 두고 저장하면 기존 비밀번호가 유지됩니다. 아이디를 지우고 저장하면 아이디·비밀번호가 모두 삭제됩니다.</p>
      <label>알라딘 비밀번호 <b class="pwst" data-for="pw"></b><input data-c="pw" type="password" autocomplete="new-password"></label>
      <label>Firebase 로그인 방식</label>
      <label class="chk"><input type="radio" name="rn-fbmode" value="google" data-m="google"> 구글 계정 (기본, 권장)</label>
      <label class="chk"><input type="radio" name="rn-fbmode" value="password" data-m="password"> Firebase 전용 계정 (구글 창이 안 될 때만)</label>
      <div class="fbpwbox">
      <label>Firebase 전용 이메일<input data-c="fbemail" type="text" name="rn-fb-x1" autocomplete="off" readonly onfocus="this.removeAttribute('readonly')"></label>
      <label>Firebase 전용 비밀번호 <b class="pwst" data-for="fbpw"></b><input data-c="fbpw" type="password" name="rn-fb-x2" autocomplete="new-password" readonly onfocus="this.removeAttribute('readonly')"></label>
      </div>
      <div class="row"><button data-a="saveset">설정 저장</button><button data-a="logintest">자동 로그인 시험</button></div>
    </div>
    <div class="pane guide">${GUIDE}</div>
    <div class="pane iss"></div>
    <div class="pane imp">
      <div class="drop" tabindex="0" role="button">
        <b>파일을 여기에 끌어다 놓으세요</b>
        <span>또는 눌러서 선택. 판매완료 엑셀, 고객·판매자 구글 시트(.xlsx), 판매자 툴팁 데이터(.json)를 함께 넣어도 됩니다. 어떤 파일인지는 자동으로 알아봅니다.</span>
      </div>
      <ol class="isteps">
        <li data-n="1" class="wait">파일 읽기<small></small></li>
        <li data-n="2" class="wait">이 PC에 정리 (어긋난 열 맞춤, 고객 연결)<small></small></li>
        <li data-n="3" class="wait">Firebase에 올리기<small></small></li>
      </ol>
      <div class="ist"><p class="cap" style="margin:8px 0 2px">마지막으로 가져온 파일</p>
        <p><b>판매완료 엑셀</b><br><span class="ist-sales"></span></p>
        <p><b>고객 구글 시트</b> (구글 시트 → 파일 → 다운로드 → Microsoft Excel)<br><span class="ist-sheet"></span></p>
        <p><b>판매자 툴팁 데이터</b> (툴팁의 데이터 다운로드 버튼으로 받은 .json)<br><span class="ist-sjson"></span></p>
      </div>
    </div>
    <input class="fx" type="file" accept=".xlsx,.xls,.json" multiple style="display:none">
    <div class="log"></div>
    <input type="file" accept=".json" style="display:none">
  </div>`;
  document.body.appendChild(el);
  const $ = (s) => el.querySelector(s);
  if (localStorage.getItem('rn-crm-min') === '1') el.classList.add('min');
  $('.hd').onclick = () => { el.classList.toggle('min'); localStorage.setItem('rn-crm-min', el.classList.contains('min') ? '1' : '0'); };

  function log(msg, cls = '') {
    window.__rnLog && window.__rnLog('고객', cls === 'err' ? 'err' : cls === 'warn' ? 'warn' : cls === 'ok' ? 'ok' : 'info', msg);
    const p = document.createElement('p'); p.className = cls;
    p.textContent = `${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ${msg}`;
    $('.log').prepend(p); while ($('.log').children.length > 60) $('.log').lastChild.remove();
  }
  function setNow(t) { $('.now').textContent = t; window.__rnLog && window.__rnLog('고객', 'detail', t); if (window.__rnStatus && window.__rnStatus.crm) window.__rnStatus.crm.sub = t; }
  function progress(label, done, total) {
    if (window.__rnStatus) window.__rnStatus.crm = { active: true, label: (currentTask ? `${TASKS[currentTask].label} · ` : '') + label, done, total, sub: $('.now') ? $('.now').textContent : '' };
    $('.stt').textContent = (currentTask ? `[${TASKS[currentTask].label}] ` : '') + label;
    $('.bar i').style.width = (total ? Math.min(100, (done / total) * 100) : 0).toFixed(1) + '%';
    const avg = reqTimes.length ? reqTimes.reduce((a, b) => a + b, 0) / reqTimes.length : 0;
    const left = avg && total ? Math.round(((total - done) * avg) / 60000) : null;
    $('.stn').textContent = `${done.toLocaleString()} / ${(total || 0).toLocaleString()}` + (left != null && total > done ? `, 이 단계 약 ${left}분 남음` : '');
  }
  let stats = {};
  // (1.34.0) 화면을 열 때마다 주문 상세(수만 건) 전체를 읽어 세던 것 → 갯수는 count로, 판매·취소·개인정보 나눔은 작업이 끝났을 때만 새로 셈(그 사이엔 지난 값)
  async function refreshStats(full) {
    const nLines = await dbCount('orderLines'), nPops = await dbCount('popups'); let sp = GM_getValue('rnu-stat-split', null);
    if (full || !sp || sp.lines !== nLines || sp.pops !== nPops) { if (full || !sp) { const lines = await dbAll('orderLines'); const pops = await dbAll('popups'); sp = { lines: nLines, pops: nPops, sale: lines.filter((l) => l.kind === 'sale').length, cancel: lines.filter((l) => l.kind === 'cancel').length, pii: pops.filter((x) => x.piiAvailable).length }; GM_setValue('rnu-stat-split', sp); } }
    stats = {
      '판매 상품 줄': sp.sale + (sp.lines !== nLines ? ' (지난 집계)' : ''),
      '취소 상품 줄': sp.cancel + (sp.lines !== nLines ? ' (지난 집계)' : ''),
      '주문 상세': nPops,
      '개인정보 확보한 주문': sp.pii + (sp.pops !== nPops ? ' (지난 집계)' : ''),
      '반품': await dbCount('returns'),
      '묻고 답하기 (상세)': `${await dbCount('qnaList')} (${await dbCount('qnaDetail')})`,
      '구매평': await dbCount('reviews'),
      '엑셀 줄 / 시트 행': `${(await dbCount('excelLines')).toLocaleString()} / ${await dbCount('sheetRows')}`,
      'Firebase에 올린 문서': await dbCount('uploaded'),
    };
  }
  const ISSUE_LABEL = { V_NO_POPUP: '주문 상세를 못 받은 주문', V_LINE_COUNT: '목록 줄 수와 상세 상품 수가 다름', V_TOTAL: '판매가 합계와 판매총액이 다름', V_STATUS: '주문상태가 정상이 아님 (과거 반품·취소 흔적)',
    V_ROW_STATUS: '목록 행 상태가 정상이 아님', V_CANCEL_OVERLAP: '판매 목록과 취소 목록에 모두 있는 주문', V_COUNT: '수집 줄 수가 샵매니저 표시보다 적음', EMPTY_PAGE: '빈 페이지', POPUP_MISMATCH: '상세 주문번호 불일치', RETURN_URL: '반품 페이지 인식 실패', RETURN_PAGES: '반품 목록 여러 페이지' };
  async function renderIssues() {
    const iss = await dbAll('issues'); const g = {}; iss.forEach((i) => (g[i.type] = g[i.type] || []).push(i));
    $('.iss').innerHTML = `<div class="row"><button data-a="issuecsv">전체 목록 파일로 저장 (CSV)</button></div>` + (iss.length ? '' : '<p>확인할 것이 없습니다.</p>') +
      Object.entries(g).map(([t, a]) => `<h4>${ISSUE_LABEL[t] || t}: ${a.length}건</h4>` + a.slice(0, 15).map((i) => `<p>${i.key}: ${String(i.detail).replace(/</g, '&lt;')}</p>`).join('') + (a.length > 15 ? `<p>… 외 ${a.length - 15}건 (CSV로 전체 확인)</p>` : '')).join('');
  }
  async function exportIssuesCsv() {
    const iss = await dbAll('issues'); const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = '\ufeff' + ['종류,설명,주문번호/대상,내용'].concat(iss.map((i) => [i.type, ISSUE_LABEL[i.type] || '', i.key, i.detail].map(q).join(','))).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'readnow-crm-확인필요.csv'; document.body.appendChild(a); a.click(); a.remove();
  }
  // 이 PC 준비 상태: PC마다 한 번씩 해야 하는 설정을 빠짐없이 보여줌
  function renderSetup() {
    const cred = (GM_getValue('rn-cred', null) || GM_getValue('rnp-cred', null));
    const items = [
      { k: 'login', ok: !!fbUser, label: '구글 로그인 (Firebase)', btn: '로그인', why: '여러 PC 잠금·올리기에 필요' },
      { k: 'pcname', ok: !!PC.name, label: `이 PC 이름${PC.name ? `: ${PC.name}` : ''}`, btn: '정하기', why: '어느 PC가 작업 중인지 구분' },
      { k: 'cred', ok: !!(cred && cred.id && cred.pw), label: '알라딘 아이디·비밀번호', btn: '넣기', why: '로그인이 풀려도 자동 재로그인' },
      { k: 'core', ok: verNum(P.VERSION) >= verNum(NEED_CORE), label: `파서 파일 ${P.VERSION}${verNum(P.VERSION) >= verNum(NEED_CORE) ? '' : ` (필요: ${NEED_CORE})`}`, btn: '방법', why: 'GitHub의 파서 파일이 최신이어야 함' },
    ];
    if (settings.billing === 'paid' && settings.noCapUntil) {
      const days = Math.round((new Date(settings.noCapUntil) - new Date(todayKst())) / 864e5);
      if (days <= 14) items.push({ k: 'cap', ok: false, label: days >= 0 ? `무료 크레딧 기간이 ${days}일 남았습니다 (${settings.noCapUntil}). 그 뒤 하루 쓰기 상한(지금 ${(settings.dailyWriteCap || 200000).toLocaleString()}건)을 정해 주세요` : `크레딧 기간이 끝났습니다. 하루 쓰기 상한 ${(settings.dailyWriteCap || 200000).toLocaleString()}건이 적용 중입니다. 확인 후 설정에서 날짜를 지우세요`, btn: '설정', why: '' });
    }
    const box = $('.setup'); const todo = items.filter((x) => !x.ok);
    if (!todo.length) { box.className = 'setup done'; box.textContent = `✓ 이 PC 준비 완료 (${PC.name}): 로그인·PC 이름·알라딘 계정·파서 파일`; return; }
    box.className = 'setup todo';
    box.innerHTML = `<h5>${todo.some((x) => x.k === 'cap') && todo.length === 1 ? '확인이 필요합니다' : `이 PC에서 처음 한 번 해야 할 설정 (${items.filter((x) => x.k !== 'cap').length - todo.filter((x) => x.k !== 'cap').length}/${items.filter((x) => x.k !== 'cap').length})`}</h5><p>PC마다 따로 저장됩니다. 새 PC에서는 이 칸이 다시 나타납니다.</p><ul>` +
      items.map((x) => `<li class="${x.ok ? 'ok' : 'no'}" title="${x.why}"><span>${x.ok ? '✓' : '○'} ${x.label}</span>${x.ok ? '' : `<button data-a="setup_${x.k}">${x.btn}</button>`}</li>`).join('') + '</ul>';
  }
  async function saveSettingsUI(keepOpen) {
      el.querySelectorAll('[data-s]').forEach((i) => {
        const k = i.dataset.s; const v = parseFloat(i.value);
        if (i.type === 'checkbox') settings[k] = i.checked;
        else if (k.startsWith('delay')) settings[k] = Math.max(500, Math.round(v * 1000) || DEFAULTS[k]);
        else if (k === 'maxLoginTries') settings[k] = Number.isFinite(v) && v >= 0 ? Math.floor(v) : DEFAULTS[k];
        else if (k === 'loginRetrySec') settings[k] = Number.isFinite(v) && v >= 10 ? Math.round(v) : DEFAULTS[k];
        else if (k === 'dailyWriteCap') settings[k] = Number.isFinite(v) && v >= 1000 ? Math.round(v) : DEFAULTS[k];
        else if (k === 'noCapUntil') settings[k] = i.value || '';
        else if (k === 'shopSc') settings[k] = String(i.value || '').replace(/\D/g, '') || DEFAULTS[k];
      });
      if (settings.delayMax < settings.delayMin) settings.delayMax = settings.delayMin;
      const pcn = $('[data-c="pcname"]').value.trim(); if (pcn) { PC.name = pcn; GM_setValue('rn-pc', PC); window.__rnPcName && window.__rnPcName.set(pcn); }
      const id = $('[data-c="id"]').value.trim(); const pw = $('[data-c="pw"]').value; const old = (GM_getValue('rn-cred', null) || GM_getValue('rnp-cred', null));
      if (id) GM_setValue('rn-cred', { id, pw: pw || (old && old.pw) || '' }); else GM_deleteValue('rn-cred');
      $('[data-c="pw"]').value = '';
      const br = el.querySelector('[data-bill]:checked'); if (br) settings.billing = br.dataset.bill;
      const mr = el.querySelector('[data-m]:checked'); GM_setValue('rn-fbmode', mr ? mr.dataset.m : 'google');
      const fe = $('[data-c="fbemail"]').value.trim(); const fp = $('[data-c="fbpw"]').value; const ofp = GM_getValue('rn-fbpw', null);
      if (fe) GM_setValue('rn-fbpw', { email: fe, pw: fp || (ofp && ofp.pw) || '' }); else GM_deleteValue('rn-fbpw');
      $('[data-c="fbpw"]').value = '';
      await saveSettings(); log('설정을 저장했습니다.', 'ok'); if (!keepOpen) el.classList.remove('showset'); render();
  }
  async function render() {
    try { renderSetup(); } catch (e) {}
    /* (1.34.0) 예전 '매일 자동 수집' 스위치는 상품 탭 위 '⏰ 매일 자동 수집'으로 옮김 */
    $('.nums').innerHTML = Object.entries(stats).map(([k, v]) => `<dt>${k}</dt><dd>${typeof v === 'number' ? v.toLocaleString() : v}</dd>`).join('');
    el.querySelectorAll('[data-a]').forEach((b) => { const a = b.dataset.a; b.disabled = running ? !['pause', 'guide', 'settings', 'issues', 'importpane', 'fbusage', 'setup_pcname', 'setup_cred', 'setup_core', 'setup_cap', 'autohelp'].includes(a) : a === 'pause'; });
    const ob = !running && otherTabBusy();
    if (ob) { el.querySelectorAll('[data-a]').forEach((b) => { if (['bulk', 'orders', 'cancels', 'returns', 'qna', 'reviews', 'verify', 'recheck', 'upload', 'resume'].includes(b.dataset.a)) b.disabled = true; }); }
    const r = running || ob ? null : await resumable();
    $('[data-a="pause"]').parentElement.classList.toggle('on', running);
    $('[data-a="resume"]').parentElement.classList.toggle('on', !running && !!r);
    $('[data-a="resume"]').disabled = !r;
    if (r) $('.stt').textContent = `멈춘 작업 있음: ${r === 'bulk' ? '전체 일괄 수집' : TASKS[r].label} — 개요 탭 '멈춘 작업'에서 이어하기`;
    if (ob) { $('.stt').textContent = `이 PC의 다른 탭(${ob.page === 'worders.aspx' ? '주문조회' : '판매관리'})에서 '${ob.label}' 진행 중`; $('.now').textContent = '진행 상황은 그 탭에서 보입니다. 끝나면 이 탭 숫자도 자동으로 갱신됩니다.'; }
    const ic = await dbCount('issues'); const bg = $('.badge'); bg.textContent = ic.toLocaleString(); bg.classList.toggle('zero', ic === 0);
    el.querySelectorAll('[data-s]').forEach((i) => { if (document.activeElement === i) return; const k = i.dataset.s; if (i.type === 'checkbox') i.checked = !!settings[k]; else i.value = k.startsWith('delay') ? settings[k] / 1000 : settings[k] ?? ''; });
    const cred = (GM_getValue('rn-cred', null) || GM_getValue('rnp-cred', null)); $('[data-c="id"]').value = cred ? cred.id : '';
    if (document.activeElement !== $('[data-c="pcname"]')) $('[data-c="pcname"]').value = PC.name || '';
    for (const [key, store] of [['pw', 'rn-cred'], ['fbpw', 'rn-fbpw']]) {
      const v = GM_getValue(store, null); const has = !!(v && v.pw); const st = $(`.pwst[data-for="${key}"]`); const inp = $(`[data-c="${key}"]`);
      st.textContent = has ? '(저장되어 있음)' : '(저장 안 됨)'; st.className = 'pwst ' + (has ? 'on' : 'off');
      inp.placeholder = has ? '●●●●●●●● 저장됨 (바꿀 때만 새로 입력)' : '비밀번호를 입력하세요';
    }
    el.querySelectorAll('[data-bill]').forEach((r) => { if (document.activeElement !== r) r.checked = r.dataset.bill === (settings.billing || 'paid'); });
    const mode = GM_getValue('rn-fbmode', 'google'); el.querySelectorAll('[data-m]').forEach((r) => { if (document.activeElement !== r) r.checked = r.dataset.m === mode; });
    $('.fbpwbox').style.display = mode === 'password' ? '' : 'none';
    const fpc = GM_getValue('rn-fbpw', null); if (document.activeElement !== $('[data-c="fbemail"]')) $('[data-c="fbemail"]').value = fpc ? fpc.email : '';
    { const used = await writesToday(); const hit = settings.billing !== 'paid' && await limitHitToday(); const q = $('.fbq'); q.classList.toggle('hot', hit || (writeCap() !== Infinity && used > writeCap() * 0.7));
      q.innerHTML = hit ? `<b>오늘 무료 쓰기 한도(2만 건)에 도달한 것으로 보입니다.</b><br>초기화: <b>${resetText()}</b>. 그 뒤 이어하기를 누르세요.`
        : settings.billing === 'paid' ? `유료(Blaze): 무료 2만 건을 넘으면 사용한 만큼 청구. ${noCapNow() ? `<b>${settings.noCapUntil}까지 상한 없음</b> (크레딧 기간), 그 뒤 하루 ${(settings.dailyWriteCap || 200000).toLocaleString()}건` : `하루 안전 상한 <b>${writeCap().toLocaleString()}건</b>`}<br>오늘 사용량 약 <b>${used.toLocaleString()}건</b> · 날짜 기준 초기화: ${resetText()}` : `무료 쓰기 한도 <b>하루 2만 건</b>. 이 PC가 센 오늘 사용량 약 <b>${used.toLocaleString()}건</b><br><span style="font-size:10.5px">(이 PC에서 올린 것만 셉니다. 다른 PC·예전 버전에서 올린 양은 빠짐)</span><br>다음 초기화: <b>${resetText()}</b>`; }
    { const L = $('.fbl'); const other = lockInfo && lockInfo.holder && lockInfo.holder !== PC.id && Date.now() - (lockInfo.heartbeatMs || 0) < 5 * 60000;
      L.classList.toggle('busy', !!other);
      L.textContent = other ? `지금 다른 PC(${lockInfo.pcName})에서 '${lockInfo.taskLabel}' 작업 중입니다. 끝날 때까지 이 PC에서는 수집·올리기를 시작할 수 없습니다.` : `이 PC: ${PC.name || '(이름 없음, 처음 작업할 때 정합니다)'}`; }
    $('.fbs').textContent = !FB ? 'Firebase: 불러오기 실패 (새로고침 필요)' : fbUser ? `Firebase: ${fbUser.email} 로그인됨` : 'Firebase: 로그인 안 됨';
    $('[data-a="fblogin"]').textContent = fbUser ? '로그아웃' : fbLoggingIn ? '로그인 창 대기 중' : (GM_getValue('rn-fbmode', 'google') === 'password' && GM_getValue('rn-fbpw', null) ? 'Firebase 로그인' : '구글 로그인'); if (!running) $('[data-a="fblogin"]').disabled = !FB || fbLoggingIn;
  }

  el.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return; const a = b.dataset.a;
    if (TASKS[a] || a === 'bulk' || a === 'resume') window.__rnResumeOk && window.__rnResumeOk(); // 사람이 시작·이어하기를 누르면 일시정지 풀림
    if (TASKS[a] || a === 'bulk') {
      try { const lc = 0; if (false && a === 'bulk' && lc < 1000 && !GM_getValue('rnu-crm-complete', false) && !confirm(`이 PC에는 상세까지 받은 예전 주문이 ${lc}건뿐입니다.\n지금 시작하면 '이미 받은 주문'을 알아보지 못해 처음부터 전부 훑습니다 (몇 시간).\n고객·주문은 평소 기록이 있는 PC(${GM_getValue('rnu-autopc', 'JS-MAIN')})에서 하는 것이 좋습니다.\n\n그래도 이 PC에서 할까요?`)) return; } catch (e) {}
      const r = await resumable();
      if (r && !confirm(`멈춘 작업(${r === 'bulk' ? '전체 일괄 수집' : TASKS[r].label})이 있습니다.\n새로 시작하면 그 작업은 처음부터 다시 합니다. 이미 모은 데이터는 지워지지 않습니다.\n\n새로 시작할까요? (취소를 누르고 '이어하기'를 쓰셔도 됩니다)`)) return;
      if (r) for (const n of ['bulk', ...Object.keys(TASKS)]) { const j = await loadJob(n); if (['paused', 'running', 'error'].includes(j.status)) { j.status = 'idle'; await saveJob(j); } }
      start(a, { fresh: true });
    } else if (a === 'fblogin') { if (fbUser) { await FB.auth().signOut(); log('Firebase 로그아웃했습니다.'); } else await fbLogin(); render();
    } else if (a === 'setup_login') { await fbLogin(); render();
    } else if (a === 'setup_cap') { el.classList.add('showset'); el.classList.remove('showguide', 'showiss', 'showimp'); const f = $('[data-s="dailyWriteCap"]'); f.scrollIntoView({ block: 'center' }); f.focus();
    } else if (a === 'setup_pcname' || a === 'setup_cred') { el.classList.add('showset'); el.classList.remove('showguide', 'showiss', 'showimp'); const f = $(a === 'setup_pcname' ? '[data-c="pcname"]' : '[data-c="id"]'); f.scrollIntoView({ block: 'center' }); f.focus();
    } else if (a === 'setup_core') { alert(`GitHub의 readnow-orders-core.js가 옛 버전(${P.VERSION})입니다.\n\n1) 가장 최근에 받은 readnow-orders-core.js 파일을 github.com/jerrycson/readnow-scripts 에 Add file → Upload files로 올리고 Commit changes\n2) 5분쯤 뒤 이 페이지를 새로고침\n\n필요한 버전: ${NEED_CORE}`);
    } else if (a === 'autohelp') { el.classList.toggle('showauto');
    } else if (a === 'fbusage') { window.open(`https://console.firebase.google.com/project/${FIREBASE_CONFIG.projectId}/firestore/databases/-default-/usage`, '_blank');
    } else if (a === 'pause') { pauseRequested = true; log('지금 요청이 끝나면 멈춥니다.'); window.__rnPauseAll && window.__rnPauseAll('고객 패널에서'); }
    else if (a === 'resume') { const r = await resumable(); if (r) start(r); }
    else if (a === 'export') exportBackup();
    else if (a === 'import') $('input[type=file][accept=".json"]').click();
    else if (a === 'settings') { el.classList.toggle('showset'); el.classList.remove('showguide', 'showiss'); }
    else if (a === 'guide') { el.classList.toggle('showguide'); el.classList.remove('showset', 'showiss'); }
    else if (a === 'issues') { el.classList.toggle('showiss'); el.classList.remove('showset', 'showguide'); if (el.classList.contains('showiss')) renderIssues(); }
    else if (a === 'issuecsv') exportIssuesCsv();
    else if (a === 'importpane') { el.classList.toggle('showimp'); el.classList.remove('showset', 'showguide', 'showiss'); if (el.classList.contains('showimp')) renderImportStatus(); }
    else if (a === 'saveset') { await saveSettingsUI(false);
    } else if (a === 'logintest') {
      if (await isLoggedIn()) { alert('지금은 로그인되어 있어 시험할 수 없습니다.\n다른 탭에서 알라딘 로그아웃을 한 뒤 다시 눌러 주세요.'); return; }
      running = true; render();
      try { await autoRelogin(''); log((await isLoggedIn()) ? '자동 로그인 시험 성공' : '자동 로그인 시험 실패: 로그인 화면 파일을 보내주시면 맞춰 고치겠습니다.', (await isLoggedIn()) ? 'ok' : 'err'); }
      catch (e) { log('자동 로그인 시험 실패: ' + e.message, 'err'); }
      finally { running = false; render(); }
    }
  });
  $('.fx').onchange = (e) => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) handleImportFiles(fs); };
  const drop = $('.drop');
  drop.onclick = () => $('.fx').click();
  drop.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('.fx').click(); } };
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); e.stopPropagation(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); e.stopPropagation(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => { const fs = e.dataTransfer ? [...e.dataTransfer.files] : []; if (fs.length) handleImportFiles(fs); });
  el.addEventListener('dragover', (e) => e.preventDefault()); el.addEventListener('drop', (e) => e.preventDefault()); // 패널에 잘못 떨어뜨려도 브라우저가 파일을 열지 않게

  el.querySelectorAll('[data-m]').forEach((r) => (r.onchange = () => { $('.fbpwbox').style.display = r.dataset.m === 'password' && r.checked ? '' : 'none'; }));
  /* ── 핸드폰 등 웹앱에서 보낸 '수집 요청' 받기 ──
   *  이 PC에 판매관리·주문조회 탭이 열려 있고 로그인되어 있으면 2분마다 '대기 중'을 알리고,
   *  요청이 오면 먼저 받은 PC 한 대만 전체 일괄 수집을 시작함 */
  let remoteInit = false; let lastReqSeen = GM_getValue('rn-last-req', null);
  async function remoteLoop() {
    if (!fdb || !fbUser || remoteInit) return; remoteInit = true;
    const beat = () => { if (!settings.remoteRun || !fbUser) return; SYS().doc('collectors').set({ [PC.id]: { pcName: PC.name || PC.id, lastSeen: now(), running: running, page: location.pathname.split('/').pop() }, writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {}); };
    beat(); setInterval(beat, 120000);
    SYS().doc('collectRequest').onSnapshot(async (d) => {
      if (!d.exists || !settings.remoteRun) return; const r = d.data();
      if (!r || r.state !== 'requested' || r.id === lastReqSeen) return;
      if (Date.now() - Date.parse(r.requestedAt || 0) > 30 * 60000) return; // 30분 넘은 요청은 무시
      if (running || otherTabBusy()) return;
      // 한 대만 받도록: 트랜잭션으로 '받음' 표시
      let mine = false;
      try { await fdb.runTransaction(async (tx) => { const cur = await tx.get(SYS().doc('collectRequest')); const c = cur.data() || {}; if (c.id !== r.id || c.state !== 'requested') return; tx.set(SYS().doc('collectRequest'), { state: 'claimed', claimedBy: PC.name || PC.id, claimedAt: now(), writerSchema: WRITER_SCHEMA }, { merge: true }); mine = true; }); } catch (e) { return; }
      lastReqSeen = r.id; GM_setValue('rn-last-req', r.id);
      if (!mine) return;
      log(`${r.byName || '웹앱'}의 수집 요청을 받아 전체 일괄 수집을 시작합니다.`, 'ok'); beat();
      const rs = await resumable(); await start('bulk', { fresh: rs !== 'bulk' });
      const bj = await loadJob('bulk'); SYS().doc('collectRequest').set({ state: bj.status === 'done' ? 'done' : 'stopped', finishedAt: now(), message: bj.status === 'done' ? null : bj.message || null, writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {}); beat();
    }, () => {});
  }
  setInterval(() => remoteLoop().catch(() => {}), 5000);
  // 웹앱의 [지금 수집] 버튼으로 열린 경우: 로그인이 준비되면 전체 일괄 수집을 시작(멈춘 게 있으면 이어서), 끝나면 창을 닫음
  if (/rnrun=bulk/.test(location.hash)) {
    const closeAfter = /rnclose=1/.test(location.hash); history.replaceState(null, '', location.pathname + location.search);
    (async () => {
      for (let i = 0; i < 40 && !fbUser; i++) await sleep(500);
      if (running) return; if (window.__rnPaused) { log('웹앱 요청: 이 PC는 일시정지 상태라 시작하지 않습니다 (다시 시작을 눌러 주세요)', 'warn'); return; } if (otherTabBusy()) { log('웹앱 요청: 이 PC의 다른 탭에서 이미 수집 중이라 건너뜁니다.', 'warn'); return; }
      log('웹앱에서 요청한 수집을 시작합니다.', 'ok');
      autoTriggered = true; const r = await resumable(); await start('bulk', { fresh: r !== 'bulk' }); autoTriggered = false;
      const bj = await loadJob('bulk');
      if (closeAfter && bj.status === 'done') { log('끝나서 10초 뒤 이 창을 닫습니다.', 'ok'); setTimeout(() => { try { window.close(); } catch (e) {} }, 10000); }
    })();
  }
  // 자동 수집 설정: 바꾸는 즉시 저장
  /* (1.34.0) 예전 매일 자동 스위치 묶음 없앰 — '⏰ 매일 자동 수집'(상품 탭) */
  // 설정 칸도 바꾸는 즉시 저장 (비밀번호 칸 제외)
  el.querySelector('.set').addEventListener('change', (e) => { if (e.target.matches('[data-c="pw"],[data-c="fbpw"]')) return; saveSettingsUI(true); });
  setInterval(() => autoRunCheck().catch(() => {}), 60000); setTimeout(() => autoRunCheck().catch(() => {}), 15000);
  $('input[type=file][accept=".json"]').onchange = (e) => { const f = e.target.files[0]; if (f) importBackup(f).catch((er) => log('백업 불러오기 실패: ' + er.message, 'err')); e.target.value = ''; };
  window.addEventListener('beforeunload', (e) => { if (running) { e.preventDefault(); e.returnValue = ''; } });

  for (const n of ['bulk', ...Object.keys(TASKS)]) { const j = await loadJob(n); if (j.status === 'running') { j.status = 'paused'; j.message = '창이 닫혀 중단됨'; await saveJob(j); } }
  await refreshStats(); render();
  log(`준비됨 (파서 ${P.VERSION})`);
  if (!(GM_getValue('rn-cred', null) || GM_getValue('rnp-cred', null))) log('설정에 알라딘 아이디·비밀번호를 넣으면 로그인이 풀려도 자동으로 다시 로그인합니다.', 'warn');
  /* ═══════════ 리드나우 추가 (고객 수집기 0.15.1): 진행 상황 공유 ═══════════
   * 30초마다 rn_status/crm_{PC}에 진행 상황을 올림 → 웹앱 위쪽·다른 PC에서 진행률·남은 시간이 보임.
   * 보기용 기록이라 실패해도 수집에는 영향 없음 */
  {
    let last = { label: '', done: 0, total: 0, left: null }; let pubAt = 0; let wasRunning = false;
    const pub = (force) => {
      if (!fdb || !fbUser) return; if (!force && Date.now() - pubAt < 30000) return; pubAt = Date.now();
      const task = running && currentTask && TASKS[currentTask] ? TASKS[currentTask].label : null;
      fdb.collection('rn_status').doc('crm_' + PC.id).set({ tool: '고객 수집기', pcName: PC.name || PC.id, running: running ? (task || '수집') : null,
        state: task ? `${task} · ${last.label}` : last.label || '대기', done: running ? last.done : 0, total: running ? last.total : 0, etaMin: running ? last.left : null, atMs: Date.now(), writerSchema: WRITER_SCHEMA }, { merge: true }).catch(() => {});
    };
    const _progress = progress;
    progress = function (label, done, total) {
      _progress(label, done, total);
      const avg = reqTimes.length ? reqTimes.reduce((a, b) => a + b, 0) / reqTimes.length : 0;
      last = { label, done: done || 0, total: total || 0, left: avg && total ? Math.round(((total - done) * avg) / 60000) : null };
      pub(false);
    };
    setInterval(() => { if (running !== wasRunning) { wasRunning = running; pub(true); } else if (running) pub(false); }, 15000);
  }
})();

